# Dispatch queue — 2026-10-24, sixty-third pass

`PM_DISPATCH_ENABLED` is not `true` this run, so nothing fires below
regardless of what qualifies. Written in full per pm.md §0b.

## This pass's events: PR #294, and the standing note about PR #285

PR #294 (frontend's hover measurement) merged under Tier B — a merge
action, not a dispatch. PR #285 (research, draft) was handed back with
a staleness finding (base 1,003 commits behind `main`) rather than
merged or dispatched: the fix is a rebase the research seat does on its
own branch, which is not a dispatchable instruction so much as what the
comment on #285 already says. Full account in `docs/sprints/pending.md`'s
sixty-third-pass entry.

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
| A seat run failed in the last 24h, diagnosable | No — all 30 of the last 30 Actions runs succeeded |
| A seat's open draft has failing CI, or a review comment unanswered >24h | No open draft has failing CI. #285 now carries this pass's own comment and labels, posted minutes ago, not unanswered >24h. #293/#296/#299 are all under a day old |
| A sprint item due this week, owning seat hasn't run | Between sprints — `sprint-2026-10-12.md` still open, next ceremony 2026-10-26, nothing due this week to miss |
| A seat has two or more open PRs on one scope, none merged | Research holds three (#280, #282, #285), but this is a named, acknowledged stack — #285's own body subsumes #282 and #280 — not parallel duplicate work, and all three are already waiting on the owner (Tier C: each touches `prompts/research-agent.md`). Not a new finding; the fifty-ninth/sixty-first passes already recorded this shape. No dispatch — "land or close this stack" would ask research to do what the stacking already does |
| A ruling or ADR merged since the last run names a seat, no run followed | No ADR merged since the last check |
| A milestone due within three days with open items | No open milestone (`gh api repos/.../milestones` returns empty) |
| An owner-merge PR older than seven days | #269 (exo, Tier C, opened 2026-10-18) — about 5.3 days old, under the line |

## Dispatch: nothing fires

No criterion fires, and `PM_DISPATCH_ENABLED` is unset regardless.
This pass's events resolved by merging (#294) and by a handoff comment
(#285), not by dispatching anyone.

## Failed-run triage this pass (§11.7)

No run named by the trigger as failed. `gh run list --limit 30` on
GitHub Actions: all 30 succeeded.
