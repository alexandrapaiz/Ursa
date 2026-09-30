# Dispatch queue — 2026-09-30 (standup, owner present, ~03:15 UTC)

`PM_DISPATCH_ENABLED` is exactly `true`. Owner instruction for this run:
sync mode, read the board and its messages first, triage the last 24h
of failed runs in the PR, post one board note, dispatch per criteria.

## Proposed

None.

Every seat that could plausibly receive a dispatch is blocked by
§11.4's hard stop — never dispatch a seat whose last PR is still open,
unless told in those words to build on that branch:

- engineer: #43, #38, #36, #33, #32 all open
- research: #39, #19 both open
- frontend: #35, #15 both open
- security: #28 open
- market: #21 open
- skill: #14 open

The two seats whose last PR is *not* open, okr and finance, are not
due: okr is monthly on the 1st (next 2026-10-01, tomorrow), finance
the same day, and neither has an ADR or milestone naming it without a
run. Nothing in §11.3's table fires for either. The milestone "Sprint
2026-09-28" is due 2026-10-04 (four days out, past the three-day
window) with 0 issues attached to it on GitHub (the sprint's tracking
lives in the sprint file and the board, not milestone issues), so the
"milestone due within three days" row does not fire either.

The real gap this run observes is not seat idleness, it's the merge
queue: see "Failures" below and `docs/sprints/pending.md` for the
27-open-PR backlog. That gap is an owner action, not a dispatch.

## Dispatched by the PM

None this run.
