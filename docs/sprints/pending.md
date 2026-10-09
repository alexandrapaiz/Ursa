# Pending — what the org owes, and what waits on the owner

Maintained every PM run (docs/standards/pm.md §5). Each line dated.

Reconciled 2026-10-09, ~18:30 UTC (six-hour pass). Builds on this
seat's own #149 (open at the start of this pass, merged into this
branch rather than redone from `main`, per "read your own seat's open
PRs first"). The headline change this pass: **pm.md §21 ("Merges
belong to the PMs and the chairs, not to the owner") is live in this
repo's vendored standard and three stuck pull requests were sitting on
the wrong side of a tier call that predates it.** Re-read §10 and §21
together and merged what §21 actually frees.

## What moved this pass

1. **#148, #48 and #39 are merged.** All three were green, `CLEAN`,
   and scoped to files that are not this seat's own charter and not an
   authority section (§10, §19, §21, or the PM charter's grant) and
   not spend, an account, or a secret. §21 says a PR meeting the
   tiers' other conditions is the PM's or a chair's to merge, "Standards,
   charters, workflows and decisions included" — so a charter edit to
   `prompts/research-agent.md`, `prompts/engineer-agent.md` or
   `prompts/skill-agent.md` is not automatically owner-only the way
   §10 alone reads it. Prior passes (including this seat's own) called
   these three "Tier C, waiting on the owner" by path without
   re-checking them against §21, which has been in the vendored
   standard since it was pinned 2026-10-05 — that was a standing
   error, not a new fact. #48 and #39 were also both more than seven
   days old by last commit, the Tier B age flag in §10; I read both
   diffs in full before merging rather than landing them on the
   strength of their green checks alone, and both were still correct
   and still wanted (#48 replaces alexandria's pipeline assumptions in
   the research charter with Ursa's actual evidence sources and the
   mandatory ecosystem check; #39 is a one-word ADR-attribution fix
   with no behavior change). #148 is this morning's second engineer
   dispatch, same-day and unrelated to the age question.
2. **#80 stays with the owner, and this is the one that proves the
   check matters.** Same file class as #48 and #39 (`company.yaml`,
   not an authority section), but `alexandrapaiz` commented on it
   2026-10-05T02:41:43Z, 26 seconds after its last push. §10's Tier B
   condition 2 ("no owner comment since the last push") still applies
   under §21 — the rule says a PR meets "the conditions the tiers
   already state," not that §21 waives them. So #80 is correctly still
   yours, not a leftover of the old misreading.
3. **#140 and #75 are still `CONFLICTING`** against `main`, which
   blocks a merge under any tier regardless of path. Both need a
   rebase from their own seat (skill, security) before anyone can act.

## Top three for the owner

1. **#80 is the one real owner-action item left.** You commented on
   it directly (2026-10-05), so it stays yours under §10's Tier B
   condition 2 even with §21 in effect. Substance unchanged since it
   was opened: the HQ company manifest, green and `MERGEABLE`.
2. **Skill's #140** still needs a rebase from the skill seat before
   any tier can reach it — `CONFLICTING` against `main`, not a
   decision for you. See "Everything else open" below.
3. **Security's redaction-standard item (sprint item 3, gates O2
   KR2.2) and frontend's WCAG contrast fix are still real and still
   undispatchable**, now for a reason fully diagnosed and routed to
   HQ rather than open: HQ needs to add `allowed_bots` to
   `agent-security.yml` and `agent-frontend.yml`, which is her
   surface, not a seat's. Milestone "Sprint 2026-10-05" is due
   2026-10-11, two days out.

## Failures this pass (§11.7)

**No new failed runs.** `gh run list --status failure --created
">=2026-10-09T12:23:18Z"` (the last six hours) returns nothing. The
last 30 runs (`gh run list --limit 30`) are all `success`. Nothing to
rerun or hand off this pass.

**No dispatch attempted this pass** — see `dispatch-queue.md`. Both
candidates (security building on #124, frontend building on #141)
stay queued; firing either would still die at the `allowed_bots` wall
per the exo-centralizer's diagnosis, answered in full by #149.

## Resolved this pass

- **#149**: this seat's own open PR at the start of this pass
  (exo-centralizer's dispatch-403 handoff, fully answered). Its one
  commit is carried unchanged as this branch's base; closing #149
  itself as superseded once this PR exists, per "read your own seat's
  open PRs first."
- **The two board asks addressed to `pm`/`Ursa` since the last pass**
  (the exo-centralizer handoff and the 2026-10-07 engineer note) were
  both already answered before this pass started — the handoff by
  #149, the note as moot once #92 closed. Re-checked the inbox this
  pass (`to_seat=pm&to_company=Ursa`, filtered client-side): nothing
  new and nothing unanswered.

## My own open pull requests

This pass's own (#150, continuing #149's branch). Nothing else of
this seat's is open after #149 is closed as superseded.

## Tier B merge check this pass

Every open, non-draft PR checked against §10 **and** §21 together
(`gh pr diff --name-only`, `mergeStateStatus`, comments, labels on
each): #148 (engineer, clean, no authority/spend/secret path) merged.
#48 and #39 (research charters, same test, both old by last commit but
re-verified fresh) merged. #80 (`company.yaml`, same file class as
#48/#39, but held by an owner comment since its last push — §10
condition 2 — so it is not mine) stays with the owner. #140 and #75
are `CONFLICTING` and blocked regardless of path or tier.

## Everything else open (16 total, via `gh pr list --state open`)

- **Owner-held**: #80 ("Top three" item 1).
- **Conflicting, waiting on the owning seat's rebase**: #140 (skill —
  "Top three" item 2), #75 (security — a live CSRF/RCE defect, handed
  off 2026-10-06, still unrebased; #124 was meant to be the response
  and is itself a dead draft, see below).
- **Frontend's live draft**: #141 (real work in progress — benchmark
  write-up and after-shots still its own unfinished tail; the contrast
  dispatch would build on it once the permissions gap closes).
- **Dead drafts, each a stub with nothing committed since its own
  ship-first commit**: #124 (security, since 2026-10-07T06:29), #143
  (exo, since 2026-10-08T20:10 — exo's own to resolve, not this
  seat's; noted, not touched).
- **Draft, idle since 2026-09-30–10-06, not failing CI, seat already
  has a newer open PR or the gap it names is already resolved
  elsewhere**: #47, #49, #85, #87, #91, #112, #113, #114. Unchanged
  from the last two passes' read; resolving this backlog of drafts is
  ceremony-weight triage (which of eight stubs are truly superseded
  needs a per-seat check, not a path check) and is flagged for Monday
  rather than attempted piecemeal in a six-hour pass.

Full list, oldest first, is `gh pr list --state open`; not reproduced
line by line since it goes stale by the next pass.

## Board hygiene, found this pass

The board's `sprint` object still names `sprint-2026-09-21` (ends
2026-09-27), two cycles stale — `docs/sprints/sprint-2026-10-05.md` is
the real current sprint and the board was never moved to match. Of
its four items, one ("Stage one of the surfaces") was resolved and
moved to Done this pass (see above); the other three ("The working
autonomous MVP", "Wire the local store server," "Dashboard and panel
markup from the four frozen artboards") have no PR evidence found
this pass of being started (`gh pr list` has nothing matching their
titles or obvious file paths). Re-pointing the board's sprint object
and regrooming "This sprint" against what's actually in flight is
ceremony-weight work — flagging for Monday (2026-10-12) rather than
doing it in a standup pass.

## Waiting on an owner-only action

- `company.yaml` (#80) — held by your own comment on it, not by tier.
- #140 under `prompts/skill-extract.md`, once the skill seat rebases
  it off `CONFLICTING` (it is not owner-only once clean; flagged here
  only because it is currently stuck and the next thing to land on
  it is the seat's rebase, not your merge).
- The three ledger entries 20+ days past the two-week verdict mark
  (repo split, tuning packs, the merge-commits/PR-reader finding).
  Grooming them is Monday's ceremony (2026-10-12), not this pass's.
- The `docs/decisions.md` ADR numbering collision — two different
  entries both titled ADR-005 and two both titled ADR-006. Outside
  this seat's writable surface (charters/decisions are not this
  seat's lane to rewrite without an ADR of its own). Checked again
  this pass: unchanged since first flagged.
- **Milestone "Sprint 2026-10-05" wiring**: still 0 issues/PRs attached
  through GitHub's own milestone field despite three real backlog
  items, due 2026-10-11. The gap is why the dispatch criterion for
  "milestone due within three days with open items" doesn't fire
  mechanically even though the substance (item 3 unshipped) is real —
  named explicitly in this pass's dispatch reasoning instead of relied
  on silently.
- **The skill charter's Data access section** naming a Neon claims
  database Ursa does not have (docs/decisions.md, found independently
  four times since 2026-09-24). Handed to exo (board message,
  2026-10-08); exo's weekly run is Sunday 2026-10-11, not yet run.
  `prompts/skill-agent.md` is Tier C, so this seat cannot fix it
  directly.
- **The workflow-permissions gap is now diagnosed in full, not just
  handed off** (see `dispatch-queue.md`): exo-centralizer's board
  handoff this pass explains the 403 as two stacked causes, both
  confirmed against this repo, and says the fix (an `allowed_bots`
  entry in `.github/workflows/agent-security.yml` and
  `agent-frontend.yml`, plus a credential wrapper) is already routed
  to HQ's own project manager and needs the owner's credential across
  five checkouts. This seat cannot edit `.github/workflows` itself —
  HQ's surface, per pm.md §15 — and has nothing further to chase here;
  the two dispatches stay queued in `dispatch-queue.md` until HQ lands
  the fix.

## Board message check

Six-hour pass, scheduled rather than woken by a specific handoff.
Queried `$BOARD_API_URL/api/messages?to_seat=pm&to_company=Ursa` and
filtered client-side for `to_company == "Ursa" && to_seat == "pm"`
exactly, since the query parameters alone still return other
companies' broadcast traffic. Exactly two messages have ever arrived
addressed to this seat specifically, and both are already answered:
the 2026-10-09T17:45 exo-centralizer handoff (answered by #149,
carried into this PR) and the 2026-10-07T19:09 engineer note (moot,
#92 closed). Nothing new since. Posted one board note this pass (see
below) with the reason in first person, as required.
