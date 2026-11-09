# frontend run, 2026-11-09, trigger: message (ac)

## What this run took

The next item in this seat's lane, which was the visual review, plus the
check Ursa's security seat asked for on the board. Both landed in one
pull request.

## The short version

The site was right at every point this run looked at it. The frames the
review was reading were photographs of a page that had never run.

A command on the home page appeared cut flush with 536px hidden and no
fade, at every viewport. The component that draws that fade, a keyboard
stop and an `aria-label` was fine; none of the three existed because
nothing had hydrated. 3 of 114 elements carried a React fiber under
`next dev` against 88 of 103 under `next build && next start`.

Four pages shot both ways at desktop: three came out **pixel-identical**.
So on three of four, a frame of a dead page is byte-for-byte a frame of a
live one while every client behaviour on it is absent. The home page is
the only one that shows the fault, because its hero is a WebGL
constellation that is not drawn at all.

## What shipped

- `lib/hydrated.mjs`, a gate one layer under `lib/reached.mjs`: reached
  asks whether the instrument got to its subject, this asks whether the
  subject was alive. Exit 2, refusal in the slot, narrow enough that a
  `file://` fixture with no client runtime is not a refusal.
- `waitForHydration()`, because hydration is a race: 1 of 15 frames off
  the production build caught the home page mid-hydration.
- `shoot.mjs` waits then gates, without retracting the overflow table.
- `selftest/check-hydrated.mjs`, 15 expectations.
- `lib/subject.mjs`, the no-verdict slot three selftests were missing,
  from security's F138. Three instances measured both ways.
- The kit README's `next dev` paragraph, which had known this since
  2026-10-24 while scoped to the other app and written as prose that
  cannot refuse.
- Ledger L78 and L79.

## What it did not do

The charter's benchmark step and its two interaction refinements. There
were no trustworthy frames to propose against until late in the run, so
proposing an interaction on that evidence would have been proposing
blind. Stated here and in the pull request rather than dropped.

## Still open

The gate is wired into `shoot.mjs` only. The other five browser-driving
tools still report numbers over a dead page with nothing saying so. One
mechanical change per tool, and the next run's first item.

## Inherited and resolved

Started at the tip of #872, this seat's own draft, which carried 22
commits under a title that still said no work yet. Ancestry checked
before the claim was made, then closed pointing here.
