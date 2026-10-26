# Classifying a sequence-only merge collision by the remedy it takes

Engineer seat, 2026-10-26 (message dispatch, tenth run of the day).
Artifact for the six-element engineering-artifact standard in
`prompts/engineer-agent.md`. It describes `tools/ledger/pairwise.mjs` and
`tools/ledger/pairwise.test.mjs`, both added on this branch.

## 1. The gap this closes, stated as a measurement that nothing took

A merge queue measured against the trunk answers one question per head:
does this head merge onto `origin/main`. Two heads can both answer yes and
still conflict with each other, and that collision appears in no per-head
measurement. The Ursa exo seat isolated one on 2026-10-26: the engineer
seat's `ursa-engineer/2026-10-26-message-7` (pull request #530) and the
skill seat's chain tip `ursa-skill/2026-10-26-message-3` (pull request
#544) were each `MERGEABLE` against `main` and conflicted with each other
on `docs/ideas.md`, the ideas ledger.

Having found it, the exo seat recommended a remedy by comparing the two
diffs: the engineer side was one hunk appended at the ledger's tail, 137
added lines and nothing removed, against the skill side's 485 added and 27
removed spread across the file. One re-append against one re-resolution,
so the engineer side should take the rebase.

**That reasoning is sound and the remedy it names is unnecessary.** This
repository already ships a merge driver for exactly this file.
`.gitattributes` line 4 says `docs/ideas.md merge=ledger`, and
`tools/ledger/drivers.json` resolves the name `ledger` to
`tools/ledger/union-merge.mjs`, which merges the ledger by entry identity
rather than by line hunk. With that driver registered in the clone, the
same pair merges with zero conflicted paths in both orders. Nobody
re-appends and nobody re-resolves.

So the question a queue needs answered about a collision is not whether it
exists. It is **which remedy it takes**, and those remedies differ by more
than an order of magnitude in human cost:

| Class reported | What was measured | Who pays, and what they do |
|---|---|---|
| `independent` | The second merge of the ordered pair produced no conflicted path under git's default line merge. | Nobody. The two heads do not interact, in this order. |
| `driver-resolvable` | The second merge conflicted under git's default line merge, and produced no conflicted path once this repository's merge drivers were registered in the probe clone. | A seat or the owner runs one command, `bash tools/ledger/requeue.sh --push <second>`, after the first head lands. No judgment about content is required, because the driver merges by entry identity. |
| `needs-human` | The second merge conflicted under git's default line merge **and** still conflicted with the drivers registered. | A person opens the conflicted paths and decides what the merged content should say. This is the only class that costs judgment. |

The distinction is load-bearing rather than cosmetic because of a result
this repository already measured and wrote down.
`docs/design/server-side-merge-measurement.md` §4, Finding 1: GitHub's
server-side merge honors no `.gitattributes` merge driver, not even git's
built-in `union`, so the green merge button conflicts on a ledger
co-append whatever the repository declares. Every `driver-resolvable` pair
is therefore a **real** conflict at the button the owner presses, and also
a conflict that costs one command and no thought. Both halves are true at
once, and a queue that reports only "conflict" loses the second half.

## 2. The system diagram, node by node and edge by edge

Every node below is a real file, directory, or remote endpoint. Every edge
carries the data named on it. Rendering this as SVG requires inventing
nothing.

### Nodes

| Node identifier | What it actually is | Where it lives |
|---|---|---|
| `github-pulls` | The GitHub REST list endpoint for this repository's open pull requests, reached through the `gh` command-line client rather than by hand-rolled HTTP. | `https://api.github.com/repos/alexandrapaiz/Ursa/pulls?state=open` |
| `root-clone` | The checkout the seat is running in. Writable. Never merged into by this tool. | the directory `git rev-parse --show-toplevel` prints |
| `root-refs-prs` | One git reference per pull request measured, holding that pull request's head commit, inside `root-clone`'s reference store. | `refs/prs/<pull-request-number>` under `.git/` in `root-clone` |
| `probe-clone` | A throwaway local clone of `root-clone` in which every merge in this tool is attempted. It has its own `.git/config` with no `merge.*` entry and no `.git/info/attributes`, which is exactly the state of a clone whose owner never ran the driver installer, and the state GitHub's server merges in. | `/tmp/pairwise-XXXXXX/probe`, created by `mkdtemp` and deleted in a `finally` block |
| `install-drivers` | The committed shell script that writes this repository's two `merge.<name>.driver` entries into one clone's `.git/config` and refuses to exit 0 if any `.gitattributes` merge declaration is left unregistered. | `tools/registers/install-drivers.sh` |
| `union-merge` | The git merge driver for the ideas ledger. Parses both sides into entries keyed on `### ` headings plus the chair's top-level dated note bullets, unions them by entry identity, writes the result over git's `%A` temp file. | `tools/ledger/union-merge.mjs` |
| `register-merge` | The git merge driver for the `## `-keyed registers that `tools/registers/registers.json` enables, wrapping HQ's vendored Python entry merger. | `tools/registers/merge-driver.mjs` |
| `pairwise` | The tool this document specifies. Orchestrates the two arms, classifies, prints. | `tools/ledger/pairwise.mjs` |
| `requeue` | The existing drain tool, which merges `origin/main` into every branch GitHub reports `CONFLICTING`, with the drivers registered, and optionally pushes. It is the remedy `pairwise` names for the `driver-resolvable` class, and it is unchanged by this branch. | `tools/ledger/requeue.sh` |

### Edges

| From | To | Data on the edge |
|---|---|---|
| `github-pulls` | `pairwise` | A JSON array of `{ number: number, headRefName: string, title: string }`, produced by `gh pr list --json number,headRefName,title`. |
| `pairwise` | `root-refs-prs` | One commit object identifier per pull request, fetched from the refspec `pull/<number>/head`. |
| `root-clone` | `probe-clone` | The full object database, hardlinked by `git clone --local`, plus the branches `refs/heads/*`; then the references `refs/prs/*` by an explicit second fetch, because a local clone does not carry references outside `refs/heads` and `refs/tags`. |
| `probe-clone` | `pairwise` | For each ordered pair, a merge exit status (`number`) and the newline-separated path list from `git diff --name-only --diff-filter=U` (`string[]`). |
| `install-drivers` | `probe-clone` | Two configuration lines written into `.git/config`: `merge.ledger.driver` and `merge.register.driver`, each a command template containing `%O %A %B %L %P`. |
| `probe-clone` | `union-merge` | Per conflicted ledger merge, five arguments: the ancestor, ours, and theirs temp file paths, the conflict marker size, and the real pathname `docs/ideas.md`. |
| `pairwise` | standard output | Either the human report, or one JSON document matching the `PairwiseResult` type in §3 when `--json` is passed. |
| `pairwise` | process exit status | `0` when no finding is `needs-human`, `1` when at least one is, `2` on a usage or environment fault. |

### Flow, in the order it executes

`github-pulls` → `pairwise` (the head list) → `root-refs-prs` (fetch each
head) → `probe-clone` (one clone, no drivers) → per head, merge onto the
base alone to split off the trunk-conflict lane → prefilter pairs by shared
changed path → per ordered pair, the `default` arm → `install-drivers` into
`probe-clone` → per colliding ordered pair, the `driver` arm → classify →
standard output and exit status. The `driver` arm runs only when at least
one pair collided, so a clean queue never pays for the installer.

## 3. Interfaces at every component boundary, as real TypeScript signatures

These are the signatures a caller writes against. The module is
`tools/ledger/pairwise.mjs`, which is plain ES-module JavaScript with JSDoc;
the types below are the contract those JSDoc blocks encode.

```ts
/** One conflicted-or-clean merge attempt: git's exit status and the paths it left unmerged. */
type MergeOutcome = { status: number; paths: string[] };

/** One head under measurement. `id` is a pull request number in CLI use and any label in tests. */
type Head = { id: string | number; ref: string; label?: string };

type Classification = 'independent' | 'driver-resolvable' | 'needs-human';

type Finding = {
  first: string | number;
  second: string | number;
  firstLabel: string;
  secondLabel: string;
  /** Paths both heads changed relative to the base. The prefilter's evidence. */
  shared: string[];
  /** Unmerged paths of the SECOND merge, with no merge driver registered. */
  conflictedUnderDefault: string[];
  /** Unmerged paths of the same second merge, with this repository's drivers registered. */
  conflictedUnderDriver: string[];
  className: Classification;
};

type PairwiseResult = {
  base: string;
  baseSha: string;
  heads: number;
  /** Unordered pairs that share at least one changed path, so were worth merging. */
  candidates: number;
  /** Ordered sequences actually merged in the `default` arm: two per candidate pair. */
  sequences: number;
  /** Heads excluded from every pair because they conflict with the base itself. */
  stuckOnBase: { id: string | number; paths: string[] }[];
  findings: Finding[];
};

/** The repository the process stands in. */
export function toplevel(cwd?: string): string;

/** A clone of `root` with no merge driver registered. Throws if either post-condition fails. */
export function makeProbe(root: string, refs: string[]): { dir: string; parent: string };

/** Register every driver `.gitattributes` declares, in `probe` only. Throws unless it took. */
export function installDrivers(root: string, probe: string): void;

/** Paths `ref` changes relative to `base`, measured in `probe`. */
export function changedPaths(probe: string, base: string, ref: string): Set<string>;

/** Merge `ref` onto `base` alone, to separate requeue.sh's branch-versus-trunk lane. */
export function againstBase(probe: string, base: string, ref: string): MergeOutcome;

/** Merge `first` then `second` onto `base`. `null` when the FIRST merge conflicted. */
export function sequence(
  probe: string,
  base: string,
  first: string,
  second: string,
): MergeOutcome | null;

/** The two arms in, one class out. A `driver` arm of `null` can never license `driver-resolvable`. */
export function classify(dflt: MergeOutcome, driver: MergeOutcome | null): Classification;

/** The whole measurement, with no dependency on `gh`, which is what the tests drive. */
export function measurePairs(o: { root: string; base: string; heads: Head[] }): PairwiseResult;
```

## 4. On-disk layouts, with a real payload

Two paths are written by this branch and one is created and destroyed at
run time. Nothing under `digests/` is touched and no secret is read.

```
tools/ledger/pairwise.mjs          ES module, executable, 0755. The tool.
tools/ledger/pairwise.test.mjs     ES module. node:test. Five tests.
docs/design/pairwise-merge-classification.md   This file.
/tmp/pairwise-XXXXXX/probe/        The probe clone. mkdtemp names it; the
                                   whole parent directory is removed in a
                                   `finally` block, so a throw still cleans up.
```

The probe clone's `.git/config` before `install-drivers` runs, which is the
post-condition `makeProbe` checks by running
`git config --get-regexp '^merge\.'` and refusing a non-empty answer:

```
$ git -C /tmp/pairwise-XXXXXX/probe config --get-regexp '^merge\.'
$ echo $?
1
```

And after, which is the post-condition `installDrivers` checks:

```
$ git -C /tmp/pairwise-XXXXXX/probe config --get-regexp '^merge\.'
merge.ledger.name Ursa ledger merge, by entry identity
merge.ledger.driver /tmp/pairwise-XXXXXX/probe/tools/ledger/union-merge.mjs %O %A %B %L %P
merge.register.name HQ register merge, by numbered identifier
merge.register.driver /tmp/pairwise-XXXXXX/probe/tools/registers/merge-driver.mjs %O %A %B %L %P
```

The `--json` payload, real output from this branch at `origin/main`
`9e2f21b7`, not a sketch. The temp path placeholder rider in
`prompts/engineer-agent.md` does not apply to it, since it carries no home
path and no private record identifier: the pull request numbers and branch
names below are public.

```json
{
  "base": "origin/main",
  "baseSha": "9e2f21b7",
  "heads": 2,
  "candidates": 1,
  "sequences": 2,
  "stuckOnBase": [],
  "findings": [
    {
      "first": 544,
      "second": 540,
      "firstLabel": "ursa-skill/2026-10-26-message-3",
      "secondLabel": "ursa-engineer/2026-10-26-message-9",
      "shared": ["docs/ideas.md"],
      "conflictedUnderDefault": ["docs/ideas.md"],
      "conflictedUnderDriver": [],
      "className": "driver-resolvable"
    },
    {
      "first": 540,
      "second": 544,
      "firstLabel": "ursa-engineer/2026-10-26-message-9",
      "secondLabel": "ursa-skill/2026-10-26-message-3",
      "shared": ["docs/ideas.md"],
      "conflictedUnderDefault": ["docs/ideas.md"],
      "conflictedUnderDriver": [],
      "className": "driver-resolvable"
    }
  ]
}
```

## 5. Exact commands

What a caller runs:

```bash
# Every open pull request, human report. Exit 1 if any pair needs a human.
node tools/ledger/pairwise.mjs

# One explicit pair, which is how the exo seat's finding was reproduced.
node tools/ledger/pairwise.mjs 540 544

# Machine-readable, for a seat that wants to publish the classes.
node tools/ledger/pairwise.mjs --json

# Against a base other than origin/main.
node tools/ledger/pairwise.mjs --base refs/heads/release 530 544

# The tests.
node --test 'tools/ledger/*.test.mjs'
```

What the tool runs internally, in execution order, with the real flags:

```bash
gh pr list --state open --limit 200 --json number,headRefName,title
git -C <root> rev-parse --show-toplevel
git -C <root> fetch --quiet -f origin pull/<n>/head:refs/prs/<n>      # per head
git -C <root> fetch --quiet origin
git -C <root> clone --local --quiet <root> /tmp/pairwise-XXXXXX/probe
git -C /tmp/pairwise-XXXXXX/probe fetch --quiet <root> +refs/prs/<n>:refs/prs/<n> ...
git -C /tmp/pairwise-XXXXXX/probe config --get-regexp '^merge\.'     # must be empty
git -C /tmp/pairwise-XXXXXX/probe rev-parse --short origin/main
git -C /tmp/pairwise-XXXXXX/probe diff --name-only origin/main...refs/prs/<n>

# per head, the trunk-conflict split
git -C /tmp/pairwise-XXXXXX/probe checkout --quiet --detach origin/main
git -C /tmp/pairwise-XXXXXX/probe reset --hard --quiet origin/main
git -C /tmp/pairwise-XXXXXX/probe merge --no-commit --no-ff refs/prs/<n>
git -C /tmp/pairwise-XXXXXX/probe diff --name-only --diff-filter=U
git -C /tmp/pairwise-XXXXXX/probe merge --abort

# per ordered pair, both arms use this sequence
git -C /tmp/pairwise-XXXXXX/probe checkout --quiet --detach origin/main
git -C /tmp/pairwise-XXXXXX/probe reset --hard --quiet origin/main
git -C /tmp/pairwise-XXXXXX/probe merge --no-edit --quiet refs/prs/<first>
git -C /tmp/pairwise-XXXXXX/probe merge --no-commit --no-ff refs/prs/<second>
git -C /tmp/pairwise-XXXXXX/probe diff --name-only --diff-filter=U
git -C /tmp/pairwise-XXXXXX/probe merge --abort

# between the two arms, once, and only if some pair collided
bash <root>/tools/registers/install-drivers.sh          # cwd=/tmp/pairwise-XXXXXX/probe
```

Two of those deserve their flags explained, since a reader could
reasonably choose otherwise.

`git merge --no-commit --no-ff` is the second merge of every pair.
`--no-ff` forces a real three-way merge even where one side is an ancestor
of the other, so a containment relation does not silently report as clean
without testing the merge. `--no-commit` leaves the index and working tree
in the merged state so `--diff-filter=U` can be read, then `merge --abort`
restores the probe for the next pair without a fresh clone.

`git clone --local` is chosen over `git worktree add` deliberately, and the
reason is the whole design. A worktree shares its parent's `.git/config`
and `.git/info/attributes`, so a worktree of a clone that ran the installer
has the drivers active. Both arms would then be the `driver` arm and every
colliding pair would report `driver-resolvable`, including pairs that truly
need a human. The failure would be silent and would always point the
cheerful way. `makeProbe` therefore checks both post-conditions and throws
rather than measuring, which is the same discipline `requeue.sh` applies
when it refuses to run with an unregistered driver.

## 6. Tooling list

| Tool and version | Its job in this system | Why it, over what was considered |
|---|---|---|
| `git` 2.43.0 | Performs every merge measured, and supplies the unmerged-path list through `diff --diff-filter=U`. | Not a choice: it is the implementation under test. The version is named because the behaviours this tool depends on are version-sensitive. `tools/ensure-full-clone.sh` documents the same version dependency for `merge-base --is-ancestor` on a shallow clone. |
| `gh` 2.101.0 (2026-09-15) | Lists open pull requests and their head branch names. | Chosen over reading GitHub's `pull_request.mergeable` field, which is a cached asynchronous computation that returns `null` while GitHub recomputes and so reports staleness as an answer. The same reasoning is recorded in `docs/design/server-side-merge-measurement.md` §6. Chosen over hand-rolled HTTPS because `gh` already carries the seat's authentication. |
| `node` 22.23.2 | Runs the tool and its tests. | Chosen over a shell script because the classification is a data transform over two structured merge outcomes, and because `node:test` gives the fixtures a real assertion library with no dependency to install. `requeue.sh` is shell and stays shell: it is a loop over `git` invocations with no data structure in it. |
| `node:test` (bundled with node 22.23.2) | The test runner for `tools/ledger/pairwise.test.mjs`. | Chosen over `vitest` to match `tools/ledger/ledger.test.mjs`, whose header states the constraint: a merge driver has to run during a merge in a checkout where nothing has been installed, so its tests run with zero dependencies. Adding a dependency here would also add a steady-state install step the charter's $0 cost rule has no room for. |
| `tools/registers/install-drivers.sh` (this repository, 2026-10-25) | Registers `merge.ledger.driver` and `merge.register.driver` in the probe clone, between the two arms. | Chosen over writing the two `git config` lines inline, because the installer already checks that every `.gitattributes` declaration ends up registered, and a second copy of that list would drift from `.gitattributes` exactly as `tools/ledger/install-driver.sh` once drifted from it. |
| `tools/ledger/union-merge.mjs` (this repository) | The driver whose effect the `driver` arm measures. | Not replaced here. Its own rationale, including why git's built-in `union` is refused as destructive, is in `tools/ledger/drivers.json` and in `docs/design/server-side-merge-measurement.md` §4 Finding 2. |
| `tools/ledger/requeue.sh` (this repository) | The remedy this tool names for the `driver-resolvable` class. Unchanged by this branch. | Not replaced here, and not extended either. See §7. |

## 7. What this does not do, and why that is the right line

`requeue.sh` selects the branches it drains by asking GitHub which open
pull requests report `CONFLICTING`. A sequence-only collision is invisible
to that filter, because both heads report `MERGEABLE` until one of them
lands. The obvious extension is to teach `requeue.sh` to drain a sequence:
accept a merge order, and requeue the second head against the trunk plus
the first head rather than against the trunk alone.

That extension is deliberately not built here, because it would push an
unlanded head's content onto another seat's branch, which is a different
act from merging the trunk forward and needs the owner's decision rather
than this seat's. The moment the first head lands on `main`, GitHub
reclassifies the second as `CONFLICTING` and `requeue.sh`'s existing
filter selects it with no change at all. So the sequence this tool
recommends is already executable:

```bash
# the owner merges the first head on github.com, then any seat or the owner:
bash tools/ledger/requeue.sh --push <second>
```

What was missing was never the drain. It was knowing, before the first
merge, which of the two remedies a given pair takes. That is what this
tool measures.

## 8. Result on this repository, 2026-10-26

Run against `origin/main` `9e2f21b7` with thirteen open pull requests:

```
heads: 13 open, 23 pair(s) share a changed path, 46 ordered sequence(s) merged,
14 collide under the default line merge
Needs a human: none
```

Fourteen ordered collisions, all fourteen `driver-resolvable`, all fourteen
on `docs/ideas.md`, spread over five heads: #520, #530, #540, #542 and
#544. Zero pairs need a human, in either order. The exo seat's merge-order
recommendation that the engineer side take a rebase is therefore answered:
there is no rebase to take, in either direction, and the asymmetry between
the two diffs does not matter because neither side is re-resolved by hand.

One finding about this seat's own heads falls out of the same sweep and is
reported in the pull request rather than here: #540 contains both #520 and
#530 as ancestors, verified with `git merge-base --is-ancestor`, so three
of the five colliding heads are one piece of work and the owner can close
two of them as a single decision.
