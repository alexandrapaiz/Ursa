// The local store server: `ursa serve <project>`.
//
// WHY THIS EXISTS SEPARATELY FROM THE BRIDGE. `src/bridge/index.ts`
// already serves `.ursa/` over loopback, and that is where the three
// store routes below were born. But the bridge serves them as a side
// effect of being the bridge: `startBridge` derives a key from a
// passphrase it prompts for, pushes ciphertext to a Vercel deployment,
// shells out to `claude -p` to read a verdict, and ticks every five
// seconds. A page that only wants to read the records this project
// already has cannot get them without all four. That is the gap the
// dashboard fell into: with no way to serve a real store, a dashboard
// has to be written against a mock, and a mock is the one thing that
// cannot prove the chain works.
//
// So the store routes move here, and the bridge calls into them
// (`handleStoreRequest` below) instead of carrying its own copies. One
// route table, one reader of `.ursa/`, two doors onto it. If the shapes
// drift, they drift together, which is the whole point of the board
// item this file answers: the resolver and the dashboard share one real
// store rather than two that look alike.
//
// WHAT IT IS NOT. Not a daemon, for the same reason the bridge is not
// one: nothing starts it but the user, and it dies with the terminal
// that ran it. Not a writer, either. Every route is a GET and the
// server never calls `saveRecord`. The resolver writes the store; this
// serves what the resolver wrote. A page that wants a run asks the
// bridge, which has the run channel, because executing a launch on
// request is an effect and effects belong behind the door that already
// reasons about who may cause them.

import { createServer, type Server } from 'node:http'
import { existsSync, readFileSync, statSync } from 'node:fs'
import { basename, join } from 'node:path'
import { listRecordIds, loadEpisodes, loadRecord, ursaDir } from './store'
import type { OutcomeRecord, ResolverIdentity, SpanClass } from './types'
import type { TuningRecord } from './tuning/types'

/** Where the store lives inside a project, as the API reports it. */
export const STORE_DIR_NAME = '.ursa'

/** The port `ursa serve` listens on when the caller names none. */
export const DEFAULT_SERVE_PORT = 7818

/**
 * Bind an HTTP server to loopback and resolve with the port it actually
 * got. Rejects, rather than hanging, when the port cannot be bound.
 *
 * WHY THIS IS SHARED RATHER THAN WRITTEN AT EACH DOOR. The header of this
 * file says the store routes live in one place so that the two doors onto
 * `.ursa/` drift together instead of apart. Listening is the same kind of
 * behaviour and it had already drifted. `startStoreServer` below passed an
 * `error` listener to its listen call; `startBridge` in src/bridge/index.ts
 * passed none, and wrapped the call in `new Promise((r) => server.listen(
 * port, '127.0.0.1', r))`. Node reports a refused bind by emitting `error`
 * on the server and never calling the listening callback, so on a taken
 * port that promise had nothing to settle it: `ursa bridge` hung with no
 * message, before the line that announces the port it was trying to use.
 * One function means a third door cannot reintroduce either half.
 *
 * WHY THE RESOLVED PORT AND NOT THE REQUESTED ONE IS THE ANSWER. Port 0
 * asks the kernel for any free port, so the caller learns which one it got
 * from `server.address()` and nowhere else. Tests want exactly that: a
 * hardcoded port makes two test files that both bind it unrunnable at the
 * same time, which is what this helper was extracted to fix.
 *
 * @param server a server that has not been listened on yet
 * @param port the requested port, or 0 to let the kernel choose
 * @param what how the door names itself in an error a user has to act on
 * @returns the port the server is accepting connections on
 */
export async function listenOnLoopback(server: Server, port: number, what: string): Promise<number> {
  await new Promise<void>((resolve, reject) => {
    const onError = (e: NodeJS.ErrnoException) => {
      // EADDRINUSE is the one failure a user can do something about, and
      // the raw node message names the address without naming the fix or
      // the program that wanted it. Every other errno passes through
      // unchanged, because inventing advice for an unknown cause is worse
      // than the errno.
      reject(e.code === 'EADDRINUSE'
        ? new Error(
          `${what} cannot start: 127.0.0.1:${port} is already in use. `
          + `Another ${what} is probably still running. Stop it, or pass `
          + `--port <number> to bind a different one.`)
        : e)
    }
    server.once('error', onError)
    server.listen(port, '127.0.0.1', () => { server.removeListener('error', onError); resolve() })
  })
  const address = server.address()
  return typeof address === 'object' && address ? address.port : port
}

/**
 * One tuning axiom as a reader of the store sees it.
 *
 * WHY REVOKED AXIOMS ARE IN THIS SHAPE AT ALL. The tuning store keeps a
 * revoked axiom as a tombstone rather than deleting it
 * (`TuningAxiom.status` in src/tuning/types.ts, and the privacy
 * invariant above it: revocation survives re-distills). A surface that
 * cannot see the tombstone cannot show the user that their revocation
 * held, so it would have to take that on faith. The store server
 * therefore serves every axiom with its status, and each door decides
 * what to render: the overlay payload drops revoked lines because it is
 * a live read of what is steering the model right now, and a dashboard
 * that offers revocation shows them, because the tombstone is the
 * receipt.
 */
export interface TuningUnit {
  id: string
  statement: string
  domain: string
  polarity: 'prefer' | 'avoid'
  basis: 'stated' | 'tacit' | 'mixed'
  evidenceCount: number
  /** true when this axiom contradicts another: a tension is surfaced, never averaged */
  tension: boolean
  contradicts: string[]
  status: 'active' | 'user-edited' | 'revoked'
  firstSeen: string
  lastSeen: string
}

/**
 * One record as an index entry: enough to draw a row and a survival bar
 * without fetching the record itself, and nothing more.
 *
 * WHY THE FIGURES ARE COPIED OUT RATHER THAN THE WHOLE RECORD SERVED.
 * A record carries every generation and every span, which is tens of
 * kilobytes each; `fixtures/real/ursa-main-4d5e401.json` is larger than
 * this whole file. An index that inlined them would make the first
 * paint of a store with fifty records a multi-megabyte fetch to render
 * fifty rows. The record itself is one more request away at
 * `/records/<id>`, which is where a surface that actually opens a
 * record should get it.
 */
export interface RecordSummary {
  id: string
  /** `artifact.kind`: which capture path produced this record */
  artifactKind: string
  generatedAt: string
  finished: boolean
  /**
   * `signals.episode.accepted`. null means undeclared, which is a claim
   * and not a gap: acceptance is never inferred from retention (vision
   * §0b), so a record nobody declared on says null forever.
   */
  accepted: boolean | null
  finalChars: number
  coveredChars: number
  /**
   * Final-file characters per span class, the three classes exactly as
   * `stats.byClass` keys them. A bar drawn from these is the survival
   * bar; `coveredChars` is its denominator and `finalChars` is the
   * width of the whole finished work, including what no span covered.
   */
  charsByClass: Record<SpanClass, number>
  /**
   * `stats.generated.humanDeletedChars`: generated characters the human
   * had in front of them and did not keep. The correction signal, and
   * the only deletion figure safe to read as a discard rate (see the
   * field's own note in src/types.ts).
   */
  humanDeletedChars: number
  /** true when the tuning layer has already distilled this record (`.ursa/episodes.json`) */
  distilled: boolean
  /**
   * `task.resolvedBy`, passed through whole rather than flattened to a
   * string. The union's two arms carry different facts (a commit plus
   * whether its tree was dirty, or a bundle digest), and a surface that
   * shows a resolver has to show which kind it is looking at. null is
   * the record's own absent, which says no resolver could be identified
   * and is never a placeholder for "some resolver".
   */
  resolvedBy: ResolverIdentity | null
}

/**
 * Everything a dashboard needs for its first paint, in one fetch.
 *
 * WHY ONE PAYLOAD AND NOT THREE FETCHES. The surface that opens on this
 * has to render the tuning list and the record list together or it
 * renders a layout that jumps. Three round trips to loopback are cheap,
 * but they are also three chances to show a half-loaded store, and the
 * store is a single consistent thing on disk at the moment it is read.
 * `readAt` stamps that moment.
 */
export interface StorePayload {
  schemaVersion: '0.1.0'
  /** the project directory's base name, never its path: see the note on `storeExists` */
  project: string
  /**
   * Where the store sits inside the project, relative, always `.ursa`.
   *
   * WHY NO ABSOLUTE PATH CROSSES THIS BOUNDARY. The bridge's allowlist
   * lets a deployed page (`https://ursa-overlay.vercel.app`) read these
   * routes, so anything in a response can end up in a hosted origin's
   * JavaScript. An absolute store path is the user's home directory,
   * which carries their machine identity and is exactly the string the
   * redaction rider in prompts/engineer-agent.md exists to keep out of
   * artifacts. The project's base name is enough to title a window, and
   * the caller already knows which project it launched.
   */
  store: string
  /** false when this project has never been resolved: an honest empty, not an error */
  storeExists: boolean
  readAt: string
  recordCount: number
  records: RecordSummary[]
  tuning: TuningUnit[]
}

/** A reply from the route table, ready for whichever server is hosting it. */
export interface StoreReply {
  status: number
  body: unknown
}

/**
 * Every axiom in the project's tuning store, tensions marked, strongest
 * evidence first, revoked tombstones included.
 *
 * Returns an empty array when the project has no `tuning.json`, which
 * is every project that has not been distilled yet.
 */
export function tuningUnits(projectPath: string): TuningUnit[] {
  const path = join(ursaDir(projectPath), 'tuning.json')
  if (!existsSync(path)) return []
  const record = JSON.parse(readFileSync(path, 'utf8')) as TuningRecord
  return record.axioms
    .map((a) => ({
      id: a.id,
      statement: a.statement,
      domain: a.domain,
      polarity: a.polarity,
      basis: a.basis,
      evidenceCount: a.evidenceCount,
      tension: a.contradicts.length > 0,
      contradicts: a.contradicts,
      status: a.status,
      firstSeen: a.firstSeen,
      lastSeen: a.lastSeen,
    }))
    .sort((a, b) => b.evidenceCount - a.evidenceCount)
}

/** One record reduced to its index row. */
export function recordSummary(record: OutcomeRecord, distilled: boolean): RecordSummary {
  const byClass = record.stats.byClass
  return {
    id: record.task.id,
    artifactKind: record.artifact.kind,
    generatedAt: record.task.generatedAt,
    finished: record.task.finished,
    accepted: record.signals?.episode.accepted ?? null,
    finalChars: record.stats.finalChars,
    coveredChars: record.stats.coveredChars,
    charsByClass: {
      survived_verbatim: byClass.survived_verbatim?.chars ?? 0,
      survived_mutated: byClass.survived_mutated?.chars ?? 0,
      no_generation_provenance: byClass.no_generation_provenance?.chars ?? 0,
    },
    humanDeletedChars: record.stats.generated.humanDeletedChars,
    distilled,
    resolvedBy: record.task.resolvedBy ?? null,
  }
}

/**
 * Read the whole store off disk, now.
 *
 * WHY NOTHING IS CACHED. A resolver run while this server is up writes
 * new files into `.ursa/records/` and the next read must see them, or
 * "the resolver and the dashboard share one real store" is false in the
 * only case that matters: the user ran `ursa run` and wants to see what
 * it produced. A store of fifty records is fifty small JSON reads off a
 * local disk, which is far below the cost of a cache that can be wrong.
 */
export function storePayload(projectPath: string): StorePayload {
  const dir = ursaDir(projectPath)
  const exists = existsSync(dir)
  const ids = listRecordIds(projectPath)
  const distilledIds = new Set(loadEpisodes(projectPath).filter((e) => e.distilled).map((e) => e.id))
  const records: RecordSummary[] = []
  for (const id of ids) {
    const record = loadRecord(projectPath, id)
    // A file that vanished or will not parse between the listing and the
    // read is skipped rather than failing the whole payload: one bad
    // record must not blank a dashboard that has forty good ones. The
    // count below is the count served, so the omission is visible as a
    // number rather than hidden behind a stale total.
    if (record) records.push(recordSummary(record, distilledIds.has(id)))
  }
  return {
    schemaVersion: '0.1.0',
    project: basename(projectPath),
    store: STORE_DIR_NAME,
    storeExists: exists,
    readAt: new Date().toISOString(),
    recordCount: records.length,
    records,
    tuning: tuningUnits(projectPath),
  }
}

/**
 * The store's route table, shared by `ursa serve` and `ursa bridge`.
 *
 * Returns null when the route is not one of the store's, so a host with
 * routes of its own (the bridge has `/payload` and `POST /run`) can fall
 * through to them. Null is "not mine", never "not found".
 */
export function handleStoreRequest(
  projectPath: string,
  method: string | undefined,
  url: string | undefined,
): StoreReply | null {
  if (method !== 'GET' || !url) return null
  const path = url.split('?')[0]
  if (path === '/health') {
    return {
      status: 200,
      body: {
        project: basename(projectPath),
        ok: true,
        store: STORE_DIR_NAME,
        storeExists: existsSync(ursaDir(projectPath)),
        recordCount: listRecordIds(projectPath).length,
      },
    }
  }
  if (path === '/store') {
    return { status: 200, body: storePayload(projectPath) }
  }
  if (path === '/records') {
    return { status: 200, body: { project: basename(projectPath), ids: listRecordIds(projectPath) } }
  }
  if (path === '/tuning') {
    return { status: 200, body: { project: basename(projectPath), units: tuningUnits(projectPath) } }
  }
  if (path.startsWith('/records/')) {
    const id = decodeURIComponent(path.slice('/records/'.length))
    const record = loadRecord(projectPath, id)
    // `loadRecord` refuses an id outside SAFE_RECORD_ID rather than
    // joining it onto a path, so a traversal attempt reads as 404 and
    // never as a file outside `.ursa/records/`.
    if (!record) return { status: 404, body: { error: `no record ${id}` } }
    return { status: 200, body: record }
  }
  return null
}

/**
 * Origins allowed to read these routes.
 *
 * Loopback is always allowed because the server is on loopback: a page
 * served from `http://localhost:3000` during development is the same
 * machine talking to itself. Anything else has to be named by the
 * caller, which is how the deployed overlay origin gets in.
 *
 * An opaque origin arrives as the literal string "null" and is matched
 * by neither branch, so it is refused with every other stranger. A
 * request with no Origin header at all is a non-browser client (curl,
 * the test suite, another CLI) and gets no CORS headers, which it does
 * not need and cannot be denied by.
 */
const LOOPBACK_ORIGIN = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/

export function allowedOrigin(origin: string | undefined, extra: readonly string[] = []): string | null {
  if (!origin) return null
  if (LOOPBACK_ORIGIN.test(origin) || extra.includes(origin)) return origin
  return null
}

export interface StoreServerOptions {
  projectPath: string
  /** 0 asks the OS for a free port, which is what the tests want */
  port?: number
  /** origins beyond loopback that may read these routes */
  allowOrigins?: string[]
  log?: (line: string) => void
}

export interface StoreServerHandle {
  /** the port actually bound, which is the only useful answer when port 0 was asked for */
  readonly port: number
  /** `http://127.0.0.1:<port>`, the base a page fetches against */
  readonly url: string
  stop(): Promise<void>
}

/** Start the store server on loopback. Resolves once it is accepting connections. */
export async function startStoreServer(opts: StoreServerOptions): Promise<StoreServerHandle> {
  const log = opts.log ?? ((l: string) => console.log(l))
  const projectPath = opts.projectPath
  const server = createServer((req, res) => {
    const origin = allowedOrigin(req.headers.origin as string | undefined, opts.allowOrigins ?? [])
    const cors: Record<string, string> = origin
      ? { 'access-control-allow-origin': origin, 'access-control-allow-methods': 'GET, OPTIONS' }
      : {}
    if (req.method === 'OPTIONS') { res.writeHead(204, cors); res.end(); return }
    const reply = handleStoreRequest(projectPath, req.method, req.url)
    if (reply) {
      res.writeHead(reply.status, { ...cors, 'content-type': 'application/json' })
      res.end(JSON.stringify(reply.body))
      return
    }
    // The discovery document, so that a developer who opens the root
    // sees the contract instead of a blank 404 and has to read this file
    // to learn the paths.
    if (req.method === 'GET' && (req.url === '/' || req.url?.split('?')[0] === '/')) {
      res.writeHead(200, { ...cors, 'content-type': 'application/json' })
      res.end(JSON.stringify({
        server: 'ursa-store',
        project: basename(projectPath),
        store: STORE_DIR_NAME,
        routes: ['/health', '/store', '/records', '/records/<id>', '/tuning'],
      }))
      return
    }
    res.writeHead(404, { ...cors, 'content-type': 'application/json' })
    res.end(JSON.stringify({ error: `no route ${req.method} ${req.url}` }))
  })
  const port = opts.port ?? DEFAULT_SERVE_PORT
  const bound = await listenOnLoopback(server, port, 'the store server')
  const dir = ursaDir(projectPath)
  // Said at startup because a store that does not exist yet is the most
  // likely reason a surface opens empty, and the user should learn that
  // from the server rather than from an empty page.
  const state = existsSync(dir) && statSync(dir).isDirectory()
    ? `${listRecordIds(projectPath).length} record(s) in ${STORE_DIR_NAME}/`
    : `no ${STORE_DIR_NAME}/ yet: run \`ursa run ${projectPath}\` and reload, nothing here is cached`
  log(`store server up: ${basename(projectPath)} on http://127.0.0.1:${bound} — ${state}`)
  return {
    port: bound,
    url: `http://127.0.0.1:${bound}`,
    stop: () => new Promise((resolve) => { server.close(() => resolve()) }),
  }
}
