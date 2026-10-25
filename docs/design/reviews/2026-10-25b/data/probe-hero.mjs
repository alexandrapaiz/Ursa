import { launch, VIEWPORTS } from '/tmp/epito-ursa-frontend-5l1SC0/docs/design/review-kit/lib/browser.mjs'
const b = await launch()
for (const [v,w,h] of VIEWPORTS) {
  const ctx = await b.newContext({viewport:{width:w,height:h},deviceScaleFactor:1})
  const p = await ctx.newPage()
  await p.goto('http://127.0.0.1:4962/', {waitUntil:'networkidle'})
  await p.waitForTimeout(500)
  const r = await p.evaluate((vh) => {
    const pick = (sel) => { const e = document.querySelector(sel); if(!e) return null
      const b = e.getBoundingClientRect(); return {top:Math.round(b.top), bottom:Math.round(b.bottom), h:Math.round(b.height)} }
    const h1 = pick('h1')
    const cta = [...document.querySelectorAll('a,button')].find(e=>/get polaris/i.test(e.textContent||''))
    const c = cta?.getBoundingClientRect()
    const hero = document.querySelector('section')?.getBoundingClientRect()
    return { vh, h1, cta: c?{top:Math.round(c.top),bottom:Math.round(c.bottom)}:null,
             heroH: hero?Math.round(hero.height):null,
             h1BelowFold: h1 ? h1.top >= vh : null,
             ctaBelowFold: c ? c.top >= vh : null }
  }, h)
  console.log(v.padEnd(8), JSON.stringify(r))
  await ctx.close()
}
await b.close()
