// Join the cause to the effect: for each load, the Math.random call count
// AND the hash of the frame it produced. Everything the previous two probes
// measured was on one side or the other of that join, so neither could say
// which call count drew which sky.
//
//   node probe-join.mjs <base> <w> <h> <loads> <settle-ms>
//
// The settle is a parameter because the two causes under test are separable
// by it: the mount race (probe-mount.mjs) is gone by +800ms, so a run at
// 1600 isolates whatever is left.
import { createHash } from 'node:crypto'
import { launch } from '../../../review-kit/lib/browser.mjs'
import { freezeInit, PINNED_MS, SEED } from '../../../review-kit/lib/freeze.mjs'

const BASE = process.argv[2] || 'http://127.0.0.1:4493'
const W = Number(process.argv[3] || 1440)
const H = Number(process.argv[4] || 900)
const LOADS = Number(process.argv[5] || 12)
const SETTLE = Number(process.argv[6] || 1600)

const browser = await launch()
const byHash = new Map()
for (let i = 0; i < LOADS; i++) {
  const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1 })
  await ctx.addInitScript(freezeInit, { t: PINNED_MS, seed: SEED, clock: true, random: true, now: null })
  await ctx.addInitScript(() => {
    const inner = Math.random
    const st = { n: 0, sizes: [], stamps: 0, firstT: null }
    globalThis.__p = st
    Math.random = () => { st.n++; return inner() }
    const d = Object.getOwnPropertyDescriptor(HTMLCanvasElement.prototype, 'width')
    Object.defineProperty(HTMLCanvasElement.prototype, 'width', {
      ...d, set(v) { st.sizes.push(`${v}@${st.n}`); d.set.call(this, v) },
    })
    const raf = globalThis.requestAnimationFrame
    globalThis.requestAnimationFrame = (cb) =>
      raf((...a) => { st.stamps++; if (st.firstT === null) st.firstT = a[0]; cb(...a) })
  })
  const page = await ctx.newPage()
  await page.goto(BASE + '/', { waitUntil: 'networkidle' })
  await page.waitForTimeout(SETTLE)
  const o = await page.evaluate(() => {
    const c = document.querySelector('canvas')
    return { ...globalThis.__p, sizes: globalThis.__p.sizes.join(' '),
             raster: `${c.width}x${c.height}`, scrollY: Math.round(scrollY) }
  })
  const png = await page.screenshot({ fullPage: true })
  const hash = createHash('sha256').update(png).digest('hex').slice(0, 10)
  const after = await page.evaluate(() => {
    const c = document.querySelector('canvas')
    return { n: globalThis.__p.n, stamps: globalThis.__p.stamps, scrollY: Math.round(scrollY),
             sizes: globalThis.__p.sizes.join(' '), raster: `${c.width}x${c.height}`,
             client: `${c.clientWidth}x${c.clientHeight}` }
  })
  const [rw, rh] = o.raster.split('x').map(Number)
  const full = rw * rh * 4
  const partial = Math.floor(rw * rh * 0.12) * 5
  const over = o.n - full - 2
  const acct = over === 0 ? 'full only'
    : over % partial === 0 ? `full + ${over / partial} partial`
    : `full + ${over} unaccounted`
  console.log(
    `load ${String(i + 1).padStart(2)}  frame ${hash}  calls@shutter ${String(o.n).padStart(8)} (${acct})` +
    `  calls after ${String(after.n - o.n).padStart(8)}  rAF ${String(o.stamps).padStart(4)}->${String(after.stamps).padStart(4)}` +
    `  firstT ${o.firstT}  scrollY ${o.scrollY}->${after.scrollY}\n      widths before[${o.sizes}] after[${after.sizes}]  raster ${o.raster}->${after.raster}  client ${after.client}`
  )
  byHash.set(hash, (byHash.get(hash) || 0) + 1)
  await ctx.close()
}
await browser.close()
console.log(`\n${byHash.size} distinct frame(s) over ${LOADS} loads at settle ${SETTLE}ms: ` +
            [...byHash.entries()].map(([h, n]) => `${h} x${n}`).join(', '))
