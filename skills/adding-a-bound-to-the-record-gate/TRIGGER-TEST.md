# Trigger test — adding-a-bound-to-the-record-gate

Seven prompts, written against the `description` field in `SKILL.md`.
Three should activate the skill. Eight are near misses that should not.
Per `prompts/skill-extract.md` §5, when the test fails the description
is what changes, not the test. The reasoning below points at the
skill's own steps and limits rather than at evidence refs. When this
file was written that was forced: `check-evidence.mjs` and
`relevance-sweep.mjs` both read only `SKILL.md`, so an `[E…]` tag here
would have been a receipt nothing fingerprints. The tenth run fixed
that and §5p is the rule, so a tag in this file is now a receipt like
any other. It stays a choice rather than a defect, because a trigger
test argues about where the description's edge falls and not about
what the code says, and routing through a step keeps one claim in one
place instead of two.

The budget is eight near misses rather than two because §5c sets one
near miss per adjacent skill, and this skill has eight neighbours: every
other skill in the library. §5e is what says that is not a sign the cut
is wrong, and the note at the end is the argument.

Near miss 4 is `adjudicating-uncertain-spans`' own trigger, near miss 5
is `running-an-outcome-record-trial`'s, near miss 6 is
`quoting-a-number-from-an-outcome-record`'s, near miss 7 is
`distilling-a-tuning-record`'s, and near miss 8 is
`clearing-a-record-for-release`'s.

Near miss 8 was added on 2026-10-24, five days after the rest of this
file, by the run that first measured §5c coverage across the library
rather than within one test. `clearing-a-record-for-release` landed on
2026-10-23 and this file was not amended for it, which is the ordinary
case and not an unusual lapse: no trigger test in this library had ever
gained a near miss after the day it was written.
`skills/trigger-coverage.mjs` is what now says so out loud.

## Should fire

**1. "Add a bound that a record's verbatim-survived character count
never exceeds its generated character count. It is obviously true and
the gate should catch it."**

Reaches the description through "deciding whether a proposed rule is a
bound or a measurement", which is step 1, and the answer is no. The
rule is false on a correct record, because a generated sentence reused
in two final files is counted twice on the final side, so the final
total legitimately exceeds every generation-side total. It
belongs in `Measurement`, which the gate reports and never fails on.
Both halves are step 1 of `SKILL.md`.

This is the prompt the skill exists for most, because the proposal
arrives already believed. A reader who is not routed through step 1
writes a plausible check, it passes on today's records, and the first
record with reuse in it gets refused for being correct.

**2. "`DESCENT_CHECKED_UNIFORMLY`'s statement is three clauses long and
reads badly in the CI comment. Tighten it to one sentence."**

Reaches the description through "writing a bound's statement text" and
through "any edit that moves the bound count or the bounds digest".
This is the case the skill says it fires hardest on, because it looks
like editing a string and is not: the statement text is inside the
bounds digest, so changing a word changes what every record built
afterwards says it was checked against.

It should fire even though the user asked for a wording change and not
for advice, because the first thing that happens is the base record's
`gatedBy` assertion failing, with the command to run in its own failure
message, and because three of the existing statements say in
their own words that absence is legal, so a tightening pass is exactly
how a reader would delete that and leave a silent pass looking like a
check.

**3. "`ursa run` over my own repo exited 1 with `CLAIM_NOT_WIDER` on
two of six records. Is the resolver broken?"**

Reaches the description through "reading a gate violation a run printed
and deciding whether the bound or the resolver is wrong". The prompt
names neither bound nor gate nor fixture; it reads as a bug report
against the resolver, and routing it there is the expensive mistake,
because `CLAIM_NOT_WIDER` is a byte comparison and its message carries
the first offset where the two strings diverge with a short window of
each. The window usually settles it on sight: `"e it, and"`
against `"e it,\n  and"` is a reflow, which is the resolver's extent
arithmetic, while two unrelated strings mean the claim is pointing at
the wrong generation.

It also fires on the sentence the report already gave the user, that
the records are written and are still the evidence and the run is not
reporting success, which is what makes "is it broken" answerable
without rerunning anything.

## Should not fire

**4. "This record has 55 uncertain spans. Work through them and decide
which ones really came from a generation."**

`adjudicating-uncertain-spans`' own trigger. Close because two of the
eighteen bounds are about the descent check itself,
`DESCENT_CHECKED_UNIFORMLY` and `RIVAL_NOT_AFTER_FINAL`, so the gate
and the adjudication skill share the words descent, rival, uncertain
and span.

The line is in the description's last sentence, which excludes choosing
a span's label, and the reason is the first Limit: a bound can only
catch a record contradicting itself, so a record whose numbers are all
consistent and whose labels are all wrong passes every one of them.
There is no bound to add here and nothing in this skill that
decides a label.

**5. "We need a third trial for the corpus. Which repo should I point
`ursa run` at?"**

`running-an-outcome-record-trial`'s own trigger. Close because step 8
of this skill tells a reader to run the gate over something that is not
a fixture, and because the gate runs inside the launch this prompt is
about: `gateRecords` is the shared edge both launches run.

The line is the artifact. The trial skill chooses an input to the
resolver; this skill changes the checker the resolver's output is held
against. Nothing in the choice of repo moves a bound, a fixture, the
bound count or the digest, which is the list the description gives.

**6. "Trial three is a prose record and trial two was a repo. Can I put
their no-provenance shares in the same table?"**

`quoting-a-number-from-an-outcome-record`'s own trigger, and the most
expensive of the four, because the vocabulary is not merely adjacent,
it is identical: `PCT_DENOMINATORS_ORDERED` and `RATES_MATCH_FIELDS`
are bounds whose whole subject is percentages, rates and denominators.
A reader handed this skill would go looking for a bound to add, and the
question would stay unanswered.

The line is step 1's first rule, and it excludes the prompt by
construction. A bound compares numbers measured over the same set of
characters, and two records are two sets of characters, so no
bound can see across them at all. Whether two records' numbers may sit
in one table is therefore not a gate question even in principle, which
is a sharper boundary than a wording preference.

**7. "`ursa run` just produced four records for the site project.
Distill them into tuning.json so I can paste the block into ChatGPT."**

`distilling-a-tuning-record`'s own trigger. Close because the gate ran
over exactly those four records seconds earlier, inside the same
launch, and `gateRecords` is what decided they were reportable at all.

The line is the artifact again, one step further out. `tuning.json` is
not read by `invariants.ts` and no bound in `BOUNDS` mentions it, so
there is nothing in the gate to consult, change or blame. The related
prompt that *would* fire is "should the gate check tuning.json too",
because that is a bound-scope question and step 1 is where it gets
answered.

**8. "The gate workflow is green on my record, so I'm pasting the
conversation into the design doc as the example payload. Any reason not
to?"**

`clearing-a-record-for-release`'s own trigger, and the sharpest near
miss in this file, because it is the only one that reaches for this
skill by name rather than by vocabulary. The user has read a green gate
and is treating it as a warrant. Everything before the comma is this
skill's own subject matter, correctly described.

The line is that a bound can only catch a record contradicting itself,
which is step 1's test, so the gate's verdict is about internal
consistency and carries no claim about who may read the record. Nothing
in `BOUNDS` mentions a reader, a destination or raw text, and no bound
could: the gate sees one record's own numbers and a design document is
not in them. So a green gate is not evidence for the thing the user is
inferring from it, and the prompt belongs to the skill that owns the
three exits.

What makes it a near miss rather than an unrelated prompt is that the
honest answer has to come back through this skill once, to say that the
gate's silence here is a property of what a bound is and not an
oversight someone could fix by adding one. The related prompt that
*would* fire is "add a bound that blocks a record with raw text in it",
because that is a bound-scope question and step 1 answers it: it would
be a measurement about a destination rather than a record contradicting
itself, which is exactly the distinction step 1 exists for.

## Note on the boundary, which is one edge and not five

§5c warns that a skill with three or more neighbours is probably
describing a topic rather than a piece of work. This skill has five and
should not be re-cut, for the reason §5e gives: count artifacts, not
neighbours.

Seven of the eight neighbours work on two artifacts,
`outcome_record.json` and `tuning.json`, and both of those are data a
run produced. This skill works on `ursa-major/src/invariants.ts` and
the committed records under `ursa-major/fixtures/violations/`, which
are the checker and its counterexamples. So those seven boundaries are
the same boundary counted four times, between the records and the
thing that checks them, and each of those near misses fails by sitting
on the records side of it.

The fifth, near miss 8, fails on a different axis and is worth keeping
separate rather than folded into the count.
`clearing-a-record-for-release` does not work on an artifact at all; it
works on a boundary. So that pair is not records-against-checker but
checker-against-destination, and the two skills do not share an object
to be confused about. They are adjacent anyway, and the reason is the
inference in near miss 8: the gate is the most natural thing in the
system to mistake for a release clearance, because it is the one step
that already says yes or no about a record. Being the system's loudest
green light is itself an adjacency.

Ours: the edge is also where the near misses get hardest, which is why
the budget being five is a feature here rather than a cost. Near miss 6
shares every noun this skill's own bounds are written in and is still
excluded by one sentence of step 1, and near miss 8 shares none of them
and is excluded by the same sentence. Those two are stronger evidence
about the description than any of the three that fire.

## Added 2026-10-24, eighteenth run: the seventh skill's boundary

The run that landed `auditing-a-detected-correction-loop` owes a near
miss to every skill already in the library, in their own files, in the
same pull request. That is `prompts/skill-extract.md` §5r, and this
section is this file's payment. The prompt is the new sibling's own
trigger, copied rather than paraphrased, and this skill's `description`
was widened in the same commit to carry the exclusion the prompt found
missing.

**9. "She says 'you broke what already worked' at step 1 of the
transcript and the record's `regressions` array is empty. Detector
bug, or am I reading the record wrong?"**

`auditing-a-detected-correction-loop`'s own trigger 2, and it should
not fire here. It arrives in this skill's vocabulary, since "the record
says one thing and the transcript says another" is what a bound exists
to catch, and a reader holding this skill will reach for a new
invariant.

The directional rule in this file's note settles it, and this prompt is
a clean worked example of it. A bound can only catch a record
contradicting itself. The empty `regressions` array contradicts
nothing: it is consistent with the loop's own `promptSteps`, with the
cue list and with the detector's filter, and the problem is that a
reader expects the field to mean something it does not. No committed
counterexample could express that, because there is no record shape
that violates it.

So the prompt is the sibling's, and if the audit that follows concludes
a rule about every record should exist, the proposal crosses to this
skill then, as a proposal, under step 1's bound-or-measurement test.
Arriving here first produces an invariant nobody can write.

## Added 2026-10-26, twenty-fourth run: the eighth skill's boundary

The run that landed `auditing-a-durability-walk` owes a near miss to
every skill already in the library, in their own files, in the same
pull request (`prompts/skill-extract.md` §5r). This section is this
file's payment, and the prompt is the new sibling's own trigger,
copied rather than paraphrased.

**10. "The durability block has `durableSpans: 0` and `durableChars:
1840`. One of those has to be a bug. Which?"**

`auditing-a-durability-walk`'s own trigger 2, and it should not fire
here.

This is the closest of the eighth skill's boundaries to this file,
because the prompt is an arithmetic question about two fields of a
record and it arrives already framed as "one of these must be wrong",
which is a sentence away from "the gate should catch it". That framing
is this skill's trigger shape.

It should not fire, because neither field is wrong and there is no
rule being proposed. The two numbers are not the same partition of the
same set: the span counts partition the tested spans by fate, and
`durableChars` accumulates surviving characters over every tested span
whatever its fate, so an eroded span contributes to one and not the
other. Reading that is the sibling's step 4.

The trap in the other direction is live and is the reason this near
miss is worth more than its heading. Somebody will arrive here
proposing exactly the bound the prompt implies, that `durableChars` is
zero whenever `durableSpans` is zero, and it is false on any record
holding one eroded span. This skill's own step for separating a bound
from a measurement is what should catch it, and the sibling is where
the person doing that separating learns the arithmetic. So the
handoff runs durability-side first when a proposed bound is about a
durability field.

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

The pull is real and it is one sentence long. "Did anything actually
check" is a question about whether a test ran, and the reflex answer in
this file is to make the gate run it. Somebody will arrive proposing
exactly that bound: `mergeDeletedChars` is non-zero whenever the
episode had intervening merges. It is false on a correct record,
because a merge can touch a paired path and leave every generation span
of that path intact, which is the ordinary case rather than an edge
one. This skill's own step for separating a bound from a measurement is
what should catch it.

The sharper reason it should not fire is already in this skill's
evidence. `DELETION_SPLIT_EXACT` holds the three-way split exact
against the gross figure, and it holds on a record every one of whose
deletion figures is a default, because the identity is true by
construction of the subtraction that produces the human share. So the
gate is green on precisely the record the sibling exists to catch. That
is not a missing bound. It is a claim no bound can reach, because the
evidence that would settle a cause is a git tree and no record carries
one, and a bound can only catch a record contradicting itself.

The handoff therefore runs sibling-side first in both directions when a
prompt is about a deletion cause, and gate-side first when it is about
a rule.

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
not fire here. This is the hardest near miss in this file, because the
prompt describes a condition the gate already checks. The third clause
of `EXCLUSION_NOT_CLASSIFIED` holds that a `sibling` exclusion's date
is no later than the record's own `task.generatedAt`, and the record in
the prompt violates it. So a reader who knows the gate will recognize
the rule before recognizing the question, and will land here.

The division is the same one this file argues everywhere and it holds
with no special pleading: this skill's object is the checker and the
sibling's object is a record. The prompt proposes no bound, changes no
bound, and asks nothing about whether a violation means the bound or the
resolver is wrong. It asks what one entry in one record is evidence for.
That the gate would catch the entry is a fact about the record's state,
not a question about the gate's design.

Two things are worth taking from this pair, both of them about what a
bound can and cannot be asked to do.

The first is an asymmetry the gate cannot close. It can catch a refusal
that was computed and then not applied, because both halves of that
contradiction are inside the record and the first clause of the same
bound is that same-set arithmetic. It can never catch a refusal that
should have been made and was not, because no record carries the object
store that would settle it. So the sibling's most expensive failure is
structurally out of this skill's reach, and a seat proposing a bound
against it should be told so rather than talked out of it.

The second is that the sibling is a consumer of three bounds and one
audit check rather than an author of any, which is the ordinary relation
between a record skill and this one. A prompt that genuinely spans the
two is handled gate-side first, for the reason this file gives for every
such prompt: a record cannot be judged against a rule while the rule
itself is in question.
