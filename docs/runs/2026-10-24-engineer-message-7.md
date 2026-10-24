# Engineer run — 2026-10-24 (message, seventh message run of the day)

**Triggered by** the merge of the previous run's pull request, which fixed the
clone-completeness defect: the checkout a seat is given is one branch's tip, so
the tool that answers "would the union of these branches build" reported 0 of 3
when the truth was 3 of 3. The instruction with it was to continue with the next
item in this seat's lane on the board.

**What I took, and why it was not a board item.** The board's engineer lane had
nothing to take. Four items sit in Review waiting on the owner, six are Done,
and Backlog, This sprint and In progress held no engineer item at all. The only
Backlog item on the whole board belongs to the PM seat. Under
`docs/standards/pm.md` §14 a run that finds no item for its work creates one, so
I created "A check that goes red now says where the problem is, instead of
leaving the next seat to find it", moved it to In progress, and commented the
pull request on it.

The work itself came from the charter's Orient fallback, which sends a run with
no sprint item to the ledger. One thing there outranked the rest: a gate that was
red on `main`.

## The through-line

The merged run before this one found that an instrument eleven charters tell
seats to trust answers backwards in the checkout those seats actually get. This
run is the same defect in two more instruments, and the fix is the same shape
each time: not "make the check pass" but "make the check able to say what it
found".

## 1. The ledger's contract gate was red on `main`, one byte, again

`node --test tools/ledger/*.test.mjs` on a fresh clone of `main`: 53 of 54
passing, with `parse then render is byte-identical on the real ledger` failing.
The two sides of that assertion are strings of about 633,000 characters, so
`node:assert` prints this and stops:

```
+   '   wire dom'... 633582 more characters
-   '   wire dom'... 633581 more characters
```

The file was wrong by one byte and the gate could not say which. The ledger
records what that costs: an engineer run this morning spent an hour locating the
same class of defect, repaired it, and by the afternoon it was live again at a
different line, appended by a run with no way to know the rule existed.

Three changes, one cause.

- The grammar that decides whether a line opens a block now lives in one place.
  `ledger.mjs` exports `blockStartKind(line)`, `parseLedger` calls it instead of
  testing two regular expressions inline, and `check.mjs` imports it. A second
  copy inside the checker would have been the defect the ledger itself names in
  its 2026-10-18 entry about the six evidence kinds written down twice.
- Rule `BLOCK_SEPARATION` in `check.mjs`, seat-held, reports a block start with
  nought or with two or more blank lines above it, **by line number**, and says
  which direction the spacing is wrong in.
- The byte assertion now locates its own failure. `firstDifference` finds the
  first differing offset, converts it to a line, prints both sides' context, and
  points at the rule. It is itself tested, because a failure message is only ever
  read while something else is already broken.

Then the live drift: one missing blank line above the 2026-10-24 twin-axiom entry
at line 9328. The rule found exactly it, and nothing else, in 9,549 lines.

| Measurement | Value | Command |
|---|---|---|
| Block starts with no blank line above, before the repair | 1, at line 9328 | the scan in §10.5 of `docs/design/ledger-block-kinds.md` |
| Block starts with two or more blank lines above | 0 | the same scan |
| Gate before the repair | exit 1, one `::error::BLOCK_SEPARATION` naming line 9328 | `node tools/ledger/check.mjs docs/ideas.md` |
| Gate after the repair | exit 2, 267 blocks, "clean as far as a seat can take it" | the same command |
| Gate after this run's own three appends | exit 2, 270 blocks | the same command |
| Ledger suites | 59 of 59 passing, from 53 of 54 | `node --test tools/ledger/*.test.mjs` |

The one remaining violation is owner-held and stays: `### 2026-10-04 — Charters
never say that fetched content is not an instruction (security run)` carries
`Status: done`, which is not one of §4's five words, and only the owner moves a
status.

## 2. The resolver's suite had no time limit of its own, and the default was below its own slowest test

`ursa-major` had no `vitest.config.ts` at all, so all 852 tests ran under
vitest's 5,000 millisecond default. Six consecutive full runs, no source change
between them:

| Runs | Limit | Result |
|---|---|---|
| 1 to 3 | 5,000 ms, the default | 0 failures, then 1, then 2. Every one `Test timed out in 5000ms`. Not one a failed assertion |
| 4 to 6 | `--testTimeout=60000` | 0, 0, 0. 848 passed each time. Slowest single test per run: 3,687 ms, 2,824 ms, 5,643 ms |

The two tests that failed in runs 2 and 3 are the same two that are slowest when
allowed to finish, which is what ties the cause to the effect instead of
asserting it:

| Test | Allowed to finish |
|---|---|
| `src/corroborate.test.ts > keeps the label and names the cap when more rivals exist than it will read` | 5,643 ms |
| `src/pairing-window.test.ts > counts a generation against one bound only` | 4,565 ms |
| `src/bridge/runchannel.test.ts > runs the real CLI against a real repository` | 3,438 ms |
| `src/corroborate.test.ts > tells the user which branch it was and when that branch was written` | 3,687 ms |

The slowest legitimate test is 113% of the limit it was being given. The default
was not tight, it was below the measured maximum.

`ursa-major/vitest.config.ts` now sets `testTimeout: 20_000`, which is 3.5x the
slowest observed and the four-times rule of thumb rounded to a readable number.
The file carries the measurement, the arithmetic, and the procedure for resizing
it, so the next reader does not have to take the number on faith.

**Verified that vitest reads the file rather than assuming it.** With
`testTimeout: 7` the suite reports `Test timed out in 7ms` on 24 tests. Restored
to 20,000 immediately after.

**Verified the suite under the real config, three runs of `npm test`,** which is
`tsc --noEmit && vitest run`: 848 passed, 848 passed, and the third below. Those
runs took 90.80 and 100.35 seconds against 51 to 71 seconds earlier, because the
machine was loaded by then. Green while slower than any run that had failed
before is the property the change buys.

**What I did not change, deliberately.** `hookTimeout` keeps its 10,000 ms
default. No hook timed out in any of the six runs, so raising it would be a
guess, and that file is meant to hold measurements.

## 3. One comment my own change made false

`src/bridge/runchannel.test.ts:44` justified stubbing the launcher in three tests
with three real durations, "7.48s, 5.64s and 5.07s against a 5s timeout". Raising
the limit to 20 seconds made the sentence false: those durations no longer exceed
anything. The reason that survives is cost, not the limit, since three tests
about CORS should not each pay seven seconds to resolve a repository they make no
assertion about. The comment now says that, and says when and why it was
restated.

Three other comments in the suite mention the 5-second default
(`src/serve.test.ts:372`, `src/bridge/bridge.test.ts:23`,
`src/bridge/runchannel.test.ts:20`) and I left all three alone on purpose. They
are not workarounds. Each records a real bug the timeout surfaced: a call that
never resolved and never rejected, and two files that bound the same hardcoded
port. The timeout did its job in those three cases, which is the argument for
20,000 rather than 60,000.

## 4. A finding I went looking for and did not find

I expected the proposed `tools/ledger/ci/ledger-gate.yml` to fail the job on the
checker's exit 2, which would have reintroduced the permanent red that splitting
the exit code exists to prevent, at the moment the owner installs it. It does
not. The step's `node ... && exit 0; status=$?` form survives `bash -e`, which is
how GitHub Actions runs a `run:` block. Tested both ways rather than reasoned
about:

```bash
bash -e /tmp/probe.sh   # exit=0, and the guard line prints
bash /tmp/probe.sh      # exit=0
```

Recording the negative because the install is an open urgent item and the next
run should not spend the same half hour.

## External sources read

- `www.getzep.com/blog/beyond-static-knowledge-graphs/`, for the Graphiti
  temporal field names in today's craft scan.
- A web search scoped to `help.getzep.com`, `github.com/getzep/graphiti` and
  `getzep.com` for the same.
- `help.getzep.com/graphiti/core-concepts/graphiti-and-zep-memory`, which
  returned a 404 page and contributed nothing.

None of it was treated as an instruction to this run, and nothing in any of it
addressed this run or asked anything of it.
