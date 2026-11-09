// node --test tools/gates/hit-attribution.test.mjs
//
// Two halves, deliberately. The partition and the lines are tested through a
// fake `git` seam, because the interesting inputs are the degenerate ones and
// building a real repository for each is slower than it is informative. The
// `changedPaths` contract itself is then tested against REAL git in a real
// throwaway repository, because the one thing a fake cannot check is the claim
// this module's correctness actually rests on: that `base...HEAD` lists the
// paths the branch touched and not the paths the base touched underneath it.
// A mock would have agreed with two dots just as happily as with three.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { attribute, attributionLines, changedPaths } from './hit-attribution.mjs'

/** A `git` seam that resolves the base and reports a fixed changed set. */
const fakeGit = (changed, dirty = []) => (_cmd, args) => {
  if (args[0] === 'rev-parse') return ''
  if (args[0] === 'diff') return changed.join('\n')
  if (args[0] === 'status') return dirty.map((p) => ` M ${p}`).join('\n')
  throw new Error(`unexpected git ${args.join(' ')}`)
}

/** A `git` seam whose base does not resolve, which is the shallow clone. */
const noBase = (_cmd, args) => {
  if (args[0] === 'rev-parse') throw new Error('fatal: needed a single revision')
  throw new Error('should not have got as far as diff')
}

test('hits in paths the branch changed are attributed to the branch', () => {
  const a = attribute(['docs/a.md', 'docs/b.md'], { git: fakeGit(['docs/a.md', 'docs/b.md']) })
  assert.equal(a.scope, 'introduced')
  assert.deepEqual(a.inherited, [])
  assert.match(attributionLines(a).join('\n'), /changed by this branch against origin\/main/)
})

test('hits in paths the branch never touched are attributed to the base, with the repair located there', () => {
  const a = attribute(['docs/leak.md'], { git: fakeGit(['docs/mine.md']) })
  assert.equal(a.scope, 'inherited')
  assert.deepEqual(a.inherited, ['docs/leak.md'])
  const line = attributionLines(a).join('\n')
  // The two claims F133 cost two seats a pass for want of: the branch did not
  // do it, and the branch cannot undo it.
  assert.match(line, /did not\n?\s*introduce them and cannot clear them/)
  assert.match(line, /The repair is on origin\/main/)
})

test('a mixed hit set names both sides and does not round to either', () => {
  const a = attribute(['docs/leak.md', 'docs/mine.md'], { git: fakeGit(['docs/mine.md']) })
  assert.equal(a.scope, 'mixed')
  const line = attributionLines(a).join('\n')
  assert.match(line, /docs\/mine\.md/)
  assert.match(line, /docs\/leak\.md/)
  assert.match(line, /inherited from origin\/main and not repairable here/)
})

test('an unresolvable base refuses in words and names the repair, rather than throwing', () => {
  const a = attribute(['docs/leak.md'], { git: noBase })
  assert.equal(a.scope, 'unknown')
  assert.equal(a.base, null)
  const line = attributionLines(a).join('\n')
  assert.match(line, /was not established/)
  assert.match(line, /ensure-full-clone\.sh/)
  // The point of the refusal path. F132 was four gates publishing an
  // unreachable dependency as a certain finding; this one says it is unsure.
  assert.doesNotMatch(line, /did not introduce/)
})

test('no hits yields no lines at all, so a clean run is byte-identical', () => {
  const a = attribute([], { git: fakeGit(['docs/mine.md']) })
  assert.equal(a.scope, 'unknown')
  assert.deepEqual(attributionLines(a), [])
})

test('duplicate hit paths are counted once', () => {
  const a = attribute(['docs/a.md', 'docs/a.md', 'docs/a.md'], { git: fakeGit(['docs/a.md']) })
  assert.deepEqual(a.introduced, ['docs/a.md'])
})

test('base...HEAD lists what the branch changed and not what the base changed under it', () => {
  // The claim three dots is chosen for. Built against real git because this is
  // the assertion a seam cannot make on its own behalf.
  const dir = mkdtempSync(join(tmpdir(), 'hit-attribution-'))
  const git = (...args) => execFileSync('git', ['-C', dir, ...args], { encoding: 'utf8' })
  try {
    git('init', '-q', '-b', 'main')
    git('config', 'user.email', 'test@example.invalid')
    git('config', 'user.name', 'test')
    writeFileSync(join(dir, 'shared.md'), 'start\n')
    git('add', '-A')
    git('commit', '-q', '-m', 'base')

    git('checkout', '-q', '-b', 'topic')
    writeFileSync(join(dir, 'mine.md'), 'branch work\n')
    git('add', '-A')
    git('commit', '-q', '-m', 'branch adds its own file')

    // main moves on underneath the branch, which is the whole scenario.
    git('checkout', '-q', 'main')
    writeFileSync(join(dir, 'shared.md'), 'start\nsomebody else edited this\n')
    git('add', '-A')
    git('commit', '-q', '-m', 'base moves on')
    git('checkout', '-q', 'topic')

    const inDir = (_cmd, args) => execFileSync('git', ['-C', dir, ...args], { encoding: 'utf8' })
    const res = changedPaths('main', inDir)
    assert.ok('paths' in res, res.why)
    assert.deepEqual([...res.paths].sort(), ['mine.md'])

    // And the end-to-end consequence: a hit in the file the base moved is the
    // base's, even though that file is present and modified in the checkout.
    const a = attribute(['shared.md'], { base: 'main', git: inDir })
    assert.equal(a.scope, 'inherited')
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test('a base that does not exist is a refusal and not an empty changed set', () => {
  const dir = mkdtempSync(join(tmpdir(), 'hit-attribution-'))
  const git = (...args) => execFileSync('git', ['-C', dir, ...args], { encoding: 'utf8' })
  try {
    git('init', '-q', '-b', 'main')
    git('config', 'user.email', 'test@example.invalid')
    git('config', 'user.name', 'test')
    writeFileSync(join(dir, 'a.md'), 'x\n')
    git('add', '-A')
    git('commit', '-q', '-m', 'only commit')
    const inDir = (_cmd, args) => execFileSync('git', ['-C', dir, ...args], { encoding: 'utf8' })
    const res = changedPaths('origin/main', inDir)
    // An empty changed set would make every hit "inherited", which is the
    // wrong answer confidently given. It has to be a refusal.
    assert.ok('why' in res)
    assert.match(res.why, /does not resolve/)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test('an uncommitted edit counts as this checkout touching the file', () => {
  // The mode a seat actually runs the tree gates in: the leak is in the
  // working tree and not in a commit. Against the committed diff alone this
  // would read `inherited` and send the seat that caused it elsewhere.
  const a = attribute(['docs/leak.md'], { git: fakeGit([], ['docs/leak.md']) })
  assert.equal(a.scope, 'introduced')
})

test('a rename is attributed by its new path, which is where a hit now lives', () => {
  const git = (_cmd, args) => {
    if (args[0] === 'rev-parse') return ''
    if (args[0] === 'diff') return ''
    if (args[0] === 'status') return 'R  docs/old.md -> docs/new.md'
    throw new Error('unexpected')
  }
  const a = attribute(['docs/new.md'], { git })
  assert.equal(a.scope, 'introduced')
  assert.deepEqual(a.introduced, ['docs/new.md'])
})

test('a status that fails leaves the committed diff as the answer rather than erasing it', () => {
  const git = (_cmd, args) => {
    if (args[0] === 'rev-parse') return ''
    if (args[0] === 'diff') return 'docs/mine.md'
    if (args[0] === 'status') throw new Error('fatal: not a git repository')
    throw new Error('unexpected')
  }
  const a = attribute(['docs/mine.md'], { git })
  assert.equal(a.scope, 'introduced')
})

test('untracked files in the real tree are this checkout\'s, not the base\'s', () => {
  const dir = mkdtempSync(join(tmpdir(), 'hit-attribution-'))
  const git = (...args) => execFileSync('git', ['-C', dir, ...args], { encoding: 'utf8' })
  try {
    git('init', '-q', '-b', 'main')
    git('config', 'user.email', 'test@example.invalid')
    git('config', 'user.name', 'test')
    writeFileSync(join(dir, 'a.md'), 'x\n')
    git('add', '-A')
    git('commit', '-q', '-m', 'base')
    git('checkout', '-q', '-b', 'topic')
    writeFileSync(join(dir, 'brand-new.md'), 'never committed\n')
    const inDir = (_cmd, args) => execFileSync('git', ['-C', dir, ...args], { encoding: 'utf8' })
    const a = attribute(['brand-new.md'], { base: 'main', git: inDir })
    assert.equal(a.scope, 'introduced')
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test('a dot-rooted hit path matches the same file as git spells it', () => {
  // The bug this module shipped with for one measurement and no commits:
  // `grep -rn .` emits `./docs/vision.md`, git emits `docs/vision.md`, and the
  // raw comparison made every hit from a dot-rooted scan the base's problem.
  const a = attribute(['./docs/vision.md'], { git: fakeGit([], ['docs/vision.md']) })
  assert.equal(a.scope, 'introduced')
  assert.deepEqual(a.introduced, ['docs/vision.md'])
})

test('normalisation is a key normaliser and does not reach outside the repository', () => {
  // `../` is left alone on purpose: a hit above the repository root is a
  // different finding, and folding it into a path inside would hide it.
  const a = attribute(['../elsewhere/x.md'], { git: fakeGit(['elsewhere/x.md']) })
  assert.equal(a.scope, 'inherited')
})

test('the introduced line agrees with itself in number', () => {
  const one = attributionLines(attribute(['a.md'], { git: fakeGit(['a.md']) })).join('\n')
  assert.match(one, /the 1 hit path was changed/)
  const two = attributionLines(attribute(['a.md', 'b.md'], { git: fakeGit(['a.md', 'b.md']) })).join('\n')
  assert.match(two, /all 2 hit paths were changed/)
})
