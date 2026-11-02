// What is drawn at phone (19,110) in the dashboard frame, and why does it
// render two ways. Written for reviews/2026-11-02 §4.
import { launch } from '../../../review-kit/lib/browser.mjs'
import { freezeContext } from '../../../review-kit/lib/freeze.mjs'

const BASE = process.argv[2] ?? 'http://127.0.0.1:4971'
const PAGE = process.argv[3] ?? '/dashboard?port=7871'
const browser = await launch()
const ctx = await freezeContext(await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 }))
const page = await ctx.newPage()
await page.goto(BASE + PAGE, { waitUntil: 'networkidle' })
await page.waitForSelector('.dash-bar')
await page.waitForTimeout(1500)
const hit = await page.evaluate(() => {
  // The frame is full-page, so its row 110 is document y 110. Nothing is
  // painted at that point by anything `elementsFromPoint` returns, so the
  // question is which box has an EDGE there: a hairline at a fractional y
  // antialiases into one row or the next.
  const els = [...document.querySelectorAll('*')].filter((el) => {
    const r = el.getBoundingClientRect()
    return r.left <= 24 && r.right >= 14 && (Math.abs(r.top - 110) < 6 || Math.abs(r.bottom - 110) < 6)
  })
  return els.map((el) => {
    const r = el.getBoundingClientRect()
    const cs = getComputedStyle(el)
    return {
      tag: el.tagName.toLowerCase(),
      cls: String(el.className || ''),
      rect: [r.left, r.top, r.width, r.height].map((n) => Math.round(n * 100) / 100),
      radius: cs.borderRadius,
      border: `${cs.borderTopWidth} ${cs.borderTopColor}`,
      bg: cs.backgroundColor,
      text: (el.textContent || '').slice(0, 40),
    }
  })
})
console.log(JSON.stringify(hit, null, 2))
await browser.close()
