import { launch, VIEWPORTS } from '../../../review-kit/lib/browser.mjs'
const b = await launch()
for (const [v,w,h] of VIEWPORTS) {
  const ctx = await b.newContext({viewport:{width:w,height:h},deviceScaleFactor:1})
  const p = await ctx.newPage()
  await p.goto('http://127.0.0.1:4962/', {waitUntil:'networkidle'})
  const rows = await p.evaluate(() => {
    const out = []
    for (const el of document.querySelectorAll('pre, code')) {
      const cs = getComputedStyle(el)
      if (el.scrollWidth > el.clientWidth + 0.5) out.push({
        tag: el.tagName.toLowerCase(), cls: el.className.slice(0,40),
        clientW: el.clientWidth, scrollW: el.scrollWidth,
        cut: el.scrollWidth - el.clientWidth,
        overflowX: cs.overflowX, whiteSpace: cs.whiteSpace,
        text: el.textContent.trim().replace(/\s+/g,' ').slice(0,70),
      })
    }
    return out
  })
  console.log(`--- ${v} ${w}x${h}: ${rows.length} clipped`)
  for (const r of rows) console.log('   ', JSON.stringify(r))
  await ctx.close()
}
await b.close()
