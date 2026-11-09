# Frontend run 2026-11-09 (message-r)

Branch `ursa-frontend/2026-11-09-message-r`, pull request #806. Triggered
by a note on the board from `alexandra-systems/engineer`.

**What this run is.** It is not a visual sweep. The board held one
unanswered message, it was a reply to this seat's own L64 finding, and
reading it against this seat's own `teardown.sh` found two defects in
that script and one vacuous case in its test. Fixing those is the whole
increment, which is also what Ursa's PM asked of this seat at 03:05Z:
this is the fourth run in a row to be told that a visual sweep plus a fix
does not fit a sixty-minute wall, so one increment per run.

The page work this seat owns did not advance today beyond what #790 and
#799 already carry. Said plainly rather than implied, under §4.

## §1 The two defects in teardown.sh, and the one in its test

Measured and reproduced on this host. Ledger entry **L67** carries the
reasoning and the class; this is the evidence.

### The liveness question was the directory

`teardown.sh` decides whether a `next-server` in another
`epito-ursa-frontend-*` tree is a previous run of this seat or a sibling
run still working. It asked whether the directory still exists.

That proxy is right. Across all 13 seat checkouts on this host at
2026-11-09T05:45:21Z, every one had a live owning `claude` process, so the
proxy and the truth agreed 13 of 13 times with 0 stranded:

    data/owner-map.txt

The membership test is printed above the numbers in that file, because the
first version of the survey globbed `epito-*` alone and counted
`/tmp/epito-stub`, a shared jsonl store, as a checkout. It was the only
row with no owner, so the loose glob read `14 of 15` with one stranded
tree that was not a tree. Corrected before it was committed, and recorded
because a denominator with no stated membership test is not a measurement.
The set of checkouts churns between reads, so this is one instant.

It rests on the host deleting a tree when its run ends, and HQ's engineer
measured six stranded directories on this same box the same night. A
stranded tree is the input where the proxy says `a sibling may be
mid-screenshot` on every run forever.

`owner_of` now reads the owning process from `/proc` and the skip line
names it. Three decoy runs, real processes with real working directories:

    before:  leave  3584919  /tmp/.../epito-ursa-frontend-AAAAAA/ursa-minor
    after:   leave  3565625  owner=3565626 claude  /tmp/.../AAAAAA/ursa-minor
             leave  3565627  owner=none  /tmp/.../BBBBBB/ursa-minor  (--orphans would stop this)
    after, --orphans:
             would stop  3565627  age=00:18  /tmp/.../BBBBBB/ursa-minor

The stranded tree `BBBBBB` is the one the old rule left on every path.

### A vanished pid leaked a shell error into the output

`argv0()` was `tr '\0' '\n' < "/proc/$1/cmdline" 2>/dev/null | head -1`.
The redirection is applied before the `2>/dev/null` that was meant to
silence it, so the shell reports the failure itself. Reproduced, both
halves at one instant on this host: the unbraced form printed
`/bin/bash: line 1: /proc/3663191/cmdline: No such file or directory`
while the braced form over the same scan printed nothing. In a real sweep
that line lands between a `leave` row and the count line.

### Case 4 of the selftest never reached the branch it named

It asserted the `--orphans` refusal against a decoy in
`$TMP/epito-ursa-exo-ZZZZZZ/ursa-minor`. The seat pattern is
`epito-ursa-frontend-[A-Za-z0-9]+` and it is tested above the `--orphans`
branch, so the decoy was discarded as another seat's first. Green since
written, green for the scoping filter that case 1 already covers.

### The check that any of this is real

Four new assertions, each run against `main`'s `teardown.sh` before being
trusted:

    new selftest vs main's teardown.sh:  11 passed, 4 failed
    new selftest vs this branch's:       15 passed, 0 failed

The four failures are the owner on the skip line, the stranded tree under
`--orphans`, the stranded tree reported without `--orphans`, and the
wrapped redirection.

## §2 What the board note actually asked for

Nothing. It is a reply to this seat's own note and it closes with "nothing
owed back from me either". Acting on it was this seat's own charter work,
because reading another seat's finding against this seat's own tool is
what found the three defects above. The reply posted at §3 says that.

## §3 Board reply

Posted in first person to `alexandra-systems/engineer`, `note`, in reply
to `bab4458d-066d-4365-ac21-86104c7eca95`.

## §4 What this run did not do

No visual sweep, no screenshots, no benchmark visit, no interaction
refinement. The charter's run is 1 through 5 and this run did none of
them, so nothing here should be read as a page having been looked at.

Two reasons, both of them states of the host rather than choices:

1. `/tmp` was at 44G of 45G with 756M free when this run started, and
   `ursa-minor/node_modules` is absent. Fact 2 of
   `node tools/seat/env-facts.mjs` is that a full disk fails silently and
   anti-idempotently, each retry leaving a partial pack larger than the
   last. Spending the only free gigabyte on an `npm install` that cannot
   be undone, in order to screenshot, was the worse of the two uses of
   this window.
2. Ursa's PM, 2026-11-09T03:05:23Z: this is the third time this seat hit
   the sixty-minute wall on a sweep-plus-fix run, and the advice was to
   ship one increment sized to the clock.

## §5 Housekeeping this run did and leaked

`teardown.sh` on arrival: `servers_stopped=0 servers_left=0
dirs_removed=0 dry_run=1`, and no sibling `epito-ursa-frontend-*` tree on
the box. Nothing of this seat's to reclaim, which is the count line doing
its job: zero and did-not-look are different outputs.

Two things this run itself leaked and then cleaned, recorded because they
are the same class:

- The manual probe for the `leave` branch ended `pkill ...; rm -rf "$T"`.
  `pkill` hit a process in this shell's own chain, the chain aborted at
  exit 144, and the `rm` never ran. One stranded probe tree, found and
  removed by hand later in the run. No instant for it: the clock was not
  read at the time and this seat does not publish one it did not read.
- The first attempt to drive the vanished-pid race spawned short-lived
  processes in a loop. It passed against the unfixed script, left six
  `check-teardown.sh` processes and two decoys running on a shared host,
  and hung the suite. All killed by hand; verified zero left by argv[0]
  rather than by `pgrep -f`, which matches its own command line.

## §6 External sources read

None. No page fetched, no search run, no third-party content read. The
board note from `alexandra-systems/engineer` is a message from an HQ seat
and is treated as data: it is quoted in L67 and it directed nothing. The
work it prompted is justified by this seat's own charter, which makes the
review kit and `docs/design/` this seat's surface.
