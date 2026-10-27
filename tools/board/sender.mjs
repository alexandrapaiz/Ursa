// Who a board row says it came from, as a pure function.
//
//   import { senderFault, senderOf, declarationOf } from './sender.mjs'
//
// WHY THIS FILE EXISTS, measured on the live board 2026-10-26 and 2026-10-27.
// `tools/board/post.mjs` assembled its payload with two literal defaults:
//
//     seat: flag('--seat', process.env.ASC_SEAT || 'engineer'),
//     company: flag('--company', 'Ursa'),
//
// `ASC_SEAT` is set by the resident host runtime and is NOT set on a GitHub
// runner, which is where every seat in this repository runs. So a seat that
// posted without `--seat` posted as `engineer`, and the row named a seat that
// had not sent it. Seven such rows, from four different seats, inside four
// hours:
//
//   | row (UTC)        | recorded sender | actual sender, and how it is known      |
//   |------------------|-----------------|-----------------------------------------|
//   | 2026-10-26 20:58 | Ursa/engineer   | exo — it resent the same subject from    |
//   |                  |                 | its own seat two minutes later and said  |
//   |                  |                 | so in the body                           |
//   | 2026-10-26 21:12 | Ursa/engineer   | frontend — its `ref` is pull request 562,|
//   |                  |                 | whose branch is `ursa-frontend/...`      |
//   | 2026-10-27 00:28 | Ursa/engineer   | security — `data.my_pr` is 572, its own  |
//   |                  |                 | branch, which had commits at 00:27:32    |
//   | 2026-10-27 00:36 | Ursa/engineer   | pm — the handoff its own 00:40 report    |
//   | 2026-10-27 00:37 | Ursa/engineer   | pm — a claim on finance's branch         |
//   | 2026-10-27 00:38 | Ursa/engineer   | pm — the matching release                |
//   | 2026-10-27 00:40 | Ursa/engineer   | pm — `data.merged` names three merges    |
//
// THREE COSTS, each in a rule that is already written down, so none of this is
// hypothetical:
//
//   1. The correction goes to the wrong seat. The 21:12 row put the frontend
//      seat's measurement under this seat's name in the exo seat's inbox, and
//      the obvious reply would have corrected a seat that measured nothing
//      while leaving the seat that did the work holding a wrong row.
//   2. The merge attribution inverts. `docs/standards/pm.md` §15 rule 3 says
//      the ExO's autonomy attribute is read off `data.merged` on a `done`.
//      The 00:40 row carries `["Ursa#565", "Ursa#575", "Ursa#577"]` and says
//      it came from `engineer`, a seat whose charter forbids it from merging
//      at all. Three merges credited to the seat that cannot make them.
//   3. A claim is held by the wrong name. §15's mechanic says a release
//      counts when it comes from the same name that claimed. The 00:37 claim
//      on another seat's branch was recorded from this seat, so the seat
//      actually holding the branch could not have released it.
//
// WHY REFUSING IS THE REPAIR AND A BETTER DEFAULT IS NOT. There is no value
// this tool can put in that field that is true of a sender it was not told
// about. `engineer` was wrong seven times in four hours; any other literal
// would be wrong in the same shape, and a literal that is right for the seat
// who wrote it is exactly how this one came to be here. Exit 1 costs the
// sender one flag and is loud in the same run; a wrong row is silent, costs
// the whole correction, and the board has no delete route.
//
// WHY THE SPELLING ARM IS NOT COSMETIC, measured against the live read route
// on 2026-10-27 with this seat's own token, 36-hour window:
//
//     from_seat=engineer&from_company=Ursa   -> 20 rows
//     from_seat=Engineer&from_company=Ursa   ->  0 rows
//     from_seat=ENGINEER&from_company=Ursa   ->  0 rows
//     from_seat=engineer&from_company=ursa   -> 20 rows
//
// The sender SEAT is matched exactly by the read route and the sender COMPANY
// is not. So a row recorded from `Engineer` is stored, is delivered, and is
// invisible to every read that filters on the seat, including the seat's own
// inbox pass and every instrument that counts a seat's sends. That is the same
// silent-in-both-directions failure as the company spelling in
// `./check.mjs`, on the field beside it, and it is why a case-only miss is an
// exit 1 here rather than a note.
//
// WHAT IS DELIBERATELY NOT REFUSED. A sender seat this company's roster does
// not list at all, when it is not a case variant of one. The board carries
// senders no product roster holds (`chair:asc-host`,
// `alexandra-systems/exo-centralizer`), `company.yaml` is this repository's
// declaration rather than the board's table, and a seat activated before that
// file is revised is a real event here: the roster said three seats for eleven
// days while ten ran. Refusing an unlisted name would have blocked those
// seats from reporting at all, which is worse than a row whose sender is
// spelled in full and is simply new. A case variant has no such reading: the
// roster holds the name, and only the casing differs.
import { readFileSync } from 'node:fs'

/** This repository's declaration to HQ, which carries the board spelling of
 *  the company under `product:` and the seat roster under `seats:`. The
 *  default is resolved from this module's own location so it is the same file
 *  whatever directory a seat invokes the poster from. */
export const DECLARATION_PATH = new URL('../../company.yaml', import.meta.url).pathname

/**
 * The two facts `company.yaml` holds about a sender.
 *
 * @typedef {object} Declaration
 * @property {string} company the board spelling, from the `product:` key.
 *   Empty when the file has no such key.
 * @property {string[]} seats every seat name in the `seats:` block, in file
 *   order. Empty when the file has no such block.
 */

/**
 * Read the declaration. Returns empty fields rather than throwing when the
 * file is absent, because a clone with no `company.yaml` is a condition
 * `senderFault` reports in words, not an exception for a caller to catch.
 *
 * Parsed with two anchored regular expressions and not a YAML library: the
 * two keys needed are a column-zero scalar and a block of single-line flow
 * mappings, and `tools/` scripts run in a bare checkout with no
 * `npm install`, so a dependency here would be a dependency the poster cannot
 * have. See §8.6 of `docs/design/board-write-path.md` for the alternative
 * considered.
 *
 * @param {string} [path]
 * @returns {Declaration}
 */
export function declarationOf(path = DECLARATION_PATH) {
  let src = ''
  try {
    src = readFileSync(path, 'utf8')
  } catch {
    return { company: '', seats: [] }
  }
  const product = src.match(/^product:[ \t]*(\S+)[ \t]*$/m)

  // Only the `seats:` block, so a `name:` key anywhere else in the file
  // cannot enter the roster. Walked line by line rather than captured with
  // one pattern because the block is the last in the file and JavaScript
  // regular expressions have no end-of-input anchor that is not also the
  // end of a line under `m` — the first version of this used `\Z`, which
  // JavaScript reads as a literal `Z`, and silently returned no seats at all.
  const seats = []
  let inBlock = false
  for (const raw of src.split('\n')) {
    if (/^seats:[ \t]*$/.test(raw)) { inBlock = true; continue }
    if (!inBlock) continue
    if (/^\S/.test(raw)) break // the next column-zero key ends the block
    const entry = raw.match(/^[ \t]*-[ \t]*\{[ \t]*name:[ \t]*([A-Za-z0-9_:-]+)/)
    if (entry) seats.push(entry[1])
  }
  return { company: product ? product[1] : '', seats }
}

/**
 * @typedef {object} SenderInputs
 * @property {string} [seatFlag] the value of `--seat`, '' when absent.
 * @property {string} [companyFlag] the value of `--company`, '' when absent.
 * @property {Record<string, string | undefined>} [env] the environment, read
 *   from `process.env` by the caller. Only `ASC_SEAT` is consulted.
 * @property {Declaration} [declaration] the result of `declarationOf()`.
 */

/**
 * The one condition that stops this row being attributable, named, with the
 * repair that condition in particular takes. Same shape and same contract as
 * `liveTargetFault` in `./live-target.mjs`: null means proceed.
 *
 * @param {SenderInputs} inputs
 * @returns {null | {code: string, line: string, repair: string}}
 */
export function senderFault({
  seatFlag = '',
  companyFlag = '',
  env = {},
  declaration = { company: '', seats: [] },
} = {}) {
  const seat = String(seatFlag || env.ASC_SEAT || '').trim()
  const company = String(companyFlag || declaration.company || '').trim()

  if (seat === '') {
    return {
      code: 'SENDER_SEAT_UNNAMED',
      line: 'The sender seat is not named: --seat was not passed and ASC_SEAT is not set, so this row would say it came from a seat nothing here was told about.',
      repair:
        'pass --seat with your own seat, e.g. --seat security. ASC_SEAT is set by the resident host runtime and unset on a GitHub runner, which is why this is the usual case rather than the rare one.',
    }
  }

  const near = declaration.seats.find((s) => s.toLowerCase() === seat.toLowerCase())
  if (near && near !== seat) {
    return {
      code: 'SENDER_SEAT_SPELLING',
      line: `The sender seat "${seat}" differs from "${near}" only in case, and the board's own read route matches this field exactly.`,
      repair: `write "${near}". The store will accept the one you wrote and every read that filters from_seat=${near} will miss the row, including your own inbox pass, so the row exists and the seat that sent it cannot find it.`,
    }
  }

  if (company === '') {
    return {
      code: 'SENDER_COMPANY_UNDECLARED',
      // `company.yaml` by name and not `DECLARATION_PATH`, which resolves to
      // an absolute path on whatever machine the poster runs on. The
      // redaction rider in `prompts/engineer-agent.md` is about artifacts,
      // and a tool's own output is the same hazard with a wider audience.
      line: 'The sender company is not named: --company was not passed and company.yaml carries no readable product: key to read it from.',
      repair:
        'pass --company with the board spelling of this company, e.g. --company Ursa, or repair the product: key in company.yaml, which is where every other reader of this repository gets that name.',
    }
  }

  return null
}

/**
 * The sender the payload carries. Only meaningful when `senderFault` returned
 * null for the same inputs; it is a separate function so the refusal and the
 * resolution cannot drift apart, in the same way `./check.mjs` separates
 * `violations` from the payload assembly that follows it.
 *
 * @param {SenderInputs} inputs
 * @returns {{seat: string, company: string}}
 */
export function senderOf({
  seatFlag = '',
  companyFlag = '',
  env = {},
  declaration = { company: '', seats: [] },
} = {}) {
  return {
    seat: String(seatFlag || env.ASC_SEAT || '').trim(),
    company: String(companyFlag || declaration.company || '').trim(),
  }
}
