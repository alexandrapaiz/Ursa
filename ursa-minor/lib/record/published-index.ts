/**
 * The published index: the one file that turns an address into a set.
 *
 * `ursa publish` writes a static site. At its root sits `index.json`,
 * which lists every record the person chose to publish, each with its
 * headline character counts, which resolver built it, and the address of
 * that record's own machine-readable copy. The resolver seat owns that
 * file and the addressing under it. This file is the viewer's side of
 * the same contract, and nothing here may assume anything the published
 * index does not actually carry.
 *
 * Why read the index at all, rather than asking for one record's URL:
 * a person who published a site has a site address. They do not have,
 * and should not be asked to find, the address of a single record inside
 * it. The index is what makes "here is where my work went" a thing you
 * can hand to someone.
 *
 * ## Pinning
 *
 * `indexVersion` is versioned separately from the record's own
 * `schemaVersion`, deliberately, so that a consumer can pin one without
 * being told about the other. This viewer pins the major and accepts any
 * minor at or above the one it was written against:
 *
 * - same major, minor >= ours: read it. The resolver seat's versioning
 *   promise is that a minor bump is additive, so the fields below are
 *   still there and still mean what they meant.
 * - same major, lower minor: read it, and expect fields to be missing.
 *   Every optional field below is optional for exactly this reason.
 * - different major: refuse, by name, and say what the site is speaking
 *   and what this page speaks. A viewer that guesses at a contract it
 *   does not understand is how a page ends up confidently wrong about
 *   where someone's data went.
 */

/** What happened to a stretch of the finished work. Mirrors SpanClass. */
import type { SpanClass } from './types'

/** The contract version this viewer was written against. */
export const INDEX_CONTRACT = { major: 0, minor: 1 } as const

/**
 * One record, as the index describes it, before any record is fetched.
 *
 * Everything the set view renders comes from here, which is the whole
 * point: browsing ten records costs the index and nothing else.
 */
export interface PublishedRecordSummary {
  id: string
  generatedAt?: string
  finished?: boolean
  artifactKind?: string
  finalChars?: number
  coveredChars?: number
  charsByClass?: Partial<Record<SpanClass, number>>
  spansByClass?: Partial<Record<SpanClass, number>>
  generatedChars?: number
  generatedDeletedChars?: number
  resolvedBy?: { basis?: string; value?: string } | null
  /** address of the fallback page, relative to the index */
  html?: string
  /** address of the record itself, relative to the index */
  json?: string
  /**
   * Not in contract 0.1. Requested of the resolver seat on 2026-10-18 so
   * that a fetched record can be checked against what was published; see
   * `integrity.ts`. Optional here, and treated as absent until a site
   * actually carries it, so this viewer works against 0.1 sites today.
   */
  sha256?: string
  /** Not in contract 0.1, requested alongside `sha256`. */
  bytes?: number
}

/** What the publisher disclosed to the publisher before writing anything. */
export interface DisclosureManifest {
  records?: number
  recordIds?: string[]
  adapters?: string[]
  finalFiles?: number
  filePaths?: string[]
  finalChars?: number
  generations?: number
  generationChars?: number
  conversations?: number
  prompts?: number
  promptChars?: number
}

export interface PublishedIndex {
  indexVersion: string
  publishedAt?: string
  repository?: string | null
  recordSchemaVersions?: string[]
  records: PublishedRecordSummary[]
  disclosed?: DisclosureManifest
}

export type IndexParseResult =
  | { ok: true; index: PublishedIndex; note: string | null }
  | { ok: false; error: string }

function parseVersion(v: string): { major: number; minor: number } | null {
  const m = /^(\d+)\.(\d+)(?:\.\d+)?$/.exec(v.trim())
  if (!m) return null
  return { major: Number(m[1]), minor: Number(m[2]) }
}

/**
 * Read an unknown blob as a published index, or say why it is not one.
 *
 * The failures here are the ones a person actually hits: they pasted
 * their repository's URL instead of their Pages URL, or a site that is
 * not an Ursa site, or a site published by a much newer resolver. Each
 * one gets a sentence that says what to do next.
 */
export function parsePublishedIndex(input: unknown): IndexParseResult {
  if (typeof input === 'string') {
    try {
      input = JSON.parse(input)
    } catch {
      return {
        ok: false,
        error:
          'That address did not answer with JSON. If you pasted the address of a site, check that it is the published site rather than the repository it was built from.',
      }
    }
  }
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return { ok: false, error: 'A published index is a JSON object, and this is not one.' }
  }
  const r = input as Record<string, unknown>

  if (typeof r.indexVersion !== 'string') {
    return {
      ok: false,
      error:
        'That JSON is not a published index: it names no index version. An Ursa site has index.json at its root.',
    }
  }
  const v = parseVersion(r.indexVersion)
  if (!v) {
    return { ok: false, error: `This site states an index version of "${r.indexVersion}", which is not a version number.` }
  }
  if (v.major !== INDEX_CONTRACT.major) {
    return {
      ok: false,
      error:
        `This site publishes index contract ${r.indexVersion} and this page reads ${INDEX_CONTRACT.major}.${INDEX_CONTRACT.minor}. ` +
        'A different first number means the contract changed in a way that is not backward compatible, so rather than guess at it, this page is telling you. The site itself is still readable: open its own index page.',
    }
  }
  if (!Array.isArray(r.records)) {
    return { ok: false, error: 'This index lists no records array, so there is no set to show.' }
  }

  const records: PublishedRecordSummary[] = []
  for (const [i, raw] of (r.records as unknown[]).entries()) {
    const s = raw as Record<string, unknown>
    if (!s || typeof s !== 'object' || typeof s.id !== 'string') {
      return { ok: false, error: `records[${i}] in this index has no id, so it has no address.` }
    }
    records.push(s as unknown as PublishedRecordSummary)
  }

  // An index that parses but lists nothing is not an error. It is a
  // person who has published a site and not yet resolved any work, and
  // the set view says so in words rather than showing an empty table.
  const note =
    v.minor > INDEX_CONTRACT.minor
      ? `This site publishes index contract ${r.indexVersion}; this page reads ${INDEX_CONTRACT.major}.${INDEX_CONTRACT.minor}. Same first number, so everything below is still true, and anything the newer contract added is simply not shown here.`
      : null

  return { ok: true, index: { ...(r as unknown as PublishedIndex), records }, note }
}

/**
 * Turn what a person actually pasted into the address of an index.
 *
 * They will paste the site root with or without a trailing slash, the
 * index page, the index itself, or the address of a record page they
 * were already looking at. All four mean "this site", and asking them to
 * normalise it by hand is a worse page.
 *
 * Returns the absolute URL of `index.json`, or null if the input is not
 * an http(s) address at all.
 */
export function indexUrlFor(input: string): string | null {
  const raw = input.trim()
  if (!raw) return null

  // Parse what was typed before assuming anything about it. An input
  // that already states a scheme keeps it, and a scheme that is not the
  // web is refused rather than quietly rewritten: `file:`, `data:` and
  // `javascript:` all reach this function from a paste, and all three
  // end up as a fetch target and an href if they are let through.
  let url: URL
  try {
    url = new URL(raw)
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null
  } catch {
    try {
      url = new URL(`https://${raw}`)
    } catch {
      return null
    }
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null
  }

  url.hash = ''
  url.search = ''
  const path = url.pathname

  if (path.endsWith('/index.json')) {
    // already there
  } else if (path.endsWith('.html') || path.endsWith('.json')) {
    // A file: the index page, a record page, or a record itself. The
    // index sits at the root of the site, which for anything under
    // `records/` is one further directory up.
    const segments = path.split('/')
    segments.pop()
    if (segments[segments.length - 1] === 'records') segments.pop()
    url.pathname = `${segments.join('/')}/index.json`
  } else {
    // Anything else is a directory, whether or not it was typed with a
    // trailing slash. `https://you.github.io/your-repo` is a site, not a
    // file called `your-repo`.
    url.pathname = path.endsWith('/') ? `${path}index.json` : `${path}/index.json`
  }
  return url.toString()
}

/** Resolve a record's address, which the index states relative to itself. */
export function recordUrlFor(indexUrl: string, summary: PublishedRecordSummary): string | null {
  if (!summary.json) return null
  try {
    return new URL(summary.json, indexUrl).toString()
  } catch {
    return null
  }
}

/**
 * The three headline shares, as the index already knows them.
 *
 * Computed over the whole finished work rather than over the covered
 * part, which is the denominator the resolver's own fallback page uses,
 * so the two surfaces cannot disagree about the same record. The shares
 * therefore do not sum to 100% when some of the work was not classified,
 * and the set view says so rather than hiding it.
 */
export function sharesOf(s: PublishedRecordSummary): Array<{ cls: SpanClass; chars: number; pct: number }> {
  const final = s.finalChars ?? 0
  const by = s.charsByClass ?? {}
  const classes: SpanClass[] = ['survived_verbatim', 'survived_mutated', 'no_generation_provenance']
  return classes.map((cls) => {
    const chars = by[cls] ?? 0
    return { cls, chars, pct: final > 0 ? (chars / final) * 100 : 0 }
  })
}
