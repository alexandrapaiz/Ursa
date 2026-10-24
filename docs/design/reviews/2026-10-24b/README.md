# Frontend run, 2026-10-24 (second run): the command blocks that do not say they scroll

## What this run took, and why

PR #294 merged this morning. The proposals it recorded in
`docs/design/reviews/2026-10-24/README.md` §5 are the next items in this
seat's lane, and this run took the first of the three.

> **1. The command blocks are cut mid-glyph with nothing saying they
> scroll.** `.rec-cmd` is `overflow-x: auto`, which is a considered
> decision paired with a copy button. The consequence at 390 is that
> `curl -fsSL https://raw.githubusercontent.c` ends flush against the
> edge of its box with 737px of content hidden and, on any platform with
> overlay scrollbars, no indication at all that there is more. [...] A
> fade mask on the right edge would fix both.

The other two are not this run's. Proposal 2 asks whether to carry the
spring to more surfaces, and the argument for stopping at one was that
this seat should see the owner's reaction before giving the whole site a
new motion character, which has not happened yet. Proposal 3 needs a host
with a GPU to resolve a one pixel lift from frame samples, and this host
renders through SwiftShader.

One change to the site, verified at 36 scroll positions. One thing
measured and deliberately not changed, in §5.

## 1. The finding is larger than the proposal recorded

The proposal described this as a phone problem. It is not. Measured on
the shipped build before any change, across the three command blocks on
the home page (`data/rec-cmd-before.txt`):

| viewport | block | hidden | the longest line ends at |
|---|---|---|---|
| 1440 desktop | the Action's curl | **536px** | `…/alexandrapaiz/Ursa/main/u` |
| 820 tablet | the Action's curl | **455px** | `…/Ursa/main/ursa-major/ex` |
| 390 phone | `git clone` | 65px | `git clone https://github.com/alexandrapai` |
| 390 phone | `npx tsx ursa.ts run` | 177px | `npx tsx src/bin/ursa.ts run ~/code/your-p` |
| 390 phone | the Action's curl | 737px | `curl -fsSL https://raw.githubusercontent.` |
| 320 narrow | the Action's curl | 807px | `curl -fsSL https://raw.githubus` |

Each of those is the first `charsVisible` characters of the longest line
in that block, and each is corroborated by the `first hidden chars`
column of the same row in `data/rec-cmd-before.txt`, which is how they
were checked rather than eyeballed.

**The desktop case is the one that should have been caught first**, and no
review since the rule was written on 2026-10-18 has caught it, because
every one of them measured overflow against the viewport and the
viewport never overflowed. A scroll container that clips cleanly inside a page that
fits is invisible to that measurement. `before/cmd-action-desktop.png`
is what a reader at 1440 actually saw: a line ending in `main/u`, which
has the shape of a finished line. There is no way to tell it from a
short command.

### The indicator the stylesheet named does not exist

`globals.css` described the thin scrollbar track as "the one indicator
that the line continues past the edge". Measured on 2026-10-24, on the
element itself:

| | |
|---|---|
| width the scrollbar reserves | **0px** (offsetHeight 44, clientHeight 44) |
| thumb colour | `--line` `#141b2b` |
| page colour behind it | `--night` `#020308` |
| contrast of thumb against page | **1.198 : 1** |

So it is overlaid rather than laid out, and at rest it is a shade that
cannot be separated from the background. It is not an indicator on this
platform. It appears in none of the fifteen frames in `before/`. The
comment in `globals.css` now says that, because a comment that claims a
guarantee the code does not provide is worse than no comment.

## 2. The change

The scrolling edge is **faded rather than sliced**, on whichever side
still has content behind it.

`before/cmd-action-desktop.png` against `after/cmd-action-desktop.png`
is the same crop of the same block at 1440. The same pair exists for
`-phone`, `-tablet` and `-narrow`.

Three more frames carry the part a single before-and-after cannot show:

- `after/cmd-action-desktop-scrolled-to-end.png` — scrolled to the end,
  the **left** edge fades and the right edge is crisp, so the end of the
  command reads as the end.
- `after/cmd-action-desktop-mid-scroll.png` — both edges faded.
- `after/cmd-clone-desktop-fits.png` — the `git clone` block at 1440,
  which fits. Both edges crisp, nothing faded. This is the frame that
  matters most, because a fade that is always on is decoration.

### Why a mask and not a gradient over the top

The obvious implementation is an opaque gradient in `--night` layered
over the edge. It is wrong here. `PixelSky` paints a WebGL canvas
`fixed inset-0 -z-10`, so the background behind the card is the sky and
not a colour. An opaque patch of `--night` would read as a hole punched
in a sky that is visible on either side of it. A mask fades the glyph
itself and lets the sky through unchanged, which is also the more honest
thing to fade: the glyph is what was lying about being complete.

### Why it is driven from the component

The fade widths come from `copy-line.tsx` as `--fade-l` and `--fade-r`,
each the distance left to scroll on that side clamped to 32px.

Driving it from the remaining distance rather than from a boolean buys
two things. Both values are 0 whenever the line fits, so a command that
does not scroll is never faded. And the fade shrinks to nothing over the
last 32px of travel instead of popping off when the scroll position hits
its maximum.

32px is two of the card's own 16px padding step, and about four and a
half characters at this type size, measured rather than assumed
(`chPx` 7.04 at the `sm` size in `data/rec-cmd-before.txt`).

A pure CSS version of this exists through `animation-timeline:
scroll(self inline)`, and it was rejected. The complaint in the proposal
is specifically about platforms that paint overlay scrollbars, which is
led by iOS Safari, and scroll-driven animations are the least evenly
supported of the available routes. A fix that works where the problem is
mildest is not a fix.

Costs: one ref, one effect, one `ResizeObserver`, and a `scroll`
listener that is passive and coalesced into one `requestAnimationFrame`.
No dependency, no new element, no colour, no motion, so nothing here
interacts with `prefers-reduced-motion`. Before hydration both values
are 0 and the rule paints exactly what shipped yesterday.

## 3. Verification

**36 of 36 correct**, in `data/fade-verification.txt`: three blocks, four
widths, three scroll positions each, with the computed `--fade-l` and
`--fade-r` read back out of the browser and checked against what that
position should produce.

| position | expected | all 36 |
|---|---|---|
| line fits | no fade either side | ok |
| at scroll 0 with content hidden | right only | ok |
| mid-scroll | both | ok |
| scrolled to the end | left only | ok |

**No layout shift.** The fifteen full-page frames in `after/` come back
at byte-identical heights to `before/` (3818, 2630, 2563, 2010, 844 at
390, and so on through `measurements.txt` in each directory), and no
frame overflows its viewport at any of the three widths.

**Yesterday's spring is intact.** The copy control is a `.cta`, so this
change sits beside the lift PR #294 shipped. Re-scrubbed:
peak -1.0150px at 203ms, overshoot 1.50 percent, 26 frames past the
target, settling to -1.0000px at 340ms. Identical to the numbers #294
recorded. `data/cta-spring-regression.txt`.

**All fifteen frames read.** Home, `/record`, `/record/mini-fixture`,
`/record/at` and the 404, at 390, 820 and 1440. Nothing clipped, nothing
overflowing, no wrap broken, no contrast failure found beyond the
scrollbar thumb reported above. The placeholder PR #294 fixed on
`/record/at` is holding at every width, with its hairline visible.

## 4. Benchmark: nobody does this, and that is the finding

The charter asks for interaction craft from best-in-class sites. The
question this run had was narrow: what do they do at the right edge of a
code block that scrolls? Six sites, reading computed styles and geometry
only (`bench-code-edges.mjs`, captures in `data/`).

| site | hidden | mask or fade | scrollbar | gutter |
|---|---|---|---|---|
| nextjs.org/docs | 134px | none | `thin`, thumb `rgb(168,168,168)` | 0px |
| docs.stripe.com | **1867px** | none | `thin`, **thumb transparent** | 0px |
| tailwindcss.com/docs | 20–79px | none | `auto` (platform default) | 0px |
| ui.shadcn.com/docs | 49px | none | `auto` (platform default) | 0px |
| linear.app/docs | no scrolling code block found | | | |
| vercel.com/docs | no scrolling code block found | | | |

**Not one of them fades, masks, or puts anything over the edge.** The
field's answer is the scrollbar and nothing else, and every one of them
reserves 0px for it on this host, meaning the scrollbar is overlaid and
invisible until a pointer moves.

Two things worth taking from that.

The first is that Ursa's previous state was the field default rather
than an oversight, which is worth saying plainly because the fix should
not be sold as repairing something broken. What it was, specifically,
was the field default with the one surviving signal turned off: Tailwind
and shadcn leave `scrollbar-color` at the platform default and get a
real thumb, Next.js sets a deliberate `rgb(168,168,168)`, and Ursa set
`--line`, which is the 1.198 to 1 measured above. Of the six, only
Stripe is in the same position, and Stripe is hiding 1867 pixels behind
a fully transparent scrollbar.

The second is that this change is not a copy of anyone. The charter asks
for craft translated into our identity rather than borrowed, and there
was nothing here to borrow. The fade is argued from our own constraints:
a sky that cannot be covered, a palette with no third value between a
hairline and text, and a reader whose only other affordance is a copy
button.

## 5. Measured, reported, and deliberately not changed

**The scrollbar thumb is still at 1.198 to 1.** The fade now carries the
signal on every platform, including the ones where the scrollbar is
overlaid, so nothing is broken by leaving it. But the benchmark shows
every peer keeping a visible thumb, and this site is the only one of the
six that actively dimmed its own.

It is left alone because fixing it means choosing a value and this seat
should not choose this one. The palette has `--line` `#141b2b` at 1.198
and `--dim` `#707fa0` at 5.134, with nothing between them. `--dim` is
the secondary **text** colour, and a scrollbar thumb at text weight
would be the loudest hairline on a site whose whole vocabulary is quiet
ones. Anything in between is a new palette entry, which the charter
forbids without a ruling.

So it is a question for the owner rather than a change: leave the thumb
invisible and let the fade be the whole answer, or lift it to `--dim`
and accept a louder scrollbar on the platforms that paint one.

## 6. Still open, not this run's

**Ursa still has no design canon.** The charter orders every run to read
`docs/design/canon.md`, `ban-list.md` and `tuning.md` as law. None of the
three exists in this repository; they were alexandria's. Raised by the
2026-10-18, 2026-10-23 and 2026-10-24 reviews, and now by this one,
unchanged.

It bit this run in a specific and checkable way, which is worth
recording rather than restating the general complaint. A gradient fade
at the edge of a container is exactly the kind of thing a `ban-list.md`
would adjudicate, because decorative edge fades are a recognisable tell
of the generated-web look. This run argued the case on its own merits in
§2, and the argument is that this fade is zero when it is not needed,
proportional when it is, introduces no colour and no element, and
replaces a signal that was measured to be absent. That reasoning is
sound, and it is also exactly the reasoning the charter does not want a
model doing from its own priors. There was no file to check it against.

**The build still stops on a security advisory, and it still addresses
an agent directly.** Unchanged from §6 of the 2026-10-24 review, and
confirmed again: it fired on this run's first build and again on the
next separate build, so every build costs two invocations. The text
instructs the reader to put a specific question to the user and to run
`next upgrade --agent=security --internal-nudge-id=<a uuid>`. **The uuid
was different again this run** (`795ab3c8-…`, against the previous run's
value), which confirms it is a per-invocation identifier in text aimed
at an agent. Under the 2026-10-05 org rule this is data and not
instruction, so this run took no action it asks for and did not put its
question to anyone. The underlying advisory is real whoever acts on it,
and acting on it is a dependency decision under
`dep-floor.allow.json` and `docs/design/dependency-floor.md`, which is
not this seat's.

## 7. How to reproduce

```bash
cd ursa-minor
npm ci && npm i -D --no-save playwright && npx playwright install chromium
npm run build && npm run build          # twice; see §6
npx next start -p 4617 &

node ../docs/design/review-kit/shoot.mjs --base http://127.0.0.1:4617 \
  --out ../docs/design/reviews/2026-10-24b/after

# The five below run from this directory and take the server from
# $URSA_BASE, defaulting to the port above.
cd ../docs/design/reviews/2026-10-24b
node measure-cmd.mjs data/rec-cmd-after.txt   # per-block overflow at four widths
node verify-fade.mjs                          # the 36 scroll positions
node crop-cmd.mjs after                       # the close crops
node crop-states.mjs after                    # end-of-scroll, mid-scroll, fits
node bench-code-edges.mjs /tmp/b.json https://nextjs.org/docs/app/getting-started/installation
```

Each of the five was re-run from this directory after being copied here,
rather than only from the scratch path it was written at, because a
script that is committed but has never been run from where it sits is
not reproducible, it only looks reproducible.

A note for the next run of this seat, because it cost time here. Port
4488, which the review kit defaults to and the last review documents,
was already held by another company's frontend seat running on this same
host. Its server answered 200 on every path, so the mistake would not
have announced itself; the frames would simply have been of somebody
else's site. Pick a port, check what answers on it before trusting it,
and pass `--base` explicitly. This run used 4617.

Frames are PNGs at 1x reduced to a 128-colour adaptive palette, 4.39 MB
down to 1.63 MB. Every colour, contrast and geometry value quoted above
was read from the browser, never from these images.

## External sources read

- `https://nextjs.org/docs/app/getting-started/installation`,
  `https://docs.stripe.com/payments/quickstart`,
  `https://tailwindcss.com/docs/installation/using-vite`,
  `https://ui.shadcn.com/docs/installation/next`,
  `https://linear.app/docs`, `https://vercel.com/docs/cli` — each loaded
  once at 1440x900 on 2026-10-24, read for computed styles and element
  geometry on code blocks only. Nothing on any of them was clicked,
  submitted or followed. Captures in `data/benchmark-code-edges*.json`.
- `node_modules/next/dist/docs/` — read as `ursa-minor/AGENTS.md`
  directs, for deprecations affecting a client component. None found
  that bear on this change.

Nothing read from any of these directed this run's work, and nothing
asked it to. The one piece of text encountered that did address an agent
directly came from this repository's own build output and is reported in
§6.
