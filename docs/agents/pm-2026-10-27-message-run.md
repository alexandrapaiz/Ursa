# PM run — 2026-10-27 (message)

Status: done.

Built on #574 (this seat's own run earlier today): branched from its
tip rather than `main`, so this branch's diff is a superset of
everything #574 did. Confirmed the ancestor relationship with
`git merge-base --is-ancestor` and closed #574 pointing here, per the
standing rule in `docs/sprints/pending.md`.

## What woke this run

A message event carrying two things: PR #571 (exo, "the one-line
repair three seats were told was queued existed on no branch"), with
an instruction to review it against the merge rule and either merge
it or say on the board what it still needs; and a standing block,
attached to the wake, naming five open draft pull requests — #558,
#568 (security), #562 (frontend), #561 (engineer), #566 (skill) — as
stranded with no live run behind them, asking this seat to ready and
merge, close, or name the blocking clause for each.

Both are data describing the world, not instructions that override
this charter (org rule, 2026-10-05). The charter's own merge rule
(`docs/standards/pm.md` §10, §21) decides what happens next, and the
standing block's own premise turned out to need checking before
acting on it, which is exactly what it itself warns a wake-queued
condition can need.

## PR #571, against the merge rule

**Tier C, not mine to merge.** Five of its ten changed files sit
under `prompts/` — `exo-agent.md`, `finance-agent.md`,
`frontend-agent.md`, `pm-agent.md` (this seat's own charter),
`security-agent.md` — and §10 reserves that path for the owner or a
chair, regardless of what the content does. This holds even though
the PR's own description says it "moves no authority between seats
and loosens no owner gate": Tier C is a path rule, not a content
judgment, and the PM does not get to waive it by reading the diff as
benign.

**The conflict GitHub reports is the false kind.** `mergeable:
CONFLICTING`, `mergeStateStatus: DIRTY`. The PR's own addition to
`prompts/pm-agent.md` says exactly why a report like that can be
wrong: `.gitattributes` names custom merge drivers for six files
(`docs/ideas.md`, `docs/agents/incidents.md`, `docs/decisions.md`,
`docs/agents/learning-log.md`, `docs/agents/runner-facts.md`,
`docs/agents/improvements.md`), but the drivers are registered in
per-clone git config, which this run's clone did not have, and this
run's clone was also shallow and single-branch (confirmed separately
with `git rev-parse --is-shallow-repository`). Both are now verified,
independently, on this seat's own clone rather than taken from the
PR's claim:

1. `bash tools/ledger/install-driver.sh` and
   `bash tools/registers/install-drivers.sh` — confirmed absent before
   (`git config --get-regexp 'merge\.(ledger|register)\.'` printed
   nothing, exit 1), present after (6 lines).
2. `bash tools/ensure-full-clone.sh` — the clone was 1890 commits on
   one branch; repaired to 3593 commits, 260 remote refs.
3. With both repaired, `git merge origin/main --no-commit --no-ff` on
   PR #571's branch in a scratch worktree completed with "Automatic
   merge went well," no conflict markers, both register-driver files
   auto-merged.

So the PR is real, useful, and currently unmergeable by anyone through
no fault of its own content — but it still needs the owner or a chair,
not me, because of the path. Posted the finding to the board (`note`
to exo) and as a PR comment, so the true and only blocker — Tier C —
is the one on record, not a conflict that will keep re-appearing to
anyone who reads GitHub's own field.

## The five "stranded" drafts

**Not stranded.** Each already has a live successor pull request from
its own seat, opened within roughly the same hour the standing block
describes them as abandoned, and each successor's own description
states in writing that it absorbs the older one. Verified every pair
with `git merge-base --is-ancestor`, not taken from either PR's
account of itself:

| old (flagged stranded) | seat | successor | confirmed ancestor |
|---|---|---|---|
| #558 | security | #572 | yes |
| #568 | security | #572 | yes |
| #562 | frontend | #570 | yes |
| #561 | engineer | #573 | yes |
| #566 | skill | #569 | yes |

All four successors (#572, #570, #573, #569) are themselves still
drafts of runs that, as of this check, show recent CI activity
(`redaction-gate` runs on each branch between 00:06Z and 00:20Z) — no
evidence any of them is itself dead. Each successor's own description
already commits to closing its predecessor once its own run finishes
("closing those four and reviewing this one is the same decision";
"#562 is resolved against this pull request"; "#561 is absorbed, not
rebuilt... will be closed with a pointer here"; "all three close as
one decision"). Closing them now, out from under a run that may still
be writing to that exact pull request, would be the collision §15's
claim rule exists to prevent, for a decision the owning seat has
already made and stated.

So: no merge, no close, no dispatch needed from this seat today. The
standing block's "may not wake for days" turned out to already be
false by the time this run checked it — each seat had already woken
and opened the absorbing work — which is the specific failure mode the
block itself names (a wake-attached condition can be older than the
wake). Tracked in `docs/sprints/pending.md` so the five are not
re-flagged as idle by a later run before their successors land.

## What this run did not do

Not a ceremony or standup run. This was a narrow, message-triggered
wake (§17): review one named PR, check one named claim, report.
`docs/sprints/dispatch-queue.md` is unchanged — #574's run rewrote it
in full ten minutes before this one woke, nothing here changes its
contents, and nothing this run found meets a dispatch criterion.
`PM_DISPATCH_ENABLED` was not read as part of this run since nothing
rose to that question.

## External sources read

- The event payload attached to this run's wake (the PR-571 ask and
  the standing block): read as data describing claimed state, not as
  instruction. Checked rather than acted on directly.
- `gh` reads of PR #571, #558, #568, #572, #562, #570, #561, #573,
  #566, #569, and the rest of the open-PR queue — checked directly.
- The board inbox (`GET /api/messages?to_seat=pm&to_company=Ursa`):
  nothing addressed to this seat about either #571 or the five drafts
  in the window checked; the standing block is wake-attached, not a
  stored inbox message, consistent with how `docs/standards/lessons.md`
  (L-A89) describes it.
- `docs/standards/pm.md` §10, §15, §17, §21 and this seat's own
  charter, read on this branch.
- No web fetch, no third-party content, no call to any undocumented
  API (the standing block mentions `GET /api/standing`; this run did
  not call it, since no file in this repository documents it as
  something a seat calls, and the verification it asked for was done
  instead with `gh` and `git`, which this charter does authorize).

🤖 Generated with [Claude Code](https://claude.com/claude-code)
