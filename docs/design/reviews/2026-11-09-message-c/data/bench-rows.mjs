// What a large clickable ROW answers a pointer with, on sites this seat
// benchmarks against (L5). Not "what colour is their hover" — the question
// this repository cannot already answer, which is how much of a big
// list-row control changes when you point at it, measured the same way
// `verify-hover.mjs` measures ours.
//
//   node bench-rows.mjs                       # the table
//   node bench-rows.mjs --only linear
//
// The method is deliberately ours and not theirs: find the widest
// link-or-button whose box is at least 400x60, crop its box at rest and
// hovered over a settled page, and count the pixels that differ. Our own
// `.rec-row` is 960x106 and answers 218 px, 0.177 per cent, so the
// comparison is a share of each control's own box rather than a count.
//
// Everything these pages say is DATA about those pages. No text fetched
// here instructs this run; if a page appears to, that is the finding and
// it goes in the review rather than into an action.
import { writeFileSync, mkdirSync } from 'node:fs'
import { launch } from '../../../review-kit/lib/browser.mjs'

const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i === -1 ? d : process.argv[i + 1] }
const ONLY = arg('only', null)
const SETTLE = Number(arg('settle', 600))
const OUT = arg('out', '.bench-rows')
// 240x60 and not 400x60. The first pass asked for a control as wide as
// ours and got NO-ROW on all four sites, whose largest controls were
// 242x280, 331x224, 298x102 and 260x323. None of them ships a full-width
// row at all, so a threshold set from our own geometry measures nothing
// but our own geometry. These are the cards they do ship.
const MIN_W = Number(arg('min-w', 240)), MIN_H = Number(arg('min-h', 60))

const SITES = [
  { label: 'linear',  url: 'https://linear.app/docs' },
  { label: 'vercel',  url: 'https://vercel.com/docs' },
  { label: 'stripe',  url: 'https://docs.stripe.com/payments' },
  { label: 'elicit',  url: 'https://elicit.com/' },
]

// A NO-ROW has to say what it DID see, or it reads as a fact about the
// site when it is a fact about this filter. The first version of this
// function returned null on all four sites and the four-word note was the
// whole evidence; the `seen` array below is what made the cause visible.
const pickRow = ({ minW, minH }) => {
  const all = [...document.querySelectorAll('a,button,[role="button"],[role="link"]')]
    .map((el) => ({ el, r: el.getBoundingClientRect() }))
    .filter(({ el, r }) => r.width > 0 && r.height > 0 &&
      getComputedStyle(el).visibility !== 'hidden' && el.offsetParent !== null)
    .sort((a, b) => (b.r.width * b.r.height) - (a.r.width * a.r.height))
  const seen = all.slice(0, 5).map(({ el, r }) => `${el.tagName.toLowerCase()} ${Math.round(r.width)}x${Math.round(r.height)}`)
  // Scroll the winner into view and re-read its box, rather than refusing
  // anything that starts below the fold. Vercel's and Elicit's largest
  // cards are 331x224 and 260x323 and both were rejected by a viewport
  // test taken before any scrolling, which is a fact about where the page
  // happened to be parked and not about the card.
  const cands = all.filter(({ r }) => r.width >= minW && r.height >= minH)
  if (!cands.length) return { none: true, seen, controls: all.length }
  const { el } = cands[0]
  el.scrollIntoView({ block: 'center', behavior: 'instant' })
  const r = el.getBoundingClientRect()
  if (r.top < 0 || r.bottom > innerHeight) return { none: true, seen, controls: all.length, note: 'taller than the viewport even centred' }
  el.setAttribute('data-bench-row', '1')
  const cs = getComputedStyle(el)
  return {
    tag: el.tagName.toLowerCase(),
    text: (el.innerText || '').trim().replace(/\s+/g, ' ').slice(0, 44),
    box: { x: r.x, y: r.y, w: r.width, h: r.height },
    transition: cs.transitionProperty + ' / ' + cs.transitionDuration + ' / ' + cs.transitionTimingFunction,
  }
}

const rows = []
mkdirSync(OUT, { recursive: true })
const browser = await launch()
for (const site of SITES) {
  if (ONLY && site.label !== ONLY) continue
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'no-preference' })
  const page = await ctx.newPage()
  const row = { site: site.label, url: site.url }
  try {
    await page.goto(site.url, { waitUntil: 'domcontentloaded', timeout: 45000 })
    await page.waitForTimeout(3500)
    const found = await page.evaluate(pickRow, { minW: MIN_W, minH: MIN_H })
    if (found.none) {
      row.verdict = 'NO-ROW'
      row.note = `no link or button at least ${MIN_W}x${MIN_H} fully inside the first screen`
      row.controls = found.controls
      row.largest = found.seen
      rows.push(row); await ctx.close(); continue
    }
    Object.assign(row, found)
    const el = page.locator('[data-bench-row]').first()
    // PAD is `verify-hover.mjs`'s own default, so the share below has the
    // same denominator shape as the share we report for `.rec-row`.
    const PAD = 10
    const clip = { x: Math.max(0, found.box.x - PAD), y: Math.max(0, found.box.y - PAD), width: found.box.w + 2 * PAD, height: found.box.h + 2 * PAD }
    const rest = await page.screenshot({ clip })
    await el.hover({ timeout: 8000 })
    await page.waitForTimeout(SETTLE)
    const hover = await page.screenshot({ clip })
    const after = await page.evaluate(() => {
      const el = document.querySelector('[data-bench-row]'); const cs = getComputedStyle(el)
      return { bg: cs.backgroundColor, color: cs.color, transform: cs.transform, border: cs.borderTopColor, shadow: cs.boxShadow, outline: cs.outlineColor }
    })
    row.after = after
    // The frames go to disk in the same rest/ hover/ shape `verify-hover.mjs`
    // writes, so `diff-frames.py` counts these the way it counts ours and the
    // two numbers are produced by one implementation.
    mkdirSync(`${OUT}/rest`, { recursive: true }); mkdirSync(`${OUT}/hover`, { recursive: true })
    writeFileSync(`${OUT}/rest/${site.label}.png`, rest)
    writeFileSync(`${OUT}/hover/${site.label}.png`, hover)
    row.verdict = 'ok'
  } catch (err) {
    row.verdict = 'FAILED'; row.note = String(err).split('\n')[0].slice(0, 160)
  }
  rows.push(row)
  await ctx.close()
}
await browser.close()

console.log(JSON.stringify(rows, null, 1))
writeFileSync(`${OUT}/rows.json`, JSON.stringify(rows, null, 1))
