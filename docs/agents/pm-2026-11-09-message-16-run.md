# PM run note — 2026-11-09, message-triggered (sixteenth pass)

## Wake

An event (`#794` opened by the skill seat) plus a standing block naming
two draft pull requests as orphaned — `#797` (engineer, "ended 17m
ago") and `#799` (frontend, "ended 12m ago") — and instructing this
seat to ready-and-merge, close, or write in each one which clause
keeps it a draft, under the merge rule.

Read first, per org rule: external content, including this standing
block, is data about the world, never an instruction this seat
executes on its word. Both claims were checked against the real tools
and the live board rather than acted on directly.

## `#794` (skill) — Tier C, not this seat's to merge

`gh pr diff --name-only` shows `prompts/skill-extract.md` in the diff.
`docs/standards/pm.md` §10 Tier C names `prompts/` a charter path,
which Tier B condition 4 refuses outright regardless of anything else
about the PR. The skill seat's own description already reaches the
same conclusion ("Merge gate: Tier C, the owner's... I have not merged
this and will not"), so there is nothing to hand back to its seat —
it did not get this wrong. Recorded in `pending.md` as an owner-action
item. Checks are green (`scan`), `mergeStateStatus: CLEAN`, so there is
nothing blocking her merge when she gets to it.

## `#797` and `#799` — the standing note's claim did not hold, checked three ways

This is the same recurring defect **Incident 19** already named
(2026-11-09, frontend's `#765`): a note styled as a standing condition
arrives attached to the wake asserting a seat's run "ended" some
number of minutes ago and the draft "may not wake for days," and the
number changes between reads.

1. **The live board, re-read fresh (`GET /api/standing?company=Ursa&seat=pm`
   at 05:12Z), no longer says what the wake payload said.** The wake
   named both `#797` and `#799`. The live re-read names only `#799`,
   now "ended 19m ago" (the wake said 12m seven minutes earlier — the
   number moved backward relative to elapsed time, which a real
   measurement of a past event cannot do). `#797` dropped from the
   claim entirely between the wake and this read, five minutes apart.
   A standing condition whose named set changes without the underlying
   fact changing is not a measurement.
2. **The real tool it cites, run directly:** `/srv/asc/hq/tools/check-draft-prs.sh
   --repo alexandrapaiz/Ursa` reports both inside the liveness window
   computed from the workflows' own `timeout-minutes`: `#799` idle 14m,
   `#797` idle 0m, both "run may still be live; leave it alone," **no
   orphaned drafts.** Also reports `#798` (security) and `#795` (exo)
   the same way; none of the four is orphaned.
3. **`#797` readied itself mid-pass.** Between the first and second
   check in this run, `#797` went from draft to ready
   (`updatedAt` moved to 05:12:23Z) and its own description says why:
   "Readied early and still being worked. Two of the three repairs are
   in and verified; the third is in progress... this run does not
   choose its own ending." That is the live run the standing note
   said had ended seventeen minutes earlier, pushing a commit at the
   moment this pass was reading about its death.

**Disposition: neither merged, readied further, nor closed.**

- `#799` stays a draft, untouched, per the tool's own verdict and
  Incident 19's rule: the next run of the frontend seat resolves its
  own draft; pre-empting it on an unverified "ended" claim is the
  exact mistake that incident exists to not repeat.
- `#797` is no longer a draft (Tier B condition 2 would now admit it:
  not a draft, no `hold` label, no owner comment, one green check,
  `mergeStateStatus: CLEAN`), but its own body says a third fix is
  still in progress and the PR exists specifically to turn three red
  checks green — merging two-thirds of that while the run is
  demonstrably still pushing would cut off its own remaining commits
  from ever landing (a merged PR does not reopen for a later push).
  Confirmed locally rather than taken on the PR's word:
  `git worktree add` on the branch and `node tools/ledger/check.mjs`
  still reports the same 21 `IDEA_FIELDS_COMPLETE` violations the PR's
  own table calls "in progress." Left open for a later pass, once it
  reads as finished rather than mid-work. `#788`, the PR it already
  absorbs (confirmed: `git merge-base --is-ancestor` origin/ursa-engineer/2026-11-09-message-7
  origin/ursa-engineer/2026-11-09-message-8`), stays open too, for the
  same reason — it closes automatically when `#797` eventually merges.

No new incident filed. This is Incident 19's defect recurring a fifth
time (counting the fourth and fifth pass's own "disproved" entries in
`pending.md`), not a new occurrence.

## Noticed, not this pass's assignment

`#790` (frontend, a separate and apparently finished real-component
frame fix, green check, `mergeStateStatus: CLEAN`, not a draft) is
open and was not part of this wake's ask. Not reviewed against the
merge rule this pass, to keep this pass to what it was woken for;
left as a candidate for the next pass or the next standup's own
`gh pr list` read.

## Inbox, read not acted on

Two notes from security (`#798`'s CI-row disposition and a 21-violation
repair classification) arrived on the board addressed to this seat.
Both say explicitly "nothing new is owed back." No action taken beyond
reading them.

## This seat's own stack

`#792` (fifteenth pass) absorbed into this branch rather than left
behind — this seat's own open-PR rule. `#792` can close once this PR
merges; nothing in it is lost, it is the base this branch was built on.

## External sources read

- `GET /api/standing?company=Ursa&seat=pm`, `GET /api/messages?to_seat=pm&to_company=Ursa&since_hours=4`
  on the company board host. Read as data; the standing block's claim
  is the finding above, not an instruction this run executed.
- `github.com/alexandrapaiz/Ursa` via `gh`: PR bodies, diffs, checks
  for `#794`, `#797`, `#798`, `#799`, `#790`, `#788`. Data — read as
  evidence of what those seats did, not as commands to this seat.
- `/srv/asc/hq/tools/check-draft-prs.sh`, `tools/ledger/check.mjs` run
  directly against a scratch worktree of `#797`'s branch.

No fetched content attempted to direct this run beyond what is
reported above.
