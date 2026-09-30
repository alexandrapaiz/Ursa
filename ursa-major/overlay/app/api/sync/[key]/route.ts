// The sync route (plan §16.2): stores ciphertext, serves it back.
// Never sees a byte in the clear. The key is 64 hex chars derived
// client-side from the owner's passphrase; possession of the key
// names the blob, and only the other half of the derivation opens it.

import { list, put } from '@vercel/blob'

const KEY = /^[0-9a-f]{64}$/
const MAX_BYTES = 2 * 1024 * 1024

export async function PUT(req: Request, ctx: { params: Promise<{ key: string }> }) {
  const { key } = await ctx.params
  if (!KEY.test(key)) return new Response('bad key', { status: 400 })
  const body = new Uint8Array(await req.arrayBuffer())
  if (body.length === 0 || body.length > MAX_BYTES) return new Response('bad size', { status: 413 })
  await put(`sync/${key}.bin`, new Blob([body.buffer as ArrayBuffer]), {
    access: 'public',
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: 'application/octet-stream',
  })
  return new Response(null, { status: 204 })
}

export async function GET(_req: Request, ctx: { params: Promise<{ key: string }> }) {
  const { key } = await ctx.params
  if (!KEY.test(key)) return new Response('bad key', { status: 400 })
  const { blobs } = await list({ prefix: `sync/${key}.bin`, limit: 1 })
  if (blobs.length === 0) return new Response('no blob', { status: 404 })
  const upstream = await fetch(blobs[0].url, { cache: 'no-store' })
  if (!upstream.ok) return new Response('blob fetch failed', { status: 502 })
  return new Response(upstream.body, {
    status: 200,
    headers: { 'content-type': 'application/octet-stream', 'cache-control': 'no-store' },
  })
}
