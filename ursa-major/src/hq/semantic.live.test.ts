// The one test that actually loads all-MiniLM-L6-v2.
//
// It exists because semantic.test.ts deliberately does not: that suite
// replays vectors.json, which makes it hermetic and fast but means it
// would keep passing if the recorded vectors drifted away from what the
// model now produces, or if `loadMiniLM` stopped working entirely.
// This test closes exactly that gap, and nothing else.
//
// SKIPPED by default. It needs the optional `@huggingface/transformers`
// dependency and, on a cold cache, a ~23MB model download. Run it with:
//
//   URSA_LIVE_EMBEDDINGS=1 npm test
//
// Opt-in rather than opt-out because a suite that fails when the Hugging
// Face CDN is slow is a suite people learn to ignore, and a test everyone
// ignores is worse than one that announces it was skipped.

import { beforeAll, describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { indexLoops } from './briefing'
import { cosine, loadMiniLM, MODEL_DIMS, type Embedder, type Vector } from './embedding'
import { RECORDED_QUERIES, RECORDS } from './fixtures'
import { caseKey, caseText, queryText } from './semantic'

const LIVE = process.env.URSA_LIVE_EMBEDDINGS === '1'

interface RecordedVectors {
  model: string
  dims: number
  texts: Record<string, string>
  vectors: Record<string, Vector>
}
const RECORDED = JSON.parse(
  readFileSync(join(import.meta.dirname, 'vectors.json'), 'utf8')
) as RecordedVectors

describe.skipIf(!LIVE)('the live model agrees with the recorded vectors', () => {
  let embedder: Embedder | null = null
  beforeAll(async () => {
    embedder = await loadMiniLM()
  }, 300_000)

  it('loads at all, which is what the null path in loadMiniLM hides', () => {
    expect(embedder, 'loadMiniLM returned null with URSA_LIVE_EMBEDDINGS=1').not.toBeNull()
    expect(embedder!.dims).toBe(MODEL_DIMS)
  })

  it('reproduces every recorded vector to the precision the ranking uses', async () => {
    const labels = Object.keys(RECORDED.texts)
    const fresh = await embedder!.embed(labels.map((l) => RECORDED.texts[l]))
    for (let i = 0; i < labels.length; i++) {
      // Cosine against the recording, not element-wise equality: the
      // ranking only ever reads cosines, and ONNX kernels differ in the
      // last bits across CPUs. Anything below 0.9999 is real drift.
      expect(cosine(fresh[i], RECORDED.vectors[labels[i]]), `drift on ${labels[i]}`).toBeGreaterThan(0.9999)
    }
  }, 300_000)

  it('still puts the motion loop nearest a request about transitions', async () => {
    const request = queryText('transitions', ['src/components/Banner.tsx'])
    const cases = indexLoops(RECORDS)
    const vectors = await embedder!.embed([request, ...cases.map(caseText)])
    const ranked = cases
      .map((c, i) => ({ key: caseKey(c.recordId, c.loop.id), cos: cosine(vectors[0], vectors[i + 1]) }))
      .sort((a, b) => b.cos - a.cos)
    expect(ranked[0].key).toBe('rec-site-001::loop-a')
  }, 300_000)

  it('has a recorded query for every RECORDED_QUERIES entry', () => {
    for (const q of RECORDED_QUERIES) {
      expect(RECORDED.texts[`query:${queryText(q.domain, q.files)}`]).toBeDefined()
    }
  })
})
