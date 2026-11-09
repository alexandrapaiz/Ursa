# Dispatch queue — 2026-11-09, message-triggered (pass 31)

Rechecked fresh against the criteria table below rather than carried
forward, per every prior pass's own practice.

`gh variable get PM_DISPATCH_ENABLED` returns HTTP 403 on this run's
token, the same wall every host pass has hit since 2026-10-17, and
`GITHUB_ACTIONS` is unset, confirming this is a host run rather than a
GitHub Actions run. `gh workflow run agent-<seat>.yml` would not apply
here even if the switch read `true`. This is logged as queue
information for the owner, not as a plan this run executes.

## Checked against the criteria table (pm.md §11.3) and Ursa's own three (§0b)

- **A seat run failed in the last 24h, diagnosable from its log:**
  `gh run list --limit 30` showed a wave of `redaction-gate` failures
  across nearly every open branch, but all of it traced to one cause,
  already fixed: `main` carried a full-UUID leak from pass 29 until
  this pass self-merged pass 30's own fix (`#861`). Every branch's own
  content was clean; the failures were GitHub's stale merge-ref
  against the old `main`, not a defect to dispatch anyone over.
- **A seat's open draft has failing CI, or a review comment unanswered
  >24h:** six drafts open (`#866` skill, `#865` frontend, `#864` this
  seat, `#863` exo, `#862` engineer, `#859` security), all opened or
  updated within the last fifteen minutes — live runs, not orphans.
  None qualify.
- **A sprint item due this week with no run from its owning seat:**
  unchanged. The newest sprint file is still `sprint-2026-10-12.md`,
  28 days old; the ceremony gap stays escalated in `docs/decisions.md`
  (pass 25) rather than repeated here.
- **A seat has two or more open PRs on one scope, none merged:** exo
  had five open before this pass (`#817`, `#826`, `#833`, `#846`,
  `#863`); `#817` merged this pass (false conflict, see
  `pending.md`), `#826`/`#833`/`#846` are each individually held at
  Tier C by path, not an unreviewed pile, and `#863` is a live run
  from minutes ago. Not a dispatch case: each row already has its own
  disposition.
- **A ruling or ADR merged since the last run names a seat with no run
  following:** nothing new in `docs/decisions.md` since pass 25's
  ceremony-gap finding.
- **A milestone due within three days with open items:** none found.
- **Ursa's own three (§0b):** no tuning or trial run with unrecorded
  ledger results; no failing check on an open Minor-site or
  Major-resolver PR (none open); no ADR naming an experiment with no
  run started within two days.

## Logged, not fired

`#826` and `#833` (exo) stay Tier C by path (`prompts/exo-agent.md` in
both diffs), unchanged from pass 28's finding, one of them already
carrying the owner's own reviewed-and-held comment. `#846` likewise,
per pass 28.

## Dispatched by the PM

None this pass. The token cannot read the switch, this is not a
GitHub Actions run, and the criteria table above found nothing that
would have qualified regardless.
