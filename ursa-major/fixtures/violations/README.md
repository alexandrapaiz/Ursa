# fixtures/violations — twenty-three records the gate must refuse

Every other fixture in this repository is a record the resolver got
right. This directory holds the opposite: twenty-four committed
`OutcomeRecord` files, one clean base and twenty-three counterexamples,
each one the base plus a single named edit that violates exactly the
bound it is named after.

## Why a directory of broken records exists

`src/invariants.ts` states eighteen bounds a record must satisfy, and
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
| `base.json` | A record that passes all eighteen bounds. Every counterexample is this file plus one edit, so a reviewer reads a two-line `diff` rather than a 7 KB JSON file. |
| `<slug>.json` | One counterexample. `<slug>` is the lower-case, hyphenated form of the invariant code it fires, for example `gen-survived-bounded.json` for `GEN_SURVIVED_BOUNDED`. |
| `<slug>.md` | That fixture's note: the exact edit, what the record now claims, and the gate's own `observed` string with both sides of every number in it. |

The note is not documentation beside the fixture, it is checked against
it. `src/invariants.violations.test.ts` reads the `Expected codes:` line
out of each `.md` and asserts the gate emits exactly those codes, then
asserts every `observed` string the gate produced still appears in the
note verbatim. A fixture whose numbers move leaves a note that no longer
matches and fails the suite rather than misleading the next reader.

## The base record, and the five structures it carries on purpose

`base.json` is produced by `resolve()` over synthetic prose: one
`survived_verbatim` span, one `survived_mutated` span where the person
edited "holds it whole" into "holds the whole of it", one
`no_generation_provenance` span, and one generation segment the person
threw away.

Six of the eighteen bounds read nothing else, and all six are
*vacuously* true on a record that lacks their structure — which is why
neither fixture already committed here (`fixtures/mini/record/` and
`fixtures/real/`) could serve as the base:

| Bound | Structure it reads | Where the base gets it |
|---|---|---|
| `SIGNAL_QUOTE_GROUNDED` | `signals.oneShotCorrections[].quotes[]` | `deriveSignals()`, the real detector, run over the resolved record |
| `DESCENT_CHECKED_UNIFORMLY` | `files[].spans[].descent` | attached by hand as `{ basis: 'corroborated', rivalsSearched: 3 }`, because a corroborator needs a git repository and this record has none |
| `EXCLUSION_NOT_CLASSIFIED`, first two clauses | `exclusions[]` | passed through `resolve()`'s own input, so `stats.perFile` gets the row the resolver would have written |
| `RESOLVER_IDENTIFIED` | `task.resolvedBy` | set by hand to `{ basis: 'git_commit', commit: '19455a3', dirty: false }`, because `src/store.ts` stamps that field inside `saveRecord` and this script writes its files directly |
| `RIVAL_NOT_AFTER_FINAL` | `files[].spans[].descent.date` on a `rival` verdict | attached by hand, as a `sibling` rival dated `2026-10-09T17:00:00-06:00`, one hour before the record's `task.generatedAt`. The relation is `sibling` because that is the only one the bound orders by date, and the offset is `-06:00` rather than `Z` so the legal case and the broken case differ in instant without differing in string order |
| `EXCLUSION_NOT_CLASSIFIED`, time clause (added 2026-10-15) | `exclusions[].date` | the same instant, on the base's one `sibling` exclusion. Without a date the clause is satisfied by having nothing to order, which is the same vacuity the row above closed one level down. Running the same `-06:00` instant at both levels is deliberate: a gate comparing strings would pass the broken form of either |

The descent verdicts and the resolver identity are the hand-attached
ones. `{ basis: 'corroborated' }` is the shape `src/corroborate.ts` emits
when nothing outside the generation's line of descent holds the span's
text. `19455a3` is a real commit of this repository, the one that added
`task.resolvedBy`, rather than an invented short form like the `deadbee`
below: the bound it is there for says a named resolver is one a reader
can look up, so the record that passes it names one that resolves. It is
a literal and not a read of `HEAD`, for the reason in "Why the records
are byte-reproducible" below.

## Two bounds are backstops, not independent statements

Nineteen of the twenty-three fixtures fire exactly one violation, and
four fire two or three. Two of the eighteen bounds cannot be broken
alone, as a matter of arithmetic rather than of how hard anyone tried:

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
`src/invariants.violations.test.ts` asserts that count — nineteen
single-bound fixtures, three pairs and one triple — so a future edit to
`src/invariants.ts` that makes either one independently reachable fails
the suite and gets the note corrected.

The third pair is not a backstop and is listed separately in that test.
`rival-not-after-final-unreadable-horizon.json` breaks `task.generatedAt`,
which is the single horizon that both the base's dated `sibling` rival
verdict and its dated `sibling` exclusion are ordered against, so the
gate reports that neither level can be checked. The two losses are
different — an unchecked span-level descent claim, and an unchecked
removal of a whole file from every figure in the record — and a fixture
firing only one of them would assert that the two levels share a check
when they do not.

## Twenty-three fixtures, eighteen bounds

There is normally one fixture per bound, and the suite checks that every
declared bound is fired by some fixture. Three bounds have more than
one, because a bound stating several independent things needs a record
for each failure mode a reader should be able to see separately.

`DESCENT_CHECKED_UNIFORMLY` has two, added 2026-10-14:

- `descent-checked-uniformly.json` keeps the `survived_mutated` label on
  a span that names a rival, so the record sells a word-level diff as the
  person's correction while naming the commit that disproves it.
- `descent-checked-uniformly-verbatim.json` keeps the `survived_verbatim`
  label on a span whose `prior_revision` verdict names the generation's
  own parent as already holding the text, so the record sells text the
  file already contained as a model's output that the person kept.

`RIVAL_NOT_AFTER_FINAL` has three, added 2026-10-15 with the bound, and
they are the bound's three independent failure modes:

- `rival-not-after-final.json` moves the `sibling` rival's date two hours
  later, one hour past `task.generatedAt`, so the record names a commit
  from its own future as holding the span's text. This is the shipped
  defect of 2026-10-14 in miniature. The two hours are chosen so the
  broken date still *sorts* before the horizon as text
  (`2026-10-09T19:00:00-06:00` is `2026-10-10T01:00:00Z`), which means a
  gate comparing strings instead of instants would pass this file.
- `rival-not-after-final-unreadable-date.json` replaces the date with
  `last Tuesday`, so the record states a time nothing can order. Unlike
  the ordering clause, this one fires on every relation: a date the
  record cannot have read from git is decorative, and the field prints as
  provenance on every surface that shows it.
- `rival-not-after-final-unreadable-horizon.json` leaves the rival alone
  and breaks `task.generatedAt` instead. The fault is in one field rather
  than in any span, so the gate fires once for the record and names
  `task.generatedAt`.

`EXCLUSION_NOT_CLASSIFIED` has three. The first,
`exclusion-not-classified.json`, breaks the same-set clause by excluding
a path the record also classifies. The other two arrived 2026-10-15 with
the bound's time clause, which is `RIVAL_NOT_AFTER_FINAL` one level up
and the more expensive of the two to get wrong: a span-level mistake
moves one span, while an exclusion removes a whole file from every figure
in the record, and on this repository's own history one exclusion removed
60,616 characters, 84.7% of that run's headline survival figure.

- `exclusion-not-classified-after-final.json` moves the `sibling`
  exclusion's date two hours later, one hour past `task.generatedAt`, so
  the record drops a file on the evidence of a commit authored after the
  work closed. A `sibling` exclusion claims the finished file is
  byte-identical to a copy on a branch outside this generation's descent
  and infers the content came FROM that branch; dated after the work, the
  copy is a copy OF the work and the refusal runs backwards. The two
  hours are chosen the same way the span-level fixture's are, so a gate
  comparing strings would pass this file too.
- `exclusion-not-classified-unreadable-date.json` replaces the date with
  `last Tuesday`. As at the span level, unreadable fires on every
  relation, including the two the ordering clause exempts: `pre_existing`
  and `declared` are excused from being ordered, not from being readable.

A fixture's slug is therefore a bound's name in kebab case, optionally
followed by a qualifier naming which clause it breaks. The suite resolves
the slug to the longest declared code it starts with, so a slug naming no
bound at all still fails. That rule is why these two are spelled
`exclusion-not-classified-*` rather than `exclusion-not-after-final-*`:
the clause is new, the bound it belongs to is not.

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
npx tsx src/invariants.cli.ts fixtures/violations   # 28 violations, exit 1
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
every file is either synthetic or a public commit of this repository: the
prose is three sentences written for this fixture, the two paths are
`notes.md` and `docs/standards/pm.md`, the model is `test-model`, both
timestamps are the fixed `2026-10-10T00:00:00.000Z`, and the shas are the
invented short forms `96ed4e5` and `deadbee` plus the one real public sha
`19455a3` in `task.resolvedBy`, named above. The rival dates added on
2026-10-15 (`2026-10-09T17:00:00-06:00` and the three edits of it) are
chosen for this fixture and name no real commit; the `-06:00` offset is
a property the bound has to handle and not a location. No home directory, machine
username, session UUID or real conversation appears, and a commit of a
public repository is none of those. The exclusion dates added later the
same day are the same synthetic instants, for the reason the base-record
table above gives. It is the form the redaction rider
in `prompts/engineer-agent.md` asks for, a value that is real and
resolvable rather than a placeholder standing in for one. Checked with:

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
