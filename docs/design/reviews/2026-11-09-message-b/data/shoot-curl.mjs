/**
 * The long Action command, focused from the keyboard, cropped with
 * measure-focus.mjs's own PAD of 12 so the frame is comparable to the
 * before-frames that tool wrote. It exists because `--frames` only writes a
 * stop that failed or stop 0, so once the fix passes there is no after-frame
 * for the tablet and desktop case.
 */
import { launch } from '../../../review-kit/lib/browser.mjs'
import { freezeContext } from '../../../review-kit/lib/freeze.mjs'
import { writeFileSync } from 'node:fs'

const PAD = 12
const OUT = process.argv[2]
const b = await launch()
for (const [name, w, h] of [['phone', 390, 844], ['tablet', 820, 1180], ['desktop', 1440, 900]]) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1 })
  await freezeContext(ctx, { scroll: true })
  const p = await ctx.newPage()
  await p.goto('http://127.0.0.1:4982/', { waitUntil: 'networkidle' })
  await p.waitForTimeout(500)
  if (p.viewportSize().width !== w) throw new Error('viewport did not take')

  // the Action's curl box: the last command on the page, and the one that
  // overflows at every width
  const el = p.locator('pre.rec-cmd').last()
  await el.evaluate((n) => { n.id = '__curl'; n.scrollIntoView({ block: 'center', behavior: 'instant' }) })
  await p.waitForTimeout(120)
  await el.evaluate((n) => n.focus())
  await p.keyboard.press('Shift+Tab'); await p.keyboard.press('Tab')
  const ok = await p.evaluate(() => document.activeElement?.id === '__curl' && document.activeElement.matches(':focus-visible'))
  if (!ok) throw new Error(`${name}: keyboard focus did not land on the curl box`)
  await p.waitForTimeout(80)

  const box = await el.boundingBox()
  const clip = {
    x: Math.max(0, Math.floor(box.x - PAD)),
    y: Math.max(0, Math.floor(box.y - PAD)),
    width: 0, height: 0,
  }
  clip.width = Math.min(w - clip.x, Math.ceil(box.width + 2 * PAD + (box.x - PAD - clip.x)))
  clip.height = Math.min(h - clip.y, Math.ceil(box.height + 2 * PAD + (box.y - PAD - clip.y)))
  writeFileSync(`${OUT}/home-${name}-curl-focused.png`, await p.screenshot({ clip }))
  console.log(`${name}: wrote home-${name}-curl-focused.png  box ${Math.round(box.width)}x${Math.round(box.height)}`)
  await ctx.close()
}
await b.close()
