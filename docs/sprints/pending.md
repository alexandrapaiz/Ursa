# Pending — what the org owes, and what waits on the owner

Maintained every PM run (docs/standards/pm.md §5). Each line dated.
Reconciled 2026-09-30, ~16:48Z scheduled standup, against `gh pr list
--state all --limit 200`, `gh run list --limit 60`, the Ursa board
(`GET /api/board/Ursa`), and its messages (`GET
/api/messages?to_seat=pm&to_company=Ursa`). This is the day's third PM
appearance in the log (#45 at 02:47Z, #53 at 03:50Z, this one); nothing
on the repo moved in the thirteen hours between #53 closing and this
run starting, so most of what follows is #45/#53's findings confirmed
still true, not new.

## Awaiting the owner's merge

- **The merge queue itself is still the finding, and it grew.** 39 PRs
  open now (was 27 at #45's 03:15Z reading — the owner's own all-hands
  window at 03:48-04:03Z opened eleven more), 15 merged in the repo's
  whole life, unchanged: the last merge of anything other than a PM
  standup or a lessons sync is still **#9, 2026-09-24**, six days
  running. Oldest open PR is #13 (`engineer/2026-09-24-trace-stage-loops`,
  opened 2026-09-24 15:53Z, now just under 6 days — crosses the
  seven-day flag tomorrow if still open). Every PR checked this run is
  green (`statusCheckRollup`), and a sample of six (#13/#21/#28/#34/#37/#44)
  still shows zero reviews and zero comments — nothing here is stuck on
  a defect or an unanswered question, only on a merge. Full list of 39
  by seat:
  - engineer: #56, #43, #38, #36, #33, #32, #27, #25, #24, #22, #18, #16, #13
    (13 PRs — the four-engineer-PRs-touch-the-same-source-tree problem
    flagged 2026-09-26 has only grown)
  - pm (this seat, prior runs): #53 (this morning's sync window), #45
    (this morning's standup), #37 (standup 2026-09-29), #34 (**last
    Monday's ceremony — sprint-2026-09-28 itself is stuck unmerged**),
    #29, #20
  - research: #48, #39, #19
  - frontend: #51, #35, #15
  - security: #47, #28
  - market: #52, #21
  - skill: #50, #14
  - sales: #49 (dormant seat, owner-activated this morning's window per
    ADR-005 — her call to make, noted not flagged)
  - okr: #54
  - finance: #55
  - exo: #46, #42, #30 (not a PM-dispatchable seat, HQ/company lane)
  - chair (HQ): #44, #40 (HQ machinery, see below)
- **#34 `pm/sprint-2026-09-28` unmerged** means `main`'s current sprint
  file is still `sprint-2026-09-21`, now nine days stale — this
  Wednesday standup still has no committed current-week sprint to check
  backlog items against. This compounds the merge-queue finding above
  rather than being separate from it.
- **#44 `chair/pm-merges`**, vendoring HQ decision 041 ("PMs own merges
  and failed-run triage," HQ PR #60), still open and unmerged. Body:
  Tier B becomes a PM merge under six written conditions, and every
  standup triages the last 24h of failed runs. **Until this merges,
  this run keeps the chartered boundary — no self-merge of any PR, Tier
  A or B** — the direct run instructions for this session say "never
  merge your own PR," which is the still-binding text since #44 hasn't
  landed.
- #40 `chair/langfuse-traces` — the branch whose push broke four seat
  workflows on 2026-09-30 02:16Z (pm-agent, okr-agent, market-agent,
  finance-agent, all 0 jobs / 0s / "workflow file issue"), already
  triaged in #45/#53. No new failures since: `gh run list --limit 60`
  shows nothing between the window closing at 04:03Z and this run
  starting at 16:42Z. HQ/chair-owned machinery; not this seat's file to
  fix.

## Waiting on an owner-only action

- Three `proposed` ledger entries still have no owner verdict, aging
  but none past the two-week grooming mark yet: repo split (2026-09-18,
  now 12 days), tuning packs / the omarchy lesson (2026-09-19, now 11
  days), the merge-commits/PR-reader finding (2026-09-20, now 10 days).
  Repo split crosses two weeks at the next standup (2026-10-02) if
  still proposed then.
- The `docs/decisions.md` ADR numbering collision (two entries each
  numbered ADR-005 and ADR-006) is carried again, unfixed since
  2026-09-25. Still outside this seat's writable surface.
- Standard-vendoring in flight: `docs/standards/pm.md` §15 (inbox
  first, claim before shared edits — chair note, HQ PR #59) has not
  yet synced into this repo's vendored copy, which still ends at §14.

## Board (docs/standards/pm.md §14)

Read this run, before `gh pr list`, per the rule. Three HQ handoffs
landed on the board overnight (`chair:hq-langfuse`, 02:47-03:52Z),
addressed to `pm @ Ursa`:

1. **"Rewrite sprint items so the owner reads plain language without
   codes."** Acted on this run: all eight items on the board's current
   sprint got a code-free, first-person comment (`POST
   /api/items/<id>/comments`) explaining what and why. The stored
   title/body still carry PR numbers and file paths, because the board
   has no item-update endpoint (`PATCH /api/items/<id>` returns `501
   Unsupported method`) — only create, move, and comment exist. **Gap
   worth raising to HQ/exo:** the instruction asks for an edit the API
   cannot perform; a comment is the closest compliant substitute, not
   the thing itself.
2. **"Name your current sprint by what it ships" / "name and define
   your sprints creatively."** Not actioned this run — sprint naming
   and definition is ceremony work (charter §3), and today is a
   standup. Queued for the next Monday ceremony, 2026-10-05, alongside
   whatever sprint #34 eventually lands as `sprint-2026-09-28`'s
   successor.
3. **"Learn the owner preferences from the board page and her
   rulings on it"** — a product-shaped handoff (building a preference
   model from board interactions), not a PM-lane task; this seat never
   writes product code. Noted here so it has a card and an owner,
   rather than dropping.

Ursa's board sprint object is still named `sprint-2026-09-21` even
though items on it reference `sprint-2026-09-28` in their bodies — the
board's sprint record is as stale as the repo's `docs/sprints/`
directory, for the same underlying reason (#34 never merged).

## Milestones

"Sprint 2026-09-28" is open, due 2026-10-04, 0 issues attached (the
milestone isn't carrying tracked issues; the sprint file and board are
where the actual items live). Four days out, past the three-day
dispatch window at the next standup if #34 still hasn't merged by
then.
