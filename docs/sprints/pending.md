# Pending — what the org owes, and what waits on the owner

Maintained every PM run (docs/standards/pm.md §5). Each line dated.
Reconciled 2026-10-01, ~17:17Z scheduled standup, against `gh pr list
--state all --limit 100`, `gh run list --limit 30`, `gh api
repos/.../milestones?state=all`, and a fresh `gh api
actions/permissions` probe.

## Awaiting the owner's merge

**The merge queue, not seat idleness, is the standing blocker.** 41 PRs
open as of this run (was 39 on 2026-09-30's second pass). The last
merge of anything other than a PM standup or an exo lessons sync is
still PR #9, from 2026-09-21 — ten days running. Every PR checked this
run is green CI (one exception noted below), zero reviews, zero
comments on all but one (#53, an owner comment, already actioned).
Nothing is stuck on a defect; everything is stuck on a merge.

- **#34 `pm/sprint-2026-09-28`** (2.9 days old) — the ceremony PR that
  would land the current sprint. `main` still carries `sprint-2026-09-21`
  (closed, milestone #1); the sprint file on `main` is now ten days
  stale. Blocks nothing technically, but means there is no live sprint
  to check seat activity against this run or next Monday's.
- **#44 `chair/pm-merges`** (HQ decision 041, Tier B merge authority for
  PMs) still open, 1.6 days old. This is the unlock for the whole merge
  queue above: once it lands, PR #53 names 13 PRs the PM would be
  eligible to merge (#15, #22, #24, #25, #27 with a caveat, #28, #32,
  #33, #35, #36, #38, #43, #55). This run keeps today's chartered
  boundary — no self-merge attempted, consistent with the top-level run
  instructions for this invocation (never merge own PR, never push to
  main).
- **#20 `ursa-pm/2026-09-26-window`** and **#53
  `ursa-pm/2026-09-30-window`** each carry a Tier B ADR draft
  (ADR-007, ADR-008 respectively) in `docs/decisions.md`, proposed, not
  yet on `main`.
- **Three PRs crossed seven days open since the last standup**: #13
  `engineer/2026-09-24-trace-stage-loops` (7.1d), #14
  `skill/2026-09-24-outcome-record-provenance` (7.0d), #15
  `fe/2026-09-24-visual-review` (7.0d). Per §11.3 this is a pending line
  and the owner report, not a dispatch — nothing is wrong with any of
  the three, they are simply the oldest items in the queue above.
- **#52 `ursa-market/2026-09-30-window`** reports "no checks" rather
  than green — not a failure, the redaction-gate workflow appears not
  to have run on this branch. Flagging so it isn't mistaken for a clean
  pass when merge order is picked.
- The remaining 33 open PRs are listed in full in `gh pr list --state
  open`; grouping by seat and age did not surface anything beyond what
  the four items above already say. All green, all unreviewed.

## Waiting on an owner-only action

- **Reconfirmed again this run — the scheduled standup's own token
  still cannot reach the Actions API.** Fresh probe: `gh api
  /repos/alexandrapaiz/Ursa/actions/permissions` → 403 "Resource not
  accessible by integration." Unchanged since 2026-09-24 (now the sixth
  day straight from this credential). Not load-bearing this run since
  §11.4's hard stop already empties the dispatch queue for an
  independent reason (see `docs/sprints/dispatch-queue.md`), but still
  open for the owner: grant `actions: write` to the GitHub App
  installation that runs the scheduled `agent-pm.yml`, or confirm the
  scoping is deliberate.
- **The `docs/decisions.md` ADR numbering collision is still unfixed**,
  carried from 2026-09-25 (now 6 days): two entries each numbered
  ADR-005 and ADR-006, for four different rulings across 2026-09-23
  through 2026-09-25. Still outside this seat's writable surface.
- **Incident 4's Status line is unchanged** — "Open until both are
  edited" (docs/agents/incidents.md). Carried from 2026-09-24, exo's
  lane, re-confirmed by reading this run rather than assumed.
- **Three `proposed` ledger entries still have no owner verdict**: repo
  split (2026-09-18, now 13 days — one day from the two-week mark),
  tuning packs (2026-09-19, now 12 days), the merge-commits/PR-reader
  finding (2026-09-20, now 11 days). Grooming itself is a Monday-only
  duty (charter §11.1); repo split will cross the two-week line before
  the next Monday ceremony (2026-10-05), so it will land in that
  ceremony's "Awaiting your verdict" regardless.

## This run's dispatch reasoning — nothing queued

Every dispatchable seat (engineer, market, research, skill, frontend,
security, okr, finance) currently carries an open PR, which means
§11.4's hard stop blocks the entire table by itself, same conclusion as
the last several standups. Nothing red in `gh run list`, no ruling
merged to `main` since the last standup names an unserved seat. Full
reasoning in `docs/sprints/dispatch-queue.md`.

## Newly active, first crons now fired

- security and finance have both now had their first scheduled
  occurrence (security Sun 2026-09-27, finance 2026-10-01) and each
  shipped a PR (#28, #55). No seat remains waiting on a delayed first
  occurrence.

## Noticed in passing, not this seat's lane

- Since the last standup, the only commit to land on `main` is the HQ
  lessons sync (8c453f0: L-E10 "survey the PRs before you build", L-E8
  amended). Nothing else merged, consistent with the merge-queue
  finding above.
