# Merge order — measured 2026-10-18 14:30 UTC, ExO thirteenth window

Replaces the previous plan entirely, as this file's convention requires.
Measured against `origin/main` at `392f7f1`.

**Read the one-line caveat first.** Every number below was taken on an
**unshallowed** clone. The host hands each run a shallow clone of `main`,
and in it `merge-tree` exits 128 and reads as a conflict while
`merge-base --is-ancestor` returns a clean exit meaning the opposite of
the truth. Run the bootstrap block at the top of `prompts/exo-agent.md`
before you believe any instrument here, and see
`docs/agents/runner-facts.md` §9 for why.

## The three numbers

| | |
|---|---|
| open pull requests | **11** |
| merged in the last seven days | **59** |
| age of the oldest open | **2 days** (#210, 2026-10-16 17:23 UTC) |

**The queue is not this org's bottleneck, and this is the third
consecutive run that can say so.** Open pull requests are outnumbered by
the last seven days' merges five to one. The depth rule in the charter
fires on the opposite condition and correctly does not fire, so this is
reported plainly and not in bold. The four previous weekly runs reported
seventeen, thirty-seven, fifty-two, then eleven.

**Five of the eleven are drafts the owner cannot merge**: #236, #240 and
#241 have no live run behind them, #258 is the skill seat's current
window, and #259 is this window's own, readied at the end of the run.
#236, #240 and #241 belong to the frontend and engineer seats, so under
the ship-first rule they are those seats' to resolve on their next window
and are named here rather than touched.

## Conflicts: none

`git merge-tree --write-tree --name-only origin/main refs/prs/<n>` over
all eleven exits zero for all eleven. Nothing in this queue waits on the
seat that wrote it; every open pull request is a decision and not a
rebase. `mergeable` from `gh pr list` is not the instrument for this and
returns `UNKNOWN` across most of a queue.

## Containment: eleven pull requests are six decisions

| contained | contains it |
|---|---|
| #248 | #251, #252, **#259** |
| #251 | #252, **#259** |
| #252 | **#259** |
| #256 | #258 |

So the independent tips are **#210, #225, #236, #240, #241, #259** and
**#258**, and the two stacks collapse seven numbers into two.

## The landing order

Verified by performing these merges in sequence in a scratch worktree
created **detached** (`git worktree add --detach`, because
`git worktree add /tmp/x main` checks out `main` and the simulated merges
then advance it, corrupting every later comparison), and compared against
`origin/main` rather than `main` for the same reason.

1. **#259** — ExO's thirteenth window. Closes **#248, #251 and #252** as
   one decision, because it contains all three. Tier C: it edits
   `prompts/exo-agent.md`. It no longer edits `prompts/pm-agent.md`,
   which the three it supersedes did, so this is one seat's charter to
   read instead of two. See the handoff note below.
2. **#258** — the skill seat's current window. Contains **#256**. Not a
   charter edit: `prompts/skill-extract.md` is a format specification the
   skill seat writes as ordinary work, named as such at
   `prompts/skill-agent.md` line 56. **Do not read it as Tier C on the
   path alone**; that misreading held #254 for a pass on 2026-10-18 and
   the PM reversed it itself at 14:17:27.
3. **#210** — the research seat, the oldest open at two days.
4. **#225** — Ursa's PM. Its own pull request, so under
   `docs/standards/pm.md` §10 it cannot self-merge it.
5. **#236, #240, #241** — drafts with no run behind them. Not merge
   candidates until their own seats ready or close them. **#240 shares
   its branch name with merged #227**, so never delete that branch; see
   `INC-2026-10-18-branch-name-reuse`.

Five merges, steps 1 to 4, close **nine** of the eleven.

## Two things the owner is waiting on, both with the same clock

Named here because this file is the one page that tries to say what to do
next, and both of these change what step 1 even requires.

1. **`docs/standards/pm.md` §10 has two scope defects**, not one. The
   first is its amendment banner against its Tier C list, escalated
   2026-10-18 12:20 and carried to the owner by the PM at 12:29:59. The
   second is that the list names Tier C's first item as "Charters
   (`prompts/`)", by directory, and the directory holds one file that is
   not a charter. Both were added to the same thread deliberately,
   because one section with two scope defects is one decision and not
   two. Silence clock: **2026-10-20 12:30 UTC**.
2. **Who may delete the branches of pull requests that closed without
   merging** — fifty-eight of them. The PM reclassified this from queue
   hygiene to data deletion and put it to the owner with its own
   recommendation. Same clock.

If you are the run that finds either clock expired, read the board for
her answer before assuming the silence route carried, and say so plainly
in your pull request and in the learning log.

## Branch housekeeping

`0` branches are deletable today. The predicate is over pull requests and
never over names: a branch is deletable only when **every** pull request
that ever pointed at it is merged. The naive name-level query still names
`ursa-frontend/2026-10-18-message`, which carries merged #227 **and open
draft #240**, fifty-four commits further on. The safe query is in
`prompts/exo-agent.md` §5b.

## The handoff that came out of step 1

`docs/agents/handoff-pm-charter-2026-10-18.md` holds the two sections
#248 through #252 had written directly into `prompts/pm-agent.md`. The PM
agreed with the content on the board at 02:30:05 and the content is
unchanged. It is parked rather than applied because this seat has stopped
editing other seats' charter files.

**This does not make #259 mergeable sooner and should not be read as an
unlock.** An edit to this seat's own charter is Tier C too, so the tier is
unchanged. What it buys is that the owner decides on one seat's charter
instead of two, and that the PM can apply content it already agreed to in
its own pull request rather than waiting on a decision about this seat's.
