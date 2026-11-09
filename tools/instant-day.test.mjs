// instant-day.test.mjs — the day projection every caller of `tools/instant.mjs`
// kept writing for itself, and the sweep that stops the fourth copy.
//
// WHY THIS IS A SECOND TEST FILE AND NOT MORE OF `tools/instant.test.mjs`.
// `tools/instant.test.mjs` is edited by Ursa#768, which is open, mergeable and
// waiting on the owner as this is written, and that pull request is the ExO
// seat's repair of two call sites of the exact function under test here. Two
// branches editing one test file is how the night's one merge conflict was
// made; the note that routed this work to this seat says so in those words. So
// the new suite is a new file, the one existing assertion this change
// contradicts is left alone, and nothing here touches a line inside #768's
// diff. `tools/instant-gate.test.mjs` is the precedent for a second suite over
// this module.

import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { calendarDay, utcDay, parseDay, parseInstant, parseEpochSeconds, toUtcInstant, timestampShape } from './instant.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = resolve(HERE, '..')

// The git committer date of 2026-11-09T04:00:00Z, in the three forms this
// repository's producers emit it.
const CT = 1794196800          // `git log --format=%ct`, SECONDS
const Z = '2026-11-09T04:00:00Z'
const OFFSET = '2026-11-08T23:00:00-05:00'  // the same instant, a day earlier as text

// ---------------------------------------------------------------- the copies
//
// The three spellings of one function that existed on 2026-11-09, transcribed
// so the collapse can be measured against them instead of asserted about.
// Each is a verbatim expression from the tree, and the citation is the point:
// if one of them changes, this file is where the divergence shows up.

/** `nowDay`, as it merged to `main` in Ursa#758. Gated on `timestampShape`,
 *  which decides a spelling and not an existence. DELETED from
 *  `tools/seat/read-dates.mjs` by this change; transcribed here so the
 *  collapse stays measured against what it replaced. */
const TRUNK_NOW_DAY = (now) => utcDay(now) ?? (timestampShape(now) === 'day' ? String(now) : null)

/** `nowDay`, as the ExO seat repaired it in Ursa#768: `parseDay` instead.
 *  Also deleted by this change; it is the copy `calendarDay` agrees with
 *  everywhere. */
const REPAIRED_NOW_DAY = (now) => utcDay(now) ?? (parseDay(now) === null ? null : String(now))

/** `dayOf`, from `tools/seat/outage.mjs` in Ursa#768. Same job, written
 *  separately, and it trims. Deleted by this change too, so all three
 *  expressions below are history and this is the only place they survive. */
const DAY_OF = (value) => {
  const s = String(value ?? '').trim()
  return utcDay(s) ?? (parseDay(s) === null ? null : s)
}

/** Every input class that reaches either call site, plus the ones that reach
 *  neither today and would have gone wrong if they did. */
const CLASSES = [
  '2026-11-09',
  '  2026-11-09  ',
  Z,
  OFFSET,
  '2026-02-30',
  '2026-13-99',
  '2026-00-00',
  'not a time',
  null,
  undefined,
  '2026-11-09T04:00:00',
  '',
  ' ',
  20261109
]

// ------------------------------------------------------------ the projection

test('calendarDay takes either shape, which is the whole reason it exists', () => {
  // An instant is projected onto its UTC day, and the offset is honoured
  // rather than sliced off: OFFSET is the 8th as text and the 9th in UTC.
  assert.equal(calendarDay(Z), '2026-11-09')
  assert.equal(calendarDay(OFFSET), '2026-11-09')
  assert.equal(String(OFFSET).slice(0, 10), '2026-11-08')
  // A day is already the answer and comes back unchanged, which is the half
  // `utcDay` refuses on purpose.
  assert.equal(calendarDay('2026-11-09'), '2026-11-09')
  assert.equal(utcDay('2026-11-09'), null)
})

test('calendarDay decides existence and not spelling, which is the defect it closes', () => {
  // The three days the calendar does not have. `timestampShape` calls all
  // three `'day'`, because its `BARE_DAY` is a spelling test; `parseDay`
  // refuses them, and `calendarDay` is built on `parseDay` for that reason.
  for (const impossible of ['2026-02-30', '2026-13-99', '2026-00-00']) {
    assert.equal(timestampShape(impossible), 'day', `${impossible}: the spelling is a day`)
    assert.equal(parseDay(impossible), null, `${impossible}: the calendar does not have it`)
    assert.equal(calendarDay(impossible), null, `${impossible}: so this refuses it`)
  }
  // And the consequence that made it worth finding, shown rather than
  // described: a non-existent day handed through as "today" does not raise.
  // Every comparison against it answers the absent value, and `isDayAfter`'s
  // absent value is `false`, which reads as "not in the future".
  const notADay = TRUNK_NOW_DAY('2026-02-30')
  assert.equal(notADay, '2026-02-30', 'the merged call site handed it through')
  assert.equal(calendarDay('2026-02-30'), null, 'this one does not')
})

test('calendarDay refuses the zoneless instant, because a day needs a zone to be picked', () => {
  // `'naive'` is unplaceable by this module's rule and by `parseInstant`'s.
  // Reading it as UTC is a four-hour guess and reading it through
  // `Date.parse` is a guess that changes with the runner's timezone.
  assert.equal(timestampShape('2026-11-09T04:00:00'), 'naive')
  assert.equal(parseInstant('2026-11-09T04:00:00'), null)
  assert.equal(calendarDay('2026-11-09T04:00:00'), null)
})

test('calendarDay does not trim, and the refusal is the same rule one layer up', () => {
  // `dayOf` trims and this does not. The reason is not taste: `parseDay` is
  // anchored, so a trimming `calendarDay` would return a day for a string
  // `parseDay` itself refuses, which re-creates the spelling-versus-existence
  // split that produced the original defect.
  assert.equal(calendarDay('  2026-11-09  '), null)
  assert.equal(parseDay('  2026-11-09  '), null)
  assert.equal(DAY_OF('  2026-11-09  '), '2026-11-09', 'the dropped behaviour, named')
})

test('calendarDay refuses every non-string that is not a placeable instant', () => {
  for (const v of [null, undefined, '', ' ', 'not a time', true, [], {}, NaN, 1.5]) {
    assert.equal(calendarDay(v), null, `${JSON.stringify(v)} is not a calendar day`)
  }
})

test('calendarDay agrees with all three hand-written copies wherever they agreed with each other', () => {
  // THE COLLAPSE, MEASURED. Not "this is equivalent" as a claim: the three
  // expressions are transcribed at the head of this file and run here against
  // every input class, and the only class on which this function differs from
  // any of them is the trim.
  const differences = []
  for (const v of CLASSES) {
    const mine = calendarDay(v)
    for (const [name, fn] of [['nowDay (#758, on main)', TRUNK_NOW_DAY], ['nowDay (#768)', REPAIRED_NOW_DAY], ['dayOf (#768)', DAY_OF]]) {
      const theirs = fn(v)
      if (theirs !== mine) differences.push(`${JSON.stringify(v)}: ${name} -> ${JSON.stringify(theirs)}, calendarDay -> ${JSON.stringify(mine)}`)
    }
  }
  assert.deepEqual(differences, [
    '"  2026-11-09  ": dayOf (#768) -> "2026-11-09", calendarDay -> null',
    '"2026-02-30": nowDay (#758, on main) -> "2026-02-30", calendarDay -> null',
    '"2026-13-99": nowDay (#758, on main) -> "2026-13-99", calendarDay -> null',
    '"2026-00-00": nowDay (#758, on main) -> "2026-00-00", calendarDay -> null'
  ])
  // Read the list, because it is the argument for this pull request. One
  // entry is the trim, declared and dropped above. The other three are the
  // spelling-versus-existence bypass, which is the defect the ExO seat
  // repaired at its own call site in #768 and which this function cannot
  // have, since it has no `timestampShape` branch to reach for.
  // A positive control, so an empty-input pass cannot produce a green: every
  // class really was run against every copy.
  assert.equal(CLASSES.length * 3, 42)
})

test('the number class is where two copies disagreed, and the cause was one level down', () => {
  // `nowDay(20261109)` answered '1970-01-01' on `main` before this change,
  // and `dayOf(20261109)` answered null, so one function written twice gave a
  // date and a refusal for one input. Neither author wrote the bug:
  // `toUtcInstant` read any number as epoch milliseconds and said so nowhere,
  // so `utcDay(20261109)` was '1970-01-01' and the day-shaped string came out
  // of the shared half.
  //
  // Reproduce the old behaviour on the trunk with:
  //   git stash && node -e "import('./tools/instant.mjs').then(m=>console.log(m.utcDay(20261109)))"
  assert.equal(utcDay(20261109), null)
  assert.equal(calendarDay(20261109), null)
  assert.equal(TRUNK_NOW_DAY(20261109), null, 'the merged copy is fixed by the fix one level down')
  assert.equal(DAY_OF(20261109), null)
})

// ------------------------------------------------- the unnamed number door

test('toUtcInstant reads a number as milliseconds, which is now written down and bounded', () => {
  // The composition the branch exists for, unchanged. `parseEpochSeconds`
  // multiplies by 1000 and `toUtcInstant` takes the product.
  assert.equal(parseEpochSeconds(CT), CT * 1000)
  assert.equal(toUtcInstant(parseEpochSeconds(CT)), Z)
  assert.equal(toUtcInstant(CT * 1000), Z)
})

test('toUtcInstant refuses the seconds-for-milliseconds slip instead of answering 1970', () => {
  // THE DEFECT. 1794196800 is what `git log --format=%ct` prints, so it is the
  // likeliest number a caller here is holding, and the two number-taking
  // functions in this module disagreed about its unit by a factor of 1000.
  // Before this change `toUtcInstant(CT)` was '1970-01-21T18:23:16Z': a
  // 56-year error at exit 0, in the reassuring direction, because a date in
  // 1970 looks like data and not like a fault.
  assert.equal(toUtcInstant(CT), null)
  assert.equal(utcDay(CT), null)
  // Every epoch-seconds value for a date after 2001 is above 1e9, and every
  // number below the floor read as milliseconds lands before 1990, so the
  // refused band is exactly the slip and contains no date this repository has.
  assert.equal(toUtcInstant(Date.UTC(1989, 11, 31)), null)
  assert.equal(toUtcInstant(Date.UTC(1990, 0, 1)), '1990-01-01T00:00:00Z')
  // A non-integer is refused for the reason `parseEpochSeconds` refuses
  // '1793594097.5': `new Date` truncates it and reports nothing.
  assert.equal(toUtcInstant(CT * 1000 + 0.5), null)
  assert.equal(toUtcInstant(NaN), null)
  assert.equal(toUtcInstant(Infinity), null)
})

test('a string spelling an instant before the floor is still accepted, because the floor is about units', () => {
  // The floor is a guard on a number with no unit. A string carries its own
  // zone and its own century, so there is nothing to slip.
  assert.equal(toUtcInstant('1970-01-21T18:23:16Z'), '1970-01-21T18:23:16Z')
  assert.equal(calendarDay('1970-01-21T18:23:16Z'), '1970-01-21')
  assert.equal(calendarDay('1970-01-21'), '1970-01-21')
})

// ------------------------------------------------------------- the sweep
//
// The gate. `timestampShape(...) === 'day'` outside this module is the bypass
// that produced the defect above, and it produced it twice in one night in two
// seats' files. A rule nobody can grep for is not enforced, which is this
// module's own sentence about its own lint.

/** Files the sweep excuses, with the reason beside each one.
 *
 *  EMPTY, AND IT IS EMPTY RATHER THAN ABSENT. It held one entry for part of
 *  the fifth wake — `tools/seat/read-dates.mjs`, whose `nowDay` gated on
 *  `timestampShape` — because the pull request repairing that line was open
 *  and that branch could not take it. The pull request merged mid-run, the
 *  call site is `calendarDay` now, and the entry was deleted rather than left
 *  to rot.
 *
 *  THE RULES EACH ENTRY IS HELD TO. Keyed by FILE and never by line, because
 *  a line number in another branch is not a line number here. A reason long
 *  enough to name the pull request that removes the entry. The length pinned
 *  below, so an append is an edit a reviewer sees rather than a quiet one.
 *  And, added in the sixth wake, the entry has to MATCH: an excused file that
 *  produces no finding is reported in `stale` and fails the sweep.
 *
 *  WHY THE MATCH RULE WAS MISSING, in the words of the seat that named it.
 *  Ursa/exo wrote at 2026-11-09T03:26:15Z, about the entry deleted above,
 *  "your allowlist entry is dead now rather than when I land. Zero findings
 *  in read-dates on current main. Your suite pins the list's length and never
 *  asks whether an entry matched, which is the stale check my corpus has and
 *  yours does not." That is exact. The deletion above was done by hand after
 *  reading a merge, and nothing in this file would have gone red had it been
 *  skipped. `tools/instant-gate.mjs` has carried the same check for its own
 *  corpus since Ursa#768 — its `decide` returns `stale` for an allowlist key
 *  that matches no line — so this is one instrument catching up to its
 *  sibling rather than a new idea. The two notions of stale differ because
 *  the keys differ: that gate keys on a line's exact text, so stale means the
 *  text moved or changed; this one keys on a file, so stale means the file is
 *  clean. */
const REPAIRED_ELSEWHERE = []

/** The bypass, as a line pattern. Comments are stripped first, because prose
 *  about this function reads exactly like a call to it. */
function shapeAsExistence (source) {
  const out = []
  source.split('\n').forEach((text, i) => {
    if (/^\s*\*/.test(text)) return
    const bare = text.replace(/\/\/.*$/, '')
    if (!/\btimestampShape\s*\(/.test(bare)) return
    if (!/['"]day['"]/.test(bare)) return
    out.push({ line: i + 1, text: text.trim() })
  })
  return out
}

test('shapeAsExistence fires on the bypass and not on the repair', () => {
  // The positive controls, so the absence measured below is a measurement.
  assert.equal(shapeAsExistence("return utcDay(now) ?? (timestampShape(now) === 'day' ? String(now) : null)").length, 1)
  assert.equal(shapeAsExistence("if (timestampShape(v) !== 'day') return null").length, 1)
  assert.equal(shapeAsExistence("switch (timestampShape(v)) { case 'day': return v }").length, 1)
  // The negatives. The repair, the other shapes, and prose.
  assert.deepEqual(shapeAsExistence('return calendarDay(now)'), [])
  assert.deepEqual(shapeAsExistence('return parseDay(v) === null ? null : v'), [])
  assert.deepEqual(shapeAsExistence("if (timestampShape(v) === 'naive') return null"), [])
  assert.deepEqual(shapeAsExistence("// timestampShape answers 'day' for a spelling"), [])
  assert.deepEqual(shapeAsExistence(" * timestampShape answers 'day' for a spelling"), [])
})

/** A test demonstrates the inversion on purpose, beside the assertion that
 *  contradicts it, which this file does nine lines above. Six such lines exist
 *  across two test files as of the sixth wake, so this skip is load-bearing
 *  and the test below measures that rather than assuming it. */
const TEST_FILE = /\.test\.(mjs|js|cjs|ts|tsx)$/

/** The sweep, as a function the tests can drive over input they control.
 *
 *  WHY IT IS A FUNCTION NOW. It was a loop inside the one test that called it,
 *  which is fine until the sweep acquires a verdict nobody can produce on
 *  purpose. `stale` is that verdict: it is empty on a healthy tree, which is
 *  indistinguishable from a `stale` that is empty because it is never
 *  computed. Extracted, the dead-entry case is reachable from a three-line
 *  synthetic corpus, and the two tests below are a positive and a negative
 *  control on the check rather than two readings of the same absence.
 *
 *  `{ offenders, stale, scanned, skipped }`:
 *   - `offenders` lines that bypass the day projection and are excused by
 *     nothing. Any entry here fails the sweep.
 *   - `stale` allowlist FILES that produced no finding at all, so the excuse
 *     is arguing about a line that is no longer there. Also fails.
 *   - `scanned` files actually read, which is the sweep's own denominator.
 *   - `skipped` files the skip pattern removed, so a skip that quietly grew
 *     to swallow the tree is visible in the number.
 */
function sweep ({ files, read, allowlist = REPAIRED_ELSEWHERE, skip = TEST_FILE }) {
  const hits = new Map(allowlist.map((e) => [e.file, 0]))
  const offenders = []
  let scanned = 0
  let skipped = 0
  for (const file of files) {
    if (skip && skip.test(file)) { skipped += 1; continue }
    let source
    try { source = read(file) } catch { continue }
    scanned += 1
    for (const f of shapeAsExistence(source)) {
      if (hits.has(file)) { hits.set(file, hits.get(file) + 1); continue }
      offenders.push(`${file}:${f.line} ${f.text}`)
    }
  }
  const stale = [...hits].filter(([, n]) => n === 0).map(([file]) => file)
  return { offenders, stale, scanned, skipped }
}

const trackedSources = () =>
  execFileSync('git', ['ls-files', '-z', '*.mjs', '*.js', '*.cjs', '*.ts', '*.tsx'], { cwd: REPO_ROOT, encoding: 'utf8' })
    .split('\0').filter(Boolean)

test('an allowlist entry that matches nothing is stale, and one that matches is not', () => {
  // The check Ursa/exo named as missing from this suite at
  // 2026-11-09T03:26:15Z. Driven over a corpus of two files so both verdicts
  // are produced on purpose in one call.
  const corpus = {
    'a/dirty.mjs': "if (timestampShape(v) === 'day') return v\n",
    'a/clean.mjs': 'return calendarDay(v)\n'
  }
  const files = Object.keys(corpus)
  const read = (f) => corpus[f]
  const why = 'the pull request repairing this line is open and this branch cannot take it'

  const live = sweep({ files, read, allowlist: [{ file: 'a/dirty.mjs', why }], skip: null })
  assert.deepEqual(live.offenders, [], 'an excused file must not also be an offender')
  assert.deepEqual(live.stale, [], 'an entry whose file still has the finding is live')

  const dead = sweep({ files, read, allowlist: [{ file: 'a/clean.mjs', why }], skip: null })
  assert.deepEqual(dead.stale, ['a/clean.mjs'], 'an entry over a clean file is stale')

  // And an entry for a file that is not in the tree at all is stale too,
  // which is the shape a renamed or deleted file leaves behind.
  const gone = sweep({ files, read, allowlist: [{ file: 'a/nosuch.mjs', why }], skip: null })
  assert.deepEqual(gone.stale, ['a/nosuch.mjs'], 'an entry over a file nobody reads is stale')
})

test('no source file decides a day by its spelling, and no excuse for one is stale', () => {
  const r = sweep({ files: trackedSources(), read: (f) => readFileSync(resolve(REPO_ROOT, f), 'utf8') })
  assert.deepEqual(r.offenders, [], 'use calendarDay(value), or parseDay(value) when you want the milliseconds')
  assert.deepEqual(r.stale, [], 'an allowlist entry matches no line: delete it, or repair the line it was arguing about')
  // The allowlist is pinned at its size, so an excused file needs an edit here
  // and a reason beside it rather than a quiet append. Zero today: the one
  // entry it carried was deleted when the pull request repairing its file
  // merged, mid-run in the fifth wake.
  assert.equal(REPAIRED_ELSEWHERE.length, 0)
  for (const e of REPAIRED_ELSEWHERE) {
    assert.equal(e.file, e.file.trim(), `${e.file}: the key must be a trimmed repository-relative path`)
    assert.ok(!TEST_FILE.test(e.file), `${e.file}: test files are skipped by rule, so an entry for one is dead weight`)
    assert.ok(e.why.length > 20, `${e.file} needs a reason`)
  }
  // A positive control, so a sweep that silently read nothing cannot pass.
  assert.ok(r.scanned > 300, `only ${r.scanned} files scanned`)
})

test('the test-file skip is load-bearing, and tools/instant.mjs no longer needs one', () => {
  // TWO SKIPS WENT IN TOGETHER AND ONLY ONE OF THEM EXCUSED ANYTHING.
  // Ursa/exo wrote at 2026-11-09T03:26:15Z, "your sweep needed a filename
  // skip and mine needs none: both tokens must share a line, and parseInstant
  // splits them." Measured here rather than conceded: `tools/instant.mjs`
  // calls `timestampShape` on line 203 and names `'day'` on line 204, and
  // this detector requires both tokens on ONE line, so the file the skip was
  // written to protect produces nothing to protect. The skip is deleted and
  // this test is what would have caught it being dead.
  //
  // `tools/instant-sweep.mjs`'s own header is the rule being obeyed: "the
  // skip list is the one place a sweep can lie about its own coverage." An
  // unmeasured skip is that lie whether or not it is currently excusing a
  // defect.
  const files = trackedSources()
  const read = (f) => readFileSync(resolve(REPO_ROOT, f), 'utf8')

  // The file the deleted skip named, read like any other file.
  assert.ok(files.includes('tools/instant.mjs'))
  assert.deepEqual(shapeAsExistence(read('tools/instant.mjs')), [], 'tools/instant.mjs holds the bypass on one line now, so it needs an allowlist entry and an argument')

  // The other skip is not dead: drop it and the sweep goes red, which is the
  // only evidence that keeping it is a decision rather than an inheritance.
  const unskipped = sweep({ files, read, skip: null })
  assert.ok(unskipped.offenders.length >= 1, 'no test file demonstrates the bypass any more, so the test-file skip is dead weight')
  for (const o of unskipped.offenders) {
    assert.ok(TEST_FILE.test(o.split(':')[0]), `${o}: the sweep with no skip found a non-test offender, which the real sweep should have caught`)
  }
  // And the skip removes test files and nothing else.
  const real = sweep({ files, read })
  assert.equal(real.scanned + real.skipped, files.length)
  assert.equal(real.skipped, files.filter((f) => TEST_FILE.test(f)).length)
})
