# Dispatch queue — 2026-11-09, message-triggered (pass 38)

Rechecked fresh against the criteria table below rather than carried
forward, per every prior pass's own practice. `PM_DISPATCH_ENABLED` is
not readable on this run's token (same 403 wall as pass 37); logged as
queue information for the owner, not as a plan this run executes.

## Checked against the criteria table (pm.md §11.3) and Ursa's own three (§0b)

- **A seat run failed in the last six hours, diagnosable from its
  log:** no new `redaction-gate` failures since pass 37's five, all
  already accounted for there. The engineer's cron run named on this
  pass's own wake (`2026-11-09T11-30-15-208Z-cron`) is a host wall-clock
  kill, not a code defect — see `## Failures` below. Nothing
  undiagnosed, nothing to dispatch.
- **A seat's open draft has failing CI, or a review comment unanswered
  >24h:** five drafts open this pass (`#886` this seat's own, `#882`
  frontend, `#879` exo, `#877` security, `#873` engineer), all live per
  `/srv/asc/hq/tools/check-draft-prs.sh` (`disposition: wait`,
  `substance: work`, 0–18 idle minutes). None qualify.
- **A sprint item due this week with no run from its owning seat:** the
  sprint file (`sprint-2026-11-09.md`) is still sitting in this seat's
  own unmerged stack (now `#886`, carrying pass 37's `#871` by
  ancestry), so nothing is "due" in the sense this criterion means. Not
  a dispatch condition; a merge condition, in `pending.md`.
- **A seat has two or more open PRs on one scope, none merged:** this
  seat's own Tier B stack, named in `pending.md`, is the one standing
  instance. No other seat shows the shape this pass.
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
