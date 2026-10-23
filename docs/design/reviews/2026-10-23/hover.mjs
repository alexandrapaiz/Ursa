import { chromium } from 'playwright'
const out = process.argv[2]
const at = Number(process.argv[3] ?? 40)
const browser = await chromium.launch()
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 })
const page = await ctx.newPage()
await page.goto('http://127.0.0.1:4466/record', { waitUntil: 'networkidle' })
await page.fill('input[type=url]', 'http://127.0.0.1:4466/fixtures/site-04/')
await page.click('button[type=submit]')
await page.waitForFunction(() => /record(s)?\s·/.test(document.body.innerText), null, { timeout: 15000 })
await page.waitForTimeout(300)
await page.locator('ul li button').first().hover()
// Scrub the transition to a fixed point so the frame is deterministic.
const state = await page.evaluate((ms) => {
  const anims = document.getAnimations().filter((a) => a.constructor.name === 'CSSTransition')
  for (const a of anims) { a.pause(); a.currentTime = ms }
  const id = document.querySelector('.rec-row-id')
  const cs = id ? getComputedStyle(id) : null
  return {
    transitions: anims.map((a) => `${a.transitionProperty} ${a.effect.getTiming().duration}ms`),
    decorationColor: cs?.textDecorationColor,
    timing: cs?.transitionTimingFunction,
    duration: cs?.transitionDuration,
  }
}, at)
await page.locator('ul').last().screenshot({ path: out })
console.log(JSON.stringify(state, null, 2))
await browser.close()
