// Does the 44px overlay on the inspector's jump control land on anything else?
//
// The 44px floor block in globals.css names the hazard: the ::after reaches
// 13px past an 18px box, and a 12px gap does not hold it off the line above.
// `mt-3` was 12px and is now `mt-4`. This reads the actual rects rather than
// trusting the arithmetic, at all three viewports, and asks two questions:
// how far the overlay reaches past the control, and whether that rectangle
// intersects the previous line box or the next Field's border.
import { launch, VIEWPORTS } from '../../../review-kit/lib/browser.mjs'
import { freezeContext } from '../../../review-kit/lib/freeze.mjs'
const BASE = process.argv[2] || 'http://localhost:4997'
const browser = await launch()
for (const [vn, w, h] of VIEWPORTS) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1 })
  await freezeContext(ctx)
  const page = await ctx.newPage()
  await page.goto(BASE + '/record/mini-fixture', { waitUntil: 'networkidle' })
  await page.locator('span.sp-survived_mutated[role="button"]').first().click()
  await page.waitForSelector('.rec-diff')
  const r = await page.evaluate(() => {
    const btn = [...document.querySelectorAll('aside button.rec-action')].find(b => b.textContent.includes('See it inside'))
    const box = btn.getBoundingClientRect()
    const after = getComputedStyle(btn, '::after')
    // The overlay's own rect, derived the way the browser lays it out: inset
    // top/bottom of (100% - 44px)/2 against the control's padding box.
    const inset = (box.height - 44) / 2
    const overlay = { top: box.top + inset, bottom: box.bottom - inset }
    // the text line directly above is the last text node of the parent Field
    const field = btn.closest('div')
    const range = document.createRange()
    const prev = btn.previousSibling
    range.selectNodeContents(field)
    range.setEndBefore(btn)
    const aboveRects = [...range.getClientRects()]
    const above = aboveRects.length ? aboveRects[aboveRects.length - 1] : null
    const nextField = field.parentElement.nextElementSibling || field.nextElementSibling
    const below = nextField ? nextField.getBoundingClientRect() : null
    return {
      content: after.content,
      box: { top: +box.top.toFixed(2), bottom: +box.bottom.toFixed(2), h: +box.height.toFixed(2) },
      overlay: { top: +overlay.top.toFixed(2), bottom: +overlay.bottom.toFixed(2), h: +(overlay.bottom - overlay.top).toFixed(2) },
      aboveBottom: above ? +above.bottom.toFixed(2) : null,
      belowTop: below ? +below.top.toFixed(2) : null,
      hasPrev: !!prev,
    }
  })
  const clearAbove = r.aboveBottom === null ? null : +(r.overlay.top - r.aboveBottom).toFixed(2)
  const clearBelow = r.belowTop === null ? null : +(r.belowTop - r.overlay.bottom).toFixed(2)
  console.log(`${vn.padEnd(8)} box ${r.box.h}px  overlay ${r.overlay.h}px  clearance above ${clearAbove}px  below ${clearBelow}px  ::after ${r.content}`)
}
await browser.close()
