# Dispatch queue — 2026-10-26, hook run (~09:0x UTC)

**This run's trigger.** The scheduled hook, after a capacity gap since
run 7 (#479, 06:19 UTC). `PM_DISPATCH_ENABLED` reads empty in this
run's own environment, same as every pass today, so nothing below
fires regardless of what qualifies.

## Candidates considered, none fired (switch off)

1. **Frontend, #484.** Its own open draft (`ursa-frontend/2026-10-26-hook`)
   has a live `redaction-gate` failure: a full session UUID leaked at
   `docs/design/reviews/2026-10-26c/data/state-panel-synced.mjs:26`.
   Qualifies under Ursa's own criteria table ("the Minor site or Major
   resolver has a failing check on an open PR" → frontend, by the
   failing path, carrying the PR number and "build on the open
   branch" — the named exception to "never a seat with an open PR").
   Cost of skipping today: none beyond the draft staying red; it's a
   one-line fix and the owning seat's next run (cron or hook) will
   almost certainly pick it up before this matters.
   Command: `gh workflow run agent-frontend.yml -f
   owner_instructions='PR #484 has a live redaction-gate failure: a
   full session UUID at
   docs/design/reviews/2026-10-26c/data/state-panel-synced.mjs:26.
   Truncate it to 8 characters per the gate'\''s own rule and push on
   the open branch; do not open a new one.'`
2. **Exo and research, charter edits (#447, #395).** Not a dispatch
   case: both are Tier C (`prompts/` edits), waiting on the owner, not
   stalled or conflicted. #395 already carries an owner comment.
3. **Nothing else new since run 7's own check six hours ago.** No
   second occurrence of a two-open-PRs-one-scope-none-merged pattern,
   no ADR naming an unstarted experiment, no tuning/trial run missing
   a ledger entry — checked against the same evidence run 7 already
   gathered (`gh pr list --state open`), nothing has changed shape
   since except the five new PRs this pass's own standup accounts for
   above.

Nothing proposed meets the bar for a fourth entry; the three-entry cap
is not binding this pass.
