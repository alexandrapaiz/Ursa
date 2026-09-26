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

  it('discards a reading that points at a step that does not exist', () => {
    const v = readVerdict(prompts, () => '{"accepted": false, "step": 999, "quote": "no, that is not it"}')
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
