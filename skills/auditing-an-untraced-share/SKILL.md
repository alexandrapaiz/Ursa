---
name: auditing-an-untraced-share
description: >
  Use when a record's `no_generation_provenance` figure is about to be
  believed, compared or sold, and somebody has to establish what that
  share is actually made of. Fires for deciding whether an untraced
  share is the signal or the apparatus, for working out why the
  no-provenance share rose between two records of the same project, for
  checking whether a record is old enough that its blindness counts are
  absent rather than zero, for auditing the "No model behind it" column
  on a published index, and for deciding whether a commissioned
  collection can be priced off a no-provenance figure. Does not fire for
  deciding the label on any one span the resolver flagged `uncertain`,
  for choosing a denominator or comparing two records' percentages, for
  choosing a trial subject or running the capture, for turning labels
  into tuning axioms, for writing a rule about records into the record
  gate, for a trajectory signal such as a correction loop, for the
  forward walk behind a `durability` block, or for deciding whether a
  passage of raw text may be released.
version: 0.1.0
status: draft
validated: false
owner_seat: skill
created: 2026-11-02
revised: 2026-11-02
evidence_scheme: repo
evidence:
  - ref: E1
    what: there are three span classes over the final work and no_generation_provenance is one of them
    source: ursa-major/src/types.ts:7-10
  - ref: E2
    what: NoCandidateReason has four values, and its own doc comment says the third is a defect report rather than a measurement of the work
    source: ursa-major/src/types.ts:297-306
  - ref: E3
    what: the four reasons spelled out, including that df_cutoff_suppressed is a finding about the matcher and not about the work, and that absent_from_corpus is the honest form of the label
    source: ursa-major/src/types.ts:484-501
  - ref: E4
    what: df_cutoff_suppressed grows monotonically with corpus size because MAX_TOKEN_DF is an absolute count, measured 0.00 per cent of substantive spans at 1,000 generation segments rising to 1.10 at 87,333, and both of this project's trials sit where the figure is zero
    source: ursa-major/src/types.ts:502-516
  - ref: E5
    what: every span the cutoff blinds moves out of survived_mutated and into no_generation_provenance, and silently inflating the category Ursa Minor sells hardest is the one error the record must not make without saying so
    source: ursa-major/src/types.ts:517-524
  - ref: E6
    what: pass 2 is capable of producing the same bare no_generation_provenance for three different reasons and until 2026-10-24 said which one only in a source comment
    source: ursa-major/src/resolve.ts:402-412
  - ref: E7
    what: scored_below_floor means candidates were seeded and the best scored under the floor, so the matcher looked
    source: ursa-major/src/resolve.ts:488-490
  - ref: E8
    what: df_cutoff_suppressed means the candidate set was empty before scoring began, so the matcher did not look, and the span's label is a statement about MAX_TOKEN_DF rather than about the work
    source: ursa-major/src/resolve.ts:493-500
  - ref: E9
    what: absent_from_corpus means no distinct token of the span appears in any generation segment, which is the honest form of the label
    source: ursa-major/src/resolve.ts:501-506
  - ref: E10
    what: noCandidate is recorded only on a span that carries no candidate, and a span reaching the end of both passes with nothing attached falls through to a bare no_generation_provenance
    source: ursa-major/src/resolve.ts:512-518
  - ref: E11
    what: a score between the two thresholds produces no_generation_provenance with uncertain set and a candidate attached, and therefore no noCandidate
    source: ursa-major/src/resolve.ts:481-486
  - ref: E12
    what: uncertain is deliberately not set on an unverified descent verdict, because uncertainSpans is O1 KR1.1's metric and widening it would move the number with no span changing
    source: ursa-major/src/resolve.ts:464-472
  - ref: E13
    what: a rival prior_revision verdict in the verbatim pass demotes the span, registers a not_generated claim against the generation, and keeps the evidence as a candidate
    source: ursa-major/src/resolve.ts:240-257
  - ref: E14
    what: over 12 records of this repository's history, 719 of 1,024 verbatim spans and 110,736 of 139,105 characters held text the file already contained at the generation's parent, which is 79.6 per cent of what the records sold as survival
    source: ursa-major/src/resolve.ts:201-209
  - ref: E15
    what: dropping a normalization-only hit instead of demoting it put 26 spans and 1,466 characters into no_generation_provenance about text the model demonstrably wrote, and a false verbatim claim traded for a false claim of no provenance is not a fix
    source: ursa-major/src/resolve.ts:283-291
  - ref: E16
    what: stats counts a span into uncertainSpans on s.uncertain and into blindSpans only on noCandidate df_cutoff_suppressed, so the other three reasons reach no counter
    source: ursa-major/src/stats.ts:54-57
  - ref: E17
    what: blindSpans is the one figure in Stats that is a statement about the matcher rather than the work, is optional and read as zero when absent, and every record written before 2026-10-24 omits it, for which zero is wrong but unknowable
    source: ursa-major/src/types.ts:711-731
  - ref: E18
    what: suppressedTokenSpans is a superset of blindSpans, most of whose members were scored anyway on their remaining tokens
    source: ursa-major/src/types.ts:732-740
  - ref: E19
    what: TokenSuppression stores cutoff and corpusSegments because the suppressed count is only interpretable against them, and a reader comparing two records needs to know which of the two moved
    source: ursa-major/src/types.ts:308-318
  - ref: E20
    what: tokenSuppression rides along on successfully labelled spans too, because a score seeded by one token out of ten is a weaker statement than the same score seeded by all ten
    source: ursa-major/src/types.ts:534-553
  - ref: E21
    what: measurements.descentDemoted counts spans demoted to no_generation_provenance because a commit outside the generation's descent held their text verbatim, and a non-zero count is the bound earning its place
    source: ursa-major/src/invariants.ts:151-157
  - ref: E22
    what: descentDemoted is computed over any non-survived_mutated span carrying a rival verdict, so all three rival demotion routes are summed into one number
    source: ursa-major/src/invariants.ts:976-986
  - ref: E23
    what: each class carries two percentages, pct over coveredChars and pctOfFinal over finalChars, and neither denominator is inferable from the other
    source: ursa-major/src/stats.ts:66-72
  - ref: E24
    what: the published index renders the class under the column label "No model behind it", as a percentage of finalChars
    source: ursa-major/src/publish.ts:809-812
  - ref: E25
    what: the not_generated fate was named rather than inferred so the record would not assert the model produced text the person discarded, about text still sitting in the finished file, which would be a false label in the one class CLAUDE.md §1 sells as correction signal
    source: ursa-major/src/types.ts:12-39
---

# Auditing an untraced share

`no_generation_provenance` is the class CLAUDE.md §1 calls the most
valuable, and the published index renders it under the column label
"No model behind it" [E24]. This skill is the step between those two
sentences. The class is one of three over the final work [E1], but it
is not one finding: it is where the resolver puts a span it could not
join to a generation, for any of several unrelated reasons, and the
reasons are not equally good news.

Two of them are findings about the work. The rest are findings about
the apparatus, and one of them is explicitly a defect report rather
than a measurement [E2]. The resolver's own pass-2 comment says the
pass can produce the same bare label for three different reasons, and
that until 2026-10-24 it said which one only in that comment [E6].

**Ours, and this is the whole reason to run the procedure:** the
routes are not distinguishable from the headline figure, and the error
runs one way. Everything the apparatus cannot see lands in the class we
sell hardest, so an under-powered run reports its best number because
of the defect and not in spite of it. The record's own schema says the
same thing in the field documentation: silently inflating the category
Ursa Minor sells hardest, by more as the dataset gets bigger, is the
one error this record must not make without saying so [E5].

## Step 1 — Decide whether the record can answer the question at all

Read `stats.blindSpans`. If the key is **absent** rather than zero, stop
and date the record. `blindSpans` is optional and read as zero when
absent, every record written before 2026-10-24 omits it, and for those
records zero is wrong but unknowable [E17]. A reader who treats absence
as zero has not measured a clean record; they have measured a record
that could not be asked.

This is the first step because it is the one that invalidates the rest.
An audit run against a pre-2026-10-24 record can still decompose the
rival demotions, which come from `descentDemoted` [E21], and still
cannot say anything about the matcher's blindness.

## Step 2 — Split the share by route

Everything in the class arrives by one of these. Read them in this
order, because the first two are answered by counters and the rest need
the spans.

| route | how you see it | what it says |
|---|---|---|
| rival descent | `measurements.descentDemoted` [E21] | the file already held the text, so the model was never in the running |
| DF cutoff | `stats.blindSpans` [E16] | **the matcher did not look** [E8] |
| score in the band | span has `uncertain` and a `candidate`, no `noCandidate` [E11] | a human has not adjudicated it yet |
| below the floor | span has `noCandidate: 'scored_below_floor'` | the matcher looked and found nothing close [E7] |
| absent vocabulary | span has `noCandidate: 'absent_from_corpus'` | the honest form of the label [E9] |
| empty after normalization | span has `noCandidate: 'empty_after_normalization'` | there was nothing to match |
| neither | span has no `candidate` and no `noCandidate` [E10] | the span never reached pass 2 |

Only the first and the fifth are the product. The second is a statement
about `MAX_TOKEN_DF` [E8]. The third belongs to a person who has not
looked yet, and routing it is `adjudicating-uncertain-spans`' work and
not this skill's.

**The counters do not cover the table.** `stats` increments on
`s.uncertain` and on `noCandidate === 'df_cutoff_suppressed'`, and on
nothing else [E16], so three of the four `noCandidate` values and the
bare fallthrough reach no counter at all. Decomposing those four rows
means iterating `files[].spans`. There is no summary figure to read,
and a reader who assumes the absence of a counter means the absence of
the population has inverted it.

**Ours.** The arithmetic check that tells you whether you have found
everything, since `byClass` gives the class its character total [E23]:

```bash
jq '[.files[].spans[] | select(.class=="no_generation_provenance")]
    | {spans: length,
       chars: (map(.end - .start) | add),
       byReason: (group_by(.noCandidate // (if .candidate then "in_band" else "bare" end))
                  | map({(.[0].noCandidate // (if .[0].candidate then "in_band" else "bare" end)):
                         {spans: length, chars: (map(.end - .start) | add)}}) | add)}' \
  outcome_record.json
```

`chars` here must equal `stats.byClass.no_generation_provenance.chars`.
If it does not, the record is malformed and the gate, not this skill,
is the thing to run.

**Ours, run on the one record committed to this repository**, which is
`ursa-major/fixtures/mini/record/outcome_record.json`. Its untraced
share is 34.1 per cent of the finished work, and the command above
resolves all of it to one route:

| | spans | chars | route |
|---|---|---|---|
| `stats.byClass.no_generation_provenance` | 2 | 107 | — |
| decomposed | 2 | 107 | `scored_below_floor`, all of it |

So the fixture's headline third is entirely the matcher having looked
and found nothing close [E7], and **none of it is the absent-vocabulary
route that is the thing we sell** [E9]. `blindSpans` is present and zero
on this record, so step 1 passes and the zero is a real zero rather
than an absence. Reproduce both halves with the command above and
`jq '.stats.byClass.no_generation_provenance, .stats.blindSpans'` over
the same file.

This is the shape the audit usually finds, and it is the argument for
the skill in one row: a figure that reads as "no model behind it" [E24]
survived decomposition with nothing in it that supports the phrase.

## Step 3 — Ask which direction the number moved, and why

`descentDemoted` being large is the bound working, not a problem: over
12 records of this repository's own history, 719 of 1,024 verbatim
spans and 110,736 of 139,105 characters held text the file already
contained at the generation's parent, which is 79.6 per cent of what
those records had been selling as survival [E14]. A project whose
untraced share is dominated by rival demotions is a project whose
survival figures were previously wrong in the other direction.

`blindSpans` is the opposite case, and it is the one that behaves
unlike every other figure in the record. `MAX_TOKEN_DF` is an absolute
count of generation segments while the corpus grows every time anyone
runs the tool, so the suppressed set grows monotonically: measured
against a proxy corpus, 0.00 per cent of substantive spans at 1,000
generation segments, 0.03 at 10,000, 0.33 at 50,000 and 1.10 at 87,333
[E4]. So **the level in any one record is not the signal; the rise
between two records of the same project is** [E17].

Both of this project's trials sit at the scale where the figure is
zero, which means no trial to date could have caught this and it
arrives with growth [E4]. Do not read a zero on today's records as
evidence the route is closed.

## Step 4 — Rule on what may be said

Write the share with its composition or do not write it. Three
concrete rulings:

- **"No model behind it"** is the published column label [E24], and it
  is a correct gloss only of the rival and absent-vocabulary routes. A
  record whose share is materially `df_cutoff_suppressed` is published
  under a sentence its own schema contradicts [E3]. That is a rendering
  finding for the engineer or frontend seat, recorded in `docs/ideas.md`
  rather than fixed here.
- **A commissioned collection priced off this figure** needs the
  decomposition in the contract, because the buyer is paying for the
  absent-vocabulary route and the figure quoted includes the others.
- **Two records' shares** are comparable on this axis only if both
  carry `blindSpans` and both were resolved against corpora of similar
  size, which `tokenSuppression.corpusSegments` records for exactly
  this reason [E19]. Whether the two may be put in one table at all is
  `quoting-a-number-from-an-outcome-record`'s ruling, and this skill
  supplies one input to it.

## Judgment

**A weak label is not the same as no label, and both are in scope here
but only one is in the class.** `tokenSuppression` is attached to spans
that were labelled successfully, because a score seeded by one token
out of ten is a weaker statement than the same score seeded by all ten
[E20], and `suppressedTokenSpans` is a superset of `blindSpans` for
that reason [E18]. So a record can have `blindSpans: 0` and still have
most of its `survived_mutated` labels resting on one-token evidence.
That is a real finding and it is about the survival classes, so it
belongs in the trial's write-up and not in this audit's figure.

**Resist fixing a false no-provenance claim by making a false survival
claim.** The resolver's history contains that exact trade, run and
rejected: dropping a normalization-only hit rather than demoting it put
26 spans and 1,466 characters into this class about text the model
demonstrably wrote, and the comment recording it says a false verbatim
claim traded for a false claim of no provenance at all is not a fix
[E15]. The same asymmetry is why `not_generated` was named as a fate
rather than inferred: without it the record asserted that the model
produced text and the person threw it away, about text still sitting in
the finished file [E25]. When this audit finds the class inflated, the
repair is a reason field or a bound, never a reclassification that
moves the error somewhere less visible.

**One number in this area is a KR metric, so do not widen it to be
helpful.** `uncertain` is deliberately not set on an `unverified`
descent verdict, because `uncertainSpans` is O1 KR1.1's metric and
setting it would move the KR's number without any span changing [E12].
An audit that proposes flagging more spans `uncertain` to surface them
is proposing to move a committed metric. Propose a new counter instead.

**Ours: the corpus the matcher was given is a precondition, not a
finding.** `absent_from_corpus` means no distinct token of the span
appears in any generation segment [E9]. A generation the run never
loaded has no segments in the index, so every span over its text takes
that same value, which is the one spelling that means "this is the
valuable signal". An incomplete capture therefore does not merely add
noise, it forges the discriminator this whole procedure turns on, and
it does so at the honest label's own exit code. Establish that the run
saw everything it should have before you read a single `noCandidate`
value. For the `ursa run` path over a git history, the clone's own
completeness is part of that, which
`running-an-outcome-record-trial` covers as a precondition and
`bash tools/ensure-full-clone.sh --check` tests; a shallow or
single-branch clone measured on this repository moved the untraced
share from 27.1 per cent to 100 per cent with every tool green.

**Where this skill stops.** It rules on the composition of one class's
figure. It does not settle any individual span, which is
`adjudicating-uncertain-spans`', and it does not choose the denominator
the figure is expressed over or decide whether two figures may be
compared, which is `quoting-a-number-from-an-outcome-record`'s. The
boundary is that those two work on a label and on a denominator, and
this one works on the reason fields: `noCandidate`, `tokenSuppression`,
`descent` and the absence of both, which no other skill in the library
reads.
