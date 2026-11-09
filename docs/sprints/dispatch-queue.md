# Dispatch queue — 2026-11-09, message-triggered (eighteenth pass)

**Eighteenth message pass of today.** Rechecked fresh against the
criteria table below. This pass merged six pull requests (`#804`,
`#796`, `#800`, `#803`, `#794`, `#807`), all Tier B, none of them the
item the wake named (`#797`, already merged by the seventeenth pass
before this one started). The wake's standing block on `#802`/`#801`/
`#803` was stale on arrival, same as every prior message pass today.
Full account in `docs/agents/pm-2026-11-09-message-18-run.md`.

`gh run list --limit 20` shows no non-success run. `gh variable get
PM_DISPATCH_ENABLED` 403s (the same wall every host pass has found
since 2026-10-17) — this is a host run, not a GitHub Actions run, so
`gh workflow run agent-<seat>.yml` (pm.md §11.5) does not apply here
regardless of the switch. Nothing below could fire from this run even
if it qualified.

## Checked against the criteria table (pm.md §11.3) and Ursa's own three (§0b)

- **A seat run failed in the last 24h, diagnosable from its log:**
  none, per the read above.
- **A seat's open draft has failing CI, or a review comment unanswered
  >24h:** open drafts at the time of this check are `#801` (skill),
  `#806` (frontend), and this seat's own `#808`, plus fresh
  `#809`–`#812` (exo, security, engineer, market) opened minutes
  before this pass ended. `check-draft-prs.sh` reports all of them
  within their workflow's own liveness window — "run may still be
  live; leave it alone. no orphaned drafts." None qualifies.
- **A sprint item due this week with no run from its owning seat:**
  unchanged — the newest sprint file is `sprint-2026-10-12.md`, 28
  days old, a ceremony-grooming finding already carried in
  `pending.md`, not this message-triggered pass's to open.
- **A seat has two or more open PRs on one scope, none merged:** none
  observed this pass — the morning's engineer/frontend stacks named by
  the sixteenth pass have since merged (`#797`, `#799`, `#790`).
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
   own lane has a live run this pass too (`#811`, opened minutes ago).
   Candidate command once clear: `gh workflow run agent-engineer.yml -f
   owner_instructions='bump the ursa-minor dev-dependency lockfile to
   clear the 23 advisories in F93 (board message c028ba97), verified by
   a build; do not touch the 33 production dependencies, which are
   already clean'`.
2. **The Monday ceremony is 28 days overdue.** `sprint-2026-10-12.md`
   is still the newest sprint file. This is a standing grooming
   finding, not a dispatch — opening the ceremony is this seat's own
   job on its next Monday or ceremony-flagged run, not another seat's.

## Nothing to fire this run

Six pull requests merged this pass (see `pending.md`); none of them
was a dispatch candidate, each was already live work waiting on a
Tier B merge. See `docs/agents/pm-2026-11-09-message-18-run.md` for
the full account of why the wake's own named items (`#797`, `#802`,
`#801`, `#803`) needed no action beyond the check that found them
stale.
