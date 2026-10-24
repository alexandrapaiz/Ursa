# Dispatch queue — 2026-10-24, sixty-first pass

`PM_DISPATCH_ENABLED` is not `true` this run, so nothing fires below
regardless of what qualifies. Written in full per pm.md §0b.

## This pass's events: skill's host-run failure, and PR #297

The host window run named in the trigger (`ursa-skill/2026-10-23T23-58-16-000Z-message`,
reported failed, no PR) turned out to have shipped PR #293, which is
in progress, not stalled — classified a tripwire false alarm
(Incident 19), no dispatch needed. PR #297 (distribution's lessons.md
re-vendor) merged under Tier B, which is a merge action, not a
dispatch. Full account in `docs/sprints/pending.md`'s sixty-first-pass
entry.

## Ursa's three dispatch criteria, checked fresh

1. **A tuning or trial run left results unrecorded in the ledger for a
   day.** No tuning or trial run started or finished this pass.
   Nothing to dispatch.
2. **The Minor site or Major resolver has a failing check on an open
   PR.** `gh run list --limit 40`: every row is `redaction-gate`,
   every one `success`. No Minor/Major check is red on any open PR.
3. **An ADR names an experiment and no run has started it within two
   days.** No new ADR since the last check found one; unchanged.

## Company-default criteria (pm.md §11.3), checked fresh

| Observed | Fires? |
|---|---|
| A seat run failed in the last 24h, diagnosable | The one named run is reclassified as a false alarm (Incident 19), not a diagnosable defect — no dispatch |
| A seat's open draft has failing CI, or a review comment unanswered >24h | No open draft has failing CI; none carry an unanswered review comment past 24h (the newest, #285/#288/#293/#294/#296, are all under six hours old) |
| A sprint item due this week, owning seat hasn't run | Between sprints — `sprint-2026-10-12.md` still open, next ceremony 2026-10-26, nothing due this week to miss |
| A seat has two or more open PRs on one scope, none merged | No — every seat carrying open work (exo, research, skill, frontend, engineer) holds exactly one open PR on its own current scope after this pass's and the sixtieth pass's merges |
| A ruling or ADR merged since the last run names a seat, no run followed | No ADR merged since the last check |
| A milestone due within three days with open items | No open milestone |
| An owner-merge PR older than seven days | #269 (exo, Tier C, opened 2026-10-18) — 6 days old, under the line, named here rather than escalated |

## Dispatch: nothing fires

No criterion fires, and `PM_DISPATCH_ENABLED` is unset regardless.
This pass's two events resolved by merging (#297) and by triage that
found no defect (Incident 19), not by dispatching anyone.

## Failed-run triage this pass (§11.7)

One run named by the trigger: the skill seat's host window run,
reclassified as a tripwire false alarm (bucket one — the run's PR,
#293, exists) rather than a real defect. No rerun; the same backlog
would just be redone, and the skill seat's own open PR already
carries it. `gh run list --limit 40` on GitHub Actions: nothing
non-success in the window this pass covers.
