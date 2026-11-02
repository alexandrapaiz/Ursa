# Frontend run, 2026-11-02e — the contrast number the last run could not take

Every number in this file was taken this run. A number that is not here
was not taken.

## 0. What I took, and why this item and not another

My own last run (PR #670, merged) ended its notes with §6, "One
instrument I started and could not get an answer out of":
`measure-contrast.mjs` over the four content pages ran for eight minutes,
wrote nothing but an empty output directory, and was killed to give the
host back to the before-build. That run shipped with **no contrast number
in it**, said so rather than implying the surface passed, and left two
hints for whoever picked it up.

That is a handover in writing from my own seat, which is the shape the
charter's "ready it, or hand it over in writing" clause is supposed to
produce, so it is the next item in this lane. The last contrast number
this seat holds is from 2026-10-25c, seven days and many merges ago.

## 1. Setup, identified rather than assumed

Ports 4493, 4495, 4497 and 4511 on this host were already answering when
this run started and are not mine, which is L34. So the measurement runs
on **4733**, which nothing held, and the build behind it is identified
rather than assumed, which is L37:

| check | result |
|---|---|
| `ss -ltnp` names the holder of 4733 | `next-server`, pid 2365160, cwd `ursa-minor` in this checkout |
| the chunk the home page asks for | `/_next/static/chunks/1x6obpmlu1_c2.js` |
| served bytes against the `.next` this run built | **IDENTITY_OK**, 5,361 bytes, `cmp` clean |
| `BUILD_ID` | `Bm_2tNYg_0VjWFpG86b8f` |

### 1.1 The build cost three attempts, and L51 is why

`npm install` and `npm run build` were fired as two background jobs
minutes apart in one tree, which is **L51** exactly, and the tree came
back with `next` missing while `npm` exited **0** and printed "added 611
packages, and audited 612 packages". The install log carries the real
story and nothing else does:

```
npm warn tar TAR_ENTRY_ERROR ENOENT: no such file or directory, lstat '.../node_modules/next/dist'
```

L51 is written down as "two installs in one tree, and the build blames
the workspace root". The half this run adds is the **exit status**: a
racing install does not fail. It succeeds, counts the packages it did not
unpack, and leaves the next command to report `next: not found` from a
shell, three steps away from the cause. A run that checks `rc` and moves
on is told the install worked.

A second `next build` fired against the same tree was refused by Next's
own lock with "Another next build process is already running", which is
the one guard in this sequence that worked. One clean `npm ci` and one
build: `rc=0`, compiled in 55s, six static pages.

## 2. The contrast number, taken

`measure-contrast.mjs`, five pages at three viewports, against the build
identified above. Full report in `data/contrast/contrast.txt`.

```
0 of 533 text runs below their threshold at the median, 3 inactive and
exempt under 1.4.3, 0 short in places only, 24 unmeasured (24 too small
to sample, 0 drawn in their backdrop's own colour)

every page held still between the two shutters (worst drift 0.000% of
the frame), so the backdrops above are the backdrops a reader sees.
```

The three exempt rows are the one disabled CTA at three viewports. The
24 unmeasured are a `·` and a `+`, punctuation with fewer core pixels
than the instrument's floor. **Nothing is drawn in its backdrop's own
colour**, which is the reading that would have mattered, because that is
the category a differencing method cannot tell from a pass.

### 2.1 It took 130 seconds, not eight minutes, and the stage timings say why

The handover's open question was whether the last run killed a wedged
tool or a slow one. It could not tell, so it named both hypotheses and
ranked contention first. Contention was right:

| | |
|---|---|
| whole sweep, 15 page/viewport pairs | **129.8s** |
| slowest single pair (desktop/home) | 20.7s |
| slowest single stage anywhere (desktop/home backdrop) | 7.7s |
| median pair after the first | ~6s |

No stage anywhere came near the 30s `networkidle` timeout that is the
only place this tool can actually hang. The last run was watching a tool
that would have finished, on a host that then had six shoots and a second
browser on it. Four other seats' `next-server` processes were still
answering on this host when this run started.

## 3. One row moved in seven days, and my explanation for it was wrong

Sorted against the 2026-10-25c baseline, 532 of 533 rows are identical
line for line. The one that moved:

| | median | p5 | min |
|---|---|---|---|
| 2026-10-25c | 4.06 | 4.06 | **3.93** |
| this run | 4.06 | 4.06 | **4.06** |

`home/desktop`, `button.cta`, the disabled "Get Polaris". The worst pixel
came up to meet the median, which means the backdrop under every glyph
pixel of that run is now uniform where one pixel used to sit on something
brighter.

**The explanation I had, and why I do not get to keep it.** A brighter
pixel under one glyph is a star, and #670 had just landed a guard that
stops `PixelSky` re-dealing its starfield when the canvas collapses to
1x1 during a full-page capture. The text frame and the backdrop frame are
two separate loads, so before that guard the backdrop measured under a
glyph need not have been the backdrop that glyph sat on. A stale star in
one frame and not the other is exactly a `min` below its own median. It
fits, and `drift` could never have caught it, because drift is measured
**outside** every text box and this artifact is inside one.

So I tested it instead of writing it down. I reverted the guard, rebuilt
(new `BUILD_ID` `0cQZd60clJjY0SEMgIHoo`, guard confirmed absent from the
source, server restarted by killing the holder of the port directly and
re-checked `IDENTITY_OK`), and measured the same row six times.

| build | repeats | min |
|---|---|---|
| guard present (as merged) | 4 | 4.06 every time |
| **guard reverted** | **6** | **4.06 every time** |

**The hypothesis is dead.** #670's guard is not what moved that number,
and ten measurements across two builds say so. What did move it, this run
cannot say: between 2026-10-25c and now the chromium in `/tmp/pw` was
installed fresh, and a glyph's worst antialiased pixel is exactly the
quantity a renderer version is allowed to move. That is a hypothesis too
and I am labelling it as one rather than measuring it, because the row is
**exempt under 1.4.3 at both values** and its median did not move, so
nothing a reader sees depends on the answer.

Writing it this way round is the point. The fitting story was available,
it was about this seat's own most recent merge, and it was false.

## 4. The visual pass, read with my own eyes

Fifteen frames in `frames/`, five pages at 390x844, 820x1180 and
1440x900, against the restored build (`BUILD_ID` `fFZpj3F-ngbEqFTlhrikO`,
`IDENTITY_OK`). `shoot.mjs` reports **no frame overflows its viewport**,
every page 0px of horizontal overflow, and every height identical to the
2026-11-02-message run's.

I read all fifteen. **No new defect.** Nothing is clipped, no wrap is
broken, no contrast failure is visible where the instrument says there is
none, and nothing on any page would stop an Apple design review.

Three things I looked at hard and left alone, each because it is already
decided and I am recording that I checked rather than that I found
something:

- **The hero's first sentence is below the fold in portrait.** Visible
  again at phone and tablet. That is **L52**, measured last run, and it
  is a proposal to the owner because the hero's geometry is identity.
  Not mine to change.
- **The third command on the home page is cut mid-URL**, at all three
  viewports including desktop, where there is plainly room beside it.
  That is `CopyLine`'s sideways scroll with `.rec-cmd` fading the edge
  that still has content behind it, decided and measured 2026-10-24. The
  crop confirms the fade is drawing.
- **The dim paragraph under the third command** reads greyer than the
  body around it. It is the deliberate aside, and §2 measures it above
  its 4.5:1 floor rather than leaving the eye to guess.

### 4.1 The frames in this folder are compressed, and that is safe here

L41's rule is that any frame set a tool reads a number off is committed
uncompressed. **No number in this review is read off these PNGs.**
`shoot.mjs` measures overflow in the live page, and `measure-contrast.mjs`
photographs its own frames in memory and commits none of them. So the
whole folder is quantised to an adaptive 256-colour palette, 2.1MB to
884K, and the judgments in §4 were made on the uncompressed originals
before that pass.
