// Measure every interactive surface on the site and print its geometry and
// its declared motion side by side.
//
//   node measure-controls.mjs [out.txt]
//
// The question this answers is the one proposal 2 of the 2026-10-24 review
// left open: which surfaces are the same KIND of control as `.cta`, and so
// have a claim on the spring `.cta` got, and which are a different kind and
// do not. A class name cannot answer that, because the same class can be put
// on two different shapes. Box size, type size, padding and border can, so
// they are what this reads, out of the browser rather than the stylesheet.

import { launch } from '../../review-kit/lib/browser.mjs'
import { writeFileSync } from 'node:fs'

const BASE = process.env.URSA_BASE || 'http://127.0.0.1:4931'
const OUT = process.argv[2] || null

const PAGES = {
  '/': ['.cta', '.rec-action', '.mark-link'],
  '/record': ['.cta', '.rec-action'],
  '/record/mini-fixture': ['.rec-action'],
  '/this-page-does-not-exist': ['.quiet-link', '.mark-link'],
}

const browser = await launch()
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 })
const page = await ctx.newPage()
const lines = []
const say = (s) => { lines.push(s); console.log(s) }

say(`base ${BASE}   viewport 1440x900   ${new Date().toISOString()}`)
say('')

for (const [path, sels] of Object.entries(PAGES)) {
  say(`### ${path}`)
  say('tag    class        box w x h       font     pad t/r/b/l       border    transition  | duration | timing      text')
  say('-'.repeat(150))
  await page.goto(BASE + path, { waitUntil: 'networkidle' })
  await page.waitForTimeout(400)
  for (const sel of sels) {
    const rows = await page.$$eval(sel, (els) => els.map((e) => {
      const cs = getComputedStyle(e)
      const r = e.getBoundingClientRect()
      return {
        tag: e.tagName.toLowerCase(),
        text: (e.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 26),
        w: Math.round(r.width * 10) / 10,
        h: Math.round(r.height * 10) / 10,
        font: cs.fontSize,
        pad: [cs.paddingTop, cs.paddingRight, cs.paddingBottom, cs.paddingLeft].map((v) => Math.round(parseFloat(v) * 10) / 10).join('/'),
        border: cs.borderTopWidth === '0px' ? 'none' : cs.borderTopWidth,
        prop: cs.transitionProperty.replace(/\s/g, ''),
        dur: cs.transitionDuration.replace(/\s/g, ''),
        spring: cs.transitionTimingFunction.includes('linear('),
        disabled: e.disabled === true || e.getAttribute('aria-disabled') === 'true',
      }
    }))
    for (const r of rows) {
      say(
        r.tag.padEnd(7) + sel.padEnd(13) +
        `${String(r.w).padStart(6)} x ${String(r.h).padEnd(6)} ` +
        r.font.padEnd(9) + r.pad.padEnd(18) + r.border.padEnd(10) +
        r.prop.slice(0, 40).padEnd(42) + '| ' + r.dur.padEnd(18) + '| ' +
        (r.spring ? 'SPRING' : 'no spring').padEnd(12) +
        `"${r.text}"` + (r.disabled ? '  [disabled]' : '')
      )
    }
    if (!rows.length) say(`${''.padEnd(7)}${sel.padEnd(13)}(none on this page)`)
  }
  say('')
}

if (OUT) writeFileSync(OUT, lines.join('\n') + '\n')
await browser.close()
