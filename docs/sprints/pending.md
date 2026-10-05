# Pending — what the org owes, and what waits on the owner

Maintained every PM run (docs/standards/pm.md §5). Each line dated.
Reconciled 2026-10-05, ~18:22Z six-hour pass, against `gh pr list
--state open --limit 200`, `gh run list --limit 60`, the board
(`$BOARD_API_URL/api/board/Ursa`), and the board's message log
(`$BOARD_API_URL/api/messages?company=Ursa`).

## Awaiting the owner's merge

The real backlog. 76 PRs open as of this run, up from 75 at the
noon pass (#101) and 74 at the 06:27Z pass (#100). Every one checked
this run is green CI except #52 and #89, which have no checks
configured on their changed paths, not a failure. The last merge of
anything to `main` is still PR #78 (the lessons sync, 02:28Z) — about
sixteen hours ago now. This is the same single blocking fact every
pass tonight has named: nothing is stuck on a defect, everything is
stuck on review.

Four sit here for the owner's decision specifically, oldest first:

- **#20** `ursa-pm/2026-09-26-window` (Tier B, an ADR-007 proposal in
  `docs/decisions.md`, plus an owner directive that Slack reports
  should carry PM prose, not a template) — open 9.7 days, long past
  the seven-day flag in docs/standards/pm.md §11.3.
- **#34** `pm/sprint-2026-09-28` (an earlier ceremony PR) — open 9.7
  days, superseded by #93's retro and sprint file; recommend closing
  #34 once #93 lands rather than merging both.
- **#44** `chair/pm-merges` (the merge-authority change: Tier B
  becomes a PM self-merge under six written conditions, plus a
  standup duty to triage failed runs) — open 5.6 days, still
  **OPEN and unmerged**, checked fresh this pass. This is the
  specific authority this run was told to use if it had landed. It
  has not, so nothing was self-merged under it this pass, same as
  every pass tonight.
- **#94** `chair/bus-trigger-2026-10-05` (the bus's workflow door:
  every seat workflow listens for its own event type) — open ~14.5
  hours, still OPEN, named by HQ as the second half of the same
  unblock as #44.

Also open and specific to today's threads: **#93** (this Monday's
ceremony — retro, grooming, the new sprint file, still the current
sprint commitment waiting on a read) and **#92** (sprint item one,
the resolver GitHub Action — code-complete, green CI, sitting in the
board's Review column, waiting only on a read; nothing code-side has
changed on it in twelve hours).

Everything else open is a builder-seat PR (engineer, research,
frontend, skill, security, market, okr, finance) or a same-day
"window"/"message" PR from tonight's synchronous session and its
six-hour follow-ups. Full list, oldest first, is `gh pr list --state
open --limit 200`; not reproduced here since the finding is the count
and the cause, not the enumeration, and a static list would go stale
by the next pass.

## This run's dispatch reasoning — nothing queued

Every dispatchable seat's most recent PR is open (engineer #92,
research #82, frontend #84, skill #83, okr #88, finance #91, market
#89, security #85), which alone forecloses docs/standards/pm.md
§11.4's hard stop regardless of anything else observed. No seat run
appears in `gh run list --limit 60` for the last six hours at all —
zero runs, so zero failures to triage, the quietest window yet today.
No ADR merged since the last run names a seat without a run following
(`docs/decisions.md` unchanged since 2026-09-25, still the ADR-005/006
numbering collision). The open milestone ("Sprint 2026-09-28") is now
a day past due with zero attached items; the gap is #34 merging, an
owner action, not a dispatch. Full reasoning in
docs/sprints/dispatch-queue.md.

## Inbox and failed-run triage, this pass

- Read the board's message log in full (77 entries) via
  `$BOARD_API_URL/api/messages?company=Ursa`. Nothing posted since
  this seat's own 12:26:02Z note (PR #101) addresses or asks anything
  of `pm`. Nothing to answer.
- `gh run list --limit 60`: zero runs started in the last six hours
  (12:26Z to 18:22Z), this seat's own included. Zero failures to
  triage.
- Checked PR #44 and PR #94 live: both still OPEN, mergeable, CLEAN.
  Fifth and counting consecutive check tonight with the same finding.

## Waiting on an owner-only action

- Unchanged since 2026-09-24: the scheduled standup's installation
  token still cannot reach the Actions API to fire dispatches
  (`gh workflow run` returns `403`), last reconfirmed 2026-10-02.
  Action for the owner: grant `actions: write` to the GitHub App
  installation on `agent-pm.yml`, or confirm the standup should only
  ever queue dispatches. Not re-tested this run since every seat's
  last PR being open already forecloses every candidate regardless.
- The merge-authority change (#44) and the bus workflow door (#94),
  named first and third in HQ's own ordered ask to the owner — the
  two merges that unlock the rest of this seat's queue.
- Three `proposed` ledger entries are now past two weeks with no
  verdict: repo split (2026-09-18, 17 days), tuning packs (2026-09-19,
  16 days), the merge-commits/PR-reader finding (2026-09-20, 15 days).
  Grooming is this Monday's ceremony, carried in #93 — flagging here
  so the thread does not lose it if #93 is read before this PR.
- The `docs/decisions.md` ADR-005/ADR-006 numbering collision is still
  unfixed. Outside this seat's writable surface.

## Noticed in passing, not this seat's lane

- Frontend's #15, #35, and #51 each still carry a self-comment
  ("superseded by #65") dated 2026-10-01 but remain open, not closed.
  Not touched here; flagging again for frontend's own next run or the
  owner directly.
- HQ's engineer seat is building a three-way tier split
  (`alexandra-systems` PR #112, `tools/check-tier.sh`) to make the
  Tier B condition this seat currently checks by hand into a command.
  Not addressed to Ursa's `pm`, and not merged there either. Watching,
  not acting: it would make future passes cheaper once it lands and
  #44 lands here.
