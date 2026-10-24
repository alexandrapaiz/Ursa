// Measure every .rec-cmd on the site: how much is hidden, where it is cut,
// and whether anything on the page says so.
import { writeFileSync } from 'node:fs'
import { launch, VIEWPORTS } from '../../review-kit/lib/browser.mjs'

const BASE_URL = process.env.URSA_BASE ?? 'http://127.0.0.1:4617'

const BASE = BASE_URL + ''
const PAGES = ['/', '/record', '/record/mini-fixture', '/record/at']
const browser = await launch()
const out = []
for (const [vname, w, h] of [...VIEWPORTS, ['narrow', 320, 844]]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1 })
  const page = await ctx.newPage()
  for (const path of PAGES) {
    await page.goto(BASE + path, { waitUntil: 'networkidle' })
    const rows = await page.evaluate(() => {
      const ch = (el) => {
        // width of one monospace character, measured not assumed
        const s = document.createElement('span')
        s.textContent = '0'.repeat(100)
        const cs = getComputedStyle(el)
        s.style.cssText = `position:absolute;visibility:hidden;white-space:pre;font:${cs.font}`
        document.body.appendChild(s)
        const wch = s.getBoundingClientRect().width / 100
        s.remove()
        return wch
      }
      return [...document.querySelectorAll('.rec-cmd')].map((el, i) => {
        const cs = getComputedStyle(el)
        const c = ch(el)
        const hidden = el.scrollWidth - el.clientWidth
        const text = el.textContent || ''
        const longest = text.split('\n').reduce((a, b) => (b.length > a.length ? b : a), '')
        return {
          i,
          client: el.clientWidth,
          scroll: el.scrollWidth,
          hidden,
          chPx: Number(c.toFixed(2)),
          charsVisible: Math.floor(el.clientWidth / c),
          longestLine: longest.length,
          firstHiddenChar: longest.slice(Math.floor(el.clientWidth / c), Math.floor(el.clientWidth / c) + 24),
          maskImage: cs.maskImage,
          scrollbarWidth: cs.scrollbarWidth,
          // the gap between the last painted pixel of the box and the container's border
          padRight: cs.paddingRight,
        }
      })
    })
    rows.forEach((r) => out.push({ viewport: vname, w, path, ...r }))
  }
  await ctx.close()
}
await browser.close()
const hdr = 'viewport  w     page                   #  client scroll hidden  ch   vis/total  first hidden chars'
const line = (r) => `${r.viewport.padEnd(9)} ${String(r.w).padEnd(5)} ${r.path.padEnd(22)} ${r.i}  ${String(r.client).padStart(5)} ${String(r.scroll).padStart(6)} ${String(r.hidden).padStart(6)} ${String(r.chPx).padStart(5)}  ${String(r.charsVisible).padStart(3)}/${String(r.longestLine).padEnd(4)} ${r.hidden > 0 ? JSON.stringify(r.firstHiddenChar) : '-'}`
const report = [hdr, ...out.map(line)].join('\n')
writeFileSync(process.argv[2], report + '\n')
console.log(report)
