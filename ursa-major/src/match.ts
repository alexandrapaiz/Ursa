// Matching primitives. Deliberately lexical and deterministic — no embeddings,
// no model judging similarity. Every label must be explainable from these
// functions and the two thresholds alone; that auditability is the point.

/** combined similarity at/above this → survived_mutated */
export const THETA_HIGH = 0.6
/** best match in [THETA_LOW, THETA_HIGH) → no_generation_provenance flagged uncertain */
export const THETA_LOW = 0.35
/** normalized spans shorter than this can't claim verbatim by containment */
export const MIN_VERBATIM_LEN = 12
/** tokens appearing in more than this many generation segments are too common to seed candidates */
export const MAX_TOKEN_DF = 500
/** fuzzy pass runs full edit distance only on the top-K candidates by containment */
export const FUZZY_TOP_K = 25

export function tokens(norm: string): string[] {
  return norm.split(/[^a-z0-9]+/).filter(Boolean)
}

/** 1 - levenshtein/maxLen, on normalized strings */
export function levSimilarity(a: string, b: string): number {
  if (a === b) return 1
  const m = a.length
  const n = b.length
  if (m === 0 || n === 0) return 0
  let prev = new Array<number>(n + 1)
  let cur = new Array<number>(n + 1)
  for (let j = 0; j <= n; j++) prev[j] = j
  for (let i = 1; i <= m; i++) {
    cur[0] = i
    const ca = a.charCodeAt(i - 1)
    for (let j = 1; j <= n; j++) {
      const cost = ca === b.charCodeAt(j - 1) ? 0 : 1
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + cost)
    }
    ;[prev, cur] = [cur, prev]
  }
  return 1 - prev[n] / Math.max(m, n)
}

/** fraction of a's tokens present in b's token set */
export function containment(aTokens: string[], bSet: Set<string>): number {
  if (aTokens.length === 0) return 0
  let hit = 0
  for (const t of aTokens) if (bSet.has(t)) hit++
  return hit / aTokens.length
}

/** the combined score both thresholds apply to */
export function combinedScore(cont: number, lev: number): number {
  return 0.5 * cont + 0.5 * lev
}

/** convenience for tests / small inputs */
export function similarity(aNorm: string, bNorm: string): number {
  return combinedScore(
    containment(tokens(aNorm), new Set(tokens(bNorm))),
    levSimilarity(aNorm, bNorm),
  )
}
