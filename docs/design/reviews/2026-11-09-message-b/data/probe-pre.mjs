// What is true of the five UNDECLARED stops, measured rather than asserted.
import { launch } from '../../../review-kit/lib/browser.mjs'

const BASE = 'http://127.0.0.1:4982'
const VPS = { phone: [390, 844], tablet: [820, 1180], desktop: [1440, 900] }

const b = await launch()
for (const [name, [w, h]] of Object.entries(VPS)) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1 })
  const p = await ctx.newPage()
  await p.goto(BASE + '/', { waitUntil: 'networkidle' })
  await p.waitForTimeout(500)
  const got = p.viewportSize()
  if (got.width !== w || got.height !== h) throw new Error(`viewport did not take: asked ${w}x${h}, got ${got.width}x${got.height}`)

  const pres = await p.evaluate(() => {
    const out = []
    document.querySelectorAll('pre.rec-cmd').forEach((el, i) => {
      el.setAttribute('data-pre', String(i))
      const cs = getComputedStyle(el)
      out.push({
        text: el.textContent.trim().slice(0, 40),
        overflow: Math.round(el.scrollWidth - el.clientWidth),
        clientWidth: Math.round(el.clientWidth),
        scrollWidth: Math.round(el.scrollWidth),
        // the ATTRIBUTE, not the property: absent means the markup never asked
        tabindexAttr: el.getAttribute('tabindex'),
        tabIndexProp: el.tabIndex,
        role: el.getAttribute('role'),
        ariaLabel: el.getAttribute('aria-label'),
        overflowX: cs.overflowX,
      })
    })
    return out
  })

  // Does Tab actually land on them?
  await p.evaluate(() => { window.scrollTo(0, 0); document.body.setAttribute('tabindex', '-1'); document.body.focus() })
  await p.keyboard.press('Tab')
  const landed = []
  for (let i = 0; i < 70; i++) {
    const hit = await p.evaluate(() => {
      const e = document.activeElement
      return e && e.tagName === 'PRE' ? e.getAttribute('data-pre') : null
    })
    if (hit !== null) landed.push(hit)
    await p.keyboard.press('Tab')
  }

  // The browser's own accessibility tree, over CDP, rather than a guess at
  // what the name-computation algorithm would produce. Chromium is the thing
  // that announces this element, so Chromium is asked.
  const cdp = await ctx.newCDPSession(p)
  await cdp.send('Accessibility.enable')
  const { root } = await cdp.send('DOM.getDocument', { depth: -1 })
  const snaps = []
  for (let i = 0; i < pres.length; i++) {
    const { nodeId } = await cdp.send('DOM.querySelector', { nodeId: root.nodeId, selector: `[data-pre="${i}"]` })
    const { nodes } = await cdp.send('Accessibility.getPartialAXTree', { nodeId, fetchRelatives: false })
    const me = nodes.find((n) => n.backendDOMNodeId !== undefined && n.role) || nodes[0]
    snaps.push(me ? { role: me.role?.value, name: me.name?.value, ignored: me.ignored } : null)
  }

  console.log(`\n=== ${name} ${w}x${h} ===`)
  console.log(`pre.rec-cmd on the page: ${pres.length}`)
  for (const [i, r] of pres.entries()) {
    console.log(`  [${i}] client=${r.clientWidth} scroll=${r.scrollWidth} overflow=${r.overflow}px  tabindex-attr=${r.tabindexAttr}  .tabIndex=${r.tabIndexProp}  role=${r.role}  aria-label=${r.ariaLabel}  overflow-x=${r.overflowX}`)
    console.log(`       text: "${r.text}"`)
    console.log(`       a11y: ${JSON.stringify(snaps[i])}`)
  }
  console.log(`  Tab landed on pre indices: [${landed.join(', ')}]`)
  await ctx.close()
}
await b.close()
