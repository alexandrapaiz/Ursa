/**
 * How much of each command block is behind the edge, and what says so.
 *
 * `.dash-cmd` is `white-space: pre` inside `overflow-x: auto`, so a
 * command longer than the box is clipped at a clean edge. A clean edge
 * is indistinguishable from the end of a short line. The record viewer
 * settled this on 2026-10-24 and wrote the finding into `.rec-cmd`'s own
 * header: "a reader cannot tell a clipped line from a short one when the
 * clip is clean". This asks the same question of the other product.
 *
 * Three things per block, all read off the live element:
 *   hidden      scrollWidth - clientWidth, the characters behind the edge
 *   cue         whether anything paints at that edge (a mask) or
 *               reserves width for a scrollbar (offsetHeight > clientHeight)
 *   keyboard    whether the scroll container or anything inside it can
 *               take focus, which is what a keyboard needs to scroll it
 */
import { launch } from '../../../review-kit/lib/browser.mjs'
import { freezeContext } from '../../../review-kit/lib/freeze.mjs'
import { writeFileSync } from 'node:fs'

const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i === -1 ? d : process.argv[i + 1] }
const BASE = arg('base', 'http://127.0.0.1:4974')
const OUT = arg('out', null)
const WIDTHS = arg('widths', '320,390,820,1440').split(',').map(Number)

const browser = await launch()
const lines = [`  base ${BASE}   widths ${WIDTHS.join(', ')}`, '',
  '  width  block                      drawn  needed  hidden  cue              keyboard']
let clipped = 0
let total = 0
for (const w of WIDTHS) {
  const ctx = await browser.newContext({ viewport: { width: w, height: 900 }, deviceScaleFactor: 1 })
  await freezeContext(ctx)
  const page = await ctx.newPage()
  await page.goto(`${BASE}/dashboard?port=7831`, { waitUntil: 'networkidle' })
  await page.waitForSelector('.dash-bar', { timeout: 60000 })
  // open the first disclosure, which is the only way a command block
  // other than the no-store one is ever on screen
  await page.locator('.dash-row .dash-action', { hasText: 'forget this' }).first().click()
  await page.waitForSelector('.dash-cmd', { timeout: 30000 })
  const rows = await page.$$eval('.dash-cmd', (els) => els.map((el) => {
    const cs = getComputedStyle(el)
    // A mask that is declared is not a mask that fades anything: both
    // widths are 0px whenever the line fits, which is the whole point of
    // driving them from the distance left to scroll. So report the
    // widths, not the declaration.
    const mask = cs.maskImage && cs.maskImage !== 'none'
    const fadeL = cs.getPropertyValue('--fade-l').trim() || '0px'
    const fadeR = cs.getPropertyValue('--fade-r').trim() || '0px'
    // offsetHeight includes the border and clientHeight does not, so a
    // bare `offsetHeight > clientHeight` is true for every bordered box
    // whether or not a scrollbar reserves anything. Subtract the border
    // first. The first version of this probe did not, and reported a
    // scrollbar on all four rows of a page that paints none.
    const borders = parseFloat(cs.borderTopWidth) + parseFloat(cs.borderBottomWidth)
    const bar = el.offsetHeight - borders - el.clientHeight > 0.5
    const focusable = el.matches('a,button,input,select,textarea,[tabindex]') ||
      !!el.querySelector('a,button,input,select,textarea,[tabindex]')
    return {
      text: el.textContent.trim().slice(0, 24),
      client: el.clientWidth,
      scroll: el.scrollWidth,
      mask, fadeL, fadeR, bar, focusable,
    }
  }))
  for (const r of rows) {
    total++
    const hidden = r.scroll - r.client
    if (hidden > 0) clipped++
    const fading = r.mask && (parseFloat(r.fadeL) > 0 || parseFloat(r.fadeR) > 0)
    const cue = fading ? `fade ${r.fadeL}/${r.fadeR}` : r.mask ? 'mask, 0/0' : r.bar ? 'scrollbar' : hidden > 0 ? 'NONE' : '-'
    lines.push(`  ${String(w).padEnd(6)} ${('"' + r.text + '…"').padEnd(26)} ${String(r.client).padStart(5)}  ${String(r.scroll).padStart(6)}  ${String(hidden).padStart(6)}  ${cue.padEnd(16)} ${r.focusable ? 'reachable' : hidden > 0 ? 'NOT REACHABLE' : '-'}`)
  }
  await ctx.close()
}
await browser.close()
lines.push('', `  ${clipped} of ${total} command blocks hide part of the command.`)
const text = lines.join('\n')
console.log(text)
if (OUT) writeFileSync(OUT, text + '\n')
