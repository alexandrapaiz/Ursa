/**
 * The two things the charter requires of anything this seat adds:
 * it respects `prefers-reduced-motion`, and it works on touch, where
 * there is no hover at all.
 *
 * Both are media queries, so neither can be checked by looking at the
 * page the review was shot on. Playwright can set `reducedMotion` on a
 * context, and `hasTouch` plus a tap exercises the `:active` path that
 * is the whole reason `:active` repeats what `:hover` says.
 *
 *   node docs/design/reviews/2026-10-26d/data/probe-motion-and-touch.mjs <base-url>
 */
import { launch } from '../../../review-kit/lib/browser.mjs'
import enterSynced from '../../2026-10-26c/data/state-panel-synced.mjs'

const BASE = process.argv[2] ?? 'http://127.0.0.1:4962'
const browser = await launch()

const open = async (opts) => {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, ...opts })
  const page = await ctx.newPage()
  await page.goto(`${BASE}/`, { waitUntil: 'networkidle' })
  await enterSynced(page, 'probe')
  return { ctx, page }
}

const declared = (page, sel) => page.$eval(sel, (e) => {
  const cs = getComputedStyle(e)
  return `${cs.transitionProperty} / ${cs.transitionDuration}`
})

for (const mode of ['no-preference', 'reduce']) {
  const { ctx, page } = await open({ reducedMotion: mode })
  console.log(`prefers-reduced-motion: ${mode}`)
  console.log(`  .panel-run     ${await declared(page, '.panel-run')}`)
  console.log(`  .panel-action  ${await declared(page, '.panel-action')}`)
  // and the lift itself has to be gone, not just fast
  await page.hover('.panel-run')
  await page.waitForTimeout(500)
  console.log(`  .panel-run transform while hovered: ${await page.$eval('.panel-run', (e) => getComputedStyle(e).transform)}`)
  await ctx.close()
}

// Touch, in the two halves it actually has.
//
// The first attempt at this dispatched a synthetic `pointerdown` with
// `dispatchEvent` and reported that `:active` did not fire. That was the
// probe being wrong, not the stylesheet: an untrusted event does not put
// an element into the active state, by design. So the press below is a
// real one, driven through the input pipeline.
//
// And "works on touch" is really two claims, which are easier to check
// apart than together. One, `:active` applies on a real press. Two, under
// `hover: none` the `@media (hover: hover)` block does not apply, so the
// resting state is what a finger meets before it lands. Playwright can
// emulate `reducedMotion` but not the `hover` media feature, so the second
// goes through CDP.
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, hasTouch: true, isMobile: true })
  const page = await ctx.newPage()
  const cdp = await ctx.newCDPSession(page)
  await cdp.send('Emulation.setEmulatedMedia', {
    features: [{ name: 'hover', value: 'none' }, { name: 'any-hover', value: 'none' }, { name: 'pointer', value: 'coarse' }],
  })
  await page.goto(`${BASE}/`, { waitUntil: 'networkidle' })
  await enterSynced(page, 'probe')

  console.log('touch, with the hover media feature forced to none:')
  console.log(`  matchMedia("(hover: hover)")   ${await page.evaluate(() => matchMedia('(hover: hover)').matches)}`)

  const colour = () => page.$eval('.panel-action', (e) => getComputedStyle(e).color)
  const lift = () => page.$eval('.panel-run', (e) => getComputedStyle(e).transform)

  const box = async (sel) => page.$eval(sel, (e) => { const r = e.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 } })

  // the pointer parked over the control, which on a hover-less device is
  // what a finger resting on the glass looks like: nothing should change
  const a = await box('.panel-action')
  await page.mouse.move(a.x, a.y)
  await page.waitForTimeout(300)
  console.log(`  .panel-action, pointer over it ${await colour()}  (should be the resting --dim)`)

  // a real press, which is the only thing that can answer on touch
  await page.mouse.down()
  await page.waitForTimeout(300)
  console.log(`  .panel-action, pressed         ${await colour()}  (should be --accent)`)
  await page.mouse.up()

  const r = await box('.panel-run')
  await page.mouse.move(r.x, r.y)
  await page.waitForTimeout(300)
  console.log(`  .panel-run, pointer over it    ${await lift()}  (should be none)`)
  await page.mouse.down()
  await page.waitForTimeout(400)
  console.log(`  .panel-run, pressed            ${await lift()}  (should be none: the press sits back down)`)
  const press = await page.$eval('.panel-run', (e) => getComputedStyle(e).backgroundColor)
  console.log(`  .panel-run, pressed, fill      ${press}  (should be the --line wash)`)
  await page.mouse.up()
  await ctx.close()
}
await browser.close()
