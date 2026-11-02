#!/usr/bin/env node
// One rule for every timestamp this repository's tooling compares.
//
//   import { compareInstants, isAfter, utcDay, timestampShape } from './instant.mjs'
//   import { textualTimestampComparisons } from './instant.mjs'   // the lint
//
// Pure. No clock, no git, no network: every function takes its inputs as
// arguments, which is what makes a comparison over a seat's real dates
// assertable in a test.
//
// WHY THIS EXISTS, measured on this repository on 2026-11-02.
//
// Two producers of timestamps feed the same comparisons and they disagree
// on spelling for the same instant:
//
//   git, `--format=%cI`   2026-11-01T23:34:57-05:00
//   GitHub's REST API     2026-11-02T04:34:57Z
//
// Those are the same commit, `9c3c52dc`, this repository's HEAD at the time
// of writing, and the same Unix second, 1793594097. They do not agree on
// the hour, the day, or the final character. So `a > b` between them is not
// a comparison of instants; it is a comparison of two spellings, and it is
// wrong whenever the offset is not zero.
//
// How much of this repository's history is not zero, counted over all 2,134
// commits reachable from `origin/main`:
//
//   +00:00   1804
//   -06:00    156
//   -04:00    138
//   -05:00     36
//
// So 330 commits, 15.5 per cent, carry an offset, and in 143 of them the
// local calendar day the string starts with is not the UTC day of the
// instant it names. `%cI` never prints `Z` at all; UTC is `+00:00` to git,
// which is also why a lexicographic compare against an API `Z` string is
// wrong by one character even at zero offset.
//
// WHAT THE THREE DEFECTS LOOK LIKE, each of which this module replaces with
// a named function:
//
//   1. ORDER. `a.date < b.date`, or `.sort((a, b) => a.date.localeCompare(b.date))`.
//      A `-06:00` string reads as six hours earlier than it is, so it sorts
//      before things that preceded it. Use `compareInstants` / `isAfter`.
//   2. DAY. `date.slice(0, 10)`. That is the committer's local calendar day,
//      not the UTC day, and in 143 of this repository's commits the two
//      differ. A table that prints one and computes an age from the other
//      shows two calendars in one row. Use `utcDay`.
//   3. DROP. `date.slice(0, 19) + 'Z'`, or `%cI` handed to a parser that
//      ignores the suffix. This is the one the ExO seat measured on its own
//      merge gate on 2026-11-02: a ten-minute-old verdict read as four hours
//      old, because the offset was discarded rather than applied. Use
//      `parseInstant`, which refuses a string it cannot place on the line.
//
// WHAT IS NOT A DEFECT, and why the prescription "never %cI" is one step too
// strong. `%cI` is strict ISO 8601 and it carries its offset, so
// `Date.parse` places it correctly to the millisecond. `%ct` is immune to all
// three defects above because it is an integer with no string to truncate,
// compare or mis-parse, which is why it is the better thing to ask git for.
// But a run that switches to `%ct` and then compares the converted string
// against an API string still has defect 1. The rule is not about which
// format specifier you pass to git. It is: never compare, slice or sort a
// timestamp as text. `tools/seat/charter-lag.mjs` now asks git for `%ct`
// *and* routes every comparison through this module, because either one
// alone leaves a live hole.
//
// RELATED AND DELIBERATELY NOT MERGED WITH THIS.
// `tools/board/measured-citation.mjs` has an `isInstant` that REFUSES an
// offset and demands `Z`. That is correct there and would be wrong here: the
// board stamps its own rows in UTC and a block claiming otherwise is a
// transcription error, whereas a git committer date legitimately carries
// whatever offset the committer had. Same family, opposite verdict on the
// same string, so they stay two functions. `timestampShape` is the field
// that lets a caller see which regime a value is in.

/** The offset-bearing or Z-suffixed forms this repository's producers emit. */
const ISO_WITH_ZONE = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.\d{1,9})?)?(Z|[+-]\d{2}:?\d{2})$/

/**
 * Which regime a timestamp string is in. Four answers and not two, because
 * the interesting case is the one that parses and still cannot be compared
 * as text.
 *
 *   'utc-z'       2026-11-02T04:34:57Z          GitHub's API, the board
 *   'utc-offset'  2026-11-02T04:34:57+00:00     git at TZ=UTC
 *   'offset'      2026-11-01T23:34:57-05:00     git anywhere else
 *   'naive'       2026-11-02T04:34:57           no zone: unplaceable
 *   'invalid'     anything else, including a bare day
 */
export function timestampShape (value) {
  if (typeof value !== 'string') return 'invalid'
  const m = ISO_WITH_ZONE.exec(value)
  if (!m) {
    return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d{1,9})?)?$/.test(value) ? 'naive' : 'invalid'
  }
  const zone = m[7]
  if (zone === 'Z') return 'utc-z'
  return /^[+-]00:?00$/.test(zone) ? 'utc-offset' : 'offset'
}

/**
 * Milliseconds since the epoch, or null when the string does not place
 * itself on the line. A 'naive' string returns null rather than being read
 * as UTC: reading it as UTC is defect 3, and guessing silently is how a
 * four-hour error gets reported as health.
 */
export function parseInstant (value) {
  const shape = timestampShape(value)
  if (shape === 'invalid' || shape === 'naive') return null
  const ms = Date.parse(value)
  return Number.isNaN(ms) ? null : ms
}

/**
 * Seconds from `git log --format=%ct` to milliseconds. Separate from
 * `parseInstant` because the input is an integer or its decimal spelling and
 * has no zone to get wrong; this is the preferred producer.
 */
export function parseEpochSeconds (value) {
  if (typeof value !== 'number') {
    // `Number('')` and `Number('  ')` are 0, a finite integer, so the empty
    // string a failed `git log` leaves in `$(...)` would have parsed as
    // 1970-01-01 and dated a verdict to the epoch. The guard is the digits.
    if (!/^-?\d+$/.test(String(value).trim())) return null
  }
  const n = typeof value === 'number' ? value : Number(String(value).trim())
  if (!Number.isFinite(n) || !Number.isInteger(n)) return null
  return n * 1000
}

/** The UTC instant as a `Z` string, which is the only form safe to compare as text. */
export function toUtcInstant (value) {
  const ms = typeof value === 'number' ? value : parseInstant(value)
  return ms === null ? null : new Date(ms).toISOString().replace(/\.\d{3}Z$/, 'Z')
}

/**
 * Negative, zero or positive, as `Array.prototype.sort` wants. Null when
 * either side is unplaceable, so a caller cannot get a confident ordering
 * out of a value this module refused.
 */
export function compareInstants (a, b) {
  const x = parseInstant(a)
  const y = parseInstant(b)
  if (x === null || y === null) return null
  return x < y ? -1 : x > y ? 1 : 0
}

/** Strictly after. False when either side is unplaceable: absent, not true. */
export function isAfter (a, b) {
  return compareInstants(a, b) === 1
}

/** Strictly before. False when either side is unplaceable. */
export function isBefore (a, b) {
  return compareInstants(a, b) === -1
}

/**
 * The UTC calendar day, `YYYY-MM-DD`. Null when unplaceable. This is the
 * replacement for `slice(0, 10)`, which returns the committer's local day
 * and disagrees with it on 143 of this repository's 2,134 commits.
 */
export function utcDay (value) {
  // One expression on purpose. Split across two lines the slice sits on a
  // line with no normalising call on it, and this module's own lint reports
  // it — correctly, since a reader of that line alone cannot tell the
  // receiver is already UTC. The lint found it in the first sweep.
  return toUtcInstant(value)?.slice(0, 10) ?? null
}

/**
 * Ascending by instant, stable, with unplaceable rows kept and sorted last
 * in their original order. Returns a new array. `key` reads the timestamp
 * off a row.
 */
export function sortByInstant (rows, key) {
  return rows
    .map((row, i) => ({ row, i, ms: parseInstant(key(row)) }))
    .sort((a, b) => {
      if (a.ms === null && b.ms === null) return a.i - b.i
      if (a.ms === null) return 1
      if (b.ms === null) return -1
      return a.ms === b.ms ? a.i - b.i : a.ms - b.ms
    })
    .map((e) => e.row)
}

// --- the lint, because a rule nobody can grep for is not enforced --------

/**
 * Identifier names that this repository actually uses for timestamps. A
 * name-shape lint and not a type checker: it is the only thing available in
 * plain `.mjs`, and the corpus below is why it is worth having anyway.
 *
 * WHY `Date` TAKES A CAPITAL D HERE. The first version of this pattern
 * accepted a lowercase `date` anywhere inside a longer identifier, and the
 * first sweep over this repository's 419 tracked source files reported
 * `createHash('sha256').update(png).digest('hex').slice(0, 10)` as a
 * timestamp defect, twice. `update` ends in `date`. So does `validate`,
 * `candidate`, `consolidate`, `invalidate` and `mandate`, all of which this
 * repository uses. The suffix is therefore `Date` with a capital, or the
 * whole identifier being `date`, or a `_date` tail — which keeps `mainDate`,
 * `authoredAt`, `created_at` and `firstTs` and drops every English word that
 * merely rhymes with one.
 *
 * This is the lint's accuracy, not its correctness: a missed name is a
 * finding this tool does not report, and a wrong name is a line somebody has
 * to hand-clear. Of the two, the false positive is the one that gets a lint
 * switched off, so it is the one that was worth a corpus.
 */
const TIMESTAMP_NAME =
  /(?:^|[^A-Za-z0-9_$])(?:[A-Za-z_$][A-Za-z0-9_$]*)?(?:Date|\bdate|_date|At|_at|[Tt]ime|[Tt]imestamp|[Ii]so|ISO|[Tt]s)(?![A-Za-z0-9_$])/

/**
 * Source lines that compare, sort or slice something whose name says it is a
 * timestamp, as text. Returns `{code, line, text, repair}` in the same shape
 * `tools/board/check.mjs` already prints, one per finding.
 *
 * Three codes, matching the three defects in this file's header:
 *
 *   TEXTUAL_ORDER   a relational operator or `localeCompare` between two
 *                   timestamp-named operands
 *   TEXTUAL_DAY     `slice(0, 10)` or `substring(0, 10)` on one
 *   TEXTUAL_DROP    `slice(0, 19)` immediately re-suffixed with a zone
 *
 * A line carrying `instant.mjs`-sourced calls is not a finding, which is how
 * the repaired call sites stay clean without an inline suppression comment.
 */
export function textualTimestampComparisons (source) {
  const out = []
  const lines = source.split('\n')
  lines.forEach((text, i) => {
    const line = i + 1
    const bare = text.replace(/\/\/.*$/, '')
    if (/\b(?:parseInstant|compareInstants|isAfter|isBefore|utcDay|sortByInstant|parseEpochSeconds|toUtcInstant)\s*\(/.test(bare)) return
    // `new Date().toISOString()` is UTC by construction, so a day sliced off
    // the end of one is the UTC day and is not defect 2. This is the only
    // exemption in the lint and it is a producer exemption, not a name one.
    if (/toISOString\(\)\s*\.\s*(?:slice|substring)\(\s*0\s*,\s*10\s*\)/.test(bare)) return
    if (/\.slice\(\s*0\s*,\s*19\s*\)\s*(?:\+|\.concat)/.test(bare)) {
      out.push({
        code: 'TEXTUAL_DROP',
        line,
        text: text.trim(),
        repair: 'parseInstant(value), then toUtcInstant: re-suffixing a truncated string discards the offset'
      })
      return
    }
    // The receiver of the slice and not the whole line: a line may name a
    // timestamp and slice something else, which is how a hex digest came to
    // be reported as a date.
    const sliced = /([A-Za-z_$][A-Za-z0-9_$.?!\[\]'"()]*?)\s*\??\.\s*(?:slice|substring)\(\s*0\s*,\s*10\s*\)/.exec(bare)
    if (sliced && TIMESTAMP_NAME.test(sliced[1])) {
      out.push({
        code: 'TEXTUAL_DAY',
        line,
        text: text.trim(),
        repair: 'utcDay(value): slice(0, 10) returns the committer\'s local day, not the UTC day'
      })
      return
    }
    const relational = /([A-Za-z_$][A-Za-z0-9_$.?\[\]'"]*)\s*(<=|>=|<|>)\s*([A-Za-z_$][A-Za-z0-9_$.?\[\]'"]*)/.exec(bare)
    if (relational && TIMESTAMP_NAME.test(relational[1]) && TIMESTAMP_NAME.test(relational[3])) {
      out.push({
        code: 'TEXTUAL_ORDER',
        line,
        text: text.trim(),
        repair: `isAfter/isBefore/compareInstants: '${relational[2]}' between two timestamp strings compares spellings, not instants`
      })
      return
    }
    const compared = /([A-Za-z_$][A-Za-z0-9_$.?\[\]'"]*)\.localeCompare\(\s*([A-Za-z_$][A-Za-z0-9_$.?\[\]'"]*)/.exec(bare)
    if (compared && TIMESTAMP_NAME.test(compared[1]) && TIMESTAMP_NAME.test(compared[2])) {
      out.push({
        code: 'TEXTUAL_ORDER',
        line,
        text: text.trim(),
        repair: 'sortByInstant(rows, key): localeCompare orders spellings, and git and the GitHub API spell the same instant differently'
      })
    }
  })
  return out
}
