// The last line `tools/ledger/check.mjs` prints, as a pure function.
//
//   import { verdict, GATE } from './contract-verdict.mjs'
//
// WHY IT IS A SEPARATE FILE. `check.mjs` does its work at import time: it reads
// the ledger at module scope, accumulates `violations` into a closure variable
// and exits. There is no way to import it and ask it a question, which is the
// same reason `attributes-verdict.mjs` is split out of `check-attributes.mjs`
// and `block-kinds.mjs` out of this gate's own rule body. The three failing
// branches below were previously reachable only by spawning the CLI against a
// fixture ledger.
//
// SECOND OF THE THREE EXTRACTIONS asked for in `docs/ideas.md`, "Every gate
// exports its verdict as data, so the sweep is a program and not a table".
// Every string is byte-identical to what the gate printed before, pinned
// against literals in `contract-verdict.test.mjs`.
//
// ONE THING THE TEXT SWEEP GOT RIGHT AND ONE IT GOT WRONG. Right: two failing
// exit calls, two failing branches. Wrong: the clean branch has no
// `process.exit` at all -- `check.mjs` falls off the end of the file and node
// exits 0 implicitly -- so a sweep that enumerates exit calls cannot see the
// gate's exit-0 verdict even in principle. An inventory of a gate's branches
// built from its exit calls is therefore incomplete by construction, not merely
// stale. Here exit 0 is returned like any other branch.
//
// WHY THIS GATE SPLITS THE FAILING CODE AT ALL, copied from its own header
// because the reason is the one this whole module class is about: a gate whose
// red light can only be cleared by someone who never runs the gate is
// permanently red, and a permanently red gate is read by nobody.

import { LOCUS, describeGate, verdictOf } from '../gates/verdict-shape.mjs'

/**
 * @typedef {{held: 'seat' | 'owner', rule: string, message: string}} Violation
 */

/**
 * @param {Violation[]} violations every finding, classified by who holds the
 *   repair. The caller has printed one annotation line per entry above.
 * @param {{blocks?: number, path?: string}} seen the census, for every line.
 * @returns {import('../gates/verdict-shape.mjs').Verdict}
 */
export function verdict(violations, seen = {}) {
  const { blocks = 0, path = 'docs/ideas.md' } = seen
  // Not explicitly the owner's means the seat's. Same correction as
  // `closures-verdict.mjs`, for the same latent defect and the same reason:
  // two equality filters drop an unkeyed finding out of both arrays, and the
  // branch it then lands on tells a seat its own defect is not its to repair.
  // `check.mjs`'s `violation()` helper takes `held` as its first positional
  // argument so every call site supplies one, which is why this is latent.
  const byOwner = violations.filter((v) => v.held === LOCUS.OWNER)
  const bySeat = violations.filter((v) => v.held !== LOCUS.OWNER)

  const counted = `${blocks} blocks in ${path}`

  if (bySeat.length > 0) {
    return verdictOf({
      exitCode: 1,
      stream: 'err',
      cause: 'SEAT_MUST_REPAIR',
      // Both counts are cited unconditionally here, including when the owner's
      // is zero, which is why this branch is one cause and not two: the line
      // has a single form and names both actors in all of them.
      cites: [LOCUS.SEAT, LOCUS.OWNER],
      line:
        `Ledger contract: ${bySeat.length} violation(s) a seat must repair, ` +
        `${byOwner.length} the owner must resolve, in ${counted}.`,
    })
  }

  if (byOwner.length > 0) {
    return verdictOf({
      exitCode: 2,
      stream: 'err',
      cause: 'OWNER_REMAINDER_ONLY',
      cites: [LOCUS.OWNER],
      line:
        `Ledger contract: ${counted}, clean as far as a seat can take it. ` +
        `${byOwner.length} violation(s) above need the owner, not a seat. Exit 2.`,
    })
  }

  return verdictOf({
    exitCode: 0,
    cause: 'CLEAN',
    line: `Ledger contract: ${counted}, clean.`,
  })
}

const seat = (rule = 'DUPLICATE_IDEA') => ({ held: LOCUS.SEAT, rule, message: 'x' })
const owner = (rule = 'STATUS_OWNER_HELD') => ({ held: LOCUS.OWNER, rule, message: 'x' })

/** The input space. Outcomes are measured by the enumerator, never declared. */
export const GATE = describeGate({
  id: 'tools/ledger/check.mjs',
  verdict,
  loci: {
    [LOCUS.SEAT]: { noun: /a seat must repair|a seat can take it/ },
    [LOCUS.OWNER]: { noun: /the owner must resolve|need the owner/ },
  },
  probes: [
    { name: 'clean', findings: [], seen: { blocks: 375 } },
    { name: 'seat only', findings: [seat()], seen: { blocks: 375 } },
    { name: 'owner only', findings: [owner(), owner()], seen: { blocks: 375 } },
    { name: 'both loci', findings: [seat(), owner()], seen: { blocks: 375 } },
  ],
})
