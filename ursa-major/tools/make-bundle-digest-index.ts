// Generate, check, or query the resolver bundle index. The reasoning for
// the index itself is in tools/bundle-digest-index.ts; this file is the
// command line around it.
//
//   npm run provenance:bundles                      # write both files
//   npm run provenance:bundles:check                # fail if either drifted
//   npx tsx tools/make-bundle-digest-index.ts --lookup d325430704   # one row
//
// Ledger: "Every customer record names a resolver by a digest nobody can
// look up" (docs/ideas.md, 2026-10-16 second run).

import { execFileSync } from 'node:child_process'
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import {
  BUNDLE_PATH, INDEX_JSON, INDEX_MD,
  buildIndex, historyUnavailable, renderJson, renderMarkdown, repoRoot,
  type BundleDigestIndex,
} from './bundle-digest-index'

const root = repoRoot()
if (root === null) {
  console.error('not inside a git work tree, so there is no history to index')
  process.exit(2)
}

const args = process.argv.slice(2)
const lookupAt = args.indexOf('--lookup')

function read(path: string): string {
  try { return readFileSync(path, 'utf8') } catch { return '' }
}

// --lookup reads the COMMITTED index rather than rebuilding, because it
// answers the question a consumer of this repository asks and a consumer
// has the file, not the history. A stale answer here is a bug in the
// check below, which is where staleness is supposed to be caught.
if (lookupAt !== -1) {
  const prefix = (args[lookupAt + 1] ?? '').toLowerCase()
  if (!/^[0-9a-f]{4,64}$/.test(prefix)) {
    console.error('usage: --lookup <at least 4 hex characters of the digest>')
    process.exit(2)
  }
  const text = read(join(root, INDEX_JSON))
  if (!text) {
    console.error(`${INDEX_JSON} is missing. Run: npm run provenance:bundles`)
    process.exit(2)
  }
  const index = JSON.parse(text) as BundleDigestIndex
  const hits = index.rows.filter((r) => r.sha256.startsWith(prefix))
  if (hits.length === 0) {
    console.error(`no version of ${BUNDLE_PATH} has a SHA-256 starting ${prefix}.`)
    console.error(`${index.rows.length} versions are indexed, from ${index.rows[0]?.introducedBy[0]?.date} to ${index.rows[index.rows.length - 1]?.introducedBy[0]?.date}.`)
    console.error('A digest with no row is either from a build newer than this checkout, or from a fork.')
    process.exit(1)
  }
  for (const r of hits) {
    console.log(`digest   ${r.digest}  (sha256 ${r.sha256})`)
    console.log(`bytes    ${r.bytes.toLocaleString('en-US')}`)
    console.log(`blob     ${r.blob}   # git cat-file blob ${r.blob}`)
    for (const c of r.introducedBy) {
      console.log(`commit   ${c.commit}`)
      console.log(`date     ${c.date}`)
      console.log(`subject  ${c.subject}`)
    }
  }
  process.exit(0)
}

const why = historyUnavailable(root)
if (why !== null) {
  // Exit 0 on purpose. This is the runner-with-a-shallow-checkout case,
  // where the index cannot be verified and nothing about it is known to
  // be wrong; a failure here would be a false one. The reason is printed
  // so a skip is never silent.
  console.log(`skipped: ${why}`)
  process.exit(0)
}

const index = buildIndex(root)
const files: Array<[string, string]> = [
  [INDEX_JSON, renderJson(index)],
  [INDEX_MD, renderMarkdown(index)],
]

if (args.includes('--check')) {
  let drifted = 0
  for (const [rel, content] of files) {
    if (read(join(root, rel)) !== content) {
      console.error(`drifted: ${rel}`)
      drifted++
    }
  }
  if (drifted > 0) {
    const head = index.rows.find((r) => r.introducedBy.some((c) => c.commit === headCommit()))
    console.error(`${drifted} of ${files.length} files differ from what this repository's history says.`)
    if (head) console.error(`HEAD rebuilt the bundle (digest ${head.digest}), so this is the expected failure between the two commits.`)
    console.error('Run: npm run provenance:bundles')
    process.exit(1)
  }
  console.log(`${INDEX_JSON} and ${INDEX_MD} match history: ${index.rows.length} versions of ${BUNDLE_PATH}.`)
  process.exit(0)
}

for (const [rel, content] of files) {
  const abs = join(root, rel)
  mkdirSync(dirname(abs), { recursive: true })
  writeFileSync(abs, content)
}
console.log(`wrote ${INDEX_JSON} and ${INDEX_MD}: ${index.rows.length} versions of ${BUNDLE_PATH}, oldest ${index.rows[0].introducedBy[0].date}, newest ${index.rows[index.rows.length - 1].introducedBy[0].date}.`)

function headCommit(): string {
  try {
    return execFileSync('git', ['-C', root as string, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim()
  } catch {
    return ''
  }
}
