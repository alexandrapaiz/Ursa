#!/usr/bin/env node
// node --test tools/ledger/containment.test.mjs
//
// THE TEST THAT MATTERS IS `the fail-open hazard`. Every other case here
// proves the verdict is right when the clone is well-formed, and a
// well-formed clone is not the input this guard exists for: the clone every
// seat is handed is shallow and single-branch, and in it
// `git merge-base --is-ancestor` reports NOT CONTAINED, at exit 1, for a pair
// whose containment is a fact. A suite that only drove complete clones would
// pass against a guard that fails open on every real invocation.
//
// So the suite builds a real shallow clone of a real repository, with a real
// chain of commits in it, and asserts that the program REFUSES rather than
// reporting the chain as unconnected. If that case ever goes green with a
// verdict in it, this guard has become decoration.
//
// HERMETIC. A local bare origin, cloned twice: once complete and once at
// `--depth 1`. No network, no `gh`, no GitHub account. The open-row list that
// `gh` would supply is supplied by `--rows` instead, which is why that flag
// exists.
//
// THE SHALLOW CLONE IS MADE OVER `file://` ON PURPOSE. `git clone --depth 1
// /path/to/repo` prints `warning: --depth is ignored in local clones; use
// file:// instead` and produces a COMPLETE clone. A suite that built its
// shallow fixture the obvious way would therefore assert a refusal against a
// healthy clone, pass for the wrong reason, and prove nothing about the
// hazard. Measured here, not cited: the first version of this file did exactly
// that.

import { strict as assert } from 'node:assert'
import { spawnSync } from 'node:child_process'
import { describe, it, before, after } from 'node:test'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import {
  CONTAINED,
  IDENTICAL,
  MERGE,
  UNRESOLVED,
  classify,
  hasCommit,
  isSkip,
  makeAncestryProbe,
  probeSelfTest,
  resolveTips,
  sentence,
} from './containment.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))
const GATE = resolve(HERE, 'containment.mjs')

const run = (cwd, cmd, args) => spawnSync(cmd, args, { cwd, encoding: 'utf8' })
const git = (cwd, ...args) => {
  const r = run(cwd, 'git', args)
  if (r.status !== 0) throw new Error(`git ${args.join(' ')} failed in ${cwd}: ${r.stderr}`)
  return r.stdout.trim()
}

let ROOT, ORIGIN, FULL, SHALLOW, WIDENED
/** branch name -> tip sha, in the complete clone */
const tip = {}

before(() => {
  ROOT = mkdtempSync(join(tmpdir(), 'containment-'))
  ORIGIN = join(ROOT, 'origin.git')
  const seed = join(ROOT, 'seed')

  git(ROOT, 'init', '--quiet', '--bare', '--initial-branch=main', ORIGIN)
  git(ROOT, 'clone', '--quiet', ORIGIN, seed)
  git(seed, 'config', 'user.email', 'seat@example.invalid')
  git(seed, 'config', 'user.name', 'seat')

  const commit = (msg, file, body) => {
    writeFileSync(join(seed, file), body)
    git(seed, 'add', '-A')
    git(seed, 'commit', '--quiet', '-m', msg)
    return git(seed, 'rev-parse', 'HEAD')
  }

  // main: two commits, so a complete clone has history and `--depth 1` does not.
  commit('trunk one', 'README.md', 'one\n')
  commit('trunk two', 'README.md', 'two\n')
  git(seed, 'push', '--quiet', 'origin', 'main')

  // A chain: tail is a strict ancestor of mid, mid of head. This is the
  // five-row shape the skill seat measured, at length three.
  git(seed, 'checkout', '--quiet', '-b', 'chain-tail')
  commit('chain one', 'a.md', 'a1\n')
  git(seed, 'push', '--quiet', 'origin', 'chain-tail')
  git(seed, 'checkout', '--quiet', '-b', 'chain-mid')
  commit('chain two', 'a.md', 'a2\n')
  git(seed, 'push', '--quiet', 'origin', 'chain-mid')
  git(seed, 'checkout', '--quiet', '-b', 'chain-head')
  commit('chain three', 'a.md', 'a3\n')
  git(seed, 'push', '--quiet', 'origin', 'chain-head')

  // A sibling that shares no work with the chain beyond the trunk.
  git(seed, 'checkout', '--quiet', '-b', 'solo', 'main')
  commit('solo one', 'b.md', 'b1\n')
  git(seed, 'push', '--quiet', 'origin', 'solo')

  // Two branch names at one revision: the same work under two numbers.
  git(seed, 'push', '--quiet', 'origin', 'solo:twin')

  FULL = join(ROOT, 'full')
  git(ROOT, 'clone', '--quiet', ORIGIN, FULL)
  git(FULL, 'fetch', '--quiet', 'origin')
  for (const b of ['main', 'chain-tail', 'chain-mid', 'chain-head', 'solo', 'twin']) {
    tip[b] = git(FULL, 'rev-parse', `origin/${b}`)
  }

  // `file://` so `--depth` is honoured, then the shape a seat is handed:
  // one branch, one commit.
  SHALLOW = join(ROOT, 'shallow')
  git(ROOT, 'clone', '--quiet', '--depth', '1', '--single-branch', '--branch', 'main', `file://${ORIGIN}`, SHALLOW)
  assert.equal(git(SHALLOW, 'rev-parse', '--is-shallow-repository'), 'true', 'the shallow fixture is not shallow')

  // The shape that defeats a self-test built only on the HEAD pair: a clone
  // that HAS `main`'s history and then shallow-fetches the other branches, so
  // `HEAD~1` resolves and answers correctly while every other branch arrives
  // with its parent link cut. A seat reaches this shape without asking for it,
  // because `--depth` is silently ignored on a local clone and a later
  // `git fetch --depth 1` is what writes `.git/shallow`.
  WIDENED = join(ROOT, 'widened')
  git(ROOT, 'clone', '--quiet', '--single-branch', '--branch', 'main', `file://${ORIGIN}`, WIDENED)
  git(WIDENED, 'config', 'remote.origin.fetch', '+refs/heads/*:refs/remotes/origin/*')
  git(WIDENED, 'fetch', '--quiet', '--depth', '1', 'origin')
})

after(() => rmSync(ROOT, { recursive: true, force: true }))

/** The row list `gh pr list` would produce for the fixture. */
const rows = () => [
  { number: 1, branch: 'chain-head', mergeable: 'CONFLICTING' },
  { number: 2, branch: 'chain-mid', mergeable: 'CONFLICTING' },
  { number: 3, branch: 'chain-tail', mergeable: 'CONFLICTING' },
  { number: 4, branch: 'solo', mergeable: 'CONFLICTING' },
  { number: 5, branch: 'twin', mergeable: 'MERGEABLE' },
]

describe('the decision, with no git in it', () => {
  // `null` is the answer a probe gives when it cannot answer at all.
  const chain = [
    { number: 1, branch: 'head', tip: 'c3' },
    { number: 2, branch: 'mid', tip: 'c2' },
    { number: 3, branch: 'tail', tip: 'c1' },
  ]
  const order = { c1: 1, c2: 2, c3: 3 }
  const linear = (child, parent) => order[child] <= order[parent]

  it('skips a row the tip already contains and names the container', () => {
    const [head, mid, tail] = classify(chain, chain, linear)
    assert.equal(head.action, MERGE)
    assert.equal(mid.action, CONTAINED)
    assert.deepEqual(
      mid.others.map((o) => o.number),
      [1],
    )
    assert.equal(tail.action, CONTAINED)
    assert.deepEqual(
      tail.others.map((o) => o.number),
      [1, 2],
    )
  })

  it('merges exactly one row of a chain, which is the tip', () => {
    const merging = classify(chain, chain, linear).filter((v) => !isSkip(v.action))
    assert.deepEqual(
      merging.map((v) => v.number),
      [1],
    )
  })

  it('calls two rows at one revision IDENTICAL rather than containing each other', () => {
    const pair = [
      { number: 7, branch: 'a', tip: 'same' },
      { number: 8, branch: 'b', tip: 'same' },
    ]
    const verdicts = classify(pair, pair, () => {
      throw new Error('equal tips must not be asked an ancestry question')
    })
    assert.deepEqual(verdicts.map((v) => v.action), [IDENTICAL, IDENTICAL])
    assert.deepEqual(verdicts[0].others.map((o) => o.number), [8])
  })

  it('never merges a row whose ancestry could not be determined', () => {
    const verdicts = classify(chain, chain, () => null)
    assert.deepEqual(verdicts.map((v) => v.action), [UNRESOLVED, UNRESOLVED, UNRESOLVED])
    assert.equal(verdicts.every((v) => isSkip(v.action)), true)
  })

  it('does not treat a row as contained in itself', () => {
    const one = [{ number: 9, branch: 'only', tip: 'x' }]
    assert.equal(classify(one, one, () => true)[0].action, MERGE)
  })

  it('reports a row with no tip as UNRESOLVED and says so in one sentence', () => {
    const v = classify([{ number: 11, branch: null, tip: null }], rows(), () => true)[0]
    assert.equal(v.action, UNRESOLVED)
    assert.match(sentence(v), /not classified/)
    assert.match(sentence(v), /not a negative answer/)
  })

  it('prefers the known container over an unanswerable pair', () => {
    const pool = [
      { number: 1, branch: 'head', tip: 'c3' },
      { number: 2, branch: 'mid', tip: 'c2' },
      { number: 3, branch: 'elsewhere', tip: 'unknown' },
    ]
    const probe = (child, parent) => (parent === 'unknown' ? null : linear(child, parent))
    const mid = classify([pool[1]], pool, probe)[0]
    assert.equal(mid.action, CONTAINED)
    assert.deepEqual(mid.others.map((o) => o.number), [1])
  })
})

describe('the probe over a real clone', () => {
  it('answers true, false and null, and null is not false', () => {
    const probe = makeAncestryProbe(FULL)
    assert.equal(probe(tip['chain-tail'], tip['chain-head']), true)
    assert.equal(probe(tip['chain-head'], tip['chain-tail']), false)
    assert.equal(probe('0'.repeat(40), tip['chain-head']), null)
  })

  it('passes its own self-test in a complete clone', () => {
    assert.equal(probeSelfTest(FULL, makeAncestryProbe(FULL)), null)
  })

  it('gives every row of the fixture the revision requeue.sh would merge into', () => {
    const resolved = resolveTips(FULL, rows())
    assert.deepEqual(
      resolved.map((r) => r.tipFrom),
      ['origin/chain-head', 'origin/chain-mid', 'origin/chain-tail', 'origin/solo', 'origin/twin'],
    )
    assert.equal(resolved[4].tip, resolved[3].tip)
  })

  it('falls back to the forge tip only when this clone has the object', () => {
    const absent = resolveTips(FULL, [{ number: 1, branch: 'no-such-branch', oid: '0'.repeat(40) }])
    assert.equal(absent[0].tip, null)
    const present = resolveTips(FULL, [{ number: 1, branch: 'no-such-branch', oid: tip['solo'] }])
    assert.equal(present[0].tipFrom, 'headRefOid')
    assert.equal(hasCommit(FULL, present[0].tip), true)
  })
})

describe('the fail-open hazard', () => {
  it('git itself reports a contained pair as NOT CONTAINED in a widened shallow clone', () => {
    // Not an assertion about this program. This is the measurement that makes
    // the refusal below necessary, executed rather than cited: the exit code
    // is 1, which is indistinguishable from an honest "not an ancestor", and
    // `main` IS an ancestor of `chain-tail` in the repository being asked.
    assert.equal(makeAncestryProbe(FULL)(tip['main'], tip['chain-tail']), true)
    const r = run(WIDENED, 'git', ['merge-base', '--is-ancestor', 'origin/main', 'origin/chain-tail'])
    assert.equal(r.status, 1, 'if this ever stops exiting 1 the hazard has changed and this suite should be revisited')
  })

  it('refuses to produce any verdict in a shallow clone, at exit 2', () => {
    const rowsFile = join(ROOT, 'rows.json')
    writeFileSync(rowsFile, JSON.stringify(rows()))
    const r = run(SHALLOW, process.execPath, [GATE, '--repo', SHALLOW, '--rows', rowsFile, '--json'])
    assert.equal(r.status, 2)
    assert.equal(r.stdout.trim(), '', 'a refusal must not put a verdict on stdout')
    assert.match(r.stderr, /Refusing to judge containment/)
  })

  it('refuses in the widened shallow clone, where the HEAD pair alone passes', () => {
    // Both halves asserted, because the point of this case is that the two
    // defences disagree: HEAD~1 resolves here and answers correctly, so a
    // self-test built only on it would hand the caller a green light.
    assert.equal(git(WIDENED, 'rev-parse', '--is-shallow-repository'), 'true')
    const probe = makeAncestryProbe(WIDENED)
    const head = git(WIDENED, 'rev-parse', 'HEAD')
    const parent = git(WIDENED, 'rev-parse', 'HEAD~1')
    assert.equal(probe(parent, head), true, 'the HEAD pair answers correctly in this clone')
    assert.equal(probe(head, parent), false, 'the HEAD pair answers correctly in this clone')

    const fault = probeSelfTest(WIDENED, probe)
    assert.notEqual(fault, null, 'the self-test must refuse a shallow clone the HEAD pair cannot detect')
    assert.match(fault, /shallow/)

    const rowsFile = join(ROOT, 'rows-widened.json')
    writeFileSync(rowsFile, JSON.stringify(rows()))
    const r = run(WIDENED, process.execPath, [GATE, '--repo', WIDENED, '--rows', rowsFile, '--conflicting'])
    assert.equal(r.status, 2)
    assert.equal(r.stdout.trim(), '')
  })
})

describe('end to end, over the real program', () => {
  it('names one mergeable row and three skips out of five', () => {
    const rowsFile = join(ROOT, 'rows-e2e.json')
    writeFileSync(rowsFile, JSON.stringify(rows()))
    const r = run(FULL, process.execPath, [GATE, '--repo', FULL, '--rows', rowsFile, '--conflicting'])
    assert.equal(r.status, 0)
    const lines = r.stdout.trim().split('\n').map((l) => l.split('\t'))
    assert.deepEqual(lines, [
      ['1', MERGE, ''],
      ['2', CONTAINED, '1'],
      ['3', CONTAINED, '1,2'],
      ['4', IDENTICAL, '5'],
    ])
    // The containing row's number is on stdout, and the sentence saying what
    // it means is on stderr. Neither stream carries the other's content.
    assert.match(r.stderr, /#3 is already contained in #1 \(chain-head\), #2 \(chain-mid\)/)
    assert.equal(/already contained/.test(r.stdout), false)
  })

  it('judges an explicitly named row by the same rule as a selected one', () => {
    const rowsFile = join(ROOT, 'rows-named.json')
    writeFileSync(rowsFile, JSON.stringify(rows()))
    const r = run(FULL, process.execPath, [GATE, '--repo', FULL, '--rows', rowsFile, '3'])
    assert.equal(r.status, 0)
    assert.equal(r.stdout.trim(), `3\t${CONTAINED}\t1,2`)
  })

  it('exits 2 on an unreadable row list rather than classifying nothing as clean', () => {
    const r = run(FULL, process.execPath, [GATE, '--repo', FULL, '--rows', join(ROOT, 'absent.json')])
    assert.equal(r.status, 2)
    assert.match(r.stderr, /open-row list is unreadable/)
  })

  it('exits 2 on an unknown argument', () => {
    const r = run(FULL, process.execPath, [GATE, '--repo', FULL, '--push'])
    assert.equal(r.status, 2)
    assert.match(r.stderr, /unknown argument: --push/)
  })
})
