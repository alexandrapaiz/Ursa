// When does the hero starfield actually come up? No prototype patching and
// no wrapping of anything the page uses, because the previous probe in this
// folder patched `HTMLCanvasElement.prototype.width` and wrapped
// requestAnimationFrame, and a probe is a suspect until it is ruled out.
//
// The only thing read is `canvas.width`, which is 300 until PixelSky's
// effect assigns it. So this answers one question: at each of a series of
// waits after networkidle, has the effect run.
//
//   node probe-mount.mjs <base> <w> <h> <loads>
import { launch } from '../../../review-kit/lib/browser.mjs'
import { freezeInit, PINNED_MS, SEED } from '../../../review-kit/lib/freeze.mjs'

const BASE = process.argv[2] || 'http://127.0.0.1:4493'
const W = Number(process.argv[3] || 1440)
const H = Number(process.argv[4] || 900)
const LOADS = Number(process.argv[5] || 10)
const MARKS = [0, 100, 200, 400, 800, 1600, 3200]

const browser = await launch()
const rows = []
for (let i = 0; i < LOADS; i++) {
  const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1 })
  await ctx.addInitScript(freezeInit, { t: PINNED_MS, seed: SEED, clock: true, random: true, now: null })
  const page = await ctx.newPage()
  const errs = []
  page.on('pageerror', (e) => errs.push(String(e).slice(0, 120)))
  await page.goto(BASE + '/', { waitUntil: 'networkidle' })
  const seq = []
  let prev = 0
  for (const m of MARKS) {
    if (m - prev > 0) await page.waitForTimeout(m - prev)
    prev = m
    const up = await page.evaluate(() => {
      const c = document.querySelector('canvas')
      return c ? c.width !== 300 : null
    })
    seq.push(up ? '#' : '.')
  }
  rows.push(seq.join(''))
  console.log(`load ${String(i + 1).padStart(2)}  ${seq.join('')}  ${errs.length ? 'ERR ' + errs[0] : ''}`)
  await ctx.close()
}
await browser.close()
console.log('\nmarks (ms after networkidle): ' + MARKS.join(' '))
MARKS.forEach((m, k) => {
  const up = rows.filter((r) => r[k] === '#').length
  console.log(`  +${String(m).padStart(4)}ms  sky up in ${up}/${LOADS} loads`)
})
