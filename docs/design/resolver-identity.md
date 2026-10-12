# The record never said which code made its claims

Written 2026-10-12 by the engineer seat, alongside the change it
describes (`task.resolvedBy`, branch `engineer/2026-10-12-resolved-by`).
Held to the engineering-artifact standard in `prompts/engineer-agent.md`:
every node below is a file or a process that exists in this repository,
every signature is the signature a caller writes against, every payload
is a file this change actually produced, and every command is the literal
invocation that produced the number beside it.

Companion to `docs/design/record-exclusions.md`, which added the
`exclusions` field, and to `docs/design/vendored-paths.md` §9.9, whose
before-and-after procedure is what exposed the defect in §1.

## 1. The defect, measured

On 2026-10-12 this repository ran the before-and-after measurement that
`docs/design/vendored-paths.md` §9.9 prescribes: resolve one fixture
repository with the resolver as it stood, land a change, resolve the same
fixture again, compare. Both runs wrote a record with the identical
`task.id`:

```
declared-fixture-2026-10-12-5306fd3
```

to the identical path, `<fixture>/.ursa/records/declared-fixture-2026-10-12-5306fd3.json`.
Their headline figures differed by a factor of eight.

| Field | Before the change | After the change |
|---|---|---|
| `stats.byClass.survived_verbatim.chars`, the characters of the finished work that a model generated and the person kept unchanged | 3,626 | 423 |
| `schemaVersion`, the version of the record's **shape** | `"0.1.0"` | `"0.1.0"` |
| Any field naming the code that computed the row above | none | none |

The second file overwrote the first. Both were correct outputs of the
code that produced them. Only one was a true claim about the work. And
nothing inside either file distinguished them, because the ten top-level
keys a record had that day — `schemaVersion`, `task`, `artifact`,
`files`, `conversations`, `generations`, `stats`, `exclusions`,
`durability`, `signals` — contain no resolver identity, and
`schemaVersion` did not move because the shape was the same both times.

**Why this is structural and not an accident of one day.** The
classification rules under those figures are young and they move:

- `src/invariants.ts` went from ten bounds to fifteen between 2026-10-06
  and 2026-10-12. `BOUND_COUNT` is derived from the `BOUNDS` object for
  exactly this reason.
- `src/corroborate.ts` changed when a similarity score above
  `THETA_HIGH` is allowed to be called an edit at all, which moves spans
  between `survived_mutated` and `no_generation_provenance`.
- `src/vendored.ts` changed which paths are classified at all, twice:
  `imported_whole` on 2026-10-06 and `declared_import` on 2026-10-12.
  The second one silently changes every figure in every record resolved
  after it.

A lab holding two records bought two months apart holds claims made
under different rules. Before this change it had no way to tell which
rules applied to which record. The design documents that describe each
change are in this repository; the buyer has the JSON.

**The one-line statement of the fix.** Each record names the build of
Ursa Major that made its claims, in the record, as a value a pipeline can
filter on.

## 2. System diagram, node by node

Seven nodes and nine edges. Every node is a path in this repository.
Every edge carries a named type or a named file format.

**Nodes.**

| Node | What it is | Where |
|---|---|---|
| `argv1` | The path of the script this node process is running, which on both launches is the resolver's own artifact | `process.argv[1]`, a `string` supplied by node itself |
| `resolverIdentity` | The function that turns that path into an identity, or into `null` when it cannot | `ursa-major/src/resolver-identity.ts` |
| `git` | The git command-line program, run as a child process against one directory | external binary, version in §7 |
| `saveRecord` | The function that writes a record to disk, and the only place the identity is stamped | `ursa-major/src/store.ts` |
| `recordFile` | The outcome record as a file, which is the thing a lab buys | `<project>/.ursa/records/<task.id>.json` |
| `renderRunComment` | The pull request comment the CI launch posts | `ursa-major/src/ci/comment.ts` |
| `renderViewer` | The single-file HTML the user opens to read their own record | `ursa-major/src/viewer.ts` |

**Edges.**

| From | To | Data crossing the edge |
|---|---|---|
| `argv1` | `resolverIdentity` | `string`, an absolute filesystem path, e.g. `$GITHUB_ACTION_PATH/dist/ursa.cjs` |
| `resolverIdentity` | `git` | the argument vector `['-C', <dirname of argv1>, 'rev-parse', '--is-inside-work-tree']`, then `['-C', …, 'rev-parse', '--short', 'HEAD']`, then `['-C', …, 'status', '--porcelain']` |
| `git` | `resolverIdentity` | three strings on stdout: `"true"`; an abbreviated commit object id, 7 characters in this repository today and longer once git needs more to stay unambiguous; and a porcelain status listing, empty when the tree is clean |
| `argv1` | `resolverIdentity` | the file's own bytes, read with `readFileSync`, when the git edge above found no work tree |
| `resolverIdentity` | `saveRecord` | `ResolverIdentity \| null`, the discriminated union in §3 |
| `saveRecord` | `recordFile` | `OutcomeRecord` serialized as JSON with two-space indent and a trailing newline, now carrying `task.resolvedBy` |
| `recordFile` | `renderRunComment` | `OutcomeRecord['task']['resolvedBy']`, read back off the record rather than re-asked of the process |
| `recordFile` | `renderViewer` | the same field, embedded in the page's inline `R` object and rendered as a chip in `#meta` |
| `recordFile` | `src/launch-parity.test.ts` | `task.resolvedBy` inside the `comparable()` projection, so a launch that stops stamping fails the suite |

**The one edge that does not exist, deliberately.** There is no edge from
`resolverIdentity` into `resolve()` in `ursa-major/src/resolve.ts`.
`resolve()` is a pure function of its input, and the three other facts it
cannot compute — which merge destroyed a deleted span
(`attributeDeletion`), whether a rival commit holds a span's text
(`corroborate`), which paths are imports (`exclusions`) — all reach it as
callbacks or as data prepared at the edge. The resolver's own commit is a
fourth such fact, and reading it means running git against a directory
that has nothing to do with the project being resolved.

## 3. Interfaces, as the signatures a caller writes against

```ts
// ursa-major/src/types.ts
export type ResolverIdentity =
  | { basis: 'git_commit'; commit: string; dirty: boolean }
  | { basis: 'bundle_digest'; digest: string }

export interface OutcomeRecord {
  schemaVersion: '0.1.0'
  task: {
    id: string
    finished: boolean
    generatedAt: string
    resolvedBy?: ResolverIdentity
  }
  // … artifact, files, conversations, generations, stats, signals,
  //   durability, exclusions, all unchanged
}
```

```ts
// ursa-major/src/resolver-identity.ts
export function resolverIdentity(
  scriptPath?: string | null,
): ResolverIdentity | null

export function currentResolverIdentity(): ResolverIdentity | null

export function resetResolverIdentityMemo(): void

export function formatResolverIdentity(identity: ResolverIdentity | null): string
```

```ts
// ursa-major/src/store.ts — the third parameter is new
export function saveRecord(
  projectRoot: string,
  record: OutcomeRecord,
  identity?: ResolverIdentity | null,
): string
```

```ts
// ursa-major/src/ci/comment.ts — the field is new on an existing interface
export interface RunCommentContext {
  // … prNumber, repo, range, windowNote, declarationBasis, recordsPath,
  //   runUrl, dropped, invariantViolations, all unchanged
  resolvedBy?: ResolverIdentity | null
}
```

### 3.1 Why a union and not a version string

The two launches ship this resolver as two different artifacts, and the
identity available for each is a different **kind** of fact rather than a
different spelling of one fact.

| Launch | What runs | Identity available | Why |
|---|---|---|---|
| `ursa run <project>` | `ursa-major/src/bin/ursa.ts`, executed by `tsx` from a git checkout of this repository | `{ basis: 'git_commit', commit, dirty }` — a pointer into a public history a reader can look up, plus a flag for whether the tree matched that history | the resolver's own source is in a git work tree |
| `ursa ci` | `ursa-major/dist/ursa.cjs`, one committed CommonJS file, run by whatever node the runner already has (see `ursa-major/action.yml` line 159) | `{ basis: 'bundle_digest', digest }` — a content hash with no history behind it | GitHub downloads an action as a tarball rather than cloning it, so on any repository other than this one there is no `HEAD` under the bundle to read |

Carrying the basis as a value, rather than flattening both into a
`version: string` whose meaning a consumer has to guess, is the same
choice `ExclusionReason` makes in `ursa-major/src/types.ts`:
`imported_whole` means two git blob object ids were compared and
`declared_import` means a committing party said so, and a pipeline
filters on the difference without reading a word of prose. A buyer who
will only accept records auditable against a public commit selects
`basis === 'git_commit'`. This is the posture the engineer seat's
2026-10-12 craft scan found SLSA v1.0 taking one level further out, in
the builder's documentation rather than in the attestation.

### 3.2 The three states of the field, which are three different claims

| On disk | The claim |
|---|---|
| `"resolvedBy": { "basis": "git_commit", "commit": "a511a50", "dirty": false }` | Every classification in this record was computed by the code at commit `a511a50` of `alexandrapaiz/Ursa`, and the tree that ran had no uncommitted or untracked changes. |
| `"resolvedBy": { "basis": "git_commit", "commit": "a511a50", "dirty": true }` | The code that ran was `a511a50` **plus changes that were never committed**, so the commit alone does not identify it. Stated rather than suppressed, because a sha printed beside unlogged edits is a worse artifact than an admitted gap. |
| field absent | Nobody could tell. The record was written by a build with no git work tree under it and no readable artifact to hash. **Never** a placeholder for "some resolver": the same absent-versus-empty distinction `exclusions` already draws between an absent array, meaning the capture path cannot ask the question, and an empty one, meaning it asked and found nothing. |

### 3.3 Why the stamp is at write time, and why it is never rewritten

`saveRecord` stamps the record if, and only if, it does not already carry
an identity.

Stamping at write time, rather than in each of the four call sites that
save records today — `ursa-major/src/bin/ursa.ts`,
`ursa-major/src/ci/run.ts`, `ursa-major/src/adapters/cli.ts`,
`ursa-major/src/bridge/declare.ts` — is because writing is where a record
stops being a value inside a process and becomes an artifact somebody can
buy. It is also the one place every launch passes through, so a fifth call
site cannot forget.

Preserving an identity already present is because of one specific caller.
`applyVerdict` in `ursa-major/src/bridge/declare.ts` loads every record of
a project, writes the user's own acceptance verdict into `signals`, and
saves it again, possibly months later and from a different build. The span
classifications in that record are still the original resolver's work.
Restamping would credit a later build with claims it never made, which is
the exact confusion this field exists to end. Pinned by the test `does NOT
restamp a record it is re-saving` in
`ursa-major/src/resolver-identity.test.ts`.

Re-resolving is the other case and it behaves oppositely, correctly: a
second `ursa run` over the same history builds a fresh `OutcomeRecord`
with no identity on it, so the new resolver stamps itself. That is the
case from §1, and it is the one that had to change.

## 4. On-disk layout, with real payloads

### 4.1 The git basis — a record this repository wrote on 2026-10-12

Path on the machine that produced it, with the checkout root written as a
placeholder per the redaction rider in `prompts/engineer-agent.md`:

```
<checkout>/.ursa/records/ursa-2026-09-30-124d880.json
```

The first three keys of that file, verbatim, with the remaining seven
(`files`, `conversations`, `generations`, `stats`, `exclusions`,
`durability`, `signals`) elided for length and unchanged by this work:

```json
{
  "schemaVersion": "0.1.0",
  "task": {
    "id": "ursa-2026-09-30-124d880",
    "finished": true,
    "generatedAt": "2026-10-05T03:21:22Z",
    "resolvedBy": {
      "basis": "git_commit",
      "commit": "a511a50",
      "dirty": false
    }
  },
  "artifact": {
    "kind": "repo"
  }
```

`a511a50` is the commit of this branch at which the run happened, and
`git status --porcelain` in that tree printed zero lines, which is the
`dirty: false`.

### 4.2 The bundle basis — the committed bundle run from outside any git tree

This is the CI launch's own case, produced by copying
`ursa-major/dist/ursa.cjs` into a directory that is not a git work tree
and running it against a throwaway three-commit repository:

```
/tmp/bundleprobe/project/.ursa/records/project-2026-10-12-050e49c.json
```

```json
  "task": {
    "id": "project-2026-10-12-050e49c",
    "finished": true,
    "generatedAt": "2026-10-12T20:34:07Z",
    "resolvedBy": {
      "basis": "bundle_digest",
      "digest": "1dd251d21d457c96"
    }
  },
```

Two things about that payload are the point rather than the detail.

First, `1dd251d21d457c96` is the first 16 hex characters of the SHA-256
that `npm run bundle:check` prints for the committed bundle
(`1dd251d21d457c96de9e8558bb0adb07cb6d185003063a72fb735fb48ab947c1`,
177,322 bytes). So a reviewer holding this record can grep the build log
for the build that wrote it, with no git history involved.

Second, the process's working directory during that run **was** a git work
tree, namely the project being resolved, whose `HEAD` was `a6b00fa`. The
record does not say `a6b00fa`. A resolver identity read from
`process.cwd()` would have stamped every record with the sha of the
repository being measured, which is not merely a different number: it is a
confident, plausible-looking claim about the wrong repository.

### 4.3 What a record written before this change looks like

Unchanged, and still valid. `task.resolvedBy` is optional, no bound
requires it, and `src/invariants.ts` was not touched by this work. Every
record in `ursa-major/fixtures/` and `ursa-major/fixtures/violations/`
still passes all fifteen bounds with no identity on it.

## 5. Exact commands, and the numbers they produced

### 5.1 The suite, before and after

```bash
cd ursa-major
npm ci --no-audit --no-fund
npm test          # tsc --noEmit && vitest run
```

Before this change: `Test Files 31 passed | 1 skipped (32)`, `Tests 560
passed | 4 skipped (564)`.
After: `Test Files 32 passed | 1 skipped (33)`, `Tests 580 passed | 4
skipped (584)`. The twenty new tests are fourteen in
`src/resolver-identity.test.ts`, one in `src/ci/ci.test.ts`, four in
`src/provenance.test.ts`, and one in `src/launch-parity.test.ts`.

### 5.2 Proving the new tests are sharp, by breaking the implementation

A test that passes against a wrong implementation is not evidence. The
mutation applied was one line of `src/resolver-identity.ts`, replacing the
directory the git questions are asked about with the process's working
directory:

```bash
cd ursa-major
cp src/resolver-identity.ts /tmp/ri.bak
sed -i 's|^  const dir = dirname(scriptPath)$|  const dir = process.cwd()|' src/resolver-identity.ts
npx vitest run src/resolver-identity.test.ts
cp /tmp/ri.bak src/resolver-identity.ts
```

Seven of the fourteen tests fail under that mutation, including `reads the
script's tree and not the process working directory`, `flags an
uncommitted change, because the commit alone would then be a lie`, and
`hashes the running file when its directory is not a work tree`.

The same assertion written the obvious way would **not** have failed.
Comparing two fixture repositories from a third directory passes against a
cwd-based implementation too, because it reports the third directory's sha,
which matches neither fixture, and a `not.toBe(other)` assertion still
holds. The test therefore moves the process into the other repository with
`process.chdir` and restores it in a `finally`.

### 5.3 All three states, end to end, on the local launch

```bash
cd ursa-major
npx tsx src/bin/ursa.ts run <checkout> --min-chars 20000
# Resolved by: resolver a511a50

echo "// scratch module, untracked" > src/scratch-probe.ts
npx tsx src/bin/ursa.ts run <checkout> --min-chars 20000
# Resolved by: resolver a511a50 (working tree had uncommitted changes)
#   record field: {"basis": "git_commit", "commit": "a511a50", "dirty": true}

rm -f src/scratch-probe.ts
npx tsx src/bin/ursa.ts run <checkout> --min-chars 20000
# Resolved by: resolver a511a50
```

The middle run is the untracked case specifically, not the modified case:
`HEAD` is clean on every tracked path and the code that ran is still not
the code at `HEAD`. That is why the check is `git status --porcelain`
being non-empty rather than a diff against `HEAD`.

### 5.4 The bundle basis, end to end

```bash
cd ursa-major
npm run bundle            # wrote dist/ursa.cjs (sha256 1dd251d2…b947c1, 177,322 bytes)
npm run bundle:check      # dist/ursa.cjs is current (sha256 1dd251d2…b947c1)

mkdir -p /tmp/bundleprobe/resolver
cp dist/ursa.cjs /tmp/bundleprobe/resolver/
git -C /tmp/bundleprobe/resolver rev-parse --is-inside-work-tree
# fatal: not a git repository (or any of the parent directories): .git

cd /tmp/bundleprobe/project      # a 3-commit fixture: base, agent commit, human edit
node /tmp/bundleprobe/resolver/ursa.cjs run /tmp/bundleprobe/project --min-chars 10
# Resolved by: resolver bundle sha256:1dd251d21d457c96
git rev-parse --short HEAD
# a6b00fa   <- the cwd's own HEAD, which the record correctly does not claim
```

### 5.5 The viewer, executed rather than greped

`src/artifact.test.ts` records what a substring assertion on the viewer
costs: three of them passed while the viewer's inline script carried a
`SyntaxError`, because a substring check never parses what it finds. So
the chip is asserted in `src/provenance.test.ts`, the file that already
opens the rendered page in jsdom. Read out of a real DOM, the four states
are:

```
absent                                          -> ["finished", "repository: the finished work is versioned source"]
{git_commit, abc1234, dirty: false}             -> ["finished", "resolved by commit abc1234", "repository: …"]
{git_commit, abc1234, dirty: true}              -> ["finished", "resolved by commit abc1234 plus uncommitted changes", "repository: …"]
{bundle_digest, 1dd251d21d457c96}               -> ["finished", "resolved by bundle sha256:1dd251d21d457c96", "repository: …"]
```

### 5.6 The rest of the repository's checks

```bash
node scripts/dep-floor.mjs                      # Dependency floor holds: no critical anywhere, no high in any production tree.
cd ursa-major && npm run fixtures:violations:check   # 31 files match what this script would write.
cd ursa-major && npm run bundle:check                # dist/ursa.cjs is current (sha256 1dd251d2…b947c1, 177,322 bytes)
```

`ursa-minor` and `ursa-major/overlay` were not rebuilt. Neither imports
`OutcomeRecord` nor reads `task`, checked with `grep -rn
'OutcomeRecord\|task\.' overlay/app overlay/lib`, which returns nothing;
the overlay's only relationship to `ursa-major/src` is two hand-mirrored
browser modules named in their own headers.

## 6. The surfaces that show it, and why each one

| Surface | What it shows | Why it is there |
|---|---|---|
| `<project>/.ursa/records/<id>.json`, field `task.resolvedBy` | the union from §3, or nothing | the record is the deliverable; everything else is a view of it |
| `ursa run` terminal output, one line after `Records:` | `Resolved by: resolver a511a50` | the figures a user reads in the terminal moved by a factor of eight between two commits of this resolver and the terminal gave no sign of it |
| The pull request comment, inside `<details>How this run was bounded</details>` | `Resolver that produced these records: resolver bundle sha256:1dd251d2…`, plus the sentence naming the field | a reader of that comment is reading figures produced by a build they did not install and cannot see; on any repository but this one the bundle digest is the only identity of that build anywhere in view |
| The single-file HTML viewer, a chip in `#meta` | `resolved by commit a511a50`, or `resolved by bundle sha256:…` | constraint 2 of this project: the user can always see what has been inferred about them, and which build inferred it is part of that |

The comment line is in the detail block rather than the five-field table
for the same reason `invariantViolations` is: the table's shape is fixed
so that two runs stay comparable, and this is a question a reader asks
when deciding how far to trust the figures rather than one of the figures.
A caller that passes no `resolvedBy` prints no line at all, because a
sentence naming no resolver reads as a resolver that declined to identify
itself, which is a worse claim than silence.

## 7. Tooling

Versions are the ones actually resolved in this branch's
`ursa-major/node_modules`, read with `require('<pkg>/package.json').version`,
not the caret ranges `ursa-major/package.json` declares. Where the two
differ the range is given beside it, because the range is what a fresh
`npm ci` is allowed to move to.

| Tool | Version | Its job here | Why it, over what was considered |
|---|---|---|---|
| `git` | 2.55.0, as measured with `git --version` on the GitHub-hosted runner that produced every number in §5. Not pinned anywhere in this repository: the resolver takes whatever is on `PATH`, and the three subcommands it uses have been stable since git 1.7 | answers three questions about the resolver's own source tree: `rev-parse --is-inside-work-tree`, `rev-parse --short HEAD`, `status --porcelain` | the identity being read is a git fact, and `src/vendored.ts`, `src/pairfinder.ts` and `src/corroborate.ts` already shell out to the same binary with the same `execFileSync` plus `stdio: ['ignore','pipe','ignore']` pattern. A library such as `isomorphic-git` would add a production dependency to read three strings this repository already reads this way |
| `node:crypto`, function `createHash('sha256')` | the standard library of node 22.23.3, which is the node that ran every command in §5. No `.nvmrc` exists in this repository and no workflow pins node for `ursa-major`; `.github/workflows/agent-frontend.yml` pins node 20 for the frontend seat alone, and `ursa-major/action.yml` deliberately uses whatever node the runner already has | hashes the running bundle when there is no work tree | SHA-256 is already this repository's bundle identity: `build/bundle.mjs` prints exactly this digest to decide whether `dist/ursa.cjs` is stale, so the record and the build log agree by construction rather than by convention. A shorter non-cryptographic hash would be cheaper and would not be the same number as the build log's |
| `esbuild` | 0.28.2 (declared `^0.28.0`) | builds `dist/ursa.cjs`, the artifact the bundle basis identifies | unchanged by this work, named because the `format: 'cjs'` it is configured with is why §8 rules out `import.meta.url` |
| `tsx` | 4.23.15 (declared `^4.19.2`) | runs `src/bin/ursa.ts` on the local launch, which is the git basis | unchanged by this work |
| `vitest` | 5.0.2 (declared `^5.0.2`) | runs the 580 tests, including the 20 new ones | unchanged by this work |
| `jsdom` | 30.1.1 (declared `^30.1.1`) | executes the viewer's inline script so the chip assertions read a real DOM instead of a substring | already this repository's choice for the same job in `src/provenance.test.ts`; a headless browser would test the same four strings at the cost of a download on every runner |
| `typescript` | 5.9.3 (declared `^5.7.2`) | `tsc --noEmit`, which is what makes the discriminated union in §3 a checked constraint rather than a comment | unchanged by this work |

## 8. The one implementation detail that looks arbitrary and is not

The module asks node for `process.argv[1]` to find the script it is
running, rather than `import.meta.url` or `__dirname`. This is the only
module in the resolver that has to answer that question, and it is also
compiled two ways:

- `esbuild` emits CommonJS for `dist/ursa.cjs` (`format: 'cjs'` in
  `ursa-major/build/bundle.mjs`), where `import.meta` is empty and
  esbuild warns about it.
- `tsx` runs the same source as ESM for `ursa run`, where `__dirname`
  does not exist.

`process.argv[1]` is the same string under both, and it is literally the
path `ursa-major/action.yml` line 159 invokes:

```bash
node "$GITHUB_ACTION_PATH/dist/ursa.cjs" "${args[@]}" | tee "$RUNNER_TEMP/ursa-ci.log"
```

It is `undefined` when node was given no script at all (`node -e '…'`),
in which case there is no artifact to identify and the caller gets
`null`, which §3.2 defines as a real answer.

## 9. Terms used above

- **Outcome record.** The file this project sells: a finished piece of
  work joined backward to every model generation that fed it, with each
  span of the finished text classified by what happened to it. One JSON
  file per work unit at `<project>/.ursa/records/<task.id>.json`.
- **Launch.** One of the two ways the same resolver is fired. `ursa run`
  is the local launch, `ursa ci` is the GitHub Action launch. That they
  are the same resolve is asserted by `src/launch-parity.test.ts`.
- **Basis.** The kind of evidence an identity rests on, carried as a
  string value in the record. `git_commit` means a commit in a public
  history. `bundle_digest` means the SHA-256 of the bytes that ran.
- **Dirty.** `git status --porcelain` printed at least one line for the
  resolver's own source tree, counting untracked files. It means the
  commit named beside it is not a complete account of the code that ran.
- **Bound.** One of the fifteen arithmetic and same-set constraints in
  `ursa-major/src/invariants.ts` that every record is checked against
  before a run reports success. Untouched by this work.
- **Work tree.** A git checkout with files you can edit, as opposed to a
  bare repository or an unpacked tarball. `git rev-parse
  --is-inside-work-tree` is the question that distinguishes them, and the
  distinction is the whole reason the bundle basis exists.
- **Stamp.** Writing `task.resolvedBy` onto a record at the moment it is
  saved, done once and never rewritten (§3.3).

## 10. What this does not do

1. **It is not a bound.** `src/invariants.ts` still has fifteen codes and
   no sixteenth. Nothing fails if a record carries no identity, and
   nothing checks that `commit` looks like an object id. A
   `RESOLVER_IDENTIFIED` bound would need a sixteenth counterexample
   record in `ursa-major/fixtures/violations/` with a note quoting the
   gate's own output verbatim, because
   `src/invariants.violations.test.ts` asserts the set of codes those
   fixtures fire equals `BOUND_CODES` exactly. That is a day's work of
   its own and it is in the ledger as such.
2. **It does not make a record reproducible.** Knowing which resolver
   wrote a record tells a reader which code to re-run; it does not make
   the re-run produce a byte-identical file. `task.generatedAt` is a wall
   clock, which is the separate ledger entry of 2026-10-10, "A record is
   not reproducible from its own stated inputs, because one field is the
   wall clock".
3. **It does not version the rules.** `git_commit` points at a commit, so
   a reader has to diff two commits of this repository to learn what
   changed between two records. It does not say "the descent rule
   changed" in words. Enumerating which fields a build verified and which
   it merely carried is the `docs/design/evidence-classes.md` entry in
   the ledger, proposed 2026-10-12 and not built.
4. **It cannot be verified by the consumer.** A record claiming
   `commit: "a511a50"` is a claim the producer makes about itself. A lab
   can check that the commit exists and read what it does; it cannot
   check that this file came from that commit. Signing is not in scope
   here and is not in the ledger either.
5. **It does not reach records already written.** Every record resolved
   before today carries no identity, which §3.2 defines as "nobody could
   tell". There is no backfill and there should not be one: inferring
   which resolver wrote an existing record is exactly the guess this
   field exists to replace.
6. **It is absent from the bundled viewer, because the viewer is absent
   from the bundle.** `src/viewer.ts` is not in `dist/ursa.cjs`'s import
   graph (`grep -c 'resolved by bundle sha256' dist/ursa.cjs` returns
   `0`), since `src/bin/ursa.ts` never imports it. That predates this
   work and is unchanged by it. The CI launch's reader sees the identity
   in the pull request comment instead.
