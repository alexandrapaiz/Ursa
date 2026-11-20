# Dispatch queue — 2026-11-09, Monday ceremony (cron-triggered)

Checked fresh against `docs/standards/pm.md` §11.3 and Ursa's own three
(§0b of `prompts/pm-agent.md`), not carried forward. `gh variable get
PM_DISPATCH_ENABLED` returns HTTP 403 on this run's token, the same
wall every host pass has hit since 2026-10-17, and `GITHUB_ACTIONS` is
unset, confirming this is a host run rather than a GitHub Actions run.
`gh workflow run agent-<seat>.yml` would not apply even if the switch
read `true`. Logged as queue information for the owner, not as a plan
this run executes.

## Checked against the criteria table (pm.md §11.3) and Ursa's own three (§0b)

- **A seat run failed in the last 24h, diagnosable from its log:**
  `gh run list --limit 50` shows a wave of `redaction-gate` failures
  across ten branches between 10:31Z and 10:45Z, all `pull_request`-
  triggered runs checking out GitHub's synthetic merge against a
  `main` state that predates a same-morning fix — the exact stale-base
  pattern this seat's own earlier passes today (#864, #869) already
  diagnosed and traced to live follow-up runs already in flight on the
  affected branches (frontend's `#858`, security's `#859`, others).
  Not a fresh dispatch case: re-diagnosing the same cause a third time
  would commission work already running.
- **A seat's open draft has failing CI, or a review comment unanswered
  >24h:** six drafts open (`#865` frontend, `#866` skill, `#867`
  engineer, `#868` security, `#870` exo, `#871` this seat), all opened
  within the last 45 minutes of this check — live runs, not orphans.
  None qualify.
- **A sprint item due this week with no run from its owning seat:**
  not yet applicable. `sprint-2026-11-09.md` opened in this same PR;
  both its items are assigned to the engineer seat and neither is due
  until later this week.
- **A seat has two or more open PRs on one scope, none merged:**
  checked for every seat with more than one open PR (exo 5, skill 4,
  security 3, this seat 3, frontend 2, market 2, engineer 2) with
  `git merge-base --is-ancestor` across each seat's own chain, not
  assumed from the count alone. Every one is a single clean stack
  whose newest PR already contains all the others — the own-PR-first
  convention working as intended, not an independent pile of
  duplicate builds (the shape this row exists to catch, per pm.md
  §11.3a's epitome example). Dispatching "land or close this stack"
  to a seat already doing exactly that would commission work the
  repository already contains. Not fired. exo is additionally
  never-dispatchable regardless (pm.md §11.4).
- **A ruling or ADR merged since the last run names a seat with no run
  following:** nothing in `docs/decisions.md` since the pass-25 entry
  recording the ceremony gap (commit `dd0d4a27`, still the newest
  commit touching that file).
- **A milestone due within three days with open items:** none. The
  milestone this run opened for `sprint-2026-11-09.md` is due
  2026-11-16.
- **An owner-merge PR older than seven days:** none. Every one of the
  21 currently open PRs was opened today, 2026-11-09 (`gh pr list
  --state open --json createdAt`).
- **Ursa's own three (§0b):** no tuning or trial run with unrecorded
  ledger results this pass; no failing check on an open Minor-site or
  Major-resolver PR beyond the stale-base pattern already named above;
  no ADR naming an experiment with no run started within two days.

## Logged, not fired

**Research has produced no pull request, merged or open, since PR
#263 (2026-10-23)** — roughly five missed Tue/Fri cadence slots.
Named in `docs/agents/org-chart.md` and in this ceremony's sprint
notes rather than fired here: no §11.3 row matches a quiet cadence
with no failed run to diagnose and no sprint item currently assigned
to research, and inventing a dispatch instruction without a cited rule
is exactly what §11.4 forbids. Worth the owner's or HQ's judgment.

## Dispatched by the PM

None this pass. The token cannot read the switch, this is not a
GitHub Actions run, and the criteria table above found nothing that
would have qualified regardless.
