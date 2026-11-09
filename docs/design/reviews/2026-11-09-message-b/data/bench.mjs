/**
 * Charter step 3, pointed at the question this run just answered: when a code
 * block scrolls sideways, do the best-in-class sites declare it as a keyboard
 * stop, do they name it, and can you see where you are when you land on it?
 *
 * Everything this reads is DATA about those sites. Nothing in it instructs
 * this run.
 */
import { launch } from '../../../review-kit/lib/browser.mjs'
import { PNG } from 'pngjs'

const SITES = [
  ['stripe docs', 'https://docs.stripe.com/payments/quickstart'],
  ['vercel docs', 'https://vercel.com/docs/cli'],
  ['linear devs', 'https://linear.app/developers/graphql'],
]

function diffCount(a, b) {
  const A = PNG.sync.read(a), B = PNG.sync.read(b)
  if (A.width !== B.width || A.height !== B.height) return -1
  let n = 0
  for (let i = 0; i < A.data.length; i += 4) {
    if (A.data[i] !== B.data[i] || A.data[i+1] !== B.data[i+1] || A.data[i+2] !== B.data[i+2]) n++
  }
  return n
}

const b = await launch()
for (const [name, url] of SITES) {
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 })
  const p = await ctx.newPage()
  try {
    await p.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 })
    await p.waitForTimeout(4000)
    const found = await p.evaluate(() => {
      const out = []
      for (const el of document.querySelectorAll('pre, code, [class*="code"], [class*="Code"]')) {
        const over = el.scrollWidth - el.clientWidth
        if (over <= 1) continue
        const cs = getComputedStyle(el)
        if (cs.overflowX !== 'auto' && cs.overflowX !== 'scroll') continue
        el.setAttribute('data-bench', String(out.length))
        out.push({
          tag: el.tagName.toLowerCase(),
          cls: (el.className || '').toString().slice(0, 40),
          over: Math.round(over),
          tabindex: el.getAttribute('tabindex'),
          role: el.getAttribute('role'),
          label: el.getAttribute('aria-label'),
          outlineRule: null,
        })
        if (out.length >= 3) break
      }
      return out
    })
    console.log(`\n=== ${name}  ${url}`)
    if (!found.length) { console.log('  no horizontally scrolling code block found on this page'); await ctx.close(); continue }
    for (const [i, f] of found.entries()) {
      // focus it from the keyboard and count the pixels that change
      await p.evaluate((i) => {
        const el = document.querySelector(`[data-bench="${i}"]`)
        el.scrollIntoView({ block: 'center', behavior: 'instant' })
      }, i)
      await p.waitForTimeout(250)
      const el = p.locator(`[data-bench="${i}"]`)
      const box = await el.boundingBox()
      if (!box) { console.log(`  [${i}] no box`); continue }
      const pad = 12
      const clip = { x: Math.max(0, box.x - pad), y: Math.max(0, box.y - pad),
                     width: Math.min(1440 - Math.max(0, box.x - pad), box.width + pad * 2),
                     height: Math.min(900 - Math.max(0, box.y - pad), box.height + pad * 2) }
      let px = 'n/a', fv = false
      try {
        await el.evaluate((n) => n.focus())
        const reached = await p.evaluate((i) => document.activeElement === document.querySelector(`[data-bench="${i}"]`), i)
        if (reached) {
          fv = await p.evaluate(() => document.activeElement.matches(':focus-visible'))
          await p.waitForTimeout(120)
          const on = await p.screenshot({ clip })
          await p.evaluate(() => document.activeElement?.blur())
          await p.waitForTimeout(120)
          const off = await p.screenshot({ clip })
          px = diffCount(on, off)
        } else px = 'not focusable at all'
      } catch (e) { px = `error: ${String(e).slice(0, 60)}` }
      console.log(`  [${i}] ${f.tag}.${f.cls}`)
      console.log(`       overflow=${f.over}px  tabindex=${f.tabindex}  role=${f.role}  aria-label=${f.label}`)
      console.log(`       focused: :focus-visible=${fv}  indicator px=${px}`)
    }
  } catch (e) {
    console.log(`\n=== ${name}  ${url}\n  could not read: ${String(e).slice(0, 120)}`)
  }
  await ctx.close()
}
await b.close()
