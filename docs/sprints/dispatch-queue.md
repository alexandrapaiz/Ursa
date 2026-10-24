# Dispatch queue — 2026-10-24, sixty-eighth pass

`PM_DISPATCH_ENABLED` is unset in this run's own environment (`echo
"PM_DISPATCH_ENABLED=$PM_DISPATCH_ENABLED"` prints nothing), same as
every pass today, so nothing fires below regardless of what
qualifies. Written in full per pm.md §0b.

## This pass's event: exo's host-run failure, plus the standing note on PR #285/#293

The message named a host window run,
`ursa-exo/2026-10-24T01-17-18-110Z-message` (started 01:17:18Z, 101
turns, exited 1 after 24 minutes), as failed with no pull request, and
asked for §11.7 triage. It also carried the same standing note as the
prior pass, naming PR #285 and #293 and `tools/check-draft-prs.sh`.

- **Exo's run: tripwire false alarm, Incident 19's third occurrence.**
  PR #302 was pushed last at 01:40:59Z and exo's own `done` message
  posted at 01:41:15Z, both inside the named run's span; the board's
  `/api/work/Ursa/exo` feed records the run itself as `failed` only at
  01:41:39Z, after the work and the report. Same signature as the
  skill (2026-10-23) and engineer (2026-10-24 ~00:09) occurrences
  already on file. No rerun — PR #302 already carries the work, and
  #308 already declined it under Tier C. Logged as an update to
  Incident 19, not a new incident.
- **#285 and #293: unchanged from the sixty-seventh pass's fresh
  check.** Independently spot-checked this pass by reading each
  branch's real last-commit date (not `gh pr view`'s paginated commit
  list): #285's is 2026-10-23T18:22:20Z (~7.5h old, past the 120-minute
  window, `finish`/research); #293's is 2026-10-24T00:09:27Z (~1.75h
  old, inside the window, `wait`/leave alone). #293 now carries a PM
  comment naming the clause, matching #285's existing one.

Full account in `docs/sprints/pending.md`'s sixty-eighth-pass entry.

## Ursa's three dispatch criteria, checked fresh

1. **A tuning or trial run left results unrecorded in the ledger for a
   day.** No tuning or trial run started or finished this pass.
   Nothing to dispatch.
2. **The Minor site or Major resolver has a failing check on an open
   PR.** `gh run list --limit 15`: every row succeeded (`redaction-gate`
   only). No Minor/Major check is red on any open PR.
3. **An ADR names an experiment and no run has started it within two
   days.** No new ADR since the last check; unchanged.

## Company-default criteria (pm.md §11.3), checked fresh

| Observed | Fires? |
|---|---|
| A seat run failed in the last 24h, diagnosable | GitHub Actions: all succeeded (`gh run list --limit 15`). The one failure this pass (exo's host window run) is diagnosed as a tripwire false alarm, not a defect — nothing to dispatch. |
| A seat's open draft has failing CI, or a review comment unanswered >24h | No open draft has failing CI. #285's blocker is its own staleness, already named; #293 is inside its liveness window. |
| A sprint item due this week, owning seat hasn't run | Between sprints — `sprint-2026-10-12.md` still open, next ceremony 2026-10-26, nothing due this week to miss |
| A seat has two or more open PRs on one scope, none merged | Research holds three (#280, #282, #285) — unchanged, named stack, already flagged, waiting on research's own rebase of #285, not a new finding |
| A ruling or ADR merged since the last run names a seat, no run followed | No ADR merged since the last check |
| A milestone due within three days with open items | No open milestone (`gh api repos/.../milestones` returns empty) |
| An owner-merge PR older than seven days | #269 (exo, Tier C, opened 2026-10-18T19:16Z) — ~5.6 days old, under the line. #288 and #302, same Tier C chain, are younger. |

## Dispatch: nothing fires

No criterion fires, and `PM_DISPATCH_ENABLED` is unset regardless.
This pass's event resolved by a tripwire-false-alarm triage (exo's run,
filed under Incident 19) and a confirmation that #285/#293's
disposition from the prior pass stands unchanged, not by dispatching
anyone.

## Failed-run triage this pass (§11.7)

One, off the GitHub Actions track entirely: the host window run named
above. Classified tripwire false alarm (bucket one — "the run's PR
exists"), no rerun, logged as Incident 19's third occurrence in
`docs/agents/incidents.md`. `gh run list --limit 15` on GitHub Actions
itself: all succeeded, nothing else to triage.
