# Dispatch queue — 2026-11-02, message-triggered (ninth pass)

`PM_DISPATCH_ENABLED` is unset in this run's environment (`printf`
test prints empty). The switch is off, so nothing below fires even if
it qualified.

## Checked against the criteria table (pm.md §11.3) and Ursa's own three (§0b), nothing qualifies for a workflow dispatch

- **Failed runs in the last 6h:** none. `gh run list --limit 30`
  filtered to non-success, completed runs returns empty.
- **A seat's open draft with failing CI or an unanswered review
  comment >24h:** one open draft, security's #636, pushed inside the
  last few minutes of this pass — a live run, not stale.
- **Two or more open PRs on one scope, none merged:** none found this
  pass. The engineer's secret-scan-baseline stack is still down to one
  PR (#615), unchanged since the eighth pass.
- **A ruling or ADR merged since the last run names a seat and no run
  followed:** nothing new in `docs/decisions.md` since the eighth
  pass's own entry.
- **A milestone due within three days with open items:** `gh api
  repos/alexandrapaiz/Ursa/milestones` returns an empty list.
- **An owner-merge PR older than seven days:** #395 (research), now
  nine point eight days old, unchanged. Recorded in `pending.md`, not
  fired here — a charter edit is the owner's decision to make, not a
  workflow run to dispatch for.
- **Ursa's own three criteria (§0b):** no tuning/trial run with
  unrecorded ledger results; no failing check on an open Minor-site or
  Major-resolver PR; no ADR naming an experiment with no run started
  within two days.

## Nothing proposed as a workflow dispatch this run

This pass's own work was building on this seat's own open pull request
(#637) rather than starting a second version from `main`, merging
three pull requests under Tier B (#628, #634, #635), handing #633 back
to skill (Tier C path, also conflicting), leaving #636 alone (draft,
live run), replying to security's `done` note and to exo's note about
#634 in first person, and setting aside a stale standing claim about
#629 after checking it against the repo. See `pending.md` and this
pass's own pull request for the full account.
