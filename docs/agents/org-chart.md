# Org Chart — Ursa

**Refreshed 2026-09-28** (PM ceremony run) against `gh run list`, `gh
pr list --state all`, the seat charter headers in `prompts/`, and the
cron lines in `.github/workflows/`. A fuller pass (renaming bare ADR
codes on this page to descriptions, per the owner's 2026-09-27
directive) is drafted in PR #29, still open; this update only refreshes
the counts and initiatives below and does not duplicate that rename.

Every seat but sales is active, decided by the owner 2026-09-24: sales
stays dormant because Ursa is private R&D and never for sale. See
docs/decisions.md for the full record of that decision and the two
board-of-record calls that followed it (Linear tried, then abandoned
for the repo itself, both 2026-09-25).

| Seat | Charter | Status | Cadence | Runs so far |
|---|---|---|---|---|
| pm | prompts/pm-agent.md | active | daily: Mon ceremony, other 6 days standup | 8 scheduled runs, this one included |
| okr | prompts/okr-agent.md | active | monthly, 1st | 5 total (1 success, 3 early failures closed as an incident, 1 more since) |
| exo | prompts/exo-agent.md | active | weekly, Sunday | 2 (PR #7 merged as lessons-only; PR #30 open) |
| engineer | prompts/engineer-agent.md | active (2026-09-24) | twice daily, 11:26 + 23:26 UTC | 9 runs, 9 open PRs (#13, #16, #18, #22, #24, #25, #27, #32, #33) |
| research | prompts/research-agent.md | active (2026-09-24) | Tue + Fri, 13:15 UTC | 1 (PR #19, open) |
| frontend | prompts/frontend-agent.md | active (2026-09-24) | Mon + Thu, 14:15 UTC | 1 (PR #15, open) |
| market | prompts/market-agent.md | active (2026-09-24) | Wed, 13:35 UTC | 1 (PR #21, open, sprint item 4) |
| security | prompts/security-agent.md | active (2026-09-24) | Sun, 15:15 UTC | 1 (PR #28, open, first full audit) |
| skill | prompts/skill-agent.md | active (2026-09-24) | Thu, 13:55 UTC | 1 (PR #14, open) |
| finance | prompts/finance-agent.md | active (2026-09-24) | monthly, 1st, 11:30 UTC | 0 — first fire 2026-10-01 |
| sales | prompts/sales-agent.md | dormant | none — Ursa is private R&D | 0 |

**16 PRs are open across the roster right now, all green, none
reviewed.** This is the dominant operational fact of the week; see
sprint-2026-09-21.md's retrospective and pending.md for the detail and
the single highest-leverage one to merge first (#27).

## Initiative coverage

- **O1** (outcome-record fidelity): engineer, sprint-2026-09-21 items
  1-3 all shipped as PRs (#13, #16, #18), all unmerged. Sprint-2026-09-28
  item 2 continues the agentic-forward sub-thread (#22) with the last
  documented step, embedding retrieval.
- **O2** (landscape / provenance de-risking): market's item 4 shipped
  (#21, unmerged). Sprint-2026-09-28 item 1 (security: the redaction
  standard) gates KR2.2, the next O2 KR still fully open.
- **Governance spine**: complete in substance (okr, pm, and exo have
  each run and shipped), though the ExO audit itself (#30) is still an
  open PR, same backlog as everything else.
- **finance**: no initiative yet; first run is 2026-10-01, nothing owed
  before then.
- **research, frontend, skill**: each smoke-tested on its first run
  this week (#19, #15, #14) with no sprint item naming a next step yet;
  not a gap by itself, since none has a second occurrence due before
  the next ceremony.

## Board of record

The repo itself: the sprint file is the backlog, `docs/sprints/pending.md`
is the owner's queue, `docs/sprints/dispatch-queue.md` is the dispatch
plan, and GitHub labels (`seat:<name>`, `horizon:now|next|later`,
`blocked`, `owner-action`) plus one milestone per sprint are the board
view (docs/decisions.md, the board-of-record decision of 2026-09-25;
charter §1f). Linear was trialed for one day and abandoned; do not
resurrect it without a new decision recorded there.

The chair (interactive session) continues to cover any dormant seat's
functions; today, only sales is dormant.

## Historical: governance-cycle tracker (added 2026-09-20 by the ExO Sunday run)

The gate above was stated with no way to tell where the cycle stood, so
nobody could answer "may wave 2 begin?" from the repo. KR3.3 of
docs/okrs/2026-q4.md depends on that answer and wants the engineer
seat's first activated run merged by November 15. The three conditions,
with the evidence that settles each:

| Condition | Status | Evidence |
|---|---|---|
| An OKR file merged by the owner | **met** | `docs/okrs/2026-q4.md` is on main via commit 52ce5d5, "All-Hands 002: full roster convened, Q4 OKR draft filed", 2026-09-18. PR #2 carried it and was closed rather than merged, because its branch was destroyed in the incident-2 history rewrite. The owner landed the commit on main directly. The artifact is what the gate asks for, so this counts. |
| A sprint merged by the owner | **not met** | `docs/sprints/` holds only README.md. The PM seat has never run. Its first scheduled run is Monday 2026-09-21 at 12:00 UTC, and it has missed no cadence, having been activated on Friday 2026-09-18. |
| An ExO audit merged by the owner | **not met** | No ExO audit has merged. PR #5, the only merged branch under `exo/`, changed one file, `docs/standards/lessons.md`, and was a company lessons sync rather than a cycle. The first real audit is the PR carrying this tracker. |

**Superseded 2026-09-24:** ADR-005 activated the seats by owner override; kept for the record. Original conclusion: wave 2 does not begin yet. Two conditions are outstanding
and both have a known path: the PM seat's Monday run, and the owner's
merge of this PR. If both land, the cycle completes and the engineer
seat may be activated by an ADR.

Rules for maintaining this table, so it does not rot:

- The ExO seat updates it every run, in the same PR as the audit.
  A condition moves to **met** only with a commit SHA or a merged PR
  number written into the evidence cell. A seat's own claim that it
  finished something is not evidence.
- The seat that opens a PR does not mark its own condition met. The
  next run marks it, after seeing the merge.
- Activation itself stays owner-only. This table reports whether the
  gate is open. It never opens it.

**A note the next run should not skip.** The engineer seat has already
shipped real work while dormant, `docs/design/product-plan.md`, under
owner dispatch. That is allowed by its charter, which permits
owner-dispatched runs before activation, so it is not a deviation. It
does mean the dormant/active distinction currently describes the
schedule and not the output, and a reader could reasonably be misled by
the table above. Worth an ADR if it keeps happening.
