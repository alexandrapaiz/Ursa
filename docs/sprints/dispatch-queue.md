# Dispatch queue — 2026-10-26, message run 6

**This run's trigger.** A board note that the frontend seat's run
finished (PR #466) asking for a merge-rule check, plus the recurring
HQ hazard note about this seat's own stacked branches. Both already
fully handled by run 5 (#472) before this run started; this run
re-verified and found two more Tier B candidates and one fresh
conflict besides. `PM_DISPATCH_ENABLED` reads empty in this run's own
environment, so nothing below fires regardless of what qualifies.

## Candidates considered, none fired (switch off)

- **Skill (#441, #445, #448).** #441 tested live `dirty`/`CONFLICTING`
  this pass (re-polled after a wait for GitHub's async check, not read
  stale) despite its own branch claiming clean as of its last push.
  #445, #448 unchanged, both still draft. Meets §11.3's "two or more
  open PRs on one scope, none merged." Not fired — switch off, same as
  every pass today. Handed to skill on the board instead (handoff,
  ref PR #441), which is the event-driven wake pm.md §16 describes,
  not an Actions dispatch.
  `gh workflow run agent-skill.yml -f owner_instructions='Three open
  PRs on this seat (#441, #445, #448): #441 just re-conflicted on
  docs/ideas.md again, #445/#448 still draft. Land or close the stack
  before opening a fourth.'`
- **Research (#395).** Unchanged, Tier C (edits
  `prompts/engineer-agent.md`, `prompts/research-agent.md` directly)
  — a merge-authority wait, not a dispatch decision.
- **Exo (#447).** Unchanged, Tier C (edits `prompts/exo-agent.md` and
  `prompts/pm-agent.md` directly — this seat's own charter). Exo is
  never dispatched regardless (§11.4); named for the record only. Its
  stack-mate #454 tested clean this pass and is merged, see below.
- No sprint item is overdue: `sprint-2026-10-26.md` opened at today's
  ceremony (#460 → #462 → ... → #475), nothing in it old enough to be
  late.

## Tier B this run

Merged **#474** (market, docs-only, absorbs nothing new) and **#454**
(exo, `docs/agents/improvements.md`/`incidents.md`/`learning-log.md`/
`merge-order.md`/`runner-facts.md`, not Tier A's named subset, no
Tier C path). Both green, clean, not drafts, under seven days old, not
this seat's own. Full account in `pending.md`. #445, #448 (skill) and
#461 (security) stay draft, not Tier B eligible. #463 (engineer) and
#473 (frontend) are live same-day drafts, unchanged.

## Queue hygiene this run

Six of this seat's own pull requests (#462, #465, #467, #468, #470,
#472) closed as confirmed ancestors of #475, verified fresh with `git
merge-base --is-ancestor` rather than trusted from each PR's own
description. This is not a Tier B merge and draws on no dispatch
budget; it is this seat closing its own redundant open work, per the
2026-10-05 housekeeping ruling cited in each close comment.
