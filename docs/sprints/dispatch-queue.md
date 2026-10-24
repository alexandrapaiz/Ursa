# Dispatch queue — 2026-10-24, sixty-fifth pass

`PM_DISPATCH_ENABLED` is unset in this run's own environment (`echo
"PM_DISPATCH_ENABLED=$PM_DISPATCH_ENABLED"` prints nothing), same as
the prior two passes found, so nothing fires below regardless of what
qualifies. Written in full per pm.md §0b.

## This pass's event: PR #299 checked against the merge rule, merged

The message named PR #299 (frontend, "fe: the command blocks that do
not say they scroll") and asked for it to be checked against the merge
rule. Checked fresh: not a draft, zero labels, zero comments, one
check (`redaction-gate / scan`) green, `gh pr diff --name-only` showed
only `docs/design/reviews/2026-10-24b/**` and two `ursa-minor/`
files — no Tier C path — `MERGEABLE`/`CLEAN`, opened about 25 minutes
before this pass. Merged under Tier B (`gh pr merge 299 --merge
--delete-branch`), confirmed at 2026-10-24T01:31:37Z. Full account in
`docs/sprints/pending.md`'s sixty-fifth-pass entry, including the one
open design question the PR itself raised for the owner (scrollbar
thumb contrast) and the second part of the same message, PR #285,
which this pass re-checked rather than re-resolved (see below).

## Ursa's three dispatch criteria, checked fresh

1. **A tuning or trial run left results unrecorded in the ledger for a
   day.** No tuning or trial run started or finished this pass.
   Nothing to dispatch.
2. **The Minor site or Major resolver has a failing check on an open
   PR.** `gh run list --limit 30`: every row succeeded. No Minor/Major
   check is red on any open PR.
3. **An ADR names an experiment and no run has started it within two
   days.** No new ADR since the last check; unchanged.

## Company-default criteria (pm.md §11.3), checked fresh

| Observed | Fires? |
|---|---|
| A seat run failed in the last 24h, diagnosable | `gh run list --limit 30`: all succeeded. Nothing to diagnose. |
| A seat's open draft has failing CI, or a review comment unanswered >24h | No open draft has failing CI. #285 carries this pass's confirmation of the prior comment and labels, still under a day old. |
| A sprint item due this week, owning seat hasn't run | Between sprints — `sprint-2026-10-12.md` still open, next ceremony 2026-10-26, nothing due this week to miss |
| A seat has two or more open PRs on one scope, none merged | Research holds three (#280, #282, #285) — unchanged, named stack, already Tier C and waiting on the owner. Not a new finding. |
| A ruling or ADR merged since the last run names a seat, no run followed | No ADR merged since the last check |
| A milestone due within three days with open items | No open milestone (`gh api repos/.../milestones` returns empty) |
| An owner-merge PR older than seven days | #269 (exo, Tier C, opened 2026-10-18) — about 5.5 days old, under the line |

## Dispatch: nothing fires

No criterion fires, and `PM_DISPATCH_ENABLED` is unset regardless.
This pass's event resolved by a Tier B merge (#299) and a
re-confirmation (#285), not by dispatching anyone.

## Failed-run triage this pass (§11.7)

Nothing new named by this pass's trigger. `gh run list --limit 30` on
GitHub Actions: all 30 succeeded, nothing to triage.
