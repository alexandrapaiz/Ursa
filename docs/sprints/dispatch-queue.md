# Dispatch queue — 2026-09-25 (standup, 15:44 UTC scheduled run)

`PM_DISPATCH_ENABLED` is exactly `true`. Owner-present hard stop does
not apply: the last human `workflow_dispatch` (alexandrapaiz,
2026-09-24T04:40:43Z) is 35+ hours old. Dispatch budget today: 0 used
before this run, so up to 3 available, 1 per seat, ceiling
10/rolling-7-days (0 used in the last 7 days — no dispatch has ever
actually landed, see below).

Since the last standup (2026-09-24 15:44Z), the sprint moved: engineer
shipped item 1 (PR #13) and item 2 (PR #16), both open with passing CI
and no review activity yet. Skill and frontend also ran and opened
PRs #14 and #15 (their delayed first-occurrence crons from yesterday
did fire later in the day, just hours late). Nothing failed in
`gh run list --limit 30`.

**New this run:** the sprint milestone (GitHub milestone #1,
"Sprint 2026-09-21") had `due_on: null` since creation, which meant
§11.3's "milestone due within three days" row could never fire no
matter how close the sprint got to closing. Set it to 2026-09-27 (the
sprint's own Sunday close) via `gh api -X PATCH
/repos/alexandrapaiz/Ursa/milestones/1 -f due_on='2026-09-27T23:59:59Z'`
this run, since it's tracking-surface maintenance (§2b) rather than a
sprint-content edit. That immediately puts it 2 days out, which is why
it appears as a trigger below alongside the item-4-specific one.

## Proposed

1. **Trigger:** two independent §11.3 rows fire on the same fact. (a)
   Sprint item 4 (docs/sprints/sprint-2026-09-21.md) is due this
   sprint; market has 0 runs ever (`gh run list --workflow=agent-market.yml`
   returns empty), and its Wednesday 13:35 UTC cron already passed
   this week without firing. (b) The sprint milestone is now due within
   three days (2026-09-27, set this run) with item 4 still open and
   unstarted.
   **Cost of skipping:** market's next scheduled occurrence
   (2026-09-30) falls after this sprint closes (Sunday 2026-09-27), so
   without a dispatch item 4 gets no run inside the sprint window at
   all, even though KR2.3's own due date (2026-10-31) has slack.
   **Command:** `gh workflow run agent-market.yml -f
   owner_instructions='Sprint 2026-09-21 item 4: draft
   docs/market/landscape.md, 9+ competitors across preference-data
   vendors, evaluation/arena products, and personalization/memory
   layers, serving O2 KR2.3 (due 2026-10-31). Your Wednesday 13:35 UTC
   cron has passed for this sprint and the next occurrence (2026-09-30)
   falls after the sprint closes — this dispatch exists so item 4
   still gets a run inside the sprint window.'`

Not queued:

- **Engineer** — also has an open sprint item (item 3, not started),
  and the milestone-due trigger applies to it too. Not queued because
  engineer's last PR (#16, `engineer/2026-09-25-artifact-kind`) is
  still open: the hard stop in §11.4 forbids dispatching a seat with
  an open PR unless the instruction tells it to build on that exact
  branch, and item 3 is unrelated work to item 2, so telling it to
  build on that branch would misdescribe the task. Item 3 waits for
  #13/#16 to merge or an owner-directed dispatch that names the
  branch.
- **Research** — first-occurrence cron (Fri 13:15 UTC, today) has not
  fired as of this run (`gh run list --workflow=agent-research.yml` is
  empty), 2.5+ hours late. Same pattern as skill/frontend yesterday,
  which self-resolved a few hours later without intervention. No
  sprint item is assigned to research this sprint, so no §11.3 row
  applies to the missed cron by itself. Noted, not acted on; worth an
  exo look if the lateness pattern keeps recurring across seats.
- No seat has a failing run to diagnose. No new ADR names an
  experiment without a run. No owner-merge PR is past seven days old
  (oldest open PR, #13, is under 24 hours old).

## Dispatched by the PM

**Attempted, failed at the credential, not the switch — same wall as
2026-09-24.** `gh workflow run agent-market.yml -f
owner_instructions=…` returned:

```
could not create workflow dispatch event: HTTP 403: Resource not
accessible by integration
(https://api.github.com/repos/alexandrapaiz/Ursa/actions/workflows/361138502/dispatches)
```

Reconfirmed independently this run with a direct capability probe
before attempting the dispatch: `gh api
/repos/alexandrapaiz/Ursa/actions/permissions` returns the identical
`403` with no workflow involved at all. This is the same diagnosis the
2026-09-24 15:44Z standup recorded: this run's credential is a GitHub
App installation token whose installation grant does not include the
`actions` scope, and `agent-pm.yml`'s own `permissions: actions:
write` block can't widen a grant the installation itself never got.
Not a transient failure, so not retried a second time this run.

**Action for the owner, unchanged and still open:** grant `actions:
write` to whatever GitHub App installation runs this seat (Settings →
Integrations → the app's permissions), or check whether `agent-pm.yml`
mints its own installation token with a narrower scope than its
`permissions:` block implies. Until then, `PM_DISPATCH_ENABLED: true`
has no effect on any seat with a triggered dispatch — every standup
will keep reaching this same wall on valid §11.3 criteria. This is now
confirmed on two separate days (2026-09-24, 2026-09-25) and two
different seats' dispatch attempts (engineer, market), so it is a
standing infrastructure gap, not a one-off.
