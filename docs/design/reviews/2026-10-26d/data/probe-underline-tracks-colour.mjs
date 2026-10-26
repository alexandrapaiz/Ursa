/**
 * `misread?`'s underline and its text colour, read at the same instant.
 *
 * `.panel-action` transitions `color` alone and leaves
 * `text-decoration-color` at its initial `currentcolor`, so that the two
 * cannot come apart. That is a claim about an implicit dependency, and
 * `hover.mjs` cannot check it: it pauses only the transition whose
 * `transitionProperty` matches the one property it was asked about, so
 * asking it for `text-decoration-color` leaves the colour transition
 * running live and reads an in-flight value at an unknown time. Which is
 * what happened on the first attempt, in `hover-after.txt`.
 *
 * So: scrub the colour transition by hand and read both properties out of
 * the same `getComputedStyle` call, at rest, mid-flight and at the end.
 *
 *   node docs/design/reviews/2026-10-26d/data/probe-underline-tracks-colour.mjs <base-url>
 */
import { launch } from '../../../review-kit/lib/browser.mjs'
import enterSynced from '../../2026-10-26c/data/state-panel-synced.mjs'

const BASE = process.argv[2] ?? 'http://127.0.0.1:4962'
const browser = await launch()
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 })
const page = await ctx.newPage()
await page.goto(`${BASE}/`, { waitUntil: 'networkidle' })
await enterSynced(page, 'probe')

const read = () => page.$eval('.panel-action', (e) => {
  const cs = getComputedStyle(e)
  return { color: cs.color, underline: cs.textDecorationColor, declared: e.style.textDecorationColor || '(not set inline)' }
})
const scrub = (ms) => page.$eval('.panel-action', (e, t) => {
  for (const a of e.getAnimations()) { a.pause(); a.currentTime = t }
  const cs = getComputedStyle(e)
  return { color: cs.color, underline: cs.textDecorationColor }
}, ms)

console.log('at rest:                ', JSON.stringify(await read()))
await page.$eval('.panel-action', (e) => e.scrollIntoView())
await page.hover('.panel-action')
for (const t of [0, 40, 80, 120, 160]) {
  const r = await scrub(t)
  const same = r.color === r.underline
  console.log(`hovered, scrubbed ${String(t).padStart(3)}ms:`, r.color.padEnd(22), r.underline.padEnd(22), same ? 'same' : 'DIVERGED')
}
await browser.close()
