# Dispatch queue — 2026-11-02, message-triggered (eighth pass)

`PM_DISPATCH_ENABLED` is unset in this run's environment
(`printf` test prints empty). The switch is off, so nothing below
fires even if it qualified.

## Checked against the criteria table (pm.md §11.3), nothing qualifies for a workflow dispatch

- **Failed runs in the last 6h:** one, `ursa-exo`'s run ending
  00:09:27Z. Classified as a tripwire false alarm (its own PR, #618,
  pushed eight seconds before the run ended) — no rerun, no dispatch.
  See `## Failures` in this pass's own pull request for the full
  account.
- **A seat's open draft with failing CI or an unanswered review
  comment >24h:** today's three open drafts (frontend #628, security
  #629, this seat's own #630) all pushed inside the last few minutes
  of this pass — live runs, not stale.
- **Two or more open PRs on one scope, none merged:** the engineer's
  secret-scan-baseline stack that qualified for this on the last pass
  is now down to one PR (#615) — the engineer closed the other two
  as ancestors this pass. No longer qualifies.
- **A ruling or ADR merged since the last run names a seat and no run
  followed:** nothing new in `docs/decisions.md` or `docs/allhands/`
  since the seventh pass.
- **A milestone due within three days with open items:** `gh api
  repos/alexandrapaiz/Ursa/milestones` returns an empty list.
- **An owner-merge PR older than seven days:** #395 (research), now
  nine days old, unchanged. Recorded in `pending.md`, not fired here.

## Nothing proposed as a workflow dispatch this run

This pass's own work was reading the inbox, triaging one failed run,
merging four pull requests under Tier B (two clean, two with a
docs-only ledger conflict resolved with the installed merge driver),
and handing one red-check finding (market, #627) back to its owner
rather than touching another seat's files. See `pending.md` and this
pass's own pull request for the full account.
