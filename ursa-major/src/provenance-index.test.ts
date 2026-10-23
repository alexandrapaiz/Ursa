// The index that makes `task.resolvedBy.digest` a thing a reader can
// follow (docs/provenance/bundle-digests.json) is a derived file, so the
// failure it can have is the one every derived file committed to a
// repository can have: it stops matching what it was derived from, and
// nothing says so. These tests are what says so.
//
// Why this is in `src/` and runs under `npm test`, rather than being a
// script somebody remembers to run: the index is only worth anything at
// the moment a buyer looks a digest up, which is months after the commit
// that would have fixed it. `bundle-exec.test.ts` makes the same argument
// for `npm run bundle:check`, in its own words: it was "a separate script
// outside `npm test` until this line, which meant a run that edited
// `src/` and forgot it shipped a bundle one commit behind the rules it
// was sold as applying, with a green suite".

import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  BUNDLE_PATH, INDEX_JSON, INDEX_MD,
  buildIndex, historyUnavailable, renderJson, renderMarkdown, repoRoot,
} from '../tools/bundle-digest-index'
import { resolverIdentity } from './resolver-identity'

const root = repoRoot()
// Null root and unreadable history are the same case to this file and a
// different case from a failure: a shallow checkout, or the Action's
// tarball, cannot verify the index and knows nothing against it. The
// reason is printed so the skip is never silent, which is the condition
// `tools/bundle-digest-index.ts` states for skipping at all.
const blocked = root === null ? 'not inside a git work tree' : historyUnavailable(root)
// The reason goes in the suite's own name, not only in a `console.log`,
// because vitest's default reporter prints neither the stdout of a
// skipped file nor anything but a count for it: `Tests 5 skipped (5)`.
// A reason only a `--reporter=verbose` run would show is a reason nobody
// reads. Measured while writing this file, in a `--depth 1` clone of
// this repository.
const SUITE = blocked === null
  ? 'the resolver bundle digest index'
  : `the resolver bundle digest index (skipped: ${blocked})`

/** The bundle as HEAD holds it, which is the artifact a consumer pinned
 *  to this commit would download and run. Not the working tree's copy: a
 *  rebuild that has not been committed yet is a file no row could name
 *  and no defect in the index. */
function headBundle(): Buffer {
  return execFileSync('git', ['-C', root as string, 'show', `HEAD:${BUNDLE_PATH}`], {
    maxBuffer: 256 * 1024 * 1024,
    stdio: ['ignore', 'pipe', 'ignore'],
  })
}

describe.skipIf(blocked !== null)(SUITE, () => {
  const index = buildIndex(root as string)

  it('is what this repository\'s history says it is, in both files', () => {
    // The staleness gate, and the reason it can fail on a run that
    // changed nothing about it: a commit cannot index its own bundle,
    // because a row names a commit hash that does not exist until the
    // commit is made. A run that rebuilt `dist/ursa.cjs` therefore has to
    // commit the rebuild, run `npm run provenance:bundles`, and commit
    // the index second. This assertion is what tells it to.
    expect(readFileSync(join(root as string, INDEX_JSON), 'utf8')).toBe(renderJson(index))
    expect(readFileSync(join(root as string, INDEX_MD), 'utf8')).toBe(renderMarkdown(index))
  })

  it('holds a row for the bundle HEAD ships, under the digest the resolver would stamp a record with', () => {
    // The end-to-end claim, asserted against the product's own code
    // rather than against a second hash computed here. `resolverIdentity`
    // is given the bundle in a directory with no git work tree above it,
    // which is the tarball case `action.yml` runs on every customer's
    // runner and the only case that produces a `bundle_digest` basis.
    const copy = join(mkdtempSync(join(tmpdir(), 'ursa-digest-index-')), 'ursa.cjs')
    writeFileSync(copy, headBundle())
    const identity = resolverIdentity(copy)

    expect(identity?.basis).toBe('bundle_digest')
    const digest = identity?.basis === 'bundle_digest' ? identity.digest : ''
    const row = index.rows.find((r) => r.digest === digest)
    expect(row, `no row for the bundle at HEAD (digest ${digest}); run: npm run provenance:bundles`).toBeDefined()
    expect(row?.bytes).toBe(headBundle().length)
  })

  it('reproduces a digest a person wrote down by hand eight days before this index existed', () => {
    // docs/design/resolver-action.md §8.2 records "`npm run bundle:check`
    // current at sha256 `db8ebdf7`" for the run of 2026-10-08, typed by
    // whoever wrote that section. The index derives the same eight
    // characters for that day's commit from the git object store alone.
    // Two independent paths to one number is the cheapest evidence that
    // the derivation is right, and it is the only assertion here that
    // would survive this module being rewritten.
    const doc = readFileSync(join(root as string, 'docs/design/resolver-action.md'), 'utf8')
    expect(doc).toContain('db8ebdf7')
    // Anchored on the commit's date and subject rather than its object
    // id, which is the whole lesson of 2026-10-23. This line read
    // `c.commit.startsWith('d4a57c4')` until then, and `d4a57c4` is a
    // commit this repository no longer has: a history rewrite renumbered
    // every commit while preserving every tree, author date and subject,
    // so the hand-written hash rotted and the date and the subject did
    // not. A row's identity for the purposes of this assertion is "the
    // bundle introduced by the commit of that day with that message",
    // which survives a renumbering; its object id does not.
    const row = index.rows.find((r) => r.introducedBy.some((c) =>
      c.date.startsWith('2026-10-08')
      && c.subject === 'The empty-window sentence was asserting a cause it had not checked'))
    expect(row, 'no row for the 2026-10-08 bundle resolver-action.md §8.2 names').toBeDefined()
    expect(row?.digest.startsWith('db8ebdf7')).toBe(true)
  })

  it('names, for every row, a commit this repository actually has', () => {
    // The claim the whole index exists to support, asserted directly
    // instead of as a side effect of the text comparison above.
    //
    // A row is an answer to "which commit shipped the resolver that
    // stamped this record", so a row naming a commit absent from HEAD's
    // history is not a stale derived file, it is a dead link in the one
    // lookup `task.resolvedBy.digest` is sold as supporting. On
    // 2026-10-23 all twenty-five rows named commits no longer in this
    // repository, because a history rewrite renumbered them and the index
    // was never regenerated. The staleness gate above did fail, but it
    // failed as a fifty-line text diff whose cause a reader has to infer.
    // This one says the cause in a sentence, and it is the assertion that
    // would have named the defect on the day of the rewrite.
    // Read from the COMMITTED file, not from `index`. The first version
    // of this assertion walked `index`, which is `buildIndex(root)`, and
    // every commit in that is reachable from HEAD by construction — it
    // was derived from `git rev-list HEAD` moments earlier. It therefore
    // passed against the very stale file that motivated it. The shipped
    // artifact is the committed JSON, so that is what has to be read.
    const committed = JSON.parse(readFileSync(join(root as string, INDEX_JSON), 'utf8')) as {
      rows: Array<{ introducedBy: Array<{ commit: string; date: string; subject: string }> }>
    }
    const known = new Set(
      execFileSync('git', ['-C', root as string, 'rev-list', 'HEAD'], {
        encoding: 'utf8', maxBuffer: 64 * 1024 * 1024,
      }).split('\n').filter(Boolean),
    )
    const dangling = committed.rows.flatMap((r) =>
      r.introducedBy.filter((c) => !known.has(c.commit)).map((c) => `${c.commit} (${c.date} ${c.subject})`))
    expect(dangling, `the index names ${dangling.length} commit(s) not reachable from HEAD; `
      + 'if the history was rewritten, run: npm run provenance:bundles').toEqual([])
  })

  it('gives every version a distinct digest, which is what makes a lookup an answer', () => {
    // Sixteen hexadecimal characters is 64 bits, so a collision inside
    // one repository's history is not a thing to expect; it is a thing
    // that would silently make `--lookup` ambiguous, and the only cost of
    // knowing is this line. The same reasoning applies to the blob ids:
    // two rows with one blob would mean the row key stopped being the
    // content.
    expect(new Set(index.rows.map((r) => r.digest)).size).toBe(index.rows.length)
    expect(new Set(index.rows.map((r) => r.blob)).size).toBe(index.rows.length)
  })

  it('names, for every row, a commit that holds exactly those bytes', () => {
    // A row is a pointer, and a pointer that cannot be followed is
    // indistinguishable from provenance until someone tries to follow it
    // — which is RESOLVER_IDENTIFIED's own argument in
    // src/invariants.ts, applied to the index that bound sends a reader
    // to. Followed here through `git show <commit>:<path>`, the command a
    // reader would type, rather than through the blob id the index
    // already carries.
    for (const row of index.rows) {
      for (const c of row.introducedBy) {
        const bytes = execFileSync('git', ['-C', root as string, 'show', `${c.commit}:${BUNDLE_PATH}`], {
          maxBuffer: 256 * 1024 * 1024,
          stdio: ['ignore', 'pipe', 'ignore'],
        })
        expect(bytes.length, `${c.commit.slice(0, 7)} does not hold ${row.bytes} bytes`).toBe(row.bytes)
      }
    }
  })
})
