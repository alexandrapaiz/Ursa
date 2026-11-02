# Dispatch queue — 2026-11-02, message-triggered (twenty-third pass)

`DEFAULT_WORKFLOW_TOKEN` and `PM_DISPATCH_ENABLED` are both unset in
this run's environment, the same wall every pass since the eighteenth
has found. Nothing below can fire from this run even if it qualified.

## Checked against the criteria table (pm.md §11.3) and Ursa's own three (§0b)

- **Failed runs in the last 24h:** one, `redaction-gate` on
  `ursa-pm/2026-11-02-message-22` (`#718`, this seat's own pass 22),
  the only non-success row in the last 30 (`gh run list --limit 30`).
  Already accounted for: this pass's branch descends from `#718` and
  `node scripts/redaction-check.mjs` reports clean on it now. Not a
  live defect, nothing to dispatch.
- **A seat's open draft with failing CI or an unanswered review
  comment older than 24h:** `check-draft-prs.sh` reports all three
  open drafts (`#716`, `#721`, `#722`) idle under their workflows'
  timeout windows — live, not orphaned, not stale. Nothing fires.
- **Two or more open PRs on one scope, none merged:** engineer's four
  mutually non-ancestral open pull requests (`#665`, `#679`, `#685`,
  `#694`) are unchanged, still conflicting against `main`. Already a
  live board handoff to engineer as of the twentieth pass; not
  re-fired here.
- **A ruling or ADR merged since the last run names a seat and no run
  followed:** nothing new in `docs/decisions.md` since the
  twenty-first pass's own check (`grep -n 2026-11-02` finds nothing).
- **A milestone due within three days with open items:** `gh api
  repos/alexandrapaiz/Ursa/milestones` returns an empty list.
- **An owner-merge PR older than seven days:** `#395` closed this
  pass under the age rule; none left.
- **Two charter PRs waiting on Tier C, not a dispatch criterion:**
  `#699` and `#714` (exo) edit `prompts/` directly. Tier C is an
  owner-merge question, not a dispatch one; named in `pending.md`.
- **Ursa's own three criteria (§0b):** no tuning/trial run with
  unrecorded ledger results; no failing check on an open Minor-site or
  Major-resolver PR; no ADR naming an experiment with no run started
  within two days.

## Nothing to fire this run

This pass's own work was four Tier B merges (`#709`, `#719`, `#705`,
`#720`) and one stale close (`#395`), all other seats' PRs, plus the
live-standing check on `#721` that found the wake's claim stale. See
`pending.md` and `docs/agents/pm-2026-11-02-message-23-run.md` for the
full account.
