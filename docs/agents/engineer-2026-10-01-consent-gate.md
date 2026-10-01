# Engineer run — 2026-10-01: the consent gate

Working note. The draft PR was opened before the work, per the ship-first
rule (`prompts/engineer-agent.md`).

## Observe

**Sprint.** `docs/sprints/sprint-2026-09-21.md` is still the newest sprint
file. It assigns items 1, 2 and 3 to this seat. All three are built and
unmerged: item 1 in #13, item 2 in #16, item 3 in #18.

**PR queue.** `gh pr list --state open` returns 30 PRs, 15 of them from this
seat (#13, #16, #18, #22, #24, #25, #27, #32, #33, #36, #38, #43, #56, #57,
and this one). `gh pr list --state merged` shows that **no engineer PR has
ever merged**; all 15 merges to date are `pm`, `exo`, `chair` and lessons
syncs. Nineteen open PRs append to `docs/ideas.md`.

**Pipeline health.** No Modal in this product, so that charter step does not
apply. Instead: `npm test` on `main` at `8c453f0` passes, 36 tests in 5
files, and `npx tsc --noEmit` is clean. PR #56 reports `main` as red in any
environment exporting `GIT_AUTHOR_NAME`; not reproduced here and not
re-investigated, because it already has a branch and L-E10 forbids a second
implementation of work a branch holds.

**What L-E10 made the day.** The rule forbids writing a fourth
implementation of something an open branch already holds, and permits
extending a branch, proposing it be closed, or landing the stack. #43 already
spent a day on landing the stack, #56 on the break-fix, #57 on the time
dimension. So this run surveyed for work with no branch behind it:

```
gh pr list --state all --limit 100 --search "<term> in:title"
grep -rn "consent|revoke|redact|erase|forget|opt-in" ursa-major/src ursa-major/overlay
```

over `consent`, `revoke`, `delete`, `forget`, `erase`, `export`,
`goal shift`, `abandon`. The only hit anywhere is `status: 'revoked'` on a
derived axiom in `ursa-major/src/tuning/`. No branch and no commit revokes or
erases an **outcome record**, and nothing gates what may leave the device.

## Orient

That gap is `CLAUDE.md`'s load-bearing constraints 2 and 3, which the file
tells any reader not to design around, and `docs/design/product-plan.md` §12
already specifies the boundary down to the SQL. It is also not a sprint item,
which is the deviation reported in the PR.

One finding sharpened it. `docs/design/product-plan.md` §2 row 9 names
`revokeAxiom(tuningPath: string, unitId: string): TuningRecord` as component
9 of the system. It did not exist. The schema had the tombstone field and
nothing but a text editor could write it.

## Decide

Day-sized slice: consent state, erasure that reaches the derived inference,
and the disclosure boundary with an audit that re-derives its own guarantee.
Zone B (`POST /api/minor/ingest`, the `survival_stats` table) is explicitly
out and listed in §10 of the design doc.

## Act — what shipped

| File | Status | What |
|---|---|---|
| `ursa-major/src/consent.ts` | new | fail-closed consent state, auditable transition history, `forget()` |
| `ursa-major/src/tuning/revoke.ts` | new | `revokeAxiom` at the plan's signature, and the pure erasure pass |
| `ursa-major/src/disclosure.ts` | new | the projection, the closed model vocabulary, the k-anonymity floor, `auditBatch` |
| `ursa-major/src/consent.cli.ts` | new | `ursa consent …` and `ursa forget …` |
| `ursa-major/src/bin/ursa.ts` | edited | dispatch, and `ursa run` honours erasure tombstones |
| `ursa-major/src/consent.test.ts` | new | 27 tests |
| `ursa-major/src/disclosure.test.ts` | new | 52 tests |
| `ursa-major/src/consent.e2e.test.ts` | new | 12 tests, real `git init` repositories |
| `docs/design/consent-and-erasure.md` | new | the design artifact, six elements |
| `docs/ideas.md` | appended | three entries and the craft scan |

`npm test`: **127 passed**, up from 36. `npx tsc --noEmit`: clean.

## Three defects this run found, two of them in its own work

1. **A regex cannot gate a free-form field.** The first version constrained
   the `model` column with `/^[A-Za-z0-9][A-Za-z0-9._+ -]{0,63}$/`. A test
   written an hour later put a 62-character English sentence through it and
   it passed. Replaced with an enum; the regression is pinned.
2. **`parseArgs` ran before the dispatch.** `main()` configures `parseArgs`
   with `run`'s and `bridge`'s options and it throws on an unknown one, so
   `--out` died before any dispatch placed after it. Every consent command
   was broken through the real binary while 89 tests passed, because they all
   called `runConsentCommand` directly. Found by typing the command in §5 of
   the design doc rather than by testing. Fixed, and covered by a test that
   goes through `main()`.
3. **The plan's `survival_stats` table cannot be aggregated exactly, and it
   collapses the correction.** Found by implementing it. Filed in the ledger
   rather than patched around, because the schema is the owner's and the plan
   is the record of it.

## Conflicts, measured

`git merge-tree --write-tree` against each engineer branch, after moving one
import to kill one of them:

| Against | Result |
|---|---|
| `origin/main` | clean |
| #16 `engineer/2026-09-25-artifact-kind` | clean, after the import move |
| #13 `engineer/2026-09-24-trace-stage-loops` | clean |
| #27 `engineer/2026-09-27-ledger-union-merge` | clean |
| #57 `engineer/2026-09-30-span-lifespan` | `docs/ideas.md` only, tail append both sides |
| #56 `ursa-engineer/2026-09-30-window` | `ursa-major/src/bin/ursa.ts`, one hunk, resolution written out in the PR |

## Boundaries

No `docs/sprints/`, no `skills/`, no `digests/`, no charter, no secret, no
`.env`. No ledger status the owner owns was changed; three entries were added
at `proposed`. No new paid service. `README.md` was deliberately left alone:
#16 and #57 both edit it, and a status line is not worth a third conflict in
a queue where nothing from this seat has merged yet.
