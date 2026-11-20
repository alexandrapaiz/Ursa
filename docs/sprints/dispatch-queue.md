# Dispatch queue — 2026-11-09, message-triggered (pass 39)

Rechecked against the criteria table below rather than carried
forward, per every prior pass's own practice. `PM_DISPATCH_ENABLED` is
unset (empty, read directly from the environment rather than via `gh
variable get`), so per pm.md §11.5 this run writes the queue and fires
nothing regardless of what the table below finds.

## Checked against the criteria table (pm.md §11.3) and Ursa's own three (§0b)

- **A seat run failed in the last 24h, diagnosable from its log:**
  `gh run list --status failure --created >=24h ago` shows only
  `redaction-gate` failures, all on branches checked out against
  stale merge-refs from before earlier same-day fixes landed on
  `main` (the known shape from passes 29-31). No new defect.
- **A seat's open draft has failing CI, or a review comment unanswered
  >24h:** open drafts this pass: `#873` (engineer, live per
  `check-draft-prs.sh`, idle 36m), `#877` (security, live, idle 16m,
  `CONFLICTING` per GitHub but still an active run), `#879` (exo, live,
  idle 4m), `#882` (frontend, live, idle 3m), `#887` (skill, live, idle
  5m), `#888` (security, just opened), `#889` (market, just opened).
  All within the liveness window; none orphaned, none qualify.
- **A sprint item due this week with no run from its owning seat:**
  unchanged — the newest sprint file is still `sprint-2026-10-12.md`,
  28 days old. Pass 25's 48-hour silence clock on opening the ceremony
  from a message wake (`docs/decisions.md`) has not expired (~4h of
  48h elapsed). Not repeating the full escalation here; see
  `pending.md`.
- **A seat has two or more open PRs on one scope, none merged:** exo
  has two open (`#826`, `#833`), both already held at Tier C by path
  (`prompts/exo-agent.md`), unchanged from pass 28's finding. Not a
  dispatch case.
- **A ruling or ADR merged since the last run names a seat with no run
  following:** nothing new since pass 25's ceremony-gap finding.
- **A milestone due within three days with open items:** `Sprint
  2026-11-09 — The sweep gets an answer, and the briefing gets used`
  is due 2026-11-15 (six days out) with 0 open issues and 1 closed —
  outside the three-day window and already clear.
- **Ursa's own three (§0b):** no tuning or trial run with unrecorded
  ledger results; no failing check on an open Minor-site or
  Major-resolver PR (none open); no ADR naming an experiment with no
  run started within two days.

## Logged, not fired

`#826` and `#833` (exo) stay Tier C by path, unchanged from pass 28.
`#877` (security) is the branch exo's own handoff asked this seat to
merge ahead of its own rows once it clears draft and conflict state —
logged as the next thing to check, not fired as a dispatch, since the
seat already has a live run on it.

## Dispatched by the PM

None this pass. The switch is unset and nothing in the table above
would have qualified regardless.
