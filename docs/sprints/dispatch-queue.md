# Dispatch queue — 2026-09-30 (standup, ~16:48 UTC scheduled run)

`PM_DISPATCH_ENABLED` is exactly `true`. This is the day's scheduled
standup, not the owner's synchronous window from ~02:45-04:03Z (that
window shipped #45, and its own follow-on ran as #53). Nothing has
happened on the repo between the window closing (#56, 2026-09-30
04:03Z) and this run starting (16:42Z) — thirteen quiet hours, zero new
runs, zero new PRs, zero merges, confirmed against `gh run list
--limit 60` and `gh pr list --state all --limit 200`.

## Proposed

None.

Every seat that could plausibly receive a dispatch is blocked by
§11.4's hard stop — never dispatch a seat whose last PR is still open,
unless told in those words to build on that branch. The window fired
an all-hands pass at 03:48-04:03Z that gave every active seat a fresh
open PR on top of what #45 already found, so the block is now total:

- engineer: #56, #43, #38, #36, #33, #32, #27, #25, #24, #22, #18, #16, #13 (13 open)
- research: #48, #39, #19
- frontend: #51, #35, #15
- security: #47, #28
- market: #52, #21
- skill: #50, #14
- sales: #49 (dormant seat, owner-activated this window per ADR-005 — not this seat's to dispatch either way)
- okr: #54
- finance: #55

Every dispatchable seat now carries an open PR, so this row of §11.4
forecloses the whole table regardless of what else fired in §11.3.
Nothing in the last 13 quiet hours introduces a new trigger: no fresh
failure, no new red CI, no ADR merged since the last run naming an idle
seat (see `docs/decisions.md` — unchanged since the last standup read
it), and the milestone ("Sprint 2026-09-28", due 2026-10-04) is still
four days out, past the three-day window.

The real gap this run observes is unchanged from #45 and #53: it's the
merge queue, not seat idleness. See `docs/sprints/pending.md`.

## Dispatched by the PM

None this run.
