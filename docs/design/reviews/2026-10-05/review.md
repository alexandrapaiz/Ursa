# Frontend visual review, 2026-10-05

Frontend engineer run under ADR-005. Surface reviewed is the Ursa Minor
site in `ursa-minor/`, which is the only public page in this repo. Every
screenshot in this folder was captured at 1x with Playwright and
Chromium, at 390x844, 820x1180 and 1440x900, and every one of them was
looked at before anything was changed.

WebGL was confirmed live in the capture browser, so the sky shader in
`PixelSky` renders in these screenshots the way a visitor sees it rather
than falling back to the static 2D path. There were no console errors or
page errors at any viewport, before or after.

## Blocked on arrival: the design system is missing

The charter says every run reads three files in `docs/design/` and
treats them as law. Those are `canon.md` for the measurement system and
the animation canon, `ban-list.md` for the enumerated tells of the
vibe-coded look, and `tuning.md` for the owner's accumulated rulings.
**None of the three exists in this repository.** The only files in
`docs/design/` are `product-plan.md` and `tuning-pipeline.md`, and
`tuning-pipeline.md` is about the data pipeline rather than about
design. They were never carried across from alexandria when the seat was
adapted at activation.

This run proceeded anyway, because the rest of the charter is intact and
stopping would have delivered nothing. It does mean that every judgement
below rests on the identity rules written into the charter itself plus
measurements I could take directly, rather than on the measurement
system the canon would have supplied. Restoring the three files is the
first proposal below, and it should come before any further design work.

## Second thing to flag: the palette does not match the charter

The charter says the palette is black and white and that no color may be
introduced. The site is not black and white. It is a night sky, built on
`--night #020308`, `--star #e8edf7`, `--polar #a8c7fa` and
`--dim #5d6a85`, with a navy ambience in the shader. The blue is load
bearing, because Polaris and the constellation are the product's mark.

This run introduced no new color and changed no hue. It needs an owner
ruling, because the charter as written and the site as built disagree,
and a later run without that ruling could reasonably read the charter as
licence to strip the blue out.

## What I found and fixed

### 1. Contrast failure on `--dim`, at three places

Measured on the rendered pixels rather than on the token, because the
shader puts a navy ambience behind the text that is brighter than the
`--night` ground and therefore makes contrast worse than the token
arithmetic suggests.

| Where | Size | Background measured | Contrast |
|---|---|---|---|
| Header tagline "for frontier labs" | 11.52px | rgb(8, 12, 26) | **3.59:1** |
| "North stars" section label | 10.88px | rgb(3, 5, 10) | **3.75:1** |
| Footer credits | 11.2px | rgb(3, 4, 9) | **3.77:1** |

All three are well under 18.66px, so the WCAG AA floor that applies is
4.5:1 and all three fail it. Lifted `--dim` to `#7886a4`, which measures
5.33:1 behind the header and 5.60:1 behind the footer on the rendered
after shots. The value was chosen as close to the original as the floor
allows with headroom, it keeps the same hue family, and it stays clearly
the quietest tier underneath `--star` and the body grey.

The disabled "Get Polaris" button also sits near 4:1 once its 55 percent
opacity is composited, but WCAG exempts inactive controls, so it was
left alone.

### 2. Footer credits broke mid-phrase on iPhone

The footer was a `flex-wrap` row with a horizontal gap. That row never
actually forms at any viewport, because the three credits are far wider
than the column at every width, so the layout was always a stack
produced by wrapping. On iPhone the consequence was that "Alexandra Paiz
Delgado, Systems Engineer" split across two lines with the same vertical
gap that separated one person from the next, so a name and its role read
as two unrelated items.

It is now an explicit column with its own gap and a set leading, so the
space between two credits is visibly larger than the leading inside one.
The longest credit is 65 characters and still has to wrap at 390px,
which no amount of tracking will fix, but the grouping is now
unambiguous.

## Refinements

Two were implemented, which is the charter's limit.

### Refinement 1: one grid below desktop

The hero uses `px-[clamp(2rem,8vw,6rem)]`, while the reading column was
a centred `max-w-2xl` with `px-8`. Those two systems produced left edges
that disagreed by a small amount at tablet widths, which reads as a
mistake rather than as intent.

| Width | Hero left | Rule left | Stagger before | Stagger after |
|---|---|---|---|---|
| 390px | 32 | 32 | 0px | 0px |
| 768px | 61 | 80 | **19px** | **0px** |
| 820px | 66 | 106 | **40px** | **0px** |
| 1023px | 82 | 208 | 126px | 0px |
| 1440px | 96 | 416 | 320px | 320px, unchanged |

Below 1024px the reading column and the footer now adopt the hero's own
container, meaning the same max width and the same clamp padding. The
hero copy, the button, every rule, the section label, the keys and the
credits all share one left edge. The reading measure also widens at
tablet, from 376px to 457px at 820px, which is a better line length for
16px body text. Above 1024px nothing changed, and the centred column
against the full bleed hero still reads as two deliberate systems rather
than as a near miss.

Linear does the same thing and is worth citing here. Its hero, its deck
line and its nav logo all sit on one left edge at x=80, and it never
mixes a centred column with a left aligned one at the same width.

### Refinement 2: the footer rule takes the column's measure

The footer's top border was full bleed at every width, running the whole
viewport, while every other rule on the page was confined to the reading
column. At 1440px that meant one 1440px line underneath four 608px ones.
The border now sits on the same container as the section rules and
matches them exactly at every width.

### What I tested and deliberately did not change

The hero paragraph uses `text-wrap: balance`, and the balanced rag
strands a lone "A" at the end of a line on desktop, which looked like a
typographic defect worth fixing. I measured the alternatives instead of
assuming. Balance is the best of the three at every viewport, by a wide
margin, where the number below is the worst short line against the
longest line.

| Viewport | `balance` | `pretty` | `wrap` |
|---|---|---|---|
| 1440px | **118px** | 374px | 515px |
| 820px | **165px** | 384px | 547px |
| 390px | 193px | 193px | 193px |

Changing it would have made the rag worse everywhere, so it stays. At
390px the paragraph runs to seven lines, which is past the point where
browsers apply balancing, and all three modes are identical.

The hero mark was not touched. The constellation geometry, its placement
maths, its pulse timing and the sky shader are all byte identical, and
the before and after hero screenshots show the same star positions.

## Benchmark notes

Visited Elicit, Linear and Vercel with Playwright and read their
computed transition values and their declared easing tokens, rather than
judging the feel by eye. Captures are in this folder.

**Elicit** declares `cubic-bezier(0.33, 0, 0, 1)`, alongside
`cubic-bezier(0.45, 0, 0.2, 1)`. That first curve is the one worth
naming, because it is almost certainly the source of the bouncy feel the
owner likes. It leaves instantly and then spends a long time settling,
so the motion feels like something arriving and coming to rest rather
than something sliding. Its page is otherwise very restrained, with one
dominant primary action and a strong figure to ground contrast.

**Linear** runs hovers at 0.1s to 0.16s on
`cubic-bezier(0.25, 0.46, 0.45, 0.94)`, which is a plain ease out
quadratic, and declares `cubic-bezier(0.32, 0.72, 0, 1)` and
`cubic-bezier(0.16, 1, 0.3, 1)` as its heavier curves. Two details
matter more than the numbers. It enumerates the exact properties each
transition applies to and never uses `all`, and its durations never
exceed 160ms.

**Vercel** uses 0.15s on `cubic-bezier(0.4, 0, 0.2, 1)` for its buttons,
and declares a family of overshoot curves, including
`cubic-bezier(0.5, 0, 0.1, 1.2)`, `cubic-bezier(0.1, 0, 0.1, 1.1)` and
`cubic-bezier(0.3, 0, 0.1, 1.05)`. The final control point above 1 is
the whole trick behind a bounce, and it is a small overshoot rather than
a large one. Vercel is also the direct proof that the black and white
discipline the charter asks for can carry a frontier infrastructure
product.

Three lessons translate to our identity without borrowing anyone's look.
Durations belong in the 100ms to 160ms range. Easing should be ease out
dominant, so motion departs quickly and settles slowly. A bounce is a
cubic bezier whose last control point sits just above 1, somewhere
around 1.05 to 1.2, and not a spring library.

**None of it could be applied this run, and that is itself the finding.**
The page has exactly one interactive element, the "Get Polaris" button,
and it is hardcoded `disabled`. There are no links, no nav, and no
anchors. There is no hover surface to put a hover spring on, and
shipping hover styles for a state that never renders would be dead code.
The transition work should land in the same change that enables the
button, and the tokens above are ready for it.

## Proposals

1. **Restore the design system.** Port `canon.md`, `ban-list.md` and
   `tuning.md` into `docs/design/`, adapted to Ursa the way the charter
   itself was adapted. Until they exist, every frontend run is working
   without the measurement system it is told to treat as law, and the
   owner's accumulated rulings have nowhere to live. This is the
   highest value item in this list by a distance.

2. **Rule on the palette.** Either amend the charter to describe the
   night sky identity the site actually has, or rule that the blue is
   confined to the mark. The charter and the site currently disagree,
   and the ambiguity is a standing risk to the mark.

3. **Adopt motion tokens before the CTA goes live.** Record the three
   lessons from the benchmark as named tokens in the canon, so the
   button, and anything interactive that follows it, inherits one
   motion language instead of each run inventing a curve.

4. **Make the sky's motion frame rate independent.** `PixelSky` eases
   both the pointer parallax and the scroll darkening with a fixed per
   frame factor, 0.06 and 0.08. On a 120Hz display both settle roughly
   twice as fast as the owner approved them at on 60Hz. Converting to a
   delta time easing would preserve the 60Hz feel exactly and fix every
   other refresh rate. **Not done this run**, because it touches the
   timing of the approved hero and the charter requires her word first.

5. **Look again at the portrait hero on iPad.** At 820x1180 the whole
   first screen is sky and the header, with the hero copy and the button
   entirely below the fold. On iPhone the same choreography works,
   because the constellation fills a small screen. On a tall tablet the
   constellation occupies the upper third and roughly 580px of empty sky
   sits under it. Any fix means moving the mark, so this is an
   observation for the owner rather than something to change.

6. **The site has one page and one dead control.** For a surface aimed
   at five to ten frontier labs, there is no way to make contact and
   nothing to read beyond the four north stars. That is a product
   question rather than a polish question, which is why it is a proposal
   and not a change.
