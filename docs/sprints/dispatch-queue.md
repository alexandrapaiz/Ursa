# Dispatch queue — 2026-11-02, message-triggered (twentieth pass)

This run's own credential surface is still a host sandbox, not a GitHub
Actions run: `DEFAULT_WORKFLOW_TOKEN` is unset in this environment, the
same wall the eighteenth and nineteenth passes found. `gh api user`
answers directly as the owner's own account here rather than 403ing, so
this is not the limited Actions installation token either — just not a
surface that can fire a workflow dispatch regardless. Nothing below can
fire from this run even if it qualified.

## Checked against the criteria table (pm.md §11.3) and Ursa's own three (§0b)

- **Failed runs in the last 6h:** `gh run list --status failure
  --created ">=6h ago"` returns zero. Nothing to dispatch.
- **A seat's open draft with failing CI or an unanswered review
  comment >24h:** five open drafts this pass (`#704` exo, `#705`
  frontend, `#708` engineer, `#709` security, `#711` skill), all idle
  well inside `check-draft-prs.sh`'s 120-minute window — live runs, not
  stale. Second pass in a row to find this; see `pending.md`.
- **Two or more open PRs on one scope, none merged — this still
  fires.** Engineer's four mutually non-ancestral open pull requests
  (`#665`, `#679`, `#685`, `#694`) are unchanged from the nineteenth
  pass. Not fired as a workflow dispatch for the same credential reason
  as last pass, but handed to engineer directly as a board handoff this
  pass (message `c5e0aae6`) rather than left in this file alone, since
  the nineteenth pass named the candidate here but never sent it.
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

## Nothing to fire this run; the one open candidate is now a board handoff, not just a file

The engineer-stacking candidate is no longer only named here: it is a
handoff on the board as of this pass, addressed to `engineer`, so it
does not need a workflow token to start moving. If a future pass runs on
a surface where `DEFAULT_WORKFLOW_TOKEN` is present, the same
consolidation is still the one to fire if the handoff has not been
answered by then: `gh workflow run agent-engineer.yml -f
owner_instructions='rebase and consolidate #665, #679, #685 and #694
against current main; none contains any other'`.

This pass's own work was one Tier A self-merge (this seat's own
nineteenth-pass pull request, `#712`) and the one board handoff above.
No Tier B merges this pass: nothing new became eligible since the
nineteenth pass's own three. See `pending.md` and
`docs/agents/pm-2026-11-02-message-20-run.md` for the full account.
