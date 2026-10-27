/**
 * The horizontal gap between a tuning row's label column and the
 * statement beside it, measured on the live element at four widths.
 *
 * Read at 320 on a panel driven to a payload for the first time: the
 * space between `rule ×3` and the `+` that follows it is there on some
 * rows and gone on others, and both kinds of row carry the same label.
 * An eye can see that and cannot say why, so this asks the boxes.
 */
import { launch } from '../../../review-kit/lib/browser.mjs'
import { freezeContext } from '../../../review-kit/lib/freeze.mjs'
import { drive } from '../../../review-kit/state/panel-payload.mjs'
import { writeFileSync } from 'node:fs'

const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i === -1 ? d : process.argv[i + 1] }
const BASE = arg('base', 'http://127.0.0.1:4961')
const OUT = arg('out', 'data/tuning-gap.txt')
const WIDTHS = (arg('widths', '320,390,420,820,1440')).split(',').map(Number)

const browser = await launch()
const lines = [`base ${BASE}`, '']
lines.push('  width  row  label      label box      sign x   gap   statement box        wrap lines')
for (const w of WIDTHS) {
  const ctx = await browser.newContext({ viewport: { width: w, height: 900 }, deviceScaleFactor: 1 })
  await freezeContext(ctx)
  const page = await ctx.newPage()
  await page.goto(`${BASE}/`, { waitUntil: 'networkidle' })
  await drive(page)
  await page.waitForTimeout(400)

  const rows = await page.evaluate(() => {
    // The tuning rows are the direct children of the section that holds
    // them. Found by the label span rather than by a class, because these
    // rows are styled inline and carry none.
    const out = []
    const labels = [...document.querySelectorAll('section div > span.mono')]
      .filter((s) => /^(tension|rule ×\d+|case)$/.test(s.textContent.trim()))
    for (const lab of labels) {
      const row = lab.parentElement
      const stmt = lab.nextElementSibling
      if (!stmt) continue
      const sign = stmt.querySelector('span.mono')
      const lb = lab.getBoundingClientRect()
      const sb = stmt.getBoundingClientRect()
      const gb = sign ? sign.getBoundingClientRect() : null
      const cs = getComputedStyle(row)
      // How many lines the statement occupies, from its own client rects.
      const lineCount = stmt.getClientRects().length
      out.push({
        label: lab.textContent.trim(),
        labelL: Math.round(lb.left), labelR: Math.round(lb.right), labelW: Math.round(lb.width),
        stmtL: Math.round(sb.left), stmtW: Math.round(sb.width),
        signL: gb ? Math.round(gb.left) : null,
        gap: gb ? Math.round(gb.left - lb.right) : null,
        lines: lineCount,
        display: cs.display, gapCss: cs.gap, justify: cs.justifyContent,
      })
    }
    return out
  })

  for (const [i, r] of rows.entries()) {
    lines.push(
      `  ${String(w).padStart(5)}  ${String(i).padStart(3)}  ${r.label.padEnd(9)}  ` +
      `${String(r.labelL).padStart(4)}–${String(r.labelR).padEnd(4)} ${String(r.labelW).padStart(3)}w  ` +
      `${String(r.signL).padStart(5)}  ${String(r.gap).padStart(4)}  ` +
      `${String(r.stmtL).padStart(4)} ${String(r.stmtW).padStart(4)}w  ` +
      `${r.lines} line${r.lines === 1 ? '' : 's'}`
    )
  }
  if (rows[0]) lines.push(`         row box: display ${rows[0].display}, gap ${rows[0].gapCss}, justify-content ${rows[0].justify}`)
  lines.push('')
  await ctx.close()
}
lines.push('`gap` is the distance from the label column\'s right edge to the left')
lines.push('edge of the polarity sign. A row where it is 0 has the sign touching')
lines.push('the label; a row where it is not has a space. Two rows carrying the')
lines.push('same label and different gaps is the finding.')
const text = lines.join('\n') + '\n'
writeFileSync(OUT, text)
console.log(text)
await browser.close()
