# Trigger test — running-an-outcome-record-trial

```counts
prompts: 13
should-fire: 3
near-misses: 10
neighbours: 9
```

The counts above are checked by `node skills/trigger-coverage.mjs`,
which goes red when they drift, per `prompts/skill-extract.md` §5ae,
so they are the only place this file states them. The prompts below
are written against the `description` field in `SKILL.md`.
Per `prompts/skill-extract.md` §5, when the test fails, the description
is what changes, not the test.

This test carries a second job beyond activation: §5c asks one near miss
per adjacent skill, and every other skill in the library is adjacent to
this one, which is the `neighbours` line above. Near misses 4 and 5
are this seat's own wording from the days when this skill had one
neighbour. Near miss 6 was appended on 2026-10-01 for the quoting
skill and rewritten on 2026-10-24, for the reason stated under it.
Near misses 7, 8 and 9 were added on 2026-10-24 and each carries one
sibling's own trigger prompt verbatim.

The measurement that found the gap is `node skills/trigger-coverage.mjs`,
which scored this skill at one of five sibling boundaries carrying the
sibling's own prompt. The description's exclusion clause was widened in
the same commit as near misses 7, 8 and 9, because two of the three
failed against the absence of a hook rather than against a stated
exclusion.

## Should fire

**1. "We need a third trial for the corpus. Which repo should I point
`ursa run` at?"**

The skill's opening situation, and the literal shape of steps 1 and 2. A
subject is being chosen and the constraint it fills has not been named.
Reaches the description through "choosing which finished work to resolve"
and "picking a trial subject", either of which is enough on its own.

**2. "I ran it against my dotfiles repo and it printed `0 work units
found`. What is going on?"**

Never says trial, subject, corpus or capture path. It reaches the skill
only through the "diagnosing a run that found no episodes" clause, which
is in the description for exactly this prompt. This is the case the
skill's sharpest judgment answers, because the usual cause is that the
repo's history has no human commit editing agent output on an
overlapping path, and a repo whose fixes arrive as merges produces
nothing the pair finder can see.

Worth noting that this prompt looks like a bug report. If the
description had stopped at subject selection, the user would be routed
to the engineer and told the resolver was fine, which is true and
useless.

**3. "The new record says 7 percent of generated characters were
deleted. The first one said 82 percent. Did the model get better?"**

One question about two numbers, small enough that a reader might not
think it needs a skill at all. It reaches the description through
"judging what a trial's deletion and survival numbers are allowed to
mean". The answer is no, and the reason is that the two records measured
different stages of the same funnel, which is the one thing about these
numbers that a person reading the record cannot recover from the record.

## Should not fire

**4. "This record has 55 uncertain spans. Work through them and decide
which ones really came from a generation."**

The sharpest of the two, because it shares almost every noun this skill
uses: record, generation, span, decide. It is also a prompt that a
sibling skill answers well, so a false positive here does real damage
rather than merely wasting a load.

The line is that this skill chooses subjects and runs trials, and it
never changes a label inside a record that already exists. The
description says so with "Does not fire for adjudicating spans a record
already flagged uncertain", naming the other skill's trigger word. If
this fires in practice, the fix is to move "planning or running" earlier
and make the excluded list the second sentence rather than the last.

The same clause covers a redaction request, such as "prepare task-001 so
the viewer can be public". That one is excluded by name too, and it
belongs to the security seat's standard rather than to any skill here.

**5. "The session-path CLI will not read our `.py` files. Add `.py` to
`FINAL_EXTS` in `cli.ts` and cover it with a test."**

A near miss built on a fact the skill itself cites. Evidence E9 is the
extension asymmetry between the two paths, and this prompt asks to
remove it. Shares the vocabulary of capture paths and file types
completely.

The line is what the reader is being asked to produce. This skill treats
the asymmetry as a fixed property to design a trial around, in step 4.
Changing it is resolver code, which the description excludes with "Does
not fire for changing the resolver's code". The tell is the imperative
verb: add, write a test. Nothing in the skill's procedure outputs a code
change.

## Ours: what this test does not prove

Three fires and two misses is a check on the description's edges, not on
the body. A description can pass this test and still front a procedure
that fails on contact with a real trial, and the skill's own Limits
section says the procedure is untested for that reason. The trigger test
and `validated: false` are answering two different questions.

## Added 2026-10-01, third run; rewritten 2026-10-24

`prompts/skill-extract.md` §5c now asks for one near miss per adjacent
skill, and this test was written when this skill had one neighbour.
Every other skill in the library is adjacent to it now, which is the
`neighbours` line in the block at the top of this file, so this prompt
was owed and every prompt under the headings below it was owed with it.
It is kept under its own heading rather than folded into the list above,
because the heading is the record of when this boundary was noticed.
Two consequences of keeping it there, both of them mechanical: every
prompt under a non-canonical heading has to state "should not fire" in
its own prose, because that is where `skills/trigger-coverage.mjs` reads
a verdict when there is no canonical heading to inherit from, and a
prompt that states nothing is reported as unclassified rather than
guessed at. The three prompts added below this one were written without
that sentence on the first pass and the tool said so, which is the first
time one of this library's guards has caught a defect in the same run
that introduced it.

**6. "The record's four tiles say 41 percent, 24 percent, 35 percent
and 30 percent. That's 130. What's broken?"**

Should not fire. This is `quoting-a-number-from-an-outcome-record`'s
own trigger. The record already exists, no subject is being chosen and
no capture path is in question, so nothing in this skill's procedure
applies. The answer is a denominator fact about the tiles, not a fact
about how the trial was run.

Rewritten on 2026-10-24, and the rewrite is one sentence of a
measurement worth keeping. The 2026-10-01 version of this prompt said
the same thing in this seat's own words: same four percentages, same
total of 130, same question, "the viewer's tiles" for "the record's four
tiles". `skills/trigger-coverage.mjs` scored that paraphrase at 0.333
against the sibling's trigger, below any defensible floor, and credited
the pair only because the prose names the sibling outright. A paraphrase
tests this test's author. The sibling's own words test the description,
which is the half §5c is asking for, so the sibling's words are now what
is in the file.

## Added 2026-10-24, seventeenth run: the three siblings this test never had

Three skills landed after this file was written, on 2026-10-05,
2026-10-18 and 2026-10-23, and none of them was added at the time. Two
of the three failed, and both failed the same way near miss 7 of the
distilling skill's test failed: the answer was already no, but only
because no clause pointed either way.

**7. "The gate workflow is green on my record, so I'm pasting the
conversation into the design doc as the example payload. Any reason not
to?"**

Should not fire. `clearing-a-record-for-release`'s own trigger, and
the one of the three that did not fail. The old description already excluded "redacting a
record so it can be published", and near miss 4's prose already said
that clause covers a publication request. So the no was stated before
2026-10-24 and the only change is that the clause now says "or
otherwise deciding what may leave the machine", which covers a design
document as well as a published viewer.

Close for a real reason. This skill's own step 4 reasons about what a
record can carry, and a record on the git path carries no user words at
all, which is a fact about disclosure dressed as a fact about capture.
So a reader with that step in mind can think this skill rules on
exposure. It does not. It rules on what a trial can be expected to
produce, before the record exists; the release skill rules on what may
leave, after it does, and it owns the distinction this prompt turns on,
which is that a design document and a disclosure batch are different
exits under opposite rules about raw text.

**8. "Add a bound that a record's verbatim-survived character count
never exceeds its generated character count. It is obviously true and
the gate should catch it."**

Should not fire. `adding-a-bound-to-the-record-gate`'s own trigger,
and the first failure. Close because this skill's whole last step is about not
over-reading a record's numbers, and a bound is a statement about a
record's numbers. The shared vocabulary is complete: record, generated,
survived, character count.

The line is the quantifier, and the old description missed it by one
word. It excluded "changing the resolver's code", and a bound is not
resolver code. It lives in `invariants.ts`, which the gate runs over
every record, and this skill's procedure never opens that file. A trial
reasons about one subject and asks what its numbers may mean; a bound
asserts something about every record there will ever be and is held
against a committed counterexample. The exclusion clause now names gate
work, so a reader who notices the overlap finds the answer rather than
inferring it.

**9. "`ursa run` just produced four records for the site project.
Distill them into tuning.json so I can paste the block into ChatGPT."**

Should not fire. `distilling-a-tuning-record`'s own trigger, the
second failure, and the sharpest prompt in this file. It opens with this skill's own command,
reports a successful trial outcome, and the number four is a corpus
fact of exactly the kind step 1 reasons about. Three of this skill's
four fire conditions concern a record that exists, and a record exists
here.

The line is where this skill stops, and it stops at the record. Its
fourth fire condition is "a record exists and someone is about to quote
a number out of it", and an axiom is not a number quoted out of a
record; it is a claim about a person, written into a different file, by
a pass this skill's procedure does not contain. A reader who fires this
skill here gets correct advice about capture paths, which is true and
useless, exactly as near miss 2 of this test warns in the other
direction.

Worth stating as the weakness of this pair: the overlap is real and not
only lexical. The distilling skill's second step reaches the same
conclusion this skill's step 4 does, that a commit-pair record carries
no user words, and both skills cite it. So the two skills share a fact
and differ in what they do with it. That is why the exclusion had to be
written rather than left to the vocabulary, and the clause now names
"turning a record into tuning axioms".

## Ours: a collision this skill's fire-prompt 3 has with the new sibling

Fire-prompt 3 above, "7 percent against 82 percent, did the model get
better", is also a legitimate trigger for the quoting skill, and that
skill's own fire-prompt 3 is the same shape. Both descriptions claim it.
This is a real overlap and not a wording slip, because the question has
two halves: the capture paths differ, which is this skill's fact, and
the two rates are shares of different generation populations, which is
the quoting skill's. Neither half alone is a complete answer.

Recorded rather than resolved. Resolving it means editing this skill's
description, which belongs to the run that wrote it and to a pull
request the owner has not merged. The ledger entry asks for the ruling
and `skills/README.md` carries the interim order, which puts this skill
first because it owns the path fact the quoting skill cites as evidence.

## Added 2026-10-24, eighteenth run: the seventh skill's boundary

The run that landed `auditing-a-detected-correction-loop` owes a near
miss to every skill already in the library, in their own files, in the
same pull request. That is `prompts/skill-extract.md` §5r, and this
section is this file's payment. The prompt is the new sibling's own
trigger, copied rather than paraphrased, and this skill's `description`
was widened in the same commit to carry the exclusion the prompt found
missing.

**10. "I have the detector's output for task-001 next to the hand-written
`trajectory.md`. KR1.2 wants 3 of the 4 annotated loops recovered with
no hand annotation. How do I score it?"**

`auditing-a-detected-correction-loop`'s own trigger 3, and it should
not fire here. This is the closest of this file's near misses, because
"reading the record it produces without over-reading it" is in this
skill's own description and scoring a detector against a hand
annotation is unmistakably a reading-without-over-reading problem. The
exclusion added for this boundary is what holds the line.

Where the line sits: this skill owns everything up to and including the
record existing, which is the subject, the capture path, the invocation
and the first read of what came out. KR1.2's validation is a comparison
of two trajectory descriptions of a record that already exists, one
emitted and one hand-written, and nothing about it turns on how the
record was captured.

One fact from this skill does belong in the sibling's answer, which is
why the boundary is a handoff rather than a wall: the capture path
decides whether there are any loops to score at all, since the git path
produces no chat trace and therefore an empty loop array. A reader who
chose the wrong path has a trial problem, and that is this skill's.

## Added 2026-10-26, twenty-fourth run: the eighth skill's boundary

The run that landed `auditing-a-durability-walk` owes a near miss to
every skill already in the library, in their own files, in the same
pull request (`prompts/skill-extract.md` §5r). This section is this
file's payment, and the prompt is the new sibling's own trigger,
copied rather than paraphrased.

**11. "Two records, one from the site project and one from alexandria,
report `decayRate` 0.31 and 0.62. Is the second project really twice as
bad at keeping what the model wrote?"**

`auditing-a-durability-walk`'s own trigger 3, and it should not fire
here.

The prompt names two trials this skill chose and ran, and it reads as
a question about the projects, which is this skill's subject. It is
not. It is a question about two measurements, and the first thing it
needs is whether the two walks ended at comparable tips, which is the
new sibling's step 2 and not a property of either repository.

The reason this boundary is worth a near miss rather than being
obvious: the honest answer to the prompt may well end up back here. A
repository whose episodes close at the tip yields nothing to walk, and
the design doc measured exactly that on Ursa's own history, where all
five records came back with no tested spans. If the comparison fails
because one project cannot produce a walkable record at all, the
remedy is a trial choice and this skill owns it.

So the routing is: the durability skill answers whether the two
numbers measured comparable things, and hands back here only if the
answer is that one of the projects was never a viable trial.

## Added 2026-10-26, thirtieth run: the ninth skill's boundary

The run that landed `attributing-a-deleted-span` owes a near miss to
every skill already in the library, in their own files, in the same
pull request (`prompts/skill-extract.md` §5r). This section is this
file's payment, and the prompt is the new sibling's own trigger 1,
copied rather than paraphrased.

**12. "This record's `humanDeletedChars` is 92 of 307 generated
characters. Before I call that a discard rate, did anything actually
check whether a merge took them?"**

`attributing-a-deleted-span`'s own trigger 1, and it should not fire
here.

The pull is a consideration this skill genuinely owns. A repository
with many merges on its branches produces more `merge` attributions and
more `unknown` ones, and a shallow or partial clone produces `unknown`
across the board, so what a subject's git shape will do to the
attribution figures is a trial-selection question and belongs in this
file's step for choosing a subject rather than in the sibling's.

That is a reason to say the boundary out loud, not a reason to fire.
The sibling's whole input is a record that already exists and figures a
run already produced, and the prompt hands it both: a character count,
a denominator and a field name. A prompt choosing a subject has no
record, so it has nothing to attribute, and a prompt holding a record
has nothing left to choose. The two never overlap on one prompt even
though they overlap on one consideration.

## Added 2026-10-26, thirty-second run: the tenth skill's boundary

The run that landed `excluding-a-file-from-an-outcome-record` owes a
near miss to every skill already in the library, in their own files, in
the same pull request (`prompts/skill-extract.md` §5r). This section is
this file's payment, and the prompt is the new sibling's own trigger 1,
copied rather than paraphrased.

**13. "This record excludes `docs/standards/pm.md` as `imported_whole`,
relation `sibling`, dated 2026-10-09T19:00:00-06:00. The work was
generated 2026-10-10T00:00:00Z. Fine to cite the exclusion in the
methods note?"**

`excluding-a-file-from-an-outcome-record`'s own trigger 1, and it should
not fire here. The pull is stronger than it looks, and stronger than it
was for any other sibling in this file, so it is worth being explicit
about why the answer is still no.

Whether a candidate repository carries vendored or synced files is a
first-order trial-selection question. This repository's own second trial
produced a headline survival figure that was 84.7 percent one imported
file, which is a worse outcome than a thin trial would have been, and
nothing in this skill's subject-choice step would have predicted it from
the repository's size or commit count. So the sibling's subject matter
belongs in this skill's deliberation, and the honest form of that is a
consideration in choosing a subject rather than a trigger boundary.

The boundary itself is the same one this file draws for every record
sibling and it does not bend here. Every step the sibling has takes a
record as input: an `exclusions` array to read, a `relation` to judge,
two timestamps to order, `finalChars` to reconcile. The prompt arrives
with all of that already in hand. A prompt choosing a subject has none
of it, because no run has happened, so there is nothing for the sibling
to rule on and no figure yet to be inflated.

Direction, stated plainly: this skill hands the sibling its input, and
the sibling hands this skill a reason to prefer one subject over
another. Neither ordering is needed at trigger time, because a prompt
either holds a record or does not.
