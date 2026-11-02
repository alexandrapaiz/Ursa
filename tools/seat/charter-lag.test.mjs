#!/usr/bin/env node --test
// node --test tools/seat/charter-lag.test.mjs
//
// Everything here is pure. The clone-dependent half of charter-lag.mjs is
// exercised by the positive control in docs/agents/runner-facts.md, which
// runs the tool against a deliberately shallow single-branch clone and
// asserts it refuses to print a table.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { seatOfBranch, lagDays, buildRows, formatTable, cloneFitness, utcDay, copiesOf, selectCopies, selectionFaults } from './charter-lag.mjs'

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
  // A charter with no open copy renders every queue-side column as a dash or
  // a zero, and the count of them is part of the contract: `copies` is 0 and
  // not a dash, because zero copies is a measured number and the two
  // identifier columns are the ones that have no value to render.
  assert.match(lines[3], /\s0\s+-\s+-\s+0\s+0\s+0$/)
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
  assert.equal(utcDay('not a date'), '?')
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

// --- the selection control (added 2026-11-02, eighty-seventh window) -------
//
// Every assertion below is the measurement that found the defect, frozen as a
// fixture. The numbers are this repository's own at 2026-11-02T08:00Z: exo's
// charter stood at 2,221 lines on `main`, 2,312 on the newest open copy #714
// and 8,726 on the older #699.

const EXO_COPIES = [{ number: 714, lines: 2312 }, { number: 699, lines: 8726 }]

test('copiesOf accepts the single-pick shape as the one-copy case, not as absence', () => {
  assert.deepEqual(copiesOf({ copies: EXO_COPIES }), EXO_COPIES)
  assert.deepEqual(copiesOf({ queue: { number: 618, lines: 328 } }), [{ number: 618, lines: 328 }])
  assert.deepEqual(copiesOf({ queue: null }), [])
  assert.deepEqual(copiesOf({}), [])
})

test('selectCopies returns both selectors, and they disagree on the real pair', () => {
  const { newest, deepest, count } = selectCopies(EXO_COPIES)
  assert.equal(count, 2)
  assert.equal(newest.number, 714)
  assert.equal(deepest.number, 699)
  // The order the caller hands them in must not decide the answer, because
  // the collector walks open pull requests newest-first and a later one may
  // walk them in any order.
  const reversed = selectCopies([...EXO_COPIES].reverse())
  assert.equal(reversed.newest.number, 714)
  assert.equal(reversed.deepest.number, 699)
})

test('the row carries both readings and the difference between them', () => {
  const rows = buildRows({
    charters: [{
      seat: 'exo',
      path: 'prompts/exo-agent.md',
      mainDate: '2026-10-18T00:00:00Z',
      mainLines: 2221,
      copies: EXO_COPIES
    }],
    branches: [],
    nowIso: '2026-11-02T08:00:00Z'
  })
  const exo = rows[0]
  assert.equal(exo.queueCopies, 2)
  assert.equal(exo.queuePr, 699)
  assert.equal(exo.newestPr, 714)
  assert.equal(exo.pendingLines, 6505)
  assert.equal(exo.recencyPendingLines, 91)
  assert.equal(exo.selectionLoss, 6414)
})

test('selectionFaults is empty when recency and depth agree, and names the pair when they do not', () => {
  const agree = buildRows({
    charters: [{
      seat: 'skill',
      path: 'prompts/skill-agent.md',
      mainDate: '2026-10-09T00:00:00Z',
      mainLines: 236,
      copies: [{ number: 699, lines: 328 }]
    }],
    branches: [],
    nowIso: '2026-11-02T08:00:00Z'
  })
  assert.deepEqual(selectionFaults(agree), [])

  const split = buildRows({
    charters: [{
      seat: 'exo',
      path: 'prompts/exo-agent.md',
      mainDate: '2026-10-18T00:00:00Z',
      mainLines: 2221,
      copies: EXO_COPIES
    }],
    branches: [],
    nowIso: '2026-11-02T08:00:00Z'
  })
  const faults = selectionFaults(split)
  assert.equal(faults.length, 1)
  assert.match(faults[0], /exo #714->#699/)
  assert.match(faults[0], /6414 fewer pending lines/)
  // The fault must not promise that the deepest copy is the one to read,
  // because depth is not containment: measured the same day, #714 held 154
  // normalised lines #699 does not.
  assert.match(faults[0], /depth is not containment/)
})

test('a charter with two copies of equal length still reports one fault-free row', () => {
  const rows = buildRows({
    charters: [{
      seat: 'pm',
      path: 'prompts/pm-agent.md',
      mainDate: '2026-10-05T00:00:00Z',
      mainLines: 390,
      copies: [{ number: 700, lines: 512 }, { number: 650, lines: 512 }]
    }],
    branches: [],
    nowIso: '2026-11-02T08:00:00Z'
  })
  // Equal lines means the sort is stable on the first element, so deepest and
  // newest resolve to the same pull request and nothing is lost. Two copies
  // is still reported, because the reader has two files to read either way.
  assert.equal(rows[0].queueCopies, 2)
  assert.equal(rows[0].selectionLoss, 0)
  assert.deepEqual(selectionFaults(rows), [])
})
