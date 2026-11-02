// The production closure of an npm lockfile, computed as a pure function, plus
// the one line `tools/registers/check-closure.mjs` prints last.
//
//   import { prodClosure, compare, verdict, GATE } from './closure-verdict.mjs'
//
// WHAT A PRODUCTION CLOSURE IS, defined here because the phrase is not
// self-explanatory. It is the set of npm packages that a production install of
// a workspace puts on disk: what `npm ci --omit=dev` installs, and therefore
// what reaches a deployed surface. Its complement is the development-only set,
// which a test runner and a scaffolding tool live in and a visitor to
// ursa-minor.com never receives. The two sets are not the same size and they
// are not the same risk, and this repository has been treating them as one
// number.
//
// WHY THIS GATE EXISTS, and it is one measured defect rather than a class
// someone imagined. `docs/ideas.md` carries an entry of 2026-10-26, status
// `urgent`, headed "Nine advisories in the site's dependency tree, and no seat
// owns the clock on them". Its own first step is a question: are `shadcn` and
// the MCP SDK development dependencies that never ship? Measured on
// 2026-11-01 against the committed `ursa-minor/package-lock.json`, the answer
// is yes, for all nine and not only those two: every package named in that
// entry carries `"dev": true` in the lockfile, and `npm audit --omit=dev` in
// `ursa-minor` returns zero advisories at any severity over a production tree
// of 33 packages. So the entry's six-day-old question had an answer sitting in
// a committed file the whole time, and reaching it took one read.
//
// THE DEFECT IS NOT THE ADVISORIES. It is that nothing in this repository can
// answer "does this package ship?" without the network. `scripts/dep-floor.mjs`
// already enforces the decision the entry asks for -- zero critical anywhere,
// zero high in the production tree, development-only high and moderate
// reported and not failing -- and its header has said so since 2026-09-27. But
// it establishes the production tree by running `npm audit --omit=dev`, which
// needs a registry to answer. So the scope half of a security decision, which
// is a property of a committed file, is reachable only from a host with
// network. A seat in an offline sandbox cannot check it, a reviewer cannot see
// it in a diff, and nothing pins it. That is what put a seat on 2026-10-26 in
// the position of measuring nine advisories by hand and filing the scope
// question as urgent.
//
// WHY THE SURFACE IS PINNED AND THE ADVISORIES ARE NOT. An advisory list is
// large, moves daily, and is owned by a registry: pinning it would be a
// baseline that is stale the morning after it is written. A production closure
// is small (308 packages across this repository's three lockfiles), moves only
// when someone edits a dependency, and is wholly determined by committed
// files. So the pinnable thing gets pinned. A devDependency that starts
// shipping is invisible today until some later `npm audit` happens to find an
// advisory inside it; against a pinned closure it is a failing gate on the
// pull request that moved it.
//
// WHERE THE SCOPE FACT COMES FROM, stated plainly because the whole gate rests
// on it. The `dev` and `devOptional` fields npm writes into a lockfile v3
// entry. This module reads them; it does not recompute them. That is a
// deliberate limit and not an oversight: npm's own resolver sets those fields
// and `npm audit --omit=dev` reads the same ones, so reading them makes this
// gate agree with the tool whose answer the deployed install actually obeys.
// An independent traversal of the dependency edges was prototyped first and
// disagreed with the flags on three packages in each of two workspaces, every
// disagreement sitting in optional-peer-edge semantics. Shipping that would
// have been a measurement whose instrument is wrong, which is the one defect
// this repository's gates exist to avoid. The disagreement is in `docs/ideas.md`
// as its own entry, with the numbers.
//
// WHY THE KEY IS `name@version` AND NOT THE LOCKFILE PATH. npm hoists, so the
// same package moves between `node_modules/x` and `node_modules/a/node_modules/x`
// when an unrelated dependency changes, and a path-keyed baseline would churn
// on a diff that ships identical bytes. Two entries at the same name and
// version are the same bytes however many paths they sit at, so they are one
// member of the closure. The path is kept on the finding for the reader and is
// not part of the key.

import { LOCUS, POSITION, describeGate, verdictOf } from '../gates/verdict-shape.mjs'

/** The only lockfile format whose scope fields this module claims to read. */
export const SUPPORTED_LOCKFILE_VERSION = 3

/** Findings that mean new bytes reach a deployed surface. */
const GROWTH = new Set(['CLOSURE_ADDED', 'CLOSURE_VERSION_CHANGED'])

/**
 * @typedef {object} Finding
 * @property {'CLOSURE_ADDED' | 'CLOSURE_VERSION_CHANGED' | 'CLOSURE_REMOVED'
 *   | 'WORKSPACE_UNPINNED' | 'BASELINE_ORPHANED'} rule
 * @property {string} workspace the directory, repository-relative.
 * @property {string} message the line the caller already printed.
 */

/**
 * The package name a lockfile path denotes. The last `node_modules/` segment,
 * which is the whole tail rather than the next path component, because a
 * scoped package spends a slash on its scope: the tail of
 * `node_modules/a/node_modules/@scope/pkg` is `@scope/pkg` and not `@scope`.
 *
 * @param {string} path a key of `lock.packages`.
 * @returns {string | null} null when the path names no package, which is the
 *   root entry `""` and anything a future npm puts outside node_modules.
 */
export function packageNameOf(path) {
  const at = path.lastIndexOf('node_modules/')
  if (at === -1) return null
  const name = path.slice(at + 'node_modules/'.length)
  return name === '' ? null : name
}

/**
 * Validate a parsed lockfile before any scope claim is read off it, and return
 * the fault as data rather than throwing, because the caller exits at module
 * scope. Same shape as `manifestFault()` in ./id-verdict.mjs and
 * `baselineFault()` in ../secret-scan-baseline.mjs.
 *
 * @param {unknown} lock the parsed JSON, or an Error when it did not parse.
 * @param {string} where the path, for the message.
 * @returns {{code: string, detail: string} | null} null when usable.
 */
export function lockFault(lock, where) {
  const fault = (code, detail) => ({ code, detail })

  if (lock instanceof Error) return fault('LOCKFILE_UNPARSEABLE', `${where}: ${lock.message}`)
  if (lock === undefined || lock === null || typeof lock !== 'object' || Array.isArray(lock)) {
    return fault('LOCKFILE_NOT_AN_OBJECT', `${where} top level is ${Array.isArray(lock) ? 'an array' : typeof lock}`)
  }
  if (lock.lockfileVersion !== SUPPORTED_LOCKFILE_VERSION) {
    // Refusing is the point. v1 has no `packages` map at all and v2 carries
    // both shapes with the legacy half authoritative for some clients, so a
    // scope field read out of either would be a guess wearing a number.
    return fault(
      'LOCKFILE_VERSION_UNSUPPORTED',
      `${where} is lockfileVersion ${JSON.stringify(lock.lockfileVersion)}; this gate reads ${SUPPORTED_LOCKFILE_VERSION} only, because that is the only format whose dev/devOptional fields it has been checked against`,
    )
  }
  if (typeof lock.packages !== 'object' || lock.packages === null || Array.isArray(lock.packages)) {
    return fault('LOCKFILE_NO_PACKAGES', `${where} has no \`packages\` object`)
  }
  if (lock.packages[''] === undefined) {
    return fault('LOCKFILE_NO_ROOT', `${where} has no root entry at the empty-string key, so there is nothing to take a closure from`)
  }

  for (const [path, entry] of Object.entries(lock.packages)) {
    if (path === '') continue
    if (entry?.link === true) {
      // A linked entry is a workspace symlink whose real dependencies live
      // under another root key. This repository has none (measured: three
      // lockfiles, zero `link` entries, zero workspace directories), and
      // guessing at the semantics of one is how an instrument goes wrong
      // quietly. When a workspace arrives, this fault is the prompt to extend
      // the module deliberately.
      return fault('LOCKFILE_HAS_LINKED_ENTRY', `${where} entry ${path} is a workspace link, a shape this gate has never been checked against`)
    }
    if (entry?.dev !== true && entry?.devOptional !== true) {
      if (typeof entry?.version !== 'string' || entry.version === '') {
        return fault('LOCKFILE_ENTRY_NO_VERSION', `${where} entry ${path} is in the production closure and carries no \`version\`, so it cannot be pinned`)
      }
      if (packageNameOf(path) === null) {
        return fault('LOCKFILE_ENTRY_NOT_A_PACKAGE', `${where} entry ${path} is in the production closure and is not under node_modules, so this gate cannot name it`)
      }
    }
  }
  return null
}

/**
 * The production closure of one validated lockfile.
 *
 * @param {object} lock a lockfile v3 object that `lockFault` returned null for.
 * @returns {{members: string[], paths: Record<string, string[]>, devOnly: number}}
 *   `members` is the sorted, deduplicated `name@version` set -- the pinnable
 *   surface. `paths` maps each member to every lockfile path it sits at, for
 *   the reader. `devOnly` is how many entries were excluded, reported so a
 *   clean line can state the ratio it is claiming.
 */
export function prodClosure(lock) {
  const paths = {}
  let devOnly = 0
  for (const [path, entry] of Object.entries(lock.packages)) {
    if (path === '') continue
    if (entry.dev === true || entry.devOptional === true) {
      devOnly += 1
      continue
    }
    const member = `${packageNameOf(path)}@${entry.version}`
    ;(paths[member] ??= []).push(path)
  }
  const members = Object.keys(paths).sort()
  for (const member of members) paths[member].sort()
  return { members, paths, devOnly }
}

/**
 * Validate the committed baseline. Separate fault vocabulary from `lockFault`
 * because the repair is in a different file and `--write` fixes one of them
 * and none of the other.
 *
 * @param {unknown} baseline the parsed JSON, or undefined when absent, or an
 *   Error when it did not parse.
 * @returns {{code: string, detail: string} | null} null when usable.
 */
export function baselineFault(baseline) {
  const fault = (code, detail) => ({ code, detail })

  if (baseline === undefined || baseline === null) {
    return fault('BASELINE_ABSENT', 'no file at tools/registers/prod-closure.json; `node tools/registers/check-closure.mjs --write` creates it')
  }
  if (baseline instanceof Error) return fault('BASELINE_UNPARSEABLE', baseline.message)
  if (typeof baseline !== 'object' || Array.isArray(baseline)) {
    return fault('BASELINE_NOT_AN_OBJECT', `top level is ${Array.isArray(baseline) ? 'an array' : typeof baseline}`)
  }
  const workspaces = baseline.workspaces
  if (typeof workspaces !== 'object' || workspaces === null || Array.isArray(workspaces)) {
    return fault('BASELINE_NO_WORKSPACES', '`workspaces` is absent or is not an object keyed by directory')
  }
  if (Object.keys(workspaces).length === 0) {
    // Zero pinned workspaces is not a clean repository. It is a gate that
    // checks nothing while printing that it is clean, which is the one output
    // this file must never produce. ./id-verdict.mjs refuses an empty manifest
    // for the same reason.
    return fault('BASELINE_EMPTY', '`workspaces` is an empty object, so this gate would check nothing and exit 0')
  }
  for (const [dir, pinned] of Object.entries(workspaces)) {
    if (!Array.isArray(pinned?.members)) {
      return fault('BASELINE_WORKSPACE_NO_MEMBERS', `workspaces[${JSON.stringify(dir)}] has no \`members\` array`)
    }
    for (const [i, member] of pinned.members.entries()) {
      if (typeof member !== 'string' || !/^.+@[^@]+$/.test(member)) {
        return fault(
          'BASELINE_MEMBER_MALFORMED',
          `workspaces[${JSON.stringify(dir)}].members[${i}] is ${JSON.stringify(member)}; expected a name@version string`,
        )
      }
    }
    const sorted = [...pinned.members].sort()
    if (sorted.join('\u0000') !== pinned.members.join('\u0000')) {
      // Sorted order is what makes the diff of a dependency change readable,
      // which is the entire review mechanism this baseline provides. An
      // unsorted file would still compare equal as a set and would make every
      // future diff unreadable, so it is refused rather than tolerated.
      return fault('BASELINE_MEMBERS_UNSORTED', `workspaces[${JSON.stringify(dir)}].members is not in sorted order, so a dependency change would not read as a legible diff`)
    }
    if (new Set(pinned.members).size !== pinned.members.length) {
      return fault('BASELINE_MEMBERS_DUPLICATED', `workspaces[${JSON.stringify(dir)}].members lists the same name@version more than once`)
    }
  }
  return null
}

/**
 * Compare measured closures against the baseline.
 *
 * @param {Record<string, {members: string[], paths?: Record<string, string[]>}>} measured
 *   keyed by workspace directory, repository-relative.
 * @param {{workspaces: Record<string, {members: string[]}>}} baseline
 * @returns {Finding[]}
 */
export function compare(measured, baseline) {
  const findings = []
  const note = (rule, workspace, message) => findings.push({ rule, workspace, message })

  for (const [dir, closure] of Object.entries(measured)) {
    const pinned = baseline.workspaces[dir]
    if (pinned === undefined) {
      note(
        'WORKSPACE_UNPINNED',
        dir,
        `${dir}: a committed package-lock.json with ${closure.members.length} package(s) in its production closure and no entry in the baseline, so nothing reviews what it ships`,
      )
      continue
    }
    const was = new Set(pinned.members)
    const now = new Set(closure.members)

    // A version change is reported as its own rule and not as one addition
    // plus one removal, because the two readings ask for different work: an
    // upgrade of a package already shipping is reviewed against a changelog,
    // while a package arriving is reviewed against whether it should be here
    // at all.
    const nameOf = (m) => m.slice(0, m.lastIndexOf('@'))
    const versionsWas = new Map()
    for (const m of pinned.members) versionsWas.set(nameOf(m), m)
    const versionsNow = new Map()
    for (const m of closure.members) versionsNow.set(nameOf(m), m)

    for (const member of closure.members) {
      if (was.has(member)) continue
      const name = nameOf(member)
      const before = versionsWas.get(name)
      if (before !== undefined && !now.has(before)) {
        note('CLOSURE_VERSION_CHANGED', dir, `${dir}: ${before} in the baseline now ships as ${member}, so deployed bytes changed under a pin that was reviewed`)
      } else {
        note('CLOSURE_ADDED', dir, `${dir}: ${member} is in the production closure and is not in the baseline, so it reaches a deployed surface with no review behind it`)
      }
    }
    for (const member of pinned.members) {
      if (now.has(member)) continue
      const name = nameOf(member)
      const after = versionsNow.get(name)
      if (after !== undefined && !was.has(after)) continue // already reported as a version change
      note('CLOSURE_REMOVED', dir, `${dir}: ${member} is in the baseline and no longer in the production closure, so the baseline over-states what ships`)
    }
  }

  for (const dir of Object.keys(baseline.workspaces)) {
    if (measured[dir] === undefined) {
      note('BASELINE_ORPHANED', dir, `${dir}: the baseline pins a production closure for a directory with no committed package-lock.json, so that pin stands for nothing`)
    }
  }
  return findings
}

/**
 * @param {Finding[]} findings
 * @param {{workspaces?: number, packages?: number, devOnly?: number}} seen the
 *   census, for the clean line.
 * @returns {import('../gates/verdict-shape.mjs').Verdict}
 */
export function verdict(findings, seen = {}) {
  const { workspaces = 0, packages = 0, devOnly = 0 } = seen
  const counted =
    `${packages} package(s) in the production closure of ${workspaces} workspace(s), ` +
    `with ${devOnly} development-only entry(ies) excluded`

  const growth = findings.filter((f) => GROWTH.has(f.rule))

  if (findings.length === 0) {
    return verdictOf({
      exitCode: 0,
      cause: 'ALL_PINNED',
      line:
        `Production closure: ${counted}, every member pinned in the committed baseline at ` +
        'tools/registers/prod-closure.json. Exit 0.',
    })
  }

  if (growth.length > 0) {
    return verdictOf({
      exitCode: 1,
      cause: 'SURFACE_GREW',
      cites: [LOCUS.COMMITTED],
      line:
        `Production closure: ${counted}, and ${growth.length} of ${findings.length} finding(s) above are ` +
        'bytes newly reaching a deployed surface that the committed baseline does not pin. Every ' +
        'lockfile read here is tracked, so this is a diff a reviewer can see. Review the dependency ' +
        'change, then re-pin with `node tools/registers/check-closure.mjs --write`. Exit 1.',
    })
  }

  return verdictOf({
    exitCode: 1,
    cause: 'REGISTER_STALE',
    cites: [LOCUS.COMMITTED],
    line:
      `Production closure: ${counted}, nothing new shipping, and ${findings.length} finding(s) above ` +
      'where the committed baseline no longer describes the committed lockfiles. Re-pin with ' +
      '`node tools/registers/check-closure.mjs --write` and review the diff. Exit 1.',
  })
}

/**
 * The exit-2 ground branch for a baseline this gate cannot trust. Takes its
 * named cause from the fault's own code rather than inventing a second
 * vocabulary for the same condition, the shape `baselineUnusable(fault)` took
 * in ../secret-scan-verdict.mjs.
 *
 * @param {{code: string, detail: string}} fault
 * @returns {import('../gates/verdict-shape.mjs').Verdict}
 */
export function baselineUnusable(fault) {
  return verdictOf({
    exitCode: 2,
    cause: fault.code,
    derivedFrom: 'ground',
    stream: 'err',
    position: POSITION.BEFORE,
    line: `Production closure: the committed baseline is unusable, so nothing was checked (${fault.code}: ${fault.detail}). Exit 2.`,
    quoted: [fault.detail],
  })
}

/**
 * The other exit-2 ground branch: a lockfile this gate cannot read a scope off.
 * Separate from `baselineUnusable` because `--write` repairs that one and
 * cannot repair this one -- a lockfile is npm's output, so the repair is an
 * `npm install` or a version this gate has been extended to read.
 *
 * @param {{code: string, detail: string}} fault
 * @returns {import('../gates/verdict-shape.mjs').Verdict}
 */
export function lockUnreadable(fault) {
  return verdictOf({
    exitCode: 2,
    cause: fault.code,
    derivedFrom: 'ground',
    stream: 'err',
    position: POSITION.BEFORE,
    line: `Production closure: a committed lockfile could not be read as a scope authority, so no answer was reached (${fault.code}: ${fault.detail}). Exit 2.`,
    quoted: [fault.detail],
  })
}

/**
 * The third exit-2 ground branch: the repository's committed lockfiles could
 * not be enumerated at all. Separate again, because the repair is neither a
 * tracked file nor npm: it is the checkout.
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
    line: `Production closure: the set of committed lockfiles could not be established, so no answer was reached (${fault.code}: ${fault.detail}). Exit 2.`,
    quoted: [fault.detail],
  })
}

const f = (rule, workspace = 'ursa-minor') => ({ rule, workspace, message: 'x' })

/** The input space. Outcomes are measured by the enumerator, never declared. */
export const GATE = describeGate({
  id: 'tools/registers/check-closure.mjs',
  verdict,
  // ONE LOCUS, for the reason tools/gates/enumerate-verdicts.mjs records for
  // its own: every finding here is a disagreement between two committed files,
  // repaired by whoever is reading the output with one command and one commit,
  // so a count cannot send the wrong person anywhere. The dependency-floor
  // gate's allowlist is the owner's and this baseline deliberately is not: a
  // closure is a measurement of what ships and not a risk anyone accepted.
  findingsLocus: LOCUS.COMMITTED,
  loci: { [LOCUS.COMMITTED]: { noun: /committed/ } },
  probes: [
    { name: 'nothing drifted', findings: [], seen: { workspaces: 3, packages: 308, devOnly: 745 } },
    { name: 'a package newly ships', findings: [f('CLOSURE_ADDED')], seen: { workspaces: 3, packages: 308, devOnly: 745 } },
    { name: 'a shipping package changed version', findings: [f('CLOSURE_VERSION_CHANGED')], seen: { workspaces: 3, packages: 308, devOnly: 745 } },
    { name: 'the baseline over-states what ships', findings: [f('CLOSURE_REMOVED')], seen: { workspaces: 3, packages: 308, devOnly: 745 } },
    { name: 'a lockfile nothing pins', findings: [f('WORKSPACE_UNPINNED', 'ursa-major/overlay')], seen: { workspaces: 3, packages: 308, devOnly: 745 } },
    { name: 'a pin for a workspace that is gone', findings: [f('BASELINE_ORPHANED', 'ursa-legacy')], seen: { workspaces: 3, packages: 308, devOnly: 745 } },
    {
      name: 'growth and staleness together',
      findings: [f('CLOSURE_ADDED'), f('CLOSURE_REMOVED'), f('BASELINE_ORPHANED', 'ursa-legacy')],
      seen: { workspaces: 3, packages: 308, devOnly: 745 },
    },
  ],
})
