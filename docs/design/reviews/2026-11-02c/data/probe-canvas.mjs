// Which canvas resizes, to what, and with what client box at the time.
//
//   node probe-canvas.mjs <base> <w> <h> <loads>
//
// The home page mounts TWO canvases, PixelSky and Constellation, and the
// previous probe in this folder hooked `HTMLCanvasElement.prototype.width`,
// which is shared by both. Every raster assignment it printed was therefore
// unattributed, and the `1` in its sequence could have belonged to either.
// Constellation has no `Math.random` in it, so a resize of that one cannot
// move a pixel of the starfield, and half the evidence was about the wrong
// element. Tag by className and record the client box each resize saw.
import { createHash } from 'node:crypto'
import { launch } from '../../../review-kit/lib/browser.mjs'
import { freezeInit, PINNED_MS, SEED } from '../../../review-kit/lib/freeze.mjs'

const BASE = process.argv[2] || 'http://127.0.0.1:4495'
const W = Number(process.argv[3] || 1440)
const H = Number(process.argv[4] || 900)
const LOADS = Number(process.argv[5] || 6)

const browser = await launch()
const byHash = new Map()
for (let i = 0; i < LOADS; i++) {
  const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1 })
  await ctx.addInitScript(freezeInit, { t: PINNED_MS, seed: SEED, clock: true, random: true, now: null })
  await ctx.addInitScript(() => {
    const inner = Math.random
    const st = { n: 0, log: [] }
    globalThis.__p = st
    Math.random = () => { st.n++; return inner() }
    const tag = (c) => (c.className || '').includes('-z-10') ? 'sky' : 'const'
    const d = Object.getOwnPropertyDescriptor(HTMLCanvasElement.prototype, 'width')
    Object.defineProperty(HTMLCanvasElement.prototype, 'width', {
      ...d,
      set(v) {
        st.log.push(`${tag(this)}:w=${v} client=${this.clientWidth}x${this.clientHeight} @${st.n}`)
        d.set.call(this, v)
      },
    })
  })
  const page = await ctx.newPage()
  await page.goto(BASE + '/', { waitUntil: 'networkidle' })
  await page.waitForTimeout(400)
  const png = await page.screenshot({ fullPage: true })
  const hash = createHash('sha256').update(png).digest('hex').slice(0, 10)
  const o = await page.evaluate(() => ({ n: globalThis.__p.n, log: globalThis.__p.log }))
  byHash.set(hash, (byHash.get(hash) || 0) + 1)
  console.log(`load ${i + 1}  frame ${hash}  calls ${o.n}`)
  for (const l of o.log) console.log('      ' + l)
  await ctx.close()
}
await browser.close()
console.log(`\n${byHash.size} distinct frame(s) over ${LOADS}: ` +
            [...byHash.entries()].map(([h, n]) => `${h} x${n}`).join(', '))
