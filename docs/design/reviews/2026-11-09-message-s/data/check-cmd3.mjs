import { launch } from '../docs/design/review-kit/lib/browser.mjs'
const browser = await launch()
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 })
const page = await ctx.newPage()
await page.goto('http://localhost:3813/', { waitUntil: 'networkidle' })
const r = await page.evaluate(() => {
  const boxes = [...document.querySelectorAll('pre, code')].slice(0, 4)
  const el = boxes[2]
  const scroller = el.scrollWidth > el.clientWidth ? el : el.closest('[class*=overflow]') || el
  const before = scroller.scrollLeft
  scroller.scrollLeft = 9999
  const after = scroller.scrollLeft
  scroller.scrollLeft = before
  // the copy button that belongs to this box
  const wrap = el.closest('div')
  const btn = wrap?.parentElement?.querySelector('button') || wrap?.querySelector('button')
  return {
    text: el.textContent.trim(),
    textLen: el.textContent.trim().length,
    scrollW: el.scrollWidth, clientW: el.clientWidth,
    scrollable: after > before, maxScroll: after,
    tabIndex: el.tabIndex, role: el.getAttribute('role'), ariaLabel: el.getAttribute('aria-label'),
    copyBtn: btn ? (btn.textContent.trim() || btn.getAttribute('aria-label')) : null,
  }
})
console.log(JSON.stringify(r, null, 1))
await browser.close()
