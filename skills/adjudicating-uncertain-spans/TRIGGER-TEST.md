# Trigger test — adjudicating-uncertain-spans

Ten prompts, written against the `description` field in `SKILL.md`,
per `prompts/skill-extract.md` section 5. Three should activate the
skill and seven should not. When this test fails, the description is
what changes, not the test.

The budget is ten near misses rather than two because §5c sets one
near miss per adjacent skill, and this skill has eight neighbours: every
other skill in the library. Near misses 4 and 5 are this seat's own
wording and predate the siblings they now sit beside; near misses 6
through 10 each carry one sibling's own trigger prompt verbatim, which
is what §5c literally asks for and what §5 means by putting the test in
front of the description rather than beside it.

Near misses 6 through 10 were added on 2026-10-24, and the
description's exclusion clause was widened in the same commit, because
three of the five failed. They failed in the weaker way the distilling
skill's test names: not against a stated exclusion but against the
absence of a positive hook, so the answer was already no and a reader
looking for the edge would not have found it written down. The
measurement that found them is `node skills/trigger-coverage.mjs`,
which scored this skill at zero of five sibling boundaries carrying the
sibling's own prompt, the lowest in the library and exactly its rank by
age.

Version 0.2.0 widened both the skill and the description. The resolver
now sets `uncertain` in two places, and the second one is not a
low-score span at all: a match at or above `THETA_HIGH` whose descent
corroborates as `rival` is demoted into the same queue. Prompt 3 is new
and exists to test that clause, because before it the description's
every hook was about low confidence and a high-scoring demoted span
would have missed the skill that now spends a procedure step on it.

The description under test:

> Use when a provenance resolver has produced an outcome record and some
> of its spans are flagged uncertain, and a human or agent has to decide
> span by span whether the flagged text descends from a model generation
> or from the person. Fires for adjudicating uncertain or low-confidence
> span labels, for building the ground-truth set that match thresholds
> are retuned against, for judging whether a final span and a candidate
> generation are actually ancestor and descendant, and for settling a
> span the descent check demoted as rival, where the score was high and
> the ancestry was not. Does not fire for producing a record in the
> first place, for labelling generations, for reading a record's
> summary statistics, for turning a record's labels into tuning axioms,
> for adding or changing a bound in the record gate, or for deciding
> what may leave the machine.

## Should fire

**1. "The record for task-001 has 55 uncertain spans. Work through them
and decide which ones really came from a generation, then commit the
adjudication next to the record."**

Fires. The skill's exact situation, matching three separate hooks: an
outcome record, spans flagged uncertain, and a span-by-span decision
about descent. It is the literal shape of O1 KR1.1, the work the skill
was written to serve. Under 0.2.0 the skill's first useful act on this
prompt is to refuse the premise slightly, because "55 uncertain spans"
is now two populations and step 2 splits them before any judging.

**2. "Our false-positive rate on `survived_mutated` is too high. Build a
ground-truth set from the low-confidence matches so we can retune the
0.35 and 0.6 thresholds."**

Fires, and never says "uncertain" or "adjudicate". It reaches the skill
through the ground-truth clause, which exists in the description exactly
so that threshold-tuning requests land here. Step 6 is the only place
that says retuning comes after adjudication rather than before, and in
0.2.0 it is also the only place that says the rate is computed over the
low-score queue alone, since a demoted span carries no information about
where a threshold belongs.

**3. "This span scored 0.82 against a generation but the corroborator
came back `rival`, so the resolver dropped it to
`no_generation_provenance`. Is that right, or did the person really edit
that generation?"**

Fires on the demoted-rival clause. This is the prompt that version 0.1.0
would have missed. Every hook in the old description pointed at low
confidence, and this span's score is 0.82, so a reader matching on
"low-confidence" would have ruled the skill out precisely when it had
the most to say: the judgment section's idea-versus-vocabulary test is
what settles a high lexical score against an absent ancestry, and a
threshold change cannot touch this span at all.

## Should not fire

**4. "Run the resolver over `fixtures/mini` and generate the outcome
record and viewer."**

Does not fire. Production of a record, excluded in the description by
name. It shares nearly all of the skill's vocabulary and differs in that
no verdict is asked for and nothing is flagged yet. This is sprint item
3 and belongs to the engineer.

**5. "Read the record's stats and tell me the survival rate per model
and how much of the final work has no generation provenance."**

Does not fire. Summary statistics, excluded by name, and the sharper of
the two near misses because it names `no_generation_provenance`, the
class the skill spends most of its judgment on. The line is that this
prompt consumes labels and asks nobody to decide anything, whereas the
skill exists to change labels. If it fires in practice, the fix is to
make "decide" the first verb in the description.

A sibling near miss worth naming, since 0.2.0 makes it live: a prompt
about what a `deletedPct` or an uncertain *count* is a share of belongs
to `quoting-a-number-from-an-outcome-record`, not here, even though both
skills now cite `uncertainSpans`. This skill changes labels; that one
rules on what a number may be said to mean.

**6. "Trial three is a prose record and trial two was a repo. Can I put
their no-provenance shares in the same table?"**

`quoting-a-number-from-an-outcome-record`'s own trigger, and the
sibling's own words for the boundary the paragraph above already argued
in this seat's words. Both prompts are kept, because they are not the
same test. Near miss 5 asks whether a request to read the record's
summary fires this skill, which the description excludes by name. Near
miss 6 asks a harder question: whether two records' shares are
comparable. That is a question about what a number may mean, and
nothing in this skill's procedure answers it, because a verdict on one
span says nothing about the denominator a share was computed over.

Keeping both is the point of §5c as the instrument reads it. A
boundary argued only in prose never gets the sibling's words put in
front of the description, and the sibling's words are the half of the
test that would actually catch a false positive.

**7. "We need a third trial for the corpus. Which repo should I point
`ursa run` at?"**

`running-an-outcome-record-trial`'s own trigger. Excluded by name: the
description does not fire "for producing a record in the first place",
and the `Use when` clause presupposes that a resolver "has produced an
outcome record". No record exists in this prompt, so there is no span,
no flag and nothing to adjudicate.

Distinct from near miss 4, which also sits upstream. Near miss 4 asks
for a resolver invocation over a fixture and belongs to the engineer.
This one asks which finished work the next record should be made from,
which is a judgment about the corpus and belongs to a skill. Two
different wrong answers, so two prompts.

**8. "`ursa run` just produced four records for the site project.
Distill them into tuning.json so I can paste the block into ChatGPT."**

`distilling-a-tuning-record`'s own trigger, and the first of the three
that failed. Close because the record exists, which satisfies this
skill's hardest precondition, and because that skill's own procedure
contains an evidence-joining audit that shares this skill's whole
vocabulary.

The line is the direction of travel. A span verdict is this skill's
output and that skill's input, so the handoff runs one way and this
prompt is on the far side of it. Nothing in this skill's procedure
writes an axiom, and an axiom is a claim about a person rather than
about a span.

Why it failed before 2026-10-24: the old description excluded only
three things, all of them upstream, so a reader asking whether axiom
work was in or out found no sentence either way. The exclusion clause
now names "turning a record's labels into tuning axioms", so the no is
stated.

**9. "Add a bound that a record's verbatim-survived character count
never exceeds its generated character count. It is obviously true and
the gate should catch it."**

`adding-a-bound-to-the-record-gate`'s own trigger, and the second
failure. Shares this skill's two most specific nouns, a span class and
a character count, and asks for a judgment about whether a claim is
well-founded, which is what this skill's judgment section is entirely
about.

The line is the quantifier. This skill judges one flagged span in one
record, against the candidate generation sitting on it. A bound is a
claim about every record the gate will ever see, written into
`invariants.ts` and held against a committed counterexample. A
procedure for deciding one span's ancestry cannot establish a universal,
and firing here would produce careful reasoning about a single record
in answer to a question about all of them.

**10. "The gate workflow is green on my record, so I'm pasting the
conversation into the design doc as the example payload. Any reason not
to?"**

`clearing-a-record-for-release`'s own trigger, the third failure, and
the closest of the five. This skill does read raw conversation text:
adjudicating a span means reading the person's own words beside the
model's, so the object in this prompt is an object this skill handles
routinely.

The line is that this skill reads that text and never rules on it
leaving. Its output is a verdict file next to the record, on the same
machine, and its procedure has no step about exits, audiences or
redaction. The release skill owns the three exits and knows the thing
this one does not, which is that a design document is a different exit
from a disclosure batch and is governed by opposite rules about raw
text.

Worth stating because it is the honest weakness of this pair: "the gate
workflow is green" is a reassurance about the wrong gate, and a skill
that adjudicates spans is exactly the sort of thing a reader might
think the green check covered. Being named in the exclusion clause is
what stops that, and before 2026-10-24 it was not.

## Note on the five boundaries, which are one edge and two kinds of rule

§5c warns that a skill with three or more neighbours is probably
describing a topic rather than a piece of work. This skill has five and
should not be re-cut, for the reason §5e gives: count artifacts, not
neighbours.

Three of the five near misses are one edge counted three times, and it
is the same edge the distilling skill's test names from the other side.
`running-an-outcome-record-trial` sits upstream of
`outcome_record.json`, this skill writes verdicts into it, and
`distilling-a-tuning-record` and
`quoting-a-number-from-an-outcome-record` read out of it. Near misses 6,
7 and 8 all fail by sitting on the far side of one handoff, in one
direction or the other.

The other two fail differently, and neither is about an artifact. Near
miss 9 is a *rule about every record*, and near miss 10 is a *departure*.
Both of them share this skill's judgment shape rather than its object,
which is why neither was excluded by the old description: an exclusion
list built from artifacts cannot name them.

Ours: the test that separates a topic from a piece of work is whether a
skill's inputs and outputs name the same file as its neighbours', which
is §5e. This file is the case that shows §5e is necessary but not
sufficient. Two of its eight neighbours name no shared file at all, the
record gate and the release ruling, and the boundary with them still
has to be written down, because what is
shared is the *shape of the judgment* and a reader matches on shape. So
the budget of one near miss per neighbour is right even where the
artifact test already says there is no overlap, and §5e's test should be
read as an argument against re-cutting a skill rather than as a licence
to skip a near miss.

## Added 2026-10-24, eighteenth run: the seventh skill's boundary

The run that landed `auditing-a-detected-correction-loop` owes a near
miss to every skill already in the library, in their own files, in the
same pull request. That is `prompts/skill-extract.md` §5r, and this
section is this file's payment. The prompt is the new sibling's own
trigger, copied rather than paraphrased, and this skill's `description`
was widened in the same commit to carry the exclusion the prompt found
missing.

**11. "She says 'you broke what already worked' at step 1 of the
transcript and the record's `regressions` array is empty. Detector
bug, or am I reading the record wrong?"**

`auditing-a-detected-correction-loop`'s own trigger 2, and it should
not fire here. The shape is this skill's shape almost exactly: a label
the resolver produced is in doubt, the user's own words are the
evidence, and somebody has to settle it by reading. That is why the
boundary needed writing down rather than being left to §5e.

The object is what separates them. This skill rules on a span, meaning
a stretch of the finished work and whether it descends from a
generation. A regression event is not a span and has no descent; it is
an entry derived from the user's prompts. The exclusion added for this
boundary names trajectory signals for that reason.

The two do meet on one record and the meeting runs in this direction,
which is worth knowing: adjudicating a span changes which generations
have surviving characters, and that is the input the sibling's
`closedStep` is computed from. So an adjudication pass can move a
loop's resolution, and the sibling is downstream of this skill rather
than beside it.

## Added 2026-10-26, twenty-fourth run: the eighth skill's boundary

The run that landed `auditing-a-durability-walk` owes a near miss to
every skill already in the library, in their own files, in the same
pull request (`prompts/skill-extract.md` §5r). This section is this
file's payment, and the prompt is the new sibling's own trigger,
copied rather than paraphrased.

**12. "This record says `decayRate: 0`. Can I put 'none of the model's
output was later removed' in the methods note?"**

`auditing-a-durability-walk`'s own trigger 1, and it should not fire
here.

The two skills work on the same spans of the same file and point in
opposite directions in time, which is why the artifact test cannot
separate them and the boundary had to be written down. This skill
decides whether a span descends from a generation, a question about
the past of the text, settled at the closing commit. The new sibling
decides what happened to the span afterwards, and it takes the class
this skill produces as its input: the decay rate is computed only over
spans already classed `survived_verbatim` or `survived_mutated`.

So a prompt about a `decayRate` presupposes that adjudication is
finished. There is no uncertain span in it, no descent question, and
nothing to commit beside the record.

The handoff worth knowing in the other direction, since it is the one
a reader of this skill will meet. A span wrongly adjudicated as
surviving does not just add a false positive to `stats`; it enters the
durability denominator and quietly moves a number sold to a lab. That
makes the new sibling a downstream consumer of this skill's verdicts,
and it is a reason to be careful here rather than a reason to answer
its prompts.

## Added 2026-10-26, thirtieth run: the ninth skill's boundary

The run that landed `attributing-a-deleted-span` owes a near miss to
every skill already in the library, in their own files, in the same
pull request (`prompts/skill-extract.md` §5r). This section is this
file's payment, and the prompt is the new sibling's own trigger 1,
copied rather than paraphrased.

**13. "This record's `humanDeletedChars` is 92 of 307 generated
characters. Before I call that a discard rate, did anything actually
check whether a merge took them?"**

`attributing-a-deleted-span`'s own trigger 1, and it should not fire
here.

Both skills take one span and ask what happened to it, and the
sibling's prompt wears this file's own posture: "did anything actually
check" is the sentence this skill teaches a reader to ask of a label.
So the resemblance is in the shape of the judgment rather than in the
object, which is the case `prompts/skill-extract.md` §5r says the
artifact test cannot settle.

The object settles it anyway, and mechanically. `uncertain` is a field
on `FinalSpan`, set on a span over the finished work whose best
candidate scored below threshold. `deletion` is a field on
`GenerationSpan`, set only when that segment's fate is
`generated_deleted`. They are different interfaces over different
text, and no span carries both: a span this file's skill adjudicates is
one the resolver could not place, and a span the sibling rules on is
one it placed in the deleted class. A prompt asking which of the two
you have is this skill's, and a prompt that has already been told is
the sibling's.
