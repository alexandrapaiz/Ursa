# Dispatch queue — 2026-11-09, message-triggered (seventh pass)

**Seventh message pass of today.** Rechecked fresh against the
criteria table below rather than carried forward: the merge queue
moved once this pass (`#756`), which doesn't change anything in this
section, and a new frontend draft (`#765`) opened mid-pass, which
doesn't either.

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
  unanswered >24h:** five drafts open (`#762` exo, `#763` engineer,
  `#764` security, `#765` frontend, plus this pass's own `#766`), all
  from runs live within the last twenty minutes of this pass's own
  window (confirmed live, not merely recent, against
  `tools/check-draft-prs.sh` and fresh `redaction-gate` checks landing
  on each — see the standing-claim finding in this pass's run
  account). None old enough to qualify and none waiting on an
  unanswered review comment.
- **A sprint item due this week with no run from its owning seat:**
  unchanged from the sixth pass — "This sprint" holds no items right
  now to be late against; the engineer-lane staleness is a
  ceremony-grooming finding, carried in `docs/sprints/pending.md`.
- **A seat has two or more open PRs on one scope, none merged:** none.
  Every seat with an open draft holds exactly one.
- **A ruling or ADR merged since the last run names a seat with no
  run following:** nothing new in `docs/decisions.md` since the last
  pass's own check.
- **A milestone due within three days with open items:** none
  (unchanged).
- **Ursa's own three (§0b):** no tuning or trial run with unrecorded
  ledger results; no failing check on an open Minor-site or
  Major-resolver PR; no ADR naming an experiment with no run started
  within two days.

## Nothing to fire this run

The only actionable item this pass was `#756`, reviewed against the
merge rule's conditions directly and merged under Tier B. The
standing block's claim that `#763` and `#764` were orphaned drafts was
checked live rather than acted on and found already false — both have
live runs behind them — so neither was readied, closed, nor annotated.
See `docs/agents/pm-2026-11-09-message-7-run.md` for the full account.
