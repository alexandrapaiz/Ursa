// Photograph the site and measure each frame, at the three viewports this
// seat is told to review at.
//
//   node shoot.mjs --out ../reviews/YYYY-MM-DD/after
//   node shoot.mjs --out /tmp/x --only phone --pages /,/record
//   node shoot.mjs --out /tmp/x --live        # let the sky animate
//
// Each frame is a full-page PNG at 1x, and each one is measured for
// horizontal overflow at the same time, because "no page overflows" is a
// claim that should come from `scrollWidth` and not from squinting.
// Overflow is reported as a table on stdout; the reading of the pixels is
// the seat's own job and cannot be delegated to this file.
//
// **The frame is frozen by default**, which is a change of 2026-10-24f.
// Six of these fifteen frames used to differ from themselves by up to
// 19,140 pixels, because the home page and the 404 page animate a random
// starfield, so a before-and-after pixel count on them was noise. See
// `lib/freeze.mjs` for what is pinned and why, and pass `--live` to shoot
// the unpinned page. A number taken from a `--live` frame cannot be
// compared with anything, and the header of measurements.txt records which
// mode produced the set so that nobody has to ask.

import { mkdirSync, writeFileSync } from 'node:fs'
import { launch, VIEWPORTS } from './lib/browser.mjs'
import { freezeContext, PINNED_MS } from './lib/freeze.mjs'

const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i === -1 ? d : process.argv[i + 1] }
const OUT = arg('out', '/tmp/shots')
const BASE = arg('base', 'http://127.0.0.1:4488')
const ONLY = arg('only', null)
const PAGES = arg('pages', '/,/record,/record/mini-fixture,/record/at,/this-page-does-not-exist').split(',')
const LIVE = process.argv.includes('--live')

mkdirSync(OUT, { recursive: true })
const slug = (p) => (p === '/' ? 'home' : p.replace(/^\/|\/$/g, '').replace(/\//g, '-'))

const browser = await launch()
const rows = []
for (const [vname, w, h] of VIEWPORTS) {
  if (ONLY && ONLY !== vname) continue
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1 })
  if (!LIVE) await freezeContext(ctx)
  const page = await ctx.newPage()
  for (const path of PAGES) {
    const name = `${slug(path)}-${vname}`
    const status = (await page.goto(BASE + path, { waitUntil: 'networkidle' }))?.status()
    await page.waitForTimeout(400)
    // `animations: 'disabled'` is the other half of the freeze: lib/freeze.mjs
    // pins the two canvases, which are driven by requestAnimationFrame, and
    // this rewinds the declarative animations, which are not. The scroll cue
    // is a 2.8s infinite CSS keyframe and was the last 8 to 12 pixels of
    // nondeterminism left after the clock was pinned.
    await page.screenshot({
      path: `${OUT}/${name}.png`,
      fullPage: true,
      scale: 'css',
      ...(LIVE ? {} : { animations: 'disabled' }),
    })
    const m = await page.evaluate(() => {
      const d = document.documentElement
      // Which element is the widest, if anything is. Naming the culprit is
      // the difference between a number and a fix.
      let worst = null
      if (d.scrollWidth > d.clientWidth) {
        for (const el of document.querySelectorAll('*')) {
          const r = el.getBoundingClientRect()
          if (r.right <= d.clientWidth + 1) continue
          if (!worst || r.right > worst.right) worst = { right: Math.round(r.right), tag: el.tagName.toLowerCase(), cls: String(el.className || '').slice(0, 50) }
        }
      }
      return { scrollWidth: d.scrollWidth, clientWidth: d.clientWidth, height: d.scrollHeight, worst }
    })
    rows.push({ name, status, ...m })
  }
  await ctx.close()
}
await browser.close()

const line = (r) => `${r.name.padEnd(32)} ${String(r.status).padStart(3)}  ${String(r.scrollWidth).padStart(5)}/${String(r.clientWidth).padEnd(5)} overflow ${String(r.scrollWidth - r.clientWidth).padStart(4)}px  height ${String(r.height).padStart(5)}px${r.worst ? `  <- ${r.worst.tag}.${r.worst.cls} to ${r.worst.right}px` : ''}`
const header = LIVE
  ? '# --live: the sky is animating in these frames. Do not pixel-diff them.'
  : `# frozen at t=${PINNED_MS}ms, seeded Math.random, CSS animations rewound.`
const report = rows.map(line).join('\n')
writeFileSync(`${OUT}/measurements.txt`, `${header}\n${report}\n`)
console.log(report)
const bad = rows.filter((r) => r.scrollWidth > r.clientWidth)
console.log(bad.length ? `\n${bad.length} frame(s) overflow` : '\nno frame overflows its viewport')
