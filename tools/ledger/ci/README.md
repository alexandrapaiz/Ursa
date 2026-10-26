# Two workflows this run could not install itself

The engineer seat's GitHub App token has no `workflows` permission, so
`git push` is rejected outright for any commit that creates or updates a
file under `.github/workflows/`:

```
! [remote rejected] engineer/2026-09-27-ledger-union-merge -> engineer/2026-09-27-ledger-union-merge
  (refusing to allow a GitHub App to create or update workflow
  `.github/workflows/ledger-gate.yml` without `workflows` permission)
```

The two files here are therefore the proposal, in their final form, for
the owner to install with two commands:

```bash
cp tools/ledger/ci/ledger-gate.yml .github/workflows/ledger-gate.yml
cp tools/ledger/ci/tests.yml       .github/workflows/tests.yml
git rm -r tools/ledger/ci && git add .github/workflows && git commit
```

Delete this directory in the same commit. A second copy of a live
workflow is a file that drifts.

- `ledger-gate.yml` runs, on every pull request: the 99 tests its
  `node --test` step names, measured 2026-10-26 by running that step's
  exact file list; `node tools/ledger/check-attributes.mjs`;
  `node tools/ledger/check.mjs docs/ideas.md`; and
  `node tools/ledger/check-closures.mjs docs/ideas.md`. The last two
  treat exit 2 as a pass, because exit 2 is each checker's "clean as far
  as a seat can take it" and the remainder is a status only the owner
  moves. The count was 21 when this file was written on 2026-09-27 and
  was stale for a month, because the step named its test files one by one
  and two suites added since then (`block-kinds.test.mjs` 2026-10-24,
  `check-closures.test.mjs` 2026-10-26) were never added to the list.
  Both are in it now.
- `tests.yml` runs `ursa-major`'s vitest suite on every pull request
  touching `ursa-major/**`. Nothing ran them in CI before 2026-09-27.
  The suite is 993 tests as of 2026-10-26, of which 983 pass and 10 skip
  in a `--depth 1 --single-branch` checkout, which is the shape a GitHub
  Actions `actions/checkout@v4` produces by default; see the ledger entries
  "A green `npm test` means two different things depending on the shape of
  the checkout, and says nothing about which" (2026-10-26) and "The
  blind-spot measurement the 2026-10-26 hook entry asked for, taken in
  both shapes" (2026-10-26) for why the number is reported here rather
  than enforced: which of the three options to take is an open owner
  decision, not a seat's.
