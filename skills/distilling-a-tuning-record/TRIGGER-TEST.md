# Trigger test — distilling-a-tuning-record

Eight prompts, written against the `description` field in `SKILL.md`.
Three should activate the skill. Eight are near misses that should not.
Per `prompts/skill-extract.md` §5, when the test fails the description
is what changes, not the test. The budget is eight near misses rather
than two because §5c sets one near miss per adjacent skill, and this
skill has eight neighbours: every other skill in the library.

Near miss 4 is `quoting-a-number-from-an-outcome-record`'s own trigger,
near miss 5 is `running-an-outcome-record-trial`'s, near miss 6 is
`adjudicating-uncertain-spans`', near miss 7 is
`adding-a-bound-to-the-record-gate`'s, and near miss 8 is
`clearing-a-record-for-release`'s. The first three fail for one reason,
which is the subject of the note at the end; the last two do not, and
the note says why.

Near misses 7 and 8 were added on 2026-10-24, and the description's
exclusion clause was widened in the same commit to name the work they
ask for. Both siblings landed after this file was written, on 2026-10-18
and 2026-10-23, and neither was added at the time. Under §5 the test
failing means the description changes, and these two failed in the
weaker way: not against a stated exclusion but against the absence of a
positive hook, which is a description that happens to be right rather
than one that says where its edge is.

## Should fire

**1. "`ursa run` just produced four records for the site project.
Distill them into tuning.json so I can paste the block into ChatGPT."**

The skill's opening situation stated almost literally, reached through
"running the distill pass over a record" and through "pasted into a
model". It should fire even though the user asked for execution rather
than for advice, because the first two steps change what the run can
honestly produce: a commit-pair record carries no user prompts at all,
so no axiom from these four may claim `basis: stated` or carry a
quote, and the only evidence kind available is the one-shot correction.
A reader who runs the command without that fires it into a store whose
`stated` axioms are fabrications.

**2. "`tuning.md` says `Avoid: explanatory labels on visual elements
(tacit, x4)`. Strong enough to put in my CLAUDE.md?"**

Reaches the description through "reading the confidence count on a
rule". The question looks like a judgment call about one rule and is
actually a question about what the integer counts. The answer is that
`x4` is four evidence entries and may be four mutated spans inside one
record, which is one piece of work and not a recurrence, so the honest
restatement is "four entries from one record" and the rule goes in as a
hint rather than as a rule.

**3. "I rebased the project to tidy up history and reran `ursa run`.
Now distill accepted records it had already seen. Did I break the
tuning file?"**

This is the prompt the description was widened for. It never says
axiom, confidence, evidence or basis. It reads as a tooling complaint
and routes naturally to the engineer, who finds no bug, because the
guard did exactly what it was written to do: it compares record ids,
and a rebase changed every commit sha and therefore every episode id.
The skill answers it in a paragraph. The file is not corrupt, every
axiom the second pass touched now double counts the same work, and the
repair is a new store rather than a reconciliation.

## Should not fire

**4. "Trial three is a prose record and trial two was a repo. Can I put
their no-provenance shares in the same table?"**

`quoting-a-number-from-an-outcome-record`'s own trigger. Close because
both skills are about what a number is allowed to mean, and this skill
spends a whole step on exactly that reasoning. The line is the
artifact. The share in this prompt is a field of
`outcome_record.json`, computed by the resolver over characters of
text. This skill's description does not fire "for quoting a statistic
out of a record", and nothing it knows about axioms helps with a
denominator in characters.

**5. "We need a third trial for the corpus. Which repo should I point
`ursa run` at?"**

`running-an-outcome-record-trial`'s own trigger. Close because this
skill's second step reasons about capture paths and reaches the same
conclusion about what a commit-pair record can carry. The line is
temporal and the description carries it: this skill starts when "an
outcome record is about to be turned into tuning axioms", which
presupposes a record. No record exists in this prompt, so there is
nothing to distill and no store to choose.

**6. "This record has 55 uncertain spans. Work through them and decide
which ones really came from a generation."**

`adjudicating-uncertain-spans`' own trigger, and the most expensive of
the three false positives, because step 7 of this skill is also an
evidence-joining audit and shares the prompt's whole vocabulary:
evidence, really came from, decide. The line is in the description's
last sentence, which excludes "settling the label on an individual
span". Span labels are an input to this skill and never an output of
it. If it fired here the user would get a procedure for auditing axiom
evidence against record steps, which is the same shape of work on the
wrong object.

**7. "Add a bound that a record's verbatim-survived character count
never exceeds its generated character count. It is obviously true and
the gate should catch it."**

`adding-a-bound-to-the-record-gate`'s own trigger. Close for a reason
none of the first three share, and it is not vocabulary: both skills
judge whether a proposed *rule* is well-founded. This skill's step on
axiom evidence asks whether a rule about the person is grounded in what
the record shows; that skill's first step asks whether a rule about the
record is a bound or a measurement. The judgment has the same shape and
the same failure mode, a rule asserted more confidently than its
evidence carries.

The line is the object the rule is about. An axiom is a claim about a
person, written by a model and held against the evidence pointers in
`tuning.json`. A bound is a claim about one record's internal
consistency, written by a person into `invariants.ts` and held against
a committed counterexample. Nothing in this skill's procedure reads
`invariants.ts` and no step can add or change a bound.

Worth stating because it is the honest weakness of this pair: before
2026-10-24 this prompt was excluded only by the absence of a hook. The
description's `Use when` requires a record about to become axioms or an
axiom about to be trusted, and a character-count bound is neither, so
the answer was already no. But a reader looking for the edge would not
have found it written down, and the exclusion clause now names gate
work so that the no is stated rather than inferred.

**8. "The gate workflow is green on my record, so I'm pasting the
conversation into the design doc as the example payload. Any reason not
to?"**

`clearing-a-record-for-release`'s own trigger, and the closest call in
this file, because this skill's description genuinely does fire "for
deciding what may leave the machine with a tuning block". A release
clause already lives here. So the two skills are not separated by
subject matter at all: both of them answer what may leave.

The line is what is leaving, and it is mechanical rather than a matter
of degree. This skill rules on a tuning block, meaning the axioms and
whatever travels with them. What is leaving in this prompt is raw
conversation text out of an outcome record, which no tuning block
contains and no axiom quotes except as the user's own words. So the
object is on the other side of the handoff and the ruling belongs to
the skill that owns the three exits, which also knows the thing this
one does not: that pasting into a design document is a different exit
from a disclosure batch and is governed by opposite rules about raw
text.

The related prompt that *would* fire is the same sentence with "the
tuning block" in place of "the conversation", and the difference
between those two prompts is the whole boundary.

## Note on the boundaries, which are two edges and not five

§5c of `prompts/skill-extract.md` warns that a skill with three or more
neighbours is probably describing a topic rather than a piece of work,
and says the signal means re-cut the skills. This skill has five
neighbours and should not be re-cut, for the reason §5e gives: count
artifacts, not neighbours.

Three of the five near misses are one edge counted three times.
`adjudicating-uncertain-spans`, `quoting-a-number-from-an-outcome-record`
and `running-an-outcome-record-trial` all work on
`outcome_record.json`. This one works on `tuning.json`. The handoff
from the record to the tuning store is a single edge in the pipeline,
and near misses 4, 5 and 6 all fail by sitting on the record side of
it.

Near misses 7 and 8 are a second edge, and that is the part this file
did not know until 2026-10-24. `adding-a-bound-to-the-record-gate`
works on the checker rather than on any record, and
`clearing-a-record-for-release` works on a boundary rather than on an
artifact, so neither of them sits on the record side of anything.
Against the gate the shared object is a *rule* and the question is what
the rule is about. Against the release skill the shared object is a
*departure* and the question is what is departing. Two edges, two
different tests, which is why the budget of five is not five copies of
one argument.

Ours: counting neighbours is the wrong test once a library covers two
artifacts, and still the wrong test once it covers four. The test that
distinguishes a topic from a piece of work is whether the skill's
inputs and outputs name the same file as its neighbours'. That was
proposed as §5e in `prompts/skill-extract.md` by the run that wrote the
first version of this note, and this test is still the evidence for it:
`tuning.json` appears in no other skill's inputs or outputs, and that
single fact is what makes eight neighbours a position in a pipeline
rather than a topic.

## Added 2026-10-24, eighteenth run: the seventh skill's boundary

The run that landed `auditing-a-detected-correction-loop` owes a near
miss to every skill already in the library, in their own files, in the
same pull request. That is `prompts/skill-extract.md` §5r, and this
section is this file's payment. The prompt is the new sibling's own
trigger, copied rather than paraphrased, and this skill's `description`
was widened in the same commit to carry the exclusion the prompt found
missing.

**9. "The signals block says one loop with two recurrences, but I count
three places she complains about the constellation being dark. Which
one is right?"**

`auditing-a-detected-correction-loop`'s own trigger 1, and it should
not fire here. This skill runs downstream of the signals block and
reads from it, so the vocabulary is shared completely: a confidence
count on an axiom is built out of recurrences, and a disputed
recurrence count therefore changes what an axiom may claim.

Downstream is the whole of the edge. Nothing in this prompt is about an
axiom, a confidence count, a tuning store or an export; it is about
what one field of one record means. The exclusion added for this
boundary says so by naming the artifact, which is §5e's test: the
signals block is not `tuning.json`. The direction when a prompt spans
both is signals-side first, for the same reason the record-side
ordering in this file's other near misses runs that way. An axiom
cannot be judged against a number whose definition is still open.

## Added 2026-10-26, twenty-fourth run: the eighth skill's boundary

The run that landed `auditing-a-durability-walk` owes a near miss to
every skill already in the library, in their own files, in the same
pull request (`prompts/skill-extract.md` §5r). This section is this
file's payment, and the prompt is the new sibling's own trigger,
copied rather than paraphrased.

**10. "This record says `decayRate: 0`. Can I put 'none of the model's
output was later removed' in the methods note?"**

`auditing-a-durability-walk`'s own trigger 1, and it should not fire
here.

§5e's artifact test separates these two cleanly, since this skill's
object is `tuning.json` and the sibling's is a block of
`outcome_record.json`. The near miss is owed anyway, under §5r, and it
earns its place for a reason the artifact test cannot see: both skills
are about a claim being made more confidently than its evidence
carries. This skill's whole first half is what an axiom may assert
from how many records; the sibling's is what a rate may assert from
how the walk measured it. The prompt above is recognisably that kind
of question, and a reader holding this skill will feel the pull.

It is still not an axiom. Nothing is being distilled, nothing is being
merged into a store, and the sentence in question is about the model's
output rather than about the user.

The handoff is real and runs toward this skill. A decayed span is
evidence that a kept verdict was overturned, which is exactly the kind
of thing an axiom should not be built on, so a run that distils from
records carrying durability blocks should know what those blocks mean
first. That is a reason to read the sibling before distilling, not a
reason to answer its prompts here.

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

This is the easiest of the ninth skill's eight boundaries and the
artifact test is what makes it easy, which is worth saying because it
is not true of the other seven. This skill's object is `tuning.json`
and its question is what a record means about the user. The sibling's
object is a block inside `outcome_record.json` and its question is what
happened to one span.

The pull that does exist is one step removed and it is a real hazard
rather than a trigger. An axiom distilled from deletions the person did
not make is an axiom resting on the sibling's output being right, and
on a repo-path record with no attributor injected every deletion is
attributed to the person by default. So the sibling's failure mode
arrives here as a false confidence count about a correction nobody
made. The honest place to guard it is the sibling's own step about
naming the clone a figure was read on, not a trigger in this file,
because by the time a distillation pass runs the attribution is already
in the record and this skill reads it rather than recomputing it.

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
not fire here. §5e's artifact test separates the two cleanly, since this
skill's object is `tuning.json` and the sibling's is an array inside
`outcome_record.json`, and the prompt asks for no distillation of
anything.

The pull is one step removed and is the same shape as this file's near
miss for the deletion skill: an axiom is only as good as the labels
under it. What makes the exclusion case worse than the others is scale.
A wrong span label moves one axiom's confidence count by one. An
unrefused import hands the distiller tens of thousands of characters of
someone else's prose as text the person kept, and on this repository's
own history that was 60,616 characters in a single file, so any axiom
drawn about tone, structure or length would be an axiom about a standard
written at another company.

The boundary that matters here is therefore a precondition rather than
an edge, and it points one way. A distillation inherits whatever
exclusion ruling was or was not made upstream and has no means to
revisit it, because `tuning.json` does not carry paths. So the sibling's
refusal is a thing to have checked before this skill runs, and the right
place to say so is the sibling's procedure. Not a trigger here, which
would fire on every distillation prompt and tell the reader nothing
about which one has the problem.
