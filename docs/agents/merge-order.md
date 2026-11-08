# Merge order — measured 2026-11-02 08:58Z, eighty-eighth exo window

Replaces the previous plan. Written by Ursa's exo seat under
`prompts/exo-agent.md` §5b. **Measuring the queue and naming the order
is information for the owner. Merging is hers alone, and nothing here
loosens that.**

## The three numbers

| | |
|---|---|
| Open pull requests | **10** |
| Merged in the last seven days | **119** |
| Age of the oldest open row | **2h 55m** (`#699`, opened 06:03:29Z) |
| Drafts among the open rows | 3, all with live runs behind them |

**Merges outnumber open rows by twelve to one, and the oldest row in the
queue is under three hours old.** This is the first window in this
register's history able to write that sentence. The depth rule in §5b
fires when open rows outnumber the last seven days' merges, and it does
not fire. The queue is not the constraint today.

For the record of what the constraint was: this seat reported depth at
seventeen on 2026-09-27, thirty-seven and then fifty-two through
2026-10-04, and sixty-five on 2026-10-05. It is ten.

## Conflicts with `main`, by performing the merge

Instrument for every row below: `git merge-tree --write-tree
--name-only origin/main refs/prs/<n>`, run at 08:58Z on an unshallowed
clone whose refspec was widened per §0. GitHub's `mergeable` field was
not consulted and is not a usable instrument here (Ursa incident 17).

| row | verdict | files | instrument |
|---|---|---|---|
| #728 | clean | — | `merge-tree` 08:58Z |
| #727 | **conflict** | `tools/seat/charter-lag.mjs`, `charter-lag.test.mjs` | `merge-tree` 08:58Z |
| #725 | clean | — | `merge-tree` 08:58Z |
| #724 | clean | — | `merge-tree` 08:58Z |
| #716 | **conflict** | `docs/ideas.md`, `tools/board/read-filters.test.mjs`, `tools/doc-model/check.test.mjs`, `tools/seat/charter-lag.mjs`, `charter-lag.test.mjs` | `merge-tree` 08:58Z |
| #714 | clean | — | `merge-tree` 08:58Z |
| #711 | **conflict** | `docs/ideas.md` | `merge-tree` 08:58Z |
| #701 | **conflict** | `docs/sprints/dispatch-queue.md`, `pending.md`, `tools/root-entries.test.mjs` | `merge-tree` 08:58Z |
| #700 | **conflict** | `docs/ideas.md` | `merge-tree` 08:58Z |
| #699 | **conflict** | `docs/agents/improvements.md`, `incidents.md`, `learning-log.md`, `prompts/exo-agent.md` | `merge-tree` 08:58Z |

**Two of those conflicts were created by a merge of this seat's own work
and the seats holding them did not cause them.** `#721` merged at 08:06Z
carrying this seat's `tools/seat/charter-lag.*`, which is why `#727` and
`#716` now collide on those two files. Both branches were clean against
the trunk they were cut from. This is said here rather than left for
them to find, under the rule that a conflict verdict with no instrument
beside it cannot be re-measured by the seat holding the branch.

**And `#699` is this seat's and is closed by this window**, not rebased,
because it is contained in `#714` which is clean. One of the four
conflicts above disappears by closing a row rather than by resolving
anything.

## Containment: the queue is shorter than its count

Instrument: `git merge-base --is-ancestor refs/prs/<contained>
refs/prs/<tip>`, exit 0 meaning contained. Stated in the direction §"Read
your own seat's open PRs first" requires, which cannot invert.

- **`#699` is contained in `#714`.** This seat's. Closed by this window,
  with the check pasted into the closing comment.
- **`#700` is contained in `#711`.** The skill seat's, both open. One
  owner decision covers the pair and `#711` is the one to merge.
- **`#716` is contained in `#727`.** The engineer seat's, both open. One
  owner decision covers the pair and `#727` is the one to merge. Note
  that `#716` is the row the engineer named to this seat as carrying its
  `doc-model` fix, so the fix travels in `#727`.

So ten open rows are seven decisions, and three of the ten close on the
merge of a row that already contains them.

## Landing order

Simulated in a detached scratch worktree against `origin/main`, never
against `main`, per §5b's two traps.

1. **#714** (this seat, clean, Tier C by path). Carries the consolidated
   exo row and closes `#699`.
2. **#728, #725, #724** (clean, independent).
3. **#727** (engineer), which subsumes `#716`. Its only conflict is the
   `charter-lag` pair this seat's merge created, and resolving it is
   taking `main`'s copy of both files.
4. **#711** (skill), which subsumes `#700`. `docs/ideas.md` only.
5. **#701** (pm), which needs the sprint files resolved.

`docs/ideas.md` is the single busiest collision surface in the queue,
named in three of the six conflicts. That is a standing finding and not
a defect in any of the three seats.
