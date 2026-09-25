# Pending — what the org owes, and what waits on the owner

Maintained every PM run (docs/standards/pm.md §5). Each line dated.
Reconciled 2026-09-25, 15:44Z scheduled standup, against `gh pr list
--state all`, `gh run list --limit 30`, `gh run list --workflow=...`,
and a fresh `gh workflow run` / `gh api actions/permissions` probe.

## Awaiting the owner's merge

- 2026-09-24/25 — **four open PRs, all green, none reviewed yet:**
  #13 (`engineer/2026-09-24-trace-stage-loops`, sprint item 1, opened
  2026-09-24 15:53Z), #14 (`skill/2026-09-24-outcome-record-provenance`,
  skill's first Ursa run, opened 2026-09-24 18:02Z), #15
  (`fe/2026-09-24-visual-review`, frontend's first Ursa run, opened
  2026-09-24 18:25Z), #16 (`engineer/2026-09-25-artifact-kind`, sprint
  item 2, opened 2026-09-25 01:43Z). All four show `scan` (the
  redaction gate) passing and zero reviews or comments so far. Oldest
  is under 24 hours old, so none trips the "owner-merge PR older than
  seven days" line yet, but flagging now since it's the first time
  four are open at once: merge order matters for #13/#16 (both
  engineer, both touch `ursa-major/src`) more than for #14/#15.

## Waiting on an owner-only action

- 2026-09-24, reconfirmed 2026-09-25 — `LINEAR_API_KEY` is present but
  still not a Linear key (same non-`lin_api_...` value as yesterday,
  checked again this run without printing it). §1f sync skipped again
  under the charter's fail-soft rule. **Action for the owner:**
  `gh secret set LINEAR_API_KEY` with the real value from Linear →
  Settings → API → Personal API keys.
- `PROJECTS_TOKEN` still unset (moot: Linear is the board of record
  per ADR-005; labels/milestones per §2b don't need it).
- 2026-09-24, **reconfirmed 2026-09-25 — the dispatch mechanism is
  still broken at the credential level, now on two separate days.**
  `PM_DISPATCH_ENABLED` is `true`; this run both re-probed
  `gh api /repos/alexandrapaiz/Ursa/actions/permissions` (403) and
  attempted an actual dispatch, `gh workflow run agent-market.yml`
  (403, same "Resource not accessible by integration"). Full evidence
  in docs/sprints/dispatch-queue.md. **Action for the owner:** grant
  `actions: write` to the GitHub App installation running this seat,
  or check whether `agent-pm.yml` mints its own installation token
  with a narrower scope than its `permissions:` block implies. Until
  fixed, the switch is inert regardless of how many valid §11.3
  triggers fire.
- Carried from 2026-09-24, not re-verified this run (exo's lane, not
  this seat's) — `docs/agents/incidents.md` Incident 4's Status line
  still reads "Open until both are edited" even though the underlying
  leaks were confirmed fixed as of the 2026-09-24 pass. Flagging again
  so it doesn't get lost a second time.

## New this run — the sprint milestone had no due date

GitHub milestone #1 ("Sprint 2026-09-21") had `due_on: null` since
creation on 2026-09-24, which silently disabled §11.2/§11.3's
"milestone due within three days" check for this entire sprint. Fixed
this run via `gh api -X PATCH .../milestones/1 -f
due_on='2026-09-27T23:59:59Z'` (the sprint's own Sunday close), which
is tracking-surface maintenance under §2b, not a sprint-content edit.
It now correctly reads as due in 2 days and contributed to this run's
dispatch reasoning (see dispatch-queue.md).

## Owed by a seat, not yet started

- 2026-09-21 — engineer: sprint item 3 (browsable record from
  `fixtures/mini`, provenance-navigation audit). Items 1 and 2 shipped
  as PRs #13/#16 (unmerged). Item 3 has no run and no dispatch this
  pass: engineer's last PR (#16) is still open, and §11.4's hard stop
  forbids dispatching a seat with an open PR unless told to build on
  that exact branch — item 3 is different work from item 2, so that
  exception doesn't cleanly apply. Waits for #13/#16 to merge, or an
  owner-directed dispatch naming the branch explicitly.
- 2026-09-21 — market: sprint item 4, `docs/market/landscape.md`,
  serving KR2.3 (due 2026-10-31). Still zero runs ever
  (`gh run list --workflow=agent-market.yml` empty). Dispatch attempted
  again this run under two independent §11.3 triggers (item due this
  sprint + milestone due within three days) and failed at the same
  credential wall as 2026-09-24 — see above. Without an owner-triggered
  `workflow_dispatch` or an Actions-scope fix, item 4 gets no run
  inside this sprint's window at all (next cron 2026-09-30, after
  Sunday's close).
- 2026-09-18 through 2026-09-20 — three `proposed` ledger entries still
  have no owner verdict: repo split (2026-09-18, now 7 days), tuning
  packs (2026-09-19, now 6 days), the merge-commits/PR-reader finding
  (2026-09-20, now 5 days). None has crossed the two-week mark yet;
  repo split is now past the one-week mark.

## Newly active, first cron due but not yet fired

- **New this run** — research's first occurrence (Fri 13:15 UTC,
  today) had not fired as of 15:47 UTC, 2.5+ hours late
  (`gh run list --workflow=agent-research.yml` empty). No sprint item
  is assigned to research, so no §11.3 row applies to the miss by
  itself; not dispatched. This is the same lateness pattern skill and
  frontend showed yesterday (both eventually ran, several hours past
  their nominal cron time, and shipped PRs #14/#15) — worth an exo look
  if it recurs a third day running, since "the cron eventually fires
  late" is not the same guarantee as "the cron fires on time."
- security (Sun 15:15 UTC, next 2026-09-27), finance (1st of month
  11:30 UTC, next 2026-10-01) still have their first occurrence ahead
  of them. Nothing owed yet.

## Noticed in passing, not this seat's lane

- docs/decisions.md has two entries both numbered **ADR-005** ("Every
  seat but sales is active", 2026-09-24, and "Linear is the board of
  record", 2026-09-23) with a third-numbered entry (ADR-006) in between
  them chronologically. Not fixed here: decisions.md is outside this
  seat's writable surface (docs/sprints/ and ledger grooming notes
  only) and editing an accepted ADR's own number is a content change,
  not tracking maintenance. Flagging so the numbering collision gets a
  deliberate fix rather than being discovered by accident later.
