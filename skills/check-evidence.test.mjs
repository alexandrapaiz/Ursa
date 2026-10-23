// node --test skills/check-evidence.test.mjs
//
// Covers the 2026-10-18 change to `--update` and nothing else, because that is
// the part with a demonstrated failure behind it: before this change, one bare
// `--update` took the real library from 43 drifted ranges to a green checker
// with nobody reading anything and a zero exit status, which is the same shape
// as the 2026-10-08 incident the lock was built to prevent.
//
// Each test builds a throwaway two-skill library in a temp directory and runs
// the real script against it, so the frontmatter parsing and the lock file
// round-trip are exercised rather than described.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, copyFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

/** The fingerprint the real script writes: the cited lines trimmed, hashed. */
const hash = (text) => createHash('sha256').update(text).digest('hex').slice(0, 16)

const CHECKER = new URL('check-evidence.mjs', import.meta.url).pathname
// The checker imports these; a temp library has to carry them too.
const IMPORTS = ['source-line.mjs', 'citing-files.mjs']
  .map((f) => new URL(f, import.meta.url).pathname)

/** A library with two skills, each citing one line of its own file, and a lock
 *  recording fingerprints for both. `drift` names the skills whose cited line
 *  is changed afterwards, so their recorded fingerprint no longer matches. */
function library(drift = []) {
  const dir = mkdtempSync(join(tmpdir(), 'check-evidence-'))
  mkdirSync(join(dir, 'src'), { recursive: true })
  mkdirSync(join(dir, 'skills'), { recursive: true })
  copyFileSync(CHECKER, join(dir, 'skills', 'check-evidence.mjs'))
  for (const f of IMPORTS) copyFileSync(f, join(dir, 'skills', f.split('/').pop()))
  const lock = {}
  for (const slug of ['alpha', 'beta']) {
    mkdirSync(join(dir, 'skills', slug), { recursive: true })
    writeFileSync(join(dir, 'src', `${slug}.ts`), `the cited line of ${slug}\nfiller\n`)
    writeFileSync(join(dir, 'skills', slug, 'SKILL.md'), `---
name: ${slug}
description: a fixture
evidence:
  - ref: E1
    what: the cited line
    source: src/${slug}.ts:1
---

A claim [E1].
`)
    lock[`${slug}/E1/src/${slug}.ts:1`] = hash(`the cited line of ${slug}`)
  }
  writeFileSync(join(dir, 'skills', 'evidence.lock.json'),
    JSON.stringify(lock, Object.keys(lock).sort(), 2) + '\n')
  for (const slug of drift)
    writeFileSync(join(dir, 'src', `${slug}.ts`), `a different line of ${slug}\nfiller\n`)
  return { dir, lock }
}

const run = (dir, ...args) => {
  try {
    return { status: 0, out: execFileSync(process.execPath, [join(dir, 'skills', 'check-evidence.mjs'), ...args], { cwd: dir, encoding: 'utf8' }) }
  } catch (e) {
    return { status: e.status, out: (e.stdout ?? '') + (e.stderr ?? '') }
  }
}

const lockOf = (dir) => JSON.parse(readFileSync(join(dir, 'skills', 'evidence.lock.json'), 'utf8'))

test('a bare --update over a drifted library refuses and writes nothing', () => {
  const { dir, lock } = library(['alpha'])
  assert.equal(run(dir).status, 1)
  const refused = run(dir, '--update')
  assert.equal(refused.status, 2)
  assert.match(refused.out, /refusing to --update/)
  assert.match(refused.out, /alpha\/E1\/src\/alpha\.ts:1/)
  assert.match(refused.out, /relocate-anchors\.mjs/)
  assert.deepEqual(lockOf(dir), lock, 'the lock is untouched by a refusal')
})

test('a bare --update over a clean library still records everything', () => {
  // The ordinary authoring path, which this change must not disturb.
  const { dir, lock } = library()
  assert.equal(run(dir).status, 0)
  const updated = run(dir, '--update')
  assert.equal(updated.status, 0)
  assert.match(updated.out, /fingerprints recorded: 2 ranges/)
  assert.deepEqual(lockOf(dir), lock)
})

test('a scoped --update records what was named and leaves the rest red', () => {
  const { dir, lock } = library(['alpha', 'beta'])
  const updated = run(dir, '--update', 'alpha')
  assert.equal(updated.status, 0)
  assert.match(updated.out, /left drifted on purpose/)
  assert.match(updated.out, /beta\/E1\/src\/beta\.ts:1/)
  const after = lockOf(dir)
  assert.notEqual(after['alpha/E1/src/alpha.ts:1'], lock['alpha/E1/src/alpha.ts:1'],
    'the named skill was re-recorded')
  assert.equal(after['beta/E1/src/beta.ts:1'], lock['beta/E1/src/beta.ts:1'],
    'the unnamed skill kept the fingerprint it had, so it stays red')
  // And the checker agrees: one range still failing, the one nobody named.
  const re = run(dir)
  assert.equal(re.status, 1)
  assert.match(re.out, /evidence check FAILED \(1, 1 of them drifted\)/)
  assert.match(re.out, /beta E1/)
})

test('a scope can be a whole lock key, not only a skill slug', () => {
  const { dir, lock } = library(['alpha', 'beta'])
  const updated = run(dir, '--update', 'alpha/E1/src/alpha.ts:1')
  assert.equal(updated.status, 0)
  const after = lockOf(dir)
  assert.notEqual(after['alpha/E1/src/alpha.ts:1'], lock['alpha/E1/src/alpha.ts:1'])
  assert.equal(after['beta/E1/src/beta.ts:1'], lock['beta/E1/src/beta.ts:1'])
})

test('a scope that names nothing drifted is not a way around the refusal', () => {
  // Naming the clean skill must not license re-recording the drifted one.
  const { dir, lock } = library(['alpha'])
  const updated = run(dir, '--update', 'beta')
  assert.equal(updated.status, 0)
  assert.equal(lockOf(dir)['alpha/E1/src/alpha.ts:1'], lock['alpha/E1/src/alpha.ts:1'])
  assert.equal(run(dir).status, 1)
})

test('an --update that records anything says a re-read is owed', () => {
  // The failure this guards, from prompts/skill-extract.md §5o: when cited
  // lines change the checker goes red, and --update is the command that clears
  // the red. The relevance verdict was given to the old lines, so clearing the
  // red erases the only visible sign that a claim needs reading again. The
  // reading half is a different file and nobody runs a tool they do not know
  // about, so the command that hides the signal is the one that has to name it.
  const { dir } = library(['alpha'])
  const updated = run(dir, '--update', 'alpha')
  assert.equal(updated.status, 0)
  assert.match(updated.out, /A re-recorded range is a claim somebody has to read again/)
  assert.match(updated.out, /relevance-sweep\.mjs --stale/)
  assert.match(updated.out, /relevance-sweep\.mjs --record/)
  // And a refusal does not print it, because nothing was recorded and nothing
  // is owed yet.
  const refused = run(library(['alpha']).dir, '--update')
  assert.equal(refused.status, 2)
  assert.doesNotMatch(refused.out, /has to read again/)
})

// The 2026-10-23 widening: a citation lives in any markdown file of a skill
// directory, not only in SKILL.md. Before it, the ten `[E…]` tags in the first
// draft of one TRIGGER-TEST.md were invisible to this checker and to the
// relevance sweep, and both exited 0 over all ten, which is a receipt nothing
// fingerprints. skills/citing-files.mjs carries the account.

/** Write a sibling file into one skill's directory. */
const sibling = (dir, slug, name, text) =>
  writeFileSync(join(dir, 'skills', slug, name), text)

test('a trigger test citing an undeclared ref fails, and says which file', () => {
  const { dir } = library()
  sibling(dir, 'alpha', 'TRIGGER-TEST.md', 'Near miss 1 turns on the threshold [E9].\n')
  const out = run(dir)
  assert.equal(out.status, 1)
  assert.match(out.out, /alpha: TRIGGER-TEST\.md cites E9, not declared/)
})

test('a ref cited only in a trigger test counts as cited and is still fingerprinted', () => {
  // The other direction of the same rule. An uncited ref fails deliberately,
  // since it is a receipt for a claim the skill does not make, and a claim
  // made in the activation test is a claim the skill makes.
  const { dir } = library()
  const skill = join(dir, 'skills', 'alpha', 'SKILL.md')
  writeFileSync(skill, readFileSync(skill, 'utf8')
    .replace('A claim [E1].', 'A claim with no tag on it.'))
  const without = run(dir)
  assert.equal(without.status, 1)
  assert.match(without.out, /alpha: E1 declared but never cited/)
  sibling(dir, 'alpha', 'TRIGGER-TEST.md', 'Prompt 1 asks about the cited line [E1].\n')
  const withIt = run(dir)
  assert.equal(withIt.status, 0)
  // And the fingerprint is unaffected either way: it follows the declaration
  // in the frontmatter, not the file the citation sits in.
  assert.ok('alpha/E1/src/alpha.ts:1' in lockOf(dir))
})

test('a tag in a file no tool reads is reported rather than counted', () => {
  // The residual the widening leaves: `.md` is now read, and a tag in a
  // fixture or a note beside it would be exactly as green and exactly as
  // empty. Two shapes, a sibling file and one nested a directory down.
  const { dir } = library()
  sibling(dir, 'alpha', 'notes.txt', 'the reasoning for prompt 2 [E1]\n')
  mkdirSync(join(dir, 'skills', 'alpha', 'cases'), { recursive: true })
  writeFileSync(join(dir, 'skills', 'alpha', 'cases', 'one.json'), '{"why": "[E1]"}\n')
  const out = run(dir)
  assert.equal(out.status, 1)
  assert.match(out.out, /alpha: notes\.txt cites E1, and nothing reads that file/)
  assert.match(out.out, /alpha: cases\/one\.json cites E1, and nothing reads that file/)
})

test('a skill directory with no stray tags is unaffected', () => {
  // The ordinary case, asserted so the stray scan cannot start charging the
  // library for files that cite nothing.
  const { dir } = library()
  sibling(dir, 'alpha', 'TRIGGER-TEST.md', 'Five prompts, reasoning per prompt.\n')
  sibling(dir, 'alpha', 'notes.txt', 'no tags here\n')
  assert.equal(run(dir).status, 0)
})
