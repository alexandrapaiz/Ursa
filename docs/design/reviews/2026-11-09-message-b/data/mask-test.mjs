// Is the mask what eats the ring? Focus the same element three ways and
// count the pixels that change, which is how measure-focus.mjs defines the
// indicator: photograph focused, blur, photograph the identical rectangle.
import { launch } from '../../../review-kit/lib/browser.mjs'
import { freezeContext } from '../../../review-kit/lib/freeze.mjs'
import { PNG } from 'pngjs'

const BASE = 'http://127.0.0.1:4982'

function diffCount(a, b) {
  const A = PNG.sync.read(a), B = PNG.sync.read(b)
  if (A.width !== B.width || A.height !== B.height) throw new Error('frame size changed')
  let n = 0
  for (let i = 0; i < A.data.length; i += 4) {
    if (A.data[i] !== B.data[i] || A.data[i+1] !== B.data[i+1] || A.data[i+2] !== B.data[i+2]) n++
  }
  return n
}

const b = await launch()
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 })
await freezeContext(ctx, { scroll: true })
const p = await ctx.newPage()
await p.goto(BASE + '/', { waitUntil: 'networkidle' })
await p.waitForTimeout(500)

// Each case is a stylesheet plus an optional DOM change, applied to the
// shipped page. The pad is per case because an outline on a parent sits
// further out than one on the element, and a crop that cuts the ring off
// reports zero for the same reason a real absence does.
const CASES = [
  ['as shipped', '', null, 8],
  ['mask removed', 'pre.rec-cmd { mask-image: none !important; -webkit-mask-image: none !important; }', null, 8],
  ['ring on the whole card', '.flex.flex-col:has(> pre.rec-cmd:focus-visible) { outline: 1px solid var(--polar); outline-offset: 3px; }', null, 28],
  ['ring on a tight unmasked wrapper', '.rec-cmd-frame:has(> pre.rec-cmd:focus-visible) { outline: 1px solid var(--polar); outline-offset: 3px; }', 'wrap', 12],
]

for (const [name, css, dom, pad] of CASES) {
  await p.reload({ waitUntil: 'networkidle' })
  await p.waitForTimeout(500)
  await p.evaluate((css) => {
    if (!css) return
    const s = document.createElement('style'); s.id = '__t'; s.textContent = css
    document.head.appendChild(s)
  }, css)
  if (dom === 'wrap') {
    await p.evaluate(() => {
      for (const el of document.querySelectorAll('pre.rec-cmd')) {
        const f = document.createElement('div')
        f.className = 'rec-cmd-frame w-full min-w-0 sm:flex-1'
        el.parentNode.insertBefore(f, el)
        f.appendChild(el)
      }
    })
    await p.waitForTimeout(150)
  }

  // first pre on the page, declared so Tab can be driven onto it
  await p.evaluate(() => {
    const el = document.querySelectorAll('pre.rec-cmd')[0]
    el.setAttribute('tabindex', '0'); el.id = '__pre'
    el.scrollIntoView({ block: 'center', behavior: 'instant' })
  })
  await p.waitForTimeout(120)
  const box = await p.locator('#__pre').boundingBox()
  const clip = { x: Math.max(0, box.x - pad), y: Math.max(0, box.y - pad), width: box.width + pad*2, height: box.height + pad*2 }

  await p.locator('#__pre').evaluate((n) => n.focus())
  // keyboard focus, so :focus-visible applies
  await p.keyboard.press('Shift+Tab'); await p.keyboard.press('Tab')
  const okFocus = await p.evaluate(() => document.activeElement?.id === '__pre' && document.activeElement.matches(':focus-visible'))
  await p.waitForTimeout(80)
  const on = await p.screenshot({ clip })
  await p.evaluate(() => document.activeElement?.blur())
  await p.waitForTimeout(80)
  const off = await p.screenshot({ clip })

  console.log(`${name.padEnd(30)} focus-visible=${okFocus}  indicator px=${diffCount(on, off)}`)
}
await ctx.close(); await b.close()
