// Verify every hover state on the site by photographing the pair.
//
//   node verify-hover.mjs --base http://127.0.0.1:4993 --out ../reviews/YYYY-MM-DD/states
//   node verify-hover.mjs --base ... --out /tmp/x --only quiet-link
//
// For each target this takes two frames of the same element over the same
// frozen sky, one at rest and one hovered and settled, writes them as
// `rest/<label>.png` and `hover/<label>.png`, and records what the computed
// style did. `diff-frames.py rest hover` then says how many pixels the
// hover is worth. That number is the first evidence this seat has ever had
// about a hover state, because until 2026-10-24i the hover capture was not
// frozen and every hover frame differed from itself by more than most
// hovers are worth: 27,760 pixels of starfield against a wash of a few
// hundred.
//
// **Why the pair and not the hovered frame alone.** Three of this site's
// hover rules do not touch the element you hover. `.mark-link:hover .mark`
// and `.rec-row:hover:not(:disabled) .rec-row-id` style a descendant, so an
// instrument that reads computed style off the hovered element reports
// "nothing changed" for them and is wrong in the one direction that looks
// like a finding. The pixels of the element's own box catch what the
// property read misses, and the property read catches what a wash too faint
// to register in a PNG misses. Neither alone is the measurement.
//
// **Why `disabled` is printed in bold.** The home page's `.cta` is
// `disabled`, and `.cta:not(:disabled):hover` therefore correctly does
// nothing. Pointed at it, a hover tool reports a transform of `none`
// through an entire 340ms sweep, which is pixel-for-pixel what a broken
// spring reports. The 2026-10-25 run spent four captures on that before
// reading the markup. A verdict of `by-design-disabled` is this file
// refusing to let the next run pay that again.

import { mkdirSync, writeFileSync } from 'node:fs'
import { launch } from './lib/browser.mjs'
import { freezeContext } from './lib/freeze.mjs'
import { drive as drivePanelPayload } from './state/panel-payload.mjs'

const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i === -1 ? d : process.argv[i + 1] }
const BASE = arg('base', 'http://127.0.0.1:4488')
// The overlay is a second product on a second port, and until 2026-10-27
// this file had no way to name it, so every hover rule in
// `ursa-major/overlay/` was outside the only instrument that checks
// hover rules. A target declares `app: 'overlay'` and is resolved
// against this. Absent, those targets are reported as unreached rather
// than skipped, because a target that vanishes when you forget a flag
// is the same silence this file was written to end.
const OVERLAY = arg('overlay-base', null)
// The port `ursa serve` holds for the dashboard's store. Written into
// the target's path rather than into the tool, for L34: on a host twenty
// seats share, a port is an address and not an identity.
const STORE = arg('store', null)
const OUT = arg('out', '/tmp/states')
const ONLY = arg('only', null)
const PAD = Number(arg('pad', 10))
const WIDTH = Number(arg('width', 1440))
const HEIGHT = Number(arg('height', 900))
// The settle after the pointer lands. The longest transition in this
// stylesheet is the 340ms spring lift, and a spring overshoots before it
// arrives, so a frame taken at 340ms is not the resting hover state. Every
// animation still running at this point is additionally scrubbed to its own
// end, which makes the frame a fixed point rather than a late sample.
const SETTLE = Number(arg('settle', 520))

// Every hover rule in ursa-minor/app/globals.css, by the page that has one.
// Kept here rather than discovered, because a rule that stops matching any
// element is itself the finding and a discovered list would hide it.
const TARGETS = [
  { label: 'cta-home',           path: '/',                     sel: '.cta' },
  { label: 'rec-action-home',    path: '/',                     sel: '.rec-action' },
  { label: 'quiet-link-404',     path: '/this-page-does-not-exist', sel: '.quiet-link' },
  { label: 'mark-link-404',      path: '/this-page-does-not-exist', sel: '.mark-link' },
  { label: 'rec-action-index',   path: '/record',               sel: '.rec-action' },
  // `.rec-row` does not exist on `/record` until a reader pastes the
  // address of a published site and that site's index comes back, so the
  // set view is invisible to any instrument that only loads a URL. Driven
  // here against the fixture this repository already ships, the same one
  // `reviews/2026-10-24h/probe-published.mjs` uses. Without the drive this
  // file called the row MISSING, which reads as a dead CSS rule and was a
  // page that had not been asked for anything yet.
  {
    label: 'rec-row-index', path: '/record', sel: '.rec-row', until: '.rec-row',
    drive: async (page, base) => {
      await page.fill('input[aria-label="the address of a published site"]', `${base}/fixtures/site-04/`)
      await page.click('button:has-text("read the site")')
    },
  },
  { label: 'rec-action-record',  path: '/record/mini-fixture',  sel: '.rec-action' },
  { label: 'sp-verbatim',        path: '/record/mini-fixture',  sel: '.sp-survived_verbatim' },
  { label: 'sp-mutated',         path: '/record/mini-fixture',  sel: '.sp-survived_mutated' },
  { label: 'sp-ngp',             path: '/record/mini-fixture',  sel: '.sp-no_generation_provenance' },

  // Every hover rule in `ursa-major/overlay/`, added 2026-10-27. There
  // are exactly three of them, from
  //   grep -n ':hover' app/globals.css app/dashboard/dashboard.css
  // and before this run none was in this list, so the 2026-10-26d run's
  // hover on the panel's two controls and the 2026-10-26e run's reading
  // of `.dash-action` were both verified by pointing a scrubber at a
  // selector by hand. Which works, does not scale, and means a hover on
  // this product could be deleted with no instrument noticing. Kept
  // enumerated here for the same reason the eleven above are: a rule
  // that stops matching anything is the finding.
  {
    label: 'panel-run-overlay', app: 'overlay', path: '/', sel: '.panel-run',
    until: '.panel-action', drive: (page) => drivePanelPayload(page),
  },
  {
    // `misread?`. Drawn only when the payload carries a verdict with a
    // quote, which is why `state-panel-unlocked.mjs` could not reach it
    // and this target uses the payload module instead.
    label: 'panel-action-overlay', app: 'overlay', path: '/', sel: '.panel-action',
    until: '.panel-action', drive: (page) => drivePanelPayload(page),
  },
  {
    // The dashboard's `forget this` / `withdraw this` control. Its path
    // carries the store port, so this target is reached only when the
    // caller passes `--store`.
    label: 'dash-action-overlay', app: 'overlay', path: '/dashboard', sel: '.dash-action',
    store: true, until: '.dash-bar',
  },
]

// The properties any hover rule in this stylesheet touches, plus the ones a
// hover rule would plausibly reach for next.
const PROPS = [
  'color', 'background-color', 'border-top-color', 'border-bottom-color',
  'text-decoration-color', 'transform', 'opacity', 'box-shadow',
  'outline-color', 'text-underline-offset',
]

// Read the properties off the element and everything under it, so a rule
// that styles a descendant is seen. Keyed by position, because that is
// stable between the two reads of one unchanged DOM.
const readTree = (el, props) => {
  const out = []
  const walk = (node, path) => {
    const cs = getComputedStyle(node)
    const rec = { path, tag: node.tagName.toLowerCase(), cls: node.className || '' }
    for (const p of props) rec[p] = cs.getPropertyValue(p)
    out.push(rec)
    let i = 0
    for (const child of node.children) walk(child, `${path}/${i++}`)
  }
  walk(el, '')
  return out
}

mkdirSync(`${OUT}/rest`, { recursive: true })
mkdirSync(`${OUT}/hover`, { recursive: true })

const browser = await launch()
const lines = []
const rows = []

const ctx0 = await browser.newContext({ viewport: { width: WIDTH, height: HEIGHT }, deviceScaleFactor: 1, reducedMotion: 'no-preference' })
const probe = await ctx0.newPage()
await probe.goto(`${BASE}/`, { waitUntil: 'networkidle' })
// If this is false every hover rule on the site is behind a media query
// that does not match, and every verdict below would read `no-hover-rule`
// for a reason that has nothing to do with the site.
const hoverMedia = await probe.evaluate(() => ({
  hover: matchMedia('(hover: hover)').matches,
  anyHover: matchMedia('(any-hover: hover)').matches,
  pointer: matchMedia('(pointer: fine)').matches,
  reduced: matchMedia('(prefers-reduced-motion: reduce)').matches,
}))
await ctx0.close()
lines.push(`harness: (hover:hover)=${hoverMedia.hover}  (any-hover:hover)=${hoverMedia.anyHover}  (pointer:fine)=${hoverMedia.pointer}  (prefers-reduced-motion:reduce)=${hoverMedia.reduced}`)
if (!hoverMedia.hover) lines.push('WARNING: (hover: hover) does not match in this harness, so every verdict below is about the harness and not about the site.')
lines.push(`viewport: ${WIDTH}x${HEIGHT}   settle: ${SETTLE}ms   frames: frozen (clock pinned, Math.random seeded)`)
lines.push('')

for (const t of TARGETS) {
  if (ONLY && t.label !== ONLY) continue

  // Resolve the target's own origin. A target this run cannot reach is
  // printed with the flag that would have reached it, never dropped:
  // the whole point of an enumerated list is that an absence shows.
  const origin = t.app === 'overlay' ? OVERLAY : BASE
  if (!origin) {
    lines.push(`${t.label.padEnd(20)} ${'NOT-REACHED'.padEnd(22)} ${t.sel} needs --overlay-base, so nothing here is known about it`)
    rows.push({ ...t, verdict: 'not-reached', reason: 'no --overlay-base' })
    continue
  }
  if (t.store && !STORE) {
    lines.push(`${t.label.padEnd(20)} ${'NOT-REACHED'.padEnd(22)} ${t.sel} needs --store <port>, so nothing here is known about it`)
    rows.push({ ...t, verdict: 'not-reached', reason: 'no --store' })
    continue
  }
  const url = `${origin}${t.path}${t.store ? `?port=${STORE}` : ''}`

  const ctx = await browser.newContext({ viewport: { width: WIDTH, height: HEIGHT }, deviceScaleFactor: 1, reducedMotion: 'no-preference' })
  await freezeContext(ctx)
  const page = await ctx.newPage()
  await page.goto(url, { waitUntil: 'networkidle' })
  if (t.drive) await t.drive(page, origin)

  // A page that fetches its own data is a race against a fixed settle, and
  // the kit has lost that race twice before. A target on such a page
  // declares the selector that only exists once the data has landed, and a
  // gate that times out is reported as a gate that timed out rather than as
  // an absent element.
  let gate = t.until ? 'ok' : 'none'
  if (t.until) {
    try {
      await page.locator(t.until).first().waitFor({ state: 'visible', timeout: 15000 })
    } catch {
      gate = 'timeout'
    }
  }
  await page.waitForTimeout(600)

  const el = page.locator(t.sel).nth(Number(t.nth || 0))
  const count = await page.locator(t.sel).count()
  if (count === 0) {
    const why = gate === 'timeout'
      ? `GATE-TIMEOUT`
      : gate === 'none' ? `MISSING?` : `MISSING`
    const note = gate === 'timeout'
      ? `gate ${t.until} never appeared, so nothing here is known about ${t.sel}`
      : gate === 'none'
        ? `${t.sel} matches nothing on ${url}, and this target declares no content gate, so this may be a race rather than a finding`
        : `${t.sel} matches nothing on ${url} after ${t.until} appeared, so the rule is dead`
    lines.push(`${t.label.padEnd(20)} ${why.padEnd(22)} ${note}`)
    rows.push({ ...t, verdict: why.toLowerCase(), count: 0, gate })
    await ctx.close()
    continue
  }

  await el.scrollIntoViewIfNeeded()
  await page.waitForTimeout(250)

  const meta = await el.evaluate((e) => ({
    disabled: !!(e.disabled || e.getAttribute('aria-disabled') === 'true'),
    pointerEvents: getComputedStyle(e).pointerEvents,
    tag: e.tagName.toLowerCase(),
  }))

  // Park the pointer somewhere inert. Playwright's pointer starts at 0,0,
  // which on these pages is inside the header.
  await page.mouse.move(WIDTH - 2, HEIGHT - 2)
  await page.waitForTimeout(120)

  const box = await el.boundingBox()
  const clip = {
    x: Math.max(0, Math.round(box.x) - PAD),
    y: Math.max(0, Math.round(box.y) - PAD),
    width: Math.min(WIDTH, Math.round(box.width) + PAD * 2),
    height: Math.round(box.height) + PAD * 2,
  }

  const rest = await el.evaluate(readTree, PROPS)
  await page.screenshot({ path: `${OUT}/rest/${t.label}.png`, scale: 'css', clip })

  await el.hover()
  await page.waitForTimeout(SETTLE)
  // Anything still moving is taken to its own end, so the frame is the
  // settled hover state and not a late sample of a spring.
  await el.evaluate((e) => {
    for (const a of e.getAnimations({ subtree: true })) {
      const end = a.effect?.getComputedTiming?.().endTime
      if (typeof end === 'number' && isFinite(end)) { a.currentTime = end; a.pause() }
    }
  })
  await page.waitForTimeout(48)

  const hov = await el.evaluate(readTree, PROPS)
  await page.screenshot({ path: `${OUT}/hover/${t.label}.png`, scale: 'css', clip })

  const deltas = []
  for (let i = 0; i < Math.min(rest.length, hov.length); i++) {
    for (const p of PROPS) {
      if (rest[i][p] !== hov[i][p]) {
        const where = rest[i].path === '' ? 'self' : `${rest[i].tag}${rest[i].path}`
        deltas.push(`${where}.${p}: ${rest[i][p]} -> ${hov[i][p]}`)
      }
    }
  }

  const verdict = deltas.length ? 'changes'
    : meta.disabled ? 'by-design-disabled'
    : 'NO-CHANGE'

  lines.push(`${t.label.padEnd(20)} ${verdict.padEnd(22)} ${t.sel} on ${url}  (${count} match${count === 1 ? '' : 'es'}, ${meta.tag}${meta.disabled ? ', disabled' : ''}, box ${Math.round(box.width)}x${Math.round(box.height)})`)
  for (const d of deltas) lines.push(`${' '.repeat(22)}${d}`)
  rows.push({ ...t, verdict, count, meta, deltas, clip, gate })

  await ctx.close()
}

lines.push('')
lines.push('A verdict of `changes` is not yet a verified hover. It says the computed')
lines.push('style moved. Whether a reader can see it moving is the pixel count from')
lines.push(`  python3 diff-frames.py ${OUT}/rest ${OUT}/hover`)
lines.push('and a hover worth fewer pixels than the hairline it draws is a finding.')

const text = lines.join('\n') + '\n'
writeFileSync(`${OUT}/states.txt`, text)
writeFileSync(`${OUT}/states.json`, JSON.stringify({ base: BASE, harness: hoverMedia, settleMs: SETTLE, rows }, null, 2) + '\n')
console.log(text)
await browser.close()
