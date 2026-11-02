#!/usr/bin/env node --test
// node --test tools/seat/charter-lag.test.mjs
//
// Everything here is pure. The clone-dependent half of charter-lag.mjs is
// exercised by the positive control in docs/agents/runner-facts.md, which
// runs the tool against a deliberately shallow single-branch clone and
// asserts it refuses to print a table.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { seatOfBranch, lagDays, buildRows, formatTable, formatSummary, cloneFitness, queueScan } from './charter-lag.mjs'
// `utcDay` moved out of charter-lag.mjs into the shared timestamp module when
// this seat's #694 landed it, so the trunk's import of it from './charter-lag.mjs'
// is taken from '../instant.mjs' here instead. Its contract changed with the
// move: it returns null for an unplaceable value rather than the table's '?',
// because the placeholder is a rendering decision and formatTable makes it.
import { utcDay } from '../instant.mjs'

test('seatOfBranch takes the whole first segment, with or without a company prefix', () => {
  assert.equal(seatOfBranch('ursa-skill/2026-11-02-message'), 'skill')
  assert.equal(seatOfBranch('exo/harness-preflight-2026-10-05'), 'exo')
  assert.equal(seatOfBranch('distribution/vendored-pm'), 'distribution')
  assert.equal(seatOfBranch('main'), null)
})

test('a seat name is not a substring match, which is the defect this org measured', () => {
  // The bare-substring form claimed these three for the wrong seat.
  assert.equal(seatOfBranch('ursa-security/2026-10-27-hook-2'), 'security')
  assert.notEqual(seatOfBranch('ursa-security/2026-10-27-hook-2'), 'sec')
  assert.equal(seatOfBranch('ursa-frontend/2026-10-27-hook'), 'frontend')
  assert.notEqual(seatOfBranch('ursa-frontend/2026-10-27-hook'), 'fe')
})

test('lagDays is signed and fractional, and refuses a date it cannot parse', () => {
  assert.equal(lagDays('2026-10-05T00:00:00Z', '2026-11-02T00:00:00Z'), 28)
  assert.equal(lagDays('2026-11-02T12:00:00Z', '2026-11-02T00:00:00Z'), -0.5)
  assert.equal(lagDays('not a date', '2026-11-02T00:00:00Z'), null)
})

const CHARTERS = [
  {
    seat: 'skill',
    path: 'prompts/skill-agent.md',
    mainDate: '2026-10-09T00:00:00Z',
    mainLines: 236,
    queue: { number: 618, lines: 328 }
  },
  {
    seat: 'sales',
    path: 'prompts/sales-agent.md',
    mainDate: '2026-10-05T00:00:00Z',
    mainLines: 240,
    queue: null
  }
]

const BRANCHES = [
  { branch: 'ursa-skill/2026-11-01-message', createdAt: '2026-11-01T23:44:00Z' },
  { branch: 'ursa-skill/2026-10-08-hook', createdAt: '2026-10-08T01:00:00Z' },
  { branch: 'ursa-security/2026-10-27-hook', createdAt: '2026-10-27T05:00:00Z' }
]

const BRANCH_READ = { rows: BRANCHES, pullRequestsRead: 3, limit: 1000, capped: false }

// The real pair, measured on this repository on 2026-11-02 and the reason
// `buildRows` compares instants rather than strings. Every `mainDate` in
// `CHARTERS` above is a `Z` string, which is the shape `charter-lag.mjs` now
// converts to before it builds a row — and which is also why this file's
// fixtures could not see the defect while it was live: the tool was reading
// `git log --format=%cI`, whose output never appears above.
const ENGINEER_FROZE = '2026-10-09T12:28:03-06:00'   // = 2026-10-09T18:28:03Z

test('buildRows counts only branches of that seat opened after that seat froze', () => {
  const rows = buildRows({ charters: CHARTERS, branches: BRANCHES, nowIso: '2026-11-02T00:00:00Z' })
  const skill = rows.find((r) => r.seat === 'skill')
  // The 2026-10-08 branch predates the freeze date and the security branch
  // belongs to another seat, so one row survives both filters.
  assert.equal(skill.runsHandedStale, 1)
  assert.equal(skill.pendingLines, 92)
  assert.equal(skill.lagDays, 24)
})

test('a charter no open pull request touches has no pending lines, which is not the same as unmeasured', () => {
  const rows = buildRows({ charters: CHARTERS, branches: BRANCHES, nowIso: '2026-11-02T00:00:00Z' })
  const sales = rows.find((r) => r.seat === 'sales')
  assert.equal(sales.queuePr, null)
  assert.equal(sales.queueLines, null)
  assert.equal(sales.pendingLines, 0)
  assert.equal(sales.runsHandedStale, 0)
})

test('formatTable pads to content width and renders the two null columns as a dash', () => {
  const out = formatTable(buildRows({ charters: CHARTERS, branches: BRANCHES, nowIso: '2026-11-02T00:00:00Z' }))
  const lines = out.split('\n')
  assert.equal(lines.length, 4)
  assert.match(lines[0], /^seat {3}charter on main/)
  assert.match(lines[2], /#618/)
  // `stale runs` is a share now, printed `numerator/denominator`: sales has
  // no branches in the fixture at all, which is a different row from a seat
  // with branches and none of them stale.
  assert.match(lines[3], /-\s+-\s+0\s+0\/0$/)
  assert.match(lines[0], /charter on main \(UTC\)/)
})

test('a row carries the population its stale count is a share of', () => {
  const rows = buildRows({ charters: CHARTERS, branches: BRANCHES, nowIso: '2026-11-02T00:00:00Z' })
  const skill = rows.find((r) => r.seat === 'skill')
  assert.equal(skill.runsHandedStale, 1)
  assert.equal(skill.seatBranches, 2)
  const sales = rows.find((r) => r.seat === 'sales')
  assert.equal(sales.seatBranches, 0)
})

test('a branch opened before an offset-bearing freeze is not counted as stale', () => {
  // The live miscount: this branch opened 57 minutes before the engineer
  // charter froze, and a text comparison put it after.
  const charters = [{ seat: 'engineer', path: 'prompts/engineer-agent.md', mainDate: ENGINEER_FROZE, mainLines: 100, queue: null }]
  const branches = [{ branch: 'engineer/2026-10-09-briefing-cost-and-stdio-probe', createdAt: '2026-10-09T17:31:08Z' }]
  assert.equal(branches[0].createdAt > charters[0].mainDate, true)
  const rows = buildRows({ charters, branches, nowIso: '2026-11-02T00:00:00Z' })
  assert.equal(rows[0].runsHandedStale, 0)
  assert.equal(rows[0].seatBranches, 1)
})

test('a branch opened after an offset-bearing freeze is still counted', () => {
  // The other direction, so the repair is not just "count nothing".
  const charters = [{ seat: 'engineer', path: 'prompts/engineer-agent.md', mainDate: ENGINEER_FROZE, mainLines: 100, queue: null }]
  const branches = [{ branch: 'engineer/2026-10-09-later', createdAt: '2026-10-09T19:00:00Z' }]
  const rows = buildRows({ charters, branches, nowIso: '2026-11-02T00:00:00Z' })
  assert.equal(rows[0].runsHandedStale, 1)
})

test('the charter-on-main column is the UTC day, not the committer local day', () => {
  const charters = [{ seat: 'engineer', path: 'prompts/engineer-agent.md', mainDate: '2026-10-09T20:00:00-06:00', mainLines: 100, queue: null }]
  const out = formatTable(buildRows({ charters, branches: [], nowIso: '2026-11-02T00:00:00Z' }))
  // The instant is 2026-10-10T02:00:00Z. `slice(0, 10)` would print the 9th,
  // and the lag column beside it is computed from the 10th.
  assert.match(out, /2026-10-10/)
  assert.doesNotMatch(out, /2026-10-09/)
})

test('an unplaceable date gives no day and no lag rather than a guessed one', () => {
  const charters = [{ seat: 'engineer', path: 'prompts/engineer-agent.md', mainDate: '2026-10-09', mainLines: 100, queue: null }]
  const rows = buildRows({ charters, branches: [], nowIso: '2026-11-02T00:00:00Z' })
  assert.equal(rows[0].lagDays, null)
  assert.equal(rows[0].mainDateUtc, null)
  const out = formatTable(rows)
  assert.match(out, /\?\s+\?/)
})

test('the summary dates itself and prints a denominator beside every count', () => {
  const rows = buildRows({ charters: CHARTERS, branches: BRANCHES, nowIso: '2026-11-02T00:00:00Z' })
  const out = formatSummary(rows, { nowIso: '2026-11-02T00:00:00Z', branchRead: BRANCH_READ })
  assert.match(out, /read at 2026-11-02T00:00:00Z/)
  assert.match(out, /1 of 2 branches of these seats opened after/)
  assert.match(out, /from 3 pull requests read/)
  assert.match(out, /across 1 of 2 charters/)
  assert.match(out, /oldest on main is sales at 28d/)
  assert.doesNotMatch(out, /AT THE/)
})

test('a branch read that hit its own limit says the counts under it are floors', () => {
  const rows = buildRows({ charters: CHARTERS, branches: BRANCHES, nowIso: '2026-11-02T00:00:00Z' })
  const out = formatSummary(rows, {
    nowIso: '2026-11-02T00:00:00Z',
    branchRead: { rows: BRANCHES, pullRequestsRead: 1000, limit: 1000, capped: true }
  })
  assert.match(out, /AT THE 1000-ROW LIMIT/)
  assert.match(out, /every count below is a floor/)
})

test('a table in which no row has a placeable date names no oldest', () => {
  const charters = CHARTERS.map((c) => ({ ...c, mainDate: 'not a date' }))
  const rows = buildRows({ charters, branches: BRANCHES, nowIso: '2026-11-02T00:00:00Z' })
  const out = formatSummary(rows, { nowIso: '2026-11-02T00:00:00Z', branchRead: BRANCH_READ })
  assert.match(out, /no row carries a placeable date/)
})

test('cloneFitness names each fault by the property it is a fault in', () => {
  assert.deepEqual(cloneFitness({ shallow: false, prRefs: 14, originRefs: 30 }), [])
  const shallow = cloneFitness({ shallow: true, prRefs: 14, originRefs: 30 })
  assert.equal(shallow.length, 1)
  assert.match(shallow[0].fault, /^depth:/)
  // The clone this host hands a seat fails both properties at once, and the
  // single-branch refspec fails breadth twice: no refs/prs and one origin ref.
  const handed = cloneFitness({ shallow: true, prRefs: 0, originRefs: 1 })
  assert.equal(handed.length, 3)
  assert.equal(handed.filter((f) => f.fault.startsWith('breadth:')).length, 2)
})

test('each fault carries the repair for ITSELF, and ensure-full-clone is not named for the namespace it declines', () => {
  // Rehearsed red: with the single `repair: bash tools/ensure-full-clone.sh`
  // line this file printed under every fault until 2026-11-02, the second
  // assertion here fails, because that script's own header says it does not
  // fetch refs/pull/*.
  const depth = cloneFitness({ shallow: true, prRefs: 14, originRefs: 30 })[0]
  assert.equal(depth.repair, 'bash tools/ensure-full-clone.sh')
  const breadth = cloneFitness({ shallow: false, prRefs: 0, originRefs: 30 })[0]
  assert.match(breadth.fault, /^breadth: no refs\/prs/)
  assert.match(breadth.repair, /git fetch origin 'refs\/pull\/\*\/head:refs\/prs\/\*'/)
  assert.doesNotMatch(breadth.repair, /ensure-full-clone/)
})

test('a clone that can see SOME pull request head but not the open ones is a fault, not a pass', () => {
  // THE DEFECT THIS TEST PINS, logged by Ursa's PM against line 165 of
  // charter-lag.mjs on 2026-11-02. `prRefs` is a count of what is present,
  // not a check of what is needed. One stale head from a long-merged row
  // satisfies `prRefs !== 0`, every open row then fails `rev-parse --verify`
  // inside the scan, and the table prints `-` in every queue column: the same
  // output as a queue in which no open row touches a charter.
  const partial = cloneFitness({
    shallow: false, prRefs: 1, originRefs: 30, openPrs: 60, readablePrRefs: 0
  })
  assert.equal(partial.length, 1)
  assert.match(partial[0].fault, /^coverage: 0 of 60 open pull requests/)
  assert.match(partial[0].fault, /60 would be skipped/)
  assert.match(partial[0].repair, /refs\/pull\/\*\/head/)

  // Complete coverage is not a fault.
  assert.deepEqual(
    cloneFitness({ shallow: false, prRefs: 80, originRefs: 30, openPrs: 60, readablePrRefs: 60 }),
    []
  )
  // Total absence is named ONCE, by breadth, and not twice.
  const none = cloneFitness({ shallow: false, prRefs: 0, originRefs: 30, openPrs: 60, readablePrRefs: 0 })
  assert.equal(none.length, 1)
  assert.match(none[0].fault, /^breadth:/)
  // And the coverage check stays silent when the caller did not measure it,
  // which is every caller written before this field existed.
  assert.deepEqual(cloneFitness({ shallow: false, prRefs: 5, originRefs: 30 }), [])
})

// --- queueScan: the two skips that used to leave no trace ----------------

/** The four injected reads, over a hand-built clone. */
function io ({ refs, bases, touched, lines }) {
  return {
    refExists: (ref) => refs.includes(ref),
    mergeBase: (_a, ref) => bases[ref] ?? null,
    touches: (_base, ref, _path) => Boolean(touched[ref]),
    linesAt: (rev, _path) => (rev in lines ? lines[rev] : null)
  }
}

const MAIN = 'refs/remotes/origin/main'
const CHARTER = 'prompts/engineer-agent.md'

test('queueScan finds the newest open row that touches the charter', () => {
  const scan = queueScan(CHARTER, [700, 690, 680], io({
    refs: ['refs/prs/700', 'refs/prs/690', 'refs/prs/680'],
    bases: { 'refs/prs/700': 'abc', 'refs/prs/690': 'abc', 'refs/prs/680': 'abc' },
    touched: { 'refs/prs/690': true, 'refs/prs/680': true },
    lines: { [MAIN]: 342, 'refs/prs/690': 980 }
  }), MAIN)
  assert.deepEqual(scan.copy, { number: 690, lines: 980 })
  assert.equal(scan.scanned, 3)
  assert.deepEqual(scan.skipped, [])
  assert.deepEqual(scan.degraded, [])
})

test('a missing refs/prs/<n> is counted and named, not dropped', () => {
  // Rehearsed red: with `if (!...) continue` and no census, `skipped` does not
  // exist and this scan is indistinguishable from the one below it, where the
  // rows are all present and genuinely do not touch the charter.
  const absent = queueScan(CHARTER, [700, 690], io({
    refs: [], bases: {}, touched: {}, lines: { [MAIN]: 342 }
  }), MAIN)
  assert.equal(absent.copy, null)
  assert.equal(absent.scanned, 0)
  assert.deepEqual(absent.skipped, [{ pr: 700, cause: 'no-ref' }, { pr: 690, cause: 'no-ref' }])

  const present = queueScan(CHARTER, [700, 690], io({
    refs: ['refs/prs/700', 'refs/prs/690'],
    bases: { 'refs/prs/700': 'abc', 'refs/prs/690': 'abc' },
    touched: {},
    lines: { [MAIN]: 342 }
  }), MAIN)
  assert.equal(present.copy, null)
  assert.equal(present.scanned, 2)
  assert.deepEqual(present.skipped, [])
  // Same `copy`. Only the census separates them, which is the whole point.
  assert.notDeepEqual(absent.skipped, present.skipped)
})

test('an unanswerable merge base degrades to a blob comparison and says which rows it did that for', () => {
  const scan = queueScan(CHARTER, [700], io({
    refs: ['refs/prs/700'],
    bases: {},                       // merge-base printed nothing
    touched: {},                     // so no diff was ever taken
    lines: { [MAIN]: 342, 'refs/prs/700': 980 }
  }), MAIN)
  assert.deepEqual(scan.copy, { number: 700, lines: 980 })
  assert.deepEqual(scan.degraded, [700])
})

test('a degraded row whose charter is byte-identical to main is not a queue copy', () => {
  const scan = queueScan(CHARTER, [700], io({
    refs: ['refs/prs/700'],
    bases: {},
    touched: {},
    lines: { [MAIN]: 342, 'refs/prs/700': 342 }
  }), MAIN)
  assert.equal(scan.copy, null)
  assert.deepEqual(scan.degraded, [700])
})

test('a degraded row the clone cannot read the charter at all for is not guessed at', () => {
  const scan = queueScan(CHARTER, [700], io({
    refs: ['refs/prs/700'], bases: {}, touched: {}, lines: { [MAIN]: 342 }
  }), MAIN)
  assert.equal(scan.copy, null)
  assert.deepEqual(scan.degraded, [700])
})

test('the summary distinguishes a queue with nothing in it from a queue it could not read', () => {
  const rows = buildRows({
    charters: [{ seat: 'engineer', path: CHARTER, mainDate: '2026-10-09T18:28:03Z', mainLines: 342, queue: null }],
    branches: [],
    nowIso: '2026-11-02T08:00:00Z'
  })
  const clean = formatSummary(rows, {
    nowIso: '2026-11-02T08:00:00Z',
    branchRead: { pullRequestsRead: 60, limit: 1000, capped: false },
    queueRead: { openPrs: 60, skipped: 0, degraded: [] }
  })
  assert.match(clean, /60 open pull requests scanned for charter edits, none skipped/)
  assert.doesNotMatch(clean, /floor/)

  const blind = formatSummary(rows, {
    nowIso: '2026-11-02T08:00:00Z',
    branchRead: { pullRequestsRead: 60, limit: 1000, capped: false },
    queueRead: { openPrs: 60, skipped: 60, degraded: [] }
  })
  assert.match(blind, /60 of them SKIPPED for a missing refs\/prs/)
  assert.match(blind, /every queue column below is a floor/)

  const degraded = formatSummary(rows, {
    nowIso: '2026-11-02T08:00:00Z',
    branchRead: { pullRequestsRead: 60, limit: 1000, capped: false },
    queueRead: { openPrs: 60, skipped: 0, degraded: [690, 700] }
  })
  assert.match(degraded, /2 answered by blob comparison and not by diff/)
  assert.match(degraded, /#690, #700/)

  // A caller that measured no queue read gets no sentence about one, rather
  // than a sentence with a zero in it that it did not measure.
  const silent = formatSummary(rows, {
    nowIso: '2026-11-02T08:00:00Z',
    branchRead: { pullRequestsRead: 60, limit: 1000, capped: false }
  })
  assert.doesNotMatch(silent, /open pull requests scanned/)
})

// --- the two producers, which every fixture above was blind to -----------
//
// Every `mainDate` and `createdAt` above ends in `Z`. `git --format=%cI`
// never prints `Z`, so the whole fixture set was drawn from one producer
// and could not fail on a comparison between two. Rehearsed red: with
// `b.createdAt > c.mainDate` restored, both tests below fail and every
// test above still passes.

const OFFSET_CHARTERS = [
  {
    // 12:28:03-06:00 is 18:28:03Z. As text the hour reads 12.
    seat: 'engineer',
    path: 'prompts/engineer-agent.md',
    mainDate: '2026-10-09T12:28:03-06:00',
    mainLines: 342,
    queue: null
  },
  {
    // git's rendering of a UTC commit: `+00:00`, never `Z`.
    seat: 'exo',
    path: 'prompts/exo-agent.md',
    mainDate: '2026-10-18T18:50:50+00:00',
    mainLines: 2221,
    queue: null
  }
]

test('a branch inside the offset window is before the freeze, not after it', () => {
  const rows = buildRows({
    charters: OFFSET_CHARTERS,
    branches: [
      // 57 minutes BEFORE the 18:28:03Z freeze, and after it as text.
      { branch: 'ursa-engineer/a', createdAt: '2026-10-09T17:31:08Z' },
      // 32 minutes after it, by both readings.
      { branch: 'ursa-engineer/b', createdAt: '2026-10-09T19:00:00Z' }
    ],
    nowIso: '2026-11-02T00:00:00Z'
  })
  assert.equal(rows.find((r) => r.seat === 'engineer').runsHandedStale, 1)
})

test('at zero offset the suffix decides, and `+` sorts below `Z`', () => {
  const rows = buildRows({
    charters: OFFSET_CHARTERS,
    // The same instant as the freeze, rendered by the other producer. It is
    // not after it, and as text `...50Z` > `...50+00:00`.
    branches: [{ branch: 'ursa-exo/a', createdAt: '2026-10-18T18:50:50Z' }],
    nowIso: '2026-11-02T00:00:00Z'
  })
  assert.equal(rows.find((r) => r.seat === 'exo').runsHandedStale, 0)
})

test('the day column is the UTC day of the instant, not its leading ten characters', () => {
  assert.equal(utcDay('2026-11-01T23:34:57-05:00'), '2026-11-02')
  assert.equal(utcDay('2026-10-09T12:28:03-06:00'), '2026-10-09')
  assert.equal(utcDay('2026-10-18T18:50:50+00:00'), '2026-10-18')
  // null, not '?': see the import note above. The '?' is asserted on the
  // formatter, which is the only place it is a correct answer.
  assert.equal(utcDay('not a date'), null)
  assert.match(formatTable(buildRows({
    charters: [{ seat: 'engineer', path: 'prompts/engineer-agent.md', mainDate: 'not a date', mainLines: 1, queue: null }],
    branches: [],
    nowIso: '2026-11-02T06:00:00Z'
  })), /\?/)
})

test('formatTable itself renders the UTC day, and not the string it was handed', () => {
  // Rehearsed red separately from the utcDay test above: that one asserts on
  // the exported helper, so it stays green while the formatter regresses.
  const out = formatTable(buildRows({
    charters: [{
      seat: 'engineer',
      path: 'prompts/engineer-agent.md',
      // 23:34:57-05:00 is 04:34:57Z the NEXT day, so the two readings differ.
      mainDate: '2026-11-01T23:34:57-05:00',
      mainLines: 342,
      queue: null
    }],
    branches: [],
    nowIso: '2026-11-02T06:00:00Z'
  }))
  assert.match(out, /2026-11-02/)
  assert.doesNotMatch(out, /2026-11-01/)
})
