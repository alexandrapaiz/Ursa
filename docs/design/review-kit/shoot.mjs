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
// The three charter viewports are the default and `--only` picks one of
// them. `--viewports name=WxH,…` replaces the matrix outright, which is
// the other half of L25: the charter's narrowest viewport is 390, so
// until today nothing below 390 could be *photographed* either, and a
// measurement saying a surface fits at 320 is not the same claim as a
// person having looked at it there. Named rather than numbered, so the
// file names say what they are.
const VIEWPORT_ARG = arg('viewports', null)
const MATRIX = VIEWPORT_ARG
  ? VIEWPORT_ARG.split(',').map((v) => {
      const [name, dims] = v.split('=')
      const [w, h] = dims.split('x').map(Number)
      return [name, w, h]
    })
  : VIEWPORTS
const PAGES = arg('pages', '/,/record,/record/mini-fixture,/record/at,/this-page-does-not-exist').split(',')
const LIVE = process.argv.includes('--live')
// How long to let the page settle after `networkidle` before the shutter.
// 400ms is right for a static page. A surface that fetches its own data
// after hydration needs longer, and the dashboard in overlay/ is one: at
// 400ms it photographs its own loading state. The number is reported in
// measurements.txt, because a frame is only comparable with another frame
// shot at the same settle.
const WAIT = Number(arg('wait', 400))
// A selector that must be present before the shutter. `--wait` alone is a
// race on any page that fetches after hydration: the dashboard in
// overlay/ photographed its own loading state at 400ms, and then again at
// 1500ms on one viewport of three while the other two were fine. A
// timeout tuned until it usually works is not a measurement.
const UNTIL = arg('until', null)
// The same `--state` measure-hit-areas.mjs grew on 2026-10-26, for the
// same reason: a surface that only exists after a control is used cannot
// be photographed by naming a path. A module whose default export is
// `async (page, name) => {}`, run after `--until` and before the shutter.
const STATE = arg('state', null)
const enterState = STATE
  ? (await import(new URL(STATE, `file://${process.cwd()}/`).href)).default
  : null

mkdirSync(OUT, { recursive: true })
// The query string is dropped before the name is built. A path like
// `/dashboard?port=7831` is one surface, not one per port, and the port is
// a fact about this sandbox: it changes every run and it belongs in
// `measurements.txt`, which records the base URL, rather than in
// twenty-three file names. A `?` in a file name also has to be
// percent-escaped in every markdown link that points at it, so a review
// whose frames carry one is a review whose images quietly do not load.
//
// Measured on 2026-10-26e: that run renamed four frames by hand, then shot
// four more an hour later and got the query string straight back, because
// the rename never reached the thing generating the names. A cleanup the
// tool undoes on its next run is not a fix.
const slug = (p) => {
  const bare = p.replace(/[?#].*$/, '')
  return bare === '/' || bare === '' ? 'home' : bare.replace(/^\/|\/$/g, '').replace(/\//g, '-')
}

const browser = await launch()
const rows = []
for (const [vname, w, h] of MATRIX) {
  if (ONLY && ONLY !== vname) continue
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1 })
  if (!LIVE) await freezeContext(ctx)
  const page = await ctx.newPage()
  for (const path of PAGES) {
    const name = `${slug(path)}-${vname}`
    const status = (await page.goto(BASE + path, { waitUntil: 'networkidle' }))?.status()
    if (UNTIL) await page.waitForSelector(UNTIL, { timeout: 30000 })
    if (enterState) await enterState(page, name)
    await page.waitForTimeout(WAIT)
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
const settle = `# settled ${WAIT}ms after networkidle${UNTIL ? ` and after \`${UNTIL}\` appeared` : ''}${STATE ? `, with \`${STATE}\` run to enter the state` : ''} before each shutter.`
// A frame set shot at a width nobody expects has to say so in its own
// manifest, or the next run compares it against the charter's three and
// reads the difference as a regression.
const matrixLine = `# viewports ${MATRIX.map(([n, w, h]) => `${n} ${w}x${h}`).join(', ')}${VIEWPORT_ARG ? ' (--viewports, not the charter default)' : ''}`
const report = rows.map(line).join('\n')
writeFileSync(`${OUT}/measurements.txt`, `${header}\n${settle}\n${matrixLine}\n${report}\n`)
console.log(report)
const bad = rows.filter((r) => r.scrollWidth > r.clientWidth)
console.log(bad.length ? `\n${bad.length} frame(s) overflow` : '\nno frame overflows its viewport')
