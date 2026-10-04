// The run channel is a local HTTP listener that spawns `ursa run`. CORS
// cannot defend it: a cross-origin POST with no custom header is a
// simple request, so the browser sends it without a preflight and only
// hides the reply. The allowlist therefore has to gate the execution.
// These tests assert the side effect, not the status code, because the
// side effect is the thing an attacking page wants and does not need to
// read. (Found live on main by the 2026-09-27 run; that fix never
// merged, so it is re-asserted here with a test to hold it.)

import { describe, expect, it, afterEach } from 'vitest'
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { startBridge, type BridgeHandle } from './index'

const PORT = 7831
const ALLOWED = 'https://ursa-overlay.vercel.app'

let handle: BridgeHandle | null = null
let logs: string[] = []

async function bridge() {
  const projectPath = mkdtempSync(join(tmpdir(), 'ursa-runchannel-'))
  mkdirSync(join(projectPath, '.ursa'), { recursive: true })
  writeFileSync(join(projectPath, '.ursa', 'tuning.json'), JSON.stringify({ axioms: [] }))
  logs = []
  handle = await startBridge({
    projectPath,
    passphrase: 'run-channel-test-passphrase',
    syncUrl: 'http://127.0.0.1:9', // unreachable on purpose; the tick only logs
    port: PORT,
    intervalMs: 10 ** 9,
    allowOrigins: [ALLOWED],
    runner: () => '{"accepted":null,"step":null,"quote":null}',
    log: (l) => logs.push(l),
  })
  return handle
}

/** Did the channel spawn a run? The log line is written before execFile. */
async function post(headers: Record<string, string>) {
  const res = await fetch(`http://127.0.0.1:${PORT}/run`, { method: 'POST', headers })
  return {
    status: res.status,
    acao: res.headers.get('access-control-allow-origin'),
    executed: logs.some((l) => l.includes('run requested from the page')),
  }
}

afterEach(async () => { await handle?.stop(); handle = null })

describe('the bridge run channel', () => {
  it('does not spawn a run for an origin outside the allowlist', async () => {
    await bridge()
    const r = await post({ origin: 'https://not-ours.example' })
    expect(r.executed).toBe(false)
    expect(r.status).toBe(403)
    expect(r.acao).toBe(null)
  })

  it('does not spawn a run for an opaque origin', async () => {
    await bridge()
    // A sandboxed iframe, a data: URL or a file: page sends Origin: null.
    const r = await post({ origin: 'null' })
    expect(r.executed).toBe(false)
    expect(r.status).toBe(403)
  })

  it('accepts the allowlisted overlay origin', async () => {
    await bridge()
    const r = await post({ origin: ALLOWED })
    expect(r.executed).toBe(true)
    expect(r.acao).toBe(ALLOWED)
  })

  it('accepts a loopback dev origin', async () => {
    await bridge()
    const r = await post({ origin: 'http://localhost:3000' })
    expect(r.executed).toBe(true)
  })

  it('accepts a request with no Origin, which no page can forge', async () => {
    await bridge()
    const r = await post({})
    expect(r.executed).toBe(true)
  })

  it('refuses before the in-flight check, so a stranger learns nothing about state', async () => {
    await bridge()
    const r = await post({ origin: 'https://not-ours.example' })
    expect(r.status).toBe(403)
    expect(r.status).not.toBe(409)
  })
})
