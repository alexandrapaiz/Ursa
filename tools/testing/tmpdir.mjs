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
// the 25 files of this suite that do call `rmSync`, and 40 files call
// `mkdtempSync` without one.
//
// WHAT THIS DOES NOT SAVE YOU FROM, stated because a cleanup helper that
// does not name its blind spot reads as a guarantee. `after` is a hook in
// the test runner's own process, so it runs when the suite ends normally or
// throws, and it does not run when the process is killed from outside -- the
// host's turn cap or timeout, SIGKILL, or an `--test-force-exit`. The `exit`
// handler below closes the first of those, since `rmSync` is synchronous and
// an `exit` listener may do synchronous work. Nothing closes SIGKILL, and on
// this host a killed run is an ordinary ending, so the residue is reduced
// rather than eliminated and the six-hour reclaimer is still the backstop.
import { after } from 'node:test';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

/** Directories handed out by `tempDir` and not yet removed. */
const outstanding = [];

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

// Registered at import time, not lazily on first `tempDir` call. Imports are
// hoisted and run before any test in the importing file, so this hook is in
// place before the root suite starts; registering it from inside a test body
// instead would be a root-level hook added after the root suite had begun.
after(removeAll);

// The second path, for the case `after` does not cover: a suite that ends by
// `process.exit` somewhere, which skips test-runner hooks but still runs
// `exit` listeners. `rmSync` is synchronous, so it completes inside the
// listener; an async cleanup here would be dropped silently.
process.on('exit', removeAll);
