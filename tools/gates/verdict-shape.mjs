// The shape a gate's verdict has to have before an enumerator can measure it,
// and the four properties an enumerator can then check on every gate at once.
//
//   import { LOCUS, describeGate, renderVerdict } from '../gates/verdict-shape.mjs'
//
// WHY THIS FILE EXISTS, and why it is a shape rather than a base class. The
// defect class behind it is written up in `docs/design/verdict-lines.md` §1: a
// gate printed `N violation(s)` at exit 1 over a list whose entries had
// different repairs and different owners, so the one sentence a reader acts on
// named neither of them. Two gates were repaired there by hand. The sweep that
// found them is a table in that document's §4, built by grepping for
// `process.exit([1-9])`, and the same branch's repair broke that grep:
// `check-attributes.mjs` now ends in `process.exit(result.exitCode)`, so a text
// search counts one failing branch where the gate has two. A sweep keyed on the
// source text cannot be re-run to prove the class stays fixed.
//
// THE KEY IS THE BRANCH, NOT THE FILE, and that is the whole reason this is
// shaped the way it is. A file-keyed sweep stops at the first finding per file.
// A seat-keyed sweep is worse: Ursa/skill reported on 2026-10-26 that a
// security sweep keyed on its seat called its live branch red using six real red
// runs that belonged to a different branch, one whose pull request was already
// closed. The runs were real and the count was exact and the verdict was about
// the wrong unit. So the unit here is the verdict branch: one probe in, one
// named cause out, and the enumerator reports per cause.
//
// WHAT A GATE DECLARES AND WHAT IT DOES NOT. A gate declares its INPUT space:
// the synthetic finding sets to drive its verdict with. It never declares its
// own outcomes. The enumerator calls `verdict()` and reports what came back, so
// a gate cannot pass by asserting a branch it does not have. This is the same
// discipline as `tools/board/read-filters.mjs`, which decides a parameter is
// honoured by sending an impossible value rather than by reading a schema.
//
// `derivedFrom` IS LOAD-BEARING. Two different things exit non-zero. A
// FINDINGS verdict says "the thing I checked is defective"; its exit code and
// its numbers are a function of the findings array alone. A GROUND verdict says
// "I could not establish the facts" and has no findings at all -- a shallow
// clone for `tools/secret-scan.mjs --history`, an absent driver for
// `check-attributes.mjs --clone`. Only FINDINGS verdicts can be checked against
// their findings, so the enumerator has to know which it is looking at rather
// than inferring it from the exit code. `docs/ideas.md` carries the separate
// proposal to write the exit-code contract down; this field is what lets the
// enumerator work before that lands.

/** Who holds the repair. A gate uses the subset that applies to it. */
export const LOCUS = {
  /** The reader of the output repairs it, today, by editing a tracked file. */
  READER: 'reader',
  /** Committed and wrong, so every checkout and CI has it too. */
  COMMITTED: 'committed',
  /** True of one working copy only; no diff, no review, one command. */
  CLONE: 'clone',
  /** A seat may repair it without asking. */
  SEAT: 'seat',
  /** Reserved to the owner; a seat must not touch it. */
  OWNER: 'owner',
}

/** Where the verdict's own text sits relative to the per-finding lines. */
export const POSITION = { BEFORE: 'before', AFTER: 'after' }

/**
 * @typedef {object} Verdict
 * @property {0 | 1 | 2} exitCode
 * @property {'out' | 'err'} stream which handle the gate actually writes to.
 *   Recorded rather than normalised: these four gates disagree today and the
 *   disagreement is a finding, not something for this file to paper over.
 * @property {string} line the one sentence a reader quotes as the verdict.
 * @property {'before' | 'after'} position where `line` is printed relative to
 *   the per-finding lines. `check-closures.mjs` prints it last;
 *   `tools/secret-scan.mjs` prints it first and then the hits. A contract with
 *   only "the last line" in it cannot hold the second one.
 * @property {string[]} trailer further lines after the findings, if any.
 * @property {'findings' | 'ground'} derivedFrom see the header.
 * @property {string} cause the single named condition this branch is for. One
 *   named cause per condition: three disjoint conditions behind one sentence is
 *   the same defect as one gate reporting two faults at a single exit code.
 * @property {string[]} cites the loci whose counts this line is allowed to
 *   quote. Used by the COUNTS_DERIVED check.
 */

/**
 * Build a verdict, filling the defaults so each gate's own module states only
 * what is unusual about it.
 *
 * @param {Partial<Verdict> & {exitCode: 0|1|2, line: string, cause: string}} v
 * @returns {Verdict}
 */
export function verdictOf(v) {
  return {
    stream: 'out',
    position: POSITION.AFTER,
    trailer: [],
    derivedFrom: 'findings',
    cites: [],
    ...v,
  }
}

/**
 * The gate descriptor an enumerator consumes.
 *
 * @typedef {object} GateSpec
 * @property {string} id the path, as it is named in the repository.
 * @property {(findings: any[], seen: object) => Verdict} verdict the pure
 *   function under test.
 * @property {Record<string, {noun: RegExp}>} loci every locus this gate's
 *   findings can carry, with the pattern that proves the line names it. The
 *   pattern is how MIXED_LOCI_NAMED is checked, so it has to match the gate's
 *   real prose and not a word someone wishes the gate used.
 * @property {string} [findingsLocus] set when every finding in one invocation
 *   shares a locus determined by the invocation rather than by the finding, so
 *   the findings carry no locus field. Declaring it is how a gate gets its
 *   actor check run instead of reported unmeasurable.
 * @property {Array<{name: string, findings: any[], seen?: object}>} probes the
 *   input space. Outcomes are measured, never declared.
 */

/**
 * Render a verdict to the exact lines the gate prints, findings included, so a
 * test can assert on output without spawning the CLI.
 *
 * @param {Verdict} v
 * @param {string[]} findingLines what the caller prints per finding.
 * @returns {string[]}
 */
export function renderVerdict(v, findingLines = []) {
  return v.position === POSITION.BEFORE
    ? [v.line, ...findingLines, ...v.trailer]
    : [...findingLines, v.line, ...v.trailer]
}

/**
 * @param {GateSpec} spec
 * @returns {GateSpec} the same spec, having checked it is one. A gate that
 *   declares a locus with no naming pattern would silently pass
 *   MIXED_LOCI_NAMED, which is the check most worth not weakening by accident.
 */
export function describeGate(spec) {
  for (const key of ['id', 'verdict', 'loci', 'probes']) {
    if (spec[key] === undefined) throw new Error(`gate spec is missing ${key}`)
  }
  for (const [name, def] of Object.entries(spec.loci)) {
    if (!(def?.noun instanceof RegExp)) {
      throw new Error(`gate ${spec.id}: locus ${name} has no noun pattern`)
    }
  }
  if (spec.probes.length === 0) throw new Error(`gate ${spec.id}: no probes`)
  if (spec.findingsLocus !== undefined && !(spec.findingsLocus in spec.loci)) {
    throw new Error(`gate ${spec.id}: findingsLocus ${spec.findingsLocus} is not one of its loci`)
  }
  return spec
}
