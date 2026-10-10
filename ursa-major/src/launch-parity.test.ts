// Two launches, one resolver: the test behind the claim.
//
// `ursa run` and `ursa ci` are sold as the same resolve fired two ways,
// and that claim is the whole premise of the Action surface. A lab
// auditing a record made in CI is auditing the local resolver's behaviour
// or it is auditing nothing. Until 2026-10-10 the claim was held up by one
// import path and nothing else: the full suite passed on a merge
// (2026-10-08, reconciling PR #92) that left two live definitions of
// `resolveEpisode` in the tree, same name, same signature, different
// behaviour, with `src/ci/run.ts` importing the one four features older.
// Nothing failed, because no test resolved one repository through both
// launches and compared the records.
//
// This file is that test. One fixture repository, resolved both ways, with
// the records diffed field by field.
//
// WHY AN ALLOWLIST AND NOT DEEP EQUALITY. The two records cannot be
// identical and should not be. The CI launch carries a merge window and a
// declaration read off a reaction, and the local launch carries the time
// dimension (`src/lifespan.ts`), which needs commits after the episode
// closed that a merge-triggered run does not have yet. So the comparison
// names the fields that may differ, up front, and asserts everything else
// is identical. Writing it the other way round — deep equality, loosened
// whenever it fails — converts each future divergence into a one-line test
// edit, which is how the divergence this file exists for survived.
//
// The three that were NOT legitimate, found by running this comparison for
// the first time, are fixed in `src/launch.ts` and pinned below:
//
//   1. a refusal-only record dropped by a generation-side size floor
//   2. no record self-check at all on the CI path
//   3. an erased episode rebuilt on the CI path

import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { beforeEach, describe, expect, it } from 'vitest'
import { main } from './bin/ursa'
import { runCi } from './ci/run'
import { renderRunComment, runCommentFields } from './ci/comment'
import { clearsSizeFloor } from './launch'
import type { GitHubApi } from './ci/github'
import type { OutcomeRecord } from './types'

/**
 * The fields a record made in CI is allowed to differ on, each with the
 * reason it is allowed. Anything not named here is compared.
 *
 * `signals` — the CI launch appends `CI launch: <window note>` to the
 *   notes and carries a declaration read off a 👍 rather than off
 *   `--declare`, so the whole block differs by design.
 * `lifespan` (per span) and `durability` — the time dimension. `ursa run`
 *   walks the commits after the episode closed; at merge time there are
 *   none yet, so the CI record claims nothing rather than claiming
 *   `untested` everywhere. Named here rather than fixed, because adding
 *   the walk to the CI launch is a product decision about what a
 *   merge-time record may assert, not a drift repair.
 */
const ALLOWED_TO_DIFFER = ['signals', 'durability', 'lifespan'] as const

/**
 * Everything about a record that both launches must agree on, flattened so
 * a failure names the field rather than printing two 40KB objects.
 *
 * Span extents are included, not just classes. A launch that classified
 * the same characters differently and a launch that classified different
 * characters the same way are both drift, and a class-only comparison sees
 * only the first.
 */
function comparable(record: OutcomeRecord): Record<string, unknown> {
  const out: Record<string, unknown> = {
    'task.id': record.task.id,
    artifact: record.artifact,
    'stats.byClass': record.stats.byClass,
    'stats.generated': record.stats.generated,
    'stats.finalChars': record.stats.finalChars,
    'stats.perFile': record.stats.perFile,
    exclusions: record.exclusions ?? [],
    files: record.files.map((f) => f.path),
    generations: record.generations.map((g) => ({
      filePath: g.filePath, kind: g.kind, charsWritten: g.charsWritten,
      totalChars: g.totalChars, separatorChars: g.separatorChars,
      // The generation side's own verdicts, including what destroyed a
      // deleted span. `src/deletion.ts` is wired from the resolve step and
      // is exactly the kind of edge a launch can be pointed at a stale
      // copy of without any total changing.
      spans: g.spans.map((s) => [s.fate, s.start, s.end, s.deletion?.cause ?? '-'].join(':')),
    })),
  }
  for (const file of record.files) {
    out[`mode ${file.path}`] = file.mode
    // Not just the class and the extent. A stale resolve step on one
    // launch and the current one on the other agreed on every class and
    // every extent in the first version of this test, and still disagreed:
    // what changed was `descent` and the word-level `diff` that goes with
    // it, which is the evidence a reader uses to decide whether a
    // `survived_mutated` label means an edit happened. Measured 2026-10-10
    // by pointing `src/ci/run.ts` at a copy of the resolve step with
    // `gitDescentCorroborator` removed: the class-and-extent projection
    // passed and the record was materially different.
    out[`spans ${file.path}`] = file.spans.map((s) => ({
      class: s.class,
      at: `${s.start}:${s.end}`,
      score: s.score,
      uncertain: s.uncertain ?? false,
      trivial: s.trivial ?? false,
      // The verdict, not the whole evidence object: a corroborator that
      // reports a different candidate commit for the same verdict is not
      // a divergence in what the record claims.
      descent: s.descent?.basis ?? null,
      // The correction itself, as the record states it. Compared by shape
      // rather than by text so a failure prints a readable line.
      diff: (s.diff ?? [])
        .map((d) => `${d.added ? '+' : d.removed ? '-' : '='}${d.value.length}`)
        .join(','),
      source: s.source ? `${s.source.conversationId}#${s.source.turnIndex}` : null,
    }))
  }
  return out
}

/** Every record either launch wrote, keyed by task id, read off disk. */
function recordsOnDisk(repo: string): Map<string, OutcomeRecord> {
  const dir = join(repo, '.ursa', 'records')
  const out = new Map<string, OutcomeRecord>()
  for (const name of readdirSync(dir).filter((n) => n.endsWith('.json'))) {
    const rec = JSON.parse(readFileSync(join(dir, name), 'utf8')) as OutcomeRecord
    out.set(rec.task.id, rec)
  }
  return out
}

/**
 * Resolve one repository through both launches and return both sets of
 * records.
 *
 * Run sequentially against the same clone rather than against two copies,
 * on purpose: the git history is then byte-identical by construction
 * instead of by two fixture builders agreeing, and the episode ids, which
 * are derived from the commit shas, line up without any normalization.
 * `.ursa/` is removed between the two so neither run reads the other's
 * output.
 */
async function bothLaunches(repo: string, minChars: number): Promise<{
  ci: Map<string, OutcomeRecord>
  local: Map<string, OutcomeRecord>
  ciExitCode: number
  localExitCode: number
  ciComment: string
}> {
  const head = git(repo, ['rev-parse', 'HEAD'])
  const base = git(repo, ['rev-parse', `${head}~2`])
  const eventPath = join(repo, 'event.json')
  writeFileSync(eventPath, JSON.stringify({
    repository: { full_name: 'o/r' },
    pull_request: {
      number: 1, merged: true, merge_commit_sha: null,
      base: { sha: base }, head: { sha: head },
    },
  }))

  const ciResult = await runCi({
    projectPath: repo, eventPath, repo: 'o/r', token: '',
    api: silentApi(), env: {}, post: false, minChars, log: () => {},
  })
  const ci = recordsOnDisk(repo)
  rmSync(join(repo, '.ursa'), { recursive: true, force: true })

  const realLog = console.log
  const realError = console.error
  console.log = () => {}
  console.error = () => {}
  let localExitCode: number
  try {
    localExitCode = await main(['run', repo, '--min-chars', String(minChars)])
  } finally {
    console.log = realLog
    console.error = realError
  }
  return {
    ci, local: recordsOnDisk(repo), ciExitCode: ciResult.exitCode, localExitCode,
    ciComment: ciResult.comment ?? '',
  }
}

describe('one repository resolved through both launches produces the same record', () => {
  it('agrees on every span class, every span extent, and every stats block', async () => {
    const repo = editedFixture()
    const { ci, local } = await bothLaunches(repo, 10)

    // Both found the same work units. Asserted before the field diff so a
    // launch that silently dropped one fails here, naming the id, rather
    // than passing a comparison over an empty intersection.
    expect([...ci.keys()].sort()).toEqual([...local.keys()].sort())
    expect(ci.size).toBe(1)

    for (const id of ci.keys()) {
      const a = comparable(ci.get(id)!)
      const b = comparable(local.get(id)!)
      // One assertion over the whole projection, so a failure prints every
      // field that drifted rather than stopping at the first.
      expect(a).toEqual(b)
    }
  })

  it('agrees that the edit was an edit: survived_mutated on both sides, not just a matching total', async () => {
    const repo = editedFixture()
    const { ci, local } = await bothLaunches(repo, 10)
    const [ciRec] = [...ci.values()]
    const [localRec] = [...local.values()]
    // The fixture's human commit rewrote two strings inside the generated
    // file and kept the rest. A launch resolving with a stale module would
    // most plausibly differ here, because descent corroboration
    // (src/corroborate.ts) is what decides whether a high similarity score
    // is allowed to be called an edit at all.
    expect(ciRec.stats.byClass.survived_mutated.chars).toBeGreaterThan(0)
    expect(ciRec.stats.byClass.survived_mutated).toEqual(localRec.stats.byClass.survived_mutated)
    expect(ciRec.stats.byClass.survived_verbatim).toEqual(localRec.stats.byClass.survived_verbatim)
  })

  it('differs only on the fields the allowlist names', async () => {
    const repo = editedFixture()
    const { ci, local } = await bothLaunches(repo, 10)
    const [id] = [...ci.keys()]
    const drifted = topLevelDiff(ci.get(id)!, local.get(id)!)
    expect(drifted.filter((k) => !ALLOWED_TO_DIFFER.includes(k as never))).toEqual([])
  })
})

describe('the refusal-only record survives both launches', () => {
  // The defect: `ursa run` exempts a record with no generation side from
  // `--min-chars`, because the floor is measured on the generation side and
  // a refusal-only record has none. `ursa ci` asked
  // `record.stats.generated.totalChars < minChars` alone, so the one record
  // whose whole job is to say out loud that an episode's every path was an
  // import was dropped by a threshold aimed at something else — restoring
  // exactly the silence it was built to replace.
  it('keeps the exclusion-only record on both paths at the default floor', async () => {
    const repo = importedFixture()
    const { ci, local } = await bothLaunches(repo, 200)

    expect([...local.keys()]).toHaveLength(1)
    expect([...ci.keys()]).toEqual([...local.keys()])

    const [rec] = [...ci.values()]
    expect(rec.files).toEqual([])
    expect(rec.generations).toEqual([])
    expect(rec.stats.generated.totalChars).toBe(0)
    expect(rec.exclusions).toHaveLength(1)
    expect(rec.exclusions?.[0]).toMatchObject({ path: 'vendor.md', reason: 'imported_whole' })
    // And the same record on the other path, same exclusion, same commit.
    expect(comparable(rec)).toEqual(comparable([...local.values()][0]))
  })

  it('states the rule once, where both launches read it', () => {
    const refusalOnly = {
      stats: { generated: { totalChars: 0 } },
      exclusions: [{ path: 'vendor.md' }],
    } as unknown as OutcomeRecord
    const tiny = {
      stats: { generated: { totalChars: 12 } }, exclusions: [],
    } as unknown as OutcomeRecord
    expect(clearsSizeFloor(refusalOnly, 200)).toBe(true)
    expect(clearsSizeFloor(tiny, 200)).toBe(false)
    expect(clearsSizeFloor(tiny, 10)).toBe(true)
  })
})

describe('the record self-check runs on both launches', () => {
  // `ursa run` has run src/invariants.ts over every record it wrote since
  // the generated-denominator work and exits non-zero on a violation. The
  // CI launch ran no check at all, so an arithmetically impossible record
  // reached a pull request as five confident fields with nothing marking
  // it. A lab auditing that record had no more guarantee behind it than
  // the comment's own prose.
  it('passes the gate on a healthy repository and says so in the comment', async () => {
    const repo = editedFixture()
    const { ciExitCode, localExitCode, ciComment } = await bothLaunches(repo, 10)
    expect(ciExitCode).toBe(0)
    expect(localExitCode).toBe(0)
    expect(ciComment).toContain('Self-check: every record above satisfies all thirteen')
  })

  it('fails the run and marks the comment when a record breaks a bound', () => {
    // Driven through the comment renderer rather than by corrupting a
    // record on disk: the question this pins is whether a reader of the
    // five fields is told not to trust them, and the five fields are what
    // the renderer produces.
    const ctx = {
      prNumber: 4, repo: 'o/r', range: 'aaa1111..bbb2222',
      windowNote: "merge commit: window is the pull request's own commits",
      declarationBasis: 'undeclared', recordsPath: '/tmp/x/.ursa/records', runUrl: null,
    }
    const fields = runCommentFields([], [], {
      unitsAdded: 0, unitsReinforced: 0, mode: 'ci-no-model', reason: 'no model',
    })
    const bad = renderRunComment(fields, { ...ctx, invariantViolations: 2 })
    expect(bad).toContain('**2 bounds violated**')
    expect(bad).toContain('exited non-zero rather than reporting success')
    // The table's five rows are untouched: a reader comparing two runs
    // still sees the same shape, which is why this line is in the detail
    // block and not a sixth field.
    expect(bad).toContain('Units resolved')
    const ok = renderRunComment(fields, { ...ctx, invariantViolations: 0 })
    expect(ok).toContain('Self-check: every record above satisfies')
    // An older caller that passes nothing gets the healthy sentence, which
    // is wrong in only one direction: it understates.
    expect(renderRunComment(fields, ctx)).toContain('Self-check: every record above satisfies')
  })
})

describe('an erased episode stays erased on both launches', () => {
  // Erasure has to survive re-derivation. Both launches rebuild every
  // episode from git history, which is still on the machine after
  // `ursa forget` ran. The local launch has consulted the consent record
  // since the consent work landed; the CI launch did not, so on any runner
  // holding the project's `.ursa/` it recreated the record the user
  // deleted. Constraint 2 of this project says the user can always delete
  // what has been inferred about them.
  it('resolves nothing in CI for an episode the user forgot', async () => {
    const repo = editedFixture()
    const first = await bothLaunches(repo, 10)
    const [id] = [...first.local.keys()]

    const realLog = console.log
    console.log = () => {}
    try {
      expect(await main(['forget', repo, '--record', id])).toBe(0)
    } finally {
      console.log = realLog
    }

    const eventPath = join(repo, 'event.json')
    const result = await runCi({
      projectPath: repo, eventPath, repo: 'o/r', token: '',
      api: silentApi(), env: {}, post: false, minChars: 10, log: () => {},
    })
    expect(result.recordPaths).toEqual([])
    expect(result.fields?.unitsResolved).toBe(0)
  })
})

// --- fixtures ---------------------------------------------------------

/**
 * Fixed author and committer dates, so the fixture's commit shas are the
 * same on every machine and every run. The records' task ids derive from
 * those shas, so without this a failure message carries a different id
 * each time it is read.
 */
const FIXTURE_ENV = {
  GIT_AUTHOR_NAME: 'Human Owner',
  GIT_AUTHOR_EMAIL: 'human@example.com',
  GIT_COMMITTER_NAME: 'Human Owner',
  GIT_COMMITTER_EMAIL: 'human@example.com',
  GIT_AUTHOR_DATE: '2026-10-10T09:00:00Z',
  GIT_COMMITTER_DATE: '2026-10-10T09:00:00Z',
}

function git(cwd: string, args: string[]): string {
  return execFileSync('git', args, {
    cwd, env: { ...process.env, ...FIXTURE_ENV }, encoding: 'utf8',
  }).trim()
}

function newRepo(): string {
  const dir = mkdtempSync(join(tmpdir(), 'ursa-parity-'))
  git(dir, ['init', '-q', '-b', 'main'])
  return dir
}

const GENERATED = [
  'export function digest() {',
  '  const items = fetchItems()',
  "  const summary = items.map(formatItem).join('\\n')",
  "  return 'DIGEST — the latest research, summarized for you.\\n' + summary",
  '}',
  'function formatItem(i) { return `- ${i.title}: ${i.claim} — why it matters: ${i.why}` }',
].join('\n')

/**
 * Three commits: a base, an agent commit, and the human's edit of it. The
 * same shape as the fixture in `src/ci/ci.test.ts`, which is what the
 * ledger entry's first step asked for, so the two files test the same
 * history through different lenses.
 */
function editedFixture(): string {
  const dir = newRepo()
  writeFileSync(join(dir, 'README.md'), '# project\n')
  git(dir, ['add', '.'])
  git(dir, ['commit', '-q', '-m', 'Base'])

  writeFileSync(join(dir, 'digest.js'), GENERATED + '\n')
  git(dir, ['add', '.'])
  git(dir, ['commit', '-q', '-m', 'Generate digest module\n\nCo-Authored-By: Claude <noreply@anthropic.com>'])

  const edited = GENERATED
    .replace('DIGEST — the latest research, summarized for you.', 'The frontier, read for you.')
    .replace('why it matters', 'so what')
  writeFileSync(join(dir, 'digest.js'), edited + '\n')
  git(dir, ['add', '.'])
  git(dir, ['commit', '-q', '-m', 'Tighten digest prose'])
  return dir
}

/**
 * Three commits whose episode resolves to a refusal and nothing else: the
 * base writes `vendor.md`, the agent rewrites it, and the human restores
 * it byte for byte. The finished blob is then identical to a blob in a
 * commit that is an ancestor of the generation, which is what
 * `src/vendored.ts` reads as an import — the file arrived from elsewhere
 * and no character of it was composed in this work.
 */
function importedFixture(): string {
  const dir = newRepo()
  const vendored = [
    '# Vendored standard',
    '',
    'This document is carried, not written. It arrived whole from upstream',
    'and every line of it predates this repository, which is the only fact',
    'about it that a survival figure may use.',
  ].join('\n') + '\n'
  writeFileSync(join(dir, 'vendor.md'), vendored)
  git(dir, ['add', '.'])
  git(dir, ['commit', '-q', '-m', 'Base: carry the upstream document'])

  writeFileSync(join(dir, 'vendor.md'), vendored.replace('carried, not written', 'rewritten by an agent'))
  git(dir, ['add', '.'])
  git(dir, ['commit', '-q', '-m', 'Rewrite the vendored document\n\nCo-Authored-By: Claude <noreply@anthropic.com>'])

  writeFileSync(join(dir, 'vendor.md'), vendored)
  git(dir, ['add', '.'])
  git(dir, ['commit', '-q', '-m', 'Restore the vendored document'])
  return dir
}

/** Reads and writes nothing. The parity comparison is about the records. */
function silentApi(): GitHubApi {
  return {
    listRepoRunComments: async () => [],
    listPrComments: async () => [],
    listReactions: async () => [],
    postComment: async (_pr, body) => ({ id: 1, html_url: 'url', created_at: 'now', body }),
    patchComment: async (_id, body) => ({ id: 1, html_url: 'url', created_at: 'now', body }),
  }
}

/**
 * Which top-level keys of two records are not deep-equal, plus `lifespan`
 * when any span carries it on one side and not the other. Reported as a
 * list of names so the allowlist assertion reads as a set difference.
 */
function topLevelDiff(a: OutcomeRecord, b: OutcomeRecord): string[] {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)])
  const out: string[] = []
  for (const key of keys) {
    const av = (a as unknown as Record<string, unknown>)[key]
    const bv = (b as unknown as Record<string, unknown>)[key]
    if (JSON.stringify(av) !== JSON.stringify(bv)) out.push(key)
  }
  if (out.includes('files')) {
    // `files` differing only because one side's spans carry a lifespan is
    // the allowlisted time dimension, not drift in the classification.
    const strip = (r: OutcomeRecord) => r.files.map((f) => ({
      ...f, spans: f.spans.map(({ lifespan, ...rest }) => rest),
    }))
    if (JSON.stringify(strip(a)) === JSON.stringify(strip(b))) {
      out[out.indexOf('files')] = 'lifespan'
    }
  }
  return out.sort()
}
