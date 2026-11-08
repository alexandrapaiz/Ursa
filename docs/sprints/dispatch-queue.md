# Dispatch queue — 2026-11-08, standup (hook, re-fired slot)

This run is the 2026-11-08T11:05:25Z scheduled slot, re-fired after the
provider refused it before this seat took a turn; the limit reset at
2026-11-08T23:00:00Z and the slot does not repeat, so this is the only
run that covers that date. `PM_DISPATCH_ENABLED` and
`DEFAULT_WORKFLOW_TOKEN` are both unset in this run's environment.
Nothing below can fire from this run even if it qualified.

## Checked against the criteria table (pm.md §11.3) and Ursa's own three (§0b)

- **Two or more open PRs on one scope, none merged — true twice.**
  Skill: `#700` and `#711` (both opened 2026-11-02, both
  `CONFLICTING`/`DIRTY`, neither touched since). Exo: `#714`, `#730`,
  `#734` (draft), and today's `#738`, four open heads on one scope,
  none merged. Both are below, at one entry per seat per §11.4.
- **A seat's open draft with failing CI or an unanswered review
  comment older than 24h:** `gh run list` shows every run on every
  open branch completed `success`; no draft has a failing check.
  `#711`'s one comment is the skill seat's own status note to itself,
  not an unanswered review, so this criterion does not add a third
  entry on its own.
- **A ruling or ADR merged since the last run names a seat and no run
  followed:** nothing new in `docs/decisions.md` since the 2026-10-17
  token-wall update; no new ADR or Finding section since.
- **A milestone due within three days with open items:** `gh api
  repos/alexandrapaiz/Ursa/milestones` returns none.
- **An owner-merge PR older than seven days:** none yet. The oldest
  open batch (`#700`–`#735`, all from 2026-11-02) turns seven days old
  tomorrow, 2026-11-09; flagged in `pending.md` so the next run does
  not have to rediscover the count.
- **Ursa's own three criteria (§0b):** no tuning or trial run with
  unrecorded ledger results; no failing check on an open Minor-site or
  Major-resolver PR (none of today's open PRs touch those paths, and
  every configured check is green); no ADR naming an experiment with
  no run started within two days.

## The two entries

1. **Skill, build on the open branch.** `#700` and `#711` have sat
   `CONFLICTING` for six days. `#711`'s own last comment already
   diagnosed its missing gate run as a trigger question for the
   engineer, not a content problem, so the rebase itself should be
   mechanical.

   ```sh
   gh workflow run agent-skill.yml -f owner_instructions='Two of your own open PRs, #700 and #711 (both opened 2026-11-02), have been CONFLICTING against main for six days with no further pushes. Rebase or merge main into whichever is newer, fold the other in if it is fully contained (check with git merge-base --is-ancestor before assuming), and close what does not survive. Build on the open branch; do not start a third one.'
   ```

2. **Exo, build on the open branch.** Four open heads on one scope —
   `#714`, `#730`, `#734` (draft), and today's `#738` — with none
   merged. `#714` and `#730` are `MERGEABLE`/`CLEAN`, so this is a
   consolidation problem, not a conflict one.

   ```sh
   gh workflow run agent-exo.yml -f owner_instructions='You have four open PRs with nothing merged: #714, #730, #734 (draft), and today's #738. Read your own open PRs first per the org rule: check ancestry with git merge-base --is-ancestor across all four, fold whichever are contained into the newest, and ready or close the rest so the queue reflects one decision instead of four. Build on the open branch; do not start a fifth.'
   ```

## Not queued

`#725` (market) and this seat's own `#701` are also open and stale
(six days, `CONFLICTING`), but neither clears a dispatch criterion on
its own this pass: market has only the one open PR, not two, and a
seat never dispatches itself. Both are carried in `pending.md` instead.

## Not fired this run

Nothing above can fire with `PM_DISPATCH_ENABLED` unset, the same wall
every pass has found since the eighteenth message pass. This run's own
work was the standup check above, closing this seat's own dead draft
`#735`, and the `pending.md` update. See the run's pull request for the
full account.
