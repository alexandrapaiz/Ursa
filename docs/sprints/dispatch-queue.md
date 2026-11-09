# Dispatch queue — 2026-11-09, message-triggered (twenty-seventh pass)

Rechecked fresh against the criteria table below rather than carried
forward, per every prior pass's own practice.

`PM_DISPATCH_ENABLED` is unset in this run's environment, so nothing
below could fire even if it qualified (pm.md §11.5). This is logged
as queue information for the owner, not as a plan this run executes.

## Checked against the criteria table (pm.md §11.3) and Ursa's own three (§0b)

- **A seat run failed in the last 24h, diagnosable from its log:**
  nothing new since the last pass's own check; the one timeout already
  triaged there (`ursa-engineer`, `2026-11-09T07-52-20-692Z-message`)
  stays not-a-pattern, and its follow-up is the run that produced this
  pass's own `#840` merge.
- **A seat's open draft has failing CI, or a review comment unanswered
  >24h:** rechecked fresh with `/srv/asc/hq/tools/check-draft-prs.sh
  --repo alexandrapaiz/Ursa`. Four drafts now (`#854` ursa-exo, `#853`
  ursa-engineer, `#852` ursa-security, `#848` ursa-frontend), all idle
  1–21 minutes, all "run may still be live; leave it alone," and "no
  orphaned drafts." `#840` has merged since the last pass and no
  longer appears here at all. None qualify.
- **A sprint item due this week with no run from its owning seat:**
  unchanged. The newest sprint file is still `sprint-2026-10-12.md`,
  28 days old; the ceremony gap stays escalated in
  `docs/decisions.md` rather than repeated here.
- **A seat has two or more open PRs on one scope, none merged:**
  unchanged from the last pass's check (market's `#824`/`#822` are two
  different ledger entries, not one stuck scope).
- **A ruling or ADR merged since the last run names a seat with no run
  following:** nothing merged to `docs/decisions.md` since the last
  pass.
- **A milestone due within three days with open items:** none found.
- **Ursa's own three (§0b):** no tuning or trial run with unrecorded
  ledger results; no failing check on an open Minor-site or
  Major-resolver PR; no ADR naming an experiment with no run started
  within two days.

## Logged, not fired

`#846` (exo, window 109) is Tier C by path (`prompts/exo-agent.md`
amended) and waits on the owner, logged in `docs/sprints/pending.md`
rather than here, since it needs a merge decision and not a dispatch.
The redaction-gate workflow patch (`docs/security/redaction-gate-uuid-narrowing.patch`,
landed by `#840`) needs the owner or HQ to run `git apply`, also logged
in `pending.md` and routed as a board handoff to
`alexandra-systems/exo-centralizer`; it is an application step, not
something a dispatch would produce.

## Dispatched by the PM

None this pass. `PM_DISPATCH_ENABLED` unset, and the criteria table
above found nothing that would have qualified regardless.
