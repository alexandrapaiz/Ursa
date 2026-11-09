// The header is full-bleed on every page: `site-header.tsx` carries page
// padding and no max-width, so the wordmark sits on the page edge while the
// body column may be centred. The gap between them is therefore a property of
// the existing design and not of this run's change, but this run moves which
// widths produce which gap, so the gap is measured rather than asserted.
//
// The header's own left edge cannot move under this change, so one pass over
// the current build gives the header column for BOTH tables; the body columns
// come from sweep-grid.txt and sweep-grid-after.txt.
const ROOT = process.env.KIT_ROOT || process.cwd() + '/docs/design/review-kit'
const { launch } = await import(ROOT + '/lib/browser.mjs')
const { freezeContext } = await import(ROOT + '/lib/freeze.mjs')
const BASE = process.env.BASE || 'http://127.0.0.1:3914'

const WIDTHS = []
for (let w = 960; w <= 1440; w += 16) WIDTHS.push(w)
for (const w of [1023, 1024, 1025, 1151, 1152, 1153, 1279, 1280, 1281]) if (!WIDTHS.includes(w)) WIDTHS.push(w)
WIDTHS.sort((a, b) => a - b)

const browser = await launch()
const header = {}
const ctxOpts = { deviceScaleFactor: 1 }
for (const w of WIDTHS) {
  const ctx = await browser.newContext({ ...ctxOpts, viewport: { width: w, height: 900 } })
  await freezeContext(ctx)
  const page = await ctx.newPage()
  await page.goto(BASE + '/record', { waitUntil: 'networkidle' })
  header[w] = await page.evaluate(() => Math.round(document.querySelector('header a, header span').getBoundingClientRect().left))
  await ctx.close()
}
await browser.close()

const fs = await import('node:fs')
const read = (p) => {
  const out = {}
  for (const line of fs.readFileSync(p, 'utf8').split('\n')) {
    const f = line.split('\t')
    if (f.length >= 3 && f[1] === 'set' && /^\d+$/.test(f[0])) out[+f[0]] = +f[2]
  }
  return out
}
const R = process.env.R || '.'
const before = read(R + '/data/sweep-grid.txt')
const after = read(R + '/data/sweep-grid-after.txt')

console.log('# record pages: how far the body column sits inside the header, which is full-bleed')
console.log('# a gap of 0 reads as one left edge; a large gap reads as a rail and a column;')
console.log('# a small non-zero gap is the one that reads as a mistake')
console.log(['width', 'headerL', 'bodyL_before', 'gap_before', 'bodyL_after', 'gap_after'].join('\t'))
let smallBefore = 0, smallAfter = 0, zeroBefore = 0, zeroAfter = 0
for (const w of WIDTHS) {
  const h = header[w], b = before[w], a = after[w]
  const gb = b == null ? null : b - h, ga = a == null ? null : a - h
  if (gb === 0) zeroBefore++; else if (gb != null && gb > 0 && gb < 48) smallBefore++
  if (ga === 0) zeroAfter++; else if (ga != null && ga > 0 && ga < 48) smallAfter++
  console.log([w, h, b ?? '-', gb ?? '-', a ?? '-', ga ?? '-'].join('\t'))
}
console.log('')
console.log(`widths where the two share one edge:      before ${zeroBefore}, after ${zeroAfter}  (of ${WIDTHS.length})`)
console.log(`widths with a gap under 48px, non-zero:   before ${smallBefore}, after ${smallAfter}`)
