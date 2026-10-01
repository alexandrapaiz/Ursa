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
  producing a record, for choosing a trial subject, or for deciding
  the label on any individual span.
version: 0.1.0
status: draft
validated: false
owner_seat: skill
created: 2026-10-01
revised: 2026-10-01
evidence_scheme: repo
evidence:
  - ref: E1
    what: there are three span classes over the final work, and generated_deleted is a generation fate rather than a span class
    source: ursa-major/src/types.ts:5-14
  - ref: E2
    what: byClass covers only the three span classes, and every pct in it is divided by coveredChars
    source: ursa-major/src/stats.ts:7-11,51
  - ref: E3
    what: the schema says coveredChars excludes text no span covers, and reports it separately from finalChars
    source: ursa-major/src/types.ts:112-117
  - ref: E4
    what: in code mode a span is a trimmed non-empty line, so indentation and blank lines are never covered by any span
    source: ursa-major/src/segment.ts:21-33
  - ref: E5
    what: segmentation mode is chosen by file extension, prose for md, mdx, markdown, txt and tex, code for everything else
    source: ursa-major/src/segment.ts:13-15
  - ref: E6
    what: deletedPct is deleted generated chars over total generated chars, a different population from the final work
    source: ursa-major/src/stats.ts:53-54,86-91
  - ref: E7
    what: the viewer renders the three class tiles and the deleted tile in one row, while the distribution bar below holds only the three
    source: ursa-major/src/viewer.ts:147-176
  - ref: E8
    what: a below-threshold best match is labelled no_generation_provenance and flagged uncertain, so it sits inside that category's chars
    source: ursa-major/src/resolve.ts:160-167, ursa-major/src/match.ts:7-8
  - ref: E9
    what: a short exact match is labelled survived_verbatim with score 1 and flagged trivial, so it sits inside that category's chars
    source: ursa-major/src/resolve.ts:111-123, ursa-major/src/match.ts:9-10
  - ref: E10
    what: residue with no match at all gets the same no_generation_provenance label as an uncertain span
    source: ursa-major/src/resolve.ts:170
  - ref: E11
    what: uncertainSpans and trivialSpans are span counts, and no char total is computed for either
    source: ursa-major/src/types.ts:118-119, ursa-major/src/stats.ts:25-26,41-42
  - ref: E12
    what: CLAUDE.md lists all four classifications under one heading and calls no_generation_provenance the most valuable
    source: CLAUDE.md, section 1, span classifications
  - ref: E13
    what: KR1.1 puts 55 uncertain spans in task-001 and requires the thresholds retuned to a false-positive rate of 10 percent or lower
    source: docs/okrs/2026-q4.md, O1 KR1.1
  - ref: E14
    what: turnsToAcceptance is documented as the latest assistant turn that contributed surviving text, and computed as a max over generations with any surviving chars
    source: ursa-major/src/types.ts:139-140, ursa-major/src/stats.ts:68-70
  - ref: E15
    what: both the CLI summary and the viewer table label that field turns-to-acceptance
    source: ursa-major/src/cli.ts:135, ursa-major/src/viewer.ts:340
  - ref: E16
    what: CLAUDE.md lists turns to acceptance as trajectory metadata wrapped around the record
    source: CLAUDE.md, section 1, trajectory metadata
  - ref: E17
    what: byModel counts only spans that carry a source, over a denominator that includes spans that carry none
    source: ursa-major/src/stats.ts:43-46,80-85
  - ref: E18
    what: path-filter drops generations at parse time, before any denominator is computed
    source: ursa-major/src/parse.ts:130, ursa-major/src/cli.ts:46,97
  - ref: E19
    what: the record carries a finished flag, set false by --abandoned, and the viewer shows it as a chip
    source: ursa-major/src/cli.ts:40, ursa-major/src/resolve.ts:204, ursa-major/src/viewer.ts:143
  - ref: E20
    what: the CLI prints covered final chars and the class percentages, and never prints finalChars
    source: ursa-major/src/cli.ts:128-134
  - ref: E21
    what: the methods document's own limit, n=1 demonstrates label types rather than statistics and every quantitative claim is an existence proof
    source: docs/beyond-preference-pairs.md:154-157
  - ref: E22
    what: 82.1 percent of generated characters in task-001 were deleted, and that category is where the spec was forged
    source: docs/beyond-preference-pairs.md:108-123
  - ref: E23
    what: session capture carries the trace and git capture carries the label, 82 percent against 7 percent, and a record should state which stage of the funnel it measured
    source: docs/beyond-preference-pairs.md:229-237
  - ref: E24
    what: KR2.1 requires every quantitative claim in the methods document re-grounded in the n>=5 corpus and published by November 30
    source: docs/okrs/2026-q4.md, O2 KR2.1
  - ref: E25
    what: KR1.3 requires five or more records with at least two on the prose path, so the corpus deliberately mixes prose and code
    source: docs/okrs/2026-q4.md, O1 KR1.3
  - ref: E26
    what: KR4.1 requires a lab brief naming the four span classes and what a buyer can audit
    source: docs/okrs/2026-q4.md, O4 KR4.1
  - ref: E27
    what: Ursa must always be able to quote a scalar, and every lab-facing deliverable reduces to survival rates with confidence
    source: docs/beyond-preference-pairs.md:201-206
  - ref: E28
    what: the cross-model claim is a ratio of survival rates on the same user's work, which is a relative price between models
    source: docs/beyond-preference-pairs.md:189-193
  - ref: E29
    what: every row of every corpus carries step ordinals joining to generations and prompts, so a buyer can audit any label back to the raw generation and the user's verbatim words
    source: docs/beyond-preference-pairs.md:148-152
  - ref: E30
    what: matching is deliberately lexical and deterministic so every label is explainable from the functions and the two thresholds alone
    source: ursa-major/src/match.ts:1-3
  - ref: E31
    what: the Pretence principle, systems built on claims of sufficient information conform to the measure rather than the world
    source: docs/vision.md, section 0b, principle 4
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
The CLI prints covered final chars and the class percentages and never
prints `finalChars` at all [E20], so a number read off the console has
already lost the information you need to interpret it. Output: the
field path, such as `stats.byClass.survived_verbatim.pct` or
`stats.generated.deletedPct`.

**2. Name the population the denominator is drawn from.** There are
two, and they are not the same set of characters. Everything in
`byClass` is divided by `coveredChars`, which is final-work text [E2].
`deletedPct` is divided by total generated chars, which is model output
text [E6]. Output: one sentence of the form "this is a share of X",
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
`survived_verbatim` with a score of 1 and flagged `trivial` [E9]. A
span with no match at all receives exactly the same
`no_generation_provenance` label as an uncertain one [E10]. Neither
flag has a character total in the schema, only a span count [E11], so
the subtraction has to be done from `files[].spans` directly. Output:
either an adjusted figure with its method stated, or the sentence
carries the flag counts beside the percentage.

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

## Judgment

**Four tiles, three denominators.** The schema has three span classes
over the final work, and `generated_deleted` is not one of them. It is
a generation fate [E1], which follows from what the classes describe: a
deleted generation leaves no text in the finished work for a span to
cover. The viewer nonetheless draws the three classes and the deleted
figure as four tiles in one row, and then draws a distribution bar
underneath that contains only the three [E7]. The tiles and the bar
disagree about how many categories there are, and the tiles are the
ones a reader screenshots. The three class percentages do sum to one.
The fourth number is a share of a different population entirely
[E2, E6], so the four do not partition anything and must never be
presented as though they do.

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
five or more records with at least two on the prose path [E25], which
means prose and code records will be read side by side. Because code
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
