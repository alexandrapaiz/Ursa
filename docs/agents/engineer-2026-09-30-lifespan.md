# Engineer run 2026-09-30 (third dispatch) — the time dimension

Working note. The deliverable is
[`docs/design/span-lifespan.md`](../design/span-lifespan.md); this file
records how the run chose its work and what it deliberately left alone.

## Survey before building (L-E10)

Two engineer PRs were already open for today when this run started, so
the survey mattered more than usual. `gh pr list --state open` returned
30 PRs. Read for scope overlap:

| PR | Scope | Overlap with this run |
|---|---|---|
| #43 | `tools/stack/integrate.sh`, stack-integration docs | none in code; today's second engineer run, already holds "land the stack" |
| #56 | `pairfinder.ts`, `bin/ursa.ts`, `m0.test.ts` — ambient git identity break-fix | touches `bin/ursa.ts`; this run's edit there is 12 lines in a different function |
| #13 | `signals.ts`, `loops.ts`, `types.ts`, `viewer.ts` — correction loops | `types.ts` (additive, different region); `signals.ts` and `viewer.ts` deliberately untouched here |
| #16 | `resolve.ts`, `types.ts`, `viewer.ts`, `deploy.ts` — `artifact.kind` | `types.ts` only, additive |
| #18 | `viewer.ts`, `audit.ts`, fixtures | none |
| #22, #38 | `src/hq/` | none |
| #24, #32 | `src/bridge/`, overlay | none |
| #25 | `src/evals/`, `verdict.ts` | none |
| #33 | `src/adapters/`, `episodes.ts` | none |

`gh pr list --state closed` and a `--search` across all states for
survival, lifespan, durability and time returned no prior art. Nothing
open or closed implements the time dimension. Of L-E10's three
permitted moves, this run took none of them and built new work,
because the survey found no existing branch to extend or land — which
is the case L-E10 does not forbid.

## Why this, and not the sprint's next item

Sprint `2026-09-21`'s three engineer items all have open, unmerged PRs
(#13, #16, #18). Under §11.4 the seat should not build a fourth
implementation of any of them, and under L-E10 writing one anyway is
the named anti-pattern. The one element of the core data artifact
(`CLAUDE.md` §1) with no code behind it anywhere — no open PR, no
closed PR, nothing on `main` — was the time dimension. That is the
deviation and the reason, recorded here for the Monday retrospective.

## Deliberately not done

- `viewer.ts` is untouched. Three open PRs write to it; a fourth would
  make the owner's merge a four-way conflict for a presentation change.
- `signals.ts` is untouched. PR #13 rewrites it. The obvious follow-on
  — a `decayed` span contradicting `accepted_tacitly` — is in the
  ledger instead.
- The `pairfinder.ts` far-reach defect this run found is in the ledger
  at status `urgent`, not fixed here. Fixing it means changing which
  pairs exist, which changes every record the repo produces, and #56
  already has `pairfinder.ts` open. That is a day of its own.
