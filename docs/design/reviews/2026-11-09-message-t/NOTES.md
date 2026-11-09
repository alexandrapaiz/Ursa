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

## The defect, stated

`measure-narrow.mjs` reported a pass for a matrix it never loaded.

The first invocation of it this run used the tool's default base, which is
port 4953, while this run's server was on 4488. Every one of the twenty
cells failed to load. The tool printed this:

    NOT MEASURED: 20 of 20 page-by-width cells could not be loaded or
    never came to rest, so this run makes no claim about them.

and exited 0.

Both halves of that are the tool's own work. The sentence is good, and the
comment above it in the source says it "refuses to report a pass while any
cell is unmeasured", citing L23. The exit status reported a pass anyway,
because the status was whatever the last statement left behind and the
last statement is a successful `writeFileSync`.

**The control that makes it a finding rather than an anecdote.** Pointed at
a dead port, the kit's five measuring tools answer:

    measure-narrow     exit 0     <- the whole matrix unmeasured
    measure-contrast   exit 1
    measure-hit-areas  exit 1
    measure-focus      exit 1
    verify-hover       exit 1

The four that are right are right by accident. They let the navigation
error escape, so node sets the status for them. `measure-narrow.mjs` is the
only one that *catches* the failure and reports it, and catching it is
exactly what let the run continue to a success exit. The careful
instrument was the broken one, and the care is what broke it.

That is `runner-facts` §48, which Ursa's exo, security and engineer seats
each reached independently in one night: compute the status from the
finding, never from the last command that ran.

**Why this run is a witness and not only an auditor.** The line in this
seat's own transcript after that invocation reads `narrow exit=0`, and this
run came within one careless step of recording a clean sweep over a matrix
that was never loaded. The repair is not hypothetical to it.

### The repair, and the line it does not cross

Exit 2 when any cell could not be loaded or never came to rest. There is
deliberately no exit 1.

The distinction is load-bearing and the kit's own selftests prove why.
`selftest/check-contrast.mjs` runs `measure-contrast.mjs` over a fixture
that contains four deliberately failing runs and asserts `code !== 0` is an
error, because it needs to read the tool's JSON for findings. A tool whose
findings are data must exit 0 when it measured successfully, however bad
the findings are. So:

- whether a cell puts content out of reach is a verdict about the **site**,
  made by the reader of the table, and it stays exit 0
- whether anything was measured at all is a verdict about the
  **instrument**, which no caller can make from the outside, and that is
  exit 2

`selftest/check-narrow.mjs` is new and proves both directions, because case
1 alone would be satisfied by a tool that always failed:

    ok   true   (1) a matrix it could not load exits non-zero
    ok   2      (1) and the status is 2, the instrument's own code
    ok   true   (1) and it still says so in words
    ok   false  (1) and it never prints the passing headline
    ok   0      (2) a matrix it did measure exits 0
    ok   true   (2) and it prints the passing headline
    ok   false  (2) and claims nothing unmeasured

    all 7 expectations hold

Against the live site the sweep still exits 0 over 20 cells, and against a
dead port it now exits 2.

## A host fact this run paid for

The shared playwright browser cache is evicted mid-run. The install
succeeded at 07:41 and the directory was empty by 08:1x, with free space on
`/tmp` going 715M to 4.6G and no install of this run's in between. The
error names the wrong cause, because playwright prints its fresh-machine
message for it. It is `runner-facts` §97 one directory over, and it is
written into the kit README with the one-line check that separates it from
a setup mistake. Routed to the exo seat, which owns that file.

## States, exercised

`verify-hover.mjs` plus the pixel count it says is required before a
verdict of `changes` counts as a verified hover. Ten hover targets, all
proportionate:

| target | px changed | reading |
|---|---|---|
| cta-home | 0 | correct: the CTA is disabled by design and the tool says so |
| mark-link-404 | 140 | one 140px hairline appearing, worth exactly itself |
| quiet-link-404 | 10995 (65.6%) | ring, border and a 6% wash, the composite treatment |
| rec-action-home | 113 | the underline under "the record viewer", lifted 0.4 to 1.0 |
| rec-action-index | 114 | full hairline on a 114px control |
| rec-action-record | 379 | the underline's true glyph run, appearing from transparent |
| rec-row-index | 114621 (92.8%) | whole-row treatment |
| sp-verbatim / sp-mutated / sp-ngp | 10451 / 10462 / 4024 | span tints, 0.14 to 0.26 |

The kit's own finding criterion is that a hover worth fewer pixels than
the hairline it draws is a finding. Three of these look thin against their
control's box width and none of them is: `rec-action-record` is a 960px
button whose underline only exists under its glyphs, and 379px is that
glyph run. The box width is the wrong denominator and the underline's own
length is the right one.

Three overlay targets report NOT-REACHED because they need `--overlay-base`
and this run did not pass it. That is scope rather than blindness, so it is
deliberately *not* the defect repaired above: nothing was asked of those
surfaces. The open question this run did not answer is what the tool does
when the flag IS passed and the overlay fails to load, which would be
blindness and would deserve the same exit status. Filed as a proposal
rather than guessed at.

## What this run did not do

No site code changed, so there is no after set. The before frames are the
site's current state and the four sweeps above are its current measurement.
The charter allows at most two interaction refinements and this run shipped
zero, because the site measured clean on overflow, contrast, focus, narrow
widths and hover proportionality, and inventing a change to fill the quota
would be the vibe-coded reflex the ban list exists to stop.

No benchmark of other products was run either. The window went to the kit
defect and to the browser-cache eviction that interrupted it, and a thin
benchmark with no refinement to inform would be padding. Said plainly here
rather than left for a reader to notice.
