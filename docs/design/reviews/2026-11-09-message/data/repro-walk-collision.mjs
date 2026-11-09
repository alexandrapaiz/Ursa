/* Does the tab walk's identity for an undeclared stop collide on a tall
   page? Reproduces measure-focus.mjs's walk verbatim against a fixture
   that has three scrollable <pre> blocks, each followed by a button. */
import { launch } from '/tmp/epito-ursa-frontend-BBhu7I/docs/design/review-kit/lib/browser.mjs'
import { writeFileSync } from 'node:fs'

const html = `<!doctype html><html><head><meta charset="utf-8"><style>
 * { margin:0; padding:0; box-sizing:border-box }
 body { background:#020308; color:#a8c7fa; font:13px/24px Helvetica,Arial,sans-serif;
        height:4000px; position:relative }
 /* Absolute integer tops, so scroll-into-view lands every pre at the same
    viewport y to the pixel rather than to within one. */
 .block { position:absolute; left:20px; width:240px }
 .b1 { top:1000px } .b2 { top:2000px } .b3 { top:3000px }
 pre { width:200px; height:22px; overflow-x:auto; font:12px/22px monospace; white-space:pre }
 button { display:block; width:100px; height:29px; margin-top:12px;
          background:#020308; color:#a8c7fa; border:1px solid #2a3652 }
 :focus-visible { outline:1px solid #a8c7fa; outline-offset:3px }
</style></head><body>
 ${[1, 2, 3]
   .map(
     (n) => `<div class="block b${n}">
   <pre>this-is-a-long-command-that-overflows-its-box-number-${n} --with --flags</pre>
   <button type="button">copy</button>
 </div>`,
   )
   .join('\n')}
</body></html>`
const file = '/tmp/epito-ursa-frontend-BBhu7I/.fe-run-1109/tall.html'
writeFileSync(file, html)

// --- verbatim from measure-focus.mjs -------------------------------------
const ENUMERATE = () => {
  const SEL = ['a[href]','button','input','select','textarea','summary','[contenteditable=""]','[contenteditable="true"]','[tabindex]'].join(',')
  const out = []
  let i = 0
  for (const el of document.querySelectorAll(SEL)) {
    if (el.disabled) continue
    if (el.closest('[inert]')) continue
    if (el.hasAttribute('tabindex') && Number(el.getAttribute('tabindex')) < 0) continue
    const cs = getComputedStyle(el)
    if (cs.display === 'none' || cs.visibility === 'hidden') continue
    const r = el.getBoundingClientRect()
    el.setAttribute('data-focus-probe', String(i))
    out.push({ probe: i++, tag: el.tagName.toLowerCase(), w: Math.round(r.width), h: Math.round(r.height),
      offscreen: r.bottom < 0 || r.right < 0 || r.left > innerWidth || r.top > innerHeight,
      text: (el.getAttribute('aria-label') || el.textContent || '').replace(/\s+/g,' ').trim().slice(0,40) })
  }
  return out
}
const ACTIVE = () => {
  const el = document.activeElement
  if (!el || el === document.body || el === document.documentElement) return null
  const r = el.getBoundingClientRect()
  return { probe: el.hasAttribute('data-focus-probe') ? Number(el.getAttribute('data-focus-probe')) : null,
    tag: el.tagName.toLowerCase(), box: { x: r.x, y: r.y, w: r.width, h: r.height },
    text: (el.getAttribute('aria-label') || el.textContent || '').replace(/\s+/g,' ').trim().slice(0,40) }
}
// ------------------------------------------------------------------------

const browser = await launch()
for (const [name, width, height] of [['phone',390,844],['desktop',1440,900]]) {
  const ctx = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 1 })
  const page = await ctx.newPage()
  await page.goto(`file://${file}`)
  const declared = await page.evaluate(ENUMERATE)
  await page.evaluate(() => { document.activeElement?.blur?.(); window.scrollTo(0, 0) })
  await page.keyboard.press('Tab')

  const seen = new Set()
  const reached = []
  let brokeOn = null
  for (let n = 0; n < 200; n++) {
    const act = await page.evaluate(ACTIVE)
    if (!act) { brokeOn = 'focus left the document'; break }
    const id = act.probe !== null ? `p${act.probe}` : `${act.tag}@${Math.round(act.box.x)},${Math.round(act.box.y)}`
    if (seen.has(id)) { brokeOn = `key repeated: ${id} (element text "${act.text}")`; break }
    seen.add(id)
    reached.push({ n, id, tag: act.tag, text: act.text, scrollY: await page.evaluate(() => Math.round(window.scrollY)) })
    await page.keyboard.press('Tab')
  }
  const reachedProbes = new Set(reached.filter(r => r.id.startsWith('p')).map(r => Number(r.id.slice(1))))
  const unreachable = declared.filter(d => !reachedProbes.has(d.probe))

  console.log(`\n=== ${name} ${width}x${height}`)
  console.log(`declared in DOM: ${declared.length}   tab stops reached: ${reached.length}`)
  console.log(`walk ended because: ${brokeOn}`)
  for (const r of reached) console.log(`  stop ${r.n}  ${r.id.padEnd(16)} ${r.tag.padEnd(7)} scrollY=${String(r.scrollY).padStart(5)}  "${r.text.slice(0,36)}"`)
  console.log(`unreachable: ${unreachable.length}${unreachable.length ? ' -> ' + unreachable.map(u => `${u.tag} "${u.text.slice(0,20)}"`).join(', ') : ''}`)
  await ctx.close()
}
await browser.close()
