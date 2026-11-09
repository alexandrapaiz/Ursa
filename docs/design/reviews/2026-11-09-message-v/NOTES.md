# Frontend run 2026-11-09 (wake: message, branch suffix `-v`)

Opened 2026-11-09T08:23:00Z, notes written from 08:48:55Z. Every instant
here is a `date -u` read at the moment it was written, never a bucket and
never a forecast.

## §0 What the wake carried, and what was true

The wake said #825 had merged and told this run to continue with the next
item in its lane on the board.

| carried condition | confirmed as |
|---|---|
| #825 merged | **true.** It is on `main` |
| continue with the next item in this seat's lane | **there is one, and the three runs before this one were right that there was not.** `/api/board/Ursa` has a `frontend` card in Backlog, `847b443e`, created 2026-11-09T08:20:09Z, three minutes before this run began |
| a draft this seat left behind | **none.** `own-prs.mjs frontend --drafts` reads `own_draft=0`; `own_open=1`, which is #836, ready |

So the lane filled between the previous run ending and this one starting,
and the card is the previous run's own proposal, routed back by the board
from #836. This run took it. It is the first run in four that did not have
to choose its own unit.

**Merged rather than restarted.** #836 is open and touches
`docs/design/ledger.md`, which this run also appends to, so per the
charter's own-PRs rule its branch was merged into this one first. This
branch therefore contains #836 and **#843 subsumes #836**.

## §1 The card, and why the proposal in it understated the defect

L70 measured that the home page takes a column 176px narrower on each side
than the other three at desktop, declined to change it because the measure
is the owner's decision, and attached one observation: the two breakpoints
should probably become the same one, because the band between them is a
width nobody chose.

The observation is right and the reason given for it is not the strongest
one available. Inside that band the record pages' column was **wider than
the maximum its own markup declares**.

    app/record/page.tsx         xl:mx-auto xl:max-w-6xl

`max-w-6xl` is 1152px. `xl:` is 1280px. A `max-width` is inert whenever it
exceeds the space available, so the prefix buys nothing below 1152, and the
only widths it changes are 1152 to 1279 — exactly the widths where the
clamp was needed and absent. At 1200 the column ran 1008px wide against the
960px the markup asks for.

That is not a design decision deferred to the owner. It is a declaration
that does not apply where it is declared.

## §2 The sweep, which is the part that did not exist

The three charter viewports cannot see any of this: 820 is below both
breakpoints and 1440 is above both. `data/sweep-grid.mjs`, 960 to 1440 in
16px steps plus the four breakpoints probed at single-pixel resolution,
four pages, 37 widths.

A left edge that moves further than the viewport moved is a discontinuity.
`data/sweep-grid.txt`:

| page | at | viewport | body column's left edge |
|---|---|---|---|
| home | 1023 to 1024 | +1px | **+126px** |
| set | 1279 to 1280 | +1px | +64px |
| record | 1279 to 1280 | +1px | +64px |
| address | 1279 to 1280 | +1px | +64px |

## §3 The change

`xl:mx-auto xl:max-w-6xl` to `mx-auto max-w-6xl`, on the three record pages
and in `site-footer.tsx`'s `wide` measure so the footer still takes the
measure of what it closes. Four files, four classes.

**No measure width changed.** `max-w-6xl` and `max-w-2xl` are both exactly
what they were, so the open decision L70 put to the owner is still open and
still has the same two options.

`data/sweep-grid-after.txt`: three of the four discontinuities are gone and
the record pages' column is continuous from 960 to 1440. The home page's
126px snap at 1024 remains, because repairing it means moving the home
page's breakpoint, which moves the tablet layout, which is the owner's call
and is still card `847b443e`.

The home-to-record divergence is 176px by design. Before, it drifted from
126 to 240 across the band and only settled at 1280. Now it reaches 176 at
1200 and holds.

## §4 The evidence that the change is confined to the band

Eighteen frames before and after, six viewports by three pages.
`data/frame-diff.txt`. Four frames moved and fourteen did not.

**The fourteen are byte-identical as files**, which anyone can check
without running any tool and without trusting this seat:

```
cd docs/design/reviews/2026-11-09-message-v
for f in before/*.png; do cmp -s "$f" "after/$(basename $f)" \
  && echo "same  $(basename $f)" || echo "MOVED $(basename $f)"; done
```

prints `MOVED` for exactly `record-band1200`, `record-band1279`,
`record-mini-fixture-band1200` and `record-mini-fixture-band1279`, and
`same` for the other fourteen, which include **every frame at all three
charter viewports on all three pages**. The frames are quantised to a
256-colour palette to keep the repository light, which is deterministic, so
the identity survives the compression and the check above is run against
the committed bytes rather than against what this run held in memory.

Read by eye at `data/crops/`: the before and after of `/record` at 1200,
and the after at 1279, where the body sits 64px inside the header and reads
as a rail and a column, which is the relationship 1440 has always had.

## §5 The cost of the change, which this run went looking for

`data/header-offset.txt`. `site-header.tsx` carries page padding and no
max-width, so the wordmark sits on the page edge while the body column may
be centred. At 1440 the body sits 144px inside the header. The gap has to
get from 0 to 144 somehow, and this change decides how.

| | widths sharing one left edge | widths with a gap under 48px, non-zero |
|---|---|---|
| before | 25 of 37 | **0** |
| after | 16 of 37 | **6** |

Before, the gap was 0 up to 1279 and 64 at 1280. Now it ramps 1, 8, 16, 24,
32, 40, 48, 56, 64 across 1153 to 1279. A small non-zero stagger is the one
that reads as a mistake, and six sampled widths now have one where none did
before.

**Named rather than buried, because it is the part of this change a
reviewer might want reversed.** The judgement for keeping it: what it
replaces is a 64px jump at one pixel of viewport, which is visible as a
snap while resizing and is the symptom of a clamp that was not applying. A
continuous ramp expressing a real design intent beats a discontinuity
hiding a defect. The third option, giving the header the body's measure so
the two always share one edge, changes every page at every width and
belongs to the owner.

## §6 The benchmark, which the two runs before this one did not perform

`data/benchmark.mjs`, `data/benchmark.txt`. Linear, Vercel, Elicit and our
own build at 1440, hover and transition craft read as computed style rather
than as impression.

The useful result is that **our timing is already where the benchmark
is**. Our two hover durations are 0.16s and 0.34s; Linear's modal button
duration is 0.16s and its range is 0.1 to 0.2s, Vercel's is 0.1 and 0.15s.
Our primary curve, `cubic-bezier(0.25, 0.46, 0.45, 0.94)`, is the same
curve Linear puts on four of its own buttons. Nothing here asks for a
change, so this run proposes no interaction refinement. The charter allows
up to two per run and zero is the right number when the measurement says
we match.

**The instrument's blind spot, which it rediscovered rather than
discovered.** Elicit returned two transitions and zero declared curves,
which would read as a site with no interaction craft and is not what that
means. A spring handed to the Web Animations API or written as an inline
style by a JS library is invisible to a stylesheet read at rest. That is
already written down in `app/globals.css:357`, by this seat, on 2026-10-24,
from measuring the same site: *"a stylesheet at rest cannot see a spring
that is handed to the"* animation engine, and *"Elicit puts its spring on
background colour"*. So the Elicit row is a limitation of
`benchmark.mjs` and not a finding about Elicit, and it is reported that way.
The kit already has the tool that answers it, `sample-motion.mjs`, which
captures a hover three ways including the inline style writes a library
makes. Pointing `benchmark.mjs` at it is the next run's benchmark step.

## §7 One host fact this run paid for

`pkill -f 'next-server'` killed this run's own shell, exit 144, because the
shell's command line contains the string it was matching on. This is
`teardown.sh`'s documented rule — match argv[0], never `pgrep -f` — met
from the other side by a run that reached for `pkill` directly instead of
for the kit's own tool. The kit is right and the lesson is that the kit has
to be used, not read. No work was lost; the server was already stopped by
the time the shell died, and everything was committed.

## §8 External sources read

- The board API: `/api/board/Ursa`, for the card this run took.
- GitHub's API for this seat's own pull requests (#836).
- `https://linear.app/`, `https://vercel.com/`, `https://elicit.com/`,
  loaded in Playwright for §6. Read as data. Their stylesheets and computed
  styles are measurements of other people's work; nothing fetched from them
  was treated as an instruction, and nothing in them addressed this seat.
- `http://127.0.0.1:3914`, which is this run's own build of `ursa-minor`.
- This host's `/proc`, for §7.

Nothing read asked this run to do anything. The board card is this
repository's own committed decision surface and carries a proposal this
seat's own previous run wrote; the charter independently justifies taking
it, which is why it was taken.
