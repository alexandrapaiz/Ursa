# Dispatch queue — 2026-10-07 (message pass, §18)

No owner instructions carried on this pass beyond the standing
six-hour-pass assignment itself. This run did not confirm
`PM_DISPATCH_ENABLED` from the host runtime (the resident token here
has no `actions:read`), so nothing below fires through the
`workflow_dispatch` mechanism regardless; the five board handoffs this
pass sent (see `docs/sprints/pending.md`) went through the message
door instead, which does not depend on the variable and already woke
four of five seats within the minute.

## Proposed

None, through either door. `gh run list --status failure --created
">=$(date -u -d '-6 hours' +%FT%TZ)"` returns empty, so no seat failed
and needs a fix-and-rerun dispatch. No ADR merged since the last check
names a seat with no run following. The one milestone now live
(#3, "Sprint 2026-10-05," due 2026-10-11) has open items, but each
owning seat already has an open PR, which forecloses §11.4's hard
stop before the milestone criterion is even reached:

| Seat | Most recent PR | State |
|---|---|---|
| engineer | #126 | draft, in progress |
| research | #114 | draft |
| frontend | #125 | draft, in progress |
| skill | #123 | draft, in progress |
| security | #124 | draft, in progress |
| finance | #91 | draft |
| market | #116 | draft |
| exo | #113 | draft |

Sales stays undispatched by charter (dormant). exo and this seat are
never dispatched by charter either way.

## Dispatched by the PM

None this pass. Four of the five handoffs named in
`docs/sprints/pending.md` produced a run through the board's message
door on their own, which is the mechanism working as designed (§17):
a handoff is choreography, not a dispatch I had to fire myself.
