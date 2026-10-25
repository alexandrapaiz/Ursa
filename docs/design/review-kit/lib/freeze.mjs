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

export const PINNED_MS = 2000

/** The seed is fixed, so the sky is the same sky in every run's frames. */
export const SEED = 0x9e3779b9

/**
 * Runs inside the page, before its own scripts. Takes its arguments
 * through addInitScript rather than closing over them, because the
 * function is serialised across the process boundary.
 */
export function freezeInit({ t, seed, clock = true, random = true }) {
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
  if (clock) {
    const raf = window.requestAnimationFrame.bind(window)
    window.requestAnimationFrame = (cb) => raf(() => cb(t))
  }
}

/**
 * Make every page in this context render the same frame twice. Call before
 * the first navigation; addInitScript applies to each one.
 */
export async function freezeContext(ctx, { t = PINNED_MS, seed = SEED, clock = true, random = true } = {}) {
  await ctx.addInitScript(freezeInit, { t, seed, clock, random })
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
