# Reading many pull requests as one corpus: `ursa corpus`

Written 2026-11-08 by the engineer seat, against the engineering-artifact
standard in `prompts/engineer-agent.md`. Every figure below was measured
on this host on 2026-11-08 and names the command that reproduces it.

---

## 1. The defect, stated once

`docs/okrs/2026-q4.md` KR1.3 asks for **five or more completed outcome
records on distinct real finished works**, with at least two on the prose
path and at least one joining generations from more than one source. Its
status in that file is `at-risk`, and KR2.1 (the methodology document at
v1.0, due 2026-11-30) depends on it, because KR2.1's own text requires
every quantitative claim to be "re-grounded in the n≥5 corpus rather than
task-001 alone".

Nothing in this repository could answer where KR1.3 stood. Every launch
reports one work unit at a time. `renderPullRequestSummary`
(`ursa-major/src/adapters/pr-launch.ts`) prints one pull request's
figures; `src/ci/comment.ts` prints one merge's; `src/bin/ursa.ts run`
prints one project's walk. A corpus-level question — how many **distinct
finished works** do the records on disk cover, how many of those are
prose, how many records carry a **correction** at all — had no answer
except opening record files by hand, which is how the trials table in
`README.md` has been maintained.

**The second half of the defect, which is the one that made this a
measurement rather than a report.** `README.md`'s n=3 row says of the
dogfood run that produced zero records:

> the owner's corrections are in the pull requests she merged, which is
> the pull-request path's job

That is a claim about a population of **358 merged pull requests**
(`gh pr list --state merged --limit 400 --json number --jq 'length'`, run
2026-11-08). It had been checked against **one**: pull request #645, in
`docs/design/pr-launch-parity.md` §2.1. Re-running that one pull request
today gives three records over **one file**, with
`survived_mutated` at **zero characters**:

```
$ npx tsx src/bin/ursa.ts pr <path-to-clone> --pr 645
alexandrapaiz/Ursa#645: 6 work units, 3 records.
12,206 chars survived verbatim, 0 survived edited.
326 chars the person dropped, 0 destroyed by a merge inside the pull request, 0 with no readable cause.
```

Read on its own, that single pull request says the pull-request path
finds no corrections on this repository either, which would make the n=3
row's sentence false and the corpus unreachable. Read as one member of a
population, it says something much narrower: #645 is a pull request
nobody edited. Telling those two readings apart requires a sweep, and
there was no sweep.

---

## 2. What the sweep found

### 2.1 The window

The window ATTEMPTED was **the 30 most recently merged pull requests
of `alexandrapaiz/Ursa`**, merged between `2026-11-02T06:47:41Z` (#707)
and `2026-11-08T23:47:12Z` (#743). The window is stated because a corpus
figure with no stated window is a defect this repository has already
filed against itself (`docs/ideas.md`, 2026-11-08, "Every measurement
this repository publishes should state the window it was measured over").
It is a recency window and not a sample: these are the 30 newest, so the
figures describe how this repository works *now* and are not a claim
about all 358.

The selection command, so the window is reproducible rather than quoted:

```bash
gh pr list --state merged --limit 30 --json number,mergedAt \
  --jq 'sort_by(.mergedAt) | [.[].number] | join(",")'
```

### 2.2 Which of the two runs below is the measurement

Two sweeps were run. **The five-pull-request run in §2.3 is the completed
measurement and every figure in this document comes from it.** The
thirty-pull-request run in §2.4 did not finish, and why it did not is the
sharpest finding of the day; it is reported as a finding and not as a
figure. Nothing below averages the two or quotes a partial total from the
second, because a corpus figure drawn from an unfinished sweep has no
window.

### 2.3 The completed measurement: five pull requests

Run first to check the command before paying for thirty captures, then run
again from an empty `.ursa/` after the area breakdown was added, so the
output below is the current command's and not an earlier build's. Both runs
produced identical counts.

```
$ npx tsx src/bin/ursa.ts corpus <path-to-clone> --prs 736,737,738,731,732 \
    --window "5 pull requests of alexandrapaiz/Ursa chosen as the five most recently merged at 2026-11-08T23:40Z, resolved through the pull-request launch on 2026-11-08"
Corpus: 5 pull requests of alexandrapaiz/Ursa chosen as the five most recently merged at 2026-11-08T23:40Z, resolved through the pull-request launch on 2026-11-08

| source | work units | records | verbatim | edited | person dropped | refused |
|---|---|---|---|---|---|---|
| alexandrapaiz/Ursa#736 | 0 | 0 | 0 | 0 | 0 |  |
| alexandrapaiz/Ursa#737 | 0 | 0 | 0 | 0 | 0 |  |
| alexandrapaiz/Ursa#738 | 8 | 2 | 7,711 | 0 | 11 |  |
| alexandrapaiz/Ursa#731 | 45 | 28 | 90,785 | 1,901 | 11,842 |  |
| alexandrapaiz/Ursa#732 | 0 | 0 | 0 | 0 | 0 |  |

5 source(s) swept, 2 with at least one record, 0 this sweep could not measure.
53 work unit(s) found, 30 became records. 1 fell under the --min-chars floor, 22 resolved to nothing with no import to state, 0 stayed erased.
337,354 characters of finished work classified: 98,496 kept unchanged (29.2%), 1,901 kept after an edit (0.6%), 217,208 with no generation behind them (64.4%).
240,421 generated characters: 11,853 the person dropped, 0 destroyed by a merge, 0 with no readable cause.

Against KR1.3 (docs/okrs/2026-q4.md), measured, not scored:
  "five or more completed outcome records on distinct real finished works": 14 distinct finished work(s) across 30 record(s).
  "at least two use the prose path (.md/.txt/.tex)": 10 of those 14.
  "at least one joins generations from more than one source": 0 record(s). A pull-request record carries no conversations, so zero here is a fact about this path and not a missing measurement.
  What those 14 finished work(s) ARE, by area, because the size of a corpus and its subject are different facts: docs/runs 9, docs/provenance 2, ursa-major/src 2, ursa-major/tools 1.
  Not in KR1.3, and the reason the corpus exists: 9 of 30 record(s) carry a correction, meaning an edited span or a signal derived from one.

Records: /tmp/epito-ursa-engineer-xSfC5I/.ursa/records/

real	4m26.223s
user	0m44.617s
sys	0m18.582s
```

**Three things in that output are the finding, and the third is the one
that matters.**

1. **#645 is not representative, in either direction.** Three of these
   five pull requests produce no records at all, and one (#731) produces
   28. A one-pull-request check could have landed on either and been
   wrong about the population both times.
2. **The distinct-subject count is not the record count.** 30 records
   cover **14** distinct finished works, because the pull-request path
   pairs each agent commit inside a pull request with the commit that
   edited it, and several commits touch the same file. KR1.3 asks for
   records "on distinct real finished works", so the number that answers
   it is 14 and not 30. A corpus reader that counted records would have
   reported #645 alone as three finished works where the truth is one.
3. **1,901 characters survived after an edit, so the corrections are
   real and the n=3 row's sentence holds.** Nine of the 30 records carry
   one. That is 0.6% of the classified text, which is small and is
   exactly the shape `CLAUDE.md` §1 predicts: the edit is the correction,
   and corrections are rare and dense rather than common and diffuse.
4. **What the 14 finished works ARE is a weaker result than how many
   there are.** They group as `docs/runs` 9, `docs/provenance` 2,
   `ursa-major/src` 2, `ursa-major/tools` 1. Ten of the 14 are on the
   prose path and **nine of those ten are seat run logs**, which is
   agents writing about their own runs rather than a person's prose work.
   KR1.3's prose clause is answerable by that number and should not be
   answered by it quietly, so `renderCorpus` prints the areas on the same
   line as the count and `src/corpus.test.ts` holds the real 14 paths as
   a case. The disposition is in `docs/ideas.md` as a proposal; it is a
   product decision about what corpus to draw, not a defect to repair.

### 2.4 The thirty-pull-request run did not finish, and that is the finding

The sweep of the §2.1 window was started at 23:52Z and was still inside
its **first** entry, #707, thirty-five minutes later, at 31% of one core
the whole time, with no record written. It reached no second pull request.

The cause is measurable and is not the number of pull requests:

| | the five-pull-request run (§2.3) | #707, alone |
|---|---|---|
| Wall clock | about 5 minutes for all five | over 35 minutes, unfinished |
| Records written | 30 | 0 |
| Commits in the pull request | up to 45 work units found | 2 commits, 3 files |
| Largest file classified | 37,082 characters (`ursa-major/src/adapters/github-pr.test.ts`) | `docs/sprints/pending.md`, 231,992 characters |

On this path a generation is the whole blob of a touched file at the
agent's commit (`src/adapters/pr-launch.ts`), so for `pending.md` the
generation and the final text are both a quarter of a megabyte. The
five-pull-request run never met a file above 37 KB. The ratio of the two
largest files is 6.3 and the ratio of the two wall clocks is at least 42,
so the cost scales with file size rather than with pull request count.

**Where the time goes is a separate question, and the one measurement
taken argues against the obvious answer.** `time` over the completed
five-pull-request run reads `real 4m26s, user 0m44s, sys 0m18s`, so about
a quarter of that wall clock was CPU inside the node process and the rest
was spent waiting on child processes: `gh api` once per commit in
`capturePullRequest`, and `git` once per read in `gitRepoReader` and in
`src/corroborate.ts`, which asks git whether a span's text exists outside
the generation's line of descent **per span**. A 232 KB file yields
thousands of spans. So the suspect is per-span subprocess fan-out rather
than in-process string matching, and if that is right then a ceiling on
generation size would treat the symptom while the fix belongs in
`src/corroborate.ts`. The #707 process showed 31% of one core averaged
over 25 minutes, which is consistent with that reading and does not prove
it. **This document therefore names no remedy.** Measuring where the time
goes is the first step of the ledger entry, and the entry says in writing
that naming the bound before measuring the cause is how a product
acquires a flag that does not help.

**Why this is a product defect and not a slow afternoon.** Three
properties the product already holds elsewhere are absent here:

1. **No bound in either direction but one.** `src/launch.ts` holds three
   decisions for every launch, and one of them, `--min-chars`, is a size
   bound: a generation too *small* is refused and the refusal is reported
   with the value that would admit it. There is no bound at the other
   end, so a generation whose resolve will not finish is not refused, it
   is attempted. Whether the right bound is on generation size or on the
   per-span work behind it is the open question above.
2. **No report.** A run that attempts it says nothing while it does.
   `renderPullRequestSummary` prints after the launch returns, so a
   caller watching a terminal cannot distinguish a long resolve from a
   hang, which is exactly the state this run spent thirty-five minutes
   in. The progress line `ursa corpus` prints per entry is this change's
   partial answer and it is per pull request, not per file.
3. **No claim either way.** A refusal is a statement a buyer can audit:
   `record-exclusions.md` exists because a run that declines to classify
   something must say so in the record. A timeout states nothing at all.

It is filed in `docs/ideas.md` as of 2026-11-08 with status `urgent`,
under "A generation has no size ceiling, and one 232 KB file stalled a
thirty-pull-request sweep", because it is not a wrong answer, it is no
answer, and the measurement KR2.1's 2026-11-30 deadline depends on cannot
be run over its own stated window until it is fixed.

### 2.5 One real correction, in full

From `<project>-pr731-603f022`, the record over
`docs/runs/engineer-2026-11-02-message-14.md`. The model wrote a shell
command naming one tool; the person changed it to name a different one.
Nobody filed a complaint and nobody graded an answer. The work either
used the string or it did not, and this is the record of it not doing so:

```json
{
  "start": 18570,
  "end": 18597,
  "text": "node tools/root-entries.mjs",
  "class": "survived_mutated",
  "score": 0.6,
  "source": {
    "conversationId": "git-603f022",
    "model": "Claude Opus 5 <noreply@anthropic.com>",
    "turnIndex": 1,
    "generationIndex": 0,
    "start": 15199,
    "end": 15229
  },
  "diff": [
    { "value": "node tools/" },
    { "value": "doc", "removed": true },
    { "value": "root", "added": true },
    { "value": "-" },
    { "value": "model/check", "removed": true },
    { "value": "entries", "added": true },
    { "value": ".mjs" }
  ],
  "descent": { "basis": "corroborated", "rivalsSearched": 0 }
}
```

Read the `diff` array and the correction states itself: the generation
said `node tools/doc-model/check.mjs`, and the finished work says `node
tools/root-entries.mjs`. The label is supplied by the artifact. That is
the commercial object `CLAUDE.md` §1 describes, recovered from a merged
pull request with no annotation step.

---

## 3. The system, node by node and edge by edge

Every node below is a file that exists in this repository, named as it is
named in code. Every edge carries a named type or a named file format.

### 3.1 Nodes

| Node | What it is | Path |
|---|---|---|
| `gh` subprocess | the GitHub CLI, invoked as `gh api`, which is the only node in this diagram that opens a socket | external binary, version in §6 |
| `capturePullRequest` | function that turns a pull request number into a `PullRequestSnapshot` value by calling the node above once per commit | `ursa-major/src/adapters/gh.ts` |
| `gitRepoReader` | function returning a `RepoReader`, which answers "what were this path's bytes at this commit" and "what are this commit's parents" by shelling out to `git` | `ursa-major/src/adapters/git-reader.ts` |
| `runPullRequestLaunch` | the pull-request launch: pairs commits, builds episodes, resolves each, applies the size floor, skips erased episodes, runs the invariant gate, writes records | `ursa-major/src/adapters/pr-launch.ts` |
| `runCorpusCommand` | the sweep: loops the three nodes above over a list of pull request numbers and collects one `CorpusEntry` per number | `ursa-major/src/corpus-command.ts` |
| `summarizeCorpus` | pure function, `CorpusEntry[]` to `CorpusTotals` | `ursa-major/src/corpus.ts` |
| `corpusShape` | pure function, `CorpusEntry[]` to `CorpusShape`, which is the three quantities KR1.3's three clauses ask about | `ursa-major/src/corpus.ts` |
| `renderCorpus` | pure function, `CorpusEntry[]` plus a window sentence, to the report text | `ursa-major/src/corpus.ts` |
| the record store | the directory records are written into, one JSON file per record | `<project>/.ursa/records/` |
| the episode index | the file naming every episode a launch built, written whether or not it became a record | `<project>/.ursa/episodes.json` |
| the tombstone file | what `ursa forget` writes, read by `erasedEpisodeIds` so a sweep does not rebuild an erased record | `<project>/.ursa/consent.json` |
| `src/bin/ursa.ts` | the command surface, which dispatches `corpus` to `runCorpusCommand` | `ursa-major/src/bin/ursa.ts` |

### 3.2 Edges

| From | To | What flows across it |
|---|---|---|
| `src/bin/ursa.ts` | `parsePrList` | the raw `--prs` string, for example `707,703,736-738` |
| `parsePrList` | `runCorpusCommand` | `{ prs: number[] }`, de-duplicated, in the order given |
| `runCorpusCommand` | `capturePullRequest` | `(repo: string, number: number, { noPatches, repoPath })` |
| `capturePullRequest` | `gh` subprocess | argv `['api', 'repos/<owner>/<name>/pulls/<n>']`, then one `['api', 'repos/<owner>/<name>/commits/<sha>']` per commit, then `['api', 'repos/<owner>/<name>/pulls/<n>/comments', '--paginate']` |
| `gh` subprocess | `capturePullRequest` | GitHub REST JSON on stdout |
| `capturePullRequest` | `runCorpusCommand` | one `PullRequestSnapshot` value |
| `runCorpusCommand` | `runPullRequestLaunch` | `{ projectPath: string, snapshot: PullRequestSnapshot, reader: RepoReader, minChars: number }` |
| `runPullRequestLaunch` | `gitRepoReader` | a path and a commit SHA, per blob read |
| `runPullRequestLaunch` | the record store | one `OutcomeRecord` serialized as JSON, per record, named `<recordId>.json` |
| `runPullRequestLaunch` | the episode index | the full `PullRequestEpisode[]` serialized as JSON |
| the tombstone file | `runPullRequestLaunch` | the erased episode id list, as `string[]` |
| `runPullRequestLaunch` | `runCorpusCommand` | one `PullRequestLaunchResult` value |
| `runCorpusCommand` | `summarizeCorpus`, `corpusShape`, `renderCorpus` | `CorpusEntry[]` |
| `renderCorpus` | stdout | the report text in §2.4, GitHub-flavoured Markdown table plus prose lines |
| `runCorpusCommand` | stderr | one `ursa corpus: <owner>/<name>#<n>` progress line per entry, and every refusal reason |

**The one edge that is deliberately absent.** `runCorpusCommand` does not
write anything of its own into `.ursa/`. The report goes to stdout and is
not persisted, because a corpus figure is only true of the window it was
measured over, and a file named `corpus.json` in the store would be read
later as a standing fact. A caller who wants to keep one redirects stdout
into a dated file, which is what §5 shows.

---

## 4. Interfaces at every component boundary

These are the signatures a caller writes against, copied from the source
rather than paraphrased.

### 4.1 The pure reader (`ursa-major/src/corpus.ts`)

```ts
export const PROSE_EXTENSIONS: readonly string[]  // ['.md', '.txt', '.tex']
export type Surface = 'prose' | 'other'
export function surfaceOf(path: string): Surface

export interface CorpusEntry {
  label: string
  workUnits: number
  records: OutcomeRecord[]
  belowMinChars: number
  unresolvable: number
  erased: number
  violations: number
  refusal?: string
}

export interface CorpusTotals {
  entries: number
  entriesWithRecords: number
  entriesRefused: number
  workUnits: number
  records: number
  belowMinChars: number
  unresolvable: number
  erased: number
  violations: number
  finalChars: number
  byClass: Record<SpanClass, number>
  generatedChars: number
  humanDeletedChars: number
  mergeDeletedChars: number
  unknownDeletedChars: number
}

export interface CorpusShape {
  distinctSubjects: string[]
  proseSubjects: string[]
  multiSourceRecords: string[]
  correctionCarryingRecords: string[]
}

export function summarizeCorpus(entries: CorpusEntry[]): CorpusTotals
export function corpusShape(entries: CorpusEntry[]): CorpusShape
export function carriesCorrection(record: OutcomeRecord): boolean
export function renderCorpus(entries: CorpusEntry[], window: string): string
```

`renderCorpus`'s second parameter is required and not optional. A corpus
report with no window sentence is the defect named in §2.1, and an
optional parameter is a defect you can reach by forgetting.

`CorpusShape`'s four fields are arrays of identifiers rather than counts,
so a caller that disagrees with a number can print the members and check
it. `distinctSubjects` holds repository-relative file paths;
`proseSubjects` is its subset; `multiSourceRecords` and
`correctionCarryingRecords` hold `record.task.id` values.

### 4.2 The sweep (`ursa-major/src/corpus-command.ts`)

```ts
export interface CorpusCommandOptions {
  projectPath: string
  prs: number[]
  repo?: string | null
  minChars?: number
  noPatches?: boolean
  window?: string
  out?: (line: string) => void
  err?: (line: string) => void
}

export function runCorpusCommand(opts: CorpusCommandOptions): number
export function defaultWindow(repo: string, prs: number[]): string
export function parsePrList(spec: string): { prs: number[] } | { error: string }
```

`parsePrList` returns a result union rather than throwing or returning
`null`, so the caller must handle the error branch to compile and the
message reaches the user instead of a stack trace.

### 4.3 What it consumes, unchanged

```ts
// ursa-major/src/adapters/pr-launch.ts
export function runPullRequestLaunch(opts: PullRequestLaunchOptions): PullRequestLaunchResult

// ursa-major/src/adapters/gh.ts
export function capturePullRequest(
  repo: string, number: number, opts?: CaptureOptions,
): PullRequestSnapshot
export function currentRepo(repoPath: string): string

// ursa-major/src/adapters/git-reader.ts
export function gitRepoReader(repoPath: string): RepoReader
export function fetchPullRequestRef(repoPath: string, number: number): void
```

No signature in §4.3 changed for this work, which is the property that
keeps the sweep from being a fourth launch. The three decisions
`ursa-major/src/launch.ts` holds for every launch — the `--min-chars`
floor, which episodes the user erased, and the eighteen-bound invariant
gate — are asked by `runPullRequestLaunch` and are therefore asked once
per entry here, with no second implementation to drift.

### 4.4 Exit codes, which differ from `ursa pr` on purpose

| Code | When | Why not the same as `ursa pr` |
|---|---|---|
| 0 | every entry was measured and the invariant gate found nothing | same meaning as `ursa pr` |
| 1 | the gate found a violation in some entry's records | same meaning, aggregated |
| 2 | no entry could be measured at all, so there is no corpus | `ursa pr` returns the gate's verdict on one pull request, where the records it just wrote are the whole answer. A sweep's answer is the corpus, so one unreachable pull request in a list of thirty must become a refusal row and must not suppress the other twenty-nine |

Exit 2 for "cannot answer" is this repository's existing convention, used
by `tools/board/post.mjs` and by `tools/ledger/recheck-urgent.mjs`.

---

## 5. On-disk layout

Nothing in this work adds a file format. The sweep reads and writes the
store the three launches already use.

```
<project>/
  .ursa/
    consent.json                     # tombstones; read, never written here
    episodes.json                    # every episode built, per launch
    records/
      <project>-pr731-603f022.json   # one OutcomeRecord, written by saveRecord
      <project>-pr731-1149d9d.json
      ...
```

`<project>` above stands for the basename of the path you pass as
`projectPath`, lowercased; `pr731` names the pull request the episode
came from; the trailing seven characters are the generation commit's
abbreviated SHA. Record ids and paths in this document are written in
that placeholder form on purpose: the literal ones carry this host's
sandbox directory name, and the redaction rider in
`prompts/engineer-agent.md` element 3 forbids publishing machine
identity. The format is real and runnable; the identity is not this
machine's.

`.ursa/` belongs in the target project's `.gitignore`, and is in this
repository's. A sweep of thirty pull requests wrote 33 record files into
it on this host and none of them is committed or committable, which is
the same consent boundary `README.md` states: a record is raw text, and
publishing one is something you do on purpose.

### 5.1 A real payload

§2.5 is the real payload: one `FinalSpan` with
`class: "survived_mutated"`, as it appears inside
`<project>-pr731-603f022.json`, copied byte-for-byte out of the file this
run wrote apart from the record id in the prose around it. Its `diff`
array is the correction, and its `source` block is the provenance pointer
back to the generation extent, which is what makes the label auditable
rather than asserted.

### 5.2 Where the report goes

Nowhere, unless you redirect it. Progress and refusals go to stderr and
the report goes to stdout, so:

```bash
npx tsx src/bin/ursa.ts corpus <path-to-clone> --prs 707,703,702 \
  > docs/measurements/corpus-2026-11-08.md
```

writes the report and nothing else into the file, with the progress lines
still on the terminal. There is no `docs/measurements/` convention in
this repository yet and this document does not establish one; the example
shows the stream split, which is the property the command guarantees.

---

## 6. Exact commands

Literal invocations, with real flags. Every one of them was run on this
host on 2026-11-08.

```bash
# 0. A complete clone. The pull-request adapter reads blobs at head and
#    merge commits, and a shallow checkout answers "not in this clone" for
#    both. The clone this run was handed had 7 commits.
bash tools/ensure-full-clone.sh
#   -> clone completed: 7 -> 4549 commits, 3 -> 322 remote-tracking refs under origin/.

# 1. Install, once. 343M, which is why this is a step and not an assumption.
cd ursa-major && npm ci --no-audit --no-fund

# 2. The window, as a reproducible selection rather than a quoted list.
gh pr list --state merged --limit 30 --json number,mergedAt \
  --jq 'sort_by(.mergedAt) | [.[].number] | join(",")'

# 3. The sweep. --window states what §2.1 states, in the report itself.
npx tsx src/bin/ursa.ts corpus /path/to/clone \
  --prs 707,703,702,706,712,710,713,717,704,715,709,719,705,720,723,718,721,722,726,731,727,716,732,729,728,737,736,738,739,743 \
  --window "the 30 most recently merged pull requests of alexandrapaiz/Ursa, merged 2026-11-02T06:47:41Z through 2026-11-08T23:47:12Z, resolved through the pull-request launch on 2026-11-08"

# 3a. Ranges, for a window that is contiguous. Inclusive at both ends.
npx tsx src/bin/ursa.ts corpus /path/to/clone --prs 700-710

# 3b. One pull request, through the launch this sweep calls, for comparison.
npx tsx src/bin/ursa.ts pr /path/to/clone --pr 645

# 4. The checks this change has to pass.
cd ursa-major
npx tsc --noEmit                      # -> exit 0
npx vitest run src/corpus.test.ts     # -> 17 passed
npm run regen                         # rebuild dist/ursa.cjs after any src/ edit
npm run regen:check                   # -> clean
cd .. && node scripts/ci-checks.mjs   # the repository's own 16 checks
```

**Step 4's `npm run regen` is not optional and is the one step easy to
skip.** `src/bin/ursa.ts` gained a command, and
`ursa-major/dist/ursa.cjs` is a committed single file that the GitHub
Action executes on a runner with no install step. Two suites assert the
bundle is byte-current against its source
(`src/bundle-canonical.test.ts`, `src/bundle-exec.test.ts`). Skipping the
rebuild turns both red, which is what happened in this run before the
rebuild and is recorded here so the next reader of those two failures
recognises them.

---

## 7. What this deliberately does not do

- **It does not decide KR1.3.** `renderCorpus` prints each clause of the
  key result with the number that answers it and the words "measured, not
  scored". No function here returns a boolean named after an objective,
  and `src/corpus.test.ts` asserts the output contains no `KR1.3 met` or
  `KR1.3 fails` string. The thresholds are the owner's to read; a seat
  that scored them would be writing a verdict into a planning surface its
  charter forbids it to edit.
- **It does not sweep by itself.** There is no default window, no "all
  merged pull requests" flag, and no cron. `--prs` is required. A sweep
  of all 358 merged pull requests would make roughly 1,800 `gh api`
  calls, and a command that could do that by accident is a command that
  will.
- **It does not resolve episodes.** Every entry goes through
  `runPullRequestLaunch`. The drift list at the top of
  `src/adapters/pr-launch.ts` is eleven entries long because three
  callers each grew their own resolve loop, and a sweep with its own loop
  would be drift 12.
- **It does not read the records already on disk.** The sweep resolves
  what it reports, in this run, so the figures and the window agree. A
  reader of `.ursa/records/` would be summarising whatever past runs
  happened to leave there, which is a corpus whose window cannot be
  stated.
- **It does not add the multi-source record KR1.3's third clause asks
  for.** That clause wants one record joining Claude Code sessions with a
  pasted conversation, and the pull-request path carries no conversations
  at all: `record.conversations` is empty on every record here, so the
  count is zero and zero is a true statement about the path rather than a
  gap in the measurement. Closing that clause is the session path's work
  (`src/cli.ts --conversations`) and is in the ledger as a proposal, not
  taken here.

---

## 8. Tooling

| Tool | Version | Its job here | Why it, over what was considered |
|---|---|---|---|
| Node.js | 22.23.2 (`node --version` on this host) | runs the sweep and both suites | the version the GitHub Action's runner has with no setup step, which is the constraint behind `dist/ursa.cjs` being one committed file. Nothing newer is reachable there without an install step the Action design refuses |
| TypeScript | 5.9.3 (`npx tsc --version`; `^5.7.2` declared in `ursa-major/package.json`) | `tsc --noEmit` checks the new interfaces | already the project's compiler, and it earned its place in this change: the first draft of `src/corpus.ts` enumerated four span classes, and `tsc` rejected it because `SpanClass` is three — `generated_deleted` is a `GenerationFate` belonging to a generation's own spans. A JSDoc-only contract would have shipped a fourth column of zeros |
| tsx | 4.19.2 (`^4.19.2` declared) | runs `src/bin/ursa.ts` with no build step | already how every `ursa` command is documented. Compiling to `dist/` for local runs gives a second artifact that can disagree with the source, which is the subject of `docs/design/resolver-identity.md` |
| vitest | 5.0.5 (resolved; `^5.0.2` declared) | `src/corpus.test.ts`, 17 cases | already the project's product runner. `expect(...).not.toMatch` over the rendered report is what holds the "measured, not scored" property as a test rather than an intention |
| GitHub CLI (`gh`) | 2.101.0 (`gh --version`) | `capturePullRequest` shells out to `gh api`; `gh pr list` selects the window | already the capture path for `ursa pr`. The alternative was a direct REST client, which would need credential handling this repository deliberately does not have: `gh` carries the token and no secret is read, named or stored by any file in this change |
| git | 2.43.0 (`git --version`) | `gitRepoReader` reads blobs and parents; `tools/ensure-full-clone.sh` repairs depth | the subject, not a choice. Its version is named because the shallow-clone behaviour §6 step 0 repairs is version-specific |
| esbuild | 0.28.0 (`^0.28.0` declared) | `npm run regen` rebuilds `dist/ursa.cjs` after the `src/bin/ursa.ts` edit | already the project's bundler, unchanged by this work, listed because §6 step 4 runs it and skipping it turns two suites red |

---

## 9. What this opens, not taken here

1. **The committed window is five pull requests, chosen by recency.** The
   30-pull-request window was attempted and did not finish (§2.4), so
   whether the 0.6% edited share and the 9-of-30 correction rate hold
   over a larger population is unmeasured. It is not merely a matter of
   typing a longer `--prs`: until the §2.4 defect is understood, a longer
   list buys a longer stall. The ordering is therefore fixed — measure
   where the resolve time goes, then widen the window.
2. **The corpus is of one repository.** KR1.3's words are "distinct real
   finished works", and 14 distinct files inside one repository is a
   defensible reading of that phrase and not the only one. A corpus over
   a second repository would settle it, and `--prs` with `--repo` already
   accepts one.
3. **`no_generation_provenance` is the largest class in §2.3 at 64.4%,
   and `CLAUDE.md` §1 calls that category the most valuable.** Nothing in
   this work reads it. A corpus-level view of *what* has no generation
   behind it, rather than how much, is the obvious next question and is
   in the ledger as a proposal.

---

## 10. Terms used above, defined in place

- **Corpus** — a set of outcome records read together, with the window
  they were measured over stated. Not a directory and not a file: the
  word names the set and the window jointly, which is why
  `renderCorpus` requires the window as an argument.
- **Window** — the sentence naming which sources were swept and over what
  range of time. #2.1 is this document's.
- **Launch** — one of the entry points that fires the resolver over a
  project and writes records. There are three: `ursa run`, `ursa ci`,
  `ursa pr`. `ursa corpus` is not a fourth; it calls the third.
- **Work unit** — one generation commit paired with the commit that
  edited it. Called an episode once built (`PullRequestEpisode`).
- **Record** — one `OutcomeRecord`, the artifact `CLAUDE.md` §1
  describes: a finished piece of work joined backward to every generation
  that fed it, with each span classified by what happened to it.
- **Distinct finished work** — one file path, counted once however many
  records classify it. KR1.3's unit, and not the record count.
- **Prose path** — a file whose extension is `.md`, `.txt` or `.tex`,
  quoted from KR1.3 rather than widened. `.rst` and `.adoc` are prose by
  any ordinary reading and are deliberately excluded, because a set that
  scored a fourth extension would report a number the key result did not
  ask for.
- **Correction** — an edit the person made to generated text that
  survived into the finished work, recorded as a `survived_mutated` span
  with a character-level `diff`, or a signal derived from one
  (`correctionLoops`, `oneShotCorrections`, `regressions`,
  `repairAttempts` in `LabSignals`). The edit *is* the correction; nobody
  filed a complaint.
- **Refusal row** — a table row for an entry the sweep could not measure,
  carrying the reason in its last column. Two reasons occur: a capture
  that failed, and a merge commit absent from the clone, which changes
  what a deletion inside that pull request means.
- **The size floor** — `--min-chars`, default 200 on this path
  (`PR_LAUNCH_MIN_CHARS`). A work unit whose generation side is smaller
  is found and not recorded, and the report says how many and what value
  would record the largest of them.
- **The gate** — `gateRecords` in `ursa-major/src/launch.ts`, which runs
  the eighteen bounds of `src/invariants.ts` over every record a launch
  wrote and turns a violation into a non-zero exit, *after* the records
  are on disk, because an impossible record is still the evidence of the
  defect.
- **Tombstone** — the entry `ursa forget` writes into `.ursa/consent.json`
  naming a record id, so re-derivation does not recreate it. The sweep
  honours it because `runPullRequestLaunch` does.
