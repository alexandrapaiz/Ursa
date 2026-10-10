# Pending — what the org owes, and what waits on the owner

Maintained every PM run (docs/standards/pm.md §5). Each line dated.

Reconciled 2026-10-10, ~12:21 UTC (six-hour pass). Builds on this
seat's own #152 (Tier A self-merge, pure `docs/sprints/` diff, merged
at the top of this pass rather than left open) and continues from
current `main`. Older passes' detail (2026-10-09 and before) is not
repeated below; it is in `main`'s history of this file and in PRs
#137/#147/#149/#150/#152.

## This pass (2026-10-10, ~12:21 UTC)

1. **Inbox: nothing new.** Queried `$BOARD_API_URL/api/messages?to_seat=pm&to_company=Ursa`
   and filtered client-side for `to_company == "Ursa" && to_seat ==
   "pm"` exactly (the bare query still returns other companies'
   broadcast traffic — 38 messages returned, 1 match). The one message
   ever addressed to this seat specifically, the 2026-10-09T17:45
   exo-centralizer dispatch-403 diagnosis, was already answered before
   this pass started. No ask or handoff has arrived since the prior
   pass's own board note (06:25:33Z). Nothing unanswered.
2. **Failed runs: none.** `gh run list --status failure --created
   ">=2026-10-10T06:00:00Z"` returns nothing, and the last 30 runs are
   all `success`. Nothing to rerun or hand off.
3. **Tier B merge check: nothing new to merge.** Every open, non-draft
   PR checked fresh (`gh pr diff --name-only`, `mergeStateStatus`):
   #80 (`company.yaml`, `MERGEABLE`/`CLEAN`, held by an owner comment
   since its last push — §10 condition 2, unchanged since 2026-10-05),
   #140 and #75 (`CONFLICTING`, blocked regardless of tier until skill
   and security rebase). No other non-draft PR is open. §21's standing
   Tier B grant is live in this repo (exercised already today — #153
   merged by the prior pass, #152 self-merged under Tier A by this
   one) but it has nothing new to reach this pass: the only
   non-draft candidates are the same three already decided.
4. **No dispatch fired, for the same reason, now sharper.** Re-checked
   both walls the exo-centralizer diagnosed 2026-10-09: this run is a
   host-window run, not a GitHub Actions run (`env` has `GH_TOKEN` but
   no `GITHUB_ACTIONS`/`RUNNER_*`), so the first wall — the GHA
   credential swap that strands `agent-pm.yml`'s own dispatch call
   behind an installation token scoped to contents/PRs/issues — likely
   does not apply to this seat's host-window passes the way it does to
   its scheduled Actions runs; worth HQ confirming, not assumed fixed.
   The second wall still does: `grep -c '^allowed_bots'` against
   `agent-security.yml` and `agent-frontend.yml` on current `main`
   still returns nothing, and that check runs inside the dispatched
   workflow itself regardless of who calls `gh workflow run`, so firing
   from here would still die at the human-actor check. Not fired.
5. **The milestone clock is now inside 12 hours.** "Sprint 2026-10-05"
   is due 2026-10-11T00:00:00Z — 11h39m from this pass — with item 3
   (the redaction standard) still unshipped: no file at
   `docs/security/`, no open PR touching the path
   (`gh pr list --state all --search "redaction-standard"` matches
   nothing new). Blocked on the wall in line 4, HQ's surface, not a
   gap this seat closes by trying harder. If it is still unshipped when
   the date passes, the milestone closes with a written reason and the
   item carries, per pm.md §3 — not yet, since the date hasn't passed.

## Top three for the owner

1. **#80 is the one real owner-action item.** Unchanged since
   2026-10-05: you commented on it directly, so it stays yours under
   §10's Tier B condition 2 even with §21 in effect. Still green and
   `MERGEABLE`.
2. **The redaction standard (sprint item 3) is now inside 12 hours of
   its milestone date and still cannot be dispatched.** The fix is an
   `allowed_bots` line in two workflow files, HQ's surface, already
   routed to HQ's own project manager. Nothing new to decide, only the
   clock.
3. **Skill's #140 and security's #75 both need a rebase from their own
   seat** before any tier can reach them. Not a decision for you, named
   so the queue count stays legible.

## The sprint (docs/sprints/sprint-2026-10-05.md)

**Goal:** keep the sold signal provably grounded, and clear the
redaction gate blocking KR2.2's public record.

- **Shipped:** items 1 and 2 (excerpt-grounding bound, descent-vs-
  similarity) — merged via #107 and #134, both before this pass.
  Unrelated but landed today: #153 (engineer, the launch-parity test),
  merged by the prior pass under Tier B.
- **Moves today:** nothing. Item 3 (the redaction standard) cannot
  move until HQ's `allowed_bots` fix lands; this seat has nothing
  further to try that it hasn't already tried.
- **Hand-off:** item 3 stays with HQ's own project manager (the
  `allowed_bots` workflow fix, routed 2026-10-09) and, once that lands,
  with the security seat (drafting the standard itself, per sprint
  notes). The skill seat owns rebasing #140; the security seat owns
  rebasing #75. No item in this sprint is this seat's own to move
  further right now.

## My own open pull requests

This pass's own (#154, this PR). #152 is merged (Tier A, see above).
Nothing else of this seat's is open.

## Everything else open (13 total, via `gh pr list --state open`)

- **Owner-held**: #80 ("Top three" item 1).
- **Conflicting, waiting on the owning seat's rebase**: #140 (skill —
  "Top three" item 3), #75 (security — a live CSRF/RCE defect, handed
  off 2026-10-06, still unrebased; #124 was meant to be the response
  and is itself a dead draft, see below).
- **Frontend's live draft**: #141 (real work in progress — benchmark
  write-up and after-shots still its own unfinished tail; the contrast
  dispatch would build on it once the permissions gap closes).
- **Dead drafts, nothing committed since their own ship-first commit**:
  #124 (security, since 2026-10-07T06:29), #143 (exo, since
  2026-10-08T20:10 — exo's own to resolve, not this seat's; noted, not
  touched).
- **Draft, idle since 2026-09-30–10-06, not failing CI, seat already
  has a newer open PR or the gap it names is already resolved
  elsewhere**: #47, #49, #85, #87, #91, #112, #113. Unchanged from the
  last several passes' read; resolving this backlog of drafts is
  ceremony-weight triage, flagged for Monday rather than attempted
  piecemeal in a six-hour pass.

Full list, oldest first, is `gh pr list --state open`; not reproduced
line by line since it goes stale by the next pass.

## Board hygiene (unchanged today)

The board's `sprint` object still names `sprint-2026-09-21` (ends
2026-09-27), two cycles stale — `docs/sprints/sprint-2026-10-05.md` is
the real current sprint and the board was never moved to match.
Re-pointing it and regrooming "This sprint" against what's actually in
flight is ceremony-weight work, flagged for Monday (2026-10-12) rather
than done piecemeal in a standup pass.

## Waiting on an owner-only action

- `company.yaml` (#80) — held by your own comment on it, not by tier.
- #140 under `prompts/skill-extract.md`, once the skill seat rebases it
  off `CONFLICTING` (not owner-only once clean; flagged only because
  the next thing to land on it is the seat's rebase, not your merge).
- The three ledger entries 20+ days past the two-week verdict mark
  (repo split, tuning packs, the merge-commits/PR-reader finding).
  Grooming them is Monday's ceremony (2026-10-12), not this pass's.
- The `docs/decisions.md` ADR numbering collision — two different
  entries both titled ADR-005 and two both titled ADR-006. Outside
  this seat's writable surface. Checked again this pass: unchanged.
- **The workflow-permissions gap** (`allowed_bots` missing from
  `agent-security.yml` and `agent-frontend.yml`): routed to HQ's
  project manager 2026-10-09, with the commands written out; needs the
  owner's credential across five checkouts. Tracked at HQ now.
- **The skill charter's Data access section** naming a Neon claims
  database Ursa does not have (docs/decisions.md, found independently
  four times since 2026-09-24). Handed to exo (board message,
  2026-10-08); exo's weekly run is Sunday 2026-10-11, not yet run.
  `prompts/skill-agent.md` is Tier C, so this seat cannot fix it
  directly.

## Board message check

Queried `$BOARD_API_URL/api/messages?to_seat=pm&to_company=Ursa`
(38 messages returned, filtered client-side to the exact match, since
the query parameters alone still return other companies' broadcast
traffic). One match, already answered before this pass (see above).
Posted one board note this pass with the reason in first person, as
required.
