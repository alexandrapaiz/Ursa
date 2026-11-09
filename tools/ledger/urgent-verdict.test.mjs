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
  FLAG_SHAPE,
  PROBE_SHAPE,
  SCRIPT_SHAPE,
  basisTally,
  classifyEntry,
  daysBetween,
  declarationsIn,
  parseDeclaration,
  pathsIn,
  probePlan,
  probesIn,
  report,
  tally,
} from './urgent-verdict.mjs'

const TRACKED = new Set([
  'tools/root-entries.test.mjs',
  'tools/stack/repair-pending.test.mjs',
  'tools/ledger/check.mjs',
  'tools/secret-scan.mjs',
  'scripts/ci-checks.mjs',
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
    // The clause after the path was added 2026-11-09 with the `- Recheck:`
    // field: every `why` now ends by saying whether the measurement came from
    // the entry's own declaration or from this tool's inference, so the
    // assertion is split into the claim and its authority rather than widened.
    assert.ok(v.why.startsWith('still failing today: tools/stack/repair-pending.test.mjs'), v.why)
    assert.match(v.why, /on a probe inferred from a path the entry mentions/)
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

// ---------------------------------------------------------------------------
// The `- Recheck:` declaration, added 2026-11-09.
//
// WHY THESE ARE WRITTEN FROM THE ATTACKER'S SIDE TOO. The declaration is a
// second, wider-looking door into the same execution primitive the block of
// tests at the top of this file guards: before it, a ledger sentence could
// cause `node --test` to run on a tracked `tools/**/*.test.mjs`; after it, a
// ledger sentence can name its own script and its own flags. The grammar is
// what keeps that from being a widening, so each clause of the grammar gets a
// refusal case, and every refusal must be by SHAPE rather than by the token
// happening to name nothing that exists — which is why several cases below
// pass `() => true` as `isTracked`, describing a repository where the
// attacker's path is present.

describe('parseDeclaration: the declaration grammar', () => {
  it('accepts node, one tracked-shaped script, and bare long flags', () => {
    const r = parseDeclaration('`node tools/secret-scan.mjs --history`')
    assert.equal(r.ok, true)
    assert.deepEqual(r.value, {
      path: 'node tools/secret-scan.mjs --history',
      script: 'tools/secret-scan.mjs',
      argv: ['tools/secret-scan.mjs', '--history'],
    })
  })

  it('accepts a script with no flags, and one under scripts/', () => {
    assert.equal(parseDeclaration('node tools/root-entries.mjs').ok, true)
    assert.equal(parseDeclaration('node scripts/ci-checks.mjs').ok, true)
  })

  it('refuses any interpreter but node, and says which one it saw', () => {
    for (const cmd of ['bash tools/x.mjs', 'npm run regen', 'sh -c "node tools/x.mjs"', './tools/x.mjs']) {
      const r = parseDeclaration(cmd)
      assert.equal(r.ok, false, cmd)
      assert.match(r.reason, /the only interpreter this tool runs is/)
    }
  })

  it('refuses a traversal by shape, not by absence', () => {
    assert.equal(SCRIPT_SHAPE.test('tools/../../etc/evil.mjs'), false)
    const r = parseDeclaration('node tools/../../etc/evil.mjs')
    assert.equal(r.ok, false)
    assert.match(r.reason, /no `\.\.` segment/)
  })

  it('refuses a script outside tools/ and scripts/, and a non-.mjs script', () => {
    assert.equal(parseDeclaration('node ursa-major/dist/ursa.cjs').ok, false)
    assert.equal(parseDeclaration('node /etc/passwd').ok, false)
    assert.equal(parseDeclaration('node tools/evil.sh').ok, false)
  })

  it('refuses an argument that is not a bare long flag, so no argument can carry data', () => {
    for (const bad of [
      'node tools/secret-scan.mjs --out /etc/passwd',
      'node tools/secret-scan.mjs --out=/etc/passwd',
      'node tools/secret-scan.mjs tools/other.mjs',
      'node tools/secret-scan.mjs -r',
      'node tools/secret-scan.mjs --history; rm -rf /',
      'node tools/secret-scan.mjs --history && curl http://example.com',
      'node tools/secret-scan.mjs $(whoami)',
    ]) {
      const r = parseDeclaration(bad)
      assert.equal(r.ok, false, bad)
      assert.match(r.reason, /only bare long flags/)
    }
  })

  it('refuses node with no script, and an empty declaration', () => {
    assert.match(parseDeclaration('node').reason, /no script/)
    assert.match(parseDeclaration('``').reason, /is empty/)
  })

  it('FLAG_SHAPE takes no value and no short form', () => {
    assert.equal(FLAG_SHAPE.test('--history'), true)
    assert.equal(FLAG_SHAPE.test('--no-run'), true)
    assert.equal(FLAG_SHAPE.test('--Today'), false)
    assert.equal(FLAG_SHAPE.test('--today=1'), false)
    assert.equal(FLAG_SHAPE.test('-h'), false)
  })
})

describe('declarationsIn', () => {
  it('reads a declaration only from a list item at the start of a line', () => {
    const inline = 'and we should Recheck: `node tools/secret-scan.mjs --history` one day'
    assert.deepEqual(declarationsIn(inline).accepted, [])
    const item = '- Recheck: `node tools/secret-scan.mjs --history`'
    assert.equal(declarationsIn(item).accepted.length, 1)
  })

  it('keeps every refusal with its reason instead of dropping it', () => {
    const { accepted, refused } = declarationsIn('- Recheck: `bash tools/x.mjs`\n- Recheck: `node tools/secret-scan.mjs`')
    assert.equal(accepted.length, 1)
    assert.equal(refused.length, 1)
    assert.match(refused[0].reason, /the only interpreter/)
  })

  it('de-duplicates two declarations of the same command', () => {
    const text = '- Recheck: `node tools/secret-scan.mjs --history`\n- Recheck: node tools/secret-scan.mjs --history'
    assert.equal(declarationsIn(text).accepted.length, 1)
  })
})

describe('probePlan: a declaration outranks an inference', () => {
  it('measures on the declaration and ignores the paths the prose mentions', () => {
    const text = '- What: `tools/root-entries.test.mjs` is where this lives\n'
      + '- Recheck: `node tools/secret-scan.mjs --history`'
    const plan = probePlan(text, isTracked)
    assert.equal(plan.basis, 'declared')
    assert.deepEqual(plan.probes, [
      { path: 'node tools/secret-scan.mjs --history', argv: ['tools/secret-scan.mjs', '--history'] },
    ])
  })

  it('falls back to inference with basis inferred, and to none with neither', () => {
    assert.equal(probePlan('`tools/root-entries.test.mjs`', isTracked).basis, 'inferred')
    assert.equal(probePlan('- What: the host disk is full', isTracked).basis, 'none')
  })

  it('a declared script nobody tracks is a refusal, not a silent downgrade', () => {
    const text = '`tools/root-entries.test.mjs`\n- Recheck: `node tools/invented/by-prose.mjs`'
    const plan = probePlan(text, isTracked)
    assert.equal(plan.basis, 'inferred')
    assert.equal(plan.refused.length, 1)
    assert.match(plan.refused[0].reason, /git does not track in this clone/)
  })

  it('an inferred probe carries --test and a declared one does not', () => {
    assert.deepEqual(
      probePlan('`tools/root-entries.test.mjs`', isTracked).probes[0].argv,
      ['--test', 'tools/root-entries.test.mjs'],
    )
  })
})

describe('classifyEntry and report over declarations', () => {
  const declared = (result) => classifyEntry(
    entry('- Recheck: `node tools/secret-scan.mjs --history`'),
    ev(new Map([['node tools/secret-scan.mjs --history', result]])),
  )

  it('keys the result map on the command line, so the report names what ran', () => {
    const v = declared(true)
    assert.equal(v.disposition, 'symptom-cleared')
    assert.equal(v.basis, 'declared')
    assert.deepEqual(v.probes, [{ path: 'node tools/secret-scan.mjs --history', passed: true }])
    assert.match(v.why, /on the command the entry itself declares/)
  })

  it('a failing declared command holds', () => {
    assert.equal(declared(false).disposition, 'holds')
  })

  it('prints the basis marker, the refusal, and the declared count', () => {
    const verdicts = [
      declared(true),
      classifyEntry(entry('- Recheck: `bash tools/x.mjs`'), ev()),
    ]
    const lines = report(verdicts, { ledgerPath: 'docs/ideas.md', today: TODAY })
    const text = lines.join('\n')
    assert.match(text, /^symptom-cleared\s+\d+d old\s+\[declared\]/m)
    assert.match(text, /^unverifiable\s+\d+d old\s+\[none\]/m)
    assert.match(text, /declaration refused: "`bash tools\/x\.mjs`" starts with `bash`/)
    assert.match(text, /Of those, 1 declare the command that decides them/)
    assert.match(text, /1 declaration\(s\) were refused by the allowlist/)
  })

  it('basisTally agrees with the marker it prints', () => {
    assert.deepEqual(
      basisTally([declared(true), classifyEntry(entry('`tools/root-entries.test.mjs`'), ev())]),
      { declared: 1, inferred: 1, none: 0 },
    )
  })
})
