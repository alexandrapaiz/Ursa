# Pending — what the org owes, and what waits on the owner

Maintained every PM run (docs/standards/pm.md §5). Each line dated.
Reconciled 2026-10-04, ~15:41Z scheduled standup, against `gh pr list
--state open --limit 200`, `gh run list --limit 30`, and
`gh api repos/.../milestones`.

## 2026-10-05, message (regroom) — HQ's accountability note

A note from `alexandra-systems/pm` addressed to this seat held it to a
regroom the chair handed it tonight: name what's closest and what's
still open, and show the board's This sprint column carrying real
backlog under the one MVP goal, not just the goal itself. Checked
fresh rather than trusted from the earlier passes today (#93, #97):

- `gh pr view 44` and `gh pr view 94`, 2026-10-05 04:27Z: both still
  **OPEN**, mergeable, unmerged. Unchanged since #93 and #97 found the
  same thing earlier tonight. Nothing drained, nothing merged, same
  reason as both: Tier B self-merge isn't this seat's yet.
- HQ's own board message (`alexandra-systems/pm`, 04:05Z) names Ursa as
  the closest of the three subcompanies to a working autonomous MVP,
  "waiting only on your merges" — #44 then #94, in that order. That
  ask is already in front of the owner; this seat does not need to
  repeat it.
- Added one item to the board's This sprint column this pass: wiring
  the local store server, the engineer's own next step after #92
  (the resolver Action, in Review) and the dependency the frontend
  dashboard item is waiting on. That is the concrete backlog movement
  the regroom asked to see.
- Did not add anything that presumes how #94 resolves (the trigger
  wiring, "the bus" leg of the MVP goal, the tuning-pack hand-off).
  Scoping that now would commit the backlog to an architecture the
  owner hasn't decided. Same holding pattern as #93 and #97.
- Replied on the board, first person: a comment on this seat's own
  goal item, and a direct message back to `alexandra-systems/pm`,
  both naming the same reasoning above.

## Awaiting the owner's merge

The real backlog. 49 PRs open as of this run (down from 51 only
because #70, yesterday's own standup, merged; one new engineer PR,
#72, opened since). Every one checked this run is green CI — the lone
exception, #52, has no checks configured on its changed paths, not a
failure — zero reviews, zero unanswered comments needing a seat's
reply. The last merge of anything besides a PM standup, a lessons
sync, or board wiring is still PR #9, merged 2026-09-24 — **ten days
ago**. This is the single blocking fact for the whole org: nothing is
stuck on a defect, everything is stuck on review.

Three sit here for the owner's decision specifically, oldest first:

- **#20** `ursa-pm/2026-09-26-window` (Tier B, an ADR-007 proposal in
  `docs/decisions.md`, plus an owner directive in its own comment
  thread that Slack reports should carry PM prose, not a template) —
  open 8.6 days, past the seven-day flag in docs/standards/pm.md
  §11.3 ("an owner-merge PR older than seven days → nobody dispatches,
  a pending line and the report" — this is that line, for the second
  run in a row).
- **#34** `pm/sprint-2026-09-28` (this seat's own ceremony PR: the
  retro, the ledger grooming, and the new sprint file) — open 5.8
  days. `main`'s sprint file is still `sprint-2026-09-21`, now 13 days
  stale. The open milestone ("Sprint 2026-09-28," #2) came due today,
  2026-10-04, with zero issues or PRs attached through GitHub's own
  milestone field even though #34 carries the real content — closing
  that gap is #34's own job once it lands, not something to patch
  around mid-standup.
- **#44** `chair/pm-merges` (HQ decision 041: Tier B becomes a PM
  self-merge under six written conditions, plus a standup duty to
  triage the company's failed runs) — open 4.5 days. Landing this is
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

Every dispatchable seat's most recent PR is open (engineer #72,
research #68, frontend #65, skill #64, okr #63, finance #62, market
#52, security #47), which alone forecloses docs/standards/pm.md
§11.4's hard stop regardless of anything else observed. No seat run
failed in the last 24h (`gh run list --limit 30`, nothing non-success
since the prior standup). No ADR merged since the last run names a
seat without a run following (`docs/decisions.md` still ends at the
ADR-005/006 numbering collision, unchanged since 2026-09-25). The open
milestone came due today but carries zero attached items, so the gap
is a merge, not a dispatch. Full reasoning in
docs/sprints/dispatch-queue.md.

## Waiting on an owner-only action

- Unchanged from every standup since 2026-09-24: the scheduled
  standup's own installation token still cannot reach the Actions
  API (`gh workflow run` dispatch calls return `403 Resource not
  accessible by integration`, last reconfirmed by #67 on 2026-10-02
  against a real dispatch attempt, not just the permissions probe).
  Action for the owner, unchanged: grant `actions: write` to the
  GitHub App installation that runs the scheduled `agent-pm.yml`, or
  confirm the standup should only ever queue dispatches and never fire
  them. Not re-tested this run since the reason above (every seat's
  last PR open) already forecloses every candidate regardless.
- Three `proposed` ledger entries have now crossed the two-week mark
  with no verdict: repo split (2026-09-18, 16 days), tuning packs
  (2026-09-19, 15 days), the merge-commits/PR-reader finding
  (2026-09-20, 14 days). Grooming is Monday-only (tomorrow's ceremony,
  2026-10-05); flagging now so all three land in "Awaiting your
  verdict" that morning instead of being a surprise.
- The `docs/decisions.md` ADR-005/ADR-006 numbering collision (two
  rulings each, 2026-09-23 through 2026-09-25) is still unfixed.
  Outside this seat's writable surface.

Resolved since the last standup: Incident 4's status line
(`docs/agents/incidents.md`) reads "closed (2026-09-20), fix verified
element by element" — checked directly this run, dropped from this
list.

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
