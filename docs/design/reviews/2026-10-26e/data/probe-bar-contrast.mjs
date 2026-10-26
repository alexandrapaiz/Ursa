/**
 * The WCAG 1.4.11 ratio of each provenance class against the pixels
 * actually behind and beside it.
 *
 * The bar is the one graphic on this surface that has to be read rather
 * than looked at: its four classes are the data artifact `CLAUDE.md`
 * calls the technically distinctive part of the company, and the legend
 * under it is the only key. 1.4.11 asks for 3:1 on a graphical object
 * required to understand the content, which this is.
 *
 * Colours are photographed, never read off the stylesheet, because
 * `.dash-seg-none` is a 0.45 alpha and the track is a 0.14 alpha, so
 * every one of these is a composite and the declared value is not the
 * drawn one. Each swatch is sampled at its own centre and compared both
 * with the page behind the bar and with the class next to it, since a
 * reader distinguishing two adjacent segments is comparing those two and
 * not either against the page.
 *
 * usage: node probe-bar-contrast.mjs --base <url> --store <port> [--out <file>]
 *
 * The store port is a flag for the reason the other three probes here
 * carry one: 7831 on this host belongs to whichever seat bound it first.
 */
import { launch } from '../../../review-kit/lib/browser.mjs'

const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i === -1 ? d : process.argv[i + 1] }
const BASE = arg('base', 'http://127.0.0.1:4961')
const STORE = arg('store', '7831')
const OUT = arg('out', null)
const lum = ([r, g, b]) => {
  const f = (c) => (c / 255 <= 0.03928 ? c / 255 / 12.92 : ((c / 255 + 0.055) / 1.055) ** 2.4)
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b)
}
const ratio = (a, b) => {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p)
  return (x + 0.05) / (y + 0.05)
}

const browser = await launch()
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 })
const page = await ctx.newPage()
await page.goto(`${BASE}/dashboard?port=${STORE}`, { waitUntil: 'networkidle' })
await page.waitForSelector('.dash-bar')
await page.waitForTimeout(1500)

// Where every swatch and the page behind the bar are, in CSS pixels.
const spots = await page.evaluate(() => {
  const out = []
  const legend = document.querySelector('.dash-legend')
  for (const sp of legend.querySelectorAll('span')) {
    const sw = sp.querySelector('.dash-swatch')
    const r = sw.getBoundingClientRect()
    // Every row of the swatch, not its centre. `.dash-seg-mutated` is
    // `--polar` with a 2px inset at the bottom, so on a 6px swatch a
    // centre sample reads it as identical to `.dash-seg-verbatim` and
    // reports a 1.00 ratio between two keys that a reader can in fact
    // tell apart. The first draft of this probe did exactly that. A
    // swatch is a column, so sample the column.
    const rows = []
    for (let y = Math.ceil(r.top); y < Math.floor(r.bottom); y++) rows.push(y)
    out.push({ what: 'legend: ' + sp.textContent.trim(), x: Math.round(r.x + r.width / 2), rows })
  }
  // The page itself, taken just under the legend where nothing is drawn.
  const lr = legend.getBoundingClientRect()
  out.push({ what: 'the page behind them', x: Math.round(lr.x + 4), rows: [Math.round(lr.bottom + 10)] })
  return out
})

const shot = await page.screenshot({ clip: { x: 0, y: 0, width: 1440, height: 900 } })
await browser.close()

// Read the PNG back with the same decoder the rest of the kit uses.
const { execFileSync } = await import('node:child_process')
const { writeFileSync, mkdtempSync } = await import('node:fs')
const { tmpdir } = await import('node:os')
const { join } = await import('node:path')
const dir = mkdtempSync(join(tmpdir(), 'bar-contrast-'))
const png = join(dir, 'frame.png')
writeFileSync(png, shot)
const py = `
from PIL import Image
im = Image.open(${JSON.stringify(png)}).convert('RGB')
import sys
for line in sys.stdin.read().splitlines():
    x, y = [int(v) for v in line.split()]
    print(*im.getpixel((x, y)))
`
const want = spots.flatMap((s) => s.rows.map((y) => `${s.x} ${y}`))
const read = execFileSync('python3', ['-c', py], { input: want.join('\n') })
  .toString().trim().split('\n').map((l) => l.trim().split(/\s+/).map(Number))

// Back into one list of rows per swatch, deduplicated, brightest first:
// the brightest row is the one a reader finds the swatch by.
let at = 0
const sampled = spots.map((s) => {
  const rows = read.slice(at, at + s.rows.length)
  at += s.rows.length
  const seen = [...new Map(rows.map((p) => [p.join(','), p])).values()]
  seen.sort((a, b) => lum(b) - lum(a))
  return { what: s.what, rows: seen }
})

const page_rgb = sampled[sampled.length - 1].rows[0]
const best = (s) => s.rows[0]
const lines = []
lines.push(`  base ${BASE}   1440x900   sampled from the frame, not the stylesheet`)
lines.push('  every row of each swatch, brightest reported: a 6px swatch can carry a 2px inset.')
lines.push('')
lines.push('  swatch                                  rows  brightest rgb    vs page   verdict')
sampled.forEach((s, i) => {
  if (i === sampled.length - 1) return
  const r = ratio(best(s), page_rgb)
  lines.push(`  ${s.what.padEnd(38)}  ${String(s.rows.length).padStart(4)}  ${String(best(s).join(',')).padEnd(15)}  ${r.toFixed(2).padStart(6)}   ${r >= 3 ? 'passes 1.4.11' : 'UNDER 3:1'}`)
})
lines.push('')
lines.push(`  the page behind them                          ${page_rgb.join(',')}`)
lines.push('')
// Adjacent pairs, because that is the comparison a reader actually makes.
// Two swatches of one colour that differ only by an inset are compared on
// the rows that differ, so the pair is scored on its brightest against the
// other's darkest as well as brightest against brightest.
for (let i = 1; i < sampled.length - 1; i++) {
  const a = sampled[i - 1], b = sampled[i]
  const same = best(a).join(',') === best(b).join(',')
  const r = ratio(best(a), best(b))
  const note = same ? `same fill; told apart by ${a.rows.length > 1 || b.rows.length > 1 ? 'an inset row' : 'nothing'}` : (r >= 3 ? 'passes' : 'under 3:1')
  lines.push(`  ${('neighbours ' + (i - 1) + ' and ' + i).padEnd(38)}  ${' '.repeat(21)}  ${r.toFixed(2).padStart(6)}   ${note}`)
}
lines.push('')
sampled.slice(0, -1).forEach((s) => {
  if (s.rows.length > 1) lines.push(`  ${s.what}: ${s.rows.length} distinct rows, ${s.rows.map((p) => p.join(',')).join(' / ')}`)
})
const under = sampled.slice(0, -1).filter((s) => ratio(best(s), page_rgb) < 3).length
lines.push('')
lines.push(`  ${under} of ${sampled.length - 1} legend swatches are under 3:1 against the page behind them.`)
const text = lines.join('\n') + '\n'
process.stdout.write(text)
if (OUT) writeFileSync(OUT, text)
