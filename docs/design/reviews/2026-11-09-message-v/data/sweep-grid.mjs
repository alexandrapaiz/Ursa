// Sweeps viewport width across the desktop band and records, for each page,
// where the body column's content edges actually land. The three charter
// viewports cannot see this: 1440 is above both breakpoints and 820 is below
// both, so the band between them was never photographed or measured.
//
// Reports the content box of the first section's inner element, which is what
// a reader's eye aligns to, and the step between consecutive widths. A step
// larger than the viewport step is a discontinuity: the layout jumped.
const ROOT = process.env.KIT_ROOT || process.cwd() + '/docs/design/review-kit'
const { launch } = await import(ROOT + '/lib/browser.mjs')
const { freezeContext } = await import(ROOT + '/lib/freeze.mjs')

const BASE = process.env.BASE || 'http://127.0.0.1:3914'
const PAGES = { home: '/', set: '/record', record: '/record/mini-fixture', address: '/record/at' }
const WIDTHS = []
for (let w = 960; w <= 1440; w += 16) WIDTHS.push(w)
for (const w of [1023, 1024, 1025, 1151, 1152, 1153, 1279, 1280, 1281]) if (!WIDTHS.includes(w)) WIDTHS.push(w)
WIDTHS.sort((a, b) => a - b)

const browser = await launch()
const rows = []
for (const w of WIDTHS) {
  const ctx = await browser.newContext({ viewport: { width: w, height: 900 }, deviceScaleFactor: 1 })
  await freezeContext(ctx)
  const page = await ctx.newPage()
  for (const [pn, path] of Object.entries(PAGES)) {
    await page.goto(BASE + path, { waitUntil: 'networkidle' })
    const m = await page.evaluate(() => {
      const box = (el) => {
        if (!el) return null
        const r = el.getBoundingClientRect()
        return { left: Math.round(r.left), right: Math.round(r.right) }
      }
      const main = document.querySelector('main')
      return {
        h1: box(document.querySelector('h1')),
        sec: box(document.querySelector('section > *')),
        main: box(main),
        mainPadLeft: main ? Math.round(parseFloat(getComputedStyle(main).paddingLeft)) : null,
        mainMaxW: main ? getComputedStyle(main).maxWidth : null,
      }
    })
    rows.push({ w, pn, ...m })
  }
  await ctx.close()
}
await browser.close()

const out = []
out.push('# content edges of the first section, by viewport width')
out.push('# step = change in left edge from the previous measured width for the same page')
out.push('# viewport step is 16px except around the four probed breakpoints')
out.push('')
out.push(['width', 'page', 'secL', 'secR', 'secW', 'step', 'mainMaxW', 'mainPadL'].join('\t'))
const prev = {}
for (const r of rows) {
  const l = r.sec?.left, rr = r.sec?.right
  const step = prev[r.pn] == null || l == null ? '' : l - prev[r.pn]
  if (l != null) prev[r.pn] = l
  out.push([r.w, r.pn, l ?? '-', rr ?? '-', (l != null && rr != null) ? rr - l : '-', step, r.mainMaxW ?? '-', r.mainPadLeft ?? '-'].join('\t'))
}

// the headline: the largest single-pixel-of-viewport jump per page
out.push('')
out.push('# discontinuities: a left edge that moved further than the viewport did')
let found = 0
for (let i = 1; i < rows.length; i++) {
  const a = rows[i - 1], b = rows[i]
  if (a.pn !== b.pn) continue
}
const byPage = {}
for (const r of rows) (byPage[r.pn] = byPage[r.pn] || []).push(r)
for (const [pn, list] of Object.entries(byPage)) {
  list.sort((x, y) => x.w - y.w)
  for (let i = 1; i < list.length; i++) {
    const dv = list[i].w - list[i - 1].w
    const dl = (list[i].sec?.left ?? 0) - (list[i - 1].sec?.left ?? 0)
    if (Math.abs(dl) > dv) {
      found++
      out.push(`${pn}\t${list[i - 1].w} -> ${list[i].w}\tviewport +${dv}px\tleft edge ${dl > 0 ? '+' : ''}${dl}px`)
    }
  }
}
out.push('')
out.push(found === 0 ? 'no page moves its body column further than the viewport moves' : `${found} discontinuities over ${WIDTHS.length} widths x 4 pages`)
out.push('')
out.push('# divergence: pages whose body column left edge differs at the same width')
for (const [pn, list] of Object.entries(byPage)) void pn
const widths = [...new Set(rows.map(r => r.w))].sort((a, b) => a - b)
let bandStart = null, bandRows = []
for (const w of widths) {
  const at = rows.filter(r => r.w === w)
  const home = at.find(r => r.pn === 'home')?.sec?.left
  const others = at.filter(r => r.pn !== 'home').map(r => r.sec?.left)
  const sameAsOthers = others.every(o => o === others[0])
  const diff = home != null && others[0] != null ? home - others[0] : null
  bandRows.push([w, home ?? '-', others[0] ?? '-', diff ?? '-', sameAsOthers ? '' : 'RECORD PAGES DISAGREE'].join('\t'))
  void bandStart
}
out.push(['width', 'homeL', 'recordL', 'home-record', ''].join('\t'))
out.push(...bandRows)
console.log(out.join('\n'))
