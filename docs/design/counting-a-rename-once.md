# Counting a rename once

**Status.** Shipped on `ursa-engineer/2026-10-24-message-8`, 2026-10-24.
Follows `docs/design/rename-reads-as-death.md`, which taught the
durability walk to follow a `git mv` and, in the same run, measured two
defects it deliberately did not fix. This document is both of them,
fixed: one in a number a buyer reads, one in the ritual that ships the
program that produces it.

Held to the engineering-artifact standard in `prompts/engineer-agent.md`:
a system diagram whose nodes are real, interfaces as TypeScript
signatures, on-disk layouts with a real payload, exact commands, a
versioned tooling list, and no bare terms.

---

## 1. The two defects, measured

### 1.1 One `git mv`, reported as three renames

`Durability` is the record-level block that says what later real work did
to the text a record classified as kept. Before this change it carried
one rename field, `renamesFollowed`, computed in `annotateDurability` by
summing the per-span field of the same name over every span in the
record.

Measured today, through the real command line and not through a unit
test. A throwaway git repository with three commits and exactly **one**
`git mv` in it, resolved by `npx tsx src/bin/ursa.ts run <repo>
--min-chars 1`, emitted:

| Field, as the record spells it | Value | What a reader takes from it |
|---|---|---|
| `durability.renamesFollowed` (the old field) | `3` | "three renames happened in this project after the closing commit" |
| `files[0].spans[*].lifespan.renamesFollowed` | `1`, on each of three spans | "the file this span sits in crossed one rename" |
| `git log --diff-filter=R --format=%h` on the same repository | one commit | one rename happened |

The per-span number is right. The roll-up is the sum of a per-span
number over spans, so a single move of a file holding three spans
contributes three, and the field's name says "renames". A reviewer
auditing a record it is paying for reads `3` and concludes three files
moved. That reviewer is an AI lab, and the number is wrong by a factor
of however many spans happened to sit in the file that moved.

The sum is worth keeping. `annotateDurability`'s own comment gives the
reason: it is the quantity a reader of the span records can add up and
reconcile against the record. What it is not is an answer to "how many
renames did this walk cross", and nothing in the record answered that at
all.

### 1.2 A correct source fix that shipped without the product

`ursa-major/dist/ursa.cjs` is a committed single-file bundle, because
`ursa-major/action.yml` runs `node "$GITHUB_ACTION_PATH/dist/ursa.cjs"`
on a runner with no `npm install` step, and GitHub hands an action to a
job as a downloaded tarball rather than a clone. On every repository
that is not this one, that file is the whole product.

Measured yesterday and recorded in `docs/ideas.md` (2026-10-24, hook
run): the commit inherited by PR #387 fixed `ursa-major/src/lifespan.ts`
and left `dist/ursa.cjs` holding the resolver from before the fix.
`src/bundle-canonical.test.ts` and `src/bundle-exec.test.ts` both caught
it, and `src/provenance-index.test.ts` then caught the digest index
drifting once the bundle was rebuilt. So the detection worked three
times over. The gap is that all three live at the end of a 79-second
full-suite run, while the normal and recommended way to work is to edit
one module and run that module's tests, which is green.

Two follow-on commands were needed and neither was named at the point
where the edit happens: `npm run bundle`, then `npm run
provenance:bundles`.

---

## 2. System diagram, node by node and edge by edge

Every node below is a file that exists in this repository at the commit
this document ships on. Every edge carries the actual data that moves
across it.

```
  ursa-major/src/bin/ursa.ts  (the `run` subcommand)
        │  OutcomeRecord (in memory), plus closingSha: string and closedAt: string
        ▼
  ursa-major/src/lifespan.ts :: annotateDurability
        │  repoPath: string, path: string                     ┌───────────────────────────┐
        ├────────────────────────────────────────────────────▶ │ revisionsAfter            │
        │                                                     │ (same file)               │
        │  FileRevision[] — each one { sha, at, author,       └───────────────────────────┘
        │  subject, path, renamedFrom? }, oldest first
        │
        │  FinalSpan[] + FileRevision[] + crossings: RenameCrossing[]  (the out-parameter)
        ├────────────────────────────────────────────────────▶ ┌───────────────────────────┐
        │                                                      │ traceFile                 │
        │  mutates: span.lifespan.renamesFollowed: number,     │ (same file)               │
        │  span.lifespan.renamedTo: string                     └───────────────────────────┘
        │  appends: { sha, from, to } per rename crossed               │
        │◀────────────────────────────────────────────────────────────┘
        │
        │  Durability { …, spanRenameCrossings?: number, distinctRenamesFollowed?: number }
        ▼
  ursa-major/src/types.ts :: Durability          (the shape, not a runtime node)
        │
        │  record.json, written by ursa-major/src/store.ts into
        │  <project>/.ursa/records/<id>.json
        ▼
  <project>/.ursa/records/<record id>.json
```

And the generated-artifact half, which is a build-time graph rather than
a runtime one:

```
  ursa-major/src/**/*.ts                      (the source a seat edits)
        │  TypeScript source text
        ▼
  ursa-major/tools/make-regen.ts               (`npm run regen`)
        │  spawns: node build/bundle.mjs
        ├──────────────────────────────▶ ursa-major/build/bundle.mjs
        │                                      │  esbuild output, canonicalized
        │                                      ▼
        │                                ursa-major/dist/ursa.cjs   (300,412 bytes at this commit)
        │  SHA-256 of that file, and SHA-256 of `git show HEAD:ursa-major/dist/ursa.cjs`
        ▼
  ursa-major/tools/regen.ts :: regenStep
        │  RegenStep { state, message, runAgain }
        │
        │  only when the two SHA-256 values are equal:
        │  spawns: npx tsx tools/make-bundle-digest-index.ts
        ├──────────────────────────────▶ ursa-major/tools/bundle-digest-index.ts :: buildIndex
        │                                      │  git log over ursa-major/dist/ursa.cjs
        │                                      ▼
        │                                docs/provenance/bundle-digests.json  (39 rows at this commit)
        │                                docs/provenance/bundle-digests.md
        ▼
  stdout: one sentence naming the next literal command, or `clean`
```

The one edge worth reading twice is the conditional one. `buildIndex`
reads committed history, so running it before the bundle is committed
writes an index that cannot see the new digest and drifts the moment the
bundle commit lands. That is why `regen` is a converging command rather
than a chain, and §4 is the measurement that forced it.

---

## 3. Interfaces at every component boundary

### 3.1 The record shape, in `ursa-major/src/types.ts`

```ts
export interface Durability {
  // …unchanged fields omitted…

  /**
   * `SpanLifespan.renamesFollowed` summed over every span in this record.
   * The number a reader of the span records can add up and reconcile
   * against. Not an answer to "how many files moved".
   */
  spanRenameCrossings?: number

  /**
   * How many distinct renames the walk followed, counted once each. A
   * rename's identity is the commit that performed it together with the
   * path pair it moved.
   */
  distinctRenamesFollowed?: number
}
```

Both optional and never written as `0`, which is the convention
`SpanLifespan.renamesFollowed` already set: a record produced before the
walk could follow a rename at all must stay indistinguishable from one
whose files never moved, because the older record genuinely cannot say.

`SpanLifespan.renamesFollowed` keeps its name. Per span it is accurate:
every span of one file crosses that file's renames.

### 3.2 The rename identity, in `ursa-major/src/lifespan.ts`

```ts
export interface RenameCrossing {
  /** the commit that performed the rename */
  sha: string
  /** the path the file left */
  from: string
  /** the path it took in that commit's tree */
  to: string
}
```

### 3.3 The walk, in `ursa-major/src/lifespan.ts`

```ts
export function traceFile(
  repoPath: string,
  path: string,
  spans: FinalSpan[],
  closedAt: string,
  revisions: FileRevision[],
  crossings?: RenameCrossing[],
): FinalSpan[]
```

The sixth parameter is an out-parameter and optional, so the two existing
call sites in `src/lifespan.test.ts` that ignore it still compile
unchanged. `annotateDurability` passes one array across every file of the
record, which is what makes the distinct count a count rather than a sum:

```ts
export function annotateDurability(
  repoPath: string,
  record: OutcomeRecord,
  closingSha: string,
  closedAt: string,
  maxRevisions?: number,
): OutcomeRecord
```

Its signature did not change. Inside it, the count is taken as:

```ts
const distinctRenames = new Set(
  crossings.map((c) => `${c.sha}\u0000${c.from}\u0000${c.to}`),
).size
```

`\u0000` as the separator rather than a slash or a colon, because both of
those are legal in a git path and a separator that can appear inside a
field is a separator that can collide.

### 3.4 The regeneration state machine, in `ursa-major/tools/regen.ts`

```ts
export interface RegenInputs {
  rebuiltSha256: string
  headSha256: string | null
  historyBlocked: string | null
  indexDrifted: readonly string[]
}

export type RegenState =
  | 'bundle-rebuilt'      // the tree's bundle is not HEAD's: commit it, then run again
  | 'index-rewritten'     // the index was stale and has been rewritten: commit it
  | 'index-unverifiable'  // history cannot be read, so the index was left alone
  | 'clean'               // both artifacts agree with the commit they describe

export interface RegenStep {
  state: RegenState
  message: string
  runAgain: boolean
}

export function regenStep(input: RegenInputs): RegenStep
```

Pure on purpose, so `ursa-major/src/regen.test.ts` asserts the whole
table with no build, no git repository and no clock. `message` is part of
the interface and not decoration: the defect this tool exists for is a
step nobody was told to take, so a state that printed a bare status word
would reintroduce it. One of the eight tests asserts exactly that, by
requiring every message to be longer than eight words and every
`runAgain: true` message to name `` `npm run regen` ``.

---

## 4. The measurement that made `regen` two passes instead of one

The ledger entry asked for `"regen": "npm run bundle && npm run
provenance:bundles"`. That chain is wrong, and the evidence is from this
run, in this order:

1. `npm run bundle` on a dirty tree wrote `dist/ursa.cjs` at SHA-256
   `f497687433163312…`, 300,412 bytes.
2. `npm run provenance:bundles` immediately after printed `skipped: this
   is a shallow clone, so the commits the index names are not all
   present (clone with fetch-depth: 0)`. The seat's checkout is
   `--depth 1`, which is the second defect `docs/ideas.md` records as
   urgent today.
3. `bash tools/ensure-full-clone.sh` repaired the checkout: `clone
   completed: 3 -> 2748 commits, 2 -> 181 remote-tracking refs`.
4. `npm run provenance:bundles` then wrote **no change at all**: `38
   versions of ursa-major/dist/ursa.cjs, newest
   2026-10-24T21:46:21.000Z`, and `git status --short` showed only the
   bundle and `package.json` modified.
5. After committing the bundle, `npm run provenance:bundles:check`
   printed `drifted: docs/provenance/bundle-digests.json`, `drifted:
   docs/provenance/bundle-digests.md`, and `HEAD rebuilt the bundle
   (digest f497687433163312), so this is the expected failure between
   the two commits`.
6. `npm run regen` then indexed it: `39 versions of
   ursa-major/dist/ursa.cjs, newest 2026-10-24T22:26:03.000Z`.

Steps 4 and 5 are the whole argument. The index is a function of
committed history and the bundle is a function of the working tree, so
no single pre-commit command can leave both correct. `regen` therefore
reports which of the four states the repository is in and names the next
command, and a seat runs it until it prints `clean`.

---

## 5. On-disk layout, with a real payload

### 5.1 Where the record goes

```
<project>/.ursa/records/<project slug>-<date>-<generated sha>.json
```

Real, from this run: `rename-demo-9pw6-2026-10-24-03f2223.json`, 8,930
bytes, written into a throwaway repository under `/tmp`. The project
slug and the short sha are the ones git produced for a repository built
in this session, and the record is not committed to this repository,
which is why no private path appears here (the redaction rider in
`prompts/engineer-agent.md`).

### 5.2 The payload, as emitted

`record.json` → `durability`, verbatim from the run described in §1.1:

```json
{
  "method": "git-forward-walk",
  "tipSha": "76f98d0603f56d53c6f571c5f7c80e9371ef6d22",
  "closingSha": "6fb6b0a66c3dc96ee0cf6271c66e4f5b447e5cac",
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
  "spanRenameCrossings": 3,
  "distinctRenamesFollowed": 1
}
```

`record.json` → `files[0].spans[1].lifespan`, the surviving agent span in
the file that moved:

```json
{
  "revisionsChecked": 1,
  "unitsTraced": 2,
  "unitsSurviving": 2,
  "survivingChars": 160,
  "decayedChars": 0,
  "intactRevisions": 1,
  "intactSeconds": 0,
  "diedAtSha": null,
  "diedAt": null,
  "liveAtTip": true,
  "fate": "durable",
  "basis": "verbatim",
  "skipped": null,
  "renamesFollowed": 1,
  "renamedTo": "docs/notes.md"
}
```

Read the two together. Three spans sat in `notes.md`; each one carries
`renamesFollowed: 1`; the record says `spanRenameCrossings: 3` and
`distinctRenamesFollowed: 1`, for a repository containing exactly one
`git mv`. Both numbers are now named for what they are, and the question
"how many renames did this walk cross" has an answer in the record.

The third span in that file is the interesting edge: it is
`no_generation_provenance`, `fate: "untested"`, `skipped: "too-short"` —
and it still carries `renamesFollowed: 1` and `renamedTo`, because the
file it sits in moved whether or not the span was long enough to trace.
It contributes to `spanRenameCrossings` and not to
`distinctRenamesFollowed`, which is the whole distinction in one span.

### 5.3 The generated artifacts

```
ursa-major/dist/ursa.cjs                    300,412 bytes, SHA-256 f497687433163312…
docs/provenance/bundle-digests.json         39 rows, keyed on the first 16 hex of each SHA-256
docs/provenance/bundle-digests.md           the same rows, as a table a reader can read
```

---

## 6. Exact commands

Every line below was executed in this run, with `cwd = ursa-major/`
unless stated otherwise.

```bash
# the change, verified
npx tsc --noEmit
npx vitest run src/lifespan.test.ts        # 29 passed
npx vitest run src/regen.test.ts           # 8 passed
npm test                                   # tsc --noEmit && vitest run, whole suite

# the real payload in §5.2, from scratch
D=$(mktemp -d /tmp/rename-demo-XXXX)
git -C "$D" init -q -b main .
# commit 1, authored as the agent, with the trailer the pairfinder keys on
env GIT_AUTHOR_NAME=Claude GIT_AUTHOR_EMAIL=noreply@anthropic.com \
    GIT_COMMITTER_NAME=Claude GIT_COMMITTER_EMAIL=noreply@anthropic.com \
    git -C "$D" commit -q -m "Write the notes

Co-Authored-By: Claude <noreply@anthropic.com>"
# commit 2, authored as the human: this is the closing commit, where classes are taken
env GIT_AUTHOR_NAME="Human Owner" GIT_AUTHOR_EMAIL=human@example.com \
    GIT_COMMITTER_NAME="Human Owner" GIT_COMMITTER_EMAIL=human@example.com \
    git -C "$D" commit -q -am "Retitle it, and say who owns a verdict"
# commit 3, the move
git -C "$D" mv notes.md docs/notes.md
git -C "$D" commit -q -m "Move it into docs/"
npx tsx src/bin/ursa.ts run "$D" --min-chars 1
python3 -c "import json;print(json.dumps(json.load(open('$D/.ursa/records/'+__import__('os').listdir('$D/.ursa/records')[0]))['durability'],indent=2))"

# the generated artifacts
npm run regen                               # rebuild, then index once the bundle is committed
npm run regen:check                         # verify both, write nothing
bash ../tools/ensure-full-clone.sh          # cwd = repository root; the §4 step-3 repair
```

Two notes on the environment variables, both measured rather than
assumed. `GIT_AUTHOR_NAME` outranks a repository's `user.name`, and every
agent harness exports it, so a fixture that sets identity with `git
config` is authored by whoever runs it — the first attempt at the §5.2
payload resolved 0 records because both commits came out authored by this
seat's own agent identity and the pairfinder therefore saw no human. And
`--min-chars 1` is required because the default minimum work-unit size
rejects a three-commit demo repository, which is a property of the demo
and not of the fix.

---

## 7. Tooling

| Tool | Version | Its job in this change | Why it, over the alternative considered |
|---|---|---|---|
| Node.js | v22.23.2, matching the `node-version: "22"` pin in `docs/design/build-and-test.workflow.yml` | Runs `vitest`, `tsx`, `esbuild` and the bundle | The bundle targets `node22`, so building or testing on another major would verify an artifact the runner does not run |
| npm | 10.9.8, the version bundled with Node 22 | `npm ci`, and the `npm run regen` / `regen:check` indirection that gives the ritual a name | pnpm or yarn would mean regenerating three lockfiles, which is a migration and not a fix |
| TypeScript (`tsc`) | 5.9.3, from the `^5.7.2` devDependency | `tsc --noEmit` is half of `npm test`; it is what proved the old field name is gone from every caller rather than shadowed | No alternative: the record shape is TypeScript, and a rename of a field in a published shape is exactly what a type checker is for |
| vitest | 5.0.2 | Runs the 29 rename tests and the 8 state-table tests | Already the runner for all 60-odd test files here; a second runner would split the one command CI runs |
| tsx | 4.23.15 | Executes `tools/make-regen.ts` and `tools/make-bundle-digest-index.ts` from TypeScript source with no build step | The tools must run before the bundle exists, so they cannot be run through the bundle; a separate `tsc` output directory for tools would add a build step to the command that exists to remove one |
| esbuild | 0.28.2, from the `^0.28.0` devDependency | Builds `dist/ursa.cjs` via `build/bundle.mjs`, invoked by `regen` | Already this project's bundler; `regen` drives the existing script rather than introducing a second bundler, which is the same argument `docs/design/build-and-test-gate.md` §5 makes for the gate |
| git | 2.43.0 | `git show HEAD:ursa-major/dist/ursa.cjs` for the committed bundle's digest, and the rename detection (`-M`) the walk depends on | No alternative: the subject of the measurement is git's own rename reporting |
| Node's `node:crypto` `createHash('sha256')` | bundled with Node 22 | Hashes the rebuilt bundle and the committed blob so `regenStep` compares like with like | The same digest `resolverIdentity()` and `bundle-digest-index.ts` already use, so all three agree on what a bundle's identity is |

---

## 8. Evidence

| Claim | How it was checked | Result |
|---|---|---|
| The old record-level name is gone, not aliased | `npx tsc --noEmit` after the rename, plus an assertion that the emitted block has no `renamesFollowed` key | clean typecheck; assertion in `src/lifespan.test.ts` |
| One `git mv` under a multi-span file reports crossings > distinct | `npx vitest run src/lifespan.test.ts`, test "rolls the count up onto the record twice, as a sum and as a count" | passes: `spanRenameCrossings` equals the per-span sum and exceeds `distinctRenamesFollowed`, which is `1` |
| A file moved twice counts two renames | same file, test "counts a file moved twice as two renames and not as one" | passes: per-span `renamesFollowed: 2`, `renamedTo: "docs/notes.md"`, `distinctRenamesFollowed: 2` |
| A rename later than the death of every unit is not claimed | same file, test "does not count a rename later than the commit every unit died at" | passes: two renames in the history, `revisionsChecked: 1`, one crossing recorded, `crossings` deep-equals a single `{ sha, from: 'notes.md', to: 'moved.md' }` |
| The no-rename case stays silent in both fields | same file, test "leaves both rename fields absent when no rename was crossed" | passes: `spanRenameCrossings` and `distinctRenamesFollowed` both `undefined` |
| End to end through the real CLI, not only through unit tests | the §6 command block, then reading the emitted JSON | `spanRenameCrossings: 3`, `distinctRenamesFollowed: 1`, one `git mv` |
| `regen` converges and names each next step | `npm run regen` twice in this run, and 8 tests over `regenStep` | first pass: "Commit the bundle … then run `npm run regen` again"; second pass: "docs/provenance/… were rewritten to match" |

One thing a reader should not take from the table: that `distinctRenamesFollowed`
is validated against a repository with two files moving in one commit. It
is not. See §9.

---

## 9. What this does not do

1. **Two files moved in a single commit are untested.** The identity is
   the renaming commit plus the path pair, so the design handles it: two
   files moved by one commit are two crossings with different path pairs
   and count as two. No fixture in this repository builds that history,
   so the claim rests on reading the code and not on a test.
2. **Records already emitted are not corrected.** A record written
   between PR #396 merging (2026-10-24, 21:56 UTC) and this change
   carries `renamesFollowed` at record level, meaning crossings. None is
   published in this repository — `docs/provenance/` holds bundle
   digests, not records, and the committed fixture record under
   `ursa-major/fixtures/real/` predates the rename walk entirely — which
   is why the field was renamed rather than kept and footnoted.
3. **A rename performed by a merge commit is still invisible.** Inherited
   unchanged from `docs/design/rename-reads-as-death.md` §10.1:
   `git diff-tree` on a merge emits no diff without `-m` or `-c`, so the
   rename is not detected and therefore not counted here either.
4. **A copy is still not a rename.** Also inherited: `-M` detects
   renames, `-C` detects copies, and this walk passes only `-M`.
5. **`regen` is not a gate.** It writes and it reports; nothing fails a
   build when a seat skips it. The gate already exists and already
   worked, which is the measurement in §1.2:
   `src/bundle-canonical.test.ts`, `src/bundle-exec.test.ts` and
   `src/provenance-index.test.ts` all caught the stale bundle. `regen`
   shortens the loop from a 79-second suite to a named command; it does
   not replace the suite.
6. **Nothing in a record yet says which walk produced it.** A record's
   `decayRate` computed before PR #396 was taken by a walk that read a
   rename as a death, and a record gives a reader no field to tell the
   two apart. That is a separate ledger entry (`docs/ideas.md`,
   2026-10-24 hook run, "Every record emitted before today may overstate
   decay") and it is not fixed here.
