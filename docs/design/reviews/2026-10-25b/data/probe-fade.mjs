import { launch, VIEWPORTS } from '/tmp/epito-ursa-frontend-5l1SC0/docs/design/review-kit/lib/browser.mjs'
const b = await launch()
for (const [v,w,h] of VIEWPORTS) {
  const ctx = await b.newContext({viewport:{width:w,height:h},deviceScaleFactor:1})
  const p = await ctx.newPage()
  await p.goto('http://127.0.0.1:4962/', {waitUntil:'networkidle'})
  await p.waitForTimeout(600)
  const rows = await p.evaluate(() => [...document.querySelectorAll('.rec-cmd')].map(el => {
    const cs = getComputedStyle(el)
    return {
      cut: el.scrollWidth - el.clientWidth,
      scrollLeft: el.scrollLeft,
      fadeL: cs.getPropertyValue('--fade-l').trim(),
      fadeR: cs.getPropertyValue('--fade-r').trim(),
      mask: cs.maskImage.slice(0, 95),
      text: el.textContent.trim().split('\n').pop().slice(-28),
    }
  }))
  console.log(`--- ${v} ${w}x${h}`)
  for (const r of rows) console.log('   ', JSON.stringify(r))
  await ctx.close()
}
await b.close()
