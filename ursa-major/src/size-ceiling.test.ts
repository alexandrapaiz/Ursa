// The size refusal, tested on real git repositories.
//
// Why integration tests over `resolveEpisode` rather than a unit test of the
// comparison: the comparison is `genText.length > MAX_BLOB_CHARS`, which has
// never been wrong. What was wrong for fifty-one days is what the resolver
// did NEXT, which was `continue`. A path over the ceiling left no span, no
// `stats.perFile` row and no sentence anywhere, so a record over an episode
// that touched one was byte-indistinguishable from a record over an episode
// that did not. A unit test of the length check would have passed on every
// one of those days.
//
// The scale is this repository's own, measured 2026-11-09: ten paths at
// `main` were over the 300,000-character ceiling, eight of them paths the
// resolver would otherwise have read, the largest being `docs/ideas.md` at
// 1,671,449 characters, 5.57 times it. The ledger this organization keeps its
// own ideas in had therefore never appeared in an outcome record.

import { execFileSync } from 'node:child_process'
import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { buildEpisodes, type Episode } from './episodes'
import { findCommitPairs, listCommits } from './pairfinder'
import { resolveEpisode, resolvablePaths } from './bin/ursa'
import { MAX_BLOB_CHARS } from './resolve-episode'
import { vendoredPaths } from './vendored'
import { checkRecord, measure } from './invariants'

// Author identity through the environment and not `git config`, for the
// reason src/vendored.test.ts gives: GIT_AUTHOR_NAME outranks a repository's
// user.name and every agent harness exports it, so a fixture that leans on
// `git config` is authored by whoever runs the suite.
const AS = (name: string, email: string) => ({
  GIT_AUTHOR_NAME: name, GIT_AUTHOR_EMAIL: email,
  GIT_COMMITTER_NAME: name, GIT_COMMITTER_EMAIL: email,
})
const HUMAN = AS('Human Owner', 'human@example.com')
const BOT = AS('claude[bot]', 'noreply@anthropic.com')
const TRAILER = '\n\nCo-Authored-By: Claude <noreply@anthropic.com>'

function sh(cwd: string, args: string[], env: Record<string, string> = HUMAN): string {
  return execFileSync('git', args, { cwd, env: { ...process.env, ...env }, encoding: 'utf8' })
}

interface Repo {
  dir: string
  commit(files: Record<string, string>, msg: string, env?: Record<string, string>): string
  at(ref: string): string
}

function repo(): Repo {
  const dir = mkdtempSync(join(tmpdir(), 'ursa-size-ceiling-'))
  sh(dir, ['init', '-q', '-b', 'main'])
  const epoch = Date.UTC(2026, 10, 9, 0, 0, 0)
  let tick = 0
  const dated = (env: Record<string, string>) => {
    const d = new Date(epoch + tick++ * 3_600_000).toISOString()
    return { ...env, GIT_AUTHOR_DATE: d, GIT_COMMITTER_DATE: d }
  }
  return {
    dir,
    commit(files, msg, env = HUMAN) {
      for (const [path, body] of Object.entries(files)) writeFileSync(join(dir, path), body)
      sh(dir, ['add', '-A'], env)
      sh(dir, ['commit', '-q', '-m', msg], dated(env))
      return sh(dir, ['rev-parse', 'HEAD']).trim()
    },
    at(ref) { return sh(dir, ['rev-parse', ref]).trim() },
  }
}

/**
 * A register-shaped prose file of a stated size. Built from a repeated
 * paragraph rather than one long line, because the resolver segments on
 * prose boundaries and a single line is one span: the point of the fixture
 * is a file whose refusal costs the record many spans, which is what the
 * real `docs/sprints/pending.md` is.
 */
function register(chars: number, revision: string): string {
  const para = `Entry. The seat recorded that it ${revision} the register before review.\n\n`
  return para.repeat(Math.ceil(chars / para.length)).slice(0, chars)
}

const OVER = MAX_BLOB_CHARS + 13_856
const UNDER = 40_000
/** the module the person genuinely edits, which must keep being resolved */
const MODULE = Array.from({ length: 12 }, (_, i) => `export const derived${i} = compute(${i})`).join('\n') + '\n'

function episodeFor(r: Repo, generatedSha: string): Episode {
  const ep = buildEpisodes(findCommitPairs(r.dir), r.dir)
    .find((e) => e.generatedSha === generatedSha)
  expect(ep, 'the fixture must produce a pair for the agent\'s generation').toBeDefined()
  return ep!
}

/** what `main` does before resolving, so the test exercises the wired path */
function annotated(r: Repo, ep: Episode): Episode {
  return { ...ep, vendoredPaths: vendoredPaths(r.dir, ep, resolvablePaths(ep), listCommits(r.dir)) }
}

/**
 * An agent commit and a human edit over two paths, one of them over the
 * ceiling on both sides. `paths` names the sizes so the asymmetric case
 * below can reuse the whole fixture by changing two numbers.
 */
function episodeWithARegister(gen: number, fin: number) {
  const r = repo()
  r.commit({ 'register.md': register(1_000, 'opened'), 'module.ts': 'export const derived0 = 0\n' }, 'Baseline')
  const generatedSha = r.commit(
    { 'register.md': register(gen, 'wrote'), 'module.ts': MODULE },
    'Append to the register and derive the module' + TRAILER,
    BOT,
  )
  r.commit({
    'register.md': register(fin, 'kept'),
    'module.ts': MODULE + 'export const checked = true\n',
  }, 'Keep the register, keep the derived module')
  return { r, generatedSha }
}

describe('a path over the size ceiling states its refusal instead of vanishing', () => {
  it('keeps the path out of files[] and names it in exclusions[] with both sizes', () => {
    const { r, generatedSha } = episodeWithARegister(OVER, OVER)
    const record = resolveEpisode(r.dir, annotated(r, episodeFor(r, generatedSha)))!

    // The path the resolver was willing to read is still read, which is the
    // half of this that was never broken.
    expect(record.files.map((f) => f.path)).toEqual(['module.ts'])
    expect(record.generations.map((g) => g.filePath)).toEqual(['module.ts'])

    const x = record.exclusions!.find((e) => e.path === 'register.md')!
    expect(x.reason).toBe('over_size_ceiling')
    expect(x.relation).toBe('refused')
    expect(x.ceiling).toBe(MAX_BLOB_CHARS)
    expect(x.chars).toBe(OVER)
    expect(x.generatedChars).toBe(OVER)
    // The commit whose blob was measured, so `git cat-file -s <sha>:<path>`
    // returns the number the record states.
    expect(r.at('HEAD').startsWith(x.sha)).toBe(true)
    expect(x.subject).toBe('Keep the register, keep the derived module')
    // No date, because the refusal rests on no commit's clock. The bound's
    // time clause therefore has nothing to order, which is why `refused` is
    // not in its exempt list rather than being added to it.
    expect(x.date).toBeUndefined()
  })

  it('passes the gate, which is the whole claim: a stated refusal is legal', () => {
    const { r, generatedSha } = episodeWithARegister(OVER, OVER)
    const record = resolveEpisode(r.dir, annotated(r, episodeFor(r, generatedSha)))!
    expect(checkRecord(record)).toEqual([])
  })

  it('gives the refused path a row and keeps its characters addable', () => {
    const { r, generatedSha } = episodeWithARegister(OVER, OVER)
    const record = resolveEpisode(r.dir, annotated(r, episodeFor(r, generatedSha)))!

    const row = record.stats.perFile.find((f) => f.path === 'register.md')
    expect(row, 'the refused path needs a row or it silently does not exist').toBeDefined()
    expect(row!.excluded).toBe('over_size_ceiling')
    expect(row!.coveredChars).toBe(0)

    // What the run read is what it classified plus what it refused, which is
    // the reconciliation `Exclusion.chars` exists for.
    const m = measure(record)
    expect(m.excludedPaths).toBe(1)
    expect(m.excludedChars).toBe(OVER)
    expect(m.consideredChars).toBe(record.stats.finalChars + OVER)
  })

  it('refuses on the generation side alone, where the finished file is small', () => {
    // The agent writes a register over the ceiling and the person cuts it
    // back under. `chars` is then well inside the limit and the refusal is
    // still honest, which is why the record carries both numbers and the
    // bound reads both.
    const { r, generatedSha } = episodeWithARegister(OVER, UNDER)
    const record = resolveEpisode(r.dir, annotated(r, episodeFor(r, generatedSha)))!
    const x = record.exclusions!.find((e) => e.path === 'register.md')!
    expect(x.chars).toBe(UNDER)
    expect(x.generatedChars).toBe(OVER)
    expect(checkRecord(record)).toEqual([])
  })

  it('reads a path at exactly the ceiling, because the refusal is strict', () => {
    const { r, generatedSha } = episodeWithARegister(MAX_BLOB_CHARS, MAX_BLOB_CHARS)
    const record = resolveEpisode(r.dir, annotated(r, episodeFor(r, generatedSha)))!
    expect(record.files.map((f) => f.path).sort()).toEqual(['module.ts', 'register.md'])
    expect(record.exclusions ?? []).toEqual([])
  })

  it('writes a record for an episode whose only path was refused, instead of null', () => {
    // The behaviour change, stated as its own case. Before 2026-11-09 this
    // episode resolved to `null` and `src/launch.ts` counted it as
    // `unresolvable`, which is the bucket for a work unit nothing could be
    // said about. Something can be said about this one.
    const r = repo()
    r.commit({ 'register.md': register(1_000, 'opened') }, 'Baseline')
    const generatedSha = r.commit(
      { 'register.md': register(OVER, 'wrote') },
      'Append to the register' + TRAILER,
      BOT,
    )
    r.commit({ 'register.md': register(OVER, 'kept') }, 'Keep the register')

    const record = resolveEpisode(r.dir, annotated(r, episodeFor(r, generatedSha)))
    expect(record, 'a refusal is a claim, so the record exists to carry it').not.toBeNull()
    expect(record!.files).toEqual([])
    expect(record!.generations).toEqual([])
    expect(record!.exclusions!.map((e) => [e.path, e.reason]))
      .toEqual([['register.md', 'over_size_ceiling']])
    expect(checkRecord(record!)).toEqual([])
  })
})
