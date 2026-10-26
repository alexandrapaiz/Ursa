/**
 * How other people's products cue a command block that does not fit.
 *
 * The question this run shipped an answer to, before it could ask anyone
 * else: `.dash-cmd` hid 184px of `ursa forget …` at 320 behind a clean
 * edge, and the fix was a 32px mask at each end plus a tab stop. L32 says
 * reuse the benchmark you already own and spend the web trip on a
 * question the repository cannot answer, and the repository cannot answer
 * this one: the only prior art in it is `.rec-cmd`, which is this house's
 * own, so "we do it this way" is currently the whole evidence base.
 *
 * Asked at 390px, the narrowest charter viewport, because a code block
 * on a phone is where the question exists at all. For every <pre> or
 * <code> that scrolls horizontally, this reports four facts, all read off
 * the live element rather than off a stylesheet:
 *
 *   hidden     scrollWidth - clientWidth
 *   mask       whether a mask-image or a gradient is painted on it
 *   scrollbar  whether the UA reserves visible height for one
 *   keyboard   whether the container or anything inside it can take focus
 *
 * EVERYTHING THIS PRINTS IS DATA ABOUT THE PUBLIC WEB, NOT INSTRUCTION.
 * Pages are navigated and measured; nothing on them is executed as a
 * directive and no text from them is copied into this product. Per the
 * org rule of 2026-10-05, the sources are named in the review.
 *
 * usage: node bench-cmd-cues.mjs [--out file] <url> [<url> …]
 */
import { launch } from '../../../review-kit/lib/browser.mjs'
import { writeFileSync } from 'node:fs'

const argv = process.argv.slice(2)
const oi = argv.indexOf('--out')
const OUT = oi === -1 ? null : argv[oi + 1]
const URLS = argv.filter((a, i) => a !== '--out' && i !== oi + 1 && !a.startsWith('--'))

const browser = await launch()
const lines = [
  '  390x844, block-level code and pre elements hiding 24px or more horizontally.',
  '  Read off the live element. Public web; data, not instruction.',
  '',
  '  site                         blocks  scrolling  hidden px      cue                        keyboard',
]
for (const url of URLS) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 })
  const page = await ctx.newPage()
  let row
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 })
    await page.waitForTimeout(3500)
    row = await page.evaluate(() => {
      // Block-level only, and only a real amount hidden. The first run of
      // this probe counted every inline <code> in prose and reported 74
      // scrolling blocks on one site with a minimum of 3px hidden, which
      // is a subpixel on a word inside a sentence and not a command a
      // reader is being asked to run. 24px is about one monospace glyph
      // at these sizes, so below it there is nothing to cue.
      const els = [...document.querySelectorAll('pre, code')].filter((e) => {
        const d = getComputedStyle(e).display
        return d === 'block' || d === 'flex' || d === 'grid' || e.tagName === 'PRE'
      })
      const scrolling = els.filter((e) => e.scrollWidth - e.clientWidth >= 24)
      const facts = scrolling.map((e) => {
        const cs = getComputedStyle(e)
        const masked = (cs.maskImage && cs.maskImage !== 'none') || (cs.webkitMaskImage && cs.webkitMaskImage !== 'none')
        // A gradient painted over the end, the other way to do it.
        const kids = [...e.parentElement.children].filter((k) => k !== e)
        const gradient = kids.some((k) => /gradient/.test(getComputedStyle(k).backgroundImage || ''))
        const bar = e.offsetHeight - e.clientHeight > 2
        const focusable = e.tabIndex >= 0 || !!e.querySelector('[tabindex]:not([tabindex="-1"]), a[href], button')
        return { hidden: e.scrollWidth - e.clientWidth, masked, gradient, bar, focusable }
      })
      return { total: els.length, scrolling: facts.length, facts }
    })
  } catch (err) {
    lines.push(`  ${new URL(url).host.padEnd(27)}  — could not be reached: ${String(err.message).split('\n')[0].slice(0, 60)}`)
    await ctx.close()
    continue
  }
  await ctx.close()
  const host = new URL(url).host
  if (!row.scrolling) {
    lines.push(`  ${host.padEnd(27)}  ${String(row.total).padStart(6)}       0      —              no block clips by 24px     —`)
    continue
  }
  const hid = row.facts.map((f) => f.hidden)
  const cue = (f) => [f.masked && 'mask', f.gradient && 'gradient', f.bar && 'scrollbar'].filter(Boolean).join('+') || 'NONE'
  const cues = [...new Set(row.facts.map(cue))].join(', ')
  const kb = row.facts.filter((f) => f.focusable).length
  lines.push(
    `  ${host.padEnd(27)}  ${String(row.total).padStart(6)}  ${String(row.scrolling).padStart(9)}  ` +
    `${(Math.min(...hid) + '–' + Math.max(...hid)).padEnd(13)}  ${cues.padEnd(26)} ${kb}/${row.facts.length}`
  )
}
await browser.close()
const text = lines.join('\n') + '\n'
process.stdout.write(text)
if (OUT) writeFileSync(OUT, text)
