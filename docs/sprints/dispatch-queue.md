# Dispatch queue — 2026-10-24, sixty-fourth pass

`PM_DISPATCH_ENABLED` not confirmed `true` this run (`gh variable list`
403s for this token; #300 found it unset minutes earlier and nothing
has changed that setting between passes), so nothing fires below
regardless of what qualifies. Written in full per pm.md §0b.

## This pass's event: the engineer's host-run failure report

The message reported `ursa-engineer/2026-10-24T00-09-12-900Z-message`
failed with no pull request. `gh pr list` shows PR #296 exists,
opened 44 seconds after that run's start, with real commits inside
the reported window — the claim is wrong, matching Incident 19's
signature on a different seat. Resolved by triage and a board note,
not by dispatch: the engineer's last PR (#296) is still open, and
pm.md §11.4 forbids dispatching a seat whose last PR is open unless
told to build on it, which this message does not say. Full account in
`docs/sprints/pending.md`'s sixty-fourth-pass entry and
`docs/agents/incidents.md`'s Incident 19 update.

## Ursa's three dispatch criteria, checked fresh

1. **A tuning or trial run left results unrecorded in the ledger for a
   day.** No tuning or trial run started or finished this pass.
   Nothing to dispatch.
2. **The Minor site or Major resolver has a failing check on an open
   PR.** `gh run list --limit 30`: every row succeeded. No Minor/Major
   check is red on any open PR.
3. **An ADR names an experiment and no run has started it within two
   days.** No new ADR since the last check found one; unchanged.

## Company-default criteria (pm.md §11.3), checked fresh

| Observed | Fires? |
|---|---|
| A seat run failed in the last 24h, diagnosable | The engineer's host run hit a timeout — diagnosable, but its own open PR (#296) and its own charter already cover the recovery (next run inherits the draft); dispatching now would duplicate what "read your own open PRs first" already does on the engineer's next run. Not fired. |
| A seat's open draft has failing CI, or a review comment unanswered >24h | No open draft has failing CI. #296 is under an hour old, not unanswered >24h. #285 still carries the prior pass's comment and labels, under a day old. |
| A sprint item due this week, owning seat hasn't run | Between sprints — `sprint-2026-10-12.md` still open, next ceremony 2026-10-26, nothing due this week to miss |
| A seat has two or more open PRs on one scope, none merged | Research holds three (#280, #282, #285) — unchanged, named stack, already Tier C and waiting on the owner. Not a new finding. |
| A ruling or ADR merged since the last run names a seat, no run followed | No ADR merged since the last check |
| A milestone due within three days with open items | No open milestone (`gh api repos/.../milestones` returns empty) |
| An owner-merge PR older than seven days | #269 (exo, Tier C, opened 2026-10-18) — about 5.5 days old, under the line |

## Dispatch: nothing fires

No criterion fires, and `PM_DISPATCH_ENABLED` is not confirmed `true`
regardless. This pass's event resolved by triage and a board note
(the engineer item), not by dispatching anyone.

## Failed-run triage this pass (§11.7)

One run named by the trigger: the engineer's host window run. Classified
tripwire false alarm on the "no pull request" claim (PR #296 exists);
the timeout itself is real but not a defect, and recovery is already
the engineer seat's own next-run responsibility per its charter. No
rerun (a host window run is outside `gh run rerun`'s reach regardless).
`gh run list --limit 30` on GitHub Actions, separately: all 30
succeeded, nothing else to triage there.
