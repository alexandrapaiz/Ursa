# Org Chart — Ursa

**Refreshed 2026-09-24** (owner-present, ceremony-lite dispatch)
against `gh run list`, `gh pr list --state all`, the seat charter
headers in `prompts/`, and the cron lines in `.github/workflows/`.

Every seat but sales is ACTIVE as of ADR-005 (2026-09-24): sales stays
dormant because Ursa is private R&D and never for sale (ADR-001). This
supersedes the wave-1/wave-2 split below as the operative status; the
governance-cycle gate that wave 2 was meant to wait on (an OKR file, a
sprint, and an ExO audit, each merged) was **not fully met** when
ADR-005 fired — the sprint (PR #9) and the ExO audit (PR #7) are both
still open, unmerged, three and four days respectively as of this
update. That's the owner's prerogative to override, not a process
failure; it's recorded here so the gate's original text doesn't read
as still binding.

| Seat | Charter | Status | Cadence | Runs so far |
|---|---|---|---|---|
| pm | prompts/pm-agent.md | active | daily: Mon ceremony, other 6 days standup (ADR-033) | 2 scheduled + this dispatch |
| okr | prompts/okr-agent.md | active | monthly, 1st | 1 success, 3 earlier failures (Incident 1, closed) |
| exo | prompts/exo-agent.md | active | weekly, Sunday | 1 (PR #7, still open) |
| engineer | prompts/engineer-agent.md | active (2026-09-24) | twice daily, 11:26 + 23:26 UTC | 0 — first fire is today |
| research | prompts/research-agent.md | active (2026-09-24) | Tue + Fri, 13:15 UTC | 0 — first fire Fri 2026-09-25 |
| frontend | prompts/frontend-agent.md | active (2026-09-24) | Mon + Thu, 14:15 UTC | 0 — first fire today |
| market | prompts/market-agent.md | active (2026-09-24) | Wed, 13:35 UTC | 0 — first fire 2026-09-30 |
| security | prompts/security-agent.md | active (2026-09-24) | Sun, 15:15 UTC | 0 — first fire 2026-09-27 |
| skill | prompts/skill-agent.md | active (2026-09-24) | Thu, 13:55 UTC | 0 — first fire today |
| finance | prompts/finance-agent.md | active (2026-09-24) | monthly, 1st, 11:30 UTC | 0 — first fire 2026-10-01 |
| sales | prompts/sales-agent.md | dormant | none — Ursa is private R&D (ADR-001) | 0 |

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

Linear (workspace "Alexandra Personal", team URSA), per ADR-005's
second decision (2026-09-23, charter §1f) — supersedes GitHub
Projects as Ursa's board. `LINEAR_API_KEY` is unset in this run's
environment, so this update did not sync issues; see
docs/sprints/pending.md. GitHub labels (`seat:<name>`,
`horizon:now|next|later`, `blocked`, `owner-action`) and one milestone
per sprint are maintained regardless, per docs/standards/pm.md §2b,
since neither depends on Linear or `PROJECTS_TOKEN`.

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
