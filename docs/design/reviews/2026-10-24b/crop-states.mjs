import { mkdirSync } from 'node:fs'
import { launch } from '../../review-kit/lib/browser.mjs'

const BASE_URL = process.env.URSA_BASE ?? 'http://127.0.0.1:4617'
const OUT = process.argv[2]; mkdirSync(OUT, { recursive: true })
const b = await launch()
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 })
const p = await ctx.newPage()
await p.goto(BASE_URL + '/', { waitUntil: 'networkidle' })
await p.waitForTimeout(500)
const shoot = async (i, scroll, name) => {
  await p.evaluate(async ([i, scroll]) => {
    const el = document.querySelectorAll('.rec-cmd')[i]
    el.scrollLeft = scroll === 'end' ? el.scrollWidth : scroll
    await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))
  }, [i, scroll])
  const box = p.locator('.rec-cmd').nth(i).locator('xpath=..')
  await box.scrollIntoViewIfNeeded()
  await p.waitForTimeout(200)
  await box.screenshot({ path: `${OUT}/${name}.png`, scale: 'css' })
}
await shoot(2, 'end', 'cmd-action-desktop-scrolled-to-end')
await shoot(2, 268, 'cmd-action-desktop-mid-scroll')
await shoot(0, 0, 'cmd-clone-desktop-fits')
await b.close()
console.log('done')
