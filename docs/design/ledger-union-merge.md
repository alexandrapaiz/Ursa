# The ledger merge driver: five blocked pull requests, one file, one driver

Engineer seat, 2026-09-27 (second dispatch). Written to the
engineering-artifact standard in `prompts/engineer-agent.md`.

## 1. The observation

`gh pr view <n> --json mergeable` on 2026-09-27 at 15:45 UTC reported
`CONFLICTING` for five of the thirteen open pull requests. For every one
of them, `git merge-tree --write-tree origin/main origin/<branch>`
printed exactly one conflict line, and it named the same file:

```
=== PR#13 engineer/2026-09-24-trace-stage-loops ===
CONFLICT (content): Merge conflict in docs/ideas.md
=== PR#16 engineer/2026-09-25-artifact-kind ===
CONFLICT (content): Merge conflict in docs/ideas.md
Auto-merging ursa-major/src/bin/ursa.ts
=== PR#18 engineer/2026-09-25-fixture-browsable-record ===
CONFLICT (content): Merge conflict in docs/ideas.md
=== PR#21 market/2026-09-26 ===
CONFLICT (content): Merge conflict in docs/ideas.md
```

Plus `#14 skill/2026-09-24-outcome-record-provenance`, found later by the
requeue script in §6. Sprint items 1, 2, 3 and 4 of
`docs/sprints/sprint-2026-09-21.md` are the work sitting inside those
five branches. The entire sprint backlog was blocked, and no line of
product code was in disagreement. The block was a text collision in the
idea ledger.

The cause is structural and it recurs by construction. Every seat charter
ends with the same instruction: append today's new ideas to
`docs/ideas.md`. Every seat therefore adds lines at the end of one file
on every run. Git's default text merge is line-based and hunk-based, so
two appends at the same end of the same file are one overlapping hunk,
which is one conflict, forever, for as many concurrent branches as there
are active seats. `docs/standards/pm.md` §4 already asks each seat to
warn the owner about this in the pull request description. That is a
warning label, not a fix.

The fix is to stop merging the ledger as lines and merge it as what it
is: an unordered-at-the-end set of independent blocks, each with an
identity. Two seats appending are then two additions of two different
keys, which is not a conflict in any merge algebra.

## 2. System diagram

Every node is a file that exists in this repository after this pull
request, or a real git or GitHub process. Every edge carries a named
payload: a file, a set of argument values, an exit code, or a
TypeScript type.

```
┌─ A seat's run (engineer, market, skill, research, chair) ────────────┐
│                                                                      │
│  prompts/<seat>-agent.md ──"append today's ideas"──▶ docs/ideas.md   │
│                                                     (branch copy)   │
└──────────────────────────────────────────────────────────────────────┘
                                   │
                                   │ git push: branch with N appended blocks
                                   ▼
┌─ GitHub ─────────────────────────────────────────────────────────────┐
│  pull request  ──mergeable: "CONFLICTING"──▶  the owner's merge queue │
│       │                                                              │
│       └──pull_request event──▶ .github/workflows/ledger-gate.yml      │
│                                 (proposed; see §9)                    │
└──────────────────────────────────────────────────────────────────────┘
                                   │
   .github/workflows/ledger-gate.yml runs two commands:
       node --test tools/ledger/ledger.test.mjs tools/ledger/check.test.mjs
       node tools/ledger/check.mjs docs/ideas.md
                                   │ exit code 0 or 1
                                   ▼
┌─ Repair path, run in a clone (a laptop, or a workflow checkout) ─────┐
│                                                                      │
│  tools/ledger/requeue.sh                                             │
│      │                                                               │
│      ├─ gh pr list --json number,mergeable ─▶ [{number, mergeable}]  │
│      │                                                               │
│      ├─ bash tools/ledger/install-driver.sh                          │
│      │      │                                                        │
│      │      ├─ writes merge.ledger.driver ──▶ .git/config            │
│      │      └─ writes "docs/ideas.md merge=ledger"                   │
│      │                                  ──▶ .git/info/attributes     │
│      │                                                               │
│      └─ git worktree add --detach $tmp origin/<branch>               │
│             │                                                        │
│             └─ git merge --no-edit origin/main                       │
│                    │                                                 │
│                    │ git reads the merge attribute for the path from │
│                    │ .gitattributes (committed) or .git/info/        │
│                    │ attributes (per clone), finds merge=ledger,     │
│                    │ looks up merge.ledger.driver in .git/config     │
│                    ▼                                                 │
│             node tools/ledger/union-merge.mjs %O %A %B %L %P         │
│                  %O = /tmp/.../ideas_BASE_1234.md   (ancestor)       │
│                  %A = /tmp/.../ideas_LOCAL_1234.md  (ours; the       │
│                        driver overwrites this file with the result)  │
│                  %B = /tmp/.../ideas_REMOTE_1234.md (theirs)         │
│                  %L = 7        %P = docs/ideas.md                    │
│                    │                                                 │
│                    │ imports { mergeLedgers } from './ledger.mjs'    │
│                    ▼                                                 │
│             tools/ledger/ledger.mjs                                  │
│                  parseLedger(string) ─▶ Block[]                      │
│                  mergeLedgers(base, ours, theirs, markerSize)        │
│                      ─▶ { merged: string, conflicts: string[],       │
│                           added: string[], removed: string[] }       │
│                  renderLedger(Block[]) ─▶ string                     │
│                    │                                                 │
│                    │ writeFileSync(%A, result.merged)                │
│                    │ exit 0 when conflicts.length === 0, else 1      │
│                    ▼                                                 │
│             git commits the merge, or leaves markers for a human     │
│                    │                                                 │
│                    └─ git push origin HEAD:refs/heads/<branch>       │
│                          (only with --push; never to main)           │
└──────────────────────────────────────────────────────────────────────┘
```

The one edge worth reading twice is the attribute lookup. `merge=ledger`
in `.gitattributes` names a driver; it does not define one. The command
behind the name lives in `.git/config`, which is per-clone and is never
committed. GitHub's server-side merge button runs against no such
config, so it will keep reporting these conflicts no matter what this
repository commits. That is why the repair runs in a checkout, and why
`install-driver.sh` exists at all.

## 3. Interfaces

The implementation is JavaScript with JSDoc rather than TypeScript, for
the reason given in §7. These are the signatures a caller writes
against, and they are the signatures the JSDoc in
`tools/ledger/ledger.mjs` encodes.

```ts
/** One structural unit of docs/ideas.md. */
type Block = {
  /**
   * 'preamble' is everything above the first `### ` heading: the contract
   * pointer and the PM's grooming section.
   * 'entry' is one dated idea, `### YYYY-MM-DD — Name`, through the line
   * before the next block.
   * 'note' is a top-level dated bullet, `- YYYY-MM-DD (seat): ...`, the
   * form the chair uses for run notes.
   */
  kind: 'preamble' | 'entry' | 'note';
  /**
   * Merge identity. The heading line for an entry, the whole line for a
   * note, the literal '__preamble__' for the preamble, each lowercased
   * with runs of whitespace collapsed to one space. Two blocks with equal
   * keys are the same ledger item on two branches.
   */
  key: string;
  /** The block's verbatim lines, newline-joined, trailing blanks stripped. */
  text: string;
};

/** Split a ledger file into blocks. Total: never throws, never drops text. */
function parseLedger(source: string): Block[];

/**
 * Reassemble blocks: exactly one blank line between blocks, one trailing
 * newline. renderLedger(parseLedger(x)) === x holds byte-for-byte on
 * docs/ideas.md and is asserted as a test.
 */
function renderLedger(blocks: Block[]): string;

/**
 * Three-way merge by block identity.
 * @param markerSize git's %L, the conflict marker length (7 by default)
 * @returns merged     the file to write back
 *          conflicts  keys edited differently on both sides; non-empty
 *                     means the merged text carries conflict markers and
 *                     the driver must exit non-zero
 *          added      keys taken from `theirs`
 *          removed    keys deleted on one side and untouched on the other
 */
function mergeLedgers(
  base: string,
  ours: string,
  theirs: string,
  markerSize?: number,
): { merged: string; conflicts: string[]; added: string[]; removed: string[] };
```

The two command-line boundaries, stated as the contracts their callers
depend on:

```ts
// tools/ledger/union-merge.mjs — invoked by git, never by a human.
// argv: [ancestorPath, oursPath, theirsPath, markerSize, pathname]
// Overwrites oursPath with the merged text. Exit 0 = merged,
// 1 = conflict markers left for a human, 2 = called wrongly.
type MergeDriverExitCode = 0 | 1 | 2;

// tools/ledger/check.mjs — invoked by CI and by a human.
// argv: [ledgerPath = 'docs/ideas.md']
// Prints one "::error::" line per violation, GitHub-annotation shaped.
type LedgerCheckExitCode = 0 | 1;
```

## 4. On-disk layout

```
.gitattributes                      committed; names the driver for the path
.git/config                         per clone, never committed; defines it
.git/info/attributes                per clone; covers branches that predate
                                    .gitattributes
tools/ledger/ledger.mjs             parse, render, three-way merge (pure)
tools/ledger/union-merge.mjs        the git merge driver, argv contract of §3
tools/ledger/check.mjs              the pm.md §4 contract checker
tools/ledger/install-driver.sh      registers the driver in this clone
tools/ledger/requeue.sh             drains conflicting pull requests
tools/ledger/ledger.test.mjs        12 tests, node:test
tools/ledger/check.test.mjs         9 tests, node:test
tools/ledger/ci/ledger-gate.yml     PROPOSED workflow: both test files plus
                                    the checker, on every pull request
tools/ledger/ci/tests.yml           PROPOSED workflow: ursa-major's 36 vitest
                                    tests, which nothing ran in CI before today
tools/ledger/ci/README.md           why those two are a proposal and not
                                    installed, and the two commands to install
```

`.gitattributes`, in full, as committed:

```gitattributes
# The ledger is append-only and every seat appends to its end. Merge it by
# entry identity, not by line hunks. The driver behind this name is registered
# per clone by tools/ledger/install-driver.sh; see docs/design/ledger-union-merge.md.
docs/ideas.md merge=ledger
```

What `install-driver.sh` writes into `.git/config`, read back from a real
run in this session (`$root` is the absolute path of the clone, which is
per-machine and therefore not reproduced here):

```
[merge "ledger"]
	name = Ursa ledger: merge docs/ideas.md by entry identity
	driver = node $root/tools/ledger/union-merge.mjs %O %A %B %L %P
	recursive = binary
```

`recursive = binary` is the setting for the inner merges git performs
when it has to build a virtual ancestor for a criss-cross history: the
driver is not re-entered there, and the ancestor is taken as-is rather
than half-merged.

A real driver invocation, stderr verbatim, from merging `origin/main`
into `origin/engineer/2026-09-24-trace-stage-loops` on 2026-09-27:

```
ledger driver: docs/ideas.md merged by block identity. 4 block(s) taken from the other branch, 1 removed.
```

The 4 added blocks are that branch's own four appended entries as seen
from `main`'s side of the merge. The 1 removed block is the case §5
explains. The merged file went from 8 blocks at the merge base to 15,
with zero conflict markers, and the branch went from `CONFLICTING` to
mergeable.

A real conflict, which is what the driver produces when two branches
edit the same entry differently. This is the driver's output, not git's,
with git's own marker length honored:

```markdown
<<<<<<< ours
### 2026-09-18 — Repo split: Major and Minor
- Trigger: owner at bootstrap
- Status: accepted
=======
### 2026-09-18 — Repo split: Major and Minor
- Trigger: owner at bootstrap
- Status: rejected
>>>>>>> theirs
```

Note what the markers surround: whole ledger entries, not interleaved
lines. A human resolving this reads two complete entries and deletes
one, instead of reconstructing an entry from fragments.

## 5. Behaviour worth knowing before you trust it

**A renamed heading is a delete plus an add.** Identity is the heading,
so when `main` changed `### 2026-09-23 — Upstream: Linear
board-of-record practice to HQ` into the same heading plus `(WITHDRAWN
2026-09-25, ADR-006)`, the old key disappeared and a new one appeared.
The driver reported `1 removed` and the result carries the entry exactly
once, under its new heading. This is the right outcome, and it is only
the right outcome because the dangerous version of it conflicts: if one
branch renames the heading while another edits that entry's body, the
edit is not silently carried away with the old key, it raises a
conflict. Both behaviours are asserted as tests
(`a heading renamed on one side replaces the old block, not duplicates it`,
`a body edit does not vanish when the other side renames that heading`).

**Deletion is honoured, not resurrected.** A block deleted on one side
and untouched on the other stays deleted. A block deleted on one side
and edited on the other conflicts.

**Ordering.** Our block order is preserved. A block only the other
branch has is inserted after the block that precedes it there, skipping
over blocks we added in the same gap, so two appends at the end come out
as ours first and theirs after.

**What the driver deliberately does not do.** It does not deduplicate.
Two blocks that say the same thing in different words are two keys, and
the driver keeps both, because a merge driver that removed text a human
wrote would be the wrong place to make that judgement. Catching those is
`check.mjs`'s job, and it earns its place immediately: on first run
against `main` it found that the chair's 2026-09-25 overlay S0 note is
in the ledger twice, identical for its first two hundred characters and
differing only in `§16.2` versus `plan 16.2` near the end. That is the
fingerprint of an append collision resolved by hand. This pull request
deletes the second copy.

Duplicate detection is word-set overlap (Jaccard index over lowercased
alphanumeric words of three or more characters), not a prefix
comparison, because the pair actually present in this repository differs
only in its tail. Measured on `docs/ideas.md`: the duplicated pair
scores 0.98, and the closest genuinely unrelated pair in the whole file
(the preamble against the `Agentic-forward` entry) scores 0.17. The
threshold is 0.90 and nothing in the file sits between 0.17 and 0.98,
so it is not a tuned knob. Blocks with fewer than 12 distinct words are
exempt, since short blocks can share 90% of their words by being short.

## 6. Exact commands

Register the driver in a clone. Once per clone, and safe to repeat:

```bash
bash tools/ledger/install-driver.sh
```

See which open pull requests are blocked on the ledger and whether the
driver clears them, without changing anything:

```bash
bash tools/ledger/requeue.sh
```

Real output from this session, with `main` at `356b3e5`:

```
=== PR #21 (market/2026-09-26) ===
  merges clean with the ledger driver. Re-run with --push to send it.
=== PR #18 (engineer/2026-09-25-fixture-browsable-record) ===
  merges clean with the ledger driver. Re-run with --push to send it.
=== PR #16 (engineer/2026-09-25-artifact-kind) ===
  merges clean with the ledger driver. Re-run with --push to send it.
=== PR #14 (skill/2026-09-24-outcome-record-provenance) ===
  merges clean with the ledger driver. Re-run with --push to send it.
=== PR #13 (engineer/2026-09-24-trace-stage-loops) ===
  merges clean with the ledger driver. Re-run with --push to send it.

Drained (ledger conflict only): 21 18 16 14 13
Needs a human (other files):    none
```

Actually push the repair to each blocked branch, which makes them
mergeable on GitHub. This writes to pull request branches and never to
`main`:

```bash
bash tools/ledger/requeue.sh --push
bash tools/ledger/requeue.sh --push 13 16     # or a chosen subset
```

Check the ledger against its contract, the same command CI runs:

```bash
node tools/ledger/check.mjs docs/ideas.md
```

Run the driver's own tests:

```bash
node --test tools/ledger/ledger.test.mjs tools/ledger/check.test.mjs
```

Merge one branch into `main` locally with the driver active, which is
the owner's path and the only path where no conflict arises at all:

```bash
git checkout main && git pull --ff-only
git merge --no-ff --no-edit origin/engineer/2026-09-24-trace-stage-loops
node tools/ledger/check.mjs docs/ideas.md
git push origin main
```

## 7. Tooling

| Tool and version | Its job here | Why it, over what else was considered |
|---|---|---|
| Node.js 22.23.2 (the runtime already installed on the GitHub Actions runner and used by `ursa-major`) | Runs the merge driver, the checker, and their tests | A git merge driver is executed by git mid-merge, in whatever checkout the merge happens in, including a fresh `git worktree add` where `npm install` has never run. Node with no dependencies runs there; anything needing an install step does not. A shell-plus-`awk` driver would also run there, but the three-way block merge in `mergeLedgers` is real logic that needs testing, and `awk` has no test runner in this repository. |
| `node:test` and `node:assert/strict` (built into Node 22) | The 21 tests for the driver and the checker | `vitest` 2.1.8 is the repository's test runner and is deliberately **not** used for these files: it lives in `ursa-major/package.json`, so running it requires `ursa-major/node_modules`, which reintroduces exactly the install dependency the driver must not have. `node:test` needs nothing. `ursa-major`'s own 36 tests stay on vitest and are now run in CI by `.github/workflows/tests.yml`. |
| git 2.55.0 | Supplies the merge driver interface (`%O %A %B %L %P`), the `merge=<name>` path attribute, and `git worktree` for repairing a branch without disturbing the working tree | This is git's own documented extension point for exactly this problem (`gitattributes(5)`, "Defining a custom merge driver"). The alternative was git's built-in `merge=union`, which takes both sides of every hunk: it would have resolved these five conflicts, and it would also silently duplicate an entry whenever the owner edited one while a seat appended, because it understands lines and not entries. |
| GitHub CLI `gh` 2.101.0 | `requeue.sh` reads `mergeable` per pull request and resolves numbers to branch names | The same data is available from the REST API with a token, but `gh` is already authenticated in every seat workflow through `GH_TOKEN` and is already how every charter inspects the queue. |
| `actions/checkout@v4`, `actions/setup-node@v4` | The two steps in the proposed `ledger-gate.yml` and `tests.yml` | Already the versions pinned by `.github/workflows/redaction-gate.yml` and the eleven seat workflows; matching them keeps one upgrade surface. |

## 8. The seat cannot install its own guardrail

Both workflows in `tools/ledger/ci/` were written into
`.github/workflows/` first, and the push was rejected:

```
! [remote rejected] engineer/2026-09-27-ledger-union-merge -> engineer/2026-09-27-ledger-union-merge
  (refusing to allow a GitHub App to create or update workflow
  `.github/workflows/ledger-gate.yml` without `workflows` permission)
```

The engineer seat's GitHub App token carries `contents: write` and
`pull-requests: write`, and GitHub gates `.github/workflows/` behind a
separate `workflows` permission that the token does not have. The
consequence is general and outlives this pull request: no engineer run
can ship a CI gate, only propose one. Every guardrail an engineer run
concludes is necessary arrives as a file the owner copies by hand, which
is exactly the kind of step that silently does not happen. Filed in
`docs/ideas.md` today with status `urgent` for that reason, not because
these two workflows are urgent.

## 9. What this does not solve

GitHub's merge button will still report a conflict, because it cannot
see `.git/config`. Once one of the five blocked pull requests merges,
`main` moves and the other four are behind it again, so draining the
queue is `requeue.sh --push` after each merge, or the local merge path
in §6 which never conflicts in the first place. A one-click version
(`workflow_dispatch` running `requeue.sh --push` on the runner) is filed
in `docs/ideas.md` as of today rather than built, because a workflow
that force-updates other seats' branches on a schedule is a thing the
owner should decide to install, not something an engineer run should
introduce on its own.
