/**
 * The WCAG 1.4.11 ratio of every swatch in a legend against the pixels
 * actually behind it, and of each swatch's own marks against each other.
 *
 * usage: node measure-swatches.mjs --base <url> --page <path> [options]
 *   --legend <sel>    the legend container      (default .dash-legend)
 *   --item <sel>      one key inside it         (default span)
 *   --swatch <sel>    the mark inside a key     (default .dash-swatch)
 *   --until <sel>     gate the shutter on this  (default the legend)
 *   --goto <when>     navigation wait           (default networkidle)
 *   --viewport WxH    (default 1440x900)
 *   --out <file>      write the table here as well as to stdout
 *   --json [file]     write the samples as JSON
 *
 * Exit 0 the table printed. Exit 1 at least one swatch is under 3:1 by
 * both measures below. Exit 2 the legend was not on the page.
 *
 * WHY THIS IS IN THE KIT. Promoted from
 * `reviews/2026-10-26e/data/probe-bar-contrast.mjs`, which measured the
 * dashboard's four provenance keys and found one of them at 1.20:1, and
 * which the run of 2026-10-27 wanted again to check the repair. That is
 * the kit's own rule: the second run that wants a script is when it stops
 * living in a dated folder. The 2026-10-26e copy stays where it is,
 * because it is that review's evidence and not a dependency.
 *
 * WHAT IS DIFFERENT FROM THE PROBE IT CAME FROM, and it is the whole
 * reason this file exists rather than a copy.
 *
 * The probe sampled the swatch's CENTRE COLUMN, every row of it. That was
 * already the fix for its own first draft, which sampled one centre pixel
 * and so could not see `.dash-seg-mutated`'s 2px inset foot. A column sees
 * any mark that spans the width.
 *
 * It cannot see a mark that spans the height. A 1px ring drawn inside a
 * swatch puts two of its four edges on the left and right of the box,
 * where a centre column never looks, so a column-sampling probe scores an
 * outlined swatch as if it were a bare fill. This tool samples EVERY PIXEL
 * of the swatch instead, which is the only sample that cannot be fooled by
 * the orientation of the mark.
 *
 * And it reports two numbers where the probe reported one. The mark's
 * ratio against the page is what a reader finds the swatch by, and on its
 * own it is gameable: one high-contrast pixel in a flat box passes. So
 * every row also carries the SHARE of the swatch's area that clears 3:1. A
 * fill answers near 100%, a 1px ring on a 6px box answers about a third,
 * and a speck answers near nothing. A swatch passes here only if its mark
 * clears 3:1 and that mark is more than a twentieth of the swatch, and the
 * table prints both so the verdict can be checked rather than believed.
 *
 * THE MARK IS THE COLOUR FURTHEST FROM THE GROUND, not the brightest one.
 * The probe this came from took the brightest row, which is correct on a
 * night-ground page and wrong everywhere else, and the first foreign page
 * this tool was pointed at proved it: on GitHub's language legend the
 * brightest pixel in every 8x8 dot is the white page showing through the
 * circle's corners, so all seven dots scored 1.00:1 against a page they
 * are plainly visible on. Ranking by ratio against the ground instead
 * reads both directions and needs no flag for which one the page is.
 *
 * Colours are photographed, never read off the stylesheet. Three of the
 * four fills this was written for are alpha composites, so the declared
 * value is not the drawn one.
 */
import { launch } from './lib/browser.mjs'
import { execFileSync } from 'node:child_process'
import { writeFileSync, mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i === -1 ? d : process.argv[i + 1] }
const has = (n) => process.argv.includes(`--${n}`)
const BASE = arg('base', 'http://127.0.0.1:4961')
const PAGE = arg('page', '/dashboard')
const LEGEND = arg('legend', '.dash-legend')
const ITEM = arg('item', 'span')
const SWATCH = arg('swatch', '.dash-swatch')
const UNTIL = arg('until', LEGEND)
// `networkidle` is right for our own page and wrong for a public one: a
// site with a poll or a beacon never goes idle, so the navigation throws
// and a legend that is sitting right there goes unmeasured. The gate that
// matters is `--until`, so a navigation timeout is reported and not fatal.
const GOTO = arg('goto', 'networkidle')
const OUT = arg('out', null)
const JSONOUT = has('json') ? (arg('json', '').startsWith('--') ? null : arg('json', null)) : false
const [VW, VH] = arg('viewport', '1440x900').split('x').map(Number)

/** The 3:1 floor of 1.4.11, and the floor on how much of the swatch may carry it. */
const FLOOR = 3
const MIN_SHARE = 0.05

const lum = ([r, g, b]) => {
  const f = (c) => (c / 255 <= 0.03928 ? c / 255 / 12.92 : ((c / 255 + 0.055) / 1.055) ** 2.4)
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b)
}
const ratio = (a, b) => {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p)
  return (x + 0.05) / (y + 0.05)
}

const browser = await launch()
const ctx = await browser.newContext({ viewport: { width: VW, height: VH }, deviceScaleFactor: 1 })
const page = await ctx.newPage()
try {
  await page.goto(`${BASE}${PAGE}`, { waitUntil: GOTO, timeout: 60000 })
} catch (e) {
  console.error(`  note: navigation did not reach ${GOTO} (${String(e).split('\n')[0]}); waiting on ${UNTIL} instead`)
}
try {
  await page.waitForSelector(UNTIL, { timeout: 45000 })
} catch {
  await browser.close()
  console.error(`no ${UNTIL} on ${BASE}${PAGE}: the legend this tool measures was not drawn, which is an environment fault and not a verdict`)
  process.exit(2)
}
// The legend is below the fold on this page at every viewport it is
// reviewed at, and a screenshot clipped to the viewport cannot sample a
// rect that is not in it. Scroll first, then read the rects, then shoot:
// all three have to agree about where the swatch is.
await page.locator(LEGEND).scrollIntoViewIfNeeded()
await page.waitForTimeout(1500)

const spots = await page.evaluate(({ LEGEND, ITEM, SWATCH }) => {
  const out = []
  const legend = document.querySelector(LEGEND)
  for (const sp of legend.querySelectorAll(ITEM)) {
    const sw = sp.querySelector(SWATCH)
    if (!sw) continue
    const r = sw.getBoundingClientRect()
    // Every pixel of the swatch. A column sees a mark that spans the
    // width and misses one that spans the height; a rect sees both.
    const px = []
    for (let y = Math.ceil(r.top); y < Math.floor(r.bottom); y++) {
      for (let x = Math.ceil(r.left); x < Math.floor(r.right); x++) px.push([x, y])
    }
    // And one pixel just outside the swatch's left edge. 1.4.11 asks for
    // 3:1 against ADJACENT colours, and on a page this tool did not write
    // the stylesheet for, "the page below the legend" can land on
    // anything. The pixel beside the mark is the one a reader's eye
    // actually has it against.
    const near = [Math.round(r.left) - 2, Math.round(r.top + r.height / 2)]
    out.push({
      what: 'legend: ' + sp.textContent.trim().replace(/\s+/g, ' ').slice(0, 36),
      box: `${Math.round(r.width)}x${Math.round(r.height)}`,
      px,
      near,
    })
  }
  // The page itself, taken just under the legend where nothing is drawn.
  const lr = legend.getBoundingClientRect()
  out.push({ what: 'the page behind them', box: '1x1', px: [[Math.round(lr.x + 4), Math.round(lr.bottom + 10)]] })
  return out
}, { LEGEND, ITEM, SWATCH })

const shot = await page.screenshot({ clip: { x: 0, y: 0, width: VW, height: VH } })
await browser.close()

const dir = mkdtempSync(join(tmpdir(), 'swatches-'))
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
const want = spots.flatMap((s) => [...s.px, ...(s.near ? [s.near] : [])].map(([x, y]) => `${x} ${y}`))
const read = execFileSync('python3', ['-c', py], { input: want.join('\n'), maxBuffer: 1 << 28 })
  .toString().trim().split('\n').map((l) => l.trim().split(/\s+/).map(Number))

let at = 0
const sampled = spots.map((s) => {
  const px = read.slice(at, at + s.px.length)
  at += s.px.length
  const near = s.near ? read[at++] : null
  const counts = new Map()
  for (const p of px) {
    const k = p.join(',')
    const seen = counts.get(k)
    if (seen) seen.n += 1
    else counts.set(k, { rgb: p, n: 1 })
  }
  return { what: s.what, box: s.box, area: px.length, counts: [...counts.values()], near }
})

// The ground is one pixel, so its own ordering does not matter.
const ground = sampled[sampled.length - 1].counts[0].rgb
// Furthest from the ground first: the mark is whatever the page is least
// like, which is the dark dot on a white page and the light one on a night.
for (const s of sampled) s.colours = [...s.counts].sort((a, b) => ratio(b.rgb, ground) - ratio(a.rgb, ground))
const keys = sampled.slice(0, -1)
const scored = keys.map((s) => {
  const brightest = s.colours[0].rgb
  const vsPage = ratio(brightest, ground)
  const clears = s.colours.filter((c) => ratio(c.rgb, ground) >= FLOOR).reduce((n, c) => n + c.n, 0)
  const share = clears / s.area
  const bulk = [...s.colours].sort((a, b) => b.n - a.n)[0].rgb
  // The mark against the fill it sits on. For a bare fill the two are the
  // same colour and this is 1.00, which is not a failure: it means there
  // is no second mark, and `vs page` is then the whole story.
  const vsBulk = ratio(brightest, bulk)
  const vsNear = s.near ? ratio(brightest, s.near) : null
  // Scored on the page behind the legend and on the pixel beside the mark,
  // and the worse of the two is the one that decides, because a reader
  // gets whichever is in front of them.
  const worst = vsNear === null ? vsPage : Math.min(vsPage, vsNear)
  return { ...s, brightest, vsPage, vsNear, share, vsBulk, pass: worst >= FLOOR && share > MIN_SHARE }
})

const lines = []
lines.push(`  base ${BASE}${PAGE}   ${VW}x${VH}   sampled from the frame, not the stylesheet`)
lines.push(`  legend ${LEGEND}   item ${ITEM}   mark ${SWATCH}`)
lines.push('  every pixel of every swatch: a mark can run along the width or along the height.')
lines.push('  "mark" is the colour furthest from the ground in contrast, not the brightest one.')
lines.push('')
lines.push('  swatch                                   box   cols  the mark rgb     vs page  vs beside   >=3:1   mark/fill  verdict')
for (const s of scored) {
  lines.push(
    `  ${s.what.padEnd(38)}  ${s.box.padStart(5)}  ${String(s.colours.length).padStart(4)}  ` +
    `${String(s.brightest.join(',')).padEnd(15)}  ${s.vsPage.toFixed(2).padStart(6)}  ` +
    `${(s.vsNear === null ? '   n/a' : s.vsNear.toFixed(2).padStart(6)).padStart(9)}  ` +
    `${(s.share * 100).toFixed(0).padStart(4)}%  ${s.vsBulk.toFixed(2).padStart(9)}  ` +
    `${s.pass ? 'passes 1.4.11' : 'UNDER 3:1'}`
  )
}
lines.push('')
lines.push(`  the page behind them                            ${ground.join(',')}`)
lines.push('')
for (let i = 1; i < scored.length; i++) {
  const a = scored[i - 1], b = scored[i]
  const same = a.brightest.join(',') === b.brightest.join(',')
  const r = ratio(a.brightest, b.brightest)
  const note = same
    ? `same brightest mark; told apart by ${a.colours.length > 1 || b.colours.length > 1 ? 'a second mark inside one of them' : 'nothing'}`
    : (r >= FLOOR ? 'passes' : 'under 3:1, told apart by hue')
  lines.push(`  ${('neighbours ' + (i - 1) + ' and ' + i).padEnd(38)}  ${' '.repeat(38)}  ${r.toFixed(2).padStart(6)}   ${note}`)
}
lines.push('')
for (const s of scored) {
  if (s.colours.length > 1) {
    lines.push(`  ${s.what}: ${s.colours.map((c) => `${c.rgb.join(',')} x${c.n}`).join(' / ')}`)
  }
}
lines.push('')
const under = scored.filter((s) => !s.pass)
lines.push(`  ${under.length} of ${scored.length} legend swatches fail: ${under.map((s) => s.what.replace('legend: ', '')).join(', ') || 'none'}`)
lines.push(`  a swatch passes on two conditions: its brightest mark clears ${FLOOR}:1 against BOTH the page`)
lines.push(`  and the pixel beside it, and more than ${MIN_SHARE * 100}% of the swatch carries that mark, so neither`)
lines.push('  a bare dark fill nor a single bright pixel passes.')

const text = lines.join('\n') + '\n'
process.stdout.write(text)
if (OUT) writeFileSync(OUT, text)
if (JSONOUT !== false) {
  const payload = JSON.stringify({ base: BASE, page: PAGE, viewport: [VW, VH], ground, swatches: scored }, null, 2)
  if (JSONOUT) writeFileSync(JSONOUT, payload + '\n'); else process.stdout.write(payload + '\n')
}
process.exit(under.length ? 1 : 0)
