# The sync write capability — who may replace a blob

**Status:** implemented 2026-09-28 on `engineer/2026-09-28-record-integrity-gate`.
Closes the fixable half of the security seat's first audit, finding 2
(`docs/security/audit-2026-09-27.md`), and satisfies the integrity clause
of the product plan's own §16.4, which has always read "Ursa's servers
store ciphertext and the SHA-256 of it for integrity, nothing else" while
the shipped route stored neither a hash nor checked one.

Written to the engineering-artifact standard in `prompts/engineer-agent.md`:
a system diagram whose nodes are real, interfaces as TypeScript
signatures, on-disk layouts with a real payload, exact commands, a
versioned tooling list, and no bare terms.

---

## 1. The problem, stated exactly

`PUT /api/sync/<key>` accepted a write from any caller, at any key, with
`allowOverwrite: true`, no credential, and no rate limit. Two distinct
consequences, neither of them about confidentiality:

- **Cost.** Any caller could store 2 MB per request in the owner's Vercel
  Blob store, billed to her account, with no ceiling on the number of
  distinct keys.
- **Availability of a user's own record.** The 64-hex key travels in the
  request path, so it reaches Vercel's access logs, browser history, and
  every proxy in between. A caller who learned one key could replace that
  user's ciphertext with arbitrary bytes. Those bytes fail AES-256-GCM
  authentication on the next read, so the overlay page renders
  `cannot decrypt — wrong passphrase?` permanently, and the real payload
  is gone because `allowOverwrite: true` destroyed it.

**Confidentiality was never at stake and is unchanged.** The server holds
ciphertext under a key derived on the client; an attacker who writes bytes
still cannot read bytes, and cannot forge bytes that authenticate.

### Why this could not be solved with an account

Ursa's sync server is forbidden, by the load-bearing constraint in
`CLAUDE.md` ("Raw processing happens on-device. Raw data never touches the
aggregation layer") and by plan §16.4, from learning whose ciphertext it
holds. An account table keyed to a user is precisely the record it must
not have. So the route has no stored per-user state to check a writer
against, and the audit's own first step ("an HMAC over the body under a
third slice of the same PBKDF2 output, checked by the route") does not
close: the route cannot verify an HMAC under a key it was never given.

## 2. The mechanism: the name is the hash of the capability

**The blob id in the request path is the SHA-256 of a write secret only
the passphrase holder can derive.** "Prove you may write here" therefore
reduces to "show me the string that hashes to the name you are writing
to," which a route holding zero state can check with one hash.

This is the write-capability half of the read/write capability split used
in Tahoe-LAFS. It was chosen over the three alternatives considered:

| Mechanism | Why not chosen |
|---|---|
| **Account plus session cookie** (a `users` row on Neon serverless Postgres, the database named in plan §12) | Creates the one record the constraint forbids: a server-side row associating a person with a blob. Also adds a signup flow to a product whose S0 has exactly one user. |
| **HMAC over the body under a third PBKDF2 slice** (the audit's own suggested first step) | Not verifiable. The route would need the HMAC key, which is derived from the passphrase the route must never see. Storing it on first write ("trust on first use") hands the server a standing write credential for every user. |
| **A bearer token in an environment variable**, shared by every bridge | One shared secret across all users means any user can overwrite any other user's blob, so it closes the cost exposure and leaves the availability one wide open. It also has to be distributed, and Ursa ships no per-user secret distribution. |
| **Chosen: preimage-of-the-name capability** | Stateless, per-user, zero distribution, zero new service, $0. The server can check it and still cannot read a payload, because the AES-256-GCM key is an independent 256 bits of the same PBKDF2 output. |

### The derivation, before and after

One PBKDF2-HMAC-SHA256 pass over the passphrase, 600,000 iterations,
output 512 bits, split as follows.

| Bits | v1 (`ursa-overlay-v1`, shipped 2026-09-25) | v2 (`ursa-overlay-v2`, this change) |
|---|---|---|
| `bits[0..32)` | AES-256-GCM key, never transmitted | AES-256-GCM key, never transmitted. Unchanged in role. |
| `bits[32..64)` | `blobId`, hex-encoded. Sent in **every request path**. | `writeSecret`, hex-encoded. Sent **only** in the `x-ursa-write-secret` request header. |
| derived | — | `blobId = SHA-256(ASCII of writeSecret)`, hex. Sent in the request path, as before. |

**The salt bump is load-bearing, not housekeeping.** The v1 `blobId` is
`bits[32..64)`, and it travelled in URLs, so it is in access logs. v2 makes
that same offset the write secret. Deriving v2 under the v1 salt would
hand a live write capability to anyone holding a v1 URL. A fresh salt makes
every v2 value one that no v1 request ever carried. The cost is that the
v1 blob becomes unreachable, which is acceptable and cheap: see §7.

**What the server learns on a write.** The `writeSecret` itself. That is a
bearer capability equal to the ability to write, which the server already
had by definition, and it grants nothing else: SHA-256 is one-way, so it
does not yield the passphrase, and the AES key is independent bits, so it
does not decrypt anything. It cannot be replayed to a different key
either, since it names exactly one blob.

**What the hash of the body adds.** A separate guarantee, and plan §16.4's
own requirement. A write whose `x-ursa-body-sha256` header does not match
its body is refused, so a connection truncated mid-upload becomes a 400 at
write time instead of a blob that authenticates on nothing and is
discovered days later as `cannot decrypt`.

## 3. System diagram

Nodes are files that exist in this repository at the paths given. Edges
carry the named type or wire format, not a verb.

```
 ┌─────────────────────────────────────────────────────────────────────┐
 │ the owner's Mac                                                     │
 │                                                                     │
 │  ~/.claude/projects/<munged-project-path>/<session>.jsonl            │
 │            │                                                         │
 │            │ utf-8 JSONL, one Claude Code turn per line              │
 │            ▼                                                         │
 │  ursa-major/src/parse.ts            ── ParsedSession ──┐             │
 │  ursa-major/src/verdict.ts          ── Verdict ────────┤             │
 │  <project>/.ursa/tuning.json        ── TuningRecord ───┤             │
 │                                                        ▼             │
 │                              ursa-major/src/bridge/index.ts          │
 │                                   (process: `ursa bridge <project>`) │
 │                                        │        │                    │
 │              OverlayPayload (in-memory) │        │ Uint8Array         │
 │                                        ▼        │ (iv‖ciphertext)     │
 │                      ursa-major/src/bridge/crypto.ts                 │
 │                        encryptJson(DerivedKeys, OverlayPayload)      │
 │                                        │                             │
 │            DerivedKeys.writeSecret     │  Uint8Array                 │
 │            (64 hex chars)              ▼                             │
 │                      ursa-major/overlay/lib/write-capability.ts      │
 │                        sha256HexBytes(Uint8Array) → 64 hex chars     │
 └────────────────────────────────┬────────────────────────────────────┘
                                  │
        HTTPS PUT /api/sync/<blobId:64hex>
        content-type: application/octet-stream
        x-ursa-write-secret: <64 hex>      ← DerivedKeys.writeSecret
        x-ursa-body-sha256: <64 hex>       ← SHA-256 of the body bytes
        body: Uint8Array, 12-byte iv ‖ AES-256-GCM ciphertext
                                  │
                                  ▼
 ┌─────────────────────────────────────────────────────────────────────┐
 │ Vercel, project `ursa-overlay`                                      │
 │                                                                     │
 │  ursa-major/overlay/app/api/sync/[key]/route.ts  (PUT handler)      │
 │            │                                                         │
 │            │ WriteCheckInput { key, writeSecret, bodySha256, body } │
 │            ▼                                                         │
 │  ursa-major/overlay/lib/write-capability.ts :: checkWrite           │
 │            │                                                         │
 │            │ WriteCheck = { ok: true } | { ok: false, status, … }   │
 │            ▼                                                         │
 │        ok:false ──► HTTP 400 | 401 | 403 | 413, text/plain reason   │
 │        ok:true  ──► put('sync/<blobId>.bin', Blob, …)               │
 │                            │                                         │
 │                            │ application/octet-stream               │
 │                            ▼                                         │
 │  Vercel Blob store `ursa-overlay-sync`, object `sync/<blobId>.bin`  │
 └────────────────────────────────┬────────────────────────────────────┘
                                  │ GET /api/sync/<blobId>
                                  │ application/octet-stream (ciphertext)
                                  ▼
 ┌─────────────────────────────────────────────────────────────────────┐
 │ the browser window (Chrome `--app=`, plan §16.5)                    │
 │                                                                     │
 │  ursa-major/overlay/app/page.tsx                                    │
 │            │ passphrase (string, memory only, never stored)         │
 │            ▼                                                         │
 │  ursa-major/overlay/lib/crypto.ts :: deriveKeys                     │
 │            │ DerivedKeys { aesKey, blobId }  ← no writeSecret here   │
 │            ▼                                                         │
 │  ursa-major/overlay/lib/crypto.ts :: decryptJson → OverlayPayload   │
 └─────────────────────────────────────────────────────────────────────┘
```

**Two edges to read carefully.** `DerivedKeys.writeSecret` exists on the
bridge's edge into the route and nowhere on the browser's edges: the
browser's `DerivedKeys` type has two fields, not three, so the page cannot
reach a write capability even by mistake. And the route's only edge into
the Blob store is downstream of `checkWrite` returning `ok: true`, which
is what makes the refusal a refusal rather than a hidden CORS header.

## 4. Interfaces at every boundary

`ursa-major/overlay/lib/write-capability.ts` — the canonical verifier. It
imports nothing, because Web Crypto is global in Node 18+ and in every
Next.js runtime, which is what lets one file serve both the Vercel route
and the bridge.

```ts
export const HEADER_WRITE_SECRET = 'x-ursa-write-secret'
export const HEADER_BODY_SHA256 = 'x-ursa-body-sha256'
export const HEX64: RegExp
export const MAX_BODY_BYTES = 2 * 1024 * 1024

export async function sha256HexBytes(bytes: Uint8Array): Promise<string>
export async function sha256HexString(value: string): Promise<string>
export async function blobIdFor(writeSecret: string): Promise<string>
export function sameHex(a: string, b: string): boolean

export type WriteCheck =
  | { ok: true }
  | { ok: false; status: 400 | 401 | 403 | 413; message: string }

export interface WriteCheckInput {
  key: string                    // the <64hex> path segment
  writeSecret: string | null     // the x-ursa-write-secret header, null when absent
  bodySha256: string | null      // the x-ursa-body-sha256 header, null when absent
  body: Uint8Array               // the request body, already buffered
  maxBytes?: number              // defaults to MAX_BODY_BYTES
}

export async function checkWrite(input: WriteCheckInput): Promise<WriteCheck>
```

`ursa-major/src/bridge/crypto.ts` — the bridge's derivation. `writeSecret`
is new; `blobId` changes meaning from "the second half of the output" to
"the SHA-256 of the second half."

```ts
export const PBKDF2_ITERATIONS: 600_000
export const SALT: Uint8Array            // utf-8 'ursa-overlay-v2'

export interface DerivedKeys {
  aesKey: CryptoKey    // AES-256-GCM, bits[0..32), never transmitted
  blobId: string       // 64 hex, SHA-256(writeSecret); the read capability
  writeSecret: string  // 64 hex, bits[32..64); the write capability
}

export async function deriveKeys(passphrase: string): Promise<DerivedKeys>
export async function encryptJson(keys: DerivedKeys, value: unknown): Promise<Uint8Array>
export async function decryptJson<T = unknown>(keys: DerivedKeys, blob: Uint8Array): Promise<T>
```

`ursa-major/overlay/lib/crypto.ts` — the browser mirror. Same algorithm,
`window.crypto` in place of `node:crypto.webcrypto`, and a deliberately
narrower return type.

```ts
export interface DerivedKeys {
  aesKey: CryptoKey
  blobId: string
  // no writeSecret: the page reads and never writes, so the capability is
  // absent from the type rather than merely unused by the component
}

export async function deriveKeys(passphrase: string): Promise<DerivedKeys>
export async function decryptJson<T = unknown>(keys: DerivedKeys, blob: Uint8Array): Promise<T>
```

`ursa-major/overlay/app/api/sync/[key]/route.ts` — the Next.js App Router
handlers, signatures unchanged from what shipped 2026-09-25.

```ts
export async function PUT(req: Request, ctx: { params: Promise<{ key: string }> }): Promise<Response>
export async function GET(_req: Request, ctx: { params: Promise<{ key: string }> }): Promise<Response>
```

### Every refusal, in the order `checkWrite` applies them

The order is itself a property: an unauthorized caller must not be able to
make the route compute a SHA-256 over 2 MB of bytes it chose, so the
capability check precedes the body digest, and the size check precedes
both.

| # | Condition | Status | Response body |
|---|---|---|---|
| 1 | `key` is not 64 lowercase hex characters | 400 | `bad key` |
| 2 | the `x-ursa-write-secret` header is absent | 401 | `x-ursa-write-secret required` |
| 3 | that header is present but not 64 lowercase hex characters | 400 | `bad x-ursa-write-secret` |
| 4 | the request body is zero bytes | 400 | `empty body` |
| 5 | the request body exceeds `MAX_BODY_BYTES` (2,097,152 bytes) | 413 | `too large` |
| 6 | `SHA-256(writeSecret) !== key` — the caller does not hold this blob | 403 | `write secret does not name this key` |
| 7 | the `x-ursa-body-sha256` header is absent | 400 | `x-ursa-body-sha256 required` |
| 8 | that header is present but not 64 lowercase hex characters | 400 | `bad x-ursa-body-sha256` |
| 9 | `SHA-256(body) !== bodySha256` — the bytes are not the bytes the writer hashed | 400 | `body digest mismatch` |
| — | none of the above | 204 | empty, after `put()` succeeds |

`GET` is deliberately left open, checking only row 1. The blob id is the
read capability and what it grants is ciphertext; AES-256-GCM under
`bits[0..32)` is what keeps the plaintext in. A user's ciphertext is
readable by anyone holding their blob id both before and after this
change, which is the design, not a regression.

## 5. On-disk layouts, with a real payload

Nothing on this path is a new on-disk format. Three real locations are
involved, and the redaction rider in `prompts/engineer-agent.md` applies:
home paths are written as `~/` and `<you>`, and every derived identifier is
truncated, because a full blob id is a live read capability.

**The session log the bridge tails** (read-only; Claude Code owns it):

```
~/.claude/projects/-Users-<you>-Desktop-ursa-minor-site/<session-uuid>.jsonl
```

**The tuning record the payload carries** (read-only; `ursa run` owns it):

```
~/Desktop/ursa-minor-site/.ursa/tuning.json
```

**The object the route writes**, inside the Vercel Blob store
`ursa-overlay-sync`, key `sync/<blobId>.bin`, `content-type:
application/octet-stream`. Its bytes are `iv ‖ ciphertext`: 12 bytes of
random AES-GCM initialisation vector followed by the AES-256-GCM output
including its 16-byte authentication tag. There is no header, no length
prefix, and no version byte, which is why the salt name is the version.

**The capture below is real, and every value in it is safe to print.** It
is a genuine `startBridge` tick, driven by the §6 script against a
throwaway project, with the bridge's `syncUrl` pointed at a local HTTP
sink that recorded the request verbatim instead of the Vercel route. The
passphrase is `correct horse battery staple`, the one already published in
`ursa-major/src/bridge/capability.test.ts`, so the write secret and blob id
printed here are capabilities for nothing. **No value from the owner's own
blob appears anywhere in this document**, per the redaction rider: her
write secret is a live credential and her blob id is a live read
capability, so neither is quotable even truncated.

The request, exactly as the bridge put it on the wire (520 bytes of body
for a one-axiom, two-turn payload — a real one runs a few KB):

```
PUT /api/sync/8197f1bdb6f7a44f2255fce0455ee58ffc99824c4e83a8a83cb815e41548e9f0
content-type: application/octet-stream
x-ursa-write-secret: 6ee219f85c04e99c981bbeb3c12a36edd117d6fc93ea49a42810c8c5dc1775b1
x-ursa-body-sha256: a6c3833bf7e0c4c04ce042286dc18a78e5f680a09dc33557e8793664ae9bcece
content-length: 520
```

The blob id is in the path because it always was. The write secret is in a
header specifically because the path is logged by every hop, and it is the
one derived value that must not be. You can check the whole mechanism by
hand from those two lines:

```bash
node -e 'console.log(require("node:crypto").createHash("sha256").update("6ee219f85c04e99c981bbeb3c12a36edd117d6fc93ea49a42810c8c5dc1775b1","utf8").digest("hex"))'
# 8197f1bdb6f7a44f2255fce0455ee58ffc99824c4e83a8a83cb815e41548e9f0
```

The first 48 bytes of that body, hex — 12 bytes of initialisation vector,
fresh on every push, then ciphertext:

```
eb4beccbae43a4359280618c                                              ← iv
ab69c7b9a04d16e9efc338ef1c2bfd6c75536206d47e4668492e1816ec916559a9fecdd9  ← ciphertext begins
```

The plaintext under it is the `OverlayPayload` declared in
`ursa-major/src/bridge/index.ts`, printed by the same script from the
`tick()` return value:

```json
{
  "schemaVersion": "0.1.0",
  "project": "ursa-minor-site-tWc6iC",
  "sessionFile": "session.jsonl",
  "updatedAt": "2026-09-28T02:01:39.017Z",
  "userTurns": 2,
  "verdict": {
    "accepted": true,
    "step": 1,
    "quote": "yesss finallyyy!! lol",
    "basis": "read-from-chat",
    "confidence": "stated"
  },
  "tuning": [
    {
      "statement": "Ship the smallest thing that can be looked at, then correct it on the render",
      "domain": "process",
      "polarity": "prefer",
      "basis": "mixed",
      "evidenceCount": 3,
      "tension": false,
      "status": "active"
    }
  ],
  "lastRunSummary": null
}
```

The `project` name is the `mkdtemp` suffix of the throwaway directory, and
`session.jsonl` is the synthetic three-line session the script writes. The
quote is the n=1 trial's real acceptance line, which is already published
in plan §16.7 and in the ledger, reused here so the verdict field shows a
`stated` reading rather than a `null` one.

## 6. Exact commands

Reproduce the derivation change and its tests, from the repository root:

```bash
cd ursa-major
npm ci
npm test                       # vitest run — 51 tests, 6 files
npx vitest run src/bridge      # the 18 tests specific to this change
npx tsc --noEmit               # strict, include: ["src"]
```

Typecheck and build the route, from the repository root:

```bash
cd ursa-major/overlay
npm ci
npx tsc --noEmit
npx next build                 # /api/sync/[key] must stay `ƒ (Dynamic)`
```

Exercise the live route against the finding's own exploit. Terminal one:

```bash
cd ursa-major/overlay
npx next start -p 3999
```

Terminal two — the anonymous write that used to succeed:

```bash
curl -s -o /dev/null -w '%{http_code}\n' -X PUT \
  --data-binary 'attacker payload' \
  http://127.0.0.1:3999/api/sync/$(printf 'f%.0s' $(seq 1 64))
# 401
```

A write secret that is well formed but names a different blob:

```bash
curl -s -w ' %{http_code}\n' -X PUT \
  -H "x-ursa-write-secret: $(printf 'a%.0s' $(seq 1 64))" \
  -H "x-ursa-body-sha256: $(printf 'b%.0s' $(seq 1 64))" \
  --data-binary 'x' \
  http://127.0.0.1:3999/api/sync/$(printf 'f%.0s' $(seq 1 64))
# write secret does not name this key 403
```

A real capability pair, and the same pair with the body altered after the
digest was taken:

```bash
SECRET=$(node -e 'console.log(require("node:crypto").randomBytes(32).toString("hex"))')
KEY=$(node -e 'console.log(require("node:crypto").createHash("sha256").update(process.argv[1],"utf8").digest("hex"))' "$SECRET")
DIGEST=$(node -e 'console.log(require("node:crypto").createHash("sha256").update("hello").digest("hex"))')

curl -s -w ' %{http_code}\n' -X PUT \
  -H "x-ursa-write-secret: $SECRET" -H "x-ursa-body-sha256: $DIGEST" \
  --data-binary 'hello' "http://127.0.0.1:3999/api/sync/$KEY"
# passes every check and reaches put(); 500 here only because this shell
# has no BLOB_READ_WRITE_TOKEN, which is the correct state for a runner

curl -s -w ' %{http_code}\n' -X PUT \
  -H "x-ursa-write-secret: $SECRET" -H "x-ursa-body-sha256: $DIGEST" \
  --data-binary 'hellO' "http://127.0.0.1:3999/api/sync/$KEY"
# body digest mismatch 400
```

Reproduce §5's capture: drive a real `startBridge` tick against a throwaway
project and record the request the bridge sends, headers and body, by
pointing `syncUrl` at a local sink instead of Vercel. The `.mts` extension
is required — `tsx` transforms a bare `.ts` file outside the package as CJS
and refuses the top-level `await`.

```bash
cd ursa-major
cat > /tmp/capture.mts <<'TS'
import { createServer } from 'node:http'
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { startBridge } from './src/bridge/index.ts'
import type { TuningRecord } from './src/tuning/types.ts'

const project = mkdtempSync(join(tmpdir(), 'ursa-minor-site-'))
mkdirSync(join(project, '.ursa'), { recursive: true })
const tuning: TuningRecord = {
  schemaVersion: '0.1.0', owner: 'local', updatedAt: '2026-09-28T01:57:11.402Z',
  sources: [{ recordId: 'rec-0a1b2c3d', distilledAt: '2026-09-28T01:50:00.000Z',
              method: 'rlaif-claude', model: 'claude-opus-5' }],
  axioms: [{
    id: 'ax-001',
    statement: 'Ship the smallest thing that can be looked at, then correct it on the render',
    domain: 'process', polarity: 'prefer', basis: 'mixed', evidenceCount: 3,
    evidence: [{ recordId: 'rec-0a1b2c3d', kind: 'correction-loop', ref: 'loop-B',
                 steps: [41, 58, 73], quote: 'still too dark' }],
    contradicts: [], firstSeen: '2026-09-25T00:00:00.000Z',
    lastSeen: '2026-09-28T01:50:00.000Z', status: 'active',
  }],
}
writeFileSync(join(project, '.ursa', 'tuning.json'), JSON.stringify(tuning, null, 2))

let captured: any = null
const sink = createServer((req, res) => {
  const chunks: Buffer[] = []
  req.on('data', (c) => chunks.push(c))
  req.on('end', () => {
    captured = { url: req.url, headers: req.headers, body: Buffer.concat(chunks) }
    res.writeHead(204); res.end()
  })
})
await new Promise<void>((r) => sink.listen(4111, '127.0.0.1', r))

const session = join(project, 'session.jsonl')
writeFileSync(session, [
  JSON.stringify({ type: 'user', uuid: 'u1', timestamp: '2026-09-28T01:40:00.000Z',
                   message: { role: 'user', content: 'make the hero darker' } }),
  JSON.stringify({ type: 'assistant', uuid: 'a1', timestamp: '2026-09-28T01:40:10.000Z',
                   message: { role: 'assistant', content: [{ type: 'text', text: 'done' }] } }),
  JSON.stringify({ type: 'user', uuid: 'u2', timestamp: '2026-09-28T01:41:00.000Z',
                   message: { role: 'user', content: 'yesss finallyyy!! lol' } }),
].join('\n') + '\n')

const bridge = await startBridge({
  projectPath: project, passphrase: 'correct horse battery staple',
  syncUrl: 'http://127.0.0.1:4111', session, port: 7911, intervalMs: 1e9,
  runner: () => JSON.stringify({ accepted: true, tier: 'stated', step: 2,
                                 quote: 'yesss finallyyy!! lol' }),
  log: () => {},
})
const payload = await bridge.tick()
await bridge.stop()
await new Promise<void>((r) => sink.close(() => r()))

console.log('PUT ' + captured.url)
for (const h of ['content-type', 'x-ursa-write-secret', 'x-ursa-body-sha256', 'content-length'])
  console.log(h + ': ' + captured.headers[h])
console.log('bytes=' + captured.body.length)
console.log('iv=' + captured.body.subarray(0, 12).toString('hex'))
console.log('ct[0:36]=' + captured.body.subarray(12, 48).toString('hex'))
console.log(JSON.stringify(payload, null, 2))
TS
sed -i "s#'./src/#'$PWD/src/#g" /tmp/capture.mts
npx tsx /tmp/capture.mts
```

What is reproducible and what is not, exactly. The blob id
(`8197f1bd…e9f0`), the write secret (`6ee219f8…75b1`), and the body length
(520) come out identical on every run, because the first two are a pure
function of the passphrase and the third is a pure function of the payload
shape. Four things change per run and are supposed to: `updatedAt` is the
clock, `project` is the `mkdtemp` suffix, the initialisation vector is 12
fresh random bytes per push, and `x-ursa-body-sha256` therefore changes too
— it is a digest of the ciphertext, and both the plaintext's clock field
and the initialisation vector feed it. That last one is the point of the
header: it binds a specific body, not a class of bodies.

## 7. Migration: what happens to the blob that is already there

The v1 object at `sync/<v1-blobId>.bin` in the `ursa-overlay-sync` store
becomes unreachable the moment the overlay is redeployed, because the
passphrase now derives a different blob id and a different AES key. This
is cheap, and it is the correct trade, for one reason: **the blob is
derived state, not a record of anything.** `startBridge`'s `tick` rebuilds
the entire `OverlayPayload` from the session JSONL and `.ursa/tuning.json`
on every pass and pushes whenever the payload changes, so the next tick
after a restart writes a complete, current object at the new id. No
outcome record, no tuning axiom, and no verdict lives only in the blob.

The order matters, and it is one step:

1. Merge this branch and let Vercel redeploy `ursa-overlay`. Restart
   `ursa bridge <project>` afterwards. Any bridge left running against the
   redeployed route will fail its push with the explicit message added to
   `push()` in `ursa-major/src/bridge/index.ts` ("the sync server is
   running an older derivation than this bridge, or the other way round"),
   rather than a bare `403`.
2. Optionally delete the orphaned v1 object from the Vercel dashboard
   (Storage → `ursa-overlay-sync` → `sync/`). Leaving it costs a few KB
   and reveals nothing: it is still ciphertext under a key nobody sends
   any more.

There is no dual-read path and deliberately no v1 fallback, because a
route that accepted v1 ids would still accept anonymous writes at them,
which is the whole thing being removed.

## 8. Tooling

Every entry is a tool this change actually runs, with the version it ran
at here, the job it does on this path, and what it was chosen over.

| Tool | Version | Job on this path | Chosen over |
|---|---|---|---|
| Web Crypto `SubtleCrypto` (`crypto.subtle`) | built into Node 22.23.2 and every Next.js runtime | PBKDF2-HMAC-SHA256 derivation, AES-256-GCM, and the SHA-256 digests in `write-capability.ts` | `node:crypto`'s `createHash`/`pbkdf2`, which are Node-only. Web Crypto is the one API present unmodified in the bridge, the Vercel route, and the browser, which is what lets `write-capability.ts` be a single file instead of three mirrors that can silently drift. |
| `node:crypto` `webcrypto` | built into Node 22.23.2 | the same `SubtleCrypto` implementation, reached the Node way, inside `src/bridge/crypto.ts` | importing the bare global in the bridge. The explicit import is what makes the browser mirror a one-line diff, as the file's own header comment promises. |
| Next.js | declared `^16.0.0`, locked 16.3.6 | hosts the `PUT`/`GET` App Router handlers at `/api/sync/[key]` and serves the overlay page | a standalone Node service. Next is already the account's convention (`ursa-minor`, `atria-ledger`) and the route must be Vercel-native to reach the Blob store without a credential round trip. |
| `@vercel/blob` | declared `^2.8.0`, locked 2.8.0 | `put()` writes `sync/<blobId>.bin`; `list()` resolves it for `GET` | S3 plus a bucket policy, or Neon serverless Postgres `bytea`. Blob was already the plan §12 storage decision and needs no new paid service, which the $0 steady-state boundary requires. |
| Vitest | declared `^2.1.8`, ran at 2.1.9 | runs all 51 tests, including the 18 for this change, and imports `overlay/lib/*.ts` directly so the browser mirror is tested as shipped rather than as described | Jest, which needs an ESM transform for this `"type": "module"` package. Vitest runs the TypeScript sources with no build step, which is what makes a cross-directory import of the overlay's own file work. |
| TypeScript | `^5.7.2`, `strict: true` | typechecks both packages; `noEmit`, so it is a gate and never a build step | nothing. The `WriteCheck` discriminated union is the reason the route cannot forget to branch on a refusal. |
| `tsx` | `^4.19.2` | runs `src/bin/ursa.ts` and the §6 one-liner that prints a real payload | `ts-node`, slower to start, and the bridge re-execs itself per run. |
| `curl` | 8.x, preinstalled on the runner | issues the four §6 requests against `next start`, including the CORS-simple anonymous `PUT` that is the finding's exploit | a fetch script. `curl --data-binary` with no `content-type` reproduces the exact request shape a hostile page can send without a preflight. |

## 9. What this does not close

Three residuals, each already a ledger entry, each named here so the
artifact is not read as covering them.

1. **Reads of ciphertext are not gated, and cannot be by this route.**
   `put()` still uses `access: 'public'` with `addRandomSuffix: false`, so
   the object also sits at a guessable `*.public.blob.vercel-storage.com`
   URL that bypasses `/api/sync/<key>` entirely. Ciphertext is all that is
   exposed, but it means a blob cannot be revoked by changing the route.
   Ledger: "Who may write to the sync route," `access` clause.
2. **There is still no rate limit.** A caller holding a valid capability
   can write as often as it likes, and the cost exposure is now bounded by
   the passphrase rather than by a ceiling. For a one-user S0 that is the
   right bound; it is not a quota. Ledger: same entry.
3. **One salt for every user, so two users who choose the same passphrase
   still collide** — and under v2 they now share a write capability as
   well as a blob id, which makes the collision slightly worse than it was.
   The fix is a per-user salt and it is a separate decision about what the
   blob id is allowed to be. Ledger: "One salt for every user."
