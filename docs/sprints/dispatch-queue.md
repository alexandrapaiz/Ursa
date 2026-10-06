# Dispatch queue — 2026-10-06 (standup, ~17:00 UTC)

`PM_DISPATCH_ENABLED` is exactly `true`. No owner instructions carried
on this dispatch (the run's own dispatch is a scheduled standup, not an
owner-present window).

## Proposed

None. Every seat this charter may dispatch has its most recent pull
request still open, which forecloses `docs/standards/pm.md` §11.4's
hard stop before any other criterion is even checked:

| Seat | Most recent open PR | Opened | State |
|---|---|---|---|
| engineer | #92 | 2026-10-05 | conflicting, handed off this run |
| research | #82 | 2026-10-05 | conflicting, handed off this run |
| frontend | #103 | 2026-10-05 | conflicting, handed off this run |
| skill | #83 | 2026-10-05 | draft |
| okr | #88 | 2026-10-05 | conflicting, handed off this run |
| finance | #91 | 2026-10-05 | draft |
| market | #89 | 2026-10-05 | conflicting, handed off this run |
| security | #85 | 2026-10-05 | draft (#75, the older and more urgent one, also open and conflicting) |

No owner instructions this run name a continuation of any of these
branches in the words §11.4 requires ("build on the open branch").

Checked against the rest of §11.3 anyway, for completeness:

- **No seat run failed in the last 24h.** `gh run list --status
  failure --created ">=$(date -u -d '-24 hours' +%FT%TZ)"` returns
  empty, and the last 50 runs show no non-success conclusion besides
  this run's own in-progress entry.
- **No open PR shows failing CI.** Everything checked this run is
  green or has no checks configured on its changed paths (#89), which
  is not itself a failure.
- **No ADR merged since the last run names a seat with no run
  following.** `docs/decisions.md` is unchanged since 2026-09-25 (still
  the ADR-005/006 numbering collision, two rulings under each number;
  outside this seat's writable surface to fix).
- **One sprint item has no seat work in flight**: sprint-2026-10-05's
  item 3, the redaction standard (security, gates O2 KR2.2), has no
  open PR touching it — confirmed directly, `find docs/security
  -iname '*redaction*'` returns nothing and no open PR's file list
  names it. This would ordinarily fire a dispatch under §11.3's "a
  sprint item is due this week and its owning seat has not run"
  criterion, except the seat it would dispatch (security) already has
  two open PRs (#75, #85), which forecloses it under §11.4 regardless.
  The real unlock is security rebasing #75 (asked of it this run, on
  the board); once that lands, item 3 becomes dispatchable.
- **The open milestone** ("Sprint 2026-09-28," #2) is two days past
  its 2026-10-04 due date with zero issues/PRs attached through
  GitHub's own milestone field. Wiring the current sprint to a
  milestone is ceremony-lane work (§2b), not standup's; flagged in
  `pending.md` for Monday.
- exo, sales: never dispatched by charter (exo audits this seat; sales
  is dormant, posture `private-rd`, never for sale per ADR-001).

## Dispatched by the PM

None this run.
