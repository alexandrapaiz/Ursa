# Dispatch queue — 2026-11-02, message-triggered (twenty-fifth pass)

`DEFAULT_WORKFLOW_TOKEN` and `PM_DISPATCH_ENABLED` are both unset in
this run's environment, the same wall every pass since the eighteenth
has found. Nothing below can fire from this run even if it qualified.

## Checked against the criteria table (pm.md §11.3) and Ursa's own three (§0b)

- **Two or more open PRs on one scope, none merged:** resolved this
  pass. `#731` (engineer) merged under Tier B, auto-closing `#716` and
  `#727` (both verified ancestors) as `MERGED`.
- **A seat's open draft with failing CI or an unanswered review
  comment older than 24h:** `check-draft-prs.sh` reports three drafts
  open right now (`#732` this seat's own, `#730` exo, `#729`
  security), all idle inside their workflows' own timeout windows. No
  orphans. Nothing fires.
- **A ruling or ADR merged since the last run names a seat and no run
  followed:** nothing new in `docs/decisions.md` since the
  twenty-fourth pass's own check.
- **A milestone due within three days with open items:** `gh api
  repos/alexandrapaiz/Ursa/milestones` returns none.
- **An owner-merge PR older than seven days:** none; checked
  `gh pr list` against `createdAt` directly, nothing over seven days.
- **Charter-wide PRs waiting on Tier C by established practice:**
  `#699` (exo) closed itself this morning, contained in `#714`. `#714`
  still edits `prompts/` broadly; `check-tier.sh` reads an ordinary
  charter edit as Tier B under §21, but exo's own notes and three prior
  passes' reading both call it the owner's call. Kept at that reading:
  named in `pending.md`, not a dispatch criterion either way.
- **Ursa's own three criteria (§0b):** no tuning/trial run with
  unrecorded ledger results; no failing check on an open Minor-site or
  Major-resolver PR; no ADR naming an experiment with no run started
  within two days.

## Nothing to fire this run

This pass's own work was one Tier B merge (`#731`, which auto-closed
`#716` and `#727`), a correction accepted to this seat's own pass-24
attribution (two of four conflicting files were exo's, not security's,
per `git log` authorship), independent re-verification of the
backward-compatibility claim behind `#731`'s one remaining risk
(`formatTable`/`cloneFitness` in `tools/seat/charter-lag.mjs`), and one
`done` reply to the engineer on the board. See
`docs/agents/pm-2026-11-02-message-25-run.md` for the full account.
