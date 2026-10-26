# Visual review, 2026-10-26b (message run)

**What this run took.** The board carried no frontend item in Backlog,
This sprint or In progress, so the next item in this lane came from the
lane's own record: L25, written by the run that merged this morning as
#457. That entry found a panel that was cut off on the left and
overflowing on the right at the same time below 380px, said why six
reviews of that surface could not have seen it, and left the general
case open. The general case is this run.

The charter fixes three review viewports and the narrowest is 390. So a
defect that only exists below 390 was invisible to every instrument this
seat owns, in both senses: nothing could count it and nothing could
photograph it. Both halves are closed here, and `ursa-minor` is measured
below 390 for the first time.

| | before | after |
|---|---|---|
| `ursa-minor` below 390 | never measured, never photographed | 0 of 20 cells put content out of reach, at 320, 360, 375 and 390 |
| the narrow instrument | a 23-line probe in one review's `data/`, two surfaces | `review-kit/measure-narrow.mjs`, six exemptions, calibrated |
| `shoot.mjs` | three viewports, no way to ask for a fourth | `--viewports name=WxH,…` |
| the legend's name and figures | share a row, so a wrapped name reads as a row of its own | own rows below 640; all four names fit on one line at 320 |
| two consecutive sweeps | disagreed about the home page | byte-identical |

---

## 1. What the measurement says

`measure-narrow.mjs` at 320, 360, 375 and 390, on the shipped build of
both products. `data/narrow-minor-after.txt` and
`data/narrow-overlay-calibration.txt`.

```
  0 of 20 page-by-width cells put content out of reach; 0 overflow
  reachably; 8 carry decoration that bleeds on purpose and is not counted.
```

Nothing on either product goes out of reach at any of the four widths.
The eight cells carrying bleed are the sky, which is covered in §3.

**It is calibrated, because a number out of a new tool is worth
nothing until it reproduces one somebody already wrote down.** The kit
README asks for this and L25 supplies the answer: the overlay's panel at
320, 360 and 375 after this morning's fix, and 380 at left 5 at 390.
This instrument reads back exactly those four, on a surface it was not
written against.

**It is reproducible.** `data/narrow-minor-after.txt` and
`data/narrow-minor-repeat.txt` are two separate runs and they are
byte-identical. That is not free, and §4 is what it cost.

## 2. A sweep like this is almost entirely exemptions

This is the part worth more than the result, and it is the reason the
instrument belongs in the kit rather than in this folder.

Six things have to be exempted before a narrow sweep says anything true.
One of them was obvious. The other five were each found by the
instrument being wrong first, and four of the five were found on other
people's markup rather than on ours.

**The obvious one.** A scroll container owns its children's width.
`.rec-cmd` is `white-space: pre` with `overflow-x: auto` on purpose, with
eleven lines of comment in `globals.css` explaining that a command must
break where the command breaks. Its content is wider than the viewport
at every width and that is correct.

**2.1 A full-bleed decorative layer is not clipped content.** The first
version of the instrument reported content out of reach on 8 of 20 cells,
at every width including 390, and all eight were the same element.
`PixelSky`'s canvas is `position: fixed; inset: 0` under
`transform: matrix(1.05, …)`, a deliberate five percent overscan.
Measured in `data/probe-canvas.mjs` rather than read off the stylesheet:
a 320px viewport gets a 336px canvas at left -8, and 390 gets 409.5 at
-9.75, which is the scale arithmetic exactly. The sky bleeds past the
viewport on purpose and the reader loses nothing.

A count that includes it could never have reached zero, which is the one
thing L19 says a measurement must not do. The gate is mechanical rather
than a list of selectors to ignore: an element is decoration if it cannot
be pressed, contains no text, and contains nothing focusable. The box
L25 was actually about was `main`, which fails all three.

**2.2 Text hidden for a screen reader is hidden on purpose.** Found by
pointing the instrument at the five sites L5 names. Stripe and Consensus
both came back "4 of 4 cells put content out of reach", and on every one
of the eight the offender was `p#__next-route-announcer__` or
`div.sr-only`, clipped by exactly 1px. An instrument that calls those a
defect reports every Next.js site on the web as broken. The gate is the
geometry rather than the class name, because `sr-only`,
`visually-hidden` and `screen-reader-text` are three spellings of one
idea and the next site has a fourth: 2px or less in both dimensions is a
box nothing legible fits in. A hairline rule is 1px in one dimension and
hundreds in the other, so it does not match.

**2.3 "Past the right edge" is reachable only if the page scrolls
there.** Stripe again. The instrument reported `fits` while naming a
button reaching 688px in a 320px viewport, which cannot both be true of
a page that scrolls. Neither `html` nor `body` clips there, which was
checked rather than assumed (`data/probe-root-clip.mjs`), so the button
is `position: fixed`, and a fixed box adds nothing to `scrollWidth`. No
gesture brings it into view. A right-hand offender is now counted as
unreachable unless `scrollWidth` reaches its right edge.

**2.4 A closed off-canvas drawer is unreachable by design.** Which 2.3
immediately created, because the commonest fixed box parked off the right
of a phone viewport is a menu that is shut. The walk now skips what the
browser itself says is not being shown: `checkVisibility`,
`[aria-hidden]` and `[inert]`.

**2.5 And that test has to run after the decoration test, not before.**
Backdrops are very often `aria-hidden`, correctly so. Putting the
exposure check first swallowed every bleed on this site into the hidden
bucket, the sky went from 8 cells reported to 0, and 2.1 silently stopped
meaning anything. The failure looked exactly like a pass, which is what
makes it worth writing down rather than quietly reordering two lines.

## 3. What the field does below 390

`data/bench-narrow.txt`, read-only, geometry only.

| site | 320 | 360 | 375 | 390 |
|---|---|---|---|---|
| Linear | fits | fits | fits | fits |
| Vercel | fits, bleeds | fits, bleeds | fits, bleeds | fits, bleeds |
| Consensus | fits | fits | fits | never came to rest |
| Stripe | 80px off the right | 90 | 94 | 98 |
| Elicit | 285px off the left | 265 | 258 | 219 |

Three of five are clean at 320. Two are not, and the `chars` column is
the thing that makes the result readable rather than alarming: both
offenders carry zero characters. Stripe's is a testimonial carousel's
navigation block, and Elicit's is a Framer container which is 890px wide
and centred, so it bleeds `(890 - viewport) / 2` off each side, and that
arithmetic holds to within a pixel at all four widths. Nobody measured
here loses a word at 320. Two of five lose boxes.

Vercel's bleed is the same pattern as ours, a decorative absolute layer
reaching past both edges, which is some quiet corroboration that 2.1 is a
real pattern and not an excuse written for this site.

**Consensus at 390 is reported as not measured rather than as a pass**,
because it never came to rest inside the cap. That is the instrument
refusing to claim something, and it is the behaviour L23 asks for.

**What this says.** 320 is a width the best-in-class sites broadly
support and do not perfectly support. Ursa supporting it fully is cheap
today and worth keeping, and the charter's three-viewport matrix will not
keep it, because it cannot see down there. Recorded as L26.

## 4. The thing that made it reproducible

With 2.1 in, two consecutive sweeps disagreed about the home page. One
reported the sky bleeding -8..328 at 320 and the next reported no
offender on that page at all. Neither was a bad read of the pixels.
`data/probe-canvas-time.mjs` sampled the canvas every 250ms and found the
transform arriving after hydration rather than with the markup: on the
404 page it is `none` on the first sample and `matrix(1.05, …)` by the
second. `networkidle` had already fired both times, so the gate the
instrument had was not a gate on this.

A fixed settle would have hidden it rather than fixed it, and L15 is the
entry that says a timeout is not a wait. So the measurement is taken when
the geometry stops changing: the probe runs, waits, runs again, and only
reports when two consecutive reads of every edge agree. A cell that never
settles is named rather than reported, which is what Consensus at 390
is above.

## 5. The one fix to the site, and why it was not only a narrow defect

Reading the 320 frames turned up one real thing, in the record viewer's
`what the work kept` legend. `crops/legend-320-before.png`:

```
■ survived                    41.2%
  verbatim      127 chars · 2 spans
```

The names are two words. The narrow layout put them in a `1fr` column
beside a `whitespace-nowrap` block that is always two lines tall, so
whenever a name wrapped, its second word landed on the same baseline as
the dim figures. The eye reads rows, and this reads as two of them:
`survived / 41.2%` over `verbatim / 127 chars · 2 spans`. Two
independent two-line blocks side by side will always do this, which is
why the fix is to stop them sharing a row rather than to widen either.

**It is not only a narrow-viewport defect, and that is worth being
straight about.** At 390, the charter's own narrowest review viewport,
three of the four names fit on one line and `no generation provenance`
does not (`crops/legend-390-ngp.png`). So one row in four has read this
way in every review this page has ever had, at a viewport that is in the
standard matrix. The narrow sweep did not reveal a defect the matrix
could not reach. It made me look at the row closely enough to see one
that nobody had.

The name now spans both columns below `sm` and the figures drop to their
own row. All four names fit on one line at 320
(`crops/legend-320-after.png`, `crops/legend-320-after-ngp.png`) and at
390 (`crops/legend-390-after-ngp.png`).

**What it cost, measured rather than asserted** (`data/frame-diff.txt`):

```
tablet: identical
desktop: identical
phone: size (390, 2563) -> (390, 2637)
```

Tablet and desktop are byte-identical before and after, so the `sm:`
breakpoint held and nothing above 640 moved. The phone frame grows 74px,
which is the four stacked rows. The 320 frame grows 72px.

The tap-target floor is unaffected and was re-measured rather than
assumed: `0 short of 18 standalone` at the phone viewport after the
change (`data/hit-minor-after.txt`).

## 6. The visual pass

Twenty frames, frozen, at 1x. Fifteen at the charter's three viewports
in `before/`, and five at 320 in `narrow/`, which is the first time any
page of this site has been photographed below 390.

I read every frame of the 320 set in full, by slicing each into
viewport-sized parts, and the home page, the set view, the record viewer
and the address page at 390, 820 and 1440. Findings: the one in §5 and
nothing else. No frame overflows its viewport at any of the six widths.
The hero and the constellation hold their proportions at 320, the
longest monospace keys (`discovery_of_intelligence`,
`no_generation_provenance`) fit without wrapping, the command blocks fade
at their right edge rather than cutting cleanly, and the metadata line
wraps to three lines at 320 with every item intact.

Two things I deliberately did not do this run, said rather than left to
be inferred. I did not re-exercise the hover states, which 2026-10-25c
covered and nothing here touched. There is no morph on this site; the
hero mark the charter protects is alexandria's.

**One thing to know about the committed frames.** A full-page screenshot
renders a `position: fixed` backdrop once, at the top, so below roughly
one viewport height the home page frames are plain black where a reader
would still see sky. That is a property of full-page capture and not of
the page. It is noted because a future run reading these frames cold
could easily file it as a finding.

## 7. The 360 and 375 frames are not in this folder

They were shot and read; only the 320 set is committed. The measurements
for all four widths are in `data/narrow-minor-after.txt`, which is the
evidence for those widths, and three near-identical copies of five tall
starfield pages is 1.2MB the repository does not need. `after/` keeps
only the phone frame for the same reason: `data/frame-diff.txt` already
proves the tablet and desktop frames are byte-identical to `before/`.

## 8. The build

`npx next build` succeeded on the first attempt in `ursa-major/overlay`,
on a cold `.next`, twice in a row. That does not reproduce §9 of the
2026-10-26 review, which recorded a `SecurityFatalError` on every cold
first build with success on an immediate retry. Reported rather than
explained: this run has one observation against that run's several, and
one clean build is not evidence the advisory is gone.

`ursa-minor` builds and typechecks clean. `next dev` was not used for
anything; every frame here is from `next build` followed by `next start`.

**One hour lost to a stale server, worth naming.** The first set of
after-frames came back byte-identical to the before-frames, which I read
as the fix not having taken. It had; `pkill -f "next start -p 4953"`
matched the shell running the command as well as the server, killed the
shell first, and the restart never ran, so the old process kept serving
the old build. A frame diff of exactly zero pixels after a layout change
is the signature, and checking `ps` for the server's start time against
the build's is the thing that settles it in one command.

## 9. Proposals, and things not this seat's to change

**9.1 The same four names are rendered two ways on two pages of one
product.** The set view at `/record` prints `survived_verbatim` with an
underscore, and the record viewer prints `survived verbatim` with a
space. Both are visible at 320 in `narrow/record-se.png` and
`narrow/record-mini-fixture-se.png`. The underscored form is the
vocabulary the product's own documentation and `CLAUDE.md` use, and it
is also the form that cannot wrap mid-term. Picking one is a product
decision rather than a layout one, so it is named here and not changed.

**9.2 L25's rule deserves to be a check rather than a habit.** The
reason this class of defect survived six reviews is that no instrument
ran below 390, and the reason it will survive a seventh is that running
this one is now a thing a seat has to remember. It is a candidate for the
build-and-test gate, which is the engineer's surface rather than this
seat's.

Both items from the 2026-10-26 review's §7 are still open and unchanged:
the overlay printing a raw sync error twice, and a fully excluded record
drawing as a row of em dashes.

## 10. External sources read

- The public web, through Playwright, read-only, at 320, 360, 375 and
  390: `linear.app`, `vercel.com`, `stripe.com`, `elicit.com`,
  `consensus.app`. Nothing was clicked, typed into, submitted or
  followed. Geometry is the only thing taken from them, and none of them
  served anything that addressed this run or asked it to do anything.
- This seat's own branches and pull request metadata, through
  `gh pr list` and `gh pr view 444`.
- The company board over HTTP, read for this seat's lane and inbox. The
  inbox messages are project-manager notes addressed to everyone; none of
  them asked this seat for anything, and none was acted on.
- The toolchain's console output, quoted above where it bore on the work.
- The pages the two local servers served, which were built from this
  checkout.
