// node --test tools/gates/code-census.test.mjs
//
// The synthetic detectors here commit each defect on purpose and go through the
// same `census` the real trees go through, rather than a re-implementation of
// it. That discipline is `tools/gates/enumerate-verdicts.test.mjs`'s and the
// reason is recorded there: a suite that re-implements the checks proves they
// fire in the copy while the program's own copy drifts green.
//
// The three cases that are easy to get wrong are first, because each one was
// wrong in a draft of the scanner and each would have been a false clean or a
// false finding on the real tree.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { census, codesIn, emissionSites, findingsOf, verdict } from './code-census.mjs'

const detector = (src) => ({ 'tools/fake/detect.mjs': src })
const codesOf = (src) =>
  emissionSites(src).sites.map((s) => ({ kind: s.kind, codes: s.codes, line: s.line }))

test('a code: in a JSDoc block is not an emission site', () => {
  // The exact line `tools/board/check.mjs:297` carries. A comment-blind scan
  // reports `string` as a code value and then reports the site as
  // unenumerable, which is a finding against a file that has no defect.
  const src = [
    '/**',
    ' * @typedef {{ code: string, line: string, repair: string }} Violation',
    ' */',
    "const real = { code: 'ONLY_THIS_ONE' }",
  ].join('\n')
  assert.deepEqual(codesOf(src), [{ kind: 'literal', codes: ['ONLY_THIS_ONE'], line: 4 }])
})

test('a member access ending in .code is not a property named code', () => {
  // `tools/board/measure-claims.mjs:167` writes
  // `shares_withheld: fault ? fault.code : null`, which ends in the same three
  // characters a property does. Reported as `code: null` by the first draft,
  // which is a finding against a line that emits nothing. Same word-boundary
  // argument the ExO seat made for `\bnow` over `know` on 2026-11-09.
  assert.deepEqual(codesOf('const x = { shares: fault ? fault.code : null }'), [])
  assert.deepEqual(codesOf('const x = { decoded : 1 }'), [])
})

test('the word rule: inside a string literal is prose, not a property', () => {
  // `ursa-major/src/invariants.ts:217` has this shape. Blanking comments does
  // not reach inside a string; only tracking string state does.
  assert.deepEqual(codesOf("const why = 'the rule: nothing here is a code'"), [])
})

test('one literal and a ternary of two literals are both enumerable', () => {
  assert.deepEqual(codesIn("'TEXTUAL_ORDER'"), { kind: 'literal', codes: ['TEXTUAL_ORDER'] })
  // `tools/board/measured-citation.mjs:154`, verbatim in shape: both arms are
  // in the source, so the set is complete.
  assert.deepEqual(
    codesIn("b.read_at === undefined ? 'READ_AT_ABSENT' : 'READ_AT_NOT_AN_INSTANT'"),
    { kind: 'literal', codes: ['READ_AT_ABSENT', 'READ_AT_NOT_AN_INSTANT'] },
  )
})

test('a template, a call, and a literal used as a default are all constructed', () => {
  // The template is the shape `tools/board/page.mjs:331` had until 2026-11-09.
  assert.equal(codesIn('`COVERAGE_${c.reason}`').kind, 'constructed')
  assert.equal(codesIn("prefix('STALE')").kind, 'constructed')
  // `x || 'A'` is the one that looks safe and is not: one of its two paths is
  // an identifier, so the literal is a fallback and not the vocabulary.
  assert.equal(codesIn("c.incomplete_code || 'COVERAGE_UNKNOWN'").kind, 'constructed')
})

test('a bare identifier forwards a code and is not a finding', () => {
  assert.deepEqual(codesIn('c.incomplete_code'), { kind: 'forwarded', codes: [] })
  const c = census(detector('f({ code: incoming })'), {}, [])
  assert.equal(c.forwarded.length, 1)
  assert.deepEqual(findingsOf(c), [])
  assert.equal(verdict([], { forwarded: 1 }).exitCode, 0)
})

test('CODE_UNDECIDED fires on a code no test file names, and stops when one does', () => {
  const src = "f({ code: 'WATCHED' }); f({ code: 'UNWATCHED' })"
  const before = census(detector(src), { 'tools/fake/detect.test.mjs': 'WATCHED' }, [])
  assert.deepEqual(
    before.rows.map((r) => [r.code, r.state]),
    [['UNWATCHED', 'undecided'], ['WATCHED', 'asserted']],
  )
  const f = findingsOf(before)
  assert.equal(f.length, 1)
  assert.equal(f[0].rule, 'CODE_UNDECIDED')
  assert.match(f[0].message, /UNWATCHED/)
  assert.equal(verdict(f, {}).exitCode, 1)

  const after = census(detector(src), { 'tools/fake/detect.test.mjs': 'WATCHED UNWATCHED' }, [])
  assert.deepEqual(findingsOf(after), [])
  assert.equal(verdict(findingsOf(after), {}).exitCode, 0)
})

test('a word that merely contains a code name does not decide it', () => {
  // `\bCODE\b`, so `MY_UNWATCHED_THING` in a test file is not an assertion
  // about `UNWATCHED`. The failure mode this prevents is the expensive one: a
  // substring match turns an unwatched code green by accident.
  const c = census(
    detector("f({ code: 'UNWATCHED' })"),
    { 'tools/fake/detect.test.mjs': 'MY_UNWATCHEDX_THING' },
    [],
  )
  assert.equal(c.rows[0].state, 'undecided')
})

test('CODE_SITE_CONSTRUCTS_CODE fires, and the literals the site did spell are still decided', () => {
  const c = census(
    detector("f({ code: `COVERAGE_${r}` }); f({ code: 'PLAIN' })"),
    { 'tools/fake/detect.test.mjs': 'PLAIN' },
    [],
  )
  const f = findingsOf(c)
  assert.deepEqual(f.map((x) => x.rule), ['CODE_SITE_CONSTRUCTS_CODE'])
  assert.match(f[0].message, /BUILDS a defect code/)
  // `PLAIN` is asserted, so the readable half of the file is not dragged down
  // by the unreadable half, and the unreadable half is still reported.
  assert.deepEqual(c.rows.map((r) => [r.code, r.state]), [['PLAIN', 'asserted']])
})

test('a constructed site that also spells a literal still has that literal decided', () => {
  // `code: x ? 'A' : y` -- one arm literal, one not. Constructed, because the
  // set is not provably those literals, but `A` is still in the vocabulary and
  // still needs deciding. Dropping it would let a constructed site hide a code
  // it does spell.
  const c = census(detector("f({ code: x ? 'SPELLED' : y })"), {}, [])
  assert.equal(c.constructed.length, 1)
  assert.deepEqual(c.rows.map((r) => [r.code, r.state]), [['SPELLED', 'undecided']])
  assert.deepEqual(findingsOf(c).map((x) => x.rule), ['CODE_SITE_CONSTRUCTS_CODE', 'CODE_UNDECIDED'])
})

test('a baseline entry excuses a code, and CENSUS_ENTRY_STALE fires when it outlives the finding', () => {
  const src = "f({ code: 'UNREACHABLE_BY_TEST' })"
  const entry = { code: 'UNREACHABLE_BY_TEST', why: 'it is a ground fault', measured: '2026-11-09' }

  const excused = census(detector(src), {}, [entry])
  assert.equal(excused.rows[0].state, 'excused')
  assert.equal(excused.rows[0].why, 'it is a ground fault')
  assert.deepEqual(findingsOf(excused), [])

  // Now a test names it, so the excuse has outlived its finding.
  const nowAsserted = census(detector(src), { 'tools/fake/detect.test.mjs': 'UNREACHABLE_BY_TEST' }, [entry])
  const f1 = findingsOf(nowAsserted)
  assert.deepEqual(f1.map((x) => x.rule), ['CENSUS_ENTRY_STALE'])
  assert.match(f1[0].message, /now named by tools\/fake\/detect\.test\.mjs/)

  // And when no detector emits it at all.
  const gone = census(detector('f({})'), {}, [entry])
  const f2 = findingsOf(gone)
  assert.deepEqual(f2.map((x) => x.rule), ['CENSUS_ENTRY_STALE'])
  assert.match(f2[0].message, /no detector emits it/)
})

test('a two-letter constant is not a code, and a lowercase one is not either', () => {
  assert.deepEqual(census(detector("f({ code: 'OK' })"), {}, []).rows, [])
  assert.deepEqual(census(detector("f({ rule: 'ok_thing' })"), {}, []).rows, [])
  // Both of those are `constructed`, not silently dropped: the site assigns
  // something this scan cannot certify as a code, which is reported rather
  // than assumed harmless.
  assert.equal(census(detector("f({ code: 'OK' })"), {}, []).constructed.length, 1)
})

test('the verdict derives its own exit code and names its own cause', () => {
  const clean = verdict([], { codes: 72, detectors: 15, asserted: 65, excused: 5, forwarded: 1 })
  assert.equal(clean.exitCode, 0)
  assert.equal(clean.cause, 'EVERY_CODE_DECIDED')
  assert.match(clean.line, /72 code\(s\) across 15 detector\(s\)/)
  assert.match(clean.line, /weaker than "asserted on"/)

  const red = verdict([{ rule: 'CODE_UNDECIDED' }], { codes: 72, sites: 76 })
  assert.equal(red.exitCode, 1)
  assert.equal(red.cause, 'CODE_DECIDED_BY_NOTHING')
  assert.equal(red.stream, 'err')

  const ground = verdict([], { ground: { cause: 'SCAN_FOUND_NO_SITES', line: 'nothing was read' } })
  assert.equal(ground.exitCode, 2)
  assert.equal(ground.derivedFrom, 'ground')
  assert.equal(ground.cause, 'SCAN_FOUND_NO_SITES')
})

test('the real trees are clean, which is this gate run as a test', () => {
  // The gate itself, so a change that reintroduces an undecided code fails the
  // suite and not only the gate. `node --test` and the CLI are the same code
  // path by construction: the CLI calls `census`, `findingsOf` and `verdict`.
  const gate = new URL('./code-census.mjs', import.meta.url).pathname
  const r = execFileSync('node', [gate], { encoding: 'utf8' })
  assert.match(r, /No emission site builds a code the source does not spell/)
})

test('this gate does not ride on another gate\'s test for its own code name', () => {
  // The first draft called this code `BASELINE_ENTRY_STALE`, which
  // `tools/secret-scan-verdict.mjs` already uses and its test already asserts,
  // so the census reported its own untested code as decided. The name is
  // unique now, and this test is what keeps it unique: if it ever collides
  // again, the census will call it asserted without this suite's help and the
  // count below will be the only thing that notices.
  const own = ['CODE_SITE_CONSTRUCTS_CODE', 'CODE_UNDECIDED', 'CENSUS_ENTRY_STALE']
  const source = readFileSync(new URL('./code-census.mjs', import.meta.url), 'utf8')
  for (const code of own) {
    assert.match(source, new RegExp(`rule: '${code}'`), `${code} is emitted here`)
    assert.match(
      readFileSync(new URL('./code-census.test.mjs', import.meta.url), 'utf8'),
      new RegExp(`\\b${code}\\b`),
      `${code} is asserted here, not somewhere else`,
    )
  }
})
