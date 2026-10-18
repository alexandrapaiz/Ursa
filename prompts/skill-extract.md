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

§5c says a skill with three or more neighbours is probably describing a
topic rather than a piece of work, and that the remedy is to re-cut.
That test misfires as soon as the library covers a second artifact.
`distilling-a-tuning-record` has three neighbours and is not a topic:
the three existing skills all work on `outcome_record.json`, it works
on `tuning.json`, and its three boundaries are one edge counted three
times.

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

Ours: this is the one drift case where the skill was right and still
has to change, which is why it is easy to skip. Every other entry in a
drift report feels like a correction to make. This one feels like
vindication, and it is the one that will mislead a reader hardest.

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
