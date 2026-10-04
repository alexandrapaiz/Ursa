// Counterfactual measurement for deletion attribution.
//
// The question this answers, on real data rather than on a fixture: how
// much of what an outcome record calls the person's own discard depends
// on this clone happening to hold one merge commit?
//
// It resolves one pull request once against the clone as it is, then once
// per merge in the pull request with that merge's parentage withheld from
// BOTH sources the adapter reads — the `parents` field the GitHub API
// supplies on each commit, and the clone's own objects. That pair of
// withholdings is exactly the state a fork's pull request, a branch
// deleted after merge, or an `actions/checkout` at `fetch-depth: 1`
// leaves behind for one commit. Nothing else differs between runs.
//
// Usage, from the package root:
//   npx tsx tools/measure-attribution.ts <pr-number> <path-to-clone>
//
// Reads the GitHub API through `gh`, so it needs an authenticated gh and
// network. It writes nothing: records are resolved in memory and the
// totals are printed as JSON lines.

import { pairsFromPullRequest, episodesFromPullRequest, type RepoReader } from '../src/adapters/github-pr'
import { capturePullRequest } from '../src/adapters/gh'
import { gitRepoReader } from '../src/adapters/git-reader'
import { resolveEpisode } from '../src/bin/ursa'

const repo = process.env.URSA_REPO ?? 'alexandrapaiz/Ursa'
const num = Number(process.argv[2])
const project = process.argv[3]
if (!num || !project) {
  console.error('usage: npx tsx tools/measure-attribution.ts <pr-number> <path-to-clone>')
  process.exit(2)
}

const snap = capturePullRequest(repo, num, { noPatches: true, repoPath: project })
const inner = gitRepoReader(project)
/** the same floor `cli.ts run` applies, so the two agree on which records count */
const MIN_CHARS = 200

function totals(reader: RepoReader, hidden?: string) {
  const view = hidden
    ? { ...snap, commits: snap.commits.map((c) => (c.sha === hidden ? { ...c, parents: undefined } : c)) }
    : snap
  const episodes = episodesFromPullRequest(pairsFromPullRequest(view, reader), project)
  let records = 0, gross = 0, human = 0, merge = 0, unknown = 0
  for (const ep of episodes) {
    const r = resolveEpisode(project, ep)
    if (!r || r.stats.generated.totalChars < MIN_CHARS) continue
    records++
    gross += r.stats.generated.deletedChars
    human += r.stats.generated.humanDeletedChars
    merge += r.stats.generated.mergeDeletedChars
    unknown += r.stats.generated.unknownDeletedChars
  }
  return { records, gross, human, merge, unknown }
}

const merges = snap.commits.filter((c) => inner.parents(c.sha).length > 1).map((c) => c.sha)
console.log(`#${num}: ${snap.commits.length} commits, ${merges.length} of them merges`)
console.log(`complete clone      ${JSON.stringify(totals(inner))}`)
for (const hidden of merges) {
  const blind: RepoReader = {
    blobId: inner.blobId,
    parents: (sha) => (sha === hidden ? [] : inner.parents(sha)),
  }
  console.log(`without ${hidden.slice(0, 9)}   ${JSON.stringify(totals(blind, hidden))}`)
}
