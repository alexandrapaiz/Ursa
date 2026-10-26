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
import { IMPORT_TRAILER, vendoredPaths } from './vendored'
import { authoredAfterHorizon } from './corroborate'
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

  /**
   * What the refusal is still the only defense against, restated
   * 2026-10-14.
   *
   * This test used to assert that without the file-level refusal the
   * import inflates the survival figure, and that the refusal was "the
   * whole of the difference". Half of that stopped being true the day the
   * span-level descent gate landed (src/resolve.ts, `verbatimClaim`): the
   * sibling branch that authored `standard.md` is a rival for every span
   * of it, and the generation's parent holds the shared clause text, so
   * pass 1 now demotes all of it on its own. Both records report the same
   * survival figure, and the equality is asserted below rather than
   * smoothed over, because it is the measurement.
   *
   * The refusal's remaining and separate job is that the path is not in
   * the record at all. A span-level gate leaves 3,200 characters of
   * somebody else's document inside `files[]`, inside `coveredChars`, and
   * inside every per-file row a buyer reads — honestly labelled, and still
   * not this episode's work. That is what the assertions cover now.
   */
  it('keeps the import out of the record, which the span-level gate alone does not', () => {
    const { r, generatedSha } = vendoredOnASibling()
    const ep = episodeFor(r, generatedSha)
    // `ep.vendoredPaths` left unset is not how `main` calls it; this is
    // the pre-change behaviour, reconstructed to measure it. `[]` means
    // "asked, nothing found", which is what suppresses the check.
    const before = resolveEpisode(r.dir, { ...ep, vendoredPaths: [] })!
    const after = resolveEpisode(r.dir, annotated(r, ep))!

    const survived = (rec: typeof before) =>
      rec.stats.byClass.survived_verbatim.chars + rec.stats.byClass.survived_mutated.chars

    // The span-level gate already sells none of the import as survival, so
    // the two figures agree. Neither is inflated, and the agent's own
    // module is all either of them counts.
    expect(survived(before)).toBe(survived(after))
    expect(survived(after)).toBeLessThan(HQ.length)

    // The difference the refusal does make: the path, its characters, and
    // its per-file row are gone rather than merely relabelled.
    const fromTheImport = before.files.find((f) => f.path === 'standard.md')!
    expect(fromTheImport.spans.length).toBeGreaterThan(0)
    expect(fromTheImport.spans.some((x) => x.class === 'survived_verbatim')).toBe(false)
    expect(fromTheImport.spans.some((x) => x.descent?.basis === 'rival')).toBe(true)
    expect(after.files.find((f) => f.path === 'standard.md')).toBeUndefined()
    expect(before.stats.coveredChars).toBeGreaterThan(after.stats.coveredChars)
    expect(before.stats.perFile.map((row) => row.path)).toContain('standard.md')
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
    // Read out of git rather than written as a literal, so this asserts
    // "the author date of THAT commit" and not "some ISO string". It is the
    // field EXCLUSION_NOT_CLASSIFIED orders against `task.generatedAt`:
    // a sibling copy authored after the work closed is a copy OF the work,
    // and the refusal would be backwards.
    const vendorDate = sh(r.dir, ['log', '-1', '--pretty=format:%aI', vendorSha]).trim()
    expect(record.exclusions).toEqual([{
      path: 'standard.md',
      reason: 'imported_whole',
      sha: vendorSha.slice(0, 7),
      subject: 'Re-vendor standard.md from HQ main',
      relation: 'sibling',
      chars: HQ.length,
      date: vendorDate,
    }])
    expect(Date.parse(vendorDate))
      .toBeLessThanOrEqual(Date.parse(record.task.generatedAt))
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

// ---------------------------------------------------------------------------
// The import that arrived from another repository, which the blob search
// structurally cannot find, and the declaration that answers it.
//
// Why these cases could not be written before: every test above builds its
// import by putting the identical content at the identical path somewhere
// else in the SAME fixture repository, because that is the only thing
// `vendoredPaths` could read. The defect is the case where no such commit
// exists anywhere — `docs/standards/lessons.md` came from
// `alexandrapaiz/alexandra-systems`, and 60,616 characters of it were sold
// as text the person kept. A fixture for that is a repository where the
// content exists in exactly one place, which is why each test below asserts
// the absence as well as the verdict.
// ---------------------------------------------------------------------------

/** the content the sync brings in, which exists in no other commit */
const UPSTREAM = doc('imports')

/**
 * A declaration and the co-author trailer in ONE trailer block.
 *
 * Written as a helper because getting it wrong is silent, and this run got
 * it wrong first: `'...' + '\n\nUrsa-Imported-Path: x' + TRAILER` puts a
 * blank line between the two, which makes the declaration its own
 * paragraph and the co-author block the last one. Git parses trailers out
 * of the last paragraph only, so the declaration is then not read, the
 * exclusion does not fire, and the record silently sells the import as
 * survival — the exact defect this whole block exists to prevent. Pinned
 * as behaviour by 'does not read a declaration in a paragraph of its own'
 * below.
 */
const declaring = (...paths: string[]) =>
  '\n\n' + paths.map((x) => `${IMPORT_TRAILER}: ${x}`).join('\n')
  + TRAILER.replace('\n\n', '\n')

/**
 * The real shape, from this repository's own history. An agent seat syncs a
 * standard in from the holding company, declaring it with the trailer, and
 * touches a module it genuinely wrote in the same commit. The person then
 * edits both. The sync is read as a generation, so without the declaration
 * every surviving character of the standard is credited to a model.
 */
function syncedFromAnotherRepo(declare: boolean) {
  const r = repo()
  r.commit({ 'standard.md': doc('drafts'), 'module.ts': 'export const derived0 = 0\n' }, 'Baseline')
  const generatedSha = r.commit(
    { 'standard.md': UPSTREAM, 'module.ts': AGENT_MODULE },
    'Lessons sync 2026-09-28: HQ standard.md @ 775ce36'
      + (declare ? declaring('standard.md') : TRAILER),
    BOT,
  )
  // The person's genuine edit, which is what makes a pair and what makes
  // the finished blob differ from every blob in the repository.
  r.commit({
    'standard.md': UPSTREAM + 'A local note the owner added under the import.\n',
    'module.ts': AGENT_MODULE + 'export const checked = true\n',
  }, 'Annotate the standard, finish the module')
  return { r, generatedSha }
}

describe('a file synced from another repository is not read as text a model composed', () => {
  it('refuses the path on the commit\'s own declaration, with no matching blob anywhere', () => {
    const { r, generatedSha } = syncedFromAnotherRepo(true)
    const ep = episodeFor(r, generatedSha)

    // The premise, asserted rather than assumed: this content exists at
    // this path in exactly one commit, so the blob search has nothing to
    // find and the declaration is carrying the whole verdict.
    const holders = sh(r.dir, ['log', '--all', '--pretty=format:%H', '--', 'standard.md'])
      .trim().split('\n').filter((x) => x.length > 0)
      .filter((sha) => sh(r.dir, ['rev-parse', `${sha}:standard.md`]).trim()
        === sh(r.dir, ['rev-parse', `${generatedSha}:standard.md`]).trim())
    expect(holders).toEqual([generatedSha])

    const found = vendoredPaths(r.dir, ep, resolvablePaths(ep), listCommits(r.dir))
    expect(found.map((v) => v.path)).toEqual(['standard.md'])
    expect(found[0].relation).toBe('declared')
    expect(generatedSha.startsWith(found[0].sha)).toBe(true)
    expect(found[0].subject).toBe('Lessons sync 2026-09-28: HQ standard.md @ 775ce36')
  })

  it('is the whole of the difference: without the declaration the import is credited as survival', () => {
    // The same fixture twice, differing only in the trailer. This is the
    // measurement the ledger entry is about, in miniature: the identical
    // history produces an inflated survival figure when nobody declared
    // the import and an honest one when somebody did.
    const undeclared = syncedFromAnotherRepo(false)
    const declared = syncedFromAnotherRepo(true)
    const recordFor = (f: { r: Repo; generatedSha: string }) =>
      resolveEpisode(f.r.dir, annotated(f.r, episodeFor(f.r, f.generatedSha)))!

    const before = recordFor(undeclared)
    const after = recordFor(declared)
    const survived = (rec: typeof before) =>
      rec.stats.byClass.survived_verbatim.chars + rec.stats.byClass.survived_mutated.chars

    // The defect, reproduced: the undeclared run finds no import at all
    // and sells the synced file as the person's kept work.
    //
    // The threshold here was `> UPSTREAM.length` until 2026-10-14, chosen
    // to say "the entire import is inside the figure". The span-level
    // descent gate now shaves the part of the synced document the
    // generation's parent already held, so the figure no longer clears the
    // file's own length and the comparison has to be stated against the
    // honest record instead of against a constant. The defect is unchanged
    // and is still most of the file: a declaration is the only evidence
    // that a byte-identical sync from ANOTHER repository is an import,
    // because no commit in this one is a rival for it.
    expect(before.exclusions).toEqual([])
    expect(before.files.map((f) => f.path)).toContain('standard.md')
    const fromTheSync = before.files.find((f) => f.path === 'standard.md')!
    expect(fromTheSync.spans.some((x) => x.class === 'survived_verbatim')).toBe(true)
    expect(survived(before) - survived(after)).toBeGreaterThan(UPSTREAM.length / 2)

    // The fix: the standard leaves both sides of the record, the module
    // the agent genuinely wrote keeps every label it earned.
    expect(after.files.map((f) => f.path)).toEqual(['module.ts'])
    expect(after.generations.map((g) => g.filePath)).toEqual(['module.ts'])
    expect(survived(after)).toBeLessThan(UPSTREAM.length)
  })

  it('writes the exclusion under its own reason, not as a proof it never ran', () => {
    const { r, generatedSha } = syncedFromAnotherRepo(true)
    const record = resolveEpisode(r.dir, annotated(r, episodeFor(r, generatedSha)))!

    expect(record.exclusions).toHaveLength(1)
    expect(record.exclusions![0]).toMatchObject({
      path: 'standard.md',
      // `imported_whole` here would be the record claiming two blob oids
      // were compared and found equal. None were.
      reason: 'declared_import',
      sha: generatedSha.slice(0, 7),
      subject: 'Lessons sync 2026-09-28: HQ standard.md @ 775ce36',
      relation: 'declared',
    })
    // `chars` is the finished file, including the person's own added
    // note, because that is what left the figures by being excluded.
    expect(record.exclusions![0].chars).toBe(
      UPSTREAM.length + 'A local note the owner added under the import.\n'.length,
    )
    // The gate holds, and the reconciliation the field exists for still
    // closes with the new reason in place.
    expect(checkRecord(record)).toEqual([])
    const m = measure(record)
    expect(m.consideredChars).toBe(record.stats.finalChars + record.exclusions![0].chars)
  })

  it('tells the user how the run knows, without claiming a comparison it did not make', () => {
    const { r, generatedSha } = syncedFromAnotherRepo(true)
    const ep = annotated(r, episodeFor(r, generatedSha))
    const summary = renderRunSummary([resolveEpisode(r.dir, ep)!], [ep])

    expect(summary).toContain('1 file came in whole from elsewhere')
    expect(summary).toContain(IMPORT_TRAILER)
    expect(summary).toContain(generatedSha.slice(0, 7))
    // The sentence the other two relations print would be false here.
    expect(summary).not.toContain('byte-identical')
  })

  it('reads a declaration on the final commit too, where the sync lands last', () => {
    // The mirror shape: the agent writes the file, and the person's
    // finishing commit replaces it with upstream content and says so.
    // The finished file is then nobody's composition in this episode, and
    // again no other commit holds that blob.
    const r = repo()
    r.commit({ 'standard.md': doc('drafts'), 'module.ts': 'export const derived0 = 0\n' }, 'Baseline')
    const generatedSha = r.commit(
      { 'standard.md': doc('rewrites'), 'module.ts': AGENT_MODULE },
      'Draft the standard and the module' + TRAILER, BOT,
    )
    const finalSha = r.commit({
      'standard.md': UPSTREAM,
      'module.ts': AGENT_MODULE + 'export const checked = true\n',
    }, 'Re-vendor standard.md from HQ main @ 683c7dd\n\nUrsa-Imported-Path: standard.md')

    const ep = episodeFor(r, generatedSha)
    const found = vendoredPaths(r.dir, ep, resolvablePaths(ep), listCommits(r.dir))
    expect(found.map((v) => v.path)).toEqual(['standard.md'])
    expect(found[0].relation).toBe('declared')
    expect(finalSha.startsWith(found[0].sha)).toBe(true)
  })

  it('scopes the declaration to the paths it names, and to nothing else', () => {
    // The guard that keeps this from being a per-episode kill switch. The
    // commit declares one path; the module beside it in the same commit is
    // still the agent's work and still gets classified.
    const { r, generatedSha } = syncedFromAnotherRepo(true)
    const record = resolveEpisode(r.dir, annotated(r, episodeFor(r, generatedSha)))!
    const module = record.files.find((f) => f.path === 'module.ts')!
    expect(module.spans.some((s) => s.class === 'survived_verbatim')).toBe(true)
    expect(record.exclusions!.map((x) => x.path)).toEqual(['standard.md'])
  })

  it('does not read a declaration out of commit prose, only out of a trailer', () => {
    // The refusal the design turns on. Every real sync commit in this
    // repository names its upstream in the subject line, so a regex over
    // prose would have worked and is still refused: it would reclassify
    // any commit whose message merely mentions a sync, which is a
    // judgement nobody authorised. Here the subject says "Re-vendor" and
    // the body says it in words, and neither is read.
    const r = repo()
    r.commit({ 'standard.md': doc('drafts'), 'module.ts': 'export const derived0 = 0\n' }, 'Baseline')
    const generatedSha = r.commit(
      { 'standard.md': UPSTREAM, 'module.ts': AGENT_MODULE },
      'Re-vendor standard.md from HQ main @ 683c7dd\n\n'
        + 'This is an import. Ursa-Imported-Path is mentioned here in prose,\n'
        + 'in a paragraph that is not a trailer block.\n\n'
        + 'Discussion of why the sync happened follows, so the paragraph\n'
        + 'above is not the last one either.' + TRAILER,
      BOT,
    )
    r.commit({
      'standard.md': UPSTREAM + 'A local note the owner added under the import.\n',
      'module.ts': AGENT_MODULE + 'export const checked = true\n',
    }, 'Annotate the standard, finish the module')

    const ep = episodeFor(r, generatedSha)
    expect(vendoredPaths(r.dir, ep, resolvablePaths(ep), listCommits(r.dir))).toEqual([])
  })

  it('does not read a declaration in a paragraph of its own, above another trailer block', () => {
    // The mistake that is actually going to be made, made here on
    // purpose. This run made it first: the declaration sits in its own
    // paragraph and `Co-Authored-By` follows after a blank line, so the
    // co-author block is the message's last paragraph and git's trailer
    // parser never sees the declaration.
    //
    // Pinned as behaviour rather than fixed, and the reason is the whole
    // design: the alternative is to scan the message for the key, which
    // is reading prose, which is what `IMPORT_TRAILER` exists to avoid.
    // What this costs is a silent miss, so the cost is paid down in
    // documentation instead — docs/design/vendored-paths.md §9 shows the
    // one correct spelling, and `declaring()` above is the helper that
    // makes the correct one the easy one.
    const r = repo()
    r.commit({ 'standard.md': doc('drafts'), 'module.ts': 'export const derived0 = 0\n' }, 'Baseline')
    const generatedSha = r.commit(
      { 'standard.md': UPSTREAM, 'module.ts': AGENT_MODULE },
      'Lessons sync 2026-09-28: HQ standard.md @ 775ce36'
        + '\n\n' + IMPORT_TRAILER + ': standard.md'
        + TRAILER,
      BOT,
    )
    r.commit({
      'standard.md': UPSTREAM + 'A local note the owner added under the import.\n',
      'module.ts': AGENT_MODULE + 'export const checked = true\n',
    }, 'Annotate the standard, finish the module')

    const ep = episodeFor(r, generatedSha)
    expect(vendoredPaths(r.dir, ep, resolvablePaths(ep), listCommits(r.dir))).toEqual([])

    // And the correct spelling, on the identical history, does fire. The
    // two differ by one blank line and nothing else.
    const ok = syncedFromAnotherRepo(true)
    const okEp = episodeFor(ok.r, ok.generatedSha)
    expect(vendoredPaths(ok.r.dir, okEp, resolvablePaths(okEp), listCommits(ok.r.dir))
      .map((v) => v.path)).toEqual(['standard.md'])
  })

  it('reads several declarations from one commit', () => {
    // A sync commit commonly brings in more than one file: the real one
    // this is modelled on carried `docs/standards/lessons.md` and
    // `docs/standards/pm.md` together.
    const r = repo()
    r.commit({ 'a.md': doc('drafts'), 'b.md': doc('older'), 'module.ts': 'export const derived0 = 0\n' }, 'Baseline')
    const generatedSha = r.commit(
      { 'a.md': UPSTREAM, 'b.md': doc('upstream-two'), 'module.ts': AGENT_MODULE },
      'Standards sync @ 775ce36' + declaring('a.md', 'b.md'),
      BOT,
    )
    r.commit({
      'a.md': UPSTREAM + 'Local note.\n',
      'b.md': doc('upstream-two') + 'Local note.\n',
      'module.ts': AGENT_MODULE + 'export const checked = true\n',
    }, 'Annotate both, finish the module')

    const ep = episodeFor(r, generatedSha)
    const found = vendoredPaths(r.dir, ep, resolvablePaths(ep), listCommits(r.dir))
    expect(found.map((v) => v.path).sort()).toEqual(['a.md', 'b.md'])
    expect(found.every((v) => v.relation === 'declared')).toBe(true)
    const record = resolveEpisode(r.dir, { ...ep, vendoredPaths: found })!
    expect(record.files.map((f) => f.path)).toEqual(['module.ts'])
    expect(checkRecord(record)).toEqual([])
  })

  it('does not call a declared path an import when the finished file is gone', () => {
    // A path the person deleted has no finished blob, so there is nothing
    // to classify and nothing to exclude. Reporting it would put an entry
    // with `chars: 0` in the record, which the gate refuses as a number
    // that cannot be added back to `stats.finalChars`.
    const r = repo()
    r.commit({ 'standard.md': doc('drafts'), 'module.ts': 'export const derived0 = 0\n' }, 'Baseline')
    const generatedSha = r.commit(
      { 'standard.md': UPSTREAM, 'module.ts': AGENT_MODULE },
      'Lessons sync @ 775ce36' + declaring('standard.md'),
      BOT,
    )
    r.git(['rm', '-q', 'standard.md'])
    r.commit({ 'module.ts': AGENT_MODULE + 'export const checked = true\n' }, 'Drop the standard')

    const ep = episodeFor(r, generatedSha)
    const found = vendoredPaths(r.dir, ep, resolvablePaths(ep), listCommits(r.dir))
    expect(found).toEqual([])
    const record = resolveEpisode(r.dir, { ...ep, vendoredPaths: found })!
    expect(checkRecord(record)).toEqual([])
  })

  /**
   * The refusal that used to run backwards, fixed at the search on
   * 2026-10-26. This test is the one the 2026-10-15 version of this file
   * said would fail, loudly and by design, on the day someone bounded
   * `vendoredPaths` by its own horizon. That day is today, and what it
   * asserts is inverted accordingly: the file is no longer excluded, the
   * record keeps it, and there is nothing left for the gate to refuse.
   *
   * What the shape still proves, and why it is worth keeping rather than
   * deleting. Byte identity is symmetric, so this repository builds the
   * one case where identity alone gives the wrong answer: the person
   * composes `standard.md`, somebody branches off the baseline and
   * commits the same bytes afterwards, and the later commit is a copy OF
   * the work rather than a source for it. Before the fix the whole file
   * left every figure in the record — not a span losing its label, but
   * `stats.finalChars` dropping by the size of the file with every
   * percentage built on it moving too — and the record was then refused
   * by `EXCLUSION_NOT_CLASSIFIED`'s third clause, which left `ursa run`
   * writing a record its own gate rejects and the person with no
   * recourse. On 2026-10-26 that stopped being hypothetical: a default
   * `ursa run --limit 20` over this repository hit it on
   * `docs/market/landscape.md`, 30,287 characters, and exited 1.
   */
  it('keeps a file whose only identical copy was authored after the work closed', () => {
    const r = repo()
    r.commit({ 'standard.md': doc('drafts'), 'module.ts': 'export const derived0 = 0\n' }, 'Baseline')
    const baseline = r.at('HEAD')
    const generatedSha = r.commit(
      { 'standard.md': doc('rewrites'), 'module.ts': AGENT_MODULE },
      'Rewrite the standard and derive the module' + TRAILER,
      BOT,
    )
    // The person's own composition, and the episode's closing commit.
    r.commit({
      'standard.md': HQ,
      'module.ts': AGENT_MODULE + 'export const checked = true\n',
    }, 'Write the standard out properly, keep the derived module')

    // AFTER the work closed: somebody branches off the baseline and lands
    // the same bytes. Nothing about this commit was available to copy from
    // while the person was writing, which is the whole point.
    r.git(['checkout', '-q', '-b', 'later-branch', baseline])
    const lateSha = r.commit({ 'standard.md': HQ }, 'Mirror the standard onto the release branch')
    r.git(['checkout', '-q', 'main'])

    const ep = episodeFor(r, generatedSha)
    const commits = listCommits(r.dir)
    const found = vendoredPaths(r.dir, ep, resolvablePaths(ep), commits)

    // Nothing is excluded, because the only identical blob outside the
    // generation's descent is in the record's own future.
    expect(found).toEqual([])
    // The candidate was really there and really matched, so the empty
    // answer above is the time bound's doing and not an accident of this
    // repository's shape: the late commit holds the finished bytes at the
    // same path, and `authoredAfterHorizon` is what removes it.
    expect(execFileSync('git', ['-C', r.dir, 'show', `${lateSha}:standard.md`], { encoding: 'utf8' })).toBe(HQ)
    expect(authoredAfterHorizon(commits, ep.generatedSha, ep.finalSha)(lateSha)).toBe(true)

    const record = resolveEpisode(r.dir, { ...ep, vendoredPaths: found })!

    // The file the person wrote is in the record, classified, with its
    // characters inside the figures rather than outside them.
    expect(record.files.map((f) => f.path).sort()).toEqual(['module.ts', 'standard.md'])
    expect(record.exclusions ?? []).toEqual([])
    expect(record.stats.finalChars).toBeGreaterThan(HQ.length)

    // And nothing for the gate to refuse. Until today this record failed
    // `EXCLUSION_NOT_CLASSIFIED`'s third clause, which is now what it was
    // always meant to be: a restatement over the record alone of a rule
    // the resolver already follows, so it can only fire on a record this
    // resolver did not write.
    expect(checkRecord(record)).toEqual([])
  })
})
