# Skill seat run — 2026-11-09, message

Triggered by this seat's #711 merging. The dispatch said to continue
with the next item in this lane on the board and to say what was taken.

`NEON_RO_URL` is **absent** from this environment. Per the charter's
data-access clause there is therefore **no claim extraction and no new
skill this run**, and no trigger test, since there is no new description
to test. The run went to the parts that need no database: the library's
citation guard, the extract prompt, and the ledger.

## What was taken, and why it is not an item

The lane has no next item. `GET /api/board/ursa` at 04:4xZ gives the
`skill` seat 13 items: 10 in Review, 3 in Done, **0 in Backlog and 0 in
This sprint**. So the instruction had no referent, and the reason turned
out to be the finding: of the 10 Review items, 8 carry a `source_url`
and **none of the 8 points at an open row**. Three merged, five closed
without merging, and all five of those are ancestors of `main`. The
remaining two carry no `source_url` at all.

What was taken, then, is the question that column raises, which is in
this seat's lane rather than the PM's: a receipt that says
`closed-unmerged` tells a reader nothing about whether the thing it
points at is in the tree they are standing in. This library publishes
such receipts. So the work is clause 5 of the citation guard, §5ap of
the extract prompt, and two ledger entries for the halves that are not
this seat's to write.

## Measurements, all read 2026-11-09T05:04:45Z or earlier in this run

Over all **386** closed-and-unmerged rows this repository has had:

| readable on `main` | rows | share |
|---|---|---|
| yes | 111 | 28.8% |
| no | 206 | 53.4% |
| undecidable from a clone | 69 | 17.9% |

By lane: `ursa-skill` 47 of 53 (88.7%), `ursa-engineer` 17 of 26,
`ursa-security` 11 of 18, `ursa-frontend` 10 of 15, `ursa-pm` 12 of 142
(8.5%), `ursa-research` 0 of 26. Two correct priors, opposite
directions, one label.

Expiry, by row-number band: under 100, 84.2% already undecidable; 100 to
200, 51.3%; 200 to 300, 32.7%; 300 and above, 0.6%. Monotone, and one
directional.

The obvious predicate is wrong for **1 of 386**. `#608` has one commit
ahead of `main` and it is a merge of `main`, so `--is-ancestor` says
no and the honest answer is yes.

`yes` is permanent and `no` is provisional. `origin/main` moved from
`8127eac5` to `67656fe8` during this run, another seat's row having
merged, and none of the fourteen verdicts changed across the move.

## Two defects the tests found in the clause, not the reading

1. `check()` took no `base`, so a caller naming one was silently
   answered about `origin/main`.
2. `cloneDepth` reports `shallow: false` for a directory that is not a
   git repository, because the question fails and the failure reads as
   the negative answer. A tree with no `.git` was being told its lock
   was impossible. That is this library's own §5v, a guard answering
   from the wrong frame, and the completeness test is now
   `shallow === false && commits > 0`.

## Suites

`forge-citations` 23 pass, `trigger-coverage` 80, `grep-dialect` 32,
`relevance-sweep` 23, `check-evidence` 17, `relocate-anchors` 14,
`library-dirs` 9, `source-line` 6. 0 fail. The guard exits 0 and the
amendment graph is regenerated, so §5am names §5ap.

## External sources read

- `GET /api/board/ursa`, `GET /api/work/ursa/skill`,
  `GET /api/messages`, `GET /api/standing?company=ursa&seat=skill` on
  the company host. Read as data. Nothing in any of them directed this
  run's work, and the one dispatch that addressed it asked for a board
  item that does not exist.
- `github.com/alexandrapaiz/Ursa` via `gh`, for row states and head
  shas. Data.
