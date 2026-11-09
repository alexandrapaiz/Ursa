// node --test skills/tmp-fixture.test.mjs
//
// The unit tests here are the cheap half. The one that matters is the last
// one, which greps the other suites: the defect this module fixes was never in
// a predicate, it was in twenty call sites that each did the obvious thing, so
// the only test that keeps the count at zero is the one that fails when a
// twenty-first appears.
//
// The end-to-end test runs a child process, because removal happens on exit
// and a test inside the process cannot observe its own exit.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, writeFileSync, mkdirSync, readdirSync, readFileSync, rmSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { join } from 'node:path'
import { fixtureDir, outstanding } from './tmp-fixture.mjs'

const HERE = new URL('.', import.meta.url).pathname

test('a fixture directory exists while the process does', () => {
  const before = outstanding()
  const dir = fixtureDir('tmp-fixture-unit-')
  writeFileSync(join(dir, 'x.txt'), 'y')
  assert.equal(existsSync(dir), true)
  assert.equal(outstanding(), before + 1)
})

test('two calls with one prefix are two directories', () => {
  const a = fixtureDir('tmp-fixture-unit-')
  const b = fixtureDir('tmp-fixture-unit-')
  assert.notEqual(a, b)
})

test('the prefix carries its own separator, so it is passed through untouched', () => {
  const dir = fixtureDir('tmp-fixture-prefixcheck-')
  assert.match(dir.split('/').pop(), /^tmp-fixture-prefixcheck-/)
})

test('every directory is gone once the process that made it exits', () => {
  // The whole point of the module, and only observable from outside.
  const box = fixtureDir('tmp-fixture-box-')
  const script = join(box, 'child.mjs')
  writeFileSync(script, [
    `import { fixtureDir } from '${join(HERE, 'tmp-fixture.mjs')}'`,
    `import { writeFileSync, mkdirSync } from 'node:fs'`,
    `import { join } from 'node:path'`,
    `for (const p of ['child-a-', 'child-b-', 'child-c-']) {`,
    `  const d = fixtureDir(p)`,
    `  mkdirSync(join(d, 'nested'), { recursive: true })`,
    `  writeFileSync(join(d, 'nested', 'deep.txt'), 'content')`,
    `  console.log(d)`,
    `}`,
  ].join('\n'))

  const sandbox = join(box, 'tmp')
  mkdirSync(sandbox)
  const made = execFileSync('node', [script], { env: { ...process.env, TMPDIR: sandbox }, encoding: 'utf8' })
    .trim().split('\n')

  assert.equal(made.length, 3)
  assert.deepEqual(readdirSync(sandbox), [], 'the child left something behind')
  for (const d of made) assert.equal(existsSync(d), false, `${d} survived its process`)
})

test('a directory removed by the test itself does not make exit throw', () => {
  // rmSync of a missing path with force is a no-op, and the handler swallows
  // the rest. A suite that cleans up after itself must not break the maker.
  const box = fixtureDir('tmp-fixture-box-')
  const script = join(box, 'child.mjs')
  writeFileSync(script, [
    `import { fixtureDir } from '${join(HERE, 'tmp-fixture.mjs')}'`,
    `import { rmSync } from 'node:fs'`,
    `const d = fixtureDir('child-gone-')`,
    `rmSync(d, { recursive: true })`,
    `console.log('ok')`,
  ].join('\n'))
  const sandbox = join(box, 'tmp')
  mkdirSync(sandbox)
  const out = execFileSync('node', [script], { env: { ...process.env, TMPDIR: sandbox }, encoding: 'utf8' })
  assert.equal(out.trim(), 'ok')
})

test('no suite under skills/ makes a temporary directory of its own', () => {
  // The regression guard. Before 2026-11-09 twenty call sites did, and one
  // pass of the eight suites left 102 directories in a /tmp shared by every
  // seat on this host. A twenty-first call site puts the count back.
  //
  // It matches a CALL and not the name, which is not fussiness: the first
  // version matched the word and the only file it caught was this one, which
  // names the function twice in order to forbid it.
  const offenders = []
  for (const name of readdirSync(HERE).filter((n) => n.endsWith('.mjs')).sort()) {
    if (name === 'tmp-fixture.mjs') continue
    const text = readFileSync(join(HERE, name), 'utf8')
    if (/\bmkdtempSync\s*\(/.test(text)) offenders.push(name)
  }
  assert.deepEqual(offenders, [], 'these call mkdtempSync directly; use fixtureDir from tmp-fixture.mjs')
})
