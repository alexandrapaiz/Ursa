# Pending — what the org owes, and what waits on the owner

Maintained every PM run (docs/standards/pm.md §5). Each line dated.
Reconciled 2026-10-04, ~15:41Z scheduled standup, against `gh pr list
--state open --limit 200`, `gh run list --limit 30`, and
`gh api repos/.../milestones`.

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

## Two board handoffs, 2026-10-05 (message-triggered run, after #93/#95)

This section is new content appended at the end, not a rewrite of the
sections above (those are #93's and today's earlier standup/window
PRs' content, still unmerged). This PR, #93, #95, and #90 all touch
this file. Recommended order: #90 (earliest, smallest diff) → #93
(the larger ceremony rewrite) → #95 → this PR, since each later one is
additive at the end and rebases cleanly onto the one before it; any
order works as long as each is rebased before merge.

### 1. The merge-order handoff (chair:epitome → alexandra-systems/pm → here; board messages `0008900e`, `5302f4f5`)

Checked before acting: PR #44 (`chair/pm-merges`, the Tier-B
self-merge grant) is still **open**, unmerged, confirmed again this
run via `gh pr view 44`. The board's own `chair:epitome` note
(`e72e9d6d`, 03:57Z) confirms the same thing from the other side: the
owner merged the HQ and epitome merge grants tonight, but "alexandria's
and Ursa's copies of that decision are still open pull requests in
their repos, so their PMs keep waiting on her." So this seat lands
**nothing** itself this run, same as the HQ PM's own finding ("merged
what I could, which was nothing").

The five-merge order, from `docs/agents/merge-order.md` (written by
PR #76, itself unmerged, so quoted here rather than linked to a stale
path): in sequence, **#74** (engineer — closes 20 of 52, carries the
CSRF fix on the bridge and the `next` RCE upgrade, both sitting
unmerged a full week), **#65** (frontend — closes 3), **#62**
(finance — closes 1), **#40** (chair — closes 1), **#76** (ExO's own,
last, because its two conflicts are pre-resolved in writing in that
same file's §4b). Taking all five returns every Ursa seat to
dispatchable at once (§11.4's hard stop currently blocks all eleven).

**Owner action needed, in this order, security first:** #74, #65,
#62, #40, #76. Nothing is stuck on a defect or a review comment;
every one is green CI. The only thing stuck is that no Ursa seat has
merge authority yet.

### 2. The dashboard scope-widening handoff (chair:ursa)

The owner declared satisfaction with the surfaces today, in her own
words, per the chair's handoff. Recording that as the design's
declared acceptance: the four artboards are the frozen spec, built as
shown, no redesign churn. The deliverable widens from the panel alone
to a full working product: the dashboard becomes real alongside the
resolver and the panel, all three reading one real local store.

**Working Backwards gate (docs/standards/pm.md §2c, L-P5):** the
existing `docs/prfaq/overlay.md` PR/FAQ covers the panel and the
bridge. It does not cover the dashboard. The dashboard is a new
surface that changes what the product is (a local web app, not just an
overlay), which the standard says gets its own PR/FAQ before it enters
a sprint as committed scope. The owner's own declared satisfaction is
real acceptance of the *design*, but it is not a substitute for that
PR/FAQ as the engineering go-decision — flagging this gap rather than
drafting the document blind, since this run has not seen the four
artboards itself and a PR/FAQ written without them would be inventing
detail, not transcribing it. Next ceremony (or a dispatch naming the
artboards' location) should close this gap before the dashboard
becomes a committed sprint item rather than a board item under
"This sprint."

**Assignments, carried to the board directly** (items created/updated
on board.alexandra-systems-company.com/Ursa rather than
`sprint-2026-10-05.md`, since that file is only a draft inside #93 and
is not yet on `main`):

- **frontend** — dashboard and panel markup from the four artboards:
  tuning units with evidence counts and survival bars, edit and revoke
  with tombstones, the tension review that asks instead of averaging.
- **engineer** — the wiring, in order: resolver first (already #92's
  scope, item one of today's sprint per #93), then the store server
  for the dashboard, then the bridge hookup for the panel.

**Acceptance bar, as stated by the chair, carried forward unchanged:**
the owner runs one install, opens the dashboard on her own real tuning
from the trials, captures a chat in the panel, and sees the next
resolver run land in the same store. Collect her verdict in her own
words when it is in her hands — declared acceptance, not inferred from
retention, per CLAUDE.md §0.
