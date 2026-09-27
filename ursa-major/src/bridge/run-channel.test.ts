// The run channel's gate. Before this test the origin check decorated
// the response headers and nothing else: a POST from any site reached
// execFile and spawned `ursa run` on the owner's machine, and the
// browser hid only the reply. These cases pin the gate shut.

import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { startBridge, type BridgeHandle } from './index'

const PORT = 7913
const ALLOWED = 'https://ursa-overlay.vercel.app'
const base = `http://127.0.0.1:${PORT}`

let handle: BridgeHandle

beforeAll(async () => {
  handle = await startBridge({
    projectPath: mkdtempSync(join(tmpdir(), 'ursa-run-channel-')),
    passphrase: 'test-only-passphrase',
    syncUrl: 'http://127.0.0.1:9', // unreachable by design; push failures only log
    port: PORT,
    intervalMs: 3_600_000, // one tick at startup, none after
    allowOrigins: [ALLOWED],
    runner: () => '{"accepted": null, "step": null, "quote": null}',
    log: () => {},
  })
}, 30_000)

afterAll(async () => { await handle?.stop() })

describe('bridge run channel', () => {
  it('refuses POST /run from an origin that is not allowed', async () => {
    const res = await fetch(`${base}/run`, {
      method: 'POST',
      headers: { origin: 'https://attacker.example' },
    })
    expect(res.status).toBe(403)
    expect(res.headers.get('access-control-allow-origin')).toBeNull()
  })

  it('refuses POST /run with no Origin header at all', async () => {
    // A browser always sends Origin on a cross-origin POST, so a missing
    // one never describes the caller this channel exists to serve.
    const res = await fetch(`${base}/run`, { method: 'POST' })
    expect(res.status).toBe(403)
  })

  it('still lets the hosted overlay through the gate', async () => {
    // Asserted at the preflight, not by spawning a real run: the point
    // is that the allowed origin is recognised, not that ursa runs here.
    const res = await fetch(`${base}/run`, {
      method: 'OPTIONS',
      headers: { origin: ALLOWED },
    })
    expect(res.status).toBe(204)
    expect(res.headers.get('access-control-allow-origin')).toBe(ALLOWED)
    expect(res.headers.get('vary')).toBe('Origin')
  })

  it('serves /health', async () => {
    const res = await fetch(`${base}/health`, { headers: { origin: ALLOWED } })
    expect(res.status).toBe(200)
    expect((await res.json()).ok).toBe(true)
  })
})
