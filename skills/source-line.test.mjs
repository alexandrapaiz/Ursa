// node --test skills/source-line.test.mjs
//
// Covers the two faults the 2026-10-18 relevance sweep found in the pattern
// that read every `source:` line in the library, and the behaviours that had
// to survive fixing them. Both faults were silent: a path the pattern cannot
// see produces no error, only a citation nothing checks.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { sourcePaths, ranges } from './source-line.mjs'

test('a dotfile citation is a path, not nothing at all', () => {
  // distilling-a-tuning-record/E32 cites .gitignore:8-9. Under the old
  // four-extension allowlist it matched nothing, so the checker reported the
  // library green while that citation had no fingerprint and no bounds check.
  assert.deepEqual(sourcePaths('.gitignore:8-9'), [{ path: '.gitignore', ranges: '8-9' }])
})

test('a .tsx path is not truncated to a .ts path that does not exist', () => {
  // The old pattern tried `.ts` against `.tsx` with no right boundary, so it
  // produced the path `foo.ts` and dropped the range entirely: it would have
  // fingerprinted a different file, or called a file missing that is there.
  assert.deepEqual(sourcePaths('ursa-major/src/foo.tsx:1-3'),
    [{ path: 'ursa-major/src/foo.tsx', ranges: '1-3' }])
})

test('prose in a source line is not mistaken for a path', () => {
  // Why the pattern is still an allowlist rather than any dotted token: the
  // thresholds 0.35 and 0.6 appear in this library's own `what` fields, and a
  // generic matcher reports them as missing files.
  assert.deepEqual(sourcePaths('the two thresholds, 0.35 and 0.6, and the score'), [])
  assert.deepEqual(sourcePaths('CLAUDE.md, section 1, span classifications'),
    [{ path: 'CLAUDE.md', ranges: undefined }])
})

test('one source line holds several paths, and one path several ranges', () => {
  // The reason this scans instead of splitting on commas: a comma separates
  // two paths and also two ranges of one path, and splitting first dropped
  // every range after the first.
  assert.deepEqual(sourcePaths('ursa-major/src/cli.ts:175, ursa-major/src/viewer.ts:570,580'), [
    { path: 'ursa-major/src/cli.ts', ranges: '175,' },
    { path: 'ursa-major/src/viewer.ts', ranges: '570,580' },
  ])
})

test('a range string yields only well-formed ranges', () => {
  assert.deepEqual(ranges('570,580').map((r) => [r.from, r.to]), [[570, 570], [580, 580]])
  assert.deepEqual(ranges('5-13,37').map((r) => [r.from, r.to]), [[5, 13], [37, 37]])
  // Number('') is 0 rather than NaN, so a trailing comma used to invent line 0.
  assert.deepEqual(ranges('175,').map((r) => [r.from, r.to]), [[175, 175]])
  assert.deepEqual(ranges(undefined), [])
})

test('a hyphenated path keeps its hyphens and its date-shaped name', () => {
  assert.deepEqual(sourcePaths('docs/okrs/2026-q4.md, O1 KR1.1'),
    [{ path: 'docs/okrs/2026-q4.md', ranges: undefined }])
})
