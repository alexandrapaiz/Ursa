// node --test tools/gates/empty-premise.test.mjs
//
// Three halves, and the third is the one this file exists for.
//
// The grading is NOT re-tested here: `grade()` is imported from
// premise-differential.mjs and its own suite asserts it. What is new in this
// tool is the PREMISE FLOOR and the arm construction, so that is what this
// suite drives.
//
// The floor is a control on the experiment rather than on any candidate, and a
// control nothing asserts is prose with a function name on it. Alexandria's
// engineer seat's floor caught its own author because the quantity it read was
// LEGAL at the wrong value -- a length over a two-tuple returned 2, and 2 is a
// legal entry count. A byte count is legal at every value including zero, which
// is why the floor's own reading is taken from two surfaces and a disagreement
// is reported rather than resolved.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, rmSync, writeFileSync, chmodSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import {
  floorFindings,
  loadPremiseSet,
  measureEmpty,
  readPremise,
  verdictEmpty,
} from './empty-premise.mjs'

const sandbox = () => mkdtempSync(join(tmpdir(), 'empty-premise-test-'))

test('the shipped premise set parses and every entry carries a path and a reason', () => {
  const doc = loadPremiseSet()
  assert.ok(doc.premise.length >= 1)
  for (const e of doc.premise) {
    assert.ok(e.path, 'an entry with no path empties nothing')
    assert.ok(e.why && e.why.length > 20, `${e.path} carries no reason a reader could check`)
    assert.equal(e.empty, 'truncate')
  }
  // The approximate part is declared, not implied. A reader who takes the
  // floor for the ceiling has been misled by a green.
  assert.ok(doc.not_swept.length >= 1)
})

test('a premise set that declares nothing is a ground failure, not an empty sweep', () => {
  const dir = sandbox()
  try {
    const p = join(dir, 'empty.json')
    writeFileSync(p, JSON.stringify({ premise: [] }))
    assert.throws(() => loadPremiseSet(p), /no files/)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test('a premise file that was ALREADY empty fails the floor', () => {
  // The defect the floor exists for. Truncating a zero-byte file removes
  // nothing, every candidate then grades UNMOVED, and the sweep reports a
  // clean tree over an experiment that never happened.
  const f = floorFindings([{ path: 'docs/ideas.md', worktreeBytes: 0, headBytes: 0 }])
  assert.deepEqual(f.map((x) => x.code), ['PREMISE_ALREADY_EMPTY'])
})

test('a premise file ABSENT from the tree fails the floor under its own code', () => {
  // Not a silent skip: an absent file means this row measured the ABSENT
  // premise, which is the other tool's axis, and reporting it under this
  // one's name is the mislabelling this family of gates exists to catch.
  const f = floorFindings([{ path: 'docs/gone.md', worktreeBytes: null, headBytes: null }])
  assert.deepEqual(f.map((x) => x.code), ['PREMISE_ABSENT_NOT_EMPTY'])
})

test('two surfaces disagreeing about the premise size is reported, not resolved', () => {
  const f = floorFindings([{ path: 'docs/ideas.md', worktreeBytes: 10, headBytes: 4000 }])
  assert.deepEqual(f.map((x) => x.code), ['PREMISE_SIZE_DISAGREEMENT'])
  assert.match(f[0].why, /10 bytes and git cat-file -s HEAD says 4000/)
})

test('a premise non-empty and agreeing on both surfaces passes the floor', () => {
  assert.deepEqual(floorFindings([{ path: 'docs/ideas.md', worktreeBytes: 4000, headBytes: 4000 }]), [])
})

test('a floor failure outranks "nothing was graded", and both outrank clean', () => {
  const floor = [{ code: 'PREMISE_ALREADY_EMPTY', path: 'docs/ideas.md', why: 'x' }]
  assert.equal(verdictEmpty([], { entries: [] }, floor).exitCode, 1)
  assert.equal(verdictEmpty([], { entries: [] }, []).exitCode, 3)
  assert.equal(
    verdictEmpty([{ path: 'a', cls: 'GROUND_CODED' }], { entries: [] }, []).exitCode,
    0,
  )
})

test('nothing graded is exit 3, and the graded count is reported either way', () => {
  // HQ's exo-centralizer, 2026-11-09, on its own gate: zero disagreements
  // among zero comparisons is not agreement, and a number that appears only
  // when it is non-zero teaches a reader that its absence means nothing
  // happened.
  const v = verdictEmpty([{ path: 'a', cls: 'UNMOVED' }], { entries: [] }, [])
  assert.equal(v.exitCode, 3)
  assert.equal(v.graded, 0)
})

test('exit 0 over an emptied premise is CLEAN_OVER_EMPTY_PREMISE', () => {
  const v = verdictEmpty(
    [{ path: 'tools/ledger/check.mjs', cls: 'GREEN_ON_NOTHING', firstLine: '0 blocks, clean.' }],
    { entries: [] }, [],
  )
  assert.deepEqual(v.findings.map((f) => f.code), ['CLEAN_OVER_EMPTY_PREMISE'])
  assert.equal(v.exitCode, 1)
})

test('a baseline entry that has outlived its finding is itself a finding', () => {
  const v = verdictEmpty(
    [{ path: 'tools/x.mjs', cls: 'GROUND_CODED', firstLine: 'LEDGER_EMPTY: nothing to check' }],
    { entries: [{ path: 'tools/x.mjs', why: 'it was green over an empty ledger' }] }, [],
  )
  assert.deepEqual(v.findings.map((f) => f.code), ['BASELINE_ENTRY_STALE'])
})

test('a baseline entry naming no candidate at all is a finding', () => {
  const v = verdictEmpty(
    [{ path: 'tools/x.mjs', cls: 'GROUND_CODED' }],
    { entries: [{ path: 'tools/gone.mjs', why: 'deleted months ago' }] }, [],
  )
  assert.deepEqual(v.findings.map((f) => f.code), ['BASELINE_NAMES_NO_CANDIDATE'])
})

// The end-to-end half. Fixture tools on disk, driven through the real arm
// collection, because a suite that only feeds the classifier hand-made
// readings proves the classifier and says nothing about whether the arms were
// collected correctly -- which is this file's own subject matter.
test('the arms run each worktree\'s OWN copy of the candidate, over fixture tools', () => {
  const pristine = sandbox()
  const emptied = sandbox()
  try {
    for (const root of [pristine, emptied]) {
      mkdirSync(join(root, 'docs'), { recursive: true })
      mkdirSync(join(root, 'tools'), { recursive: true })
      // Resolves its input against the SCRIPT's own directory, which is the
      // shape 40 of 61 of this repository's tools have. This is the row a
      // cwd-only differential cannot move, and the row two worktrees can.
      writeFileSync(join(root, 'tools', 'green.mjs'),
        'import {readFileSync} from "node:fs";'
        + 'import {dirname,join} from "node:path";'
        + 'import {fileURLToPath} from "node:url";'
        + 'const r=join(dirname(fileURLToPath(import.meta.url)),"..","docs","ideas.md");'
        + 'const n=readFileSync(r,"utf8").split("\\n").filter(l=>l.startsWith("### ")).length;'
        + 'console.log(`${n} entries, all resolved and all closed.`);process.exit(0)')
      writeFileSync(join(root, 'tools', 'coded.mjs'),
        'import {readFileSync} from "node:fs";'
        + 'import {dirname,join} from "node:path";'
        + 'import {fileURLToPath} from "node:url";'
        + 'const r=join(dirname(fileURLToPath(import.meta.url)),"..","docs","ideas.md");'
        + 'const n=readFileSync(r,"utf8").split("\\n").filter(l=>l.startsWith("### ")).length;'
        + 'if(!n){console.error("LEDGER_EMPTY: the register holds no entries, so this run is '
        + 'not a verdict about it");process.exit(2)}'
        + 'console.log(`${n} entries.`);process.exit(0)')
    }
    writeFileSync(join(pristine, 'docs', 'ideas.md'), '### one\n### two\n')
    writeFileSync(join(emptied, 'docs', 'ideas.md'), '')

    const rows = [{ path: 'tools/green.mjs' }, { path: 'tools/coded.mjs' }]
    const byPath = new Map(measureEmpty(rows, pristine, emptied).map((r) => [r.path, r]))

    // The whole point of the axis: this row is invisible to a cwd-only
    // differential and is caught here.
    assert.equal(byPath.get('tools/green.mjs').cls, 'GREEN_ON_NOTHING')
    assert.match(byPath.get('tools/green.mjs').firstLine, /0 entries, all resolved/)
    assert.equal(byPath.get('tools/coded.mjs').cls, 'GROUND_CODED')
  } finally {
    rmSync(pristine, { recursive: true, force: true })
    rmSync(emptied, { recursive: true, force: true })
  }
})

test('readPremise reports a missing file as null rather than throwing', () => {
  const dir = sandbox()
  try {
    const rows = readPremise({ premise: [{ path: 'docs/nope.md', empty: 'truncate', why: 'x' }] }, dir)
    assert.equal(rows[0].worktreeBytes, null)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})
