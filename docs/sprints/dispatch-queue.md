# Dispatch queue — 2026-11-09, message-triggered (eighth pass)

**Eighth message pass of today.** Rechecked fresh against the criteria
table below rather than carried forward: three Tier B merges landed
this pass (`#757`, `#758`, `#752`), `#759` went from clean to
conflicted as a direct result, and `#730`'s tier question was settled
(Tier B, not Tier C). None of that changes anything below.

`PM_DISPATCH_ENABLED` cannot be read on this run's token (`gh variable
get` 403s, the same wall every host pass has found since 2026-10-17's
host six-hour pass); `DEFAULT_WORKFLOW_TOKEN` is empty, since this is a
host run, not a GitHub Actions run, so the `gh workflow run` mechanism
in pm.md §11.5 does not apply here regardless of the switch. Nothing
below could fire from this run even if it qualified.

## Checked against the criteria table (pm.md §11.3) and Ursa's own three (§0b)

- **A seat run failed in the last 24h, diagnosable from its log:**
  zero non-success runs in the last fifteen (`gh run list --limit
  15`), all `success`.
- **A seat's open draft has failing CI, or a review comment
  unanswered >24h:** four drafts open (`#762` exo, `#763` engineer,
  `#764` security, `#765` frontend), all confirmed live by
  `tools/check-draft-prs.sh` (idle 0-6 minutes against a 120-minute
  threshold) rather than taken on the standing block's stale claim.
  None old enough to qualify and none waiting on an unanswered review
  comment.
- **A sprint item due this week with no run from its owning seat:**
  unchanged — "This sprint" holds no items right now to be late
  against; the engineer-lane staleness is a ceremony-grooming finding,
  carried in `docs/sprints/pending.md`.
- **A seat has two or more open PRs on one scope, none merged:** none.
  Every seat with an open draft holds exactly one.
- **A ruling or ADR merged since the last run names a seat with no run
  following:** nothing new in `docs/decisions.md` since the last
  pass's own check.
- **A milestone due within three days with open items:** none
  (unchanged).
- **Ursa's own three (§0b):** no tuning or trial run with unrecorded
  ledger results; no failing check on an open Minor-site or
  Major-resolver PR; no ADR naming an experiment with no run started
  within two days.

## Nothing to fire this run

Three pull requests this pass merged (`#757`, `#758`, `#752`) were
already open and did not need a dispatch to exist; merging an existing
PR is a Tier B act, not a dispatch, and nothing in the criteria table
asked for new work from any seat. `#759` and `#730` both need their
own owning seat to rebase, not a dispatch for new work, and both were
handed off on the board rather than queued here. See
`docs/agents/pm-2026-11-09-message-8-run.md` for the full account.
