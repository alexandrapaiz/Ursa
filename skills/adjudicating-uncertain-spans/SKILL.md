---
name: adjudicating-uncertain-spans
description: >
  Use when a provenance resolver has produced an outcome record and some
  of its spans are flagged uncertain, and a human or agent has to decide
  span by span whether the flagged text descends from a model generation
  or from the person. Fires for adjudicating uncertain or low-confidence
  span labels, for building the ground-truth set that match thresholds
  are retuned against, and for judging whether a final span and a
  candidate generation are actually ancestor and descendant. Does not
  fire for producing a record in the first place, for labelling
  generations, or for reading a record's summary statistics.
version: 0.1.0
status: draft
validated: false
owner_seat: skill
created: 2026-09-24
revised: 2026-09-24
evidence_scheme: repo
evidence:
  - ref: E1
    what: the span classes and the generation fates the record uses
    source: ursa-major/src/types.ts:5-13
  - ref: E2
    what: the two thresholds, 0.35 and 0.6, and the combined score they apply to
    source: ursa-major/src/match.ts:6,8,50-56
  - ref: E3
    what: uncertain is set in exactly one place, and the losing candidate is kept on the span
    source: ursa-major/src/resolve.ts:159-167, ursa-major/src/types.ts:47-48
  - ref: E4
    what: trivial is a different flag with a different cause, set on short exact matches
    source: ursa-major/src/resolve.ts:112-123, ursa-major/src/match.ts:10, ursa-major/src/types.ts:50
  - ref: E5
    what: matching is deliberately lexical and deterministic so every label is explainable from the functions and the two thresholds
    source: ursa-major/src/match.ts:1-3
  - ref: E6
    what: no_generation_provenance is the most valuable category, meaning the model was never in the running
    source: CLAUDE.md, section 1, span classifications
  - ref: E7
    what: generated_deleted is the constitutive category, and 82.1 percent of generated characters in task-001 were deleted
    source: docs/beyond-preference-pairs.md:108-127
  - ref: E8
    what: instructions are trajectory and not ground truth, shown by two sincere contradictory instructions at steps 650 and 710
    source: docs/beyond-preference-pairs.md:36-47,208-224
  - ref: E9
    what: acceptance can be tacit, with loop C closing at steps 757 to 758 and acceptanceStatedInChat false
    source: docs/beyond-preference-pairs.md:95-107
  - ref: E10
    what: KR1.1 requires all 55 uncertain spans adjudicated, thresholds retuned to a false-positive rate of 10 percent or lower, and the adjudication file committed beside the record
    source: docs/okrs/2026-q4.md, O1 KR1.1
  - ref: E11
    what: a generation's fate is derived from claim overlap rather than adjudicated directly, and survivalRate follows from it
    source: ursa-major/src/resolve.ts:176-198
  - ref: E12
    what: raw records carry verbatim user prompts and absolute local paths, and were moved to a private repo for that reason
    source: ursa-major/trial/README.md, "Where the records live"; docs/agents/incidents.md, Incident 2
  - ref: E13
    what: session capture and git capture sit at different points of the funnel, 82 percent deletion against 7 percent
    source: docs/beyond-preference-pairs.md:225-242
  - ref: E14
    what: the methods document's own limits, n=1 demonstrates label types and not statistics
    source: docs/beyond-preference-pairs.md:154-170
  - ref: E15
    what: the viewer marks uncertain spans with a dashed underline and prints the count needing adjudication
    source: ursa-major/src/viewer.ts:77,188-189,201
supersedes: []
---

# Adjudicating uncertain spans

## When this fires

You have an `outcome_record.json` and its viewer, the record's
`stats.uncertainSpans` is greater than zero, and someone now has to
turn those flags into verdicts. That is the situation this skill is
for. It ends when every flagged span has a recorded verdict and a
reason, and the verdicts are in a file next to the record.

It does not fire for producing the record, for reading its summary,
or for labelling generations. Generation fates are derived rather than
adjudicated, so they move on their own once span verdicts change [E11].

## The procedure

**1. Open the record and the viewer together.** The viewer draws every
uncertain span with a dashed underline and prints how many need
adjudication, so it is the fastest way to see where they cluster [E15].
The JSON is what you will actually read from, because it carries the
candidate that the viewer only hints at. Output: the list of uncertain
spans with file path and character offsets.

**2. Know what the flag means before you judge it.** `uncertain` is set
in exactly one place. The resolver's fuzzy pass found a best match, the
combined score landed at or above 0.35 and below 0.6, and the span was
provisionally labelled `no_generation_provenance` with the losing
candidate retained on the span [E3, E2]. Two consequences follow.
Every uncertain span already has a specific candidate attached, so
adjudication is a binary call about that candidate rather than an open
search. And the provisional label is already the conservative one, so
a verdict of "no ancestor" changes nothing and a verdict of "ancestor"
changes the record. Output: nothing, but skipping this step is how
adjudication turns into free-form opinion.

**3. Judge each span against its candidate, in three verdicts.** Read
the span text and `span.candidate.text` side by side and decide.
`survived_mutated` means the candidate is the ancestor and the
difference between them is the user's correction. `no_generation_provenance`
means it is not the ancestor, whatever the score said. `unresolvable`
means you genuinely cannot tell, and it is a real verdict rather than
an admission, because the count of unresolvables is itself a reading
on the thresholds. Output: one verdict per span.

**4. Keep `trivial` out of this.** It is a different flag with a
different cause. A final segment that normalizes to fewer than 12
characters cannot claim verbatim by containment, so the resolver only
accepts an exact match against a whole generation segment and marks it
trivial, which the code itself calls weak evidence either way [E4].
Trivial spans are not in the uncertain band and do not belong in the
adjudicated set. Folding them in inflates the denominator and hides
whichever problem is real. Output: two separate counts.

**5. Write the verdicts to a file beside the record.** KR1.1 requires
the adjudication committed next to the record it adjudicates [E10].
One row per span carrying the file path, the character offsets, the
candidate's score, the verdict, and one line of reasoning. The
reasoning line is not decoration. It is what makes a retuning
defensible later, and it is what a second adjudicator needs in order
to disagree with you specifically rather than generally.

**6. Only now compute the false-positive rate, and only then touch a
threshold.** The target is 10 percent or lower on the adjudicated set
[E10]. A false positive is a span the resolver would call
`survived_mutated` that adjudication says has no generation ancestor,
because that is the error that credits a model with text it did not
produce. Moving `THETA_HIGH` or `THETA_LOW` relabels every span in the
affected band and not only the ones you looked at [E2], so re-run the
resolver and re-count rather than editing the record by hand. Output:
a rate, a proposed threshold pair, and the re-run numbers.

**7. Redact before anything leaves the machine.** Spans quote the final
work, candidates quote model generations, and source pointers carry
local paths. Records were moved to a private repository for exactly
this reason [E12]. An adjudication file inherits every one of those
problems, because its whole content is quoted text.

## Judgment

**The two errors are not symmetric, so do not treat them as one rate.**
`no_generation_provenance` is the most valuable category in the whole
artifact, since it marks work the model was never in the running for
[E6]. Calling a human span model-descended therefore does two kinds of
damage at once. It credits a model with text it did not write, and it
destroys an instance of the label that is hardest to get anywhere else.

Ours: when genuinely torn, adjudicate toward `no_generation_provenance`
and record the tie in the reasoning line. The conservative direction is
also the commercially valuable one here, which is unusual and worth
using while it lasts.

**Ask whether the shared tokens are the idea or the vocabulary.** The
matcher is lexical and deterministic by design, with no embeddings and
no model judging similarity, so that every label is explainable from
the functions and the two thresholds alone [E5]. The price of that
choice is that it has no notion of independent invention. A span and a
candidate can both score near 0.5 because there are only so many ways
to write a common line.

Ours: the working test is whether the overlap carries the idea or only
the words. Same idea with the words reordered is descent. Same words
around a different idea is coincidence, however high the score climbs.

**Do not let the chat decide it.** Instructions are a feature of the
trajectory and never ground truth, and the canonical demonstration is
two sincere instructions an hour apart that contradict each other at
steps 650 and 710 [E8]. A user writing "keep what you wrote" is not
evidence that a particular span descends from a particular generation.
The span and the candidate are the evidence. The chat is context.

**Silence is not rejection.** Acceptance is often tacit. Loop C in the
first trial closed at steps 757 to 758 with no verbal approval at all,
and the record declares `acceptanceStatedInChat: false` [E9]. An
adjudicator who reaches for "the user never said they liked it" is
using the weakest signal in the record.

**Read the uncertain rate against the stage of the funnel first.** The
two capture paths sit at different points and produce very different
numbers, with session capture showing 82 percent deletion and git
capture 7 percent on the second trial [E13]. A record with many
uncertain spans may be measuring churn rather than revealing broken
thresholds, and retuning against the wrong stage bakes that confusion
into the constants.

**Prefer moving a threshold over adding a special case.** The whole
point of the two constants is that any label can be explained from
them and the matching functions [E5]. A special case may fit the
adjudicated set better, but it cannot be explained to a buyer auditing
a label in one sentence, and that one sentence is the property the
record is sold on.

## Limits

- This covers the uncertain band only, meaning best matches scoring in
  [0.35, 0.6) [E2, E3]. A true ancestor that the fuzzy pass never
  surfaced as a candidate appears as `no_generation_provenance` with no
  candidate at all, and nothing in this procedure will find it. That is
  a recall problem in the matcher, not an adjudication problem.
- Generation-side fates and `survivalRate` are derived from claim
  overlap rather than judged here [E11]. They move when span verdicts
  move, which means the survival numbers in a record should be read as
  provisional until adjudication is done.
- The evidence base behind the judgment section is one trial and part
  of a second. The methods document says so about itself, that n=1
  demonstrates label types and not statistics [E14]. Treat every
  numeric anchor above as an existence proof.
- The record these procedures were written against is not in this
  repository [E12], so the steps are written to run wherever the record
  lives rather than against a fixed path here.
