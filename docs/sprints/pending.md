# Pending — what the org owes, and what waits on the owner

Maintained every PM run (docs/standards/pm.md §5). Each line dated.
Reconciled 2026-10-03, ~15:08Z scheduled standup, against `gh pr list
--state all --limit 200`, `gh run list --limit 60`, and
`gh api repos/.../milestones`.

**This run closed four stale standup PRs** (#37, #45, #60, #67 —
2026-09-29 through 2026-10-02): each carried only this file and
`dispatch-queue.md`, each said in its own description that it
superseded the one before it, and none was ever merged or closed, so
they piled up instead of resolving. This run's own copy of both files
supersedes all four the same way; closing them removes duplicate, dead
PRs instead of leaving a fifth to pile on top. Per
docs/standards/pm.md §10, this PR touches only
`docs/sprints/pending.md` and `docs/sprints/dispatch-queue.md` (Tier
A), so it self-merges after that scope check — the same thing #12,
#17, and #23 already did while #20 sat open, and the same thing this
seat's own standups stopped doing for no stated reason starting with
#37. Restarting it is this run's process fix.

## Awaiting the owner's merge

The real backlog. 51 PRs open as of this run. Every one checked this
run is green CI, zero reviews, zero unanswered comments needing a
seat's reply. The last merge of anything besides a PM standup, a
lessons sync, or board wiring is still PR #9, merged 2026-09-24 —
**nine days ago**. This is the single blocking fact for the whole org:
nothing is stuck on a defect, everything is stuck on review.

Three sit here for the owner's decision specifically, oldest first:

- **#20** `ursa-pm/2026-09-26-window` (Tier B, an ADR-007 proposal in
  `docs/decisions.md`, plus an owner directive in its own comment
  thread that Slack reports should carry PM prose, not a template) —
  open 7.6 days, now past the seven-day flag in docs/standards/pm.md
  §11.3 ("an owner-merge PR older than seven days → nobody dispatches,
  a pending line and the report" — this is that line).
- **#34** `pm/sprint-2026-09-28` (this seat's own ceremony PR: the
  retro, the ledger grooming, and the new sprint file) — open 4.8
  days. `main`'s sprint file is still `sprint-2026-09-21`, now 12 days
  stale, and the open milestone ("Sprint 2026-09-28," due 2026-10-04,
  tomorrow) has zero issues or PRs attached through GitHub's own
  milestone field even though #34 carries the real content — closing
  that gap is this PR's own job once it lands, not something to patch
  around mid-standup.
- **#44** `chair/pm-merges` (HQ decision 041: Tier B becomes a PM
  self-merge under six written conditions, plus a standup duty to
  triage the company's failed runs) — open 3.5 days. Landing this is
  the actual unblock every standup since 2026-09-30 has named: it
  would let this seat clear the 40+ green, unreviewed builder PRs
  itself instead of waiting on her to click merge one at a time.

Everything else open is a builder-seat PR (engineer, research,
frontend, skill, security, market, okr, finance) or an owner-authored
"window" PR (#46-56, the 2026-09-30 synchronous session). Full list,
oldest first, is `gh pr list --state open`; not reproduced here since
the standup's finding is the count and the cause, not the enumeration,
and a static list would just go stale by tomorrow.

## This run's dispatch reasoning — nothing queued

Every dispatchable seat's most recent PR is open (engineer #69,
research #68, frontend #65, skill #64, okr #63, finance #62, market
#52, security #47), which alone forecloses docs/standards/pm.md
§11.4's hard stop regardless of anything else observed. No seat run
failed in the last 24h (`gh run list --limit 60`, nothing non-success
since 2026-10-02T15:00Z). No ADR merged since the last run names a
seat without a run following (`docs/decisions.md` still ends at the
ADR-005/006 numbering collision, unchanged since 2026-09-25). The open
milestone is due tomorrow but carries zero attached items, so the gap
is a merge, not a dispatch. Full reasoning in
docs/sprints/dispatch-queue.md.

## Waiting on an owner-only action

- Unchanged from every standup since 2026-09-24: the scheduled
  standup's own installation token still cannot reach the Actions
  API (`gh workflow run` dispatch calls return `403 Resource not
  accessible by integration`, reconfirmed by #67 on 2026-10-02 against
  a real dispatch attempt, not just the permissions probe). Action for
  the owner, unchanged: grant `actions: write` to the GitHub App
  installation that runs the scheduled `agent-pm.yml`, or confirm the
  standup should only ever queue dispatches and never fire them. Not
  re-tested this run since the reason above (every seat's last PR
  open) already forecloses every candidate regardless.
- Three `proposed` ledger entries have now crossed, or are crossing
  today, the two-week mark with no verdict: repo split (2026-09-18, 15
  days), tuning packs (2026-09-19, 14 days), the merge-commits/PR-reader
  finding (2026-09-20, 13 days). Grooming is Monday-only (next
  ceremony 2026-10-05); flagging now so it isn't a surprise that all
  three land in "Awaiting your verdict" that morning.
- Carried from 2026-09-24, not re-verified this run (exo's lane) —
  `docs/agents/incidents.md` Incident 4's status line.
- The `docs/decisions.md` ADR-005/ADR-006 numbering collision (two
  rulings each, 2026-09-23 through 2026-09-25) is still unfixed.
  Outside this seat's writable surface.

## Noticed in passing, not this seat's lane

- Frontend's #15, #35, and #51 each carry a self-comment ("superseded
  by #65") dated 2026-10-01 but are still open, not closed — the same
  pile-up pattern this run fixed for its own standup PRs, just in a
  different seat's lane. Not touched here; flagging so frontend's own
  next run (or the owner, directly) can close them.
- The owner's comment on #53 ("I could not read or reply on the
  board") suggests the board UI has a gap beyond the known `PATCH` 501
  (item-update not supported). Not this seat's lane to diagnose
  further.
