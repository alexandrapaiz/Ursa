import { defineConfig } from 'vitest/config'

// WHY THIS FILE EXISTS. Until now ursa-major had no vitest config at all, so
// every test ran under vitest's 5,000 millisecond default. Several of this
// suite's tests build real git repositories, spawn `npx tsx` against the real
// CLI, derive real PBKDF2 keys and construct real DOM trees in jsdom, and the
// slowest of them sit close enough to that default that a loaded machine
// crosses it. The suite then reports red for a reason that has nothing to do
// with the code, and the cheap conclusion a seat draws is that red is normal
// here. That conclusion is the actual damage: every test number any seat
// reports in a pull request is read against this suite.
//
// THE MEASUREMENT, 2026-10-24, six consecutive full runs of `vitest run` on
// one sandbox with no source changes between them.
//
//   Three runs at the 5,000 ms default:  0 failures, then 1, then 2.
//   Three runs at --testTimeout=60000:   0 failures, 0, 0. 848 passed each.
//
// Every failure in the first three was `Test timed out in 5000ms` and not one
// was a failed assertion. The two tests that failed are the same two that are
// slowest when allowed to finish, which is what ties the cause to the effect
// rather than leaving it asserted:
//
//   src/corroborate.test.ts > keeps the label and names the cap when more
//     rivals exist than it will read            5,643 ms   (slowest observed)
//   src/corroborate.test.ts > tells the user which branch it was and when
//     that branch was written                   3,687 ms
//   src/pairing-window.test.ts > counts a generation against one bound only
//                                               4,565 ms
//   src/bridge/runchannel.test.ts > runs the real CLI against a real
//     repository and returns its summary        3,438 ms
//
// Per-run slowest test: 3,687 ms, 2,824 ms, 5,643 ms. So the slowest
// legitimate test observed is 113% of the limit it was being given. The
// default was not merely tight, it was below the measured maximum.
//
// WHY 20,000 AND NOT SOMETHING ELSE. Four times the slowest observed run is
// 22,572 ms; 20,000 is that rounded to a number a reader can hold, and is
// 3.5x the slowest observed. The property being bought is that a test which
// trips this limit has stopped making progress rather than merely run on a
// busy machine, and 3.5x headroom buys it. The whole suite takes 51 to 67
// seconds wall clock, so a genuinely hung test still surfaces in 20 seconds
// instead of hanging the run.
//
// WHY GLOBAL AND NOT PER TEST. The slow thing is not one test, it is
// `execFileSync('git', ...)`, `npx tsx` and `pbkdf2` wherever they appear.
// Four files already carry a comment explaining that the 5,000 ms default bit
// them (src/serve.test.ts:372, src/bridge/bridge.test.ts:23,
// src/bridge/runchannel.test.ts:20 and :48) and src/mcp/deps.test.ts:55
// already passes its own `timeout: 60_000` to a child process. The workaround
// has been applied five times locally rather than once here.
//
// WHEN TO RESIZE THIS. When a test legitimately exceeds about 5 seconds, or
// when this number starts hiding a hang. Repeat the procedure above rather
// than adjusting by feel: three runs at `--testTimeout=60000`, take the
// slowest single test across all three, multiply by four.
//
// NOT CHANGED, DELIBERATELY. `hookTimeout` keeps its 10,000 ms default. No
// hook timed out in any of the six runs, so raising it would be a guess, and
// this file is meant to hold measurements rather than guesses.
export default defineConfig({
  test: {
    testTimeout: 20_000,
  },
})
