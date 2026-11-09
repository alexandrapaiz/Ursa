// What differs between measure-contrast's two pages after the same drive.
//
// The tool photographs the page once as it is and once in a second context
// with every text run hidden, and calls the page untrustworthy when the
// frame outside the text changes between them. With `--state` it reported
// 0.28% at phone and 0.25% at tablet and 0.000% at desktop, which is a
// pattern and not noise. This asks the two pages directly what is different
// rather than inferring it from the drift number.
import { launch, VIEWPORTS } from '../../../review-kit/lib/browser.mjs'
import { freezeContext } from '../../../review-kit/lib/freeze.mjs'
import { couldNotRead } from './at-error-states.mjs'

const BASE = 'http://localhost:3310'
const read = (page) =>
  page.evaluate(() => {
    const input = document.querySelector('input[aria-label="a record address"]')
    const btn = document.querySelector('form button[type="submit"]')
    return {
      scrollLeft: input.scrollLeft,
      selectionStart: input.selectionStart,
      scrollWidth: input.scrollWidth,
      clientWidth: input.clientWidth,
      docHeight: document.documentElement.scrollHeight,
      active: document.activeElement ? document.activeElement.tagName + (document.activeElement.type ? ':' + document.activeElement.type : '') : 'none',
      btnText: btn.textContent.trim(),
    }
  })

const browser = await launch()
const rows = []
for (const [vname, w, h] of VIEWPORTS) {
  for (const which of ['page', 'back']) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1 })
    await freezeContext(ctx)
    const page = await ctx.newPage()
    await page.goto(`${BASE}/record/at`, { waitUntil: which === 'back' ? 'networkidle' : 'load' })
    await page.waitForTimeout(400)
    await couldNotRead(page)
    rows.push([vname, which, await read(page)])
    await ctx.close()
  }
}
await browser.close()
for (const [v, which, r] of rows) {
  console.log(
    `${v.padEnd(8)} ${which.padEnd(5)} scrollLeft ${String(r.scrollLeft).padStart(4)}  ` +
    `caret ${String(r.selectionStart).padStart(3)}  field ${r.scrollWidth}/${r.clientWidth}  ` +
    `doc ${String(r.docHeight).padStart(5)}  focus ${r.active.padEnd(14)} "${r.btnText}"`,
  )
}
