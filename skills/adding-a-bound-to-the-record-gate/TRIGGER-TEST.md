# Trigger test — adding-a-bound-to-the-record-gate

Seven prompts, written against the `description` field in `SKILL.md`.
Three should activate the skill. Four are near misses that should not.
Per `prompts/skill-extract.md` §5, when the test fails the description
is what changes, not the test. The reasoning below points at the
skill's own steps and limits rather than at evidence refs, because
`check-evidence.mjs` and `relevance-sweep.mjs` both read only
`SKILL.md`, so an `[E…]` tag in this file would be a receipt nothing
fingerprints.

The budget is four near misses rather than two because §5c sets one
near miss per adjacent skill, and this skill has four neighbours: every
other skill in the library. §5e is what says that is not a sign the cut
is wrong, and the note at the end is the argument.

Near miss 4 is `adjudicating-uncertain-spans`' own trigger, near miss 5
is `running-an-outcome-record-trial`'s, near miss 6 is
`quoting-a-number-from-an-outcome-record`'s, and near miss 7 is
`distilling-a-tuning-record`'s.

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

## Note on the boundary, which is one edge and not four

§5c warns that a skill with three or more neighbours is probably
describing a topic rather than a piece of work. This skill has four and
should not be re-cut, for the reason §5e gives: count artifacts, not
neighbours.

The four neighbours work on two artifacts, `outcome_record.json` and
`tuning.json`, and both of those are data a run produced. This skill
works on `ursa-major/src/invariants.ts` and the committed records under
`ursa-major/fixtures/violations/`, which are the checker and its
counterexamples. So all four boundaries above are the same boundary
counted four times, between the records and the thing that checks
them, and every near miss fails by sitting on the records side of it.

Ours: the edge is also where the near misses get hardest, which is why
the budget being four is a feature here rather than a cost. Near miss 6
shares every noun this skill's own bounds are written in and is still
excluded by one sentence of step 1, and that is a stronger piece of
evidence about the description than any of the three that fire.
