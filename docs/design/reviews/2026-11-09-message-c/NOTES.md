# Frontend run, 2026-11-09 (third message wake) — the board card the last run called unfixable, and the visual pass

Every number in this file was taken this run unless it carries another
run's name. A number that is not here was not taken.

## 0. What I took, and why

The wake was the merge of this seat's pull request for the focus ring
that its own fade mask was clipping away. It asked this run to continue
with the next item in the lane.

The lane had nothing waiting in Backlog, This sprint or In progress. It
had one card in Review with a merged pull request behind it. So this run
cleared Review first, and in doing so found that the last run's closing
lesson was wrong.

## 0.1 Two runs, one pull request, and why this file changes hands

The paragraph above was written by the 01:53Z run of this seat. That run
was cut by the host wall clock at 60.2 minutes, mid-sweep, with this
sentence reading "More follows as the run proceeds" and no `after/`
directory on disk. It left its branch pushed and its pull request a
draft, which is the one outcome the amended ship-first rule in
`prompts/frontend-agent.md` calls a defect.

The 03:07Z run of this seat, which is writing from here down, inherited
it under "Read your own seat's open PRs first". It did not start a second
version. It is the same branch and the same pull request, and the first
act of the hour was to resolve the draft rather than to add to it.

**Three consecutive runs of this seat have now hit the same wall, on the
same shape of workload: both sweeps and the fix in one hour.** So this
run does not attempt that shape again. It ships what the first hour
measured as its own increment, with the sweep read by eye, which is the
charter's defining rule and the step the clock took. What the increment
does not contain is named in §4 rather than left to be inferred from a
missing directory.

## 1. The instruments, which were wrong before the site was

Both tools were pointed at the set view, a surface neither had ever
measured, because its record rows only exist after a fetch and reaching
them needs `--state`. Both were wrong on the first attempt, in the same
direction: they reported the **site** as defective.

| tool | what it said | what was actually wrong |
|---|---|---|
| `measure-hit-areas.mjs` | the record-address link is SHORT of the 44px floor by 29, six times over three viewports | the 2.5.8 sentence exemption counted words only in a bare text node sibling. This link's neighbouring words are inside a `<span>`. One line box, one sentence, zero bare text siblings. |
| `measure-focus.mjs` | 3 tab stops of 11 on the set view, and 5 controls the keyboard cannot reach | the walk cleared focus with `blur()`, which does not move the sequential focus navigation starting point that Tab consults. Under `--state` the walk began wherever the drive had left the focus and called everything above it unreachable. |

Neither was a site defect and no committed number was wrong, because the
only `--state` module used with the focus tool before today set
attributes and never moved focus. Both would have been read as site
defects by a run that believed its instrument.

**The corroboration trap, for the third time in this ledger.** A walk
that begins late deflates the stop count and inflates the unreachable
count *together*. The two headline numbers agree with each other while
both are wrong, and agreement between two numbers out of one broken pass
is not evidence. L61 is the same shape, and so is L62 in a different
medium: three refusals that share one path are one observation.

The hit-area fix is fenced by a fixture case of two abutting inline-block
buttons, because a rule that exempts anything with words beside it would
exempt a toolbar, which 2.5.8 does not. `check-hit-areas.mjs` is at 18
assertions, `check-focus.mjs` at 31, and `after-drive.html` fails three
of its four assertions on this morning's code, which is how the focus fix
was checked rather than asserted.

## 2. The sweep, after the instruments were fixed

| sweep | result |
|---|---|
| overflow, 15 frames | 0px on every one; document width equals viewport width at 390, 820 and 1440 |
| narrow, 4 widths x 5 pages | 0 of 20 cells out of reach, 0 overflow reachably, 7 full-bleed decorations exempt |
| contrast, 533 text runs | 0 below threshold at the median, 3 inactive and exempt, 24 too small to sample; worst inter-shutter drift 0.000% of the frame |
| focus, main sweep | 86 stops over 5 pages and 3 viewports: 0 below a floor, 0 unreachable, 0 unstable |
| focus, set view under `--state` | 33 stops: 30 `ok`, 3 `COMPOSITE`, 0 below a floor, 0 unreachable |
| hit areas, set view | 0 of 8 standalone controls under 44px, from 2 of 10 |

The three `COMPOSITE` verdicts are one control, the site-address input,
at all three viewports. It carries a ring and a low-contrast wash
together and its clearing pixels alone cover a 1px perimeter, which is
the L60 distinction between a composite indicator and one below the
floor. Not a defect.

**One number I checked rather than accepted.** The contrast sweep exempts
`button.cta` at 4.04 as inactive under 1.4.3, and an exemption that
turns a failure into a pass is the kind a sweep should not be trusted on
alone. `app/page.tsx:93` carries `disabled` and `aria-disabled="true"`
with `disabled:opacity-55`, so the control is genuinely inert and the
exemption is correctly applied.

## 3. What I read in the pixels

Eighteen frames, five surfaces by three viewports, sliced so the type is
legible rather than read at a thumbnail scale. The sweeps above cover
geometry, contrast and the keyboard. What they do not cover, and what
reading is for, is whether a frame makes sense to a person. One thing
did not.

### 3.1 The set view's provenance legend has no key

On the set view each record card draws a 6px provenance bar and prints
three figures beneath it:

```
40.4% survived verbatim    23.6% survived mutated    34.1% no generation provenance
```

Sampling the bar's own pixel rows at 1440, the three marks are:

| class | fill | colour |
|---|---|---|
| `survived_verbatim` | all 6px | `--polar`, rgb(168,199,250) |
| `survived_mutated` | top 4px, 2px foot of `--night` | `--polar`, rgb(168,199,250) |
| `no_generation_provenance` | all 6px | rgb(116,121,134) |

Two of the three are the same colour and differ only by that foot. So
nothing in the frame joins a figure to a segment except the fact that
both lists happen to run in the same order, which a reader has to notice
and then trust.

**At 390 even that is gone.** The bar stays horizontal and the legend
stacks into a vertical column, so the only correspondence the desktop
frame had is removed outright.

**The remedy was already in the repository, on the other rendering of
the same bar.** `components/record/record-summary.tsx` puts
`<span class="rec-swatch rec-seg-{c}">` before each label, and
`globals.css` already scales the edited mark's foot to a third of its
height at 0.5rem for exactly that use. The record view has carried the
key since it was written. The set view, drawing the same bar from the
same three classes, prints the figures alone. Two renderings of one
object, one with a key and one without, is the defect.

Fixed in `components/record/published-site.tsx` by adding that same
swatch, with no new class, no new value and no new colour.

### 3.2 Two things that looked wrong and are not

Written down because a later run will see them and reach for the same
thread.

**The bar's track is not full.** 40.4 + 23.6 + 34.1 is 98.1, and the
right-hand 1.7% of the track stays at `--line`. The page says why,
directly underneath: "The three shares divide the whole finished work
rather than the classified part of it, so they fall short of 100% by
however much a run could not account for." The gap is the point and it
is explained in prose. Which sharpens 3.1 rather than softening it: the
thing that needed no key got a sentence, and the thing that needs one
got nothing.

**The home page's primary call to action is dim.** `GET POLARIS` reads
at 4.04 against a 4.5 floor. It is `disabled` in the markup. Inert by
intent, exempt by 1.4.3, not a contrast defect. Whether a dead primary
button is the right thing on that page is the owner's call and not this
seat's.

## 4. What this run did not do

- **No benchmark pass and no interaction refinement.** Charter steps 3
  and 4. This is the clock, not a judgement that they are unnecessary.
  They are the next run's first items.
- Three consecutive runs of this seat have been cut at the 60-minute
  host wall attempting both sweeps, the fix and the polish in one hour.
  This run deliberately shipped a narrower thing and resolved its draft
  in the first ten minutes instead.
