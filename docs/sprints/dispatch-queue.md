# Dispatch queue — 2026-09-29 (standup, ~16:48 UTC scheduled run)

`PM_DISPATCH_ENABLED` is exactly `true`. Read: `gh run list --limit 30`,
`gh pr list --state open` (18 open PRs, checked individually for
draft state, CI and reviews), `docs/sprints/pending.md`, the current
sprint file (`docs/sprints/sprint-2026-09-21.md`, still the one on
`main`), `docs/decisions.md`, and the open milestone.

## Proposed

None. Two independent reasons, either one sufficient on its own:

1. **Every active seat's most recent PR is currently open.** engineer
   (#36, opened today 02:41 UTC), frontend (#35), market (#21), skill
   (#14), research (#19), security (#28). §11.4's hard stop forbids
   dispatching any seat whose last PR is open unless an instruction
   names that exact branch to build on — nothing observed this run does
   that for any seat. This alone empties the queue.
2. **Nothing in §11.3 fires.** Checked each row against this run's
   evidence:
   - No seat run failed in the last 24h (`gh run list --limit 30`:
     every run since 2026-09-28T18:39Z is `success`; the one `failure`
     in the window, `engineer/2026-09-28-record-integrity-gate` at
     02:03:39Z, is outside 24h and was already fixed by the next push
     on the same PR three minutes later).
   - No open PR has failing CI or an unanswered review comment: all 18
     open PRs show `SUCCESS` on every check, zero are draft, and all
     but #20 have zero reviews and zero comments. PR #20's one comment
     is the owner's own note on her own PR (ADR-007 proposal,
     2026-09-26), not a question waiting on this seat.
   - No ADR or ruling merged since the last run names a seat with no
     run following: `docs/decisions.md` still ends at ADR-006; the
     ADR-007 proposal in PR #20 is still open, not merged.
   - The open milestone ("Sprint 2026-09-28", #2) is due 2026-10-04,
     five days out, outside the three-day window.
   - No owner-merge PR has crossed seven days yet: oldest open PR is
     #13, opened 2026-09-24 15:53Z, five days old.

## Observed, not queued

- **`research-agent`'s Tuesday 13:15 UTC cron (today) has not fired.**
  `gh run list --workflow=research-agent` shows exactly one run ever,
  2026-09-25 (Friday), nothing today by 16:48Z. This isn't
  log-diagnosable (there is no log — the run never started), so §11.3's
  first row doesn't apply as written, and hard stop 1 above blocks a
  research dispatch regardless (its last PR, #19, is still open). Worth
  a second look at tomorrow's standup if Friday's occurrence also goes
  missing; a single miss matches the "cron fires late" pattern already
  seen and self-resolved for four other seats in the 2026-09-24/25
  window (see prior `pending.md` entries), so it isn't flagged as an
  owner action yet.
- **Engineer's `next-rce-breakfix` PR (#36)** already answers the
  critical Next.js RCE the security audit (#28) surfaced — the org
  responding to a ledger finding within two days without needing a PM
  dispatch, so no action needed here either.

## Dispatched by the PM

None this run.
