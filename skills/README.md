# skills/

Ursa's skill library: evidence-backed procedures, "skills with
receipts." Every skill here cites its evidence, and revises when the
evidence changes.

Owned by the skill agent (`prompts/skill-agent.md`). One skill per
run, quality over count. The owner's merge is the gate.

## The library

| Skill | What it decides | Refs | Status |
|---|---|---|---|
| [adjudicating-uncertain-spans](adjudicating-uncertain-spans/SKILL.md) | Whether a span the resolver flagged `uncertain` really descends from a generation, which of the two uncertain queues it is in, and what to retune afterwards | 17 | draft, `validated: false` |
| [running-an-outcome-record-trial](running-an-outcome-record-trial/SKILL.md) | Which finished work to resolve, which capture path it needs, and what the resulting numbers are allowed to mean | 22 | draft, `validated: false` |
| [quoting-a-number-from-an-outcome-record](quoting-a-number-from-an-outcome-record/SKILL.md) | What a record statistic is a share of, and whether two records' numbers may be compared or added | 32 | draft, `validated: false` |
| [distilling-a-tuning-record](distilling-a-tuning-record/SKILL.md) | What an axiom may claim, what its confidence count means, and what may leave the machine with a tuning block | 39 | draft, `validated: false` |
| [adding-a-bound-to-the-record-gate](adding-a-bound-to-the-record-gate/SKILL.md) | Whether a proposed rule about outcome records is a bound or a measurement, how its statement and its committed counterexample are written, and whether a violation means the bound or the resolver is wrong | 32 | draft, `validated: false` |

## Three areas, and the edges between them

The first three skills work on `outcome_record.json`. The fourth works
on `tuning.json`. The fifth works on neither: it works on the checker
those records are held against. Every near miss in
`distilling-a-tuning-record/TRIGGER-TEST.md` and in
`adding-a-bound-to-the-record-gate/TRIGGER-TEST.md` fails by sitting on
the record side of its own edge, which is what `prompts/skill-extract.md`
§5e means by counting artifacts rather than neighbours.

**The record area.** The three are adjacent and share almost all their
vocabulary, so each ships a `TRIGGER-TEST.md` whose near misses include
its siblings' triggers. Read those before adding another skill in this
area.

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
`ursa-major/fixtures/violations/`. It therefore has all four others as
neighbours and is still one edge, between the records and the thing
that checks them. A prompt that spans the edge is handled records-side
first in one direction and gate-side first in the other. Which label a
span carries is never a gate question, because a bound can only catch a
record contradicting itself. Whether a rule about records should exist
at all is never a record question, because no record can say what it
was checked against.

## Checking the receipts

```
node skills/check-evidence.mjs                 verify
node skills/check-evidence.mjs --update <scope>  re-record what you read
```

It confirms that every source a skill declares exists, that every line
range is in bounds and not inverted, that the body and the evidence
table agree in both directions, and that every cited range still
matches the fingerprint recorded for it in `evidence.lock.json`. A
declared ref that nothing cites fails, which is deliberate: an uncited
ref is a receipt for a claim the skill does not make.

The fingerprints are the part that earns the word receipts. These
skills cite line ranges in a repository other seats change daily, and
on 2026-10-08 a check found 58 of 117 citations pointing at unrelated
code, with the checker passing throughout because in-bounds was all it
proved. When a fingerprint fails, re-point the anchor and then re-read
the claim against the new lines, since the second does not follow from
the first, and record the fingerprint in the same commit so the lock
diff shows a person decided. `prompts/skill-extract.md` §5g is the rule.

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
```

## Whether a receipt supports its sentence

```
node skills/relevance-sweep.mjs                 the unread refs, least-defended first
node skills/relevance-sweep.mjs <skill>[/<ref>] one ref's dossier
node skills/relevance-sweep.mjs --audited       what has been read, and when
node skills/relevance-sweep.mjs --record <scope>  bind a verdict to what was read
node skills/relevance-sweep.mjs --stale           exit 1 if any verdict is unbound or stale
```

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

**143 of 143 refs read as of 2026-10-23: 102 sound as cited, 33 ranges
widened, eight claims wrong.**

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

Nothing renders this library on a web surface yet. `ursa-minor/` has no
skills route, so the receipts are readable only with the repo checked
out. That gap is a ledger entry for the engineer or frontend seat, not
work this seat does (`prompts/skill-extract.md` §6).
