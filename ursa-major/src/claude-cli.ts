// The one place that runs `claude -p --output-format json` and the one place
// that reads what it says when it fails.
//
// WHY THIS FILE EXISTS, which is a statement about a defect class rather than
// about a feature. Two callers shell out to the Claude Code CLI with the same
// flags: `claudeRunner` in src/tuning/distill.ts, for the distiller's
// interpretation pass, and `claudeVerdictRunner` in src/verdict.ts, for
// reading whether the owner stated a verdict. They were written as two copies
// of eight lines, so on 2026-10-26 the distiller got `cliFailureReason` — the
// repair that surfaces the CLI's own reason instead of Node's `Command failed`
// — and the verdict reader, four directories away, kept the original bug. A
// seat hitting it in `ursa run` would have been told nothing it could act on,
// in the one failure mode this repository had already diagnosed and fixed.
// Sharing the implementation is what makes the next such repair arrive at both
// call sites, so the duplication is the defect and this module is the fix.
//
// THE TWO FAILURE SURFACES, which are independent and are why there are two
// functions below. `claude -p --output-format json` can fail in two ways that
// look nothing alike from Node:
//
//   1. It exits non-zero and still prints a complete envelope on stdout.
//      `execFileSync` throws on the exit code, so the envelope arrives as an
//      unlabelled field of the thrown error. `cliFailureReason` reads it.
//   2. It exits ZERO and prints an envelope that is not a usable answer.
//      Nothing throws. `envelopeFailure` reads it.
//
// Both were measured, not imagined; each function's own comment carries its
// measurement.

import { execFileSync } from 'node:child_process'

/** The fields of `claude -p --output-format json` this module reads. Every one
 *  is optional because the envelope's shape is the CLI's to change, and a
 *  parser that assumes a shape is how surface 2 below goes undiagnosed. */
interface PrintEnvelope {
  result?: unknown
  is_error?: unknown
  /** why the CLI stopped, e.g. `"api_error"`. Reported when present. */
  terminal_reason?: unknown
  subtype?: unknown
}

/** A `result` that is actually an answer: a string with something in it. */
function usableResult(envelope: PrintEnvelope): string | null {
  const { result } = envelope
  return typeof result === 'string' && result.trim().length > 0 ? result.trim() : null
}

/** `terminal_reason` and `subtype`, when the CLI supplied them, as ` (...)`. */
function terminalContext(envelope: PrintEnvelope): string {
  const parts: string[] = []
  for (const field of ['terminal_reason', 'subtype'] as const) {
    const v = envelope[field]
    if (typeof v === 'string' && v.trim().length > 0) parts.push(`${field}=${v.trim()}`)
  }
  return parts.length > 0 ? ` (${parts.join(', ')})` : ''
}

/**
 * The reason `claude -p` gives for its own failure, read off the JSON
 * envelope it prints on stdout even when it exits non-zero.
 *
 * WHY THIS EXISTS. `claude -p --output-format json` exits 1 on an API
 * error and still prints a complete, well-formed envelope whose `result`
 * field is the human-readable reason. `execFileSync` throws on the exit
 * code, so the specific message in `envelopeFailure` used to be
 * unreachable in exactly the case it was written for, and the caller got
 * Node's own `Command failed: claude -p --model sonnet --output-format
 * json` with the envelope dumped as an unlabelled field of the error
 * object.
 *
 * Measured 2026-10-26 by the engineer seat's own dogfooding run
 * (sprint-2026-10-26 item 2), distilling a real outcome record on a host
 * where the CLI is installed and has no credentials. The envelope carried
 * `"is_error":true`, `"terminal_reason":"api_error"` and
 * `"result":"Not logged in · Please run /login"`, which is a one-line fix
 * the operator can act on, and none of it reached the operator.
 *
 * Returns null when the error carries no parseable envelope, so a
 * genuinely missing binary or a timeout still reports as itself.
 */
export function cliFailureReason(err: unknown): string | null {
  const stdout = (err as { stdout?: unknown })?.stdout
  if (typeof stdout !== 'string' || stdout.trim().length === 0) return null
  let envelope: unknown
  try {
    envelope = JSON.parse(stdout)
  } catch {
    return null
  }
  const result = (envelope as { result?: unknown })?.result
  return typeof result === 'string' && result.trim().length > 0 ? result.trim() : null
}

/**
 * Why an exit-zero envelope is not a usable answer, as a sentence naming the
 * condition that actually fired. Null when the envelope is fine.
 *
 * WHY THIS REPLACES ONE MESSAGE WITH THREE. Both call sites used to read:
 *
 *     if (envelope.is_error || typeof envelope.result !== 'string') {
 *       throw new Error('claude -p returned an error envelope')
 *     }
 *
 * That guard is a disjunction and the message is one of its branches, which
 * is the defect Ursa's skill seat generalised on 2026-10-26 after this seat
 * found it in the ledger gate: *a failure message names the cause its author
 * thought of, while the number of ways to reach that branch is a property of
 * the code, so one named cause for a condition with several is a hypothesis
 * wearing the authority of a measurement.* Three conditions reach that throw
 * and they ask for three different repairs:
 *
 *   - `is_error` is set and `result` holds the reason. The reason is the
 *     repair — `Not logged in · Please run /login` is one command — and the
 *     old message threw away the one string in the envelope worth printing.
 *     This is the same loss `cliFailureReason` was written to stop on the
 *     non-zero-exit path, surviving on the exit-zero path beside it.
 *   - `is_error` is set and there is no usable `result`. The CLI failed and
 *     said nothing; `terminal_reason` is the only lead, so it is printed.
 *   - `is_error` is NOT set and `result` is absent or not a string. Nothing
 *     reported an error. The envelope simply is not the shape this parser
 *     expects, which happens when `--output-format json` changes, and the
 *     repair is in this file rather than in the call or the credentials. The
 *     keys actually present are named, because they are what identifies a
 *     schema change. Calling this an "error envelope" sent the reader to
 *     look for an error that was never there.
 */
export function envelopeFailure(envelope: PrintEnvelope): string | null {
  const reason = usableResult(envelope)
  const errored = envelope.is_error === true || envelope.is_error === 'true'
  if (errored) {
    return reason !== null
      ? `claude -p reported an error${terminalContext(envelope)}: ${reason}`
      : `claude -p set is_error with no reason in "result"${terminalContext(envelope)}. ` +
          'The CLI failed and did not say why, so there is nothing here to act on but the context above.'
  }
  if (reason === null) {
    const keys = Object.keys(envelope)
    return (
      'claude -p reported no error, and its envelope carries no usable "result" string ' +
      `(keys present: ${keys.length > 0 ? keys.join(', ') : 'none'}; ` +
      `typeof result: ${typeof envelope.result}). ` +
      'This is not a failed call. It is an envelope shape src/claude-cli.ts does not know how to read, ' +
      'which is what a change to --output-format json looks like from here, so the repair is in that ' +
      'file and not in the credentials or the prompt.'
    )
  }
  return null
}

/**
 * Run one `claude -p --output-format json` call and return its `result`.
 *
 * Throws with the CLI's own reason where the CLI supplied one, on either
 * failure surface. Rethrows the original error untouched when there is no
 * envelope to read, so a missing binary and a timeout still report as
 * themselves rather than as an envelope problem they are not.
 */
export function runClaudePrint(prompt: string, model: string, timeoutMs: number): string {
  let out: string
  try {
    out = execFileSync('claude', ['-p', '--model', model, '--output-format', 'json'], {
      input: prompt,
      encoding: 'utf8',
      maxBuffer: 16 * 1024 * 1024,
      timeout: timeoutMs,
    })
  } catch (err) {
    const reason = cliFailureReason(err)
    if (reason) throw new Error(`claude -p failed: ${reason}`)
    throw err
  }
  let envelope: PrintEnvelope
  try {
    envelope = JSON.parse(out) as PrintEnvelope
  } catch (err) {
    // Exit zero and stdout that is not JSON at all. Distinct from every branch
    // of `envelopeFailure`, which only ever sees parsed objects, and reported
    // as itself because the repair is to look at the bytes.
    throw new Error(
      `claude -p exited 0 and printed ${out.length} characters that are not JSON ` +
        `(${(err as Error).message}). First 200 characters: ${JSON.stringify(out.slice(0, 200))}`,
    )
  }
  const failure = envelopeFailure(envelope)
  if (failure !== null) throw new Error(failure)
  return (envelope.result as string)
}
