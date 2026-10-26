# Visual review, 2026-10-26d (message run)

**What this run took.** The board carried no frontend item in Backlog,
This sprint or In progress, so the next item came from the lane's own
record. The run before this one closed its pull request by naming what it
had not done: "the overlay's three controls have no hover transition of
any kind. That is named so the next run does not have to rediscover it,
and it is the item that wants a benchmark pointed at Elicit's spring."
This run is that item. An item was created on the board for it and moved
to In progress.

The run was woken by four bus events before that, and §1 answers them
first, because three of them were already closed before this run started
and the fourth was closed two minutes before it started.

| | before | after |
|---|---|---|
| the panel's two buttons | no transition of any kind, `duration 0s` | the house's benchmarked hover, 1.50% overshoot, peak 203ms |
| the passphrase field | its own 44px target was on top of it; four pointer gestures gone | all four back, and the target is still 348x44 |
| `misread?` | drawn in Arial, inside a sentence set in Inter Tight | the panel's own face |
| `rule ×4` at 320 | broke after `rule`, reading as two labels | one term, one line |
| `--spring-lift` | declared on `.dash`, which scoped it to the dashboard, and unused there | on `:root`, reaching the panel for the first time |
| `hover.mjs` | could not reach any control behind a state | `--state` and `--until`, the seams the other two tools carry |
| `redaction-check.mjs` | two false hits on every run of this seat | agrees with the gate, and says what it dropped |

---

## 1. The four events this run was woken for

Three were `redaction-gate` failures on this seat's branch
`ursa-frontend/2026-10-26-hook`, at 09:03, 09:17 and 09:28. The fourth
said that #484 on that branch was an idle draft that no gate could reach.

**All four were already resolved when this run started at 09:40.** The
run before this one fixed the gate at 09:37 and took the pull request out
of draft at 09:38. Verified rather than taken on trust: the branch's
latest run is a success at its current commit, the pull request reports
`isDraft: false` and `mergeStateStatus: CLEAN`, and the gate's own three
patterns over this tree find nothing. Nothing was rerun and nothing was
re-fixed, which is what L-E10 asks for. It is written on the board as a
comment on this run's item.

**The cause, from the log.** One line:

```
./docs/design/reviews/2026-10-26c/data/state-panel-synced.mjs:26:
  sessionFile: '7f3a91c4-…-…-…-… .jsonl',     <- 36 characters in the log
```

A fabricated session id in a review fixture, in the full 36-character
shape a real one has. **It is elided above, and that is not decoration.**
Quoting the gate's own failure log verbatim puts the string back into the
tree and fails the gate again, one directory over. The first draft of
this file did exactly that, and §7's fix is what caught it, on the run
that wrote it. The gate cannot tell a fabricated identifier of
that shape from a real one and is right not to try, because an identifier
of exactly that shape is what leaked in Ursa incident 2. The gate behaved
correctly on all three failures.

**The part worth keeping is §7**, because this is the second time this
month this seat turned this gate red this way: five times in eleven
minutes on 2026-10-25, three times this morning. A script to ask the
question locally already existed both times.

## 2. The panel had no interaction at all, and the reason is mechanical

Measured before anything was changed (`data/hover-before.txt`). Both
buttons report `property all / duration 0s / timing ease`, and the run
button's transform at 200ms into a hover is `none`. There is nothing to
scrub because there is nothing transitioning.

The reason is not that somebody forgot. Every rule on both controls was
an inline `style` object in `page.tsx`, and **there is no way to write
`:hover` in one**. The states were not omitted, they were unexpressible.
So the presentation moves into `globals.css`, where this panel's other
presentation already lives, and the states become possible to write.

**The instrument could not reach the controls either, which is the other
half of why this went six reviews without being filed.** `hover.mjs` took
a URL and nothing else. The panel draws one control before a key is
derived and three more after it, so every control this run was asked to
look at lives behind a state no URL names. `shoot.mjs` and
`measure-hit-areas.mjs` both grew `--state` on 2026-10-26 for exactly
this; `hover.mjs` had not. It has it now, with `--until`, on the same
contract, and the first thing it did with it was produce the paragraph
above.

## 3. The feel is the house's, not Elicit's, and not this run's

The charter's step three asks for a benchmark of interaction craft, and
the owner has named the feel she wants more than once: Elicit's bouncy
hover. **That benchmark has already been done, properly, and the finding
is better than the brief.** The 2026-10-24 run put the question to
Elicit's own animation engine rather than to its stylesheet at rest, and
got 400ms, damping ratio 0.80, 1.51 percent of overshoot, peaking at
236ms, ringing exactly zero times. The correction worth having is in that
run's own words: "bouncy there is one and a half percent of overshoot,
not a bounce, and the property it is applied to is background colour,
where an overshoot of that size cannot be seen at all. So what carries
the feel is not the size of the spring. It is that the motion arrives,
goes a hair past, and settles, instead of stopping dead on its mark."

So this run did not go and measure a fourth site. It applied a vocabulary
the house already owns to a surface it had never reached, which is the
cheaper and more consistent answer and is what "the design system is law"
means. What this run owed instead was an audit of the value it was about
to reuse, and that is in §4.

**Nothing was fetched from the public web on this run.** §9 says so
plainly rather than leaving it to be inferred.

## 4. The spring, audited rather than trusted

A token copied between files is a token that can drift. Both instruments
the kit carries for this were pointed at it, offline:

```
$ node docs/design/review-kit/read-spring.mjs --easing '<the committed value>' --duration 340
 "peak": 1.015,  "peakAtMs": 207,  "overshootPct": 1.5,
 "dampingRatio": 0.801,  "monotone": false,  "undershootPct": 0
```

0.801 against the 0.80 its comment claims, 1.5 percent against 1.50, peak
at 207ms against 207ms. And `make-spring.mjs --damping 0.8 --duration 340
--wnT 8.88 --points 24`, the command its own comment records, regenerates
the literal **byte-identically**. The two committed copies, in
`ursa-minor` and in the overlay, were also compared byte for byte and are
identical.

**One of those two copies was unreachable from the surface that needed
it.** The overlay's copy was declared on `.dash`, which is a scoping
class on the dashboard page, so the panel could not see it at all, and
nothing in `dashboard.css` used it. It moves to `:root` in `globals.css`,
which the root layout imports, so one declaration now serves both pages
and the dashboard keeps it by inheritance. A pointer is left where it
was, because a reader of that file should not have to grep for it.

## 5. The two refinements, and what each is verified by

**The run button**, which is `.cta`'s shape in the panel's palette. The
border walks from `--line` to `--accent`, the fill goes to `--line`
(the token whose meaning here is already "the accent at a fourteen
percent film", so no value is introduced), and the box lifts one pixel on
the spring. Scrubbed by hand across the whole transition
(`data/hover-after.txt`):

```
  from 0px to -1px
  frames past the target: 26
  peak -1.0150px, overshoot 1.50% of travel
```

The spring is on the geometry, which is the half of the 2026-10-24
finding that Elicit itself does not do: it puts its spring on background
colour where 1.5 percent cannot be seen. Here it lands on the only
channel that can show it.

`crops/run-rest-4x.png` and `crops/run-hover-4x.png`.

**`misread?`**, which is `.dash-action`'s shape with one deliberate
difference. `.dash-action` keeps its underline present and transparent so
it fades in without moving the line. This button's dotted underline is
visible at rest on purpose: it sits inside a sentence, with no box and no
colour of its own, so the underline is the only thing marking it
pressable. Taking it away at rest to buy a fade would cost more than the
fade is worth. So the colour alone transitions and the underline follows,
because `text-decoration-color` is left at its initial `currentcolor`.

That is a claim about an implicit dependency, and `hover.mjs` cannot
check it: it pauses only the transition matching the property it was
asked about, so asking it for `text-decoration-color` leaves the colour
transition running live and reads an in-flight value at an unknown time,
which is what the first attempt did. `data/underline-tracks-colour.txt`
scrubs the colour by hand and reads both properties out of one
`getComputedStyle` call:

```
hovered, scrubbed   0ms: rgb(139, 147, 167)  rgb(139, 147, 167)  same
hovered, scrubbed  80ms: rgb(161, 187, 231)  rgb(161, 187, 231)  same
hovered, scrubbed 160ms: rgb(168, 199, 250)  rgb(168, 199, 250)  same
```

`crops/action-rest-4x.png` and `crops/action-hover-4x.png`.

**The wash cannot darken the label below the floor, which is the one
thing a new hover colour can break and a stylesheet cannot tell you**,
because `--line` is an alpha value over a translucent panel over whatever
the user's terminal is showing. Read off the photographed pixels rather
than off the stylesheet (`data/hover-contrast.txt`): 10.87:1 at rest,
**6.69:1 hovered**. 2.19 points of headroom over the 4.5 floor, which
comfortably absorbs the 2.08-point range L28 measured for this panel's
glass.

**Reduced motion and touch**, both required by the charter and neither
visible on the page the review was shot on (`data/motion-and-touch.txt`):

```
prefers-reduced-motion: reduce
  .panel-run     border-color, background-color / 0.16s, 0.16s   (transform dropped)
  .panel-run transform while hovered: none
  .panel-action  color / 0.001s

touch, with the hover media feature forced to none via CDP
  matchMedia("(hover: hover)")   false
  .panel-action, pointer over it rgb(139, 147, 167)   (resting --dim: no hover leak)
  .panel-action, pressed         rgb(168, 199, 250)   (--accent)
  .panel-run, pressed, fill      rgba(168, 199, 250, 0.14)
```

The first attempt at the touch half reported that `:active` did not fire.
That was the probe being wrong and not the stylesheet: it dispatched a
synthetic `pointerdown` with `dispatchEvent`, and an untrusted event does
not put an element into the active state, by design. The press above is a
real one.

## 6. The defect the hover work walked into

**The field's 44px target was sitting on top of the field.** Found by
`hover.mjs` refusing to hover it, which is not a tool failure and is
where the whole finding came from.

`.panel-field::after` spanned `inset: calc((100% - 44px) / 2) 0`, which
on a 35px field is the full width and 4.5px past each edge. A
pseudo-element of the wrapping `<label>` is not a child of the input, so
**every pointer event over the field landed on the label and none reached
the control**. `document.elementFromPoint` returns `label.panel-field` at
the field's centre, at ten percent in from its left, and 2px below its
top edge, at all three viewports (`data/field-pointer-before.txt`).

Four ordinary things a pointer does to a text field were gone:

| | before | after |
|---|---|---|
| cursor over the field | `default` | `text` |
| click near the left edge | caret at 21, where the text ends | caret at 0, where you clicked |
| drag across the text | selects nothing, and drops the caret to 0 | selects 0 to 21 |
| **double click** | **blurs the field** | selects, and keeps focus |

A `type=password` field hides its own text, so caret placement matters
less here than in a visible field. It does not matter zero. Someone who
mistypes one character of a long passphrase cannot click to fix it, and a
double click, which is what a person does when they want to replace what
they typed, puts the field out of focus instead.

**Why six reviews and a tap-target sweep all passed it.** The only thing
anyone had ever checked was that a press opens the field, and it does,
because a label forwards activation natively. The instrument asks whether
the control can be activated, and the answer was yes.

**The fix keeps the mechanism and moves the slack outside the control.**
Two bands, one above and one below, each
`height: calc((44px - 100%) / 2)` and out of flow. The input's own 35px
is then the topmost thing over itself; the bands belong to the label and
still forward activation, so a finger landing a few pixels high or low
still opens the field. 44 contiguous pressable pixels, and not one of
them over the field.

**The obvious version of this fix does nothing and looks right**, which
is worth writing down. Giving the label 4.5px of padding and handing it
back as margin computes `(44px - 348px) / 2`, because a percentage in
`padding` resolves against the containing block's *width*. It goes
negative, the parser drops it, and the whole declaration is silently
inert. A percentage in `height` on an out-of-flow box resolves against
the containing block's *height*, which is the 35px wanted, and is how the
original `inset` worked.

**It cost nothing, measured three ways.** The tap-target instrument
reports `348x35` drawn and `348x44` pressed before and after, at all
three viewports. The frame diff of the locked panel is **byte-identical
at all three**. And the pointer probe re-run returns `input.mono` at
every point over the field and `label.panel-field` in the band above.

## 7. The redaction check was crying wolf, which is why nothing ran it

This is this run's durable answer to §1, and the reason it is a finding
rather than a shrug.

`scripts/redaction-check.mjs` exists precisely to catch what went red
this morning, before a push. Pointed at this tree it reported two
violations, both inside `ursa-major/overlay/.next/`. That is build
output. It is gitignored, it is regenerated by the `next build` this
seat's charter orders **every run**, and the gate runs on a fresh
checkout where it does not exist. Every one of those hits is a finding
the script invented and the gate can never make.

So the one tool that could have prevented four red runs is red whenever
the seat that most needs it has built the app, which is always. The real
hit, when it came, would have arrived as a third line under two the
reader had learned to scroll past.

Hits in paths git ignores are now dropped, and **the count of what was
dropped is printed on every run, including a clean one**, because a
filter nobody can see is a filter nobody can audit:

```
Redaction gate clean (3 patterns, read from the workflow). 2 hits in
gitignored paths not counted; the gate runs on a fresh checkout and
cannot see them.
```

Untracked files that git does *not* ignore are still reported, which is
the case this exists for: a new file about to be committed is exactly the
shape of this morning's failure. If git is missing or the root is not a
repository, the filter returns everything rather than passing quietly.
Four tests cover it, including the no-git case, because a filter that can
become a no-op the wrong way is worse than no filter. Twelve pass.

**It paid for itself on the run that fixed it.** The first draft of this
review quoted the gate's failure log verbatim, which put the 36-character
id back into the tree one directory over from where it was removed this
morning. The fixed checker caught it before the push, on the last commit
of this run, which is the fourth red run it would otherwise have been.

## 8. The visual pass, and the one thing reading the frames turned up

Eight frames, frozen, at 1x: the locked panel and the synced panel at
phone 390x844, tablet 820x1180 and desktop 1440x900, and the synced panel
at 320. I read every one.

**`rule ×4` was breaking after `rule` at 320.** The label column is a
`1fr`-adjacent flex item with `minWidth: 34`, and `rule ×4` at 10px
monospace is wider than that, so the term broke and `×4` landed on a
second baseline beside the statement's own second line. The eye reads
rows, and the left column read as two labels where there is one
(`crops/label-wrap-320-before.png`). It is one term and it should not
break. `whiteSpace: nowrap`; `minWidth` is a floor and not a ceiling, so
the column grows to fit.

It is confined to the width that had the defect, measured rather than
assumed: 315 pixels change at 320, all of them in rows 62-84 and a 41px
span of columns, and the three charter viewports are **byte-identical**.
Only `rule ×N` was ever wide enough to wrap; `case` and `tension` are one
word each.

Nothing else. No frame overflows its viewport at any of the four widths,
the narrow sweep reports `0 of 4` cells out of reach in both states, and
the header, the three tuning rows, the verdict line and the metadata line
hold their grid at 320.

**One resting pixel changed that was not asked for, and it is a third
finding rather than a side effect.** Moving `misread?` into a class gave
it `font: inherit`, and measured on the shipped build before the change
(`data/font-before.txt`) that button was drawn in **Arial**, inside a
sentence set in Inter Tight. Chromium's user agent stylesheet gives a
`<button>` its own family and a `<button>` does not inherit one, so the
one control on this panel that named no family was the one word on the
page in a typeface nobody in this repository chose. The run button
escaped it only because `className="mono"` happens to name one. That is
the placeholder-colour finding of the run before this one arriving
through a different door, and the same answer applies.

Its cost is bounded and was measured: 280 pixels at every viewport, in
rows 161-171 and a 45px span of columns, which is the bounding box of
that word and nothing else. Same frame size at all three, so the button
growing from 12px to 16.5px tall stayed inside the line box it sits in.
`crops/misread-font-before.png` and `crops/misread-font-after.png`.

## 9. External sources read

**Nothing was fetched from the public web on this run**, which is a
change from every recent review in this folder and is deliberate: §3 is
the reason. The benchmark this run needed was already in the repository,
measured by an earlier run and recorded with the command that regenerates
it, so the honest move was to audit that value rather than to go and take
a fourth reading of somebody else's site.

What was read:

- This seat's own branches, pull requests and workflow runs, through
  `gh pr list`, `gh pr view 484`, `gh run list` and `gh run view
  40299823210 --log-failed`. The failing log is quoted in §1.
- The company board over HTTP, for this seat's lane. The items are other
  seats' and the owner's; none addressed this run or asked it for
  anything, and none was acted on.
- This repository's own committed files: the charter, the design ledger,
  the review kit and the two products' stylesheets.
- The toolchain's console output, and the three local servers, all built
  from this checkout.

Nothing read from outside this repository's committed files directed this
run's work, and nothing attempted to. The `next build` advisory that the
2026-10-26 review recorded, which asks the agent to put a question to the
user on a dependency's behalf, did not appear on any of this run's three
cold builds. Its absence is not evidence that it is gone.

## 10. The build

Three cold builds of `ursa-major/overlay`, each after `rm -rf .next`, all
three clean on the first attempt. That is a second run's worth of
evidence against the `SecurityFatalError` the 2026-10-26 review recorded
on every cold first build, and it still does not settle it: that review
has several observations and this one has three.

Every frame here is from `next build` followed by `next start`, never
`next dev`. **The server was checked against the build rather than
assumed**, which the kit's README asks for after a run lost an hour to a
stale one: the process start time postdates `.next/BUILD_ID` on both
builds that were photographed. This run also reproduced the trap that
caused it, and it is worth naming twice: `pkill -f "4961"` matched the
shell running the command as well as the server and killed the shell
first. Nothing is safe to `pkill` by port number here.

## 11. Proposals, and things not this seat's to change

**11.1 The narrow sweep and this run's label fix both argue for the same
thing.** L26 already proposes that below-390 be a check rather than a
habit. This run found a second defect that only exists at 320, in a
different product, two days later, by reading a frame nobody would have
shot without L25. That is two for two. It remains the engineer's surface.

**11.2 `.panel-hit`'s overlay is the same shape as the one §6 fixed, and
it is fine, for a reason worth recording so nobody "fixes" it.** It is an
`::after` on the button itself, so it is a child of the control and
pointer events over it reach the control. The field's was on a wrapping
label, which is a different element. The distinction is what makes one of
them a defect and the other correct.

**11.3 The run button's resting border is nearly invisible.** `--line` at
14 percent on `--panel` reads as an unbordered dark box at rest, and the
hover now makes the border appear rather than brighten. That reads well
and may be exactly right. It is also a question about the panel's
identity, which is the engineer's and the owner's rather than this
seat's, so it is named and not changed.

**11.4 Both items from the 2026-10-26 review's §7 are closed**, by #484
and verified here. §9.1 of the 2026-10-26b review is still open: the same
four span names are rendered with underscores on one page of `ursa-minor`
and with spaces on another, and picking one is a product decision.
