// The half of the gate that only exists in the CLI: which lockfiles it finds,
// what `--write` produces, what `--names` answers, and each of the three exit
// codes reached by driving the program rather than by calling its verdict.
//
// WHY FIXTURE REPOSITORIES AND NOT STUBS. The gate's unit of evidence is `git
// ls-files` over a checkout plus the bytes on disk, so a stub that handed it
// parsed objects would prove nothing about the thing it actually does. Each
// fixture here is a real `git init` with real commits and a real
// package-lock.json, driven through `--root`, which is the flag that exists so
// these branches are reachable at all; see the gate's header.
//
// WHY THE COMMITTED REPOSITORY IS ALSO DRIVEN, in `this repository` below. A
// fixture proves the branches work. It cannot prove the gate is green on the
// thing CI will run it against, and a gate that is red on `main` stops being
// read within a week -- which `tools/ledger/check.mjs`'s own header records as
// having happened here already.

import { strict as assert } from 'node:assert'
import { execFileSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { after, describe, it } from 'node:test'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const GATE = resolve(HERE, 'check-closure.mjs')
const REPO_ROOT = resolve(HERE, '..', '..')

const temps = []
after(() => {
  for (const dir of temps) rmSync(dir, { recursive: true, force: true })
})

/** A lockfile with `prod` shipping and `tool` development-only. */
function lockfile(members, devMembers = ['tool@2.0.0']) {
  const packages = { '': { name: 'fixture', version: '0.1.0' } }
  for (const m of members) {
    const at = m.lastIndexOf('@')
    packages[`node_modules/${m.slice(0, at)}`] = { version: m.slice(at + 1) }
  }
  for (const m of devMembers) {
    const at = m.lastIndexOf('@')
    packages[`node_modules/${m.slice(0, at)}`] = { version: m.slice(at + 1), dev: true }
  }
  return { name: 'fixture', lockfileVersion: 3, packages }
}

/**
 * A git checkout with one or more lockfiles and an optional baseline.
 * @param {Record<string, object>} locks keyed by workspace directory.
 * @param {object | undefined} baseline written to tools/registers/prod-closure.json.
 */
function fixture(locks, baseline) {
  const root = mkdtempSync(join(tmpdir(), 'ursa-closure-'))
  temps.push(root)
  execFileSync('git', ['-C', root, 'init', '-q', '-b', 'main'])
  execFileSync('git', ['-C', root, 'config', 'user.email', 'fixture@example.invalid'])
  execFileSync('git', ['-C', root, 'config', 'user.name', 'fixture'])
  for (const [dir, lock] of Object.entries(locks)) {
    mkdirSync(join(root, dir), { recursive: true })
    writeFileSync(join(root, dir, 'package-lock.json'), `${JSON.stringify(lock, null, 2)}\n`)
  }
  mkdirSync(join(root, 'tools', 'registers'), { recursive: true })
  if (baseline !== undefined) {
    writeFileSync(join(root, 'tools', 'registers', 'prod-closure.json'), `${JSON.stringify(baseline, null, 2)}\n`)
  }
  execFileSync('git', ['-C', root, 'add', '-A'])
  execFileSync('git', ['-C', root, 'commit', '-q', '-m', 'fixture'])
  return root
}

function run(args, root) {
  const argv = root === undefined ? args : [...args, '--root', root]
  try {
    const stdout = execFileSync('node', [GATE, ...argv], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] })
    return { code: 0, stdout, stderr: '' }
  } catch (error) {
    return { code: error.status, stdout: error.stdout ?? '', stderr: error.stderr ?? '' }
  }
}

const pin = (dir, members) => ({ workspaces: { [dir]: { members, count: members.length, devOnlyEntriesExcluded: 1 } } })

describe('exit 0', () => {
  it('a closure that matches its pin', () => {
    const root = fixture({ app: lockfile(['a@1.0.0']) }, pin('app', ['a@1.0.0']))
    const { code, stdout } = run([], root)
    assert.equal(code, 0)
    assert.equal(
      stdout.trim(),
      '1 package(s) in the production closure of 1 workspace(s), with 1 development-only entry(ies) excluded, every member pinned in the committed baseline at tools/registers/prod-closure.json. Exit 0.'.replace(/^/, 'Production closure: '),
    )
  })
})

describe('exit 1', () => {
  it('SURFACE_GREW prints the finding line and then the verdict, in that order', () => {
    // `position` is AFTER for this gate, so the per-finding lines come first.
    // Asserting the ORDER and not just the content is the point: a reader
    // scanning a CI log reads the last line as the verdict, and a gate that
    // printed its verdict first would make the findings look like a trailer.
    const root = fixture({ app: lockfile(['a@1.0.0', 'new@3.0.0']) }, pin('app', ['a@1.0.0']))
    const { code, stdout } = run([], root)
    assert.equal(code, 1)
    const lines = stdout.trim().split('\n')
    assert.equal(
      lines[0],
      '::error::CLOSURE_ADDED: app: new@3.0.0 is in the production closure and is not in the baseline, so it reaches a deployed surface with no review behind it',
    )
    assert.match(lines[1], /^Production closure: .* and 1 of 1 finding\(s\) above are bytes newly reaching a deployed surface/)
    assert.match(lines[1], /Exit 1\.$/)
  })

  it('REGISTER_STALE when the pin over-states what ships', () => {
    const root = fixture({ app: lockfile([]) }, pin('app', ['a@1.0.0']))
    const { code, stdout } = run([], root)
    assert.equal(code, 1)
    assert.match(stdout, /CLOSURE_REMOVED: app: a@1\.0\.0 is in the baseline and no longer/)
    assert.match(stdout, /nothing new shipping, and 1 finding\(s\) above/)
  })

  it('a second lockfile nobody pinned, reported once rather than per package', () => {
    const root = fixture(
      { app: lockfile(['a@1.0.0']), other: lockfile(['x@1.0.0', 'y@1.0.0']) },
      pin('app', ['a@1.0.0']),
    )
    const { code, stdout } = run([], root)
    assert.equal(code, 1)
    const errors = stdout.split('\n').filter((l) => l.startsWith('::error::'))
    assert.equal(errors.length, 1)
    assert.match(errors[0], /WORKSPACE_UNPINNED: other: a committed package-lock\.json with 2 package\(s\)/)
  })
})

describe('exit 2, the three ground branches', () => {
  it('an absent baseline names the command that creates it', () => {
    const root = fixture({ app: lockfile(['a@1.0.0']) }, undefined)
    const { code, stderr, stdout } = run([], root)
    assert.equal(code, 2)
    assert.match(stderr, /BASELINE_ABSENT/)
    assert.match(stderr, /--write/)
    assert.equal(stdout, '', 'a ground verdict goes to stderr, so a log scraper reading stdout sees nothing claiming to be clean')
  })

  it('a lockfile this gate has not been checked against is refused rather than guessed at', () => {
    const v2 = lockfile(['a@1.0.0'])
    v2.lockfileVersion = 2
    const root = fixture({ app: v2 }, pin('app', ['a@1.0.0']))
    const { code, stderr } = run([], root)
    assert.equal(code, 2)
    assert.match(stderr, /LOCKFILE_VERSION_UNSUPPORTED/)
    assert.match(stderr, /app\/package-lock\.json is lockfileVersion 2/)
  })

  it('a checkout with no tracked lockfile is exit 2 and not a clean exit 0', () => {
    // The branch that matters most here. Finding nothing to check is the one
    // condition under which a gate's silence is indistinguishable from its
    // approval, and this gate's whole value is as a standing claim about what
    // ships.
    const root = fixture({}, pin('app', ['a@1.0.0']))
    const { code, stderr } = run([], root)
    assert.equal(code, 2)
    assert.match(stderr, /NO_TRACKED_LOCKFILES/)
    assert.match(stderr, /would check nothing and exit 0/)
  })

  it('a directory that is not a git checkout is a named cause, not a stack trace', () => {
    const root = mkdtempSync(join(tmpdir(), 'ursa-closure-nogit-'))
    temps.push(root)
    const { code, stderr } = run([], root)
    assert.equal(code, 2)
    assert.match(stderr, /NOT_A_GIT_CHECKOUT|NO_TRACKED_LOCKFILES/)
    assert.ok(!/ at /.test(stderr), `a stack trace leaked: ${stderr}`)
  })
})

describe('--write', () => {
  it('writes a baseline the gate then passes, and is idempotent', () => {
    const root = fixture({ app: lockfile(['b@2.0.0', 'a@1.0.0']) }, undefined)
    const { code, stdout } = run(['--write'], root)
    assert.equal(code, 0)
    assert.match(stdout, /wrote 2 package\(s\) across 1 workspace\(s\)/)

    const path = join(root, 'tools', 'registers', 'prod-closure.json')
    const first = readFileSync(path, 'utf8')
    assert.deepEqual(JSON.parse(first).workspaces.app.members, ['a@1.0.0', 'b@2.0.0'])

    assert.equal(run([], root).code, 0, 'the gate should pass against the baseline --write just produced')
    assert.equal(run(['--write'], root).code, 0)
    assert.equal(readFileSync(path, 'utf8'), first, '--write is not idempotent, so every run would show a diff')
  })

  it('writes a baseline its own validator accepts, including the sorted order', () => {
    const root = fixture({ app: lockfile(['zed@1.0.0', '@scope/a@1.0.0']) }, undefined)
    run(['--write'], root)
    const written = JSON.parse(readFileSync(join(root, 'tools', 'registers', 'prod-closure.json'), 'utf8'))
    assert.deepEqual(written.workspaces.app.members, ['@scope/a@1.0.0', 'zed@1.0.0'])
    assert.ok(written._note.includes('npm ci --omit=dev'), 'the baseline has to say what it is to someone who opens it cold')
  })

  it('ends the file with a newline, so a diff does not report "\\ No newline at end of file"', () => {
    const root = fixture({ app: lockfile(['a@1.0.0']) }, undefined)
    run(['--write'], root)
    assert.ok(readFileSync(join(root, 'tools', 'registers', 'prod-closure.json'), 'utf8').endsWith('}\n'))
  })
})

describe('--names', () => {
  it('answers for a shipping package and a development-only one, per workspace', () => {
    const root = fixture({ app: lockfile(['a@1.0.0']) }, pin('app', ['a@1.0.0']))
    const { code, stdout } = run(['--names', 'a', 'tool', 'absent'], root)
    assert.equal(code, 0, 'a query is not a gate; "yes it ships" is a fact and not a defect')
    assert.match(stdout, /^a +app +ships as a@1\.0\.0$/m)
    assert.match(stdout, /^tool +app +development-only or absent/m)
    assert.match(stdout, /^absent +app +development-only or absent/m)
  })

  it('answers with --json in a shape another program can read', () => {
    const root = fixture({ app: lockfile(['a@1.0.0']) }, pin('app', ['a@1.0.0']))
    const { stdout } = run(['--names', 'a', '--json'], root)
    assert.deepEqual(JSON.parse(stdout).names, [{ package: 'a', workspace: 'app', ships: true, versions: ['a@1.0.0'] }])
  })

  it('does not read the baseline at all, so the query works before anything is pinned', () => {
    // This is the whole reason --names is a query. The seat that needed the
    // answer on 2026-10-26 had no baseline to read, and a query that required
    // one would have been just as unavailable as the thing it replaces.
    const root = fixture({ app: lockfile(['a@1.0.0']) }, undefined)
    const { code, stdout } = run(['--names', 'a'], root)
    assert.equal(code, 0)
    assert.match(stdout, /ships as a@1\.0\.0/)
  })
})

describe('this repository', () => {
  it('is green, with the clean line naming all three of its workspaces worth of packages', () => {
    const { code, stdout } = run([])
    assert.equal(code, 0, stdout)
    assert.match(stdout, /^Production closure: \d+ package\(s\) in the production closure of 3 workspace\(s\)/)
    assert.match(stdout, /every member pinned in the committed baseline/)
  })

  it('finds exactly the three lockfiles that are tracked, and not one inside node_modules', () => {
    const tracked = execFileSync('git', ['-C', REPO_ROOT, 'ls-files', '*package-lock.json'], { encoding: 'utf8' })
      .split('\n')
      .filter(Boolean)
    assert.deepEqual(tracked.sort(), [
      'ursa-major/overlay/package-lock.json',
      'ursa-major/package-lock.json',
      'ursa-minor/package-lock.json',
    ])
    const { stdout } = run(['--json'])
    assert.deepEqual(Object.keys(JSON.parse(stdout).workspaces).sort(), ['ursa-major', 'ursa-major/overlay', 'ursa-minor'])
  })

  it('answers the 2026-10-26 ledger entry in one invocation, which is the point of the flag', () => {
    const { code, stdout } = run(['--names', 'shadcn', '@modelcontextprotocol/sdk', '--json'])
    assert.equal(code, 0)
    const rows = JSON.parse(stdout).names
    const minor = (pkg) => rows.find((r) => r.package === pkg && r.workspace === 'ursa-minor')
    assert.equal(minor('shadcn').ships, false)
    assert.equal(minor('@modelcontextprotocol/sdk').ships, false)
    // And the half the entry did not measure, because it only looked at one
    // workspace. Asserted so that the next reader of that entry is not told
    // "development-only" about a package name that reaches production here.
    const major = rows.find((r) => r.package === '@modelcontextprotocol/sdk' && r.workspace === 'ursa-major')
    assert.equal(major.ships, true)
    assert.deepEqual(major.versions, ['@modelcontextprotocol/sdk@1.32.1'])
  })
})
