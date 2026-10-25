# A rename reads as a death — the durability walk's path bug

Built 2026-10-24 by the engineer seat, across two runs: the fix in PR
#387 (engineer message run 6, refused mid-flight by a provider limit)
and the tests, the bundle rebuild and this document in PR #396
(engineer hook run 7, which inherited the draft).

Written to the engineering-artifact standard in
`prompts/engineer-agent.md`. Every node below is a file that exists,
every signature is copied from `ursa-major/src/lifespan.ts` as it
stands on this branch, and the example payload in §6 is a real record
emitted by a real run, not a sketch. Commit identifiers are truncated
to twelve characters per the standard's redaction rider; the fixture
repositories live in `$TMPDIR`, so no home path appears here.

`ursa-major/src/lifespan.ts` cites this file by name, which is why it
exists as a document and not only as a commit message.

## 1. The defect, and what it cost

The durability walk asks one question per span: after the user closed
the episode, did the work keep this text or throw it away? It answers
by walking the commits from `Episode.finalSha` to `HEAD`, reading the
file at each one, and testing whether the span's text is still in it
(`docs/design/span-lifespan.md` §5).

It read the file at **the path the record names**, at every revision.
That is wrong the moment anyone moves the file, and it is wrong in the
worst available direction.

The mechanism, which is a property of git and not a mistake in the
range syntax:

- `git log <sha>..HEAD -- notes.md` **still returns** the commit that
  renamed `notes.md` away. Without rename detection, git reports a
  rename-away as a deletion of the old path, and a deletion of
  `notes.md` is a commit that touches `notes.md`.
- The walk therefore reached that commit, ran
  `git show <rename sha>:notes.md`, and got a non-zero exit.
- `blobAt` returns `null` on a non-zero exit, and `traceFile` reads
  `null` as "this revision deleted the file", which is a real death for
  every unit in it.

So every unit of every span in a moved file died at the move, with the
text sitting unmodified at the tip under another name.

The old comment on `revisionsAfter` shows the intent was the opposite:

> `--follow` is deliberately NOT used: it would make a rename look like
> continuity of content, and the question here is about the text, not
> about the path it lives at.

The reasoning is sound and the behaviour was its inverse. Refusing to
follow the rename did not make the walk agnostic about the path. It made
the walk assert deletion, which is the strongest possible claim about
the content, on no evidence about the content at all.

### Measured, on a three-commit repository with one `git mv`

The fixture is `repoWithRename()` in
`ursa-major/src/lifespan.test.ts`: an agent writes a paragraph, the
human retitles the file and adds a paragraph of her own (that commit is
`finalSha`), and a third commit runs `git mv notes.md moved.md` with no
content change. Every character is in the tree at `HEAD`.

| Measure | Before the fix | After | Truth |
|---|---|---|---|
| `fate` of the agent's `survived_verbatim` span | `decayed` | `durable` | `durable`. The text is at the tip. |
| `liveAtTip` | `false` | `true` | `true` |
| `unitsTraced` / `unitsSurviving` for the file | 4 / 0 | 4 / 4 | 4 / 4 |
| `survivingChars` / `decayedChars` | 0 / 338 | 338 / 0 | 338 / 0 |
| `Durability.decayRate` | `1` | `0` | `0` |
| `git show HEAD:moved.md` contains the span's text | `true` | `true` | — |

The last row is the whole report. `decayRate` 1 means "every character
of what the user kept was gone by the latest commit", and it was
emitted about a file whose text the same command can print.

### Why this was not a cosmetic bug

`decayRate` is a number Ursa Minor sells. Per `CLAUDE.md` §1 the entire
claim of the artifact is that "the label is supplied by the artifact
rather than by a grader" — nobody judged the output, the work either
used it or did not. A label that flips to `decayed` because a file moved
is a label supplied by neither the artifact nor a grader. It is supplied
by a filesystem operation that says nothing about the generation's
quality, and it teaches a lab training on it that a good generation was
bad.

It also biases in a consistent direction rather than adding noise, which
is worse. Refactors move files, and refactors cluster in exactly the
engineering work this product is aimed at, so the records most likely to
be corrupted are the ones most likely to be interesting.

## 2. System diagram

Nodes are real files and functions in `ursa-major/src/`. Edges carry
named TypeScript types from `ursa-major/src/types.ts` and
`ursa-major/src/lifespan.ts`, or the literal stdout of a named git
command. Nodes marked **new** were added by this change.

```
┌──────────────────────────────────────────────────────────────┐
│ lifespan.ts :: annotateDurability(                           │
│   repoPath, record, closingSha, closedAt, maxRevisions)      │
│ the only entry point; loops over record.files                │
└───────────────┬──────────────────────────────────────────────┘
                │ (repoPath: string, closingSha: string,
                │  path: string = FinalFile.path)
                ▼
┌──────────────────────────────────────────────────────────────┐
│ lifespan.ts :: revisionsAfter(repoPath, sha, path, limit)     │
│ the rename-following loop                                     │
└───┬───────────────┬───────────────────┬──────────────────────┘
    │               │                   │
    │ batch         │ vanishedAt        │ movedTo
    │               │                   │
    ▼               ▼                   ▼
┌─────────────┐ ┌──────────────────┐ ┌────────────────────────┐
│ logOnePath  │ │ firstVanish      │ │ renameTarget           │
│ **new**     │ │ **new**          │ │ **new**                │
│ one git log │ │ first commit     │ │ the path a commit       │
│ over one    │ │ where path stops │ │ renamed path *to*       │
│ path        │ │ existing         │ │                         │
└─────┬───────┘ └────────┬─────────┘ └──────────┬─────────────┘
      │                  │                      │
      │ stdout of        │ stdout of            │ stdout of
      │ `git log         │ `git log --reverse   │ `git diff-tree -r -M
      │  --reverse       │  --diff-filter=D     │  --name-status
      │  --topo-order    │  --pretty=format:%H  │  --no-commit-id -z
      │  --date=iso-     │  <sha>..HEAD -- P`   │  <sha>`
      │  strict          │                      │
      │  --max-count=N   │ → first line = sha,  │ → fields split on NUL:
      │  --pretty=       │   or null            │   R<score> NUL old NUL new
      │  format:%H%x09   │                      │ → new, or null
      │  %aI%x09%an%x09  │                      │
      │  %s <sha>..HEAD  │                      │
      │  -- P`           │                      │
      │                  │                      │
      │ → Omit<FileRevision,'path'>[]            │
      ▼                  ▼                      ▼
┌──────────────────────────────────────────────────────────────┐
│ revisionsAfter returns FileRevision[]                         │
│ each element: { sha, at, author, subject,                     │
│                 path,              // **new** where to read   │
│                 renamedFrom? }     // **new** audit trail     │
└───────────────┬──────────────────────────────────────────────┘
                │ FileRevision[]
                ▼
┌──────────────────────────────────────────────────────────────┐
│ lifespan.ts :: traceFile(                                     │
│   repoPath, path, spans, closedAt, revisions)                 │
│ reads rev.path, NOT the record's path  ← the actual fix       │
└───────────────┬──────────────────────────────────────────────┘
                │ (repoPath, rev.sha, rev.path)
                ▼
┌──────────────────────────────────────────────────────────────┐
│ lifespan.ts :: blobAt(repoPath, sha, path)                    │
│ stdout of `git show <sha>:<path>`; null on non-zero exit      │
└───────────────┬──────────────────────────────────────────────┘
                │ fileNorm: string (via normalize.ts :: normalize)
                │ fileTokens: Set<string> (via match.ts :: tokens)
                ▼
┌──────────────────────────────────────────────────────────────┐
│ lifespan.ts :: spanPresent(spanNorm, fileNorm, fileTokens)    │
│ → Presence = { present: true, basis: 'verbatim' }             │
│            | { present: true, basis: 'token-containment' }    │
│            | { present: false }                               │
│ UNCHANGED by this work. This is why following a rename does    │
│ not assert continuity of content.                              │
└───────────────┬──────────────────────────────────────────────┘
                │ writes SpanLifespan onto each FinalSpan:
                │   fate, liveAtTip, diedAtSha, unitsSurviving,
                │   renamesFollowed?, renamedTo?   // **new**
                ▼
┌──────────────────────────────────────────────────────────────┐
│ types.ts :: Durability (on OutcomeRecord.durability)          │
│ decayRate: number, spanRenameCrossings?: number,              │
│ distinctRenamesFollowed?: number             // **new**       │
│ serialized to record.json by store.ts :: writeRecord          │
└──────────────────────────────────────────────────────────────┘
```

The one edge that carried the bug is the one from `traceFile` to
`blobAt`. It used to carry the record's `path` for every revision. It
now carries `rev.path`, the path that revision's own tree holds the
content at.

## 3. Interfaces at every component boundary

Copied from the source on this branch, not paraphrased.

### The revision record, in `ursa-major/src/lifespan.ts`

```ts
export interface FileRevision {
  sha: string
  at: string
  author: string
  subject: string
  /**
   * The path the traced file occupies **in this revision's tree**, which
   * is not always the path the record calls the file.
   */
  path: string
  /** set only on a revision that renamed the file: the path it moved from */
  renamedFrom?: string
}
```

### The three helpers added, all module-private

```ts
function firstVanish(repoPath: string, sha: string, path: string): string | null
function renameTarget(repoPath: string, sha: string, path: string): string | null
function logOnePath(
  repoPath: string,
  sha: string,
  path: string,
  limit: number,
): Omit<FileRevision, 'path'>[]
```

`logOnePath` returns `Omit<FileRevision, 'path'>[]` rather than
`FileRevision[]` deliberately: it reports what one `git log` over one
path said, and it is not entitled to an opinion about which path the
caller should read that revision at. Only `revisionsAfter`, which knows
whether a rename intervened, can fill `path` in. The `Omit` makes that
a compile error rather than a convention.

### The public functions, whose signatures did not change

```ts
export const MAX_REVISIONS = 50

export function revisionsAfter(
  repoPath: string,
  sha: string,
  path: string,
  limit = MAX_REVISIONS,
): FileRevision[]

export function spanPresent(
  spanNorm: string,
  fileNorm: string,
  fileTokens: Set<string>,
): Presence

export function traceFile(
  repoPath: string,
  path: string,
  spans: FinalSpan[],
  closedAt: string,
  revisions: FileRevision[],
): FinalSpan[]

export function annotateDurability(
  repoPath: string,
  record: OutcomeRecord,
  closingSha: string,
  closedAt: string,
  maxRevisions = MAX_REVISIONS,
): OutcomeRecord
```

Every caller outside this module keeps compiling untouched. That is the
point of resolving the rename inside `revisionsAfter`: the fix is not a
new parameter threaded through five call sites, it is the same call
returning revisions that know where to be read.

### The two new record fields, in `ursa-major/src/types.ts`

```ts
export interface SpanLifespan {
  // ...existing fields...
  /** How many renames the forward walk crossed while tracing this span's file. */
  renamesFollowed?: number
  /** The path this span's file occupied where the walk stopped. */
  renamedTo?: string
}

export interface Durability {
  // ...existing fields...
  /** Renames the walk followed across every file in this record. */
  renamesFollowed?: number
}
```

**Amended 2026-10-24, later the same day.** The record-level field above
shipped under that name for one afternoon. It sums the per-span field,
so it counts span-rename crossings and not renames, which §6 measured
and did not fix. It is now two fields,
`Durability.spanRenameCrossings` for the sum and
`Durability.distinctRenamesFollowed` for the count, specified in
`docs/design/counting-a-rename-once.md` §3.1. `SpanLifespan` is
unchanged by that amendment. No record carrying the old name is
published in this repository.

Both are optional and are **never written as `0`**. Absent means this
walk crossed no rename. A record written before 2026-10-24, when the
walk could not follow a rename at all, is then indistinguishable from
one whose file never moved, which is the honest encoding: the older
record cannot say, and a `0` would be it claiming it could.

## 4. Why `--follow` is still not used

`--follow` is git's own answer to this problem and it is the obvious
thing to reach for. It was rejected for three reasons, each of which is
a property of the flag rather than a preference:

1. **It takes exactly one pathspec**, and it is documented as working
   only with a single path. The walk is per file but the helper is
   reused, and a flag that silently requires a shape is a trap for the
   next caller.
2. **It applies history simplification of its own**, so the commit set
   it returns is not the commit set `<sha>..HEAD -- <path>` returns.
   `docs/design/span-lifespan.md` §5 fixes the walk's cost at
   `MAX_REVISIONS` blob reads, and a flag that changes which commits
   are selected changes that budget in a way that is not local to this
   function.
3. **It leaves no way to tell the caller that a rename happened.**
   `--follow` outputs the rename as a normal commit. There is no field
   on the output saying "the path changed here", so a walk using it
   crosses renames silently, and `CLAUDE.md` §0 constraint 2 says the
   user can always see what has been inferred about them. A durability
   verdict that depended on crossing a rename, with nothing in the
   record saying so, is not inspectable.

Resolving it explicitly costs two extra git calls **per rename**, not
per revision: `firstVanish` is one `git log --diff-filter=D` over the
range, and `renameTarget` runs only on the single commit that log
returns. A file that never moves pays for one `firstVanish` that finds
nothing.

## 5. Exact commands

The literal invocations this code runs, with the real flags.

`logOnePath`, once per path segment of the walk:

```sh
git log --reverse --topo-order --date=iso-strict \
  --max-count=50 \
  --pretty=format:%H%x09%aI%x09%an%x09%s \
  <closingSha>..HEAD -- notes.md
```

`firstVanish`, once per path segment, finding the commit where the path
stops existing. There is deliberately no `--max-count=1`: `--reverse`
is applied *after* selection, so with it git would select the newest
commit and then reverse a one-element list, returning the last vanish
instead of the first.

```sh
git log --reverse --topo-order --diff-filter=D \
  --pretty=format:%H \
  <closingSha>..HEAD -- notes.md
```

`renameTarget`, only on the one commit `firstVanish` returned. The
pathspec is deliberately **absent**: `git diff-tree -M -- notes.md`
filters the rename pair down to one side and prints `D notes.md`, which
is the deletion reading this function exists to refute. So the diff is
taken whole and the `R` line is found by matching its source path.

```sh
git diff-tree -r -M --name-status --no-commit-id -z <vanishSha>
```

`-z` rather than the default output because git quotes and
backslash-escapes a path containing a space, a quote or a non-ASCII byte
when `core.quotePath` is on, and a quoted path would not compare equal
to the record's own. With `-z` the fields arrive raw as
`R<score>\0<old>\0<new>\0`.

`blobAt`, once per revision, now at `rev.path`:

```sh
git show <revSha>:moved.md
```

To reproduce the measurement in §1 and run the guard:

```sh
cd ursa-major
npm ci
npx vitest run src/lifespan.test.ts          # 27 tests, 9 of them renames
npm run bundle:check                          # dist/ursa.cjs is current
npm test                                      # tsc --noEmit && vitest run
```

To see the seven assertions that invert, check out the pre-fix module
over the new test file and run it:

```sh
cd ursa-major
git show main:ursa-major/src/lifespan.ts > src/lifespan.ts
git show main:ursa-major/src/types.ts    > src/types.ts
npx vitest run src/lifespan.test.ts       # 7 failed | 20 passed
git checkout src/lifespan.ts src/types.ts
```

## 6. On-disk layout, with a real payload

Nothing about the record's shape on disk changed. The paths are as
`docs/design/span-lifespan.md` §6 and `ursa-major/src/store.ts` set
them:

```
<project>/.ursa/records/<episode-id>/
├── record.json        # OutcomeRecord, including durability
├── final/<path>       # the finished files, as of finalSha
└── generations/       # the model turns the spans resolve to
```

The payload below is the real output of `annotateDurability` on the
§1 fixture, with the file moved to `docs/notes.md` and commit dates
pinned so the intervals are reproducible. It is copied from the run,
with the span text truncated for width and the two commit identifiers
truncated to twelve characters per the redaction rider.

`record.json` → `files[0].spans[1]`:

```json
{
  "class": "survived_verbatim",
  "text": "The resolver joins each finished file back to the generation...",
  "lifespan": {
    "revisionsChecked": 1,
    "unitsTraced": 2,
    "unitsSurviving": 2,
    "survivingChars": 160,
    "decayedChars": 0,
    "intactRevisions": 1,
    "intactSeconds": 12600,
    "diedAtSha": null,
    "diedAt": null,
    "liveAtTip": true,
    "fate": "durable",
    "basis": "verbatim",
    "skipped": null,
    "renamesFollowed": 1,
    "renamedTo": "docs/notes.md"
  }
}
```

`record.json` → `durability`:

```json
{
  "method": "git-forward-walk",
  "tipSha": "a1f7435831c9",
  "closingSha": "1902a426bb77",
  "testedSpans": 1,
  "durableSpans": 1,
  "erodedSpans": 0,
  "decayedSpans": 0,
  "durableChars": 160,
  "decayedChars": 0,
  "decayRate": 0,
  "baselineDecayRate": 0,
  "medianIntactSeconds": null,
  "maxRevisionsWalked": 50,
  "minTraceableLen": 24,
  "renamesFollowed": 4
}
```

**Amended 2026-10-24, later the same day.** A record emitted after
`docs/design/counting-a-rename-once.md` shipped carries
`"spanRenameCrossings": 4` and `"distinctRenamesFollowed": 1` in place
of that last line. The discrepancy described below is what the
amendment resolves; it is left standing here because it is the
measurement that produced the fix.

Read the two together and note the discrepancy, because it is real and
it is the one thing in this change a reader will trip over. The span
says `renamesFollowed: 1` and the record says `4`, for a repository
containing exactly **one** `git mv`.

Both numbers are what the code intends. `Durability.renamesFollowed`
sums the per-span field over every span, so one file with four spans
that each crossed the same rename contributes four. The rationale in
`annotateDurability` is that it is then "the count a reader of the span
records can reconcile against" — add up the span fields and you get the
record field.

It is still a bad name for that quantity. A reviewer asking "how many
renames did this walk cross" reads `4` and concludes four files moved.
The honest reading of the current field is "span-rename crossings", and
a record-level count of distinct renames is a different number that
nothing currently reports. This was logged as a ledger entry dated
2026-10-24 rather than fixed here, because changing it is a field
rename in a published record shape and that is not a change to make in
the same pull request as the bug fix it was discovered by.

**Fixed later the same day**, in
`docs/design/counting-a-rename-once.md`: the sum kept its meaning and
took the name `spanRenameCrossings`, and `distinctRenamesFollowed` was
added beside it, counted from the renaming commit plus the path pair
rather than summed. Measured end to end there on a repository with one
`git mv` and three spans: `3` and `1`.

## 7. What following a rename does *not* claim

The worry in the original comment — that following a rename "would make
a rename look like continuity of content" — is a real failure mode, and
it is guarded by test rather than by argument.

The presence test is unchanged. `spanPresent` reads the blob at the
destination and asks whether the span's own text is in it, by verbatim
match or token containment. So a commit that both moved a file and
gutted it still reports death at that commit, now for the real reason.
`repoWithRename({ gutOnMove: true })` builds exactly that history and
asserts `fate` `decayed`, `liveAtTip` `false`, `unitsSurviving` 0, and
`diedAtSha` pointing at the commit subject `Move it and rewrite it`.

What the rename buys is only **the right place to look**. It changes
which blob the presence test reads. It does not change the test, and it
cannot turn absent text into present text.

## 8. Evidence

### The guard, and the fact that it is one

`ursa-major/src/lifespan.test.ts` gained nine tests. They build real
git repositories in `$TMPDIR` and run real `git` against them; there is
no mock of `git log`, for the reason stated at the top of that file —
the thing under test is exactly whether the range syntax and the
revision order are right.

| Test | Pre-fix | Post-fix |
|---|---|---|
| `revisionsAfter` reads the renaming revision at the destination path | fail | pass |
| ...and reports the plain case with the record path, no rename marker | fail | pass |
| ...terminates on a rename cycle rather than looping forever | fail | pass |
| ...honours the revision limit while following | **pass** | pass |
| text moved without being edited is `durable`, not `decayed` | fail | pass |
| records that it crossed a rename, and where the text went | fail | pass |
| both rename fields stay absent when no rename was crossed | **pass** | pass |
| a commit that moved the file *and* gutted it still reports death | fail | pass |
| rolls the count up onto the record, summed over spans | fail | pass |

Seven of nine invert, which is what makes them a regression guard
rather than a restatement of current behaviour. The exact failure from
the run, and the defect in one line:

```
AssertionError: expected 'decayed' to be 'durable' // Object.is equality
```

The two that pass both ways are deliberate and are not filler: they
guard the fix against changing behaviour it should not touch. If a
later refactor starts writing `renamesFollowed: 0` on unmoved files, or
lets one rename overrun `MAX_REVISIONS`, those two fail.

### Full suite

```
Test Files  39 passed | 1 skipped (41)
     Tests  829 passed | 4 skipped (834)
```

One pre-existing failure is excluded from that count and named here
rather than hidden: `src/corroborate.test.ts > tells the user which
branch it was and when that branch was written` times out at the 5000 ms
`testTimeout` in this sandbox. It fails identically on `main`, verified
by running it in a clean `git worktree` of `main` before this branch was
touched, so it is not caused by this change. It is a jsdom test against
a slow container, logged to the ledger on 2026-10-24.

### The bundle, which is the part that nearly shipped broken

`ursa-major/dist/ursa.cjs` is committed, `ursa-major/action.yml` runs
`node "$GITHUB_ACTION_PATH/dist/ursa.cjs"` directly, and GitHub
downloads an action as a tarball rather than cloning it. On every
repository that is not this one, that bundle **is** the whole product.

The inherited fix changed `src/lifespan.ts` and did not rebuild it. Two
tests caught it — `src/bundle-canonical.test.ts` and
`src/bundle-exec.test.ts`, both of which pass on `main` and failed on
this branch until the rebuild. Without them the fix would have been
real in `src/`, provable by the new tests, and absent from everything a
customer runs.

```
$ npm run bundle
wrote dist/ursa.cjs (sha256 2ed20990bde0816e17a780ebb6200f32c7c2d87af04891e2c54e915087602bf1, 294,390 bytes)
$ npm run bundle:check
dist/ursa.cjs is current (sha256 2ed20990bde0816e17a780ebb6200f32c7c2d87af04891e2c54e915087602bf1, 294,390 bytes)
```

## 9. Tooling

| Tool | Version | Its job here | Why it, over the alternative considered |
|---|---|---|---|
| `git` | 2.43.0 | The entire evidence base. `log`, `diff-tree` and `show` are the walk; there is no index or database behind it. | Not a choice so much as the premise: `CLAUDE.md` §0 says the product is git-native and launch-based with no daemon. The alternative was a content-addressed store of blob hashes maintained by Ursa, which would be a second source of truth about the user's repository and would have to be kept correct across every operation git already does correctly. |
| `git diff-tree -M` | 2.43.0 | Rename detection, on one commit only. | Over `git log --follow`, for the three reasons in §4: single-pathspec restriction, its own history simplification, and no way to report that a rename occurred. Over `git log --name-status -M` across the range, because that pays for rename detection on every commit in the range to learn something about one. |
| Node.js | 22.23.2 | Runtime for the resolver and the test suite. | The resolver ships as a GitHub Action and `action.yml` declares a Node runtime, so the floor is set by what GitHub's runners provide, not by preference. 22 is the active LTS line. |
| TypeScript | 5.9.3 | Types as the enforcement mechanism, not as documentation. `Omit<FileRevision, 'path'>` in §3 is the example: it makes "a bare `git log` may not decide which path to read at" a compile error. | Over JSDoc annotations on plain JavaScript, which cannot express `Omit<>` as a constraint the build refuses to violate. |
| vitest | 5.0.2 | Test runner. Runs the real-git fixtures in `$TMPDIR` and the jsdom viewer tests in one suite. | Over `node:test`, for the jsdom environment-per-file support the viewer tests in `src/corroborate.test.ts` need, and for watch-mode speed on a repository where a single suite run is ~79 s. |
| esbuild | 0.28.2 | Bundles ESM `src/` into the CommonJS `dist/ursa.cjs` the action runs, via `build/bundle.mjs`. | Over `tsc` emit, which does not bundle dependencies into one file, and over rollup, which would add a plugin chain to do what one esbuild call does. The ESM-to-CJS direction is why `src/bin/bundle-entry.ts` exists. |
| jsdom | 30.1.1 | DOM for the viewer tests, including the pre-existing timeout named in §8. | Named here because it is the dependency behind the one failure this change does not fix, and a tooling list that omits it would make that failure look unexplained. |

## 10. What this does not do

1. **A rename performed by a merge commit still reads as a deletion.**
   `git diff-tree` on a merge emits no diff without `-m` or `-c`, so
   `renameTarget` returns `null` there. This is the pre-existing
   behaviour narrowed rather than removed: `git log -- <path>` only
   surfaces a merge when the path differs from every parent, which a
   rename resolved identically on both sides does not do. Untested, and
   recorded as such.
2. **A copy is not a rename.** `-M` detects renames, not `-C` copies. A
   file copied and then the original deleted in a later commit reads as
   a death at the deletion, which is defensible — the text the record
   named really did stop existing at that path — but it is a judgement,
   not a fact, and nothing in the record says which one happened.
3. **`Durability.renamesFollowed` counts span-rename crossings, not
   renames.** §6 states the discrepancy and why it is not fixed here.
   **Closed 2026-10-24**, later the same day, by
   `docs/design/counting-a-rename-once.md`: two fields, one for each
   quantity. This entry stays because the shape of the mistake is worth
   keeping, not because the defect is open.
4. **Segmentation still follows the original path's extension.**
   `traceFile` calls `modeForPath(path)` on the record's path, so a
   rename from `.md` to `.ts` keeps prose segmentation. That is
   deliberate: the units come from text written under the original path,
   and re-segmenting by the destination's rules would compare sentences
   against lines. It does mean the mode can disagree with the file's
   name at the tip.
5. **Records emitted before 2026-10-24 are not corrected.** They carry
   `decayRate` values computed by the broken walk, with no field
   distinguishing them. Any record whose file moved after its closing
   commit overstates decay, and the only remedy is re-running the
   resolver over the same project. Whether that matters commercially
   depends on whether any such record has left this repository, which is
   a question for the owner and not for this document.
