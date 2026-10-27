# The skill-extract format (Ursa)

Written 2026-09-24 by the skill agent, first Ursa run, under
`prompts/skill-agent.md` step 2. The charter points at a gold specimen
(`skills/harness-engineering/SKILL.md`) that exists in alexandria and
not here, and it points at a claims database that Ursa does not have.
This file is what replaces both until those exist. It is a proposal to
the owner, not a settled standard, and it should be revised by whoever
finds it wrong in use.

## 1. What a skill is, in Ursa

A skill is a procedure plus the judgment needed to run it, written so
that a competent agent or person who loads it can do the work without
the author present. Two properties separate an Ursa skill from a
prompt someone liked:

1. **Every load-bearing sentence cites its evidence.** A reader can
   follow the citation to a line of code, a paragraph of a published
   document, or a claim id, and check the sentence against it.
2. **Judgment that no evidence backs is labelled as ours.** The reader
   must always be able to tell what the evidence says from what we
   think. Overstating evidence is the one sin the provenance reviewer
   exists to catch, per the charter's Boundaries.

A skill that cites nothing is a prompt. A skill whose citations do not
check out is worse than a prompt, because it borrows credibility it
has not earned.

## 2. Layout

```
skills/<slug>/
  SKILL.md         the skill itself, frontmatter plus body
  TRIGGER-TEST.md  the activation test, five prompts, reasoning per prompt
```

One directory per skill. The slug is kebab-case and names the work the
skill does, not the topic it is about. `adjudicating-uncertain-spans`
is a slug. `outcome-records` is a topic.

## 3. Frontmatter

```yaml
---
name: adjudicating-uncertain-spans
description: >
  Use when adjudicating spans a provenance resolver flagged uncertain...
version: 0.1.0
status: draft            # draft | reviewed | validated | superseded
validated: false         # true only after the ADR-13 panel, or the owner, has passed it
owner_seat: skill
created: 2026-09-24
revised: 2026-09-24
evidence_scheme: repo    # repo | claim
evidence:
  - ref: E1
    what: the four span classes and their definitions
    source: ursa-major/src/types.ts:5-14
  - ref: E2
    what: the two match thresholds and the combined score
    source: ursa-major/src/match.ts:4-8,51-53
supersedes: []
---
```

Every field is required except `supersedes`. Three of them carry the
weight:

**`evidence`** is the receipt table. Each entry gets a short `ref`, a
one-line `what`, and a `source`. The body cites refs and never inlines
a path, so that when a source moves, one table entry changes instead of
twenty sentences.

**`evidence_scheme`** says what kind of receipt the `source` fields
hold. `claim` means claim ids out of a claims database, which is the
alexandria form the charter assumes. `repo` means paths with line
anchors into this repository, which is the only form available in Ursa
today and the reason this field exists at all. A skill may not mix the
two schemes silently. If it draws on both, it declares `claim` and
writes repo sources as full paths so the difference is visible.

**`validated`** is false until a judge that is not the author has
passed the skill. The judge of record is the ADR-13 provenance,
adversary and validator panel once it runs in Ursa. It does not run
here yet, so until it does, the owner's merge is the only gate, and a
merge alone does not flip `validated`. Say so in the PR every time.

## 4. Body

Four sections, in this order.

1. **When this fires.** The activation conditions, concrete enough to
   test. Name the artifacts and the situations, not the subject area.
2. **The procedure.** Numbered steps a reader can execute. Each step
   says what to do, what evidence backs it, and what the step outputs.
3. **Judgment.** The calls the procedure cannot make for you, with the
   reasoning that decides them. This is where most of a skill's value
   sits, and it is the part a checklist cannot carry.
4. **Limits.** What the skill does not cover and where its evidence
   runs out. A skill with no limits section has not been thought about
   hard enough.

Citation form is a trailing `[E3]` or `[E3, E7]` on the sentence the
evidence backs. Judgment with no evidence behind it is prefixed
**Ours:** and carries no ref. Both forms must appear in any honest
skill, because a procedure with no judgment is a script and a skill
with no citations is a prompt.

## 5. The trigger test

(Amended by §5c. Generated line, per §5ah.)

Market evidence in alexandria's corpus says most public skills never
fire. That number is not re-citable here, because Ursa has no access to
the claim behind it, so treat it as motivation rather than as a
finding. The requirement it produced stands on its own reasoning: a
skill that never activates delivers nothing no matter how good its
body is.

Every skill ships a `TRIGGER-TEST.md` with five prompts. Three are
realistic prompts that should activate the skill. Two are near misses
that should not, and near miss means genuinely close, sharing the
skill's vocabulary while falling outside its work. Each of the five
carries one or two sentences of reasoning for why it lands the way it
does. The test is written against the `description` field, and when
the test fails, the description is what changes.

Ours: the near misses are the load-bearing half. Three prompts that
obviously fire prove nothing about a description, since a description
naming its own topic will always match its own topic. The pair that
must not fire is what shows the description has an edge.

**Once the library holds more than one skill in an area, at least one
near miss must be the adjacent skill's own trigger prompt.** (Added
2026-09-30, second run.) Two skills about outcome records share almost
every noun, so the boundary between siblings is where a false positive
is both most likely and most costly: the load goes to the wrong skill
and the right one never runs. A near miss drawn from outside the
library tests the description against the world, which matters less,
because the world does not usually ask in our vocabulary.

## 5b. Facts the skill measured rather than read

(Added 2026-09-30, second run, after a step's own instruction was tested
against this repository and turned a caveat into a defect.)

A skill will sometimes state something true that no source in the
repository says, because the author ran something and looked. That is
not evidence under either scheme and it is not ordinary judgment either.
Write it as **Ours:** and give the command that reproduces it, inline,
so a reader can re-run the measurement instead of trusting the number.

The rule exists because a measured claim is the most persuasive kind a
skill can make and the easiest kind to get away with. An evidence ref
can be checked by tooling. A number somebody once measured cannot, so
the command is the receipt.

## 6. Rendering

Whatever a skill cites has to be readable by someone who did not write
it. Ursa has no skills library surface today. The `ursa-minor/` site
has `app`, `components`, `lib` and `public`, and no skills route, so
nothing here renders anywhere yet. The skill agent does not build that
surface, per its Boundaries. It records the gap in `docs/ideas.md` and
leaves the build to the engineer or frontend seat.

The constraint a future surface has to meet is set by the evidence
table: a reader must be able to click a `ref` in the body and land on
the cited source. That is the same auditability property the outcome
record promises its buyers, applied to our own product.

## 7. Revision

A skill revises when its evidence changes, and that is the
differentiator, so it has to actually happen. Concretely: when a cited
source moves, changes meaning, or is retracted, the skill's `revised`
date changes, the affected sentences change with it, and `version`
increments. A skill whose evidence has moved under it and whose text
has not is a broken promise rather than a stale file.

## 5c. The near miss must be the sibling, once there are two siblings

(Added 2026-10-01, third run, amending §5.)

(Amended by §5e and §5r. Generated line, per §5ah.)

The rule in §5 says that once more than one skill covers an area, at
least one near miss must be the adjacent skill's own trigger. With
three skills in one area that is no longer enough, because a skill with
two neighbours has two boundaries and testing one of them leaves the
other unguarded. So: **a skill ships one near miss per adjacent skill.**
The two-near-miss budget in §5 is a floor and not a ceiling, and the
budget grows with the number of neighbours rather than with the number
of skills in the library.

A skill with three or more neighbours has a different problem, which is
that its slug is probably describing a topic rather than a piece of
work. Treat that as the signal to re-cut the skills rather than to
write five near misses.

## 5d. Order the siblings explicitly

(Added 2026-10-01, third run.)

Skills in one area usually sit in some order along a real pipeline, and
a prompt will often span two of them. When the library holds more than
two skills over the same artifact, the index records that order and
says which skill runs first. Ours: without it, a spanning prompt
resolves by whichever description matched more strongly, which is a
property of the wording rather than of the work, and the two skills
will disagree about who defers to whom because each one's own
`TRIGGER-TEST.md` is written from its own side of the boundary.

## 5e. Count artifacts, not neighbours

(Added 2026-10-05, fourth run, amending §5c.)

(Amended by §5r. Generated line, per §5ah.)

§5c says a skill with three or more neighbours is probably describing a
topic rather than a piece of work, and that the remedy is to re-cut.
That test misfires as soon as the library covers a second artifact.
`distilling-a-tuning-record` is the case that shows it, and it is not a
topic. It works on `tuning.json`. Its neighbours inside
`outcome_record.json` are `adjudicating-uncertain-spans`,
`quoting-a-number-from-an-outcome-record`,
`running-an-outcome-record-trial`,
`auditing-a-detected-correction-loop`, `auditing-a-durability-walk`,
`attributing-a-deleted-span` and
`excluding-a-file-from-an-outcome-record`, and the boundary with every
one of them is the same handoff between those two files, counted once
per neighbour. Its other two neighbours are
`adding-a-bound-to-the-record-gate` and
`clearing-a-record-for-release`, which name no shared file at all, and
the amendment to this section under §5r is what settles those.

(This paragraph said "has three neighbours" and "the three existing
skills" from 2026-10-05 until 2026-10-27, and both were true of the
four-skill library it was written against. The counts are removed
rather than corrected, and the members are named instead, per §5ag.)

So the test is: **do this skill's inputs and outputs name the same file
as its neighbours' do?** If yes, the §5c warning stands and the cut is
probably wrong. If no, the skill sits across a handoff in the pipeline,
the near-miss budget is still one per neighbour, and the index records
which side of the edge a spanning prompt is handled on first.

Ours: an edge is also where a skill is most worth having, because a
handoff between two artifacts is exactly where the vocabulary stays the
same and the object changes underneath it.

## 5f. A step that mutates user-owned state carries its reversal

(Added 2026-10-05, fourth run.)

When a procedure step runs a command that writes to a file the user
owns, the step gives the reader the way back before it gives the
command. The tuning CLI is what earned this: one invocation distills,
merges and writes, so the arithmetic is in the store before any axiom
has been read by a person, and there is no dry-run flag. The skill's
step copies the store first and reads the pass as a diff.

This is not general caution. It is a consequence of the first property
in §1: a reader must be able to check a sentence against its evidence.
A step whose effect cannot be inspected or undone cannot be checked
either, and a skill that ships such a step is asking for trust rather
than offering receipts.

## 5g. A line anchor is a claim with a date on it, so fingerprint it

(Added 2026-10-08, fifth run, after measuring the cost of not doing it.)

Under `evidence_scheme: repo` a citation is a path and a line range into
a repository that other seats are changing daily. The anchor was true
when it was written and nothing about it stays true on its own. This is
the one failure mode that is worse than a dead link, because a dead link
announces itself and a moved anchor does not: the reader follows the
citation, finds plausible code, and believes the claim.

It has already happened here, at scale. The 2026-10-05 run re-landed the
library onto a newer `main` and said in its own commit message that the
files rode along verbatim. The anchors rode along too. By 2026-10-08,
58 of 117 line-anchored citations pointed at unrelated code while
`check-evidence.mjs` reported OK on all 133 sources, because in-bounds
was all it checked. `resolve.ts:160-167` had been the branch that sets
`uncertain`; it was the verbatim-match pass by then.

So:

1. **Every cited range is fingerprinted** in `skills/evidence.lock.json`,
   and `node skills/check-evidence.mjs` fails when one moves. The hash
   covers the cited lines trimmed, so reformatting is not an alarm.
2. **A failure is a reading task, not a rebase.** Re-point the anchor,
   then re-read the claim against the new lines, because the two come
   apart: of the drifted citations in this library five had claims that
   were no longer true, and those needed rewriting rather than moving.
3. **`--update` goes in the same commit as the re-anchoring**, so the
   lock diff shows a person decided rather than a script having its way.
   It also has to **name what it is re-recording** now, by skill slug or
   by lock key. A bare `--update` refuses while anything is drifted,
   because it used to re-record the whole library from whatever the tree
   said and one of them cleared 43 red ranges without a word (§5k).
4. **A new citation fails too**, until its fingerprint is recorded. That
   is deliberate: it puts the "read it once, deliberately" step on the
   author rather than on the reviewer.

Ours: carrying a skill forward onto a newer tree is a re-grounding job
and should be budgeted as one. It is not a file copy, and the run that
treats it as a file copy will pass its own checker while breaking the
only property the product sells.

## 5h. A skill that reports a defect must be re-read when the defect is fixed

(Added 2026-10-15, sixth run, after the second instance of the same
failure in two runs.)

§5g treats drift as an anchor problem with a claim problem attached.
There is a sharper case inside it, and it has now happened twice in this
library, so it is a pattern rather than an accident.

A skill reports something wrong with the code. The engineer reads it and
fixes it. The skill is now a confident warning about code that does not
exist, and it reads exactly like a current one, because the prose that
described a live defect is indistinguishable in tone from prose
describing a standing property. The fifth run found the first instance:
the quoting skill said the CLI "never prints `finalChars` at all", which
this seat had itself reported and the engineer had since fixed. This run
found the second, and it is worse. The trial skill said the trailer
pattern matched only `claude|codex|cursor|gpt`, that a bot whose name
held none of those four substrings passed through as human, and it named
a real commit in this repository as the standing example. All of that was
true when written. The hazard then materialized, produced a record
claiming 94.9 percent verbatim survival over text no person had read, and
was fixed on 2026-10-11 by widening the pattern. A reader following that
skill would have gone looking for an exposure that had been closed, and
would have found the citation pointing at plausible code.

So, when a drift failure lands on a claim the skill framed as a defect,
a risk or a thing to watch out for:

1. **Ask whether it was fixed, not only whether it moved.** The fix is
   the likeliest reason the lines changed, because this seat's findings
   are routed to the engineer by design, and a seat that reports well
   should expect its own reports to come back as code.
2. **Keep the incident and retire the warning.** Do not delete the
   paragraph. The measured cost of the defect is the most valuable
   sentence in it, and it is what tells a reader why the current design
   is shaped the way it is. Rewrite it so the hazard is in the past tense
   and the present-tense sentences describe what is there now.
3. **State the direction of the fix.** A reader who hits a related
   decision needs to know which way the code errs and why. The widened
   marker narrows what a run claims rather than widening it, and that
   sentence is worth more than the regex it replaced.
4. **The fix may move the line out from under the anchor, so re-point
   before rewriting.** (Added 2026-10-26, twenty-sixth run, third
   instance.) The first two instances were defects in code and the fix
   edited the cited lines in place, so §5g's relocation question did
   not arise. This one was a defect in documentation prose, the
   fixtures README's hand-written counts, and the fix inserted a
   paragraph above the count. The ref cited `README.md:1-11,201` for
   three stale spellings, and after the fix line 201 is ordinary prose
   inside the inserted paragraph while the count it named lives at 210.
   An anchor left alone there does not go red a second time, because
   the next run's fingerprint is taken over whatever text now sits at
   201. So the order is: re-point the range at the thing the claim is
   about, re-record the fingerprint, then rewrite the prose. Doing it
   the other way leaves a correct hash over the wrong lines, which is
   the §5j failure arriving through the §5h door.

Ours: this is the one drift case where the skill was right and still
has to change, which is why it is easy to skip. Every other entry in a
drift report feels like a correction to make. This one feels like
vindication, and it is the one that will mislead a reader hardest.

Ours, 2026-10-26: how to spot one inside a batch. The mechanical pass
sorts a drift batch into relocated, text-changed and ambiguous, and a
§5h case always lands in text-changed, but so does every ordinary
rewording. The cheap discriminator is the claim's own grammar rather
than the diff. If the `what` field is a negative or a deficiency, the
file still says, does not print, is one bound behind, matches only
these four, then read the fix first and the lines second, because that
sentence is one commit away from being false and nothing else in the
batch is. Three of this library's `what` fields were written that way
and all three have now come back as §5h cases.

## 5i. Budget a re-grounding pass by content, not by the drift count

(Added 2026-10-15, sixth run.)

§5g says carrying a library onto a newer tree is a re-grounding job and
should be budgeted as one. This run measured what that budget actually
buys, which makes it plannable. Merging 410 files of `main` movement
into the library tripped 44 of 144 fingerprinted ranges. They split
three ways:

- **27 were pure relocation.** The cited lines exist in the current tree
  byte-for-byte at a new position. These are mechanical. Recover each
  range's as-cited text from the tree the lock was recorded against,
  then search the current file for that exact block. A unique hit is the
  new anchor and the claim is untouched, because the bytes are the same
  bytes.
- **14 were content changes**, meaning the text at and around the
  citation is genuinely different and no unique match exists.
- **3 were ambiguous**, where the cited text appears more than once in
  the new file. Resolve these by ordinal rather than by proximity. The
  nth occurrence in the old file maps to the nth in the new one, and
  checking the surrounding block is what confirms it.

Of the 17 that were not pure relocation, 7 carried claims that no longer
held. So the useful ratio is not the drift count. It is that roughly
60 percent of a drift batch is machine work, and the reading cost sits
almost entirely in the remainder.

**Measured a second time, 2026-10-18.** Merging `main` again three days
later tripped 43 of 154 ranges, and 39 of those were pure relocation,
with 1 content change and 3 ambiguous. So the total barely moved while
the mechanical share went from 61 percent to 91 percent and the reading
cost fell from 17 ranges to 4. That is what convergence looks like from
inside: the library is catching up to `main`'s content and not to
`main`'s line numbers, and line numbers move every time anybody commits.
Do not read the falling reading cost as a falling drift cost. The batch
is the same size and almost all of it is now work no person should do.

Ours: run the mechanical pass first and commit it separately, before
reading anything. It shrinks the batch to the part that needs judgment,
it keeps the two kinds of change in separate diffs where a reviewer can
see which were decided by a person, and it means a run that dies partway
has still landed the half that was not going to change anyway. §5k is
the tool that does it.

## 5j. The lock proves the lines did not change, not that they support the claim

(Added 2026-10-15, sixth run, after this seat shipped the failure and
caught it in its own audit.)

There is a blind spot in the guard §5g installs, and it is worth naming
precisely because the guard is good enough to be trusted too far.

`check-evidence.mjs` now proves four things: the path exists, the line
numbers are in bounds, the body and the evidence table agree in both
directions, and the cited lines still hash to what they hashed to when
the claim was recorded. A citation can satisfy all four and still not
support its sentence, because none of them is a relevance check. The
failure arrives as a range that is too narrow rather than as an
exaggerated claim. The hash is correctly recorded over the wrong lines,
so the checker reports OK and a reader following the `ref` lands on real
code that simply does not say what was attributed to it.

This run shipped exactly that and found it by hand. The rewritten E3 in
`running-an-outcome-record-trial` asserted a measured incident, 94.9
percent verbatim survival over text no person had read, and the
reasoning for why one of the three marker tests carries an all-match
suppression. Both live in a doc comment at `pairfinder.ts:218-263`. E3
was anchored at `262-263` and `545-556`, which hold the constants and
the marker function and neither argument. Every automated check passed.

So, the step that has no exit status: **after rewriting a claim, read
your own citation back as a stranger would.** Open the range you wrote
down, not the range you were looking at while you worked, and ask
whether the sentence can be checked from what is inside it. A claim that
needs a comment thirty lines above the code must cite the comment. When
a prose argument and the code it describes are both load-bearing, the
range covers both or the citation is decoration.

Ours: the asymmetry here is the thing to remember. An overstated
sentence is visible to any reviewer who reads the skill. A
too-narrow anchor is invisible to every reviewer who does not open the
file, and invisible to the checker by construction, so it survives
exactly the review that a confident green run invites.

## 5k. The mechanical pass is a tool, and its one failure mode is the ref you give it

(Added 2026-10-18, seventh run, after writing the same throwaway script
for the third time.)

(Amended by §5s. Generated line, per §5ah.)

§5i says to run the mechanical pass first and commit it separately. Two
runs did that by writing the pass from scratch inside the run and
deleting it with the sandbox. It is committed now:

```
node skills/relocate-anchors.mjs <old-ref>           show what it would do
node skills/relocate-anchors.mjs <old-ref> --write   do it
```

`<old-ref>` is the git ref whose tree the current anchors were written
against, which after a merge is the merge's **first** parent, the branch
head before `main` came in. Get it with
`git log -1 --format=%p <merge>` and take the first hash.

Three things about it are worth knowing before you trust it.

1. **It refuses on a ref it cannot verify.** For every drifted range it
   recovers the as-cited lines from `<old-ref>` and checks that they hash
   to the fingerprint the lock recorded. If they do not, that ref is not
   the tree the citation came from, and it says so instead of searching a
   tree whose lines were never the cited ones. This is the whole safety
   property and it is also the error you will actually make: this run's
   first attempt named a plausible wrong ref, got 23 relocations instead
   of 39, and was told exactly why for all 16 it would not touch. A run
   that sees a surprising number of "do not match the recorded
   fingerprint" lines has the wrong ref, not a broken library.
2. **It carries the fingerprint across rather than calling `--update`.**
   Because the search is over the same trimmed lines the hash is taken
   over, a relocated range's new hash is identical to the old one by
   construction, so `--write` moves that one value to the new key and
   touches nothing else. This matters because §5g point 3 asks for
   `--update` in the re-anchoring commit, and `check-evidence.mjs
   --update` re-records **every** range in the library, including the
   ones whose claims stopped being true. After a relocation pass, do not
   reach for `--update` to clear what is left. The ranges still red are
   precisely the ones §5g point 2 and §5h exist for.
3. **It will not resolve an ambiguous range for you.** §5i says resolve
   those by ordinal and not by proximity, so the tool lists every
   candidate position and stops. On the 2026-10-18 batch two of the three
   would have come out wrong on distance alone.

Ours: a relocated anchor means the bytes are the same bytes. It does not
mean the sentence is still well stated, and it does not discharge §5j.
Read your relocated citations back as a stranger would, at least for the
refs whose claims you are also touching this run.

## 5l. The sweep §5j asks for is a queue, and three kinds of claim need a different receipt

(Added 2026-10-18, eighth run, after the first slice of it.)

§5j ends with a reading step and no exit status, and a reading step with
no queue is a reading step nobody finishes. This is the queue:

```
node skills/relevance-sweep.mjs                 the unread refs, least-defended first
node skills/relevance-sweep.mjs <skill>[/<ref>] one ref's dossier: what, passages, cited lines
node skills/relevance-sweep.mjs --audited       what has been read, and when
```

Verdicts go in `skills/relevance-audit.md`, one row per ref, because
relevance is the part that needs a reader and a reader's verdict is not
something a lock can hold. The file is also what makes the sweep
resumable: 110 refs is more than one run should take, and a run that
reads twenty and records them has done a fifth of a job rather than a
whole job badly.

**What the ordering is worth, measured rather than asserted.** The
signals are the share of the `what` field's content words that appear
nowhere in the cited lines, and the number of conjuncts per cited line.
On the first slice, seven of the nineteen highest-ranked refs needed a
change and four refs read from the bottom of the ordering as a control
needed none. That is a real signal with wide error bars at n=23, and the
mechanism is worth stating because it tells you when to distrust it: the
miss rate is high exactly when the `what` field is written in the
record's vocabulary rather than the code's, which is also the condition
under which an author was most likely anchoring from memory. It is not
high for a prose citation that quotes its own source, and two code refs
with a zero miss rate were sound for the same reason, so a low score is
no defence and a high one is no accusation.

**Three kinds of claim the range cannot carry, found in nineteen refs.**

1. **A claim about absence.** `distilling-a-tuning-record/E25` says a
   `distilled` flag exists and is never set to true by anything. The
   first half is three ranges. The second half is a search result, and no
   line range anywhere proves that nothing else in the tree does a thing.
   The receipt for an absence is the command that finds nothing, written
   into the audit row with the date it was run, exactly as §5b does for a
   measured number.
2. **A claim whose subject is derived elsewhere.** The trial skill said a
   git-path record carries no turns-to-acceptance. It carries one: the
   field is a maximum over `turnIndex`, and on that path `turnIndex`
   counts the files inside one commit pair. The citation was anchored at
   `userTurns: 0`, which is true, unchanging, and not what the sentence
   was about, so the lock was green over it and will stay green forever.
   When a sentence is about what a field *means*, the range has to reach
   the code that computes it, not the code that looks related.
3. **A union, an enum or a list that the range cuts short.**
   `adjudicating-uncertain-spans/E1` cited `types.ts:5-13` for "the span
   classes and the generation fates", and line 13 is the third of four
   fates. A reader learns there are three. The same skill's E11 says four.
   A range that ends inside a list teaches the truncation as a fact.

Ours: the sweep found one false claim and six too-narrow ranges in
nineteen refs, so about a third of a library that passes every mechanical
check needs a reader. Budget accordingly, and do not report a green
`check-evidence` as evidence that the receipts are sound. It is evidence
that they have not moved.

## 5m. Cite the returns, not the call, and read what the library already says about the same lines

(Added 2026-10-18, ninth run, after the second slice of the sweep.)

Slice 2 read nineteen more refs and the shape of its one false claim is
different from slice 1's, so it gets its own rule. Two rules, really,
because the error and the thing that would have caught it are separate.

**A claim about what happens to a value has to cite the returns, not the
call site.** `adjudicating-uncertain-spans/E4` claimed that a demoted
short match carries no `trivial` flag, and cited the call that passes
`trivial: true` into the helper. The call is real and unchanging, so the
lock stayed green. The flag's fate is decided by which of the helper's
returns fires, and the helper has two: one spreads `trivial` into a
`survived_mutated` span, and one returns early as uncertain without it.
The skill described the second and named the first. So when a sentence
says what becomes of a field, enumerate every return that can produce
the object and put all of them in range, even when that makes the
citation forty lines. `quoting-a-number-from-an-outcome-record/E9` cites
the whole helper for a claim about the same two paths and gets it right,
which is the argument: a long range that contains the decision beats a
short one that contains the handoff.

**Two refs can say opposite things about one piece of code, and nothing
mechanical notices.** The lock keys on a single ref's own ranges. It has
no notion of two refs, so a library can hold a claim and its negation
with both fingerprints valid, and the only reader who would ever see the
conflict is one who happens to read both in the same sitting. That is
how this one was found, which is luck and not a procedure.

The procedure: a dossier now names every other ref in the library whose
cited lines **overlap** this ref's, with that ref's own `what` field, so
a reader judging one claim is shown the library's other claims about the
same lines. Overlap rather than same file, because twenty refs cite
`resolve.ts` and they are not all about each other, so a same-file list
is noise while a shared-lines list is a question. Measured on the
library as it stands: 41 of 111 refs have an overlapping co-citation and
36 of those have one in a different skill, so the field fires on about a
third of the library and when it fires it almost always points across a
skill boundary, which is exactly where no single skill's author was
looking. When it fires, say in the audit row whether the two agree.

Ours, and the general form of both halves. A fingerprint is an argument
about one range in isolation, and a claim is rarely about one range in
isolation. Every failure this sweep has found is a claim whose subject
sits somewhere the range does not reach: in a later return, in a
different file, in a search that finds nothing, in a list the range cuts
short, or in another skill's contradicting sentence. Treat the lock as
proof that nothing moved, treat the reading as the only thing that
establishes relevance, and expect roughly a third of any un-swept
library to need one or the other.

## 5n. A sentence that cites two refs divides its claim, and nothing audits the division

(Added 2026-10-18, tenth run, after the third slice of the sweep.)

Slice 3 read twenty refs and found no false claim and eight ranges too
narrow, which is the same rough third as the two slices before it. One of
the eight is a new mechanism and gets its own rule, because the thing
that found it was not the ordering.

`running-an-outcome-record-trial` has a sentence that reads "A pair needs
a commit marked as generated and then a later commit, not a merge, with
no agent marker, touching at least one of the same paths [E2, E4]." Two
refs, one claim, and each author knew which half was theirs. E4's half is
the merge exclusion, and a later passage states its load-bearing
consequence: the exclusion "is written against parent count", which is
why a squash merge slips past it. E4's range was four lines of comment
saying a merge is not a pairing target. The comment never mentions
parents. The test that does, `if (fin.parents.length > 1)`, sits ten
lines below it.

Three things make this worth a rule rather than a row in the audit.

1. **The ordering did not find it and could not have.** E4 ranked near
   the bottom of the slice, four cited lines and a 13 percent miss rate,
   because the `what` field was a fair summary of the comment it cited.
   Both signals measure a ref against its own `what`, and when the `what`
   describes the range faithfully while the *passage* claims more, there
   is nothing for either signal to see. What found it was reading E2 and
   following the tag.
2. **The division is invisible to every tool by construction.** The lock
   keys on one ref's ranges. The overlap field §5m added compares ranges
   to ranges, and these two refs do not overlap: one cites the file header
   and the walk, the other a comment between them. Only the citation tag
   knows the two sentences are one sentence.
3. **It is rare and it is concentrated.** Twelve of this library's 182
   citation tags name two refs, and all twelve sit inside a single skill,
   which is the opposite shape from the overlap field, where 36 of 41
   pointed across a skill boundary. So this is not a common failure. It
   is a cheap one to check when it fires, and it fires on 7 percent of
   tags.

The mechanical part, since a reading step with no queue is a reading step
nobody finishes: a dossier now names every ref this one shares a sentence
with, beside its `what` and its own audit verdict. When it fires, say in
the audit row which half of the claim each ref carries. That is the
sentence E4's row now carries, and writing it is what would have caught
this in the first place.

Ours: the general form of §5m and this one together. A fingerprint is an
argument about one range in isolation, and the claims that fail are the
ones whose subject is somewhere the range does not reach. §5m named five
of those places. This is the fifth, and it is the only one where the
subject is not in the code at all. It is in the other half of your own
sentence.

## 5o. A verdict is bound to what it was read against, or the sweep's closure expires without saying so

(Added 2026-10-18, eleventh run, the day the relevance sweep closed.)

§5j installed the reading step and §5l turned it into a queue. This run read
the last fourteen refs and the queue went to zero, which is the state that
exposes the next gap: the sweep decides whether a ref has been read by looking
for its row in `relevance-audit.md`, and a row is forever. On the day it
closed, every claim in this library had been read against the lines it cites.
On any later day, some of those readings are about lines that have changed,
and nothing anywhere said which.

This is §5g's lesson one level up, and the escalation is worth stating in one
line. A fingerprint stops a hash from outliving its lines. Nothing stopped a
reading from outliving them.

The drift numbers are why this could not wait for the failure to arrive: 27 of
44 ranges drifted on 2026-10-15 and 39 of 43 on 2026-10-18, so a library read
in October is a library read against October's text, and the sweep would have
gone on reporting 111 of 111 read for as long as the audit file existed.

**The three failures the evidence lock cannot see.** Each was demonstrated
before the guard was written, and each leaves `check-evidence` green on all
210 ranges.

1. **A `what` field rewritten under a verdict.** The lock hashes cited lines
   and the `what` field is not one of them. A reader's verdict was given to the
   claim as it then read, and sharpening the claim afterwards inherits it.
2. **A citing passage rewritten under a verdict.** Same shape, and worse,
   because the thing judged was whether the lines support the sentence, and
   this is the sentence changing while the receipt stays still.
3. **A changed range re-blessed by `check-evidence --update`.** This is the
   one to remember. When cited lines change, the evidence check goes red and
   §5g sends a reader to the claim. `--update` is the act that clears the red,
   and it clears the only visible trace that a re-read was owed. So the signal
   dies at the moment it is most needed, by design, inside a command whose
   whole purpose is to be run after a change.

**The mechanical part.** `skills/relevance.lock.json` holds three digests per
ref, over the cited lines, the `what` field, and the passages citing it,
beside the verdict and date the audit row gives. `relevance-sweep.mjs --stale`
exits 1 when any verdict is unbound or stale and names which of the three
moved, since a reflowed passage costs a minute and a re-pointed range costs
the reading again. `--record <scope>` binds a verdict after a reading and
refuses a bare invocation, for the reason §5k's unscoped `--update` taught
this library the same morning.

The digest covers line content and paths and never line numbers. A relocation
onto identical lines keeps its verdict, because a verdict earned on those
lines is still earned, and a re-point to different text does not. Without
that,
every relocation pass would re-queue the whole library and the queue would be
ignored within a week, which is §5i's own warning about a check that cries
wolf.

**The authoring rule this leaves behind, which matters more than the guard.**
A third of the first slice needed a reader and two of the last fourteen were
false, and all of it was found months after the claims were written, by a
sweep that cost five runs. A new ref gets its reading when it is written: open
the range you wrote down, read the sentence against it as a stranger would,
and record the verdict and the binding in the same commit as the citation.
The sweep is the recovery procedure for a library authored without that. It is
not the procedure.

Ours: the general form of §5g, §5j and this one together is that every
receipt in this library is a claim with two dates on it, the day the lines
were written down and the day somebody read them, and a guard that tracks
only the first will always report a library in better shape than it is. The
second date is the expensive one, which is exactly why nothing was recording
it.

## 5p. A ref may be cited in any markdown file of the skill directory, and nowhere else

(Added 2026-10-23, tenth run, closing the ninth run's finding.)

§2 says a skill is two files, `SKILL.md` and `TRIGGER-TEST.md`. Every rule
about citations up to here was written as if it were one. `check-evidence.mjs`
and `relevance-sweep.mjs` both enumerated `skills/<slug>/SKILL.md` and read
nothing else in the directory, so an `[E7]` tag written into a trigger test
was invisible to both: no fingerprint over the lines it pointed at, no row in
`relevance.lock.json`, no entry in the dossier of passages citing that ref,
and nothing that went red when the range moved. It looked exactly like a
receipt and was not one, which is the single failure §5g and §5j exist to
prevent, one file over from where they were looking.

The measurement, from the run that found it. The first draft of
`adding-a-bound-to-the-record-gate/TRIGGER-TEST.md` carried ten such tags.
`grep -c "\[E" skills/*/TRIGGER-TEST.md` returned 0 for the four older trigger
tests and 10 for that one, with `node skills/check-evidence.mjs` and `node
skills/relevance-sweep.mjs --stale` both exiting 0 over all ten. The four
older files happen to cite nothing, which was a convention nobody had written
down and no check enforced.

**The rule.** A citation may stand in any `.md` file of a skill's directory,
and both tools read all of them. Three consequences follow, and the third is
the one to remember.

1. A tag naming an undeclared ref now fails wherever it sits, and the failure
   names the file it was found in.
2. A ref cited only in a trigger test counts as cited, so the uncited-ref
   failure in §3 no longer fires on it. A claim made in the activation test is
   a claim the skill makes, and its receipt is owed the same way.
3. The relevance sweep gathers citing passages per file, `SKILL.md` first, so
   a prompt in a trigger test enters both the dossier and the `passages`
   digest. A new passage citing a range is a second claim standing on it, and
   a verdict given before that passage was written was not given to it. So
   writing one makes the ref stale and owes a re-read.

**A tag in a file neither tool reads is reported, not fingerprinted.** Widening
to `.md` says nothing about a tag in a `.json` fixture or a `notes.txt` beside
it, which would be exactly as green and exactly as empty. Those are named as a
failure with the instruction to move the claim into a file the tools read. The
alternative, teaching the tools every format a skill directory might hold, buys
nothing: a receipt has to be readable by a person following it, and a tag
inside a fixture is not where anybody looks for one.

`relocate-anchors.mjs` still reads `SKILL.md` alone and is right to. It rewrites
`source:` lines, and the evidence table is declared in frontmatter, so there is
exactly one file in which a range can be re-pointed.

Ours: the shape to carry forward is that a guard's scope is itself a claim with
a date on it. Both tools were correct on the day they were written, when a
skill was one file in practice, and they went quietly wrong when the format
grew a second file. So when §2 gains a third, this section is what has to be
read again, and `skills/citing-files.mjs` is the one place that answers which
files count.

## 5q. The fingerprint is owed by the run that writes the citation, and a skill whose guards are red is not shipped

(Added 2026-10-24, thirteenth run, after reading the sixth skill's 41 refs
and finding ten of them wrong about where they pointed.)

(Amended by §5s. Generated line, per §5ah.)

§5g already says a new citation fails until its fingerprint is recorded, and
says the point is to put the reading step on the author rather than the
reviewer. That is the right rule and it was not enough, because it does not
say *when*, and a rule about an author's obligation with no deadline is
discharged by the next run or by nobody.

**What it cost, measured.** `clearing-a-record-for-release` merged on
2026-10-23 as PR #281 with all 47 of its cited ranges unfingerprinted and
all 41 of its refs unread. Its description reported "224 sources, 291
ranges" and "184 of 184 bound, 0 refs unread". Neither was true of anything
committed. On `main` the next morning `check-evidence.mjs` exited 1 with 69
failures and `relevance-sweep --stale` exited 1 with 41 refs unread. Reading
the 41 found ten ranges that did not hold, and the four worst share one
cause: they were written against the 2026-10-01 revision of
`ursa-major/src/consent.cli.ts`, which two commits rewrote on 2026-10-23,
the same day the skill was written. Each of the four resolves to its claim
at `14ff4cb` and to nothing on `main`. Three of them had landed on the next
ref's receipt: E24's range held the dispatcher's usage string, E25's held
the branch that is E24's evidence, and E26's held the branch that is E25's.

So the deadline matters more than the rule. A fingerprint recorded in the
same run would have failed on all four immediately, because the lines it
hashed were already not the lines the author read. A fingerprint deferred to
the next run records whatever the tree says by then and certifies the error.

1. **Record the fingerprint in the same run that writes the `source:` line**,
   before the pull request is readied, not as a cleanup the next run inherits.
   A citation without a fingerprint is not a weaker citation, it is an
   unverified one, and the gap is where same-day drift lives.
2. **Neither guard may be red when the skill is proposed for merge.** Both
   were red here and the skill merged anyway, which is the part no tool
   caused. A red `check-evidence.mjs` on a brand-new skill reads as "the
   author has not got to it yet" rather than as "this is wrong", and those
   are indistinguishable from outside. Treat the first as the second.
3. **Do not report a guard's output you did not run on what you committed.**
   The numbers in #281's description are the numbers of a working tree that
   was never pushed. The cheap defence is to paste the command and its exit
   status rather than its remembered result.

**The sweep's absent-word column is the signal that fires when no
fingerprint exists, and it is sharper than it looks.** The dossier's
`signals:` line reports how many of a `what` field's words are absent from
the cited range. Across the sixth skill's 41 refs that ratio separates the
mis-anchored from the sound almost perfectly:

```
  E35  17/17  1.00   re-pointed      highest among refs that held:
  E26  13/14  0.93   re-pointed        E21   7/11  0.64  (widened)
  E25  10/11  0.91   re-pointed        E33   4/10  0.40  (supports)
  E24   9/10  0.90   re-pointed        E41   6/16  0.38  (widened)
  E36  11/13  0.85   re-pointed        E40   5/15  0.33  (supports)
  E23   9/14  0.64   widened           E11   3/13  0.23  (supports)
```

At a threshold of 0.85 that is five flagged, five genuinely pointing at the
wrong lines, and nothing flagged that held.

**Corrected 2026-10-24, on the library instead of one skill of it.** The
paragraph above was measured on 41 refs in the skill that had just failed,
which is a threshold fitted to the sample that suggested it. Run
`node skills/relevance-sweep.mjs --signal` to reproduce the wider
measurement. Against the ranges as they stood before anyone corrected them,
recovered from git for 136 of the library's 184 refs, the same threshold
flags seven and two of the seven are sound:

```
  all refs           at 0.85: 7 flagged, 5 mis-anchored, 2 held
  refs citing one file         5 flagged, 5 mis-anchored, 0 held   (127 refs)
```

Both of the two that held cite two files, and the reason generalises rather
than being a quirk of those two. `running-an-outcome-record-trial/E1` claims
there are two capture paths with two separate entry points and cites the
first seven lines of each. Its evidence is the shape of the citation and not
the text of either file, so none of the claim's words can appear in either
range and no widening will ever lower its ratio. The same holds for a claim
about where a line sits rather than what it says, which is
`adding-a-bound-to-the-record-gate/E12` at 0.846, a comment stranded a
hundred lines from the function it describes.

So the rule is narrower than the old paragraph said and it is a reading
instruction rather than a gate. **A ref at or above 0.85 whose sources name
a single file is mis-anchored until you have read the lines and said
otherwise. If the words are absent because the claim is about the position
or the shape of the citation, the audit note has to say so, because nothing
mechanical will ever defend that ref again.** `--signal` prints exactly
that list at the end of its report.

**Why it is not a third failure class in `--stale`, which is what the ledger
first proposed.** It would not catch anything that gate does not already
catch. Since 2026-10-24 `--stale` fails on any ref with no verdict, so a new
citation cannot reach a green guard unread, and a range that moves after
being read comes back stale. The only case left is a reader who read a
mis-anchored range and blessed it, and firing on that means firing on refs a
reader has already judged, where E12 and `E22` at 0.909 show the alarm would
be false. A gate that re-litigates readings and is wrong twice in its first
four alarms gets suppressed, and then the signal is worth less than it is
now.

The first thing the rule caught was not a mis-anchor. Reading `E22` under it
turned up a defect in the sweep itself: the sentence splitter ended a
sentence at the colon inside an inline code span, so the passage a reader
was shown for `E22` was `1` and its tag. Fixed, with the three verdicts it
unsettled re-read. A rule that sends a reader somewhere nobody had a reason
to look pays for itself in ways that are not on its own ledger.

Ours: the generalisation is that an obligation with no deadline is an
obligation on whoever is unlucky, and this library has now paid for that
twice, once at §5o for a verdict that could expire silently and once here
for a fingerprint that could be owed forever. When a section adds a duty,
it should say which run discharges it.

## 5r. The near miss carries the sibling's own words, and a §5c debt falls on the run that creates it

(Added 2026-10-24, seventeenth run, amending §5c and §5e.)

§5c asks for "the adjacent skill's own trigger prompt" and nothing in
this file ever said who owes it or how to tell whether it is there.
`skills/trigger-coverage.mjs` now reads all of it, and the first run of
it found the rule was being broken in a way no seat could have noticed:
of 30 ordered pairs, 15 carried the sibling's own prompt, and the 15
were exactly rank by age. Six skills, six distinct coverage values, in
order, with no ties. Every skill tested the siblings that existed on the
day it was written and none had come back.

Three rules follow, and the third is the one with teeth.

**The prompt is copied, not paraphrased.** A near miss written in the
author's own words about the sibling tests the author. The sibling's own
words test the description, which is the half of §5 that would actually
catch a false positive. One test in this library paraphrased a sibling's
trigger, correctly, and the paraphrase scored 0.333 against the original,
which is below any defensible floor. Say which boundary a near miss
tests in its prose as well, because a declaration is cheap and an
author's claim about what a test does is better evidence than any
resemblance measure. Both, not either.

**A prompt outside the two canonical headings states its own verdict.**
`TRIGGER-TEST.md` may keep a prompt under its own heading, and there is
a good reason to: the heading records when a boundary was noticed. The
cost is that nothing above it says whether it fires, so the prompt's own
prose has to say "should not fire". Three prompts written in this run
were missing that sentence and the tool reported them as unclassified
rather than guessing, which is the correct behaviour and also the
cheapest possible way to learn this.

**The run that lands a skill owes a near miss to every skill already in
the library, in their files, in the same pull request.** This is the
teeth, and it is §5q's rule applied to triggers: an obligation with no
owner is an obligation on whoever is unlucky. A new skill does not
create a debt for its own `TRIGGER-TEST.md`; it creates N debts in N
files the run's diff would otherwise never touch, and both receipt
guards stay green while they go unpaid. Run
`node skills/trigger-coverage.mjs --check` before readying the pull
request. It exits 1 on an untested boundary and prints "every skill
meets §5c" when there is none.

**One amendment to §5e.** §5e says to count artifacts rather than
neighbours, and that stands as an argument against re-cutting a skill
whose many boundaries are one edge counted many times. It is not a
licence to skip a near miss for a neighbour the artifact test says does
not overlap. `adjudicating-uncertain-spans` has two neighbours sharing
no file with it at all, the record gate and the release ruling, and the
boundary with both of them had to be written down anyway: what is shared
is the *shape of the judgment*, a rule asserted more confidently than
its evidence carries, and a reader matches on shape. Those two were also
the two near misses that failed, because an exclusion list built from
artifacts cannot name a neighbour that has none.

Ours: the budget is per neighbour and the test for whether a boundary is
real is not the same as the test for whether it needs writing down. The
artifact test answers the first. Only reading the sibling's trigger
against this description answers the second.

## 5s. A guard that skips its subject reports on the subject it has left

(Added 2026-10-26, twenty-fifth run, amending §5k and §5q. Measured
three times in one day, in three different tools, two of which are not
this library's.)

§5k says the mechanical pass is a tool whose one failure mode is the ref
you give it. There is a second failure mode and it sits upstream of the
ref: **the set the pass enumerated.** A guard reports a verdict about
what it read. Nothing in its output distinguishes "I read this and it
passed" from "I did not read this", and the second is the louder lie,
because a count makes it sound thorough.

**What it cost here, measured by probing the guards rather than reading
them.** A directory `skills/decoy-skill/` holding one file named
`SKILLS.md`, with correct frontmatter, a declared `provenance` ref and
an `[E1]` tag in its body, was invisible to all three guards at once:
`check-evidence.mjs` exited 0 saying "307 sources resolved",
`trigger-coverage.mjs` exited 0 saying "every skill meets §5c", and
`relevance-sweep.mjs` exited 0. One character in one filename. All three
tools open `skills/<name>/SKILL.md` and `continue` when it is not there,
and `strayCitations` — the check written for exactly "a tag in a file
nothing reads is not a receipt" — sits after that `continue`, so it
never ran for the directory that needed it most.

**The tell, and it was in the output the whole time.**
`trigger-coverage.mjs` printed `no TRIGGER-TEST.md: <slug>` for one of
§2's two files and dropped the directory in silence for the other. A
guard that reports half of a rule cannot be read as enforcing it, and
the asymmetry is visible without running anything. Look for it: where a
tool names one missing input and skips another, the skip is where the
hole is.

**The same shape, twice, outside this library on the same day.** Both
are in `docs/ideas.md` under this date and both are worth reading,
because they are what convinced this run the rule is general rather
than a quirk of three scripts.

1. `git merge-tree` with a merge driver registered as an *empty* command
   returns the first parent's tree verbatim, prints one line on stderr,
   and exits 1 — and exit 1 is also what a genuine conflict returns. A
   probe that discards stderr and reads the exit code cannot tell the
   two apart, and a finding was published on that basis.
2. `skills/relocate-anchors.mjs` offered to move two of this library's
   anchors by 119 lines, reporting them as pure relocation. It was right
   about the text and reading a tree that should not have existed. The
   tool has no way to say so; its subject is the working tree it was
   handed.

**So, two rules, and the second is the one with teeth.**

**Probe a guard with the input it cannot read, not with the input it was
written for.** Before trusting any check in `skills/`, ask what input
makes it say nothing, construct that input, and run it. If the silence
is indistinguishable from a pass, the guard has a hole the size of that
input. This is cheap: the decoy above took two minutes and one `mkdir`.

**A guard names what it declined to read, before it reports its
counts.** `skills/library-dirs.mjs` is where that question lives for
this library now, in the idiom of `source-line.mjs` and
`citing-files.mjs`: one module for a question two tools were answering
separately, because when two guards disagree about what counts as a
member, a skill one reads and the other does not is half-guarded and
neither says so. `check-evidence.mjs` and `trigger-coverage.mjs` both
report an unread directory by name, the second returns 1 for it without
waiting for `--check`, and the index is checked in both directions,
which closes the twenty-first run's ledger entry about shipping a skill
the index did not list.

**And a new guard's test carries one input the guard cannot read.** Every
unit test in `skills/library-dirs.test.mjs` would have passed on the day
the hole existed. The defect was never in a predicate. It was that no
caller asked, and only an end-to-end case over a library containing the
unreadable thing can fail for that.

Ours: the probe is the guard, which is `docs/agents/runner-facts.md` §7's
sentence about a register that says "re-probe", arrived at independently
in a different lane on the same day. A green suite is evidence about the
inputs it enumerated and about nothing else.

## 5t. A register entry is cited by fingerprinted range, never by identifier, and a dead identifier gets one canonical mention

(Added 2026-10-26, twenty-eighth run, from a rename this seat did not
perform and could not have detected.)

(Amended by §5aa (part 3). Generated line, per §5ah.)

Every rule from §5g onward is about a line range: in bounds, not inverted,
fingerprinted, re-pointed when `main` moves, re-read when the text under it
changes. None of them is about an identifier, and this library's registers
are full of them. `docs/agents/incidents.md` names its entries
`INC-YYYY-MM-DD-slug` and its own header freezes those names, which is why
nothing here was ever written to survive one changing.

**The measurement, taken the day one did.** Ursa's exo seat renamed an
accepted incident identifier and two rows of `docs/ideas.md`, both this
seat's, were left pointing at nothing. Against the library itself:
`docs/agents/incidents.md` carries 74 `## INC-` headings; this library
cites that file in two places, `adjudicating-uncertain-spans/E12` at
179-187 and `running-an-outcome-record-trial/E18` at 204-210; **none of the
74 headings falls inside either range**, and `grep -rc 'INC-' skills/` is
**0**. So `check-evidence.mjs`, `relocate-anchors.mjs` and
`relevance-sweep.mjs` all exited 0 through the rename, correctly, having
nothing to say about it. The library was not protected. It was unexposed,
which is a different thing and is not a property a run should rely on
without checking.

**The rule.** Three parts, and the third is the one that is easy to get
backwards.

1. **Inside a skill directory, cite a register entry by line range.** A
   range goes red when the text under it changes and relocates when it
   moves, which is the whole apparatus §5g through §5k build. An
   identifier written as a receipt has no fingerprint, no lock row and no
   failure mode, so it is §5p's defect in a different costume: it looks
   exactly like a citation and nothing checks it.
2. **An identifier in prose is a pointer, and it is resolved when it is
   written.** Ledger entries, pull request bodies and board messages all
   carry them legitimately, because a slug is how a person finds an entry.
   One line is the whole obligation, and it is cheap enough that there is
   no excuse for a run shipping an unresolved one:

   ```sh
   grep -qE "^## $slug( |$)" docs/agents/incidents.md || echo "DANGLING $slug"
   ```

3. **The record of a dead identifier does not reproduce the dead
   identifier.** A sweep that reads `docs/` for `INC-` tokens cannot tell a
   citation from a quotation of a broken citation. So an amendment that
   quotes the dead slug to explain itself re-arms, permanently, the check
   that just found a real defect, and the exo's own charter note says its
   prefix clause exists to stop exactly one false positive from teaching
   the next window to skip the check. Name the dead one by description,
   write the string out once, in the entry that records the rename, and
   point at that entry.

**What this is not, because the cheap move here is a ninth guard and it
would be wrong.** A slug-resolution check belongs where slugs are cited,
which is `docs/`, where another seat already runs one. A sweep added under
`skills/` would read zero identifiers today and duplicate that seat's check
tomorrow, and §5s is already the section about a guard that reports on the
subject it has left. The deliverable is this section plus part 2's one-line
resolve, not a tool.

Ours: the shape worth carrying past identifiers is that **a guard whose
subject is a string cannot distinguish use from mention**, so every such
check taxes the honest record of its own true positives. §5h taught that a
skill reporting a defect must be re-read when the defect is fixed. This
teaches the adjacent thing: a skill, or a ledger row, reporting a *broken
name* must be written so that reporting it does not count as repeating it.

## 5u. A count a trigger test states about the library is a count the landing run owes, because the tool already knows the right answer

(Added 2026-10-26, thirtieth run, after the ninth skill falsified nine
sentences in eight files that no guard reads.)

§5r gave the near-miss debt an owner and a deadline: the run that lands a
skill owes a near miss to every skill already in the library, in their
files, in the same pull request, and `trigger-coverage.mjs --check` exits 1
until it does. That rule is now paid in full and it covers only the
prompts. It says nothing about the prose around them, and every
`TRIGGER-TEST.md` in this library opens by stating how many neighbours the
skill has and how many near misses that buys.

**What that cost, measured on this run.** Landing the ninth skill
falsified 21 statements across 9 files, and fixing them was the largest
single edit in this run's diff after the skill itself.

The sharper half of the measurement is that **seven of the eight sibling
headers were already false before this run touched them**, checked
against `trigger-coverage.mjs`'s own output on the pre-run tree, where
every skill had seven neighbours:

```
  skill                         header said          tool said
  adding-a-bound                5 misses, 5 nbrs     7 misses, 7 nbrs
  adjudicating-uncertain        7 misses, 5 nbrs     9 misses, 7 nbrs
  auditing-a-correction-loop    6 misses, 6 nbrs     7 misses, 7 nbrs
  auditing-a-durability-walk    7 misses, 7 nbrs     7 misses, 7 nbrs  ok
  clearing-a-record             5 misses, 5 nbrs     7 misses, 7 nbrs
  distilling-a-tuning-record    5 misses, 5 nbrs     7 misses, 7 nbrs
  quoting-a-number              5 misses, 5 nbrs     7 misses, 7 nbrs
  running-an-outcome-trial      6 misses                8 misses
```

Four of them said "five neighbours", which was true when the library held
six skills, so the seventh skill falsified them and the eighth falsified
them again. Both of those landing runs paid §5r's prompt debt in these
same files and in the same pull requests, and neither touched the
sentence that counts the prompts it was adding. The only current header
belonged to the newest skill, which is the one shape this failure always
takes.

Every guard was green through all of it, and the reason is worth naming
rather than treating as an oversight: `check-evidence` fingerprints cited
ranges in other files, and a header's neighbour count cites nothing. It
is a claim about `skills/` itself, which is the one subject none of the
receipt guards has.

So: **the run that changes the number of skills in the library updates
every sentence that states it, in the same pull request as the skill**,
and the owner of that duty is the landing run for the same reason §5r and
§5q give, which is that an obligation with no deadline lands on whoever
is unlucky.

Two things make this cheap rather than another chore. The counts are
derivable, so no reading is required: `node skills/trigger-coverage.mjs`
already prints the live per-file prompt counts and the sibling-boundary
denominator, which is the neighbour count. And the statements are few,
because a header states it once.

**The mechanical part, deliberately not built this run.** The honest
version of this check is not a string search for number words. It is
`trigger-coverage.mjs` comparing its own computed denominator against the
number the file states, which means teaching it to read a count out of
prose, and a check that parses English for a number will have false
positives on every sentence that mentions a count historically. This
library has two such sentences already, `skills/README.md`'s note that
`adjudicating-uncertain-spans` had "then five neighbours" and §5r's own
account of "15 of 30 ordered pairs", and both are correct as written and
must stay. The ledger entry filed with this section proposes the shape
that survives that: the header states its count in a fenced marker the
tool reads, rather than in prose the tool guesses at, so a historical
sentence is invisible to the check by construction.

Ours: the general form, and it is the third instance of one pattern in
this file. §5g found a hash that outlived its lines, §5o a reading that
outlived them, and this is a *count* that outlived them. All three are the
same failure, a derived fact recorded by hand beside the thing it is
derived from, and the remedy is always one of two: have the tool compute
it, or have the tool check it. Never have the author remember it.

## 5v. A guard that asks git a question answers from this clone, and the clone is not the repository

(Added 2026-10-26, thirty-first run, after this seat's own relocation
tool spent a measurement reporting that files had left the repository
when what had left was the history it was given.)

Every rule from §5g onward rests on the same move: record a derived fact
beside the thing it is derived from, then have a tool re-derive it and
compare. §5u closed that loop for counts. This section closes it for the
one input none of those tools owns, which is the git history they read
the old tree out of.

**The clone a seat is handed is not a copy of this repository.** It is a
copy of one branch's tip. `tools/ensure-full-clone.sh` documents the two
independent properties, depth and refspec, and L-A77 in
`docs/standards/lessons.md` names that file by path. What belongs here is
the consequence for a receipt guard, which is sharper than the general
lesson: **git does not refuse the questions this clone cannot answer. It
answers them wrongly, and the wrong answer is indistinguishable from a
finding.**

**Measured on 2026-10-26, in a scratch repository, before the fix.**
`relocate-anchors.mjs` recovers the as-cited lines with
`git show <old-ref>:<path>`, inside a `try` whose `catch` recorded the
path as absent. Pointed at a sha this clone did not hold, it printed:

```
  fixture E1  src/f.ts:1
      src/f.ts is not in the tree at 1111111111111111111111111111111111111111
```

at exit 1, under the heading `Text changed, read these`. That is a claim
about what the repository contained at a commit, produced by a tool that
could not see the commit. The file was in every tree the repository
actually holds. A reader who acted on the line would have rewritten a
correct citation by hand; `bash tools/ensure-full-clone.sh` would have
settled it in one command.

**The shape, which is §5s's with the subject changed.** §5s says a guard
that skips its subject reports on the subject it has left. This is a
guard that *cannot reach* its subject and reports on the subject anyway,
by attributing its own blindness to the thing it was looking at. The
second is worse than the first, because a skipped subject leaves a
smaller number and a reader may notice the denominator, while a
misattributed failure arrives inside the output as a finding with a
sentence attached.

**So, three rules for anything under `skills/` that shells out to git.**

1. **Resolve the ref once, before any tree is read, and refuse the run.**
   `git rev-parse --verify --quiet <ref>^{commit}` is the whole check. A
   ref this checkout does not hold is an input error and exits 2, not a
   drift report at exit 1. Refusing every range is correct and is not
   overreach: if the ref is absent, every range would be misattributed,
   so there is no partial answer worth printing.
2. **Say which failure it is.** Read `git rev-parse
   --is-shallow-repository` in the error path and name the shallow clone
   when it is the cause, with `bash tools/ensure-full-clone.sh` as the
   repair. A seat reading the message should not have to know L-A77.
3. **Carry git's own sentence, never a paraphrase.** When a per-path read
   still fails on a ref the clone does hold, the failure really is about
   the repository, so the range belongs in the reader's queue. What goes
   in the queue is git's first stderr line, because this tool's paraphrase
   of it was a claim it had no way to check, and `exists on disk, but not
   in <sha>` is a different fact from `does not exist in <sha>`.

**The test that proves it has to be a real clone.** A stub cannot show
this, because the defect is a property of the clone rather than of the
code path. `relocate-anchors.test.mjs` now clones a scratch repository at
`--depth 1` and runs the tool against a commit that is genuinely outside
the copy, which is the seat's own situation reproduced rather than
simulated.

Ours, and the honest limit of it: this rule covers the guard reaching for
history. It does not cover the run reaching for it. A run that measures
anything across branches, including the containment checks the
"read your own seat's open PRs first" rule asks for, is reading the same
truncated graph, and `git merge-base` there prints nothing and exits
non-zero, which a shell substitution turns into the empty string and the
next command reads as a different question entirely. The first act of a
run that will compare branches is `bash tools/ensure-full-clone.sh`, and
this run learned that by getting four of fifteen readings wrong before
noticing.

## 5w. A ratio with nothing to divide is not a ratio of zero, and on a scale where zero is good it is the most dangerous number a tool can print

**Where this comes from.** Ursa's exo seat, on 2026-10-26, having
accepted two corrections from this seat, returned one of its own in the
same shape. Its sweep counted occurrences on a head against the head's
merge-base with `main`, and a missing base count had two causes that it
had folded into one: *no base at all* is no comparand, while *a base
that predates the file* is a comparand that genuinely measures zero.
One missing input, read as a measurement. Its remedy is the part worth
keeping: the unmeasurable case gets its own name and no class, and the
verdict is that it cannot tell.

**The same fold, found in this seat's own write surface the same day.**
`skills/relevance-sweep.mjs` computed the absent-word signal as
`tokens.length ? miss.length / tokens.length : 0`. A `what` field
yielding no content word therefore scored `0.000`, and on that scale
`0.000` is the best score in the library. So three independent readers
of the number agreed with each other, and all three were wrong in the
same direction: the queue sorts descending and ranked it last, the
`--signal` column printed it among the confirmed refs, and the
distribution the reading threshold is argued from counted it as data.

**Why this one survived longer than the exo seat's.** Its fold pointed
both ways at once, a false positive on one side and a false negative on
the other, which is loud enough that re-deriving a published figure
caught it. Mine pointed one way only, toward safe. A tool that only ever
makes its subject look better than it is produces no complaint, no
contradiction, and no second opinion, because the finding it suppresses
was never printed for anyone to argue with. **Prefer the fold that
screams.** When you cannot avoid a default, choose the direction that
makes something fail loudly over the direction that makes it pass
quietly.

**The rule, for anything under `skills/` that divides.**

1. **An empty denominator returns `null`, never a number.** Not zero,
   not one, not the mean. `null` is the only value that cannot be
   mistaken for a reading.
2. **Every reader of that value handles `null` explicitly.** There is no
   such thing as one reader. The ratio in this file had three, and
   fixing the expression without walking all three would have left the
   distribution table still counting a phantom zero. Grep for the field
   before you change it, and fix each site in the same commit.
3. **Publish no statistic over it.** A ref that was never measured is
   not evidence about the threshold it was never measured by. Count it
   out of the table, and say in one line how many were counted out, on
   both branches: "none" is the answer a reader wants and a missing line
   is not it. This is `docs/standards/pm.md` §15's rule for a saturated
   page, which says a page that could not be fully read is not an answer
   and no ratio is published from one, applied one level down.
4. **List it apart, with the reading it actually needs.** An
   unmeasurable ref does not belong anywhere on the scale, including the
   top. This file already had that pattern for the other end, where an
   unrangeable ref misses 100 percent of its words by construction and
   is listed separately rather than ranked. The fix was to notice the
   pattern was already there and apply it to the symmetric case.
5. **Keep the real zero a zero.** The whole risk of unfolding two cases
   is moving the one that was right. The test that matters is not the
   one asserting the new behaviour; it is the one asserting that a ref
   whose every content word is present still measures `0.000` and still
   sits in the table.

**Where to look for the next one, cheaply.** The sibling expression.
`density` in the same file returns `Infinity` for the same shape of
missing denominator and was always right. The two sat on consecutive
lines for weeks. When you find one of these, read the lines immediately
around it before looking anywhere else, because the author made both
choices in the same minute and only remembered one of them.

Ours, not a paper's, and the honest limit of it: the fault here was
latent. The library held 292 refs on the day of the fix and none of them
were in the state, so nothing in it was ever misread on this account.
What is measured is the reachability, not the harm: `check-evidence.mjs`
never reads the `what` field's content, so no gate in this library stands
between a wordless `what` and the best score on the scale.

## 5x. An instrument's own account of why it failed is one hypothesis, and a handoff publishes a finding

**Where this comes from.** This seat, on 2026-10-26, measured by the
seat it handed the work to. A run merged `origin/main`, found two of the
ledger's own tests red, and reproduced both on a clean checkout of
`origin/main` at a named sha with nothing of its own in it. All of that
was right. Then it read the failing test's message, took the single
cause that message named, and handed the engineer seat a note whose
first line was "one heading is the whole cause": a scan note written in
a spelling `SCAN_TITLE` in `tools/ledger/block-kinds.mjs` does not
recognise. `SCAN_TITLE` matches `Craft scan:` and always did. The real
cause was a `- First step:` label in the same block, which fires
`COMMITS_WORK`, makes the block an idea wearing a scan heading, and
brings the five-field contract due on it correctly. The repair this seat
recommended would have changed nothing, and one run of another seat was
spent establishing that.

**The cheap check that was not run.** One grep for the identifier the
failure message itself named, and reading the four lines of regex it
returns. Not a reproduction, not a bisect, not an experiment. The
evidence that falsified the published cause was in the file the message
pointed at, and the run that published the cause never opened it.

**Why a well-evidenced symptom is the trap.** The handoff named its
evidence for the symptom precisely, a clean checkout at a sha, and named
no evidence at all for the cause. Both sat in the same message, in
consecutive paragraphs, in the same voice. A reader cannot tell from
prose which sentence was measured and which was inferred, so the rigour
of the first claim is silently lent to the second. This is the same
defect §5n names for a sentence citing two refs, one level up: the
reader inherits a division nothing audits.

**Why the error is not caught by the loop that should catch it.** The
recommended repair was cheap, plausible, and in the other seat's lane.
Had it been applied without checking, the gate would have stayed red,
the next run would have read the same message, and the same cause would
now carry a seat's confirmation behind it. A wrong diagnosis attached to
a real symptom does not fail loudly. It gets adopted. §5w's rule applies
to prose as well as to ratios: prefer the form that screams.

**The rule, for any diagnosis this seat publishes.** A handoff, a board
message, a ledger `What` field, a `## Where this comes from` paragraph.

1. **A cause you read in an error message is a hypothesis.** Write it as
   one. "The failure message says X" is a claim about the message and is
   always true. "The cause is X" is a claim about the code, and the
   message is not evidence for it.
2. **Run the one command that would falsify it before you publish.**
   Usually a grep for the identifier the message already named. If the
   cause cannot be falsified in one command, say in the handoff what it
   would take, and hand over the symptom with the hypothesis marked as
   one. **And read the falsifying command's zero as carefully as its
   one.** This run reached for `grep -c` on a sentence from the
   classifier's comments to confirm the fix was on the default branch,
   got `0`, and had the hypothesis "the fix is not merged" available
   before noticing that the sentence it searched for wraps across two
   comment lines and `grep` is line-oriented. A zero from a text search
   has two causes, absent and not-on-one-line, and the second is the
   likelier one whenever the pattern came from prose rather than from
   code. `git diff` against the branch answered it in one command and
   has no such mode.
3. **Count the paths to the failing branch, not the causes the message
   lists.** A message names the cause its author thought of; the number
   of ways to reach that branch is a property of the code. Where they
   differ, the difference is the bug class to look for.
4. **Separate the evidence for the symptom from the evidence for the
   cause, in the text.** One sentence each, each with its own basis, or
   the reader reads one confidence for both.
5. **State the diagnosis's blast radius.** "This repair clears the gate"
   is checkable before anyone does the work; a recommended repair with
   no stated effect is a request for someone else's run on your
   hypothesis.

**The remedy worth copying, which is the other seat's.** It did not
change the rule the gate enforces. It changed what the gate says when it
fires: `block-kinds.test.mjs` now lists all three causes of that failure
and says which to check first. That generalises to every guard this seat
owns. **A guard whose failure message names one cause for a condition
with several is a single hypothesis wearing the authority of a
measurement**, and the reader who acts on it spends a run on the wrong
repair. So: each condition explains itself; each names every cause the
guard knows; and where there is an order worth checking in, it says
which comes first and why.

**Where to look for the next one, cheaply.** A guard whose exit branch
is reached by more than one condition and whose explanation is a
literal. Found in this seat's own lane the same day:
`skills/trigger-coverage.mjs` reached its shortfall branch on either an
uncovered sibling boundary or a skill with no `TRIGGER-TEST.md`, and
printed the near-miss arithmetic for both. `explainShortfall` is now a
pure function of which condition fired, with two causes for the missing
file and three for the gap.

That sweep is done, over all four guards, and its result is worth more
than the one fix. Every failing exit branch in `check-evidence.mjs`,
`relevance-sweep.mjs` and `relocate-anchors.mjs` prints one line per
failing item carrying that item's own status and reason, and none of
them asserts a cause for the branch as a whole. The one that did was the
one whose explanation was a literal at the bottom of the function,
printed after the per-item lines and therefore belonging to no item. So
the pattern to grep for is narrower and cheaper than "every `return 1`":
**a sentence about the cause that is not inside the loop over the
failures.** A per-item message is anchored to an item and its author
could see which one; a closing literal is anchored to nothing, and the
author wrote it while thinking of the only condition on their mind that
day.

Ours, not a paper's. The honest limit: the published-diagnosis half cost
a real run of a real seat and is measured. The guard half was latent at
the time of the fix, because 10 of 10 skills in this library carry a
trigger test and 90 of 90 boundaries are covered, so that branch has
never run against the real library with only the second condition set.

**Superseded in part, 2026-10-26, later the same day.** The paragraph
above is the sentence this rule got wrong about itself, and it is kept
rather than edited because the error is the evidence. "The guard half
was latent" was a claim about this library's traffic published in the
voice of a claim about the rule's weight. Ursa's engineer seat ran the
grep at the end of this section in its own lane within the hour and
found two more, one of them a live exposure on a real host. A third turned
up in the same file this section's own fix had just edited, missed because
this section's sweep was keyed to files. Four instances across two lanes
in a day is the measured weight, and **the sweep instruction here is
narrower than it should be**: read §5z, which replaces the file-keyed
sweep with an exit-branch one and adds the three mechanisms this section
did not have — duplication as the way an instance survives its own
repair, a summary line overriding correct per-item lines, and a message
naming a repair the reader is not allowed to make.

## 5y. A repair reported without naming its tree is read against the default branch, and the receipts have the same tense

**Where this comes from.** This seat, on 2026-10-26, corrected by Ursa's
exo seat, which verified the work and then corrected the sentence that
reported it. The work: two ledger rows citing an incident identifier
that had been renamed out from under them, repaired, and reported to the
exo as "both of my rows now point at the live heading." Every figure in
that report reproduced when the exo read them off this seat's branch
tip, so the repair was right. The sentence was not. The chain carrying
it was still open, so on the default branch both rows still carried the
dead name, the exo's sweep went on reporting a dangling citation, and
the two reports contradicted each other while both were accurate about
the tree each had read.

**Why the tense is load-bearing rather than pedantic.** A dangling
citation and a pending repair call for opposite responses from whoever
reads the register next. A regression is investigated. A pending repair
is merged. The exo had to choose between them from a report that did not
say which it was, and it chose right by reading the branch rather than
the claim, which is work this seat's sentence created.

**The inversion worth holding onto.** The charter already says that
`main` is not this organization's memory, so a file that looks
unrepaired is probably repaired in somebody's open pull request. Read
from the sweep's side the same fact runs the other way: a seat's own
report of a repair is evidence about a branch, and the sweep is evidence
about `main`, and the two disagreeing is the normal state of a correct
repair rather than a conflict to be resolved. What is wrong is only ever
the sentence that drops the reach.

**The same defect in this library's own guards, which is why this is a
format rule and not a note about manners.** `skills/check-evidence.mjs`
resolved every citation against the working tree and had no way to be
asked about any other tree. So "the evidence check is green, 437 ranges
fingerprinted" was a claim about one branch, published in the voice of a
claim about the library, and no reader could tell. Measured here on
2026-10-26: 3 of the 437 cited ranges point into `docs/ideas.md`, a file
this seat's own open chain rewrites by 451 lines, and all 3 survive on
`origin/main` only by where the chain happened to write. The cited
ranges are lines 8148 to 8171; the chain's earliest edit to that file is
at line 11485, more than three thousand lines below the last of them. A
chain that had inserted one line above 8148 would have moved all 3 for
every reader on `main`, and the branch check would have been exactly as
green.
Zero exposure, and not because anything guarded it.

**The rule.**

1. **A report of a repair names the tree it is true of, whenever that
   tree is not the default branch.** "Repaired on this branch, pending
   on `main` until the chain merges" costs eight words. "Repaired" costs
   another seat a verification pass, or worse, buys a wrong disposition
   in a register.
2. **Say which disposition the reader should write.** A repair that has
   not merged is a *pending repair* and not a *regression*, and the
   sender is the one who knows which. Name it, with the pull request in
   `data` where a number is allowed.
3. **A tool's exit status inherits the tense of the tree it read.** Any
   guard this seat publishes a number from must be able to say which
   tree produced the number, and must be asked the other tree's question
   before the number is reported as a property of the library. For the
   receipts that is `node skills/check-evidence.mjs --base origin/main`,
   which is the pre-merge form of the §5h and §5i re-grounding job: it
   finds the ranges that merging `main` will move, before the merge
   instead of after it. Run it beside the ordinary check and report both.
4. **A ref the clone cannot resolve is an abstention.** §5v's rule,
   applied: `--base` exits 2 and says it could not look, because a
   single-branch clone resolving nothing would otherwise report all 437
   citations missing, which reads as the library being broken. Repair the
   clone with `tools/ensure-full-clone.sh` and ask again.

Ours, not a paper's. The honest limit: the reporting half is measured,
because a real seat spent a real pass resolving a tense this seat should
have written. The guard half found nothing. All 437 ranges resolve
identically on `origin/main` today, so `--base` has never yet changed a
disposition in this library, and its only demonstration against real
data is a tree eight days old, where it reports 216 problems of which
162 are drifted receipts.

## 5z. A guard's explanation is code, so it is duplicated like code, and a message naming a repair names who may make it

**Where this comes from.** §5x, run in another lane. This seat published
that rule on 2026-10-26 and ended it with a cheap place to look for the
next instance. Ursa's engineer seat ran the grep in its own lane before
replying, found two, and named this seat's `trigger-coverage.mjs`
instance as the third. Three across two lanes in one day is its
argument, and it is the right one: that is a defect class and not two
bugs. Looking again at the right unit turned up a fourth, in the file
this seat had already fixed. All four verified here against
`origin/main` and the engineer's branch rather than taken from the
report.

**The four.** The first two are the engineer's and the diffs are on
`ursa-engineer/2026-10-26-message-9`, pull request #540.

1. **Both callers of the Claude Code CLI**, `claudeRunner` in
   `ursa-major/src/tuning/distill.ts` and `claudeVerdictRunner` in
   `ursa-major/src/verdict.ts`, held the same eight lines, and the same
   `if (envelope.is_error || typeof envelope.result !== 'string')` with
   `'claude -p returned an error envelope'` for all three ways in. The
   expensive branch is the one where `is_error` is set and `result`
   already holds the fix: on the host the engineer measured, that string
   was `Not logged in · Please run /login`, and the message threw it
   away in favour of a sentence naming no cause at all.
2. **The dependency floor gate**, `scripts/dep-floor.mjs`, whose
   `failed` is `violations.length > 0 || expired.length > 0` and whose
   closing literal said *Dependency floor breached* for both. An expired
   exception is the floor never having been breached. It is
   `dep-floor.allow.json` working as its own header says it should, "a
   risk the owner accepted on a Tuesday should come back and ask again".
3. **`skills/trigger-coverage.mjs`'s shortfall branch**, reached by an
   uncovered sibling boundary or a skill with no `TRIGGER-TEST.md`, both
   explained with the near-miss arithmetic. Fixed at 19:09 UTC.
4. **The same file's library-shape branch**, two screens below, added at
   00:43 UTC the same day and untouched by the fix at 19:09 or by the
   sweep that came with it. `N library-shape defect(s) above, listed
   before the counts.` was one class name over a sum of four disjoint
   conditions, and the sentence the reader acts on told them where to
   scroll. Fixed here, with `explainShape`.

**What §5x did not have, which is why this is its own section.**

**First: duplication is the propagation mechanism, and it is why the
instance survives its own repair.** The distiller got `cliFailureReason`
at 10:47 UTC and the verdict reader, four directories away, kept the
original bug until 19:26. For nine hours this repository held a
diagnosed, fixed, documented defect and a working copy of it, and `ursa
run` on an unauthenticated host still printed Node's `Command failed`
over the top of the reason. Nobody reintroduced anything. The repair
simply landed on one of two copies, and no instrument anywhere notices
that two call sites of the same CLI explain its failure differently.

**Second: the unit of the sweep is the exit branch, not the file.** §5x
said to look for "a sentence about the cause that is not inside the loop
over the failures", swept all four guards in this library at file
granularity, and declared them clean. Instance 4 was in the file being
edited, in the function below the one being fixed. A sweep keyed to
files stops at the first finding in each file, and the file then looks
done. Count the failing exit branches and account for each of them
separately, including the ones in the file you came to fix.

The accounting, done properly for this library on 2026-10-26, because a
rule that asks for a count owes the count. Every `exit 1` or `exit 2`
path in the four guards: **15** branches, six in `check-evidence.mjs`,
four in `relevance-sweep.mjs`, three in `relocate-anchors.mjs`, two in
`trigger-coverage.mjs`. The file-keyed sweep reported on four files and
named four branches, so eleven were never looked at either way. Of the
15, **three** are reached by a disjunction rather than by one condition:
`trigger-coverage.mjs`'s shortfall branch and its shape branch, which
were instances 3 and 4 and are now fixed, and `relevance-sweep.mjs`'s
`--stale` branch, reached by an unbound verdict or an unread ref, which
was already correct — it prints one line per failing item carrying that
item's own status and closes with a count rather than a cause. The other
twelve are each reached by exactly one condition and each explain that
condition. Two of three defective is a bad rate; the point of the count
is that nobody knew the denominator.

**Third: a summary line can override correct per-item lines, which is
worse than being uninformative.** §5x concluded that a per-item message
is safe because it is anchored to an item whose author could see which
one it was. Instance 2 is the limit of that. `dep-floor.mjs` printed, per
expired exception, *"the exception for X expired on Y (approved by Z).
Fix it or have the owner renew it"* — correct, complete, naming the
condition and the actor — and then printed *Dependency floor breached* as
its conclusion. The reader believes the last line, because the last line
is where a tool puts its verdict. So the closing literal is not merely
under-informed. It can contradict information already on the screen and
win.

**Fourth: a message that names a repair names who may make it.** The
expired-exception branch asked a seat for a repair only the owner can
make, and a seat that believes a gate is its own to clear will either
force it or spend a run discovering it cannot. This seat already holds
the practice on the other side — a ledger status line is left alone
because only the owner moves one — and had never written it as a rule
about messages.

**The rule.**

1. **Count the failing exit branches in the file, not the findings.** One
   message per branch, and a branch reached by a disjunction owes one
   sentence per disjunct. A fix to one branch is not a fact about the
   file.
2. **Make the explanation a named pure function, and make every path
   reach the same one.** This is the remedy in all four instances:
   `runClaudePrint` and `envelopeFailure`, `summaryLine`,
   `explainShortfall`, `explainShape`. It is also already this library's
   answer whenever two guards disagreed about *data* —
   `source-line.mjs`, `citing-files.mjs`, `library-dirs.mjs`, each
   earned the expensive way. Explanations are the same kind of thing and
   were not getting the same treatment. A duplicated explanation is a
   repair that will land on one copy.
3. **Never collapse several conditions into one count under one class
   name.** Break the count out by condition, in the line that carries
   it. `2 library-shape defects: 0 unread, 0 unlisted, 1 dangling index
   row, 1 mislabelled` is two edits to one markdown file. `2
   library-shape defects` is indistinguishable from two unguarded
   skills.
4. **Name the actor with the repair, whenever it is not the reader.**
   "The owner renews it", "the repair is in this file and not in your
   credentials", "this is paperwork and the floor holds". A repair with
   no named hand defaults to the reader's, and a gate that asks for a
   repair the reader cannot make is a gate that gets forced.
5. **Order the conditions by which to repair first, and say why.** Where
   one of them means something is actually unguarded and the others mean
   something is merely unlisted, that is the order, and the sentence has
   to carry it or the reader works top to bottom.
6. **Quote a measured string from the file that holds it, not from
   memory of the host.** The engineer's note to this seat quoted the
   login message as `"Not logged in, please run /login"`; the envelope,
   the test and the run note all carry `Not logged in · Please run
   /login`. Nothing turned on it here. It is in the rule because the
   whole subject is the distance between a measured string and a
   remembered one, and a quote that drifts in transit is that distance
   one level down.

**On "live".** Of the four, exactly one has been observed firing: the
verdict reader, on a real host, in the engineer's own dogfooding run.
`dep-floor.allow.json` holds an empty `exceptions` array, so instance 2
has never reached its branch; 10 of 10 skills carry a trigger test and 90
of 90 boundaries are covered, so instance 3 has not; and this library has
no unread directory and no index disagreement, so instance 4 fired only
against a decoy. That does not weaken the class — §5x's third point is
that the number of paths to a branch is a property of the code and not of
this week's traffic — but a report of "two live instances" and a report
of "one observed firing" hand a reader different urgencies, and the
second one is what the evidence here supports.

Ours, not a paper's. The honest limit: the duplication half is measured
and cost a real exposure, nine hours of a fixed defect still shipping on
a sibling path. The sweep-unit half is measured, because the sweep that
missed instance 4 is this seat's own and the finding is a day old. The
actor half has no instance in this library at all. Every one of
`explainShape`'s four repairs is a seat's, which is said out loud in its
own text; the rule comes from the engineer's lane, and this seat is
carrying it on the strength of one instance elsewhere.

## 5aa. A cap on mentions is a cap on measurement, so the exempt mention is the one whose correctness depends on the name not resolving

(Added 2026-10-26, thirty-eighth run, amending §5t part 3. The boundary is
Ursa's exo seat's, proposed in a board note after it verified this seat's
repair off its own tip. The measurement that makes the boundary the common
case rather than an exception is this run's.)

(Amended by §5ad (part 4). Generated line, per §5ah.)

**What §5t part 3 said, and the half of it that was wrong.** It said that
the record of a dead identifier does not reproduce the dead identifier:
name the dead one by description, write the string out once in the entry
recording the rename, and point at that entry. The reasoning was that a
sweep reading `docs/` for `INC-` tokens cannot tell a citation from the
quotation of a broken citation, so an honest amendment re-arms the check
that just found a real defect. That reasoning is still correct. The remedy
drawn from it is not, because it rations the record in order to protect
the sweep, and it never asked what the sweep is worth.

**The boundary, as the exo seat put it.** Its lane carries the dead name
five times: one canonical record, one probe, one run record and two quoted
commands. All four of the latter are load-bearing on the name not
resolving. So a one-mention cap holds for a library whose citations are
claims and cannot hold in a lane whose job is measuring the string's
removal, and the discriminator is **whether a mention asserts the name
resolves**, which that seat's gate already carries as a test. Taken whole.
A lane that must prove a string is gone is exactly the lane that must
write it most, and a cap would force the instrument to be published
without its own search term, which is §5s in a new costume: a guard that
cannot name its subject has left it.

**Verified rather than taken, off `ursa-exo/2026-10-26-message-9` at
`c29689e`.** Seven occurrences of the dead slug on that tip, and the five
the note claims are the five in that seat's own files, correctly counted:
the table row in `docs/agents/incidents.md` that classifies it as the real
finding, the `"text"` field of a probe artifact under `docs/runs/`, two
quoted `git grep -c '<slug>' origin/main -- docs/ideas.md` properties in
`docs/agents/learning-log.md` that both assert the count is **0**, and
`const REAL = '<slug>'` in `tools/stack/repair-pending.test.mjs`, whose
test skips on `the string has left main; the finding is closed`. The other
two are in `docs/ideas.md`, which is this seat's file and that branch's
stale copy of it, and that seat excluded them on exactly that ground. Each
of the five inverts if the name ever resolves, so none of them asserts it
does.

**Why the boundary is not an exception, measured on this run's own tip.**
Every `INC-YYYY-MM-DD-slug` string cited anywhere in `docs/`, `prompts/`,
`tools/` and `scripts/`, against the 74 `## INC-` headings in
`docs/agents/incidents.md`:

| | count |
|---|---|
| unique slug strings cited | 87 |
| resolve to a heading exactly | 74 |
| resolve as the prefix of exactly one heading | 2 |
| prefix of more than one heading | 0 |
| resolve to nothing at all | 11 |
| **of those 13 unresolvable strings, broken citations** | **0** |

All thirteen are exempt mentions. Five are invented fixtures in
`tools/registers/merge-driver.test.mjs` and `tools/ledger/ledger.test.mjs`
that were never register entries. Four are citations of *other companies'*
incidents in `docs/standards/lessons.md`, which is HQ's vendored register
and correct in its own terms. One is an invented example that says so in
its own line. The remaining three sit inside the exo seat's measurement
paragraph at `docs/agents/incidents.md` 7690-7694, which exists to
classify them, and the single bare occurrence of the abbreviated
`board-runtime-token` form on this tip is inside a quoted
`grep '^## <slug>'` at line 7536.

So the precision of a slug-resolution sweep over this repository today is
**0 of 13**. Its entire output is the honest record of its own past true
positives plus the fixtures of its own tests. §5t paid for that sweep in
the currency of the record, and the sweep had nothing to find.

**The rule, replacing §5t part 3.**

1. **A mention that asserts the identifier resolves is a citation, and one
   dead one is already too many.** This is what §5t part 2's write-time
   resolve is for, and that half stands unchanged: the run writing the
   pointer resolves it at the moment it writes it.
2. **A mention whose correctness depends on the identifier not resolving
   is exempt, and there is no cap on it.** Probe terms, assertions of
   absence, expected-zero counts, test constants and quoted commands all
   belong here. Write as many as the measurement needs.
3. **An exempt mention is dated, because resolution is not a stable
   property of a string.** Each of the exo seat's five inverts silently if
   the name comes back, and this register's freeze rule covers numbers
   rather than slugs, so the paths back are real: a rename reversed, an
   entry re-filed, or a sibling heading created that extends the dead
   string. The honest form is the one that seat's test already has, a skip
   that fires when the string leaves rather than an assertion that flips,
   and the general shape is §5o: the exemption is bound to the register
   state it was read against.
4. **Do not build the sweep, and do not ration the record to protect it.**
   §5t already declined to add a ninth guard under `skills/`, for the right
   reason. This section says the stronger thing: the exclusion list such a
   sweep would need is not a one-time grep but a standing maintenance
   obligation, growing by one row every time the check does its job, and a
   check that cannot tell its own residue from a defect should be asked for
   its precision before it is asked for its coverage.

**One clause §5t part 2's one-liner is missing, and it is this run's own
defect.** The published probe is
`grep -qE "^## $slug( |$)" docs/agents/incidents.md || echo "DANGLING $slug"`,
and on this tip it calls two abbreviated citations dangling. The house
style abbreviates a long slug in prose, which is legitimate because a
prose pointer is for a person. So the probe resolves a prefix, and the
failure mode an abbreviation actually has is ambiguity rather than
absence:

```sh
n=$(grep -cE "^## $slug" docs/agents/incidents.md)
[ "$n" = 0 ] && echo "DANGLING $slug"
[ "$n" -gt 1 ] && echo "AMBIGUOUS $slug ($n headings)"
```

The ambiguity arm has **0 instances on this tip** and is therefore
unexercised, which §5s requires be said out loud rather than reported as
green. A slug written with an elision inside it, which this tip does once,
is not resolvable by any string probe at all and is a pointer for a reader
only.

Ours, not a paper's. The boundary in parts 1 and 2 is the exo seat's and
is carried on its argument plus five verified instances in its lane. Part
3's expiry is this seat's addition and has no instance yet, only the three
named mechanisms and one near relative measured here, the abbreviated form
that resolves as a prefix today and would resolve exactly if a heading
were ever filed under the short name. Part 4's precision figure is
measured on one tip of one repository on one day, so it is evidence that
this sweep is not worth building here and not a general claim about
string-resolution checks.

## 5ab. The merge gate is a property of a path, so a pull request states its gate rather than making its reader derive it

(Added 2026-10-26, thirty-ninth run, after Ursa's PM seat declined to merge
the thirty-eighth run's pull request and said so on the board instead of
leaving it to be guessed at. The finding this rests on is not this seat's:
it is the exo seat's, written into `prompts/exo-agent.md` §5 at lines
1127-1186 on 2026-10-18. What this run adds is the price for this seat,
the precedent nobody had written down, and the one line this seat can ship
without anyone's permission.)

**What happened, and why the PM was right.** `docs/standards/pm.md` §10
defines the first item of Tier C as "Charters (`prompts/`)", by directory,
and criterion 4 of the Tier B list is that `gh pr diff --name-only` shows
no Tier C path. This file is under `prompts/`. The thirty-eighth run's
pull request changed forty-one files, of which this one was the only file
under that directory, and that single path escalated the whole of it to
the owner or a chair. So the PM's note is a correct reading of the text it
was reading. It also read the diff itself rather than trusting the title,
which is the form this register asks for everywhere, and it named the
block as the path rather than asking for a content change, which is the
distinction that makes a note like it actionable in one pass.

**The finding is eight days old and this seat does not get to re-derive
it.** The exo seat established it after two seats made the same mistake in
opposite directions inside ten minutes: the charter set is
`prompts/*-agent.md`, eleven files, one per seat, and the twelfth file in
that directory is this one, a format specification the skill seat writes
as ordinary work. This seat's own charter says so at
`prompts/skill-agent.md` line 56, "Write only under `skills/`,
`prompts/skill-extract.md`, and ledger". So a path predicate of `prompts/`
over-reports charter activity by exactly one file, and that file is one of
the busiest in the repository. That seat also named the upstream defect as
the standard's wording, said it was not its to fix because §10 is Tier C
and HQ's, and asked that it be added to the escalation the PM carried to
the owner at 12:29:59 on 2026-10-18 with a silence clock to 2026-10-20
12:30 UTC.

**The clock expired six days ago.** Verified this run: §10 on
`origin/main` still reads "Charters (`prompts/`)" at line 286. So the
ambiguity is not in flight in any sense a seat can rely on, and every pass
of the merge gate that meets this file pays for it again.

**The price, measured on a repaired clone.** The checkout this run was
given was shallow, and `git log origin/main --first-parent -- <path>`
answered **0** on it for every path below, which is §5v exactly: a guard
that asks git a question answers from this clone, and the clone is not the
repository. After `bash tools/ensure-full-clone.sh` took it from 1,648 to
3,482 commits and from 3 to 246 remote-tracking refs, over the 195
first-parent merges on `origin/main`:

| | count |
|---|---|
| pull requests landed on `main` touching any `prompts/*.md` | 30 |
| of those, touching a `*-agent.md` charter | 22 |
| of those, touching `prompts/skill-extract.md` | 8 |
| touching both | **0** |

So the directory predicate calls 30 landed pull requests charter changes
and 8 of them, 27 percent, changed no charter at all. The two sets are
**disjoint**, which is the load-bearing half: no pull request in this
repository's history has ever bundled this file with a real charter edit,
so the over-report is clean and an exception written at the path level
would cost the gate nothing it currently catches.

**And the price for this seat, on one day.** The six pull requests this
seat opened on 2026-10-26:

| | count |
|---|---|
| opened by this seat | 6 |
| carrying exactly one file under `prompts/` | 6 |
| that one file being `prompts/skill-extract.md` | 6 |
| carrying a `*-agent.md` charter | **0** |
| passing the PM's own criterion 4 | **0** |

Measured at `4c15105`, this branch's tip before this correction was
written, the diff against `origin/main` is 6,123 changed lines, of which
965 are this file and 5,158 are skills, tests, trigger tests and run
records. **So 84 percent of the run's output waits on a gate that 16
percent of it earns**, and this seat has never once handed its own
company's merge gate something that gate was allowed to act on. The tree
is named because the measurement moves when this file does, which is §5y:
a figure reported without its tree is read against the default branch,
and the first draft of this paragraph quoted the figures from before this
section existed.

**The precedent, which is what a reader actually needs.** Eight pull
requests carrying this file have landed on `main`, the most recent of them
today. Four of the eight are claimed on the board by the PM seat's own
passes, in `data.merged`, on 2026-10-18 at 13:40, 13:54, 14:17 and 18:33
UTC. The 14:17 one names itself in its own subject: "Thirty-sixth pass
closed: fixed my own prior pass own Tier C misread, merged the…", with
`{"pass": 36, "merged": [254]}` in its data. So this company's operative
practice, set by its own merge gate four times in one day and by the
landed record eight times in all, is that this file is Tier B, and the
text of its standard says the opposite. Today's pass read the text. The
2026-10-18 pass read the practice. Neither pass misread what it read, and
that is the definition of an ambiguity rather than an error — which is
also why reading the same section once more is not the remedy and a
sentence in it is.

**The rule.**

1. **Every pull request from this seat states its merge gate in the
   description, in one line, above everything else.** The form:

   ```
   Merge gate: Tier C by path — prompts/skill-extract.md (+N/-M at <sha>).
   No prompts/*-agent.md charter in this diff. Tier B otherwise.
   ```

   The insertion count carries a commit because the file being counted is
   the file the disclosure lives in, so the number moves every time the
   disclosure is edited. That is §5y applied to one line: a figure
   reported without its tree is read against the default branch, and this
   particular figure cannot be made stable, only dated.

   Say `Merge gate: Tier B — no Tier C path in this diff` when there is
   none. The number is what `git diff --stat origin/main...HEAD --
   prompts/skill-extract.md` prints; the charter check is `git diff
   --name-only origin/main...HEAD -- 'prompts/*-agent.md'`, which is the
   predicate the exo seat corrected to and the one this seat is counted
   by. This is that seat's own disclosure line turned on the diff that
   caused it, for the same stated reason: the party who must act on a
   classification cannot be told by a description that does not mention
   it.

2. **State the gate; do not argue it.** The line reports a path and a
   predicate, both of which the reader can run in one command. A seat that
   uses its own pull request to lobby its own merger has turned a
   disclosure into a brief, and the next pass has to re-litigate rather
   than read. Where this seat has an argument about the tier, it belongs
   in the ledger, addressed to the owner, once.

3. **The escalation is inherited down a stack, and this run cannot
   demonstrate it.** "Read your own seat's open PRs first" tells a run to
   branch from its own open tip rather than from `main`, so once any run
   touches this file every later run that stacks on it is Tier C by path
   whether its own commits touch the file or not. This run's own commits
   do touch it, so this run is not the evidence; the evidence would be the
   first stacked run after one that leaves the file alone, and it should
   say so in its gate line when it happens. Until then this is a
   consequence of two rules read together, not a measurement.

4. **Do not ship the relocation as this seat's remedy, and do not treat
   the gate as a reason to split the run.** Moving this file out of
   `prompts/` would make the predicate true, and it is not this seat's
   move to make: it would edit `.github/workflows/agent-skill.yml` line
   81, which is HQ's machinery and which no product seat edits;
   `prompts/skill-agent.md` lines 36 and 56, which is this seat's own
   charter and Tier C; and `prompts/exo-agent.md` and
   `prompts/research-agent.md`, which are other seats'. Four files across
   three owners, none of them this one. It goes in the ledger with that
   cost attached so the owner can weigh it against the wording fix in one
   read, and the wording fix stays the remedy this seat backs, because it
   is already in front of her and because it fixes the predicate for every
   seat rather than for this file. Splitting the work into two pull
   requests to get the library half merged is not available either: the
   charter allows one pull request per run, and a run that ships its rule
   late to buy a merge has paid in the thing the register is for.

Ours, not a paper's, and most of it someone else's. The path analysis and
the corrected predicate are the exo seat's, carried on its argument and on
the disjointness measured here rather than taken. The precedent count, the
27 percent, the six-of-six and the 84 percent are this run's, measured on
one repaired clone of one repository on one day; the eight landed pull
requests are a fact about this history and the four board claims are a
fact about four messages, and neither is a claim about what the owner would
decide if asked. Part 3 has no instance yet and says so.

## 5ac. A red check belongs to a ref and not to a seat, and a value removed by a commit stays reachable until the ref is gone

(Added 2026-10-26, fortieth run, after Ursa's security seat reported this
seat's branch red on the redaction gate. Its six-run count was exact, its
two recommendations are adopted whole, and its one-line repair had already
landed. The reason the note and the repository disagreed is the subject of
this section, and it is a rule about how this seat writes evidence rather
than a complaint about how another seat wrote its own.)

**What the note said and what the gate recorded.** The note named six red
gate runs between 19:38 and 19:53, one line of one run note quoting a
board message id in full, and said "the branch head still carries it, so
the check is red as of my run". Every factual part of that is checkable
and the count is exact: `gh run list --workflow=redaction-gate.yml --limit
300` returns exactly six failures in that window and all six are this
seat's. What is not exact is the ref. All six are on
`ursa-skill/2026-10-26-message-3`, whose pull request is closed. The
branch that was live when the note arrived is
`ursa-skill/2026-10-26-message`, which has 19 gate runs and all 19 green,
because the offending line was truncated to eight characters at 19:55:47,
two minutes after the last red run. So no open pull request of this seat
had a red check at any point the note could have been read.

**Why this is this seat's rule and not the sender's mistake.** This seat
opened six pull requests on 2026-10-26 and pushed to more than a dozen
refs. A sweep keyed on the seat finds the seat's runs and then has to
guess which of the seat's refs they are about, and the obvious guess —
the one that is current — is wrong exactly when the seat has already
fixed the thing, which is the case where a note is most likely to be
sent. The engineer seat raised the same distinction in the same inbox from
the other side: it swept its own gates keyed on the failing exit branch
rather than on the file, "which is the unit your correction names", and
keying it correctly found both halves of a class where keying it by file
had found none. A sweep's key is part of its claim.

**So, when this seat reports a check:**

1. Name the **ref** and the **run**, never the seat and never "your
   branch". A branch name and a timestamp or run id, both of which the
   reporting command already printed.
2. Say whether that ref has an **open pull request**. A red check on a
   closed ref is a different object from a red check on an open one: one
   blocks a merge and one cannot.
3. State the **tense against that ref's tip**, per §5y. "Red at `<sha>`,
   green at the tip" and "red at the tip" are not the same report, and the
   first is the common case for anything a run has already noticed.

**The second half, which the correct tense would still have hidden.** The
gate reads the working tree and not history. `scripts/redaction-check.mjs`
says so in its own header, inherited from the workflow and queued as
PWC-8. The truncation commit therefore makes the tree clean and leaves the
history alone: `33078f12` is a strict ancestor of this seat's live branch,
verified with `git merge-base --is-ancestor`, and its tree carries the
value in full. Of the four commits reachable from that branch that touch
the run note, **three carry the full id and one is the truncation**. The
value is fetchable by commit from a ref whose every check is green.

**And the class, which is the part a reader can act on.** Swept over all
**248** remote-tracking refs of this repository rather than over this
seat's, three tip trees carry a full identifier under `docs/`: one of this
seat's, one of the exo seat's in two register files, one of the frontend
seat's in a review artifact. `origin/main` is clean. **All three sit
behind a closed pull request.** The gate's triggers are `push` to `main`,
`pull_request` and `workflow_dispatch`, so a ref whose pull request is
closed is never scanned again and never cleared, while a public repository
goes on serving its blobs. Closing the pull request is the one disposition
that turns a caught leak into a permanent one, and it is the disposition a
red gate most encourages.

**The rule that follows for this seat's own writing.** A value this seat
removes by commit is reported as **still reachable** until the ref
carrying it is deleted, and the sentence says which ref. "Fixed" is a
claim about a tree. "Gone" is a claim about a ref set, and this seat may
not make the second one, because deleting a ref is the PM seat's and
sweeping the ref set is the security seat's. Both were handed over on the
board with the measurement attached rather than worked around.

**The cheap half, adopted whole from the note that found this.** Run
`node scripts/redaction-check.mjs` before pushing anything under `docs/`.
It answers in under a second, reads the gate's own three patterns out of
the workflow so there is nothing to drift, and prints the location without
the value. This run ran it before its first push and before every commit
after it. The companion rule, which the redaction standard now states
outright, is that a board message id is truncated to eight characters the
same way a session id is, because the two have the same shape and the
gate's pattern cannot tell them apart.

## 5ad. The discriminator is whether the string is load-bearing as a search key, so the fixture is re-spelled and the record is left alone and the resolver's scope moves

(Added 2026-10-26, forty-first run, amending §5aa part 4 and answering the
remedy Ursa's exo seat proposed in a board note after re-deriving §5aa's
measurement on the default branch. Its two findings are taken and verified
here rather than accepted. The framing both seats reached for is corrected,
because it is right for one of the two residue classes and wrong for the
other.)

**The corroboration, re-derived rather than taken.** §5aa published the
precision of a slug-resolution sweep over this repository as 0 of 13 on
one branch tip. That seat re-derived it on `origin/main` and got 8
unresolvable with 0 broken citations. Re-derived a third time here, on
`origin/main` at `55aeaf3`, over `docs/`, `prompts/`, `tools/` and
`scripts/`, against the 83 `## INC-` headings in `docs/agents/incidents.md`:

| | count |
|---|---|
| unique slug strings cited | 98 |
| resolve to a heading exactly | 83 |
| resolve as the prefix of exactly one heading | 3 |
| prefix of more than one heading | 0 |
| resolve to nothing at all | 12 |
| **of those 12, broken citations** | **0** |

Three derivations on three tips give 13, 8 and 12, every one of them with
a numerator of zero. The spread is scope and tip, not disagreement, and the
conclusion §5aa drew survives all three.

**The composition, which is firmer than either seat stated it.** Of the 12,
**5 are cited inside `docs/agents/incidents.md` itself**, which is the
authority the resolver reads its headings from. Four of those five sit in
one table whose own verdict column reads `0` and whose notes read "foreign
or illustrative, not a finding" and "invented example, as the check's own
note says". So the check does not merely read its own documentation back as
findings. The rows it reads back are the rows recording the verdict zero,
which means it reports its own negative result as a positive one, through
the one path that can never be excluded, because that path is the
authority. **6 are invented constants** in synthetic register fixtures in
`tools/registers/merge-driver.test.mjs`, `tools/ledger/ledger.test.mjs` and
`tools/stack/repair-pending.test.mjs`. **1 is cited only in
`docs/standards/lessons.md`**, which is HQ's vendored register naming
another company's incident and is correct in its own terms. Eleven of the
twelve are therefore the check's own residue, being its register's
exculpations plus its tests' fixtures, and the twelfth is a category error
about whose register a citation resolves against.

**The framing both seats reached for, and why it is half right.** That
seat's note put the repair as: a mention asserting a name is gone should
not be spelled in the form a resolver scans for. §5aa part 4's own remedy
was the same move from the other end, declining the sweep rather than
re-spelling the record. Neither is the discriminator. The discriminator is
**whether the string is load-bearing as a search key**:

- A **record** of a dead name is worthless if it cannot be found by
  grepping for the thing it exculpates. Re-spelling it is §5s exactly, a
  guard that cannot name its subject has left it, and this seat has already
  paid once for rationing a record to protect a sweep. So a record keeps
  the literal string, and the only honest repair on that class is scope.
- A **fixture** is arbitrary to everything except the pattern that parses
  it. Re-spelling it costs nothing a test asserts, so the fixture is where
  the notation repair belongs and it is free there.

**The three repairs, one per class, each permanent and none of them a
list.** The reason to care about listlessness is the one §5aa part 4 named:
an exclusion list grows by one row every time the check does its job, so
its maintenance cost is proportional to its own success.

1. **A resolver does not read the register it resolves against.** Every
   name in `docs/agents/incidents.md` is a name that file has an opinion
   about, by construction. Excluding it as an input retires 5 of the 12 and
   every row the exculpation table will gain in future, at one line of
   scope and no cost to the record.
2. **A fixture dates itself impossibly.** The identifier pattern is
   declared, in `tools/registers/registers.json`, as
   `^## (Incident [0-9]+[a-z]?|INC-[0-9]{4}-[0-9]{2}-[0-9]{2}-[a-z0-9-]+)`.
   An impossible date satisfies it, so `INC-0000-00-00-a-slug` still
   exercises the identifier arm the fixture exists to exercise. Verified by
   running the declared pattern over all six proposed strings rather than
   by reading it: six of six match, and `0000-00-00` appears in no heading
   on `main`. Retires 6 of the 12 behind one clause that never grows,
   instead of six names that grow with every new test.
3. **A vendored register resolves against its own authority.** HQ's
   `docs/standards/lessons.md` names other companies' incidents, so
   resolving its citations against this company's register is a category
   error rather than a false positive. Retires the last one, in the same
   line of scope as part 1.

**Say the honest thing about the residual, because zero output is not
precision.** With all three applied the check's output on `main` today is
zero findings, and zero findings is the absence of evidence about its
true-positive rate rather than evidence of a good one. §5w is the rule
being obeyed: on a scale where zero is good, zero is the number most
easily mistaken for a result. The check's only true positive in its history
was found the other way, by **widening** scope to `prompts/` and reading a
branch rather than `origin/main`, where a citation named an incident by a
form minted in no heading on any ref of this repository, inside a sentence
asserting the name resolves. One true positive, and the scope that found it
is the scope that nothing above touches. So the ordering for whoever owns
the check is coverage first and quiet second: a check pointed only at
`origin/main` can report a defect and can never prevent one.

**What this seat may and may not do with the above.** §5aa part 4 stands
unamended on its own subject: this library does not build the sweep, and
`skills/` contributes no citation to any of the three derivations. All
three repairs are other seats' files, being the check's scope and HQ's
vendored register for the exo seat and three test files for the engineer
seat, so they go out as a ledger entry and a board note with the
measurement attached, per §5z. The one thing in this seat's own lane is
the rule above, and the one slug on this tip that no string probe can
resolve at all is this seat's own elided mention in `docs/ideas.md`, which
names the register it resolves against in the same sentence. That is the
form §5aa part 3 asked for, arrived at by house style rather than by
design, and it is why part 3's dating requirement is kept: an exemption is
bound to the register state it was read against.

**This section's own contribution to the count, stated because §5q makes a
run own the number it changes.** Writing part 2 put the first reserved-date
string in this repository, so a naive scan over this tip now returns 14
where `main` returns 12, and the new row is that example. It is the claim
working rather than an exception to it: the row is decidable as a fixture
from the string alone, by a reader and by one clause, with nothing added to
any list. The other row this tip carries over `main` is the elided mention
named above.

Ours, not a paper's. The corroboration and the one true positive are the
exo seat's and are credited as such. The composition, the load-bearing-key
discriminator, the three-way split and the reserved-date verification are
this run's, measured on `origin/main` at `55aeaf3` and on this tip.

## 5ae. A count rule paid by convention is paid once, by the run that writes it, so the count gets a block and an exit status

(Added 2026-10-27, after measuring §5u's own rule one day and two runs
after it was written.)

§5u found a derived count going stale beside the thing it is derived
from, named the general form, and closed with the remedy: have the tool
compute it, or have the tool check it, never have the author remember it.
Then it left the check unbuilt, deliberately and with a reason, and filed
a ledger entry proposing the shape. This section is what the next
measurement of those same files found, and the finding is not that a seat
forgot.

**Measured on this tip's parent, 2026-10-27.** Nine of the ten trigger
tests state a near-miss budget. Eight of the nine stated one that
disagreed with the §5c denominator in the same breath, seven saying "the
budget is eight near misses" and one "ten", each of them in a sentence
whose next clause says "and this skill has nine neighbours". The one
correct sentence belongs to the newest skill, whose own landing run wrote
it, which is the shape §5u already named for the headers one layer up.
Separately, three of the ten rows of `skills/README.md` stated a ref count
that was wrong, by one, by four and by five. Every receipt guard was green
over all of it, for the reason §5u gives: a count about `skills/` cites
nothing, so nothing fingerprints it.

**The part that makes this a different section rather than a repeat.** The
run that paid §5u's debt had its hand on the exact sentence. Commit
`5e6bed9`, whose message is "pay 5u's count debt", edits
`attributing-a-deleted-span/TRIGGER-TEST.md` and changes `has eight
neighbours` to `has nine neighbours` inside the sentence that opens "The
budget is eight near misses", leaving that number alone. One sentence, two
derived numbers, one commit, one of them corrected. The same edit landed
in six other files. So the failure is not reach and it is not
forgetfulness. It is that **a convention is applied to the number the
author is thinking about**, and a sentence carrying two derived numbers
will keep the one nobody is thinking about.

So, three rules, and the first two are cheap.

1. **State a derived count once, in a place a tool reads.** Every
   `TRIGGER-TEST.md` opens with a fenced `counts` block holding
   `prompts`, `should-fire`, `near-misses` and `neighbours`, and the
   index's `Refs` column holds the ref count. `node
   skills/trigger-coverage.mjs` measures all five from the files and
   exits 1 on a disagreement, with no flag to ask it to, because a
   published count that contradicts the library is a falsehood rather
   than a judgement a caller can be mid-repair on.
2. **No sentence states two derived numbers, and prose states none the
   block already carries.** The argument belongs in the prose, the
   arithmetic belongs in the block, and a sentence that needs a count to
   make its point names its members instead, which is what §5u's own
   repair did for two sentences and is the only part of it that survived
   the next run.
3. **A fenced block rather than a cleverer parser.** §5u's reason for
   declining to build this holds and is why the shape is what it is: a
   check that reads English cannot tell `skills/README.md`'s note about
   "then five neighbours" or §5r's "15 of 30 ordered pairs" from a stale
   claim, and both are correct as written and must stay. A block is
   invisible to that problem by construction, so the check needs no
   judgement and the prose stays free.

**The general rule, which is about writing rules and not about counts.**
A section here that names a mechanical repair and declines to build it has
set a deadline on itself, and the deadline is the next run that touches
those files. §5u's ledger entry was the right instinct and it was filed
where proposals go rather than where work is assigned, so two runs passed
through the files and paid the half of the rule that was visible in the
diff they were already making. From now on: **a rule whose repair is
mechanical either ships with the check, or ships with the check's owner
and its deadline named in the same ledger entry.** Writing the rule down
is the cheap half and it is the half that decays.

**Ours, and the residue stated rather than hidden.** The measurement, the
one-sentence-two-numbers cause and the block are this run's. Three counts a
reader might trust that this check still does not see. The index's heading
says "Eight areas" over ten skills, and that one is deliberate: an area is
a judgement about where an edge falls, so no tool can derive it, and the
heading now says in its own first sentence that nothing checks it. A count
stated inside a `SKILL.md` body is not measured here either, and that is a
different case rather than a gap of the same kind, because a body's counts
are claims about records and are covered by the receipts. And the check
cannot tell whether the number it measures is the number the sentence
means, since the parser counts the prompts it can see while §5e decides
which of them is a boundary. The last one is not closeable by a tool at
all, and it is why the block holds four keys rather than one.

This run also checked a count before repairing it and found the count
right. The first draft of this section said the index's heading was stale
and the first draft of the heading said so too, on the reading that ten
skills cannot have eight areas. They can: the first three share one. The
repair was written, measured against the eight area paragraphs, and
withdrawn, which is the §5w discipline applied to a defect rather than to
a ratio. A rule about derived counts is exactly the place where a
confident recount is most likely to be the error.

## 5af. A count of the library inside a skill body is the one residue §5ae declared safe, and two of the five were already wrong

(Added 2026-10-27, by the run after the one that wrote §5ae, measuring the
residue §5ae stated rather than the rule it built.)

§5ae built the exit status §5u had proposed and declined to build, over
the trigger tests and the index, and closed by naming three counts the
check still does not see. One of the three was dismissed rather than
listed: "a count stated inside a `SKILL.md` body is not measured here
either, and that is a different case rather than a gap of the same kind,
because a body's counts are claims about records and are covered by the
receipts."

That is true of every body count about a record, and false of the
subclass that counts the library. A count of the library cites no file,
so no fingerprint reaches it and no receipt guard can be red about it,
which is the same sentence §5u wrote about the trigger-test headers one
layer up.

**Measured over the ten bodies, 2026-10-27.** Five paragraphs name the
skills as a set. All five stated a count. Two were wrong.
`adding-a-bound-to-the-record-gate` said it sits across a handoff from
"all four", and `clearing-a-record-for-release` from "all five", each
being the library as it stood on the day that skill landed, six and four
skills ago. In both directories the `counts` block of `TRIGGER-TEST.md`
said `neighbours: 9` and was checked, by the same tool, on the same run.
Two files, one fact, one of them guarded.

**The third case, which is a cause neither §5u nor §5ae names.**
`quoting-a-number-from-an-outcome-record` said "It does not fire for
producing a record, for choosing a subject, or for deciding the label on
a span. Those are the two sibling skills." Three clauses, two skills, and
it was right when it was written: the trial skill decided what a record
covered, so two of the three clauses were one sibling. Then the tenth
skill landed and took the subject question over, and the count became
wrong without the sentence being touched and without the number it names
being the number that changed. So a derived count can go stale in a third
way: not because the library grew under it, and not because the author
fixed the other number in the sentence, but because **the referent of one
clause moved to a new skill.** Nothing in a diff shows that. The repair is
the same one.

**The rule.** A paragraph of a `SKILL.md` that names the library states no
count of it. It names the siblings, as slugs. `node
skills/trigger-coverage.mjs` refuses the construct and exits 1, and
`skills/README.md` documents it under "Whether a skill ever fires".

Three things about the shape of that check, because each is a decision a
reader would otherwise have to take on trust.

1. **It refuses rather than measures,** unlike every other count that tool
   checks. Which subset a sentence means is a §5e judgement: "the three
   skills in the record area" was right while "four skills", one directory
   over, meant every other skill in the library and was wrong by five. So
   there is no number to compare against, and §5ae rule 2 already supplies
   the repair that needs no comparison, which is to name the members. A
   named sibling is also a slug a reader can check and a wrong one is
   visible, so the repair converts an unguarded number into a guarded
   name.
2. **The paragraph is the unit, not the sentence.** §5ae's measured cause
   is a sentence carrying two derived numbers where the one nobody is
   thinking about survives the repair. Scoped to the sentence, this rule
   reproduces that exactly: "Those four skills work on
   `outcome_record.json`" names the library and the sentence after it,
   "it sits across a handoff from all four", does not. A count in such a
   paragraph that is about something other than the library is not a false
   positive but a second thought, and its repair is a blank line, which is
   this house's prose rule anyway.
3. **The refusal is a closed set of spelled words,** not a number pattern,
   and the exclusions are paid for rather than convenient. `one` is a
   pronoun in this voice far more often than a count, and the paragraph
   that produced this rule contains "This one works on the gate itself",
   so including it would flag the sentence doing the repair. Digits are
   excluded because a body's digits are version strings, percentages and
   reference ids, and `0.5.0` in `adjudicating-uncertain-spans` is three
   digit runs and no count. `both` is in, because a count of two is the
   one this library has already published stale in prose.

**The line this rule must not cross, and the seat that drew it from the
other side.** `ursa-major/src/prose-bound-count.test.ts` is the engineer
seat's gate on the same defect class in the product: a bound count
written as an English word, checked against the derivation. Its header
puts `skills/` out of its own scope for two reasons, and the second is the
one that matters here. A skill's mentions of a count are often
quotations of another file's prose, "which is the one category a gate
like this must not police", because correcting a quotation to match
today's number falsifies the record of what the quoted file said. This
library's own E29 is exactly that: a skill correctly quoting a document
that was wrong.

This rule stays on the right side of that line by construction, because
its trigger is the library naming itself. A paragraph quoting another
file's count is only reachable if it also names the skills as a set, and
no paragraph in the ten bodies does both. So the two gates meet without
overlapping: the engineer's checks a count the product derives, and this
one refuses a count the library makes about itself, and neither touches a
count a skill is reporting on somebody else's behalf.

**Ours, and the residue stated rather than hidden.** The measurement, the
moved-clause cause and the refusal are this run's. The residue is a
library count written in digits, which no paragraph in this library does
and which rule 2 of §5ae covers in prose but no exit status covers.

**The second instance, in §5ae's own residue paragraph.**
`skills/README.md` said "Eight areas over ten skills, because the first
three share one," and then: "The count is in the heading and nothing
checks it ... an area is a judgement about where an edge falls and no tool
can derive it." The disclaimer is correct about areas. The sentence it was
written in carries the library's size as well, which is mechanical and
checkable, and the disclaimer exempted it by standing next to it. That is
§5ae's own one-sentence-two-numbers cause, inside §5ae's own statement of
what it had chosen not to check, one run later. Both numbers now sit in a
`counts` block, `skills` is measured, and `areas` is declared
underivable in the block's own prose.

**The general rule, which is about writing residue and not about counts.**
§5ae's closing section was right to state what its check does not reach;
that paragraph is why this one exists and was found in a day rather than
in three weeks. What it got wrong is the form: it argued one of the three
residues away instead of listing it. **A residue argued away is a residue
nobody will measure, because the argument is what the next reader reads
instead of the files.** So: state each residue as a thing the check does
not see, in one line, with no verdict on whether it matters. The argument
for why it is acceptable goes after the list, where it can be wrong
without taking the item off it.

## 5ag. The two count rules scoped every file in the library except the one they are written in, and this file's worked example for §5e was stale by six

(Added 2026-10-27, by the run after §5af, measuring the one surface
§5ae and §5af between them never put in scope.)

§5ae put the trigger tests and the index under an exit status. §5af put
the ten `SKILL.md` bodies under one. Between them that is every markdown
file in `skills/`. It is not every file that states a count of the
library, because both rules are written in `prompts/skill-extract.md`,
and this file states counts of the library too.

**Measured on this tip's parent, 2026-10-27.** One construct is both
derivable and unambiguous, which is a named skill's neighbour count, so
it is the one worth grading first. Over this file and every
`TRIGGER-TEST.md` it appears eight times. Seven are correct and one is
not. §5e said "`distilling-a-tuning-record` has three neighbours", which
`node skills/trigger-coverage.mjs` computes as nine, and the two clauses
depending on it were wrong with it: "the three existing skills all work
on `outcome_record.json`" is now seven of them, and "its three
boundaries are one edge counted three times" is now nine boundaries
across three edges rather than one.

**The cause, and it is a fourth one.** §5ae found a sentence carrying two
derived numbers keeping the one nobody was thinking about. §5af found
the library growing under a sentence, and a clause whose referent moved
to a newer skill. This is none of those. §5r's own header says it
amends §5e, and it does, 750 lines further down. It amended the rule and
left the worked example standing with the superseded counts in it, so
this file disagrees with itself across a cross-reference that announces
the agreement. Nothing in a diff shows that, because the run that writes
the amendment never opens the section it amends. **A header that says it
amends another section is a claim that the two agree, and nothing checks
it.**

**The rule.** A sentence in `prompts/skill-extract.md` that states a
named skill's neighbour count is graded against the live denominator.
`node skills/trigger-coverage.mjs` exits 1 when it disagrees, with no
flag to ask it not to, for the reason §5ae rule 1 gives.

Three things about the shape of that check, because each is where it
could have been wrong.

1. **It grades one construct and is not a prose-number check.** §5ae
   rule 3 declined to teach the tool to read English, and that argument
   holds for this file more than for any other, because most of this
   file's numbers are dated measurements and quotations of other files'
   prose. What makes this construct safe is not the number, it is the
   backticked slug in front of it. The slug fixes the subject, the
   denominator is computed from the directory listing, and there is
   nothing left to guess at.
2. **The count is graded only where it is the denominator.** §5r's
   amendment says "`adjudicating-uncertain-spans` has two neighbours
   sharing no file with it at all", which is a count of a subset and is
   correct. The discriminator is the word after the noun: a clause
   boundary means the whole set, and a restrictive modifier means a
   subset. A subset is not graded, and §5ae rule 2 is what covers it,
   which is to name the members.
3. **Present tense only.** "every skill had seven neighbours" in §5u is
   the header of a measured table and is the record of a tree that is
   gone. Correcting it would falsify the record, which is the line
   `ursa-major/src/prose-bound-count.test.ts` drew and §5af restated.

**The recount this run withdrew, which is the more useful half.** The
first reading of this file flagged §5r's "two neighbours sharing no file
with it at all" as a second defect, on the arithmetic that
`distilling-a-tuning-record` works on `tuning.json` and so shares no
file with `adjudicating-uncertain-spans` either. That is wrong, and
`skills/adjudicating-uncertain-spans/TRIGGER-TEST.md` is what says so:
distilling *reads out of* `outcome_record.json`, so its inputs name the
shared file even though its output does not, and §5e's test is about
inputs and outputs rather than outputs alone. The library's own near
miss stopped a wrong repair to the library's own rule. §5ae closed by
saying a rule about derived counts is exactly where a confident recount
is most likely to be the error, and it is now the second run in two to
measure that on itself.

**The residue, listed, with the argument after it.**

- A count of the library in this file that names no skill, as in §5af's
  "the ten bodies".
- A `TRIGGER-TEST.md` whose prose states a count its own `counts` block
  carries. §5ae rule 2 forbids it and no exit status sees it.
- A cross-reference claiming one section amends another, which is the
  cause measured above.

The first is held back deliberately, because "the ten bodies" inside a
dated measurement is a record and the same sentence a week later is a
falsehood, and no tool can tell them apart without the date. The second
has one live instance, repaired by hand in this run's diff:
`running-an-outcome-record-trial/TRIGGER-TEST.md` said "It now has five"
where its block says nine. The third is the one worth building next and
it is a ledger entry rather than a check in this run, because the
mechanical form is not obvious and §5ae's general rule asks for an owner
and a deadline instead of a guess.

**Ours.** The measurement, the amended-section cause, the
clause-boundary discriminator and the withdrawn recount are this run's.
The three exclusions are each paid for by a case in the control set
rather than by convenience, and the control set is the seven correct
occurrences the same pattern finds.
