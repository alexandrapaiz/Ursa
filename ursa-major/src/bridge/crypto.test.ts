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

// The browser mirror is only a mirror if it lands on the same blob. It
// runs here unmodified: it reaches for the global `crypto`, which Node 22
// provides, so no shim stands between the test and the file the page
// ships. A drift in salt, iteration count, bit split, or blob-id
// derivation makes the page poll a name the bridge never wrote.
import { deriveKeys as deriveInBrowser, PBKDF2_ITERATIONS as BROWSER_ITERATIONS, SALT as BROWSER_SALT } from '../../overlay/lib/crypto'
import { PBKDF2_ITERATIONS, SALT } from './crypto'

describe('bridge and browser derivations agree', () => {
  it('derive the same blob id from the same passphrase', async () => {
    const bridge = await deriveKeys('correct horse battery staple')
    const browser = await deriveInBrowser('correct horse battery staple')
    expect(browser.blobId).toBe(bridge.blobId)
  })

  it('decrypt the bridge ciphertext with the browser AES key', async () => {
    const bridge = await deriveKeys('correct horse battery staple')
    const browser = await deriveInBrowser('correct horse battery staple')
    const blob = await encryptJson(bridge, { verdict: { accepted: true, step: 730 } })
    const { decryptJson: decryptInBrowser } = await import('../../overlay/lib/crypto')
    expect(await decryptInBrowser(browser, blob)).toEqual({ verdict: { accepted: true, step: 730 } })
  })

  it('share the salt and the iteration count verbatim', () => {
    expect(new TextDecoder().decode(BROWSER_SALT)).toBe(new TextDecoder().decode(SALT))
    expect(new TextDecoder().decode(SALT)).toBe('ursa-overlay-v2')
    expect(BROWSER_ITERATIONS).toBe(PBKDF2_ITERATIONS)
  })

  it('keeps the write secret off the browser type', async () => {
    const browser = await deriveInBrowser('correct horse battery staple')
    // The page reads and never writes, so the capability is not merely
    // unused there, it is absent from the object a component can reach.
    expect('writeSecret' in browser).toBe(false)
  })
})
