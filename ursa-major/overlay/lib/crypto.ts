// Browser mirror of ursa-major/src/bridge/crypto.ts — same constants,
// same algorithm, `window.crypto` for `node:crypto.webcrypto`. The
// passphrase is entered once per page session and held in memory only
// (plan §16.4). The server stores ciphertext; decryption happens here.
//
// One deliberate asymmetry with the bridge: this side derives the write
// secret (it has to, since the blob id is that secret's SHA-256) and
// then drops it instead of returning it. The page's whole job is to
// read, so the write capability is absent from the type a component can
// reach, not merely unused by one. See docs/design/sync-write-capability.md.

import { blobIdFor } from './write-capability'

export const PBKDF2_ITERATIONS = 600_000
// A fixed application salt, the same for every user. The tradeoff and the
// reason for it are written out in the bridge copy named above: the server
// must never learn whose blob a blob is, so there is no per-user salt to
// mix in, and the passphrase has to carry the whole weight instead. Said
// here as well, because this is the copy a reviewer of the user-facing
// surface reads, and this file is where a reader would otherwise conclude
// the constant is arbitrary. `ursa bridge` warns when the passphrase is
// short; this page does not, because by then the blob already exists and
// the name of it is the passphrase.
export const SALT = new TextEncoder().encode('ursa-overlay-v2')

export interface DerivedKeys {
  aesKey: CryptoKey
  blobId: string
}

export async function deriveKeys(passphrase: string): Promise<DerivedKeys> {
  const material = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(passphrase), 'PBKDF2', false, ['deriveBits'],
  )
  const bits = new Uint8Array(await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: SALT as BufferSource, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    material, 512,
  ))
  const aesKey = await crypto.subtle.importKey(
    'raw', bits.slice(0, 32) as BufferSource, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt'],
  )
  const writeSecret = Array.from(bits.slice(32))
    .map((b) => b.toString(16).padStart(2, '0')).join('')
  return { aesKey, blobId: await blobIdFor(writeSecret) }
}

export async function decryptJson<T = unknown>(keys: DerivedKeys, blob: Uint8Array): Promise<T> {
  const iv = blob.slice(0, 12)
  const ct = blob.slice(12)
  const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: iv as BufferSource }, keys.aesKey, ct as BufferSource)
  return JSON.parse(new TextDecoder().decode(pt)) as T
}
