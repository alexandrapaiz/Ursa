# Pending — what the org owes, and what waits on the owner

Maintained every PM run (docs/standards/pm.md §5). Each line dated.
Reconciled 2026-09-30, ~03:15Z sync-mode standup (owner present),
against `gh pr list --state all --limit 60`, `gh run list --limit 30`,
the Ursa board (`GET /api/board/Ursa`), and its messages
(`GET /api/messages?to_seat=pm&to_company=Ursa`).

## Awaiting the owner's merge

- **The merge queue itself is now the finding.** 27 PRs open, 15 merged
  in the repo's whole life, and the last merge of anything other than a
  PM standup or a lessons sync was **#9, 2026-09-24** — six days with
  zero engineer, frontend, research, security, or market work landing.
  Oldest open PR is #13 (`engineer/2026-09-24-trace-stage-loops`,
  opened 2026-09-24 15:53Z, now 5.5 days — still short of the
  seven-day flag, but the next standup will cross it). Full list of 27
  by seat:
  - engineer: #43, #38, #36, #33, #32, #27, #25, #24, #22, #18, #16, #13
    (12 PRs — the four-engineer-PRs-touch-the-same-source-tree problem
    flagged 2026-09-26 has only grown)
  - pm (this seat, prior runs): #37 (standup 2026-09-29), #34 (**last
    Monday's ceremony — sprint-2026-09-28 itself is stuck unmerged**),
    #29, #20
  - research: #39, #19
  - frontend: #35, #15
  - security: #28
  - market: #21
  - skill: #14
  - exo: #42, #30 (not a PM-dispatchable seat, HQ/company lane)
  - chair (HQ): #44, #40 (HQ machinery, see below)
- **#34 `pm/sprint-2026-09-28` unmerged** means `main`'s current sprint
  file is still `sprint-2026-09-21` — this Wednesday standup has no
  committed current-week sprint to check backlog items against. This
  compounds the merge-queue finding above rather than being separate
  from it.
- **#44 `chair/pm-merges`**, vendoring HQ decision 041 ("PMs own merges
  and failed-run triage," HQ PR #60), open and unmerged. Body: Tier B
  becomes a PM merge under six written conditions, and every standup
  triages the last 24h of failed runs. **Until this merges, this run
  keeps the chartered boundary — no self-merge of any PR, Tier A or
  B** — the direct run instructions for this session say "never merge
  your own PR," which is the still-binding text since #44 hasn't
  landed. Noting this explicitly so the deviation is visible rather
  than silently underused once #44 does merge.
- #40 `chair/langfuse-traces` — the branch whose push broke four seat
  workflows this run (pm-agent, okr-agent, market-agent, finance-agent,
  all 0 jobs / 0s / "workflow file issue"). See the PR's Failures
  section. HQ/chair-owned machinery; not this seat's file to fix.

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

Read this run, before `gh pr list`, per the rule. Ursa's board sprint
object is still named `sprint-2026-09-21` even though items on it
reference `sprint-2026-09-28` in their bodies — the board's sprint
record is as stale as the repo's `docs/sprints/` directory, for the
same underlying reason (#34 never merged). One note posted back
this run (`POST /api/messages`, kind `note`, seat `pm`, company
`Ursa`) summarizing this standup for the owner.

## Milestones

"Sprint 2026-09-28" is open, due 2026-10-04, 0 issues attached (the
milestone isn't carrying tracked issues; the sprint file and board are
where the actual items live). Four days out, past the three-day
dispatch window at the next standup if #34 still hasn't merged by
then.
