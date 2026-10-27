/**
 * How wide every label this column can ever draw actually is.
 *
 * The column is `minWidth: 34` with `textAlign: right`, and 34 is below
 * the natural width of four of the five labels, so the floor is doing
 * the opposite of what its comment says. Picking a better floor needs
 * the real advance of this font at this size, not an estimate, so this
 * measures the strings in the page that draws them.
 */
import { launch } from '../../../review-kit/lib/browser.mjs'
import { drive } from '../../../review-kit/state/panel-payload.mjs'
import { writeFileSync } from 'node:fs'

const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i === -1 ? d : process.argv[i + 1] }
const BASE = arg('base', 'http://127.0.0.1:4961')
const OUT = arg('out', 'data/label-widths.txt')

const browser = await launch()
const ctx = await browser.newContext({ viewport: { width: 420, height: 900 }, deviceScaleFactor: 1 })
const page = await ctx.newPage()
await page.goto(`${BASE}/`, { waitUntil: 'networkidle' })
await drive(page)

const rows = await page.evaluate(() => {
  const model = [...document.querySelectorAll('section div > span.mono')]
    .find((s) => /^(tension|rule ×\d+|case)$/.test(s.textContent.trim()))
  const cs = getComputedStyle(model)
  const probe = document.createElement('span')
  probe.style.font = cs.font
  probe.style.fontFamily = cs.fontFamily
  probe.style.fontSize = cs.fontSize
  probe.style.whiteSpace = 'nowrap'
  probe.style.position = 'absolute'
  probe.style.visibility = 'hidden'
  document.body.append(probe)
  const strings = ['case', 'tension', 'rule ×2', 'rule ×9', 'rule ×10', 'rule ×99', 'rule ×100']
  const out = strings.map((s) => {
    probe.textContent = s
    return { s, w: probe.getBoundingClientRect().width }
  })
  probe.remove()
  return { font: `${cs.fontSize} ${cs.fontFamily}`, out }
})

const lines = [`font: ${rows.font}`, '']
lines.push('  label        natural width')
for (const r of rows.out) lines.push(`  ${r.s.padEnd(11)}  ${r.w.toFixed(2)}px`)
lines.push('')
lines.push('The shipped floor is 34px. Everything above `case` is wider than it,')
lines.push('so on any row narrow enough for flex to shrink the column, the glyphs')
lines.push('leave the box and eat the 8px gap to the polarity sign.')
const text = lines.join('\n') + '\n'
writeFileSync(OUT, text)
console.log(text)
await browser.close()
