// The last line `tools/ledger/check-closures.mjs` prints, as a pure function.
//
//   import { verdict, GATE } from './closures-verdict.mjs'
//
// WHY THIS EXTRACTION, given this gate was already right. `docs/ideas.md`
// ("Every gate exports its verdict as data, so the sweep is a program and not a
// table") asks for the three gates that already derive their verdict correctly
// to be extracted FIRST, without changing a single output string, so the shape
// is proved against code that works before it is imposed on code that does not.
// This is one of the three. Every string below is byte-identical to the one the
// gate printed before the extraction; `closures-verdict.test.mjs` pins all four
// against literals, so a reword shows up as a failing assertion rather than as
// a quietly different sentence in CI's log.
//
// FOUR BRANCHES, WHERE THE TEXT SWEEP COUNTED TWO. `grep -c 'process.exit([1-9])'`
// returns 2 for this file. The exit-1 line has two forms, because the clause
// naming the owner's remainder is conditional, and a reader handed the form
// without that clause has no way to know a remainder exists. That is the fourth
// branch and no text search for exit calls can see it. It is the small proof of
// why the inventory has to be a program: this gate is one of the correct ones
// and the grep still mis-described it.

import { LOCUS, POSITION, describeGate, verdictOf } from '../gates/verdict-shape.mjs'

/**
 * @typedef {{held: 'seat' | 'owner', rule: string, message: string}} Violation
 */

/**
 * @param {Violation[]} violations every finding, each already classified by who
 *   holds the repair. The caller has printed one `::error::`/`::warning::` line
 *   per entry above.
 * @param {{markers?: number, docs?: number, ledgerPath?: string}} seen the
 *   census, for the clean line.
 * @returns {import('../gates/verdict-shape.mjs').Verdict}
 */
export function verdict(violations, seen = {}) {
  const { markers = 0, docs = 0, ledgerPath = 'docs/ideas.md' } = seen
  const bySeat = violations.filter((v) => v.held === LOCUS.SEAT)
  // Anything not explicitly the owner's is the seat's, so a finding added later
  // with a missing `held` lands on the louder exit code and the actor who is
  // actually reading the output. Guessing `owner` would file a seat's own defect
  // under "not yours to repair", which is the failure this module class exists
  // to prevent.
  const byOwner = violations.filter((v) => v.held === LOCUS.OWNER)

  const counted = `${markers} closure marker(s) in ${docs} document(s), against ${ledgerPath}`

  if (violations.length === 0) {
    return verdictOf({
      exitCode: 0,
      cause: 'ALL_CLOSED',
      line: `Closure backlinks: ${counted}, all resolved and all closed. Exit 0.`,
    })
  }

  if (bySeat.length === 0) {
    return verdictOf({
      exitCode: 2,
      cause: 'OWNER_REMAINDER_ONLY',
      cites: [LOCUS.OWNER],
      line:
        `Closure backlinks: ${counted}, clean as far as a seat can take it. ` +
        `${byOwner.length} violation(s) above need the owner, not a seat. Exit 2.`,
    })
  }

  return verdictOf({
    exitCode: 1,
    cause: byOwner.length > 0 ? 'SEAT_REPAIRABLE_WITH_OWNER_REMAINDER' : 'SEAT_REPAIRABLE',
    cites: byOwner.length > 0 ? [LOCUS.SEAT, LOCUS.OWNER] : [LOCUS.SEAT],
    line:
      `Closure backlinks: ${counted}, ${bySeat.length} violation(s) a seat can repair` +
      `${byOwner.length > 0 ? ` and ${byOwner.length} the owner holds` : ''}. Exit 1.`,
  })
}

const seat = (rule = 'CLOSURE_UNRESOLVED') => ({ held: LOCUS.SEAT, rule, message: 'x' })
const owner = (rule = 'STATUS_HELD') => ({ held: LOCUS.OWNER, rule, message: 'x' })

/** The input space. Outcomes are measured by the enumerator, never declared. */
export const GATE = describeGate({
  id: 'tools/ledger/check-closures.mjs',
  verdict,
  loci: {
    [LOCUS.SEAT]: { noun: /a seat can (repair|take it)/ },
    [LOCUS.OWNER]: { noun: /(need|needs) the owner|the owner holds/ },
  },
  probes: [
    { name: 'nothing found', findings: [], seen: { markers: 12, docs: 3 } },
    { name: 'seat only', findings: [seat()], seen: { markers: 12, docs: 3 } },
    { name: 'owner only', findings: [owner()], seen: { markers: 12, docs: 3 } },
    {
      name: 'both loci',
      findings: [seat(), owner(), owner()],
      seen: { markers: 12, docs: 3 },
    },
  ],
})
