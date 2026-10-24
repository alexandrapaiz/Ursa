# Dispatch queue — 2026-10-24, ~12:2x UTC, message (seventy-eighth pass, the six-hour pass)

`PM_DISPATCH_ENABLED` is unset in this run's own environment (`echo
"PM_DISPATCH_ENABLED=$PM_DISPATCH_ENABLED"` prints nothing), so
nothing fires below regardless of what qualifies. Written in full per
pm.md §0b.

## This run's inbox

Read `to_seat=pm` on the board first. Three items addressed to this
seat since the seventy-seventh pass closed: research's note confirming
the ledger-pointer correction holds; exo's handoff naming a dead
silence clock in this seat's own charter; frontend's note on the
now-merged hit-area fix and the still-open canon-authority question.
All three answered on the board this pass (see the PR description for
the full account); none needed a dispatch, because each resolved with
a board reply or a direct merge, not a seat run.

## One Tier B merge this pass: #329 (frontend)

`gh pr diff --name-only`: zero `prompts/` paths. Not a draft, no
`hold` label, no owner comment since its last push (`updatedAt`
12:13:58Z, no comments). One check, `scan`, green. `mergeStateStatus:
CLEAN`. Created today, well under seven days. All six Tier B
conditions held, so merged as a normal merge (`gh pr merge 329
--merge`), not squashed, not forced. This was the base of frontend's
own small stack; `#336` (its draft continuation) is unaffected and
still frontend's to ready or close.

## The redaction-gate failure: self-healed, not dispatched

`gh run list --status failure --created ">=6 hours ago"` returned one
hit: `redaction-gate` on `ursa-research/2026-10-24-message-7` (`#335`,
run 40093217387), failed on two untruncated UUIDs in
`docs/research/briefs/2026-10-24.md`. Before classifying, read the
branch's log past the failing commit per this seat's own charter note
on tripwire false alarms: `ursa-research/2026-10-24-message-8` (`#338`,
still draft, built directly on `#335`) already removes both UUIDs in
its very next two commits, and its own `scan` check is green. Real
defect, correctly caught by the gate, already fixed by the owning
seat's own in-flight next run before this pass reached it. No rerun
(same input on `#335` would fail the same way), no incident filed (the
fix is not a gap in the gate or the charter, and research's own `#338`
already carries the narrative), no dispatch (the seat is already
running).

## Ursa's three dispatch criteria, checked fresh

1. **A tuning or trial run left results unrecorded in the ledger for a
   day.** No tuning or trial run started or finished today. Nothing to
   dispatch.
2. **The Minor site or Major resolver has a failing check on an open
   PR.** `gh run list --limit 30`: all succeeded except the redaction-
   gate hit above, already triaged as self-healed. No Minor/Major
   check is red.
3. **An ADR names an experiment and no run has started it within two
   days.** No new ADR since the last check; unchanged.

## Company-default criteria (pm.md §11.3), checked fresh

| Observed | Fires? |
|---|---|
| A seat run failed in the last 24h, diagnosable | One (`redaction-gate`), triaged above as self-healed. Nothing to dispatch. |
| A seat's open draft has failing CI, or a review comment unanswered >24h | None found (`#331`, `#336`, `#337`, `#338` are all fresh drafts from this morning, none stale). |
| A sprint item due this week, owning seat hasn't run | Between sprints: no retrospective for `sprint-2026-10-12.md` is on `main` yet (an earlier pass's closure, `333a86d`, sits in an unmerged branch, not on `main`); next ceremony 2026-10-26. Flagged below, not a dispatch target. |
| A seat has two or more open PRs on one scope, none merged | This seat's own stack, unchanged — waiting on the owner or a chair, not a dispatch target (it is this seat's own queue). Every other seat's multi-PR stack this pass found (exo, research, skill, engineer) is either Tier C and waiting on the owner, or mid-resolution on its own live branch; none is idle. |
| A ruling or ADR merged since the last run names a seat, no run followed | No ADR merged since the last check. |
| A milestone due within three days with open items | No open milestone (`gh api repos/.../milestones` returns empty). |
| An owner-merge PR older than seven days | Oldest open PR today is `#269` (2026-10-18), already named in earlier passes, still moving within its own seven-day window. |

## Dispatch: nothing fires

No criterion fires, and `PM_DISPATCH_ENABLED` is unset regardless.

## Failed-run triage this run (§11.7)

One failure, classified above: real defect, self-healed by the owning
seat's own next commit, no rerun, no incident, no dispatch.
