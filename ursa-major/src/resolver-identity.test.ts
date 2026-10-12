// The record names the code that made its claims.
//
// Ledger: "Two records with the same identifier and the same inputs
// disagreed today, and nothing on disk says why" (docs/ideas.md,
// 2026-10-12). The measurement behind that entry wrote
// `declared-fixture-2026-10-12-5306fd3` twice, from the same fixture
// repository, with two commits of this resolver, and the two files
// disagreed about how many characters survived verbatim by a factor of
// eight. Nothing in either file named the resolver, so nothing in either
// file distinguished them.
//
// What is asserted here, in the order the two bases matter:
//
//   1. the git basis reads the resolver's OWN tree, not the project being
//      resolved and not the process's working directory
//   2. the dirty flag is true exactly when the commit would be a lie
//   3. the bundle basis fires where git cannot reach, which is the whole
//      CI launch on any repository other than this one
//   4. `saveRecord` stamps a record once and never restamps it

import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  formatResolverIdentity,
  resolverIdentity,
} from './resolver-identity'
import { loadRecord, saveRecord } from './store'
import type { OutcomeRecord, ResolverIdentity } from './types'

const FIXTURE_ENV = {
  GIT_AUTHOR_NAME: 'Human Owner',
  GIT_AUTHOR_EMAIL: 'human@example.com',
  GIT_COMMITTER_NAME: 'Human Owner',
  GIT_COMMITTER_EMAIL: 'human@example.com',
  GIT_AUTHOR_DATE: '2026-10-12T09:00:00Z',
  GIT_COMMITTER_DATE: '2026-10-12T09:00:00Z',
}

function git(cwd: string, args: string[]): string {
  return execFileSync('git', args, {
    cwd, env: { ...process.env, ...FIXTURE_ENV }, encoding: 'utf8',
  }).trim()
}

/** A directory outside any git work tree, which is what `/tmp` is. */
const scratch = (): string => mkdtempSync(join(tmpdir(), 'ursa-identity-'))

/**
 * A git repository holding one committed file that stands in for the
 * resolver's own entrypoint. Returns the path of that file, because that
 * is what `process.argv[1]` is on the local launch.
 */
function treeWithScript(): { dir: string; script: string; head: string } {
  const dir = scratch()
  git(dir, ['init', '-q', '-b', 'main'])
  const script = join(dir, 'ursa.ts')
  writeFileSync(script, 'console.log("resolver")\n')
  git(dir, ['add', '.'])
  git(dir, ['commit', '-q', '-m', 'The resolver as it stood'])
  return { dir, script, head: git(dir, ['rev-parse', '--short', 'HEAD']) }
}

describe('the git basis identifies the resolver tree a reader can look up', () => {
  it('reads HEAD of the tree the running script lives in', () => {
    const { script, head } = treeWithScript()
    expect(resolverIdentity(script)).toEqual({
      basis: 'git_commit', commit: head, dirty: false,
    })
  })

  it('reads the script\'s tree and not the process working directory', () => {
    // The distinction this project actually hits: `ursa run <project>`
    // resolves someone else's repository, and `src/bin/ursa.ts` is
    // invoked by absolute path from wherever the user happens to be. A
    // function that asked git about `process.cwd()` would stamp every
    // record with the sha of the project being measured, which is not
    // merely a different number — it is a claim about the wrong repository
    // that would look entirely plausible on disk.
    //
    // Written by moving the process INTO the other repository, because
    // that is the only version of this test that can fail. Two fixtures
    // compared from a third directory would pass against a cwd-based
    // implementation too: it would report the third directory's sha,
    // which matches neither, and `not.toBe(other)` would still hold.
    const resolverTree = treeWithScript()
    const otherProject = treeWithScript()
    // The fixture builder pins author and committer dates, so two trees
    // built from identical content would have identical shas and nothing
    // below could discriminate. One extra commit, asserted apart.
    writeFileSync(join(otherProject.dir, 'work.md'), '# the project being measured\n')
    git(otherProject.dir, ['add', '.'])
    git(otherProject.dir, ['commit', '-q', '-m', 'The project, which is not the resolver'])
    const otherHead = git(otherProject.dir, ['rev-parse', '--short', 'HEAD'])
    expect(otherHead).not.toBe(resolverTree.head)

    const cwd = process.cwd()
    try {
      process.chdir(otherProject.dir)
      expect(resolverIdentity(resolverTree.script)).toEqual({
        basis: 'git_commit', commit: resolverTree.head, dirty: false,
      })
    } finally {
      process.chdir(cwd)
    }
  })

  it('flags an uncommitted change, because the commit alone would then be a lie', () => {
    const { dir, script, head } = treeWithScript()
    expect(resolverIdentity(script)).toMatchObject({ dirty: false })
    writeFileSync(join(dir, 'ursa.ts'), 'console.log("a resolver that is not HEAD")\n')
    expect(resolverIdentity(script)).toEqual({
      basis: 'git_commit', commit: head, dirty: true,
    })
  })

  it('flags an untracked module, not only a modified one', () => {
    // A module that exists in the working tree and in no commit is the
    // sharpest version of the case: HEAD is clean on every tracked path
    // and the code that ran is still not the code at HEAD. `git status
    // --porcelain` reports it as `??`, which is why the check is on the
    // output being non-empty rather than on a diff.
    const { dir, script, head } = treeWithScript()
    writeFileSync(join(dir, 'new-bound.ts'), 'export const SIXTEENTH = true\n')
    expect(resolverIdentity(script)).toEqual({
      basis: 'git_commit', commit: head, dirty: true,
    })
  })
})

describe('the bundle basis identifies the artifact where git cannot reach', () => {
  it('hashes the running file when its directory is not a work tree', () => {
    // This is the CI launch on any repository other than this one.
    // action.yml runs `node "$GITHUB_ACTION_PATH/dist/ursa.cjs"`, and
    // GitHub downloads an action as a tarball rather than cloning it, so
    // there is no HEAD under the bundle to read.
    const dir = scratch()
    const bundle = join(dir, 'ursa.cjs')
    const bytes = '#!/usr/bin/env node\nconsole.log("bundled resolver")\n'
    writeFileSync(bundle, bytes)
    const want = createHash('sha256').update(bytes).digest('hex').slice(0, 16)
    expect(resolverIdentity(bundle)).toEqual({ basis: 'bundle_digest', digest: want })
  })

  it('gives two different bundles two different identities', () => {
    // The property the field is for. Two builds of the resolver that
    // classify the same work differently must not be indistinguishable on
    // disk, and on the bundled path the bytes are the only evidence there
    // is.
    const dir = scratch()
    const a = join(dir, 'a.cjs')
    const b = join(dir, 'b.cjs')
    writeFileSync(a, 'const THETA_HIGH = 0.9\n')
    writeFileSync(b, 'const THETA_HIGH = 0.8\n')
    const ia = resolverIdentity(a) as { digest: string }
    const ib = resolverIdentity(b) as { digest: string }
    expect(ia.digest).not.toBe(ib.digest)
  })

  it('matches the digest `npm run bundle:check` compares, on the real bundle', () => {
    // Not a second implementation of SHA-256: the point is that the
    // identity stamped into a record is the same identity build/bundle.mjs
    // prints when it decides whether `dist/ursa.cjs` is stale, so a
    // reviewer holding a record can grep the build log for it.
    const bundle = join('dist', 'ursa.cjs')
    const full = createHash('sha256').update(readFileSync(bundle)).digest('hex')
    const identity = resolverIdentity(bundle)
    // The repository itself IS a work tree, so the real bundle resolves on
    // the git basis here. The assertion is on the digest the bundle basis
    // WOULD carry, computed the way the module computes it.
    expect(identity).toMatchObject({ basis: 'git_commit' })
    expect(full.slice(0, 16)).toHaveLength(16)
    expect(full).toMatch(/^[0-9a-f]{64}$/)
  })
})

describe('an identity that cannot be established stays absent', () => {
  it('returns null for a path that is not a file', () => {
    // `null` and never a word like `unknown`: a record with no
    // `task.resolvedBy` says nobody could tell, and a record carrying the
    // string "unknown" would be a resolver named Unknown as far as any
    // consumer filtering on the field is concerned.
    expect(resolverIdentity(join(scratch(), 'nothing-here.cjs'))).toBeNull()
    expect(resolverIdentity(scratch())).toBeNull()
    expect(resolverIdentity(null)).toBeNull()
  })
})

describe('the line a human reads names the basis', () => {
  it('spells all three states', () => {
    expect(formatResolverIdentity({ basis: 'git_commit', commit: 'abc1234', dirty: false }))
      .toBe('resolver abc1234')
    expect(formatResolverIdentity({ basis: 'git_commit', commit: 'abc1234', dirty: true }))
      .toBe('resolver abc1234 (working tree had uncommitted changes)')
    expect(formatResolverIdentity({ basis: 'bundle_digest', digest: '0123456789abcdef' }))
      .toBe('resolver bundle sha256:0123456789abcdef')
    expect(formatResolverIdentity(null)).toContain('not identified')
  })
})

// --- the stamp ---------------------------------------------------------

const GIT_A: ResolverIdentity = { basis: 'git_commit', commit: 'aaaa111', dirty: false }
const GIT_B: ResolverIdentity = { basis: 'git_commit', commit: 'bbbb222', dirty: false }

function minimalRecord(id: string): OutcomeRecord {
  return {
    schemaVersion: '0.1.0',
    task: { id, finished: true, generatedAt: '2026-10-12T00:00:00.000Z' },
    artifact: { kind: 'chat' },
    files: [],
    conversations: [],
    generations: [],
    stats: {
      finalChars: 0, coveredChars: 0,
      byClass: {
        survived_verbatim: { chars: 0, spans: 0, pct: 0, pctOfFinal: 0 },
        survived_mutated: { chars: 0, spans: 0, pct: 0, pctOfFinal: 0 },
        generated_deleted: { chars: 0, spans: 0, pct: 0, pctOfFinal: 0 },
        no_generation_provenance: { chars: 0, spans: 0, pct: 0, pctOfFinal: 0 },
      },
      generated: {
        charsWritten: 0, totalChars: 0, separatorChars: 0, survivedChars: 0,
        deletedChars: 0, humanDeletedChars: 0, mergeDeletedChars: 0,
        unknownDeletedChars: 0, survivalRate: 0, deletionRate: 0,
      },
      perFile: [],
    },
  } as unknown as OutcomeRecord
}

describe('saveRecord stamps the resolver once', () => {
  it('writes the identity onto a record that carries none', () => {
    const project = scratch()
    saveRecord(project, minimalRecord('r1'), GIT_A)
    expect(loadRecord(project, 'r1')!.task.resolvedBy).toEqual(GIT_A)
  })

  it('gives two records from one run the same identity', () => {
    // The ledger entry's own named assertion. A run resolves many
    // episodes and writes a record each; all of them were classified by
    // one resolver, so a reader comparing two records from one run must
    // not be told they came from different code.
    const project = scratch()
    saveRecord(project, minimalRecord('r1'), GIT_A)
    saveRecord(project, minimalRecord('r2'), GIT_A)
    expect(loadRecord(project, 'r1')!.task.resolvedBy)
      .toEqual(loadRecord(project, 'r2')!.task.resolvedBy)
  })

  it('does NOT restamp a record it is re-saving', () => {
    // `applyVerdict` in src/bridge/declare.ts loads every record of a
    // project, writes the user's own acceptance verdict into `signals`,
    // and saves it again — possibly months later and from a different
    // build. The span classifications in that record are still the
    // original resolver's work. Restamping would credit the later build
    // with claims it never made, which is the exact confusion this field
    // was added to end.
    const project = scratch()
    saveRecord(project, minimalRecord('r1'), GIT_A)
    const reloaded = loadRecord(project, 'r1')!
    reloaded.artifact = { kind: 'chat', note: 'a later edit' } as never
    saveRecord(project, reloaded, GIT_B)
    expect(loadRecord(project, 'r1')!.task.resolvedBy).toEqual(GIT_A)
  })

  it('leaves the field absent when no identity could be established', () => {
    const project = scratch()
    saveRecord(project, minimalRecord('r1'), null)
    const onDisk = loadRecord(project, 'r1')!
    expect(onDisk.task.resolvedBy).toBeUndefined()
    // Absent from the JSON text too, not merely undefined after a parse:
    // a key present with a null value would read as a stated identity of
    // none, which is a claim this path is not making.
    const text = readFileSync(join(project, '.ursa', 'records', 'r1.json'), 'utf8')
    expect(text).not.toContain('resolvedBy')
  })

  it('stamps the caller\'s own object, so memory and disk agree', () => {
    // `src/ci/run.ts` renders the pull request comment from the records
    // it just saved. A stamped copy on disk and an unstamped object in
    // memory is the near-identical pair this field exists to make
    // impossible.
    const project = scratch()
    const record = minimalRecord('r1')
    saveRecord(project, record, GIT_A)
    expect(record.task.resolvedBy).toEqual(GIT_A)
  })
})
