// The write capability, tested from both ends (design:
// docs/design/sync-write-capability.md). These tests stand in for an
// integration test against the deployed route, which needs a Vercel
// Blob token this runner does not have: everything here exercises the
// exact module the route calls, with the exact values the bridge sends.

import { describe, expect, it } from 'vitest'
import {
  HEADER_BODY_SHA256,
  HEADER_WRITE_SECRET,
  MAX_BODY_BYTES,
  blobIdFor,
  checkWrite,
  sameHex,
  sha256HexBytes,
} from '../../overlay/lib/write-capability'
import { deriveKeys, encryptJson } from './crypto'

/** Exactly what src/bridge/index.ts `push` puts on the wire, so a drift
 *  between the bridge's request shape and the route's check fails here. */
async function bridgeWrite(passphrase: string, payload: unknown) {
  const keys = await deriveKeys(passphrase)
  const body = await encryptJson(keys, payload)
  return {
    key: keys.blobId,
    writeSecret: keys.writeSecret,
    bodySha256: await sha256HexBytes(body),
    body,
  }
}

const PAYLOAD = { project: 'ursa-minor', verdict: { accepted: true, step: 730 } }

describe('the sync write capability', () => {
  it('accepts exactly what the bridge sends', async () => {
    const write = await bridgeWrite('correct horse battery staple', PAYLOAD)
    expect(await checkWrite(write)).toEqual({ ok: true })
  })

  it('names the blob as the SHA-256 of the write secret', async () => {
    const keys = await deriveKeys('correct horse battery staple')
    expect(keys.blobId).toBe(await blobIdFor(keys.writeSecret))
    expect(keys.blobId).toMatch(/^[0-9a-f]{64}$/)
    expect(keys.writeSecret).toMatch(/^[0-9a-f]{64}$/)
    // The write capability is not the read capability. Under v1 the blob
    // id WAS this value, so a v1 URL in an access log would now be a
    // write credential; asserting they differ is asserting the salt bump
    // did its job.
    expect(keys.writeSecret).not.toBe(keys.blobId)
  })

  it('refuses a write with no secret at all — the whole 2026-09-27 finding', async () => {
    const write = await bridgeWrite('correct horse battery staple', PAYLOAD)
    const anonymous = await checkWrite({ ...write, writeSecret: null })
    expect(anonymous.ok).toBe(false)
    expect(anonymous).toMatchObject({ status: 401 })
    expect((anonymous as { message: string }).message).toContain(HEADER_WRITE_SECRET)
  })

  it('refuses a stranger who knows the blob id but not the passphrase', async () => {
    const mine = await bridgeWrite('correct horse battery staple', PAYLOAD)
    const theirs = await bridgeWrite('a different passphrase', { tampered: true })
    // The attacker has the victim's key from a URL, plus a well-formed
    // body and a correct digest for it. What it cannot produce is the
    // preimage, so the overwrite is refused.
    const attempt = await checkWrite({
      key: mine.key,
      writeSecret: theirs.writeSecret,
      bodySha256: theirs.bodySha256,
      body: theirs.body,
    })
    expect(attempt).toEqual({ ok: false, status: 403, message: 'write secret does not name this key' })
  })

  it('refuses a body that does not match its digest', async () => {
    const write = await bridgeWrite('correct horse battery staple', PAYLOAD)
    const truncated = write.body.slice(0, write.body.length - 1)
    const attempt = await checkWrite({ ...write, body: truncated })
    expect(attempt).toEqual({ ok: false, status: 400, message: 'body digest mismatch' })
  })

  it('requires the digest header, and rejects a malformed one', async () => {
    const write = await bridgeWrite('correct horse battery staple', PAYLOAD)
    expect(await checkWrite({ ...write, bodySha256: null })).toMatchObject({ status: 400 })
    expect(await checkWrite({ ...write, bodySha256: 'not-hex' })).toMatchObject({ status: 400 })
    expect((await checkWrite({ ...write, bodySha256: null }) as { message: string }).message)
      .toContain(HEADER_BODY_SHA256)
  })

  it('rejects a malformed key or secret before hashing anything', async () => {
    const write = await bridgeWrite('correct horse battery staple', PAYLOAD)
    expect(await checkWrite({ ...write, key: 'short' })).toEqual({ ok: false, status: 400, message: 'bad key' })
    expect(await checkWrite({ ...write, key: write.key.toUpperCase() })).toMatchObject({ status: 400 })
    expect(await checkWrite({ ...write, writeSecret: 'short' })).toMatchObject({ status: 400 })
  })

  it('keeps the size limits, and answers empty and oversized differently', async () => {
    const write = await bridgeWrite('correct horse battery staple', PAYLOAD)
    expect(await checkWrite({ ...write, body: new Uint8Array(0) }))
      .toEqual({ ok: false, status: 400, message: 'empty body' })
    expect(await checkWrite({ ...write, body: new Uint8Array(MAX_BODY_BYTES + 1) }))
      .toEqual({ ok: false, status: 413, message: 'too large' })
  })

  it('checks the capability before it spends a hash on the body', async () => {
    // Ordering is a property, not a detail: an unauthorized caller should
    // not be able to make the route hash 2 MB it chose. A body that is
    // oversized AND unauthorized comes back as the size refusal, and one
    // that is authorized-looking but wrong-key comes back 403 without the
    // digest ever being consulted — so a 403 with a deliberately absent
    // digest header is still a 403.
    const mine = await bridgeWrite('correct horse battery staple', PAYLOAD)
    const theirs = await bridgeWrite('a different passphrase', PAYLOAD)
    const attempt = await checkWrite({
      key: mine.key, writeSecret: theirs.writeSecret, bodySha256: null, body: theirs.body,
    })
    expect(attempt).toMatchObject({ status: 403 })
  })

  it('compares hex without leaking length as equality', () => {
    expect(sameHex('abcd', 'abcd')).toBe(true)
    expect(sameHex('abcd', 'abce')).toBe(false)
    expect(sameHex('abcd', 'abcd0')).toBe(false)
    expect(sameHex('', '')).toBe(true)
  })

  it('still lets the passphrase holder overwrite their own blob', async () => {
    // The capability is per-passphrase, not per-upload, so the bridge's
    // second tick must pass the same check as its first with new bytes.
    const first = await bridgeWrite('correct horse battery staple', PAYLOAD)
    const second = await bridgeWrite('correct horse battery staple', { ...PAYLOAD, userTurns: 731 })
    expect(second.key).toBe(first.key)
    expect(await checkWrite(second)).toEqual({ ok: true })
  })
})
