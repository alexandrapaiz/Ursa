---
name: auditing-a-durability-walk
description: >
  Use when a record's `durability` block or a span's `lifespan` has
  already been produced and someone has to decide what the forward walk
  actually established: whether a span the record called survived was
  still there afterwards, and for how long. Fires for reading
  `decayRate`, `baselineDecayRate`, `medianIntactSeconds`, `fate`,
  `liveAtTip`, `diedAtSha`, `intactSeconds`, `durableChars` or
  `testedSpans` as what the walk computes rather than what the field is
  called, for deciding whether a `null` rate means nothing decayed or
  nothing was measured, for working out why a span the user plainly
  deleted appears in no decay number, for judging whether two records'
  decay numbers were walked to comparable tips, for checking whether a
  rename or the revision cap sits under a durability verdict, and for
  deciding whether a record is ready to carry a survival claim at all.
  Does not fire for choosing which finished work to resolve or running
  the trial that produces the record, for settling the class the
  resolver could not decide on an individual span, for writing a record
  statistic into a document a reader will trust or deciding whether two
  records' numbers may be added, for reading the trajectory entries in
  `signals`, for turning a record into axioms about the user, for
  adding or changing a rule in the record gate, or for deciding what
  may leave the machine.
version: 0.1.0
status: draft
validated: false
owner_seat: skill
created: 2026-10-26
revised: 2026-10-26
evidence_scheme: repo
evidence:
  - ref: E1
    what: a span's class is a verdict taken at one instant, and the walk exists to separate the two failure modes that look identical there
    source: ursa-major/src/lifespan.ts:1-30
  - ref: E2
    what: the product document's own statement of the time dimension, which this module answers
    source: CLAUDE.md:79
  - ref: E3
    what: the per-file revision cap, 50, declared a cost control rather than a judgement
    source: ursa-major/src/lifespan.ts:38-44
  - ref: E4
    what: the minimum traceable unit length, 24 normalized characters, and why presence below it carries no evidence
    source: ursa-major/src/lifespan.ts:46-54
  - ref: E5
    what: the walk's range is closingSha..HEAD on the current branch, and a closing commit that is not an ancestor of HEAD yields an empty range and an untested verdict
    source: ursa-major/src/lifespan.ts:210-216
  - ref: E6
    what: renames are resolved explicitly rather than with --follow, and the measured cost of the walk reading a rename as death
    source: ursa-major/src/lifespan.ts:218-253
  - ref: E7
    what: the presence test's two tiers, and its named cost, that scattered tokens read as present so the decay rate is a floor
    source: ursa-major/src/lifespan.ts:316-343
  - ref: E8
    what: a span is decomposed into sentences or lines with the same segmenter resolve() used, because a whole file often arrives as one span
    source: ursa-major/src/lifespan.ts:345-359
  - ref: E9
    what: units under the length floor are filtered out before the walk, and a span left with none is untested with skipped 'too-short'
    source: ursa-major/src/lifespan.ts:392-414
  - ref: E10
    what: intactRevisions and intactSeconds advance only in revisions where every unit of the span was still present
    source: ursa-major/src/lifespan.ts:450-458
  - ref: E11
    what: fate is assigned from how many units were lost, and diedAtSha is the earliest loss in the order the revision list came back in
    source: ursa-major/src/lifespan.ts:461-478
  - ref: E12
    what: durableChars and decayedChars accumulate over every tested surviving span whatever its fate, and medianIntactSeconds is built only from spans that lost something
    source: ursa-major/src/lifespan.ts:545-557
  - ref: E13
    what: the baseline is the same arithmetic over no_generation_provenance spans, which is the repository's own churn
    source: ursa-major/src/lifespan.ts:558-564
  - ref: E14
    what: both rates are null rather than zero when nothing was testable, and both rename roll-ups are absent rather than zero
    source: ursa-major/src/lifespan.ts:578-600
  - ref: E15
    what: the four fates and the two reasons for untested, as the record's own type declares them
    source: ursa-major/src/types.ts:342-354
  - ref: E16
    what: decayRate's field documentation, what it is a share of, why it is null, and that it is a conservative floor
    source: ursa-major/src/types.ts:389-397
  - ref: E17
    what: baselineDecayRate and medianIntactSeconds as the type declares them
    source: ursa-major/src/types.ts:398-405
  - ref: E18
    what: the two rename roll-ups and which question each one answers
    source: ursa-major/src/types.ts:406-436
  - ref: E19
    what: a lifespan is absent on a record resolved without git history
    source: ursa-major/src/types.ts:565-566
  - ref: E20
    what: the walk runs on the launch path only, after the record survives the size drop and before signals are derived
    source: ursa-major/src/bin/ursa.ts:648-654
  - ref: E21
    what: the one durability sentence the CLI prints, pooled across every record of the run by characters
    source: ursa-major/src/bin/ursa.ts:377-388
  - ref: E22
    what: logOnePath pairs --reverse with --max-count on the forward walk's own git log
    source: ursa-major/src/lifespan.ts:163-185
  - ref: E23
    what: firstVanish's own doc comment, warning that --reverse is applied after selection
    source: ursa-major/src/lifespan.ts:106-110
  - ref: E24
    what: the design doc's statement of the same git log, described as oldest first and capped
    source: docs/design/span-lifespan.md:429-436
  - ref: E25
    what: the design doc's measurement against Ursa's own repository, where all five records came back testedSpans 0 and decayRate null, and why
    source: docs/design/span-lifespan.md:517-543
  - ref: E26
    what: the design doc's own list of what the walk does not do, including intactSeconds being coarse on fast histories
    source: docs/design/span-lifespan.md:561-581
  - ref: E27
    what: median returns null on an empty list, which is what makes medianIntactSeconds null rather than zero when no span lost anything
    source: ursa-major/src/lifespan.ts:495-500
supersedes: []
---

# Auditing a durability walk

## When this fires

A record has been produced on the git path and carries a `durability`
block, or you are holding one span's `lifespan`, and somebody has to
decide what the walk behind it established.

The work this skill does is upstream of quoting. The number has already
been computed; the question is whether the walk that computed it ran,
over which window, against which tip, and whether each field means what
its name says. Once you are satisfied that it does, writing the number
into something a reader will trust is
`quoting-a-number-from-an-outcome-record`'s job and not this one.

Three facts set the boundary of the whole area.

The durability block is **not a function of the episode**. Every other
block in an outcome record is computed from the finished work and the
generations behind it, so it is settled when the episode closes. This
one is computed from the commits that came *after* the closing commit,
along whatever branch is checked out, up to whatever HEAD happens to be
[E1, E5]. It is the only part of the record that can give a different
answer tomorrow with nothing about the episode having changed.

It exists to separate two things a span class cannot tell apart. A span
labelled `survived_verbatim` at the closing commit may have been kept
and shipped, or kept and then removed by the real work three commits
later. Both read as a positive in the record, and the second is a false
positive [E1]. That separation is what `CLAUDE.md` means by the time
dimension [E2].

It is absent on records with no git history behind them [E19], and it is
written only by the launch path [E20].

## The procedure

**1. Establish that the walk ran at all, before reading any number.**

Read `durability.testedSpans` first. The three rates are `null` rather
than `0` when nothing was testable, and the type says plainly why:
"nothing decayed" and "nothing was measured" are different claims and
only one of them is sellable [E14, E16].

A `null` is the common case rather than the exception, and the design
doc measured it on this very repository: all five records resolved out
of Ursa's own history came back `testedSpans: 0` and `decayRate: null`,
because in all five the closing commit was already the tip [E25].

Output: either a reason to stop, or a confirmed `testedSpans > 0`.

**2. Read `closingSha` and `tipSha` as a pair, and record the window.**

`tipSha` is HEAD at the moment the walk ran [E5]. Two numbers walked to
different tips are two different measurements, and the record is honest
about which because it stores both.

Ours, measured: the same record and the same `closingSha`, annotated
twice with one commit in between, returned `decayRate` 0 with
`fate: durable` and then `decayRate` 1 with `fate: decayed`. Probe 4 in:

```
cd ursa-major && npx tsx ../skills/auditing-a-durability-walk/probe-lifespan.ts
```

Output: the window this record's numbers are about, written down beside
them.

**3. Check whether the revision cap bound.**

Compare `durability.maxRevisionsWalked` against the number of revisions
the files actually had after the closing commit. The cap is 50 per file
and is declared a cost control [E3].

If it bound, the per-span timing fields are not trustworthy. See the
first entry under Limits, which is a defect rather than a caveat.

Output: bound or did not bind, and if it bound, which fields you are
now refusing to read.

**4. Separate the span counts from the character counts, because they
are not the same partition.**

`durableSpans + erodedSpans + decayedSpans` equals `testedSpans`, and
those three are a partition of the spans. `durableChars` is *not* the
characters of the `durableSpans`. It accumulates `survivingChars` over
every tested surviving span whatever its fate, so an `eroded` span —
some units kept, some lost — contributes to `durableChars` and to
`decayedChars` both, while counting zero toward `durableSpans` [E12].

Ours, measured: one span of two sentences with the second deleted
reports `durableSpans: 0` and `durableChars: 89` in the same block.
Probe 1 in the command above.

Output: a statement of which of the two partitions each number you
intend to use belongs to.

**5. Read `decayRate` as a floor, never as a point estimate.**

The presence test has two tiers, verbatim substring and then token
containment at `THETA_HIGH`. The second tier's cost is named in the
source: a span whose tokens were scattered into unrelated sentences
reads as present, which inflates survival, so the rate can only
under-report decay [E7, E16].

Output: the rate, stated as "at least this much decayed".

**6. Put the baseline beside it or do not report it.**

`baselineDecayRate` is the same arithmetic over `no_generation_provenance`
spans, which is text the user wrote themselves. It is the repository's
own churn, and agent text decaying at the baseline is not decaying
because it was agent text [E13, E17].

The baseline is itself `null` whenever the record has no
`no_generation_provenance` span with a traceable unit [E14]. A `null`
baseline does not license reading `decayRate` alone. It means the
control is missing.

Output: the pair, or an explicit note that there is no control.

**7. Resolve every `untested` span before treating the rate as
covering the record.**

An untested span is skipped by the record totals entirely [E12], so it
is neither in the numerator nor in the denominator. `skipped` says which
of the two reasons applies [E15]:

- `no-later-revisions` — there was nothing after the closing commit to
  test against. Honest, and usually the whole record at once.
- `too-short` — every unit of the span normalized to under 24
  characters and was filtered out before the walk began [E4, E9].

Ours, measured: a ten-character span deleted by the very next commit
reports `fate: untested`, `skipped: too-short`, `testedSpans: 0` and
`decayRate: null`. The walk watched the deletion happen and the rate
does not contain it. Probe 3 in the command above.

Output: the count of untested spans and the reason split, reported
alongside the rate rather than under it.

**8. Check whether a rename sits under the verdict.**

`spanRenameCrossings` and `distinctRenamesFollowed` are both absent
rather than zero when the walk crossed none, so that a record written
before the walk could follow a rename stays distinguishable from one
whose files never moved [E14, E18].

When they are present, `distinctRenamesFollowed` is the one to quote. It
counts each rename once, keyed on the commit and the path pair, and it
is the number that says how much path movement the rate was taken across
[E18]. `spanRenameCrossings` is the per-span sum and will multiply one
move by the number of spans in the file that moved [E18].

Output: which of the two you used, and why.

**9. Read `fate` per span, not `liveAtTip`.**

`fate` is three-valued on a tested span and distinguishes a span that
lost everything from one that lost part of itself [E11, E15].
`liveAtTip` is true whenever at least one unit survived, so it is true
for `eroded` as well as `durable` and answers a strictly weaker question
[E15].

Output: the `durable` / `eroded` / `decayed` split, which is the
three-way reading the block supports.

## Judgment

**A `decayRate` with no window attached is not a finding, it is a
timestamp you did not write down.** Every other number in an outcome
record can be re-derived from the record. This one can only be
re-derived from the record plus a repository at a particular commit
[E1, E5]. So the unit of reporting is the triple, rate with `closingSha`
and `tipSha`, and a rate quoted without them cannot be checked by
anybody, including the person who computed it.

Ours: this is the single most likely way a durability number gets
misused, because the field looks exactly like the record's other rates
and sits in the same JSON. The other rates are properties of a finished
thing. This one is a property of a measurement.

**A low `decayRate` is weak evidence and a high one is strong
evidence, and the asymmetry is built in.** The presence test can only
over-report survival [E7, E16]. So `decayRate: 0.6` means at least sixty
per cent was overturned, which is a real finding, while `decayRate: 0.0`
means the walk found nothing it could call gone, which is consistent
with real durability and equally consistent with text whose tokens were
dispersed into the surrounding prose.

Ours: when the conclusion you want is "the model's output lasted", the
instrument is pointing the wrong way for you, and the honest move is to
say the measurement cannot support that direction rather than to report
the zero.

**`medianIntactSeconds` is conditioned on death.** It is a median over
the spans that lost something, because only those spans contribute a
lifetime [E12, E17]. It therefore answers "when the work removes agent
text, how long does that take", and not "how long does agent text
typically last". A record whose spans were all durable contributes no
lifetime at all [E12], and the median of an empty list is `null` rather
than zero [E27], so the field is `null` there and not a large number.

Ours: the field reads as a survival time and is a time-to-death among
the dead. Both are useful and they are not interchangeable, and the one
a lab will assume from the name is the one the field does not hold.

**`intactSeconds` is a lower bound quantized to commits.** It is set to
the distance from the closing commit to the newest revision in which
every unit was still present [E10], so it can only land on a commit
timestamp. The design doc names the consequence on machine-paced
histories: commits in the same second give zero, which is truthful and
uninformative, and the revision count is the better ordinal there [E26].

Ours: prefer `intactRevisions` whenever the history was written by an
agent rather than a person. Seconds are the right unit for human work
and the wrong one for a loop that commits four times a minute.

**`basis` is one value for a whole span and the last writer wins.** It
records how presence was last judged [E15], and a span is many units.

Ours, measured: a span with one surviving sentence and one deleted
sentence reports `basis: verbatim`, which is true of the sentence that
lived and says nothing about the one that died. Probe 1 in the command
under step 2. So read `basis` as a property of the span's survivors, and
do not read `basis: verbatim` as "this span was untouched" when `fate`
is `eroded`.

**Trust the unit, distrust the span.** The walk decomposes a span into
sentences or lines before tracing it, with the same segmenter the
resolver used, precisely because a two-thousand-character span can lose
a third of itself and still pass a presence test [E8]. That design
decision is why `eroded` exists as a fate, and it is also why
`unitsTraced` and `unitsSurviving` are the honest numerator and
denominator for a single span, while the characters are an
apportionment [E8, E11].

**When the record and the repository disagree, the repository is not
necessarily right either.** A span can read as decayed because the file
was moved rather than because the text was removed, and the walk had
that defect until 2026-10-24: it reported `decayedChars` 338 and
`decayRate` 1 over a file whose text `git show HEAD:moved.md` would
print in full [E6]. That is fixed. Renames are now resolved explicitly,
with `firstVanish` and `renameTarget`, and recorded on the record so a
reviewer can see one was crossed [E6, E18]. The direction of the fix is
worth holding: following the rename does not assert the content
continued, it only sends the presence test to the right place, so a
commit that both moved a file and gutted it still reports death, now for
the real reason [E6].

Ours: the reason to keep the incident rather than just the fix is that
it tells you what a durability verdict is sensitive to. It is sensitive
to where the walk looked, and only then to what the text did. Every
remaining limit below has that same shape.

## Limits

**The revision cap selects the newest revisions, not the oldest, and
the timing fields are wrong when it binds.** This is a defect and not a
caveat, and a reader of this skill should treat any record where the cap
bound as carrying no usable `diedAtSha`, `diedAt`, `intactRevisions` or
`intactSeconds`.

The forward walk's `git log` passes `--reverse` together with
`--max-count` [E22]. Git applies the count before the reversal, so the
command returns the N newest matching commits in oldest-first order
rather than the N oldest. The same file's `firstVanish` says so in its
own doc comment, which is why it does not use `--max-count` [E23].
`revisionsAfter` describes its result as "oldest first" [E5] and the
design doc repeats it [E24]; both describe a prefix and the code
delivers a suffix.

Ours, measured. Six revisions after the episode, with the span removed
by the first of them. At `maxRevisions` 50 the walk reports
`diedAt: "edit 1: A dies HERE"`, which is correct. At `maxRevisions` 3
the walk never examines that commit and reports `diedAt: "edit 4"`,
naming a commit that did not touch the text. Probe 2 in:

```
cd ursa-major && npx tsx ../skills/auditing-a-durability-walk/probe-lifespan.ts
```

Also measured, and worth stating so the defect is not overclaimed:
`fate` and `decayRate` came back `decayed` and 1 under both caps, so the
headline rate is robust to this. Presence is re-tested at every examined
revision including the last, and the last examined revision is the tip
when the cap binds. The casualty is the timing, which is the thing the
module was built for [E1, E2]. The cap is 50 per file [E3], so this only
bites a record whose files took more than fifty commits after the
episode closed, and it bites silently when it does.

**The walk is branch-dependent and this skill cannot tell you which
branch is right.** `closingSha..HEAD` asks what the work that actually
shipped did to the text, and a closing commit that is not an ancestor of
the current HEAD produces an empty range and an untested verdict rather
than a guess [E5]. Whether the checked-out branch is the one whose
judgment should count is a question about the project, and nothing in
the record answers it.

**It cannot distinguish deletion from relocation across files.** The
presence test asks whether a span's text is still in *this file* [E7].
Text moved from one file to another reads as decayed, and the
rename-following machinery only covers a whole file moving, not a
paragraph migrating [E6].

**It says nothing about whether the removal was a correction.** A
decayed span is evidence that later work overturned a kept verdict, and
the design doc names the obvious next move, which is for `signals.ts` to
treat a decayed span as evidence against tacit acceptance, and records
that it was deliberately left undone [E26]. Until that lands, whether a
decay was a correction is `auditing-a-detected-correction-loop`'s
question and the durability block does not feed it.

**The viewer does not render any of this** [E26], so a record's
durability block is read as JSON or not at all.

**Pooling across records is out of scope here.** The CLI prints one
pooled sentence over a whole run, summing characters across every record
before dividing [E21]. Whether that pooling is legitimate, and whether
two records' rates may be added or compared at all, is
`quoting-a-number-from-an-outcome-record`'s subject. This skill stops at
establishing what one record's walk measured.

**The evidence here is the code and its design doc, not a trial.** Every
claim above is anchored in `lifespan.ts`, `types.ts`, `bin/ursa.ts` or
`docs/design/span-lifespan.md`, plus four probes this skill ships and
runs. No published Ursa record carries a non-null `decayRate` to check
them against. The nearest thing to a field measurement is the design
doc's run over this repository, and that one produced five nulls for a
reason that is about `pairfinder.ts` rather than about this module
[E25]. So the procedure above is tested against the implementation and
not yet against a lab's reading of a real record.
