# Improvement Loop — Ursa

Are we getting better, and how do we know. `docs/agents/incidents.md`
says what failed. `docs/standards/lessons.md` says what rule the failure
became. `docs/agents/learning-log.md` says what each run did. None of
them says whether the rule changed a number. That is this file.

Owned by Ursa's exo seat (`prompts/exo-agent.md`), written on the daily
tick of the learning loop (`standards/pm.md` §24) in the same pass that
grades the ten attributes.

**Why it exists, dated 2026-10-18.** HQ's console renders this file as
the ExO tab's third register (`runtime/board/exo.py` names
`docs/agents/improvements.md` beside the lessons and the incidents, and
keeps the raw text of anything it cannot parse rather than dropping it).
Ursa did not have the file, so attribute 8 of the ExO model,
experimentation, graded zero here on a surface that did not exist. The
format below is HQ's, copied deliberately so the parser reads it: one
`## Week of YYYY-MM-DD` section dated that week's Monday, one `###` per
improvement, and under each exactly five labelled lines in order.

Three rules that give the file teeth, also HQ's:

1. An improvement with no Effect line is not an improvement yet. It is a
   proposal, and it says so.
2. Effect is a number, or it is absent. "The queue is healthier" is not
   an effect. "Open pull requests went from fifty-two to eleven between
   2026-10-04 and 2026-10-18" is.
3. A rule that merged and changed no number stays in the file until it
   does, carried forward with the count of weeks it has been carried.
   That count is the most useful number on the page.

## Week of 2026-10-12

### Charter changes get a bold authority line, so the PM can merge the ones that move no authority

- **Proposal.** This run, 2026-10-18, from
  `INC-2026-10-18-tier-c-charter-freeze`. The observation underneath it
  is two numbers taken the same morning: fifty-two pull requests merged
  in seven days, and exactly one pull request touching `prompts/` merged
  in eighteen days, #151 on 2026-10-10, by the owner. `docs/standards/`
  `pm.md` §10's amendment banner and its Tier C list disagree about
  whether a charter waits for her, and Ursa's PM said on the board at
  02:09 UTC that it reads the list. The proposal uses a convention this
  repository already has: `prompts/exo-agent.md` already requires a
  charter change that moves authority or loosens an owner gate to be
  declared in bold at the top of the pull request. Declared, it is Tier
  C. Declared absent, it is Tier B and the PM merges it.
- **Merged.** Not merged yet. It blocks on two things and both are named
  in the incident: §10's own text is HQ's to correct, and the adoption
  is the PM's under §22's silence route. Handed to both on the board
  today.
- **Effect.** Not yet measured. The baseline is taken: **0** pull
  requests touching `prompts/` merged without the owner in the seven
  days to 2026-10-18, out of 52 merges total.
- **Rule.** `INC-2026-10-18-tier-c-charter-freeze`, whose own cost is
  Ursa incident 16 recurring twice after its fix was written, because
  the fix sat in an unmerged charter and a fresh clone reads `main`.
- **Next measure.** On the brief of **2026-10-25**, this seat counts
  pull requests touching `prompts/` that merged in the preceding seven
  days, split by the three buckets of `prompts/exo-agent.md` §3e:
  merged by a seat on Actions, merged by a seat on the host and claimed
  on the board, and unattributed. The experiment succeeds at one or more
  in either seat bucket, fails at zero. Taken by Ursa's exo seat.
  **Metric corrected 2026-10-18, same day it was written.** It said "how
  many of them the owner's account merged", which is unmeasurable: on the
  resident host every seat merges as `alexandrapaiz`, so the owner's
  account is not evidence of the owner
  (`INC-2026-10-18-host-token-is-the-owner`). The date and the success
  condition are unchanged.
- **Clock.** The PM read the proposal on 2026-10-18 at 12:30 UTC, agreed
  with the reading in its own words, and put the adoption to the owner
  under `docs/standards/pm.md` §22's silence route rather than taking it
  alone. It carries at **2026-10-20 12:30 UTC** absent her reply. Open
  pull requests touching `prompts/` stay where they are until then, which
  the PM also said. Nothing to re-file before that moment.

### The pending-workflow queue is handed upstream instead of refilled

- **Proposal.** This run, 2026-10-18, from
  `INC-2026-10-18-pwc-queue-retired-upstream`. HQ's
  `standards/roles/exo.md` §8 retired the local queue of pending
  workflow diffs and made workflow files the centralizer's, and this
  seat went on filling the queue because that standard is not vendored
  into this repository.
- **Merged.** Not merged yet. Shipped in this run's pull request: the
  queue file marked superseded, the three live entries named, and the
  charter paragraph that ordered the queueing replaced with the
  handover.
- **Effect.** Not yet measured. The baseline is the age of the debt:
  PWC-EXO-3 has been queued **18** days and PWC-EXO-6 **13** days, and
  both are the same defect, a rule present in eleven of eleven charters
  and zero of eleven workflow prompt blocks.
- **Rule.** `INC-2026-10-18-pwc-queue-retired-upstream`, which is Ursa
  incident 18 one join further out: incident 18 is a standard pointing
  at a tool that did not cross the sync, this is a standard that did not
  cross the sync at all.
- **Next measure.** On the brief of **2026-10-25**, this seat greps the
  eleven `agent-*.yml` prompt blocks for the draft-first rule and the
  external-content rule and reports the count out of eleven. Baseline
  today is 0 of 11 for both. Taken by Ursa's exo seat.

### The authorship number the loop reports is a join against the board, not GitHub's actor field

- **Proposal.** This run, 2026-10-18, fifth window, from
  `INC-2026-10-18-host-token-is-the-owner`. The trigger is this seat's
  own output six hours earlier: it reported forty-three owner merges
  against nine PM merges for the week and graded autonomy the weakest
  attribute on that split. The host's token is the owner's personal
  account, `gh api user` returns `alexandrapaiz`, so every seat on the
  host merges under her name. Of the ten merges on 2026-10-18, the PM
  claims eight on the board and GitHub records all ten as hers.
- **Merged.** Not merged yet. Shipped in this run's pull request: §3e of
  the charter rewritten around the board join with the command written
  out, three reporting buckets replacing two, `runner-facts.md` §1c
  recording the host-actor fact with its probe, and the experiment above
  re-metricked.
- **Effect.** Not yet measured, and the baseline is a correction rather
  than a zero. Reported autonomy for the seven days to 2026-10-18 was
  **9 of 52** merges without the owner, 17 per cent. The join gives **at
  least 17 of 53**, 32 per cent, probably 18, with 35 unattributed, of
  which 30 merged before the 2026-10-17 boundary and are legitimately
  hers or a chair's. The number the loop reports moved by eight or nine
  merges on the same week's data.
- **Rule.** When a platform change blinds one instrument, sweep every
  other instrument fed by the same surface in the same pass. The clocks
  moving to the host on 2026-10-17 blinded `gh run list`, which this
  seat found and patched at 02:00 on 2026-10-18, and blinded `mergedBy`,
  which it printed wrongly at 12:00 the same day from the same cause.
- **Next measure.** On the brief of **2026-10-25**, this seat reports the
  week's merges in the three buckets and states the unattributed count.
  The experiment succeeds if the post-boundary unattributed count is
  below five, meaning the board's record is catching more of what the
  host does; it fails if the number the owner is handed is still a single
  undifferentiated actor field. Handed to
  `alexandra-systems/exo-centralizer` as well, because
  `standards/roles/exo.md` §5f names this exact surface for attribute 9
  and eleven product seats read it.

### Carried forward: nothing

- **Proposal.** The file was created this week, so there is no earlier
  improvement to carry.
- **Merged.** Not applicable.
- **Effect.** Not applicable.
- **Rule.** Not applicable.
- **Next measure.** From 2026-10-25 this line carries any improvement
  above that merged and still has no Effect number, with the count of
  weeks it has been carried.
