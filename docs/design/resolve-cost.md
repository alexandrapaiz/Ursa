# Where the resolve time went

**Status.** Measured and repaired, 2026-11-09. This document answers the
first step of the ledger entry "A generation has no size ceiling, and one
232 KB file stalled a thirty-pull-request sweep" (`docs/ideas.md`,
2026-11-08, status `urgent`) and discharges item 1 of
`docs/design/corpus-sweep.md` §9, which fixed the ordering in writing:
"measure where the resolve time goes, then widen the window."

**The one-sentence answer.** The cost was not subprocess fan-out. It was
`normalize()` being called on the same cached file blob once per span, so
one file's resolve cost `spans × rivals × |blob|` characters of folding;
on this repository's own `docs/sprints/pending.md` that was 10,759
seconds of projected work, and after caching the normalized blob instead
of only the raw one the same 4,139 spans resolve in 5.7 seconds.

**The hypothesis this refutes was this seat's own.** The ledger entry and
`docs/design/corpus-sweep.md` §2.4 both name per-span `git` fan-out out
of `src/corroborate.ts` as the suspect, on the strength of one
observation: `time` over a completed five-pull-request sweep read `real
4m26s, user 0m44s, sys 0m18s`, a quarter of the wall clock inside the
node process. Both say in writing that it is consistent with that reading
and does not prove it. It is not what was happening.

---

## 1. The measurement

### 1.1 The subprocess count, which is the number that killed the hypothesis

`src/bin/ursa.ts pr` over `alexandrapaiz/Ursa#707`, the entry the
thirty-pull-request sweep never got past, with `git` and `gh` replaced by
counting shims on `PATH` (§6.1 is the exact shim). Two readings taken
while the process was in its stall:

| Reading | Value |
|---|---|
| `git` and `gh` invocations over the whole attempt, cumulative | 212 |
| `git` and `gh` invocations during one 10-second window mid-stall | 0 |
| `/proc/<pid>/stat` CPU over the same 10 seconds | 238 of 1,000 ticks, 23% of one core |
| `/proc/<pid>/status` scheduler state | `R (running)` |

Zero subprocesses in ten seconds, in state `R`, is in-process work. The
212 figure also rules out per-span fan-out arithmetically: the file in
question yields 4,139 spans, so one `git` call per span would be at least
4,139 calls and not 212.

**The 23%-of-one-core reading, which looks like waiting and is not.** This
host runs every Ursa seat's sandbox on four shared cores, and at the time
of the reading three other seats were running their own test suites
(`node scripts/ci-checks.mjs --only=tooling-suites`, `node --test
scripts/ci-checks.test.mjs ...`, `node tools/ledger/pairwise.test.mjs`,
all read off `/proc/<pid>/cmdline`). A CPU-bound single-threaded process
on a contended host reads as a fraction of a core. The same shape is why
`docs/design/corpus-sweep.md` §2.4's "31% of one core" was read as
evidence of waiting. It is evidence of contention.

### 1.2 The V8 sampling profiler could not answer, and that is a finding

The first instrument tried was V8's own sampler driven in-process through
`node:inspector/promises`, with `setTimeout` to stop the profile and print
self-time by function. It never printed. The process sat in state `R` for
7 minutes 47 seconds with a 100-second timer armed and never fired it.

`resolve()` in `src/resolve.ts` is wholly synchronous, so the event loop
does not turn between the first span and the last. Nothing scheduled on
the loop can observe a resolve in progress: not a timer, not a `SIGTERM`
handler, not a progress line. This is why the ledger entry's second half
is right for a reason it does not give — "nothing in any launch reports
how long one is taking" is not an omission in the reporting, it is
unreachable from the loop while the resolve holds the thread.

### 1.3 The decisive measurement, by instrumenting the function itself

`normalize()` was temporarily wrapped with a call/character/millisecond
counter (§6.2), and `gitDescentCorroborator` driven directly over the
real file at #707's two commits. Before the repair:

```
final blob 207964 chars, 4139 prose segments
listCommits 5141 commits 989ms
4 spans in 10398ms -> 2599.5ms/span
normalize: calls=48 chars=9,902,350 ms=7561 (73% of the loop)
verdicts: rival/prior_revision=3 unverified/rival_search_capped=1
projected for all 4139 segments: 10759s
```

48 normalize calls for 4 spans decomposes exactly, which is what makes it
a diagnosis rather than a correlation:

| Span | Verdict | Blobs folded | Needles folded |
|---|---|---|---|
| 1 | `rival/prior_revision` | 1 (the generation's parent) | 1 |
| 2 | `rival/prior_revision` | 1 (the same parent, again) | 1 |
| 3 | `rival/prior_revision` | 1 (the same parent, again) | 1 |
| 4 | `unverified/rival_search_capped` | 40 (`MAX_RIVAL_BLOBS`) | 1 |
| | | **43** | **4** |

Three spans folded the *same* 207,964-character parent blob three times.
`blobLookup`'s result was already cached per `(sha, path)` in
`src/corroborate.ts`; the normalization of that result was not, so every
span re-derived it. 9,902,350 characters of folding to answer four
questions about a 207,964-character file.

### 1.4 Throughput, so the projection is arithmetic and not a guess

`normalize()` over the same blob, warm:

| Input characters | Wall clock | Throughput |
|---|---|---|
| 10,000 | 44.0 ms | 0.23 Mchar/s (cold, pre-JIT) |
| 50,000 | 186.2 ms | 0.27 Mchar/s |
| 100,000 | 178.9 ms | 0.56 Mchar/s |
| 207,964 | 173.6 ms | 1.20 Mchar/s |

So one fold of this blob is about 174 ms, and the per-span cost of a
`prior_revision` verdict was one fold: 174 ms × 4,139 spans ≈ 12 minutes
for the cheapest verdict on one file. A span that walks to the
`MAX_RIVAL_BLOBS` cap costs 41 folds, about 7 seconds, and 42 of the
4,139 spans in this file do that.

### 1.5 After the repair

Same harness, same file, same commits, with the normalized blob cached:

| Spans driven | Wall clock | Per span | normalize calls | normalize characters |
|---|---|---|---|---|
| 4 | 2,906 ms | 726.6 ms | 45 | 9,286,798 |
| 200 | 6,272 ms | 31.4 ms | 241 | 9,296,665 |
| 4,139 (all) | **5,692 ms** | **1.4 ms** | 4,180 | 9,483,971 |

The call count is now `41 blobs + one needle per span` and stops growing
with span count: 4,180 = 41 + 4,139. The character count barely moves
between 4 spans and 4,139 because the 9.3 million characters are the 41
distinct blobs, folded once each.

**4,139 spans in 5,692 ms where the projection was 10,759 s: a factor of
1,890 on that path.**

### 1.6 End to end, which is the claim that matters

`ursa pr` over #707, the whole launch, nothing stubbed:

```
alexandrapaiz/Ursa#707: 2 work units, 2 records.
21,641 chars survived verbatim, 0 survived edited.
19,209 chars the person dropped, 0 destroyed by a merge inside the pull request, 0 with no readable cause.

Records: <project>/.ursa/records/
Resolved by: resolver d88e80c2
Checked against: 18 bounds, set `10a82f2bc5f1ae6f`
	User time (seconds): 5.86
	System time (seconds): 2.63
	Percent of CPU this job got: 22%
	Elapsed (wall clock) time (h:mm:ss or m:ss): 0:37.77
	Exit status: 0
```

Before: over 35 minutes, 0 records, no answer. After: 37.77 seconds, 2
records, exit 0.

**And now the subprocess reading is true.** 5.86 s user + 2.63 s sys out
of 37.77 s wall is 22% of CPU, and the remaining 29 seconds are `gh api`
per commit in `capturePullRequest` and `git` per read in
`gitRepoReader`. The sentence `docs/design/corpus-sweep.md` §2.4 wrote
about the stalled run is a correct description of the repaired one. That
is the trap this measurement walked into and is worth naming: the
five-pull-request run it drew that sentence from never met a file large
enough to enter the quadratic, so its profile was the healthy profile all
along, and the inference carried it onto a run with a different shape.

### 1.7 Two figures in the earlier document that do not hold

1. **`docs/sprints/pending.md` is not 231,992 characters at #707.** It is
   207,658 at the generation commit `76360e73` and 207,964 at the final
   commit `e846365`. 231,992 is neither; the file reached 264,111 by
   today. The resolver read 207,964, so that is the number the cost
   scales on. §2.4's "ratio of the two largest files is 6.3" is
   therefore 5.6, which does not change its conclusion that cost scales
   with file size rather than pull request count.
2. **There already is a ceiling on generation size.** `MAX_BLOB_CHARS =
   300_000` in `src/resolve-episode.ts:39`, enforced at line 129. The
   ledger entry's "the resolver has no ceiling on the size of a
   generation it will attempt" is wrong as written. What is right in it is
   the second half: the ceiling `continue`s silently, so a skipped path
   produces no claim a reader can see, which is the opposite discipline
   from `--min-chars` reporting `largestBelowFloor`. That half is
   unrepaired here and carried forward as its own ledger entry.

---

## 2. What changed, node by node

### 2.1 The system, with real nodes and labelled edges

Every node is a file that exists in `ursa-major/`. Every edge is labelled
with the type or the literal string that crosses it.

```
                      ┌───────────────────────────────────────┐
                      │ src/bin/ursa.ts                       │
                      │ argv parse, `pr` and `corpus` cases   │
                      └───────────────┬───────────────────────┘
                                      │ CorpusCommandOptions
                                      │ { projectPath, prs: number[], repo }
                                      ▼
                      ┌───────────────────────────────────────┐
                      │ src/corpus-command.ts                 │
                      │ runCorpusCommand                      │
                      └───────────────┬───────────────────────┘
                                      │ PullRequestEpisode (one per work unit)
                                      ▼
                      ┌───────────────────────────────────────┐
                      │ src/resolve-episode.ts                │
                      │ resolveEpisode                        │
                      └──────┬──────────────────┬─────────────┘
                             │                  │
          CommitInfo[]       │                  │ ResolveInput
          (listCommits)      │                  │ { files, generations,
                             ▼                  │   corroborate, attributeDeletion }
            ┌────────────────────────────┐      ▼
            │ src/pairfinder.ts          │   ┌──────────────────────────────┐
            │ listCommits,               │   │ src/resolve.ts               │
            │ commitsTouchingPath,       │   │ resolve  (SYNCHRONOUS; see   │
            │ blobLookup                 │   │ §1.2 — nothing on the event  │
            └────────────┬───────────────┘   │ loop can observe it running) │
                         │                   └───────┬──────────────┬───────┘
      BlobLookup         │                           │              │
      { kind: 'present'  │        (filePath, spanText)│              │(filePath, spanText)
        text: string }   │                           ▼              ▼
                         │            ┌──────────────────────┐  ┌────────────────────────┐
                         └───────────▶│ src/corroborate.ts   │  │ src/deletion.ts        │
                                      │ gitDescentCorrob-    │  │ gitDeletionAttributor  │
                                      │ orator               │  │                        │
                                      │                      │  │ blobCache:             │
                                      │ blobCache: Map<       │  │ Map<`${sha}:${path}`,  │
                                      │  `${sha}:${path}`,    │  │  { got: BlobLookup,    │
                                      │  { got: BlobLookup,   │  │    norm: string|null}> │
                                      │    norm: string|null}>│  │  ◀── THE CHANGE        │
                                      │  ◀── THE CHANGE       │  └───────────┬────────────┘
                                      └──────────┬───────────┘              │
                                                 │ DescentEvidence          │ DeletionAttribution
                                   normText(blob)│  once per (sha, path)    │
                                   normText(span)│  once per span           │
                                                 ▼                          ▼
                                      ┌───────────────────────────────────────┐
                                      │ src/normalize.ts                      │
                                      │ fold(text, map | null)   ◀── THE SPLIT│
                                      │ normalize  -> { norm, map: number[] } │
                                      │ normText   -> string                  │
                                      └───────────────────────────────────────┘
                                                 ▲
                                      normText(u.text), normText(fileBlob)
                                                 │
                                      ┌──────────┴────────────────────────────┐
                                      │ src/lifespan.ts                       │
                                      │ measureLifespans                      │
                                      └───────────────────────────────────────┘
```

Edge legend, because a diagram label that is a bare noun is a defect:

- **`CorpusCommandOptions`** — the parsed flags of one sweep: the project
  path, the pull request numbers, the `owner/name` repository.
  Declared in `src/corpus-command.ts`.
- **`PullRequestEpisode`** — one generation commit paired with the commit
  that edited it, with the merges in between. Declared in
  `src/episodes.ts`.
- **`CommitInfo[]`** — the whole commit graph, read once per sweep by
  `listCommits`: sha, parents, author date, subject.
- **`ResolveInput`** — the pure resolver's whole input, including the two
  injected callbacks `corroborate` and `attributeDeletion`.
- **`BlobLookup`** — a three-state read of one path at one commit:
  `present` with text, `absent`, or `unreadable`.
- **`DescentEvidence`** — the verdict on one span: `corroborated`,
  `rival` with a relation, or `unverified` with a reason.
- **`(filePath, spanText)`** — the literal two arguments of the
  corroborator and the deletion attributor. This is the edge the cost was
  on: it is crossed once per span, and before this change each crossing
  re-folded the blob at the other end.

### 2.2 Interfaces at every boundary that moved

The new entry point in `src/normalize.ts`:

```ts
export interface Normalized {
  norm: string
  /** map[i] = index in the original text of the char norm[i] came from */
  map: number[]
}

/** Lowercase, fold smart punctuation, collapse whitespace, keep an offset map. */
export function normalize(text: string): Normalized

/** The same normalized text, with no offset map built. */
export function normText(text: string): string
```

The one loop both are built from, private to the module:

```ts
const fold = (text: string, map: number[] | null): string
```

The cache whose type changed, in `src/corroborate.ts` and, with the same
shape, in `src/deletion.ts`:

```ts
// before
const blobCache: Map<string, BlobLookup>
const read: (sha: string, path: string) => BlobLookup

// after
const blobCache: Map<string, { got: BlobLookup; norm: string | null }>
const read: (sha: string, path: string) => { got: BlobLookup; norm: string | null }
```

`norm` is `null` exactly when `got.kind !== 'present'`, so the two fields
cannot disagree about whether there is text. Unchanged and still the
module's public surface:

```ts
export interface DescentCorroborator {
  (filePath: string, spanText: string): DescentEvidence
}

export function gitDescentCorroborator(
  projectPath: string,
  generatedSha: string,
  commits: CommitInfo[],
  horizonSha?: string,
): DescentCorroborator
```

No caller signature changed, which is why no record's shape changed.

### 2.3 Why `normText` and not just the cache

The cache alone removes the repeated folds. `normText` removes a second
cost on the folds that remain: `normalize()` builds `map`, a `number[]`
with one entry per output character, by `push`. For this blob that is a
201,665-element array, built once per fold and discarded, because
nothing in `corroborate.ts`, `deletion.ts` or `lifespan.ts`'s file walk
points back into the original text — they compare strings. Six call sites
in `src/` asked for `.norm` and threw the map away; four of them were
handed whole file blobs.

The two entry points share one loop, so they cannot drift by editing.
That is a property of today's source and not of the contract, so the
contract is tested: `src/normalize-equivalence.test.ts` pins the
pre-change implementation byte for byte as `normalizeReference` and
asserts, over 20 hand-built edge cases and every `.ts`/`.md`/`.json` file
in `src/`, `fixtures/` and `docs/`, that `normText(x) === normalize(x).norm
=== normalizeReference(x).norm` and that the offset map is
element-for-element identical. The corpus assertion is guarded with
`expect(files.length).toBeGreaterThan(50)` and
`expect(chars).toBeGreaterThan(1_000_000)`, because a corpus that
silently became empty would make the test pass by measuring nothing —
the failure mode this repository's own gate census found eight instances
of on 2026-11-09.

The reference implementation is pinned rather than deleted because every
record this repository has shipped carries span offsets computed by it. A
one-character drift in `norm` is a silent change to what
`survived_verbatim` means.

### 2.4 The one behavioural risk, named

`fold` replaces `/\s/.test(ch)` with an ASCII fast path and `norm += c`
with an array `join`. The fast path answers only for a single-character
string whose code unit is below 128, where JavaScript's `\s` is exactly
`U+0009`–`U+000D` and `U+0020`; every non-ASCII character and every
multi-character string `FOLD` can produce (`…` becomes `...`) falls
through to the regex. So no judgement about Unicode whitespace is encoded
in the fast path. The equivalence test's cases include `U+2028`,
`U+2029`, `U+3000`, `U+FEFF`, `U+1680`, `U+2000`, CRLF, astral-plane
characters, lone surrogate halves, combining marks and the Turkish dotted
capital `İ`, which expands under `toLowerCase` to two code points.

---

## 3. On-disk layout

Nothing about the record format changed. What changed is that this record
can be produced at all.

```
<project>/.ursa/
├── episodes.json
└── records/
    ├── <slug>-pr703-0d1078f.json
    ├── <slug>-pr707-76360e7.json
    └── <slug>-pr707-e846365.json
```

`<slug>` is the project directory's name, lowercased. On the host this was
measured on the project is a clone of this repository under a per-run
scratch directory, so the slug is written here as `<slug>` rather than
inlined: it carries the run's own sandbox name, which the redaction rider
in `prompts/engineer-agent.md` keeps out of public artifacts.

`.ursa/` is gitignored at the repository root ("per-project outcome
records and tuning (raw data, never committed)"), so none of this ships.

Real figures from `records/<slug>-pr707-e846365.json`, the record the
stalled sweep never wrote — 5,367,215 bytes:

| Field | Value |
|---|---|
| `files[0].path` | `docs/agents/pm-2026-11-02-message-18-run.md`, 198 spans |
| `files[1].path` | `docs/sprints/pending.md`, 4,136 spans |
| `stats.finalChars` | 219,147 |
| `stats.coveredChars` | 208,444 |
| `stats.byClass.survived_verbatim` | 581 spans, 3,754 chars, 1.8% |
| `stats.byClass.survived_mutated` | 0 spans |
| `stats.byClass.no_generation_provenance` | 3,753 spans, 204,690 chars, 98.2% |
| descent `rival/prior_revision` | 3,753 spans |
| descent `unverified/span_too_short` | 576 spans |
| descent `unverified/rival_search_capped` | 5 spans |

One real span, verbatim from that file, trimmed only where marked:

```json
{
  "start": 0,
  "end": 62,
  "text": "# PM run log — 2026-11-02 (message-triggered, eighteenth pass)",
  "class": "no_generation_provenance",
  "uncertain": true,
  "candidate": {
    "score": 1,
    "text": "# PM run log — 2026-11-02 (message-triggered, eighteenth pass)",
    "source": {
      "conversationId": "git-e846365",
      "model": "Claude Sonnet 5 <noreply@anthropic.com>",
      "turnIndex": 1,
      "generationIndex": 0,
      "start": 0,
      "end": 62
    }
  },
  "descent": {
    "basis": "rival",
    "sha": "76360e7",
    "subject": "pm: 2026-11-02 (message pass, eighteenth): the two divergent …",
    "relation": "prior_revision",
    "date": "2026-11-02T06:21:45Z"
  }
}
```

That span is the repair working on real data rather than on a benchmark.
The text is in the finished file and in the generation, and the parent
commit already held it, so the record says `no_generation_provenance`
with the rival named instead of claiming the model produced the heading.
Reaching that verdict is one fold of the parent blob — which, before this
change, was one fold of the parent blob *per span*, 3,753 times.

---

## 4. Exact commands

### 4.1 Reproduce the repaired behaviour

```bash
cd ursa-major
npm ci
./node_modules/.bin/tsc --noEmit
./node_modules/.bin/vitest run src/normalize-equivalence.test.ts
./node_modules/.bin/tsx src/bin/ursa.ts pr /path/to/clone --pr 707 --repo alexandrapaiz/Ursa
```

### 4.2 Reproduce the thirty-pull-request window

The window of `docs/design/corpus-sweep.md` §2.1 is recovered by merge
instant rather than by `--limit 30`, because thirty more pull requests
have merged since and `--limit 30` now names a different window:

```bash
gh pr list --state merged --limit 200 --json number,mergedAt \
  --jq '[.[] | select(.mergedAt >= "2026-11-02T06:47:41Z" and .mergedAt <= "2026-11-08T23:47:12Z")]
        | sort_by(.mergedAt) | [.[].number] | join(",")'
# 707,703,702,706,712,710,713,717,704,715,709,719,705,720,723,718,721,722,726,731,727,716,732,729,728,737,736,738,739,743

cd ursa-major
./node_modules/.bin/tsx src/bin/ursa.ts corpus /path/to/clone \
  --prs 707,703,702,706,712,710,713,717,704,715,709,719,705,720,723,718,721,722,726,731,727,716,732,729,728,737,736,738,739,743 \
  --repo alexandrapaiz/Ursa
```

### 4.3 Run this workspace's source on a host that cannot afford its dev dependencies

`ursa-major`'s `node_modules` is 653 MB and this repository's own ledger
carries an `urgent` entry from 2026-11-02 that the shared volume cannot
always hold it. Node 22.6 and later can load the TypeScript directly;
what it refuses is this workspace's extensionless relative imports. Two
files fix that, and then `normalize.ts`, `corroborate.ts` and
`pairfinder.ts` load with nothing installed:

```bash
cat > /tmp/<your-scratch>/ts-resolve-hook.mjs <<'EOF'
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
export async function resolve(specifier, context, next) {
  if (specifier.startsWith('.') && !/\.(ts|tsx|mjs|cjs|js|json)$/.test(specifier)) {
    const base = new URL(specifier, context.parentURL)
    for (const ext of ['.ts', '/index.ts']) {
      const cand = new URL(base.href + ext)
      if (existsSync(fileURLToPath(cand))) return next(cand.href, context)
    }
  }
  return next(specifier, context)
}
EOF
cat > /tmp/<your-scratch>/register.mjs <<'EOF'
import { register } from 'node:module'
register('./ts-resolve-hook.mjs', import.meta.url)
EOF

cd ursa-major
node --experimental-strip-types --import /tmp/<your-scratch>/register.mjs \
  -e 'import("./src/corroborate.ts").then(m => console.log(Object.keys(m).join(",")))'
# MAX_RIVAL_BLOBS,authoredAfterHorizon,gitDescentCorroborator,relatives
```

It does not reach `src/bin/ursa.ts`, which needs the runtime dependency
`diff`. `/tmp/<your-scratch>` is written as a placeholder on purpose:
`/tmp` is shared between every seat running on this host
(`docs/agents/runner-facts.md` §18), so a charter-named scratch path is
another seat's path too.

---

## 5. Exact commands the measurement itself ran

### 5.1 The subprocess shim

```bash
mkdir -p /tmp/<your-scratch>/shim
cat > /tmp/<your-scratch>/shim/git <<'EOF'
#!/bin/sh
printf '%s\n' "$1" >> "$URSA_SHIM_LOG"
exec /usr/bin/git "$@"
EOF
cat > /tmp/<your-scratch>/shim/gh <<'EOF'
#!/bin/sh
printf 'gh %s\n' "$1" >> "$URSA_SHIM_LOG"
exec /usr/bin/gh "$@"
EOF
chmod +x /tmp/<your-scratch>/shim/git /tmp/<your-scratch>/shim/gh

export URSA_SHIM_LOG=/tmp/<your-scratch>/git-calls.log
: > "$URSA_SHIM_LOG"
PATH=/tmp/<your-scratch>/shim:$PATH \
  ./node_modules/.bin/tsx src/bin/ursa.ts pr /path/to/clone --pr 707 --repo alexandrapaiz/Ursa
wc -l < "$URSA_SHIM_LOG"
```

The in-stall readings, with the process id from `ps -o pid,pcpu,etime -C node`:

```bash
a=$(wc -l < "$URSA_SHIM_LOG"); c1=$(awk '{print $14+$15}' /proc/$PID/stat)
sleep 10
b=$(wc -l < "$URSA_SHIM_LOG"); c2=$(awk '{print $14+$15}' /proc/$PID/stat)
echo "git calls in 10s: $((b-a))"; echo "cpu ticks in 10s: $((c2-c1)) of 1000"
grep -E '^(State|Threads|VmRSS)' /proc/$PID/status
```

### 5.2 The normalize counter

Applied to `src/normalize.ts` for the duration of the measurement and
reverted with `git checkout src/normalize.ts` before any commit. It wraps
the single `fold` loop, so it counts both entry points:

```ts
const G = globalThis as any
G.__norm = G.__norm ?? { calls: 0, chars: 0, ms: 0 }
const fold = (text: string, map: number[] | null): string => {
  const t0 = performance.now()
  try { return __fold(text, map) } finally {
    G.__norm.calls++; G.__norm.chars += text.length; G.__norm.ms += performance.now() - t0
  }
}
const __fold = (text: string, map: number[] | null): string => { /* the real loop */ }
```

The harness that drives the corroborator directly, `N` spans at a time,
is `ursa-major/tools/measure-resolve-cost.ts`. It is committed rather
than left in a scratch directory, because the figures in §1.3 and §1.5
are the before-and-after of a performance claim and a performance claim
whose harness is gone cannot be re-run by a reviewer:

```bash
cd ursa-major
N=4    ./node_modules/.bin/tsx tools/measure-resolve-cost.ts
N=4139 ./node_modules/.bin/tsx tools/measure-resolve-cost.ts
```

---

## 6. Tooling

| Tool | Version | Its job here | Why it, over what else |
|---|---|---|---|
| `node` | v22.23.2 | runs everything; `--experimental-strip-types` loads this workspace's TypeScript with nothing installed (§4.3) | The alternative to type stripping was installing `tsx`, and `npm install` here resolves the whole lockfile: 653 MB on a volume that was at 100% with 46 MB free. Node 22.6+ makes the dependency optional for the pure modules. |
| `git` | 2.43.0 | `show` for blobs, `log` for path history and the commit graph | Not a choice. The resolver's evidence is the commit graph, and `src/pairfinder.ts` shells out rather than using a JS git implementation so that the clone's own configuration, including the register merge drivers, is the one being read. |
| `tsx` | 4.23.15 | runs `src/bin/ursa.ts` and the measurement harness, which need the runtime dependency `diff` | Type stripping (above) cannot resolve the workspace's extensionless imports to bare packages. `tsx` is already this workspace's declared runner for all seventeen `package.json` scripts, so the measurement runs the same way the product does. |
| `vitest` | 5.0.5 | `src/normalize-equivalence.test.ts` and the 1,447-case suite that guards the change | Already this workspace's test runner. Chosen over `node --test` for this file specifically because the equivalence corpus needs `expect(...).toEqual` over a 200,000-element `number[]`, and `assert.deepStrictEqual` on that array reports "not equal" without an index. |
| `typescript` | 5.9.3 | `tsc --noEmit`, which is what caught every `BlobLookup` → `{ got, norm }` call site | The cache's type change is the whole repair's blast radius, and the compiler enumerates it. Grep would not have: `read(` appears in both changed files and in two unrelated ones. |
| `/usr/bin/time -v` | GNU time, Ubuntu `time` 1.9 | the end-to-end figures in §1.6: user, system, wall, percent of CPU, maximum resident set | The shell builtin `time` reports wall/user/sys and not percent of CPU or peak RSS, and percent of CPU is the figure that distinguishes "waiting on subprocesses" from "CPU-bound on a contended host", which is the whole question of §1.1. |
| V8 sampling profiler, via `node:inspector/promises` | bundled with node v22.23.2 | attempted and could not answer; see §1.2 | Rejected on evidence rather than on taste: `Profiler.stop` is dispatched on the main thread and `resolve()` never yields it. A sampler that cannot observe a synchronous resolve is the wrong instrument for one, and direct function instrumentation (§5.2) answered in one run. |
| `/proc/<pid>/stat`, `/proc/<pid>/status` | Linux 6.17.0-1020-oracle | CPU ticks and scheduler state during the stall (§1.1) | `perf` is not installed on this host and `ps`'s `%CPU` is averaged over process lifetime, which reads a stall that began recently as fast. `/proc` gives the two instants a difference can be taken between. |

---

## 7. What this deliberately does not do

1. **It adds no flag.** The ledger entry's own first step says naming the
   bound before measuring the cause is how a product acquires a flag that
   does not help. The cause was not size; it was repeated work per span.
   A `--max-generation-chars` would have made #707 refuse a file the
   resolver can now classify in 5.7 seconds.
2. **It does not touch `MAX_BLOB_CHARS`.** The ceiling exists at 300,000
   characters (§1.7). Whether 300,000 is now the right number is a
   different question from whether the skip should be silent, and the
   silent skip is the defect; it is carried as its own ledger entry
   rather than repaired in the same change as a performance fix.
3. **It does not make a resolve observable while it runs.** §1.2 is a
   finding, not a repair: `resolve()` holds the thread, so progress
   reporting needs the resolve to yield, which is a change to the pure
   function's shape and not a line of logging. Carried as its own ledger
   entry.
4. **It does not re-measure the §2.3 corpus figures.** The five-pull-request
   window's numbers are unaffected: no record's shape changed, and the
   equivalence test is what says so. The thirty-pull-request window is
   now reachable, which is a separate measurement and belongs to whoever
   takes the widening.

---

## 8. Terms used above, defined in place

- **Fold** — one application of `normalize`/`normText` to a string:
  lowercase, smart punctuation folded to ASCII, whitespace runs collapsed
  to one space, leading and trailing whitespace dropped. Named here
  because "normalize the blob" and "normalize the span" are the same
  operation at two sizes and the cost difference between them is this
  whole document.
- **Needle** — the normalized text of one final-file span, the string
  being searched for. `src/corroborate.ts` uses the word in code.
- **Blob** — the full text of one path at one commit, as `git show
  <sha>:<path>` prints it. On the `ursa pr` path a generation *is* a
  blob, which is why generation size and file size are the same number
  here.
- **Rival** — a commit outside the generation's line of descent whose
  blob holds the span's text, which is evidence that the text has a
  source other than the person editing this generation.
  `MAX_RIVAL_BLOBS` is 40: the number of rival blobs the search reads
  before it reports `rival_search_capped` rather than claiming there is
  no rival.
- **Span** — one segment of the finished file, with a class
  (`survived_verbatim`, `survived_mutated`, `generated_deleted`,
  `no_generation_provenance`) and, where asked, a `descent` verdict.
- **Work unit** — one generation commit paired with the commit that
  edited it. #707 has two.
- **Window** — the sentence naming which pull requests were swept and
  over what range of merge instants. §4.2 is this document's.
