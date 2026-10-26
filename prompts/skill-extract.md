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
