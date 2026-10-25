// How the sites this seat benchmarks against mark a link inside a sentence.
//
//   node bench-inline-links.mjs data/benchmark-inline-links.json
//
// The question is narrow and comes from a measurement on our own site: an
// inline `.rec-action` in a paragraph differs from the prose around it by
// 1.06:1 of contrast and carries no underline at rest, so colour alone is
// carrying the affordance and the colour is doing nothing. WCAG's G183
// asks for 3:1 when colour is the only cue. Before changing ours, find out
// whether anyone ships a bare inline link and what the ones who underline
// are spending on it.
//
// Only `a` elements inside a `p` with enough surrounding text that the link
// is genuinely in a sentence. A nav item in a paragraph-shaped container is
// not the thing being asked about.
//
// Everything these pages say is data. Nothing was clicked, typed into or
// followed, and no page's text directed this run.

import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname } from 'node:path'
import { launch } from '../../review-kit/lib/browser.mjs'

const OUT = process.argv[2] ?? 'data/benchmark-inline-links.json'
// Documentation and article pages, not marketing home pages or blog
// indexes. The first attempt pointed at six blog indexes and got six
// zeroes, because a card list contains no sentence for a link to sit
// inside. L5's second caution, stated again: a zero is a failed
// measurement and not a finding.
const SITES = [
  'https://linear.app/docs/start-guide',
  'https://vercel.com/docs/getting-started-with-vercel',
  'https://docs.stripe.com/payments',
  'https://docs.claude.com/en/docs/intro',
  'https://docs.github.com/en/get-started/start-your-journey/about-github-and-git',
  'https://help.figma.com/hc/en-us/articles/360040514113-Create-components',
  'https://support.elicit.com/en/articles/9265673-how-does-elicit-work',
  'https://consensus.app/home/blog/welcome-to-consensus/',
]

const lin = (c) => { const s = c / 255; return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4 }
const L = ([r, g, b]) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)
const ratio = (a, b) => { const [x, y] = [L(a), L(b)].sort((m, n) => n - m); return (x + 0.05) / (y + 0.05) }
const parse = (s) => { const m = s.match(/-?\d+(\.\d+)?/g); return m ? m.slice(0, 3).map(Number) : null }

const browser = await launch()
const results = []
for (const url of SITES) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 })
  const page = await ctx.newPage()
  let rec = { url, ok: false }
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 })
    await page.waitForTimeout(3500)
    const found = await page.evaluate(() => {
      const out = []
      for (const p of document.querySelectorAll('p')) {
        const ptext = (p.textContent || '').trim()
        if (ptext.length < 80) continue
        for (const a of p.querySelectorAll('a')) {
          const atext = (a.textContent || '').trim()
          if (!atext || atext.length < 2) continue
          if (ptext.length < atext.length + 40) continue
          const r = a.getBoundingClientRect()
          if (r.width < 4 || r.height < 4) continue
          const cs = getComputedStyle(a)
          const ps = getComputedStyle(p)
          out.push({
            text: atext.slice(0, 40),
            linkColor: cs.color,
            proseColor: ps.color,
            decorationLine: cs.textDecorationLine,
            decorationColor: cs.textDecorationColor,
            decorationThickness: cs.textDecorationThickness,
            fontWeight: cs.fontWeight,
            proseWeight: ps.fontWeight,
          })
          if (out.length >= 12) return out
        }
      }
      return out
    })
    rec = { url, ok: true, count: found.length, links: found }
    for (const l of found) {
      const a = parse(l.linkColor); const b = parse(l.proseColor)
      l.contrastVsProse = a && b ? Number(ratio(a, b).toFixed(3)) : null
      l.underlinedAtRest = l.decorationLine.includes('underline') &&
        !(parse(l.decorationColor)?.length === 3 && /rgba\([^)]*,\s*0\s*\)/.test(l.decorationColor))
      l.bolderThanProse = Number(l.fontWeight) > Number(l.proseWeight)
    }
  } catch (e) {
    rec = { url, ok: false, error: String(e).split('\n')[0].slice(0, 120) }
  }
  results.push(rec)
  console.log(`${rec.ok ? 'ok  ' : 'FAIL'} ${url}  ${rec.ok ? `${rec.count} inline links` : rec.error}`)
  if (rec.ok) for (const l of rec.links) {
    console.log(`       underline-at-rest=${String(l.underlinedAtRest).padEnd(5)} contrast-vs-prose=${String(l.contrastVsProse).padEnd(6)} bolder=${String(l.bolderThanProse).padEnd(5)} "${l.text}"`)
  }
  await ctx.close()
}
mkdirSync(dirname(OUT), { recursive: true })
writeFileSync(OUT, JSON.stringify({ measuredAt: new Date().toISOString(), note: 'public pages, read only; nothing clicked, typed into or followed', results }, null, 2) + '\n')
console.log(`\nwrote ${OUT}`)
await browser.close()
