#!/usr/bin/env node
// How often does a seat here write something another seat had already
// written? Counted off the board, where the admission happens.
//
//   node tools/seat/collision-admissions.mjs                 # the table
//   node tools/seat/collision-admissions.mjs --hours 24      # window (default 168)
//   node tools/seat/collision-admissions.mjs --company Ursa  # scope (default Ursa)
//   node tools/seat/collision-admissions.mjs --json          # machine-readable
//   node tools/seat/collision-admissions.mjs --rows          # the matched subjects
//
// Exit 0 the window was read and counted. Exit 2 the board half could not be
// established, so there is no denominator and therefore no rate. Never 0 with
// a rate computed over a read that did not complete.
//
// WHY THIS EXISTS, and it is this seat's own blind spot rather than a general
// improvement. `tools/seat/duplicate-repair.mjs` takes its subject from
// `tools/registers/registers.json`, so it grades a pair only when two actors
// edited a pre-existing entry in a declared REGISTER. Measured 2026-11-09,
// four collisions involving Ursa's exo seat or its files landed inside seven
// hours and that gauge saw ONE of them:
//
//   05:16Z/05:32Z  skill and engineer, twelve docs/ideas.md entries     SEEN
//   ~11:40Z        security and exo, the same three sort comparators    missed
//   ~10:50Z        engineer and exo, one doc-model registry row         missed
//   12:20Z         inherited-finding.mjs against hit-attribution.mjs    missed
//
// The three it misses are all in `tools/`, and the last one is not an edit to
// a shared object at all: two unmerged files answering one question at two
// granularities. No textual scan over register entries reaches that, however
// wide the window. So the rate the register gauge publishes is a rate over the
// easy third, and this file is the population count its ledger entry asks for
// before anybody widens anything.
//
// WHAT THIS MEASURES, said precisely, because the number is weaker than it
// looks and a reader will quote it. It counts ADMISSIONS: board rows whose
// body says, in this house's own recurring phrases, that the work was already
// done elsewhere. That is a FLOOR on collisions and not a count of them, in
// both directions:
//
//   it undercounts  a collision nobody noticed leaves no row. The three above
//                   were each found by a seat opening a file, not by a check.
//   it overcounts   a row ANSWERING an admission matches the same phrases, so
//                   one collision discussed by two seats can be several rows.
//                   `--rows` exists so a reader can see which is which, and
//                   the per-seat column is there because a seat replying to
//                   its own thread is visible as a lopsided count.
//
// Both of those are why the denominator is printed first and why the headline
// is a pair of counts rather than a single rate.
//
// THE PATTERNS ARE DATA AND NOT A JUDGEMENT. They are listed below, as
// literals, so that next week's reading is the same measurement and not a new
// one. Adding a pattern changes the series; say so in the ledger when you do.
//
// External content: the board's own message route, which is this
// organisation's surface. Nothing fetched from the open web.

export const ADMISSION_PATTERNS = [
  /already (fix|writ|land|merg|on main|carried|register|done|answered)/i,
  /\ba second time\b/i,
  /answer(ed|ing)? (it )?by reference/i,
  /\bduplicat/i,
  /\bsupersed/i,
  /the same (fix|repair|red|change|row|three|twelve)\b/i,
  /both unmerged/i,
  /neither (able to see|visible to) the other/i,
  /\bwrote .{0,30}another seat had\b/i,
]

/** @returns {boolean} does this body admit work that was already done? */
export function admits(body) {
  const s = String(body || '')
  return ADMISSION_PATTERNS.some((re) => re.test(s))
}

/** Which patterns a body matched, so `--rows` can say why a row is counted. */
export function matchedPatterns(body) {
  const s = String(body || '')
  return ADMISSION_PATTERNS.filter((re) => re.test(s)).map((re) => re.source)
}

/** The count, over rows already fetched. Pure, so the suite needs no board.
 *
 *  @param {object[]} rows board messages
 *  @param {string} company the sending company to scope to
 *  @returns {{denominator:number, admissions:number, by_seat:object, matched:object[]}}
 */
export function tally(rows, company) {
  const mine = (rows || []).filter((r) => r && r.from_company === company)
  const matched = mine.filter((r) => admits(r.body))
  const by_seat = {}
  for (const r of mine) {
    const k = r.from_seat || '?'
    by_seat[k] = by_seat[k] || { rows: 0, admissions: 0 }
    by_seat[k].rows += 1
  }
  for (const r of matched) {
    const k = r.from_seat || '?'
    by_seat[k].admissions += 1
  }
  return { denominator: mine.length, admissions: matched.length, by_seat, matched }
}

/** The verdict and the exit status in one place, so they cannot disagree.
 *  This is the shape `tools/seat/duplicate-repair.mjs` did NOT have when it
 *  shipped, which cost it a false green on a declined board read.
 *
 *  @param {{state:string, note:?string}} board
 *  @param {{denominator:number, admissions:number}} t
 *  @returns {{exit:0|2, code:string, line:string}}
 */
export function verdict(board, t) {
  if (board.state !== 'complete') {
    return {
      exit: 2,
      code: 'NO_DENOMINATOR',
      line: `cannot count: the board half is ${board.state}, so the window has no denominator and `
        + 'any rate from it would be taken over a read that did not finish'
        + (board.note ? `. ${board.note}` : ''),
    }
  }
  if (t.denominator === 0) {
    return {
      exit: 2,
      code: 'NO_DENOMINATOR',
      line: 'cannot count: the board read completed and holds no row from this company in the window, '
        + 'so 0 admissions is the absence of a population rather than a quiet week',
    }
  }
  const pct = ((t.admissions / t.denominator) * 100).toFixed(1)
  return {
    exit: 0,
    code: 'COUNTED',
    line: `${t.admissions} of ${t.denominator} rows admit work already done elsewhere, ${pct} per cent, `
      + 'and that is a FLOOR: a collision nobody noticed leaves no row',
  }
}

const arg = (flag, fallback) => {
  const i = process.argv.indexOf(flag)
  return i === -1 ? fallback : process.argv[i + 1]
}

async function main() {
  const hours = Number(arg('--hours', 168))
  const company = arg('--company', 'Ursa')
  const { pageMessages, ratioFault } = await import('../board/page.mjs')

  let board = { state: 'unestablished', note: 'no read attempted', rows: [] }
  try {
    const walk = await pageMessages({ hours })
    const c = walk.coverage
    const fault = c ? ratioFault(c) : { code: 'NO_COVERAGE', line: 'no coverage receipt' }
    board = {
      state: c && c.complete === true ? 'complete' : 'partial',
      note: fault ? `${fault.code}: ${fault.line}` : null,
      rows: walk.rows || [],
      pages: c ? c.pages : null,
      oldest: c ? c.oldest_ts : null,
    }
    if (!c || !c.oldest_ts || board.rows.length === 0) board.state = 'unestablished'
  } catch (e) {
    board = { state: 'unestablished', note: `board read failed: ${e.message}`, rows: [] }
  }

  const t = tally(board.rows, company)
  const v = verdict(board, t)

  if (process.argv.includes('--json')) {
    console.log(JSON.stringify({
      window_hours: hours,
      company,
      board: { state: board.state, pages: board.pages ?? null, rows: board.rows.length, oldest: board.oldest ?? null, note: board.note },
      verdict: v,
      denominator: t.denominator,
      admissions: t.admissions,
      by_seat: t.by_seat,
      patterns: ADMISSION_PATTERNS.map((re) => re.source),
      rows: process.argv.includes('--rows')
        ? t.matched.map((r) => ({ ts: r.ts, from_seat: r.from_seat, to_seat: r.to_seat ?? null, subject: r.subject, patterns: matchedPatterns(r.body) }))
        : undefined,
    }, null, 2))
    process.exit(v.exit)
  }

  // The denominator before the rows, so an interim read is visibly incomplete.
  console.log(`window ${hours}h  company ${company}  board ${board.state}`
    + `  rows fetched ${board.rows.length}${board.pages ? ` over ${board.pages} page(s)` : ''}`
    + `${board.oldest ? `, oldest ${board.oldest}` : ''}`)
  if (board.note) console.log(`  ${board.note}`)
  console.log(`VERDICT: ${v.line}`)
  if (v.exit === 0) {
    const seats = Object.entries(t.by_seat).sort((a, b) => b[1].admissions - a[1].admissions)
    for (const [seat, n] of seats) {
      console.log(`  ${seat.padEnd(18)} ${String(n.admissions).padStart(3)} of ${String(n.rows).padStart(4)}`)
    }
    if (process.argv.includes('--rows')) {
      for (const r of t.matched) console.log(`\n  ${r.ts} ${r.from_seat} -> ${r.to_seat || '*'}\n    ${r.subject}`)
    }
  }
  process.exit(v.exit)
}

if (import.meta.url === `file://${process.argv[1]}`) {
  await main()
}
