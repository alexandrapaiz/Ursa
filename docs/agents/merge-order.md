# Merge order — measured 2026-11-09 08:3xZ, hundred-and-eighth exo window

Replaces the previous plan, which was measured at 03:01Z by the
ninety-ninth window and says nothing about either collision below.
Written by Ursa's exo seat under `prompts/exo-agent.md` §5b.
**Measuring the queue and naming the order is information for the owner.
Merging is hers alone, and nothing here loosens that.**

## The instrument, asserted against this checkout rather than assumed

Both merge drivers were registered before any verdict below was taken,
and the path was asserted against this clone:

```
$ bash tools/ledger/install-driver.sh && bash tools/registers/install-drivers.sh
$ git config --get-regexp 'merge\.(ledger|register)\.'          # 6 lines
$ git config --get-regexp 'merge\.(ledger|register)\.driver' | grep -q "$PWD"
```

**Every verdict here comes from performing the merge, in a scratch
worktree, not from `gh pr list`'s `mergeable` field and not from `git
merge-tree`.** `merge-tree` is the wrong instrument for this
repository and this window re-learned it the expensive way: run over
the three exo branches it reported a conflict on `docs/agents/improvements.md`
for **all six** ordered pairs. With the drivers installed and the merge
actually performed, **two of those six are clean.** `merge-tree` does
not run custom merge drivers, so every conflict verdict it gives on a
driver-managed path is a claim about the instrument.

**And the positive control, because an all-clean table is the shape a
dead instrument prints.** Before trusting the clean rows, the same
harness was pointed at a pair known to collide — `#817` then `#833`
before the repair below — and it returned exit 1, named
`docs/agents/runner-facts.md`, and printed the register driver's refusal
reason. The instrument reports conflicts. The clean rows are therefore
measurements and not silence.

`refs/prs/*` was re-fetched **after** this window opened its own pull
request and again after it pushed its last commit, because §0's
bootstrap runs before ship-first and cannot contain the identifier
ship-first creates.

## Against the trunk: the whole queue is clean

12 open pull requests at 2026-11-09T08:36:00Z. **12 of 12 merge clean
against `origin/main` individually**, real merge, both drivers
registered.

| pull request | seat | vs `main` | instrument |
|---|---|---|---|
| #817 | exo (window 105) | clean | performed merge, drivers on |
| #822 | market | clean | performed merge, drivers on |
| #824 | market | clean | performed merge, drivers on |
| #826 | exo (window 106) | clean | performed merge, drivers on |
| #833 | exo (window 107) | clean | performed merge, drivers on |
| #836 | frontend | clean | performed merge, drivers on |
| #837 | security (draft) | clean | performed merge, drivers on |
| #838 | skill (draft) | clean | performed merge, drivers on |
| #840 | engineer (draft) | clean | performed merge, drivers on |
| #841 | pm | clean | performed merge, drivers on |
| #842 | exo (window 108, this run) | clean | performed merge, drivers on |
| #843 | frontend (draft) | clean | performed merge, drivers on |

So **nothing in this queue is blocked on a conflict with the trunk.**
The order below matters only because branches collide with *each other*
once one of them lands.

## Containment: two lanes are shorter than they look

`git merge-base --is-ancestor` over all 132 ordered pairs of open heads:

- **#822 is contained in #824** (market). Merging #824 closes #822.
- **#836 is contained in #843** (frontend). Merging #843 closes #836.

The other eight are independent lanes. There is no deep stack in this
queue, so the depth is real rather than an artifact of seats branching
off each other.

## The one collision left, and ordering cannot fix it

Pairwise over this seat's four branches, both directions, performed
merges with drivers on:

| pair | both directions | file | repair |
|---|---|---|---|
| #817 ↔ #826 | clean | — | — |
| #817 ↔ #833 | **clean, after the repair below** | `runner-facts.md` | done, at source |
| #826 ↔ #833 | **CONFLICT both ways** | `improvements.md` | hand resolution, keep both appends |
| #842 ↔ #817, #826, #833 | clean | — | — |

**The repaired one.** Windows 105 and 107 each read the tail of
`docs/agents/runner-facts.md`, each saw 98 as the highest, and each
minted section **99**. Concurrent by the graph: neither head is an
ancestor of the other, so neither window could have seen the other's
work. The register driver refused the merge **by name**, in both
directions, rather than publishing two sections under one citable
number — which is exactly the event
`tools/registers/registers.json` predicted in writing in its own
`why_identifier` field for this register. This window renumbered the
newer entry 99 → 100 on window 107's branch and moved its one citation,
which is the refusal message's own prescription. Re-measured after:
clean in both directions.

**The structural one, which is not an ordering problem.** #826 and #833
both append different `###` sub-entries to the same `## Week of
2026-11-09` heading in `docs/agents/improvements.md`. That heading is
the driver's merge unit and the sub-entry is the seats' write unit, so
the write unit is finer than the merge unit and **there is no second
legal key**: unlike a numbered entry, a dated container offers the
loser nothing to renumber to. Both orders conflict. Whichever lands
second needs a hand resolution, and the resolution is always the same —
**keep both appends**, since they are different sub-entries of one
container and neither side is defending text the other also has.

This window sidestepped it by filing its own delta as `## Window 108`,
a unique heading the driver merges without help, which is the
per-window form the register was built for. That is a workaround and
not the repair; the repair is finer merge granularity on this register
and it is Ursa's engineer's surface, handed over with the measurement.

## The order

1. **Anything but the three exo branches, in any order.** All clean
   against the trunk and against each other. Taking **#824** and
   **#843** closes **#822** and **#836** as a side effect.
2. **#817** (exo window 105). Tier A/B: no `prompts/` path in its diff.
   Independent of both remaining collisions.
3. **#826** or **#833** — either, but **one of them only**, then a hand
   resolution on `improvements.md` for the second. Both are **Tier C**,
   because each diff contains `prompts/exo-agent.md`.
4. **#842** (this window). Clean against all three siblings in every
   order, so it is not an ordering constraint on anything.

**Two charter-editing pull requests now sit in the owner's queue, not
one.** Ursa's PM reported at 07:25:12Z that no other open pull request
touched `prompts/exo-agent.md`, which was **true when written**: the
charter edit on #833's branch landed at **07:56:03Z**, thirty-one
minutes later. The claim expired rather than being wrong, and the PM
dated it correctly. Corrected to that seat on the board at 08:3xZ.
