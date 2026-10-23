---
name: adding-a-bound-to-the-record-gate
description: >
  Use when a new rule about outcome records is about to be added to,
  removed from, or reworded in the record gate — `invariants.ts` and
  the counterexample fixtures under `fixtures/violations/`. Fires for
  deciding whether a proposed rule is a bound or a measurement, for
  writing a bound's statement text and its check, for adding or
  changing the committed record that breaks it, for reading a gate
  violation a run printed and deciding whether the bound or the
  resolver is wrong, and for any edit that moves the bound count or
  the bounds digest. Does not fire for choosing a span's label, for
  deciding what a record statistic may be said to mean, for running a
  trial, or for turning a record into tuning axioms.
version: 0.1.1
status: draft
validated: false
owner_seat: skill
created: 2026-10-18
revised: 2026-10-23
evidence_scheme: repo
evidence:
  - ref: E1
    what: why the gate exists, an impossible pair of figures printed in all six records of one run while 344 tests passed, because nothing compared one number in a record against another
    source: ursa-major/src/invariants.ts:1-18
  - ref: E2
    what: the two rules that keep the bound list honest, a bound compares numbers over the same set of characters, and anything that can be legitimately false is a measurement
    source: ursa-major/src/invariants.ts:20-31
  - ref: E3
    what: the Measurement interface exists for numbers reported and never failed on, with reuse across two final spans as the case that makes verbatim-over-generated legitimately false
    source: ursa-major/src/invariants.ts:72-90
  - ref: E4
    what: the InvariantCode union, one stable grep-able identifier per bound, eighteen of them
    source: ursa-major/src/invariants.ts:41-60
  - ref: E5
    what: the Violation shape, the bound restated so the message reads without this file open, where it fired, and the observed numbers always including both sides of the bound
    source: ursa-major/src/invariants.ts:62-70
  - ref: E6
    what: BOUNDS is the statement table keyed by code, and the statement is prose a reader can check a record against
    source: ursa-major/src/invariants.ts:183-187
  - ref: E7
    what: BOUND_COUNT is derived from BOUNDS because the written word went stale in a README and three design documents for four days, and the count is reported to a user in the CI run comment
    source: ursa-major/src/invariants.ts:340-352
  - ref: E8
    what: BOUND_CODES exists so a test can catch a bound added with no counterexample behind it
    source: ursa-major/src/invariants.ts:354-365
  - ref: E9
    what: what the bounds digest hashes, each bound's code and statement text in code-alphabetical order, truncated to sixteen hex characters, and why the statement text is inside it
    source: ursa-major/src/invariants.ts:367-412
  - ref: E10
    what: the push helper stamps BOUNDS[code] into every violation, so the statement text is the message
    source: ursa-major/src/invariants.ts:436-441
  - ref: E11
    what: the walk over final files, with the FINAL_SPANS_IN_FILE pushes at its head and the CLAIM_NOT_WIDER pushes further down the same span loop, which is the order the two come out in
    source: ursa-major/src/invariants.ts:445-497
  - ref: E12
    what: the doc comment that says violations come out in declaration order, left behind above BOUND_COUNT a hundred lines from the function it describes
    source: ursa-major/src/invariants.ts:335-339
  - ref: E13
    what: the Case shape a new counterexample is declared as, the codes it must fire and nothing besides, the edit in words a reviewer can check against the diff, the consequence, and why for a multi-code case
    source: ursa-major/tools/make-violation-fixtures.ts:207-226
  - ref: E14
    what: the generator compares the gate's emitted codes against the declared ones by position and length, and refuses the fixture while printing what the gate actually emitted
    source: ursa-major/tools/make-violation-fixtures.ts:536-553
  - ref: E15
    what: the base record is checked first and the script exits if it violates anything, because no fixture below would prove anything
    source: ursa-major/tools/make-violation-fixtures.ts:524-530
  - ref: E16
    what: each note is generated from the case plus the gate's own output, so the Expected codes line, the where and the observed strings are the gate's rather than a paraphrase
    source: ursa-major/tools/make-violation-fixtures.ts:481-507
  - ref: E17
    what: resolvedBy is pinned and gatedBy is read live, the opposite choice in adjacent lines, because a pinned digest leaves the only clause with teeth unreachable while a live commit makes every fixture's bytes a function of its own commit
    source: ursa-major/tools/make-violation-fixtures.ts:166-203
  - ref: E18
    what: the suite reads the expected codes out of each note's own Expected codes line rather than duplicating them, so a stale note fails something
    source: ursa-major/src/invariants.violations.test.ts:42-53
  - ref: E19
    what: the base record carries six structures a resolved chat record does not, asserted one by one, because a bound that reads a structure the base lacks is vacuously true on it
    source: ursa-major/src/invariants.violations.test.ts:60-90
  - ref: E20
    what: the base's gatedBy is asserted against the live bound set rather than a literal, and the stated cost is that rewording any bound fails that line
    source: ursa-major/src/invariants.violations.test.ts:91-114
  - ref: E21
    what: the number of fixtures the directory must hold, and the per-fixture assertion, equality on the whole code list rather than containment, with every observed and where string the gate produced still appearing in the note verbatim
    source: ursa-major/src/invariants.violations.test.ts:117-145
  - ref: E22
    what: the set of codes the fixtures fire must equal BOUND_CODES, which has caught a bound arriving without a counterexample three times
    source: ursa-major/src/invariants.violations.test.ts:147-158
  - ref: E23
    what: a fixture's slug must be the longest declared code it starts with, optionally plus a qualifier naming which clause it breaks, and a slug naming no bound fails
    source: ursa-major/src/invariants.violations.test.ts:160-178
  - ref: E24
    what: the companion lists for the fixtures that fire more than one bound, and the count of single-bound fixtures, asserted so that a bound becoming independently reachable fails the suite
    source: ursa-major/src/invariants.violations.test.ts:180-211
  - ref: E25
    what: the directory is read through the two surfaces that read records, runGate off disk with the violation total, and gateRecords, the shared edge both launches run
    source: ursa-major/src/invariants.violations.test.ts:214-256
  - ref: E26
    what: what gateRecords says when a bound fails, that the records are written and are still the evidence and the run is not reporting success
    source: ursa-major/src/launch.ts:156-167
  - ref: E27
    what: why the gate is a command line tool and not only a test, the records worth checking hardest hold verbatim prompts and stay on the user's machine
    source: ursa-major/src/invariants.cli.ts:1-16
  - ref: E28
    what: the directory's own instructions for adding the next counterexample, and that the suite reads only committed files and never imports the generator
    source: ursa-major/fixtures/violations/README.md:187-211
  - ref: E29
    what: that same directory README still says seventeen bounds, twenty-two counterexamples and 27 violations in its heading, its opening and its command block
    source: ursa-major/fixtures/violations/README.md:1-11,201
  - ref: E30
    what: the first-difference window a CLAIM_NOT_WIDER message carries, and why it is there, because naming the reflow on sight is what makes the message actionable
    source: ursa-major/src/invariants.ts:414-433,498-502
  - ref: E31
    what: why the counterexamples are committed files rather than more in-memory cases, the two weaknesses of a containment assertion over a mutated record, and that the equality assertion is what turned up the bounds that cannot be violated alone
    source: ursa-major/src/invariants.violations.test.ts:1-21
  - ref: E32
    what: the two measurable costs of a repository where no record violates any bound, that the gate's wiring could only be tested by removing the gate, measured by deleting the call and watching eight tests stay green
    source: ursa-major/fixtures/violations/README.md:9-33
supersedes: []
---

# Adding a bound to the record gate

## When this fires

Something is about to change the set of rules every outcome record is
checked against. That is the situation, and it has four usual shapes:
a rule is being added to `ursa-major/src/invariants.ts`, an existing
bound's statement is being reworded, a committed counterexample under
`ursa-major/fixtures/violations/` is being added or edited, or a run
has printed a violation and the question is whether the bound or the
resolver is the thing that is wrong.

It fires hardest on the rewording case, which looks like editing a
string and is not: a bound's statement text is inside the bounds
digest, so changing a word changes what every record built afterwards
says it was checked against [E9].

It does not fire for choosing a span's label, for deciding what a
record statistic may be said to mean, for running a trial, or for
distilling tuning axioms. Those four skills work on
`outcome_record.json` and `tuning.json`. This one works on the gate
itself, the code and the fixtures, which is why it sits across a
handoff from all four rather than beside any of them
(`prompts/skill-extract.md` §5e).

What it serves is the only auditability claim Ursa Minor makes on its
own behalf. The gate exists because `ursa run` once printed "239,976
chars survived your editing verbatim" above "239,841 chars were
generated to get there", in all six records of that run, while 344
tests passed, because nothing in the codebase compared one number in
a record against another number in the same record [E1].

## The procedure

### 1. Decide whether it is a bound at all

Two rules, and both come from the original defect [E2].

**A bound compares numbers measured over the same set of
characters.** The impossible figure was not a wrong number. It was a
comparison between a final-file character count and a
generation-segment character count, which are two different sets of
characters, so no arithmetic could have been expected to hold between
them [E2].

**Anything that can be legitimately false is a measurement.** The
obvious candidate rule, verbatim characters never exceed generated
characters, is false on a correct record: a generated sentence reused
in two final files is counted twice on the final side, so the final
total legitimately exceeds every generation-side total [E2, E3].
Numbers like that go in `Measurement`, which the gate reports and
never fails on [E3].

Output of this step: either a sentence of the form "X <= Y over the
same characters", or an entry in `Measurement` and no bound at all.

**Ours:** the second rule is the one that is tempting to bend, because
a rule that is false on one legitimate record still fires on many
broken ones, and a gate that is right 95 percent of the time is worse
here than no gate. A buyer who learns that a refusal can be spurious
has to re-check every refusal, and then the gate's output is advisory
rather than a fact about the record.

### 2. Write the statement before the check

The statement lives in `BOUNDS`, keyed by the code [E6], and it is
not a comment. Every violation the gate emits carries it verbatim
[E10], and it is stated so the message reads without this file open
[E5]. So write it as prose a reader can hold a record against, and
include the clauses that are deliberately not checked: three of the
existing bounds say in their own statement that absence is legal, and
a reader who does not know that reads a silent pass as a check.

Then add the code to the `InvariantCode` union [E4]. The code is the
grep handle, so it is the part that must not be reworded later.

### 3. Write the check, and make the message carry both sides

The check pushes through one helper that stamps the statement into
the violation and prefixes the record id [E10]. The `observed` field
always includes both sides of the bound [E5], and the reason is
visible in the one case where it was hard: `CLAIM_NOT_WIDER` reports
the first offset where two strings diverge with a short window of
each, because "not the same characters" sends a reader back to the
record while `"e it, and"` against `"e it,\n  and"` names the reflow on
sight [E30].

### 4. Add the counterexample, and declare its codes in emission order

A case is a slug, the codes the gate must emit **and nothing besides**,
the edit in words a reviewer can check against the diff, and the
consequence, which is what a record in that state is claiming [E13].

The order of `codes` is load-bearing and it is the one mistake this
step invites. The generator compares its declared list against the
gate's emitted list by length and by position [E14], and the gate
emits in the order `checkRecord` reaches each check, not in the order
the bounds are declared. `final-spans-in-file.json` fires
`FINAL_SPANS_IN_FILE` then `CLAIM_NOT_WIDER`, because both are pushed
inside one walk over the final files in that order [E11], while
`CLAIM_NOT_WIDER` is the first entry of the union and
`FINAL_SPANS_IN_FILE` the eighth [E4].

**Ours, measured:** the file's own doc comment for `checkRecord` says
violations come out "in the order the invariants are declared above",
which is false [E12], and it has drifted a hundred lines from the
function it describes, sitting above `BOUND_COUNT` where a second doc
comment immediately supersedes it [E7]. Do not plan a case's `codes` from
that sentence. Ask the gate:

```bash
cd ursa-major && npx tsx -e "
import('./src/invariants').then(async m => {
  const fs = await import('node:fs')
  const r = JSON.parse(fs.readFileSync('fixtures/violations/final-spans-in-file.json','utf8'))
  console.log(m.checkRecord(r).map(v => v.code).join(', '))
})"
# FINAL_SPANS_IN_FILE, CLAIM_NOT_WIDER   (declared order is the reverse)
```

### 5. Make the bound non-vacuous on the base record

A bound that reads a structure the base record does not carry is
vacuously true on it, and then its own fixture proves nothing about
the clause it is named for. The base therefore carries six structures
a resolved chat record does not, each asserted individually in the
suite with a comment naming the bound that reads it [E19]. Three of
the six arrived with the bound that needed them: the fourth on
2026-10-13 and the fifth on 2026-10-15 [E19], the sixth on 2026-10-16
[E20].

Two of those structures are stamped by hand, in opposite ways, and
the pair is worth reading before adding a seventh [E17]:

- `task.resolvedBy` is **pinned** to a literal commit, because reading
  `HEAD` would make every fixture's bytes a function of the commit
  containing them, so the drift check would fail on every commit and
  the fixtures could never be diffed [E17].
- `task.gatedBy` is **read live** from `currentGateIdentity()`,
  because `GATE_IDENTIFIED`'s only clause with teeth fires on a record
  whose digest equals the checking build's, so a pinned digest would
  leave that clause unreachable on the one record that is supposed to
  exercise every bound non-vacuously [E17].

Output: the base still passes everything, which the generator checks
before writing any fixture and exits on, since no counterexample
below would prove anything otherwise [E15].

### 6. Regenerate, and let the notes be written for you

```bash
cd ursa-major
npm run fixtures:violations          # rewrite the directory
npm run fixtures:violations:check    # exit non-zero if any file drifted
npx vitest run src/invariants.violations.test.ts
npx tsx src/invariants.cli.ts fixtures/violations   # exit 1
```

Each `.md` note is generated from the case plus the gate's own
violations, so the `Expected codes:` line, the `where` and the
`observed` strings are the gate's own words rather than a paraphrase
[E16]. Do not hand-edit a note. The suite parses that line back out
and asserts equality on the whole code list [E18, E21], and asserts
every `observed` and `where` string still appears in the note
verbatim, so a fixture whose numbers move fails instead of leaving a
note that misleads the next reader [E21].

### 7. Update the counts a person wrote down

`BOUND_COUNT` and `BOUND_CODES` are derived from `BOUNDS`, so nothing
in the module needs a hand edit [E7, E8]. The hand-written numbers
are elsewhere, and this is the step that has been skipped before:
`BOUND_COUNT` exists at all because a README and three design
documents said "thirteen" for four days after the fifteenth bound
arrived, and the count is now shown to a user in the CI run comment
[E7].

As of 2026-10-18 the numbers a new bound moves are three in the suite,
23 fixtures [E21], 19 of them firing exactly one bound [E24], and 28
violations when the gate is run over the directory [E25], plus the
hand-written counts in the directory README and the root README.

**Ours, measured 2026-10-18; the spread below re-counted 2026-10-23
with grep, the gate figures not re-run:** the directory README is one
bound behind throughout, not in one spot. Three of the
stale spellings are in the range cited here, the heading's twenty-two
records, the opening's seventeen bounds, and the command block's
annotation of the gate run as 27 violations [E29], while the live gate
reports 18 bounds and 28 violations over 24 records. Those three are
the ref; the extent is a grep, because an absence-and-spread claim is
not something a line range can carry (`prompts/skill-extract.md` §5l):

```bash
grep -cE 'seventeen|twenty-two' ursa-major/fixtures/violations/README.md
# 8    lines 1, 5, 11, 42, 61, 87, 88 and 120, plus the count on 201
```

So nine lines rather than three, and one of them, line 87, is a second
derived number gone stale the same way: it says eighteen of the
twenty-two fixtures fire exactly one violation, against 19 of 23 live.
The commands:

```bash
cd ursa-major
npx tsx -e "import('./src/invariants').then(m => console.log(m.BOUND_COUNT, m.currentGateIdentity().boundsDigest))"
# 18 10a82f2bc5f1ae6f
npx tsx src/invariants.cli.ts fixtures/violations | tail -1
# 24 records checked, 28 violations.
```

The root README's own sentence is current, and it says why: the count
there is `BOUND_COUNT` rather than a word. A prose count that is not
derived is a count that will be wrong, so prefer deriving it; where
the prose has to be hand-written, fixing it is part of this step and
not a later tidy-up.

### 8. Read the gate's refusal as a reader would

Run the gate once on something that is not a fixture. It is a command
line tool rather than only a test because the records worth checking
hardest are made from real history on someone's own machine, hold
verbatim prompts, and stay local, so the gate has to be runnable where
the record is [E27].

When a bound fails inside a launch, the report says the records are
written and are still the evidence, and that the run is not reporting
success [E26]. A new bound inherits that sentence, so its statement
has to be one a person can act on after being told their run failed.

## Judgment

**A bound with several independent clauses needs one committed record
per clause.** The slug rule carries this: a fixture's name is the
longest declared code it starts with, optionally followed by a
qualifier naming which clause it breaks, which is how
`descent-checked-uniformly-verbatim` is spelled, after
`DESCENT_CHECKED_UNIFORMLY` gained a third clause on 2026-10-14 and a
strict one-fixture-per-code rule forbade a record for each failure
mode [E23]. That rule hid the difference between a bound's clauses,
which is the thing a reader most needs to see separately.

**A bound that cannot be broken on its own is still worth having, and
the fixture says so rather than the bound being weakened.** Two of the
eighteen are backstops, mathematically implied by their neighbours, so
no record breaks them in isolation. The suite asserts the exact
companion lists and the number of single-bound fixtures, so a future
edit that makes either one independently reachable fails and the note
claiming otherwise gets corrected [E24]. The discovery was a
by-product of asserting equality rather than containment on the code
list, which is the argument for that assertion [E31].

**Expect to find that your new bound fires on an old fixture.** Three
of the directory's four companion lists exist for that reason:
strengthening `CLAIM_NOT_WIDER` from a width comparison to a byte
comparison on 2026-10-13 made it fire alongside two fixtures aimed at
other bounds, and adding `EXCLUSION_NOT_CLASSIFIED`'s time clause made
that bound fire alongside a fixture aimed at the span-level bound over
the same clock [E24]. That is coverage rather than noise when the two failures
are genuinely different losses, and the companion list is where you
say which. It is a defect when the second code fires because the
bound is too broad, and the way to tell is the `consequence` field: if
you cannot write what the record is claiming that makes both codes
true at once, the bound is reading something it should not.

**Rewording a statement is a change to every record written
afterwards.** The digest covers each bound's code and statement text,
concatenated in code-alphabetical rather than declaration order so a
reorder is not reported as a rule change, and truncated to sixteen hex
characters [E9]. Alphabetical ordering is deliberate: the only reading
a consumer can make of the digest is "same rules or not" [E9]. The
case that earned the statement text being inside the hash is
`CLAIM_NOT_WIDER` on 2026-10-13, where the code did not move and the
check went from comparing two extents' lengths to comparing their
bytes [E9].

So the rewording loop is: reword, regenerate the fixtures, and expect
the base record's `gatedBy` assertion to fail first, with the command
to run in its own failure message [E20]. That assertion is the only
one in the suite that is not about committed bytes alone, and the cost
is accepted on purpose: the alternative is a directory claiming to
document a bound set it no longer matches [E20].

**Never delete a bound to make a fixture pass.** The whole directory
exists because, before it, nothing in the repository violated any
bound, and a healthy repository passes a self-check identically
whether the check runs or does not exist: deleting the gate's call from
the CI launch on 2026-10-10 left all eight launch-parity tests green
[E32]. The suite's strongest
line is that the set of codes the fixtures fire equals `BOUND_CODES`
[E22]. A bound with no counterexample fails it [E22]. The
opposite case, a counterexample left behind for a bound that was
deleted, passes that line and fails two others instead: its slug
resolves to no declared code [E23], and its note still expects a code
the gate no longer emits [E21].

**Ours:** the ordering of the two artifacts is the thing to keep. The
fixtures are the artifact and the generator is a convenience: the
suite reads only the committed `.json` and `.md` files and never
imports the script, so a fixture that stops firing is a failure
whether or not the script still runs [E28]. If the generator and the
committed files disagree, the committed files are what a reviewer
read, and the generator is what has to change.

## Limits

- **This skill is about the gate, not about what the gate should
  check.** Whether the resolver's labels are right is the adjudication
  skill's question, and whether a figure may be quoted is the quoting
  skill's. A bound can only ever catch a record contradicting itself.
  A record whose numbers are all consistent and whose labels are all
  wrong passes every bound, and the same stranded doc comment that is
  wrong about ordering is right about this: an empty violation list
  means the record's own arithmetic is self-consistent and does not
  mean the labels are right [E12].
- **It does not cover adding a `Measurement`.** Step 1 routes a
  proposed rule there and stops. The reporting side, which numbers a
  run prints and what a reader may conclude from them, is the quoting
  skill's.
- **The counts in step 7 are a date-stamped fact and not a rule.**
  They were 18, 23, 19 and 28 on 2026-10-18. Re-derive them with the
  commands given rather than trusting this sentence; that is the whole
  reason `BOUND_COUNT` is derived in the first place [E7].
- **The evidence here is this repository at one commit.** Every ref is
  a path and a line range, so a bound added after 2026-10-18 may have
  moved any of them. `node skills/check-evidence.mjs` is what says
  whether that has happened, and a green check means the lines have
  not moved rather than that the claims are still sound
  (`prompts/skill-extract.md` §5j).
