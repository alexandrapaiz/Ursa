// Photograph the 404's control at the moments that decide this change,
// cropped tight and rendered at 3x.
//
//   node crop-lift.mjs <before|after>
//
// 3x rather than the 1x the charter asks for on full-page frames, and the
// reason is the whole difficulty of reviewing this change: the travel is ONE
// pixel. At 1x a crop of the lifted state is indistinguishable from a crop of
// the resting state, so a 1x "after" frame would be evidence of nothing. The
// crops are a few hundred pixels on a side, so the repo stays light anyway.
//
// The transition is scrubbed to an exact millisecond rather than raced with a
// timer, so these frames reproduce on a host with a different frame clock.
// 203ms is where the spring peaks. That number was measured, not chosen.

import { launch } from '../../review-kit/lib/browser.mjs'
import { mkdirSync } from 'node:fs'

const WHICH = process.argv[2] || 'after'
const BASE = process.env.URSA_BASE || 'http://127.0.0.1:4931'
const DIR = `${import.meta.dirname}/${WHICH}`
mkdirSync(DIR, { recursive: true })

const PAD = 10 // breathing room around the box, in CSS px

const browser = await launch()
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 3 })
const page = await ctx.newPage()

async function shoot(url, sel, name, { hover = false, at = null, press = false } = {}) {
  await page.goto(url, { waitUntil: 'networkidle' })
  await page.waitForTimeout(500)
  const el = (await page.$$(sel))[0]
  if (!el) throw new Error(`no ${sel} at ${url}`)
  await el.scrollIntoViewIfNeeded()
  await page.mouse.move(5, 5)
  await page.waitForTimeout(150)

  // the clip is taken from the RESTING box, so every frame in the set is the
  // same rectangle and a 1px move is a move inside the frame rather than a
  // move of the frame
  const b = await el.boundingBox()
  const clip = { x: b.x - PAD, y: b.y - PAD, width: b.width + PAD * 2, height: b.height + PAD * 2 }

  if (hover || press) await el.hover()
  if (press) { await page.mouse.down(); await page.waitForTimeout(150) }
  if (at != null) {
    await page.waitForTimeout(16)
    await el.evaluate((e, ms) => {
      for (const a of e.getAnimations()) {
        if (a.transitionProperty && a.transitionProperty !== 'transform') continue
        a.pause(); a.currentTime = ms
      }
    }, at)
  } else if (hover) {
    await page.waitForTimeout(700) // settled
  }

  const ty = await el.evaluate((e) => {
    const t = getComputedStyle(e).transform
    return t === 'none' ? 0 : Math.round(new DOMMatrixReadOnly(t).m42 * 10000) / 10000
  })
  await page.screenshot({ path: `${DIR}/${name}.png`, clip, scale: 'css' })
  if (press) await page.mouse.up()
  console.log(`${name.padEnd(34)} translateY ${String(ty).padStart(9)}px   ${clip.width}x${clip.height} @3x`)
}

const Q = BASE + '/this-page-does-not-exist'
await shoot(Q, '.quiet-link', 'lift-404-rest')
await shoot(Q, '.quiet-link', 'lift-404-hover-peak', { hover: true, at: 203 })
await shoot(Q, '.quiet-link', 'lift-404-hover-settled', { hover: true })
await shoot(Q, '.quiet-link', 'lift-404-pressed', { press: true })

// the control it was matched to, in the same two states, at the same scale,
// so the claim "these now move the same" can be checked by eye and not only
// in the numbers
const R = BASE + '/record'
await shoot(R, '.cta', 'lift-cta-rest')
await shoot(R, '.cta', 'lift-cta-hover-peak', { hover: true, at: 203 })

await browser.close()
