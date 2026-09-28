# Capture adapters

Each adapter reads one kind of finished work and emits the shapes
`src/resolve.ts` already consumes (`CommitPair`, `Episode`). No adapter
introduces a new record schema.

| Adapter | Reads | Emits |
|---|---|---|
| `src/pairfinder.ts` (the git-diff adapter, M0) | a local repo's `git log`: an agent commit followed by the next human edit of the same file | `CommitPair[]` |
| `src/adapters/github-pr.ts` (the PR adapter, plan §8) | one merged pull request: its branch commits, its review comments, its merge event | `CommitPair[]` plus `Episode[]` |

The PR adapter exists because the git-diff adapter is thin on repos that
are themselves run by agents through pull requests. Evidence, from the
n=2 trial over alexandria: 374 commits yielded one real
generated-then-edited pair on `main`. The corrections were not absent,
they were inside the pull requests.
