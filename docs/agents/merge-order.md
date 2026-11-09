# Merge order — measured 2026-11-09 10:53:02Z, hundred-and-eleventh exo window

Replaces the previous plan, which was measured by the
hundred-and-eighth window and says nothing about the false-conflict
class below. Written by Ursa's exo seat under `prompts/exo-agent.md`
§5b. **Measuring the queue and naming the order is information for the
owner. Merging is hers alone, and nothing here loosens that.**

## The instrument, and the reason this file leads with it this week

Both merge drivers were registered before any verdict below was taken,
and the path was asserted against this clone:

```
$ bash tools/ledger/install-driver.sh && bash tools/registers/install-drivers.sh
$ git config --get-regexp 'merge\.(ledger|register)\.driver' | grep -q "$PWD"
```

Every verdict is from performing the merge:
`git merge-tree --write-tree --name-only origin/main refs/prs/<n>`,
branching on the **code** and not its sign — 0 clean, 1 conflict, 128
a claim about this clone — with `git merge-base --is-ancestor
refs/prs/<n> origin/main` run first, because an absorbed branch's merge
is empty and reads clean on every other instrument.

## The reading taken and thrown away, which is this week's finding

**The first sweep of this window is void and its numbers are here as
evidence rather than as a verdict.** Taken at 10:50:20Z it reported
**7 of 16** open pull requests conflicting on `docs/ideas.md`. Every
one was false. The driver path had been repointed at
`/tmp/empty-premise-8zPjjW/wt/tools/ledger/union-merge.mjs`, a `git
worktree` this window's own sweep had created and deleted, so every
merge of that path failed to load its driver and `merge-tree` fell back
to a line merge and reported a confident content conflict.

The cause is not §0's: nothing re-ran the installers from a worktree.
This window's `tools/gates/empty-premise.mjs` **spawned a candidate
that did** — `tools/ledger/requeue.sh:51` runs
`tools/registers/install-drivers.sh`, which writes an absolute path, and
a worktree shares `.git/config` with its parent. The registry already
classified that file `write-action`. The sweep did not read the
classification. Both differentials now exclude write-actions and print
the excluded count.

| | |
|---|---|
| sweep at 10:50:20Z, driver path stale | **7 of 16** conflicting on `docs/ideas.md` |
| sweep at 10:53:02Z, driver path asserted | **0 of 16** conflicting on `docs/ideas.md` |
| commits, refs and instrument | identical in both |

**So the standing rule, for whoever writes this file next: assert the
driver path immediately before the sweep, not at the start of the run.**
§0 says to re-run the installers after any scratch worktree. That is
right and it is addressed to a window that knows it made one. A window
whose *tool* makes one does not.

## The order, at 10:53:02Z over 16 open pull requests

**Clean against `main`, mergeable in any order:** #822, #824, #838,
#845, #857, #858, #862, #864, #865, #866.

**Three pull requests collide on one file, and the file is this seat's
own.** #846, #852, #859 and #863 each conflict on
`tools/gates/gate-registry.baseline.json`, which `main` reformatted and
extended since each was opened.

1. **#863 is resolved already** and is the one to take first among them.
   It merges `origin/main` at `3c929d00`, keeps `main`'s 38 entries plus
   this seat's two, and the registry runs clean at 66 candidates, 26
   registered and 40 excused in writing. It also **contains #846**, so
   #846 is absorbed when #863 lands and needs no separate resolution.
2. **#852 and #859** are Ursa/security's and another seat's. Their
   conflict is the same shape — a baseline entry added against an older
   layout — and it is theirs to resolve, not this seat's. Reported, not
   touched.

**Two pull requests need a decision rather than a resolution.**

- **#833** conflicts on `docs/agents/improvements.md` and
  `tools/board/bypass.test.mjs`. It is this seat's charter lane and
  neither it nor #863 contains the other:
  `git merge-tree --write-tree --name-only refs/prs/846 refs/prs/833`
  exits 1 on `prompts/exo-agent.md` and `tools/board/bypass.test.mjs`,
  read at 10:51:12Z. So **#833 and #863 cannot both land unresolved**,
  and whichever lands second needs its charter hunk re-merged. This
  window did not touch either side of that conflict.
- **#826** conflicts on `docs/agents/improvements.md` and
  `scripts/ci-checks.mjs`. Also this seat's, also a charter lane.

**The order this seat would take, and the reason in one line each:**

```
#822 #824 #838 #845 #857 #858 #862 #864 #865 #866    clean, any order
#863                                                 resolved against main; absorbs #846
#833  then #826                                      charter lane; each needs its hunk re-merged after #863
#852 #859                                            other seats'; their baseline hunk to resolve
```

## Queue depth, five numbers, read at 10:53:02Z

| | |
|---|---|
| open now | **16** |
| merged in the last seven days | **86** |
| oldest open | #822, 2026-11-09T06:33:08Z |
| newest merge | **2026-11-09T10:49:14Z** |
| merges per day, last seven | 10-25: 14, 10-26: 45, 10-27: 22, 11-01: 4, 11-02: 74, 11-08: 5, 11-09: 81 |

**Neither depth predicate fires.** Open does not outnumber the last
seven days' merges, 16 against 86, and the newest merge is minutes old
rather than more than twenty-four hours. The gate is live and absorbing
faster than the org produces.
