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
  cloneLines,
  daysBetween,
  declarationsIn,
  locatorsIn,
  normalizeOutcome,
  parseDeclaration,
  pathToken,
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

// ---------------------------------------------------------------------------
// Exit 2, which is a refusal and not a finding.
//
// WHY THIS BLOCK EXISTS AT ALL. The first version of this module read every
// non-zero exit as "the condition still holds". The first declared command
// this seat reached for, `node tools/secret-scan.mjs --history --no-baseline`
// on the two 2026-10-27 history entries, exits 2 in the clone a seat is
// handed, because the clone is shallow and single-branch and the scanner
// refuses rather than walking a truncated graph. Under the first version the
// report would have printed `holds` and the owner would have read a refusal
// as a live finding.

describe('exit 2 is a refusal, not a finding', () => {
  const withOutcome = (outcome) => classifyEntry(
    entry('- Recheck: `node tools/secret-scan.mjs --history`'),
    ev(new Map([['node tools/secret-scan.mjs --history', outcome]])),
  )

  it('does not hold and does not clear', () => {
    const v = withOutcome('cannot-answer')
    assert.equal(v.disposition, 'unverifiable')
    assert.match(v.why, /refused to answer in this clone at exit 2/)
    assert.match(v.why, /not the same as the condition having cleared/)
    assert.match(v.why, /make the probe answerable here, not to re-read the entry/)
  })

  it('a refusal alongside a pass is still not a clear', () => {
    const v = classifyEntry(
      entry('- Recheck: `node tools/secret-scan.mjs --history`\n- Recheck: `node scripts/ci-checks.mjs`'),
      ev(new Map([
        ['node tools/secret-scan.mjs --history', 'cannot-answer'],
        ['node scripts/ci-checks.mjs', true],
      ])),
    )
    assert.equal(v.disposition, 'unverifiable')
    assert.match(v.why, /refused to answer/)
  })

  it('a real failure alongside a refusal still holds, because one of them is a finding', () => {
    const v = classifyEntry(
      entry('- Recheck: `node tools/secret-scan.mjs --history`\n- Recheck: `node scripts/ci-checks.mjs`'),
      ev(new Map([
        ['node tools/secret-scan.mjs --history', 'cannot-answer'],
        ['node scripts/ci-checks.mjs', false],
      ])),
    )
    assert.equal(v.disposition, 'holds')
    assert.equal(v.probes.filter((p) => p.passed === false).length, 1)
  })

  it('normalizeOutcome reads an unrecognised value as a refusal, never as a pass', () => {
    assert.equal(normalizeOutcome(true), true)
    assert.equal(normalizeOutcome(false), false)
    assert.equal(normalizeOutcome('cannot-answer'), 'cannot-answer')
    for (const odd of [undefined, null, 0, 1, 'pass', {}]) {
      assert.equal(normalizeOutcome(odd), 'cannot-answer', String(odd))
    }
  })
})

// ---------------------------------------------------------------------------
// A skip is not a pass, which is the second half of the same lesson.
//
// WHAT THIS CHANGED IN THE PUBLISHED NUMBER. Run against this repository's own
// ledger on 2026-11-09, the report said 6 entries' every named probe passes.
// Four of those six were real; two were suites that skipped one subtest each
// and exited 0, and for `tools/root-entries.test.mjs` the skipped subtest is
// the entry's whole subject. After this change the same run prints 4 and names
// the other two as unmeasured.

describe('exit 0 with a skipped subtest is not a clear', () => {
  const withOutcome = (outcome) => classifyEntry(
    entry('- What: `tools/root-entries.test.mjs` is red on a complete clone'),
    ev(new Map([['tools/root-entries.test.mjs', outcome]])),
  )

  it('does not clear and does not hold', () => {
    const v = withOutcome('incomplete')
    assert.equal(v.disposition, 'unverifiable')
    assert.match(v.why, /exited 0 while skipping at least one of its own subtests/)
    assert.match(v.why, /no clear can be read from it/)
    assert.match(v.why, /run it directly and read which subtest skipped/)
  })

  it('is distinct from a refusal, because the two have different repairs', () => {
    assert.notEqual(withOutcome('incomplete').why, withOutcome('cannot-answer').why)
  })

  it('an outright refusal outranks a skip, and a real failure outranks both', () => {
    const two = (a, b) => classifyEntry(
      entry('- Recheck: `node tools/secret-scan.mjs --history`\n- Recheck: `node scripts/ci-checks.mjs`'),
      ev(new Map([
        ['node tools/secret-scan.mjs --history', a],
        ['node scripts/ci-checks.mjs', b],
      ])),
    )
    assert.match(two('cannot-answer', 'incomplete').why, /refused to answer/)
    assert.equal(two(false, 'incomplete').disposition, 'holds')
    assert.match(two('incomplete', true).why, /skipping at least one of its own subtests/)
  })

  it('normalizeOutcome keeps incomplete distinct from a refusal', () => {
    assert.equal(normalizeOutcome('incomplete'), 'incomplete')
    assert.equal(normalizeOutcome('skipped'), 'cannot-answer')
  })
})

// ---------------------------------------------------------------------------
// The source locator, added 2026-11-09.
//
// WHY IT NEEDED A TEST BLOCK OF ITS OWN. The defect it fixes is the reverse of
// every other defect in this file: not a tool that accepted too much, a tool
// that accepted too little, and specifically that accepted LESS the more
// precisely an entry cited its subject. So the cases below pin both directions
// at once. A locator is stripped, and nothing else is, and the stripping is
// not allowed to widen any allowlist by one character: `probesIn` is still
// `PROBE_SHAPE` plus `isTracked` and a locator cannot smuggle a path past it.

describe('pathToken: a locator is stripped from a path and kept', () => {
  it('strips a trailing line number and reports it', () => {
    assert.deepEqual(pathToken('tools/root-entries.test.mjs:324'), {
      path: 'tools/root-entries.test.mjs',
      locator: '324',
    })
  })

  it('strips the line-and-column form tsc and eslint print', () => {
    assert.deepEqual(pathToken('tools/root-entries.test.mjs:324:11'), {
      path: 'tools/root-entries.test.mjs',
      locator: '324:11',
    })
  })

  it('does not strip a trailing word, because `tools/x.mjs:main` is no tool\'s output', () => {
    assert.equal(pathToken('tools/root-entries.test.mjs:main'), null)
  })

  it('reports no locator for a bare path', () => {
    assert.deepEqual(pathToken('tools/root-entries.test.mjs'), {
      path: 'tools/root-entries.test.mjs',
      locator: null,
    })
  })

  it('still refuses a bare word and an untracked top-level root, locator or not', () => {
    assert.equal(pathToken('main:12'), null)
    assert.equal(pathToken('node_modules/foo.mjs:12'), null)
  })

  it('is NOT where a traversal is refused, and a locator does not move that guard', () => {
    // `PATH_TOKEN` has always admitted `..`; the traversal refusal is
    // `PROBE_SHAPE`'s and `SCRIPT_SHAPE`'s `SEGMENT` rule, which is the layer
    // that decides what runs. This case exists so that a future reader who
    // finds a traversal coming out of `pathsIn` knows it is by design and
    // where the guard actually is, and so that the locator strip is pinned as
    // not having loosened it. The first assertion is the one that matters.
    assert.deepEqual(probesIn('`tools/../../etc/passwd.test.mjs:12`', () => true), [])
    assert.deepEqual(pathToken('tools/../../etc/passwd:12'), {
      path: 'tools/../../etc/passwd',
      locator: '12',
    })
  })

  it('accepts the known false positive on purpose: a prose suffix reads as a locator', () => {
    // Pinned rather than defended against. Stripping only ever widens what is
    // offered to the allowlists, which are unchanged, so the worst case is a
    // locator printed as context next to a path that really is tracked.
    assert.deepEqual(pathToken('docs/vision.md:2026'), { path: 'docs/vision.md', locator: '2026' })
  })
})

describe('pathsIn and locatorsIn over a locator', () => {
  const text = '- Trigger: `tools/root-entries.test.mjs:324` is red, see also `docs/ideas.md`'

  it('the path is found, which before this it was not', () => {
    assert.deepEqual(pathsIn(text), ['tools/root-entries.test.mjs', 'docs/ideas.md'])
  })

  it('the locator is reported separately, once per path, and only where there is one', () => {
    assert.deepEqual(locatorsIn(text), [
      { path: 'tools/root-entries.test.mjs', locator: '324' },
    ])
  })

  it('first locator wins when an entry cites the same file twice', () => {
    assert.deepEqual(
      locatorsIn('`tools/root-entries.test.mjs:324` and `tools/root-entries.test.mjs:9`'),
      [{ path: 'tools/root-entries.test.mjs', locator: '324' }],
    )
  })

  it('the entry that this was found on becomes measurable, and the allowlist is unchanged', () => {
    // The live case: the most precisely cited urgent entry in the ledger.
    const e = entry('- Trigger: the failing case is `tools/root-entries.test.mjs:324`')
    assert.deepEqual(probesIn(e.text, isTracked), ['tools/root-entries.test.mjs'])
    assert.equal(probePlan(e.text, isTracked).basis, 'inferred')
    // And a locator does not get an untracked or wrongly-shaped path executed.
    assert.deepEqual(probesIn('`tools/root-entries.mjs:324`', isTracked), [])
    assert.deepEqual(probesIn('`tools/nope.test.mjs:324`', isTracked), [])
  })
})

// ---------------------------------------------------------------------------
// The clone, added 2026-11-09.
//
// WHY THIS IS A SEPARATE AXIS FROM THE DISPOSITION, and why the test says so:
// run over the same ledger at the same commit on 2026-11-09, this tool
// reported 0 entries still failing in the shallow single-branch clone every
// seat on this host is handed and 3 after `bash tools/ensure-full-clone.sh`.
// Zero is the dangerous direction. The three cases that matter are therefore
// not three dispositions, they are three things the output must say about
// WHERE it measured, and the one that is easy to get wrong is `complete`: in a
// complete clone `tools/stack/repair-pending.test.mjs` still skips a subtest,
// so a reader sent to complete their clone would be sent to run a command that
// cannot help them.

describe('a non-answer names the clone as the first thing to rule out', () => {
  const withClone = (clone, outcome = 'cannot-answer') => classifyEntry(
    entry('- Recheck: `node tools/secret-scan.mjs --history`'),
    { probeResults: new Map([['node tools/secret-scan.mjs --history', outcome]]), isTracked, today: TODAY, clone },
  )

  it('an incomplete clone is named with the command that repairs it', () => {
    assert.match(withClone('incomplete').why, /this clone is incomplete, so start with `bash tools\/ensure-full-clone\.sh`/)
  })

  it('a complete clone says completing it is NOT the repair, so nobody is sent to run it', () => {
    const why = withClone('complete').why
    assert.match(why, /this clone is already complete, so completing it is not the repair/)
    assert.doesNotMatch(why, /start with/)
  })

  it('an unmeasured clone says it is unmeasured rather than picking one of the two', () => {
    assert.match(withClone('unknown').why, /did not establish whether this clone is complete/)
  })

  it('defaults to unknown, so a caller that never measured is reported as never having measured', () => {
    assert.match(
      classifyEntry(
        entry('- Recheck: `node tools/secret-scan.mjs --history`'),
        ev(new Map([['node tools/secret-scan.mjs --history', 'cannot-answer']])),
      ).why,
      /did not establish whether this clone is complete/,
    )
  })

  it('reaches a skipped subtest too, which is the same mistake one layer down', () => {
    assert.match(withClone('incomplete', 'incomplete').why, /start with `bash tools\/ensure-full-clone\.sh`/)
    assert.match(withClone('complete', 'incomplete').why, /completing it is not the repair/)
  })

  it('does not reach a clean pass or a real failure, which the clone does not explain', () => {
    assert.doesNotMatch(withClone('incomplete', true).why, /ensure-full-clone/)
    assert.doesNotMatch(withClone('incomplete', false).why, /ensure-full-clone/)
  })
})

describe('cloneLines: the report says what its counts are a measurement of', () => {
  it('an incomplete clone marks every count provisional and gives the repair', () => {
    const lines = cloneLines('incomplete', ['depth: .git/shallow is present']).join('\n')
    assert.match(lines, /INCOMPLETE clone/)
    assert.match(lines, /describes this checkout and not this repository/)
    assert.match(lines, /bash tools\/ensure-full-clone\.sh/)
    assert.match(lines, /0 entries still failing and 18 with no measurement/)
    assert.match(lines, /3 still failing and 14 with no measurement/)
    assert.match(lines, /clone: depth: \.git\/shallow is present/)
  })

  it('a complete clone says so, because the affirmative is what a reader needs stated', () => {
    const lines = cloneLines('complete').join('\n')
    assert.match(lines, /COMPLETE clone/)
    assert.match(lines, /measurement of this repository and not only of this checkout/)
  })

  it('an unmeasured clone refuses to let any count be quoted', () => {
    const lines = cloneLines('unknown', ['no origin remote']).join('\n')
    assert.match(lines, /could not establish whether this clone is complete/)
    assert.match(lines, /no count above should be quoted as a fact about this repository/)
    assert.match(lines, /clone: no origin remote/)
  })

  it('is always one of the three and never silent, whatever it is handed', () => {
    for (const c of ['complete', 'incomplete', 'unknown', undefined]) {
      assert.ok(cloneLines(c).length >= 1, String(c))
    }
  })
})

describe('report carries the clone and the locator', () => {
  const refused = classifyEntry(
    entry('- Recheck: `node tools/secret-scan.mjs --history`\n- What: `tools/root-entries.test.mjs:324`'),
    { probeResults: new Map([['node tools/secret-scan.mjs --history', 'cannot-answer']]), isTracked, today: TODAY, clone: 'incomplete' },
  )

  it('the clone sentence is the last thing printed, after the counts it qualifies', () => {
    const lines = report([refused], { ledgerPath: 'docs/ideas.md', today: TODAY, clone: 'incomplete', cloneWhy: ['depth: .git/shallow is present'] })
    assert.match(lines.at(-1), /clone: depth: \.git\/shallow is present/)
    assert.ok(lines.some((l) => /INCOMPLETE clone/.test(l)), lines.join('\n'))
  })

  it('defaults to saying it did not establish the clone, never to saying it was fine', () => {
    const lines = report([refused], { ledgerPath: 'docs/ideas.md', today: TODAY }).join('\n')
    assert.match(lines, /could not establish whether this clone is complete/)
    assert.doesNotMatch(lines, /COMPLETE clone/)
  })

  it('prints the locator the entry wrote, as context on an entry that is not cleared', () => {
    const lines = report([refused], { ledgerPath: 'docs/ideas.md', today: TODAY }).join('\n')
    assert.match(lines, /the entry points at tools\/root-entries\.test\.mjs:324, which is where its author was looking/)
  })

  it('does not print the locator on a cleared entry, where the line it points at now passes', () => {
    const cleared = classifyEntry(
      entry('- What: `tools/root-entries.test.mjs:324`'),
      ev(new Map([['tools/root-entries.test.mjs', true]])),
    )
    assert.equal(cleared.disposition, 'symptom-cleared')
    assert.doesNotMatch(
      report([cleared], { ledgerPath: 'docs/ideas.md', today: TODAY }).join('\n'),
      /the entry points at/,
    )
  })
})
