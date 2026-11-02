// The PR adapter's command line: the capture and measurement commands
// that have no place in `ursa`.
//
//   npx tsx src/adapters/cli.ts snapshot --pr 11 [--repo owner/name] [--out f.json] [--no-patches]
//   npx tsx src/adapters/cli.ts pairs    --pr 11 [--repo owner/name] [--project .] [--snapshot f.json]
//   npx tsx src/adapters/cli.ts run      --pr 11 [--project .] [--min-chars 200] [--snapshot f.json]
//   npx tsx src/adapters/cli.ts survey   [--repo owner/name] [--state merged] [--limit 30]
//   npx tsx src/adapters/cli.ts fixture  --pr 11 --out fixtures/pr/ursa-pr-11.json
//
// `survey` is the one that answers the question this adapter was built
// for: of the pull requests in a repo, how many yield a correction, and
// through which closure.
//
// WHAT `run` IS NOW, AND WHY IT IS STILL HERE. `run` was the whole of the
// pull-request launch from the day the adapter shipped until 2026-11-02:
// it held its own resolve-and-write loop, which asked none of the three
// questions `src/launch.ts` exists to answer, and the header this comment
// replaced said why — folding it into `ursa pr` was "owed once PR #16
// lands", and PR #16 landed long ago. The loop now lives in
// `src/adapters/pr-launch.ts` and the user-facing surface is `ursa pr
// <projectPath> --pr N` (src/bin/ursa.ts). This subcommand is kept as a
// thin caller of the same function, because the other four commands here
// are an adapter's measurement tools and a reader who found `run` beside
// them should not be sent to a second binary to re-run the one thing it
// did. It cannot drift from `ursa pr`, because there is one function
// under both.

import { parseArgs } from 'node:util'
import { writeFileSync, readFileSync } from 'node:fs'
import { resolve as absPath } from 'node:path'
import { capturePullRequest, currentRepo, listPullRequests } from './gh'
import { fetchPullRequestRef, gitRepoReader } from './git-reader'
import { pairsFromPullRequest, type PullRequestPair, type PullRequestSnapshot } from './github-pr'
import { runPullRequestCommand } from './pr-command'
import { recordingReader } from './replay'

function loadSnapshot(path: string): PullRequestSnapshot {
  return JSON.parse(readFileSync(path, 'utf8')) as PullRequestSnapshot
}

/** Warn, by name, when the objects the adapter needs are not in the clone. */
function checkLocalObjects(projectPath: string, snap: PullRequestSnapshot): string[] {
  const reader = gitRepoReader(projectPath)
  const warnings: string[] = []
  if (snap.mergeCommitSha && reader.parents(snap.mergeCommitSha).length === 0) {
    warnings.push(
      `merge commit ${snap.mergeCommitSha.slice(0, 9)} is not in this clone, so merge-resolution and ` +
      `merge-as-accepted cannot be read. Fix: git -C ${projectPath} fetch --no-tags origin ${snap.baseRef}` +
      ` (add --unshallow on a shallow clone).`,
    )
  }
  return warnings
}

function pairsFor(projectPath: string, snap: PullRequestSnapshot): PullRequestPair[] {
  try {
    fetchPullRequestRef(projectPath, snap.number)
  } catch {
    // The head ref may already be local, or the remote may refuse it on a
    // closed PR. Either way the blob reads below decide, and a missing
    // object shows up as a skipped closure rather than as a crash.
  }
  return pairsFromPullRequest(snap, gitRepoReader(projectPath), {})
}

function closureCounts(pairs: PullRequestPair[]): Record<string, number> {
  const counts: Record<string, number> = {}
  for (const p of pairs) counts[p.pullRequest.closure] = (counts[p.pullRequest.closure] ?? 0) + 1
  return counts
}

export async function main(argv: string[]): Promise<number> {
  const { positionals, values } = parseArgs({
    args: argv,
    allowPositionals: true,
    options: {
      repo: { type: 'string' },
      pr: { type: 'string' },
      project: { type: 'string' },
      out: { type: 'string' },
      snapshot: { type: 'string' },
      state: { type: 'string' },
      limit: { type: 'string' },
      'min-chars': { type: 'string' },
      'no-patches': { type: 'boolean' },
    },
  })
  const [cmd] = positionals
  const projectPath = absPath(values.project ?? '.')
  const repo = values.repo ?? currentRepo(projectPath)

  if (cmd === 'snapshot') {
    if (!values.pr) { console.error('--pr is required'); return 2 }
    const snap = capturePullRequest(repo, Number(values.pr), {
      noPatches: values['no-patches'] === true,
      repoPath: projectPath,
    })
    const json = JSON.stringify(snap, null, 2)
    if (values.out) {
      writeFileSync(values.out, json + '\n')
      console.log(`${repo}#${snap.number}: ${snap.commits.length} commits, ${snap.reviewComments.length} review comments → ${values.out}`)
    } else {
      console.log(json)
    }
    return 0
  }

  if (cmd === 'pairs') {
    const snap = values.snapshot
      ? loadSnapshot(values.snapshot)
      : capturePullRequest(repo, Number(values.pr), { noPatches: values['no-patches'] === true, repoPath: projectPath })
    for (const w of checkLocalObjects(projectPath, snap)) console.error(`warning: ${w}`)
    const pairs = pairsFor(projectPath, snap)
    const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`
    console.log(
      `${snap.repo}#${snap.number} "${snap.title}": ${snap.outcome}, ` +
      `${plural(snap.commits.length, 'commit')}, ${plural(pairs.length, 'pair')}`,
    )
    for (const p of pairs) {
      console.log(
        `  ${p.pullRequest.closure.padEnd(17)} ${p.generatedSha.slice(0, 9)} -> ${p.finalSha.slice(0, 9)}  ` +
        `${plural(p.paths.length, 'path')}  accepted=${p.pullRequest.acceptance.accepted}` +
        (p.pullRequest.statedCorrections.length ? `  stated=${p.pullRequest.statedCorrections.length}` : '') +
        // Printed because it changes what a deletion on this pair means:
        // text that vanished at one of these boundaries is not a discard.
        (p.interveningMerges.length
          ? `  merges=${p.interveningMerges.map((m) => m.sha.slice(0, 9)).join(',')}`
          : '') +
        (p.pullRequest.unreadableMerges?.length
          ? `  unreadable-merges=${p.pullRequest.unreadableMerges.map((m) => m.slice(0, 9)).join(',')}`
          : ''),
      )
    }
    return 0
  }

  if (cmd === 'run') {
    // One implementation, in `src/adapters/pr-command.ts`, shared with
    // `ursa pr`. This subcommand is the same command under an older
    // name; it cannot report a different number from `ursa pr` because
    // there is nothing here to report one with.
    return runPullRequestCommand({
      projectPath,
      pr: values.pr ?? null,
      repo,
      snapshotPath: values.snapshot ?? null,
      minChars: values['min-chars'] ? Number(values['min-chars']) : undefined,
      noPatches: values['no-patches'] === true,
    })
  }

  if (cmd === 'fixture') {
    if (!values.pr || !values.out) { console.error('--pr and --out are required'); return 2 }
    const snap = capturePullRequest(repo, Number(values.pr), { noPatches: true, repoPath: projectPath })
    for (const w of checkLocalObjects(projectPath, snap)) console.error(`warning: ${w}`)
    try { fetchPullRequestRef(projectPath, snap.number) } catch { /* see pairsFor */ }
    const { reader, recorded } = recordingReader(gitRepoReader(projectPath))
    const pairs = pairsFromPullRequest(snap, reader, {})
    writeFileSync(values.out, JSON.stringify({ snapshot: snap, repo: recorded }, null, 2) + '\n')
    console.log(
      `${repo}#${snap.number}: ${pairs.length} pairs ${JSON.stringify(closureCounts(pairs))}, ` +
      `${Object.keys(recorded.blobs).length} blob lookups recorded → ${values.out}`,
    )
    return 0
  }

  if (cmd === 'survey') {
    const state = (values.state ?? 'all') as 'all' | 'merged' | 'open'
    const limit = Number(values.limit ?? 30)
    const totals: Record<string, number> = {}
    let withCorrection = 0
    const prs = listPullRequests(repo, state, limit)
    for (const { number, title } of prs) {
      const snap = capturePullRequest(repo, number, { noPatches: true, repoPath: projectPath })
      const pairs = pairsFor(projectPath, snap)
      const counts = closureCounts(pairs)
      for (const [k, v] of Object.entries(counts)) totals[k] = (totals[k] ?? 0) + v
      const corrections = (counts['branch-edit'] ?? 0) + (counts['merge-resolution'] ?? 0)
      if (corrections > 0) withCorrection++
      console.log(
        `#${String(number).padStart(3)} ${snap.outcome.padEnd(16)} ` +
        `commits=${String(snap.commits.length).padStart(3)} comments=${String(snap.reviewComments.length).padStart(2)} ` +
        `pairs=${String(pairs.length).padStart(3)} ${JSON.stringify(counts)}  ${title.slice(0, 48)}`,
      )
    }
    console.log(`\n${prs.length} pull requests, ${withCorrection} carrying a correction (branch-edit or merge-resolution).`)
    console.log(`closures: ${JSON.stringify(totals)}`)
    return 0
  }

  console.error('Usage: cli.ts snapshot|pairs|run|survey|fixture --pr N [--repo owner/name] [--project .] [--snapshot f.json]')
  console.error('  `run` is also `ursa pr <projectPath> --pr N`, which is the same function (src/adapters/pr-launch.ts).')
  return 2
}

const invokedDirectly = process.argv[1]?.endsWith('adapters/cli.ts')
if (invokedDirectly) {
  main(process.argv.slice(2)).then((code) => process.exit(code))
}
