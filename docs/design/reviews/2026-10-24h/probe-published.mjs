// The published set view, which the page matrix does not reach.
//
//   node probe-published.mjs states http://127.0.0.1:4971
//
// `/record` renders a field, and the set view only exists after someone
// pastes a site address into it and the browser fetches that site's
// index. So the second surface that draws a share bar is invisible to
// `shoot.mjs`, and it was invisible to every review before this one.
//
// It is driven here against a fixture this repository already ships
// (`ursa-minor/public/fixtures/site-04/`, two records, each with 6 of
// its 314 characters unclassified), served by the same local server. The
// shares on that view divide the whole finished work, so the remainder
// is the bare track, which is the one thing this surface shows that the
// record page does not.
//
// Three viewports, and the bar's own pixels at 1440.

import { execFileSync } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { launch, VIEWPORTS } from '../../review-kit/lib/browser.mjs'
import { freezeContext } from '../../review-kit/lib/freeze.mjs'

const OUT = process.argv[2] ?? 'states'
const BASE = process.argv[3] ?? 'http://127.0.0.1:4971'
const SITE = `${BASE}/fixtures/site-04/`

const lin = (c) => { const s = c / 255; return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4 }
const L = ([r, g, b]) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)
const ratio = (a, b) => { const [x, y] = [L(a), L(b)].sort((m, n) => n - m); return (x + 0.05) / (y + 0.05) }

mkdirSync(OUT, { recursive: true })
const browser = await launch()
const lines = [`the published set view at ${SITE}, frozen`, '']

for (const [vname, w, h] of VIEWPORTS) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1 })
  await freezeContext(ctx)
  const page = await ctx.newPage()
  await page.goto(`${BASE}/record`, { waitUntil: 'networkidle' })
  await page.fill('input[aria-label="the address of a published site"]', SITE)
  await page.click('button:has-text("read the site")')
  await page.waitForSelector('.rec-bar', { timeout: 30000 })
  await page.waitForTimeout(400)
  const file = join(OUT, `published-set-${vname}.png`)
  await page.screenshot({ path: file, fullPage: true })
  lines.push(`${vname}  ${w}x${h}  ->  ${file}`)

  if (vname === 'desktop') {
    const geo = await page.evaluate(() => {
      // Page coordinates, not viewport ones: the frame is a full-page
      // screenshot, so a rect read while the window is scrolled points at
      // the wrong rows. This cost one measurement that read 1.00:1
      // everywhere, which is the signature of sampling the ground.
      const bar = document.querySelector('.rec-bar')
      const b = bar.getBoundingClientRect()
      const segs = [...bar.children].map((el) => {
        const r = el.getBoundingClientRect()
        return { x: r.x + scrollX, w: r.width }
      })
      const painted = segs.reduce((n, s) => n + s.w, 0)
      return { x: b.x + scrollX, y: b.y + scrollY, w: b.width, h: b.height, segs, painted }
    })
    const py = `
from PIL import Image
im = Image.open(${JSON.stringify(file)}).convert('RGB')
for x, y in ${JSON.stringify([
      ...geo.segs.map((s) => [Math.round(s.x + s.w / 2), Math.round(geo.y + geo.h / 2)]),
      [Math.round(geo.x + geo.w - 4), Math.round(geo.y + geo.h / 2)],
    ])}:
    print(*im.getpixel((x, y)))
`
    const px = execFileSync('python3', ['-c', py], { encoding: 'utf8' })
      .trim().split('\n').map((l) => l.split(' ').map(Number))
    const night = [2, 3, 8]
    lines.push(`  bar ${Math.round(geo.w)}px wide, ${Math.round(geo.painted)}px of it painted, ` +
      `${Math.round(geo.w - geo.painted)}px of track left showing`)
    geo.segs.forEach((s, i) => {
      lines.push(`  segment ${i + 1}  w=${String(Math.round(s.w)).padStart(4)}px  ` +
        `rgb(${px[i].join(',')})  ${ratio(px[i], night).toFixed(2)}:1 against the night`)
    })
    const t = px[px.length - 1]
    lines.push(`  track       rgb(${t.join(',')})  ${ratio(t, night).toFixed(2)}:1 against the night`)
  }
  await ctx.close()
}

writeFileSync(join(OUT, 'published-set.txt'), lines.join('\n') + '\n')
console.log(lines.join('\n'))
await browser.close()
