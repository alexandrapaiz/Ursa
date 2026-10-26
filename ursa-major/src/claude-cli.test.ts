import { describe, expect, it } from 'vitest'

import { cliFailureReason, envelopeFailure } from './claude-cli'

// The guard these tests replace was one line with three ways through it:
//
//     if (envelope.is_error || typeof envelope.result !== 'string') {
//       throw new Error('claude -p returned an error envelope')
//     }
//
// So the assertions below are organised by WHICH branch fired, not by which
// message came out, because the whole defect was that the branch and the
// message had come apart. Each `it` names the repair its branch asks for.
describe('envelopeFailure', () => {
  it('passes a usable envelope', () => {
    expect(envelopeFailure({ result: 'the answer', is_error: false })).toBeNull()
    expect(envelopeFailure({ result: 'the answer' })).toBeNull()
  })

  it('carries the CLI reason when is_error is set and result holds it', () => {
    // The real envelope, from the 2026-10-26 dogfooding run named in
    // cliFailureReason's comment. This is the branch whose repair is one
    // command, and the branch the old single message threw away.
    const failure = envelopeFailure({
      is_error: true,
      terminal_reason: 'api_error',
      result: 'Not logged in · Please run /login',
    })
    expect(failure).toContain('Not logged in · Please run /login')
    expect(failure, 'the CLI said why it stopped, so the message says it').toContain('api_error')
  })

  it('says the CLI gave no reason, rather than inventing one, when result is empty', () => {
    const failure = envelopeFailure({ is_error: true, result: '   ', subtype: 'error_during_execution' })
    expect(failure).toContain('no reason')
    expect(failure).toContain('error_during_execution')
    // The distinguishing assertion: this branch must not read as the branch
    // above it, where a reason exists and is printed.
    expect(failure).not.toContain('Not logged in')
  })

  it('does not call an unrecognised envelope an error, because nothing reported one', () => {
    // `is_error` absent, `result` absent: the old message sent the reader to
    // look for a CLI error that never happened. The repair is in the parser,
    // and the keys present are what identify a changed output format.
    const failure = envelopeFailure({ terminal_reason: 'success', subtype: 'ok' })
    expect(failure).toContain('reported no error')
    expect(failure, 'names the shape so a format change is identifiable').toContain('terminal_reason')
    expect(failure).toContain('typeof result: undefined')
    expect(failure).toContain('src/claude-cli.ts')
  })

  it('treats a non-string result as a shape problem, not a failed call', () => {
    const failure = envelopeFailure({ result: { text: 'answer' } })
    expect(failure).toContain('reported no error')
    expect(failure).toContain('typeof result: object')
  })

  it('reports an is_error envelope that also has no result as the error branch', () => {
    // Both halves of the old disjunction are true at once. The error branch
    // wins, because a CLI that said it failed is the fact the reader needs
    // first; a missing `result` on top of that is not a schema change.
    const failure = envelopeFailure({ is_error: true })
    expect(failure).toContain('set is_error with no reason')
    expect(failure).not.toContain('reported no error')
  })
})

describe('cliFailureReason', () => {
  // These six pin the non-zero-exit surface, unchanged by the move out of
  // src/tuning/distill.ts and kept here beside the surface they are
  // independent of, so the next reader sees both at once.
  it('reads the reason off a thrown error that carries the envelope', () => {
    const err = { status: 1, stdout: JSON.stringify({ is_error: true, result: 'Not logged in · Please run /login' }) }
    expect(cliFailureReason(err)).toBe('Not logged in · Please run /login')
  })

  it('returns null when there is no envelope to read, so the original error survives', () => {
    expect(cliFailureReason({ code: 'ENOENT', stdout: '' })).toBeNull()
    expect(cliFailureReason({ status: 1, stdout: 'not json at all' })).toBeNull()
    expect(cliFailureReason(new Error('spawn timed out'))).toBeNull()
    expect(cliFailureReason({ stdout: JSON.stringify({ is_error: true, result: '   ' }) })).toBeNull()
    expect(cliFailureReason({ stdout: JSON.stringify({ is_error: true }) })).toBeNull()
  })
})
