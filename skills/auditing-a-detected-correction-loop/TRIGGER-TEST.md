# Trigger test — auditing-a-detected-correction-loop

Nine prompts, written against the `description` field in `SKILL.md`.
Three should activate the skill. Six are near misses that should not.
Per `prompts/skill-extract.md` §5, when the test fails the description
is what changes and not the test.

The budget is six near misses because §5c sets one per adjacent skill
and this skill has six neighbours, which is every other skill in the
library. Each near miss below is that sibling's own trigger prompt,
copied rather than paraphrased, per §5r, and its prose names which
boundary it tests. Near miss 4 is `quoting-a-number-from-an-outcome-record`'s
trigger 3, 5 is `distilling-a-tuning-record`'s trigger 1, 6 is
`adjudicating-uncertain-spans`' trigger 1, 7 is
`running-an-outcome-record-trial`'s trigger 1, 8 is
`adding-a-bound-to-the-record-gate`'s trigger 1, and 9 is
`clearing-a-record-for-release`'s trigger 1.

§5e's artifact test puts this skill's object cleanly apart from all
six: they work on `files[].spans`, on `stats`, on `tuning.json`, on
`invariants.ts` and on what leaves the machine, and this one works on
`signals`. That is why six boundaries are one edge counted six times
and not a sign the cut is wrong. §5r is why each of the six still had
to be written down: the five record-side siblings share every noun with
this skill, and a reader matches on nouns.

Some reasoning below cites an evidence ref, which §5p permits. A tag
here is fingerprinted and swept exactly like one in `SKILL.md`, so it
is used only where the argument about the description's edge rests on
what the code says.

## Should fire

**1. "The signals block says one loop with two recurrences, but I count
three places she complains about the constellation being dark. Which
one is right?"**

Fires, and it is the prompt this skill exists for. It reaches the
description through "auditing a detected loop against the prompts
behind it" and through reading `recurrences` as what the code computes.
Both answers can be right at once, which is what makes it a skill and
not a lookup: step 4 separates the two readings of the field, since
`recurrences` is `promptSteps.length - 1` [E10] and whether the opening
ask is in `promptSteps` turns on whether it shares two content terms
with the theme [E9]. Step 3 covers the other possibility, that one of
the three complaints was clustered elsewhere and is now a counter in
`notes` rather than any emitted signal [E14].

A reader without this skill answers from the field's doc comment, which
calls it the failure count [E11], and gets a confident wrong answer.

**2. "She says 'you broke what already worked' at step 1 of the
transcript and the record's `regressions` array is empty. Detector bug,
or am I reading the record wrong?"**

Fires through "judging whether a regression the detector emitted or
omitted is real". The answer is neither of the two options the prompt
offers, which is why the skill is worth loading: a regression member
must sit after its theme's first member [E15], so a cue on the theme's
opening complaint is dropped by design. The nearest entries in the
design document's failure-mode list are the lexical floor on
`recurrences` and the unmerged bridging prompt [E24, E25], and neither
is this case; that the list omits it is our reading of the list and not
a claim either bullet makes. Step 6's rule is
to treat an absent regression as unproven rather than absent, and the
output it asks for is every cued prompt listed beside `regressionSteps`.

It should fire even though the prompt reads like a bug report, because
answering it as a bug report sends the reader to the engineer with a
defect that is partly a documentation gap and partly real, and the
skill is what tells those apart.

**3. "I have the detector's output for task-001 next to the
hand-written `trajectory.md`. KR1.2 wants 3 of the 4 annotated loops
recovered with no hand annotation. How do I score it?"**

Fires through "validating the detector's output against hand annotation
under KR1.2". The skill's first obligation here is unwelcome: the
comparison cannot be run in this repository at all, because the record
and its annotation are private-repo material after Ursa incident 2
[E28]. Its second is that the two sides are not like for like even with
access, since the hand-written `discoveredSpec` fields are interpretive
factorizations and the detector emits a quotation with step pointers
[E21, E32]. Scoring them as equal strings understates recovery.

## Should not fire

**4. "Trial three is a prose record and trial two was a repo. Can I put
their no-provenance shares in the same table?"**

`quoting-a-number-from-an-outcome-record`'s own trigger 3, and the
boundary that is hardest to hold, because this skill's own central
argument is about a number that cannot be compared across records. It
must not fire. The object here is `no_generation_provenance`, a span
class over `files[].spans` summarised in `stats`, and the description
excludes "writing a signal number into a document a reader will trust"
precisely so that the comparability question about a span share routes
to the sibling that owns the denominators.

The honest statement of the edge: if the prompt asked the same question
about `recurrences` instead of no-provenance shares, both would fire,
and the order is quoting-side second. This skill says what the field
counts in each record; the quoting skill rules on whether the sentence
may go in the table. Step 4's output is written as an input to that
ruling and not as a substitute for it.

**5. "`ursa run` just produced four records for the site project.
Distill them into tuning.json so I can paste the block into ChatGPT."**

`distilling-a-tuning-record`'s own trigger 1. It must not fire, and
the pull is real, because the distiller is the component this skill
keeps pointing at: `feedbackTranslations` and `repairAttempts` are left
empty by the detector on the grounds that naming a mechanism is the
distiller's judgment [E20]. Pointing at a component is not owning it.
The description excludes "turning signals into axioms about the user",
and that exclusion is what sends this prompt to the sibling.

There is also a mechanical tell the description does not need to carry:
`ursa run` is the launch-based path, so these four records have no chat
trace and therefore no loops at all [E1, E3]. A prompt about distilling
`ursa run` output cannot be about a detected loop.

**6. "The record for task-001 has 55 uncertain spans. Work through them
and decide which ones really came from a generation, then commit the
adjudication next to the record."**

`adjudicating-uncertain-spans`' own trigger 1. It must not fire. Both
skills settle something the resolver could not settle alone, which is
the shape a reader matches on, and the objects are different: that one
rules on a span's descent, this one on a trajectory entry. The
description excludes "the class on any individual span".

The two do meet on task-001 and the meeting does not blur the edge.
Adjudicating the 55 spans changes which generations have surviving
characters, which is the input `closedStep` is computed from [E12], so
an adjudication pass can move a loop's resolution. That makes this
skill downstream of that one on the same record, and downstream is not
the same as overlapping.

**7. "We need a third trial for the corpus. Which repo should I point
`ursa run` at?"**

`running-an-outcome-record-trial`'s own trigger 1. It must not fire.
The description excludes "producing a record or choosing what work to
resolve", and the ordering is the reverse of near miss 6: the trial
skill chooses the subject and the capture path, and only once a record
exists is there a signals block to audit.

Worth stating because the choice has a consequence this skill cares
about: pointing at a repo selects the label stage, where the loop array
is empty by construction [E3]. A reader who wanted trajectory signals
and got none has a trial-selection problem and not an audit problem,
and the trial skill is where that is decided.

**8. "Add a bound that a record's verbatim-survived character count
never exceeds its generated character count. It is obviously true and
the gate should catch it."**

`adding-a-bound-to-the-record-gate`'s own trigger 1. It must not fire.
§5e says the artifacts do not overlap, since that skill's object is
`invariants.ts` and its committed counterexamples, and §5r says to
write the boundary down anyway because the judgment has the same shape:
both ask whether a confident statement about a record is carried by
what the record actually holds.

The edge is directional and mechanical. A bound can only catch a record
contradicting itself, so no bound could ever catch the step 4 or step 6
findings: a loop reporting `recurrences: 2` is internally consistent
with its own `promptSteps`, and the problem is what the number means
rather than whether it adds up. If an audit under this skill concludes
a rule about every record should exist, that proposal crosses to the
gate skill, and it crosses as a proposal.

**9. "The gate workflow is green on my record, so I'm pasting the
conversation into the design doc as the example payload. Any reason not
to?"**

`clearing-a-record-for-release`'s own trigger 1. It must not fire, and
the overlap is sharper than it looks, because the thing being pasted is
`conversations[].prompts[].text`, which is the exact raw material this
skill reads in steps 2, 3 and 6. Reading the user's verbatim prompts to
audit a loop and releasing them are different acts on one object, and
the description excludes "deciding what may leave the machine".

The trap worth naming: every signal this skill audits carries quotes of
her own words, addressed as data so the gate can re-read them [E22].
So a loop audit produces exactly the artifact that release ruling is
about, and an auditor who has just read a transcript is the person most
likely to quote from it. Both directions are release-side first,
because nothing should be pasted anywhere while the question of whether
it may leave is open.
