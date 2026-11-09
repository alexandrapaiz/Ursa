// The classification `tools/ledger/recheck-urgent.mjs` reports, pinned.
//
// WHY THE ALLOWLIST GETS THE MOST TESTS HERE. This is the one tool in the
// repository that reads a path out of prose and then executes it. The ledger
// is committed and its authors are this organization's own seats, but the
// charter's rule is that its text is evidence and not instruction, and a tool
// that runs what a sentence names is a tool whose behaviour any future author
// of that sentence controls. So the cases below are written from the attacker's
// side as much as the user's: a path outside `tools/`, a path that is not a
// test, a path nobody tracks, and a traversal. Each must be refused by shape
// and not merely happen not to exist.

import { strict as assert } from 'node:assert'
import { describe, it } from 'node:test'
import {
  PROBE_SHAPE,
  classifyEntry,
  daysBetween,
  pathsIn,
  probesIn,
  report,
  tally,
} from './urgent-verdict.mjs'

const TRACKED = new Set([
  'tools/root-entries.test.mjs',
  'tools/stack/repair-pending.test.mjs',
  'tools/ledger/check.mjs',
  'docs/ideas.md',
  'ursa-major/src/resolver.test.ts',
])
const isTracked = (p) => TRACKED.has(p)
const TODAY = '2026-11-08'
const ev = (probeResults = new Map()) => ({ probeResults, isTracked, today: TODAY })

const entry = (text, date = '2026-11-02') => ({
  heading: `### ${date} — A thing`,
  date,
  text: `### ${date} — A thing\n${text}\n- Status: urgent`,
})

describe('pathsIn', () => {
  it('reads paths only out of inline code spans', () => {
    const text = '- Trigger: tools/root-entries.test.mjs failed, see `docs/ideas.md`'
    assert.deepEqual(pathsIn(text), ['docs/ideas.md'])
  })

  it('needs a slash and a tracked top-level directory, so prose nouns are not paths', () => {
    assert.deepEqual(pathsIn('`main` and `assess()` and `pending`'), [])
    assert.deepEqual(pathsIn('`node_modules/foo.mjs`'), [])
    assert.deepEqual(pathsIn('`tools/board/post.mjs`'), ['tools/board/post.mjs'])
  })

  it('strips sentence punctuation and a trailing slash a seat wrote inside the span', () => {
    assert.deepEqual(pathsIn('`docs/ideas.md,`'), ['docs/ideas.md'])
    assert.deepEqual(pathsIn('`tools/stack/`'), ['tools/stack'])
  })

  it('finds a path inside a command span, which is how entries cite probes', () => {
    assert.deepEqual(
      pathsIn('`node --test tools/root-entries.test.mjs`'),
      ['tools/root-entries.test.mjs'],
    )
  })

  it('de-duplicates and keeps first-appearance order', () => {
    assert.deepEqual(
      pathsIn('`docs/ideas.md` then `tools/ledger/check.mjs` then `docs/ideas.md`'),
      ['docs/ideas.md', 'tools/ledger/check.mjs'],
    )
  })
})

describe('probesIn: the execution allowlist', () => {
  it('accepts a tracked .test.mjs under tools/', () => {
    assert.deepEqual(
      probesIn('`tools/root-entries.test.mjs`', isTracked),
      ['tools/root-entries.test.mjs'],
    )
  })

  it('refuses a test outside tools/ by shape, even when it is tracked', () => {
    assert.ok(TRACKED.has('ursa-major/src/resolver.test.ts'))
    assert.deepEqual(probesIn('`ursa-major/src/resolver.test.ts`', isTracked), [])
  })

  it('refuses a tools/ file that is not a test suite', () => {
    assert.ok(TRACKED.has('tools/ledger/check.mjs'))
    assert.deepEqual(probesIn('`tools/ledger/check.mjs`', isTracked), [])
  })

  it('refuses a correctly-shaped path nobody tracks', () => {
    assert.deepEqual(probesIn('`tools/invented/by-prose.test.mjs`', isTracked), [])
  })

  it('refuses a traversal by shape', () => {
    assert.equal(PROBE_SHAPE.test('tools/../../etc/passwd.test.mjs'), false)
    assert.deepEqual(probesIn('`tools/../../etc/passwd.test.mjs`', () => true), [])
  })

  it('refuses a shell metacharacter by shape', () => {
    assert.equal(PROBE_SHAPE.test('tools/a.test.mjs; rm -rf /'), false)
  })
})

describe('classifyEntry', () => {
  it('every named probe green is symptom-cleared, and says so without claiming the entry is done', () => {
    const v = classifyEntry(
      entry('- What: `tools/root-entries.test.mjs` is red'),
      ev(new Map([['tools/root-entries.test.mjs', true]])),
    )
    assert.equal(v.disposition, 'symptom-cleared')
    assert.match(v.why, /every probe it names passes today/)
    assert.match(v.why, /candidate for re-reading/)
  })

  it('one failing probe holds, and names only the failing one', () => {
    const v = classifyEntry(
      entry('`tools/root-entries.test.mjs` and `tools/stack/repair-pending.test.mjs`'),
      ev(new Map([
        ['tools/root-entries.test.mjs', true],
        ['tools/stack/repair-pending.test.mjs', false],
      ])),
    )
    assert.equal(v.disposition, 'holds')
    assert.equal(v.why, 'still failing today: tools/stack/repair-pending.test.mjs')
  })

  it('a named probe nobody ran is unmeasured, never clear', () => {
    const v = classifyEntry(entry('`tools/root-entries.test.mjs` is red'), ev())
    assert.equal(v.disposition, 'unverifiable')
    assert.match(v.why, /not run this pass/)
    assert.match(v.why, /unmeasured rather than confirmed/)
    assert.deepEqual(v.probes, [{ path: 'tools/root-entries.test.mjs', passed: null }])
  })

  it('an entry naming no probe gets the other sentence, because the repair differs', () => {
    const v = classifyEntry(entry('- What: the host disk is full'), ev())
    assert.equal(v.disposition, 'unverifiable')
    assert.match(v.why, /names no runnable probe/)
    assert.deepEqual(v.probes, [])
  })

  it('reports cited paths that are not tracked today', () => {
    const v = classifyEntry(entry('`tools/host/disk-guard.mjs` would fix it'), ev())
    assert.deepEqual(v.pathsMissing, ['tools/host/disk-guard.mjs'])
  })

  it('carries the age in whole days', () => {
    const v = classifyEntry(entry('- What: x', '2026-10-27'), ev())
    assert.equal(v.ageDays, 12)
  })
})

describe('daysBetween', () => {
  it('counts whole days', () => {
    assert.equal(daysBetween('2026-11-02', '2026-11-08'), 6)
    assert.equal(daysBetween('2026-11-08', '2026-11-08'), 0)
  })

  it('is null rather than 0 when the date is absent or unreadable', () => {
    assert.equal(daysBetween(null, '2026-11-08'), null)
    assert.equal(daysBetween('not-a-date', '2026-11-08'), null)
  })
})

describe('report', () => {
  const verdicts = [
    classifyEntry(entry('- What: no probe here', '2026-09-27'), ev()),
    classifyEntry(
      entry('`tools/root-entries.test.mjs`', '2026-11-02'),
      ev(new Map([['tools/root-entries.test.mjs', true]])),
    ),
    classifyEntry(
      entry('`tools/stack/repair-pending.test.mjs`', '2026-11-02'),
      ev(new Map([['tools/stack/repair-pending.test.mjs', false]])),
    ),
  ]

  it('sorts what is still broken first, then cleared, then unmeasured', () => {
    const lines = report(verdicts, { ledgerPath: 'docs/ideas.md', today: TODAY })
    const order = lines
      .filter((l) => /^(holds|symptom-cleared|unverifiable)\s/.test(l))
      .map((l) => l.split(/\s+/)[0])
    assert.deepEqual(order, ['holds', 'symptom-cleared', 'unverifiable'])
  })

  it('counts each class in the summary line', () => {
    const lines = report(verdicts, { ledgerPath: 'docs/ideas.md', today: TODAY })
    assert.ok(
      lines.some((l) => l.includes(
        '3 urgent entr(ies) in docs/ideas.md on 2026-11-08: 1 still failing a probe they name, '
        + '1 whose every named probe now passes, 1 this tool has no measurement for.',
      )),
      lines.join('\n'),
    )
  })

  it('states in its own output that it is not a verdict and does not clear the status', () => {
    const lines = report(verdicts, { ledgerPath: 'docs/ideas.md', today: TODAY }).join('\n')
    assert.match(lines, /report and not a verdict on any branch/)
    assert.match(lines, /never change a ledger status the owner controls/)
    assert.match(lines, /a named test is green rather than that the entry is finished/)
  })

  it('tally agrees with the summary', () => {
    assert.deepEqual(tally(verdicts), { holds: 1, 'symptom-cleared': 1, unverifiable: 1 })
  })
})
