// The run channel is a local HTTP listener that spawns `ursa run`. CORS
// cannot defend it: a cross-origin POST with no custom header is a
// simple request, so the browser sends it without a preflight and only
// hides the reply. The allowlist therefore has to gate the execution.
// These tests assert the side effect, not the status code, because the
// side effect is the thing an attacking page wants and does not need to
// read. (Found live on main by the 2026-09-27 run; that fix never
// merged, so it is re-asserted here with a test to hold it.)

import { describe, expect, it, afterEach } from 'vitest'
import { execFileSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { npxLauncher, startBridge, type BridgeHandle } from './index'

// Port 0, not a hardcoded port: this file and src/bridge/bridge.test.ts
// both used to bind 127.0.0.1:7831, and vitest runs test files in
// parallel, so whichever lost the race hung inside startBridge until the
// 5s timeout. The kernel hands out a free port instead and the handle
// reports which one.
const ALLOWED = 'https://ursa-overlay.vercel.app'

let handle: BridgeHandle | null = null
let logs: string[] = []
/** How many times the stub launcher was actually asked to launch. */
let launched: string[] = []

async function bridge() {
  const projectPath = mkdtempSync(join(tmpdir(), 'ursa-runchannel-'))
  mkdirSync(join(projectPath, '.ursa'), { recursive: true })
  writeFileSync(join(projectPath, '.ursa', 'tuning.json'), JSON.stringify({ axioms: [] }))
  logs = []
  launched = []
  handle = await startBridge({
    projectPath,
    passphrase: 'run-channel-test-passphrase',
    syncUrl: 'http://127.0.0.1:9', // unreachable on purpose; the tick only logs
    port: 0,
    intervalMs: 10 ** 9,
    allowOrigins: [ALLOWED],
    runner: () => '{"accepted":null,"step":null,"quote":null}',
    // Stubbed, so these tests cost milliseconds and assert only their own
    // subject. The real launcher has its own test at the bottom of this
    // file. See the `Launcher` doc comment in ./index for the measurement
    // that made this necessary: the three tests below that take the allow
    // branch used to wait on `npx tsx ... run` and cost 7.48s, 5.64s and
    // 5.07s against a 5s timeout.
    launch: async (projectPath) => { launched.push(projectPath); return 'resolved 1 episode, wrote 1 record' },
    log: (l) => logs.push(l),
  })
  return handle
}

/**
 * Did the channel launch a run? Two independent readings of it, because
 * the log line is written before the launcher is called and the launcher
 * records the path it was handed: a refusal has to fail both, and an
 * allow has to satisfy both.
 */
async function post(headers: Record<string, string>) {
  if (!handle) throw new Error('no bridge is running')
  const res = await fetch(`${handle.url}/run`, { method: 'POST', headers })
  return {
    status: res.status,
    acao: res.headers.get('access-control-allow-origin'),
    executed: logs.some((l) => l.includes('run requested from the page')),
    launches: launched.length,
    summary: res.headers.get('content-type')?.includes('json') ? await res.json() : null,
  }
}

afterEach(async () => { await handle?.stop(); handle = null })

describe('the bridge run channel', () => {
  it('does not spawn a run for an origin outside the allowlist', async () => {
    await bridge()
    const r = await post({ origin: 'https://not-ours.example' })
    expect(r.executed).toBe(false)
    expect(r.launches).toBe(0)
    expect(r.status).toBe(403)
    expect(r.acao).toBe(null)
  })

  it('does not spawn a run for an opaque origin', async () => {
    await bridge()
    // A sandboxed iframe, a data: URL or a file: page sends Origin: null.
    const r = await post({ origin: 'null' })
    expect(r.executed).toBe(false)
    expect(r.launches).toBe(0)
    expect(r.status).toBe(403)
  })

  it('accepts the allowlisted overlay origin', async () => {
    await bridge()
    const r = await post({ origin: ALLOWED })
    expect(r.executed).toBe(true)
    expect(r.launches).toBe(1)
    expect(r.acao).toBe(ALLOWED)
    expect(r.status).toBe(200)
    // The summary the launcher produced reaches the page that asked, which
    // the old spawning version of this test never checked.
    expect(r.summary).toEqual({ summary: 'resolved 1 episode, wrote 1 record' })
  })

  it('accepts a loopback dev origin', async () => {
    await bridge()
    const r = await post({ origin: 'http://localhost:3000' })
    expect(r.executed).toBe(true)
    expect(r.launches).toBe(1)
  })

  it('accepts a request with no Origin, which no page can forge', async () => {
    await bridge()
    const r = await post({})
    expect(r.executed).toBe(true)
    expect(r.launches).toBe(1)
  })

  it('refuses before the in-flight check, so a stranger learns nothing about state', async () => {
    await bridge()
    const r = await post({ origin: 'https://not-ours.example' })
    expect(r.status).toBe(403)
    expect(r.status).not.toBe(409)
  })
})

// The real launcher, which the tests above stub out. Kept because stubbing
// the launch would otherwise delete the only evidence that `ursa run` can
// actually be started this way, and a run channel that cannot start a run
// is the one failure a page would notice first.
//
// One test rather than three, with a timeout set from the measurement
// instead of inherited: `npxLauncher` spawns `npx`, which resolves and
// starts `tsx`, which compiles the CLI, which then resolves a repository.
// That cost 5 to 8 seconds per call on an idle machine, and the three
// origin tests above were each paying it to assert something about CORS.
describe('the launcher the run channel uses when nobody injects one', () => {
  it('runs the real CLI against a real repository and returns its summary', async () => {
    const projectPath = mkdtempSync(join(tmpdir(), 'ursa-launcher-'))
    execFileSync('git', ['init', '-q'], { cwd: projectPath })
    const summary = await npxLauncher(projectPath)
    // An empty repository has no episode to resolve, so the assertion is
    // that the CLI ran and reported, not that it found anything. A failed
    // spawn rejects, which is the condition this test exists to catch.
    expect(typeof summary).toBe('string')
  }, 120_000)
})
