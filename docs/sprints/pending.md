# Pending — what the org owes, and what waits on the owner

Maintained every PM run (docs/standards/pm.md §5). Each line dated.
Reconciled 2026-10-05, ~12:21Z six-hour message pass, against `gh pr
list --state open --limit 200`, `gh pr list --state merged --limit
10`, `gh run list --limit 60`, and the board's message log
(`/api/messages?company=Ursa&seat=pm`).

## Awaiting the owner's merge

75 PRs open as of this run. Every one checked is green CI. The last
merge of anything into `main` is still the lessons sync, #78, merged
2026-10-05 at 02:28Z — just under ten hours ago as of this pass.
Nothing is stuck on a defect. Everything is stuck on review.

Four sit here for the owner's decision specifically, oldest first:

- **#20** `ursa-pm/2026-09-26-window` (Tier B, an ADR-007 proposal in
  `docs/decisions.md` plus an owner directive that Slack reports
  should carry PM prose, not a template) — open 9.5 days, past the
  seven-day flag in docs/standards/pm.md §11.3 for the third run in a
  row.
- **#34** `pm/sprint-2026-09-28` (an earlier ceremony PR: retro,
  grooming, sprint file) — open 6.7 days, now `CONFLICTING` against
  `main`. Superseded by #93's retro and sprint file. Recommend closing
  this one once #93 lands rather than merging both.
- **#93** `ursa-pm/2026-10-05-message` (this Monday's ceremony: retro,
  ledger grooming, the new sprint file) — open 8.8 hours. `main`'s
  sprint file is still `sprint-2026-09-21`, now 14 days stale, and the
  board's own sprint object is still that same open, unclosed sprint.
- **#44** `chair/pm-merges` (HQ decision 041: Tier B becomes a PM
  self-merge under six written conditions, plus the failed-run triage
  duty) — open 5.4 days. This is still the actual unblock: once it
  lands, this seat can clear the green, unreviewed builder backlog
  itself instead of asking for one merge click at a time. Checked
  fresh this pass — still open, unmerged. Nothing merged under that
  authority this run because the authority has not arrived here yet.

Also named by HQ's chair as a priority alongside #44: **#94**
`chair/bus-trigger-2026-10-05` (the workflow-trigger door — every seat
workflow listens for its own event type only), open 8.4 hours.

Sprint item 1, the resolver GitHub Action (**#92**,
`ursa-engineer/2026-10-05-message`), is code-complete, green CI, zero
comments, and sitting in the board's Review column. It needs nothing
but her read — no code-side blocker.

Everything else open is a builder-seat PR (engineer, research,
frontend, skill, security, market, okr, finance) or an owner-authored
"window"/"message" PR from today's and recent sessions. Full list,
oldest first, is `gh pr list --state open`; not reproduced here since
the finding is the count and the cause, not the enumeration.

## This run's dispatch reasoning — nothing queued

Every dispatchable seat's most recent PR is open (engineer #92/#77,
research #82, frontend #84, skill #83, okr #88, finance #91, market
#89, security #85), which alone forecloses docs/standards/pm.md
§11.4's hard stop. `gh run list --limit 60` shows exactly one run in
the last six hours (06:29Z to now): this seat's own redaction-gate
check on the prior message pass, which succeeded. No seat run failed.
No ADR merged since the last run names a seat without a run
following. Could not confirm `PM_DISPATCH_ENABLED` directly this run
(`gh variable get` returned 403, resource not accessible by this
token) — moot regardless, since the hard stop above forecloses
dispatch either way. Full reasoning in docs/sprints/dispatch-queue.md.

## Inbox and messages addressed to pm

Read the board's message log in full (79 entries). Nothing new is
addressed to this seat since its own note at 06:28:51Z closing the
prior pass — the only traffic since then is HQ's engineer seat
claiming the tier-split script and releasing its own branch sweep in
`alexandra-systems`, neither addressed to Ursa's pm and neither
needing an answer from this seat. Posted one new note to the board
this pass (`kind: note`, seat `pm`, company `Ursa`) summarizing the
six-hour window and the reason for each call.

## Waiting on an owner-only action

- Unchanged since 2026-09-24: the scheduled standup's own
  installation token still cannot reach the Actions API. Action for
  the owner, unchanged: grant `actions: write` to the GitHub App
  installation that runs the scheduled `agent-pm.yml`, or confirm the
  standup should only ever queue dispatches and never fire them. Not
  re-tested this run since the hard stop above already forecloses
  every candidate regardless.
- Three `proposed` ledger entries are now well past the two-week mark
  with no verdict: repo split (2026-09-18, 17 days), tuning packs
  (2026-09-19, 16 days), the merge-commits/PR-reader finding
  (2026-09-20, 15 days). Grooming is ceremony-lane (Monday), already
  drafted in #93; flagging again here since #93 itself is still
  unmerged.
- The `docs/decisions.md` ADR-005/ADR-006 numbering collision (two
  rulings each, 2026-09-23 through 2026-09-25) is still unfixed.
  Outside this seat's writable surface.

## Noticed in passing, not this seat's lane

- The board's "Wire the local store server" item (This sprint column,
  engineer) carries a `source_url` pointing at PR #92, but #92 is the
  resolver work — a different item, the one sitting in Review with no
  `source_url` attached at all. The two look swapped. Not fixed here
  (no supported update path for an item's `source_url` found this
  run); flagging so whichever seat touches that item next corrects it.
- Frontend's #15, #35, and #51 each still carry a self-comment
  ("superseded by #65") dated 2026-10-01 but remain open, not closed.
  Not this seat's lane; flagging again for frontend's own next run or
  the owner directly.
