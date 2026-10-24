// How many characters are on a line of this site's prose, counted rather
// than estimated.
//
// The estimate everyone reaches for is `width / (0.5 * font-size)`, which
// is a guess about a font's average advance and is wrong by 10% or more on
// any particular sentence. This counts instead: it walks a text node one
// character at a time with a Range, watches for the top of the character's
// own rect to change, and that is a line break. So the number is the real
// count for the real sentence in the real face at the real width.
//
//   node measure-measure.mjs <out.txt> [base]
//
// The paragraphs it looks at are the ones a reader reads: every <p>, <dd>
// and <li> with more than 80 characters of text, which skips labels,
// counters and single-line captions without having to name them.

import { writeFileSync } from 'node:fs'
import { launch, VIEWPORTS } from '../../review-kit/lib/browser.mjs'
import { freezeContext } from '../../review-kit/lib/freeze.mjs'

const OUT = process.argv[2] || 'data/measure.txt'
const BASE = process.argv[3] || 'http://127.0.0.1:4961'
const PAGES = ['/', '/record', '/record/mini-fixture', '/record/at']

export const COUNT_LINES = () => {
  const out = []
  const blocks = [...document.querySelectorAll('p, dd, li')]
    .filter((el) => (el.textContent || '').trim().length > 80)
    .filter((el) => !el.querySelector('p, dd, li'))
  for (const el of blocks) {
    const node = [...el.childNodes].find((n) => n.nodeType === 3 && n.textContent.trim().length > 80)
    if (!node) continue
    const text = node.textContent
    const r = document.createRange()
    // One rect per character, grouped by the top of the line it landed on.
    const lines = []
    let top = null
    let count = 0
    for (let i = 0; i < text.length; i++) {
      r.setStart(node, i)
      r.setEnd(node, i + 1)
      const rect = r.getClientRects()[0]
      if (!rect) { count++; continue }
      if (top === null) top = rect.top
      else if (Math.abs(rect.top - top) > 1) { lines.push(count); count = 0; top = rect.top }
      count++
    }
    lines.push(count)
    const cs = getComputedStyle(el)
    // The last line of a paragraph is short by definition, so it is not
    // evidence about the measure and is dropped when there is more than one.
    const full = lines.length > 1 ? lines.slice(0, -1) : lines
    out.push({
      tag: el.tagName.toLowerCase(),
      cls: String(el.className || '').slice(0, 28),
      px: Math.round(el.getBoundingClientRect().width),
      size: cs.fontSize,
      leading: cs.lineHeight,
      lines: lines.length,
      max: Math.max(...full),
      median: full.slice().sort((a, b) => a - b)[Math.floor(full.length / 2)],
      head: text.trim().slice(0, 34),
    })
  }
  return out
}

const browser = await launch()
const rows = []
for (const [vname, w, h] of VIEWPORTS) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1 })
  await freezeContext(ctx)
  const page = await ctx.newPage()
  for (const path of PAGES) {
    await page.goto(BASE + path, { waitUntil: 'networkidle' })
    await page.evaluate(() => document.fonts.ready)
    for (const b of await page.evaluate(COUNT_LINES)) rows.push({ viewport: vname, path, ...b })
  }
  await ctx.close()
}
await browser.close()

const line = (r) => `${r.viewport.padEnd(8)} ${r.path.padEnd(22)} ${r.tag.padEnd(3)} ${String(r.px).padStart(4)}px ${r.size.padStart(8)}/${r.leading.padEnd(8)} ${String(r.lines).padStart(2)} lines  median ${String(r.median).padStart(3)}  max ${String(r.max).padStart(3)}  "${r.head}"`
const by = (v) => rows.filter((r) => r.viewport === v)
const summary = VIEWPORTS.map(([v]) => {
  const m = by(v).map((r) => r.median).sort((a, b) => a - b)
  const x = by(v).map((r) => r.max)
  return `${v.padEnd(8)} ${String(by(v).length).padStart(3)} paragraphs   median measure ${m[Math.floor(m.length / 2)]} chars   longest line ${Math.max(...x)} chars`
}).join('\n')

const text = `${rows.map(line).join('\n')}\n\n${summary}\n`
writeFileSync(OUT, text)
console.log(summary)
