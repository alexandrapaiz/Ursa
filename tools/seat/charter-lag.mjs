#!/usr/bin/env node
// How stale is the charter each seat's run is actually handed?
//
//   node tools/seat/charter-lag.mjs              # the table
//   node tools/seat/charter-lag.mjs --json
//   node tools/seat/charter-lag.mjs --seat skill
//   node tools/seat/charter-lag.mjs --max-lag-days 7   # exit 1 over the bound
//
// Exit 0 the table printed. Exit 1 the bound was exceeded under
// --max-lag-days. Exit 2 the clone cannot answer the question (see the
// positive control below).
//
// WHY THIS EXISTS. A charter amendment is not in force when it is written;
// it is in force when it is merged, because every seat on this host is
// handed a fresh clone of `main` and reads its charter from that clone. The
// ExO seat's whole instrument for improving the other ten seats is
// `prompts/*-agent.md`, which is an owner-only path.
//
// On 2026-11-02 the measurement this file automates read:
//
//   prompts/exo-agent.md      last reached main 2026-10-18   (2,221 lines)
//   the newest copy in the open queue                        (7,732 lines)
//   seven of the ten sibling charters last reached main 2026-10-05
//   382 sibling-seat branches opened since their own charter froze
//
// So eleven charters' worth of all-seats rules were written, and 382 runs
// were handed copies without them. Nobody was withholding anything; the
// freeze was simply not on any instrument. The ExO charter measures the
// merge queue's depth, each pull request's age, and the portfolio's run
// counts. It had no reading for the age of its own output surface, which is
// the one number that decides whether any of its work binds.
//
// THE POSITIVE CONTROL, which is most of the code here. Two properties of
// this host's clone make this question answerable incorrectly rather than
// unanswerably:
//
//   depth    the checkout is one commit deep, so `git log -1 -- <path>`
//            reports the clone's own graft commit for every file and every
//            charter reads as changed today. Lag 0 across the board, from a
//            clone that cannot see a single one of the commits involved.
//   breadth  the handed refspec is `+refs/heads/main:refs/remotes/origin/main`,
//            so no `origin/<branch>` but main resolves and `refs/prs/*` is
//            empty. The queue side of every row reads as absent, which is
//            indistinguishable from a queue with nothing in it.
//
// Both failures are silent and both are quiet in the direction that says
// everything is fine, so this tool refuses to print a table until it has
// proved it can see both sides. `tools/ensure-full-clone.sh` is the repair.
import { execFileSync } from 'node:child_process'
import { readdirSync } from 'node:fs'
import { isAfter, parseEpochSeconds, parseInstant, toUtcInstant, utcDay } from '../instant.mjs'

const MS_PER_DAY = 86400000

function git (args, { allowFail = false } = {}) {
  try {
    return execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim()
  } catch (err) {
    if (allowFail) return null
    throw err
  }
}

// --- pure core, so the test needs no clone and no network ----------------

// A branch name belongs to a seat when the seat is the whole first path
// segment, optionally behind a company prefix. The bare-substring form this
// org used until 2026-10-27 claims other seats' branches: `ursa-security/x`
// matches a test for `sec`, and `ursa-frontend/x` matches `fe`.
export function seatOfBranch (branch) {
  const m = /^(?:[a-z0-9-]+-)?([a-z0-9]+)\//.exec(branch)
  return m ? m[1] : null
}

// Offset-aware on both sides, which `Date.parse` already was: this is the one
// date path in this file that never had the ordering defect, and it is worth
// saying out loud that the lag column was right while the two columns beside
// it were wrong, so the table disagreed with itself and nothing in it looked
// broken.
//
// What it did have was the laxer half of the same family. `Date.parse` accepts
// a bare `2026-10-09` and reads it as UTC midnight, so a charter date that had
// lost its time of day would still produce a confident age to one decimal
// place. `parseInstant` refuses it, and `null` propagates to a `?` in the
// table. A day is not an instant and an age computed from one is a guess
// wearing a number.
export function lagDays (frozenAt, now) {
  const a = parseInstant(frozenAt)
  const b = parseInstant(now)
  if (a === null || b === null) return null
  return (b - a) / MS_PER_DAY
}

// One row per charter. `queue` is null when no open pull request touches the
// file, which is a different row from a queue this clone cannot see; the
// caller proves it can see the queue before it calls this.
//
// WHY `isAfter` AND NOT `>`, measured on this repository on 2026-11-02. The
// two operands come from two producers that spell the same instant
// differently: `b.createdAt` is GitHub's `2026-11-02T04:34:57Z` and
// `c.mainDate` was git's `--format=%cI`, which for 330 of the 2,134 commits
// on `origin/main` carries a non-zero offset and for all of them spells UTC
// `+00:00` rather than `Z`. `>` between those is a comparison of spellings.
//
// It had a live cost. `prompts/engineer-agent.md` last reached main at
// `2026-10-09T12:28:03-06:00`, which is `18:28:03Z`, and the branch
// `engineer/2026-10-09-briefing-cost-and-stdio-probe` opened at
// `2026-10-09T17:31:08Z`, 57 minutes BEFORE the freeze. As text it sorted
// after, so this tool counted it among the runs handed a stale charter: 73
// reported where 72 is the truth, on this seat's own row. One row of 496
// today, and the error has no bound other than the largest offset in the
// history, which here is six hours.
//
// `runsHandedStale` is also a numerator, so the row carries
// `seatBranches` beside it. A count whose denominator is not printed cannot
// be read as a rate, and this one is drawn from a `gh pr list --limit 1000`
// that silently truncates; `branchesConsidered` on the summary is what makes
// a cap visible as a cap rather than as a quiet floor.
export function buildRows ({ charters, branches, nowIso }) {
  return charters.map((c) => {
    const lag = lagDays(c.mainDate, nowIso)
    const mine = branches.filter((b) => seatOfBranch(b.branch) === c.seat)
    const since = mine.filter((b) => isAfter(b.createdAt, c.mainDate))
    return {
      seat: c.seat,
      path: c.path,
      mainDate: c.mainDate,
      mainDateUtc: toUtcInstant(c.mainDate),
      mainLines: c.mainLines,
      lagDays: lag === null ? null : Math.round(lag * 10) / 10,
      queuePr: c.queue ? c.queue.number : null,
      queueLines: c.queue ? c.queue.lines : null,
      pendingLines: c.queue ? c.queue.lines - c.mainLines : 0,
      runsHandedStale: since.length,
      seatBranches: mine.length
    }
  })
}

// `utcDay` and not `slice(0, 10)`: the sliced form is the committer's own
// calendar day, and on 143 of this repository's 2,134 commits that is not the
// UTC day of the instant beside it. The `lag` column has always been computed
// in UTC, so a row could print a day and an age from two different calendars.
// `?` rather than a guess when the date is unplaceable.
//
// `stale runs` is now `<numerator>/<denominator>`: branches of that seat
// opened after its charter froze, over every branch of that seat this read
// saw at all. The bare numerator read as a volume when it is a share.
export function formatTable (rows) {
  const head = ['seat', 'charter on main (UTC)', 'lag', 'lines', 'queue', 'q.lines', 'pending', 'stale runs']
  const body = rows.map((r) => [
    r.seat,
    utcDay(r.mainDate) ?? '?',
    r.lagDays === null ? '?' : `${r.lagDays}d`,
    String(r.mainLines),
    r.queuePr === null ? '-' : `#${r.queuePr}`,
    r.queueLines === null ? '-' : String(r.queueLines),
    r.pendingLines > 0 ? `+${r.pendingLines}` : '0',
    `${r.runsHandedStale}/${r.seatBranches}`
  ])
  const w = head.map((h, i) => Math.max(h.length, ...body.map((b) => b[i].length)))
  const line = (cells) => cells.map((c, i) => c.padEnd(w[i])).join('  ').trimEnd()
  return [line(head), line(w.map((n) => '-'.repeat(n))), ...body.map(line)].join('\n')
}

// --- the clone's own fitness, measured before anything is reported -------

// The lines under the table. Separated from `main` so the instant and the
// denominators are assertable without a clone, which is the same reason
// `buildRows` is separate.
//
// Three denominators, because all three of the numbers here were quoted
// bare until 2026-11-02 and none of them is a volume:
//
//   charters      how many rows the table has, so `oldest` has a field size
//   seat branches the population `stale runs` is a share of
//   pull requests how many `gh pr list` rows the branch population came from,
//                 and whether that read hit its own limit
export function formatSummary (rows, { nowIso, branchRead }) {
  const stale = rows.reduce((n, r) => n + r.runsHandedStale, 0)
  const seatBranches = rows.reduce((n, r) => n + r.seatBranches, 0)
  const pending = rows.reduce((n, r) => n + Math.max(0, r.pendingLines), 0)
  const unmerged = rows.filter((r) => r.pendingLines > 0).length
  const worst = rows.reduce((a, r) => ((r.lagDays ?? -1) > (a?.lagDays ?? -1) ? r : a), null)
  const read = branchRead ?? {}
  const cap = read.capped
    ? ` — AT THE ${read.limit}-ROW LIMIT, so this population is truncated and every count below is a floor`
    : ''
  const out = ['']
  out.push(`read at ${nowIso}; every age and share below is as of that instant and not of the moment you are reading it`)
  out.push(
    worst === null || worst.lagDays === null
      ? `${rows.length} charters; no row carries a placeable date, so no oldest can be named`
      : `${rows.length} charters; oldest on main is ${worst.seat} at ${worst.lagDays}d (frozen ${worst.mainDate})`
  )
  out.push(`${pending} charter lines written and unmerged, across ${unmerged} of ${rows.length} charters`)
  out.push(
    `${stale} of ${seatBranches} branches of these seats opened after their own seat's charter froze` +
    `, from ${read.pullRequestsRead ?? seatBranches} pull requests read${cap}`
  )
  return out.join('\n')
}

export function cloneFitness ({ shallow, prRefs, originRefs }) {
  const faults = []
  if (shallow) {
    faults.push('depth: the clone is shallow, so every charter would read as changed today')
  }
  if (prRefs === 0) {
    faults.push('breadth: no refs/prs/* present, so every queue column would read as absent')
  }
  if (originRefs <= 1) {
    faults.push('breadth: only one origin/* ref resolves, so the handed refspec is still single-branch')
  }
  return faults
}

function measureClone () {
  const shallow = git(['rev-parse', '--is-shallow-repository']) === 'true'
  const prRefs = (git(['for-each-ref', '--format=%(refname)', 'refs/prs/'], { allowFail: true }) || '')
    .split('\n').filter(Boolean).length
  const originRefs = (git(['for-each-ref', '--format=%(refname)', 'refs/remotes/origin/'], { allowFail: true }) || '')
    .split('\n').filter(Boolean).length
  return { shallow, prRefs, originRefs }
}

function charterPaths () {
  return readdirSync('prompts')
    .filter((f) => f.endsWith('-agent.md'))
    .map((f) => ({ seat: f.replace(/-agent\.md$/, ''), path: `prompts/${f}` }))
    .sort((a, b) => a.seat.localeCompare(b.seat))
}

function lineCount (rev, path) {
  const blob = git(['show', `${rev}:${path}`], { allowFail: true })
  return blob === null ? null : blob.split('\n').length
}

// The newest open pull request that changes this charter, newest by pull
// request number, which on this host is creation order. Read from the local
// refs/prs/* mirror so the measurement does not depend on the API being up.
function newestQueueCopy (path, openPrs, mainRev) {
  for (const pr of openPrs) {
    const ref = `refs/prs/${pr}`
    if (!git(['rev-parse', '--verify', '--quiet', ref], { allowFail: true })) continue
    const base = git(['merge-base', mainRev, ref], { allowFail: true })
    if (!base) continue
    const changed = git(['diff', '--name-only', `${base}..${ref}`, '--', path], { allowFail: true })
    if (changed) return { number: pr, lines: lineCount(ref, path) }
  }
  return null
}

function openPrNumbers () {
  const out = execFileSync('gh', [
    'pr', 'list', '--state', 'open', '--limit', '200', '--json', 'number', '--jq', '.[].number'
  ], { encoding: 'utf8' })
  return out.split('\n').filter(Boolean).map(Number).sort((a, b) => b - a)
}

// Every branch this repository has ever had a pull request for, deduplicated,
// with the limit it was read under returned beside the rows. The limit is
// returned and not swallowed because `--limit 1000` is a silent cap: at 697
// pull requests today the read is complete, and the run where it stops being
// complete looks identical from the inside. `capped` is what makes that run
// say so instead of reporting a smaller number of stale branches.
const BRANCH_LIMIT = 1000

function allBranches () {
  const out = execFileSync('gh', [
    'pr', 'list', '--state', 'all', '--limit', String(BRANCH_LIMIT), '--json', 'headRefName,createdAt',
    '--jq', '.[] | .headRefName + "\\t" + .createdAt'
  ], { encoding: 'utf8' })
  const lines = out.split('\n').filter(Boolean)
  const seen = new Set()
  const rows = []
  for (const l of lines) {
    const [branch, createdAt] = l.split('\t')
    if (seen.has(branch)) continue
    seen.add(branch)
    rows.push({ branch, createdAt })
  }
  return { rows, pullRequestsRead: lines.length, limit: BRANCH_LIMIT, capped: lines.length >= BRANCH_LIMIT }
}

function main (argv) {
  const json = argv.includes('--json')
  const seatIdx = argv.indexOf('--seat')
  const onlySeat = seatIdx === -1 ? null : argv[seatIdx + 1]
  const boundIdx = argv.indexOf('--max-lag-days')
  const bound = boundIdx === -1 ? null : Number(argv[boundIdx + 1])

  const faults = cloneFitness(measureClone())
  if (faults.length) {
    console.error('this clone cannot answer the question, so nothing was measured:')
    for (const f of faults) console.error(`  ${f}`)
    console.error('repair: bash tools/ensure-full-clone.sh')
    return 2
  }

  const mainRev = 'refs/remotes/origin/main'
  const openPrs = openPrNumbers()
  const branchRead = allBranches()
  const branches = branchRead.rows
  // Read once, here, and threaded into every age in the output. The table
  // printed ages and no instant until 2026-11-02, so a pasted copy of it read
  // as current at any later hour. This seat's own rule, from the measured
  // citation work: a count or an age is quoted with the instant it was read
  // at, or it is not quoted.
  const nowIso = new Date().toISOString()

  const charters = charterPaths()
    .filter((c) => !onlySeat || c.seat === onlySeat)
    .map((c) => ({
      ...c,
      // `%ct` and not `%cI`: epoch seconds have no offset to drop, no day to
      // slice off the front and no spelling to compare. The conversion to a
      // `Z` instant happens once, here, so every consumer downstream of this
      // line is holding the one comparable form. Asking git for `%cI` and
      // parsing it correctly also works; asking for `%ct` removes the chance
      // of the next reader of this line parsing it incorrectly.
      mainDate: toUtcInstant(parseEpochSeconds(git(['log', '-1', '--format=%ct', mainRev, '--', c.path]))),
      mainLines: lineCount(mainRev, c.path),
      queue: newestQueueCopy(c.path, openPrs, mainRev)
    }))

  const rows = buildRows({ charters, branches, nowIso })
  if (json) {
    console.log(JSON.stringify({ measuredAt: nowIso, branchRead, rows }, null, 2))
  } else {
    console.log(formatTable(rows))
    console.log(formatSummary(rows, { nowIso, branchRead }))
  }

  if (bound !== null) {
    const over = rows.filter((r) => r.lagDays !== null && r.lagDays > bound)
    if (over.length) {
      console.error(`\n${over.length} charter(s) over the ${bound}-day bound: ${over.map((r) => r.seat).join(', ')}`)
      return 1
    }
  }
  return 0
}

if (import.meta.url === `file://${process.argv[1]}`) {
  process.exit(main(process.argv.slice(2)))
}
