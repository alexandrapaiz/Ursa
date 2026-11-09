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
// THE KNOWN FALSE POSITIVE, MEASURED RATHER THAN HEDGED AGAINST. A probe an
// entry names is not always the probe that would decide it, because prose
// cites a path as a subject as readily as as a test. The worked case is the
// ledger entry of 2026-10-27, "A credential-shaped fixture is in this branch's
// history, where a one-line edit cannot reach it". It names
// `tools/secret-scan-verdict.test.mjs` because that file is WHERE the fixture
// sits, and this tool therefore runs that file's unit suite, whose greenness
// says nothing whatever about git history. The decisive command is
// `node tools/secret-scan.mjs --history`, which no sentence in the entry puts
// inside a span this extractor reads. Run by hand on 2026-11-08 it prints
// `7829 blobs, 16 classes, 0 hit(s), 1 accepted by baseline`, and the accepted
// line is that same blob `ef90504da7db`: so the scanner is clean, the blob is
// still in history, and the entry is waiting on the owner's choice between a
// permanent baseline and a history rewrite. The classification this tool
// reached, `symptom-cleared`, happens to be the right word for that. It
// reached it by luck. That is the reason the disposition is named
// `symptom-cleared` and not `resolved`, the reason the report's last line says
// so in the output rather than only here, and the reason this tool can never
// be allowed to edit the field it reports on.
//
// WHAT THE DECLARED-COMMAND FIELD IS FOR (added 2026-11-09). The paragraph
// above describes a tool that reaches the right answer by luck, and the luck
// has a single cause: the tool infers which measurement decides an entry from
// whichever path the entry's prose happened to put in backticks. Measured on
// this ledger on 2026-11-09, that inference answers for 6 of 19 `urgent`
// entries and has no opinion at all about the other 13, the oldest 43 days
// old. Several of those 13 are decided by a command that is already committed
// here — `node tools/secret-scan.mjs --history` for the 2026-10-04 history
// entry, `node tools/root-entries.mjs` for the 2026-11-02 dot-entry entry —
// and the only reason this tool cannot say so is that no sentence in those
// entries distinguishes the deciding command from a path mentioned in passing.
//
// So an entry may now declare it, on a line of its own:
//
//   - Recheck: `node tools/secret-scan.mjs --history`
//
// A declaration outranks every inference in the same entry, because it is the
// author's claim about their own entry rather than this tool's guess about it.
// `basis` on each verdict says which of the two produced the measurement, so a
// reader is never left to assume a `symptom-cleared` was decided by the right
// command.
//
// WHY A DECLARATION IS NARROWER THAN A COMMAND, not wider. Widening what this
// tool executes is the opposite of what is wanted, so the declaration grammar
// is deliberately too weak to express anything new. The vector must be `node`,
// one script tracked by git under `tools/` or `scripts/` and ending `.mjs`,
// and then nothing but bare long flags matching /^--[a-z][a-z0-9-]*$/. A flag
// may not carry a value, which means no argument can smuggle a second path, a
// URL, or anything else that is data. Nothing is passed through a shell, ever,
// so the argument vector is the whole attack surface and every token in it is
// matched against one of two closed shapes. The effect: a ledger author can
// cause this tool to run a program this repository already committed and
// reviewed, and cannot cause it to run anything else. A declaration that fails
// any of those tests is REPORTED AS REFUSED WITH ITS REASON rather than
// dropped, because a silently ignored declaration would read in the output as
// an entry that never declared one, which is the worse of the two errors.
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
//  Written segment by segment rather than as one character class. The first
//  version of this constant was `/^tools\/[\w./-]+\.test\.mjs$/`, which put `.`
//  and `/` in the same class and therefore accepted
//  `tools/../../etc/passwd.test.mjs`. Its own test case caught that. Every
//  segment here must open with an alphanumeric or an underscore, so a `..`
//  segment is refused by shape and the refusal does not depend on the
//  traversal happening to land on a path nobody tracks.
const SEGMENT = '[A-Za-z0-9_][A-Za-z0-9_.-]*'
export const PROBE_SHAPE = new RegExp(
  `^tools(?:/${SEGMENT})*/${SEGMENT}\\.test\\.mjs$`,
)

/** The script a `- Recheck:` declaration may name. Same segment rule as
 *  PROBE_SHAPE, so `..` is refused by shape rather than by happening not to
 *  exist, but any `.mjs` under `tools/` or `scripts/` rather than test suites
 *  only: the whole point of the field is to name the command that decides an
 *  entry, and for most of this ledger's urgent entries that command is a gate
 *  (`tools/secret-scan.mjs`, `tools/root-entries.mjs`) and not a unit suite.
 *  `scripts/` is included because `scripts/ci-checks.mjs` is this repository's
 *  own aggregate gate and three urgent entries are about what it can run. */
export const SCRIPT_SHAPE = new RegExp(
  `^(?:tools|scripts)(?:/${SEGMENT})*/${SEGMENT}\\.mjs$`,
)

/** Everything after the script. A bare long flag and nothing else: no value,
 *  no `=`, no positional. See the header for why the grammar is this weak. */
export const FLAG_SHAPE = /^--[a-z][a-z0-9-]*$/

/** The declaration line. Anchored to a list item at the start of a line so a
 *  sentence that merely says the words "Recheck:" mid-paragraph is not one. */
const DECLARATION_LINE = /^[ \t]*-[ \t]+Recheck:[ \t]*(.+?)[ \t]*$/gm

/**
 * @typedef {{ raw: string, path: string, script: string, argv: string[] }} Declaration
 *   `path` is the normalized command line, used as this probe's identity in
 *   the results map and in the report, so a reader sees the command that ran
 *   rather than a file that was mentioned. `argv` is what follows the
 *   interpreter, so the caller supplies `process.execPath` and this module
 *   stays free of it.
 */

/**
 * Parse one declaration's text. Returns the refusal reason instead of throwing,
 * because every refusal is printed.
 * @param {string} raw the text after `- Recheck:`, backticks and all
 * @returns {{ ok: true, value: Omit<Declaration, 'raw'> } | { ok: false, reason: string }}
 */
export function parseDeclaration(raw) {
  const text = raw.trim().replace(/^`+/, '').replace(/`+$/, '').trim()
  if (text === '') return { ok: false, reason: 'is empty' }
  const tokens = text.split(/\s+/)
  if (tokens[0] !== 'node') {
    return { ok: false, reason: `starts with \`${tokens[0]}\`; the only interpreter this tool runs is \`node\`` }
  }
  const [script, ...rest] = tokens.slice(1)
  if (script === undefined) return { ok: false, reason: 'names `node` with no script' }
  if (!SCRIPT_SHAPE.test(script)) {
    return {
      ok: false,
      reason: `names \`${script}\`, which is not a \`.mjs\` file under \`tools/\` or \`scripts/\` with no \`..\` segment`,
    }
  }
  const badFlag = rest.find((a) => !FLAG_SHAPE.test(a))
  if (badFlag !== undefined) {
    return {
      ok: false,
      reason: `carries the argument \`${badFlag}\`, and a declaration may pass only bare long flags (\`--like-this\`), never a value`,
    }
  }
  return { ok: true, value: { path: ['node', script, ...rest].join(' '), script, argv: [script, ...rest] } }
}

/**
 * Every `- Recheck:` line in an entry, split into what this tool will run and
 * what it refuses and why. De-duplicated on the normalized command.
 * @param {string} text one ledger block's verbatim lines
 * @returns {{ accepted: Declaration[], refused: Array<{ raw: string, reason: string }> }}
 */
export function declarationsIn(text) {
  const accepted = []
  const refused = []
  for (const [, raw] of text.matchAll(DECLARATION_LINE)) {
    const parsed = parseDeclaration(raw)
    if (!parsed.ok) {
      refused.push({ raw: raw.trim(), reason: parsed.reason })
      continue
    }
    if (accepted.some((d) => d.path === parsed.value.path)) continue
    accepted.push({ raw: raw.trim(), ...parsed.value })
  }
  return { accepted, refused }
}

/**
 * What this tool will actually measure for one entry, and on what authority.
 * A declaration whose script git does not track is moved to `refused` rather
 * than silently reducing the entry to inference, because "the entry declared a
 * decider and this clone does not have it" is a different repair from "the
 * entry never declared one".
 * @param {string} text one ledger block's verbatim lines
 * @param {(p: string) => boolean} isTracked membership in `git ls-files`
 * @returns {{
 *   basis: 'declared' | 'inferred' | 'none',
 *   probes: Array<{ path: string, argv: string[] }>,
 *   refused: Array<{ raw: string, reason: string }>
 * }}
 */
export function probePlan(text, isTracked) {
  const { accepted, refused } = declarationsIn(text)
  const runnable = accepted.filter((d) => isTracked(d.script))
  const untracked = accepted
    .filter((d) => !isTracked(d.script))
    .map((d) => ({ raw: d.raw, reason: `names \`${d.script}\`, which git does not track in this clone` }))
  const allRefused = [...refused, ...untracked]
  if (runnable.length > 0) {
    return { basis: 'declared', probes: runnable.map((d) => ({ path: d.path, argv: d.argv })), refused: allRefused }
  }
  const inferred = probesIn(text, isTracked).map((p) => ({ path: p, argv: ['--test', p] }))
  return { basis: inferred.length > 0 ? 'inferred' : 'none', probes: inferred, refused: allRefused }
}

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
 *   pathsMissing: string[], disposition: Disposition, why: string,
 *   basis: 'declared' | 'inferred' | 'none',
 *   declarationsRefused: Array<{ raw: string, reason: string }>
 * }} EntryVerdict
 */

/**
 * @param {{ heading: string, date: string | null, text: string }} entry
 * @param {{
 *   probeResults: Map<string, boolean | 'cannot-answer' | 'incomplete'>,
 *   isTracked: (p: string) => boolean,
 *   today: string
 * }} evidence `probeResults` maps a probe's identity string to its outcome:
 *   `true` exited 0, `false` exited non-zero, `'cannot-answer'` exited 2, `'incomplete'`
 *   exited 0 while skipping at least one of its own subtests. A
 *   key absent from the map was not run and is reported as not run rather
 *   than as failing, because "we did not look" and "it is broken" are the two
 *   answers this repository keeps conflating.
 *
 *   THE THIRD VALUE IS NOT A REFINEMENT, it is the fix for a defect this
 *   module shipped with. Exit 2 is this repository's code for a gate that
 *   could not do its job, stated in `tools/board/post.mjs`'s header and in
 *   `../ledger/recheck-urgent.mjs`'s own. The first version here read every
 *   non-zero exit as "the condition still holds", so the first declared
 *   command this seat tried — `node tools/secret-scan.mjs --history
 *   --no-baseline`, on the 2026-10-27 history entries — would have been
 *   reported as `holds` when what actually happened is that the scanner
 *   REFUSED, because the clone every seat is handed is shallow and a history
 *   scan over a truncated graph would report clean. "Still true" and "not
 *   measurable here" are different facts about an urgent entry and they have
 *   different repairs: one needs the work done, the other needs
 *   `bash tools/ensure-full-clone.sh`.
 *
 *   `'incomplete'` IS THE SAME MISTAKE ONE LAYER DOWN, and it was live in the
 *   numbers this tool published. A `node --test` suite that SKIPS a subtest
 *   still exits 0, so a skip and a pass are the same exit code. Measured on
 *   2026-11-09: of the 6 entries this tool called `symptom-cleared`, two rest
 *   on suites that skipped exactly one subtest each,
 *   `tools/root-entries.test.mjs` at 20 pass 1 skip and
 *   `tools/stack/repair-pending.test.mjs` at 19 pass 1 skip. For the first of
 *   those the skipped subtest IS the entry's subject. The ledger entry of
 *   2026-11-02, "A root dot-entry gate on `main` is red in any complete clone
 *   and skipped in the clone every run is handed", says in its own text that
 *   the test skips itself on a shallow clone "with the honest message that the
 *   claim is unmeasured rather than passing". That honesty was then discarded
 *   by this tool, which saw exit 0 and printed that the symptom was gone. The
 *   suite was right and the reader of the report was misled.
 * @returns {EntryVerdict}
 */
export function classifyEntry(entry, { probeResults, isTracked, today }) {
  const paths = pathsIn(entry.text)
  const plan = probePlan(entry.text, isTracked)
  // `passed: null` is "named, allowlisted, not run". Keeping it distinct from
  // `false` is the whole discipline this tool is about: an entry nobody probed
  // is not an entry that came back clean.
  const probes = plan.probes.map(({ path }) => ({
    path,
    passed: probeResults.has(path) ? normalizeOutcome(probeResults.get(path)) : null,
  }))

  const pathsMissing = paths.filter((p) => !isTracked(p))
  const ageDays = daysBetween(entry.date, today)

  const run = probes.filter((p) => p.passed !== null)
  const failing = run.filter((p) => p.passed === false).map((p) => p.path)
  const refusing = run.filter((p) => p.passed === 'cannot-answer').map((p) => p.path)
  const incomplete = run.filter((p) => p.passed === 'incomplete').map((p) => p.path)
  const passing = run.filter((p) => p.passed === true).map((p) => p.path)

  let disposition = 'unverifiable'
  let why = 'names no runnable probe, so this tool reports its age and the paths it cites and nothing more'
  const authority = plan.basis === 'declared'
    ? ', on the command the entry itself declares'
    : ', on a probe inferred from a path the entry mentions rather than one it declares'
  if (probes.length > 0 && run.length === 0) {
    // Named a probe and nobody ran it. Reported as its own sentence rather
    // than folded into the clause above, because the two have different
    // repairs: one needs a probe written, the other needs this tool run.
    why = `names ${probes.length} runnable probe(s) that were not run this pass (${probes.map((p) => p.path).join(', ')}), so its status is unmeasured rather than confirmed`
  } else if (failing.length > 0) {
    disposition = 'holds'
    why = `still failing today: ${failing.join(', ')}${authority}`
  } else if (refusing.length > 0) {
    // Ordered before the clear, not after it, so a pass on one probe and a
    // refusal on another can never add up to `symptom-cleared`.
    why = `refused to answer in this clone at exit 2 (${refusing.join(', ')}), which is not the same as the condition having cleared; the repair is to make the probe answerable here, not to re-read the entry${authority}`
  } else if (incomplete.length > 0) {
    why = `exited 0 while skipping at least one of its own subtests (${incomplete.join(', ')}), so the suite did not measure everything it names and no clear can be read from it; run it directly and read which subtest skipped${authority}`
  } else if (passing.length > 0) {
    disposition = 'symptom-cleared'
    why = `every probe it names passes today (${passing.join(', ')}), so the symptom it describes is gone and the entry is a candidate for re-reading${authority}`
  }
  return {
    heading: entry.heading,
    date: entry.date,
    ageDays,
    probes,
    pathsMissing,
    disposition,
    why,
    basis: plan.basis,
    declarationsRefused: plan.refused,
  }
}

/**
 * One probe outcome, as recorded by the caller, in this module's vocabulary.
 * Booleans are accepted because they are what the runner naturally produces
 * for the two ordinary answers; anything else is read as a refusal rather than
 * as a pass, which is the safe direction: a value this module does not
 * recognise must never clear an urgent entry.
 * @param {boolean | 'cannot-answer' | 'incomplete' | unknown} value
 * @returns {true | false | 'cannot-answer' | 'incomplete'}
 */
export function normalizeOutcome(value) {
  if (value === true) return true
  if (value === false) return false
  if (value === 'incomplete') return 'incomplete'
  return 'cannot-answer'
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
    lines.push(`${v.disposition.padEnd(16)} ${age(v.ageDays)}  [${v.basis}] ${v.heading.replace(/^###\s+/, '')}`)
    lines.push(`                 ${v.why}`)
    if (v.pathsMissing.length > 0) {
      lines.push(`                 cites ${v.pathsMissing.length} path(s) not tracked today: ${v.pathsMissing.join(', ')}`)
    }
    // Printed even when the entry ended up measurable another way. A refused
    // declaration is a defect in the entry its author can fix in one line, and
    // it is invisible to them if the only place it appears is this module.
    for (const r of v.declarationsRefused) {
      lines.push(`                 declaration refused: "${r.raw}" ${r.reason}`)
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
  const declared = sorted.filter((v) => v.basis === 'declared').length
  const refusedCount = sorted.reduce((n, v) => n + v.declarationsRefused.length, 0)
  lines.push(
    `Of those, ${declared} declare the command that decides them on a \`- Recheck:\` line and were `
    + `measured on it; the rest were measured, or not measured, on paths inferred from their prose. `
    + `${refusedCount} declaration(s) were refused by the allowlist and are named above.`,
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

/** @param {EntryVerdict[]} verdicts @returns {{declared:number,inferred:number,none:number}} */
export function basisTally(verdicts) {
  const counts = { declared: 0, inferred: 0, none: 0 }
  for (const v of verdicts) counts[v.basis] += 1
  return counts
}
