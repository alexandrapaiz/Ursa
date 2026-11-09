# Dispatch queue — 2026-11-09, message-triggered (pass 28)

Rechecked fresh against the criteria table below rather than carried
forward, per every prior pass's own practice.

`gh variable get PM_DISPATCH_ENABLED` returns HTTP 403 on this run's
token, the same wall every host pass has hit since 2026-10-17, and
`GITHUB_ACTIONS` is unset, confirming this is a host run rather than a
GitHub Actions run. `gh workflow run agent-<seat>.yml` would not apply
here even if the switch read `true`. This is logged as queue
information for the owner, not as a plan this run executes.

## Checked against the criteria table (pm.md §11.3) and Ursa's own three (§0b)

- **A seat run failed in the last 24h, diagnosable from its log:**
  `gh run list --limit 20` showed exactly one failure, and it was this
  pass's own: a full UUID citation left in
  `docs/agents/pm-2026-11-09-message-27-run.md` by the prior pass
  tripped the redaction gate's own false-positive on cited identifiers
  (the exact class `#840` already diagnosed and could not fully fix,
  since the workflow fix is outside engineer's writable surface).
  Fixed in this branch by truncating it to 8 characters, the
  convention other seats already use. No other seat's run failed.
- **A seat's open draft has failing CI, or a review comment unanswered
  >24h:** four drafts open (`#857` ursa-skill, `#854` ursa-exo, `#853`
  ursa-engineer, `#852` ursa-security), all opened or updated within
  the last few minutes of this run, all "opening, no work yet" or a
  fresh finding — live runs, not orphans. None qualify.
- **A sprint item due this week with no run from its owning seat:**
  unchanged. The newest sprint file is still `sprint-2026-10-12.md`,
  28 days old; the ceremony gap stays escalated in `docs/decisions.md`
  (pass 25) rather than repeated here.
- **A seat has two or more open PRs on one scope, none merged:** none
  found this pass, beyond this seat's own now-closed chain (see
  `pending.md`).
- **A ruling or ADR merged since the last run names a seat with no run
  following:** nothing new in `docs/decisions.md` since pass 25's
  ceremony-gap finding.
- **A milestone due within three days with open items:** none found.
- **Ursa's own three (§0b):** no tuning or trial run with unrecorded
  ledger results; no failing check on an open Minor-site or
  Major-resolver PR (none open); no ADR naming an experiment with no
  run started within two days.

## Logged, not fired

`#846` (exo, window 109) is Tier C by path (`prompts/exo-agent.md`
amended) and waits on the owner, logged in `docs/sprints/pending.md`
rather than here, since it needs a merge decision and not a dispatch.
Replied to exo's handoff on the board (message `9b221269`) confirming
this and that nothing more is owed back to that seat on this row.

The redaction-gate workflow patch
(`docs/security/redaction-gate-uuid-narrowing.patch`, landed by `#840`)
still needs the owner or HQ to run `git apply`. Logged in `pending.md`
and already routed as a board handoff to
`alexandra-systems/exo-centralizer` by an earlier pass; it is an
application step, not something a dispatch would produce, and nobody
has applied it yet.

## Dispatched by the PM

None this pass. The token cannot read the switch, this is not a
GitHub Actions run, and the criteria table above found nothing that
would have qualified regardless.
