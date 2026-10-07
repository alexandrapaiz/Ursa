// The file-level refusal, tested on real git repositories.
//
// What makes these integration tests over `resolveEpisode` and
// `renderRunSummary` rather than unit tests over `vendoredPaths`: the
// defect is not in the blob comparison, which is one `git rev-parse`.
// It is that the resolver reads a file nobody in the episode wrote and
// reports its contents as text the person kept. A unit test of the
// comparison would have passed on every day the wrong figure shipped.
//
// The case rebuilt below is the one from this repository's own history
// (docs/design/vendored-paths.md §2). A document is written on one
// branch, an agent commit touches the same paths on another, and the
// person's finishing commit carries the first branch's version of the
// document byte for byte. Every character of it then came back
// `survived_verbatim`, credited to a generation that did not write it.

import { execFileSync } from 'node:child_process'
import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { buildEpisodes, type Episode } from './episodes'
import { findCommitPairs, listCommits } from './pairfinder'
import { renderRunSummary, resolveEpisode, resolvablePaths } from './bin/ursa'
import { vendoredPaths } from './vendored'
import { checkRecord, measure } from './invariants'
import { resolve } from './resolve'

// Author identity through the environment, not `git config`, for the
// reason m0.test.ts and corroborate.test.ts both give: GIT_AUTHOR_NAME
// outranks a repository's user.name and every agent harness exports it,
// so a fixture relying on `git config` is authored by whoever runs the
// suite.
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
  git(args: string[], env?: Record<string, string>): void
  at(ref: string): string
}

function repo(): Repo {
  const dir = mkdtempSync(join(tmpdir(), 'ursa-vendored-'))
  sh(dir, ['init', '-q', '-b', 'main'])
  const epoch = Date.UTC(2026, 0, 1, 0, 0, 0)
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
    git(args, env = HUMAN) { sh(dir, args, dated(env)) },
    at(ref) { return sh(dir, ['rev-parse', ref]).trim() },
  }
}

/**
 * A document long enough that the resolver segments it into many spans,
 * so "the whole file was credited" is a figure and not a rounding error.
 */
const doc = (revision: string) => Array.from(
  { length: 30 },
  (_, i) => `Standard clause ${i}. The holding company requires that every seat ${revision} its own deliverables before review.`,
).join('\n\n') + '\n'

const HQ = doc('vendors')
/** the module the agent genuinely writes, which must keep being resolved */
const AGENT_MODULE = Array.from({ length: 12 }, (_, i) => `export const derived${i} = compute(${i})`).join('\n') + '\n'

/**
 * The shape from real history. `standard.md` is written on a side branch
 * the agent's commit never contained, the agent's commit writes its own
 * version of both paths, and the person's finishing commit takes the
 * side branch's `standard.md` byte for byte while editing `module.ts`.
 */
function vendoredOnASibling() {
  const r = repo()
  r.commit({ 'standard.md': doc('drafts'), 'module.ts': 'export const derived0 = 0\n' }, 'Baseline')
  const baseline = r.at('HEAD')

  // The side branch that actually authors the standard.
  r.git(['checkout', '-q', '-b', 'hq-sync'])
  const vendorSha = r.commit({ 'standard.md': HQ }, 'Re-vendor standard.md from HQ main')

  // The agent generation, on main, touching both paths.
  r.git(['checkout', '-q', baseline])
  const generatedSha = r.commit(
    { 'standard.md': doc('rewrites'), 'module.ts': AGENT_MODULE },
    'Rewrite the standard and derive the module' + TRAILER,
    BOT,
  )

  // The person finishes: HQ's standard verbatim, their own edit to the module.
  r.commit({
    'standard.md': HQ,
    'module.ts': AGENT_MODULE + 'export const checked = true\n',
  }, 'Take HQ\'s standard, keep the derived module')

  return { r, generatedSha, vendorSha }
}

function episodeFor(r: Repo, generatedSha: string): Episode {
  const ep = buildEpisodes(findCommitPairs(r.dir), r.dir)
    .find((e) => e.generatedSha === generatedSha)
  expect(ep, 'the fixture must produce a pair for the agent\'s generation').toBeDefined()
  return ep!
}

/** what `main` does before resolving, so the test exercises the wired path */
function annotated(r: Repo, ep: Episode): Episode {
  return {
    ...ep,
    vendoredPaths: vendoredPaths(r.dir, ep, resolvablePaths(ep), listCommits(r.dir)),
  }
}

describe('a file that came in whole from elsewhere is not read as the person\'s work', () => {
  it('names the path, the commit it came from, and the relation', () => {
    const { r, generatedSha, vendorSha } = vendoredOnASibling()
    const ep = episodeFor(r, generatedSha)
    const found = vendoredPaths(r.dir, ep, resolvablePaths(ep), listCommits(r.dir))

    expect(found.map((v) => v.path)).toEqual(['standard.md'])
    expect(found[0].relation).toBe('sibling')
    expect(vendorSha.startsWith(found[0].sha)).toBe(true)
    expect(found[0].subject).toBe('Re-vendor standard.md from HQ main')
  })

  it('leaves the imported file out of the record entirely, both sides', () => {
    const { r, generatedSha } = vendoredOnASibling()
    const record = resolveEpisode(r.dir, annotated(r, episodeFor(r, generatedSha)))!

    expect(record.files.map((f) => f.path)).toEqual(['module.ts'])
    // The generation side goes with it. Keeping the generation while
    // dropping the final file would move the whole imported document into
    // `generated_deleted` and inflate the discard figure by exactly the
    // amount the survival figure was inflated by before.
    expect(record.generations.map((g) => g.filePath)).toEqual(['module.ts'])
  })

  it('is the whole of the difference: without the refusal the import is credited as survival', () => {
    const { r, generatedSha } = vendoredOnASibling()
    const ep = episodeFor(r, generatedSha)
    // `ep.vendoredPaths` left unset is not how `main` calls it; this is
    // the pre-change behaviour, reconstructed to measure it. `[]` means
    // "asked, nothing found", which is what suppresses the check.
    const before = resolveEpisode(r.dir, { ...ep, vendoredPaths: [] })!
    const after = resolveEpisode(r.dir, annotated(r, ep))!

    const survived = (rec: typeof before) =>
      rec.stats.byClass.survived_verbatim.chars + rec.stats.byClass.survived_mutated.chars
    expect(survived(before)).toBeGreaterThan(survived(after))
    // Every character of the import was in the inflated figure, and the
    // agent's own module is all that is left in the honest one.
    const fromTheImport = before.files.find((f) => f.path === 'standard.md')!
    expect(fromTheImport.spans.some((s) => s.class === 'survived_verbatim')).toBe(true)
    expect(survived(after)).toBeLessThan(HQ.length)
  })

  it('keeps resolving the file the agent did write', () => {
    const { r, generatedSha } = vendoredOnASibling()
    const record = resolveEpisode(r.dir, annotated(r, episodeFor(r, generatedSha)))!
    const module = record.files.find((f) => f.path === 'module.ts')!
    // The refusal is per path, not per episode. A real generation sitting
    // beside an import keeps every label it earned.
    expect(module.spans.some((s) => s.class === 'survived_verbatim')).toBe(true)
  })

  it('reports the exclusion in the run summary, naming the file and the commit', () => {
    const { r, generatedSha, vendorSha } = vendoredOnASibling()
    const ep = annotated(r, episodeFor(r, generatedSha))
    const summary = renderRunSummary([resolveEpisode(r.dir, ep)!], [ep])

    expect(summary).toContain('1 file came in whole from elsewhere and was not read as your work')
    expect(summary).toContain('standard.md')
    expect(summary).toContain(vendorSha.slice(0, 7))
    expect(summary).toContain('Re-vendor standard.md from HQ main')
  })

  it('writes a record that states the refusal when every resolvable path was imported', () => {
    // The case a silent run would be most misread in, and the one this
    // test pinned the other way on 2026-10-06: the episode resolved to
    // nothing, and the only account of why reached `.ursa/episodes.json`
    // and the terminal. A record that is absent from `.ursa/records/` is
    // indistinguishable from a run that found no work, so the episode now
    // resolves to a record carrying no files, no generations, and the one
    // exclusion that explains both.
    const r = repo()
    r.commit({ 'standard.md': doc('drafts') }, 'Baseline')
    const baseline = r.at('HEAD')
    r.git(['checkout', '-q', '-b', 'hq-sync'])
    const vendorSha = r.commit({ 'standard.md': HQ }, 'Re-vendor standard.md from HQ main')
    r.git(['checkout', '-q', baseline])
    const generatedSha = r.commit({ 'standard.md': doc('rewrites') }, 'Rewrite it' + TRAILER, BOT)
    r.commit({ 'standard.md': HQ }, 'Take HQ\'s version')

    const ep = annotated(r, episodeFor(r, generatedSha))
    const record = resolveEpisode(r.dir, ep)!
    expect(record.files).toEqual([])
    expect(record.generations).toEqual([])
    expect(record.exclusions).toEqual([{
      path: 'standard.md',
      reason: 'imported_whole',
      sha: vendorSha.slice(0, 7),
      subject: 'Re-vendor standard.md from HQ main',
      relation: 'sibling',
      chars: HQ.length,
    }])
    // It claims nothing, and claiming nothing is not the same as being
    // unarithmetic: the gate holds on it like any other record.
    expect(checkRecord(record)).toEqual([])
    expect(record.stats.byClass.survived_verbatim.chars).toBe(0)

    const summary = renderRunSummary([record], [ep])
    expect(summary).toContain('came in whole from elsewhere')
    expect(summary).toContain('standard.md')
  })

  it('carries the exclusion on a record that also has files to classify', () => {
    // The ordinary shape: one import beside one real generation. The
    // record keeps the labels the agent earned on `module.ts` AND says
    // why `standard.md` has none, which is the pairing a buyer audits.
    const { r, generatedSha, vendorSha } = vendoredOnASibling()
    const record = resolveEpisode(r.dir, annotated(r, episodeFor(r, generatedSha)))!

    expect(record.files.map((f) => f.path)).toContain('module.ts')
    expect(record.files.map((f) => f.path)).not.toContain('standard.md')
    expect(record.exclusions).toHaveLength(1)
    expect(record.exclusions![0]).toMatchObject({
      path: 'standard.md',
      reason: 'imported_whole',
      sha: vendorSha.slice(0, 7),
      relation: 'sibling',
    })
    // The reconciliation the field exists for: what left the figures,
    // added back, is the size of every path the run was willing to read.
    const m = measure(record)
    expect(m.excludedChars).toBe(HQ.length)
    expect(m.consideredChars).toBe(record.stats.finalChars + HQ.length)
  })

  it('does not carry an exclusions field at all when nothing was asked', () => {
    // `resolve()` called without `exclusions` leaves the key off rather
    // than setting it to an empty array. On a chat-path record the
    // question cannot be asked, and "asked and found nothing" is a
    // different claim from "never asked" — only the first is evidence.
    const record = resolve({
      taskId: 'no-exclusions-asked',
      files: [{ path: 'a.md', text: 'one two three four five six seven eight.' }],
      conversations: [],
      generations: [],
      finished: true,
    })
    expect('exclusions' in record).toBe(false)
  })
})

describe('what the refusal declines to claim', () => {
  it('does not call a file an import because the agent wrote it and nobody changed it', () => {
    // The commonest shape in any record: the agent writes a file and the
    // person keeps it exactly. The finished blob then equals the
    // GENERATION's blob, and the generation is excluded from its own
    // candidate set, so nothing outside the line of descent holds this
    // content and the file is resolved as the agent's work.
    //
    // Asserted against `vendoredPaths` directly rather than through an
    // episode, because the shape cannot be built as one: a path reaches
    // `touchedFiles` only when both commits of the pair changed it, and a
    // file nobody changed after the generation is by definition not in
    // that set.
    const r = repo()
    r.commit({ 'a.md': doc('drafts') }, 'Baseline')
    const generatedSha = r.commit({ 'a.md': HQ }, 'Write it' + TRAILER, BOT)
    const finalSha = r.commit({ 'b.ts': 'export const mine = 1\n' }, 'Add something else')

    expect(vendoredPaths(r.dir, { generatedSha, finalSha }, ['a.md'], listCommits(r.dir)))
      .toEqual([])
  })

  it('does not call an emptied file an import, however many empty files the history holds', () => {
    // Every empty file in every repository shares one blob oid, so an
    // emptied file matches an unrelated empty file at the same path. True
    // and useless: an empty finished file has no span to classify either
    // way, so the refusal has nothing to protect.
    const r = repo()
    r.commit({ 'note.md': 'seed\n' }, 'A note with something in it')
    const baseline = r.at('HEAD')
    r.git(['checkout', '-q', '-b', 'side'])
    const emptiedElsewhere = r.commit({ 'note.md': '' }, 'Empty it on the side branch')
    r.git(['checkout', '-q', baseline])
    const generatedSha = r.commit({ 'note.md': doc('drafts') }, 'Fill it in' + TRAILER, BOT)
    const finalSha = r.commit({ 'note.md': '' }, 'Empty it again')

    // The match is really there: the side branch holds the same empty
    // blob at the same path, outside the generation's descent. The guard
    // is what declines to report it, not an absence of candidates.
    expect(r.at(`${finalSha}:note.md`)).toBe(r.at(`${emptiedElsewhere}:note.md`))
    const ep = episodeFor(r, generatedSha)
    expect(vendoredPaths(r.dir, ep, resolvablePaths(ep), listCommits(r.dir))).toEqual([])
  })

  it('does not spend a git call on a path the resolver was never going to read', () => {
    // `resolvablePaths` is the filter, and it is the caller's job rather
    // than this module's. A lockfile is skipped by the resolver, so a
    // lockfile that matches a sibling blob is not reported as an import.
    const r = repo()
    r.commit({ 'package-lock.json': '{"a":1}\n', 'm.ts': AGENT_MODULE }, 'Baseline')
    const baseline = r.at('HEAD')
    r.git(['checkout', '-q', '-b', 'side'])
    r.commit({ 'package-lock.json': '{"b":2}\n' }, 'Other lockfile')
    r.git(['checkout', '-q', baseline])
    const generatedSha = r.commit(
      { 'package-lock.json': '{"c":3}\n', 'm.ts': AGENT_MODULE + 'export const x = 1\n' },
      'Bump and extend' + TRAILER, BOT,
    )
    r.commit({
      'package-lock.json': '{"b":2}\n',
      'm.ts': AGENT_MODULE + 'export const x = 1\nexport const y = 2\n',
    }, 'Take the other lockfile')

    const ep = episodeFor(r, generatedSha)
    expect(ep.touchedFiles).toContain('package-lock.json')
    expect(resolvablePaths(ep)).not.toContain('package-lock.json')
    expect(vendoredPaths(r.dir, ep, resolvablePaths(ep), listCommits(r.dir))).toEqual([])
  })
})

describe('the limitation, pinned so it is visible rather than implied', () => {
  /**
   * An exact revert. The person throws the generation away and leaves the
   * file as they found it, so the finished blob is the ancestor's blob and
   * the relation is `pre_existing`.
   *
   * The finished file genuinely carries no correction, so excluding it is
   * right. What goes with it is a real `generated_deleted` story: the
   * agent did write something and the person did discard all of it. This
   * test asserts the cost rather than the ideal, so that the day the
   * generation side is handled separately, this expectation is what
   * changes and says so. Filed as its own ledger entry (docs/ideas.md,
   * 2026-10-06, "An imported final file still has a discard story").
   */
  it('loses the discard story when the person reverts a file outright', () => {
    const r = repo()
    const original = r.commit({ 'a.md': doc('drafts'), 'b.ts': 'export const keep = 1\n' }, 'Baseline')
    const generatedSha = r.commit(
      { 'a.md': HQ, 'b.ts': 'export const keep = 1\nexport const added = 2\n' },
      'Rewrite the doc' + TRAILER, BOT,
    )
    r.commit({
      'a.md': doc('drafts'),
      'b.ts': 'export const keep = 1\nexport const added = 2\nexport const mine = 3\n',
    }, 'Revert the doc, keep the module')

    const ep = episodeFor(r, generatedSha)
    const found = vendoredPaths(r.dir, ep, resolvablePaths(ep), listCommits(r.dir))
    expect(found.map((v) => v.path)).toEqual(['a.md'])
    expect(found[0].relation).toBe('pre_existing')
    expect(original.startsWith(found[0].sha)).toBe(true)

    const record = resolveEpisode(r.dir, { ...ep, vendoredPaths: found })!
    // The cost: the reverted document's generation is gone from the
    // record, so the discard it represents is not counted anywhere.
    expect(record.generations.map((g) => g.filePath)).toEqual(['b.ts'])
    expect(record.stats.generated.humanDeletedChars).toBeLessThan(HQ.length)
  })
})
