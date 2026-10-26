// What every run of text on this site actually measures against the
// pixels behind it.
//
//   node measure-contrast.mjs --out /tmp/x
//   node measure-contrast.mjs --base https://linear.app --pages home=/ --out /tmp/y
//
// **Why this exists, and why the obvious version of it is wrong.** The
// 2026-10-25b review ran a contrast sweep, got five findings, and threw
// the numbers away in its own pull request, because that sweep compared a
// declared `rgba()` fill against a declared background colour. On this
// site that is never the comparison a reader makes. The text sits on a
// starfield canvas, on gradients, on panels with translucent fills, and
// on ancestors carrying `opacity`. A number taken from the stylesheet is
// a number about the stylesheet. Ledger L16 is the entry that rule comes
// from: a sample that cannot check itself is not a measurement.
//
// So this does not read the background from CSS at all. It photographs
// the page twice, once as it renders and once with every glyph made
// transparent, and the second frame is the composited backdrop, measured.
// Then, for each pixel a glyph covers, it composites the text's own
// colour (including inherited `opacity`) onto the backdrop at that pixel
// and computes the WCAG ratio there.
//
// **Three properties that follow from doing it that way.**
//
//   1. A star behind a letter is seen. The worst pixel of a run is
//      reported next to its median, because "white text on near-black"
//      stops being true where the sky is bright.
//   2. A pixel is only counted when the renderer agrees with the model.
//      Every accepted pixel has to sit on the line between the measured
//      backdrop and the declared text colour, within a residual of 8 and
//      at least half covered. Anything else is some other element's
//      pixel, and it is dropped rather than averaged in.
//   3. **Too few accepted pixels is UNMEASURED, never a pass.** Text the
//      same colour as its backdrop is invisible to a differencing method,
//      and invisible is exactly what the failing case looks like. A tool
//      that printed "clean" there would be lying in the one case that
//      matters. The two reasons a run can be unmeasured are reported
//      apart, because only one of them is a defect: a glyph with fewer
//      than five core pixels is a punctuation mark too small to sample,
//      while a glyph no pixel of which differs from its backdrop is text
//      nobody can see.
//
// The thresholds are WCAG 1.4.3: 4.5:1 for body text, 3:1 for large text,
// which is 24px and up, or 18.66px and up at weight 700. Letter-spaced
// 11px mono is body text no matter how decorative it looks.
//
// **And the method has one precondition, which is checked rather than
// assumed.** Two shutters only describe one page if the page held still
// between them. Our own frames are frozen (`lib/freeze.mjs`), and the
// freeze makes two *loads* of this site bit-identical, which is what it
// was built and verified for. It does not make two *shutters* on one
// load identical: measured 2026-10-25c, two consecutive full-page
// screenshots of the loaded home page at 390px differ by 4,456 pixels of
// sky, where the same page loaded twice differs by none. So the backdrop
// frame is taken from a second load in a second context that has the
// glyphs hidden from before its first paint, never from a style applied
// to the page already photographed.
// A vendor's marketing page, measured for a benchmark, often does not:
// it reveals on scroll, swaps a hero video, finishes a font. So every
// run reports `drift`, the share of the frame outside every text box
// that changed between the two shutters, and calls the whole page
// untrustworthy above a fifth of a percent. Ledger L15's posture, which
// is that an instrument should say it could not look rather than
// return a number it cannot stand behind.
//
// Checked against known answers by `selftest/check-contrast.mjs`, which
// is the only reason to believe any number below.

import { mkdirSync, writeFileSync } from 'node:fs'
import { launch, VIEWPORTS } from './lib/browser.mjs'
import { freezeContext } from './lib/freeze.mjs'

const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i === -1 ? d : process.argv[i + 1] }
const OUT = arg('out', '/tmp/contrast')
const BASE = arg('base', 'http://127.0.0.1:4488')
const ONLY = arg('only', null)
const UNTIL = arg('until', null)
const WAIT = Number(arg('wait', 400))
// `--json` alone writes beside the report; `--json <path>` writes where the
// caller asks, which is what the self-test needs.
const JSON_I = process.argv.indexOf('--json')
const JSON_OUT = JSON_I === -1 ? null
  : (process.argv[JSON_I + 1] && !process.argv[JSON_I + 1].startsWith('--') ? process.argv[JSON_I + 1] : null)
const LIVE = process.argv.includes('--live')
// name=/path pairs, so a benchmark run can name a vendor's pages.
const PAGES = arg('pages', '/,/record,/record/mini-fixture,/record/at,/this-page-does-not-exist')
  .split(',')
  .map((p) => {
    const i = p.indexOf('=')
    return i === -1
      ? [p === '/' ? 'home' : p.replace(/^\/|\/$/g, '').replace(/\//g, '-'), p]
      : [p.slice(0, i), p.slice(i + 1)]
  })

mkdirSync(OUT, { recursive: true })

// Collect one entry per run of text, with the line boxes the glyphs
// actually occupy rather than the element's box, because a paragraph's box
// is mostly not text and the trailing space of its last line is not either.
const COLLECT = () => {
  const out = []
  const parseRgb = (s) => {
    const m = s.match(/-?[\d.]+/g)
    if (!m) return null
    return [Number(m[0]), Number(m[1]), Number(m[2]), m.length > 3 ? Number(m[3]) : 1]
  }
  let id = 0
  const walk = (root) => {
    for (const el of root.querySelectorAll('*')) {
      const cs = getComputedStyle(el)
      if (cs.visibility === 'hidden' || cs.display === 'none' || Number(cs.opacity) === 0) continue
      const texts = [...el.childNodes].filter((n) => n.nodeType === 3 && n.textContent.trim().length)
      if (!texts.length) continue
      const rects = []
      let sample = ''
      for (const t of texts) {
        const r = document.createRange()
        r.selectNodeContents(t)
        for (const b of r.getClientRects()) {
          if (b.width < 1 || b.height < 1) continue
          rects.push({
            x: Math.floor(b.left + window.scrollX),
            y: Math.floor(b.top + window.scrollY),
            w: Math.ceil(b.width),
            h: Math.ceil(b.height),
          })
        }
        sample += t.textContent.trim() + ' '
      }
      if (!rects.length) continue
      // Inherited opacity multiplies the text's own alpha. The renderer
      // applies it to the whole subtree; the residual check below is what
      // catches it when this model is wrong rather than letting it pass.
      let op = 1
      for (let p = el; p && p.nodeType === 1; p = p.parentElement) op *= Number(getComputedStyle(p).opacity || 1)
      const colour = parseRgb(cs.color) || [255, 255, 255, 1]
      // WCAG 1.4.3 exempts text that is part of an inactive user interface
      // component, and this site has one: the hero's call to action ships
      // disabled until Polaris is released, dimmed to say so. L19 is the
      // entry that says an exemption living only in prose is a permanent
      // false positive, so the exemption is in the instrument and the
      // number is still printed.
      const inactive = !!el.closest('[disabled], [aria-disabled="true"], fieldset[disabled]')
      out.push({
        id: id++,
        inactive,
        tag: el.tagName.toLowerCase(),
        cls: String(el.getAttribute('class') || '').split(/\s+/).filter(Boolean).slice(0, 2).join('.'),
        text: sample.trim().replace(/\s+/g, ' ').slice(0, 42),
        fontSize: Math.round(parseFloat(cs.fontSize) * 10) / 10,
        weight: Number(cs.fontWeight) || 400,
        colour: [colour[0], colour[1], colour[2], colour[3] * op],
        rects,
      })
    }
  }
  walk(document)
  // A placeholder is text a reader has to read and it is not a text node,
  // so the walk above cannot see it. It is collected here with its own
  // `::placeholder` colour and the field's box: the pixel test below only
  // counts pixels that sit on the line between that colour and the
  // measured backdrop, so the rest of the field's box costs nothing.
  for (const el of document.querySelectorAll('input[placeholder], textarea[placeholder]')) {
    if (el.value) continue
    const cs = getComputedStyle(el)
    if (cs.visibility === 'hidden' || cs.display === 'none') continue
    const ph = getComputedStyle(el, '::placeholder')
    const b = el.getBoundingClientRect()
    if (b.width < 1 || b.height < 1) continue
    let op = 1
    for (let p = el; p && p.nodeType === 1; p = p.parentElement) op *= Number(getComputedStyle(p).opacity || 1)
    const colour = parseRgb(ph.color || cs.color) || [255, 255, 255, 1]
    out.push({
      id: id++,
      tag: el.tagName.toLowerCase() + '::placeholder',
      cls: String(el.getAttribute('class') || '').split(/\s+/).filter(Boolean).slice(0, 2).join('.'),
      text: el.getAttribute('placeholder').slice(0, 42),
      fontSize: Math.round(parseFloat(ph.fontSize || cs.fontSize) * 10) / 10,
      weight: Number(ph.fontWeight || cs.fontWeight) || 400,
      colour: [colour[0], colour[1], colour[2], colour[3] * op],
      inactive: !!el.closest('[disabled], [aria-disabled="true"], fieldset[disabled]') || el.disabled,
      rects: [{
        x: Math.floor(b.left + window.scrollX),
        y: Math.floor(b.top + window.scrollY),
        w: Math.ceil(b.width),
        h: Math.ceil(b.height),
      }],
    })
  }
  return out
}

// Everything that draws a glyph goes transparent, including generated
// content, so the backdrop frame is the backdrop and nothing else. This
// changes no layout: `color` does not reflow.
const HIDE_CSS = `*, *::before, *::after, ::selection {
  color: transparent !important;
  -webkit-text-fill-color: transparent !important;
  text-shadow: none !important;
  caret-color: transparent !important;
}`

// The pixel pass runs inside the browser, because the browser is the only
// PNG decoder this kit is allowed to assume. No native module, no python,
// nothing to install on a host nobody gave the seat root on.
const SCORE = async (page, shotA, shotB, items) => page.evaluate(
  async ({ a, b, items }) => {
    const load = async (dataUrl) => {
      const img = new Image()
      img.src = dataUrl
      await img.decode()
      const c = document.createElement('canvas')
      c.width = img.naturalWidth
      c.height = img.naturalHeight
      const ctx = c.getContext('2d', { willReadFrequently: true })
      ctx.drawImage(img, 0, 0)
      return { d: ctx.getImageData(0, 0, c.width, c.height).data, w: c.width, h: c.height }
    }
    const A = await load(a)
    const B = await load(b)
    const srl = (c) => { const s = c / 255; return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4 }
    const lum = (r, g, b) => 0.2126 * srl(r) + 0.7152 * srl(g) + 0.0722 * srl(b)
    const ratio = (l1, l2) => (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05)
    // Everything outside every text box that moved between the shutters.
    // Inside the boxes, a difference is the point; outside them it is the
    // page having carried on while the instrument was looking away.
    const mask = new Uint8Array(B.w * B.h)
    for (const it of items) {
      for (const r of it.rects) {
        for (let y = Math.max(0, r.y - 2); y < Math.min(r.y + r.h + 2, B.h); y++) {
          mask.fill(1, y * B.w + Math.max(0, r.x - 2), y * B.w + Math.min(r.x + r.w + 2, B.w))
        }
      }
    }
    let drifted = 0
    for (let i = 0, p = 0; p < mask.length; p++, i += 4) {
      if (mask[p]) continue
      if (Math.abs(A.d[i] - B.d[i]) + Math.abs(A.d[i + 1] - B.d[i + 1]) + Math.abs(A.d[i + 2] - B.d[i + 2]) > 6) drifted++
    }
    const drift = drifted / (mask.length || 1)

    const res = []
    for (const it of items) {
      const [tr, tg, tb, ta] = it.colour
      const ratios = []
      let seen = 0
      // The best coverage any pixel reached, so that an UNMEASURED row says
      // why it could not be read rather than only that it could not.
      let maxCov = 0
      for (const r of it.rects) {
        for (let y = r.y; y < Math.min(r.y + r.h, B.h); y++) {
          for (let x = r.x; x < Math.min(r.x + r.w, B.w); x++) {
            const i = (y * B.w + x) * 4
            const br = B.d[i], bg = B.d[i + 1], bb = B.d[i + 2]
            // The colour a fully covered glyph pixel would be here.
            const fr = tr * ta + br * (1 - ta)
            const fg = tg * ta + bg * (1 - ta)
            const fb = tb * ta + bb * (1 - ta)
            const dr = fr - br, dg = fg - bg, db = fb - bb
            const den = dr * dr + dg * dg + db * db
            if (den < 9) continue // text and backdrop are the same colour here
            const pr = A.d[i] - br, pg = A.d[i + 1] - bg, pb = A.d[i + 2] - bb
            const cov = (pr * dr + pg * dg + pb * db) / den
            if (cov > maxCov && cov <= 1.25) maxCov = cov
            if (cov < 0.5 || cov > 1.25) continue
            const ex = pr - cov * dr, ey = pg - cov * dg, ez = pb - cov * db
            if (ex * ex + ey * ey + ez * ez > 64) continue // some other element's pixel
            seen++
            ratios.push(ratio(lum(fr, fg, fb), lum(br, bg, bb)))
          }
        }
      }
      if (ratios.length < 5) { res.push({ id: it.id, drift, pixels: ratios.length, maxCov: Math.round(maxCov * 100) / 100, unmeasured: true }); continue }
      ratios.sort((p, q) => p - q)
      const at = (f) => ratios[Math.min(ratios.length - 1, Math.floor(f * ratios.length))]
      res.push({ id: it.id, drift, pixels: seen, maxCov: Math.round(maxCov * 100) / 100, min: ratios[0], p5: at(0.05), median: at(0.5) })
    }
    return res
  },
  { a: shotA, b: shotB, items },
)

const threshold = (it) => (it.fontSize >= 24 || (it.fontSize >= 18.66 && it.weight >= 700) ? 3 : 4.5)

const browser = await launch()
const rows = []
const drifts = []
for (const [vname, w, h] of VIEWPORTS) {
  if (ONLY && ONLY !== vname) continue
  const vp = { viewport: { width: w, height: h }, deviceScaleFactor: 1 }
  const ctx = await browser.newContext(vp)
  // The second context is the first one with every glyph transparent from
  // before its first paint, so its frames are a second load rather than a
  // second shutter. See the note above about the 4,456 pixels of sky.
  const hidden = await browser.newContext(vp)
  if (!LIVE) { await freezeContext(ctx); await freezeContext(hidden) }
  await hidden.addInitScript((css) => {
    const install = () => {
      const el = document.createElement('style')
      el.textContent = css
      ;(document.head || document.documentElement).appendChild(el)
    }
    if (document.documentElement) install()
    else document.addEventListener('readystatechange', install, { once: true })
  }, HIDE_CSS)
  const page = await ctx.newPage()
  const back = await hidden.newPage()
  const scorer = await ctx.newPage()
  await scorer.goto('about:blank')
  const opts = { fullPage: true, scale: 'css', ...(LIVE ? {} : { animations: 'disabled' }) }
  for (const [name, path] of PAGES) {
    await page.goto(BASE + path, { waitUntil: 'networkidle' })
    if (UNTIL) await page.waitForSelector(UNTIL, { timeout: 30000 })
    await page.waitForTimeout(WAIT)
    const items = await page.evaluate(COLLECT)
    const shotA = `data:image/png;base64,${(await page.screenshot(opts)).toString('base64')}`
    await back.goto(BASE + path, { waitUntil: 'networkidle' })
    if (UNTIL) await back.waitForSelector(UNTIL, { timeout: 30000 })
    await back.waitForTimeout(WAIT)
    // Belt and braces: the init script runs before the page's own scripts,
    // and this covers a page that replaces <head> wholesale after it.
    await back.addStyleTag({ content: HIDE_CSS })
    const shotB = `data:image/png;base64,${(await back.screenshot(opts)).toString('base64')}`
    const scored = await SCORE(scorer, shotA, shotB, items)
    const byId = new Map(scored.map((s) => [s.id, s]))
    drifts.push({ page: name, viewport: vname, drift: scored[0]?.drift ?? 0 })
    for (const it of items) {
      const s = byId.get(it.id) || { unmeasured: true, pixels: 0 }
      rows.push({ page: name, viewport: vname, ...it, ...s, threshold: threshold(it) })
    }
  }
  await ctx.close()
  await hidden.close()
}
await browser.close()

const fmt = (n) => (n == null ? '  -  ' : n.toFixed(2).padStart(5))
const label = (r) => `${r.tag}${r.cls ? '.' + r.cls : ''}`
// The two unmeasured reasons, kept apart: `too small` is a `·` or a `+`
// with fewer core pixels than the floor, and `invisible` is a run the
// renderer drew in its backdrop's own colour.
const why = (r) => ((r.maxCov ?? 0) > 0 ? 'too small to sample' : 'nothing differs from the backdrop')
const verdict = (r) =>
  r.unmeasured ? 'UNMEASURED'
  : r.median >= r.threshold ? (r.p5 < r.threshold ? 'short in places' : 'ok')
  : r.inactive ? 'inactive and exempt'
  : 'SHORT'
const lines = []
for (const r of rows.filter((r) => verdict(r) !== 'ok')) {
  lines.push(
    `${(r.page + '/' + r.viewport).padEnd(28)} ${label(r).padEnd(22)} ${String(r.fontSize).padStart(4)}px/${r.weight}  ` +
    `median ${fmt(r.median)}  p5 ${fmt(r.p5)}  min ${fmt(r.min)}  needs ${r.threshold.toFixed(1)}  ` +
    `${verdict(r)}${r.unmeasured ? ` (${why(r)}, ${r.pixels} px, best coverage ${r.maxCov ?? 0})` : ''}  "${r.text}"`,
  )
}
const counts = {
  runs: rows.length,
  short: rows.filter((r) => verdict(r) === 'SHORT').length,
  inactive: rows.filter((r) => verdict(r) === 'inactive and exempt').length,
  partial: rows.filter((r) => verdict(r) === 'short in places').length,
  unmeasured: rows.filter((r) => verdict(r) === 'UNMEASURED').length,
  invisible: rows.filter((r) => verdict(r) === 'UNMEASURED' && why(r) !== 'too small to sample').length,
}
const headline =
  `${counts.short} of ${counts.runs} text runs below their threshold at the median, ` +
  `${counts.inactive} inactive and exempt under 1.4.3, ` +
  `${counts.partial} short in places only, ${counts.unmeasured} unmeasured ` +
  `(${counts.unmeasured - counts.invisible} too small to sample, ${counts.invisible} drawn in their backdrop's own colour)`
// A page that moved between the shutters is named, with its number, and
// its runs are not offered as a measurement at all.
const DRIFT_LIMIT = 0.002
const moved = drifts.filter((d) => d.drift > DRIFT_LIMIT)
const driftReport = moved.length
  ? '\nthese pages moved between the two shutters, so nothing above is a measurement of them:\n' +
    moved.map((d) => `  ${d.page}/${d.viewport}  ${(d.drift * 100).toFixed(2)}% of the frame outside its text changed`).join('\n') + '\n'
  : `\nevery page held still between the two shutters (worst drift ${((Math.max(0, ...drifts.map((d) => d.drift))) * 100).toFixed(3)}% of the frame), so the backdrops above are the backdrops a reader sees.\n`
const report = `${headline}\n${driftReport}\n${lines.join('\n') || 'nothing below threshold'}\n`
writeFileSync(`${OUT}/contrast.txt`, report)
if (JSON_I !== -1) writeFileSync(JSON_OUT || `${OUT}/contrast.json`, JSON.stringify(rows, null, 1))
console.log(report)
