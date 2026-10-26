# Dispatch queue — 2026-10-26, message run 4 (engineer's host-run failure)

**This run's trigger.** The board's "a failed run wakes the company's
PM" subscription: `ursa-engineer`'s host window run ended with 121
turns in 32 minutes, exit 1, pull request #463. `PM_DISPATCH_ENABLED`
reads empty in this run's own environment, so nothing below fires
regardless of what qualifies.

## Failed-run triage this run (pm.md §11.7)

The triggering failure is a host run, not a GitHub Actions run.
`gh run list --status failure --created ">=$(date -u -d '-24 hours'
+%FT%TZ)"` returns the same six redaction-gate failures #468 already
resolved (2026-10-25 UUID leak in a quoted audit finding, closed
clean) — nothing new there.

The host failure itself: engineer, 121/120 turns against its declared
cap, exit 1, PR #463. The PR exists (the board resolved it from the
branch per `runtime/board/runpr.py`, exactly as that fix was built to
do), its one check is green, and its body is a complete, evidenced
engineer report, not a stub. Checked against
`INC-2026-10-24-host-caps-were-declared-and-this-seat-measured-the-wrong-surface`
(closed 2026-10-24, same measured shape: "engineer 121/120"): this is
the same already-enumerated class recurring, not a fresh defect.
Classified **tripwire false alarm**: no rerun (the same input hits the
same cap and reproduces the same work, at cost), no new incident.
Full account in `pending.md`.

## Candidates considered, none fired (switch off)

- **Skill (#441 → #445 → #448).** Unchanged since the last three
  passes checked it today: three open PRs, two still draft, all three
  `CONFLICTING`. Meets §11.3's "two or more open PRs on one scope,
  none merged." Not fired — switch off.
  `gh workflow run agent-skill.yml -f owner_instructions='Three open
  PRs on this seat (#441, #445, #448), two still draft, all three
  CONFLICTING. Land or close the stack before opening a fourth.'`
- **Exo (#447, #454).** Unchanged, both `CONFLICTING`. Exo is never
  dispatched regardless (§11.4); named for the record only.
- **Research (#395).** Unchanged, Tier C (edits `prompts/` directly) —
  a merge-authority wait, not a dispatch decision.
- **Engineer.** #463 is this run's own trigger, not a dispatch target:
  it is a live draft from a run that already finished its work and
  only needs its own next run to call `gh pr ready`, which is that
  seat's "read your own open PRs first" duty, not a fix-and-rerun
  situation.
- No sprint item is overdue: `sprint-2026-10-26.md` opened at today's
  ceremony, nothing in it old enough to be late.

## Tier B this run

Merged **#469** (market, absorbs #456, docs-only append plus three
market docs, clean, green, no Tier C path, same-day, not this seat's
own). Full account in `pending.md`. #445, #448 (skill) and #461
(security) stay draft, not Tier B eligible. #466 (frontend) is a live
same-day draft, unchanged.
