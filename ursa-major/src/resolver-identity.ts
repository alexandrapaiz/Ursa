// Which code made this record's claims.
//
// WHY THE RECORD NEEDS THIS AT ALL. On 2026-10-12 this repository
// resolved one fixture repository twice, with two commits of this
// resolver, and wrote two records carrying the identical `task.id`
// (`declared-fixture-2026-10-12-5306fd3`) to the identical path, whose
// headline figure differed by a factor of eight: 3,626 characters
// `survived_verbatim` before, 423 after. The second overwrote the first.
// Both files were correct outputs of the code that produced them, only
// one was a true claim about the work, and nothing in either file named
// the code that wrote it. `schemaVersion` did not move, because it
// versions the record's SHAPE and not its JUDGEMENT, and the shape was
// the same both times.
//
// That is not a one-off. `src/invariants.ts` went from ten bounds to
// fifteen in six days, `src/corroborate.ts` changed when a similarity
// score is allowed to be called an edit, and `src/vendored.ts` changed
// which paths are classified at all. A lab holding two records bought two
// months apart holds claims made under different rules, and before this
// field there was no way for it to tell which rules applied to which
// record. The design documents that describe each change are in this
// repository; a buyer has the JSON.
//
// WHAT THE FIELD IS NOT. It is not a version number anybody maintains by
// hand, because the thing that went stale twice in this repository was
// exactly a number maintained by hand (see `BOUND_COUNT` in
// src/invariants.ts, and the "thirteen" that four documents carried for
// four days). It is read off the artifact the code shipped as.
//
// WHY A DISCRIMINATED UNION RATHER THAN ONE STRING. The two launches run
// this resolver as two different artifacts, and the identity available
// for each is a different KIND of fact, not a different spelling of one.
//
//   `ursa run` executes `src/bin/ursa.ts` through tsx, inside a git work
//   tree of this repository. The identity available is that tree's HEAD
//   commit, which a reader can look up — and a flag for whether the tree
//   had uncommitted changes, because the commit alone would then be a
//   claim about code that did not run.
//
//   `ursa ci` executes `dist/ursa.cjs`, one committed CommonJS file, with
//   whatever node the runner already has (see action.yml). GitHub
//   downloads an action as a tarball rather than cloning it, so on any
//   repository that is not this one there is no git work tree under the
//   bundle and no HEAD to read. What there is instead is the bundle's own
//   bytes, whose SHA-256 is already the identity `npm run bundle:check`
//   uses to decide whether the committed file is stale.
//
// Carrying the basis as a value, rather than flattening both into a
// `version: string` a consumer has to guess the meaning of, is the same
// choice `ExclusionReason` makes in src/types.ts: `imported_whole` means
// two blob object ids were compared and `declared_import` means a party
// said so, and a pipeline can filter on the difference without reading
// any prose. A `git_commit` basis is a pointer into a public history. A
// `bundle_digest` basis is a content hash with no history behind it. A
// consumer that wants only auditable records can select on the word.
// Since 2026-10-17 the history is published separately, so the content
// hash can be turned back into a commit: `docs/provenance/bundle-digests.md`
// holds one row per version of `dist/ursa.cjs` that has ever existed, and
// `npx tsx tools/make-bundle-digest-index.ts --lookup <digest>` reads it.
// That table is generated and checked by `npm test`; it is not a thing
// this module reads, because on the runner that writes the digest there
// is no repository to read it from.
//
// WHY NOT BAKE THE COMMIT INTO THE BUNDLE AT BUILD TIME, which is the
// obvious alternative: `dist/ursa.cjs` is committed, and
// `build/bundle.mjs --check` fails the suite when the committed bytes
// differ from a rebuild. Embedding HEAD would make the bundle's content a
// function of the commit that contains it, so every commit would need a
// bundle rebuild that changes the commit, and the check could never pass
// twice in a row. The digest costs one read of a file already on disk and
// has no such recursion.

import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { readFileSync, statSync } from 'node:fs'
import { dirname } from 'node:path'
import type { ResolverIdentity } from './types'

/**
 * The path of the script this process is running, which is the resolver's
 * own artifact on both launches and under the test runner.
 *
 * `process.argv[1]` rather than `import.meta.url` or `__dirname`, because
 * the one module that has to answer this question is also the one module
 * that is compiled twice: esbuild emits CommonJS for `dist/ursa.cjs`
 * (`format: 'cjs'` in build/bundle.mjs), where `import.meta` is empty and
 * warned about, and tsx runs the same source as ESM, where `__dirname`
 * does not exist. `process.argv[1]` is the same string in both, and it is
 * literally the path action.yml invokes:
 *
 *     node "$GITHUB_ACTION_PATH/dist/ursa.cjs" "${args[@]}"
 *
 * Empty when node was given no script (`node -e`), in which case there is
 * no artifact to identify and the caller gets `null`.
 */
function runningScript(): string | null {
  const argv1 = process.argv[1]
  if (!argv1) return null
  try {
    return statSync(argv1).isFile() ? argv1 : null
  } catch {
    return null
  }
}

/**
 * `git -C <dir> <args>`, or null when git refuses for any reason.
 *
 * stderr is dropped for the same reason `blobOid` in src/vendored.ts
 * drops it: "this is not a git work tree" is an expected answer on the
 * bundled path, not a failure worth printing to a user's terminal.
 */
function git(dir: string, args: string[]): string | null {
  try {
    return execFileSync('git', ['-C', dir, ...args], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim()
  } catch {
    return null
  }
}

/**
 * The identity of the resolver running in this process, or `null` when it
 * cannot be established.
 *
 * `null` is a real answer and the caller must keep it as absence rather
 * than substituting a word like `unknown`: `task.resolvedBy` missing says
 * nobody could tell, and that is a different claim from a record that
 * names a resolver. This is the same distinction `exclusions` already
 * draws between an absent array (the capture path cannot ask the
 * question) and an empty one (it asked and found nothing).
 *
 * @param scriptPath the artifact to identify. Defaults to the script this
 *   process is running, which is what every caller in the product wants;
 *   the parameter exists so a test can point it at a fixture instead of
 *   depending on how the test runner was launched.
 */
export function resolverIdentity(
  scriptPath: string | null = runningScript(),
): ResolverIdentity | null {
  if (scriptPath === null) return null

  const dir = dirname(scriptPath)
  // `--is-inside-work-tree` before `rev-parse HEAD`, because a bare
  // repository or a `.git` directory above an action tarball would answer
  // the second question and have no working tree the dirty flag could be
  // about.
  if (git(dir, ['rev-parse', '--is-inside-work-tree']) === 'true') {
    const commit = git(dir, ['rev-parse', '--short', 'HEAD'])
    if (commit) {
      // `--porcelain` over the whole tree, not over this file: the
      // question is whether the code that ran is the code at `commit`,
      // and the resolver is thirty modules. An untracked file is counted,
      // because a module that exists only in the working tree is exactly
      // the case where the commit would be a lie.
      const status = git(dir, ['status', '--porcelain'])
      return { basis: 'git_commit', commit, dirty: status === null || status.length > 0 }
    }
  }

  // No work tree: the running artifact's own bytes. Read in full rather
  // than streamed because the one file this fires on is `dist/ursa.cjs`,
  // a few hundred kilobytes, read once per process.
  try {
    const digest = createHash('sha256').update(readFileSync(scriptPath)).digest('hex')
    return { basis: 'bundle_digest', digest: digest.slice(0, 16) }
  } catch {
    return null
  }
}

let memo: { value: ResolverIdentity | null } | undefined

/**
 * `resolverIdentity()` computed once per process.
 *
 * Every record a launch writes is written by the same resolver, so a run
 * that resolves forty episodes would otherwise shell out to git eighty
 * times for forty copies of one answer. Memoized on the module rather
 * than inside `saveRecord`, so a test can call the un-memoized function
 * directly and get a fresh read.
 */
export function currentResolverIdentity(): ResolverIdentity | null {
  if (!memo) memo = { value: resolverIdentity() }
  return memo.value
}

/** Forget the memo. For tests that change what `process.argv[1]` is. */
export function resetResolverIdentityMemo(): void {
  memo = undefined
}

/**
 * One line naming a resolver, for a terminal or a pull request comment.
 *
 * Spelled in one place so the CLI, the viewer and the CI comment cannot
 * describe the same two bases three ways.
 */
export function formatResolverIdentity(identity: ResolverIdentity | null): string {
  if (!identity) return 'resolver not identified (no git work tree and no readable bundle)'
  if (identity.basis === 'git_commit') {
    return `resolver ${identity.commit}${identity.dirty ? ' (working tree had uncommitted changes)' : ''}`
  }
  return `resolver bundle sha256:${identity.digest}`
}
