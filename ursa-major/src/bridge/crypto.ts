// Client-side encryption (plan §16.4), the pattern the owner already
// uses in Atria Ledger: a passphrase she holds derives the key
// (PBKDF2, 600k iterations, SHA-256), AES-256-GCM for the blobs.
// This file uses the Web Crypto API through node's `crypto.webcrypto`
// so the browser side (overlay/lib/crypto.ts) is line-for-line the
// same algorithm with `window.crypto` swapped in. Ursa's servers
// store ciphertext and its hash, nothing else.
//
// v2 (2026-09-28) splits the derivation three ways instead of two, so
// that the sync route can refuse a write it cannot attribute. See
// docs/design/sync-write-capability.md; the read/write asymmetry is
// summarised in `DerivedKeys` below.

import { webcrypto } from 'node:crypto'
import { blobIdFor } from '../../overlay/lib/write-capability'

const subtle = webcrypto.subtle

export const PBKDF2_ITERATIONS = 600_000
// Fixed application salt (documented tradeoff, same as Atria Ledger:
// no server-side per-user salt because the server must never learn
// who a blob belongs to; the passphrase must therefore be strong).
//
// Bumped from `ursa-overlay-v1` on 2026-09-28. The bump is the point,
// not housekeeping: under v1 the 64-hex blob id travelled in every
// request URL, so it reached access logs and proxies. Under v2 the
// value at that same offset in the PBKDF2 output became the write
// secret. Deriving v2 from the v1 salt would therefore hand a write
// capability to anyone who had ever read a v1 URL. A fresh salt makes
// every v2 value one no v1 request ever carried.
export const SALT = new TextEncoder().encode('ursa-overlay-v2')

export interface DerivedKeys {
  /** AES-256-GCM key for the blobs */
  aesKey: CryptoKey
  /** 64 hex chars; names the blob on the sync server. Knowing it grants
   *  access to the ciphertext only, which the key alone can open. It is
   *  the SHA-256 of `writeSecret`, which is what lets a server holding
   *  no per-user state still tell a writer from a stranger. */
  blobId: string
  /** 64 hex chars; the preimage of `blobId`. Presenting it on a PUT is
   *  the whole proof of write authority. It never leaves the bridge
   *  except as that one request header, and it does not decrypt
   *  anything: the AES key is an independent 256 bits of the same
   *  PBKDF2 output, so a sync server that sees every write still
   *  cannot read a single payload. */
  writeSecret: string
}

/** Derive 64 bytes from the passphrase: first 32 are the AES key, last
 *  32 (hex) are the write secret, and the blob id is that secret's
 *  SHA-256. One passphrase, one read capability, one write capability,
 *  and the server can verify the second without being told the first. */
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
  const writeSecret = Array.from(bits.slice(32))
    .map((b) => b.toString(16).padStart(2, '0')).join('')
  return { aesKey, blobId: await blobIdFor(writeSecret), writeSecret }
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
