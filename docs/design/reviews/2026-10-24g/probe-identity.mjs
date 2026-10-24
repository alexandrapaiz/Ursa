// Measure, rather than assert, how far the two Ursa Major web surfaces
// have drifted apart.
//
//   node probe-identity.mjs --base http://127.0.0.1:3000 --out data
//
// For each page it walks every element that paints and reports the
// distinct values of the four properties an identity is actually made of
// here: border-radius, box-shadow, font-family, and every colour used in
// a text or a background. The point is to answer "is this the same
// product" with a list rather than an impression.

import { mkdirSync, writeFileSync } from 'node:fs'
import { launch } from '../../review-kit/lib/browser.mjs'

const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i === -1 ? d : process.argv[i + 1] }
const BASE = arg('base', 'http://127.0.0.1:3000')
const OUT = arg('out', 'data')
const PAGES = arg('pages', '/,/dashboard').split(',')

mkdirSync(OUT, { recursive: true })

const browser = await launch()
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 })
const page = await ctx.newPage()
const out = {}

for (const path of PAGES) {
  await page.goto(BASE + path, { waitUntil: 'networkidle' })
  await page.waitForTimeout(400)
  out[path] = await page.evaluate(() => {
    const radii = new Map()
    const shadows = new Map()
    const families = new Map()
    const colours = new Map()
    const bump = (m, k) => m.set(k, (m.get(k) ?? 0) + 1)
    for (const el of document.querySelectorAll('body *')) {
      const r = el.getBoundingClientRect()
      if (r.width === 0 || r.height === 0) continue
      const s = getComputedStyle(el)
      const radius = [s.borderTopLeftRadius, s.borderTopRightRadius, s.borderBottomRightRadius, s.borderBottomLeftRadius]
      if (radius.some((v) => v !== '0px')) bump(radii, radius.join(' '))
      if (s.boxShadow !== 'none') bump(shadows, s.boxShadow)
      bump(families, s.fontFamily.split(',')[0].replace(/"/g, '').trim())
      // Only count a colour where it is actually spent: text that has
      // glyphs in it, and a background that is not transparent.
      if (el.textContent && el.textContent.trim().length > 0) bump(colours, `text ${s.color}`)
      if (s.backgroundColor !== 'rgba(0, 0, 0, 0)') bump(colours, `fill ${s.backgroundColor}`)
      if (s.borderTopWidth !== '0px' || s.borderLeftWidth !== '0px') bump(colours, `border ${s.borderTopColor}`)
    }
    const sort = (m) => [...m.entries()].sort((a, b) => b[1] - a[1]).map(([k, n]) => `${String(n).padStart(4)}  ${k}`)
    return {
      elements: document.querySelectorAll('body *').length,
      radii: sort(radii),
      shadows: sort(shadows),
      families: sort(families),
      colours: sort(colours),
    }
  })
}

await browser.close()

const lines = []
for (const [path, r] of Object.entries(out)) {
  lines.push(`==== ${path} — ${r.elements} elements ====`)
  for (const k of ['families', 'radii', 'shadows', 'colours']) {
    lines.push(`-- ${k} (${r[k].length} distinct)`)
    lines.push(...(r[k].length ? r[k] : ['    none']))
  }
  lines.push('')
}
writeFileSync(`${OUT}/identity.txt`, lines.join('\n') + '\n')
writeFileSync(`${OUT}/identity.json`, JSON.stringify(out, null, 2) + '\n')
console.log(lines.join('\n'))
