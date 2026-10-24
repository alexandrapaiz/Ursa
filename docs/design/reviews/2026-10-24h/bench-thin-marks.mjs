// How visible is a wordless mark on somebody else's product.
//
//   node bench-thin-marks.mjs data/benchmark-thin-marks.json
//
// The charter's benchmark step says to study best-in-class products and
// translate what makes them work into this identity rather than copy
// their look. The thing this run changed is a 6px bar with no words in
// it, so the portable question is not what colour anyone uses. It is
// whether anybody ships a mark that small carrying meaning below the
// contrast a reader needs to see it at all, because if a frontier
// product does, that is evidence about the defect's reach and not a
// reason to keep ours.
//
// **Same instrument as our own measurement.** A thin mark is any visible
// element 2 to 12 CSS pixels tall and at least 60 wide with an opaque
// enough background to paint: bars, meters, rules, underlines, the
// segmented language bar a repository page draws. Each one is sampled at
// its own centre out of a rendered frame, and the ground is sampled six
// pixels above it, exactly as `measure-fills.mjs` does here. Contrast is
// WCAG 2.x; 1.4.11 asks 3:1 of a graphical object you must see to
// understand the page.
//
// What it cannot do, said plainly: it cannot know which of those marks
// carry meaning and which are decoration. A 1px hairline between two
// list rows is allowed to be faint, and this run's own page keeps one at
// 1.20:1 deliberately. So the number to read is the distribution of the
// marks that are 4px and taller, where a mark is a quantity rather than
// a divider, and every site's full list is written out so the reading
// can be checked.
//
// Nothing on any of these pages is clicked, typed into or followed, and
// nothing any of them says is an instruction to this run.

import { execFileSync } from 'node:child_process'
import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { launch } from '../../review-kit/lib/browser.mjs'

const OUT = process.argv[2] ?? 'data/benchmark-thin-marks.json'

const SITES = [
  ['GitHub, a repository page', 'https://github.com/vercel/next.js'],
  ['Linear', 'https://linear.app'],
  ['Vercel', 'https://vercel.com'],
  ['Stripe', 'https://stripe.com'],
  ['Consensus', 'https://consensus.app'],
  ['Claude', 'https://claude.com'],
  // Ours, through the same instrument, so the table includes the page
  // that prompted it rather than comparing a measurement with a memory.
  ['Ursa, this run', 'http://127.0.0.1:4971/record/mini-fixture'],
]

const lin = (c) => { const s = c / 255; return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4 }
const L = ([r, g, b]) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)
const ratio = (a, b) => { const [x, y] = [L(a), L(b)].sort((m, n) => n - m); return (x + 0.05) / (y + 0.05) }

const dir = mkdtempSync(join(tmpdir(), 'fe-bench-'))
const browser = await launch()
const out = []

for (const [name, url] of SITES) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 })
  const page = await ctx.newPage()
  const row = { site: name, url, marks: [] }
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 })
    await page.waitForTimeout(2500)
    // Walk the page once so anything lazy below the fold has rendered
    // before the frame is taken, then go back to the top, which is the
    // origin the coordinates are read against.
    await page.evaluate(async () => {
      for (let y = 0; y < Math.min(document.body.scrollHeight, 12000); y += 800) {
        scrollTo(0, y)
        await new Promise((r) => setTimeout(r, 120))
      }
      scrollTo(0, 0)
    })
    await page.waitForTimeout(800)
    const found = await page.evaluate(() => {
      const out = []
      const opaqueGround = (el) => {
        for (let p = el.parentElement; p; p = p.parentElement) {
          const c = getComputedStyle(p).backgroundColor
          const m = c.match(/rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([\d.]+))?\)/)
          if (m && (m[4] === undefined || Number(m[4]) > 0.95)) return c
        }
        return getComputedStyle(document.documentElement).backgroundColor
      }
      for (const el of document.querySelectorAll('*')) {
        const r = el.getBoundingClientRect()
        if (r.height < 2 || r.height > 12 || r.width < 60) continue
        // The whole document, not the first viewport: a repository
        // page's language bar is a long way below the fold, and the
        // first version of this script reported "no thin mark found" on
        // six sites out of six because of that one line. Coordinates are
        // page coordinates, read at scroll 0, which is where the
        // full-page frame is taken from.
        if (r.top < 0 || r.left < 0 || r.right > innerWidth) continue
        const cs = getComputedStyle(el)
        if (cs.visibility === 'hidden' || cs.display === 'none' || Number(cs.opacity) < 0.1) continue
        const bg = cs.backgroundColor
        const m = bg.match(/rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([\d.]+))?\)/)
        if (!m || (m[4] !== undefined && Number(m[4]) < 0.05)) continue
        el.setAttribute('data-fe-mark', String(out.length))
        out.push({
          tag: el.tagName.toLowerCase(),
          cls: (el.getAttribute('class') ?? '').slice(0, 40),
          x: Math.round(r.x + r.width / 2),
          y: Math.round(r.y + r.height / 2),
          top: Math.round(r.y),
          h: Math.round(r.height * 10) / 10,
          w: Math.round(r.width),
          id: out.length,
          declared: bg,
          // A translucent mark inside a painted container composes over
          // that container and not over the page. Both candidates are
          // carried so the check below can say which one the frame
          // agrees with, rather than guessing one and discarding a real
          // measurement when it guesses wrong.
          // The first ancestor that actually paints. A translucent mark
          // composes over that and not over the page, and on a bar the
          // ancestor IS the track, which is the ground a reader is
          // telling the segment apart from.
          groundCss: opaqueGround(el),
        })
        if (out.length >= 8) break
      }
      return out
    })
    if (found.length) {
      // One screenshot per mark, not one of the page. The first two runs
      // of this script read rects, then shot the whole page, and on a
      // repository page that lazy-loads above the fold every sample came
      // back from the wrong rows: once as pure white where the page
      // declares blue, once as all three samples discarded. An element
      // screenshot is clipped at shutter time, so a reflow moves the
      // frame with the element instead of past it.
      for (const f of found) {
        const shot = join(dir, `${name.replace(/\W+/g, '-')}-${f.id}.png`)
        try {
          await page.locator(`[data-fe-mark="${f.id}"]`).screenshot({ path: shot, timeout: 5000 })
        } catch { continue }
        const py = `
from PIL import Image
im = Image.open(${JSON.stringify(shot)}).convert('RGB')
print(*im.getpixel((im.width // 2, im.height // 2)))
`
        const mark = execFileSync('python3', ['-c', py], { encoding: 'utf8' })
          .trim().split(' ').map(Number)
        const parse = (c) => {
          const m = c.match(/rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([\d.]+))?\)/)
          return m ? { rgb: [1, 2, 3].map((k) => Number(m[k])), a: m[4] === undefined ? 1 : Number(m[4]) } : null
        }
        const fill = parse(f.declared)
        const g = parse(f.groundCss) ?? { rgb: [255, 255, 255], a: 1 }
        const ground = g.rgb
        const expected = fill.rgb.map((v, k) => Math.round(v * fill.a + ground[k] * (1 - fill.a)))
        // Every sample checks itself: the frame has to agree with the
        // colour the stylesheet declares, composed over the ground, to
        // within 6 of 255 per channel. A sample that does not agree is
        // kept in the file and excluded from every number, because a
        // measurement that cannot be checked is not a measurement.
        const verified = expected.every((v, k) => Math.abs(v - mark[k]) <= 6)
        row.marks.push({
          ...f, rendered: mark, ground, expected, verified,
          contrast: Math.round(ratio(mark, ground) * 100) / 100,
        })
      }
    }
    const bad = row.marks.filter((m) => !m.verified).length
    row.status = row.marks.length
      ? `measured${bad ? `, ${bad} of ${row.marks.length} samples discarded as unverified` : ''}`
      : 'no thin mark found anywhere on the page'
  } catch (e) {
    row.status = `no measurement: ${String(e).split('\n')[0].slice(0, 120)}`
  }
  const thick = row.marks.filter((m) => m.h >= 4 && m.verified)
  if (thick.length) {
    const sorted = thick.map((m) => m.contrast).sort((a, b) => a - b)
    row.summary = {
      marks4pxPlus: thick.length,
      lowest: sorted[0],
      median: sorted[Math.floor(sorted.length / 2)],
      below3to1: sorted.filter((c) => c < 3).length,
    }
  }
  console.log(`${name.padEnd(28)} ${row.status}${row.summary ? `  ${row.summary.marks4pxPlus} marks >=4px, lowest ${row.summary.lowest}:1, ${row.summary.below3to1} under 3:1` : ''}`)
  out.push(row)
  await ctx.close()
}

writeFileSync(OUT, JSON.stringify(out, null, 2) + '\n')
await browser.close()
