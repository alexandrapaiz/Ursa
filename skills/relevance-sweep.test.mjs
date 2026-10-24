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
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, copyFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const here = (f) => new URL(f, import.meta.url).pathname

/** A two-ref library: E1's claim is checkable from its range, E2's is not. */
function library({ audit } = {}) {
  const dir = mkdtempSync(join(tmpdir(), 'relevance-sweep-'))
  mkdirSync(join(dir, 'src'), { recursive: true })
  mkdirSync(join(dir, 'skills', 'alpha'), { recursive: true })
  for (const f of ['relevance-sweep.mjs', 'source-line.mjs', 'citing-files.mjs'])
    copyFileSync(here(f), join(dir, 'skills', f))
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

test('a ref that is half ranged still has its unranged source counted', () => {
  // The slice-5 failure in words: `unrangeable` is all-or-nothing, so a ref
  // with one ranged source and one unranged one is in the queue, which means
  // it is not in the list of refs the queue sets apart, and its undefended
  // citation is invisible in both places. Two of them hid in this library for
  // four slices, one with no range and no section name at all. E2 below is
  // that shape: a real range plus a bare document.
  const dir = library()
  writeFileSync(join(dir, 'skills', 'alpha', 'SKILL.md'), `---
name: alpha
description: a fixture
evidence:
  - ref: E1
    what: the threshold constant is 0.6
    source: src/a.ts:1
  - ref: E2
    what: covered excludes skipped text, and the design document says why
    source: src/a.ts:3, docs/design.md
supersedes: []
---

# Alpha

The threshold is 0.6 [E1] and covered excludes skipped [E2].
`)
  mkdirSync(join(dir, 'docs'), { recursive: true })
  writeFileSync(join(dir, 'docs', 'design.md'), 'why\n')
  const out = run(dir, [])
  // It is still in the queue, because it has a range and its signals mean
  // something. That is exactly why the old count could not see it.
  assert.match(out, /alpha\/E2/)
  assert.doesNotMatch(out, /unread refs cite a document and a section name/)
  assert.match(out, /1 refs are in the queue above and still carry an unranged source/)
  assert.match(out, /docs\/design\.md {3}\(alpha\/E2\)/)
  assert.match(out, /1 unranged sources in all, across 1 refs/)
})

test('a library whose every source is ranged reports no unranged sources', () => {
  // The closing state of the sweep, asserted so that a later run which adds a
  // bare document citation sees the count move off zero.
  const out = run(library(), [])
  assert.match(out, /0 unranged sources in all, across 0 refs/)
  assert.doesNotMatch(out, /still carry an unranged source/)
})

// The verdict lock. `check-evidence.mjs` stops a hash from outliving its
// lines; these tests are the level above it, where a reading outlives them.
// The three cases that matter are the three the evidence lock cannot see: a
// `what` field rewritten under a verdict, a citing passage rewritten under
// one, and a range re-blessed by `--update` after a change, which is the very
// act that erases the signal a re-read is owed.
const runStatus = (dir, args = []) => {
  try {
    return { status: 0, out: execFileSync('node', [join(dir, 'skills', 'relevance-sweep.mjs'), ...args], { encoding: 'utf8' }) }
  } catch (e) {
    return { status: e.status, out: (e.stdout ?? '') + (e.stderr ?? '') }
  }
}

const AUDIT = `# audit
| ref | verdict | read | note |
|---|---|---|---|
| \`alpha/E1\` | supports | 2026-10-18 | the constant is right there |
| \`alpha/E2\` | widened | 2026-10-18 | widened to the subtraction |
`

/** A library with both refs read, and both verdicts bound to what was read. */
function bound() {
  const dir = library({ audit: AUDIT })
  const rec = run(dir, ['--record', 'alpha'])
  assert.match(rec, /bound 2 verdicts to what was read/)
  assert.match(run(dir, ['--stale']), /2 of 2 verdicts bound to what was read/)
  return dir
}

test('--record refuses a bare invocation, and binds a named scope', () => {
  const dir = library({ audit: AUDIT })
  // The same refusal check-evidence.mjs --update learned on 2026-10-18, when an
  // unscoped re-record turned 43 red ranges green with nobody reading anything.
  // Here the equivalent would bless a stale verdict as freshly read.
  const bare = runStatus(dir, ['--record'])
  assert.equal(bare.status, 1)
  assert.match(bare.out, /--record needs a scope/)
  // And before anything is recorded, a read ref is read in the audit and
  // unbound here, which is the state a closed sweep starts from.
  assert.match(run(dir, []), /2 verdicts are unbound/)
  assert.equal(runStatus(dir, ['--stale']).status, 1)
  assert.match(run(dir, ['--record', 'alpha/E1']), /bound 1 verdict to what was read/)
  assert.match(run(dir, []), /1 verdict is unbound/)
})

test('a changed cited line makes the verdict stale, naming the lines', () => {
  const dir = bound()
  writeFileSync(join(dir, 'src', 'a.ts'), [
    'export const THRESHOLD = 0.7',
    'function unrelated() { return 1 }',
    'const covered = total - skipped',
  ].join('\n') + '\n')
  const stale = runStatus(dir, ['--stale'])
  assert.equal(stale.status, 1)
  assert.match(stale.out, /stale +alpha\/E1 {2}lines changed since it was read/)
  assert.doesNotMatch(stale.out, /alpha\/E2/)   // its own line did not move
  assert.match(run(dir, []), /1 verdict was read against text that has changed since/)
  // And the audit still holds its verdict, which is the point: the reading is
  // not erased, it is owed again.
  assert.match(run(dir, ['--audited']), /supports {2}2026-10-18 {2}stale {3}alpha\/E1/)
})

test('a rewritten claim or passage makes the verdict stale with the lines untouched', () => {
  // Neither of these is visible to the evidence lock at all: it hashes cited
  // lines, and here the cited lines never move. A sentence can be sharpened
  // after a reading and stand on a verdict that was given to the old one.
  const dir = bound()
  const skill = join(dir, 'skills', 'alpha', 'SKILL.md')
  const before = readFileSync(skill, 'utf8')
  writeFileSync(skill, before.replace('what: the threshold constant is 0.6',
    'what: the threshold constant is 0.6, and it is the only one'))
  let out = runStatus(dir, ['--stale'])
  assert.equal(out.status, 1)
  assert.match(out.out, /stale +alpha\/E1 {2}what changed since it was read/)

  writeFileSync(skill, before.replace('The threshold is 0.6 [E1]',
    'The threshold is 0.6 and nothing else is [E1]'))
  out = runStatus(dir, ['--stale'])
  assert.equal(out.status, 1)
  assert.match(out.out, /stale +alpha\/E1 {2}passages changed since it was read/)
})

test('a range relocated onto identical lines keeps its verdict', () => {
  // The quiet half of the design. Most of a drift report is a line number that
  // moved while the lines said the same thing: 27 of 44 ranges on 2026-10-15
  // and 39 of 43 on 2026-10-18. A verdict earned on those lines is still
  // earned, so the digest covers content and paths and never line numbers, or
  // every relocation pass would re-queue the whole library for nothing.
  const dir = bound()
  writeFileSync(join(dir, 'src', 'a.ts'), [
    '// a later seat adds a header comment',
    'export const THRESHOLD = 0.6',
    'function unrelated() { return 1 }',
    'const covered = total - skipped',
  ].join('\n') + '\n')
  const skill = join(dir, 'skills', 'alpha', 'SKILL.md')
  writeFileSync(skill, readFileSync(skill, 'utf8')
    .replace('source: src/a.ts:1\n', 'source: src/a.ts:2\n')
    .replace('source: src/a.ts:3\n', 'source: src/a.ts:4\n'))
  const out = runStatus(dir, ['--stale'])
  assert.equal(out.status, 0)
  assert.match(out.out, /2 of 2 verdicts bound to what was read/)
})

test('a lock entry the audit has moved past is unbound, not bound to the old reading', () => {
  // The audit file is the authority on the verdict and the lock is the
  // authority on what it was read against, so a lock written for `supports`
  // says nothing about a row that now reads `wrong`.
  const dir = bound()
  writeFileSync(join(dir, 'skills', 'relevance-audit.md'),
    AUDIT.replace('| `alpha/E1` | supports | 2026-10-18 |', '| `alpha/E1` | wrong | 2026-10-19 |'))
  const out = runStatus(dir, ['--stale'])
  assert.equal(out.status, 1)
  assert.match(out.out, /unbound alpha\/E1 {2}the audit row now reads wrong 2026-10-19 and the lock was written for supports 2026-10-18/)
})

// The 2026-10-23 widening: a passage citing a ref can live in any markdown
// file of the skill directory. For this tool that has two consequences, and
// they pull in opposite directions, which is why both are asserted. A trigger
// test's prompt is a claim standing on a range, so it belongs in the dossier
// and in the `passages` digest. And the widening must not restate every
// verdict in the library as stale on the day it lands, because nothing was
// re-read. skills/citing-files.mjs carries the account.

test('a passage in a trigger test reaches the dossier, attributed to its file', () => {
  const dir = library()
  writeFileSync(join(dir, 'skills', 'alpha', 'TRIGGER-TEST.md'),
    'Prompt 1 asks whether the cutoff is still six tenths, which the threshold sets [E1].\n')
  const out = run(dir, ['alpha/E1'])
  assert.match(out, /cited by 2 passages/)
  assert.match(out, /TRIGGER-TEST\.md:/)
  assert.match(out, /whether the cutoff is still six tenths/)
  // SKILL.md's own passage is still first and still unlabelled-by-accident:
  // the file heading appears for it too, so a reader is never guessing.
  assert.match(out, /SKILL\.md:/)
  // A ref the trigger test does not cite gains nothing and says nothing.
  const other = run(dir, ['alpha/E2'])
  assert.match(other, /cited by 1 passage/)
  assert.doesNotMatch(other, /TRIGGER-TEST\.md/)
})

test('a new citing passage in a sibling file makes that ref stale, and only it', () => {
  // The behaviour the digest is for: a prompt in the activation test is a
  // second claim standing on the same range, and a verdict given before it
  // was written was not given to it.
  const dir = bound()
  writeFileSync(join(dir, 'skills', 'alpha', 'TRIGGER-TEST.md'),
    'Prompt 1 turns on the threshold [E1].\n')
  const out = runStatus(dir, ['--stale'])
  assert.equal(out.status, 1)
  assert.match(out.out, /stale +alpha\/E1 {2}passages changed since it was read/)
  assert.doesNotMatch(out.out, /alpha\/E2/)
})

test('a sibling file that cites nothing leaves every verdict bound', () => {
  // The day the widening lands, measured: the four trigger tests in the real
  // library cite no refs, so no verdict may move. A tool change is not a
  // reading, and a sweep that closes and immediately reopens for a tool
  // change teaches a reader to ignore the signal.
  const dir = bound()
  writeFileSync(join(dir, 'skills', 'alpha', 'TRIGGER-TEST.md'),
    'Five prompts, written against the description field. Three fire, two do not.\n')
  const out = runStatus(dir, ['--stale'])
  assert.equal(out.status, 0)
  assert.match(out.out, /2 of 2 verdicts bound to what was read/)
})

test('a ref with no audit row at all fails --stale, and is named', () => {
  // The failure this assertion is written against happened: PR #281 merged a
  // skill whose 41 refs had no audit row, and `--stale` exited 1 only because
  // of fifteen stale verdicts in two unrelated skills. Remove the drift and
  // the gate was green over a skill nobody had read a line of.
  //
  // So the fixture is the library with one ref read and recorded and the other
  // never read. Before 2026-10-24 this exited 0.
  const dir = library({ audit: `# audit
| ref | verdict | read | note |
|---|---|---|---|
| \`alpha/E1\` | supports | 2026-10-18 | the constant is right there |
` })
  run(dir, ['--record', 'alpha/E1'])
  const out = runStatus(dir, ['--stale'])
  assert.equal(out.status, 1)
  assert.match(out.out, /unread +alpha\/E2 {2}no verdict in relevance-audit\.md/)
  assert.match(out.out, /1 of 1 verdicts bound to what was read, 1 ref unread/)
  // And an unread ref is not also reported as unbound, which would double-count
  // it and name two repairs where there is one.
  assert.doesNotMatch(out.out, /unbound +alpha\/E2/)
})

test('reading the last ref turns --stale green, and only that', () => {
  // The other half of the gate: it has to be satisfiable. A check that cannot
  // pass gets suppressed, which is the same end state as one that cannot fail.
  const dir = bound()
  const out = runStatus(dir, ['--stale'])
  assert.equal(out.status, 0)
  assert.match(out.out, /2 of 2 verdicts bound to what was read, 0 refs unread/)
})

test('a colon inside an inline code span does not end a sentence', () => {
  // The defect this is written against shipped in the library and survived two
  // readings: the splitter ended a sentence at any `:` followed by a space, so
  // for a ref cited after a span like `turnsToAcceptance: 1` the passage put in
  // front of the reader was the three characters after the colon and the tag.
  // Two of the library's 184 refs were in that state on 2026-10-24.
  const dir = library()
  writeFileSync(join(dir, 'skills', 'alpha', 'SKILL.md'),
    readFileSync(join(dir, 'skills', 'alpha', 'SKILL.md'), 'utf8')
      .replace('The threshold is 0.6 [E1]',
        'The gate declares `THRESHOLD: 0.6` and refuses below it [E1]'))
  const out = run(dir, ['alpha/E1'])
  assert.match(out, /· The gate declares `THRESHOLD: 0\.6` and refuses below it \[E1\]/)
  // The sentence is one passage and not two, which is the whole assertion: a
  // reader shown "0.6` and refuses below it [E1]." can still reach the right
  // verdict from the range, and does, without ever reading the claim.
  assert.doesNotMatch(out, /· 0\.6` and refuses/)
})

test('--signal reports every ref and sets the one-file refs above the line apart', () => {
  // The flag exists because a threshold was proposed on 41 refs in one skill
  // and the library has 184 in six. The report is the counter-check, so the
  // part that has to hold is that it covers every ref and not a queue: a ref
  // already read is exactly the ref whose high ratio nothing else will mention
  // again.
  const dir = library({ audit: `# audit
| ref | verdict | read | note |
|---|---|---|---|
| \`alpha/E1\` | supports | 2026-10-18 | the constant is right there |
` })
  // A third ref whose every content word is absent from its range, which is
  // the case the report is about. Written here rather than into the shared
  // fixture, because the other tests count that library's refs.
  writeFileSync(join(dir, 'skills', 'alpha', 'SKILL.md'),
    readFileSync(join(dir, 'skills', 'alpha', 'SKILL.md'), 'utf8')
      .replace('supersedes: []', `  - ref: E3
    what: the resolver is reached through two separate entry points
    source: src/a.ts:2
supersedes: []`))
  const out = run(dir, ['--signal'])
  assert.match(out, /0\.500\s+1\/2\s+1\s+supports\s+alpha\/E1/)
  assert.match(out, /1\.000\s+\d+\/\d+\s+1\s+unread\s+alpha\/E3/)
  // E1 is read and E3 is not, and both are in the report. That is the
  // difference between this and the default queue, which drops what it has
  // already read and so can never mention a verdict given to a range holding
  // none of its claim.
  assert.match(out, /cites a single file/)
  assert.match(out, /1\.000\s+unread\s+alpha\/E3/)
  // And the summary groups by verdict, because a sorted list of 184 rows does
  // not answer whether the ratio separates the verdicts.
  assert.match(out, /supports\s+1\s+0\.500/)
})
