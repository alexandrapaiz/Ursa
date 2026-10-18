// The publish boundary: turns the records in a project's `.ursa/` into a
// directory of static files a web server can serve at a public address.
//
// WHY THIS FILE EXISTS. Both launches already write records and neither
// one produces an address. `ursa run` writes `.ursa/records/<id>.json`
// into the project and stops; `ursa ci` writes the same files into a
// GitHub runner's workspace, which is destroyed when the job ends, and
// the only thing that escapes is a pull request comment carrying five
// aggregate numbers. `renderViewer` in src/viewer.ts has produced a
// self-contained HTML page for a single record since 2026-09-25, and the
// only caller is src/cli.ts, the older chat path, which writes it beside
// the JSON in a local `--out` directory. So a person who runs the Action
// on their own repository today gets correct records they cannot read
// and cannot link anyone to.
//
// This module closes exactly that distance and nothing else. It does not
// resolve, classify, host, upload, or transmit. It reads records that
// already exist on disk and writes files next to each other, and whoever
// called it decides what to do with the directory. On the Action path
// that is `actions/upload-pages-artifact`, run by the consumer's own
// workflow, publishing to the consumer's own GitHub Pages site.
//
// THE TWO SURFACES, AND WHY BOTH. Every record is written twice:
//
//   records/<id>.html  the self-contained viewer page, for a person
//   records/<id>.json  the record itself, for a program
//
// plus `index.html` and `index.json` over the set. The HTML exists so
// the site is readable with no other software in the world; the JSON
// exists so a richer viewer can be built against a stable address
// without this module deciding how a record should look. `index.json`
// is the contract between the two, which is why it carries its own
// version and why `PublishedIndex` is declared here rather than inferred
// from whatever the renderer happened to need.
//
// THE DISCLOSURE GATE, which is the part that is not plumbing. An
// `OutcomeRecord` is raw data all the way through, and src/types.ts says
// so field by field: `files[].text` is the finished work verbatim,
// `generations[].text` is every model generation, and
// `conversations[].prompts[].text` is the user's own messages, annotated
// "Raw data; stays local." Writing those three into a directory someone
// is about to serve from a public URL is the single largest disclosure
// this codebase can perform, and it happens in one function call. So
// `publish()` refuses to write anything unless its caller passes
// `acknowledged: true`, and `manifestFor()` exists so that what the
// caller is acknowledging can be counted and printed first, in
// characters and in file paths, rather than described.
//
// This gate is deliberately NOT src/disclosure.ts. That module governs
// the Minor edge, where Ursa receives a projection of a record and the
// rule is that raw text never crosses under any circumstances, enforced
// by a closed vocabulary and a shingle audit. The rule here is the
// opposite shape: the raw text is the entire point of the page, the
// publisher is the person whose text it is, the destination is their own
// hosting, and no Ursa-operated system is involved at any point. Reusing
// `auditBatch()` here would reject every page this module exists to
// write. What the two share is only that neither lets raw data leave by
// accident.

import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { formatRecordAddress, pagesAddress } from './address'
import { resolvePairingBounds } from './pairfinder'
import { isForgotten, loadConsent } from './consent'
import { SAFE_RECORD_ID, listRecordIds, loadRecord } from './store'
import { renderViewer } from './viewer'
import type { OutcomeRecord, PairingBounds, ResolverIdentity, SpanClass } from './types'

/**
 * Version of the `index.json` contract below, independent of
 * `OutcomeRecord.schemaVersion`. The index can gain a field without a
 * record changing, and a record can change without the index moving, so
 * a consumer pinning one must not be told about the other.
 */
// 0.3.0, from 0.2.0, for two additive fields:
// `PublishedRecordSummary.sha256` and `.bytes`. 0.2.0 added `.address`
// to 0.1.0 on the same terms.
//
// A consumer pinned to 0.2.0 reads every field it knew and ignores the
// two new ones. The bump is here rather than silent because the frontend
// seat's viewer pins this number and accepts any minor at or above the
// one it was written against, so "a field appeared" has to be a thing it
// can detect rather than discover: its record page says "this index
// predates digests" for a 0.1.x or 0.2.x site and claims neither
// verified nor failed, which is only correct if the version moves when
// the field arrives.
//
// 0.4.0, from 0.3.0, for one additive field: `pairing`, the distinct
// pairing bound sets the records in this set were resolved under. Added
// 2026-10-18 because the index and the page built from it stated two
// records and not the two numbers that produced them, and on this
// repository the resolver's default bounds produce no records at all.
// A reader who cannot see the bounds cannot tell a set of two from a
// default-bounds set of zero, and both are honest.
export const PUBLISHED_INDEX_VERSION = '0.4.0'

/** Site-relative paths. Declared once so the renderer and the index agree. */
export const INDEX_JSON = 'index.json'
export const INDEX_HTML = 'index.html'
export const RECORDS_DIR = 'records'

/** Site-relative address of one record's two files. */
export function recordHref(id: string, ext: 'html' | 'json'): string {
  return `${RECORDS_DIR}/${id}.${ext}`
}

/**
 * One record as the index states it: enough to decide whether to open the
 * page, and never enough to reconstruct the work. Every field here is a
 * number, an identifier, or a site-relative path.
 *
 * `charsByClass` repeats the record's own `stats.byClass[*].chars` rather
 * than a percentage, because a percentage needs its denominator named and
 * the record carries two of them (`finalChars`, the whole finished work,
 * and `coveredChars`, the part some span covered). Both are here; a
 * reader divides by the one their question is about.
 */
export interface PublishedRecordSummary {
  id: string
  generatedAt: string
  finished: boolean
  artifactKind: string
  finalChars: number
  coveredChars: number
  charsByClass: Record<SpanClass, number>
  spansByClass: Record<SpanClass, number>
  generatedChars: number
  generatedDeletedChars: number
  /**
   * `task.resolvedBy` flattened to its discriminant and its one value.
   * `basis` is the record's own word: `git_commit` when the resolver ran
   * from a git work tree, `bundle_digest` when it ran as the committed
   * single-file bundle on a runner that had no commit to read. Null when
   * the record names no resolver, which is a real state and not a gap —
   * see `task.resolvedBy` in src/types.ts.
   */
  resolvedBy: { basis: string; value: string } | null
  html: string
  json: string
  /**
   * The record's address as a stranger would type it, in the grammar of
   * src/address.ts — `pages/<owner>/<repo>/<id>` for a site published
   * this way. Null when the publisher stated no repository, because
   * there is then nothing to build an absolute address from and a guess
   * would be worse than an absence.
   *
   * `html` and `json` above stay site-relative and stay the contract for
   * reading this directory wherever it is served. This field is the
   * contract for *linking* to one record from somewhere else, which is a
   * different question and the one a viewer's route asks.
   */
  address: string | null
  /**
   * Byte length of `records/<id>.json` as this run wrote it, and the
   * SHA-256 of those same bytes, lowercase hex, no prefix.
   *
   * WHY BOTH, AND WHY HERE. A viewer that renders a set from this index
   * and then fetches one record has to decide what it is allowed to
   * claim about the bytes that arrived. Before these two fields the only
   * honest answer was nothing, because the index named a path and said
   * nothing about what should be at it. The frontend seat's viewer
   * (2026-10-18) moved from inlining records in the set page to fetching
   * one on demand, which took a ten-record set from 2.5MB to the 9.7KB
   * of this index, and that trade gave up the one property inlining had
   * for free: the bytes you render are the bytes the set was built from.
   * These two fields buy it back. The viewer hashes what it received and
   * compares.
   *
   * WHAT IT PROVES. That the record being read is the one this index was
   * written against. It catches a truncated or partial download, a stale
   * copy cached at an edge or a CDN, and a record file replaced without
   * the index being rewritten.
   *
   * WHAT IT DOES NOT PROVE. That the publisher is honest. The index and
   * the records come from the same directory written by the same run, so
   * a publisher who edits both is not detected by this and cannot be:
   * detecting that needs a signature over the index by a key the reader
   * already trusts, which is a different mechanism and not this one.
   * Stating the limit is part of the field, not a caveat on it, and the
   * viewer says so on the page.
   *
   * HASHED OVER THE EXACT BYTES WRITTEN, not over a re-serialization of
   * the record. `publish` serializes each record once into a `Buffer`,
   * writes that buffer, and hashes that buffer, so the digest cannot
   * drift from the file through a difference in key order, indentation,
   * a trailing newline, or how a future Node encodes a lone surrogate.
   * A digest computed from `JSON.stringify` a second time would be a
   * claim about this process's serializer rather than about the file a
   * stranger downloads.
   *
   * `bytes` is stated separately rather than left for the reader to take
   * from `Content-Length`, because a reader that fetched the file already
   * has its length and wants to know whether it is the expected one, and
   * because the cheap check (wrong length) should not require hashing
   * megabytes to reach.
   */
  bytes: number
  sha256: string
}

export interface PublishedIndex {
  indexVersion: typeof PUBLISHED_INDEX_VERSION
  /** When the site was built, which is not when any record was resolved. */
  publishedAt: string
  /** `owner/name` when the publisher stated it, else null. Never inferred from a path. */
  repository: string | null
  /** Record schema versions present, so a consumer can refuse a set it cannot read. */
  recordSchemaVersions: string[]
  /**
   * The distinct pairing bound sets the records in this set were resolved
   * under (`OutcomeRecord.task.pairedBy`), deduplicated, widest distance
   * first. The same idiom as `recordSchemaVersions` above and for the
   * same reason: one published set can hold records resolved by
   * different runs, and collapsing that into one claim would invent a
   * fact.
   *
   * Empty means no record in this set states its bounds, which is a
   * different claim from a set resolved under the defaults: a chat-path
   * record was never paired at all, and a record written before
   * 2026-10-18 was paired by a build that stamped nothing. The page
   * built from this index says which of those it is rather than naming a
   * number it does not have.
   */
  pairing: PairingBounds[]
  records: PublishedRecordSummary[]
  /** The counts the publisher acknowledged before this site was written. */
  disclosed: DisclosureManifest
}

/**
 * What becomes publicly readable, counted. This is the thing a caller
 * acknowledges, and the reason it is a separate value from the site is
 * that it must be computable and printable BEFORE a byte is written.
 *
 * `filePaths` is the one field that is strings rather than counts, and it
 * is here on purpose: a character total does not tell a person that they
 * are about to publish `src/clients/northwind/pricing.ts`, and the path
 * list is the only part of the manifest that can stop a publication for
 * a reason the person could not have reached from a number.
 */
export interface DisclosureManifest {
  records: number
  recordIds: string[]
  /**
   * Which capture paths produced these records, sorted and deduplicated.
   * Load-bearing for what the disclosure can honestly claim, and the
   * reason this field exists at all.
   *
   * On the `git` path a generation is the blob of a touched file at the
   * agent's own commit, so every character of `generations[].text` is
   * already in the repository's history and a public repository has
   * already published it; there are no prompts, because a commit carries
   * no conversation. On `claude-code` and `paste` the generations and the
   * prompts come from a session log that was never in the repository, and
   * publishing them is the first time that text is readable by anyone.
   *
   * Measured rather than assumed: resolving this repository's own history
   * on 2026-10-18 produced two records with 143,218 characters of
   * generation and zero prompts, against which the sentence "this text
   * has never been public before" would have been false.
   */
  adapters: ('claude-code' | 'paste' | 'git')[]
  finalFiles: number
  filePaths: string[]
  finalChars: number
  generations: number
  generationChars: number
  conversations: number
  prompts: number
  promptChars: number
}

/**
 * The distinct pairing bound sets present in a set of records, widest
 * distance first, with records that state none left out.
 *
 * Deduplicated by value rather than by identity, because every record a
 * single run writes gets the same object today and nothing guarantees
 * that for a set assembled from two runs' `.ursa/records/` directories,
 * which is the ordinary case for a project that has resolved twice.
 */
function distinctPairingBounds(records: OutcomeRecord[]): PairingBounds[] {
  const seen = new Map<string, PairingBounds>()
  for (const r of records) {
    const b = r.task.pairedBy
    if (!b) continue
    seen.set(`${b.maxPairDistance}|${b.maxPairAgeHours}|${b.maxInterposedGenerations}`, b)
  }
  return [...seen.values()].sort((a, b) => b.maxPairDistance - a.maxPairDistance)
}

/** A bound a reader can read, including the unbounded walk. */
function boundValue(n: number, unit: string): string {
  if (!Number.isFinite(n)) return `no limit on ${unit}`
  return `${n.toLocaleString('en-US')} ${unit}`
}

/**
 * The sentence the published index page carries about how its records
 * were paired, and the reason this is a function with its own test
 * rather than a template literal inside the page.
 *
 * A record exists on a published site because a model wrote a file and
 * somebody edited that same file afterwards. Three numbers decide how
 * far apart those two commits may be before the resolver stops believing
 * the second corrects the first, and moving them changes the set
 * completely rather than at the margin: measured on this repository on
 * 2026-10-18, the default 25-commit distance produced no records and a
 * 400-commit distance produced two, because a dozen agent seats commit
 * between one touch of a file by the owner and the next. So a page that
 * shows two records and not the bounds behind them reads as a repository
 * with two records in it, when it is a repository whose honest default
 * answer is none.
 *
 * Returns plain sentences for the page to escape, never markup, so this
 * is the one place the claim is written and `renderIndexPage` cannot
 * state a second version of it.
 */
export function pairingSentences(index: PublishedIndex): string[] {
  const d = resolvePairingBounds()
  const defaults = `The resolver's own defaults are ${boundValue(d.maxPairDistance, 'commits')} and ${boundValue(d.maxPairAgeHours, 'hours')}.`
  const widening =
    'Widening either limit admits pairs a narrower one refuses, so the same history published under different bounds is a different set and not a better reading of the same one.'
  if (index.pairing.length === 0) {
    if (index.records.length === 0) return []
    return [
      'None of the records above states the pairing bounds it was resolved under, because they were written by a resolver that did not record them or by a capture path that walks no commits at all.',
      defaults,
    ]
  }
  if (index.pairing.length === 1) {
    const b = index.pairing[0]
    const interposed = b.maxInterposedGenerations === 0
      ? 'and no later generation may have rewritten the file in between'
      : `and at most ${boundValue(b.maxInterposedGenerations, 'later generations')} may have rewritten the file in between`
    return [
      `Every record above was paired within ${boundValue(b.maxPairDistance, 'commits')} and ${boundValue(b.maxPairAgeHours, 'hours')} of the generation it corrects, ${interposed}.`,
      defaults,
      widening,
    ]
  }
  const sets = index.pairing
    .map((b) => `${boundValue(b.maxPairDistance, 'commits')} and ${boundValue(b.maxPairAgeHours, 'hours')}`)
    .join(', ')
  return [
    `The records above were resolved under ${index.pairing.length} different sets of pairing bounds: ${sets}. Each record's own JSON states which set produced it.`,
    defaults,
    widening,
  ]
}

export function manifestFor(records: OutcomeRecord[]): DisclosureManifest {
  const paths = new Set<string>()
  const adapters = new Set<'claude-code' | 'paste' | 'git'>()
  let finalChars = 0, generations = 0, generationChars = 0
  let conversations = 0, prompts = 0, promptChars = 0
  for (const r of records) {
    for (const f of r.files) {
      paths.add(f.path)
      finalChars += f.text.length
    }
    for (const g of r.generations) {
      generations += 1
      generationChars += g.text.length
    }
    for (const c of r.conversations) {
      conversations += 1
      adapters.add(c.adapter)
      for (const p of c.prompts ?? []) {
        prompts += 1
        promptChars += p.text.length
      }
    }
  }
  return {
    records: records.length,
    recordIds: records.map((r) => r.task.id),
    adapters: [...adapters].sort(),
    finalFiles: [...paths].length,
    filePaths: [...paths].sort(),
    finalChars,
    generations,
    generationChars,
    conversations,
    prompts,
    promptChars,
  }
}

/**
 * The manifest as the sentence a person reads before they agree to it.
 * Written as prose with the numbers inline rather than as a table,
 * because the thing being consented to is "my own messages become
 * readable by anyone", and that does not survive being a row.
 */
export function formatManifest(m: DisclosureManifest): string {
  const n = (x: number) => x.toLocaleString('en-US')
  const lines: string[] = []
  lines.push(`Publishing ${n(m.records)} record${m.records === 1 ? '' : 's'} makes all of the following readable by anyone with the address:`)
  lines.push('')
  lines.push(`  the full text of ${n(m.finalFiles)} finished file${m.finalFiles === 1 ? '' : 's'}   ${n(m.finalChars)} characters`)
  lines.push(`  the full text of ${n(m.generations)} model generation${m.generations === 1 ? '' : 's'}  ${n(m.generationChars)} characters`)
  lines.push(`  your own ${n(m.prompts)} message${m.prompts === 1 ? '' : 's'} to the model      ${n(m.promptChars)} characters`)
  lines.push('')
  if (m.filePaths.length > 0) {
    lines.push('The file paths that will appear on the page, in full:')
    for (const p of m.filePaths) lines.push(`  ${p}`)
    lines.push('')
  }
  for (const line of noveltyOfDisclosure(m)) lines.push(line)
  lines.push('')
  lines.push('Nothing here is aggregated, redacted or withheld: a published record is')
  lines.push('the record.')
  return lines.join('\n')
}

/**
 * How much of the above is text nobody could already read. It depends
 * entirely on where the record came from, and it is the one claim in a
 * disclosure that must not overstate.
 *
 * This function exists because the sentence it replaces was wrong. Until
 * 2026-10-18 `formatManifest` ended with "text that has never been public
 * before, even when the repository is", and the first end-to-end run of
 * `ursa publish` on this repository printed it over two git-path records
 * whose 143,218 characters of generation are blobs of files at commits
 * already pushed to a public remote. The claim was false for the only
 * path the Action actually uses.
 *
 * Returned as lines rather than one sentence because the mixed case is
 * real: a project can hold records from both paths, and collapsing them
 * would have to pick either the weaker or the stronger claim, and both
 * are wrong about half the set.
 */
export function noveltyOfDisclosure(m: DisclosureManifest): string[] {
  const hasGit = m.adapters.includes('git')
  const hasChat = m.adapters.some((a) => a === 'claude-code' || a === 'paste')
  const out: string[] = []
  if (hasGit) {
    out.push("The generations in the git-path records are blobs of files at the agent's")
    out.push('own commits, so a public repository has already published that text. What')
    out.push('is new on the page is the classification over it: which characters a model')
    out.push('wrote, which ones you changed, and which ones it never touched.')
  }
  if (hasChat) {
    if (hasGit) out.push('')
    out.push('The generations and the messages in the session-path records come from a')
    out.push('transcript that was never in the repository. Publishing them is the first')
    out.push('time that text is readable by anyone, and it includes every message you')
    out.push('typed to the model, in full.')
  }
  if (out.length === 0) {
    out.push('These records name no conversation, so what becomes readable is the')
    out.push('finished text and the classification over it.')
  }
  return out
}

export interface PublishOptions {
  /** the project whose `.ursa/records/` is read */
  projectPath: string
  /** the directory the site is written into; created if absent */
  outDir: string
  /**
   * Must be `true` or nothing is written. See the disclosure gate note at
   * the top of this file: this is the whole of the consent mechanism, and
   * it has no default so that no caller acquires it by omission.
   */
  acknowledged: boolean
  /** `owner/name`, stated by the publisher; recorded in the index verbatim. */
  repository?: string | null
  /** overridable for tests; defaults to now */
  publishedAt?: string
}

export interface PublishResult {
  /** absolute paths written, in the order they were written */
  written: string[]
  index: PublishedIndex
  /**
   * Record ids whose slug is not this repository's name, which means the
   * id carries the name of whatever directory the work was resolved in.
   * See `foreignSlugWarnings` for why that matters more here than it does
   * on disk.
   */
  warnings: string[]
  /**
   * Record ids found in `.ursa/records/` and skipped, with the reason.
   * Reported rather than thrown: one unreadable file must not stop a
   * publication of fifty good records, and a silent skip would publish a
   * site that claims to be the project's records and is not.
   */
  skipped: { id: string; reason: 'unsafe-id' | 'unreadable' | 'forgotten' }[]
}

export class DisclosureNotAcknowledged extends Error {
  constructor(readonly manifest: DisclosureManifest) {
    super('publish refused: the disclosure above was not acknowledged')
    this.name = 'DisclosureNotAcknowledged'
  }
}

/**
 * Every record on disk for this project, in id order, with the ones this
 * module refused to publish named and reasoned.
 *
 * WHY THE CONSENT RECORD IS READ HERE. `ursa forget <project> --record
 * <id>` deletes the record file and writes a tombstone, so in the
 * ordinary case a forgotten record is already absent from
 * `listRecordIds` and this check finds nothing. It is here for the case
 * where the file and the tombstone disagree: a `.ursa/` restored from a
 * backup, a runner cache that outlived the erasure, a record copied
 * between clones, or a tombstone written for a record that was never on
 * this machine. `projectForMinor` in src/disclosure.ts consults
 * `isForgotten` for exactly the same reason even though its callers also
 * filter, and the argument is stronger here: that edge sends counters to
 * Ursa and can be re-run, while this one writes a page to a public
 * address that stays up until something replaces it.
 *
 * It is the load-bearing constraint in CLAUDE.md — "the user can always
 * see, edit, revoke, and delete what's been inferred about them" — read
 * at the one boundary where failing it is visible to strangers.
 */
export function loadPublishable(projectPath: string): {
  records: OutcomeRecord[]
  skipped: PublishResult['skipped']
} {
  const records: OutcomeRecord[] = []
  const skipped: PublishResult['skipped'] = []
  const consent = loadConsent(projectPath)
  for (const id of listRecordIds(projectPath)) {
    // Checked here and not left to `loadRecord`, which returns null for an
    // unsafe id and for an absent file alike. An id becomes a path segment
    // in `recordHref` and therefore a URL, so the refusal needs to be
    // visible in the result rather than folded into "unreadable".
    if (!SAFE_RECORD_ID.test(id)) { skipped.push({ id, reason: 'unsafe-id' }); continue }
    // Before the file is read, so a tombstoned record's text is never
    // even loaded into this process on the way to being refused.
    if (isForgotten(consent, id)) { skipped.push({ id, reason: 'forgotten' }); continue }
    let record: OutcomeRecord | null = null
    try {
      record = loadRecord(projectPath, id)
    } catch {
      record = null
    }
    if (!record) { skipped.push({ id, reason: 'unreadable' }); continue }
    // Parsing as JSON is not the same as being a record. `loadRecord`
    // casts whatever `JSON.parse` returned to `OutcomeRecord` and the
    // type checker then stops asking, so a file that is valid JSON and
    // not a record reaches `manifestFor`, which dereferences four arrays
    // and throws `r.files is not iterable`. That surfaced on 2026-10-18
    // in `ursa address`, which reads the same store, and it is the same
    // defect here: a publish is not supposed to be stoppable by one bad
    // file in a directory of good ones. Checked by shape rather than
    // with a schema, because the four arrays below are exactly what the
    // manifest and the summary walk, and a full `zod` schema over
    // `OutcomeRecord` would refuse records written by older resolvers
    // that this path can read perfectly well.
    if (!isRecordShaped(record)) { skipped.push({ id, reason: 'unreadable' }); continue }
    records.push(record)
  }
  return { records, skipped }
}

/**
 * The fields every consumer in this file walks, present and of the right
 * kind. Not a validation of `OutcomeRecord` and not trying to be: it is
 * the precondition of `manifestFor` and `summarize`, written where those
 * two are.
 */
export function isRecordShaped(r: OutcomeRecord): boolean {
  return (
    Array.isArray(r.files) &&
    Array.isArray(r.generations) &&
    Array.isArray(r.conversations) &&
    typeof r.task?.id === 'string' &&
    typeof r.stats?.finalChars === 'number' &&
    typeof r.stats?.byClass === 'object'
  )
}

export function publish(opts: PublishOptions): PublishResult {
  const { records, skipped } = loadPublishable(opts.projectPath)
  const disclosed = manifestFor(records)
  if (!opts.acknowledged) throw new DisclosureNotAcknowledged(disclosed)

  // Each record is serialized BEFORE the index is built, and the index
  // is then built from these buffers. That order is the whole mechanism
  // behind `PublishedRecordSummary.sha256`: the digest in the index is
  // of the bytes that get written, because they are the same bytes. A
  // digest taken from a second `JSON.stringify` of the same object would
  // be a statement about this serializer and not about the file a
  // stranger downloads, and the two can differ without anyone noticing.
  //
  // Cost of holding them all at once: the whole set in memory as UTF-8,
  // which for this repository's own ten records measured 21MB of site
  // with a 4MB worst record on 2026-10-18. The records are already all
  // in memory as objects by this line, which is strictly larger, so this
  // adds a constant factor to a process that was already proportional to
  // the set and does not change what the publish path can handle.
  const bodies = new Map<string, Buffer>()
  for (const record of records) {
    bodies.set(record.task.id, Buffer.from(JSON.stringify(record, null, 2) + '\n', 'utf8'))
  }

  const index: PublishedIndex = {
    indexVersion: PUBLISHED_INDEX_VERSION,
    publishedAt: opts.publishedAt ?? new Date().toISOString(),
    repository: opts.repository ?? null,
    recordSchemaVersions: [...new Set(records.map((r) => r.schemaVersion))].sort(),
    pairing: distinctPairingBounds(records),
    records: records.map((r) => summarize(r, opts.repository ?? null, bodies.get(r.task.id)!)),
    disclosed,
  }

  const recordsDir = join(opts.outDir, RECORDS_DIR)
  mkdirSync(recordsDir, { recursive: true })
  const written: string[] = []
  const write = (path: string, body: string | Buffer) => {
    writeFileSync(path, body)
    written.push(path)
  }
  for (const record of records) {
    write(join(recordsDir, `${record.task.id}.html`), renderViewer(record))
    write(join(recordsDir, `${record.task.id}.json`), bodies.get(record.task.id)!)
  }
  write(join(opts.outDir, INDEX_JSON), JSON.stringify(index, null, 2) + '\n')
  write(join(opts.outDir, INDEX_HTML), renderIndexPage(index))
  // GitHub Pages runs Jekyll over an uploaded directory unless told not
  // to, and Jekyll drops every path beginning with an underscore. No file
  // this module writes begins with one today, but a record id may
  // (`SAFE_RECORD_ID` permits it after the first character and a task id
  // comes from a directory name), and a page silently missing from a
  // published set is the failure this file is least able to notice.
  write(join(opts.outDir, '.nojekyll'), '')
  return { written, index, skipped, warnings: foreignSlugWarnings(records, opts.repository ?? null) }
}

/**
 * The record id is the name of the directory the work was resolved in.
 * `episodeId` in src/episodes.ts builds it as
 * `basename(projectPath)`-`date`-`sha7`, so resolving
 * `~/work/northwind-pricing` produces the id
 * `northwind-pricing-2026-10-18-8dcb0c7`.
 *
 * On disk that is a known wart, recorded in docs/ideas.md on 2026-10-16
 * as a primary key that moves when you rename a folder. Publishing
 * changes what it costs rather than what it is: the id becomes a path
 * segment in a URL anyone can read and a search engine can index, and
 * `index.json` lists every one of them in `disclosed.recordIds`. A
 * directory name is the one piece of the publisher's filesystem this
 * module cannot avoid carrying, because it is the record's identity and
 * not a field beside it.
 *
 * This function cannot fix that — the id is the primary key and changing
 * it is a decision about every record already written, not a publish-time
 * transform. What it can do is refuse to let the leak happen silently.
 * On a GitHub runner the workspace is `/home/runner/work/<repo>/<repo>`,
 * so the slug is the repository's own name and there is nothing to warn
 * about; that is the quiet case and it is the common one. The loud case
 * is a record resolved somewhere else and published here, which is
 * exactly when the directory name is information the publisher did not
 * mean to hand over.
 *
 * Warned rather than refused, because the publisher may well have meant
 * it: a repository published under one name whose records were resolved
 * from a differently-named local clone is a legitimate and ordinary
 * thing. A refusal would be this module overruling the person whose data
 * it is, which is the posture the whole product exists not to take.
 */
export function foreignSlugWarnings(records: OutcomeRecord[], repository: string | null): string[] {
  if (!repository) return []
  const repoSlug = repository.split('/').pop()!.toLowerCase().replace(/[^a-z0-9-]+/g, '-')
  if (!repoSlug) return []
  const out: string[] = []
  for (const r of records) {
    // The id is `<slug>-<YYYY-MM-DD>-<sha7>`; everything before the date
    // is the slug, and a slug may itself contain dashes.
    const slug = r.task.id.replace(/-\d{4}-\d{2}-\d{2}-[0-9a-f]{7}$/, '')
    if (slug === r.task.id || slug === repoSlug) continue
    out.push(
      `record "${r.task.id}" will be published at ${recordHref(r.task.id, 'html')}, and the ` +
      `"${slug}" in that address is the name of the directory this work was resolved in, not ` +
      `"${repoSlug}". If that directory name is not something you want in a public URL, rename ` +
      `the checkout and resolve again before publishing.`,
    )
  }
  return out
}

/**
 * `body` is the exact buffer that will be written to
 * `records/<id>.json`, passed in rather than computed here so that the
 * digest this returns and the file `publish` writes cannot come apart.
 * See `PublishedRecordSummary.sha256` for what the digest is for and
 * what it deliberately does not claim.
 */
function summarize(
  record: OutcomeRecord,
  repository: string | null,
  body: Buffer,
): PublishedRecordSummary {
  const chars = {} as Record<SpanClass, number>
  const spans = {} as Record<SpanClass, number>
  for (const [cls, stat] of Object.entries(record.stats.byClass)) {
    chars[cls as SpanClass] = stat.chars
    spans[cls as SpanClass] = stat.spans
  }
  const by = record.task.resolvedBy
  const address = repository ? pagesAddress(repository, record.task.id) : null
  return {
    id: record.task.id,
    generatedAt: record.task.generatedAt,
    finished: record.task.finished,
    artifactKind: record.artifact.kind,
    finalChars: record.stats.finalChars,
    coveredChars: record.stats.coveredChars,
    charsByClass: chars,
    spansByClass: spans,
    generatedChars: record.stats.generated.charsWritten,
    generatedDeletedChars: record.stats.generated.deletedChars,
    resolvedBy: by ? { basis: by.basis, value: resolverValue(by) } : null,
    html: recordHref(record.task.id, 'html'),
    json: recordHref(record.task.id, 'json'),
    address: address ? formatRecordAddress(address) : null,
    bytes: body.byteLength,
    sha256: createHash('sha256').update(body).digest('hex'),
  }
}

/**
 * The one string that identifies a resolver build, whichever of the two
 * forms it took. `ResolverIdentity` is a discriminated union: the local
 * launch reads the commit of the work tree it ran from, the bundled
 * launch hashes the bytes that ran, because a runner handed an unpacked
 * tarball has no commit to read. The index carries `basis` beside this
 * value so a reader who will only accept a record auditable against a
 * public commit filters on the word instead of guessing from the shape
 * of the string. Both forms are a hex digest and they are not
 * distinguishable by length.
 */
function resolverValue(by: ResolverIdentity): string {
  return by.basis === 'git_commit' ? by.commit : by.digest
}

// ---------------------------------------------------------------------------
// The index page
// ---------------------------------------------------------------------------

/**
 * The set of records as one page, in the viewer's own palette so the two
 * read as one site. Self-contained: no stylesheet, no script, no font and
 * no image is fetched, for the same reason `renderViewer` inlines its
 * record — a page about where your data went must not call anywhere to
 * render.
 */
export function renderIndexPage(index: PublishedIndex): string {
  const n = (x: number) => x.toLocaleString('en-US')
  const pct = (part: number, whole: number) => (whole > 0 ? ((part / whole) * 100).toFixed(1) + '%' : '—')
  // Each cell carries its own column name in a `<span class="label">`,
  // hidden on a wide viewport where the table header already supplies
  // it and shown on a narrow one where the row has become a block and
  // the header is gone. The label is real text in the document rather
  // than a `::before { content: attr(data-label) }`, because CSS
  // generated content is not dependably exposed to a screen reader and
  // a column name that exists only in a stylesheet is a column name a
  // reader can lose. See the narrow-viewport rules in the stylesheet
  // below for why the row stops being a row at all.
  const rows = index.records.map((r) => {
    const verbatim = r.charsByClass.survived_verbatim ?? 0
    const mutated = r.charsByClass.survived_mutated ?? 0
    const none = r.charsByClass.no_generation_provenance ?? 0
    const cell = (cls: string, label: string, body: string) =>
      `  <td class="${cls}"><span class="label">${escapeHtml(label)}</span>${body}</td>`
    return [
      '<tr class="record">',
      cell('id', 'Record', `<a href="${escapeAttr(r.html)}">${escapeHtml(r.id)}</a>`),
      cell('num', 'Final characters', n(r.finalChars)),
      cell('num verbatim', 'Kept unchanged', pct(verbatim, r.finalChars)),
      cell('num mutated', 'Kept, edited', pct(mutated, r.finalChars)),
      cell('num human', 'No model behind it', pct(none, r.finalChars)),
      cell('when', 'Resolved', escapeHtml(r.generatedAt.slice(0, 10))),
      cell('raw', 'Raw record', `<a href="${escapeAttr(r.json)}">JSON</a>`),
      '</tr>',
    ].join('\n')
  }).join('\n')

  const dflt = resolvePairingBounds()
  const empty = `<p class="empty">This site has no records in it. Either no merge has produced
  one yet, or every work unit in the merge window fell below the
  <code>min-chars</code> floor, or no model generation was followed closely
  enough by somebody editing the same file: the resolver pairs a generation
  with an edit only within ${n(dflt.maxPairDistance)} commits and
  ${n(dflt.maxPairAgeHours)} hours of it by default, and on a repository
  where other writers commit in between, that window closes before the
  person gets there. Raising <code>max-pair-distance</code> and
  <code>max-pair-age-hours</code> is what widens it. An empty set is
  reported rather than rendered as a zero, because the two are different
  claims.</p>`

  const d = index.disclosed
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Outcome records${index.repository ? ` — ${escapeHtml(index.repository)}` : ''}</title>
<style>
  :root {
    color-scheme: dark;
    --surface-1: #1a1a19;
    --surface-2: #232322;
    --border: #3a3a37;
    --text-primary: #ffffff;
    --text-secondary: #c3c2b7;
    --text-muted: #8a897e;
    --verbatim: #199e70;
    --mutated: #d95926;
    --human: #3987e5;
  }
  * { box-sizing: border-box; margin: 0; }
  body {
    background: var(--surface-1); color: var(--text-primary);
    font: 15px/1.55 -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    padding: 32px clamp(16px, 4vw, 56px) 80px;
  }
  .wordmark { font-size: 12px; letter-spacing: 0.32em; color: var(--text-muted); text-transform: uppercase; }
  h1 { font-size: 26px; font-weight: 600; margin: 6px 0 2px; }
  .meta { color: var(--text-secondary); font-size: 13px; }
  .lede { color: var(--text-secondary); max-width: 68ch; margin: 18px 0 8px; }
  table { border-collapse: collapse; width: 100%; margin: 24px 0 8px; font-size: 14px; }
  th, td { text-align: left; padding: 9px 12px; border-bottom: 1px solid var(--border); }
  th { color: var(--text-muted); font-weight: 500; font-size: 12px; }
  td.num, th.num { text-align: right; font-variant-numeric: tabular-nums; }
  td.id a { color: var(--text-primary); text-decoration: none; border-bottom: 1px solid var(--border); }
  td.id a:hover { border-bottom-color: var(--text-primary); }
  td.raw a, .disclosure a { color: var(--text-secondary); }
  td.verbatim { color: var(--verbatim); }
  td.mutated { color: var(--mutated); }
  td.human { color: var(--human); }
  td.when { color: var(--text-muted); font-variant-numeric: tabular-nums; }
  .legend, .disclosure, footer { color: var(--text-muted); font-size: 13px; max-width: 72ch; }
  .legend { margin: 14px 0 0; }
  .legend dt { color: var(--text-secondary); margin-top: 9px; }
  .disclosure {
    background: var(--surface-2); border: 1px solid var(--border); border-radius: 10px;
    padding: 14px 16px; margin: 28px 0 0;
  }
  .disclosure h2 { font-size: 13px; color: var(--text-secondary); font-weight: 600; margin-bottom: 6px; }
  .empty { color: var(--text-secondary); max-width: 68ch; margin: 24px 0; }
  code { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 0.92em; color: var(--text-secondary); }
  footer { margin-top: 34px; border-top: 1px solid var(--border); padding-top: 14px; }
  /* Supplied by the table header on a wide viewport; see the rules below. */
  .label { display: none; }
  /* A record id is <directory-name>-<date>-<sha7> and can be 40
     characters with no space in it, so without this one declaration the
     id column has a minimum width equal to its longest word and pushes
     the table past the viewport whatever else the layout does. */
  td.id, td.id a { overflow-wrap: anywhere; }

  /* THE NARROW VIEWPORT, and why the table stops being a table.
     Measured by the frontend seat on 2026-10-18: at a 390px viewport
     this page's document was 521px wide, so the three provenance
     columns, the date and the JSON link were all off screen with no way
     to reach them, and each row stood eight lines tall because every
     record id was breaking one word per line. A seven-column table of
     numbers has a minimum width that no amount of padding or font size
     gets under 390px, so the fix is not to shrink it: each row becomes
     one block carrying its own labels, which is the shape the frontend
     seat's own set view uses and which has no minimum width at all.
     760px is the breakpoint because that is where this table's seven
     columns stop fitting without the numbers colliding, not a round
     number chosen for a device. Verify with
     npx tsx tools/measure-index-page.ts (a backtick cannot appear here:
     this stylesheet lives inside a template literal). */
  @media (max-width: 760px) {
    table, tbody, tr, td { display: block; width: auto; }
    thead { display: none; }
    table { margin: 18px 0 8px; }
    tr.record {
      border: 1px solid var(--border); border-radius: 10px;
      padding: 10px 13px; margin: 0 0 12px;
    }
    td, th { border-bottom: none; padding: 3px 0; }
    td.num, td.when, td.raw {
      display: flex; justify-content: space-between; gap: 14px; text-align: right;
    }
    td.id { padding-bottom: 7px; font-size: 15px; }
    .label { display: block; color: var(--text-muted); font-size: 12px; text-align: left; }
    td.num .label, td.when .label, td.raw .label { display: inline; }
  }
</style>
</head>
<body>
<header>
  <div class="wordmark">Ursa Major</div>
  <h1>Outcome records${index.repository ? ` for ${escapeHtml(index.repository)}` : ''}</h1>
  <div class="meta">${n(index.records.length)} record${index.records.length === 1 ? '' : 's'} · built ${escapeHtml(index.publishedAt.slice(0, 16).replace('T', ' '))} UTC</div>
</header>

<p class="lede">Each record below is one finished piece of work joined backward to every
model generation that fed it, with every stretch of the final text
labelled by what happened to it. Open one and the labels are navigable:
from any span you reach the generation that produced it and the message
that elicited that generation.</p>

${index.records.length === 0 ? empty : `<table>
<thead><tr>
  <th>Record</th><th class="num">Final characters</th>
  <th class="num">Kept unchanged</th><th class="num">Kept, edited</th><th class="num">No model behind it</th>
  <th>Resolved</th><th>Raw record</th>
</tr></thead>
<tbody>
${rows}
</tbody>
</table>

<dl class="legend">
  <dt>Kept unchanged</dt><dd>Characters of the finished work that a model generated and nobody
    altered, byte for byte, and that the generation's own parent commit did not already hold.</dd>
  <dt>Kept, edited</dt><dd>Characters a model generated and a person then changed. The edit is the
    correction, expressed as an edit rather than as a complaint.</dd>
  <dt>No model behind it</dt><dd>Characters present in the finished work that trace to no generation
    at all. The model was never in the running for them.</dd>
</dl>

<p class="legend">All three columns divide by the whole finished work, so they do not sum
to 100%: the characters between labelled spans belong to no class. Each
record's page carries both denominators.</p>

<p class="legend">${escapeHtml(pairingSentences(index).join(' '))}</p>`}

<div class="disclosure">
  <h2>What is on this site</h2>
  <p>Every record here carries raw text, not a summary: ${n(d.finalChars)} characters of
  finished work across ${n(d.finalFiles)} file${d.finalFiles === 1 ? '' : 's'}, ${n(d.generationChars)} characters of model
  output across ${n(d.generations)} generation${d.generations === 1 ? '' : 's'}, and ${n(d.promptChars)} characters of the
  publisher's own messages to the model across ${n(d.prompts)} message${d.prompts === 1 ? '' : 's'}. Whoever built this
  site was shown those counts and the file paths, and agreed to them.</p>
  <p>${escapeHtml(noveltyOfDisclosure(d).join(' ').replace(/\s+/g, ' '))}</p>
</div>

<footer>
  Built by Ursa Major's resolver from this repository's own git history, on
  the repository owner's own runner. Index contract version ${escapeHtml(index.indexVersion)};
  record schema ${escapeHtml(index.recordSchemaVersions.join(', ') || 'none')}. The machine-readable form
  of this page is <a href="${INDEX_JSON}">${INDEX_JSON}</a>, which states each record's
  byte count and the SHA-256 of its own file, so a reader who fetches one record can
  check that it is the record this index was built against. That check catches a
  truncated download, a stale copy served by a cache, and a record replaced without
  this page being rebuilt. It does not show that whoever published this site is
  honest, because this page and the records under it were written by the same run.
</footer>
</body>
</html>
`
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!
  ))
}

/** Same escape, named separately because an attribute's quoting is the point. */
function escapeAttr(s: string): string {
  return escapeHtml(s)
}

/** True when the project has a `.ursa/` at all, for a caller that wants to say so. */
export function hasRecordStore(projectPath: string): boolean {
  return existsSync(join(projectPath, '.ursa', 'records'))
}
