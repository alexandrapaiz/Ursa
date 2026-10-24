# Dispatch queue — 2026-10-24, seventy-first pass

`PM_DISPATCH_ENABLED` is unset in this run's own environment (`echo
"PM_DISPATCH_ENABLED=$PM_DISPATCH_ENABLED"` prints nothing), same as
every pass today, so nothing fires below regardless of what
qualifies. Written in full per pm.md §0b.

## This pass's event: two board messages addressed to pm, plus the lane's standing note

Research's note confirmed a ledger correction already landed (nothing
to dispatch). Skill's done closed its own orphaned draft and carried
the work forward into a fresh pull request (nothing to dispatch). The
standing note named two idle drafts in this seat's merge lane
(research's and exo's); both closed this pass, neither a dispatch
decision.

## Ursa's three dispatch criteria, checked fresh

1. **A tuning or trial run left results unrecorded in the ledger for a
   day.** No tuning or trial run started or finished this pass.
   Nothing to dispatch.
2. **The Minor site or Major resolver has a failing check on an open
   PR.** `gh run list --limit 10`: every row succeeded
   (`redaction-gate` only). No Minor/Major check is red on any open PR.
3. **An ADR names an experiment and no run has started it within two
   days.** No new ADR since the last check; unchanged.

## Company-default criteria (pm.md §11.3), checked fresh

| Observed | Fires? |
|---|---|
| A seat run failed in the last 24h, diagnosable | GitHub Actions: all succeeded (`gh run list --limit 10`). No failure to triage this pass. |
| A seat's open draft has failing CI, or a review comment unanswered >24h | `check-draft-prs.sh --repo alexandrapaiz/Ursa`: no orphaned drafts remain after this pass's two closures; every open draft is inside its liveness window. |
| A sprint item due this week, owning seat hasn't run | Between sprints — `sprint-2026-10-12.md` closed 2026-10-23, next ceremony 2026-10-26, nothing due this week to miss |
| A seat has two or more open PRs on one scope, none merged | None observed fresh this pass beyond what the seventieth pass already named and left for the owner |
| A ruling or ADR merged since the last run names a seat, no run followed | No ADR merged since the last check |
| A milestone due within three days with open items | No open milestone (`gh api repos/.../milestones` returns empty) |
| An owner-merge PR older than seven days | Unchanged from the last check; the seventieth pass's own report names the Tier C stack and its ages |

## Dispatch: nothing fires

No criterion fires, and `PM_DISPATCH_ENABLED` is unset regardless.
This pass's event resolved by two board replies and two lane-duty
draft closures, not by dispatching anyone.

## Failed-run triage this pass (§11.7)

None. `gh run list --limit 10` on GitHub Actions: all succeeded.
Nothing to classify, rerun, or hand off.
