# Trigger test — adjudicating-uncertain-spans

Five prompts, written against the `description` field in `SKILL.md` as
of version 0.1.0, per `prompts/skill-extract.md` section 5. Three should
activate the skill and two should not. When this test fails, the
description is what changes, not the test.

The description under test:

> Use when a provenance resolver has produced an outcome record and some
> of its spans are flagged uncertain, and a human or agent has to decide
> span by span whether the flagged text descends from a model generation
> or from the person. Fires for adjudicating uncertain or low-confidence
> span labels, for building the ground-truth set that match thresholds
> are retuned against, and for judging whether a final span and a
> candidate generation are actually ancestor and descendant. Does not
> fire for producing a record in the first place, for labelling
> generations, or for reading a record's summary statistics.

## Should fire

**1. "The record for task-001 has 55 uncertain spans. Work through them
and decide which ones really came from a generation, then commit the
adjudication next to the record."**

Fires. This is the skill's exact situation and the wording matches three
separate hooks in the description: an outcome record, spans flagged
uncertain, and a span-by-span decision about descent. It is also the
literal shape of O1 KR1.1, which is the work the skill was written to
serve.

**2. "Our false-positive rate on survived_mutated is too high. Build a
ground-truth set from the low-confidence matches so we can retune the
0.35 and 0.6 thresholds."**

Fires. The prompt never says "uncertain" and never says "adjudicate",
which is the point of including it. It reaches the skill through the
second clause of the description, building the ground-truth set that
thresholds are retuned against. The description was written with that
clause specifically so a threshold-tuning request lands here, since
step 6 of the procedure is the only place that says retuning comes
after adjudication rather than before it.

**3. "This paragraph in the finished doc scored 0.48 against a model
turn. Is that the ancestor of it or did I write it myself?"**

Fires. One span, one candidate, one descent question. The description's
third clause covers exactly this, and the judgment section's
idea-versus-vocabulary test is the answer the prompt is asking for. It
is a useful case because it is small enough that a reader might not
think of it as needing a skill at all.

## Should not fire

**4. "Run the resolver over fixtures/mini and generate the outcome
record and viewer."**

Does not fire. This is production of a record, which the description
excludes by name. The near miss is real, because the prompt shares
almost all of the skill's vocabulary: resolver, outcome record, viewer,
spans by implication. What separates them is that no verdict is being
asked for and nothing has been flagged yet. Sprint item 3 of
`sprint-2026-09-21` is this prompt, and it belongs to the engineer seat.

**5. "Read the record's stats and tell me the survival rate per model
and how much of the final work has no generation provenance."**

Does not fire. Summary statistics, excluded by name in the last clause.
This one is the sharper near miss of the two, because it names
`no_generation_provenance` directly, which is the class the skill spends
most of its judgment section on. The distinction is that the prompt
consumes labels the resolver already assigned and asks no one to decide
anything, whereas the skill exists to change labels. Worth watching: if
in practice this prompt does activate the skill, the fix is to move
"decide" earlier and make it the first verb in the description.
