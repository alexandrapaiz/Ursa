# Trigger test — auditing-an-untraced-share

```counts
prompts: 13
should-fire: 3
near-misses: 10
neighbours: 10
```

The counts above are checked by `node skills/trigger-coverage.mjs`,
which goes red when they drift, per `prompts/skill-extract.md` §5ae, so
they are the only place this file states them. This file stated all four
in prose until 2026-11-02, which is the defect §5ae exists to stop: the
skill was written in the one window where the ninth skill existed and
the counts convention did not, so it was the only file in the library
the new guard could not check. The prompts below are written against the
`description` field in `SKILL.md`. Per §5, when the test fails the
description is what changes and not the test.

The budget is one near miss per adjacent skill, because §5c sets it
there and this skill's neighbours are every other skill in the library.
§5e
asks whether this skill's inputs name the same file as its neighbours',
and for three of them they do: `adjudicating-uncertain-spans`,
`quoting-a-number-from-an-outcome-record` and this skill all read
`files[].spans` inside `outcome_record.json`. So §5c's warning applies
and is answered in prose rather than waved away, in the last paragraph
of this file's **Why the cut is where it is** section, because an
artifact test that says three boundaries are real does not say they are
written down. §5r is what says they have to be.

Near miss 4 is `adjudicating-uncertain-spans`' own trigger, 5 is
`quoting-a-number-from-an-outcome-record`'s, 6 is
`running-an-outcome-record-trial`'s, 7 is
`distilling-a-tuning-record`'s, 8 is
`adding-a-bound-to-the-record-gate`'s, 9 is
`clearing-a-record-for-release`'s, 10 is
`auditing-a-detected-correction-loop`'s and 11 is
`auditing-a-durability-walk`'s, 12 is
`attributing-a-deleted-span`'s and 13 is
`excluding-a-file-from-an-outcome-record`'s. Each is copied rather than
paraphrased, per §5r: the sibling's own words test this description, and
the author's words would only test the author.

## Should fire

**1. "The record says 34 percent no-provenance. A lab wants to
commission collection concentrated where our models are weakest and
they're pricing off that number. Can they?"**

Fires, and it is the prompt this skill exists for, because money is
about to be taken against a figure nobody has decomposed. It reaches
the description through "deciding whether a commissioned collection can
be priced off a no-provenance figure". The answer is step 4: the buyer
is paying for the absent-vocabulary route and the quoted figure
includes six others [E3]. Run on this repository's own committed
fixture the whole 34.1 per cent resolves to `scored_below_floor` [E7],
meaning none of it is the route being sold, which is the worked example
in step 2.

A reader without this skill reaches for
`quoting-a-number-from-an-outcome-record`, gets a correct answer about
denominators, and still signs the contract.

**2. "Our no-provenance share went from 27 to 41 percent across two
records of the same repo and nothing about the project changed. Is that
signal or is the matcher going blind?"**

Fires through "working out why the no-provenance share rose between two
records of the same project". The prompt has already guessed the right
shape of answer, which is why it fires rather than being handed to the
quoting skill: the question is composition over time, not comparability
of denominators. Step 3 is the ruling, and it is the one figure in the
record whose level means less than its direction, because `MAX_TOKEN_DF`
is an absolute count against a corpus that only grows [E4].

**3. "This record has no `blindSpans` key at all. Is that a clean
record or an old one?"**

Fires through "checking whether a record is old enough that its
blindness counts are absent rather than zero", and this is the one
should-fire prompt in this test that fires in order to hand half its
answer away. The field rule — optional, read as zero when absent, zero
wrong but unknowable before 2026-10-24 [E17] — is
`quoting-a-number-from-an-outcome-record`'s judgment item 11, and step 0
says to cite it rather than restate it.

What is left is this skill's, and it is why the prompt belongs here
rather than there: the question is not whether to quote the field but
what remains auditable without it. The answer is that the rival route
and the three other `noCandidate` values survive and only the DF route
does not, so the audit degrades to partial rather than failing [E21].
A reader who asks the quoting skill gets a correct ruling on the field
and no answer about the audit.

## Should not fire

**4. "This span scored 0.82 against a generation but the corroborator
came back `rival`, so the resolver dropped it to
`no_generation_provenance`. Is that right, or did the person really edit
that generation?"**

Should not fire. This is `adjudicating-uncertain-spans`' own third
trigger prompt, and it tests the hardest boundary this skill has: it
names this skill's class, its `descent` field and the rival demotion
route, in this skill's vocabulary, and it is still not this skill's
work. The question is whether **this one span** descends from **that
one generation**, which is a per-span adjudication. This skill never
settles a span; it rules on what a class total is made of. The
description's exclusion "for deciding the label on any one span the
resolver flagged `uncertain`" is the clause that has to catch it, and
`uncertain` is set on exactly this route [E13].

**5. "Trial three is a prose record and trial two was a repo. Can I put
their no-provenance shares in the same table?"**

Should not fire, and this is the hardest boundary in the library, for a
reason this test did not know when it was drafted and found with
`node skills/relevance-sweep.mjs`. The sibling's own trigger says
"no-provenance shares" in so many words, and its E33, E34, E35 and E37
already cite the same schema lines this skill's E3, E4, E17 and E18 do.
The overlap is real and it is not a boundary: that skill's step 4 and
judgment item 11 already rule on the DF-cutoff route and on the absent
optional field, which is why step 0 of this skill defers both instead of
restating them.

So the division is narrower than "composition versus denominator". That
skill rules on one of the seven routes and on what may be written down.
This one splits all seven and says which are the product. This prompt
asks whether two figures are the same kind of number, which is
segmentation mode and denominators, and nothing in a decomposition
answers it. Fires here and the user gets two figures split seven ways
and still no ruling on whether they belong in one table.

**6. "We need a third trial for the corpus. Which repo should I point
`ursa run` at?"**

Should not fire. `running-an-outcome-record-trial`'s own trigger.
Nothing has been resolved yet, so there is no share to audit. The
description excludes "choosing a trial subject or running the capture".
The two skills do touch, and the direction is one-way: the trial skill
owns the capture-completeness precondition, and this skill cites it as a
precondition rather than restating it.

**7. "`ursa run` just produced four records for the site project.
Distill them into tuning.json so I can paste the block into ChatGPT."**

Should not fire. `distilling-a-tuning-record`'s own trigger. The
artifact changes under the same vocabulary: the output is `tuning.json`
and not a figure from `outcome_record.json`. Excluded by "turning
labels into tuning axioms". §5e's artifact test is what makes this
boundary the easy one of the eight.

**8. "Add a bound that a record's verbatim-survived character count
never exceeds its generated character count. It is obviously true and
the gate should catch it."**

Should not fire. `adding-a-bound-to-the-record-gate`'s own trigger.
The shape is close in a way the artifact test cannot see, which is
§5r's amendment to §5e: both skills reason about whether a record's
figures are trustworthy. The difference is that a bound is a rule
asserted over every future record, while this skill rules on one
record's figure. The place they genuinely meet is step 2's arithmetic
check, and the skill says there that a mismatch is the gate's business
and not its own.

**9. "The gate workflow is green on my record, so I'm pasting the
conversation into the design doc as the example payload. Any reason
not to?"**

Should not fire. `clearing-a-record-for-release`'s own trigger. It
shares the shape "a green signal is being read as permission", which is
this skill's step 1 argument too, and the object is different: what may
leave the machine, versus what a figure is made of. Excluded by
"deciding whether a passage of raw text may be released".

**10. "The signals block says one loop with two recurrences, but I
count three places she complains about the constellation being dark.
Which one is right?"**

Should not fire. `auditing-a-detected-correction-loop`'s own trigger.
Both are audits of a record block against what really happened, and
both are called an audit, so the verb does not separate them. The block
does: `signals` is settled by no span label and no percentage, while
this skill reads only span reason fields and the class total they sum
to.

**11. "This record says `decayRate: 0`. Can I put 'none of the model's
output was later removed' in the methods note?"**

Should not fire. `auditing-a-durability-walk`'s own trigger. This is
the closest of the four non-span-area boundaries, because it is the same
judgment — a zero that might be an absence, about to be written into a
methods note — applied to a different block. Step 1 of this skill makes
that argument about `blindSpans` [E17] and the durability skill makes
it about `decayRate`. A reader matching on shape will reach for the
wrong one, so the descriptions carry the block names and not the shape:
this one names `no_generation_provenance`, that one names `durability`.

## Why the cut is where it is

§5c says a skill with three or more neighbours is probably describing a
topic, and §5e narrows that test to whether the neighbours name the same
file. Three of them do: `adjudicating-uncertain-spans`,
`quoting-a-number-from-an-outcome-record` and this skill all read
`files[].spans`. So the warning is live and this section is the answer
to it rather than a dismissal.

The cut is by **field**, which is how `skills/README.md` already
separates the sixth and eighth skills from the first three. The
adjudication skill works on a span's `class` and its `candidate`. The
quoting skill works on a figure's denominator. This skill works on the
reason fields — `noCandidate`, `tokenSuppression`, `descent`, and the
absence of all three [E10] — which no other skill in the library reads,
and on the one question those fields exist to answer, which the
resolver's own comment says was answerable only by reading its source
until 2026-10-24 [E6].

The test that this is a piece of work and not a topic: the procedure has
an output a person can be wrong about. It ends in a ruling on what may
be written down, and step 4 lists three of them. A topic would end in a
tour of the fields.

## Added 2026-11-02: the tenth and eleventh skills' boundaries, paid on merge

Both arrived in one merge, from a pull request written before this skill
existed, so neither file carried the other's boundary and §5r's debt
fell due in both directions at once. These two sections are this file's
half.

**12. "This record's `humanDeletedChars` is 92 of 307 generated
characters. Before I call that a discard rate, did anything actually
check whether a merge took them?"**

`attributing-a-deleted-span`'s own trigger 1, and it should not fire
here.

The pull is this skill's own step 1. "Did anything actually check" is
what step 1 asks of every record before any share is believed, so the
prompt arrives in this file's idiom exactly. It is also a figure about
text with no model behind it, which is this file's subject stated
loosely enough to include it.

It should not fire, because the object is the other class. 92 of 307
generated characters is a ratio over characters the model produced and
the work discarded. This skill's share is a ratio over the finished
work, over characters the work kept and no generation explains. The two
never read the same span, and no route in step 2's decomposition touches
`deletion` at all.

The near miss earns its length because the generalisation that would
make it fire is tempting and wrong: that this skill owns every "is the
apparatus or the work talking" question in the record. It owns that
question for one class. The sibling owns it for `deletion`, the
durability skill owns it for the forward walk, and the gate skill owns
it for a rule. Step 0 already refuses to restate a sibling's ruling, and
this is that refusal pointed at a sibling which did not exist when step
0 was written.

**13. "Survival came out at 84.7 percent on the lessons sync run, which
is our best number yet. Putting it in the lab deck."**

`excluding-a-file-from-an-outcome-record`'s own trigger 3, and it should
not fire here.

The hardest near miss in this file. A figure on its way to a lab deck is
this skill's trigger 1 almost word for word, and step 4 exists to rule
on exactly that, so a reader will fire this skill on the deck and the
number alone.

It should not fire, for a reason about which figure is in the prompt.
Survival is the complement class and this skill rules on
`no_generation_provenance`. The two are not interchangeable even though
both are shares of the same finished work, because the characters an
exclusion removes leave both numerators and the denominator at once, so
a correction to one is not a correction to the other. The sibling's
claim is that one imported file may dominate the figure in the prompt,
which is a claim about a path rather than about a route into a class.

The handoff is the one case in this file where this skill goes second.
An exclusion changes `coveredChars`, and every share this skill
decomposes is a ratio over `coveredChars`, so a pending exclusion
question has to be settled before a route split means anything. A prompt
carrying both goes exclusion-side first.
