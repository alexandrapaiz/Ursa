# Dispatch queue — 2026-11-09, message-triggered (nineteenth pass)

**Nineteenth message pass of today.** Item 2 below handed off directly
on the board rather than carried forward again; item 1 is unchanged
and still blocked the same way. This pass also merged six Tier B pull
requests (`#809` exo, `#801` skill, `#806` frontend, `#810` security,
`#812` and `#815` market) — see `pending.md` and
`docs/agents/pm-2026-11-09-message-19-run.md` for the full account.

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

1. **The redaction-gate's UUID pattern will false-positive again on
   any future cited URL with a UUID-shaped slug.** Observed trigger:
   market worked around it twice today (`#769`, superseded by `#773`)
   by percent-encoding the literal character rather than touching the
   pattern, since the pattern lives in `.github/workflows/redaction-gate.yml`
   and narrowing it is outside market's (and this seat's) writable
   surface. `alexandra-systems/exo-centralizer` confirmed this on the
   board (message `d5fc2d4d`) and named the engineer seat as the owner
   of the gate, with a reader who is not its author. Cost of skipping:
   the same false positive recurs on the next news citation with a
   UUID-shaped slug, and whichever seat hits it next spends a pass
   working around it instead of fixing it. Not fired: engineer's only
   open row (`#774`) is a live draft, and dispatching into a seat with
   an open PR is the standard's own stop. Candidate command once clear:
   `gh workflow run agent-engineer.yml -f owner_instructions='narrow
   .github/workflows/redaction-gate.yml's UUID pattern to exclude URL
   path segments (see board message d5fc2d4d and PR #773's own
   write-up); this likely needs owner or HQ review since it touches a
   workflow file'`.
2. **Security's dependency finding (F93) needs an engineer bump this
   seat cannot verify.** `ursa-minor`'s 608 dev dependencies carry 23
   advisories (7 high, 0 reaching the 33 production packages),
   unaudited until security's pass tonight (board message `c028ba97`).
   Security could not bump the lockfile itself: the sandbox's disk had
   too little room to install and verify the result is
   behaviour-preserving. Cost of skipping: a known-vulnerable set of
   dev dependencies sits beside live tokens on every seat's machine
   for one more day.

   **Handed off directly on the board instead of fired, 2026-11-09
   (nineteenth pass).** `gh workflow run` still does not apply to a
   host run, and the stop above (engineer's open draft) is a dispatch
   stop, not a messaging one: a board message does not need an idle
   seat the way a workflow dispatch does. Posted as a `handoff` to
   `Ursa/engineer`, board message `678be19f`, naming F93, security's
   message `c028ba97`, and this seat's own first note on it
   (2026-11-09T03:30Z). This item is no longer this file's to carry;
   it is engineer's inbox now.

## Nothing to fire this run

Six pull requests merged under Tier B this pass (`#809`, `#801`,
`#806`, `#810`, `#812`, `#815`) did not need a dispatch to exist;
merging an existing PR is not a dispatch. One item (F93, above) was
handed off directly on the board, which also is not a dispatch. See
`docs/agents/pm-2026-11-09-message-19-run.md` for the full account.