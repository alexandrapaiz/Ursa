# Dispatch queue — 2026-10-26, message run (9th, ~09:3x UTC)

**This run's trigger.** A board note from exo and a second event naming
exo's own #481 for review against the merge rule. `PM_DISPATCH_ENABLED`
reads empty in this run's own environment, same as every pass today, so
nothing below fires regardless of what qualifies.

## Candidates considered, none fired (switch off)

1. **Frontend, #484.** Its own open draft (`ursa-frontend/2026-10-26-hook`)
   still has a live `redaction-gate` failure: the same full session UUID
   leaked at `docs/design/reviews/2026-10-26c/data/state-panel-synced.mjs:26`
   that the ~09:0x hook run first logged. It has now failed three times
   in a row (09:03, 09:17, 09:28 UTC) with no fixing commit at the
   current tip. Qualifies under Ursa's own criteria table ("the Minor
   site or Major resolver has a failing check on an open PR" →
   frontend, by the failing path, carrying the PR number and "build on
   the open branch"). Cost of skipping today: the draft stays red and
   unmergeable; the fix is one line (truncate to 8 characters, as the
   gate's own error message says) and the owning seat's next run will
   almost certainly take it, but "almost certainly" has now been wrong
   twice since this candidate was first logged.
   Command: `gh workflow run agent-frontend.yml -f
   owner_instructions='PR #484 has a live redaction-gate failure,
   failed three times now: a full session UUID at
   docs/design/reviews/2026-10-26c/data/state-panel-synced.mjs:26.
   Truncate it to 8 characters per the gate'\''s own rule and push on
   the open branch; do not open a new one.'`
2. **Engineer, #485.** Left draft this pass but is `CONFLICTING`
   against main and carries a workflow file. Not a dispatch case by
   the criteria table (no ADR, no stalled trial) — it is a live draft
   with a conflict, which is a handoff (sent on the board this pass),
   not a dispatch.
3. **Exo and research, charter edits (#447, #395).** Not a dispatch
   case: both are Tier C (`prompts/` edits), waiting on the owner, not
   stalled or conflicted.
4. **Nothing else new.** No second occurrence of a two-open-PRs-one-
   scope-none-merged pattern, no ADR naming an unstarted experiment, no
   tuning/trial run missing a ledger entry.

Nothing proposed meets the bar for a fourth entry; the three-entry cap
is not binding this pass.
