/**
 * The keyboard pass: can every control be reached with Tab, and once
 * reached, can the indicator that says so actually be seen?
 *
 * usage: node measure-focus.mjs --base <url> [options]
 *   --pages name=/path,…   default: ursa-minor's five
 *   --only <viewport>      one of phone, tablet, desktop
 *   --viewports n=WxH,…    replace the matrix outright
 *   --until <sel>          gate on content, for a page that fetches late
 *   --state <module.mjs>   drive the page into a state first
 *   --out <file>           write the table here as well as to stdout
 *   --json [file]          write every stop as JSON
 *   --frames <dir>         write the focused crop of every stop here
 *   --live                 let the sky animate (defeats the diff; debug only)
 *
 * Exit 0 the table printed and nothing is below a floor. Exit 1 at least
 * one control is unreachable or its indicator is below a floor. Exit 2 a
 * page offered no focusable control at all, which on this site means the
 * page did not finish loading.
 *
 * WHY THIS EXISTS. This kit measures the pointer and it does not measure
 * the keyboard. `measure-hit-areas.mjs` asks how big a control is under a
 * finger. `measure-contrast.mjs` asks whether text can be read, and its
 * headline, 0 of 533 runs below their 1.4.3 threshold, is the number this
 * seat reports every run. Neither of them asks the question a keyboard
 * user asks first, which is "where am I". The word "keyboard" appears
 * once in 1883 lines of the design ledger, in a benchmark note about
 * Stripe's CLI reference.
 *
 * The site does have one considered answer: a single global
 * `:focus-visible` at `1px solid var(--polar)` with a 3px offset,
 * benchmarked on 2026-10-01 against claude.com, Linear and Vercel, all
 * three of which declare focus once as a site-level token. That review
 * shipped two screenshots of two tab stops on one page. It did not
 * enumerate the stops, and it could not: nothing here walks the tab ring.
 *
 * SO WHAT COULD BE WRONG THAT NOBODY WOULD SEE.
 *
 *   1. A control no Tab ever reaches. `measure-hit-areas.mjs` counts it,
 *      because it is in the DOM and it has a box, and a pointer finds it
 *      fine. The keyboard never arrives. Nothing in this kit compares the
 *      two sets.
 *
 *   2. A ring drawn in a colour its own backdrop happens to share. L36
 *      found exactly this for the dashboard's fourth provenance swatch,
 *      at 1.20:1 against a 3:1 floor, and the reason it was findable is
 *      that someone photographed the pixels instead of reading the
 *      stylesheet. `--polar` on `--night` is a fine ratio and it is not
 *      the question: the ring sits 3px OUTSIDE its control, so what is
 *      behind it is whatever is 3px outside, and on the home page that is
 *      a starfield with bright pixels in it.
 *
 *   3. A ring thinner than the standard it is being judged against.
 *      WCAG 2.4.11 asks that the indicator cover at least the area of a
 *      2 CSS px perimeter of the unfocused control. A 1px ring covers
 *      about half of that, and the arithmetic is the same on every
 *      control, so this is a design decision rather than a bug. It is
 *      reported as its own column and never as a failure, because the
 *      ring's weight is identity and the charter says identity is this
 *      seat's to protect and not to reinvent.
 *
 * HOW THE RING IS MEASURED, AND WHY NOT OFF THE STYLESHEET.
 *
 * For each tab stop: photograph the neighbourhood of the control with the
 * control focused, then blur it in the page and photograph the identical
 * rectangle again. Every pixel that differs between the two frames is the
 * indicator, by definition, because nothing else about the page changed.
 * That definition is what makes this robust to how the indicator is drawn:
 * an outline, a box-shadow, a background wash, an inset border and a
 * pseudo-element all answer the same way, and none of them has to be
 * named in advance.
 *
 * The contrast of each indicator pixel is then the ratio between its
 * focused colour and its own unfocused colour at the same coordinate.
 * That is the adjacency 1.4.11 asks for, read at the one place where the
 * two colours are guaranteed to be the two colours a reader is comparing.
 * A ring drawn over a star scores against that star rather than against
 * the page's nominal background.
 *
 * TWO WAYS THIS MEASUREMENT CAN LIE, AND WHAT IS DONE ABOUT EACH.
 *
 *   Drift. If the page moves between the two shutters, every moved pixel
 *   reads as indicator. The sky alone differs from itself by up to 19,140
 *   pixels unfrozen (lib/freeze.mjs). So the context is frozen, and on
 *   top of that each stop takes a third frame, blurred, immediately after
 *   the second: any pixel that differs between those two identical states
 *   is drift, and a stop whose drift exceeds a twentieth of its own
 *   indicator is reported UNSTABLE rather than given a number. A number
 *   this tool cannot stand behind is not printed as one, which is L15.
 *
 *   A wash around the ring. ADDED 2026-11-02 (run h), after the share
 *   column failed a focus treatment that is correct. `.quiet-link` on the
 *   404 page answers focus with three things at once: the site ring at
 *   11:1, a brightened border, and a 6% background wash over the control's
 *   whole interior. The wash is most of the changed pixels and almost none
 *   of the contrast, so the share came out at 5% and the verdict said
 *   BELOW_FLOOR for a ring that the magnified frames show is excellent.
 *   The share statistic silently assumes the indicator is only the ring.
 *
 *   So a stop that fails the share is asked a second question before it is
 *   failed: do the pixels that DO clear 3:1 cover at least a 1 CSS px
 *   perimeter of the control on their own, which is (w+2)(h+2) - wh. That
 *   is the ring this site declares, measured off the control's own box, so
 *   it is arithmetic rather than a tuned threshold, and it is the same
 *   yardstick as the 2.4.11 column one weight down. A ring plus a wash
 *   clears it and is reported COMPOSITE. A ring drawn along one edge only
 *   does not, because one edge of a 230x47 control is 230 pixels against a
 *   558 pixel perimeter, and it stays BELOW_FLOOR. A ring drawn in its own
 *   backdrop's colour has no clearing pixels at all and stays BELOW_FLOOR
 *   too, which is the selftest's fixture 4.
 *
 *   One bright pixel. A single high-contrast pixel in a 1px ring would
 *   carry a minimum-of-all-pixels report to a pass if the report were a
 *   maximum, and to a failure if it were a minimum, and neither is the
 *   reader's experience. So every stop carries the SHARE of its indicator
 *   that clears 3:1, the way measure-swatches.mjs does, and the floor is
 *   on that share. A ring that is visible along one edge and invisible
 *   along the other three is the finding this column exists to surface,
 *   and no single statistic shows it.
 *
 * Read-only. Nothing is clicked. Tab and Shift+Tab are the only input,
 * because `:focus-visible` is the thing being measured and a click does
 * not raise it.
 */
import { launch, VIEWPORTS } from './lib/browser.mjs'
import { freezeContext } from './lib/freeze.mjs'
import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { tracker } from './lib/reached.mjs'

const arg = (n, d) => {
  const i = process.argv.indexOf(`--${n}`)
  return i === -1 ? d : process.argv[i + 1]
}
const flag = (n) => process.argv.includes(`--${n}`)

const BASE = arg('base', process.env.URSA_BASE ?? 'http://127.0.0.1:4953')
const OUT = arg('out', null)
const JSON_OUT = process.argv.includes('--json') ? arg('json', 'focus.json') : null
const FRAMES = arg('frames', null)
const ONLY = arg('only', process.env.VIEWPORT ?? null)
const UNTIL = arg('until', null)
const STATE = arg('state', null)
const LIVE = flag('live')

// The floor for a graphical object you have to read, WCAG 1.4.11.
const RATIO_FLOOR = 3
// The share of the indicator that has to clear it. Not 100%: the ring is
// antialiased, so its corner pixels are part-covered by construction and
// a handful of them land below the floor on any backdrop. Measured on
// this site, a ring that reads cleanly answers above 0.9 and a ring
// drawn in its own backdrop's colour answers near 0.
const SHARE_FLOOR = 0.6
// Past this many Tab presses, stop and report rather than loop forever.
const MAX_STOPS = 200
// How far outside the control to photograph. The ring is 1px at a 3px
// offset, so 4px would be exactly enough and 12 leaves room for a wash,
// a shadow or a lift to show up as well.
const PAD = 12

const VPS = (() => {
  const spec = arg('viewports', null)
  if (spec) {
    return spec.split(',').map((v) => {
      const [name, dims] = v.split('=')
      const [w, h] = dims.split('x').map(Number)
      return [name, w, h]
    })
  }
  return ONLY ? VIEWPORTS.filter((v) => v[0] === ONLY) : VIEWPORTS
})()

const PAGES = arg(
  'pages',
  'home=/,set=/record,record=/record/mini-fixture,address=/record/at,404=/this-page-does-not-exist',
)
  .split(',')
  .map((p) => {
    const i = p.indexOf('=')
    return [p.slice(0, i), p.slice(i + 1)]
  })
// The not-found page is in the default list on purpose and its status is
// the subject, so it is declared. A caller passing its own `--pages`
// declares its own with `--expect-404`.
const EXPECT_404 = arg('expect-404', PAGES.some(([, p]) => p === '/this-page-does-not-exist') ? '/this-page-does-not-exist' : '').split(',').filter(Boolean)
const reach = tracker({ expect404: EXPECT_404, label: 'page' })

const enterState = STATE
  ? (await import(new URL(STATE, `file://${process.cwd()}/`).href)).default
  : null

if (FRAMES) mkdirSync(FRAMES, { recursive: true })

// ---------------------------------------------------------------- page side

/* Every element the DOM says can take focus, which is the set the tab
   walk is checked against. Deliberately generous: a `tabindex="-1"`
   element is focusable by script and not by Tab, so it is excluded here
   rather than counted and then reported as unreachable, which would be a
   false positive on every programmatic focus target on the site. */
const ENUMERATE = () => {
  const SEL = [
    'a[href]',
    'button',
    'input',
    'select',
    'textarea',
    'summary',
    '[contenteditable=""]',
    '[contenteditable="true"]',
    '[tabindex]',
  ].join(',')
  const key = (el) => {
    const r = el.getBoundingClientRect()
    return [
      el.tagName.toLowerCase(),
      el.id ? `#${el.id}` : '',
      el.className && typeof el.className === 'string'
        ? `.${el.className.trim().split(/\s+/).slice(0, 2).join('.')}`
        : '',
      `@${Math.round(r.x)},${Math.round(r.y)}`,
    ].join('')
  }
  const out = []
  let i = 0
  for (const el of document.querySelectorAll(SEL)) {
    if (el.disabled) continue
    if (el.closest('[inert]')) continue
    if (el.hasAttribute('tabindex') && Number(el.getAttribute('tabindex')) < 0) continue
    const cs = getComputedStyle(el)
    if (cs.display === 'none' || cs.visibility === 'hidden') continue
    const r = el.getBoundingClientRect()
    // A zero-box element can still be a legitimate tab stop (a
    // skip link parked offscreen). Record it, flag it, do not drop it.
    el.setAttribute('data-focus-probe', String(i))
    out.push({
      probe: i++,
      key: key(el),
      tag: el.tagName.toLowerCase(),
      w: Math.round(r.width),
      h: Math.round(r.height),
      zeroBox: r.width < 1 || r.height < 1,
      offscreen: r.bottom < 0 || r.right < 0 || r.left > innerWidth || r.top > innerHeight,
      // Collapsed, not just trimmed: a <pre> is a legitimate tab stop in
      // Chromium when it scrolls, and its text carries newlines that break
      // the row of the markdown table it is printed into.
      text: (el.getAttribute('aria-label') || el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 40),
    })
  }
  return out
}

const ACTIVE = () => {
  const el = document.activeElement
  if (!el || el === document.body || el === document.documentElement) return null
  const r = el.getBoundingClientRect()
  /* A stop the enumeration never declared has no probe, so until
     2026-11-09 the walk identified it by its tag and its coordinates, and
     the walk stops when an identity repeats because that is how a closed
     ring is detected. The box is VIEWPORT-relative and Tab scrolls each
     stop into view, so two undeclared stops of the same tag on a tall page
     land at the same x,y. On this site's home page at 390 the first and
     third <pre> both land at 49,401 while sitting 694px apart in the
     document, measured this run. The walk read the third as the first
     returning, stopped one stop early, and reported the copy button behind
     it as a control the keyboard cannot reach. It is reachable.

     So the identity is stamped on the element on first sight instead of
     computed from where it happens to be. Two elements cannot share it,
     and one element keeps it however far the page scrolls under it. L61. */
  let mark = el.getAttribute('data-focus-walk')
  if (mark === null) {
    mark = String(Number(document.documentElement.dataset.focusWalk ?? 0))
    document.documentElement.dataset.focusWalk = String(Number(mark) + 1)
    el.setAttribute('data-focus-walk', mark)
  }
  return {
    probe: el.hasAttribute('data-focus-probe') ? Number(el.getAttribute('data-focus-probe')) : null,
    mark: Number(mark),
    tag: el.tagName.toLowerCase(),
    box: { x: r.x, y: r.y, w: r.width, h: r.height },
    matchesFocusVisible: el.matches(':focus-visible'),
    text: (el.getAttribute('aria-label') || el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 40),
  }
}

// ----------------------------------------------------------------- pixel side

const lum = (r, g, b) => {
  const f = (c) => {
    const s = c / 255
    return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b)
}
const ratio = (a, b) => {
  const [hi, lo] = a > b ? [a, b] : [b, a]
  return (hi + 0.05) / (lo + 0.05)
}

/* A PNG is a container, so rather than decode one here the frames are
   compared in the page, where the browser already has a decoder. Both
   buffers are handed in as base64 and drawn to a canvas. This keeps the
   kit free of an image dependency, which is the same reason
   measure-contrast.mjs does its sampling in the page. */
const COMPARE = async ([aB64, bB64, cB64]) => {
  const load = (b64) =>
    new Promise((ok, no) => {
      const img = new Image()
      img.onload = () => ok(img)
      img.onerror = no
      img.src = `data:image/png;base64,${b64}`
    })
  const [A, B, C] = await Promise.all([load(aB64), load(bB64), load(cB64)])
  const px = (img) => {
    const c = document.createElement('canvas')
    c.width = img.naturalWidth
    c.height = img.naturalHeight
    const g = c.getContext('2d', { willReadFrequently: true })
    g.drawImage(img, 0, 0)
    return { d: g.getImageData(0, 0, c.width, c.height).data, w: c.width, h: c.height }
  }
  const a = px(A)
  const b = px(B)
  const c = px(C)
  if (a.w !== b.w || a.h !== b.h || a.w !== c.w || a.h !== c.h) return { mismatch: true }
  const diff = (p, q) => {
    const out = []
    for (let i = 0; i < p.d.length; i += 4) {
      if (p.d[i] !== q.d[i] || p.d[i + 1] !== q.d[i + 1] || p.d[i + 2] !== q.d[i + 2]) out.push(i)
    }
    return out
  }
  return { focused: a, unfocused: b, indicator: diff(a, b), drift: diff(b, c).length, w: a.w, h: a.h }
}

// ------------------------------------------------------------------ the walk

const browser = await launch()
const rows = []
const pageNotes = []

for (const [vpName, width, height] of VPS) {
  for (const [pageName, path] of PAGES) {
    const t0 = Date.now()
    const ctx = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 1 })
    // `scroll: true`, because this tool scrolls the page on purpose and
    // then photographs a rectangle it computed before the scroll. The site
    // declares `scroll-behavior: smooth`, so without this pin the two
    // frames of a stop can come from two different scroll offsets. See
    // lib/freeze.mjs and L59.
    if (!LIVE) await freezeContext(ctx, { scroll: true })
    const page = await ctx.newPage()
    // Only the navigation is wrapped; the tab walk below is the measuring.
    const visit = await reach.visit(page, `${BASE}${path}`, path, { waitUntil: 'networkidle', timeout: 30000 })
    if (!visit.ok) { await ctx.close(); continue }
    if (UNTIL) await page.waitForSelector(UNTIL, { timeout: 30000 })
    if (enterState) await enterState(page, `${pageName}-${vpName}`)
    // The sky is a canvas with a requestAnimationFrame loop. freezeContext
    // pins its clock, but the first frame still has to be painted before
    // the backdrop behind a ring is the backdrop a reader sees.
    await page.waitForTimeout(400)

    const declared = await page.evaluate(ENUMERATE)
    process.stderr.write(
      `${pageName}/${vpName}: ${declared.length} focusable in the DOM`.padEnd(52),
    )
    if (declared.length === 0) {
      pageNotes.push({ page: pageName, viewport: vpName, note: 'no focusable element in the DOM' })
      process.stderr.write(' EMPTY\n')
      await ctx.close()
      continue
    }

    // Start at the top of the document so the first Tab lands on the first
    // stop. `blur()` is not enough and that is the whole point of this
    // block: it clears the focused element, but the thing Tab actually
    // consults is the **sequential focus navigation starting point**, which
    // blurring does not move. On a freshly loaded page the two agree, so
    // the old one-line version was right for four months and wrong the
    // moment `--state` was used for what it is for.
    //
    // Measured 2026-11-09 on the set view, whose state module clicks "read
    // the site" to make the rows exist: as shipped the walk began at that
    // button and found 3 stops of 11, reporting the 5 controls above it as
    // controls the keyboard cannot reach. With the starting point reset it
    // finds all of them, in document order, beginning at the wordmark.
    //
    // This is L61's shape a third time, and the corroboration trap is the
    // same: a walk that begins late deflates the stop count and inflates
    // the unreachable count together, so the two headline numbers agree
    // with each other while both are wrong.
    //
    // A momentary element is used rather than focusing `<body>`, because a
    // `tabindex` added to `<body>` is itself a focusable element and would
    // have to be removed before the walk, which puts us back where we
    // started. The span is inserted before the first child, focused, and
    // removed; Chromium keeps the starting point at the position the
    // removed element held, which is what makes the next Tab land on the
    // document's first stop. It is a sibling of the app's root rather than
    // inside it, so no framework sees its tree change.
    await page.evaluate(() => {
      window.scrollTo(0, 0)
      document.activeElement?.blur?.()
      const probe = document.createElement('span')
      probe.tabIndex = -1
      document.body.insertBefore(probe, document.body.firstChild)
      probe.focus()
      probe.remove()
    })
    await page.keyboard.press('Tab')

    const reached = []
    const seen = new Set()
    for (let n = 0; n < MAX_STOPS; n++) {
      const act = await page.evaluate(ACTIVE)
      if (!act) break
      // `u<mark>` and not a coordinate: see the note in ACTIVE. A repeat
      // here now means the keyboard genuinely came back to a stop it had
      // already been on, which is the only thing that should end the walk.
      const id = act.probe !== null ? `p${act.probe}` : `u${act.mark}`
      if (seen.has(id)) break // the ring closed
      seen.add(id)
      reached.push({ stop: n, id, ...act })
      await page.keyboard.press('Tab')
    }
    process.stderr.write(` ${reached.length} tab stops`.padEnd(16))

    // Now measure each reached stop. Re-drive Tab from the top for each
    // one rather than holding a handle, because a handle outlives a
    // re-render and a stop index does not, and this way the thing
    // measured is the thing the keyboard actually reaches.
    let measured = 0
    for (const stop of reached) {
      // A stop Tab reaches that the enumeration never offered. This is the
      // exact mirror of `unreachable` below, and until 2026-11-02 it was a
      // bare `continue`: the stop vanished from the table with no row and
      // no count, so a page reporting "5 focusable in the DOM, 6 tab stops"
      // printed five rows and nobody could say what the sixth was. Both
      // directions of the set difference are findings, and only one of them
      // was being reported.
      if (stop.probe === null) {
        rows.push({ page: pageName, viewport: vpName, ...stop, verdict: 'UNDECLARED' })
        continue
      }
      const el = page.locator(`[data-focus-probe="${stop.probe}"]`)
      if ((await el.count()) !== 1) {
        rows.push({ page: pageName, viewport: vpName, ...stop, verdict: 'GONE_FROM_DOM' })
        continue
      }
      await el.evaluate((n) => n.scrollIntoView({ block: 'center', behavior: 'instant' }))
      await page.waitForTimeout(80)
      const preBox = await el.boundingBox()
      if (!preBox || preBox.width < 1 || preBox.height < 1) {
        rows.push({ page: pageName, viewport: vpName, ...stop, verdict: 'ZERO_BOX' })
        continue
      }

      // Keyboard focus, so :focus-visible applies. focus() alone does not
      // raise it in Chromium for a non-text control, which is the whole
      // reason this tool drives Tab instead of calling focus().
      //
      // Shift+Tab then Tab is how a script gets a keyboard focus onto an
      // element it has a handle on. It can land somewhere else: on the
      // first stop in the ring, Shift+Tab leaves the document and the
      // Tab that follows need not come back where it left. So the landing
      // is checked rather than assumed, and a stop that cannot be given a
      // keyboard focus is reported as one instead of being measured as if
      // it had been. The alternative, measuring whatever Chromium focused
      // and labelling it with this element's name, is the failure mode
      // that produces confident nonsense.
      await el.evaluate((n) => n.focus({ preventScroll: true }))
      await page.keyboard.press('Shift+Tab')
      await page.keyboard.press('Tab')
      const landed = await page.evaluate(
        (p) => document.activeElement?.getAttribute?.('data-focus-probe') === String(p),
        stop.probe,
      )
      if (!landed) {
        rows.push({ page: pageName, viewport: vpName, ...stop, verdict: 'NO_KEYBOARD_FOCUS' })
        continue
      }
      const isFV = await el.evaluate((n) => n.matches(':focus-visible'))
      await page.waitForTimeout(60)

      // The box is re-read HERE, after the keyboard focus has landed, and
      // not before it. Driving Shift+Tab and Tab makes the browser scroll
      // two controls into view, so a clip computed from the box taken
      // before that is a rectangle the control has since left. With
      // `scroll-behavior: smooth` on the document it is worse than stale:
      // the page is still moving, and the focused frame and the blurred
      // frame come from two different offsets. freezeContext pins the
      // behaviour; this re-read is what makes the rectangle right.
      const rawBox = await el.boundingBox()
      if (!rawBox || rawBox.width < 1 || rawBox.height < 1) {
        rows.push({ page: pageName, viewport: vpName, ...stop, verdict: 'ZERO_BOX' })
        continue
      }

      /* A control small enough that its indicator cannot be on it.
         `measure-hit-areas.mjs` has the mirror of this and `verify-hover.mjs`
         says it outright: three of this site's hover rules style a
         descendant rather than the hovered element. Focus has the same
         shape one direction up. The file input in the record loader is
         `sr-only`, so it is a 1x1 box inside a 182x47 label, and the ring
         that says it is focused is drawn on the label. A rectangle padded
         12px around the input contains none of that ring and the stop
         reported NO_INDICATOR for a control whose focus is correct.
         Measured 2026-11-02: the label matches `:has(> input:focus-visible)`
         and its computed outline is `rgb(168,199,250) solid 1px`, while
         this tool photographed nothing.

         So a control under 8px on either side is photographed over the
         nearest ancestor that has a real box. The climb is capped at five
         levels and at half the viewport's area, because an uncapped climb
         ends at <body> and photographs the page. The row says which box it
         used, so nobody reads an ancestor's ring as the control's own. */
      let box = rawBox
      let measuredOn = 'self'
      if (rawBox.width < 8 || rawBox.height < 8) {
        const widened = await el.evaluate((n, maxArea) => {
          let a = n.parentElement
          for (let i = 0; i < 5 && a; i++, a = a.parentElement) {
            const r = a.getBoundingClientRect()
            if (r.width >= 8 && r.height >= 8) {
              if (r.width * r.height > maxArea) return null
              return { x: r.x, y: r.y, width: r.width, height: r.height, tag: a.tagName.toLowerCase() }
            }
          }
          return null
        }, (width * height) / 2)
        if (widened) {
          box = widened
          measuredOn = `ancestor:${widened.tag}`
        }
      }
      const vp = page.viewportSize()
      const clip = {
        x: Math.max(0, Math.floor(box.x - PAD)),
        y: Math.max(0, Math.floor(box.y - PAD)),
        width: 0,
        height: 0,
      }
      clip.width = Math.min(vp.width - clip.x, Math.ceil(box.width + 2 * PAD + (box.x - PAD - clip.x)))
      clip.height = Math.min(vp.height - clip.y, Math.ceil(box.height + 2 * PAD + (box.y - PAD - clip.y)))

      // A control whose box lies outside the viewport gives a clip with a
      // zero or negative side, and `page.screenshot` throws on it. Until
      // 2026-11-02 that threw out of the whole run: the phone pass died on
      // the fourth of five pages and printed no table at all, so three
      // pages that had already been measured were lost with it. One stop
      // that cannot be photographed is a row, not the end of the report.
      if (clip.width < 1 || clip.height < 1) {
        rows.push({ page: pageName, viewport: vpName, ...stop, verdict: 'OFF_VIEWPORT' })
        continue
      }
      const fFocused = await page.screenshot({ clip, animations: 'disabled' })
      await el.evaluate((n) => n.blur())
      await page.waitForTimeout(60)
      const fBlur1 = await page.screenshot({ clip, animations: 'disabled' })
      const fBlur2 = await page.screenshot({ clip, animations: 'disabled' })

      const cmp = await page.evaluate(COMPARE, [
        fFocused.toString('base64'),
        fBlur1.toString('base64'),
        fBlur2.toString('base64'),
      ])
      if (cmp.mismatch) {
        rows.push({ page: pageName, viewport: vpName, ...stop, verdict: 'SIZE_MISMATCH' })
        continue
      }

      const { focused, unfocused, indicator, drift } = cmp
      const row = {
        page: pageName,
        viewport: vpName,
        id: stop.id,
        tag: stop.tag,
        text: stop.text,
        stop: stop.stop,
        focusVisible: isFV,
        box: { w: Math.round(box.width), h: Math.round(box.height) },
        measuredOn,
        indicatorPx: indicator.length,
        driftPx: drift,
        // WCAG 2.4.11's minimum: the area of a 2px perimeter of the
        // unfocused control. For a w x h box that band is
        // (w+4)(h+4) - wh = 4w + 4h + 16.
        minAreaPx: Math.round(4 * box.width + 4 * box.height + 16),
      }

      if (indicator.length === 0) {
        row.verdict = 'NO_INDICATOR'
      } else if (drift > indicator.length / 20) {
        row.verdict = 'UNSTABLE'
      } else {
        let clears = 0
        let min = Infinity
        const ratios = []
        for (const i of indicator) {
          const r = ratio(
            lum(focused.d[i], focused.d[i + 1], focused.d[i + 2]),
            lum(unfocused.d[i], unfocused.d[i + 1], unfocused.d[i + 2]),
          )
          ratios.push(r)
          if (r >= RATIO_FLOOR) clears++
          if (r < min) min = r
        }
        ratios.sort((a, b) => a - b)
        row.share = clears / indicator.length
        row.median = ratios[Math.floor(ratios.length / 2)]
        row.p5 = ratios[Math.floor(ratios.length * 0.05)]
        row.min = min
        row.clearPx = clears
        row.areaRatio = indicator.length / row.minAreaPx
        // A 1 CSS px perimeter of the unfocused control: (w+2)(h+2) - wh.
        // This is the site's own declared ring, so it is the area a ring
        // that is actually drawn all the way round has to reach. It is
        // arithmetic off the control's own box and not a tuned constant.
        row.ringPx = Math.round(2 * box.width + 2 * box.height + 4)
        row.ringRatio = clears / row.ringPx
        row.verdict =
          row.share >= SHARE_FLOOR ? 'ok' : row.ringRatio >= 1 ? 'COMPOSITE' : 'BELOW_FLOOR'
      }
      rows.push(row)
      measured++

      if (FRAMES && (row.verdict !== 'ok' || stop.stop === 0)) {
        writeFileSync(resolve(FRAMES, `${pageName}-${vpName}-stop${stop.stop}-focused.png`), fFocused)
        writeFileSync(resolve(FRAMES, `${pageName}-${vpName}-stop${stop.stop}-blurred.png`), fBlur1)
      }
    }

    // The comparison nothing in this kit has ever made: what the DOM
    // offers against what Tab reaches.
    const reachedProbes = new Set(reached.map((r) => r.probe).filter((p) => p !== null))
    const unreachable = declared.filter((d) => !reachedProbes.has(d.probe))
    pageNotes.push({
      page: pageName,
      viewport: vpName,
      declared: declared.length,
      stops: reached.length,
      measured,
      unreachable,
      seconds: ((Date.now() - t0) / 1000).toFixed(1),
    })
    process.stderr.write(
      ` ${unreachable.length} unreachable  ${((Date.now() - t0) / 1000).toFixed(1)}s\n`,
    )
    await ctx.close()
  }
}
await browser.close()

// ------------------------------------------------------------------ reporting

const L = []
const bad = rows.filter((r) => r.verdict === 'NO_INDICATOR' || r.verdict === 'BELOW_FLOOR')
const unstable = rows.filter((r) => r.verdict === 'UNSTABLE')
const unreachableTotal = pageNotes.reduce((n, p) => n + (p.unreachable?.length ?? 0), 0)

L.push(`base ${BASE}`)
L.push(`viewports ${VPS.map((v) => `${v[0]} ${v[1]}x${v[2]}`).join(', ')}`)
if (STATE) L.push(`state ${STATE}`)
L.push(`floors: ${RATIO_FLOOR}:1 on the indicator, ${SHARE_FLOOR * 100}% of its pixels`)
L.push('')
L.push('## Reach: what the DOM offers against what Tab finds')
L.push('')
L.push('| page | viewport | focusable in DOM | tab stops | unreachable | sec |')
L.push('|---|---|---|---|---|---|')
for (const p of pageNotes) {
  L.push(
    `| ${p.page} | ${p.viewport} | ${p.declared ?? 0} | ${p.stops ?? 0} | ${p.unreachable?.length ?? '-'} | ${p.seconds ?? '-'} |`,
  )
}
if (unreachableTotal) {
  L.push('')
  L.push('Unreachable, one line each:')
  L.push('')
  for (const p of pageNotes) {
    for (const u of p.unreachable ?? []) {
      L.push(`- ${p.page}/${p.viewport} ${u.key} ${u.w}x${u.h}${u.zeroBox ? ' zero-box' : ''}${u.offscreen ? ' offscreen' : ''} "${u.text}"`)
    }
  }
}

L.push('')
L.push('## The indicator, photographed at every stop')
L.push('')
L.push('| page | viewport | stop | control | box | indicator px | clearing px | share >=3:1 | ring 1px | median | min | area/2.4.11 | verdict |')
L.push('|---|---|---|---|---|---|---|---|---|---|---|---|---|')
for (const r of rows) {
  const n = (v, d = 2) => (typeof v === 'number' && isFinite(v) ? v.toFixed(d) : '-')
  L.push(
    `| ${r.page} | ${r.viewport} | ${r.stop} | ${r.tag} ${r.text ? `"${r.text}"` : ''} | ${r.box ? `${r.box.w}x${r.box.h}${r.measuredOn && r.measuredOn !== 'self' ? ` (${r.measuredOn})` : ''}` : '-'} | ${r.indicatorPx ?? '-'} | ${r.clearPx ?? '-'} | ${r.share !== undefined ? `${(r.share * 100).toFixed(0)}%` : '-'} | ${r.ringRatio !== undefined ? n(r.ringRatio) : '-'} | ${n(r.median)} | ${n(r.min)} | ${r.areaRatio !== undefined ? n(r.areaRatio) : '-'} | ${r.verdict} |`,
  )
}

L.push('')
L.push('## Headline')
L.push('')
// The reach verdict REPLACES the headline rather than following it. Measured
// in this run's own control table: the first version of this repair appended
// the reach lines after the headline, so a run over a matrix of not-found
// pages printed `0 of 38 tab stops below a floor` and then refused, and the
// harness reading stdout still saw a passing headline. A refusal that comes
// after a pass is read as a pass.
L.push(
  reach.code()
    ? `NOT MEASURED: ${reach.unreached().length} of ${reach.rows().length} page loads did not reach their subject, so this run makes no claim about tab stops on them.`
    : `${bad.length} of ${rows.length} tab stops below a floor, ${unreachableTotal} controls the keyboard cannot reach, ${unstable.length} unstable.`,
)
// Every verdict, counted. Before 2026-11-02 the headline named three of
// them and the rest were visible only to somebody reading all 27 rows, so
// a stop the tool could not photograph at all left the summary looking
// clean. A verdict with no line in the headline is a verdict nobody reads.
const tally = {}
for (const r of rows) tally[r.verdict] = (tally[r.verdict] ?? 0) + 1
L.push('')
L.push(
  `By verdict: ${Object.entries(tally)
    .sort((a, b) => b[1] - a[1])
    .map(([k, v]) => `${v} ${k}`)
    .join(', ')}.`,
)
const withArea = rows.filter((r) => r.areaRatio !== undefined)
if (withArea.length) {
  const med = withArea.map((r) => r.areaRatio).sort((a, b) => a - b)[Math.floor(withArea.length / 2)]
  L.push('')
  L.push(
    `The 2.4.11 area column is reported and never failed on: median ${med.toFixed(2)} of the 2px-perimeter minimum, across ${withArea.length} stops. The ring's weight is identity and a change to it is the owner's.`,
  )
}

// In words as well as in the status, and inside `text` so it reaches the
// committed file and not only this session's stdout.
L.push(...reach.lines())
const text = L.join('\n')
console.log(text)
if (OUT) writeFileSync(OUT, `${text}\n`)
if (JSON_OUT) writeFileSync(JSON_OUT, `${JSON.stringify({ base: BASE, rows, pageNotes, reached: reach.rows() }, null, 1)}\n`)

// Absence before findings, because a finding counted over pages that were
// never reached is not a finding. Added 2026-11-09 (run w): until then a
// matrix of not-found pages walked, measured and printed its headline at
// the same status as the real site.
if (reach.code()) process.exit(reach.code())
if (pageNotes.some((p) => p.note)) process.exit(2)
process.exit(bad.length || unreachableTotal ? 1 : 0)
