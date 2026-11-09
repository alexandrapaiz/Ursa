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
/**
 * Mask a `user:pass@` prefix on a value that has no scheme, so naming an
 * unusable URL cannot publish a credential somebody put inside it. Anchored
 * and `/`-bounded: a port (`host:8080/x`) and a path containing an at sign
 * (`host/a@b`) are both left alone, because neither is userinfo.
 *
 * @param {string} value the raw environment value
 * @returns {string} the same value with any userinfo replaced
 */
export function maskUserinfo(value) {
  return String(value).replace(/^[^/@]*:[^/@]*@/, '<userinfo>@')
}

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
      // Naming the value is the whole point: the complaint is about this value
      // and not about its absence. Userinfo is masked before it is named, and
      // the reason is the branch itself. A schemeless value is by definition
      // one this tool could not parse, so `user:pass@host/x` is a shape it has
      // to treat as possible, and post.mjs's header promises that the
      // environment is never echoed as a credential. The host, the port and
      // the path survive the mask, so the diagnostic keeps everything a seat
      // reads it for. Nothing in this sandbox's value matches it today,
      // measured without printing the value. The 2026-10-27 audit, F37.
      line: `BOARD_API_URL is set to "${maskUserinfo(url)}", which carries no http:// or https:// scheme, so fetch cannot use it. It is set; it is not usable.`,
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

/**
 * The other half of reach, and the half no guard can answer before the call.
 *
 * WHY THIS IS A SECOND FUNCTION AND NOT A SIXTH BRANCH OF THE ONE ABOVE.
 * `liveTargetFault` grades the environment, which is a value in hand, so it
 * can refuse before anything is sent. Whether a well-formed origin actually
 * answers is not a property of any value this process holds; it is only
 * learned by calling. F125 (audit 2026-11-09, run 13) fixed the knowable half
 * by checking before the call and said in the same paragraph that a thrown URL
 * error and a thrown network error are one exception type and only the first
 * is knowable in advance. This function is the second one, classified after
 * the throw instead of predicted before it.
 *
 * WHAT IT COST TO LEAVE THIS OUT, measured 2026-11-09 by this seat's run 15
 * with `BOARD_API_URL` pointed at a dead loopback port and the credential left
 * in place. Four of thirteen board-reading gates exited 1 from an unhandled
 * undici rejection: `bypass.mjs --audit`, `measure-claims.mjs`, `page.mjs` and
 * `read-filters.mjs`. In all four, 1 is the file's own code for a CERTAIN
 * finding about the repository, and three of the four declare a separate code
 * for having no board to read. So an outage in the holding company's runtime
 * published as a verdict about the branch under test, from a stack trace,
 * with none of the code that produces verdicts having run.
 *
 * THE VALUE IS NEVER ECHOED. Node puts the dial target in `cause.message`
 * (`connect ECONNREFUSED 127.0.0.1:1`), which is a host and a port rather
 * than a credential, but the url may carry userinfo and the message is not
 * this function's to trust, so everything named goes through `maskUserinfo`
 * on the way out.
 *
 * @param {unknown} error whatever the call threw.
 * @returns {{code: string, line: string, repair: string}} always a fault: this
 *   is only called from a `catch`, so there is no clean branch to return.
 */
export function reachFault(error) {
  const cause = error && typeof error === 'object' ? error.cause : undefined
  const code = String(cause?.code ?? (error && error.code) ?? '')
  const detail = maskUserinfo(String(cause?.message ?? error?.message ?? error ?? '')).slice(0, 200)

  // ERR_INVALID_URL is the one `liveTargetFault` is meant to have caught, so
  // arriving here with it means the guard was skipped rather than that the
  // board is down. Named separately, because the repair is a different one and
  // a reader sent to the network over a malformed variable looks in the wrong
  // place -- which is the defect `liveTargetFault`'s own header was written
  // about.
  if (code === 'ERR_INVALID_URL') {
    return {
      code: 'BOARD_URL_UNUSABLE',
      line: `BOARD_API_URL could not be parsed as a URL, so no request was made (${detail}).`,
      repair:
        'call liveTargetFault before the request: this condition is knowable from the value alone and should not have reached a catch',
    }
  }

  return {
    code: 'BOARD_UNREACHABLE',
    line: `the board did not answer${code ? ` (${code})` : ''}, so nothing was read and this is not a verdict about the repository${detail ? `: ${detail}` : ''}`,
    repair:
      'retry, or check whether the holding company\'s runtime is up. The repair for this one is not in this repository.',
  }
}
