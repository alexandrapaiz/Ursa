/**
 * Whether the polarity tag on the dashboard holds a column, at every
 * width, and what the widest tag actually measures.
 *
 * Above 640 the stylesheet makes it one: `flex: 0 0 4.2rem` right
 * aligned, with the meta line and the command block indented to match.
 * Below 640 there is no column at all, only `margin-right: 0.15rem`, so
 * the statement starts wherever the tag happens to end and a list of
 * statements has a ragged left edge. Read at 320 off
 * `crops/units-320-before.png`: `Never introduce` begins left of its
 * four neighbours because AVOID is one character shorter than PREFER.
 */
import { launch } from '../../../review-kit/lib/browser.mjs'
import { freezeContext } from '../../../review-kit/lib/freeze.mjs'
import { writeFileSync } from 'node:fs'
const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i === -1 ? d : process.argv[i + 1] }
const BASE = arg('base', 'http://127.0.0.1:4961')
const STORE = arg('store', '7842')
const OUT = arg('out', 'data/tag-column.txt')

const browser = await launch()
const lines = [`base ${BASE}  store ${STORE}`, '']
for (const w of (arg('widths', '320,375,390,639,640,820,1440')).split(',').map(Number)) {
  const ctx = await browser.newContext({ viewport: { width: w, height: 900 }, deviceScaleFactor: 1 })
  await freezeContext(ctx)
  const page = await ctx.newPage()
  await page.goto(`${BASE}/dashboard?port=${STORE}`, { waitUntil: 'networkidle' })
  await page.waitForSelector('.dash-bar', { timeout: 30000 })
  await page.waitForTimeout(1000)
  const r = await page.evaluate(() => {
    const rows = [...document.querySelectorAll('.dash-row-stated .dash-statement')]
      .filter((p) => p.querySelector('.dash-tag'))
      .map((p) => {
        const tag = p.querySelector('.dash-tag')
        const txt = p.querySelector('.dash-statement-text')
        return {
          tag: tag.textContent.trim(),
          tagW: +tag.getBoundingClientRect().width.toFixed(2),
          textL: +txt.getBoundingClientRect().left.toFixed(2),
        }
      })
    // The natural width of each tag string, measured in the tag's own
    // type rather than estimated from a character count: it is uppercase
    // with 0.06em of letter-spacing, so no per-character guess is right.
    const model = document.querySelector('.dash-tag')
    const cs = getComputedStyle(model)
    const probe = document.createElement('span')
    probe.style.cssText = `position:absolute;visibility:hidden;white-space:nowrap;font:${cs.font};letter-spacing:${cs.letterSpacing};text-transform:${cs.textTransform}`
    document.body.append(probe)
    const nat = {}
    for (const s of ['prefer', 'avoid']) { probe.textContent = s; nat[s] = +probe.getBoundingClientRect().width.toFixed(2) }
    probe.remove()
    return { rows, nat, fontSize: cs.fontSize, flexBasis: getComputedStyle(model).flexBasis }
  })
  const edges = [...new Set(r.rows.map((x) => x.textL))]
  lines.push(`  ${String(w).padStart(5)}  tag font ${r.fontSize}  flex-basis ${r.flexBasis}`)
  for (const row of r.rows) lines.push(`         ${row.tag.padEnd(7)} tag ${String(row.tagW).padStart(6)}w   statement starts at ${row.textL}`)
  lines.push(`         natural: PREFER ${r.nat.prefer}px, AVOID ${r.nat.avoid}px, difference ${(r.nat.prefer - r.nat.avoid).toFixed(2)}px`)
  lines.push(`         distinct statement left edges: ${edges.length} (${edges.join(', ')})  ${edges.length === 1 ? 'column' : 'RAGGED'}`)
  lines.push('')
  await ctx.close()
}
lines.push('One distinct left edge is a column. More than one is a list of')
lines.push('statements whose left edge moves with the length of the word beside it.')
const text = lines.join('\n') + '\n'
writeFileSync(OUT, text)
console.log(text)
await browser.close()
