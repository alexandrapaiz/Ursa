// `ursa pr <projectPath> --pr N`: the one command layer over the
// pull-request launch.
//
// Split from `src/adapters/pr-launch.ts` so that the launch itself takes
// a captured snapshot and touches no network, and split from
// `src/adapters/cli.ts` so that `src/bin/ursa.ts` can reach it without
// importing a module whose last two lines run `main()` when
// `process.argv[1]` looks like that file.
//
// Both surfaces call this: `ursa pr` dispatches here, and
// `src/adapters/cli.ts run` does too. There is therefore one capture
// rule, one summary, one gate report and one exit code for the
// pull-request path, which is what the drift list at the top of
// `pr-launch.ts` is about.

import { readFileSync } from 'node:fs'
import { capturePullRequest, currentRepo } from './gh'
import { fetchPullRequestRef, gitRepoReader } from './git-reader'
import type { PullRequestSnapshot } from './github-pr'
import { PR_LAUNCH_MIN_CHARS, renderPullRequestSummary, runPullRequestLaunch } from './pr-launch'
import { formatResolverIdentity } from '../resolver-identity'

export interface PullRequestCommandOptions {
  projectPath: string
  /** the pull request number, as typed. Ignored when `snapshotPath` is set. */
  pr: string | null
  /** `owner/name`. Defaults to the clone's own `origin` remote. */
  repo?: string | null
  /**
   * A snapshot captured earlier by `cli.ts snapshot`. Present means no
   * `gh` call and no network: the command reads the pull request's
   * metadata off disk and only asks git for blobs.
   */
  snapshotPath?: string | null
  minChars?: number
  /** `--no-patches` on the capture, which drops review-comment hunks. */
  noPatches?: boolean
  out?: (line: string) => void
  err?: (line: string) => void
}

export function runPullRequestCommand(opts: PullRequestCommandOptions): number {
  const out = opts.out ?? ((l: string) => console.log(l))
  const err = opts.err ?? ((l: string) => console.error(l))
  const { projectPath } = opts

  if (!opts.snapshotPath && !opts.pr) {
    err('ursa pr needs --pr N, or --snapshot <file> for a pull request captured earlier')
    return 2
  }

  let snapshot: PullRequestSnapshot
  if (opts.snapshotPath) {
    snapshot = JSON.parse(readFileSync(opts.snapshotPath, 'utf8')) as PullRequestSnapshot
  } else {
    const number = Number(opts.pr)
    if (!Number.isInteger(number) || number <= 0) {
      err(`ursa pr: --pr ${opts.pr} is not a pull request number`)
      return 2
    }
    snapshot = capturePullRequest(opts.repo || currentRepo(projectPath), number, {
      noPatches: opts.noPatches === true,
      repoPath: projectPath,
    })
  }

  // Named, before any figure is printed, because a merge commit this
  // clone cannot read changes what a deletion inside the pull request
  // means: it becomes `unknown` rather than the person's discard
  // (src/deletion.ts).
  const reader = gitRepoReader(projectPath)
  if (snapshot.mergeCommitSha && reader.parents(snapshot.mergeCommitSha).length === 0) {
    err(
      `warning: merge commit ${snapshot.mergeCommitSha.slice(0, 9)} is not in this clone, so ` +
      'merge-resolution and merge-as-accepted cannot be read. Fix: ' +
      `git -C ${projectPath} fetch --no-tags origin ${snapshot.baseRef}` +
      ' (add --unshallow on a shallow clone).',
    )
  }
  // Best effort. The head ref may already be local, or the remote may
  // refuse it on a closed pull request; either way a missing object shows
  // up below as a skipped closure rather than as a crash.
  try { fetchPullRequestRef(projectPath, snapshot.number) } catch { /* see above */ }

  const result = runPullRequestLaunch({
    projectPath,
    snapshot,
    reader,
    minChars: opts.minChars ?? PR_LAUNCH_MIN_CHARS,
  })
  out(renderPullRequestSummary(snapshot, result, projectPath))

  const unreadable = [...new Set(result.episodes.flatMap((ep) => ep.pullRequest.unreadableMerges ?? []))]
  if (unreadable.length > 0) {
    out(
      `\nwarning: ${unreadable.length} intervening merge${unreadable.length === 1 ? '' : 's'} could not be read ` +
      `(${unreadable.map((x) => x.slice(0, 9)).join(', ')}), so a deletion at those boundaries ` +
      "is reported as unknown rather than as the person's discard. " +
      `Fix: git -C ${projectPath} fetch --no-tags origin ${snapshot.baseRef}.`,
    )
  }

  // Which build made the claims above, and which rules they were checked
  // against. Printed for the same reason `ursa run` prints it: the
  // figures above moved by a factor of eight between two commits of this
  // resolver on 2026-10-12 and the terminal gave no sign of it. Read off
  // the record rather than from the process, because `saveRecord`
  // preserves an existing stamp and never rewrites it.
  if (result.records.length > 0) {
    out(`Resolved by: ${formatResolverIdentity(result.records[0].task.resolvedBy ?? null)}`)
    const gate = result.records[0].task.gatedBy
    if (gate) out(`Checked against: ${gate.codes.length} bounds, set \`${gate.boundsDigest}\``)
  }

  // The gate's verdict is the exit code, and the records are already on
  // disk: an impossible record is still the evidence of the defect.
  if (result.gate.violations.length > 0) err(`\n${result.gate.report}`)
  return result.exitCode
}
