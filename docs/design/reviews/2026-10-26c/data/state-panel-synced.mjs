/**
 * The panel with a payload behind it (`--state` for the review kit).
 *
 * Every frame of this surface before today was shot with no bridge
 * running, because the sync route needs a Vercel Blob store and answers
 * 500 on a developer's machine. So the only state anyone has ever
 * photographed is the failure, which is also the state 2026-10-26 §7.1
 * was written about. A fix to the failure path that is never checked
 * against the success path is half a fix.
 *
 * Nothing here is mocked except the transport. The payload is encrypted
 * in the page with the same `crypto.subtle` call the bridge uses, under
 * the key the page derived from the passphrase the page was given, and
 * the page opens it with its own `decryptJson`. What is intercepted is
 * one fetch, which is the part that needs a Vercel account.
 *
 * The passphrase is a literal for the reason the unlocked state's is:
 * it opens a blob that exists only inside this browser, and the page
 * holds it in memory and never sends it.
 */
const PHRASE = 'review-kit-not-a-secret'

const PAYLOAD = {
  schemaVersion: '0.1.0',
  project: 'ursa-minor',
  // Eight characters and not a full UUID, because the redaction gate
  // refuses one anywhere in the tree and is right to: it cannot tell a
  // fabricated session id from a real one, and the one it cannot tell
  // apart is the one that leaked in Ursa incident 2. Nothing is lost
  // here. The panel draws `sessionFile.slice(0, 8)`, so this renders
  // byte-identically to the 36-character version the first draft of
  // this fixture carried.
  sessionFile: '7f3a91c4.jsonl',
  updatedAt: '2026-10-26T06:30:00.000Z',
  userTurns: 14,
  verdict: {
    accepted: true,
    step: 9,
    quote: 'that is exactly it, ship it',
    basis: 'read-from-chat',
    confidence: 'stated',
  },
  tuning: [
    { statement: 'explain the measurement before the result', domain: 'writing', polarity: 'prefer', basis: 'stated', evidenceCount: 4, tension: false, status: 'active' },
    { statement: 'open with a summary paragraph', domain: 'writing', polarity: 'avoid', basis: 'tacit', evidenceCount: 2, tension: false, status: 'active' },
    { statement: 'keep comments short', domain: 'code', polarity: 'prefer', basis: 'tacit', evidenceCount: 1, tension: true, status: 'active' },
  ],
  declaredRecords: ['ursa-minor-2026-10-26-a1b2c3d'],
  lastRunSummary: null,
}

export default async function enterSynced(page, _name) {
  // Derive in the page, encrypt in the page. Node never holds the key.
  const { blobId, bytes } = await page.evaluate(async ({ phrase, payload }) => {
    const enc = new TextEncoder()
    const material = await crypto.subtle.importKey('raw', enc.encode(phrase), 'PBKDF2', false, ['deriveBits'])
    const bits = new Uint8Array(await crypto.subtle.deriveBits(
      { name: 'PBKDF2', salt: enc.encode('ursa-overlay-v2'), iterations: 600000, hash: 'SHA-256' },
      material, 512,
    ))
    const aesKey = await crypto.subtle.importKey('raw', bits.slice(0, 32), { name: 'AES-GCM' }, false, ['encrypt'])
    const writeSecret = Array.from(bits.slice(32)).map((b) => b.toString(16).padStart(2, '0')).join('')
    const idBits = new Uint8Array(await crypto.subtle.digest('SHA-256', enc.encode(writeSecret)))
    const blobId = Array.from(idBits).map((b) => b.toString(16).padStart(2, '0')).join('')
    const iv = crypto.getRandomValues(new Uint8Array(12))
    const ct = new Uint8Array(await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv }, aesKey, enc.encode(JSON.stringify(payload)),
    ))
    const blob = new Uint8Array(iv.length + ct.length)
    blob.set(iv, 0); blob.set(ct, iv.length)
    return { blobId, bytes: Array.from(blob) }
  }, { phrase: PHRASE, payload: PAYLOAD })

  await page.route(`**/api/sync/${blobId}`, (route) => route.fulfill({
    status: 200,
    contentType: 'application/octet-stream',
    body: Buffer.from(bytes),
  }))

  await page.fill('input[type=password]', PHRASE)
  await page.press('input[type=password]', 'Enter')
  // 600,000 PBKDF2 iterations again, then the fetch above, then a
  // decrypt. Gate on the decrypted project name rather than on a
  // number of milliseconds (L15): if this text is on the page then
  // the page's own `decryptJson` opened the blob.
  await page.waitForSelector('text=ursa-minor', { timeout: 60000 })
}
