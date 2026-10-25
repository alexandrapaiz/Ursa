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
| `shoot.mjs` | Full-page PNGs at 1x across the page by viewport matrix, measuring horizontal overflow on each and naming the widest element when a frame overflows. Frames are frozen by default; `--live` lets the sky animate. `--wait <ms>` sets the settle and `--until <selector>` gates the shutter on content, which any page that fetches after hydration needs. |
| `measure-hit-areas.mjs` | The real tappable area of every control, probed outward one CSS pixel at a time so an `::after` overlay is seen rather than parsed. Promoted here on 2026-10-24g from `reviews/2026-10-24e/`, where it was written; `--base`, `--pages name=/path,…`, `--out`, `--json`, `--until`. |
| `lib/freeze.mjs` | Pins the animation clock and seeds `Math.random` before any page script runs, so the starfield draws the same sky twice. Without it 6 of the 15 review frames differ from themselves by up to 19,140 pixels. |
| `diff-frames.py` | Counts the pixels that differ between two frame sets, per frame, with the row and column range. Only meaningful on frozen frames. |
| `crop.mjs` | Magnifies a named region of a frame, so a 6px bar or a 2px foot can actually be judged. `--in`, `--out`, `--box x,y,w,h`, `--scale`. Written in `reviews/2026-10-24g/`, promoted here on 2026-10-24h, where a second run wanted it. |
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

**A pixel count from a `--live` frame is a fact about the starfield.** Two
`--live` shoots of one build differ by 4,921 to 19,140 pixels on the home
page and the 404 page, and by 0 on every `/record*` frame. Four reviews
reported frame differences before anyone established that floor. The
freeze is on by default now, and `measurements.txt` says in its first line
which mode produced the set.

**A fixed settle is a race on any page that fetches its own data.** The
dashboard in `ursa-major/overlay/` photographed its own loading state at
the 400ms default, and at 1500ms two viewports of three were right and
the third was still racing. Use `--until` with a selector that only
exists once the data has landed. `measure-hit-areas.mjs` failed the same
way and worse: it reported `0 targets seen` instead of erroring.

**`next dev` and `next start` are not interchangeable for this.** On the
2026-10-24 host the overlay's client components never hydrated under the
dev server, with a failed HMR handshake and no error on the page, so
every frame of that app has to come from `next build && next start`.

**A frame rate measured in a sandbox is a fact about the sandbox.** With
no GPU, chromium falls back to SwiftShader and rasterises on the CPU, and
anything with a WebGL layer collapses. `sample-motion.mjs` records the
renderer for exactly this reason. Scrub with `hover.mjs` when you need a
number that two machines can compare.

**A file you write outside your checkout goes to a path you invented.**
Not to a path that describes its contents. On 2026-10-24g this seat wrote
a pull request body to `/tmp/prbody.md`, another seat on the same host
wrote its own body to the same path, and for about ninety seconds this
seat's pull request published another seat's prose. Twenty or so seats
share one unix user and one `/tmp` here. A parse that succeeds is no
evidence of authorship, so nothing at the read can catch it. Write to
`/tmp/<seat>-<date>-<trigger>/` and nothing else, and that includes
scratch files, server logs and anything handed to `--body-file`.

The run that built this is `docs/design/reviews/2026-10-24/`.
