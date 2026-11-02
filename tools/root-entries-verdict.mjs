// The verdict `tools/root-entries.mjs` prints, as a pure function.
//
//   import { verdict, unusable, GATE } from './root-entries-verdict.mjs'
//
// SIXTH GATE EXTRACTED under `docs/ideas.md`, "Every gate exports its verdict
// as data, so the sweep is a program and not a table". Written in this shape
// from the start rather than retrofitted, which is the first time that has
// been true, so the five enumerator properties were checks on the design and
// not a cleanup afterwards.
//
// WHAT THE GATE IS ABOUT. Every root-level dot-entry this repository has ever
// committed as run scratch -- seventeen of them, measured over every object in
// every ref on 2026-11-02 -- is a file a run wrote at its own opening, which
// is the moment it is holding its wake payload. The payload is composed by
// agents of every company in the portfolio. `.gitignore` had two defences
// against this and both were lists of names; between them they covered five
// of the seventeen, and `.ursa-run/` was still tracked on `main` six days
// after the second list was added with a comment warning about exactly this.
// So the rule is inverted: every root dot-entry is ignored, three are named
// back in, and this gate fails when the tree and that list disagree.
//
// WHY THERE ARE TWO LOCI AND NOT ONE, since that is the field this file's
// design turns on. A tracked entry outside the allowlist is COMMITTED: it is
// in `main`, every clone has it, and the repair is a commit. An entry that is
// only present in this working copy and not ignored is CLONE: no diff, no
// review, one `rm`, and it is one `git add -A` away from becoming the first
// kind. Same shape, different urgency, different person, so the verdict names
// both counts on every run rather than only the one that fired.
//
// WHY THE ALLOWLIST IS READ FROM `.gitignore` AND NOT WRITTEN HERE. This is
// `scripts/redaction-check.mjs`'s discipline, which reads the gate's patterns
// out of the workflow so that "there is nothing here to drift". The ignore
// file is the authority a `git add` actually obeys. A copy of the allowlist in
// this file would be a second authority that can agree with the first on the
// day it is written and disagree silently afterwards, and silent disagreement
// between two copies of one rule is the defect this gate exists to catch.
//
// WHY A MISSING RULE IS NOT A PASS. If the inverted rule is absent from
// `.gitignore` the gate has no allowlist to compare against. That is exit 2
// and `derivedFrom: 'ground'`, never a clean zero, for the same reason
// `tools/secret-scan.mjs --history` refuses a shallow clone: a scan that could
// not run must not be indistinguishable from a scan that found nothing.

import { LOCUS, POSITION, describeGate, verdictOf } from './gates/verdict-shape.mjs'

/**
 * @typedef {object} Entry
 * @property {string} name the root-level entry, as git names it, e.g. `.run`.
 * @property {'committed' | 'clone'} locus which of the two shapes it is.
 */

/**
 * @typedef {object} Census
 * @property {number} scanned how many root-level dot-entries were looked at,
 *   tracked and loose together. `.git` is never one of them.
 * @property {string[]} allowlist the negations read out of `.gitignore`.
 */

/** One per-finding line. A name and a repair, which is all there is to say. */
export function entryLine(entry) {
  return entry.locus === LOCUS.COMMITTED
    ? `  ${entry.name}  tracked and outside the allowlist: git rm -r --cached ${entry.name}`
    : `  ${entry.name}  present here and not ignored: rm it, or add !/${entry.name} to .gitignore`
}

/**
 * The findings-derived verdict.
 *
 * @param {Entry[]} entries
 * @param {Census} seen
 * @returns {import('./gates/verdict-shape.mjs').Verdict}
 */
export function verdict(entries, seen) {
  const { scanned = 0, allowlist = [] } = seen
  const committed = entries.filter((e) => e.locus === LOCUS.COMMITTED).length
  const loose = entries.filter((e) => e.locus === LOCUS.CLONE).length

  if (entries.length === 0) {
    return verdictOf({
      exitCode: 0,
      cause: 'ALLOWLIST_HOLDS',
      position: POSITION.BEFORE,
      line:
        `root-entries: ${scanned} root-level dot-entries, ` +
        `all of them on the ${allowlist.length}-name allowlist in .gitignore.`,
    })
  }

  return verdictOf({
    exitCode: 1,
    cause: 'OUTSIDE_ALLOWLIST',
    position: POSITION.BEFORE,
    cites: [LOCUS.COMMITTED, LOCUS.CLONE],
    line:
      `root-entries: ${entries.length} of ${scanned} root-level dot-entries are outside ` +
      `the allowlist, ${committed} committed and ${loose} loose in this clone.`,
    trailer: [
      '',
      'A committed one is in main and every clone has it. A loose one is one',
      '`git add -A` away from becoming a committed one. Neither is scratch',
      'this repository agreed to publish; see .gitignore.',
    ],
  })
}

/**
 * The ground verdict: the gate could not establish its own rule, which is
 * never reported as clean. Separate from `verdict` because there are no
 * findings to derive anything from.
 *
 * @param {string} why
 * @param {string} [detail]
 * @returns {import('./gates/verdict-shape.mjs').Verdict}
 */
export function unusable(why, detail) {
  return verdictOf({
    exitCode: 2,
    stream: 'err',
    derivedFrom: 'ground',
    cause: 'RULE_GROUND_UNUSABLE',
    position: POSITION.BEFORE,
    line: `root-entries: cannot do its job: ${why}`,
    trailer: detail ? [`  ${detail}`] : [],
  })
}

const ALLOWED = ['.gitignore', '.gitattributes', '.github']
const CENSUS = { scanned: 4, allowlist: ALLOWED }

/** The input space. Outcomes are measured by the enumerator, never declared. */
export const GATE = describeGate({
  id: 'tools/root-entries.mjs',
  verdict,
  loci: {
    // Named by the word `committed` in the verdict line, which is the word the
    // trailer then attaches the repair to.
    [LOCUS.COMMITTED]: { noun: /committed/ },
    // Named by `loose in this clone`, deliberately a phrase and not the bare
    // word `clone`: `.gitignore` and `every clone` both appear in the trailer,
    // so a one-word pattern would match prose that is not about this locus and
    // MIXED_LOCI_NAMED would pass on a verdict that never named it.
    [LOCUS.CLONE]: { noun: /loose in this clone/ },
  },
  probes: [
    { name: 'only the allowlist is present', findings: [], seen: { scanned: 3, allowlist: ALLOWED } },
    {
      name: 'one committed scratch directory, which is what main carried',
      findings: [{ name: '.ursa-run', locus: LOCUS.COMMITTED }],
      seen: CENSUS,
    },
    {
      name: 'one loose placeholder, caught before it is staged',
      findings: [{ name: '.security-run-2026-11-02', locus: LOCUS.CLONE }],
      seen: CENSUS,
    },
    {
      name: 'both shapes at once, which is what MIXED_LOCI_NAMED is for',
      findings: [
        { name: '.ursa-run', locus: LOCUS.COMMITTED },
        { name: '.exo-window-75-opening', locus: LOCUS.CLONE },
      ],
      seen: { scanned: 5, allowlist: ALLOWED },
    },
  ],
  /** Ground branches: exempt from the findings checks, declared separately so
   *  the exemption is visible rather than implied by an empty array. */
  groundProbes: [
    {
      name: 'the inverted rule is absent from .gitignore',
      call: () =>
        unusable(
          'no `/.*` line in .gitignore, so there is no allowlist to compare the tree against',
          'the rule and the reasoning for it are at the end of .gitignore',
        ),
    },
    {
      name: 'not a git repository',
      call: () => unusable('git could not name a repository root here'),
    },
  ],
})
