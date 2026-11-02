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

export function lagDays (frozenAtIso, nowIso) {
  const a = instant(frozenAtIso)
  const b = instant(nowIso)
  if (a === null || b === null) return null
  return (b - a) / MS_PER_DAY
}

// TWO PRODUCERS, ONE INSTANT, TWO RENDERINGS. Every timestamp in this tool
// comes from one of exactly two places, and they do not agree on the text
// for the same moment:
//
//   git     `--format=%cI` prints the committer's own offset and NEVER `Z`,
//           so a UTC commit reads `2026-10-18T18:50:50+00:00`.
//   the API `createdAt` is always normalised to `Z`.
//
// So `b.createdAt > c.mainDate` as text is wrong in two independent ways.
// At a non-zero offset the wall-clock digits are the wrong instant: this
// repository's engineer charter froze at `2026-10-09T12:28:03-06:00`, which
// is `18:28:03Z`, and a branch opened at `17:31:08Z` sorts after `12:28:03`
// as text while preceding the freeze by 57 minutes. At zero offset the
// digits agree and the suffix decides, and `+` (0x2B) sorts below `Z`
// (0x5A), so git's rendering of an instant always compares as EARLIER than
// the API's rendering of the same instant. Both errors push the same way:
// a branch reads as opened after a freeze it did not follow, so the column
// over-reports. Measured over the whole branch history on 2026-11-02:
// 548 as text, 547 as instants, the one row being the engineer seat's.
//
// `Date.parse` places both renderings correctly, which is why this exists
// and why nothing below is allowed to compare, slice or sort the strings.
// `tools/seat/answered.mjs` compares board timestamps to board timestamps
// and is safe for a reason that is a property of its producer rather than
// of its code: all 500 rows the route returns carry `+00:00`.
export function instant (iso) {
  if (typeof iso !== 'string') return null
  const ms = Date.parse(iso)
  return Number.isNaN(ms) ? null : ms
}

// The UTC day of an instant, which is not the first ten characters of its
// rendering. `2026-10-09T12:28:03-06:00` is the 9th in the committer's
// timezone and the 9th in UTC; `2026-11-01T23:34:57-05:00` is the 1st as
// text and the 2nd in UTC. 330 of this repository's 2,134 commits carry a
// non-zero offset and 143 of them land on a different UTC day than their
// own leading ten characters, so slicing is right by luck per row.
export function utcDay (iso) {
  const ms = instant(iso)
  return ms === null ? '?' : new Date(ms).toISOString().slice(0, 10)
}

// One row per charter. `queue` is null when no open pull request touches the
// file, which is a different row from a queue this clone cannot see; the
// caller proves it can see the queue before it calls this.
export function buildRows ({ charters, branches, nowIso }) {
  return charters.map((c) => {
    const lag = lagDays(c.mainDate, nowIso)
    const frozenAt = instant(c.mainDate)
    const since = branches.filter(
      (b) => seatOfBranch(b.branch) === c.seat &&
        frozenAt !== null && instant(b.createdAt) !== null &&
        instant(b.createdAt) > frozenAt
    )
    return {
      seat: c.seat,
      path: c.path,
      mainDate: c.mainDate,
      mainLines: c.mainLines,
      lagDays: lag === null ? null : Math.round(lag * 10) / 10,
      queuePr: c.queue ? c.queue.number : null,
      queueLines: c.queue ? c.queue.lines : null,
      pendingLines: c.queue ? c.queue.lines - c.mainLines : 0,
      runsHandedStale: since.length
    }
  })
}

export function formatTable (rows) {
  const head = ['seat', 'charter on main', 'lag', 'lines', 'queue', 'q.lines', 'pending', 'stale runs']
  const body = rows.map((r) => [
    r.seat,
    utcDay(r.mainDate),
    r.lagDays === null ? '?' : `${r.lagDays}d`,
    String(r.mainLines),
    r.queuePr === null ? '-' : `#${r.queuePr}`,
    r.queueLines === null ? '-' : String(r.queueLines),
    r.pendingLines > 0 ? `+${r.pendingLines}` : '0',
    String(r.runsHandedStale)
  ])
  const w = head.map((h, i) => Math.max(h.length, ...body.map((b) => b[i].length)))
  const line = (cells) => cells.map((c, i) => c.padEnd(w[i])).join('  ').trimEnd()
  return [line(head), line(w.map((n) => '-'.repeat(n))), ...body.map(line)].join('\n')
}

// --- the clone's own fitness, measured before anything is reported -------

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

function allBranches () {
  const out = execFileSync('gh', [
    'pr', 'list', '--state', 'all', '--limit', '1000', '--json', 'headRefName,createdAt',
    '--jq', '.[] | .headRefName + "\\t" + .createdAt'
  ], { encoding: 'utf8' })
  const seen = new Set()
  const rows = []
  for (const l of out.split('\n').filter(Boolean)) {
    const [branch, createdAt] = l.split('\t')
    if (seen.has(branch)) continue
    seen.add(branch)
    rows.push({ branch, createdAt })
  }
  return rows
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
  const branches = allBranches()
  const nowIso = new Date().toISOString()

  const charters = charterPaths()
    .filter((c) => !onlySeat || c.seat === onlySeat)
    .map((c) => ({
      ...c,
      mainDate: git(['log', '-1', '--format=%cI', mainRev, '--', c.path]),
      mainLines: lineCount(mainRev, c.path),
      queue: newestQueueCopy(c.path, openPrs, mainRev)
    }))

  const rows = buildRows({ charters, branches, nowIso })
  if (json) {
    console.log(JSON.stringify({ measuredAt: nowIso, rows }, null, 2))
  } else {
    console.log(formatTable(rows))
    const stale = rows.reduce((n, r) => n + r.runsHandedStale, 0)
    const pending = rows.reduce((n, r) => n + Math.max(0, r.pendingLines), 0)
    const worst = rows.reduce((a, r) => (r.lagDays > (a?.lagDays ?? -1) ? r : a), null)
    console.log('')
    console.log(`${rows.length} charters; oldest on main is ${worst.seat} at ${worst.lagDays}d`)
    console.log(`${pending} charter lines written and unmerged; ${stale} branches opened since their own seat's charter froze`)
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
