# Trigger test — quoting-a-number-from-an-outcome-record

Nine prompts, written against the `description` field in `SKILL.md`.
Four should activate the skill. Five are near misses that should not.
The fourth should-fire prompt was added on 2026-10-15 under the §5
budget-is-a-floor rule, after the skill gained the `survived_verbatim`
redefinition. Per `prompts/skill-extract.md` §5, when the test fails
the description is what changes, not the test.

The budget is five near misses because §5c sets one per adjacent skill
and this skill has five neighbours, which is every other skill in the
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
