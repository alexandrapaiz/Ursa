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
//
// A fourth was found on 2026-10-11, by this file, on the day the option
// it concerns was added: `--agent-identity` reached the local launch and
// not the CI one, so the two launches disagreed about who the person was
// on any repository running agent seats of its own. Fixed in
// `src/ci/run.ts` and `action.yml`, pinned in the last describe block
// below.
//
// A seventh was found on 2026-10-25, by the fixture drift 5 had already
// built. `distantFixture` at `--max-pair-distance 2` is a history where
// a generation is followed by a human edit of the same file and the
// distance bound abandons the pairing, and the two launches did not
// disagree about any record there, because both correctly wrote none.
// They disagreed about what they SAID. `ursa run` named the abandonment;
// `ursa ci` called `findCommitPairs`, discarded the identical tally, and
// posted a comment asserting "no commit here carried an agent marker that
// a later human commit then edited", which that history falsifies in
// every clause. Fixed in `pairRefusals` (src/launch.ts), read by both
// surfaces, pinned in the drift 7 block below.

import { execFileSync } from 'node:child_process'
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { beforeEach, describe, expect, it } from 'vitest'
import { main } from './bin/ursa'
import { runCi } from './ci/run'
import { renderRunComment, runCommentFields } from './ci/comment'
import { PAIR_MINIMUM_COMMITS, clearsSizeFloor, keepRecord, newDroppedUnits, pairRefusals, windowTooSmallForAPair } from './launch'
import { findCommitPairsWithDiagnostics, resolvePairingBounds } from './pairfinder'
import { BOUND_COUNT } from './invariants'
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
    // Which resolver made the claims. In this test both launches run
    // in-process from one working tree, so the two records must name the
    // same resolver; a divergence here means one launch stamped a record
    // the other did not, which is how the field would quietly become
    // optional in practice. In production the two legitimately differ,
    // because `ursa ci` runs the committed `dist/ursa.cjs` on a runner
    // that cloned nothing, and that difference is the field's entire
    // point rather than drift — see `ResolverIdentity` in src/types.ts.
    'task.resolvedBy': record.task.resolvedBy,
    // Which rules those claims were checked against. Unlike `resolvedBy`
    // above, this one must agree between the two launches in PRODUCTION as
    // well as here: the resolver's identity legitimately differs, because
    // `ursa ci` runs a committed bundle on a runner that cloned nothing,
    // while the bound set is one object literal that both artifacts compile
    // from, so the two can only disagree if `dist/ursa.cjs` is stale
    // against `src/invariants.ts`.
    //
    // This line does not catch that staleness and is not claimed to. Both
    // launches here run in-process from `src/` (see `runCi` above and the
    // note at the head of the second describe block), so this file never
    // loads the bundle. What this line catches is the thing the other
    // parity fields catch: one launch stamping a field the other does
    // not, which is how a record field quietly becomes optional in
    // practice.
    //
    // The staleness itself is caught, as of 2026-10-16, by
    // `src/bundle-exec.test.ts`, which spawns the committed bundle as a
    // child process out of a directory with no git work tree in it,
    // reads the record it writes off disk, and compares that record's
    // `task.gatedBy` against `currentGateIdentity()` computed in-process
    // from `src/invariants.ts`. That file also folds `npm run
    // bundle:check` into `npm test` by spawning it, which it was not
    // part of when this paragraph was first written.
    'task.gatedBy': record.task.gatedBy,
    // Which pairing bounds the walk that found this record ran under.
    // Compared here for the same reason as the two stamps above, and it
    // is the one of the three that is a caller's argument rather than a
    // property of the running build: both launches take the bounds from
    // the same options and stamp them through one shared function
    // (`stampPairingBounds` in src/launch.ts), so a difference on this
    // line means one launch wrote an audit trail the other did not from
    // identical inputs.
    'task.pairedBy': record.task.pairedBy,
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

/**
 * Every record either launch wrote, keyed by task id, read off disk.
 *
 * An absent `records/` directory is an empty map, not a throw. A launch
 * that wrote nothing is exactly the defect this file was written to catch,
 * and the comparison below says so in one line naming the ids; an ENOENT
 * from `readdirSync` says it as a stack trace through the fixture's own
 * temporary path, which is the same fact reported worse.
 */
function recordsOnDisk(repo: string): Map<string, OutcomeRecord> {
  const dir = join(repo, '.ursa', 'records')
  const out = new Map<string, OutcomeRecord>()
  if (!existsSync(dir)) return out
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
/**
 * The three pairing bounds, named the way both launches name them, so a
 * test can move one and assert both launches moved with it. Undefined
 * leaves the resolver's own default, which is what every assertion in
 * this file written before drift 5 relies on.
 */
interface ParityBounds {
  maxPairDistance?: number
  maxPairAgeHours?: number
  maxInterposedGenerations?: number
}

async function bothLaunches(
  repo: string,
  minChars: number,
  agentIdentities: string[] = [],
  bounds: ParityBounds = {},
  /**
   * What the merge window's base is. `HEAD~2` suits the three-commit
   * fixtures; a fixture with commits interposed between the generation
   * and the edit needs the window to span them, and passes the root
   * commit instead. The local launch has no window and is unaffected,
   * which is exactly why the two must be given the same history to read.
   */
  baseRef = 'HEAD~2',
): Promise<{
  ci: Map<string, OutcomeRecord>
  local: Map<string, OutcomeRecord>
  ciExitCode: number
  localExitCode: number
  ciComment: string
  /**
   * What the local launch printed. Captured rather than discarded since
   * 2026-10-24, because drift 6 is a divergence in what the two launches
   * SAY about the same history, which a comparison of records cannot see:
   * both launches wrote nothing, correctly, and only one of them said why.
   */
  localOutput: string
}> {
  const head = git(repo, ['rev-parse', 'HEAD'])
  const base = git(repo, ['rev-parse', baseRef])
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
    agentIdentities,
    ...bounds,
  })
  const ci = recordsOnDisk(repo)
  rmSync(join(repo, '.ursa'), { recursive: true, force: true })

  const realLog = console.log
  const realError = console.error
  const printed: string[] = []
  console.log = (...a: unknown[]) => { printed.push(a.map(String).join(' ')) }
  console.error = () => {}
  let localExitCode: number
  try {
    localExitCode = await main([
      'run', repo, '--min-chars', String(minChars),
      ...agentIdentities.flatMap((i) => ['--agent-identity', i]),
      ...(bounds.maxPairDistance === undefined
        ? [] : ['--max-pair-distance', String(bounds.maxPairDistance)]),
      ...(bounds.maxPairAgeHours === undefined
        ? [] : ['--max-pair-age-hours', String(bounds.maxPairAgeHours)]),
      ...(bounds.maxInterposedGenerations === undefined
        ? [] : ['--max-interposed-generations', String(bounds.maxInterposedGenerations)]),
    ])
  } finally {
    console.log = realLog
    console.error = realError
  }
  return {
    ci, local: recordsOnDisk(repo), ciExitCode: ciResult.exitCode, localExitCode,
    ciComment: ciResult.comment ?? '',
    localOutput: printed.join('\n'),
  }
}

describe('both launches say which bound dropped a work unit', () => {
  // Drift 6, found 2026-10-24. Every other entry in this file is a drift
  // where the local launch was ahead; this is the one where the runner
  // was. `src/ci/run.ts` has counted `unresolvable` and `belowMinChars`
  // since 2026-10-08 and puts them in the pull-request comment, and
  // `src/bin/ursa.ts` counted neither, so the launch a person types was
  // the only one that could not say which flag to move.
  //
  // The tally is now in `src/launch.ts` and the wording is not, which is
  // deliberate: a terminal and a markdown comment are different surfaces.
  // So what this block pins is the two things that would actually break a
  // reader. The two launches must agree on the NUMBER of units dropped
  // and on WHICH reason dropped them, and both must name the same flag.
  it('agrees on the count and the reason, and both name --min-chars', async () => {
    const repo = editedFixture()
    // A floor no fixture clears, so the drop is certain and is the floor
    // rather than anything about the history.
    const { ci, local, ciComment, localOutput } = await bothLaunches(repo, 100_000)

    // Both wrote nothing, which is the state in which the two launches
    // used to be indistinguishable and are now not.
    expect([...ci.keys()]).toEqual([])
    expect([...local.keys()]).toEqual([])

    // One unit found on both sides, none recorded on either.
    expect(ciComment).toContain('1 work unit was found, and it did not become a record.')
    expect(localOutput).toContain('1 work unit found, 0 resolved into records.')
    expect(localOutput).toContain('1 work unit was found and not recorded')

    // The same reason, named by both, with the same floor in it.
    expect(ciComment).toContain('carried fewer than 100000 generated characters')
    expect(localOutput).toContain('carried fewer than 100,000 generated characters')
    expect(ciComment).toContain('`--min-chars` floor')
    expect(localOutput).toContain('--min-chars floor')

    // And neither blames the other reason. A launch that reported both
    // for one unit would be printing arithmetic that cannot be true,
    // which is the defect the abandoned-generations line was fixed for.
    expect(ciComment).not.toContain('resolved to nothing')
    expect(localOutput).not.toContain('resolved to nothing')
  })

  it('states the drop rule once, where both launches read it', () => {
    const tiny = {
      stats: { generated: { totalChars: 12 } }, exclusions: [],
    } as unknown as OutcomeRecord
    const big = {
      stats: { generated: { totalChars: 4_096 } }, exclusions: [],
    } as unknown as OutcomeRecord

    const d = newDroppedUnits(200)
    expect(keepRecord(null, 200, d)).toBe(false)
    expect(keepRecord(tiny, 200, d)).toBe(false)
    expect(keepRecord(big, 200, d)).toBe(true)
    expect(d).toEqual({
      unresolvable: 1,
      belowMinChars: 1,
      minChars: 200,
      // The biggest generation side the floor rejected, which is what the
      // local launch turns into `--min-chars 12`. `big` cleared the floor
      // and must not appear here.
      largestBelowFloor: 12,
    })
  })

  it('keeps the largest rejected generation, not the last one', () => {
    // The remedy sentence names one number for a set of dropped units, so
    // it has to be the one that unblocks at least one of them. Taking the
    // last would make the advice wrong whenever the units arrive in
    // descending size, which is a plausible order and not a rare one.
    const of = (chars: number) => ({
      stats: { generated: { totalChars: chars } }, exclusions: [],
    } as unknown as OutcomeRecord)
    const d = newDroppedUnits(500)
    for (const chars of [410, 120, 7]) keepRecord(of(chars), 500, d)
    expect(d.belowMinChars).toBe(3)
    expect(d.largestBelowFloor).toBe(410)
  })

  it('the exemption still wins: a refusal-only record is not counted as dropped', () => {
    // `clearsSizeFloor` exempts a record with no generation side, and that
    // exemption has to survive being moved behind `keepRecord`, or drift 1
    // comes back counted instead of silent.
    const refusalOnly = {
      stats: { generated: { totalChars: 0 } },
      exclusions: [{ path: 'vendor.md' }],
    } as unknown as OutcomeRecord
    const d = newDroppedUnits(200)
    expect(keepRecord(refusalOnly, 200, d)).toBe(true)
    expect(d).toEqual({ unresolvable: 0, belowMinChars: 0, minChars: 200, largestBelowFloor: 0 })
  })
})

describe('both launches read the same declaration of who is an agent', () => {
  // The fourth drift, found on 2026-10-11 while landing `--agent-identity`
  // itself (docs/design/agent-coauthor-detection.md). The flag reached
  // `ursa run` and not `ursa ci`: `src/ci/run.ts` called
  // `findCommitPairs(projectPath, { range })` with no identity option and
  // `action.yml` had no input that could carry one. So a repository whose
  // seats were declared locally had them undeclared on every merge, and
  // the two launches answered "who was the person" differently from
  // byte-identical history, which is the one thing `src/launch.ts` exists
  // to prevent.
  //
  // Written as a pair of assertions rather than one, because the
  // declaration's whole job is to CHANGE the answer: a test that only
  // checked both launches agree would also pass if the flag were
  // silently ignored by both.
  it('without the declaration both launches write the record', async () => {
    const repo = editedFixture()
    const { ci, local } = await bothLaunches(repo, 10)
    expect(ci.size).toBe(1)
    expect([...ci.keys()]).toEqual([...local.keys()])
  })

  it('declaring the editor an agent drops the record on BOTH launches, not just the local one', async () => {
    const repo = editedFixture()
    // The fixture's "person" is Human Owner <human@example.com>, who
    // makes the edit the single record rests on. Declaring that identity
    // turns the edit into a generation, so no pair closes and neither
    // launch has anything to resolve. Matched on the email here, which
    // the built-in vocabulary never reads, so the assertion cannot pass
    // by accident through the author-name fallback.
    const { ci, local, ciExitCode, localExitCode } = await bothLaunches(
      repo, 10, ['human@example.com'],
    )
    expect(ci.size).toBe(0)
    expect(local.size).toBe(0)
    // Zero records is an honest answer and not a failure, on both paths.
    expect(ciExitCode).toBe(0)
    expect(localExitCode).toBe(0)
  })

  it('counts the declared commits as generations on the CI launch, by the same diagnostic', () => {
    // The projection above proves the record is gone; this proves WHY it
    // is gone, so a future change that drops the record for some other
    // reason cannot keep this file green.
    const repo = editedFixture()
    const { diagnostics } = findCommitPairsWithDiagnostics(repo, {
      agentIdentities: ['human@example.com'],
    })
    expect(diagnostics.generatedByDeclaredIdentity).toBe(3)
    expect(diagnostics.editorIdentities).toEqual([])
  })
})

describe('both launches read the same pairing bounds', () => {
  // The fifth drift, found on 2026-10-18 while publishing this
  // repository's own records to its own GitHub Pages site. All three
  // bounds reached `ursa run` and none of them reached `ursa ci`:
  // `src/ci/run.ts` called `findCommitPairs(projectPath, { range,
  // agentIdentities })` and `action.yml` had no input that could carry a
  // bound. So a consumer who raised the distance to resolve a long
  // history got the wider walk on a laptop and the default 25 on every
  // merge, from byte-identical history.
  //
  // The same pair-of-assertions shape as the agent-identity block above,
  // and for the same reason: a test that only checked the two launches
  // agree would also pass if both ignored the bound.
  const ROOT = 'HEAD~6'

  it('at the default distance neither launch pairs an edit seven commits later', async () => {
    const repo = distantFixture()
    const { ci, local } = await bothLaunches(repo, 10, [], { maxPairDistance: 2 }, ROOT)
    expect(ci.size).toBe(0)
    expect(local.size).toBe(0)
  })

  it('raising the distance produces the record on BOTH launches, not just the local one', async () => {
    const repo = distantFixture()
    const { ci, local, ciExitCode, localExitCode } = await bothLaunches(
      repo, 10, [], { maxPairDistance: 20 }, ROOT,
    )
    expect(ci.size).toBe(1)
    expect(local.size).toBe(1)
    expect([...ci.keys()]).toEqual([...local.keys()])
    expect(ciExitCode).toBe(0)
    expect(localExitCode).toBe(0)
  })

  it('stamps the bounds it used into the record, on both launches, defaults filled in', async () => {
    // The number a reader of a published record sees. Before this
    // stamp a record stated two commits' shas and no statement of how
    // far apart the resolver had been willing to let them be, so two
    // records resolved from one history under different bounds were
    // indistinguishable. The two unset bounds are asserted as the
    // resolver's own defaults rather than as `undefined`, because a
    // record states what the walk used and never what a caller omitted.
    const repo = distantFixture()
    const { ci, local } = await bothLaunches(repo, 10, [], { maxPairDistance: 20 }, ROOT)
    const defaults = resolvePairingBounds()
    const expected = {
      maxPairDistance: 20,
      maxPairAgeHours: defaults.maxPairAgeHours,
      maxInterposedGenerations: defaults.maxInterposedGenerations,
    }
    expect([...local.values()][0].task.pairedBy).toEqual(expected)
    expect([...ci.values()][0].task.pairedBy).toEqual(expected)
  })

  it('says which bound dropped the pair, by the same diagnostic both launches read', () => {
    // The projection above proves the record is absent; this proves WHY,
    // so a future change that drops it for another reason cannot keep
    // this file green. It is also the number the Action's job summary
    // prints, which is how a consumer whose site came out empty learns
    // which input to set.
    const repo = distantFixture()
    const { diagnostics } = findCommitPairsWithDiagnostics(repo, { maxPairDistance: 2 })
    expect(diagnostics.abandoned.distance).toBe(1)
    expect(diagnostics.bounds.maxPairDistance).toBe(2)
  })
})

describe('both launches say which pairing bound refused a generation', () => {
  // Drift 7, found 2026-10-25. The stage above drift 6: that one was a
  // work unit built and then refused, this one is a generation refused
  // before any work unit existed. Both launches see it in
  // `diagnostics.abandoned` and only one of them used to look.
  //
  // The fixture is drift 5's, unchanged, at the distance that abandons its
  // one pairing. What makes it the right fixture is that the RECORDS are
  // identical and correct on both sides, so every assertion in the rest of
  // this file passes on it. The divergence is entirely in the prose, which
  // is why it survived a file whose premise is comparing records.
  const ROOT = 'HEAD~6'

  it('the CI comment no longer denies the pair it refused, and names the bound', async () => {
    const repo = distantFixture()
    const { ci, local, ciComment, localOutput } = await bothLaunches(
      repo, 10, [], { maxPairDistance: 2 }, ROOT,
    )

    // Neither launch wrote anything, and both are right not to. This is
    // the state drift 6 made legible one stage lower.
    expect([...ci.keys()]).toEqual([])
    expect([...local.keys()]).toEqual([])

    // The sentence this drift exists for. Asserted as an absence because
    // the defect was a false claim rather than a missing one: a test that
    // only checked the new wording was present would still pass if the old
    // sentence were printed beside it, which is exactly the contradiction
    // `ursa run` was printing in its own output.
    expect(ciComment).not.toContain(
      'no commit here carried an agent marker that a later human commit then edited',
    )
    expect(ciComment).toContain('commits here did carry agent markers and were followed by your edits')

    // Both surfaces name the same count, the same limit, and the same flag.
    // The wording differs on purpose; these three may not.
    expect(ciComment).toContain('1 of those pairings was left out rather than guessed at')
    expect(localOutput).toContain('1 generation was left out rather than guessed at')
    expect(ciComment).toContain('within 2 commits')
    expect(localOutput).toContain('within 2 commits')
    expect(ciComment).toContain('--max-pair-distance')
    expect(localOutput).toContain('--max-pair-distance')
  })

  it('the local run stops contradicting itself two paragraphs later', async () => {
    // The same false claim as the CI comment's, on the surface that was
    // already reporting the truth underneath it. Before this fix the one
    // run printed both of these about one history:
    //
    //   ... and none of those was followed by an edit of the same file
    //   without an agent marker.
    //   1 generation were left out rather than guessed at: 1 found no edit
    //   within 2 commits.
    const repo = distantFixture()
    const { localOutput } = await bothLaunches(repo, 10, [], { maxPairDistance: 2 }, ROOT)

    expect(localOutput).not.toContain(
      'none of those was followed by an edit of the same file without an agent marker',
    )
    expect(localOutput).toContain('the one that was followed by an edit of yours fell outside the bounds')
    // And the paragraph that sends the reader to the pull-request path is
    // withheld, because on this history the corrections ARE on this branch.
    expect(localOutput).not.toContain('your corrections are not on this branch')
    // The verb agrees with the count. `1 generation were` shipped until today.
    expect(localOutput).toContain('1 generation was left out')
    expect(localOutput).not.toContain('1 generation were left out')
  })

  it('a walk that abandoned nothing keeps the original sentence on both surfaces', async () => {
    // The guard on the fix. `editedFixture` pairs cleanly at the default
    // bounds, so there is no refusal to report and the unconditional
    // sentence is a true claim about that history. A fix that rewrote the
    // sentence whenever the window was empty would have replaced one wrong
    // sentence with another.
    const repo = editedFixture()
    const { ciComment, localOutput } = await bothLaunches(repo, 100_000)
    expect(pairRefusals(findCommitPairsWithDiagnostics(repo).diagnostics).total).toBe(0)
    expect(ciComment).not.toContain('left out rather than guessed at')
    expect(localOutput).not.toContain('left out rather than guessed at')
  })

  it('states the refusal tally once, where both launches read it', () => {
    // The unit test under the two above: the order, the flags, and the one
    // reason that has no flag. Built by hand rather than from a walk, so
    // the contract is pinned independently of any fixture's history.
    const refusals = pairRefusals({
      abandoned: { distance: 3, age: 2, interposedGeneration: 1, notDescendant: 4 },
      bounds: { maxPairDistance: 25, maxPairAgeHours: 72, maxInterposedGenerations: 0 },
    })
    expect(refusals.total).toBe(10)
    // Order is part of the contract and it is not `abandoned`'s declaration
    // order: the interposed-generation refusal comes first because raising
    // that bound makes the walk claim a correction it can see belongs to
    // another generation, which is the opposite of what the other two do.
    expect(refusals.refusals.map((r) => r.bound)).toEqual([
      'interposedGeneration', 'distance', 'age', 'notDescendant',
    ])
    expect(refusals.refusals.map((r) => r.flag)).toEqual([
      '--max-interposed-generations', '--max-pair-distance', '--max-pair-age-hours', null,
    ])
    // `notDescendant` carries no limit because no input widens it. A null
    // here rather than a number is what stops a surface printing one
    // flag's name for four reasons.
    expect(refusals.refusals.map((r) => r.limit)).toEqual([0, 25, 72, null])
  })

  it('reports only the reasons that fired, and nothing at all when none did', () => {
    const none = pairRefusals({
      abandoned: { distance: 0, age: 0, interposedGeneration: 0, notDescendant: 0 },
      bounds: { maxPairDistance: 25, maxPairAgeHours: 72, maxInterposedGenerations: 0 },
    })
    expect(none).toEqual({ total: 0, refusals: [] })

    const one = pairRefusals({
      abandoned: { distance: 0, age: 7, interposedGeneration: 0, notDescendant: 0 },
      bounds: { maxPairDistance: 25, maxPairAgeHours: 72, maxInterposedGenerations: 0 },
    })
    expect(one.total).toBe(7)
    expect(one.refusals).toEqual([
      { bound: 'age', count: 7, flag: '--max-pair-age-hours', limit: 72 },
    ])
  })

  it('the CI launch stamps the bounds its own walk used, not a second reading of them', async () => {
    // What changed structurally: `src/ci/run.ts` called `findCommitPairs`
    // and `resolvePairingBounds` separately, so the number stamped into a
    // record came from a different call than the walk that produced it.
    // They agreed, and nothing made them agree. The stamp now reads
    // `diagnostics.bounds`, which is the walk's own object.
    const repo = distantFixture()
    const { ci, local } = await bothLaunches(repo, 10, [], { maxPairDistance: 20 }, ROOT)
    const walked = findCommitPairsWithDiagnostics(repo, { maxPairDistance: 20 }).diagnostics.bounds
    expect([...ci.values()][0].task.pairedBy).toEqual(walked)
    expect([...local.values()][0].task.pairedBy).toEqual(walked)
  })
})

describe('neither launch reads an empty window as an empty history', () => {
  // Drift 8, found 2026-10-25. One step further out than drift 7, and the
  // first of the eight that is not a number one launch held and the other
  // did not: BOTH launches have had `diagnostics.commitsScanned` since the
  // diagnostics shipped, `ursa run` even printed it, and neither of them
  // asked whether it was large enough for the question they were about to
  // answer.
  //
  // A pairing is a generation plus a LATER commit editing the same file.
  // One commit cannot be later than itself, so a one-commit window holds
  // no pairing whatever it contains, and both surfaces reported that the
  // same way they report a window that was searched and came up empty.
  //
  // The fixture is `editedFixture` with the merge window's base moved to
  // `HEAD~1`. That is the same three-commit history every other assertion
  // in this file passes on; only the window narrows. The generation is one
  // commit behind the base, which is what makes the old sentence a false
  // reading rather than a useless one: the reader is told their commits
  // carry no agent marker while the marked commit sits just outside the
  // window the resolver was handed.
  const ONE_COMMIT = 'HEAD~1'

  it('the CI comment says the window was too small instead of blaming the history', async () => {
    const repo = editedFixture()
    const { ci, ciComment } = await bothLaunches(repo, 10, [], {}, ONE_COMMIT)

    // Nothing resolved, and that is correct. The divergence is in prose,
    // which is why drift 7's block had to exist and why this one does.
    expect([...ci.keys()]).toEqual([])
    // Nothing was refused either, so drift 7's clause does not cover this
    // history. Asserted rather than assumed, because if a bound had fired
    // the comment would be exercising the other branch.
    const diagnostics = findCommitPairsWithDiagnostics(repo, {
      range: `${git(repo, ['rev-parse', ONE_COMMIT])}..${git(repo, ['rev-parse', 'HEAD'])}`,
    }).diagnostics
    expect(diagnostics.commitsScanned).toBe(1)
    expect(pairRefusals(diagnostics).total).toBe(0)

    // Asserted as an absence as well as a presence, for the reason drift
    // 7's block gives: the defect is a false claim and not a missing one,
    // so a presence-only test passes on output that prints both.
    expect(ciComment).not.toContain(
      'no commit here carried an agent marker that a later human commit then edited',
    )
    expect(ciComment).toContain('a pairing takes 2 commits')
    expect(ciComment).toContain('this window holds one commit')
    expect(ciComment).toContain('a fact about the merge rather than about your history')
  })

  it('the detail block states how many commits were in the window, not just the range', async () => {
    // The range alone was all that line carried until today, and no
    // reader can count commits from two shas. Checked on both window
    // widths from one history so the count is shown to track the window
    // rather than to be a constant that happens to read right once.
    const repo = editedFixture()
    const narrow = await bothLaunches(repo, 10, [], {}, ONE_COMMIT)
    expect(narrow.ciComment).toContain('1 commit in it')
    expect(narrow.ciComment).toContain('2 is the fewest a pairing can come from')

    const wide = await bothLaunches(repo, 10, [], {}, 'HEAD~2')
    expect(wide.ciComment).toContain('2 commits in it')
    // And it appears on a run that DID resolve something, because the
    // question "how much history was read" is not only asked about zeros.
    expect([...wide.ci.keys()]).toHaveLength(1)
  })

  it('the local run stops drawing a conclusion from a search that could not run', async () => {
    // `ursa run` has no merge window, so this is reached through a
    // repository whose whole history is one commit: a generation with
    // nothing after it. The old output asserted that nothing generated
    // was followed by an edit of the person's, and then sent them to the
    // pull-request path on the strength of it.
    const repo = oneCommitFixture()
    const printed: string[] = []
    const realLog = console.log
    console.log = (...a: unknown[]) => { printed.push(a.map(String).join(' ')) }
    let exitCode: number
    try {
      exitCode = await main(['run', repo, '--min-chars', '10'])
    } finally {
      console.log = realLog
    }
    const localOutput = printed.join('\n')

    expect(exitCode).toBe(0)
    expect(localOutput).toContain('Scanned 1 commit')
    expect(localOutput).not.toContain(
      'none of those was followed by an edit of the same file without an agent marker',
    )
    expect(localOutput).toContain('a pairing takes 2 commits')
    expect(localOutput).toContain('too short to hold one yet')
    // The paragraph that reads an absent edit as evidence about where the
    // person works is withheld too. On one commit it is a recommendation
    // drawn from a search that never happened.
    expect(localOutput).not.toContain('your corrections are not on this branch')
  })

  it('a window big enough to search keeps the original sentences on both surfaces', async () => {
    // The guard, in the shape drift 7's block already uses. `unpairedFixture`
    // is the case the original sentences were written for and are true of: a
    // generation is present, two commits were read, and no later commit
    // edited the file. A fix that rewrote them on every zero would have
    // replaced one false reading with another.
    //
    // Note which fixture this is NOT. `editedFixture` at a floor above its
    // generation resolves a work unit and then drops it, so neither surface
    // reaches the empty-window branch at all and an assertion there would
    // pass without testing anything in it.
    const repo = unpairedFixture()
    const { ci, ciComment, localOutput } = await bothLaunches(repo, 10, [], {}, 'HEAD~2')
    expect([...ci.keys()]).toEqual([])

    expect(ciComment).toContain('2 commits in it')
    expect(ciComment).not.toContain('a pairing takes 2 commits')
    expect(ciComment).toContain(
      'no commit here carried an agent marker that a later human commit then edited',
    )

    expect(localOutput).toContain('Scanned 3 commits')
    expect(localOutput).not.toContain('a pairing takes 2 commits')
    expect(localOutput).toContain(
      'none of those was followed by an edit of the same file without an agent marker',
    )
    // And the pull-request paragraph, which drift 8 withholds on a
    // too-short history, is still printed here. This is the history it
    // was written about.
    expect(localOutput).toContain('your corrections are not on this branch')
  })

  it('states the minimum once, where both surfaces read it', () => {
    // The unit test under the four above. Both sentences assert this
    // number to a reader, and they are written separately on purpose, so
    // the number itself is the thing that must come from one place.
    expect(PAIR_MINIMUM_COMMITS).toBe(2)
    expect(windowTooSmallForAPair(0)).toBe(true)
    expect(windowTooSmallForAPair(1)).toBe(true)
    expect(windowTooSmallForAPair(2)).toBe(false)
    expect(windowTooSmallForAPair(400)).toBe(false)
  })

  it('an empty window is too small too, and says so without claiming one commit', () => {
    // A base equal to the head is a zero-commit range. Rendered directly
    // rather than through a fixture, because git will not produce this
    // window from a merged pull request and a reader of the sentence still
    // has to get a true one.
    const fields = runCommentFields([], [], {
      unitsAdded: 0, unitsReinforced: 0, mode: 'ci-no-model', reason: 'test',
    })
    const comment = renderRunComment(fields, {
      prNumber: 9, repo: 'o/r', range: 'aaa1111..aaa1111',
      windowNote: 'merge style undetermined', declarationBasis: 'undeclared',
      recordsPath: '.ursa/records', runUrl: null, commitsInWindow: 0,
    })
    expect(comment).toContain('this window holds 0')
    expect(comment).not.toContain('this window holds one commit')
    expect(comment).toContain('0 commits in it')
  })

  it('a caller that passes no count keeps the unconditional sentence and prints no count', () => {
    // The compatibility edge, asserted rather than assumed. `action.yml`
    // and `src/ci/run.ts` are not the only possible callers of this
    // renderer, and a caller with no count cannot tell a window that
    // found nothing from one that could not have found anything. Silence
    // is the honest output there, not a guess in either direction.
    const fields = runCommentFields([], [], {
      unitsAdded: 0, unitsReinforced: 0, mode: 'ci-no-model', reason: 'test',
    })
    const comment = renderRunComment(fields, {
      prNumber: 9, repo: 'o/r', range: 'aaa1111..bbb2222',
      windowNote: 'merge style undetermined', declarationBasis: 'undeclared',
      recordsPath: '.ursa/records', runUrl: null,
    })
    expect(comment).toContain('no commit here carried an agent marker that a later human commit then edited')
    expect(comment).not.toContain('a pairing takes 2 commits')
    expect(comment).toContain('- Commit window: `aaa1111..bbb2222`\n')
  })
})

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

  it('names a resolver on both sides, so the comparison above is not undefined vs undefined', async () => {
    // `comparable()` includes `task.resolvedBy`, and a projection that
    // compares a field neither record carries passes without testing
    // anything. This is the same vacuity check the violation fixtures
    // make for `signals`, `descent` and `exclusions` on their base
    // record (src/invariants.violations.test.ts).
    const repo = editedFixture()
    const { ci, local } = await bothLaunches(repo, 10)
    const [ciRec] = [...ci.values()]
    const [localRec] = [...local.values()]
    // Both launches run in-process here, out of this repository's own
    // work tree, so both resolve on the git basis.
    expect(ciRec.task.resolvedBy).toMatchObject({ basis: 'git_commit' })
    expect(localRec.task.resolvedBy).toEqual(ciRec.task.resolvedBy)
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
    // Against the derived count, not a hardcoded word: this assertion is
    // what would otherwise pin the stale "thirteen" the README carried for
    // four days after the fifteenth bound was added.
    expect(ciComment).toContain(`satisfies all ${BOUND_COUNT} of the bounds`)
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
 * The same three commits as `editedFixture`, with four unrelated commits
 * pushed in between the agent's commit and the person's edit of it, so
 * the pair is seven commits apart instead of one.
 *
 * This is the shape of a real repository with more than one writer, and
 * the shape this repository itself has: on 2026-10-18 its 724-commit
 * history resolved to zero records at the default distance of 25 and to
 * two at 400, because twelve agent seats commit between one touch of a
 * file by the owner and the next. A fixture whose pair is one commit
 * apart cannot see a distance bound at all, which is why this one exists
 * rather than reusing `editedFixture`.
 */
function distantFixture(): string {
  const dir = newRepo()
  writeFileSync(join(dir, 'README.md'), '# project\n')
  git(dir, ['add', '.'])
  git(dir, ['commit', '-q', '-m', 'Base'])

  writeFileSync(join(dir, 'digest.js'), GENERATED + '\n')
  git(dir, ['add', '.'])
  git(dir, ['commit', '-q', '-m', 'Generate digest module\n\nCo-Authored-By: Claude <noreply@anthropic.com>'])

  // Four commits by the same person, touching another file, so they are
  // neither generations nor edits of `digest.js`. They only add distance.
  for (let i = 1; i <= 4; i++) {
    writeFileSync(join(dir, `note-${i}.md`), `# note ${i}\n`)
    git(dir, ['add', '.'])
    git(dir, ['commit', '-q', '-m', `Unrelated note ${i}`])
  }

  const edited = GENERATED
    .replace('DIGEST — the latest research, summarized for you.', 'The frontier, read for you.')
    .replace('why it matters', 'so what')
  writeFileSync(join(dir, 'digest.js'), edited + '\n')
  git(dir, ['add', '.'])
  git(dir, ['commit', '-q', '-m', 'Tighten digest prose'])
  return dir
}

/**
 * One commit, and it is a generation: the agent writes `digest.js` and
 * nothing follows it.
 *
 * Drift 8's local case. `ursa run` has no merge window, so the only way
 * to hand it a history too short to hold a pairing is to give it a
 * repository that short. A pairing needs a generation and a LATER commit
 * editing the same file, and there is no later commit here at all, so the
 * walk classifies one generation and finds nothing to pair it with
 * without any bound firing.
 *
 * Deliberately a generation rather than an ordinary commit. With a marker
 * present, `looked > 0` holds and the pull-request paragraph is reachable,
 * which is the second sentence drift 8 withholds. A fixture whose one
 * commit carried no marker would exercise the first sentence and quietly
 * skip the second.
 */
function oneCommitFixture(): string {
  const dir = newRepo()
  writeFileSync(join(dir, 'digest.js'), GENERATED + '\n')
  git(dir, ['add', '.'])
  git(dir, ['commit', '-q', '-m', 'Generate digest module\n\nCo-Authored-By: Claude <noreply@anthropic.com>'])
  return dir
}

/**
 * Three commits with a generation in them and no edit of it: a README
 * base, the agent writing `digest.js`, and one unrelated commit of the
 * person's that touches another file.
 *
 * Drift 8's guard, and the history the sentences drift 8 narrows were
 * written for. Two commits are inside a `HEAD~2` merge window, so the
 * window is big enough for a pairing to have been possible, a generation
 * really is there, and no later commit edits it, so the walk searched and
 * found nothing with no bound firing. That is the one state where "none
 * of those was followed by an edit of the same file without an agent
 * marker" is a true claim, and it must survive the fix.
 */
function unpairedFixture(): string {
  const dir = newRepo()
  writeFileSync(join(dir, 'README.md'), '# project\n')
  git(dir, ['add', '.'])
  git(dir, ['commit', '-q', '-m', 'Base'])

  writeFileSync(join(dir, 'digest.js'), GENERATED + '\n')
  git(dir, ['add', '.'])
  git(dir, ['commit', '-q', '-m', 'Generate digest module\n\nCo-Authored-By: Claude <noreply@anthropic.com>'])

  writeFileSync(join(dir, 'note.md'), '# a note, not an edit of the generated file\n')
  git(dir, ['add', '.'])
  git(dir, ['commit', '-q', '-m', 'Add an unrelated note'])
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
