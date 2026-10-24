// What do best-in-class product sites do at the right edge of a code block
// that scrolls? Read as data: computed styles and geometry only.
import { writeFileSync } from 'node:fs'
import { launch } from '../../review-kit/lib/browser.mjs'
const URLS = process.argv.slice(3)
const b = await launch()
const out = []
for (const url of URLS) {
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 })
  const p = await ctx.newPage()
  try {
    await p.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 })
    await p.waitForTimeout(3500)
    const r = await p.evaluate(() => {
      const res = []
      for (const el of document.querySelectorAll('pre, code, [class*="code"], [class*="Code"]')) {
        if (el.scrollWidth - el.clientWidth < 8) continue
        if (el.clientWidth < 100) continue
        const cs = getComputedStyle(el)
        const edge = (node) => {
          const s = getComputedStyle(node)
          return { mask: s.maskImage, bg: s.backgroundImage.slice(0, 120), pos: s.position, w: Math.round(node.getBoundingClientRect().width) }
        }
        // Does anything sit over the right edge? pseudo-elements and siblings.
        const after = getComputedStyle(el, '::after')
        const parentAfter = el.parentElement ? getComputedStyle(el.parentElement, '::after') : null
        res.push({
          tag: el.tagName.toLowerCase(),
          cls: String(el.className || '').slice(0, 60),
          client: el.clientWidth, scroll: el.scrollWidth, hidden: el.scrollWidth - el.clientWidth,
          gutterPx: el.offsetHeight - el.clientHeight,
          maskImage: cs.maskImage,
          webkitMask: cs.webkitMaskImage,
          scrollbarWidth: cs.scrollbarWidth, scrollbarColor: cs.scrollbarColor,
          paddingRight: cs.paddingRight,
          afterContent: after.content, afterBg: after.backgroundImage.slice(0, 140), afterW: after.width,
          parentAfterBg: parentAfter ? parentAfter.backgroundImage.slice(0, 140) : null,
          overflowX: cs.overflowX,
        })
        if (res.length >= 4) break
      }
      return { found: res, title: document.title.slice(0, 60) }
    })
    out.push({ url, ...r })
  } catch (e) { out.push({ url, error: String(e).slice(0, 160) }) }
  await ctx.close()
}
await b.close()
writeFileSync(process.argv[2], JSON.stringify(out, null, 2))
console.log(JSON.stringify(out, null, 2).slice(0, 6000))
