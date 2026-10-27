// Where each dashboard section sits in the full-page frame, so a crop is
// aimed at a measured box instead of a guessed one.
import { launch } from '../../../review-kit/lib/browser.mjs'
import { freezeContext } from '../../../review-kit/lib/freeze.mjs'
const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i === -1 ? d : process.argv[i + 1] }
const BASE = arg('base', 'http://127.0.0.1:4961')
const STORE = arg('store', '7842')
const browser = await launch()
for (const w of (arg('widths', '320,390,1440')).split(',').map(Number)) {
  const ctx = await browser.newContext({ viewport: { width: w, height: 900 }, deviceScaleFactor: 1 })
  await freezeContext(ctx)
  const page = await ctx.newPage()
  await page.goto(`${BASE}/dashboard?port=${STORE}`, { waitUntil: 'networkidle' })
  await page.waitForSelector('.dash-bar', { timeout: 30000 })
  await page.waitForTimeout(1200)
  const secs = await page.evaluate(() => [...document.querySelectorAll('.dash-section')].map((s) => {
    const r = s.getBoundingClientRect()
    return { h2: s.querySelector('h2')?.textContent ?? '(no h2)', y: Math.round(r.top + scrollY), h: Math.round(r.height), x: Math.round(r.left), w: Math.round(r.width) }
  }))
  console.log(`--- ${w} ---`)
  for (const s of secs) console.log(`  y=${String(s.y).padStart(5)} h=${String(s.h).padStart(5)} x=${String(s.x).padStart(4)} w=${String(s.w).padStart(4)}  ${s.h2}`)
  await ctx.close()
}
await browser.close()
