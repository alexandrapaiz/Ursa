// Who does `p .rec-action` actually reach?
//
// The rule added on this branch says, in its comment, that four
// `.rec-action`s sit inside a paragraph. A grep of the page files finds
// closer to ten, and the hover capture set photographed exactly one of
// them, so the count in the comment and the count under review disagree
// and neither was measured in a browser.
//
// This asks the browser instead. For every route, every `.rec-action`:
// whether `p .rec-action` matches it, what its resting underline colour
// computes to, and enough text to find it in a frame.
//
//   node audit-inline-links.mjs > data/inline-link-audit.txt

import { launch } from '../../review-kit/lib/browser.mjs'
import { freezeContext } from '../../review-kit/lib/freeze.mjs'

const BASE = process.env.BASE || 'http://127.0.0.1:4488'
const ROUTES = ['/', '/record', '/record/mini-fixture', '/record/at']

const browser = await launch()
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 })
await freezeContext(ctx)
const page = await ctx.newPage()

let inProse = 0
let total = 0

for (const route of ROUTES) {
  await page.goto(BASE + route, { waitUntil: 'networkidle' })
  await page.waitForTimeout(900)
  const rows = await page.evaluate(() =>
    [...document.querySelectorAll('.rec-action')].map((el) => {
      const cs = getComputedStyle(el)
      const r = el.getBoundingClientRect()
      return {
        tag: el.tagName.toLowerCase(),
        inProse: el.matches('p .rec-action'),
        line: cs.textDecorationLine,
        colour: cs.textDecorationColor,
        text: (el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 46),
        box: `${Math.round(r.width)}x${Math.round(r.height)}`,
      }
    })
  )
  console.log(`\n${route}  (${rows.length} .rec-action)`)
  for (const r of rows) {
    total++
    if (r.inProse) inProse++
    console.log(
      `  ${r.inProse ? 'IN PROSE ' : '         '} ${r.tag.padEnd(6)} ${r.box.padEnd(9)} ${r.line.padEnd(10)} ${r.colour.padEnd(26)} ${r.text}`
    )
  }
}

console.log(`\ntotal .rec-action: ${total}   matched by \`p .rec-action\`: ${inProse}`)
await browser.close()
