// Who may write to the sync route (design: docs/design/sync-write-capability.md).
//
// The sync route stores ciphertext for a server that is never allowed to
// learn whose ciphertext it is, so it has no account table to check a
// writer against. What it can check is a preimage. The blob id in the
// request path IS the SHA-256 of a write secret that only the passphrase
// holder can derive, so "prove you may write here" reduces to "show me
// the string that hashes to the name you are writing to." The check needs
// no stored secret, no session, and no account, which is why it can live
// in a stateless route handler.
//
// Read stays open on purpose. The blob id is the read capability and it
// grants ciphertext only; AES-256-GCM under an independent 256 bits of
// the same PBKDF2 output is what keeps the plaintext in.
//
// This file is the canonical verifier and it imports nothing: Web Crypto
// is global in Node 18+ and in every Next.js runtime. Its producer-side
// twin is ursa-major/src/bridge/capability.ts, and
// ursa-major/src/bridge/capability.test.ts asserts the two agree by
// running one module's output through the other's check.

/** Request header carrying the 64-hex write secret, the preimage of the blob id. */
export const HEADER_WRITE_SECRET = 'x-ursa-write-secret'
/** Request header carrying the 64-hex SHA-256 of the request body. */
export const HEADER_BODY_SHA256 = 'x-ursa-body-sha256'
/** Both headers and the blob id are lowercase hex SHA-256 digests or preimages of that width. */
export const HEX64 = /^[0-9a-f]{64}$/
/** Ceiling on one blob, matching the route. An overlay payload is a few KB. */
export const MAX_BODY_BYTES = 2 * 1024 * 1024

const HEX = '0123456789abcdef'

function toHex(bytes: Uint8Array): string {
  let out = ''
  for (const b of bytes) out += HEX[b >> 4] + HEX[b & 15]
  return out
}

/** SHA-256 of a byte buffer, lowercase hex. */
export async function sha256HexBytes(bytes: Uint8Array): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', bytes as unknown as BufferSource)
  return toHex(new Uint8Array(digest))
}

/** SHA-256 of a string's UTF-8 bytes, lowercase hex. */
export async function sha256HexString(value: string): Promise<string> {
  return sha256HexBytes(new TextEncoder().encode(value))
}

/** The blob id a given write secret names: SHA-256 over the secret's own
 *  ASCII hex, not over decoded bytes. Hashing the header verbatim leaves
 *  exactly one answer to "what was hashed," so the bridge and the route
 *  cannot disagree about hex decoding. */
export async function blobIdFor(writeSecret: string): Promise<string> {
  return sha256HexString(writeSecret)
}

/** Length-checked, data-independent comparison of two hex strings. Both
 *  operands here are already known to an attacker (one is in the URL),
 *  so this is hygiene rather than a fix for a live timing leak. */
export function sameHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

export type WriteCheck =
  | { ok: true }
  | { ok: false; status: 400 | 401 | 403 | 413; message: string }

export interface WriteCheckInput {
  /** the `<64hex>` path segment of PUT /api/sync/<key> */
  key: string
  /** the HEADER_WRITE_SECRET header, or null when absent */
  writeSecret: string | null
  /** the HEADER_BODY_SHA256 header, or null when absent */
  bodySha256: string | null
  /** the request body, already buffered */
  body: Uint8Array
  maxBytes?: number
}

/** Every reason a PUT is refused, in one place, cheapest check first.
 *  The capability check runs before the body digest so an unauthorized
 *  caller never gets a hash computed over bytes it sent. */
export async function checkWrite(input: WriteCheckInput): Promise<WriteCheck> {
  const maxBytes = input.maxBytes ?? MAX_BODY_BYTES
  if (!HEX64.test(input.key)) return { ok: false, status: 400, message: 'bad key' }
  if (input.writeSecret === null) {
    return { ok: false, status: 401, message: `${HEADER_WRITE_SECRET} required` }
  }
  if (!HEX64.test(input.writeSecret)) {
    return { ok: false, status: 400, message: `bad ${HEADER_WRITE_SECRET}` }
  }
  if (input.body.length === 0) return { ok: false, status: 400, message: 'empty body' }
  if (input.body.length > maxBytes) return { ok: false, status: 413, message: 'too large' }
  if (!sameHex(await blobIdFor(input.writeSecret), input.key)) {
    return { ok: false, status: 403, message: 'write secret does not name this key' }
  }
  if (input.bodySha256 === null) {
    return { ok: false, status: 400, message: `${HEADER_BODY_SHA256} required` }
  }
  if (!HEX64.test(input.bodySha256)) {
    return { ok: false, status: 400, message: `bad ${HEADER_BODY_SHA256}` }
  }
  if (!sameHex(await sha256HexBytes(input.body), input.bodySha256)) {
    return { ok: false, status: 400, message: 'body digest mismatch' }
  }
  return { ok: true }
}
