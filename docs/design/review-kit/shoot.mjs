// Photograph the site and measure each frame, at the three viewports this
// seat is told to review at.
//
//   node shoot.mjs --out ../reviews/YYYY-MM-DD/after
//   node shoot.mjs --out /tmp/x --only phone --pages /,/record
//   node shoot.mjs --out /tmp/x --live        # let the sky animate
//   node shoot.mjs --out /tmp/x --pin-now 2026-11-02T00:00:00.000Z
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
import { tracker } from './lib/reached.mjs'

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
// The not-found page is a page of this site and is reviewed like any
// other, so its status is the subject rather than a failure. Declared
// here because the default page list above asks for it; a caller passing
// its own `--pages` declares its own.
const EXPECT_404 = arg('expect-404', PAGES.includes('/this-page-does-not-exist') ? '/this-page-does-not-exist' : '').split(',').filter(Boolean)
const reach = tracker({ expect404: EXPECT_404, label: 'frame' })
const LIVE = process.argv.includes('--live')
// `--pin-now <iso>` pins the page's `Date` to one instant, so two shoots of a
// surface that reads the clock can be compared. Opt-in, because a run that is
// only photographing should get the real page, and the instant cannot be
// defaulted: `PINNED_MS` is 1970 and a 1970 clock draws a page the product
// never draws. L45.
//
// **It pins the page's clock and nothing else's.** The one surface this was
// written for, the overlay dashboard, prints a timestamp the *server* stamped,
// so this flag alone does not make that frame comparable. See
// `lib/pin-clock.mjs` and reviews/2026-11-02 §3. The header below says which
// clock was pinned, so a frame set cannot claim a guarantee it does not carry.
const PIN_NOW_ARG = arg('pin-now', null)
const PIN_NOW = PIN_NOW_ARG === null ? null : Date.parse(PIN_NOW_ARG)
if (PIN_NOW_ARG !== null && Number.isNaN(PIN_NOW)) {
  // The value is named rather than only its badness, so a run that passed a
  // date in the wrong shape does not go looking at the browser.
  console.error(`--pin-now was given "${PIN_NOW_ARG}", which Date.parse cannot read. Use an ISO instant, for example 2026-11-02T00:00:00.000Z`)
  process.exit(2)
}
if (PIN_NOW_ARG !== null && LIVE) {
  // `--live` applies no init script at all, so the pin would be accepted and
  // then do nothing, and the header would be the only place the contradiction
  // showed. A flag that is silently inert is the defect L45 is about.
  console.error('--pin-now and --live contradict each other: --live applies no init script, so there is nothing to pin the clock in. Pass one or the other.')
  process.exit(2)
}
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
  if (!LIVE) await freezeContext(ctx, PIN_NOW === null ? {} : { now: PIN_NOW })
  const page = await ctx.newPage()
  for (const path of PAGES) {
    const name = `${slug(path)}-${vname}`
    // The status was already read here and printed in every row, and
    // nothing ever gated on it, so a run over a site whose every route
    // had been renamed photographed five not-found pages and reported
    // `no frame overflows its viewport`. Measured 2026-11-09.
    const status = reach.saw(path, await page.goto(BASE + path, { waitUntil: 'networkidle' }))
    if (UNTIL) await page.waitForSelector(UNTIL, { timeout: 30000 })
    if (enterState) await enterState(page, name)
    // Ask the page what time it thinks it is, rather than trusting that the
    // init script ran. L37: a flag accepted is not a flag applied, and the
    // whole point of the pin is that a frame set can be believed later.
    if (PIN_NOW !== null) {
      const seen = await page.evaluate(() => Date.now())
      if (seen !== PIN_NOW) {
        console.error(`--pin-now did not take on ${name}: the page reports ${seen}, not ${PIN_NOW}. Nothing was written.`)
        process.exit(2)
      }
    }
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
  : `# frozen at t=${PINNED_MS}ms, seeded Math.random, CSS animations rewound.` +
    (PIN_NOW === null
      ? '\n# the page clock is NOT pinned: a surface that reads it differs from itself.'
      : `\n# the page's Date is pinned to ${new Date(PIN_NOW).toISOString()}, verified in the page.`) +
    // Said on both branches, because the gap is the same either way and a set
    // whose header reports a pin is the set most likely to be trusted past
    // what the pin covers. This tool runs the browser and cannot see whether
    // the server behind it was preloaded, so it states the limit rather than
    // a guarantee it is not in a position to give.
    '\n# this covers the clock inside the page only. A timestamp a server stamps into a payload is pinned by lib/pin-clock.mjs, in the serving process, or not at all.'
const settle = `# settled ${WAIT}ms after networkidle${UNTIL ? ` and after \`${UNTIL}\` appeared` : ''}${STATE ? `, with \`${STATE}\` run to enter the state` : ''} before each shutter.`
// A frame set shot at a width nobody expects has to say so in its own
// manifest, or the next run compares it against the charter's three and
// reads the difference as a regression.
const matrixLine = `# viewports ${MATRIX.map(([n, w, h]) => `${n} ${w}x${h}`).join(', ')}${VIEWPORT_ARG ? ' (--viewports, not the charter default)' : ''}`
const report = rows.map(line).join('\n')
writeFileSync(`${OUT}/measurements.txt`, `${header}\n${settle}\n${matrixLine}\n${report}\n`)
console.log(report)
const bad = rows.filter((r) => r.scrollWidth > r.clientWidth)
// The reach verdict comes FIRST, because the overflow headline is only
// meaningful over frames of the pages that were asked for.
const reachLines = reach.lines()
if (reachLines.length) console.log(reachLines.join('\n'))
if (reach.code()) {
  console.log('\nno claim about overflow: see above.')
  process.exit(reach.code())
}
// A verdict about the SITE stays exit 0 however bad it is, because the
// reader of the table makes that call. See lib/reached.mjs.
console.log(bad.length ? `\n${bad.length} frame(s) overflow` : '\nno frame overflows its viewport')
