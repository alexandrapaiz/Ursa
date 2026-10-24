# Trigger test — adding-a-bound-to-the-record-gate

Seven prompts, written against the `description` field in `SKILL.md`.
Three should activate the skill. Four are near misses that should not.
Per `prompts/skill-extract.md` §5, when the test fails the description
is what changes, not the test. The reasoning below points at the
skill's own steps and limits rather than at evidence refs. When this
file was written that was forced: `check-evidence.mjs` and
`relevance-sweep.mjs` both read only `SKILL.md`, so an `[E…]` tag here
would have been a receipt nothing fingerprints. The tenth run fixed
that and §5p is the rule, so a tag in this file is now a receipt like
any other. It stays a choice rather than a defect, because a trigger
test argues about where the description's edge falls and not about
what the code says, and routing through a step keeps one claim in one
place instead of two.

The budget is five near misses rather than two because §5c sets one
near miss per adjacent skill, and this skill has five neighbours: every
other skill in the library. §5e is what says that is not a sign the cut
is wrong, and the note at the end is the argument.

Near miss 4 is `adjudicating-uncertain-spans`' own trigger, near miss 5
is `running-an-outcome-record-trial`'s, near miss 6 is
`quoting-a-number-from-an-outcome-record`'s, near miss 7 is
`distilling-a-tuning-record`'s, and near miss 8 is
`clearing-a-record-for-release`'s.

Near miss 8 was added on 2026-10-24, five days after the rest of this
file, by the run that first measured §5c coverage across the library
rather than within one test. `clearing-a-record-for-release` landed on
2026-10-23 and this file was not amended for it, which is the ordinary
case and not an unusual lapse: no trigger test in this library had ever
gained a near miss after the day it was written.
`skills/trigger-coverage.mjs` is what now says so out loud.

## Should fire

**1. "Add a bound that a record's verbatim-survived character count
never exceeds its generated character count. It is obviously true and
the gate should catch it."**

Reaches the description through "deciding whether a proposed rule is a
bound or a measurement", which is step 1, and the answer is no. The
rule is false on a correct record, because a generated sentence reused
in two final files is counted twice on the final side, so the final
total legitimately exceeds every generation-side total. It
belongs in `Measurement`, which the gate reports and never fails on.
Both halves are step 1 of `SKILL.md`.

This is the prompt the skill exists for most, because the proposal
arrives already believed. A reader who is not routed through step 1
writes a plausible check, it passes on today's records, and the first
record with reuse in it gets refused for being correct.

**2. "`DESCENT_CHECKED_UNIFORMLY`'s statement is three clauses long and
reads badly in the CI comment. Tighten it to one sentence."**

Reaches the description through "writing a bound's statement text" and
through "any edit that moves the bound count or the bounds digest".
This is the case the skill says it fires hardest on, because it looks
like editing a string and is not: the statement text is inside the
bounds digest, so changing a word changes what every record built
afterwards says it was checked against.

It should fire even though the user asked for a wording change and not
for advice, because the first thing that happens is the base record's
`gatedBy` assertion failing, with the command to run in its own failure
message, and because three of the existing statements say in
their own words that absence is legal, so a tightening pass is exactly
how a reader would delete that and leave a silent pass looking like a
check.

**3. "`ursa run` over my own repo exited 1 with `CLAIM_NOT_WIDER` on
two of six records. Is the resolver broken?"**

Reaches the description through "reading a gate violation a run printed
and deciding whether the bound or the resolver is wrong". The prompt
names neither bound nor gate nor fixture; it reads as a bug report
against the resolver, and routing it there is the expensive mistake,
because `CLAIM_NOT_WIDER` is a byte comparison and its message carries
the first offset where the two strings diverge with a short window of
each. The window usually settles it on sight: `"e it, and"`
against `"e it,\n  and"` is a reflow, which is the resolver's extent
arithmetic, while two unrelated strings mean the claim is pointing at
the wrong generation.

It also fires on the sentence the report already gave the user, that
the records are written and are still the evidence and the run is not
reporting success, which is what makes "is it broken" answerable
without rerunning anything.

## Should not fire

**4. "This record has 55 uncertain spans. Work through them and decide
which ones really came from a generation."**

`adjudicating-uncertain-spans`' own trigger. Close because two of the
eighteen bounds are about the descent check itself,
`DESCENT_CHECKED_UNIFORMLY` and `RIVAL_NOT_AFTER_FINAL`, so the gate
and the adjudication skill share the words descent, rival, uncertain
and span.

The line is in the description's last sentence, which excludes choosing
a span's label, and the reason is the first Limit: a bound can only
catch a record contradicting itself, so a record whose numbers are all
consistent and whose labels are all wrong passes every one of them.
There is no bound to add here and nothing in this skill that
decides a label.

**5. "We need a third trial for the corpus. Which repo should I point
`ursa run` at?"**

`running-an-outcome-record-trial`'s own trigger. Close because step 8
of this skill tells a reader to run the gate over something that is not
a fixture, and because the gate runs inside the launch this prompt is
about: `gateRecords` is the shared edge both launches run.

The line is the artifact. The trial skill chooses an input to the
resolver; this skill changes the checker the resolver's output is held
against. Nothing in the choice of repo moves a bound, a fixture, the
bound count or the digest, which is the list the description gives.

**6. "Trial three is a prose record and trial two was a repo. Can I put
their no-provenance shares in the same table?"**

`quoting-a-number-from-an-outcome-record`'s own trigger, and the most
expensive of the four, because the vocabulary is not merely adjacent,
it is identical: `PCT_DENOMINATORS_ORDERED` and `RATES_MATCH_FIELDS`
are bounds whose whole subject is percentages, rates and denominators.
A reader handed this skill would go looking for a bound to add, and the
question would stay unanswered.

The line is step 1's first rule, and it excludes the prompt by
construction. A bound compares numbers measured over the same set of
characters, and two records are two sets of characters, so no
bound can see across them at all. Whether two records' numbers may sit
in one table is therefore not a gate question even in principle, which
is a sharper boundary than a wording preference.

**7. "`ursa run` just produced four records for the site project.
Distill them into tuning.json so I can paste the block into ChatGPT."**

`distilling-a-tuning-record`'s own trigger. Close because the gate ran
over exactly those four records seconds earlier, inside the same
launch, and `gateRecords` is what decided they were reportable at all.

The line is the artifact again, one step further out. `tuning.json` is
not read by `invariants.ts` and no bound in `BOUNDS` mentions it, so
there is nothing in the gate to consult, change or blame. The related
prompt that *would* fire is "should the gate check tuning.json too",
because that is a bound-scope question and step 1 is where it gets
answered.

**8. "The gate workflow is green on my record, so I'm pasting the
conversation into the design doc as the example payload. Any reason not
to?"**

`clearing-a-record-for-release`'s own trigger, and the sharpest near
miss in this file, because it is the only one that reaches for this
skill by name rather than by vocabulary. The user has read a green gate
and is treating it as a warrant. Everything before the comma is this
skill's own subject matter, correctly described.

The line is that a bound can only catch a record contradicting itself,
which is step 1's test, so the gate's verdict is about internal
consistency and carries no claim about who may read the record. Nothing
in `BOUNDS` mentions a reader, a destination or raw text, and no bound
could: the gate sees one record's own numbers and a design document is
not in them. So a green gate is not evidence for the thing the user is
inferring from it, and the prompt belongs to the skill that owns the
three exits.

What makes it a near miss rather than an unrelated prompt is that the
honest answer has to come back through this skill once, to say that the
gate's silence here is a property of what a bound is and not an
oversight someone could fix by adding one. The related prompt that
*would* fire is "add a bound that blocks a record with raw text in it",
because that is a bound-scope question and step 1 answers it: it would
be a measurement about a destination rather than a record contradicting
itself, which is exactly the distinction step 1 exists for.

## Note on the boundary, which is one edge and not five

§5c warns that a skill with three or more neighbours is probably
describing a topic rather than a piece of work. This skill has five and
should not be re-cut, for the reason §5e gives: count artifacts, not
neighbours.

Four of the five neighbours work on two artifacts,
`outcome_record.json` and `tuning.json`, and both of those are data a
run produced. This skill works on `ursa-major/src/invariants.ts` and
the committed records under `ursa-major/fixtures/violations/`, which
are the checker and its counterexamples. So those four boundaries are
the same boundary counted four times, between the records and the
thing that checks them, and each of those near misses fails by sitting
on the records side of it.

The fifth, near miss 8, fails on a different axis and is worth keeping
separate rather than folded into the count.
`clearing-a-record-for-release` does not work on an artifact at all; it
works on a boundary. So that pair is not records-against-checker but
checker-against-destination, and the two skills do not share an object
to be confused about. They are adjacent anyway, and the reason is the
inference in near miss 8: the gate is the most natural thing in the
system to mistake for a release clearance, because it is the one step
that already says yes or no about a record. Being the system's loudest
green light is itself an adjacency.

Ours: the edge is also where the near misses get hardest, which is why
the budget being five is a feature here rather than a cost. Near miss 6
shares every noun this skill's own bounds are written in and is still
excluded by one sentence of step 1, and near miss 8 shares none of them
and is excluded by the same sentence. Those two are stronger evidence
about the description than any of the three that fire.
