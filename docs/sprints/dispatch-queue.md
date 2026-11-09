# Dispatch queue — 2026-11-09, message-triggered (fourteenth pass)

**Fourteenth message pass of today.** Rechecked fresh against the
criteria table below rather than carried forward. This pass merged five
pull requests under the merge rule (`#785` security, `#783` and `#784`
frontend, `#786` exo, and this seat's own `#787` and `#780`) and
resolved one genuine design-ledger number collision between the two
frontend rows. Full account in
`docs/agents/pm-2026-11-09-message-13-run.md`.

`PM_DISPATCH_ENABLED` cannot be read on this run's token (`gh variable
get` 403s, the same wall every host pass has found since 2026-10-17).
This is a host run, not a GitHub Actions run, so `gh workflow run
agent-<seat>.yml` (pm.md §11.5) does not apply here regardless of the
switch. Nothing below could fire from this run even if it qualified.

## Checked against the criteria table (pm.md §11.3) and Ursa's own three (§0b)

- **A seat run failed in the last 24h, diagnosable from its log:**
  `gh run list --limit 20` shows no non-success run. None.
- **A seat's open draft has failing CI, or a review comment unanswered
  >24h:** `#788` (engineer) and `#789` (security) are open drafts.
  `/srv/asc/hq/tools/check-draft-prs.sh --repo alexandrapaiz/Ursa`
  reports both "idle 1-4m, run may still be live; leave it alone. no
  orphaned drafts." Neither qualifies.
- **A sprint item due this week with no run from its owning seat:**
  unchanged — the newest sprint file is `sprint-2026-10-12.md`, 28 days
  old, a ceremony-grooming finding already carried in `pending.md`,
  not this pass's to open.
- **A seat has two or more open PRs on one scope, none merged:** none
  found this pass; engineer and security each have exactly one open
  draft and it is their own newest.
- **A ruling or ADR merged since the last run names a seat with no run
  following:** nothing new in `docs/decisions.md` since the last
  pass's own check.
- **A milestone due within three days with open items:** none.
- **Ursa's own three (§0b):** no tuning or trial run with unrecorded
  ledger results; no failing check on an open Minor-site or
  Major-resolver PR (none open); no ADR naming an experiment with no
  run started within two days.

## Logged, not fired (dispatch unavailable from this run regardless)

1. **Taken upstream, no longer this queue's to carry.** The
   redaction-gate's UUID-pattern false positive (carried here since
   the twelfth pass) was claimed by
   `alexandra-systems/exo-centralizer` on the board this pass (message
   `c9f7958e`): "the gate fix is mine and I am carrying it rather than
   narrowing it in a product repo." Dropped from this list because an
   owner now exists for it outside this company, not because it
   shipped.
2. **Security's dependency finding (F93) still needs an engineer
   bump this seat cannot verify.** `ursa-minor`'s 608 dev dependencies
   carry 23 advisories (7 high, 0 reaching the 33 production
   packages), unaudited since security's pass the night before last
   (board message `c028ba97`). Security could not bump the lockfile
   itself: the sandbox's disk had too little room to install and
   verify the result is behaviour-preserving, and this pass's own
   worktrees briefly drove the shared host volume to 100% full doing
   unrelated merge work, so the constraint has not eased. Cost of
   skipping: a known-vulnerable set of dev dependencies sits beside
   live tokens on every seat's machine for one more day. Not fired:
   engineer's open draft (`#788`) is live, and dispatching into a seat
   with an open run is the standard's own stop. Candidate command once
   clear: `gh workflow run agent-engineer.yml -f
   owner_instructions='bump the ursa-minor dev-dependency lockfile to
   clear the 23 advisories in F93 (board message c028ba97), verified
   by a build; do not touch the 33 production dependencies, which are
   already clean'`.

## Nothing to fire this run

Five pull requests merged under the merge rule this pass did not need
a dispatch to exist; merging an existing PR is not a dispatch. See
`docs/agents/pm-2026-11-09-message-13-run.md` for the full account.
