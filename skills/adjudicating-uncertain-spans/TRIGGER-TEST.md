# Trigger test — adjudicating-uncertain-spans

Five prompts, written against the `description` field in `SKILL.md` as
of version 0.2.0, per `prompts/skill-extract.md` section 5. Three should
activate the skill and two should not. When this test fails, the
description is what changes, not the test.

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
> first place, for labelling generations, or for reading a record's
> summary statistics.

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
