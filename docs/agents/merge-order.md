# Merge order — measured 2026-11-08 23:56:40Z, ninety-third exo window

Replaces the previous plan. Written by Ursa's exo seat under
`prompts/exo-agent.md` §5b. **Measuring the queue and naming the order
is information for the owner. Merging is hers alone, and nothing here
loosens that.**

Both merge drivers were registered in this clone before any verdict
below was taken, and the proof is two lines:

```
merge.ledger.driver    node tools/ledger/union-merge.mjs   %O %A %B %L %P
merge.register.driver  node tools/registers/merge-driver.mjs %O %A %B %L %P
```

`refs/prs/*` was re-fetched after this window opened its own pull
request, because §0's fetch runs before ship-first and cannot contain
the identifier ship-first creates.

## The five numbers

| | |
|---|---|
| 1. Open pull requests | **11** (3 of them drafts with live runs) |
| 2. Merged in the last seven days | **79** |
| 3. Age of the oldest open row | **6d 18h** (`#700`, opened 2026-11-02T06:07:13Z) |
| 4. Newest merge | **2026-11-08T23:47:12Z** (`#743`) |
| 5. Merges per day | see below, and read it as rows |

```
2026-11-02   74
2026-11-03    0      <- dark
2026-11-04    0      <- dark
2026-11-05    0      <- dark
2026-11-06    0      <- dark
2026-11-07    0      <- dark
2026-11-08    5
```

**Neither depth predicate fires, and the per-day column is why that is
not good news.** Open (11) does not outnumber the week's merges (79),
and the newest merge is minutes old rather than a day. Both readings are
true. **74 of the 79 landed on one day and five days in between landed
nothing**, so the seven-day denominator is carrying a single productive
day — which is the exact shape the seventy-second window measured and
wrote the five-number rule to expose. Report row 5 as rows. A sum of
this week is the instrument that failed.

The cause was not the gate. Nine of the last fourteen days were dark on
a provider refusal, 77 of this company's 98 refusals in seven days
naming an **org monthly spend limit**;
`node tools/seat/outage.mjs --why --days 7` is the reading and
`INC-2026-11-08-the-second-five-day-stall-was-an-org-spend-limit-and-the-dark-cause-classifier-calls-it-the-same-thing-as-a-weekly-clock`
is the account.

## Conflict and containment, with the instrument beside every verdict

| row | seat | `merge-tree` with drivers | contained in `main`? | state |
|---|---|---|---|---|
| #700 | skill | **CLEAN** (exit 0) | no | ready |
| #701 | pm | CONFLICT: `dispatch-queue.md`, `pending.md`, `root-entries.test.mjs` | no | needs-local-merge |
| #711 | skill | **CLEAN** | no | ready |
| #724 | frontend | **CLEAN** | no | ready |
| #725 | market | **CLEAN** | no | ready |
| #730 | **exo** | CONFLICT: `improvements.md`, `incidents.md`, `runner-facts.md`, `answered.mjs` | no | needs-local-merge — **this seat's own, see below** |
| #740 | pm | **CLEAN** | no | ready |
| #741 | pm | **CLEAN** | no | ready |
| #742 | engineer | **CLEAN** | no | draft, live run |
| #744 | security | CONFLICT: `tools/instant.mjs`, `tools/seat/answered.mjs` | no | draft, live run |
| #745 | **exo** | **CLEAN** | no | this window's row |

Instrument for every row: `git merge-tree --write-tree --name-only
origin/main refs/prs/<n>`, branching on the **exit code** and not on its
truthiness, with the ref verified first — because that command exits
**1** on a conflict and **128** on a revision it cannot resolve, and
`||` cannot tell them apart. No row exited 128 and no row is contained
in `main`, so there is no absorbed row to close this pass.

**The containment check ran on every row and printed nothing**, which is
the positive-control half: an empty answer here is a reading only
because the same loop was run and the sweep above proves the refs
resolve.

## The order

1. **#745** (this window's, Tier B, registers plus `tools/seat/`) and
   **#740**, **#741** (the PM's). All clean, all Tier B, no
   interdependency.
2. **#700**, **#711** (skill), **#724** (frontend), **#725** (market).
   Clean. Four seats' rows that have waited six days through the
   outage and whose age is the only thing wrong with them.
3. **#701** (pm) and **#744** (security) owe their authoring seat one
   local merge each, not a judgement and not the owner's attention.
   `#744` has a live run behind it and may resolve itself.
4. **#742** is a draft with a live run. Nothing to do.
5. **#730** is this seat's charter lane and is the one row that needs a
   decision rather than a merge. It is **Tier C** by one path and
   carries eleven charters.

**#730 is this seat's own and it is reported as a debt rather than
recommended.** Its conflict is not a collision with another seat: it is
carrying copies of three shared registers as they stood on 2026-11-02,
and `main` has moved under all three. Under the fork sweep the right act
is to delete the foreign and superseded entries from that branch rather
than refresh them, **after** running the third command — whether each
entry's author has a route to `main` that does not pass through this
seat. That is a charter-lane window's work and this window does not hold
that lane. Its read date is **2026-11-15**.

## What this window did not measure

The drivers-disagree state (clean from the button, refused by this
repository's drivers) was **not** taken this pass. It wants a scratch
worktree per clean row whose diff touches a `merge=` path, and this
window spent its turns on the outage classification instead. Four of the
eight clean rows touch a driver-managed path, so the number is four and
not zero. Said plainly rather than omitted, because a column nobody
filled reads as a column that came back empty.
