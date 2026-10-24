// Hover something and scrub its transition to an exact time.
//
// A screenshot of a hover is a race with the transition, and a frame-rate
// number taken on a software renderer is a fact about the host. Both go
// away if you drive the animation by hand: hover, then set the transition's
// `currentTime` to the millisecond you want and read or photograph that.
// The result is identical on a slow host and a fast one, which is the only
// way two runs on two machines can compare the same frame.
//
//   node hover.mjs --url http://127.0.0.1:4488/ --selector .cta --at 200 --shot /tmp/a.png
//   node hover.mjs --url http://127.0.0.1:4488/ --selector .cta --curve
//
// `--curve` sweeps the whole transition and prints the property's value at
// every step, which is how you check that a spring in a stylesheet is the
// spring you meant to put there.

import { launch } from './lib/browser.mjs'

const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i === -1 ? d : process.argv[i + 1] }
const URL_ = arg('url', 'http://127.0.0.1:4488/')
const SEL = arg('selector', '.cta')
const NTH = Number(arg('nth', 0))
const PROP = arg('prop', 'transform')
const WIDTH = Number(arg('width', 1440))
const HEIGHT = Number(arg('height', 900))
const SHOT = arg('shot', null)
const AT = Number(arg('at', 200))
const CURVE = process.argv.includes('--curve')

const browser = await launch()
const ctx = await browser.newContext({ viewport: { width: WIDTH, height: HEIGHT }, deviceScaleFactor: 1, reducedMotion: 'no-preference' })
const page = await ctx.newPage()
await page.goto(URL_, { waitUntil: 'networkidle' })
await page.waitForTimeout(800)

const el = (await page.$$(SEL))[NTH]
if (!el) throw new Error(`no element ${NTH} matching ${SEL}`)
await el.scrollIntoViewIfNeeded()
await page.waitForTimeout(300)

// What the stylesheet actually resolved to, which is the first thing to
// check and the one people skip.
const declared = await el.evaluate((e) => {
  const cs = getComputedStyle(e)
  return { property: cs.transitionProperty, duration: cs.transitionDuration, timing: cs.transitionTimingFunction }
})
console.log('declared on the element:')
console.log(`  property ${declared.property}`)
console.log(`  duration ${declared.duration}`)
console.log(`  timing   ${declared.timing}`)

await el.hover()
await page.waitForTimeout(16)

const scrub = (ms) => el.evaluate((e, [ms, prop]) => {
  for (const a of e.getAnimations()) {
    // Only the transition for the property we are asking about.
    if (a.transitionProperty && a.transitionProperty !== prop) continue
    a.pause(); a.currentTime = ms
  }
  return getComputedStyle(e)[prop]
}, [ms, PROP])

if (CURVE) {
  const total = Math.max(...declared.duration.split(',').map((d) => parseFloat(d) * 1000))
  const rows = []
  for (let t = 0; t <= total; t += Math.max(4, Math.round(total / 50))) rows.push([t, await scrub(t)])
  rows.push([total, await scrub(total)])
  // translateY out of the matrix, when that is what is moving.
  const ty = (v) => { const m = String(v).match(/matrix\(([^)]+)\)/); return m ? Number(m[1].split(',')[5]) : null }
  const first = ty(rows[0][1]), last = ty(rows[rows.length - 1][1])
  console.log(`\n${PROP} scrubbed across the whole transition:`)
  for (const [t, v] of rows) {
    const y = ty(v)
    const bar = y == null ? '' : ' ' + '#'.repeat(Math.round(Math.abs((y - first) / ((last - first) || 1)) * 40))
    console.log(`  ${String(t).padStart(4)}ms  ${y == null ? v : y.toFixed(4) + 'px'}${bar}`)
  }
  if (first != null && last != null) {
    const beyond = rows.map(([, v]) => ty(v)).filter((y) => y != null)
      .filter((y) => (last - first) > 0 ? y > last : y < last)
    console.log(`\n  from ${first}px to ${last}px`)
    console.log(`  frames past the target: ${beyond.length}`)
    if (beyond.length) {
      const peak = (last - first) > 0 ? Math.max(...beyond) : Math.min(...beyond)
      console.log(`  peak ${peak.toFixed(4)}px, overshoot ${(Math.abs(peak - last) / Math.abs(last - first) * 100).toFixed(2)}% of travel`)
    }
  }
} else {
  const v = await scrub(AT)
  console.log(`\n${PROP} at ${AT}ms: ${v}`)
  if (SHOT) { await page.screenshot({ path: SHOT, scale: 'css' }); console.log(`shot ${SHOT}`) }
}

await browser.close()
