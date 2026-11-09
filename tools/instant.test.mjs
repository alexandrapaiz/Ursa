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

test('a calendar day is not an instant', () => {
  assert.equal(timestampShape('2026-11-02'), 'invalid')
  assert.equal(parseInstant('2026-11-02'), null)
  assert.equal(utcDay('2026-11-02'), null)
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
