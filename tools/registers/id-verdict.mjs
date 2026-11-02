// The one line `tools/registers/check-ids.mjs` prints last, as a pure
// function, plus the manifest validator that runs before any ref is read.
//
//   import { verdict, manifestFault, GATE } from './id-verdict.mjs'
//
// WHY THIS GATE EXISTS, and it is one measured defect rather than a class
// someone imagined. `docs/decisions.md` on `main` defines **ADR-005 twice and
// ADR-006 twice**, for four unrelated rulings, at lines 84, 92, 100 and 172.
// The ExO seat queued the repair as PWC-EXO-2 on 2026-09-27 and two PM
// standups flagged it before that. A month later it is still true, and the
// queue entry's own line citation has gone stale with it: it says the fourth
// heading is at line 123 and on `main` today it is at line 172. So the defect
// outlived the prose that recorded it, which is the argument for an exit code.
//
// WHAT A COLLISION COSTS, stated once so no reader has to take it on trust. A
// memoryless run learns why a rule exists only by following a citation. Three
// files cite "ADR-005" and "ADR-006" today, and each number resolves to two
// documents, so the citation teaches the run that citations do not resolve.
// `docs/agents/org-chart.md` already carries the workaround in prose: "that
// number is ambiguous because a second ADR-005".
//
// WHY THE SCOPE IS A COUNTER AND NOT A SPELLING. Three of the four namespaces
// in `id-namespaces.json` are allocated by incrementing a number in a file
// that more than one unmerged branch is writing to at once, which
// docs/standards/lessons.md L-A116 states as law: "a counter is not an
// allocator across your own open branches". PWC-7 is the proof inside this
// repository. On 2026-09-29 the engineer seat queued a `PWC-7` in PR #74 while
// a different `PWC-7` sat in PR #46, both unmerged, both reading the same tail
// of the same file and both getting the same answer. INC ids are excluded from
// the manifest for exactly the inverse reason: they key on a date and a slug,
// so two runs racing produce two different ids rather than one contested one.
//
// WHY A BURN LIST IS A FIRST-CLASS INPUT. An identifier has four states here,
// not two, and only one tool in the portfolio models more than two. Defined.
// Free. Burned by application, because this file's own rule is "delete an
// entry once it is applied", so every applied PWC leaves citations pointing at
// nothing. Burned by renaming, because PWC-7 through PWC-10 became PWC-EXO-1
// through 4 in place. A reissue of a burned id is worse than a dangling
// citation: the citation resolves, silently, to a different decision.
// docs/standards/lessons.md records HQ's own instance of this, where L-A102 to
// L-A105 are "retired unissued and no later entry may take them" because
// `main` already cited L-A104 for a rule that had been renumbered.
//
// WHY `--next` REFUSES TO RUN WITHOUT `--heads`. An allocator that reads one
// branch is the exact instrument that produced the PWC-7 collision. Answering
// from `main` alone would be fast, would look correct, and is the measured
// mistake, so it is a usage fault rather than a flag with a sensible default.

import { LOCUS, POSITION, describeGate, verdictOf } from '../gates/verdict-shape.mjs'

/** What a namespace may declare as the holder of a collision's repair. */
const REPAIRS = new Set([LOCUS.SEAT, LOCUS.OWNER])

/**
 * @typedef {object} Finding
 * @property {'seat' | 'owner'} held who repairs it, taken from the
 *   namespace's `repair` field rather than from the finding's own shape.
 * @property {'DOUBLE_DEFINITION' | 'BURNED_REISSUED'} rule
 * @property {string} message the line the caller already printed.
 */

/**
 * Validate the whole manifest before a single ref is read, and return the
 * fault as data rather than throwing, because the caller exits at module
 * scope. This is the shape `senderFault()` in tools/board/sender.mjs and
 * `baselineFault()` in tools/secret-scan-baseline.mjs already have.
 *
 * @param {unknown} manifest the parsed JSON, or undefined when the file is
 *   absent, or an Error when it did not parse.
 * @returns {{code: string, detail: string} | null} null when usable.
 */
export function manifestFault(manifest) {
  const fault = (code, detail) => ({ code, detail })

  if (manifest === undefined || manifest === null) {
    return fault('MANIFEST_ABSENT', 'no file at tools/registers/id-namespaces.json')
  }
  if (manifest instanceof Error) {
    return fault('MANIFEST_UNPARSEABLE', manifest.message)
  }
  if (typeof manifest !== 'object' || Array.isArray(manifest)) {
    return fault('MANIFEST_NOT_AN_OBJECT', `top level is ${Array.isArray(manifest) ? 'an array' : typeof manifest}`)
  }
  const namespaces = manifest.namespaces
  if (!Array.isArray(namespaces)) {
    return fault('MANIFEST_NO_NAMESPACES', '`namespaces` is absent or is not an array')
  }
  if (namespaces.length === 0) {
    // Zero namespaces is not a clean repository, it is a gate that checks
    // nothing while printing that it is clean. That is the one output this
    // file must never produce.
    return fault('MANIFEST_EMPTY', '`namespaces` is an empty array, so this gate would check nothing and exit 0')
  }

  const seen = new Set()
  for (const [index, ns] of namespaces.entries()) {
    const at = `namespaces[${index}]`
    if (typeof ns?.name !== 'string' || ns.name === '') {
      return fault('NAMESPACE_NO_NAME', `${at} has no \`name\``)
    }
    if (seen.has(ns.name)) {
      return fault('NAMESPACE_DUPLICATED', `${at} declares \`${ns.name}\` a second time`)
    }
    seen.add(ns.name)
    if (typeof ns.register !== 'string' || ns.register === '') {
      return fault('NAMESPACE_NO_REGISTER', `${at} (${ns.name}) has no \`register\` path`)
    }
    if (typeof ns.why !== 'string' || ns.why.trim() === '') {
      return fault('NAMESPACE_NO_WHY', `${at} (${ns.name}) has no \`why\`, so a reader cannot tell what it allocates`)
    }
    if (!REPAIRS.has(ns.repair)) {
      return fault(
        'NAMESPACE_REPAIR_UNKNOWN',
        `${at} (${ns.name}) has repair=${JSON.stringify(ns.repair)}; expected ${[...REPAIRS].join(' or ')}`,
      )
    }
    if (!Number.isInteger(ns.pad) || ns.pad < 1) {
      // The allocator prints an identifier a seat will paste into a heading,
      // so it has to agree with the register's own zero padding: ADR-007 and
      // ADR-7 are the same number and two different strings, and every
      // citation in this repository is a string match.
      return fault('NAMESPACE_PAD_UNUSABLE', `${at} (${ns.name}) has pad=${JSON.stringify(ns.pad)}; expected a positive integer`)
    }
    if (typeof ns.define !== 'string' || ns.define === '') {
      return fault('NAMESPACE_NO_DEFINE', `${at} (${ns.name}) has no \`define\` pattern`)
    }
    let compiled
    try {
      compiled = new RegExp(ns.define, 'gm')
    } catch (error) {
      return fault('DEFINE_NOT_A_PATTERN', `${at} (${ns.name}): ${error.message}`)
    }
    // Two capture groups are load-bearing and neither is optional: group 1 is
    // the whole identifier, which is what a citation elsewhere in the
    // repository spells, and group 2 is its number, which is what the
    // allocator increments. A pattern with only one of them would make the
    // gate report an identifier it cannot allocate from, or allocate from a
    // number it cannot name.
    const source = compiled.source
    const groups = new RegExp(`${source}|`).exec('')?.length ?? 0
    if (groups < 3) {
      return fault(
        'DEFINE_NO_NUMBER_CAPTURE',
        `${at} (${ns.name}) captures ${groups - 1} group(s); needs 2, the whole identifier and its number`,
      )
    }
    if (!(source.startsWith('^') && source.endsWith('$'))) {
      // Anchoring is what keeps a mention from counting as a definition. An
      // unanchored pattern would read "see ADR-005 above" in a paragraph as a
      // fifth definition and report a collision that does not exist.
      return fault(
        'DEFINE_NOT_ANCHORED',
        `${at} (${ns.name}) pattern ${JSON.stringify(ns.define)} is not anchored with ^ and $, so a mention would count as a definition`,
      )
    }

    const burned = ns.burned ?? []
    if (!Array.isArray(burned)) {
      return fault('BURNED_NOT_AN_ARRAY', `${at} (${ns.name}) has a \`burned\` that is not an array`)
    }
    const burnedIds = new Set()
    for (const [b, entry] of burned.entries()) {
      const where = `${at}.burned[${b}]`
      if (typeof entry?.id !== 'string' || entry.id === '') {
        return fault('BURNED_NO_ID', `${where} has no \`id\``)
      }
      if (typeof entry.why !== 'string' || entry.why.trim() === '') {
        // A burn with no reason cannot be reviewed and cannot be lifted, so it
        // is indistinguishable from a typo that silently shrinks the
        // allocator's range forever.
        return fault('BURNED_NO_WHY', `${where} (${entry.id}) has no \`why\``)
      }
      if (burnedIds.has(entry.id)) {
        return fault('BURNED_DUPLICATED', `${where} burns ${entry.id} a second time`)
      }
      burnedIds.add(entry.id)
      if (!entry.id.startsWith(`${ns.name}-`)) {
        return fault(
          'BURNED_OUT_OF_NAMESPACE',
          `${where} burns ${entry.id}, which does not start with ${ns.name}-`,
        )
      }
      if (!/^\d+$/.test(entry.id.slice(ns.name.length + 1))) {
        return fault(
          'BURNED_NOT_NUMBERED',
          `${where} burns ${entry.id}, whose tail is not a number this allocator can skip`,
        )
      }
    }
  }
  return null
}

/**
 * @param {Finding[]} findings every collision, each already printed by the
 *   caller as one line.
 * @param {{ids?: number, namespaces?: number, refs?: number, scope?: string}} seen
 *   the census, for the clean line.
 * @returns {import('../gates/verdict-shape.mjs').Verdict}
 */
export function verdict(findings, seen = {}) {
  const { ids = 0, namespaces = 0, refs = 1, scope = 'origin/main' } = seen
  const counted = `${ids} identifier(s) in ${namespaces} namespace(s) across ${refs} ref(s), from ${scope}`

  const byOwner = findings.filter((f) => f.held === LOCUS.OWNER)
  // Anything not explicitly the owner's lands on the seat, which is the louder
  // exit code and the actor reading the output. The inverse default would file
  // a seat's own collision under "not yours to repair".
  const bySeat = findings.filter((f) => f.held !== LOCUS.OWNER)

  if (findings.length === 0) {
    return verdictOf({
      exitCode: 0,
      cause: 'ALL_IDS_UNIQUE',
      line: `Register identifiers: ${counted}, every one defined once and no burned one reissued. Exit 0.`,
    })
  }

  if (bySeat.length === 0) {
    return verdictOf({
      exitCode: 2,
      cause: 'OWNER_REMAINDER_ONLY',
      cites: [LOCUS.OWNER],
      line:
        `Register identifiers: ${counted}, clean as far as a seat can take it. ` +
        `${byOwner.length} collision(s) above need the owner, not a seat. Exit 2.`,
    })
  }

  return verdictOf({
    exitCode: 1,
    cause: byOwner.length > 0 ? 'SEAT_REPAIRABLE_WITH_OWNER_REMAINDER' : 'SEAT_REPAIRABLE',
    cites: byOwner.length > 0 ? [LOCUS.SEAT, LOCUS.OWNER] : [LOCUS.SEAT],
    line:
      `Register identifiers: ${counted}, ${bySeat.length} collision(s) a seat can repair` +
      `${byOwner.length > 0 ? ` and ${byOwner.length} the owner holds` : ''}. Exit 1.`,
  })
}

/**
 * The exit-2 ground branch, taking its named cause from the fault's own code
 * rather than inventing a second vocabulary for the same condition. This is
 * the shape `baselineUnusable(fault)` took in tools/secret-scan-verdict.mjs.
 *
 * @param {{code: string, detail: string}} fault
 * @returns {import('../gates/verdict-shape.mjs').Verdict}
 */
export function manifestUnusable(fault) {
  return verdictOf({
    exitCode: 2,
    cause: fault.code,
    derivedFrom: 'ground',
    stream: 'err',
    position: POSITION.BEFORE,
    line: `Register identifiers: the namespace manifest is unusable, so nothing was checked (${fault.code}: ${fault.detail}). Exit 2.`,
    quoted: [fault.detail],
  })
}

/**
 * The other exit-2 ground branch: the refs the scope names could not be read,
 * so the answer is unknown rather than clean. Separate from
 * `manifestUnusable` because the repair is in a different place, a network or
 * a clone rather than a tracked file.
 *
 * @param {{code: string, detail: string}} fault
 * @returns {import('../gates/verdict-shape.mjs').Verdict}
 */
export function scopeUnreadable(fault) {
  return verdictOf({
    exitCode: 2,
    cause: fault.code,
    derivedFrom: 'ground',
    stream: 'err',
    position: POSITION.BEFORE,
    line: `Register identifiers: the scope could not be read, so no answer was reached (${fault.code}: ${fault.detail}). Exit 2.`,
    quoted: [fault.detail],
  })
}

const seat = (rule = 'DOUBLE_DEFINITION') => ({ held: LOCUS.SEAT, rule, message: 'x' })
const owner = (rule = 'DOUBLE_DEFINITION') => ({ held: LOCUS.OWNER, rule, message: 'x' })

/** The input space. Outcomes are measured by the enumerator, never declared. */
export const GATE = describeGate({
  id: 'tools/registers/check-ids.mjs',
  verdict,
  loci: {
    [LOCUS.SEAT]: { noun: /a seat can (repair|take it)/ },
    [LOCUS.OWNER]: { noun: /(need|needs) the owner|the owner holds/ },
  },
  probes: [
    { name: 'nothing found', findings: [], seen: { ids: 22, namespaces: 4, refs: 16 } },
    { name: 'seat only', findings: [seat()], seen: { ids: 22, namespaces: 4, refs: 16 } },
    { name: 'owner only', findings: [owner()], seen: { ids: 22, namespaces: 4, refs: 16 } },
    {
      name: 'both loci',
      findings: [seat(), owner(), owner('BURNED_REISSUED')],
      seen: { ids: 22, namespaces: 4, refs: 16 },
    },
  ],
})
