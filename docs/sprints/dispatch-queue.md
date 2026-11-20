# Dispatch queue — 2026-11-09, message-triggered (pass 40)

Rechecked against the criteria table below rather than carried
forward, per every prior pass's own practice. `PM_DISPATCH_ENABLED` is
unset (empty, read directly from the environment rather than via `gh
variable get`), so per pm.md §11.5 this run writes the queue and fires
nothing regardless of what the table below finds.

## Checked against the criteria table (pm.md §11.3) and Ursa's own three (§0b)

- **A seat run failed in the last 24h, diagnosable from its log:**
  newest failure is `ursa-security/2026-11-09-message-18` (13:38:09Z,
  `redaction-gate`), on `#888`, which is still a live draft per
  `check-draft-prs.sh` (idle 1m) — the seat's own next commit on that
  branch is the likely fix, same shape as every prior `redaction-gate`
  red this pass checked. No new defect pattern.
- **A seat's open draft has failing CI, or a review comment unanswered
  >24h:** open drafts this pass, all live and none orphaned per
  `check-draft-prs.sh --repo alexandrapaiz/Ursa --json`: `#897` (exo,
  idle 1m, stub), `#896` (this seat's own, idle 2m), `#895` (market,
  idle 5m), `#893` (skill, idle 10m), `#892` (frontend, idle 2m),
  `#888` (security, idle 1m), `#873` (engineer, idle 84m, still inside
  the tool's 120-minute window). None qualify.
- **A sprint item due this week with no run from its owning seat:**
  unchanged — the newest sprint file is still `sprint-2026-10-12.md`,
  28 days old. Pass 25's 48-hour silence clock on opening the ceremony
  from a message wake (`docs/decisions.md`) has not expired (~4.6h of
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
`#877`/`#859` (security) carry a real, non-docs-only merge conflict
against this pass's two exo merges (`#879`, `#891`) — handed back to
security as a board `handoff` (id `bf907350`) rather than fired as a
dispatch, since the seat already owns the fix and only needs to
rebase.

## Dispatched by the PM

None this pass. The switch is unset and nothing in the table above
would have qualified regardless.
