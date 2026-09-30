// The bridge (plan §16.2): the only part of the overlay that sees raw
// text. Runs on the owner's Mac as `ursa bridge <project>`, launched
// by her and by nothing else; it stays resident while she has it open
// and exits when she closes it. It is not a daemon.
//
// Each tick: tail the project's Claude Code session JSONL → parse →
// read the stated verdict (§16.3, only when the prompt count changed,
// so `claude -p` runs once per new user message, not once per tick) →
// assemble the overlay payload → encrypt with the owner's key →
// push ciphertext to the sync route. The run channel is a local HTTP
// listener on 127.0.0.1 (plan §16.2 sketched a WebSocket; plain HTTP
// on localhost does the same job with zero dependencies, and pages
// served over https may call it because browsers exempt loopback from
// mixed-content blocking).

import { execFile } from 'node:child_process'
import { createServer } from 'node:http'
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { homedir } from 'node:os'
import { basename, join } from 'node:path'
import { parseClaudeSession } from '../parse'
import { readVerdict, NO_VERDICT, type Verdict, type VerdictRunner, claudeVerdictRunner } from '../verdict'
import type { TuningRecord } from '../tuning/types'
import { deriveKeys, encryptJson, type DerivedKeys } from './crypto'

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

export function tuningLines(projectPath: string): OverlayTuningLine[] {
  const p = join(projectPath, '.ursa', 'tuning.json')
  if (!existsSync(p)) return []
  const record = JSON.parse(readFileSync(p, 'utf8')) as TuningRecord
  return record.axioms
    .filter((a) => a.status !== 'revoked')
    .map((a) => ({
      statement: a.statement,
      domain: a.domain,
      polarity: a.polarity,
      basis: a.basis,
      evidenceCount: a.evidenceCount,
      tension: a.contradicts.length > 0,
      status: a.status,
    }))
    .sort((a, b) => b.evidenceCount - a.evidenceCount)
}

export interface BridgeOptions {
  projectPath: string
  passphrase: string
  syncUrl: string
  session?: string
  intervalMs?: number
  port?: number
  /** origins allowed to POST /run; loopback dev origins are always allowed */
  allowOrigins?: string[]
  runner?: VerdictRunner
  log?: (line: string) => void
}

export interface BridgeHandle {
  stop(): Promise<void>
  /** one tick, exposed for tests and for --once */
  tick(): Promise<OverlayPayload | null>
}

export async function startBridge(opts: BridgeOptions): Promise<BridgeHandle> {
  const log = opts.log ?? ((l: string) => console.log(l))
  const intervalMs = opts.intervalMs ?? 5_000
  const port = opts.port ?? 7817
  const runner = opts.runner ?? claudeVerdictRunner
  const keys: DerivedKeys = await deriveKeys(opts.passphrase)
  const project = basename(opts.projectPath)

  let lastUserTurns = -1
  let verdict: Verdict = NO_VERDICT
  let lastRunSummary: string | null = null
  let lastPushedHash = ''
  let running = false

  async function push(payload: OverlayPayload): Promise<void> {
    const blob = await encryptJson(keys, payload)
    const res = await fetch(`${opts.syncUrl}/api/sync/${keys.blobId}`, {
      method: 'PUT',
      headers: { 'content-type': 'application/octet-stream' },
      body: new Blob([blob.buffer as ArrayBuffer]),
    })
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
      lastRunSummary,
    }
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
  const loopback = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/
  const allowed = (origin: string | undefined): string | null => {
    if (!origin) return null
    if (loopback.test(origin) || (opts.allowOrigins ?? []).includes(origin)) return origin
    return null
  }
  const server = createServer((req, res) => {
    const origin = allowed(req.headers.origin as string | undefined)
    const cors: Record<string, string> = origin
      ? { 'access-control-allow-origin': origin, 'access-control-allow-methods': 'POST, OPTIONS' }
      : {}
    if (req.method === 'OPTIONS') { res.writeHead(204, cors); res.end(); return }
    if (req.method === 'POST' && req.url === '/run') {
      if (running) { res.writeHead(409, cors); res.end('a run is already in progress'); return }
      running = true
      log('run requested from the page')
      execFile('npx', ['tsx', join(import.meta.dirname, '..', 'bin', 'ursa.ts'), 'run', opts.projectPath],
        { cwd: join(import.meta.dirname, '..', '..'), timeout: 600_000, maxBuffer: 16 * 1024 * 1024 },
        (err, stdout, stderr) => {
          running = false
          lastRunSummary = err ? `run failed: ${stderr || err.message}` : stdout.trim()
          lastPushedHash = '' // force a sync with the fresh summary
          res.writeHead(err ? 500 : 200, { ...cors, 'content-type': 'application/json' })
          res.end(JSON.stringify({ summary: lastRunSummary }))
        })
      return
    }
    if (req.method === 'GET' && req.url === '/health') {
      res.writeHead(200, { ...cors, 'content-type': 'application/json' })
      res.end(JSON.stringify({ project, ok: true }))
      return
    }
    res.writeHead(404, cors); res.end()
  })
  await new Promise<void>((r) => server.listen(port, '127.0.0.1', r))
  log(`bridge up: watching ${project}, run channel on 127.0.0.1:${port}, blob ${keys.blobId.slice(0, 8)}…`)

  await tick().catch((e) => log(`first tick failed: ${(e as Error).message}`))
  const timer = setInterval(() => { void tick().catch((e) => log(`tick failed: ${(e as Error).message}`)) }, intervalMs)

  return {
    tick,
    stop: () => new Promise((r) => { clearInterval(timer); server.close(() => r()) }),
  }
}
