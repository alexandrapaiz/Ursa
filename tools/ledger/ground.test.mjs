// What `./ground.mjs` promises, asserted through the three gates that call it
// rather than only on the module.
//
// The module's own surface is three functions and most of it is a sentence, so
// a suite that only called `requireEntries(…, 0, …)` and checked the exit code
// would assert the thing that cannot break. What can break is the wiring: a
// gate that reads its ledger before establishing it, a guard placed after the
// work rather than before it, or a refusal scoped so wide it swallows an
// answer. That last one is not hypothetical. Scoping `check-attributes`'s git
// wrapper around every call instead of around `ls-files` alone made three of
// that gate's own cases exit 3 where they expect 1 and 2, because a failing
// `git config --get` is that gate's ANSWER and `refuse` ends the process
// before the call site's own catch can run.
//
// So every case here drives a real gate as a program, and the two properties
// it checks are the two a refusal has to have: the exit code is 3, and stdout
// is empty. The second matters as much as the first. A reader and a CI log
// both scan stdout for a verdict line, so a refusal that prints a sentence
// there has put something in the slot a verdict occupies.
//
// Written 2026-11-09 by Ursa's security seat with F127 and F128.

import test from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { NO_VERDICT } from './ground.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')

const INSTANCES = []
process.on('exit', () => {
  for (const dir of INSTANCES) {
    try {
      fs.rmSync(dir, { recursive: true, force: true })
    } catch {
      // A teardown that throws would report a disk fault as a test failure.
    }
  }
})

// The pid is in the prefix because /tmp is shared between every seat running
// on this host, which `node tools/seat/env-facts.mjs` carries as
// `tmp-is-shared-between-seats`. A bare prefix glob is another run's path too.
function scratch(tag) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), `ursa-ground-${process.pid}-${tag}-`))
  INSTANCES.push(dir)
  return dir
}

/** A tree with the whole of `tools/` and nothing else, so each case adds back
 *  exactly the one premise it is about. */
function treeWithTools(tag) {
  const dir = scratch(tag)
  fs.cpSync(path.join(ROOT, 'tools'), path.join(dir, 'tools'), { recursive: true })
  return dir
}

function gate(dir, rel, args = []) {
  const out = spawnSync(process.execPath, [path.join(dir, rel), ...args], {
    cwd: dir,
    encoding: 'utf8',
    maxBuffer: 32 * 1024 * 1024,
  })
  if (out.error || out.status === null) {
    const why = out.error
      ? `${out.error.code || out.error.name}: ${out.error.message}`
      : `killed by ${out.signal}`
    throw new Error(
      `the gate could not be run at all (${rel}): ${why}. This is not a `
      + 'verdict about the gate; it is this suite being unable to ask.',
    )
  }
  return { code: out.status, stdout: out.stdout || '', stderr: out.stderr || '' }
}

/** The two properties every refusal has, plus the cause named. */
function assertRefused(got, cause) {
  assert.equal(got.code, NO_VERDICT,
    `expected exit ${NO_VERDICT}, got ${got.code}. stdout: ${got.stdout}`)
  assert.equal(got.stdout.trim(), '',
    'a refusal must print nothing in the slot a verdict occupies')
  assert.match(got.stderr, /NO VERDICT \(exit 3\)/,
    'the refusal must say so in the words a reader can grep for')
  assert.match(got.stderr, cause, 'the refusal must name its own cause')
}

test('exit 3 is not a code any of these gates returns for a finding', () => {
  // The whole point of the code. If 3 were also a findings code the
  // distinction would be unstated again, one level along.
  assert.equal(NO_VERDICT, 3)
  for (const mod of ['./attributes-verdict.mjs', './closures-verdict.mjs',
    './blockers-verdict.mjs']) {
    const src = fs.readFileSync(path.join(ROOT, 'tools/ledger', mod.slice(2)), 'utf8')
    assert.ok(!/exitCode:\s*3/.test(src),
      `${mod} returns exitCode 3 for a finding, which collides with NO_VERDICT`)
  }
})

test('check-closures refuses rather than throwing when the ledger is absent', () => {
  const dir = treeWithTools('cl-absent')
  assertRefused(gate(dir, 'tools/ledger/check-closures.mjs'), /cannot read .*docs\/ideas\.md/)
})

test('check-closures refuses rather than calling the empty ledger all closed', () => {
  // The F127 shape, and the reason this file exists. Before the guard this
  // printed `Closure backlinks: 0 closure marker(s) in 0 document(s), against
  // docs/ideas.md, all resolved and all closed. Exit 0.` -- and
  // scripts/ci-checks.mjs registers this gate at passExit: [0, 2], so that
  // green passed CI.
  const dir = treeWithTools('cl-empty')
  fs.mkdirSync(path.join(dir, 'docs'), { recursive: true })
  fs.writeFileSync(path.join(dir, 'docs/ideas.md'), '')
  const got = gate(dir, 'tools/ledger/check-closures.mjs')
  assertRefused(got, /read 0 dated, titled ledger entr\(ies\)/)
  assert.ok(!/all resolved and all closed/.test(got.stdout + got.stderr),
    'the vacuous verdict must not be printed on either stream')
})

test('check-blockers refuses rather than throwing out of node:fs on an absent ledger', () => {
  const dir = treeWithTools('bl-absent')
  const got = gate(dir, 'tools/ledger/check-blockers.mjs')
  assertRefused(got, /cannot read docs\/ideas\.md/)
  assert.ok(!/node:fs/.test(got.stderr),
    'a stack trace out of node:fs reads as a defect in the gate itself')
})

test('check-blockers refuses on an empty ledger, where it had been vacuous', () => {
  const dir = treeWithTools('bl-empty')
  fs.mkdirSync(path.join(dir, 'docs'), { recursive: true })
  fs.writeFileSync(path.join(dir, 'docs/ideas.md'), '')
  assertRefused(gate(dir, 'tools/ledger/check-blockers.mjs'), /read 0 ledger entr\(ies\)/)
})

test('check-attributes refuses an absent driver registry at 3, not at its findings code 1', () => {
  // `tools/gates/verdict-shape.mjs` already names this gate's absent driver as
  // a GROUND verdict rather than a FINDINGS one, in its `derivedFrom`
  // paragraph. The gate exited 1, which its own verdict() also returns for a
  // clone-locus finding, so the two were one code.
  const dir = scratch('at-noreg')
  const got = gate(ROOT, 'tools/ledger/check-attributes.mjs', ['--repo', dir])
  assertRefused(got, /no driver registry/)
})

test('check-attributes refuses when git cannot answer, naming the command', () => {
  const dir = scratch('at-nogit')
  fs.mkdirSync(path.join(dir, 'tools/ledger'), { recursive: true })
  fs.copyFileSync(path.join(ROOT, 'tools/ledger/drivers.json'),
    path.join(dir, 'tools/ledger/drivers.json'))
  const got = gate(ROOT, 'tools/ledger/check-attributes.mjs', ['--repo', dir])
  // `git` writes its own `fatal:` line to stderr before this gate speaks, so
  // the assertion is on the gate's sentence and not on stderr being only that.
  assert.equal(got.code, NO_VERDICT, `expected 3, got ${got.code}: ${got.stdout}`)
  assert.equal(got.stdout.trim(), '', 'a refusal prints no verdict')
  assert.match(got.stderr, /NO VERDICT \(exit 3\)\. `git ls-files -z` failed/)
})

test('the refusal is scoped: a clone-locus finding is still 2 and not 3', () => {
  // The regression this suite exists to hold. Wrapping every git call in
  // check-attributes, rather than `ls-files` alone, turned this case into a
  // refusal: `git config --get` exits 1 to mean the key is not set, which is
  // the finding, and `refuse` ran before the call site's catch.
  //
  // The registry is a one-driver literal rather than the real
  // tools/ledger/drivers.json, copied from the shape check-attributes.test.mjs
  // uses. The real one names tools/registers/registers.json, and a fixture
  // without that table trips a COMMITTED-locus finding at exit 1 instead --
  // which is a different code for a different reason and would have let this
  // case pass while asserting nothing about the scoping.
  const dir = scratch('at-clone')
  const git = (...a) => spawnSync('git', ['-C', dir, ...a], { encoding: 'utf8' })
  git('init', '-q', '-b', 'main', '.')
  git('config', 'user.email', 'seat@ursa.invalid')
  git('config', 'user.name', 'ground test')
  fs.mkdirSync(path.join(dir, 'tools/ledger'), { recursive: true })
  fs.mkdirSync(path.join(dir, 'docs'), { recursive: true })
  fs.writeFileSync(path.join(dir, '.gitattributes'), 'docs/ideas.md merge=ledger\n')
  // The declared path has to be TRACKED, not merely declared. This gate walks
  // `git ls-files` and asks git for each file's attributes, so a
  // .gitattributes line naming a file the fixture never committed yields `0
  // declarations over 0 drivers` at exit 0 -- a green the case would have read
  // as the clone being registered.
  fs.writeFileSync(path.join(dir, 'docs/ideas.md'),
    '# Ledger\n\n### 2026-11-09 - An entry\n- Status: proposed\n')
  fs.writeFileSync(path.join(dir, 'tools/ledger/drivers.json'), JSON.stringify({
    drivers: {
      ledger: {
        installer: 'tools/registers/install-drivers.sh',
        config_key: 'merge.ledger.driver',
        command: 'tools/ledger/union-merge.mjs',
        merges: 'docs/ideas.md',
      },
    },
    builtin_allowed: ['text', 'binary'],
    refused: { union: 'it loses records' },
  }, null, 2))
  git('add', '-A')
  git('commit', '-qm', 'fixture')

  const committed = gate(ROOT, 'tools/ledger/check-attributes.mjs', ['--repo', dir])
  assert.equal(committed.code, 0,
    `the fixture's committed state must be clean before the clone case means `
    + `anything. got ${committed.code}: ${committed.stderr}`)

  const got = gate(ROOT, 'tools/ledger/check-attributes.mjs', ['--repo', dir, '--clone'])
  assert.equal(got.code, 2,
    `an unregistered driver is a clone-locus finding at exit 2, not a refusal. `
    + `got ${got.code}. stderr: ${got.stderr}`)
  assert.match(got.stderr, /this clone has no merge\.ledger\.driver/)
})
