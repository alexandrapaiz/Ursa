// What happens to a span the fuzzy pass never looked at, and how the record
// says so. Added 2026-10-24 with `FinalSpan.noCandidate`.
//
// The defect these tests pin down was routed by Ursa's research seat and is
// written up as finding 52 of docs/research/briefs/2026-10-24-message-14.md.
// MAX_TOKEN_DF is an absolute count of generation segments, so the set of
// tokens the fuzzy pass refuses to seed on grows with the corpus, and a span
// every one of whose corpus-present tokens is over the cutoff seeds zero
// candidates. Before this change it fell through to a bare
// `no_generation_provenance` that read identically to a span the matcher had
// looked at and placed nowhere.

import { describe, it, expect } from 'vitest'
import { resolve } from './resolve'
import { checkRecord } from './invariants'
import { MAX_TOKEN_DF } from './match'
import type { ConversationMeta, RawGeneration } from './types'

const CONVS: ConversationMeta[] = [
  { id: 'c1', title: 'df cutoff probe', adapter: 'paste', model: 'probe-model', turns: 2, userTurns: 1 },
]

const gen = (text: string): RawGeneration => ({
  conversationId: 'c1',
  model: 'probe-model',
  turnIndex: 0,
  kind: 'assistant_text',
  text,
})

/**
 * One generation holding `n` prose sentences, every one of them containing
 * all four of `alpha beta gamma delta`, so those four tokens have a document
 * frequency of exactly `n`. The trailing ordinal keeps the sentences distinct
 * so segmentation cannot collapse them, and the vocabulary of the ordinals is
 * disjoint from every final file below.
 */
const commonTokenCorpus = (n: number) =>
  gen(
    Array.from({ length: n }, (_, i) => `Row w${i} holds alpha beta gamma delta onward.`).join(' '),
  )

/**
 * The final span under test. Every token of it except `onwards` appears in
 * every row of the corpus, so each one's document frequency is the corpus
 * size; `onwards` appears in no row, which is the uninteresting case the
 * cutoff has nothing to do with. The row identifiers `w0`, `w1` and so on
 * are deliberately absent from it, because a single low-frequency token
 * would be enough to seed the candidate set and the point here is a span
 * with none.
 */
const EDITED_ROW = 'Row holds alpha beta gamma delta onwards.'

const run = (finalText: string, generations: RawGeneration[]) =>
  resolve({
    taskId: 'df-cutoff-probe',
    files: [{ path: 'final.md', text: finalText }],
    conversations: CONVS,
    generations,
    finished: true,
    generatedAt: '2026-10-24T00:00:00.000Z',
  })

describe('the document-frequency cutoff decides whether the classifier looks at a span at all', () => {
  it('is a cutoff on segment count, so the same span changes class when only the corpus grows', () => {
    // Under the cutoff, the four tokens seed candidates and the span is
    // scored. It is a mutation of a sentence the model wrote, which is what
    // it is.
    const small = run(EDITED_ROW, [commonTokenCorpus(4)])
    const underCutoff = small.files[0].spans[0]
    expect(underCutoff.class).toBe('survived_mutated')
    expect(underCutoff.noCandidate, 'a scored span names no reason').toBeUndefined()
    expect(underCutoff.tokenSuppression, 'nothing was suppressed').toBeUndefined()

    // Over the cutoff, with the SAME final text and the same four tokens,
    // every token is skipped, the candidate set is empty before scoring
    // begins, and the label flips to the category CLAUDE.md §1 calls the
    // most valuable. This is the defect, reproduced.
    const big = run(EDITED_ROW, [commonTokenCorpus(MAX_TOKEN_DF + 1)])
    const overCutoff = big.files[0].spans[0]
    expect(overCutoff.class).toBe('no_generation_provenance')
    expect(overCutoff.candidate, 'nothing was scored, so there is nothing to show').toBeUndefined()

    // And this is the half that is fixed: the record now says which of the
    // two things happened to it.
    expect(overCutoff.noCandidate).toBe('df_cutoff_suppressed')
    expect(overCutoff.tokenSuppression).toEqual({
      distinct: 7,
      suppressed: 6,
      cutoff: MAX_TOKEN_DF,
      corpusSegments: MAX_TOKEN_DF + 1,
    })
    expect(big.stats.blindSpans).toBe(1)
    expect(big.stats.suppressedTokenSpans).toBe(1)
    expect(checkRecord(big), 'the record still passes its own gate in this shape').toEqual([])
  })

  it('distinguishes a span the matcher looked at and placed nowhere from one it never looked at', () => {
    // 'scored_below_floor': candidates were seeded off `zephyr` and the best
    // of them came in under THETA_LOW.
    const corpus = [
      commonTokenCorpus(MAX_TOKEN_DF + 1),
      gen('A zephyr quibbles pointedly.'),
    ]
    const belowFloor = run(
      'Zephyr notwithstanding, the committee adjourned without reaching any conclusion whatsoever this afternoon.',
      corpus,
    )
    const scored = belowFloor.files[0].spans[0]
    expect(scored.class).toBe('no_generation_provenance')
    expect(scored.noCandidate).toBe('scored_below_floor')
    expect(scored.tokenSuppression, 'no common token is in this sentence').toBeUndefined()
    expect(belowFloor.stats.blindSpans).toBe(0)

    // 'absent_from_corpus': no distinct token of this span appears in any
    // generation segment. The model really was never in the running, which is
    // the honest form of the label and the only one a buyer should pay for.
    const novel = run('Xylophone marmalade quokkas tessellate obliquely.', corpus)
    const unseen = novel.files[0].spans[0]
    expect(unseen.class).toBe('no_generation_provenance')
    expect(unseen.noCandidate).toBe('absent_from_corpus')
    expect(novel.stats.blindSpans).toBe(0)
  })

  it('reports partial suppression on a span it did score, because the score is then a weaker claim', () => {
    const corpus = [
      commonTokenCorpus(MAX_TOKEN_DF + 1),
      gen('The zephyr quibbles about alpha beta gamma delta precisely.'),
    ]
    const record = run('A zephyr quibbles about alpha beta gamma delta precisely.', corpus)
    const span = record.files[0].spans[0]
    expect(span.class).toBe('survived_mutated')
    // Four of its tokens were skipped; the candidate that earned the label
    // was seeded by the three that were not.
    expect(span.tokenSuppression!.suppressed).toBe(4)
    expect(span.tokenSuppression!.distinct).toBe(9)
    expect(span.noCandidate, 'it was scored, so no reason is named').toBeUndefined()
    expect(record.stats.blindSpans).toBe(0)
    expect(record.stats.suppressedTokenSpans).toBe(1)
  })
})
