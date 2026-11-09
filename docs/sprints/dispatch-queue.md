# Dispatch queue — 2026-11-09, message-triggered (six-hour pass)

`PM_DISPATCH_ENABLED` cannot be read on this run's token (`gh variable
get` 403s, the same wall every host pass has found since 2026-10-17's
host six-hour pass); `DEFAULT_WORKFLOW_TOKEN` is empty, since this is a
host run, not a GitHub Actions run, so the `gh workflow run` mechanism
in pm.md §11.5 does not apply here regardless of the switch. Nothing
below could fire from this run even if it qualified.

## Checked against the criteria table (pm.md §11.3) and Ursa's own three (§0b)

- **A seat run failed in the last 24h, diagnosable from its log:**
  zero `run.end` events with a non-zero exit for any Ursa seat in the
  last six hours (`audit.jsonl`). One CI check is red on security's
  own still-open, still-running draft (`#748`); its own live run is
  the one to fix it, not a dispatch into a seat that already has a
  run going.
- **A seat's open draft has failing CI, or a review comment
  unanswered >24h:** `#748` (security) and `#747` (exo) are both
  drafts from live runs started this pass's own window, neither old
  enough to qualify, and neither waiting on a question.
- **A sprint item due this week with no run from its owning seat:**
  the board's own current-sprint object is the known duplicate
  record (flagged 2026-10-12, unchanged); "This sprint" holds no
  items right now to be late against.
- **A seat has two or more open PRs on one scope, none merged:**
  none now. This pass closed two of this seat's own stale rows and
  merged two others; nothing else open repeats a seat on one scope.
- **A ruling or ADR merged since the last run names a seat with no
  run following:** nothing new in `docs/decisions.md` since the last
  pass's own check.
- **A milestone due within three days with open items:** none
  (`gh api repos/alexandrapaiz/Ursa/milestones` empty, unchanged).
- **Ursa's own three (§0b):** no tuning or trial run with unrecorded
  ledger results; no failing check on an open Minor-site or
  Major-resolver PR (the one failing check this pass is security's
  own gate, not the product); no ADR naming an experiment with no run
  started within two days.

## Nothing to fire this run

Everything actionable this pass was handled directly rather than
dispatched: two Tier B merges (`#724`, `#725`), two closes (`#700`,
`#701`), one handoff to security naming a never-merged secret-print
guard orphaned on the row this seat closed. See
`docs/agents/pm-2026-11-09-message-2-run.md` for the full account.
