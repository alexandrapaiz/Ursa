# Is a resolver digest a stand-in for a commit?

Engineer run, 2026-10-17 (second run). Ledger entry: "Two builds of
identical source produce two different resolver digests"
(`docs/ideas.md`, 2026-10-17). Predecessor artifacts:
`docs/design/resolver-identity.md`, which added the field, and
`docs/design/bundle-digest-index.md`, which made the field followable
and whose index this measurement tests the foundation of.

Written to the engineering-artifact standard in
`prompts/engineer-agent.md`: a system diagram whose nodes are real files
(§3), interfaces as TypeScript signatures (§4), on-disk layouts with
real payloads (§5), the exact commands and what they printed (§6), a
tooling list with versions and rationale (§7), and a definition for
every term that is not self-explanatory (§8).

The short answer is in §1. The measurement is the deliverable, because
the fix the ledger entry proposed turned out to be wrong and only a
measurement could say so.

---

## 1. The answer, in three numbers

One commit of this repository, `181596a`, built from four directory
layouts that differ in nothing but where `node_modules` resolves from,
produced **three different** resolver digests:

| Layout | What differs about it | `sha256(dist/ursa.cjs)` |
|---|---|---|
| L1 | `node_modules/` is a real directory inside `ursa-major/`, which is what `npm install` in that directory produces | `d32543070474cc28…` |
| L2 | `node_modules/` is a symbolic link pointing at an installation outside the checkout | `c23a2cc0037c233d…` |
| L3 | `node_modules/` sits in the parent directory of `ursa-major/`, which is what npm workspaces produce | `743ca60a55a5444c…` |
| L4 | same as L1, but the checkout sits five directories deeper in the filesystem | `d32543070474cc28…` |

The source tree was byte-identical in all four. After the change this
artifact documents, the same four layouts produce `d32543070474cc28…`
four times, which is also the digest already committed on `main`, so no
record and no index row changes value.

**What L4 is for.** L4 matching L1 is what makes "where `node_modules`
is relative to the package" the explanation, rather than "how long the
absolute path to the checkout happens to be". Without L4 the three
distinct numbers would be consistent with both readings.

**Why this matters and what it does not mean.** `resolverIdentity()` in
`ursa-major/src/resolver-identity.ts` hashes `dist/ursa.cjs`, and
`task.resolvedBy.digest` in every record the GitHub Action writes is the
first sixteen characters of that hash. Since the index shipped earlier
today, `docs/provenance/bundle-digests.json` keys every row on the same
sixteen characters. Nothing in that chain was ever wrong, and no record
has ever been misstamped: the digest answered "which artifact ran"
exactly as claimed. What was weaker than it read is the implicit promise
that a digest stands in for a commit. Before this change, one commit had
three digests depending on who built it, two of them in no index, and
`npm run bundle:check` called them "stale" rather than "built
elsewhere".

---

## 2. The candidate fix the measurement refuted

The ledger entry's first step named a one-line fix: set esbuild's
`absWorkingDir` to the package directory. Applied and measured, it
changed nothing. All four digests came back identical to the four above,
byte for byte.

**Why, stated rather than guessed at.** `absWorkingDir` sets the
directory esbuild resolves relative paths against, and it defaults to
`process.cwd()`. In all four layouts `build/bundle.mjs` already runs
with the package directory as the working directory, because
`package.json`'s `"bundle": "node build/bundle.mjs"` is invoked by npm
from the package root. So the option was being set to the value it
already had. The variable is not the working directory. It is the
distance from the working directory to wherever `node_modules` really
is, and no esbuild option moves that.

This is recorded because the entry that proposed it is on `main`, and a
reader who finds the refuted line without the refutation would spend the
day this run already spent.

---

## 3. System diagram, node by node

Four files and one directory, every one of which exists in the tree
today. Read top to bottom; each edge is labeled with the actual value
that crosses it.

```
  ursa-major/src/**/*.ts           ursa-major/node_modules/diff/
  (the resolver's own source)      (the one inlined dependency)
            │                                   │
            │  TypeScript source text           │  JavaScript source text,
            │                                   │  read from wherever the
            │                                   │  package resolves to
            └───────────────┬───────────────────┘
                            ▼
              ursa-major/build/bundle.mjs
              (esbuild driver, run by `npm run bundle`)
                            │
                            │  { outputFiles: [{ text: string }],
                            │    metafile: { inputs: Record<path, …> } }
                            │  where each `path` is relative to the
                            │  build's working directory
                            ▼
            ursa-major/build/canonicalize.mjs
            (canonicalizeInlinedPaths — NEW, this run)
                            │
                            │  the same `text`, with every annotated
                            │  dependency path rewritten to its
                            │  `node_modules/…` suffix
                            ▼
              ursa-major/dist/ursa.cjs
              (the single file a customer's runner executes)
                            │
                            │  sha256 of the file's bytes
                            ▼
            ursa-major/src/resolver-identity.ts
            (resolverIdentity → { basis, digest })
                            │
                            │  digest.slice(0, 16), e.g. "d32543070474cc28"
                            ▼
      ┌─────────────────────┴─────────────────────┐
      ▼                                           ▼
  task.resolvedBy in each record        docs/provenance/bundle-digests.json
  under <project>/.ursa/records/        (digest → commit, 18 rows)
```

**Node by node.**

- `ursa-major/src/**/*.ts` — the resolver's TypeScript sources. The
  entry point esbuild is given is `src/bin/bundle-entry.ts`.
- `ursa-major/node_modules/diff/` — the `diff` package, version `^8.0.2`
  in `package.json`. It is the only third-party module that survives
  tree-shaking into the bundle, contributing five of its modules. Its
  location on disk is the variable this artifact is about.
- `ursa-major/build/bundle.mjs` — the esbuild driver. Already existed;
  this run added `metafile: true` to its options and one call.
- `ursa-major/build/canonicalize.mjs` — new. Holds
  `canonicalizeInlinedPaths` and nothing else. Separate from
  `bundle.mjs` because `bundle.mjs` is a top-level-`await` script that
  writes a file when imported, so a test cannot import it to reach the
  function.
- `ursa-major/dist/ursa.cjs` — the committed single-file CLI.
  `action.yml` runs `node "$GITHUB_ACTION_PATH/dist/ursa.cjs"`.
- `ursa-major/src/resolver-identity.ts` — computes the stamp. Unchanged
  by this run.
- `docs/provenance/bundle-digests.json` — the index shipped earlier
  today. Unchanged by this run, and the point of the no-churn property
  in §1 is that it did not need changing.

**Edge by edge, with the actual data.**

| From → To | What crosses it |
|---|---|
| `src/**/*.ts` → `build/bundle.mjs` | TypeScript source text, read by esbuild's own loader |
| `node_modules/diff/` → `build/bundle.mjs` | JavaScript source text, plus the path it was read from |
| `build/bundle.mjs` → `build/canonicalize.mjs` | `(text: string, metafile: InlinedModuleMetafile)`, the two values esbuild returns when `write: false` and `metafile: true` |
| `build/canonicalize.mjs` → `dist/ursa.cjs` | the canonicalized `string`, written by `writeFileSync` |
| `dist/ursa.cjs` → `src/resolver-identity.ts` | the file's bytes, hashed with `createHash('sha256')` |
| `src/resolver-identity.ts` → `task.resolvedBy` | `{ basis: 'bundle_digest', digest: string }`, 16 hex characters |
| `src/resolver-identity.ts` → `bundle-digests.json` | the same 16 characters, as the `digest` key of a row |

---

## 4. Interfaces, as the signatures a caller writes against

The one new boundary, declared in `ursa-major/build/canonicalize.d.mts`
because the build scripts are plain `.mjs` on purpose and the test that
imports them is TypeScript under `tsc --noEmit`:

```ts
/** The one field of esbuild's metafile the canonicalizer reads. */
export interface InlinedModuleMetafile {
  inputs: Record<string, unknown>
}

export function canonicalizeInlinedPaths (
  text: string,
  metafile: InlinedModuleMetafile,
): string
```

`inputs` is typed `Record<string, unknown>` rather than esbuild's own
`Metafile` on purpose: the function reads the keys and never the values,
so this is the whole contract, and typing it this way lets the unit
tests build a metafile by hand without importing esbuild.

The two existing signatures this sits upstream of, unchanged, from
`ursa-major/src/resolver-identity.ts`:

```ts
export type ResolverBasis = 'git_commit' | 'bundle_digest'

export interface ResolverIdentity {
  basis: ResolverBasis
  digest: string          // 16 hex characters for bundle_digest
  committedAt?: string
}

export function resolverIdentity (): ResolverIdentity
export function formatResolverIdentity (id: ResolverIdentity): string
```

And the throw, which is part of the interface because a caller has to
know the function can fail rather than return:

```ts
// throws Error(/two inlined modules canonicalize to the same path/)
// when two distinct inputs reduce to one string
```

---

## 5. On-disk layout, with real payloads

### 5.1 The four layouts, as real directory trees

`$WORK` below is the `mktemp -d` directory the harness creates, for
example `/tmp/ursa-layout-XnQ7Mx`. `$NM` is a populated installation,
which on the runner that produced these numbers was
`/home/runner/work/Ursa/Ursa/ursa-major/node_modules`. That path is the
documented GitHub Actions workspace location, identical on every
GitHub-hosted runner, so it carries no machine identity; a path under a
person's home directory would be written `~/work/Ursa/Ursa/…` per the
redaction rider.

```
L1   $WORK/L1/ursa-major/node_modules/diff/…        (real directory)
L2   $WORK/L2/ursa-major/node_modules -> $NM        (symbolic link)
L3   $WORK/L3/node_modules/diff/…                   (one level up)
     $WORK/L3/ursa-major/                           (no node_modules)
L4   $WORK/a/b/c/d/L4/ursa-major/node_modules/diff/…(real directory)
```

### 5.2 The bytes that differed, verbatim

Ten lines, which is the entire diff between L1's bundle and L2's. Taken
from `git diff --unified=0 -- dist/ursa.cjs` run in the L2 tree, five
pairs, abbreviated here to two pairs because the other three have the
same shape:

```diff
-// node_modules/diff/libesm/diff/base.js
+// ../../../../home/runner/work/Ursa/Ursa/ursa-major/node_modules/diff/libesm/diff/base.js
-  "node_modules/diff/libesm/diff/base.js"() {
+  "../../../../home/runner/work/Ursa/Ursa/ursa-major/node_modules/diff/libesm/diff/base.js"() {
-// node_modules/diff/libesm/index.js
+// ../../../../home/runner/work/Ursa/Ursa/ursa-major/node_modules/diff/libesm/index.js
-  "node_modules/diff/libesm/index.js"() {
+  "../../../../home/runner/work/Ursa/Ursa/ursa-major/node_modules/diff/libesm/index.js"() {
```

**Half of those lines are not comments, which the ledger entry got
wrong and this corrects.** The lines beginning `//` are comments. The
lines ending `"() {` are property keys in the module registry object
esbuild emits, and they are live source text. Here is the real context,
read out of `dist/ursa.cjs` at line 2473:

```js
var init_string = __esm({
  "node_modules/diff/libesm/util/string.js"() {
  }
});
```

The key is a label and nothing reads it, which is why rewriting it is
safe. It is also why two modules reduced to one key would be a genuine
defect rather than a cosmetic one: they would become two properties of
the same name in one object literal, and the second initializer would
silently replace the first. §6.4 shows that case refused.

### 5.3 Where the digest ends up

The committed index row for the canonical digest, from
`docs/provenance/bundle-digests.json`, unchanged by this run:

```json
{
  "digest": "d32543070474cc28",
  "sha256": "d32543070474cc28bdb8300c63791d28fda0b2d14dc5b588ab99cf363de6814d",
  "bytes": 201773
}
```

Three of the row's five fields are shown. The two omitted ones are
`blob`, the git object id of the committed artifact, and `introducedBy`,
a list of `{ commit, date, subject }` naming the commits that first
introduced these bytes. All five are generated by
`tools/make-bundle-digest-index.ts` and documented in
`docs/design/bundle-digest-index.md` §4.

---

## 6. Exact commands, and the numbers they produced

### 6.1 The measurement, before the change

The instrument is committed at
`ursa-major/tools/measure-bundle-layouts.sh`, so these numbers can be
reproduced rather than taken on trust. Its first argument is the
checkout whose `ursa-major/` is under test, which is how the pre-change
source was measured with the post-change tool:

```bash
cd /home/runner/work/Ursa/Ursa
git worktree add -q /tmp/before/repo 181596a
cd ursa-major
./tools/measure-bundle-layouts.sh /tmp/before/repo "$PWD/node_modules"
```

```
L1 node_modules/ real dir, in package          d32543070474cc28bdb8300c63791d28fda0b2d14dc5b588ab99cf363de6814d
L2 node_modules/ symlink out of tree           c23a2cc0037c233d273284b376b6af829b309204f8e545ccff5d0f80c398bf06
L3 node_modules/ hoisted to parent dir         743ca60a55a5444c9c0993f68fef52e204a0dd10d5bc6de7aad402792836f55a
L4 real dir, checkout 5 levels deeper          d32543070474cc28bdb8300c63791d28fda0b2d14dc5b588ab99cf363de6814d
```

### 6.2 The measurement, after the change

```bash
cd /home/runner/work/Ursa/Ursa/ursa-major
./tools/measure-bundle-layouts.sh
```

```
L1 node_modules/ real dir, in package          d32543070474cc28bdb8300c63791d28fda0b2d14dc5b588ab99cf363de6814d
L2 node_modules/ symlink out of tree           d32543070474cc28bdb8300c63791d28fda0b2d14dc5b588ab99cf363de6814d
L3 node_modules/ hoisted to parent dir         d32543070474cc28bdb8300c63791d28fda0b2d14dc5b588ab99cf363de6814d
L4 real dir, checkout 5 levels deeper          d32543070474cc28bdb8300c63791d28fda0b2d14dc5b588ab99cf363de6814d
```

### 6.3 The no-churn check, which is what keeps every index row valid

```bash
cd /home/runner/work/Ursa/Ursa/ursa-major
node build/bundle.mjs --check
```

```
dist/ursa.cjs is current (sha256 d32543070474cc28bdb8300c63791d28fda0b2d14dc5b588ab99cf363de6814d, 201,773 bytes)
```

The canonical layout hits `continue` on every candidate, so the function
returns its argument unchanged and the committed bytes do not move. That
is why this change needed no bundle rebuild, no index regeneration, and
no two-commit dance.

### 6.4 The test, and the proof that it fails without the fix

```bash
cd /home/runner/work/Ursa/Ursa/ursa-major
npx vitest run src/bundle-canonical.test.ts
```

```
 Test Files  1 passed (1)
      Tests  8 passed (8)
   Duration  273ms
```

A test that has never been seen to fail is a test of nothing, so the fix
was disabled behind a temporary environment variable, the integration
case was re-run, and the variable was removed:

```
AssertionError: expected '840e162334329d5e539a7d7bccb3cdf5decb1…'
                to be   'd32543070474cc28bdb8300c63791d28fda0b…'
  ❯ src/bundle-canonical.test.ts:144:23
```

`840e16…` is a **fifth** digest, distinct from all three in §1, because
vitest's `mkdtempSync` directory sits at a different depth again. The
failure is therefore slightly stronger evidence than the fix needed: the
digest tracked the absolute location of the temporary directory.

### 6.5 The whole suite

```bash
cd /home/runner/work/Ursa/Ursa/ursa-major
npm test
```

```
 Test Files  35 passed | 1 skipped (36)
      Tests  676 passed | 4 skipped (680)
   Duration  15.62s
```

`npm test` is `tsc --noEmit && vitest run`, so the TypeScript check is
included in that result.

---

## 7. Tooling

| Tool | Version | Its job here | Why it, over what else was considered |
|---|---|---|---|
| esbuild | `^0.28.0` in `package.json`, resolved to **0.28.2** by `ursa-major/package-lock.json` | Bundles `src/bin/bundle-entry.ts` and 19 dependency modules into one CommonJS file, and reports the paths it read in a metafile | Already the project's bundler; not replaced by this run. The metafile is the reason no alternative was considered: it is esbuild's own statement of which paths it annotated, which is what lets the rewrite be a list of exact strings instead of a regular expression guessing at the output |
| esbuild's `metafile: true` option | same | Supplies `inputs`, whose keys are exactly the strings the output carries | The rejected alternative was a regular expression such as `s#(\.\./)+.*node_modules/#node_modules/#g` over the finished bundle. It is one line shorter and it can match inside a string literal in the resolver's own source, which would corrupt the program silently. The metafile cannot, because it only names files esbuild opened |
| esbuild's `absWorkingDir` option | same | Nothing. Measured and refuted in §2 | Kept in this table because it was the ledger entry's proposed fix and a later reader needs to find the negative result, not just the positive one |
| Node.js | `v22`, the `target: 'node22'` the bundle is built for and the runtime `action.yml` invokes | Runs `build/bundle.mjs`, and runs the bundle itself | Not a choice this run made. Named because `String.prototype.split`/`Array.prototype.join`, which the rewrite uses instead of `replaceAll`, behave identically on every version in range and avoid `replaceAll`'s `$&` substitution semantics in the replacement string |
| vitest | `^5.0.2` | Runs `src/bundle-canonical.test.ts`, both halves | The project's existing runner. The integration half shells out to `process.execPath` with `execFileSync` rather than importing `build/bundle.mjs`, because importing it would run the build in the test's own working directory and write over the committed artifact |
| TypeScript | `^5.7.2`, in `--noEmit` mode | Type-checks the test against `build/canonicalize.d.mts` | The hand-written `.d.mts` is the deliberate choice here: compiling the build scripts to `.js` was the alternative, and it is wrong because `build/bundle.mjs` has to run on a bare `node` with nothing built |
| `sha256sum` (GNU coreutils) | whatever the runner ships; any implementation of SHA-256 agrees | Hashes each layout's bundle in `tools/measure-bundle-layouts.sh` | Chosen over `node -e` with `createHash` only to keep the harness a shell script with no startup cost per layout. The digests it prints are checked against `node build/bundle.mjs`'s own printed digest in §6.3, so the two implementations are cross-verified |
| `mktemp -d` and `git worktree add` | coreutils and git 2.x as shipped | Build each layout somewhere disposable, and produce the pre-change source tree without checking out a branch | `git stash` was the alternative for §6.1 and is worse: it would have required reverting the working tree mid-run, so a crash would have left the fix deleted |

---

## 8. Terms used above

- **Resolver digest** — the first sixteen hexadecimal characters of the
  SHA-256 of `ursa-major/dist/ursa.cjs`. Written into every record the
  GitHub Action produces as `task.resolvedBy.digest`.
- **Canonical layout** — the directory arrangement in which
  `node_modules/` is a real directory immediately inside `ursa-major/`.
  L1 and L4 in §1. It is what `npm install` run in `ursa-major/`
  produces and the only arrangement this repository's own checks have
  ever built in.
- **Hoisted `node_modules`** — an installation placed in a parent
  directory of the package that uses it, so Node finds it by walking
  upward. npm workspaces produce this. L3 in §1.
- **Annotated path** — the path esbuild writes into its output above
  each module it inlined, naming where it read that module from. Emitted
  twice per module: once as a `//` comment and once as a property key.
  See §5.2.
- **Module registry object** — the object literal esbuild passes to its
  own `__esm` or `__commonJS` helper, whose single property is the
  module's initializer function and whose property name is the annotated
  path. See the payload in §5.2.
- **Metafile** — a JSON structure esbuild returns when asked, whose
  `inputs` keys are the paths of every file the build read. The
  canonicalizer's list of rewrites is derived from it.
- **Tree-shaking** — dropping code no exported path reaches. It is why
  five of the nineteen inlined `diff` modules appear in the finished
  bundle and fourteen do not.
- **No-churn property** — that installing this change leaves
  `dist/ursa.cjs` byte-identical, so no committed digest, record, or
  index row changes value. Demonstrated in §6.3.

---

## 9. What this does not do

Three limits, named rather than left for a reader to discover.

1. **It does not make the build reproducible in general.** It removes
   one source of layout dependence: the annotated paths of inlined
   dependencies. An esbuild version change, a `diff` version change, or
   a different `node_modules` content still change the bytes, and should,
   because those are real differences in what runs. The claim this
   earns is narrower and exactly stated: two builds of one commit, from
   one lockfile, on one esbuild, now agree regardless of where the
   package's dependencies sit on disk.

2. **It does not verify the claim on a non-Linux filesystem.** Every
   number above was produced on the GitHub-hosted Linux runner. A
   case-insensitive filesystem, or Windows path separators in esbuild's
   annotations, would be a separate measurement. The ledger entry for
   that is not written, because this run has no machine to measure it
   on and a guess would be worse than the gap.

3. **It does not change what `bundle:check` says when it disagrees.**
   The script still reports a mismatching bundle as "stale", which after
   this change is a more honest word than it was, because the layout
   explanation has been removed. It is not yet the right word in every
   case: a bundle built from a different esbuild version is also not
   stale. That wording is a one-line change and deliberately not bundled
   into a run whose point was a measurement.
