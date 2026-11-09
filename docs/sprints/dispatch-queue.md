# Dispatch queue — 2026-11-09, message-triggered (tenth pass)

**Tenth message pass of today.** Triggered by the frontend seat's run
timing out at the host's 60-minute wall clock, with an open draft
(`#765`) behind it. Rechecked fresh against the criteria table below.

`PM_DISPATCH_ENABLED` cannot be read on this run's token (`gh variable
get` 403s, the same wall every host pass has found since 2026-10-17).
This is a host run, not a GitHub Actions run, so `gh workflow run
agent-<seat>.yml` (pm.md §11.5) does not apply here regardless of the
switch. Nothing below could fire from this run even if it qualified;
the applicable channel for continuation work is the board handoff,
posted this pass.

## Checked against the criteria table (pm.md §11.3) and Ursa's own three (§0b)

- **A seat run failed in the last 24h, diagnosable from its log:**
  yes, this is the triggering event. Frontend's run of 01:53:52Z was
  killed by the host's 60-minute wall clock (`exit: "timeout"`,
  confirmed in `/srv/asc/state/.epito/audit.jsonl` and `asc turns`).
  Classified under §11.7 as a real, recurring defect of scope (the
  third such kill recorded against this seat, `runner-facts.md` §85),
  not transient. No rerun; see Incident 19. A dispatch naming "fix and
  re-run" would ask for the same run to fail the same way, so the
  instruction that fits is a handoff to continue on the open branch
  with a smaller next scope, posted on the board rather than fired as
  a workflow dispatch neither available token can send from here.
- **A seat's open draft has failing CI, or a review comment
  unanswered >24h:** `#765` (frontend) has one green check and no
  comments, eight minutes idle. Confirmed directly with
  `/srv/asc/hq/tools/check-draft-prs.sh --repo alexandrapaiz/Ursa`:
  "idle 8m, run may still be live; leave it alone. no orphaned
  drafts." `#774` (engineer) and `#775` (exo) are the same shape, also
  left alone. None qualify for this row.
- **A sprint item due this week with no run from its owning seat:**
  unchanged; no current sprint file holds items to be late against
  (`sprint-2026-10-12.md` is the newest, 28 days old, a ceremony-day
  finding already carried in `pending.md`, not this pass's to open).
- **A seat has two or more open PRs on one scope, none merged:** none.
  Frontend holds exactly one open draft, its own next pull request.
- **A ruling or ADR merged since the last run names a seat with no
  run following:** nothing new since the ninth pass's own check.
- **A milestone due within three days with open items:** none.
- **Ursa's own three (§0b):** no tuning or trial run with unrecorded
  ledger results; no failing check on an open Minor-site or
  Major-resolver PR (none open); no ADR naming an experiment with no
  run started within two days.

## Nothing to fire this run

Handled directly: one Tier B merge (`#768`, exo's register lane,
confirmed green, clean, not a draft, no Tier C path), one incident
entry for the recurring 60-minute kill (Incident 19), and one board
handoff to frontend naming `#765` and what remains in it. See
`docs/agents/pm-2026-11-09-message-10-run.md` for the full account.
