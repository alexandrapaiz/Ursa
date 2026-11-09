// Where every `npm audit` entry is sorted into one reported kind, as pure
// functions.
//
// WHY THIS FILE EXISTS, AND WHY IT IS SEPARATE. The same reason
// `scripts/dep-floor-summary.mjs` is separate, stated in that file's header:
// `scripts/dep-floor.mjs` does its work at import time, so nothing inside it
// can be imported and asked a question. Every branch that classified an
// advisory was therefore unreachable from a test. Two of those branches were
// wrong for two months and the gate's own output could not show it.
//
// WHAT WAS WRONG, measured 2026-11-09 on this repository's own tree.
// `node scripts/dep-floor.mjs` printed, for `ursa-minor`:
//
//   ursa-minor (ursa-minor-site): all critical=0 high=0 moderate=0 | production critical=0 high=0 moderate=0
//   Dependency floor holds: no critical anywhere, no high in any production tree.
//
// `npm audit --json` in the same directory in the same minute reported
// `{"info":0,"low":3,"moderate":0,"high":0,"critical":0,"total":3}`, and all
// three of those advisories carried
// `fixAvailable:{"name":"shadcn","version":"1.0.0","isSemVerMajor":true}`.
// So three known advisories with a known named repair appeared on no line of
// the gate, and a reader of that output concludes the package has none. Two
// independent omissions produced it:
//
//   1. THE SEVERITY FILTER. The report filter was
//      `if (sev === 'high' || sev === 'moderate')`, so a `low` or `info`
//      entry fell through a bare `continue` and was never recorded. Low is
//      not a reason to fail a gate. It is also not a reason to tell the
//      reader the count is zero when it is three.
//   2. THE TOTALS LINE. It printed `critical`, `high` and `moderate` out of
//      an object that carries five severities and a total, so the one
//      severity that was nonzero was the one not printed.
//
// WHY THE REMEDIATION HINT IS COMPUTED HERE AND NOT AT THE VIOLATION.
// `fixAvailable` has been read by this gate since the commit that created it,
// `810323cc` on 2026-09-29, inside the object literal pushed onto
// `violations` and nowhere else. Three of the four paths an advisory can take
// — below-floor warning, allowed-by-exception warning, expired exception —
// built their record without it. Ursa's security seat reported that on
// 2026-11-09 as a correction to this seat's 2026-11-01 ledger entry, which
// had claimed the field was never read at all. The field was read. It was
// read on the one branch this repository's actual advisories do not take.
// `fixHint` is a function so that there is one hint, reachable from every
// kind, rather than one hint reachable from one kind.

/** @typedef {'critical'|'high'|'moderate'|'low'|'info'} Severity */
/** @typedef {'prod'|'dev'} Scope */
/** @typedef {'violation'|'expired'|'warning'} Kind */

/**
 * The severities `npm audit` reports, worst first. `total` is excluded
 * because it is a sum and not a severity.
 * @type {Severity[]}
 */
export const SEVERITIES = ['critical', 'high', 'moderate', 'low', 'info']

/**
 * npm's own answer to "what would repair this", rendered as one phrase.
 *
 * `fixAvailable` is `false` or absent when no fix is published, the boolean
 * `true` when the repair is inside every declared range, and an object
 * `{name, version, isSemVerMajor}` when it needs a named package at a named
 * version. The `isSemVerMajor` marker is the part that changes whose job the
 * repair is: an in-range bump is a seat's afternoon, a semver-major is a
 * dependency decision a seat's charter does not let it take alone.
 *
 * @param {true|false|undefined|{name?: string, version?: string, isSemVerMajor?: boolean}} fixAvailable
 *   the `fixAvailable` field of one `npm audit --json` vulnerability entry
 * @returns {string} `npm audit fix`, `shadcn@1.0.0 (semver-major)`,
 *   `vite@5.4.21`, or `none published`
 */
export function fixHint(fixAvailable) {
  if (fixAvailable === true) return 'npm audit fix'
  if (fixAvailable && typeof fixAvailable === 'object' && fixAvailable.name) {
    const major = fixAvailable.isSemVerMajor ? ' (semver-major)' : ''
    return `${fixAvailable.name}@${fixAvailable.version}${major}`
  }
  return 'none published'
}

/**
 * Which of the three reported kinds one advisory belongs to.
 *
 * Total by construction: every input returns a kind, so no advisory can be
 * dropped by falling off the end of a filter. That is the property
 * `dep-floor-classify.test.mjs` asserts over the whole severity cross
 * product, and it is the property the severity filter did not have.
 *
 * The floor itself is unchanged by this function: `critical` anywhere and
 * `high` in a production tree are what fail, exactly as
 * `scripts/dep-floor.mjs` has always had it.
 *
 * @param {object} input
 * @param {Severity} input.severity npm's severity for this entry
 * @param {boolean} input.inProd whether the package survives `npm audit --omit=dev`
 * @param {string|null} input.exceptionExpires the `expires` date of the
 *   matching entry in `dep-floor.allow.json`, or `null` when none matched
 * @param {number} input.nowMs the instant to judge the expiry against, as
 *   `Date.now()` would give it
 * @returns {{kind: Kind, scope: Scope, why: 'above-floor'|'below-floor'|'allowed'|'expired'}}
 */
export function classifyAdvisory({ severity, inProd, exceptionExpires, nowMs }) {
  const scope = inProd ? 'prod' : 'dev'
  const breachesFloor = severity === 'critical' || (severity === 'high' && inProd)

  if (!breachesFloor) return { kind: 'warning', scope, why: 'below-floor' }
  if (exceptionExpires && Date.parse(exceptionExpires) >= nowMs) {
    return { kind: 'warning', scope, why: 'allowed' }
  }
  if (exceptionExpires) return { kind: 'expired', scope, why: 'expired' }
  return { kind: 'violation', scope, why: 'above-floor' }
}

/**
 * The per-package count line, printing every severity npm counted.
 *
 * It reads `SEVERITIES` rather than a written-out list so that a severity
 * this repository has never seen cannot be silently absent from the line:
 * the test asserts the rendered line names every key of a real metadata
 * object, and a new npm severity makes that test fail rather than making the
 * line quietly incomplete.
 *
 * @param {Record<string, number>} totals `metadata.vulnerabilities` from one
 *   `npm audit --json` run
 * @returns {string} `critical=0 high=0 moderate=0 low=3 info=0 total=3`
 */
export function severityCounts(totals) {
  const parts = SEVERITIES.map((s) => `${s}=${totals[s] ?? 0}`)
  parts.push(`total=${totals.total ?? SEVERITIES.reduce((n, s) => n + (totals[s] ?? 0), 0)}`)
  return parts.join(' ')
}
