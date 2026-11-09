// A frame of this site that two runs can compare.
//
// Six of the fifteen frames this seat photographs every run differ from
// themselves. Shot twice from one build, `home` and the 404 page differ by
// 4,921 to 19,140 pixels at the three review viewports, while every
// `/record*` frame is bit-identical. So a pixel count on the two animated
// pages was 100% noise, and the 2026-10-24e review recorded that any
// before-and-after number taken on them meant nothing. This closes that.
//
// Two things make those pages differ, and a fix that misses either one
// still produces a different frame every time:
//
//   1. The clock. PixelSky's shader takes `u_time` from the
//      requestAnimationFrame timestamp and twinkles on it, and
//      Constellation pulses Polaris on `sin(t * 1.1)`. The shutter opens
//      at whatever millisecond the page happened to reach.
//   2. The randomness. PixelSky fills a texture with one `Math.random()`
//      texel per shader pixel, so even a pinned clock draws a different
//      sky on every load. This is the half that `prefers-reduced-motion`
//      does NOT fix: the reduced path stops the loop and draws at a fixed
//      t, and its sky is still random.
//
// So: pin the rAF timestamp to one value, and replace `Math.random` with a
// seeded generator, both before any page script runs. The site is not
// touched and nothing is mocked that the site can detect through its own
// code paths; `u_motion` stays 1, so what is photographed is a real frame
// of the live animation rather than the reduced-motion rendering.
//
// The pinned instant is 2000ms, chosen under 6000 so that PixelSky's
// `Math.floor(t / 6000)` epoch stays 0 and the texture is refilled once,
// by resize, in a fixed order. Past the first callback `dt` is 0, so the
// parallax and the scroll darkening hold their initial values instead of
// easing somewhere new on each frame.
//
// Verified, not assumed: with this applied, all 15 frames are
// bit-identical across two shoots. See reviews/2026-10-24f §2.
//
// THE THIRD THING, ADDED 2026-11-02, AND WHY IT IS OFF BY DEFAULT. A page
// can also read the wall clock, and then the frame differs from itself
// because the page is telling the truth about when it was read. `now` pins
// `Date` for exactly that, and it is opt-in rather than defaulted for the
// reason L45 gives: a run that is only photographing should get the real
// page, and the instant has to be chosen by the caller because a 1970 clock
// draws a page the product never draws.
//
// `performance.now()` is deliberately left running. React's scheduler times
// its work slices off it and a frozen one is a loop with no exit, so pinning
// it would hang the page this is meant to photograph. Nothing either product
// renders is computed from it.
//
// THE FOURTH THING, ADDED 2026-11-02 (run h), AND WHY IT IS ALSO OPT-IN.
// `ursa-minor/app/globals.css` declares `html { scroll-behavior: smooth }`,
// so any scroll the browser performs on the page's behalf is an animation
// of a few hundred milliseconds. Nothing above touches it: it is not driven
// by `requestAnimationFrame` callbacks the page owns, so pinning rAF's
// timestamp does not stop it, and Playwright's `animations: 'disabled'`
// does not reach it either.
//
// That matters to any instrument that takes an element's box and then does
// something that scrolls before it opens the shutter. `measure-focus.mjs`
// does exactly that: it drives Tab, the browser scrolls the focused control
// into view, and the two frames it diffs were photographed at two different
// scroll offsets. Measured on 2026-11-02 over `/record` at 820x1180, the
// "indicator" it reported for the `mini-fixture` link was 655 pixels of
// page text that had slid, and the magnified frames show one shutter on the
// link and the other on a passage three sections away. The verdict it
// printed from that was a contrast ratio.
//
// So `scroll` pins `scroll-behavior` to `auto` for the whole document. It is
// opt-in for the same reason `now` is: a run that is only photographing a
// still should get the page the product actually ships, and an instrument
// that needs the page to hold still while it works should have to say so.
//
// **This half pins the page's clock and no other process's.** The overlay's
// dashboard prints `read at HH:MM:SS` from `readAt`, which
// `ursa-major/src/serve.ts` stamps with `new Date().toISOString()` in the
// serving process before the string ever reaches the browser. No init script
// can reach that, which is measured in reviews/2026-11-02 §3. `pin-clock.mjs`
// in this directory is the half that can.

export const PINNED_MS = 2000

/** The seed is fixed, so the sky is the same sky in every run's frames. */
export const SEED = 0x9e3779b9

/**
 * Runs inside the page, before its own scripts. Takes its arguments
 * through addInitScript rather than closing over them, because the
 * function is serialised across the process boundary.
 */
export function freezeInit({ t, seed, clock = true, random = true, now = null, scroll = false }) {
  let s = seed >>> 0
  // xorshift32. Any seeded generator would do; this one is three lines and
  // needs no dependency in a page we are only photographing.
  if (random) {
    Math.random = () => {
      s ^= s << 13
      s >>>= 0
      s ^= s >>> 17
      s ^= s << 5
      s >>>= 0
      return s / 4294967296
    }
  }
  if (clock && typeof globalThis.requestAnimationFrame === 'function') {
    const raf = globalThis.requestAnimationFrame.bind(globalThis)
    globalThis.requestAnimationFrame = (cb) => raf(() => cb(t))
  }
  if (scroll) {
    // `!important` on the universal selector, because the declaration this
    // overrides is on `html` and a later author rule on any element could
    // reintroduce it. Appended rather than written into an existing sheet,
    // so nothing the page ships is edited.
    const pin = () => {
      const el = document.createElement('style')
      el.setAttribute('data-freeze', 'scroll')
      el.textContent = '*, html, body { scroll-behavior: auto !important; }'
      ;(document.head ?? document.documentElement).appendChild(el)
    }
    // An init script can run before `documentElement` exists, so the call
    // that fails silently has to be the one that does not happen.
    if (document.documentElement) pin()
    else document.addEventListener('readystatechange', pin, { once: true })
  }
  if (now !== null) {
    const Native = globalThis.Date
    const fixed = Number(now)
    // A function and not a `class`, because `Date()` called without `new`
    // returns a string and a class constructor throws when it is. Nothing in
    // either product calls it that way today, and a shim that changes what a
    // built-in does when nobody is looking is how an instrument starts lying.
    const Pinned = function Date(...args) {
      if (!new.target) return new Native(fixed).toString()
      return args.length === 0 ? new Native(fixed) : new Native(...args)
    }
    // Statics come through the prototype chain, so `parse`, `UTC` and anything
    // a future engine adds keep working without being listed here. Only `now`
    // is answered differently.
    //
    // Sharing the prototype keeps `instanceof` true in both directions, and it
    // leaves exactly one thing behind: `Date.prototype.constructor` is still
    // the native constructor, so `d.constructor === Date` is false under the
    // pin. Nothing in either product asks that, and the alternative is writing
    // to a shared built-in's prototype, which is a larger footprint than the
    // question is worth. Said here rather than discovered later.
    Object.setPrototypeOf(Pinned, Native)
    Pinned.prototype = Native.prototype
    Pinned.now = () => fixed
    globalThis.Date = Pinned
  }
}

/**
 * Make every page in this context render the same frame twice. Call before
 * the first navigation; addInitScript applies to each one.
 */
export async function freezeContext(ctx, { t = PINNED_MS, seed = SEED, clock = true, random = true, now = null, scroll = false } = {}) {
  await ctx.addInitScript(freezeInit, { t, seed, clock, random, now, scroll })
  return ctx
}

/**
 * The randomness half on its own, for an instrument that is measuring
 * motion rather than photographing a still.
 *
 * The two halves of the freeze are not interchangeable and the 2026-10-24i
 * review is where that was found. Pinning the rAF timestamp is what makes a
 * still frame reproducible, and it is exactly wrong for a motion capture: a
 * spring driven from JavaScript reads the clock on every frame and computes
 * its next position from it, so a pinned clock does not make such a spring
 * reproducible, it stops it. `sample-motion.mjs` exists to see precisely
 * that kind of spring on third-party sites, and it would have reported
 * every one of them as motionless.
 *
 * Seeding `Math.random` carries none of that risk, because nothing times
 * itself off a random number. So a motion capture gets this half, which
 * fixes our own starfield's texture, and leaves the clock running.
 */
export async function seedRandomContext(ctx, { seed = SEED } = {}) {
  return freezeContext(ctx, { seed, clock: false, random: true })
}
