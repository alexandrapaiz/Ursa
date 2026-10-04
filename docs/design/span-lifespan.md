# The time dimension — how long a span survived, not just whether it did

Built 2026-09-30 by the engineer seat. Implements the one element of
the core data artifact (`CLAUDE.md` §1) that had no code behind it:

> **Time dimension (when intermediate versions exist):** not just
> *what* survived but *how long*. This separates text that looked right
> and died on contact with the real work from text that was wrong on
> arrival.

Written to the engineering-artifact standard in
`prompts/engineer-agent.md`. Every node below is a file that exists,
every signature is copied from the source, and the example payload is a
real record emitted by a real run.

## 1. The defect this closes

A record's span classes are a verdict taken at **one instant**. That
instant is `Episode.finalSha` — the first commit by a non-agent author
that touched the same paths the agent's commit did (`pairfinder.ts`).
Everything the repository did afterwards is invisible to the record.

Two outcomes that are commercially opposite therefore look identical or
inverted today:

| What happened | Class today | Is the label right? |
|---|---|---|
| The user deleted the text in the very edit that closed the episode. | `generated_deleted` | Yes. Wrong on arrival, correctly labelled. |
| The user kept the text, shipped it, and three commits later the real work removed it. | `survived_verbatim` | **No.** It is sold as text the user endorsed. It is text that died on contact. |

The second row is a false positive in the reward signal, and it is the
expensive kind: a lab training on it learns that the generation was
good, when the work itself later said otherwise. Ursa Minor's whole
claim is that "the label is supplied by the artifact rather than by a
grader" (`CLAUDE.md` §1). A label taken at one instant and never
re-checked is a grader's snapshot wearing the artifact's clothes.

The evidence needed to fix it is already on disk. The "intermediate
versions" the vision asks for are the commits after `finalSha`.

## 2. System diagram

Nodes are files in `ursa-major/src/`. Edges carry named types from
`ursa-major/src/types.ts` or a named shell output.

```
                    ┌──────────────────────────┐
                    │ bin/ursa.ts              │
                    │ main(argv) — the launch  │
                    └───────────┬──────────────┘
                                │ projectPath: string (absolute)
                                ▼
                    ┌──────────────────────────┐
                    │ pairfinder.ts            │
                    │ findCommitPairs()        │
                    └───────────┬──────────────┘
                                │ CommitPair[]
                                ▼
                    ┌──────────────────────────┐
                    │ episodes.ts              │
                    │ buildEpisodes()          │
                    └───────────┬──────────────┘
                                │ Episode[]  (carries generatedSha, finalSha, closedAt)
                                ▼
                    ┌──────────────────────────┐
                    │ bin/ursa.ts              │
                    │ resolveEpisode()         │
                    └───────────┬──────────────┘
                                │ OutcomeRecord — files[].spans[] classified at finalSha,
                                │ every FinalSpan.lifespan still undefined
                                ▼
        ┌───────────────────────────────────────────────────┐
        │ lifespan.ts — annotateDurability()   [NEW]        │
        │                                                   │
        │   ┌─────────────────────────────────────────┐     │
        │   │ revisionsAfter(repo, closingSha, path)  │     │
        │   └──────────────┬──────────────────────────┘     │
        │                  │ FileRevision[]                 │
        │                  │ (from `git log finalSha..HEAD`)│
        │                  ▼                                │
        │   ┌─────────────────────────────────────────┐     │
        │   │ traceFile(repo, path, spans, closedAt,  │     │
        │   │           revisions)                    │     │
        │   │   ├─ segment.ts: segment(span.text,     │     │
        │   │   │    modeForPath(path)) → Span[]      │     │
        │   │   │    the per-sentence / per-line units│     │
        │   │   ├─ normalize.ts: normalize() → Normalized  │
        │   │   └─ spanPresent(unitNorm, fileNorm,    │     │
        │   │        fileTokens) → Presence           │     │
        │   │        uses match.ts: tokens(),         │     │
        │   │        containment(), THETA_HIGH        │     │
        │   └──────────────┬──────────────────────────┘     │
        │                  │ writes FinalSpan.lifespan: SpanLifespan
        │                  ▼                                │
        │   ┌─────────────────────────────────────────┐     │
        │   │ aggregate → OutcomeRecord.durability    │     │
        │   └─────────────────────────────────────────┘     │
        └───────────────────────┬───────────────────────────┘
                                │ OutcomeRecord (now carrying Durability)
                    ┌───────────┴────────────┐
                    ▼                        ▼
        ┌──────────────────────┐  ┌──────────────────────────┐
        │ signals.ts           │  │ store.ts                 │
        │ deriveSignals()      │  │ saveRecord()             │
        │ → LabSignals         │  │ → <project>/.ursa/       │
        └──────────────────────┘  │   records/<id>.json      │
                                  └──────────────────────────┘
                                │
                                ▼
                    ┌──────────────────────────┐
                    │ bin/ursa.ts              │
                    │ renderRunSummary()       │
                    │ → string, to stdout      │
                    └──────────────────────────┘
```

Edge into `git`: `lifespan.ts` shells out twice, and only twice.
`git log --reverse --topo-order --max-count=N <sha>..HEAD -- <path>`
returns tab-separated `%H\t%aI\t%an\t%s`, parsed into `FileRevision[]`.
`git show <sha>:<path>` returns the file's bytes at that revision as
UTF-8, or exits non-zero when that revision deleted the path, which is
read as "absent" rather than as an error.

## 3. Interfaces at every component boundary

Copied from `ursa-major/src/lifespan.ts` and `ursa-major/src/types.ts`.

```ts
// lifespan.ts — the module's public surface

export const MAX_REVISIONS: number        // 50
export const MIN_TRACEABLE_LEN: number    // 24

export interface FileRevision {
  sha: string
  /** ISO-8601 author date */
  at: string
  author: string
  subject: string
}

export function headSha(repoPath: string): string | null

export function revisionsAfter(
  repoPath: string,
  sha: string,
  path: string,
  limit?: number,
): FileRevision[]

export type Presence =
  | { present: true; basis: 'verbatim' | 'token-containment' }
  | { present: false }

export function spanPresent(
  spanNorm: string,
  fileNorm: string,
  fileTokens: Set<string>,
): Presence

export function traceFile(
  repoPath: string,
  path: string,
  spans: FinalSpan[],
  closedAt: string,
  revisions: FileRevision[],
): FinalSpan[]

export function annotateDurability(
  repoPath: string,
  record: OutcomeRecord,
  closingSha: string,
  closedAt: string,
  maxRevisions?: number,
): OutcomeRecord
```

```ts
// types.ts — the schema additions

export interface SpanLifespan {
  revisionsChecked: number
  unitsTraced: number
  unitsSurviving: number
  survivingChars: number
  decayedChars: number
  intactRevisions: number
  intactSeconds: number
  diedAtSha: string | null
  diedAt: string | null
  liveAtTip: boolean
  fate: 'durable' | 'eroded' | 'decayed' | 'untested'
  basis: 'verbatim' | 'token-containment' | null
  skipped: 'too-short' | 'no-later-revisions' | null
}

export interface Durability {
  method: 'git-forward-walk'
  tipSha: string | null
  closingSha: string
  testedSpans: number
  durableSpans: number
  erodedSpans: number
  decayedSpans: number
  durableChars: number
  decayedChars: number
  decayRate: number | null
  baselineDecayRate: number | null
  medianIntactSeconds: number | null
  maxRevisionsWalked: number
  minTraceableLen: number
}

export interface FinalSpan {
  // ...unchanged fields...
  lifespan?: SpanLifespan
}

export interface OutcomeRecord {
  // ...unchanged fields...
  durability?: Durability
}
```

Both new fields are optional, so every record written before today
still parses against the schema and `schemaVersion` stays `'0.1.0'`.
A record produced from pasted conversations, which has no git history
behind it, simply never gets them.

### Term definitions

No term below is used anywhere in this document or in the code without
this meaning.

- **closing commit** — `Episode.finalSha`. The first commit by a
  non-agent author touching paths the agent's commit touched. The
  instant at which span classes are taken.
- **tip** — the commit `HEAD` points at when `ursa run` executes. The
  walk's far end.
- **unit** — one sentence (for `.md`, `.txt`, `.tex`) or one line (for
  everything else) inside a span, produced by `segment()` in
  `segment.ts`, the same function `resolve()` uses. The thing actually
  traced.
- **durable** — every one of a span's units was still present at the
  tip.
- **eroded** — some of a span's units were still present at the tip and
  some were not. The common case for a merged prose span.
- **decayed** — none of a span's units was still present. The span's
  own class label is a false positive.
- **untested** — either no commit followed the closing commit for this
  file, or the span held no unit at least `MIN_TRACEABLE_LEN` (24)
  normalized characters long. Never counted as either survival or
  decay.
- **decayRate** — `decayedChars / (durableChars + decayedChars)` over
  spans classed `survived_verbatim` or `survived_mutated`. The share of
  a record's own "the user kept it" verdict that later work overturned.
- **baselineDecayRate** — the same ratio over spans classed
  `no_generation_provenance`, which is text the user wrote themselves.
  The repository's background churn.

## 4. Why the unit, and not the span

The first implementation tested whole spans and was wrong in the common
case. `resolve()` merges adjacent same-class prose, so a markdown file
usually reaches `traceFile` as **one** span. Asking "is this span still
present" of a 400-character span, with the token-containment tier
below, answers yes even after a third of it is deleted.

This was not caught by reasoning. It was caught by running the CLI end
to end on a repository where a whole paragraph had been removed and
reading `0%` in the summary. The fix — decompose each span with the
same segmenter `resolve()` used, trace each unit, apportion the chars —
took the same repository from a false `0%` to `30%`, which is the
deleted paragraph's exact share of the span. §8 has both runs.

## 5. The presence test, and what it costs

`spanPresent` has two tiers and introduces **no new threshold**. It
reuses `THETA_HIGH = 0.6` from `match.ts`, the same constant that
decides `survived_mutated`, so a durability claim is explainable from
exactly the numbers the class labels came from.

1. **verbatim** — the unit's normalized text is a substring of the
   file's normalized text. Untouched.
2. **token-containment** — at least `THETA_HIGH` of the unit's tokens
   are still somewhere in the file. Edited again, substance intact.

Bag-of-tokens rather than a windowed edit distance, on purpose. The
question is whether the text still exists in the file, not where it
moved to, so position carries no information here; and a windowed
Levenshtein over every unit × every revision × every file would cost
more than the resolve it annotates.

The cost of that choice, named rather than hidden: a unit whose tokens
were scattered into unrelated sentences reads as present. The error is
therefore **one-directional** — the test can over-report survival and
cannot over-report decay. So `decayRate` is a conservative floor on
decay, not a point estimate, and it is safe to quote to a lab in that
form.

Three guardrails, each with a test in `src/lifespan.test.ts`:

- **`MIN_TRACEABLE_LEN = 24`** normalized characters. Twice
  `match.ts`'s `MIN_VERBATIM_LEN`. A six-character unit like `return`
  is present in nearly every revision of nearly every file, so calling
  it durable manufactures signal out of a common token. Below the
  length it is `untested`, never `durable`.
- **`MAX_REVISIONS = 50`** per file. A cap, not a judgement: a unit
  still present fifty revisions later is durable by any standard a lab
  cares about.
- **null, not zero.** When nothing was testable every rate is `null`.
  "Nothing decayed" and "nothing was measured" are different claims and
  only one of them is sellable.

Two further decisions worth stating because both could reasonably have
gone the other way:

- **`finalSha..HEAD`, not `--all`.** The walk asks what the work that
  actually shipped did to this text, not what an abandoned branch did.
  When the closing commit is not an ancestor of `HEAD` the range is
  empty and the result is `untested`, never a guess.
- **`--follow` is not used.** It would make a rename read as continuity
  of content. The question is about the text, not the path.

## 6. On-disk layout

Unchanged paths. `annotateDurability` adds keys inside the record file
that `store.ts` already writes.

```
<project>/.ursa/
├── episodes.json                 # Episode[], written by saveEpisodes()
└── records/
    └── <episode-id>.json         # OutcomeRecord, written by saveRecord()
```

`<episode-id>` is `${basename(projectPath)}-${YYYY-MM-DD}-${sha7}`, for
example `ursa-minor-site-2026-09-30-3e710c9`.

### Real example payload

Emitted by the run in §8 into
`/tmp/demo-proj/.ursa/records/demo-proj-2026-09-30-3e710c9.json`.
Excerpted to the new keys; commit ids are truncated to git's short form
per the redaction rider in `prompts/engineer-agent.md`, and the project
path is written as `~/Desktop/<project>` rather than any real home
directory.

```json
{
  "schemaVersion": "0.1.0",
  "task": { "id": "demo-proj-2026-09-30-3e710c9", "finished": true },
  "files": [
    {
      "path": "onboarding.md",
      "spans": [
        {
          "class": "survived_verbatim",
          "text": "Ursa Major reads the work you already finished and joins it back to the\nmodel generations that produced it. Nothing runs in the background and\nno daemon watches your machine.\n\nRetention through the next commit is treated as acceptance, so a span\nyou did not delete is recorded as a span you endorsed.",
          "lifespan": {
            "revisionsChecked": 1,
            "unitsTraced": 6,
            "unitsSurviving": 4,
            "survivingChars": 171,
            "decayedChars": 123,
            "intactRevisions": 0,
            "intactSeconds": 0,
            "diedAtSha": "b870f73",
            "diedAt": "2026-09-30T17:01:25Z",
            "liveAtTip": true,
            "fate": "eroded",
            "basis": "verbatim",
            "skipped": null
          }
        }
      ]
    }
  ],
  "durability": {
    "method": "git-forward-walk",
    "tipSha": "4f8a26c",
    "closingSha": "aa07865",
    "testedSpans": 2,
    "durableSpans": 1,
    "erodedSpans": 1,
    "decayedSpans": 0,
    "durableChars": 287,
    "decayedChars": 123,
    "decayRate": 0.3,
    "baselineDecayRate": 0,
    "medianIntactSeconds": 0,
    "maxRevisionsWalked": 50,
    "minTraceableLen": 24
  }
}
```

Read it as: of the 410 characters this record claims the owner kept,
123 were gone by the tip, and the 123 are exactly the paragraph that
commit `b870f73` removed. The owner's own prose in the same episode
decayed at `0`, so the file was not simply volatile.

## 7. Exact commands

Literal invocations, runnable from a clean checkout.

```bash
# Install. npm ci, not npm install: the lockfile is the floor.
cd ursa-major && npm ci

# The whole suite, including the 18 new cases.
npm test

# Just this module.
npx vitest run src/lifespan.test.ts

# Types, with no emit — the build is tsx at runtime, so tsc is the checker.
npx tsc --noEmit -p tsconfig.json

# The launch, against a project with git history.
npx tsx src/bin/ursa.ts run ~/Desktop/<project> --min-chars 100

# Read one record's durability block without a viewer.
python3 -c "import json,glob,sys; \
  r=json.load(open(glob.glob('$HOME/Desktop/<project>/.ursa/records/*.json')[0])); \
  print(json.dumps(r['durability'], indent=2))"
```

The two commands `lifespan.ts` issues internally, with the real flags:

```bash
# revisionsAfter(): the forward walk, oldest first, capped.
git -C <repoPath> log --reverse --topo-order --date=iso-strict \
    --max-count=50 \
    --pretty=format:'%H%x09%aI%x09%an%x09%s' \
    <closingSha>..HEAD -- <path>

# blobAt(): the file's bytes at one revision. Non-zero exit = deleted there.
git -C <repoPath> show <sha>:<path>

# headSha(): the tip the walk ended at.
git -C <repoPath> rev-parse HEAD
```

All three run through `execFileSync` with an argument array, never a
shell string, so a path containing a space or a semicolon cannot become
another command. `stdio` is `['ignore', 'pipe', 'ignore']`: two of the
callers treat a non-zero exit as an answer rather than an error, and
git's `fatal:` line on those is noise in the middle of a clean run.

## 8. Evidence

### The unit test suite

`npm test` in `ursa-major/`: **54 passed (54)**, 6 files, of which
`src/lifespan.test.ts` contributes **18**. Nothing is mocked. Each case
builds a real repository in a temp directory with `git init`, makes
real commits, and reads real blobs, because the thing under test is
precisely whether the revision range and the ordering are right — a
mocked `git log` would test the mock.

The fixture is four commits, the smallest history that can tell the two
failure modes apart:

| # | Author | What it does |
|---|---|---|
| 1 | agent (`Co-Authored-By: Claude`) | writes `notes.md`, `basis.md`, `guide.md` |
| 2 | human | retitles all three, keeps every paragraph, adds one of her own — **this is the closing commit** |
| 3 | human | replaces `basis.md`'s paragraph, cuts one of `guide.md`'s two sentences |
| 4 | human | appends to `notes.md` |

Which yields one span of each fate, plus the control:

| File | Class at the closing commit | Fate after the walk |
|---|---|---|
| `notes.md` (agent prose) | `survived_verbatim` | `durable` |
| `guide.md` (agent prose, two sentences) | `survived_verbatim` | `eroded`, 1 unit of 2 |
| `basis.md` (agent prose) | `survived_verbatim` | `decayed` |
| `notes.md` (the human's own paragraph) | `no_generation_provenance` | `durable` — baseline 0 |

Cases also cover: a ref that does not exist returns `[]` rather than
throwing; a revision that deletes the file kills every unit in it; a
span too short to carry evidence is `untested` and not `durable`; a
record with nothing after it reports `decayRate: null`; and the summary
prints no durability line when nothing was testable.

### End to end through the CLI

Before the unit-granularity fix, on a four-commit project where one
paragraph had been deleted:

```
Of what you kept at the time, 0% was gone by the latest commit.
```

After, on the same project, same command:

```
$ npx tsx src/bin/ursa.ts run /tmp/demo-proj --min-chars 100
1 work units found, 1 resolved into records.
418 chars survived your editing verbatim, 0 survived edited.
That's the part worth noticing: not what got written, what got kept.
431 chars were generated to get there; 5% were drafts you discarded on the way.
Of what you kept at the time, 30% was gone by the latest commit.
Surviving your first edit is not the same as surviving the work.
```

Per span, from the same run:

```
onboarding.md  no_generation_provenance  untested  units 0/0  survived   0ch  decayed   0ch
onboarding.md  survived_verbatim         eroded    units 4/6  survived 171ch  decayed 123ch
privacy.md     no_generation_provenance  durable   units 1/1  survived  25ch  decayed   0ch
privacy.md     survived_verbatim         durable   units 3/3  survived 116ch  decayed   0ch
```

### Against Ursa's own repository — and what it found

```
$ git clone <this repo> /tmp/ursa-demo
$ npx tsx src/bin/ursa.ts run /tmp/ursa-demo --min-chars 200
5 work units found, 5 resolved into records.
```

All five records came back `testedSpans: 0`, `decayRate: null`. That is
the correct output, not a failure: in all five, `closingSha` equalled
`tipSha`, so there was nothing after the closing commit to walk.

The reason is a finding about `pairfinder.ts`, not about this module,
and it is logged in `docs/ideas.md` as **"Every pair collapses to one
final commit when the agent authors everything"**. This repository's
git identity is `claude[bot]`, which matches `DEFAULT_AUTHOR`
(`/claude|codex|cursor|gpt|copilot|github-actions|\[bot\]/i`), so
almost every commit is classified agent-side and skipped as a pairing
target. An exhaustive scan of all **93** commits on `main`: **87**
classify agent-side, **6** human-side, and of those six only **2** are
non-merge commits, which are the only commits eligible to close an
episode at all. Five pairs form, and **zero** of them have even one
later commit touching an overlapping path. The
consequence is larger than durability: `pairfinder` reaches far forward
for the one qualifying human commit and attributes the entire
intervening history to a single generation, which inflates the
survival numbers the record reports.

## 9. Tooling

Every tool carrying its version, its job here, and what it was chosen
over.

| Tool | Version | Job in this system | Chosen over, and why |
|---|---|---|---|
| `git` | 2.55.0 | The store of intermediate versions. `log` supplies the revision list, `show` supplies each blob, `rev-parse` the tip. | Writing our own snapshots into `.ursa/`. Rejected: the versions already exist, are already trusted by the user, and cost nothing to read. Duplicating them would make Ursa a second source of truth about the user's own files. |
| Node.js | 22.23.3 | Runtime. `node:child_process` `execFileSync` issues the git calls. | A `simple-git`-style wrapper. Rejected: three invocations with fixed flags do not justify a dependency, and `execFileSync` with an argument array is already injection-safe. Zero new dependencies was a hard constraint (`CLAUDE.md`: steady-state cost stays $0, and every dependency is future upgrade work — see PR #36, the Next RCE break-fix). |
| TypeScript | 5.9.3 | Type checking, via `tsc --noEmit`. The schema in `types.ts` is the artifact's contract, so it is checked rather than asserted. | Plain JSDoc types. Rejected: `SpanLifespan.fate` is a four-member union and `Durability`'s nullable rates are exactly the places a wrong value would be silently sellable. |
| `tsx` | 4.23.8 | Runs `src/bin/ursa.ts` directly, no build step. Already the project's `resolve` script. | `ts-node`, or a compiled `dist/`. Rejected: M0's promise is one command to a working state (`prompts/engineer-agent.md`, L-E0), and a build step between the user and `ursa run` breaks it. |
| `vitest` | 2.1.9 | Test runner for the 18 new cases. Already the project's `test` script. | `node:test`. Rejected only because vitest was already here; switching runners is not this change's business. |
| `diff` | 8.0.4 | Not used by this module. Listed because it is the resolver's word-level differ and a reader comparing `lifespan.ts` to `resolve.ts` will ask why one uses it and the other does not. `lifespan.ts` needs presence, not a diff. | — |
| `@types/node` | 22.20.1 | Types for `node:child_process`. | — |
| `python3` | 3.x, system | Read a record's JSON at the shell in §7. A convenience for humans, used by nothing in the product. | `jq`. Rejected: `jq` is not guaranteed present on a contributor's machine; `python3` is, on both macOS and the CI image. |

## 10. What this does not do

Named so the next run does not have to rediscover them.

- **The viewer does not show it.** `viewer.ts` renders spans and is
  touched by three other open pull requests (#13, #16, #18). Adding a
  fourth writer to that file would hand the owner a four-way conflict
  for a presentation change. The data is in the record; the HTML is the
  next slice, once those land.
- **`LabSignals` does not consume it.** The obvious next move is for
  `signals.ts` to treat a `decayed` span as evidence against tacit
  acceptance — `resolution: 'accepted_tacitly'` is exactly the claim a
  decayed span contradicts. Left out because `signals.ts` is rewritten
  by PR #13, and this would collide.
- **The walk is per record, not per repository.** Two episodes touching
  the same file each walk it separately. Correct but not minimal; a
  shared revision cache is worth doing when a real project has hundreds
  of episodes.
- **`intactSeconds` is coarse on fast histories.** Commits made in the
  same second give `0`, which is truthful and not very informative. The
  revision count is the better ordinal on machine-paced repositories.
