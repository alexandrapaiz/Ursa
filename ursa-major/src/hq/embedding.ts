// Vectors for the HQ: how a case's text becomes 384 numbers, and where
// those numbers are kept so the second briefing does not pay for them.
//
// Plan §12 names the decision this file implements: "`@xenova/transformers`
// running `all-MiniLM-L6-v2` (ONNX, CPU, in-process, no network call)
// embeds each `CaseUnit.discoveredSpec`; the vector is cached ... Tens to
// low hundreds of cases per store means brute-force cosine similarity is
// sub-millisecond; no Pinecone or pgvector is justified, and raw case
// text never leaves the machine to be embedded remotely."
//
// Two deviations from that sentence, both deliberate, both explained in
// docs/design/semantic-retrieval.md §6:
//
//   1. The PACKAGE is `@huggingface/transformers`, not `@xenova/transformers`.
//      Same model, same ONNX runtime, same in-process CPU inference —
//      @xenova is the unmaintained v2 line of the same project and the
//      author's own successor is this one. It was swapped because
//      @xenova/transformers@2.17.2 pulls `protobufjs` (CRITICAL,
//      GHSA-xq3m-2v4x-88gg and ten more) and `sharp` (HIGH) into the
//      PRODUCTION tree, which the dependency floor shipped in PR #36
//      forbids by name. @huggingface/transformers@4.3.0 audits clean.
//
//   2. The CACHE is a separate file keyed by content hash, not a field on
//      the unit inside tuning.json. Cases in this codebase are
//      CorrectionLoops read out of outcome records, not axioms in
//      tuning.json, so there is no unit in tuning.json to hang them on.
//      Content-hash keying is also strictly better than unit-id keying:
//      a re-distill that restates the same spec reuses the vector, and an
//      edit invalidates exactly the one entry whose text changed.
//
// "No network call" is true at inference and false exactly once: the ONNX
// weights (~23MB) are fetched from the Hugging Face CDN the first time
// and cached on disk by the library thereafter. Nothing about the user's
// text crosses the wire in either case, which is the property §12's
// sentence is protecting. `loadMiniLM` returns null rather than throwing
// when that fetch cannot happen, so an offline machine degrades to
// lexical ranking instead of failing to produce a briefing at all.

import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'

/** A unit vector. 384 dimensions for all-MiniLM-L6-v2. */
export type Vector = number[]

/** The model this file speaks for, recorded in the cache so that changing
 *  models invalidates the cache rather than silently mixing two vector
 *  spaces, whose cosines are not comparable. */
export const MODEL_ID = 'Xenova/all-MiniLM-L6-v2'
export const MODEL_DIMS = 384

/**
 * Anything that turns text into unit vectors.
 *
 * The seam this module exists to create. MiniLM is one implementation;
 * the test fixture's replay of recorded MiniLM output is another; absence
 * is a third, and absence is a supported state rather than an error.
 */
export interface Embedder {
  /** model identity, written into the cache header */
  readonly id: string
  readonly dims: number
  /** unit vectors, one per input, in input order */
  embed(texts: string[]): Promise<Vector[]>
}

/**
 * Cosine similarity of two unit vectors, which for unit vectors is the
 * dot product. Not normalized here: `embed` is required to return unit
 * vectors, and normalizing twice hides the bug where it did not.
 */
export function cosine(a: Vector, b: Vector): number {
  if (a.length !== b.length) {
    throw new Error(`cosine: dimension mismatch, ${a.length} vs ${b.length}`)
  }
  let sum = 0
  for (let i = 0; i < a.length; i++) sum += a[i] * b[i]
  return sum
}

/** Cache key for one piece of text under one model. The model id is in
 *  the hash, not only the header, so two caches concatenated by hand
 *  still cannot serve a MiniLM vector for a different model's text. */
export function cacheKey(modelId: string, text: string): string {
  return createHash('sha256').update(`${modelId}\u0000${text}`).digest('hex').slice(0, 32)
}

export interface EmbeddingCache {
  schemaVersion: '0.1.0'
  model: string
  dims: number
  /** cacheKey -> unit vector */
  vectors: Record<string, Vector>
}

export function emptyCache(modelId: string = MODEL_ID, dims: number = MODEL_DIMS): EmbeddingCache {
  return { schemaVersion: '0.1.0', model: modelId, dims, vectors: {} }
}

/**
 * Read the cache, or an empty one.
 *
 * A cache written under a different model is discarded rather than
 * merged: cosines across vector spaces are meaningless, and a silently
 * mixed cache would produce a ranking nobody could explain.
 */
export function loadCache(path: string, modelId: string = MODEL_ID): EmbeddingCache {
  if (!existsSync(path)) return emptyCache(modelId)
  try {
    const parsed = JSON.parse(readFileSync(path, 'utf8')) as EmbeddingCache
    if (parsed.model !== modelId) return emptyCache(modelId)
    if (!parsed.vectors || typeof parsed.vectors !== 'object') return emptyCache(modelId)
    return parsed
  } catch {
    // A corrupt cache is a performance problem, never a correctness one:
    // every entry in it is recomputable from text we still have.
    return emptyCache(modelId)
  }
}

export function saveCache(path: string, cache: EmbeddingCache): void {
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, `${JSON.stringify(cache, null, 2)}\n`, 'utf8')
}

/**
 * Embed `texts`, reading what the cache already has and filling the rest
 * in one batched call. Mutates `cache.vectors`; the caller decides
 * whether to persist, so a briefing taken against a read-only fixture
 * does not write to disk.
 *
 * Returns vectors in input order. Duplicate texts cost one embedding.
 */
export async function embedCached(
  embedder: Embedder,
  cache: EmbeddingCache,
  texts: string[]
): Promise<Vector[]> {
  const keys = texts.map((t) => cacheKey(embedder.id, t))
  const missing: string[] = []
  const missingKeys: string[] = []
  const seen = new Set<string>()
  for (let i = 0; i < texts.length; i++) {
    if (cache.vectors[keys[i]] || seen.has(keys[i])) continue
    seen.add(keys[i])
    missing.push(texts[i])
    missingKeys.push(keys[i])
  }
  if (missing.length > 0) {
    const fresh = await embedder.embed(missing)
    for (let i = 0; i < missingKeys.length; i++) cache.vectors[missingKeys[i]] = fresh[i]
  }
  return keys.map((k) => cache.vectors[k])
}

/**
 * Load MiniLM, or return null if it cannot be loaded.
 *
 * Null is the offline case and the never-downloaded case, and it is not
 * an error: `briefWithSemantics` falls back to lexical ranking and the
 * briefing says `retrieval: 'lexical-v0'` in its coverage block, so a
 * reader can tell a lexical answer from a semantic one. The import is
 * dynamic so that `npm test`, the CLI's lexical path, and any consumer
 * that never asks for semantics do not pay MiniLM's load time.
 */
export async function loadMiniLM(): Promise<Embedder | null> {
  try {
    const { pipeline } = await import('@huggingface/transformers')
    const extract = await pipeline('feature-extraction', MODEL_ID, { dtype: 'fp32' })
    return {
      id: MODEL_ID,
      dims: MODEL_DIMS,
      async embed(texts: string[]): Promise<Vector[]> {
        if (texts.length === 0) return []
        // mean pooling over tokens, then L2 normalization — the sentence
        // representation all-MiniLM-L6-v2 was trained to produce. Any
        // other pooling gives vectors whose cosines mean something else.
        const out = await extract(texts, { pooling: 'mean', normalize: true })
        return out.tolist() as Vector[]
      },
    }
  } catch {
    return null
  }
}
