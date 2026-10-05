# Engineer run — 2026-10-02: merge-destroyed generations are not human deletions

Continuation of the run that opened PR #66. That run
([36955429726](https://github.com/alexandrapaiz/Ursa/actions/runs/36955429726),
started 2026-10-02T02:23:47Z) was cancelled for exceeding the 45-minute
execution ceiling and lost its uncommitted work at sandbox teardown; the
draft PR and this file are what survived it, which is the ship-first
rule in `prompts/engineer-agent.md` working as intended. The PM's
2026-10-02 standup (PR #67) judged the correct next dispatch to be
"build on PR #66's branch" and its `gh workflow run` attempt returned
`HTTP 403: Resource not accessible by integration`. This run does that
work on that branch, so the day still has exactly one engineer PR.

Held to the engineering-artifact standard in `prompts/engineer-agent.md`.

## 1. The defect

`generated_deleted` is one of the four span classifications CLAUDE.md §1
names as the commercial object Ursa Minor sells. It meant two different
things at once:

- text the human had in front of them and did not keep — a correction,
  expressed as a deletion, which is signal;
- text a merge commit dropped mechanically somewhere between the
  generation and the commit the pair finder picked as "final" — which
  nobody read, nobody rejected, and which carries no signal at all.

The second also named the wrong person. `CommitPair.finalAuthor` is
whoever authored the later commit the scan settled on, so a merge's
casualty was filed as that person's discard.

### How it happened, exactly

`findCommitPairs` (`ursa-major/src/pairfinder.ts`) walks forward from an
agent-marked commit looking for the next commit that is not agent-marked,
is not a merge, and touches an overlapping path. Skipping merges as
pairing targets is correct: the human did not author a merge's diff. The
error was continuing past the merge and forgetting it. `resolve.ts` then
routes every generation segment that no final-file span claimed to
`generated_deleted`, because absence from the final blob is all it can
see, and absence has those two causes.

### The second defect underneath it

`commitFiles` ran `git show --name-only --format= <sha>`. For a merge
commit that prints **nothing**, because git shows no diff for a merge
unless asked. It did not error and did not return a wrong path; it
returned an empty list. That is why the pair finder appeared to refuse
merges before its explicit `parents.length > 1` check ever fired — a
merge never reported an overlapping path, so the overlap test skipped it
anyway. A guard and a bug were masking each other. The 2026-09-20 ledger
finding ("the pair finder now skips merge commits, test added, 26
passing") credited the guard with behaviour the bug was producing. Fixing
`commitFiles` is what makes that guard load-bearing for the first time,
and it is also what makes merge detection possible at all.

## 2. System diagram

Nodes are real files and real git objects. Edges carry named types.

```
ursa-major/src/bin/ursa.ts :: main()
  │  projectPath: string
  ▼
ursa-major/src/pairfinder.ts :: listCommits()
  │  CommitInfo[]  (field `parents: string[]`, was `parentCount: number`)
  ▼
ursa-major/src/pairfinder.ts :: findCommitPairs()
  │  CommitPair[]  (new field `interveningMerges: MergeEvent[]`)
  ▼
ursa-major/src/episodes.ts :: buildEpisodes()
  │  Episode[]  (new field `interveningMerges: MergeEvent[]`)
  ▼
ursa-major/src/bin/ursa.ts :: resolveEpisode()
  ├──► ursa-major/src/deletion.ts :: gitDeletionAttributor()
  │       │  reads git blobs via pairfinder.blobAt(), returns
  │       │  DeletionAttributor = (filePath, spanText) => DeletionAttribution
  │       ▼
  │    ursa-major/src/resolve.ts :: resolve()
  │       input field `attributeDeletion?`
  │  OutcomeRecord
  ▼
ursa-major/src/stats.ts :: computeStats()
  │  Stats  (new fields humanDeletedChars, humanDeletedPct, mergeDeletedChars)
  ├──► ursa-major/src/store.ts :: saveRecord()
  │       writes <projectPath>/.ursa/records/<episodeId>.json
  ├──► ursa-major/src/store.ts :: saveEpisodes()
  │       writes <projectPath>/.ursa/episodes.json
  └──► ursa-major/src/viewer.ts :: renderViewer()
          writes outcome_record.html (deletion tile + per-span hover)
```

Edge into `deletion.ts` from git, named concretely: `gitDeletionAttributor`
calls `blobAt(projectPath, sha, path)`, which runs `git -C <projectPath>
show <sha>:<path>` and returns `string | null`. It reads two kinds of
tree: the merge commit's own result, and each sha in `MergeEvent.parents`.

## 3. Interfaces at every new boundary

Real signatures, as a caller would write them.

```ts
// ursa-major/src/pairfinder.ts
export interface MergeEvent {
  sha: string
  parents: string[]          // git's order; parents[0] is the first parent
  paths: string[]            // intersection with the generation's paths
  author: string
  date: string
  subject: string
}

export interface CommitPair {
  // ...existing fields unchanged...
  interveningMerges: MergeEvent[]   // oldest first
}

export function commitFiles(repoPath: string, sha: string): string[]

// ursa-major/src/types.ts
export type DeletionCause = 'human_edit' | 'merge'

export interface DeletionAttribution {
  cause: DeletionCause
  mergeSha?: string          // short sha, set only when cause is 'merge'
  mergeSubject?: string
}

export interface GenerationSpan {
  start: number
  end: number
  text: string
  fate: GenerationFate
  deletion?: DeletionAttribution   // set only when fate is 'generated_deleted'
}

// ursa-major/src/deletion.ts
export interface DeletionAttributor {
  (filePath: string, spanText: string): DeletionAttribution
}

export function gitDeletionAttributor(
  projectPath: string,
  merges: MergeEvent[],
): DeletionAttributor

// ursa-major/src/resolve.ts — ResolveInput gains one optional field, so
// resolve() remains a pure function of its input and never reads git.
export interface ResolveInput {
  // ...existing fields unchanged...
  attributeDeletion?: (filePath: string, spanText: string) => DeletionAttribution
}

// ursa-major/src/types.ts — Stats.generated
generated: {
  totalChars: number
  survivedChars: number
  deletedChars: number        // unchanged meaning: the gross figure
  deletedPct: number          // unchanged meaning: deletedChars / totalChars
  humanDeletedChars: number   // new
  humanDeletedPct: number     // new
  mergeDeletedChars: number   // new
}
```

`deletedChars` and `deletedPct` keep their existing meaning on purpose.
Silently redefining a published field is the same class of error as the
bug being fixed, so the honest figures are added under new names and
every display surface was moved to them.

## 4. The decision rule

A generation span is attributed to a merge when both halves hold, for
some merge in `interveningMerges` that touched the span's path, taking
merges oldest first:

1. the span's normalized text is **absent** from the merge's own result,
   `blobAt(mergeSha, path)`;
2. the span's normalized text is **present** in **some** parent,
   `blobAt(parent, path)` for any `parent` in `MergeEvent.parents`.

Otherwise the cause is `human_edit`. Notes on why it is shaped this way:

- Normalized containment is the same primitive `resolve.ts` Pass 1 uses
  to judge survival (`normalize()` from `ursa-major/src/normalize.ts`,
  then `String.prototype.includes`). Survival and destruction are then
  judged by one test against different trees, so the two labels cannot
  disagree about what "the same text" means.
- Checking **any** parent, not just the first, keeps the rule correct
  whichever direction the merge was made in.
- The conjunction makes `human_edit` the default. A span has to vanish
  exactly at a merge boundary to earn `merge`, so the label Ursa Minor
  sells is never diluted by a guess. The measured cost of that choice is
  in §6.
- `blobAt` returning `null` (path absent at that commit) counts as
  absent, so a merge that deleted the file outright is still attributed.

## 5. Exact commands

Run in `ursa-major/` unless stated. These are the literal invocations
this run executed.

```bash
# install, pinned by package-lock.json
npm ci

# the suite, before and after
npx vitest run
npx vitest run src/deletion.test.ts

# types
npx tsc --noEmit

# the real-data trial: a clone of this repo, then two real agent
# branches merged with a real conflict resolution
git clone -q /home/runner/work/Ursa/Ursa /tmp/ursa-live
cd /tmp/ursa-live
git config user.name "Human Owner"
git config user.email "owner@example.com"
git remote add gh https://github.com/alexandrapaiz/Ursa.git
git fetch -q --depth=50 gh engineer/2026-09-30-span-lifespan \
                          engineer/2026-10-01-consent-gate
git checkout -q -B trial gh/engineer/2026-09-30-span-lifespan
git merge --no-ff --no-commit gh/engineer/2026-10-01-consent-gate   # conflicts
git checkout --ours docs/ideas.md
git add -A
git commit -q -m "Merge consent-gate: keep the lifespan ledger entries"
printf '\n<!-- ledger reviewed 2026-10-02 -->\n' >> docs/ideas.md
git add -A && git commit -q -m "Note the ledger review date"

cd /home/runner/work/Ursa/Ursa/ursa-major
npx tsx src/bin/ursa.ts run /tmp/ursa-live --min-chars 200

# the audit of one attributed span, against the repo itself
cd /tmp/ursa-live
N='The bridge is a live transmission path with no consent gate'
git show 10fa505^1:docs/ideas.md | grep -c "$N"   # 0  absent in parent 1
git show 10fa505^2:docs/ideas.md | grep -c "$N"   # 1  present in parent 2
git show 10fa505:docs/ideas.md   | grep -c "$N"   # 0  gone at the merge
git show HEAD:docs/ideas.md      | grep -c "$N"   # 0  still gone

# how the merge-blindness in commitFiles was identified
git show --name-only --format= <mergeSha>        # prints nothing
git show -m --name-only --format= <mergeSha>     # prints the paths
```

## 6. Evidence

### The synthetic case, `ursa-major/src/deletion.test.ts`

Four tests over a repo built in the test itself: two agent branches
write a rival `formatItem`, the human resolves the conflict keeping one,
and a later unrelated human commit ("Soften the footer wording") is what
the pair finder picks as final. Three of the four failed against the
commit this branch started from, which is committed separately
(`234b56a`) so the defect is on the record before its fix. The suite
goes 36 → 40 tests, all passing, `tsc --noEmit` clean.

The tests assert the boundary as well as the fix: a span whose entire
text is a bare `}` stays `human_edit`, because `}` is still present in
the merge's result and containment cannot tell one closing brace from
another. That is the conservative direction, asserted rather than left
to be discovered.

### The real case

A clone of this repository, with two genuinely open engineer branches
merged under a genuine conflict in `docs/ideas.md`. This is not a
hypothetical: it is the situation the repo is in today, with 48 open PRs
from agent seats touching overlapping files. Aggregated over the 19
records produced:

| quantity | chars | share of generated | what it is |
|---|---|---|---|
| generated | 329,139 | 100% | all text the agent commits produced |
| deleted, gross (`deletedChars`) | 9,581 | 2.91% | **what the record reported before this change**, entirely as the human's discard |
| the human's own discard (`humanDeletedChars`) | 3,332 | 1.01% | what it reports now |
| destroyed by the merge (`mergeDeletedChars`) | 6,249 | 1.90% | reattributed, previously inside the row above |

**65.2% of the `generated_deleted` label was wrong**, and it concentrated
in one record. `ursa-live-2026-10-01-8bb7a11.json` carried 6,249
merge-destroyed chars against 519 of the human's own, so **92.3% of that
record's deletion label was false**: its `deletedPct` reads 0.451, and
the figure that is actually a claim about the owner is 0.035. A lab
buying that record would have been told the owner discarded 45% of the
agent's output on that task. She discarded 3.5%. 103 spans in it are now
attributed to merge `10fa505`, each carrying the sha that proves it.

One of those 103, audited end to end with the commands in §5: the span
`### 2026-10-01 — The bridge is a live transmission path with no consent gate`
is absent from the merge's first parent, present in its second parent,
absent from the merge's own result, and absent from HEAD. The merge
destroyed it. Every attribution is checkable this way, with two
`git show` calls, because `mergeSha` and `mergeSubject` are written into
the record.

### Where the change is correctly inert

The same clone with only `main` fetched has a near-linear history: 6
episodes, 0 intervening merges, and byte-identical output before and
after. The chat path (`ursa-major/src/cli.ts`) passes no
`attributeDeletion`, so every deletion there is attributed to the human,
which is correct — the final file is the file on disk and no merge sits
in between.

## 7. On-disk layout

Unchanged paths, additive fields. `<project>` is the directory named on
the command line; it is the user's own checkout and never this repo.

```
<project>/.ursa/episodes.json                  Episode[]
<project>/.ursa/records/<episodeId>.json       OutcomeRecord
```

A real `interveningMerges` entry, verbatim from
`/tmp/ursa-live/.ursa/episodes.json` in this run's trial. The merge is a
genuine commit in this repository's own public history, so the shas are
left intact; `alexandrapaiz` is the owner's public GitHub handle, already
on the remote URL and in `CLAUDE.md`, and is not a private identity:

```json
{
  "sha": "9a0ef222fa2fb1131ae46c8f996e30f8d360f589",
  "parents": [
    "ae6611a2cc49dbb90d403b6405b839bc3b5ab516",
    "0ebf5e2a4b10c9128c138296cc0edde0e9e047de"
  ],
  "paths": [
    "docs/agents/incidents.md"
  ],
  "author": "alexandrapaiz",
  "date": "2026-09-19T14:00:38-06:00",
  "subject": "Merge pull request #3 from alexandrapaiz/okr/2026-09"
}
```

A real attributed span, verbatim from
`/tmp/ursa-live/.ursa/records/ursa-live-2026-10-01-8bb7a11.json` (the em
dash is stored escaped as `\u2014` by `JSON.stringify`; shown decoded
here):

```json
{
  "start": 8997,
  "end": 9073,
  "text": "### 2026-10-01 — The bridge is a live transmission path with no consent gate",
  "fate": "generated_deleted",
  "deletion": {
    "cause": "merge",
    "mergeSha": "10fa505",
    "mergeSubject": "Merge consent-gate: keep the lifespan ledger entries"
  }
}
```

A real `stats.generated`, verbatim from that same record — the one the
defect hit hardest. Before this change the viewer and the CLI would have
reported its `deletedPct` of 45.1% as the owner's discard rate:

```json
{
  "totalChars": 15007,
  "survivedChars": 8239,
  "deletedChars": 6768,
  "deletedPct": 0.451,
  "humanDeletedChars": 519,
  "humanDeletedPct": 0.035,
  "mergeDeletedChars": 6249
}
```

Per the redaction rider: the trial ran in `/tmp/ursa-live`, a throwaway
clone on the CI runner, and `.ursa/` was deleted before committing. No
owner filesystem path, no private session id, and no private record
appears here or in the diff.

## 8. Tooling

| tool | version | job in this system | why it, over what else |
|---|---|---|---|
| `git` | 2.x, whatever the runner and the user's machine provide, invoked through `execFileSync` | the only source of provenance: commit metadata, parent lists, file lists, and blob contents at arbitrary trees | the project is git-native by ADR-003 and runs with no daemon, so history already holds the data; `-m` on `git show` is the specific flag that makes a merge's file list visible, and `<sha>:<path>` is the specific syntax that reads a blob at a tree without checking anything out. No library wrapper (`isomorphic-git`, `simple-git`) is used: the calls are five fixed invocations, `execFileSync` passes an argv array so nothing reaches a shell, and a dependency here would add install weight against the $0 steady-state cost constraint |
| `vitest` | 2.1.8, pinned in `ursa-major/package.json` devDependencies | runs the 40-test suite, including `deletion.test.ts`, which shells out to real `git` against repos it builds in `os.tmpdir()` | already the project's runner, so adding a file costs nothing; it runs TypeScript without a build step, which matters because the tests import `src/bin/ursa.ts` directly. Jest was not considered on its merits — switching runners is not a defensible cost for one new test file |
| `typescript` | 5.7.2, pinned | `tsc --noEmit` is the gate that caught every call site of the renamed `CommitInfo.parentCount` → `parents` field | the new `DeletionAttribution` is an optional field on a shipped schema, which is exactly the shape a structural type checker verifies for free |
| `tsx` | 4.19.2, pinned | runs `src/bin/ursa.ts` and the throwaway audit scripts directly, so the real-data trial needed no build | `ts-node` requires more configuration for ESM, and this package is `"type": "module"` |
| `diff` | 8.0.2, pinned runtime dependency | `diffWords` produces the word-level diff on `survived_mutated` spans | untouched by this change, listed because §8 asks for every tool named in the artifact and the diff it produces is what the §9 ledger entry on fabricated corrections is about |

## 9. What this run did not do, and why

- **Did not add a fifth span class.** CLAUDE.md §1 fixes the four
  classifications as the object Ursa Minor sells, and a seat does not
  unilaterally change the product's sold schema. The cause is a
  qualifier on `generated_deleted`, so the four-class object is intact
  and a consumer can filter on `deletion.cause`.
- **Did not redefine `deletedChars` or `deletedPct`.** See §3.
- **Did not change the `parents.length > 1` guard.** It was correct. The
  bug was the forgetting, and the blindness in `commitFiles`.
- **Did not fix the fabricated-correction defect found while debugging.**
  A final span that fuzzy-matches a generation above `THETA_HIGH` is
  labelled `survived_mutated` with a word-level diff presented as the
  human's correction, even when the text in the final file was written by
  a different agent on another branch and the human performed no edit at
  all. This is worse than the bug fixed today, because it fabricates an
  artifact rather than mislabelling one. It is a ledger entry rather than
  today's work because the evidence that settles it is outside the record
  and the fix needs a new `resolve()` hook plus its own tests, which is
  more than what remained of this session's ceiling. Recorded in
  `docs/ideas.md` 2026-10-02, "A high fuzzy score is treated as proof of
  descent".
- **Went looking for cross-branch pairing and did not find it.** Checking
  all 19 real pairs with `git merge-base --is-ancestor` returned 0
  non-ancestral, and two synthetic sibling-branch repos produced no pair
  rather than a bad one. The finding kept is the narrower true one: the
  ancestry invariant is not enforced anywhere in the code and currently
  holds because of the order git emits refs in. Ledger, same date.
