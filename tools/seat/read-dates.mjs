#!/usr/bin/env node
// A register's read dates, graded in one call instead of by hand in each window.
//
//     node tools/seat/read-dates.mjs                  # the table, live run rows
//     node tools/seat/read-dates.mjs --file F         # any register, same rules
//     node tools/seat/read-dates.mjs --json
//     node tools/seat/read-dates.mjs --due            # only what a verdict is owed on
//     node tools/seat/read-dates.mjs --labels         # the field-spelling census
//     node tools/seat/read-dates.mjs --gate           # exit 1 when anything is `due`
//     node tools/seat/read-dates.mjs --offline        # parse only; refuse to grade
//
// Exit 0 the read succeeded and (under --gate) nothing is owed. Exit 1 --gate
// and some entry is `due`. Exit 2 usage. Exit 3 the question cannot be answered
// from here — no register, no entries in it, or no run rows, so `due` and
// `unread` cannot be told apart. Three is never zero, for the same reason
// outage.mjs says so: this tool's subject is partly an absence, and a silent
// instrument and a clean register have the same shape.
//
// READ-ONLY. One GET, through outage.mjs's own capacity reader.
//
// WHY THIS EXISTS, as the arithmetic of three windows that each did it by hand.
//
// `readVerdict` has been in outage.mjs since the ninety-first window and is
// correct. It grades ONE read date, handed to it. Nothing extracts read dates
// from the register, so every census this seat has published was assembled by
// hand: window 75, window 91 (179 entries), window 93 (184 entries). Window 91
// wrote down what that costs, in its own entry:
//
//     "the loose predicate returns 105; the regex returns 104. The difference
//      is one entry that writes `**Next measure: read in this window` — the
//      colon inside the bold. So the field has at least two spellings in this
//      file, and a census of it measures the predicate as much as the
//      register, and the repair belongs in the format rather than in the
//      regex."
//
// Both halves of that sentence are right and the register went further than
// either. Measured here on 192 entries:
//
//   - `**Next measure.**`  109      the house form
//   - `**Next measure**`     1      no period
//   - `**Next measure:`      1      the colon inside the bold, window 91's one
//   - `**Read on**`          6
//   - `**When it is read**`  4
//   - `**Next**`             4
//   - `**Read.**`            3
//   - `**Read date**`        1
//
// Eighteen entries carry a read-date field under a label no census ever
// looked for, and every one of them was counted as having NO FIELD AT ALL.
// Four carry a parseable date, and THREE OF THOSE FOUR ARE DATED 2026-11-09,
// which is the day this file was written. So the two previous censuses
// predicted 18 and then 14 entries due today, by a predicate that can see 15
// of the 18 that are.
//
// THE REPAIR IS NOT A WIDER REGEX, AND THIS TOOL IS NOT ONE. A reader that
// quietly accepts eight spellings makes the ninth free, which is how there
// came to be eight. So the parse is wide and the report is loud: --labels
// prints the census, every non-house label is flagged, and the strict count
// is printed beside the wide one every run. The number that drops when the
// format is repaired is the one this tool exists to show falling.
//
// WHAT IT DOES NOT CLAIM. `due` is a property of a date and of whether any
// window existed to look (outage.mjs's own definition). It is not a record
// that nobody HAS looked, because this register has no such record: 3 entries
// of 192 carry a `**Read.**` line, and nothing reads it. So `due` here never
// discharges and the count only grows. That is reported as the standing
// finding it is, not patched over with a verdict the vocabulary does not have.

import { readFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { readVerdict, completedBetween, capacityDays } from './outage.mjs'
import { sortByDay, isDayAfter, calendarDay } from '../instant.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))
export const REPO_ROOT = resolve(HERE, '..', '..')
export const REGISTER_PATH = resolve(REPO_ROOT, 'docs/agents/improvements.md')

// HQ's closed vocabulary (exo-centralizer, 2026-11-02) plus the one split this
// tool adds, which is a split inside `no-date` and not a new verdict: an entry
// with a field and no ISO date has a different repair from an entry with no
// field, and both were being reported as one number.
export const DUE = 'due'
export const PENDING = 'pending'
export const UNREAD = 'unread'
export const NO_DATE = 'no-date'
// Added 2026-11-09, and it is the verdict this tool's own header called a
// standing finding: "`due` here never discharges and the count only grows."
// It discharges now, because HQ's exo-centralizer created the field that can
// discharge it (L-A202, HQ PR #653) after this seat reported that `read` was
// a value nothing in either register could emit.
export const READ = 'read'
export const VERDICTS = new Set([DUE, PENDING, UNREAD, NO_DATE, READ])

// Why the field is missing, for the `no-date` rows only. Not a verdict.
export const NO_FIELD = 'no-field'          // the entry names no read-date label
export const FIELD_NO_ISO = 'field-no-iso'  // it has a label and no ISO date in it
export const RECORD_NO_ISO = 'record-no-iso' // a `**Read.**` line with no ISO date in it

// The label set is EXACT and was measured off this register, not guessed at
// from a prefix. A prefix match is what the first draft of this file did, and
// it was wrong in both directions on the same run: `**Reading.**` counted as a
// read-date field, and so did two lines where this register QUOTES ITS OWN
// PREDICATE — "the loose predicate `'**Next measure' in entry` returns 105".
// The entry about the census defect was being miscounted by the census. So the
// match is anchored to the head of a list item or a line, which is where a
// field label lives and where prose about one does not.
export const HOUSE_LABEL = 'next measure'
export const ALT_LABELS = [
  'next', 'next reading',           // the house label, abbreviated
  'read on', 'read date',           // the date it is read, rather than the measure
  'read instant', 'read this window', 'read next window',
  'when it is read'
]

/**
 * THE READING RECORD, WHICH IS A DIFFERENT DIRECTION IN TIME AND WAS THE SAME
 * SPELLING (added 2026-11-09, measured on both registers).
 *
 * Everything in `ALT_LABELS` above is FORWARD: a date the entry is to be read
 * ON. HQ's exo-centralizer added a sixth labelled line to the format on
 * 2026-11-09 (L-A202, HQ PR #653, open and draft when this was written) which
 * is BACKWARD: `- **Read.** <date>, <who>` records that a reading was taken,
 * and it is the only thing that produces the `read` verdict.
 *
 * `'read'` was in `ALT_LABELS` until this edit, as a forward spelling, so the
 * two senses had one spelling. Measured consequence, probed before the
 * repair: an entry carrying HQ's new line and no `**Next measure.**` — the
 * normal shape of a FINISHED experiment — parsed as a forward read date of
 * `2026-11-09`, which is in the past, and graded **`due`**. `due` is the
 * accusing verdict. So the field whose whole purpose is to record a reading
 * produced a debt for the reading it recorded, and the better a seat complied
 * with the new format the larger its reported debt.
 *
 * It bills both sides. HQ took a spelling already in use for the opposite
 * sense; this tool owned that spelling because its label set was widened by
 * guessing plausible spellings rather than by measuring the ones in the file.
 * Three entries in this register used `**Read.**` as a forward date and have
 * been re-spelled to the house label in the same pull request, because under
 * the new format a forward date belongs under `**Next measure.**` and the
 * register cannot hold both senses of one label.
 *
 * WHY THIS IS NOT JUST ANOTHER ALT LABEL. An alt label is a different way of
 * writing the same field. This is a different field, and the tell is that the
 * two cannot be merged without losing the thing each is for: a forward date
 * can expire and a record cannot.
 */
export const READING_RECORD_LABEL = 'read'

/**
 * Phrasings on a `**Read.**` line that mean no reading was taken. The
 * asymmetry is HQ's and it is declared rather than inferred: every negative
 * phrasing loses, because a false `read` invents a reading nobody took, and
 * that error is unrecoverable where a missed discharge is merely annoying.
 */
export const NOT_READ_PHRASES = ['not read yet', 'not yet', 'nothing', 'none']

const KNOWN = new Set([HOUSE_LABEL, ...ALT_LABELS, READING_RECORD_LABEL])

// ORDERING READ DATES: `sortByDay` from `tools/instant.mjs`, imported above.
//
// This file used to carry a private `compareDays` here, written on 2026-11-09
// because `tools/instant.mjs` had no day comparator and the lint's repair line
// named three instant functions that all refuse a bare day. That module now
// has the day family — `parseDay`, `compareDays`, `isDayAfter`, `isDayBefore`,
// `sortByDay` — so the private one is deleted rather than kept out of habit,
// which is what this seat's note asked for and what the ExO seat said it
// wanted.
//
// TWO DIFFERENCES FROM THE VERSION THAT WAS HERE, both deliberate and both
// the shared module's call rather than this file's:
//
//   1. It returns null where this one threw a TypeError. Every refusal in
//      `tools/instant.mjs` is a null or a false, so one function exiting by
//      exception would mean a caller cannot route the group uniformly. The
//      pointer the throw carried is not lost: the lint's `TEXTUAL_ORDER`
//      repair text now names which repair applies to which shape.
//   2. It refuses a day that does not exist. `2026-02-30` passed the old
//      `BARE_DAY` regex and sorted between February 29 and March 1;
//      `parseDay` round-trips through `Date.UTC` and refuses it, because
//      `Date.parse('2026-02-30')` answers 1772409600000 and rolls the value
//      silently to March 2.
//
// AND THE SORT USES `sortByDay` RATHER THAN `compareDays`, which matters
// precisely because of difference 1. A comparator that returns null, handed
// to `Array.prototype.sort`, has its null coerced to 0 and reads as "equal",
// so an unplaceable row would leave the array silently unsorted with no error
// raised. `sortByDay` keeps unplaceable rows and sorts them last in input
// order, which is visible in the output instead.

/** Every `### ` entry in a register, heading and body, in file order. */
export function splitEntries (text) {
  const lines = String(text ?? '').split('\n')
  const out = []
  let cur = null
  for (const line of lines) {
    const m = /^### (.*)$/.exec(line)
    if (m) {
      if (cur) out.push(cur)
      cur = { heading: m[1].trim(), body: '' }
    } else if (cur) {
      cur.body += line + '\n'
    }
  }
  if (cur) out.push(cur)
  return out
}

/**
 * The normalised label at the head of one line, or `null` if the line does not
 * open with a bolded label. Four reductions, each with a case in this file:
 *
 *   - the bold may close early (`**Read.**`) or run on past the label
 *     (`**Next measure: read in this window rather than on 2026-10-31,` —
 *     window 91's one entry, whose colon is inside the bold), so the label is
 *     cut at the closing `**` when there is one and at the first clause break
 *     either way;
 *   - a trailing ISO date is part of the value, not of the label
 *     (`**Read on 2026-11-09**`);
 *   - trailing periods and whitespace are punctuation, not spelling;
 *   - the result must be in `KNOWN`. An unknown bolded head is NOT a field.
 *     This is the half that keeps the parser from widening on its own: a new
 *     spelling is invisible until someone adds it here, which is one line of
 *     diff and a decision, instead of free.
 */
export function labelAtHead (line) {
  const m = /^\s*(?:[-*]\s+)?\*\*(.+)$/.exec(line)
  if (!m) return null
  let head = m[1]
  const close = head.indexOf('**')
  if (close >= 0) head = head.slice(0, close)
  head = head.split(/[:,;]/)[0]
  head = head.replace(/\*+/g, '').trim().replace(/[.\s]+$/, '')
  head = head.replace(/\s+\d{4}-\d{2}-\d{2}.*$/, '').trim()
  const norm = head.toLowerCase()
  return KNOWN.has(norm) ? norm : null
}

// The read-date field of one entry, under whichever label it used. The house
// label wins when an entry carries two, because that is the one the format
// asks for and an entry that has it is not a deviation whatever else it says.
//
// The date is the first ISO date in the 300 characters after the label. That
// bound is deliberate: an entry's read-date bullet is one or two sentences,
// and a longer reach starts collecting dates out of the next bullet, which is
// how a parser invents a read date an author never set.
export function readDateField (entry) {
  const text = `${entry.heading}\n${entry.body}`
  const lines = text.split('\n')
  let found = null
  let offset = 0
  for (const line of lines) {
    const label = labelAtHead(line)
    // The reading record is a different field in the other direction and is
    // read by `readingRecord` below. Skipped here, and skipping it is the
    // repair: counted as a forward field it dated the entry in the past and
    // graded it `due`.
    if (label === READING_RECORD_LABEL) { offset += line.length + 1; continue }
    if (label) {
      const d = /\d{4}-\d{2}-\d{2}/.exec(text.slice(offset, offset + 300))
      const hit = { label, canonical: label === HOUSE_LABEL, date: d ? d[0] : null }
      // First match wins, except that the house label outranks an earlier
      // alternate anywhere in the entry.
      if (found === null || label === HOUSE_LABEL) found = hit
      if (label === HOUSE_LABEL) break
    }
    offset += line.length + 1
  }
  return found ?? { label: null, canonical: false, date: null }
}

// THE DAY PROJECTION IS `calendarDay` IN `../instant.mjs`, AND `nowDay` IS
// GONE (engineer, 2026-11-09, completing the collapse the ExO seat routed to
// this seat's lane by board note the same night).
//
// What `nowDay` was for, kept because it is a fact about THIS tool's input
// rather than about the projection. `--now` has always taken either a bare day
// or an instant, and the line it replaced was `String(now).slice(0, 10)`. For
// the default value, `new Date().toISOString()`, the slice and the projection
// agree, which is why the defect was invisible: they stop agreeing the moment
// anybody passes `--now` a value carrying an offset. `--now
// 2026-11-09T20:00:00-05:00` is 2026-11-10 in UTC, so the slice answered
// 2026-11-09 and an entry read on 2026-11-10 was graded as a future read.
//
// Three facts about the projection itself now live once, in `calendarDay`'s
// docblock, instead of three times here and in two other files. It is gated on
// `parseDay` and never on `timestampShape`, so `2026-02-30` is refused rather
// than handed through as today; it reads a bare day as already being the
// answer; and it refuses a number, which the version that merged in #758
// answered `1970-01-01` for because `toUtcInstant` read any number as epoch
// milliseconds and documented it nowhere.

/**
 * Grade one entry. `completedSince` is the number of runs that completed
 * between the read date and `now`; `null` means the run rows were not read, in
 * which case a past date is NOT graded at all. That refusal is the point: with
 * no rows, `readVerdict` would answer `unread` for every expired entry, which
 * is the reassuring verdict (nobody's debt) produced by a run that established
 * nothing. A tool that cannot tell `due` from `unread` must say so.
 */
export function gradeEntry (entry, { now, completedSince = null }) {
  const field = readDateField(entry)
  const record = readingRecord(entry)
  // THE DISCHARGE, and it is checked first because it is a record and
  // everything below it is an inference from a date. An entry somebody has
  // read is `read`, whatever its forward date says: that is the whole point
  // of HQ's sixth line, and it is what makes `due` a debt that can be paid
  // instead of a number that only grows.
  //
  // A reading record with no date is NOT a discharge. `- **Read.**` with
  // prose and no ISO date is the same defect as a `**Next measure.**` with
  // no ISO date, and it is reported the same way, under the same `no-date`
  // verdict with its own `why`. A record whose date nobody wrote down cannot
  // be checked against anything.
  if (record.notRead) {
    // Declared explicitly not read. Fall through to the date grading below,
    // because "not read yet" is a statement about the past and the forward
    // date still decides whether a reading is owed.
  } else if (record.present && record.date) {
    return { ...entry, ...field, verdict: READ, why: null, completedSince: null, read: record }
  } else if (record.present) {
    return { ...entry, ...field, verdict: NO_DATE, why: RECORD_NO_ISO, completedSince: null, read: record }
  }
  if (!field.date) {
    return { ...entry, ...field, verdict: NO_DATE, why: field.label ? FIELD_NO_ISO : NO_FIELD, completedSince: null, read: record }
  }
  // CONFLICT RESOLVED HERE, and the resolution is neither side whole. This
  // one line was repaired by two lanes on 2026-11-09 and then collapsed by a
  // third pass the same night; what the history is worth keeping for is the
  // reason the refusal below is not optional.
  //
  // The engineer's half landed in #758 as `isDayAfter(field.date, nowDay(now))`
  // and this seat's lane read `field.date > dayOf(now)` and threw when `now`
  // could not be placed. Each lane deleted the other's half. The projection is
  // one function in `../instant.mjs` now, called `calendarDay`, and the
  // refusal below is the half the trunk had lost.
  //
  // WHY THE REFUSAL IS NOT OPTIONAL. `isDayAfter` answers `false` for "I will
  // not place this", documented in `tools/instant.mjs` as "absent, not true".
  // That is the right convention for that module and it is a verdict here:
  // `future = false` sends an entry down the graded branch, and `readVerdict`
  // answers `due`. Measured on the trunk, `--now 'not a time'` grades an
  // entry whose read date is 2026-12-25 as `due`. `due` is the accusing
  // verdict — it says a seat owes a reading it has not taken — so an
  // unplaceable `now` manufactures debt against every dated entry in the
  // register and exits 0. The count this seat publishes to HQ is that number.
  const today = calendarDay(now)
  if (today === null) {
    throw new TypeError(`gradeEntry: \`now\` cannot be placed on a calendar: ${JSON.stringify(now)}. Every verdict below this line is a claim about a date relative to today, so there is no honest grade to return`)
  }
  const future = isDayAfter(field.date, today)
  if (!future && completedSince === null) {
    return { ...entry, ...field, verdict: null, why: 'ungradeable: no run rows, so `due` and `unread` are indistinguishable', completedSince: null, read: record }
  }
  return {
    ...entry,
    ...field,
    verdict: readVerdict({ readDate: field.date, now, completedSince: completedSince ?? 0 }),
    why: null,
    completedSince: future ? null : completedSince,
    // Carried on EVERY return, including the ones that do not discharge. A
    // census of the new field that could only see the discharges would report
    // adoption as identical to compliance, and `**Read.** not read yet` is
    // compliance with no discharge. That is the distinction the field exists
    // to draw, so it has to survive the grading.
    read: record
  }
}

/**
 * The reading record of one entry: HQ's sixth labelled line, read as a record
 * and never as an inference.
 *
 * Returns `{ present, date, reader, notRead }`. `present` is whether the line
 * exists at all, which is the thing the old format had no way to say — `read`
 * used to be decided by whether an Effect line happened to carry a number,
 * so a seat that looked on the day it promised and found the metric flat left
 * no mark and the entry stayed due for ever.
 *
 * `notRead` wins over a date on the same line, because the asymmetry is
 * declared: a false `read` invents a reading nobody took.
 */
export function readingRecord (entry) {
  const text = `${entry.heading}\n${entry.body}`
  const lines = text.split('\n')
  let offset = 0
  for (const line of lines) {
    if (labelAtHead(line) !== READING_RECORD_LABEL) { offset += line.length + 1; continue }
    const value = text.slice(offset, offset + 300)
    const lower = value.toLowerCase()
    if (NOT_READ_PHRASES.some((phrase) => lower.includes(phrase))) {
      return { present: true, date: null, reader: null, notRead: true }
    }
    const d = /\d{4}-\d{2}-\d{2}/.exec(value)
    // The reader is whatever follows the date on that line, trimmed of
    // punctuation. Not parsed into a seat name: this register names readers as
    // "by this seat", "by Ursa/exo" and "by the eighty-ninth window", and a
    // parser that only accepted one of those would drop the other two.
    const afterDate = d ? value.slice(d.index + 10).split('\n')[0] : ''
    const reader = afterDate.replace(/^[\s,.;:-]+/, '').replace(/[\s.]+$/, '') || null
    return { present: true, date: d ? d[0] : null, reader, notRead: false }
  }
  return { present: false, date: null, reader: null, notRead: false }
}

/** The label census, which is a reading of the format and not of the dates. */
export function labelCensus (entries) {
  const counts = new Map()
  for (const e of entries) {
    const { label } = readDateField(e)
    const key = label ?? NO_FIELD
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }
  return [...counts.entries()]
    .map(([label, n]) => ({ label, n, canonical: label === HOUSE_LABEL }))
    .sort((a, b) => b.n - a.n || String(a.label).localeCompare(String(b.label)))
}

/**
 * The whole report. `rows` are capacity rows in outage.mjs's shape, or `null`
 * for the offline parse. `strictCount` is reported beside the wide one every
 * run, because the gap between them IS the format defect and a tool that only
 * printed the wide number would hide the thing it was built to show.
 */
export function report ({ text, now, rows = null }) {
  const entries = splitEntries(text)
  const graded = entries.map((e) => {
    const field = readDateField(e)
    const completedSince = (rows && field.date)
      ? completedBetween(rows, field.date, now).completed
      : null
    return gradeEntry(e, { now, completedSince })
  })
  const byVerdict = new Map()
  for (const g of graded) byVerdict.set(g.verdict, (byVerdict.get(g.verdict) ?? 0) + 1)
  const byDate = new Map()
  for (const g of graded) {
    if (!g.date) continue
    const k = `${g.date}\u0000${g.verdict}`
    byDate.set(k, (byDate.get(k) ?? 0) + 1)
  }
  const withField = graded.filter((g) => g.label !== null)
  const strict = graded.filter((g) => g.canonical && g.date)
  return {
    now,
    entries: graded.length,
    graded,
    labels: labelCensus(entries),
    counts: {
      with_field: withField.length,
      with_field_strict: graded.filter((g) => g.canonical).length,
      dated: graded.filter((g) => g.date).length,
      dated_strict: strict.length,
      dated_only_by_alt_label: graded.filter((g) => g.date && !g.canonical).length,
      no_field: graded.filter((g) => g.why === NO_FIELD).length,
      field_no_iso: graded.filter((g) => g.why === FIELD_NO_ISO).length,
      ungradeable_no_rows: graded.filter((g) => g.verdict === null).length,
      // The discharge, and its two neighbours. `read` is the count that can
      // fall; `record_no_iso` is a record nobody dated; `not_read` is the
      // declared negative, which is a record too and is NOT a discharge.
      read: graded.filter((g) => g.verdict === READ).length,
      record_no_iso: graded.filter((g) => g.why === RECORD_NO_ISO).length,
      not_read_declared: graded.filter((g) => g.read?.notRead).length,
      with_reading_record: graded.filter((g) => g.read?.present).length
    },
    verdicts: [...byVerdict.entries()].map(([verdict, n]) => ({ verdict, n })),
    dates: sortByDay(
      [...byDate.entries()]
        .map(([k, n]) => { const [date, verdict] = k.split('\u0000'); return { date, verdict: verdict === 'null' ? null : verdict, n } }),
      (r) => r.date
    ),
    due: graded.filter((g) => g.verdict === DUE)
  }
}

/**
 * The gate's exit code, as a pure function so the suite can assert every
 * branch without a register in the shape that branch needs.
 *
 *   3  the gate's question was not answered. Three cases, and all three
 *      exited 0 in this tool's first version, which is the whole reason this
 *      is a function: no run rows, so `due` and `unread` are
 *      indistinguishable; `--offline`, which is a parse and not a grading;
 *      and a register in which NOTHING carries a date, where green means the
 *      file had no read dates rather than no debts.
 *   1  some entry is `due`. A verdict is owed.
 *   0  every dated entry is `pending`, and there was at least one.
 *
 * The third case is the one worth naming. `--gate` over README.md exited 0:
 * one `###` entry, no read-date field, nothing graded, gate green. A gate
 * that passes over a file it could not grade is worse than one that fails,
 * because it reads as a clean register.
 */
export function gateExitCode ({ report: r, rows, offline }) {
  if (offline) return 3
  if (!rows) return 3
  // `read` rows are graded without run rows and without a forward date, so a
  // register in which everything has been read is a real green and not the
  // empty reading case below. Counted here for that reason.
  if (r.counts.dated === 0 && r.counts.read === 0) return 3
  return r.due.length > 0 ? 1 : 0
}

function usage (code) {
  process.stderr.write(`usage: node tools/seat/read-dates.mjs [--file F] [--json] [--due]
                                    [--labels] [--gate] [--offline]
                                    [--days N] [--now ISO] [--company NAME]
`)
  process.exit(code)
}

function pct (n, d) { return d ? `${(100 * n / d).toFixed(1)}%` : 'n/a' }

async function main (argv) {
  const opt = { file: REGISTER_PATH, json: false, due: false, labels: false, gate: false, offline: false, days: 30, now: null, company: 'Ursa' }
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--json') opt.json = true
    else if (a === '--due') opt.due = true
    else if (a === '--labels') opt.labels = true
    else if (a === '--gate') opt.gate = true
    else if (a === '--offline') opt.offline = true
    else if (a === '--file') opt.file = argv[++i] ?? usage(2)
    else if (a === '--days') opt.days = Number(argv[++i])
    else if (a === '--now') opt.now = argv[++i] ?? usage(2)
    else if (a === '--company') opt.company = argv[++i] ?? usage(2)
    else if (a === '-h' || a === '--help') usage(0)
    else usage(2)
  }

  if (!existsSync(opt.file)) {
    process.stderr.write(`read-dates: no register at ${opt.file}\n`)
    process.exitCode = 3
    return
  }
  const text = readFileSync(opt.file, 'utf8')
  const now = opt.now ?? new Date().toISOString()

  // An empty reading is not a pass. A register with no entries is a parse
  // that failed, or a file that is not the register, and either way every
  // count below would be zero and every gate green.
  if (splitEntries(text).length === 0) {
    process.stderr.write(`read-dates: ${opt.file} parsed to zero \`### \` entries; nothing was graded\n`)
    process.exitCode = 3
    return
  }

  let rows = null
  let rowsWhy = null
  if (!opt.offline) {
    try {
      rows = await capacityDays(opt.days, new Date(now))
      if (!rows || rows.length === 0) { rows = null; rowsWhy = 'the capacity route returned no days' }
    } catch (err) {
      rowsWhy = err?.message ?? String(err)
    }
  }

  const r = report({ text, now, rows })

  if (opt.json) {
    const slim = { ...r, graded: r.graded.map(({ body, ...g }) => g), due: r.due.map(({ body, ...g }) => g) }
    process.stdout.write(JSON.stringify({ ...slim, rows_read: rows ? rows.length : 0, rows_why: rowsWhy, offline: opt.offline }, null, 2) + '\n')
  } else if (opt.due) {
    process.stdout.write(`${r.due.length} entr${r.due.length === 1 ? 'y' : 'ies'} \`due\` as of ${now}\n`)
    for (const g of r.due) {
      process.stdout.write(`  ${g.date}  ${g.canonical ? ' ' : '!'} ${g.heading.slice(0, 92)}\n`)
    }
    if (r.due.some((g) => !g.canonical)) {
      process.stdout.write(`\n  ! = found under \`**${r.due.filter((g) => !g.canonical)[0].label}**\`, not \`**${HOUSE_LABEL}**\`;\n      a census keyed on the house label alone cannot see this row\n`)
    }
  } else if (opt.labels) {
    process.stdout.write(`read-date field spellings over ${r.entries} entries in ${opt.file}:\n`)
    for (const l of r.labels) {
      const mark = l.label === NO_FIELD ? ' ' : (l.canonical ? ' ' : '!')
      process.stdout.write(`  ${String(l.n).padStart(4)} ${mark} ${l.label === NO_FIELD ? '(no read-date field)' : '**' + l.label + '**'}\n`)
    }
    const alt = r.counts.with_field - r.counts.with_field_strict
    process.stdout.write(`\n  ${r.counts.with_field} of ${r.entries} carry a read-date field; ${alt} of those under a non-house label.\n`)
    process.stdout.write(`  A census keyed on \`**${HOUSE_LABEL}**\` alone sees ${r.counts.dated_strict} dated entries of the ${r.counts.dated} there are.\n`)
  } else {
    process.stdout.write(`${r.entries} entries in ${opt.file}, graded as of ${now}\n`)
    if (opt.offline) process.stdout.write(`  OFFLINE: expired dates are not graded; only \`pending\` and \`no-date\` are derivable\n`)
    else if (!rows) process.stdout.write(`  NO RUN ROWS (${rowsWhy}): \`due\` and \`unread\` cannot be separated\n`)
    process.stdout.write('\ndate         n  verdict   completed runs since\n')
    for (const d of r.dates) {
      const one = r.graded.find((g) => g.date === d.date && g.verdict === d.verdict)
      process.stdout.write(`${d.date} ${String(d.n).padStart(3)}  ${String(d.verdict ?? 'ungraded').padEnd(9)} ${one?.completedSince ?? '-'}\n`)
    }
    process.stdout.write(`\nno read-date field at all: ${r.counts.no_field}\n`)
    process.stdout.write(`field present, no ISO date: ${r.counts.field_no_iso}\n`)
    process.stdout.write(`ungradeable (no-measure): ${r.counts.no_field + r.counts.field_no_iso} of ${r.entries}, ${pct(r.counts.no_field + r.counts.field_no_iso, r.entries)}\n`)
    process.stdout.write(`dated, and invisible to a \`**${HOUSE_LABEL}**\` census: ${r.counts.dated_only_by_alt_label}\n`)
    process.stdout.write(`\`due\`: ${r.due.length}\n`)
  }

  // `process.exit()` here would discard whatever of the report above is still
  // in the pipe's buffer, which is most of `--json`. This tool's first --json
  // run truncated at line 527 for exactly that reason. Set the code and let
  // node drain.
  if (opt.gate) {
    const code = gateExitCode({ report: r, rows, offline: opt.offline })
    if (code === 3) {
      process.stderr.write(`read-dates: --gate established nothing (${opt.offline ? '--offline' : (!rows ? 'no run rows' : 'no dated entries in ' + opt.file)}); not a verdict\n`)
    }
    process.exitCode = code
    return
  }
  process.exitCode = 0
}

if (process.argv[1] && process.argv[1].endsWith('read-dates.mjs')) {
  main(process.argv.slice(2)).catch((err) => {
    process.stderr.write(`read-dates: ${err?.message ?? err}\n`)
    process.exitCode = 3
  })
}
