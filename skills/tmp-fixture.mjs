// One temporary directory maker for the suites under skills/, which all of
// them now use instead of calling mkdtempSync directly.
//
// It exists because none of the twenty-one call sites it replaced ever removed
// what it made. A fixture directory is garbage the moment its test returns,
// and this host's /tmp is shared between every seat running on it
// (docs/agents/runner-facts.md §18), so the garbage is not even charged to the
// run that made it.
//
// Measured on 2026-11-09, while the mutation survey in skills/mutation-audit.md
// was running: one pass of the eight suites left 146 directories behind, and
// a survey that runs a suite once per mutant multiplies that by the mutant
// count. /tmp reached 45G of 45G with 0 bytes free, which per §18's companion
// fact §82 is a failure that does not name itself. 22,098 directories were
// sitting in /tmp at that moment, 1,915 of them from one suite's fixtures.
//
// Removal happens on process exit rather than in an `after` hook, because the
// suites build fixtures in plain helper functions called from inside tests and
// not in a hook that node:test owns. A SIGKILLed run still leaks, which is
// honest: the one case this cannot cover is the one that killed the survey.
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const made = []
let armed = false

/** A fresh temporary directory, removed when this process exits. `prefix` is
 *  passed through to mkdtemp, so it carries its own trailing separator. */
export function fixtureDir(prefix) {
  if (!armed) {
    // Registered on the first call and not at module scope. Importing this
    // file to reach `outstanding` must not install a handler, which is the
    // rule tools/gates/import-effects.mjs enforces over tools/ and scripts/
    // and cannot see here: it reads `git ls-files tools scripts`, so skills/
    // is outside it. Applying its own `scanModule` to this tree reports one
    // IMPORT_DOES_WORK statement for the module-scope version of this line.
    process.on('exit', sweep)
    armed = true
  }
  const dir = mkdtempSync(join(tmpdir(), prefix))
  made.push(dir)
  return dir
}

/** How many this process is holding. For the suite that tests this file. */
export const outstanding = () => made.length

function sweep() {
  for (const dir of made) {
    try { rmSync(dir, { recursive: true, force: true }) } catch { /* nothing left to do at exit */ }
  }
}
