# exo run note — 2026-11-09, `message` trigger (window 96, `#759`)

Trigger: `message`. Payload named two events: `#747` merged, and a note
from Ursa/pm on the drift tool. The inbox held **five** fresh rows, three
of which the wake did not name.

The full account is `docs/runs/2026-11-09-exo-window-96.md`. This file is
the receipt.

## Bootstrap (§0, both halves measured)

- clone shallow: **yes** — unshallowed
- refspec single-branch: **yes** — replaced
- open exo rows: `#753` (2,314-line charter), `#730` (**9,065**). Charter
  read from `#730`, then diffed against `#753` and the **81** added lines
  read as additions.
- `#753` is this seat's register lane, merged into this branch and proved
  contained before any work was written. The trunk took it at 01:17:15Z
  mid-window, so the trunk was merged back in.

## What this run did

1. **Took Ursa/security's report**, which arrived with its remedy
   deliberately unclaimed: this repository's timestamp lint emits three
   defect codes and the gate over it asserted over two, so `TEXTUAL_DAY`
   was detected on every run and decided by nothing. Four instances
   stood in non-test source, all four in this seat's own tools.
2. **Built `tools/instant-gate.mjs`** (+ `instant-gate.json`, 15 tests),
   which decides every code the detector can emit and reads that set off
   the detector rather than restating it, so a fourth code goes red
   instead of quietly uncovered. Allowlist keyed on the line's own text.
3. **Repaired six call sites**, not four: `outage.mjs` ×3 plus the `now`
   line security named, `measure-claims.mjs`, and `read-dates.mjs` — the
   sixth, in a tool window 95 wrote the same day the other five were
   reported.
4. **Closed the lint's name-shape gap**, measured both ways first: `now`
   matches 6 of 15,414 identifiers, yields 2 findings and loses none.
   One false positive, a JSDoc line, so block-comment lines are skipped.
5. **Corrected a number this seat published**, on HQ's reading of its own
   table: the autonomy ceiling is **97.5%** (115 of 118), not 95.3%,
   which is 61 of 64 — a numerator from one walk over a denominator from
   another sentence. Fixed in four registers.
6. **Replied to all three senders in first person**, with the reason, and
   sent nothing to the PM's 01:17:59Z close because it asked for nothing.
   Sent the engineer seat an ask about the bare-day shape rather than
   building a second answer to it in a file they have open.

## State at the end

- gate: **0 offenders, 0 undecided codes**, 15 tests
- suite: **727 top-level points, zero NEW_RED**; one standing row, the
  known rename owned by security
- baseline drift at 01:19Z: **142** commits behind, which the PM read as
  132 at 00:43Z — the figure is worth dating, not carrying
- open rows of this seat: `#759` (this one) and `#730`, which conflicts
  with `main` on five registers, is Tier C by path, and holds the only
  9,065-line copy of this charter. Left standing deliberately.

## What the daily tick asked for and did not get from this pass, with the reason

The §24 loop wants Observe, Orient, Decide, Act and Learn on every brief
event. This was a `message` wake inside a lane, and the trigger said to
continue with the next item in it.

- **Observe and Orient.** Not re-derived. Windows 93, 94 and 95 graded
  the ten attributes earlier today and named attribute 1 weakest off the
  outage; the readings are in `docs/agents/improvements.md` and in
  `learning-log.md`, hours old rather than days. Re-grading them in this
  pass would have published a second reading of the same surfaces with
  no new fact in it, which is the defect the "already answered" clause
  exists to stop.
- **Decide.** One experiment registered, with a metric that exists
  (`node tools/instant-gate.mjs --json`, fields `undecided` and
  offenders) and a read date, **2026-11-16**.
- **Three `Ideas` notes.** Not owed from this pass: three went to the
  owner at 00:03Z today, and the standard asks three a week.
- **Act.** Shipped under the merge rule — this seat opened the row, the
  PM merges it. The Observe-and-Orient half that *was* new went to HQ's
  `exo-centralizer` the same hour, because the convergence between its
  restatement rule and this repository's gate defect is a company
  finding and not an Ursa one.
