// What `tools/gates/import-effects.mjs` decides, driven from fixtures rather
// than from the repository, plus the three live controls that cannot be
// fixtures because their whole point is that they are real.
//
//   node --test tools/gates/import-effects.test.mjs

import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'

import { guardKind, ifCondition, scanModule, sweep } from './import-effects.mjs'
import { GATE, verdict } from './import-effects-verdict.mjs'

const GUARD = "const invokedDirectly =\n  process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href\n"

test('the canonical guard is the identity question', () => {
  assert.deepEqual(
    guardKind("process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href"),
    { kind: 'identity' },
  )
})

test('a basename comparison is a guard that asks the wrong question', () => {
  // Both spellings in these trees: endsWith on argv[1], and split('/').pop().
  assert.deepEqual(guardKind("process.argv[1] && process.argv[1].endsWith('spend.mjs')"), { kind: 'basename' })
  assert.deepEqual(
    guardKind("process.argv[1] && import.meta.url.endsWith(process.argv[1].split('/').pop())"),
    { kind: 'basename' },
  )
})

test('process.argv[1] is the necessary term, so a path-resolution idiom is not a guard', () => {
  // The regression this pins: `const REPO_ROOT = resolve(dirname(
  // fileURLToPath(import.meta.url)), '..', '..')` was read as a guard named
  // REPO_ROOT by the first version, after which every module-scope `if`
  // mentioning REPO_ROOT was reported as a guard asking the wrong question.
  assert.equal(guardKind("resolve(dirname(fileURLToPath(import.meta.url)), '..', '..')"), null)
  assert.equal(guardKind("new URL('./x.json', import.meta.url)"), null)
})

test('ifCondition takes the balanced condition and not the first close paren', () => {
  assert.equal(
    ifCondition('if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(x)) {'),
    'process.argv[1] && path.resolve(process.argv[1]) === path.resolve(x)',
  )
  // A paren inside a quoted file name must not end the condition.
  assert.equal(ifCondition("if (a.endsWith('x(.mjs')) main()"), "a.endsWith('x(.mjs')")
  assert.equal(ifCondition('for (const x of y) {'), null)
})

test('a module whose program is at module scope is one finding, not one per line', () => {
  const src = [
    "import { readFileSync } from 'node:fs'",
    '',
    'const argv = process.argv.slice(2)',
    '',
    "if (argv.includes('--help')) {",
    '  console.log(usage)',
    '  process.exit(0)',
    '}',
    '',
    'const text = readFileSync(argv[0])',
    'console.log(text.length)',
    'process.exit(0)',
  ].join('\n')
  const hits = scanModule(src, 'tools/x.mjs')
  assert.equal(hits.length, 3, 'three statements, before the sweep collapses them')
  const { findings } = sweep({ 'tools/x.mjs': src }, { excused: [] })
  assert.equal(findings.length, 1)
  assert.equal(findings[0].rule, 'IMPORT_DOES_WORK')
  assert.match(findings[0].message, /and 2 more statement\(s\) below it/)
})

test('all three ways a guard can be named resolve to the guard', () => {
  // The three in these trees, all of which the first version called defective
  // because the predicate is nowhere on the `if` line.
  const forms = [
    `${GUARD}\nif (invokedDirectly) {\n  main()\n}\n`,
    `${GUARD}\nif (invokedDirectly) process.exit(main(process.argv.slice(2)))\n`,
    'function invokedDirectly() {\n  return process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href\n}\n\nif (invokedDirectly()) {\n  main()\n}\n',
  ]
  for (const src of forms) {
    assert.deepEqual(scanModule(src, 'tools/x.mjs'), [], `guarded: ${src.split('\n').slice(-4, -2).join(' / ')}`)
  }
})

test('the finding for a wrong guard names the definition, not the if that reads it', () => {
  const src = [
    "const invokedDirectly = process.argv[1] && process.argv[1].endsWith('x.mjs');",
    'if (invokedDirectly) {',
    '  main();',
    '}',
  ].join('\n')
  const hits = scanModule(src, 'tools/x.mjs')
  assert.equal(hits.length, 1)
  assert.equal(hits[0].code, 'GUARD_ASKS_THE_WRONG_QUESTION')
  assert.equal(hits[0].line, 1, 'line 1 is the declaration; line 2 is correct and must not be blamed')
})

test('work inside a guarded block is out of scope structurally, with no exemption', () => {
  const src = `${GUARD}\nif (invokedDirectly) {\n  for (const x of y) console.log(x)\n  process.exit(0)\n}\n`
  assert.deepEqual(scanModule(src, 'tools/x.mjs'), [])
})

test('a column-0 line inside a template literal is not a statement', () => {
  const src = ['const usage = `usage: x.mjs [--json]', 'if (you) see(this) it is prose', '`', ''].join('\n')
  assert.deepEqual(scanModule(src, 'tools/x.mjs'), [])
})

test('a column-0 line inside a block comment is not a statement', () => {
  const src = ['/*', 'main()', 'process.exit(1)', '*/', "const x = 1", ''].join('\n')
  assert.deepEqual(scanModule(src, 'tools/x.mjs'), [])
})

test('declarations and wrapped-expression continuations are not statements', () => {
  const src = [
    "import { a } from 'b'",
    'export function f() {',
    '  return 1',
    '}',
    'export const g = () =>',
    '  f()',
    'const h = [',
    '  1,',
    ']',
    'class K {}',
    '',
  ].join('\n')
  assert.deepEqual(scanModule(src, 'tools/x.mjs'), [])
})

test('a baseline entry suppresses its own module and nothing else', () => {
  const bad = 'main()\n'
  const modules = { 'tools/a.mjs': bad, 'tools/b.mjs': bad }
  const baseline = { excused: [{ file: 'tools/a.mjs', code: 'IMPORT_DOES_WORK', why: 'x' }] }
  const { findings } = sweep(modules, baseline)
  assert.equal(findings.length, 1)
  assert.equal(findings[0].file, 'tools/b.mjs')
})

test('a baseline entry that outlived its finding is itself a finding', () => {
  const baseline = { excused: [{ file: 'tools/gone.mjs', code: 'IMPORT_DOES_WORK', why: 'x' }] }
  const { findings } = sweep({ 'tools/a.mjs': "const x = 1\n" }, baseline)
  assert.equal(findings.length, 1)
  assert.equal(findings[0].rule, 'IMPORT_BASELINE_STALE')
  assert.match(findings[0].message, /An excuse that outlives its finding/)
})

test('the verdict exits 0 only with nothing to show and names the committed locus otherwise', () => {
  const clean = verdict([], { scanned: 84, excusedCount: 10, hits: 10, statements: 77 })
  assert.equal(clean.exitCode, 0)
  assert.equal(clean.cause, 'EVERY_IMPORT_IS_INERT')
  const red = verdict([{ rule: 'IMPORT_DOES_WORK', message: 'x' }], { scanned: 84, excusedCount: 10, hits: 11, statements: 78 })
  assert.equal(red.exitCode, 1)
  assert.equal(red.cause, 'IMPORT_IS_NOT_INERT')
  assert.match(red.line, /a committed\s+file/)
})

test('the ground verdicts are exit 2 and carry no findings', () => {
  for (const probe of GATE.groundProbes) {
    const v = probe.call()
    assert.equal(v.exitCode, 2, probe.name)
    assert.equal(v.derivedFrom, 'ground', probe.name)
  }
})

// ---------------------------------------------------------------------------
// Live controls. These are not fixtures on purpose: the gate's whole claim is
// about real modules in this repository, and a fixture cannot show that an
// import of a real file is now inert when it was not before.
// ---------------------------------------------------------------------------

const ROOT = new URL('../..', import.meta.url).pathname

test('importing tools/board/read-filters.mjs with --help in argv reaches the importer', () => {
  // The repaired instance. Before the repair this printed the tool's usage
  // line and exited the importing process at exit 0, in a file whose own
  // closing comment says it is importable without running its probes.
  const dir = mkdtempSync(join(tmpdir(), 'import-effects-'))
  const probe = join(dir, 'probe.mjs')
  writeFileSync(
    probe,
    `await import(${JSON.stringify(join(ROOT, 'tools/board/read-filters.mjs'))})\nconsole.log('IMPORTER_REACHED_ITS_OWN_LINE')\n`,
  )
  const out = execFileSync('node', [probe, '--help'], { encoding: 'utf8' })
  assert.match(out, /IMPORTER_REACHED_ITS_OWN_LINE/)
  assert.doesNotMatch(out, /usage: read-filters\.mjs/)
})

test('importing tools/image-metadata.mjs from a module whose name is a suffix reaches the importer', () => {
  // The other repaired instance, and the one that proves a basename guard is
  // not a stylistic preference. The importer is named `metadata.mjs` so that
  // `.../image-metadata.mjs`.endsWith('metadata.mjs') is true, which is what
  // the old predicate asked. Before the repair the import printed the whole
  // image census and then process.exit ended the importing process.
  const dir = mkdtempSync(join(tmpdir(), 'import-effects-'))
  const probe = join(dir, 'metadata.mjs')
  writeFileSync(
    probe,
    `await import(${JSON.stringify(join(ROOT, 'tools/image-metadata.mjs'))})\nconsole.log('IMPORTER_REACHED_ITS_OWN_LINE')\n`,
  )
  const out = execFileSync('node', [probe], { encoding: 'utf8' })
  assert.match(out, /IMPORTER_REACHED_ITS_OWN_LINE/)
  assert.doesNotMatch(out, /tracked images/)
})

test('the gate is in its own scope and is clean over this repository', () => {
  // A gate exempt from itself is the defect it detects. Run as a CLI rather
  // than imported, because the program half reads git and every module under
  // two trees -- which is why its verdict lives in a separate module.
  const out = execFileSync('node', [join(ROOT, 'tools/gates/import-effects.mjs')], { encoding: 'utf8' })
  assert.match(out, /^Import effects: \d+ non-test module\(s\)/)
  assert.match(out, /Every module that does work does it behind a guard/)
})
