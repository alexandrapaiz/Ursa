/**
 * Where a line break lands inside a term.
 *
 * The figures under each provenance bar are four terms separated by
 * middots: "0.0% as written", "2.1% edited", "94.4% yours", "3.5% no
 * span". A break between a figure and the word it counts turns one term
 * into two and makes the orphaned figure read as the tail of the term
 * before it. This walks every text node in the figures line, measures
 * the line box each word lands in with a Range, and reports every
 * adjacent word pair that straddles a break without a middot between
 * them.
 *
 * It reports rather than judges: "·" ending a line is a legitimate break
 * and is listed separately from a break inside a term.
 */
import { launch } from '../../../review-kit/lib/browser.mjs'
import { freezeContext } from '../../../review-kit/lib/freeze.mjs'
import { writeFileSync } from 'node:fs'

const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i === -1 ? d : process.argv[i + 1] }
const BASE = arg('base', 'http://127.0.0.1:4970')
const PATH = arg('path', '/dashboard?port=7831')
const SEL = arg('sel', '.dash-row .dash-meta')
const UNTIL = arg('until', '.dash-bar')
const OUT = arg('out', null)
const WIDTHS = arg('widths', '320,360,390,820,1440').split(',').map(Number)

const browser = await launch()
const lines = [`  base ${BASE}${PATH}   selector ${SEL}   widths ${WIDTHS.join(', ')}`, '']
let inTerm = 0
let total = 0
for (const w of WIDTHS) {
  const ctx = await browser.newContext({ viewport: { width: w, height: 1200 }, deviceScaleFactor: 1 })
  await freezeContext(ctx)
  const page = await ctx.newPage()
  await page.goto(BASE + PATH, { waitUntil: 'networkidle' })
  await page.waitForSelector(UNTIL, { timeout: 60000 })
  const found = await page.evaluate((sel) => {
    const out = []
    for (const [i, el] of [...document.querySelectorAll(sel)].entries()) {
      // every word, with the top of the line box it was laid out in
      const words = []
      const walk = document.createTreeWalker(el, NodeFilter.SHOW_TEXT)
      for (let n = walk.nextNode(); n; n = walk.nextNode()) {
        const t = n.textContent
        const re = /\S+/g
        let m
        while ((m = re.exec(t))) {
          const r = document.createRange()
          r.setStart(n, m.index)
          r.setEnd(n, m.index + m[0].length)
          const box = r.getBoundingClientRect()
          if (box.width === 0 && box.height === 0) continue
          words.push({ w: m[0], top: Math.round(box.top) })
        }
      }
      for (let k = 1; k < words.length; k++) {
        if (words[k].top === words[k - 1].top) continue
        out.push({ row: i, before: words[k - 1].w, after: words[k].w })
      }
    }
    return out
  }, SEL)
  for (const f of found) {
    total++
    // A figure and the word it counts are one term. A break between them
    // is the defect; a break at a middot is where the line is meant to
    // go, and a break anywhere inside the sentence that follows is
    // ordinary prose wrapping and is neither.
    const figure = /%$/.test(f.before)
    if (figure) inTerm++
    const verdict = figure ? 'BREAK INSIDE A FIGURE' : (f.before === '\u00b7' || f.after === '\u00b7' ? 'break at a separator' : 'prose wrap')
    lines.push(`  ${String(w).padEnd(5)} row ${String(f.row).padEnd(2)} "${f.before}" / "${f.after}"   ${verdict}`)
  }
  await ctx.close()
}
await browser.close()
lines.push('', `  ${total} line breaks in this selector; ${inTerm} of them split a figure from the word it counts.`)
const text = lines.join('\n')
console.log(text)
if (OUT) writeFileSync(OUT, text + '\n')
