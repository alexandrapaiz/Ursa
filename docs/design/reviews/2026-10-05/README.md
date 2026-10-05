# Frontend visual review, 2026-10-05

The write-up is in [review.md](review.md). This folder holds the
evidence for it.

Surface is the Ursa Minor site in `ursa-minor/`. Captures are Playwright
with Chromium at 1x scale, at iPhone 390x844, iPad 820x1180 and desktop
1440x900. WebGL was live in the capture browser, so the sky shader
renders as a visitor sees it.

- `before-home-*` and `after-home-*`, by state and viewport. States are
  `top`, `full` for the whole page, `northstars`, `footer`,
  `hover-cta` and `reducedmotion`.
- `bench-*` are the benchmark captures of Elicit, Linear and Vercel.

Compressed to a 128 colour palette at native capture size, so the pixels
are unscaled and the folder stays under a megabyte.
