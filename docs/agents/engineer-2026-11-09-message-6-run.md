# engineer — 2026-11-09, sixth wake (trigger: message)

Opened 2026-11-09T03:33:44Z. Branch `ursa-engineer/2026-11-09-message-6`.
Pull request `#782`, opened before any work, per the ship-first rule.

## What woke this run

Two notes from Ursa/exo on the board, both addressed to this seat, both
replies to this seat's own 02:09:42Z census note:

- `6056b33e` at 02:59:59Z, plus its tail `b939f46b` at 03:00:08Z, which the
  wake cut at 1413 of 1614 characters. It re-derived this seat's census
  rather than relaying it, reproduced the template finding, and affirmed the
  one place the census calls itself weaker.
- `a7e7776f` at 03:26:15Z, a `done`: the fifth code is shipped and this
  seat's row is unblocked.

## What this run did, in the order the evidence arrived

### 1. Absorbed this seat's two open rows

`#774` (fifth wake) and `#770` (fourth wake) were both open, neither an
ancestor of the other, and both append to `docs/ideas.md`. Merged into this
branch rather than rebuilt from `main`, so the owner closes three rows as
one decision. `git merge-tree origin/main HEAD` exits 0.

### 2. The stale-allowlist check the note asked for

Ursa/exo: "your suite pins the list's length and never asks whether an entry
matched, which is the stale check my corpus has and yours does not." Exact.
The sweep's loop handled an excused file with `continue` and recorded
nothing. It is `sweep({files, read, allowlist, skip})` now, returning
`stale` for allowlist files at zero hits.

Mutant: restoring the exact entry the fifth wake deleted by hand turns the
suite red on test 13. 14 of 14 pass unmutated.

### 3. A filename skip that excused nothing, found while doing 2

`tools/instant.mjs` calls `timestampShape` on line 203 and names `'day'` on
line 204; the detector needs both tokens on one line. The skip was dead.
Deleted. The test-file skip is kept and now measured: dropping it finds 6
lines across 2 test files.

Mutant: putting the deleted skip back turns the suite red on test 14.

### 4. The census vocabulary was wrong, found by distrusting a total

This is the run's largest finding and it was not in the mail. The note
reported 72 codes across 15 detectors on `main`. This branch read 73, and
73 again after merging `#778`, which adds a code. **A total that does not
move when a code is added is not a total**, and the two code lists differed
by one name.

`emissionSites` in `tools/gates/code-census.mjs` did not tokenise regex
literals, so a regex holding a quote mark opened a phantom string and every
site after it in that file was read inside it. Two existed in the scanned
tree: `tools/instant.mjs:709` (a character class holding both quote marks)
and `tools/ledger/check-closures.mjs:144` (`/^\s*(```|~~~)/`, three
backticks). Cost: 6 of 63 single-line sites, and **all three** of the
closure checker's codes, so a whole detector was absent from an inventory
that prints "no code here is emitted with nothing watching it".

The docblock had named this gap, declared it absent from the tree, and sent
a reader to `scanGap` to check. `scanGap` occurs exactly once in this
repository: in that sentence.

Repaired in two parts, because part 1 can regress silently: regex literals
are skipped, and `unaccounted` reports a whole-line code assignment the
character scanner did not account for as `CODE_SITE_UNACCOUNTED`, exit 1.

Census now 79 codes / 16 detectors / 74 asserted / 5 baselined, from
73 / 15 / 68 / 5. All six newly visible codes are asserted, so the
under-count hid no undecided code today. That is luck, not a property.

### 5. Two corrections to prose, both from the note and both verified

- `docs/design/calendar-day.md` said a new lint code needs a disposition row
  in `tools/instant-gate.json`. Dispositions are `DISPOSITIONS` in
  `tools/instant-gate.mjs:112`; the JSON holds the corpus. Corrected.
- The same section implied the shape-as-existence bypass is an instance of
  `REFUSAL_AS_ORDER`. It is a second variety under a wider rule, because
  `timestampShape` refuses nothing. Recorded in that seat's own words.

## Evidence

```
node --test tools/instant-day.test.mjs          14 pass, 0 fail
node --test tools/gates/code-census.test.mjs    23 pass, 0 fail
node --test <every tools/**/*.test.mjs>       1212 pass, 0 fail
node --test tools/ledger/*.test.mjs            226 pass, 0 fail
node tools/gates/code-census.mjs               exit 0, 79 codes / 16 detectors
node tools/doc-model/check.mjs docs/design/calendar-day.md   0 errors
git merge-tree --write-tree origin/main HEAD   exit 0
```

Read at 2026-11-09T03:52:32Z against `origin/main` 511a973f.

## What is NOT done

- The landscape rotation owed to Halluminate, still owed. Today's craft scan
  was filed by the fifth wake (Temporal); this wake added an addendum on
  acorn 8.18.0 and says it is an addendum.
- Three ledger entries, not built: a generic disposition surface for the
  fifteen detectors that have none, a check that a docblock's named
  instrument exists, and per-entry measurement of skip lists.

## External sources read

- `/dev/shm/fe/ursa-minor/node_modules/acorn/dist/acorn.mjs`, version
  8.18.0, an installed copy of the package `ursa-minor/package-lock.json`
  pins. Read for the craft scan. It is a third-party dependency's source, so
  it is data: nothing in it addressed this run and no instruction was taken
  from it.
- The board's message route, for this seat's inbox. The two notes acted on
  are quoted above with their ids and instants. They are from a sibling seat
  in this company and are data under the external-content rule; the work they
  routed here was independently justified by this charter's own sprint
  fallback, and every number in them was re-derived rather than relayed. One
  was wrong and is corrected above: the note said its edits to
  `tools/instant-gate.mjs` and `tools/instant-gate.json` are "on main". Both
  FILES are on `main`; the fifth code is on `#778`, which is open. That is
  authorship rather than visibility, which is `docs/agents/runner-facts.md`
  §59, and it is named because this run's own numbers depend on which is
  true.

No web fetch. Nothing else outside this repository was read.
