// The same count, on the sites the ledger names.
//
// The question is narrow: how many characters do design-led products put
// on a line of body prose at 1440? The charter's benchmark step says to
// study their craft rather than copy their look, and a measure is the
// most portable thing there is to take from them, because it transfers
// into a black-and-white identity without carrying anything of theirs.
//
//   node bench-measure.mjs data/benchmark-measure.json
//
// Two cautions from the ledger apply and are handled here. Several of
// these render in JavaScript and return nothing to a `domcontentloaded`
// probe, so every load waits for `networkidle` and for `document.fonts`.
// And a site that yields no paragraph is written down as a failed
// measurement rather than counted as a zero.

import { writeFileSync } from 'node:fs'
import { launch } from '../../review-kit/lib/browser.mjs'
import { COUNT_LINES } from './measure-measure.mjs'

const OUT = process.argv[2] || 'data/benchmark-measure.json'
const SITES = [
  'https://linear.app',
  'https://vercel.com',
  'https://stripe.com',
  'https://elicit.com',
  'https://consensus.app',
  'https://claude.com',
  'https://www.figma.com',
  'https://github.com',
]

const browser = await launch()
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 })
const page = await ctx.newPage()
const results = []
for (const url of SITES) {
  const row = { url, ok: false }
  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 45000 })
    await page.evaluate(() => document.fonts.ready)
    const blocks = await page.evaluate(COUNT_LINES)
    const med = blocks.map((b) => b.median).sort((a, b) => a - b)
    row.ok = blocks.length > 0
    row.paragraphs = blocks.length
    row.median = med[Math.floor(med.length / 2)] ?? null
    row.longest = blocks.length ? Math.max(...blocks.map((b) => b.max)) : null
    row.widest = blocks.length ? Math.max(...blocks.map((b) => b.px)) : null
    row.sizes = [...new Set(blocks.map((b) => b.size))].slice(0, 4)
    row.blocks = blocks.slice(0, 12)
  } catch (err) {
    row.error = String(err).split('\n')[0]
  }
  results.push(row)
  console.log(`${url.padEnd(26)} ${row.ok ? `${row.paragraphs} paragraphs  median ${row.median}  longest ${row.longest}  widest column ${row.widest}px` : `no measurement (${row.error || 'no paragraph over 80 chars'})`}`)
}
await browser.close()
writeFileSync(OUT, JSON.stringify(results, null, 2) + '\n')
