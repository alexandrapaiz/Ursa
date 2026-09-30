# Pending — what the org owes, and what waits on the owner

Maintained every PM run (docs/standards/pm.md §5). Each line dated.
Reconciled 2026-09-30, ~03:50 UTC sync window, against this morning's
standup (#45, 02:47Z) plus the delta the chair's all-hands dispatch
produced after it. Four PM PRs are open at once right now (#20, #34,
#37, #45) on top of this one (#53) — see "The merge queue" below before
reading anything else here; it is the root cause behind most of this
file.

## The merge queue, not seat idleness, is the blocker

Carried from #45, restated because it is still the single most
important fact in this file: 27+ PRs are open, and no non-PM,
non-lessons PR has merged since #9 on 2026-09-24. Four of the open PRs
are the PM's own unmerged ceremony/standup/window output (#20 from
2026-09-26, #34 the Monday 2026-09-28 ceremony, #37 the 2026-09-29
standup, #45 this morning's standup), which is why this file is
reconciled against #45's body rather than against `main`: `main`'s copy
of this file is still whatever PR #23 (merged 2026-09-28) left it,
several days stale. **Every PM PR from #20 onward, including this one,
touches this file and `docs/sprints/dispatch-queue.md`; merge them in
date order (#20, #34, #37, #45, #53) or later ones will conflict.**

## Follow-up mid-window (owner live, ~04:05 UTC): board unreachable

The owner asked this seat to read its board inbox, act on it, and
reply there in first person, and separately relayed three directives
(sprints become milestones, Slack retired, every run ends on the
board — recorded in full as ADR-008). This session has no
`BOARD_API_URL`/`BOARD_RUNTIME_TOKEN` and no board tool loaded, so the
inbox could not be read and no reply was posted there. Said plainly
rather than fabricated. **Chair action needed:** wire board access into
this seat's synchronous-window host sessions, not just its scheduled
GitHub Actions runs.

**Milestones, checked directly (`gh api .../milestones`).** #1 "Sprint
2026-09-21" is already closed. #2 "Sprint 2026-09-28" is open, due
2026-10-04, and its goal has not shipped — the ceremony PR that would
land it on `main` (#34) is still unmerged, so there's nothing to close
yet and no successor to name. It closes the run #34 merges and that
sprint's items land, not before.

**Failed runs, last 24 hours (§11.7 triage, `gh run list --status
failure`).** Only the four already found this morning: `pm-agent`,
`okr-agent`, `market-agent`, `finance-agent`, all off the same
`chair/langfuse-traces` push at 02:16Z, all 0 jobs in 0 seconds.
Classification unchanged: **configuration**, not a defect in any
seat's own code (nothing ran) and not transient (a workflow-file parse
failure doesn't clear on rerun) — asked of HQ/chair, not rerun. No new
failures since. `PM_DISPATCH_ENABLED` could not be read this run either
(`gh variable get` → 403 under this session's token), consistent with
the standing credential-wall note below.

**Tier B merge list, not merged.** #44 (`chair/pm-merges`, the PM-merge
authority change itself) is still open and unmerged on `main`, so this
seat has no Tier B/Tier C merge authority yet — today's charter still
reads "never merge your own PR," and more generally there is no
authority to exercise. If #44 lands, applying its six conditions to
today's open PRs gives this eligible set (checks green, not draft, not
a PM PR, no Tier C path — `prompts/`, `.github/workflows/`, or the
tiers section itself — and no merge conflict): **#15, #22, #24, #25,
#28, #32, #33, #35, #36, #38, #43, #55**, plus **#27** with one caveat
(it ships `tools/ledger/ci/ledger-gate.yml`, a workflow file outside
`.github/workflows/` today but meant to become one — worth a second
look before treating it as routine).

Excluded and why: #19, #30, #39 touch a charter (`prompts/`); #40, #42,
#44 touch `.github/workflows/`; #13, #14, #16, #18, #21 conflict
(engineer's own stack, which #27's union driver and #43's landing plan
exist to resolve); #20, #29, #34, #37, #45 are the PM's own PRs,
excluded under condition 1 even once the authority lands. Thirteen
clean PRs in one pass is a lot of blast radius for a first exercise of
new authority — worth sequencing rather than merging all at once even
once #44 is live, and this run takes no merge action either way.

## Awaiting the owner's merge (top of the queue)

1. **#34 `pm/sprint-2026-09-28`** — last Monday's ceremony PR. Until it
   merges, `main`'s current sprint file is still `sprint-2026-09-21`,
   over a week stale, and this file and the dispatch queue stay stale
   on `main` too. This is the single highest-leverage merge available:
   it unblocks the sprint file and lets the next ceremony (Monday
   2026-10-05) reconcile cleanly.
2. **#44 `chair/pm-merges`** — vendors HQ decision 041 (PMs get Tier B
   merge authority plus failed-run triage). Until it merges, this
   seat's boundaries stay as chartered today: no self-merge, no Tier B
   authority. This run does not attempt either.
3. **~20 seat PRs**, all green on `scan` (redaction gate), zero
   reviewed: engineer has the deepest queue (#13, #16, #18, #22, #24,
   #25, #27, #32, #33, #36, #38, #43 — twelve open PRs, several
   superseding earlier ones in the same lane per #43's own title,
   "land the stack"), plus #14/#50 (skill), #15/#35/#51 (frontend),
   #19/#39/#48 (research), #21/#52 (market), #28/#47 (security),
   #29 (PM message), #30/#46 (exo), #49 (sales, see below). Oldest is
   #13 at six days, past the seven-day flag in all but a few hours.

## This window's delta (since #45, 02:47Z)

The chair's all-hands dispatch (L-A13) fired every seat for this
synchronous window between 03:48 and 03:50Z, opening eight new draft
PRs in about ninety seconds: #46 (exo), #47 (security, first full
audit), #48 (research), #49 (sales), #50 (skill), #51 (frontend), #52
(market), and this one (#53, PM). Two things worth flagging:

- **#49 is sales' first Ursa run, and sales is chartered dormant**
  (ADR-001, ADR-005: "Ursa is private R&D and never for sale," and this
  charter names sales as a seat the PM must never dispatch). Its own PR
  body states the run "was dispatched by the owner (window, 2026-09-30)"
  — activating a dormant seat is explicitly an owner-only action
  (pm.md §11.4), so this is the owner exercising that reserved power
  directly through the window, not a process gap. Noted here so it is
  visible, not because it needs fixing.
- **Engineer and okr did not open new window PRs.** Engineer's last PR
  (#43) was already open when the window opened, so its own hard stop
  correctly held it back rather than opening a tenth-plus duplicate.
  `ursa-okr/2026-09-30-window` exists as a pushed branch with no PR yet
  as of this run; worth a look in a later run if it still has no PR by
  the next standup.

## This run's dispatch reasoning — nothing queued

Every seat now has an open PR (the window's all-hands dispatch just
guaranteed this for six more seats), so §11.4's hard stop — never
dispatch a seat whose last PR is still open, unless told in those exact
words to build on that branch — blocks every candidate at once. No
follow-up message naming a concrete Ursa action has arrived in this
session yet; per §11.4 ("never invent a judgment"), nothing is
dispatched on inference alone. Full reasoning in
`docs/sprints/dispatch-queue.md`. This session stays held for the rest
of the window; a follow-up message that names an action gets acted on
against this same state rather than a fresh read.

## Waiting on an owner-only action

- **Four+ PM PRs need a merge pass**, in date order: #20, #34, #37,
  #45, then #53. See "Awaiting the owner's merge" above.
- The scheduled standup's own token still cannot reach the Actions API
  (`gh api actions/permissions` → 403, confirmed on multiple separate
  days from that credential). This session's own interactive token
  reached it fine for the read-only checks in this run. Action for the
  owner, unchanged: grant `actions: write` to the GitHub App
  installation behind the scheduled `agent-pm.yml`, or confirm it is
  deliberately narrower and the scheduled standup should only ever
  queue, never attempt, a dispatch.
- Three `proposed` ledger entries still have no owner verdict: repo
  split (2026-09-18, 12 days), tuning packs (2026-09-19, 11 days), the
  merge-commits/PR-reader finding (2026-09-20, 10 days). None has
  crossed the two-week flag yet.
- The `docs/decisions.md` ADR numbering collision (ADR-005 and ADR-006
  each used twice, for four different rulings across 2026-09-23 through
  2026-09-25) is still unfixed, carried since 2026-09-25. Outside this
  seat's writable surface.
- `docs/agents/incidents.md` Incident 4's Status line still reads "Open
  until both are edited" (exo's lane, carried since 2026-09-24, not
  re-verified this run).

## Workflow-file failures (HQ/chair lane, not re-litigated)

#45 classified this morning's four 0-jobs-in-0-seconds failures
(pm-agent, okr-agent, market-agent, finance-agent, all off the same
`chair/langfuse-traces` push at 02:16Z) as a workflow-file
configuration issue, HQ/chair's lane per the 2026-09-30 board note.
Not rerun here either; `gh run list` shows no new failures since.
