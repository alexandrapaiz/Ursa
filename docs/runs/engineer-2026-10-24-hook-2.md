# Engineer run note — 2026-10-24 (hook, seventh run)

Trigger: `hook`. Payload reason: capacity returned, the provider limit that
refused the previous run has reset.

Status: finished. PR #396.

## What woke it

The run before this one (message, sixth run) was refused by a provider limit
mid-flight. It left PR #387 as a silent draft: one real commit following
renames in the durability walk, a stub run note, a placeholder description,
and no test covering the fix.

Under the amended ship-first rule in `prompts/engineer-agent.md`, a draft left
by a killed run is the next run's first obligation. This run inherited #387,
verified its claim, found two things wrong with it, and shipped it.

## What the inherited fix was right about

The defect is real and the diagnosis was exact. A path-limited `git log` still
returns the commit that renamed the path away, because git reports a
rename-away as a deletion of the old path. The walk read the blob at the old
path, got nothing, and `traceFile` reads nothing as a deletion. Every unit of
every span in a moved file died at the move, with the text sitting unmodified
at the tip under another name.

Independently reproduced here before anything was changed. On a three-commit
fixture with one `git mv`, the pre-fix module reports `decayRate` 1, meaning
every character the user kept was gone by the latest commit, about a file
whose text `git show HEAD:moved.md` prints in full.

## What was wrong with it, and is now fixed

1. **No test.** Nine added to `ursa-major/src/lifespan.test.ts`, on real git
   repositories. Seven fail against the pre-fix module, which is what makes
   them a guard. The inverting assertion is
   `expected 'decayed' to be 'durable'`.
2. **The shipped bundle was stale.** The commit changed `src/lifespan.ts` and
   did not rebuild `dist/ursa.cjs`, which is committed and is what
   `action.yml` runs. `bundle-canonical.test.ts` and `bundle-exec.test.ts`
   pass on `main` and failed on this branch until the rebuild. The fix would
   have been real in `src/` and absent from everything a customer runs.
3. **A dangling citation.** The module cited
   `docs/design/rename-reads-as-death.md` §1, and the file did not exist. Now
   written, to the engineering-artifact standard.
4. **Cited numbers that did not match their own fixture.** The comment
   claimed `unitsTraced` 6 and `decayedChars` 488; the fixture it names
   measures 4 and 338. Corrected to the measured values.

## Not fixed, and recorded instead

- `Durability.renamesFollowed` sums span crossings, so one `git mv` reports
  `4`. Ledger entry today; a published-record field rename does not belong in
  the same PR as the bug fix that found it.
- Records emitted before today carry a `decayRate` from the broken walk and
  nothing distinguishes them. Ledger entry today, including the half that is
  the owner's call rather than this seat's.
- `src/corroborate.test.ts` times out at vitest's 5,000 ms default in this
  sandbox. Fails identically on `main`, verified in a clean worktree. Already
  in the ledger from an earlier run today, so not duplicated.

## Checks

- `npx tsc --noEmit` clean.
- `npx vitest run` — 829 passed, 4 skipped, 39 files passed, 1 skipped.
- `npm run bundle:check` and `npm run provenance:bundles:check` both current.
- `node tools/ledger/check.mjs` — 259 blocks, clean as far as a seat can take
  it; the one violation is pre-existing and owner-only.
