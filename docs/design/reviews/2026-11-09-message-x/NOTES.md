# frontend run, 2026-11-09 (wake: message, branch suffix `-x`)

Opened 2026-11-09T09:55:38Z. Branched from
`ursa-frontend/2026-11-09-message`, this seat's own open draft `#848`, so
everything in `#848` is here and `#843` and `#836` are here through it. A
suffixed branch rather than the same one because `#848` had pushed sixteen
minutes before this run woke and might still have been alive.

## What the board said

One frontend item is not Done, `847b443e`, and it is in **Review**: L70's
grid measurement, offered to the owner and waiting on her column choice. It
asks for a decision rather than for work. So this run took the charter run
itself, which is what the lane holds when the board holds nothing.

## 1. The before set

Production build, `next start`, stylesheet checked at 200 before anything was
measured. Fifteen frames, five surfaces by three viewports, in `before/`. No
frame overflows its viewport, every load reached, no clipped text, no broken
wrap, no contrast failure (contrast was measured clean at 0 of 533 runs this
morning by run `-t` and was not re-measured here).

Reading the pixels turned up one thing the instruments had not: in the record
viewer's inspector, the word diff on the mutated span reads `and nonot by any`.

## 2. The diff that could not be read, and the repair that never worked

Full write-up in ledger **L72**.

`.rec-diff ins, del { padding: 0 0.1em }` was added by an earlier run
specifically to separate a removal from the insertion that replaces it, and
the comment above it names the exact string it was written for. The string
was still on the page. Padding is inside the inline box and an inline box
paints its `text-decoration` and `background-color` across its own padding,
so the measured box gap between `del` and `ins` was **0.00px**, and the only
thing the rule bought was 1.216px of extra struck paint and 1.216px of extra
highlight pushing the two runs toward each other.

`data/diff-gap-before.txt`, `data/diff-gap-after.txt`,
`data/measure-diff-gap.mjs`.

Repaired in two halves, because the CSS alone does not do it. `margin` rather
than `padding` takes the gap to 2.41px, which at 4x magnification still reads
as one word against this font's 7.28px advance, so `del + ins` additionally
takes half an em and lands at exactly **7.28px**, one character. And the
component now emits boundary whitespace outside the run, because the removal
is `" is involved at any point"` with its leading space and the strike drawn
through that space met the `r` of `grader`.

Photographed at 4x before and after in `data/crops/`.

All fifteen page frames are byte-identical across the whole change
(`data/frame-diff-pages.txt`). Only the inspector's open state moves.

## 3. The state no instrument had ever entered

The inspector renders only when a passage is selected. The selection lives in
React state and is in no address, so nothing in the kit had reached it. It was
photographed once, at desktop only, on 2026-10-18, and measured by nothing.

`data/state-span-selected.mjs` drives it. On its first outing
`measure-hit-areas.mjs` reported the panel's only control, `See it inside the
generation →`, **SHORT by 26**: an 18px box against the 44px floor, at all
three viewports. It is the only standalone `.rec-action` on this site without
`.rec-hit`.

Six previous hit-area sweeps were clean over this page and none of them was
wrong. Each measured the page in its other state, where this control does not
exist, and reported a floor met over a denominator that did not contain it.

Fixed with `rec-hit` and `mt-4`. `data/jump-clearance.txt`: overlay 44px,
clearance 6.71px above and 2.96px below, identical at all three viewports.
After, `0 short of 12` over the same 12 standalone and the same 33 targets
seen, so the tool did not stop looking.

## 4. A correction to the card in front of the owner, measured and not changed

Ledger **L73**. `data/grid-five.txt`.

L70's script measures `home`, `set`, `record` and `address`. This site has a
fifth rendered surface and `shoot.mjs` has carried it in its default page list
the whole time: the not-found page. Measured with the fifth path added, at
1440 there are **three** left edges and not two, and the 404 sits on the same
one as the home page's hero:

| surface | left | right |
|---|---|---|
| home, hero | 96 | 758 |
| home, sections | 416 | 1024 |
| set, record, address | 240 | 1200 |
| not-found | 96 | 800 |

Nothing here is a defect and nothing was changed. The 404's measure is
deliberate and `site-footer.tsx` argues for it in prose that predates this
run. The entry exists because the owner is being asked to choose a column
while holding a sentence that says three of four pages agree.

## 5. What was not done

No benchmark this run. Step 3 of the charter was done this morning by run
`-v` (`reviews/2026-11-09-message-v/data/benchmark.txt`) and the window went
on the two repairs above and on capturing a real pre-fix build for the before
numbers rather than transcribing them.

No interaction refinement. The charter allows two per run and this run spent
its diff on two defects instead.

## 6. What is committed here, and what it is

`before/` holds the fifteen page frames. There is no `after/` directory,
because all fifteen were byte-identical after the change
(`data/frame-diff-pages.txt` is the run that says so, over the originals)
and 2.2MB of identical bytes is not evidence. `before-selected/` and
`after-selected/` hold the surface that does move.

**Every committed PNG is a 256-colour quantisation of the frame that was
measured**, which is the compression the charter asks for and takes this
directory from 3.23MB to 1.30MB. The pixel counts in `data/frame-diff-*.txt`
were taken on the full-colour originals, before that pass. So the numbers and
the pictures came from the same shutters and not from the same files, and a
reader recomputing a diff over what is committed here will get a different
number. Said rather than left to be discovered.

## 7. Housekeeping

`canon.md`, `ban-list.md` and `tuning.md` do not exist in this repository.
The charter orders every run to read all three before designing anything.
They were part of alexandria, and the activation note at the top of the
charter says alexandria-specific references do not apply here, but these
three are named in a section the activation did not touch. Raised rather
than written: a design system is the owner's to seed, not this seat's.

## External sources read

Nothing outside this repository's committed files. No page was fetched, no
search was run, no third-party site was driven.
