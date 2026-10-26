// L14's question, asked of the panel rather than reasoned about. Two
// overlays were added on 2026-10-26: a centred one on the label that
// wraps the passphrase field, which reaches 4.5px above and below a
// 35px box, and a centred one on the run button, which reaches 9px
// above and below a 26px box. The 9px is the one worth asking about,
// because the run button sits in a footer row with the verdict line
// beside it and a caption under it.
//
// The measure is the real one: ask the browser what is at the point.
// A press is "taken" only if the overlay answers at a point where
// another control would otherwise have.
//
//   node data/probe-overlap-panel.mjs --base http://127.0.0.1:4960
import { writeFileSync } from 'node:fs'
import { launch, VIEWPORTS } from '../../../review-kit/lib/browser.mjs'
import enterUnlocked from './state-panel-unlocked.mjs'

const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i === -1 ? d : process.argv[i + 1] }
const BASE = arg('base', 'http://127.0.0.1:4960')
const OUT = arg('out', 'data/overlap-after.txt')

const probe = () => {
  const out = []
  const targets = [
    ['.panel-field', document.querySelector('.panel-field')],
    ['.panel-hit', document.querySelector('.panel-hit')],
  ]
  for (const [name, el] of targets) {
    if (!el) continue
    const b = el.getBoundingClientRect()
    const reach = (44 - b.height) / 2
    if (reach <= 0) { out.push({ name, height: b.height, reach, probes: [] }); continue }
    const x = Math.round(b.left + b.width / 2)
    const probes = []
    for (const dy of [-reach + 1, -reach / 2, b.height + reach / 2, b.height + reach - 1]) {
      const y = Math.round(b.top + dy)
      if (y < 0 || y > window.innerHeight) continue
      const hit = document.elementFromPoint(x, y)
      const owns = hit === el || el.contains(hit)
      let under = null
      for (const e of document.elementsFromPoint(x, y)) {
        if (e === el || el.contains(e)) continue
        under = e
        break
      }
      probes.push({
        dy: Math.round(dy),
        ownedByControl: owns,
        under: under ? `${under.tagName.toLowerCase()}.${String(under.className || '').split(' ')[0]}` : null,
        underIsControl: !!(under && under.closest('button, a[href], input, select')),
        underText: under ? (under.textContent || '').trim().slice(0, 40) : null,
      })
    }
    out.push({ name, height: Math.round(b.height * 10) / 10, reach: Math.round(reach * 10) / 10, probes })
  }
  return out
}

const browser = await launch()
const lines = []
let stolenAll = 0
for (const [vname, w, h] of VIEWPORTS) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1 })
  const page = await ctx.newPage()
  await page.goto(BASE + '/', { waitUntil: 'networkidle' })
  await page.waitForSelector('input[type=password]', { timeout: 30000 })
  const locked = await page.evaluate(probe)
  await enterUnlocked(page)
  await page.waitForTimeout(250)
  const unlocked = await page.evaluate(probe)
  lines.push(`==== ${vname} ${w}x${h}`)
  for (const [state, rows] of [['locked', locked], ['unlocked', unlocked]]) {
    for (const c of rows) {
      lines.push(`  ${state} ${c.name}: drawn box ${c.height}px, overlay reaches ${c.reach}px each way`)
      for (const p of c.probes) {
        if (p.ownedByControl && p.underIsControl) stolenAll++
        lines.push(`    at ${String(p.dy).padStart(4)}px: owned by the control = ${p.ownedByControl}; under it = ${p.under} ${p.underIsControl ? '(A CONTROL)' : '(not a control)'} "${p.underText}"`)
      }
    }
  }
  lines.push('')
  await ctx.close()
}
await browser.close()
lines.push(`presses either overlay takes from ANOTHER control, across all three viewports and both states: ${stolenAll}`)
writeFileSync(OUT, lines.join('\n') + '\n')
console.log(lines.join('\n'))
