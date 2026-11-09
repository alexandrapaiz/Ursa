// `ursa corpus <projectPath> --prs 645,647,649`: the pull-request launch run
// over many pull requests, reported as one corpus.
//
// Split from `src/corpus.ts` for the reason that file's header gives: the
// counting is pure and this is the I/O. Split from `src/adapters/pr-command.ts`
// because that file is one pull request's command — it prints a summary, warns
// about an unreadable merge and returns the gate's exit code — and a sweep
// needs the launch without the per-unit printing.
//
// WHAT IT DOES NOT DO, deliberately. It does not re-implement the launch. Every
// entry below goes through `runPullRequestLaunch`, which is the function that
// asks the three decisions `src/launch.ts` holds for every launch (the size
// floor, erasure, the invariant gate). A sweep that resolved episodes itself
// would be drift 12 in the list at the top of `src/adapters/pr-launch.ts`, and
// that list is eleven entries long because three callers each grew their own
// loop.

import { capturePullRequest, currentRepo } from './adapters/gh'
import { fetchPullRequestRef, gitRepoReader } from './adapters/git-reader'
import { PR_LAUNCH_MIN_CHARS, runPullRequestLaunch } from './adapters/pr-launch'
import { renderCorpus, type CorpusEntry } from './corpus'

export interface CorpusCommandOptions {
  projectPath: string
  /** pull request numbers, already parsed */
  prs: number[]
  /** `owner/name`. Defaults to the clone's own `origin` remote. */
  repo?: string | null
  minChars?: number
  /** `--no-patches` on each capture, which drops review-comment hunks. */
  noPatches?: boolean
  /** one sentence naming the window, passed through to `renderCorpus` */
  window?: string
  out?: (line: string) => void
  err?: (line: string) => void
}

/**
 * Resolve each pull request in turn and print one corpus report.
 *
 * Exit codes, which differ from `ursa pr` on purpose. `ursa pr` returns the
 * gate's verdict on one pull request, because there the records it just wrote
 * are the whole answer. A sweep's answer is the corpus, and a single
 * unreachable pull request in a list of sixty must not suppress it. So a
 * capture that fails becomes a refusal row with its reason, the sweep
 * continues, and the exit code is:
 *
 *   0  every entry was measured and the gate found nothing
 *   1  the gate found a violation in some entry's records
 *   2  no entry could be measured at all, so there is no corpus to report
 */
export function runCorpusCommand(opts: CorpusCommandOptions): number {
  const out = opts.out ?? ((l: string) => console.log(l))
  const err = opts.err ?? ((l: string) => console.error(l))
  const { projectPath } = opts

  if (opts.prs.length === 0) {
    err('ursa corpus needs --prs N,N,N: the pull requests to sweep')
    return 2
  }

  const repo = opts.repo || currentRepo(projectPath)
  const reader = gitRepoReader(projectPath)
  const minChars = opts.minChars ?? PR_LAUNCH_MIN_CHARS
  const entries: CorpusEntry[] = []

  for (const number of opts.prs) {
    const label = `${repo}#${number}`
    // Progress on stderr, so `ursa corpus … > corpus.md` writes the report
    // and nothing else. A sweep of sixty pull requests takes minutes and a
    // silent one is indistinguishable from a hung one.
    err(`ursa corpus: ${label}`)

    let entry: CorpusEntry
    try {
      const snapshot = capturePullRequest(repo, number, {
        noPatches: opts.noPatches === true,
        repoPath: projectPath,
      })
      // Best effort, same as `ursa pr`: a head ref the remote refuses on a
      // closed pull request shows up below as a skipped closure, not a crash.
      try { fetchPullRequestRef(projectPath, snapshot.number) } catch { /* see above */ }

      const result = runPullRequestLaunch({ projectPath, snapshot, reader, minChars })
      entry = {
        label,
        workUnits: result.episodes.length,
        records: result.records,
        belowMinChars: result.dropped.belowMinChars,
        unresolvable: result.dropped.unresolvable,
        erased: result.erased.length,
        violations: result.gate.violations.length,
      }
      // A merge commit absent from the clone changes what a deletion inside
      // the pull request MEANS (`src/deletion.ts` reports it as unknown
      // rather than as the person's discard), so the row says so instead of
      // reporting a figure whose basis the reader cannot see.
      if (snapshot.mergeCommitSha && reader.parents(snapshot.mergeCommitSha).length === 0) {
        entry.refusal = `merge commit ${snapshot.mergeCommitSha.slice(0, 9)} not in this clone`
      }
    } catch (e) {
      entry = {
        label,
        workUnits: 0,
        records: [],
        belowMinChars: 0,
        unresolvable: 0,
        erased: 0,
        violations: 0,
        refusal: `could not capture: ${e instanceof Error ? e.message.split('\n')[0] : String(e)}`,
      }
    }
    entries.push(entry)
  }

  const measured = entries.filter((e) => !e.refusal || e.records.length > 0)
  if (measured.length === 0) {
    err(
      `ursa corpus: none of the ${entries.length} pull request(s) could be measured, so there is ` +
      'no corpus to report. The reasons, one per line:',
    )
    for (const e of entries) err(`  ${e.label}: ${e.refusal}`)
    return 2
  }

  const window = opts.window ?? defaultWindow(repo, opts.prs)
  out(renderCorpus(entries, window))
  out('')
  out(`Records: ${projectPath}/.ursa/records/`)

  return entries.some((e) => e.violations > 0) ? 1 : 0
}

/**
 * The window sentence used when the caller names none. It states the three
 * things that change the figures: which repository, how many pull requests,
 * and which ones, by their own numbers rather than as a range, because a
 * list with gaps in it is not the range it looks like.
 */
export function defaultWindow(repo: string, prs: number[]): string {
  const asked = [...prs].sort((a, b) => a - b)
  return (
    `${asked.length} pull request(s) of ${repo}, resolved through the pull-request launch ` +
    `on ${new Date().toISOString().slice(0, 10)}: ` +
    `#${asked.join(', #')}`
  )
}

/**
 * Parse `--prs`. Accepts a comma-separated list and inclusive `A-B` ranges,
 * which is what makes a sixty-pull-request sweep typable, and refuses rather
 * than silently dropping anything it cannot read as a number.
 *
 * @returns the numbers in the order given, de-duplicated, or a reason
 */
export function parsePrList(spec: string): { prs: number[] } | { error: string } {
  const seen = new Set<number>()
  const prs: number[] = []
  for (const piece of spec.split(',').map((s) => s.trim()).filter(Boolean)) {
    const range = /^(\d+)-(\d+)$/.exec(piece)
    if (range) {
      const lo = Number(range[1])
      const hi = Number(range[2])
      if (lo > hi) return { error: `--prs ${piece} counts down; write ${hi}-${lo}` }
      for (let n = lo; n <= hi; n += 1) {
        if (!seen.has(n)) { seen.add(n); prs.push(n) }
      }
      continue
    }
    const n = Number(piece)
    if (!Number.isInteger(n) || n <= 0) return { error: `--prs ${piece} is not a pull request number` }
    if (!seen.has(n)) { seen.add(n); prs.push(n) }
  }
  if (prs.length === 0) return { error: '--prs was empty' }
  return { prs }
}
