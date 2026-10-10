# fixtures/violations — fifteen records the gate must refuse

Every other fixture in this repository is a record the resolver got
right. This directory holds the opposite: sixteen committed
`OutcomeRecord` files, one clean base and fifteen counterexamples, each
one the base plus a single named edit that violates exactly the bound it
is named after.

## Why a directory of broken records exists

`src/invariants.ts` states fifteen bounds a record must satisfy, and
`ursa run` and `ursa ci` both exit non-zero when one of them fails. Until
this directory existed, no record anywhere in the repository violated any
of them, and that absence had two measurable costs.

**One: the gate's wiring could only be tested by removing the gate.**
Asserting that a healthy repository passes the self-check passes
identically whether the check runs or does not exist. Measured on
2026-10-10: deleting the `gateRecords` call from `src/ci/run.ts` left all
eight tests in `src/launch-parity.test.ts` green. Closing that hole took
`src/ci/gate-wiring.test.ts`, which replaces `checkRecord` with `vi.mock`
— the only place in this project that has to mock a module of its own in
order to say anything at all.

**Two: `toContain` is not `toEqual`.** The breakage table in
`src/invariants.test.ts` mutates a passing record in memory and asserts
the gate's output *contains* the expected code. That assertion passes
when a mutation fires five bounds instead of one, so it cannot
distinguish a sharp counterexample from a record broken in every
direction at once. `src/invariants.violations.test.ts` asserts equality
on the whole code list for every file here, and doing so turned up a fact
no containment assertion could have shown (see "Two bounds are
backstops" below).

Ledger entry: "The record self-check can only be tested by replacing it,
because no fixture is allowed to be wrong" (`docs/ideas.md`, 2026-10-10).

## What is in here

| File | What it is |
|---|---|
| `base.json` | A record that passes all fifteen bounds. Every counterexample is this file plus one edit, so a reviewer reads a two-line `diff` rather than a 7 KB JSON file. |
| `<slug>.json` | One counterexample. `<slug>` is the lower-case, hyphenated form of the invariant code it fires, for example `gen-survived-bounded.json` for `GEN_SURVIVED_BOUNDED`. |
| `<slug>.md` | That fixture's note: the exact edit, what the record now claims, and the gate's own `observed` string with both sides of every number in it. |

The note is not documentation beside the fixture, it is checked against
it. `src/invariants.violations.test.ts` reads the `Expected codes:` line
out of each `.md` and asserts the gate emits exactly those codes, then
asserts every `observed` string the gate produced still appears in the
note verbatim. A fixture whose numbers move leaves a note that no longer
matches and fails the suite rather than misleading the next reader.

## The base record, and the three structures it carries on purpose

`base.json` is produced by `resolve()` over synthetic prose: one
`survived_verbatim` span, one `survived_mutated` span where the person
edited "holds it whole" into "holds the whole of it", one
`no_generation_provenance` span, and one generation segment the person
threw away.

Three of the fifteen bounds read nothing else, and all three are
*vacuously* true on a record that lacks their structure — which is why
neither fixture already committed here (`fixtures/mini/record/` and
`fixtures/real/`) could serve as the base:

| Bound | Structure it reads | Where the base gets it |
|---|---|---|
| `SIGNAL_QUOTE_GROUNDED` | `signals.oneShotCorrections[].quotes[]` | `deriveSignals()`, the real detector, run over the resolved record |
| `DESCENT_CHECKED_UNIFORMLY` | `files[].spans[].descent` | attached by hand as `{ basis: 'corroborated', rivalsSearched: 3 }`, because a corroborator needs a git repository and this record has none |
| `EXCLUSION_NOT_CLASSIFIED` | `exclusions[]` | passed through `resolve()`'s own input, so `stats.perFile` gets the row the resolver would have written |

Only the descent verdicts are hand-attached. `{ basis: 'corroborated' }`
is the shape `src/corroborate.ts` emits when nothing outside the
generation's line of descent holds the span's text.

## Two bounds are backstops, not independent statements

Thirteen of the fifteen fixtures fire exactly one violation. Two cannot,
as a matter of arithmetic rather than of how hard anyone tried:

- **`GEN_CLAIM_BOUNDED`** bounds the merged length of the source extents
  claiming a generation by what that generation wrote. While
  `CLAIM_IN_GENERATION` holds every extent inside `[0, text.length)` and
  `GEN_CHARS_CONSISTENT` holds `charsWritten === text.length`, the merged
  length is bounded by `charsWritten` already. Breaking it requires
  breaking one of those two first.
- **`PCT_DENOMINATORS_ORDERED`** compares `chars / coveredChars` against
  `chars / finalChars` over the same numerator, so an inversion requires
  `finalChars < coveredChars`, which `COVERED_BOUNDED` forbids. It is
  reachable only through a stored rate that does not match its own
  division, or through a covered count larger than the finished size.

Both are real guards against their neighbours being wrong. Neither is a
statement a record can break on its own, and
`src/invariants.violations.test.ts` asserts that count — thirteen
single-bound fixtures and two pairs — so a future edit to
`src/invariants.ts` that makes either one independently reachable fails
the suite and gets the note corrected.

## Adding the next one

The fixtures are the artifact. `src/invariants.violations.test.ts` reads
only the committed `.json` and `.md` files and never imports the script
below, so a fixture that stops firing is a test failure whether or not
the script still runs. The script exists so the base is resolver-produced
rather than typed, and so each note quotes the gate instead of
paraphrasing it.

```bash
cd ursa-major
npm run fixtures:violations          # rewrite every file in this directory
npm run fixtures:violations:check    # exit non-zero if any file drifted
npx vitest run src/invariants.violations.test.ts
npx tsx src/invariants.cli.ts fixtures/violations   # 17 violations, exit 1
```

To add a bound's counterexample, append a `Case` to `CASES` in
`ursa-major/tools/make-violation-fixtures.ts` with its `slug`, the
`codes` it must fire, the `edit` in the words a reviewer can check
against the diff, and the `consequence` — what a record in that state is
claiming. The script refuses to write a fixture whose actual code list
differs from its declared one, and prints what the gate emitted instead,
so a case that fires more bounds than intended fails at generation time
rather than becoming a vague fixture.

## Redaction

Nothing here needed redacting and nothing is redacted. Every string in
every file is synthetic: the prose is three sentences written for this
fixture, the two paths are `notes.md` and `docs/standards/pm.md`, the
commit shas are the invented short forms `96ed4e5` and `deadbee`, the
model is `test-model`, and both timestamps are the fixed
`2026-10-10T00:00:00.000Z`. No home directory, machine username, session
UUID or real conversation appears. Checked with:

```bash
grep -ohE '/(Users|home)/[^"]*|[a-f0-9]{32,}' fixtures/violations/* | sort -u
```

which returns nothing.

## Why the records are byte-reproducible

`deriveSignals()` stamps `signals.annotatedAt` with wall-clock time, so a
record resolved twice from identical input is not byte-identical. The
script pins that field to the episode's own `generatedAt`, because a
fixture that changes on every run cannot be diffed and
`fixtures:violations:check` would always report drift. The wider
consequence — that a buyer handed a record cannot reproduce it
byte-for-byte from its stated inputs — is a ledger entry rather than
something to fix from a fixture script.
