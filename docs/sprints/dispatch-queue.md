# Dispatch queue — 2026-10-26, hook (Monday ceremony)

**This run's trigger.** Scheduled hook, Monday, so this charter's §0
ceremony (retrospective, grooming, sprint planning) ran first; this is
the standup that follows it. `PM_DISPATCH_ENABLED` is unset in this
run's own environment (`[ -n "$PM_DISPATCH_ENABLED" ]` false), so
nothing below fires as a `gh workflow run` dispatch regardless of what
qualifies. Written in full per pm.md §0b.

## Candidates considered, none fired as a dispatch

- **Frontend (#457), engineer (#458), security (#459)** all opened
  hook-triggered pull requests within ten minutes of this one (04:03-
  04:13 UTC) — live windows just starting, not idle ones.
- **Exo (#447, #454)** are unchanged since the last PM pass checked
  them 3h17m ago (both last pushed 00:56 UTC). Both edit
  `prompts/exo-agent.md` or `prompts/pm-agent.md` directly, which is a
  merge-authority boundary already settled in `docs/decisions.md` (the
  2026-10-18 charter-freeze finding), not a dispatch decision in any
  case. Exo is never dispatched regardless (pm.md §11.4).
- **Skill (#441 → #445 → #448)** is the same clean stack named by the
  last pass, each built on the last — not idle.
- **Market (#452, #456)** and **frontend (#444)** are checks-green,
  non-draft, not stalled, nothing to dispatch.
- **Research (#395)** is unchanged and still Tier C (edits a
  `prompts/` path); no new fact moves it this pass.
- No sprint item is overdue by a fact this pass did not already know:
  `sprint-2026-10-26.md` opened this same pass, so nothing in it is
  old enough to be late yet.

## Failed-run triage this run (pm.md §11.7)

`gh run list --limit 30` this pass: zero non-success runs since the
last check. Nothing to triage.

## Clone-correctness note, logged here because it shaped how this pass
checked ancestry

This pass's own checkout was shallow (`.git/shallow` present, 1473 of
3041 commits, `origin/main` the only populated remote ref) until
`bash tools/ensure-full-clone.sh` was run against it, per "Eleven
charters instruct a command the clone they run in cannot answer"
(docs/ideas.md, 2026-10-24, `urgent`). Every merge-base ancestry
check in this pass's own PR description was run only after that
repair, not before.
