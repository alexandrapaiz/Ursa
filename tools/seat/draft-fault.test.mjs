#!/usr/bin/env node --test
// node --test tools/seat/draft-fault.test.mjs
//
// Everything here is pure: no `gh`, no network, no clone. The live half is
// one GraphQL read, and the only thing it can get wrong that these tests
// cannot see is the shape of the response, which `readOpenPrs` asserts on
// and the positive control at the bottom of this file replays from a
// recorded body.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  draftFault, silencesInWindow, thresholdFault, buildRows, formatTable,
  readOpenPrs, oneRunWindowFault, MEASURED
} from './draft-fault.mjs'
import { summarise, quantile } from './draft-fault-measure.mjs'

// The night this tool comes from, as data. Pull request 661 on branch
// ursa-engineer/2026-11-02-message-6: four commits, a death call from a
// sibling seat between the third and the fourth, and the run readying its own
// pull request five minutes after that call.
const SIX = {
  branch: 'ursa-engineer/2026-11-02-message-6',
  number: 661,
  commits: [
    '2026-11-02T02:43:54Z',
    '2026-11-02T02:50:20Z',
    '2026-11-02T02:56:20Z',
    '2026-11-02T03:03:46Z'
  ],
  openedAt: '2026-11-02T02:44:08Z',
  deathCallAt: '2026-11-02T03:03:08Z',
  readiedAt: '2026-11-02T03:08:11Z'
}

test('the call that produced this tool is refused at the moment it was made', () => {
  const draft = { number: SIX.number, branch: SIX.branch, lastCommitAt: SIX.commits[2] }
  // At 03:03:08 the newest engineer push anywhere was this draft's own tip.
  const activity = [
    { branch: SIX.branch, at: SIX.commits[2] },
    { branch: 'ursa-pm/2026-11-02-message-6', at: '2026-11-02T03:02:33Z' },
    { branch: 'ursa-security/2026-11-02-message-3', at: '2026-11-02T02:41:00Z' }
  ]
  const fault = draftFault(draft, activity, SIX.deathCallAt)
  assert.ok(fault, 'a death call with no sibling-branch evidence must be refused')
  assert.match(fault, /may be mid-turn/)
  assert.match(fault, /6\.8 min of silence/)
  assert.match(fault, /661/)
})

test('the run proved itself alive 38 seconds and 5 minutes after that call', () => {
  // Not a property of the tool, a property of the record it was built from.
  const call = Date.parse(SIX.deathCallAt)
  assert.ok(Date.parse(SIX.commits[3]) - call === 38_000)
  assert.ok(Date.parse(SIX.readiedAt) - call === 303_000)
})

test('the threshold applied was shorter than silences the same run had already shown', () => {
  const gaps = silencesInWindow(SIX.commits, SIX.openedAt, SIX.readiedAt)
  // Gaps bounded by the open and the ready, so each one is a live-run silence.
  // Four and not five: the first commit lands 14 seconds BEFORE the pull
  // request exists, because ship-first pushes the branch and then creates the
  // pull request, so it falls outside the window the caller asked for.
  const mins = gaps.map((g) => Math.round(g * 100) / 100)
  assert.deepEqual(mins, [6.2, 6, 7.43, 4.42])
  assert.ok(Math.max(...mins) < MEASURED.silenceP99Min, 'this run was unremarkable in its pace')
  assert.ok(Date.parse(SIX.commits[0]) < Date.parse(SIX.openedAt))
  const calledDeadAt = (Date.parse(SIX.deathCallAt) - Date.parse(SIX.commits[2])) / 60_000
  assert.ok(calledDeadAt < Math.max(...mins),
    'the death threshold was inside the distribution of the very pull request it judged')
})

test('a sibling branch newer than this draft is the evidence that licenses a reader', () => {
  const draft = { number: 661, branch: SIX.branch, lastCommitAt: SIX.commits[3] }
  const activity = [
    { branch: SIX.branch, at: SIX.commits[3] },
    { branch: 'ursa-engineer/2026-11-02-message-7', at: '2026-11-02T03:12:57Z' }
  ]
  assert.equal(draftFault(draft, activity, '2026-11-02T03:20:00Z'), null)
})

test('a sibling branch OLDER than this draft licenses nothing', () => {
  const draft = { number: 661, branch: SIX.branch, lastCommitAt: SIX.commits[3] }
  const activity = [
    { branch: SIX.branch, at: SIX.commits[3] },
    { branch: 'ursa-engineer/2026-11-01-hook', at: '2026-11-01T22:00:00Z' }
  ]
  assert.ok(draftFault(draft, activity, '2026-11-02T03:20:00Z'))
})

test('another seat being busy is not evidence about this seat', () => {
  const draft = { number: 661, branch: SIX.branch, lastCommitAt: SIX.commits[3] }
  const activity = [
    { branch: SIX.branch, at: SIX.commits[3] },
    { branch: 'ursa-skill/2026-11-02-message-9', at: '2026-11-02T03:30:00Z' }
  ]
  assert.ok(draftFault(draft, activity, '2026-11-02T03:31:00Z'),
    'seatOfBranch must keep the skill seat out of the engineer seat activity set')
})

test('the frontend seat is the case any threshold under an hour gets wrong', () => {
  // #642: opened 01:05:02, nothing pushed until 02:02:36, readied 02:12:35.
  const draft = { number: 642, branch: 'ursa-frontend/2026-11-02-message-b', lastCommitAt: '2026-11-02T01:05:02Z' }
  const activity = [{ branch: 'ursa-frontend/2026-11-02-message-b', at: '2026-11-02T01:05:02Z' }]
  // A reader at 02:00, 55 minutes into the silence, one minute before the push.
  assert.ok(draftFault(draft, activity, '2026-11-02T02:00:00Z'))
  assert.equal(MEASURED.silenceMaxPr, 642)
  assert.equal(MEASURED.silenceMaxMin, 57.57)
})

test('a day of silence resolves a draft without any sibling branch', () => {
  const draft = { number: 500, branch: 'ursa-engineer/2026-10-28-message', lastCommitAt: '2026-10-28T04:00:00Z' }
  assert.equal(draftFault(draft, [], '2026-10-29T05:00:00Z'), null)
  assert.ok(draftFault(draft, [], '2026-10-28T20:00:00Z'), 'sixteen hours is under the one-day bound')
})

test('thresholdFault refuses the numbers that failed, and says what to use instead', () => {
  assert.ok(thresholdFault(8))
  assert.match(thresholdFault(8), /642 was silent for 57\.57 minutes/)
  assert.ok(thresholdFault(MEASURED.silenceMaxMin), 'the measured maximum itself is not above itself')
  assert.equal(thresholdFault(1440), null)
  assert.match(thresholdFault(0), /positive number of minutes/)
  assert.match(thresholdFault('soon'), /positive number of minutes/)
})

test('draftFault refuses to run at all under a threshold its own measurement rejects', () => {
  const draft = { number: 661, branch: SIX.branch, lastCommitAt: SIX.commits[3] }
  const activity = [{ branch: 'ursa-engineer/2026-11-02-message-7', at: '2026-11-02T03:12:57Z' }]
  // Sibling evidence would otherwise license it. The bad bound still wins.
  const fault = draftFault(draft, activity, '2026-11-02T03:20:00Z', { staleMinutes: 10 })
  assert.match(fault, /10 minutes of silence is not evidence/)
})

test('a branch naming no seat is refused rather than guessed at', () => {
  const fault = draftFault({ number: 1, branch: 'main', lastCommitAt: '2026-11-02T03:00:00Z' }, [], '2026-11-02T03:01:00Z')
  assert.match(fault, /names no seat/)
  assert.match(fault, /asking the owner/)
})

test('a draft with no commit read is refused unless a sibling branch is newer', () => {
  const draft = { number: 700, branch: 'ursa-engineer/2026-11-02-message-9', lastCommitAt: null }
  assert.ok(draftFault(draft, [], '2026-11-02T03:00:00Z'))
  assert.equal(
    draftFault(draft, [{ branch: 'ursa-engineer/2026-11-02-message-10', at: '2026-11-02T03:00:00Z' }], '2026-11-02T03:01:00Z'),
    null
  )
})

test('silencesInWindow drops everything outside the one-run window', () => {
  // A stacked branch carries its parent's commits, which is the contamination
  // that put a 5.8-day "live silence" in the first pass of this measurement.
  const gaps = silencesInWindow(
    ['2026-10-27T01:00:00Z', '2026-11-02T02:50:00Z'],
    '2026-11-02T02:44:00Z',
    '2026-11-02T03:08:00Z'
  )
  assert.deepEqual(gaps.map((g) => Math.round(g)), [6, 18])
})

test('silencesInWindow refuses a window that runs backwards', () => {
  assert.deepEqual(silencesInWindow([], '2026-11-02T03:00:00Z', '2026-11-02T02:00:00Z'), [])
})

test('readOpenPrs reads the recorded response shape, and names a wrong one', () => {
  const recorded = {
    data: { repository: { pullRequests: { nodes: [
      { number: 665, isDraft: true, headRefName: 'ursa-engineer/2026-11-02-message-7', createdAt: '2026-11-02T03:13:17Z', commits: { nodes: [{ commit: { committedDate: '2026-11-02T03:12:57Z' } }] } },
      { number: 662, isDraft: false, headRefName: 'ursa-exo/2026-11-02-message-2', createdAt: '2026-11-02T02:30:00Z', commits: { nodes: [] } }
    ] } } }
  }
  const prs = readOpenPrs(recorded)
  assert.equal(prs.length, 2)
  assert.equal(prs[0].lastCommitAt, '2026-11-02T03:12:57Z')
  assert.equal(prs[1].lastCommitAt, null, 'an empty commits list is null, never a crash')
  assert.throws(() => readOpenPrs({ data: { repository: null } }), /no pullRequests\.nodes/)
})

test('the table states the verdict in a cell and the reason in full underneath', () => {
  const rows = buildRows({
    drafts: [{ number: 661, branch: SIX.branch, lastCommitAt: SIX.commits[2] }],
    activity: [{ branch: SIX.branch, at: SIX.commits[2] }],
    nowIso: SIX.deathCallAt,
    staleMinutes: 1440
  })
  assert.equal(rows[0].licensed, false)
  assert.equal(rows[0].seat, 'engineer')
  assert.equal(rows[0].silenceMin, 6.8)
  const out = formatTable(rows)
  assert.match(out, /no, refused/)
  assert.match(out, /may be mid-turn/)
  // No cell is a bare number without its unit, and no heading is a bare noun.
  assert.match(out, /a reader may resolve it/)
  assert.match(out, /6\.8 min/)
})

test('the measured block and the prose cannot drift, because both read this object', () => {
  assert.equal(MEASURED.silenceMaxMin, 57.57)
  assert.equal(MEASURED.oneRunWindows, 34)
  assert.equal(MEASURED.silences, 116)
  assert.equal(MEASURED.seatsRepresented, 9)
  assert.ok(MEASURED.misreadSilenceMin < MEASURED.silenceP90Min,
    'the silence read as death is below this repository is own p90, which is the finding')
})

// --- the exclusions that make the measurement a measurement ---------------

test('oneRunWindowFault keeps the 67-minute frontend window, which is the whole point', () => {
  const w = {
    number: 642,
    branch: 'ursa-frontend/2026-11-02-message-b',
    createdAt: '2026-11-02T01:05:33Z',
    readyAt: '2026-11-02T02:12:35Z',
    commitDates: ['2026-11-02T01:05:02Z', '2026-11-02T02:02:36Z']
  }
  // The next frontend run's first commit lands AFTER the ready, so it does not
  // break the window; that is exactly what pins those 67 minutes to one run.
  const activity = [
    ...w.commitDates.map((at) => ({ branch: w.branch, at })),
    { branch: 'ursa-frontend/2026-11-02-message-c', at: '2026-11-02T02:13:40Z' }
  ]
  assert.equal(oneRunWindowFault(w, activity), null)
  assert.equal(Math.round(Math.max(...silencesInWindow(w.commitDates, w.commitDates[0], w.readyAt)) * 100) / 100, 57.57)
})

test('oneRunWindowFault drops the two shapes that faked a multi-hour live silence', () => {
  // A stacked branch: the pull request is opened at 20:01 over commits from 10:27.
  assert.match(oneRunWindowFault({
    number: 548,
    branch: 'ursa-exo/2026-10-26-message-10',
    createdAt: '2026-10-26T20:01:35Z',
    readyAt: '2026-10-26T20:30:00Z',
    commitDates: ['2026-10-26T10:27:53Z', '2026-10-26T15:08:54Z']
  }, []), /predates the pull request/)

  // A lane rather than a run: no date in the branch name.
  assert.match(oneRunWindowFault({
    number: 611,
    branch: 'distribution/vendored-pm',
    createdAt: '2026-11-01T14:13:28Z',
    readyAt: '2026-11-01T23:30:00Z',
    commitDates: ['2026-11-01T14:13:25Z', '2026-11-01T23:22:46Z']
  }, []), /carries no run date/)
})

test('oneRunWindowFault drops a window the same seat worked around', () => {
  const w = {
    number: 400,
    branch: 'ursa-engineer/2026-10-30-message',
    createdAt: '2026-10-30T01:00:00Z',
    readyAt: '2026-10-30T02:00:00Z',
    commitDates: ['2026-10-30T00:59:50Z', '2026-10-30T01:58:00Z']
  }
  assert.equal(oneRunWindowFault(w, w.commitDates.map((at) => ({ branch: w.branch, at }))), null)
  assert.match(oneRunWindowFault(w, [
    ...w.commitDates.map((at) => ({ branch: w.branch, at })),
    { branch: 'ursa-engineer/2026-10-30-message-2', at: '2026-10-30T01:30:00Z' }
  ]), /committed to another branch inside the window/)
})

test('oneRunWindowFault refuses a pull request that was never a readied draft', () => {
  assert.match(oneRunWindowFault({ number: 1, branch: 'ursa-pm/2026-11-02-message', createdAt: '2026-11-02T01:00:00Z', readyAt: null, commitDates: ['2026-11-02T01:00:00Z'] }, []), /never a readied draft/)
})

test('summarise prints its exclusions rather than only applying them', () => {
  const prs = [
    { number: 642, branch: 'ursa-frontend/2026-11-02-message-b', createdAt: '2026-11-02T01:05:33Z', readyAt: '2026-11-02T02:12:35Z', commitDates: ['2026-11-02T01:05:02Z', '2026-11-02T02:02:36Z'] },
    { number: 611, branch: 'distribution/vendored-pm', createdAt: '2026-11-01T14:13:28Z', readyAt: '2026-11-01T23:30:00Z', commitDates: ['2026-11-01T14:13:25Z'] },
    { number: 662, branch: 'ursa-exo/2026-11-02-message-2', createdAt: '2026-11-02T02:30:00Z', readyAt: null, commitDates: ['2026-11-02T02:29:00Z'] }
  ]
  const s = summarise(prs)
  assert.equal(s.prsRead, 3)
  assert.equal(s.oneRunWindows, 1)
  assert.equal(s.silenceMaxMin, 57.57)
  assert.equal(s.silenceMaxPr, 642)
  assert.deepEqual(s.dropped.map((d) => d.n), [1, 1])
  assert.ok(s.dropped.some((d) => /carries no run date/.test(d.why)))
  assert.ok(s.dropped.some((d) => /never a readied draft/.test(d.why)))
})
