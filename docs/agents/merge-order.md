# Merge order — Ursa

Written each run by the exo seat (`prompts/exo-agent.md` §5b). Replaces
the previous plan rather than appending to it. **Measuring the queue and
naming the order is information for the owner; merging is hers alone.**

Every verdict below names the instrument that produced it, because a
conflict verdict with no instrument beside it cannot be re-measured by
the seat holding the branch.

## Measured 2026-10-24, 18:2x–18:3x UTC, thirty-sixth exo window

Clone state when these were measured, because both of this file's
instruments lie otherwise (runner-facts §9 and §10):
`--is-shallow-repository` answers `false`, `remote.origin.fetch` is the
full `+refs/heads/*` glob, and `refs/prs/*` was re-fetched immediately
before the reads.

**Both merge drivers installed in this clone before anything was
measured**, because a named driver is registered per clone and a fresh
clone has the declaration without the command, so a conflict verdict on
`docs/ideas.md`, `docs/agents/incidents.md` or `docs/decisions.md` from
an uninstalled clone is a claim about the clone:

```
$ bash tools/ledger/install-driver.sh && bash tools/registers/install-drivers.sh
$ git config --get-regexp 'merge\..*\.driver'
merge.ledger.driver   node .../tools/ledger/union-merge.mjs %O %A %B %L %P
merge.register.driver node .../tools/registers/merge-driver.mjs %O %A %B %L %P
```

| | |
|---|---|
| open pull requests | **21** |
| merged in the last seven days | **61** |
| oldest open | **#316**, 2026-10-24 06:32 UTC, about 12 hours |
| open drafts | **4**, all of them live runs (#392, #390, #387, #359) |

**The depth warning does not fire, and the trend is the right way.**
Twenty-one open against sixty-one merged in seven days — the owner is
absorbing work nearly three times as fast as the org produces it, and
both numbers moved favourably since the thirty-fifth window three
quarters of an hour ago (23 open, 54 merged). The queue is not the
constraint. The one class of file that is — anything under `prompts/` —
is held by the Tier C rule and not by depth.

## Conflicts with `main`: none

Instrument: `git merge-tree --write-tree --name-only origin/main
refs/prs/<n>`, run over every open pull request in this clone, with both
drivers installed. **21 of 21 clean.** `gh pr list --json mergeable` was
not used and is not usable here; it returns `UNKNOWN` for most of a
large queue and a stale `CONFLICTING` after `main` moves.

| pull requests | verdict | instrument |
|---|---|---|
| 316, 320, 342, 348, 359, 360, 361, 369, 373, 377, 381, 383, 384, 385, 386, 387, 388, 389, 390, 391, 392 | clean against `main` | `merge-tree --write-tree` |

No landing order is forced by conflicts this window. That is the first
time in this file's history that the table has no rows to order.

## This seat's own chain

| | |
|---|---|
| live tip | **#389** (window 36) |
| contains | **#384** by ancestry, `merge-base --is-ancestor` exit 0 |
| left open on purpose | **#384**, because the PM published a tier-C verdict naming it and reported it to the owner in the same minute |

One owner decision covers #384 and #389; **#389 is the one to merge**,
and both pull requests say so. A second identifier exists because the
dispatch opening every window of this seat requires exactly one new
pull request, which is the charter's third exception and is always true
on this host.

**New this window: the containment instrument has an exit status.**
`tools/stack/absent-text.py <old> <tip>` scores coverage — matched
characters over the length of the old line — and exits 0 when nothing in
the old branch is `rewritten`, `absent` or `at-risk` in the tip. Readings
taken this window, which is how any future close in this lane should be
justified:

| pair | reading | instrument |
|---|---|---|
| #374 → #389 | exit 0, nothing to read | `absent-text.py` (ancestor, degenerate) |
| #378 → #389 | exit 0, nothing to read | `absent-text.py` (ancestor, degenerate) |
| #382 → #389 | exit 0, nothing to read | `absent-text.py` (ancestor, degenerate) |
| #288 → #389 | charter paragraphs rewritten, all read; `merge-order.md` `replaced` and not enumerated | `absent-text.py` |
| #337 → #389 | out-of-lane files `elsewhere`, carried by 73 other refs; in-lane text held | `absent-text.py` |

**Do not read `merge-tree`'s conflict count as divergence between two
branches of this seat.** It returns the size of this seat's file set, so
six is what it returns when nothing is unmerged and six is what it
returns when everything is.

## Standing, unchanged from the previous plan

- **Anything under `prompts/` is Tier C**: the owner merges it, not the
  PM (`docs/standards/pm.md` §10, and the §21 amendment reserving a
  change to a seat's own authority). #389 edits this seat's charter, so
  it waits on her.
- **Never delete the branch of a pull request closed as superseded.**
  "Contained in the tip" is only as durable as the tip, and the tip is
  unmerged by definition. That rule earned its keep again this window:
  the only reason a 123-line draft of the PM seat's could be checked at
  all is that the branches carrying it still exist.
