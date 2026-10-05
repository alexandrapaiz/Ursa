# Pending — what the org owes, and what waits on the owner

Maintained every PM run (docs/standards/pm.md §5). Each line dated.
Reconciled 2026-10-05, ~03:18Z synchronous window (docs/standards/pm.md
§11.4, L-P7 — the chair opened this one before today's scheduled
Monday ceremony fires at 12:00Z), against `gh pr list --state open
--limit 200`, `gh run list --limit 40`, and `gh api
repos/.../milestones`.

## Awaiting the owner's merge

The real backlog. **62 PRs open** as of this run, up from 49 yesterday
— the jump is tonight's chair-opened window pass, which gave seven
seats a fresh draft PR each (see "This run's dispatch reasoning"
below) on top of the normal engineer/exo/HQ traffic overnight. Every
one checked this run is green CI — the same lone exception as every
prior run, #52, has no checks configured on its changed paths, not a
failure — zero reviews, zero unanswered comments needing a seat's
reply beyond what's already named below. The last merge of anything
besides a PM standup, a lessons sync, or board wiring is still PR #9,
merged 2026-09-24 — **eleven days ago now**. This is still the single
blocking fact for the whole org: nothing is stuck on a defect,
everything is stuck on review.

Four sit here for the owner's decision specifically, oldest first:

- **#20** `ursa-pm/2026-09-26-window` (Tier B, an ADR-007 proposal in
  `docs/decisions.md`, plus an owner directive in its own comment
  thread that Slack reports should carry PM prose, not a template) —
  open 9.1 days, past the seven-day flag in docs/standards/pm.md
  §11.3.
- **#29** `ursa-pm/2026-09-27-message` (Tier B, ADR-008: name decisions
  by what they decide, not by code, plus a charter-wording proposal) —
  open 7.3 days, just past the same seven-day flag. **Not previously
  carried on this list** — a tracking gap, fixed on the spot this run
  (charter §1d). It touches `docs/agents/org-chart.md`,
  `docs/decisions.md`, and `docs/sprints/sprint-2026-09-21.md`; no
  overlap with #20/#34/#90's files, so it merges independently of the
  other three.
- **#34** `pm/sprint-2026-09-28` (this seat's own ceremony PR: the
  retro, the ledger grooming, and the new sprint file) — open 6.3
  days. `main`'s sprint file is still `sprint-2026-09-21`, now 14 days
  stale. The open milestone ("Sprint 2026-09-28," #2) is now a day
  overdue (due 2026-10-04) with zero issues or PRs attached through
  GitHub's own milestone field even though #34 carries the real
  content — closing that gap is #34's own job once it lands.
- **#44** `chair/pm-merges` (HQ decision 041: Tier B becomes a PM
  self-merge under six written conditions, plus a standup duty to
  triage the company's failed runs) — open 5.0 days. Landing this is
  the actual unblock every standup since 2026-09-30 has named: it
  would let this seat clear the 50+ green, unreviewed builder PRs
  itself instead of waiting on her to click merge one at a time.

Everything else open is a builder-seat PR (engineer, research,
frontend, skill, security, market, okr, finance) or an owner-authored
"window" PR (tonight's #81-87, or 2026-09-30's #46-56). Full list,
oldest first, is `gh pr list --state open`; not reproduced here since
the finding is the count and the cause, not the enumeration, and a
static list would go stale by tomorrow.

## This run's dispatch reasoning — nothing queued

Every dispatchable seat's most recent PR is open (engineer #86 over
#77, research #82, frontend #84, skill #83, okr #63, finance #62,
market #52, security #85), which alone forecloses docs/standards/pm.md
§11.4's hard stop regardless of anything else observed. The one
non-success run since the last PM run is a **cancelled** (not failed)
scheduled `engineer-agent` cron, superseded a minute later by the
window's own dispatch — not a diagnosable defect. No ADR merged since
the last run names a seat without a run following (`docs/decisions.md`
still ends at the ADR-005/006 numbering collision, unchanged since
2026-09-25). The open milestone is now overdue but still carries zero
attached items, so the gap is a merge, not a dispatch. `gh variable
list` 403'd for this session's token, so `PM_DISPATCH_ENABLED` could
not be confirmed either way — moot, since the hard stop already blocks
every candidate. Full reasoning, including one asymmetry worth naming
(tonight's window reached seven seats, not ten), in
docs/sprints/dispatch-queue.md.

## Waiting on an owner-only action

- Unchanged from every standup since 2026-09-24: the scheduled
  standup's own installation token still cannot reach the Actions
  API (`gh workflow run` dispatch calls return `403 Resource not
  accessible by integration`, last reconfirmed by #67 on 2026-10-02
  against a real dispatch attempt, not just the permissions probe).
  This session's own token is a separate case (the `gh variable list`
  403 above), consistent with the same underlying gap. Action for the
  owner, unchanged: grant `actions: write` to the GitHub App
  installation that runs the scheduled `agent-pm.yml`, or confirm the
  standup should only ever queue dispatches and never fire them. Not
  re-tested this run since the reason above (every seat's last PR
  open) already forecloses every candidate regardless.
- Three `proposed` ledger entries have now crossed the two-week mark
  with no verdict: repo split (2026-09-18, 17 days), tuning packs
  (2026-09-19, 16 days), the merge-commits/PR-reader finding
  (2026-09-20, 15 days). Grooming is Monday-only — today's ceremony,
  2026-10-05, fires at 12:00Z, after this window closes — so this is
  the flag that puts all three in "Awaiting your verdict" when it
  runs, not a surprise.
- The `docs/decisions.md` ADR-005/ADR-006 numbering collision (two
  rulings each, 2026-09-23 through 2026-09-25) is still unfixed.
  Outside this seat's writable surface.

## Noticed in passing, not this seat's lane

- Frontend's #15, #35, and #51 each still carry a self-comment
  ("superseded by #65") dated 2026-10-01 but remain open, not closed —
  unchanged since the last two runs flagged it. Not touched here;
  flagging again so frontend's own next run (or the owner, directly)
  can close them.
- The owner's comment on #53 ("I could not read or reply on the
  board") suggests the board UI has a gap beyond the known `PATCH` 501
  (item-update not supported). Not this seat's lane to diagnose
  further.
