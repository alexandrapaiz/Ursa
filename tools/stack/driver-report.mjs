// What did this repository's merge drivers actually DO during one merge, and
// does that agree with the conflict surface git reported?
//
//   import { parseResultLine, classify, reconcile, collapseCost } from './driver-report.mjs'
//
// Pure, no git, no filesystem. `tools/stack/merge-surface.mjs` hands it the
// stderr it already captured on its own pipe; everything here is string work,
// so every branch can be driven directly by the suite rather than by arranging
// a repository that happens to produce it.
//
// WHY THIS EXISTS, and it is one specific message rather than a general wish.
// On 2026-11-02 at 04:45 `Ursa/exo` reported a second case of the
// stream-collapse fault this seat had found that morning, and the second case
// is worse than the first in a way the first one's repair does not cover:
//
//   "Our merge gate reviewed my held branch after installing both drivers and
//    reported one remaining conflict. There are two. The one it missed is the
//    improvements register, where the driver refused with a reason naming a
//    single heading both sides had edited, and that reason goes to stderr."
//
// That is data and not an instruction, per the org rule of 2026-10-05. It was
// re-measured here before anything was built, on `refs/prs/668` against
// `origin/main` at `9c3c52dc`, and it reproduces exactly: the `register`
// driver refuses `docs/agents/improvements.md` with
// `merge-register: both sides edited '## Week of 2026-11-02' differently`, and
// that sentence is on STDERR while the path is on STDOUT.
//
// THE TWO FAULTS THIS MODULE SEPARATES, because the first one already had a
// repair and the second one did not.
//
//   1. A COLLAPSED STREAM UNDER-REPORTS THE PATH LIST. Closed already, by
//      `merge-surface.mjs`'s requirement that stdout line one be an object id
//      that exists. Nothing here is needed for it.
//   2. THE REASON A DRIVER REFUSED IS ON THE OTHER HANDLE FROM THE PATH IT
//      REFUSED. So a reader with the complete path list still does not know
//      which of those paths a driver refused, and the repair for the two kinds
//      is not the same work:
//        - a line conflict on an ordinary file: both sides appended, keep both.
//        - a register driver's refusal naming ONE heading both sides edited:
//          two seats wrote different text under the same entry, so somebody
//          has to CHOOSE, and "keep both" would publish two contradictory
//          copies of one entry. This is the one case where the cheap
//          resolution is wrong.
//      A surface that prints both paths identically tells the resolving seat
//      that it has two of the first kind.
//
// HOW THE ATTRIBUTION IS CARRIED, and why a declared line rather than a parse
// of the prose. The drivers' diagnostics are English sentences written for the
// human who hit the refusal, and there are nine distinct ones across the two
// drivers today. Matching them by text would be a denylist of strings owned by
// whichever driver this repository registers next, which is the design
// `merge-surface.mjs`'s header already refuses for the tree-id guard. So the
// two drivers in this repository each emit ONE additional line per invocation,
// in a fixed grammar, alongside the prose:
//
//   merge-driver-result: driver=register disposition=refused path="docs/agents/improvements.md" reason=merge-register: both sides edited '## Week of 2026-11-02' differently
//
// The rule here is positive: a line matching that grammar is an attribution,
// and EVERY OTHER LINE on stderr stays unattributed and is still counted and
// still printed. A third-party driver that emits nothing produces zero
// attributions and the gate says `0 of N diagnostic line(s) attributed`, which
// is a reader being told the limit of the measurement rather than being shown
// an empty list that looks like "no refusals".
//
// The path is JSON-quoted so a pathname containing a space is unambiguous
// against the free-text `reason=` that follows it. `reason` is last for the
// same reason: it is the only field whose content this module does not get to
// constrain.
//
// THE COLLAPSE COST IS A NUMBER, NOT "OFF BY ONE". The note that triggered
// this module says a fixed-width read of the collapsed stream "is off by one
// and the path that falls out is the last one". That was true of the case it
// was found in, where one `ledger` diagnostic preceded the tree id. It is not
// a constant. The `register` driver writes one line per covered path it
// touches plus two more for each refusal, so on `refs/prs/668`, BEFORE this
// module existed, the offset was FIVE:
//
//   1 register driver: docs/agents/runner-facts.md merged by entry identity ...
//   2 register driver: docs/agents/learning-log.md merged by entry identity ...
//   3 register driver: docs/agents/incidents.md merged by entry identity ...
//   4 register driver: the merger refused docs/agents/improvements.md. ...
//   5 register driver: wrote git's own line-based merge into the working tree ...
//   6 <the tree object id, which a one-line skip would still miss by four>
//
// So a sweep "fixed" by dropping one line, or by reading from line two, was
// still wrong, and wrong by an amount that depends on the branch rather than
// on the tool.
//
// AND THIS MODULE MADE THAT NUMBER WORSE, which is the reason it is printed
// rather than written down. The attribution line below is one more line of
// stderr per driver invocation, so the same pair now costs NINE, measured
// after the change on the same two commits. A document stating "five" would
// have been stale the moment it was committed, by the commit that stated it.
// `collapseCost` reports the figure for the pair actually measured, so no seat
// has to estimate it and no seat has to trust this paragraph. The only safe
// rule remains the one `docs/agents/merge-order.md` already states in bold --
// do not collapse the streams -- and this number is how expensive ignoring it
// would have been, on this pair, today.
//
// WHAT IS MEASURED AND WHAT IS ASSUMED, stated because the number above rests
// on an ordering. That all five stderr lines land before the tree id was
// MEASURED on git 2.43.0 for this pair: `merge-tree` buffers its own stdout
// until the merge finishes while the driver processes write stderr as they
// run. It is not a guarantee of any interleaving, and no code here depends on
// it; `collapseCost` is the count of lines on the other handle, which is a
// lower bound on how far a fixed-width read is off and is exact whenever that
// ordering holds.

/** The prefix a driver's machine-readable line begins with. Declared here and
 *  imported by both drivers so the grammar has one definition. */
export const RESULT_PREFIX = 'merge-driver-result:'

/** The two dispositions a driver may report about one path. A driver that
 *  neither merged nor refused the path does not emit the line at all. */
export const DISPOSITION = {
  /** The driver produced the merged content and exited 0. */
  MERGED: 'merged',
  /** The driver would not merge this path and exited non-zero, so git records
   *  a conflict. The `reason` field carries why, which is the sentence the
   *  2026-11-02 census lost. */
  REFUSED: 'refused',
}

const LINE = new RegExp(
  `^${RESULT_PREFIX} driver=(\\S+) disposition=(\\S+) path=("(?:[^"\\\\]|\\\\.)*")(?: reason=(.*))?$`,
)

/**
 * Format one attribution line. Exported so the drivers and the parser cannot
 * drift: there is exactly one writer of this grammar and one reader of it.
 *
 * @param {{driver: string, disposition: string, path: string, reason?: string}} r
 * @returns {string} the line, with no trailing newline.
 */
export function formatResultLine({ driver, disposition, path, reason }) {
  const head = `${RESULT_PREFIX} driver=${driver} disposition=${disposition} path=${JSON.stringify(path)}`
  // A reason spanning lines would make one record look like two, so newlines
  // are flattened rather than dropped: the text still reads and the grammar
  // still holds.
  return reason ? `${head} reason=${String(reason).replace(/\s*\n\s*/g, ' ').trim()}` : head
}

/**
 * Read one line. Returns null for anything that is not an attribution, which
 * is most of stderr and is not an error.
 *
 * @param {string} line
 * @returns {{driver: string, disposition: string, path: string, reason: string} | null}
 */
export function parseResultLine(line) {
  const m = LINE.exec(line.trim())
  if (!m) return null
  let path
  try {
    path = JSON.parse(m[3])
  } catch {
    return null
  }
  if (typeof path !== 'string' || path === '') return null
  return { driver: m[1], disposition: m[2], path, reason: m[4] ?? '' }
}

/**
 * Split the stderr a merge wrote into attributions and everything else.
 *
 * `malformed` is separate from `unattributed` on purpose. An unattributed line
 * is ordinary prose and expected. A line that begins with the prefix and does
 * not parse is one of this repository's own drivers writing a broken record,
 * which is a defect in the driver and has to be visible rather than quietly
 * counted as prose.
 *
 * @param {string[]} stderrLines already split and trimmed, blanks removed.
 * @returns {{results: object[], unattributed: string[], malformed: string[]}}
 */
export function classify(stderrLines) {
  const results = []
  const unattributed = []
  const malformed = []
  for (const line of stderrLines) {
    const parsed = parseResultLine(line)
    if (parsed) {
      results.push(parsed)
      continue
    }
    if (line.trim().startsWith(RESULT_PREFIX)) malformed.push(line)
    else unattributed.push(line)
  }
  return { results, unattributed, malformed }
}

/**
 * Do the drivers' own reports agree with the conflict surface git printed?
 *
 * Two disagreements are possible and they are not the same kind of thing:
 *
 *   `refusalsUnlisted` — a driver says it refused a path and git did not list
 *   that path as conflicted. This is the state in which a conflict surface is
 *   an UNDER-REPORT while looking complete, so it is reported as ground and
 *   never as a verdict about the branch. It is not reachable from either
 *   driver this repository registers today: both call `process.exit(1)` on
 *   every refusal path, and git records a conflict for a non-zero driver. It
 *   is reachable from a driver that exits 0 after writing a degraded result,
 *   which is the silent-corruption shape both drivers' headers say they exist
 *   to remove, so the check is the assertion that they still do.
 *
 *   `mergedButConflicted` — a driver says it merged a path and git listed it
 *   as conflicted anyway. Reported as a notice and NOT as ground, because
 *   there is a legitimate way to reach it: the driver settles content, and git
 *   can still conflict the same path on mode, rename or add/add, which the
 *   driver is never consulted about. A gate that refused here would refuse a
 *   correct measurement, and the bias this file inherits from
 *   `merge-surface.mjs` is that refusing a correct answer costs more than
 *   missing an incorrect one.
 *
 * @param {object[]} results from `classify`.
 * @param {string[]} conflictedPaths exactly as git named them, from STDOUT.
 * @returns {{refusalsUnlisted: object[], mergedButConflicted: object[], reasonByPath: Record<string, {driver: string, reason: string}>}}
 */
export function reconcile(results, conflictedPaths) {
  const conflicted = new Set(conflictedPaths)
  const refusals = results.filter((r) => r.disposition === DISPOSITION.REFUSED)
  const merges = results.filter((r) => r.disposition === DISPOSITION.MERGED)

  /** @type {Record<string, {driver: string, reason: string}>} */
  const reasonByPath = {}
  for (const r of refusals) {
    if (conflicted.has(r.path)) reasonByPath[r.path] = { driver: r.driver, reason: r.reason }
  }

  return {
    refusalsUnlisted: refusals.filter((r) => !conflicted.has(r.path)),
    mergedButConflicted: merges.filter((r) => conflicted.has(r.path)),
    reasonByPath,
  }
}

/**
 * How far a fixed-width read of `2>&1` would have been off for this merge.
 *
 * It is the number of lines on the other handle, which is the whole point:
 * the figure is a property of the branch being measured and not of the tool,
 * so it cannot be written down once in a document. See this file's header for
 * the measured five-line case and for what is assumed about ordering.
 *
 * @param {string[]} stderrLines
 * @returns {number}
 */
export function collapseCost(stderrLines) {
  return stderrLines.filter((l) => l.trim() !== '').length
}
