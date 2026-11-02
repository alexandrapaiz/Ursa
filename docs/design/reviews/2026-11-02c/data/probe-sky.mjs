// Why does the frozen home page draw two different skies? Load it N times
// and report, per load, everything that could move the Math.random cursor
// that the starfield's texture is dealt from.
//
//   node probe-sky.mjs <base> <w> <h> <loads>
//
// The generator in lib/freeze.mjs is seeded and deterministic, so a
// different sky can only mean the refill started at a different point in
// the sequence or asked for a different number of texels. Both are
// countable: PixelSky's full refill is exactly `w * h * 4` calls and its
// partial one is `floor(w * h * 0.12) * 5`, so the call count at the
// shutter says which refills ran.
//
// THE FIRST VERSION OF THIS FILE BROKE WHAT IT MEASURED, which is worth
// leaving in the header. It wrapped requestAnimationFrame as
// `raf(() => { n++; cb() })`, dropping the argument, so every callback
// received `undefined` instead of the pinned 2000. `Math.floor(undefined /
// 6000)` is NaN, NaN is never equal to `lastEpoch`, and the page therefore
// ran a partial refill on every single frame. Seven of eight loads agreed
// with each other and all seven were wrong. An instrument that wraps a
// callback has to pass the arguments through.
import { launch } from '../../../review-kit/lib/browser.mjs'
import { freezeInit, PINNED_MS, SEED } from '../../../review-kit/lib/freeze.mjs'

const BASE = process.argv[2] || 'http://127.0.0.1:4493'
const W = Number(process.argv[3] || 1440)
const H = Number(process.argv[4] || 900)
const LOADS = Number(process.argv[5] || 12)

const browser = await launch()
const seen = new Map()
for (let i = 0; i < LOADS; i++) {
  const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1 })
  await ctx.addInitScript(freezeInit, { t: PINNED_MS, seed: SEED, clock: true, random: true, now: null })
  await ctx.addInitScript(() => {
    const inner = Math.random
    const st = { n: 0 }
    globalThis.__p = st
    Math.random = () => { st.n++; return inner() }
    st.sizes = []
    st.stamps = []
    const d = Object.getOwnPropertyDescriptor(HTMLCanvasElement.prototype, 'width')
    Object.defineProperty(HTMLCanvasElement.prototype, 'width', {
      ...d,
      // The call count AT each raster assignment, which brackets every
      // refill: the difference between two marks is what that resize spent.
      set(v) { st.sizes.push(`${v}@${st.n}`); d.set.call(this, v) },
    })
    const raf = globalThis.requestAnimationFrame
    globalThis.requestAnimationFrame = (cb) =>
      raf((...a) => { if (st.stamps.length < 3) st.stamps.push(a[0]); cb(...a) })
  })
  const page = await ctx.newPage()
  const errs = []
  page.on('pageerror', (e) => errs.push(String(e).slice(0, 80)))
  await page.goto(BASE + '/', { waitUntil: 'networkidle' })
  await page.waitForTimeout(400)
  const o = await page.evaluate(() => {
    const c = document.querySelector('canvas')
    return {
      calls: globalThis.__p.n,
      sizes: globalThis.__p.sizes.join(' '),
      stamps: globalThis.__p.stamps.join(','),
      raster: c ? `${c.width}x${c.height}` : 'none',
      client: c ? `${c.clientWidth}x${c.clientHeight}` : 'none',
    }
  })
  const [rw, rh] = o.raster.split('x').map(Number)
  const full = rw * rh * 4
  const partial = Math.floor(rw * rh * 0.12) * 5
  const over = o.calls - full
  const refills = over === 0 ? 'full only'
    : over % partial === 0 ? `full + ${over / partial} partial`
    : `full + ${over} unaccounted`
  const key = `${o.raster}|${o.calls}|${o.sizes}|${o.stamps}`
  seen.set(key, (seen.get(key) || 0) + 1)
  console.log(
    `load ${String(i + 1).padStart(2)}  calls ${String(o.calls).padStart(8)}  full ${String(full).padStart(8)}` +
    `  ${refills.padEnd(18)} raster ${o.raster.padEnd(9)} client ${o.client.padEnd(10)}` +
    ` width-sets[${o.sizes}]  rAF t ${o.stamps}${errs.length ? '  ERR ' + errs[0] : ''}`
  )
  await ctx.close()
}
await browser.close()
console.log(`\n${seen.size} distinct outcome(s) over ${LOADS} loads: ${[...seen.values()].sort((a, b) => b - a).join('/')}`)
