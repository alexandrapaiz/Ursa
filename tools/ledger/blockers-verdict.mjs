// The last line `tools/ledger/check-blockers.mjs` prints, as a pure function.
//
//   import { verdict, GATE } from './blockers-verdict.mjs'
//
// Separated from the gate for the reason `closures-verdict.mjs` states and
// `docs/ideas.md` asks for: every gate exports its verdict as data, so the
// inventory of what this repository's gates can conclude is a program rather
// than a table somebody maintains. This gate is new, so unlike the three in
// that entry there is no prior output to stay byte-identical to; what the
// discipline buys here instead is that `tools/gates/enumerate-verdicts.mjs`
// MEASURES its branches on the day it lands rather than a month later.
//
// THREE LOCI AND WHY THE THIRD IS NOT `owner`. A retired blocker is the
// seat's to repair: the seat wrote the sentence and the seat is the only
// party who knows whether the work behind it is still wanted. A forge this
// gate could not reach is nobody's defect in the repository at all, so it is
// `clone` — the same locus `tools/registers/check-ids.mjs` reaches for when
// its open set is unknown, and for the same reason: silence over an
// unmeasurable scope reads as clean, and reporting clean there is the one
// outcome worse than reporting nothing.
//
// WHY THE CODE IS `FORGE_OPEN_SET_UNKNOWN` AND NOT THE `OPEN_SET_UNKNOWN`
// THAT `tools/registers/check-ids.mjs` ALREADY USES FOR THE SAME FAULT. The
// bare name was the first spelling, and `tools/gates/code-census.mjs` caught
// it: the census decides "named by a test" on the code name alone, so this
// file's test asserting the bare name discharged check-ids.mjs's obligation
// for a branch that is still unreachable from any fixture there, and the
// census reported that detector's baseline entry as stale. Its own header
// also measures "exactly one name is emitted by two detectors", which a
// second shared name would have falsified. The general repair — keying the
// decision on the pair (detector, code) — is already a ledger item, named in
// that header and proposed in docs/ideas.md's "a generic disposition
// surface" entry. Qualifying the name is the part this gate can do without
// waiting for that, and it costs nothing: the fault is the same fault and
// the prefix says whose.

import { LOCUS, describeGate, verdictOf } from '../gates/verdict-shape.mjs'

/**
 * @typedef {{held: 'seat' | 'clone', code: string, message: string}} Finding
 */

/**
 * @param {Finding[]} findings every stale blocker, already printed one per
 *   line by the caller.
 * @param {{claims?: number, entries?: number, unresolvable?: number,
 *          ledgerPath?: string}} seen the census, for
 *   the clean line. `unresolvable` is the count of blocker shapes the gate
 *   read and cannot look up, named in the clean line on purpose so a green
 *   run states its own scope instead of implying it covered everything.
 * @returns {import('../gates/verdict-shape.mjs').Verdict}
 */
export function verdict(findings, seen = {}) {
  const {
    claims = 0,
    entries = 0,
    unresolvable = 0,
    ledgerPath = 'docs/ideas.md',
  } = seen

  const counted =
    `${claims} resolvable blocker claim(s) across ${entries} entr(ies) of ${ledgerPath}` +
    (unresolvable > 0 ? `, with ${unresolvable} blocker shape(s) this gate cannot look up` : '')

  // Split by locus rather than by a `seen` flag, which is the correction
  // `tools/gates/enumerate-verdicts.mjs` forced on this module the hour it
  // was registered. The first version took an `openSetKnown` boolean and
  // returned exit 2 with an EMPTY findings array, and the enumerator's
  // EXIT_0_WHEN_CLEAN rule is right about that: a gate that goes red with
  // nothing printed above the verdict tells a reader to go find out why
  // themselves. An unreachable forge is a finding — it is just not a
  // finding about the ledger — so it is reported as one, at `clone`, and the
  // verdict reads it off the same array as everything else.
  const byClone = findings.filter((f) => f.held === LOCUS.CLONE)
  const bySeat = findings.filter((f) => f.held !== LOCUS.CLONE)

  // Checked first, because an unknown open set produces an empty SEAT array
  // by construction — `staleBlockers` returns nothing for a null set — so the
  // clean branch would otherwise print "every named row still open" over a
  // question that was never asked.
  if (byClone.length > 0) {
    return verdictOf({
      exitCode: 2,
      cause: 'FORGE_OPEN_SET_UNKNOWN',
      cites: [LOCUS.CLONE],
      stream: 'err',
      line:
        `Ledger blockers: ${counted}, and the forge's open set is unknown, ` +
        `so no claim was resolved and none can be reported. This is the ` +
        `environment's to repair, not a seat's. Exit 2.`,
    })
  }

  if (bySeat.length === 0) {
    return verdictOf({
      exitCode: 0,
      cause: 'ALL_BLOCKERS_LIVE',
      line: `Ledger blockers: ${counted}, every named row still open. Exit 0.`,
    })
  }

  return verdictOf({
    exitCode: 1,
    cause: 'BLOCKER_RETIRED',
    cites: [LOCUS.SEAT],
    line:
      `Ledger blockers: ${counted}, ${bySeat.length} of them name a row ` +
      `that has left the open set, so the stated reason for not shipping is ` +
      `no longer a fact. A seat can repair each by writing the correction ` +
      `above the entry it belongs to. Exit 1.`,
    trailer: [
      'Keep the entry and put the correction on top of it, rather than ' +
        'editing the blocker sentence away: the gap between what a seat ' +
        'filed and what the trunk says is the measurement, and a tidied ' +
        'entry no longer carries it.',
      'Do not change `- Status:` to match. prompts/engineer-agent.md ' +
        'reserves every status transition except `accepted` to `built` to ' +
        'the owner.',
    ],
  })
}

const seat = (code = 'BLOCKER_RETIRED') => ({ held: LOCUS.SEAT, code, message: 'x' })
const clone = (code = 'FORGE_OPEN_SET_UNKNOWN') => ({ held: LOCUS.CLONE, code, message: 'x' })

/** The input space. Outcomes are measured by the enumerator, never declared. */
export const GATE = describeGate({
  id: 'tools/ledger/check-blockers.mjs',
  verdict,
  loci: {
    [LOCUS.SEAT]: { noun: /A seat can repair/ },
    [LOCUS.CLONE]: { noun: /the environment's to repair/ },
  },
  probes: [
    { name: 'nothing stale', findings: [], seen: { claims: 1, entries: 509 } },
    {
      name: 'nothing stale, with an unresolvable remainder named',
      findings: [],
      seen: { claims: 1, entries: 509, unresolvable: 3 },
    },
    { name: 'one stale blocker', findings: [seat()], seen: { claims: 1, entries: 509 } },
    {
      name: 'two stale blockers',
      findings: [seat(), seat()],
      seen: { claims: 4, entries: 509, unresolvable: 3 },
    },
    {
      name: 'the forge was unreachable',
      findings: [clone()],
      seen: { claims: 1, entries: 509 },
    },
  ],
})
