# Trigger test — auditing-a-durability-walk

Ten prompts, written against the `description` field in `SKILL.md`.
Three should activate the skill. Eight are near misses that should not.
Per `prompts/skill-extract.md` §5, when the test fails the description
is what changes and not the test.

The budget is eight near misses because §5c sets one per adjacent skill
and this skill has eight neighbours, which is every other skill in the
library. Each near miss below is that sibling's own trigger prompt,
copied rather than paraphrased, per §5r, and its prose names which
boundary it tests. Near miss 4 is
`quoting-a-number-from-an-outcome-record`'s trigger 1, 5 is
`adjudicating-uncertain-spans`' trigger 1, 6 is
`running-an-outcome-record-trial`'s trigger 1, 7 is
`auditing-a-detected-correction-loop`'s trigger 1, 8 is
`distilling-a-tuning-record`'s trigger 1, 9 is
`adding-a-bound-to-the-record-gate`'s trigger 1, and 10 is
`clearing-a-record-for-release`'s trigger 1.

§5e's artifact test is the awkward one here and is worth stating
honestly rather than claimed away. Five of the eight neighbours rule on
a block of `outcome_record.json`, and so does this skill: `durability` and
`spans[].lifespan` are blocks of that same file. So the artifact test
does **not** separate this skill from them, and by §5c's letter that is
the signal to suspect the cut.

The cut survives on a different distinction, which the boundary prose
in near misses 4, 5 and 6 names in each case. Every other block of an
outcome record is a function of the episode, so it is settled when the
episode closes. This one is a function of the commits that came after
the closing commit, up to whatever HEAD was when the walk ran, and it
can give a different answer tomorrow with nothing about the episode
having changed. The near-miss budget is one per neighbour regardless,
per §5r's amendment to §5e, and the three record-side boundaries are
the ones that actually needed writing down.

Some reasoning below cites an evidence ref, which §5p permits. A tag
here is fingerprinted and swept exactly like one in `SKILL.md`, so it
is used only where the argument about the description's edge rests on
what the code says.

## Should fire

**1. "This record says `decayRate: 0`. Can I put 'none of the model's
output was later removed' in the methods note?"**

Fires, and it is the prompt this skill exists for. It reaches the
description through reading `decayRate` as what the walk computes
rather than what the field is called. The answer is no, for two reasons
the prompt cannot see. The presence test can only over-report survival,
so the rate is a floor on decay and a zero is the one value it cannot
defend [E7, E16]. And a zero is not a null: the reader has to check
`testedSpans` first, because untested spans are skipped by the totals
entirely [E12], so a record can report a confident-looking zero over a
handful of the spans it holds.

A reader without this skill answers from the field name, which reads
like a measured rate, and ships the one sentence the instrument is
pointing the wrong way to support.

**2. "The durability block has `durableSpans: 0` and `durableChars:
1840`. One of those has to be a bug. Which?"**

Fires through reading `durableChars` as what the walk computes. Neither
is a bug, and the skill's step 4 is the answer: the span counts and the
character counts are not the same partition. `durableChars` accumulates
`survivingChars` over every tested surviving span whatever its fate, so
an `eroded` span contributes characters to it while counting zero
toward `durableSpans` [E12].

This is the near-certain misreading in the block, because the two
fields share a prefix and a reader reasonably assumes they are the same
cut of the same set. Probe 1 in `probe-lifespan.ts` reproduces exactly
this pair of numbers on a two-sentence span.

**3. "Two records, one from the site project and one from alexandria,
report `decayRate` 0.31 and 0.62. Is the second project really twice as
bad at keeping what the model wrote?"**

Fires through "judging whether two records' decay numbers were walked
to comparable tips". The skill's steps 2 and 3 are what the question
needs before any comparison is attempted: each rate is a property of
the record *and* of the tip it was walked to [E1, E5], so the first
thing to read is each block's `closingSha` and `tipSha` pair, and then
whether the revision cap bound on either.

Note the boundary this prompt sits on, because it is the sharpest one
in the library. Whether the two numbers may then be compared or
combined at all is `quoting-a-number-from-an-outcome-record`'s subject,
and a prompt that gets past the window check belongs there. This skill
answers the prior question, which is whether the two walks measured
comparable things in the first place. The index records that order.

## Should not fire

**4. "I'm re-grounding the methods doc for KR2.1. The draft says 82.1
percent of generated characters were deleted. Is that still the right
way to say it?"**

`quoting-a-number-from-an-outcome-record`'s trigger 1, copied. Tests the
boundary with the one neighbour this skill is most likely to steal
from, since both are about a percentage in a record and both ask what
it is allowed to mean.

Should not fire. The number here is a span-class share computed from
`stats` at the closing commit, and the question is how to phrase what
it is a share of in a document a reader will trust. Nothing in it turns
on the forward walk, on a tip, or on a `lifespan` field. The
description's exclusion list names "writing a record statistic into a
document a reader will trust" for exactly this prompt.

The honest statement of the edge: if the draft sentence had been about
`decayRate` rather than a deletion share, both skills would have a
claim on it, and the order in the index is what resolves that. This
skill establishes what the walk measured, then the quoting skill
decides what may be said about it.

**5. "The record for task-001 has 55 uncertain spans. Work through them
and decide which ones really came from a generation, then commit the
adjudication next to the record."**

`adjudicating-uncertain-spans`' trigger 1, copied. Tests the boundary
with the neighbour that also works per span on `files[].spans`.

Should not fire. `uncertain` is a verdict about descent, taken at the
closing commit, about whether a span came from a generation at all. A
lifespan is a verdict about what happened to a span *after* that
instant, and it presupposes the class the adjudication is still
deciding [E1]. The two blocks sit on the same spans and point in
opposite directions in time, which is the whole reason this boundary
needed writing down rather than resting on the artifact test.

**6. "We need a third trial for the corpus. Which repo should I point
`ursa run` at?"**

`running-an-outcome-record-trial`'s trigger 1, copied. Tests the
boundary with the skill that owns the run which produces the walk.

Should not fire. This is a choice about which finished work to resolve,
made before any record exists. The description excludes "choosing which
finished work to resolve or running the trial that produces the
record".

The near miss is genuinely close and gets closer the more you know,
which is why it is here. A durability-literate reader would want to
answer it partly on durability grounds, since a repository whose
episodes close at the tip yields nothing to walk, which is what
happened to all five records resolved out of Ursa's own history [E25].
That is a real consideration and it is still the trial skill's call;
this skill's contribution to it is a fact in the trial skill's hands,
not a reason to take the prompt.

**7. "The signals block says one loop with two recurrences, but I count
three places she complains about the constellation being dark. Which
one is right?"**

`auditing-a-detected-correction-loop`'s trigger 1, copied. Tests the
boundary with the only other skill in the library whose job is auditing
a derived block rather than a label.

Should not fire. The shape of the judgment is close enough to be
dangerous, since both skills read a computed block against the thing it
was computed from and both ask whether a field means what it is named.
The object is different: that one works on `signals`, derived from the
conversation trace, and this one works on `durability`, derived from
git history after the episode. The description excludes "reading the
trajectory entries in `signals`".

Worth saying where the two will eventually meet, so a later reader does
not mistake today's answer for a permanent one. The design doc records
that `signals.ts` treating a decayed span as evidence against tacit
acceptance is the obvious next move and was deliberately left undone
[E26]. If that lands, a prompt about a decayed span contradicting
`accepted_tacitly` sits on a real new edge and this near miss should be
re-read.

**8. "`ursa run` just produced four records for the site project.
Distill them into tuning.json so I can paste the block into ChatGPT."**

`distilling-a-tuning-record`'s trigger 1, copied. Tests the boundary
with the neighbour one handoff downstream.

Should not fire. The object is `tuning.json` and the work is turning
records into axioms about the user. The artifact test separates this
one cleanly, and the description excludes "turning a record into axioms
about the user".

**9. "Add a bound that a record's verbatim-survived character count
never exceeds its generated character count. It is obviously true and
the gate should catch it."**

`adding-a-bound-to-the-record-gate`'s trigger 1, copied. Tests the
boundary with the neighbour that works on the checker rather than the
record.

Should not fire, and it is a near miss rather than a stranger because
it is about character counts in a record and could plausibly be read as
a durability arithmetic question. It is not: the work is deciding
whether a proposed rule is a bound or a measurement and writing it into
`invariants.ts`. The description excludes "adding or changing a rule in
the record gate".

The live trap in the other direction is worth naming. Somebody will
propose a bound like "`durableChars` is zero when `durableSpans` is
zero", which is false [E12], and the gate skill is where that proposal
is judged. This skill is where the person judging it learns the
arithmetic.

**10. "The gate workflow is green on my record, so I'm pasting the
conversation into the design doc as the example payload. Any reason not
to?"**

`clearing-a-record-for-release`'s trigger 1, copied. Tests the boundary
with the neighbour that works on what leaves the machine.

Should not fire. The question is about a departure and about raw text,
and the description excludes "deciding what may leave the machine". No
field of the durability block is involved, and a green gate says
nothing about whether a walk ran.

## Ours: what this test does not prove

Fire-prompt 3 and near miss 4 are the same boundary read from its two
sides, and only one of them is written from the other skill's own
words. So this test establishes that the quoting skill's trigger does
not pull this description, and it does not establish the reverse. That
direction is owed in
`quoting-a-number-from-an-outcome-record/TRIGGER-TEST.md`, under §5r's
rule that the run landing a skill pays the debt in every existing
skill's file, and this run pays it there rather than claiming it here.

## Added 2026-10-26, thirtieth run: the ninth skill's boundary

The run that landed `attributing-a-deleted-span` owes a near miss to
every skill already in the library, in their own files, in the same
pull request (`prompts/skill-extract.md` §5r). This section is this
file's payment, and the prompt is the new sibling's own trigger 1,
copied rather than paraphrased.

**11. "This record's `humanDeletedChars` is 92 of 307 generated
characters. Before I call that a discard rate, did anything actually
check whether a merge took them?"**

`attributing-a-deleted-span`'s own trigger 1, and it should not fire
here.

These two skills are the only ones in the library whose block is
computed from git rather than from the record, and they fail in the
same shape, which is why this near miss is the one worth reading. A
`testedSpans: 0` here and a `mergeDeletedChars: 0` there are both zeros
that could be a result or an absence, and both are read off a field
whose name sounds measured. A reader who learned that shape in this
file will reach for this file again.

The division is which side of the closing commit the question is on,
and it is decidable from the prompt alone. This skill walks forward
from the closing commit to whatever HEAD was when the walk ran, over
text that survived the episode. The sibling tests backward, at merge
boundaries that sit inside the episode, over text that never reached
the finished file at all. Nothing with a `deletion` block is in the
final blob, so nothing it rules on can be walked forward, and nothing
this skill rules on has a cause to attribute.

## Added 2026-10-26, thirty-second run: the tenth skill's boundary

The run that landed `excluding-a-file-from-an-outcome-record` owes a
near miss to every skill already in the library, in their own files, in
the same pull request (`prompts/skill-extract.md` §5r). This section is
this file's payment, and the prompt is the new sibling's own trigger 1,
copied rather than paraphrased.

**12. "This record excludes `docs/standards/pm.md` as `imported_whole`,
relation `sibling`, dated 2026-10-09T19:00:00-06:00. The work was
generated 2026-10-10T00:00:00Z. Fine to cite the exclusion in the
methods note?"**

`excluding-a-file-from-an-outcome-record`'s own trigger 1, and it should
not fire here. The pull is that both skills order events against a clock
and both treat a timestamp as a claim that can be backwards, which is a
shape no other pair in this library shares.

They order different clocks across different intervals. This skill walks
forward from the episode's closing commit to whatever HEAD was when the
walk ran, and its ordering question is whether that window is the window
a figure is being quoted for. The sibling orders a single commit's
author date against `task.generatedAt`, which is a point *before* the
episode closed, and its question is whether a matching copy existed
early enough to be a source. So the two intervals meet at the closing
commit and do not overlap on either side of it.

The sharper reason this should not fire is that the sibling's prompt is
about a file that never entered this skill's population. A durability
walk follows text that survived the episode and is carried in the
record's `files[]`. An excluded path is not there, so no span of it has
a `lifespan` and no part of it is in `durableChars`. The sibling's
ruling happens one step upstream of everything this skill computes.

What a reader should take from the pair, and the direction of the error
is worth naming because it is the expensive one: an unrefused import
inflates durability for exactly the same reason it inflates survival.
The text sits in the finished tree, nobody touches it afterwards, and
the walk reports it as durable. That figure is still this skill's to
qualify, and the qualification it needs is the sibling's refusal having
been made first.
