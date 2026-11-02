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
//
//   selection  THE THIRD ONE, and it is this file's own (added 2026-11-02,
//            eighty-seventh window, measured on the row for the seat that
//            wrote this tool). The two controls above guard what the clone
//            can SEE. Nothing guarded which of the things it can see this
//            tool PICKS. `newestQueueCopy` took the highest open pull
//            request number that touches a charter and returned the first
//            match, on the stated reasoning that "the newest one usually
//            contains the older ones already" -- which is also the charter's
//            own §0 and its all-seats rule. On the day this file was written
//            that was true, and its header above recorded the newest copy at
//            7,732 lines. By 2026-11-02T08:00Z the same read returned
//            #714 at 2,312 lines while #699 held 8,726, because this seat
//            had adopted the practice of opening each window's pull request
//            on a fresh root off `main` to keep it mergeable. That practice
//            is right and it decoupled recency from depth, so the selector
//            inverted without changing. It reported +91 pending exo lines
//            against +6,505 actually written, and 1,089 for the company
//            against 7,586: it lost 6,497 lines, 86 per cent of the total,
//            on 2 of 11 rows, and the loss reads as a healthy queue.
//
// So this tool now reads EVERY open copy of every charter and never picks
// one. `pending` is computed from the deepest copy and is a FLOOR, not the
// answer: depth is not containment either. Measured the same day, the exo
// pair diverges in both directions (#699 holds 5,331 normalised lines #714
// lacks, #714 holds 154 #699 lacks), and research's longest copy #395 is
// 83 lines longer than #699 while lacking 97 of its lines. There is no
// single copy to read. The `copies` column exists so the reader stops
// looking for one.
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

// Every open copy of one charter, newest first, normalised from either shape
// the caller may hold: `copies: [{number, lines}]` or the single-pick
// `queue: {number, lines}` this file used until 2026-11-02. The old shape is
// kept as the degenerate one-copy case rather than deleted, because a caller
// holding one copy is a real state (one open pull request touches the file)
// and is not the same state as the selector having discarded the rest.
export function copiesOf (charter) {
  if (Array.isArray(charter.copies)) return charter.copies.filter(Boolean)
  return charter.queue ? [charter.queue] : []
}

// What the two selectors return for one charter, side by side, so the row can
// carry the difference instead of the tool resolving it. `deepest` is the copy
// with the most lines and `newest` is the highest pull request number, which
// are the same copy only while this seat ships one chain at a time.
export function selectCopies (copies) {
  if (copies.length === 0) return { newest: null, deepest: null, count: 0 }
  const byNumber = [...copies].sort((a, b) => b.number - a.number)
  const byLines = [...copies].sort((a, b) => (b.lines ?? 0) - (a.lines ?? 0))
  return { newest: byNumber[0], deepest: byLines[0], count: copies.length }
}

// One row per charter. `queuePr` is null when no open pull request touches the
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
    const copies = copiesOf(c)
    const { newest, deepest, count } = selectCopies(copies)
    // `pending` is read off the deepest copy and is a floor: the union of
    // distinct lines across copies can exceed any single one of them, which
    // is measured for two of this repository's charters in the header.
    const pendingLines = deepest ? deepest.lines - c.mainLines : 0
    const recencyPendingLines = newest ? newest.lines - c.mainLines : 0
    return {
      seat: c.seat,
      path: c.path,
      mainDate: c.mainDate,
      mainLines: c.mainLines,
      lagDays: lag === null ? null : Math.round(lag * 10) / 10,
      queueCopies: count,
      queuePr: deepest ? deepest.number : null,
      queueLines: deepest ? deepest.lines : null,
      newestPr: newest ? newest.number : null,
      newestLines: newest ? newest.lines : null,
      pendingLines,
      recencyPendingLines,
      // What the selector this file shipped until 2026-11-02 would have
      // dropped from this row. Zero on every row where recency and depth
      // still agree, which is what makes its non-zero rows worth printing.
      selectionLoss: Math.max(0, pendingLines - recencyPendingLines),
      runsHandedStale: since.length
    }
  })
}

// The selection fault, stated in the same shape as the clone's two: what was
// silently discarded, named by the property it is a fault in. Empty is the
// honest reading when every charter has at most one open copy, and that is a
// fact about the queue on the day rather than about this tool being right.
export function selectionFaults (rows) {
  const multi = rows.filter((r) => r.queueCopies > 1)
  const split = multi.filter((r) => r.newestPr !== r.queuePr)
  if (split.length === 0) return []
  const lost = split.reduce((n, r) => n + r.selectionLoss, 0)
  return [
    `selection: ${multi.length} of ${rows.length} charters hold more than one open copy, ` +
    `and on ${split.length} of them the newest copy is not the deepest ` +
    `(${split.map((r) => `${r.seat} #${r.newestPr}->#${r.queuePr}`).join(', ')}). ` +
    `Reading the newest alone would report ${lost} fewer pending lines. ` +
    'Read every copy; depth is not containment either.'
  ]
}

export function formatTable (rows) {
  const head = ['seat', 'charter on main', 'lag', 'lines', 'copies', 'deepest', 'q.lines', 'pending', 'sel.loss', 'stale runs']
  const body = rows.map((r) => [
    r.seat,
    utcDay(r.mainDate),
    r.lagDays === null ? '?' : `${r.lagDays}d`,
    String(r.mainLines),
    String(r.queueCopies ?? 0),
    r.queuePr === null ? '-' : `#${r.queuePr}`,
    r.queueLines === null ? '-' : String(r.queueLines),
    r.pendingLines > 0 ? `+${r.pendingLines}` : '0',
    r.selectionLoss > 0 ? `-${r.selectionLoss}` : '0',
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

// EVERY open pull request that changes this charter, newest first. This used
// to return the first match and was called `newestQueueCopy`; the loop body
// is unchanged and the `return` became a `push`, which is the whole repair
// and is why it is worth naming what the one-line version cost: 6,497 of
// 7,586 pending charter lines, reported as a healthy queue. Read from the
// local refs/prs/* mirror so the measurement does not depend on the API.
function queueCopies (path, openPrs, mainRev) {
  const copies = []
  for (const pr of openPrs) {
    const ref = `refs/prs/${pr}`
    if (!git(['rev-parse', '--verify', '--quiet', ref], { allowFail: true })) continue
    const base = git(['merge-base', mainRev, ref], { allowFail: true })
    if (!base) continue
    const changed = git(['diff', '--name-only', `${base}..${ref}`, '--', path], { allowFail: true })
    if (changed) copies.push({ number: pr, lines: lineCount(ref, path) })
  }
  return copies
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
      copies: queueCopies(c.path, openPrs, mainRev)
    }))

  const rows = buildRows({ charters, branches, nowIso })
  if (json) {
    console.log(JSON.stringify({ measuredAt: nowIso, rows }, null, 2))
  } else {
    console.log(formatTable(rows))
    const stale = rows.reduce((n, r) => n + r.runsHandedStale, 0)
    const pending = rows.reduce((n, r) => n + Math.max(0, r.pendingLines), 0)
    const recency = rows.reduce((n, r) => n + Math.max(0, r.recencyPendingLines), 0)
    const worst = rows.reduce((a, r) => (r.lagDays > (a?.lagDays ?? -1) ? r : a), null)
    console.log('')
    console.log(`${rows.length} charters; oldest on main is ${worst.seat} at ${worst.lagDays}d`)
    console.log(`${pending} charter lines written and unmerged (a floor, read off each charter's deepest open copy); ${stale} branches opened since their own seat's charter froze`)
    for (const f of selectionFaults(rows)) console.log(f)
    if (pending !== recency) {
      console.log(`the single-newest-copy read this tool shipped until 2026-11-02 would say ${recency}`)
    }
  }
  if (argv.includes('--copies')) {
    console.log('')
    for (const r of rows.filter((x) => x.queueCopies > 1)) {
      const list = copiesOf(charters.find((c) => c.seat === r.seat))
        .sort((a, b) => b.number - a.number)
        .map((c) => `#${c.number} (${c.lines})`).join('  ')
      console.log(`${r.seat}: ${list}`)
    }
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
