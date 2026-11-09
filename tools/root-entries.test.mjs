#!/usr/bin/env node
// node --test tools/root-entries.test.mjs
//
// WHY THIS SUITE IS THE POINT OF THE GATE. A gate over the shape of the
// repository root prints a zero on a healthy day, and so does a gate whose
// allowlist is empty, whose `git ls-files` returned nothing, or whose ignore
// rule was deleted. So the suite plants real scratch files in a throwaway
// repository and watches the gate fail, the way `secret-scan.test.mjs` plants
// canaries. Nothing here asserts that the gate is correct because its comments
// say so.
//
// Three claims it holds that the gate alone cannot:
//
//   1. THE HISTORICAL MEASUREMENT, RE-RUNNABLE. Seventeen root-level
//      dot-entries have been committed to this repository as run scratch. The
//      list is pinned below and checked against the committed `.gitignore`, so
//      a future edit that reopens any one of them turns this suite red instead
//      of being discovered by the next audit. The five-of-seventeen figure in
//      `.gitignore`'s own comment is checked too, against the patterns that
//      preceded the inversion, because a claim about what the old rule missed
//      is the whole argument for the new one.
//
//   2. ZERO FALSE POSITIVES, over the whole history rather than over today's
//      tree. The inversion is only cheap if nothing legitimate has ever lived
//      at a root dot-entry outside the four. That is checked against every
//      object reachable from `HEAD`, and skipped with a named reason on an
//      incomplete clone rather than passing on a truncated graph. Entries
//      that exist only on other refs are reported as a diagnostic and not
//      asserted on, for the reason the test itself records: an entry and its
//      allowlist line arrive together, on one branch, and no other branch can
//      answer for them.
//
//   3. THIS REPOSITORY, LIVE. The last test runs the gate on the real
//      checkout. It is a tripwire, not a unit test: it is what fails on the
//      day a seat commits the eighteenth one.
//
// Hermetic apart from claim 3: local repositories under `mktemp -d`, no
// network. The temp directory is made with `mkdtempSync` and not a bare shared
// name, which is PR #602's F46 heeded rather than repeated.
import { test, describe, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { LOCUS } from './gates/verdict-shape.mjs'
import { allowlistFrom } from './root-entries.mjs'
import { entryLine, unusable, verdict } from './root-entries-verdict.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))
const TOOL = join(HERE, 'root-entries.mjs')
const REPO = join(HERE, '..')

/** Every root-level dot-entry this repository has committed as run scratch,
 *  taken on 2026-11-02 from `git rev-list --all --objects` over a repaired
 *  complete clone. Pinned so the claim can be re-checked rather than retold. */
const COMMITTED_SCRATCH = [
  '.engineer-run-2026-09-28',
  '.engineer-run-scratch.md',
  '.exo-run-18.scratch',
  '.exo-run-2026-10-26-w57.md',
  '.exo-run-2026-10-26.md',
  '.exo-run-scratch',
  '.exo-window-35-scratch',
  '.exo-window-40-opening',
  '.exo-window-52-scratch',
  '.exo-window-75-opening',
  '.exo-window-scratch.md',
  '.pm-run-scratch.md',
  '.run',
  '.skill-run-15.md',
  '.skill-run-16.md',
  '.skill-run-scratch',
  '.ursa-run',
]

/** The five name-list patterns that stood before the inversion, exactly as
 *  `.gitignore` carried them, so the five-of-seventeen claim is measured and
 *  not asserted. */
const OLD_PATTERNS = ['.scratch/', '*-scratch', '*.scratch', '.scratch-*', 'scratch/']

const ALLOWLIST = ['.gitignore', '.gitattributes', '.github', '.claude']

/** `git check-ignore -q` exits 1 for a path that is not ignored, and
 *  `execFileSync` throws on a non-zero exit, so the question has to be asked
 *  in a try. Written once here rather than four times inline, because the
 *  inverted sense of that catch is exactly the kind of thing that gets copied
 *  backwards. */
function ignores(cwd, name) {
  try {
    execFileSync('git', ['-C', cwd, 'check-ignore', '-q', '--no-index', '--', name], { stdio: 'ignore' })
    return true
  } catch {
    return false
  }
}

const git = (cwd, ...a) =>
  execFileSync('git', ['-C', cwd, ...a], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim()

function run(repo, ...args) {
  try {
    const stdout = execFileSync('node', [TOOL, `--repo=${repo}`, ...args], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    })
    return { code: 0, stdout, stderr: '' }
  } catch (e) {
    return { code: e.status, stdout: e.stdout ?? '', stderr: e.stderr ?? '' }
  }
}

/** The inverted rule as `.gitignore` carries it, read from the real file so
 *  the fixtures cannot drift from the thing under test. */
function invertedRule() {
  const text = readFileSync(join(REPO, '.gitignore'), 'utf8')
  const lines = text.split('\n').map((l) => l.trim())
  const at = lines.indexOf('/.*')
  assert.notEqual(at, -1, '.gitignore no longer carries the inverted rule')
  return ['/.*', ...lines.filter((l) => l.startsWith('!/'))].join('\n')
}

let ROOT

function freshRepo(name, { rule = true } = {}) {
  const dir = join(ROOT, name)
  mkdirSync(dir)
  git(dir, 'init', '-q', '-b', 'main')
  git(dir, 'config', 'user.email', 'suite@invalid')
  git(dir, 'config', 'user.name', 'suite')
  writeFileSync(join(dir, '.gitignore'), rule ? `node_modules/\n${invertedRule()}\n` : 'node_modules/\n')
  writeFileSync(join(dir, '.gitattributes'), '* text=auto\n')
  mkdirSync(join(dir, '.github'))
  writeFileSync(join(dir, '.github', 'x.yml'), 'name: x\n')
  writeFileSync(join(dir, 'README.md'), '# x\n')
  git(dir, 'add', '-A')
  git(dir, 'commit', '-q', '-m', 'init')
  return dir
}

before(() => {
  ROOT = mkdtempSync(join(tmpdir(), 'root-entries-'))
})
after(() => {
  rmSync(ROOT, { recursive: true, force: true })
})

describe('allowlistFrom reads .gitignore and refuses to invent an allowlist', () => {
  test('no inverted rule means no allowlist, not an empty one', () => {
    assert.equal(allowlistFrom('node_modules/\n!/.gitignore\n'), null)
  })

  test('the rule plus its negations is the allowlist', () => {
    assert.deepEqual(allowlistFrom('/.*\n!/.gitignore\n!/.gitattributes\n!/.github/\n!/.claude/\n'), ALLOWLIST)
  })

  test('a trailing slash on a negated directory is not part of the name', () => {
    assert.deepEqual(allowlistFrom('/.*\n!/.github/\n'), ['.github'])
  })

  test("the repository's own .gitignore yields exactly the four it commits", () => {
    assert.deepEqual(allowlistFrom(readFileSync(join(REPO, '.gitignore'), 'utf8')), ALLOWLIST)
  })

  // The next two pin the `.claude/` spelling, which is the only negation here
  // that exists to track one file rather than a whole entry, and which had
  // nothing asserting it before 2026-11-09.
  test('a negation naming a path inside a directory is not a root entry', () => {
    assert.deepEqual(
      allowlistFrom('/.*\n!/.claude/\n/.claude/*\n!/.claude/settings.json\n'),
      ['.claude'],
    )
  })

  test('re-ignoring a negated directory does not remove it from the allowlist', () => {
    // `/.claude/*` is not a negation, so it must not subtract `.claude`: the
    // entry is still committed, and the gate still has to know that.
    assert.ok(allowlistFrom('/.*\n!/.claude/\n/.claude/*\n').includes('.claude'))
  })
})

describe('the .claude/ carve-out tracks one file and keeps the session out', () => {
  // The guard's PreToolUse registration has to be tracked or every clone
  // drops it. Everything else the harness writes under `.claude/` is private
  // session state, and the redaction gate exists because one of those paths
  // reached a committed file before. So this asserts both halves against the
  // real `.gitignore` rather than a fixture.
  test('settings.json is trackable and the private siblings are not', () => {
    assert.equal(ignores(REPO, '.claude/settings.json'), false,
      'the hook registration is ignored, so no clone would run the guard')
    for (const p of [
      '.claude/settings.local.json',
      '.claude/history.jsonl',
      '.claude/todos/one.json',
      '.claude/projects/-Users-you-Desktop/session.jsonl',
      '.claude/shell-snapshots/snapshot.sh',
    ]) {
      assert.equal(ignores(REPO, p), true, `${p} is not ignored, so a run could commit it`)
    }
  })
})

describe('the gate fails on planted scratch, in both shapes', () => {
  test('only the allowlist present is exit 0, and says so', () => {
    const dir = freshRepo('clean')
    const r = run(dir)
    assert.equal(r.code, 0)
    assert.equal(
      r.stdout.trim(),
      'root-entries: 3 root-level dot-entries, all of them on the 4-name allowlist in .gitignore.',
    )
  })

  test('a committed scratch directory is exit 1, named, and attributed to main', () => {
    const dir = freshRepo('committed')
    mkdirSync(join(dir, '.ursa-run'))
    writeFileSync(join(dir, '.ursa-run', 'opening.txt'), 'run opened\n')
    git(dir, 'add', '-f', '.ursa-run')
    git(dir, 'commit', '-q', '-m', 'scratch')
    const r = run(dir)
    assert.equal(r.code, 1)
    assert.match(r.stdout, /1 of 4 root-level dot-entries are outside the allowlist, 1 committed and 0 loose in this clone\./)
    assert.match(r.stdout, /\.ursa-run {2}tracked and outside the allowlist: git rm -r --cached \.ursa-run/)
  })

  test('the directory is one entry however many files are inside it', () => {
    const dir = freshRepo('committed-many')
    mkdirSync(join(dir, '.ursa-run'))
    for (const n of ['a', 'b', 'c']) writeFileSync(join(dir, '.ursa-run', `${n}.txt`), 'x\n')
    git(dir, 'add', '-f', '.ursa-run')
    git(dir, 'commit', '-q', '-m', 'scratch')
    const r = run(dir)
    assert.equal(r.code, 1)
    assert.match(r.stdout, /1 of 4 root-level dot-entries are outside the allowlist, 1 committed and 0 loose/)
  })

  test('a loose unignored dot-entry is exit 1 and attributed to this clone', () => {
    const dir = freshRepo('loose')
    // Only reachable once something has negated the inversion, which is the
    // case this branch is for: a negation added without an entry to match it,
    // or an entry written where one was added.
    writeFileSync(join(dir, '.gitignore'), `node_modules/\n${invertedRule()}\n!/.late-note\n`)
    git(dir, 'commit', '-qam', 'negate one more')
    writeFileSync(join(dir, '.late-note'), 'wake payload, paraphrased\n')
    const r = run(dir)
    assert.equal(r.code, 1)
    assert.match(r.stdout, /1 of 4 root-level dot-entries are outside the allowlist, 0 committed and 1 loose in this clone\./)
    assert.match(r.stdout, /\.late-note {2}present here and not ignored: rm it, or add !\/\.late-note to \.gitignore/)
  })

  test('an ignored loose dot-entry is not a finding, because the rule already holds', () => {
    const dir = freshRepo('ignored-loose')
    writeFileSync(join(dir, '.security-run-2026-11-02'), 'opening\n')
    const r = run(dir)
    assert.equal(r.code, 0)
  })

  test('.git is never reported, and no ignore rule is what makes that true', () => {
    const dir = freshRepo('dotgit')
    const r = run(dir)
    assert.equal(r.code, 0)
    assert.doesNotMatch(r.stdout, /\.git\b/)
  })
})

describe('a gate that cannot establish its rule never reports clean', () => {
  test('no inverted rule in .gitignore is exit 2 on stderr, not exit 0', () => {
    const dir = freshRepo('norule', { rule: false })
    const r = run(dir)
    assert.equal(r.code, 2)
    assert.equal(r.stdout, '')
    assert.match(r.stderr, /cannot do its job: no `\/\.\*` line in \.gitignore/)
  })

  test('not a git repository is exit 2', () => {
    const dir = join(ROOT, 'not-a-repo')
    mkdirSync(dir)
    writeFileSync(join(dir, '.gitignore'), invertedRule())
    const r = run(dir)
    assert.equal(r.code, 2)
    assert.match(r.stderr, /cannot do its job/)
  })

  test('no .gitignore at all is exit 2', () => {
    const dir = freshRepo('no-ignore-file')
    rmSync(join(dir, '.gitignore'))
    const r = run(dir)
    assert.equal(r.code, 2)
    assert.match(r.stderr, /cannot do its job: there is no \.gitignore/)
  })
})

describe('the verdict renders to the lines the gate prints', () => {
  test('clean, pinned against a literal', () => {
    const v = verdict([], { scanned: 4, allowlist: ALLOWLIST })
    assert.deepEqual(renderable(v, []), [
      'root-entries: 4 root-level dot-entries, all of them on the 4-name allowlist in .gitignore.',
    ])
  })

  test('both shapes at once, pinned against literals', () => {
    const entries = [
      { name: '.ursa-run', locus: LOCUS.COMMITTED },
      { name: '.late-note', locus: LOCUS.CLONE },
    ]
    const v = verdict(entries, { scanned: 5, allowlist: ALLOWLIST })
    assert.deepEqual(renderable(v, entries.map(entryLine)), [
      'root-entries: 2 of 5 root-level dot-entries are outside the allowlist, 1 committed and 1 loose in this clone.',
      '  .ursa-run  tracked and outside the allowlist: git rm -r --cached .ursa-run',
      '  .late-note  present here and not ignored: rm it, or add !/.late-note to .gitignore',
      '',
      'A committed one is in main and every clone has it. A loose one is one',
      '`git add -A` away from becoming a committed one. Neither is scratch',
      'this repository agreed to publish; see .gitignore.',
    ])
  })

  test('the ground verdict goes to stderr and carries no findings', () => {
    const v = unusable('no rule', 'detail')
    assert.equal(v.exitCode, 2)
    assert.equal(v.stream, 'err')
    assert.equal(v.derivedFrom, 'ground')
  })
})

/** `renderVerdict` without importing it twice; the position field is what
 *  decides whether the verdict leads or trails, and this gate leads. */
function renderable(v, findingLines) {
  return v.position === 'before'
    ? [v.line, ...findingLines, ...v.trailer]
    : [...findingLines, v.line, ...v.trailer]
}

describe('the measurement behind the inverted rule, re-runnable', () => {
  test('the committed .gitignore ignores all seventeen', () => {
    const notIgnored = COMMITTED_SCRATCH.filter((name) => !ignores(REPO, name))
    assert.deepEqual(
      notIgnored,
      [],
      'a scratch name this repository has already committed is reachable again',
    )
  })

  test('the four on the allowlist are not ignored, so the inversion did not take the repository with it', () => {
    for (const name of ALLOWLIST) {
      assert.equal(ignores(REPO, name), false, `${name} is ignored, so a change to it could not be staged`)
    }
  })

  test('the five patterns that stood before the inversion covered five of the seventeen', () => {
    const dir = freshRepo('old-patterns', { rule: false })
    writeFileSync(join(dir, '.gitignore'), `${OLD_PATTERNS.join('\n')}\n`)
    const covered = COMMITTED_SCRATCH.filter((name) => ignores(dir, name))
    assert.equal(covered.length, 5, `the old name list covered ${covered.length}, not 5: ${covered.join(' ')}`)
    assert.deepEqual(covered.sort(), [
      '.exo-run-18.scratch',
      '.exo-run-scratch',
      '.exo-window-35-scratch',
      '.exo-window-52-scratch',
      '.skill-run-scratch',
    ])
  })

  // SCOPED TO THIS BRANCH'S OWN HISTORY, and that is the repair for a false
  // red this test produced on 2026-11-02. It read `rev-list --all`, which
  // walks every ref the local clone happens to hold, and a seat run's clone
  // holds every other seat's unmerged branch. So the verdict depended on
  // which branches existed on the remote at clone time, which is a fact
  // about other seats' in-flight work and not about the code under test.
  //
  // What that cost, measured: Ursa's PM committed `.claude/settings.json` at
  // 04:35Z to install HQ's secret-print hook, and correctly extended the
  // allowlist to four on its own branch. Twenty-three minutes later this
  // seat's clone, which does not contain that branch's allowlist change but
  // does contain its commits, went red with "a root dot-entry in this
  // history is neither on the allowlist nor in the pinned scratch list, so
  // the inversion may have a false positive after all". Nothing was wrong.
  // Both seats were correct and the test was asking a question neither of
  // them could answer from their own branch: the entry and its allowlist
  // entry arrive together, and only on the branch that holds both.
  //
  // So the assertion is scoped to `HEAD`, which is the history this branch
  // is actually a claim about and the history that will be on `main` if it
  // merges. Entries that exist only on other refs are still reported,
  // because the information is worth having, but they are a diagnostic
  // addressed to whoever owns that branch rather than a red in a suite that
  // cannot fix them.
  test('nothing legitimate has ever lived at a root dot-entry outside the four', (t) => {
    const dotRoots = (args) => {
      const objects = execFileSync('git', ['-C', REPO, 'rev-list', ...args, '--objects'], {
        encoding: 'utf8',
        maxBuffer: 256 * 1024 * 1024,
      })
      const roots = new Set()
      for (const row of objects.split('\n')) {
        const path = row.slice(41)
        if (path.startsWith('.')) roots.add(path.split('/')[0])
      }
      return roots
    }
    const unexplainedIn = (roots) =>
      [...roots].filter((n) => !ALLOWLIST.includes(n) && !COMMITTED_SCRATCH.includes(n)).sort()

    let mine
    let everywhere
    try {
      mine = dotRoots(['HEAD'])
      everywhere = dotRoots(['--all'])
    } catch {
      t.skip('git rev-list would not answer here, so this claim is unmeasured rather than passing')
      return
    }
    if (execFileSync('git', ['-C', REPO, 'rev-parse', '--is-shallow-repository'], { encoding: 'utf8' }).trim() === 'true') {
      t.skip('shallow clone: the history behind this claim was never fetched, so it is unmeasured rather than passing')
      return
    }

    // Reported and not asserted on: another branch's entry, which this
    // branch cannot explain and must not fail over.
    const mineSet = new Set(mine)
    const elsewhereOnly = unexplainedIn(everywhere).filter((n) => !mineSet.has(n))
    if (elsewhereOnly.length) {
      t.diagnostic(
        `root dot-entries on other refs but not in this branch's history: ${elsewhereOnly.join(' ')}`
        + ' -- if one of those branches merges, the allowlist here has to name it, and that branch is where it belongs',
      )
    }

    assert.deepEqual(
      unexplainedIn(mine),
      [],
      "a root dot-entry in THIS BRANCH's history is neither on the allowlist nor in the pinned scratch list, so the inversion may have a false positive after all",
    )
  })
})

describe('this repository, live', () => {
  test('the real checkout passes its own gate', () => {
    const r = run(REPO)
    assert.equal(r.code, 0, `${r.stdout}${r.stderr}`)
    assert.match(r.stdout, /all of them on the 4-name allowlist/)
  })
})
