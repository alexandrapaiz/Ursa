// One bridge tick, end to end, with only the two things that cannot
// run in CI stubbed: the `claude -p` verdict runner (a subscription
// call on the owner's machine) and the sync route (a Vercel
// deployment). Everything between them is the real code path — the
// real session parser, the real verdict verification against the
// trace, the real record writer, the real local channel.

import { execFileSync } from 'node:child_process'
import { createServer } from 'node:http'
import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { main } from '../bin/ursa'
import { listRecordIds } from '../store'
import { startBridge, type BridgeHandle } from './index'

const PORT = 7831
const SYNC_PORT = 7832

function sh(cwd: string, cmd: string, args: string[]) {
  execFileSync(cmd, args, { cwd, env: process.env, encoding: 'utf8' })
}

/** A Claude Code session log: two prompts, the second carrying the verdict. */
function sessionLog(): string {
  const at = '2026-09-26T15:00:00.000Z'
  return [
    JSON.stringify({ type: 'user', timestamp: at, message: { content: 'tighten the digest prose' } }),
    JSON.stringify({ type: 'assistant', uuid: 'a1', timestamp: at, message: { model: 'claude-opus-5', content: [] } }),
    JSON.stringify({ type: 'user', timestamp: at, message: { content: 'yesss finallyyy!! lol' } }),
  ].join('\n') + '\n'
}

async function projectWithRecords(): Promise<string> {
  const dir = mkdtempSync(join(tmpdir(), 'ursa-bridge-'))
  sh(dir, 'git', ['init', '-q', '-b', 'main'])
  sh(dir, 'git', ['config', 'user.email', 'human@example.com'])
  sh(dir, 'git', ['config', 'user.name', 'Human Owner'])
  // over the 200-char floor `ursa run` applies, or no record is written
  const gen = [
    'export function digest() {',
    '  const items = fetchItems()',
    "  const summary = items.map(formatItem).join('\\n')",
    "  return 'DIGEST — the latest research, summarized for you.\\n' + summary",
    '}',
    'function formatItem(i) { return `- ${i.title}: ${i.claim} — why it matters: ${i.why}` }',
  ].join('\n') + '\n'
  writeFileSync(join(dir, 'digest.js'), gen)
  sh(dir, 'git', ['add', '.'])
  sh(dir, 'git', ['commit', '-q', '-m', 'Generate digest module\n\nCo-Authored-By: Claude <noreply@anthropic.com>'])
  writeFileSync(join(dir, 'digest.js'), gen.replace('why it matters', 'so what'))
  sh(dir, 'git', ['add', '.'])
  sh(dir, 'git', ['commit', '-q', '-m', 'Tighten digest prose'])
  await main(['run', dir])
  return dir
}

/** Stands in for the Vercel sync route; records what the bridge pushed. */
function fakeSync() {
  const pushed: Uint8Array[] = []
  const server = createServer((req, res) => {
    const chunks: Buffer[] = []
    req.on('data', (c: Buffer) => chunks.push(c))
    req.on('end', () => { pushed.push(new Uint8Array(Buffer.concat(chunks))); res.writeHead(200); res.end('ok') })
  })
  return {
    pushed,
    url: `http://127.0.0.1:${SYNC_PORT}`,
    listen: () => new Promise<void>((r) => server.listen(SYNC_PORT, '127.0.0.1', r)),
    close: () => new Promise<void>((r) => { server.close(() => r()) }),
  }
}

let handle: BridgeHandle | null = null
let sync: ReturnType<typeof fakeSync> | null = null

afterEach(async () => {
  await handle?.stop()
  await sync?.close()
  handle = null
  sync = null
})

describe('the bridge, one tick', () => {
  it('reads the verdict, writes it into the record, and serves .ursa/ over the local channel', async () => {
    const project = await projectWithRecords()
    const sessionFile = join(project, 'session.jsonl')
    writeFileSync(sessionFile, sessionLog())
    sync = fakeSync()
    await sync.listen()

    handle = await startBridge({
      projectPath: project,
      passphrase: 'a-passphrase-held-in-memory-only',
      syncUrl: sync.url,
      session: sessionFile,
      port: PORT,
      intervalMs: 3_600_000, // the constructor's own first tick is the one under test
      runner: () => '{"accepted": true, "step": 1, "quote": "yesss finallyyy!! lol"}',
      log: () => {},
    })

    // the record on disk now carries the verdict the chat stated
    const id = listRecordIds(project)[0]
    const served = await fetch(`http://127.0.0.1:${PORT}/records/${id}`).then((r) => r.json())
    expect(served.signals.episode.accepted).toBe(true)
    expect(served.signals.episode.acceptanceStatedInChat).toBe(true)
    expect(served.signals.episode.acceptanceBasis).toContain('yesss finallyyy!! lol')

    // and the payload the page reads names it
    const payload = await fetch(`http://127.0.0.1:${PORT}/payload`).then((r) => r.json())
    expect(payload.verdict.accepted).toBe(true)
    expect(payload.verdict.quote).toBe('yesss finallyyy!! lol')
    expect(payload.declaredRecords).toEqual([id])
    expect(payload.userTurns).toBe(2)

    const index = await fetch(`http://127.0.0.1:${PORT}/records`).then((r) => r.json())
    expect(index.ids).toEqual([id])

    // the sync route saw ciphertext, never the record
    expect(sync.pushed.length).toBeGreaterThan(0)
    const blob = Buffer.from(sync.pushed[0]).toString('utf8')
    expect(blob).not.toContain('yesss finallyyy')
    expect(blob).not.toContain('acceptanceBasis')
  })

  it('a misread — a quote absent from the trace — leaves the record undeclared', async () => {
    const project = await projectWithRecords()
    const sessionFile = join(project, 'session.jsonl')
    writeFileSync(sessionFile, sessionLog())
    sync = fakeSync()
    await sync.listen()

    handle = await startBridge({
      projectPath: project,
      passphrase: 'a-passphrase-held-in-memory-only',
      syncUrl: sync.url,
      session: sessionFile,
      port: PORT,
      intervalMs: 3_600_000,
      runner: () => '{"accepted": true, "step": 1, "quote": "this is perfect, ship it"}',
      log: () => {},
    })

    const id = listRecordIds(project)[0]
    const served = await fetch(`http://127.0.0.1:${PORT}/records/${id}`).then((r) => r.json())
    expect(served.signals.episode.accepted).toBeNull()
    const payload = await fetch(`http://127.0.0.1:${PORT}/payload`).then((r) => r.json())
    expect(payload.declaredRecords).toEqual([])
  })

  it('refuses a record id that tries to walk out of .ursa/records', async () => {
    const project = await projectWithRecords()
    sync = fakeSync()
    await sync.listen()
    handle = await startBridge({
      projectPath: project,
      passphrase: 'a-passphrase-held-in-memory-only',
      syncUrl: sync.url,
      session: join(project, 'no-session.jsonl'),
      port: PORT,
      intervalMs: 3_600_000,
      runner: () => '{"accepted": null, "step": null, "quote": null}',
      log: () => {},
    })

    const res = await fetch(`http://127.0.0.1:${PORT}/records/${encodeURIComponent('../../../../etc/passwd')}`)
    expect(res.status).toBe(404)
  })
})
