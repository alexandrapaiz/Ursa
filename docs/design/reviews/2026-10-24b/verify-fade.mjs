// Does the fade appear exactly when there is more, and vanish when there is not?
import { launch } from '../../review-kit/lib/browser.mjs'

const BASE_URL = process.env.URSA_BASE ?? 'http://127.0.0.1:4617'
const b = await launch()
const rows = []
for (const [vname, w, h] of [['narrow',320,844],['phone',390,844],['tablet',820,1180],['desktop',1440,900]]) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1 })
  const p = await ctx.newPage()
  await p.goto(BASE_URL + '/', { waitUntil: 'networkidle' })
  await p.waitForTimeout(500)
  for (const i of [0, 1, 2]) {
    for (const where of ['start', 'middle', 'end']) {
      const r = await p.evaluate(async ([i, where]) => {
        const el = document.querySelectorAll('.rec-cmd')[i]
        const max = el.scrollWidth - el.clientWidth
        el.scrollLeft = where === 'start' ? 0 : where === 'end' ? max + 50 : Math.round(max / 2)
        await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))
        const cs = getComputedStyle(el)
        return {
          overflows: max > 0, max: Math.round(max), at: Math.round(el.scrollLeft),
          l: cs.getPropertyValue('--fade-l').trim(), r: cs.getPropertyValue('--fade-r').trim(),
        }
      }, [i, where])
      rows.push({ v: vname, i, where, ...r })
    }
  }
  await ctx.close()
}
await b.close()
const hdr = 'viewport  blk  position  overflows  max   scrollLeft  --fade-l  --fade-r   verdict'
const verdict = (r) => {
  if (!r.overflows) return r.l === '0px' && r.r === '0px' ? 'ok: fits, no fade' : 'WRONG: faded a line that fits'
  const wantL = r.where === 'start' ? '0px' : null
  const wantR = r.where === 'end' ? '0px' : null
  if (wantL && r.l !== wantL) return 'WRONG: fades the left at scroll 0'
  if (wantR && r.r !== wantR) return 'WRONG: still fades right at the end'
  if (r.where === 'start' && r.r !== '32px') return 'WRONG: no right fade with content hidden'
  if (r.where === 'end' && r.l !== '32px') return 'WRONG: no left fade when scrolled off'
  if (r.where === 'middle' && (r.l !== '32px' || r.r !== '32px')) return 'WRONG: mid-scroll not faded both'
  return 'ok'
}
console.log(hdr)
for (const r of rows) console.log(`${r.v.padEnd(9)} ${r.i}    ${r.where.padEnd(9)} ${String(r.overflows).padEnd(10)} ${String(r.max).padStart(4)}  ${String(r.at).padStart(10)}  ${r.l.padStart(8)}  ${r.r.padStart(8)}   ${verdict(r)}`)
const bad = rows.filter(r => verdict(r) !== 'ok' && !verdict(r).startsWith('ok'))
console.log(bad.length ? `\n${bad.length} WRONG` : '\nall correct')
