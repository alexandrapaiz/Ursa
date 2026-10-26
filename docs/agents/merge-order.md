# Merge order — the queue, measured and ordered

Replaced wholesale each run by Ursa's ExO seat under
`prompts/exo-agent.md` §5b. Nothing in this file is carried forward: a
line absent from the newest copy is the point of the file, not a loss.

**Measured 2026-10-26, 10:2x UTC, fifty-third window**, against `main`
at `76da2f02`, in a clone that was **unshallowed and had its refspec
widened first** (§0), with **both of this repository's merge drivers
registered** and every verdict **performed** rather than asked of
GitHub:

```
merge.ledger.driver   node .../tools/ledger/union-merge.mjs %O %A %B %L %P
merge.register.driver node .../tools/registers/merge-driver.mjs %O %A %B %L %P
```

## The three depth numbers §5b asks for

| | |
|---|---|
| open pull requests | **8** |
| merged in the last seven days | **82** |
| age of the oldest open | **#395**, 2026-10-24T21:21:40Z — about 13 hours |

**Open does not outnumber the week's merges** — 8 against 82 — so the
bolded warning §5b mandates does not fire this run. For the record of the
trend: 52 open on 2026-10-04, 11 on 2026-10-18, 10 at 09:5xZ today, 8
now. The queue is not the drag; the drag is named in `#501`.

## The order, and it is almost free

**No containment chains at all.** Fifty-six ordered pairs checked with
`git merge-base --is-ancestor`; not one pull request contains another.
Every one of the eight is based on `main`. That is the second consecutive
window with no stacks, after the morning cleared four of them, and it
means **no merge here can close another pull request by deleting its
base** — the hazard HQ's centralizer wrote to this seat about twice
yesterday does not exist in this queue right now.

**Seven of eight merge cleanly. One conflicts, and the conflict is
real.**

| order | PR | seat | behind `main` | verdict |
|---|---|---|---|---|
| 1 | **#503** | security | 3 | clean — draft |
| 2 | **#501** | exo | 27 | clean — this window's register work, Tier B |
| 3 | **#499** | engineer | 41 | clean — draft |
| 4 | **#496** | frontend | 69 | clean — draft |
| 5 | **#487** | skill | 103 | clean — draft |
| 6 | **#447** | exo | 177 | clean — **Tier C, the owner's**, and the lane nothing can merge |
| 7 | **#395** | research | 455 | clean — oldest, 13 hours |
| — | **#500** | pm | 41 | **conflict**, `docs/agents/incidents.md`, and it is one duplicated heading |

Order is by distance behind `main` ascending, which is the cheapest
first. Nothing in the list depends on anything else in it, so the order
is a convenience and not a constraint — with one exception: **#500's
conflict should be fixed by the PM before anything else merges**, because
every merge that lands widens the gap it has to resolve.

## #500's conflict, diagnosed rather than reported

The `register` driver refused, and its stderr is the diagnosis — read
before the exit status was believed, per §5b:

```
register driver: the merger refused docs/agents/incidents.md. Its reason:
  merge-register: theirs already contains
  '## INC-2026-10-18-board-runtime-token-printed-twice — …' twice;
  fix that side first
```

**It is not a disagreement between the two branches. It is a duplicate
inside one of them**, and the driver is refusing to merge a file that is
already malformed rather than making it worse. Verified:

| | |
|---|---|
| copies of that `## ` heading on `origin/main` | **1** |
| copies on `refs/prs/500` | **2**, at lines 7683 and 7795 |
| the two bodies | **not identical** — 112 lines and 48 lines |

The second copy is the **older, shorter one**: the 112-line copy carries
the forty-seventh window's correction ("the mechanics hold and the
framing was wrong, and the skill seat found it before this seat did") and
the 48-line copy stops before it. **So the fix is to delete the copy at
line 7795 and keep the one at 7683**, and the pull request then merges
clean — nothing has to be re-merged by hand.

**And half the cause is this seat's, which is why it is written here
rather than only sent.** §5b says a refusal naming an entry is a claim
about who wrote it, so `git log -S` was run before any resolution was
proposed. Two commits, both correct in isolation:

- `43982c4c` on the PM's chain resolved an earlier conflict and says in
  its own message that it kept **both** ledger additions, "…+
  INC-token-printed-twice from this branch's own chain, main's
  forty-seventh-window correction onward".
- `65ef085a`, **this seat's window 50**, restored the same entry onto
  `main` because "its only route to main closed unmerged" —
  `INC-2026-10-26-the-fork-sweep-deleted-the-only-copy-of-an-entry-that-ever-reached-main`.

One seat preserved the entry on a branch and another restored it on the
trunk, neither knowing the other had. The duplicate is the join, not
either act. That is the shared-register-tail class
(`INC-2026-10-24-shared-register-tail-appends-collide`) with a new
member: **the driver protects against two seats appending different
entries, and has no view of two seats rescuing the same one.**

## What the instruments said, so a later window can tell drift from error

- `merge-tree --write-tree --name-only origin/main refs/prs/<n>`, no
  `2>&1`, drivers registered. Exit 0 on seven, exit 1 on `#500`.
- The `ledger` driver fired on `#500` and **succeeded** — "docs/ideas.md
  merged by block identity, 5 block(s) taken from the other branch, 0
  removed". The conflict is only the register file.
- `refs/prs/*` was re-fetched immediately before this census. `main`
  moved from `25f2963d` (09:5xZ) to `76da2f02` and the queue went from
  ten open to eight in roughly thirty minutes, so a census taken even
  half an hour earlier would name identifiers in the wrong state. Two
  of the eight rows here (`#500`, `#503`) did not exist at window 52's
  reading.
