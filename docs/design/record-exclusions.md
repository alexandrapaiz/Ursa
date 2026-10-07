# The record never said a file was left out

**What this is.** The design and the measurement behind `exclusions` on
`OutcomeRecord`: the record's own statement of which paths an episode
touched, which of them the run refused to classify, and on what
evidence. Written against the engineering-artifact standard in
`prompts/engineer-agent.md`, so every node named below is a real file
or process, every signature is the one a caller writes against, and
every command is literal.

**The ledger entry it closes.** `docs/ideas.md`, 2026-10-06, "The
record never says a file was left out, only the summary does", which is
the second instance of the 2026-10-03 entry "What a run excluded from
history belongs in the record, not in a comment".

---

## 1. The defect, measured

`src/vendored.ts` shipped on 2026-10-06 (PR #119,
`docs/design/vendored-paths.md`). It proves per path that the finished
blob at an episode's final commit is byte-identical to a blob held by a
commit outside the generation's line of descent, which means no
character of that file was composed in the episode, which means no span
of it is anyone's correction. `resolveEpisode` in `src/bin/ursa.ts`
then drops the path before the resolver sees it. That refusal is
correct and it moved a figure Ursa Minor sells: on a clone of this
repository, `survived_verbatim` fell from 93,420 characters to 71,764,
and the 21,656 that left were the whole of `docs/market/landscape.md`.

Where the refusal was written down, before this change:

| destination | written by | who reads it |
|---|---|---|
| `.ursa/episodes.json`, field `vendoredPaths` | `saveEpisodes` in `src/store.ts` | the next `ursa run`, to avoid recomputing the git calls |
| standard output, the paragraph beginning "came in whole from elsewhere" | `renderRunSummary` in `src/bin/ursa.ts` | whoever was watching the terminal at the time |
| `.ursa/records/<id>.json` | `saveRecord` in `src/store.ts` | **a lab, under a licensing contract** |

The third row was empty. So the one thing a buyer should be able to
audit, which is what the run declined to claim and on what evidence,
reached only the one place nobody kept. Worse than silence in one
case: the probe episode `ursa-probe-2026-09-30-124d880` had
`docs/market/landscape.md` as its only resolvable path, so it resolved
to nothing, and `.ursa/records/` simply had no file for it. An absent
record is indistinguishable from a run that found no work there.

## 2. System diagram, node by node

Every node is a file or a function in `ursa-major/src`, named as the
code names it. Every edge carries a named type or a file format.

```
  git object database                     (the clone under <projectPath>/.git)
        │
        │  CommitInfo[]  — sha, parents, subject, author, date
        ▼
  listCommits()  in src/pairfinder.ts
        │
        │  CommitInfo[]
        ▼
  findCommitPairs()  in src/pairfinder.ts
        │
        │  CommitPair[]  — generatedSha, finalSha, overlapping paths
        ▼
  buildEpisodes()  in src/episodes.ts
        │
        │  Episode  — id, touchedFiles, generatedSha, finalSha, agentMarker
        ▼
  resolvablePaths()  in src/bin/ursa.ts
        │
        │  string[]  — the subset of Episode.touchedFiles whose extension is
        │              in TEXT_EXTS and whose basename is not in SKIP_FILES
        ▼
  vendoredPaths()  in src/vendored.ts  ──── git rev-parse <sha>:<path> ───▶ git object database
        │                               ◀── blob object id, 40 hex chars ──
        │  VendoredPath[]  — path, sha, subject, relation
        │
        ├────────────────────────────────┐
        │                                │  VendoredPath[]
        │                                ▼
        │                        saveEpisodes()  in src/store.ts
        │                                │
        │                                │  JSON array of Episode, each carrying vendoredPaths
        │                                ▼
        │                        <projectPath>/.ursa/episodes.json
        │
        │  VendoredPath[]
        ▼
  resolveEpisode()  in src/bin/ursa.ts        ◀── THE NEW EDGE IS HERE
        │
        │  Exclusion[]  — path, reason, sha, subject, relation, chars
        │                 (chars read by blobAt() in src/pairfinder.ts at
        │                  Episode.finalSha, in JS string length)
        ▼
  resolve()  in src/resolve.ts                (pure; carries the field, does not compute it)
        │
        │  OutcomeRecord  — with exclusions?: Exclusion[]
        │
        ├──────────────────┬──────────────────────────┬──────────────────────┐
        ▼                  ▼                          ▼                      ▼
  saveRecord()        checkRecord()              measure()            renderRunSummary()
  in src/store.ts     in src/invariants.ts       in src/invariants.ts  in src/bin/ursa.ts
        │                  │                          │                      │
        │ JSON             │ Violation[]              │ Measurement          │ string
        │ OutcomeRecord    │ code                     │ excludedPaths,       │ the paragraph
        ▼                  │ EXCLUSION_NOT_           │ excludedChars,       │ beginning "came in
  <projectPath>/           │ CLASSIFIED               │ consideredChars      │ whole from
  .ursa/records/           ▼                          ▼                      │ elsewhere"
  <id>.json          process exit code 1        runGate() in                 ▼
                      in src/bin/ursa.ts        src/invariants.cli.ts    standard output
                                                      │
                                                      │ string[] — one line per record
                                                      ▼
                                                 standard output
```

**The one new edge, stated plainly.** `resolveEpisode` already held
`VendoredPath[]`; it used it only to build a `Set` of paths to skip.
The change is that it now also maps it to `Exclusion[]` and passes that
to `resolve()`, which carries it onto the record unchanged. No new git
call is added: `blobAt(projectPath, ep.finalSha, path)` for the
character count reads a blob that `vendoredPaths` has already proven is
there.

**Why `resolve()` only carries it.** Deciding which paths are imports
needs git, and `resolve()` is a pure function of its input so that it
can also serve pasted conversations with no repository behind them.
`exclusions` therefore arrives the same way `attributeDeletion` and
`corroborate` do: computed at the edge, injected by the caller.

## 3. Interfaces, as the signatures a caller writes against

In `src/types.ts`:

```ts
export type ExclusionReason = 'imported_whole'

export interface Exclusion {
  path: string
  reason: ExclusionReason
  sha: string
  subject: string
  relation: 'pre_existing' | 'sibling'
  chars: number
}

export interface OutcomeRecord {
  // ... unchanged fields ...
  durability?: Durability
  exclusions?: Exclusion[]
}
```

In `src/resolve.ts`:

```ts
export interface ResolveInput {
  // ... unchanged fields ...
  attributeDeletion?: (filePath: string, spanText: string) => DeletionAttribution
  corroborate?: (filePath: string, spanText: string) => DescentEvidence
  exclusions?: Exclusion[]
}

export function resolve(input: ResolveInput): OutcomeRecord
```

In `src/invariants.ts`:

```ts
export type InvariantCode =
  // ... the twelve existing codes ...
  | 'EXCLUSION_NOT_CLASSIFIED'

export interface Measurement {
  // ... the existing fields ...
  excludedPaths: number
  excludedChars: number
  consideredChars: number
}

export function checkRecord(record: OutcomeRecord): Violation[]
export function measure(record: OutcomeRecord): Measurement
```

Unchanged, and named here because the new code calls them:

```ts
// src/vendored.ts
export function vendoredPaths(
  projectPath: string,
  ep: { generatedSha: string; finalSha: string },
  paths: string[],
  commits: CommitInfo[],
): VendoredPath[]

// src/pairfinder.ts
export function blobAt(repoPath: string, sha: string, path: string): string | null

// src/bin/ursa.ts
export function resolveEpisode(
  projectPath: string,
  ep: Episode,
  commits?: CommitInfo[],
): OutcomeRecord | null
```

### 3.1 The three states of the field, which are three different claims

| field | the claim | when |
|---|---|---|
| key absent | the question was never asked, because this capture path cannot ask it | every record from `src/cli.ts`, the chat path: there is no repository to compare blobs in |
| `[]` | the question was asked of every resolvable path and no path was an import | the common `ursa run` record |
| one or more entries | these paths came in whole from elsewhere and carry none of the person's corrections | the probe's `ursa-probe-2026-09-30-124d880` |

The distinction is load-bearing and is why `resolve()` spreads the
field in rather than assigning it: `{ ...(input.exclusions ? {
exclusions: input.exclusions } : {}) }` leaves the key off entirely for
a caller that did not ask, where `exclusions: undefined` would be
dropped by `JSON.stringify` on the way to disk and restored as "asked,
found nothing" by any reader that checks for an empty array.

## 4. The two consequences, and the one that is arithmetic

### 4.1 `EXCLUSION_NOT_CLASSIFIED`, the thirteenth bound

Stated in `BOUNDS` in `src/invariants.ts`, and quoted here in full
because it is the reason the field is checkable rather than decorative:

> No path the record excludes appears among its classified files, and
> every exclusion names a commit and a positive character count. The
> first clause is the same-set arithmetic this module exists for:
> `exclusions` and `files` partition the paths the run was willing to
> read, so a path in both means the refusal was computed and then not
> applied, and the record simultaneously claims the file is an import
> and sells labels over its spans. The second catches an exclusion that
> cannot be reconciled against the figures it moved — `stats.finalChars`
> plus the excluded characters is the size of every path the run read,
> and an entry with no number or no commit breaks that sum silently.

This is the file-level twin of `DESCENT_CHECKED_UNIFORMLY`'s second
clause. That clause catches a span-level demotion computed and not
applied to the span. This one catches a file-level refusal computed and
not applied to the file. Both failures produce the same artifact: a
record that names its own counter-evidence and sells the claim anyway,
which is the one defect a buyer could catch before we do.

### 4.2 The reconciliation, and the 216 characters it found

`measure()` reports three numbers rather than one, because an excluded
count on its own is unfalsifiable:

```
excludedChars    = sum of exclusions[].chars
consideredChars  = stats.finalChars + excludedChars
```

`consideredChars` is the size of every path the run was willing to
read, classified and refused together. A reader who re-measures the
files can check it; a count with nothing to add back up to cannot be
checked at all.

**The ledger entry predicted the wrong number, and the difference is
the finding.** It asked for confirmation that the excluded count equals
"the 21,656 + 8,415 that left the probe's figures", so 30,071. Measured
on the probe, `excludedChars` is **30,287**. The 216-character gap is
exact and it is not an error in either direction:

| quantity | value | what it is |
|---|---|---|
| `survived_verbatim` chars of `docs/market/landscape.md`, pre-refusal | 21,656 | characters the record claimed the person kept unchanged |
| `no_generation_provenance` chars of the same file, pre-refusal | 8,415 | characters present in the finished file that the record traced to no generation |
| sum of the file's class figures | 30,071 | the ledger's prediction, which is `stats.coveredChars` |
| `finalSeparatorChars` for that file | 216 | characters of the file inside no span at all, so in no class and in no percentage even before the refusal |
| the file's length at `Episode.finalSha`, in JS string length | **30,287** | `stats.finalChars`, and what `exclusions[0].chars` reports |

So 30,071 is the characters that left the *class* figures, and 30,287
is the characters that left the *record*. `chars` is defined as the
second, because `consideredChars = finalChars + excludedChars` is a sum
that closes and `coveredChars + excludedChars` is a sum that does not.
Measured both ways in §6.2 below. The 216 characters are the same
quantity `measure()` already reports as `finalSeparatorChars` for every
classified record, so the definition chosen here is the one consistent
with a figure the module has carried since 2026-10-04.

### 4.3 An episode that resolved to nothing now says why

`resolveEpisode` returned `null` when no file survived to be
classified. It still does, with one exception: when the only reason
there is nothing to classify is that every resolvable path was proven
to be an import, it returns a record with `files: []`,
`generations: []`, and the exclusions that explain both.

```ts
if (files.length === 0 || generations.length === 0) {
  if (exclusions.length === 0) return null
  return resolve({ /* taskId, empty files/conversations/generations, exclusions, ... */ })
}
```

Only when there is evidence. An episode that resolved to nothing for
any other reason — an unreadable blob, a file over `MAX_BLOB_CHARS`, a
path with no generation side — still returns `null`, because a record
saying nothing for no stated reason is worse than the absence it
replaces.

One more line had to change for the record to survive to disk. In
`main` in `src/bin/ursa.ts`:

```ts
if (!record) continue
if (record.stats.generated.totalChars < minChars && (record.exclusions?.length ?? 0) === 0) continue
```

`--min-chars` (default 200) filters out an episode too small to carry
signal, and it is measured on the generation side, which a
refusal-only record has none of. Without the second clause the record
written to explain an import would be dropped by a threshold aimed at
something else, and the absence would be back.

## 5. On-disk layout, with a real payload

### 5.1 `.ursa/records/<id>.json`

Path: `<projectPath>/.ursa/records/<Episode.id>.json`. Format: one
JSON object per record, `OutcomeRecord`, written by `saveRecord` in
`src/store.ts`.

This is the whole of `/tmp/ursa-probe/.ursa/records/ursa-probe-2026-09-30-124d880.json`
as produced by the run in §6, verbatim. It is the record that did not
exist before this change. Nothing is elided and nothing is a
placeholder: both shas are public commits on this repository,
`/tmp/ursa-probe` is a scratch directory rather than anyone's home
directory, and a record carries no session or conversation identifier
on the git path, so the redaction rider in `prompts/engineer-agent.md`
is satisfied by the real payload rather than by rewriting it.

```json
{
  "schemaVersion": "0.1.0",
  "task": {
    "id": "ursa-probe-2026-09-30-124d880",
    "finished": true,
    "generatedAt": "2026-10-05T03:21:22Z"
  },
  "artifact": { "kind": "repo" },
  "files": [],
  "conversations": [],
  "generations": [],
  "stats": {
    "finalChars": 0,
    "coveredChars": 0,
    "byClass": {
      "survived_verbatim": { "spans": 0, "chars": 0, "pct": 0 },
      "survived_mutated": { "spans": 0, "chars": 0, "pct": 0 },
      "no_generation_provenance": { "spans": 0, "chars": 0, "pct": 0 }
    },
    "uncertainSpans": 0,
    "trivialSpans": 0,
    "byModel": {},
    "generated": {
      "totalChars": 0,
      "charsWritten": 0,
      "separatorChars": 0,
      "verbatimClaimedChars": 0,
      "survivedChars": 0,
      "deletedChars": 0,
      "deletedPct": 0,
      "humanDeletedChars": 0,
      "humanDeletedPct": 0,
      "mergeDeletedChars": 0,
      "unknownDeletedChars": 0
    },
    "perFile": [],
    "perConversation": []
  },
  "exclusions": [
    {
      "path": "docs/market/landscape.md",
      "reason": "imported_whole",
      "sha": "96ed4e5",
      "subject": "market: rebase #89's landscape, positioning, and ledger content onto main",
      "relation": "sibling",
      "chars": 30287
    }
  ]
}
```

Read it as a sentence. This episode touched one file. That file is
byte-for-byte the copy held by commit `96ed4e5`, which is on a branch
the generation never contained. Its 30,287 characters are therefore in
no class and in no percentage, and they are 30,287 characters that a
reader can add back to check the arithmetic. Nothing here is a claim
about the person's corrections, which is correct, because the episode
contains none.

The other five records of the same run carry `"exclusions": []`, which
is the asked-and-found-nothing answer and is a different claim from the
key being absent (§3.1).

### 5.2 `.ursa/episodes.json`

Unchanged by this work. `vendoredPaths` continues to be written there
by `saveEpisodes`, as the real payload in
`docs/design/vendored-paths.md` §5.1 shows, and continues to be the
cache that keeps the next run from recomputing the git calls. The
difference is that it is no longer the only place the refusal is
recorded.

## 6. Exact commands, and the numbers they produced

`~/src/Ursa` stands for this repository's checkout, per the redaction
rider in `prompts/engineer-agent.md`. Every other string is literal.

### 6.1 Build the probe

`--no-local` forces a real object transfer rather than a hardlink
farm, and the `gh` remote is what brings in the sibling branches the
whole check depends on seeing:

```sh
rm -rf /tmp/ursa-probe
git clone --no-local ~/src/Ursa /tmp/ursa-probe
git -C /tmp/ursa-probe remote add gh https://github.com/alexandrapaiz/Ursa.git
git -C /tmp/ursa-probe fetch --no-tags gh '+refs/heads/*:refs/remotes/gh/*'
git -C /tmp/ursa-probe for-each-ref --format='%(refname)' | wc -l   # 108
git -C /tmp/ursa-probe rev-list --all --count                        # 493
```

108 refs and 493 commits, against 105 and 479 when
`docs/design/vendored-paths.md` §6 took the same measurement on
2026-10-06. Two days of merges, and the episode this document is about
is unchanged by them: same id, same `generatedSha` `124d880`, same
`finalSha` `9452bfd`.

### 6.2 Run before and after

The "before" tree is a detached worktree at `origin/main`, with
`node_modules` symlinked in so the two runs use one install:

```sh
cd ~/src/Ursa
git worktree add --detach /tmp/ursa-before origin/main
ln -sfn "$PWD/ursa-major/node_modules" /tmp/ursa-before/ursa-major/node_modules

cd /tmp/ursa-before/ursa-major
rm -rf /tmp/ursa-probe/.ursa && npx tsx src/bin/ursa.ts run /tmp/ursa-probe --limit 40
npx tsx src/invariants.cli.ts /tmp/ursa-probe/.ursa/records --quiet

cd ~/src/Ursa/ursa-major
rm -rf /tmp/ursa-probe/.ursa && npx tsx src/bin/ursa.ts run /tmp/ursa-probe --limit 40
npx tsx src/invariants.cli.ts /tmp/ursa-probe/.ursa/records
```

The first line of each run, verbatim:

```
origin/main:  6 work units found, 5 resolved into records.
this branch:  6 work units found, 6 resolved into records.
```

Every figure below that line is identical in the two runs: `71,764
chars survived your editing verbatim, 1,608 survived edited`, `79,485
chars were generated to get there`, `You discarded 3,447 chars of
draft on the way, 5% of the 75,898 whose fate this run could trace`.
That is the point of the change and the main evidence for it. It adds
the explanation of a refusal and moves no number the refusal already
made.

The gate, both runs:

```
origin/main:  5 records checked, 0 violations.
this branch:  6 records checked, 0 violations.
```

And the new line the gate prints for the record in §5.1:

```
/tmp/ursa-probe/.ursa/records/ursa-probe-2026-09-30-124d880.json
  exclusions: 1 path came in whole from elsewhere and was not classified, taking 30,287 chars out of the 30,287 this run read
  OK — every stated bound holds
```

### 6.3 Reconcile the 30,287 against the figures it replaced

The pre-refusal record for that one episode is reconstructible, because
`resolveEpisode` takes the refusal from the episode: passing
`vendoredPaths: []` means "asked, found nothing", which is what the
resolver did before 2026-10-06. Written to `/tmp/count.ts` and run with
`tsx`, importing `resolveEpisode` and `measure` by absolute path:

```sh
cd ~/src/Ursa/ursa-major && npx tsx /tmp/count.ts
```

Output, verbatim:

```
BEFORE (vendoredPaths: [] — the pre-2026-10-06 resolver)
  file length (JS chars)  30287
  coveredChars            30071
  finalChars              30287
  survived_verbatim         21656
  survived_mutated          0
  no_generation_provenance  8415
  finalSeparatorChars     216
  sum of class chars      30071
AFTER (the record this run writes)
  files                   0
  excludedChars           30287
  consideredChars         30287
DELTA  excludedChars - sum of class chars = 216
```

21,656 and 8,415 are exactly the ledger's two numbers, so the entry
identified the right file and the right figures. 30,071 is their sum
and is `coveredChars`. The 216-character remainder is
`finalSeparatorChars`, and §4.2 is why `chars` reports 30,287 rather
than 30,071.

### 6.4 Run the suite, and prove the new bound is load-bearing

```sh
cd ~/src/Ursa/ursa-major && npm test     # tsc --noEmit && vitest run
# Test Files  25 passed | 1 skipped (26)
#      Tests  429 passed | 4 skipped (433)
```

422 before this change, 429 after: seven new cases, four of them on
the bound and three on the field. The bound was then deleted from
`checkRecord` and the suite re-run, to show the cases fail without it:

```sh
npx vitest run src/invariants.test.ts
# src/invariants.test.ts (57 tests | 3 failed)
# AssertionError: expected [] to include 'EXCLUSION_NOT_CLASSIFIED'
```

Three of the four, because the fourth asserts the bound stays silent
on a well-formed record and passes vacuously with no bound at all.
That is the correct shape for a pair of tests over a gate, and it is
why the deletion run is reported rather than the pass count alone.

## 7. Tooling

| tool | version | its job here | why it, over what was considered |
|---|---|---|---|
| `git` | 2.55.0 | `rev-parse <sha>:<path>` for the blob object ids `src/vendored.ts` compares, `log` for the commit graph, `cat-file` behind `blobAt` for the character count | the evidence is git's own content addressing. A library reimplementation of blob hashing would be a second implementation of the thing being trusted |
| Node.js | v22.23.3 | the runtime for `ursa run`, the gate CLI and the suite | already the project's runtime; `execFileSync` with an argument array is how every git call in `src/pairfinder.ts` and `src/vendored.ts` is spelled, which keeps a path with a space in it from becoming a shell word |
| TypeScript | 5.9.3 (`^5.7.2` in `ursa-major/package.json`) | `tsc --noEmit` is the first half of `npm test`, and it is what makes `exclusions?: Exclusion[]` a compile error at every mis-shaped call site rather than a runtime surprise | the three-state field in §3.1 is expressible as an optional property and is checked statically; a runtime schema validator would catch the same mistakes later and only on the paths a test exercises |
| `tsx` | 4.23.15 (`^4.19.2` in `ursa-major/package.json`) | runs `src/bin/ursa.ts`, `src/invariants.cli.ts` and the throwaway `/tmp/count.ts` straight from TypeScript | a build step before every probe would add a stale-artifact failure mode to a measurement whose whole point is to be re-runnable. Same rationale as `docs/design/vendored-paths.md` §7 |
| `vitest` | 5.0.2 | the 433-case suite, including the seven new ones, and the deletion run in §6.4 | already the project's runner; `npx vitest run src/invariants.test.ts` scopes to one file, which is what makes the bound-deleted proof a ten-second check |
| `npm` | 10.9.9 | `npm test`, which is `tsc --noEmit && vitest run` | the lockfile is committed, so one `npm install` reproduces the versions above exactly |
| `diff` (npm package) | 8.0.4 | not called by this change, named because it is what produces the word-level `diff` on a `survived_mutated` span, and an excluded path is precisely a path no such diff is computed for | — |

## 8. Terms used above

- **episode** — one agent commit paired with the later human commit
  that finished the same paths, built by `buildEpisodes` in
  `src/episodes.ts`. The unit a record is made from.
- **resolvable path** — a path in `Episode.touchedFiles` whose
  extension is in `TEXT_EXTS` and whose basename is not in
  `SKIP_FILES`, both in `src/bin/ursa.ts`. The paths `ursa run` would
  read at all, so the only ones an exclusion can be about.
- **generation**, on the `ursa run` path — the whole file blob at the
  episode's `generatedSha`, treated as what the model produced.
- **import**, or **vendored path** — a resolvable path whose finished
  blob is byte-identical to a blob held by a commit that is neither the
  generation nor a descendant of it. Proven by object id comparison in
  `src/vendored.ts`; see that file's header for exactly what an equal
  object id does and does not establish.
- **`pre_existing`** — the matching commit is an ancestor of the
  generation, so the episode's net effect on the file was nothing.
- **`sibling`** — the matching commit is neither ancestor nor
  descendant, so the content came off another branch the person merged
  or checked out rather than typed.
- **`coveredChars`** — characters of the finished work inside some
  span, so in some class and in some percentage. A field of `Stats` in
  `src/types.ts`.
- **`finalChars`** — characters of the finished work, span or no span.
  Also a field of `Stats`.
- **`finalSeparatorChars`** — `finalChars - coveredChars`, reported by
  `measure()` in `src/invariants.ts`. The 216 characters of §4.2.
- **the probe** — a clone of this repository with every remote branch
  fetched, used as real input to `ursa run`. The commands are in §6.1.
- **the gate** — `checkRecord` in `src/invariants.ts`, run over every
  record at the end of every `ursa run` and standalone through
  `src/invariants.cli.ts`. Its failure is a non-zero exit code.

## 9. What this does not do

- **The generation side of an excluded path is still dropped.** When a
  file is `pre_existing` and the person reverted the agent's work
  outright, the true record is "the agent wrote X, the person threw all
  of X away", which is real discard signal. `resolveEpisode` skips the
  path entirely, so that generation never reaches `resolve()` and the
  `generated_deleted` story is lost with the false `survived_*` labels.
  Filed as its own ledger entry (`docs/ideas.md`, 2026-10-06, "An
  imported final file still has a discard story"). This change makes
  the loss visible in the record for the first time, which is a
  precondition for fixing it, and does not fix it.
- **`imported_whole` is the only reason code.** Three other paths
  through `resolveEpisode` drop a file and still carry no exclusion: an
  unreadable blob at either commit, a blob over `MAX_BLOB_CHARS`
  (300,000), and a path with no generation side. Each is a refusal with
  evidence behind it and each would be a reason code. Filed as a ledger
  entry today.
- **The arithmetic is not yet an invariant across the whole run.**
  `consideredChars` closes per record. "The characters this run read
  equals the characters it classified plus the characters it refused,
  summed over every record" is the run-level form, and
  `renderRunSummary` prints no such pair, so there is nothing to bound
  yet.
