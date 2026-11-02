# What merging a row actually does to the trunk's text, and the empty string that inverted this seat's answer

Engineer seat, 2026-11-02. Written to the engineering-artifact standard in
`prompts/engineer-agent.md`. Every number below was measured on this
repository during the run that produced it; nothing here is cited from a
lesson without being re-measured.

## 1. The incident, because the tool is shaped by it

At 07:0xZ this seat held a severe finding: **four of its five open pull
requests reverted a security fix that had landed on `main` at 05:15Z.** The
fix was commit `d0ff18dc`, by the `ursa-security` seat, scoping
`tools/root-entries.test.mjs` to `HEAD` so the test stops going red over
other seats' unmerged branches. The finding said pull requests 665, 679,
685 and 694 each carried the superseded version of that file, and that
git's three-way merge would take the branch's side and silently undo it.

The finding was false. All four branches hold blob
`e777ba913cba56988b335341b1b7973f60e6d26b` for that path, and so does each
branch's real merge base. The branches never touched the file. `main`
changed it after their branch points, which is the definition of a branch
**lagging** the trunk, and a three-way merge keeps the trunk's text.

### 1.1 How a shallow clone produced a confident wrong answer rather than an error

The clone this run was handed was shallow and single-branch, which is the
normal shape here. The commands were:

```sh
MB=$(git merge-base origin/main refs/prs/694)
git rev-parse "$MB:tools/root-entries.test.mjs"
```

1. `git merge-base` finds no common ancestor in a shallow clone. It prints
   **nothing** and exits 1. This was one line of a compound command with no
   `set -e` in force, so nothing stopped.
2. `MB` became the empty string. The second line therefore ran as
   `git rev-parse ":tools/root-entries.test.mjs"`.
3. **A leading colon is git's syntax for the index.** So git answered, at
   exit 0, with the blob this working copy had staged.
4. In a seat's clone the index equals the trunk. So the laundered value was
   not noise. It was **the trunk's blob wearing the merge base's name.**

That last step is the whole mechanism, and it is sharper than "a shallow
clone gives wrong answers". Substitute the trunk for the base in the
ordinary three-way comparison and look at what happens to each class:

| What is true of a path | `branch != base` with the real base | `branch != base` with the trunk standing in as base |
|---|---|---|
| The branch never touched it and the trunk moved it | false, so **LAGS** | **true**, so it reads as a file the branch rewrote |
| Only the branch moved it | true, so **REWRITES** | true, unchanged |
| Both sides moved it | true, so **BOTH_MOVED** | true, unchanged |

The error is one-directional. **Every lagging file becomes a rewriting
file, and no rewriting file becomes a lagging one.** A shallow clone does
not degrade this verdict; it inflates it, in the direction that
manufactures alarm, on every file at once. Pull request 665 differs from
`origin/main` in 139 files of which 134 merely lag, so the inflation
available in one row of today's queue is 134 false accusations.

### 1.2 What was already written down, and what was not

Nothing was missing from the diagnosis. `tools/ensure-full-clone.sh`
repairs the clone, its header names the empty-substitution hazard, and
`tools/ensure-full-clone.test.mjs:121` already asserts, by name, that
`$base:path` becomes `:path` and that git reads it as the index.

What was missing is that **the hazard is only avoided by a caller who
remembers the hazard, and the thing it defeats is a caller's memory.** This
seat's charter, unlike `prompts/exo-agent.md` §0, does not open with the
repair. So the design decision here is not another warning. It is to remove
the empty string from the type: `mergeBase` returns a commit or a named
fault, and there is no value it can return that a later
`git rev-parse "$base:path"` will read as the index.

## 2. The system, node by node and edge by edge

Every node below is a real file or process in this repository, named as it
is named on disk. Every edge carries a named type or file format, not a
verb.

**Stores (state that already exists in a checkout)**

- `.git/shallow` — a file of 40-character hexadecimal commit ids, one per
  line, present only in a truncated clone. Its presence is what
  `git rev-parse --is-shallow-repository` answers `true` on.
- `.git/config`, key `remote.origin.fetch` — one or more refspec strings.
  The complete value is `+refs/heads/*:refs/remotes/origin/*`; the value a
  seat is handed is `+refs/heads/main:refs/remotes/origin/main`.
- `.git/objects/**` — git's object database, holding the commit and blob
  objects every edge below reads.

**Processes and modules**

- `git` (process, version 2.43.0) — the only reader of the three stores.
- `tools/ensure-full-clone.sh` (bash script, already on `main`) — the only
  writer in this diagram. It writes `remote.origin.fetch` and new objects
  under `.git/objects`, and nothing else.
- `tools/stack/base.mjs` (ES module, new) — the merge base and blob reads
  as values that are present or faulted, never empty.
- `tools/stack/lag-or-rewrite.mjs` (ES module and CLI, new) — the
  classifier, and the only node that produces a per-path verdict.
- `tools/stack/lag-or-rewrite.test.mjs` (node:test suite, new) — builds
  throwaway repositories under the system temporary directory and drives
  every class and every fault through them.

**Edges, with the data that crosses each**

| From | To | What crosses it |
|---|---|---|
| `.git/shallow` and `.git/config` | `git` | the file's presence, and the refspec strings |
| `git` | `base.mjs::cloneGaps` | `stdout` of `rev-parse --is-shallow-repository` (the literal `true` or `false`) and of `config --get-all remote.origin.fetch` |
| `base.mjs::cloneGaps` | `base.mjs::mergeBase` | `string[]`, one human-readable line per incompleteness, empty when complete |
| `git` | `base.mjs::mergeBase` | `stdout` of `merge-base <a> <b>`: a 40-character commit id, or the empty string |
| `base.mjs::mergeBase` | `lag-or-rewrite.mjs::classify` | `{base: string}` or `{fault: Fault}` — never `{base: ''}` |
| `git` | `base.mjs::blobsAt` | `stdout` of `cat-file --batch-check`, one line per input of the form `<oid> blob <size>` or `<spec> missing` |
| `base.mjs::blobsAt` | `lag-or-rewrite.mjs::classify` | `{oids: (string \| null)[]}`, index-aligned with the `{rev, path}[]` it was given |
| `git` | `lag-or-rewrite.mjs::classify` | `stdout` of `diff --name-only -z <trunk> <branch>`, NUL-separated repository-relative paths |
| `git` | `lag-or-rewrite.mjs::supersededBlobs` | `stdout` of `rev-list <trunk> -- <path>`, newest-first commit ids |
| `lag-or-rewrite.mjs::classify` | the CLI's `stdout`, or `stderr` on exit 1 | `Row[]` rendered one path per two-to-four lines, or the same as JSON under `--json` |
| `base.mjs::mergeBase` fault | the CLI's `stderr` | the fault's `code`, `line` and `repair`, then exit 2 |
| the fault's `repair` | `tools/ensure-full-clone.sh` | the literal string `bash tools/ensure-full-clone.sh`, for a human to run |

There is **no edge from any node here into any store.** The classifier does
not fetch, merge, stage, or write. That is deliberate: the fault it reports
is one fetch away from fixed, and the fetch belongs in a script a reader can
see and refuse rather than inside a read-only instrument.

## 3. Interfaces at every component boundary

These are the signatures a caller writes against. They are TypeScript
renderings of the JSDoc on the two modules, which are plain ES modules.

```ts
// tools/stack/base.mjs
type FaultCode =
  | 'GIT_UNUSABLE'          // git would not run, or this is not a repository
  | 'NO_SUCH_REV'           // one of the two revs does not resolve here
  | 'INCOMPLETE_CLONE'      // shallow, or single-branch, or both
  | 'UNRELATED_HISTORIES'   // a complete clone, and they really do not meet
  | 'EMPTY_REV';            // a caller passed '' , which git reads as the index

interface Fault {
  code: FaultCode;
  line: string;    // the one cause that fired, in a sentence
  repair: string;  // the repair for THAT cause, not a general warning
}

declare function cloneGaps(root: string): string[];
declare function mergeBase(root: string, a: string, b: string):
  { base: string } | { fault: Fault };
declare function blobAt(root: string, rev: string, path: string):
  { oid: string | null } | { fault: Fault };   // oid null = absent at that rev
declare function blobsAt(root: string, specs: { rev: string; path: string }[]):
  { oids: (string | null)[] } | { fault: Fault };  // index-aligned with specs
declare function git(root: string, args: string[]):
  { status: number; stdout: string; stderr: string };  // never throws
```

```ts
// tools/stack/lag-or-rewrite.mjs
type Class = 'LAGS' | 'REWRITES' | 'BOTH_MOVED' | 'RESURRECTS';
type Effect = 'adds' | 'deletes' | 'edits';   // what merging does to the path's existence

interface Row {
  path: string;            // repository-relative
  cls: Class;
  effect: Effect;
  base: string | null;     // blob id at the merge base, null when absent there
  trunk: string | null;
  branch: string | null;
  supersededBy?: string;   // present only on RESURRECTS: '<%h> <%cI> <%an> <%s>'
  history?: string;        // present only when the RESURRECTS walk abstained
}

declare function classify(root: string, trunk: string, branch: string):
  | { base: string; rows: Row[]; abstained: { path: string; why: string }[] }
  | { fault: Fault };

declare function supersededBlobs(root: string, trunk: string, path: string, cap?: number):
  | { superseded: Map<string, string> }   // blob id -> the trunk commit that REPLACED it
  | { capped: number };                   // the path's trunk history is over the cap

declare function describeCommit(root: string, rev: string): string;

declare const HISTORY_CAP: 5000;
```

### 3.1 The four classes, each defined here rather than named

For a path that differs between `trunk` and `branch`, with `base` the real
merge base of the two:

| Class | The condition that defines it | What merging does | Needs a decision |
|---|---|---|---|
| `LAGS` | the branch's blob equals the base's blob, and the trunk's does not | keeps the trunk's text; the branch is not a claim about this path at all | no |
| `REWRITES` | the branch's blob differs from the base's, and the trunk's blob equals the base's | lands the branch's text verbatim | read the diff once |
| `BOTH_MOVED` | both the branch's and the trunk's blob differ from the base's | a real three-way merge, which the driver or a human will see | yes, and git will say so |
| `RESURRECTS` | the branch's blob is a blob this path **held on the trunk** and the trunk has since moved past | reverts that trunk commit's change to this path, with no conflict marker | yes, and nothing else will say so |

`RESURRECTS` is the only class that exits 1, because it is the only one
where `gh pr view` reporting `MERGEABLE` and the merge being safe come
apart with nobody told. A reviewer reading `git diff trunk..branch` sees
the same hunk for `REWRITES` and for `RESURRECTS`; what distinguishes them
is not in the diff. It is whether that exact content was on the trunk
before and lost an argument there. So the `RESURRECTS` line names the trunk
commit that replaced it, with author and date, which turns the judgement
into a sentence instead of an investigation.

`effect` is carried separately from `cls` because the class does not say
whether the path exists on each side. A `REWRITES` row for a path the trunk
does not have is a new file; a `REWRITES` row for a path the branch does
not have **removes a file from the trunk**. Those are not the same review
and they printed identically until `effect` was added.

## 4. Exact commands

The literal invocations, with real flags. The first two are preconditions a
reader runs; the rest are this artifact's own.

```sh
# Precondition. Without it every command below answers from a truncated graph.
bash tools/ensure-full-clone.sh
bash tools/ensure-full-clone.sh --check          # exit 1 when a repair is needed

# Pull request heads are not branches, so they are fetched by name.
git fetch origin '+refs/pull/*/head:refs/prs/*' --quiet

# The classifier.
node tools/stack/lag-or-rewrite.mjs                      # HEAD against origin/main
node tools/stack/lag-or-rewrite.mjs refs/prs/694         # one queue row
node tools/stack/lag-or-rewrite.mjs --base origin/main refs/prs/694
node tools/stack/lag-or-rewrite.mjs --all refs/prs/694   # list the LAGS paths too
node tools/stack/lag-or-rewrite.mjs --json refs/prs/694

# The suite. 19 tests, 6 suites, no network, every fixture built and removed.
node --test tools/stack/lag-or-rewrite.test.mjs

# The two git reads the classifier is built on, if you want to check it by hand.
git merge-base origin/main refs/prs/694
git diff --name-only -z origin/main refs/prs/694 | tr '\0' '\n'
printf '%s\n' "$(git merge-base origin/main refs/prs/694):tools/root-entries.test.mjs" \
  | git cat-file --batch-check
```

Exit codes: **0** nothing on the branch moves a tracked path back to
superseded trunk text. **1** at least one path does, and each is named with
the commit it would revert. **2** the comparison could not be established,
which is never reported as clean.

## 5. The on-disk layout

The classifier writes nothing. What follows is the layout it **reads**, and
the one payload it emits on stdout.

```
<your-checkout>/
  .git/shallow                  # 40-hex commit ids, one per line. Absent in a complete clone.
  .git/config                   # the refspec, under [remote "origin"]
  tools/ensure-full-clone.sh    # the repair, already on main
  tools/stack/base.mjs          # new, 265 lines
  tools/stack/lag-or-rewrite.mjs        # new, 303 lines, the CLI
  tools/stack/lag-or-rewrite.test.mjs   # new, 19 tests
  docs/design/lag-or-rewrite.md         # this file
```

`.git/shallow`, verbatim, from a clone made with `--depth 1` of this
repository on 2026-11-02:

```
b79fd891facbee8b243bbfdccf3725bdabfb56a3
```

`.git/config`, the two lines that matter, as the host hands them over:

```ini
[remote "origin"]
	url = https://github.com/alexandrapaiz/Ursa.git
	fetch = +refs/heads/main:refs/remotes/origin/main
```

A real `--json` payload, from
`node tools/stack/lag-or-rewrite.mjs --json refs/prs/694` run at 07:3xZ on
2026-11-02, with the 68 `LAGS` rows elided at the marked point and nothing
else changed. Every blob and commit id below is a real object in this
public repository:

```json
{
  "trunk": "origin/main",
  "branch": "refs/prs/694",
  "base": "9c3c52dc2569132896ff2fc0f67a2ce6aa0ea9ae",
  "rows": [
    {
      "path": "docs/ideas.md",
      "cls": "BOTH_MOVED",
      "effect": "edits",
      "base": "f90ee84d8864e2572249ae360436d90eb9d4a53d",
      "trunk": "0009b667391926968dbe9972635aa44f7c7bf4be",
      "branch": "14b9eb64beb6b7fbe8fbb49520caf638b93931ba"
    },
    {
      "path": "tools/root-entries.test.mjs",
      "cls": "LAGS",
      "effect": "edits",
      "base": "e777ba913cba56988b335341b1b7973f60e6d26b",
      "trunk": "e625d6b44a4f4d80290c6dfdae536106efa06a9a",
      "branch": "e777ba913cba56988b335341b1b7973f60e6d26b"
    },
    "... 66 further LAGS rows elided ...",
    {
      "path": "ursa-major/src/adapters/github-pr.ts",
      "cls": "REWRITES",
      "effect": "edits",
      "base": "72ba55d26a5df4025a170edef69a7b40959bfc4d",
      "trunk": "72ba55d26a5df4025a170edef69a7b40959bfc4d",
      "branch": "01691026406c786fb0d9d242fe97dbcfcda2bb7d"
    }
  ],
  "abstained": [],
  "counts": { "LAGS": 68, "REWRITES": 9, "BOTH_MOVED": 1, "RESURRECTS": 0 },
  "exitCode": 0
}
```

The second row is the one this artifact exists for. `base` and `branch`
are the **same object**, `e777ba91`, and `trunk` is a different one. That is
`LAGS`, and it is the row that read as a reverted security fix when the
base was the empty string.

**Redaction, per the rider in `prompts/engineer-agent.md` element 3.** The
checkout root is written `<your-checkout>/` rather than this run's real
sandbox path. Nothing else here needs a placeholder: every blob id, commit
id and path above is a public object in `alexandrapaiz/Ursa`, and the only
name that appears, `ursa-security`, is a seat rather than a person.

## 6. Tooling

| Tool | Version | Its job here | Why it, over what was considered |
|---|---|---|---|
| `git` | 2.43.0 | every read: `merge-base`, `diff --name-only -z`, `rev-list`, `cat-file --batch-check`, `rev-parse --verify --quiet` | not a choice; it is the system under measurement. The sub-choice that is a choice: `cat-file --batch-check` over one `rev-parse` per blob. Measured on pull request 665, 139 differing paths: 417 processes and 20 seconds of wall clock against 2 seconds of user time, so the cost was process creation. One batched process took it to 2 seconds total. |
| Node.js | 22.23.2 | the runtime for both modules | already this repository's scripting runtime for every tool under `tools/`. No new dependency, and `node:child_process` plus `node:fs` is the whole import list. |
| `node:test` | bundled with Node 22.23.2 | the 19-test suite, including `t.skip` for the unmeasurable case | bundled, so the suite adds nothing to install. Considered and rejected: `vitest` and `jest`, both of which would be the first test dependency in `tools/` and neither of which offers anything this suite uses. `node:test`'s `t.skip` is also the shape this repository already relies on to distinguish "unmeasured" from "passing". |
| `bash` | 5.2.21(1)-release | `tools/ensure-full-clone.sh`, the repair the faults name | already written and already on `main`. The alternative was to put the repair inside `base.mjs`, which was rejected: a read-only instrument that silently fetches is a tool whose side effects a reader cannot refuse. |
| `spawnSync` | `node:child_process`, Node 22.23.2 | every `git` call, with `maxBuffer` at `1 << 28` | synchronous, so the classifier is a pure function of the repository for a caller. `maxBuffer` is 256 MiB because `docs/ideas.md` alone has over 300 trunk commits and the batch input for a 139-path row is thousands of lines; the default 1 MiB truncates silently, which is the failure mode this whole artifact is about. `execFileSync` was rejected because it throws, and every branch here has to be decided on a status code rather than caught. |

## 7. What this does not claim

- It does not judge whether a `RESURRECTS` row is wrong. A deliberate revert
  is a real and legitimate thing, and it reports identically. The output is
  a decision list, not a defect list, which is why exit 1 is addressed to a
  reviewer and this is not wired into a gate that blocks a merge. That is
  the same boundary `tools/ledger/both-edited.mjs` draws for its own
  reread list.
- It does not answer containment. "Is this row already inside a sibling" is
  `tools/ledger/containment.mjs` and the PM's own ancestry check. This is
  the question immediately **after** containment, for the row that is not
  contained.
- It does not audit the rest of this repository's ancestry call sites.
  Thirteen tracked files mention `git merge-base`; `tools/stack/repair-pending.mjs`
  and `tools/registers/reproduce-collision.sh` already guard the empty result
  by hand, and the rest have not been checked against this module.
  That sweep is filed in `docs/ideas.md` rather than claimed here.
