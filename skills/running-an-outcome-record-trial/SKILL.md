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
  code, or for redacting a record so it can be published.
version: 0.2.0
status: draft
validated: false
owner_seat: skill
created: 2026-09-30
revised: 2026-10-08
evidence_scheme: repo
evidence:
  - ref: E1
    what: there are two capture paths with two separate entry points, not one resolver with a flag
    source: ursa-major/src/cli.ts:1-7; ursa-major/src/bin/ursa.ts:1-7
  - ref: E2
    what: the git path's pairing rule, a marked generated commit joined to the next unmarked commit touching an overlapping path
    source: ursa-major/src/pairfinder.ts:1-8; ursa-major/src/pairfinder.ts:415-443
  - ref: E3
    what: what marks a commit as generated, including the author fallback that matches bots and github-actions
    source: ursa-major/src/pairfinder.ts:144,167; ursa-major/src/pairfinder.ts:391-395
  - ref: E4
    what: a merge commit is never a pairing target, because the human did not write that diff
    source: ursa-major/src/pairfinder.ts:448-451
  - ref: E5
    what: the commit walk covers every branch by default, and walks one revision range instead when a caller passes one
    source: ursa-major/src/pairfinder.ts:193-199
  - ref: E6
    what: the git path records zero user turns, so it carries no user words and no turns-to-acceptance
    source: ursa-major/src/resolve-episode.ts:179-187
  - ref: E7
    what: on the git path the model attribution is whatever marker string classified the commit
    source: ursa-major/src/resolve-episode.ts:124,183; ursa-major/src/episodes.ts:25
  - ref: E8
    what: min-chars defaults to 200 and limit truncates; ursa run drops below-threshold episodes without naming them, while the CI path counts its drops
    source: ursa-major/src/bin/ursa.ts:316-317; ursa-major/src/bin/ursa.ts:377; ursa-major/src/ci/run.ts:149
  - ref: E9
    what: the two paths accept different file extensions, and only the git path reads py, yml, toml and sql
    source: ursa-major/src/cli.ts:21-24; ursa-major/src/resolve-episode.ts:33-36
  - ref: E10
    what: both paths cap file size, at different limits, and only the session path says so on stderr
    source: ursa-major/src/cli.ts:27; ursa-major/src/cli.ts:89-91; ursa-major/src/resolve-episode.ts:38
  - ref: E11
    what: path-filter narrows which generations are kept at parse time, before any matching happens
    source: ursa-major/src/cli.ts:119; ursa-major/src/parse.ts:71-72
  - ref: E12
    what: prose segments by sentence and code by line, and the choice is made from the file extension alone
    source: ursa-major/src/segment.ts:1-3; ursa-major/src/segment.ts:13-15
  - ref: E13
    what: acceptance is a declaration, and the undeclared default states that retention is not acceptance
    source: ursa-major/src/signals.ts:30-39; ursa-major/src/bin/ursa.ts:319-324
  - ref: E14
    what: the two paths measure different stages of the funnel, 82 percent deletion against 7 percent, and a record should state which stage it measured
    source: docs/beyond-preference-pairs.md:229-237
  - ref: E15
    what: n=2's commit pairs lacked the fine-tuning trace, which is why the overlay was specified to tail the session log
    source: docs/design/product-plan.md:689-691
  - ref: E16
    what: KR1.3's corpus shape, five or more records on distinct real finished works, at least two prose, at least one joining more than one source
    source: docs/okrs/2026-q4.md:28-34
  - ref: E17
    what: at small n the record demonstrates label types and not statistics, and every quantitative claim is an existence proof
    source: docs/beyond-preference-pairs.md:154-157
  - ref: E18
    what: raw records are private-repo material by default, and nothing generated from one ships public before the redaction pass and the owner's per-record sign-off
    source: docs/agents/incidents.md:175-181
  - ref: E19
    what: the session path's two input shapes, a Claude Code JSONL where every Write or Edit is a generation, and a paste format that carries real user turns
    source: ursa-major/trial/README.md:19-40; ursa-major/src/parse.ts:62-63; ursa-major/src/parse.ts:131-141
  - ref: E20
    what: abandoned work is declared with a flag rather than inferred from the record
    source: ursa-major/src/cli.ts:7; ursa-major/src/cli.ts:52
  - ref: E21
    what: ADR-003 makes capture launch-based, scopes it to building, makes git the interface, and names alexandria as n=2
    source: docs/decisions.md:43-56
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
- A record needs to become publishable. That is a redaction pass, which
  is the security seat's standard and the owner's per-record sign-off
  [E18].

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
truncates to `--limit` when given. `ursa run` does not name what it
dropped; the CI path does, counting its below-threshold drops [E8]. So
on a local run, if step 2 counted more pairs than the run produced
records, that gap is the default threshold rather than a bug, and you
have to reconstruct it yourself. *Output: the two counts, and the reason for
any difference.*

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

Whether it is caught depends on the trailer that survives the squash, and
the marker test is narrower than it looks. The trailer pattern matches
`claude|codex|cursor|gpt`, and the author fallback, which is the only test
that knows about `[bot]` names, is applied to the commit's author name and
never to its trailer [E3]. A bot whose name contains none of those four
substrings therefore passes through as human.

Ours: this is measurable in this repository, and it is not hypothetical.
Across the 88 commits reachable in a working clone, 78 are agent-marked
non-merge commits, 8 are merge commits the exclusion drops, and the
remaining 2 are root or graft boundaries. One of those is a squash merge
whose trailer GitHub rewrote to `Co-authored-by: exo-centralizer[bot]`,
which matches neither pattern, so it reads as a human commit editing the
agent's work.

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
carries no user turns at all, so there are no user words and no
turns-to-acceptance in the record [E6], and that absence is exactly what
made n=2's commit pairs insufficient for the trajectory work [E15].

Ours: read this as a division of labor, not a ranking. If the trial is
meant to feed correction-basis or loop-detection work, the git path cannot
serve it no matter how clean the repo is, and the subject should be one
where a session transcript exists. If the trial is meant to add a graded
label on real finished work, the git path is the better instrument, and
the missing trace is a known limit rather than a defect in the run.

**The prose path is where the quotable record comes from.** Only the paste
format carries real user turns, since it records prompts as well as
assistant output [E19], and prose segments at sentence boundaries so spans
land on units a reader recognises [E12]. Two of the five records must go
through the prose path anyway [E16].

Ours: put the multi-source record and a prose record on the same trial if
one subject honestly supports both, because a subject that carries a
session transcript and a pasted conversation satisfies two of KR1.3's
three constraints at once. Do not force it. A joined record assembled from
sources that fed different work is worse than two clean records.

**The default detector is looser than it reads, in both directions.** A
commit counts as generated when its co-author trailer matches
`claude|codex|cursor|gpt`, or, failing that, when its author name matches a
wider list that includes `github-actions` and anything bracketed `[bot]`
[E3]. So a release bot or a CI commit is classified as a model generation,
and its next human touch becomes a correction of it. Going the other way,
an agent commit whose trailer was dropped is read as human, which silently
converts a generation into `no_generation_provenance`. The comment in the
finder says the fallback deliberately errs toward matching because a false
negative loses signal [E3].

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
