# Dispatch queue — 2026-11-02, message-triggered (nineteenth pass)

This run's own credential surface is a host sandbox, not a GitHub
Actions run: `gh variable get PM_DISPATCH_ENABLED` returns the same
`403: Resource not accessible by personal access token` every prior
host pass has found, and `DEFAULT_WORKFLOW_TOKEN` is unset in this
environment (only `GH_TOKEN` is present). Nothing below can fire from
this run even if it qualified, same wall `docs/decisions.md` already
tracks.

## Checked against the criteria table (pm.md §11.3) and Ursa's own three (§0b)

- **Failed runs in the last 6h:** `gh run list --status failure
  --created ">=6h ago"` returns the same three `redaction-gate`
  failures the eighteenth pass already triaged, on branches
  `ursa-security/2026-11-02-message-3` (PR `#659`) and
  `ursa-pm/2026-11-02-message-4` (PR `#654`). Re-checked rather than
  assumed stale: both pull requests are already resolved — one
  merged, one closed — before this pass started. Tripwire false
  alarms; nothing to dispatch.
- **A seat's open draft with failing CI or an unanswered review
  comment >24h:** four open drafts this pass (`#704` exo, `#705`
  frontend, `#708` engineer, `#709` security), all pushed within the
  last ten minutes per `check-draft-prs.sh` — live runs, not stale.
- **Two or more open PRs on one scope, none merged — this still
  fires.** Engineer has four mutually non-ancestral open pull requests
  (`#665`, `#679`, `#685`, `#694`), re-verified pairwise this pass with
  `git merge-base --is-ancestor` rather than carried on a prior count.
  Not fired: this run's credential surface cannot fire a dispatch at
  all (see above), so naming the candidate is the whole of what this
  pass can do with it.
- **A ruling or ADR merged since the last run names a seat and no run
  followed:** nothing new in `docs/decisions.md` since the eighteenth
  pass's own check.
- **A milestone due within three days with open items:** `gh api
  repos/alexandrapaiz/Ursa/milestones` returns an empty list.
- **An owner-merge PR older than seven days:** `#395` (research), 9
  days old, unchanged. Recorded in `pending.md`, not fired here — a
  charter-adjacent, Tier C PR is the owner's decision, not a workflow
  run.
- **Ursa's own three criteria (§0b):** no tuning/trial run with
  unrecorded ledger results; no failing check on an open Minor-site or
  Major-resolver PR; no ADR naming an experiment with no run started
  within two days.

## Nothing fired this run; the one real candidate is named for the next run with a live Actions token

If a future pass runs on a surface where `DEFAULT_WORKFLOW_TOKEN` is
present (a GitHub Actions `pm-agent` run, per the 2026-10-17 ~14:1x
finding in `docs/decisions.md`), the engineer stacking candidate above
is the one to fire first: `gh workflow run agent-engineer.yml -f
owner_instructions='rebase and consolidate #665, #679, #685 and #694
against current main before starting new work; none contains any
other and all four are dirty against main as of this pass's merges'`.

This pass's own work was one Tier A self-merge (this seat's own
eighteenth-pass pull request) and three Tier B merges (security,
engineer, market). See `pending.md` and
`docs/agents/pm-2026-11-02-message-19-run.md` for the full account.
