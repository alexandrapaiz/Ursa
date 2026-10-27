/**
 * At phone width, when a product repeats a row of "small label, then
 * body text", does the body text share one left edge across the rows?
 *
 * THE QUESTION AND WHY IT IS THIS ONE. L32 says reuse the benchmark you
 * already own and spend the trip on something the repository cannot
 * answer. This run gave the dashboard's polarity tag a fixed column at
 * 320 and 390, where it previously had none, and chose 4.5em for the
 * gutter. Nothing but this seat's judgement was under that choice: the
 * repository's only prior art is the same stylesheet's own wide layout.
 * So the question for the web is whether a narrow viewport is where
 * products keep the column or where they give it up, and the answer is
 * a count rather than a look.
 *
 * THE RULE, stated before any site is loaded so it cannot be tuned to
 * flatter an answer. A candidate list is a parent with three or more
 * element children that share a tag and a class, where each child's own
 * subtree has at least two text-bearing elements and the first one is
 * short (under 24 characters, which is what "a label" means here). For
 * each such list, the measurement is the number of distinct left edges,
 * rounded to the pixel, of the SECOND text-bearing element across the
 * rows. One edge is a column. More is not.
 *
 * Lists whose first text-bearing element is the same length in every row
 * are discarded: a column and no column are indistinguishable when every
 * label is the same width, so such a list is not evidence either way.
 * That exclusion is the whole reason this probe can be believed, and it
 * is also the one most likely to be wrong, so the output reports how
 * many lists it removed.
 *
 * TWO CONSTRAINTS THE FIRST VERSION DID NOT HAVE, and the run that
 * believed it would have been wrong in the flattering direction. Without
 * them the rule matched a horizontal carousel on one site (8 "rows", 8
 * left edges, 2156px of spread) and a card grid on another, and reported
 * both as ragged label columns. Neither is one. So a list now also has
 * to be stacked — every row's box starting at the same left edge, each
 * one strictly below the last — and the label has to sit on the body's
 * own first line, within half a line of its top, which is what makes it
 * a label beside text rather than a heading above it. The counts the
 * loose version produced are not in this file and were not reported.
 *
 *   node bench-label-columns.mjs --out data/bench-label-columns.txt <url>...
 */
import { launch } from '../../../review-kit/lib/browser.mjs'
import { writeFileSync } from 'node:fs'

const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i === -1 ? d : process.argv[i + 1] }
const OUT = arg('out', 'data/bench-label-columns.txt')
const WIDTH = Number(arg('width', 390))
const urls = process.argv.slice(2).filter((a) => a.startsWith('http'))

const browser = await launch()
const lines = [`viewport ${WIDTH}x844, one load per site, read-only`, '']
lines.push('  site                       lists  column  ragged  discarded  label-above  not-stacked')
const detail = []

for (const url of urls) {
  const ctx = await browser.newContext({ viewport: { width: WIDTH, height: 844 }, deviceScaleFactor: 1 })
  const page = await ctx.newPage()
  let r
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 })
    await page.waitForTimeout(2500)
    r = await page.evaluate(() => {
      const textBearing = (el) => [...el.querySelectorAll('*')].filter((n) => {
        if (!n.textContent.trim()) return false
        if (n.children.length > 0) return false
        const cs = getComputedStyle(n)
        if (cs.display === 'none' || cs.visibility === 'hidden') return false
        const b = n.getBoundingClientRect()
        return b.width > 0 && b.height > 0
      })
      // Why a candidate was rejected, counted rather than dropped. The
      // tightened rule measures almost nothing on most sites, and a
      // probe that reports only "nothing measured" cannot say whether
      // that is its own narrowness or a fact about the web.
      const out = { lists: 0, column: 0, ragged: 0, discarded: 0, samples: [], rejectedAbove: 0, rejectedUnstacked: 0 }
      for (const parent of document.querySelectorAll('*')) {
        const kids = [...parent.children]
        if (kids.length < 3) continue
        const key = (e) => `${e.tagName}.${e.className}`
        if (new Set(kids.map(key)).size !== 1) continue
        const rows = []
        for (const k of kids) {
          const tb = textBearing(k)
          if (tb.length < 2) { rows.length = 0; break }
          const label = tb[0].textContent.trim()
          if (label.length === 0 || label.length > 24) { rows.length = 0; break }
          const lb = tb[0].getBoundingClientRect()
          const bb = tb[1].getBoundingClientRect()
          const kb = k.getBoundingClientRect()
          // Beside, not above: the label's top is within half a line of
          // the body's. A heading over a paragraph fails this, and should.
          if (Math.abs(lb.top - bb.top) > bb.height * 0.5) { out.rejectedAbove++; rows.length = 0; break }
          // And beside means to the left of, on the same line.
          if (lb.left >= bb.left) { rows.length = 0; break }
          rows.push({
            labelW: Math.round(lb.width),
            bodyL: Math.round(bb.left),
            rowL: Math.round(kb.left),
            rowTop: Math.round(kb.top),
          })
        }
        if (rows.length < 3) continue
        // Stacked: one column of rows, each below the last. This is what
        // the loose first version lacked, and it is what a carousel and a
        // card grid both fail.
        let stacked = new Set(rows.map((x) => x.rowL)).size === 1
        for (let i = 1; i < rows.length; i++) if (rows[i].rowTop <= rows[i - 1].rowTop) stacked = false
        if (!stacked) { out.rejectedUnstacked++; continue }
        out.lists++
        if (new Set(rows.map((x) => x.labelW)).size === 1) { out.discarded++; continue }
        const edges = new Set(rows.map((x) => x.bodyL))
        if (edges.size === 1) out.column++
        else {
          out.ragged++
          if (out.samples.length < 3) out.samples.push({ sel: key(kids[0]).slice(0, 60), n: rows.length, edges: [...edges].sort((a, b) => a - b), spread: Math.max(...edges) - Math.min(...edges) })
        }
      }
      return out
    })
  } catch (e) {
    lines.push(`  ${new URL(url).host.padEnd(24)}  LOAD FAILED: ${e.message.split('\n')[0].slice(0, 50)}`)
    await ctx.close()
    continue
  }
  const measured = r.lists - r.discarded
  lines.push(`  ${new URL(url).host.padEnd(24)}  ${String(r.lists).padStart(5)}  ${String(r.column).padStart(6)}  ${String(r.ragged).padStart(6)}  ${String(r.discarded).padStart(9)}  ${String(r.rejectedAbove).padStart(9)}  ${String(r.rejectedUnstacked).padStart(9)}${measured === 0 ? '   (nothing measured)' : ''}`)
  detail.push({ url, ...r, measured })
  await ctx.close()
}

lines.push('')
lines.push('`column` is a list whose rows share one left edge for the text beside')
lines.push('the label. `ragged` is a list where that edge moves. `discarded` is a')
lines.push('list whose labels are all the same width, where the two are')
lines.push('indistinguishable; L23 says a zero denominator reads exactly like a')
lines.push('pass, so it is printed rather than folded in.')
lines.push('')
lines.push('`label-above` is a candidate list rejected because its short first')
lines.push('element sits over the body text rather than beside it, and')
lines.push('`not-stacked` one rejected because its rows are not a single column.')
lines.push('Those two are why `lists` is small, and they are the answer this trip')
lines.push('actually returned.')
lines.push('')
for (const d of detail) {
  if (!d.samples.length) continue
  lines.push(`  ${new URL(d.url).host} — ragged lists, worst first:`)
  for (const s of d.samples.sort((a, b) => b.spread - a.spread)) {
    lines.push(`    ${s.sel}  ${s.n} rows, ${s.edges.length} edges, spread ${s.spread}px`)
  }
}
const text = lines.join('\n') + '\n'
writeFileSync(OUT, text)
console.log(text)
await browser.close()
