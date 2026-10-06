# An unknown deletion cause is not the human's

**Engineer run, 2026-10-04.** Branch
`engineer/2026-10-04-unknown-deletion-cause`, stacked on
`engineer/2026-10-03-pr-merge-attribution` (PR #71), which is stacked on
`engineer/2026-10-03-land-the-engineer-stack` (PR #69). Written to the
six-element engineering-artifact standard in `prompts/engineer-agent.md`.

This closes the third of the three gaps PR #71 filed rather than guessed
at. Its own words, quoted because they are the specification:

> **`DeletionCause` still has two values.** When `blobAt` cannot read a
> merge's tree it falls through to `human_edit`, which is the same
> unknown-reads-as-the-person's-fault shape one level down. A third
> value touches `src/types.ts`, `src/stats.ts`, `src/viewer.ts`,
> `src/bin/ursa.ts` and `src/hq/fixtures.ts`, so it is a slice of its
> own.

## 1. The defect, stated exactly

`ursa-major/src/pairfinder.ts` exported one blob reader:

```ts
export function blobAt(repoPath: string, sha: string, path: string): string | null {
  try {
    return git(repoPath, ['show', `${sha}:${path}`], { quiet: true })
  } catch {
    return null
  }
}
```

`git show <sha>:<path>` exits non-zero for two reasons that mean
opposite things, and this `catch` returns the same `null` for both.

1. **The commit is right here and the path is not in its tree.** A
   definite answer. The text is provably not present at that commit.
2. **Something the answer needs is missing from this clone.** No answer
   at all. The commit object after a shallow fetch, or the blob in a
   `--filter=blob:none` clone whose promisor remote is unreachable.

`gitDeletionAttributor` in `ursa-major/src/deletion.ts` built its
containment test on that `null`:

```ts
const holds = (sha: string, path: string, needle: string): boolean => {
  const hay = normalizedBlob(sha, path)
  return hay !== null && hay.includes(needle)
}
```

So in case 2 `holds` returned `false`, which the surrounding loop reads
as "the text was not there". The `merge` label requires a conjunction —
present in a parent of the merge, absent from the merge's own result —
and an unreadable repository makes both halves read `false`. The loop
then fell off its end to the module's default:

```ts
const HUMAN: DeletionAttribution = { cause: 'human_edit' }
...
    return HUMAN
```

**What that costs, in the product's own vocabulary.**
`ursa-major/src/types.ts` documents `humanDeletedChars` as "the only
deletion rate safe to call a discard rate", and `cause: 'human_edit'` is
documented as "the person had the text in front of them and did not keep
it". A missing git object is not a person's decision. Yet every hole in
the repository landed in that column, and the direction of the error was
always the same: toward blaming the person whose work Ursa Major exists
to carry.

**The second instance, one level up, in the same shape.** PR #71 added
`PullRequestProvenance.unreadableMerges`: shas of merges the GitHub API
names on a pull request whose parentage could not be read anywhere, so
they never became `MergeEvent`s. The field's own doc comment already
stated the consequence — "a `generated_deleted` span on this pair may
have been destroyed by one of them rather than by the person" — and
nothing read the field. `ursa-major/src/adapters/cli.ts` printed it as a
warning whose text was literally `so a deletion at those boundaries is
charged to the person`. The code described its own defect and shipped it.

**The three shapes that trigger it, by name, all ordinary.**

| Shape | Why the object is missing | Who hits it |
|---|---|---|
| A pull request from a fork | the fork's commits were never fetched into the base clone | any outside contributor's PR |
| A branch deleted after merge | GitHub's "delete branch on merge" prunes the ref, and the objects go with the next `gc` | every repository with that setting on, which is the default for new ones |
| A shallow or partial clone | `actions/checkout` defaults to `fetch-depth: 1`; `--filter=blob:none` leaves blobs on the remote | any capture run inside CI, including Ursa's own agent workflows |

## 2. System diagram, node by node and edge by edge

Eleven nodes. Every one is a file or a process that exists in this
repository today. Every edge carries a named type, file format, or
literal command. Nodes N3, N5 and N8 are the three this run changed;
N1 is the one it added.

| # | Node | What it is |
|---|---|---|
| N0 | `git` 2.51.0, the git binary | external process every tree read shells out to |
| N1 | `blobLookup` in `ursa-major/src/pairfinder.ts` | three-state tree read: present, absent, unreadable. New in this run. |
| N2 | `blobAt` in `ursa-major/src/pairfinder.ts` | the two-state read, now a wrapper over N1, kept for probes where absent and unreadable mean the same thing |
| N3 | `gitDeletionAttributor` in `ursa-major/src/deletion.ts` | decides what destroyed one deleted span |
| N4 | `Episode` in `ursa-major/src/episodes.ts` | one unit of work: two commits, the paths between them, and the merges on that boundary |
| N5 | `episodesFromPullRequest` in `ursa-major/src/adapters/github-pr.ts` | builds N4 from a captured pull request |
| N6 | `resolveEpisode` in `ursa-major/src/bin/ursa.ts` | reads the two trees, injects N3 into the resolver |
| N7 | `resolve` in `ursa-major/src/resolve.ts` | classifies every span of the finished text |
| N8 | `computeStats` in `ursa-major/src/stats.ts` | partitions the deleted chars by cause |
| N9 | `.ursa/records/<task-id>.json` on the user's disk | the outcome record, the artifact Ursa Minor sells |
| N10 | `renderViewer` in `ursa-major/src/viewer.ts` and `renderRunSummary` in `ursa-major/src/bin/ursa.ts` | the two surfaces that state a deletion figure to the user |

Edges, each labelled with what actually crosses it:

| Edge | Carries |
|---|---|
| N0 → N1 | exit status plus stdout of `git show <sha>:<path>`, then of `git ls-tree <sha> -- <path>` |
| N1 → N2 | `BlobLookup`, collapsed to `string \| null` by returning `text` for `present` and `null` for the other two |
| N1 → N3 | `BlobLookup`, read as the three-state `boolean \| 'unreadable'` returned by N3's internal `holds` |
| N5 → N4 | `unreadableMerges?: string[]`, the shas from `PullRequestProvenance.unreadableMerges` |
| N4 → N6 | `Episode`, fields `interveningMerges: MergeEvent[]` and `unreadableMerges?: string[]` |
| N6 → N3 | the two arguments `MergeEvent[]` and `DeletionAttributorOptions` |
| N3 → N7 | `DeletionAttribution`, one value per deleted span |
| N7 → N8 | `GenerationRecord[]`, each span carrying `fate` and `deletion` |
| N8 → N9 | `Stats`, including the new `generated.unknownDeletedChars: number` |
| N9 → N10 | the same `Stats` object, read as `R.stats.generated` in the browser and as `r.stats.generated` in the CLI |

The one edge worth reading twice is **N1 → N3**. Before this run it
carried `string | null`, two states, and the second one meant two
different things. Every defect in this document is downstream of that
collapse, and widening that single edge to three states is the whole
fix. Nothing in N7 changed at all.

## 3. Interfaces at every boundary, as real signatures

`ursa-major/src/pairfinder.ts`, the new reader:

```ts
export type BlobLookup =
  | { kind: 'present'; text: string }
  | { kind: 'absent' }
  | { kind: 'unreadable' }

export function blobLookup(repoPath: string, sha: string, path: string): BlobLookup

export function blobAt(repoPath: string, sha: string, path: string): string | null
```

`ursa-major/src/types.ts`, the widened label and its reason:

```ts
export type DeletionCause = 'human_edit' | 'merge' | 'unknown'

export type UnknownDeletionReason =
  | 'unreadable_merge_result'
  | 'unreadable_merge_parents'
  | 'unreadable_merge_commit'

export interface DeletionAttribution {
  cause: DeletionCause
  mergeSha?: string
  mergeSubject?: string
  unknownReason?: UnknownDeletionReason
}
```

`ursa-major/src/deletion.ts`, the attributor and its new options:

```ts
export interface DeletionAttributor {
  (filePath: string, spanText: string): DeletionAttribution
}

export interface DeletionAttributorOptions {
  unreadableMerges?: string[]
}

export function gitDeletionAttributor(
  projectPath: string,
  merges: MergeEvent[],
  opts: DeletionAttributorOptions = {},
): DeletionAttributor
```

`ursa-major/src/episodes.ts`, the field that carries the untestable
boundary to the attributor:

```ts
export interface Episode {
  // ...
  interveningMerges: MergeEvent[]
  unreadableMerges?: string[]
}
```

`ursa-major/src/types.ts`, the statistic that is the commercial point:

```ts
generated: {
  totalChars: number
  survivedChars: number
  deletedChars: number
  deletedPct: number
  humanDeletedChars: number
  humanDeletedPct: number
  mergeDeletedChars: number
  unknownDeletedChars: number
}
```

The invariant those five numbers hold, pinned by a test rather than only
asserted here:

```
humanDeletedChars + mergeDeletedChars + unknownDeletedChars === deletedChars
```

## 4. The decision procedure, exactly as it runs

For one deleted span, for each `MergeEvent` whose `paths` include the
span's file, in the order the walker found them:

| What the reads say | Label | Reason code |
|---|---|---|
| the merge's result still contains the text | not this merge, keep walking | — |
| the merge has no parents recorded at all | hold a hole, keep walking | `unreadable_merge_parents` |
| a parent contains the text, and the merge's result is unreadable | hold a hole, keep walking | `unreadable_merge_result` |
| a parent contains the text, and the merge's result does not | **`merge`**, returned at once | — |
| no parent contains the text, and some parent is unreadable | hold a hole, keep walking | `unreadable_merge_parents` |
| no parent contains the text, and every parent was readable | the text was already gone before this merge, keep walking | — |

After the walk: if a hole was held, it is returned as
`cause: 'unknown'`. Otherwise, if the episode carries any
`unreadableMerges` sha, the span is `unknown` with
`unreadable_merge_commit`. Otherwise `human_edit`.

Two properties of that order are deliberate and each has a test.

**A proven cause always beats a missing one.** The walk does not stop at
the first hole. A later merge that can be *shown* to have destroyed the
text returns `merge`, because `merge` is a fact and `unknown` is only
the absence of one. Test: `a proven merge beats a hole found earlier in
the walk`.

**`unknown` appears only when something could not be read.** An episode
with no merges and nothing unreadable still reports `human_edit` for
every deleted span, and `unknownDeletedChars` is `0`. The hedge is not a
blanket. Test: `the defect, pinned: the same episode read as before
charges it all to the person`.

## 5. On-disk layout, with a real payload

Unchanged paths. One new key inside an existing object, and one new
object on deleted spans.

```
<project>/.ursa/
  episodes.json                 Episode[], now with unreadableMerges?: string[]
  records/<task-id>.json        OutcomeRecord, schemaVersion 0.1.0
  records/<task-id>.html        the viewer, self-contained
```

A real record from this run's own repository, produced by
`npx tsx src/adapters/cli.ts run --pr 13 --repo alexandrapaiz/Ursa --project ..`
against a readable clone. The new key is the last one, and `0` here is a
computed answer rather than a default:

```json
{
  "schemaVersion": "0.1.0",
  "task": { "id": "ursa-pr13-57a750a", "finished": true, "generatedAt": "2026-09-30T03:52:22Z" },
  "stats": {
    "generated": {
      "totalChars": 13356,
      "survivedChars": 13168,
      "deletedChars": 188,
      "deletedPct": 0.014,
      "humanDeletedChars": 188,
      "humanDeletedPct": 0.014,
      "mergeDeletedChars": 0,
      "unknownDeletedChars": 0
    }
  }
}
```

And the payload that is the point of the change: the same span of
generated text, in an episode whose boundary carries one merge sha the
clone cannot read. Generated by running the fixture in
`ursa-major/src/deletion.test.ts` with `unreadableMerges` set, and
reproduced by the exact command in §6. The merge sha shown is a real
40-hex object id truncated to the seven characters git itself
abbreviates to:

```json
{
  "span": {
    "start": 106,
    "end": 148,
    "text": "const why = item.why ?? \"no stated reason\"",
    "fate": "generated_deleted",
    "deletion": {
      "cause": "unknown",
      "unknownReason": "unreadable_merge_commit",
      "mergeSha": "9f3c1d7"
    }
  },
  "stats": {
    "totalChars": 254,
    "survivedChars": 210,
    "deletedChars": 44,
    "deletedPct": 0.173,
    "humanDeletedChars": 0,
    "humanDeletedPct": 0,
    "mergeDeletedChars": 0,
    "unknownDeletedChars": 44
  }
}
```

Read the two stats blocks against each other. `deletedPct` is `0.173` in
both readings of this episode, because the gross figure is a fact about
the text and does not depend on what the clone can see. `humanDeletedPct`
goes from `0.173` to `0`, because it is a claim about a person and this
clone cannot support it. That difference is the entire deliverable.

## 6. Exact commands

Every one of these was run on this branch, in this order.

```bash
# dependencies, from the package root
cd ursa-major && npm ci

# the gate that would have caught the union's type errors (from #69)
cd ursa-major && npx tsc --noEmit

# the whole suite
cd ursa-major && npx vitest run

# only this change's own tests
cd ursa-major && npx vitest run src/deletion.test.ts
cd ursa-major && npx vitest run src/adapters/github-pr.test.ts -t 'unreadable'

# the product on a repository with a real human discard and no merges
npx tsx src/bin/ursa.ts run /tmp/smoke --declare satisfied

# the product against three real Ursa pull requests
cd ursa-major && npx tsx src/adapters/cli.ts pairs --pr 13 --repo alexandrapaiz/Ursa --project ..
cd ursa-major && npx tsx src/adapters/cli.ts run  --pr 13 --repo alexandrapaiz/Ursa --project ..
cd ursa-major && npx tsx src/adapters/cli.ts run  --pr 69 --repo alexandrapaiz/Ursa --project ..

# the probe that chose ls-tree over cat-file, reproduced by hand
git -C /tmp/pc config uploadpack.allowFilter true
git clone --filter=blob:none --no-local --no-checkout file:///tmp/pc /tmp/pc-clone
mv /tmp/pc /tmp/pc-moved                      # cut the promisor remote
git -C /tmp/pc-clone show <sha>:f.txt         # fatal: could not fetch ... from promisor remote
git -C /tmp/pc-clone ls-tree <sha> -- f.txt   # 100644 blob <blob-sha>  f.txt
git -C /tmp/pc-clone cat-file -e <sha>^{commit} && echo COMMIT PRESENT

# the ledger contract, and the boundary check this charter requires
node tools/ledger/check.mjs docs/ideas.md
git diff --name-only origin/engineer/2026-10-03-pr-merge-attribution...HEAD \
  | grep -E '^(prompts/|\.github/|docs/sprints/|docs/standards/|skills/|digests/)'

# the dependency floor, from the repository root
node scripts/dep-floor.mjs

# the counterfactual in section 8: #69 resolved once per merge, with that
# merge's parentage withheld from both the API field and the clone
cd ursa-major && npx tsx tools/measure-attribution.ts 69 /home/runner/work/Ursa/Ursa
```

## 7. Tooling

| Tool | Version | Its job here | Why it, over what else was considered |
|---|---|---|---|
| `git` | 2.55.0 | every tree read: `show`, `ls-tree`, `log`, `cat-file` | the data is git history; there is no second source of a commit's trees. `ls-tree` over `cat-file -e <sha>^{commit}` is the live decision of this run, measured in §8. |
| `node` | 22.23.3 | the runtime `ursa run` executes on | already the project's runtime; the change adds no dependency |
| TypeScript `tsc` | 5.9.3 | the only check that sees the widened `DeletionCause` reach every consumer | `vitest` transpiles through esbuild and never typechecks, which is exactly how #69's union shipped four type errors past a green suite. Widening a union type is the change class that breaks silently without it. |
| `vitest` | 5.0.2 | the 331-test suite, including the 13 in `src/deletion.test.ts` | already the project's runner; its `-t` filter is how a single scenario is named in evidence |
| `tsx` | 4.23.15 | runs `src/bin/ursa.ts` and `src/adapters/cli.ts` from source | no build step between a change and running the real product |
| `gh` | 2.101.0 | `capturePullRequest` shells out to it for the pull-request snapshots in §8 | the API gives commit parentage the clone may not have, which is the whole reason `unreadable_merge_commit` exists |

No new dependency, no new service, no cost. The repository's steady
state stays $0.

## 8. What the measurements say

**The probe choice, decided by measurement rather than by reasoning.**
The first implementation of `blobLookup` discriminated with
`git cat-file -e <sha>^{commit}`: commit present means the path is
genuinely absent. A real `--filter=blob:none` clone with its promisor
cut was built to check that claim, and it is false. The commit and every
tree are present; only the blob is remote. `cat-file -e` reports
`COMMIT PRESENT`, which would have made an unreadable blob into a
definite "the text is not in this tree" and charged the span to the
person a third time, in a third shape. `git ls-tree <sha> -- <path>`
prints `100644 blob <blob-sha>  f.txt` for the same path, so it reads
unreadable. Pinned by the test `a partial clone whose blobs are
unreachable is unknown, not absent`.

**On the one fixture built for it**, an episode whose boundary carries a
single unreadable merge sha:

| `stats.generated` | Before | After |
|---|---|---|
| `deletedChars`, absent from the final text | 44 | 44 |
| `humanDeletedChars`, the person's discard | **44** | **0** |
| `humanDeletedPct`, the stated discard rate | **0.173** | **0** |
| `unknownDeletedChars`, gone with no readable cause | — | **44** |

**On the real corpus, the answer is zero, and zero is correct.** Two
real Ursa pull requests resolved against a readable clone:

| Pull request | Records | `deletedChars` | human | merge | unknown |
|---|---|---|---|---|---|
| alexandrapaiz/Ursa#13 | 1 | 188 | 188 | 0 | **0** |
| alexandrapaiz/Ursa#69 | 40 | 152,216 | 150,631 | 1,585 | **0** |

#69 is the strong case: 111 commits, 21 of them merges, and every merge
object is in this clone because the capture fetches the pull request's
own ref. So nothing is unreadable, nothing is hedged, and the 1,585
chars PR #71 moved out of the discard column stay there. A corpus that
reported a non-zero `unknown` on a complete clone would mean this change
hedges where it should not.

**The counterfactual on #69, measured rather than argued.** The
question a reader should ask about a change like this is how much it
moves on real data, not on a fixture. So #69 was resolved 22 times: once
against the complete clone, then once for each of its 21 merges with
that merge's parentage withheld from *both* sources the adapter reads —
the API's `parents` field and the clone's own objects — which is exactly
what a fork's pull request or a `fetch-depth: 1` checkout produces for
that one commit. Nothing else changed between runs. Script:
`ursa-major/tools/measure-attribution.ts`, shipped on this branch and
reproduced by the command block in §6.

| Merge withheld | human | merge | unknown | share of gross moved out of the discard column |
|---|---|---|---|---|
| none (complete clone) | 150,631 | 1,585 | 0 | — |
| `4f9a7b0b8` | 51,794 | 1,585 | **98,726** | **64.9%** |
| `739aedf86` | 122,814 | 881 | 28,521 | 18.7% |
| `4ac361b88` | 122,814 | 1,585 | 27,813 | 18.3% |
| `cb2b80c21` | 130,972 | 937 | 20,307 | 13.3% |
| `169a60601` | 126,728 | 1,585 | 14,871 | 10.4% |
| `b4973492a` | 146,387 | 1,585 | 4,092 | 2.7% |
| `fba33d8fc` | 150,351 | 1,957 | 753 | 0.5% |
| `cbef406da` | 150,429 | 1,352 | 435 | 0.3% |
| `e83881437` | 150,429 | 1,585 | 202 | 0.1% |
| `12e9a621b`, `04b431d80` | 150,558 | 1,585 | 73 each | under 0.1% |
| `670d246de` | 150,630 | 1,585 | 1 | under 0.1% |
| the other 9 merges | 150,631 or near | 1,585 | 0 | none |

**Twelve of #69's twenty-one merges, when unreadable, change what this
record claims about a person**, and one of them changes it by 98,726
characters. Every one of those characters was reported before this
change as text the owner read and discarded. The largest row is the
union's own first merge, which touches the file with the most generated
text in the pull request, so the number is large for a structural reason
rather than by luck: the merges that matter most to attribution are the
ones that touch the most generated text, and those are exactly the ones
whose absence costs the most.

Two honesty notes on that table. `gross` is not constant across rows —
it moves between 143,184 and 153,061 — because withholding a merge's
parentage also changes which commits the adapter can treat as closures,
so a few pair boundaries shift and two rows resolve 38 or 39 records
instead of 40. And the complete-clone row is the one that ships: on a
clone with every object, this change moves nothing at all.

**The shape that produces a non-zero figure in production is the one no
local fixture can fake honestly**: a fork's pull request, or a CI
checkout at `fetch-depth: 1`, where the GitHub API names a merge whose
object was never fetched. That is `unreadable_merge_commit`, and it is
covered end to end by `and that name reaches the episode, so the
deletion is unknown rather than the person's` in
`ursa-major/src/adapters/github-pr.test.ts`, which asserts
`humanDeletedChars === 0` on exactly that episode.

## 9. What this change does not do

- **It does not reach the chat-trace path.** `resolve`'s own default
  when no attributor is injected is still
  `() => ({ cause: 'human_edit' })`, and for a chat trace that is right:
  there is no git history, so no merge can be the cause. Stated here so
  the default is read as a decision rather than as an oversight.
- **It does not give `unknown` a surface in the viewer's distribution
  bar.** The bar is over `SpanClass`, which has not changed;
  `generated_deleted` is still one bucket. `unknown` appears as a third
  line on the deletion tile and in `renderRunSummary`, both only when
  the figure is non-zero.
- **It does not resolve an unknown by fetching.** The CLI prints the
  `git fetch` that would, and the user runs it. Reaching the network
  from inside attribution would make a label depend on whether a remote
  answered, which is a worse property than reporting what this clone can
  see.
- **It does not change `no_generation_provenance`**, the category
  CLAUDE.md §1 calls the most valuable. That class is about text with no
  generation behind it, which is a different question from what
  destroyed text that had one.
