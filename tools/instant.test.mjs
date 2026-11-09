import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { decide } from './instant-gate.mjs'
import {
  timestampShape, parseInstant, parseEpochSeconds, toUtcInstant,
  compareInstants, isAfter, isBefore, utcDay, sortByInstant,
  parseDay, compareDays, isDayAfter, isDayBefore, sortByDay,
  textualTimestampComparisons
} from './instant.mjs'

// The two spellings of this repository's HEAD at the time this file was
// written, commit 9c3c52dc, Unix second 1793594097. Every assertion below
// that matters is about this pair, because it is the real one.
const GIT = '2026-11-01T23:34:57-05:00'   // git log --format=%cI
const API = '2026-11-02T04:34:57Z'        // gh api .commit.committer.date
const CT = '1793594097'                   // git log --format=%ct

test('the same commit has two spellings and they are not the same string', () => {
  assert.notEqual(GIT, API)
  assert.equal(parseInstant(GIT), parseInstant(API))
  assert.equal(parseEpochSeconds(CT), parseInstant(API))
})

test('timestampShape separates the case that parses from the case that sorts', () => {
  assert.equal(timestampShape(API), 'utc-z')
  assert.equal(timestampShape('2026-11-02T04:34:57+00:00'), 'utc-offset')
  assert.equal(timestampShape(GIT), 'offset')
  assert.equal(timestampShape('2026-11-02T0434-05:00'), 'invalid')
  // git spells UTC as +00:00 and never as Z, so a tool that tests for a
  // trailing Z to decide "this is safe to compare" rejects every git value.
  assert.notEqual(timestampShape('2026-11-02T04:34:57+00:00'), timestampShape(API))
})

test('a zoneless timestamp is refused rather than read as UTC', () => {
  assert.equal(timestampShape('2026-11-02T04:34:57'), 'naive')
  assert.equal(parseInstant('2026-11-02T04:34:57'), null)
  // Date.parse would have answered. That answer is the defect: it reads the
  // string as UTC, which is a guess, and the guess is silent.
  assert.equal(Number.isNaN(Date.parse('2026-11-02T04:34:57')), false)
})

test('a calendar day is not an instant, and as of 2026-11-09 it is not invalid either', () => {
  // The classification changed and the BEHAVIOUR did not. That is the whole
  // point of the change: a bare day gets its own name so a caller can route
  // on it, while every instant function goes on refusing it.
  assert.equal(timestampShape('2026-11-02'), 'day')
  assert.equal(parseInstant('2026-11-02'), null)
  assert.equal(utcDay('2026-11-02'), null)
})

test('the contract the ExO seat pinned against this module still holds, on purpose', () => {
  // tools/seat/read-dates.mjs asserts these three answers and says that the
  // day they change is the day its private `compareDays` is deleted. They do
  // not change. The repair shipped today is a new function beside these, not a
  // loosening of them, so that test stays green and the deletion is a choice
  // somebody makes rather than a failure that forces it. Said here so a future
  // reader of this module cannot conclude the pin was simply forgotten.
  assert.equal(compareInstants('2026-11-09', '2026-11-15'), null)
  assert.equal(isAfter('2026-11-15', '2026-11-09'), false)
  assert.equal(isBefore('2026-11-09', '2026-11-15'), false)
})

test('parseDay refuses an instant, so the projection has to be written out loud', () => {
  assert.equal(parseDay('2026-11-02'), Date.UTC(2026, 10, 2))
  assert.equal(parseDay(API), null)
  assert.equal(parseDay(GIT), null)
  assert.equal(parseDay('2026-11-02T04:34:57'), null)
  assert.equal(parseDay(null), null)
  assert.equal(parseDay('2026-11-2'), null)
  // The bridge, which is the supported way to get from an instant to a day.
  assert.equal(compareDays(utcDay(GIT), utcDay('2026-11-01T22:00:00Z')), 1)
})

test('parseDay refuses a day that does not exist, which Date.parse does not', () => {
  // Date.parse answers for both of these: it rolls February 30 forward to
  // March 2 and tells nobody. That silent roll is the only reason parseDay
  // round-trips instead of comparing text.
  assert.equal(Number.isNaN(Date.parse('2026-02-30')), false)
  assert.equal(parseDay('2026-02-30'), null)
  assert.equal(parseDay('2026-13-01'), null)
  assert.equal(parseDay('2026-00-10'), null)
  // Date.UTC(0, 0, 1) is 1900-01-01, a legacy two-digit-year mapping, so this
  // would otherwise have been placeable 1900 years from where it was written.
  assert.equal(parseDay('0000-01-01'), null)
  // A real leap day stays real.
  assert.equal(parseDay('2028-02-29'), Date.UTC(2028, 1, 29))
  assert.equal(parseDay('2026-02-29'), null)
})

test('the day comparators order days and refuse instants in both directions', () => {
  assert.equal(compareDays('2026-11-09', '2026-11-15'), -1)
  assert.equal(compareDays('2026-11-15', '2026-11-09'), 1)
  assert.equal(compareDays('2026-11-09', '2026-11-09'), 0)
  assert.equal(isDayAfter('2026-11-15', '2026-11-09'), true)
  assert.equal(isDayBefore('2026-11-09', '2026-11-15'), true)
  // Symmetric refusal: the instant functions refuse a day, these refuse an
  // instant, and neither coerces. An unplaceable side is absent, not true.
  assert.equal(compareDays(API, '2026-11-09'), null)
  assert.equal(isDayAfter(API, '2026-11-09'), false)
  assert.equal(isDayBefore(API, '2026-11-09'), false)
  assert.equal(isDayAfter('2026-11-09', API), false)
  assert.equal(isDayBefore('2026-11-09', API), false)
})

test('sortByDay is the repair for the finding that produced the day family', () => {
  // The shape the lint caught in tools/seat/read-dates.mjs: a sort over a
  // field named `date` that holds bare days.
  const rows = [
    { entry: 'c', date: '2026-11-15' },
    { entry: 'a', date: '2026-10-27' },
    { entry: 'b', date: '2026-11-09' }
  ]
  assert.deepEqual(sortByDay(rows, (r) => r.date).map((r) => r.entry), ['a', 'b', 'c'])
  // sortByInstant would have refused every row and left the array untouched,
  // which is the silent non-ordering the instant repair produces on this class.
  assert.deepEqual(sortByInstant(rows, (r) => r.date).map((r) => r.entry), ['c', 'a', 'b'])
})

test('sortByDay is stable and keeps unplaceable rows last rather than dropping them', () => {
  const rows = [
    { id: 'u1', date: API },
    { id: 'a', date: '2026-10-27' },
    { id: 'u2', date: '2026-02-30' },
    { id: 'b', date: '2026-10-27' }
  ]
  assert.deepEqual(sortByDay(rows, (r) => r.date).map((r) => r.id), ['a', 'b', 'u1', 'u2'])
})

test('text comparison and instant comparison disagree on the real pair', () => {
  const branchOpened = '2026-11-02T01:00:00Z'
  // As text, the branch looks later than the commit, because the commit's
  // string starts with 2026-11-01. As instants it is three and a half hours
  // earlier.
  assert.equal(branchOpened > GIT, true)
  assert.equal(isAfter(branchOpened, GIT), false)
  assert.equal(isBefore(branchOpened, GIT), true)
  assert.equal(compareInstants(branchOpened, GIT), -1)
})

test('the engineer charter row, which is the live miscount this module was written for', () => {
  // prompts/engineer-agent.md last reached main at this committer date,
  // measured 2026-11-02: git log -1 --format=%cI origin/main -- <path>
  const frozen = '2026-10-09T12:28:03-06:00'          // = 2026-10-09T18:28:03Z
  const branch = '2026-10-09T17:31:08Z'               // engineer/2026-10-09-briefing-cost-and-stdio-probe
  assert.equal(branch > frozen, true)                 // counted as handed a stale charter
  assert.equal(isAfter(branch, frozen), false)        // opened 57 minutes before the freeze
})

test('an unplaceable operand yields no ordering rather than a confident false', () => {
  assert.equal(compareInstants('2026-11-02', API), null)
  assert.equal(isAfter('2026-11-02', API), false)
  assert.equal(isBefore('2026-11-02', API), false)
  // Both directions false is the signal: the pair was not ordered at all.
})

test('utcDay is the UTC day and slice(0, 10) is the committer local day', () => {
  assert.equal(utcDay(GIT), '2026-11-02')
  assert.equal(GIT.slice(0, 10), '2026-11-01')
  assert.equal(utcDay(API), '2026-11-02')
  // The other sign: a positive offset late in the day goes the other way.
  assert.equal(utcDay('2026-11-02T08:00:00+09:00'), '2026-11-01')
})

test('toUtcInstant normalises either spelling to the one comparable form', () => {
  assert.equal(toUtcInstant(GIT), API)
  assert.equal(toUtcInstant(API), API)
  assert.equal(toUtcInstant(parseEpochSeconds(CT)), API)
  assert.equal(toUtcInstant('2026-11-02'), null)
})

test('parseEpochSeconds takes what %ct prints and refuses what it does not', () => {
  assert.equal(parseEpochSeconds(1793594097), 1793594097000)
  assert.equal(parseEpochSeconds(' 1793594097\n'), 1793594097000)
  assert.equal(parseEpochSeconds('1793594097.5'), null)
  assert.equal(parseEpochSeconds(''), null)
  assert.equal(parseEpochSeconds('not a number'), null)
})

test('sortByInstant orders across spellings, where localeCompare does not', () => {
  const rows = [
    { sha: 'later', date: GIT },                       // 2026-11-02T04:34:57Z
    { sha: 'earlier', date: '2026-11-02T01:00:00Z' }
  ]
  assert.deepEqual(sortByInstant(rows, (r) => r.date).map((r) => r.sha), ['earlier', 'later'])
  const byText = [...rows].sort((a, b) => a.date.localeCompare(b.date))
  assert.deepEqual(byText.map((r) => r.sha), ['later', 'earlier'])
})

test('sortByInstant is stable and keeps unplaceable rows last rather than dropping them', () => {
  const rows = [
    { id: 'u1', date: '2026-11-02' },
    { id: 'a', date: API },
    { id: 'u2', date: null },
    { id: 'b', date: API }
  ]
  assert.deepEqual(sortByInstant(rows, (r) => r.date).map((r) => r.id), ['a', 'b', 'u1', 'u2'])
})

test('the lint names the three defects and quotes the line', () => {
  const found = textualTimestampComparisons([
    'if (comment.createdAt < genAt) continue',
    "const day = r.mainDate.slice(0, 10)",
    "const z = raw.slice(0, 19) + 'Z'",
    'const n = rows.length > 3'
  ].join('\n'))
  assert.deepEqual(found.map((f) => [f.line, f.code]), [
    [1, 'TEXTUAL_ORDER'], [2, 'TEXTUAL_DAY'], [3, 'TEXTUAL_DROP']
  ])
  assert.match(found[0].text, /comment\.createdAt/)
  assert.match(found[0].repair, /compares spellings, not instants/)
})

test('the lint catches localeCompare, which is the sort form of the same defect', () => {
  const found = textualTimestampComparisons('commits.sort((a, b) => a.authoredAt.localeCompare(b.authoredAt))')
  assert.equal(found.length, 1)
  assert.equal(found[0].code, 'TEXTUAL_ORDER')
  assert.match(found[0].repair, /sortByInstant/)
})

test('the TEXTUAL_ORDER repair names both value classes, because the lint cannot see which', () => {
  const [order] = textualTimestampComparisons('if (comment.createdAt < genAt) continue')
  assert.equal(order.code, 'TEXTUAL_ORDER')
  // The instant branch, which was all this line used to say.
  assert.match(order.repair, /isAfter\/isBefore\/compareInstants/)
  // The day branch, which is the repair the ExO seat's register field needed
  // and could not find on 2026-11-09.
  assert.match(order.repair, /isDayAfter\/isDayBefore\/compareDays/)
  // And the reason, so a reader does not have to try the wrong one to find out.
  assert.match(order.repair, /refuse a day/)

  const [sorted] = textualTimestampComparisons('commits.sort((a, b) => a.authoredAt.localeCompare(b.authoredAt))')
  assert.match(sorted.repair, /sortByInstant\(rows, key\)/)
  assert.match(sorted.repair, /sortByDay\(rows, key\)/)
})

test('the shape that defeats evidence-based narrowing, as code rather than as a comment', () => {
  // instant.mjs's lint docblock explains why TEXTUAL_ORDER's repair is not
  // narrowed to one branch by reading the line for a day literal. This is the
  // counter-example it refers to, kept here because written into that docblock
  // it is a finding of the lint itself.
  const line = "const stale = a.createdAt < b.createdAt && a.date !== '2026-11-09'"
  const [found] = textualTimestampComparisons(line)
  // A genuine instant comparison. The day literal on the line is incidental,
  // so narrowing on it would print the day repair for an instant defect.
  assert.equal(found.code, 'TEXTUAL_ORDER')
  assert.match(found.repair, /isAfter\/isBefore\/compareInstants/)
  assert.match(found.repair, /isDayAfter\/isDayBefore\/compareDays/)
})

test('a site repaired with the day family is clean, which is what makes the repair followable', () => {
  // If this fails, the lint reports the exact line its own repair text
  // prescribes, and the only way to obey it is to suppress the lint.
  //
  // ONE ASSERTION WAS DELETED FROM THIS TEST (exo, 2026-11-09), and the
  // reason is the reason the test exists pointed the other way. It pinned
  // `rows.sort((a, b) => compareDays(a.date, b.date))` CLEAN, as a repaired
  // site. It is not a repaired site. `compareDays` answers null for a value
  // it will not place and `Array.prototype.sort` coerces null to 0, so that
  // line sorts nothing and raises nothing — which this module's own docblocks
  // state twice, as the stated reason `sortByDay` exists. The pin made the
  // hazard permanently invisible to the lint, so it now lives below as a
  // REFUSAL_AS_ORDER assertion instead.
  assert.deepEqual(textualTimestampComparisons('const asc = sortByDay(rows, (r) => r.date)'), [])
  assert.deepEqual(textualTimestampComparisons('if (isDayAfter(entry.date, now.date)) return'), [])
  assert.deepEqual(textualTimestampComparisons('const ms = parseDay(field.date)'), [])
  // And the comparator on its own line stays clean, because there the null is
  // a value the author can read. The hazard is the sort callback, not the
  // function.
  assert.deepEqual(textualTimestampComparisons('const c = compareDays(a, b)'), [])
  assert.deepEqual(textualTimestampComparisons('const c = compareInstants(a.createdAt, b.createdAt)'), [])
})

test('REFUSAL_AS_ORDER: a null-returning comparator inside a sort callback, which the repaired-site exemption used to clear', () => {
  // The positive case. Note it carries no timestamp-named operand
  // requirement: this code is keyed on the CALLEE, because a comparator that
  // can refuse is evidence on its own.
  const [day] = textualTimestampComparisons('rows.sort((a, b) => compareDays(a.date, b.date))')
  assert.equal(day.code, 'REFUSAL_AS_ORDER')
  assert.match(day.repair, /sortByDay\(rows, key\)/)
  assert.match(day.repair, /coerces null to 0/)

  const [inst] = textualTimestampComparisons('items.sort((x, y) => compareInstants(x.at, y.at))')
  assert.equal(inst.code, 'REFUSAL_AS_ORDER')
  assert.match(inst.repair, /sortByInstant\(rows, key\)/)

  // Indented and trailing-comma'd, which is how the one real instance in this
  // repository was written.
  assert.equal(
    textualTimestampComparisons('      .sort((a, b) => compareDays(a.date, b.date)),')[0].code,
    'REFUSAL_AS_ORDER'
  )

  // The negative controls. An absence is a measurement and it needs a
  // positive control; the three above are it.
  assert.deepEqual(textualTimestampComparisons('rows.sort((a, b) => a.n - b.n)'), [])
  assert.deepEqual(textualTimestampComparisons('rows.sort((a, b) => a.i - b.i)'), [])
  // `sortByDay` is the repair, so it is clean inside a sort-shaped line too.
  assert.deepEqual(textualTimestampComparisons('const out = sortByDay(rows, (r) => r.date)'), [])
})

test('REFUSAL_AS_ORDER is checked before the repaired-site exemption, and that order is the defect it closes', () => {
  // This is the regression guard for the ORDERING and not for the pattern. If
  // somebody moves the new check below the family-name exemption, the
  // exemption clears the line and this assertion is the only thing that says
  // so. Both the ordering and the pattern have to be wrong for the test above
  // to pass while this one fails, which is why it is written separately.
  const line = 'rows.sort((a, b) => compareDays(a.date, b.date))'
  // Transcribed from the detector rather than imported, on purpose: a copy
  // that drifts is the point, because this test asserts the LINE matches the
  // exemption and would stop asserting anything if it imported the real one.
  // `calendarDay` was appended to both on 2026-11-09 by the engineer seat.
  const EXEMPTION =
    /\b(?:parseInstant|compareInstants|isAfter|isBefore|utcDay|sortByInstant|parseEpochSeconds|toUtcInstant|parseDay|compareDays|isDayAfter|isDayBefore|sortByDay|calendarDay)\s*\(/
  // The line DOES match the exemption. That is the point: it is cleared by it
  // unless something runs first.
  assert.ok(EXEMPTION.test(line))
  assert.equal(textualTimestampComparisons(line).length, 1)
})

test('SHAPE_AS_EXISTENCE: a day decided by its spelling, in the three shapes that reach it', () => {
  // The positive cases. Keyed on the CALLEE for the same reason
  // REFUSAL_AS_ORDER is: no timestamp-named operand is required, because
  // reaching for this particular family member is the evidence.
  //
  // The first is the line as it stood in `tools/seat/read-dates.mjs` on
  // `main` before Ursa#768. The second and third are the other two readings
  // of the same mistake; Ursa's engineer seat wrote all three as the controls
  // for the sweep it handed over, and they are transcribed rather than
  // invented for that reason.
  const [ternary] = textualTimestampComparisons("return utcDay(now) ?? (timestampShape(now) === 'day' ? String(now) : null)")
  assert.equal(ternary.code, 'SHAPE_AS_EXISTENCE')
  assert.match(ternary.repair, /parseDay/)
  assert.match(ternary.repair, /2026-02-30/)

  assert.equal(textualTimestampComparisons("if (timestampShape(v) !== 'day') return null")[0].code, 'SHAPE_AS_EXISTENCE')
  assert.equal(textualTimestampComparisons("switch (timestampShape(v)) { case 'day': return v }")[0].code, 'SHAPE_AS_EXISTENCE')

  // The negative controls. An absence is a measurement and needs a positive
  // control; the three above are it.
  //
  // The repair, another shape of the same call, prose in both comment forms,
  // and — the one that matters most — this module's OWN correct refusal,
  // which is `parseInstant` split across two lines. That split is what keeps
  // the defining module off its own report with no filename exemption, so it
  // is pinned here rather than left as a happy accident.
  assert.deepEqual(textualTimestampComparisons('return parseDay(v) === null ? null : v'), [])
  assert.deepEqual(textualTimestampComparisons("if (timestampShape(v) === 'naive') return null"), [])
  assert.deepEqual(textualTimestampComparisons("// timestampShape answers 'day' for a spelling"), [])
  assert.deepEqual(textualTimestampComparisons(" * timestampShape answers 'day' for a spelling"), [])
  assert.deepEqual(textualTimestampComparisons('const shape = timestampShape(value)'), [])
  assert.deepEqual(textualTimestampComparisons("if (shape === 'invalid' || shape === 'naive' || shape === 'day') return null"), [])
})

test('SHAPE_AS_EXISTENCE is checked before the repaired-site exemption, and that order is the whole reason it is reachable', () => {
  // The same regression guard as the one above it, for the same reason and a
  // different cause. REFUSAL_AS_ORDER is a family member whose REFUSAL a
  // caller can consume as an answer; this is a family member that answers a
  // WEAKER QUESTION than its caller asked. Two varieties, one exemption.
  //
  // Measured before the code existed: this exact line returned no finding,
  // and it returned none because the exemption cleared it rather than for
  // want of a pattern. Move the check below the exemption and only this
  // assertion says so.
  const line = "return utcDay(now) ?? (timestampShape(now) === 'day' ? String(now) : null)"
  const EXEMPTION =
    /\b(?:parseInstant|compareInstants|isAfter|isBefore|utcDay|sortByInstant|parseEpochSeconds|toUtcInstant|parseDay|compareDays|isDayAfter|isDayBefore|sortByDay)\s*\(/
  assert.ok(EXEMPTION.test(line), 'the line must match the exemption, or this guard proves nothing')
  assert.equal(textualTimestampComparisons(line).length, 1)

  // And the weaker form, which the exemption never reached. Both have to
  // trip, because a pattern that only fires on the un-exempted spelling would
  // pass the test above by accident.
  assert.equal(textualTimestampComparisons("return timestampShape(now) === 'day' ? String(now) : null").length, 1)
})

test('the lint does not fire on arithmetic, on counts, or on a repaired call site', () => {
  assert.deepEqual(textualTimestampComparisons('if (rows.length > bound) return 1'), [])
  assert.deepEqual(textualTimestampComparisons('if (over.length > 0 && n > 3) return 1'), [])
  assert.deepEqual(textualTimestampComparisons('if (isAfter(b.createdAt, c.frozenAt)) n += 1'), [])
  assert.deepEqual(textualTimestampComparisons('const day = utcDay(r.mainDate)'), [])
  // A comment describing the defect is not the defect.
  assert.deepEqual(textualTimestampComparisons('// before: comment.createdAt < genAt'), [])
  // A slice that is not a day boundary is somebody else's business.
  assert.deepEqual(textualTimestampComparisons('const short = digest.slice(0, 16)'), [])
})

test('the repaired instruments carry none of the three defects', () => {
  for (const path of ['tools/seat/charter-lag.mjs', 'tools/instant.mjs']) {
    const found = textualTimestampComparisons(readFileSync(path, 'utf8'))
    assert.deepEqual(found, [], `${path}: ${JSON.stringify(found)}`)
  }
})

test('the lint does not fire on English words that merely end in "date"', () => {
  // The first sweep over this repository reported
  // `createHash('sha256').update(png).digest('hex').slice(0, 10)` as a
  // timestamp defect, twice, because `update` ends in `date`. This corpus is
  // the words this repository actually uses.
  for (const word of ['update', 'validate', 'candidate', 'invalidate', 'consolidate', 'mandate']) {
    assert.deepEqual(
      textualTimestampComparisons(`const x = thing.${word}(png).digest('hex').slice(0, 10)`),
      [], word
    )
  }
  // And it still fires on the camelCase form, which is what the suffix is for.
  assert.equal(textualTimestampComparisons('const d = r.mainDate.slice(0, 10)').length, 1)
  assert.equal(textualTimestampComparisons('const d = r.created_at.slice(0, 10)').length, 1)
  assert.equal(textualTimestampComparisons('const d = firstTs.slice(0, 10)').length, 1)
})

test('the day lint tests what is sliced, not what the line mentions', () => {
  // A line can name a timestamp and slice something else. Against the whole
  // line this fires; against the receiver it does not, and the receiver is
  // the thing that would be wrong.
  assert.deepEqual(textualTimestampComparisons('recordedAt: digest.slice(0, 10),'), [])
  assert.deepEqual(textualTimestampComparisons('const key = `${r.mainDate}` + sha.slice(0, 10)'), [])
  // And the same line with the timestamp as the receiver is a finding, so
  // this is a narrowing and not a hole.
  assert.equal(textualTimestampComparisons('recordedAt: other.generatedAt.slice(0, 10),').length, 1)
})

test('a day sliced off toISOString is the UTC day and is not a finding', () => {
  assert.deepEqual(textualTimestampComparisons("recordedAt: new Date().toISOString().slice(0, 10),"), [])
  // The exemption is the producer and not the name: the same slice on a
  // field is still a finding.
  assert.equal(textualTimestampComparisons('recordedAt: other.generatedAt.slice(0, 10),').length, 1)
})

test('a plural ending in ts is not a timestamp, and the camel and underscore forms still are', () => {
  // The `Date` corpus one alternative over, measured 2026-11-08 over this
  // repository's tracked source: 15,466 distinct identifiers, 446 matching
  // TIMESTAMP_NAME, 355 of them on a `ts` tail — and 8 of those 355 are
  // timestamps. The other 347 are English plurals. The live cost was a real
  // finding, not a hypothetical one: the gate reported
  // `if (cmp.points < baseline.minPoints)` in tools/seat/suite-baseline.mjs
  // as a timestamp ordered as text, beside two genuine findings, so a reader
  // had three offenders and no way to rank them without reading the detector.
  for (const line of [
    '  if (cmp.points < baseline.minPoints) {',
    '  if (aCommits > bCommits) {',
    '  if (ourResults >= theirResults) {',
    '  rows.sort((a, b) => b.points.localeCompare(a.points))',
  ]) {
    assert.deepEqual(textualTimestampComparisons(line), [], line)
  }
  // The narrowing is a narrowing and not a hole: every spelling this
  // repository actually uses for a timestamp is still a finding. Without
  // these four the repair above is indistinguishable from deleting the
  // alternative, which is the mistake that makes a lint stop finding things.
  for (const line of [
    '  const later = rows.filter((r) => r.ts > n.ts)',
    '  if (firstTs < lastTs) {',
    '  if (a.created_ts < b.created_ts) {',
    '  rows.sort((a, b) => b.ts.localeCompare(a.ts))',
  ]) {
    assert.equal(textualTimestampComparisons(line).length, 1, line)
    assert.equal(textualTimestampComparisons(line)[0].code, 'TEXTUAL_ORDER', line)
  }
})

test('the at alternative is deliberately NOT narrowed, and this pins the measurement that says so', () => {
  // Measured in the same pass: all 57 `at`-tail matches in this tree are
  // createdAt/_at-shaped and none is a plain English word, so there is no
  // false-positive corpus behind narrowing it. A narrowing with nothing
  // behind it is a guess, and a test that pins the decision is cheaper than
  // the next window re-measuring to find out why only one was changed.
  assert.equal(textualTimestampComparisons('  if (a.created_at < b.created_at) {').length, 1)
  assert.equal(textualTimestampComparisons('  if (createdAt < updatedAt) {').length, 1)
  // And the words the prefix rule already keeps out, which is why no change
  // was needed: these reach the pattern only as whole identifiers.
  for (const line of ['  if (concat < format) {', '  if (float > stat) {']) {
    assert.deepEqual(textualTimestampComparisons(line), [], line)
  }
})

test('no source file outside a test violates ANY code the lint can emit', () => {
  // The gate, and the reason this file imports git. It used to assert over
  // TEXTUAL_ORDER and TEXTUAL_DROP and say nothing about TEXTUAL_DAY, which
  // the lint detects on every run: Ursa's security seat found four instances
  // of it standing in non-test source on the trunk on 2026-11-09 for exactly
  // that reason, and a class a file calls a defect was being dropped on the
  // floor with no record that it was.
  //
  // The decision lives once, in tools/instant-gate.mjs, which reads the set
  // of codes it owes a disposition off this module's own source instead of
  // restating it. Two implementations of one obligation agree only on the day
  // they are written, so this test drives that one rather than keeping a
  // narrower copy of it alive beside it.
  const files = execFileSync('git', ['ls-files', '-z', '*.mjs', '*.js', '*.cjs', '*.ts', '*.tsx'], { encoding: 'utf8' })
    .split('\0').filter(Boolean)
  const here = dirname(fileURLToPath(import.meta.url))
  const r = decide({
    files,
    read: (f) => readFileSync(resolve(here, '..', f), 'utf8'),
    detectorSource: readFileSync(resolve(here, 'instant.mjs'), 'utf8')
  })
  assert.deepEqual(r.offenders.map((f) => `${f.file}:${f.line} ${f.code} ${f.text}`), [])
  assert.deepEqual(r.undecided, [], 'the lint can emit a code the gate has no disposition for')
  // A positive control, so a sweep that silently read nothing cannot pass
  // this test: the tree is not empty and the lint is reachable.
  assert.ok(r.scanned > 300, `only ${r.scanned} files scanned`)
})
