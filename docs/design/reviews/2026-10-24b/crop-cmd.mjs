// A close crop of the command block that clips, at every width, so the cut
// can be looked at rather than inferred from a number.
import { mkdirSync } from 'node:fs'
import { launch } from '../../review-kit/lib/browser.mjs'

const BASE_URL = process.env.URSA_BASE ?? 'http://127.0.0.1:4617'
const OUT = process.argv[2]
mkdirSync(OUT, { recursive: true })
const browser = await launch()
for (const [vname, w, h] of [['narrow', 320, 844], ['phone', 390, 844], ['tablet', 820, 1180], ['desktop', 1440, 900]]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1 })
  const page = await ctx.newPage()
  await page.goto(BASE_URL + '/', { waitUntil: 'networkidle' })
  // the Action block is the third .rec-cmd; shoot its bordered container
  const box = page.locator('.rec-cmd').nth(2).locator('xpath=..')
  await box.scrollIntoViewIfNeeded()
  await page.waitForTimeout(300)
  await box.screenshot({ path: `${OUT}/cmd-action-${vname}.png`, scale: 'css' })
  await ctx.close()
}
await browser.close()
console.log('cropped')
