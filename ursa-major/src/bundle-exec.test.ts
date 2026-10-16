// `dist/ursa.cjs` — the only resolver a customer ever runs, executed.
//
// WHY THIS FILE EXISTS. Until today no test in this repository had ever
// loaded the committed bundle. It had been executed exactly once, by
// hand, on 2026-10-08, and that run is recorded in
// `docs/design/resolver-action.md` §8.2 as "the reconciled bundle
// against a throwaway git repository and a fake GitHub, exit 0". One
// by-hand run eight days ago is evidence about the bundle that existed
// eight days ago, and `git log --since=2026-10-08 -- dist/ursa.cjs`
// lists fourteen commits that have rebuilt it since. `action.yml`
// invokes
//
//     node "$GITHUB_ACTION_PATH/dist/ursa.cjs" "${args[@]}"
//
// and GitHub downloads an action as a tarball rather than cloning it, so
// on every repository that is not this one `dist/ursa.cjs` is the whole
// product. Its entire guarantee was `npm run bundle:check`, which
// rebuilds with esbuild and compares bytes. That proves the bytes
// correspond to the current source and proves nothing about whether they
// execute, and the two can come apart for a reason this project already
// documented: `build/bundle.mjs` targets CommonJS while the source is
// ESM, which is why `src/bin/bundle-entry.ts` exists at all, and
// `src/resolver-identity.ts` records one case where `import.meta` is
// empty in the bundle and populated under tsx. A divergence of that kind
// would be invisible to every other test here and would surface as a
// failed customer-facing CI run.
//
// The gap was named precisely, by the test that could not close it.
// `comparable()` in `src/launch-parity.test.ts` carries `task.gatedBy`
// with a comment saying the field can only disagree between the two
// launches if `dist/ursa.cjs` is stale against `src/invariants.ts`, and
// then says in the next paragraph that the line "does not catch that
// staleness and is not claimed to", because both launches in that test
// call `runCi` in-process from `src/`. The bundle was never loaded. This
// file closes exactly that: the last describe block below runs the
// bundle, reads the record it wrote off disk, and compares its
// `task.gatedBy` against `currentGateIdentity()` computed in this
// process from `src/invariants.ts`.
//
// WHY THAT IS A DIFFERENT CHECK FROM `bundle:check`, which is the
// obvious objection, since both are about staleness. `bundle:check`
// answers "do the committed bytes equal a rebuild of today's source".
// This answers "does the program those bytes make, when run, apply
// today's rules". The first is a question about a file and the second is
// a question about behaviour, and the bundle can satisfy the first and
// fail the second by throwing on load or by resolving a different module
// than the source tree does. Both are asserted here, the byte check by
// spawning `build/bundle.mjs --check` rather than reimplementing it, so
// a run that forgets the separate script no longer ships a stale bundle
// with a green suite.
//
// Ledger: "Nothing in this repository has ever run `dist/ursa.cjs`"
// (docs/ideas.md, 2026-10-16).

import { execFileSync, spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { beforeAll, describe, expect, it } from 'vitest'
import { checkRecord, currentGateIdentity } from './invariants'
import type { OutcomeRecord } from './types'

/** The committed bundle, relative to the package root vitest runs in. */
const BUNDLE = join('dist', 'ursa.cjs')

/**
 * The environment the bundle is spawned with.
 *
 * Every `GITHUB_*` name `src/bin/ursa.ts` and `src/ci/run.ts` read is
 * removed, which is not tidiness. This suite's own CI runs inside GitHub
 * Actions, where `GITHUB_EVENT_PATH` points at the real workflow event
 * and `GITHUB_TOKEN` is a live token. Measured while writing this file:
 * `ursa ci /tmp` with no `--repo` and no `--event` printed "ursa ci needs
 * --repo owner/name or GITHUB_REPOSITORY" and exited 2 on a clean
 * environment, and on the inherited one it read the surrounding
 * workflow's event payload and exited 0 instead. A test that inherited
 * the environment would therefore assert something different depending
 * on where it ran, and the version that passes locally would be the
 * version that tests nothing in CI.
 */
function cleanEnv(): NodeJS.ProcessEnv {
  const env: NodeJS.ProcessEnv = {}
  for (const [k, v] of Object.entries(process.env)) {
    if (k.startsWith('GITHUB_') || k.startsWith('INPUT_')) continue
    if (k === 'ANTHROPIC_API_KEY' || k === 'CLAUDE_CODE_OAUTH_TOKEN') continue
    env[k] = v
  }
  return env
}

/** Spawn the bundle as the Action spawns it, and return all three results. */
function runBundle(
  bundlePath: string,
  args: string[],
  extraEnv: NodeJS.ProcessEnv = {},
): { status: number; stdout: string; stderr: string } {
  const r = spawnSync(process.execPath, [bundlePath, ...args], {
    encoding: 'utf8',
    env: { ...cleanEnv(), ...extraEnv },
    // Large enough for the run comment, which the ci launch prints in
    // full under --no-post. The default 1MB truncates nothing today;
    // naming it keeps a longer comment from turning into a mystery.
    maxBuffer: 16 * 1024 * 1024,
  })
  if (r.error) throw r.error
  return { status: r.status ?? -1, stdout: r.stdout, stderr: r.stderr }
}

describe('the committed bundle runs at all', () => {
  it('prints the usage block and exits 2 when given no arguments', () => {
    const { status, stderr } = runBundle(BUNDLE, [])

    // The cheapest assertion that separates "the bytes match a rebuild"
    // from "the bytes are a program node can load and run". A bundle
    // that threw on load would exit 1 with a stack trace here, and the
    // 201KB of inlined dependencies between the banner and `main()`
    // would all have been evaluated to get this far.
    expect(status).toBe(2)
    expect(stderr).toContain('Usage: ursa run <projectPath>')
    // Every subcommand the bundle is supposed to offer, so a bundler
    // change that drops one from the dispatch is visible here and not
    // only on a customer's runner.
    expect(stderr).toContain('ursa ci <projectPath>')
    expect(stderr).toContain('ursa consent show|grant|revoke|disclose|revoke-axiom')
    expect(stderr).toContain('ursa forget <projectPath>')
  })

  it('exits 2 on a subcommand it does not have, rather than throwing', () => {
    // Same exit code as no arguments, deliberately: `src/bin/ursa.ts`
    // treats an unknown verb as a usage error. The assertion is that
    // the bundle agrees, because a CommonJS entrypoint that lost the
    // `main()` return value would exit 0 here and the Action would
    // report a successful run that resolved nothing.
    expect(runBundle(BUNDLE, ['frobnicate', tmpdir()]).status).toBe(2)
  })

  it('refuses each `ursa ci` argument it needs, with the message that names it', () => {
    const cases: Array<[string[], string]> = [
      [['ci', tmpdir()], 'ursa ci needs --repo owner/name or GITHUB_REPOSITORY'],
      [['ci', tmpdir(), '--repo', 'o/r'], 'ursa ci needs --event <path> or GITHUB_EVENT_PATH'],
    ]
    for (const [args, message] of cases) {
      const { status, stderr } = runBundle(BUNDLE, args)
      expect(status, `ursa ${args.join(' ')}`).toBe(2)
      expect(stderr, `ursa ${args.join(' ')}`).toContain(message)
    }
  })

  it('tells a user the bridge is not in the bundle, instead of resolving a wrong path', () => {
    // `build/bundle.mjs` replaces `src/bridge/index` with a stub that
    // throws this sentence, because the bridge tails a session log on a
    // person's own machine and re-invokes the CLI through `npx tsx` and
    // `import.meta.dirname`, none of which means anything inside a
    // CommonJS file on a runner. That esbuild plugin had never been
    // executed by a test either: a stub that silently returned instead
    // of throwing would have passed `bundle:check` and left `ursa
    // bridge` on the bundled path exiting 0 having done nothing.
    //
    // `URSA_PASSPHRASE` is set because the stub is NOT the first thing
    // `ursa bridge` hits. Measured while writing this test: without it
    // the bundle exits 2 on "a passphrase is required; it derives the
    // key and the blob id", which is `src/bin/ursa.ts` refusing the
    // arguments before any bridge module is loaded. That refusal is
    // correct and it is not this assertion's subject, so the value here
    // is a throwaway whose only job is to get past it and reach the
    // stubbed import. It encrypts nothing: the process throws on the
    // next line.
    const { status, stderr } = runBundle(BUNDLE, ['bridge', tmpdir()], { URSA_PASSPHRASE: 'not-a-real-passphrase' })
    expect(status).toBe(1)
    expect(stderr).toContain('ursa bridge is not in the single-file bundle')
    expect(stderr).toContain('npx tsx src/bin/ursa.ts bridge <project>')
  })

  it('is byte-current against a rebuild of the source it claims to be', () => {
    // `npm run bundle:check` by its real name, spawned rather than
    // reimplemented so there is one definition of "stale". It was a
    // separate script outside `npm test` until this line, which meant a
    // run that edited `src/` and forgot it shipped a bundle one commit
    // behind the rules it was sold as applying, with a green suite.
    const r = spawnSync(process.execPath, [join('build', 'bundle.mjs'), '--check'], {
      encoding: 'utf8',
      env: cleanEnv(),
    })
    expect(r.stdout + r.stderr).toContain('is current')
    expect(r.status).toBe(0)
  })
})

/**
 * The tarball case: the bundle alone in a directory with no git work tree
 * anywhere above it.
 *
 * This is not an edge case, it is the only case that ships. GitHub
 * downloads an action as a tarball, so `$GITHUB_ACTION_PATH` on a
 * customer's runner holds the repository's files and no `.git`. Running
 * the bundle from this repository's own `dist/` instead would exercise
 * the `git_commit` branch of `resolverIdentity()` and never the
 * `bundle_digest` branch, which is the branch every customer record is
 * stamped by. Measured while writing this file: from `ursa-major/dist`
 * the run comment said `resolver b9793b1`; from a copy in a bare
 * temporary directory it said `resolver bundle sha256:d325430704...`.
 */
describe('the bundle resolves a repository the way a customer runner does', () => {
  let record: OutcomeRecord
  let stdout: string
  let status: number
  let bundleDigest: string

  beforeAll(() => {
    bundleDigest = createHash('sha256').update(readFileSync(BUNDLE)).digest('hex').slice(0, 16)

    const actionPath = mkdtempSync(join(tmpdir(), 'ursa-action-'))
    mkdirSync(join(actionPath, 'dist'))
    const bundle = join(actionPath, 'dist', 'ursa.cjs')
    copyFileSync(BUNDLE, bundle)
    // The premise of this whole block. If the temporary directory were
    // ever inside a work tree, every assertion below about
    // `bundle_digest` would silently become an assertion about
    // `git_commit`, and the test would still pass on the wrong branch.
    expect(gitSays(join(actionPath, 'dist'), ['rev-parse', '--is-inside-work-tree'])).not.toBe('true')

    const project = editedFixture()
    const head = git(project, ['rev-parse', 'HEAD'])
    const eventPath = join(project, 'event.json')
    writeFileSync(eventPath, JSON.stringify({
      repository: { full_name: 'o/r' },
      pull_request: {
        number: 1, merged: true, merge_commit_sha: null,
        base: { sha: git(project, ['rev-parse', `${head}~2`]) }, head: { sha: head },
      },
    }))

    // The literal invocation action.yml makes, minus the token: the
    // fixture repository `o/r` does not exist, so the reaction read 404s
    // and `--no-post` prints the comment instead of writing it. Both are
    // the documented behaviour of a first dry run, which is what the
    // `post-comment: false` input in action.yml exists for.
    const run = runBundle(bundle, [
      'ci', project,
      '--repo', 'o/r',
      '--event', eventPath,
      '--min-chars', '10',
      '--no-post',
    ])
    status = run.status
    stdout = run.stdout

    const dir = join(project, '.ursa', 'records')
    const files = readdirSync(dir).filter((f) => f.endsWith('.json'))
    expect(files, 'the bundled ci launch wrote exactly one record').toHaveLength(1)
    record = JSON.parse(readFileSync(join(dir, files[0]), 'utf8')) as OutcomeRecord
  })

  it('exits 0 and resolves the one episode in the fixture', () => {
    expect(status).toBe(0)
    expect(stdout).toContain('ursa ci: 1 work units found, 1 resolved')
  })

  it('writes a record whose span classes carry the characters the edit kept', () => {
    // Not a golden file. The point is that the bundle produced a record
    // with real figures in it rather than an empty shell: the fixture's
    // human commit rewrites two phrases of a generated module, so some
    // characters survive untouched and some survive edited, and both
    // counts have to be positive for the resolve to have happened.
    expect(record.stats.byClass.survived_verbatim.chars).toBeGreaterThan(0)
    expect(record.stats.byClass.survived_mutated.chars).toBeGreaterThan(0)
    expect(record.files.map((f) => f.path)).toContain('digest.js')
  })

  it('stamps the record with the bundle_digest basis, not a git commit', () => {
    // The branch of `resolverIdentity()` that every customer record is
    // written by, reached for the first time by running the artifact
    // instead of by passing a fixture path to the function.
    expect(record.task.resolvedBy).toEqual({ basis: 'bundle_digest', digest: bundleDigest })
    expect(stdout).toContain(`resolver bundle sha256:${bundleDigest}`)
  })

  it('applies the bound set this source tree declares, which is what bundle:check cannot say', () => {
    // THE ASSERTION THIS FILE WAS WRITTEN FOR. `currentGateIdentity()`
    // is computed in this process from `src/invariants.ts`.
    // `record.task.gatedBy` was computed inside the bundle, by code
    // esbuild compiled from the same module into CommonJS, in a
    // different process, out of a directory with no source tree in it.
    // Equality here is the only evidence in this repository that the
    // rules a customer's records are checked against are the rules this
    // repository documents.
    //
    // It fails loudly in the one case the parity test named and could
    // not reach: a commit that adds a bound to `src/invariants.ts` and
    // forgets `npm run bundle:check` leaves the bundle applying the old
    // set, and the digests diverge here even though every in-process
    // test still passes.
    const mine = currentGateIdentity()
    expect(record.task.gatedBy).toEqual(mine)
    expect(stdout).toContain(`\`${mine.boundsDigest}\`, over ${mine.codes.length} bounds`)
  })

  it('writes a record the gate in this source tree accepts', () => {
    // Gate parity across the compile boundary, which the digest
    // comparison above does not give on its own: two builds can agree
    // on which rules exist and disagree on whether a record satisfies
    // them. Checking the bundle's output with this tree's `checkRecord`
    // asks the second question.
    expect(checkRecord(record).map((v) => v.code)).toEqual([])
  })
})

// ---------------------------------------------------------------------------
// The fixture repository.
//
// Deliberately the same three commits as `editedFixture()` in
// `src/launch-parity.test.ts` and the fixture in `src/ci/ci.test.ts`: a
// base, an agent commit carrying a `Co-Authored-By` trailer, and the
// person's edit of it. Copied rather than imported because importing a
// helper out of another test file couples two suites that fail for
// different reasons, and because the three commits are the subject here
// rather than the method. If the two drift, the parity test is the one
// that owns the shape.
// ---------------------------------------------------------------------------

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

/** `git` that returns the refusal instead of throwing it. */
function gitSays(cwd: string, args: string[]): string | null {
  try {
    return execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim()
  } catch {
    return null
  }
}

const GENERATED = [
  'export function digest() {',
  '  const items = fetchItems()',
  "  const summary = items.map(formatItem).join('\\n')",
  "  return 'DIGEST — the latest research, summarized for you.\\n' + summary",
  '}',
  'function formatItem(i) { return `- ${i.title}: ${i.claim} — why it matters: ${i.why}` }',
].join('\n')

function editedFixture(): string {
  const dir = mkdtempSync(join(tmpdir(), 'ursa-bundle-project-'))
  git(dir, ['init', '-q', '-b', 'main'])
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
