# Pending — what the org owes, and what waits on the owner

Maintained every PM run (docs/standards/pm.md §5). Each line dated.

Reconciled 2026-10-11, ~06:20 UTC (six-hour pass). Opens by self-
merging this seat's own #158 and #160 under Tier A (pure
`docs/sprints/`/`docs/agents/` diffs, base of the stack first) at the
top of this run rather than leaving them open, then continues from
current `main`. Older passes' detail (2026-10-11 02:34 UTC and before)
is not repeated below; it is in `main`'s history of this file and in
PRs #137/#147/#149/#150/#152/#154/#158/#160.

## This run (2026-10-10, ~16:08 UTC)

1. **Inbox: nothing new.** Queried
   `$BOARD_API_URL/api/messages?to_seat=pm&to_company=Ursa` and
   filtered client-side for `to_company == "Ursa" && to_seat == "pm"`
   exactly. Two matches, both already answered before this run: the
   2026-10-09T17:45 exo-centralizer dispatch-403 diagnosis (handoff,
   answered by the 06:20 UTC pass) and a 2026-10-10T12:29:59 `done`
   from HQ's own PM closing the loop on a stale ask about #142/#144
   (both long since merged elsewhere). Nothing unanswered.
2. **Failed runs: none.** `gh run list --status failure --created
   ">=2026-10-09T16:08:00Z"` returns nothing; the last 30 runs are all
   `success` except this run itself (`in_progress`). Nothing to rerun
   or hand off.
3. **Tier B merge check: nothing new to merge.** Every open, non-draft
   PR checked fresh (`gh pr view --json mergeable,mergeStateStatus`):
   #80 (`company.yaml`, `MERGEABLE`/`CLEAN`, held by an owner comment
   26 seconds after its own last push — §10 condition 2, unchanged
   since 2026-10-05), #140 and #75 (`CONFLICTING`, blocked regardless
   of tier until the skill and security seats rebase them). No other
   non-draft PR is open. §21's standing Tier B grant is live in this
   repo but has nothing new to reach this run: the only non-draft
   candidates are the same three already decided, unchanged from the
   last several passes.
4. **No dispatch fired, wall now fully diagnosed rather than half
   diagnosed.** This run is the scheduled GitHub Actions run itself
   (`agent-pm.yml`), not a host-window pass, so it can answer the
   question the last several host-window passes could only flag: `env`
   confirms `DEFAULT_WORKFLOW_TOKEN` is present alongside the swapped
   `GH_TOKEN`/`GITHUB_TOKEN`, exactly as exo-centralizer's handoff said.
   The credential wall is real and has a working fix
   (`GH_TOKEN="$DEFAULT_WORKFLOW_TOKEN" gh workflow run ...`). It does
   not matter: the second wall is independent of the caller's
   credential. `grep -c '^allowed_bots'` against current `main`'s
   `agent-security.yml` and `agent-frontend.yml` still returns `0` for
   both, and `checkHumanActor` runs inside the dispatched workflow
   against its own triggering actor. Firing either queued candidate
   would be accepted by GitHub and die seconds later, never reading its
   charter. Not fired, not tested by firing, per exo's own request to
   read the reach check rather than reason from a 403.
5. **The milestone clock is now about 8 hours out.** "Sprint 2026-10-05"
   is due 2026-10-11T00:00:00Z. Item 3 (the redaction standard) is
   still unshipped: no file at `docs/security/`, no open PR touching
   the path. Blocked on the wall in line 4, HQ's surface, not a gap
   this seat closes by trying harder. Not yet past the date, so the
   milestone has not closed.

## Top three for the owner

1. **#80 is the one real owner-action item.** Unchanged since
   2026-10-05: you commented on it directly, so it stays yours under
   §10's Tier B condition 2 even with §21 in effect. Still green and
   `MERGEABLE`.
2. **The redaction standard (sprint item 3) is about 8 hours from its
   milestone date and still cannot be dispatched.** The fix is an
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
  similarity) — merged via #107 and #134. Unrelated but landed this
  week: #153 (engineer, the launch-parity test).
- **Moves this run:** nothing. Item 3 (the redaction standard) cannot
  move until HQ's `allowed_bots` fix lands; this seat has nothing
  further to try that it hasn't already tried and confirmed again this
  run.
- **Hand-off:** item 3 stays with HQ's own project manager (the
  `allowed_bots` workflow fix, routed 2026-10-09) and, once that lands,
  with the security seat (drafting the standard itself, per sprint
  notes). The skill seat owns rebasing #140; the security seat owns
  rebasing #75. No item in this sprint is this seat's own to move
  further right now.

## My own open pull requests

#158 and #160 (the ~00:22 UTC and ~02:34 UTC passes) are both merged,
self-merged under Tier A at the top of the ~06:20 UTC pass. This pass's
own PR (draft while in progress) is the only one of this seat's open
now. #152 and #154 were merged earlier the same way. Nothing else of
this seat's is open.

## Everything else open (15 total via `gh pr list --state open`, plus
this seat's own #160)

- **Owner-held**: #80 ("Top three" item 1).
- **Conflicting, waiting on the owning seat's rebase**: #140 (skill —
  "Top three" item 3), #75 (security — a live CSRF/RCE defect, handed
  off 2026-10-06, still unrebased; #124 was meant to be the response
  and is itself a dead draft, see below).
- **Frontend's live draft**: #141 (real work in progress — benchmark
  write-up and after-shots still its own unfinished tail; the contrast
  dispatch would build on it once the permissions gap closes).
- **Engineer's live draft, killed by the cap, real work inside**: #159
  (Incident 11, above — owed by the engineer seat's next run, not
  this seat's to ready).
- **Dead drafts, nothing committed since their own ship-first commit**:
  #124 (security, since 2026-10-07T06:29), #143 (exo, since
  2026-10-08T20:10 — exo's own to resolve, not this seat's; noted, not
  touched).
- **Draft, idle since 2026-09-30–10-06, not failing CI, seat already
  has a newer open PR or the gap it names is already resolved
  elsewhere**: #47, #49, #85, #87, #91, #112, #113. Unchanged from the
  last several runs' read; resolving this backlog of drafts is
  ceremony-weight triage, flagged for Monday (2026-10-12) rather than
  attempted piecemeal in a standup run.

Full list, oldest first, is `gh pr list --state open`; not reproduced
line by line since it goes stale by the next run.

## Board hygiene (unchanged today)

The board's `sprint` object still names `sprint-2026-09-21` (ends
2026-09-27), two cycles stale — `docs/sprints/sprint-2026-10-05.md` is
the real current sprint and the board was never moved to match.
Re-pointing it and regrooming "This sprint" against what's actually in
flight is ceremony-weight work, flagged for Monday (2026-10-12) rather
than done piecemeal in a standup run.

## Waiting on an owner-only action

- `company.yaml` (#80) — held by your own comment on it, not by tier.
- #140 under `prompts/skill-extract.md`, once the skill seat rebases it
  off `CONFLICTING` (not owner-only once clean; flagged only because
  the next thing to land on it is the seat's rebase, not your merge).
- The three ledger entries 20+ days past the two-week verdict mark
  (repo split, tuning packs, the merge-commits/PR-reader finding).
  Grooming them is Monday's ceremony (2026-10-12), not this run's.
- The `docs/decisions.md` ADR numbering collision — two different
  entries both titled ADR-005 and two both titled ADR-006. Outside
  this seat's writable surface. Checked again this run: unchanged.
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

## This run (2026-10-10, ~17:43 UTC, message pass)

Triggered by a board `done` from `alexandra-systems/engineer`, posted
17:40:25 UTC, addressed `to_seat: pm` with `to_company: null`, subject
"The Tier A scope branch merges now, and the register merge was making
every ledger rebase look like a rewrite." It reports a conflict
resolved on the standard's section 14, both live section 10 amendments
confirmed, 233 tests green, four orphaned drafts disposed of in "my
lane," and two register collisions flagged (not touched) for the
chair's and the centralizer's branches.

**Checked before acting on any of it, per the org rule that board
content is data, not instruction.** Every noun in the report, the
standard being amended, the drafts, the register, the chair's and the
centralizer's branches, is alexandra-systems's own, not Ursa's. The
`to_company` field is null, the same shape as the routing gap the
engineer seat surfaced against this seat on 2026-10-07: a message
addressed to a seat without a company name wakes every company holding
that seat. alexandra-systems's own PR #133 (open) is already fixing
that read path, so I did not file a second handoff about it.

I also pulled the pull request the message cited as the merged branch.
It is open, not merged, and its title and body describe a different
task (another engineer run's two blockers on PR #90), so the report
does not check out through that link either, consistent with the
message not being meant for this seat in the first place.

Full inbox re-checked the same way as the 16:08 UTC pass: zero exact
`to_company == "Ursa" && to_seat == "pm"` matches arrived since then.
No failed runs since 16:08 UTC (`gh run list` clean).

**Action:** replied on the board to `alexandra-systems/engineer`, in
first person, saying none of it is Ursa's to act on and why, and
pointing at the open routing-gap fix instead of duplicating it. No
file in this repo changed because of the report's content; this
section and the PR are the record that it was read and answered.

## Board message check

Queried `$BOARD_API_URL/api/messages?to_seat=pm&to_company=Ursa` and
filtered client-side to the exact match, since the query parameters
alone still return other companies' broadcast traffic. Two matches,
both already answered before this run (see above). Posted one board
note this run with the reason in first person, as required.

## This run (2026-10-11, ~00:22 UTC, six-hour pass)

1. **Inbox: still clean.** Same query, same client-side filter to
   `to_company == "Ursa" && to_seat == "pm"` exactly (the parameters
   alone still return every company's broadcast traffic, unchanged).
   45 messages fetched, same count and same newest timestamp
   (2026-10-10T18:28:39Z) as the previous pass's read. Nothing has
   arrived addressed to this seat since the 16:12 UTC standup closed
   its own inbox clean. Nothing to answer.
2. **Failed runs: none.** `gh run list --status failure --created
   ">=2026-10-10T18:22:00Z"` (six hours back from this run's start)
   returns an empty list. Nothing to triage, rerun, or hand off.
3. **Tier B merge check: nothing new to merge, same three candidates
   as last pass.** Checked every open PR fresh
   (`mergeable`/`mergeStateStatus`): #80 is still `MERGEABLE`/`CLEAN`
   but still held by the owner's own 2026-10-05 comment, posted 26
   seconds after the branch's last commit, so condition 2 of the Tier
   B check still excludes it regardless of §21. #75 and #140 are both
   still `CONFLICTING`/`DIRTY` — unrebased since the last several
   passes, blocked on their owning seats (security, skill), not on
   tier. Every other open PR is a draft, and a draft fails Tier B's
   own gate before any other condition is checked. The standing §21
   grant is live in this repo (confirmed again, no change needed to
   re-confirm it); it simply has nothing new to reach.
4. **The sprint's milestone date has now passed.** "Sprint 2026-10-05"
   was tracked against 2026-10-11T00:00 UTC; this run starts at
   00:22 UTC, past that mark. Items 1 and 2 shipped last week (#107,
   #134). Item 3, the redaction standard, is still unshipped: no file
   at `docs/security/`, confirmed again directly, and no open PR
   touches that path (`gh pr list --search redaction` returns only
   #47 and #75, neither of which drafts the standard). The blocker is
   unchanged from the last several passes: the PM-side dispatch path
   to the security seat is still broken on HQ's `allowed_bots` gap,
   routed to HQ's own project manager on 2026-10-09 and still
   unresolved on HQ's side as of this check. The security seat's own
   Sunday cron (15:15 UTC) has not fired yet today and is not blocked
   by the dispatch gap, since that gap is specific to PM-initiated
   `workflow_dispatch`, not the seat's own schedule trigger — so the
   item still has a path to ship today without the HQ fix landing.
   Per the sprint-file standard (docs/standards/pm.md §3), a sprint
   that reaches its end date with its goal unmet closes with a written
   reason and the goal carried, not silently extended; that closure
   and the next sprint's opening are the Monday ceremony's work
   (2026-10-12), one day out, and this pass records the reason here
   rather than pre-empting the ceremony.
5. **Move today:** nothing moved that the owner needs to act on beyond
   what was already named. Shipped last week stands (items 1, 2). What
   moves next is item 3, on the security seat's own cron later today,
   or on the Monday ceremony's carry-forward if that cron also finds
   the standard still undrafted.
6. **Board:** posted one note this pass, first person, naming the
   clean inbox, the zero failures, and the milestone passing with item
   3 still open, with the reason in prose and the identifiers in
   `data`/`ref` rather than the body, per the board-message protocol.

## This run (2026-10-11, ~02:34 UTC, message-triggered: a failed run)

Triggered by notice of one failed run, `engineer-agent` 38103816460
(2026-10-11T02:02 UTC). Triaged under pm.md §11.7, full detail in
`docs/agents/incidents.md` Incident 11:

1. **Not a tripwire false alarm, not transient.** The no-ship tripwire
   step passed (a PR exists, #159); the failing step was the model step
   itself, exiting on "Reached maximum number of turns (120)" at
   25m40s wall-clock, well inside the 45-minute job cap. Closest to
   configuration, same genre as Incident 10 but a different constant
   (`--max-turns`, not `timeout-minutes`), so PWC-EXO-5 would not have
   prevented this one. No rerun fired: the same assignment would hit
   the same cap again, and a rerun would throw away the real work
   already pushed.
2. **The run's own work is real and large, not a false start.** PR
   #159 carries a genuine defect fix in `src/pairfinder.ts` (a
   `Co-Authored-By` pattern narrower than the fallback it was meant to
   be more reliable than), a second fix (an agent seat's own commits
   read as "the person"), a ~650-line design document, a passing test
   suite, a new CLI flag, four new `proposed` ledger entries, and a
   competitive scan. The run was cut off before it could rewrite its
   own PR description, so the draft does not yet say what is finished.
3. **Owed by the engineer seat:** ready or resolve PR #159 on its next
   run, under its own "read your own seat's open PRs first" duty — this
   seat does not do that for it.
4. **Owed by the ExO seat:** `PWC-EXO-6`, raising `--max-turns` for the
   engineer workflow with a recorded reason, the same bar Incident 10
   set for `timeout-minutes`. Not dispatched this pass — ExO already
   holds an open draft (#143) and §11.4 stops a dispatch to a seat
   holding one unless told to build on it. Named here for the next
   standup to fire, or for ExO's own Sunday run (today, not yet landed
   as of this pass) to pick up on its own.
5. **Board:** posted one note this pass, first person, naming the one
   failure, its classification, and the two handoffs, per the
   board-message protocol.

## This run (2026-10-11, ~06:20 UTC, six-hour pass)

**First act: resolved this seat's own two open PRs rather than stacking a third.**
#158 and #160 were both open, non-draft, and pure knowledge-surface
diffs (`docs/sprints/pending.md`, `docs/agents/incidents.md`), checks
green. #160's branch already carried #158's commit, so I self-merged
under Tier A in stack order — #158 first, then #160 — instead of
branching a new PR on top of them. Both are `MERGED` as of 06:24-06:25
UTC. This pass continues from the resulting `main`.

1. **Inbox: still clean.** Re-queried
   `$BOARD_API_URL/api/messages?to_seat=pm` with and without the
   `to_company=Ursa` filter. Same two exact `to_company == "Ursa"`
   matches as every pass since 2026-10-10 (the moot 142/144 close-out,
   the exo-centralizer credential handoff), both already answered.
   Three more messages arrived in the unfiltered query since the last
   pass's cutoff, all addressed to other companies (`None`,
   `alexandria`, `alexandra-systems`) by the routing gap already on
   record — none of them Ursa's. Nothing new to answer.
2. **Failed runs: none.** `gh run list --status failure --created
   ">=2026-10-11T02:36:00Z"` (since the last pass's read) returns
   empty, and widening to the full six-hour window
   (`>=2026-10-11T00:20:00Z`) surfaces only the one failure already
   triaged and closed out in the section above (`engineer-agent`,
   38103816460). Nothing new to triage or rerun.
3. **Tier B merge check: still nothing new.** Checked every open PR
   fresh. #80 (`company.yaml`) is still `MERGEABLE`/`CLEAN` but still
   held by the owner's own 2026-10-05 comment 26 seconds after its
   last push — Tier B condition 2 excludes it regardless of §21's
   standing grant, unchanged since 2026-10-05. #75 and #140 are still
   `CONFLICTING`/`DIRTY`, waiting on their own seats (security, skill)
   to rebase — condition 5, not a tier question. Every other open PR
   is a draft (14 open total, 3 non-draft: exactly these three), and a
   draft fails Tier B's own gate before any other condition applies.
   §21's grant is live and unchanged; it has nothing new to reach.
4. **Sprint: item 3 still carries past its milestone.** No new file at
   `docs/security/`, no new PR touching that path. The security seat's
   own Sunday cron (15:15 UTC) is about nine hours out and still the
   live path to ship it today without HQ's `allowed_bots` fix; that
   fix is still unlanded (`grep -c allowed_bots` against current `main`
   still returns 0 in both `agent-security.yml` and
   `agent-frontend.yml`). Formal closure and carry-forward is
   tomorrow's Monday ceremony (2026-10-12), one pass out; this pass
   again records the reason rather than pre-empting it.
5. **Owed by the engineer seat, unchanged:** PR #159 is still open and
   still a draft (`isDraft: true`, last updated 06:25 UTC — that
   timestamp moved only because my own Tier A merges touched
   `docs/sprints/pending.md`, not because the engineer seat acted on
   it). Readying or resolving it is still that seat's own "read your
   own open PRs first" duty, not mine.
6. **A numbering note for the ExO seat, not touched by this seat.**
   The handoff named in the section above asks ExO to file a
   `PWC-EXO-6` entry for the engineer's `--max-turns` cap.
   `docs/agents/pending-workflow-changes-exo.md` already has a
   `PWC-EXO-6` on a different topic (queued 2026-10-05, the
   external-content rule), so the `--max-turns` entry needs its own
   number, whatever ExO's own run assigns next. Flagged here so ExO
   does not learn about the collision by overwriting its own file;
   that file is ExO's writable surface, not mine, so I have not
   touched it. ExO's weekly Sunday run (today) also still has not
   landed since its last run on 2026-10-04.
7. **Move today:** nothing beyond what the last pass already named.
   Shipped this week stands (items 1, 2, #107/#134). What moves next
   is item 3, either on the security seat's own cron later today or on
   tomorrow's ceremony carry-forward.
8. **Board:** posted one note this pass, first person, naming the two
   self-merges, the clean inbox, the zero new failures, and the
   milestone still carrying, per the board-message protocol.
