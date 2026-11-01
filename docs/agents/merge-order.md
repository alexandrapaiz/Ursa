# Merge order for the owner — measured 2026-11-01, window 72, queue read 23:16:36Z

Replaced whole each window, by this charter's own instruction, which is
why `tools/registers/registers.json` declares this file `enabled: false`
and why it belongs on exactly one branch at a time.

## The five numbers, because three of them could not see what happened

| | |
|---|---|
| open pull requests | **12** (read 23:16:36Z, after this window closed two of its own) |
| merged in the last 7 days | **73** |
| **merges in the last 5 days** | **0** |
| **newest merge of any kind** | **2026-10-27T05:29:07Z — 4d 17h 38m before this read** |
| oldest open | `#395`, created 2026-10-24T21:21:40Z, **8d 2h** |

**The newest merge is more than twenty-four hours old, and the gate has
not moved in four days and seventeen hours.** That is the bold warning,
and it is a new predicate as of this window, because the old one does not
fire here: 12 open against 73 merged in seven days reads as a gate
absorbing faster than the roster produces, which is what window 71
correctly reported at 05:32:29Z on the last day anything merged. All
seventy-three of those merges landed in the first two and a half days of
the seven-day window. Merges per day:

| day | merges |
|---|---|
| 2026-10-25 | 14 |
| 2026-10-26 | 45 |
| 2026-10-27 | 22 |
| 2026-10-28 | **0** |
| 2026-10-29 | **0** |
| 2026-10-30 | **0** |
| 2026-10-31 | **0** |
| 2026-11-01 | **0** |

**This is not a merge-gate finding. It is an outage finding.** The
portfolio attempted 270 runs between 2026-10-28T00:00Z and this read and
completed none of them; 20 of 20 seats were refused by the model
provider, every refusal before its first turn. Nothing was produced for
the gate to absorb. The account, with the three independent denominators,
is `INC-2026-11-01-the-portfolio-completed-zero-runs-for-five-days-and-the-depth-rule-reported-a-healthy-gate-throughout`.

So the order below is five days old in content. Every pull request in it
was authored on 2026-10-24 or 2026-10-27 and not one has moved since,
because no seat has run.

## Instruments, named per row as this charter requires

Both of this repository's merge drivers were registered in the **parent**
clone before any measurement, and the path asserted:

```
merge.ledger.driver   node /tmp/.../tools/ledger/union-merge.mjs %O %A %B %L %P
merge.register.driver node /tmp/.../tools/registers/merge-driver.mjs %O %A %B %L %P
```

`refs/pull/*/head:refs/prs/*` was re-fetched immediately before the
census. Exit codes are branched on rather than truthiness, so a 128 is
reported as "not a verdict" and never as a conflict.

| # | seat | real merge (`merge-tree`, drivers on) | GitHub field | `baseRefOid` vs `main` | drivers-disagree | state |
|---|---|---|---|---|---|---|
| `#612` | exo | **CLEAN** | MERGEABLE/CLEAN | current | agrees | ready |
| `#609` | pm | **CLEAN** | MERGEABLE/CLEAN | behind | not applicable | ready |
| `#608` | skill | **CLEAN** | MERGEABLE/CLEAN | current | agrees | **DRAFT, 5d 17h** |
| `#607` | market | **CLEAN** | MERGEABLE/CLEAN | behind | agrees | ready |
| `#604` | frontend | **CLEAN** | MERGEABLE/CLEAN | behind | not applicable | ready |
| `#602` | security | **CLEAN** | MERGEABLE/CLEAN | behind | agrees | ready |
| `#601` | skill | **CLEAN** | MERGEABLE/CLEAN | behind | agrees | ready |
| `#600` | engineer | **CLEAN** | MERGEABLE/CLEAN | behind | agrees | ready |
| `#599` | pm | **CONFLICT** | CONFLICTING/DIRTY | behind | not applicable | ready |
| `#591` | engineer | **CLEAN** | MERGEABLE/CLEAN | behind | agrees | ready |
| `#395` | research | **CLEAN** | MERGEABLE/CLEAN | behind | not applicable | ready |
| `#611` | HQ distribution | **CLEAN** | MERGEABLE/CLEAN | current | not applicable | **DRAFT, 9h** |

**Eleven of twelve merge cleanly. One conflicts, and the two instruments
agree about it**, which is worth saying because they usually do not:
`#599` conflicts in `docs/sprints/dispatch-queue.md` and
`docs/sprints/pending.md`, on both the real merge and GitHub's field.
Those are the PM's own sprint files and the resolution is the PM's.

**No pull request is in the `drivers-disagree` state.** Seven of the
twelve touch a path `.gitattributes` gives a `merge=` attribute; each
was merged into a detached scratch worktree off `origin/main` with the
drivers registered, and all seven agree with the button.

## Containment, stated in the direction that cannot invert

```
git merge-base --is-ancestor refs/prs/601 refs/prs/608   # exit 0
git merge-base --is-ancestor refs/prs/591 refs/prs/600   # exit 0
```

- **`#601` is contained in `#608`** — the skill seat's. Merging `#608`
  closes `#601`. The catch is in the next section.
- **`#591` is contained in `#600`** — the engineer seat's. Merging
  `#600` closes `#591`.

This seat's own chain is already collapsed: `#571` is contained in
`#603`, `#603` is contained in `#612`, and both of the older ones were
closed by this window with the proof in each closing comment. Their
branches are kept, because containment in an unmerged tip is only as
durable as the tip.

## The landing order, nine merges for twelve pull requests

Simulated in a detached scratch worktree off `origin/main` with both
drivers registered, compared against `origin/main` and never against
`main`. An order that has not been simulated is a guess. **All nine
merges were performed in this order and every one exited 0**, ending at
tree `95281881`; no step needed a resolution and no step was aborted.

1. **`#600`** (engineer) — closes `#591` with it.
2. **`#602`** (security).
3. **`#604`** (frontend).
4. **`#607`** (market).
5. **`#609`** (pm).
6. **`#612`** (exo) — **Tier C, the owner's.** Carries all eleven
   charters and both `tools/seat/` instruments from window 70, plus this
   window's two repairs.
7. **`#395`** (research) — oldest in the queue at 8d 2h and clean.
8. **`#611`** (HQ distribution) — a draft; see below.
9. **`#608`** (skill) — a draft; closes `#601` with it. See below.

`#599` is not in the order. It needs its author's resolution first.

## Three dispositions that are not merges, routed to the seat that owes them

- **`#608`, Ursa's skill seat: a draft for 5 days and 17 hours that
  contains its own readied `#601`.** GitHub refuses to merge a draft at
  all, so that seat's tip is unmergeable while its older, smaller pull
  request is the only landable copy of its work. Nothing in it is wrong
  and the seat is not careless: its run was ending when the outage
  started and never got a successor. **The skill seat's own next run
  inherits it under ship-first.** Told on the board; not touched here,
  because a sibling's draft is theirs to resolve and closing it is the
  loud, wrong, recoverable error this charter names.
- **`#611`, HQ's distribution seat: a draft opened 2026-11-01T14:13Z,
  still untouched nine hours later**, while `GET /api/capacity` reports
  `lost: 0`, `lost_cohorts: []` and `lost_after_minutes: 90`. Either a
  run has been alive for nine hours or it was lost eight and a half
  hours ago, and the endpoint's own threshold says the second. Handed to
  HQ's `exo-centralizer` as a reading of the `lost` classifier, not
  asserted here: `runtime/` is HQ's lane and one observation is not a
  census.
- **`#599`, the PM's: the one real conflict**, in its own two sprint
  files. Both instruments agree, so there is nothing for this seat to
  re-measure on its behalf.

## What a reader should not conclude from this file

Nothing in the queue decayed. Five days of no runs is also five days of
no pushes, so every branch above is exactly as mergeable as it was on
2026-10-27 and the stale `baseRefOid` values are stale for the same
reason `main` is: nothing merged under them. The `CONFLICTING` field on
this seat's now-closed `#571` was the false kind for that whole span,
and Ursa's PM had already established it by hand on 2026-10-27T00:23:57Z.
