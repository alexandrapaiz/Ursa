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
// THE FOURTH VALUE CLASS, AND WHY IT NEEDED ITS OWN FUNCTIONS (2026-11-09).
// A bare calendar day, `2026-11-09`, is not a badly spelled instant. It is a
// different unit: it names a day with no zone and no time, which is the form
// the holding company's register console writes and parses. Until today this
// module classified one as `invalid`, which is true of `parseInstant` and was
// false as a description of the value, and the cost was paid by the lint
// rather than by the module.
//
// The lint's `TEXTUAL_ORDER` repair line named `isAfter`, `isBefore` and
// `compareInstants`. All three REFUSE a bare day on purpose: `compareInstants`
// answers null and both predicates answer false in both directions. So on a
// field named `date` that holds a day — `tools/seat/read-dates.mjs` has 115
// such entries and no other form of the field — the lint was correct about the
// defect and named a repair that silently produces no ordering at all. A guard
// whose repair does not work on the value it caught gets worked around, and
// the ExO seat's note of 2026-11-09 01:06Z is it being worked around: that
// seat shipped a private `compareDays` because this module had none.
//
// So: `parseDay`, `compareDays`, `isDayAfter`, `isDayBefore`, `sortByDay`,
// mirroring the instant five. The refusal is now SYMMETRIC, which is the
// property worth having. The instant functions refuse a day, the day functions
// refuse an instant, and neither coerces. A caller holding an instant who
// wants day granularity writes the projection out loud:
//
//     compareDays(utcDay(gitDate), utcDay(apiDate))
//
// WHY `compareDays` PARSES RATHER THAN COMPARING TEXT. Text order IS day order
// for a zero-padded `YYYY-MM-DD`, so a string compare would have been correct
// and is why `tools/seat/outage.mjs` compares `r.day` as text and passes this
// lint clean. It is still not what this module should ship, for one reason:
// a string compare cannot tell `2026-02-30` from a day. `Date.parse` cannot
// either — it answers 1772409600000, silently rolling the value to March 2 —
// so `parseDay` round-trips through `Date.UTC` and refuses what does not come
// back unchanged. Ordering and existence get decided in one call.
//
// THE NAMING CONVENTION, STATED HERE BECAUSE THE LINT HAS BEEN RELYING ON IT
// UNWRITTEN. `TIMESTAMP_NAME` below matches `date`, `Date`, `At`, `ts` and
// `time`, and does NOT match `day`. That is why `tools/seat/outage.mjs`
// compares or sorts day strings as text on seven lines — 212, 234, 266, 317,
// 328, 356, 362, eight comparisons, since 266 carries two — and is reported by
// nothing, and is right anyway. The convention the lint's accuracy depends on
// is therefore:
//
//   a field named `date`/`Date`/`At`/`ts`/`time` carries an INSTANT, and a
//   field carrying a bare calendar day is named `day`.
//
// AND THE CONVENTION IS LOOSER THAN THAT IN PRACTICE, which is worth knowing
// before anyone leans on it. Two of those seven lines, 328 and 362, order a
// field named `last`, which holds a bare day and is matched by no alternative
// in the pattern either. So the lint's silence on a day is not evidence that
// the author followed a convention; it is evidence that the author did not use
// one of five particular words. Those two lines are correct, and nothing in
// the tooling would have told anybody if they were not.
//
// It was a convention nothing stated, which is the defect the ExO seat
// actually found. Stating it is half the repair; the other half is that
// `TEXTUAL_ORDER`'s repair text now names which of its repairs applies to
// which shape, and narrows to the day branch whenever the offending line
// carries its own evidence of a day (see `dayEvidence`).
//
// RELATED AND DELIBERATELY NOT MERGED WITH THIS.
// `tools/board/measured-citation.mjs` has an `isInstant` that REFUSES an
// offset and demands `Z`. That is correct there and would be wrong here: the
// board stamps its own rows in UTC and a block claiming otherwise is a
// transcription error, whereas a git committer date legitimately carries
// whatever offset the committer had. Same family, opposite verdict on the
// same string, so they stay two functions. `timestampShape` is the field
// that lets a caller see which regime a value is in.

/** A zero-padded calendar day with no time and no zone, which is what the
 *  holding company's register console writes. Spelling only: `2026-02-30`
 *  matches and `parseDay` refuses it. */
const BARE_DAY = /^\d{4}-\d{2}-\d{2}$/

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
 *   'day'         2026-11-02                    a calendar day, not an instant
 *   'invalid'     anything else
 *
 * `'day'` IS NOT `'invalid'`, AS OF 2026-11-09, and the difference is the
 * whole repair described in this file's header. A bare day is a well-formed
 * value of a different class, so a caller that gets `'day'` back knows to
 * route to `compareDays` rather than that its input is garbage. The three
 * instant comparators are UNCHANGED by this: `parseInstant` names `'day'`
 * among the shapes it refuses, so `compareInstants` on two days still answers
 * null and both predicates still answer false.
 *
 * Spelling only, like the instant branch below it. `'2026-02-30'` is a `'day'`
 * here and is refused by `parseDay`, which is where existence is decided.
 */
export function timestampShape (value) {
  if (typeof value !== 'string') return 'invalid'
  const m = ISO_WITH_ZONE.exec(value)
  if (!m) {
    if (BARE_DAY.test(value)) return 'day'
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
 *
 * A `'day'` is refused for the same reason and the refusal is NAMED here
 * rather than inherited. Before 2026-11-09 a bare day reached this line as
 * `'invalid'` and got the same null by accident; now it is listed, so the
 * contract "the instant functions do not place a day" is a line of code that
 * a reader can find and a test can pin, instead of a side effect of how
 * `timestampShape` happened to classify it. Use `parseDay` for a day.
 */
export function parseInstant (value) {
  const shape = timestampShape(value)
  if (shape === 'invalid' || shape === 'naive' || shape === 'day') return null
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

// --- days, which are a unit and not a degraded instant -------------------
//
// Five functions mirroring the five above them, one shape narrower. They exist
// because the lint above caught a real textual sort over a field holding bare
// days and prescribed three functions that all refuse that value. See this
// file's header, "THE FOURTH VALUE CLASS".

/**
 * Milliseconds at UTC midnight of a bare calendar day, or null.
 *
 * Refuses three things and each refusal has a reason:
 *
 *   1. Anything that is not exactly `YYYY-MM-DD`. An INSTANT included, and
 *      that is the point of the function rather than a limitation of it. A
 *      caller holding `2026-11-02T04:34:57Z` and wanting its day writes
 *      `utcDay(value)` first, out loud, because which calendar an instant
 *      falls in is a question with a real answer and this function will not
 *      pick one silently.
 *   2. A day that does not exist. `Date.parse('2026-02-30')` answers
 *      1772409600000 — it rolls the value forward to March 2 and tells
 *      nobody — so the round-trip through `Date.UTC` below is not belt and
 *      braces, it is the only check that fires. `2026-02-30` and `2026-13-01`
 *      both return null here.
 *   3. A two-digit-mapped year. `Date.UTC(0, 0, 1)` is 1900-01-01, a legacy
 *      mapping in the language, so `0000-01-01` would otherwise have come back
 *      as a placeable day 1900 years from where it was written. The same
 *      round-trip catches it.
 *
 * WHY MIDNIGHT UTC AND NOT MIDNIGHT ANYWHERE ELSE. A day has no zone, so any
 * instant chosen for it is a convention. This one is only ever used to order
 * and subtract days against each other, where the choice cancels. It is not a
 * licence to compare the result against an instant: that comparison asks what
 * zone the day was written in, which the value does not carry. The module
 * refuses to answer questions the value cannot answer, which is the same rule
 * that makes `'naive'` unplaceable.
 */
export function parseDay (value) {
  if (typeof value !== 'string' || !BARE_DAY.test(value)) return null
  const year = Number(value.slice(0, 4))
  const month = Number(value.slice(5, 7))
  const day = Number(value.slice(8, 10))
  const ms = Date.UTC(year, month - 1, day)
  if (!Number.isFinite(ms)) return null
  const back = new Date(ms)
  if (back.getUTCFullYear() !== year) return null
  if (back.getUTCMonth() + 1 !== month) return null
  if (back.getUTCDate() !== day) return null
  return ms
}

/**
 * Negative, zero or positive, as `Array.prototype.sort` wants. Null when
 * either side is not a bare calendar day, exactly as `compareInstants`
 * answers null for a value it will not place.
 *
 * WHY NULL AND NOT A THROW, which is where this differs from the ExO seat's
 * private `compareDays` in `tools/seat/read-dates.mjs`. That one throws a
 * `TypeError` naming `compareInstants`, and the pointer is a genuinely better
 * teacher at the moment it fires. It is still the wrong convention for this
 * module: every refusal here is a null or a false, so one function that exits
 * by exception means a caller cannot route the five uniformly, and a sweep
 * tool that lints a corpus of other seats' values would die on the first bad
 * row instead of reporting it. The pointer is kept, moved to where it cannot
 * crash a caller: the lint's `TEXTUAL_ORDER` repair text now names the shape
 * each repair applies to.
 *
 * THE HAZARD THIS SHARES WITH `compareInstants`, named because it is the
 * reason `sortByDay` exists. `null` handed to `Array.prototype.sort` coerces
 * to 0, which reads as "equal" and leaves the rows in place, so a comparator
 * that refuses its input produces an unsorted array and no error. Use
 * `sortByDay` for a sort; use this one where you can read the null.
 */
export function compareDays (a, b) {
  const x = parseDay(a)
  const y = parseDay(b)
  if (x === null || y === null) return null
  return x < y ? -1 : x > y ? 1 : 0
}

/** Strictly a later day. False when either side is not a day: absent, not true. */
export function isDayAfter (a, b) {
  return compareDays(a, b) === 1
}

/** Strictly an earlier day. False when either side is not a day. */
export function isDayBefore (a, b) {
  return compareDays(a, b) === -1
}

/**
 * Ascending by calendar day, stable, with rows this module will not place kept
 * and sorted last in their original order. Returns a new array. `key` reads
 * the day off a row. This is the repair for the finding that produced the
 * whole day family: a `.sort(...localeCompare...)` over a field of bare days.
 */
export function sortByDay (rows, key) {
  return rows
    .map((row, i) => ({ row, i, ms: parseDay(key(row)) }))
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
 *
 * AND `ts` TAKES THE SAME TREATMENT, ONE ALTERNATIVE OVER, FOR THE SAME
 * REASON AND IT DID NOT GET IT UNTIL 2026-11-08. The paragraph above fixed
 * `date`, checked that `firstTs` still matched, and left `[Tt]s` accepting any
 * identifier that merely ends in those two letters — which in English is most
 * plurals. Re-measured over this repository's tracked source: **15,466
 * distinct identifiers, 446 matching this pattern, and 355 of the 446 match
 * on a `ts` tail. Eight of those 355 are timestamps.** The other **347** are
 * `seats`, `commits`, `results`, `points`, `exits`, `hits`, `reports`,
 * `units`, `scripts`, `costs`, `shots` and so on: an accuracy of **2.3 per
 * cent** on that alternative.
 *
 * It cost a real false finding rather than a hypothetical one. On 2026-11-08
 * the gate reported `if (cmp.points < baseline.minPoints)` in
 * `tools/seat/suite-baseline.mjs` as a timestamp ordered as text, in the same
 * run as two genuine findings, so a window had three offenders to hand-clear
 * and no way to tell which were real except by reading the detector.
 *
 * AND `now` IS THE THIRD MEMBER OF THAT FAMILY, ADDED 2026-11-09 BY THE ExO
 * SEAT AFTER URSA'S SECURITY SEAT FOUND THE SITE IT HIDES. `now` holds an
 * instant in every use of it in this repository and the pattern did not name
 * it, so `String(now).slice(0, 10)` was invisible to the lint while the line
 * immediately above it — the same slice on a variable called `readDate` — was
 * a finding. One defect, two lines, one reported.
 *
 * Measured before it was added, both ways round, over this repository's
 * tracked source: **6 of 15,414 distinct identifiers** match the alternative
 * (`now`, `Now`, `conflictedNow`, `versionsNow`, `verbatimCharsNow`,
 * `verbatimSpansNow`) and the alternative yields **2 new findings and loses
 * none**. Both new findings are genuine: `tools/seat/outage.mjs` and
 * `tools/seat/read-dates.mjs`, the two call sites repaired in the same pull
 * request.
 *
 * `\bnow` and not `[Nn]ow`, for the `update`-ends-in-`date` reason one
 * paragraph up and it bites harder here: **`know` ends in `now`**, and so do
 * `known` and `knows` with the trailing-boundary rule relaxed. The
 * word-boundary form rejects all three for the same reason `\bdate` rejects
 * `update`.
 *
 * The `at` alternative was measured in the same pass and is **left alone**:
 * all **57** of its matches are `createdAt`/`_at`-shaped and none is a plain
 * English word, so `format`, `concat`, `float` and `stat` are reached only
 * through the `[^A-Za-z0-9_$]` prefix this pattern already requires. A
 * narrowing with no false positives behind it is a guess, and this one is not
 * made.
 */
const TIMESTAMP_NAME =
  /(?:^|[^A-Za-z0-9_$])(?:[A-Za-z_$][A-Za-z0-9_$]*)?(?:Date|\bdate|_date|At|_at|[Tt]ime|[Tt]imestamp|[Ii]so|ISO|Ts|\bts|_ts|\bnow|Now|_now)(?![A-Za-z0-9_$])/

/**
 * Source lines that compare, sort or slice something whose name says it is a
 * timestamp, as text. Returns `{code, line, text, repair}` in the same shape
 * `tools/board/check.mjs` already prints, one per finding.
 *
 * Four codes. Three match the defects in this file's header; the fourth is a
 * misuse of this file's own repair rather than a defect it replaced:
 *
 *   TEXTUAL_ORDER     a relational operator or `localeCompare` between two
 *                     timestamp-named operands. Its repair names both the
 *                     instant functions and the day functions, because the
 *                     lint cannot see which the field holds; see below.
 *   TEXTUAL_DAY       `slice(0, 10)` or `substring(0, 10)` on one
 *   TEXTUAL_DROP      `slice(0, 19)` immediately re-suffixed with a zone
 *   REFUSAL_AS_ORDER  `compareDays` or `compareInstants` inside a `.sort(`
 *                     callback. Not name-shaped: it needs no timestamp name,
 *                     because the callee IS the evidence. Checked before the
 *                     repaired-site exemption, which would otherwise clear
 *                     it — see the comment at that line.
 *
 * A line carrying `instant.mjs`-sourced calls is not a finding, which is how
 * the repaired call sites stay clean without an inline suppression comment.
 *
 * WHY `TEXTUAL_ORDER` NAMES TWO SETS OF REPAIRS RATHER THAN ONE (2026-11-09).
 * This is a NAME-shape lint, so it knows a field is called `date` and cannot
 * know whether that field holds `2026-11-02T04:34:57Z` or `2026-11-02`. The
 * two take different repairs and the instant repair silently produces no
 * ordering on a day, so a single-branch repair line sent one of the two
 * classes somewhere that refuses it. It now names both and says how to tell.
 *
 * AND WHY IT IS NOT NARROWED AUTOMATICALLY, which was the first thing tried.
 * The idea was to read the offending line for its own evidence of a day — a
 * `'2026-11-09'` literal, or a `slice(0, 10)` — and print only the matching
 * branch. Measured against the patterns below, on 2026-11-09, it does not
 * work in either direction:
 *
 *   - A day literal can never be an operand the relational pattern sees. Its
 *     operand class starts `[A-Za-z_$]`, so the leading quote excludes it, and
 *     `r.date > '2026-11-09'` matches nothing at all today. The narrowing
 *     would have had no reachable true case.
 *   - A `slice(0, 10)` on the line is consumed by `TEXTUAL_DAY` above, which
 *     returns before either order branch runs, whenever the sliced receiver is
 *     timestamp-named — and when it is not, neither order pattern fires.
 *   - Line-level evidence is positively WRONG on the one shape that does
 *     reach it: a relational compare of two `createdAt` values, on a line that
 *     also carries an equality test against a `'2026-11-09'` literal, is a
 *     genuine INSTANT comparison on a line that merely mentions a day, and
 *     evidence-based narrowing prints the day repair for it. That shape is
 *     written out as code in `instant.test.mjs` rather than here, because
 *     written here it is a finding of this very lint — which this module's own
 *     two self-checks catch, and did.
 *
 * So the shape stays a question for the reader, and the repair line's job is
 * to make sure the reader knows it is being asked. Deciding it statically
 * needs types, which plain `.mjs` does not have.
 */
export function textualTimestampComparisons (source) {
  const out = []
  const lines = source.split('\n')
  lines.forEach((text, i) => {
    const line = i + 1
    // A block comment's continuation line is prose, and prose about
    // timestamps reads exactly like code that mishandles them. Adding `now`
    // to the name pattern above made that concrete: it reported
    // `tools/board/page.mjs:90`, a JSDoc line describing the board's
    // `before_hours` filter as `ts < now - B hours`, as a timestamp ordered
    // as text. The `//` strip below never reached it. One line of prose
    // cleared, no finding lost, measured over all 465 tracked sources.
    if (/^\s*\*/.test(text)) return
    const bare = text.replace(/\/\/.*$/, '')
    // REFUSAL_AS_ORDER IS CHECKED BEFORE THE REPAIRED-SITE SKIP BELOW, AND
    // THAT ORDER IS THE WHOLE FINDING (exo, 2026-11-09).
    //
    // The skip below clears any line that calls one of the ten family
    // functions, on the reasoning that such a line is repaired. Two of the
    // ten — `compareDays` and `compareInstants` — answer `null` for a value
    // they will not place, and `Array.prototype.sort` coerces `null` to `0`,
    // which reads as "equal". So a comparator that refuses every row produces
    // an unsorted array and raises nothing. That hazard is written out twice
    // in this module's own docblocks, as the stated reason `sortByDay` and
    // `sortByInstant` exist — and the skip below granted it immunity,
    // because the skip is keyed on the NAME of the fix.
    //
    // The general shape, which is the part that outlives this pattern: A
    // LINT'S CLEAN-SITE EXEMPTION IS A CLAIM THAT THE FIX CANNOT BE MISUSED.
    // Key it on the call's shape, never on the callee's name, whenever the
    // callee has a refusal value its caller can consume as an answer. The
    // same shape, found in the same pass, is `nowDay` in
    // tools/seat/read-dates.mjs: it reached for `timestampShape` — the one
    // day predicate in this module that decides a shape and not an existence
    // — and so bypassed `parseDay`, the member added to refuse `2026-02-30`.
    // Two instances, one cause: reaching for a member of the repaired family
    // is not the same as being repaired.
    const refused = /\.sort\s*\([\s\S]*?\b(compareDays|compareInstants)\s*\(/.exec(bare)
    if (refused) {
      out.push({
        code: 'REFUSAL_AS_ORDER',
        line,
        text: text.trim(),
        repair: `${refused[1]} answers null for a value it will not place, and Array.prototype.sort coerces null to 0, so a refused row reads as equal and the array comes back in input order with no error. Use ${refused[1] === 'compareDays' ? 'sortByDay(rows, key)' : 'sortByInstant(rows, key)'}, which keeps unplaceable rows and sorts them last; use the comparator only where you can read the null`
      })
      return
    }
    // The day five are listed beside the instant five as of 2026-11-09, so a
    // site repaired with `compareDays` is clean for the same reason a site
    // repaired with `compareInstants` is. Without them the lint would have gone
    // on reporting the very line its own repair text now prescribes.
    if (/\b(?:parseInstant|compareInstants|isAfter|isBefore|utcDay|sortByInstant|parseEpochSeconds|toUtcInstant|parseDay|compareDays|isDayAfter|isDayBefore|sortByDay)\s*\(/.test(bare)) return
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
        repair: `instants: isAfter/isBefore/compareInstants. Bare days ('2026-11-09'): isDayAfter/isDayBefore/compareDays, since the instant three refuse a day and answer null, false, false. '${relational[2]}' between two timestamp strings compares spellings, not instants`
      })
      return
    }
    const compared = /([A-Za-z_$][A-Za-z0-9_$.?\[\]'"]*)\.localeCompare\(\s*([A-Za-z_$][A-Za-z0-9_$.?\[\]'"]*)/.exec(bare)
    if (compared && TIMESTAMP_NAME.test(compared[1]) && TIMESTAMP_NAME.test(compared[2])) {
      out.push({
        code: 'TEXTUAL_ORDER',
        line,
        text: text.trim(),
        repair: 'instants: sortByInstant(rows, key). Bare days (\'2026-11-09\'): sortByDay(rows, key), since sortByInstant refuses a day and would sort every row last in input order. localeCompare orders spellings, and git and the GitHub API spell the same instant differently'
      })
    }
  })
  return out
}
