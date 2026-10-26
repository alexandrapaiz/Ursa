---
name: excluding-a-file-from-an-outcome-record
description: >
  Use when a whole file is about to be kept out of an outcome record, or
  already was, and someone has to decide whether the refusal is proven,
  declared, or backwards. Fires for reading an entry in `exclusions[]`
  and deciding what its evidence actually establishes, for separating
  `imported_whole` from `declared_import` before quoting either, for
  judging the three `relation` values and the one of them whose claim
  rests on a clock, for reconciling `stats.finalChars` against the
  characters an exclusion removed, for deciding whether a record with no
  `exclusions` key asked the question and came back clean or never
  asked, and for auditing a survival figure that one imported file may
  dominate. Does not fire for choosing which work to resolve or running
  the resolver, for deciding whether an individual span descends from a
  generation or settling an `uncertain` flag, for deciding what
  destroyed a `generated_deleted` span, for deciding what a stored
  percentage is a share of, for the forward walk that decides whether
  surviving text later decayed, for auditing a correction loop or any
  other `signals` block, for turning a record's labels into tuning
  axioms, for adding or changing a bound in the record gate, or for
  deciding what may leave the machine.
version: 0.1.0
status: draft
validated: false
owner_seat: skill
created: 2026-10-26
revised: 2026-10-26
evidence_scheme: repo
evidence:
  - ref: E1
    what: the available fact is per-file and the per-span test is the right backstop and the wrong primary, measured as seven span-level firings in one vendored file plus nine more the length floor could not judge
    source: ursa-major/src/vendored.ts:1-21
  - ref: E2
    what: the test is blob object id equality and the single statement an equal oid proves, from which every survived label on that file is false and not classifying it is the honest answer
    source: ursa-major/src/vendored.ts:23-40
  - ref: E3
    what: why object ids rather than text, where the comparison costs the same on any file size and text comparison would invite the normalization that turns nearly the same into the same
    source: ursa-major/src/vendored.ts:42-49
  - ref: E4
    what: the two relations a blob search can find, pre_existing meaning the episode's net effect was nothing and sibling meaning the content came off another branch
    source: ursa-major/src/vendored.ts:51-60
  - ref: E5
    what: the third relation and the case the blob search structurally cannot see, measured as one file read as 63,362 characters of model output carrying 84.7 percent of a run's headline survival figure, with declared reported under its own reason so a buyer can tell a proof from a statement
    source: ursa-major/src/vendored.ts:62-79
  - ref: E6
    what: why the declaration is a trailer and not a regex over the subject line, refused as central-assessment overreach even though it would have worked on today's history
    source: ursa-major/src/vendored.ts:81-92
  - ref: E7
    what: only the generation and the final commit are asked for a declaration, each voiding a different half of what survived_verbatim means, and descendants are excluded or the test would call every file an import
    source: ursa-major/src/vendored.ts:94-108
  - ref: E8
    what: a path this clone cannot report on is not an import and is not reported as one, the default being to resolve the file, which is the opposite asymmetry from the deletion module's
    source: ursa-major/src/vendored.ts:110-116
  - ref: E9
    what: the stated limitation, that skipping the path drops the generation side with it, so a file the person reverted outright loses a real generated_deleted story the final-side refusal is right to refuse
    source: ursa-major/src/vendored.ts:118-129
  - ref: E10
    what: the empty blob guard, because two unrelated empty files are byte-identical and an emptied file would otherwise be reported as imported from whichever commit last held an empty file there
    source: ursa-major/src/vendored.ts:301-311
  - ref: E11
    what: the declaration is checked ahead of the blob search and short-circuits it, so a path both declared and findable by identity is reported under the weaker evidence, and a null history read continues rather than excluding
    source: ursa-major/src/vendored.ts:338-367
  - ref: E12
    what: the candidate ceiling and the loop that assigns the relation, where the search stops after forty compared blobs and takes the first match in the order git listed the commits
    source: ursa-major/src/vendored.ts:135-143,368-386
  - ref: E13
    what: the two exclusion reasons as the schema states them, deliberately separate because one is byte identity and the other rests on a statement by whoever made the commit, and a buyer who cannot tell them apart cannot price the difference
    source: ursa-major/src/types.ts:1039-1064
  - ref: E14
    what: the exclusion's shape, with the three relations spelled out, the sha the exclusion rests on, and chars stated so the exclusion can be reconciled against the figures it moved
    source: ursa-major/src/types.ts:1066-1100
  - ref: E15
    what: the date field, why only sibling's claim rests on a clock, why pre_existing and declared are exempt, and that an absent date is legal and unchecked because every record before 2026-10-15 has one
    source: ursa-major/src/types.ts:1101-1130
  - ref: E16
    what: the two figures an exclusion moves, finalChars as the total characters across all final files and coveredChars as the part covered by classified spans
    source: ursa-major/src/types.ts:704-708
  - ref: E17
    what: the perFile row a record carries for an excluded path, with excluded present only on such a row and the evidence left in exclusions rather than duplicated
    source: ursa-major/src/types.ts:806-832
  - ref: E18
    what: EXCLUSION_NOT_CLASSIFIED as the gate states it, its three clauses, and its own account of why the file-level mistake is the more expensive one
    source: ursa-major/src/invariants.ts:210-211
  - ref: E19
    what: the bound's code, where a path in both files and exclusions is the refusal computed and not applied, an unreadable date fails on every relation including the exempt ones, and only a dated sibling is ordered against the record's own generatedAt
    source: ursa-major/src/invariants.ts:762-810
  - ref: E20
    what: measure reports excludedPaths, excludedChars and consideredChars as measurements rather than bounds, because a reviewer cannot otherwise tell a record that asked the question from one whose capture path never could
    source: ursa-major/src/invariants.ts:159-181
  - ref: E21
    what: PERFILE_ENUMERATES_PATHS, holding that the rows are exactly the classified paths together with the excluded ones, each once, with exact equality because both directions fail silently
    source: ursa-major/src/invariants.ts:206-207
  - ref: E22
    what: the wiring, where the reason follows the relation rather than being a second judgment, chars is the size of the finished blob, and the fallback zero is written rather than asserted
    source: ursa-major/src/resolve-episode.ts:89-122
  - ref: E23
    what: exclusions are carried onto the record unchanged and omitting them leaves no exclusions key at all, because an empty array would say the question was asked and came back clean
    source: ursa-major/src/resolve.ts:70-83
  - ref: E25
    what: blobOid, where stderr is dropped because a missing path at a given commit is an expected answer rather than a failure worth printing, so every error returns null
    source: ursa-major/src/vendored.ts:198-212
  - ref: E26
    what: declaration, where stderr is dropped and a failure returns a declaration of nothing, and a format git did not expand to three fields also declares nothing because an unreadable clone is not evidence of an import
    source: ursa-major/src/vendored.ts:263-299
  - ref: E24
    what: the audit's own check that a perFile row's excluded reason matches the entry in exclusions for that path, since a live pointer that disagrees is the failure the same-set bound cannot see
    source: ursa-major/src/audit.ts:169-185
supersedes: []
---

# Excluding a file from an outcome record

Every other judgment in this library rules on text the record kept. This
one rules on text the record threw out whole. A file is excluded when
the finished blob at the episode's closing commit is byte-identical to a
blob held somewhere outside the generation's line of descent, or when
the commit that put it there said in its own trailer that it came from
another repository [E2, E5].

The refusal is correct and it is the most expensive judgment in the
record, because it does not move a span. It removes a path from every
figure at once. On this repository's own history one such file carried
84.7 percent of a run's headline survival figure, and the run that
produced that figure could not refuse it [E5].

## When this fires

Five situations.

1. An `exclusions[]` entry is in front of you and its `reason` is about
   to be quoted, summarized, or compared against another record's.
2. A record carries no `exclusions` key and someone is about to read
   that as "nothing was imported."
3. `stats.finalChars` is about to be used as the size of the work, or
   compared against an earlier run's.
4. A survival figure looks unusually high and one file is large.
5. `EXCLUSION_NOT_CLASSIFIED` fired, and the question is whether the
   record or the bound is wrong.

It does not fire for whether an individual span inside a classified file
descends from a generation. That is settled one level down, and the
available fact here is per-file, and the per-span test is the backstop
rather than the primary [E1].

## The procedure

**1. Decide which question the record answered, before reading any
entry.** Three states, and two of them look alike. No `exclusions` key
means the caller never asked: the resolver is a pure function of its
input and exclusions are computed at the edge, so a caller that did not
pass them leaves the key off entirely [E23]. An empty array would have
said the question was asked and came back clean, which is why the code
refuses to write one [E23]. A populated array means the question was
asked and answered. Output: which of the three, named, before anything
else is read.

**2. Read the reason, and do not flatten the two.** `imported_whole` is
a proof: two git blob object ids are equal, which is byte identity and
nothing weaker [E2]. `declared_import` rests on a statement by whoever
made the commit, which is the strongest evidence available for content
whose source is in another repository and is still not a proof [E13].
The schema keeps them apart because a buyer who cannot tell them apart
cannot price the difference [E13]. The proof is an object-id comparison
rather than a text comparison, deliberately, because comparing text
invites normalization and normalization is how "nearly the same" starts
passing for "the same" [E3]. A declaration is read from the generation
commit and the final commit only, each voiding a different half of what
`survived_verbatim` means, so an ancestor's declaration is not evidence
here [E7]. Output: the reason, and the word "proven" or "declared"
beside it.

**3. Read the relation, which is a different field from the reason and
carries different information.** `pre_existing` means the matching
commit is an ancestor, so the episode's net effect on the file was
nothing [E4]. `sibling` means neither ancestor nor descendant, so the
content came off another branch the person merged or checked out rather
than typed [E4]. `declared` means no blob search was run and none would
have succeeded [E14]. The reason is derived from the relation and is not
a second judgment [E22]. Output: the relation, and what it says about
where the content was.

**4. Order the clock, but only on a `sibling`.** A `sibling` exclusion
asserts the finished file is byte-identical to a copy on a branch
outside this work, and if that branch's commit was authored after the
work closed, the copy is a copy *of* this work rather than a source for
it and the refusal is backwards [E15]. `pre_existing` is exempt because
the commit graph vouches for an ancestor whatever a rebase did to its
author date, and `declared` is exempt because it names a commit in
another repository whose clock is not comparable to this one's [E15].
The gate orders a dated `sibling` against `task.generatedAt` and skips
every other relation after the parse [E19]. Output: for a dated sibling,
the comparison against `task.generatedAt`, written out.

**5. Treat an absent date as a true claim and an unreadable one as a
defect.** Absence is legal and unchecked, because every record this
project wrote before 2026-10-15 has exclusions with no date, and the
code omits the field rather than writing an empty string when the clone
cannot answer [E15]. An unreadable date fails on every relation
including the exempt ones, because a field that reads as provenance
wherever it is printed may not state a time nothing can order [E19].
Output: absent, readable, or unreadable, named as such.

**6. Reconcile the characters before quoting any figure.**
`stats.finalChars` is the total characters across all the record's final
files, and `coveredChars` is the part of that covered by classified spans
[E16]. `stats.finalChars` plus the sum of `exclusions[].chars`
is the size of every path the run was willing to read [E14], and
`measure()` reports both sides as `excludedChars` and `consideredChars`
[E20]. Each entry's `chars` is the length of the finished blob at the
closing commit, read there rather than carried from the search [E22]. Output: the two numbers and their sum, with the share the
exclusions removed.

**7. Check that the refusal was applied and not merely computed.** A
path appearing in both `files[]` and `exclusions[]` is a record that
simultaneously calls the file an import and sells labels over its spans
[E18]. The gate checks it as code, pushing a violation that names the
classified spans the record is simultaneously selling over that path
[E19]. The record carries a `perFile` row for an excluded path too,
with `excluded` present only on such a row and the evidence left in
`exclusions[]` rather than duplicated, so `'excluded' in row` is the
test for which kind of row is in hand [E17].
`PERFILE_ENUMERATES_PATHS` holds that the rows are exactly the
classified paths together with the excluded ones, each once [E21], and
the audit separately checks that a row's `excluded` reason matches the
entry for that path [E24]. Output: the four checks, each passed or
failed by name.

**8. Ask what the exclusion cost on the generation side.** The module
states its own limitation: skipping the path drops the generation side
with it, so in the `pre_existing` case where the person reverted the
file outright, the true record is that the agent wrote it and the person
threw all of it away, which is real `generated_deleted` signal the
refusal discards along with the false survival labels [E9]. Output: for
every `pre_existing` exclusion, a note that a discard story was dropped
and is not recoverable from this record.

## Judgment

**The record's two most valuable categories are on opposite sides of
this decision, and that is why it is worth a skill.** `CLAUDE.md` §1
names `no_generation_provenance` the most valuable span class: text in
the finished work that no generation explains. An imported file is
entirely that, and the module says so plainly, that the label would be
true of the whole file and uninformative, for a reason the record would
not state [E2]. Ours: the asymmetry runs both ways and neither direction
is cheap. Excluding a file the person actually wrote destroys the
survival signal in it and, by step 8, the discard signal too. Failing to
exclude an imported file manufactures survival signal out of someone
else's text, which is the failure that already happened here at 84.7
percent of one run's figure [E5]. There is no setting of the dial that
is safe in both directions, so the record carries the evidence and
refuses to collapse it.

**The default is to resolve, and it points the opposite way from the
deletion module's default.** A path whose history git cannot report, or
whose blob cannot be read, is not an import and is not reported as one,
because a hole in a clone is a fact about the clone and dropping real
correction signal over it costs the scarcest thing in the artifact
[E8]. Ours: hold this next to the deletion module's asymmetry, which the
same sentence names as its opposite [E8]. There, silence falls on the
person and manufactures a correction; here, silence falls on the file
and keeps it. Both choices are right and they are right for the same
reason, which is that the error that invents signal is worse than the
error that loses it. A reader who learns one rule as "when in doubt,
refuse" will get the other one backwards.

**An unreadable clone makes the search weaker without making it say
so.** Three separate paths swallow a git failure. `blobOid` returns
null on any error, because a missing path at a given commit is an expected
answer there rather than a failure worth printing [E25]. A null history
read continues rather than excluding, on the stated ground that a clone
which cannot answer is not evidence of an import [E11]. `declaration`
returns a declaration of nothing when its log call fails, and does the
same when git's format did not expand to three fields [E26]. Ours: each is individually correct by the rule above,
and together they mean a record produced on a shallow or partial clone
has fewer exclusions than the same episode would produce on a complete
one, with nothing in the record saying which. `excludedPaths` is
reported precisely so a reviewer can tell a record that asked from one
that could not [E20], and it cannot distinguish a record that asked and
found nothing from one that asked with half its history missing.

**The search is bounded and order-dependent, so a missing exclusion is
not evidence of absence.** The loop compares at most forty candidate
blobs per path and takes the first match in the order git listed the
commits [E12]. Ours: for a path with a long history the fortieth
candidate is a real cutoff, and the `sha` an exclusion names is the
first matching commit the walk reached rather than the earliest or the
most explanatory one. Do not read it as "where the content came from";
read it as "one commit outside the descent that holds the same bytes".

**The declared short-circuit trades evidence for cost, deliberately and
in the honest direction.** A path named in a trailer is reported as
`declared_import` without running the blob search, so a path that is
both declared and findable by identity is reported under the weaker
evidence [E11]. Ours: this is the one place in the module where a
proof available for free is not taken, and the comment says so. It means
`declared_import` is a floor on the evidence rather than a statement
that no proof exists, and a reader wanting the stronger claim has to run
the comparison by hand.

**The trailer is a declaration and not a detection, and the refusal to
regex the subject line is a product decision rather than a technical
one.** Every sync commit in this repository already names its upstream in
prose, so a regex would have worked on today's history, and it is refused
anyway as the central-assessment overreach the fourth principle names
[E6]. Ours: this is the same shape as the rest of Ursa's consent
architecture, where the party who knows says so rather than being
assessed. The practical consequence for a reader is that an undeclared
cross-repository import is invisible to this module by design and not by
oversight, so the absence of a `declared_import` entry says nothing
about whether one was owed.

**The empty-blob guard is the one exclusion that would have been true
and useless.** Two unrelated empty files share an object id, so an
episode that emptied a file would otherwise be reported as having
imported it from whichever commit last happened to hold an empty file
at that path [E10]. Ours: worth knowing because it is the one case where
the byte-identity proof is sound and the conclusion drawn from it is
not, which is a useful reminder of what E2's proof does and does not
carry.

## Limits

- **Span-level descent is out of scope.** Whether a particular span in
  a classified file descends from a generation, and what an `uncertain`
  flag should become, is settled one level down and before this skill is
  reached.
- **Denominators are out of scope.** What a stored percentage is a share
  of is a separate ruling. A prompt that asks both is handled there
  first, because an exclusion's effect on a figure cannot be stated until
  it is known which population the figure covers.
- **Deletion causes are out of scope.** What destroyed a
  `generated_deleted` span is a backward test on merge boundaries, and
  step 8 above hands it the one question this skill raises and does not
  answer.
- **Whether the bound should exist is out of scope.** Adding or changing
  `EXCLUSION_NOT_CLASSIFIED` is a gate question. This skill reads the
  bound and rules on records against it.
- **No measured accuracy.** Ours: nothing in this repository reports how
  often an exclusion is correct. What is measured is one direction of one
  failure, the 84.7 percent figure from the import the module could not
  refuse [E5], and a single incident is not a rate. A reader who needs a
  false-exclusion rate does not have one.
- **The generation-side loss is named, not fixed.** The module files its
  own limitation as a ledger entry and pins it with a test so the cost is
  visible rather than implied [E9]. Until that is answered, step 8 is a
  note a reader writes and not a number the record carries.
- **`evidence_scheme: repo`.** Every source here is a path and a line
  range into this repository, re-anchored and re-read when it moves.
  There are no claim ids, because Ursa has no claims database.
