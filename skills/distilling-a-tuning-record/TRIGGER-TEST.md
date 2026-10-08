# Trigger test — distilling-a-tuning-record

Six prompts, written against the `description` field in `SKILL.md`.
Three should activate the skill. Three are near misses that should not.
Per `prompts/skill-extract.md` §5, when the test fails the description
is what changes, not the test. The budget is three near misses rather
than two because §5c sets one near miss per adjacent skill, and this
skill has three neighbours: every skill now in the library.

Near miss 4 is `quoting-a-number-from-an-outcome-record`'s own trigger,
near miss 5 is `running-an-outcome-record-trial`'s, and near miss 6 is
`adjudicating-uncertain-spans`'. All three fail for one reason, which
is the subject of the note at the end.

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

## Note on the boundary, which is one edge and not three

§5c of `prompts/skill-extract.md` warns that a skill with three or more
neighbours is probably describing a topic rather than a piece of work,
and says the signal means re-cut the skills. This skill has three
neighbours and should not be re-cut, because the three boundaries are
the same boundary counted three times. Every existing skill works on
`outcome_record.json`. This one works on `tuning.json`. The handoff
from the record to the tuning store is a single edge in the pipeline,
and all three near misses above fail by sitting on the record side of
it.

Ours: counting neighbours is the wrong test once a library covers two
artifacts. The test that distinguishes a topic from a piece of work is
whether the skill's inputs and outputs name the same file as its
neighbours'. That is proposed as §5e in `prompts/skill-extract.md` this
run, and this test is the evidence for it.
