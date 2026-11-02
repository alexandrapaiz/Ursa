# The third launch: bringing `ursa pr` under the parity definition

**Status:** built 2026-11-02 (engineer seat, fifth message pass).
**Code:** `ursa-major/src/adapters/pr-launch.ts`,
`ursa-major/src/adapters/pr-command.ts`,
`ursa-major/src/adapters/pr-launch.test.ts`,
`ursa-major/src/adapters/pr-gate-wiring.test.ts`.
**Supersedes nothing.** It extends `docs/design/launch-parity.md`, which
describes two launches, to the three that exist.

---

## 1. The defect, stated once

`ursa-major/src/launch.ts` opened with the sentence "the decisions both
launches must make identically" and named two of them: `ursa run`
(`src/bin/ursa.ts`) and `ursa ci` (`src/ci/run.ts`). A third launch had
existed since the pull-request adapter shipped. It was the resolve-and-write
loop inside `src/adapters/cli.ts run`, and the comment at the top of that
file said why it was there and that it was temporary:

> Folding these into `ursa pr <N>` in src/bin/ursa.ts is owed once PR #16
> lands, since that PR is editing the same file; until then the adapter
> ships its own entry point rather than conflict with work already in the
> merge queue.

PR #16 landed. The fold did not happen, and because the loop was never on
the surface a person types, no parity test and no reader of
`src/bin/ursa.ts` ever met it. It asked none of the three questions
`src/launch.ts` exists to answer, so three drifts that had already been
found and fixed on the CI launch were live again on a third one.

**Why this path and not another.** The pull-request launch is the only one
that finds anything on a repository whose every commit is an agent's. The
n=3 dogfood run over 470 commits of this repository produced zero records
through the git-pair path; the PR adapter reads 23 pairs out of the same 13
merged pull requests and finds a human writing the final text in 6 of them
(`ursa-major/src/adapters/README.md`). The launch with no gate, no erasure
check and the wrong size floor was the launch running on the corpus the
product demonstrates itself with.

### 1.1 The three drifts, numbered 9, 10 and 11

Numbered continuing `src/launch.ts`'s own list of eight, because they are
the same three defects that list already carries, re-occurring on a caller
nobody compared.

| Drift | What the loop did | What it should do | The earlier occurrence |
|---|---|---|---|
| **9. Erasure** — the user's deletion did not survive re-derivation | nothing: it resolved every episode the pull request yielded | skip an episode whose id is tombstoned in `.ursa/consent.json`, via `erasedEpisodeIds` | drift 3, found on `ursa ci` 2026-10-10 |
| **10. The self-check** — records were written and never checked against the 18 bounds | nothing: the loop ended at `saveEpisodes` and returned 0 | run `gateRecords` over the records just written and make its verdict the exit code | drift 2, found on `ursa ci` 2026-10-10 |
| **11. The size floor** — a refusal-only record was dropped, silently | asked `record.stats.generated.totalChars < minChars` directly | ask `keepRecord`, which asks `clearsSizeFloor` and tallies which bound dropped what | drifts 1 and 6, found on `ursa ci` 2026-10-10 and on `ursa run` 2026-10-24 |

**Drift 9 is the one that breaks a promise the product makes in writing.**
Constraint 2 in `README.md` is that the user can always see, edit, revoke
and delete what has been inferred about them. `ursa forget`'s own success
message, at `ursa-major/src/consent.cli.ts`, is:

```
  Its id is tombstoned, so `ursa run` will not rebuild it from the git
  history it came from.
```

That sentence was true of the launch it names and false of the one the
same user would reach for on an agent-run repository.

---

## 2. The measurement that found it, and the measurement that closes it

### 2.1 On this repository's own history

The target is pull request #645, merged into `main` on 2026-11-02. The
clone must be complete, because the PR adapter reads blobs at the head and
merge commits:

```bash
bash tools/ensure-full-clone.sh
cd ursa-major && npm install
```

**Before the repair**, with the loop as `src/adapters/cli.ts` held it at
commit `42da306`:

```
$ npx tsx src/adapters/_old-run.ts run --pr 645 --project /tmp/…/Ursa
alexandrapaiz/Ursa#645: 6 work units, 3 records.
12,206 chars survived verbatim, 0 survived edited.
326 chars the person dropped, 0 destroyed by a merge inside the pull request, 0 with no readable cause.
Records: /tmp/…/Ursa/.ursa/records/

$ npx tsx src/bin/ursa.ts forget /tmp/…/Ursa --record epito-…-pr645-54dae55
Erased epito-…-pr645-54dae55.
  The record file is gone.
  Its id is tombstoned, so `ursa run` will not rebuild it from the git history it came from.

$ npx tsx src/adapters/_old-run.ts run --pr 645 --project /tmp/…/Ursa
alexandrapaiz/Ursa#645: 6 work units, 3 records.
$ ls /tmp/…/Ursa/.ursa/records/ | grep 54dae55
epito-…-pr645-54dae55.json          # back on disk
```

**After the repair**, same pull request, same clone, same erased id:

```
$ npx tsx src/bin/ursa.ts pr /tmp/…/Ursa --pr 645
alexandrapaiz/Ursa#645: 6 work units, 2 records.
12,157 chars survived verbatim, 0 survived edited.
30 chars the person dropped, 0 destroyed by a merge inside the pull request, 0 with no readable cause.

3 work units resolved to nothing, with no import to state: the generated
file was not readable at the final commit, or no path in it survived to be
classified.

1 work unit you erased stayed erased.

Records: /tmp/…/Ursa/.ursa/records/
Resolved by: resolver 9f108210 (working tree had uncommitted changes)
Checked against: 18 bounds, set `10a82f2bc5f1ae6f`
```

Three differences in that output, each one a drift closed. The record count
is 2 and not 3, because the erased unit stayed erased. The paragraph naming
three units that resolved to nothing is drift 11's tally, which the old loop
computed nowhere and printed nowhere. The two trailing lines name the
resolver build and the bound set, which is the gate having run at all.

`_old-run.ts` above is a two-line throwaway, not committed:

```ts
import { main } from './_old-cli'
main(process.argv.slice(2)).then((c) => process.exit(c))
```

over `git show 42da306:ursa-major/src/adapters/cli.ts > src/adapters/_old-cli.ts`.
It is written out here so the before-figures can be reproduced from a
commit rather than taken on this document's word.

### 2.2 On a fixture, which is what the suite runs

`conflictRepo()` in `ursa-major/src/adapters/pr-launch.test.ts` builds a
four-commit repository where an agent rewrites a heading on a branch, the
same heading changes on `main`, and the owner resolves the conflict by
writing a third heading that is in neither parent. Its one work unit carries
**281 generated characters**, which is above the 200-character default floor
and below any floor a test raises.

`importDeclaringRepo()` is the same repository with the agent's commit
carrying `Ursa-Imported-Path: chart.md`. That declaration is authoritative
for the commit's paths (`ursa-major/src/vendored.ts`), so every resolvable
path in the episode is refused and the record has no files, no generations,
and one `exclusions` entry. Its generation side is **0 characters**, so the
predicate the old loop used dropped it at any floor at all.

---

## 3. The system, node by node and edge by edge

Every node below is a file that exists in the repository at the path given.
Every edge is labelled with the type or file format that crosses it, not
with a verb.

```
                     ┌───────────────────────────────┐
                     │ src/bin/ursa.ts               │
                     │ the one binary a person types  │
                     └───────────────┬───────────────┘
                                     │ PullRequestCommandOptions
                                     │ { projectPath, pr, repo,
                                     │   snapshotPath, minChars }
                     ┌───────────────▼───────────────┐
  src/adapters/      │ src/adapters/pr-command.ts    │
  cli.ts run ───────►│ capture-or-load, render, exit  │
   (same type)       └───┬───────────────────────┬───┘
                         │ PullRequestSnapshot   │ PullRequestLaunchResult
                         │                       │ (rendered to stdout)
          ┌──────────────▼──────────┐            │
          │ src/adapters/gh.ts      │            │
          │ capturePullRequest()    │            │
          └──────────────┬──────────┘            │
                         │ PullRequestSnapshot   │
                         │ (JSON over `gh api`)  │
          ┌──────────────▼────────────────────┐  │
          │ src/adapters/pr-launch.ts         │◄─┘
          │ runPullRequestLaunch()            │
          └──┬────────┬────────┬────────┬─────┘
             │        │        │        │
             │        │        │        └─ GateResult ──────┐
             │        │        │                            │
             │        │        └─ DroppedUnits ─────────┐   │
             │        │                                 │   │
             │        └─ Set<string> (erased ep ids) ─┐ │   │
             │                                        │ │   │
             │ PullRequestPair[] / PullRequestEpisode[]│ │   │
             │                                        │ │   │
  ┌──────────▼─────────────────┐        ┌─────────────▼─▼───▼──────────┐
  │ src/adapters/github-pr.ts  │        │ src/launch.ts                │
  │ pairsFromPullRequest()     │        │ erasedEpisodeIds()           │
  │ episodesFromPullRequest()  │        │ keepRecord()/clearsSizeFloor()│
  └──────────┬─────────────────┘        │ newDroppedUnits()            │
             │ blobId/parents lookups    │ gateRecords()                │
  ┌──────────▼─────────────────┐        └──────────────┬───────────────┘
  │ src/adapters/git-reader.ts │                       │ ConsentRecord
  │ gitRepoReader(): RepoReader│        ┌──────────────▼───────────────┐
  └──────────┬─────────────────┘        │ src/consent.ts               │
             │ string (blob text)        │ loadConsent(), isForgotten() │
  ┌──────────▼─────────────────┐        └──────────────┬───────────────┘
  │ src/resolve-episode.ts     │                       │ reads
  │ resolveEpisode()           │        ┌──────────────▼───────────────┐
  └──────────┬─────────────────┘        │ <project>/.ursa/consent.json │
             │ OutcomeRecord             └──────────────────────────────┘
  ┌──────────▼─────────────────┐
  │ src/signals.ts             │
  │ deriveSignals()            │
  └──────────┬─────────────────┘
             │ OutcomeRecord (with signals)
  ┌──────────▼─────────────────┐        ┌──────────────────────────────┐
  │ src/store.ts               │───────►│ <project>/.ursa/records/     │
  │ saveRecord(), saveEpisodes()│  JSON  │ <episodeId>.json             │
  └────────────────────────────┘        │ <project>/.ursa/episodes.json │
                                         └──────────────────────────────┘
  ┌────────────────────────────┐
  │ src/invariants.ts          │  called by gateRecords(), 18 bounds
  │ checkRecord(): Violation[] │  → Violation[]
  └────────────────────────────┘
```

**The two edges that did not exist before 2026-11-02** are the two from
`pr-launch.ts` to `src/launch.ts`: the `Set<string>` of erased episode ids
and the `GateResult`. The third, `DroppedUnits`, existed as an inline
comparison and produced no value anyone could read.

**The edge that deliberately does not exist** is `pr-launch.ts` to
`stampPairingBounds`. See §6.

---

## 4. Interfaces at every component boundary

Real signatures, as a caller would write them.

### 4.1 The launch

```ts
// ursa-major/src/adapters/pr-launch.ts

export const PR_LAUNCH_MIN_CHARS = 200

export interface PullRequestLaunchOptions {
  projectPath: string
  snapshot: PullRequestSnapshot
  reader?: RepoReader          // default gitRepoReader(projectPath)
  minChars?: number            // default PR_LAUNCH_MIN_CHARS
  adapter?: PullRequestAdapterOptions
}

export interface PullRequestLaunchResult {
  episodes: PullRequestEpisode[]
  records: OutcomeRecord[]
  recordPaths: string[]
  dropped: DroppedUnits
  erased: string[]
  gate: GateResult
  exitCode: number
}

export function runPullRequestLaunch(
  opts: PullRequestLaunchOptions,
): PullRequestLaunchResult

export function renderPullRequestSummary(
  snapshot: PullRequestSnapshot,
  result: PullRequestLaunchResult,
  projectPath: string,
): string
```

`snapshot` and not `(repo, number)` is the load-bearing choice: the launch
touches no network, so a caller can hand it a snapshot read off disk, and
the suite drives it with no `gh` on the path. The loop it replaced could
only be run by capturing a live pull request, which is why nothing tested
it.

### 4.2 The command

```ts
// ursa-major/src/adapters/pr-command.ts

export interface PullRequestCommandOptions {
  projectPath: string
  pr: string | null
  repo?: string | null
  snapshotPath?: string | null
  minChars?: number
  noPatches?: boolean
  out?: (line: string) => void
  err?: (line: string) => void
}

export function runPullRequestCommand(opts: PullRequestCommandOptions): number
```

`out` and `err` are injected rather than `console` so the suite reads the
terminal output as values. The return is the process exit code and nothing
else; the command never calls `process.exit`.

### 4.3 What it consumes from `src/launch.ts`, unchanged

```ts
export function erasedEpisodeIds(projectPath: string, episodeIds: string[]): Set<string>
export function newDroppedUnits(minChars: number): DroppedUnits
export function keepRecord(
  record: OutcomeRecord | null,
  minChars: number,
  dropped: DroppedUnits,
): record is OutcomeRecord
export function gateRecords(records: OutcomeRecord[]): GateResult
```

---

## 5. On-disk layout

Nothing new is written. The launch writes the same two artifacts the other
two launches write, in the same places.

```
<project>/
  .ursa/
    consent.json                  # read for tombstones, never written here
    episodes.json                 # PullRequestEpisode[], overwritten per run
    records/
      <episodeId>.json            # one OutcomeRecord
```

`<episodeId>` is built by `episodesFromPullRequest` as
`<project-slug>-pr<number>-<generatedSha first 7>`. On this repository's
own PR #645, in a clone at `/tmp/<scratch>/Ursa`:

```
.ursa/records/epito-ursa-engineer-vgoc6t-pr645-54dae55.json
.ursa/records/epito-ursa-engineer-vgoc6t-pr645-aa86d16.json
.ursa/records/epito-ursa-engineer-vgoc6t-pr645-de76b0e.json
```

The slug is the clone's own directory name, which is why these three carry
a scratch directory's name rather than `ursa`. That is a real example and
not a placeholder: it is what the command writes, and a reader comparing it
to their own output should expect their directory name in the same position.

### 5.1 A real payload: the consent file that makes drift 9 visible

This is the actual `.ursa/consent.json` written by `ursa forget` during the
measurement in §2.1, with the record id truncated per the redaction rider
in `prompts/engineer-agent.md`:

```json
{
  "schemaVersion": "0.1.0",
  "updatedAt": "2026-11-02T02:31:39.371Z",
  "scopes": {
    "minor-aggregate": {
      "state": "withheld",
      "changedAt": null,
      "history": []
    }
  },
  "forgotten": [
    {
      "recordId": "epito-…-pr645-54dae55",
      "forgottenAt": "2026-11-02T02:31:39.371Z",
      "removed": {
        "recordFile": true,
        "axiomsDeleted": [],
        "evidenceStripped": 0,
        "sourcesRemoved": 0,
        "blockedDropped": 0
      }
    }
  ]
}
```

`changedAt: null` and the absent `createdAt` are the file as written, not
an elision: `withheldByDefault` in `ursa-major/src/consent.ts` creates the
scope with no change behind it, and a scope nobody has touched has no
change date to carry.

`forgotten[0].recordId` is the whole of drift 9. `erasedEpisodeIds` reads
that array; the old loop did not open this file.

### 5.2 The episode id and the record id are the same string

`isForgotten` is handed a **record** id and `erasedEpisodeIds` is handed
**episode** ids, and nothing in the types says those are the same string.
They coincide because `resolveEpisode` copies `ep.id` into `record.task.id`.
The erasure check becomes a silent no-op the day that stops being true, so
`pr-launch.test.ts` asserts it:

```ts
expect(result.records[0].task.id).toBe(result.episodes[0].id)
```

---

## 6. What this deliberately does not do

**It does not call `stampPairingBounds`.** A pull request is its own
window. `pairsFromPullRequest` pairs commits inside one pull request's own
commit list, and `PullRequestAdapterOptions` carries two regexes and no
reach limit at all, so there is no `--max-pair-distance`,
`--max-pair-age-hours` or `--max-interposed-generations` for this path to
have applied. `task.pairedBy` therefore stays **absent**, and absent is a
real claim here rather than a gap: the rule is the one `src/apparatus.ts`
states for `resolvedBy`, `gatedBy` and `pairedBy` alike, that absent is
never a placeholder. A record stamped with bounds no walk applied would be
worse than one carrying none, because a buyer filtering on the field would
read a default as a measurement.

**It does not call `annotateDurability`.** The local git-pair launch walks
the commits after an episode closed and records how long each span lasted.
This path could, since a merged pull request has history after it in any
clone that is not shallow, and `ursa ci` cannot, since at merge time there
is none yet. Whether a pull-request record may assert the time dimension is
a product decision about what that record claims rather than a drift
repair, which is the reason `src/launch-parity.test.ts` leaves `lifespan`
in `ALLOWED_TO_DIFFER` for the CI launch. It is in `docs/ideas.md` as a
proposal.

**It does not add a `bothLaunches`-style record diff.** The git-pair parity
test diffs two records field by field because both of its launches read the
same commit pairs off the default branch. This launch reads a different
population on purpose, so there is no counterpart record to diff against.
What is compared instead is the three decisions, each against the behaviour
measured before the repair.

---

## 7. Exact commands

Every command below is run verbatim, from the directory named.

```bash
# 1. A complete clone. The PR adapter reads blobs at the head and merge
#    commits, and a shallow checkout answers `not in this clone` for both.
cd <repo-root>
bash tools/ensure-full-clone.sh

# 2. Install, once.
cd ursa-major
npm install

# 3. The launch, against one pull request of the repository you are in.
npx tsx src/bin/ursa.ts pr <projectPath> --pr 645

# 3a. …with the metadata captured earlier, so nothing calls `gh`.
npx tsx src/adapters/cli.ts snapshot --pr 645 --out /tmp/pr-645.json
npx tsx src/bin/ursa.ts pr <projectPath> --snapshot /tmp/pr-645.json

# 3b. …with the floor moved, when the summary says which value to type.
npx tsx src/bin/ursa.ts pr <projectPath> --pr 645 --min-chars 281

# 4. Erase one record, then prove the next run leaves it erased.
npx tsx src/bin/ursa.ts forget <projectPath> --record <recordId>
npx tsx src/bin/ursa.ts pr <projectPath> --pr 645   # "1 work unit you erased stayed erased."

# 5. The old entry point, which is now the same function.
npx tsx src/adapters/cli.ts run --pr 645 --project <projectPath>

# 6. The checks this change has to pass.
npx tsc --noEmit
npx vitest run src/adapters/pr-launch.test.ts
npx vitest run src/adapters/pr-gate-wiring.test.ts
npx vitest run src/launch-parity.test.ts
npm run regen           # rebuild dist/ursa.cjs and the digest index
npm run regen:check     # verify both, write nothing
cd .. && node tools/secret-scan.mjs && node scripts/redaction-check.mjs
```

Step 6's `regen` is not optional. `src/bin/ursa.ts` is in the bundle the
GitHub Action executes, so adding a subcommand changes `dist/ursa.cjs`, and
`src/bundle-exec.test.ts` fails until the bundle is rebuilt and committed.
`regen` must be run twice with a commit in between, because the digest index
is built from committed history and cannot see an uncommitted build.

---

## 8. Tooling

| Tool | Version | Its job here | Why it, over what was considered |
|---|---|---|---|
| Node.js | 22.23.2 (`node --version` on this host) | runs the launch and the suite | the version the GitHub Action's runner has without a setup step, which is the constraint behind `dist/ursa.cjs` being a committed single file. Nothing newer is reachable on the runner without adding an install step the Action design refuses |
| TypeScript | 5.7.2 (`ursa-major/package.json` devDependencies) | `tsc --noEmit` type-checks the new interfaces | already the project's compiler. `PullRequestLaunchResult` is a contract two surfaces read, and a JSDoc-only contract would not have caught the `GateResult` import the first draft omitted |
| tsx | 4.19.2 (same file) | runs `.ts` entry points without a build step | already how every `ursa` command is documented. Compiling to `dist/` for local runs would give a second artifact that can disagree with the source, which is the whole subject of `docs/design/resolver-identity.md` |
| vitest | 5.0.5 (resolved; `^5.0.2` declared) | the two new test files | already the project's runner, and its `vi.mock` with `importOriginal` is what makes `src/adapters/pr-gate-wiring.test.ts` possible: the gate's verdict can be forced without adding a seam to production code. `node:test` has no equivalent module-replacement primitive |
| git | 2.x, whatever the host provides | builds the fixtures and is the only dependency `RepoReader` has | the subject, not a choice |
| esbuild | 0.28.0 (same file) | `npm run bundle` rebuilds `dist/ursa.cjs` | already the project's bundler; unchanged by this work and listed because step 6 above runs it |
| GitHub CLI (`gh`) | 2.101.0 (`gh --version`) | `capturePullRequest` shells out to `gh api` for pull-request metadata | already the adapter's capture path. It is now avoidable: `--snapshot` reads the same JSON off disk, which is how the suite runs with no credential and no network |

---

## 9. Terms used above, defined in place

- **Launch** — one of the entry points that fires the resolver over a
  project and writes records. There are three: `ursa run`, `ursa ci`,
  `ursa pr`.
- **Drift** — a decision one launch makes differently from another over
  identical history. Numbered in `ursa-major/src/launch.ts`.
- **Episode** — one unit of work: a generation and the later commit that
  edited it. On this path, a commit inside a pull request paired with the
  commit that closed it.
- **Closure** — how a pull request ended, which decides what the final text
  is. `branch-edit`, `merge-resolution`, `merge-as-accepted`, and the
  others listed in `PullRequestClosure` (`src/adapters/github-pr.ts`).
- **Refusal-only record** — a record whose every resolvable path was an
  import, so it has no files and no generations, and carries one
  `exclusions` entry naming where the content came from. It exists so that
  a run which classified nothing says why instead of writing nothing.
- **Bound** — one of the 18 checks in `src/invariants.ts` that a record must
  satisfy. `BOUND_COUNT` is derived from the bounds themselves.
- **Tombstone** — the entry `ursa forget` writes into
  `.ursa/consent.json`, naming a record id so that re-derivation does not
  recreate it.
- **The gate** — `gateRecords` in `src/launch.ts`, which runs
  `checkRecord` over every record a launch wrote and turns a violation into
  a non-zero exit, after the records are on disk.
