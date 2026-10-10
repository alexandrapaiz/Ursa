# Fifteen records the gate must refuse

**Status.** Built, 2026-10-10 (engineer seat, second dispatch).
**Ledger entry.** "The record self-check can only be tested by replacing
it, because no fixture is allowed to be wrong" (`docs/ideas.md`,
2026-10-10, proposed).
**Standard.** Written to the engineering-artifact standard in
`prompts/engineer-agent.md`: real system diagram, real TypeScript
signatures, real on-disk layouts with a real payload, exact commands, a
versioned tooling list, no bare terms.

---

## 1. The defect this closes, stated as a measurement

`ursa-major/src/invariants.ts` declares fifteen bounds a
**provenance-resolved outcome record** (the JSON object Ursa Minor sells,
typed as `OutcomeRecord` in `ursa-major/src/types.ts`) must satisfy.
`ursa run` and `ursa ci` both run every bound over every record they
write and exit non-zero when one fails.

Before this change, the number of committed records in this repository
that violate any of those fifteen bounds was **zero**. Every
counterexample lived inside one test file as an in-memory mutation of a
passing record. That absence had three measurable costs.

**Cost 1: the wiring could only be tested by deleting the thing being
tested.** A test that asserts a healthy repository passes the self-check
passes identically whether the check runs or does not exist. Measured
2026-10-10 by the run that shipped PR #153: removing the `gateRecords`
call from `ursa-major/src/ci/run.ts` left all eight tests in
`ursa-major/src/launch-parity.test.ts` green. Closing that hole took
`ursa-major/src/ci/gate-wiring.test.ts`, which replaces `checkRecord`
with `vi.mock` — the only place in this project that mocks a module of
its own in order to assert anything at all.

**Cost 2: `toContain` is not `toEqual`.** The `BREAKAGES` table in
`ursa-major/src/invariants.test.ts` asserts the gate's output *contains*
the expected invariant code. That assertion passes when a mutation fires
five bounds instead of one, so it cannot distinguish a sharp
counterexample from a record broken in every direction at once. Twelve of
the fifteen codes appear in that table and none of the twelve was ever
checked for exclusivity.

**Cost 3: the one on-disk surface had no committed input.**
`ursa-major/src/invariants.cli.ts` exports `runGate`, which reads records
off disk and is what a user runs against their own
`<project>/.ursa/records`. Its non-zero path was exercised only by a test
that writes a deliberately broken record to a temporary directory at test
time, so the one artifact a reviewer could have read did not exist.

### 1.1 What the exclusivity assertion found

Asserting equality on the whole code list, rather than containment,
produced a fact about the bound set that no containment assertion could
have shown: **two of the fifteen bounds cannot be violated in isolation.**

| Bound | Why no record can break it alone |
|---|---|
| `GEN_CLAIM_BOUNDED` — distinct characters of one generation claimed by finished spans do not exceed what that generation wrote | Claimed characters are the merged length of the `source` extents pointing at that generation. `CLAIM_IN_GENERATION` already holds every extent inside `[0, text.length)`, and `GEN_CHARS_CONSISTENT` already holds `charsWritten === text.length`. While both pass, the merged length of extents inside the text is bounded by `charsWritten` as arithmetic. Breaking `GEN_CLAIM_BOUNDED` requires breaking one of those two first. |
| `PCT_DENOMINATORS_ORDERED` — a class's share of the finished work is never larger than its share of the classified part | `pct` is `chars / coveredChars` and `pctOfFinal` is `chars / finalChars` over the same numerator, so `pctOfFinal > pct` requires `finalChars < coveredChars`, which `COVERED_BOUNDED` forbids. It is reachable only through a stored rate that does not match its own division, or through a covered count larger than the finished size. |

Neither is dead code. Both are guards against their neighbours being
wrong, which is a different claim from "independent statement about a
record", and the difference matters to anyone who tries to test one of
them in isolation and concludes the gate is broken when it does not fire
alone. `ursa-major/src/invariants.violations.test.ts` asserts the split —
thirteen single-bound fixtures, two pairs — so a future edit to
`src/invariants.ts` that makes either one independently reachable fails
the suite and forces the note that says otherwise to be corrected.

---

## 2. System diagram

Every node below is a file that exists in the repository after this
change. Every edge is labelled with the data that crosses it: a
TypeScript type, a file format, or a named field.

### 2.1 Nodes

| Node | Kind | What it is |
|---|---|---|
| `ursa-major/src/resolve.ts` | module, existing | The resolver. `resolve(input: ResolveInput): OutcomeRecord` joins a finished file backward to the generations that fed it. |
| `ursa-major/src/signals.ts` | module, existing | The signal detector. `deriveSignals(record: OutcomeRecord): LabSignals` reads correction loops, regressions and one-shot corrections out of a resolved record. |
| `ursa-major/tools/make-violation-fixtures.ts` | script, **new** | The derivation. Builds one passing base record, applies fifteen named single-field edits to copies of it, and writes each copy plus a generated note to disk. Run by hand; not imported by any test. |
| `ursa-major/fixtures/violations/base.json` | data file, **new** | One `OutcomeRecord` that satisfies all fifteen bounds. 6,975 bytes. |
| `ursa-major/fixtures/violations/<slug>.json` | data file, **new**, ×15 | One `OutcomeRecord` that violates exactly the bounds its note names. `<slug>` is the lower-case hyphenated form of the invariant code, e.g. `gen-survived-bounded.json` for `GEN_SURVIVED_BOUNDED`. |
| `ursa-major/fixtures/violations/<slug>.md` | data file, **new**, ×15 | That fixture's note. Machine-read by the test for its `Expected codes:` line and its quoted `observed` strings; human-read for the edit and its consequence. |
| `ursa-major/fixtures/violations/README.md` | document, **new** | What the directory is, why broken records are committed, how to add the next one. |
| `ursa-major/src/invariants.ts` | module, existing, one export added | The gate. `checkRecord(record: OutcomeRecord): Violation[]`. Now also exports `BOUND_CODES: InvariantCode[]`. |
| `ursa-major/src/invariants.cli.ts` | module, existing | The on-disk surface. `runGate(target: string, quiet?: boolean)` reads every `*.json` under a directory and returns a violation count and printable lines. |
| `ursa-major/src/launch.ts` | module, existing | The shared edge both launches run. `gateRecords(records: OutcomeRecord[]): GateResult`. |
| `ursa-major/src/invariants.violations.test.ts` | test, **new** | Reads only the committed `.json` and `.md` files. 24 tests. |
| `ursa-major/src/ci/gate-wiring.test.ts` | test, existing, header rewritten | Still mocks `checkRecord`, for a job now narrowed to the plumbing from a verdict to an exit code. |

### 2.2 Edges

| From | To | What crosses it |
|---|---|---|
| `tools/make-violation-fixtures.ts` | `src/resolve.ts` | a `ResolveInput` literal: one `files[]` entry (`notes.md`, 202 characters of synthetic prose), one `conversations[]` entry (`c1`), one `generations[]` entry (210 characters), one `exclusions[]` entry (`docs/standards/pm.md`), `generatedAt: '2026-10-10T00:00:00.000Z'` |
| `src/resolve.ts` | `tools/make-violation-fixtures.ts` | an `OutcomeRecord` |
| `tools/make-violation-fixtures.ts` | `src/signals.ts` | that `OutcomeRecord` |
| `src/signals.ts` | `tools/make-violation-fixtures.ts` | a `LabSignals` with one `oneShotCorrections[]` entry carrying two `QuoteRef` values |
| `tools/make-violation-fixtures.ts` | `fixtures/violations/*.json` | `JSON.stringify(record, null, 2)` — a 2-space-indented `OutcomeRecord`, newline-terminated |
| `tools/make-violation-fixtures.ts` | `src/invariants.ts` | each broken `OutcomeRecord`, for the generation-time exclusivity check |
| `src/invariants.ts` | `tools/make-violation-fixtures.ts` | a `Violation[]`, whose `code`, `where`, `observed` and `invariant` fields are written into the note |
| `tools/make-violation-fixtures.ts` | `fixtures/violations/*.md` | GitHub-flavoured Markdown: an `Expected codes:` line of backtick-quoted `InvariantCode` values, then the edit, the consequence, and one section per `Violation` |
| `fixtures/violations/*.json` | `src/invariants.violations.test.ts` | `OutcomeRecord`, via `JSON.parse(readFileSync(...))` |
| `fixtures/violations/*.md` | `src/invariants.violations.test.ts` | the `Expected codes:` line, parsed to `InvariantCode[]` by the regular expression `` /`([A-Z_]+)`/g `` |
| `src/invariants.violations.test.ts` | `src/invariants.ts` | one `OutcomeRecord` per fixture, to `checkRecord`; and `BOUND_CODES`, for the coverage assertion |
| `src/invariants.violations.test.ts` | `src/invariants.cli.ts` | the string `'fixtures/violations'`, to `runGate` |
| `src/invariants.cli.ts` | `src/invariants.violations.test.ts` | `{ violations: 17, lines: string[] }` |
| `src/invariants.violations.test.ts` | `src/launch.ts` | an `OutcomeRecord[]` of two elements (`base.json`, `gen-survived-bounded.json`), to `gateRecords` |
| `src/launch.ts` | `src/invariants.violations.test.ts` | a `GateResult`, whose `report` must contain the `observed` string of the one violation |

### 2.3 The one-way property that makes the fixtures the artifact

The test never imports the script. The arrow from
`tools/make-violation-fixtures.ts` to the fixture files runs once, by
hand, and no edge runs back the other way at test time. So a fixture that
stops firing its bound is a test failure whether or not the script still
runs, whether or not it still compiles, and whether or not anyone ever
runs it again. The script's only job is that the base record is
resolver-produced rather than typed, and that each note quotes the gate
instead of paraphrasing it.

---

## 3. Interfaces at every component boundary

Real signatures a caller writes against, not descriptions.

### 3.1 `ursa-major/src/invariants.ts` — one export added

```ts
/** Stable identifier for each invariant, so a violation can be grepped for. */
export type InvariantCode =
  | 'CLAIM_NOT_WIDER' | 'CLAIM_IN_GENERATION' | 'GEN_SPANS_PARTITION_ORDER'
  | 'GEN_CHARS_CONSISTENT' | 'GEN_SURVIVED_BOUNDED' | 'GEN_CLAIM_BOUNDED'
  | 'DELETION_SPLIT_EXACT' | 'FINAL_SPANS_IN_FILE' | 'COVERED_BOUNDED'
  | 'RATES_MATCH_FIELDS' | 'PCT_DENOMINATORS_ORDERED' | 'PERFILE_ENUMERATES_PATHS'
  | 'SIGNAL_QUOTE_GROUNDED' | 'DESCENT_CHECKED_UNIFORMLY' | 'EXCLUSION_NOT_CLASSIFIED'

/** How many bounds a record is checked against. Derived, not written. */
export const BOUND_COUNT: number

/** Every bound's code, in declaration order. Added by this change. */
export const BOUND_CODES: InvariantCode[]

export interface Violation {
  code: InvariantCode
  /** the bound, stated so the message is readable without this file open */
  invariant: string
  /** which record, file, generation or span it fired on */
  where: string
  /** the numbers as observed, always including both sides of the bound */
  observed: string
}

export function checkRecord(record: OutcomeRecord): Violation[]
```

`BOUND_CODES` is `Object.keys(BOUNDS) as InvariantCode[]`, derived from
the same object literal `BOUND_COUNT` is derived from, for the same
reason: the written word went stale twice. `README.md` and three design
documents said "thirteen" on 2026-10-10, four days after
`EXCLUSION_NOT_CLASSIFIED` became the fifteenth.

### 3.2 `ursa-major/tools/make-violation-fixtures.ts` — the case type

This is the surface somebody extends to add the sixteenth counterexample.

```ts
interface Case {
  /** filename stem; the lower-case hyphenated form of the code it fires */
  slug: string
  /**
   * The multiset of invariant codes the gate must emit on this fixture
   * and nothing besides, in the order `checkRecord` emits them. The
   * script refuses to write a fixture whose actual list differs.
   */
  codes: InvariantCode[]
  /** what was changed, in the shape a reviewer can check against the diff */
  edit: string
  /** what a record in this state is claiming, and why that claim is a defect */
  consequence: string
  /** present only when `codes` has more than one entry: why it must */
  why?: string
  /** the single-field mutation, applied to a deep clone of the base */
  break: (r: OutcomeRecord) => void
}

const CASES: Case[]
```

The script takes no arguments except `--check`:

```ts
// npx tsx tools/make-violation-fixtures.ts           → writes 31 files
// npx tsx tools/make-violation-fixtures.ts --check   → exit 1 if any drifted
```

### 3.3 `ursa-major/src/invariants.violations.test.ts` — the two readers

```ts
/** every fixture in the directory except the clean base, in filename order */
const SLUGS: string[]

/**
 * The codes a fixture's note says the gate must emit, parsed out of the
 * note's own `Expected codes:` line rather than duplicated in the test.
 */
function expectedCodes(slug: string): InvariantCode[]
```

`expectedCodes` reading the expectation out of the Markdown is the
load-bearing choice in this file. If the expectation lived in the test
instead, a note could go stale without failing anything, and the note is
what a reviewer reads.

### 3.4 The two surfaces under test, unchanged

```ts
// src/invariants.cli.ts
export function runGate(
  target: string, quiet?: boolean,
): { violations: number; lines: string[] }

// src/launch.ts
export interface GateResult { violations: Violation[]; report: string }
export function gateRecords(records: OutcomeRecord[]): GateResult
```

---

## 4. On-disk layout, with a real payload

### 4.1 Paths

```
ursa-major/
  fixtures/
    violations/
      README.md                        7,913 B   what this directory is
      base.json                        6,975 B   passes all fifteen bounds
      claim-not-wider.json             6,974 B   ┐
      claim-not-wider.md               1,172 B   ┘ one pair per bound, ×15
      claim-in-generation.json/.md
      covered-bounded.json/.md
      deletion-split-exact.json/.md
      descent-checked-uniformly.json/.md
      exclusion-not-classified.json/.md
      final-spans-in-file.json/.md
      gen-chars-consistent.json/.md
      gen-claim-bounded.json/.md
      gen-spans-partition-order.json/.md
      gen-survived-bounded.json/.md
      pct-denominators-ordered.json/.md
      perfile-enumerates-paths.json/.md
      rates-match-fields.json/.md
      signal-quote-grounded.json/.md
  tools/
    make-violation-fixtures.ts        20,492 B   the derivation
  src/
    invariants.violations.test.ts      8,470 B   24 tests
```

Format of every `*.json`: a single JSON object matching `OutcomeRecord`,
2-space indented, newline-terminated, as produced by
`JSON.stringify(record, null, 2) + '\n'`.

### 4.2 Real payload: the edit, as a `diff`

This is the whole difference between `base.json` and
`gen-survived-bounded.json`, which is the point of committing a base:

```
$ diff fixtures/violations/base.json fixtures/violations/gen-survived-bounded.json
126,127c126,127
<       "survivedChars": 145,
<       "survivalRate": 0.704
---
>       "survivedChars": 207,
>       "survivalRate": 1.005
```

`totalChars` on that generation is 206, so 207 surviving characters is
one more than the generation ever put inside a segment. `survivalRate` is
recomputed from the wrong numerator rather than left stale, so the stored
rate matches its own arithmetic and `RATES_MATCH_FIELDS` stays silent.
That is deliberate: it is the 2026-10-04 defect's actual shape, where
every field was internally consistent and the subset relation the
percentage is a share of was false.

### 4.3 Real payload: the base record's generation block

Actual file contents, lines 100–128 of `fixtures/violations/base.json`:

```json
      "spans": [
        {
          "start": 0,
          "end": 70,
          "text": "The information a decision needs is dispersed across many individuals.",
          "fate": "survived_verbatim"
        },
        {
          "start": 72,
          "end": 147,
          "text": "No single observer holds it whole, and a central grader pretends otherwise.",
          "fate": "survived_mutated"
        },
        {
          "start": 149,
          "end": 210,
          "text": "This sentence is a draft that the person threw away entirely.",
          "fate": "generated_deleted",
          "deletion": {
            "cause": "human_edit"
          }
        }
      ],
      "totalChars": 206,
      "charsWritten": 210,
      "separatorChars": 4,
      "survivedChars": 145,
      "survivalRate": 0.704
```

The four separator characters are the two blank-line pairs between
paragraphs: generated, inside no segment, and therefore carrying no fate.
They are the quantity the 2026-10-04 defect hid inside, which is why
`gen-chars-consistent.json` is the fixture that raises
`separatorChars` by ten rather than touching any other count.

### 4.4 Real payload: a complete note

Actual file contents of `fixtures/violations/gen-survived-bounded.md`:

```markdown
# GEN_SURVIVED_BOUNDED — gen-survived-bounded.json

Expected codes: `GEN_SURVIVED_BOUNDED`

## The edit

`base.json` with `generations[0].survivedChars` raised one above `totalChars`,
with `survivalRate` recomputed from it so the stored rate still matches its
own arithmetic.

## What the record now claims

More characters of the generation survive than the generation put inside
segments. This is the 2026-10-04 defect in miniature, and the recomputed rate
is why it is worth a fixture: every field is internally consistent, the
percentage reads as correct, and the subset relation it is a percentage of is
false.

## What the gate says

### `GEN_SURVIVED_BOUNDED`

- Where: `violation-fixture-base generation 0`
- Observed: survivedChars 207, totalChars 206, charsWritten 210
- Bound: a generation's surviving characters are a subset of its segment
  characters, which are a subset of what it wrote:
  survivedChars <= totalChars <= charsWritten

## Provenance

Derived by `tools/make-violation-fixtures.ts`. See `README.md` in this
directory for what the directory is for and how the test reads it.
```

The two values under "What the gate says" are not transcribed by hand.
They are `Violation.where` and `Violation.observed` as `checkRecord`
returned them, and `src/invariants.violations.test.ts` asserts both
strings still appear in the note verbatim. A fixture whose numbers move
leaves a note that no longer matches it and fails the suite.

### 4.5 Redaction

Nothing here needed redacting and nothing is redacted. The redaction
rider in `prompts/engineer-agent.md` requires that a real payload carry
no machine identity and no private record identity. Every string in every
file under `fixtures/violations/` is synthetic: three sentences written
for this fixture, the paths `notes.md` and `docs/standards/pm.md`, the
invented short shas `96ed4e5` and `deadbee`, the model name
`test-model`, the conversation id `c1`, and the fixed timestamp
`2026-10-10T00:00:00.000Z` in both `task.generatedAt` and
`signals.annotatedAt`. Checked with:

```bash
cd ursa-major
grep -ohE '/(Users|home)/[^"]*|[a-f0-9]{32,}' fixtures/violations/* | sort -u
```

which returns nothing. The same grep is recorded in the directory's own
`README.md` so the check stays next to the files it covers.

---

## 5. Exact commands

Literal invocations, with real flags, run in this order during the build.

```bash
# 1. Install exactly the locked dependency versions.
cd ursa-major
npm ci --no-audit --no-fund

# 2. Derive the thirty-one files. Prints one line per case naming the codes
#    the gate actually emitted, and exits 1 before writing anything if the
#    base record does not pass all fifteen bounds.
npm run fixtures:violations

# 3. Confirm the committed files are exactly what the script would write.
#    This is the drift check; it exits 1 and names each differing file.
npm run fixtures:violations:check

# 4. The new tests alone.
npx vitest run src/invariants.violations.test.ts

# 5. The whole suite plus the typecheck, which is what `npm test` is.
npm test

# 6. The gate on the directory, off disk, as a user would run it against
#    their own records. Exits 1. Prints 17 violations: fifteen fixtures, two
#    of which fire two bounds each, and the base contributing none.
npx tsx src/invariants.cli.ts fixtures/violations

# 7. The negative check: disable the gate and confirm the new tests fail.
#    Restores the file afterward.
cp src/invariants.ts /tmp/inv.bak
sed -i 's/^  const out: Violation\[\] = \[\]$/  if (process.env.URSA_NEGATIVE_CHECK) return []\n  const out: Violation[] = []/' src/invariants.ts
URSA_NEGATIVE_CHECK=1 npx vitest run src/invariants.violations.test.ts
cp /tmp/inv.bak src/invariants.ts

# 8. The redaction check on the committed payloads.
grep -ohE '/(Users|home)/[^"]*|[a-f0-9]{32,}' fixtures/violations/* | sort -u
```

Step 7's `sed` targets the first line of `checkRecord`'s body. It is
written out rather than described because a negative check nobody can
rerun is an assertion about the past.

---

## 6. Evidence the ledger entry's first step is met

The entry's first step, quoted in full: "Copy
`ursa-major/fixtures/mini/record/outcome_record.json`, raise one
generation's claimed characters above its `charsWritten`, commit it with
the note, and add one test asserting `checkRecord` returns exactly the
`GEN_CLAIM_BOUNDED` violation and nothing else. Fourteen more follow one
at a time, each as its own small unit of work."

| What the entry asked | What shipped | Deviation |
|---|---|---|
| one fixture | fifteen, one per bound | More than asked. The exclusivity assertion made the remaining fourteen cheap: once the base passes and the harness asserts the code list, each case is a `Case` literal and a one-field edit. |
| copy `fixtures/mini/record/outcome_record.json` as the base | a new base, built through `resolve()` in the script | **Deviation.** The mini record carries no `signals`, no `descent` verdict and no `exclusions`, and three of the fifteen bounds read nothing else. On that base, those three bounds are vacuously true and no edit to the file could make them fire. §2.1 and the directory README name the three structures and where the base gets each. |
| "returns exactly the `GEN_CLAIM_BOUNDED` violation and nothing else" | `GEN_CLAIM_BOUNDED` cannot be violated alone | **Finding, not a deviation.** §1.1. The fixture fires `CLAIM_IN_GENERATION` and `GEN_CLAIM_BOUNDED`, its note explains why one alone is unreachable, and the test asserts that pair exactly. The entry's own wording is what the exclusivity assertion disproved. |
| the fixture doubles as the worked example `docs/design/generated-denominator.md` describes in prose | §4.2, §4.3 and §4.4 above, plus a pointer added to that document's §5 | none |
| fourteen more "one at a time, each as its own small unit of work" | all fifteen today | The PM's Monday retrospective should know the entry's sizing was pessimistic by roughly a factor of fifteen, because the cost was the harness and not the cases. |

### 6.1 Test suite

```
$ npm test
Test Files  31 passed | 1 skipped (32)
     Tests  529 passed | 4 skipped (533)
  Duration  10.66s
```

`tsc --noEmit` passes, which `npm test` runs first. The suite held 505
tests before this change and holds 529 after: 24 new, 0 changed, 0
removed. The 4 skipped and 1 skipped file are pre-existing.

### 6.2 The negative check, in full

Step 7 of §5, with `checkRecord` stubbed to return an empty array:

```
Tests  19 failed | 5 passed (24)
```

The nineteen include all fifteen per-fixture exclusivity assertions, the
coverage assertion against `BOUND_CODES`, the slug-matches-code
assertion, the `runGate` count, and the `gateRecords` report. Named
failures, abbreviated:

```
each committed record fires exactly the bounds its note names > rates-match-fields.json
  AssertionError: expected [] to deeply equal [ 'RATES_MATCH_FIELDS' ]
the directory covers the gate rather than a corner of it > fires every one of the declared bounds
  AssertionError: expected [] to deeply equal [ 'CLAIM_IN_GENERATION', …(14) ]
the gate reaches these records through the two surfaces that read records > through the CLI, off disk
  AssertionError: expected +0 to be 17
the gate reaches these records through the two surfaces that read records > through `gateRecords`
  AssertionError: expected [] to deeply equal [ 'GEN_SURVIVED_BOUNDED' ]
```

The five that still pass are statements about the fixtures rather than
about `checkRecord`, which is the correct split, and two of them pass for
a reason worth naming: "passes all fifteen bounds" and "passes
`gateRecords` on the base alone" both assert an empty `Violation[]`, and
a stub that always returns one satisfies them vacuously. They are not
evidence of anything while the gate is disabled, and they are not meant
to be. The other three — the fixture count, the three-structures check on
the base, and the backstop-count assertion — read the files on disk and
never call the gate at all.

```
✓ the base record … > passes all fifteen bounds                    (vacuous under the stub)
✓ the base record … > carries the three structures …               (reads base.json)
✓ each committed record … > found fifteen fixtures beside the base (reads the directory)
✓ the directory covers … > records which bounds cannot be violated alone (reads the notes)
✓ the gate reaches … > passes `gateRecords` on the base alone      (vacuous under the stub)
```

### 6.3 Two further negative checks

**A missing fixture fails the coverage assertion.** Moving
`covered-bounded.json` out of the directory:

```
Tests  4 failed | 19 passed (23)
AssertionError: expected [ 'CLAIM_IN_GENERATION', …(13) ] to deeply equal
  [ 'CLAIM_IN_GENERATION', …(14) ]
-   "COVERED_BOUNDED",
```

This is the assertion that makes a sixteenth bound with no counterexample
a test failure. Nothing else in the repository would notice.

**A stale note fails its fixture's test.** Changing one character of the
`Observed:` line in `covered-bounded.md` from `coveredChars` to
`coveredchars`:

```
Tests  1 failed | 23 passed (24)
AssertionError: covered-bounded.md no longer quotes what the gate observed:
  expected '# COVERED_BOUNDED — covered-bounded.j…' to contain
  'coveredChars 201, span extents 198, f…'
```

### 6.4 The gate on the directory, off disk

```
$ npx tsx src/invariants.cli.ts fixtures/violations ; echo "exit $?"
...
16 records checked, 17 violations.
exit 1
```

Seventeen rather than fifteen because `gen-claim-bounded.json` and
`pct-denominators-ordered.json` each fire two bounds (§1.1). Sixteen
records because `base.json` is in the same directory and contributes
none, which is what makes the count evidence about the fifteen rather
than about the reader's arithmetic.

### 6.5 What the mock in `src/ci/gate-wiring.test.ts` is still for

Narrowed, not removed, and the file's header now says so. The fixtures
reach `checkRecord`, `runGate` and `gateRecords` with no mock. What they
cannot reach is that file's subject: the records `runCi` gates are the
ones it resolved in-process moments earlier, so there is no seam to hand
a fixture through. Adding one would mean putting an injection point into
production code for a test's benefit, and the injection point for a gate
is an opt-out of the gate. The mock's remaining job is the plumbing from
a verdict to the exit code, the result object and the run comment — not
whether the gate detects anything, which is now tested against files a
reviewer can read.

---

## 7. Tooling

Every tool with its version, its job here, and why it rather than the
alternative considered.

| Tool | Version | Its job in this change | Chosen over |
|---|---|---|---|
| Node.js | 22.23.3 (local run); `node-version: 20` on the Actions runner | Runs the derivation script and the test runner. | Nothing. It is the runtime the whole of `ursa-major` already targets. |
| tsx | 4.23.15 | Executes `tools/make-violation-fixtures.ts` directly, so the script imports `src/resolve.ts` and `src/signals.ts` as TypeScript with no build step. | A compiled `dist/` step. Rejected because the script is run by hand a few times a quarter and a build artifact would be a second thing to keep in sync; `tsx` is already the runner for `npm run resolve`, `npm run brief` and `npm run mcp`. |
| TypeScript | 5.9.3 | Typechecks the script and the test under `npm test`'s `tsc --noEmit`. The `Case` interface is what makes a malformed case a compile error rather than a silently skipped fixture. | Plain JavaScript with JSDoc. Rejected: `codes: InvariantCode[]` is the field that catches a typo'd code name, and the existing `vi.mock` factory in `gate-wiring.test.ts` is the cautionary case — it is not typechecked against the module it replaces, and its first draft asserted against `claims-exceed-generated`, a string no `InvariantCode` can be. |
| Vitest | 5.0.2 | Runs `src/invariants.violations.test.ts`. Its `it()` inside a `for` loop over `SLUGS` is what gives each fixture its own named, independently failing test. | Node's built-in `node:test`. Rejected: the other 31 test files are Vitest and a second runner would mean a second `npm test` entry point. |
| `diff` (GNU diffutils, system) | 3.10 | Produces the two-line evidence in §4.2 that a fixture is one edit from the base. | `git diff --no-index`. Equivalent here; plain `diff` is shorter and the files are not both tracked at generation time. |
| `grep` (ugrep, system) | 7.8.4 | The redaction check in §4.5. | A Node script. Rejected: the existing redaction checks in `fixtures/real/README.md` and `docs/design/generated-denominator.md` §3.3 are `grep` one-liners, and a reviewer should be running the same command they already know. |
| `node:fs` `readdirSync` | stdlib (Node 22) | Discovers the fixtures in the test, so adding a `.json` file adds a test case without editing the test. | A hand-maintained list in the test. Rejected: a list is the thing that goes stale, and the whole defect this change closes is a count that went stale in four documents. |

No new dependency is added to `package.json`. Two scripts are:
`fixtures:violations` and `fixtures:violations:check`. Steady-state cost
stays $0: the fixtures are 196 KB of text in a public repository and the
tests add 0.2 seconds to a 10.7-second suite.

---

## 8. Boundaries: what this change does not do

1. **No bound changed.** `checkRecord` is untouched. The only edit to
   `src/invariants.ts` is the new `BOUND_CODES` export and its comment.
   Every record written before today still passes or fails exactly as it
   did.

2. **The `vi.mock` in `src/ci/gate-wiring.test.ts` stays.** §6.5. Removing
   it needs an injection seam in `runCi`, which is a production change for
   a test's benefit and is not made here.

3. **The `BREAKAGES` table in `src/invariants.test.ts` stays as it is.**
   Its `toContain` assertions are weaker than the new file's, and they are
   also mutations of the *real-history* fixture rather than of a synthetic
   base, which is coverage the new directory does not have. Converting
   them to `toEqual` would be a separate unit of work and would fail on at
   least the two backstop bounds; it is filed as a ledger entry rather than
   done in this diff.

4. **`docs/design/generated-denominator.md` is not rewritten.** It
   describes ten bounds and the repository now has fifteen. This change
   adds one pointer to its §5 and corrects one sentence there that is now
   provably false ("Each row ... has at least one test that breaks a record
   in exactly that way"). Bringing that document to fifteen bounds is a
   ledger entry.

5. **Nothing is wired into CI.** `npm test` carries the new file wherever
   the existing test gate runs. No workflow file is touched; a seat's token
   cannot write `.github/workflows/` (see
   `docs/agents/pending-workflow-changes.md`).

6. **The fixtures are synthetic, deliberately.** They test the gate's
   arithmetic, which is universe-relative and does not care whose history
   produced the numbers. The gate's exposure to *real* history is
   `fixtures/real/ursa-main-4d5e401.json`, which passes, and the
   `BREAKAGES` table that mutates it. Both stay.

---

## 9. Glossary

Terms used above that are not self-explanatory outside this project.

| Term | Definition |
|---|---|
| **outcome record** | The JSON object Ursa Minor sells: a finished piece of real work joined backward to every model generation that fed it, with each span of the final product classified by what happened to it. Typed as `OutcomeRecord` in `ursa-major/src/types.ts`. |
| **bound** | A statement about one record that is either true or a defect, checked against that record's own fields, with both sides of the comparison measured over the same set of characters. Fifteen are declared in `ursa-major/src/invariants.ts`. |
| **the gate** | `checkRecord`, plus the two callers that act on its verdict: `gateRecords` in `src/launch.ts` (both launches) and `runGate` in `src/invariants.cli.ts` (the command line). |
| **measurement, as distinct from a bound** | A number the gate reports and never fails on, because it can be legitimately non-zero. `measure()` returns twenty of them. A gate that fails on correct input gets silenced. |
| **separator characters** | Characters a generation wrote that sit between its segments, so they carry no per-character fate and are in no survival or discard rate. Four of them in `base.json`. |
| **universe (of a bound)** | The set of characters both sides of a bound are measured over. The 2026-10-04 defect was a comparison between a finished-file count and a generation-segment count: two different universes. |
| **backstop bound** | A bound that cannot be violated unless another bound is violated first, so it guards against its neighbours being wrong rather than stating something independent. Two of the fifteen: §1.1. |
| **the two launches** | `ursa run` (`src/bin/ursa.ts`, typed by a person against a finished project) and `ursa ci` (`src/ci/run.ts`, fired by a merged pull request on a runner). Sold as one resolver fired two ways; held to that by `src/launch-parity.test.ts`. |
| **exclusion** | A path the run touched and refused to classify, because the finished blob is byte-identical to one held by a commit outside the generation's line of descent. An import, not anyone's correction. `docs/design/record-exclusions.md`. |
| **descent verdict** | The corroboration behind a `survived_mutated` label: whether anything outside the generation's line of descent already held the span's text verbatim. `src/corroborate.ts`, typed as `DescentEvidence`. |
| **negative check** | Breaking the thing under test on purpose and confirming the test fails. A test that passes whether or not the subject exists is not evidence; §6.2 is this change's. |
