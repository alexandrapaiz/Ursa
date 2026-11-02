# Capture adapters

Each adapter reads one kind of finished work and emits the shapes
`src/resolve.ts` already consumes (`CommitPair`, `Episode`). No adapter
introduces a new record schema.

| Adapter | Reads | Emits |
|---|---|---|
| `src/pairfinder.ts`, the git-diff adapter of milestone M0 | a local repository's `git log`: an agent commit followed by the next commit where a human edits the same file | `CommitPair[]` |
| `src/adapters/github-pr.ts`, the PR adapter of plan section 8 | one pull request: its branch commits, the merges inside it, its review comments, and the merge that ended it | `PullRequestPair[]` and `PullRequestEpisode[]` |

The PR adapter exists because the git-diff adapter is thin on
repositories that are themselves run by agents through pull requests.
Two measurements. The n=2 trial over alexandria read 374 commits and
found one real generated-then-edited pair. This repository's own history
yields zero, while the PR adapter reads 23 pairs out of the same 13
merged pull requests and finds a human writing the final text in 6 of
them. The corrections were never missing. They were inside the pull
requests.

## The launch over the PR adapter

`src/adapters/pr-launch.ts` is the launch: it turns one captured pull
request into records on disk. `src/adapters/pr-command.ts` is the command
layer over it, reached two ways, `ursa pr <projectPath> --pr N` and
`cli.ts run --pr N --project <path>`, with one function under both.

It exists as a named launch since 2026-11-02. Before that the same loop was
inline in `cli.ts run`, and because it was never on the surface a person
types, it asked none of the three questions `src/launch.ts` holds for every
launch: it rebuilt an episode the user had erased, it never checked a record
against the eighteen bounds, and it asked the `--min-chars` floor directly
instead of through `clearsSizeFloor`, so a refusal-only record was dropped
by a threshold aimed at something else. The drifts, the measurement on this
repository's own pull request #645, and the two things the launch
deliberately does not do are in `docs/design/pr-launch-parity.md`.

Design, closures, failure modes and the exact commands:
`docs/design/pr-adapter.md`.
