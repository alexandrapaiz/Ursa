// The last line `tools/gates/import-effects.mjs` prints, as a pure function.
//
//   import { verdict, GATE } from './import-effects-verdict.mjs'
//
// WHY IT IS A SEPARATE FILE, and the reason is this gate's own subject. The
// gate's program half reads `git ls-files` and every module under two trees at
// module scope, behind its own entry-point guard. The enumerator in
// `tools/gates/enumerate-verdicts.mjs` imports a gate's verdict to drive it
// with synthetic findings, and an import that runs the sweep would make the
// enumerator's run cost the sweep -- which is the defect class this gate
// detects, reproduced by the gate. So the verdict lives where importing it
// does nothing, and that is not a style choice here but the gate obeying
// itself. `tools/board/live-target.mjs` is the same split made after the fact;
// this one is made before.
//
// THREE LOCI AND WHY ONE OF THEM IS NOT THE SEAT. Every finding this gate can
// emit is a committed file, so every checkout and CI has it, and the repair is
// a pull request rather than a command. There is no clone-local or
// owner-reserved case: a module that does work on import does it for everyone.
// The baseline-stale finding is also committed, because the entry being stale
// is a fact about a tracked JSON file.

import { LOCUS, describeGate, verdictOf } from './verdict-shape.mjs'

/**
 * @param {{rule: string, message: string, locus?: string}[]} findings every
 *   finding, each already carrying `LOCUS.COMMITTED`. The caller has printed
 *   one annotation line per finding above this one.
 * @param {{scanned?: number, excusedCount?: number, hits?: number,
 *          statements?: number, ground?: {cause: string, line: string}}} seen
 * @returns {import('./verdict-shape.mjs').Verdict}
 */
export function verdict(findings, seen = {}) {
  const { scanned = 0, excusedCount = 0, hits = 0, statements = 0, ground = null } = seen

  if (ground) {
    return verdictOf({
      exitCode: 2,
      stream: 'err',
      derivedFrom: 'ground',
      cause: ground.cause,
      line: ground.line,
    })
  }

  const counted =
    `${scanned} non-test module(s) under tools/ and scripts/, of which ${hits} do work at ` +
    `module scope across ${statements} statement(s), and ${excusedCount} carry a written ` +
    'baseline entry'

  if (findings.length === 0) {
    return verdictOf({
      exitCode: 0,
      cause: 'EVERY_IMPORT_IS_INERT',
      line:
        `Import effects: ${counted}. Every module that does work does it behind a guard that ` +
        'compares this module\'s own URL to the resolved entry point, or behind a written ' +
        'baseline entry, so importing a module in these trees to reach one function does not ' +
        'run its program. This reads the SHAPE of an import-time effect and never performs ' +
        'one; see the header for what that cannot see.',
    })
  }

  return verdictOf({
    exitCode: 1,
    stream: 'err',
    cites: [LOCUS.COMMITTED],
    cause: 'IMPORT_IS_NOT_INERT',
    line:
      `Import effects: ${findings.length} finding(s) over ${counted}. Every one is a committed ` +
      'file, so every checkout and CI has it too, and repairing it is a pull request rather ' +
      'than a command. Importing one of these modules to test a function in it runs its ' +
      'program instead.',
  })
}

const finding = (rule) => ({ locus: LOCUS.COMMITTED, rule, message: 'x' })

/** The input space. Outcomes are measured by the enumerator, never declared. */
export const GATE = describeGate({
  id: 'tools/gates/import-effects.mjs',
  verdict,
  loci: {
    [LOCUS.COMMITTED]: { noun: /a committed\s+file/ },
  },
  probes: [
    { name: 'nothing found', findings: [], seen: { scanned: 82, excusedCount: 10, hits: 10, statements: 57 } },
    {
      name: 'one unguarded module',
      findings: [finding('IMPORT_DOES_WORK')],
      seen: { scanned: 82, excusedCount: 10, hits: 11, statements: 58 },
    },
    {
      name: 'a guard asking the wrong question',
      findings: [finding('GUARD_ASKS_THE_WRONG_QUESTION')],
      seen: { scanned: 82, excusedCount: 10, hits: 11, statements: 58 },
    },
    {
      name: 'a baseline entry that outlived its finding',
      findings: [finding('IMPORT_BASELINE_STALE')],
      seen: { scanned: 82, excusedCount: 10, hits: 9, statements: 55 },
    },
    {
      name: 'all three codes at once',
      findings: [
        finding('IMPORT_DOES_WORK'),
        finding('GUARD_ASKS_THE_WRONG_QUESTION'),
        finding('IMPORT_BASELINE_STALE'),
      ],
      seen: { scanned: 82, excusedCount: 10, hits: 12, statements: 59 },
    },
  ],
  groundProbes: [
    {
      name: 'not a git checkout',
      call: () =>
        verdict([], {
          ground: {
            cause: 'NOT_A_GIT_CHECKOUT',
            line: 'Import effects: git ls-files failed, so no module list could be built and this run established nothing.',
          },
        }),
    },
    {
      name: 'baseline unreadable',
      call: () =>
        verdict([], {
          ground: {
            cause: 'BASELINE_UNREADABLE',
            line: 'Import effects: the baseline could not be read. Silence over a scope whose exclusions are unknown reads as clean, so this run established nothing.',
          },
        }),
    },
  ],
})
