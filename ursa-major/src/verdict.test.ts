import { describe, expect, it } from 'vitest'
import { readVerdict, NO_VERDICT, isNeutralAck, shownText, TRANSCRIPT_CHAR_LIMIT } from './verdict'
import type { UserPrompt } from './types'

const prompts: UserPrompt[] = [
  { step: 3, text: 'make the header smaller' },
  { step: 12, text: 'no, that is not it, try the other layout' },
  { step: 730, text: 'yesss finallyyy!! lol' },
]

describe('readVerdict — stated tier only', () => {
  it('accepts a reading whose quote is verbatim in the named step', () => {
    const v = readVerdict(prompts, () => '{"accepted": true, "step": 730, "quote": "yesss finallyyy!!"}')
    expect(v).toEqual({
      accepted: true, step: 730, quote: 'yesss finallyyy!!',
      basis: 'read-from-chat', confidence: 'stated',
    })
  })

  it('discards a hallucinated quote as a misread — the session stays undeclared', () => {
    const v = readVerdict(prompts, () => '{"accepted": true, "step": 730, "quote": "this is perfect, ship it"}')
    expect(v).toEqual(NO_VERDICT)
  })

  it('repairs a misnumbered step from the trace when the quote is verbatim', () => {
    // the n=1 acceptance run: the model quoted the verdict exactly but
    // said step 710; the quote lives at step 730 and the trace governs
    const v = readVerdict(prompts, () => '{"accepted": true, "step": 710, "quote": "yesss finallyyy!! lol"}')
    expect(v.accepted).toBe(true)
    expect(v.step).toBe(730)
    expect(v.quote).toBe('yesss finallyyy!! lol')
  })

  it('a quote found nowhere in the trace stays undeclared even with a plausible step', () => {
    const v = readVerdict(prompts, () => '{"accepted": false, "step": 12, "quote": "utterly wrong, start over"}')
    expect(v).toEqual(NO_VERDICT)
  })

  it('null accepted means undeclared, never a guess', () => {
    const v = readVerdict(prompts, () => '{"accepted": null, "step": null, "quote": null}')
    expect(v).toEqual(NO_VERDICT)
  })

  it('tolerates a fenced reply', () => {
    const v = readVerdict(prompts, () => '```json\n{"accepted": false, "step": 12, "quote": "that is not it"}\n```')
    expect(v.accepted).toBe(false)
    expect(v.step).toBe(12)
  })

  it('empty prompt list never calls the model', () => {
    const v = readVerdict([], () => { throw new Error('must not be called') })
    expect(v).toEqual(NO_VERDICT)
  })
})

describe('the substance guards — discard-only, added 2026-09-27', () => {
  const trace: UserPrompt[] = [
    { step: 5, text: 'add the health route' },
    { step: 19, text: 'continue' },
    { step: 23, text: 'Thanks!' },
  ]

  it('refuses a neutral acknowledgement even though it is verbatim in the trace', () => {
    // Verbatim presence passes here: the user really did type "continue".
    // Presence alone therefore cannot be the only test, or the reader
    // manufactures a satisfied label out of a neutral word.
    expect(readVerdict(trace, () => '{"accepted": true, "step": 19, "quote": "continue"}')).toEqual(NO_VERDICT)
    expect(readVerdict(trace, () => '{"accepted": true, "step": 23, "quote": "Thanks!"}')).toEqual(NO_VERDICT)
  })

  it('normalizes case and surrounding punctuation before comparing against the ack list', () => {
    expect(isNeutralAck('Ok.')).toBe(true)
    expect(isNeutralAck('  THANK YOU!! ')).toBe(true)
    expect(isNeutralAck('ok this is good now')).toBe(false)
  })

  it('refuses a quote too short to carry a verdict', () => {
    expect(readVerdict([{ step: 3, text: 'smaller' }], () => '{"accepted": true, "step": 3, "quote": "s"}'))
      .toEqual(NO_VERDICT)
  })

  it('every guard can only remove a verdict, never create one', () => {
    // The guards are checked before presence, and each returns NO_VERDICT.
    // A runner that reports no verdict stays no verdict regardless.
    expect(readVerdict(trace, () => '{"accepted": null, "step": null, "quote": null}')).toEqual(NO_VERDICT)
  })
})

describe('verification reads what the model was shown', () => {
  it('matches a quote that crosses a newline, and returns the span with the newline intact', () => {
    // The transcript flattens newlines before the model sees them, so the
    // model's verbatim quote carries a space where the message carries a
    // newline. Comparing against the raw message discarded this true
    // verdict as a hallucination until 2026-09-27.
    const prompts: UserPrompt[] = [{ step: 44, text: 'that is exactly it\nthank you, leave it there' }]
    const v = readVerdict(prompts, () => '{"accepted": true, "step": 44, "quote": "that is exactly it thank you"}')
    expect(v.accepted).toBe(true)
    expect(v.step).toBe(44)
    expect(v.quote).toBe('that is exactly it\nthank you')
  })

  it('shows the model at most TRANSCRIPT_CHAR_LIMIT characters of one message', () => {
    const long = 'x'.repeat(TRANSCRIPT_CHAR_LIMIT + 500)
    expect(shownText({ step: 1, text: long }).length).toBe(TRANSCRIPT_CHAR_LIMIT)
  })

  it('a verdict past the transcript limit is unreachable, and the reader says undeclared', () => {
    const prompts: UserPrompt[] = [{ step: 40, text: 'y'.repeat(2200) + ' i love it, that is the one' }]
    // the runner cannot quote what it was never shown; a reply that does
    // is a hallucination by construction and is discarded
    const v = readVerdict(prompts, () => '{"accepted": true, "step": 40, "quote": "i love it, that is the one"}')
    expect(v).toEqual(NO_VERDICT)
  })
})
