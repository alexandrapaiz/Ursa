import { launch, VIEWPORTS } from '/tmp/epito-ursa-frontend-Ckli3D/docs/design/review-kit/lib/browser.mjs'
import { freezeContext } from '/tmp/epito-ursa-frontend-Ckli3D/docs/design/review-kit/lib/freeze.mjs'
const PAGES = { home: '/', set: '/record', record: '/record/mini-fixture', address: '/record/at' }
const browser = await launch()
for (const [vn, w, h] of VIEWPORTS) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1 })
  await freezeContext(ctx)
  const page = await ctx.newPage()
  for (const [pn, path] of Object.entries(PAGES)) {
    await page.goto('http://127.0.0.1:4488' + path, { waitUntil: 'networkidle' })
    const rows = await page.evaluate(() => {
      const out = []
      const push = (k, el) => { if (!el) return; const r = el.getBoundingClientRect(); out.push([k, Math.round(r.left), Math.round(r.right), el.className?.toString?.().slice(0,60)]) }
      push('wordmark', document.querySelector('header a, header span'))
      push('tagline', [...document.querySelectorAll('header *')].pop())
      push('h1', document.querySelector('h1'))
      push('firstSectionInner', document.querySelector('section > *'))
      return out
    })
    for (const [k, l, r, c] of rows) console.log(`${vn}\t${pn}\t${String(l).padStart(5)}\t${String(r).padStart(5)}\t${k}\t${c}`)
  }
  await ctx.close()
}
await browser.close()
