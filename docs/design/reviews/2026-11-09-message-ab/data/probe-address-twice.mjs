// When a record opens at its address, how far apart are the two places the
// same address is drawn, and are they the same string?
import { launch, VIEWPORTS } from '../../../review-kit/lib/browser.mjs'
import { freezeContext } from '../../../review-kit/lib/freeze.mjs'
import openState from './state-at-opened.mjs'

const browser = await launch()
for (const [vname, width, height] of VIEWPORTS) {
  const ctx = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 1 })
  await freezeContext(ctx)
  const page = await ctx.newPage()
  await page.goto('http://localhost:3310/record/at', { waitUntil: 'load' })
  await page.waitForTimeout(400)
  await openState(page)
  const r = await page.evaluate(() => {
    const input = document.querySelector('input[aria-label="a record address"]')
    const echo = [...document.querySelectorAll('p')].find(
      (p) => p.textContent.trim() === input.value.trim() && p !== input,
    )
    if (!echo) return { echo: null }
    const a = input.getBoundingClientRect()
    const b = echo.getBoundingClientRect()
    const cs = getComputedStyle(input)
    const ce = getComputedStyle(echo)
    return {
      same: input.value.trim() === echo.textContent.trim(),
      value: input.value.trim(),
      gap: Math.round((b.top - a.bottom) * 100) / 100,
      fieldFont: `${cs.fontSize}/${cs.fontFamily.split(',')[0]}`,
      echoFont: `${ce.fontSize}/${ce.fontFamily.split(',')[0]}`,
    }
  })
  console.log(vname.padEnd(8), r.echo === null ? 'no echoed line found' :
    `same string ${r.same}  gap ${String(r.gap).padStart(7)}px  field ${r.fieldFont}  echo ${r.echoFont}  "${r.value}"`)
  await ctx.close()
}
await browser.close()
