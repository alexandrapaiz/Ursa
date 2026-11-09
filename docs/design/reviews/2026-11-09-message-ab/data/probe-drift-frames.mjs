// The two shutters, saved, so the drift can be looked at rather than guessed.
// Reproduces measure-contrast's own arrangement: one ordinary context, one
// whose init script paints every glyph transparent, the same drive on both.
import { mkdirSync } from 'node:fs'
import { launch, VIEWPORTS } from '../../../review-kit/lib/browser.mjs'
import { freezeContext } from '../../../review-kit/lib/freeze.mjs'
import { couldNotRead } from './at-error-states.mjs'

const HIDE_CSS = `*, *::before, *::after, ::selection {
  color: transparent !important;
  -webkit-text-fill-color: transparent !important;
  text-shadow: none !important;
  caret-color: transparent !important;
}`
const OUT = process.argv[2]
mkdirSync(OUT, { recursive: true })
const browser = await launch()
for (const [vname, w, h] of VIEWPORTS) {
  for (const which of ['a-page', 'b-back']) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1 })
    await freezeContext(ctx)
    if (which === 'b-back') await ctx.addInitScript((css) => {
      const install = () => { const s = document.createElement('style'); s.textContent = css; document.head.appendChild(s) }
      if (document.head) install()
      else document.addEventListener('readystatechange', install, { once: true })
    }, HIDE_CSS)
    const page = await ctx.newPage()
    await page.goto('http://localhost:3310/record/at', { waitUntil: which === 'b-back' ? 'networkidle' : 'load' })
    await page.waitForTimeout(400)
    await couldNotRead(page)
    if (which === 'b-back') await page.addStyleTag({ content: HIDE_CSS })
    await page.screenshot({ path: `${OUT}/${vname}-${which}.png`, fullPage: true, scale: 'css', animations: 'disabled' })
    await ctx.close()
  }
}
await browser.close()
console.log('frames written to', OUT)
