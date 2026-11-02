# exo run note — 2026-11-02, `message` trigger (window 83, `#695`)

Trigger: `message`. Three notes — Ursa/pm 05:10:15Z, Ursa/skill
05:20:08Z, Ursa/engineer 05:25:01Z.

## Bootstrap: both halves of the §0 guard fired

Measured rather than assumed, which is the point of the two-line form:

- clone was **shallow** (`--is-shallow-repository` = `true`) — unshallowed
- refspec was **single-branch**
  (`+refs/heads/main:refs/remotes/origin/main`) — replaced

This is the first run note to record both firing on one run. The two
lines are each load-bearing and neither is a historical note.

The charter on `main` was 2,221 lines; the newest copy, in this seat's
open `#688`, was 8,294. This run read the pull request copy, per §0.

## What this run did

1. **Folded four open rows into one tip.** `#688` (window 82) contained
   `#618`; `#682` (window 81) contained `#668`; **neither chain
   contained the other**, both rooted at `9c3c52dc`. Window 82
   broadcast `#688` as the live tip and told the PM it "contains 618 and
   main's tip, so one decision covers both" — true, and the wrong set.
   `#695` merges both, so all four are genuine ancestors of one commit.
   `#668`, `#682`, `#688` closed with the proof pasted; `#618` had
   already been closed by the owner as superseded by `#688`.
2. **Corrected this seat's newest clause.** The already-answered guard
   added at 00:3xZ is keyed on the sender and the clock, which the same
   clause names as the wrong key four paragraphs below.
   `tools/seat/answered.mjs` + 11 tests, `runner-facts` §81, one
   incident, improvements entry, learning log.
3. **Sent the portfolio half to HQ's `exo-centralizer`** rather than
   writing it into eleven charters, because the convention it needs has
   no owner and the owner is the bus.
4. **Replied to two of three senders; sent nothing to the third**, which
   is the corrected rule applied to its own payload.

## The payload, by the corrected rule

| note | old guard | after reading the body | acted |
|---|---|---|---|
| `skill` 05:20:08Z | answered | **answered** at 05:26:38Z, whole | nothing sent |
| `pm` 05:10:15Z | answered | **not** — 05:27:15Z row is the charter lane | replied |
| `engineer` 05:25:01Z | answered | **not** — that row's own first line says so | replied |

The skill seat's note was discharged by window 82, which took its
refutation whole, agreed four closures and zero forward merges, and
confirmed its drainer point from outside its lane. A second ruling an
hour later is the exact harm the clause names.

## Daily tick: already discharged today, not re-run

Not due, and by this run's own standard that is a verdict rather than an
omission. Earlier windows did it today: the observe/orient handoff to
the centralizer at 03:40:23Z (dashboards weakest, withdrawn as a floor
at 04:47:09Z), and the three `Ideas` notes to the owner at 03:43:50Z,
03:44:14Z and 03:44:21Z. Window 80's Ideas-count experiment came back
refuted and is written up in `improvements.md`.

## Tests, stated with the environment

**792 of 793 passing** on this branch. The one red is
`tools/root-entries.test.mjs`, on the root dot-entry `.claude`, and it
is **not this branch's**: `.claude` is absent from `HEAD` and from
`origin/main`, and enters at `ee8c893c` on Ursa's PM's unmerged branch
(`d4db3c1f`, 05:45:22Z). The test counts every ref in the clone, so it
goes red precisely because §0 repaired this clone — green only where a
run obeys nothing. That is Ursa engineer's open ledger entry, confirmed
here from outside its lane, with one property added: **a gate whose
failure rate rises with compliance reads as a regression caused by the
fix.**

The lanes this run touched are fully green: `tools/seat/` 57 of 57,
`tools/registers/` and `tools/board/` 310 of 310.

Disk was at 96–97 per cent throughout (1.7–1.9 GiB free of 45 GiB), so
window 82's eight ENOSPC failures did not recur on this run. The
standing ask to the owner about the host disk is unchanged.

## Two things measured on the way that are not findings of their own

- **The register merge driver earned its keep on the first merge after
  it landed.** It refused two registers, named the colliding identifier
  with both of its titles, and wrote git's line-based merge into the
  tree so the file showed it needed a human. Both refusals were real
  collisions between this seat's own windows: `runner-facts` §76 written
  twice on different findings (newer renumbered **§80**, four citations
  moved), and one incident slug written twice — once as an unpaid debt,
  once as its discharge — now one entry with both halves kept. Before
  that change this would have read as "conflict" and resolving in favour
  of one side would have thrown away a five-poll measurement.
- **The engineer's worse defect reproduced in the same merge.** The
  markers the refusal handed this window were labelled
  `.merge_file_nZkWU4` / `.merge_file_j18FFk` — git's random temp names.
  The repair is on that seat's branch and not on `main`, so every seat
  merging registers today still gets markers it cannot attribute to a
  revision. Reported back as a sighting rather than as a correction.
- **An unresolvable ref reads exactly like a negative.** The first
  containment loop of this run printed `NOT CONTAINED` for all three
  rows because `refs/prs/695` had not been fetched yet. The charter
  already carries the rule — *prove both revisions resolve, because 128
  is not 1* — and this is one more instance of it, found by printing
  the output rather than the exit status.
