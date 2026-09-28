// The sync route (plan §16.2): stores ciphertext, serves it back.
// Never sees a byte in the clear. The key is 64 hex chars derived
// client-side from the owner's passphrase; possession of the key
// names the blob, and only the other half of the derivation opens it.
//
// Writes are capability-checked (design: docs/design/sync-write-capability.md).
// Until 2026-09-28 this route took a PUT from anyone, at any key, with
// `allowOverwrite: true` and no authentication, which meant two things:
// a stranger could fill the owner's Blob store 2 MB at a time on her
// bill, and a stranger who learned a blob id could replace that user's
// payload with bytes that fail AES-GCM authentication, after which the
// overlay reads "cannot decrypt" forever. `checkWrite` closes both by
// requiring the preimage of the key. The body digest header is plan
// §16.4's own "ciphertext and the SHA-256 of it" requirement, and it
// turns a truncated upload into a refusal at write time instead of an
// unopenable blob discovered later.

import { list, put } from '@vercel/blob'
import {
  HEADER_BODY_SHA256,
  HEADER_WRITE_SECRET,
  HEX64,
  MAX_BODY_BYTES,
  checkWrite,
} from '../../../../lib/write-capability'

export async function PUT(req: Request, ctx: { params: Promise<{ key: string }> }) {
  const { key } = await ctx.params
  const body = new Uint8Array(await req.arrayBuffer())
  const verdict = await checkWrite({
    key,
    writeSecret: req.headers.get(HEADER_WRITE_SECRET),
    bodySha256: req.headers.get(HEADER_BODY_SHA256),
    body,
    maxBytes: MAX_BODY_BYTES,
  })
  if (!verdict.ok) return new Response(verdict.message, { status: verdict.status })
  await put(`sync/${key}.bin`, new Blob([body.buffer as ArrayBuffer]), {
    // `access: 'public'` with no random suffix is still the storage mode,
    // so the ciphertext also sits at a guessable Blob URL that this route
    // cannot gate. That is a read path, and reads of ciphertext were never
    // what the capability protects; the residual is the ledger's
    // "Who may write to the sync route" entry, under its `access` clause.
    access: 'public',
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: 'application/octet-stream',
  })
  return new Response(null, { status: 204 })
}

export async function GET(_req: Request, ctx: { params: Promise<{ key: string }> }) {
  const { key } = await ctx.params
  if (!HEX64.test(key)) return new Response('bad key', { status: 400 })
  const { blobs } = await list({ prefix: `sync/${key}.bin`, limit: 1 })
  if (blobs.length === 0) return new Response('no blob', { status: 404 })
  const upstream = await fetch(blobs[0].url, { cache: 'no-store' })
  if (!upstream.ok) return new Response('blob fetch failed', { status: 502 })
  return new Response(upstream.body, {
    status: 200,
    headers: { 'content-type': 'application/octet-stream', 'cache-control': 'no-store' },
  })
}
