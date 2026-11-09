# Dispatch queue — 2026-11-09, message-triggered (twenty-third pass)

**Twenty-third message pass of today.** This pass merged one pull
request (`#834`, engineer) under Tier B after resolving a docs-only
conflict against `main` locally, confirmed the other four items named
on this wake were already stale (three already merged, one already
closed), and handed the next engineer-lane item to that seat's own
open stub on the board rather than through a workflow dispatch. See
`pending.md` and `docs/agents/pm-2026-11-09-message-23-run.md` for the
full account.

`gh run list --limit 30` shows no non-success run. `PM_DISPATCH_ENABLED`
is unset in this run's environment, so nothing below could fire from
this run regardless of the criteria table (host run, not a GitHub
Actions run — `gh workflow run agent-<seat>.yml`, pm.md §11.5, does not
apply here).

## Checked against the criteria table (pm.md §11.3) and Ursa's own three (§0b)

- **A seat run failed in the last 24h, diagnosable from its log:**
  none, per the read above.
- **A seat's open draft has failing CI, or a review comment unanswered
  >24h:** open drafts at the time of this check (`#836` frontend,
  `#837` security, `#838` skill, `#840` engineer, `#841` this pass's
  own) are all under an hour old; none has a review comment. None
  qualifies.
- **A sprint item due this week with no run from its owning seat:**
  unchanged — the newest sprint file is `sprint-2026-10-12.md`, 28
  days old, a ceremony-grooming finding already carried in
  `pending.md`, not this message-triggered pass's to open. Today is
  Monday; this run's own trigger is `message`, not the ceremony
  workflow, so opening it is not this pass's to do either.
- **A seat has two or more open PRs on one scope, none merged:** none
  observed this pass. Engineer's prior two-row shape (`#834`, `#840`)
  resolved itself when `#834` merged.
- **A ruling or ADR merged since the last run names a seat with no run
  following:** nothing new in `docs/decisions.md` since the last
  pass's own check.
- **A milestone due within three days with open items:** none.
- **Ursa's own three (§0b):** no tuning or trial run with unrecorded
  ledger results; no failing check on an open Minor-site or
  Major-resolver PR (none open); no ADR naming an experiment with no
  run started within two days.

## Handed on the board instead of fired, because dispatch cannot fire from this run anyway

1. **The redaction-gate's UUID pattern fix, handed to engineer's own
   open stub (`#840`).** Logged across several prior passes as a
   candidate for engineer and never fired, because engineer's lane was
   occupied every time this pass checked. `#840` is now a genuine open
   stub ("read the board for the next item"), so this pass posted a
   board handoff (id `3b594ac0`) naming the fix, the prior workaround
   (`#773`), and the reason it likely needs owner or HQ review once
   opened (the pattern lives in `.github/workflows/redaction-gate.yml`,
   outside a routine Tier B path). Not a workflow dispatch; a board
   message, which this environment's seats act on directly (pm.md
   §15, §17).

## Nothing else to fire this run

One pull request merged under Tier B this pass did not need a dispatch
to exist; merging an existing PR is not a dispatch. Confirming four
already-stale wake items is also not a dispatch. See
`docs/agents/pm-2026-11-09-message-23-run.md` for the full account.
