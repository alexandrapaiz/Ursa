// node --test tools/gates/premise-differential.test.mjs
//
// Two halves, and the second is the one that matters. The first drives
// `grade()` over synthetic readings, which proves the classifier can tell the
// six states apart. The second writes FIXTURE TOOLS to disk and drives the
// whole measurement over them, because a suite that only feeds the classifier
// hand-made readings proves the classifier and says nothing about whether the
// three arms it is fed were collected correctly -- which is this file's own
// subject matter (Ursa/exo 2026-11-09, window 106: a positive control
// validates the instrument, not the inference).
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { chmodSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { grade, measure, namesOwnCause, normalise, verdict } from './premise-differential.mjs'

const arm = (status, text) => ({ status, signal: null, text })
const g = (p1, p2, absent, basename = '') =>
  grade({ present1: p1, present2: p2, absent, paths: [], basename }).cls

test('identical arms are UNMOVED, not clean', () => {
  // The row that a two-reading differential scores green. `read-dates.mjs`
  // resolves its inputs from the script's own directory, so moving the working
  // directory removes nothing and it prints the same 222 entries either way.
  const same = arm(0, '222 entries in improvements.md')
  assert.equal(g(same, same, arm(0, '222 entries in improvements.md')), 'UNMOVED')
})

test('an exit code that moved is a move even with identical text', () => {
  assert.equal(g(arm(0, 'same'), arm(0, 'same'), arm(1, 'same')), 'UNCODED_NONZERO')
})

test('two readings at the same premise that disagree are UNSTABLE, not a move', () => {
  assert.equal(
    g(arm(0, 'seen 3 runs'), arm(0, 'seen 4 runs'), arm(2, 'GROUND_ABSENT: no logs')),
    'UNSTABLE',
  )
})

test('exit 0 with the ground removed is GREEN_ON_NOTHING', () => {
  // Ursa/security, 2026-11-09: `bypass.mjs --audit` exited 0 over a window
  // that answered 401, printing `coverage INCOMPLETE` directly above it.
  const cls = g(arm(0, 'coverage COMPLETE, 1803 rows'), arm(0, 'coverage COMPLETE, 1803 rows'),
    arm(0, 'coverage INCOMPLETE, 0 rows'))
  assert.equal(cls, 'GREEN_ON_NOTHING')
})

test('a non-zero naming its own cause at 2 is GROUND_CODED', () => {
  assert.equal(
    g(arm(0, '41 rows'), arm(0, '41 rows'), arm(2, 'BOARD_ENV_ABSENT: neither variable is set')),
    'GROUND_CODED',
  )
})

test('the basename is the second derived test, not a widened word list', () => {
  // The four rows the first version of namesOwnCause called foreign. Three of
  // them open with their own basename; the fourth is prose and must stay
  // undecided rather than be guessed at.
  assert.equal(namesOwnCause('ensure-full-clone: . is not a git repository', 'ensure-full-clone.sh'), true)
  assert.equal(namesOwnCause('prompt-slots: cannot do its job', 'prompt-slots.mjs'), true)
  assert.equal(namesOwnCause('check-attributes: no driver registry at /x', 'check-attributes.mjs'), true)
  assert.equal(namesOwnCause('Refusing to judge containment', 'containment.mjs'), false)
  // And it must not fire on a different tool's name in the first line.
  assert.equal(namesOwnCause('post.mjs: refused', 'check.mjs'), false)
})

test('its own cause at a code other than 2 is CODED_OFF_BAND, not GROUND_CODED', () => {
  // Ursa/security's second class. `check-attributes.mjs` answers a missing
  // driver registry with exit 1, and 1 is also what it returns for findings,
  // so the two are indistinguishable downstream.
  assert.equal(
    g(arm(0, '3 ok'), arm(0, '3 ok'), arm(1, 'check-attributes: no driver registry at /x'),
      'check-attributes.mjs'),
    'CODED_OFF_BAND',
  )
})

test('a non-zero from a stack trace or a subprocess is not its own verdict', () => {
  // Ursa/frontend, 2026-11-09: four kit tools exit 1 against a dead port
  // because they let the error escape and node sets the status for them. The
  // colour is right and the authorship is not, so it gets its own class.
  for (const [text, shape] of [
    ['node:internal/deps/undici/undici:15157\n  at fetch', 'runtime-throw'],
    ['fatal: not a git repository', 'git-fatal'],
    ['Command failed: gh pr list --state all', 'subprocess'],
  ]) {
    const r = grade({ present1: arm(0, 'ok'), present2: arm(0, 'ok'), absent: arm(1, text), paths: [] })
    assert.equal(r.cls, 'UNCODED_NONZERO')
    assert.equal(r.shape, shape)
  }
})

test('a killed or timed-out arm is NO_VERDICT and never a colour', () => {
  assert.equal(g(arm(0, 'ok'), arm(0, 'ok'), { status: null, signal: 'SIGTERM', text: '' }), 'NO_VERDICT')
  assert.equal(g({ status: null, signal: 'SIGTERM', text: '' }, arm(0, 'ok'), arm(0, 'ok')), 'NO_VERDICT')
})

test('namesOwnCause reads the first non-empty line only, and a usage line is not a cause', () => {
  assert.equal(namesOwnCause('\n\nBOARD_URL_ABSENT: no url'), true)
  assert.equal(namesOwnCause('usage: own-prs.mjs <seat>\nSEAT_UNNAMED: no seat'), false)
  assert.equal(namesOwnCause('Scan complete.\nHIT_FOUND: one'), false)
})

test('normalise erases paths, instants and object names and nothing else', () => {
  const out = normalise('/x/y/docs at 2026-11-09T08:00:39Z on 3fe57d29ab: 42 rows', ['/x/y'])
  assert.equal(out, '<PATH>/docs at <INSTANT> on <OBJECT>: 42 rows')
  // The count must survive. Normalising digits in general would hide the one
  // signal a moved premise reliably produces.
  assert.match(normalise('42 rows', []), /42/)
})

test('end to end over fixture tools: the three arms are collected correctly', () => {
  const dir = mkdtempSync(join(tmpdir(), 'premise-fixtures-'))
  const sandbox = mkdtempSync(join(tmpdir(), 'premise-sandbox-'))
  const present = mkdtempSync(join(tmpdir(), 'premise-present-'))
  writeFileSync(join(present, 'package.json'), '{}')
  try {
    // Each fixture decides by whether `package.json` is in the WORKING
    // directory, which is exactly what the repository axis removes.
    const fixture = (name, body) => {
      const p = join(dir, name)
      writeFileSync(p, `import {existsSync} from 'node:fs'\nconst here = existsSync('package.json')\n${body}\n`)
      chmodSync(p, 0o755)
      return name
    }
    fixture('green.mjs', 'console.log(here ? "7 rows" : "0 rows"); process.exit(0)')
    fixture('coded.mjs', 'if (!here) { console.error("TREE_ABSENT: no package.json here"); process.exit(2) }\nconsole.log("7 rows")')
    fixture('thrown.mjs', 'if (!here) { throw new Error("nope") }\nconsole.log("7 rows")')
    fixture('blind.mjs', 'console.log("7 rows"); process.exit(0)')

    // Driving the real `measure` rather than a copy of it is the discipline
    // `code-census.test.mjs` records: a suite that re-implements the collection
    // proves the copy while the program drifts.
    const rel = (n) => join(dir, n)
    const rows = ['green.mjs', 'coded.mjs', 'thrown.mjs', 'blind.mjs'].map((n) => ({ path: rel(n) }))
    const results = measure(rows, sandbox, present)
    const by = new Map(results.map((r) => [r.path.split('/').pop(), r]))
    assert.equal(by.get('green.mjs').cls, 'GREEN_ON_NOTHING')
    assert.equal(by.get('coded.mjs').cls, 'GROUND_CODED')
    assert.equal(by.get('thrown.mjs').cls, 'UNCODED_NONZERO')
    assert.equal(by.get('blind.mjs').cls, 'UNMOVED')

    // And the verdict: only GREEN_ON_NOTHING can fail the gate, a baseline
    // entry excuses it, and an excuse that has outlived its finding fails.
    assert.equal(verdict(results, { entries: [] }).exitCode, 1)
    const excused = { entries: [{ path: by.get('green.mjs').path, why: 'declared' }] }
    assert.equal(verdict(results, excused).exitCode, 0)
    const stale = { entries: [{ path: by.get('coded.mjs').path, why: 'was green once' }] }
    const codes = verdict(results, stale).findings.map((f) => f.code)
    assert.ok(codes.includes('BASELINE_ENTRY_STALE'), codes.join(','))
    assert.ok(verdict(results, { entries: [{ path: 'tools/nope.mjs', why: 'x' }] })
      .findings.some((f) => f.code === 'BASELINE_NAMES_NO_CANDIDATE'))
  } finally {
    rmSync(dir, { recursive: true, force: true })
    rmSync(sandbox, { recursive: true, force: true })
    rmSync(present, { recursive: true, force: true })
  }
})

test('every code this tool can emit is named here, including the two the code census found', () => {
  // `tools/gates/code-census.mjs` failed this file's first draft on exactly
  // these two: a defect code no test names is a code nothing would notice
  // ceasing to fire. The other two are ground codes on paths the suite cannot
  // drive without breaking the registry, so they are asserted by name against
  // the source rather than by execution, and that limitation is the reason
  // this test says which is which.
  const src = readFileSync(new URL('./premise-differential.mjs', import.meta.url), 'utf8')
  const rows = [{ path: 'tools/x.mjs', cls: 'GREEN_ON_NOTHING', firstLine: '0 rows', absentExit: 0 }]
  assert.equal(verdict(rows, { entries: [] }).findings[0].code, 'CLEAN_OVER_REMOVED_GROUND')
  assert.equal(
    verdict(rows, { entries: [{ path: 'tools/gone.mjs', why: 'x' }] })
      .findings.find((f) => f.path === 'tools/gone.mjs').code,
    'BASELINE_NAMES_NO_CANDIDATE',
  )
  assert.equal(
    verdict([{ path: 'tools/x.mjs', cls: 'GROUND_CODED' }], { entries: [{ path: 'tools/x.mjs', why: 'x' }] })
      .findings[0].code,
    'BASELINE_ENTRY_STALE',
  )
  // Driven by the process, not by this function: both are exit-2 ground codes
  // on the candidate-list path.
  assert.match(src, /REGISTRY_UNDRIVABLE:/)
  assert.match(src, /CANDIDATE_SWEEP_EMPTY:/)
})
