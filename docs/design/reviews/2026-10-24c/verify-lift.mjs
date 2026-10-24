// Check every state of .quiet-link and .cta against what the stylesheet
// means to say, by reading computed values back out of the browser.
//
//   node verify-lift.mjs [out.txt]
//
// Each row is an assertion with an expected value written next to it, so a
// wrong answer is visible as a FAIL rather than as a number a reader has to
// judge. The reduced-motion rows run in a second context with the media
// feature emulated, because that is the only honest way to test it.

import { launch } from '../../review-kit/lib/browser.mjs'
import { writeFileSync } from 'node:fs'

const BASE = process.env.URSA_BASE || 'http://127.0.0.1:4931'
const OUT = process.argv[2] || null
const lines = []
let pass = 0, fail = 0
const say = (s) => { lines.push(s); console.log(s) }
const check = (label, got, want) => {
  const ok = String(got) === String(want)
  ok ? pass++ : fail++
  say(`  ${ok ? 'ok  ' : 'FAIL'}  ${label.padEnd(54)} got ${String(got).padEnd(34)} want ${want}`)
}

const browser = await launch()

// read the computed transform of `sel` after applying a state
async function state(page, url, sel, { hover = false, active = false, focus = false } = {}) {
  // A fresh document per state. .quiet-link is a <Link>, so a real press
  // navigates and detaches it, and the next state would read a dead handle.
  await page.goto(url, { waitUntil: 'networkidle' })
  await page.waitForTimeout(350)
  const el = (await page.$$(sel))[0]
  await el.scrollIntoViewIfNeeded()
  await page.mouse.move(5, 5)
  await page.waitForTimeout(120)
  if (focus) await el.evaluate((e) => e.focus())
  if (hover || active) await el.hover()
  if (active) await page.mouse.down()
  await page.waitForTimeout(650)            // past 340ms, fully settled
  const out = await el.evaluate((e) => {
    const cs = getComputedStyle(e)
    const m = new DOMMatrixReadOnly(cs.transform === 'none' ? '' : cs.transform)
    return {
      ty: cs.transform === 'none' ? 'none' : Math.round(m.m42 * 100) / 100,
      dur: cs.transitionDuration.replace(/\s/g, ''),
      prop: cs.transitionProperty.replace(/\s/g, ''),
      spring: cs.transitionTimingFunction.includes('linear('),
    }
  })
  if (active) await page.mouse.up()
  return out
}

for (const reduced of [false, true]) {
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
    reducedMotion: reduced ? 'reduce' : 'no-preference',
  })
  const page = await ctx.newPage()
  say(`\n=== prefers-reduced-motion: ${reduced ? 'reduce' : 'no-preference'} ===`)

  // --- the 404's control, the one this run changed
  say('.quiet-link  (404, "Back to Ursa Minor")')
  const Q = BASE + '/this-page-does-not-exist'
  const r = await state(page, Q, '.quiet-link', {})
  check('at rest: translateY', r.ty, 'none')
  // under reduced motion the transform leaves the property list entirely,
  // which is the point of that block rather than an accident of it
  check('at rest: transition-property', r.prop, reduced ? 'background-color,border-color' : 'background-color,border-color,transform')
  check('at rest: spring on the transform', r.spring, !reduced)
  const h = await state(page, Q, '.quiet-link', { hover: true })
  check('hovered: translateY', h.ty, reduced ? 'none' : -1)
  check('hovered: durations', h.dur, reduced ? '0.001s' : '0.16s,0.16s,0.34s')
  const a = await state(page, Q, '.quiet-link', { active: true })
  check('pressed: translateY back to 0', a.ty, reduced ? 'none' : 0)
  // 90ms is declared as one value, and the browser computes it as one value
  // and cycles it across all three properties. .cta's press does the same.
  check('pressed: durations', a.dur, reduced ? '0.001s' : '0.09s')
  const f = await state(page, Q, '.quiet-link', { focus: true })
  check('focused only: does NOT lift', f.ty, 'none')
  check('focused only: durations keep the spring', f.dur, reduced ? '0.001s' : '0.16s,0.16s,0.34s')

  // --- the control it was matched to, which must not have moved
  say('.cta  (/record, "Open a record")  — regression check, unchanged by this run')
  const R = BASE + '/record'
  const c = await state(page, R, '.cta', {})
  check('at rest: translateY', c.ty, 'none')
  check('at rest: spring on the transform', c.spring, !reduced)
  const ch = await state(page, R, '.cta', { hover: true })
  check('hovered: translateY', ch.ty, reduced ? 'none' : -1)
  check('hovered: durations', ch.dur, reduced ? '0.16s,0.16s' : '0.16s,0.16s,0.34s')

  await ctx.close()
}

say(`\n${pass} passed, ${fail} failed`)
if (OUT) writeFileSync(OUT, lines.join('\n') + '\n')
await browser.close()
process.exit(fail ? 1 : 0)
