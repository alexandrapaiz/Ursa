import { describe, expect, it } from 'vitest'
import { readVerdict, NO_VERDICT } from './verdict'
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
