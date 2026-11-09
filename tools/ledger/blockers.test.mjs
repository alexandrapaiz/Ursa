// What `tools/ledger/blockers.mjs` and `tools/ledger/check-blockers.mjs`
// promise. Every assertion here runs against a fixture string: the pure half
// touches no file and no network by construction, and the CLI's `--open`
// flag exists so its exit codes are drivable the same way.

import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'

import {
  BLOCKER_PHRASES,
  GRADED,
  UNRESOLVABLE_SHAPES,
  acknowledgedStale,
  blockerClaims,
  declaredStatus,
  entries,
  sentences,
  staleBlockers,
} from './blockers.mjs'
import { findingFor } from './check-blockers.mjs'
import { verdict } from './blockers-verdict.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))
const GATE = resolve(HERE, 'check-blockers.mjs')
const LEDGER = resolve(HERE, '../../docs/ideas.md')

/** A ledger with one entry that names its blocker in one sentence. */
const ONE_CLAIM = `# Ideas

### 2026-11-01 — A thing that waits on a row
- Trigger: something observed.
- What: a paragraph.
- First step: it depends on \`#679\` landing first, since that is where the module lives.
- Cost: $0
- Status: proposed
`

test('an entry is split on its heading, and its body and title are separated', () => {
  const e = entries(ONE_CLAIM)
  assert.equal(e.length, 1)
  assert.equal(e[0].title, '2026-11-01 — A thing that waits on a row')
  assert.match(e[0].body, /^- Trigger:/)
})

test('the declared status is read, and absence is null rather than a guess', () => {
  assert.equal(declaredStatus(ONE_CLAIM), 'proposed')
  assert.equal(declaredStatus('- What: no status here'), null)
})

test('sentences collapse a line wrap, because this ledger wraps at 80 columns', () => {
  // The claim this gate reads is written across two lines in the real file.
  // If the splitter worked on raw text the predicate would miss every
  // blocker whose sentence happens to wrap, which is most of them.
  const wrapped = 'It depends on\n`#679` landing\nfirst, since that is where it lives. And another.'
  const s = sentences(wrapped)
  assert.equal(s.length, 2)
  assert.equal(s[0], 'It depends on `#679` landing first, since that is where it lives.')
})

test('a claim is found when the phrase and the reference share a sentence', () => {
  const c = blockerClaims(ONE_CLAIM)
  assert.equal(c.length, 1)
  assert.deepEqual(c[0].refs, [{ company: null, number: 679 }])
  assert.equal(c[0].status, 'proposed')
})

test('a reference inside backticks is found, which the obvious regex misses', () => {
  // The defect this pins: `\b#(\d+)` never matches `` `#679` ``, because a
  // backtick and a `#` are both non-word characters and there is no boundary
  // between them. The first measurement of this gate's own population
  // published 1 when the answer was 2 for exactly this reason.
  assert.equal(blockerClaims('### T\n- First step: blocked on `#679`.\n').length, 1)
  assert.equal(blockerClaims('### T\n- First step: blocked on #679.\n').length, 1)
  assert.equal(blockerClaims('### T\n- First step: blocked on Ursa#679.\n')[0].refs[0].company, 'Ursa')
})

test('a one-digit reference is not a pull request, because #1 in prose is a list item', () => {
  assert.equal(blockerClaims('### T\n- First step: blocked on #1.\n').length, 0)
})

test('a phrase with no reference in its sentence is not a claim', () => {
  // The dominant false positive the same-sentence rule exists to reject: a
  // descriptive `depends on` in an entry that happens to mention a row
  // somewhere else. Four of the five graded false positives are this shape.
  const descriptive = `### T
- What: it changes what a label depends on, which matters.
- First step: unrelated prose mentioning #679 in another sentence.
- Status: proposed
`
  assert.equal(blockerClaims(descriptive).length, 0)
})

test('`waiting on` is not a blocker phrase, because it is also how blocking I/O is described', () => {
  assert.ok(!BLOCKER_PHRASES.some((re) => re.test('the rest was spent waiting on child processes')))
  assert.equal(blockerClaims('### T\n- What: spent waiting on #707 child processes.\n').length, 0)
})

test('a claim is stale when every row it names has left the open set', () => {
  const c = blockerClaims(ONE_CLAIM)
  assert.equal(staleBlockers(c, new Set([679])).length, 0)
  const stale = staleBlockers(c, new Set([999]))
  assert.equal(stale.length, 1)
  assert.deepEqual(stale[0].retired, [679])
  assert.equal(stale[0].code, 'BLOCKER_RETIRED')
})

test('a partly open blocker is still a blocker', () => {
  const two = '### T\n- First step: blocked on #679 and #680 landing.\n- Status: proposed\n'
  assert.equal(blockerClaims(two)[0].refs.length, 2)
  assert.equal(staleBlockers(blockerClaims(two), new Set([680])).length, 0)
  assert.equal(staleBlockers(blockerClaims(two), new Set([])).length, 1)
})

test('an unknown open set yields nothing, and is not the same as an empty one', () => {
  // The failure this prevents: an empty set makes every claim stale, so a
  // gate that conflated the two would report the whole ledger rotten the
  // first time `gh` was unauthenticated.
  const c = blockerClaims(ONE_CLAIM)
  assert.equal(staleBlockers(c, null).length, 0)
  assert.equal(staleBlockers(c, undefined).length, 0)
  assert.equal(staleBlockers(c, new Set([])).length, 1)
})

test('a merged blocker and an abandoned one ask opposite things of the seat', () => {
  const s = staleBlockers(blockerClaims(ONE_CLAIM), new Set([]))[0]
  assert.match(findingFor(s, { 679: 'merged' }).message, /is merged, so the work it was waiting for is takeable/)
  assert.match(findingFor(s, { 679: 'closed' }).message, /closed without merging.*may be dead rather than ready/)
  assert.match(findingFor(s, {}).message, /did not say whether it merged/)
})

test('a finding quotes the entry title and the sentence, so it is locatable without a line number', () => {
  const f = findingFor(staleBlockers(blockerClaims(ONE_CLAIM), new Set([]))[0], { 679: 'closed' })
  assert.equal(f.code, 'BLOCKER_RETIRED')
  assert.equal(f.held, 'seat')
  assert.match(f.message, /"2026-11-01 — A thing that waits on a row"/)
  assert.match(f.message, /- Status: proposed/)
  assert.match(f.message, /"it depends on `#679` landing first/)
})

test('the verdict refuses to report clean when the open set was never read', () => {
  const v = verdict([{ held: 'clone', code: 'FORGE_OPEN_SET_UNKNOWN', message: 'x' }], {
    claims: 1,
    entries: 509,
  })
  assert.equal(v.exitCode, 2)
  assert.equal(v.cause, 'FORGE_OPEN_SET_UNKNOWN')
  assert.equal(v.stream, 'err')
  assert.doesNotMatch(v.line, /every named row still open/)
  // The reason this is a finding and not a flag: a gate that exits non-zero
  // with nothing printed above the verdict is what the enumerator calls
  // EXIT_0_WHEN_CLEAN, and it is right.
  assert.equal(verdict([], { claims: 1, entries: 509 }).exitCode, 0)
})

test("the exit-1 trailer tells the seat to keep the entry, and not to touch its status", () => {
  const v = verdict([{ held: 'seat', code: 'BLOCKER_RETIRED', message: 'x' }], { claims: 1, entries: 509 })
  assert.equal(v.exitCode, 1)
  assert.match(v.trailer.join('\n'), /correction on top/)
  assert.match(v.trailer.join('\n'), /reserves every status transition/)
})

test('the clean line names the scope it could not look up', () => {
  const v = verdict([], { claims: 1, entries: 509, unresolvable: UNRESOLVABLE_SHAPES.length })
  assert.equal(v.exitCode, 0)
  assert.match(v.line, /3 blocker shape\(s\) this gate cannot look up/)
})

test('the CLI exits 0 over a fixture whose named row is open, and 1 when it is not', () => {
  const dir = mkdtempSync(resolve(tmpdir(), 'ursa-blockers-'))
  const path = resolve(dir, 'ideas.md')
  writeFileSync(path, ONE_CLAIM)
  const run = (open) => {
    try {
      return { code: 0, out: execFileSync('node', [GATE, path, '--open', open], { encoding: 'utf8' }) }
    } catch (e) {
      return { code: e.status, out: `${e.stdout}${e.stderr}` }
    }
  }
  assert.equal(run('679').code, 0)
  const red = run('999')
  assert.equal(red.code, 1)
  assert.match(red.out, /::error::BLOCKER_RETIRED/)
})

test("the CLI's positional argument is not the value of a flag", () => {
  // This WAS a bug: `argv.find(a => !a.startsWith('-'))` makes `679` the
  // positional when the invocation is `--open 679`, so the gate read its
  // ledger from a file named `679` and died on ENOENT the first time its own
  // fixture path ran.
  const out = execFileSync('node', [GATE, LEDGER, '--open', '679'], { encoding: 'utf8' })
  assert.match(out, /docs\/ideas\.md|ideas\.md/)
  assert.match(out, /Exit 0/)
})

test('GRADED carries a read instant and every false positive it counts', () => {
  assert.match(GRADED.read_at, /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/)
  assert.equal(GRADED.false_positives_named.length, GRADED.entry_scoped_false_positives)
  assert.equal(GRADED.entry_scoped_true_positives + GRADED.entry_scoped_false_positives, GRADED.entry_scoped_hits)
  for (const fp of GRADED.false_positives_named) assert.ok(fp.why.length > 20, fp.entry)
})

test('--grade exits non-zero when the ledger has moved under the published grading', () => {
  // A grading nobody re-derived is the defect the flag exists to find, and
  // this is the assertion that keeps the flag itself honest: it found this
  // file's own first published numbers wrong within the hour.
  const dir = mkdtempSync(resolve(tmpdir(), 'ursa-grade-'))
  const path = resolve(dir, 'ideas.md')
  writeFileSync(path, ONE_CLAIM)
  assert.throws(
    () => execFileSync('node', [GATE, '--grade', path], { encoding: 'utf8', stdio: 'pipe' }),
    (e) => e.status === 1,
  )
})

test('--grade exits 0 against the ledger GRADED was measured over', () => {
  const out = execFileSync('node', [GATE, '--grade', LEDGER], { encoding: 'utf8' })
  assert.match(out, new RegExp(`entries:\\s+${GRADED.entries}\\b`))
  assert.match(out, new RegExp(`same-sentence hits:\\s+${GRADED.same_sentence_hits}\\b`))
})

test('every unresolvable blocker shape says why it cannot be looked up', () => {
  assert.ok(UNRESOLVABLE_SHAPES.length >= 3)
  for (const s of UNRESOLVABLE_SHAPES) {
    assert.ok(s.shape.length > 5)
    assert.ok(s.why.length > 20, s.shape)
  }
})

test('a marker acknowledging the retirement clears the finding', () => {
  // The defect this pins is the gate's own first shape: with no
  // acknowledgement at all, the repair its exit-1 trailer prescribes leaves
  // the blocker sentence in place, so the gate went red again on the entry it
  // had just correctly fixed.
  const marked = `${ONE_CLAIM}\n<!-- blocker-retired: #679 -->\n`
  assert.deepEqual(blockerClaims(marked)[0].acknowledged, [679])
  assert.equal(staleBlockers(blockerClaims(marked), new Set([])).length, 0)
  assert.equal(staleBlockers(blockerClaims(ONE_CLAIM), new Set([])).length, 1)
})

test('a marker clears only the rows it names, so a second blocker reopens the finding', () => {
  const two = `### T
- First step: blocked on #679 and #680 landing.
- Status: proposed

<!-- blocker-retired: #679 -->
`
  assert.equal(staleBlockers(blockerClaims(two), new Set([])).length, 1)
  assert.equal(staleBlockers(blockerClaims(two.replace('#679 -->', '#679, #680 -->')), new Set([])).length, 0)
})

test('a quotation of a blocker inside its own correction is also a claim, and one marker clears both', () => {
  // Writing the correction on top means quoting the blocker sentence, so the
  // entry ends up with two sentences that each state a blocker and name the
  // same row. Both are claims; the acknowledgement is keyed on the reference
  // and scoped to the entry, which is what clears both at once.
  const corrected = `### T
- First step: it depends on \`#679\` landing first.
- Status: proposed

Correction: it reads "it depends on \`#679\` landing first", and #679 is closed.

<!-- blocker-retired: #679 -->
`
  assert.equal(blockerClaims(corrected).length, 2)
  assert.equal(staleBlockers(blockerClaims(corrected), new Set([])).length, 0)
})

test('the clean line does not say "still open" over a row that is closed and acknowledged', () => {
  const marked = `${ONE_CLAIM}\n<!-- blocker-retired: #679 -->\n`
  const claims = blockerClaims(marked)
  const ack = acknowledgedStale(claims, new Set([]))
  assert.equal(ack, 1)
  const v = verdict([], { claims: claims.length, entries: 1, acknowledged: ack })
  assert.equal(v.exitCode, 0)
  assert.doesNotMatch(v.line, /every named row still open\./)
  assert.match(v.line, /already acknowledged/)
  // And with nothing acknowledged it keeps the shorter, true sentence.
  assert.match(verdict([], { claims: 1, entries: 1 }).line, /every named row still open\./)
})

test('acknowledgedStale counts nothing when the open set is unknown', () => {
  assert.equal(acknowledgedStale(blockerClaims(ONE_CLAIM), null), 0)
})

test('the real ledger is clean, which is the gate running on its own repository', () => {
  const out = execFileSync('node', [GATE, LEDGER, '--open', '679'], { encoding: 'utf8' })
  assert.match(out, /Exit 0/)
})
