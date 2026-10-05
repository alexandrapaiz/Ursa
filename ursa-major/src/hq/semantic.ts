// Semantic ranking for `nearestCases`: turning cosines into points the
// existing lexical score can be added to.
//
// Why this file is not four lines of "sort by cosine descending".
//
// The lexical ranker in retrieval.ts answers "was this lesson learned on
// the file I am about to edit, or in words I just used?" It is exact and
// it is blind: a loop whose spec says "entrance motion may reposition an
// element by at most 8px" scores ZERO against a request for domain
// `transitions`, because the two share no word. That miss is the reason
// this file exists.
//
// Two measured properties of mean-pooled MiniLM drove every constant
// below. Both were measured on this repo's own fixture store, and the
// measurement is reproduced in docs/design/semantic-retrieval.md §4.
//
//   1. THE USEFUL RANGE IS LOW AND NARROW. Cosines between a short
//      request and a short correction-loop spec sit between -0.07 and
//      0.28 here, not between 0.25 and 0.75. A threshold picked by
//      intuition instead of by measurement would have rejected every
//      true match this store contains.
//
//   2. ABSOLUTE COSINE IS OFFSET, DIFFERENCES ARE NOT. Mean-pooled
//      sentence embeddings are anisotropic: every vector carries a large
//      component common to all text, so the absolute number floats with
//      the phrasing of the request rather than with its meaning. The
//      correction is to score a case by how far it stands ABOVE THE REST
//      OF THE FIELD for this request, which subtracts the common
//      component instead of trying to threshold through it.
//
// The cost of (2), stated plainly: a case's semantic points depend on
// the other cases in the store, so adding a case can change an existing
// case's score. The lexical terms remain per-unit and independent. To
// keep the ranking auditable anyway, `SemanticReason` records the raw
// cosine, the field mean subtracted from it, the resulting lead and the
// points it bought, and `renderWhy` prints all four — so the arithmetic
// is still recomputable by hand from the briefing itself.

import type { IndexedLoop } from './briefing'
import { cosine, embedCached, type EmbeddingCache, type Embedder, type Vector } from './embedding'
import { normalizePath } from './retrieval'
import type { SemanticReason } from './types'

/**
 * Ceiling on the semantic term, in the same points as retrieval.ts's
 * WEIGHTS. Deliberately equal to `textTermCap` (3): semantic similarity
 * is the generalization of word overlap, so it earns word overlap's
 * ceiling and no more. A rule learned on the exact file the agent is
 * about to edit still outranks a case the model merely finds evocative,
 * which is the priority the lexical weights already encode.
 */
export const SEMANTIC_CAP = 3

/**
 * Below this raw cosine the model is not saying anything about this
 * request, and no lead over the field can buy points.
 *
 * Measured: for a request in a domain the store has never seen
 * (`database-migrations scripts/migrate.sql`) every case in the fixture
 * store lands at or below 0.022, while both true matches land at 0.251
 * and 0.272. The gate exists so that "the HQ knows nothing here" stays
 * distinguishable from "the HQ's least-bad guess", because a briefing
 * that always returns three cases teaches an agent to ignore all three.
 */
export const SEMANTIC_FLOOR = 0.15

/**
 * The lead over the field that earns the full SEMANTIC_CAP.
 *
 * Measured: a true cross-vocabulary match (`transitions` against the
 * motion loop) leads the field by 0.112 and must clear briefing.ts's
 * MIN_RELEVANCE of 2 to be served at all; a same-store near-miss (the
 * contrast loop on that same request) leads by 0.046 and must not.
 * 0.15 places 0.112 at 2.24 points and 0.046 at 0.92, which separates
 * them across the floor with room on both sides.
 */
export const LEAD_FULL = 0.15

/** Round for display and for stable comparison. Cosines differ in the
 *  last bits across CPU architectures; four decimals is far more
 *  precision than the ranking uses and removes that as a source of
 *  ordering flap between machines. */
function round(value: number, places: number): number {
  const f = 10 ** places
  return Math.round(value * f) / f
}

/**
 * The text of the request, as the model sees it.
 *
 * Bare concatenation of the domain and the requested paths, not a prose
 * template. Measured: wrapping the same request as
 * "domain: transitions. files: src/components/Banner.tsx" moved the true
 * match from 0.251 down to 0.175 and cost it its lead, because the
 * template's own words are a third of the tokens in a short request and
 * the model pools them in with the rest.
 */
export function queryText(domain?: string, files?: string[]): string {
  return [domain ?? '', ...(files ?? []).map(normalizePath)]
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
    .join(' ')
}

/** The text of a case, as the model sees it: the same three fields the
 *  lexical ranker reads, so the two rankers disagree about meaning and
 *  never about what they were shown. */
export function caseText(indexed: IndexedLoop): string {
  return `${indexed.loop.theme} ${indexed.loop.discoveredSpec} ${indexed.complaint ?? ''}`.trim()
}

/** `${recordId}::${loopId}` — the key a SemanticIndex is looked up by,
 *  and the same string briefing.ts already uses to break ranking ties. */
export function caseKey(recordId: string, loopId: string): string {
  return `${recordId}::${loopId}`
}

/** What the semantic ranker concluded about each case, keyed by caseKey. */
export type SemanticIndex = Map<string, SemanticReason>

/**
 * Score a field of cases against one request, from vectors alone.
 *
 * Pure, synchronous, and model-free: it takes vectors and returns points.
 * That is what makes the semantic ranking testable without a 831MB
 * dependency and a model download — the tests replay recorded MiniLM
 * output through this function and assert on the ranking it produces.
 *
 * @param queryVector  unit vector of `queryText(...)`
 * @param caseVectors  unit vector per case, keyed by `caseKey(...)`
 */
export function rankSemantic(queryVector: Vector, caseVectors: Map<string, Vector>): SemanticIndex {
  const index: SemanticIndex = new Map()
  const raw = [...caseVectors.entries()].map(([key, v]) => [key, cosine(queryVector, v)] as const)
  const total = raw.reduce((s, [, c]) => s + c, 0)

  for (const [key, cos] of raw) {
    // The field this case is measured against is every OTHER case. With
    // fewer than two others there is no field to estimate the common
    // component from, so the mean is 0 and the lead is the raw cosine —
    // stated rather than special-cased silently, because a one-case
    // store is the state every new user starts in.
    const others = raw.length - 1
    const fieldMean = others > 0 ? (total - cos) / others : 0
    const lead = cos - fieldMean
    const term =
      cos < SEMANTIC_FLOOR || lead <= 0
        ? 0
        : round(Math.min(lead / LEAD_FULL, 1) * SEMANTIC_CAP, 2)
    index.set(key, {
      cosine: round(cos, 4),
      fieldMean: round(fieldMean, 4),
      lead: round(lead, 4),
      term,
    })
  }
  return index
}

/**
 * Embed a request and a field of cases, then rank them.
 *
 * The only async step in the whole retrieval path. Everything downstream
 * of it — `rankSemantic`, `score`, `buildBriefing` — is pure and
 * synchronous, so a briefing is still reproducible byte for byte from
 * the vectors alone.
 *
 * Mutates `cache.vectors` with anything it had to compute; persisting is
 * the caller's decision.
 */
export async function embedAndRank(
  embedder: Embedder,
  cache: EmbeddingCache,
  request: string,
  cases: Array<{ key: string; text: string }>
): Promise<SemanticIndex> {
  if (cases.length === 0 || request.trim().length === 0) return new Map()
  const texts = [request, ...cases.map((c) => c.text)]
  const vectors = await embedCached(embedder, cache, texts)
  const caseVectors = new Map<string, Vector>()
  for (let i = 0; i < cases.length; i++) caseVectors.set(cases[i].key, vectors[i + 1])
  return rankSemantic(vectors[0], caseVectors)
}
