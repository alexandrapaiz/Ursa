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

(Amended by §5ak. Generated line, per §5ah.)

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

(Amended by §5aa (part 3) and §5am (part 2). Generated line, per
§5ah.)

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

(Amended by §5aj. Generated line, per §5ah.)

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

(Amended by §5ak. Generated line, per §5ah.)

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

(Amended by §5ao. Generated line, per §5ah.)

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

**The third item was taken, 2026-10-27, by §5ah**, which is the next run
of this seat to edit this file and is the owner that ledger entry named.
Written here by hand rather than generated, because a residue list is an
argument about what is worth building and not a derived fact. §5ah's
back pointer does not cover it, because §5ah does not amend §5ag: the
rule §5ag states is untouched, and only one of the three items it listed
has moved.

**Ours.** The measurement, the amended-section cause, the
clause-boundary discriminator and the withdrawn recount are this run's.
The three exclusions are each paid for by a case in the control set
rather than by convenience, and the control set is the seven correct
occurrences the same pattern finds.

## 5ah. A note that says it amends §N is a claim about two sections, so §N carries the claim too, and carries it generated

(Added 2026-10-27, by the run that inherited §5ag's branch after a
provider limit refused one wake and a cut-off ended another. It takes
the third of the three residue items §5ag listed, which §5ag called the
one worth building next and handed to a ledger entry rather than
guessing at the mechanical form. That entry named an owner and a
deadline, this seat and its next run to edit this file, and this is
that run.)

**Measured on this branch, 2026-10-27, before this section was
appended.** This file held 39 sections then and holds 40 with this one.
Six of them declare in their own dated note which earlier section they
amend, naming §5, §5c, §5c and §5e, §5k and §5q, §5t part 3, and §5aa
part 4. That is eight declared amendments over seven amended sections.
**None of the seven said so.** Not one of them, over the twenty-six days
since §5c wrote the first such note on 2026-10-01.

That zero is the measurement the ledger entry asked for first, because
it is what decides the design. A convention paid zero times out of seven
is not a convention, and §5ae rule 1 already settled what to do with
one: put it under an exit status, and have the run that writes the rule
pay the whole debt rather than leave it to whoever is unlucky.

**One of the seven looked like a six.** §5e does mention §5r, in prose,
nineteen lines below its own header: "the amendment to this section
under §5r is what settles those." A first reading of the graph scored
that as linked. It is not, and the reason is the whole rule. Those
nineteen lines are the stale worked example itself. A reader who opens
§5e, reads the rule and the example, and stops, has read the superseded
version and seen nothing to warn them, which is exactly what happened
for twenty-two days and is what §5ag measured. A back reference below
the text it supersedes is not an index. The prose sentence stays, because
it is the author's argument and the generated line is not.

**The rule.** A section whose dated note says it amends §N causes §N to
carry one generated paragraph naming every section that amends it, as
its first paragraph after its own dated note, or directly under its
header when it has none. `node skills/trigger-coverage.mjs --amendments`
prints the graph and exits 1 on any section that is amended and does not
say so. `--write` generates the paragraph. There is no flag to ask for
the exit status to be suppressed, for the reason §5ae rule 1 gives.

Four things about the shape, each of which is where it could have been
wrong.

1. **Generated, not written.** Everything in the line is derived from
   the amending notes, so a hand-typed one decays the moment a later
   section amends the same target, which is the defect one level up. A
   sub-part is carried through, so §5t's line reads "Amended by §5aa
   (part 3)" rather than naming all of §5t as superseded.
2. **The claim is read only out of the section's own dated note.** This
   file discusses amendment constantly, and §5ag alone says "amends"
   four times about other sections. A pattern that read the body would
   find those and invent edges from the file's commentary about itself.
   The note is the only place a section speaks for itself.
3. **The clause stops at the first thing that is not a reference.**
   §5ad's note names §5aa part 4 and then names §5aa again three lines
   later, in a sentence about re-deriving a measurement. One edge, not
   two. The first draft ran to the end of the sentence and reported the
   pair twice.
4. **A dangling or self reference is left alone.** A note naming a
   section that does not exist is a typo in an identifier, and `--write`
   does not invent a section to point at. It is reported and fixed by
   hand.

**What this check does not do, stated because the gap is the interesting
part.** It does not detect that two sections disagree. §5ag's defect was
substantive: §5e's example held counts §5r had superseded, and no tool
reading cross-references would have known. This check would not have
caught it. What it would have done is put §5r's name at the top of §5e,
above the example, where every run that read §5e for twenty-two days
would have seen it. The check makes the disagreement reachable by a
reader rather than detectable by a tool, and those are different claims.
The counts half of §5ag's defect was gradeable and §5ag graded it; this
is the half that only a human can close, so the rule's job is to put it
in front of one.

**The check caught its own defect, on the run after it wrote the
repair.** The placement test first compared the back pointer's line
against the end of the dated note plus one, which forgets the blank line
every paragraph break carries. So it wrote all seven paragraphs in the
right place, exited 0, and then on the second `--write` reported all
seven as misplaced. Found by running the writer twice rather than by
reading the arithmetic, which is now a test. A checker and a writer that
disagree about one line are the same class of defect as the two guards
§5s found disagreeing about scope, and running the writer twice is the
cheapest probe for it.

**A fourth surface, found while doing this and left to a hand repair on
purpose.** `skills/README.md` said in prose that the tool "reads all 30
ordered pairs". It reads 90, and has since the library reached ten
skills. That is a count of the library in a file none of the three count
rules scopes: §5ae scoped the trigger tests and the index table, §5af
the ten `SKILL.md` bodies, §5ag this file. The obvious next move is to
point `libraryCountsInBody` at the README, and the measurement refuses
it. Run against `skills/README.md` on this branch it returns nine hits,
and the live defect is not one of them, because the detector matches
spelled words and this one was written as a digit. Of the nine, L377 and
L409 are the file's own dated record of what the tool scored when it was
first run, L431 is the quotation of §5e that §5af's rule protects, and
the rest are prose about numbers rather than claims about the library.
Nine reports and zero findings is a list rather than a question, which
is §5m's distinction one file over: there a same-file co-citation list
was noise and a shared-lines list was a question, and the same test
applies to a count detector pointed at a document whose job includes
quoting counts. That a guard firing nine times for nothing teaches its
reader to stop reading it is ours and is not measured. So the
line is repaired by hand, the sentence now names how the count is
derived instead of stating it, and the ledger carries the surface with
an owner rather than this run carrying a fourth pattern.

**The residue.** §5ag listed three items and this takes the third. The
first, a count of the library in this file that names no skill, is still
held back for §5ag's reason, which is that no tool can tell a dated
record from a stale claim without the date. The second, a trigger test
whose prose states a count its own `counts` block carries, had one live
instance and §5ag repaired it by hand, and it is still true that no exit
status sees a new one. That is now the only one of the three left open,
and it is the one that will recur, because the shape is easy to type and
invisible to a diff.

**Ours.** The zero-of-seven measurement, the argument that a prose back
reference below the superseded text is not an index, the four shape
decisions, the stated limit on what a cross-reference check can know,
and the two-run probe that found the off-by-one are all this run's. The
owner and deadline this run was working to are §5ag's ledger entry's.

## 5ai. A methodology section lands in its own pull request before anything cites it, and the ordering is the operative clause rather than the file count

(Added 2026-11-02, by the run the 2026-11-02 ledger entry named as its
owner: "the next run of this seat that would add a §5 section". That
entry proposed this rule and asked for one run to try it. This run is
that run, and it amends the entry's first step in one place, because the
property the entry asked for turns out to be stated at a level no gate
reads.)

(Amended by §5an. Generated line, per §5ah.)

**Where the rule comes from.** Ursa's exo seat, on the board on the
morning of 2026-11-02, gave the repair for the charter freeze as "if
your run produces both a knowledge surface and a charter edit, that is
two branches, since the cheap one can land the same day". That is right
about the tier mechanism. `docs/standards/pm.md` §10 makes `prompts/`
Tier C and Tier B condition 4 refuses a merge when any path in the diff
is Tier C, so one prompt file carried 55 other files of #601 into the
owner's queue with it. It is wrong about order, and the exo seat has
since agreed in writing that it had the order backwards.

**Why a split with no order attached is worse than no split.** Measured
on this branch. `prompts/skill-extract.md` holds **35** `## 5` sections
here and **19** on `origin/main`, so sixteen exist only on this seat's
open pull requests. Fifteen of those sixteen are cited from inside the
library: **113** of the **399** section citations in `skills/`, twenty-eight
percent, spread over **17** files. Drop the prompt from the branch to buy
a Tier B merge and all 113 of those land as guard tooling citing a
methodology document that does not have the sections, in the one library
whose stated differentiator is that every claim traces. A dangling
citation here is not a cosmetic defect. It is the product claim failing
on its own shelf.

**The rule.** A run that needs a new section of this file writes that
section in a pull request that carries nothing citing it, and the work
citing it belongs to a later run. The order is the whole content:
section first, citations second, never the same branch and never the
reverse.

Paid on this section, and the check is a grep, with one correction that
the first draft of this paragraph needed. `grep -rn '5ai'` over the
repository returns **three** lines, and all three are inside this
section: its header and two sentences of its own argument. The draft
said one line, which was a claim about a grep written without running
it, in the section that makes the grep the check. What the check must
read is mentions from outside the section, and there are **zero**, so
nothing in the tree points at §5ai and there is nothing for a later
branch to dangle. A self reference is excluded for the same reason
§5ah part 4 excludes one from the amendment graph, which is that a
section talking about itself is not an edge.

**The amendment, and it is the part worth carrying.** The ledger entry
stated the payoff as "the prompt file the only path in a one-file Tier C
branch the owner can read in a minute". One file is the wrong predicate,
for a reason that is measurable rather than arguable.

The shape has already been achieved once, at the commit level. Commit
`4efceab0`, this seat, 2026-10-26, is two files and ninety insertions:
an amendment to §5h and the ledger entry recording it, with nothing
citing either. It is the only commit to reach `origin/main` touching
`prompts/` in the seven days to 2026-11-02, out of **585**. And it
bought nothing, because it arrived inside pull request #477, which was
**34** files. The gate that decides the tier is
`gh pr diff --name-only`, which reads the branch. A run can keep every
one of its own commits to a single file and still hand the owner a
thirty-four file Tier C branch, and the file count it reports is then
true and irrelevant.

This run is in the same position and says so rather than claiming the
rule is paid in full. Its own commits touch one file. Its branch is
**60** files against `origin/main`, because it is based on #638, which
is based on #633, which is based on #601, none of which has merged. So:

1. **"Carrying nothing that cites it" is the operative clause.** It is a
   property of the tree, it is checkable by grep, and it is what stops
   the dangling citation. This run pays it.
2. **"One file" is a proxy for the tier gate, and it is only payable
   from a merged trunk.** It is not a property of authoring discipline
   at all. A run whose previous section is still in the queue cannot pay
   it by trying harder, and a run that reports its own commits' file
   count as though it had is reporting at the wrong level.
3. **So the rule is payable in full exactly once per merge of this
   file.** A run should say which of the two regimes it is in. From a
   merged trunk, write the section alone and the owner gets a minute's
   reading. From an open stack, write the section alone anyway, because
   clause 1 still holds and still earns its keep, and state the branch
   count next to the commit count so the reader is not told the gate was
   satisfied when it was not.

**Why branching from the trunk is not the way out, which is the trap.**
The obvious fix for a 60-file branch is to start from `origin/main`.
Both available spellings are defects. `main`'s last section is §5s, so a
run branching there writes §5t, and §5t has held a different rule on a
branch since 2026-10-26, which lands two incompatible sections under one
identifier and is the second-version failure the org's own
read-your-open-pull-requests rule exists to stop. Keep the identifier
§5ai instead and the trunk's copy of this file jumps §5s to §5ai with
sixteen sections missing, and this section's own text then cites §5h,
§5ae and §5t against a tree that has none of them. That is the dangling
citation, created by the section whose purpose is to prevent it. Both
spellings are worse than the honest 60, so building on the stack is
forced and the file count is the thing that gives way.

**One correction to the numbers this rule was argued from, because they
arrived in a board message and a board message is data.** The exo
seat's note offered a denominator for the freeze, as 585 commits to the
trunk in seven days with zero touching any charter, and eight of eleven
charters last landing on 2026-10-05. Re-measured here on a full clone:
585 is exact. The other two are loose in the same direction. One commit
in that window did touch `prompts/`, `4efceab0` above, and it is this
seat's own file, which is why it is usable as evidence here at all. And
seven of the eleven seat charters last landed on 2026-10-05, not eight,
with `exo-agent.md` at 2026-10-18, `research-agent.md` at 2026-10-16,
and `engineer-agent.md` and `skill-agent.md` both at 2026-10-09. The
headline holds and the sub-counts did not, which is the ordinary shape
of a figure quoted from a run's own summary rather than re-derived, and
is §5x's rule applied to a number instead of to a failure.

**The cost of the rule, stated because it is not free.** Sixteen
sections written one to a branch is sixteen Tier C pull requests where
this lane has produced three. On a queue being drained that is strictly
better, because each one is a minute's reading and none of them blocks a
skill. On a queue that is not being drained it is sixteen stranded
branches and the seventeenth inherits all of them, which is the regime
this run is in. The rule therefore depends on a merge cadence this seat
does not control, and that dependence is the reason clause 3 asks a run
to name its regime instead of reporting a verdict.

**A defect found in the act of measuring the trunk, which this section
has to disclose because it argues from that measurement.** Every run in
this lane publishes a table of the guards read against `origin/main` in
a worktree, and the reading is taken by invoking the branch's flags
against the trunk's copy of the tool. On `origin/main`,
`node skills/trigger-coverage.mjs --amendments` exits **0** and prints
the default coverage report, because main's copy of that file is 364
lines and contains the string `amendments` **zero** times. So does
`--not-a-real-flag`. The flags are dispatched by `argv.includes` with no
branch for a flag the tool does not know, so an unknown flag is not
refused, it is ignored, and the run that asked a question the trunk
cannot answer is told green. Measured across the library's four
executable guards: all four accept an unknown flag and run their
default mode, with exit codes 0, 1, 0 and 2, and not one of them says
it did not understand the request. This branch's copy has the same
defect. The repair is code and therefore does not belong in this pull
request, which is this rule working rather than an exception to it, and
it is named with an owner in this run's pull request description. What
follows for the figures above is that main's section count, its citation
counts and its file count are file reads and stand, and any main-tree
guard verdict for a check that exists only on a branch is not a verdict.

**Ours.** The ordering argument, the 113-of-399 measurement, the
commit-level-versus-branch-level correction to the ledger entry's own
first step, the two-spellings trap that makes building on the stack
forced, the re-measurement of the three freeze figures, the cost
paragraph, and the unknown-flag defect and its four-of-four
denominator are this run's. The two-branch observation and the freeze's
headline denominator are the exo seat's, taken as data and re-derived
before use. The owner and deadline this run worked to are the
2026-11-02 ledger entry's.

## 5aj. §5v's precondition is addressed to the one frame this library has no exit status for, so no guard under skills/ can carry it

(Added 2026-11-02, by the run that broke §5v's own rule inside its first
ten turns and found out by nearly closing a readied pull request as
damaged. It is amending §5v, which stated the rule correctly and put it
where a run reads it too late.)

§5v says the clone a seat is handed is not a copy of the repository, and
its operative line is that **the first act of any run that will compare
branches is `bash tools/ensure-full-clone.sh`**. That rule is right. This
run did not follow it, and the reason is not carelessness, so it is worth
a section rather than an incident line.

**What happened, in order.** This run's charter opens with "Read your own
seat's open PRs first" and prints the command for it,
`git merge-base --is-ancestor refs/prs/<old> refs/prs/<new>`. So the
run's first git question arrived before it had any reason to open this
file, and §5v lives in this file. The answer it got was that pull request
#646 had **no common ancestor with `main` at all**, and the diff that
followed reported **81 files changed, 3,017 insertions and 11,510
deletions**, including whole `SKILL.md` files apparently removed. The
truth, after `git fetch --unshallow`, is **63 files, 11,387 insertions
and 260 deletions**. A finished pull request read as a mass deletion, and
the next decision in front of the run was whether to close it.

**Three states, each measured in a clone made from scratch on
2026-11-02 against `github.com/alexandrapaiz/Ursa`.** §5v and
`docs/design/clone-completeness.md` describe the first. The second is the
one a seat is actually in, and it is the trap.

| reached by | `main` visible | PR ref visible | `is-ancestor` PR to PR |
|---|---|---|---|
| `clone --depth 1`, then `fetch --depth 1 refs/pull/N/head` | 1 | 1 | exit 1, **wrong** |
| `clone --depth 1`, then `fetch refs/pull/N/head` with no depth flag | 1 | 2,126 | exit 0, **right** |
| after `git fetch --unshallow origin` | 2,021 | full | exit 0, right |

The middle row is what the charter's own fetch produces, because a plain
fetch of a pull request head into a shallow clone deepens that ref and
leaves `main` at one commit. In it the PR-to-PR form the charter prints
is **correct**, and every comparison against `main` is still wrong. So
the printed command returns a true answer and gives the run no signal
whatever that its next question is unanswerable. The instrument is not
broken for the question the rule spells out. It is broken for the
questions the rule leaves to the reader.

**Four spellings of one question, in the middle state, on #646.** Only
one is quiet, and it is the one this run reached for.

| form | status | what it reported |
|---|---|---|
| `git diff --name-only main...head` | 128 | `fatal: no merge base` |
| `git merge-tree --write-tree main head` | 128 | `fatal: refusing to merge unrelated histories` |
| `git diff --stat "$(git merge-base main head)" head` | 128 | `fatal: ambiguous argument ''` |
| `git diff --stat $(git merge-base main head) head` | **0** | 81 files, +3,017, −11,510 |

The quiet one is also the one `docs/standards/lessons.md` prints at
L-A77 and the one this file cites, which is L-A77's own mechanism 3
turned on the document that records it. Quoting the substitution is the
whole repair, because an empty base then fails with 128 like the other
three instead of being dropped, and no judgement is required of the
reader.

**Why this cannot become a guard under `skills/`, which is the part that
belongs in this file.** The library already does the downstream half
correctly. `skills/relocate-anchors.mjs` reads git history, detects
`--is-shallow-repository`, and names `tools/ensure-full-clone.sh` in its
own error text at three separate call sites. There is nothing to add
there. The failure happened in the **top shell frame of the run**, before
any committed guard executed, and that frame is the one place this
library has no exit status to offer. §5ai's predecessor reached the
identical conclusion one run earlier about a different instrument: the
grep dialect that diverges does so only in the frame a seat types into,
so "the committed tooling is safe and the hand-typed receipt is not."
Two consecutive runs of this seat, two unrelated instruments, one
structural fact. The second time, this seat was the victim rather than
the auditor, which is the stronger evidence of the two.

**The rule, scoped to what this file can enforce.** A receipt in this
library that compares two refs names the clone state it was measured in,
and writes the comparison in a form that fails loudly: the three-dot
form, or the substitution **quoted**, never the bare substitution. A
receipt that cannot say which state it was measured in is not a receipt,
because every number in the table above is reproducible and three of the
four are wrong.

**The residue, with an owner, because the rest is not this seat's to
write.** Of the eleven files under `prompts/` that print the
`merge-base --is-ancestor` paragraph, **one** carries a shallow-clone
warning beside it, which is `prompts/exo-agent.md`, and **none** names
`tools/ensure-full-clone.sh` by path. Charters are outside this seat's
boundary, so the fix is a ledger entry addressed to the owner rather than
an edit here, and it is filed under this date in `docs/ideas.md`.

**Ours.** The three-state table and the middle state's selective
correctness, the four-spelling status table, the measurement that the
quiet form is the one this organization's own lesson prints, the argument
that no `skills/` guard can carry §5v's precondition, and the
eleven-charters count are this run's. §5v's rule, the four mechanisms it
rests on, `tools/ensure-full-clone.sh` and
`docs/design/clone-completeness.md` are the engineer seat's prior work
from 2026-10-24 and 2026-10-26, read before this section was written and
not re-derived. The frame-versus-host argument is the preceding run's.

## 5ak. A check prints the size of the population it examined, because a check that read none of it and a check that found nothing in it print the same thing

(Added 2026-11-02, by the run the 2026-11-02 ledger entry named as its
owner, "the next run of this seat that would add a §5 section, which is
the same owner §5ai itself was filed with". Amends §5s and §5w. That
entry asked for the rule as it applies to a containment verdict. A
second case arrived from Ursa's exo seat the same night, in a different
tool and a different language, and the rule is written at the width the
two cases share rather than at the width of either.)

(Amended by §5al. Generated line, per §5ah.)

**Three cases, all measured in this clone rather than read off a
report.** All three are repaired now, and the point of the table is that
no repair was prompted by a failing output, because in none of the three
was there one.

| what dropped its population | how it reported that | what found it |
|---|---|---|
| `tools/stack/absent-text.py`, the containment gate: `base` defaults to `git merge-base OLD TIP`, which is `OLD` whenever `OLD` is an ancestor, so `git diff --name-only base old` is empty and the per-file loop never runs | exit **0**, **zero lines of output** | asking the same question twice, once with the base the question needs |
| `grep-dialect.mjs`'s first draft, which skipped `//` comments in `.mjs` outright | a clean scan that could not mention them | the exo seat's unclassified sweep of this lane, which returned hits in this tool's own header that the tool itself would not report |
| the exo seat's self-classification sweep, two call sites in `prompts/exo-agent.md` and one in `docs/agents/runner-facts.md`, piping `git grep -l <ref>` into an exclusion anchored on `^docs/` | the exclusion arm matched nothing and the rows all reported, which reads as a thorough sweep | this lane's version check over the same ground, run on that seat's own request |

The first reproduces here. `absent-text.py refs/prs/601 refs/prs/667`
exits 0 printing **0 lines**; the same pair with
`--base $(git merge-base refs/prs/601 origin/main)` examines **56 files**
and **33,226 lines**. The second is **4** of this scan's **56** current
findings, all four on lines 56, 57, 89 and 109 of
`skills/grep-dialect.mjs`, and the first two of those are the
measurement of the defect itself. The third is two independent faults in
one command, written on 2026-10-26 in commit `d03a45fd` and repaired on
2026-11-02 in `f334c26c`: `git grep -l <ref>` writes a `<ref>:` prefix
before every path, which this clone confirms, so the anchor never
matched; and `grep` in the frame that typed it was ugrep, whose
quiet-plus-invert exit status is the inverse of GNU's. Repairing either
one alone flips the classifier from reporting every row to reporting
none, which is why neither was visible as a wrong answer.

**Why §5s's remedy does not reach these.** §5s says a guard names what
it declined to read before it reports its counts, and that is right
wherever the guard knows it declined. None of these three knew. The
containment gate computed its file list correctly from a base that was
wrong, so it had no excluded set to name. The exclusion arm believed it
had excluded nothing, because nothing matched it. Only the
`//`-comment skip was deliberate, and a deliberate skip with no report
is §5s's own case, which is how §5s's warning was already on the record
and the drop still shipped. §5s asks you to probe a guard with the input
it cannot read. That requires knowing which input that is, and the whole
difficulty of this class is that nobody does until something disagrees.

**Why §5w's rule does not reach them either.** §5w says an empty
denominator returns `null`, never a number, and it is scoped to anything
under `skills/` that divides. These three divide nothing. There is no
ratio to protect, no `null` to return, and the output is a count of
findings that is arithmetically correct. §5w rule 3 is the germ of what
follows, in one clause: say in one line how many were counted out, and
"none" is the answer a reader wants while a missing line is not it. This
section is that clause lifted off division and made the general form.

**The rule.**

1. **A check states the size of the population it examined, in the same
   line as its verdict.** Not in a flag, not in `--verbose`, not in the
   JSON. The verdict line itself, because the verdict line is the only
   thing a caller reads.
2. **An empty population is not a pass.** A check whose scope computes
   to nothing says so and returns something other than its clean exit
   code. Zero findings over zero members is the one reading that must
   never share an exit status with zero findings over all of them.
3. **A drop is found by a second instrument over the same ground, not by
   reading the check.** A check that silently drops part of its
   population has no failing output, so it can contradict nothing. The
   only thing that reaches it is a different instrument asked the same
   question, returning a different number.
4. **An instrument agreeing with its own earlier run is not evidence.**
   It is the same code over the same blind spot. The exo seat's figure
   had been published four times before the arm that produced it was
   found never to have fired.
5. **A repair of one of these is controlled both ways.** One input that
   must be reported and one that must not, in the same run. Fixing a
   silent drop can produce a silent over-report, and both of the exo
   seat's two faults pointed that way: either repair alone inverts the
   classifier rather than correcting it.

**Paid here, in both directions, because clause 5 applies to this
section too.** The direction that must come out clean: of the five
checks in this library with a command line, all five state their
examined population in their verdict line, measured by running each one
on this branch. `check-evidence` says 377 sources and 465 ranges,
`relevance-sweep` 318 of 318 verdicts, `trigger-coverage` 11 skills and
110 ordered pairs, `relocate-anchors` 465 cited ranges, and
`grep-dialect --scan` 0 call sites with 56 findings classified out under
four headings. So does `tools/ledger/check-closures.mjs`, at 5 markers
in 5 documents. The direction that must come out dirty is the first row
of the table above, which is `tools/stack/absent-text.py`, and it is not
repaired here because `tools/` is not this seat's to write. It is filed
with an owner.

**And the second instrument, run rather than described, over the one
tool in this lane that has already carried this defect.** The question
is whether `grep-dialect.mjs` still drops anything. Instrument one is
the tool's own `--json` over `skills prompts`. Instrument two is
`/usr/bin/grep -rnE` over the same two roots with the same six
spellings of the flag pair and no classification at all. Both return
**56**, and the per-file split is identical in all three files that
carry any: 43 in `grep-dialect.test.mjs`, 12 in `grep-dialect.mjs`, 1 in
`skills/README.md`. That agreement is worth something only because the
two instruments share no code, which is the whole of clause 3.

**The honest limit, which is clause 3's cost.** A second instrument
exists only where the question can be asked twice by different means. It
was available in all three cases here and it will not always be. Where
it is not, the fallback is clauses 1 and 2 and nothing stronger: print
the denominator, and refuse to spell an empty one as a pass. Those are
cheap and they do not detect a drop, they only make one legible to the
next reader who has a reason to doubt.

**§5ai's grep check, paid on this section, and it does not come out at
zero.** The rule is that the branch introducing a section carries
nothing that cites it, and the check is `grep -rn '5ak'`. It returns
**four** lines here. One is this section's own header. Two are the
generated back pointers in §5s and §5w, which are in this file and
therefore cannot dangle if the file is held back. The fourth is
`docs/runs/skill-2026-11-02-message-7.md:151`, where this seat's
previous run recorded this section as owed and named it by identifier,
and that one is a real mention from outside the file, written before
this run existed. So nothing on this branch cites the rule as authority,
which is the property that matters, and the count is not zero, which the
first draft of this paragraph asserted before running the command. Every
new citation this run could control was withheld: the ledger entry this
section closes names the rule in words rather than by number, and so
does this run's report. Why that withholding is not fussiness is
measured in a ledger entry under this date, because it is a finding
about §5ai's check and not about denominators.

**Ours.** The three-case table and every figure in it, the argument that
§5s's remedy presupposes a guard that knows it declined, the lift of
§5w rule 3 off division, the five clauses, the five-of-five census, the
two-instrument control on this lane's own tool and the 4-of-56 figure
for what the old skip reached are this run's. The shared shape, stated
as a check that silently drops part of its population being reachable
only by a second instrument over the same ground, is Ursa's exo seat's,
offered on the board and re-derived here before use: both of its faults,
their dates and their repair were measured in this clone rather than
taken from the note. The containment-verdict case and the owner and
deadline this run worked to are the 2026-11-02 ledger entry's.

## 5al. A verdict read out of a pattern's silence is a claim about the vocabulary, so an incomplete list manufactures the absence rather than failing to fire

(Added 2026-11-02, by the run that received the grading described below
on the board the same night. Amends §5ak. §5ak's clause 3 is written for
a check whose drop has no failing output. This is its sibling, where the
output exists and is false, and the two take different remedies, so the
distinction is drawn here rather than folded into that clause.)

**Where the rule comes from.** Ursa's exo seat, on the board on
2026-11-02, about `tools/board/check.mjs`. One arm of that gate tells a
sender that the wake cut took their verdict, and it decides that by
looking for a known phrase in the delivered head. That seat graded the
arm for the first time over a complete walk of 4,200 rows: 154 of 1,016
verdicts move, and 32 bodies had been told their verdict was dropped
while it sat at offset zero. Its sentence for the cause is the rule's
whole content: an arm keyed on the absence of a known phrase means an
incomplete word list **manufactures the absence rather than only failing
to fire**.

Re-derived in this clone before use, on the body that prompted the
grading, and the tree is named because the answer depends on it. This
seat's `done` of 03:43, 2,034 characters, cut at 1,453. Against
`275623bd`, this stack's tip when the note arrived, `dispositionRisk`
returns `markers_found: 0`, so the gate's verdict is that it cannot tell
which side the disposition fell on. The decisions are at offsets **233**
and **729**, both far above the cut: "I did not rebase it" and "So I
merged my tip instead". That list carried `not merged` and `I took` and
`I decided`, and carried neither an `I did not <verb>` form nor an
affirmative `I merged`. So it held the negations of actions and not the
actions.

That list is already repaired, and this section would misreport the
repository if it stopped at the paragraph above. The reporting seat's own
widening landed on `main` in `e951ca88` at 04:13:28Z, two minutes before
the note was sent and before this run read the board, and against
`origin/main` the same body returns `in_delivered: true` with three
markers, at 233, 729 and 732. The measurement is kept rather than deleted
because the rule survives the repair intact: **the keying did not
change.** `lost_only` is still `lost.length > 0 && !inDelivered`, still a
positive claim about the head derived from one list's silence, and
nothing in the returned shape names the list. That seat's own block says
as much in its own words, that the edit "narrowed the blind spot and did
not close it", and its figure for what is left is 249 `none` verdicts of
1,016 after the widening against 371 before. `tools/` is not this seat's
to write, and that half stays with the seat that found it.

**Why this is not §5ak.** §5ak clause 3 says a check that silently drops
part of its population has no failing output, so it can contradict
nothing, and only a second instrument over the same ground reaches it.
Every word of that is true of a drop and none of it is true here. A
negative-keyed arm reports. It exits non-zero, it names a subject, and it
prescribes a repair. The operator is not left uninformed, which is §5ak's
situation. The operator is told a falsehood and handed a remedy for it,
which is worse, because a clean line invites doubt and a specific
accusation does not.

The asymmetry is worth stating plainly, because it is what decides how
much a pattern list is allowed to cost:

| the check is keyed on | an incomplete list produces | what the operator sees |
|---|---|---|
| the **presence** of a phrase | a false negative, a missed finding | nothing, and §5ak clause 3 is the only thing that reaches it |
| the **absence** of a phrase | a **false positive**, a manufactured finding | a named subject, a non-zero exit and a repair, all of them wrong |

So the same word list is cheap in one direction and expensive in the
other, and a tool that uses one list for both has priced only the cheap
half. The gate above says so about itself in its own header: a miss
"costs a seat nothing it was not already paying". That is right about its
`none` verdict, which it already reports as "no marker found, never no
disposition present", and it is wrong about the arm next to it, which
makes a positive claim about the head out of the same silence. The
honest reporting was written for one of the two arms that needed it. That
is the whole finding, and it is why clause 4 below is a clause: the seat
that built that arm had already written the discipline into the module
for the cheap direction and shipped the expensive one beside it.

**The same defect in this library, which is the half this seat owns.**
`skills/trigger-coverage.mjs --amendments` has two arms that read
`AMENDING`'s silence as a finding. `missing` tells a section it "says so
nowhere". `orphan` tells a section that nothing claims it. Three
variants, each measured against the live file before the repair:

| what was re-spelled | what the check said | what was true |
|---|---|---|
| §5's back pointer re-worded to "(This section is amended by §5c. …)" | `missing`: "§5 is amended by §5c and says so nowhere" | it says so, on line 112, in the paragraph the verdict quotes from |
| the same line indented two spaces, byte-identical otherwise | `missing`, the same sentence | the same |
| §5ak's claim re-spelled "An amendment to §5s and §5w" | 2 of 11 edges dropped, then `orphan` against §5s and §5w | §5ak declares both, in English, in the note the check read |

The third is the expensive one, because one unrecognised word produces
two different wrong answers in two different places: a silent drop where
the claim is, and a loud accusation three hundred lines away where the
back pointer is. A reader who acts on the `orphan` deletes a correct line.

**And widening the pattern is not the repair.** The commit directly
before this section's is that repair, applied: `AMENDING` read one
inflection of the verb, a note spelled the claim `Amends`, the edge was
dropped, and the pattern was widened to three inflections and
case-insensitive. That fixed one spelling. It left every property above
exactly as it was, because a fourth spelling reaches the same arms and
nothing in the output distinguishes a fourth spelling from a note that
claims nothing. A boundary that moves is still a boundary, and the defect
is not where the boundary sits.

**The rule.**

1. **A check may report an absence as a finding only over a vocabulary it
   owns.** Owned means the check or its own writer produces the spelling,
   so the list is complete by construction. The generated back pointer is
   owned: `--write` emits it. The author's prose is not owned, and no
   amount of care makes it so.
2. **Where the vocabulary is not owned, the verdict is about the reading
   and not about the subject.** "No recognised form found", never "says
   so nowhere". The two differ by one clause and by the whole of whether
   they can be false.
3. **Split the absence with a second, deliberately wider recognizer.** Its
   only job is to distinguish "nothing here" from "something here this
   check cannot read", it decides nothing on its own, and it is allowed to
   over-fire, because its false hits cost one line of output while the
   verdicts it is protecting cost a correct line of the document.
4. **An absence verdict prints the vocabulary it searched with, beside the
   verdict.** This is §5ak clause 1 moved from the population to the
   pattern. A clean line that does not name what it listened for reads as
   a universal about the file, and it is not one.
5. **A writer refuses what its reader could not parse.** A tool that
   rewrites a document from a graph it built with the pattern must stop
   when the pattern failed, rather than deleting what it cannot rebuild.

**Paid here, and controlled both ways as §5ak clause 5 asks.** Two new
defect kinds, `unreadable-claim` and `unreadable-pointer`, so `missing`
now means the paragraph holds neither a back pointer nor anything
resembling one. The `orphan` detail is qualified whenever an unreadable
claim exists in the file, because then the absence of an edge is this
check's reading rather than an observation. `--write` refuses outright
while an unreadable claim is open: measured, the un-refused version
deletes §5s's and §5w's back pointers and writes neither, returning 8
where the unmodified file returns 10. And the clean verdict now prints
`AMENDMENT_VOCABULARY`.

The direction that must come out dirty is the three rows of the table
above, and all three now report the unread kinds instead of the false
ones. The direction that must come out clean is the live file, where the
wider recognizer returns **0** near-claims and **0** near-pointers; the
first draft of it, any `amend` word anywhere in a note together with any
reference, fired on §5ai's own note, which says it amends a ledger
entry's first step and separately mentions a `§5` section. A
discriminator with a false hit on the clean file discriminates nothing,
which is why the pattern below it is bounded to thirty characters and
stops at a sentence end. The negative controls are in the tests: a
genuinely absent back pointer is still `missing`, a note that discusses
amendment without claiming one still yields no edge, and the deliberate
over-fire is asserted rather than hidden.

**The honest limit, which is clause 3's cost and is the same shape as
§5ak's.** The wider recognizer is a second vocabulary, not an escape from
having one. A claim written with no `amend` word at all, "This section
supersedes §5s", reaches neither pattern, and on that input the check
reports finding nothing and `--write` deletes the two back pointers
without refusing. That case is live and unfixed, and the only thing
standing between it and a reader is clause 4: the verdict says what it
searched for, so a reader who wrote "supersedes" can see their own words
are not in the list. Clauses 1 and 2 are cheap and always available.
Clause 3 is strong and bounded by whatever the wider pattern happens to
know.

**§5ai's grep check, paid on this section, and the count is not what the
first draft of this paragraph said.** `grep -rn '5al'` over markdown and
JavaScript returns **four** lines, all four in this file: this section's
header, two sentences of its own argument, and the generated back pointer
`--write` added to §5ak at line 3016. Only the last is a mention from
outside the section, and it is inside the file, so it cannot dangle if
the file is held back, which is the exclusion §5ak's own §5ai paragraph
recorded. Widen the grep past those two extensions and it returns two
more, both `sha512-` integrity hashes in `package-lock.json` files that
happen to contain the three characters. Those are not citations and no
reader would mistake them for any, which is the reason to say so rather
than to quietly scope the command until the number came out at the figure
the rule wanted.

The guard repair this run shipped in the same branch is deliberately
written without the identifier: it argues its own reason in its own header
and cites §5ah and §5ak, both of which this section's branch already
carried. So nothing on this branch points at §5al as authority, which is
§5ai's operative clause, and the first citation of the number is owed by a
later run. The regime is the second of §5ai clause 3's two: this branch is
an open stack, not a merged trunk, so clause 1 is paid in full and the
one-file proxy is not payable at all.

**Ours.** The presence-versus-absence table, the argument that §5ak
clause 3 is scoped to a check with no output and that this class has one,
the three measured re-spellings of this file and their verdicts, the
finding that widening a verb leaves the property untouched, the five
clauses, the split recognizer and its thirty-character bound, the
refusal in the writer, and the measured 8-against-10 figure for what the
un-refused writer destroys are this run's. The shape, stated as an arm
keyed on the absence of a known phrase manufacturing the absence rather
than only failing to fire, is Ursa's exo seat's, offered on the board and
re-derived here before use: its 32 bodies, its 154 of 1,016 and its walk
of 4,200 rows are that seat's figures, reported as that seat's, and the
confirmation against this seat's own `done` at offsets 233 and 729 is
this run's.

## 5am. A pull request number resolves against a surface outside this tree, so a citation of one carries its disposition and the date that disposition was read

(Added 2026-11-02, by the run woken to answer a project manager's note
closing eight of this seat's rows. Nothing in the note asked for this.
The defect is what the closure sweep did to this file four hours before
the run read it. Amends §5t part 2. That part settles an identifier in
prose with a one-line resolve against a file in this tree, and this is
the class of identifier for which that resolve is both unavailable and,
once available, insufficient, so the narrowing is recorded there rather
than left for a reader to infer.)

(Amended by §5an and §5ap. Generated line, per §5ah.)

**Where the rule comes from.** §5t part 2 already settled identifiers in
prose: a pointer is resolved when it is written, and the resolve is one
line of `grep` against a file in this tree. A pull request number looks
like that case and is not. Its referent is a row on the forge, so the
answer to "does this resolve" is a network read, and worse, the answer
changes without the tree changing. Nothing edits this file when a row is
closed.

**The measurement, taken the morning one was.** `grep -roE '#[0-9]{3,4}'`
over `skills/` and this file returns **15** lines over **9** distinct
numbers. Three of the fifteen are not citations: `#618` in
`grep-dialect.mjs` and twice in `grep-dialect.test.mjs` is a fixture
string, chosen because an apostrophe after a code span is the case that
parser gets wrong, which is §5ad's discriminator applied correctly and is
why the count has to be stated net of it. That leaves **12** citation
lines over **8** rows.

Resolved against the forge on 2026-11-02:

| row | disposition | cited at |
|---|---|---|
| 281 | merged 2026-10-23 | §5q, twice, and `relevance-sweep.test.mjs` |
| 413 | merged | `relevance-audit.md` |
| 477 | merged | §5ai |
| 540 | merged | §5z |
| 601 | **closed unmerged 04:36Z** | §5ai, twice |
| 633 | **closed unmerged 05:08Z** | §5ai |
| 638 | **closed unmerged 05:08Z** | §5ai |
| 646 | **closed unmerged 05:08Z** | §5aj, twice |

So **6** of the 12 citation lines, over **4** of the 8 rows, point at
rows closed without ever merging, and all four were closed in the
thirty-two minutes before this run started. The four sit in §5ai and
§5aj, the two newest sections of this file, and §5ai is the section that
makes naming the pull request part of the discipline. The rule that
mandates the citation is the rule the sweep broke.

**What did not happen, which is the part that decides the remedy.** No
content was lost and no pointer became unresolvable. All four rows are
strict ancestors of this branch's head, by
`git merge-base --is-ancestor`, so every line they argued from is in the
tree a reader of this section is holding. And `refs/pull/<n>/head`
survives closure: this run fetched the heads of all **109** closed and
unmerged rows in this repository in one command and got **140** of 140
refs, closed rows included. A closed row is readable forever.

What decayed is only the row's **standing**. A number carries three
different claims and the citation does not say which: *this is on `main`*,
*this is in the owner's queue*, or *this was set aside in favour of
another row*. The first is a receipt. The third is an argument from a
document the reader will find marked closed, and a reader who takes
"closed" for "withdrawn" discards a correct argument.

**How general it is, measured across the whole queue.** Of the 109 closed
and unmerged rows, **45** carry a comment naming a superseding row. Those
45 pointers resolve to **28** distinct rows, of which **20** are
themselves closed and unmerged, 5 merged and 3 open. A reader following a
closure pointer therefore lands on another closed row about five times in
seven. The live instance is this seat's own and is sixteen minutes wide:
the eight comments posted at 05:08 name a survivor that a newer row of
the same lane already contained by 05:24. The content was never in
danger. The pointer was stale before the ink dried, because a lane
advances every run and a comment is written once.

**And then it happened a second time, to the correction.** This run told
the project manager the first instance at 05:3xZ. At 05:41Z a closure
comment landed on #684 naming #689 as its container, with its own
`merge-base --is-ancestor` proof, which is correct and is the right
receipt. #689 had been contained by this run's own row since 05:24Z, so
the repaired pointer was seventeen minutes stale at the moment it was
written. Two instances, in one lane, inside one hour, the second one
created by fixing the first. That is the argument for clause 3 in a
sentence: no amount of care in writing the number helps, because the
number is not the durable thing and the branch is.

**The rule.** Four parts.

1. **A pull request citation states the disposition and the date it was
   read.** "Merged 2026-10-23", "open in the owner's queue as of
   2026-11-02", "closed 2026-11-02 in favour of this seat's then current
   tip". The date is what makes the sentence survive being wrong later,
   which is §5o's rule about verdicts applied to a pointer.
2. **Once a row is merged, cite the merge commit instead.** A sha is
   resolvable in this clone with no network, it never changes its answer,
   and it is the only form of this citation that cannot decay.
3. **Before a row is merged, name its branch beside its number.** A
   branch prefix names the lane, the lane outlives any one row, and a
   reader who finds the row closed can walk forward to that lane's
   current tip. A bare number cannot be walked forward from.
4. **Do not treat a closed row as a lost one.** The repair for a stale
   citation is to re-date it, never to delete the argument it carries.
   This is §5t part 3 inverted: there the dead name had to stop being
   reproduced, because reproducing it re-armed a real check. Here the
   name is not dead at all and deleting it would destroy a live receipt,
   so the two rules look alike and prescribe opposites.

**What this is not, this run.** It is not a guard. The check this rule
wants is a lock, in the shape `evidence.lock.json` and
`relevance.lock.json` already have: one row per cited number, with its
disposition and the date read, plus a check that every number the library
mentions appears in the lock net of §5ad fixtures, plus a documented
refresh that re-reads the forge. That is code, it is a ninth guard where
§5t declined an eighth, and the question of whether it earns its keep
deserves its own run. It is filed as a ledger entry owned by this seat's
next run, which is §5ai working rather than an exception to it.

**The regime, per §5ai clause 3.** The second one. This run's own commits
touch three files, this one, the ledger and its run record, and nothing
on the branch points at this section as authority. `grep -rn '5am'` over
markdown and JavaScript returns **3** lines, all three in this file: this
section's header, the sentence you are reading, and the back pointer
`--write` generated into §5t at line 1090. Only the last is a mention
from outside the section, it is inside the same file, so it cannot dangle
if the file is held back, which is the exclusion §5al's own §5ai
paragraph recorded for the identical case one section earlier. So clause
1 is paid in full and the first citation of this number as authority is
owed by a later run. The ledger entry that hands the guard to that run
refers to this section by description rather than by number for the same
reason, since the number is the first thing a later branch would copy. The branch is **70** files against `origin/main`, because
it is based on the row this seat opened at 05:24, which is based on the
four rows the table above lists as closed. The one-file proxy is not
payable from here and this run does not claim it.

**Ours.** The whole of it. The fifteen-line count and its net of three,
the eight-row disposition table, the ancestor check that shows nothing
was lost, the measurement that `refs/pull/<n>/head` outlives closure at
140 of 140, the 45-to-28-to-20 census of the queue's own closure
pointers, the sixteen-minute live instance, the three-claims argument,
the four clauses, and the inversion against §5t part 3. The project
manager's note supplied the occasion and the ancestor test it used on
this seat's rows, both taken as data and re-derived here before use.

## 5an. A cap is applied before the filter, so an unsaturated read reports a subset as a population, and the ratio can survive while every count in it is wrong

(Added 2026-11-02, by the run the previous section's ledger entry named
as its owner. Amends §5am parts 1 and 3. Amends §5ai clauses 1 and 3.
The first
because that section's census was taken through a capped read and its
denominators are understated by a factor of three, which this run found
while re-deriving them to answer the ledger's open question. The second
because the date §5am asks a citation to carry is the wrong unit for the
interval over which the thing decays, measured here for the first time.
The third because §5ai clause 1, read literally, cannot be paid by any
run in the regime clause 3 names, which would make the guard §5am asks
for unwritable for as long as the queue stays undrained.)

(Amended by §5ao. Generated line, per §5ah.)

**The retraction first, because HQ's standard is that a number a reader
may have acted on is corrected before anything is built on it.** §5am
reports "109 closed and unmerged rows" in this repository and a census
of 45 closure pointers resolving to 28 rows. The population is **355**,
and the 109 was a capped read. The mechanism is exact and it is one line:

```bash
gh pr list --state closed --limit 200 --json number,mergedAt \
  --jq '[.[]|select(.mergedAt==null)]|length'
```

`--state closed` on the forge includes merged rows, because a merged row
is a closed row. So the cap is spent on the union and the filter runs
afterwards, on whatever the cap happened to admit. The figure therefore
grows with the cap and never announces that it has not saturated:

| `--limit` | unmerged rows reported |
|---|---|
| 100 | 44 |
| 200 | **112** |
| 300 | 174 |
| 500 | 284 |
| 1000 | **355** |

112 at a cap of 200 is the shape of the published 109, taken an hour
earlier when the queue was two rows shorter. The read saw 200 of this
repository's 670 closed rows, thirty percent of them, and reported what
it found as a total. This is §5ak's rule arriving from the other
direction: that section made a check print the size of the population it
examined, and the defect here is a read that printed a count of what it
found without printing what it looked at.

**What the correction did to the finding, which is the part worth
keeping.** The population census, taken over all 355 rows by reading
every one of their comments:

| | capped read | population |
|---|---|---|
| closed and unmerged rows | 109 | **355** |
| carrying a pointer to a superseding row | 45 | **197** tight, **332** loose |
| distinct rows those pointers name | 28 | **122** |
| of those, closed and unmerged | 20 | **78** |
| **pointer rows landing on a closed row** | **20 of 28, 71%** | **138 of 197, 70%** |

Every count moved by a factor of three or four. The ratio moved by one
point. A capped read bounds a count and need not bias a ratio, and the
read cannot tell you which of those two it did, which is the whole reason
the saturation check is not optional. The two numbers for "carrying a
pointer" are the bounds of an extraction, not a range of error: the tight
one requires a verb phrase, `superseded by #N`, `contained in #N`,
`absorbed into #N`, `in favour of #N` and five more spellings; the loose
one takes any row number inside a comment that reads like a closure.
Both are stated because the headline ratio is computed on the tight set
and the tight set is the smaller claim.

**And the population answers a question the sample could not.** A
pointer can be walked transitively: the row it names may itself carry a
pointer. Following every chain to its terminal, over the 197:

| where the chain ends | rows |
|---|---|
| on a closed and unmerged row | **109** |
| on a merged row | 63 |
| on an open row | 25 |

Mean 2.34 hops, longest 11. So a reader who does the diligent thing and
keeps following the numbers still ends on a closed row more than half the
time, and may spend eleven hops doing it. One hop is 70 percent; the
whole chain is 55 percent. The chain is not a repair for the form, which
is the quantitative statement of §5am's clause 3 and the reason that
clause is about the lane rather than about following the pointer harder.

**The decay interval, which is the unit §5am got wrong.** Ursa's exo
seat, replying on the board to the previous run, said the interval here
is one run and not one day. That is a claim about this repository and it
is measurable, so it was measured. Taking a lane as the first segment of
a branch name, over all 700 rows in 27 lanes, 673 intra-lane intervals:

| how long a row stays the newest row in its own lane | minutes |
|---|---|
| first quartile | 19.7 |
| **median** | **45.1** |
| third quartile | 542.8 |
| ninth decile | 3181.3 |

51.7 percent of rows are superseded inside their own lane within the
hour; 86.5 percent within a day. So the date §5am part 1 asks a citation
to carry is coarser than the median half-life of the fact it dates by
about a factor of thirty. **Part 1 is amended to a timestamp**, in the
`2026-11-02T06:16Z` form the rest of this register already uses for
anything measured inside a run, and the reason is printed next to it
rather than left as a convention: a disposition read yesterday is not
stale by a day, it is thirty-two half-lives old.

**The other half of that measurement is kinder to the seats than the
previous section was, and it belongs in the record.** Of the 197 closure
pointers, **168** named the row that was its lane's newest at the moment
the comment was written. **29** named a row the lane had already moved
past, median by 2.6 minutes. The previous section found two instances by
hand, in one lane, inside one hour, and concluded the defect was in the
form rather than in the care. The population says both halves: care gets
a pointer right 85 percent of the time at the moment of writing, and the
form then loses it anyway, because the median row stops being its lane's
tip 45 minutes later and the comment is written once. Neither sentence is
the finding on its own. **A remedy aimed at the care would address 15
percent of it.**

**§5ai clause 1, and why a literal reading makes this guard
unwritable.** §5ai says a section lands in a pull request carrying
nothing that cites it, and the work citing it belongs to a later run.
This run is that later run, and the section it must cite is still in the
owner's queue. Its clause 3 names the two regimes and this is the second:
an open stack, not a merged trunk. In that regime the later run cannot
branch from the trunk either, for the two-spellings reason §5ai sets out
itself, so its branch necessarily contains the row that added the
section. Read clause 1 as a property of the branch and it is unpayable
by anyone, forever, until the owner merges. The guard that was the whole
point of the previous section could never be written.

**The reading that is both satisfiable and faithful is ancestry.** What
clause 1 is for is that no tree ever holds a citation without holding the
section it cites. Branch separation is one way to get that and it is not
the only one. Containment is another, and it is checkable:

```bash
git merge-base --is-ancestor refs/prs/<section-row> HEAD   # exit 0
```

If the section's row is a strict ancestor of the branch carrying the
citation, then there is no merge order that lands the citation without
the section, because the citation's row cannot merge without bringing the
section's commits with it. The owner may merge the section's row alone,
which is the order §5ai wants, or the citing row, which brings both.
Neither spelling dangles. **So clause 1 is amended: the ordering is paid
either by branch separation, from a merged trunk, or by ancestry, from an
open stack, and a run in the second regime states the ancestor check it
ran.** This run ran it, against the row that added §5am, and it exits 0.

**What this run's guard does with all of it.** It is the ninth, it is
`skills/forge-citations.mjs` over `skills/forge-citations.lock.json`, and
the ledger entry's open question is answered against the queue rather
than by preference. The alternative was §5am part 2 alone: cite the merge
commit and let the number disappear. Of the 700 rows this repository has
had, 315 merged, 355 closed unmerged and 30 are open, so roughly half of
all rows never acquire a sha, and four of the ten rows this library cites
are closed and unmerged permanently. Part 2 is undefined for exactly the
class that decayed. It is the guard's easy case, not an alternative to
it.

The population argument the ledger entry asked for came out the other way
from how the entry framed it. It asked whether a guard earns its keep for
twelve lines. Citations in this library went **0** on 2026-10-18, **1**
on 2026-10-24, **5** on 2026-10-27, **15** at 04:27 on 2026-11-02 and
**19** two hours later, and they grow by construction now, because §5ai
and §5am both require a run to name the pull request it argues from. A
guard priced against today's twelve is priced against the smallest
population it will ever police.

**The instrument is inside the population it counts, and it has to say
so.** Writing the guard took the library from 19 mentions to **34**, of
which 26 are citations, because the guard's own header argues from four
closed rows and its tests use two more as fixtures. §5ag recorded this
shape once already, for the two count rules that scoped every file in the
library except the one they were written in. The number a count rule
reports is a number the count rule moved. Both figures above are stated
with their date and their tree for that reason, and the 19 is the tree
before this run's first commit.

**One mention is exempt and the reason is §5aa's, not a convenience.**
`#999` appears twice in the guard's tests, as the number that must *not*
be in the lock for the negative case to prove the check bites. §5aa
settled this class: the exempt mention is the one whose correctness
depends on the name not resolving. It is declared in the lock's
`fixtures` list beside `#618`, with that reason written out, and it stays
exempt if the forge ever issues row 999, because what is exempt is the
mention and not the row.

**Ours.** The cap-before-filter mechanism and its five-point saturation
table, the retraction of the 109 and the population census behind it,
the finding that the ratio survived while every count in it moved, the
transitive chain measurement and its 109-of-197 terminal, the decay
distribution over 673 intra-lane intervals, the split of the defect into
85 percent care and the rest form, the ancestry reading of §5ai clause 1
and its proof, the pricing of part 2 against the 315-355-30 split, the
citation growth series, and the self-inflation disclosure are this run's.
The claim that the interval is one run rather than one day is Ursa's exo
seat's, taken from a board message as data and measured here before use;
it is right in kind, and the number it implies is 45 minutes.

## 5ao. A cap is also a bound in time, so a published command stops reaching the thing it proved and nothing in it says when, and the predicate belongs in the query

(Added 2026-11-02, by the fourteenth message run of the day. Amends §5ac
and §5an. The first because the command §5ac prints as the receipt for
its own count no longer returns that count, measured here, while the
count itself re-derives exactly. The second because §5an's remedy, which
is that a read prints what it looked at, is necessary and does not
reach this case: the read §5ac published said what it looked at and was
still unreproducible a week later. The ancestry this run owes under
§5ai's amended clause 1 is `git merge-base --is-ancestor refs/prs/700
HEAD`, which exits 0, because this branch is #711 and it is built on
#700, the row that added §5an, rather than on the trunk.)

**The occasion, stated because it was not a request.** Ursa's project
manager wrote to this seat at 06:53Z to say it had read this seat's
retraction of the 109 and is carrying 355 of 670 as the population from
here, and that nothing is owed back on its side. Its note asked for
nothing. What it did do is confirm that another seat has now taken a
number out of this register and is using it, which is the condition
under which the rest of this register's published numbers stop being
this seat's private business. So this run re-derived the other count in
this file that rests on a capped read.

**§5ac's number is exact and its receipt is nearly dead.** §5ac says of
a security seat's report: "the count is exact: `gh run list
--workflow=redaction-gate.yml --limit 300` returns exactly six failures
in that window and all six are this seat's." Re-measured at 07:05Z on
2026-11-02, with the window in the query instead of under the cap:

```bash
gh run list --workflow=redaction-gate.yml \
  --created '2026-10-26T19:38..2026-10-26T19:53' --limit 100 \
  --json conclusion,headBranch
```

Seventeen runs in the window, **six failures, all six on
`ursa-skill/2026-10-26-message-3`**, and `--branch
ursa-skill/2026-10-26-message` returns **19 runs, 19 green**. Every
number §5ac published re-derives. The command it published does not:

| what was asked | what comes back |
|---|---|
| `--limit 300`, no window | the newest 300 runs, about 5 hours of them, derived from the row below rather than read |
| `--limit 400`, no window | 400 runs, `2026-11-01T23:46` to `2026-11-02T06:58` |
| `--limit 1000`, no window | 1000 runs, back to `2026-10-26T05:05`, the window included |
| `--limit 1200`, no window | **1000 runs.** The flag is clamped |

So the receipt as written reaches about five hours into a surface it is
asked to prove something about 155 hours back, and raising the cap is
not an open-ended repair: `gh run list` clamps at 1000 and refuses to
widen past it.

**How close to dead, exactly, because the margin is the finding.** The
workflow has run 2,794 times, of which **703 since the start of the
window §5ac cites** (`gh api
repos/alexandrapaiz/Ursa/actions/workflows/redaction-gate.yml/runs?per_page=1&created=>=2026-10-26T19:38`,
read as `total_count`). The ceiling is 1000. **The receipt is alive by
297 runs** and by nothing else.

And the lifetime of that margin is set by a rate this repository varies
thirty-fold. **384 runs since 2026-11-02T00:00**, seven hours, about 55
an hour. **219 runs across the five days from 2026-10-27 to
2026-11-01**, about 1.8 an hour. The same 297 runs of headroom is five
and a half hours of a message-pass morning and about a week of a quiet
one. A reader cannot price the expiry of this receipt without measuring
the rate of the surface, and nothing in the receipt mentions a rate.

**The rule, and it is one sentence longer than §5an's.** On any surface
that returns newest-first, a cap on rows is a bound in time whose width
is the quotient of the cap and the surface's rate. Neither term is in
the output. §5an's remedy makes the first term visible, which stops a
count being published as a population. It does not make the second
visible, and the second is what decides whether a command still reaches
the thing it was printed to prove. **So the predicate that isolates the
claim goes into the query, not into a filter after it.** A read whose
cap is spent only on the rows the claim is about does not drift when the
surface gets busy, because the surface's other traffic was never on the
page.

**Measured both ways on the same question, which is the control this
needs.** The retraction in §5an was caused by `gh pr list --state
closed` filtered afterwards for an absent `mergedAt`. The same question
asked with the predicate in the query, at 07:08Z on 2026-11-02:

| | rows returned | of which unmerged |
|---|---|---|
| `--state closed --limit 1000`, filtered after | 697 | **363** |
| `--search 'is:closed is:unmerged' --limit 1000` | **363** | 363 |

The two agree exactly, which is the point: the server-side predicate is
not a different measurement, it is the same one taken where the cap
cannot reach it. What differs is headroom. The first saturates when this
repository's closed rows pass the cap and has 303 rows of room. The
second saturates when its *unmerged* rows pass the cap and has 637. The
repository stood at 712 rows at that minute, 15 open, 334 merged and 363
closed and unmerged, against §5an's 700 rows an hour earlier at 30 open,
315 merged and 355 closed and unmerged. Twelve rows were opened and
fifteen open rows went away inside the hour, which is §5am's decay
interval doing exactly what §5an measured.

**The vocabulary, because the remedy is only as good as the qualifier
that exists.** Every capped read this seat publishes has a
window-shaped alternative and none of them was used: `--created
<range>` and `--branch <ref>` on `gh run list`, `--head <branch>` and
`--search 'head:<lane>/'` and `is:closed is:unmerged` on `gh pr list`,
`since_hours` with `before_hours` on the board. The last of those is
already paired with a `saturated` flag, because the board learned this
on 2026-10-24 and shipped the check. **Neither forge read returns
anything of the kind**, which is why the check has to live in the
reader, and why this run put that sentence into the one place in this
library that prints a capped read to somebody else:
`skills/forge-citations.mjs --refresh`.

**This library printed the defect while retracting it, and that is the
instance worth keeping.** The run that wrote §5an also wrote the ninth
guard, and the guard's `--refresh` plan told its reader to list every
open row at `--limit 200` and pick the lane out with `jq`. Cap on the
queue, predicate afterwards, in a tool shipped in the same hour as the
retraction of that exact shape. It had not bitten, because this
repository had 15 open rows. It bites at 201 and the output would never
have said when it started. It now reads `--search 'head:<lane>/'`,
verified against this lane at two rows of fifteen open, and the plan
says in words that a read whose row count equals its cap did not finish.
Two tests hold it, one of which asserts the absence of the old form
rather than the presence of the new one, because the defect was a
positive statement in a string and the only regression that matters is
its return.

**Three smaller defects in the same guard, found by running it rather
than by reading it, and all three are this seat's own.** The first is a
self-count. §5an reports that writing the guard took this library "from
19 mentions to 34, of which 26 are citations". The guard printed **36**
before this run changed a character, 26 citations and 10 fixture
mentions, so the total was taken mid-run and the run's own remaining
commits moved it. The citation half was right and the total is stale by
two, which is §5ag's rule arriving a third time: the number a count rule
reports is a number the count rule moved.

The second is that the lock's fixture entries each declare how many
mentions they exempt and **nothing had ever read that number**. Row 618
declared 4 against 7 in the tree and row 999 declared 2 against 3. A
declaration is the bound on an exemption, so an unread one widens every
time somebody writes the number down, which is the §5al shape with the
vocabulary replaced by a count. It is checked now, and asymmetrically:
more mentions than declared is a failure because the exemption covers
text no reviewer saw, fewer is reported because a removed mention
narrows it. Both real drifts were upward.

And writing that check widened the exemption it checks, immediately. The
comment explaining the drift names both numbers, so each went up by one,
and the test proving the check bites needed a third fixture of its own.
The library now stands at 42 mentions, 28 citations over 12 rows, and
three fixtures declaring 8, 4 and 2. Every one of those figures is a
figure this paragraph moved, which is why it carries the tree it was
taken in.

The third is the one that is simply a bug. The lock's age is printed in
minutes and can go negative, and did: a hand bumping `read_at` rounded
it forward past the clock and the guard printed "the lock was read -9
minutes ago" with the decay paragraph underneath it as if nothing were
wrong. Negative age is a failure now rather than weather, because a lock
dated in the future was not read when it says it was, and every sentence
the guard prints about staleness is computed from that field. Sixteen
tests hold the guard, up from thirteen, and the library's suite is 197
green.

**What this does not fix, named so it is not read as more than it is.**
A command cannot carry its own expiry, because the expiry is a property
of the surface and not of the text. What a published command can carry
is a predicate narrow enough that the surface's traffic does not push
the claim off the page, and a sentence saying what to check before
believing the output. §5ac's six failures would have survived both ways.
What would have changed is that a reader in 2026-11-09 could still run
the line and see them. That is the whole claim.

**Ours.** All of it. The re-verification of §5ac against a windowed
read, the four-row cap table and the 1000-row clamp, the 703-of-1000
margin and the thirty-fold rate spread that prices it, the 363-both-ways
control and the headroom comparison, the 712-row census beside §5an's
700, the vocabulary list and the observation that the board pairs its
cap with a saturation flag where the forge does not, this library's own
instance of the defect inside the guard that retracted it, and the three
smaller defects above: the stale self-count, the fixture declarations
nobody had ever read, and the negative lock age. The
project manager's note supplied the occasion and is taken as data. It
asked for nothing, and nothing in it was acted on as an instruction.

## 5ap. A disposition is a fact about a row and a reader needs a fact about their own tree, so a citation carries whether what it points at is readable on `main`

(Added 2026-11-09, by the message run woken when #711 merged. Amends
§5am. That section made a citation carry its disposition and the date
the disposition was read, and it named the three claims a bare number
conflates. None of the three is the one that decides whether following
the citation works. The ancestry this run owes under §5ai's amended
clause 1 is `git merge-base --is-ancestor origin/main HEAD`, which
exited 0 at the instant this section was written, because this branch is
built on the trunk rather than on an earlier row of this seat's.)

**Where the rule comes from.** §5am says a number carries three
different claims and the citation does not say which: *this is on
`main`*, *this is in the owner's queue*, or *this was set aside in
favour of something else*. All three are facts about the row. A reader
who follows a citation is not asking about the row. They are asking
whether the lines the citation argues from are in the tree they are
standing in, and that question has an answer the row's disposition does
not contain.

**§5am measured the right thing against the wrong ref, which is why this
is an amendment and not a new subject.** Its own text reads: "All four
rows are strict ancestors of this branch's head, by `git merge-base
--is-ancestor`, so every line they argued from is in the tree a reader
of this section is holding." The predicate is right and the ref is not.
`this branch's head` is the one ref no reader of the merged section ever
checks out. `docs/agents/runner-facts.md` carries the same correction
for a different surface under `authorship-is-not-visibility`: a
past-tense claim that an edit exists is true of a ref, and the ref every
other seat checks out is `main`. So the measurement moves to `main` and
stops being a sentence, because a sentence in a section is not a field a
check can read.

**The measurement, over the whole population rather than over the rows
this file happens to cite.** Read 2026-11-09, over all **386** closed
and unmerged rows this repository has had, with the predicate in the
query as §5ao requires:

| readable on `main` | rows | share |
|---|---|---|
| yes | 111 | 28.8% |
| no | 206 | 53.4% |
| undecidable from a clone, because the branch is gone | 69 | 17.9% |

So `closed-unmerged` is one label over a population that splits about
three to one against the reader, and a reader who guesses from the label
is wrong 71 per cent of the time.

**And the prior inverts inside this library's own lane, which is the
reason the field cannot be inferred even by somebody who knows the
table above.** Of the **53** closed and unmerged `ursa-skill` rows,
**47** are ancestors of `main`. The mechanism is this seat's own
practice: it builds each run's branch on the previous run's rather than
on the trunk, under the rule in this file about an ancestor being the
one way a citation cannot land without its section, so when a tip merges
every row behind it lands without ever being merged itself. A reader who
learns the repository's 71 per cent and applies it here is wrong 89 per
cent of the time. Two correct priors, opposite directions, same label.

| lane | closed-unmerged rows | readable on `main` |
|---|---|---|
| `ursa-skill` | 53 | 88.7% |
| `ursa-engineer` | 26 | 65.4% |
| `ursa-pm` | 142 | 8.5% |
| `ursa-research` | 26 | 0% |

**The rule.** A citation of a pull request number carries, beside the
disposition §5am requires, the row's head sha and whether that head is
readable on `main`, with the three values `yes`, `no` and
`unknown-offline`. It is re-derived from the sha by any complete clone
and it is locked anyway, for the reason in the next paragraph.

**Why it is locked when a clone could compute it, since the rest of
this file argues the opposite way about anything a command can answer.**
Because the evidence expires, and in one direction only. A head readable
on `main` is in `main`'s history, so every complete clone holds it
forever. A head that never landed is in the clone only while its branch
exists, and branches here are deleted with age. Of the closed and
unmerged rows numbered under 100, **84.2 per cent** are already
undecidable from a complete clone. Of those numbered 300 and above,
**0.6 per cent** are. The share falls monotonically across the bands in
between. The answer is available now and will not be later, which is the
definition of a thing that belongs in a dated snapshot rather than in a
command.

**The obvious predicate is wrong once in 386, and the one case is in
this lane.** `git merge-base --is-ancestor` reports #608 as not readable
on `main`. It has exactly one commit ahead of `main`, that commit is a
merge of `main` into the branch, and so it contributes nothing `main`
lacks. The honest answer is yes. The predicate that gets it right is
`git rev-list --count --no-merges origin/main..<head>`, which is 0
there. One row in 386 is a rate and not a corner case, so the rate is
written down and the second command stays. A forward merge onto a row
the trunk already contains is a move this seat has made and argued about
before, which is why the case exists here at all and would not exist in
a lane that never did it.

**`yes` is permanent and `no` is provisional, measured rather than
reasoned.** `main` only grows, so a head readable on it stays readable,
and a head that is not can become so later. This run watched it happen
to the base rather than to a row: `origin/main` moved from `8127eac5` to
`67656fe8` while the work was in progress, another seat's row having
merged, and every one of the fourteen verdicts was unchanged across the
move. So a `yes` needs no refresh and a `no` is a reading with a date on
it, the same asymmetry §5am established for a disposition and for the
opposite reason.

**What the field does not say, stated because the wider reading is the
laundering this register exists to stop.** `no` means this exact commit
is not in your tree. It does not mean the work was lost, and the two are
far apart. #258 is the example, and it is the one `no` among this
library's fourteen rows: **607** of its **613** commits have
patch-identical equivalents on `main` and **6** do not, by `git cherry`,
because the branch was built on an old base and the same patches landed
as different commits. The claim this field supports is about commits.
Anyone who needs to know whether the work was delivered reads the diff,
and no field here replaces that.

**Paid on this section, and both forms of the check moved while being
written.** §5ai makes the payment a `grep`. Run once before this
paragraph existed, the bare `grep -rn '5ap'` over the repository
returned **three** lines, of which one was
`ursa-minor/package-lock.json:1069`, where `5ap9m9` is a run of
characters inside a `sha512-` integrity hash. That hit is not a mention,
by §5ad's discriminator: the string is not load-bearing as a search key
there, so the lockfile is left alone. Writing this paragraph took the
same command to **five**, because it quotes the pattern three more
times, and the anchored form `grep -rn '§5ap\|## 5ap'` to **two** from
one for the same reason. Both movements are §5ag, which is that writing
the check moves the count the check reads, and they are reported rather
than smoothed over because the smooth version hands a reader a figure
they cannot reproduce.

So neither number is the one §5ai's rule turns on. That rule asks for
mentions from **outside** the section, which are **zero**, and zero is
the one count here that nothing written inside this section can move.
The remaining lesson is §5al's: a count read out of an unanchored
pattern is a claim about the vocabulary, and a section certifying its
own grep is the worst place to leave one unchecked. The guard clause
this section argues for landed in the same pull request and deliberately
cites §5am instead, which is the section that is on `main`, so there is
nothing here for a later branch to dangle and nothing already written
that points at a section the owner has not yet read.
