// Can `tools/board/post.mjs` reach the live board at all, as a pure function.
//
//   import { liveTargetFault } from './live-target.mjs'
//
// WHY IT IS A SEPARATE FILE. post.mjs reads the environment, builds a payload
// and awaits a `fetch` at module scope, so importing it posts a message. There
// was no way to ask it this question, and the branch below was therefore
// unreachable from a test. This is the split `scripts/dep-floor-summary.mjs`
// is out of `scripts/dep-floor.mjs`, and `tools/ledger/block-kinds.mjs` is out
// of `tools/ledger/check.mjs`, for the same reason.
//
// WHY THE BRANCHES EXIST AT ALL. The line this replaces was:
//
//     if (!url.startsWith('http') || !token) {
//       console.error('BOARD_API_URL and BOARD_RUNTIME_TOKEN must both be set, ...')
//
// One named cause for a condition reachable three ways, and for one of the
// three the named cause is false. With `BOARD_API_URL=example.com/board` the
// variable IS set; what is wrong is that it carries no scheme, and a seat told
// to set a variable it has already set goes looking in the wrong place. The
// three conditions also do not share a repair: a missing variable means the
// run is not under the seat runtime, while a schemeless one means the runtime
// handed over a value this tool cannot use.
//
// WHY THE EXIT CODE CHANGED, 1 to 2. post.mjs's own header defines exit 1 as
// "refused locally, nothing sent", which is a verdict about the MESSAGE: a
// seat reading it goes and edits its subject or its body. An unset token is
// not a fact about the message, and no edit to the message fixes it. Exit 2 is
// already this repository's code for a tool that cannot do its job rather than
// one that found a defect: `tools/secret-scan.mjs` ("cannot do its job"),
// `scripts/redaction-check.mjs` (cannot read the gate's rules) and
// `tools/ledger/pairwise.mjs` (usage or environment fault) all use it that
// way. Nothing is weakened by the change, because both codes are non-zero and
// no caller distinguishes them; what changes is that the number now agrees
// with the sentence.

/**
 * @param {{apiUrl?: string, token?: string}} env the two variables the seat
 *   runtime is responsible for setting, read from `process.env` by the caller.
 * @returns {null | {code: string, line: string, repair: string}} null when a
 *   live post can be attempted. Otherwise the one condition that actually
 *   fired, named, with the repair that condition in particular takes.
 */
export function liveTargetFault({ apiUrl = '', token = '' } = {}) {
  const url = String(apiUrl).trim()
  const hasUrl = url !== ''
  const hasScheme = /^https?:\/\//.test(url)
  const hasToken = String(token).trim() !== ''

  const runtime =
    'run under the seat runtime, or pass --dry-run to check the message without sending it'

  if (!hasUrl && !hasToken) {
    return {
      code: 'BOARD_ENV_ABSENT',
      line: 'Neither BOARD_API_URL nor BOARD_RUNTIME_TOKEN is set, so there is no live board to post to.',
      repair: runtime,
    }
  }
  if (!hasUrl) {
    return {
      code: 'BOARD_URL_ABSENT',
      line: 'BOARD_RUNTIME_TOKEN is set but BOARD_API_URL is not, so the token has no board to authenticate to.',
      repair: runtime,
    }
  }
  if (!hasScheme) {
    return {
      code: 'BOARD_URL_SCHEMELESS',
      // The value is a host name, not a credential, and naming it is the whole
      // point: the complaint is about this value and not about its absence.
      line: `BOARD_API_URL is set to "${url}", which carries no http:// or https:// scheme, so fetch cannot use it. It is set; it is not usable.`,
      repair:
        'set BOARD_API_URL to a full origin such as https://board.example/ — this is the runtime handing over a value, not a message this seat can edit',
    }
  }
  if (!hasToken) {
    return {
      code: 'BOARD_TOKEN_ABSENT',
      line: 'BOARD_API_URL is set but BOARD_RUNTIME_TOKEN is not, so every post would be refused unauthenticated.',
      repair: runtime,
    }
  }
  return null
}
