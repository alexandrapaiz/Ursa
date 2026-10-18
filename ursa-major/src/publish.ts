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

import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { SAFE_RECORD_ID, listRecordIds, loadRecord } from './store'
import { renderViewer } from './viewer'
import type { OutcomeRecord, ResolverIdentity, SpanClass } from './types'

/**
 * Version of the `index.json` contract below, independent of
 * `OutcomeRecord.schemaVersion`. The index can gain a field without a
 * record changing, and a record can change without the index moving, so
 * a consumer pinning one must not be told about the other.
 */
export const PUBLISHED_INDEX_VERSION = '0.1.0'

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
}

export interface PublishedIndex {
  indexVersion: typeof PUBLISHED_INDEX_VERSION
  /** When the site was built, which is not when any record was resolved. */
  publishedAt: string
  /** `owner/name` when the publisher stated it, else null. Never inferred from a path. */
  repository: string | null
  /** Record schema versions present, so a consumer can refuse a set it cannot read. */
  recordSchemaVersions: string[]
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
  finalFiles: number
  filePaths: string[]
  finalChars: number
  generations: number
  generationChars: number
  conversations: number
  prompts: number
  promptChars: number
}

export function manifestFor(records: OutcomeRecord[]): DisclosureManifest {
  const paths = new Set<string>()
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
      for (const p of c.prompts ?? []) {
        prompts += 1
        promptChars += p.text.length
      }
    }
  }
  return {
    records: records.length,
    recordIds: records.map((r) => r.task.id),
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
  lines.push('The second and third lines are text that has never been public before,')
  lines.push('even when the repository is. Nothing here is aggregated, redacted or')
  lines.push('withheld: a published record is the record.')
  return lines.join('\n')
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
   * Record ids found in `.ursa/records/` and skipped, with the reason.
   * Reported rather than thrown: one unreadable file must not stop a
   * publication of fifty good records, and a silent skip would publish a
   * site that claims to be the project's records and is not.
   */
  skipped: { id: string; reason: 'unsafe-id' | 'unreadable' }[]
}

export class DisclosureNotAcknowledged extends Error {
  constructor(readonly manifest: DisclosureManifest) {
    super('publish refused: the disclosure above was not acknowledged')
    this.name = 'DisclosureNotAcknowledged'
  }
}

/** Every record on disk for this project, in id order, with the unreadable ones named. */
export function loadPublishable(projectPath: string): {
  records: OutcomeRecord[]
  skipped: PublishResult['skipped']
} {
  const records: OutcomeRecord[] = []
  const skipped: PublishResult['skipped'] = []
  for (const id of listRecordIds(projectPath)) {
    // Checked here and not left to `loadRecord`, which returns null for an
    // unsafe id and for an absent file alike. An id becomes a path segment
    // in `recordHref` and therefore a URL, so the refusal needs to be
    // visible in the result rather than folded into "unreadable".
    if (!SAFE_RECORD_ID.test(id)) { skipped.push({ id, reason: 'unsafe-id' }); continue }
    let record: OutcomeRecord | null = null
    try {
      record = loadRecord(projectPath, id)
    } catch {
      record = null
    }
    if (!record) { skipped.push({ id, reason: 'unreadable' }); continue }
    records.push(record)
  }
  return { records, skipped }
}

export function publish(opts: PublishOptions): PublishResult {
  const { records, skipped } = loadPublishable(opts.projectPath)
  const disclosed = manifestFor(records)
  if (!opts.acknowledged) throw new DisclosureNotAcknowledged(disclosed)

  const index: PublishedIndex = {
    indexVersion: PUBLISHED_INDEX_VERSION,
    publishedAt: opts.publishedAt ?? new Date().toISOString(),
    repository: opts.repository ?? null,
    recordSchemaVersions: [...new Set(records.map((r) => r.schemaVersion))].sort(),
    records: records.map(summarize),
    disclosed,
  }

  const recordsDir = join(opts.outDir, RECORDS_DIR)
  mkdirSync(recordsDir, { recursive: true })
  const written: string[] = []
  const write = (path: string, body: string) => {
    writeFileSync(path, body)
    written.push(path)
  }
  for (const record of records) {
    write(join(recordsDir, `${record.task.id}.html`), renderViewer(record))
    write(join(recordsDir, `${record.task.id}.json`), JSON.stringify(record, null, 2) + '\n')
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
  return { written, index, skipped }
}

function summarize(record: OutcomeRecord): PublishedRecordSummary {
  const chars = {} as Record<SpanClass, number>
  const spans = {} as Record<SpanClass, number>
  for (const [cls, stat] of Object.entries(record.stats.byClass)) {
    chars[cls as SpanClass] = stat.chars
    spans[cls as SpanClass] = stat.spans
  }
  const by = record.task.resolvedBy
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
  const rows = index.records.map((r) => {
    const verbatim = r.charsByClass.survived_verbatim ?? 0
    const mutated = r.charsByClass.survived_mutated ?? 0
    const none = r.charsByClass.no_generation_provenance ?? 0
    return `<tr>
  <td class="id"><a href="${escapeAttr(r.html)}">${escapeHtml(r.id)}</a></td>
  <td class="num">${n(r.finalChars)}</td>
  <td class="num verbatim">${pct(verbatim, r.finalChars)}</td>
  <td class="num mutated">${pct(mutated, r.finalChars)}</td>
  <td class="num human">${pct(none, r.finalChars)}</td>
  <td class="when">${escapeHtml(r.generatedAt.slice(0, 10))}</td>
  <td class="raw"><a href="${escapeAttr(r.json)}">JSON</a></td>
</tr>`
  }).join('\n')

  const empty = `<p class="empty">This site has no records in it. Either no merge has produced
  one yet, or every work unit in the merge window fell below the
  <code>min-chars</code> floor. An empty set is reported rather than
  rendered as a zero, because the two are different claims.</p>`

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
  <th>Resolved</th><th>Raw</th>
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
record's page carries both denominators.</p>`}

<div class="disclosure">
  <h2>What is on this site</h2>
  <p>Every record here carries raw text, not a summary: ${n(d.finalChars)} characters of
  finished work across ${n(d.finalFiles)} file${d.finalFiles === 1 ? '' : 's'}, ${n(d.generationChars)} characters of model
  output across ${n(d.generations)} generation${d.generations === 1 ? '' : 's'}, and ${n(d.promptChars)} characters of the
  publisher's own messages to the model across ${n(d.prompts)} message${d.prompts === 1 ? '' : 's'}. Whoever built this
  site was shown those counts and the file paths, and agreed to them.</p>
</div>

<footer>
  Built by Ursa Major's resolver from this repository's own git history, on
  the repository owner's own runner. Index contract version ${escapeHtml(index.indexVersion)};
  record schema ${escapeHtml(index.recordSchemaVersions.join(', ') || 'none')}. The machine-readable form
  of this page is <a href="${INDEX_JSON}">${INDEX_JSON}</a>.
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
