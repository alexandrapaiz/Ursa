// What a pointer can and cannot do to the passphrase field, measured.
import { launch } from '../../../review-kit/lib/browser.mjs'
const browser = await launch()
const ctx = await browser.newContext({ viewport:{width:390,height:844}, deviceScaleFactor:1 })
const page = await ctx.newPage()
await page.goto('http://127.0.0.1:4962/', { waitUntil:'networkidle' })
await page.waitForSelector('input[type=password]')
const box = await page.evaluate(() => { const b=document.querySelector('input[type=password]').getBoundingClientRect(); return {x:b.x,y:b.y,w:b.width,h:b.height} })

const state = () => page.evaluate(() => {
  const f = document.querySelector('input[type=password]')
  return { focused: document.activeElement === f, value: f.value, start: f.selectionStart, end: f.selectionEnd }
})

console.log('cursor over the field:', await page.evaluate(() => getComputedStyle(document.querySelector('.panel-field')).cursor))
console.log('autofocus on arrival:', JSON.stringify(await state()))

// type a passphrase, then blur, then try to put the caret in the middle by clicking
await page.keyboard.type('correct horse battery')
await page.evaluate(() => document.querySelector('input[type=password]').blur())
console.log('after typing, blurred:   ', JSON.stringify(await state()))

// click near the left of the text and ask where the caret landed
await page.mouse.click(box.x + 12, box.y + box.h/2)
console.log('click near left edge:    ', JSON.stringify(await state()))
await page.evaluate(() => document.querySelector('input[type=password]').blur())
await page.mouse.click(box.x + box.w - 12, box.y + box.h/2)
console.log('click near right edge:   ', JSON.stringify(await state()))

// drag-select across the text
await page.evaluate(() => { const f=document.querySelector('input[type=password]'); f.focus(); f.setSelectionRange(0,0) })
await page.mouse.move(box.x + 8, box.y + box.h/2)
await page.mouse.down()
await page.mouse.move(box.x + box.w - 8, box.y + box.h/2, { steps: 12 })
await page.mouse.up()
console.log('after dragging across:   ', JSON.stringify(await state()))

// double click to select a word
await page.mouse.dblclick(box.x + 40, box.y + box.h/2)
console.log('after double click:      ', JSON.stringify(await state()))
await browser.close()
