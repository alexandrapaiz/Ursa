# Dispatch queue — 2026-10-24, ~17:0x UTC, message (eighty-sixth pass)

`PM_DISPATCH_ENABLED` is unset in this run's own environment, so
nothing fires below regardless of what qualifies. Written in full per
pm.md §0b.

## This run's inbox

A dispatch bundle: review research's #358 and exo's two conflicting
chains (#337, #362) against the merge rule, plus exo's own board
reply (16:39Z) confirming the conflict this seat named at 16:33Z and
recommending a specific order. Full account in `docs/sprints/pending.md`'s
eighty-sixth-pass entry; this file covers only what was considered for
dispatch and why nothing fired.

## Failed-run triage this run (§11.7)

`gh run list --limit 30` shows no new failures since the eighty-fifth
pass's own read five minutes before this one started.

## Candidates considered, none fired

1. **Research's #358, closed as superseded by #366.** Not a dispatch
   candidate once checked: research's own fourteenth run already
   absorbed it, confirmed by ancestry. #366 itself is green and
   growing, no criterion met.
2. **Exo's #362 and the closed #337.** Tier C (`prompts/exo-agent.md`),
   same standing freeze as every pass since 2026-10-18. Exo is
   excluded from dispatch outright regardless of criterion. Named in
   pending.md, not fired.
3. **The ledger-reconciliation gap found in #337.** Not a dispatch
   candidate: it is this seat's own backlog-grooming duty (pm.md §2),
   not a defect in another seat's run. Flagged in pending.md instead.
4. **No ADR or ruling merged since the last pass names a seat with no
   run following it.** Checked `docs/decisions.md` on the current
   branch tip; nothing new since the eighty-fifth pass's own read.
5. **No milestone due within three days.** `gh api
   repos/alexandrapaiz/Ursa/milestones` returns an empty list.

## Dispatched by the PM

None this run. `PM_DISPATCH_ENABLED` is unset, and even if it were
enabled, nothing above met a firing criterion this seat can act on.

---

# Dispatch queue — 2026-10-24, ~16:4x UTC, message (eighty-fifth pass)

`PM_DISPATCH_ENABLED` is unset in this run's own environment (`echo
"PM_DISPATCH_ENABLED=$PM_DISPATCH_ENABLED"` prints nothing), so nothing
fires below regardless of what qualifies. Written in full per pm.md §0b.

## This run's inbox

A dispatch bundle naming three pull requests to review against the
merge rule (#346, #357, #362) plus a standing note about three draft
pull requests with no live run behind them (#356, #355, #357). Full
account of what was found and done with each is in
`docs/sprints/pending.md`'s eighty-fifth-pass entry; this file covers
only what was considered for dispatch and why nothing fired.

## Failed-run triage this run (§11.7)

`gh run list --limit 30` shows exo's `redaction-gate` failing again,
this time on `ursa-exo/2026-10-24-hook` (#362, 16:36:34Z) at the same
`scan` step the eighty-fourth pass already diagnosed for #350: full,
untruncated conversation UUIDs in `docs/agents/learning-log.md` and
`docs/agents/incidents.md`. Read the log past the failing commit per
§0b rather than re-diagnosing from zero: this is the same unhealed
cause, not a new one, and #362 is built on #350's head so it inherited
it. Same disposition as before — exo's own fix, exo is excluded from
dispatch outright (boundary list), named in pending.md and not acted
on.

## Candidates considered, none fired

1. **The three named drafts (#356, #355, #357).** Checked live rather
   than assuming the note's "idle 2h" / "no live run behind it" still
   held: all three had already moved. #356 closed by frontend's own
   later run. #355 closed by research's own later run, pointing to
   #358. #357 merged (as its superseding #363) this pass under Tier B.
   No dispatch row applies to a draft a seat has already resolved on
   its own.
2. **#362's Tier C status and live redaction-gate failure.** Not a
   Minor-site or Major-resolver path, so it matches neither of this
   seat's two failure-shaped dispatch rows, and exo is excluded from
   dispatch under any criterion regardless. Named in pending.md, not
   fired.
3. **The exo fork (#337/#288 vs. the #344/#350/#362 line).** Still no
   dispatch row covers "two of a seat's own open PRs conflict with
   each other" in a way this seat can act on for exo specifically
   (exo is excluded from dispatch outright). Named for the owner or a
   chair, not fired.
4. **No ADR or ruling merged since the last pass names a seat with no
   run following it.** Checked `docs/decisions.md` on the current
   branch tip; nothing new since the eighty-fourth pass's own read.
5. **No milestone due within three days.** `gh api
   repos/alexandrapaiz/Ursa/milestones` returns an empty list.

## Dispatched by the PM

None this run. `PM_DISPATCH_ENABLED` is unset, and even if it were
enabled, nothing above met a firing criterion this seat can act on.

---

# Dispatch queue — 2026-10-24, ~16:3x UTC, hook (eighty-fourth pass)

`PM_DISPATCH_ENABLED` is unset in this run's own environment (`echo
"PM_DISPATCH_ENABLED=$PM_DISPATCH_ENABLED"` prints nothing), so
nothing fires below regardless of what qualifies. Written in full per
pm.md §0b.

## This run's inbox

A hook event, not a board message: "capacity returned... do the one
run your charter describes." Checked the board inbox
(`to_seat=pm`) and GitHub state anyway, per §0b, rather than treating
the hook's silence on specifics as nothing to check.

## Failed-run triage this run (§11.7)

`gh run list --limit 30` shows two failures in the last day, both
`redaction-gate` on `ursa-exo/2026-10-24-message-8` (13:48:26Z and
13:49:22Z), both at the `scan` step. Read the log past the failing
commit before classifying, per §0b: the grep hits are real — full,
untruncated conversation UUIDs in `docs/agents/learning-log.md` and
`docs/agents/incidents.md`, which the gate requires truncated to 8
characters. PR #350's current tip is the same commit that failed, so
this is not a self-healed tripwire; it is live and red. Not a workflow-
file defect (the gate itself is doing its job correctly), so the
"zero jobs in zero seconds" exception from the 2026-09-30 incident does
not apply here. This is exo's own charter-stack PR, not a Minor-site or
Major-resolver path, so it does not match either of this seat's
failure-shaped dispatch rows, and exo is excluded from dispatch outright
(boundary list: "Never exo, yourself, or sales"). Named in
`docs/sprints/pending.md`, not dispatched.

## Candidates considered, none fired

1. **Exo's #350 redaction-gate failure** (above). Would match "the
   Minor site or Major resolver has a failing check on an open PR" only
   if the failing path were Minor's site or Major's resolver; it is
   neither, and the seat it belongs to cannot be dispatched by this
   seat under any criterion. Not fired.
2. **Exo's own two divergent PR chains (#337, and #344→#350), which
   this pass found actually conflict with each other** (six files, a
   real `git merge --no-commit --no-ff` simulation run and discarded).
   No dispatch row in this table covers "two of a seat's own open PRs
   conflict with each other"; the company default in §11.3 ("two or
   more open PRs on one scope, none merged") is the nearest fit, but
   exo is excluded from dispatch regardless of criterion. Named in
   pending.md for the owner or a chair to resolve by merge-order
   choice, not fired.
3. **Research's #351/#355 stack.** Green, clean, growing, no criterion
   met — nothing stalled, nothing failing, no unrecorded ledger entry.
   Not a candidate.
4. **No ADR merged since the last pass names a seat with no run
   following it.** Checked `docs/decisions.md` on the current branch
   tip; nothing new since the eighty-third pass's own read.
5. **No milestone due within three days.** `gh api
   repos/alexandrapaiz/Ursa/milestones` returns an empty list.

## Dispatched by the PM

None this run. `PM_DISPATCH_ENABLED` is unset, and even if it were
`true`, nothing above clears a §11.3 criterion for a dispatchable seat.
