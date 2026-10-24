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

/**
 * The contract version this viewer was written against.
 *
 * Moved from 0.1 to 0.2 on 2026-10-18, when the resolver seat published
 * 0.2.0 for one additive field, `address`, and this viewer gained a
 * route that reads it.
 *
 * Moved from 0.2 to 0.3 the same day, when that seat published 0.3.0 for
 * the two fields this file had asked it for: `bytes` and `sha256`. That
 * is what moves `integrity.ts` from "no site states a digest yet" to a
 * check that can actually run, so the floor moves with it rather than
 * discovering the fields on a site one day.
 *
 * The floor is a floor and not a requirement. Both fields stay optional
 * below, because a site published before today states 0.1 or 0.2 and
 * carries neither, and that site has to keep reading.
 *
 * Moved from 0.3 to 0.4 on 2026-10-18, when that seat published 0.4.0
 * for one additive field, `pairing`, and this viewer started saying what
 * the set it is showing was resolved under. The seat told this one about
 * the field rather than letting it be found, and left the decision of
 * whether to show it here; the reason for showing it is in
 * `docs/design/pairing-bounds-in-the-set-view.md`.
 */
export const INDEX_CONTRACT = { major: 0, minor: 4 } as const

/**
 * How far the resolver's pairing walk was allowed to go, as the record
 * states it (`OutcomeRecord.task.pairedBy`) and the index repeats it for
 * the set.
 *
 * These are the three numbers that decide how many records a repository
 * yields, which is why the set view names them: a set of two found under
 * a 400-commit walk and a set of zero found under a 25-commit walk are
 * both honest answers about the same history, and without the bounds a
 * reader cannot tell which question was asked.
 *
 * `null` is the unbounded walk. `Infinity` is reachable as a bound on the
 * resolver's side and JSON-serializes to `null`, so a null here means the
 * walk had no limit rather than that the limit is unknown; an unknown
 * limit is the whole field being absent or empty.
 */
export interface PairingBounds {
  /** commits walked forward from a generation before the pair claim is abandoned */
  maxPairDistance: number | null
  /** hours between the generation and the edit before the same claim is abandoned */
  maxPairAgeHours: number | null
  /** how many later generations may rewrite the same file in between and the pair still stand */
  maxInterposedGenerations: number | null
}

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
   * New in contract 0.2: the record's own address, in the grammar of
   * `address.ts`, as a stranger would type it. Null in the index itself
   * when the publisher's store knew no repository, since there is then
   * nothing to build an absolute address from and a guess would be
   * worse than an absence.
   *
   * This is what turns the set view into something a person can share
   * out of: every row can now carry a link to that record alone, which
   * is what somebody looking at ten records actually wants to send.
   */
  address?: string | null
  /**
   * New in contract 0.3: lower-case hex SHA-256 of this record's file,
   * sixty-four characters, no prefix, taken by the publisher over the
   * exact buffer it wrote rather than over a second pass of its own
   * serializer. That distinction is the resolver seat's and it matters
   * here: a digest of a re-serialisation would be a claim about that
   * seat's serializer, and the day its indentation moved, every record
   * on a published site would fail verification with no way to tell
   * that from tampering.
   *
   * It identifies a file and never a resolution of an input, because the
   * resolve timestamp is inside the hashed bytes. Resolving the same
   * work twice gives two different digests and that is not tampering;
   * see the note on the address route in `integrity.ts`.
   *
   * Absent on 0.1 and 0.2 sites, which is why it is optional: the page
   * then says it could not check rather than implying it did.
   */
  sha256?: string
  /**
   * New in contract 0.3 alongside `sha256`: the byte length of this
   * record's own file, as the publisher counted it. Absent on 0.1 and
   * 0.2 sites.
   */
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
  /**
   * New in contract 0.4: the distinct pairing bound sets the records in
   * this set were resolved under, deduplicated by the publisher, widest
   * walk first.
   *
   * Optional and, when present, possibly empty, and the two absences
   * mean different things to the reader even though the page says the
   * same sentence for both. Absent is a site published under 0.1 to 0.3,
   * whose publisher never stamped the bounds. Empty is a 0.4 site none
   * of whose records state bounds, which is a chat-path record that was
   * never paired at all or a record written by a build that stamped
   * nothing. Neither of them is the defaults, and the page never says
   * the defaults, because a viewer that names a number the site did not
   * state is the failure this whole file is written against.
   */
  pairing?: PairingBounds[]
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

/**
 * What this page may say about how the set in front of it was found.
 *
 * The problem this answers, in the resolver seat's words when it handed
 * the field over: a reader of a published page could see two records and
 * not the two numbers that produced them, and on the repository it was
 * publishing, the resolver's default bounds produce no records at all.
 * Two records and zero records are both honest answers about the same
 * history, and the page could not tell them apart.
 *
 * So the bounds are not a detail about the resolver. They are the
 * question the set is the answer to, and a set shown without them is a
 * number a reader will read as a total.
 *
 * Four states, and the two absences are kept distinct in the prose
 * because they are distinct facts:
 *
 * - several bound sets: one published set holding records from runs that
 *   looked different distances. Stated per run, never averaged.
 * - one bound set: the ordinary case, stated in words.
 * - present and empty: a 0.4 site whose records state no bounds, which
 *   is the chat path or a build that stamped nothing.
 * - absent: a site published under 0.1 to 0.3, before the field existed.
 *
 * What it never does is name the resolver's defaults. The defaults live
 * in the resolver and they have changed; a viewer that filled an absence
 * with them would be stating a number this site never published.
 */
export interface PairingCopy {
  /** the sentence that governs the whole set, always present */
  line: string
  /** one phrase per distinct bound set, only when there are several */
  sets: string[]
}

/** One bound, in words, with the unbounded walk said as such. */
function boundPhrases(b: PairingBounds): { distance: string; age: string; interposed: string } {
  return {
    distance:
      typeof b.maxPairDistance === 'number'
        ? `walked at most ${b.maxPairDistance.toLocaleString()} commit${b.maxPairDistance === 1 ? '' : 's'} forward from a generation`
        : 'walked forward as far as the history went',
    age:
      typeof b.maxPairAgeHours === 'number'
        ? `allowed at most ${b.maxPairAgeHours.toLocaleString()} hour${b.maxPairAgeHours === 1 ? '' : 's'} between the generation and the edit`
        : 'put no limit on the time between the generation and the edit',
    interposed:
      typeof b.maxInterposedGenerations === 'number'
        ? `tolerated at most ${b.maxInterposedGenerations.toLocaleString()} later generation${b.maxInterposedGenerations === 1 ? '' : 's'} of the same file in between`
        : 'did not count how many later generations rewrote the same file in between',
  }
}

/**
 * What separates one fact from the next in a middot line.
 *
 * Exported because the string is a layout contract and not only
 * punctuation. A line of three facts measured 390px wide broke inside
 * the third one on a phone, leaving `· 2` at the end of one line and
 * `interposed generations` at the start of the next, so the reader met
 * a numeral with no unit attached to it. The view splits on this
 * constant and refuses to break inside a fact, which it can only do if
 * it knows where the facts end. Keeping the separator in one place is
 * what stops the reader and the writer from disagreeing about that.
 */
export const FACT_SEPARATOR = ' · '

/** The same bound as a line of three facts, for when there are several. */
function boundLine(b: PairingBounds): string {
  const d = typeof b.maxPairDistance === 'number' ? `${b.maxPairDistance.toLocaleString()} commits forward` : 'no commit limit'
  const h = typeof b.maxPairAgeHours === 'number' ? `${b.maxPairAgeHours.toLocaleString()} hours` : 'no time limit'
  const g =
    typeof b.maxInterposedGenerations === 'number'
      ? `${b.maxInterposedGenerations.toLocaleString()} interposed generation${b.maxInterposedGenerations === 1 ? '' : 's'}`
      : 'any number of interposed generations'
  return [d, h, g].join(FACT_SEPARATOR)
}

export function pairingCopy(index: PublishedIndex): PairingCopy {
  const bounds = index.pairing

  if (bounds === undefined) {
    return {
      line:
        'This site was published before the index stated how far the resolver looked, so this page cannot tell you what bounds produced the set above. That matters more than it sounds: the same history yields a different number of records at a different walk, and a set shown without its bounds reads like a total when it is an answer to one question.',
      sets: [],
    }
  }

  if (bounds.length === 0) {
    return {
      line:
        'No record in this set states how far the resolver looked, so this page cannot tell you what bounds produced it. A record captured from a chat session was never paired against a repository at all, and a record resolved by an older build was paired by something that stamped no bounds. Neither of those is the same claim as the resolver’s defaults, which is why this page names no number here rather than filling the gap with one.',
      sets: [],
    }
  }

  if (bounds.length === 1) {
    const p = boundPhrases(bounds[0])
    return {
      line: `Every record above was found by a pairing walk that ${p.distance}, ${p.age}, and ${p.interposed}. Those three numbers are why the set is the size it is. A narrower walk over the same history finds fewer records and is no less honest, so read the count above as the answer to this question rather than as everything that happened.`,
      sets: [],
    }
  }

  return {
    line: `The records above came from runs that did not look the same distance, so the bounds are stated once per run rather than collapsed into one claim that would be true of neither. One published set can hold ${bounds.length} of them, and the widest walk is first.`,
    sets: bounds.map(boundLine),
  }
}
