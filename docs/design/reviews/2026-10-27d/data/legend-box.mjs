/**
 * Where the legend is in a full-page frame, so `crop.mjs` can magnify it
 * at each viewport without a box typed from guesswork. Page coordinates,
 * which is what a full-page screenshot is in; the measurement tools work
 * in viewport coordinates and the two are not the same number.
 *
 * usage: node legend-box.mjs --base <url> --page <path> [--pad N]
 */
import { launch, VIEWPORTS } from '../../../review-kit/lib/browser.mjs'

const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i === -1 ? d : process.argv[i + 1] }
const BASE = arg('base', 'http://127.0.0.1:4971')
const PAGE = arg('page', '/dashboard')
const PAD = Number(arg('pad', 6))

const browser = await launch()
for (const [name, width, height] of VIEWPORTS) {
  const ctx = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 1 })
  const page = await ctx.newPage()
  await page.goto(`${BASE}${PAGE}`, { waitUntil: 'networkidle' })
  await page.waitForSelector('.dash-bar')
  await page.waitForTimeout(1200)
  const box = await page.evaluate((pad) => {
    const l = document.querySelector('.dash-legend')
    const r = l.getBoundingClientRect()
    return {
      x: Math.max(0, Math.round(r.left + window.scrollX - pad)),
      y: Math.max(0, Math.round(r.top + window.scrollY - pad)),
      w: Math.round(r.width + pad * 2),
      h: Math.round(r.height + pad * 2),
    }
  }, PAD)
  console.log(`${name}\t${box.x},${box.y},${box.w},${box.h}`)
  await ctx.close()
}
await browser.close()
