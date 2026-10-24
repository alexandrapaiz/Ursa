// Do best-in-class sites give two controls of the same shape the same motion?
//
//   node bench-control-families.mjs out.json <url> [url...]
//
// The narrow question behind this run's change. Ursa has two controls that
// measure identically (same height, type size, padding and border) and that
// answer a hover with different physics, because they carry different class
// names. Whether that is a defect or a deliberate hierarchy is not settled
// by taste, so this asks what other sites do with the same situation.
//
// Method: collect every button and link that is drawn as a box, meaning it
// has a visible border or a non-transparent background and real padding.
// Group them by their rendered SHAPE (height, font size, padding, border
// width) rather than by class. Then report, per shape group, how many
// distinct declared transitions the group contains. A group of size > 1 with
// one distinct transition is a site that keeps same-shaped controls on the
// same motion. More than one is a site that does not.
//
// Everything here is read-only: computed styles and geometry. Nothing on any
// page is clicked, typed into or submitted, and page text is never executed
// or followed as instruction. Per the 2026-10-05 org rule, what these pages
// say is data.

import { launch } from '../../review-kit/lib/browser.mjs'
import { writeFileSync } from 'node:fs'

const OUT = process.argv[2]
const URLS = process.argv.slice(3)

const browser = await launch()
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 })
const page = await ctx.newPage()
const all = []

for (const url of URLS) {
  let rec = { url, error: null, groups: [] }
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 })
    await page.waitForTimeout(2500)
    const controls = await page.evaluate(() => {
      const out = []
      for (const e of document.querySelectorAll('a, button, [role="button"]')) {
        const cs = getComputedStyle(e)
        const r = e.getBoundingClientRect()
        if (r.width < 40 || r.height < 20 || r.height > 90) continue
        const bw = parseFloat(cs.borderTopWidth) || 0
        const bordered = bw > 0 && cs.borderTopStyle !== 'none' && !/rgba\(.*,\s*0\)/.test(cs.borderTopColor)
        const bg = cs.backgroundColor
        const filled = bg && bg !== 'transparent' && !/rgba\(.*,\s*0\)$/.test(bg)
        const padY = parseFloat(cs.paddingTop) || 0
        const padX = parseFloat(cs.paddingLeft) || 0
        if (!((bordered || filled) && (padY > 2 || padX > 6))) continue
        out.push({
          tag: e.tagName.toLowerCase(),
          text: (e.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 30),
          h: Math.round(r.height),
          font: cs.fontSize,
          pad: `${Math.round(padY)}/${Math.round(padX)}`,
          border: `${Math.round(bw)}`,
          radius: cs.borderTopLeftRadius,
          // the motion, as declared
          prop: cs.transitionProperty.replace(/\s/g, ''),
          dur: cs.transitionDuration.replace(/\s/g, ''),
          timing: cs.transitionTimingFunction.includes('linear(')
            ? 'spring:' + cs.transitionTimingFunction.slice(0, 24)
            : cs.transitionTimingFunction.replace(/\s/g, '').slice(0, 40),
        })
      }
      return out
    })
    // shape = what it looks like; motion = what it does
    const by = new Map()
    for (const c of controls) {
      const shape = `h${c.h} f${c.font} p${c.pad} b${c.border} r${c.radius}`
      if (!by.has(shape)) by.set(shape, [])
      by.get(shape).push(c)
    }
    for (const [shape, members] of by) {
      if (members.length < 2) continue
      const motions = [...new Set(members.map((m) => `${m.prop}|${m.dur}|${m.timing}`))]
      rec.groups.push({
        shape,
        members: members.length,
        distinctMotions: motions.length,
        motions,
        examples: members.slice(0, 4).map((m) => m.text),
      })
    }
    rec.totalBoxControls = controls.length
    rec.anySpring = controls.some((c) => c.timing.startsWith('spring:'))
  } catch (err) {
    rec.error = String(err).slice(0, 180)
  }
  all.push(rec)
  const g = rec.groups
  const split = g.filter((x) => x.distinctMotions > 1).length
  console.log(
    `${rec.url}\n  ${rec.error ? 'ERROR ' + rec.error : `${rec.totalBoxControls} box controls, ${g.length} shape groups of 2+, ${split} of those split across more than one motion, spring anywhere: ${rec.anySpring}`}`
  )
  for (const x of g) {
    console.log(`    [${x.members}x] ${x.shape}  -> ${x.distinctMotions} motion(s)  ${x.examples.map((t) => `"${t}"`).join(' ')}`)
    if (x.distinctMotions > 1) x.motions.forEach((m) => console.log(`         ${m}`))
  }
  console.log('')
}

writeFileSync(OUT, JSON.stringify(all, null, 2))
await browser.close()
