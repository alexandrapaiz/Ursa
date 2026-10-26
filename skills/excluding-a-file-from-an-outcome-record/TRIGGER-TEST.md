# Trigger test — excluding-a-file-from-an-outcome-record

Twelve prompts, written against the `description` field in `SKILL.md`.
Three should activate the skill. Nine are near misses that should not.
Per `prompts/skill-extract.md` §5, when the test fails the description
is what changes and not the test.

The budget is nine near misses because §5c sets one per adjacent skill
and this skill has nine neighbours, which is every other skill in the
library. Each near miss below is that sibling's own trigger prompt,
copied rather than paraphrased, per §5r, and its prose names which
boundary it tests. Near miss 4 is
`quoting-a-number-from-an-outcome-record`'s trigger 1, 5 is
`attributing-a-deleted-span`'s trigger 1, 6 is
`adjudicating-uncertain-spans`' trigger 1, 7 is
`running-an-outcome-record-trial`'s trigger 1, 8 is
`auditing-a-durability-walk`'s trigger 1, 9 is
`auditing-a-detected-correction-loop`'s trigger 1, 10 is
`distilling-a-tuning-record`'s trigger 1, 11 is
`adding-a-bound-to-the-record-gate`'s trigger 1, and 12 is
`clearing-a-record-for-release`'s trigger 1.

§5e's artifact test does not separate this skill from its record
neighbours, and saying so is cheaper than claiming otherwise.
`exclusions[]` sits at the top level of `outcome_record.json`, which is
the file six skills in this library work on, and the two figures an
exclusion moves sit in `stats`, which is the block the quoting skill
rules on. So by §5c's letter the cut is suspect.

What separates it is the altitude of the decision rather than the file
it lives in. Every other record skill rules on a span, a figure, or a
derived block, and the unit it touches is at most one classified region
of one file. This one rules on whether a path is in the record at all.
A refusal here does not move a label, it removes the path from
`files[]`, from `coveredChars`, and from every percentage computed over
them at once [E18, E16]. That is why the gate's own comment calls the
file-level mistake the more expensive one [E18], and it is why a reader
who arrives span-first never finds the question: there is no span to
read, which is the whole point.

Some reasoning below cites an evidence ref, which §5p permits. A tag
here is fingerprinted and swept exactly like one in `SKILL.md`, so it
is used only where the argument about the description's edge rests on
what the code says.

## Should fire

**1. "This record excludes `docs/standards/pm.md` as `imported_whole`,
relation `sibling`, dated 2026-10-09T19:00:00-06:00. The work was
generated 2026-10-10T00:00:00Z. Fine to cite the exclusion in the
methods note?"**

Fires, and it is the prompt this skill exists for. It reaches the
description through "judging the three `relation` values and the one of
them whose claim rests on a clock", which is step 4.

It is not fine, and the reason is the one thing in the entry a reader
checks last. The dates in the prompt are in different zones, so they do
not compare by eye: the exclusion's date is 2026-10-10T01:00:00Z, which
is one hour *after* the work closed. A `sibling` exclusion claims the
finished file is byte-identical to a copy on a branch outside this work,
so a copy made after the work closed is a copy *of* it, and the refusal
is backwards [E15]. The identity still holds. What fails is the
direction, which no other field in the entry records.

Ours, measured on the committed fixture at
`ursa-major/fixtures/violations/exclusion-not-classified-after-final.json`,
which is this prompt's source:

```
python3 -c "
import json
from datetime import datetime
r=json.load(open('ursa-major/fixtures/violations/exclusion-not-classified-after-final.json'))
e=r['exclusions'][0]
d=datetime.fromisoformat(e['date'])
g=datetime.fromisoformat(r['task']['generatedAt'].replace('Z','+00:00'))
print(e['relation'], d.isoformat(), g.isoformat(), 'after?', d>g)"
```

prints `sibling 2026-10-09T19:00:00-06:00 2026-10-10T00:00:00+00:00
after? True` on this tree. The sibling fixture one directory over,
`exclusion-not-classified.json`, is the same entry two hours earlier and
prints `False`, which is the pair that makes the field load-bearing
rather than decorative.

**2. "The alexandria record has no `exclusions` key. So nothing in that
run was imported, and I can use `finalChars` as the size of the work."**

Fires, and it is the most valuable of the three, because the user is not
asking a question and both halves of the sentence are wrong in the same
way. It reaches the description through "deciding whether a record with
no `exclusions` key asked the question and came back clean or never
asked", which is step 1.

An absent key does not mean nothing was imported. It means the caller
never asked. Exclusions are computed at the edge and carried onto the
record unchanged, so a caller that did not pass them leaves the field
off entirely, and the code refuses to write an empty array precisely
because an empty array would make the claim the user just made [E23].
Three states, two of which look alike from the record, and the
discriminator is the presence of the key rather than its contents.

Ours, measured on the only committed record in the tree:

```
python3 -c "import json;r=json.load(open('ursa-major/fixtures/mini/record/outcome_record.json'));print('exclusions' in r, r['stats']['finalChars'])"
```

prints `False 314` on this tree, so even the library's own fixture is in
the state this prompt misreads.

**3. "Survival came out at 84.7 percent on the lessons sync run, which
is our best number yet. Putting it in the lab deck."**

Fires. It reaches the description through "auditing a survival figure
that one imported file may dominate", which is step 6 into the judgment
section.

This is the failure that already happened in this repository rather than
a hypothetical. One file arrived by a sync commit copying it from
another repository, the resolver read all 63,362 characters of it as
model output and 60,616 as text the person kept, and the exclusion
module structurally could not refuse it, because an import from a
different repository never existed in this object store for a blob
search to find [E5]. The figure in the prompt is that file. A reader
without this skill checks the arithmetic, finds it correct, and ships a
survival number that is mostly someone else's text, which is the one
error in this library that reaches a buyer as a claim about the model.

## Near misses

**4. "I'm re-grounding the methods doc for KR2.1. The draft says 82.1
percent of generated characters were deleted. Is that still the right
way to say it?"**

Should not fire. This is `quoting-a-number-from-an-outcome-record`'s own
trigger 1, and it tests the closest boundary this skill has, because
step 6 is entirely about figures and that skill owns figures.

The division is which way the figure is wrong. That skill rules on what
a stored number is a share of, and the prompt's number is a share of
generated characters, a denominator no exclusion touches: an exclusion
removes a path from the final side, from `finalChars` and
`coveredChars` [E16], and the generated side of the record is whatever
the transcript held. So this prompt's denominator is intact however many
exclusions the record carries, and there is nothing here for this skill
to do.

The ordering rule, stated once and the same in both files: a prompt that
genuinely spans the two is handled exclusion-side first, because what a
number is a share of cannot be settled until it is settled which paths
are in the population at all. That is the reverse of the order the
deletion skill takes with the same sibling, and the reason is that a
deletion cause is read out of a figure while an exclusion changes the
figure's domain.

**5. "This record's `humanDeletedChars` is 92 of 307 generated
characters. Before I call that a discard rate, did anything actually
check whether a merge took them?"**

Should not fire. `attributing-a-deleted-span`'s own trigger 1, and the
most instructive near miss in this file, because the two skills are the
only ones in the library whose answer can be "this clone could not tell"
rather than a value.

They are also the pair whose defaults point opposite ways, which is the
cleanest way to hold them apart. The deletion module, failing to read a
merge, attributes the deletion to `unknown` and keeps the span. This
module, failing to read the history at a path, resolves the file
normally and excludes nothing, because a path this clone cannot report
on is not an import and is not reported as one [E8]. This skill's own
step 8 names the overlap honestly and in one direction only: excluding a
`pre_existing` file discards a real `generated_deleted` story along with
the false survival labels [E9]. That is a cost this skill records about
its own output, not a deletion question it answers. A prompt holding a
deletion figure has a span and a cause to settle, and this skill has
neither once a path is gone.

**6. "The record for task-001 has 55 uncertain spans. Work through them
and decide which ones really came from a generation, then commit the
adjudication next to the record."**

Should not fire. `adjudicating-uncertain-spans`' own trigger 1, testing
the boundary with the skill that settles labels the resolver could not.

Both skills ask whether a generation explains text in the finished work,
which is the shared shape a reader matches on, and the available fact is
at a different grain in each. Adjudication's unit is a span and its
evidence is a similarity score the resolver could not call. This skill's
unit is a path and its evidence is a blob object id, which is equality
and admits no score [E2]. The description's own exclusion line says it
does not fire for whether an individual span descends from a generation,
and `SKILL.md` gives the reason rather than asserting the edge: the
per-span test is the right backstop and the wrong primary, measured as
seven span-level firings in one vendored file plus nine more the length
floor could not judge [E1]. So the span-level question is real here and
is answered one level down, by that skill.

**7. "We need a third trial for the corpus. Which repo should I point
`ursa run` at?"**

Should not fire. `running-an-outcome-record-trial`'s own trigger 1,
testing the boundary with the skill that chooses what to resolve.

There is a real pull, and it is stronger here than it was for the
deletion skill. Whether a candidate repository carries vendored or
synced files is a first-order trial-selection question, since this
repository's own second trial produced a headline figure that was 84.7
percent one imported file [E5]. The trial skill owns it anyway, for the
same reason it owns capture-path choice: a prompt choosing a subject has
no record, so there is no `exclusions` array to read, no `relation` to
judge and no `finalChars` to reconcile. Every one of this skill's eight
steps takes a record as input.

**8. "This record says `decayRate: 0`. Can I put 'none of the model's
output was later removed' in the methods note?"**

Should not fire. `auditing-a-durability-walk`'s own trigger 1, testing
the boundary with the other skill whose block is computed outside the
resolver.

The two prompts have the same shape, a zero or an absence read as a
result, and this skill's own should-fire 2 is that shape. What separates
them is which absence. Durability's question is about time after the
closing commit, over text that survived. This skill's question is about
whether a path should have been in the walk's population in the first
place, and it is settled at the closing commit and not after. The
sharper point is the direction of the error: an imported file inflates
durability exactly as it inflates survival, because the text sits in the
finished tree and nobody touches it. So a durability figure over an
unrefused import is high for the same reason and is still that skill's
figure to qualify.

**9. "The signals block says one loop with two recurrences, but I count
three places she complains about the constellation being dark. Which one
is right?"**

Should not fire. `auditing-a-detected-correction-loop`'s own trigger 1,
testing the boundary with the skill that rules on `signals`.

This is the easiest of the nine and the reason is worth stating anyway.
That skill's evidence is the transcript, a sequence of prompts, and this
skill's evidence is the object store, a set of blobs. They do not meet
in the record: `signals` is computed from what the person said and
`exclusions` from what git holds, and no exclusion changes a recurrence
count. The one place a reader could cross is prose, where an import the
record failed to refuse makes the person look satisfied with text she
never read, and that is a claim about survival figures rather than about
the loop.

**10. "`ursa run` just produced four records for the site project.
Distill them into tuning.json so I can paste the block into ChatGPT."**

Should not fire. `distilling-a-tuning-record`'s own trigger 1, testing
the boundary across the handoff out of the record.

§5e's artifact test separates these cleanly, since that skill's object
is `tuning.json`. The pull is one step removed and is the same shape as
the deletion skill's: an axiom resting on a file the person never wrote
is an axiom resting on this skill's refusal having been made, and an
unrefused import is the worst input a distillation can get, because
64,000 characters of someone else's prose read as kept text will carry
any axiom the distiller cares to draw. The honest place to say so is
this skill's judgment section, which is where the 84.7 percent figure
sits, and not a trigger on a distillation prompt.

**11. "Add a bound that a record's verbatim-survived character count
never exceeds its generated character count. It is obviously true and
the gate should catch it."**

Should not fire. `adding-a-bound-to-the-record-gate`'s own trigger 1,
testing the boundary with the skill whose object is the checker rather
than the record.

This skill reads three bounds and one audit check as evidence about what
a record cannot get away with: `EXCLUSION_NOT_CLASSIFIED` holds that a
path is not simultaneously an import and a source of labels [E18],
`PERFILE_ENUMERATES_PATHS` holds that the rows are exactly the
classified paths plus the excluded ones, each once [E21], and the audit
checks that a row's `excluded` reason matches its entry [E24]. That is a
use of the gate and not a question about it. The asymmetry worth naming
is that the gate can catch a refusal that was computed and not applied,
because both sides of that contradiction are in the record, and it can
never catch a refusal that should have been made and was not, because no
record carries the object store that would settle it. A prompt proposing
or changing a bound is the gate skill's.

**12. "The gate workflow is green on my record, so I'm pasting the
conversation into the design doc as the example payload. Any reason not
to?"**

Should not fire. `clearing-a-record-for-release`'s own trigger 1,
testing the boundary with the skill that rules on what may leave the
machine.

The near miss is close in one respect worth naming, and it is not the
one the shape suggests. An exclusion entry carries a commit `sha` and
that commit's subject line, kept so the record names the import in the
commit author's own words [E14], which is text that entered the record
from the history rather than from the episode's transcript. That makes
exclusions something the release skill has to rule on, and it rules on
it there. One correction to the obvious version of this argument, since
it is the error this prose nearly shipped: the sha is not a commit in
another repository. For `imported_whole` it is a commit in this
repository outside the generation's descent, and for `declared_import`
it is the episode's own generation or final commit [E14]. The content
came from elsewhere; the commit naming it did not.

This skill rules on whether the refusal the entry records is true. Both
directions are handled record-side first, because nothing can be cleared
for release until it is settled what it says.
