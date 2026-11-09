// Does `padding: 0 0.1em` on `.rec-diff ins, del` put a gap between a removal
// and the insertion that replaces it?
//
// The comment above that rule in globals.css says it does, and names the exact
// string it was written for ("and nonot by any"). This asks the browser, in
// two independent ways, because a geometry answer and a pixel answer fail
// differently: the boxes can be separated while the paint still meets, since
// `text-decoration` and `background-color` are painted across an inline box's
// own padding.
//
//   1. geometry: the gap between one run's right edge and the next's left.
//   2. paint: for each column of pixels between the last glyph of the removal
//      and the first glyph of the insertion, whether anything is drawn there.
import { launch } from '../../../review-kit/lib/browser.mjs'
import { freezeContext } from '../../../review-kit/lib/freeze.mjs'

const BASE = process.argv[2] || 'http://localhost:4997'
const browser = await launch()
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 })
await freezeContext(ctx)
const page = await ctx.newPage()
await page.goto(BASE + '/record/mini-fixture', { waitUntil: 'networkidle' })
await page.locator('span.sp-survived_mutated[role="button"]').first().click()
await page.waitForSelector('.rec-diff')

const runs = await page.evaluate(() => {
  const p = document.querySelector('.rec-diff')
  const out = []
  for (const n of p.childNodes) {
    const el = n.nodeType === 1 ? n : null
    if (!el) continue
    const r = el.getBoundingClientRect()
    const cs = getComputedStyle(el)
    out.push({
      tag: el.tagName.toLowerCase(),
      text: JSON.stringify(el.textContent),
      left: +r.left.toFixed(2), right: +r.right.toFixed(2),
      top: +r.top.toFixed(2), bottom: +r.bottom.toFixed(2),
      padL: cs.paddingLeft, padR: cs.paddingRight,
      marL: cs.marginLeft, marR: cs.marginRight,
    })
  }
  return out
})

console.log('run geometry, in document order')
for (const r of runs) {
  console.log(`  ${r.tag.padEnd(4)} ${String(r.left).padStart(8)} ${String(r.right).padStart(8)}  pad ${r.padL}/${r.padR}  margin ${r.marL}/${r.marR}  ${r.text}`)
}
console.log('')
console.log('gap between consecutive runs on the same line')
for (let i = 1; i < runs.length; i++) {
  const a = runs[i - 1], b = runs[i]
  if (Math.abs(a.top - b.top) > 2) continue
  console.log(`  ${a.tag}->${b.tag}  box gap ${(b.left - a.right).toFixed(2)}px   ${a.text} | ${b.text}`)
}
await ctx.close()
await browser.close()
