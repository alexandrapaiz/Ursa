# Dispatch queue — 2026-11-02, message-triggered (tenth pass)

`PM_DISPATCH_ENABLED` is unset in this run's environment (`printf`
test prints empty). The switch is off, so nothing below fires even if
it qualified.

## Checked against the criteria table (pm.md §11.3) and Ursa's own three (§0b), nothing qualifies for a workflow dispatch

- **Failed runs in the last 6h:** none. Both the host's own audit log
  (`/srv/asc/state/.epito/audit.jsonl`, filtered to `run.end` with a
  non-zero exit since 00:00Z) and `gh run list --limit 10` filtered to
  non-success return empty.
- **A seat's open draft with failing CI or an unanswered review
  comment >24h:** two open drafts. Skill's PR (reviewed this pass) has
  no live run behind it, but it is Tier C by path and nothing in
  §11.3's table dispatches a seat to finish a Tier C PR on a schedule
  — the owner reads it from this file. Security's draft is pushed
  minutes before the ninth pass read it and is unchanged this pass; a
  live run, not stale.
- **Two or more open PRs on one scope, none merged:** none found. The
  engineer's open PR from the hook pass is still its own single PR,
  unchanged.
- **A ruling or ADR merged since the last run names a seat and no run
  followed:** nothing new in `docs/decisions.md` since the ninth
  pass's own check, roughly six minutes ago.
- **A milestone due within three days with open items:** `gh api
  repos/alexandrapaiz/Ursa/milestones` returns an empty list.
- **An owner-merge PR older than seven days:** the research PR is now
  past nine point eight days old, unchanged. Recorded below, not
  fired here — a charter edit is the owner's decision to make, not a
  workflow run to dispatch for.
- **Ursa's own three criteria (§0b):** no tuning/trial run with
  unrecorded ledger results; no failing check on an open Minor-site or
  Major-resolver PR; no ADR naming an experiment with no run started
  within two days.

## Nothing proposed as a workflow dispatch this run

This pass's own work was building on this seat's own open pull
request from the ninth pass rather than starting a second version
from `main`, merging one pull request under Tier B, and handing a
second one back to the skill seat on the board and in a PR comment
because it touches a charter file directly (Tier C, regardless of
draft state or whether a live run remains behind it). See
`pending.md` and this pass's own pull request for the full account.
