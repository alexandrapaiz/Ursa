# Trigger test — quoting-a-number-from-an-outcome-record

Five prompts, written against the `description` field in `SKILL.md`.
Three should activate the skill. Two are near misses that should not.
Per `prompts/skill-extract.md` §5, when the test fails the description
is what changes, not the test.

The library now holds three skills over outcome records, so this test
carries the sibling job as well. Near miss 4 is
`adjudicating-uncertain-spans`' own trigger and near miss 5 is
`running-an-outcome-record-trial`'s own trigger, which means both
boundaries this skill has are tested rather than one.

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
