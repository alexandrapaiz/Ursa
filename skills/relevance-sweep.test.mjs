// node --test skills/relevance-sweep.test.mjs
//
// The sweep's job is to gather and to remember. Gathering is checkable: the
// dossier has to carry the cited lines themselves, since the whole point is
// that a reader judges the range rather than the claim about it. Remembering
// is the part that makes the sweep resumable across runs, and the part that
// fails quietly if the audit file stops parsing, so it is tested here against
// a real library in a temp directory rather than described.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, writeFileSync, copyFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const here = (f) => new URL(f, import.meta.url).pathname

/** A two-ref library: E1's claim is checkable from its range, E2's is not. */
function library({ audit } = {}) {
  const dir = mkdtempSync(join(tmpdir(), 'relevance-sweep-'))
  mkdirSync(join(dir, 'src'), { recursive: true })
  mkdirSync(join(dir, 'skills', 'alpha'), { recursive: true })
  copyFileSync(here('relevance-sweep.mjs'), join(dir, 'skills', 'relevance-sweep.mjs'))
  copyFileSync(here('source-line.mjs'), join(dir, 'skills', 'source-line.mjs'))
  writeFileSync(join(dir, 'src', 'a.ts'), [
    'export const THRESHOLD = 0.6',          // 1
    'function unrelated() { return 1 }',     // 2
    'const covered = total - skipped',       // 3
  ].join('\n') + '\n')
  writeFileSync(join(dir, 'skills', 'alpha', 'SKILL.md'), `---
name: alpha
description: a fixture
evidence:
  - ref: E1
    what: the threshold constant is 0.6
    source: src/a.ts:1
  - ref: E2
    what: covered excludes skipped text
    source: src/a.ts:3
supersedes: []
---

# Alpha

The threshold is 0.6 [E1] and covered text excludes what was skipped [E2].
`)
  if (audit) writeFileSync(join(dir, 'skills', 'relevance-audit.md'), audit)
  return dir
}

const run = (dir, args = []) =>
  execFileSync('node', [join(dir, 'skills', 'relevance-sweep.mjs'), ...args], { encoding: 'utf8' })

test('the dossier carries the cited lines, not just the claim about them', () => {
  const out = run(library(), ['alpha/E1'])
  assert.match(out, /export const THRESHOLD = 0\.6/)   // the range itself
  assert.match(out, /what: *the threshold constant is 0\.6/)
  assert.match(out, /The threshold is 0\.6 \[E1\]/)    // the passage citing it
  // And nothing from the line the ref does not cite, which is the failure the
  // sweep exists to find: a reader must not be shown neighbouring context and
  // left to think the citation covered it.
  assert.doesNotMatch(out, /function unrelated/)
})

test('an audited ref leaves the queue, and the verdict comes back', () => {
  const audit = `# audit
| ref | verdict | read | note |
|---|---|---|---|
| \`alpha/E1\` | supports | 2026-10-18 | the constant is right there |
`
  const dir = library({ audit })
  const queue = run(dir, [])
  assert.match(queue, /1 read, 1 unread/)
  assert.match(queue, /alpha\/E2/)
  assert.doesNotMatch(queue, /alpha\/E1\s*$/m)
  const read = run(dir, ['--audited'])
  assert.match(read, /read: 1 of 2 refs/)
  assert.match(read, /supports .*alpha\/E1 *the constant is right there/)
})

test('a ref with no line range is listed apart from the queue', () => {
  // Its miss rate is 100 percent by construction, since there are no cited
  // lines for a `what` word to appear in, so ordering it with the ranged refs
  // would put an artifact at the top of the reading list every run.
  const dir = library()
  writeFileSync(join(dir, 'skills', 'alpha', 'SKILL.md'),
    `---
name: alpha
description: a fixture
evidence:
  - ref: E1
    what: the threshold constant is 0.6
    source: src/a.ts:1
  - ref: E2
    what: the vision document says why
    source: docs/vision.md, section 0
supersedes: []
---

# Alpha

The threshold is 0.6 [E1] and the vision says why [E2].
`)
  mkdirSync(join(dir, 'docs'), { recursive: true })
  writeFileSync(join(dir, 'docs', 'vision.md'), 'section 0\n')
  const out = run(dir, [])
  assert.match(out, /1 unread refs cite a document and a section name/)
  assert.match(out, /docs\/vision\.md, section 0 *\(alpha\/E2\)/)
})

test('a dossier names the refs whose cited lines overlap, and only those', () => {
  // The slice-2 failure in words: two refs claimed opposite things about one
  // helper and the lock was green over both, because it keys on one ref's own
  // ranges and never compares two refs. Overlap, not same file, is the signal:
  // E3 below cites the same file on a line nobody else cites and must not be
  // dragged in, or the field is noise on every ref in a large file.
  const dir = library()
  writeFileSync(join(dir, 'skills', 'alpha', 'SKILL.md'), `---
name: alpha
description: a fixture
evidence:
  - ref: E1
    what: the threshold constant is 0.6
    source: src/a.ts:1
  - ref: E2
    what: the threshold constant is 0.7, which is the contradiction
    source: src/a.ts:1
  - ref: E3
    what: covered excludes skipped text
    source: src/a.ts:3
supersedes: []
---

# Alpha

The threshold is 0.6 [E1], or 0.7 [E2], and covered excludes skipped [E3].
`)
  const out = run(dir, ['alpha/E1'])
  assert.match(out, /1 other ref cites overlapping lines/)
  assert.match(out, /alpha\/E2 {2}src\/a\.ts:1-1/)
  assert.match(out, /the contradiction/)       // the other claim, in full
  assert.doesNotMatch(out, /alpha\/E3/)        // same file, no shared line
  // And a ref nobody overlaps says nothing rather than saying zero.
  assert.doesNotMatch(run(dir, ['alpha/E3']), /overlapping lines/)
})

test('a dossier names the refs that share a sentence, and only those', () => {
  // The slice-3 failure in words: `[E2, E4]` divides one claim between two
  // refs, each author knowing which half was theirs and no tool knowing
  // either. E4's half was anchored at a comment that did not carry it. The
  // signal ranked it near the bottom of the slice, so the field has to come
  // from the citation tag and not from the ordering. Sharing a sentence is
  // the signal, not citing the same file: E3 below cites nothing in common
  // and must not be dragged in.
  const dir = library()
  writeFileSync(join(dir, 'skills', 'alpha', 'SKILL.md'), `---
name: alpha
description: a fixture
evidence:
  - ref: E1
    what: the threshold constant is 0.6
    source: src/a.ts:1
  - ref: E2
    what: the half of the divided claim nobody audits
    source: src/a.ts:2
  - ref: E3
    what: covered excludes skipped text
    source: src/a.ts:3
supersedes: []
---

# Alpha

The threshold is 0.6 and unrelated returns 1 [E1, E2]. Covered excludes
skipped [E3].
`)
  const out = run(dir, ['alpha/E1'])
  assert.match(out, /1 other ref shares a sentence with this one/)
  assert.match(out, /alpha\/E2 {2}src\/a\.ts:2/)
  assert.match(out, /the half of the divided claim nobody audits/)
  assert.doesNotMatch(out, /alpha\/E3/)
  // And a ref whose every citation is its own says nothing rather than zero.
  assert.doesNotMatch(run(dir, ['alpha/E3']), /shares? a sentence/)
})
