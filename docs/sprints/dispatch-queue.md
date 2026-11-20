# Dispatch queue — 2026-11-09, message-triggered (pass 37, the six-hour pass)

Rechecked fresh against the criteria table below rather than carried
forward, per every prior pass's own practice.

`gh variable get PM_DISPATCH_ENABLED` returns HTTP 403 on this run's
token, the same wall every host pass has hit since 2026-10-17. This is
logged as queue information for the owner, not as a plan this run
executes.

## Checked against the criteria table (pm.md §11.3) and Ursa's own three (§0b)

- **A seat run failed in the last six hours, diagnosable from its
  log:** five `redaction-gate` failures fall in the window (two on
  `ursa-pm` branches already fixed on `main` in `#861`, one on
  `ursa-pm/2026-11-09-message-31`/`-28` also pre-dating that fix, one
  on `ursa-security/2026-11-09-message-16` whose PR `#868` is already
  closed as superseded, one on `ursa-exo/2026-11-09-message-15` whose
  PR `#870` already names the same cause in its own description).
  Nothing undiagnosed, nothing to dispatch.
- **A seat's open draft has failing CI, or a review comment unanswered
  >24h:** four drafts open this pass (`#882` frontend, `#879` exo,
  `#877` security, `#873` engineer), all opened or updated within the
  last hour, all live runs rather than orphans per
  `/srv/asc/hq/tools/check-draft-prs.sh`. None qualify.
- **A sprint item due this week with no run from its owning seat:**
  the newest sprint file (`sprint-2026-11-09.md`) is still sitting in
  this seat's own unmerged `#871` (contained in this stack), so
  nothing is "due" yet in the sense this criterion means — the sprint
  itself has not landed. Not a dispatch condition; a merge condition,
  already in `pending.md`.
- **A seat has two or more open PRs on one scope, none merged:** this
  seat's own seven-PR Tier B stack, named in `pending.md`, is the one
  standing instance. No other seat shows the shape this pass.
- **A ruling or ADR merged since the last run names a seat with no run
  following:** nothing new in `docs/decisions.md` this pass.
- **A milestone due within three days with open items:** none found.
- **Ursa's own three (§0b):** no tuning or trial run with unrecorded
  ledger results; no failing check on an open Minor-site or
  Major-resolver PR (none open this pass); no ADR naming an experiment
  with no run started within two days.

## Logged, not fired

`#870`, `#833` and `#826` (exo) are Tier C by path
(`prompts/exo-agent.md`) and wait on the owner, logged in
`docs/sprints/pending.md` rather than here, since each needs a merge
decision and not a dispatch. `#833`/`#826` collide with each other on
`docs/agents/improvements.md`; the hand resolution is named in
`docs/agents/merge-order.md` and is not a dispatch either.

Nothing fires this pass.
