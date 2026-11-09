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
  const own = ['CODE_SITE_CONSTRUCTS_CODE', 'CODE_UNDECIDED', 'CENSUS_ENTRY_STALE', 'CODE_SITE_UNACCOUNTED']
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

// ------------------------------------------------- the regex gap, and its guard
//
// Everything below was added 2026-11-09 after measuring that the gap this
// file's scanner docblock declared closed was open, and that the instrument
// the docblock sent a reader to in order to check — `scanGap` — was not a
// symbol in this repository. The two real shapes are first, because they are
// the ones that cost 6 of 63 sites on `origin/main` 511a973f.

test('a regex literal holding both quote marks does not swallow the sites after it', () => {
  // The real line, tools/instant.mjs:709. Before the repair the `'` in the
  // character class opened a string that ran to the next `'` several lines
  // down, and the three emission sites in between were never seen.
  const src = [
    "const sliced = /([A-Za-z_$][A-Za-z0-9_$.?!\\[\\]'\"()]*?)\\s*\\??\\.\\s*slice\\(0, 10\\)/.exec(bare)",
    "out.push({ code: 'TEXTUAL_DAY', repair: 'utcDay(value): slice(0, 10) is the local day' })",
    "out.push({ code: 'TEXTUAL_ORDER' })",
  ].join('\n')
  const r = emissionSites(src)
  assert.deepEqual(r.sites.map((x) => x.codes), [['TEXTUAL_DAY'], ['TEXTUAL_ORDER']])
  assert.deepEqual(r.unaccounted, [])
  assert.equal(r.regexSkipped, 1)
})

test('a regex literal holding backticks does not open a template', () => {
  // The real line, tools/ledger/check-closures.mjs:144. Three backticks: the
  // scanner paired two and opened a template on the third, which ran to the
  // end of the file and took all three of that checker's codes with it, so a
  // whole detector was absent from the inventory while the census printed that
  // no code is emitted with nothing watching it.
  const src = [
    'if (/^\\s*(```|~~~)/.test(line)) {',
    "  out.push({ rule: 'CLOSURE_SYNTAX' })",
    '}',
  ].join('\n')
  const r = emissionSites(src)
  assert.deepEqual(r.sites.map((x) => x.codes), [['CLOSURE_SYNTAX']])
  assert.deepEqual(r.unaccounted, [])
})

test('division is not read as a regex, and a candidate that hits a newline is re-read as division', () => {
  // The other half of the ambiguity, and the half a draft got wrong. Reading
  // division as a regex is the same desync in the other direction: it would
  // consume source to the next `/`. The newline bail is what bounds it,
  // because a regex literal cannot contain a raw newline.
  const src = [
    'const rate = total / windows',
    "const half = (a) / (b)",
    "out.push({ code: 'STILL_SEEN' })",
  ].join('\n')
  const r = emissionSites(src)
  assert.deepEqual(r.sites.map((x) => x.codes), [['STILL_SEEN']])
  assert.deepEqual(r.unaccounted, [])
  assert.equal(r.regexSkipped, 0, 'neither slash is a regex opener')
})

test('a regex after a keyword and after an operator both open, and after ) and ] neither does', () => {
  const opens = [
    "if (/x/.test(v)) out.push({ code: 'A_CODE' })",
    "return /y'/.test(v) ? out.push({ code: 'A_CODE' }) : null",
    "const m = v.match(/z\"/) || out.push({ code: 'A_CODE' })",
  ]
  for (const line of opens) {
    const r = emissionSites(line)
    assert.deepEqual(r.sites.map((x) => x.codes), [['A_CODE']], line)
  }
  // `)` and `]` end an expression, so the slash after them is division.
  const divides = emissionSites("const n = f(a) / g[b] / 2\nout.push({ code: 'A_CODE' })")
  assert.deepEqual(divides.sites.map((x) => x.codes), [['A_CODE']])
  assert.equal(divides.regexSkipped, 0)
})

test('CODE_SITE_UNACCOUNTED fires when the scanner loses its place, and is silent when it has not', () => {
  // THE POSITIVE CONTROL, and it has to be built from a shape the repaired
  // scanner still loses, or this check is an empty verdict nobody has ever
  // seen produced. `f()/'/.test(x)` is one: `)` ends an expression, so the
  // slash is division by the rule above, and the `'` after it therefore opens
  // a string that runs to the next `'` — in this corpus, three lines down.
  // That is correct behaviour for the tokeniser and still a lost site, which
  // is exactly why the reconciliation is keyed on the OUTCOME and not on the
  // tokeniser being right.
  const lost = [
    "const bad = f()/'/.test(x)",
    "  code: 'LOST_TO_THE_SCAN',",
    "const s = 'closes it'",
  ].join('\n')
  const r = emissionSites(lost)
  assert.deepEqual(r.sites, [], 'the scanner really does miss it, which is the premise')
  assert.deepEqual(r.unaccounted.map((u) => u.line), [2])

  const c = census(detector(lost), {}, [])
  const f = findingsOf(c)
  assert.deepEqual(f.map((x) => x.rule), ['CODE_SITE_UNACCOUNTED'])
  assert.match(f[0].message, /lost its place/)
  assert.equal(verdict(f, { scanned: 1 }).exitCode, 1)

  // The negative control: the same site with nothing in front of it.
  const fine = census(detector("out.push({ code: 'LOST_TO_THE_SCAN' })"), { 'tools/fake/detect.test.mjs': 'LOST_TO_THE_SCAN' }, [])
  assert.deepEqual(fine.unaccounted, [])
  assert.deepEqual(findingsOf(fine), [])
})

test('the reconciliation cannot match a comment or a prose mention of a code', () => {
  // `unaccounted` is a second reading of the source and a second reading is a
  // second chance at a false finding. The shape is a whole line: the property,
  // a colon, one quoted code, end of line. A comment line begins with `*` or
  // `//` and a prose mention is not a whole-line assignment.
  const src = [
    "// code: 'IN_A_COMMENT',",
    '/**',
    " * code: 'IN_A_DOC_BLOCK',",
    ' */',
    'const msg = `a finding whose rule is TEXTUAL_ORDER`',
    "const real = { code: 'THE_ONLY_ONE' }",
  ].join('\n')
  // The doc-block line needs its `/**` and `*/` to BE one: a bare ` * code:`
  // with no block open is source with a multiplication in front of it, and the
  // scanner reading it as an emission site is right. A draft of this test
  // omitted the delimiters and failed, which is the test being wrong rather
  // than the scanner.
  const r = emissionSites(src)
  assert.deepEqual(r.sites.map((x) => x.codes), [['THE_ONLY_ONE']])
  assert.deepEqual(r.unaccounted, [])
})

test('the codes the gap cost are read off the real files now', () => {
  // Keyed on the real sources rather than on the synthetic shapes above,
  // because those shapes were transcribed from these files by hand and a
  // transcription can drift from what it transcribed. Named and not counted:
  // a count stays green when one file is repaired and another regresses.
  //
  // IT ASSERTS THE LOST CODES ARE PRESENT, NOT THAT THE VOCABULARY IS EXACTLY
  // THIS, and the difference was measured rather than reasoned about. A draft
  // pinned `tools/instant.mjs` to its five sites with `deepEqual`. Ursa/exo's
  // Ursa#778 adds a sixth, `SHAPE_AS_EXISTENCE`, to that same file; performing
  // the merge locally turned this test red while the gate itself stayed clean
  // at 80 codes and exit 0. The property under test is that nothing after the
  // desync point is lost, which is a statement about the codes the gap cost.
  // A pin on the whole vocabulary is a different and weaker thing: it fails
  // for any sibling's addition, and `unaccounted` below is the assertion that
  // actually covers additions.
  const root = new URL('../../', import.meta.url).pathname
  const lost = {
    'tools/instant.mjs': ['TEXTUAL_DAY', 'TEXTUAL_ORDER'],
    'tools/ledger/check-closures.mjs': ['CLOSURE_RESOLVES', 'CLOSURE_STATUS', 'CLOSURE_SYNTAX'],
  }
  for (const [file, codes] of Object.entries(lost)) {
    const r = emissionSites(readFileSync(root + file, 'utf8'))
    const seen = new Set(r.sites.flatMap((s) => s.codes ?? []))
    for (const code of codes) assert.ok(seen.has(code), `${file}: ${code} is behind the old desync point`)
    assert.deepEqual(r.unaccounted, [], file)
    // The sites before the desync point are still read, so the repair added
    // coverage rather than moving it.
    assert.ok(r.sites.length >= codes.length, file)
  }
})

test('no detector in the real trees has an unaccounted site', () => {
  // The tree-wide form of the check, which is what would have contradicted the
  // docblock sentence on the day it was written. Zero today over 75 files and
  // 83 sites; the positive control that this is a measurement and not an empty
  // loop is the synthetic case above.
  const files = execFileSync('git', ['ls-files', '-z', 'tools', 'scripts'], { cwd: new URL('../../', import.meta.url).pathname, encoding: 'utf8' })
    .split('\0').filter((f) => /\.(mjs|js|cjs)$/.test(f) && !/\.test\./.test(f))
  const root = new URL('../../', import.meta.url).pathname
  const bad = []
  let sites = 0
  for (const f of files) {
    const r = emissionSites(readFileSync(root + f, 'utf8'))
    sites += r.sites.length
    for (const u of r.unaccounted) bad.push(`${f}:${u.line} ${u.text}`)
  }
  assert.deepEqual(bad, [], 'the character scanner lost its place: fix the tokeniser')
  assert.ok(files.length > 50, `only ${files.length} detectors scanned`)
  assert.ok(sites > 70, `only ${sites} sites scanned`)
})
