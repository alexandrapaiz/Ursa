# frontend run, 2026-11-09, message trigger (run t)

The lane is empty. All fifteen frontend cards on the board sit in Done and
none of the twenty-one cards in the open columns is this seat's, which is
the same answer the two runs before this one got. Nothing in the inbox
owes this seat anything either: the exo seat's two notes both say nothing
is owed back, and the security seat's two both report on work already
taken. So the unit is the charter's standing run, which is the visual
pass, and this file says what it found.

## What was measured, and what it says

The site is in good shape and four independent sweeps say so rather than
this seat saying so.

| sweep | result |
|---|---|
| `shoot.mjs`, 5 pages x 3 viewports | 15 frames, 0 overflow any axis |
| `measure-contrast.mjs` | 0 of 533 text runs below threshold |
| `measure-focus.mjs` | 0 of 86 tab stops below a floor, 0 unreachable |
| `measure-narrow.mjs`, 320 to 390 | 0 of 20 cells put content out of reach |

Two things this seat looked at by eye and cleared rather than fixed,
written down because a later run should not spend a window re-finding
them.

The command boxes on the home page cut their text at the right edge on a
phone, which reads as clipping in a downscaled frame. Magnified eight
times at `data/fade-edge.png` the fade mask is working exactly as the
2026-11-09 card describes: the glyphs ramp off rather than stop. Nothing
to repair.

The footer and the trailing paragraph on the home page read as dim. The
contrast sweep measures them against the composited backdrop and they
pass, so the dimness is the intended de-emphasis and not a contrast
failure. The instrument is the authority here and not the eye, which is
L16.

## The grid, measured rather than squinted at

`data/grid.txt` is every page's content edges at the three viewports.

At phone and tablet every page has one left edge. Wordmark, `h1` and
section content all begin at 32 on a phone and 66 on a tablet, across all
four pages. That is the designed system and it holds.

At desktop the home page leaves it. Three pages put their content at
240..1200, and the home page puts its at 416..1024, which is a column
176px narrower on each side than the one the rest of the site uses.

The cause is in the markup and it is two differences rather than one:

    app/page.tsx:103            lg:mx-auto lg:max-w-2xl lg:px-8
    app/record/page.tsx:23      xl:mx-auto xl:max-w-6xl
    app/record/[id]/page.tsx:38 xl:mx-auto xl:max-w-6xl
    app/record/at/…/page.tsx:60 xl:mx-auto xl:max-w-6xl

The container differs and so does the breakpoint it starts at, so between
1024 and 1280 the home page has already centred into a 608px column while
the other three are still full-bleed on the clamp padding.

**This run did not change it**, and the reason is the charter rather than
doubt about the measurement. A marketing page with a narrower measure than
a data page is a legitimate design decision, and the charter puts bigger
ideas into ledger proposals and board cards instead of into this seat's
diff. The proposal is in the pull request with this measurement attached.

## The defect this run did fix

See the pull request. It is in the review kit rather than in the site.
