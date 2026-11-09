// node --test tools/seat/baseline-drift.test.mjs
//
// Five kinds of test, and the "control:" ones are the only ones that can
// fail for the right reason on their own.
//
// "exact:"   the two drifts actually measured on 2026-11-09, held as
//            fixtures rather than as a live read: security's baseline
//            (`613fc803`, five rows whose files a merge deleted two minutes
//            later) and the trunk's own (`b16cbd2a`, one row renamed out
//            from under its key 103 commits ago).
// "control:" a tool whose whole subject is "this row may be stale" can pass
//            every assertion about staleness by calling everything stale,
//            so each claim is paired with the fixture that must NOT trip
//            it. These are the pairs runner-facts requires of any guard
//            over an absence.
// "bound:"   the verdict vocabulary is closed and every non-STANDS verdict
//            owes the reader an instruction. These bind the spelling and
//            the coverage, so a sixth verdict cannot arrive silently or
//            arrive mute.
// "shape:"   an ungradeable baseline must not fall through to the
//            reassuring answer. This is the one that matters most: the
//            default for "I could not tell" has to be loud.
// "host:"    the real repository, measured on a complete clone or skipped
//            with the reason named.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import {
  sameCommit, classifyBaseline, classifyRow, assess, tally, exitCodeFor,
  formatReport, parseNameStatus, resolveTip,
  CURRENT, BEHIND, DETACHED, ABSENT,
  STANDS, MOVED, RENAMED, UNPAYABLE, UNLOCATED,
  BASELINE_PATH, REPO_ROOT
} from './baseline-drift.mjs'

const TIP = 'fd0ed558281a293b32ed82a786351f4da4aea49c'

// Security's six rows as recorded at 2026-11-08T23:45:00Z on `613fc803`,
// and the name-status of the eleven commits that followed. Both are
// transcribed from the measurement, so this fixture does not move when the
// trunk does — the defect under test is a row keyed on a moving position,
// and a test keyed on one would inherit it.
const SECURITY_ROWS = [
  { file: 'tools/instant.test.mjs', name: 'no source file outside a test orders timestamps as text', owner: 'security', since: '2026-11-08' },
  { file: 'tools/seat/env-facts.test.mjs', name: 'bound: every member of the derived class cites the one command', owner: 'exo', since: '2026-11-08' },
  { file: 'tools/seat/env-facts.test.mjs', name: 'control: a charter that stops citing the command is reported', owner: 'exo', since: '2026-11-08' },
  { file: 'tools/seat/env-facts.test.mjs', name: 'absence is printed, not implied, and --audit is a gate', owner: 'exo', since: '2026-11-08' },
  { file: 'tools/seat/merge-verdict.test.mjs', name: 'the charter cites this tool rather than re-deriving the comparison in prose', owner: 'exo', since: '2026-11-08' },
  { file: 'tools/seat/own-prs.test.mjs', name: 'bound: each charter\'s prose pattern equals the single source', owner: 'exo', since: '2026-11-08' }
]
const SECURITY_NAME_STATUS = [
  'A\tdocs/agents/engineer-2026-11-08-run.md',
  'M\tdocs/agents/improvements.md',
  'M\ttools/instant.mjs',
  'M\ttools/instant.test.mjs',
  'D\ttools/seat/env-facts.json',
  'D\ttools/seat/env-facts.mjs',
  'D\ttools/seat/env-facts.test.mjs',
  'D\ttools/seat/merge-verdict.mjs',
  'D\ttools/seat/merge-verdict.test.mjs',
  'D\ttools/seat/own-prs.mjs',
  'D\ttools/seat/own-prs.test.mjs'
].join('\n')

const securityCommits = () => ({
  measuredOn: '613fc803', tip: TIP, present: true, isAncestor: true, distance: 11,
  changed: parseNameStatus(SECURITY_NAME_STATUS)
})

test('exact: five of security\'s six rows are unpayable, and the sixth only moved', () => {
  // Every row's own name survived in the one file that still exists, so the
  // name check is answered `true` for it and never consulted for the five
  // whose file is gone.
  const a = assess({ measuredOn: '613fc803', red: SECURITY_ROWS, repaired: [] }, securityCommits(), () => true)
  const t = tally(a)
  assert.equal(t.redTotal, 6)
  assert.equal(t.unpayable, 5)
  assert.equal(t.moved, 1)
  assert.equal(t.stands, 0, 'no row in this measurement was untouched')
  assert.equal(a.red.find(r => r.file === 'tools/instant.test.mjs').drift, MOVED)
  assert.equal(exitCodeFor(a), 1)
})

test('exact: the five unpayable rows all bill a seat that cannot pay them', () => {
  const a = assess({ measuredOn: '613fc803', red: SECURITY_ROWS, repaired: [] }, securityCommits(), () => true)
  const unpayable = a.red.filter(r => r.drift === UNPAYABLE)
  assert.equal(unpayable.length, 5)
  // The whole cost of the measured case: every one of them names an owner,
  // so each reads as a debt, and none of them is payable by that owner or
  // by anyone else. The report has to carry the owner beside the verdict or
  // the reader cannot see the contradiction.
  assert.ok(unpayable.every(r => r.owner === 'exo'))
  const text = formatReport(a, { deletedBy: new Map([['tools/seat/own-prs.test.mjs', { sha: '965a4554', subject: 'the tier split is refused' }]]) })
  assert.match(text, /UNPAYABLE {2}5 of 6/)
  assert.match(text, /owner: exo/)
  assert.match(text, /deleted by 965a4554/)
})

test('exact: the trunk\'s own one red row was renamed, not deleted', () => {
  // `b16cbd2a` -> the tip, 103 commits, and `f19ab0f1` modified the file
  // while renaming the test inside it. `suite-baseline.mjs` can only call
  // that GONE; the distinction is the thing this tool adds.
  const row = {
    file: 'tools/stack/repair-pending.test.mjs',
    name: 'the real queue: measured on a complete clone, or skipped with the reason named',
    owner: 'security', since: '2026-11-02'
  }
  const commits = {
    measuredOn: 'b16cbd2a', tip: TIP, present: true, isAncestor: true, distance: 103,
    changed: parseNameStatus('M\ttools/stack/repair-pending.test.mjs')
  }
  const a = assess({ measuredOn: 'b16cbd2a', red: [row], repaired: [] }, commits, () => false)
  assert.equal(a.red[0].drift, RENAMED)
  assert.equal(exitCodeFor(a), 1)
  assert.match(formatReport(a), /cannot match again/)
})

test('control: 103 commits of drift that touched nothing leaves the row standing', () => {
  // The negative control for the test above, and the reason this tool does
  // not key on distance. Same measuredOn, same distance, same tip; the only
  // difference is whether the row's own file is in the range.
  const row = { file: 'tools/stack/repair-pending.test.mjs', name: 'the real queue', owner: 'security', since: '2026-11-02' }
  const commits = {
    measuredOn: 'b16cbd2a', tip: TIP, present: true, isAncestor: true, distance: 103,
    changed: parseNameStatus('M\tdocs/agents/improvements.md')
  }
  const a = assess({ measuredOn: 'b16cbd2a', red: [row], repaired: [] }, commits, () => true)
  assert.equal(a.red[0].drift, STANDS)
  assert.equal(tally(a).stands, 1)
  assert.equal(exitCodeFor(a), 0, 'distance alone must not flag a row')
  assert.match(formatReport(a), /still names the file and test it was measured against/)
})

test('control: two minutes of drift that deleted the subject does flag it', () => {
  // The positive control's pair. Distance 1, elapsed minutes, and every row
  // unpayable — the opposite corner from the test above on both axes that
  // are not the row's own file.
  const row = { file: 'tools/seat/own-prs.test.mjs', name: 'bound: x', owner: 'exo', since: '2026-11-08' }
  const a = assess({ measuredOn: '613fc803', red: [row], repaired: [] }, {
    measuredOn: '613fc803', tip: TIP, present: true, isAncestor: true, distance: 1,
    changed: parseNameStatus('D\ttools/seat/own-prs.test.mjs')
  }, () => null)
  assert.equal(a.red[0].drift, UNPAYABLE)
  assert.equal(exitCodeFor(a), 1)
})

test('shape: an ungradeable baseline grades nothing and says so', () => {
  // The one that matters most. If `judgeable` is false and the rows still
  // fall through the file-status path, every row reads STANDS — which is
  // the reassuring answer, produced by a run that established nothing.
  for (const commits of [
    { measuredOn: 'deadbeefcafe', tip: TIP, present: false, isAncestor: false, distance: null, changed: new Map() },
    { measuredOn: '613fc803', tip: TIP, present: true, isAncestor: false, distance: null, changed: new Map() },
    { measuredOn: null, tip: TIP, present: true, isAncestor: true, distance: 0, changed: new Map() },
    { measuredOn: '613fc803', tip: null, present: true, isAncestor: true, distance: 0, changed: new Map() }
  ]) {
    const a = assess({ measuredOn: commits.measuredOn, red: SECURITY_ROWS, repaired: [] }, commits, () => true)
    assert.equal(a.judgeable, false, JSON.stringify(commits))
    assert.equal(tally(a).stands, 0, 'nothing may be reported as standing')
    assert.equal(tally(a).unlocated, 6)
    assert.equal(exitCodeFor(a), 2, 'an uncomputable drift is a refusal, not a pass')
    assert.match(formatReport(a), /No row below can be graded/)
  }
})

test('control: a baseline measured on the tip itself is CURRENT and exits 0', () => {
  // The negative control for the refusal above: the same code path, with
  // nothing wrong, must come out quiet. A guard that refuses everything is
  // indistinguishable from this one by any test that only checks refusals.
  const a = assess({ measuredOn: TIP, red: SECURITY_ROWS, repaired: [] }, {
    measuredOn: TIP, tip: TIP, present: true, isAncestor: true, distance: 0, changed: new Map()
  }, () => true)
  assert.equal(a.head.state, CURRENT)
  assert.equal(a.judgeable, true)
  assert.equal(tally(a).stands, 6)
  assert.equal(exitCodeFor(a), 0)
  assert.match(formatReport(a), /CURRENT/)
})

test('bound: the five row verdicts are the whole vocabulary, and four carry an instruction', () => {
  const vocabulary = [STANDS, MOVED, RENAMED, UNPAYABLE, UNLOCATED]
  assert.deepEqual(vocabulary, ['STANDS', 'MOVED', 'RENAMED', 'UNPAYABLE', 'UNLOCATED'])
  assert.equal(new Set(vocabulary).size, 5, 'no two verdicts may share a spelling')
  assert.deepEqual(
    [CURRENT, BEHIND, DETACHED, ABSENT],
    ['CURRENT', 'BEHIND', 'DETACHED', 'ABSENT']
  )
  // Every verdict that is not STANDS tells the reader what to do about it.
  // A verdict without one is a label, and the file this tool corrects was
  // full of labels nobody could act on.
  const src = readFileSync(new URL('./baseline-drift.mjs', import.meta.url), 'utf8')
  const notes = src.slice(src.indexOf('const DRIFT_NOTES'), src.indexOf('export function formatReport'))
  for (const v of [MOVED, RENAMED, UNPAYABLE, UNLOCATED]) {
    assert.ok(notes.includes(`[${v}]`), `${v} carries no instruction to the reader`)
  }
})

test('bound: a short or missing hash is refused rather than guessed at', () => {
  assert.equal(sameCommit(TIP.slice(0, 8), TIP), true, 'a short prefix of the tip is the tip')
  assert.equal(sameCommit(TIP, '613fc803'), false, 'two real commits are not each other')
  assert.equal(sameCommit('FD0ED558', TIP), true, 'case is not identity')
  assert.equal(sameCommit('fd0ed5', TIP), false, 'six characters do not identify a commit')
  assert.equal(sameCommit(null, TIP), false)
  assert.equal(sameCommit(TIP, ''), false)
  // And the consequence, which is the only reason the floor exists: a hash
  // too short to identify must not be allowed to read as CURRENT.
  assert.equal(classifyBaseline({ measuredOn: 'fd0ed5', tip: TIP, present: true, isAncestor: true, distance: 0 }).state, BEHIND)
})

test('bound: classifyBaseline returns one of four states and never throws', () => {
  assert.equal(classifyBaseline({ measuredOn: TIP, tip: TIP, present: true, isAncestor: true }).state, CURRENT)
  assert.equal(classifyBaseline({ measuredOn: 'b16cbd2a', tip: TIP, present: true, isAncestor: true, distance: 103 }).state, BEHIND)
  assert.equal(classifyBaseline({ measuredOn: 'b16cbd2a', tip: TIP, present: true, isAncestor: false }).state, DETACHED)
  assert.equal(classifyBaseline({ measuredOn: 'b16cbd2a', tip: TIP, present: false }).state, ABSENT)
  assert.equal(classifyBaseline({}).state, ABSENT)
  for (const s of [DETACHED, ABSENT]) {
    const r = Object.values({ a: classifyBaseline({ measuredOn: 'b16cbd2a', tip: TIP, present: s === DETACHED }) })[0]
    assert.ok(r.why, 'a state a reader cannot act on must say why')
  }
})

test('control: an unanswerable name check lands on MOVED, never on RENAMED', () => {
  // A test name built by interpolation is not findable as a literal, so the
  // search cannot see it. The honest verdict there is the weaker one; the
  // defect this guards is a tool that reads its own blind spot as evidence.
  const row = { file: 'tools/instant.test.mjs', name: 'x', owner: 'security', since: '2026-11-08' }
  const changed = parseNameStatus('M\ttools/instant.test.mjs')
  assert.equal(classifyRow(row, changed, () => null).drift, MOVED)
  assert.equal(classifyRow(row, changed, () => true).drift, MOVED)
  assert.equal(classifyRow(row, changed, () => false).drift, RENAMED)
  // A row with no file at all cannot be graded by file status — the shape
  // security found in the baseline's own passing points.
  assert.equal(classifyRow({ name: 'x' }, changed, () => true).drift, UNLOCATED)
})

test('bound: a rename in name-status marks the old path gone and the new one added', () => {
  const m = parseNameStatus([
    'R100\ttools/seat/old.test.mjs\ttools/seat/new.test.mjs',
    'M\tdocs/agents/improvements.md',
    'A\ttools/ledger/urgent-verdict.test.mjs',
    'D\ttools/seat/own-prs.test.mjs',
    '',
    '   '
  ].join('\n'))
  assert.equal(m.get('tools/seat/old.test.mjs'), 'D', 'a row keyed on the old path is unpayable')
  assert.equal(m.get('tools/seat/new.test.mjs'), 'A')
  assert.equal(m.get('docs/agents/improvements.md'), 'M')
  assert.equal(m.get('tools/ledger/urgent-verdict.test.mjs'), 'A')
  assert.equal(m.get('tools/seat/own-prs.test.mjs'), 'D')
  assert.equal(m.size, 5, 'blank lines are not paths')
  assert.equal(parseNameStatus('').size, 0)
  assert.equal(parseNameStatus(null).size, 0)
})

test('control: the tip is read from origin/main, and the fallback names itself', () => {
  const only = (want) => (args) => args[0] === 'rev-parse' && args[2] === '--quiet' && args[3] === `${want}^{commit}`
    ? { status: 0, stdout: `${TIP}\n` }
    : { status: 1, stdout: '' }
  assert.deepEqual(resolveTip(only('origin/main')), { tip: TIP, ref: 'origin/main' })
  // A seat's fresh clone can have `main` and not `origin/main` (runner-facts
  // §3: the host hands this seat a single-branch fetch refspec). Falling
  // back silently would report a tip that is not the trunk's.
  assert.deepEqual(resolveTip(only('main')), { tip: TIP, ref: 'main' })
  assert.deepEqual(resolveTip(() => ({ status: 1, stdout: '' })), { tip: null, ref: null })
  assert.deepEqual(resolveTip(() => ({ status: 0, stdout: '  \n' })), { tip: null, ref: null },
    'exit 0 with no hash is not a resolve')
})

test('host: the committed baseline\'s own commit is gradeable on a complete clone, or skipped with the reason named', (t) => {
  const git = (args) => spawnSync('git', args, { cwd: REPO_ROOT, encoding: 'utf8' })
  if (git(['rev-parse', '--is-shallow-repository']).stdout.trim() === 'true') {
    t.skip('shallow clone: `measuredOn` is not reachable here, which is a property of the clone and not of the baseline')
    return
  }
  const baseline = JSON.parse(readFileSync(BASELINE_PATH, 'utf8'))
  assert.ok(baseline.measuredOn, 'the baseline must record the commit it describes or nothing can grade it')
  if (git(['cat-file', '-e', `${baseline.measuredOn}^{commit}`]).status !== 0) {
    t.skip(`\`${baseline.measuredOn}\` is absent from this clone`)
    return
  }
  const { tip, ref } = resolveTip(git)
  if (!tip) { t.skip('neither origin/main nor main resolves here'); return }
  const state = classifyBaseline({
    measuredOn: baseline.measuredOn,
    tip,
    present: true,
    isAncestor: git(['merge-base', '--is-ancestor', baseline.measuredOn, tip]).status === 0,
    distance: Number(git(['rev-list', '--count', `${baseline.measuredOn}..${tip}`]).stdout.trim())
  }).state
  assert.ok([CURRENT, BEHIND].includes(state),
    `the committed baseline reads ${state} against ${ref}; it describes work that is not on the trunk`)
})
