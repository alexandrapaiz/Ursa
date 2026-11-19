// The last line `tools/gates/acceptance-fields.mjs` prints, as a pure function.
//
//   import { verdict, GATE } from './acceptance-fields-verdict.mjs'
//
// WHY IT IS A SEPARATE FILE. `tools/gates/import-effects.baseline.json`
// excuses ten modules that run their program when imported, and the enumerator
// in `tools/gates/enumerate-verdicts.mjs` imports a gate's verdict to drive it
// with synthetic findings. A verdict that arrived with a scan attached would
// make the enumerator's run cost the scan. So the split is made before the
// fact, as `import-effects-verdict.mjs` says of itself.
//
// ONE LOCUS. Every finding is a tracked file: a register, its manifest entry,
// or this gate's own baseline. There is no clone-local case, because a field
// nothing reads is a field nothing reads in every checkout.

import { LOCUS, describeGate, verdictOf } from './verdict-shape.mjs'

/**
 * @param {{rule: string, message: string, locus?: string}[]} findings
 * @param {{registers?: number, entries?: number, fields?: number,
 *          asserted?: number, declared?: number, baselined?: number,
 *          ground?: {cause: string, line: string}}} seen
 * @returns {import('./verdict-shape.mjs').Verdict}
 */
export function verdict(findings, seen = {}) {
  const {
    registers = 0,
    entries = 0,
    fields = 0,
    asserted = 0,
    declared = 0,
    baselined = 0,
    ground = null,
  } = seen

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
    `${registers} acceptance register(s) holding ${entries} entry(s) over ${fields} distinct ` +
    `field(s), of which ${asserted} are read by a consumer, ${declared} are declared ` +
    `documentation-only by the register itself, and ${baselined} carry a baseline entry here`

  if (findings.length === 0) {
    return verdictOf({
      exitCode: 0,
      cause: 'EVERY_FIELD_IS_ACCOUNTED_FOR',
      line:
        `Acceptance fields: ${counted}. Every field on every entry is read, declared or ` +
        'baselined, so no reason sits beside an accepted risk with nothing consuming it. ' +
        'That a field is READ is the floor and not the ceiling: this gate cannot tell ' +
        'whether a field is read for the question it claims to answer, and the header says ' +
        'which register here settles that and how.',
    })
  }

  return verdictOf({
    exitCode: 1,
    stream: 'err',
    cites: [LOCUS.COMMITTED],
    cause: 'A_FIELD_IS_UNACCOUNTED_FOR',
    line:
      `Acceptance fields: ${findings.length} finding(s) over ${counted}. Every one is a ` +
      'tracked file, so every checkout and CI has it too, and repairing it is a pull ' +
      'request rather than a command. A reason beside an accepted risk that no consumer ' +
      'reads is prose with an exit code next to it.',
  })
}

const finding = (rule) => ({ locus: LOCUS.COMMITTED, rule, message: 'x' })
const base = { registers: 9, entries: 49, fields: 48, asserted: 28, declared: 0, baselined: 20 }

/** The input space. Outcomes are measured by the enumerator, never declared. */
export const GATE = describeGate({
  id: 'tools/gates/acceptance-fields.mjs',
  verdict,
  loci: {
    [LOCUS.COMMITTED]: { noun: /a\s+tracked\s+file/ },
  },
  probes: [
    { name: 'nothing found', findings: [], seen: base },
    {
      name: 'a field no consumer reads',
      findings: [finding('FIELD_UNREAD')],
      seen: { ...base, baselined: 19 },
    },
    {
      name: 'a baseline entry that outlived its finding',
      findings: [finding('FIELD_BASELINE_STALE')],
      seen: { ...base, asserted: 29, baselined: 19 },
    },
    {
      name: 'a documentation-only declaration that outlived its field',
      findings: [finding('DECLARATION_STALE')],
      seen: { ...base, declared: 1 },
    },
    {
      name: 'a register the manifest does not classify',
      findings: [finding('REGISTER_UNCLASSIFIED')],
      seen: { ...base, registers: 10 },
    },
    {
      name: 'a manifest consumer that is not in the tree',
      findings: [finding('CONSUMER_MISSING')],
      seen: base,
    },
    {
      name: 'all five codes at once',
      findings: [
        finding('FIELD_UNREAD'),
        finding('FIELD_BASELINE_STALE'),
        finding('DECLARATION_STALE'),
        finding('REGISTER_UNCLASSIFIED'),
        finding('CONSUMER_MISSING'),
      ],
      seen: { ...base, registers: 10, asserted: 29, declared: 1, baselined: 18 },
    },
  ],
  groundProbes: [
    {
      name: 'not a git checkout',
      call: () =>
        verdict([], {
          ground: {
            cause: 'NOT_A_GIT_CHECKOUT',
            line: 'Acceptance fields: git ls-files failed, so the register set could not be discovered and this run established nothing.',
          },
        }),
    },
    {
      name: 'manifest unreadable',
      call: () =>
        verdict([], {
          ground: {
            cause: 'MANIFEST_UNREADABLE',
            line: 'Acceptance fields: the manifest could not be read, so which files are acceptance registers is unknown and a clean result cannot be reported.',
          },
        }),
    },
    {
      name: 'a register could not be parsed',
      call: () =>
        verdict([], {
          ground: {
            cause: 'REGISTER_UNPARSEABLE',
            line: 'Acceptance fields: a register in the manifest is not readable JSON, so its fields are unknown and silence over it would read as clean.',
          },
        }),
    },
  ],
})
