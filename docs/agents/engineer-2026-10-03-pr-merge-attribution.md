# Engineer run log — 2026-10-03, second dispatch

**Branch** `engineer/2026-10-03-pr-merge-attribution`, stacked on
`engineer/2026-10-03-land-the-engineer-stack` (PR #69, opened by this
seat's first dispatch today at 02:13 UTC). **Pull request** #71.

**The artifact** is `docs/design/pr-path-merge-attribution.md`, written
to the six-element engineering-artifact standard. This file is the run
log: what was decided, what was tried, and what went wrong on the way.

## Why this work and not a sprint item

Sprint `2026-09-21` assigns items 1, 2 and 3 to this seat. All three are
built and none has landed; PR #69, four hours before this run, merged all
seventeen of this seat's open branches into one union and reported the
whole situation. Starting a fourth implementation of anything would be
the move L-E10 names as never correct.

The survey, run at the start of this session rather than assumed:
`gh pr list --state open` returns 51 pull requests. Seventeen are this
seat's and all seventeen are inside #69. #69 is `MERGEABLE`, not a draft,
and 120 files. So the queue is not the constraint this run can move, and
the useful work is the one defect #69 identified and deliberately did
not fix inside a landing PR:

> **Not fixed today, and filed instead:** the pull-request adapter passes
> `interveningMerges: []`, which type-checks and means "nothing known,"
> but reads downstream as "no merge destroyed anything" and so reproduces
> on the PR capture path exactly the false label #66 removed from the git
> path.

That is L-E10's first move — extend the existing branch — applied to the
thing the branch itself flagged. It is also the ledger entry "Merge
attribution stops at the git walker" (`docs/ideas.md`, 2026-10-03),
whose stated first step is the failing test this run wrote. That entry's
status is `proposed` and this seat does not move it; the owner does.

## What the run got wrong on the way

**Renamed a helper the whole file used.** The new tests needed a local
`commit` helper to make git commits, and the file already had a
module-level `commit` building `PullRequestCommit` values. The first fix
renamed the module-level one to `commit_` in its declaration only,
breaking the twenty tests that called it. Caught by `tsc --noEmit` in
the same turn. The right fix was to rename the *new* local helper, to
`commitAt`, and leave twenty working call sites alone. Worth recording
because the instinct was backwards: the thing that moves is the thing
being added.

**Two string replacements asserted against text that was not there.**
Both edits to `src/adapters/cli.ts` were written from the file as
remembered rather than as read — one dropped two spaces from inside a
template literal. The script asserted a unique match and raised, before
writing anything, so nothing was corrupted and the only cost was a turn.
The assertion is the reason: a blind `replace` would have silently
written nothing and the next command would have reported success.

**Expected the real fixtures to show the bug and they do not.** The first
measurement after the fix ran the two recorded Ursa pull requests and
printed zero intervening merges for all eleven pairs. The temptation at
that point is to find a case that makes the change look good. What the
zeros actually say is structural and more useful: a seat branch in this
repository merges `origin/main` at the *end* of its run, so the merge is
almost always the pair's own closure rather than an event between the
pair. A third fixture was captured (`fixtures/pr/ursa-pr-13.json`, real
Ursa PR #13) specifically because its merge *is* positioned between a
pair's two commits, which exercises the position check and still
correctly reports nothing. Three real pull requests, three different
reasons for a correct zero, all three kept as tests. The artifact's §7
is that table.

## Evidence

| Check | Command | Result |
|---|---|---|
| typecheck | `cd ursa-major && npx tsc --noEmit` | 0 errors |
| suites | `cd ursa-major && npm test` | 20 files passed, 1 skipped; 316 passed, 4 skipped. Baseline on #69 was 309. |
| the scenario | `npx vitest run src/adapters/github-pr.test.ts -t 'a merge inside the pull request deletes a generation'` | 5 passed |
| the real fixtures | `npx vitest run src/adapters/github-pr.test.ts -t 'replay against Ursa pull requests that really merged'` | 5 passed |
| live capture | `npx tsx src/adapters/cli.ts pairs --pr 13 --repo alexandrapaiz/Ursa --project ..` | 6 commits, 1 pair, `merge-resolution 57a750abe -> 4f9a7b0b8` |
| ledger contract | `node tools/ledger/check.mjs docs/ideas.md` | 81 blocks, clean |
| ledger conflict markers | `grep -c '<<<<<<<' docs/ideas.md` | 0 |

The number that is the point: on the scenario in the test file, 42 of 44
deleted characters move from `humanDeletedChars` to `mergeDeletedChars`,
and the record's stated discard rate falls from 17.3% to 0.8%. The third
test in that block, `with the merge withheld, the same text is charged to
the human — the defect, pinned`, holds the pre-fix behaviour so a
regression is a failing test rather than a quiet relabel.

## Redaction

The artifact's real payload is an episode from a `mktemp -d` directory
created by the test run, with that repository's own shas. No home
directory, no machine username, no private session identifier. The new
fixture holds blob object ids and no file contents, and its pull request
is public; `grep -ciE '/Users/|/home/runner|runner@' fixtures/pr/ursa-pr-13.json`
returns 0.
