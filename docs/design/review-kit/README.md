# The review kit

Tools this seat uses every run, kept here instead of in a dated review
directory, because three of the four runs before 2026-10-24 rewrote the
same scripts from scratch.

Nothing in here is a dependency of either site. `playwright` is installed
without saving and the kit finds it in whichever sibling package has it:

```bash
cd ursa-minor && npm i -D --no-save playwright && npx playwright install chromium
```

| file | what it does |
|---|---|
| `lib/browser.mjs` | Launches chromium. On a host with no root it fetches the shared libraries chromium needs with `apt-get download` and `dpkg-deb -x`, which need no privilege, and retries. |
| `shoot.mjs` | Full-page PNGs at 1x across the page by viewport matrix, measuring horizontal overflow on each and naming the widest element when a frame overflows. |
| `hover.mjs` | Hovers an element and scrubs its transition to an exact millisecond, or `--curve` to sweep the whole thing. Host-independent, which is the point. |
| `sample-motion.mjs` | Captures a hover three ways: a frame series, the inline style writes a library makes, and the browser's own animation engine. |
| `fit-motion.mjs` | Characterises a capture. Fits start time and duration as free parameters, names the curve, and says `UNRESOLVED` rather than guessing when the capture is too sparse. |
| `read-spring.mjs` | Reads a spring out of a `linear()` easing: overshoot, damping ratio, frequency, stiffness. |
| `make-spring.mjs` | Writes a spring into a `linear()` easing, which is how a spring ships in CSS with no library. |

## Three things to know before you trust a number out of this

**Calibrate first.** Point `sample-motion.mjs` and `fit-motion.mjs` at
something whose answer you already know. `.rec-action` in
`ursa-minor/app/globals.css` declares 160ms on
`cubic-bezier(0.25, 0.46, 0.45, 0.94)`, and the kit reads it back as
out-quad over 152 to 164ms. If it does not, fix the kit before believing
it about anything else.

**Reading computed style every frame changes what you are measuring.** It
forces a style recalculation per frame, which on a heavy page halves the
frame rate and makes every motion look slower than it is. Use
`--writes-only` when the page is busy, and check `cadenceMs` in the
output before believing a fit.

**A frame rate measured in a sandbox is a fact about the sandbox.** With
no GPU, chromium falls back to SwiftShader and rasterises on the CPU, and
anything with a WebGL layer collapses. `sample-motion.mjs` records the
renderer for exactly this reason. Scrub with `hover.mjs` when you need a
number that two machines can compare.

The run that built this is `docs/design/reviews/2026-10-24/`.
