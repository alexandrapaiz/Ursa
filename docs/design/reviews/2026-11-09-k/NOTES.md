# Frontend run, 2026-11-09 (fourth message wake, run k)

Every number in this file was taken this run unless it carries another
run's name. A number that is not here was not taken.

## 0. What I took, and why

Two things arrived in the wake. A note from HQ's engineer triaging this
seat's timed-out 01:53Z run, and the merge of `#765`.

The triage is not a finding against this seat and says so: the run was cut
by the host's sixty-minute wall after fifty-nine minutes of continuous
work and 355 assistant turns, so there is no rerun, because the same input
would hit the same wall. One half of it **is** ours, and that is §1.

For the lane item, the authority is this seat's own last run rather than
the wake. `reviews/2026-11-09-message-c/NOTES.md` §4 names what it did not
reach and calls them the next run's first items: the benchmark pass
(charter step 3) and the interaction refinement (step 4). That is §2 and
§3 here.

**Scope deliberately narrow, for the fourth time.** Three consecutive runs
of this seat were cut at the wall attempting both sweeps, the fix and the
polish in one hour, and Ursa/pm's handoff asks for a single run's scope to
fit the clock it is given. So this run resolved its inherited state in the
first ten minutes, then shipped §1 as its own commit before starting §2.

## 1. The leaked server, which is the half of HQ's note that is ours

HQ reported two `next-server` processes still listening from directories
that no longer exist, aged 2h54m and 1h24m, on a volume at 94 per cent.
Confirmed and stopped at the top of this run:

| pid | age | working directory |
|---|---|---|
| 161129 | 2h54m | `/tmp/epito-ursa-frontend-BBhu7I/ursa-minor` (deleted) |
| 1214161 | 1h24m | `/tmp/epito-ursa-frontend-ZIcHr7/ursa-minor` (deleted) |

Both are this seat's beyond doubt: the runtime names a seat's checkout
after the seat, and both paths are frontend checkouts that no longer
exist. `df` on `/tmp` read 42G of 45G before and after, so these two cost
memory and a listening port rather than disk. The disk figure in HQ's note
is the host's and not this seat's doing.

**The cause is not that the teardown was skipped. It is that the teardown
ran.** Both directories were gone, which is exactly what the kit's
documented step produces. The step was `rm -rf "$FE_RUN"` and nothing
else, so it disposed of the evidence and kept the garbage. Full reasoning,
including the self-matching defect in the first version of the repair, is
**L63**. The repair is `review-kit/teardown.sh` with
`selftest/check-teardown.sh` at 9 assertions, and the README's teardown
step now points at it.

This run's own server is stopped by that script at the end of §3, which is
the first time this seat's cleanup has been checked by the thing it fixed.

## 2. The benchmark pass, discharged by audit rather than by a web trip

Charter step 3 sends every run to the public web. **L32 is decided law and
it says not to, in this exact case:** the house already owns a measured
answer to the hover question, taken off Elicit's own animation engine, and
a fourth reading would produce a second spring, which is a second
identity. What a run owes instead is an audit of the value it reuses.

Audited this run, and it passes:

```
node docs/design/review-kit/make-spring.mjs \
  --damping 0.8 --duration 340 --wnT 8.88 --points 24
```

reproduces the committed `--spring-lift` literal in `globals.css`
**byte-identically**, and every claim its comment makes reproduces with
it: damping ratio 0.800, overshoot 1.50 per cent, peak at 207ms, first
reaches target at 163ms, no ring. The token is declared at `:root`
(`globals.css:191`, inside the `:root` block opening at 145), so the
reach defect L32 found and fixed has not come back.

Its consumers are `.cta` and `.quiet-link`, and both read it through an
`@supports (transition-timing-function: linear(0, 1))` guard.

**No external sources were read this run.** That is the line L32 made
legitimate, and this is the second review in this folder to earn it.

## 3. The refinement: the row that had the smallest hover on the site

Charter step 4, one refinement rather than two, measured first.

### 3.1 What the measurement said

`verify-hover.mjs` at 1440 over every hover rule the site has, then
`diff-frames.py` on the rest/hover pair. The whole table is in
`data/frame-diff-before.txt`. Three rows of it are the finding:

| control | box | hover is worth |
|---|---|---|
| `.rec-row`, the set view's record card | 960x106 | **218 px, 0.177%**, rows 27-27, cols 10-227 |
| `.quiet-link`, a button | 230x47 | 10995 px, 65.642% |
| `.sp-no_generation_provenance`, an inline span | 216x19 | 4024 px, 43.720% |

The primary control of the set view is the largest clickable box on the
site and had the smallest hover response on it by two orders of
magnitude, confined to a single pixel row: the id's underline and nothing
else. The tool's own closing line is that a hover worth fewer pixels than
the hairline it draws is a finding, and this is 218 pixels over a box of
101,760.

### 3.2 The remedy was already decided, six weeks before the control existed

`globals.css`'s "hover craft" note is the 2026-09-24 reading of Linear,
Vercel and Elicit, and its one sentence about a row says Linear washes a
hovered row with `rgba(255,255,255,0.03)` over 160ms. That reading was
translated into `.quiet-link`, which is a button, and the site's only
actual row never got it. So this is not a new decision. It is a decided
one that had not been applied to the surface it was about.

Light and not movement, which is that benchmark's actual finding: all
three sites animate light or colour rather than moving the control. No
lift and no spring here. `--spring-lift` stays on the two box-shaped
buttons it was measured for, because a third motion character would be a
third identity.

**On the item, not the button.** The `<li>` carries the padding and the
button does not, so a wash on the button alone is a band floating inside
the row with the padding dark above and below it. Keyed off the button's
hover so the wash answers the row's control rather than the address link
beside it. The item is geometrically untouched, which the frames confirm:
the rest frame before and after this change is **0 px different**, byte
for byte, so nothing about the row at rest moved, including the width of
its hairline.

| | before | after |
|---|---|---|
| hover worth | 218 px, 0.177% | **114,621 px, 92.826%** |
| extent | rows 27-27, cols 10-227 | rows 0-125, cols 10-969 |
| `.quiet-link` in the same sweep | 65.642% | 65.642%, unchanged |

Frames in `before/` and `after/`, read by eye and not only diffed.

### 3.3 The alpha is bounded, not borrowed

0.03 is Linear's figure, and the reason to keep it rather than reach for
`.quiet-link`'s 0.06 is that the row is roughly nine times that button's
area and a wash reads by total light rather than by alpha. The contrast
cost was measured off the photographed pixels rather than computed off
the stylesheet, sampling the row's own background band:

| wash | background | `--dim` metadata line | `--polar` id |
|---|---|---|---|
| none (at rest) | (2, 3, 8) | 5.13:1 | 11.99:1 |
| **0.03, shipped** | (9, 10, 15) | **4.95:1** | 11.56:1 |
| 0.06 | (16, 17, 22) | 4.70:1 | 10.97:1 |
| 0.08 | (20, 22, 27) | 4.51:1 | 10.53:1 |
| 0.10 | (25, 26, 32) | 4.32:1 BELOW | 10.10:1 |

So the wash costs 0.18 of a ratio point on the tightest text and the floor
does not break until roughly 0.08. Worth recording as a ceiling: the row's
metadata line, not its id, is what bounds how strong this wash may ever
get, and nothing on the surface says so.

### 3.4 Two defects the check found in the change itself

`data/check-row-wash.mjs`, 11 assertions, three viewport and motion
configurations. Both of these were in the first version of the CSS and
neither is visible in a screenshot.

**Reduced motion was overridden in the only state that moves.** The
hovered and pressed rules each set their own duration for the house's
160ms-in/260ms-out asymmetry, and both selectors outrank a bare
`.rec-item`, so `@media (prefers-reduced-motion: reduce) { .rec-item { … } }`
applied to the row at rest and lost to 160ms the moment it was hovered.
The check read `0.16s` where the rule above it said `1ms`. Copying
`.rec-row-id`'s shape was what produced this, and it is not enough:
that rule's hover sets a colour and never a duration, so it has no
conflict to lose.

**And one in the check, in the safe direction.** The first version of the
press assertion walked `document.styleSheets` and found zero `:active`
rules in a stylesheet that demonstrably contains three, so it passed the
"not sealed inside `(hover: hover)`" assertion by finding nothing at all.
It now reads the stylesheet the server serves. A check whose negative
case and whose broken case are the same output is not a check.

### 3.5 One thing reported rather than asserted

The live press read is advisory and says so in the file. Over five
invocations against one unchanged stylesheet, three saw the wash and two
did not, and the two that did not still did not after a full second of
polling, so the press is not arriving rather than arriving late. The
cause is in the page: the set view replaces its row nodes when the
fetched index lands, and a mousedown delivered to a node that is then
replaced leaves `:active` on nothing. That is worth someone's attention
on its own, and it is not this change's. A check that fails one run in
three for a reason unrelated to its subject trains its reader to ignore
it, so it reports and does not fail, and the claim it carried is carried
by the two stylesheet assertions instead.

## 4. Instruments

`diff-frames.py` defaulted its output to the relative path
`data/frame-diff.txt`, so a run standing at the repository root wrote
`data/frame-diff.txt` AT the repository root. That file is committed there
from two earlier runs of this seat, and `data/` at the root of this
repository contains nothing else. This run reproduced it a third time,
which is how it was noticed. L46 named this class and the repair applied
then was to print the destination; a run that reads its own output is not
a run that stopped writing it. The default is now beside the frames being
compared, which also puts it inside `$FE_RUN` with no argument from the
caller. The two committed copies are left alone, because the root `data/`
directory is outside this seat's writable surface. **One line for the
owner, if she wants it: `git rm -r data/` removes a directory that exists
only as this tool's accident.**

## 5. What this run did not do

- **No second interaction refinement.** The charter allows two. This one
  cost more than expected because the check found two defects in it, and
  shipping one verified change beats shipping two asserted ones.
- **No full page sweep.** `#765` carries this morning's before sweep
  across five pages and three viewports and it is on `main`; nothing in
  this run's diff touches a surface it measured except the set view row,
  whose rest frame is byte-identical.
- **No web trip.** §2, and L32.
