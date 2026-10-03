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

- `ledger-gate.yml` runs the 21 tests in `tools/ledger/` and
  `node tools/ledger/check.mjs docs/ideas.md` on every pull request.
- `tests.yml` runs `ursa-major`'s 36 vitest tests on every pull request
  touching `ursa-major/**`. Nothing ran them in CI before 2026-09-27.
