# Frontend visual review — 2026-09-28

Run under `prompts/frontend-agent.md`. Surface reviewed: the Ursa Minor
site (`ursa-minor/`), which is one route. Every screenshot here was
rendered in headless Chromium with WebGL on through SwiftShader, so the
starfield shader and the constellation canvas are the real thing rather
than the no-WebGL fallback.

## What was reviewed

Home at 390x844, 820x1180 and 1440x900, in five states each: hero, full
page, the north-stars section, the footer, and the call to action under
hover. `before/` is the state at the start of the run, `after/` is the
state at the end, and `harness/` holds the scripts that produced both.

## Charter files that are not in this repo

The charter asks every run to read `docs/design/canon.md`,
`docs/design/ban-list.md` and `docs/design/tuning.md` first. None of the
three exists here. They were alexandria's, and the seat's adaptation to
Ursa at activation did not bring them across. This run therefore worked
from the identity as the charter states it directly, from the dispatch,
and from what the site already is. Standing up Ursa's own three files is
the first proposal below.

## Reading the full-page shots

The `home-full` captures show a hard horizontal edge partway down, where
the sky stops and flat `--night` begins. That is a capture artifact, not
a defect. The starfield canvas is `fixed inset-0`, and Chromium paints
fixed elements once at the top of a full-page screenshot. In a browser
the sky follows the viewport the whole way down. The `hero`,
`northstars` and `footer` shots are viewport captures and show the real
thing.

## What was found, and what was done

### 1. `--dim` fails WCAG AA everywhere it is used — fixed

Measured against background pixels sampled from the rendered page, not
estimated: `#5d6a85` gives **3.59:1** behind the header tag and
**3.77:1** behind the footer credits. WCAG 2.1 AA asks 4.5:1 for text
below 18.66px, and the token carries three small-text runs, all of them
under 12px:

| where | size |
|---|---|
| `for frontier labs` (header) | 11.52px |
| `✦ NORTH STARS` (section eyebrow) | 10.88px |
| all three footer credit lines | 11.2px |

The replacement `#707fa0` is the same hue one step lighter, chosen by
walking lightness up until the worst of the two backgrounds cleared the
threshold with headroom. It measures **4.85:1** and **5.10:1**. No new
colour enters the palette.

### 2. A one-letter orphan in the hero — fixed

At 1440 the paragraph broke as `generation. A / new approach`, leaving
the article stranded at the end of line three. A non-breaking space ties
it to its noun. The rag evened out as a side effect: line widths went
from 763/518/541/577/577 to 763/580/573/487/577.

### 3. The footer credits wrapped mid-role at 390px — fixed

`Alexandra Paiz Delgado · Systems Engineer` broke as `Systems /
Engineer`, splitting a two-word role. The credits are data now, the role
drops to its own line below `sm`, and it is balanced, so the longer title
splits as `Computer & Artificial / Intelligence Engineer` instead of
orphaning `Engineer`.

Tracking was considered first and rejected. The longer credit measures
349px against 326px of available width, and only clears at 0.05em, which
leaves 1px of margin and would wrap again on the fallback face. Breaking
at a boundary that means something is the more durable answer.

## Benchmark

Three sites, probed live for the transition durations and easing curves
actually computed on their links and buttons.

| site | curve | duration | applied to |
|---|---|---|---|
| Linear | `cubic-bezier(0.25, 0.46, 0.45, 0.94)` | 160ms | transform, border, background, filter |
| Linear | `ease` | 100ms | colour alone |
| Vercel | `cubic-bezier(0.4, 0, 0.2, 1)` | 100–150ms | almost entirely colour |
| Elicit | `ease-in-out` | 200ms | transform |

The shared lesson is restraint in the time dimension. Nothing
best-in-class runs long, nothing overshoots, and the heaviest curve in
use is an ease-out quad that arrives quickly and settles. Linear carries
most of its craft on border and background rather than movement, and
where it does move, it moves once and briefly.

Worth recording for the ledger: the bouncy feel the owner likes in
Elicit lives in the application, not on the marketing site. The public
pages run a single 200ms transform. Anyone chasing that feel should be
sent to the product, not the homepage.

## The two refinements

### R1 — a scroll affordance on portrait viewports

Portrait offsets the hero copy by `92svh`, so the first screen on a
phone or a tablet is sky alone: no sentence, no control, nothing saying
more follows. At 820x1180 that leaves roughly 600px of empty sky below
the dipper.

The cue is a 44px hairline at the text column's left edge with one
`--polar` pixel falling down it on the benchmarked Linear curve. It is
built from the two marks the page already uses, a hairline and a pixel
star, so it introduces no new vocabulary. It never renders in landscape,
where the copy is on screen already, and it fades out once the reader is
6% into the page. Under `prefers-reduced-motion` the pixel stops and the
hairline stays.

`after__scrollcue-cycle__iphone-390x844.png` is six frames across the
2.8s cycle. A single still understates it, because the falling pixel is
what does the work.

### R2 — hover, press and focus on the call to action

`Get Polaris` is the only control on the site and it ships `disabled`,
which is correct while Polaris is unavailable. It also had no hover,
press or focus styling of any kind, so the day it is enabled it would
feel dead.

Translated from the benchmark into the existing palette: the border
walks up to full `--polar`, the fill becomes `--polar` at 8%, and the
button lifts a single pixel, all on Linear's curve at 160ms. The press
drops it back down at 90ms with the fill at 14%, and landing faster than
the lift is what makes it feel physical rather than animated. Focus gets
a 1px `--polar` outline at 3px offset, visibly distinct from hover.

Verified in five states in `after__cta-states__desktop-1440x900.png`.
The three enabled frames were produced by removing the `disabled`
attribute in the harness, because the shipped button cannot show them.
The button in the repository is still disabled.

Touch was checked rather than assumed: in a touch context
`(hover: hover)` resolves false, so the hover rule does not apply and
nothing sticks after a tap.

## Not done, and why

**The constellation is distorted in landscape.** The portrait branch
scales the dipper uniformly, with a comment saying it does so to keep the
shape. The landscape branch maps x and y by different factors, 0.52 of
width against 0.48 of height, which stretches the figure about 1.7x
horizontally at 1440x900. The portrait rendering is the true shape; the
desktop one is not. This is the hero mark, whose geometry the dispatch
puts out of bounds, so it is a proposal below rather than a fix.

**The dispatch says black and white only. The site is not.** It runs a
night-sky palette with `--polar` `#a8c7fa` on Polaris, the constellation
lines, the section keys and the call to action. That reads as the
owner's deliberate Ursa Minor identity rather than drift, and repainting
a shipped site to greyscale is a reinvention, not polish. Nothing here
introduces colour, and the question is put to the owner below.

**`prefers-reduced-motion` leaves a dead listener.** `PixelSky`
registers `mousemove` and writes to `mouseT` under reduced motion, but
the parallax transform is only applied inside the animation loop, which
never runs in that mode. Harmless and invisible, so it was left alone
rather than spent as one of the two refinements.

## Proposals for the ledger

1. **Stand up Ursa's own `canon.md`, `ban-list.md` and `tuning.md`.**
   Three runs from now the absence will cost more than it costs today.
   The measurement system, the reference set and the animation rules all
   need a home, and this run had to reason from first principles where it
   should have been reading a ruling.
2. **Correct the landscape constellation to a uniform scale**, matching
   what portrait already does. Needs the owner's word, because it is the
   hero mark.
3. **Rule on the palette.** Either the dispatch's black-and-white line
   governs Ursa Minor and the site should be converted deliberately, or
   the night-sky palette is the identity and the charter's wording should
   be updated to say so. Right now the two disagree in writing.
4. **Reconsider the portrait hero's proportions.** R1 gives the lower
   half a purpose, but at 820x1180 the empty region is still large. Worth
   a look once the owner has ruled on the mark.
