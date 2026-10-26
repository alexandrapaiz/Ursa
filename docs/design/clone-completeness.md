# Clone completeness: the checkout a seat is given is not a copy of the repository

Status: implemented 2026-10-24 by the engineer seat, in the same run that
measured it. Held to all six elements of the engineering-artifact standard
in `prompts/engineer-agent.md`.

Rule of record: `docs/standards/lessons.md`, **L-A55** (the containment
proof, and the clone that makes it lie) and **L-A77** (the empty command
substitution that answers a different question confidently). Both name
`tools/ensure-full-clone.sh` by that exact path as the repair. Before this
run the path did not exist in this repository. This document is that file's
specification and the record of what it was measured against.

---

## 1. The defect, stated once

A seat run begins with a checkout that has two properties neither the
charter nor any tool here accounted for:

| Property | What the clone has | The command that creates it |
|---|---|---|
| **Truncated history**: only the tip commit is present, and `.git/shallow` records that the graph ends there rather than at a root commit. | `git rev-parse --is-shallow-repository` prints `true`; `git rev-list --count HEAD` prints `1`. | `git clone --depth 1` |
| **Narrow refspec**: the clone fetches exactly one branch, so remote-tracking refs exist for `main` alone and `origin/<anything-else>` is not a ref at all. | `git config --get-all remote.origin.fetch` prints `+refs/heads/main:refs/remotes/origin/main`. | `git clone --single-branch` |

Git does not refuse questions that need the missing parts. It answers them,
and the answers are wrong in a direction that reads as authoritative. Four
mechanisms, each measured on this repository at git 2.43.0 rather than cited:

1. **An exit code that means the opposite of the truth.**
   `git merge-base --is-ancestor A B` exits non-zero when it finds no common
   base. Non-zero is the same status it returns for *not contained*. So for a
   pair whose containment is a fact, the truncated graph reports *not
   contained*, and the all-seats rule in every charter ("check with
   `git merge-base --is-ancestor` before you assume you have to combine them
   by hand") is pointed at an instrument that reads backwards.

2. **A refusal that is not a conflict.**
   `git merge <ref>` fails with `fatal: refusing to merge unrelated
   histories` when the graphs do not meet, and with `merge: origin/<branch> -
   not something we can merge` when the ref is absent. Both failures leave
   **no unmerged paths**, so a caller that lists the conflicted files to
   report *which* files collided gets an empty list and reports a conflict in
   no files.

3. **An empty substitution that changes what a command means.**
   `git merge-base A B` prints nothing and exits non-zero when there is no
   base, so `base="$(git merge-base A B)"` leaves `base` empty. In a script
   without `set -e` — which is every script in `tools/` here, deliberately,
   because they report rather than abort — execution continues and
   `"$base:path"` becomes `":path"`. Git reads a leading colon as **stage 0
   of the index**, so the command succeeds, exits 0, and reads the file as it
   stands in the index of the run doing the reading.

4. **A fetch that does not widen anything.**
   `git fetch origin` honours the configured refspec, so in a narrow clone it
   updates `main` and nothing else. A tool that fetches before merging looks
   like it has prepared itself and has not.

Mechanisms 1 and 3 are L-A55's and L-A77's. Mechanisms 2 and 4 are the
single-branch half, which both lessons name in words ("shallow **and**
single-branch") and neither had a measurement for. That half is the one that
cost this repository the most, as section 3 shows.

---

## 2. System diagram

Every node below is a real file or process at the path given. Every edge is
labelled with the actual data that crosses it: a git config key, a ref name,
a file format, or a process exit status.

```
                         ┌──────────────────────────────────────┐
                         │ GitHub: alexandrapaiz/Ursa           │
                         │ refs/heads/*, refs/pull/*/head       │
                         └──────────────────┬───────────────────┘
                                            │
         git clone --depth 1 --single-branch -b main
         (writes: .git/shallow, remote.origin.fetch)
                                            │
                                            ▼
          ┌─────────────────────────────────────────────────────────┐
          │ the seat's checkout  (the working directory of a run)   │
          │                                                         │
          │  .git/shallow            one line, the tip commit sha    │
          │  .git/config             remote.origin.fetch =           │
          │                          +refs/heads/main:refs/remotes/  │
          │                          origin/main                     │
          └───────┬──────────────────────────────────┬──────────────┘
                  │                                  │
  bash tools/ensure-full-clone.sh                     │ (unrepaired)
                  │                                  │
   reads:  rev-parse --is-shallow-repository  ─┐      │
           config --get-all remote.origin.fetch┘      │
                  │                                   │
   writes: remote.origin.fetch =                      │
           +refs/heads/*:refs/remotes/origin/*        │
           then git fetch origin                      │
           then git fetch --unshallow origin          │
           (removes .git/shallow, adds objects)       │
                  │                                   │
   exit status ───┤                                   │
    0 complete    │                                   │
    1 --check and repair needed                       │
    2 repair failed, or no repo / no origin           │
                  │                                   │
                  ▼                                   ▼
   ┌───────────────────────────────┐   ┌────────────────────────────────┐
   │ tools/stack/integrate.sh      │   │ the same two callers, before    │
   │ tools/registers/              │   │ this change                     │
   │   reproduce-collision.sh      │   │                                 │
   └──────────┬────────────────────┘   │ integrate.sh: every branch      │
              │                        │   reported CONFLICT, file list  │
   integrate.sh writes:                │   empty, exit 1                 │
     $WORKTREE  (git worktree add,     │ reproduce-collision.sh: base    │
       a scratch checkout under        │   read from the INDEX, exit 0,   │
       /tmp/ursa-stack-XXXXXX)         │   every count plausible         │
     IntegrationReport JSON            └────────────────────────────────┘
       (--json <path>, schema in §4)
     a Markdown table (--report <path>)
              │
   reads:  gh pr list --state open  →  lines of "<number> <branch>"
           origin/<branch>          →  one merge per open pull request
              │
              ▼
   per-branch result, one of three:
     merged         git merge exited 0
     conflict       git merge exited non-zero AND
                    git diff --name-only --diff-filter=U is NON-EMPTY
     tool_failure   git merge exited non-zero AND that list is EMPTY
                    (the branch was never compared; the first line of
                     git's stderr is carried through as `why`)
```

The two dashed-apart callers on the right are not hypothetical states. They
are what both scripts did, on `main`, in a seat's clone, until this change.

---

## 3. What this cost, measured

Both measurements were taken on 2026-10-24 in a clone created with the
same command the seat runtime uses, against `origin/main` at `1b15771`, on
three real open pull requests of this seat (#290, #305, #346).

### 3a. `tools/stack/integrate.sh` reported 100% false conflicts

This is the tool whose entire job is answering the question GitHub cannot:
*if the owner merged all of these, in this order, would the result build and
pass?* It is this repository's exit code for company lesson **L-E10** ("an
open card is not evidence that nobody built it").

```
$ bash tools/stack/integrate.sh --no-tests 290 305 346     # before, seat-shaped clone
  #290 ursa-engineer/2026-10-23-message-3            CONFLICT
  #305 ursa-engineer/2026-10-24-message-2            CONFLICT
  #346 ursa-engineer/2026-10-24-message-3            CONFLICT
merged 0 of 3;  conflicted: 290 305 346
```

```
$ bash tools/stack/integrate.sh --no-tests 290 305 346     # after, same clone shape
  #290 ursa-engineer/2026-10-23-message-3            merged
  #305 ursa-engineer/2026-10-24-message-2            merged
  #346 ursa-engineer/2026-10-24-message-3            merged
merged 3 of 3;  conflicted: none;  tool failures: none
docs/ideas.md in the union: 239 entries, 0 conflict markers
```

Nothing about the three branches changed between those two runs. The merge
order, the base commit and the merge driver are identical. The only
difference is that the second run repaired the refspec first. **Every
conflict this tool has ever reported in a seat's clone was false**, and the
conflicted-file list was empty in every one of them, which was the tell
nobody had a reason to read.

The depth was not the cause here, and proving that mattered: the same three
pull requests in a **full-history but still single-branch** clone also
reported 0 of 3. Repairing one property and not the other would have left
the tool exactly as wrong.

### 3b. The same run's `--json` contradicted its own summary

Worse than the console, because a machine reads it:

```
$ bash tools/stack/integrate.sh --no-tests --json out.json 290 305 346   # before
$ python3 -c "import json;d=json.load(open('out.json'));
print([(b['pr'],b['result']) for b in d['branches']]);
print(d['merged'], d['conflicted'], d['green'])"
[(290, 'merged'), (305, 'merged'), (346, 'merged')]
0 3 False
```

Three branches whose `result` is `merged`, in the same file whose summary
says `"merged": 0, "conflicted": 3`. The cause is that the emitter decided
`merged` by asking whether the conflicted-file list was *empty*, which is
true both for a branch that merged and for a branch git refused to touch.
The per-branch half is the half a consumer reads.

### 3c. `tools/registers/reproduce-collision.sh` computed its base from the index

This is the committed instrument behind every number in
`docs/design/register-merge.md`, so that a reader can re-derive them instead
of trusting the document. Line 34 was
`base_commit="$(git -C "$root" merge-base origin/main refs/prs/301)"`, and
`$base_commit` is then interpolated into `git show "$base_commit:$reg"`.

In a seat's clone that substitution is empty, `git show ":docs/agents/incidents.md"`
reads the index, and the script prints `base commit: ` followed by a full set
of plausible numbers. The first time this was run shallow the numbers came
out **identical to the truth**, which is the most dangerous possible
outcome: the branch under test happens not to modify
`docs/agents/incidents.md`, so the index copy and the base commit's copy were
byte-identical by coincidence. Appending a single entry to that register —
the normal state for a run that is probing a collision its own branch is part
of — breaks the coincidence and shifts every number by one, at exit 0:

| Figure the script reports | True (base commit read) | Shallow clone, register touched (index read) |
|---|---|---|
| base entries | 35 | 36 |
| `#301` adds | 2 | 2 |
| `#302` adds | 7 | 7 |
| ours | 37 entries, 183,353 bytes | 38 entries, 183,481 bytes |
| theirs | 42 entries, 209,366 bytes | 43 entries, 209,494 bytes |
| expected union | 44 | 45 |
| exit status | 0 | 0 |

The run's own uncommitted entry is counted on **both** sides of a merge the
script is reporting as the reproduction of two other seats' collision.
After the fix, the same shallow clone with the same appended entry reports
the true column, because the clone is repaired before the base is read.

### 3d. The eleven charters

`grep -l 'merge-base --is-ancestor' prompts/*.md` matches **11 of 12**
charters in this repository. Each one instructs its seat to run that command
and gives no step that makes the clone able to answer it. Charters are
owner-merge-only (`prompts/engineer-agent.md`, Boundaries), so this run does
not edit them; the amendment is filed as a ledger proposal instead, and it is
named here because a reader of this document should not conclude the defect
is fully closed. The two callers in `tools/` are fixed. The instruction given
to eleven seats is not.

---

## 4. Interfaces at every component boundary

`ensure-full-clone.sh` is a shell program, so its caller-facing contract is
its argument vector and its exit status. Written as the TypeScript a caller
would hold if it shelled out to it, which is also the shape the tests assert:

```ts
/** Repairs the two properties of a seat's checkout that make git lie. */
type EnsureFullCloneArgs = {
  /** Report what needs repairing and change nothing. Default false. */
  check?: boolean;
  /** Print only on a repair or an error. Default false. */
  quiet?: boolean;
  /** Operate on another checkout instead of the cwd. Default ".". */
  repo?: string;
};

/**
 * 0  the clone is complete: already was, or is now.
 * 1  ONLY with check:true, and only when a repair is needed. Never returned
 *    by a repairing run, because a repairing run either succeeds or hits 2.
 * 2  the repair was attempted and failed, or there is nothing repairable
 *    here: not a git repository, or no `origin` remote.
 */
type EnsureFullCloneExit = 0 | 1 | 2;

declare function ensureFullClone(a?: EnsureFullCloneArgs): EnsureFullCloneExit;
```

The state it inspects and the state it guarantees, as the two predicates the
script implements (`shallow()` and `narrow()`), so a reader can check the
post-condition against the definition:

```ts
type CloneState = {
  /** `git rev-parse --is-shallow-repository` === "true" */
  shallow: boolean;
  /** `git config --get-all remote.origin.fetch` does not contain the wide refspec */
  narrow: boolean;
};

/** The wide refspec, verbatim, as written into .git/config. */
const WIDE_REFSPEC = '+refs/heads/*:refs/remotes/origin/*';

/** The post-condition. Checked by the script after repairing, not assumed. */
type CompleteClone = CloneState & { shallow: false; narrow: false };
```

`integrate.sh`'s machine-readable output is a real inter-tool boundary — it
is written to a path the caller names with `--json` and parsed by whoever
asked for it — so it gets a real type. `result` is the three-way union this
change introduces; before it, the type had two members and the third state
was silently reported as `"merged"`:

```ts
type BranchResult =
  /** `git merge` exited 0. */
  | 'merged'
  /** `git merge` failed AND left at least one unmerged path. */
  | 'conflict'
  /** `git merge` failed AND left none, so the branch was never compared. */
  | 'tool_failure';

type IntegrationReport = {
  generatedAt: string;          // ISO 8601 UTC, from `date -u +%Y-%m-%dT%H:%M:%SZ`
  baseSha: string;              // the 40-char sha of origin/main at run time
  orderRationale: string;       // prose reason for the merge order used
  branches: Array<{
    pr: number;
    branch: string;
    result: BranchResult;
    /** Non-empty only when result === 'conflict'. */
    conflictedFiles: string[];
    /** Present only when result === 'tool_failure': git's first stderr line. */
    why?: string;
  }>;
  ledger: { entries: number; conflictMarkers: number };
  suites: { ursaMajorTypecheck: string; ursaMajorTest: string; ursaMinorBuild: string };
  merged: number;               // count of branches whose result is 'merged'
  conflicted: number;           // count of 'conflict'
  toolFailures: number;         // count of 'tool_failure'
  green: boolean;               // merged === branches.length && no markers && suites passed
};
```

The three counts and the per-branch results are two statements of the same
fact, and nothing in a shell `printf` forces them to agree — which is
exactly how 3b happened. `tools/stack/integrate.test.mjs` asserts the
agreement rather than trusting it.

---

## 5. On-disk layouts, with real payloads

Redaction rider observed: no path below is anyone's home directory, and the
one identifier that could be a private record is a commit sha from this
public repository.

### 5a. `.git/shallow` — the depth half

Present in a shallow clone, absent in a complete one. One line, a 40-character
hexadecimal commit sha, newline-terminated. Real contents from the clone this
run measured:

```
1b15771f3e93813b45639e0335d0fda4024ef115
```

`git fetch --unshallow origin` deletes this file. `tools/ensure-full-clone.sh`
re-reads `git rev-parse --is-shallow-repository` afterwards rather than
checking for the file, because git owns the meaning of the state and a
leftover empty file is a state the predicate should still read correctly.

### 5b. `.git/config` — the refspec half

The only file in a clone that this tool writes. Before, as the seat runtime
leaves it:

```ini
[remote "origin"]
	url = https://github.com/alexandrapaiz/Ursa.git
	fetch = +refs/heads/main:refs/remotes/origin/main
```

After `bash tools/ensure-full-clone.sh`:

```ini
[remote "origin"]
	url = https://github.com/alexandrapaiz/Ursa.git
	fetch = +refs/heads/*:refs/remotes/origin/*
```

The narrow line is **replaced**, with `git config --unset-all` followed by
`git config --add`, not added alongside. A clone carrying both lines fetches
`main` twice and reads as repaired, so a later `--check` would pass on a
configuration nobody wrote on purpose. `tools/ensure-full-clone.test.mjs`
asserts `remote.origin.fetch` has exactly one value after a repair.

### 5c. The observable effect in the ref namespace

Not a file layout but the thing callers actually depend on, so it belongs
here with real numbers. Measured in this seat's own checkout:

```
$ git for-each-ref --format=. refs/remotes/origin | wc -l
2                      # before: origin/main and origin/HEAD
153                    # after
```

### 5d. `IntegrationReport` JSON — a real payload

Written by `bash tools/stack/integrate.sh --no-tests --json out.json 290 305 346`
in a seat-shaped clone, after this change, trimmed to the fields under
discussion and otherwise verbatim:

```json
{
  "generatedAt": "2026-10-24T16:58:03Z",
  "baseSha": "1b15771f3e93813b45639e0335d0fda4024ef115",
  "branches": [
    { "pr": 290, "branch": "ursa-engineer/2026-10-23-message-3", "result": "merged", "conflictedFiles": [] },
    { "pr": 305, "branch": "ursa-engineer/2026-10-24-message-2", "result": "merged", "conflictedFiles": [] },
    { "pr": 346, "branch": "ursa-engineer/2026-10-24-message-3", "result": "merged", "conflictedFiles": [] }
  ],
  "ledger": { "entries": 239, "conflictMarkers": 0 },
  "merged": 3,
  "conflicted": 0,
  "toolFailures": 0,
  "green": true
}
```

And the `tool_failure` member, from the hermetic fixture in
`tools/stack/integrate.test.mjs`, where branch `feat/unrelated` has an
unrelated root commit:

```json
{ "pr": 3, "branch": "feat/unrelated", "result": "tool_failure", "conflictedFiles": [],
  "why": "fatal: refusing to merge unrelated histories" }
```

---

## 6. Exact commands

The literal invocations, with real flags. Everything here was run as written.

**The repair, and the gate form of it:**

```bash
bash tools/ensure-full-clone.sh                 # repair; one line per repair made
bash tools/ensure-full-clone.sh --check         # report only; exit 1 if repair needed
bash tools/ensure-full-clone.sh --quiet         # repair; silent unless it did something
bash tools/ensure-full-clone.sh --repo /tmp/x   # another checkout; leaves the cwd alone
```

**The cwd these four lines assume, stated because getting it wrong is a
real defect this repository shipped.** All four are written for `cwd =`
the repository root. The script repairs whichever checkout encloses the
cwd, so it works from a subdirectory too, but the *path* does not: from
`ursa-major/` the same four lines need `../tools/ensure-full-clone.sh`.
That matters because the tools most likely to tell a reader to run this
are npm scripts in `ursa-major/package.json`, and an npm script runs with
its cwd set to the package that declares it, not the repository root. On
2026-10-26 `npm run regen:check` printed `bash
tools/ensure-full-clone.sh` as its repair and that command exited 127 for
every reader who followed it; the fix is `FULL_CLONE_REPAIR` in
`ursa-major/tools/regen.ts`, and the gate that holds it is
`ursa-major/src/regen-commands-runnable.test.ts`, which resolves every
path a message names against the cwd the message is printed in. A
message quoting this section verbatim into a package subdirectory is the
error to watch for.

**What the script runs internally, in this order.** The refspec is widened
*before* the history is deepened, because `--unshallow` fetches according to
the configured refspec: deepening first yields one branch at full depth and
still no other branches, and then the second repair has to fetch the whole
history again.

```bash
git -C "$REPO" rev-parse --git-dir                      # exit 2 if absent
git -C "$REPO" config --get remote.origin.url           # exit 2 if absent
git -C "$REPO" rev-parse --is-shallow-repository        # the depth predicate
git -C "$REPO" config --get-all remote.origin.fetch     # the refspec predicate
git -C "$REPO" config --unset-all remote.origin.fetch
git -C "$REPO" config --add remote.origin.fetch '+refs/heads/*:refs/remotes/origin/*'
git -C "$REPO" fetch --quiet origin
git -C "$REPO" fetch --quiet --unshallow origin
git -C "$REPO" rev-list --all --count                   # reported, before and after
git -C "$REPO" for-each-ref --format=. refs/remotes/origin   # reported, before and after
```

**Reproducing the defect from scratch**, which is how 3a was obtained and is
the clone shape the seat runtime produces:

```bash
git clone --depth 1 --single-branch -b main https://github.com/alexandrapaiz/Ursa.git sh
cd sh
git rev-parse --is-shallow-repository                   # true
git config --get-all remote.origin.fetch                # +refs/heads/main:refs/remotes/origin/main
bash tools/stack/integrate.sh --no-tests --json /tmp/pre.json 290 305 346
```

**Isolating the refspec half from the depth half**, which is how "depth alone
is not the fix" was established:

```bash
git clone --quiet --single-branch -b main https://github.com/alexandrapaiz/Ursa.git f
cd f
git rev-parse --is-shallow-repository                   # false: full history
bash tools/stack/integrate.sh --no-tests 290 305 346    # still 0 of 3
git config --unset-all remote.origin.fetch
git config --add remote.origin.fetch '+refs/heads/*:refs/remotes/origin/*'
git fetch --quiet origin
bash tools/stack/integrate.sh --no-tests 290 305 346    # 3 of 3
```

**The index-substitution mechanism of 3c, in two commands:**

```bash
git rev-parse ":docs/agents/incidents.md"               # a blob sha; the INDEX stage 0
git show ":docs/agents/incidents.md" | head -1          # exit 0, prints the file
```

**The suites, and the no-flag gates:**

```bash
node --test tools/ensure-full-clone.test.mjs tools/stack/integrate.test.mjs
node --test tools/ledger/*.test.mjs tools/registers/merge-driver.test.mjs
node tools/ledger/check-attributes.mjs
node tools/ledger/check.mjs docs/ideas.md
bash tools/ensure-full-clone.sh --check
```

**Guard strength, measured by disabling each guard in place and re-running**,
rather than by reporting that every test passes:

```bash
# in tools/ensure-full-clone.sh, each in turn:
#   `if narrow; then`  -> `if false; then`     6 of 18 tests fail
#   `if shallow; then` -> `if false; then`     5 of 18 tests fail
#   `if [ "$CHECK" = 1 ]; then` -> `if false;` 1 of 18 tests fail
# in tools/stack/integrate.sh, each in turn:
#   `if [ -z "$files" ]; then` -> `if false;`  4 of 8 tests fail
#   the ensure-full-clone call removed            7 of 8 tests fail
```

---

## 7. Tooling list

Every tool named carries its version, its job here, and why it was chosen
over what else was considered.

| Tool | Version | Its job in this system | Why this and not the alternative |
|---|---|---|---|
| **git** | 2.43.0 | The subject. Both faults are properties of a git clone, and every claim in §1 and §3 is a measurement of this binary's behaviour, not of a wrapper's. | Not a choice. It is what the faults are made of. The version is load-bearing and stated because the `":path"`-reads-the-index behaviour and the exit status of `merge-base --is-ancestor` on a missing base are version-dependent in principle, and the `measured:` tests fail rather than silently pass if a future version changes either. |
| **bash** | 5.2.21(1) aarch64-unknown-linux-gnu | The language of `ensure-full-clone.sh`, `integrate.sh` and `reproduce-collision.sh`. | The repair must run *before* anything else in a checkout, including before `npm install`, and it must be callable from the two existing shell callers without a dependency step. A Node version would be the nicer program and would need `node_modules` to be a precondition of fixing a precondition. Chosen for the dependency order, not for the ergonomics. |
| **node:test** (Node.js built-in test runner) | Node v22.23.2 | Runs both suites: 18 tests for the repair, 8 for the classification. | Matches `tools/ledger/*.test.mjs`, which is already zero-dependency on purpose because a merge driver has to run during a merge in a bare clone with no `node_modules`. Vitest is already in `ursa-major/` and was not used here: adding a `tools/` dependency on it would make running the gate require an install, which is the same dependency-order problem as above. |
| **`git worktree`** | part of git 2.43.0 | `integrate.sh` merges into a scratch worktree under `/tmp/ursa-stack-XXXXXX` so the checkout it is run from is never written to. | A second full `git clone` per run would cost a fresh network fetch of a 2,818-commit history to answer a question about refs already present locally. Unchanged by this work; named because the diagram's `$WORKTREE` node is it. |
| **`file://` transport** | part of git 2.43.0 | Both test suites build a local bare repository and clone it with `--depth 1 --single-branch` over `file://`, which reproduces both faults with no network. | A plain local-path clone silently discards the flag, in git's own words: `warning: --depth is ignored in local clones; use file:// instead.` Measured: the local-path clone of a four-commit fixture reports `shallow=false commits=4`, the `file://` clone of the same bare repository reports `shallow=true commits=1`. So `file://` is what makes the fixture a real shallow clone rather than a full one wearing the flag. A network fixture against GitHub would make the suite slow, flaky and unusable in a sandbox. The equality of the fixture's clone shape with a seat's is asserted in the first test rather than assumed. |
| **python3** | 3.12.3 | Only inside `reproduce-collision.sh`, for the register entry-splitting already there. | Pre-existing. Not introduced by this change and not removed by it, since rewriting that parser was not this run's unit of work. |
| **gh** (GitHub CLI) | 2.101.0 | `integrate.sh` makes exactly one call, `gh pr list --state open`, to learn which pull requests are open. | Already a declared dependency of that script (`command -v gh` at line 53). The test suite stubs it with a three-line shell script first on `PATH` rather than mocking a library, because one call with a fixed output shape is cheaper to stub than to abstract. |

No new paid service, account, or domain. Steady-state cost stays $0. The one
new ongoing cost is the repair itself, timed end to end on a freshly made
seat-shaped clone of this repository rather than estimated: **5.7 seconds**
for both halves, taking the clone from 1 commit and 2 remote-tracking refs to
roughly 2,600 commits and 154 refs. The `--unshallow` fetch alone was 4.8
seconds in a separate measurement of the same shape. It is bounded by the
repository's size, it runs once per caller, and `--check` costs two `git
config`/`rev-parse` reads and no network at all, which is why the gate form
is the one safe to call often.

---

## 8. What this does not fix, named so nobody reads it as closed

1. **The eleven charters.** 11 of 12 files in `prompts/` instruct a seat to
   run `git merge-base --is-ancestor` and none of them say to repair the
   clone first. Charters are owner-merge-only, so this is a ledger proposal,
   not an edit in this change.

2. **The runtime that makes the clone.** Every workflow in
   `.github/workflows/` already sets `actions/checkout` to `fetch-depth: 0`,
   so the Actions path was never affected; the shallow single-branch checkout
   comes from the host runtime that invokes a seat outside Actions. A seat
   cannot change that runtime, and the app token carries no `workflows`
   permission, so the fix available to a seat is the one taken here: repair
   the clone from inside the run, at the two places that depend on it.

3. **No continuous-integration gate runs any of this.** `tools/ledger/ci/`
   has held a proposed workflow since 2026-09-27 and `gh pr checks` on this
   repository's pull requests returns exactly one check, `scan`. So the test
   counts in §6 are a local run reported by the same process that wrote the
   code, and nothing re-performs them at merge time. That is this
   repository's one standing `urgent` ledger entry and it is not this
   document's to close.

4. **Other callers, if any appear.** The two fixed here are the only files
   under `tools/` that depend on history today, established with
   `grep -rn "merge-base\|merge-tree\|rev-list\|git log \|git merge " tools/`.
   `tools/ledger/probe-server-merge.sh` also calls `merge-base --is-ancestor`
   and was deliberately **not** changed: its two operands are commits the
   script itself creates in the local clone during the run, so their common
   ancestor is present whatever the clone's depth. Checked rather than
   assumed, and recorded here so a later reader does not "fix" it.
