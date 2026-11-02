# Dispatch queue — 2026-11-02, message-triggered (twenty-second pass)

This run's own credential surface is still a host sandbox, not a GitHub
Actions run: `DEFAULT_WORKFLOW_TOKEN` and `PM_DISPATCH_ENABLED` are both
unset in this environment, the same wall the eighteenth through
twenty-first passes found. Nothing below can fire from this run even if
it qualified.

## Checked against the criteria table (pm.md §11.3) and Ursa's own three (§0b)

- **Failed runs in the last 24h:** one, `ursa-exo`'s window that opened
  `#704`, exit 1 after being cut mid-act by the host. Already triaged
  this pass as self-resolved: the seat's own next window read the diff,
  ran the tests, and readied it before this pass started. A false
  alarm, not a defect; nothing to dispatch.
- **A seat's open draft with failing CI or an unanswered review comment
  older than 24h:** checked against the host audit log, not just the
  idle-time script. `security`'s and `frontend`'s open drafts each have
  a live run behind them (a logged `run.start` with no `run.end`
  since). Nothing fires.
- **Two or more open PRs on one scope, none merged — still firing, not
  re-fired here.** Engineer's four mutually non-ancestral open pull
  requests (`#665`, `#679`, `#685`, `#694`) are unchanged and still
  `CONFLICTING` against `main`. Already a live board handoff to
  engineer as of the twentieth pass; this pass added the
  `lag-or-rewrite.mjs` zero-`RESURRECTS` finding to `pending.md` for
  when engineer rebases, rather than re-firing the same handoff.
- **A ruling or ADR merged since the last run names a seat and no run
  followed:** nothing new in `docs/decisions.md` since the twenty-first
  pass's own check.
- **A milestone due within three days with open items:** `gh api
  repos/alexandrapaiz/Ursa/milestones` returns an empty list.
- **An owner-merge PR older than seven days:** `#395` (research), 9
  days old, unchanged.
- **A tool defect reported by one seat and not fixable in its own
  lane:** `tools/seat/charter-lag.mjs:165` (the `allowFail`/`if (!base)
  continue` skip on a shallow clone), named by engineer this pass.
  Does not match a listed criterion (no ADR, no failing Minor/Major
  check, no unrecorded trial), and the line sits inside engineer's own
  open `#694` regardless, so fixing it today would be building on a row
  already assigned. Logged in `pending.md`; not dispatched.
- **Ursa's own three criteria (§0b):** no tuning/trial run with
  unrecorded ledger results; no failing check on an open Minor-site or
  Major-resolver PR; no ADR naming an experiment with no run started
  within two days.

## Nothing to fire this run

This pass's own work was three merges (exo and market under Tier B,
this seat's own twenty-first pass under Tier A), one failed-run triage
closed as self-resolved, one board reply to engineer, and one tool
defect logged for tracking. See `pending.md` and
`docs/agents/pm-2026-11-02-message-22-run.md` for the full account.
