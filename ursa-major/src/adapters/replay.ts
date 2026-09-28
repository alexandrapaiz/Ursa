// Record and replay for the PR adapter's `RepoReader`.
//
// The adapter's inputs are a snapshot (JSON, easy to keep) and a clone
// (large, and its refs/pull/* refs are not in a fresh clone at all). A
// test that needs a real pull request's blob identities therefore either
// fetches from GitHub, which makes the test a network test, or replays
// recorded answers. This records them.
//
// What gets recorded is object ids, never file contents, so a fixture
// carries no source text and no private data. Regenerate one with:
//
//   npx tsx src/adapters/cli.ts fixture --pr 7 --repo alexandrapaiz/Ursa \
//     --project /path/to/clone --out fixtures/pr/ursa-pr-7.json

import type { RepoReader } from './github-pr'

export interface RecordedRepo {
  /** commit sha → parent shas, first parent first */
  parents: Record<string, string[]>
  /** "<sha>:<path>" → blob object id, or null when the path is absent there */
  blobs: Record<string, string | null>
}

export function recordingReader(inner: RepoReader): { reader: RepoReader; recorded: RecordedRepo } {
  const recorded: RecordedRepo = { parents: {}, blobs: {} }
  return {
    recorded,
    reader: {
      blobId(sha, path) {
        const id = inner.blobId(sha, path)
        recorded.blobs[`${sha}:${path}`] = id
        return id
      },
      parents(sha) {
        const list = inner.parents(sha)
        recorded.parents[sha] = list
        return list
      },
    },
  }
}

/**
 * A reader over recorded answers. An unrecorded lookup throws rather
 * than returning null: a silent null would turn a fixture drift into a
 * quietly wrong result, which is the failure mode this whole adapter
 * exists to avoid.
 */
export function replayReader(recorded: RecordedRepo): RepoReader {
  return {
    blobId(sha, path) {
      const key = `${sha}:${path}`
      if (!(key in recorded.blobs)) throw new Error(`replay: no recorded blob for ${key}`)
      return recorded.blobs[key]
    },
    parents(sha) {
      if (!(sha in recorded.parents)) throw new Error(`replay: no recorded parents for ${sha}`)
      return recorded.parents[sha]
    },
  }
}
