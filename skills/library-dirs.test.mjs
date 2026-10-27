// node --test skills/library-dirs.test.mjs
//
// Covers the hole measured on 2026-10-26 and nothing else: a directory under
// skills/ that every guard in this library skipped in silence. The end-to-end
// case at the bottom is the one that matters, because the unit tests here
// would all have passed on the day the hole existed — the defect was never in
// a predicate, it was in the fact that no caller asked.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, writeFileSync, copyFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { readLibraryDirs, unreadDirs, indexedRows } from './library-dirs.mjs'

const FRONTMATTER = '---\nversion: 0.1.0\nstatus: draft\nvalidated: false\n---\n'

/** A skills/ directory holding whatever each entry of `dirs` describes. */
function library(dirs) {
  const dir = mkdtempSync(join(tmpdir(), 'library-dirs-'))
  for (const [slug, files] of Object.entries(dirs)) {
    mkdirSync(join(dir, slug), { recursive: true })
    for (const [name, body] of Object.entries(files)) writeFileSync(join(dir, slug, name), body)
  }
  return dir
}

test('a directory holding both files §2 requires is a member and is not reported', () => {
  const dir = library({ alpha: { 'SKILL.md': FRONTMATTER + 'body\n', 'TRIGGER-TEST.md': 'x\n' } })
  const [d] = readLibraryDirs(dir)
  assert.equal(d.slug, 'alpha')
  assert.equal(d.hasSkill, true)
  assert.equal(d.hasTrigger, true)
  assert.deepEqual(unreadDirs(dir), [])
})

test('the misnamed file is reported, and named, so the fix is one rename', () => {
  const dir = library({ beta: { 'SKILLS.md': FRONTMATTER + 'cites [E1]\n' } })
  const [d] = unreadDirs(dir)
  assert.equal(d.slug, 'beta')
  assert.equal(d.nearMiss, 'SKILLS.md')
  assert.equal(d.frontmatter, true)
})

test('case alone counts as the near miss, because the filesystem here is case-sensitive', () => {
  const dir = library({ gamma: { 'skill.md': FRONTMATTER + 'body\n' } })
  assert.equal(unreadDirs(dir)[0].nearMiss, 'skill.md')
})

test('a directory with frontmatter but no near miss is still reported, more quietly', () => {
  const dir = library({ delta: { 'notes.md': FRONTMATTER + 'body\n' } })
  const [d] = unreadDirs(dir)
  assert.equal(d.nearMiss, null)
  assert.equal(d.frontmatter, true)
})

test('a plain directory trips neither signal and is reported with both false', () => {
  const dir = library({ fixtures: { 'record.json': '{}\n' } })
  const [d] = unreadDirs(dir)
  assert.equal(d.nearMiss, null)
  assert.equal(d.frontmatter, false)
  assert.deepEqual(d.names, ['record.json'])
})

test('a missing TRIGGER-TEST.md is not this check, so unreadDirs stays quiet about it', () => {
  // trigger-coverage.mjs already reports that one by name. Reporting it twice
  // in different words is how two guards start disagreeing about one rule.
  const dir = library({ eps: { 'SKILL.md': FRONTMATTER + 'body\n' } })
  assert.deepEqual(unreadDirs(dir), [])
  assert.equal(readLibraryDirs(dir)[0].hasTrigger, false)
})

test('indexedRows returns the label, the target and the stated ref count separately', () => {
  const rows = indexedRows([
    '| Skill | What | Refs | Status |',
    '|---|---|---|---|',
    '| [alpha](alpha/SKILL.md) | decides a thing | 12 | draft |',
    '| [beta](betaa/SKILL.md) | typo in the target | 7 | draft |',
    'prose mentioning [gamma](gamma/SKILL.md) outside a table row',
  ].join('\n'))
  assert.deepEqual(rows, [
    { label: 'alpha', dir: 'alpha', refs: 12 },
    { label: 'beta', dir: 'betaa', refs: 7 },
  ])
})

test('a row with no ref count reads as null and not as zero', () => {
  // The two have to stay distinguishable: zero refs is a skill with no
  // receipts, which is a defect, and an absent cell is a table shaped some
  // other way, which is a different one. Collapsing them would make the
  // narrower index of this test's own first version report ten skills with no
  // evidence at all.
  const rows = indexedRows([
    '| Skill | What |',
    '|---|---|',
    '| [alpha](alpha/SKILL.md) | decides a thing |',
    '| [beta](beta/SKILL.md) | decides another | not a number | draft |',
  ].join('\n'))
  assert.deepEqual(rows.map((r) => r.refs), [null, null])
})

test('check-evidence.mjs exits 1 on a library whose skill file is misnamed', () => {
  // The regression that matters. Before 2026-10-26 this exited 0 and printed
  // "sources resolved", with the citation in the misnamed file counted nowhere.
  const root = mkdtempSync(join(tmpdir(), 'library-dirs-e2e-'))
  mkdirSync(join(root, 'skills', 'alpha'), { recursive: true })
  mkdirSync(join(root, 'skills', 'decoy'), { recursive: true })
  mkdirSync(join(root, 'src'), { recursive: true })
  for (const f of ['check-evidence.mjs', 'source-line.mjs', 'citing-files.mjs', 'library-dirs.mjs'])
    copyFileSync(new URL(f, import.meta.url).pathname, join(root, 'skills', f))
  writeFileSync(join(root, 'src', 'a.ts'), 'the cited line\nfiller\n')
  writeFileSync(join(root, 'skills', 'alpha', 'SKILL.md'),
    '---\nprovenance:\n  - ref: E1\n    source: src/a.ts:1-1\n---\nbody citing [E1]\n')
  writeFileSync(join(root, 'skills', 'decoy', 'SKILLS.md'),
    '---\nprovenance:\n  - ref: E1\n    source: src/a.ts:1-1\n---\nbody citing [E1]\n')
  writeFileSync(join(root, 'skills', 'evidence.lock.json'), '{}\n')

  const run = () => {
    try {
      const stdout = execFileSync('node', [join(root, 'skills', 'check-evidence.mjs')],
        { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] })
      return { code: 0, out: stdout }
    } catch (e) {
      return { code: e.status, out: (e.stdout ?? '') + (e.stderr ?? '') }
    }
  }
  const { code, out } = run()
  assert.equal(code, 1)
  assert.match(out, /decoy: holds SKILLS\.md and no SKILL\.md/)
})
