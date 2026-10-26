// The verdict `tools/secret-scan.mjs` prints, as a pure function.
//
//   import { verdict, unusable, GATE } from './secret-scan-verdict.mjs'
//
// THIRD OF THE THREE EXTRACTIONS asked for in `docs/ideas.md`, "Every gate
// exports its verdict as data, so the sweep is a program and not a table".
// Every output string is byte-identical to what the gate printed before;
// `secret-scan-verdict.test.mjs` pins them against literals.
//
// THIS IS THE ONE THAT RESISTED THE SHAPE, and the ledger entry's first step
// said that if one of the three did, the resistance is the finding. It did, in
// three distinct ways, and all three are now in the shape rather than papered
// over. Recorded here because the next gate extracted will hit at least one of
// them and the reasoning should not have to be re-derived.
//
//   1. THE VERDICT IS NOT THE LAST LINE. `check-closures.mjs` and `check.mjs`
//      print their findings and then their verdict. This gate prints the
//      summary FIRST and then one line per hit, because a reader scanning a
//      log for "0 hit(s)" should not have to scroll past the hits to find it.
//      So `position` exists. A contract that said "the last line a gate
//      prints" would have been wrong about this gate on day one, and the
//      cheapest way to discover that is to extract a gate that is already
//      right rather than to design the contract from the two that were wrong.
//
//   2. THE VERDICT IS THREE PARTS, NOT ONE. On a hit the gate prints the
//      summary, then the hits, then a blank line and two lines of handling
//      instruction. Those two lines are part of the verdict and not of the
//      findings -- they are conditional on `!ok`, they name no hit, and they
//      are the only place the owner's half of the remedy is stated -- so
//      `trailer` exists. The claim this buys is narrow and worth stating
//      narrowly: `{exitCode, line, stream}` alone cannot round-trip what this
//      gate prints, so `renderVerdict` needs `position` and `trailer` to
//      reproduce it, and `secret-scan-verdict.test.mjs` pins the five-line
//      rendering against literals. It is NOT true that MIXED_LOCI_NAMED needs
//      the trailer in order to judge this gate: every hit in one invocation
//      shares one locus (see below), so that check cannot fire here at all.
//      The enumerator reads line and trailer together because a gate is
//      ALLOWED to name a locus only in its trailer, which is a design
//      allowance proved by a synthetic gate in
//      `tools/gates/enumerate-verdicts.test.mjs` rather than a property of
//      this one.
//
//   3. EXIT 2 HAS NO FINDINGS. `fail()` fires when a history scan is asked for
//      in a shallow clone: the scanner cannot establish the facts, so there is
//      no findings array to derive anything from, and nothing about it can be
//      checked against findings. That is `derivedFrom: 'ground'`, exported as a
//      separate function because it takes different arguments, and the
//      enumerator skips the findings-derived checks for it rather than passing
//      it vacuously.
//
// WHY THE SUMMARY'S BARE `N hit(s)` IS NOT THE ACTOR DEFECT, checked rather
// than assumed. The defect in `docs/design/verdict-lines.md` §1 is a count over
// findings whose repairs belong to different people. Here `scanTree()` and
// `scanHistory()` are exclusive: one invocation yields hits that are all
// tracked working-tree files or all history blobs, never a mix, and the mode is
// named in the summary line itself. So the count cannot name the wrong actor,
// for the same reason `tools/board/check.mjs`'s bare count cannot. What differs
// between the modes is the *remedy*, and the trailer carries it.
//
// THE REDACTION RULE OUTRANKS EVERYTHING HERE. The gate's own header: never
// print, quote or copy the value, not even truncated, not even in --json. No
// function in this file takes a secret value, and `hitLine` below takes only a
// class, a location and a blob prefix. A verdict module is a formatting
// surface, which is exactly where a value leaks back in by accident.

import { LOCUS, POSITION, describeGate, verdictOf } from './gates/verdict-shape.mjs'

/**
 * @typedef {object} Hit
 * @property {string} class the credential class that matched. Never the value.
 * @property {string} where path, or path at the commit for a history scan.
 * @property {number} line line number. A location is not a value.
 * @property {string} [blob] blob sha, printed truncated to 12.
 */

/**
 * @typedef {object} ScanResult
 * @property {'tree' | 'history' | 'history-since'} mode
 * @property {string | null} since
 * @property {number} scanned
 * @property {string} unit `files` or `blobs`.
 * @property {number} classes how many credential patterns ran.
 * @property {Hit[]} hits
 * @property {number} [skipped_oversize]
 * @property {number} [skipped_unreadable]
 */

/** One per-finding line, exactly as the gate prints it. Location and class
 *  only; see the header. */
export function hitLine(hit) {
  return `  ${hit.class}  ${hit.where}:${hit.line}${hit.blob ? `  blob ${hit.blob.slice(0, 12)}` : ''}`
}

/**
 * The findings-derived verdict: exit 0 on nothing found, exit 1 on at least one
 * hit.
 *
 * @param {Hit[]} hits the findings. The caller prints `hitLine` per entry
 *   between `line` and `trailer`.
 * @param {ScanResult} seen the census. `mode`, `since` and `unit` are part of
 *   the verdict's own sentence, not decoration: they are what says which locus
 *   the hits are in.
 * @returns {import('./gates/verdict-shape.mjs').Verdict}
 */
export function verdict(hits, seen) {
  const { mode, since = null, scanned = 0, unit = 'files', classes = 0 } = seen
  const scope = since ? `${mode} ${since}..` : mode
  const skipped = seen.skipped_oversize || seen.skipped_unreadable || 0
  const line =
    `secret-scan ${scope}: ${scanned} ${unit}, ${classes} classes, ` +
    `${hits.length} hit(s)${skipped ? `, ${skipped} skipped and unscanned` : ''}.`

  if (hits.length === 0) {
    return verdictOf({
      exitCode: 0,
      cause: 'NOTHING_FOUND',
      position: POSITION.BEFORE,
      line,
    })
  }

  return verdictOf({
    exitCode: 1,
    cause: 'CREDENTIAL_SHAPED_HIT',
    position: POSITION.BEFORE,
    cites: [LOCUS.READER],
    line,
    trailer: [
      '',
      'Do not print, quote or copy the value. Record file, commit and kind,',
      "mark it urgent in the ledger, and say rotation is the owner's action.",
    ],
  })
}

/**
 * The ground verdict: the scanner could not do its job, which is never
 * reported as clean. Separate from `verdict` because it has no findings to
 * derive anything from, and the enumerator must not check it as though it did.
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
    cause: 'SCANNER_GROUND_UNUSABLE',
    position: POSITION.BEFORE,
    line: `secret-scan: cannot do its job: ${why}`,
    trailer: detail ? [`  ${detail}`] : [],
  })
}

const hit = (where = 'ursa-major/src/x.ts') => ({ class: 'aws-access-key-id', where, line: 7 })
const TREE = { mode: 'tree', scanned: 2226, unit: 'files', classes: 16 }

/** The input space. Outcomes are measured by the enumerator, never declared. */
export const GATE = describeGate({
  id: 'tools/secret-scan.mjs',
  verdict,
  loci: {
    // The reader removes the string from the file it is in. Named by the mode
    // word in the summary line, which is what says whether that file is the
    // working tree or a blob in history.
    [LOCUS.READER]: { noun: /secret-scan (tree|history)/ },
  },
  // Every hit in one invocation shares this locus, because `scanTree` and
  // `scanHistory` are exclusive: a run yields hits that are all tracked
  // working-tree files or all history blobs, never a mix. So the locus is a
  // property of the invocation and not of a hit, and the hits carry no `locus`
  // field to partition on. Declared here rather than left absent, so the
  // enumerator partitions these findings instead of reporting the actor check
  // as unmeasurable on this gate -- the difference between "one actor, checked"
  // and "no actor key, so nothing was checked" is the whole point of the
  // exercise and must not be a blank cell.
  findingsLocus: LOCUS.READER,
  probes: [
    { name: 'clean tree', findings: [], seen: TREE },
    { name: 'one hit in the tree', findings: [hit()], seen: TREE },
    {
      name: 'two hits with oversize skips',
      findings: [hit(), hit('docs/x.md')],
      seen: { ...TREE, skipped_oversize: 3 },
    },
    {
      name: 'history since a baseline',
      findings: [{ ...hit(), blob: 'deadbeefcafebabe0123' }],
      seen: {
        mode: 'history-since',
        since: 'origin/main',
        scanned: 9001,
        unit: 'blobs',
        classes: 16,
      },
    },
  ],
  /** Ground branches: driven by the enumerator, exempt from the findings
   *  checks. Declared separately so the exemption is visible rather than
   *  implied by an empty findings array. */
  groundProbes: [
    {
      name: 'shallow clone refuses a history scan',
      call: () => unusable('--history needs full history', 'run tools/ensure-full-clone.sh'),
    },
  ],
})
