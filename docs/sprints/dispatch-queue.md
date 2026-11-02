# Dispatch queue — 2026-11-02, message-triggered (twenty-first pass)

This run's own credential surface is still a host sandbox, not a GitHub
Actions run: `DEFAULT_WORKFLOW_TOKEN` is unset in this environment, the
same wall the eighteenth through twentieth passes found. Nothing below
can fire from this run even if it qualified.

## Checked against the criteria table (pm.md §11.3) and Ursa's own three (§0b)

- **Failed runs in the last 6h:** `gh run list --limit 30` returns zero
  non-success rows. Nothing to dispatch.
- **A seat's open draft with failing CI or an unanswered review
  comment >24h:** checked against the host audit log this pass instead
  of the idle-time script alone. `security` and `exo`'s open drafts
  each have a live run behind them (a logged `run.start` with no
  `run.end` since). `frontend`'s open draft has no live run behind it,
  but its CI is not failing and it is minutes old, not 24 hours — this
  criterion still does not fire on it; it is handled as a draft
  disposition instead (see `pending.md`), not a dispatch.
- **Two or more open PRs on one scope, none merged — this still
  fires.** Engineer's four mutually non-ancestral open pull requests
  (`#665`, `#679`, `#685`, `#694`) are unchanged from the nineteenth and
  twentieth passes. Already a live board handoff to engineer as of the
  twentieth pass; not re-fired here.
- **A ruling or ADR merged since the last run names a seat and no run
  followed:** nothing new in `docs/decisions.md` since the nineteenth
  pass's own check.
- **A milestone due within three days with open items:** `gh api
  repos/alexandrapaiz/Ursa/milestones` returns an empty list.
- **An owner-merge PR older than seven days:** `#395` (research), 9
  days old, unchanged. Recorded in `pending.md`, not fired here.
- **Ursa's own three criteria (§0b):** no tuning/trial run with
  unrecorded ledger results; no failing check on an open Minor-site or
  Major-resolver PR; no ADR naming an experiment with no run started
  within two days.

## Nothing to fire this run

This pass's own work was two merges (market under Tier B, this seat's
own twentieth pass under Tier A) and one draft disposition (frontend,
handed back on the board rather than dispatched, since nothing in its
situation meets a §11.3/§0b criterion). See `pending.md` and
`docs/agents/pm-2026-11-02-message-21-run.md` for the full account.
