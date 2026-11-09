// Temporary directories that a node:test file actually removes.
//
//   import { tempDir } from '../testing/tmpdir.mjs'
//   const dir = tempDir('attrs-')      // removed after the suite, both paths
//
// WHY THIS MODULE EXISTS, with the price attached. On 2026-11-09 at 09:07Z
// HQ's engineer seat measured `/tmp` on the shared company host at 90 per
// cent full and traced 3.05G of it to one file of this repository's suite:
// `tools/ledger/check-attributes.test.mjs` called `mkdtempSync` three times
// and `rmSync` zero times, and one of those three `git clone --shared` of the
// whole repository at 88M a run. Re-measured here at 09:32Z, after another
// twenty-five minutes of seat windows: 39 `/tmp/clone-*` at 3.4G and 880
// `/tmp/attrs-*` at 262M, against 3.2G free on a 45G volume.
//
// The leak was invisible for as long as it existed, and that is the part
// worth keeping. The host's reclaimer sweeps `/tmp` on a six-hour floor, so
// nothing on that volume is ever older than six hours and no daily reading
// ever sees an accumulation. What it sees is a disk that is mysteriously
// full again, and what the other seats saw was the reclaimer buying the
// space back out of their working set: Ursa's frontend and exo seats both
// reported `ms-playwright` evicted mid-run that same morning, with no
// install of their own in between.
//
// WHY A HOOK AND NOT AN `rmSync` AT THE END OF THE TEST BODY. A test that
// throws never reaches its own last line, so cleanup written in the body is
// cleanup that runs on exactly the runs that did not need it, and skips every
// run that failed. `after` runs on both paths. That is also why this is a
// module rather than a line of advice: the advice was already implicit in
// the 22 files of this suite that do call `rmSync`, and 41 files call
// `mkdtempSync` without one.
//
// WHY THE HOOK IS REGISTERED PER CALL AND NOT ONCE AT MODULE SCOPE, measured
// here rather than assumed, because the two differ and the difference is the
// whole behaviour of this file. Calling `after` from inside a test body
// registers the hook on THAT TEST and runs it the moment that test ends, not
// at the end of the suite. Probed on node 2026-11-09 with three tests, the
// first and third registering a hook from their bodies:
//
//   body-one | hook-from-one | body-two | body-three | hook-from-three
//
// So a single hook registered during the first test would have covered the
// first test's directories and nothing after them. Registering on every call
// is therefore the correct form rather than the wasteful one, and it is also
// the better one for the defect this file exists for: each directory is gone
// as soon as its own test ends, so a 102-suite run holds one test's
// temporary directories at a time instead of the whole run's. Peak usage,
// not just final usage, is what filled the disk.
//
// `removeAll` is idempotent, so several hooks on one test are not several
// chances to fail; the second finds the list empty.
//
// WHAT THIS DOES NOT SAVE YOU FROM, stated because a cleanup helper that
// does not name its blind spot reads as a guarantee. `after` is a hook in
// the test runner's own process, so it runs when the test ends normally or
// throws, and it does not run when the process is killed from outside -- the
// host's turn cap or timeout, SIGKILL, or an `--test-force-exit`. The `exit`
// listener closes the first of those, since `rmSync` is synchronous and an
// `exit` listener may do synchronous work. Nothing closes SIGKILL, and on
// this host a killed run is an ordinary ending, so the residue is reduced
// rather than eliminated and the six-hour reclaimer is still the backstop.
//
// Both registrations happen inside `tempDir` rather than at module scope, so
// that importing this module performs no work -- which is this repository's
// `import-effects` gate, and that gate caught the first version of this file
// doing exactly what it forbids.
// WHAT RUNNER THIS IS FOR, and it is not all of them. This imports `after`
// from `node:test`, so it works in the 28 `.test.mjs` suites that runner
// executes and NOT in the `ursa-major/src/*.test.ts` suites, which are vitest
// (36 of them import from `vitest`, and `scripts/ci-checks.mjs` runs them
// behind `npx vitest run`). 30 of the 41 files in the baseline beside this
// one are in that half, so most of the remaining repair needs a vitest
// sibling of this module using that runner's own `afterEach`, not this one.
// Stated here because the first version of the ledger entry accompanying
// this file named the ursa-major group as the cheapest first step, and it is
// the one group this helper cannot repair. vitest is not installed in the
// seat sandbox that wrote this, so the sibling is proposed rather than
// shipped: writing an untested cleanup helper for the half of the suite that
// holds 30 of the 41 leaks is how the next 3.4G gets written.
import { after } from 'node:test';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

/** Directories handed out by `tempDir` and not yet removed. */
const outstanding = [];

/** One `exit` listener is enough, and eleven would warn. Set on first use
 *  rather than at module scope, so importing this module does nothing. */
let exitHookInstalled = false;

/** Make a temporary directory that this suite will remove when it ends.
 *
 *  `prefix` is a basename prefix, not a path: `tempDir('attrs-')` yields
 *  something like `/tmp/attrs-Ab3kQ9`. Keep it distinctive, because `/tmp` is
 *  shared with every other seat running on this host (runner-facts.md §18),
 *  so a generic prefix makes your residue indistinguishable from theirs and a
 *  census of it unattributable. `clone-` and `attrs-` were both traceable to
 *  one file precisely because nothing else in the repository used them.
 */
export function tempDir(prefix) {
  const dir = mkdtempSync(join(tmpdir(), prefix));
  outstanding.push(dir);
  // Per call, for the measured reason in this file's header: a hook registered
  // from a test body belongs to that test and runs when it ends.
  after(removeAll);
  if (!exitHookInstalled) {
    exitHookInstalled = true;
    process.on('exit', removeAll);
  }
  return dir;
}

/** Remove every directory `tempDir` has handed out, and report what resisted.
 *
 *  Idempotent: each directory leaves the outstanding list as it is removed, so
 *  a second call is a no-op rather than a second set of failures. Returns the
 *  paths it could not remove, with the reason, so a caller can assert on the
 *  empty array. It never throws, because a cleanup hook that throws turns a
 *  passing suite red for a reason that is not the suite's subject.
 */
export function removeAll() {
  const failed = [];
  while (outstanding.length) {
    const dir = outstanding.pop();
    try {
      rmSync(dir, { recursive: true, force: true });
    } catch (err) {
      failed.push(`${dir}: ${err.message}`);
    }
  }
  return failed;
}

/** The directories handed out and not yet removed, for a test to assert on. */
export function outstandingDirs() {
  return [...outstanding];
}
