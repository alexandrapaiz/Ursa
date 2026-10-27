/**
 * The panel with a decrypted payload in it (`--state` and `drive` for the
 * review kit).
 *
 * WHY THIS EXISTS. `state-panel-unlocked.mjs`, written 2026-10-26, derives
 * a key and reaches the unlocked view, and its own header says what it
 * cannot reach: `misread?`, which is drawn only when the payload carries a
 * verdict with a quote. No payload means no verdict, so three things on
 * this surface have never been in any frame or any probe. The verdict line
 * in its accepted colour, the quote paragraph `misread?` opens, and the
 * `written into N records` line under it. `.panel-action` is one of the
 * three hover rules this product ships and the hover instrument has never
 * been able to see it.
 *
 * HOW IT GETS ONE WITHOUT A BRIDGE. The page polls `/api/sync/<blobId>`
 * for AES-GCM ciphertext and decrypts it with a key derived from the
 * passphrase. So the ciphertext is derivable from the passphrase alone,
 * and this module makes it in the page, with `window.crypto` and the
 * constants `overlay/lib/crypto.ts` declares, then fulfils the route with
 * it. Nothing is written to any server, no blob store is touched, and the
 * real sync route is never called.
 *
 * WHAT IT IS AND IS NOT EVIDENCE OF. The bytes are a fixture, so nothing
 * here is evidence about what a real session says. What it is evidence of
 * is geometry, reachability and interaction: where the verdict line wraps,
 * whether `misread?` answers a pointer, what the quote paragraph does to
 * the footer at 320px. Read any number taken through this module as a
 * fact about the layout and never as a fact about a user.
 *
 * THE PASSPHRASE IS A LITERAL ON PURPOSE, for the reason
 * `state-panel-unlocked.mjs` already gives: it names a blob that does not
 * exist, on a page that holds it in memory and never sends it.
 */

export const PASSPHRASE = 'review-kit-not-a-secret'

/**
 * The payload the page will decrypt.
 *
 * `OverlayPayload` in `ursa-major/src/bridge/index.ts` is the shape, and
 * `data/make-panel-payload.ts` in a review folder is how a run regenerates
 * the two halves the shipped code owns: `tuning` comes out of the bridge's
 * own `tuningLines()` over a real store, and `verdict` out of the real
 * `readVerdict()` with its guards running. What is authored by hand is the
 * user's half, which is the chat text, because a fixture cannot have had a
 * conversation. This default is the frozen output of that script so the
 * module runs with no store behind it; pass your own to `drive` to use a
 * fresher one.
 */
export const DEFAULT_PAYLOAD = {
  schemaVersion: '0.1.0',
  project: 'store-demo',
  sessionFile: '0f3c9ab2-4e51-4d0b-9c77-1e6b2a8f5d10.jsonl',
  updatedAt: '2026-10-26T14:27:29.000Z',
  userTurns: 9,
  verdict: {
    accepted: true,
    step: 7,
    quote: 'that is exactly the shape I wanted, ship it',
    basis: 'read-from-chat',
    confidence: 'stated',
  },
  tuning: [
    { statement: 'Say what a number is a fact about before reporting it', domain: 'process', polarity: 'prefer', basis: 'stated', evidenceCount: 3, tension: false, status: 'active' },
    { statement: 'Never introduce colour into the black and white palette', domain: 'visual', polarity: 'avoid', basis: 'stated', evidenceCount: 2, tension: false, status: 'active' },
    { statement: 'Prefer the smallest safe diff over a rewrite', domain: 'engineering', polarity: 'prefer', basis: 'tacit', evidenceCount: 1, tension: true, status: 'active' },
    { statement: 'Replace a surface outright when its shape is wrong', domain: 'engineering', polarity: 'prefer', basis: 'tacit', evidenceCount: 1, tension: true, status: 'active' },
  ],
  declaredRecords: ['store-demo-2026-10-06-cb48940', 'store-demo-2026-10-08-c459bf1'],
  lastRunSummary: null,
}

/**
 * Make the ciphertext the page expects, in the page, and fulfil the poll
 * with it. Derivation is 600,000 PBKDF2 iterations of SHA-256 and takes a
 * couple of seconds here, which is the same cost the page itself pays.
 */
async function installSyncStub(page, payload) {
  const b64 = await page.evaluate(async ({ phrase, payload }) => {
    const enc = new TextEncoder()
    const material = await crypto.subtle.importKey('raw', enc.encode(phrase), 'PBKDF2', false, ['deriveBits'])
    const bits = new Uint8Array(await crypto.subtle.deriveBits(
      { name: 'PBKDF2', salt: enc.encode('ursa-overlay-v2'), iterations: 600000, hash: 'SHA-256' },
      material, 512,
    ))
    const aesKey = await crypto.subtle.importKey('raw', bits.slice(0, 32), { name: 'AES-GCM' }, false, ['encrypt'])
    // A fixed IV, because a fixture that encrypts differently on every run
    // makes two frames of one page differ for a reason that has nothing to
    // do with the page. The freeze exists for the same reason.
    const iv = new Uint8Array(12).fill(7)
    const ct = new Uint8Array(await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv }, aesKey, enc.encode(JSON.stringify(payload)),
    ))
    const blob = new Uint8Array(12 + ct.length)
    blob.set(iv, 0)
    blob.set(ct, 12)
    let s = ''
    for (const b of blob) s += String.fromCharCode(b)
    return btoa(s)
  }, { phrase: PASSPHRASE, payload })

  const body = Buffer.from(b64, 'base64')
  await page.route('**/api/sync/**', (route) => route.fulfill({
    status: 200,
    headers: { 'content-type': 'application/octet-stream', 'cache-control': 'no-store' },
    body,
  }))
}

/**
 * Drive the panel to the state where the payload has landed.
 *
 * Gated on the verdict line's own text rather than on a settle, because
 * the page derives a key and then polls, and both are slow here (L15).
 */
export async function drive(page, payload = DEFAULT_PAYLOAD) {
  await installSyncStub(page, payload)
  await page.fill('input[type=password]', PASSPHRASE)
  await page.press('input[type=password]', 'Enter')
  await page.waitForSelector('footer button', { timeout: 60000 })
  // `misread?` is the second button in the footer and appears only once
  // the ciphertext has been fetched and opened, so waiting for it is
  // waiting for the payload rather than for the unlock.
  await page.waitForSelector('.panel-action', { timeout: 30000 })
}

export default async function enterWithPayload(page) {
  await drive(page)
}
