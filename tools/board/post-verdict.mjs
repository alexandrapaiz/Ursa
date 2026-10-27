// The one sentence `tools/board/post.mjs` prints for a reader to act on, as a
// pure function.
//
//   import { verdict, unreachable, GATE } from './post-verdict.mjs'
//
// WHY THIS GATE, AND WHY IT IS THE FIFTH. The four gates extracted on
// 2026-10-26 (`docs/design/verdict-enumeration.md`) were ledger and secret
// checks, picked because three of them already derived their verdicts
// correctly, so the shape was proved on code that worked. This one is picked
// for the opposite reason: it is the file the CAUSE half of the defect class
// was found in. Its live-target branch used to read "BOARD_API_URL and
// BOARD_RUNTIME_TOKEN must both be set", one named cause for a condition
// reachable three ways, false for the way where the variable is set and merely
// schemeless. That was repaired by hand into `./live-target.mjs`, and until
// this file existed nothing could tell whether the repair stayed repaired.
// Now the four conditions are four named causes the enumerator drives on every
// run.
//
// TEN BRANCHES, WHERE THE TEXT SWEEP COUNTS FOUR. `grep -c
// 'process.exit([1-9])'` returns 4 for post.mjs. Driving the verdict finds ten
// distinct causes, and three of the extra six are invisible to a text search
// in principle rather than by accident:
//
//   - The success line has two forms. `id` is set only when the board's
//     response parses as JSON and carries one, so a 2xx that answers with
//     prose prints "Posted note to Ursa/pm." and a seat cannot tell from that
//     line that the id was unreadable. Two forms, and NO `process.exit` at
//     all, because the module falls off its end and node exits 0 implicitly.
//   - The exit-2 branch is one `process.exit(2)` over the four conditions
//     `liveTargetFault` distinguishes.
//   - The dry-run branch exits 0 through `process.exit(0)`, which `[1-9]`
//     does not match.
//
// WHAT IS DELIBERATELY NOT A BRANCH HERE. `--help` prints a usage line and
// exits 0. It is not a verdict: it reports nothing about the message, the
// repository or the board, so there is nothing for it to contradict. It is
// named here because an unlisted exclusion is indistinguishable from an
// oversight.
//
// TWO LOCI THAT NEVER CO-OCCUR, stated because a check that cannot fire
// should say so rather than look like a pass. A message violation is repaired
// by the reader editing the invocation it just typed; a store refusal is
// repaired in `tools/board/check.mjs`, a tracked file, by transcribing the
// rule the store applied and this checker does not. Those cannot both be
// present, because the store is only asked once the local checks pass. So
// MIXED_LOCI_NAMED is not exercised by this gate. The synthetic gate in
// `tools/gates/enumerate-verdicts.test.mjs` is what proves that check fires.

import { LOCUS, POSITION, describeGate, verdictOf } from '../gates/verdict-shape.mjs'
import { liveTargetFault } from './live-target.mjs'

/**
 * One thing wrong, already classified by where its repair lives.
 *
 * @typedef {object} PostFinding
 * @property {'reader' | 'committed'} locus
 * @property {'message' | 'sender' | 'store'} scope which check produced it.
 *   `message` and `sender` both come from `./check.mjs`'s `violations()`, over
 *   the message and over the sender's own company name respectively; `store`
 *   is the board's own refusal of a message these passed.
 * @property {string} [code] the violation code, for the per-finding line.
 * @property {string} [line] what is wrong, in words.
 * @property {string} [repair] what the reader does about it.
 * @property {number} [status] `store` only: the HTTP status the board answered.
 * @property {string} [body] `store` only: the board's response body, verbatim.
 */

/**
 * @param {PostFinding[]} findings every finding, in the order post.mjs
 *   collects them. The caller has already printed one `code: line` and one
 *   `  repair: ...` line per `message`-scope finding.
 * @param {{dryRun?: boolean, kind?: string, toCompany?: string,
 *   toSeat?: string, id?: string}} seen what the invocation knows about itself.
 * @returns {import('../gates/verdict-shape.mjs').Verdict}
 */
export function verdict(findings, seen = {}) {
  const scoped = (s) => findings.filter((f) => f.scope === s)
  const message = scoped('message')
  const sender = scoped('sender')
  const store = scoped('store')

  // Every success and dry-run line names the pair of bus keys that decides who
  // is woken, in the spelling the payload carries. The fallbacks are the ones
  // post.mjs printed before this extraction, character for character: a
  // message with no `to_company` really does reach all companies, and one with
  // no `to_seat` really does wake everyone in the company named.
  const woken = `${seen.toCompany || '(all companies)'}/${seen.toSeat || '(everyone)'}`

  // Order is post.mjs's own order and not a preference. The message checks run
  // before the sender check, which runs before anything is sent, so a run with
  // findings of two scopes reports the one that actually stopped it.
  if (message.length > 0) {
    return verdictOf({
      exitCode: 1,
      stream: 'err',
      cause: 'MESSAGE_REFUSED_LOCALLY',
      cites: [LOCUS.READER],
      line: `${message.length} violation(s). Nothing was posted, so there is no row to live with.`,
    })
  }

  if (sender.length > 0) {
    return verdictOf({
      exitCode: 1,
      stream: 'err',
      position: POSITION.BEFORE,
      cause: 'SENDER_COMPANY_SPELLING',
      cites: [LOCUS.READER],
      line: `SENDER_COMPANY_SPELLING: ${sender[0].line}`,
      trailer: [`  repair: ${sender[0].repair}`],
    })
  }

  if (store.length > 0) {
    const refusal = store[0]
    return verdictOf({
      exitCode: 3,
      stream: 'err',
      position: POSITION.BEFORE,
      cause: 'STORE_REFUSED_WHAT_CHECKER_PASSED',
      cites: [LOCUS.COMMITTED],
      // Both halves are the board's words, not this gate's arithmetic. See
      // `quoted` in ../gates/verdict-shape.mjs for why they have to be
      // declared rather than just interpolated.
      quoted: [String(refusal.status), String(refusal.body ?? '')],
      line: `The board refused it with ${refusal.status}: ${refusal.body ?? ''}`,
      trailer: [
        '  This checker passed a message the store rejected, which means a rule here is',
        '  out of date. Transcribe the failing rule from runtime/board/store.py into',
        '  tools/board/check.mjs so the next seat is told locally instead of by the board.',
      ],
    })
  }

  if (seen.dryRun) {
    return verdictOf({
      exitCode: 0,
      cause: 'CHECKED_CLEAN_DRY_RUN',
      line: `Checked clean. ${woken} would be woken.`,
    })
  }

  const id = String(seen.id ?? '')
  const shown = id.slice(0, 8)
  return verdictOf({
    exitCode: 0,
    // Two causes and not one, for the same reason check-closures.mjs has two
    // forms of its exit-1 line: the shorter form omits a clause a reader would
    // act on. A 2xx response whose body does not parse as JSON, or parses
    // without an `id`, means the row exists and this seat cannot name it, so
    // nothing downstream can quote it in a follow-up.
    cause: shown ? 'POSTED' : 'POSTED_ID_UNREADABLE',
    line: `Posted ${seen.kind} to ${woken}${shown ? `, id ${shown}` : ''}.`,
    quoted: shown ? [shown] : [],
  })
}

/**
 * The ground branch: there is no live board to post to, so nothing was
 * measured about the message at all.
 *
 * @param {{code: string, line: string, repair: string}} fault one
 *   `liveTargetFault` result, whose `code` becomes the verdict's cause so the
 *   four conditions stay four branches instead of collapsing into one.
 * @returns {import('../gates/verdict-shape.mjs').Verdict}
 */
export function unreachable(fault) {
  return verdictOf({
    exitCode: 2,
    stream: 'err',
    derivedFrom: 'ground',
    position: POSITION.BEFORE,
    cause: fault.code,
    line: `${fault.code}: ${fault.line}`,
    trailer: [
      `  repair: ${fault.repair}`,
      '  Nothing was sent, and nothing about the message itself is wrong.',
    ],
  })
}

const refused = (code = 'SUBJECT_EMPTY') => ({
  locus: LOCUS.READER,
  scope: 'message',
  code,
  line: 'x',
  repair: 'y',
})

/** The input space. Outcomes are measured by the enumerator, never declared. */
export const GATE = describeGate({
  id: 'tools/board/post.mjs',
  verdict,
  loci: {
    // The reader edits the invocation it just typed. Named by the clause that
    // tells it nothing is on the bus yet, which is the part that makes the
    // edit worth making.
    [LOCUS.READER]: { noun: /Nothing was posted|^SENDER_COMPANY_SPELLING/m },
    // The repair is a rule in a tracked file, so every clone and CI has the
    // same gap. Named by the file to transcribe it into.
    [LOCUS.COMMITTED]: { noun: /tools\/board\/check\.mjs/ },
  },
  probes: [
    { name: 'posted, id readable', findings: [], seen: { kind: 'note', toCompany: 'Ursa', toSeat: 'pm', id: 'a1b2c3d4e5f6' } },
    { name: 'posted, id unreadable', findings: [], seen: { kind: 'note', toCompany: 'Ursa', toSeat: 'pm' } },
    { name: 'dry run, nothing wrong', findings: [], seen: { dryRun: true, kind: 'note', toCompany: 'Ursa' } },
    { name: 'one message violation', findings: [refused()], seen: { kind: '', toCompany: 'Ursa' } },
    { name: 'three message violations', findings: [refused(), refused('KIND_UNKNOWN'), refused('BODY_MINIMUM')], seen: { kind: '', toCompany: 'Ursa' } },
    {
      name: 'the sender company is not a bus key',
      findings: [{ locus: LOCUS.READER, scope: 'sender', code: 'COMPANY_SPELLING', line: 'company "ursa minor" is not one the bus routes', repair: 'use one of: Ursa, Atelier' }],
      seen: { kind: 'note', toCompany: 'Ursa' },
    },
    {
      name: 'the store refused what the local checks passed',
      findings: [{ locus: LOCUS.COMMITTED, scope: 'store', status: 422, body: '{"error":"a message needs a subject"}' }],
      seen: { kind: 'note', toCompany: 'Ursa', toSeat: 'pm' },
    },
  ],
  /** Ground branches: no findings, exempt from the findings checks, and driven
   *  through the real `liveTargetFault` rather than through a hand-written
   *  fault object, so a reworded or renumbered condition in that file shows up
   *  here instead of staying invisible behind a fixture. */
  groundProbes: [
    { name: 'neither variable set', call: () => unreachable(liveTargetFault({})) },
    { name: 'token without a url', call: () => unreachable(liveTargetFault({ token: 't' })) },
    { name: 'url set but schemeless', call: () => unreachable(liveTargetFault({ apiUrl: 'board.example/api', token: 't' })) },
    { name: 'url without a token', call: () => unreachable(liveTargetFault({ apiUrl: 'https://board.example' })) },
  ],
})
