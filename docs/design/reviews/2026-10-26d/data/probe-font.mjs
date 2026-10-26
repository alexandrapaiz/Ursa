import { launch } from '../../../review-kit/lib/browser.mjs'
import enter from '../../2026-10-26c/data/state-panel-synced.mjs'
const browser = await launch()
const ctx = await browser.newContext({ viewport:{width:390,height:844}, deviceScaleFactor:1 })
const page = await ctx.newPage()
await page.goto('http://127.0.0.1:4962/', { waitUntil:'networkidle' })
await enter(page, 'probe')
const r = await page.evaluate(() => {
  const pick = (el) => { const cs=getComputedStyle(el); const b=el.getBoundingClientRect(); return {
    family: cs.fontFamily, size: cs.fontSize, weight: cs.fontWeight, letter: cs.letterSpacing,
    box: [Math.round(b.width*100)/100, Math.round(b.height*100)/100] } }
  const out = {}
  out['the sentence it sits in (span)'] = pick(document.querySelector('footer span'))
  out['misread? (button)'] = pick([...document.querySelectorAll('button')].find(b=>b.textContent.includes('misread')))
  out['run (button)'] = pick([...document.querySelectorAll('button')].find(b=>b.textContent.trim()==='run'))
  out['body'] = pick(document.body)
  return out
})
for (const [k,v] of Object.entries(r)) console.log(k.padEnd(32), JSON.stringify(v))
await browser.close()
