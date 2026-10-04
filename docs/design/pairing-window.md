# The pairing window: an all-agent history credited one generation with a file five others wrote

Engineer run, 2026-10-04 (second dispatch). Branch
`engineer/2026-10-04-pair-distance`, stacked on
`engineer/2026-10-04-unknown-deletion-cause` (#72).

Closes the ledger's `2026-09-30 — URGENT: every pair collapses to one
final commit when the agent authors everything`, which had been open
and `urgent` for four days.

Held to the engineering-artifact standard in `prompts/engineer-agent.md`:
the diagram's nodes are files that exist, the interfaces are the
signatures a caller writes, the payload is a real record this run
produced, and every command below was run.

**Redaction note.** Every path in this document is either repository
relative or under `/tmp`. No home directory, no machine username, no
private session identifier appears, and the probe clone is built from
the public remote rather than from a local checkout. Commit shas are
this public repository's own and are shown truncated to eight
characters, which is how `git log --oneline` prints them.

## 1. The defect, stated exactly

`findCommitPairsWithDiagnostics` in `ursa-major/src/pairfinder.ts`
claims a pair of commits: a generation, and the edit a person made to
it. The claim is the foundation of the whole record. Every span class
in `docs/design/product-plan.md` is computed by comparing the blob at
`generatedSha` with the blob at `finalSha`, so if the pair is wrong,
every number downstream is wrong in the same direction.

The walk took the generation at index `i` and scanned forward for the
first commit that carried no agent marker, was not a merge, and touched
one of the generation's paths. Four things were missing from that
sentence, and this repository's own history exercises all four.

Run against a clone of `main` at `0d68df0`, 98 commits, before this
change:

```
6 work units found, 6 resolved into records.
239,976 chars survived your editing verbatim, 2,808 survived edited.
239,841 chars were generated to get there; 0% were drafts you discarded on the way.
```

Read the first two numbers together. More text is reported as having
**survived verbatim** than is reported as having been **generated at
all**. `survived_verbatim` means a span is byte-identical in the
generation and in the finished work, so it is a subset of the
generation by construction and cannot exceed it. The product's headline
number was arithmetically impossible, in all six records, and nothing
in the pipeline noticed.

The six pairs, as the walk found them:

| generation | edit | commits apart | hours apart | path |
|---|---|---|---|---|
| `c5f52000` | `8c453f04` | 42 | 234.6 | `docs/standards/lessons.md` |
| `2da85a0e` | `8c453f04` | 39 | 223.2 | `docs/standards/lessons.md` |
| `c41ab2dd` | `8c453f04` | 37 | 217.1 | `docs/standards/lessons.md` |
| `0c092905` | `8c453f04` | 9 | 97.0 | `docs/standards/lessons.md` |
| `7c739cf0` | `8c453f04` | 4 | 48.4 | `docs/standards/lessons.md` |
| `55580b63` | `8c453f04` | 1 | 30.6 | `docs/standards/lessons.md` |

One edit. One file. Six generations, each credited with the whole of
`docs/standards/lessons.md` as it stood at its own commit, and each
emitting a separate record. The same 66,586-character file was counted
six times.

### 1.1 The four defects

**D1, the forward scan had no bound.** Nothing stopped the walk, so a
generation 42 commits and 9.8 days from an edit was paired with it. Two
visits to the same file a working week apart are not a correction loop.

**D2, a later generation on the same line did not stop the walk.**
`c5f52000` wrote `lessons.md`; four more generations rewrote the same
file; then a person edited it. The person never had `c5f52000`'s text in
front of them, so `c5f52000` cannot have survived their editing. Their
edit corrects the *newest* generation. This is the defect that produced
all six pairs, and it is the one the product's commercial claim depends
on: `docs/vision.md` sells revealed preference, and a generation the
user never saw reveals nothing.

**D3, a merge was accepted as a generation.** `55580b63` is a merge
commit (`parents=7c739cf0 4d5e4017`) authored `claude[bot]`, which
matches `DEFAULT_AUTHOR`. It carried no `Co-Authored-By` trailer; the
author-name fallback classified it. A merge's diff against a parent is
other commits' work restated, so it generated nothing of its own, and
crediting it with the file at the merge point attributes a whole branch
to one commit that wrote none of it. Eight of this repository's commits
are agent-marked merges.

**D4, the agent-marker test ran before the merge test, so merges became
invisible.** This is the costly one, and it is a one-line ordering
mistake:

```ts
if (marker(fin)) continue          // ran first
if (fin.parents.length > 1) { /* record as an intervening merge */ }
```

A merge authored by a harness identity matches `marker`, so it hit
`continue` and never reached the branch that records it in
`CommitPair.interveningMerges`. Measured, on the same clone:

```
BASELINE pairs=6 interveningMerges=0
```

Zero, in a repository where eight merges touch the paired path.
`ursa-major/src/deletion.ts` decides whose deletion a vanished span was
by asking whether an intervening merge destroyed it, and with an empty
list the answer is always the same one: the person's. That is precisely
the mislabeling PRs #66, #71 and #72 were written to prevent, re-entering
one level upstream through classification order. `src/types.ts`
documents `humanDeletedChars` as "the only deletion rate safe to call a
discard rate", and on this history it was not safe.

## 2. System diagram, node by node and edge by edge

Every node is a file that exists in the repository. Every edge is
labelled with the type or the git object that crosses it.

```
  ursa-major/src/bin/ursa.ts
    [ run <projectPath> --max-pair-distance N
          --max-pair-age-hours N --max-interposed-generations N ]
            |
            |  PairFinderOptions
            v
  ursa-major/src/pairfinder.ts :: findCommitPairsWithDiagnostics
    |         |         |              |
    |         |         |              +--> { pairs: CommitPair[],
    |         |         |                     diagnostics: PairFinderDiagnostics }
    |         |         |
    |  CommitInfo[]     |  string[] (paths)        boolean (ancestry)
    |         |         |              |
    v         v         v              v
  listCommits  commitFiles  isAncestor   (all three shell out to `git`)
    |            |            |
    | git log    | git show   | git merge-base --is-ancestor
    | --all      | -m         |
    | --reverse  | --name-only|
    | --topo-order            |
    v            v            v
  the project's .git directory (read-only; no node writes to it)
```

Downstream, unchanged by this run but reading its output:

```
  CommitPair[]
      |
      |  CommitPair (generatedSha, finalSha, paths, interveningMerges)
      v
  ursa-major/src/episodes.ts :: buildEpisodes
      |
      |  Episode
      v
  ursa-major/src/bin/ursa.ts :: resolveEpisode
      |
      |  OutcomeRecord
      +--> ursa-major/src/deletion.ts   reads Episode.interveningMerges,
      |                                 writes SpanDeletion.cause
      +--> ursa-major/src/stats.ts      writes Stats.generated.*
      +--> ursa-major/src/store.ts      writes <project>/.ursa/records/<id>.json
      |
      |  PairFinderDiagnostics
      v
  ursa-major/src/bin/ursa.ts :: renderRunSummary
      |
      |  string (the lines a person reads on stdout)
      v
  the terminal
```

The edge that carried the defect is the one from `commitFiles` into the
inner loop's classification order, and the edge that carried D4 is
`CommitPair.interveningMerges` into `deletion.ts` arriving empty.

## 3. Interfaces at every boundary, as real signatures

The options, in `ursa-major/src/pairfinder.ts`. All three are optional
and all three accept `Infinity`, which restores the unbounded walk:

```ts
export interface PairFinderOptions {
  agentTrailerPattern?: RegExp
  agentAuthorPattern?: RegExp
  /** commits walked forward from a generation before the claim is abandoned */
  maxPairDistance?: number
  /** hours between the generation's date and the edit's before the claim is abandoned */
  maxPairAgeHours?: number
  /** how many other generations may rewrite this generation's own paths in between */
  maxInterposedGenerations?: number
}
```

What the walk decided, so an empty or a shrunken result can be
explained rather than guessed at:

```ts
export interface PairFinderDiagnostics {
  commitsScanned: number
  generatedByTrailer: number
  generatedByAuthorName: number
  authorFallbackSuppressed: { pattern: string; authors: string[] } | null
  bounds: {
    maxPairDistance: number
    maxPairAgeHours: number
    maxInterposedGenerations: number
  }
  /** generations that found no edit, counted by whichever bound stopped the walk FIRST */
  abandoned: {
    distance: number
    age: number
    interposedGeneration: number
    notDescendant: number
  }
  /** merge commits that carried an agent marker and were refused as generations */
  mergeGenerationsRefused: number
}
```

The new primitive this change needed, exported because the test suite
asserts against it directly:

```ts
export function isAncestor(
  repoPath: string,
  ancestor: string,
  descendant: string,
): boolean
```

The two walk entry points, both unchanged in signature, so no caller in
the repository had to be edited:

```ts
export function findCommitPairs(
  repoPath: string,
  opts?: PairFinderOptions,
): CommitPair[]

export function findCommitPairsWithDiagnostics(
  repoPath: string,
  opts?: PairFinderOptions,
): { pairs: CommitPair[]; diagnostics: PairFinderDiagnostics }
```

The summary renderer, whose third argument is how the refusals reach a
person:

```ts
export function renderRunSummary(
  records: OutcomeRecord[],
  episodes: Episode[],
  diagnostics?: PairFinderDiagnostics,
): string
```

`CommitPair` and `MergeEvent` are unchanged. The defaults are module
constants rather than inline literals, so a reader finds the number and
its reasoning in one place:

```ts
const DEFAULT_MAX_PAIR_DISTANCE = 25
const DEFAULT_MAX_PAIR_AGE_HOURS = 168
const DEFAULT_MAX_INTERPOSED_GENERATIONS = 0
```

## 4. The decision procedure, exactly as it runs

For each commit `gen` at index `i` in `listCommits(repoPath)`, which is
`git log --all --reverse --topo-order`:

1. **Is it a generation?** `marker(gen)` matches the `Co-Authored-By`
   trailer against `DEFAULT_TRAILER`, or the author name against
   `DEFAULT_AUTHOR` when that pattern discriminates this history. No
   marker, no generation; skip.
2. **Is it a merge?** `gen.parents.length > 1`. If so, increment
   `diagnostics.mergeGenerationsRefused` and skip. **(fixes D3)**
3. **Did it touch anything?** `touched(gen.sha)` non-empty, else skip.
4. Walk `j` from `i + 1` forward. For each candidate `fin`:
   1. **Distance.** `j - i > maxPairDistance`: increment
      `abandoned.distance` and stop walking this generation. **(fixes
      D1)** Position in this list is monotonic, so stopping at the first
      commit past the bound is safe, and it is also what keeps the walk
      cheap.
   2. **Is it a merge?** `fin.parents.length > 1`: if it touched one of
      the generation's paths, push a `MergeEvent` onto
      `interveningMerges`, then continue. **This test is now before the
      marker test. (fixes D4)**
   3. **Is it another generation?** `marker(fin)`: continue.
   4. **Does it touch the generation's paths?** No overlap, continue.
   5. **Age.** `hoursBetween(gen.date, fin.date) > maxPairAgeHours`:
      increment `abandoned.age` and stop. Checked here, against the
      candidate edit, rather than against every commit walked; §9
      explains why that distinction is load-bearing.
   6. **Descent.** `descends(gen.sha, fin.sha)`, memoizing
      `isAncestor`: false means the edit is on a branch that never
      contained the generation's text, so it cannot be a correction of
      it. Increment `abandoned.notDescendant` and stop.
   7. **Interposition.** Collect the commits strictly between `i` and
      `j` that are non-merges, carry a marker, touch one of the
      generation's paths, **descend from `gen`, and are ancestors of
      `fin`**. More than `maxInterposedGenerations` of them: increment
      `abandoned.interposedGeneration` and stop. **(fixes D2)**
   8. Otherwise emit the `CommitPair` and stop.

`abandoned` is a partition: a generation is counted against at most one
bound, the first that stopped it, and never counted at all if it
produced a pair. A summary that adds the four counters therefore gets
the number of generations left out, which is what
`renderRunSummary` prints.

### 4.1 Why step 4.7 is topological, and not a count

The first version of the interposition rule counted any agent commit
that `--topo-order` printed between the generation and the edit. The
existing suite rejected it within a minute:
`src/deletion.test.ts`'s `mergeDeletionRepo` fixture builds a rival
generation on a **sibling branch**, merged in later by a person who
resolves the conflict in the rival's favour. The agent block dies in
that merge, and the record's whole purpose there is to attribute the
loss to the merge rather than to the person. A sibling generation is
printed between the two commits and had no part in what happened
between them, so counting it dropped the pair and with it the
merge-deletion signal.

So "between" had to become a question about the graph. An interposed
generation must descend from the generation **and** be an ancestor of
the edit. On this repository's `main` that distinction moves the count
from 71 to 1: seventy of those were sibling branches that
`--topo-order` had linearised.

The same `isAncestor` call then paid for the cheap half of the ledger
entry's second candidate fix, step 4.6, at no extra cost.

## 5. On-disk layout, with a real payload

Nothing in this change adds a file or a format. It changes which
records appear under a project's existing `.ursa/` directory:

```
/tmp/ursa-probe/                 the probe clone, built in §6
  .git/                          read-only input; no node writes here
  .ursa/
    episodes.json                Episode[], one per surviving pair
    records/
      ursa-probe-2026-09-27-7c739cf.json   OutcomeRecord
```

The record's filename is `<project>-<closing commit's date>-<7-char
generated sha>.json`, built by `ursa-major/src/episodes.ts`. Before this
change that `records/` directory held six files. It now holds one.

The surviving record, verbatim from
`/tmp/ursa-probe/.ursa/records/ursa-probe-2026-09-27-7c739cf.json`,
with only the two long text fields elided and marked. Every number,
key and string below is as written:

```json
{
  "schemaVersion": 1,
  "artifact": { "kind": "repo" },
  "files": [ { "path": "docs/standards/lessons.md", "text": "<elided, 66586 chars>" } ],
  "conversations": [
    {
      "id": "git-7c739cf",
      "title": "Lessons sync 2026-09-28: HQ standards/lessons.md @ 775ce36 (#31)",
      "adapter": "git",
      "model": "claude[bot] <noreply@anthropic.com>",
      "date": "2026-09-27T19:41:51-06:00",
      "turns": 1,
      "userTurns": 0
    }
  ],
  "generations": [
    {
      "conversationId": "git-7c739cf",
      "model": "claude[bot] <noreply@anthropic.com>",
      "turnIndex": 1,
      "kind": "write",
      "filePath": "docs/standards/lessons.md",
      "timestamp": "2026-09-27T19:41:51-06:00",
      "text": "<elided, 60366 chars>",
      "generationIndex": 0,
      "totalChars": 60366,
      "survivedChars": 60001,
      "survivalRate": 0.994,
      "spans": [ "<elided, 1270 spans: 1240 survived_verbatim, 3 survived_mutated, 27 generated_deleted>" ]
    }
  ],
  "stats": {
    "finalChars": 66586,
    "byClass": {
      "survived_verbatim": { "spans": 870, "chars": 60616, "pct": 0.949 },
      "survived_mutated": { "spans": 4, "chars": 236, "pct": 0.004 },
      "no_generation_provenance": { "spans": 55, "chars": 3028, "pct": 0.047 }
    },
    "generated": {
      "totalChars": 60366,
      "survivedChars": 60001,
      "deletedChars": 365,
      "deletedPct": 0.006,
      "humanDeletedChars": 365,
      "humanDeletedPct": 0.006,
      "mergeDeletedChars": 0,
      "unknownDeletedChars": 0
    }
  },
  "durability": {
    "method": "git-forward-walk",
    "tipSha": "0d68df0d6084e275ba71ddc0f474e6d711296591",
    "closingSha": "8c453f049e996c6a9592fd5a719f1221ea0be652",
    "testedSpans": 0,
    "durableChars": 0,
    "decayedChars": 0,
    "decayRate": null,
    "maxRevisionsWalked": 50,
    "minTraceableLen": 24
  }
}
```

Two things in that payload are worth naming rather than leaving for a
reader to notice.

`no_generation_provenance` is 3,028 characters across 55 spans, and
`CLAUDE.md` calls that the most valuable class in the whole artifact:
text in the finished work that no generation produced. Before this
change it was computed against a pair that was not real, so the class
the business rests on was being measured against the wrong denominator
six times over.

`durability.testedSpans` is 0 because `closingSha` (`8c453f04`) is four
commits from `tipSha` (`0d68df0d`) and no later commit touched the
file, so the time dimension had nothing to walk. That is the finding
already in the ledger as "every pair collapses to one final commit",
and it is unchanged by this run.

## 6. Exact commands

Every command below was run on this branch. Paths are repository
relative or under `/tmp`.

```bash
# dependencies, from ursa-major/
npm install --no-audit --no-fund

# the whole suite, and the typecheck vitest does not do
npx tsc --noEmit
npx vitest run

# only this change's own cases
npx vitest run src/pairing-window.test.ts

# the cases that constrain it from the outside, which caught §4.1
npx vitest run src/deletion.test.ts src/m0.test.ts

# the probe repository: the public remote, main only, full history
cd /tmp && rm -rf ursa-probe \
  && git clone -q --single-branch --branch main \
       https://github.com/alexandrapaiz/Ursa.git ursa-probe

# the product, on that clone, with the bounds in force
cd ursa-major && rm -rf /tmp/ursa-probe/.ursa \
  && npx tsx src/bin/ursa.ts run /tmp/ursa-probe

# the same run with the bounds lifted, which is how the before/after in
# §8 was taken rather than argued
npx tsx src/bin/ursa.ts run /tmp/ursa-probe \
  --max-pair-distance Infinity \
  --max-pair-age-hours Infinity \
  --max-interposed-generations Infinity

# the baseline, read straight out of git rather than reconstructed, so
# the before/after runs the same file this branch's parent shipped
git show origin/engineer/2026-10-04-unknown-deletion-cause:ursa-major/src/pairfinder.ts \
  > /tmp/pairfinder-baseline.ts

# the three commits §1 names, inspected by hand
git -C /tmp/ursa-probe show -s \
  --format='parents=%P%nauthor=%an%nsubject=%s%ntrailers=%(trailers:key=Co-Authored-By,valueonly)' \
  55580b63 7c739cf0 8c453f04

# the boundary checks this charter requires
git diff --name-only origin/engineer/2026-10-04-unknown-deletion-cause...HEAD \
  | grep -E '^(prompts|\.github|docs/sprints|docs/standards|skills|digests)/'
```

## 7. Tooling

| Tool | Version | Its job here | Why it, over what else was considered |
|---|---|---|---|
| `git` | 2.55.0 | every history read: `log`, `show`, `merge-base --is-ancestor` | the data is git history; there is no second source for it. `merge-base --is-ancestor` over parsing `git log --ancestry-path` output: it answers with an exit code, which needs no parser and cannot be misread when a repository is partial. |
| `node` | 22.23.3 | the runtime `ursa run` executes on | already the project's runtime; this change adds no dependency |
| TypeScript `tsc` | 5.9.3 | the only check that sees `PairFinderDiagnostics.abandoned` gaining a fourth field reach every consumer | `vitest` transpiles through esbuild and never typechecks. Adding a required field to a shared interface is the change class that breaks silently without it, which is the finding already in the ledger as "A required field on a shared type is a CI gate, not a review question". |
| `vitest` | 5.0.2 | the 344-case suite, including the 13 new ones in `src/pairing-window.test.ts` | already the project's runner; its per-file argument is how §6 names one scenario as evidence |
| `tsx` | 4.23.15 | runs `src/bin/ursa.ts` from source against `/tmp/ursa-probe` | no build step between a change and running the real product |
| `gh` | 2.101.0 | the pull-request survey L-E10 requires, and opening this PR | the open-PR state is not in the clone |

No new dependency, no new service, no cost. Steady state stays $0.

## 8. What the measurements say

All figures from the same clone: `main` at `0d68df0`, 98 commits,
8 agent-marked merges. Each row changes one thing against the
unbounded walk, so each mechanism's own effect is visible rather than
inferred from the total.

| Configuration | pairs | intervening merges found | generations abandoned |
|---|---|---|---|
| baseline, this branch's parent | 6 | **0** | not reported |
| D3 and D4 fixed, all bounds lifted | 5 | 6 | 0 |
| distance only, 25 commits | 2 | 2 | 65 by distance |
| age only, 168 hours | 2 | 2 | 3 by age |
| interposition only, topological | 1 | 1 | 4 by interposition |
| **all three, the shipped defaults** | **1** | **1** | 65 by distance, 1 by interposition |

The product's headline numbers, before and after:

| | before | after |
|---|---|---|
| records emitted | 6 | 1 |
| chars survived verbatim | 239,976 | 60,616 |
| chars generated | 239,841 | 60,366 |
| verbatim exceeds generated | yes, in all 6 records | no |
| discard rate shown to the user | 0% | 1% |

Four readings worth stating plainly:

**The headline number falls by 75%, and that is the fix working.** The
old number counted one 66,586-character file six times. Nothing was
lost that was ever true.

**The impossible arithmetic is gone.** Every one of the six records had
`survived_verbatim` above `generated.totalChars`. The surviving record
does not. §9 records that this is not yet enforced anywhere.

**D4 cost more than D1 through D3 together, and was the least visible.**
Baseline found zero of eight intervening merges. Every merge-caused
deletion in this history was being handed to `deletion.ts` as the
person's own discard, which is the one thing three consecutive runs had
been working to prevent. No bound was needed to fix it; two lines
swapped order.

**Distance does most of the work here, interposition does the
load-bearing work.** Distance abandons 65 generations and interposition
only 1 at the shipped defaults, because distance is checked first and
gets there first. Run alone, interposition takes the pair count to 1 by
itself and distance only to 2. The ordering of the counters is an
artifact of the walk, not a ranking of the rules, and §4 says so where
a reader will look.

## 9. What this change does not do

**It does not assert the invariant that would have caught all of
this.** `survived_verbatim` chars cannot exceed `generated.totalChars`,
and asserting it as a test would have failed on all six records before
this change. It still fails on the surviving one: 60,616 against
60,366. The remaining 250 characters are not a pairing error, they come
from the span matcher in `ursa-major/src/match.ts` accepting a fuzzy
match wider than the generated text it matched against, which is a
different defect in a different module. Shipping the assertion today
would have meant either a failing suite or weakening the assertion
until it proved nothing. It is in the ledger as its own entry, with
these numbers.

**It does not stop a generation being credited with text it did not
write.** A git generation's `totalChars` is the whole file at the
agent's commit, not the diff that commit introduced. On
`7c739cf0` that is 60,366 characters of `lessons.md`, most of it
written by earlier commits. The surviving pair is a legitimate pair and
its figure is still too generous. In the ledger as its own entry.

**It does not fix the trailer pattern.** `DEFAULT_TRAILER` is
`/claude|codex|cursor|gpt/i`, so `8c453f04`, whose trailer is
`exo-centralizer[bot]`, is classified as a person's edit. The one
surviving pair on this history is therefore one bot's sync being read
as a human correction. The bounds are not the right place to fix that.
In the ledger as its own entry.

**It does not retune the defaults against the private trial data.**
25 commits and 168 hours were chosen from this repository's 98 commits,
which is one history with one shape. `docs/sprints/sprint-2026-09-21.md`
is explicit that the real task-001 data lives in
`alexandrapaiz/ursa-private`, which this seat cannot read. The numbers
are defaults a caller can override per run, not findings.

**It changes no public signature.** `findCommitPairs` and
`findCommitPairsWithDiagnostics` keep their shapes, so no caller in the
repository was edited. `PairFinderDiagnostics` gains three fields,
which is why §7 names `tsc` as the check that matters for this change.
