// Resolving one work unit: the step that turns one generated→edited commit
// pair into an outcome record. Shared by both launches, `ursa run` (typed
// by a person against a finished project, src/bin/ursa.ts) and `ursa ci`
// (fired by a merged pull request on a runner, src/ci/run.ts).
//
// It lives here rather than in src/bin/ursa.ts so the CI launch does not
// import the CLI entrypoint, which src/bin/ursa.ts dynamically imports
// back (`await import('../ci/run')`) and which would be a cycle in the
// one-file bundle.
//
// RECONCILED 2026-10-08. This module arrived on the resolver-Action
// branch (PR #92, 2026-10-05) as a copy of the function as it stood that
// day, taken before `main` grew the import refusal (src/vendored.ts),
// descent corroboration (src/corroborate.ts), the deploy detector
// (src/deploy.ts) and the exclusion-only record. Merging the branch
// unchanged would have left the CI launch resolving with a resolver four
// features older than the local launch, silently: same name, same
// signature, different behaviour, and no test comparing the two. So the
// stale copy was deleted and `main`'s version moved here whole. There is
// now exactly one definition, and src/bin/ursa.ts re-exports it for the
// eight test files and src/adapters/cli.ts that import it from there.

import { extname } from 'node:path'
import { blobAt, listCommits, type CommitInfo } from './pairfinder'
import { resolve } from './resolve'
import { detectDeploy, type DeployDetection } from './deploy'
import { gitDeletionAttributor } from './deletion'
import { gitDescentCorroborator } from './corroborate'
import { vendoredPaths } from './vendored'
import type { Episode } from './episodes'
import type { Artifact, Exclusion, OutcomeRecord, RawGeneration } from './types'

const TEXT_EXTS = new Set([
  '.ts', '.tsx', '.js', '.jsx', '.py', '.css', '.scss', '.html',
  '.md', '.mdx', '.txt', '.tex', '.json', '.yml', '.yaml', '.toml', '.sql',
])
const SKIP_FILES = new Set(['package-lock.json', 'yarn.lock', 'pnpm-lock.yaml'])
const MAX_BLOB_CHARS = 300_000

/**
 * The episode's touched paths this run would read at all.
 *
 * Lifted out of `resolveEpisode`'s loop so `main` can ask the same
 * question before resolving, since the import check (src/vendored.ts)
 * must run over exactly the paths the resolver would otherwise classify
 * and no others. A git call spent on `package-lock.json` would be spent
 * on a file the resolver already skips.
 */
export function resolvablePaths(ep: Episode): string[] {
  return ep.touchedFiles.filter(
    (path) => TEXT_EXTS.has(extname(path)) && !SKIP_FILES.has(path.split('/').pop() ?? ''),
  )
}

/**
 * What kind of finished thing an episode is, as of its own final commit.
 *
 * Every `ursa run` episode is at minimum a `repo`: the finished work is source
 * under version control and the human's commit is the edit. It is `hosted`
 * when that same commit also names a URL the work is served from, because then
 * the thing the owner actually looked at before accepting was the deployed
 * page, not the diff. The lookup reads blobs at `ep.finalSha`, not the working
 * tree, so a record made today from a commit six months old carries the URL
 * that commit shipped with rather than today's.
 */
export function artifactFor(projectPath: string, ep: Episode): { artifact: Artifact; deploy: DeployDetection | null } {
  const deploy = detectDeploy((path) => blobAt(projectPath, ep.finalSha, path))
  if (!deploy) return { artifact: { kind: 'repo' }, deploy: null }
  return { artifact: { kind: 'hosted', renderRef: deploy.url }, deploy }
}

/**
 * @param commits `listCommits(projectPath)`, when the caller already has it.
 *   Descent corroboration needs the commit graph to tell a rival commit
 *   from a descendant of the generation, and `ursa run` walks that graph
 *   once for every episode it resolves. Omitted, this reads it per
 *   episode, which is correct and costs one `git log` call.
 */
export function resolveEpisode(
  projectPath: string,
  ep: Episode,
  commits?: CommitInfo[],
): OutcomeRecord | null {
  const files: Array<{ path: string; text: string }> = []
  const generations: RawGeneration[] = []
  const graph = commits ?? listCommits(projectPath)
  const candidates = resolvablePaths(ep)
  // The file-level refusal, ahead of the span-level one. A path whose
  // finished blob is byte-identical to a blob outside this generation's
  // descent arrived whole from elsewhere, so classifying its spans would
  // attach `survived_verbatim` and `survived_mutated` labels to text
  // nobody in this episode wrote. `ep.vendoredPaths` when `main` already
  // asked; computed here when a caller resolves an episode directly, so
  // the refusal does not depend on which entry point was used.
  const vendored = ep.vendoredPaths ?? vendoredPaths(projectPath, ep, candidates, graph)
  const imported = new Set(vendored.map((v) => v.path))
  // The refusal, turned from a silent drop into a claim the record makes.
  // `chars` is the size of the finished blob, which is exactly what left
  // this record's figures by being excluded, so `stats.finalChars` plus
  // these counts is the size of every path the run was willing to read.
  // `?? 0` is unreachable on the normal path — `vendoredPaths` only returns
  // a path whose blob at `ep.finalSha` it already read an object id for —
  // and is written rather than asserted because a blob that vanishes
  // between two git calls should cost the record a number, not the run.
  const exclusions: Exclusion[] = vendored.map((v) => ({
    path: v.path,
    reason: 'imported_whole',
    sha: v.sha,
    subject: v.subject,
    relation: v.relation,
    chars: blobAt(projectPath, ep.finalSha, v.path)?.length ?? 0,
  }))
  let turn = 0
  for (const path of candidates) {
    if (imported.has(path)) continue
    const genText = blobAt(projectPath, ep.generatedSha, path)
    const finText = blobAt(projectPath, ep.finalSha, path)
    if (genText === null || finText === null) continue
    if (genText.length > MAX_BLOB_CHARS || finText.length > MAX_BLOB_CHARS) continue
    turn++
    files.push({ path, text: finText })
    generations.push({
      conversationId: `git-${ep.generatedSha.slice(0, 7)}`,
      model: ep.agentMarker,
      turnIndex: turn,
      kind: 'write',
      filePath: path,
      timestamp: ep.openedAt,
      text: genText,
    })
  }
  // An episode whose every resolvable path was an import used to resolve to
  // nothing, and on the probe that is a real episode: the record
  // `ursa-probe-2026-09-30-124d880.json` was simply not written, and an
  // absent file in `.ursa/records/` is indistinguishable from a run that
  // found no work (docs/design/vendored-paths.md §5.2). With the evidence
  // in hand the absence can state itself instead, as a record with no
  // files, no generations and one exclusion saying which commit the
  // finished file came from. A record that claims nothing is still a record
  // that explains itself, which is the auditable thing; an absence is not.
  //
  // Only when there is evidence. An episode that resolved to nothing for
  // any other reason — an unreadable blob, a file over MAX_BLOB_CHARS, a
  // path with no generation side — still returns null, because a record
  // saying nothing for no stated reason is worse than the absence it
  // replaces.
  if (files.length === 0 || generations.length === 0) {
    if (exclusions.length === 0) return null
    return resolve({
      taskId: ep.id,
      files: [],
      conversations: [],
      generations: [],
      exclusions,
      finished: true,
      generatedAt: ep.closedAt,
      artifact: artifactFor(projectPath, ep).artifact,
    })
  }
  return resolve({
    taskId: ep.id,
    files,
    exclusions,
    // A merge walked past on the way to ep.finalSha can have destroyed
    // generated text that no human ever chose to drop. Without this the
    // record would call that a discard and name ep.finalSha's author.
    // `unreadableMerges` carries the boundaries this clone cannot test at
    // all, so those deletions come back `unknown` instead of as a discard.
    attributeDeletion: gitDeletionAttributor(projectPath, ep.interveningMerges ?? [], {
      unreadableMerges: ep.unreadableMerges,
    }),
    // A fuzzy match above THETA_HIGH says the final text resembles this
    // generation; `survived_mutated` says the person got there by editing
    // it. On the git path the two come apart whenever the text was already
    // in the file before the agent wrote (a generation here is the whole
    // blob) or came off a sibling branch. Without this the record ships a
    // word-level diff nobody performed.
    corroborate: gitDescentCorroborator(projectPath, ep.generatedSha, graph),
    conversations: [{
      id: `git-${ep.generatedSha.slice(0, 7)}`,
      title: ep.subject,
      adapter: 'git',
      model: ep.agentMarker,
      date: ep.openedAt,
      turns: turn,
      userTurns: 0,
    }],
    generations,
    finished: true,
    generatedAt: ep.closedAt,
    artifact: artifactFor(projectPath, ep).artifact,
  })
}
