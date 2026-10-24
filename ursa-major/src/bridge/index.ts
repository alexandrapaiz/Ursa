// The bridge (plan §16.2): the only part of the overlay that sees raw
// text. Runs on the owner's Mac as `ursa bridge <project>`, launched
// by her and by nothing else; it stays resident while she has it open
// and exits when she closes it. It is not a daemon.
//
// Each tick: tail the project's Claude Code session JSONL → parse →
// read the stated verdict (§16.3, only when the prompt count changed,
// so `claude -p` runs once per new user message, not once per tick) →
// write that verdict into the project's records as their declaration
// (`./declare.ts`, S0's "writes records with it") → assemble the
// overlay payload → encrypt with the owner's key → push ciphertext to
// the sync route.
//
// The local channel is an HTTP listener on 127.0.0.1 (plan §16.2
// sketched a WebSocket; plain HTTP on localhost does the same job with
// zero dependencies, and pages served over https may call it because
// browsers exempt loopback from mixed-content blocking). It serves
// `.ursa/` in the clear to loopback and to the page's own origin —
// `GET /payload`, `GET /records`, `GET /records/<id>` — and takes the
// run request on `POST /run`.

import { execFile } from 'node:child_process'
import { createServer } from 'node:http'
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { homedir } from 'node:os'
import { basename, join } from 'node:path'
import { parseClaudeSession } from '../parse'
import { readVerdict, NO_VERDICT, type Verdict, type VerdictRunner, claudeVerdictRunner } from '../verdict'
import { allowedOrigin, handleStoreRequest, listenOnLoopback, tuningUnits } from '../serve'
import { applyVerdict, NOTHING_APPLIED, type AppliedVerdict } from './declare'
import { deriveKeys, encryptJson, type DerivedKeys } from './crypto'
import {
  HEADER_BODY_SHA256,
  HEADER_WRITE_SECRET,
  sha256HexBytes,
} from '../../overlay/lib/write-capability'

export interface OverlayTuningLine {
  statement: string
  domain: string
  polarity: 'prefer' | 'avoid'
  basis: 'stated' | 'tacit' | 'mixed'
  evidenceCount: number
  /** true when the axiom contradicts another — tensions get their own color, never merged */
  tension: boolean
  status: 'active' | 'user-edited' | 'revoked'
}

export interface OverlayPayload {
  schemaVersion: '0.1.0'
  project: string
  sessionFile: string | null
  updatedAt: string
  userTurns: number
  verdict: Verdict
  tuning: OverlayTuningLine[]
  /** ids of the records now carrying this verdict as their declaration */
  declaredRecords: string[]
  lastRunSummary: string | null
}

/** Claude Code's project-dir munge: every non-alphanumeric becomes a dash. */
export function sessionDirFor(projectPath: string): string {
  return join(homedir(), '.claude', 'projects', projectPath.replace(/[^A-Za-z0-9]/g, '-'))
}

/** Newest .jsonl in the project's session dir; sessions roll, so re-resolved every tick. */
export function newestSessionFile(projectPath: string): string | null {
  const dir = sessionDirFor(projectPath)
  if (!existsSync(dir)) return null
  let best: { path: string; mtime: number } | null = null
  for (const name of readdirSync(dir)) {
    if (!name.endsWith('.jsonl')) continue
    const p = join(dir, name)
    const m = statSync(p).mtimeMs
    if (!best || m > best.mtime) best = { path: p, mtime: m }
  }
  return best?.path ?? null
}

/**
 * The tuning lines the overlay payload carries.
 *
 * Reads the store through `tuningUnits` in src/serve.ts rather than
 * opening `.ursa/tuning.json` here, so there is one reader of the
 * tuning store and not two that can disagree about what an axiom is.
 * What stays local to the overlay is the filter: a revoked axiom is a
 * tombstone the store keeps forever, and the payload is a live read of
 * what is steering the model right now, so revoked lines are dropped
 * here and served in full on `GET /tuning` for a surface that shows the
 * user their revocation held.
 */
export function tuningLines(projectPath: string): OverlayTuningLine[] {
  return tuningUnits(projectPath)
    .filter((a) => a.status !== 'revoked')
    .map((a) => ({
      statement: a.statement,
      domain: a.domain,
      polarity: a.polarity,
      basis: a.basis,
      evidenceCount: a.evidenceCount,
      tension: a.tension,
      status: a.status,
    }))
}

/** The port `ursa bridge` listens on when the caller names none. */
export const DEFAULT_BRIDGE_PORT = 7817

/**
 * Performs the launch the run channel was asked for, and resolves with the
 * summary line a page displays. Rejects when the launch failed, carrying
 * the message the page should be shown.
 *
 * WHY THIS IS AN INJECTED DEPENDENCY RATHER THAN A CALL IN THE HANDLER.
 * `startBridge` already takes its verdict reader (`runner`) and its log
 * sink (`log`) from the caller, for the same reason: both reach outside the
 * process, and a test of the run channel is not a test of either. The run
 * channel's own subject is who may cause an effect, and until now asserting
 * that meant really spawning `npx tsx src/bin/ursa.ts run`. Measured on
 * 2026-10-24, the three tests that take the allow branch cost 7.48s, 5.64s
 * and 5.07s against vitest's 5s default timeout, so they were over budget
 * on an idle machine and failed outright under parallel load. The spawn was
 * never what they asserted: `logs` is written before the launch starts.
 */
export type Launcher = (projectPath: string) => Promise<string>

/**
 * The real launcher: `ursa run <project>` as a child process.
 *
 * It is a subprocess and not an in-process call to `main(['run', path])`
 * because a launch that throws, exhausts memory, or runs for ten minutes
 * must not take the bridge down with it; the bridge is the thing holding
 * the user's page open. The 600s timeout and the 16MB buffer are that
 * containment, and they are the values this function existed with before
 * it had a name.
 */
export const npxLauncher: Launcher = (projectPath) => new Promise<string>((resolve, reject) => {
  execFile(
    'npx', ['tsx', join(import.meta.dirname, '..', 'bin', 'ursa.ts'), 'run', projectPath],
    { cwd: join(import.meta.dirname, '..', '..'), timeout: 600_000, maxBuffer: 16 * 1024 * 1024 },
    (err, stdout, stderr) => {
      if (err) reject(new Error(stderr || err.message))
      else resolve(stdout.trim())
    },
  )
})

export interface BridgeOptions {
  projectPath: string
  passphrase: string
  syncUrl: string
  session?: string
  intervalMs?: number
  /** 0 asks the OS for a free port, which is what the tests want */
  port?: number
  /** origins allowed to POST /run; loopback dev origins are always allowed */
  allowOrigins?: string[]
  runner?: VerdictRunner
  /** what POST /run actually launches; defaults to `npxLauncher` above */
  launch?: Launcher
  log?: (line: string) => void
}

export interface BridgeHandle {
  /** the port actually bound, which is the only useful answer when port 0 was asked for */
  readonly port: number
  /** `http://127.0.0.1:<port>`, the base a page fetches against */
  readonly url: string
  stop(): Promise<void>
  /** one tick, exposed for tests and for --once */
  tick(): Promise<OverlayPayload | null>
}

export async function startBridge(opts: BridgeOptions): Promise<BridgeHandle> {
  const log = opts.log ?? ((l: string) => console.log(l))
  const intervalMs = opts.intervalMs ?? 5_000
  const port = opts.port ?? DEFAULT_BRIDGE_PORT
  const runner = opts.runner ?? claudeVerdictRunner
  const launch = opts.launch ?? npxLauncher
  const keys: DerivedKeys = await deriveKeys(opts.passphrase)
  const project = basename(opts.projectPath)

  let lastUserTurns = -1
  let verdict: Verdict = NO_VERDICT
  let applied: AppliedVerdict = NOTHING_APPLIED
  let lastRunSummary: string | null = null
  let lastPayload: OverlayPayload | null = null
  let lastPushedHash = ''
  let running = false

  // The write secret is the bridge's proof that this blob is its own to
  // replace, and the body digest is plan §16.4's integrity half. Both go
  // out as headers rather than in the URL: the path is already logged by
  // every hop, and the write secret is the one derived value that must
  // not be.
  async function push(payload: OverlayPayload): Promise<void> {
    const blob = await encryptJson(keys, payload)
    const res = await fetch(`${opts.syncUrl}/api/sync/${keys.blobId}`, {
      method: 'PUT',
      headers: {
        'content-type': 'application/octet-stream',
        [HEADER_WRITE_SECRET]: keys.writeSecret,
        [HEADER_BODY_SHA256]: await sha256HexBytes(blob),
      },
      body: new Blob([blob.buffer as ArrayBuffer]),
    })
    if (res.status === 403) {
      throw new Error(
        'sync push refused: the write secret does not name this blob. The sync '
        + 'server is running an older derivation than this bridge, or the other '
        + 'way round. Redeploy the overlay so both are on ursa-overlay-v2.',
      )
    }
    if (!res.ok) throw new Error(`sync push failed: ${res.status} ${await res.text()}`)
  }

  async function tick(): Promise<OverlayPayload | null> {
    const sessionFile = opts.session ?? newestSessionFile(opts.projectPath)
    let userTurns = 0
    if (sessionFile && existsSync(sessionFile)) {
      const parsed = parseClaudeSession(readFileSync(sessionFile, 'utf8'), basename(sessionFile, '.jsonl'))
      const prompts = parsed.conversation.prompts ?? []
      userTurns = prompts.length
      if (userTurns !== lastUserTurns) {
        lastUserTurns = userTurns
        try {
          verdict = readVerdict(prompts, runner)
          log(verdict.accepted === null
            ? `verdict: no verdict yet (${userTurns} prompts read)`
            : `verdict: reads as ${verdict.accepted ? 'satisfied' : 'unsatisfied'} at step ${verdict.step} — "${verdict.quote}"`)
          applied = applyVerdict(opts.projectPath, verdict)
          if (applied.declared.length > 0) {
            log(`declared: ${applied.declared.length} record${applied.declared.length === 1 ? '' : 's'} now carry it${applied.changed.length ? ` (${applied.changed.length} rewritten)` : ' (already on disk)'}`)
          }
        } catch (e) {
          log(`verdict reader failed, keeping last reading: ${(e as Error).message}`)
        }
      }
    }
    const payload: OverlayPayload = {
      schemaVersion: '0.1.0',
      project,
      sessionFile: sessionFile ? basename(sessionFile) : null,
      updatedAt: new Date().toISOString(),
      userTurns,
      verdict,
      tuning: tuningLines(opts.projectPath),
      declaredRecords: applied.declared,
      lastRunSummary,
    }
    lastPayload = payload
    // push only when something changed; the payload minus the clock
    const hash = JSON.stringify({ ...payload, updatedAt: '' })
    if (hash !== lastPushedHash) {
      await push(payload)
      lastPushedHash = hash
      log(`synced → ${keys.blobId.slice(0, 8)}… (${payload.tuning.length} tuning lines, ${userTurns} prompts)`)
    }
    return payload
  }

  // The run channel: POST /run executes `ursa run <project>` and the
  // summary rides back both in the response and in the next sync.
  // The allowlist gates the execution, not just the response headers.
  // CORS only hides a reply from the caller, and POST with no custom
  // header is a simple request, so a browser sends it with no preflight
  // and the side effect lands before anything is hidden. A request with
  // no Origin at all is a non-browser client (the CLI, curl, a test):
  // no page can suppress that header, so it is not a forgery vector and
  // stays allowed. An opaque origin arrives as the literal "null" and is
  // matched by neither rule, so it is refused with every other stranger.
  // The same rule the store server applies (`allowedOrigin` in
  // src/serve.ts), called rather than restated: both doors serve the
  // same records and an allowlist that differs between them is a
  // difference nobody would notice until it mattered.
  const allowed = (origin: string | undefined): string | null =>
    allowedOrigin(origin, opts.allowOrigins ?? [])
  /** true when the request may cause an effect: same-origin, allowlisted, or not from a browser. */
  const mayAct = (req: { headers: { origin?: string | string[] } }): boolean => {
    const raw = req.headers.origin
    const origin = Array.isArray(raw) ? raw[0] : raw
    if (origin === undefined) return true
    return allowed(origin) !== null
  }
  const server = createServer((req, res) => {
    const origin = allowed(req.headers.origin as string | undefined)
    const cors: Record<string, string> = origin
      ? { 'access-control-allow-origin': origin, 'access-control-allow-methods': 'GET, POST, OPTIONS' }
      : {}
    if (req.method === 'OPTIONS') { res.writeHead(204, cors); res.end(); return }
    if (req.method === 'POST' && req.url === '/run') {
      if (!mayAct(req)) {
        log(`refused a run from a disallowed origin: ${String(req.headers.origin)}`)
        res.writeHead(403, cors); res.end('origin not allowed'); return
      }
      if (running) { res.writeHead(409, cors); res.end('a run is already in progress'); return }
      running = true
      log('run requested from the page')
      const settle = (status: number, summary: string) => {
        running = false
        lastRunSummary = summary
        lastPushedHash = '' // force a sync with the fresh summary
        res.writeHead(status, { ...cors, 'content-type': 'application/json' })
        res.end(JSON.stringify({ summary }))
      }
      void launch(opts.projectPath).then(
        (summary) => {
          // A run writes records that start out undeclared, so the
          // verdict already read has to reach the new ones too. This
          // happens before the reply, so a page that re-reads the store
          // the moment it is answered sees the declaration.
          if (verdict.accepted !== null) {
            applied = applyVerdict(opts.projectPath, verdict)
            log(`declared: ${applied.declared.length} record(s) after the run`)
          }
          settle(200, summary)
        },
        (e: Error) => settle(500, `run failed: ${e.message}`),
      )
      return
    }
    // `.ursa/` over the local channel, in the clear: this is the owner's
    // own machine talking to the owner's own page. Nothing here crosses
    // the network, and the sync route only ever sees the ciphertext.
    const sendJson = (code: number, body: unknown) => {
      res.writeHead(code, { ...cors, 'content-type': 'application/json' })
      res.end(JSON.stringify(body))
    }
    if (req.method === 'GET' && req.url === '/payload') {
      if (!lastPayload) { sendJson(503, { error: 'no tick has completed yet' }); return }
      sendJson(200, lastPayload)
      return
    }
    // Everything else that reads `.ursa/` is the store server's route
    // table (`handleStoreRequest` in src/serve.ts): `/records`,
    // `/records/<id>`, `/tuning`, `/store`, `/health`. The bridge used to
    // carry its own copies of the first two and the last, and the
    // dashboard could not be served without a passphrase and a sync
    // deployment because of it. Delegating means a page can open against
    // `ursa serve` or against `ursa bridge` and read the same shapes from
    // the same reader.
    const store = handleStoreRequest(opts.projectPath, req.method, req.url)
    if (store) { sendJson(store.status, store.body); return }
    res.writeHead(404, cors); res.end()
  })
  // Shared with `ursa serve` (`listenOnLoopback` in src/serve.ts) rather
  // than wrapped here, because the version written here passed no `error`
  // handler and so hung instead of failing when the port was taken.
  const bound = await listenOnLoopback(server, port, 'the bridge')
  log(`bridge up: watching ${project}, run channel on 127.0.0.1:${bound}, blob ${keys.blobId.slice(0, 8)}…`)

  await tick().catch((e) => log(`first tick failed: ${(e as Error).message}`))
  const timer = setInterval(() => { void tick().catch((e) => log(`tick failed: ${(e as Error).message}`)) }, intervalMs)

  return {
    port: bound,
    url: `http://127.0.0.1:${bound}`,
    tick,
    stop: () => new Promise((r) => { clearInterval(timer); server.close(() => r()) }),
  }
}
