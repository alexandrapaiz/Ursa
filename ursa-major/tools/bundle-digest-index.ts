// Turn `task.resolvedBy.digest` into something a reader can look up.
//
// WHAT THE PROBLEM IS. Every record written on a customer's runner
// carries a `bundle_digest` basis, because GitHub ships an action as a
// tarball and there is no git work tree under it for `resolverIdentity()`
// in src/resolver-identity.ts to read a commit from. That module's own
// header sells the distinction: "A `git_commit` basis is a pointer into a
// public history. A `bundle_digest` basis is a content hash with no
// history behind it." So the basis a buyer can audit is the one this
// repository uses on itself, and the basis with nothing behind it is the
// one that ships. The history exists; it was never published.
//
// WHAT THIS BUILDS. One row per distinct version of `dist/ursa.cjs` that
// has ever existed in this repository's history, keyed by the same 16
// hexadecimal characters the record carries, naming the commit that
// introduced it and when. A buyer holding
// `{ basis: "bundle_digest", digest: "d32543070474cc28" }` reads one row
// and gets a commit, a date, a byte count and a blob object id they can
// `git cat-file` themselves. Nothing here is hand-maintained, for the
// reason `BOUND_COUNT` in src/invariants.ts is derived: the two numbers
// that went stale in this repository are both numbers a person typed.
//
// WHY THE OBVIOUS WALK IS WRONG, which is worth stating because it is the
// walk the ledger entry that asked for this file proposed:
//
//     git log --format=%H --follow -- ursa-major/dist/ursa.cjs
//
// returns 17 commits today. The exhaustive sweep below returns 18 distinct
// bundles. The missing one is `61b24bb11ec7d243`, introduced by
// `e27bc68` ("Reconcile the resolver-Action branch onto main"), a merge
// whose resolution differs from every parent. Default history
// simplification keeps such a commit; `--follow` turns on rename
// detection and, with it, a simplification that dropped it. It was on
// `main` for six minutes on 2026-10-08, which is six minutes in which a
// consumer pinned to `@main` could have run it and been stamped with a
// digest no index built that way would hold.
//
// WHY THE SWEEP IS EXHAUSTIVE RATHER THAN A LOG WALK. `git rev-list HEAD`
// is 624 commits today and reading one tree entry from each costs a
// second, because it is two `git` processes and not 624 (see
// `blobsAtPath`). At that price there is no reason to trust a
// simplification rule about which commits "really" changed the file: the
// index is built from every commit reachable from HEAD, so completeness
// is a property of the construction instead of a claim in a comment.
//
// WHY A COMMIT CANNOT INDEX ITS OWN BUNDLE, which sets the one rule a
// contributor has to follow. A row names the commit that introduced the
// blob, and a commit's own hash does not exist until it is made, so the
// commit that rebuilds `dist/ursa.cjs` can never be the commit that
// indexes it. The discipline is therefore two commits: rebuild the bundle
// in one, run `npm run provenance:bundles` and commit the index in the
// next, both in the same pull request. `npm test` fails in between and
// says exactly that, which is the whole point of the check. This is the
// same recursion `build/bundle.mjs` avoids by refusing to bake HEAD into
// the bundle, met from the other side.

import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'

/** Path of the resolver artifact, relative to the repository root. */
export const BUNDLE_PATH = 'ursa-major/dist/ursa.cjs'

/** Where the generated index is written, relative to the repository root. */
export const INDEX_JSON = 'docs/provenance/bundle-digests.json'
export const INDEX_MD = 'docs/provenance/bundle-digests.md'

/** A commit, as a row names one. */
export interface IndexCommit {
  /** Full 40-character commit object id. */
  commit: string
  /** Committer date, normalized to UTC so the index does not depend on
   *  the timezone of the machine that made the commit. */
  date: string
  /** The commit's subject line, so a row is readable without a checkout. */
  subject: string
}

/** One version of the bundle. */
export interface BundleDigestRow {
  /** The 16 lowercase hexadecimal characters `task.resolvedBy.digest`
   *  carries, which is `sha256.slice(0, 16)`. */
  digest: string
  /** SHA-256 of the file's bytes in full, the same hash
   *  `npm run bundle:check` prints. */
  sha256: string
  /** Git blob object id: `git cat-file blob <blob>` prints this bundle. */
  blob: string
  /** Size of the bundle in bytes. */
  bytes: number
  /** Every commit that holds this blob at `BUNDLE_PATH` while no parent
   *  of it does. Usually one. An array because a revert can reintroduce
   *  an earlier bundle, and a row that hid the second introduction would
   *  be answering "when did this code run" with half the answer. */
  introducedBy: IndexCommit[]
}

export interface BundleDigestIndex {
  /** Regeneration instruction, carried in the file so a reader who opens
   *  the JSON first does not have to find this module. */
  generatedBy: string
  /** The artifact indexed, relative to the repository root. */
  path: string
  /** Oldest introduction first. */
  rows: BundleDigestRow[]
}

function git(root: string, args: string[]): string {
  return execFileSync('git', ['-C', root, ...args], {
    encoding: 'utf8',
    maxBuffer: 256 * 1024 * 1024,
    stdio: ['ignore', 'pipe', 'pipe'],
  })
}

/**
 * The repository root, or null when this process is not inside a git work
 * tree. Null is a real answer: the tarball a customer's runner unpacks
 * has no git history in it, and a tool that cannot read history should
 * say so rather than report an empty index as the truth.
 */
export function repoRoot(cwd: string = process.cwd()): string | null {
  try {
    return execFileSync('git', ['-C', cwd, 'rev-parse', '--show-toplevel'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim()
  } catch {
    return null
  }
}

/**
 * Why this checkout cannot produce a trustworthy index, or null when it
 * can.
 *
 * The case this exists for is a shallow clone. `actions/checkout`
 * defaults to `fetch-depth: 1`, and in a one-commit checkout
 * `git rev-list HEAD` returns one commit, so the sweep would honestly
 * report one bundle and the comparison against the committed index would
 * fail with seventeen spurious differences. A skip that names its reason
 * is the correct outcome there; a failure is not.
 */
export function historyUnavailable(root: string): string | null {
  let shallow: string
  try {
    shallow = git(root, ['rev-parse', '--is-shallow-repository']).trim()
  } catch (e) {
    return `git could not read this directory as a repository: ${String(e)}`
  }
  if (shallow === 'true') {
    return 'this is a shallow clone, so the commits the index names are not all present (clone with fetch-depth: 0)'
  }
  try {
    git(root, ['cat-file', '-e', `HEAD:${BUNDLE_PATH}`])
  } catch {
    return `HEAD does not carry ${BUNDLE_PATH}`
  }
  return null
}

/**
 * Commit object id to (parents, date, subject), for every commit
 * reachable from HEAD.
 *
 * Two `git` processes for the whole history rather than one per commit:
 * `rev-list --parents` gives the graph and `log --format` gives the
 * fields, both as one stream each. NUL-separated fields because a commit
 * subject may contain anything a person typed, including a tab.
 */
function commitTable(root: string): Map<string, { parents: string[]; date: string; subject: string }> {
  const out = new Map<string, { parents: string[]; date: string; subject: string }>()
  for (const line of git(root, ['rev-list', '--parents', 'HEAD']).split('\n')) {
    if (!line) continue
    const [sha, ...parents] = line.trim().split(' ')
    out.set(sha, { parents, date: '', subject: '' })
  }
  for (const entry of git(root, ['log', '--format=%H%x00%cI%x00%s%x00', 'HEAD']).split('\0\n')) {
    if (!entry.trim()) continue
    const [sha, date, subject] = entry.replace(/^\n/, '').split('\0')
    const row = out.get(sha)
    // `toISOString` rather than git's `--date=iso-strict-local`, which
    // needs a TZ in the environment and a git new enough for the `-local`
    // suffix. The offset is already in `%cI`; Date does the arithmetic.
    if (row) { row.date = new Date(date).toISOString(); row.subject = subject }
  }
  return out
}

/**
 * Commit object id to the blob object id at `BUNDLE_PATH` in that
 * commit's tree, for every commit that has the file.
 *
 * One `git cat-file --batch-check` process for all 624 lookups. The
 * obvious loop of `git rev-parse <commit>:<path>` is 624 processes and
 * about a second of pure spawn overhead; the batch form reads the same
 * trees in one, and `missing` on stdout is how it reports a commit from
 * before the file existed.
 */
function blobsAtPath(root: string, commits: Iterable<string>): Map<string, string> {
  const queries: string[] = []
  for (const c of commits) queries.push(`${c}:${BUNDLE_PATH}`)
  const stdout = execFileSync('git', ['-C', root, 'cat-file', '--batch-check'], {
    input: queries.join('\n') + '\n',
    encoding: 'utf8',
    maxBuffer: 256 * 1024 * 1024,
    stdio: ['pipe', 'pipe', 'ignore'],
  })
  const out = new Map<string, string>()
  const lines = stdout.split('\n')
  for (let i = 0; i < queries.length; i++) {
    const fields = (lines[i] ?? '').split(' ')
    // `<oid> blob <size>` for a hit; `<query> missing` otherwise.
    if (fields.length === 3 && fields[1] === 'blob') out.set(queries[i].split(':')[0], fields[0])
  }
  return out
}

/** SHA-256 of a blob's bytes, hashed as bytes and not as text, because
 *  that is what `resolverIdentity()` hashes: `readFileSync(scriptPath)`
 *  with no encoding returns a Buffer. */
function blobSha256(root: string, blob: string): { sha256: string; bytes: number } {
  const buf = execFileSync('git', ['-C', root, 'cat-file', 'blob', blob], {
    maxBuffer: 256 * 1024 * 1024,
    stdio: ['ignore', 'pipe', 'ignore'],
  })
  return { sha256: createHash('sha256').update(buf).digest('hex'), bytes: buf.length }
}

/**
 * Build the index from the repository at `root`.
 *
 * Throws if history is unavailable; call `historyUnavailable` first.
 */
export function buildIndex(root: string): BundleDigestIndex {
  const commits = commitTable(root)
  const blobs = blobsAtPath(root, commits.keys())

  // A commit introduces a blob when it holds it and no parent of it does.
  // Stated over parents rather than over dates, so a merge that resolves
  // the file to something neither side had is an introduction (that is
  // `e27bc68`, the commit `--follow` drops) while a merge that simply
  // carries a parent's bundle forward is not.
  const byBlob = new Map<string, IndexCommit[]>()
  for (const [sha, blob] of blobs) {
    const meta = commits.get(sha)
    if (!meta) continue
    if (meta.parents.some((p) => blobs.get(p) === blob)) continue
    const list = byBlob.get(blob) ?? []
    list.push({ commit: sha, date: meta.date, subject: meta.subject })
    byBlob.set(blob, list)
  }

  const rows: BundleDigestRow[] = []
  for (const [blob, intro] of byBlob) {
    const { sha256, bytes } = blobSha256(root, blob)
    intro.sort((a, b) => (a.date === b.date ? a.commit.localeCompare(b.commit) : a.date.localeCompare(b.date)))
    rows.push({ digest: sha256.slice(0, 16), sha256, blob, bytes, introducedBy: intro })
  }
  // Oldest introduction first, ties broken by digest so the file is a
  // function of history alone and not of Map insertion order.
  rows.sort((a, b) => {
    const d = a.introducedBy[0].date.localeCompare(b.introducedBy[0].date)
    return d !== 0 ? d : a.digest.localeCompare(b.digest)
  })

  return {
    generatedBy: 'ursa-major/tools/make-bundle-digest-index.ts (npm run provenance:bundles)',
    path: BUNDLE_PATH,
    rows,
  }
}

/** The JSON file's exact bytes, so writing and checking cannot disagree
 *  about whitespace. */
export function renderJson(index: BundleDigestIndex): string {
  return JSON.stringify(index, null, 2) + '\n'
}

const MD_HEADER = `<!-- GENERATED by ursa-major/tools/make-bundle-digest-index.ts. Do not edit.
     Regenerate with: cd ursa-major && npm run provenance:bundles -->

# Which resolver wrote this record

A record resolved on a GitHub runner carries a resolver identity with no
commit in it:

    "resolvedBy": { "basis": "bundle_digest", "digest": "d32543070474cc28" }

That is the SHA-256 of the one-file resolver the Action ran, truncated to
sixteen characters. GitHub downloads an action as a tarball rather than
cloning it, so the running code has no git history beside it to name a
commit from. This table is the missing half: look the digest up here and
it becomes a commit in a public repository, with a date and a size.

Every row is derived. Nothing in this file is typed by hand, and
\`npm test\` fails if it stops matching the repository's history.
`

/** The markdown file's exact bytes. */
export function renderMarkdown(index: BundleDigestIndex): string {
  const lines: string[] = [MD_HEADER]
  lines.push(`Artifact indexed: \`${index.path}\`. Versions: ${index.rows.length}.\n`)
  lines.push('| `task.resolvedBy.digest` | Introduced by | Committed (UTC) | Bytes | What changed |')
  lines.push('|---|---|---|---|---|')
  for (const r of index.rows) {
    const intro = r.introducedBy
      .map((c) => `\`${c.commit.slice(0, 7)}\``)
      .join(', ')
    const dates = r.introducedBy.map((c) => c.date.replace('T', ' ').replace('.000Z', '')).join(', ')
    const subject = r.introducedBy.map((c) => c.subject.replace(/\|/g, '\\|')).join(' / ')
    lines.push(`| \`${r.digest}\` | ${intro} | ${dates} | ${r.bytes.toLocaleString('en-US')} | ${subject} |`)
  }
  lines.push('')
  lines.push('## Reading a row')
  lines.push('')
  lines.push('Take the digest off the record and run the lookup, which prints the row above and the commit it names:')
  lines.push('')
  lines.push('```')
  lines.push('cd ursa-major && npx tsx tools/make-bundle-digest-index.ts --lookup d32543070474cc28')
  lines.push('```')
  lines.push('')
  lines.push('Or read the bundle itself, byte for byte, out of the commit the row names:')
  lines.push('')
  lines.push('```')
  lines.push(`git cat-file blob ${index.rows[index.rows.length - 1].blob} | sha256sum`)
  lines.push('```')
  lines.push('')
  lines.push('## What "introduced by" means, exactly')
  lines.push('')
  lines.push('The commit that holds this version of the bundle while none of its')
  lines.push('parents do. It is the commit on the branch where the bundle was rebuilt,')
  lines.push('not the merge that brought it to `main`, so the date is when the bundle')
  lines.push('was built rather than when it shipped. A row names more than one commit')
  lines.push('only if the same bytes were introduced twice, which a revert can do.')
  lines.push('')
  lines.push('## The one rule for contributors')
  lines.push('')
  lines.push('A commit cannot index its own bundle: the row names a commit hash that')
  lines.push('does not exist until the commit is made. So rebuilding the bundle takes')
  lines.push('two commits in the same pull request — `npm run bundle` and commit, then')
  lines.push('`npm run provenance:bundles` and commit. Between them `npm test` fails')
  lines.push('with the digest that has no row.')
  lines.push('')
  return lines.join('\n')
}
