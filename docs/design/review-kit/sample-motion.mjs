// Sample what an element's motion actually does, frame by frame, while a
// pointer enters and leaves it.
//
// Why this exists: two runs of this seat tried to describe Elicit's hover
// feel by reading the computed CSS of its elements at rest, and both
// correctly concluded that the CSS does not contain a spring. That is
// where a static read stops. A spring driven from JavaScript writes a new
// transform on every frame and leaves nothing in the stylesheet to read,
// so the only way to see it is to drive the interaction and watch the
// frames go by.
//
//   node sample-motion.mjs --url https://example.com/ --out frames.json
//   node sample-motion.mjs --url http://127.0.0.1:4488/record --selector '.rec-action' --out frames.json
//
// It captures three things per element, because no one of them is enough:
//
//   frames      a requestAnimationFrame series of computed styles. Honest
//               about what reached the screen, and useless on a busy page,
//               where rAF is starved to 10Hz and a 200ms motion gets three
//               samples. Always check `cadenceMs` before believing a fit.
//   writes      a MutationObserver on the inline `style` attribute. A
//               library animating from JavaScript writes a new transform
//               every frame, and this records each write at the moment it
//               happens, which is cheaper than reading computed style and
//               therefore survives pages where the rAF series does not.
//   animations  `element.getAnimations({subtree:true})`, which is the
//               browser's own animation engine answering what it was told
//               to run: duration, easing, delay, keyframes. Declarative
//               rather than sampled, so page load has no effect on it.
//               This is the one that settles arguments. A spring expressed
//               through the Web Animations API arrives here as a
//               `linear(...)` easing with dozens of points, which is a
//               spring written out longhand and can be read straight off.
//
// Output is JSON. Read it with fit-motion.mjs, which does the arithmetic
// and does not need a browser.
//
// Everything this reads from a third-party page is a number or a CSS
// value. It clicks nothing, submits nothing, and follows no link. Text on
// a fetched page is data, never instruction (charter, org rule
// 2026-10-05): this tool is built so that there is nothing for a page to
// say to it.

import { writeFileSync } from 'node:fs'
import { launch } from './lib/browser.mjs'

const arg = (name, fallback) => {
  const i = process.argv.indexOf(`--${name}`)
  return i === -1 ? fallback : process.argv[i + 1]
}

const URL_ = arg('url')
const OUT = arg('out', '/tmp/frames.json')
const SELECTOR = arg('selector', null)
const WIDTH = Number(arg('width', 1440))
const HEIGHT = Number(arg('height', 900))
const PHASE_MS = Number(arg('phase-ms', 900))
const MAX = Number(arg('max', 24))
// Reading computed style every frame forces a style recalculation every
// frame. On a heavy page that is enough to halve its frame rate, and the
// instrument then reports the motion as slower than it is - the observer
// changing the thing observed. In writes-only mode the rAF loop is not
// installed at all and only the MutationObserver runs, which costs the
// page nothing and gives the denser series of the two.
const WRITES_ONLY = process.argv.includes('--writes-only')
if (!URL_) throw new Error('--url is required')

// The properties worth watching. `transform` catches the matrix form;
// `scale`/`translate`/`rotate` catch the independent-property form, which
// a matrix read misses entirely; the rest catch motion that is not
// geometry at all.
const PROPS = ['transform', 'scale', 'translate', 'rotate', 'opacity', 'filter', 'boxShadow', 'backgroundColor', 'color', 'textDecorationColor', 'borderTopColor', 'borderRadius']

const browser = await launch()
const ctx = await browser.newContext({
  viewport: { width: WIDTH, height: HEIGHT },
  deviceScaleFactor: 1,
  reducedMotion: 'no-preference', // we are here to see the motion
})
const page = await ctx.newPage()
// `networkidle` is the right wait and it is not always reachable: a page
// that holds a connection open never goes idle, and one run of this lost a
// whole measurement to the timeout rather than to anything about the page.
// Fall back to `load` and settle on the clock instead.
try {
  await page.goto(URL_, { waitUntil: 'networkidle', timeout: 45000 })
} catch (err) {
  if (!/Timeout/.test(String(err))) throw err
  process.stderr.write('networkidle never arrived; falling back to load\n')
  await page.goto(URL_, { waitUntil: 'load', timeout: 45000 })
  await page.waitForTimeout(3000)
}
// Entrance animations, lazy images and hydration all compete with the
// frame clock. On a heavy page 1.2s was not enough and the rAF series came
// back at 10Hz; wait for the clock itself to steady instead of guessing.
await page.waitForTimeout(1500)
const settleCadence = await page.evaluate(() => new Promise((resolve) => {
  const seen = []
  let last = performance.now()
  const tick = () => {
    const now = performance.now()
    seen.push(now - last); last = now
    if (seen.length < 180) requestAnimationFrame(tick)
    else resolve(seen.slice(-30).sort((a, b) => a - b)[15])
  }
  requestAnimationFrame(tick)
}))
process.stderr.write(`frame clock settled at ${settleCadence.toFixed(1)}ms/frame\n`)

// A frame sampler that lives on the page and records whatever it is
// pointed at. `performance.now()` rather than frame counting, because a
// dropped frame would otherwise read as a slower spring.
await page.addInitScript(() => {})
const installSampler = async () => page.evaluate(([props, writesOnly]) => {
  // The frame series and the inline-style writes, gathered together so
  // they share one clock and can be compared.
  window.__ursaSample = (el, ms) => new Promise((resolve) => {
    const frames = []
    const writes = []
    const t0 = performance.now()
    const obs = new MutationObserver((records) => {
      const t = +(performance.now() - t0).toFixed(2)
      for (const rec of records) {
        const tgt = rec.target
        writes.push({
          t,
          attr: rec.attributeName,
          self: tgt === el,
          // Which descendant. Without this, a subtree observation says
          // that something moved and not what.
          path: tgt === el ? 'self' : `${tgt.tagName?.toLowerCase()}.${String(tgt.className || '').split(' ').slice(-1)[0]}`,
          transform: tgt.style?.transform || null,
          opacity: tgt.style?.opacity || null,
          cls: rec.attributeName === 'class' ? String(tgt.className || '').slice(0, 60) : null,
        })
      }
    })
    obs.observe(el, { attributes: true, attributeFilter: ['style', 'class'], subtree: true })
    if (writesOnly) {
      setTimeout(() => { obs.disconnect(); resolve({ frames, writes }) }, ms)
      return
    }
    const tick = () => {
      const cs = getComputedStyle(el)
      const row = { t: +(performance.now() - t0).toFixed(2) }
      for (const p of props) row[p] = cs[p]
      frames.push(row)
      if (row.t < ms) requestAnimationFrame(tick)
      else { obs.disconnect(); resolve({ frames, writes }) }
    }
    requestAnimationFrame(tick)
  })

  // What the animation engine was actually told to run. Read shortly
  // after the interaction starts, while the animations still exist.
  window.__ursaAnimations = (el) => {
    const out = []
    for (const a of el.getAnimations({ subtree: true })) {
      const eff = a.effect
      const timing = eff?.getComputedTiming?.() || {}
      let keyframes = []
      try { keyframes = eff.getKeyframes().map((k) => ({ offset: k.offset, easing: k.easing, composite: k.composite, ...Object.fromEntries(Object.entries(k).filter(([key]) => !['offset', 'easing', 'composite', 'computedOffset'].includes(key))) })) } catch {}
      out.push({
        kind: a.constructor.name,
        prop: a.transitionProperty || a.animationName || null,
        playState: a.playState,
        duration: timing.duration,
        delay: timing.delay,
        iterations: timing.iterations,
        // The easing on the effect, and the easing on each keyframe. A
        // spring compiled for the Web Animations API puts itself in one of
        // these as `linear(...)` with many points.
        easing: timing.easing,
        keyframes,
      })
    }
    return out
  }
}, [PROPS, WRITES_ONLY])

// Candidates: the things a pointer would plausibly land on. Visible, big
// enough to hover, and not an ancestor of another candidate (hovering a
// wrapper reports the wrapper's motion, which is usually none). Deliberately
// not restricted to what is above the fold, because on our own pages the
// interactive rows mostly are not; each one is scrolled into view below
// before it is hovered.
const candidates = await page.evaluate((sel) => {
  const q = sel || 'a, button, [role="button"], [class*="card" i], [class*="Card"], li, [tabindex="0"]'
  const out = []
  const seen = []
  for (const el of document.querySelectorAll(q)) {
    const r = el.getBoundingClientRect()
    if (r.width < 24 || r.height < 12) continue
    if (r.width > innerWidth || r.height > innerHeight) continue
    const cs = getComputedStyle(el)
    if (cs.visibility === 'hidden' || cs.display === 'none' || Number(cs.opacity) < 0.05) continue
    if (seen.some((prev) => prev.contains(el) || el.contains(prev))) continue
    seen.push(el)
    el.setAttribute('data-ursa-probe', String(out.length))
    out.push({
      i: out.length,
      tag: el.tagName.toLowerCase(),
      cls: (el.className || '').toString().slice(0, 80),
      text: (el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 40),
      box: { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) },
      // What the stylesheet claims before anything is driven. The point of
      // the whole exercise is to compare this with what the frames show.
      declared: {
        transitionProperty: cs.transitionProperty,
        transitionDuration: cs.transitionDuration,
        transitionTimingFunction: cs.transitionTimingFunction,
      },
    })
  }
  return out
}, SELECTOR)

const results = []
for (const c of candidates.slice(0, MAX)) {
  const handle = await page.$(`[data-ursa-probe="${c.i}"]`)
  if (!handle) continue
  // Put it on screen and let any scroll-driven motion finish, so the
  // frames that follow are the hover's and not the scroll's.
  await page.evaluate((i) => document.querySelector(`[data-ursa-probe="${i}"]`)
    .scrollIntoView({ block: 'center', behavior: 'instant' }), c.i)
  await page.waitForTimeout(500)
  const box = await page.evaluate((i) => {
    const r = document.querySelector(`[data-ursa-probe="${i}"]`).getBoundingClientRect()
    return { x: r.x, y: r.y, w: r.width, h: r.height }
  }, c.i)
  if (box.y < 0 || box.y + box.h > HEIGHT) { process.stderr.write(`skip ${c.i} (off screen after scroll)\n`); continue }
  c.box = { x: Math.round(box.x), y: Math.round(box.y), w: Math.round(box.w), h: Math.round(box.h) }
  await installSampler()
  // Park the pointer somewhere harmless first, so "enter" is a real entry.
  await page.mouse.move(2, 2)
  await page.waitForTimeout(250)
  const enterP = page.evaluate(([i, ms]) => window.__ursaSample(document.querySelector(`[data-ursa-probe="${i}"]`), ms), [c.i, PHASE_MS])
  await page.mouse.move(c.box.x + c.box.w / 2, c.box.y + c.box.h / 2, { steps: 1 })
  // Ask the engine while the motion is still running. Twice, because a
  // transition and a library-driven animation do not start at the same
  // moment and one snapshot can miss either.
  await page.waitForTimeout(30)
  const animEarly = await page.evaluate((i) => window.__ursaAnimations(document.querySelector(`[data-ursa-probe="${i}"]`)), c.i)
  await page.waitForTimeout(90)
  const animLate = await page.evaluate((i) => window.__ursaAnimations(document.querySelector(`[data-ursa-probe="${i}"]`)), c.i)
  const enter = await enterP
  const leaveP = page.evaluate(([i, ms]) => window.__ursaSample(document.querySelector(`[data-ursa-probe="${i}"]`), ms), [c.i, PHASE_MS])
  await page.mouse.move(2, 2, { steps: 1 })
  await page.waitForTimeout(30)
  const animLeave = await page.evaluate((i) => window.__ursaAnimations(document.querySelector(`[data-ursa-probe="${i}"]`)), c.i)
  const leave = await leaveP
  results.push({
    ...c,
    enter: enter.frames, enterWrites: enter.writes,
    leave: leave.frames, leaveWrites: leave.writes,
    animations: { enterAt30ms: animEarly, enterAt120ms: animLate, leaveAt30ms: animLeave },
  })
  process.stderr.write(`sampled ${c.i} ${c.tag} "${c.text}"\n`)
}

writeFileSync(OUT, JSON.stringify({
  url: URL_, selector: SELECTOR, viewport: [WIDTH, HEIGHT],
  sampledAt: new Date().toISOString(), phaseMs: PHASE_MS,
  frameClockMs: +settleCadence.toFixed(2), results,
}, null, 1))
console.log(`${results.length} elements sampled into ${OUT}`)
await browser.close()
