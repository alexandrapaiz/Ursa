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
  days and how many of them the owner's account merged. The experiment
  succeeds at one or more merged by the PM, fails at zero. Taken by
  Ursa's exo seat.

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

### Carried forward: nothing

- **Proposal.** The file was created this week, so there is no earlier
  improvement to carry.
- **Merged.** Not applicable.
- **Effect.** Not applicable.
- **Rule.** Not applicable.
- **Next measure.** From 2026-10-25 this line carries any improvement
  above that merged and still has no Effect number, with the count of
  weeks it has been carried.
