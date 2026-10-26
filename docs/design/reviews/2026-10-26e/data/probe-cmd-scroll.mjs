/**
 * Does the cue track the scroll, and can a keyboard reach the hidden
 * part at all?
 *
 * Two claims the static measurement cannot make. That the fade is
 * driven from the distance left rather than from a boolean, which is
 * only visible by scrolling and reading it again at each stop. And that
 * the tab stop does what it was added for: focus the block, press the
 * arrow key, and the scroll offset has to move, or the 184px behind the
 * edge are still pointer-only.
 */
import { launch } from '../../../review-kit/lib/browser.mjs'
import { freezeContext } from '../../../review-kit/lib/freeze.mjs'
import { writeFileSync } from 'node:fs'

const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i === -1 ? d : process.argv[i + 1] }
// The store server's port is a flag, not a literal. Measured on
// 2026-10-26 (hook): 127.0.0.1:7831 on this host was held by another
// seat's store server, which answered `/` with
// `{"server":"ursa-store","project":"store-demo",...}` — the same project
// name this seat's own clone produces, because every run of this seat
// clones into a directory called `store-demo`. So a probe that hardcodes
// 7831 reads a stranger's records and cannot tell. `ursa serve` refuses
// the bind and says so, but a probe pointed at the port never asks it.
const STORE = arg('store', '7831')
const BASE = arg('base', 'http://127.0.0.1:4978')
const OUT = arg('out', null)

const browser = await launch()
const ctx = await browser.newContext({ viewport: { width: 320, height: 844 }, deviceScaleFactor: 1 })
await freezeContext(ctx)
const page = await ctx.newPage()
await page.goto(`${BASE}/dashboard?port=${STORE}`, { waitUntil: 'networkidle' })
await page.waitForSelector('.dash-bar', { timeout: 60000 })
await page.locator('.dash-row .dash-action', { hasText: 'forget this' }).first().click()
await page.waitForSelector('.dash-cmd', { timeout: 30000 })

const lines = [`  base ${BASE}   320x844   the first record's forget command`, '']
const read = async () => page.$eval('.dash-cmd', (el) => {
  const cs = getComputedStyle(el)
  return {
    x: Math.round(el.scrollLeft),
    max: el.scrollWidth - el.clientWidth,
    l: cs.getPropertyValue('--fade-l').trim(),
    r: cs.getPropertyValue('--fade-r').trim(),
  }
})

lines.push('  scrolled  left of max   fade left  fade right')
for (const frac of [0, 0.02, 0.5, 0.95, 1]) {
  await page.$eval('.dash-cmd', (el, f) => {
    el.scrollLeft = (el.scrollWidth - el.clientWidth) * f
  }, frac)
  await page.waitForTimeout(80)
  const s = await read()
  lines.push(`  ${String(s.x).padStart(5)}px  ${String(s.max - s.x).padStart(8)}px   ${s.l.padStart(8)}   ${s.r.padStart(9)}`)
}

// the keyboard path
await page.$eval('.dash-cmd', (el) => { el.scrollLeft = 0 })
await page.focus('.dash-cmd')
const focused = await page.evaluate(() => document.activeElement?.className || '(none)')
const before = (await read()).x
for (let i = 0; i < 6; i++) await page.keyboard.press('ArrowRight')
await page.waitForTimeout(120)
const after = await read()
lines.push('', `  focus lands on   ${focused}`)
lines.push(`  six ArrowRight   scrollLeft ${before} -> ${after.x}, fade left ${after.l}, fade right ${after.r}`)
lines.push(`  verdict          ${after.x > before ? 'the hidden part is reachable from a keyboard' : 'STILL POINTER ONLY'}`)

await browser.close()
const text = lines.join('\n')
console.log(text)
if (OUT) writeFileSync(OUT, text + '\n')
