#!/usr/bin/env node --test
// node --test tools/seat/charter-lag.test.mjs
//
// Everything here is pure. The clone-dependent half of charter-lag.mjs is
// exercised by the positive control in docs/agents/runner-facts.md, which
// runs the tool against a deliberately shallow single-branch clone and
// asserts it refuses to print a table.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { seatOfBranch, lagDays, buildRows, formatTable, formatSummary, cloneFitness, dayCell, copiesOf, selectCopies, selectionFaults, queueScan, lineCount } from './charter-lag.mjs'

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
  // The last column is `<numerator>/<denominator>` and not a bare count, so
  // the row ends in a share. The denominator is this seat's own restoration;
  // see `seatBranches` in buildRows.
  assert.match(lines[3], /\s0\s+-\s+-\s+0\s+0\s+\d+\/\d+$/)
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
  // line `main()` printed under every fault until 2026-11-02, the second half
  // here fails, because that script's own header says it does not fetch
  // refs/pull/*.
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
  // RENAMED FROM `utcDay` TO `dayCell` ON 2026-11-09, and the rename is the
  // finding rather than cosmetics. `tools/instant.mjs` exports its own
  // `utcDay`, which answers `null` where this one answers `'?'`, so this file
  // imported one of two same-named functions and nothing but the import line
  // said which. `dayCell` now delegates to `calendarDay` and keeps the `'?'`,
  // because the placeholder is a rendering choice belonging to `formatTable`.
  assert.equal(dayCell('2026-11-01T23:34:57-05:00'), '2026-11-02')
  assert.equal(dayCell('2026-10-09T12:28:03-06:00'), '2026-10-09')
  assert.equal(dayCell('2026-10-18T18:50:50+00:00'), '2026-10-18')
  assert.equal(dayCell('not a date'), '?')
  // Narrowed by the delegation, in the one direction worth narrowing. The
  // local `Date.parse` read a zoneless timestamp in the RUNNER's timezone and
  // answered a day that depended on where the process ran. `calendarDay`
  // refuses it, so the cell says it does not know.
  assert.equal(dayCell('2026-11-02T04:34:57'), '?')
  // And a bare day passes through, which the old one also did by way of
  // `Date.parse` reading it as UTC midnight. Same answer, now on purpose.
  assert.equal(dayCell('2026-11-02'), '2026-11-02')
})

test('formatTable itself renders the UTC day, and not the string it was handed', () => {
  // Rehearsed red separately from the dayCell test above: that one asserts on
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

const MAIN_REV = 'refs/remotes/origin/main'
const CHARTER = 'prompts/engineer-agent.md'

test('queueScan returns every open row that touches the charter, and counts what it scanned', () => {
  const scan = queueScan(CHARTER, [700, 690, 680], io({
    refs: ['refs/prs/700', 'refs/prs/690', 'refs/prs/680'],
    bases: { 'refs/prs/700': 'abc', 'refs/prs/690': 'abc', 'refs/prs/680': 'abc' },
    touched: { 'refs/prs/690': true, 'refs/prs/680': true },
    lines: { [MAIN_REV]: 342, 'refs/prs/690': 980, 'refs/prs/680': 900 }
  }), MAIN_REV)
  assert.deepEqual(scan.copies, [{ number: 690, lines: 980 }, { number: 680, lines: 900 }])
  assert.equal(scan.scanned, 3)
  assert.deepEqual(scan.skipped, [])
  assert.deepEqual(scan.degraded, [])
})

test('a missing refs/prs/<n> is counted and named, not dropped', () => {
  // Rehearsed red: with `if (!...) continue` and no census, `skipped` does not
  // exist and this scan is indistinguishable from the one below it, where
  // every row is present and genuinely does not touch the charter.
  const absent = queueScan(CHARTER, [700, 690], io({
    refs: [], bases: {}, touched: {}, lines: { [MAIN_REV]: 342 }
  }), MAIN_REV)
  assert.deepEqual(absent.copies, [])
  assert.equal(absent.scanned, 0)
  assert.deepEqual(absent.skipped, [{ pr: 700, cause: 'no-ref' }, { pr: 690, cause: 'no-ref' }])

  const present = queueScan(CHARTER, [700, 690], io({
    refs: ['refs/prs/700', 'refs/prs/690'],
    bases: { 'refs/prs/700': 'abc', 'refs/prs/690': 'abc' },
    touched: {},
    lines: { [MAIN_REV]: 342 }
  }), MAIN_REV)
  assert.deepEqual(present.copies, [])
  assert.equal(present.scanned, 2)
  assert.deepEqual(present.skipped, [])
  // Identical `copies`. Only the census separates them, which is the point.
  assert.notDeepEqual(absent.skipped, present.skipped)
})

test('an unanswerable merge base degrades to a blob comparison and says which rows it did that for', () => {
  const scan = queueScan(CHARTER, [700], io({
    refs: ['refs/prs/700'],
    bases: {},                       // merge-base printed nothing
    touched: {},                     // so no diff was ever taken
    lines: { [MAIN_REV]: 342, 'refs/prs/700': 980 }
  }), MAIN_REV)
  assert.deepEqual(scan.copies, [{ number: 700, lines: 980 }])
  assert.deepEqual(scan.degraded, [700])
})

test('a degraded row whose charter is byte-identical to main is not a copy, and one unreadable at all is not guessed', () => {
  const same = queueScan(CHARTER, [700], io({
    refs: ['refs/prs/700'], bases: {}, touched: {}, lines: { [MAIN_REV]: 342, 'refs/prs/700': 342 }
  }), MAIN_REV)
  assert.deepEqual(same.copies, [])
  assert.deepEqual(same.degraded, [700])

  const unreadable = queueScan(CHARTER, [700], io({
    refs: ['refs/prs/700'], bases: {}, touched: {}, lines: { [MAIN_REV]: 342 }
  }), MAIN_REV)
  assert.deepEqual(unreadable.copies, [])
  assert.deepEqual(unreadable.degraded, [700])
})

// --- the summary, restored and extended ---------------------------------

const SUMMARY_ROWS = () => buildRows({
  charters: [{
    seat: 'engineer', path: CHARTER, mainDate: '2026-10-09T18:28:03Z', mainLines: 342, copies: []
  }],
  branches: [{ branch: 'ursa-engineer/a', createdAt: '2026-10-10T00:00:00Z' }],
  nowIso: '2026-11-02T08:00:00Z'
})

test('the summary distinguishes a queue with nothing in it from a queue it could not read', () => {
  const rows = SUMMARY_ROWS()
  const clean = formatSummary(rows, {
    nowIso: '2026-11-02T08:00:00Z',
    branchRead: { pullRequestsRead: 60, limit: 1000, capped: false },
    queueRead: { openPrs: 60, skipped: 0, degraded: [] }
  })
  assert.match(clean, /60 open pull requests scanned for charter edits, none skipped/)
  assert.doesNotMatch(clean, /floor\b.*SKIPPED/)

  const blind = formatSummary(rows, {
    nowIso: '2026-11-02T08:00:00Z',
    branchRead: { pullRequestsRead: 60, limit: 1000, capped: false },
    queueRead: { openPrs: 60, skipped: 60, degraded: [] }
  })
  assert.match(blind, /60 of them SKIPPED for a missing refs\/prs/)

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

test('the summary states the instant it was read at, and names a capped branch read as a floor', () => {
  // Both restored from this seat's #679/#694 lineage, which the trunk's
  // 2026-11-02 rewrite of this file was written against an older base and
  // lost: the table printed ages and no instant, so a pasted copy read as
  // current at any later hour, and `stale runs` was a bare numerator drawn
  // from a `gh pr list --limit 1000` that truncates silently.
  const rows = SUMMARY_ROWS()
  const out = formatSummary(rows, {
    nowIso: '2026-11-02T08:00:00Z',
    branchRead: { pullRequestsRead: 60, limit: 1000, capped: false },
    queueRead: { openPrs: 60, skipped: 0, degraded: [] }
  })
  assert.match(out, /read at 2026-11-02T08:00:00Z/)
  assert.match(out, /1 of 1 branches of these seats opened after their own seat's charter froze, from 60 pull requests read/)
  assert.doesNotMatch(out, /ROW LIMIT/)

  const capped = formatSummary(rows, {
    nowIso: '2026-11-02T08:00:00Z',
    branchRead: { pullRequestsRead: 1000, limit: 1000, capped: true },
    queueRead: { openPrs: 60, skipped: 0, degraded: [] }
  })
  assert.match(capped, /AT THE 1000-ROW LIMIT/)
  assert.match(capped, /every count below is a floor/)
})

// --- the reader, on an input larger than Node's default buffer ------------

test('lineCount reads a blob past the 1 MiB default buffer instead of answering null', (t) => {
  // BEHAVIOURAL, not a check that the option is spelled somewhere. Node's
  // `execFileSync` default `maxBuffer` is 1 MiB and exceeding it throws, which
  // this file's `allowFail: true` converts into `null` -- the same answer as
  // "the path is not at this revision". So a charter that merely got large
  // would read as absent, with no error anywhere.
  //
  // `docs/ideas.md` is this repository's own input past that bound, which is
  // why it is the fixture: no file has to be generated and the test is red for
  // a real reason. Skipped rather than passed if it ever shrinks back under
  // the bound, because then it proves nothing.
  const bytes = execFileSync('git', ['show', 'HEAD:docs/ideas.md'], {
    encoding: 'utf8', maxBuffer: 1 << 28
  }).length
  if (bytes <= 1024 * 1024) {
    return t.skip(`docs/ideas.md is ${bytes} bytes, under the 1 MiB default, so this cannot measure the bound`)
  }
  const n = lineCount('HEAD', 'docs/ideas.md')
  assert.notEqual(n, null,
    'lineCount answered null for a path that is present: the read hit maxBuffer and allowFail swallowed it')
  assert.ok(n > 1000, `expected the ledger to have more than a thousand lines, got ${n}`)
  // And the absent case still answers null, so the fix did not make the
  // reader credulous.
  assert.equal(lineCount('HEAD', 'docs/no-such-file-ever.md'), null)
})
