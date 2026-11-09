// Does the struck run's paint extend past its last glyph where the line wraps?
//
// The 2x crop of the expanded generation panel showed the removal's strike
// and highlight continuing to the right of "marketing" at the end of its
// first line. An inline box paints its background and its text-decoration
// across a trailing space, and L72 is the same property one component over,
// so this asks the browser for the numbers rather than trusting the crop.
import { launch } from '../../../review-kit/lib/browser.mjs'
import { freezeContext } from '../../../review-kit/lib/freeze.mjs'
import openExpanded from './state-at-opened-expanded.mjs'

const browser = await launch()
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 })
await freezeContext(ctx)
const page = await ctx.newPage()
await page.goto('http://localhost:3310/record/at', { waitUntil: 'load' })
await page.waitForTimeout(400)
await openExpanded(page)
const rows = await page.evaluate(() => {
  const out = []
  for (const el of document.querySelectorAll('span[class*="sp-"], del, ins, s')) {
    const t = el.textContent || ''
    if (!t.trim()) continue
    const boxes = [...el.getClientRects()]
    // The same content with trailing whitespace excluded from the range.
    const node = [...el.childNodes].find((n) => n.nodeType === 3)
    if (!node) continue
    const trimmedEnd = node.textContent.replace(/\s+$/, '').length
    const r = document.createRange()
    r.setStart(node, 0)
    r.setEnd(node, trimmedEnd)
    const glyphs = [...r.getClientRects()]
    if (!boxes.length || !glyphs.length) continue
    out.push({
      cls: el.getAttribute('class') || el.tagName.toLowerCase(),
      text: t.trim().slice(0, 34),
      lines: boxes.length,
      paintRight: Math.round(boxes[0].right * 100) / 100,
      glyphRight: Math.round(glyphs[0].right * 100) / 100,
      overhang: Math.round((boxes[0].right - glyphs[0].right) * 100) / 100,
      decoration: getComputedStyle(el).textDecorationLine,
    })
  }
  return out
})
await browser.close()
for (const r of rows) {
  console.log(
    `${String(r.lines).padStart(2)} line(s)  paint ${String(r.paintRight).padStart(8)}  ` +
    `glyphs ${String(r.glyphRight).padStart(8)}  overhang ${String(r.overhang).padStart(6)}px  ` +
    `${r.decoration.padEnd(14)} "${r.text}"`,
  )
}
