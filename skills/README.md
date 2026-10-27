# skills/

Ursa's skill library: evidence-backed procedures, "skills with
receipts." Every skill here cites its evidence, and revises when the
evidence changes.

Owned by the skill agent (`prompts/skill-agent.md`). One skill per
run, quality over count. The owner's merge is the gate.

## The library

| Skill | What it decides | Refs | Status |
|---|---|---|---|
| [adjudicating-uncertain-spans](adjudicating-uncertain-spans/SKILL.md) | Whether a span the resolver flagged `uncertain` really descends from a generation, which of the two uncertain queues it is in, and what to retune afterwards | 18 | draft, `validated: false` |
| [running-an-outcome-record-trial](running-an-outcome-record-trial/SKILL.md) | Which finished work to resolve, which capture path it needs, and what the resulting numbers are allowed to mean | 22 | draft, `validated: false` |
| [quoting-a-number-from-an-outcome-record](quoting-a-number-from-an-outcome-record/SKILL.md) | What a record statistic is a share of, and whether two records' numbers may be compared or added | 37 | draft, `validated: false` |
| [distilling-a-tuning-record](distilling-a-tuning-record/SKILL.md) | What an axiom may claim, what its confidence count means, and what may leave the machine with a tuning block | 39 | draft, `validated: false` |
| [adding-a-bound-to-the-record-gate](adding-a-bound-to-the-record-gate/SKILL.md) | Whether a proposed rule about outcome records is a bound or a measurement, how its statement and its committed counterexample are written, and whether a violation means the bound or the resolver is wrong | 32 | draft, `validated: false` |
| [clearing-a-record-for-release](clearing-a-record-for-release/SKILL.md) | Which of the three exits a release is taking, what that exit demands of raw text, and what an erasure has to reach once something has already left | 45 | draft, `validated: false` |
| [auditing-a-detected-correction-loop](auditing-a-detected-correction-loop/SKILL.md) | Whether a detected correction loop is the loop the user actually ran, what `recurrences`, `openedStep`, `closedStep` and `resolution` compute rather than name, and where a complaint the user plainly made went when no signal carries it | 32 | draft, `validated: false` |
| [auditing-a-durability-walk](auditing-a-durability-walk/SKILL.md) | Whether the forward walk behind a `durability` block ran at all, over which window and to which tip, and what `decayRate`, `durableChars`, `fate` and `medianIntactSeconds` compute rather than name | 27 | draft, `validated: false` |
| [attributing-a-deleted-span](attributing-a-deleted-span/SKILL.md) | What destroyed a `generated_deleted` span, whether a zero in `mergeDeletedChars` is a measurement or a default, which of the three `unknownReason` values is in hand and what fetch would settle it, and whether `humanDeletedChars` may be called a discard rate on this clone | 15 | draft, `validated: false` |
| [excluding-a-file-from-an-outcome-record](excluding-a-file-from-an-outcome-record/SKILL.md) | Whether a file-level refusal is proven, declared, or backwards in time, what an absent `exclusions` key says about whether the question was ever asked, how `finalChars` reconciles against the characters an exclusion removed, and whether one imported file is carrying a survival figure | 26 | draft, `validated: false` |

## Eight areas, and the edges between them

```counts
skills: 10
areas: 8
```

Two numbers of different kinds, which is why they sit in a block rather
than in a sentence. `skills` is derived from the directory listing, and
`node skills/trigger-coverage.mjs` measures it and fails on a
disagreement. `areas` is a judgement about where an edge falls, no tool
can derive it, and it is kept by hand on purpose. There are fewer areas
than skills because the first three share one.

The first draft of this paragraph said "the count is in the heading and
nothing checks it", and it meant the areas. The sentence it was in
carried the library's size as well, which is mechanical, so a disclaimer
written about the judgement exempted the derivable number standing beside
it. That is `prompts/skill-extract.md` §5ae's own cause reappearing
inside §5ae's own statement of residue, which is why §5af exists and why
these two numbers are no longer in one sentence. The heading still says
eight, because a heading is prose and the block is what the tool reads.

The first three skills work on `files[].spans` and `stats` inside
`outcome_record.json`. The fourth works on `tuning.json`. The fifth
works on neither: it works on the checker those records are held
against. The sixth works on none of the three: it works on what leaves
the machine. The seventh is back inside the record and still its own
area, because it works on `signals`, which is the one block no span
label and no percentage can settle. The eighth is inside the record
too and is cut by time rather than by object: `durability` and
`spans[].lifespan` are the only blocks computed from what happened
*after* the episode closed, so they are the only ones that can answer
differently tomorrow. Every near miss in
`distilling-a-tuning-record/TRIGGER-TEST.md` and in
`adding-a-bound-to-the-record-gate/TRIGGER-TEST.md` fails by sitting on
the record side of its own edge, which is what `prompts/skill-extract.md`
§5e means by counting artifacts rather than neighbours.

The ninth is inside the record as well and is cut by neither object nor
time. `deletion` sits on `generations[].spans[]` and the three figures
it governs sit in `stats.generated`, so the artifact test puts it with
the record skills and the quoting skill. What separates it is where its
input comes from: every other block of a record is computed from the
record's own inputs, and this one is computed from the git trees of the
merge commits standing between the generation and the closure, by a
function the resolver does not have and the caller injects. It is
therefore the only block that can be absent, defaulted, or wrong
because of the clone rather than because of the work.

The tenth is cut by altitude rather than by object, by time, or by where
the computation came from. `exclusions[]` sits at the top level of
`outcome_record.json`, so the artifact test puts it with the record
skills, and the two figures an exclusion moves sit in `stats`, so it
also overlaps the quoting skill. What separates it is that every other
record skill rules on something *in* the record and this one rules on
whether a path is in the record at all. Its answer does not move a
label. It removes a path from `files[]`, from `coveredChars`, and from
every percentage computed over them at once, which is why the gate's
own bound calls the file-level mistake the more expensive one, and why
a reader who arrives span-first never finds the question: there is no
span to read.

**The record area.** The three are adjacent and share almost all their
vocabulary, so each ships a `TRIGGER-TEST.md` whose near misses include
its siblings' triggers. Read those before adding another skill in this
area.

As of 2026-10-24 every skill in the library does, for every other skill
in the library, which `node skills/trigger-coverage.mjs` measures and
the section below describes. Closing the last nine of those boundaries
turned up the limit of the artifact test: two of
`adjudicating-uncertain-spans`' then five neighbours named no file in
common with it at all, and the boundary with them still had to be written down,
because what they share is the *shape of the judgment* rather than the
object, and a reader matches on shape. A rule about every record and a
departure from the machine are both things a span-adjudication skill can
plausibly be asked to rule on. So §5e is an argument against re-cutting a
skill with many neighbours, and not a licence to skip a near miss for a
neighbour it says does not overlap.

They sit in order along one pipeline. The trial skill chooses what to
resolve and runs it, the adjudication skill settles the labels the
resolver could not, and the quoting skill decides what the resulting
totals may be said to mean. A prompt that spans two of them should be
handled in that order.

**The tuning area.** `distilling-a-tuning-record` runs downstream of
all three, since it begins with a finished record and asks what it
means about the user rather than what happened to the text. A prompt
that spans the edge, for example whether a confidence count may be
quoted in the methods document, is handled record-side first: the
quoting skill rules on the number, then the distilling skill rules on
what the axiom may claim.

**The gate area.** `adding-a-bound-to-the-record-gate` is the first
skill here whose object is code rather than a record:
`ursa-major/src/invariants.ts` and the committed counterexamples under
`ursa-major/fixtures/violations/`. It therefore has every other skill
in the library as a neighbour and is still one edge, between the
records and the thing that checks them. A prompt that spans the edge is handled records-side
first in one direction and gate-side first in the other. Which label a
span carries is never a gate question, because a bound can only catch a
record contradicting itself. Whether a rule about records should exist
at all is never a record question, because no record can say what it
was checked against.

**The release area.** `clearing-a-record-for-release` is the only skill
here whose object is not an artifact at all. It is a boundary: the three
exits by which something derived from a record becomes readable by
someone else, which are the disclosure batch to Ursa Minor, a public
publication, and a person quoting a passage into a document. Two of the
three are governed by opposite rules about raw text, raw text never
crosses the Minor edge and raw text is the whole point of a published
page, and all three are called *disclosure* in the code and in the
prose. So reaching for the nearest check is a live way to be wrong in
either direction, which is the argument the skill is built on.

Still three exits, and since 2026-10-27 one more way to reach the third
of them. The security standard named a screenshot as a surface of its
own, so the skill and its trigger test take it up: a capture of the
viewer carries the prompt text the viewer embeds, and the redaction gate
has never read an image, because it greps with `-I`. The exits did not
grow. What grew is the set of acts that is a quotation without looking
like one.

It has every other skill as a neighbour and still one edge, and the
edge is a handoff rather than a border: the others decide what a record
says, this one decides what may leave with it. Both directions are handled
record-side first, because nothing can be cleared for release until it
is settled what it is. The near miss worth reading is the quoting
skill's own first trigger, since the two share every noun. The line is
mechanical and not a matter of taste: every field under `stats` ships,
so a one-record statistic is never blocked here, and the only number
this skill rules on is an aggregate across contributors, which no single
record carries.

**The signals area.** `auditing-a-detected-correction-loop` is back
inside `outcome_record.json` and is still its own area, which is the
one place in this library where the artifact test alone would have cut
wrong. It shares the file with the three record skills and shares every
noun with all eight siblings. What separates it is which block of the
record it rules on: the others rule on `files[].spans` and on `stats`,
and this one rules on `signals`, the block `deriveSignals` writes after
the labels are settled. No span label and no percentage can answer its
question, because a loop is a fact about the sequence of prompts and
not about any one piece of text.

Its edge is the same handoff shape as the release skill's, counted six
times rather than six different edges, and it runs last of the three
record-side stages: the trial produces the record, adjudication settles
the labels, and only then is there a signals block to audit. Two
directions are worth knowing cold. A number out of `signals` that is
going into a document a reader will trust is a quoting question first,
because this skill says what `recurrences` counts and the quoting skill
says what may be said about it. What a loop implies about the user is a
distilling question, never this one, because the detector is lexical
and deterministic and says nothing about a person. That last point is
the skill's own ref E5, over `ursa-major/src/loops.ts:11-13`; it is
named in longhand here rather than as an `[E5]` tag, because this file
is not inside a skill directory and so no tool in `skills/` would
fingerprint a tag written in it. See "Where a citation may stand".


**The durability area.** `auditing-a-durability-walk` is the second
skill inside `outcome_record.json` whose cut the artifact test cannot
make, and it is a sharper case than the signals area, because its two
blocks are not even the only things it shares. `durability` is a
record-level block of rates, exactly like `stats`, and
`spans[].lifespan` sits on the same spans the first three skills rule
on. By §5e's letter this should be re-cut into them.

What separates it is time rather than object. Every other block of an
outcome record is a function of the episode, computed from the finished
work and the generations behind it, so it is settled the moment the
episode closes and will read the same a year later. `durability` is a
function of the commits that came *after* the closing commit, along
whatever branch was checked out, up to whatever `HEAD` was when the
walk ran. It is the only part of a record that can give a different
answer tomorrow with nothing about the episode having changed, and the
block stores `closingSha` and `tipSha` precisely because of that.

So the order, which matters most against the quoting skill and is the
sharpest boundary in this library. This skill runs **first**, and
decides whether the two walks behind two numbers measured comparable
things: whether anything was tested at all, over which window, and
whether the revision cap or a rename sits underneath. The quoting skill
then decides what may be said about the numbers and whether they may be
combined. The practical test for a reader holding both is whether the
question would survive the answer "those two walks ended at different
commits". If that dissolves the question, it was this skill's.

Against the other eight the edges are ordinary. The trial skill chooses
work whose history can be walked, adjudication settles the classes this
skill's denominator is built from, exclusion decides which paths are in
the walk's population before the walk runs, and the gate, release,
tuning, signals and deletion-cause edges are the same handoff shape
those skills already have, counted five times rather than five
different edges.


**The deletion-cause area.** `attributing-a-deleted-span` is the third
skill whose cut the artifact test cannot make, and it is the first one
cut by provenance of the computation rather than by object or by time.
Its block is `generations[].spans[].deletion`, set only when a
segment's fate is `generated_deleted`, and the three figures it governs
are `humanDeletedChars`, `mergeDeletedChars` and `unknownDeletedChars`
in `stats.generated`.

What it exists for is that `generated_deleted` is the label
`CLAUDE.md` §1 calls the correction, and the resolver cannot see a
cause. It sees that text is absent. A merge between the generation and
the closing commit can have destroyed the text with nobody having read
and rejected it, and a clone that cannot be read produces no answer at
all, so the schema carries three causes rather than one. The errors are
not symmetric and the asymmetry is the argument for the skill: a false
`merge` loses signal, and a false `human_edit` manufactures signal and
sells it.

The boundary that matters is with the quoting skill, and it is the
closest pair in this library, because both rule on the same four
fields. The division is which half of the sentence is in question. The
quoting skill rules on what a number is a share of. This one rules on
whether the numerator names a person at all, which is a question about
whether a git test ran and what it could read. A prompt that spans the
two is handled **quoting-side first**, because a cause cannot be
audited until it is settled which population the figure covers.

Against the durability skill the test is direction across the closing
commit. Durability walks forward over text that survived the episode;
this skill tests backward at merge boundaries inside it, over text that
never reached the finished file. Against the gate the asymmetry is the
usual one with a twist worth knowing: `DELETION_SPLIT_EXACT` holds the
three-way split exact, and it holds on a record every one of whose
deletion figures is a default, because the identity is true by
construction of the subtraction that produces the human share. The
gate is green on exactly the record this skill exists to catch, and no
bound can reach it, because the evidence that settles a cause is a git
tree and no record carries one.


**The exclusion area.** `excluding-a-file-from-an-outcome-record` is
the fourth skill whose cut the artifact test cannot make, and it is the
only one cut by the altitude of its decision. Its object is
`exclusions[]` at the top level of `outcome_record.json`, with
`stats.perFile[].excluded` as the live pointer into it and
`EXCLUSION_NOT_CLASSIFIED` and `PERFILE_ENUMERATES_PATHS` as the two
bounds that hold the two sides together.

What it exists for is the one failure in this library that has already
happened and reached a number. A file arrived in this repository by a
sync commit copying a standard from another company, the resolver read
all 63,362 characters of it as model output and 60,616 as text the
person kept, and the module that refuses imports could not refuse it,
because content imported from a different repository never existed in
this object store for a blob search to find. That single file carried
84.7 percent of that run's headline survival figure. So the skill's
subject is not a schema detail. It is the difference between a survival
number about the model and a survival number about someone else's
prose.

The errors are not symmetric and the asymmetry runs both ways, which is
unusual here and is the reason the skill is worth its own area.
Excluding a file the person actually wrote destroys the survival signal
in it and, by the procedure's own step 8, the discard signal with it.
Failing to exclude an imported file manufactures survival signal out of
text nobody in the episode composed. Both directions are expensive and
neither is the safe default, so the decision cannot be resolved by
picking a direction once.

Three edges are worth stating because a reader will arrive along them.

Against the quoting skill the order is the reverse of the deletion
skill's, and the reversal is not an inconsistency. A deletion cause is
read *out of* a figure, so the figure's population has to be pinned
first and a spanning prompt is handled quoting-side first. An exclusion
*changes* the population, so a spanning prompt is handled
**exclusion-side first**: what a number is a share of cannot be settled
until it is settled which paths are in it.

Against `adjudicating-uncertain-spans` the two run the same clock test
at two grains, and the schema says so. A `sibling` exclusion's author
date ordered against `task.generatedAt` is what `DescentEvidence`'s
`rival` variant carries one level down, and `RIVAL_NOT_AFTER_FINAL` is
the span-level bound to `EXCLUSION_NOT_CLASSIFIED`'s third clause. The
discriminator is the unit the answer moves, a path against a span, and
the cheap version is that a prompt holding a `relation` is this
skill's while a prompt holding a `DescentEvidence` variant is
adjudication's.

Against the gate the asymmetry has a hole in it that no bound can
close. The gate catches a refusal that was computed and then not
applied, because both halves of that contradiction are in the record.
It can never catch a refusal that should have been made and was not,
because no record carries the object store that would settle it. The
most expensive failure in this area is therefore permanently out of the
gate's reach, which is the argument for a skill rather than another
bound.

## Checking the receipts

```
node skills/check-evidence.mjs                     verify
node skills/check-evidence.mjs --update <scope>    re-record what you read
node skills/check-evidence.mjs --base origin/main  verify against that tree
```

It confirms that every source a skill declares exists, that every line
range is in bounds and not inverted, that the body and the evidence
table agree in both directions, and that every cited range still
matches the fingerprint recorded for it in `evidence.lock.json`. A
declared ref that nothing cites fails, which is deliberate: an uncited
ref is a receipt for a claim the skill does not make.

**Which tree the green answer is about.** The first form reads the
working tree, so its exit status is a claim about this branch and
nothing more. `--base <ref>` resolves every cited path out of that ref's
tree instead, which answers the question a reader of the library
actually has: would these citations land on the same lines for someone
whose checkout is `origin/main`. Run it before reporting the library
green, because it finds the ranges a merge is about to move while the
merge can still carry the re-reading, rather than after. It writes
nothing, it refuses `--update` beside it, and on a ref this clone cannot
resolve it exits 2 saying it could not look, since a single-branch clone
resolving nothing would otherwise report every citation missing and read
as the library being broken. The rule is `prompts/skill-extract.md` §5y
and the reason it exists is a tense this seat got wrong in a report.

The fingerprints are the part that earns the word receipts. These
skills cite line ranges in a repository other seats change daily, and
on 2026-10-08 a check found 58 of 117 citations pointing at unrelated
code, with the checker passing throughout because in-bounds was all it
proved. When a fingerprint fails, re-point the anchor and then re-read
the claim against the new lines, since the second does not follow from
the first, and record the fingerprint in the same commit so the lock
diff shows a person decided. `prompts/skill-extract.md` §5g is the rule.

## Whether a skill ever fires

```
node skills/trigger-coverage.mjs           report
node skills/trigger-coverage.mjs --pairs   every ordered pair's score
node skills/trigger-coverage.mjs --check    exit 1 if any boundary is untested
```

The other two guards are about receipts. This one is about the half of a
skill that decides whether it runs at all, which nothing checked until
2026-10-24. `prompts/skill-extract.md` §5c asks every skill for one near
miss per adjacent skill, and adjacency here is every other skill in the
library, so the tool reads every ordered pair of two distinct skills and
asks whether this skill's near misses carry that sibling's own trigger
prompt. It prints the pair count it read rather than this file stating
one: the count is `n(n-1)` and it moved from 30 to 90 while this
sentence said 30, which is the defect `prompts/skill-extract.md` §5ae
rule 2 exists to stop.

The failure it exists to catch is arithmetic rather than carelessness.
The budget is one near miss per neighbour, so landing a sixth skill put
all five already in the library one short, in five files that run's diff
never touched, with both receipt guards green and nothing to say so. When
it was first run the library scored 15 of 30, and the 15 were exactly
rank by age: the oldest skill covered none of its five boundaries and the
newest covered all five, six skills and six distinct values in order with
no ties. The newest looked compliant for the same reason the oldest
looked negligent, which is position in a sequence.

It is green as of 2026-10-24, at 30 of 30, and that is the state to keep
it in. Two mechanics a run adding the seventh skill will meet:

- A near miss has to carry the sibling's **own** prompt, not a
  paraphrase. A paraphrase tests the test's author; the sibling's words
  test the description, which is the half that would actually catch a
  false positive. The tool credits a paraphrase whose prose names the
  sibling, and reports it separately as argued-without-the-prompt.
- A prompt kept outside the two canonical headings has to say "should
  not fire" in its own prose, because that is where the tool reads a
  verdict when there is no heading to inherit from. A prompt that says
  nothing is reported as unclassified rather than guessed at, since a
  near miss filed as a should-fire prompt inflates coverage.

Since 2026-10-27 the same command checks the counts this library states
about itself, in three places: the `counts` block at the head of each
trigger test, the `Refs` column in the table above, and the `skills` key
in the block under "Eight areas". Each is measured from the files and a
disagreement exits 1 with no flag to ask for it, because a published
count that contradicts the library is a falsehood rather than a
judgement a caller can be mid-repair on.

It also refuses one thing rather than measuring it. **A skill body may
not count the library.** A paragraph of a `SKILL.md` that names the
skills as a set states no number; it names the siblings, as slugs. There
is nothing for the tool to compare against, because which subset a
sentence means is a `prompts/skill-extract.md` §5e judgement and no
parser makes it, and there is no need for one, because naming the
members has a determinate repair and leaves a sentence that cannot go
stale. Two of the five paragraphs the rule was written against said a
skill sits across a handoff from the library as it stood the day that
skill landed, wrong by four and by five, while the `neighbours` key in
the same directory was right and checked by this same tool.

Since 2026-10-27 it reads one file outside this directory, which is
`prompts/skill-extract.md`. The two rules above put every markdown file
in `skills/` under an exit status and neither covered the file they are
both written in, and that file states counts of the library too. One
construct there is graded: **a named skill's neighbour count.** A
backticked slug followed by "has", a spelled number and "neighbours" is
the §5c denominator, which the tool already computes, so it is compared
and a disagreement exits 1. That is the whole scope, deliberately. It is
not a prose-number check, because most of that file's numbers are dated
measurements and quotations of other files' prose, and correcting a
quotation would falsify the record of what the quoted file said. §5e's
worked example is what the rule was written against: it said
`distilling-a-tuning-record` has three neighbours, which was the whole
library on 2026-10-05 and is nine now, and §5r had already amended the
argument around it without touching the numbers. See
`prompts/skill-extract.md` §5ag.

## When main moves under the library

```
node skills/relocate-anchors.mjs <old-ref>           show what it would do
node skills/relocate-anchors.mjs <old-ref> --write   do it
```

Most of a drift report is a line number that moved while the lines said
the same thing. Measured twice: 27 of 44 drifted ranges on 2026-10-15,
then 39 of 43 on 2026-10-18. This separates that part from the part that
needs reading. It recovers each drifted range's as-cited lines from
`<old-ref>`, the tree the anchors were written against, which after a
merge is the merge's first parent. It relocates only on a unique match,
and it refuses any range whose lines at `<old-ref>` do not hash to the
recorded fingerprint, because then the ref is wrong and nothing it found
can be trusted.

It carries each relocated fingerprint to its new key rather than calling
`check-evidence.mjs --update`. So after a relocation pass the checker is
still red on exactly the ranges a person has to read, which is the
point. `prompts/skill-extract.md` §5i and §5k.

Then record the ones you read, naming them:

```
node skills/check-evidence.mjs --update <skill-slug|lock-key>...
```

A bare `--update` refuses while any range is drifted, and says which.
It used to re-record the whole library from whatever the tree said,
which on the 2026-10-18 drift batch turned 43 red ranges green with
nobody reading anything and a zero exit status. Ranges outside the scope
you name keep the fingerprint they had, so they stay red rather than
being blessed by a neighbour's update.

```
node --test skills/relocate-anchors.test.mjs
node --test skills/check-evidence.test.mjs
node --test skills/source-line.test.mjs
node --test skills/relevance-sweep.test.mjs
node --test skills/trigger-coverage.test.mjs
node --test skills/library-dirs.test.mjs
```

## Whether a receipt supports its sentence

```
node skills/relevance-sweep.mjs                 the unread refs, least-defended first
node skills/relevance-sweep.mjs <skill>[/<ref>] one ref's dossier
node skills/relevance-sweep.mjs --audited       what has been read, and when
node skills/relevance-sweep.mjs --record <scope>  bind a verdict to what was read
node skills/relevance-sweep.mjs --stale           exit 1 if any verdict is unbound or stale
node skills/relevance-sweep.mjs --signal          every ref's absent-word ratio, beside its verdict
```

`--signal` is the one of these that is not a check. It reports how much of
each `what` field is missing from the lines it cites, which is the signal a
reader uses when no fingerprint can help, and it sets apart the refs where a
single file's range holds none of its claim. Those are mis-anchored until a
reader says otherwise. The threshold and the measurement behind it are in
`relevance-audit.md`, and so is the reason it is a reading rule rather than a
third failure class on `--stale`.

Everything above checks that a citation still points where it pointed. None
of it checks that the lines support the sentence citing them, and a range can
pass every check and fail that, which is why a green `check-evidence` means
the receipts have not moved rather than that they are sound.

The sweep gathers each ref's `what` field, the passages citing it, the cited
lines, and every other ref in the library whose cited lines overlap this
one's, then orders the unread ones by two mechanical signals. The verdicts are
a reader's and live in `relevance-audit.md`, which is also what makes the
sweep resumable: 111 refs is several runs' work.

- First slice, 2026-10-18, 19 refs plus 4 read as a control: one claim false,
  six ranges too narrow for the sentence standing on them.
- Second slice, 2026-10-18, 19 refs: one claim false, seven ranges too narrow,
  eleven sound. 43 of 111 read. The false one was contradicted by another
  skill's ref over the same helper, with both fingerprints green, which is
  what the overlap field exists to surface.
- Third slice, 2026-10-18, 20 refs: no claim false, eight ranges too narrow.
  One of the eight was found by the ref sharing its sentence rather than by
  the ordering, which is where the shared-sentence field comes from.
- Fourth slice, 2026-10-18, 34 refs, closing the rangeable half at 97 of 111:
  two claims false, five ranges widened. The share needing a reader fell from
  a third in slice 1 to a fifth here, which is what reading top-down is for.
- Fifth slice, 2026-10-18, the 14 refs that cited a document and a section
  name rather than lines: two claims false, all fourteen ranged, and two more
  unranged sources found by reading the frontmatter rather than the tool,
  which counted refs where it should have counted sources.

**Closed 2026-10-18: 111 of 111 refs read, six false claims, 26 ranges
widened, 79 sound as cited.** Every ref in the library carries a line range
and a fingerprint. `prompts/skill-extract.md` §5j, §5l, §5m and §5n.

- The fifth skill, 2026-10-18, 32 refs, read as they were written rather than
  in a sweep afterwards, which is §5o's rule stated as a practice. Nine of the
  32 needed a second pass, two claims wrong and seven ranges widened, which is
  28 percent against the sweep's 29. So authoring-time reading did not make
  the first draft of a citation more likely to be right. What it changed is
  that all nine were repaired before the claim was committed, inside one run,
  rather than across five slices afterwards. The verdicts are the author's
  own, which is weaker than a second reader and is stated as such in
  `relevance-audit.md`.

- The sixth skill, 2026-10-24, 41 refs, read in a sweep afterwards because
  the run that wrote them did not read them and reported that it had. Ten of
  the 41 needed a second pass, one claim wrong and nine ranges re-pointed or
  widened, which is 24 percent. Four of the ten are a single cause: anchored
  at line numbers from a revision of `consent.cli.ts` that two commits
  replaced on the day the skill was written, which left three refs sitting on
  the next ref's receipt. Two more were transposed onto each other's sections.
  None of it was visible to `check-evidence.mjs`, because the run never
  recorded a fingerprint; the sweep's absent-word column had flagged five of
  the six at 0.85 or above and nobody was reading it.
  `prompts/skill-extract.md` §5q.

**184 of 184 refs read as of 2026-10-24: 132 sound as cited, 43 ranges
widened, nine claims wrong.** Counted from `relevance-audit.md` rather than
added by hand, taking the latest verdict where a ref was read twice.

## A verdict is only as good as the lines it was read against

A closed sweep is a claim about a day. `relevance.lock.json` is what keeps it
true afterwards: three digests per ref, over the cited lines, the `what`
field, and the passages citing it, beside the verdict and date from the audit
row. When one of the three moves, the ref is read in the audit and stale
here, and `--stale` exits 1 naming which input moved, because a reflowed
passage is a minute of re-reading and a re-pointed range is the whole reading
again.

The digest covers line content and paths, never line numbers, so a
relocation onto identical lines keeps its verdict and a re-point to different
text does not. That matters because most drift is the quiet kind: 27 of 44
ranges on 2026-10-15 and 39 of 43 on 2026-10-18.

This is not what the evidence lock already does. Three failures leave
`check-evidence` green on every range and this red: a `what` field rewritten
under a verdict, a citing passage rewritten under one, and a changed range
re-blessed by `check-evidence --update`, which is the exact act that erases
the signal a re-read is owed. `--record` names its scope for the same reason
`--update` does. `prompts/skill-extract.md` §5o.

The three tools read a `source:` line through one shared pattern,
`skills/source-line.mjs`. It is an allowlist of extensions, because a generic
matcher reads the thresholds `0.35` and `0.6` out of a `what` field and calls
them missing files. The sweep found that the old copy of it could not see
`.gitignore:8-9` at all, so that citation had never been checked.

## Where a citation may stand

A `[E7]` tag is a receipt in any `.md` file of a skill's directory, which
since 2026-10-23 means the trigger test as well as the skill. Before that
date both tools read `SKILL.md` and nothing else, so a tag in a
`TRIGGER-TEST.md` had no fingerprint, no lock row, no place in the dossier of
passages citing that ref, and no way to go red when its range moved. One
draft shipped ten of them with both tools exiting 0.

Two things follow. A ref cited only in a trigger test counts as cited, since
a claim made in the activation test is a claim the skill makes. And writing
such a passage makes that ref stale in `relevance.lock.json`, because a new
sentence standing on a range was not what the verdict was given to.

A tag in a file neither tool reads, a `.json` fixture or a note beside the
skill, is reported as a failure rather than fingerprinted. The fix is to move
the claim into a file a reader would look in. `skills/citing-files.mjs` is the
one place that answers which files count, shared for the reason
`source-line.mjs` is shared: two tools disagreeing about scope leave a ref
half-defended and neither says so. `prompts/skill-extract.md` §5p.

## Which directories count

A directory under `skills/` is part of this library exactly when it holds a
`SKILL.md`. That predicate was implicit in three tools and wrong in all
three at once until 2026-10-26: `skills/decoy-skill/SKILLS.md`, with
correct frontmatter, a declared ref and an `[E1]` tag in its body, passed
`check-evidence.mjs`, `trigger-coverage.mjs` and `relevance-sweep.mjs`,
all at exit 0, one character wrong in one filename. `strayCitations` is
the check written for precisely that and it sits after the `continue` that
skips the directory, so it never ran.

`skills/library-dirs.mjs` is the one place that answers which directories
count, shared for the same reason `citing-files.mjs` and `source-line.mjs`
are. Two guards now report an unread directory by name and
`trigger-coverage.mjs` exits 1 for it without `--check`, since whether this
library is the set of things it says it is was never a judgement a flag
should gate. The `## The library` index above is checked against the
directory listing in both directions by the same tool, which is what closes
the gap that let a skill ship unlisted for three runs.

The rule, and the probe that found it: `prompts/skill-extract.md` §5s.

Nothing renders this library on a web surface yet. `ursa-minor/` has no
skills route, so the receipts are readable only with the repo checked
out. That gap is a ledger entry for the engineer or frontend seat, not
work this seat does (`prompts/skill-extract.md` §6).
