# Merge attribution on the pull-request path

**Engineer run, 2026-10-03 (second dispatch).** Branch
`engineer/2026-10-03-pr-merge-attribution`, stacked on
`engineer/2026-10-03-land-the-engineer-stack` (PR #69). Written to the
six-element engineering-artifact standard in `prompts/engineer-agent.md`.

## 1. The defect, stated exactly

`pairsFromPullRequest` in `ursa-major/src/adapters/github-pr.ts` built
every pair with the literal `interveningMerges: []` and a comment saying
the empty array meant "nothing known". Four code paths downstream read
that array, and none of them can tell "nothing known" from "nothing
happened":

`ursa-major/src/bin/ursa.ts:91` builds the attributor with
`gitDeletionAttributor(projectPath, ep.interveningMerges ?? [])`.
`ursa-major/src/deletion.ts:50` returns `() => HUMAN` immediately when
that array is empty. `ursa-major/src/resolve.ts:211` stamps the result
onto every deleted span as `deletion`. `ursa-major/src/stats.ts:102`
sums those spans into `humanDeletedChars`, which
`ursa-major/src/types.ts:233` documents as "the only deletion rate safe
to call a discard rate".

So a span of generated text that a merge overwrote arrived in the
outcome record as `generated_deleted` with `cause: 'human_edit'`, which
in the artifact's own vocabulary (CLAUDE.md §1) is the claim that a
person read the text and threw it away. The record also named the wrong
person: the pair's `finalAuthor` is whoever made the next commit, not
whoever resolved the merge. `ursa-major/src/deletion.test.ts` removed
exactly this false label from the git-walk path. The pull-request path
kept producing it.

**Why this matters more than its size.** `generated_deleted` is one of
the four span classes Ursa Minor sells, and the pull-request path is the
one that works on a repository run by agents: the n=2 trial over
alexandria found one real `(generated, edited)` pair in 374 commits,
because on such a repository the corrections live inside pull requests
rather than on the default branch. The adapter that was built to recover
that signal was mislabelling it.

**The commit shape that triggers it, by name.** A seat branch takes
`origin/main` while its pull request is open, and the merge resolves a
file the agent generated. `tools/ledger/requeue.sh --push` does precisely
this, to `docs/ideas.md`, across every open pull request GitHub reports
as `CONFLICTING` — seven of them as of today, named in PR #69's
merge-order note. Every ledger entry that merge drops would have been
charged to the owner as a discard.

## 2. System diagram, node by node and edge by edge

Thirteen nodes. Every one is a file or a process that exists in this
repository today. Every edge carries a named type, file format, or
command, not a verb.

| # | Node | What it is |
|---|---|---|
| N1 | `gh` 2.101.0, the GitHub CLI binary | external process the capture shells out to |
| N2 | `capturePullRequest` in `ursa-major/src/adapters/gh.ts` | turns API JSON into one snapshot value |
| N3 | `PullRequestSnapshot`, declared in `ursa-major/src/adapters/github-pr.ts` | the pull request as data: commits, review comments, outcome |
| N4 | `gitRepoReader` in `ursa-major/src/adapters/git-reader.ts` | a `RepoReader` over a local clone, memoized per `(sha, path)` |
| N5 | `interveningMergesFor` in `ursa-major/src/adapters/github-pr.ts` | **new in this change**: the merge walk over the snapshot's commit list |
| N6 | `pairsFromPullRequest` in `ursa-major/src/adapters/github-pr.ts` | pairs a generation with its closure |
| N7 | `episodesFromPullRequest` in `ursa-major/src/adapters/github-pr.ts` | one work unit per pair |
| N8 | `saveEpisodes` in `ursa-major/src/store.ts` | writes the episode list to disk |
| N9 | `resolveEpisode` in `ursa-major/src/bin/ursa.ts` | reads both blobs and builds the attributor |
| N10 | `gitDeletionAttributor` in `ursa-major/src/deletion.ts` | decides `human_edit` or `merge` for one deleted span |
| N11 | `blobAt` in `ursa-major/src/pairfinder.ts` | `git show <sha>:<path>`, returns null when absent |
| N12 | `computeStats` in `ursa-major/src/stats.ts` | splits deleted chars into human and merge columns |
| N13 | `renderViewer` in `ursa-major/src/viewer.ts` | the browsable record, one self-contained HTML file |

Edges, each labelled with what crosses it:

- **N1 → N2** — `ApiCommit[]` JSON from
  `gh api repos/{owner}/{repo}/pulls/{number}/commits --paginate`, whose
  `parents: Array<{ sha: string }>` field this change starts keeping.
- **N2 → N3** — `PullRequestSnapshot`, in memory, or
  `fixtures/pr/ursa-pr-13.json` on disk when `--out` is given.
- **N3 → N5** — `PullRequestCommit[]`, specifically the three fields the
  walk reads: `parentCount: number`, `parents?: string[]`,
  `files: string[]`.
- **N4 → N5** — `string[]` of parent shas from
  `RepoReader.parents(sha)`, the fallback when the snapshot predates
  `parents` or carries none.
- **N5 → N6** — `{ merges: MergeEvent[]; unreadable: string[] }`.
  `MergeEvent` is `ursa-major/src/pairfinder.ts`'s own type, imported
  rather than redeclared, so the two adapters cannot drift.
- **N6 → N7** — `PullRequestPair[]`, where `interveningMerges` is now
  `walked.merges` and `pullRequest.unreadableMerges` is
  `walked.unreadable` when that array is non-empty.
- **N7 → N8** — `PullRequestEpisode[]`.
- **N8 → disk** — `.ursa/episodes.json`, JSON, two-space indent,
  trailing newline. Payload in §4.
- **N7 → N9** — one `PullRequestEpisode` per call.
- **N9 → N10** — `MergeEvent[]` plus `projectPath: string`.
- **N10 → N11** — `(projectPath, sha, path)`; back comes
  `string | null`, the blob's full text.
- **N10 → N9** — `DeletionAttribution`, which is
  `{ cause: 'human_edit' | 'merge', mergeSha?, mergeSubject? }`.
- **N9 → N12** — `GenerationRecord[]`, each span carrying its
  `deletion` field.
- **N12 → disk** — `OutcomeRecord.stats.generated`, written under
  `.ursa/records/<record id>.json` by `saveRecord`.
- **N12 → N13** — the same `stats.generated` object;
  `ursa-major/src/viewer.ts:238` already renders
  `mergeDeletedChars` as "chars destroyed by a merge, not by you", and
  before this change the pull-request path could never make that line
  appear.

## 3. Interfaces at every boundary, as real signatures

The walk, new and exported so a test can call it without building a
whole snapshot:

```ts
export function interveningMergesFor(
  commits: PullRequestCommit[],
  reader: RepoReader,
  genIndex: number,
  closureIndex: number,
  genFiles: string[],
): { merges: MergeEvent[]; unreadable: string[] }
```

The snapshot field it prefers over the clone:

```ts
export interface PullRequestCommit {
  sha: string
  authorName: string
  authorLogin?: string
  authoredAt: string
  subject: string
  trailers: string
  parentCount: number
  /** parent shas as the GitHub API reported them, first parent first */
  parents?: string[]
  files: string[]
  changedRanges?: Record<string, Array<[number, number]>>
}
```

The field that keeps an empty result honest:

```ts
export interface PullRequestProvenance {
  repo: string
  number: number
  closure: PullRequestClosure
  acceptance: { accepted: boolean | null; basis: string; at: string | null }
  statedCorrections: StatedCorrection[]
  regression?: { sha: string; subject: string; at: string }
  squashed: boolean
  /** merges between the generation and its closure whose parentage could not be read */
  unreadableMerges?: string[]
}
```

Unchanged, and the reason nothing downstream needed editing — the walk
emits the type `src/deletion.ts` already consumes:

```ts
export interface MergeEvent {
  sha: string
  parents: string[]
  paths: string[]
  author: string
  date: string
  subject: string
}

export interface DeletionAttributor {
  (filePath: string, spanText: string): DeletionAttribution
}

export function gitDeletionAttributor(
  projectPath: string,
  merges: MergeEvent[],
): DeletionAttributor
```

## 4. On-disk layout, with a real payload

```
<project root>/
  .ursa/
    episodes.json              one JSON array of Episode | PullRequestEpisode
    records/
      <record id>.json         one OutcomeRecord
  ursa-major/fixtures/pr/
    ursa-pr-7.json             real Ursa pull requests, recorded
    ursa-pr-12.json
    ursa-pr-13.json            added by this change
```

A fixture file is `{ snapshot: PullRequestSnapshot, repo: RecordedRepo }`
and holds blob **object ids** only, never file contents, so it carries no
source text and no private data.

Real `.ursa/episodes.json` element, produced by the scenario in
`src/adapters/github-pr.test.ts` and reproduced with the commands in §5.
The project root is the `mktemp -d` directory the test creates, printed
here as it was created; shas are that throwaway repository's own.

```json
{
  "id": "ursa-prmerge-eafsin-pr42-77b77f2",
  "projectPath": "/tmp/ursa-prmerge-EAfSiN",
  "status": "closed",
  "openedAt": "2026-09-28T11:00:00Z",
  "closedAt": "2026-09-28T14:00:00Z",
  "closureHeuristic": "github-pr",
  "touchedFiles": ["digest.js"],
  "interveningMerges": [
    {
      "sha": "de07eeb05ef7073a70a3daa1f1657dfb45c24a7b",
      "parents": [
        "77b77f21cc12d055a1bee0f35ac18a16216f7100",
        "52848f922b70ca45a8ab42c329443a44a1379c3a"
      ],
      "paths": ["digest.js"],
      "author": "Human Owner",
      "date": "2026-09-28T13:00:00Z",
      "subject": "Merge main into seat/branch: keep the leaner formatter"
    }
  ],
  "generatedSha": "77b77f21cc12d055a1bee0f35ac18a16216f7100",
  "finalSha": "b05663e01406c9df94e626d0dca25442a645d952",
  "agentMarker": "Claude Opus 5 <noreply@anthropic.com>",
  "subject": "Generate the item formatter",
  "distilled": false,
  "pullRequest": {
    "repo": "owner/name",
    "number": 42,
    "acceptance": {
      "accepted": true,
      "basis": "alexandrapaiz merged owner/name#42 at 2026-10-03T15:23:34Z: an explicit act, not retention",
      "at": "2026-10-03T15:23:34Z"
    },
    "squashed": false,
    "closure": "branch-edit",
    "statedCorrections": []
  }
}
```

The span inside `.ursa/records/<record id>.json` that the array above
re-labels. Before this change the same span read
`"deletion": { "cause": "human_edit" }`:

```json
{
  "start": 106,
  "end": 148,
  "text": "const why = item.why ?? \"no stated reason\"",
  "fate": "generated_deleted",
  "deletion": {
    "cause": "merge",
    "mergeSha": "de07eeb",
    "mergeSubject": "Merge main into seat/branch: keep the leaner formatter"
  }
}
```

The same record's `stats.generated`, before and after, which is the one
number a lab would quote:

| Field | Before this change | After |
|---|---|---|
| `totalChars`, every char the generation wrote | 254 | 254 |
| `deletedChars`, absent from the final blob | 44 | 44 |
| `humanDeletedChars`, the person's discard | **44** | **2** |
| `humanDeletedPct`, the discard rate | **0.173** | **0.008** |
| `mergeDeletedChars`, destroyed mechanically | **0** | **42** |

42 of 44 deleted characters, 95 percent of the deletion label, moved out
of the column the product calls signal.

## 5. Exact commands

Reproduce the before-and-after measurement, from the repository root:

```sh
cd ursa-major
npm test                                            # tsc --noEmit && vitest run
npx vitest run src/adapters/github-pr.test.ts -t 'a merge inside the pull request deletes a generation'
```

That name covers five tests, including the two that bracket the defect:
`the resolved record blames the merge, not the person who made the next
commit`, and `with the merge withheld, the same text is charged to the
human — the defect, pinned`.

Measure the three real Ursa pull requests from their recorded fixtures,
with no network:

```sh
cd ursa-major
npx vitest run src/adapters/github-pr.test.ts -t 'replay against Ursa pull requests that really merged'
```

Re-record a fixture, or add a fourth, against the live API:

```sh
cd ursa-major
npx tsx src/adapters/cli.ts fixture --pr 13 --repo alexandrapaiz/Ursa \
  --project .. --out fixtures/pr/ursa-pr-13.json
```

Read one pull request's pairs, with the merge walk's result printed per
pair:

```sh
cd ursa-major
npx tsx src/adapters/cli.ts pairs --pr 13 --repo alexandrapaiz/Ursa --project ..
```

Observed output on 2026-10-03, which is a correct zero and §7 says why:

```
alexandrapaiz/Ursa#13 "Engineer 2026-09-24: auto-detect correction loops and regressions from a chat trace (sprint item 1)": open, 6 commits, 1 pair
  merge-resolution  57a750abe -> 4f9a7b0b8  1 path  accepted=null
```

Resolve a pull request into records and read the deletion split:

```sh
cd ursa-major
npx tsx src/adapters/cli.ts run --pr 13 --project .. --min-chars 200
```

Produce the commit shape that makes the walk non-empty, on a branch of
your own, never on `main`:

```sh
bash tools/ledger/requeue.sh 13        # report only, pushes nothing
bash tools/ledger/requeue.sh --push 13 # writes the merge commit to the PR branch
```

## 6. Tooling

| Tool and version | Its job here | Why it, over what else was considered |
|---|---|---|
| TypeScript 5.9.3 (`typescript ^5.7.2`) | compiles the adapter; `tsc --noEmit` is the first half of `npm test` | the four type errors PR #69 found existed in no branch and in no test run, because vitest transpiles through esbuild and never typechecks. The compiler is the only thing that sees a union of branches. |
| vitest 5.0.2 | runs all 21 test files, including the three that build throwaway git repositories | already the repository's runner; its `-t` name filter is how §5 addresses one scenario, and it runs TypeScript with no build step |
| tsx 4.19.2 | runs `src/adapters/cli.ts` directly | the adapter CLI is a developer tool, so a build artifact between editing and running it would be pure cost. Node's own `--experimental-strip-types` was the alternative and still warns on this Node line. |
| Node.js 22.23.3 | the runtime for everything above | the version the seat workflows already run; `node:util`'s `parseArgs` removes the need for a CLI argument library |
| git 2.55.0 | `git show <sha>:<path>` behind `blobAt`, `git rev-list --parents -n 1` behind `RepoReader.parents`, and the test fixtures' real merges | the attribution claim is "present in a parent, absent from the merge". Only git can answer that, and asking it is cheaper than reimplementing three-way merge semantics. |
| `gh` 2.101.0 | `gh api` for the snapshot; `gh pr list` for the L-E10 survey | it carries the Actions token already in the environment, so no second credential path exists for the seat to leak |
| `diff` 8.0.2 (npm) | the span diff behind `survived_mutated`; untouched by this change | listed because it is in the dependency path the change's tests exercise |

No new dependency, no new service, no new credential. Steady-state cost
stays $0.

## 7. What the real pull requests measure, and why zero is the right answer

Three real Ursa pull requests are now in the test corpus, and all three
report zero intervening merges. That number used to be a constant. It is
now computed, and each of the three is zero for a different reason, which
is why all three are kept:

| Fixture | The merge in it | Why nothing is reported |
|---|---|---|
| `ursa-pr-7.json` | `e4aed8ee`, "Merge main into exo/2026-09-20", 31 files | it is the **closure** of the four pairs whose paths it touched. A closure decides a span's fate; it is not an event on the way to one. |
| `ursa-pr-12.json` | `045c3b0f`, "Merge main into standup branch", 27 files | closure for one pair; for the pair that closed past it, **no path in common** — the merge touched `docs/sprints/pending.md`, the generation wrote `docs/sprints/dispatch-queue.md`. |
| `ursa-pr-13.json` | `c5484dabc`, "Merge main (PM standup #12) into engineer/...", 2 files | it sits **strictly between** the pair's two commits, which is the position check firing, and still reports nothing because its two paths are not the generation's three. |

The structural reason the live repository has not yet produced a
non-empty walk: a seat branch merges `origin/main` at the *end* of its
run, immediately before opening its pull request, so the merge is almost
always the closure. The shape that breaks that is a merge taken *during*
review, which is what `tools/ledger/requeue.sh --push` produces and what
the merge queue will now produce repeatedly on `docs/ideas.md`. The fix
lands before the data does, which is the only useful order for a label
the product sells.

## 8. What this change does not do

- **The record does not carry pull-request provenance.** `grep -rn
  pullRequest ursa-major/src --include=*.ts` outside `src/adapters/`
  returns nothing: `PullRequestProvenance` reaches
  `.ursa/episodes.json` and stops there. So `unreadableMerges` is
  inspectable on the episode store and in `cli.ts run`'s warning, and
  not yet on the record or in the viewer. Filed in `docs/ideas.md` as
  "The record forgets which pull request it came from".
- **`DeletionCause` still has two values.** When `blobAt` cannot read a
  merge's tree, `gitDeletionAttributor` falls through to `human_edit`,
  which is the same "unknown reads as the person's fault" shape one
  level down. A third cause would touch `src/types.ts`,
  `src/stats.ts`, `src/viewer.ts`, `src/bin/ursa.ts` and
  `src/hq/fixtures.ts`, so it is a slice of its own. Filed as
  "An unknown deletion cause is not the human's".
- **GitHub's own truncation is not handled.** The commits API returns at
  most 300 files per commit. A merge wider than that would have a short
  `files` list and could hide an overlap. Not reachable on any pull
  request in this repository today, and recorded here rather than
  guessed at.

**The direction of error in the path filter.** The walk decides whether
a merge is relevant from `PullRequestCommit.files`, which is the file
list `gh api repos/{owner}/{repo}/commits/{sha}` returns, and for a
merge commit that list is the diff against the first parent. Today's
craft scan of CodeScene (`docs/ideas.md`, 2026-10-03 second dispatch)
supplies the check: in git, `--first-parent` alone still emits
merge-introduced paths, and `--diff-merges=off` is what suppresses them,
so a tool in this space can plausibly report either the first-parent
diff or something wider. Either is safe here, and the asymmetry is worth
stating rather than leaving to be rediscovered. A merge wrongly
*admitted* costs two `git show` calls and cannot produce a wrong label,
because `gitDeletionAttributor` still has to find the text in a parent
and absent from the merge's own tree before it writes `cause: 'merge'`.
A merge wrongly *omitted* is the failure that matters, and truncation is
its only route.
