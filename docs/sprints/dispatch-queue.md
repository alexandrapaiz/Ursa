# Dispatch queue — 2026-11-09, message-triggered (twentieth pass)

**Twentieth message pass of today.** This pass merged four pull
requests (`#814`, `#818`, `#813`, `#811`), absorbed and closed this
seat's own stuck three-PR chain (`#805`, `#808`, `#819`), and checked
the standing block's claim twice, both times false. See `pending.md`
and `docs/agents/pm-2026-11-09-message-20-run.md` for the full account.

`gh run list --limit 30` shows no non-success run. `gh variable get
PM_DISPATCH_ENABLED` 403s (the same wall every host pass has found
since 2026-10-17) — this is a host run, not a GitHub Actions run, so
`gh workflow run agent-<seat>.yml` (pm.md §11.5) does not apply here
regardless of the switch. Nothing below could fire from this run even
if it qualified.

## Checked against the criteria table (pm.md §11.3) and Ursa's own three (§0b)

- **A seat run failed in the last 24h, diagnosable from its log:**
  none, per the read above.
- **A seat's open draft has failing CI, or a review comment unanswered
  >24h:** open drafts at the time of this check are `#816` (security),
  `#817` (exo), `#820` (skill), `#822` (market), `#823` (engineer).
  `check-draft-prs.sh` reports all of them within their workflow's own
  liveness window — "run may still be live; leave it alone. no
  orphaned drafts." None qualifies.
- **A sprint item due this week with no run from its owning seat:**
  unchanged — the newest sprint file is `sprint-2026-10-12.md`, 28
  days old, a ceremony-grooming finding already carried in
  `pending.md`, not this message-triggered pass's to open. Today is
  Monday; this run's own trigger is `message`, not the ceremony
  workflow, so opening it is not this pass's to do either.
- **A seat has two or more open PRs on one scope, none merged:** this
  seat's own three-PR chain qualified and was fixed this pass (see
  `pending.md` item 2). None observed among other seats.
- **A ruling or ADR merged since the last run names a seat with no run
  following:** nothing new in `docs/decisions.md` since the last
  pass's own check.
- **A milestone due within three days with open items:** none.
- **Ursa's own three (§0b):** no tuning or trial run with unrecorded
  ledger results; no failing check on an open Minor-site or
  Major-resolver PR (none open); no ADR naming an experiment with no
  run started within two days.

## Logged, not fired (dispatch unavailable from this run regardless)

1. **The redaction-gate's UUID pattern will false-positive again on
   any future cited URL with a UUID-shaped slug.** Unchanged from the
   last several passes: the pattern lives in
   `.github/workflows/redaction-gate.yml`, outside this seat's (and
   market's) writable surface. `alexandra-systems/exo-centralizer`
   named the engineer seat as the owner of the gate (board message
   `d5fc2d4d`). Not fired: engineer's only open row (`#823`) is a live
   draft opened minutes ago, and dispatching into a seat with an open
   PR is the standard's own stop. Candidate command once clear:
   `gh workflow run agent-engineer.yml -f owner_instructions='narrow
   .github/workflows/redaction-gate.yml's UUID pattern to exclude URL
   path segments (see board message d5fc2d4d and PR #773's own
   write-up); this likely needs owner or HQ review since it touches a
   workflow file'`.
2. **F93 (security's dependency finding) is no longer this file's to
   carry.** Handed off directly to engineer on the board by the
   nineteenth pass (`handoff`, message `678be19f`). Not re-logged
   here; it is engineer's inbox now, not a dispatch candidate.

## Nothing to fire this run

Four pull requests merged under Tier B this pass (`#814`, `#818`,
`#813`, `#811`) did not need a dispatch to exist; merging an existing
PR is not a dispatch. Absorbing and closing this seat's own stuck
chain is this seat's own housekeeping, also not a dispatch. See
`docs/agents/pm-2026-11-09-message-20-run.md` for the full account.
