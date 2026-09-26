// Ranking for the briefing. Deterministic, lexical, and local.
//
// The plan's §15 stub names "the §12 client-side embedding retrieval" as
// the ranker. That path is not open yet: §12's embedding index does not
// exist in this codebase (no module computes or stores vectors), and
// standing up one today would mean either a model call per briefing or a
// new dependency, neither of which this slice needs to be useful. So v0
// ranks lexically — exact path match first, file name second, word
// overlap third, recurrence last — and every scoring weight below is a
// named constant, so the order a briefing came out in can be recomputed
// by hand from the printed `why` blocks.
//
// The seam is deliberate: `rankRules` and `rankCases` take the query and
// the units and return scored units. Swapping in an embedding ranker
// means replacing these two functions' bodies, not the briefing, the CLI,
// or the record format. See docs/design/hq-briefing.md §"Retrieval".

import type { MatchReason } from './types'

/**
 * Scoring weights, in the order a human would rank these signals.
 *
 * Exact path beats file name beats word overlap beats recurrence, and
 * the relevance terms are capped so that a rule with twelve pieces of
 * evidence cannot outrank a rule learned on the exact file the agent is
 * about to edit. Recurrence is a tiebreak, never a reason to surface.
 */
export const WEIGHTS = {
  /** request domain string equals the unit's domain, case-insensitively */
  domainExact: 4,
  /** one contains the other, e.g. request 'motion' vs domain 'motion-timing' */
  domainPartial: 2,
  /** per requested path this unit was demonstrably learned on */
  fileExact: 3,
  /** per requested path matched by file name alone, directory ignored */
  fileByName: 2,
  /** per distinct query word occurring in the unit's own text */
  textToken: 1,
  /** ceiling on the combined file terms, so path matches cannot run away */
  fileTermCap: 9,
  /** ceiling on the combined word-overlap terms */
  textTermCap: 3,
  /** ceiling on the recurrence tiebreak (evidenceCount-1, or loop recurrences) */
  recurrenceCap: 2,
} as const

/** Words of three or more characters, lowercased, camelCase split. Three
 *  because two-letter tokens ('ui', 'js') match everything and rank
 *  nothing; they are dropped from the query and from unit text alike. */
export function words(text: string): string[] {
  return text
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length >= 3)
}

/** Repo-relative, forward-slashed, no leading './' — the form
 *  CorrectionLoop.targetFiles and OutcomeRecord.files[].path are in. */
export function normalizePath(path: string): string {
  return path.replace(/\\/g, '/').replace(/^\.\//, '').replace(/^\/+/, '')
}

export function baseName(path: string): string {
  return normalizePath(path).split('/').pop() ?? ''
}

/** A parsed request: the two things every unit is scored against. */
export interface Query {
  domain: string | null
  /** normalized requested paths */
  files: string[]
  /** file names of the requested paths, for the directory-insensitive match */
  names: Set<string>
  /** query words: the domain's words plus every path's words */
  words: Set<string>
  /** true when the request named neither a domain nor a file */
  empty: boolean
}

export function buildQuery(domain?: string, files?: string[]): Query {
  const normalized = (files ?? []).map(normalizePath).filter((f) => f.length > 0)
  const w = new Set<string>()
  for (const t of words(domain ?? '')) w.add(t)
  for (const f of normalized) for (const t of words(f)) w.add(t)
  return {
    domain: domain?.trim() ? domain.trim().toLowerCase() : null,
    files: normalized,
    names: new Set(normalized.map(baseName)),
    words: w,
    empty: !domain?.trim() && normalized.length === 0,
  }
}

function domainMatch(query: Query, domain: string): MatchReason['domain'] {
  if (!query.domain) return null
  const d = domain.trim().toLowerCase()
  if (d === query.domain) return 'exact'
  if (d.length > 0 && (d.includes(query.domain) || query.domain.includes(d))) return 'partial'
  return null
}

/**
 * Score one unit against the query.
 *
 * @param domain     the unit's own domain tag, '' when it has none
 * @param unitFiles  paths this unit was learned on (a loop's targetFiles,
 *                   or the files of the records behind an axiom)
 * @param text       the unit's own words: a rule statement, or a loop's
 *                   theme plus its discovered spec
 */
export function score(query: Query, domain: string, unitFiles: string[], text: string): MatchReason {
  const dm = domainMatch(query, domain)
  const normalizedUnitFiles = unitFiles.map(normalizePath)
  const unitPaths = new Set(normalizedUnitFiles)
  const unitNames = new Set(normalizedUnitFiles.map(baseName))

  const filesExact = query.files.filter((f) => unitPaths.has(f))
  const filesByName = query.files.filter((f) => !unitPaths.has(f) && unitNames.has(baseName(f)))
  const unitWords = new Set(words(text))
  const textTokens = [...query.words].filter((t) => unitWords.has(t)).sort()

  const fileTerm = Math.min(
    filesExact.length * WEIGHTS.fileExact + filesByName.length * WEIGHTS.fileByName,
    WEIGHTS.fileTermCap
  )
  const textTerm = Math.min(textTokens.length * WEIGHTS.textToken, WEIGHTS.textTermCap)
  const domainTerm =
    dm === 'exact' ? WEIGHTS.domainExact : dm === 'partial' ? WEIGHTS.domainPartial : 0

  return {
    domain: dm,
    filesExact,
    filesByName,
    textTokens,
    score: domainTerm + fileTerm + textTerm,
  }
}

/** The recurrence tiebreak: how many times this was independently seen,
 *  capped. Added after relevance so it orders equals, never outranks. */
export function recurrenceBonus(count: number): number {
  return Math.min(Math.max(count - 1, 0), WEIGHTS.recurrenceCap)
}

/** Sort key shared by rules and cases: relevance first, then how often
 *  the HQ has seen it, then id — the last term so two runs over the same
 *  store always return the same order. */
export function compareScored<T>(
  a: T,
  b: T,
  whyOf: (x: T) => MatchReason,
  recurrenceOf: (x: T) => number,
  idOf: (x: T) => string
): number {
  const sa = whyOf(a).score
  const sb = whyOf(b).score
  if (sb !== sa) return sb - sa
  const ra = recurrenceOf(a)
  const rb = recurrenceOf(b)
  if (rb !== ra) return rb - ra
  return idOf(a).localeCompare(idOf(b))
}
