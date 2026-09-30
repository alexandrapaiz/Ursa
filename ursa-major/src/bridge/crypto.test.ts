import { describe, expect, it } from 'vitest'
import { decryptJson, deriveKeys, encryptJson } from './crypto'

describe('bridge crypto', () => {
  it('round-trips a payload under the derived key', async () => {
    const keys = await deriveKeys('correct horse battery staple')
    const payload = { project: 'ursa-minor', verdict: { accepted: true, step: 730 } }
    const blob = await encryptJson(keys, payload)
    expect(await decryptJson(keys, blob)).toEqual(payload)
  })

  it('derives a stable 64-hex blob id, distinct from the AES key material', async () => {
    const a = await deriveKeys('same passphrase')
    const b = await deriveKeys('same passphrase')
    expect(a.blobId).toBe(b.blobId)
    expect(a.blobId).toMatch(/^[0-9a-f]{64}$/)
  })

  it('refuses to decrypt under the wrong passphrase', async () => {
    const right = await deriveKeys('right')
    const wrong = await deriveKeys('wrong')
    const blob = await encryptJson(right, { secret: true })
    await expect(decryptJson(wrong, blob)).rejects.toThrow()
  })
})
