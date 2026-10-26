---
name: attributing-a-deleted-span
description: >
  Use when an outcome record says generated text is gone and someone has
  to decide what destroyed it: the person correcting the model, an
  intervening merge destroying it mechanically, or a clone this run could
  not read. Fires for reading the `deletion` block on a
  `generated_deleted` span, for deciding whether a zero in
  `mergeDeletedChars` is a measurement or a default, for separating the
  three `unknownReason` values and naming the fetch that would settle
  each, for judging whether `humanDeletedChars` may be called a discard
  rate on this clone, and for auditing a discard figure that was computed
  with no attributor injected. Does not fire for choosing which work to
  resolve or running the resolver, for deciding whether a span descends
  from a generation at all or settling an `uncertain` flag, for deciding
  what a stored percentage is a share of, for the forward walk that
  decides whether surviving text later decayed, for auditing a
  correction loop or any other `signals` block, for turning a record's
  labels into tuning axioms, for adding or changing a bound in the
  record gate, or for deciding what may leave the machine.
version: 0.1.0
status: draft
validated: false
owner_seat: skill
created: 2026-10-26
revised: 2026-10-26
evidence_scheme: repo
evidence:
  - ref: E1
    what: absence has three causes, the first two mean opposite things, and a merge deletion counted as a discard also names the wrong person because finalAuthor is whoever made the later unrelated commit
    source: ursa-major/src/deletion.ts:1-26
  - ref: E2
    what: the three deletion causes as the schema states them, and why unknown exists at all, because humanDeletedChars is the number Ursa Minor sells as a discard rate and a missing git object is not a person's decision
    source: ursa-major/src/types.ts:41-63
  - ref: E3
    what: the three unknown reasons, specific because each names a different missing object and has a different fix, one of them fixed by fetching the base ref
    source: ursa-major/src/types.ts:65-84
  - ref: E4
    what: the attribution block's shape, where mergeSha is the merge that destroyed the text or the one that could not be read, and unknownReason is set only when the cause is unknown
    source: ursa-major/src/types.ts:86-98
  - ref: E5
    what: the defect this module fixes, where one return value meant both a definite absence and an unreadable object, and the direction of the resulting error was always toward blaming the person
    source: ursa-major/src/deletion.ts:28-40
  - ref: E6
    what: a proven cause beats a missing one, so the scan keeps walking after it finds a hole and returns the hole only if no merge can be shown to have destroyed the text
    source: ursa-major/src/deletion.ts:42-44,129-131
  - ref: E7
    what: the conjunctive merge test and its three holes in code, with the first hole kept by a nullish assignment and later holes discarded, and an empty-after-normalization span returned as the person's
    source: ursa-major/src/deletion.ts:125-127,133-174
  - ref: E8
    what: the two fallbacks, where no readable merges and no blind shas makes every deletion the person's, and one blind sha makes every unexplained deletion unknown named by the first sha alone
    source: ursa-major/src/deletion.ts:96-105,176
  - ref: E9
    what: attribution is injected into a resolver that reads no git, and omitting the injection attributes every deletion to the human, with the default spelled out at the call site
    source: ursa-major/src/resolve.ts:5-13,54-59,536
  - ref: E10
    what: an omitted artifact field means the chat path, and ursa run passes repo or hosted because it walks git
    source: ursa-major/src/resolve.ts:47-53
  - ref: E11
    what: the episode carries the readable intervening merges and separately the shas whose parentage could not be read, and an absent second list is what makes an empty first list mean none rather than unknown
    source: ursa-major/src/episodes.ts:28-43
  - ref: E12
    what: the split as stats computes it, where merge and unknown are summed over spans carrying those causes and the human share is the gross figure less those two, with the subtraction's own stated reason
    source: ursa-major/src/stats.ts:97-112,125-126
  - ref: E13
    what: the four stored deletion fields and what each may be called, with humanDeletedPct the only rate the schema permits to be called a discard rate and unknown chars excluded rather than folded in, moving on a re-run after the missing objects are fetched
    source: ursa-major/src/types.ts:782-802
  - ref: E14
    what: DELETION_SPLIT_EXACT, the bound holding the three-way split exact and non-negative against the gross figure
    source: ursa-major/src/invariants.ts:196-197
  - ref: E15
    what: not_generated carries no deletion attribution and is subtracted from the gross figure before the human share, and without the fate that text fell to generated_deleted, a false label in the one class sold as correction signal
    source: ursa-major/src/types.ts:16-39
supersedes: []
---

# Attributing a deleted span

An outcome record can see that generated text is not in the finished
file. It cannot see why, and the two answers that matter most mean
opposite things. `human_edit` says the person had the text in front of
them and did not keep it, which is the correction signal Ursa Minor
sells. `merge` says a merge commit between the generation and the
closing commit resolved the file to something without the text, so
nobody read it and rejected it [E1].

This skill is for the gap between those two, and for the third answer
that exists because the gap cannot always be closed: `unknown`, which
says a merge sat on the boundary and the evidence that would decide
could not be read from this clone [E2].

## When this fires

Four situations, and the first one is the common one.

1. A record reports `humanDeletedChars` or `humanDeletedPct` and a
   number from it is about to be written into a document, a disclosure
   batch or a pull request description.
2. A record reports `mergeDeletedChars: 0` and someone is about to read
   that as "no merge destroyed anything."
3. A span carries `deletion.cause: 'unknown'` and someone has to decide
   what to fetch, or whether to re-run at all.
4. A record was produced with no deletion attributor injected, and the
   question is whether its discard figure means anything.

It does not fire for whether a span is `generated_deleted` in the first
place. That is a question about descent and about thresholds, and it is
settled before this skill is reached.

## The procedure

**1. Read `task.artifact` before you read any deletion figure.** An
omitted `artifact` means the chat path, where the final file is the file
on disk and no merge sits in between, so every deletion is the person's
by construction and correctly so [E9, E10]. `ursa run` passes `repo` or
`hosted` because it walks git [E10]. Only on those two paths is a
deletion figure the output of a test rather than of a default. Output:
one sentence naming the path, and whether the zeros below are facts or
defaults.

**2. Distinguish "no merge did it" from "nothing looked."** An episode
carries two things: the merges between the generation and the closure
that touched a paired path, and separately the shas of merges whose
parentage could not be read anywhere. The second list is what makes an
empty first list mean "none" rather than "unknown", and the schema says
so in the field's own comment [E11]. On a repo-path record with no merge
inputs at all, `mergeDeletedChars: 0` is unestablished rather than zero.
Output: either the zero is defended by naming the merges that were
tested, or it is marked unestablished.

**3. Separate the three unknown reasons, because each names a different
missing object and each has a different fix** [E3].
`unreadable_merge_commit` is the cheapest and the most likely: a merge is
known to sit on the boundary by sha alone, its parentage is absent from
the clone, and fetching the base ref fixes it [E3].
`unreadable_merge_result` means a parent held the text and the merge's
own tree could not be read, so half the conjunction ran [E3, E7].
`unreadable_merge_parents` means the merge's result is readable and lacks
the text, but whether the text was ever there to destroy is unanswered
[E3, E7]. Output: the reason, the object that is missing, and the fetch
that would settle it.

**4. Do not read `mergeSha` on an `unknown` as the only merge
involved.** The field holds one sha, and which merge that is depends on
the cause: the merge that destroyed the text when the cause is `merge`,
the merge that could not be read when it is `unknown` [E4]. The scan
keeps the first hole it finds, with a nullish assignment that later
holes do not overwrite [E7], and the blind fallback names `blind[0]` and
nothing else [E8]. So one unreadable
boundary and nine of them produce a record that looks the same. Output:
a note that the named merge is one instance, with the count not
available from the record.

**5. Check whether the human share was counted or left over.**
`mergeDeletedChars` and `unknownDeletedChars` are sums over spans
carrying those two causes. `humanDeletedChars` is not a third sum: it is
the gross deleted figure less those two [E12]. Nothing computes it from
the `human_edit` label.

Ours, measured rather than read:

```
grep -rn "'human_edit'" ursa-major/src --include=*.ts | grep -v '\.test\.'
```

returns three lines on this tree, the type union in `types.ts`, the
module's own `HUMAN` constant, and the resolver's default at the
injection site. None is in `stats.ts` and none is in `invariants.ts`, so
no figure in the record and no bound in the gate consults the label at
all.

**6. Re-read the gross figure's own subtraction before quoting any
share of it.** `not_generated` segments carry no deletion attribution
and come out of the gross figure before the human share is computed,
and the fate exists because without it that text fell to
`generated_deleted` [E15]. `DELETION_SPLIT_EXACT` holds the identity [E14], and
the identity is true by construction of the subtraction that produces
the human share [E12], so the four fields add up whether or not any of
them is right. Output: the three subtractions, written out, with the gross
figure they produce.

**7. Name the rate you mean, and name the clone you read it on.**
`humanDeletedPct` is the only one of the stored rates the schema permits
to be called a discard rate, and `deletedPct` is explicitly the gross
figure rather than a claim about the person [E13]. Unknown characters
move into one of the other two on a re-run after the missing objects are
fetched [E13], so a quoted discard figure is a figure about a clone and
not only about a person. Output: the field name, the rate, and the
clone's state when it was read.

## Judgment

**The subtraction's stated reason reads backwards, and this is the
finding to carry out of the skill.** The comment above the split says
the human share is computed by subtraction rather than by counting
`human_edit` spans "so a cause added later is excluded from the discard
rate by default instead of landing in it silently" [E12].

Ours: the arithmetic does the opposite of what that sentence claims. A
fourth `DeletionCause` added to the union would appear in the gross
figure, would be matched by neither the `merge` filter nor the `unknown`
one, and would therefore land inside `humanDeletedChars`, silently and
by default [E12]. `DELETION_SPLIT_EXACT` would stay green, because the
identity it checks is true by construction of the subtraction [E14].
Counting `human_edit` spans instead is what would have produced the
behaviour the comment describes: the new cause's characters would sit
outside all three fields, the split would stop being exact, and the
gate would fire on the next record. So the chosen implementation is the
one that fails quietly and the rejected one is the one that fails
loudly. Treat the comment as a statement of intent that the code does
not carry out, and do not rely on either for a cause that is not one of
the three named today.

**The error has a direction, and it is the expensive one.** The defect
this module exists to fix had one return value standing for both "the
path is not in this tree", a definite answer, and "the commit is not in
this clone", no answer at all. A shallow clone, an unfetched fork head
or a branch deleted after merge all produced the second, the
containment check read false, and the span fell through to
`human_edit` [E5]. Every hole in a repository therefore became a
correction the person never made. Ours: the asymmetry is what makes
this worth a skill rather than a comment. A false `merge` loses signal,
which is a cost paid in sample size. A false `human_edit` manufactures
signal and sells it, which is a cost paid in the only asset that
compounds.

**A proven cause beats a missing one, which is right and hides
something.** The scan returns `merge` as soon as one boundary can be
shown to have destroyed the text, and keeps walking past a hole in the
hope of finding one [E6]. So a span whose deletion a readable merge
explains never reports that some other boundary was unreadable. Ours:
`unknownDeletedChars` is therefore a floor on how blind the clone was
and not a measure of it, and a record with a small unknown figure and a
large merge figure has told you less about its own completeness than it
appears to.

**The conjunctive test is deliberately hard to satisfy, and the
residual is where that lands.** A span has to disappear exactly at a
merge boundary to earn the `merge` label [E1]. Everything that
disappears gradually, or across a rebase, or at a boundary the walk did
not pair, is not merge-labelled, and by step 5 it is in the human share.
Ours: read `humanDeletedChars` as "deletions no mechanical cause was
found for", which is what the schema's own first clause says [E2], and
not as "deletions a person made".

**A whitespace-only span goes to the person.** A span whose text
normalizes to nothing returns the human attribution before any merge is
consulted [E7]. Ours: this is almost always harmless, because such a
span contributes few characters, and it is worth knowing because it is
the one `human_edit` on a repo-path record that no merge test produced.

## Limits

- **Whether the span should be `generated_deleted` at all is out of
  scope.** That is a descent and threshold question, settled upstream.
  This skill takes the fate as given and rules only on the cause.
- **Denominators are out of scope.** What a stored percentage is a
  share of is a separate ruling, and a prompt that asks both is handled
  there first, because a cause cannot be audited until it is known which
  population the figure covers.
- **What happened after the episode closed is out of scope.** Deletion
  attribution is a backward test on merge boundaries inside the episode.
  Text that survived the episode and was removed later is a different
  block computed by a forward walk.
- **No measured accuracy.** Ours: nothing in this repository reports how
  often the attributor is right. The evidence here is the code's own
  logic and the schema's own statements about it, which establish what
  each label means and not how often it is correct. A reader who needs an
  error rate does not have one.
- **The `unknown` reasons name an object, not a command.** Ours: `E3`
  says `unreadable_merge_commit` is fixed by fetching the base ref, and
  the other two name a tree rather than a ref, so the fetch that would
  settle them has to be worked out from the sha the record carries. The
  record does not contain that command and this skill does not supply it.
- **`evidence_scheme: repo`.** Every source here is a path and a line
  range into this repository, re-anchored and re-read when it moves.
  There are no claim ids, because Ursa has no claims database.
