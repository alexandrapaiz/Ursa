// The one line `tools/ledger/check-attributes.mjs` prints last, as a pure
// function, plus the exit code that agrees with it.
//
//   import { verdict } from './attributes-verdict.mjs'
//
// WHY IT IS A SEPARATE FILE. check-attributes.mjs does its work at import
// time: it shells out to `git ls-files` and `git check-attr`, builds its
// violation list at module scope and exits. There is no way to import it and
// ask it a question, so these branches were reachable only by spawning the
// CLI against a fixture repository. This is the split
// `scripts/dep-floor-summary.mjs` is out of `scripts/dep-floor.mjs` and
// `tools/ledger/block-kinds.mjs` is out of `tools/ledger/check.mjs`.
//
// WHY THE BRANCHES EXIST AT ALL — and this one was measured, not imagined.
//
// The line this replaces was `Merge attributes: ${violations.length}
// violation(s).` at exit 1, for a list that mixes two kinds of finding whose
// repairs live in different places and belong to different people:
//
//   COMMITTED. A tracked file is wrong. `.gitattributes` names a driver this
//   repository refuses, or names one no committed installer registers, or a
//   driver's own path table disagrees with the attributes that reach it.
//   Every clone and every checkout of this commit has the same defect, CI
//   included. The repair is an edit to a tracked file, so it is a pull
//   request and a review.
//
//   CLONE. Nothing committed is wrong. `.gitattributes` says `docs/ideas.md
//   merge=ledger` and the command behind the name `ledger` lives in
//   `.git/config`, which is per-clone and never committed, so a fresh clone
//   has the attribute and not the driver. The repair is one command, it
//   produces no diff, there is nothing to review, and it is correct for
//   exactly one working copy.
//
// Calling both of those "violation(s)" at exit 1 is not a wording problem. On
// 2026-10-26 three seats in this company independently measured the same
// fourteen ledger co-appends as merge conflicts needing a rebase, because in
// a fresh seat clone the default line merge really does conflict on two
// appends and nothing told them the answer was a property of their clone.
// One seat's run was spent recommending a rebase that was not needed; two
// more re-measured it to withdraw the recommendation. The exit code is the
// first thing a reader believes, and `1` says "this repository is broken"
// where `2` plus this sentence says "your working copy is not set up".
//
// WHY EXIT 2 AND NOT A WARNING AT EXIT 0. Because the clone really cannot
// merge the ledger correctly, so a seat that proceeds will measure a conflict
// that is not there. Non-zero is right. `2` is already this repository's code
// for a condition where the tool's own ground is unusable rather than the
// thing it checks being wrong: `tools/secret-scan.mjs` ("cannot do its job"),
// `scripts/redaction-check.mjs` (cannot read the gate's rules),
// `tools/ledger/pairwise.mjs` (usage or environment fault), and
// `tools/ledger/check-closures.mjs` (`clean as far as a seat can take it`,
// the closest relative: there the remaining findings are the owner's, here
// they are the clone's).
//
// SAFETY OF THE CODE CHANGE, checked rather than assumed. `tools/ledger/ci/
// ledger-gate.yml` runs this gate WITHOUT `--clone`, so the clone locus
// cannot fire in CI and exit 2 is unreachable there. The only caller that
// passes `--clone` is `tools/registers/install-drivers.sh`, where the gate is
// the last command and its status becomes the script's; 2 is non-zero exactly
// as 1 was, so a failed install still fails.

/** `3 violation(s)`, `1 violation`. */
function n(count, singular, plural) {
  return `${count} ${count === 1 ? singular : plural}`
}

import { LOCUS, describeGate, verdictOf } from '../gates/verdict-shape.mjs'

export const COMMITTED = LOCUS.COMMITTED
export const CLONE = LOCUS.CLONE

/**
 * @typedef {{locus: 'committed' | 'clone', message: string}} Violation
 */

/**
 * @param {Violation[]} violations every finding, each already classified by
 *   where its repair lives. The caller has printed one line per entry above.
 * @param {{declared?: number, drivers?: string[], checkedClone?: boolean}} seen
 *   what the run looked at, for the clean line.
 * @returns {{exitCode: 0 | 1 | 2, line: string, stream: 'out' | 'err'}}
 *   The verdict is DERIVED from the same array the per-item lines came from,
 *   which is the property this file exists to hold: it cannot contradict them,
 *   because it has no independent idea of what happened.
 */
export function verdict(violations, seen = {}) {
  const { declared = 0, drivers = [], checkedClone = false } = seen
  const clone = violations.filter((v) => v.locus === CLONE)
  // Anything that is not explicitly a clone finding counts as committed. A
  // finding added later with a missing or misspelled locus must land on the
  // stronger claim and the louder exit code, because the failure mode of
  // guessing `clone` is a tracked-file defect reported as "nothing here needs
  // a pull request" -- which is the exact sentence this module exists to make
  // trustworthy.
  const committed = violations.filter((v) => v.locus !== CLONE)

  if (violations.length === 0) {
    return verdictOf({
      exitCode: 0,
      stream: 'out',
      cause: 'ALL_DECLARATIONS_REGISTERED',
      line:
        `Merge attributes: ${n(declared, 'declaration', 'declarations')} over ` +
        `${n(drivers.length, 'driver', 'drivers')} (${drivers.join(', ') || 'none'})` +
        `${checkedClone ? ', all registered in this clone' : ''}.`,
    })
  }

  if (committed.length > 0) {
    const also =
      clone.length > 0
        ? ` Separately, ${n(clone.length, 'declaration', 'declarations')} ` +
          `${clone.length === 1 ? 'is' : 'are'} not registered in this clone, which is not ` +
          'committed and is not part of that repair.'
        : ''
    return verdictOf({
      exitCode: 1,
      stream: 'err',
      cause: 'TRACKED_FILE_WRONG',
      cites: [COMMITTED, CLONE],
      line:
        `Merge attributes: ${n(committed.length, 'violation', 'violations')} in tracked files, ` +
        `so every checkout of this commit has ${committed.length === 1 ? 'it' : 'them'} and CI ` +
        `does too. Repairing ${committed.length === 1 ? 'it' : 'them'} edits a committed file, ` +
        `which is a pull request.${also}`,
    })
  }

  // Clone-only. The committed state is correct and this is the finding that
  // reads as a repository defect when it is not one.
  return verdictOf({
    exitCode: 2,
    stream: 'err',
    cause: 'CLONE_NOT_CONFIGURED',
    cites: [CLONE],
    line:
      'Merge attributes: the committed state is correct and nothing here needs a pull request. ' +
      `${n(clone.length, 'declaration', 'declarations')} ` +
      `${clone.length === 1 ? 'names a driver' : 'name drivers'} this clone has not registered. ` +
      'The command behind a driver name lives in .git/config, which is per-clone and never ' +
      'committed, so this is true of this working copy alone. Until it is registered, git ' +
      'falls back to the default line merge and says nothing, and every append-only register ' +
      'co-append in the queue measures as a conflict that is not one. One command above fixes it.',
  })
}

const committed = (message = 'x') => ({ locus: COMMITTED, message })
const clone = (message = 'x') => ({ locus: CLONE, message })

/** The input space. Outcomes are measured by the enumerator, never declared.
 *
 *  THE FOURTH PROBE IS THE REGRESSION. `both loci` is the exact input shape
 *  that produced `Merge attributes: 3 violation(s).` before the repair of
 *  2026-10-26: two findings whose repairs belong to different people, summed
 *  into one count that named neither. `enumerate-verdicts.mjs` checks
 *  MIXED_LOCI_NAMED against this probe, and
 *  `tools/gates/enumerate-verdicts.test.mjs` proves the check fails on the old
 *  line and passes on the new one. That is the only evidence that the
 *  enumerator can actually detect the class it was built for, rather than
 *  agreeing with four gates that are already right.
 */
export const GATE = describeGate({
  id: 'tools/ledger/check-attributes.mjs',
  verdict,
  loci: {
    [COMMITTED]: { noun: /in tracked files/ },
    [CLONE]: { noun: /(in|of) this (clone|working copy)|not registered in this clone/ },
  },
  probes: [
    {
      name: 'nothing wrong',
      findings: [],
      seen: { declared: 6, drivers: ['ledger', 'union'], checkedClone: true },
    },
    { name: 'committed only', findings: [committed()], seen: { declared: 6 } },
    { name: 'clone only', findings: [clone(), clone()], seen: { declared: 6 } },
    { name: 'both loci', findings: [committed(), clone()], seen: { declared: 6 } },
  ],
})
