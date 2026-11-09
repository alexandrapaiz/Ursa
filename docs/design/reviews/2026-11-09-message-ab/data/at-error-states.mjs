// The four refusal states of `/record/at`, driven, and the one shared rule
// that makes them hermetic.
//
// `record-at-address.tsx` has exactly four code paths that end in the
// `role="alert"` paragraph, and no instrument in this kit had entered any of
// them: the address lives in the path or in a field, the error lives in React
// state, and three of the four need a network answer to exist at all.
//
//   1. the parser refused        parseRecordAddress -> !ok        no fetch
//   2. the host answered badly   fetchFailure(a, res.status)      a status
//   3. the host answered wrong   parseRecord -> !ok               a body
//   4. the host did not answer   fetchFailure(a, 'threw')         a throw
//
// ## Nothing here reaches the public web, by construction
//
// Paths 2, 3 and 4 are about a remote host, and the grammar refuses anything
// but `https:` (`parseUrlAddress`), so a local dev server cannot stand in for
// one. Rather than fetch a real host, every request leaving the page is
// answered inside the browser with `page.route`, which is both the only way
// to make these states deterministic and the reason this run's external
// sources list is empty. `example.invalid` is the reserved TLD from RFC 2606,
// so the address in the frame cannot name anybody's real site either.
//
// The `access-control-allow-origin` header on the fulfilled responses is
// load-bearing and not boilerplate. Without it the browser refuses the
// response and the component takes its `catch`, so state 2 and state 3 would
// both photograph as state 4. That is the same split `fetchFailure`'s own
// header comment rests on, arriving here as an instrument requirement.
//
// ## Driving the field
//
// `.rec-field` is a label carrying the 44px press over the input, so a click
// at the input's own box is intercepted and times out. Focus, then type. The
// README's three-ways-a-driven-server-looks-broken block has this one.

const FIELD = 'input[aria-label="a record address"]'
const SUBMIT = 'form button[type="submit"]'

/** Wait until the alert paragraph exists and says something. */
async function untilRefused(page) {
  await page.waitForFunction(
    () => {
      const el = document.querySelector('[role="alert"]')
      return Boolean(el && el.textContent && el.textContent.trim().length > 20)
    },
    { timeout: 20000 },
  )
}

/**
 * Type an address and submit it.
 *
 * Asserts the button became enabled first. `disabled={busy || !typed}` is
 * driven by React state, so a page that never hydrated accepts the keystrokes,
 * reads the value back correctly, and leaves the button disabled forever. A
 * drive that skips this check waits 30s on a click and blames the selector.
 */
async function submitAddress(page, address) {
  await page.waitForSelector(FIELD, { timeout: 15000 })
  await page.focus(FIELD)
  await page.fill(FIELD, address)
  await page.waitForFunction(
    (sel) => {
      const b = document.querySelector(sel)
      return Boolean(b) && !b.disabled
    },
    SUBMIT,
    { timeout: 15000 },
  )
  await page.click(SUBMIT)
  await untilRefused(page)
}

/** Answer every request to a host that is not this server, in the browser. */
async function interceptRemote(page, handler) {
  await page.route(
    (url) => url.hostname !== 'localhost' && url.hostname !== '127.0.0.1',
    handler,
  )
}

/** 1. The parser refused, which costs no request at all. */
export async function parserRefused(page) {
  await submitAddress(page, 'ursa-2026-10-18-abc1234')
}

/** 2. The host answered with a status. */
export async function statusRefused(page) {
  await interceptRemote(page, (route) =>
    route.fulfill({
      status: 404,
      contentType: 'text/plain',
      headers: { 'access-control-allow-origin': '*' },
      body: 'Not Found',
    }),
  )
  await submitAddress(page, 'url/https://example.invalid/records/ursa-2026-10-18-abc1234.json')
}

/** 3. The host answered, and what came back is not an outcome record. */
export async function notARecord(page) {
  await interceptRemote(page, (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      headers: { 'access-control-allow-origin': '*' },
      body: JSON.stringify({ hello: 'this is json and it is not a record' }),
    }),
  )
  await submitAddress(page, 'url/https://example.invalid/records/ursa-2026-10-18-abc1234.json')
}

/**
 * 4. The browser could not read the host.
 *
 * On the `pages` scheme on purpose: `fetchFailure` writes its longest sentence
 * for that pair, 414 characters with the resolved URL inside it, which is the
 * case most likely to break a measure or an edge.
 */
export async function couldNotRead(page) {
  await interceptRemote(page, (route) => route.abort('connectionrefused'))
  await submitAddress(page, 'pages/alexandrapaiz/ursa-records/ursa-2026-10-18-abc1234')
}

/**
 * And the fifth state on this page, which is not a refusal: a record OPEN at
 * its address.
 *
 * This is the surface `/record/at` exists for, and no instrument had entered
 * it either. It draws text nothing else on the site draws: the canonical
 * address echoed back, the byte count and host line, the integrity sentence,
 * and a sha256 in 10.5px monospace, all of it under an argument about exactness.
 *
 * The record served is this repository's own `public/records/mini-fixture.json`,
 * read off the dev server and handed back as the remote host's answer, so the
 * bytes are the ones `/record/mini-fixture` already renders and still nothing
 * leaves this machine.
 */
export async function openedAtAddress(page, base = 'http://localhost:3310') {
  const body = await (await fetch(`${base}/records/mini-fixture.json`)).text()
  await interceptRemote(page, (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      headers: { 'access-control-allow-origin': '*' },
      body,
    }),
  )
  await page.waitForSelector(FIELD, { timeout: 15000 })
  await page.focus(FIELD)
  await page.fill(FIELD, 'pages/alexandrapaiz/ursa-records/ursa-2026-10-18-abc1234')
  await page.waitForFunction(
    (sel) => { const b = document.querySelector(sel); return Boolean(b) && !b.disabled },
    SUBMIT,
    { timeout: 15000 },
  )
  await page.click(SUBMIT)
  // Gate on the integrity line, which only the opened state draws.
  await page.waitForFunction(
    () => document.body.textContent.includes('sha256'),
    { timeout: 20000 },
  )
}
