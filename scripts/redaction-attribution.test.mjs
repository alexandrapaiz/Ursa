// node --test scripts/redaction-attribution.test.mjs
//
// F133, reproduced end to end against the real gate rather than argued about.
//
// The finding: `.github/workflows/redaction-gate.yml` triggers on
// `pull_request`, and for that event GitHub checks out a MERGE of the head with
// the base, so the gate's subject is `head + main` while every reader of the
// result treats a red as a fact about the head. On 2026-11-09 a leak that
// reached `main` at 10:21:14Z failed this seat's `#859` twice, at 10:32:36Z and
// 10:37:40Z, on a file absent from every commit of that branch. The branch
// could neither cause the red nor clear it, and the gate's output said nothing
// about which side the hit came from.
//
// WHAT THIS FILE PINS, AND WHAT IT DOES NOT. It builds a throwaway repository
// shaped exactly like that case -- a leak committed on `main`, a topic branch
// that never touches the file, and a checkout of the merge -- and asserts that
// the gate's output now locates the repair on the base. It does NOT assert any
// exit code change, because there is none and there should not be: whether an
// inherited leak ought to fail the branch is the workflow owner's policy call
// under docs/standards/pm.md §15, and this seat does not hold that file. See
// the header of tools/gates/hit-attribution.mjs.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { cpSync, mkdtempSync, mkdirSync, rmSync, writeFileSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const REPO = dirname(HERE)

// A well-formed instance of the gate's third pattern, invented here rather
// than copied from anywhere, so nothing private is reproduced in order to test
// the thing that finds private values.
//
// IT IS ASSEMBLED AND NOT WRITTEN, and that is not fastidiousness. The gate
// matches on shape alone and scans the whole working tree including this file,
// so a literal here reds `redaction-tree` on whatever branch carries it. This
// run wrote the literal first and watched the gate fail on it, which is the
// cheapest possible demonstration that the gate works and that a fixture for
// a scanner has to stay out of the scanner's own corpus. The gate's own
// instruction for a real one is to truncate to 8 characters; for a fixture,
// the equivalent is to not have 36 contiguous characters on any line.
const SHAPED = ['0f9c1a2b', '3d4e', '5f60', '8192', 'a3b4c5d6e7f8'].join('-')

/**
 * A repository with the merge shape of a `pull_request` checkout: `main`
 * carries the leak, the topic branch carries unrelated work, and the working
 * tree is the merge of the two.
 */
function mergeShapedRepo() {
  const dir = mkdtempSync(join(tmpdir(), 'redaction-attribution-'))
  const git = (...args) =>
    execFileSync('git', ['-C', dir, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] })

  git('init', '-q', '-b', 'main')
  git('config', 'user.email', 'test@example.invalid')
  git('config', 'user.name', 'test')

  // The gate reads its own patterns out of the workflow file, so the fixture
  // repository needs the real one. Copying it is also what keeps this test
  // honest if the patterns ever change: it tests today's gate, not a snapshot.
  mkdirSync(join(dir, '.github/workflows'), { recursive: true })
  cpSync(join(REPO, '.github/workflows/redaction-gate.yml'), join(dir, '.github/workflows/redaction-gate.yml'))
  mkdirSync(join(dir, 'scripts'), { recursive: true })
  mkdirSync(join(dir, 'tools/gates'), { recursive: true })
  for (const f of ['scripts/redaction-check.mjs', 'scripts/redaction-args.mjs', 'tools/gates/hit-attribution.mjs']) {
    cpSync(join(REPO, f), join(dir, f))
  }
  writeFileSync(join(dir, 'docs-somebody-elses.md'), 'the base owns this file\n')
  mkdirSync(join(dir, 'docs'), { recursive: true })
  writeFileSync(join(dir, 'docs/mine.md'), 'the branch owns this one\n')
  git('add', '-A')
  git('commit', '-q', '-m', 'common ancestor')

  git('checkout', '-q', '-b', 'topic')
  writeFileSync(join(dir, 'docs/mine.md'), 'the branch owns this one, and edited it\n')
  git('add', '-A')
  git('commit', '-q', '-m', 'the branch does its own unrelated work')

  // The leak lands on the base, after the branch started, in a file the branch
  // has never had in a diff.
  git('checkout', '-q', 'main')
  writeFileSync(join(dir, 'docs-somebody-elses.md'), `the base owns this file\nsession ${SHAPED}\n`)
  git('add', '-A')
  git('commit', '-q', '-m', 'the base leaks')

  // `origin/main` is what the helper compares against, so point it at the
  // local `main` the way a real checkout's remote-tracking ref would be.
  git('update-ref', 'refs/remotes/origin/main', 'main')

  // And the checkout GitHub actually hands the job: the merge.
  git('checkout', '-q', 'topic')
  git('merge', '-q', '--no-edit', 'main')

  return { dir, git }
}

function runGate(dir, args = []) {
  try {
    const out = execFileSync('node', [join(dir, 'scripts/redaction-check.mjs'), ...args], {
      cwd: dir,
      encoding: 'utf8',
    })
    return { code: 0, out }
  } catch (err) {
    return { code: err.status, out: `${err.stdout ?? ''}${err.stderr ?? ''}` }
  }
}

test('a leak the base introduced is reported as the base\'s, with the repair located there', () => {
  const { dir } = mergeShapedRepo()
  try {
    const res = runGate(dir)
    // The gate still fails. Nothing about the verdict moved.
    assert.equal(res.code, 1)
    assert.match(res.out, /docs-somebody-elses\.md/)
    // What moved: the output now answers the question two seats spent a pass
    // on, which is whether this branch can do anything about it.
    assert.match(res.out, /none of these paths were changed by this branch/)
    assert.match(res.out, /cannot clear them/)
    assert.match(res.out, /The repair is on origin\/main/)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test('a leak the branch introduced is still the branch\'s, and says so', () => {
  const { dir, git } = mergeShapedRepo()
  try {
    // Same repository, leak moved to the file the branch owns and edited.
    writeFileSync(join(dir, 'docs-somebody-elses.md'), 'the base owns this file\n')
    writeFileSync(join(dir, 'docs/mine.md'), `the branch owns this one\nsession ${SHAPED}\n`)
    git('add', '-A')
    git('commit', '-q', '-m', 'the branch leaks')

    const res = runGate(dir)
    assert.equal(res.code, 1)
    assert.match(res.out, /docs\/mine\.md/)
    assert.match(res.out, /was changed by this branch against origin\/main/)
    // The one sentence that must never appear on this arm, because it would
    // tell the seat that caused the leak to go and wait for somebody else.
    assert.doesNotMatch(res.out, /cannot clear them/)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test('both sides leaking names both and rounds to neither', () => {
  const { dir, git } = mergeShapedRepo()
  try {
    writeFileSync(join(dir, 'docs/mine.md'), `the branch owns this one\nsession ${SHAPED}\n`)
    git('add', '-A')
    git('commit', '-q', '-m', 'the branch leaks too')

    const res = runGate(dir)
    assert.equal(res.code, 1)
    assert.match(res.out, /note: mixed/)
    assert.match(res.out, /docs\/mine\.md/)
    assert.match(res.out, /inherited from origin\/main and not repairable here/)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test('a clean merge-shaped tree prints exactly what it printed before, with no note', () => {
  const { dir } = mergeShapedRepo()
  try {
    writeFileSync(join(dir, 'docs-somebody-elses.md'), 'the base owns this file\n')
    const res = runGate(dir)
    assert.equal(res.code, 0)
    assert.match(res.out, /^Redaction gate clean \(3 patterns, read from the workflow\)\.\n?$/)
    assert.doesNotMatch(res.out, /note:/)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test('with no origin/main the gate reports the same hits and declines to attribute them', () => {
  // The clone this host hands a seat is single-branch, so this is not an edge
  // case, it is the default checkout. A gate that died here would be a worse
  // defect than the one being fixed: F132, four hours earlier in the same
  // window, was four gates publishing an unreachable dependency as certainty.
  const { dir, git } = mergeShapedRepo()
  try {
    git('update-ref', '-d', 'refs/remotes/origin/main')
    const res = runGate(dir)
    assert.equal(res.code, 1)
    assert.match(res.out, /docs-somebody-elses\.md/)
    assert.match(res.out, /was not established/)
    assert.match(res.out, /ensure-full-clone\.sh/)
    assert.doesNotMatch(res.out, /cannot clear them/)
    assert.doesNotMatch(res.out, /was changed by this branch/)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test('--json carries the same attribution as the note line, for a programmatic reader', () => {
  const { dir } = mergeShapedRepo()
  try {
    const res = runGate(dir, ['--json'])
    const parsed = JSON.parse(res.out)
    assert.equal(parsed.clean, false)
    assert.equal(parsed.attribution.scope, 'inherited')
    assert.deepEqual(parsed.attribution.inherited, ['docs-somebody-elses.md'])
    assert.deepEqual(parsed.attribution.introduced, [])
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test('the fixture reproduces the finding, so the pre-fix gate is silent on the same tree', () => {
  // Guards against the test passing for the wrong reason. The same repository,
  // with the attribution lines removed from the gate, still fails and still
  // names the path, and says nothing at all about whose it is. If this ever
  // stops holding, the fixture has stopped reproducing F133.
  const { dir } = mergeShapedRepo()
  try {
    const gate = join(dir, 'scripts/redaction-check.mjs')
    const src = readFileSync(gate, 'utf8')
    const stripped = src.replace(/\n\s*for \(const line of attributionLines\(whose\)\) console\.error\(line\);/, '')
    assert.notEqual(stripped, src, 'the call this test is about was not found in the gate')
    writeFileSync(gate, stripped)

    const res = runGate(dir)
    assert.equal(res.code, 1)
    assert.match(res.out, /docs-somebody-elses\.md/)
    assert.doesNotMatch(res.out, /note: none of these paths/)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})
