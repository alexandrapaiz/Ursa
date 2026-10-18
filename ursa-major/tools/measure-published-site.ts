// What a reader pays for a published record, and whether the index tells
// the truth about the bytes beside it.
//
// WHY THIS TOOL EXISTS. `tools/measure-index-page.ts` measures the set
// page's LAYOUT, in a real browser, at real viewport widths, against a
// site built from this repository's own fixture record. That answers one
// question — is the page wider than the phone — and it needs Playwright
// and a browser binary to answer it.
//
// It cannot answer the other question, which is what the page weighs.
// The set page built from three fixture records is 14KB and the heaviest
// record page built from this repository's own real history is 2,568,965
// bytes, so a measurement taken on the fixture does not describe the
// product. Nobody had weighed a real one until 2026-10-18, which is the
// day this repository published its own records for the first time.
//
// It also answers a question nothing else asks. `PublishedRecordSummary`
// gained `bytes` and `sha256` the same morning so that a viewer fetching
// one record could say whether it got the bytes the index was built
// against. Those two fields are a claim the publisher makes about files
// in the same directory, and until now no check compared the claim with
// the file. A publish bug that wrote the index before the record, or
// truncated one, would surface first as the frontend viewer's integrity
// banner saying "mismatch" to a stranger, which is the worst place to
// learn it.
//
// So this tool reads a site that already exists on disk and reports
// three numbers per page, each of which explains a different cost, plus
// one verdict per record:
//
//   transfer   gzip-compressed bytes, which is what GitHub Pages serves
//              over the wire and therefore what the reader waits for
//   parse      bytes on disk, which is what the browser must decompress,
//              parse and hold, and is the number a phone feels
//   duplicate  how much of the HTML page is the record's own JSON,
//              embedded so the page needs no network; the price of the
//              self-containment `src/publish.ts` chose on purpose
//
// THE NUMBERS ARE REPORTED BEFORE THEY ARE JUDGED. Both budget flags are
// off unless passed, because a budget invented here would be this file's
// opinion and the report is a measurement. The two defaults suggested in
// the usage below are the ones docs/design/pages-dogfood.md argues for,
// where the argument can be read and disagreed with.
//
// Usage, from the package root:
//   npx tsx tools/measure-published-site.ts --site <dir>
//   npx tsx tools/measure-published-site.ts --site _site --max-transfer-kb 512
//   npx tsx tools/measure-published-site.ts --site _site --out weights.txt
//
// Build the site first, which on this repository is:
//   node dist/ursa.cjs run .. --max-pair-distance 400 --agent-identity agents.epito.me
//   node dist/ursa.cjs publish .. --out /tmp/site --repo alexandrapaiz/Ursa --yes
//
// Exit status:
//   0  measured, and every claim in index.json matched the bytes on disk
//   1  a claim was false, or a budget that was passed was exceeded
//   2  the invocation was wrong, or the directory is not a published site
//
// NO DEPENDENCY IS ADDED BY THIS FILE. `node:zlib` ships with Node and
// `gzipSync` at level 9 is what a static host's own compressor does, so
// the transfer figure needs no browser, no network and no install. That
// is deliberate: the layout tool cannot run on a bare runner without
// `npx playwright install --with-deps chromium`, and the weight of a page
// is the half of the measurement that should never be blocked on that.

import { createHash } from 'node:crypto'
import { existsSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { gzipSync } from 'node:zlib'
import { PUBLISHED_INDEX_VERSION, type PublishedIndex } from '../src/publish'

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`)
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : undefined
}

const site = arg('site')
if (!site) {
  console.error('usage: npx tsx tools/measure-published-site.ts --site <dir>')
  console.error('         [--max-transfer-kb N] [--max-parse-mb N] [--out <file>]')
  console.error('')
  console.error('<dir> is a directory written by `ursa publish --out <dir> --yes`.')
  process.exit(2)
}
const indexPath = join(site, 'index.json')
if (!existsSync(indexPath)) {
  console.error(`${indexPath} does not exist, so ${site} is not a published site.`)
  console.error('Write one first with: node dist/ursa.cjs publish <project> --out ' + site + ' --yes')
  process.exit(2)
}

const index: PublishedIndex = JSON.parse(readFileSync(indexPath, 'utf8'))

/** Bytes on disk, and bytes after the compression a static host applies. */
function weigh(path: string): { parse: number; transfer: number; body: Buffer } {
  const body = readFileSync(path)
  return { parse: statSync(path).size, transfer: gzipSync(body, { level: 9 }).length, body }
}

const kib = (n: number) => `${(n / 1024).toFixed(1)} KiB`
const mib = (n: number) => `${(n / (1024 * 1024)).toFixed(2)} MiB`

const lines: string[] = []
const say = (line: string) => { lines.push(line); console.log(line) }

say(`site: ${site}`)
say(`index contract ${index.indexVersion}${
  index.indexVersion === PUBLISHED_INDEX_VERSION ? '' : ` (this build writes ${PUBLISHED_INDEX_VERSION})`
}`)
say(`published ${index.publishedAt}, repository ${index.repository ?? 'not stated'}`)
say(`${index.records.length} record${index.records.length === 1 ? '' : 's'}`)
say('')

// The set page first, on its own, because it is the only page a stranger
// is guaranteed to load and the only one whose weight is paid by every
// reader rather than by whoever opens that record.
const setPage = weigh(join(site, 'index.html'))
const setJson = weigh(indexPath)
say('What every reader pays, before opening any record:')
say(`  index.html   transfer ${kib(setPage.transfer).padStart(10)}   parse ${kib(setPage.parse).padStart(10)}`)
say(`  index.json   transfer ${kib(setJson.transfer).padStart(10)}   parse ${kib(setJson.parse).padStart(10)}`)
say('')

interface Row {
  id: string
  transfer: number
  parse: number
  jsonParse: number
  duplicate: number
  problems: string[]
}

const rows: Row[] = []
let claimsFalse = 0

for (const r of index.records) {
  const problems: string[] = []
  const htmlPath = join(site, r.html)
  const jsonPath = join(site, r.json)
  if (!existsSync(htmlPath)) problems.push(`index names ${r.html} and no such file exists`)
  if (!existsSync(jsonPath)) problems.push(`index names ${r.json} and no such file exists`)
  if (problems.length > 0) {
    claimsFalse += problems.length
    rows.push({ id: r.id, transfer: 0, parse: 0, jsonParse: 0, duplicate: 0, problems })
    continue
  }

  const html = weigh(htmlPath)
  const json = weigh(jsonPath)

  // The two claims the index makes about the record file beside it. Both
  // are about `records/<id>.json` and neither is about the HTML page, so
  // the HTML's own size is reported and never compared.
  if (typeof r.bytes === 'number' && r.bytes !== json.parse) {
    problems.push(`index claims ${r.bytes} bytes for ${r.json}; the file is ${json.parse}`)
  }
  if (typeof r.sha256 === 'string' && r.sha256.length > 0) {
    const actual = createHash('sha256').update(json.body).digest('hex')
    if (actual !== r.sha256) {
      problems.push(
        `index claims sha256 ${r.sha256.slice(0, 16)}… for ${r.json}; the file hashes to ${actual.slice(0, 16)}…`,
      )
    }
  }
  claimsFalse += problems.length

  // How much of the page is the record embedded in it. Measured from the
  // script element rather than estimated from the JSON file's size,
  // because the two are not the same bytes: `src/publish.ts` embeds the
  // record compactly and writes the sidecar file indented.
  const text = html.body.toString('utf8')
  const open = text.indexOf('<script id="record" type="application/json">')
  const close = open < 0 ? -1 : text.indexOf('</script>', open)
  const duplicate = open < 0 || close < 0
    ? 0
    : Buffer.byteLength(text.slice(text.indexOf('>', open) + 1, close), 'utf8')

  rows.push({ id: r.id, transfer: html.transfer, parse: html.parse, jsonParse: json.parse, duplicate, problems })
}

rows.sort((a, b) => b.parse - a.parse)

say('Per record page, heaviest first:')
say('  transfer     parse    embedded record   record id')
for (const row of rows) {
  const pct = row.parse > 0 ? Math.round((row.duplicate / row.parse) * 100) : 0
  say(
    `  ${kib(row.transfer).padStart(9)} ${mib(row.parse).padStart(9)}   ` +
    `${kib(row.duplicate).padStart(9)} (${String(pct).padStart(2)}%)   ${row.id}`,
  )
  for (const p of row.problems) say(`      FALSE CLAIM: ${p}`)
}
say('')

const totalTransfer = setPage.transfer + setJson.transfer + rows.reduce((a, r) => a + r.transfer + 0, 0)
const totalParse = setPage.parse + setJson.parse + rows.reduce((a, r) => a + r.parse + r.jsonParse, 0)
const heaviest = rows[0]

say(`Whole site on disk: ${mib(totalParse)} across ${index.records.length * 2 + 3} files.`)
say(`Sum of every page's transfer, if one reader opened all of them: ${kib(totalTransfer)}.`)
if (heaviest) {
  say(
    `Heaviest single page: ${kib(heaviest.transfer)} over the wire, ${mib(heaviest.parse)} to parse, ` +
    `${Math.round((heaviest.duplicate / heaviest.parse) * 100)}% of it the record embedded for self-containment.`,
  )
}
say('')

say(claimsFalse === 0
  ? `Every byte count and digest in index.json matched the file it describes (${index.records.length} record${index.records.length === 1 ? '' : 's'} checked).`
  : `${claimsFalse} claim${claimsFalse === 1 ? '' : 's'} in index.json did not match the bytes on disk. A viewer that checks integrity will tell a stranger this site is broken.`)

let overBudget = 0
const maxTransferKb = arg('max-transfer-kb')
if (maxTransferKb) {
  const limit = Number(maxTransferKb) * 1024
  const over = rows.filter((r) => r.transfer > limit)
  for (const r of over) say(`OVER TRANSFER BUDGET: ${r.id} is ${kib(r.transfer)}, budget ${maxTransferKb} KiB`)
  overBudget += over.length
  if (over.length === 0) say(`Every page is within the ${maxTransferKb} KiB transfer budget.`)
}
const maxParseMb = arg('max-parse-mb')
if (maxParseMb) {
  const limit = Number(maxParseMb) * 1024 * 1024
  const over = rows.filter((r) => r.parse > limit)
  for (const r of over) say(`OVER PARSE BUDGET: ${r.id} is ${mib(r.parse)}, budget ${maxParseMb} MiB`)
  overBudget += over.length
  if (over.length === 0) say(`Every page is within the ${maxParseMb} MiB parse budget.`)
}

const report = arg('out')
if (report) writeFileSync(report, lines.join('\n') + '\n')

process.exit(claimsFalse > 0 || overBudget > 0 ? 1 : 0)
