#!/usr/bin/env node
// node --test tools/stack/merge-surface.test.mjs
//
// THE TESTS THAT MATTER ARE THE TWO UNDER `the stream guard`. Every other case
// here proves the gate answers correctly when the world is well-formed, and
// this repository has four recorded incidents in which `git merge-tree`
// answered correctly-looking and wrongly when it was not. A suite that only
// proves the happy path on this particular gate proves nothing: the whole
// reason the gate exists is the unhappy paths, and three of the four incidents
// were discovered by a person rather than by a check.
//
// So the suite drives the exact bytes a collapsed stream produces -- the
// ledger driver's real diagnostic line, copied from this repository's own
// 2026-11-02 run -- and asserts the gate refuses rather than reporting the
// path list underneath it. If that case ever goes green as a conflict surface,
// the gate has become decoration.
//
// HERMETIC. A local bare origin over the file transport and a merge driver
// written into the fixture as a two-line shell script that writes to stderr on
// purpose. No network, no GitHub account, nothing read from the real
// repository except the two files under test and `tools/ensure-full-clone.sh`,
// which the fixture carries at its real path because the gate shells out to it
// by path.

import { strict as assert } from 'node:assert'
import { execFileSync } from 'node:child_process'
import { describe, it, before, after } from 'node:test'
import { copyFileSync, mkdirSync, mkdtempSync, rmSync, writeFileSync, chmodSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { LOCUS } from '../gates/verdict-shape.mjs'
import { auditDrivers, parseSurface } from './merge-surface.mjs'
import { GATE, GROUND, pathLine, verdict } from './merge-surface-verdict.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = resolve(HERE, '..', '..')
const GATE_PATH = 'tools/stack/merge-surface.mjs'

/** The real first line of stderr from this repository's `ledger` driver, as it
 *  appeared on 2026-11-02 merging `origin/main` into `refs/prs/615`. Copied
 *  rather than invented, because the guard has to hold against the text a real
 *  driver writes and not against a string chosen to be easy to detect. */
const REAL_DIAGNOSTIC =
  'ledger driver: docs/ideas.md merged by block identity. 13 block(s) taken from the other branch, 0 removed.'

const TREE = '355465d0805569750aa309eaee680cf12eccbb05'

let ROOT, clone

const git = (cwd, ...a) =>
  execFileSync('git', ['-C', cwd, ...a], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim()

/** Run the gate as a program against the fixture. Returns exit code and JSON. */
function run(args) {
  try {
    const out = execFileSync('node', [GATE_PATH, '--json', `--repo=${clone}`, ...args], {
      cwd: REPO_ROOT,
      encoding: 'utf8',
    })
    return { code: 0, json: JSON.parse(out) }
  } catch (err) {
    return { code: err.status, json: err.stdout ? JSON.parse(err.stdout) : null }
  }
}

before(() => {
  ROOT = mkdtempSync(join(tmpdir(), 'merge-surface-'))
  const origin = join(ROOT, 'origin')
  execFileSync('git', ['init', '--quiet', '--bare', '-b', 'main', origin])
  const seed = join(ROOT, 'seed')
  execFileSync('git', ['clone', '--quiet', origin, seed])
  git(seed, 'config', 'user.email', 'test@ursa.local')
  git(seed, 'config', 'user.name', 'test')

  // A file the driver owns, and a file it does not, so a run can conflict on
  // the second while the first is merged by the driver and reported on stderr.
  writeFileSync(join(seed, 'ledger.md'), 'entry one\n')
  writeFileSync(join(seed, 'plain.md'), 'line one\nline two\nline three\n')
  writeFileSync(join(seed, '.gitattributes'), 'ledger.md merge=ledger\n')
  git(seed, 'add', '-A')
  git(seed, 'commit', '-q', '-m', 'base')
  git(seed, 'push', '-q', 'origin', 'main')
  const base = git(seed, 'rev-parse', 'HEAD')

  // main moves: it rewrites line two of the plain file and appends to the
  // ledger file, so the driver has something to decide on every merge below.
  writeFileSync(join(seed, 'plain.md'), 'line one\nMAIN\nline three\n')
  writeFileSync(join(seed, 'ledger.md'), 'entry one\nentry from main\n')
  git(seed, 'add', '-A')
  git(seed, 'commit', '-q', '-m', 'main moves')
  git(seed, 'push', '-q', 'origin', 'main')

  // A branch that merges clean: a new file only.
  git(seed, 'checkout', '-q', '-b', 'feat/clean', base)
  writeFileSync(join(seed, 'clean.md'), 'new\n')
  git(seed, 'add', '-A')
  git(seed, 'commit', '-q', '-m', 'clean')
  git(seed, 'push', '-q', 'origin', 'feat/clean')

  // A branch that genuinely conflicts: it rewrites the same line main did.
  git(seed, 'checkout', '-q', '-b', 'feat/conflict', base)
  writeFileSync(join(seed, 'plain.md'), 'line one\nBRANCH\nline three\n')
  writeFileSync(join(seed, 'ledger.md'), 'entry one\nentry from branch\n')
  git(seed, 'add', '-A')
  git(seed, 'commit', '-q', '-m', 'conflict')
  git(seed, 'push', '-q', 'origin', 'feat/conflict')

  // A branch with an unrelated root: git refuses to merge it at all, which is
  // exit 128 and must never be counted as a conflict in zero files (L-A55).
  execFileSync('git', ['-C', seed, 'checkout', '-q', '--orphan', 'feat/orphan'])
  execFileSync('git', ['-C', seed, 'rm', '-rq', '--cached', '.'])
  writeFileSync(join(seed, 'only.md'), 'unrelated\n')
  git(seed, 'add', 'only.md')
  git(seed, 'commit', '-q', '-m', 'orphan')
  git(seed, 'push', '-q', 'origin', 'feat/orphan')

  // The clone under test: complete on both properties, because the gate's
  // first precondition is exactly that and the suite is not testing it here.
  clone = join(ROOT, 'clone')
  execFileSync('git', ['clone', '--quiet', origin, clone])
  git(clone, 'config', 'remote.origin.fetch', '+refs/heads/*:refs/remotes/origin/*')
  git(clone, 'fetch', '--quiet', 'origin')

  // The driver: a shell script that takes the three blob paths, concatenates
  // ours and theirs into %A, and writes a diagnostic to STDERR, which is what
  // this repository's real `ledger` driver does and the whole reason the
  // stream guard exists.
  mkdirSync(join(clone, 'bin'), { recursive: true })
  const driver = join(clone, 'bin', 'union.sh')
  writeFileSync(
    driver,
    '#!/usr/bin/env bash\n' +
      'set -u\n' +
      'echo "ledger driver: $4 merged by block identity." >&2\n' +
      'cat "$2" "$3" | awk \'!seen[$0]++\' > "$2.u" && mv "$2.u" "$2"\n' +
      'exit 0\n',
  )
  chmodSync(driver, 0o755)
  git(clone, 'config', 'merge.ledger.name', 'fixture union driver')
  git(clone, 'config', 'merge.ledger.driver', `bash ${driver} %O %A %B %L %P`)
})

after(() => rmSync(ROOT, { recursive: true, force: true }))

describe('the stream guard, which is the only proof this gate beats the command it wraps', () => {
  it('refuses a stdout whose first line is a driver diagnostic, rather than reading the paths under it', () => {
    // These are the exact bytes `git merge-tree --write-tree --name-only
    // origin/main refs/prs/615 2>&1` produced in this repository on
    // 2026-11-02: the diagnostic on line one, the tree on line two, and the
    // three real conflicted paths under it.
    const collapsed = [
      REAL_DIAGNOSTIC,
      TREE,
      'tools/gates/enumerate-verdicts.mjs',
      'tools/gates/enumerate-verdicts.test.mjs',
      'tools/secret-scan-verdict.mjs',
      '',
    ].join('\n')
    const got = parseSurface(collapsed, () => true)
    assert.ok('fault' in got, 'a collapsed stream must not parse as a surface')
    assert.equal(got.fault, REAL_DIAGNOSTIC)

    const v = GROUND.treeIdUnreadable(got.fault)
    assert.equal(v.exitCode, 2)
    assert.equal(v.cause, 'TREE_ID_UNREADABLE')
    assert.equal(v.derivedFrom, 'ground')
    assert.match(v.trailer.join('\n'), /never 2>&1/)
  })

  it('is the direction that matters: the same bytes read by a fixed-width head lose the LAST path', () => {
    // This is the under-report reproduced, and it is why the guard is positive
    // rather than a check for known diagnostic text. `head -4` over the
    // separated stream yields three paths; over the collapsed stream it yields
    // two and the tree id, and the path it drops is the third one. An
    // under-report of a conflict surface reads as progress, so a seat handed
    // it rebases, pushes, and is refused on a file nobody named.
    const paths = [
      'tools/gates/enumerate-verdicts.mjs',
      'tools/gates/enumerate-verdicts.test.mjs',
      'tools/secret-scan-verdict.mjs',
    ]
    const separated = [TREE, ...paths, ''].join('\n')
    const collapsed = [REAL_DIAGNOSTIC, TREE, ...paths, ''].join('\n')
    const headFour = (s) => s.split('\n').slice(0, 4).slice(1)
    assert.deepEqual(headFour(separated), paths)
    assert.deepEqual(headFour(collapsed), [TREE, paths[0], paths[1]])
    // And the gate's own parse of the separated stream is the full three.
    assert.deepEqual(parseSurface(separated, () => true).paths, paths)
  })

  it('refuses a 40-character first line that names no object, since the shape alone is not enough', () => {
    const notAnObject = 'f'.repeat(40)
    const got = parseSurface(`${notAnObject}\nsome/path\n\n`, () => false)
    assert.ok('fault' in got)
    assert.equal(got.fault, notAnObject)
  })

  it('accepts the well-formed shape and stops at the blank line, not at the end of the output', () => {
    const stdout = [TREE, 'a.md', 'b.md', '', 'Auto-merging a.md', 'CONFLICT (content): a.md', ''].join('\n')
    const got = parseSurface(stdout, () => true)
    assert.deepEqual(got, { tree: TREE, paths: ['a.md', 'b.md'] })
  })
})

describe('the driver audit, which is three questions and not one', () => {
  const fakeGit = (attrs, config) => (args) => {
    if (args[0] === 'show') return { out: attrs, status: 0 }
    if (args[0] === 'config') return { out: config, status: config === '' ? 1 : 0 }
    return { out: '', status: 0 }
  }

  it('names a declared driver this clone never registered', () => {
    const d = auditDrivers(fakeGit('docs/ideas.md merge=ledger\ndocs/decisions.md merge=register\n', ''), '/repo')
    assert.deepEqual(d.declared, ['ledger', 'register'])
    assert.deepEqual(d.unregistered, ['ledger', 'register'])
    assert.equal(d.keys, 0)
    const v = GROUND.driversUnregistered(d.unregistered)
    assert.equal(v.cause, 'DRIVERS_UNREGISTERED')
    assert.match(v.trailer.join('\n'), /install-drivers\.sh/)
  })

  it('names a key set to the empty string, which exits 1 exactly as a conflict does', () => {
    const d = auditDrivers(fakeGit('docs/ideas.md merge=ledger\n', 'merge.ledger.driver '), '/repo')
    assert.deepEqual(d.empty, ['ledger'])
    assert.deepEqual(d.unregistered, [])
    assert.equal(GROUND.driverEmpty(d.empty).cause, 'DRIVER_EMPTY')
  })

  it('names a driver whose program is in another checkout, which is what an absolute path invites', () => {
    const d = auditDrivers(
      fakeGit('docs/ideas.md merge=ledger\n', 'merge.ledger.driver node /somewhere/else/union-merge.mjs %O %A %B'),
      '/repo',
    )
    assert.deepEqual(d.foreign, ['ledger'])
    assert.equal(GROUND.driverPathForeign(d.foreign, '/repo').cause, 'DRIVER_PATH_FOREIGN')
  })

  it('passes a driver registered to a program inside this checkout', () => {
    const d = auditDrivers(
      fakeGit(
        'docs/ideas.md merge=ledger\n',
        `merge.ledger.driver node ${REPO_ROOT}/tools/ledger/union-merge.mjs %O %A %B %L %P`,
      ),
      REPO_ROOT,
    )
    assert.deepEqual(d.foreign, [])
    assert.deepEqual(d.unregistered, [])
    assert.deepEqual(d.empty, [])
    assert.equal(d.keys, 1)
  })
})

describe('the gate as a program, against a fixture repository', () => {
  it('reports a clean branch at exit 0, with the pair of commits it measured', () => {
    const { code, json } = run(['--head=origin/feat/clean'])
    assert.equal(code, 0)
    const row = json.rows[0]
    assert.equal(row.cause, 'MERGES_CLEAN')
    assert.deepEqual(row.paths, [])
    assert.match(row.seen.baseOid, /^[0-9a-f]{40}$/)
    assert.match(row.seen.headOid, /^[0-9a-f]{40}$/)
  })

  it('reports a real conflict at exit 1, naming the path and not the driver-owned file', () => {
    const { code, json } = run(['--head=origin/feat/conflict'])
    assert.equal(code, 1)
    const row = json.rows[0]
    assert.equal(row.cause, 'PATHS_CONFLICT')
    assert.deepEqual(row.paths, ['plain.md'])
    // The driver fired on ledger.md and said so on stderr, which is the proof
    // the two handles were read separately in the same invocation that
    // produced the path list above.
    assert.ok(
      row.seen.diagnostics.some((d) => d.includes('merged by block identity')),
      `expected a driver diagnostic, got ${JSON.stringify(row.seen.diagnostics)}`,
    )
  })

  it('reports a merge git refused as ground, never as a conflict in zero files', () => {
    const { code, json } = run(['--head=origin/feat/orphan'])
    assert.equal(code, 2)
    const row = json.rows[0]
    assert.equal(row.cause, 'MERGE_REFUSED')
    assert.equal(row.derived_from, 'ground')
    assert.deepEqual(row.paths, [])
  })

  it('reports a revision that does not resolve as ground, with the revision named', () => {
    const { code, json } = run(['--head=refs/prs/999999'])
    assert.equal(code, 2)
    assert.equal(json.rows[0].cause, 'MERGE_REFUSED')
    assert.match(json.rows[0].line, /refs\/prs\/999999/)
  })

  it('exits on the worst row of a sweep, so one unmeasurable branch is not hidden by twenty clean ones', () => {
    const { code, json } = run(['--head=origin/feat/clean', '--base=origin/main'])
    assert.equal(code, 0)
    assert.equal(json.rows.length, 1)
  })
})

describe('the clone precondition, rehearsed red', () => {
  it('refuses a shallow clone instead of measuring one, and quotes the reason off stderr', () => {
    const shallow = join(ROOT, 'shallow')
    // `file://` and not the bare path. `git clone --depth 1 /some/dir` prints
    // "--depth is ignored in local clones" and hands back a complete history,
    // so the fixture would be narrow only and this test would prove half of
    // what it claims. Measured: over the bare path the gate reports one
    // reason, `refspec`; over `file://` it reports both.
    execFileSync('git', ['clone', '--quiet', '--depth', '1', `file://${join(ROOT, 'origin')}`, shallow])
    let code, json
    try {
      const out = execFileSync('node', [GATE_PATH, '--json', `--repo=${shallow}`, '--head=origin/main'], {
        cwd: REPO_ROOT,
        encoding: 'utf8',
      })
      code = 0
      json = JSON.parse(out)
    } catch (err) {
      code = err.status
      json = JSON.parse(err.stdout)
    }
    assert.equal(code, 2)
    assert.equal(json.rows[0].cause, 'CLONE_INCOMPLETE')
    // BOTH reasons, joined, and not just the first. `--depth 1` also implies
    // `--single-branch`, so this clone is broken on both of the two
    // independent properties `ensure-full-clone.sh` separates, and the gate
    // has to carry both into the line.
    //
    // This assertion is written against the join rather than against either
    // word because of what the first version of it could not see. Reading the
    // reasons off the wrong handle yields an empty string that prints as "no
    // reason given", and the gate has TWO branches that both return
    // CLONE_INCOMPLETE, one for `--check` exit 1 and one for `--check`
    // failing to run. Deleting either one on its own left this test green,
    // because the other caught the same fixture and named the same cause. So
    // `/depth|refspec/` proved the cause and not the reading. The join only
    // exists on the exit-1 path, where the reason lines are filtered and
    // joined, which is the path a real narrowed clone takes.
    assert.match(json.rows[0].line, /depth: .*; refspec: /)
    rmSync(shallow, { recursive: true, force: true })
  })
})

describe('the verdict module, through its own declared space', () => {
  it('declares three findings probes and six grounds, each with a distinct cause', () => {
    const causes = new Set(GATE.groundProbes.map((p) => p.call().cause))
    assert.equal(GATE.probes.length, 3)
    assert.equal(GATE.groundProbes.length, 6)
    assert.equal(causes.size, 6)
  })

  it('names the seat as the repair holder on every conflict verdict and nowhere else', () => {
    const conflicted = verdict([{ path: 'a.md', locus: LOCUS.SEAT }], GATE.probes[1].seen)
    assert.match(conflicted.line, GATE.loci[LOCUS.SEAT].noun)
    const clean = verdict([], GATE.probes[0].seen)
    assert.doesNotMatch(clean.line, GATE.loci[LOCUS.SEAT].noun)
    assert.equal(clean.exitCode, 0)
  })

  it('derives every integer in the conflict line from the findings and the census', () => {
    const findings = GATE.probes[1].findings
    const v = verdict(findings, GATE.probes[1].seen)
    assert.match(v.line, new RegExp(`${findings.length} conflicted path\\(s\\)`))
    assert.match(v.line, new RegExp(`${GATE.probes[1].seen.drivers} merge driver key\\(s\\)`))
    assert.match(
      v.line,
      new RegExp(`${GATE.probes[1].seen.diagnostics.length} driver diagnostic\\(s\\)`),
    )
  })

  it('prints one line per conflicted path and states the repair once', () => {
    const findings = GATE.probes[1].findings
    assert.deepEqual(
      findings.map(pathLine),
      findings.map((f) => `  ${f.path}`),
    )
  })

  it('carries the commit pair into the trailer of both outcomes, never only the failing one', () => {
    for (const probe of [GATE.probes[0], GATE.probes[1]]) {
      const v = verdict(probe.findings, probe.seen)
      assert.match(v.trailer.join('\n'), new RegExp(probe.seen.baseOid))
      assert.match(v.trailer.join('\n'), new RegExp(probe.seen.headOid))
    }
  })
})
