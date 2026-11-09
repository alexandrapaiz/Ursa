# Dispatch queue — 2026-11-09, message-triggered (twenty-fifth pass)

Rechecked fresh against the criteria table below rather than carried
forward, per every prior pass's own practice.

`PM_DISPATCH_ENABLED` is unset in this run's environment, so nothing
below could fire even if it qualified (pm.md §11.5). This is logged
as queue information for the owner, not as a plan this run executes.

## Checked against the criteria table (pm.md §11.3) and Ursa's own three (§0b)

- **A seat run failed in the last 24h, diagnosable from its log:** one
  — `ursa-engineer`, `2026-11-09T07-52-20-692Z-message`, `exit=timeout`
  after 60 minutes. Diagnosed and triaged in this pass's own PR and in
  `docs/sprints/pending.md`'s top entry: the run shipped a complete,
  valuable unit of work before timing out, a follow-up run started two
  seconds later and is still live, and three of the four most recent
  engineer runs today exited 0. Not a pattern, not a defect. No
  dispatch; nothing to rerun that is not already running.
- **A seat's open draft has failing CI, or a review comment unanswered
  >24h:** `#840` (engineer), `#844` (security), `#845` (skill), `#846`
  (exo), `#848` (frontend) are open or draft. `/srv/asc/hq/tools/check-draft-prs.sh
  --repo alexandrapaiz/Ursa` reports every one "idle 3-10m, run may
  still be live; leave it alone. no orphaned drafts." None qualify.
- **A sprint item due this week with no run from its owning seat:**
  there is no current sprint item — the newest sprint file is
  `sprint-2026-10-12.md`, 28 days old. This is the ceremony gap, now
  escalated in `docs/decisions.md` rather than logged here again.
- **A seat has two or more open PRs on one scope, none merged:**
  market holds `#824` and `#822`, both open. Checked whether they
  share a scope before counting it as a hit: `#824` is a market brief
  entry (Anthropic reward-hacking disclosure, Turing entry) and `#822`
  is a different brief entry (Cocient, verifier-gap hedge) — two
  different ledger entries in the same file, not one stuck scope. Not
  a hit.
- **A ruling or ADR merged since the last run names a seat with no run
  following:** nothing merged to `docs/decisions.md` since the last
  pass before this one's own addition.
- **A milestone due within three days with open items:** none found.
- **Ursa's own three (§0b):** no tuning or trial run with unrecorded
  ledger results; no failing check on an open Minor-site or
  Major-resolver PR (`#843`'s own check was green before it merged);
  no ADR naming an experiment with no run started within two days.

## Logged, not fired

Nothing new to log this pass beyond what `docs/sprints/pending.md`
already carries (the redaction-gate UUID pattern, which engineer's own
live run is already working as its next unit, per its own run note).

## Dispatched by the PM

None this pass. `PM_DISPATCH_ENABLED` unset, and the criteria table
above found nothing that would have qualified regardless.
