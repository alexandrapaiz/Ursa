# Stack integration: answering "would these pull requests land together?"

Status: built, 2026-09-30, `tools/stack/integrate.sh`. Written to the
engineering-artifact standard in `prompts/engineer-agent.md`.

## 1. The problem, stated as a measurement

On 2026-09-30 this repository had 25 open pull requests and 0 merged
pull requests from the engineer seat. GitHub reported most of them as
mergeable. GitHub's answer is computed one branch at a time against
`main`, so "mergeable" there means *this branch and `main` alone have no
overlapping line edits*. It says nothing about the other 24 branches,
and nothing at all about whether the union compiles or passes its tests.

Two facts measured that day, neither visible from GitHub:

- Merging in pull-request-number order, which is the order a human
  clicking down the list uses, lands **9 of 25**. Merging with `#27`
  first lands **18 of 25**. `#27` is the branch that defines the
  `docs/ideas.md` merge driver, and a merge driver cannot act on a merge
  that happens before the branch defining it lands. The order is
  therefore part of the answer, not a detail.
- `#16` (`engineer/2026-09-25-artifact-kind`) was green on its own and
  shipped a `SyntaxError` in the generated viewer's inline script, which
  meant every `outcome_record.html` it produced opened as an empty
  shell. The defect became visible only in a tree that also contained
  `#18`, because `#18` is the branch whose test executes that script.
  Fixed on `#16`'s own branch, 2026-09-30.

So the tool's job: build the union, in a stated order, and run the real
suites on it.

## 2. System diagram, node by node

Every node below is a file, process, or directory that exists. Every
edge is labeled with the data that crosses it.

**Nodes.**

| Node | What it is | Where |
|---|---|---|
| `tools/stack/integrate.sh` | The harness. A Bash script, the only executable this design adds. | committed in this repository |
| `gh pr list` | The GitHub CLI subcommand that lists open pull requests. External process. | `gh` on `PATH` |
| `git fetch origin` | Updates the remote-tracking refs the harness merges from. External process. | `git` on `PATH` |
| scratch worktree | A second working tree checked out detached at `origin/main`, created by `git worktree add`. Every merge happens here and nowhere else. | `/tmp/ursa-stack-XXXXXX`, the `XXXXXX` filled by `mktemp -d` |
| worktree git config | The per-worktree config file where a merge driver's command line is registered. Never committed, which is why installation is a runtime step. | `.git/worktrees/<worktree-name>/config` |
| worktree attributes | The per-worktree path-to-driver mapping, used so branches predating the committed `.gitattributes` are still covered. | `.git/worktrees/<worktree-name>/info/attributes` |
| `tools/ledger/install-driver.sh` | Registers the ledger merge driver. Does **not** exist on `main`; it arrives in the scratch worktree when the branch carrying it is merged. | arrives from `engineer/2026-09-27-ledger-union-merge` |
| `tools/ledger/union-merge.mjs` | The merge driver program git invokes per conflicting `docs/ideas.md`. Merges ledger entries by entry identity instead of by line hunk. | same branch as above |
| `docs/ideas.md` | The shared idea ledger every seat charter appends to, and therefore the file every pair of branches collides on by default. | in the union |
| `ursa-major/package.json` | Declares the `ursa-major` test script and its dependency floor. Conflicts here are dependency-version disagreements, not text disagreements. | in the union |
| `vitest run` | The `ursa-major` test suite runner, invoked through `npm test`. | `ursa-major/node_modules` |
| `next build` | The `ursa-minor` site build, invoked through `npm run build`. | `ursa-minor/node_modules` |
| markdown report | Human-readable per-branch table. | path given to `--report` |
| `IntegrationReport` JSON | Machine-readable result, the shape anything automated should read. | path given to `--json` |

**Edges.**

| From | To | Data crossing the edge |
|---|---|---|
| `integrate.sh` | `gh pr list` | argument list `--state open --limit 100 --json number,headRefName` |
| `gh pr list` | `integrate.sh` | JSON array of `{ number: number, headRefName: string }`, reduced by `-q` to one `"<number> <branch>"` line per pull request |
| `integrate.sh` | `git fetch origin` | no arguments beyond `--quiet`; effect is updated `refs/remotes/origin/*` |
| `integrate.sh` | scratch worktree | the 40-character commit SHA of `origin/main`, passed to `git worktree add --detach` |
| `integrate.sh` | `git cat-file -e origin/<branch>:tools/ledger/install-driver.sh` | a `<rev>:<path>` object name; exit status 0 or 1 is the whole answer, and it decides which branch is hoisted first |
| `integrate.sh` | `git merge --no-edit --quiet origin/<branch>` | one remote-tracking ref name per call |
| `git merge` | `integrate.sh` | exit status, plus on failure the output of `git diff --name-only --diff-filter=U`, a newline-separated list of repository-relative paths still unmerged |
| `git merge` | `tools/ledger/union-merge.mjs` | the driver placeholders `%O %A %B %L %P`: ancestor blob path, ours blob path, theirs blob path, conflict-marker size, final pathname |
| `union-merge.mjs` | `docs/ideas.md` in the worktree | the merged ledger text, written in place at `%A`; exit 0 means merged, exit 1 means it left whole-entry conflict markers |
| `integrate.sh` | `docs/ideas.md` | two `grep -c` reads: the count of lines matching `^### ` (entries) and of lines matching `^<<<<<<<\|^>>>>>>>` (committed conflict markers) |
| `integrate.sh` | `npm ci` then `npm test` in `ursa-major` | working directory `<worktree>/ursa-major`; back across the edge comes an exit status plus `/tmp/ursa-stack-major.log`, from which the `Tests N passed` summary line is read after ANSI escape removal |
| `integrate.sh` | `npm ci` then `npm run build` in `ursa-minor` | working directory `<worktree>/ursa-minor`; back comes an exit status plus `/tmp/ursa-stack-minor.log` |
| `integrate.sh` | markdown report file | one table row per pull request: number, branch, `merged` or `conflict`, conflicted paths |
| `integrate.sh` | `IntegrationReport` JSON file | the object typed in §3, validated by piping it through `JSON.parse` before the script exits |
| `integrate.sh` | caller's shell | exit status 0 when every requested branch merged, every suite passed, and the ledger carries no conflict markers; 1 otherwise; 2 on a usage or environment error |

The scratch worktree is the only writable node. `main`, the checkout the
script is invoked from, and every remote branch are read-only to it, and
it contains no `git push`.

## 3. Interfaces at the component boundaries

The harness is Bash, so its boundaries are a command line and two files.
Both are given here as the real signatures a caller writes against.

### The `IntegrationReport` written by `--json`

```ts
/** Result of merging a named set of branches into a throwaway copy of main. */
export interface IntegrationReport {
  /** ISO-8601, UTC, second precision, e.g. "2026-09-30T02:27:34Z". */
  generatedAt: string
  /** Full 40-hex SHA of origin/main at the moment the worktree was created. */
  baseSha: string
  /** Why the branches were merged in this order, in one sentence. */
  orderRationale: string
  /** One entry per branch, in the order they were actually merged. */
  branches: BranchOutcome[]
  ledger: LedgerOutcome
  suites: SuiteOutcome
  /** Count of branches whose merge succeeded. */
  merged: number
  /** Count of branches whose merge conflicted and was aborted. */
  conflicted: number
  /** True only when conflicted === 0, both suites passed, and ledger.conflictMarkers === 0. */
  green: boolean
}

export interface BranchOutcome {
  /** GitHub pull request number. */
  pr: number
  /** The pull request's head ref, without the `origin/` prefix. */
  branch: string
  result: 'merged' | 'conflict'
  /** Repository-relative paths left unmerged. Empty when result is 'merged'. */
  conflictedFiles: string[]
}

export interface LedgerOutcome {
  /** Lines in docs/ideas.md matching `^### `, one per ledger entry. */
  entries: number
  /** Committed conflict markers in docs/ideas.md. Any non-zero value is a defect. */
  conflictMarkers: number
}

export interface SuiteOutcome {
  /** e.g. "pass (Tests 153 passed (153))" or "FAIL (see /tmp/ursa-stack-major.log)". */
  ursaMajorTest: string
  /** e.g. "pass (next 16.3.6)" or "FAIL (see /tmp/ursa-stack-minor.log)". */
  ursaMinorBuild: string
}
```

### The command line

```ts
/** The contract tools/stack/integrate.sh implements, as the signature a caller reasons with. */
declare function integrate(opts: {
  /**
   * Pull request numbers, merged in exactly this order. Omit to take every
   * open pull request, ordered driver-branch-first then number ascending.
   * The current branch is always excluded from the implicit set.
   */
  only?: number[]
  /** Skip `npm ci`/`npm test`/`npm run build`; produce the merge map only. */
  noTests?: boolean
  /** Leave the scratch worktree on disk and print its path. */
  keep?: boolean
  /** Path to write the human-readable markdown table to. */
  report?: string
  /** Path to write the IntegrationReport JSON to. */
  json?: string
}): Promise<0 | 1 | 2>
```

## 4. On-disk layout, with a real payload

Committed by this design:

```
tools/stack/integrate.sh          # the harness, mode 0755, Bash
docs/design/stack-integration.md  # this file
```

Created at runtime, none of it committed:

```
/tmp/ursa-stack-XXXXXX/                       # the scratch worktree, XXXXXX from mktemp -d
  ursa-major/                                 # union of every merged branch
  ursa-minor/
  docs/ideas.md
/tmp/ursa-stack-major.log                     # raw `npm test` output, ANSI included
/tmp/ursa-stack-minor.log                     # raw `npm run build` output
.git/worktrees/ursa-stack-XXXXXX/config       # where install-driver.sh registers the driver
.git/worktrees/ursa-stack-XXXXXX/info/attributes
```

Real payload, the `IntegrationReport` from the 2026-09-30 run, abridged
in the `branches` array only (18 `merged` rows removed; every field
shown is the literal value that run emitted). Per the redaction rider in
`prompts/engineer-agent.md`, the scratch directory is shown in its
`mktemp` template form rather than the run's actual random suffix; no
home path or machine identity appears in this file at all, by
construction, because the harness only ever writes under `/tmp`.

```json
{
  "generatedAt": "2026-09-30T02:27:34Z",
  "baseSha": "8c453f049e996c6a9592fd5a719f1221ea0be652",
  "orderRationale": "#27 first (it defines the docs/ideas.md merge driver), then PR number ascending",
  "branches": [
    { "pr": 27, "branch": "engineer/2026-09-27-ledger-union-merge", "result": "merged", "conflictedFiles": [] },
    { "pr": 18, "branch": "engineer/2026-09-25-fixture-browsable-record", "result": "conflict", "conflictedFiles": ["ursa-major/src/cli.ts"] },
    { "pr": 20, "branch": "ursa-pm/2026-09-26-window", "result": "conflict", "conflictedFiles": ["docs/sprints/dispatch-queue.md", "docs/sprints/pending.md"] },
    { "pr": 28, "branch": "sec/2026-09-27", "result": "conflict", "conflictedFiles": ["ursa-major/src/bridge/index.ts", "ursa-major/src/verdict.ts"] },
    { "pr": 30, "branch": "exo/2026-09-27", "result": "conflict", "conflictedFiles": ["README.md", "docs/agents/org-chart.md"] },
    { "pr": 34, "branch": "pm/sprint-2026-09-28", "result": "conflict", "conflictedFiles": ["docs/agents/org-chart.md"] },
    { "pr": 35, "branch": "fe/2026-09-28-visual-review-polish", "result": "conflict", "conflictedFiles": ["ursa-minor/app/globals.css", "ursa-minor/app/page.tsx"] },
    { "pr": 38, "branch": "engineer/2026-09-29-semantic-nearest-cases", "result": "conflict", "conflictedFiles": ["ursa-major/package-lock.json", "ursa-major/package.json"] }
  ],
  "ledger": { "entries": 45, "conflictMarkers": 0 },
  "suites": {
    "ursaMajorTest": "pass (Tests 153 passed (153))",
    "ursaMinorBuild": "pass (next 16.3.6)"
  },
  "merged": 18,
  "conflicted": 7,
  "green": false
}
```

`baseSha` above is the full SHA whose abbreviation is `8c453f0`, the
commit titled "Lessons sync from HQ @ 7e051c0".

## 5. Exact commands the harness runs

In execution order. `$WORKTREE` is the `mktemp -d` path, `$MAIN_SHA` the
40-hex SHA of `origin/main`, `$branch` each head ref in turn.

```bash
git rev-parse --show-toplevel
command -v gh
git fetch --quiet origin
gh pr list --state open --limit 100 --json number,headRefName \
  -q '.[] | "\(.number) \(.headRefName)"' | sort -n
git rev-parse --abbrev-ref HEAD
git cat-file -e "origin/$branch:tools/ledger/install-driver.sh"
git rev-parse origin/main
git worktree add --quiet --detach "$WORKTREE" "$MAIN_SHA"
git -C "$WORKTREE" config user.email "stack-integrator@ursa.local"
git -C "$WORKTREE" config user.name  "stack integrator"
bash tools/ledger/install-driver.sh                       # run with cwd = $WORKTREE
git -C "$WORKTREE" merge --no-edit --quiet "origin/$branch"
git -C "$WORKTREE" diff --name-only --diff-filter=U        # only after a failed merge
git -C "$WORKTREE" merge --abort                           # only after a failed merge
grep -c '^### ' "$WORKTREE/docs/ideas.md"
grep -c '^<<<<<<<\|^>>>>>>>' "$WORKTREE/docs/ideas.md"
npm ci --silent                                            # cwd = $WORKTREE/ursa-major
npm test                                                   # cwd = $WORKTREE/ursa-major
npm ci --silent                                            # cwd = $WORKTREE/ursa-minor
npm run build                                              # cwd = $WORKTREE/ursa-minor
node -p "require('$WORKTREE/ursa-minor/package.json').dependencies.next"
node -e "JSON.parse(require('fs').readFileSync(process.argv[1],'utf8'))" "$JSON_OUT"
git worktree remove --force "$WORKTREE"                    # in the EXIT trap, unless --keep
```

The two invocations a person types:

```bash
# the full picture, both suites, both reports
bash tools/stack/integrate.sh --report /tmp/stack.md --json /tmp/stack.json

# does this specific order land, merge map only, about four seconds
bash tools/stack/integrate.sh --no-tests 27 13 16 18
```

## 6. Tooling, with versions and why each one

| Tool | Version used 2026-09-30 | Its job here | Why it rather than the alternative |
|---|---|---|---|
| Bash | 5.2.21 | The harness itself. | The work is entirely `git` and `npm` subprocess orchestration with exit-status branching, which is what a shell is for. A Node program would need the same subprocess calls plus a dependency the tool does not otherwise have, and `ursa-major`'s `node_modules` does not exist until the harness itself installs it. `bash` specifically, not POSIX `sh`, for `mapfile` and associative arrays, both used. |
| git | 2.55.0 | Fetch, worktree creation, merges, conflict listing, merge driver invocation. | `git worktree add` is the mechanism that makes the tool safe: a second checkout of the same object store means merges cannot touch the caller's working tree or index, and removal is one command. The alternative, `git merge-tree --write-tree`, reports conflicts without materializing a tree, which is faster but cannot be `npm test`ed, and testing the union is the entire point. `git stash` plus in-place merges was rejected outright: it writes to the caller's checkout. |
| GitHub CLI (`gh`) | 2.101.0 | Enumerating open pull requests and their head refs. | It is already a hard dependency of every seat workflow in `.github/workflows/`, and its `--json number,headRefName -q` gives exactly the two fields needed with no JSON parser in the script. Calling `api graphql` directly would add a query to maintain for no new information. |
| Node.js | 22.23.2 | Two one-liners: validating the emitted JSON, and reading `next` out of a `package.json`. Also the runtime for `vitest` and `next build`. | Already required by both packages, so using it for JSON validation adds nothing to install. `jq` would be the idiomatic choice and is deliberately not used: it is not a declared dependency of this repository and is absent from some runners. |
| npm | 10.9.8 | `npm ci` and the `test` / `build` scripts. | `npm ci` rather than `npm install` because it installs exactly the lockfile and fails when `package.json` and `package-lock.json` disagree. That failure mode is load-bearing: on 2026-09-30, resolving a `package-lock.json` conflict with `git checkout --ours` produced a tree whose `package.json` declared `jsdom` while its lockfile did not, and `npm ci` is what caught it. `npm install` would have silently repaired the lockfile and hidden the bad resolution. |
| Vitest | 5.0.2 in the union, 2.1.9 on `main` | The `ursa-major` suite, through `npm test`. | Not chosen here. It is what `ursa-major` already uses, and the version gap is itself a finding: `engineer/2026-09-29-next-rce-breakfix` raises the floor to 5.x, so the union runs a different major version than `main` does, and `--reporter=basic` was removed between them. The harness therefore never passes a reporter flag and parses the default summary line instead. |
| Next.js | 16.3.6 in the union | `ursa-minor`'s `npm run build`. | Not chosen here either. The union's version comes from the same break-fix branch, and confirming the site still builds on the raised floor is one of the two suites this tool exists to run. |

## 7. Terms used above, defined

- **Union**, of a set of branches: the tree produced by merging all of
  them into one commit history, in a stated order. Not a git term for
  one operation, just the result of the merges.
- **Scratch worktree**: a second working directory attached to the same
  `.git` object store, created by `git worktree add`, removable without
  affecting the first.
- **Merge driver**: a program git runs instead of its own line-based
  three-way merge, for paths a `.gitattributes` entry assigns to it. Git
  finds the program by name in a config file, and config files are
  per-clone and never committed, which is why a driver that ships in a
  branch still needs an installation step at runtime.
- **Driver-branch-first**: the harness's default ordering rule. The
  branch that defines a merge driver is merged before all others,
  because the driver has no effect on merges that precede it.
- **`--diff-filter=U`**: the `git diff` selector for paths in the
  `unmerged` state, which is how the harness lists conflicted files
  without parsing merge output prose.
- **Green**, of a union: every requested branch merged, both suites
  passed, and `docs/ideas.md` contains no conflict markers. The
  `green` field in `IntegrationReport` carries exactly this.
- **Dependency floor**: the minimum acceptable version of a dependency,
  expressed as the `^`-prefixed range in `package.json`. Raising it is
  how the 2026-09-29 break-fix closed the reported Next.js
  vulnerability, and a merge that lowers it again is a regression, so
  the resolution recorded for `#38` keeps the higher of the two.

## 8. What this tool does not do

It aborts every conflict and reports it. It does not resolve anything,
so a run with conflicts tells the owner where the work is, not that the
work is done. The seven conflicts from the 2026-09-30 run, and the
resolutions found for two of them, are written up in
`docs/agents/stack-integration-2026-09-30.md`.

It also cannot prove a union is correct, only that it merges, compiles
and passes the tests that exist. `#16`'s defect is the standing example
in both directions: the tests that existed on its own branch were green
and wrong, and what caught it was another branch's test arriving in the
same tree.
