# Dispatch queue — 2026-11-09, message-triggered (sixteenth pass)

**Sixteenth message pass of today.** Rechecked fresh against the
criteria table below. This pass merged nothing: `#794` (skill) is
Tier C and waits on the owner, and the standing note naming `#797`
(engineer) and `#799` (frontend) as orphaned drafts did not hold up
against `check-draft-prs.sh` or against a fresh re-read of the
standing endpoint itself. Full account in
`docs/agents/pm-2026-11-09-message-16-run.md`.

`PM_DISPATCH_ENABLED` cannot be read on this run's token (`gh variable
get` 403s, the same wall every host pass has found since 2026-10-17).
This is a host run, not a GitHub Actions run, so `gh workflow run
agent-<seat>.yml` (pm.md §11.5) does not apply here regardless of the
switch. Nothing below could fire from this run even if it qualified.

## Checked against the criteria table (pm.md §11.3) and Ursa's own three (§0b)

- **A seat run failed in the last 24h, diagnosable from its log:**
  `gh run list --limit 20` shows no non-success run. None.
- **A seat's open draft has failing CI, or a review comment unanswered
  >24h:** `#798` (security), `#799` (frontend), `#801` (skill), `#802`
  (this seat's own, draft while the run is live) are open drafts.
  `check-draft-prs.sh` reports all within their liveness window, "run
  may still be live; leave it alone. no orphaned drafts." None
  qualifies.
- **A sprint item due this week with no run from its owning seat:**
  unchanged — the newest sprint file is `sprint-2026-10-12.md`, 28
  days old, a ceremony-grooming finding already carried in
  `pending.md`, not this message-triggered pass's to open.
- **A seat has two or more open PRs on one scope, none merged:**
  `engineer` (`#788`, `#797`, `#797` already absorbs `#788`) and
  `frontend` (`#790`, `#799`, confirmed NOT a stack —
  `git merge-base --is-ancestor` fails between them, two independent
  pieces of work) both qualify on the letter of the criterion, but
  both are mid-run (see the run note); dispatching into a seat with a
  live run is the standard's own stop, not fired.
- **A ruling or ADR merged since the last run names a seat with no run
  following:** nothing new in `docs/decisions.md` since the last
  pass's own check.
- **A milestone due within three days with open items:** none.
- **Ursa's own three (§0b):** no tuning or trial run with unrecorded
  ledger results; no failing check on an open Minor-site or
  Major-resolver PR (none open); no ADR naming an experiment with no
  run started within two days.

## Logged, not fired (dispatch unavailable from this run regardless)

1. **Security's dependency finding (F93) still needs an engineer bump
   this seat cannot verify, carried unchanged from the fifteenth
   pass.** `ursa-minor`'s 608 dev dependencies carry 23 advisories (7
   high, 0 reaching the 33 production packages). Not fired: engineer's
   own lane has a live run this pass too. Candidate command once
   clear: `gh workflow run agent-engineer.yml -f
   owner_instructions='bump the ursa-minor dev-dependency lockfile to
   clear the 23 advisories in F93 (board message c028ba97), verified by
   a build; do not touch the 33 production dependencies, which are
   already clean'`.
2. **`#790` (frontend) is open, green, and was not reviewed this
   pass** — the wake named `#797`/`#799`, not it. Candidate for the
   next pass's `gh pr list` read rather than a dispatch.

## Nothing to fire this run

Nothing merged this pass, so there is nothing a dispatch would be
racing against; see `docs/agents/pm-2026-11-09-message-16-run.md` for
the full account of why `#794`, `#797` and `#799` all stayed
untouched.
