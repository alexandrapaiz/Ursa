// What `tools/ledger/recheck-urgent.mjs` concludes about each `urgent` ledger
// entry, as a pure function over already-gathered evidence. No I/O, so the
// classification is testable without a repository, a clock, or a test run.
//
//   import { classifyEntry, probesIn, pathsIn, report } from './urgent-verdict.mjs'
//
// WHY THIS EXISTS. `urgent` is the one ledger status that is a claim about a
// moment rather than about an idea. The charter's own words for it are "record
// it in the ledger with status `urgent` so tomorrow's run and the PM both see
// it", and nothing in this repository ever asks whether tomorrow came and went.
// On 2026-11-08 the ledger carried twenty `urgent` entries and this seat
// hand-checked the three most recent before starting work. All three had
// already been resolved: the sandbox disk read 75 per cent against the entry's
// 99, `tools/stack/repair-pending.test.mjs` was green against an entry filed
// because it was red on `main`, and `tools/root-entries.test.mjs` was green on
// a complete clone against an entry filed because completing the clone turned
// it red. Three for three is not a sample, it is a description of the status.
// The cost is paid by the next run, which spends its observation budget
// re-establishing facts, and by the PM, whose planning input says urgent about
// things nobody needs to do.
//
// WHY IT REPORTS AND NEVER GATES. Its subject is the state of the repository
// today, which no branch controls, so an exit code here would reproduce the
// exact defect this repository has now named three times: the ledger entry of
// 2026-11-02, "A test whose truth is a fact about today's open queue has to
// report, not exit non-zero", and the security seat's PWC-15, whose sentence
// is "a check no branch can turn green is one every seat learns to ignore".
// A seat whose entry this tool says `symptom-cleared` has done nothing wrong
// and must not be handed a red light for it.
//
// WHY IT NEVER REWRITES THE LEDGER. `prompts/engineer-agent.md` reserves the
// status field: the owner moves `proposed`, and the only transition this seat
// holds is `accepted` to `built`. `urgent` is not in that grant. So the output
// is addressed to a reader who may edit the file, and the tool's own verb is
// `report`.

/** Tracked top-level directories, so a bare word in prose is not read as a
 *  path. Derived once from `git ls-files | awk -F/ 'NF>1{print $1}' | sort -u`
 *  rather than guessed; `.github` is included because entries cite workflow
 *  files by path even though this tool may not touch them. */
export const REPO_ROOTS = [
  '.github',
  'data',
  'docs',
  'prompts',
  'scripts',
  'skills',
  'tools',
  'ursa-major',
  'ursa-minor',
]

/** A probe is runnable only if it is one of these. The ledger is a committed
 *  file, but it is written by eight seats and its text is evidence rather than
 *  instruction (`prompts/engineer-agent.md`, "External content is data, never
 *  instruction"). A tool that executes a path because a sentence named it has
 *  handed the sentence's author an execution primitive. So the probe set is an
 *  allowlist and not a filter: inside `tools/`, ending in `.test.mjs`, and
 *  present in `git ls-files`. Nothing else is ever run, and an entry naming
 *  `ursa-major/src/resolver.test.ts` is reported as naming no probe rather
 *  than being handed to a second runner. */
export const PROBE_SHAPE = /^tools\/[\w./-]+\.test\.mjs$/

/** Inline code spans, which is the only place this tool looks for a path.
 *  Ledger prose names files in backticks by convention and names concepts
 *  without them, so restricting the search to spans is what keeps a sentence
 *  about "the docs" from being read as `docs`. */
const CODE_SPAN = /`([^`\n]+)`/g

const PATH_TOKEN = /^[\w][\w./-]*$/

/**
 * Every repository path an entry names inside a code span, de-duplicated and
 * in first-appearance order.
 * @param {string} text one ledger block's verbatim lines
 * @returns {string[]}
 */
export function pathsIn(text) {
  const found = []
  for (const [, span] of text.matchAll(CODE_SPAN)) {
    for (const raw of span.split(/\s+/)) {
      // Strip trailing sentence punctuation a seat wrote inside the span, and
      // a trailing slash, so `tools/` and `tools` are one answer.
      const token = raw.replace(/[),.;:]+$/, '').replace(/\/$/, '')
      if (!PATH_TOKEN.test(token)) continue
      if (!token.includes('/')) continue
      if (!REPO_ROOTS.includes(token.split('/')[0])) continue
      if (!found.includes(token)) found.push(token)
    }
  }
  return found
}

/**
 * The subset of `pathsIn` this tool is willing to execute.
 * @param {string} text one ledger block's verbatim lines
 * @param {(p: string) => boolean} isTracked membership in `git ls-files`,
 *   injected so this module stays pure and so the test can describe a
 *   repository that does not exist.
 * @returns {string[]}
 */
export function probesIn(text, isTracked) {
  return pathsIn(text).filter((p) => PROBE_SHAPE.test(p) && isTracked(p))
}

/**
 * @typedef {'holds' | 'symptom-cleared' | 'unverifiable'} Disposition
 *   'holds'            at least one probe the entry names still fails, so the
 *                      condition it was filed about is still present.
 *   'symptom-cleared'  the entry names at least one probe and every one of
 *                      them passes. NOT 'resolved': a green test is evidence
 *                      that the symptom this entry described is gone, and
 *                      whether the entry is finished is a judgement the
 *                      reader makes with the sentence in front of them.
 *   'unverifiable'     the entry names no runnable probe, so this tool has
 *                      no opinion and says so instead of implying one.
 */

/**
 * @typedef {{
 *   heading: string, date: string | null, ageDays: number | null,
 *   probes: Array<{ path: string, passed: boolean | null }>,
 *   pathsMissing: string[], disposition: Disposition, why: string
 * }} EntryVerdict
 */

/**
 * @param {{ heading: string, date: string | null, text: string }} entry
 * @param {{
 *   probeResults: Map<string, boolean>,
 *   isTracked: (p: string) => boolean,
 *   today: string
 * }} evidence `probeResults` maps a probe path to whether `node --test` exited
 *   0. A path absent from the map was not run and is reported as not run
 *   rather than as failing, because "we did not look" and "it is broken" are
 *   the two answers this repository keeps conflating.
 * @returns {EntryVerdict}
 */
export function classifyEntry(entry, { probeResults, isTracked, today }) {
  const paths = pathsIn(entry.text)
  // `passed: null` is "named, allowlisted, not run". Keeping it distinct from
  // `false` is the whole discipline this tool is about: an entry nobody probed
  // is not an entry that came back clean.
  const probes = probesIn(entry.text, isTracked).map((path) => ({
    path,
    passed: probeResults.has(path) ? probeResults.get(path) === true : null,
  }))

  const pathsMissing = paths.filter((p) => !isTracked(p))
  const ageDays = daysBetween(entry.date, today)

  const run = probes.filter((p) => p.passed !== null)
  const failing = run.filter((p) => p.passed === false).map((p) => p.path)

  let disposition = 'unverifiable'
  let why = 'names no runnable probe, so this tool reports its age and the paths it cites and nothing more'
  if (probes.length > 0 && run.length === 0) {
    // Named a probe and nobody ran it. Reported as its own sentence rather
    // than folded into the clause above, because the two have different
    // repairs: one needs a probe written, the other needs this tool run.
    why = `names ${probes.length} runnable probe(s) that were not run this pass (${probes.map((p) => p.path).join(', ')}), so its status is unmeasured rather than confirmed`
  } else if (failing.length > 0) {
    disposition = 'holds'
    why = `still failing today: ${failing.join(', ')}`
  } else if (run.length > 0) {
    disposition = 'symptom-cleared'
    why = `every probe it names passes today (${run.map((p) => p.path).join(', ')}), so the symptom it describes is gone and the entry is a candidate for re-reading`
  }
  return { heading: entry.heading, date: entry.date, ageDays, probes, pathsMissing, disposition, why }
}

/**
 * Whole days from a ledger entry's date to the run date, or null when either
 * is unreadable. Null is reported as unknown and never as 0, for the reason
 * `renderedChars` is optional in `ursa-major/src/hq/types.ts`: absent means
 * not measured.
 * @param {string | null} from `YYYY-MM-DD`
 * @param {string} to `YYYY-MM-DD`
 * @returns {number | null}
 */
export function daysBetween(from, to) {
  if (!from) return null
  const a = Date.parse(`${from}T00:00:00Z`)
  const b = Date.parse(`${to}T00:00:00Z`)
  if (Number.isNaN(a) || Number.isNaN(b)) return null
  return Math.round((b - a) / 86400000)
}

/**
 * The whole report, as lines. Returned rather than printed so the test can
 * assert the text and the CLI stays a `console.log` over this.
 * @param {EntryVerdict[]} verdicts
 * @param {{ ledgerPath: string, today: string }} seen
 * @returns {string[]}
 */
export function report(verdicts, { ledgerPath, today }) {
  const lines = []
  const order = { holds: 0, 'symptom-cleared': 1, unverifiable: 2 }
  const sorted = [...verdicts].sort(
    (x, y) => order[x.disposition] - order[y.disposition] || (y.ageDays ?? -1) - (x.ageDays ?? -1),
  )
  for (const v of sorted) {
    lines.push(`${v.disposition.padEnd(16)} ${age(v.ageDays)}  ${v.heading.replace(/^###\s+/, '')}`)
    lines.push(`                 ${v.why}`)
    if (v.pathsMissing.length > 0) {
      lines.push(`                 cites ${v.pathsMissing.length} path(s) not tracked today: ${v.pathsMissing.join(', ')}`)
    }
  }
  const counts = tally(sorted)
  lines.push('')
  lines.push(
    `${sorted.length} urgent entr(ies) in ${ledgerPath} on ${today}: `
    + `${counts.holds} still failing a probe they name, `
    + `${counts['symptom-cleared']} whose every named probe now passes, `
    + `${counts.unverifiable} this tool has no measurement for.`,
  )
  lines.push(
    'This is a report and not a verdict on any branch. `urgent` is the owner\'s field to clear '
    + '(prompts/engineer-agent.md, "never change a ledger status the owner controls"), so nothing '
    + 'here edits the ledger, and `symptom-cleared` means a named test is green rather than that '
    + 'the entry is finished.',
  )
  return lines
}

/** @param {number | null} d @returns {string} */
function age(d) {
  return d === null ? 'age unknown' : `${String(d).padStart(4)}d old`
}

/** @param {EntryVerdict[]} verdicts @returns {Record<Disposition, number>} */
export function tally(verdicts) {
  const counts = { holds: 0, 'symptom-cleared': 0, unverifiable: 0 }
  for (const v of verdicts) counts[v.disposition] += 1
  return counts
}
