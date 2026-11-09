# engineer, 2026-11-09, wake `message`

Break-fix, taken ahead of the lane queue because it was live, measured, and
costing three other seats their installs.

## What the wake carried, and what was still true

Two messages and a standing condition. One of the three survived contact.

**Retired before I could act on it.** The standing line on both wakes said
`#840` was an open draft with no live run behind it. It was not: it already
read `ready`, `GET /api/standing` returned empty, and at 09:35:47Z the owner
merged it. The condition was true when the bus attached it and false when I
read it, which is the documented reason to confirm a carried condition
rather than spend a turn on it.

**Withdrawn by its sender.** Ursa/security's note retired its own ask: it is
registering nothing, because `scripts/dep-floor-classify.test.mjs` is not a
gate candidate by its rule, which keys on an exit call in a non-test file.
Nothing for me to do. Its correction to me was accepted: the gate registry it
told me I could not import is on the trunk now, and I imported nothing from
it anyway for a reason given below.

**Live.** HQ's engineer seat reported that
`tools/ledger/check-attributes.test.mjs` leaks a git clone per run into a
`/tmp` that had crossed 90 per cent. That was true, it was mine, and it was
the day.

## Measured, on this host, with the instants read rather than bucketed

| instant | clone-\* | attrs-\* | /tmp |
|---|---|---|---|
| 09:29Z, before any change | 39 dirs, 3.4G | 880 dirs, 262M | 41G/45G, 93% |
| 09:35Z | 40 | 891 | 42G/45G, 95% |
| 09:37:03Z, removing those older than 20 min | -35 | -836 | |
| 09:37:14Z, eleven seconds later | 5 | 55 | 39G/45G, 87% |

Both prefixes are unique to that one file in this repository, so every one of
those directories is attributable to it. Nothing held them open: `lsof`
reported zero handles, and nothing newer than twenty minutes was touched,
against a suite whose whole run is ten seconds.

## The fix, and the three ways it was checked

`tools/testing/tmpdir.mjs` hands out temporary directories and removes them.
The clone itself stays, because the comment above it is right that a linked
worktree would share `.git/config` with the caller and the assertion would
then pass on config the test did not write. The removal is what was missing.

1. **Per-run delta, both versions back to back.** Before: `clone=+1
   attrs=+11`, 13 tests passing. After: `clone=+0 attrs=+0`, 13 tests
   passing.
2. **A full multi-file suite run, with sentinel prefixes.** Single-file
   measurement cannot distinguish my residue from a concurrent seat's, and
   `/tmp` is shared. So the two prefixes were temporarily renamed
   `engprobe-`, the whole 102-suite tooling run executed, and the residue
   counted: `engprobe-clone=0 engprobe-attrs=0`.
3. **The gates caught the first version and both were right.**
   `import-effects` found the helper doing work at module scope, which is
   precisely the defect that gate exists for. `gate-registry` found the new
   ratchet reached by nothing, which is Ursa/security's own finding that 44
   of 61 gates we built were run by nothing. Neither was excused: the
   registrations moved inside `tempDir`, and the ratchet is now the
   `tmpdir-leak` check in `scripts/ci-checks.mjs`.

The `import-effects` repair turned out to be the better design, and the
reason is measured rather than argued. `after` called from inside a test body
registers on **that test** and runs when it ends, not at the end of the
suite. Probed with three tests, the first and third registering from their
bodies:

```
body-one | hook-from-one | body-two | body-three | hook-from-three
```

So a single root hook would have been one thing and per-call registration is
another, and per-call is correct as well as gate-clean: each directory goes as
its own test ends, so a 102-suite run holds one test's directories at a time
instead of the whole run's. Peak usage, not final usage, is what filled the
disk.

## Why one file became forty-two

The census that fell out of fixing it: 64 test files make temporary
directories, 41 of them contain no removal call of any kind.

`tools/testing/tmpdir-leak.mjs` reports them and exits 1 when a file joins
the set, or when a baseline entry has been fixed and left in the list, so the
baseline can only shrink. The 41 are written down rather than fixed here
because a gate that failed on all 41 the day it was committed would be red on
main from its first commit, and a gate that is red on main is a gate every
seat learns to step over.

Its scope is deliberately the decidable half. A file with no removal call
cannot be removing what it made, and that is sound. A file **with** one might
still leak on a path this cannot see, so the 23 files in that state are absent
from the list and are **not** thereby certified. The header and the baseline
both say so, because the leak that cost 3.4G was found by a seat reading a
disk and by no gate of ours, and an absence instrument that does not name its
blind spot gets read as a clean sweep over ground it never covered.

## The part of this that is not mine to finish

**The fix is authorship until it is merged.** My copy leaks nothing. Every
other seat's checkout is `main`, so the leak continues at main's rate until
the owner merges. Measured over 3m46s at 10:13Z to 10:17Z while this run
executed no tests at all: **+2 clones and +22 fixture directories**, from
other seats' windows. That is roughly 32 clones an hour, about 2.8G an hour,
which independently reproduces HQ's 3.05G in 66 minutes. The reclaimed 3.3G
buys time; the merge is what stops it.

**One pre-existing trunk failure, which this branch does not cause.** The
full tooling suite is 1735 of 1736 passing, and the one failure is
`tools/doc-model/check.test.mjs:110`, `UNREGISTERED_SITE
docs/ideas.md:24657`. Confirmed pre-existing by running the gate with
`origin/main`'s `docs/ideas.md`, where it fires identically, and I have never
touched `tools/doc-model/models.mjs`. The flagged section is Ursa/security's
own ledger entry of today, and the diagnosis is done: the entry mentions the
wake limit only because it reports a test that transcribes that constant, so
it states no rule and `mentions-only` is the correct registry entry rather
than a transcription. That is a one-line fix in another seat's gate registry
over another seat's content, on a day that seat is live in exactly this area,
so it goes to them by mail with the judgement already made rather than
through a race on their open row.

## External sources read

None. No page fetched, no search run, no third-party repository read. The
craft scan in the ledger is written from my own knowledge of pytest's
`tmp_path` retention policy and is labelled as such, not as a live reading.
Every measurement above is from this host or this repository.
