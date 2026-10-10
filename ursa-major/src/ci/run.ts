// `ursa ci` — the resolver's CI launch, the body of the GitHub Action.
//
// One merged pull request in, one outcome record per work unit plus one
// run comment out. Still a launch and not a watcher (ADR-003): the merge
// event fires it, it runs once to completion, and nothing survives it but
// the records on the runner and the comment on the pull request.
//
// Order of operations, and why this order:
//
//   1. Read the merge window from the event payload. A pull request that
//      closed unmerged stops here, because nothing was accepted.
//   2. Read the reaction on the previous run's comment. This happens
//      BEFORE resolving, so that a run which fails to resolve still
//      records the acceptance somebody declared.
//   3. Resolve the window's commit pairs into outcome records.
//   4. Distill, or record that no model was available. Never block.
//   5. Render the five-field comment and post or update it.
//
// Acceptance provenance, stated once so no later reader has to guess: a
// 👍 on the previous pull request's comment is a declaration about THAT
// pull request's work, not about this one. It is appended to
// `.ursa/acceptance.jsonl` keyed to the pull request it belongs to. Only
// a 👍 on THIS pull request's own comment — which happens when the Action
// is re-run after somebody reacted — becomes the declaration carried into
// this run's records. Spreading one merge's verdict onto another merge's
// text would be exactly the inference this project refuses to make.

import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { findCommitPairs } from '../pairfinder'
import { buildEpisodes, type Episode } from '../episodes'
import { deriveSignals, type Declaration } from '../signals'
import { saveEpisodes, saveRecord, ursaDir } from '../store'
import type { OutcomeRecord } from '../types'
import type { Violation } from '../invariants'
import { resolveEpisode } from '../resolve-episode'
import { clearsSizeFloor, erasedEpisodeIds, gateRecords } from '../launch'
import { distill } from '../tuning/distill'
import { emptyTuning, mergeDistill } from '../tuning/merge'
import type { TuningRecord } from '../tuning/types'
import { mergeWindowFromEvent, NotAMergedPullRequest, type MergeWindow } from './window'
import { selectDistillMode, type DistillMode } from './distill-mode'
import { githubApi, type GitHubApi } from './github'
import {
  declarationFromReaction, findPriorRunComment, readAcceptance,
  type PriorAcceptance,
} from './reactions'
import {
  RUN_COMMENT_MARKER, renderRunComment, runCommentFields,
  type RunCommentFields, type TuningDelta,
} from './comment'

export interface CiOptions {
  /** the checked-out repository on the runner */
  projectPath: string
  /** $GITHUB_EVENT_PATH */
  eventPath: string
  repo: string
  token: string
  apiBaseUrl?: string
  /** link back to this workflow run, printed in the comment's detail block */
  runUrl?: string | null
  /** smallest generated-character count worth a record; matches `ursa run` */
  minChars?: number
  env?: Record<string, string | undefined>
  /** false writes nothing to GitHub and prints the comment instead */
  post?: boolean
  /**
   * $GITHUB_OUTPUT. When present the five fields are written there as
   * step outputs, so a consumer workflow can gate on them without
   * re-parsing the log. Written by the one run that produced them; there
   * is no second invocation.
   */
  outputsPath?: string | null
  api?: GitHubApi
  log?: (line: string) => void
}

export interface CiResult {
  exitCode: number
  window: MergeWindow | null
  fields: RunCommentFields | null
  comment: string | null
  commentUrl: string | null
  priorAcceptance: PriorAcceptance | null
  declaration: Declaration
  mode: DistillMode
  recordPaths: string[]
  /**
   * Every bound the records this run wrote violated, empty when they are
   * self-consistent. Non-empty is what makes `exitCode` 1: the records and
   * the comment still ship, because an impossible record is still the
   * evidence, and the run stops reporting success.
   */
  invariantViolations: Violation[]
}

const NO_PRIOR: Declaration = {
  accepted: null,
  basis: 'undeclared: no reaction has been left on this run comment yet. Retention is NOT acceptance.',
}

export async function runCi(opts: CiOptions): Promise<CiResult> {
  const log = opts.log ?? ((line: string) => console.log(line))
  const env = opts.env ?? process.env
  const minChars = opts.minChars ?? 200
  const api = opts.api ?? githubApi({ repo: opts.repo, token: opts.token, baseUrl: opts.apiBaseUrl })
  const mode = selectDistillMode(env)

  // 1. The window.
  let window: MergeWindow
  try {
    window = mergeWindowFromEvent(opts.eventPath, opts.projectPath)
  } catch (err) {
    if (err instanceof NotAMergedPullRequest) {
      log(`ursa ci: nothing to resolve — ${err.message}`)
      return {
        exitCode: 0, window: null, fields: null, comment: null, commentUrl: null,
        priorAcceptance: null, declaration: NO_PRIOR, mode, recordPaths: [],
        invariantViolations: [],
      }
    }
    throw err
  }
  log(`ursa ci: pull request #${window.prNumber}, window ${window.range} (${window.style})`)

  // 2. The reaction on the previous run's comment, read before any work.
  // With no token there is nothing to read it with, and an unauthenticated
  // call would only earn a 401 and a confusing log line, so say so once
  // and move on.
  const canRead = opts.api !== undefined || opts.token.length > 0
  const { priorAcceptance, ownAcceptance, ownComment } = canRead
    ? await readReactions(api, window.prNumber, log)
    : (log('ursa ci: no token, so no reaction can be read; acceptance stays undeclared'),
       { priorAcceptance: null, ownAcceptance: null, ownComment: null })
  if (priorAcceptance?.mark) {
    appendAcceptance(opts.projectPath, priorAcceptance)
    log(
      `ursa ci: declared acceptance read — ${priorAcceptance.thumbsUp} 👍 from ` +
      `${priorAcceptance.thumbsUpBy.join(', ')} on ${priorAcceptance.comment.commentUrl}`
    )
  } else {
    log('ursa ci: no declared acceptance to read; silence stays undeclared')
  }
  const declaration = ownAcceptance ? declarationFromReaction(ownAcceptance) : NO_PRIOR

  // 3. Resolve.
  const pairs = findCommitPairs(opts.projectPath, { range: window.range })
  const episodes = buildEpisodes(pairs, opts.projectPath)
  const records: OutcomeRecord[] = []
  const recordPaths: string[] = []
  // Counted so the run comment can say which bound dropped a unit instead of
  // asserting the one reason it is most likely NOT to be (src/ci/comment.ts,
  // emptyWindowSentence).
  const dropped = { unresolvable: 0, belowMinChars: 0, minChars }
  // Erasure survives re-derivation on this launch too. A runner that has
  // the project's `.ursa/` (committed, cached, or simply the same machine
  // on a self-hosted runner) holds the tombstones `ursa forget` wrote, and
  // a launch that rebuilds the episode from git history without reading
  // them undoes the user's deletion. `src/launch.ts`, shared with
  // `ursa run`, which has refused this since the consent work landed.
  const erased = erasedEpisodeIds(opts.projectPath, episodes.map((e) => e.id))
  let suppressed = 0
  for (const episode of episodes) {
    if (erased.has(episode.id)) { suppressed++; continue }
    const record = resolveEpisode(opts.projectPath, episode)
    if (!record) { dropped.unresolvable++; continue }
    // The same floor `ursa run` applies, and for the same reason it exempts
    // a refusal-only record from it (src/launch.ts, clearsSizeFloor). Asked
    // here as `record.stats.generated.totalChars < minChars` alone until
    // 2026-10-10, which dropped the one record whose whole job is to say
    // out loud that an episode's every path was an import.
    if (!clearsSizeFloor(record, minChars)) { dropped.belowMinChars++; continue }
    const signals = deriveSignals(record, declaration)
    signals.notes = [...(signals.notes ?? []), `CI launch: ${window.note}`]
    record.signals = signals
    recordPaths.push(saveRecord(opts.projectPath, record))
    records.push(record)
  }
  saveEpisodes(opts.projectPath, episodes)
  log(`ursa ci: ${episodes.length} work units found, ${records.length} resolved`)
  if (suppressed > 0) {
    log(`ursa ci: ${suppressed} work unit${suppressed === 1 ? '' : 's'} you erased stayed erased; nothing was rebuilt`)
  }

  // 3b. The record's self-check, over what was just written. `ursa run` has
  // run this on every run since the generated-denominator work and exits
  // non-zero on a violation; this launch ran no check at all until
  // 2026-10-10, so a record whose arithmetic cannot be true was posted to a
  // pull request as five confident fields with nothing marking it. The
  // comment is still posted and the records are still on disk, for the same
  // reason `ursa run` still writes them: an impossible record is the
  // evidence of the defect. What changes is the exit code, which fails the
  // Action's step, and one line in the comment's detail block so the person
  // reading the five fields is told not to trust them.
  const gate = gateRecords(records)
  if (gate.violations.length > 0) log(`ursa ci: ${gate.report}`)

  // 4. Distill, or say why not. Either way the run continues.
  const tuningDelta = distillAll(opts.projectPath, records, mode, log)

  // 5. The comment.
  const fields = runCommentFields(records, episodes, tuningDelta)
  const comment = renderRunComment(fields, {
    prNumber: window.prNumber,
    repo: opts.repo,
    range: window.range,
    windowNote: window.note,
    declarationBasis: declaration.basis,
    recordsPath: join(ursaDir(opts.projectPath), 'records'),
    dropped,
    runUrl: opts.runUrl ?? null,
    invariantViolations: gate.violations.length,
  })

  let commentUrl: string | null = null
  if (opts.post === false) {
    log('ursa ci: --no-post, the comment is printed and not written\n')
    log(comment)
  } else {
    const written = ownComment
      ? await api.patchComment(ownComment.commentId, comment)
      : await api.postComment(window.prNumber, comment)
    commentUrl = written.html_url
    log(`ursa ci: run comment ${ownComment ? 'updated' : 'posted'} — ${commentUrl}`)
  }

  const outputsPath = opts.outputsPath ?? env.GITHUB_OUTPUT ?? null
  if (outputsPath) writeStepOutputs(outputsPath, fields, commentUrl)

  return {
    exitCode: gate.violations.length > 0 ? 1 : 0,
    window, fields, comment, commentUrl,
    priorAcceptance, declaration, mode, recordPaths,
    invariantViolations: gate.violations,
  }
}

/**
 * The same five fields, in the same order, as GitHub Actions step
 * outputs. Values are plain scalars so a consumer workflow can compare
 * them between merges; `most-corrected-artifact` is the empty string
 * when nothing was edited, which is the zero of a path.
 */
export function renderStepOutputs(fields: RunCommentFields, commentUrl: string | null): string {
  const delta = fields.tuningDelta
  return [
    `units-resolved=${fields.unitsResolved}`,
    `units-found=${fields.unitsFound}`,
    `chars-survived-verbatim=${fields.charsSurvivedVerbatim}`,
    `chars-survived-edited=${fields.charsSurvivedEdited}`,
    `most-corrected-artifact=${fields.mostCorrectedArtifact ?? ''}`,
    `tuning-delta=${delta.unitsAdded}/${delta.unitsReinforced}`,
    `tuning-mode=${delta.mode}`,
    `comment-url=${commentUrl ?? ''}`,
    '',
  ].join('\n')
}

function writeStepOutputs(path: string, fields: RunCommentFields, commentUrl: string | null): void {
  appendFileSync(path, renderStepOutputs(fields, commentUrl))
}

/**
 * The previous run's comment anywhere in the repository, and this pull
 * request's own run comment if one exists. A reaction failure never
 * fails the run: the records are the product, the mark is a bonus.
 */
async function readReactions(
  api: GitHubApi,
  prNumber: number,
  log: (line: string) => void
): Promise<{ priorAcceptance: PriorAcceptance | null; ownAcceptance: PriorAcceptance | null; ownComment: { commentId: number; commentUrl: string; postedAt: string } | null }> {
  try {
    const own = findPriorRunComment(await api.listPrComments(prNumber), RUN_COMMENT_MARKER)
    const ownAcceptance = own ? readAcceptance(own, await api.listReactions(own.commentId)) : null

    const repoWide = (await api.listRepoRunComments()).filter(
      (c) => c.body.includes(RUN_COMMENT_MARKER) && c.id !== own?.commentId
    )
    const prior = findPriorRunComment(repoWide, RUN_COMMENT_MARKER)
    const priorAcceptance = prior ? readAcceptance(prior, await api.listReactions(prior.commentId)) : null
    return { priorAcceptance, ownAcceptance, ownComment: own }
  } catch (err) {
    log(`ursa ci: could not read reactions (${(err as Error).message}); treating acceptance as undeclared`)
    return { priorAcceptance: null, ownAcceptance: null, ownComment: null }
  }
}

/** Append-only acceptance log, keyed to the pull request the verdict is about. */
function appendAcceptance(projectPath: string, prior: PriorAcceptance): void {
  const dir = ursaDir(projectPath)
  mkdirSync(dir, { recursive: true })
  const entry = {
    schemaVersion: '0.1.0',
    commentUrl: prior.comment.commentUrl,
    commentId: prior.comment.commentId,
    commentPostedAt: prior.comment.postedAt,
    thumbsUp: prior.thumbsUp,
    thumbsUpBy: prior.thumbsUpBy,
    declaredAt: prior.declaredAt,
    mark: prior.mark,
    readAt: new Date().toISOString(),
  }
  appendFileSync(join(dir, 'acceptance.jsonl'), JSON.stringify(entry) + '\n')
}

/**
 * Run the interpretation pass over each new record, or record that it did
 * not run. CI mode installs noModelRunner, so mergeDistill sees a
 * well-formed empty result and the delta is an honest zero.
 */
function distillAll(
  projectPath: string,
  records: OutcomeRecord[],
  mode: DistillMode,
  log: (line: string) => void
): TuningDelta {
  const base: TuningDelta = {
    unitsAdded: 0,
    unitsReinforced: 0,
    mode: mode.kind === 'model' ? 'distilled' : 'ci-no-model',
    reason: mode.reason,
  }
  if (mode.kind !== 'model') {
    log(`ursa ci: distillation skipped — ${mode.reason}. Records are written; they distill later, unchanged.`)
    return base
  }
  if (records.length === 0) return base

  const tuningPath = join(ursaDir(projectPath), 'tuning.json')
  let tuning: TuningRecord = existsSync(tuningPath)
    ? (JSON.parse(readFileSync(tuningPath, 'utf8')) as TuningRecord)
    : emptyTuning('ci')

  for (const record of records) {
    if (tuning.sources.some((s) => s.recordId === record.task.id)) continue
    try {
      const output = distill(record, tuning, mode.model)
      const before = tuning.axioms.length
      tuning = mergeDistill(tuning, output, record, mode.model)
      base.unitsAdded += tuning.axioms.length - before
      base.unitsReinforced += output.axioms.length - (tuning.axioms.length - before)
    } catch (err) {
      // One record's interpretation failing is not the run failing.
      log(`ursa ci: distill failed on ${record.task.id} (${(err as Error).message}); continuing`)
    }
  }
  writeFileSync(tuningPath, JSON.stringify(tuning, null, 2) + '\n')
  return base
}
