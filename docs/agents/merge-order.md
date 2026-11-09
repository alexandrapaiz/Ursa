# Merge order — measured 2026-11-09 03:01Z, ninety-ninth exo window

Replaces the previous plan. Written by Ursa's exo seat under
`prompts/exo-agent.md` §5b. **Measuring the queue and naming the order
is information for the owner. Merging is hers alone, and nothing here
loosens that.**

Both merge drivers were registered in this clone before any verdict
below was taken, and the path was asserted against this checkout rather
than the exit status read:

```
git config --get-regexp 'merge\.(ledger|register)\.'          # 6 lines
git config --get-regexp 'merge\.(ledger|register)\.driver' | grep -q "$PWD"
```

`refs/prs/*` was re-fetched **after** this window opened its own pull
request, because §0 runs before ship-first and cannot contain the
identifier ship-first creates.

## The queue

| | |
|---|---|
| open pull requests | **10** |
| merged in the last 7 days | **76** |
| oldest open | `#711`, 2026-11-02T06:55Z |
| newest merge | **2026-11-09T03:00:01Z** (`#768`, this seat's) |
| merges per day, last 7 rows present | 10-25 14, 10-26 45, 10-27 22, 11-01 4, 11-02 74, 11-08 5, 11-09 22 |

**Neither depth predicate fires.** Open does not outnumber the week's
merges (10 against 76), and the newest merge is one minute old rather
than a day. The gate is working.

**Five of the last seven calendar days have no row at all**, which the
per-day column shows and a weekly sum would hide. That is the provider
outage of 2026-11-03 to 11-07, routed to the owner this window with the
instant attached. It is not a queue problem and nothing in this file can
act on it.

## The conflict sweep

Exit codes read as codes and never as a sign, and the containment
discriminator run **before** `merge-tree`, because an absorbed branch
reads clean on every conflict instrument there is.

| row | verdict |
|---|---|
| `#711` | CLEAN |
| `#765` | CLEAN |
| `#766` | CLEAN |
| `#767` | CLEAN |
| `#770` | CLEAN |
| `#771` | CLEAN |
| `#772` | CLEAN |
| `#773` | CLEAN |
| `#774` | CLEAN |
| `#775` | CLEAN |

**Ten of ten clean, zero already-contained, zero unresolvable.** No row
in this queue needs its owning seat before it can be read.

## The order, and the reason for it

1. **`#775`** — this seat's. It carries eleven charters and the seven
   `tools/seat` instruments those charters cite. It is first not because
   it is this seat's but because **every other seat's next window reads
   one of those eleven files**, and ten of the eleven currently instruct
   a seat to hand-roll a query against a tool that lands here. The cost
   of its waiting is paid by every window of every seat, once per window.
2. **`#771`, `#774`, `#765`** — the three drafts. Not mergeable at all
   while they are drafts, so they occupy a queue slot and answer no
   decision. Their own seats resolve them; nothing here can.
3. **`#766`, `#767`, `#772`** — the PM's three. Its own lane, its own
   merge authority under §21 for the Tier B rows among them.
4. **`#770`, `#773`** — engineer and market, both clean, neither blocking
   anything else in this sweep.
5. **`#711`** — oldest at seven days, and the only row in this queue
   whose age is worth a sentence. The skill seat's. Age alone is not the
   measure this file uses, and it is last here because it blocks nothing
   and conflicts with nothing, not because it is unimportant.

## What this window changed about the order itself

`#730` left the queue. It was this seat's charter lane, open since
2026-11-02, and it was the only row in the last three sweeps carrying
conflicts. It is closed, and its unlanded content is `#775`.

**The reason it sat is the entry this file should carry forward.** Its
four register conflicts held **zero** lines absent from `main`. Every
one was the `register` driver refusing a heading present on *both*
sides, which is a redundant fork rather than a disagreement. A conflict
count does not measure unlanded content, and on an append-only register
it is close to independent of it. Before any later window resolves a
register conflict in this queue, run the set difference against `main`
and read the number.
