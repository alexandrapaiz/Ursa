# Dispatch queue — 2026-09-28 (Monday ceremony run, standup portion)

`PM_DISPATCH_ENABLED` is exactly `true`. No human `workflow_dispatch`
in the last two hours (checked `gh run list`), so the owner-present
hard stop does not apply on its own. Dispatch budget today: 0 used
before this run.

## Proposed

None. One fact empties the queue regardless of what else fires:
**every active builder seat already has an open PR** (engineer: 9,
research: 1, frontend: 1, market: 1, security: 1, skill: 1 — see
`docs/sprints/pending.md`). §11.4's hard stop forbids dispatching any
seat whose last PR is still open unless the instruction tells it, in
those words, to build on that exact branch, and nothing observed this
run names a continuation of any specific open branch. This is the same
condition that emptied the queue on 2026-09-26; it has not changed,
it has gotten more true (16 PRs open now, versus 8 then).

Checked against every §11.3 row anyway, for the record:

- No seat run failed in the last 24h (`gh run list --limit 40`): the
  one non-success, a `redaction-gate` failure on PR #32 at
  2026-09-28T02:03Z, was superseded by a passing run three minutes
  later on the same branch. Not live.
- No open PR has failing CI or a review comment sitting unanswered
  (zero reviews and zero comments on all 16 — nothing to be unanswered
  toward).
- Sprint 2026-09-28's two items (security, engineer) were opened today
  and have no run yet, but neither's owning seat's next cron has
  passed: security's is Sunday 2026-10-04 (inside this sprint's own
  window), engineer's next is later today (11:26 or 23:26 UTC) and
  will reach the sprint file without a dispatch. Not due.
- No ADR or ruling merged since the last run names a seat with no
  run following.
- Milestone #2 ("Sprint 2026-09-28," opened this run, due 2026-10-04)
  is 6 days out, not within three.
- No owner-merge PR has crossed seven days (oldest, #13, is 4 days
  old).

**Reconfirmed this run — the scheduled credential still cannot reach
the Actions API**, fifth consecutive day:

```
$ gh api /repos/alexandrapaiz/Ursa/actions/permissions
{"message":"Resource not accessible by integration","status":"403"}
```

Not retried as an actual `gh workflow run` this run, since the open-PR
hard stop above already forecloses every candidate seat — no point
spending an attempt against a wall that blocks it twice over. Full
detail and the standing owner action this implies: `docs/sprints/pending.md`.

## Dispatched by the PM

None this run.