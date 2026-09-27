import { describe, expect, it } from 'vitest'
import {
  auditCorpus, classify, loadCorpus, reachability, runEval, formatReport,
} from './verdict'
import { NO_VERDICT } from '../verdict'
import type { VerdictCase } from './verdict'

const corpus = loadCorpus()

describe('the verdict corpus itself', () => {
  it('loads, and every case is labelled', () => {
    expect(corpus.cases.length).toBeGreaterThanOrEqual(16)
    for (const c of corpus.cases) {
      expect(c.id).toMatch(/^v\d\d-/)
      expect(c.why.length).toBeGreaterThan(20)
      expect(['boolean', 'object']).toContain(typeof c.truth.accepted) // boolean or null
    }
  })

  it('has no corpus defects: ids unique, truths internally consistent, quotes verbatim', () => {
    expect(auditCorpus(corpus)).toEqual([])
  })

  it('expands PADDING_<n> to exactly n characters', () => {
    const long = corpus.cases.find((c) => c.id === 'v16-verdict-past-the-transcript-limit')!
    expect(long.prompts[0].text.startsWith('earlier context')).toBe(true)
    // 2200 characters of filler, then the single space the corpus writes
    // between the token and the verdict, so the verdict opens at 2201 —
    // past TRANSCRIPT_CHAR_LIMIT, which is the whole point of the case.
    expect(long.prompts[0].text.indexOf('that is exactly right')).toBe(2201)
    expect(long.prompts[0].text.length).toBeGreaterThan(2200)
  })

  it('reports the one case whose verdict the reader cannot see, and only that one', () => {
    const unreachable = corpus.cases.filter((c) => !reachability(c).reachable)
    expect(unreachable.map((c) => c.id)).toEqual(['v16-verdict-past-the-transcript-limit'])
    expect(reachability(unreachable[0]).reason).toContain('past TRANSCRIPT_CHAR_LIMIT')
  })
})

describe('the replay eval — the verification layer under recorded model behaviour', () => {
  const report = runEval(corpus, { mode: 'replay' })

  it('reads no verdict the user never gave: falseSatisfied is zero', () => {
    const offenders = report.results.filter((r) => r.outcome === 'falseSatisfied')
    expect(offenders.map((r) => `${r.id}: ${r.note}`)).toEqual([])
    expect(report.falseSatisfied).toBe(0)
  })

  it('loses no label it can see: missed is zero and the one known miss is explained', () => {
    expect(report.results.filter((r) => r.outcome === 'missed')).toEqual([])
    expect(report.results.filter((r) => r.outcome === 'knownMiss').map((r) => r.id))
      .toEqual(['v16-verdict-past-the-transcript-limit'])
  })

  it('passes the gate with no corpus problems', () => {
    expect(report.auditProblems).toEqual([])
    expect(report.passed).toBe(true)
  })

  it('never spends a model call on a session with zero prompts', () => {
    const empty = report.results.find((r) => r.id === 'v15-empty-session-never-calls-the-model')!
    expect(empty.runnerCalls).toBe(0)
    expect(report.results.every((r) => !r.wastedCall)).toBe(true)
  })

  it('formats a report that names the gate', () => {
    const text = formatReport(report)
    expect(text).toContain('false satisfied     0')
    expect(text).toContain('PASS')
  })
})

describe('classify', () => {
  const stated: VerdictCase = {
    id: 'x01-synthetic', why: 'unit-level check of the classifier itself',
    prompts: [{ step: 5, text: 'i love it' }],
    truth: { accepted: true, step: 5, quote: 'i love it' },
    modelReply: '{}',
  }

  it('calls a satisfied reading against an undeclared label a falseSatisfied', () => {
    const undeclared: VerdictCase = { ...stated, truth: { accepted: null, step: null, quote: null } }
    const got = { accepted: true, step: 5, quote: 'i love it', basis: 'read-from-chat', confidence: 'stated' } as const
    expect(classify(undeclared, got).outcome).toBe('falseSatisfied')
  })

  it('calls a flipped polarity against a stated label a falseSatisfied too', () => {
    const rejected: VerdictCase = { ...stated, truth: { accepted: false, step: 5, quote: 'i love it' } }
    const got = { accepted: true, step: 5, quote: 'i love it', basis: 'read-from-chat', confidence: 'stated' } as const
    expect(classify(rejected, got).outcome).toBe('falseSatisfied')
  })

  it('separates a wrong step from a wrong quote', () => {
    expect(classify(stated, { accepted: true, step: 9, quote: 'i love it', basis: 'read-from-chat', confidence: 'stated' }).outcome)
      .toBe('stepWrong')
    expect(classify(stated, { accepted: true, step: 5, quote: 'love', basis: 'read-from-chat', confidence: 'stated' }).outcome)
      .toBe('quoteWrong')
  })

  it('an unexplained silence on a stated label is a miss, an explained one is a knownMiss', () => {
    expect(classify(stated, NO_VERDICT).outcome).toBe('missed')
    expect(classify({ ...stated, knownLimitation: 'shown to nobody' }, NO_VERDICT).outcome).toBe('knownMiss')
  })
})
