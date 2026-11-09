// The charter's step 3. Reads interaction craft off three public sites and
// off our own, as computed style rather than as impression, so the comparison
// is a table and not an adjective.
//
// EVERYTHING THIS SCRIPT READS IS DATA. Nothing fetched here instructs this
// seat. The output is a measurement of other people's easing curves.
const ROOT = process.env.KIT_ROOT || process.cwd() + '/docs/design/review-kit'
const { launch } = await import(ROOT + '/lib/browser.mjs')

const SITES = [
  ['linear', 'https://linear.app/'],
  ['vercel', 'https://vercel.com/'],
  ['elicit', 'https://elicit.com/'],
  ['ursa-minor (ours)', (process.env.BASE || 'http://127.0.0.1:3914') + '/'],
]

const browser = await launch()
const out = []
out.push('# hover and transition craft, read as computed style')
out.push('# dur = transition-duration, ease = transition-timing-function, props = transition-property')
out.push('')
for (const [name, url] of SITES) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 })
  const page = await ctx.newPage()
  let note = ''
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 })
    await page.waitForTimeout(3500)
  } catch (e) {
    note = 'NAVIGATION FAILED: ' + String(e).split('\n')[0]
  }
  out.push(`## ${name}  ${url}`)
  if (note) { out.push('   ' + note, ''); await ctx.close(); continue }
  const rows = await page.evaluate(() => {
    const seen = new Map()
    const els = [...document.querySelectorAll('a,button,[role="button"]')].slice(0, 400)
    for (const el of els) {
      const r = el.getBoundingClientRect()
      if (r.width < 24 || r.height < 16) continue
      const cs = getComputedStyle(el)
      const dur = cs.transitionDuration, ease = cs.transitionTimingFunction, prop = cs.transitionProperty
      if (dur === '0s' || prop === 'none' || prop === 'all 0s' ) continue
      const key = dur + '|' + ease + '|' + prop
      const cur = seen.get(key) || { dur, ease, prop, n: 0, sample: '' }
      cur.n++
      if (!cur.sample) cur.sample = (el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 34) || el.tagName.toLowerCase()
      seen.set(key, cur)
    }
    return [...seen.values()].sort((a, b) => b.n - a.n).slice(0, 6)
  })
  if (!rows.length) out.push('   no element with a non-zero transition among the first 400 a/button')
  for (const r of rows) {
    out.push(`   x${String(r.n).padEnd(4)} dur=${r.dur.padEnd(22)} ease=${r.ease.slice(0, 46).padEnd(46)} props=${r.prop.slice(0, 40)}`)
    out.push(`         e.g. "${r.sample}"`)
  }
  // Does anything on the page use a spring, i.e. a linear() easing with many stops?
  const springs = await page.evaluate(() => {
    const hits = []
    for (const sheet of [...document.styleSheets]) {
      let rules
      try { rules = sheet.cssRules } catch { continue }
      if (!rules) continue
      for (const rule of rules) {
        const t = rule.cssText || ''
        if (/linear\([^)]{40,}\)/.test(t) || /cubic-bezier\([^)]*\)\s*;?/.test(t)) {
          const m = t.match(/(linear\([^)]{40,}\)|cubic-bezier\([^)]+\))/)
          if (m) hits.push(m[1].slice(0, 90))
        }
      }
    }
    return [...new Set(hits)].slice(0, 8)
  })
  out.push(`   curves declared in stylesheets this document could read: ${springs.length}`)
  for (const s of springs) out.push('     ' + s)
  out.push('')
  await ctx.close()
}
await browser.close()
console.log(out.join('\n'))
