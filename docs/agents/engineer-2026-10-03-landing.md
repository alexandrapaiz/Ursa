# Engineer run 2026-10-03 — working note

Opened before the work, per the ship-first rule (prompts/engineer-agent.md,
"Ship first, then work"; L-E3).

Target for this run: the engineer seat's own unmerged inventory. Seventeen
engineer branches are open and **zero engineer pull requests have ever
merged** in this repository. L-E10 permits three moves against that shape
and forbids a fourth. This run takes the third move, land the stack, scoped
to this seat's own branches, and extends PR #43's
`tools/stack/integrate.sh` rather than writing a new harness.

The full engineering artifact is
[`docs/design/landing-the-engineer-stack.md`](../design/landing-the-engineer-stack.md),
written to the six-element standard. This note is the run's own log: the
order things were found in, including the two things found by being wrong.

## What the run did, in order

1. **Read the charter, sprint, lessons and ledger.** Sprint items 1, 2 and
   3 are this seat's, all three built and unmerged (#13, #16, #18). The
   constraint is the queue, not the backlog.
2. **Surveyed the pull requests before writing code** (L-E10). 51 open,
   17 of them this seat's, 15 merges ever and not one of them an engineer
   branch. Verified that all 17 engineer branches are inside this seat's
   writable surface, so landing them touches no charter, sprint file,
   workflow or vendored standard.
3. **Opened the draft PR (#69) in the first turns**, before any merging.
4. **Measured before acting.** Ran PR #43's harness read-only over the 17
   branches in driver-first order: 12 merged clean, 5 conflicted, the
   ledger merged to 49 entries with 0 conflict markers. That is what made
   the landing worth attempting rather than guessed at.
5. **Landed the 17 branches**, resolving five conflicts by hand. Every
   conflict and resolution is tabulated in the artifact, §7.
6. **Found four type errors that exist in no branch.** `npx tsc --noEmit`
   reported 4 errors while `npx vitest run` reported 309 passed. Fixed
   them, then made `npm test` typecheck and gave the harness a named
   typecheck step so this class cannot recur silently.
7. **Verified the union end to end**, including one real `ursa run` whose
   record carries fields contributed by four different branches at once.

## Two things found by being wrong

Both are written down because each cost time once and should cost nobody
time twice.

- **A short smoke document is not a broken resolver.** The first
  end-to-end run printed "1 work units found, 0 resolved into records,"
  which read like a defect in a hand-resolved file. It is `--min-chars`,
  which defaults to `200`. The smoke document was about 120 characters.
  Re-run at a realistic size, the same code resolved a full record.
- **A pipe hides an exit status.** `npm install --package-lock-only |
  tail -5 && echo "REGEN OK"` printed `REGEN OK` after npm had failed,
  because the pipeline's status is `tail`'s. The lockfile had silently
  kept `vitest` at 2.1.9 against a `^5.0.2` range. Caught on the next
  check, and the real resolution was to take the dependency-bump side's
  lock and regenerate on top of it rather than the reverse.

One suspicion was raised and then killed by checking: the `ursa run`
summary appeared to call the gross deletion rate a discard rate, which is
the exact label PR #66 exists to fix. Reading the merged function showed
#66 had already changed it to `humanDeleted / generated`, with
merge-destroyed characters given their own sentence, and the merge
resolution had preserved that. No defect, and no change made.

## Verification, every check this run ran

| Check | Command | Result |
|---|---|---|
| ledger contract | `node tools/ledger/check.mjs docs/ideas.md` | 78 blocks, clean, exit 0 |
| ledger conflict markers | `grep -c '<<<<<<<' docs/ideas.md` | 0 |
| typecheck | `cd ursa-major && npx tsc --noEmit` | 0 errors (4 before the fix commit) |
| test suites | `cd ursa-major && npm test` | 20 files passed, 1 skipped; 309 tests passed, 4 skipped |
| Minor build | `cd ursa-minor && npm run build` | compiled in 4.6s, 4 static pages |
| dependency floor | `node scripts/dep-floor.mjs` | holds; no critical anywhere, no high in any production tree |
| the product itself | `npx tsx src/bin/ursa.ts run /tmp/smoke --declare satisfied` | 1 record, 931 chars survived verbatim, durability walked |

`main` ships 25 tests. The union ships 309.

## What this run did not do

It did not merge anything, it did not touch the other 33 open pull
requests, and it did not close the 17 it landed. Those stay open and
reviewable, and this branch is deletable with no loss: the artifact's §6
rebuilds it from `origin/main` in one pass.
