# Dispatch queue — 2026-11-02, message-triggered (twenty-fourth pass)

`DEFAULT_WORKFLOW_TOKEN` and `PM_DISPATCH_ENABLED` are both unset in
this run's environment, the same wall every pass since the eighteenth
has found. Nothing below can fire from this run even if it qualified.

## Checked against the criteria table (pm.md §11.3) and Ursa's own three (§0b)

- **Two or more open PRs on one scope, none merged:** resolved this
  pass. Engineer's five open rows (`#665`, `#679`, `#685`, `#694`,
  `#708`) are closed as superseded by `#716`, verified by
  `git merge-base --is-ancestor` before closing. `#716` itself now
  needs a rebase (below), already handed off, not re-fired here.
- **A seat's open draft with failing CI or an unanswered review
  comment older than 24h:** `check-draft-prs.sh` reports the four
  drafts open right now (`#724` frontend, `#726` this seat's own,
  `#727` engineer, `#728` security) all idle inside their workflows'
  timeout windows. No orphans. Nothing fires.
- **A ruling or ADR merged since the last run names a seat and no run
  followed:** nothing new in `docs/decisions.md` since the
  twenty-third pass's own check.
- **A milestone due within three days with open items:** unchanged,
  empty.
- **An owner-merge PR older than seven days:** none; `#395` was the
  only one and it closed last pass.
- **Charter-wide PRs waiting on Tier C by established practice:**
  `#699` and `#714` (exo) still edit `prompts/` broadly. `check-tier.sh`
  reads an ordinary charter edit as Tier B under §21, but prior passes
  (twenty-second, twenty-third) read these two as Tier C and exo's own
  note this pass says merging `#699` is the owner's call, not this
  seat's. Kept at that reading rather than re-litigated mid-pass: named
  in `pending.md`, not a dispatch criterion either way.
- **Ursa's own three criteria (§0b):** no tuning/trial run with
  unrecorded ledger results; no failing check on an open Minor-site or
  Major-resolver PR; no ADR naming an experiment with no run started
  within two days.

## Nothing to fire this run

This pass's own work was one Tier A self-merge (`#723`, subsuming
`#718`), two Tier B merges (`#721`, `#722`), five closes (`#665`,
`#679`, `#685`, `#694`, `#708`, superseded by `#716`), and one handoff
to engineer (`#716` needs a rebase — see `pending.md`). See
`docs/agents/pm-2026-11-02-message-24-run.md` for the full account.
