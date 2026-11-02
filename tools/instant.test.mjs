import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { partition } from './instant-sweep.mjs'
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

test('a day sliced off toISOString is the UTC day and is not a finding', () => {
  assert.deepEqual(textualTimestampComparisons("recordedAt: new Date().toISOString().slice(0, 10),"), [])
  // The exemption is the producer and not the name: the same slice on a
  // field is still a finding.
  assert.equal(textualTimestampComparisons('recordedAt: other.generatedAt.slice(0, 10),').length, 1)
})

test('no source file outside a test orders timestamps as text', () => {
  // The gate, and the reason this file imports git. TEXTUAL_ORDER is wrong
  // wherever it appears; the remaining instances in this repository are all
  // inside test files that demonstrate the inversion on purpose, and each one
  // sits next to the instant-aware assertion that contradicts it.
  const files = execFileSync('git', ['ls-files', '-z', '*.mjs', '*.js', '*.cjs', '*.ts', '*.tsx'], { encoding: 'utf8' })
    .split('\0').filter(Boolean)
  const { scanned } = partition(files)
  const offenders = []
  for (const file of scanned) {
    if (/\.test\.(mjs|js|ts|tsx)$/.test(file)) continue
    let source
    try { source = readFileSync(file, 'utf8') } catch { continue }
    for (const f of textualTimestampComparisons(source)) {
      if (f.code === 'TEXTUAL_ORDER' || f.code === 'TEXTUAL_DROP') offenders.push(`${file}:${f.line} ${f.code} ${f.text}`)
    }
  }
  assert.deepEqual(offenders, [])
  // A positive control, so a sweep that silently read nothing cannot pass
  // this test: the tree is not empty and the lint is reachable.
  assert.ok(scanned.length > 300, `only ${scanned.length} files scanned`)
})
