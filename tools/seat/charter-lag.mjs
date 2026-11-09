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
import { calendarDay } from '../instant.mjs'

const MS_PER_DAY = 86400000

// `maxBuffer` IS NOT OPTIONAL HERE, and the number beside it is the reason.
// Node's default for `execFileSync` is 1 MiB, and exceeding it THROWS, which
// `allowFail: true` then turns into `null` -- so `lineCount` answers "this
// charter is not at this revision" for a charter that is there and is merely
// large. Measured on 2026-11-02: `prompts/exo-agent.md` is 119,851 bytes on
// `main` and 484,752 bytes on `refs/prs/714`, so the largest input this tool
// reads sits at 46 per cent of the default and quadrupled in one queue cycle.
// `docs/ideas.md` in this same repository is already past it at 1,150,597
// bytes, and this run spent a measurement on exactly that: an ad-hoc probe of
// another seat's tool read the ledger through a default-buffer
// `execFileSync`, got `null`, and nearly reported that seat's tool as broken.
// The tool itself was fine; it sets `1 << 28`, which is the number matched
// here so the two readers in this repository agree.
const MAX_BUFFER = 1 << 28

function git (args, { allowFail = false } = {}) {
  try {
    return execFileSync('git', args, {
      encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: MAX_BUFFER
    }).trim()
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
//
// RENAMED FROM `utcDay` AND DELEGATED, 2026-11-09. It was the THIRD copy of a
// projection `tools/instant.mjs` owns, and it was the worst-named of the
// three, because `tools/instant.mjs` exports a different function under that
// exact name with a different refusal value: this one answered `'?'` and that
// one answers `null`. One name, two functions, and the only way to know which
// you had was the import line. `dayCell` says what it is for instead, which is
// one cell of `formatTable` below, and `'?'` is a rendering decision that
// belongs at the renderer rather than inside a date function.
//
// The delegation also narrows it, in the one direction worth narrowing. The
// local `instant` below is `Date.parse`, which reads a zoneless
// `2026-11-02T04:34:57` in the RUNNER's timezone and answers a day that
// depends on where the process ran; `calendarDay` refuses it and this cell
// prints `?`. No producer feeding this table emits that shape today — every
// `mainDate` comes from `git log` or from `gh`, both zone-bearing — so the
// change is latent on the real inputs and is a refusal rather than a guess on
// the one that is not.
export function dayCell (iso) {
  return calendarDay(iso) ?? '?'
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
      runsHandedStale: since.length,
      // RESTORED FROM THIS SEAT'S #679/#694 LINEAGE, which the trunk's
      // 2026-11-02 rewrite of this file was written against an older base and
      // dropped. `runsHandedStale` is a numerator and nothing else, so the row
      // carries the population it is drawn from: a count whose denominator is
      // not printed cannot be read as a rate, and this one is drawn from a
      // `gh pr list --limit 1000` that truncates silently.
      seatBranches: branches.filter((b) => seatOfBranch(b.branch) === c.seat).length
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

// The lines under the table, as a pure exported function and not inlined in
// `main()`. Restored from this seat's #679/#694 lineage, which the trunk's
// 2026-11-02 rewrite was written against an older base and lost, and extended
// with the queue-side sentence this pass added. Separated from `main` so the
// instant, the denominators and the cap are assertable without a clone.
//
// Four denominators, because none of these numbers is a volume:
//
//   charters      how many rows the table has, so `oldest` has a field size
//   seat branches the population `stale runs` is a share of
//   pull requests how many `gh pr list` rows the branch population came from,
//                 and whether that read hit its own limit
//   open rows     how many of the queue the charter scan could actually see
export function formatSummary (rows, { nowIso, branchRead, queueRead }) {
  const stale = rows.reduce((n, r) => n + r.runsHandedStale, 0)
  const seatBranches = rows.reduce((n, r) => n + (r.seatBranches ?? 0), 0)
  const pending = rows.reduce((n, r) => n + Math.max(0, r.pendingLines), 0)
  const recency = rows.reduce((n, r) => n + Math.max(0, r.recencyPendingLines ?? 0), 0)
  const worst = rows.reduce((a, r) => ((r.lagDays ?? -1) > (a?.lagDays ?? -1) ? r : a), null)
  const read = branchRead ?? {}
  const cap = read.capped
    ? ` — AT THE ${read.limit}-ROW LIMIT, so this population is truncated and every count below is a floor`
    : ''
  const out = ['']
  // Read once and printed, because the table printed ages and no instant
  // until 2026-11-02 and a pasted copy of it then read as current at any
  // later hour.
  out.push(`read at ${nowIso}; every age and share below is as of that instant and not of the moment you are reading it`)
  out.push(
    worst === null || worst.lagDays === null
      ? `${rows.length} charters; no row carries a placeable date, so no oldest can be named`
      : `${rows.length} charters; oldest on main is ${worst.seat} at ${worst.lagDays}d`
  )
  out.push(
    `${pending} charter lines written and unmerged, a floor read off each charter's deepest open copy`
  )
  out.push(
    `${stale} of ${seatBranches} branches of these seats opened after their own seat's charter froze` +
    `, from ${read.pullRequestsRead ?? seatBranches} pull requests read${cap}`
  )
  for (const f of selectionFaults(rows)) out.push(f)
  if (pending !== recency) {
    out.push(`the single-newest-copy read this tool shipped until 2026-11-02 would say ${recency}`)
  }
  // THE QUEUE SIDE SAYS WHAT IT SAW. Every number above is about the branch
  // side of the table. The queue columns had no line of their own, so a `-`
  // under `deepest` was read as "no open row touches this charter" when it
  // could equally mean "no open row was readable". These sentences are the
  // difference, and the zero prints too, because the zero is the reassurance.
  if (queueRead) {
    out.push(
      `${queueRead.openPrs} open pull requests scanned for charter edits` +
      (queueRead.skipped > 0
        ? `, ${queueRead.skipped} of them SKIPPED for a missing refs/prs/<n>, so every queue column above is a floor`
        : ', none skipped')
    )
    if (queueRead.degraded.length > 0) {
      out.push(
        `${queueRead.degraded.length} answered by blob comparison and not by diff, having no merge base with main ` +
        `(#${queueRead.degraded.join(', #')}): a difference there may be trunk text the row has not merged ` +
        'rather than the row\'s own edit'
      )
    }
  }
  return out.join('\n')
}

export function formatTable (rows) {
  const head = ['seat', 'charter on main', 'lag', 'lines', 'copies', 'deepest', 'q.lines', 'pending', 'sel.loss', 'stale runs']
  const body = rows.map((r) => [
    r.seat,
    dayCell(r.mainDate),
    r.lagDays === null ? '?' : `${r.lagDays}d`,
    String(r.mainLines),
    String(r.queueCopies ?? 0),
    r.queuePr === null ? '-' : `#${r.queuePr}`,
    r.queueLines === null ? '-' : String(r.queueLines),
    r.pendingLines > 0 ? `+${r.pendingLines}` : '0',
    r.selectionLoss > 0 ? `-${r.selectionLoss}` : '0',
    // `<numerator>/<denominator>`, not the bare count: the numerator alone
    // read as a volume when it is a share. Same restoration as `seatBranches`
    // above, and `?` when the caller built rows without the denominator.
    `${r.runsHandedStale}/${r.seatBranches ?? '?'}`
  ])
  const w = head.map((h, i) => Math.max(h.length, ...body.map((b) => b[i].length)))
  const line = (cells) => cells.map((c, i) => c.padEnd(w[i])).join('  ').trimEnd()
  return [line(head), line(w.map((n) => '-'.repeat(n))), ...body.map(line)].join('\n')
}

// --- the clone's own fitness, measured before anything is reported -------

// Each fault carries the command that repairs IT, and not one repair line
// printed under all of them. Until 2026-11-02 `main()` printed `repair: bash
// tools/ensure-full-clone.sh` under every fault this function returns,
// including the `refs/prs/*` ones, and that script declines the `refs/pull/*`
// namespace on purpose in the paragraph of its own header headed WHAT IT DOES
// NOT DO. So a seat that hit the breadth fault was told to re-run a script it
// had already run, which cannot clear it. The security seat measured and
// fixed the identical shape in `tools/stack/repair-pending.test.mjs` the same
// day: one named cause for a condition reachable three ways, false for one of
// the three, and the three do not share a repair.
const FETCH_PR_REFS = "git fetch origin 'refs/pull/*/head:refs/prs/*'"

/**
 * @param {{
 *   shallow: boolean,
 *   prRefs: number,
 *   originRefs: number,
 *   openPrs?: number|null,
 *   readablePrRefs?: number|null
 * }} m
 * @returns {{ fault: string, repair: string }[]}
 */
export function cloneFitness ({ shallow, prRefs, originRefs, openPrs = null, readablePrRefs = null }) {
  const faults = []
  if (shallow) {
    faults.push({
      fault: 'depth: the clone is shallow, so every charter would read as changed today',
      repair: 'bash tools/ensure-full-clone.sh'
    })
  }
  if (prRefs === 0) {
    faults.push({
      fault: 'breadth: no refs/prs/* present, so every queue column would read as absent',
      repair: FETCH_PR_REFS
    })
  }
  if (originRefs <= 1) {
    faults.push({
      fault: 'breadth: only one origin/* ref resolves, so the handed refspec is still single-branch',
      repair: 'bash tools/ensure-full-clone.sh'
    })
  }
  // COVERAGE, which is the fault the other three could not see. `prRefs !== 0`
  // proves that SOME pull request head is present; it does not prove that the
  // heads of the open rows about to be scanned are. A clone holding one stale
  // `refs/prs/<n>` from a long-merged row satisfies every check above and then
  // skips every open row at `rev-parse --verify`, so the table prints `-` in
  // every `deepest` column and `0` in every `pending` column, which is
  // indistinguishable from a queue in which nobody has touched a charter.
  // That is the reading this instrument exists to produce and the one the
  // merge rule's Tier C routing leans on, so a partial read is refused rather
  // than printed. Gated on `prRefs !== 0` so the total-absence case is named
  // once, by the breadth fault above, instead of twice.
  if (prRefs !== 0 && openPrs !== null && readablePrRefs !== null && readablePrRefs < openPrs) {
    const missing = openPrs - readablePrRefs
    faults.push({
      fault: `coverage: ${readablePrRefs} of ${openPrs} open pull requests have a refs/prs/<n> in this clone, ` +
        `so ${missing} would be skipped without being counted and every queue column would under-report`,
      repair: FETCH_PR_REFS
    })
  }
  return faults
}

// `openPrs` is passed in rather than read here so the fitness check and the
// scan that follows it are measured against the SAME list of open rows. Read
// twice, they can disagree: a row that merges between the two reads makes the
// coverage check pass on a list the scan no longer uses.
function measureClone (openPrs) {
  const shallow = git(['rev-parse', '--is-shallow-repository']) === 'true'
  const prRefNames = (git(['for-each-ref', '--format=%(refname)', 'refs/prs/'], { allowFail: true }) || '')
    .split('\n').filter(Boolean)
  const originRefs = (git(['for-each-ref', '--format=%(refname)', 'refs/remotes/origin/'], { allowFail: true }) || '')
    .split('\n').filter(Boolean).length
  // One `for-each-ref` and a set membership test, not one `rev-parse` per open
  // row: at 60-odd open pull requests the per-row form is 60 process spawns to
  // answer a question one spawn already answered.
  const present = new Set(prRefNames)
  const readablePrRefs = openPrs.filter((n) => present.has(`refs/prs/${n}`)).length
  return { shallow, prRefs: prRefNames.length, originRefs, openPrs: openPrs.length, readablePrRefs }
}

function charterPaths () {
  return readdirSync('prompts')
    .filter((f) => f.endsWith('-agent.md'))
    .map((f) => ({ seat: f.replace(/-agent\.md$/, ''), path: `prompts/${f}` }))
    .sort((a, b) => a.seat.localeCompare(b.seat))
}

export function lineCount (rev, path) {
  const blob = git(['show', `${rev}:${path}`], { allowFail: true })
  return blob === null ? null : blob.split('\n').length
}

// EVERY open pull request that changes this charter, newest first. This used
// to return the first match and was called `newestQueueCopy`; the loop body
// is unchanged and the `return` became a `push`, which is the whole repair
// and is why it is worth naming what the one-line version cost: 6,497 of
// 7,586 pending charter lines, reported as a healthy queue. Read from the
// local refs/prs/* mirror so the measurement does not depend on the API.
// NO SILENT SKIPS, which is the repair of the defect Ursa's PM logged against
// line 165 of this file on 2026-11-02 and the reason this returns a census
// beside the copies. The two `continue` statements the loop carried each
// dropped a pull request out of the scan and left no trace:
//
//   no-ref         `refs/prs/<n>` is not in this clone. On the clone a seat is
//                  handed, that is EVERY open row, because the handed refspec
//                  is `+refs/heads/main:refs/remotes/origin/main` and nothing
//                  fetches the pull namespace. `cloneFitness` now refuses the
//                  whole read for this, so reaching it here means the clone
//                  changed under the run.
//   base-unknown   `git merge-base` printed nothing and exited non-zero, so
//                  `allowFail` returned null. On a shallow clone that is every
//                  pair; on a complete one it is a head whose history is
//                  genuinely unrelated to main's.
//
// Both skips meant "this pull request does not touch this charter", which is a
// claim, and neither had measured it. `base-unknown` now DEGRADES rather than
// skipping: with no merge base there is no diff to take, but the two blobs are
// still comparable, so the charter at `refs/prs/<n>` is compared against the
// charter at `main` and a difference counts as a copy. That is weaker than a
// diff against a base, since it cannot tell this row's own edit from trunk
// text this row has not yet merged, so every row answered that way is named
// in `degraded` and the summary says so. A weaker answer that reports its own
// weakness beats a copy that vanishes.
//
// The four git reads are injected, which is what makes every branch here
// assertable with no clone and no network -- the same split `buildRows` and
// `formatSummary` already make, for the same reason.
//
// @returns {{ copies: {number: number, lines: number|null}[],
//             scanned: number,
//             skipped: {pr: number, cause: 'no-ref'}[],
//             degraded: number[] }}
export function queueScan (path, openPrs, io, mainRev) {
  const copies = []
  const skipped = []
  const degraded = []
  const mainLines = io.linesAt(mainRev, path)
  let scanned = 0
  for (const pr of openPrs) {
    const ref = `refs/prs/${pr}`
    if (!io.refExists(ref)) {
      skipped.push({ pr, cause: 'no-ref' })
      continue
    }
    scanned += 1
    const base = io.mergeBase(mainRev, ref)
    if (base === null) {
      const lines = io.linesAt(ref, path)
      degraded.push(pr)
      if (lines !== null && lines !== mainLines) copies.push({ number: pr, lines })
      continue
    }
    if (io.touches(base, ref, path)) copies.push({ number: pr, lines: io.linesAt(ref, path) })
  }
  return { copies, scanned, skipped, degraded }
}

// The one binding of `queueScan`'s four reads to this clone.
function gitQueueIo () {
  return {
    refExists: (ref) => Boolean(git(['rev-parse', '--verify', '--quiet', ref], { allowFail: true })),
    mergeBase: (a, b) => git(['merge-base', a, b], { allowFail: true }) || null,
    touches: (base, ref, path) =>
      Boolean(git(['diff', '--name-only', `${base}..${ref}`, '--', path], { allowFail: true })),
    linesAt: (rev, path) => lineCount(rev, path)
  }
}

function openPrNumbers () {
  const out = execFileSync('gh', [
    'pr', 'list', '--state', 'open', '--limit', '200', '--json', 'number', '--jq', '.[].number'
  ], { encoding: 'utf8' })
  return out.split('\n').filter(Boolean).map(Number).sort((a, b) => b - a)
}

// Every branch this repository has ever had a pull request for, deduplicated,
// WITH THE LIMIT IT WAS READ UNDER returned beside the rows. Also restored
// from this seat's #679 lineage. `--limit 1000` is a silent cap: at 728 pull
// requests today the read is complete, and the run where it stops being
// complete looks identical from the inside. `capped` is what makes that run
// say so instead of reporting a smaller number of stale branches as a fact.
const BRANCH_LIMIT = 1000

function allBranches () {
  const out = execFileSync('gh', [
    'pr', 'list', '--state', 'all', '--limit', String(BRANCH_LIMIT), '--json', 'headRefName,createdAt',
    '--jq', '.[] | .headRefName + "\\t" + .createdAt'
  ], { encoding: 'utf8', maxBuffer: MAX_BUFFER })
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

  // The open-row list is read BEFORE the fitness check, because the check is
  // now partly about that list: "can this clone see the rows it is about to
  // scan" is not answerable without knowing which rows those are.
  const mainRev = 'refs/remotes/origin/main'
  const openPrs = openPrNumbers()
  const queueIo = gitQueueIo()

  const faults = cloneFitness(measureClone(openPrs))
  if (faults.length) {
    console.error('this clone cannot answer the question, so nothing was measured:')
    for (const f of faults) {
      console.error(`  ${f.fault}`)
      console.error(`    repair: ${f.repair}`)
    }
    return 2
  }

  const branchRead = allBranches()
  const branches = branchRead.rows
  const nowIso = new Date().toISOString()

  const charters = charterPaths()
    .filter((c) => !onlySeat || c.seat === onlySeat)
    .map((c) => ({
      ...c,
      mainDate: git(['log', '-1', '--format=%cI', mainRev, '--', c.path]),
      mainLines: lineCount(mainRev, c.path),
      scan: queueScan(c.path, openPrs, queueIo, mainRev)
    }))
    .map((c) => ({ ...c, copies: c.scan.copies }))

  // The queue read, summed over every charter, so the summary can state what
  // the scan could and could not see instead of letting a `-` stand for both.
  // `skipped` is a max and not a sum: every charter is scanned over the same
  // open-row list, so the per-charter counts are the same number repeated.
  const queueRead = {
    openPrs: openPrs.length,
    skipped: charters.reduce((n, c) => Math.max(n, c.scan.skipped.length), 0),
    degraded: [...new Set(charters.flatMap((c) => c.scan.degraded))].sort((a, b) => a - b)
  }

  const rows = buildRows({ charters, branches, nowIso })
  if (json) {
    console.log(JSON.stringify({ measuredAt: nowIso, branchRead, queueRead, rows }, null, 2))
  } else {
    console.log(formatTable(rows))
    console.log(formatSummary(rows, { nowIso, branchRead, queueRead }))
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
