# Org Chart — Ursa

Wave 1 (okr, pm, exo) ACTIVE per ADR-002 (2026-09-18): charters
adapted, workflows scheduled. All other seats DORMANT (ADR-001):
installed, no schedules, owner-dispatch only, charters inherited from
alexandria and adapted at activation.

| Seat | Charter | Status | Cadence |
|---|---|---|---|
| okr | prompts/okr-agent.md | active | monthly, 1st |
| pm | prompts/pm-agent.md | active | weekly Mon |
| exo | prompts/exo-agent.md | active | weekly Sun |
| engineer | prompts/engineer-agent.md | dormant | daily at activation |
| research | prompts/research-agent.md | dormant | weekly at activation |
| market | prompts/market-agent.md | dormant | weekly Fri at activation |
| frontend | prompts/frontend-agent.md | dormant | weekly Wed at activation |
| security | prompts/security-agent.md | dormant | biweekly at activation |
| skill | prompts/skill-agent.md | dormant | weekly at activation |
| finance | prompts/finance-agent.md | dormant | monthly at activation |
| sales | prompts/sales-agent.md | dormant | near launch |

The chair (interactive session) covers the dormant seats' functions.
Wave 2 (builders, starting with engineer) activates after the
governance spine completes one full cycle: an OKR file, a sprint, and
an ExO audit, each merged by the owner.

## Governance-cycle tracker (added 2026-09-20 by the ExO Sunday run)

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

**Therefore wave 2 does not begin yet.** Two conditions are outstanding
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
