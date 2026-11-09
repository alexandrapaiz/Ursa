// node --test tools/seat/read-dates.test.mjs
//
// Five kinds of test, and the controls are the half that can fail honestly.
//
// "bound:"   every verdict this tool emits is in HQ's closed vocabulary. A
//            reader that invents a sixth word breaks the console that parses
//            the register, so the set is asserted and not trusted.
// "shape:"   the spellings that are actually in the register, each with the
//            reduction it needs. These are the cases the first draft got wrong.
// "control:" the rule for this directory, from runner-facts: an absence is a
//            measurement and it needs a positive control. A tool that grades a
//            register by looking for a field passes every assertion below by
//            finding the field everywhere, or by finding it nowhere, so each
//            claim is paired with the fixture that must NOT trip it. The four
//            that matter: a prose quotation of the field's own name is not an
//            instance of the field; a bolded word that merely starts with
//            "Read" is not the field; with no run rows the tool refuses to
//            grade rather than answering `unread` for everything; and the live
//            register must parse to something, so a pass over nothing is
//            impossible.
// "live:"    read off the committed register, offline. Growth-sensitive numbers
//            are asserted as floors with the measurement dated beside them,
//            because this file grows every window and a frozen equality would
//            fail on the next append for no defect.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { compareInstants, isAfter, isBefore, compareDays, parseDay } from '../instant.mjs'
import {
  splitEntries, labelAtHead, readDateField, gradeEntry, labelCensus, report,
  REGISTER_PATH, HOUSE_LABEL, ALT_LABELS, VERDICTS, NO_FIELD, FIELD_NO_ISO, gateExitCode,
  nowDay, readingRecord, READING_RECORD_LABEL, NOT_READ_PHRASES, RECORD_NO_ISO, READ
} from './read-dates.mjs'

// The capacity rows this organization actually had, which is outage.test.mjs's
// fixture extended by the two days since. Six dark days, then a recovery.
const ROWS = [
  { day: '2026-10-31', attempted: 46, completed: 0, refused: 46 },
  { day: '2026-11-01', attempted: 114, completed: 45, refused: 63 },
  { day: '2026-11-02', attempted: 476, completed: 349, refused: 82 },
  { day: '2026-11-03', attempted: 53, completed: 0, refused: 53 },
  { day: '2026-11-04', attempted: 42, completed: 0, refused: 42 },
  { day: '2026-11-05', attempted: 42, completed: 0, refused: 42 },
  { day: '2026-11-06', attempted: 43, completed: 0, refused: 43 },
  { day: '2026-11-07', attempted: 38, completed: 0, refused: 38 },
  { day: '2026-11-08', attempted: 70, completed: 29, refused: 39 },
  { day: '2026-11-09', attempted: 22, completed: 8, refused: 0 }
]
const NOW = '2026-11-09T00:48Z'
const entry = (heading, body) => ({ heading, body })

test('bound: every verdict is in the closed vocabulary, and `no-date` carries its reason separately', () => {
  const fixtures = [
    entry('a', '- **Next measure.** 2026-11-15.\n'),
    entry('b', '- **Next measure.** 2026-11-03.\n'),
    entry('c', '- **Next measure.** when it is read.\n'),
    entry('d', '- **Effect.** nothing about reading.\n')
  ]
  const got = fixtures.map((e) => gradeEntry(e, { now: NOW, completedSince: 40 }))
  for (const g of got) assert.ok(VERDICTS.has(g.verdict), `${g.verdict} is not in the vocabulary`)
  assert.deepEqual(got.map((g) => g.verdict), ['pending', 'due', 'no-date', 'no-date'])
  // The two `no-date` rows have different repairs, and every census before this
  // tool reported them as one number.
  assert.equal(got[2].why, FIELD_NO_ISO)
  assert.equal(got[3].why, NO_FIELD)
})

test('control: `unread` and `due` are still separated by the run count alone, through this reader', () => {
  const e = entry('x', '- **Next measure.** 2026-11-03.\n')
  assert.equal(gradeEntry(e, { now: '2026-11-07', completedSince: 0 }).verdict, 'unread')
  assert.equal(gradeEntry(e, { now: '2026-11-09', completedSince: 37 }).verdict, 'due')
})

test('control: with no run rows the tool refuses to grade an expired date instead of calling it `unread`', () => {
  // This is the branch that matters most and it is the easy one to get wrong.
  // `readVerdict` answers `unread` when `completedSince` is 0, and "no rows
  // were read" is not the same fact as "zero runs completed". Falling through
  // would make every expired entry in the register read as nobody's debt,
  // which is the reassuring answer produced by a run that established nothing.
  const e = entry('x', '- **Next measure.** 2026-11-03.\n')
  const g = gradeEntry(e, { now: NOW, completedSince: null })
  assert.equal(g.verdict, null)
  assert.match(g.why, /indistinguishable/)
  // A FUTURE date needs no rows, so it is still graded. The refusal is scoped
  // to the question the rows answer and does not spread to the whole file.
  const future = gradeEntry(entry('y', '- **Next measure.** 2026-11-15.\n'), { now: NOW, completedSince: null })
  assert.equal(future.verdict, 'pending')
})

test('control: this register quoting the field\'s own name in prose is not an instance of the field', () => {
  // Verbatim from window 91's entry, which is the entry ABOUT the census
  // defect: the first `**` on this line opens a BACKTICKED QUOTATION of the
  // label, so an unanchored reader reduces it to `next measure` and counts the
  // entry about the defect as an instance of the defect.
  //
  // This control was written once with the preceding line as its fixture, and
  // it passed under an unanchored parser too — the quotation was shadowed by an
  // earlier bold on that line, so the test proved nothing about the anchor it
  // claimed to guard. Mutating the anchor away is what exposed it. The fixture
  // below is the line where the quotation IS the first bold, which is the only
  // version of this case that fails when the guard is removed.
  const quoted = '  difference is one entry that writes `**Next measure: read in this window'
  assert.equal(labelAtHead(quoted), null, 'a quotation of the label is not the label')
  // And the same words at the head of a list item ARE the field, or this test
  // is only proving that the parser rejects the sentence rather than the
  // position.
  assert.equal(labelAtHead('- **Next measure: read in this window rather than on 2026-10-31,**'), HOUSE_LABEL)

  const e = entry('the census has two answers one apart', [
    '  **And the census has two answers one apart.** The loose predicate',
    '  `\'**Next measure\' in entry` returns **105**; the regex returns **104**. The',
    quoted,
    '  rather than on 2026-10-31,` — the colon inside the bold.',
    ''
  ].join('\n'))
  assert.equal(readDateField(e).label, null)
  assert.equal(gradeEntry(e, { now: NOW, completedSince: 40 }).why, NO_FIELD)
})

test('control: a bolded word that merely begins with a label is not the label', () => {
  assert.equal(labelAtHead('- **Reading.** the suite out loud.'), null)
  assert.equal(labelAtHead('- **Read first: the verdicts owed on expired read dates**'), null)
  assert.equal(labelAtHead('- **Next steps for the owner.** three of them.'), null)
  // And the ones that ARE labels still match, or the assertion above is only
  // proving that the parser rejects everything.
  assert.equal(labelAtHead('- **Read.** 2026-11-09 or the first window after this merges.'), 'read')
  assert.equal(labelAtHead('- **Next measure.** 2026-11-15.'), HOUSE_LABEL)
})

test('control: a one-verdict classifier cannot pass, because the fixture spans four', () => {
  const text = [
    '### pending', '- **Next measure.** 2026-11-15.', '',
    '### due', '- **Next measure.** 2026-11-03.', '',
    '### field but no date', '- **Read on.** the first window after this merges.', '',
    '### no field at all', '- **Effect.** it held.', ''
  ].join('\n')
  const r = report({ text, now: NOW, rows: ROWS })
  assert.equal(r.entries, 4)
  assert.deepEqual(r.graded.map((g) => g.verdict), ['pending', 'due', 'no-date', 'no-date'])
  assert.equal(new Set(r.graded.map((g) => g.verdict)).size, 3)
  assert.equal(r.counts.no_field, 1)
  assert.equal(r.counts.field_no_iso, 1)
})

test('shape: all three spellings of the house label parse, including the colon inside the bold', () => {
  assert.equal(labelAtHead('- **Next measure.** 2026-11-15.'), HOUSE_LABEL)
  assert.equal(labelAtHead('- **Next measure** 2026-11-15.'), HOUSE_LABEL)
  // Window 91's one entry, verbatim: the colon is inside the bold and the bold
  // runs on past the label. This is the entry whose absence made the loose and
  // strict predicates differ by one.
  assert.equal(labelAtHead('- **Next measure: read in this window rather than on 2026-10-31,** because'), HOUSE_LABEL)
  assert.equal(labelAtHead('- **Next measure, carried forward.** 2026-11-15.'), HOUSE_LABEL)
})

test('shape: a date inside the label is the value, not part of the spelling', () => {
  const f = readDateField(entry('x', '- **Read on 2026-11-09**, against the condition\'s own outcome.\n'))
  assert.equal(f.label, 'read on')
  assert.equal(f.date, '2026-11-09')
  assert.equal(f.canonical, false)
})

test('shape: the house label outranks an earlier alternate in the same entry', () => {
  const f = readDateField(entry('x', [
    '- **Read on.** whenever.',
    '- **Next measure.** 2026-11-15.',
    ''
  ].join('\n')))
  assert.equal(f.label, HOUSE_LABEL)
  assert.equal(f.date, '2026-11-15')
})

test('control: the date reach stops before the next bullet, so no date is harvested from a neighbour', () => {
  // A parser that read to the end of the entry would hand this row 2026-11-15,
  // a read date its author never set for it, which is worse than no date: a
  // `pending` verdict on an invented date is unfalsifiable from the file.
  const long = 'x'.repeat(320)
  const f = readDateField(entry('x', [
    `- **Next measure.** when the provider stops refusing. ${long}`,
    '- **Effect.** the gate flipped on 2026-11-15.',
    ''
  ].join('\n')))
  assert.equal(f.label, HOUSE_LABEL)
  assert.equal(f.date, null)
})

test('shape: entries are split on `### ` only, and a heading carries its own body', () => {
  const text = ['## Window 93', '### one', 'body one', '#### not an entry', '### two', 'body two'].join('\n')
  const es = splitEntries(text)
  assert.equal(es.length, 2)
  assert.deepEqual(es.map((e) => e.heading), ['one', 'two'])
  assert.match(es[0].body, /not an entry/)
  assert.equal(splitEntries('').length, 0)
})

test('live: the committed register parses to something, so a pass over nothing is impossible', () => {
  // The centralizer's rule, adopted here: one test must fail if the live
  // reading is empty. Every count in this file would be zero and every gate
  // green on a register this tool could not parse, and that is the one failure
  // mode a census cannot report about itself.
  const text = readFileSync(REGISTER_PATH, 'utf8')
  const r = report({ text, now: NOW, rows: ROWS })
  assert.ok(r.entries >= 192, `the register parsed to ${r.entries} entries; 192 were there on 2026-11-09`)
  assert.ok(r.counts.dated >= 115, `${r.counts.dated} dated entries; 115 were there on 2026-11-09`)
})

test('live: nine dated entries are invisible to a census keyed on the house label alone', () => {
  // The finding this tool was built for, measured on the committed file at
  // 2026-11-09T00:48Z: 192 entries, 115 dated, 12 of them dated under a label
  // no previous census looked for. Six of those twelve are dated 2026-11-09,
  // which is why windows 91 and 93 predicted 18 and then 14 entries due today
  // and the true count is 21. Floors, not equalities: the register grows.
  //
  // THE FLOOR MOVED DOWN FROM 12 TO 9, which is the one direction the sentence
  // above says cannot happen, so it carries its cause (exo, 2026-11-09). The
  // three missing entries are this seat's own, and they were re-spelled from
  // `**Read.**` to `**Next measure.**` in the same pull request that moved
  // this number. HQ's exo-centralizer made `**Read.**` the format's sixth
  // labelled line, a BACKWARD record of a reading taken; those three used it
  // as a FORWARD date. One spelling, two directions, and the measured cost of
  // leaving it was that an entry recording its own reading graded `due`.
  //
  // So this floor is not a floor over the same population any more, and a
  // number that moves because its vocabulary narrowed is a different quantity
  // from one that moves because the register grew. Said here rather than
  // silently relaxed, because the next window to see 9 where the comment says
  // 12 would otherwise read it as a parser regression.
  const text = readFileSync(REGISTER_PATH, 'utf8')
  const r = report({ text, now: NOW, rows: ROWS })
  assert.ok(r.counts.dated_only_by_alt_label >= 9,
    `${r.counts.dated_only_by_alt_label} dated entries under a non-house label; 9 on 2026-11-09 after the **Read.** re-spelling, 12 before it`)
  // And the forward sense of `**Read.**` is gone from the register, which is
  // the condition that makes the line above safe to lower. If this fails,
  // somebody has written a forward date under the record label again and the
  // entry will grade `due` on the day it is read.
  assert.equal(r.labels.filter((l) => l.label === 'read').length, 0,
    'no entry may use **Read.** as a forward read-date label; it is the reading record')
  const today = r.graded.filter((g) => g.date === '2026-11-09')
  assert.ok(today.length >= 21, `${today.length} entries dated 2026-11-09; 21 on the day`)
  // Three, not the six it was, and for the same cause as the floor above: the
  // three re-spelled entries were all dated 2026-11-09, so they left this
  // subset and the house-labelled total is unchanged at 21.
  assert.ok(today.filter((g) => !g.canonical).length >= 3,
    'three of those were under a non-house label; six before the **Read.** re-spelling')
  for (const g of today) assert.equal(g.verdict, 'due', `${g.heading} is due, not ${g.verdict}`)
})

test('live: the label census sums to the entry count, which is what makes it a census', () => {
  // Window 91's own objection to its table's looser twin: "its rows sum to the
  // denominator and the loose one's do not."
  const text = readFileSync(REGISTER_PATH, 'utf8')
  const es = splitEntries(text)
  const census = labelCensus(es)
  assert.equal(census.reduce((n, l) => n + l.n, 0), es.length)
  const known = new Set([HOUSE_LABEL, ...ALT_LABELS, NO_FIELD])
  for (const l of census) assert.ok(known.has(l.label), `${l.label} is not a declared label`)
})

test('a future read date is decided on the UTC day, not on the first ten characters of --now', () => {
  // The line this replaces was `field.date > String(now).slice(0, 10)`. For a
  // Z-suffixed `now` the two agree, which is why the defect was invisible.
  assert.equal(nowDay('2026-11-09T04:34:57Z'), '2026-11-09')
  // They disagree whenever `--now` carries an offset. This instant is
  // 2026-11-10T01:00:00Z, so the UTC day is the 10th and the slice said the 9th.
  assert.equal('2026-11-09T20:00:00-05:00'.slice(0, 10), '2026-11-09')
  assert.equal(nowDay('2026-11-09T20:00:00-05:00'), '2026-11-10')
  // So an entry read on the 10th is no longer graded as read in the future.
  const entry = { heading: 'x', body: '- **Read on 2026-11-10**, in this window.\n' }
  const graded = gradeEntry(entry, { now: '2026-11-09T20:00:00-05:00', completedSince: 0 })
  assert.equal(graded.date, '2026-11-10')
  assert.notEqual(graded.verdict, null)
  // --now also accepts a bare day, which it always has, and that form is
  // returned unchanged rather than pushed through a function that refuses it.
  assert.equal(nowDay('2026-11-09'), '2026-11-09')
  assert.equal(nowDay('not a time'), null)
  assert.equal(nowDay(null), null)
})

test('control: the day comparator orders days and REFUSES an instant, which compareInstants cannot do for a day', () => {
  // The repository's lint forbids ordering a `date`-named value as text and
  // its repair line used to name `isAfter/isBefore/compareInstants` alone. All
  // three are unavailable for a bare day: `compareInstants` answers null and
  // both predicates answer false in both directions. Still pinned, because
  // this file's read-date field is a bare day and that is the reason it needs
  // a different comparator at all.
  //
  // THESE THREE DO NOT CHANGE, and this comment used to say the day they did
  // was the day this file's private `compareDays` should be deleted. That was
  // the wrong signal and it would never have fired. `tools/instant.mjs` keeps
  // refusing a day from its instant functions on purpose, and shipped a
  // separate day family beside them on 2026-11-09. So the private function is
  // gone, the import below is the shared one, and the deletion was a choice
  // made on reading the module rather than a test failure that forced it.
  assert.equal(compareInstants('2026-11-09', '2026-11-15'), null)
  assert.equal(isAfter('2026-11-15', '2026-11-09'), false)
  assert.equal(isBefore('2026-11-09', '2026-11-15'), false)
  assert.equal(compareDays('2026-11-09', '2026-11-15'), -1)
  assert.equal(compareDays('2026-11-15', '2026-11-09'), 1)
  assert.equal(compareDays('2026-11-09', '2026-11-09'), 0)
  // And the control: a caller holding an instant is refused instead of
  // quietly served. The refusal is a null rather than the TypeError the
  // private version threw, which is the shared module's convention — every
  // refusal in it is a null or a false.
  assert.equal(compareDays('2026-11-09T00:48Z', '2026-11-15'), null)
  assert.equal(compareDays('2026-11-9', '2026-11-15'), null)
  // And one the private version could not do: a day that does not exist. The
  // old `BARE_DAY` regex passed this string and sorted it between February 29
  // and March 1.
  assert.equal(parseDay('2026-02-30'), null)
  assert.equal(compareDays('2026-02-30', '2026-03-01'), null)
})

test('control: the gate exits 3 on all three ways of establishing nothing, and 0 only over a real reading', () => {
  // Every one of these exited 0 in this tool's first version. A gate that
  // passes over a question it did not answer is the failure mode this
  // directory's rule is about: the reassuring verdict and the real one have
  // the same shape, and only one of them is good news.
  const pendingOnly = report({ text: '### a\n- **Next measure.** 2026-11-15.\n', now: NOW, rows: ROWS })
  const dueOne = report({ text: '### a\n- **Next measure.** 2026-11-03.\n', now: NOW, rows: ROWS })
  const undated = report({ text: '### a\n- **Effect.** it held.\n', now: NOW, rows: ROWS })

  assert.equal(gateExitCode({ report: pendingOnly, rows: ROWS, offline: false }), 0, 'a real reading with nothing due')
  assert.equal(gateExitCode({ report: dueOne, rows: ROWS, offline: false }), 1, 'a verdict is owed')
  assert.equal(gateExitCode({ report: undated, rows: ROWS, offline: false }), 3, 'nothing in the file carries a date')
  assert.equal(gateExitCode({ report: pendingOnly, rows: null, offline: false }), 3, 'no run rows')
  assert.equal(gateExitCode({ report: pendingOnly, rows: ROWS, offline: true }), 3, '--offline is a parse, not a grading')
  // And the control on the control: the only input that yields 0 is the one
  // where a dated entry was actually graded, so a gate stuck at 0 fails here.
  assert.notEqual(gateExitCode({ report: undated, rows: ROWS, offline: false }), 0)
})

// --- HQ's sixth labelled line: the reading record -------------------------

test('the reading record discharges `due`, which is the standing finding this file opened with', () => {
  // The whole point. Before the sixth line existed, `read` was a value
  // nothing in either register could emit, so `due` only grew. Both halves
  // asserted: the entry WOULD be due on its forward date, and is not.
  const withoutRecord = entry('x', '- **Next measure.** 2026-11-01 by this seat.\n')
  assert.equal(gradeEntry(withoutRecord, { now: NOW, completedSince: 40 }).verdict, 'due')

  const withRecord = entry('x', '- **Next measure.** 2026-11-01 by this seat.\n- **Read.** 2026-11-05, by Ursa/exo.\n')
  const g = gradeEntry(withRecord, { now: NOW, completedSince: 40 })
  assert.equal(g.verdict, 'read')
  assert.equal(g.read.date, '2026-11-05')
  assert.equal(g.read.reader, 'by Ursa/exo')
  // The forward field is still reported beside the record, because the reader
  // needs to know which date was promised and which was kept.
  assert.equal(g.date, '2026-11-01')
})

test('a reading record is the only thing that produces `read`, and a number in Effect is not', () => {
  // The mechanism HQ repaired: `read` used to be decided by whether an Effect
  // line happened to carry a number, which is a side effect of a reading and
  // not the reading. A seat that looked and found the metric flat left no mark.
  const flat = entry('x', '- **Next measure.** 2026-11-01 by this seat.\n- **Effect.** No change: 4 before, 4 after.\n')
  assert.equal(gradeEntry(flat, { now: NOW, completedSince: 40 }).verdict, 'due')
  const numbered = entry('x', '- **Next measure.** 2026-11-01 by this seat.\n- **Effect.** 52 to 11.\n')
  assert.equal(gradeEntry(numbered, { now: NOW, completedSince: 40 }).verdict, 'due')
})

test('every negative phrasing on a Read line loses, because a false `read` invents a reading', () => {
  // HQ declared the asymmetry rather than inferring it. Asserted as a set, so
  // that adding a phrase to NOT_READ_PHRASES without a case here fails.
  for (const phrase of NOT_READ_PHRASES) {
    const e = entry('x', `- **Next measure.** 2026-11-01 by this seat.\n- **Read.** ${phrase}.\n`)
    assert.equal(gradeEntry(e, { now: NOW, completedSince: 40 }).verdict, 'due', `"${phrase}" must not discharge`)
  }
  // And a negative phrasing WINS over a date on the same line, which is the
  // direction the asymmetry points: "not read yet, was due 2026-11-01".
  const both = entry('x', '- **Next measure.** 2026-11-01 by this seat.\n- **Read.** not read yet, it was due 2026-11-01.\n')
  assert.equal(gradeEntry(both, { now: NOW, completedSince: 40 }).verdict, 'due')
})

test('a Read line with no ISO date is a record nobody dated, and says so rather than discharging', () => {
  const e = entry('x', '- **Next measure.** 2026-11-01 by this seat.\n- **Read.** yes, by this seat, last week sometime.\n')
  const g = gradeEntry(e, { now: NOW, completedSince: 40 })
  assert.equal(g.verdict, 'no-date')
  assert.equal(g.why, RECORD_NO_ISO)
  assert.notEqual(g.verdict, 'read')
})

test('REGRESSION: the record label is not a forward read-date field, which is the collision it was split out of', () => {
  // Probed on the trunk before the repair: an entry carrying HQ's new line and
  // no `**Next measure.**` — the normal shape of a FINISHED experiment —
  // parsed as a forward read date in the past and graded `due`. The field
  // whose purpose is to record a reading produced a debt for it.
  const finished = entry('x', '- **Read.** 2026-11-09, by Ursa/exo.\n- **Effect.** 4 of 4.\n')
  const g = gradeEntry(finished, { now: NOW, completedSince: 40 })
  assert.equal(g.verdict, 'read')
  assert.equal(g.label, null, 'the Read line must not be claimed as the forward field')
  assert.equal(g.date, null)
  // The census must not count it as a forward spelling either, or the
  // alt-label number re-inflates with records.
  assert.deepEqual(labelCensus([finished]).map((l) => l.label), ['no-field'])
})

test('`read` is in the closed vocabulary, so the gate and the census can both route it', () => {
  // This seat reported to HQ that `read` was a verdict nothing could emit.
  // The other half of that report is that it has to be emittable HERE too.
  assert.ok(VERDICTS.has('read'))
  assert.equal(VERDICTS.size, 5)
})

test('a register of nothing but readings is a real green, not an empty reading', () => {
  // gateExitCode returns 3 for "established nothing". A fully-read register
  // has no forward dates left, so the old `dated === 0` test would have
  // called the best possible state the same as an unparsed file.
  const text = '### a\n- **Read.** 2026-11-05, by Ursa/exo.\n\n### b\n- **Read.** 2026-11-06, by Ursa/exo.\n'
  const r = report({ text, now: NOW, rows: ROWS })
  assert.equal(r.counts.read, 2)
  assert.equal(r.counts.dated, 0)
  assert.equal(gateExitCode({ report: r, rows: ROWS, offline: false }), 0)
  // And a file with neither is still 3, which is the case that must not break.
  const empty = report({ text: '### a\n- **Merged.** yes.\n', now: NOW, rows: ROWS })
  assert.equal(gateExitCode({ report: empty, rows: ROWS, offline: false }), 3)
})

test('the reading record is carried on every grading path, or adoption reads as identical to compliance', () => {
  // Found by this file's own census three minutes after the field shipped:
  // `read: record` was attached only on the discharging return, so the two
  // entries that had adopted HQ's line as `**Read.** not read yet` counted as
  // zero carriers. A census of a new field that can only see its successes
  // reports adoption and compliance as one number, and they are the two this
  // field exists to separate.
  // A PAST forward date, so the verdict is `due` and the fall-through path
  // under test is the one that actually grades.
  const declaredNegative = entry('x', '- **Next measure.** 2026-11-01 by this seat.\n- **Read.** not read yet.\n')
  const g = gradeEntry(declaredNegative, { now: NOW, completedSince: 40 })
  assert.equal(g.verdict, 'due')
  assert.equal(g.read.present, true, 'the record is present even though it does not discharge')
  assert.equal(g.read.notRead, true)

  // The no-forward-date path and the ungradeable path too, because each is a
  // separate `return` and each dropped it.
  const noField = entry('y', '- **Read.** not read yet.\n')
  assert.equal(gradeEntry(noField, { now: NOW, completedSince: 40 }).read.present, true)
  const ungradeable = entry('z', '- **Next measure.** 2026-11-01.\n- **Read.** not read yet.\n')
  const u = gradeEntry(ungradeable, { now: NOW, completedSince: null })
  assert.equal(u.verdict, null)
  assert.equal(u.read.present, true)

  // And the report's two counts differ, which is the point of carrying it.
  const text = '### a\n- **Read.** 2026-11-05, by Ursa/exo.\n\n### b\n- **Next measure.** 2026-11-01.\n- **Read.** not read yet.\n'
  const r = report({ text, now: NOW, rows: ROWS })
  assert.equal(r.counts.with_reading_record, 2, 'two entries carry the field')
  assert.equal(r.counts.read, 1, 'one of them discharges')
  assert.equal(r.counts.not_read_declared, 1)
})
