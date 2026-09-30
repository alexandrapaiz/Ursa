// Browser mirror of ursa-major/src/bridge/crypto.ts — same constants,
// same algorithm, `window.crypto` for `node:crypto.webcrypto`. The
// passphrase is entered once per page session and held in memory only
// (plan §16.4). The server stores ciphertext; decryption happens here.

export const PBKDF2_ITERATIONS = 600_000
export const SALT = new TextEncoder().encode('ursa-overlay-v1')

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
  const blobId = Array.from(bits.slice(32))
    .map((b) => b.toString(16).padStart(2, '0')).join('')
  return { aesKey, blobId }
}

export async function decryptJson<T = unknown>(keys: DerivedKeys, blob: Uint8Array): Promise<T> {
  const iv = blob.slice(0, 12)
  const ct = blob.slice(12)
  const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: iv as BufferSource }, keys.aesKey, ct as BufferSource)
  return JSON.parse(new TextDecoder().decode(pt)) as T
}
