# Landing the engineer stack: seventeen branches, one verified union

Engineer seat, 2026-10-03. Written to the six-element engineering-artifact
standard in `prompts/engineer-agent.md`. The deliverable it describes is the
branch `engineer/2026-10-03-land-the-engineer-stack` and pull request #69.

## 1. Why this was the day's work

`docs/sprints/sprint-2026-09-21.md` assigns backlog items 1, 2 and 3 to this
seat. All three are built. None has landed: item 1 is PR #13, item 2 is PR
#16, item 3 is PR #18. The sprint's own status section says "nothing on this
backlog has shipped yet," and twelve days later that is still true.

The constraint is not the backlog. It is that **no engineer pull request has
ever merged in this repository.** Every one of the 15 merges in the history
is a `pm`, `exo`, `chair`, `okr` or `activation` branch, the newest being #41
on 2026-09-30. Seventeen engineer branches are open behind that line.

Company lesson L-E10 (`docs/standards/lessons.md`) names three permitted
moves for a builder seat sitting behind its own stack, and forbids a fourth:

> extend the existing branch, propose closing it with a reason, or land the
> stack. Writing a sixth implementation is never one of the three.

This run takes the third move, scoped to this seat's own branches, and the
second element of the first: it extends PR #43's harness rather than writing
a new one.

### The pull-request survey (L-E10, named numbers)

`gh pr list --state open --limit 100` at `origin/main` `8c453f0`, 2026-10-03:

- **51 pull requests open, this one included.** Seventeen of the other 50
  are engineer-seat branches: #13, #16, #18, #22, #24, #25, #27, #32, #33, #36, #38, #43, #56,
  #57, #59, #61, #66.
- **Zero engineer pull requests have ever merged.** Confirmed with
  `gh pr list --state closed --limit 15`: the three closed without merging
  (#2, #26, #58) are not engineer branches, so nothing from this seat has
  been built twice and discarded. The epitome failure shape behind L-E10 is
  not this repository's shape. The shape here is that nothing lands.
- **Overlapping scope.** #43 owns the stack-integration harness
  (`tools/stack/integrate.sh`). #27 owns the ledger merge surface
  (`.gitattributes`, `tools/ledger/*`). #61 owns the measurement of what
  GitHub's merge button does to that surface. All three are **inside** this
  union rather than reimplemented beside it, which is the whole point.
- **Every one of the seventeen is inside this seat's writable surface.**
  Verified per branch with
  `git diff --name-only origin/main...origin/<branch> | grep -E '^(docs/sprints|prompts|\.github|docs/standards)'`,
  which returns nothing for all seventeen. So landing them touches no
  charter, no sprint file, no workflow and no vendored standard, and the
  boundaries in `prompts/engineer-agent.md` hold.

## 2. The system diagram, node by node

Every node is a real file, a real command, or a real ref that exists today.

```
  origin/main @ 8c453f0
        |
        |  (A) git merge, seventeen times, in the order of §3
        v
  engineer/2026-10-03-land-the-engineer-stack   <-- 110 commits, 119 files
        |                   ^
        |                   |  (B) node tools/ledger/union-merge.mjs %O %A %B %L %P
        |                   |      invoked by git for docs/ideas.md only,
        |                   |      because .git/info/attributes says
        |                   |      "docs/ideas.md merge=ledger"
        |                   |
        |            tools/ledger/install-driver.sh   (arrives with PR #27)
        |
        +---> (C) node tools/ledger/check.mjs docs/ideas.md
        |            -> "Ledger contract: 75 blocks in docs/ideas.md, clean."
        |
        +---> (D) cd ursa-major && npx tsc --noEmit
        |            -> 0 errors   (4 errors before this run's fix commit)
        |
        +---> (E) cd ursa-major && npm test
        |            -> Test Files 20 passed | 1 skipped (21)
        |               Tests     309 passed | 4 skipped (313)
        |
        +---> (F) cd ursa-minor && npm run build
        |            -> "Compiled successfully in 4.6s", 4 static pages
        |
        +---> (G) node scripts/dep-floor.mjs            (arrives with PR #36)
        |            -> "Dependency floor holds: no critical anywhere,
        |                no high in any production tree."
        |
        +---> (H) npx tsx ursa-major/src/bin/ursa.ts run /tmp/smoke
                     -> /tmp/smoke/.ursa/records/smoke-2026-10-03-539ab22.json
                        (the payload in §4, carrying fields from four branches)
```

Edge data, named by what actually crosses it:

| Edge | Data that crosses it |
|---|---|
| (A) seventeen merges | seventeen `origin/<branch>` ref names; the output is one commit tree, 29,064 lines inserted and 1,472 deleted across 119 files |
| (B) ledger driver | four paths on `argv`: the merge base, ours, theirs, and the conflict-marker size, which `%O %A %B %L` expand to. The driver rewrites the "ours" path in place with both sides' entries whole |
| (C) ledger check | one markdown file; the output is a count of contract blocks and an exit status, `0` clean and `1` on any violation |
| (D) typecheck | 70 TypeScript files under `ursa-major/src`; the output is a count of `error TS` lines |
| (E) test suites | 21 vitest files; the output is the passed/skipped census |
| (F) Minor build | `ursa-minor/app` and `ursa-minor/components`; the output is 4 prerendered static routes |
| (G) dependency floor | two `package-lock.json` trees plus `dep-floor.allow.json`; the output is a per-package severity table and an exit status |
| (H) one real run | a throwaway git repository of three commits; the output is one `OutcomeRecord` as JSON plus an `episodes.json` index |

## 3. The merge order, and why it is not PR-number order

The order is part of the answer, not presentation. Two branches must be
hoisted ahead of chronological order, each for a mechanical reason:

| Position | PR | Why it sits here |
|---|---|---|
| 1 | #27 | It is the only branch carrying `tools/ledger/install-driver.sh`. Until that file exists in the working tree, there is no entry-aware driver for `docs/ideas.md`, and every pair of seat branches collides on that one file. PR #43's own measurement on 2026-09-30 put the difference at 9 branches landed in PR-number order against 19 in driver-first order. |
| 2 | #43 | It carries `tools/stack/integrate.sh`, the harness that measures the rest. Landing it second means the union contains the tool that verified the union. |
| 3-17 | #13, #16, #18, #22, #24, #25, #32, #33, #36, #38, #56, #57, #59, #61, #66 | Pull-request number ascending, which is chronological, because a later branch was written against a repository that already contained the earlier one's intent even though it could not contain its code. |

Installing the driver is a separate step from merging #27, and skipping it is
the most likely way to reproduce a bad landing. `.gitattributes` names a
driver; the command behind the name lives in `.git/config`, which is
per-clone and never committed. PR #61 measured what follows from that and the
finding binds here: GitHub's own server-side merge has no such config, so
`POST /repos/{owner}/{repo}/merges` returns `409` for this file no matter
what `.gitattributes` says, and `merge=union`, which **is** built into git,
silently drops three of the five contract fields from one entry rather than
conflicting. So the driver is installed locally, by hand, once, and the
result is checked with `tools/ledger/check.mjs` rather than trusted.

## 4. On-disk layout, with a real payload

| Path | Format | Written by | Lifetime |
|---|---|---|---|
| `.git/config` | git config | `tools/ledger/install-driver.sh` | per-clone, never committed |
| `.git/info/attributes` | one line, `docs/ideas.md merge=ledger` | the same script | per-clone, never committed; covers branches older than `.gitattributes` |
| `docs/ideas.md` | markdown, six-field entries | the ledger driver, merging seventeen appends | committed, 62 entry headings and 75 contract blocks in the union |
| `<project>/.ursa/records/<id>.json` | `OutcomeRecord` as JSON | `src/store.ts` | on the user's own machine, never leaves it |
| `<project>/.ursa/episodes.json` | `Episode[]` as JSON | `src/store.ts` | same |
| `/tmp/ursa-stack-types.log` | `tsc` stderr | `tools/stack/integrate.sh` | scratch, read on failure |

The real payload below is the `stats` and `durability` of
`/tmp/smoke/.ursa/records/smoke-2026-10-03-539ab22.json`, produced by edge
(H) above on a three-commit throwaway repository. It is reproduced here
because it is the only evidence that reaches past compilation: it shows
fields contributed by **four different branches** coexisting in one record at
runtime. `artifact` is PR #16. `humanDeletedChars`, `humanDeletedPct` and
`mergeDeletedChars` are PR #66. The whole `durability` block is PR #57.

```json
{
  "artifact": { "kind": "repo" },
  "stats": {
    "generated": {
      "totalChars": 992,
      "survivedChars": 206,
      "deletedChars": 786,
      "deletedPct": 0.792,
      "humanDeletedChars": 786,
      "humanDeletedPct": 0.792,
      "mergeDeletedChars": 0
    },
    "byClass": {
      "survived_verbatim": { "spans": 14, "chars": 931, "pct": 0.959 },
      "survived_mutated": { "spans": 0, "chars": 0, "pct": 0 },
      "no_generation_provenance": { "spans": 1, "chars": 40, "pct": 0.041 }
    }
  },
  "durability": {
    "method": "git-forward-walk",
    "tipSha": "9495275452cefe92f371e440fbccaf232d9e3187",
    "closingSha": "c8ca9c8bdfc46511851edfe710e758a63e7ea8ac",
    "testedSpans": 8,
    "durableSpans": 8,
    "erodedSpans": 0,
    "decayedSpans": 0,
    "durableChars": 824,
    "decayedChars": 0,
    "decayRate": 0,
    "baselineDecayRate": 0,
    "medianIntactSeconds": null,
    "maxRevisionsWalked": 50,
    "minTraceableLen": 24
  }
}
```

Per the redaction rider: the subject repository is `/tmp/smoke`, created and
destroyed by the commands in §6, so no owner path, machine account or private
session id appears. The two SHAs are from that throwaway repository and
resolve to nothing anywhere else.

## 5. Interfaces at the component boundary

Three boundaries matter here. All three are real signatures a caller writes
against, not descriptions.

```ts
/** PR #43's harness, extended by this run with a typecheck step.
 *  `tools/stack/integrate.sh --json <path>` writes exactly this. */
interface IntegrationReport {
  /** ISO-8601, `date -u +%Y-%m-%dT%H:%M:%SZ`. */
  generatedAt: string
  /** 40-hex SHA of origin/main the union was built from. */
  baseSha: string
  /** Human-readable, e.g. "#27 first (it defines the docs/ideas.md merge
   *  driver), then PR number ascending". */
  orderRationale: string
  branches: Array<{
    pr: number
    branch: string
    result: 'merged' | 'conflict'
    /** Repo-relative paths left in `--diff-filter=U`. Empty when merged. */
    conflictedFiles: string[]
  }>
  ledger: {
    /** `grep -c '^### '` over the union's docs/ideas.md. */
    entries: number
    /** Must be 0. Any other value is the failure the driver exists to stop. */
    conflictMarkers: number
  }
  suites: {
    /** ADDED BY THIS RUN. "pass (0 type errors)" or
     *  "FAIL (<n> type errors, see /tmp/ursa-stack-types.log)". Reported
     *  separately from `ursaMajorTest` because in a union a type error and a
     *  failing assertion have different causes. */
    ursaMajorTypecheck: string
    ursaMajorTest: string
    ursaMinorBuild: string
  }
  merged: number
  conflicted: number
  /** false when anything above failed. The script's exit status is 0 iff this. */
  green: boolean
}
```

```ts
/** The cross-branch contract this run's four defects violated. A field
 *  declared REQUIRED on a shared type is a promise made to every other
 *  branch, including branches whose code the author never saw. */
interface CommitPair {
  generatedSha: string
  finalSha: string
  paths: string[]
  /** PR #66. Required, so EVERY construction site must fill it, including
   *  `src/adapters/github-pr.ts` from PR #33, which PR #66 could not see. */
  interveningMerges: MergeEvent[]
}
```

```ts
/** PR #66's attribution hook on the resolver, shown because the fix in
 *  `src/adapters/github-pr.ts` turns on what an honest default is. */
interface ResolveInput {
  /** Omit it and every deletion is attributed to the human. The
   *  pull-request adapter passes `interveningMerges: []`, which means
   *  "nothing known" rather than "nothing happened" — see §7. */
  attributeDeletion?: (filePath: string, spanText: string) => DeletionAttribution
}
```

## 6. Exact commands

The literal invocations this run executed, in order, with real flags.

Land the stack:

```bash
git fetch --quiet origin
git checkout -b engineer/2026-10-03-land-the-engineer-stack origin/main

git merge --no-edit origin/engineer/2026-09-27-ledger-union-merge
bash tools/ledger/install-driver.sh          # MUST run here, not later

for b in engineer/2026-09-30-land-the-stack \
         engineer/2026-09-24-trace-stage-loops \
         engineer/2026-09-25-artifact-kind \
         engineer/2026-09-25-fixture-browsable-record \
         engineer/2026-09-26-get-briefing \
         engineer/2026-09-26-verdict-to-record \
         engineer/2026-09-27-verdict-eval \
         engineer/2026-09-28-record-integrity-gate \
         engineer/2026-09-28-pr-adapter \
         engineer/2026-09-29-next-rce-breakfix \
         engineer/2026-09-29-semantic-nearest-cases \
         ursa-engineer/2026-09-30-window \
         engineer/2026-09-30-span-lifespan \
         engineer/2026-10-01-consent-gate \
         engineer/2026-10-01-server-side-ledger-merge \
         engineer/2026-10-02-merge-aware-deletion ; do
  git merge --no-edit "origin/$b" || break    # stop and resolve by hand
done
```

Verify the union, every check this run ran:

```bash
node tools/ledger/check.mjs docs/ideas.md
cd ursa-major && npm ci && npx tsc --noEmit && npm test
cd ../ursa-minor && npm ci && npm run build
cd .. && node scripts/dep-floor.mjs
```

Reproduce the four type defects, which is the finding worth repeating:

```bash
# At the merge commit, BEFORE the fix commit f6456e8:
git worktree add --detach /tmp/prefix-union <that merge commit>
ln -s "$PWD/ursa-major/node_modules" /tmp/prefix-union/ursa-major/node_modules
cd /tmp/prefix-union/ursa-major
npx tsc --noEmit  | grep -c 'error TS'     # -> 4
npx vitest run    | grep -E 'Tests '       # -> 309 passed | 4 skipped
cd - && rm -f /tmp/prefix-union/ursa-major/node_modules
git worktree remove --force /tmp/prefix-union && git worktree prune
```

The one real run, edge (H), reproducible from nothing:

```bash
rm -rf /tmp/smoke && mkdir /tmp/smoke && cd /tmp/smoke && git init
git config user.email a@b.c && git config user.name "Alex Owner"
# ...write doc.md with >200 chars of generated prose, then:
git -c user.name="Claude" -c user.email="noreply@anthropic.com" \
    commit -m "draft the doc

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
# ...edit the closing line by hand, then:
git commit -am "rewrite the close by hand"
git commit -am "a later commit, so durability has history to walk"
cd - && npx tsx ursa-major/src/bin/ursa.ts run /tmp/smoke --declare satisfied
```

`--min-chars` defaults to `200`, so a smoke document shorter than that
resolves zero records and the run is not broken. This cost one false alarm
during the run and is written down so it costs nobody a second one.

Re-run PR #43's harness, now with the typecheck step, against any order:

```bash
bash tools/stack/integrate.sh --json /tmp/union.json 27 43 13 16 18
bash tools/stack/integrate.sh --no-tests --keep          # conflict map only
```

## 7. What this run changed, and the defect class it names

Twelve of the seventeen branches merged with no human decision. Five needed
one. Every conflict and every resolution:

| PR | File | What collided | Resolution |
|---|---|---|---|
| #18 | `ursa-major/src/cli.ts` | five hunks: `--artifact-kind`/`--render-ref` (#16) against `--generated-at` (#18) | both, in one `resolve()` call carrying `artifact` and `generatedAt` |
| #22 | `ursa-major/package.json` | `record:fixture` script against `brief` and `hq:demo` | all three scripts |
| #36 | `ursa-major/package-lock.json` | the `vitest` 2.1.8 to 5.0.2 security bump | took #36's lock, then `npm install --package-lock-only` to fold in `jsdom` |
| #38 | `ursa-major/package.json` + lock | #38 branched before the bump, so it reasserts `vitest ^2.1.8` | kept `^5.0.2` and added `optionalDependencies`. A downgrade here reintroduces the critical advisory #36 exists to close |
| #56 | `ursa-major/src/bin/ursa.ts` | `findCommitPairs` against `findCommitPairsWithDiagnostics`; the hosted-URL line against the diagnostics block | the diagnostics variant, which `findCommitPairs` now delegates to; both summary blocks |
| #57 | `README.md`, `src/bin/ursa.ts` | the `artifact.kind` paragraph against the lifespan paragraph; two module-table rows against one | all paragraphs, all three rows, both summary blocks |
| #59 | `ursa-major/src/bin/ursa.ts` | the erasure-aware summary branch dropped the `diagnostics` argument | #59's branch structure, passing `diagnostics` through |
| #66 | `src/bin/ursa.ts`, `src/pairfinder.ts`, `src/resolve.ts` | imports; the header comment; `Artifact` against `DeletionAttribution` | both imports, both option fields. For the comment, see below |

One of those is a judgement rather than a union. PR #66's header comment on
`src/pairfinder.ts` still describes the author-name fallback as safe because
"a false negative loses signal, so the fallback errs toward matching." PR #56
had already corrected exactly that sentence, having found the opposite: a
human commit mistaken for a generated one is not eligible as a pairing
target, so it does not lose one commit's signal, it deletes the whole pair.
Both branches were written against `main`, so #66 could not see the
correction. The resolution keeps #56's corrected paragraph and carries over
only #66's new fact, the `interveningMerges` sentences. Taking "theirs"
mechanically on that file would have reverted a correction, which is the
quiet way a landing loses work.

### The defect class: a required field is a cross-branch contract

Four type errors exist in the union and in no branch:

| Site | Missing field | Added by | Constructed by |
|---|---|---|---|
| `src/adapters/github-pr.ts:375` | `interveningMerges` on `PullRequestPair` | #66 | #33 |
| `src/adapters/github-pr.ts:402` | `interveningMerges` on `PullRequestEpisode` | #66 | #33 |
| `src/hq/fixtures.ts:28` | `humanDeletedChars`, `humanDeletedPct`, `mergeDeletedChars` | #66 | #22 |
| `src/hq/fixtures.ts:58` | `artifact` on `OutcomeRecord` | #16 | #22 |

Each branch merged clean against every other branch, and each passed its own
suite. The errors are invisible to the suites because **`vitest` transpiles
through esbuild and never typechecks.** Measured, not assumed: at the merge
commit before the fix, `npx tsc --noEmit` reports 4 errors in 2 files while
`npx vitest run` reports 309 passed and 4 skipped.

Two changes follow, and they are the durable part of this run:

1. `ursa-major/package.json` — `"test": "tsc --noEmit && vitest run"`, with
   `"typecheck": "tsc --noEmit"` beside it for callers that want the step
   alone. A green suite can no longer speak for a tree that does not compile.
2. `tools/stack/integrate.sh` — a named typecheck step ahead of the suites,
   reported as `suites.ursaMajorTypecheck` in `IntegrationReport` and as its
   own row in the markdown report. This is the extension of PR #43 that
   L-E10's first permitted move asks for. The harness ran on 2026-09-30 and
   on this run's first measurement and reported the union green both times,
   because it only ever ran `npm test`.

The honest limit on the fix to `src/adapters/github-pr.ts`:
`interveningMerges: []` means "this adapter has not looked," not "no merge
destroyed anything." It restores the pre-#66 behaviour for the pull-request
path, which attributes every deletion to the human, and PR #66's own
evidence is that this label was 65% wrong where merges were involved.
Populating it for the pull-request path is real work and is filed in
`docs/ideas.md` as "Merge attribution stops at the git walker."

## 8. Tooling list

Every tool named carries its version, its job here, and why it rather than
the alternative that was considered.

| Tool | Version | Its job in this run | Why it, over what else |
|---|---|---|---|
| `git` | 2.55.0 | the seventeen merges, the `--diff-filter=U` conflict census, the detached worktree that reproduced the pre-fix type errors | the merge is the deliverable; nothing else performs a three-way merge with a custom per-path driver |
| `git worktree` | bundled with git 2.55.0 | a second checkout of one commit, so the pre-fix tree could be typechecked without touching the branch | a `git stash` round trip would have measured a tree that no commit contains, and so would not be reproducible by a reader |
| `gh` | 2.101.0 | the pull-request survey, `--json number,headRefName` for the branch list, opening the draft PR | the GitHub REST API through `curl` needs a token handled by hand, which the secrets boundary forbids |
| `node` | 22.23.3 | runs the ledger driver and `tools/ledger/check.mjs`; the `JSON.parse` assertion on the emitted report | already the runtime both packages target, so no version is introduced that the product does not already carry |
| `npm` | 10.9.9 | `npm ci` for reproducible installs; `npm install --package-lock-only` to resolve two lockfile conflicts without a network install of the tree | `npm ci` refuses a lock that disagrees with `package.json`, which is exactly the check wanted after a lockfile conflict |
| `typescript` (`tsc`) | 5.9.3 | the step that found all four union defects, `--noEmit` so it checks without producing output | `vitest` cannot do this at all, which is the finding; `tsc --noEmit` is already in the dependency tree, so the step costs nothing new |
| `vitest` | 5.0.2 | the 309-test suite on the union | it is the suite the branches are written in. The version is #36's security bump, kept over #38's `^2.1.8` deliberately |
| `tools/ledger/union-merge.mjs` | PR #27, this union | merges seventeen appends to `docs/ideas.md` by entry identity | git's built-in `union` driver was measured by PR #61 and silently drops three of five contract fields; the only line-level alternative corrupts data |
| `tools/ledger/check.mjs` | PR #27, this union | verifies the merged ledger against the six-field contract rather than trusting the driver | reading 62 entries by eye is not verification, and PR #61 showed the corruption class parses as valid markdown |
| `tools/stack/integrate.sh` | PR #43, extended here | measures any proposed merge order in a scratch worktree before a branch is touched | GitHub reports mergeability one branch against `main` at a time and can never answer the whole-union question |
| `scripts/dep-floor.mjs` | PR #36, this union | asserts no critical advisory anywhere and no high advisory in a production tree | `npm audit` alone exits nonzero on dev-only findings, so it cannot be a gate; the floor script carries `dep-floor.allow.json` |

## 9. What this does not do

- **It does not merge anything.** The branch is pushed and PR #69 is opened
  for the owner. ADR-14 and this seat's charter both reserve the merge.
- **It does not touch the other 33 open pull requests.** The frontend, skill,
  market, research, security, finance, OKR and PM stacks are untouched and
  their own seats own them. Seven of them append to `docs/ideas.md`: #14,
  #21, #28, #34, #50, #52 and #64. The merge-order consequence is in PR #69's
  description.
- **It does not close the seventeen pull requests.** They stay open and
  reviewable. If the owner prefers them one at a time, this branch is
  deletable with no loss, and §6's commands rebuild it in one pass.
- **It does not fix the pull-request adapter's merge attribution.** See §7.
