// node --test skills/relocate-anchors.test.mjs
//
// The strongest evidence for this tool is not here, because it needs the
// repository's full history: replaying the 2026-10-18 merge, the tool
// reproduces the hand-written relocation commit 53f86e7 byte for byte across
// all four skill files, and takes the checker from 43 failures to the exact 4
// a person read. That replay is recorded in this run's pull request. A fresh
// clone of this repository is shallow, so it cannot run.
//
// What is here is the part that holds without history: the offset arithmetic
// that makes a surgical rewrite possible, the match counting that decides
// mechanical from not, and one end-to-end pass over a throwaway git
// repository so `git show` is exercised for real rather than stubbed.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, copyFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { citedRanges, locate, fingerprint } from './relocate-anchors.mjs'

const skill = (evidence, body) => `---
name: fixture
description: a fixture
evidence:
${evidence}---

${body}
`

test('citedRanges points at the range text itself, not at the line', () => {
  const text = skill(`  - ref: E1
    what: two paths and three ranges on one line
    source: a/one.ts:5-9; a/two.ts:1,12-14
`, 'A claim [E1].')
  const found = citedRanges(text, 'fixture')
  assert.deepEqual(found.map((r) => `${r.path}:${r.part}`),
    ['a/one.ts:5-9', 'a/two.ts:1', 'a/two.ts:12-14'])
  // Every offset must land exactly on its own range text. This is the whole
  // reason the tool can rewrite `12-14` in `a/two.ts:1,12-14` without a regex
  // that would also match the `1,` before it.
  for (const r of found) assert.equal(text.slice(r.partAbs, r.partAbs + r.part.length), r.part)
  assert.deepEqual(found.map((r) => [r.from, r.to]), [[5, 9], [1, 1], [12, 14]])
  assert.deepEqual(found.map((r) => r.spanned), [true, false, true])
})

test('citedRanges keys match the lock format check-evidence.mjs writes', () => {
  const text = skill(`  - ref: E4
    what: a thing
    source: ursa-major/src/store.ts:11-13
`, 'A claim [E4].')
  assert.equal(citedRanges(text, 'distilling-a-tuning-record')[0].key,
    'distilling-a-tuning-record/E4/ursa-major/src/store.ts:11-13')
})

test('locate matches on trimmed lines, so reindentation is a move and not a change', () => {
  const now = ['a', '', '  const x = 1', '  return x', 'b']
  assert.deepEqual(locate(now, ['const x = 1', 'return x']), [3])
})

test('locate returns every match, because the count is the decision', () => {
  const now = ['x', 'const a = 1', 'y', 'const a = 1', 'z']
  assert.deepEqual(locate(now, ['const a = 1']), [2, 4])
  assert.deepEqual(locate(now, ['nothing like this']), [])
})

test('a relocated range fingerprints to the value the lock already held', () => {
  // The safety argument for carrying the fingerprint across instead of calling
  // --update. The match is over the same trimmed lines the hash is taken over,
  // so the new range's hash cannot differ from the old one's.
  const before = ['one', 'two', 'three']
  const after = ['header', 'header', 'one', 'two', 'three']
  const at = locate(after, before.slice(0, 2))
  assert.deepEqual(at, [3])
  assert.equal(fingerprint(after, 3, 4), fingerprint(before, 1, 2))
})

test('end to end: relocates on a unique match, refuses on two, reports a real change', () => {
  const dir = mkdtempSync(join(tmpdir(), 'relocate-'))
  const git = (...args) => execFileSync('git', args, { cwd: dir, encoding: 'utf8' })
  git('init', '-q', '-b', 'main')
  git('config', 'user.email', 'test@example.invalid')
  git('config', 'user.name', 'test')

  mkdirSync(join(dir, 'src'), { recursive: true })
  mkdirSync(join(dir, 'skills', 'fixture'), { recursive: true })
  copyFileSync(new URL('relocate-anchors.mjs', import.meta.url).pathname,
    join(dir, 'skills', 'relocate-anchors.mjs'))
  // The tool imports the shared source-line reader; copy it too.
  copyFileSync(new URL('source-line.mjs', import.meta.url).pathname,
    join(dir, 'skills', 'source-line.mjs'))

  // The old tree. E1 moves, E2's text will appear twice, E3's text will go.
  const old = ['moved alpha', 'moved beta', 'twice me', 'gone forever', 'tail']
  writeFileSync(join(dir, 'src', 'f.ts'), old.join('\n') + '\n')
  const skillText = skill(`  - ref: E1
    what: a block that moves
    source: src/f.ts:1-2
  - ref: E2
    what: a block that will match twice
    source: src/f.ts:3
  - ref: E3
    what: a block whose text is deleted
    source: src/f.ts:4
`, 'Claims [E1], [E2] and [E3].')
  writeFileSync(join(dir, 'skills', 'fixture', 'SKILL.md'), skillText)
  const lock = {
    'fixture/E1/src/f.ts:1-2': fingerprint(old, 1, 2),
    'fixture/E2/src/f.ts:3': fingerprint(old, 3, 3),
    'fixture/E3/src/f.ts:4': fingerprint(old, 4, 4),
  }
  writeFileSync(join(dir, 'skills', 'evidence.lock.json'),
    JSON.stringify(lock, Object.keys(lock).sort(), 2) + '\n')
  git('add', '-A')
  git('commit', '-q', '-m', 'old')
  const oldRef = git('rev-parse', 'HEAD').trim()

  // The new tree, as a merge would leave it.
  writeFileSync(join(dir, 'src', 'f.ts'),
    ['inserted', 'inserted', 'moved alpha', 'moved beta', 'twice me', 'rewritten', 'tail', 'twice me'].join('\n') + '\n')

  // The tool exits 1 while anything is still outstanding, which is the point
  // of it, so a non-zero status here is expected and the output is what matters.
  const run = (...extra) => {
    try {
      return execFileSync(process.execPath,
        [join(dir, 'skills', 'relocate-anchors.mjs'), oldRef, ...extra],
        { cwd: dir, encoding: 'utf8' })
    } catch (e) {
      assert.equal(e.status, 1, e.stderr)
      return e.stdout
    }
  }

  const dry = run()
  assert.match(dry, /1 relocated, text unchanged/)
  assert.match(dry, /1 text changed, needs a person/)
  assert.match(dry, /1 matched in more than one place/)
  assert.match(dry, /src\/f\.ts:1-2 -> 3-4/)
  assert.match(dry, /Nothing written/)
  // Dry run means dry run.
  assert.equal(readFileSync(join(dir, 'skills', 'fixture', 'SKILL.md'), 'utf8'), skillText)

  run('--write')
  const written = readFileSync(join(dir, 'skills', 'fixture', 'SKILL.md'), 'utf8')
  assert.match(written, /source: src\/f\.ts:3-4/)
  // The two that need a person are left exactly as they were.
  assert.match(written, /source: src\/f\.ts:3\n/)
  assert.match(written, /source: src\/f\.ts:4\n/)

  const after = JSON.parse(readFileSync(join(dir, 'skills', 'evidence.lock.json'), 'utf8'))
  assert.equal(after['fixture/E1/src/f.ts:3-4'], lock['fixture/E1/src/f.ts:1-2'])
  assert.ok(!('fixture/E1/src/f.ts:1-2' in after), 'the old key is dropped, not orphaned')
  assert.equal(after['fixture/E2/src/f.ts:3'], lock['fixture/E2/src/f.ts:3'])
  assert.equal(after['fixture/E3/src/f.ts:4'], lock['fixture/E3/src/f.ts:4'])
})

test('a wrong old-ref is reported as a wrong old-ref, not relocated anyway', () => {
  // The failure mode that cost this run twenty minutes: pointing the tool at a
  // plausible but wrong ref. It must say so rather than search a tree whose
  // lines were never the cited ones.
  const dir = mkdtempSync(join(tmpdir(), 'relocate-ref-'))
  const git = (...args) => execFileSync('git', args, { cwd: dir, encoding: 'utf8' })
  git('init', '-q', '-b', 'main')
  git('config', 'user.email', 'test@example.invalid')
  git('config', 'user.name', 'test')
  mkdirSync(join(dir, 'src'), { recursive: true })
  mkdirSync(join(dir, 'skills', 'fixture'), { recursive: true })
  copyFileSync(new URL('relocate-anchors.mjs', import.meta.url).pathname,
    join(dir, 'skills', 'relocate-anchors.mjs'))
  // The tool imports the shared source-line reader; copy it too.
  copyFileSync(new URL('source-line.mjs', import.meta.url).pathname,
    join(dir, 'skills', 'source-line.mjs'))
  writeFileSync(join(dir, 'src', 'f.ts'), 'unrelated\nunrelated\n')
  writeFileSync(join(dir, 'skills', 'fixture', 'SKILL.md'), skill(`  - ref: E1
    what: a thing
    source: src/f.ts:1
`, 'A claim [E1].'))
  writeFileSync(join(dir, 'skills', 'evidence.lock.json'),
    JSON.stringify({ 'fixture/E1/src/f.ts:1': 'deadbeefdeadbeef' }, null, 2) + '\n')
  git('add', '-A')
  git('commit', '-q', '-m', 'only commit')
  const ref = git('rev-parse', 'HEAD').trim()

  let out = ''
  try {
    out = execFileSync(process.execPath,
      [join(dir, 'skills', 'relocate-anchors.mjs'), ref],
      { cwd: dir, encoding: 'utf8' })
  } catch (e) { out = e.stdout }
  assert.match(out, /do not match the recorded fingerprint/)
  assert.match(out, /0 relocated/)
})

test('a chain, where one range relocates onto the key another is vacating', () => {
  // Measured on 2026-10-24. E8 of running-an-outcome-record-trial cited
  // ursa.ts:494 and :515; main inserted 21 lines above both; 494's
  // destination was 515, which the lock still held under the other range's
  // fingerprint. The collision test ran inside the classification loop, so it
  // fired against an occupant that the same loop was about to move out, and a
  // pure relocation was filed as text that changed. One of three ranges in
  // that batch's reader queue was this artifact, and the read it cost found
  // the two fingerprints identical.
  //
  // The second half is the write: delete every old key before writing any new
  // one, or the vacating range's delete erases what the arriving one wrote and
  // the surviving fingerprint depends on iteration order.
  const dir = mkdtempSync(join(tmpdir(), 'relocate-chain-'))
  const git = (...args) => execFileSync('git', args, { cwd: dir, encoding: 'utf8' })
  git('init', '-q', '-b', 'main')
  git('config', 'user.email', 'test@example.invalid')
  git('config', 'user.name', 'test')
  mkdirSync(join(dir, 'src'), { recursive: true })
  mkdirSync(join(dir, 'skills', 'fixture'), { recursive: true })
  for (const f of ['relocate-anchors.mjs', 'source-line.mjs'])
    copyFileSync(new URL(f, import.meta.url).pathname, join(dir, 'skills', f))

  // One ref, two cited lines, two apart. Inserting two lines above both sends
  // line 1 to 3, which is where line 3 is now.
  const old = ['first cited', 'filler', 'second cited']
  writeFileSync(join(dir, 'src', 'f.ts'), old.join('\n') + '\n')
  writeFileSync(join(dir, 'skills', 'fixture', 'SKILL.md'), skill(`  - ref: E1
    what: two lines of one claim, two apart
    source: src/f.ts:1; src/f.ts:3
`, 'A claim [E1].'))
  const lock = {
    'fixture/E1/src/f.ts:1': fingerprint(old, 1, 1),
    'fixture/E1/src/f.ts:3': fingerprint(old, 3, 3),
  }
  assert.notEqual(lock['fixture/E1/src/f.ts:1'], lock['fixture/E1/src/f.ts:3'])
  writeFileSync(join(dir, 'skills', 'evidence.lock.json'),
    JSON.stringify(lock, Object.keys(lock).sort(), 2) + '\n')
  git('add', '-A')
  git('commit', '-q', '-m', 'old')
  const oldRef = git('rev-parse', 'HEAD').trim()

  writeFileSync(join(dir, 'src', 'f.ts'),
    ['inserted', 'inserted', 'first cited', 'filler', 'second cited'].join('\n') + '\n')

  // A dry run exits 1 while anything is drifted, so the status is not the
  // assertion here; --write exits 0 once nothing is left for a person.
  const run = (...extra) => {
    try {
      return execFileSync(process.execPath,
        [join(dir, 'skills', 'relocate-anchors.mjs'), oldRef, ...extra],
        { cwd: dir, encoding: 'utf8' })
    } catch (e) {
      assert.equal(e.status, 1, e.stderr)
      return e.stdout
    }
  }

  const dry = run()
  assert.match(dry, /2 relocated, text unchanged/)
  assert.match(dry, /0 text changed, needs a person/)
  assert.match(dry, /src\/f\.ts:1 -> 3/)
  assert.match(dry, /src\/f\.ts:3 -> 5/)

  run('--write')
  assert.match(readFileSync(join(dir, 'skills', 'fixture', 'SKILL.md'), 'utf8'),
    /source: src\/f\.ts:3; src\/f\.ts:5\n/)
  const after = JSON.parse(readFileSync(join(dir, 'skills', 'evidence.lock.json'), 'utf8'))
  // Both keys present with the right values. The ordering bug dropped one of
  // the two entirely, which check-evidence then reported as a citation with no
  // recorded fingerprint, the same state an unread new ref is in.
  assert.deepEqual(Object.keys(after).sort(), ['fixture/E1/src/f.ts:3', 'fixture/E1/src/f.ts:5'])
  assert.equal(after['fixture/E1/src/f.ts:3'], lock['fixture/E1/src/f.ts:1'])
  assert.equal(after['fixture/E1/src/f.ts:5'], lock['fixture/E1/src/f.ts:3'])
})

test('two ranges of one ref relocating onto the same key still needs a person', () => {
  // The vacancy rule must not swallow a genuine conflict. Two cited lines whose
  // text became identical have one destination between them, and no vacancy
  // explains that, so it goes to a reader rather than silently losing one.
  const dir = mkdtempSync(join(tmpdir(), 'relocate-conflict-'))
  const git = (...args) => execFileSync('git', args, { cwd: dir, encoding: 'utf8' })
  git('init', '-q', '-b', 'main')
  git('config', 'user.email', 'test@example.invalid')
  git('config', 'user.name', 'test')
  mkdirSync(join(dir, 'src'), { recursive: true })
  mkdirSync(join(dir, 'skills', 'fixture'), { recursive: true })
  for (const f of ['relocate-anchors.mjs', 'source-line.mjs'])
    copyFileSync(new URL(f, import.meta.url).pathname, join(dir, 'skills', f))

  const old = ['alpha', 'beta']
  writeFileSync(join(dir, 'src', 'f.ts'), old.join('\n') + '\n')
  writeFileSync(join(dir, 'skills', 'fixture', 'SKILL.md'), skill(`  - ref: E1
    what: two lines that become one
    source: src/f.ts:1; src/f.ts:2
`, 'A claim [E1].'))
  const lock = {
    'fixture/E1/src/f.ts:1': fingerprint(old, 1, 1),
    'fixture/E1/src/f.ts:2': fingerprint(old, 2, 2),
  }
  writeFileSync(join(dir, 'skills', 'evidence.lock.json'),
    JSON.stringify(lock, Object.keys(lock).sort(), 2) + '\n')
  git('add', '-A')
  git('commit', '-q', '-m', 'old')
  const oldRef = git('rev-parse', 'HEAD').trim()

  // `beta` is gone and `alpha` moved to 2. So E1's line 1 relocates to 2,
  // which E1's line 2 occupies and is not vacating, because its own text is
  // nowhere to be found.
  writeFileSync(join(dir, 'src', 'f.ts'), ['header', 'alpha'].join('\n') + '\n')

  let out = ''
  try {
    out = execFileSync(process.execPath,
      [join(dir, 'skills', 'relocate-anchors.mjs'), oldRef], { cwd: dir, encoding: 'utf8' })
  } catch (e) { assert.equal(e.status, 1); out = e.stdout }
  assert.match(out, /0 relocated/)
  assert.match(out, /2 text changed, needs a person/)
  assert.match(out, /would collide with another citation's fingerprint/)
})
