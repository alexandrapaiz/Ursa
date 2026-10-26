// How long a line of prose is on the overlay's dashboard, counted the way
// L9 counts it, with `COUNT_LINES` from reviews/2026-10-24f borrowed
// rather than rewritten.
//
//   node data/measure-dash-prose.mjs data/measure-dash-prose.txt \
//     http://127.0.0.1:7852 '/dashboard?port=7851'
//
// Why this run asks. L9 says the measure belongs to the type and not to
// the column, and L10 records that this organisation's prose already runs
// longer than every site it benchmarks against. The empty-record sentence
// this run added is the newest paragraph on either application, it is the
// smallest type on the page, and nobody had asked what width it landed
// at. A fix that quietly ships the longest line on the page is not a fix.

import { writeFileSync } from 'node:fs'
import { launch, VIEWPORTS } from '../../../review-kit/lib/browser.mjs'
import { freezeContext } from '../../../review-kit/lib/freeze.mjs'
import { COUNT_LINES } from '../../2026-10-24f/measure-measure.mjs'

const OUT = process.argv[2] || 'data/measure-dash-prose.txt'
const BASE = process.argv[3] || 'http://127.0.0.1:7852'
const PATH = process.argv[4] || '/dashboard?port=7851'

const browser = await launch()
const rows = []
for (const [vname, w, h] of VIEWPORTS) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1 })
  await freezeContext(ctx)
  const page = await ctx.newPage()
  await page.goto(BASE + PATH, { waitUntil: 'networkidle' })
  await page.waitForSelector('.dash-row', { timeout: 30000 })
  await page.evaluate(() => document.fonts.ready)
  for (const b of await page.evaluate(COUNT_LINES)) rows.push({ viewport: vname, ...b })
  await ctx.close()
}
await browser.close()

const line = (r) => `${r.viewport.padEnd(8)} ${r.tag.padEnd(3)} ${r.cls.padEnd(28)} ${String(r.px).padStart(4)}px ${r.size.padStart(8)}/${r.leading.padEnd(8)} ${String(r.lines).padStart(2)} lines  median ${String(r.median).padStart(3)}  max ${String(r.max).padStart(3)}  "${r.head}"`
const text = `${rows.map(line).join('\n')}\n`
writeFileSync(OUT, text)
console.log(text)
