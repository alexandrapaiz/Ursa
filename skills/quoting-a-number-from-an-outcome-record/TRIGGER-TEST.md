# Trigger test — quoting-a-number-from-an-outcome-record

Nine prompts, written against the `description` field in `SKILL.md`.
Four should activate the skill. Eight are near misses that should not.
The fourth should-fire prompt was added on 2026-10-15 under the §5
budget-is-a-floor rule, after the skill gained the `survived_verbatim`
redefinition. Per `prompts/skill-extract.md` §5, when the test fails
the description is what changes, not the test.

The budget is eight near misses because §5c sets one per adjacent skill
and this skill has eight neighbours, which is every other skill in the
library. Near miss 4 is `adjudicating-uncertain-spans`' own trigger, 5
is `running-an-outcome-record-trial`'s, 6 is
`adding-a-bound-to-the-record-gate`'s, 7 is
`clearing-a-record-for-release`'s, and 8 is
`distilling-a-tuning-record`'s.

Near misses 6, 7 and 8 were added on 2026-10-24, and the description's
exclusion clause was widened with them. Until then this file said that
"both boundaries this skill has are tested rather than one", which was
true when it was written and had been wrong for three weeks: the
library went from three skills to six and nothing brought the sentence
with it. That is the general case rather than this file's lapse, and
`skills/trigger-coverage.mjs` is the measurement, 15 of 30 boundaries
tested across the library on the day it was written, with coverage
tracking each skill's age exactly.

## Should fire

**1. "I'm re-grounding the methods doc for KR2.1. The draft says 82.1
percent of generated characters were deleted. Is that still the right
way to say it?"**

The skill's opening situation stated almost literally. A number is
going into a document a reader will trust, and the question is about
wording rather than arithmetic. Reaches the description through
"auditing a quantitative sentence that already exists against the field
it cites". The answer is that this particular sentence is one of the
few in the document already naming its population correctly, which is
worth knowing, and that what it still needs is the capture path and the
n it rests on.

**2. "The record's four tiles say 41 percent, 24 percent, 35 percent
and 30 percent. That's 130. What's broken?"**

Never says claim, denominator, record statistic or audit. It reaches
the skill only through "deciding what a record statistic is a share
of", and it arrives looking like an arithmetic complaint or a rendering
bug. This is the prompt the description was widened for. Routed to the
engineer it produces a hunt through `stats.ts` for a summing error that
is not there, because the three class percentages are correct and sum
to one, and the fourth is a share of generated characters rather than
of the finished work. The skill answers it in one paragraph and the
engineer cannot.

**3. "Trial three is a prose record and trial two was a repo. Can I put
their no-provenance shares in the same table?"**

A comparison question, which is where the skill says it fires hardest.
Reaches the description through "checking whether two records' numbers
can be compared or added". The answer is a qualified no, because the
uncovered fraction is systematically larger in code mode than in prose
mode, so a few points of difference between those two records can be
segmentation rather than signal.

**3b. "Our September deck says 41 percent of the model's text survived
verbatim. I'm refreshing it off last night's record and the figure
dropped to 33. Did the model get worse?"** (added 2026-10-15, sixth
run)

The budget in §5 is a floor, and this case was added because the skill
learned something new rather than because the description changed. It
reaches the same clause prompt 3 does, "checking whether two records'
numbers can be compared or added", and the answer is now a hard no for
any pair that straddles 2026-10-13. On that date `survived_verbatim`
was redefined to mean byte-identical, and the formatting-only matches
that used to earn the label moved into `survived_mutated`. A drop of
that size across that date is a schema change being reported as model
behaviour. This is the prompt that proves the clause was worth having,
because nothing in it mentions schemas, versions or definitions, and
the user's own hypothesis is the wrong one.

## Should not fire

**4. "This record has 55 uncertain spans. Work through them and decide
which ones really came from a generation."**

`adjudicating-uncertain-spans`' own trigger, and the costliest possible
false positive, because this skill discusses the uncertain population
at length in its judgment section and so shares every noun in the
prompt. The line is in the description's last sentence: this skill does
not fire "for deciding the label on any individual span". It reasons
about what the 55 do to a total. It never changes one of them. If it
fired here the user would be handed a lecture on denominators instead
of an adjudication procedure.

**5. "We need a third trial for the corpus. Which repo should I point
`ursa run` at?"**

`running-an-outcome-record-trial`'s own trigger. Close because both
skills talk about the corpus, about capture paths and about what the
resulting numbers may mean. The line is temporal, and the description
carries it in two places: this skill starts when "a percentage, rate or
count taken from an outcome record is about to be written" somewhere,
which presupposes a record exists, and it explicitly does not fire "for
producing a record" or "for choosing a trial subject". No record exists
yet in this prompt, so there is no number to quote.

**6. "Add a bound that a record's verbatim-survived character count
never exceeds its generated character count. It is obviously true and
the gate should catch it."**

`adding-a-bound-to-the-record-gate`'s own trigger, and on subject
matter the closest pair in the library, because the two skills do the
same arithmetic. This skill fires for deciding what a statistic is a
share of and whether two of a record's numbers may be compared or
added; that prompt asks whether one character count may exceed
another. Both are reasoning about the relation between two fields of
the same record, in the same units, over the same set of characters.

The line is not the arithmetic, it is what the answer becomes. This
skill's output is a sentence a reader will trust, and the description
says so by listing its destinations: the methods document, a lab brief,
a deck, a README, a claim to a buyer. The gate's output is a check in
`invariants.ts` that holds over every record there will ever be, plus a
committed record that breaks it. So the two differ by quantifier. A
quoted number is about the record in front of you; a bound is about all
of them, which is why it needs a counterexample and a quoted number
needs a denominator.

The reciprocal is already written down and worth reading beside this:
that skill's own near miss 6 is this skill's trigger 3, and it is
excluded there because no bound can see across two records at all. Each
side of this boundary is tested from its own side, and the two
arguments are different, which is what §5c is for.

**7. "The gate workflow is green on my record, so I'm pasting the
conversation into the design doc as the example payload. Any reason not
to?"**

`clearing-a-record-for-release`'s own trigger. This is the near miss
`skills/README.md` singles out as the one worth reading, and it is
mutual: the two skills share every noun, and that skill's own near miss
4 is this skill's trigger 1. Both of them are about a thing out of a
record going into a document somebody else will read. This skill's
first destination is the methods document; that skill's third exit is a
person quoting a passage into a design document. Same sentence shape,
same artifact, same direction of travel.

The line is what is travelling, and it is mechanical rather than a
matter of degree. This skill rules on a number, which the description
says in its first clause: a percentage, rate or count. What is pasted
here is the conversation, which is raw text and carries no statistic at
all. So there is nothing for this skill to rule on, and the question
that remains is a release question: which of the three exits this is,
and what that exit demands of raw text.

Also worth naming because it is the half a reader gets wrong in the
other direction: a statistic out of one record is never blocked by the
release skill either. Every field under `stats` ships. So these two
skills do not overlap on numbers at all, and the appearance that they
might is what makes the near miss worth keeping.

**8. "`ursa run` just produced four records for the site project.
Distill them into tuning.json so I can paste the block into ChatGPT."**

`distilling-a-tuning-record`'s own trigger. Close on two hooks rather
than one. It ends in something being pasted where it will be trusted,
which is this skill's whole situation, and the thing being pasted
contains a count: an axiom carries an `evidenceCount`, and reading the
confidence count on a rule is one of that skill's own stated triggers.
So there is a number, a destination and a reader.

The line is in the description's first clause, which requires a number
"taken from an outcome record". An `evidenceCount` is taken from a
tuning record, and it counts evidence entries rather than characters or
spans, so none of this skill's procedure applies to it: there is no
denominator to establish, because it is a count of pointers and not a
share of anything. Asking what an `evidenceCount` is a share of is a
category error, and the skill that knows that is the one that owns the
field.

That skill already carries the rule for the case, which settles the
boundary rather than merely arguing it: its store section says to name
the project whenever you quote a confidence count, because one store
per project means an axiom confirmed in three projects reads as three
single-evidence hypotheses. That is the same *kind* of caveat this
skill issues about denominators, written by the skill that owns the
number. Two skills issuing it would be two places for it to drift.

The related prompt that *would* fire is "the deck says this axiom is
backed by four records and the tuning file says `x4`, is that the same
four", because that is a quantitative sentence being audited against
the field it cites, which is this skill's fourth stated trigger.

## Note on the overlap this test exposes

Prompt 3 and near miss 5 both involve choosing between a prose record
and a code record, and they land on opposite sides. The difference is
what the answer changes. In prompt 3 the records exist and the question
is whether a sentence about them is honest, which is this skill. In
near miss 5 no record exists and the question is which subject to pick,
which is the trial skill. Ours: if a future prompt asks both at once,
which is likely once the corpus is near five, the trial skill should
run first and this one should run on its output. That ordering is not
encoded anywhere yet and is a ledger entry rather than a solved
problem.

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
not fire here. The pull is strong and it is the description's "checking
whether two records' numbers can be compared or added" that pulls,
because a disputed recurrence count is exactly a comparability
question. The reason it lands on the sibling is the half of this
skill's trigger the prompt does not have: nothing is about to be
written into something a reader will trust. There is no methods doc, no
brief and no buyer. There is a reader trying to work out what a field
counts.

This skill's step 8 is the near relative and the tell. "Read the
field's definition, not its label" is the same move the sibling makes
on `recurrences`, and this skill demonstrates it on
`turnsToAcceptance`, which is a `stats` field. The exclusion added for
this boundary names the object rather than the move: a trajectory entry
the detector emitted is not a statistic the resolver counted. Once a
recurrence count is going into the lab brief, both fire, and the order
is sibling first, because this skill cannot rule on a sentence whose
subject has not been established.

## Added 2026-10-26, twenty-fourth run: the eighth skill's boundary

The run that landed `auditing-a-durability-walk` owes a near miss to
every skill already in the library, in their own files, in the same
pull request. That is `prompts/skill-extract.md` §5r, and this section
is this file's payment. The prompt is the new sibling's own trigger,
copied rather than paraphrased.

This is the hardest of the seven boundaries the new skill creates, and
it is the one the library should expect to get wrong, so it gets more
prose than the others.

**10. "Two records, one from the site project and one from alexandria,
report `decayRate` 0.31 and 0.62. Is the second project really twice as
bad at keeping what the model wrote?"**

`auditing-a-durability-walk`'s own trigger 3, and it should not fire
here, on a technicality that is really the substance.

Everything about the prompt says this skill. It holds two record
statistics, it asks whether they may be compared, and comparability
across records is this skill's central question. If the two numbers
were span-class shares out of `stats` it would be trigger 1 of this
file with different nouns.

`decayRate` is not like the other statistics, and that is the whole
distinction. Every number this skill governs is a function of the
episode, settled when the episode closed, so two of them differ only
in what they are a share of. `decayRate` is a function of the commits
after the closing commit, walked to whatever HEAD was at the time, so
two of them can differ because the walks ended at different tips with
nothing about either episode differing at all. There is a prior
question, and it is not "what is this a share of".

So the order is: the durability skill establishes that the two walks
measured comparable things, by reading each block's `closingSha` and
`tipSha` and whether the revision cap bound, and then this skill
decides whether the two numbers may be stated side by side. A prompt
that arrives already past the window check belongs here. This one does
not, because nothing in it shows anyone has looked.

The practical test, for a reader who has both skills and has to pick
one. Ask whether the question would survive someone answering "those
two walks ended at different commits". If that answer dissolves the
question, it was the durability skill's. If the question is still there
afterwards, it is this skill's. `skills/README.md` records the order.

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
here. It is the hardest near miss in this file and the closest boundary
in the library, so the division is stated in full rather than asserted.

Both skills rule on the same four fields of `stats.generated`, and the
sibling's prompt quotes two numbers and a rate name, which is this
skill's trigger shape almost exactly. What separates them is which half
of the sentence is in question. This skill rules on what a number is a
share of: `deletedPct` divides by generated characters rather than by
the finished work, and its numerator has the `not_generated` characters
subtracted out while the denominator keeps them. The sibling rules on
whether the numerator names a person at all, which is a question about
whether a git test ran and what it could read.

The sibling's prompt is entirely the second question. It has already
named the right field, `humanDeletedChars`, and already given the right
denominator, 307 generated characters, so there is no share-of ruling
left to make. What it asks is whether anything checked, and no field in
`stats` answers that.

The ordering rule, stated once and the same in both files: a prompt
that genuinely spans the two is handled quoting-side first, because a
cause cannot be audited until it is settled which population the figure
covers. This prompt does not span them, because it arrives with the
population already settled.

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
not fire here. The pull is real and comes from the last six words: a
prompt asking whether something may be cited in a methods note is this
skill's trigger shape almost exactly, and trigger 1 of this file is a
methods doc for KR2.1.

What separates them is that the sibling's prompt contains no number. It
holds a path, a reason, a relation and two timestamps, and the ruling it
wants is whether the refusal those four fields record points the right
way in time. This skill rules on what a quantity is a share of, and
there is no quantity here to take a denominator.

The boundary that does exist between the two skills runs the other way
and is worth naming, because a reader who finds it will arrive from this
side. An exclusion changes the *domain* of this skill's figures: a path
the record excludes is absent from `files[]` and therefore from
`finalChars` and `coveredChars`, so every percentage this skill rules
on is computed over the paths that survived the refusal. The ordering
rule, stated once and the same in both files: a prompt that genuinely
spans the two is handled exclusion-side first, because what a number is
a share of cannot be settled until it is settled which paths are in the
population at all. That is the reverse of the order this file takes with
`attributing-a-deleted-span` under near miss 11, and the asymmetry is
not an inconsistency. A deletion cause is read *out of* a figure, so the
figure has to be pinned first. An exclusion decides which figure there
is.
