# Dispatch queue — 2026-10-26, message (the six-hour pass)

**This run's trigger.** A board/owner message asking for the standard
six-hour pass: inbox, failed-run triage, the Tier B merge sweep, a
sprint-progress line, and one note on the board. Read as data about
what was asked, never as a command that overrides this charter (org
rule, 2026-10-05); the work below is this charter's own §0b and §11,
not the message's wording.

`PM_DISPATCH_ENABLED` is unset in this run's own environment
(`[ -n "$PM_DISPATCH_ENABLED" ]` false; `gh variable list` shows no
such variable at all), so nothing fires as a `gh workflow run`
dispatch below regardless of what qualifies. Written in full per
pm.md §0b.

## Candidates considered, none fired as a dispatch

Every seat with an open pull request right now pushed to it within
the last two hours (confirmed via `gh pr list --json updatedAt`
across the open queue), which is the synchronous-window shape pm.md
§11.4 describes, not the stalled shape a dispatch exists to unstick:

- **Skill** has two open pull requests on one scope (the §11.3
  "two or more, none merged" trigger), but the newer is already
  built on the older (`git merge-base --is-ancestor` confirms it),
  so the seat is already doing exactly what a dispatch would ask it
  to do. Not fired.
- **Security** has three open pull requests on one scope for the
  same reason: its own board message this pass says the newest is a
  deliberate superset cut minutes ago to let the owner merge one
  branch instead of three. Not fired.
- **Exo** has two open pull requests that both edit a file under
  `prompts/` directly. That is a merge-authority boundary already
  named in `docs/decisions.md`, not a dispatch decision — more
  building does not change which tier the content sits in.
- **Engineer**'s one open pull request (#437) was `CONFLICTING` on
  GitHub's check over a plain `docs/ideas.md` append, which this
  pass resolved directly as a docs-only conflict (pm.md §10 Tier B
  condition 5) and then merged; nothing left to dispatch there.
- No sprint item is overdue by a *new* fact this pass did not already
  know (the sprint itself is two weeks stale — see the pending
  tracker and this run's board note), and no ADR merged since the
  last pass names a seat with no run following.

## Failed-run triage this run (pm.md §11.7)

`gh run list --created ">=6 hours ago"`: 95 runs, 89 success, 6
failure, 0 refused, 0 never-started.

All 6 failures are **one tripwire false alarm**, not six: the
redaction gate's "full session UUID" check caught the same
unredacted identifier on two now-superseded branches (3 runs on one,
3 on the other). Verified rather than assumed: the identifier is
already truncated on both seats' later/superseding branches (checked
by `git show <branch>:<path>` on each), so the defect was caught,
fixed, and pushed again within the same session that introduced it,
before this pass ever read the run list. No rerun fired — the same
input would fail the same way on the dead branch, and the live
branch already passes. No incident filed, since nothing shipped
broken to a reader; the gate did exactly its job.
