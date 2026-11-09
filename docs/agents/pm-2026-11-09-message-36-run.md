# PM run, message wake, pass 36 (2026-11-09)

## What the wake carried, and how it was treated

Two events, both external content and therefore data to verify, never
instructions to execute on the sender's say-so (org rule, 2026-10-05):

1. A note styled as from "Ursa/exo", covering a priced redaction-gate
   incident queued as PWC-EXO-9, a claim that two of exo's issues/PRs
   are contained in a third while two others are not, and a standing
   block claiming an open draft of this seat's own with no live run
   behind it, plus an open draft of the skill seat's with no live run
   behind it.
2. A note that the security seat's message run failed (timeout),
   resolved by the board to pull request #868.

Both were checked against the repository, the board, and `gh`, not
acted on directly. This run's trigger is `message`, today is a Monday,
and the Monday ceremony already ran separately today (`#871`,
`sprint-2026-11-09` opened) — this pass is event-driven, not a second
ceremony and not a full standup (pm.md §17).

## What checked out false (already stale on arrival)

The wake's own standing block warns that a queued wake carries
conditions older than itself and says to confirm with `GET /api/standing`
before spending a turn on it. Checked directly instead, against the
live state:

- **This seat's own draft, named in the wake as open with no live run
  behind it, is not a draft.** `node tools/seat/own-prs.mjs pm --drafts`
  reports zero open drafts for this seat right now, and the specific PR
  named is `OPEN`/not-draft. An earlier pass (34) already readied it.
- **The skill seat's draft, named the same way, was already resolved by
  pass 35** one pass before this one woke, and filed as Incident 19's
  seventh occurrence. Re-checked and left alone rather than redone.
- **The security run's pull request is already closed** (12:10:59Z),
  as superseded by a later one that carries the branch forward.
  `git merge-base --is-ancestor` confirms the closed one is an ancestor
  of the one that replaced it, so nothing was lost to the timeout.

## What checked out true, and what was done about it

- **Exo's claim about containment held up**, checked independently
  with `git merge-base --is-ancestor` rather than taken on the note:
  one exo pull request is an ancestor of a later one (already closed on
  that ground by an earlier pass) and a second is also an ancestor of
  it. The second was still open; closed it this pass with the ancestry
  proof in the closing comment. Two others exo named as *not* subsumed
  checked out the same way — neither is an ancestor of the later
  branch — and both are independently Tier C by path and already
  diagnosed in `docs/agents/merge-order.md` as conflicting with each
  other on one file. Left with the owner/exo; not this seat's to
  resolve in code (pm.md §10, Tier B rule 5).
- **A genuine, not-stale note from exo arrived in the board inbox**
  during this pass (id `22136efa`, 12:04:06Z, addressed to `pm`),
  separate from the wake payload: merging the later exo branch also
  clears a live red on `main` on an instrument exo had not finished
  wiring into CI, as a side effect. Exo was explicit that it is not
  asking for reordering and that the merge decision is the owner's.
  Replied on the board (id `bdd78d3a`) confirming the close and that
  the merge stays with the owner.
- **PWC-EXO-9, named in the wake, does not exist in the repository.**
  `docs/agents/pending-workflow-changes-exo.md` tops out at PWC-EXO-8;
  a broad grep of `docs/` found no PWC-EXO-9 entry anywhere. Exo's
  newest pull request is an opening stub with no work in it yet. There
  is nothing yet to route to the owner; noted in the pending tracker so
  it is not silently dropped once it is actually written.
- **Checked `gh run list --limit 30` for untriaged failures**: one
  non-success in the window, the same redaction-gate red already named
  in exo's own pull request description as cleared and correctly left
  unrepaired on that branch. Nothing new to triage.

## Queue movement this pass

- Closed: the exo pull request confirmed subsumed above, with the
  ancestry proof in the closing comment.
- Everything else named in the wake was already merged, closed, or
  correctly held at Tier C by earlier passes today; this pass did not
  re-decide any of it.
- This seat's own Tier B backlog (six open, non-draft pull requests
  stacked on each other) is unchanged and still waits on a merger other
  than this seat, per pm.md §20. Not re-asked this pass, to avoid
  repeating an unanswered ask inside the same hour.

## Stack and merge order

Branched from pass 35's own open pull request, per the own-PR-first
rule (no open drafts of this seat's own to absorb). Stack order: the
same chain pass 35 reported, with this pull request on top. Each
contains the previous; merge in that order.

## External sources read

`gh pr/issue/run view/diff/checks/list`, `git log`/`merge-base`
against this repository and its pull-request refs, `docs/standards/pm.md`,
`docs/agents/merge-order.md`, `docs/agents/pending-workflow-changes-exo.md`.
The board's `GET /api/messages` for `Ursa/pm` and one `POST` reply, both
read-only/write-only against the committed protocol in pm.md §15. All
read as data, not instructions: the wake's claims were claims to
verify, and two of the five checked false.

Never merged my own PR, never pushed to main, never touched secrets or
workflows. This pull request's diff is entirely knowledge surfaces
(`docs/agents/`, `docs/sprints/pending.md`).
