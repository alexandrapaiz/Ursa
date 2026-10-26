# Merge order — replaced each window by Ursa's ExO seat

**Measured 2026-10-26 at 00:00:36Z by the forty-sixth window**, on an
unshallowed clone with `remote.origin.fetch` widened to all heads (§0),
with `refs/pull/*/head` **re-fetched immediately before the census**,
and with **both register merge drivers installed**, which is the only
state in which a conflict verdict here means anything
(`INC-2026-10-24-a-merge-driver-that-is-not-installed-is-a-conflict`).
`git config --get-regexp 'merge\.(ledger|register)\.'` printed six lines
before any verdict below was taken.

This is information for the owner and for the PM. Merging is theirs.

## The three numbers

| | |
|---|---|
| open pull requests | **14** |
| merged in the last seven days | **50** |
| age of the oldest open | **27 hours** (#395, 2026-10-24T21:21Z) |

**The depth warning does not fire.** Merges outnumber the open queue
more than three to one and the oldest open pull request is just over a
day old.

**Fourteen is ten decisions.** Three chains, each one decision:

```
#432 ⊂ #438 ⊂ #443     the PM's three windows, one body of work
#434 ⊂ #444            the frontend's two
#435 ⊂ #442            this seat's two
```

Each verified with `git merge-base --is-ancestor refs/prs/<contained>
refs/prs/<tip>`, exit 0, stated in the direction that cannot invert.

## Do not read GitHub's merge field this week, in either direction

**Five of the fourteen carry a GitHub verdict that disagrees with the
merge git actually performs.** Three read `CONFLICTING` and merge
clean; two read `MERGEABLE` and conflict. The account, with both
mechanisms, is
`INC-2026-10-25-githubs-merge-verdict-is-the-driverless-merge-and-the-drivers-cannot-reach-the-gate`.
The short version for anyone acting on this file:

- GitHub answers for the base in **`baseRefOid`**, which is readable in
  the same call. When it differs from `origin/main`, the verdict is
  about a base that no longer exists.
- When `baseRefOid` **equals** `origin/main` and the verdict still
  disagrees, that is permanent. GitHub has no clone with this
  repository's merge drivers registered, so its answer is the
  driverless merge and always will be.

## The queue, every row with the instrument that produced it

`real` is `git merge-tree --write-tree --name-only origin/main
refs/prs/<n>` with the drivers installed, exit 0 read as clean and exit
1 as conflict. **A non-zero exit that is neither is not a verdict**: the
first census of this window printed `CONFLICT` for three pull requests
that had been opened after its refspec was fetched, because
`merge-tree` exits non-zero for a bad revision exactly as it does for a
conflict.

| PR | seat | GitHub | `baseRefOid` | real | instrument |
|---|---|---|---|---|---|
| #395 | research | MERGEABLE | `18587707` | clean | `merge-tree` + drivers |
| #418 | exo | MERGEABLE | `13baf35a` | clean | `merge-tree` + drivers |
| #427 | security | MERGEABLE | `5902fd21` | clean | `merge-tree` + drivers |
| #432 | pm | **MERGEABLE** | `370af860` | **conflict** | `merge-tree` + drivers |
| #434 | frontend | MERGEABLE | `13baf35a` | clean | `merge-tree` + drivers |
| #435 | exo | **CONFLICTING** | `91a9c303` | **clean** | `merge-tree` + drivers |
| #437 | engineer | **CONFLICTING** | `91a9c303` | **clean** | `merge-tree` + drivers |
| #438 | pm | **MERGEABLE** | `391efd0c` | **conflict** | `merge-tree` + drivers |
| #439 | security | **CONFLICTING** | `5902fd21` | **clean** | `merge-tree` + drivers |
| #440 | market | MERGEABLE | `5902fd21` | clean | `merge-tree` + drivers |
| #441 | skill | MERGEABLE | `5902fd21` | clean | `merge-tree` + drivers |
| #442 | exo | MERGEABLE | `5902fd21` | clean | `merge-tree` + drivers |
| #443 | pm | MERGEABLE | `5902fd21` | clean | `merge-tree` + drivers |
| #444 | frontend | MERGEABLE | `5902fd21` | clean | `merge-tree` + drivers |

The two conflicting rows are both subsumed. **#443 contains #432 and
#438 and merges clean**, because the PM resolved that conflict in its
own favour, which is the resolution this seat recommended at 23:41:22Z
and the right one: `git log -S` names `d27fd81` as the PM's authoring
commit. Its forty-eight-line postmortem survives intact on #443. So
nothing in this queue needs a hand resolution.

## The landing order, simulated rather than guessed

Ten decisions, merged in ascending order into a **detached** scratch
worktree created from `origin/main`, with both drivers configured in
that worktree:

```
#395  #418  #427  #437  #439  #440  #441  #442  #443  #444
```

**All ten merged clean, in that order, in one pass.** Three of them
(#435's tip #442, plus #437 and #439) are pull requests GitHub's field
calls dirty or whose chain it calls dirty.

Ascending order is not load-bearing here, since no pair conflicts. What
is load-bearing is merging the **chain tips** and not their members:
taking #432 or #438 instead of #443 lands a conflict that #443 has
already resolved.

## What is owed to whom

- **#418** is this seat's charter half and is Tier C by content. It has
  waited on the owner since 2026-10-25 02:49Z. It merges clean as it
  stands, re-measured this window.
- **#442** is this seat's register half, Tier B by content, and it
  carries this window's registers.
- Everything else is its own seat's and is named above with its seat.
