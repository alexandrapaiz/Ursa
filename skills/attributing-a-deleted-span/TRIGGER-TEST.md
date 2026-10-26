# Trigger test — attributing-a-deleted-span

Eleven prompts, written against the `description` field in `SKILL.md`.
Three should activate the skill. Eight are near misses that should not.
Per `prompts/skill-extract.md` §5, when the test fails the description
is what changes and not the test.

The budget is eight near misses because §5c sets one per adjacent skill
and this skill has eight neighbours, which is every other skill in the
library. Each near miss below is that sibling's own trigger prompt,
copied rather than paraphrased, per §5r, and its prose names which
boundary it tests. Near miss 4 is
`quoting-a-number-from-an-outcome-record`'s trigger 1, 5 is
`adjudicating-uncertain-spans`' trigger 1, 6 is
`auditing-a-durability-walk`'s trigger 1, 7 is
`running-an-outcome-record-trial`'s trigger 1, 8 is
`auditing-a-detected-correction-loop`'s trigger 1, 9 is
`distilling-a-tuning-record`'s trigger 1, 10 is
`adding-a-bound-to-the-record-gate`'s trigger 1, and 11 is
`clearing-a-record-for-release`'s trigger 1.

§5e's artifact test does not separate this skill from four of its
neighbours, and saying so is cheaper than claiming otherwise. The
`deletion` block sits on `generations[].spans[]` inside
`outcome_record.json`, which is the file the record skills work on, and
the three figures it governs sit in `stats.generated`, which is the
block the quoting skill rules on. So by §5c's letter the cut is
suspect.

What separates it is which question the block answers. Every other
block of a record is computed from the record's own inputs: the final
files, the transcript, the generations. This one is computed from
something no part of the record contains, the git trees of the merge
commits standing between the generation and the closure, and it is
computed by a function the resolver does not have and the caller has to
inject [E9]. So this is the one block of an outcome record that can be
absent, defaulted, or wrong because of the clone rather than because of
the work, and a reader who does not know that reads a default as a
measurement. The near-miss budget stays at one per neighbour, per
§5r's amendment to §5e.

Some reasoning below cites an evidence ref, which §5p permits. A tag
here is fingerprinted and swept exactly like one in `SKILL.md`, so it
is used only where the argument about the description's edge rests on
what the code says.

## Should fire

**1. "This record's `humanDeletedChars` is 92 of 307 generated
characters. Before I call that a discard rate, did anything actually
check whether a merge took them?"**

Fires, and it is the prompt this skill exists for. It reaches the
description through "deciding whether `humanDeletedChars` may be called
a discard rate on this clone" and through "auditing a discard figure
that was computed with no attributor injected", either of which is
enough on its own.

The answer on the record this prompt is drawn from, the committed
fixture at `ursa-major/fixtures/mini/record/outcome_record.json`, is
that nothing checked and nothing needed to. Its `task` carries no
`artifact` field, so it is a chat-path record [E10], where the final
file is the file on disk and no merge sits in between [E9]. That is step 1,
and it is the whole answer. The same numbers on a `repo`-path record
would be step 2's question instead.

Ours, measured:

```
python3 -c "import json;r=json.load(open('ursa-major/fixtures/mini/record/outcome_record.json'));print(r['task'].get('artifact'), r['stats']['generated']['humanDeletedChars'], r['stats']['generated']['mergeDeletedChars'])"
```

prints `None 92 0` on this tree.

A reader without this skill answers from the field name, which says
`human` in it, and writes a sentence about a person out of a number
that on a repo-path record may be the sum of everything the clone could
not read.

**2. "Three spans in this record say `cause: unknown` with
`unreadable_merge_commit`. What do I fetch?"**

Fires. It reaches the description through "separating the three
`unknownReason` values and naming the fetch that would settle each",
which is step 3, and the prompt has already done half the work by
quoting the reason.

The answer is the base ref, which is the one of the three reasons whose
own comment names its fix [E3]. Worth firing for even though the prompt
looks like a one-line lookup, because step 4 is the part the prompt
cannot see: the sha the record carries is the first unreadable boundary
the scan found, not the only one [E7, E8], so a reader who fetches that
one commit and re-runs can get the same three spans back with a
different sha.

**3. "`mergeDeletedChars` is 0 on the alexandria run. Good, no merges
got in the way."**

Fires, and it is the second-most valuable of the three, because the
user is not asking a question. It reaches the description through
"deciding whether a zero in `mergeDeletedChars` is a measurement or a
default".

A zero in that field has two readings that look identical from the
record: no intervening merge destroyed anything, which is a result, and
no attributor was injected or no merge was readable, which is not. The
discriminator is not in `stats` at all. It is the episode's two merge
lists, where an absent unreadable-shas list is what makes an empty
intervening-merges list mean "none" rather than "unknown" [E11]. The
second trial named in the prompt was over a repository with many
contributors, which is where this reading is most likely to be wrong
and most expensive.

## Near misses

**4. "I'm re-grounding the methods doc for KR2.1. The draft says 82.1
percent of generated characters were deleted. Is that still the right
way to say it?"**

Should not fire. This is `quoting-a-number-from-an-outcome-record`'s
own trigger 1, and it tests the boundary with that skill, which is the
closest boundary this skill has and the one most likely to be crossed
in the wrong direction.

Both skills rule on the same four fields. The division is which half of
the sentence is in question. That skill rules on what a number is a
share of: `deletedPct` divides by generated characters rather than by
the finished work, and the numerator has `not_generated` subtracted out
of it. This skill rules on whether the numerator names a person at all.
This prompt is entirely the first question. It quotes a gross figure,
`deletedPct`, which is not a claim about the human in the first place
[E13], so no attribution question arises until the sentence is narrowed
to the human share, and narrowing it is that skill's step rather than
this one's.

The ordering rule, stated once and the same in both files: a prompt
that genuinely spans the two is handled quoting-side first, because a
cause cannot be audited until it is settled which population the figure
covers.

**5. "The record for task-001 has 55 uncertain spans. Work through them
and decide which ones really came from a generation, then commit the
adjudication next to the record."**

Should not fire. `adjudicating-uncertain-spans`' own trigger 1, testing
the boundary with the skill that settles labels the resolver could not.

Both skills take a span and ask what happened to it, which is the
shared shape a reader matches on. The difference is which question is
already answered. Adjudication asks whether the span descends from a
generation at all, and it runs on spans flagged `uncertain`, which is a
flag about a score. This skill starts after the fate is settled: it
only ever looks at a span whose fate is already `generated_deleted`,
and it asks what destroyed it. A span this skill could rule on is never
`uncertain`, because an uncertain span is one the resolver could not
place and this skill's input is one it placed in the deleted class.

**6. "This record says `decayRate: 0`. Can I put 'none of the model's
output was later removed' in the methods note?"**

Should not fire. `auditing-a-durability-walk`'s own trigger 1, and the
most instructive near miss in this file, because the two skills are the
only ones in the library whose block is computed from git rather than
from the record.

They read git in opposite directions, and a reader can tell them apart
on the prompt alone by asking which side of the closing commit the
question is about. Durability walks forward from the closing commit to
whatever HEAD was when it ran, over text that survived the episode.
This skill tests backward, at the merge boundaries that sit inside the
episode, over text that did not survive it. The prompt's own words put
it on the far side: "later removed" is text that was in the finished
file and then was not, which is decay and not deletion. Nothing with a
`deletion` block ever reached the finished file.

**7. "We need a third trial for the corpus. Which repo should I point
`ursa run` at?"**

Should not fire. `running-an-outcome-record-trial`'s own trigger 1,
testing the boundary with the skill that chooses what to resolve.

There is a real pull here, because the right answer to the prompt is
partly about merges: a repository with many merges on its branches will
produce more `unknown` and more `merge` attributions, and that is a
trial-selection consideration. The trial skill owns it anyway. This
skill's whole input is a record that exists, and it rules on figures a
run already produced. A prompt choosing a subject has no record and
therefore no figures, so there is nothing here to attribute.

**8. "The signals block says one loop with two recurrences, but I count
three places she complains about the constellation being dark. Which
one is right?"**

Should not fire. `auditing-a-detected-correction-loop`'s own trigger 1,
testing the boundary with the other skill that audits a derived block
against what actually happened.

The shape is nearly identical and the object is not. That skill rules
on `signals`, a block about the sequence of prompts, and its evidence
is the transcript. This one rules on `deletion`, a block about one
span's absence, and its evidence is git trees. The two meet in prose
and nowhere in the record: a correction the person expressed by
deleting text is a `human_edit` attribution here and may or may not
appear as a loop there, and neither block is computed from the other.

**9. "`ursa run` just produced four records for the site project.
Distill them into tuning.json so I can paste the block into ChatGPT."**

Should not fire. `distilling-a-tuning-record`'s own trigger 1, testing
the boundary across the handoff out of the record.

§5e's artifact test does separate these two cleanly, which makes this
the easiest of the eight. That skill's object is `tuning.json` and its
question is what the record means about the user. This skill's object
is a block inside `outcome_record.json` and its question is what
happened to one span. The pull that exists is one step removed: an
axiom resting on deletions the person did not make is an axiom resting
on this skill's output being right, and the honest place to say so is
this skill's own step 7 about naming the clone, not a trigger on a
distillation prompt.

**10. "Add a bound that a record's verbatim-survived character count
never exceeds its generated character count. It is obviously true and
the gate should catch it."**

Should not fire. `adding-a-bound-to-the-record-gate`'s own trigger 1,
testing the boundary with the skill whose object is the checker rather
than the record.

This skill cites a bound, `DELETION_SPLIT_EXACT`, and reads it as
evidence about what the figures cannot do: the gate holds the identity
[E14], and the identity is true by construction, because the human
share is whatever the gross figure has left after the other two are
subtracted [E12], so the four fields add up whether or not any of them
is right. That is a use of the
gate and not a question about it. A prompt proposing a bound, changing
one, or asking whether a violation means the bound or the resolver is
wrong, is the gate skill's, and the direction is not symmetric. Whether
a deletion was a merge's doing is never a gate question, because a
bound can only catch a record contradicting itself and no record
carries the git trees that would settle a cause.

**11. "The gate workflow is green on my record, so I'm pasting the
conversation into the design doc as the example payload. Any reason not
to?"**

Should not fire. `clearing-a-record-for-release`'s own trigger 1,
testing the boundary with the skill that rules on what may leave the
machine.

The near miss is genuinely close in one respect worth naming: this
skill's step 7 says a quoted discard figure is a figure about a clone,
which sounds like a rule about quoting something outward, and the
release skill rules on quoting a record into a document. The line is
that the release skill rules on whether text or a number may leave at
all, and the three exits have opposite rules about raw text. This skill
rules on whether the number is true before anyone asks whether it may
leave. Both directions are handled record-side first, because nothing
can be cleared for release until it is settled what it is.

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
not fire here. These two skills are the closest pair in the library on
one axis that matters: they are the only two whose evidence is git
rather than the record, so both can return "this clone could not tell"
instead of a value, and both are therefore read wrong in the same way by
anyone who takes their fields at face value.

The cheapest discriminator is the direction each one reads git, and it
separates them completely. This skill reads trees at the merge
boundaries *inside* the episode, to find out what destroyed a span that
did not survive. The sibling reads blob object ids *outside* the
generation's line of descent, to find out whether text that did survive
was ever composed here at all. Deleted text and imported text are
disjoint populations: nothing with a `deletion` block reached the
finished file, and an exclusion is only ever about a path that did.

Their defaults also point opposite ways, which is worth holding onto
because it is the one place a reader can be wrong in both directions at
once. This skill, unable to read a merge, attributes the deletion to
`unknown` and keeps the span, so silence does not fall on the person.
The sibling, unable to read a path's history, excludes nothing and
resolves the file normally, so a hole in the clone does not cost real
correction signal. Same class of failure, opposite safe answer, and each
module says in its own comments that it is the opposite of the other's.

One real overlap, and it runs from the sibling to here rather than the
other way. Excluding a `pre_existing` file discards a true
`generated_deleted` story along with the false survival labels, which
is a cost the sibling's own procedure records about its output. That is
a note the sibling owes, not a deletion cause this skill can attribute,
because once a path is excluded there is no span here to carry one.
