# The digest every customer record carries, made into something you can look up

Engineer run, 2026-10-17. Ledger entry: "Every customer record names a
resolver by a digest nobody can look up" (`docs/ideas.md`, 2026-10-16
second run). Predecessor artifact: `docs/design/resolver-identity.md`,
which added the field this one makes followable.

Written to the engineering-artifact standard in
`prompts/engineer-agent.md`: a system diagram whose nodes are real files
(§2), interfaces as TypeScript signatures (§3), on-disk layouts with real
payloads (§4), the exact commands and what they printed (§5), a tooling
list with versions and rationale (§6), and a definition for every term
that is not self-explanatory (§7).

---

## 1. The defect, measured

`src/resolver-identity.ts` stamps every record with the code that made
its claims, in one of two bases. Its own header sells the difference:

> A `git_commit` basis is a pointer into a public history. A
> `bundle_digest` basis is a content hash with no history behind it. A
> consumer that wants only auditable records can select on the word.

The basis with a public history behind it is the one this repository
uses on itself, because `ursa run` executes `src/bin/ursa.ts` through
`tsx` inside a checkout of this repository. The basis with nothing behind
it is the one that ships: GitHub downloads an action as a tarball rather
than cloning it, so on a customer's runner there is no git work tree
under `$GITHUB_ACTION_PATH` and no HEAD to read. Every record written by
the Action is therefore stamped:

```json
"resolvedBy": { "basis": "bundle_digest", "digest": "d32543070474cc28" }
```

Sixteen hexadecimal characters, resolving to nothing a buyer can open.

**The history exists and was never published.** Measured on this branch,
before any of the code below was written:

```
$ git rev-list HEAD | wc -l
624
$ git rev-list HEAD | while read c; do
    git rev-parse -q --verify "$c:ursa-major/dist/ursa.cjs"
  done | sort -u | wc -l
18
```

Eighteen distinct versions of the resolver have existed in 624 commits,
every one of them a thing a consumer pinned to `@main` could have run and
been stamped by. The gap this closes is publication, not capture: nothing
was missing from the record and nothing was leaking out of it.

**The obvious walk is wrong, which is the one finding worth carrying
forward.** The ledger entry proposed `git log --follow` over the bundle
path. That walk returns 17 of the 18:

```
$ git log --format=%H --follow -- ursa-major/dist/ursa.cjs | wc -l
17
$ git log --format=%H -- ursa-major/dist/ursa.cjs | wc -l
18
```

The commit `--follow` drops is `e27bc68` ("Reconcile the resolver-Action
branch onto main"), a merge whose conflict resolution left bytes that no
parent of it had. `--follow` turns on rename detection, and with it a
history simplification that discarded that commit. The bundle it
introduced hashes to `61b24bb11ec7d243`, and an index built the obvious
way answers "no such resolver" to it.

**How reachable that particular miss is, stated rather than implied.**
Not very, and the entry should not be read as claiming a record exists
with that digest. Measured over the 162 commits on this repository's
first-parent chain, which is the sequence of tips `main` has actually
had:

```
$ git log --first-parent --format=%H main | wc -l
162
$ git log --first-parent --format=%H main | while read c; do
    git rev-parse -q --verify "$c:ursa-major/dist/ursa.cjs"
  done | sort -u | wc -l
10
```

Ten of the eighteen versions were ever the tip of `main`; `e27bc68`'s is
not one of them, because it sat on a branch that was merged. The other
eight are mostly a pull request that rebuilt the bundle twice before the
owner merged it — `f295522` and then `51ef074` on 2026-10-16, where only
the second reached `main`.

So the argument for the exhaustive sweep is not that eight digests are
loose in the wild. It is that the walk which produced seventeen rows
produced them by applying a heuristic about which commits "really"
changed a file, and an index whose job is to make a lookup total cannot
rest on a heuristic when the alternative costs half a second (§5.2).
What a digest resolves to has to be a fact about the object store, not a
consequence of a log flag.

---

## 2. System diagram, node by node

Six nodes and eight edges. Every node is a path in this repository or a
named external program. Every edge names the data that crosses it.

**Nodes.**

| Node | What it is | Where |
|---|---|---|
| `gitObjectStore` | This repository's own commit and blob objects, read through the `git` command-line program as a child process | `.git/` in the checkout, external binary version in §6 |
| `buildIndex` | The function that sweeps every commit reachable from HEAD and returns one row per distinct version of the bundle | `ursa-major/tools/bundle-digest-index.ts` |
| `makeIndexCli` | The command line around it: write the files, check them, or look a digest up | `ursa-major/tools/make-bundle-digest-index.ts` |
| `indexJson` | The published machine-readable index, committed to this repository | `docs/provenance/bundle-digests.json` |
| `indexMd` | The published human-readable table, generated from the same rows | `docs/provenance/bundle-digests.md` |
| `indexTest` | The five assertions that fail `npm test` when either file stops matching history | `ursa-major/src/provenance-index.test.ts` |

**Edges.**

| From | To | Data crossing the edge |
|---|---|---|
| `buildIndex` | `gitObjectStore` | the argument vector `['-C', <root>, 'rev-list', '--parents', 'HEAD']`, then `['-C', <root>, 'log', '--format=%H%x00%cI%x00%s%x00', 'HEAD']`, then one `['-C', <root>, 'cat-file', '--batch-check']` process fed `<commit>:ursa-major/dist/ursa.cjs` on stdin once per commit, then `['-C', <root>, 'cat-file', 'blob', <blob oid>]` once per distinct blob |
| `gitObjectStore` | `buildIndex` | four streams on stdout: commit object ids with their parents, one line each; commit object id, ISO-8601 committer date with offset, subject line, NUL-separated; `<blob oid> blob <size>` or `<query> missing`, one line per query in input order; and the bundle's raw bytes as a `Buffer` |
| `buildIndex` | `makeIndexCli` | `BundleDigestIndex`, the interface in §3 |
| `makeIndexCli` | `indexJson` | `JSON.stringify(index, null, 2)` plus a trailing newline, written with `writeFileSync` |
| `makeIndexCli` | `indexMd` | the same rows rendered as a GitHub-flavoured markdown table by `renderMarkdown`, plus four prose sections it generates verbatim |
| `indexJson` | `makeIndexCli` | the committed file read back as `BundleDigestIndex` by `--lookup`, which answers from the published artifact and never from history |
| `buildIndex` | `indexTest` | the freshly derived `BundleDigestIndex`, compared against the committed bytes of both files |
| `src/resolver-identity.ts` | `indexTest` | `ResolverIdentity`, computed by the product's own `resolverIdentity()` over a copy of HEAD's bundle placed outside any git work tree, so the digest the test looks up is the digest a customer's record would carry rather than a second hash computed by the test |

**The edge that does not exist, deliberately.** Nothing in `src/` imports
anything in `tools/`. The index is a published artifact about the
resolver, not a part of it: `dist/ursa.cjs` must run on a runner with no
git history beside it, so a resolver that consulted this index could not
work in the one place it matters. The only link in the other direction is
the test, which imports `resolverIdentity` to check that the two agree.

---

## 3. Interfaces, as the signatures a caller writes against

```ts
// ursa-major/tools/bundle-digest-index.ts

/** Path of the resolver artifact, relative to the repository root. */
export const BUNDLE_PATH = 'ursa-major/dist/ursa.cjs'
export const INDEX_JSON = 'docs/provenance/bundle-digests.json'
export const INDEX_MD = 'docs/provenance/bundle-digests.md'

export interface IndexCommit {
  commit: string    // full 40-character commit object id
  date: string      // committer date, normalized to UTC: 2026-10-16T01:45:39.000Z
  subject: string   // the commit's subject line
}

export interface BundleDigestRow {
  digest: string            // the 16 characters `task.resolvedBy.digest` carries
  sha256: string            // the full 64-character hash
  blob: string              // git blob object id: `git cat-file blob <blob>`
  bytes: number             // size of the bundle
  introducedBy: IndexCommit[]   // commits holding this blob while no parent does
}

export interface BundleDigestIndex {
  generatedBy: string       // the regeneration command, carried in the file
  path: string              // BUNDLE_PATH
  rows: BundleDigestRow[]   // oldest introduction first
}

export function repoRoot(cwd?: string): string | null
export function historyUnavailable(root: string): string | null
export function buildIndex(root: string): BundleDigestIndex
export function renderJson(index: BundleDigestIndex): string
export function renderMarkdown(index: BundleDigestIndex): string
```

Three of these signatures carry a decision worth stating.

**`repoRoot` and `historyUnavailable` both return `string | null`, and
the `null` means opposite things.** `repoRoot` returns `null` for failure
(not inside a work tree) and a path for success. `historyUnavailable`
returns `null` for success and a sentence for failure, because the
failure is the thing a caller has to print. The sentence is the whole
value: a skip whose reason is not shown is indistinguishable from a check
that passed.

**`introducedBy` is an array, not an `IndexCommit`.** A row is keyed by
content, and content can be introduced twice: a revert restores an
earlier bundle, and the commit that restores it is as much an answer to
"when did this code run" as the original. Collapsing that to one commit
would make the second window invisible.

**`renderJson` and `renderMarkdown` return the file's exact bytes rather
than writing them.** Writing and checking then cannot disagree about
whitespace, because `--check` compares against the same string `--write`
would have written. This is the shape `tools/make-violation-fixtures.ts`
already uses for the violation fixtures.

---

## 4. On-disk layout, with real payloads

```
docs/provenance/
├── README.md                 # what this directory is
├── bundle-digests.json       # 18 rows, the machine-readable index
└── bundle-digests.md         # the same rows as a table, generated

ursa-major/
├── tools/bundle-digest-index.ts        # buildIndex and the renderers
├── tools/make-bundle-digest-index.ts   # --check, --lookup, and writing
└── src/provenance-index.test.ts        # five assertions, run by npm test
```

**`docs/provenance/bundle-digests.json`, verbatim from the committed
file: its first row, its third, and its last, with the other fifteen cut
for length.** The third is the commit `--follow` dropped; it is in the
file because the sweep in §2 does not take git's word for which commits
mattered.

```json
{
  "generatedBy": "ursa-major/tools/make-bundle-digest-index.ts (npm run provenance:bundles)",
  "path": "ursa-major/dist/ursa.cjs",
  "rows": [
    {
      "digest": "a4063468ef71edd9",
      "sha256": "a4063468ef71edd9043a49ed240f8bbe1c129b5ad04b616bcca858243739d886",
      "blob": "3c4e67baa71f1daf4235d4a65841dcf43749ed5b",
      "bytes": 74545,
      "introducedBy": [
        {
          "commit": "cdba4813f6a73aa8f450f80119899d07dc61c233",
          "date": "2026-10-05T03:39:36.000Z",
          "subject": "feat(ursa-major): ursa ci — the resolver's CI launch, and a one-file bundle"
        }
      ]
    },
    {
      "digest": "61b24bb11ec7d243",
      "sha256": "61b24bb11ec7d243e7a42f5cd981b09055998fc399c346da179eb12986349f41",
      "blob": "c52bbd4abdab068f2d9e10b7743fb452f0d55adb",
      "bytes": 166859,
      "introducedBy": [
        {
          "commit": "bc004b9a3c82ef5ef72a4cd5347b5229f584df4d",
          "date": "2026-10-08T03:05:13.000Z",
          "subject": "Reconcile the resolver-Action branch onto main (subsumes #92, #126, #130)"
        }
      ]
    },
    {
      "digest": "d32543070474cc28",
      "sha256": "d32543070474cc28bdb8300c63791d28fda0b2d14dc5b588ab99cf363de6814d",
      "blob": "b9b015688eee7600dc2579b12a93ddfa333569c4",
      "bytes": 201773,
      "introducedBy": [
        {
          "commit": "f2a9048e4c24a742e5ae144399c2c8fce99a58ec",
          "date": "2026-10-16T01:45:39.000Z",
          "subject": "gate: the bound set on both surfaces a reader sees, and the bundle"
        }
      ]
    }
  ]
}
```

**Nothing in this file is identifying, and that was checked rather than
assumed.** Every string in it is already public in this repository's git
history: commit object ids, commit subjects written by this project's own
seats, blob object ids, byte counts and hashes of a committed file. There
is no filesystem path outside the repository, no username, and no record
identifier. The redaction rider in `prompts/engineer-agent.md` applies to
the owner's filesystem and to private record identities, and this
artifact touches neither.

**The record field this index resolves, which is the other end of the
chain.** `src/bundle-exec.test.ts` runs the committed bundle from a
temporary directory with no git work tree above it — the tarball case a
customer's runner is in — and asserts the record it writes carries

```json
"resolvedBy": { "basis": "bundle_digest", "digest": "d32543070474cc28" }
```

together with the terminal line `resolver bundle sha256:d32543070474cc28`.
That digest is the last row above.

---

## 5. Exact commands, and the numbers they produced

### 5.1 Generating the index

```
$ cd ursa-major && npm run provenance:bundles
wrote docs/provenance/bundle-digests.json and docs/provenance/bundle-digests.md: 18 versions of ursa-major/dist/ursa.cjs, oldest 2026-10-05T03:39:36.000Z, newest 2026-10-16T01:45:39.000Z.
```

### 5.2 Checking it, which is what `npm test` does

```
$ cd ursa-major && npm run provenance:bundles:check
docs/provenance/bundle-digests.json and docs/provenance/bundle-digests.md match history: 18 versions of ursa-major/dist/ursa.cjs.
```

Three consecutive runs timed with `/usr/bin/time -f "%e s"`: 0.52 s,
0.53 s, 0.52 s, inclusive of `tsx` process startup. The whole cost is two
`git` processes for the graph, one `git cat-file --batch-check` for 624
tree lookups, and 18 `git cat-file blob` reads.

### 5.3 The lookup, which is the thing a buyer runs

```
$ npx tsx tools/make-bundle-digest-index.ts --lookup d32543070474cc28
digest   d32543070474cc28  (sha256 d32543070474cc28bdb8300c63791d28fda0b2d14dc5b588ab99cf363de6814d)
bytes    201,773
blob     b9b015688eee7600dc2579b12a93ddfa333569c4   # git cat-file blob b9b015688eee7600dc2579b12a93ddfa333569c4
commit   f2a9048e4c24a742e5ae144399c2c8fce99a58ec
date     2026-10-16T01:45:39.000Z
subject  gate: the bound set on both surfaces a reader sees, and the bundle
```

A prefix of at least four hexadecimal characters is accepted, so a digest
quoted in prose resolves too:

```
$ npx tsx tools/make-bundle-digest-index.ts --lookup db8ebdf7
digest   db8ebdf738fc759a  (sha256 db8ebdf738fc759a33ec1ef4605d73ccf0d100145ede24560d6bcabb6e747617)
...
commit   eabc6b7460eac7c8f175983762f3a3124e3b2dae
date     2026-10-08T03:11:34.000Z
subject  The empty-window sentence was asserting a cause it had not checked
```

A digest with no row exits 1 and says what it knows, rather than printing
nothing:

```
$ npx tsx tools/make-bundle-digest-index.ts --lookup deadbeef
no version of ursa-major/dist/ursa.cjs has a SHA-256 starting deadbeef.
18 versions are indexed, from 2026-10-05T03:39:36.000Z to 2026-10-16T01:45:39.000Z.
A digest with no row is either from a build newer than this checkout, or from a fork.
```

### 5.4 The suite, before and after

Both measured on a GitHub-hosted runner, in a clean clone with its own
`npm install`, since a `node_modules` symlinked from elsewhere changes
the bundle's bytes (see §8).

```
main at 53d693d:   Test Files  33 passed | 1 skipped (34)
                        Tests  663 passed | 4 skipped (667)

this branch:       Test Files  34 passed | 1 skipped (35)
                        Tests  668 passed | 4 skipped (672)
```

Five new tests, 18.57 s for the whole suite, `tsc --noEmit` clean.

### 5.5 Proving the new tests are sharp, by breaking things

**Break the committed index.** One field of one row edited by hand:

```
$ python3 -c "import json;p='../docs/provenance/bundle-digests.json';d=json.load(open(p));d['rows'][0]['bytes']=1;json.dump(d,open(p,'w'),indent=2)"
$ npm run provenance:bundles:check
drifted: docs/provenance/bundle-digests.json
1 of 2 files differ from what this repository's history says.
Run: npm run provenance:bundles
$ npx vitest run src/provenance-index.test.ts
      Tests  1 failed | 4 passed (5)
```

**Break the walk, by using the one the ledger entry proposed.** In a
scratch clone, `buildIndex` was changed to feed `blobsAtPath` the output
of `git log --follow` instead of every reachable commit. The suite names
the row that disappears:

```
 × is what this repository's history says it is, in both files
AssertionError:
-       "digest": "61b24bb11ec7d243",
-       "blob": "c52bbd4abdab068f2d9e10b7743fb452f0d55adb",
-       "commit": "bc004b9a3c82ef5ef72a4cd5347b5229f584df4d",
-       "subject": "Reconcile the resolver-Action branch onto main (subsumes #92, #126, #130)"
```

**Rebuild the bundle without regenerating the index**, which is the one
failure a contributor will actually hit. In a scratch clone of this
branch, one line appended to `dist/ursa.cjs` and committed:

```
$ npm run provenance:bundles:check
drifted: docs/provenance/bundle-digests.json
drifted: docs/provenance/bundle-digests.md
2 of 2 files differ from what this repository's history says.
HEAD rebuilt the bundle (digest 708dcb4578b8c2d5), so this is the expected failure between the two commits.
Run: npm run provenance:bundles
$ npm run provenance:bundles && npm run provenance:bundles:check
wrote ... 19 versions of ursa-major/dist/ursa.cjs ...
docs/provenance/bundle-digests.json and docs/provenance/bundle-digests.md match history: 19 versions of ursa-major/dist/ursa.cjs.
$ git diff --stat
 docs/provenance/bundle-digests.json | 13 +++++++++++++
 docs/provenance/bundle-digests.md   |  5 +++--
```

**Take the history away**, which is the case that must not fail. A
`--depth 1` clone of this repository:

```
$ git clone --depth 1 file:///path/to/Ursa shallow && cd shallow/ursa-major
$ npx tsx tools/make-bundle-digest-index.ts --check
skipped: this is a shallow clone, so the commits the index names are not all present (clone with fetch-depth: 0)
$ echo $?
0
$ npx vitest run src/provenance-index.test.ts
      Tests  5 skipped (5)
```

### 5.6 The rule this creates, stated as a command sequence

A commit cannot index its own bundle, because a row names a commit hash
that does not exist until the commit is made. Rebuilding the resolver is
therefore two commits in one pull request:

```
$ npm run bundle && git add dist/ursa.cjs && git commit -m "rebuild the bundle"
$ npm run provenance:bundles && git add ../docs/provenance && git commit -m "index the rebuild"
```

Between them `npm test` fails and names the digest that has no row, which
is §5.5's third probe. This is the same recursion `build/bundle.mjs`
refuses from the other side: it declines to bake HEAD into the bundle,
because then every commit would need a rebuild that changes the commit.

---

## 6. Tooling

Versions resolved in this branch's `ursa-major/node_modules`, read with
`node -e "console.log(require('<pkg>/package.json').version)"`, with the
declared range beside it where the two differ.

| Tool | Version | Its job here | Why it, over what was considered |
|---|---|---|---|
| `git` | 2.55.0, measured with `git --version` on the GitHub-hosted runner that produced every number above. Not pinned: the tool takes whatever is on `PATH` | four subcommands — `rev-parse --show-toplevel`, `rev-list --parents HEAD`, `log --format`, and `cat-file` in both `--batch-check` and single-blob forms | the index is a statement about git objects, and `src/vendored.ts`, `src/corroborate.ts` and `src/resolver-identity.ts` already shell out to the same binary with the same `execFileSync` and `stdio: ['ignore','pipe','ignore']` pattern. `isomorphic-git` would add a dependency to read object ids this repository already reads this way |
| `git cat-file --batch-check` | same binary, the batch form specifically | resolves `<commit>:ursa-major/dist/ursa.cjs` for all 624 commits in one process | the obvious loop is `git rev-parse <commit>:<path>` once per commit, which is 624 process spawns and about a second of pure overhead. The batch form reads the same trees in one process and reports `missing` for commits from before the file existed, which is how commits are excluded rather than by a date cutoff |
| `node:crypto`, `createHash('sha256')` | the standard library of node 22.23.3, the node that ran every command above | hashes each distinct bundle blob | it must be SHA-256 and it must hash bytes, because the number has to equal the one `resolverIdentity()` puts in a record (`createHash('sha256').update(readFileSync(scriptPath))`) and the one `build/bundle.mjs` prints. A cheaper non-cryptographic hash would be a different number from both |
| `tsx` | 4.23.15 (declared `^4.19.2`) | runs both tool files, which are TypeScript and are not compiled | every other script in `ursa-major/tools/` is run this way, and the alternative of a `.mjs` tool would give up the `BundleDigestIndex` types that `tsc --noEmit` checks through the test's import |
| `vitest` | 5.0.2 (declared `^5.0.2`) | runs the five new assertions inside `npm test` | unchanged by this work. `describe.skipIf` is used for the shallow-clone case, with the reason interpolated into the suite's name because vitest's default reporter prints neither the name nor the stdout of a skipped file |
| `typescript` | 5.9.3 (declared `^5.7.2`) | `tsc --noEmit`, which reaches `tools/bundle-digest-index.ts` through the test's import even though `tsconfig.json` includes only `src` | unchanged by this work. §8 records that the CLI half is not reached this way |
| `esbuild` | 0.28.2 (declared `^0.28.0`) | builds the artifact being indexed | unchanged by this work, named because its inlined `// node_modules/...` path comments are why §8's reproducibility caveat exists |
| `diff` | 8.0.4 (declared `^8.0.2`) | not used here; it is the one third-party package esbuild inlines into the bundle | named because it is the reason the bundle's bytes depend on where `node_modules` resolves from (§8) |

---

## 7. Terms used above

| Term | Definition in this document |
|---|---|
| bundle | `ursa-major/dist/ursa.cjs`, the single CommonJS file `action.yml` executes with the runner's own node. Committed to this repository rather than built on the runner |
| digest | The first 16 lowercase hexadecimal characters of the SHA-256 of the bundle's bytes. The value of `task.resolvedBy.digest` in a record |
| blob object id | Git's own 40-character name for a file's content, printed by `git hash-object` and readable with `git cat-file blob`. Not the same number as the digest: git prefixes a header before hashing, and uses SHA-1 in this repository |
| row | One entry in the index: one distinct version of the bundle, with its digest, its full hash, its blob object id, its byte count, and the commits that introduced it |
| introduced by | A commit that holds this version of the bundle while none of its parents do. The branch commit where the bundle was rebuilt, not the merge that brought it to `main` |
| reachable from HEAD | Every commit in the transitive closure of HEAD's parents, which is what `git rev-list HEAD` prints. 624 commits in this checkout |
| history simplification | Git's default rule for deciding which commits a path-filtered `git log` shows. It can omit a merge whose content differs from its parents when `--follow` is also given, which is §1's finding |
| shallow clone | A checkout fetched with a depth limit, `actions/checkout`'s default being `fetch-depth: 1`. The commits an index names are absent from one, which is why the check skips rather than fails |
| the tarball case | A customer's runner, where GitHub unpacks the Action as files with no `.git` beside them. The only case that produces a `bundle_digest` basis |
| `--check` | The mode that rebuilds the index into memory and compares it to the committed files, exiting 1 on any difference. Named for the identical mode on `build/bundle.mjs` and `tools/make-violation-fixtures.ts` |

---

## 8. What this does not do

**It does not make the Action pinnable.** A consumer still writes
`uses: alexandrapaiz/Ursa/ursa-major@main` and still gets whatever the
resolver is that day. This index tells them afterwards which one ran. The
"before" half is a separate open ledger entry, "A consumer cannot pin the
resolver, because the only reference this project offers is a branch"
(2026-10-16, second run), whose first step is a paragraph in `action.yml`
and not a tag.

**It does not index the bound set.** A record carries two identifiers
that need looking up, `task.resolvedBy` and `task.gatedBy.boundsDigest`.
This file answers "which code ran". The other, "which rules applied", is
the open ledger entry "A digest says the rules differ and nothing says
which rule moved" (2026-10-16). They share a mechanism and are two
columns of one generated table if both are built.

**It does not ship inside the resolver.** `dist/ursa.cjs` cannot read
this index, because on a customer's runner there is no repository to read
it from. The lookup is for someone holding a record afterwards.

**It does not make the bundle's bytes a pure function of its source, and
this work is how that was found.** Running `node build/bundle.mjs` in a
clone whose `node_modules` is a symlink to another checkout produced
`c23a2cc0037c233d` where the committed bundle is `d32543070474cc28`,
failing `bundle:check` with 10 changed lines, all of them esbuild's
inlined path comments:

```
-// node_modules/diff/libesm/diff/base.js
+// ../../../../home/runner/work/Ursa/Ursa/ursa-major/node_modules/diff/libesm/diff/base.js
```

So the digest identifies the artifact that ran, exactly as claimed, but
two builds of identical source can carry different digests if their
`node_modules` resolves from different places. Nothing in this index is
wrong because of it, and the index gains a row rather than losing one.
It was recorded as a ledger entry of its own, with a one-line first step
(`absWorkingDir` on the esbuild call) and a measurement to prove it
worked.

**Resolved the same day, and the one-line first step was wrong.**
`absWorkingDir` changed nothing, because `build/bundle.mjs` already runs
with the package directory as its working directory in every layout, so
the option was being set to the value it already had. The measurement
also found a third digest this paragraph did not know about: a
`node_modules` hoisted to the parent directory, which is what npm
workspaces produce, gives `743ca60a55a5444c`. What fixed it is
`build/canonicalize.mjs`, which rewrites the annotated paths to the
`node_modules/…` suffix esbuild's own metafile names. The numbers, the
refutation, and the limits of the claim are in
[`docs/provenance/bundle-reproducibility.md`](../provenance/bundle-reproducibility.md).
No digest in the table above changed value, because the fix is a no-op
in the layout this repository builds in.

**It does not say whether a version was ever released, and that is a
decision rather than an omission.** The natural extra column is "was this
the tip of `main`, and when", which §1 measures as ten of the eighteen.
It is not in the file because the answer moves. The earliest first-parent
commit holding a blob is the branch commit while the branch is open and
the merge commit afterwards, so a row generated on a branch that rebuilds
the bundle would become wrong the moment the owner merged it, and the
next seat's `npm test` would fail on a file nobody touched. A derived
file that gates the suite has to be a function of history that merging
does not change. The measurement stays in prose, where a reader can date
it.

**It does not cover forks.** Every row comes from commits reachable from
this repository's HEAD. A digest produced by a fork's rebuild resolves to
nothing here, and `--lookup` says so in those words rather than implying
the resolver never existed.
