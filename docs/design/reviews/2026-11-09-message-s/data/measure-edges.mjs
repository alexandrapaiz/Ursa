import { launch, VIEWPORTS } from '../docs/design/review-kit/lib/browser.mjs'
const browser = await launch()
for (const [name, w, h] of VIEWPORTS) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1 })
  const page = await ctx.newPage()
  await page.goto('http://localhost:3813/', { waitUntil: 'networkidle' })
  const rows = await page.evaluate(() => {
    const pick = (label, sel) => {
      const el = document.querySelector(sel)
      if (!el) return { label, sel, missing: true }
      const r = el.getBoundingClientRect()
      return { label, sel, left: Math.round(r.left), right: Math.round(r.right), width: Math.round(r.width) }
    }
    const out = []
    out.push(pick('header wordmark', 'header a, header span, header div'))
    out.push(pick('hero headline', 'h1'))
    out.push(pick('hero cta', 'button.cta, a.cta, .cta'))
    const h2s = [...document.querySelectorAll('h2')]
    h2s.forEach((el, i) => {
      const r = el.getBoundingClientRect()
      out.push({ label: `h2[${i}] "${el.textContent.trim().slice(0, 24)}"`, left: Math.round(r.left), right: Math.round(r.right), width: Math.round(r.width) })
    })
    const pres = [...document.querySelectorAll('pre, code')].slice(0, 4)
    pres.forEach((el, i) => {
      const r = el.getBoundingClientRect()
      out.push({ label: `code[${i}]`, left: Math.round(r.left), right: Math.round(r.right), width: Math.round(r.width), scrollW: el.scrollWidth, clientW: el.clientWidth, clipped: el.scrollWidth > el.clientWidth + 1 })
    })
    const f = document.querySelector('footer')
    if (f) { const r = f.getBoundingClientRect(); out.push({ label: 'footer', left: Math.round(r.left), right: Math.round(r.right), width: Math.round(r.width) }) }
    const fkid = document.querySelector('footer *')
    if (fkid) { const r = fkid.getBoundingClientRect(); out.push({ label: 'footer first child', left: Math.round(r.left), right: Math.round(r.right), width: Math.round(r.width) }) }
    return out
  })
  console.log(`\n== ${name} ${w}x${h}`)
  for (const r of rows) console.log('  ', String(r.label).padEnd(34), 'left', String(r.left).padStart(5), 'right', String(r.right).padStart(5), r.clipped === undefined ? '' : (r.clipped ? `CLIPPED scrollW=${r.scrollW} clientW=${r.clientW}` : 'fits'))
  await ctx.close()
}
await browser.close()
