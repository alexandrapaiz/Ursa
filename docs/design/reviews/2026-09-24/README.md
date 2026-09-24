# Frontend visual review — 2026-09-24

Run under `prompts/frontend-agent.md`. The site under review is
`ursa-minor/` (Next.js 16). `ursa-major/` is a CLI and has no frontend.
The build passes and the production server was screenshotted with
Playwright chromium at three viewports, with WebGL available so the
starfield shader rendered rather than falling back.

Pages: the home page and the 404. Those are the only two routes the
build emits. States exercised: rest, scrolled to the foot of the page,
CTA hover, keyboard focus, and `prefers-reduced-motion: reduce`.

## What the screenshots showed

**1. All secondary text failed the AA contrast floor.** Sampling the
rendered pixels rather than trusting the token, `--dim` (#5d6a85)
measured 3.59:1 against the header sky, 3.75:1 against the reading sky,
and 3.77:1 behind the footer. It is used only at 0.68rem to 0.72rem, so
the floor is 4.5:1. Every other color on the page passes comfortably:
body text 11.17:1, `--polar` 11.86:1, `--star` 17.37:1. The failure was
visible as well as measurable, and the footer credits and the "north
stars" label were the worst of it.

**2. The 404 was the stock Next.js page.** White background, black
system type, a vertical rule. Mistype a URL and the night sky, the
wordmark, and the whole identity disappear. See
`before/notfound-desktop-1440x900.png`.

**3. The reading column drifted off the hero's left edge on tablets.**
At 820 wide the hero text started at 66px and the north stars column
started at 106px. Forty pixels is the worst kind of offset: too small to
read as a deliberate second composition, too large to read as aligned.
The cause is a centered `max-w-2xl` column sitting under a hero padded
with `clamp(2rem, 8vw, 6rem)`. On phones the two happen to coincide, and
on desktop the gap is wide enough that the centered column reads as
intentional, so the defect lives in the tablet band.

## What I checked and found healthy

The hero mark was not touched, and nothing here changes its geometry,
timing, or choreography. Polaris's glow looked like a square halo in the
first pass; brightening a 5x zoom showed a true circle, and the square
was an artifact of the pixelated 2x canvas. No horizontal overflow at
any viewport. No console errors other than the expected 404s. Reduced
motion already renders a static sky with no shooting star.

One thing to know when reading this evidence: in the `home-full-*`
screenshots the sky stops at the first viewport height and everything
below is flat. That is Playwright's known behaviour with `position:
fixed` under `fullPage`, not a defect. Judge the below-fold sections
from the `home-scrolled-*` shots instead.

## Benchmark — interaction craft

Measured with Playwright against Linear, Vercel, and Elicit, reading
computed styles and sampling the rendered values across a hover rather
than eyeballing them.

| | what moves | duration | curve |
|---|---|---|---|
| Linear | background to `rgba(255,255,255,0.03)` | 160ms | `cubic-bezier(0.25,0.46,0.45,0.94)` |
| Vercel | color only | 150ms | `cubic-bezier(0.4,0,0.2,1)` |
| Elicit | fill darkens | ~200ms | asymmetric, back-loaded |

The useful finding is what none of them do. Not one of the three scales,
lifts, or springs its primary call to action. The owner's note is that
Elicit's hover feels satisfying and bouncy, so I sampled it every 40ms:
the fill moves 2.6 percent of the way in the first 40ms, 34 percent by
120ms, and 97 percent by 160ms. It holds still, then arrives. The
satisfying part is the curve, not a bounce, and the control itself never
moves. See `benchmark/elicit-cta-rest.png` and
`benchmark/elicit-cta-hover.png`.

Translated into this identity: light, not movement. A hovered control
catches a little starlight.

## Fixes shipped

- `--dim` lifted from `#5d6a85` to `#6b7a99`. Same hue (220.5 degrees)
  and same saturation, value only, so the palette is unchanged in
  character. Re-measured on the rebuilt site: 4.52:1 against the header
  sky, 4.75:1 behind the footer, 4.73:1 in the reading section. All pass.
- A 404 built to the identity: the starfield, the wordmark, a `✦ 404`
  label in the existing mono system, the message set in the display
  face, and a link home.

## Refinements shipped (two, the charter's limit)

- **Responsive.** Below `lg` the reading column and the footer now take
  the hero's own padding instead of centering, so the wordmark, the hero,
  the button, the section label, the star keys, and the footer all sit on
  one left edge. Verified at 390, 768, 820, and 1023: left edges 32/32,
  61/61, 66/66, 82/82. At 1024 and above the centered column returns
  untouched, and the desktop page height is byte-identical before and
  after (1823px), which is the check that desktop did not move.
- **The hover.** `.quiet-link` carries Linear's amplitude and curve on
  the way in at 160ms, and holds Elicit's longer settle on the way out at
  260ms. Asymmetry is the point: it answers immediately and lets the
  light linger. Guarded by `@media (hover: hover)` so touch does not get
  a stuck state, mirrored on `:focus-visible` with a 3px offset ring for
  keyboard parity, and collapsed to 1ms under reduced motion. See
  `after/404-cta-rest-*`, `after/404-cta-hover-*`, and
  `after/404-cta-focus-*`.

## Proposals, not implemented

- **The first screen is empty on phones and tablets.** `portrait:mt-[92svh]`
  puts the hero paragraph below the fold, so an iPhone visitor gets a
  constellation and no words, with nothing indicating there is more. It
  is a deliberate scenic composition and the fix is a judgement call for
  the owner, either a restrained scroll cue in the existing mono system
  or letting the first line peek. It would have been a third refinement,
  so it stops here as a proposal.
- **The footer rag.** The three credits wrap to "Alexandra" then
  "Fatima + © ursa", which reads as accidental rather than composed.
- **The hero rag.** `text-wrap: balance` on a five-line paragraph leaves
  a lone "A" ending the third line. Worth the owner's eye, since it
  touches the hero.
- **The design system named in the charter does not exist here.** The
  charter orders every run to read `docs/design/canon.md`,
  `ban-list.md`, and `tuning.md` and treat them as law. None of the
  three are in this repo; they were alexandria's. I did not write them,
  because inventing design law is exactly what they exist to prevent.
  Until the owner ports or authors them, runs like this one are working
  from the charter's prose alone.
