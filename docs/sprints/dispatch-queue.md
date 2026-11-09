# Dispatch queue — 2026-11-09, message-triggered (sixth pass)

**Sixth message pass of today.** Rechecked fresh against the criteria
table below rather than carried forward: the merge queue moved twice
this pass (`#742`, `#750`), none of which changes anything in this
section.

`PM_DISPATCH_ENABLED` cannot be read on this run's token (`gh variable
get` 403s, the same wall every host pass has found since 2026-10-17's
host six-hour pass); `DEFAULT_WORKFLOW_TOKEN` is empty, since this is a
host run, not a GitHub Actions run, so the `gh workflow run` mechanism
in pm.md §11.5 does not apply here regardless of the switch. Nothing
below could fire from this run even if it qualified.

## Checked against the criteria table (pm.md §11.3) and Ursa's own three (§0b)

- **A seat run failed in the last 24h, diagnosable from its log:**
  zero non-success runs in the last fifteen (`gh run list --limit
  15`), all `success` (the `in_progress` row is this pass's own
  `redaction-gate` check, not a failure).
- **A seat's open draft has failing CI, or a review comment
  unanswered >24h:** four drafts open (`#756` frontend, `#757`
  security, `#758` engineer, `#759` exo), all from live runs started
  within the last twenty minutes of this pass's own window, none old
  enough to qualify and none waiting on an unanswered question.
- **A sprint item due this week with no run from its owning seat:**
  the board's own current-sprint object is the known duplicate
  record (flagged 2026-10-12, unchanged); "This sprint" holds no
  items right now to be late against. The engineer-lane staleness
  (sprint file 28 days old) is a ceremony-grooming finding, not a
  dispatch trigger, and is carried to `docs/sprints/pending.md`
  instead.
- **A seat has two or more open PRs on one scope, none merged:** none
  now. Frontend, security, engineer and exo each hold exactly one open
  draft, their own next pull request, not a stack.
- **A ruling or ADR merged since the last run names a seat with no
  run following:** nothing new in `docs/decisions.md` since the last
  pass's own check.
- **A milestone due within three days with open items:** none
  (unchanged).
- **Ursa's own three (§0b):** no tuning or trial run with unrecorded
  ledger results; no failing check on an open Minor-site or
  Major-resolver PR (none open right now); no ADR naming an
  experiment with no run started within two days.

## Nothing to fire this run

Everything actionable this pass was handled directly: two Tier B
merges (`#742`, `#750`, with the docs-only conflict between them
resolved in this pass rather than handed back), one stale close
comment identified and voided rather than acted on, one ledger finding
(three `urgent` entries still `hold`, not cleared as previously
reported) carried to the owner's queue. See
`docs/agents/pm-2026-11-09-message-6-run.md` for the full account.
