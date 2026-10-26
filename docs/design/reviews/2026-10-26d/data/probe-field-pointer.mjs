// What is actually on top of the panel's passphrase field.
import { launch } from '../../../review-kit/lib/browser.mjs'
const browser = await launch()
for (const [w,h] of [[390,844],[820,1180],[1440,900]]) {
  const ctx = await browser.newContext({ viewport:{width:w,height:h}, deviceScaleFactor:1 })
  const page = await ctx.newPage()
  await page.goto('http://127.0.0.1:4962/', { waitUntil:'networkidle' })
  await page.waitForSelector('input[type=password]')
  const r = await page.evaluate(() => {
    const f = document.querySelector('input[type=password]')
    const b = f.getBoundingClientRect()
    const pts = {
      'field centre': [b.x+b.width/2, b.y+b.height/2],
      'field left 10%': [b.x+b.width*0.1, b.y+b.height/2],
      'field top edge +2': [b.x+b.width/2, b.y+2],
      '44px band above': [b.x+b.width/2, b.y-3],
    }
    const out = {}
    for (const [k,[x,y]] of Object.entries(pts)) {
      const el = document.elementFromPoint(x,y)
      out[k] = el ? `${el.tagName.toLowerCase()}${el.className?'.'+String(el.className).trim().replace(/\s+/g,'.'):''}` : 'null'
    }
    const label = document.querySelector('.panel-field')
    const lb = label.getBoundingClientRect()
    const cs = getComputedStyle(label, '::after')
    return { out, field:[Math.round(b.width),Math.round(b.height)], label:[Math.round(lb.width),Math.round(lb.height)], after:{inset:cs.inset, top:cs.top, height:cs.height, pointerEvents:cs.pointerEvents} }
  })
  console.log(`--- ${w}x${h} ---`)
  console.log('  field box', r.field, ' label box', r.label)
  console.log('  ::after height', r.after.height, 'top', r.after.top, 'pointer-events', r.after.pointerEvents)
  for (const [k,v] of Object.entries(r.out)) console.log(`  ${k.padEnd(18)} -> ${v}`)
  await ctx.close()
}
await browser.close()
