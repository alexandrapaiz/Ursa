// The disclosure boundary: the only code allowed to turn an outcome
// record into something that may leave the device.
//
// Why this file is the shape it is. An `OutcomeRecord` is raw data all
// the way through. `files[].text` is the user's finished work verbatim.
// `generations[].text` is every model generation. `conversations[]
// .prompts[].text` is the user's own messages, and `types.ts` says so in
// a comment ("Raw data; stays local"). Before this file existed, no
// function anywhere derived a smaller thing from a record, so the only
// way to transmit anything at all was to transmit the record. A comment
// is not a boundary.
//
// docs/design/product-plan.md §12 already specified what may cross, down
// to the SQL: exactly three edges, of which one is "aggregate scalar
// batch (Minor-consented only)", landing in
//
//   CREATE TABLE survival_stats (
//     domain TEXT, model TEXT, week_start DATE,
//     contributor_count INT,            -- k-anonymity floor; rows below 5 withheld
//     survival_scalar NUMERIC(5,4), sample_generations INT, ... );
//
// and of which the plan also says: "Raw prompts, diffs, quotes,
// discovered specs — never leaves, even encrypted." `SurvivalStatsRow`
// below is that table, field for field.
//
// The design choice that matters: this module is whitelist-by-
// construction AND independently audited. Building the projection out of
// nothing but counters would already be correct, but "correct because
// read the code" is not a property a lab's counsel or a privacy
// reviewer can check, and it silently stops being true the first time
// someone adds a field. So `auditBatch()` re-derives the guarantee from
// the outside, over the serialized payload, with no knowledge of how it
// was produced. Two independent checks:
//
//   1. VOCABULARY. Every string anywhere in the payload must be a
//      member of a closed, declared vocabulary: a permitted key name, a
//      `DOMAIN_BUCKETS` member, an ISO date, the schema version, the
//      scope name, or a model identifier from `MODEL_VOCABULARY`. Everything
//      else must be a number. Prose cannot satisfy that, which is the
//      point.
//   2. SHINGLES. Independently of (1), every 16-character window of
//      every raw string in the source records is checked against the
//      payload. This catches a leak smuggled through a field that
//      happens to pass (1) — a path hidden in a model id, say.
//
// A check that cannot fail proves nothing, so `disclosure.test.ts`
// includes a deliberately poisoned payload for each of the two and
// asserts each one catches it.

import type { GenerationRecord, OutcomeRecord } from './types'
import type { ConsentRecord, DisclosureScope } from './consent'
import { isForgotten, isGranted } from './consent'

// ---------------------------------------------------------------------------
// The closed vocabulary
// ---------------------------------------------------------------------------

/**
 * Domain buckets. Derived from a file extension and nothing else.
 *
 * A path is identifying — `src/clients/northwind/pricing.ts` names a
 * customer — so the path itself never crosses, and neither does a
 * directory component. The extension is a closed set the user cannot
 * encode anything into. This is the full vocabulary of the `domain`
 * column; `other` is the catch-all, so an extension nobody anticipated
 * degrades to a bucket rather than to a leak.
 */
export const DOMAIN_BUCKETS = [
  'code/typescript',
  'code/javascript',
  'code/python',
  'code/web',
  'code/config',
  'code/sql',
  'prose/markdown',
  'prose/text',
  'prose/latex',
  'other',
] as const

export type DomainBucket = (typeof DOMAIN_BUCKETS)[number]

const EXT_TO_BUCKET: Record<string, DomainBucket> = {
  '.ts': 'code/typescript', '.tsx': 'code/typescript',
  '.js': 'code/javascript', '.jsx': 'code/javascript', '.mjs': 'code/javascript',
  '.py': 'code/python',
  '.css': 'code/web', '.scss': 'code/web', '.html': 'code/web',
  '.json': 'code/config', '.yml': 'code/config', '.yaml': 'code/config', '.toml': 'code/config',
  '.sql': 'code/sql',
  '.md': 'prose/markdown', '.mdx': 'prose/markdown',
  '.txt': 'prose/text',
  '.tex': 'prose/latex',
}

/** Extension-only bucketing. Takes the path so callers read naturally;
 *  uses the last `.`-segment and discards everything before it. */
export function domainOf(path: string | undefined): DomainBucket {
  if (!path) return 'other'
  const i = path.lastIndexOf('.')
  if (i < 0) return 'other'
  return EXT_TO_BUCKET[path.slice(i).toLowerCase()] ?? 'other'
}

/**
 * Model identifiers that may cross, as a closed vocabulary.
 *
 * A `model` column has to cross, because a per-model survival scalar is
 * the entire commercial point of cross-model comparison (CLAUDE.md §4,
 * property 1). The first version of this gate constrained the field with
 * a regex instead, and `disclosure.test.ts` caught the hole in it the
 * same hour: a 62-character English sentence satisfies "printable, no
 * path punctuation, under 64 characters". Any regex permissive enough to
 * admit an unknown model's name is permissive enough to admit prose.
 *
 * So the field is an enum, not a pattern. `modelIdOf` maps a captured
 * agent marker onto a member of this list or onto nothing, which makes
 * `model` structurally incapable of carrying content, exactly like
 * `domain`. The cost is explicit and accepted: a model nobody has added
 * here is withheld rather than disclosed, so this list is maintenance.
 * That is the right direction for the failure to point.
 *
 * Matched longest-first at lookup, so a versioned identifier beats its
 * own family prefix and the disclosed row keeps the version granularity
 * a lab is actually buying.
 */
export const MODEL_VOCABULARY = [
  'claude-opus-5', 'claude-sonnet-5', 'claude-haiku-4-5', 'claude-opus-4', 'claude-sonnet-4', 'claude',
  'gpt-5-codex', 'gpt-5', 'gpt-4', 'codex', 'gpt',
  'gemini-3-pro', 'gemini',
  'grok', 'llama', 'mistral', 'deepseek', 'qwen',
  'copilot', 'cursor', 'aider', 'devin',
] as const

export type ModelId = (typeof MODEL_VOCABULARY)[number]

const MODEL_BY_LENGTH: readonly string[] = [...MODEL_VOCABULARY].sort((a, b) => b.length - a.length)

/**
 * Map a captured agent marker onto the vocabulary, or onto null.
 *
 * The markers this receives are not model identifiers. `pairfinder.ts`
 * sets `agentMarker` from the raw `Co-Authored-By` trailer value, so a
 * real one reads `Claude <noreply@anthropic.com>`: a display name and an
 * email address. Passing that through would put an address in the
 * aggregate, and withholding every git-adapter row would make the gate
 * useless against the only adapter that ships. Classifying it into a
 * closed set does neither.
 *
 * This is classification, not normalization. Nothing from the input
 * survives into the output. The returned value is a reference to a member
 * of `MODEL_VOCABULARY`, so no character the user supplied can ride along
 * with it.
 */
export function modelIdOf(raw: string | undefined): ModelId | null {
  if (!raw) return null
  const hay = raw.toLowerCase()
  for (const candidate of MODEL_BY_LENGTH) {
    if (hay.includes(candidate)) return candidate as ModelId
  }
  return null
}

export const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

/** The k-anonymity floor from the plan's own SQL comment. */
export const K_ANONYMITY_FLOOR = 5

/** Shingle width for the raw-text audit, in characters. */
export const SHINGLE_CHARS = 16

// ---------------------------------------------------------------------------
// The payload
// ---------------------------------------------------------------------------

/** One `survival_stats` row, field for field with the plan's SQL. */
export interface SurvivalStatsRow {
  domain: DomainBucket
  /** a member of MODEL_VOCABULARY, never a free-form string */
  model: ModelId
  /** Monday of the ISO week, `YYYY-MM-DD` — the plan's `week_start DATE` */
  weekStart: string
  /** distinct contributors behind this row; 1 on a single device */
  contributorCount: number
  /** survived chars / generated chars, to 4dp — the plan's NUMERIC(5,4) */
  survivalScalar: number
  sampleGenerations: number
}

export interface DisclosureBatch {
  schemaVersion: '0.1.0'
  scope: DisclosureScope
  rows: SurvivalStatsRow[]
}

export type WithheldReason =
  | { kind: 'scope-not-granted'; scope: DisclosureScope; detail: string }
  | { kind: 'record-forgotten'; recordId: string; detail: string }
  | { kind: 'model-id-rejected'; recordId: string; detail: string }

export interface DisclosureResult {
  /** null means nothing at all may be disclosed */
  batch: DisclosureBatch | null
  withheld: WithheldReason[]
}

/** Monday of the ISO week containing `iso`. */
export function weekStartOf(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '1970-01-01'
  const day = d.getUTCDay() // 0 = Sunday
  const back = day === 0 ? 6 : day - 1
  const monday = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - back))
  return monday.toISOString().slice(0, 10)
}

function round4(n: number): number {
  return Math.round(n * 10_000) / 10_000
}

function genTimestamp(gen: GenerationRecord, record: OutcomeRecord): string {
  return gen.timestamp ?? record.task.generatedAt
}

/**
 * Project consented records into the aggregate batch.
 *
 * Fail-closed in three places, in this order: the scope must be granted
 * or the whole batch is `null`; a tombstoned record contributes nothing;
 * a generation whose agent marker matches no member of
 * `MODEL_VOCABULARY` contributes
 * nothing. Each withholding is reported, because a gate that drops data
 * silently is indistinguishable to the user from a gate that leaks it.
 */
export function projectForMinor(
  records: OutcomeRecord[],
  consent: ConsentRecord,
  scope: DisclosureScope = 'minor-aggregate'
): DisclosureResult {
  const withheld: WithheldReason[] = []
  if (!isGranted(consent, scope)) {
    return {
      batch: null,
      withheld: [{
        kind: 'scope-not-granted',
        scope,
        detail: `consent for ${scope} reads "${consent.scopes[scope]?.state ?? 'withheld'}"; nothing is disclosable`,
      }],
    }
  }

  type Bucket = { survived: number; total: number; generations: number }
  const buckets = new Map<string, Bucket>()
  const keyOf = (d: DomainBucket, m: string, w: string) => `${d}\u0000${m}\u0000${w}`
  const rejectedModels = new Set<string>()

  for (const record of records) {
    if (isForgotten(consent, record.task.id)) {
      withheld.push({
        kind: 'record-forgotten',
        recordId: record.task.id,
        detail: 'tombstoned by `ursa forget`; excluded before any aggregation',
      })
      continue
    }
    for (const gen of record.generations) {
      const model = modelIdOf(gen.model)
      if (!model) {
        if (!rejectedModels.has(`${record.task.id}\u0000${gen.model}`)) {
          rejectedModels.add(`${record.task.id}\u0000${gen.model}`)
          withheld.push({
            kind: 'model-id-rejected',
            recordId: record.task.id,
            detail: 'the captured agent marker matches no member of MODEL_VOCABULARY, so its generations are withheld rather than disclosed under a guessed label',
          })
        }
        continue
      }
      const key = keyOf(domainOf(gen.filePath), model, weekStartOf(genTimestamp(gen, record)))
      const b = buckets.get(key) ?? { survived: 0, total: 0, generations: 0 }
      b.survived += gen.survivedChars
      b.total += gen.totalChars
      b.generations += 1
      buckets.set(key, b)
    }
  }

  const rows: SurvivalStatsRow[] = [...buckets.entries()]
    .map(([key, b]) => {
      const [domain, model, weekStart] = key.split('\u0000')
      return {
        domain: domain as DomainBucket,
        model: model as ModelId,
        weekStart,
        contributorCount: 1,
        survivalScalar: b.total > 0 ? round4(b.survived / b.total) : 0,
        sampleGenerations: b.generations,
      }
    })
    .sort((a, b) =>
      a.weekStart.localeCompare(b.weekStart) ||
      a.domain.localeCompare(b.domain) ||
      a.model.localeCompare(b.model))

  return { batch: { schemaVersion: '0.1.0', scope, rows }, withheld }
}

// ---------------------------------------------------------------------------
// Aggregation and the k-anonymity floor (what the ingest route owes)
// ---------------------------------------------------------------------------

export interface AggregateResult {
  rows: SurvivalStatsRow[]
  /** rows dropped for falling under the floor — the count is publishable, the rows are not */
  withheldRows: number
}

/**
 * Merge one batch per contributor into the price book, withholding any
 * row backed by fewer than `floor` contributors.
 *
 * Known approximation, stated rather than hidden. The plan's table
 * carries `survival_scalar` and `sample_generations` but no character
 * totals, so merging two contributors' scalars can only weight them by
 * generation count, and a generation is not a fixed number of
 * characters. The merged scalar is therefore a generation-weighted mean,
 * not the char-weighted ratio a single device computes. For a price book
 * read as a trend this is immaterial; for a scalar a lab pays against a
 * contract it is a defect in the schema, and the fix is a
 * `sample_chars BIGINT` column. Filed in docs/ideas.md on this branch.
 */
export function aggregate(
  batches: DisclosureBatch[],
  floor = K_ANONYMITY_FLOOR
): AggregateResult {
  type Merged = { row: SurvivalStatsRow; weighted: number; weight: number; contributors: number }
  const merged = new Map<string, Merged>()
  for (const batch of batches) {
    for (const r of batch.rows) {
      const key = `${r.domain}\u0000${r.model}\u0000${r.weekStart}`
      const m = merged.get(key)
      if (!m) {
        merged.set(key, {
          row: { ...r },
          weighted: r.survivalScalar * r.sampleGenerations,
          weight: r.sampleGenerations,
          contributors: r.contributorCount,
        })
        continue
      }
      m.weighted += r.survivalScalar * r.sampleGenerations
      m.weight += r.sampleGenerations
      m.contributors += r.contributorCount
      m.row.sampleGenerations += r.sampleGenerations
    }
  }

  const rows: SurvivalStatsRow[] = []
  let withheldRows = 0
  for (const m of merged.values()) {
    if (m.contributors < floor) { withheldRows++; continue }
    rows.push({
      ...m.row,
      contributorCount: m.contributors,
      survivalScalar: m.weight > 0 ? round4(m.weighted / m.weight) : 0,
    })
  }
  rows.sort((a, b) =>
    a.weekStart.localeCompare(b.weekStart) ||
    a.domain.localeCompare(b.domain) ||
    a.model.localeCompare(b.model))
  return { rows, withheldRows }
}

// ---------------------------------------------------------------------------
// The audit — the guarantee re-derived from outside the projection
// ---------------------------------------------------------------------------

export interface LeakFinding {
  kind: 'unpermitted-key' | 'unpermitted-string' | 'raw-text-shingle'
  /** JSON path into the payload, e.g. `rows[2].model` */
  path: string
  detail: string
}

const PERMITTED_KEYS = new Set([
  'schemaVersion', 'scope', 'rows',
  'domain', 'model', 'weekStart', 'contributorCount', 'survivalScalar', 'sampleGenerations',
])

const DOMAIN_SET: ReadonlySet<string> = new Set(DOMAIN_BUCKETS)
const MODEL_SET: ReadonlySet<string> = new Set(MODEL_VOCABULARY)

/**
 * The closed vocabulary, as exact membership plus one date pattern.
 * No length-bounded free-form case is left, which is the property that
 * makes check 1 strong: a string that must be one of thirty-two literals
 * or a `YYYY-MM-DD` date cannot carry a sentence, a path or an address.
 */
function isPermittedString(value: string): boolean {
  if (value === '0.1.0') return true
  if (value === 'minor-aggregate') return true
  if (DOMAIN_SET.has(value)) return true
  if (MODEL_SET.has(value)) return true
  return ISO_DATE.test(value)
}

/** Every raw string a record carries. The audit's definition of "raw". */
export function rawStringsOf(record: OutcomeRecord): string[] {
  const out: string[] = []
  for (const f of record.files) {
    out.push(f.path, f.text)
    for (const s of f.spans) {
      out.push(s.text)
      if (s.candidate) out.push(s.candidate.text)
      for (const d of s.diff ?? []) out.push(d.value)
    }
  }
  for (const g of record.generations) {
    out.push(g.text)
    if (g.filePath) out.push(g.filePath)
    for (const s of g.spans) out.push(s.text)
  }
  for (const c of record.conversations) {
    out.push(c.title)
    if (c.source) out.push(c.source)
    for (const p of c.prompts ?? []) out.push(p.text)
  }
  for (const l of record.signals?.correctionLoops ?? []) {
    out.push(l.theme, l.discoveredSpec, ...l.targetFiles)
  }
  for (const t of record.signals?.feedbackTranslations ?? []) out.push(t.complaint, t.mechanism)
  for (const r of record.signals?.regressions ?? []) out.push(r.brokenState, r.evidence)
  // Found 2026-10-06, writing the quote-grounding bound: these two carry
  // verbatim quotes of the user and were not in the audit's definition of
  // "raw". `oneShotCorrections[].text` is the one that matters, because it
  // is the only signal `ursa run` ever emits on a label-stage record, so the
  // single most-produced quote in the product was the one string the
  // disclosure audit never read.
  for (const c of record.signals?.oneShotCorrections ?? []) out.push(c.text)
  for (const g of record.signals?.defensiveGuardrails ?? []) out.push(g.text)
  return out.filter((s) => typeof s === 'string' && s.length > 0)
}

function normalize(s: string): string {
  return s.replace(/\s+/g, ' ').trim().toLowerCase()
}

function shinglesOf(text: string, width = SHINGLE_CHARS): Set<string> {
  const n = normalize(text)
  const out = new Set<string>()
  for (let i = 0; i + width <= n.length; i++) out.add(n.slice(i, i + width))
  return out
}

/**
 * Re-derive the no-raw-text guarantee from the outside. Knows nothing
 * about how the payload was built; takes the payload and the records it
 * was built from, and returns every finding. An empty array is the pass.
 */
export function auditBatch(
  batch: DisclosureBatch,
  records: OutcomeRecord[],
  shingleChars = SHINGLE_CHARS
): LeakFinding[] {
  const findings: LeakFinding[] = []

  // Check 1 — the closed vocabulary.
  const leafStrings: string[] = []
  const walk = (node: unknown, path: string): void => {
    if (typeof node === 'number' || typeof node === 'boolean' || node === null) return
    if (typeof node === 'string') {
      leafStrings.push(node)
      if (!isPermittedString(node)) {
        findings.push({
          kind: 'unpermitted-string',
          path,
          detail: `string value is outside the declared vocabulary: ${JSON.stringify(node.slice(0, 60))}`,
        })
      }
      return
    }
    if (Array.isArray(node)) {
      node.forEach((v, i) => walk(v, `${path}[${i}]`))
      return
    }
    if (typeof node === 'object') {
      for (const [k, v] of Object.entries(node as Record<string, unknown>)) {
        const child = path ? `${path}.${k}` : k
        if (!PERMITTED_KEYS.has(k)) {
          findings.push({ kind: 'unpermitted-key', path: child, detail: `key "${k}" is not a permitted field` })
        }
        walk(v, child)
      }
      return
    }
  }
  walk(batch, '')

  // Check 2 — raw-text shingles, independent of check 1.
  //
  // The corpus is the payload's leaf string VALUES, never its key names
  // and never its JSON scaffolding. That distinction is load-bearing
  // rather than tidiness: key names like `contributorCount` are this
  // module's own source text, so shingling the serialized JSON would
  // report a leak the moment someone runs `ursa run` over this very
  // repository and a generation's text contains `"contributorCount":1`.
  // Keys are not user data, so they are not part of what check 2 asks
  // about.
  //
  // Permitted values are deliberately NOT stripped, so this check still
  // sees every leaf. With `model` an enum, check 1 already stops a leak in
  // any field it knows about, and check 2's remaining job is the field
  // nobody has thought of yet: one added next quarter, or one whose value
  // is assembled rather than referenced. It costs microseconds and it
  // fails loudly, so it stays.
  //
  // Leaves are joined by a run of NUL characters at least one shingle
  // wide, so no shingle can span two values and manufacture a match.
  const separator = '\u0000'.repeat(shingleChars)
  const payload = leafStrings.map(normalize).join(separator)
  const payloadShingles = shinglesOf(payload, shingleChars)
  if (payloadShingles.size > 0) {
    for (const record of records) {
      for (const raw of rawStringsOf(record)) {
        for (const sh of shinglesOf(raw, shingleChars)) {
          if (payloadShingles.has(sh)) {
            findings.push({
              kind: 'raw-text-shingle',
              path: `record:${record.task.id}`,
              detail: `a ${shingleChars}-char window of this record's raw text appears in the payload: ${JSON.stringify(sh)}`,
            })
            break
          }
        }
      }
    }
  }

  return findings
}
