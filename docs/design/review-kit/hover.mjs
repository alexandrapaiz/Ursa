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
//   node hover.mjs --url http://127.0.0.1:4961/ --selector .panel-run \
//     --state docs/design/reviews/2026-10-26c/data/state-panel-synced.mjs
//
// `--curve` sweeps the whole transition and prints the property's value at
// every step, which is how you check that a spring in a stylesheet is the
// spring you meant to put there.
//
// The frame this writes is frozen, like `shoot.mjs`'s. Until 2026-10-24i it
// was not, and two shots of one hover frame on the home page differed by
// 147,435 of 1,296,000 pixels, 11.4% of the viewport, because the starfield
// behind the control is a new random texture on every load. So no hover
// state this seat ever photographed could be diffed against itself, and the
// charter's order to verify hover by screenshot was not reachable with this
// tool. `--live` lets the sky animate when that is what you want to see.
//
// Pinning the clock is safe here and nowhere near as safe as it looks: this
// tool does not wait for a transition, it scrubs it by `currentTime`, so the
// clock plays no part in where the motion is when the shutter opens. A tool
// that samples motion as it runs needs the other half of the freeze; see
// `seedRandomContext` in lib/freeze.mjs.

import { launch } from './lib/browser.mjs'
import { freezeContext } from './lib/freeze.mjs'

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
const LIVE = process.argv.includes('--live')
// A hover frame cut out of a page frame is mostly the page. Clipped to the
// element's own box it is the thing under review, which is the same lesson
// the 2026-10-24h benchmark learned about sampling a mark on its own.
const CLIP = process.argv.includes('--clip')
const PAD = Number(arg('pad', 12))
// A hover frame on its own proves nothing. What a reviewer has to see is the
// pair: the control at rest and the control hovered, same element, same
// clip, same sky. `--rest` is the other half of that pair.
const REST = process.argv.includes('--rest')
// `--until` and `--state`, the same two seams shoot.mjs and
// measure-hit-areas.mjs already carry, and for a reason this tool makes
// sharper than either of them. The overlay's panel draws one control
// before a key is derived and three more afterwards, so every control
// this seat was asked to give a hover to lives behind a state. An
// instrument that can only be handed a URL cannot reach a single one of
// them, which means the charter's order to verify a hover by screenshot
// was not reachable for that surface with the tool written for it.
// `--state` is a module whose default export is `async (page, name) => {}`,
// run after `--until` and before the pointer moves.
const UNTIL = arg('until', null)
const STATE = arg('state', null)
const enterState = STATE
  ? (await import(new URL(STATE, `file://${process.cwd()}/`).href)).default
  : null

const browser = await launch()
const ctx = await browser.newContext({ viewport: { width: WIDTH, height: HEIGHT }, deviceScaleFactor: 1, reducedMotion: 'no-preference' })
if (!LIVE) await freezeContext(ctx)
const page = await ctx.newPage()
await page.goto(URL_, { waitUntil: 'networkidle' })
if (UNTIL) await page.waitForSelector(UNTIL, { timeout: 30000 })
if (enterState) await enterState(page, 'hover')
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

if (!REST) {
  await el.hover()
  await page.waitForTimeout(16)
} else {
  // Park the pointer somewhere inert, because playwright's pointer starts at
  // 0,0 and on these pages that is inside the header.
  await page.mouse.move(WIDTH - 2, HEIGHT - 2)
  await page.waitForTimeout(80)
}

const scrub = (ms) => REST ? el.evaluate((e, [, prop]) => getComputedStyle(e)[prop], [ms, PROP]) : el.evaluate((e, [ms, prop]) => {
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
  console.log(`\n${PROP} ${REST ? 'at rest' : `at ${AT}ms`}: ${v}`)
  if (SHOT) {
    let clip
    if (CLIP) {
      const b = await el.boundingBox()
      clip = {
        x: Math.max(0, Math.round(b.x) - PAD),
        y: Math.max(0, Math.round(b.y) - PAD),
        width: Math.round(b.width) + PAD * 2,
        height: Math.round(b.height) + PAD * 2,
      }
    }
    await page.screenshot({ path: SHOT, scale: 'css', ...(clip ? { clip } : {}) })
    console.log(`shot ${SHOT}  (${REST ? 'at rest, ' : ''}${LIVE ? 'LIVE, differs from itself' : 'frozen'}${CLIP ? ', clipped to the element' : ''})`)
  }
}

await browser.close()
