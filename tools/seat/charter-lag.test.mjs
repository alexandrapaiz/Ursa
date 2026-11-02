#!/usr/bin/env node --test
// node --test tools/seat/charter-lag.test.mjs
//
// Everything here is pure. The clone-dependent half of charter-lag.mjs is
// exercised by the positive control in docs/agents/runner-facts.md, which
// runs the tool against a deliberately shallow single-branch clone and
// asserts it refuses to print a table.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { seatOfBranch, lagDays, buildRows, formatTable, formatSummary, cloneFitness } from './charter-lag.mjs'

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
  assert.match(shallow[0], /^depth:/)
  // The clone this host hands a seat fails both properties at once, and the
  // single-branch refspec fails breadth twice: no refs/prs and one origin ref.
  const handed = cloneFitness({ shallow: true, prRefs: 0, originRefs: 1 })
  assert.equal(handed.length, 3)
  assert.equal(handed.filter((f) => f.startsWith('breadth:')).length, 2)
})
