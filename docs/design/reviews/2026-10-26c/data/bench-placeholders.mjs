// Does anybody ship a placeholder in the user agent's colour?
//
//   node data/bench-placeholders.mjs data/bench-placeholders.txt
//
// This run gave the overlay's passphrase field an explicit placeholder
// colour, on the argument that the browser's default is a value nobody
// in this repository chose rather than a palette decision worth
// protecting. That argument is checkable against the field, so it is
// checked here: load each site, find every input that carries a
// placeholder, read the colour the browser actually resolves for
// `::placeholder`, and compare it against the UA default for that
// control. Read-only, nothing clicked, nothing typed, nothing submitted.
//
// Chromium's default is `color-mix(in oklab, currentcolor 54%,
// transparent)`, which resolves to the input's own colour at 54% alpha.
// So "the default" is not one constant: it is detectable as a resolved
// alpha near 0.54 with the same RGB as the field's text. That is the
// test below, and the measured alpha is printed so the reader can
// disagree with the threshold rather than take the verdict.

import { writeFileSync } from 'node:fs'
import { launch } from '../../../review-kit/lib/browser.mjs'

const OUT = process.argv[2] || 'data/bench-placeholders.txt'
const SITES = [
  ['linear', 'https://linear.app'],
  ['vercel', 'https://vercel.com'],
  ['stripe', 'https://stripe.com'],
  ['consensus', 'https://consensus.app'],
  ['elicit', 'https://elicit.com'],
]

const probe = () => {
  const parse = (c) => {
    const m = String(c).match(/-?[\d.]+/g) || []
    return { r: +m[0], g: +m[1], b: +m[2], a: m.length > 3 ? +m[3] : 1 }
  }
  return [...document.querySelectorAll('input[placeholder], textarea[placeholder]')]
    .filter((el) => el.getBoundingClientRect().width > 0)
    .slice(0, 6)
    .map((el) => {
      const ph = parse(getComputedStyle(el, '::placeholder').color)
      const own = parse(getComputedStyle(el).color)
      const sameRGB = ph.r === own.r && ph.g === own.g && ph.b === own.b
      return {
        text: (el.getAttribute('placeholder') || '').slice(0, 24),
        placeholder: getComputedStyle(el, '::placeholder').color,
        fieldColor: getComputedStyle(el).color,
        alpha: ph.a,
        // The UA default and nothing else: the field's own colour, faded.
        uaDefault: sameRGB && ph.a > 0.5 && ph.a < 0.58,
      }
    })
}

const browser = await launch()
const lines = []
for (const [name, url] of SITES) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 })
  const page = await ctx.newPage()
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 })
    await page.waitForTimeout(2500)
    const found = await page.evaluate(probe)
    if (!found.length) lines.push(`${name.padEnd(10)} no visible input carries a placeholder on this page`)
    for (const f of found) {
      lines.push(
        `${name.padEnd(10)} ${`"${f.text}"`.padEnd(26)} placeholder ${f.placeholder.padEnd(26)}` +
        ` field ${f.fieldColor.padEnd(26)} alpha ${String(f.alpha).padEnd(5)} ` +
        (f.uaDefault ? 'USER AGENT DEFAULT' : 'chosen'),
      )
    }
  } catch (e) {
    // L5's rule: a site that will not load is recorded as not loading,
    // never quietly dropped, because a missing row reads as a clean row.
    lines.push(`${name.padEnd(10)} COULD NOT LOAD: ${String(e.message).split('\n')[0].slice(0, 70)}`)
  }
  await ctx.close()
}
await browser.close()
const text = lines.join('\n') + '\n'
writeFileSync(OUT, text)
console.log(text)
