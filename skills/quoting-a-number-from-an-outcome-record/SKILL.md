---
name: quoting-a-number-from-an-outcome-record
description: >
  Use when a percentage, rate or count taken from an outcome record is
  about to be written into something a reader will trust, such as the
  methods document, a lab brief, a deck, a README or a claim in a
  conversation with a buyer. Fires for deciding what a record statistic
  is a share of, for checking whether two records' numbers can be
  compared or added, for working out why the same product shows two
  different deletion rates, and for auditing a quantitative sentence
  that already exists against the field it cites. Does not fire for
  producing a record, for choosing a trial subject, for deciding
  the label on any individual span, for writing a rule about records
  into the record gate, for a count that comes from a tuning record
  rather than an outcome record, for a trajectory entry the detector
  emitted rather than a statistic the resolver counted, or for deciding
  whether a passage of raw text may be released.
version: 0.4.1
status: draft
validated: false
owner_seat: skill
created: 2026-10-01
revised: 2026-10-24
evidence_scheme: repo
evidence:
  - ref: E1
    what: there are three span classes over the final work and four generation fates, and generated_deleted and not_generated are both fates rather than span classes
    source: ursa-major/src/types.ts:7-10,12-39
  - ref: E2
    what: byClass covers only the three span classes, and each class carries two percentages, pct over coveredChars and pctOfFinal over finalChars
    source: ursa-major/src/stats.ts:8-12,70-71
  - ref: E3
    what: the schema says coveredChars excludes text no span covers, and reports it separately from finalChars
    source: ursa-major/src/types.ts:656-661
  - ref: E4
    what: in code mode a span is a trimmed non-empty line, so indentation and blank lines are never covered by any span
    source: ursa-major/src/segment.ts:21-33
  - ref: E5
    what: segmentation mode is chosen by file extension, prose for md, mdx, markdown, txt and tex, code for everything else
    source: ursa-major/src/segment.ts:13-15
  - ref: E6
    what: deletedPct is deleted generated chars over total generated chars, a different population from the final work, and its numerator subtracts not_generated chars while humanDeletedPct narrows it again, and survivalRate divides by the same generated-chars denominator per generation and per conversation
    source: ursa-major/src/stats.ts:92-95,119-126,130-139,165-171, ursa-major/src/resolve.ts:577
  - ref: E7
    what: the viewer renders the three class tiles and the deleted tile in one row, while the distribution bar below holds only the three
    source: ursa-major/src/viewer.ts:234-266,277-286
  - ref: E8
    what: a below-threshold best match is labelled no_generation_provenance and flagged uncertain, so it sits inside that category's chars
    source: ursa-major/src/resolve.ts:465-520, ursa-major/src/match.ts:7-8
  - ref: E9
    what: a short raw-exact match is labelled survived_verbatim with score 1 and flagged trivial so it sits inside that category's chars, unless the descent check demotes it, which drops the trivial flag
    source: ursa-major/src/resolve.ts:380-393,233-272, ursa-major/src/match.ts:9-10
  - ref: E10
    what: residue with no match at all gets the same no_generation_provenance label as an uncertain span
    source: ursa-major/src/resolve.ts:481-512
  - ref: E11
    what: uncertainSpans and trivialSpans are span counts, and no char total is computed for either
    source: ursa-major/src/types.ts:662-663, ursa-major/src/stats.ts:36-37,54-55
  - ref: E12
    what: CLAUDE.md lists all four classifications under one heading and calls no_generation_provenance the most valuable
    source: CLAUDE.md:65-70 (section 1, span classifications)
  - ref: E13
    what: KR1.1 puts 55 uncertain spans in task-001 and requires the thresholds retuned to a false-positive rate of 10 percent or lower
    source: docs/okrs/2026-q4.md:13-18 (O1 KR1.1)
  - ref: E14
    what: turnsToAcceptance is documented as the latest assistant turn that contributed surviving text, and computed as a max over generations with any surviving chars
    source: ursa-major/src/types.ts:793-794, ursa-major/src/stats.ts:132,140-142
  - ref: E15
    what: both the CLI summary and the viewer table label that field turns-to-acceptance
    source: ursa-major/src/cli.ts:184, ursa-major/src/viewer.ts:570,580
  - ref: E16
    what: CLAUDE.md lists turns to acceptance as trajectory metadata wrapped around the record
    source: CLAUDE.md:72-74 (section 1, trajectory metadata)
  - ref: E17
    what: byModel counts only spans that carry a source, over a denominator that includes spans that carry none
    source: ursa-major/src/stats.ts:47-61,154-159
  - ref: E18
    what: path-filter drops generations at parse time, before any denominator is computed
    source: ursa-major/src/parse.ts:146, ursa-major/src/cli.ts:58,119
  - ref: E19
    what: the record carries a finished flag, set false by --abandoned, and the viewer shows it as a chip
    source: ursa-major/src/cli.ts:52, ursa-major/src/resolve.ts:585, ursa-major/src/viewer.ts:180
  - ref: E20
    what: the CLI prints finalChars and coveredChars on one line, and gives every class both an of-final and an of-classified column
    source: ursa-major/src/cli.ts:167-172
  - ref: E21
    what: the methods document's own limit, n=1 demonstrates label types rather than statistics and every quantitative claim is an existence proof
    source: docs/beyond-preference-pairs.md:157-160
  - ref: E22
    what: 82.1 percent of generated characters in task-001 were deleted, and that category is where the spec was forged
    source: docs/beyond-preference-pairs.md:111-126
  - ref: E23
    what: session capture carries the trace and git capture carries the label, 82 percent against 7 percent, and a record should state which stage of the funnel it measured
    source: docs/beyond-preference-pairs.md:232-240
  - ref: E24
    what: KR2.1 requires every quantitative claim in the methods document re-grounded in the n>=5 corpus and published by November 30
    source: docs/okrs/2026-q4.md:37-40 (O2 KR2.1)
  - ref: E25
    what: KR1.3 requires five or more records with at least two on the prose path, and says nothing about the other three
    source: docs/okrs/2026-q4.md:28-32 (O1 KR1.3)
  - ref: E26
    what: KR4.1 requires a lab brief naming the four span classes and what a buyer can audit
    source: docs/okrs/2026-q4.md:76-78 (O4 KR4.1)
  - ref: E27
    what: Ursa must always be able to quote a scalar, and every lab-facing deliverable reduces to survival rates with confidence
    source: docs/beyond-preference-pairs.md:204-209
  - ref: E28
    what: the cross-model claim is a ratio of survival rates on the same user's work, which is a relative price between models
    source: docs/beyond-preference-pairs.md:192-196
  - ref: E29
    what: every row of every corpus carries step ordinals joining to generations and prompts, so a buyer can audit any label back to the raw generation and the user's verbatim words
    source: docs/beyond-preference-pairs.md:151-155
  - ref: E30
    what: matching is deliberately lexical and deterministic so every label is explainable from the functions and the two thresholds alone
    source: ursa-major/src/match.ts:1-3
  - ref: E31
    what: the Pretence principle, systems built on claims of sufficient information conform to the measure rather than the world
    source: docs/vision.md:33-35 (section 0b, principle 4)
  - ref: E32
    what: survived_verbatim means byte-identical as of 2026-10-13, and a formatting-only match is now survived_mutated with normalizedOnly set and score 1, which 26 of 770 verbatim claims over ten records of this repository were
    source: ursa-major/src/types.ts:396-427, ursa-major/src/resolve.ts:275-299, ursa-major/src/resolver.test.ts:168
  - ref: E33
    what: noCandidate names which of four things produced a no_generation_provenance span, and df_cutoff_suppressed is the value that reports the matcher never looked rather than anything about the work
    source: ursa-major/src/types.ts:435-451, ursa-major/src/resolve.ts:488-507
  - ref: E34
    what: Stats carries blindSpans and suppressedTokenSpans as span counts, blindSpans being the df-cutoff-suppressed spans and suppressedTokenSpans a superset that were mostly scored anyway
    source: ursa-major/src/types.ts:664-693, ursa-major/src/stats.ts:56-57
  - ref: E35
    what: blindSpans and notGeneratedChars are both optional and both read as zero when absent, and the schema says absence means a true zero for one and an unknowable value for the other
    source: ursa-major/src/types.ts:678-683,724-727
  - ref: E36
    what: the CLI prints the blind-span line only when the count is non-zero, and its own wording says those spans are counted as no_generation_provenance and should not be
    source: ursa-major/src/cli.ts:173-181
  - ref: E37
    what: the cutoff is an absolute count against a corpus that grows, so the blind share can only grow with it, which makes a rise between two records the signal rather than the level in any one, and both of this project's trials sit where the figure is zero
    source: ursa-major/src/types.ts:453-468
supersedes: []
---

# Quoting a number from an outcome record

## When this fires

A number has come out of a record, by way of `outcome_record.json`, the
CLI summary or the viewer, and it is about to be written somewhere a
reader will take on trust. That is the situation. Typical shapes: a
percentage going into `docs/beyond-preference-pairs.md`, a figure on a
slide, a rate quoted to a buyer, or an existing sentence being audited
against the field it cites.

It fires hardest when two numbers are about to sit next to each other,
because almost every error this skill catches is an error of
comparison rather than of arithmetic. Adding two percentages, comparing
two records, or reading a change over time are the three moments where
a record's denominators stop agreeing.

It does not fire for producing a record, for choosing a subject, or for
deciding the label on a span. Those are the two sibling skills. This
one starts after the labels are settled and asks only what the totals
are allowed to say.

The standard this serves is not editorial. KR2.1 requires every
quantitative claim in the methods document to be re-grounded in the
n>=5 corpus before publication [E24], and KR4.1 requires a lab brief
that tells a buyer what they can audit [E26]. A buyer who audits a
number and finds it means something narrower than the sentence claimed
has found the one defect that cannot be repaired by a correction,
because the thing being sold is auditability itself.

## The procedure

**1. Find the field, not the printout.** Open
`outcome_record.json` and locate the actual field behind the number.
The CLI prints `finalChars` and `coveredChars` on one line and gives
every class two columns, one of final and one of classified [E20].
That is a change since this skill was first written, and it is the
engineer's fix for the denominator defect this skill reported. Read
the field anyway: the console now tells you which denominator each
column used, but only the record names the field, and a number quoted
from a screenshot carries neither. Output: the
field path, such as `stats.byClass.survived_verbatim.pct` or
`stats.generated.deletedPct`.

**2. Name the population the denominator is drawn from.** There are
two, and they are not the same set of characters. Everything in
`byClass` now carries both percentages: `pct` over `coveredChars`, and
`pctOfFinal` over `finalChars` [E2]. Both are final-work text, and
which one a sentence means is the whole question.
`deletedPct` is divided by total generated chars, which is model output
text [E6]. Its numerator is narrower than "everything that did not
survive". Since 2026-10-14 it is total generated chars less the
survived chars and less the `not_generated` chars, so text the file
already held is subtracted out of the numerator while remaining in the
denominator [E6]. The record also reports `humanDeletedPct` beside it,
which narrows the numerator again to the deletions no mechanical cause
explains [E6]. Quote whichever of the two you mean by name, because
"deleted" alone no longer picks out one of them. Output: one sentence of the form "this is a share of X",
where X is either covered final characters or generated characters.

**3. Decide whether the number is a share of the work or a share of the
covered work.** `coveredChars` excludes every character no span covers,
and the schema says so in its own comment [E3]. In code mode a span is
a trimmed non-empty line, so indentation and blank lines belong to no
span and enter no denominator [E4]. Mode is chosen by file extension
[E5]. Output: either the claim is rewritten to say "of classified
text", or `finalChars` is quoted alongside so the reader can see the
gap.

**4. Subtract the flagged populations, or declare that you did not.**
Two flags put low-confidence spans inside ordinary categories. A
below-threshold best match is labelled `no_generation_provenance` and
flagged `uncertain` [E8]. A short exact match is labelled
`survived_verbatim` with a score of 1 and flagged `trivial`, but only
when the raw characters agree and the descent check does not refuse it.
A short match whose text the file already held at the parent commit is
demoted to `no_generation_provenance` with `uncertain` set, and the
demotion drops the `trivial` flag rather than carrying it over [E9].
So `trivial` still marks weak evidence inside `survived_verbatim`, and
it no longer marks every short exact match. A
span with no match at all receives exactly the same
`no_generation_provenance` label as an uncertain one [E10]. There is now
a third flag, and it moves in the other direction. `normalizedOnly`
marks a `survived_mutated` span whose text is identical to its
generation extent after case folding, punctuation folding and
whitespace collapsing, and differs in raw characters only [E32]. It
carries `score: 1` like a verbatim match, so a filter written on the
score alone will not separate them [E32]. Neither
flag has a character total in the schema, only a span count [E11], so
the subtraction has to be done from `files[].spans` directly.

There is a fourth population and it is the one to subtract first,
because it is the only one that is not a fact about the work at all. A
`no_generation_provenance` span now carries `noCandidate`, which says
which of four things produced the label, and one of the four values is
`df_cutoff_suppressed`: at least one word of the span is in the
generation corpus, every word that is was skipped for being too common
to search on, and so the matcher never scored the span before labelling
it [E33]. `Stats` counts those as `blindSpans`, beside a wider
`suppressedTokenSpans` for spans that lost some of their words to the
cutoff and were scored on the rest [E34]. The CLI says what it thinks
of them in its own output, that they "are counted as
no_generation_provenance and should not be" [E36]. Output: the
`no_generation_provenance` figure with `blindSpans` subtracted, or the
count quoted beside it.

Ours, on why this one is worth the extra sentence rather than being one
more flag in a list. The other three flags move a span between two
honest readings of the same evidence. This one moves work the model may
well have written into the category CLAUDE.md calls the most valuable
[E12], and the schema says the direction is not an accident: the
cutoff is an absolute count against a corpus that grows every time the
tool runs, so the blind share can only grow with the dataset [E37].
That makes it the one number here whose level in a single record is
almost uninformative and whose movement between two records of the same
project is the whole signal [E37]. Both of this project's trials sit at
the scale where it is zero [E37], which is also why a reader who
learned the output format from a trial transcript has never seen the
line that reports it [E36]. Output: either an adjusted figure with its
method stated, or the sentence carries the flag counts beside the
percentage.

**5. State the capture path and the funnel stage.** Session capture
carries the trace and git capture carries the label, which is why the
same product produced 82 percent deletion on one path and 7 percent on
the other, and the methods document already requires a record to say
which stage of the funnel it measured [E23]. Output: the path named in
the sentence, not in a footnote.

**6. State what was excluded before the denominator was formed.**
`--path-filter` drops generations during parsing, which is upstream of
every total [E18]. Output: the filter value, or an explicit note that
none was applied.

**7. Check the finished flag.** The record carries `finished`, set
false by `--abandoned`, and the viewer shows it as a chip [E19]. A
deletion rate from abandoned work and one from finished work are
different quantities wearing one name. Output: finished or abandoned,
said out loud.

**8. Read the field's definition, not its label.** `turnsToAcceptance`
is documented as the latest assistant turn that contributed surviving
text, and it is computed as a maximum over the generations that have
any surviving characters at all [E14]. Both the CLI and the viewer
label it turns-to-acceptance [E15], and CLAUDE.md lists turns to
acceptance as trajectory metadata [E16]. One surviving character in a
late generation sets this field, so it is an upper bound on where
surviving text came from rather than a count of turns the user needed.
Output: the sentence says what the field computes, or the field is not
quoted.

**9. Attach the audit path.** Every corpus row carries step ordinals
that join to generations and to the user's verbatim words [E29], and
matching is lexical and deterministic precisely so that any label can
be explained from the functions and the two thresholds [E30]. Output:
the sentence names the field and the record, so a reader can reach the
spans behind it.

**10. Say what n is and what n does not support.** The methods
document's own limit is that n=1 demonstrates label types rather than
statistics, and that every quantitative claim in it is an existence
proof [E21]. Output: the claim is marked as an existence proof, or it
is held until the corpus supports it.

**11. An absent optional field is not a zero, and two of them disagree
about what absence means.** `blindSpans` and
`generated.notGeneratedChars` are both declared optional and both
documented as read-as-zero when absent, so they look like the same kind
of field and a reader who learns the rule from one will apply it to the
other. The schema says they are opposites. For `notGeneratedChars`,
every record written before 2026-10-14 omits it and zero is the true
value for those records, because no descent gate ran on them and no
segment of them could carry the fate. For `blindSpans`, every record
written before 2026-10-24 omits it and zero is wrong but unknowable,
because the cutoff was always suppressing tokens and nothing counted
them [E35]. Output: before quoting either field at zero, check whether
the record predates it, and quote "not measured" rather than zero where
it does.

Ours: the general form is that optionality in this schema is a
statement about when a field was added and not about whether its
subject occurred, so the question to ask of any absent field is which
of those two the author meant. The schema answers it in prose each
time, which is the only reason this is checkable, and it is a good
argument for reading the field's comment rather than its type.

## Judgment

**Four tiles, three denominators.** The schema has three span classes
over the final work, and `generated_deleted` is not one of them. It is
a generation fate [E1], which follows from what the classes describe: a
deleted generation leaves no text in the finished work for a span to
cover. The two vocabularies have since drifted further apart rather
than closer together. A fourth generation fate, `not_generated`, was
added on 2026-10-14 for a segment that sits inside a generation's text
but that the file already held at the generation's parent commit, so it
is neither survival nor deletion [E1]. There are now three span classes
and four generation fates, and no sentence should use a word from one
vocabulary against a denominator from the other. The viewer nonetheless draws the three classes and the deleted
figure as four tiles in one row, and then draws a distribution bar
underneath that contains only the three [E7]. The tiles and the bar
disagree about how many categories there are, and the tiles are the
ones a reader screenshots. The three class percentages do sum to one.
The fourth number is a share of a different population entirely
[E2, E6], so the four do not partition anything and must never be
presented as though they do. Since this skill was written the deleted
tile also changed numerator: it headlines the human's own discard
rather than the gross figure, because a merge can destroy generated
text with nobody reading it [E7]. That makes the tile more honest and
the arithmetic no more additive.

This matters beyond the viewer, because KR4.1 asks the lab brief to
explain the four span classes [E26] and CLAUDE.md presents all four
under one heading [E12]. The honest version of that explanation is that
the taxonomy has two sides. Three classes describe what happened to the
finished work, one fate describes what happened to a generation, and
the two are counted over different populations. A brief that presents
four commensurable percentages to a buyer will not survive the buyer's
first audit.

Ours: this is hardest to notice on the only public fixture, because
there the two denominators nearly coincide. Covered final chars come
to 308 and total generated chars to 307, so the four tiles look
commensurable and a reader checking the arithmetic finds nothing wrong.

```
cd ursa-major && npx tsx src/cli.ts --id fix-mini \
  --final fixtures/mini/final.md \
  --conversations fixtures/mini/conversations --out /tmp/rec
```

**The coverage gap is larger for code than for prose, so it biases
exactly the comparison the corpus is built to make.** KR1.3 requires
five or more records with at least two on the prose path [E25]. Ours:
it requires no code record, so a mixed corpus is what to expect and not
what the key result guarantees, and the bias below is the thing to check
for once the mix exists. Because code
spans are trimmed lines [E4] and prose spans are sentences [E5], the
fraction of a file that enters no denominator is systematically larger
for code.

Ours: measured on this repository, code files leave 6 to 14 percent of
their characters uncovered and prose files leave 2 to 3 percent.
`src/stats.ts` is 13.6 percent uncovered, `src/types.ts` 9.6 percent,
`src/match.ts` 6.1 percent, `docs/beyond-preference-pairs.md` 2.7
percent, and `fixtures/mini/final.md` 1.9 percent.

```
cd ursa-major && cat > /tmp/cov.mjs <<'EOF'
import { readFileSync } from 'node:fs'
import { segment, modeForPath } from './src/segment.ts'
for (const p of process.argv.slice(2)) {
  const text = readFileSync(p, 'utf8')
  const covered = segment(text, modeForPath(p)).reduce((a, s) => a + (s.end - s.start), 0)
  console.log(p, modeForPath(p), text.length, covered, (100 * (1 - covered / text.length)).toFixed(1) + '% uncovered')
}
EOF
npx tsx /tmp/cov.mjs src/stats.ts src/types.ts src/match.ts \
  ../docs/beyond-preference-pairs.md fixtures/mini/final.md
```

The consequence is that a cross-record difference of a few points
between a code record and a prose record can be an artifact of
segmentation rather than a fact about the model. Compare like modes, or
quote `finalChars` so the reader can see what was left out.

**Both flags inflate in the commercially convenient direction, which is
why neither can be left silent.** `uncertain` adds below-threshold
spans to `no_generation_provenance` [E8], the category CLAUDE.md calls
the most valuable [E12]. `trivial` adds weak short matches to
`survived_verbatim` [E9], the category that reads as the model doing
well. In task-001 the uncertain population is 55 spans and KR1.1 exists
to adjudicate them [E13], so this is not hypothetical, and until that
adjudication lands a `no_generation_provenance` share is an upper bound
rather than a measurement. A seat quoting it without saying so has
produced the exact failure the Pretence principle names, a system
conforming to its measure rather than to the world [E31].

**"Verbatim" changed meaning on 2026-10-13, so a survival figure is not
comparable across that date.** `survived_verbatim` now means
byte-identical. Before that date a match made in the normalized shadow
text earned the same label with the same `score: 1`, so a reflowed line,
a changed capital or an em dash retyped as a hyphen all counted as the
model's text surviving untouched [E32]. The size of the correction is
measured rather than estimated: over ten records of this repository's own
history, 26 of 770 verbatim claims, covering 1,466 characters, were
claims of that kind [E32].

Ours: two consequences, and the second is the one that will embarrass
somebody. Any `survived_verbatim` percentage computed before 2026-10-13
is an upper bound against the current definition, so a trend line drawn
through that date is measuring a schema change and reporting it as a
change in model behaviour. And the spans did not disappear, they moved
into `survived_mutated`, which is the category Ursa sells as "the
mutation is the correction". A formatting-only reflow is not a
correction in that sense. So when quoting a mutation rate as evidence of
what users fix, filter `normalizedOnly` out and say that you did,
because the record deliberately refuses to choose between the three
defensible readings of those spans and leaves the choice to whoever
quotes it [E32].

**Quote a scalar, and quote the one the record computes.** The
discipline the methods document imposes is that every lab-facing
deliverable reduces to survival rates with confidence [E27], and that
is a reason to prefer the simple number, not a licence to improvise it.
`survivalRate` is computed per generation and per conversation on a
generated-chars denominator [E6], which makes it the right scalar to
quote and a different quantity from any `byClass` percentage.

**The cross-model ratio needs the denominators to agree.** The
cross-model claim is a ratio of survival rates on the same user's work
[E28]. That holds only when both models' generations were captured on
the same path and under the same filter, because `--path-filter` has
already changed each denominator before the ratio is formed [E18].
`byModel.pctOfCovered` does not give this ratio and is not a
substitute for it. It counts only spans carrying a source, over a
denominator that includes spans carrying none [E17], so the model
shares never sum to one and the remainder is the unattributed category.

Ours: on the fixture those shares are 46.8 percent and 18.5 percent,
summing to 65.3 percent, and the missing 34.7 percent is exactly the
`no_generation_provenance` share. The gap is not a rendering rounding
error, it is a category.

**A number that moved because the resolver moved is not a finding about
a model.** KR1.1 retunes the two thresholds to hit a false-positive
target [E13], and the thresholds are what sort spans between
`survived_mutated`, uncertain and residue [E8, E30]. Every stored class
percentage is therefore a function of a resolver version as much as of
a model. Any claim comparing records across the retune has to name the
threshold values it was computed under, or it is comparing two
measuring instruments and reporting the difference as news.

**Deletion is not waste, and the sentence has to carry that.** Task-001
deleted 82.1 percent of generated characters, and the methods document
holds that this is the constitutive category, the place where the spec
was forged [E22]. A high deletion rate quoted without that reading
invites a buyer to hear it as model failure, which both understates the
product and misdescribes the data.

## Limits

This skill covers totals and their denominators. It does not decide any
individual label, which is `adjudicating-uncertain-spans`, and it does
not choose what to resolve or how, which is
`running-an-outcome-record-trial`.

Its evidence is the resolver as it stands on this branch. Every
denominator claim here would need rechecking after resolver v2, since
that work changes how spans are sorted between classes [E13].

The flag subtraction in step 4 has no supported arithmetic behind it.
The schema carries span counts for `uncertain` and `trivial` and no
character totals [E11], so an adjusted percentage has to be derived by
hand from `files[].spans`, and nothing in the repository checks that
derivation. This is a schema gap recorded in the ledger, not a solved
problem.

Ours: the procedure has not been run against a real multi-file record.
The trial records live in a private repository, so the measurements
above come from `fixtures/mini` and from this repository's own source
files. Numbers taken from a record with many files and real uncertain
spans may expose steps this skill does not have.

Nothing here validates a claim about users, satisfaction or acceptance
as experienced. Acceptance is declared by the owner and never inferred,
and no statistic in `stats` carries that declaration.
