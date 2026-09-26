// Client-side encryption (plan §16.4), the pattern the owner already
// uses in Atria Ledger: a passphrase she holds derives the key
// (PBKDF2, 600k iterations, SHA-256), AES-256-GCM for the blobs.
// This file uses the Web Crypto API through node's `crypto.webcrypto`
// so the browser side (overlay/lib/crypto.ts) is line-for-line the
// same algorithm with `window.crypto` swapped in. Ursa's servers
// store ciphertext and its hash, nothing else.

import { webcrypto } from 'node:crypto'

const subtle = webcrypto.subtle

export const PBKDF2_ITERATIONS = 600_000
// Fixed application salt (documented tradeoff, same as Atria Ledger:
// no server-side per-user salt because the server must never learn
// who a blob belongs to; the passphrase must therefore be strong).
export const SALT = new TextEncoder().encode('ursa-overlay-v1')

export interface DerivedKeys {
  /** AES-256-GCM key for the blobs */
  aesKey: CryptoKey
  /** 64 hex chars; names the blob on the sync server. Knowing it grants
   *  access to the ciphertext only, which the key alone can open. */
  blobId: string
}

/** Derive 64 bytes from the passphrase: first 32 are the AES key,
 *  last 32 (hex) are the blob id. One passphrase, both halves. */
export async function deriveKeys(passphrase: string): Promise<DerivedKeys> {
  const material = await subtle.importKey(
    'raw', new TextEncoder().encode(passphrase), 'PBKDF2', false, ['deriveBits'],
  )
  const bits = new Uint8Array(await subtle.deriveBits(
    { name: 'PBKDF2', salt: SALT, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    material, 512,
  ))
  const aesKey = await subtle.importKey(
    'raw', bits.slice(0, 32), { name: 'AES-GCM' }, false, ['encrypt', 'decrypt'],
  )
  const blobId = Array.from(bits.slice(32))
    .map((b) => b.toString(16).padStart(2, '0')).join('')
  return { aesKey, blobId }
}

/** iv (12 bytes) prepended to the ciphertext; one buffer per blob. */
export async function encryptJson(keys: DerivedKeys, value: unknown): Promise<Uint8Array> {
  const iv = webcrypto.getRandomValues(new Uint8Array(12))
  const plaintext = new TextEncoder().encode(JSON.stringify(value))
  const ct = new Uint8Array(await subtle.encrypt({ name: 'AES-GCM', iv }, keys.aesKey, plaintext))
  const out = new Uint8Array(iv.length + ct.length)
  out.set(iv, 0)
  out.set(ct, iv.length)
  return out
}

export async function decryptJson<T = unknown>(keys: DerivedKeys, blob: Uint8Array): Promise<T> {
  const iv = blob.slice(0, 12)
  const ct = blob.slice(12)
  const pt = await subtle.decrypt({ name: 'AES-GCM', iv }, keys.aesKey, ct)
  return JSON.parse(new TextDecoder().decode(pt)) as T
}
