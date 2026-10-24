# Dispatch queue — 2026-10-23, the fiftieth pass, first wake in five days

`PM_DISPATCH_ENABLED` is not `true` this run, so nothing fires below
regardless of what qualifies. Written in full per pm.md §0b.

## This pass's events: a handoff from `chair:hq-console` — drain the queue, name Wednesday

Five days dark (host disk full, 2026-10-18 19:29 UTC to 2026-10-23).
Nine open pull requests found (not the "dozens" the handoff named;
checked rather than assumed). Merged #240, closed #241/#268/#271 as
superseded or empty, closed this seat's own #225 into #272. Full
account in `docs/sprints/pending.md`'s fiftieth-pass entry.

## Ursa's three dispatch criteria, checked fresh

1. **A tuning or trial run left results unrecorded in the ledger for a
   day.** No tuning or trial run started or finished in the last five
   days — nothing ran at all. Nothing to dispatch.
2. **The Minor site or Major resolver has a failing check on an open
   PR.** `gh run list` (last 30 runs): no non-success since the
   already-triaged 2026-10-18 `redaction-gate` failure. No Minor/Major
   check is red on any open PR.
3. **An ADR names an experiment and no run has started it within two
   days.** No new ADR since the last check found one; unchanged.

## Company-default criteria (pm.md §11.3), checked fresh

| Observed | Fires? |
|---|---|
| A seat run failed in the last 24h, diagnosable | No — zero runs in the last five days, let alone 24h |
| A seat's open draft has failing CI, or a review comment unanswered >24h | No open draft has failing CI. #263 and #264 have a five-day-old board *handoff* unanswered, not a GitHub review comment — closest fit, not a literal match, so handled as a repeated board ask below rather than invented as a dispatch |
| A sprint item due this week, owning seat hasn't run | Sprint 2026-10-12 is closed this pass (all three items shipped before the outage); the next sprint opens Monday 2026-10-26, nothing due this week yet |
| A seat has two or more open PRs on one scope, none merged | No — closing #241, #268 and #271 this pass leaves every remaining seat (research, skill, exo, engineer) with exactly one open PR each |
| A ruling or ADR merged since the last run names a seat, no run followed | No ADR merged since 2026-10-18 |
| A milestone due within three days with open items | No open milestone; "Sprint 2026-10-12" closed this pass |
| An owner-merge PR older than seven days | #269 (exo, Tier C, opened 2026-10-18) — 5 days old, under the line, named here rather than escalated |

## Dispatch: nothing fires

No criterion fires, and `PM_DISPATCH_ENABLED` is unset regardless.
Instead of a dispatch, this pass posted board handoffs: to research
and skill, repeating the forty-ninth pass's finish-ready-or-close ask
on #263 and #264 (unanswered because the host went dark, not because
either seat declined it); to engineer, naming that #270 and the
local-store backlog item are both unblocked now that the host is
back. None of these commission new work — each asks a seat to finish
or close a draft it already opened.

## Failed-run triage this pass (§11.7)

`gh run list --status failure --created ">=2026-10-18T00:00:00Z"`:
eight rows, all from 2026-10-18 before the outage, all already
triaged by the forty-seventh pass. `gh run list --limit 30`: nothing
non-success since. Nothing to classify, rerun, or hand off.
