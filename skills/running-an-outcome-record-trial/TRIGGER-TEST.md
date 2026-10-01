# Trigger test — running-an-outcome-record-trial

Five prompts, written against the `description` field in `SKILL.md`.
Three should activate the skill. Two are near misses that should not.
Per `prompts/skill-extract.md` §5, when the test fails, the description
is what changes, not the test.

There are now two skills about outcome records, so this test carries a
second job beyond activation. It has to show the boundary between this
skill and `adjudicating-uncertain-spans`, which is what near miss 4
exists for.

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

## Added 2026-10-01, third run: the near miss this test was missing

`prompts/skill-extract.md` §5c now asks for one near miss per adjacent
skill, and this test was written when this skill had one neighbour. It
now has two, so a sixth prompt is owed. It is appended rather than
folded into the list above, because the list above belongs to the run
that wrote it and that run's pull request is still open.

**6. "The viewer's tiles say 41, 24, 35 and 30 percent. That is 130.
What is broken?"**

Should not fire. This is `quoting-a-number-from-an-outcome-record`'s
trigger. The record already exists, no subject is being chosen and no
capture path is in question, so nothing in this skill's procedure
applies. The answer is a denominator fact about the tiles, not a fact
about how the trial was run.

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
