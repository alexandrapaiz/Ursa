// Photograph the site and measure each frame, at the three viewports this
// seat is told to review at.
//
//   node shoot.mjs --out ../reviews/YYYY-MM-DD/after
//   node shoot.mjs --out /tmp/x --only phone --pages /,/record
//
// Each frame is a full-page PNG at 1x, and each one is measured for
// horizontal overflow at the same time, because "no page overflows" is a
// claim that should come from `scrollWidth` and not from squinting.
// Overflow is reported as a table on stdout; the reading of the pixels is
// the seat's own job and cannot be delegated to this file.

import { mkdirSync, writeFileSync } from 'node:fs'
import { launch, VIEWPORTS } from './lib/browser.mjs'

const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i === -1 ? d : process.argv[i + 1] }
const OUT = arg('out', '/tmp/shots')
const BASE = arg('base', 'http://127.0.0.1:4488')
const ONLY = arg('only', null)
const PAGES = arg('pages', '/,/record,/record/mini-fixture,/record/at,/this-page-does-not-exist').split(',')

mkdirSync(OUT, { recursive: true })
const slug = (p) => (p === '/' ? 'home' : p.replace(/^\/|\/$/g, '').replace(/\//g, '-'))

const browser = await launch()
const rows = []
for (const [vname, w, h] of VIEWPORTS) {
  if (ONLY && ONLY !== vname) continue
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1 })
  const page = await ctx.newPage()
  for (const path of PAGES) {
    const name = `${slug(path)}-${vname}`
    const status = (await page.goto(BASE + path, { waitUntil: 'networkidle' }))?.status()
    await page.waitForTimeout(400)
    await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: true, scale: 'css' })
    const m = await page.evaluate(() => {
      const d = document.documentElement
      // Which element is the widest, if anything is. Naming the culprit is
      // the difference between a number and a fix.
      let worst = null
      if (d.scrollWidth > d.clientWidth) {
        for (const el of document.querySelectorAll('*')) {
          const r = el.getBoundingClientRect()
          if (r.right <= d.clientWidth + 1) continue
          if (!worst || r.right > worst.right) worst = { right: Math.round(r.right), tag: el.tagName.toLowerCase(), cls: String(el.className || '').slice(0, 50) }
        }
      }
      return { scrollWidth: d.scrollWidth, clientWidth: d.clientWidth, height: d.scrollHeight, worst }
    })
    rows.push({ name, status, ...m })
  }
  await ctx.close()
}
await browser.close()

const line = (r) => `${r.name.padEnd(32)} ${String(r.status).padStart(3)}  ${String(r.scrollWidth).padStart(5)}/${String(r.clientWidth).padEnd(5)} overflow ${String(r.scrollWidth - r.clientWidth).padStart(4)}px  height ${String(r.height).padStart(5)}px${r.worst ? `  <- ${r.worst.tag}.${r.worst.cls} to ${r.worst.right}px` : ''}`
const report = rows.map(line).join('\n')
writeFileSync(`${OUT}/measurements.txt`, report + '\n')
console.log(report)
const bad = rows.filter((r) => r.scrollWidth > r.clientWidth)
console.log(bad.length ? `\n${bad.length} frame(s) overflow` : '\nno frame overflows its viewport')
