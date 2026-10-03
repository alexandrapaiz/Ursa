// What the semantic ranker owes an agent, tested against recorded
// all-MiniLM-L6-v2 output over the fixture store (vectors.json, produced
// by record-vectors.ts).
//
// The claim these tests exist to support is narrow and checkable: adding
// meaning to the ranking finds cases word overlap cannot find, WITHOUT
// displacing the file matches word overlap gets right and WITHOUT
// filling every briefing with the least-bad guess. Each of those three
// is a test below, and the third is the one that would be easiest to
// ship broken, because a ranker that always returns three cases looks
// like it is working.

import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { briefWithSemantics, buildBriefing, indexLoops, renderBriefing } from './briefing'
import { RECORDED_QUERIES, RECORDS, TUNING } from './fixtures'
import {
  caseKey,
  caseText,
  LEAD_FULL,
  queryText,
  rankSemantic,
  SEMANTIC_CAP,
  SEMANTIC_FLOOR,
} from './semantic'
import { cacheKey, cosine, emptyCache, embedCached, loadCache, type Embedder, type Vector } from './embedding'

const NOW = '2026-09-26T12:00:00.000Z'

interface RecordedVectors {
  model: string
  dims: number
  texts: Record<string, string>
  vectors: Record<string, Vector>
}
const RECORDED = JSON.parse(
  readFileSync(join(import.meta.dirname, 'vectors.json'), 'utf8')
) as RecordedVectors

/** An Embedder that replays vectors.json and refuses anything it has not
 *  recorded. Refusing rather than returning a zero vector is deliberate:
 *  a silent zero vector would let a stale fixture pass as a real result. */
const replay: Embedder = {
  id: RECORDED.model,
  dims: RECORDED.dims,
  async embed(texts: string[]): Promise<Vector[]> {
    return texts.map((text) => {
      const label = Object.keys(RECORDED.texts).find((k) => RECORDED.texts[k] === text)
      if (!label) throw new Error(`no recorded vector for: ${JSON.stringify(text)}`)
      return RECORDED.vectors[label]
    })
  },
}

const semanticBrief = (input: Parameters<typeof buildBriefing>[2]) =>
  briefWithSemantics(TUNING, RECORDS, input ?? {}, replay, emptyCache(RECORDED.model, RECORDED.dims), NOW)

const lexicalBrief = (input: Parameters<typeof buildBriefing>[2]) => buildBriefing(TUNING, RECORDS, input, NOW)

describe('the recorded vectors stay in step with the fixture store', () => {
  it('has a vector for every case and every recorded query', () => {
    for (const indexed of indexLoops(RECORDS)) {
      const label = `case:${caseKey(indexed.recordId, indexed.loop.id)}`
      expect(RECORDED.texts[label], `${label} missing from vectors.json`).toBe(caseText(indexed))
      expect(RECORDED.vectors[label]).toHaveLength(RECORDED.dims)
    }
    for (const q of RECORDED_QUERIES) {
      const text = queryText(q.domain, q.files)
      expect(RECORDED.texts[`query:${text}`], `query "${text}" missing from vectors.json`).toBe(text)
    }
  })

  it('recorded unit vectors are still unit vectors after rounding', () => {
    for (const v of Object.values(RECORDED.vectors)) {
      expect(cosine(v, v)).toBeCloseTo(1, 4)
    }
  })
})

describe('semantic ranking finds what word overlap cannot', () => {
  // The headline case, and the reason this whole module exists. A request
  // for domain `transitions` on a file the store has never seen shares no
  // word with any correction loop: "transitions" is not "motion", not
  // "animation", not "entrance". The lexical ranker returns nothing.
  it('surfaces the motion loop for a request that shares no word with it', async () => {
    const input = { domain: 'transitions', files: ['src/components/Banner.tsx'] }

    const lexical = lexicalBrief(input)
    expect(lexical.nearestCases).toHaveLength(0)
    expect(lexical.coverage.retrieval).toBe('lexical-v0')

    const semantic = await semanticBrief(input)
    expect(semantic.nearestCases.map((c) => c.loopId)).toEqual(['loop-a'])
    expect(semantic.coverage.retrieval).toBe('semantic-v1')
    expect(semantic.coverage.retrievalModel).toBe(RECORDED.model)

    // Nothing lexical fired at all: the entire score is the semantic term.
    const why = semantic.nearestCases[0].why
    expect(why.domain).toBeNull()
    expect(why.filesExact).toEqual([])
    expect(why.filesByName).toEqual([])
    expect(why.textTokens).toEqual([])
    expect(why.semantic!.term).toBe(why.score)
  })

  it('picks the copy loop, not the motion loop, for a request about claims', async () => {
    const semantic = await semanticBrief({ domain: 'marketing-claims', files: ['src/content/pricing.md'] })
    expect(semantic.nearestCases.map((c) => c.loopId)).toEqual(['loop-c'])
    // The lexical ranker does see the word "claims" here, but one
    // incidental word scores 1 and the relevance floor is 2, so on its
    // own it still serves nothing.
    expect(lexicalBrief({ domain: 'marketing-claims', files: ['src/content/pricing.md'] }).nearestCases).toHaveLength(0)
  })

  it('ranks a near-miss below the relevance floor instead of serving it', async () => {
    // Both site loops are plausibly "about the visual layer", and both
    // clear the raw cosine floor. Only the motion loop leads the field
    // by enough to be worth an agent's context.
    const cases = new Map(
      indexLoops(RECORDS).map((i) => [
        caseKey(i.recordId, i.loop.id),
        RECORDED.vectors[`case:${caseKey(i.recordId, i.loop.id)}`],
      ])
    )
    const index = rankSemantic(RECORDED.vectors['query:transitions src/components/Banner.tsx'], cases)
    const a = index.get('rec-site-001::loop-a')!
    const b = index.get('rec-site-001::loop-b')!
    expect(a.cosine).toBeGreaterThan(SEMANTIC_FLOOR)
    expect(b.cosine).toBeGreaterThan(SEMANTIC_FLOOR)
    expect(a.term).toBeGreaterThanOrEqual(2)
    expect(b.term).toBeLessThan(2)
  })
})

describe('semantic ranking stays honest about knowing nothing', () => {
  // The failure mode that matters most. A ranker with no floor always has
  // a best match, so it always returns three cases, and an agent that
  // reads three irrelevant cases twice learns to skip the section.
  it('returns no cases at all for a domain the store has never seen', async () => {
    const semantic = await semanticBrief({ domain: 'database-migrations', files: ['scripts/migrate.sql'] })
    expect(semantic.nearestCases).toHaveLength(0)
    expect(semantic.coverage.loopsConsidered).toBe(3)
    expect(semantic.coverage.casesReturned).toBe(0)
    expect(renderedFor(semantic)).toContain('None on these files.')
  })

  it('does not let a lead buy points when the raw cosine is noise', () => {
    // Every case below the floor, one of them leading the field: the
    // floor gate, not the lead, is what must decide.
    const q = [1, 0, 0]
    const cases = new Map<string, Vector>([
      ['a', [SEMANTIC_FLOOR - 0.01, Math.sqrt(1 - (SEMANTIC_FLOOR - 0.01) ** 2), 0]],
      ['b', [-0.5, Math.sqrt(0.75), 0]],
    ])
    const index = rankSemantic(q, cases)
    expect(index.get('a')!.lead).toBeGreaterThan(0)
    expect(index.get('a')!.term).toBe(0)
  })
})

describe('semantic ranking augments the lexical ranking, never replaces it', () => {
  it('leaves the exact-file winner on top and only raises its score', async () => {
    const input = { files: ['src/app/page.tsx'] }
    const lexical = lexicalBrief(input)
    const semantic = await semanticBrief(input)
    expect(lexical.nearestCases[0].loopId).toBe('loop-a')
    expect(semantic.nearestCases[0].loopId).toBe('loop-a')
    expect(semantic.nearestCases[0].why.filesExact).toEqual(['src/app/page.tsx'])
    expect(semantic.nearestCases[0].why.score).toBeGreaterThan(lexical.nearestCases[0].why.score)
  })

  it('caps the semantic term so it cannot outrank an exact file match', () => {
    const cases = new Map<string, Vector>([
      ['near', [1, 0, 0]],
      ['far', [-1, 0, 0]],
    ])
    const best = rankSemantic([1, 0, 0], cases).get('near')!
    expect(best.cosine).toBeCloseTo(1, 6)
    expect(best.term).toBe(SEMANTIC_CAP)
    // WEIGHTS.fileExact (3) + WEIGHTS.domainExact (4) is 7, and a full
    // semantic term is 3: meaning can promote a case, never overrule the
    // file the agent actually named.
    expect(SEMANTIC_CAP).toBeLessThan(7)
  })

  it('never attaches a semantic reason to a rule, only to a case', async () => {
    const semantic = await semanticBrief({ domain: 'motion', files: ['src/app/page.tsx'] })
    expect(semantic.rules.length).toBeGreaterThan(0)
    for (const r of semantic.rules) expect(r.why.semantic).toBeNull()
    expect(semantic.nearestCases.some((c) => c.why.semantic !== null)).toBe(true)
  })

  it('prints the arithmetic behind the semantic term, not a bare number', async () => {
    const md = renderedFor(await semanticBrief({ domain: 'transitions', files: ['src/components/Banner.tsx'] }))
    expect(md).toContain('close in meaning (cosine 0.2507')
    expect(md).toContain('over the 0.1389 field average, worth 2.24)')
    expect(md).toContain(`Ranking: semantic-v1 (${RECORDED.model})`)
  })
})

describe('degrading without the model', () => {
  it('returns the lexical briefing, marked lexical, when no embedder loads', async () => {
    const input = { files: ['src/app/page.tsx'] }
    const degraded = await briefWithSemantics(TUNING, RECORDS, input, null, emptyCache(), NOW)
    expect(degraded).toEqual(lexicalBrief(input))
    expect(degraded.coverage.retrieval).toBe('lexical-v0')
    expect(degraded.coverage.retrievalModel).toBeUndefined()
  })

  it('never claims semantic-v1 on a briefing no model ranked', async () => {
    for (const q of RECORDED_QUERIES) {
      const degraded = await briefWithSemantics(TUNING, RECORDS, q, null, emptyCache(), NOW)
      expect(degraded.coverage.retrieval).toBe('lexical-v0')
    }
  })
})

describe('the embedding cache', () => {
  it('embeds each distinct text once and reads the rest from cache', async () => {
    const calls: string[][] = []
    const counting: Embedder = {
      id: 'test-model',
      dims: 3,
      async embed(texts) {
        calls.push(texts)
        return texts.map(() => [1, 0, 0])
      },
    }
    const cache = emptyCache('test-model', 3)
    await embedCached(counting, cache, ['alpha', 'beta', 'alpha'])
    expect(calls).toEqual([['alpha', 'beta']])

    const again = await embedCached(counting, cache, ['beta', 'alpha'])
    expect(calls).toHaveLength(1)
    expect(again).toHaveLength(2)
  })

  it('keys on the model as well as the text, so two models never share an entry', () => {
    expect(cacheKey('model-a', 'same text')).not.toBe(cacheKey('model-b', 'same text'))
  })

  it('discards a cache written under a different model rather than mixing vector spaces', () => {
    const dir = mkdtempSync(join(tmpdir(), 'ursa-emb-'))
    const path = join(dir, 'embeddings.json')
    writeFileSync(path, JSON.stringify({ schemaVersion: '0.1.0', model: 'old-model', dims: 3, vectors: { k: [1, 0, 0] } }))
    expect(loadCache(path, 'new-model').vectors).toEqual({})
    expect(loadCache(path, 'old-model').vectors).toEqual({ k: [1, 0, 0] })
  })

  it('treats a corrupt cache as empty, because every entry is recomputable', () => {
    const dir = mkdtempSync(join(tmpdir(), 'ursa-emb-'))
    const path = join(dir, 'embeddings.json')
    writeFileSync(path, '{ not json')
    expect(loadCache(path).vectors).toEqual({})
  })
})

describe('constants are the ones the calibration measured', () => {
  it('keeps the floor and the full-lead point where docs/design/semantic-retrieval.md §4 put them', () => {
    // Guards against a silent retune: these two numbers are the entire
    // difference between "serves one relevant case" and "serves three
    // cases every time", and both were measured, not chosen.
    expect(SEMANTIC_FLOOR).toBe(0.15)
    expect(LEAD_FULL).toBe(0.15)
    expect(SEMANTIC_CAP).toBe(3)
  })
})

function renderedFor(briefing: Awaited<ReturnType<typeof semanticBrief>>): string {
  return renderBriefing(briefing)
}
