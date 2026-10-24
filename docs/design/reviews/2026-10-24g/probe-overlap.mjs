// L3's open question, asked of this page: an overlay that lifts an inline
// control to 44px reaches 13px above and below a 17.9px box. What is in
// that 13px here, and can a press meant for something else land on a
// control?
//
// The measure is the real one: ask the browser what is at the point,
// rather than reasoning about insets.
import { writeFileSync } from 'node:fs'
import { launch, VIEWPORTS } from '../../review-kit/lib/browser.mjs'

const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i === -1 ? d : process.argv[i + 1] }
const BASE = arg('base', 'http://127.0.0.1:3000')
const OUT = arg('out', 'data/overlap.txt')

const browser = await launch()
const lines = []
for (const [vname, w, h] of VIEWPORTS) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1 })
  const page = await ctx.newPage()
  await page.goto(`${BASE}/dashboard`, { waitUntil: 'networkidle' })
  await page.waitForSelector('.dash-bar', { timeout: 30000 })
  const r = await page.evaluate(() => {
    const out = []
    for (const btn of document.querySelectorAll('.dash-action')) {
      const b = btn.getBoundingClientRect()
      const reach = (44 - b.height) / 2
      // One pixel above the overlay's own top edge, at the control's
      // horizontal centre: the first point a press could be meant for
      // something else and land here instead.
      const x = Math.round(b.left + b.width / 2)
      const probes = []
      for (const dy of [-reach + 1, -reach / 2, b.height + reach - 1]) {
        const y = Math.round(b.top + dy)
        if (y < 0 || y > window.innerHeight) continue
        const hit = document.elementFromPoint(x, y)
        const owns = hit === btn || btn.contains(hit)
        // What would be there if the overlay were not: the deepest
        // element whose own box contains the point.
        let under = null
        for (const el of document.elementsFromPoint(x, y)) {
          if (el === btn || btn.contains(el)) continue
          under = el
          break
        }
        probes.push({
          dy: Math.round(dy),
          ownedByControl: owns,
          under: under ? `${under.tagName.toLowerCase()}.${String(under.className || '').split(' ')[0]}` : null,
          underIsControl: !!(under && under.closest('button, a[href]')),
          underText: under ? (under.textContent || '').trim().slice(0, 40) : null,
        })
      }
      out.push({ label: (btn.textContent || '').trim(), height: Math.round(b.height * 10) / 10, reach: Math.round(reach * 10) / 10, probes })
    }
    return out
  })
  lines.push(`==== ${vname} ${w}x${h} — ${r.length} controls in view`)
  let stolen = 0
  for (const c of r) {
    for (const p of c.probes) {
      if (p.ownedByControl && p.underIsControl) stolen++
    }
  }
  const sample = r[0]
  if (sample) {
    lines.push(`  drawn box ${sample.height}px, overlay reaches ${sample.reach}px above and below`)
    for (const p of sample.probes) {
      lines.push(`    at ${String(p.dy).padStart(4)}px: owned by the control = ${p.ownedByControl}; what is under it = ${p.under} ${p.underIsControl ? '(A CONTROL)' : '(not a control)'} "${p.underText}"`)
    }
  }
  lines.push(`  presses that a control takes from ANOTHER control: ${stolen}`)
  lines.push('')
  await ctx.close()
}
await browser.close()
writeFileSync(OUT, lines.join('\n') + '\n')
console.log(lines.join('\n'))
