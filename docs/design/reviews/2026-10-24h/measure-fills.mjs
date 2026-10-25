// What a wordless mark is actually worth, sampled off the rendered frame.
//
//   node measure-fills.mjs data/fills-before.txt http://127.0.0.1:4971
//
// The bar on a record page is 6px tall and carries no text, so the only
// thing that makes a segment readable is its own contrast: against the
// ground it sits on, and against the segment beside it. Both numbers have
// to come from pixels rather than from the stylesheet, because a fill
// declared at 12% alpha is a different colour over the night than it is
// over the track, and because the viewer's ground is a WebGL sky on two
// of its pages rather than a flat colour.
//
// So: screenshot the element, read the pixel at the middle of each
// segment, and read the ground three pixels above the bar. Contrast is
// WCAG 2.x, which is the floor the rest of this site is measured against
// (1.4.11 asks 3:1 of a graphical object you have to see to understand
// the page).
//
// PIL does the pixel read, as everywhere else in this kit.

import { execFileSync } from 'node:child_process'
import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { launch } from '../../review-kit/lib/browser.mjs'
import { freezeContext } from '../../review-kit/lib/freeze.mjs'

const OUT = process.argv[2] ?? 'data/fills.txt'
const BASE = process.argv[3] ?? 'http://127.0.0.1:4971'

const lin = (c) => { const s = c / 255; return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4 }
const L = ([r, g, b]) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)
const ratio = (a, b) => { const [x, y] = [L(a), L(b)].sort((m, n) => n - m); return (x + 0.05) / (y + 0.05) }
const hex = ([r, g, b]) => `rgb(${r},${g},${b})`

const dir = mkdtempSync(join(tmpdir(), 'fe-fills-'))
const readPixels = (png, points) => {
  const py = `
from PIL import Image
im = Image.open(${JSON.stringify(png)}).convert('RGB')
for x, y in ${JSON.stringify(points)}:
    print(*im.getpixel((x, y)))
`
  return execFileSync('python3', ['-c', py], { encoding: 'utf8' })
    .trim().split('\n').map((l) => l.split(' ').map(Number))
}

const browser = await launch()
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 })
await freezeContext(ctx)
const page = await ctx.newPage()

const lines = [`fills sampled off rendered frames, ${BASE}, 1440x900, frozen`, '']

for (const path of ['/record/mini-fixture']) {
  await page.goto(BASE + path, { waitUntil: 'networkidle' })
  await page.waitForTimeout(400)

  // The bar, with its segments, plus the ground just above it and the
  // legend swatch that is supposed to key the reader to each segment.
  const geo = await page.evaluate(() => {
    const bar = document.querySelector('.rec-bar')
    if (!bar) return null
    const b = bar.getBoundingClientRect()
    const segs = [...bar.children].map((el) => {
      const r = el.getBoundingClientRect()
      return { x: r.x, w: r.width, css: getComputedStyle(el).backgroundColor }
    })
    const swatches = [...document.querySelectorAll('dt > span[aria-hidden="true"]')].map((el) => {
      const r = el.getBoundingClientRect()
      // The swatch is 8px square and can land on a fractional row, so the
      // read is taken a pixel inside its top-left rather than at its
      // centre: a centre sample on an antialiased edge reports a blend of
      // the mark and the ground and understates the mark.
      return { x: r.x + 2, y: r.y + 2, css: getComputedStyle(el).backgroundColor }
    })
    return { bar: { x: b.x, y: b.y, w: b.width, h: b.height }, segs, swatches }
  })
  if (!geo) { lines.push(`${path}: no .rec-bar on this page`); continue }

  const shot = join(dir, 'page.png')
  await page.screenshot({ path: shot, fullPage: true })

  const barMidY = Math.round(geo.bar.y + geo.bar.h / 2)
  const points = [
    ...geo.segs.map((s) => [Math.round(s.x + s.w / 2), barMidY]),
    [Math.round(geo.bar.x + geo.bar.w / 2), Math.round(geo.bar.y) - 6],   // the ground above
    ...geo.swatches.map((s) => [Math.round(s.x), Math.round(s.y)]),
  ]
  const px = readPixels(shot, points)
  const segPx = px.slice(0, geo.segs.length)
  const ground = px[geo.segs.length]
  const swatchPx = px.slice(geo.segs.length + 1)

  lines.push(`${path}  bar ${Math.round(geo.bar.w)}x${Math.round(geo.bar.h)} at y=${Math.round(geo.bar.y)}`)
  lines.push(`  ground above the bar  ${hex(ground)}`)
  lines.push('')
  lines.push('  segment                 declared                       rendered        vs ground   vs next')
  geo.segs.forEach((s, i) => {
    const next = segPx[i + 1] ? ratio(segPx[i], segPx[i + 1]).toFixed(2) : '—'
    lines.push(
      `  ${String(i + 1).padEnd(2)} w=${String(Math.round(s.w)).padStart(4)}px  ${s.css.padEnd(28)}  ` +
      `${hex(segPx[i]).padEnd(16)}  ${ratio(segPx[i], ground).toFixed(2).padStart(6)}   ${String(next).padStart(6)}`,
    )
  })
  lines.push('')
  lines.push('  legend swatch           declared                       rendered        vs ground')
  geo.swatches.forEach((s, i) => {
    lines.push(
      `  ${String(i + 1).padEnd(2)}          ${s.css.padEnd(28)}  ${hex(swatchPx[i]).padEnd(16)}  ` +
      `${ratio(swatchPx[i], ground).toFixed(2).padStart(6)}`,
    )
  })
  lines.push('')
}

writeFileSync(OUT, lines.join('\n') + '\n')
console.log(lines.join('\n'))
await browser.close()
