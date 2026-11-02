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
      text: (el.getAttribute('aria-label') || el.textContent || '').trim().slice(0, 40),
    })
  }
  return out
}

const ACTIVE = () => {
  const el = document.activeElement
  if (!el || el === document.body || el === document.documentElement) return null
  const r = el.getBoundingClientRect()
  return {
    probe: el.hasAttribute('data-focus-probe') ? Number(el.getAttribute('data-focus-probe')) : null,
    tag: el.tagName.toLowerCase(),
    box: { x: r.x, y: r.y, w: r.width, h: r.height },
    matchesFocusVisible: el.matches(':focus-visible'),
    text: (el.getAttribute('aria-label') || el.textContent || '').trim().slice(0, 40),
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
    if (!LIVE) await freezeContext(ctx)
    const page = await ctx.newPage()
    await page.goto(`${BASE}${path}`, { waitUntil: 'networkidle', timeout: 30000 })
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

    // Start outside the document so the first Tab lands on the first stop.
    await page.evaluate(() => {
      document.activeElement?.blur?.()
      window.scrollTo(0, 0)
    })
    await page.keyboard.press('Tab')

    const reached = []
    const seen = new Set()
    for (let n = 0; n < MAX_STOPS; n++) {
      const act = await page.evaluate(ACTIVE)
      if (!act) break
      const id = act.probe !== null ? `p${act.probe}` : `${act.tag}@${Math.round(act.box.x)},${Math.round(act.box.y)}`
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
      if (stop.probe === null) continue
      const el = page.locator(`[data-focus-probe="${stop.probe}"]`)
      if ((await el.count()) !== 1) continue
      await el.evaluate((n) => n.scrollIntoView({ block: 'center', behavior: 'instant' }))
      await page.waitForTimeout(80)
      const box = await el.boundingBox()
      if (!box || box.width < 1 || box.height < 1) {
        rows.push({ page: pageName, viewport: vpName, ...stop, verdict: 'ZERO_BOX' })
        continue
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
        row.areaRatio = indicator.length / row.minAreaPx
        row.verdict = row.share >= SHARE_FLOOR ? 'ok' : 'BELOW_FLOOR'
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
L.push('| page | viewport | stop | control | box | indicator px | share >=3:1 | median | min | area/2.4.11 | verdict |')
L.push('|---|---|---|---|---|---|---|---|---|---|---|')
for (const r of rows) {
  const n = (v, d = 2) => (typeof v === 'number' && isFinite(v) ? v.toFixed(d) : '-')
  L.push(
    `| ${r.page} | ${r.viewport} | ${r.stop} | ${r.tag} ${r.text ? `"${r.text}"` : ''} | ${r.box ? `${r.box.w}x${r.box.h}` : '-'} | ${r.indicatorPx ?? '-'} | ${r.share !== undefined ? `${(r.share * 100).toFixed(0)}%` : '-'} | ${n(r.median)} | ${n(r.min)} | ${r.areaRatio !== undefined ? n(r.areaRatio) : '-'} | ${r.verdict} |`,
  )
}

L.push('')
L.push('## Headline')
L.push('')
L.push(
  `${bad.length} of ${rows.length} tab stops below a floor, ${unreachableTotal} controls the keyboard cannot reach, ${unstable.length} unstable.`,
)
const withArea = rows.filter((r) => r.areaRatio !== undefined)
if (withArea.length) {
  const med = withArea.map((r) => r.areaRatio).sort((a, b) => a - b)[Math.floor(withArea.length / 2)]
  L.push('')
  L.push(
    `The 2.4.11 area column is reported and never failed on: median ${med.toFixed(2)} of the 2px-perimeter minimum, across ${withArea.length} stops. The ring's weight is identity and a change to it is the owner's.`,
  )
}

const text = L.join('\n')
console.log(text)
if (OUT) writeFileSync(OUT, `${text}\n`)
if (JSON_OUT) writeFileSync(JSON_OUT, `${JSON.stringify({ base: BASE, rows, pageNotes }, null, 1)}\n`)

if (pageNotes.some((p) => p.note)) process.exit(2)
process.exit(bad.length || unreachableTotal ? 1 : 0)
