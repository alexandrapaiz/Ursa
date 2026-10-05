# Pending — what the org owes, and what waits on the owner

Maintained every PM run (docs/standards/pm.md §5). Each line dated.
Reconciled 2026-10-04, ~15:41Z scheduled standup, against `gh pr list
--state open --limit 200`, `gh run list --limit 30`, and
`gh api repos/.../milestones`.

## 2026-10-05, message (six-hour pass)

Not the Monday cron — the ceremony already ran today under a message
handoff (#93, open, carries the retro/grooming/sprint-planning). This
pass is the operational one: inbox and the board's message log, the
last six hours of runs, what's mergeable, and the sprint's movement.

**Inbox / board messages** — read `/api/messages?company=Ursa&seat=pm`
in full (78 entries). Nothing addressed to this seat has arrived since
this seat's own 05:17:23Z note (#99, closing the regroom loop with
HQ). Everything after that timestamp is engineer bus chatter (claiming
and releasing `tools/check-tier.sh` and its own branch namespace for a
conflict sweep) — nothing for pm to answer.

**Failed runs, last six hours** — `gh run list --limit 60`: one
non-success. The scheduled `engineer-agent` run that started
02:13:22Z finished `cancelled` at 02:58:40Z, 45 minutes and 16 seconds
later — that is the job's own `timeout-minutes: 45` in
`.github/workflows/engineer-agent.yml` firing, not an external
cancellation; `claude_args` on that workflow still allows
`--max-turns 120` on `claude-opus-5`, which this run didn't finish in
time. Diagnosable, but not dispatchable: every one of engineer's PRs,
scheduled or dispatched, is currently open, which forecloses §11.4's
hard stop before the diagnosis matters. Flagging the timeout/turns
mismatch as a workflow-tuning candidate for whoever next touches
`.github/workflows/engineer-agent.yml` — out of this seat's writable
surface.

**Ready to merge** — checked live: PR #44 (`chair/pm-merges`, the
change that would let this seat merge Tier B work itself) is still
**open**, unmerged. That authority has not landed on this repo, so
this pass merges nothing and instead names what waits on her, one
line each:

- **#44** — the merge-authority grant itself. Until it lands, this
  seat can only report the backlog, not clear it.
- **#94** — the bus's workflow trigger door, named third in HQ's own
  ordered ask to the owner, right behind #44.
- **#20** — the oldest Tier B decision open, an ADR proposal plus a
  Slack-format directive, now past nine days.
- **#92** — sprint item 1, the resolver packaged as a GitHub Action.
  Green CI, sitting in the board's Review column, code-complete and
  waiting on a read, not a fix.
- The rest of the 74 open PRs split into two piles: about 60 are
  builder-seat work (engineer, research, frontend, skill, security,
  market, okr, finance), every one green CI with no defect found, a
  pure review queue; the other 10 are this seat's own `pm`-branch
  PRs from tonight and prior weeks. This pass does not merge any of
  them (self-merge is off the table for this run by instruction, not
  by charter) but flags that six of the ten (#90, #93, #95, #97, #98,
  #99) all touch `docs/sprints/pending.md` additively from the same
  running thread tonight and should land as one, not six — #99's own
  description already proposes the order (#90 → #93 → #95 → #97 →
  #98 → #99, each rebased on the one before).

**Sprint movement** — nothing new merged to `main`; the last
non-housekeeping merge is still PR #9, now eleven days gone, so
"what shipped" is unchanged from every pass tonight. What moves today:
sprint item 1 (the resolver Action, #92) is the one piece actually
ready to move — it only needs her read. Items 2 and 3 have not moved:
no open PR touches `docs/security/redaction-standard.md` yet, and
item 3's PR (#21, `landscape.md`) is still open, three weeks in.
Handing off: security owns item 2 outright, nobody has started it;
market continues #21 for item 3; engineer picks up the local-store
item already queued behind #92 on the board once #92 lands.

## Awaiting the owner's merge

The real backlog. 74 PRs open as of this run (up from 49 on
2026-10-04's standup — the night's message passes, chair handoffs, and
builder dispatches added the rest). Every one checked this run is
green CI. The last merge of anything besides a PM standup, a lessons
sync, or board wiring is still PR #9, merged 2026-09-24 — **eleven
days ago**. This is the single blocking fact for the whole org:
nothing is stuck on a defect, everything is stuck on review.

Named for the owner's decision specifically, oldest first:

- **#20** `ursa-pm/2026-09-26-window` (an ADR-007 proposal in
  `docs/decisions.md`, plus an owner directive in its own comment
  thread that Slack reports should carry PM prose, not a template) —
  open past nine days, past the seven-day flag in
  docs/standards/pm.md §11.3 for the third run in a row.
- **#34** `pm/sprint-2026-09-28` (this seat's own earlier ceremony PR)
  — open 6.8 days, superseded in content by tonight's #93; recommend
  closing #34 rather than merging it once #93 lands, so only one
  sprint file claims to be current.
- **#44** `chair/pm-merges` (the change that turns builder-PR review
  into a PM self-merge under written conditions, plus a standup duty
  to triage the company's failed runs) — open 5.5 days. Landing this
  is still the single highest-leverage merge available: every pass
  since 2026-09-30 has named it, and it is the one thing that would
  let this seat clear the 60-plus green, unreviewed builder PRs
  itself instead of her clicking merge one at a time.
- **#94** `chair/bus-trigger-2026-10-05` (the workflow door the event
  bus needs to dispatch seats on its own) — open since tonight,
  named right behind #44 in HQ's own ordered ask.

Everything else open is a builder-seat PR (engineer, research,
frontend, skill, security, market, okr, finance), this seat's own
message-pass PRs (see above), or an owner-authored "window" PR
(#46-56, the 2026-09-30 synchronous session, plus tonight's
`-window` set). Full list, oldest first, is `gh pr list --state
open`; not reproduced here since the finding is the count and the
cause, not the enumeration, and a static list would just go stale by
tomorrow.

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
