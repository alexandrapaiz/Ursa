// Where does the home page's first sentence sit relative to the first screen?
import { launch } from '/tmp/epito-ursa-frontend-OIWa3E/docs/design/review-kit/lib/browser.mjs'
import { freezeInit, PINNED_MS, SEED } from '/tmp/epito-ursa-frontend-OIWa3E/docs/design/review-kit/lib/freeze.mjs'
const BASE = 'http://127.0.0.1:4511'
const VPS = [['phone',390,844],['tablet',820,1180],['desktop',1440,900]]
const b = await launch()
for (const [n,w,h] of VPS) {
  const ctx = await b.newContext({ viewport:{width:w,height:h}, deviceScaleFactor:1 })
  await ctx.addInitScript(freezeInit, { t: PINNED_MS, seed: SEED, clock: true, random: true, now: null })
  const p = await ctx.newPage()
  await p.goto(BASE+'/', { waitUntil:'networkidle' })
  await p.waitForTimeout(400)
  const r = await p.evaluate(() => {
    const pick = (sel) => { const e = document.querySelector(sel); if(!e) return null; const b=e.getBoundingClientRect(); return {top:Math.round(b.top),bottom:Math.round(b.bottom),text:(e.textContent||'').trim().slice(0,40)} }
    return { h1: pick('h1'), cta: pick('a[href],button'), vh: innerHeight }
  })
  console.log(n.padEnd(8), 'viewport', String(h).padStart(5),
    ' h1 top', String(r.h1?.top).padStart(5), 'bottom', String(r.h1?.bottom).padStart(5),
    r.h1 && r.h1.top >= r.vh ? ' ENTIRELY BELOW THE FOLD' : r.h1 && r.h1.bottom > r.vh ? ' partly below' : ' in view')
  await ctx.close()
}
await b.close()
