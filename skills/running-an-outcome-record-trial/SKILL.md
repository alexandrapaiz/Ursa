---
name: running-an-outcome-record-trial
description: >
  Use when planning or running a new outcome-record trial: choosing which
  finished work to resolve, choosing between the git-history capture path
  and the session-transcript capture path, invoking the resolver, and
  reading the record it produces without over-reading it. Fires for
  picking a trial subject, for deciding which capture path a subject
  needs, for diagnosing a run that found no episodes or produced a record
  that cannot be used, and for judging what a trial's deletion and
  survival numbers are allowed to mean. Does not fire for adjudicating
  spans a record already flagged uncertain, for changing the resolver's
  code, for adding or changing a bound in the record gate, for turning a
  record into tuning axioms, for auditing the trajectory signals a
  finished record carries, or for redacting a record or otherwise
  deciding what may leave the machine.
version: 0.5.1
status: draft
validated: false
owner_seat: skill
created: 2026-09-30
revised: 2026-10-24
evidence_scheme: repo
evidence:
  - ref: E1
    what: there are two capture paths with two separate entry points, not one resolver with a flag
    source: ursa-major/src/cli.ts:1-7; ursa-major/src/bin/ursa.ts:1-7
  - ref: E2
    what: the git path's pairing rule, a marked generated commit joined to the next unmarked commit touching an overlapping path
    source: ursa-major/src/pairfinder.ts:1-8,655-677,715-717,755-769
  - ref: E3
    what: three tests mark a commit as generated and two of them share one machine-identity pattern, the co-author trailer and the author name, while the owner-declared list is a hand-written set of substrings matched against name and email, and the author test alone is suppressed when it matches the whole history
    source: ursa-major/src/pairfinder.ts:269-314,365; ursa-major/src/pairfinder.ts:568-579,592-596,623-634; docs/design/agent-coauthor-detection.md:71-80,175-180
  - ref: E4
    what: a merge commit is never a pairing target, because the human did not write that diff, and the exclusion is written against parent count
    source: ursa-major/src/pairfinder.ts:688-691,701
  - ref: E5
    what: the commit walk covers every branch by default, and walks one revision range instead when a caller passes one
    source: ursa-major/src/pairfinder.ts:391-397
  - ref: E6
    what: the git path records zero user turns, so it carries no user words, and its turnIndex counts files inside one commit pair rather than conversational turns, which is what turnsToAcceptance then takes a maximum over
    source: ursa-major/src/resolve-episode.ts:123-135,205-213; ursa-major/src/stats.ts:132,140-142
  - ref: E7
    what: on the git path the model attribution is whatever marker string classified the commit
    source: ursa-major/src/resolve-episode.ts:134,209; ursa-major/src/episodes.ts:25
  - ref: E8
    what: min-chars defaults to 200 and limit truncates, both launches ask the keep-or-drop decision through one shared predicate that exempts refusal-only records from the floor, and both keep one shared tally of which bound dropped each unit, which ursa run prints along with the lowest floor that would have kept one
    source: ursa-major/src/bin/ursa.ts:596-597; ursa-major/src/bin/ursa.ts:619; ursa-major/src/bin/ursa.ts:126-147; ursa-major/src/bin/ursa.ts:630-633,644-648; ursa-major/src/ci/run.ts:220-223; ursa-major/src/launch.ts:107-123; ursa-major/src/launch.ts:266-295
  - ref: E9
    what: the two paths accept different file extensions, and only the git path reads py, yml, toml and sql
    source: ursa-major/src/cli.ts:21-24; ursa-major/src/resolve-episode.ts:34-37
  - ref: E10
    what: both paths cap file size, at different limits, and only the session path says so on stderr
    source: ursa-major/src/cli.ts:27; ursa-major/src/cli.ts:89-91; ursa-major/src/resolve-episode.ts:39
  - ref: E11
    what: path-filter narrows which generations are kept at parse time, before any matching happens
    source: ursa-major/src/cli.ts:117-119,133; ursa-major/src/parse.ts:77-78
  - ref: E12
    what: prose segments by sentence and code by line, and the choice is made from the file extension alone
    source: ursa-major/src/segment.ts:1-3; ursa-major/src/segment.ts:13-15
  - ref: E13
    what: acceptance is a declaration, and the undeclared default states that retention is not acceptance
    source: ursa-major/src/signals.ts:30-39; ursa-major/src/bin/ursa.ts:599-604
  - ref: E14
    what: the two paths measure different stages of the funnel, 82 percent deletion against 7 percent, and a record should state which stage it measured
    source: docs/beyond-preference-pairs.md:232-240
  - ref: E15
    what: n=2's commit pairs lacked the fine-tuning trace, which is why the overlay was specified to tail the session log
    source: docs/design/product-plan.md:689-691
  - ref: E16
    what: KR1.3's corpus shape, five or more records on distinct real finished works, at least two prose, at least one joining more than one source
    source: docs/okrs/2026-q4.md:28-34
  - ref: E17
    what: at small n the record demonstrates label types and not statistics, and every quantitative claim is an existence proof
    source: docs/beyond-preference-pairs.md:157-160
  - ref: E18
    what: raw records are private-repo material by default, and nothing generated from one ships public before the redaction pass and the owner's per-record sign-off
    source: docs/agents/incidents.md:204-210
  - ref: E19
    what: the session path's two input shapes, a Claude Code JSONL that lives on the user's own machine and where every Write or Edit is a generation, and a pasted-markdown format, and both of them record the human's real prompts rather than only assistant output
    source: ursa-major/trial/README.md:11-40; ursa-major/src/parse.ts:14,31,56-58,68-69; ursa-major/src/parse.ts:81,109-114,147-157,177,185-198
  - ref: E20
    what: abandoned work is declared with a flag rather than inferred from the record
    source: ursa-major/src/cli.ts:7; ursa-major/src/cli.ts:52
  - ref: E21
    what: ADR-003 makes capture launch-based, scopes it to building, makes git the interface, and names alexandria as n=2
    source: docs/decisions.md:43-56
  - ref: E22
    what: a committed git-path record carries a turnsToAcceptance of 1 over a single-file episode, so the field is present on this path rather than absent
    source: ursa-major/fixtures/real/ursa-main-4d5e401.json:1134-1143
supersedes: []
---

# Running an outcome-record trial

A trial is one finished piece of real work, resolved against the model
generations that fed it, producing one outcome record. This skill covers
the part before and after the resolver runs: choosing a subject the
resolver can actually see, choosing which of the two capture paths the
subject needs, and reading the resulting numbers for no more than they
say.

The reason this needs a skill rather than a command is that both hard
decisions happen before anything is invoked. A subject chosen wrong
produces a record that is technically valid and useless, and the run
itself will not complain.

## When this fires

Any of these:

- A new trial is owed and the subject is not yet chosen.
- A subject is chosen and the capture path is not yet decided.
- A run finished and found no episodes, or found far fewer than the work
  actually contains.
- A record exists and someone is about to quote a number out of it.

Not this:

- Spans in an existing record are flagged `uncertain` and need
  adjudicating. That is `skills/adjudicating-uncertain-spans`.
- The resolver's matching, segmentation or signal code needs changing.
  That is the engineer's work, not a trial.
- A record needs to become publishable. Nothing generated from a record
  ships public before the security seat's redaction pass and the owner's
  per-record sign-off [E18]. The wider question of what may leave the
  machine at all, including exits that are not public, is
  `skills/clearing-a-record-for-release`, which owns three of them and
  governs them by different rules.
- A property of a record should become a rule the gate enforces on every
  record. A trial reasons about one subject; a bound is a claim about all
  of them. That is `skills/adding-a-bound-to-the-record-gate`.
- A record exists and is about to become tuning axioms. This skill stops
  at the record. That is `skills/distilling-a-tuning-record`.

## The procedure

**1. Name which constraint this trial fills.** The corpus is not a count,
it has a shape: five or more records on distinct real finished works, at
least two of them through the prose path, at least one joining
generations from more than one source [E16]. Write down which of those
three this trial satisfies before choosing a subject, because the answer
constrains everything below. *Output: one sentence naming the constraint.*

**2. Test the subject against the detector before committing to it.** On
the git path, a subject is only visible if the pair finder finds pairs in
it, so run the finder and count episodes first. A pair needs a commit
marked as generated and then a later commit, not a merge, with no agent
marker, touching at least one of the same paths [E2, E4]. Nothing else in
the repo's history matters.

Two things make this count lie. The walk is `--all` over the clone's
history [E5], so a shallow clone reports the depth of the fetch rather
than the history of the project, and an agent running in a CI checkout
gets the shallow answer by default. And the subject's merge style decides
whether the human side is visible at all, which the judgment section
below treats as the skill's first real decision. *Output: an episode
count taken on a full clone, or a rejected subject.*

**3. Choose the capture path on what you need to measure, not on what is
easier to get.** The two paths are separate entry points and they sit at
different points of the same funnel: session capture carries the
trajectory and measured 82 percent deletion on the first trial, git
capture carries the label and measured 7 percent on the second, because a
commit already sits near the label end [E1, E14]. Neither substitutes for
the other. *Output: the path, and the stage of the funnel this record will
measure.*

**4. Check the subject's file types against the path you chose.** The two
paths do not accept the same extensions, and only the git path reads
`.py`, `.yml`, `.toml` and `.sql` [E9]. Segmentation is chosen from the
extension too, so the same text resolves sentence by sentence as `.md` and
line by line as anything else [E12]. Large files are skipped by both
paths at different limits, and only the session path prints a warning when
it does [E10]. *Output: confirmation that the finished work's actual files
are readable on the chosen path, or a change of path.*

**5. On the session path, set `--path-filter` before you run, not after.**
It drops generations at parse time, before any matching happens [E11], so
it decides which generations exist at all rather than which ones are
reported. *Output: a filter that matches the finished work's paths, or a
deliberate decision to run unfiltered.*

**6. Run it, and declare acceptance in the same breath.** Acceptance is
supplied by declaration, and the default the code ships says so in its own
basis string: retention is not acceptance [E13]. Declare satisfied or
unsatisfied at launch, and if the work was abandoned rather than finished,
say that with the flag rather than leaving it to be inferred from the
record [E20]. *Output: the record, plus a declaration with a basis.*

**7. Reconcile the episode count against what the run reported.** The git
path drops any episode whose generated side is under 200 characters, and
truncates to `--limit` when given. Both paths now ask that through one
predicate, which exempts a record that carries exclusions, so an episode
whose every path was an import still produces the record whose only job
is to say so [E8]. Both launches also name what they dropped, from one
shared tally: the run summary says how many work units were found and not
recorded, which bound dropped each, and for the ones under the floor the
lowest `--min-chars` that would have kept at least one [E8]. So read the
gap between step 2's count and the record count off the summary rather
than reconstructing it. The local launch dropped silently until
2026-10-24 and only the CI comment named the bounds [E8], so a run on an
older build still needs the reconstruction by hand. *Output: the two counts, and the reason for any difference.*

**8. Write down what the record measured, next to the record.** A record
should state which stage of the funnel it came from [E14]. Also state
which path produced it, what the declaration was, and, on the git path,
that there are no user words in it [E6]. *Output: a stage-and-path note
committed with the record.*

**9. Treat the raw record as private until someone says otherwise.** Raw
records are private-repo material by default, and nothing generated from
one goes to a public surface before the redaction pass and the owner's
sign-off for that specific record [E18]. *Output: the record in the
private repo.*

## Judgment

**The subject has to contain human editing of agent output, and the
obvious subjects do not.** This is the one that decides whether a trial
happens at all. The git path pairs a generated commit with the next
unmarked non-merge commit on an overlapping path [E2], and a merge is
explicitly excluded because the human did not write that diff [E4]. So a
repository where agents open pull requests and a human merges them
produces merge commits where the correction should be, and the pair finder
finds nothing.

Ours: that is Ursa's own workflow, which makes this repository one of the
worst possible subjects for its own git path, and it is the most likely
reason a run comes back with zero episodes. The subject you want is a repo
where someone pulls the agent's branch and commits fixes on top, or
commits directly after the agent does. Check for that shape in step 2
rather than discovering it after the run.

**A squash merge is not a merge commit, and that is the dangerous case.**
The exclusion is written against parent count [E4], so it catches the
merge-commit form of the problem and misses the squash form, which is
GitHub's default in many repositories. A squash commit has one parent, is
authored by the person who clicked the button, and carries the agent's
entire branch diff. Every condition for a legal pairing target is met, and
the diff it supplies is precisely what the exclusion's own comment says
must not be counted as the person's corrections [E4].

Whether it is caught depends on the trailer that survives the squash.
The marker test runs three tests in order and two of them share one
pattern. A commit is an agent's if the owner has declared its identity,
or if its co-author trailer matches
`claude|codex|cursor|gpt|copilot|github-actions|\[bot\]`, or, failing
both, if its author name matches that same pattern [E3]. The declared
list is checked first and is never suppressed. The author fallback still
is, whenever it matches every commit in a history of two or more,
because `GIT_AUTHOR_NAME` is ambient and a harness that exports it labels
the person's own commits too [E3].

**This changed on 2026-10-11, and the previous version of this skill
described the hazard that caused it.** Until then the trailer pattern was
only `claude|codex|cursor|gpt` and the `[bot]` test reached author names
alone, so a bot whose name held none of those four substrings passed
through as human. This skill reported that as a live risk in this
repository, naming a squash commit whose trailer GitHub had rewritten to
`Co-authored-by: exo-centralizer[bot]`. The risk then materialized and
was measured. On a clone of this repository at `fe0da2a`, 470 commits,
exactly one carried `Co-Authored-By: exo-centralizer[bot]`. It was
authored by the owner's own account, so the author fallback could not
reach it either, and it became eligible as a person's edit. It
paired with the preceding `claude[bot]` commit and produced a record
claiming 60,616 of 63,362 generated characters survived verbatim, which
is 94.9 percent. That single claim carried 84.7 percent of the run's
whole headline survival figure, and no person had read a character of it.
Both commits were automated syncs of the same upstream file [E3].

Ours: read the direction of that fix before copying it. Widening the
marker narrows what a run claims rather than widening it, because a
commit classified as a generation stops being eligible as a pairing
target [E3]. A refused pair is a claim not made, where the alternative
here was a claim that was false. So when you are unsure whether some
machine identity belongs in the pattern, the costly direction is leaving
it out.

```bash
git log --all --pretty=format:'%h%x09%an%x09%p%x09%(trailers:key=Co-Authored-By,valueonly)'
```

Ours: the consequence is worse than an empty record. On a squash-merge
repo with bots named outside the pattern, the polarity inverts: the
agent's whole contribution arrives inside a commit labelled human, so
generated text is classified `no_generation_provenance`, the category
CLAUDE.md calls the most valuable and which here would be entirely
artifact. Check two things about a candidate subject before trusting any
label out of it, the repository's merge style and the literal names of its
bots, and prefer a subject whose humans commit directly.

**Choosing the git path buys the label and costs the trace.** Deletion
rate looks like a quality measurement and is not one. It is a statement
about where in the funnel you captured, which is why 82 percent and 7
percent are both correct for the same product [E14]. A filtered session
run moves the same number again, because the filter changes which
generations are in the denominator [E11]. The git path also
carries no user turns at all, so there are no user words in the record
[E6], and that absence is exactly what made n=2's commit pairs
insufficient for the trajectory work [E15].

Ours, and read this before quoting a trajectory number off a git-path
record: the user words are absent, and `turnsToAcceptance` is not. The
field is computed on this path like any other, from a `turnIndex` that
counts the files inside one commit pair rather than conversational turns
[E6], so it reports the position of the last file that had surviving
text in enumeration order. This repository's own fixture record is a
one-file episode and carries `turnsToAcceptance: 1` [E22]. A reader who
expects the field to be missing on this path, as this skill said until
2026-10-18, will instead find a number that looks like a turn count and
is a file ordinal.

Ours: read this as a division of labor, not a ranking. If the trial is
meant to feed correction-basis or loop-detection work, the git path cannot
serve it no matter how clean the repo is, and the subject should be one
where a session transcript exists. If the trial is meant to add a graded
label on real finished work, the git path is the better instrument, and
the missing trace is a known limit rather than a defect in the run.

**The prose path is where the quotable record comes from.** Prose segments
at sentence boundaries, so spans land on units a reader recognises [E12],
and both session shapes record the human's own prompts and not only
assistant output: the pasted format from its `## user` sections, and the
Claude Code JSONL from every human message that is not a tool result, an
attachment or a system reminder [E19]. Two of the five records must go
through the prose path anyway [E16].

Ours: put the multi-source record and a prose record on the same trial if
one subject honestly supports both, because a subject that carries a
session transcript and a pasted conversation satisfies two of KR1.3's
three constraints at once. Do not force it. A joined record assembled from
sources that fed different work is worse than two clean records.

**The default detector is loose in one direction by choice, and the
choice is defensible.** One pattern covering `copilot`,
`github-actions` and anything bracketed `[bot]` is applied to the
trailer and to the author name alike; the declared list is a different
mechanism, a hand-written set of substrings tested against the author's
name and email, and the pattern is never applied to it [E3]. So a release
bot or a CI commit is classified as a model generation, and its next
human touch becomes a correction of it. That is the intended cost. A
commit classified as a generation stops being eligible as a pairing
target, so the error it produces is a pair refused rather than a
survival claimed, and the file's own note says that is the correct
direction to err in [E3]. Going the other way still bites. An agent
commit whose trailer was dropped and whose author name is a person's
reads as human, which silently converts a generation into
`no_generation_provenance`. The owner-declared identity list exists for
exactly that case, and it is the only one of the three tests that is
never suppressed [E3].

Ours: before trusting a trial's model attribution, look at the distinct
marker strings in the output, because attribution on this path is the
marker string itself rather than a model identifier [E7]. Cross-model
comparison is only as good as the repo's trailer hygiene, and a repo with
one agent and one bot will report two models.

**One human commit can be the correction for several generations.** The
finder scans forward independently for each generated commit and stops at
the first match [E2], and the walk covers every branch rather than the
default one, unless a caller hands it one revision range, which is what
the CI launch does [E5].

Ours: two consequences follow, and both change how a count is read. Two
consecutive agent commits on the same path both pair to the same following
human commit, so the same edit is counted as the correction in more than
one episode, and episode count is not a count of distinct corrections.
Separately, an abandoned branch still yields episodes, so a record can
include work the project itself discarded. Neither is wrong for the label,
because the text really was written and really was changed, but a
trajectory claim built on the episode count will be inflated.

**Never let retention stand in for acceptance, including by omission.**
The undeclared default carries its reasoning in the record itself, and
unsatisfied is not the absence of satisfied. It means the surviving text
is not endorsed, it is not-yet-fixed [E13].

Ours: the practical failure is running a trial, seeing high survival, and
calling the work accepted. The record cannot distinguish text the person
was happy with from text they had not got around to fixing. A trial run
without a declaration has produced a provenance record and no reward
signal, which is half the artifact.

**At this n, a new kind of record is worth more than a new record.** The
methods doc is explicit that small n demonstrates label types rather than
statistics, and that its quantitative claims are existence proofs [E17].
The corpus is at two.

Ours: when two candidate subjects are both viable, prefer the one that
exercises something no existing record does, which usually means a
different capture path, a different artifact medium, or an unsatisfied
declaration where both existing records have the other. A third record
that repeats n=2's shape moves the count and not the argument.

## Limits

- **The session path's subjects are mostly unreachable from here.** A
  Claude Code JSONL lives on the user's own machine [E19], so a trial on
  that path cannot be planned from this repository alone. Steps 2 and 4
  assume whoever runs the trial can see the transcript.
- **No guidance on redaction.** Step 9 stops at "private by default"
  because the standard it points at is the security seat's to write [E18].
  This skill does not say what a redacted record looks like.
- **Nothing here is measured.** Every claim above is read out of the
  resolver's code and the project's own documents. The two trials that
  exist were not run by this procedure, so the procedure's own value is
  untested, and `validated` is false.
- **The git path is the only one this skill can check mechanically.**
  Step 2's rehearsal works because the pair finder can be run against any
  repo. There is no equivalent dry run for the session path, so a bad
  session subject is found only after the run.
- **ADR-003's scope is building.** Capture is launch-based and limited to
  work that lives in git or in a handed-over transcript [E21]. A finished
  work that exists only inside a chat product, with no artifact and no
  paste, is outside every path described here.
