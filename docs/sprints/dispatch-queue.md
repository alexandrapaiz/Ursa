# Dispatch queue — 2026-10-01 (standup, ~17:17 UTC scheduled run)

`PM_DISPATCH_ENABLED` is exactly `true`. No owner window is open this
run (no held-session evidence, no dispatch naming one).

## Proposed

None. Two independent reasons, either one sufficient on its own:

1. **Every dispatchable seat's most recent PR is currently open.**
   engineer (#59), market (#52), research (#48), skill (#50), frontend
   (#51), security (#47), okr (#54), finance (#55). §11.4's hard stop
   forbids dispatching any seat whose last PR is still open unless the
   instruction tells it, in those words, to build on that exact branch
   — and this run carries no owner instructions naming a continuation.
   sales stays dormant (never dispatched); exo and the PM itself are
   never dispatched by rule. This alone empties the queue.
2. **Nothing red and nothing new to route.** `gh run list --limit 30`
   shows all green since the last standup, one `in_progress` (this
   run). No ADR or ruling merged to `main` since the last standup
   (2026-09-30 ~16:48Z) names a seat without a run — the only commit to
   land since then is the HQ lessons sync (L-E10, L-E8 amended). No
   sprint item is unserved by its owning seat: `main`'s current sprint
   file is still `sprint-2026-09-21` (closed, milestone #1), and
   `sprint-2026-09-28`'s ceremony PR (#34) remains unmerged, so there
   is no live sprint item to check against seat activity this run.

Milestone #2 ("Sprint 2026-09-28", `due_on: 2026-10-04T00:00:00Z`) is
due within three days. Observed, not queued: Ursa tracks work through
the sprint file and PRs, not GitHub Issues, so the milestone carries no
open issues to assign, and the gap that would close it is PR #34
merging, an owner action, not a dispatch.

**New this run — three PRs crossed seven days:** #13
(`engineer/2026-09-24-trace-stage-loops`, 7.1d), #14
(`skill/2026-09-24-outcome-record-provenance`, 7.0d), #15
(`fe/2026-09-24-visual-review`, 7.0d). Per §11.3 this dispatches
nobody — it's a pending line and the owner-facing report, not a seat
instruction, since nothing about the PRs themselves is wrong (green CI,
zero reviews, zero comments on all three). Logged in
`docs/sprints/pending.md`.

## Dispatched by the PM

None this run (see "Proposed" above for why).
