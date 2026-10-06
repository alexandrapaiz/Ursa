# The generated denominator, and the gate that checks it

Engineer run, 2026-10-05. Branch `engineer/2026-10-05-generated-denominator`.
Written to the engineering-artifact standard in `prompts/engineer-agent.md`
(system diagram with real nodes, interfaces as real TypeScript signatures,
on-disk layouts with a real payload, exact commands, tooling with versions
and reasons, no bare terms).

Ledger entry this closes the first step of: **"The generated denominator is
wrong in two directions, and nothing checks it"** (`docs/ideas.md`,
2026-10-04, status `proposed`). That entry's own first step was *"the
invariant, as a gate, before either fix"*, exercised *"over the public
fixture plus a clone of this repository, so the assertion is exercised
against real history and not only synthetic"*. This artifact describes what
shipped, which includes a correction to the entry's own diagnosis.

---

## 1. The defect, stated as arithmetic

On 2026-10-04, `ursa run` against a clone of this repository's public
`main` printed these two sentences next to each other:

```
239,976 chars survived your editing verbatim, 236 survived edited.
239,841 chars were generated to get there; 1% were drafts you discarded on the way.
```

`survived_verbatim` is defined in `CLAUDE.md` as "generated and kept
unchanged". A character that was kept unchanged was generated, so the first
number is a subset of the second and cannot exceed it. It exceeded it by
135 characters, in all six records of that run, and `npm test` was green at
344 passing tests.

Yesterday's pairing-window fix (`docs/design/pairing-window.md`) took the
pair from 239,976/239,841 to 60,616/60,366. The impossibility survived the
fix at 250 characters, which is what told the previous run there was a
second cause. Today's clone, two commits further along, reproduces it at
63,340 against 63,038.

**The finding: neither number was wrong.** The comparison was. The
numerator counted characters of the finished file. The denominator counted
characters inside generation *segments*. Those are two different sets of
characters, and a bound between two different sets is not a bound. Both
sides were individually correct in every one of the six records.

### 1.1 Where the characters go missing

`segment()` (`ursa-major/src/segment.ts`) splits a generation into
sentences or statements. The characters *between* those segments — the
blank line after a heading, the indentation before a list item, the newline
ending a paragraph — belong to no segment. `GenerationRecord.totalChars`
sums segment extents, so those characters are not in it.

But `resolve()`'s verbatim pass does not match against segments. It
matches the normalized finished span against the normalization of the
**whole generation text** (`src/resolve.ts`, `p.norm.norm.indexOf(sNorm)`)
and maps the hit back to raw offsets. A single claim can therefore span a
segment boundary and cover characters `totalChars` never counted. The
numerator can reach characters the denominator does not contain.

Measured on this repository's own history, 2026-10-05:

| Record | Characters the generation wrote | Characters inside segments | Characters between segments | Share between segments |
|---|---|---|---|---|
| `probe-2026-09-26-4d5e401` (generation: `docs/sprints/dispatch-queue.md`) | 2,795 | 2,672 | 123 | 4.40% |
| `probe-2026-09-27-7c739cf` (generation: `docs/standards/lessons.md`) | 63,362 | 60,366 | 2,996 | 4.73% |

"Characters between segments" is the quantity now recorded as
`GenerationRecord.separatorChars`. It is not a rounding concern: it is
4.73% of the denominator under `survivalRate`, `deletedPct` and
`humanDeletedPct` in the larger record, and those are the figures
`docs/vision.md` has Ursa Minor selling.

### 1.2 The second mechanism: generated text reused in two places

`Stats.byClass.survived_verbatim.chars` sums **finished-file** span
extents. When one generated sentence appears twice in the finished work,
two spans claim the same generation extent and the sum counts those
generated characters twice. Each span is individually true. The total is
not a measurement of the generation.

Measured on the same two records: 3 characters reused in the first, 357 in
the second. Combined with §1.1, the two mechanisms account for the whole of
the 250-character excess the previous run could not explain:

```
60,616 final chars classified survived_verbatim
  − 357 counted twice because the generated text was reused
= 60,259 distinct generated characters that reached the finished work
         ≤ 63,362 characters the generation wrote      ✓ consistent
         > 60,366 characters inside segments           ✗ the old comparison
```

### 1.3 What the ledger entry got wrong, and what it got right

The entry named two causes. The first was:

> a measurement bug: `ursa-major/src/match.ts` accepts a fuzzy match wider
> than the generated text it matched against, so a final span is credited
> with more characters than the generation contained. The 250 characters
> are that.

**That is not what the 250 characters are**, and the check that would have
found it finds nothing. Across both records of a real run, zero finished
spans are wider than the generation extent they claim, and the aggregate
difference between finished-span extents and claimed source extents is
zero in the first record and −8 in the second (the claims are *wider*, from
whitespace normalization, not narrower). The 250 characters are §1.1 and
§1.2.

The entry's second cause — that a git-pair generation's `text` is the whole
file at the agent's commit rather than the diff that commit introduced — is
real, is untouched by this change, and is deliberately left for an ADR. See
§9.

The entry's *first step* was exactly right, and is the whole reason the
diagnosis above exists rather than a third guess.

---

## 2. System diagram

Every node is a file that exists in this repository after this change.
Every edge carries a named TypeScript type, a JSON file, or a process exit
code. Nodes added by this change are marked **new**.

```
                        ┌──────────────────────────────────────────┐
                        │ ursa-major/src/segment.ts                │
                        │ segment(text, mode): Span[]              │
                        └───────────────┬──────────────────────────┘
                                        │ Span[]  (start, end, text —
                                        │ non-contiguous: the characters
                                        │ between two Spans are in neither)
                                        ▼
┌───────────────────────┐   RawGeneration[]   ┌─────────────────────────────┐
│ ursa-major/src/bin/   │────────────────────▶│ ursa-major/src/resolve.ts   │
│   ursa.ts             │                     │ resolve(ResolveInput):      │
│ resolveEpisode()      │◀────────────────────│   OutcomeRecord             │
└───────┬───────────────┘    OutcomeRecord    └──────────┬──────────────────┘
        │                                                │ FinalFile[],
        │ OutcomeRecord[]                                │ GenerationRecord[]
        │                                                ▼
        │                                     ┌─────────────────────────────┐
        │                                     │ ursa-major/src/stats.ts     │
        │                                     │ computeStats(...): Stats    │
        │                                     │ claimedChars(files, class): │
        │                                     │   number            **new** │
        │                                     └──────────┬──────────────────┘
        │                                                │ Array<[number, number]>
        │                                                ▼
        │                                     ┌─────────────────────────────┐
        │                                     │ ursa-major/src/intervals.ts │
        │                                     │ mergedLength(intervals):    │
        │                                     │   number            **new** │
        │                                     └──────────▲──────────────────┘
        │                                                │ Array<[number, number]>
        │  OutcomeRecord                                 │
        ▼                                                │
┌───────────────────────────────┐                        │
│ ursa-major/src/invariants.ts  │────────────────────────┘
│ checkRecord(r): Violation[]   │              **new**
│ measure(r): Measurement       │
│ formatViolations(v): string   │
└───┬───────────────┬───────────┘
    │ Violation[]   │ Violation[] + Measurement
    │               ▼
    │   ┌───────────────────────────────────┐
    │   │ ursa-major/src/invariants.cli.ts  │  **new**
    │   │ runGate(target, quiet):           │
    │   │   { violations, lines }           │
    │   └───────────┬───────────────────────┘
    │               │ process exit code 0 or 1
    │               ▼
    │        the developer's shell
    │
    │ Violation[]
    ▼
┌───────────────────────────────┐        ┌──────────────────────────────────┐
│ ursa-major/src/bin/ursa.ts    │        │ <project>/.ursa/records/*.json   │
│ main() → Promise<number>      │───────▶│ one OutcomeRecord per file,      │
│ exit 1 when Violation[] ≠ []  │ written│ written BEFORE the gate runs     │
└───────────────────────────────┘ first  └──────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────┐
│ ursa-major/fixtures/real/ursa-main-4d5e401.json              **new**     │
│ one OutcomeRecord, 42 KB, made by `ursa run` from a clone of this        │
│ repository's public main at commit 0d68df0                               │
└──────────────┬───────────────────────────────────────────────────────────┘
               │ OutcomeRecord (read with JSON.parse, no network, no git)
               ▼
┌──────────────────────────────────────────────────────────────────────────┐
│ ursa-major/src/invariants.test.ts                            **new**     │
│ 35 cases: every bound passes on records the resolver produced, and every │
│ bound fails on a record broken in the way that bound describes           │
└──────────────────────────────────────────────────────────────────────────┘
```

The one edge worth reading twice is `main() → <project>/.ursa/records/`,
labelled *written first*. The records reach disk before the gate decides
the exit code. A record whose arithmetic is impossible is the evidence of
the defect, so it is never withheld from the person whose work it
describes. What the gate changes is that the run stops claiming success.

---

## 3. On-disk layout, with a real payload

Nothing about the record file's path or name changes. Three fields are
added inside it.

```
<project>/.ursa/
├── episodes.json                        unchanged by this work
└── records/
    └── <taskId>.json                    one OutcomeRecord, UTF-8 JSON

ursa-major/fixtures/
├── mini/record/outcome_record.json      the public synthetic fixture
└── real/                                             ← new
    ├── README.md                        provenance, redaction, regeneration
    └── ursa-main-4d5e401.json           42 KB, from this repo's own history
```

### 3.1 Real payload: the three new fields

Read from `ursa-major/fixtures/real/ursa-main-4d5e401.json` with
`node -e "console.log(JSON.stringify(require('./fixtures/real/ursa-main-4d5e401.json').stats.generated, null, 2))"`.
This is the file's actual content, not an illustration:

```json
{
  "totalChars": 2672,
  "charsWritten": 2795,
  "separatorChars": 123,
  "verbatimClaimedChars": 2721,
  "survivedChars": 2669,
  "deletedChars": 3,
  "deletedPct": 0.001,
  "humanDeletedChars": 3,
  "humanDeletedPct": 0.001,
  "mergeDeletedChars": 0,
  "unknownDeletedChars": 0
}
```

`charsWritten`, `separatorChars` and `verbatimClaimedChars` are new. The
other eight fields are unchanged in both name and value: no rate moved,
because no rate's numerator or denominator was touched.

### 3.2 Real payload: the defect, visible in two spans

The same file's first two generation spans, which is the whole of §1.1 in
eight lines:

```json
[
  {
    "start": 0,
    "end": 64,
    "text": "# Dispatch queue — 2026-09-26 (standup, 14:54 UTC scheduled run)",
    "fate": "survived_verbatim"
  },
  {
    "start": 66,
    "end": 106,
    "text": "`PM_DISPATCH_ENABLED` is exactly `true`.",
    "fate": "survived_verbatim"
  }
]
```

Span one ends at offset 64. Span two begins at offset 66. Characters 64 and
65 are the blank line between the heading and the paragraph. They are in
the generation, they are in the finished file, a verbatim claim covering
both segments covers them — and until this change they were in no
denominator. Repeated 61 segments deep, that is the 123 characters.

### 3.3 Redaction

The redaction rider in `prompts/engineer-agent.md` §3 applies to
`fixtures/real/ursa-main-4d5e401.json`, and nothing in it needed
redacting. Every identifier is a commit SHA or a file path from this
*public* repository (`0d68df0`, `19f6535`, `9e017a9`), the only author
string is `claude[bot]`, and there is no home directory, no macOS
username and no session UUID. Verified with:

```bash
grep -oE '"(/(Users|home)/[^"]*|[a-f0-9]{32,})"' fixtures/real/ursa-main-4d5e401.json | sort -u
```

which returns three commit SHAs of this repository and nothing else. The
run's second record (1.2 MB, the `docs/standards/lessons.md` generation) is
**not** committed, for size rather than for redaction; §8 records its
numbers and the command that reproduces it.

---

## 4. Interfaces

Every signature below is what a caller writes against, copied from the
shipped source.

### 4.1 `ursa-major/src/intervals.ts` (new)

```ts
/**
 * Total length of the union of half-open intervals `[start, end)`.
 * Overlapping and touching intervals collapse, so a character covered by
 * three extents counts once. Input is not mutated.
 */
export function mergedLength(intervals: Array<[number, number]>): number
```

### 4.2 `ursa-major/src/invariants.ts` (new)

```ts
export type InvariantCode =
  | 'CLAIM_NOT_WIDER'
  | 'CLAIM_IN_GENERATION'
  | 'GEN_SPANS_PARTITION_ORDER'
  | 'GEN_CHARS_CONSISTENT'
  | 'GEN_SURVIVED_BOUNDED'
  | 'GEN_CLAIM_BOUNDED'
  | 'DELETION_SPLIT_EXACT'
  | 'FINAL_SPANS_IN_FILE'
  | 'COVERED_BOUNDED'
  | 'RATES_MATCH_FIELDS'

export interface Violation {
  code: InvariantCode
  /** the bound, stated so the message is readable without this file open */
  invariant: string
  /** which record, file, generation or span it fired on */
  where: string
  /** the numbers as observed, always including both sides of the bound */
  observed: string
}

export interface Measurement {
  recordId: string
  verbatimFinalChars: number
  verbatimClaimedChars: number
  reusedChars: number
  generatedCharsWritten: number
  generatedSegmentChars: number
  generatedSeparatorChars: number
  finalSeparatorChars: number
  mutatedFinalChars: number
  mutatedAddedChars: number
}

export function checkRecord(record: OutcomeRecord): Violation[]
export function measure(record: OutcomeRecord): Measurement
export function formatViolations(violations: Violation[]): string
```

### 4.3 `ursa-major/src/invariants.cli.ts` (new)

```ts
/** every *.json directly under a directory, or the single file named */
export function recordPaths(target: string): string[]

/** `violations` is the process exit decision; `lines` is what is printed */
export function runGate(
  target: string,
  quiet?: boolean,
): { violations: number; lines: string[] }
```

### 4.4 `ursa-major/src/stats.ts` (one function added)

```ts
/**
 * Generation characters claimed by final spans of one class, counted once
 * each, merged per generation before summing.
 */
export function claimedChars(files: FinalFile[], cls: SpanClass): number
```

### 4.5 `ursa-major/src/types.ts` (three fields added, none removed)

```ts
export interface GenerationRecord extends RawGeneration {
  generationIndex: number
  spans: GenerationSpan[]
  /** characters inside segments — the denominator of every fate-based rate */
  totalChars: number
  /** `text.length` — every character the generation wrote, separators included */
  charsWritten: number
  /** `charsWritten - totalChars` — characters between segments, carrying no fate */
  separatorChars: number
  survivedChars: number
  survivalRate: number
}

// inside `Stats`:
generated: {
  totalChars: number           // unchanged meaning: segment characters only
  charsWritten: number         // new: sum of every generation's charsWritten
  separatorChars: number       // new: sum of every generation's separatorChars
  verbatimClaimedChars: number // new: distinct generated chars that survived verbatim
  survivedChars: number
  deletedChars: number
  deletedPct: number
  humanDeletedChars: number
  humanDeletedPct: number
  mergeDeletedChars: number
  unknownDeletedChars: number
}
```

---

## 5. The ten bounds

Each row is checked by `checkRecord` and has at least one test that breaks
a record in exactly that way and asserts the code fires. "Universe" names
the set of characters both sides of the bound are measured over, because
getting that wrong is the defect this whole artifact is about.

| Code | Universe | The bound | Why it is a bound and not a preference |
|---|---|---|---|
| `CLAIM_NOT_WIDER` | one finished span against the generation extent it names | a `survived_verbatim` span is no wider than the extent it claims | verbatim means byte-identical, so the two extents are the same characters. A `survived_mutated` span is exempt: see §6. |
| `CLAIM_IN_GENERATION` | one source pointer against one generation's text | the generation index exists and `0 ≤ start < end ≤ text.length` | a pointer outside the text it names cannot be followed, so the provenance link the record sells is broken |
| `GEN_SPANS_PARTITION_ORDER` | one generation's spans against its own text | spans are ordered, non-overlapping, inside the text, and `span.text === text.slice(start, end)` | an overlap means one character carries two fates; a mismatched `text` means the stored excerpt and the offsets disagree about what was generated |
| `GEN_CHARS_CONSISTENT` | one generation's three counts against its spans and text | `totalChars` = sum of span extents, `charsWritten` = `text.length`, `separatorChars` = the difference | this is the field that was silently wrong; stating it makes the next drift a test failure |
| `GEN_SURVIVED_BOUNDED` | one generation | `survivedChars ≤ totalChars ≤ charsWritten` | text cannot survive that was never inside a segment, and a segment cannot hold characters the generation did not write |
| `GEN_CLAIM_BOUNDED` | one generation, claims merged | distinct characters of a generation claimed by finished spans ≤ `charsWritten` | the repaired form of the ledger's "verbatim ≤ generated": merging the claims first puts both sides in the generation's universe |
| `DELETION_SPLIT_EXACT` | one record's generation totals | `human + merge + unknown = deletedChars = totalChars − survivedChars`, each ≥ 0 | the three-way split is a user-facing promise that merge damage is not counted against the person; a negative share means a mis-attribution |
| `FINAL_SPANS_IN_FILE` | one finished file's spans against its text | ordered, non-overlapping, inside the text, `span.text === text.slice(start, end)` | the finished-side twin of `GEN_SPANS_PARTITION_ORDER` |
| `COVERED_BOUNDED` | one record's finished files | `coveredChars` = sum of span extents ≤ `finalChars` | classified text is part of the finished work, so it cannot be more of it than there is |
| `RATES_MATCH_FIELDS` | each stored rate against its own two fields | every stored rate equals its numerator over its denominator, to three places | a stored rate that does not match its own inputs is the cheapest possible lie, and five of them ship in every record |

Three quantities are **measurements, not bounds**, because each can be
legitimately non-zero and a gate that fails on correct input gets silenced:
`reusedChars` (§1.2), `mutatedAddedChars` (§6), and `separatorChars` (§1.1).
`measure()` returns them and the CLI prints them.

---

## 6. The finding the gate produced on its own first run

The first version of `CLAIM_NOT_WIDER` applied to every span carrying a
source pointer. It failed immediately, on the first synthetic record
written to exercise it, with:

```
CLAIM_NOT_WIDER  invariants-unit file notes.md span 1 [72,154)
    observed: 82 final chars credited to a 75-char generation extent, 7 too many
```

The generation said *"No single observer holds it whole, and a central
grader pretends otherwise."* (75 characters). The finished file said *"No
single observer holds the whole of it, and a central grader pretends
otherwise."* (82 characters). The person edited the sentence and added
seven characters doing it.

The span is correct. The invariant was wrong, and it was wrong in the same
way as the defect it was written to catch: it assumed two character counts
belonged to one universe. For a `survived_mutated` span they do not — the
whole point of the class, in `CLAUDE.md`'s words, is that "the mutation *is*
the correction", and a correction may be longer than what it corrects.

What the seven characters *do* break is the reading of
`Stats.byClass.survived_mutated.chars` as a measure of what the model
contributed. It is a count of finished characters inside spans the person
edited, and some of those characters are the person's own. Ursa Minor would
be selling them as the model's. That is a third direction the accounting is
wrong, it was not in the ledger entry, and it is filed today rather than
fixed, because fixing it changes a figure's meaning. `measure()` now
reports it as `mutatedAddedChars` so the size of the problem is visible
before anyone decides what to do about it. On this repository's real
history it is currently 0 of 236 mutated characters; on the synthetic
record it is 7 of 82.

---

## 7. Exact commands

Every command below was run on 2026-10-05 from
`/home/runner/work/Ursa/Ursa/ursa-major`, which is this repository's
checkout in GitHub Actions. On a developer's own machine the path is
wherever the repository is cloned; nothing here depends on it.

```bash
# Install exactly the locked dependency versions.
npm ci

# Typecheck and run the whole suite. This is the gate's primary home:
# src/invariants.test.ts runs it over the public fixture and over the real
# -history fixture on every invocation.
npm test

# Just this change's tests.
npx vitest run src/invariants.test.ts

# Regenerate the public synthetic fixture record (it now carries the three
# new fields, so it is regenerated rather than hand-edited).
npm run record:fixture

# The gate, standalone, on one record file.
npx tsx src/invariants.cli.ts fixtures/real/ursa-main-4d5e401.json

# The gate, standalone, on a directory of records. Exit code is 0 when
# every bound holds and 1 when any does not.
npx tsx src/invariants.cli.ts /tmp/probe/.ursa/records
echo $?

# Violations only, no measurement block — the form for a pre-push hook.
npx tsx src/invariants.cli.ts /tmp/probe/.ursa/records --quiet

# Reproduce every number in §1 from scratch, against real history.
cd /tmp && rm -rf probe
git clone https://github.com/alexandrapaiz/Ursa.git probe
cd -
npx tsx src/bin/ursa.ts run /tmp/probe --declare unsatisfied

# Confirm the committed fixture is free of machine identity (§3.3).
grep -oE '"(/(Users|home)/[^"]*|[a-f0-9]{32,})"' fixtures/real/ursa-main-4d5e401.json | sort -u
```

---

## 8. Evidence

### 8.1 Test suite

| Measurement | Before | After |
|---|---|---|
| `npm test` passing assertions | 340 | 375 |
| `npm test` skipped assertions | 4 | 4 |
| `npm test` failing assertions | 0 | 0 |
| `tsc --noEmit` errors | 0 | 0 |
| Test files | 21 passed, 1 skipped | 22 passed, 1 skipped |

Of the 35 new assertions, 15 are table-driven cases that break a record in
the way one bound describes and assert that bound fires, plus two more that
break one through the CLI and through a narrowed `CLAIM_NOT_WIDER`. That is
the half which proves the gate is not a function returning the empty
array.

### 8.2 The run summary, before and after

Same clone (`https://github.com/alexandrapaiz/Ursa`, head `0d68df0`), same
command, same two records.

Before:

```
2 work units found, 2 resolved into records.
63,340 chars survived your editing verbatim, 236 survived edited.
That's the part worth noticing: not what got written, what got kept.
63,038 chars were generated to get there; 1% were drafts you discarded on the way.
```

After:

```
2 work units found, 2 resolved into records.
63,340 chars survived your editing verbatim, 236 survived edited.
That's the part worth noticing: not what got written, what got kept.
66,157 chars were generated to get there, and 62,980 of them reached the finished work unedited.
You discarded 368 chars of draft on the way, 1% of the 63,038 whose fate this run could trace.
```

63,340 ≤ 66,157. The pair is possible. The discard sentence now names the
63,038 characters it is a percentage of, rather than leaving the reader to
assume it is a percentage of the number on the line above — which it was,
and which was the other half of how the impossibility hid for three runs.

### 8.3 The gate on real history

```
$ npx tsx src/invariants.cli.ts /tmp/probe/.ursa/records
/tmp/probe/.ursa/records/probe-2026-09-26-4d5e401.json
  generated 2,795 chars, of which 123 sit between segments and carry no fate
  survived verbatim: 2,724 chars of the finished work, from 2,721 distinct generated chars (3 reused)
  79 chars of the finished work are in no span, so they are in no percentage
  OK — every stated bound holds
/tmp/probe/.ursa/records/probe-2026-09-27-7c739cf.json
  generated 63,362 chars, of which 2,996 sit between segments and carry no fate
  survived verbatim: 60,616 chars of the finished work, from 60,259 distinct generated chars (357 reused)
  2,706 chars of the finished work are in no span, so they are in no percentage
  survived edited: 236 chars, of which 0 were added by the person and are credited to the model anyway
  OK — every stated bound holds
2 records checked, 0 violations.
$ echo $?
0
```

The second record is the 1.2 MB one described in §3.3. Its three numbers —
63,362 written, 2,996 between segments, 357 reused — are the complete
explanation of the 250-character excess the 2026-10-04 run could not
account for.

### 8.4 Acceptance against the ledger entry's own first step

> Assert in `ursa-major/src/stats.ts` that `byClass.survived_verbatim.chars
> <= generated.totalChars` for every record, and run it over the public
> fixture plus a clone of this repository.

Shipped in `src/invariants.ts` rather than `src/stats.ts`, because
`computeStats` builds the numbers and a module that checks its own output
is a module that agrees with itself. Shipped as `GEN_CLAIM_BOUNDED` rather
than verbatim, because the literal assertion compares a finished-file count
to a generation-segment count and is therefore not checkable: §1.2 shows it
can be false with every span correct. The bound that survives the
correction is the same bound with both sides moved into the generation's
universe. Run over the public fixture, over a clone of this repository, and
over a committed record made from that clone.

> It fails today, which is the point.

It does not fail today, and that is the finding rather than a dodge. The
ten bounds hold on every record a real run produces. The impossible figure
was never inside a record; it was manufactured by `renderRunSummary`
putting two incomparable record fields in adjacent sentences. §8.2 is where
the fix landed, and §8.1's 17 breakage cases are how the gate is shown to
fail when something is actually wrong.

---

## 9. Boundaries: what this change does not do

1. **No rate changed.** `survivalRate`, `deletedPct` and `humanDeletedPct`
   keep both their numerators and their denominators. Every record written
   before today remains comparable to every record written after, except
   that the new ones carry three more fields.

2. **The whole-file modelling question is untouched and belongs in an ADR.**
   For a git pair, a generation's `text` is the entire file at the agent's
   commit, not the diff that commit introduced. On
   `probe-2026-09-27-7c739cf` that is 63,362 characters of
   `docs/standards/lessons.md` attributed to a sync commit that wrote a few
   hundred of them. This inflates `charsWritten`, `totalChars` and
   `survivedChars` together, so it does not break any bound here and is
   invisible to this gate. It changes what every historical record means,
   which is why the ledger entry asked for an ADR and why this artifact
   does not decide it in a diff.

3. **`survived_mutated.chars` still credits the person's own additions to
   the model.** §6. Measured, not fixed, filed as a ledger entry today.

4. **Separator characters are still in no fate.** The gate now states that
   they exist and how many there are. Whether a generation's spans *should*
   partition its text — so that whitespace rides along with the segment it
   follows and `totalChars` equals `charsWritten` — is the same class of
   decision as item 2: it moves every deletion figure, and the whitespace
   would land in the human discard rate by subtraction, inflating
   `humanDeletedChars` on the larger record from 365 to roughly 3,361. That
   is a nine-fold change to the one number `docs/decisions.md` and the
   run summary both call the correction signal. It needs the ADR, not a
   diff.

5. **The gate checks arithmetic, not labels.** An empty `Violation[]` means
   a record is self-consistent. It says nothing about whether
   `survived_verbatim` was the right class for a given span. The label
   question is `src/evals/verdict.ts`'s lane.

6. **No CI wiring.** The gate runs in `npm test` and inside `ursa run`.
   Adding it to a GitHub Actions workflow is blocked for the same reason
   every workflow change in this repository is: the runner's token cannot
   write `.github/workflows/`. See
   `docs/agents/pending-workflow-changes.md`; nothing new is owed there,
   because `npm test` already carries it wherever the existing test
   workflow runs.

---

## 10. Tooling

Every tool this change uses, its version as installed, its job here, and
what it was chosen over.

| Tool | Version | Its job in this change | Chosen over, and why |
|---|---|---|---|
| Node.js | 22.23.3 | the runtime everything below executes on; `node:fs` reads records, `node:os` and `node:path` build the temp directories the CLI tests write into | Deno and Bun, both rejected on the same ground: `ursa-major` is a package a user runs on their own machine against their own repository, and Node is the runtime already installed there. Switching would add an install step to a product whose cost structure is "nothing to install but the package". |
| TypeScript | 5.9.3 (`^5.7.2`) | the type system is load-bearing in this change: adding three required fields to `GenerationRecord` and `Stats.generated` made `tsc --noEmit` point at `src/hq/fixtures.ts:28`, the one hand-built `Stats` literal in the codebase, before any test ran | JSDoc-annotated JavaScript with `checkJs`, rejected because `InvariantCode` as a union of ten string literals is what keeps `Violation.code` and the `BOUNDS` table in sync, and a union type is clumsy to express and easy to widen in JSDoc. |
| Vitest | 5.0.2 | the 35 new assertions, including the 16 that break a record and require a specific code to fire | Node's built-in `node:test`, rejected only because the repository's other 21 test files are already Vitest and a second runner means two watch modes, two reporters and two ways to filter. No capability of Vitest's is needed here. |
| tsx | 4.23.15 | runs `src/invariants.cli.ts` and `src/bin/ursa.ts` directly from TypeScript source, so the gate can be pointed at a record on a user's machine with no build step | `ts-node`, rejected for startup time on a command a developer is expected to run repeatedly; a compiled `dist/`, rejected because `ursa-major` has no build step today and adding one to ship a checker would be the checker's largest cost. |
| `diff` | 8.0.4 | not used by the new code, listed because `resolve.ts` calls `diffWords` to build the `survived_mutated` diff whose character count §6 is about | — |
| git | 2.55.0 | clones the public repository that produces the real-history record, and is read by `src/pairfinder.ts` to find the commit pairs | no alternative: the pair is a git object graph, and `isomorphic-git` would add a dependency to read what the `git` binary on the machine already reads. |

No tool, service, account or dependency was added by this change. The
`package.json` dependency list is byte-identical before and after. Steady
-state cost stays $0.

---

## 11. Glossary

Defined here because the artifact standard forbids a bare term, and
several of these are one letter away from each other.

| Term | Definition |
|---|---|
| **generation** | one thing a model produced in one turn. On the git path it is the full content of one file at the agent's commit; on the chat path it is one assistant message. |
| **segment** | a sentence or statement, as cut by `src/segment.ts`. The unit a fate is assigned to. |
| **separator character** | a character of a generation that lies between two segments and therefore inside none. Recorded as `separatorChars`. |
| **fate** | what happened to one generation segment: `survived_verbatim`, `survived_mutated` or `generated_deleted`. |
| **claim** | a finished span's assertion that it descends from a named extent of a named generation, stored as the span's `source` pointer. |
| **universe** (of a count) | the set of characters a number is measured over: finished-file characters, generation characters, or generation-segment characters. Two numbers may be compared only inside one universe. |
| **denominator** | in this artifact, always `Stats.generated.totalChars` or `Stats.generated.charsWritten` — the generation-side total a survival or deletion figure is divided by. |
| **reused characters** | generated characters that two or more finished spans both claim. Counted once by `verbatimClaimedChars` and more than once by `byClass.survived_verbatim.chars`. |
| **bound** | a relation between two numbers in one record that must hold for the record to be internally consistent. Checked by `checkRecord`. |
| **measurement** | a number the gate reports and never fails on, because it can be legitimately non-zero. Returned by `measure`. |
| **the gate** | `checkRecord` plus the three places it runs: `npm test`, `npx tsx src/invariants.cli.ts`, and the tail of `ursa run`. |
