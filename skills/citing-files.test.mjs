// node --test skills/citing-files.test.mjs
//
// This file exists because of a hole the 2026-11-09 mutation survey found by
// counting: `citing-files.mjs` was the one module under skills/ with no suite
// of its own, and it is shared by three gates, so every decision in it was
// defended only by whatever a consumer's tests happened to exercise. The
// survey's cross-suite pass then measured which of its eight decisions any
// suite in the library noticed. The results are in skills/mutation-audit.md.
//
// The tests are written against those eight decisions rather than against the
// exported surface, which is why the names read as consequences and not as
// function names. Each one was confirmed to fail with its decision inverted
// and to pass with it intact; `skills/mutation-audit.md` says what each
// inversion was.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import {
  stripFrontmatter, declaredRefs, refsIn, citingTexts, strayCitations,
} from './citing-files.mjs'

const FM = [
  '---',
  'version: 0.1.0',
  'evidence:',
  '  - ref: E1',
  '    what: the first claim',
  '    source: alpha.ts:1-3',
  '  - ref: E2',
  '    what: the second claim',
  '    source: beta.ts:9',
  '---',
  '',
].join('\n')

/** A skill directory holding whatever each entry describes. A value that is an
 *  object is a subdirectory, so a nested tree is one literal. */
function skillDir(tree) {
  const dir = mkdtempSync(join(tmpdir(), 'citing-files-'))
  const write = (at, node) => {
    for (const [name, body] of Object.entries(node)) {
      if (typeof body === 'object') { mkdirSync(join(at, name), { recursive: true }); write(join(at, name), body) }
      else writeFileSync(join(at, name), body)
    }
  }
  write(dir, tree)
  return dir
}

// --- the evidence table is read out of frontmatter, and only out of it -------

test('a declared ref is returned when the frontmatter is present, not when it is absent', () => {
  // Inverting line 56 makes the present case return nothing, which is the
  // reading every consumer does on every skill in the library.
  const declared = declaredRefs(FM + 'body cites [E1]\n')
  assert.deepEqual(declared.map((d) => d.ref), ['E1', 'E2'])
  assert.equal(declared[0].sourceLine, 'alpha.ts:1-3')
  assert.deepEqual(declaredRefs('no frontmatter here, only [E1]\n'), [])
})

test('declaration order is table order, because the Refs column is compared against it', () => {
  assert.deepEqual(declaredRefs(FM).map((d) => d.ref), ['E1', 'E2'])
})

test('a bracketed ref inside a what field is a declaration and never a citation', () => {
  const text = FM + 'the body cites nothing\n'
  assert.deepEqual(refsIn(stripFrontmatter(text)), [])
})

// --- which files in the directory count -------------------------------------

test('SKILL.md comes first and every other markdown file follows it in name order', () => {
  // Inverting line 84 collapses the list to SKILL.md twice and drops the rest,
  // so a tag in TRIGGER-TEST.md stops being a receipt again.
  const dir = skillDir({
    'SKILL.md': FM + 'body\n',
    'TRIGGER-TEST.md': 'the trigger test cites [E2]\n',
    'NOTES.md': 'notes cite [E1]\n',
  })
  assert.deepEqual(citingTexts(dir).map((t) => t.file), ['SKILL.md', 'NOTES.md', 'TRIGGER-TEST.md'])
})

test('frontmatter is stripped from SKILL.md and from nothing else', () => {
  // Inverting line 88 strips it from the other files instead, which silently
  // deletes the top of any file whose first line is a fence.
  const dir = skillDir({ 'SKILL.md': FM + 'body cites [E1]\n', 'TRIGGER-TEST.md': FM + 'trigger cites [E2]\n' })
  const [skill, trigger] = citingTexts(dir)
  assert.equal(skill.text, 'body cites [E1]\n')
  assert.equal(trigger.text, FM + 'trigger cites [E2]\n')
})

test('a subdirectory whose name ends in .md is not a citing file', () => {
  // Inverting line 82 admits it, and the read that follows throws EISDIR, so
  // the whole gate dies on a directory nobody thought was a file.
  const dir = skillDir({ 'SKILL.md': FM + 'body\n', 'fixtures.md': { 'inner.txt': 'x\n' } })
  assert.deepEqual(citingTexts(dir).map((t) => t.file), ['SKILL.md'])
})

test('a directory with no SKILL.md still yields its other markdown files', () => {
  const dir = skillDir({ 'NOTES.md': 'notes cite [E1]\n' })
  assert.deepEqual(citingTexts(dir).map((t) => t.file), ['NOTES.md'])
})

// --- tags sitting where no gate would ever read them ------------------------

test('a tag in a non-markdown file beside the skill is reported', () => {
  // Inverting line 105 skips every file, so strayCitations reports nothing at
  // all and the residual defect it exists to name becomes invisible.
  const dir = skillDir({ 'SKILL.md': FM + 'body\n', 'record.json': '{"note": "see [E1]"}\n' })
  assert.deepEqual(strayCitations(dir), [{ file: 'record.json', refs: ['E1'] }])
})

test('a markdown file is never a stray, because a gate already reads it', () => {
  const dir = skillDir({ 'SKILL.md': FM + 'body\n', 'TRIGGER-TEST.md': 'cites [E1]\n' })
  assert.deepEqual(strayCitations(dir), [])
})

test('a tag one directory down is reported under a path, not a bare name', () => {
  // Inverting line 106 recurses into files and reads directories, so this
  // case reports nothing.
  const dir = skillDir({ 'SKILL.md': FM + 'body\n', fixtures: { 'a.txt': 'cites [E1]\n' } })
  assert.deepEqual(strayCitations(dir), [{ file: 'fixtures/a.txt', refs: ['E1'] }])
})

test('a tag two directories down keeps both path segments', () => {
  // Line 123 is line 106's decision inside the recursion, and only a tree
  // this deep tells the two apart.
  const dir = skillDir({ 'SKILL.md': FM + 'body\n', fixtures: { real: { 'b.txt': 'cites [E2]\n' } } })
  assert.deepEqual(strayCitations(dir), [{ file: 'fixtures/real/b.txt', refs: ['E2'] }])
})

test('a stray file at exactly the scan ceiling is still scanned', () => {
  // The ceiling is 512 KiB and the comparison is `>`, so a file of exactly
  // that size is data by one byte or prose by one byte depending on one
  // character. Only a file of exactly 524288 bytes separates them.
  const CEILING = 512 * 1024
  const tag = 'cites [E1]\n'
  const dir = skillDir({ 'SKILL.md': FM + 'body\n', 'big.txt': tag + 'x'.repeat(CEILING - tag.length) })
  assert.deepEqual(strayCitations(dir), [{ file: 'big.txt', refs: ['E1'] }])
})

test('a stray file one byte over the ceiling is not scanned', () => {
  const CEILING = 512 * 1024
  const tag = 'cites [E1]\n'
  const dir = skillDir({ 'SKILL.md': FM + 'body\n', 'big.txt': tag + 'x'.repeat(CEILING + 1 - tag.length) })
  assert.deepEqual(strayCitations(dir), [])
})

// --- reading the tags themselves --------------------------------------------

test('one bracket holding several refs cites all of them', () => {
  assert.deepEqual(refsIn('as shown [E3, E7] and again [E9]'), ['E3', 'E7', 'E9'])
})

test('a bracket that is not a ref cites nothing', () => {
  assert.deepEqual(refsIn('[E] [3] [EE1] [] [e1]'), [])
})

test('a stray file citing one ref twice reports it once', () => {
  const dir = skillDir({ 'SKILL.md': FM + 'body\n', 'n.txt': 'cites [E1] and [E1] again\n' })
  assert.deepEqual(strayCitations(dir), [{ file: 'n.txt', refs: ['E1'] }])
})
