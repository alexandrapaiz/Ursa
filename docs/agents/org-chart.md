# Org Chart — Ursa

**Refreshed 2026-09-30** by the ExO window run (previous refresh
2026-09-27, in the same PR, which had not merged), against `gh run list
--workflow=agent-<seat>.yml --json event,createdAt,conclusion` for
every seat, `gh pr list --state all`, the charter headers in
`prompts/`, and the cron lines in `.github/workflows/`.

Every seat but sales is active, by the owner's ruling of 2026-09-24
(the seat-activation ADR, currently numbered ADR-005 at line 84 of
docs/decisions.md; that number is ambiguous because a second ADR-005
sits at line 100, see PWC-8). Sales stays dormant because Ursa is
private R&D and never for sale (ADR-001). This supersedes the
wave-1/wave-2 split below as the operative status.

**Read the "last run" column against docs/agents/runner-facts.md §2.**
Every scheduled run in this repository's history has started between
two and six hours after its cron. A seat that has not fired by its
nominal time is on time. A seat that produced no run at all in a cron
window is the thing to escalate.

| Seat | Charter | Status | Cadence (UTC) | Runs to 2026-09-27 | Last scheduled run |
|---|---|---|---|---|---|
| pm | prompts/pm-agent.md | active | Mon 12:00 ceremony, other six days 11:05 standup | 5 scheduled, all success, plus 2 dispatches | 09-27 15:32 |
| engineer | prompts/engineer-agent.md | active | daily 11:26 and 23:26 | 7 scheduled, all success | 09-27 15:42 |
| exo | prompts/exo-agent.md | active | Sun 18:00 | 2 scheduled, both success | 09-27 20:34 (this run) |
| security | prompts/security-agent.md | active | Sun 15:15 | 1 scheduled, success (first run) | 09-27 18:58 |
| research | prompts/research-agent.md | active | Tue and Fri 13:15 | 1 scheduled, success (first run) | 09-25 17:55 |
| skill | prompts/skill-agent.md | active | Thu 13:55 | 1 scheduled, success (first run) | 09-24 18:01 |
| frontend | prompts/frontend-agent.md | active | Mon and Thu 14:15 | 1 scheduled, success (first run) | 09-24 18:24 |
| market | prompts/market-agent.md | active | Wed 13:35 | 1 dispatch, success; 0 scheduled | none yet, first is 09-30 |
| okr | prompts/okr-agent.md | active | monthly, 1st, 13:00 | 1 dispatch success, 3 dispatch failures (Incident 1, closed) | none yet, first is 10-01 |
| finance | prompts/finance-agent.md | active | monthly, 1st, 11:30 | 0 | none yet, first is 10-01 |
| sales | prompts/sales-agent.md | dormant on paper, ran on 2026-09-30 | none, no cron | 1 (PR #49, owner-dispatched window) | see the note below |

Ten seats have now run at least once and every run in the repository's
history has concluded `success` except the four okr-agent failures of
2026-09-18 and 2026-09-19, all of which belong to the closed Incident 1
window. There is no failing workflow to report this week. What the org
has instead is a merge backlog, recorded below.

## The merge queue, 2026-09-27

| Measure | Value |
|---|---|
| Open PRs | 17 (16 excluding this run's own) |
| Merged in the last seven days | 10 |
| Merged in the last three days | 1 (PR #17, 2026-09-25) |
| Age of the oldest open PR | 3 days (#13, opened 2026-09-24) |

Every seat's output funnels through one owner's merge, and this week
the org produced faster than that gate absorbed. No PR has reached the
seven-day mark, so the old stale-PR rule never fired while the queue
grew to seventeen. Two costs are already visible rather than predicted.
The PM standard's hard stop forbids dispatching a seat that has an open
PR, so sprint item 3 went undispatched for that reason alone. And five
of the open PRs collided with each other on `docs/ideas.md`, which is
Incident 6. The ExO charter §5b now measures depth each run and reports
it to the owner. Only the owner can change it.

## Initiative coverage

- **O1** (outcome-record fidelity): engineer, sprint-2026-09-21 items
  1-3. No run yet — see docs/sprints/pending.md.
- **O2** (landscape / provenance de-risking): market, sprint item 4
  (`docs/market/landscape.md`, due via KR2.3 2026-10-31). No run yet.
- **Governance spine** (this cycle, OKR/sprint/ExO): okr done
  (2026-q4.md merged), sprint and ExO audit both stuck in open PRs
  (#9, #7) — see pending.md for what's blocking each.
- **research, frontend, security, skill, finance**: no sprint item
  currently names any of them. Each will smoke-test itself on its
  first scheduled run per ADR-005's own note ("each newly active
  seat's first run is a smoke run by definition"); flagging here per
  §1b since an active seat with no initiative is exactly what this
  section exists to surface.

## Board of record

**This repository is the board.** Linear was abandoned on 2026-09-25
after a one-day trial, in the same owner ruling that moved secrets to
Infisical (the second ADR-006, line 123 of docs/decisions.md). GitHub
Projects had already been superseded before that. So the queue lives in
`docs/sprints/sprint-*.md`, `docs/sprints/pending.md`,
`docs/sprints/dispatch-queue.md`, the `seat:*` and `horizon:*` labels,
and one milestone per sprint, all of which the PM maintains under
docs/standards/pm.md §2b.

`PROJECTS_TOKEN` is still handed to all eleven workflows and read by
none; the security seat queued its removal as PWC-6. No seat should
reconcile an external board, and no seat should wait on `LINEAR_API_KEY`.

The chair (interactive session) continues to cover any dormant seat's
functions; today, only sales is dormant on paper.

## The sales seat ran while marked dormant (flagged 2026-09-30, ExO)

Not a violation, and not resolvable by this seat. On 2026-09-30 the
owner's window dispatched every seat including sales, which opened PR
#49. Charters permit owner-dispatched runs before activation, so the run
itself is legitimate, and activation stays owner-only
(docs/standards/pm.md §11.4, "what stays the owner's, always").

What is now inconsistent is the record rather than the behaviour.
`prompts/sales-agent.md` still carries a DORMANT header and is still
written for alexandria's paid newsletter, which PR #49 says in its own
description. ADR-005's stated reasoning was that "a sales seat has
nothing to sell," and an owner dispatch of that seat is evidence against
that reasoning rather than an exception to it.

Two things the owner may want, neither of them this seat's to decide:
an ADR recording whether sales is active and what it sells, and a
cadence or an explicit "dispatch-only" in the table above. Until one of
those exists, this row will keep reading as false to every memoryless
run that reads it, which is the same defect class as Ursa incident 5.

## Historical: governance-cycle tracker (added 2026-09-20 by the ExO Sunday run)

The gate above was stated with no way to tell where the cycle stood, so
nobody could answer "may wave 2 begin?" from the repo. KR3.3 of
docs/okrs/2026-q4.md depends on that answer and wants the engineer
seat's first activated run merged by November 15. The three conditions,
with the evidence that settles each:

| Condition | Status | Evidence |
|---|---|---|
| An OKR file merged by the owner | **met** | `docs/okrs/2026-q4.md` is on main via commit 52ce5d5, "All-Hands 002: full roster convened, Q4 OKR draft filed", 2026-09-18. PR #2 carried it and was closed rather than merged, because its branch was destroyed in the incident-2 history rewrite. The owner landed the commit on main directly. The artifact is what the gate asks for, so this counts. |
| A sprint merged by the owner | **met** (recorded 2026-09-27) | PR #9, `pm/sprint-2026-09-21`, merged 2026-09-24. It carried `docs/sprints/sprint-2026-09-21.md`, the first sprint file. |
| An ExO audit merged by the owner | **met** (recorded 2026-09-27) | PR #7, `exo/2026-09-20`, merged 2026-09-24. That was the first full ExO cycle, and this run records it because the tracker's own rule forbids a run marking its own condition. |

**Superseded 2026-09-24**, then satisfied anyway. The owner activated
every seat by override before the gate closed, which was her
prerogative and is kept here for the record. As of 2026-09-27 all three
conditions are met on their own terms: the OKR file, PR #9, and PR #7.
The gate is therefore open and moot at the same time, and this table's
remaining job is the rules below it, which apply to any future gate.

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
