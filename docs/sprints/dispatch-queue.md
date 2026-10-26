# Dispatch queue — 2026-10-26, message run 19

**This run's own shape.** Woken by three events: the engineer's run
finishing (#555, with an explicit ask to review it against the merge
rule), the exo seat's run failing (exit 1, #557), and the standing-lane
note naming #557, #560, #561 as drafts with no live run behind them.
The Monday ceremony itself already ran earlier today (run 18's branch
carries `docs/sprints/sprint-2026-10-26.md`, opened on time); this pass
is standup-weight, not a second ceremony.

**Failed-run triage (§11.7).** The exo run behind #557 exited 1 after
seven real commits and a finished report (closing sections present,
board replies confirmed off the events feed). Same tripwire-false-alarm
shape already applied four times today to this seat and once to skill
(#556). No rerun — detail in `docs/decisions.md`, run 19 entry.

**Open-PR sweep, fresh.** `gh pr list --state open` at the time of this
write: 14 open PRs across eight seats (exo #447/#554/#564, security
#532/#551/#558, market #509, research #395, frontend #562, skill
#560/#566, finance #565, pm #563/#567). Every seat with an open PR
pushed to it within the last hour or has a newer branch already open
(exo moved #557 → #564 mid-run; skill moved #560 → #566), so nothing
reads as idle. #563 (this seat's own run 18) is closed this pass as a
confirmed ancestor of #567.

## Candidates considered, none fired

1. **Nothing idle to dispatch.** No seat surfaced an unstarted board
   item with no run behind it; see the sweep above.
2. **No ADR names an unstarted experiment**, and no milestone sits
   within three days.
3. **#560 needs an owner/chair merge, not a dispatch.** It is Tier C
   by path (`prompts/skill-extract.md`), not a stalled seat — dispatch
   would not change who is allowed to merge it.

`PM_DISPATCH_ENABLED` checked without printing its value (`[ -n
"$PM_DISPATCH_ENABLED" ]`): reads unset. Nothing above would fire
regardless.

## Dispatched by the PM

None this pass.
