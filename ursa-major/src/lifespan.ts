// The time dimension of the outcome record.
//
// A record classifies each span of the finished work at ONE point in
// time: `finalSha`, the first human commit that touched the agent's
// output (see pairfinder.ts). That answers "did the user keep this?"
// and stops there. CLAUDE.md §1 asks for more — "not just what
// survived but how long" — because the two failure modes that look
// identical at finalSha are commercially opposite:
//
//   wrong on arrival   the user deleted it in the very edit that
//                      closed the episode. Already labelled
//                      `generated_deleted`; nothing here to add.
//
//   died on contact    the user kept it, shipped it, and three
//                      commits later the real work removed it. Today
//                      this is labelled `survived_verbatim` and sold
//                      as a positive. It is a false positive.
//
// The intermediate versions this needs already exist: they are the
// commits after `finalSha`. So the walk is forward from the episode's
// closing commit along the current branch, one file at a time, asking
// of each surviving span whether it is still there. The answer turns
// a boolean label into a duration, and the aggregate turns into
// `decayRate` — the fraction of a record's own "survived" verdict that
// the subsequent real work overturned.
//
// What this is not: it is not a second matcher. It reuses match.ts's
// primitives and adds no threshold that matching does not already
// own, so every durability claim stays explainable from the same two
// numbers the labels came from.

import { execFileSync } from 'node:child_process'
import { normalize } from './normalize'
import { containment, tokens, THETA_HIGH } from './match'
import type { FinalSpan, OutcomeRecord, SpanLifespan, Durability } from './types'

/**
 * Revisions to walk forward per file. A cap, not a judgement: the walk
 * costs one `git show` per revision per file, and a span that is still
 * present 50 revisions later is durable by any standard a lab cares
 * about. Raise it for a forensic pass, not for a daily run.
 */
export const MAX_REVISIONS = 50

/**
 * Normalized span length below which presence carries no evidence. A
 * 6-character span like `return` is present in almost every revision
 * of almost every file, so calling it durable would manufacture a
 * signal out of a common token. Twice match.ts's MIN_VERBATIM_LEN,
 * which is the length at which containment stops being able to claim
 * verbatim survival by accident.
 */
export const MIN_TRACEABLE_LEN = 24

/** Same blob ceiling bin/ursa.ts applies when resolving; a generated file bigger than this is not prose. */
const MAX_BLOB_CHARS = 300_000

export interface FileRevision {
  sha: string
  /** ISO-8601 author date */
  at: string
  author: string
  subject: string
}

/**
 * `stderr: 'ignore'` because two callers below treat a non-zero exit as
 * an answer rather than an error — a ref that is not an ancestor, and a
 * path that a later revision deleted — and git's own "fatal:" line on
 * those is noise in the middle of a clean run.
 */
function git(repoPath: string, args: string[]): string {
  return execFileSync('git', ['-C', repoPath, ...args], {
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
    stdio: ['ignore', 'pipe', 'ignore'],
  })
}

/** HEAD's sha, or null in a repo with no commits. */
export function headSha(repoPath: string): string | null {
  try {
    return git(repoPath, ['rev-parse', 'HEAD']).trim()
  } catch {
    return null
  }
}

/**
 * Commits touching `path` that are descendants of `sha` on the current
 * branch, oldest first. `sha..HEAD` is deliberate: it asks what the
 * work that actually shipped did to this text, not what some abandoned
 * branch did. If `sha` is not an ancestor of HEAD the range is empty,
 * and the caller reports `untested` rather than guessing.
 *
 * `--follow` is deliberately NOT used: it would make a rename look like
 * continuity of content, and the question here is about the text, not
 * about the path it lives at.
 */
export function revisionsAfter(
  repoPath: string,
  sha: string,
  path: string,
  limit = MAX_REVISIONS,
): FileRevision[] {
  let out: string
  try {
    out = git(repoPath, [
      'log', '--reverse', '--topo-order', '--date=iso-strict',
      `--max-count=${limit}`,
      '--pretty=format:%H%x09%aI%x09%an%x09%s',
      `${sha}..HEAD`, '--', path,
    ])
  } catch {
    return []
  }
  return out.split('\n').filter(Boolean).map((line) => {
    const [revSha, at, author, ...rest] = line.split('\t')
    return { sha: revSha, at, author, subject: rest.join('\t') }
  })
}

/** File contents at a revision; null when the revision deleted the file. */
function blobAt(repoPath: string, sha: string, path: string): string | null {
  try {
    return git(repoPath, ['show', `${sha}:${path}`])
  } catch {
    return null
  }
}

export type Presence = { present: true; basis: 'verbatim' | 'token-containment' } | { present: false }

/**
 * Is this span still in this file?
 *
 * Two tiers, cheapest first, and neither introduces a new threshold:
 *
 *   verbatim           the span's normalized text is a substring of the
 *                      file's normalized text. Untouched.
 *
 *   token-containment  at least THETA_HIGH of the span's tokens are
 *                      still somewhere in the file. The text was edited
 *                      again but the substance is still there.
 *
 * Bag-of-tokens rather than a windowed edit distance, on purpose. The
 * question is "does this text still exist in this file", not "where has
 * it moved to", so position carries no information here, and a windowed
 * levenshtein over every span × every revision × every file would cost
 * more than the whole resolve it annotates. The cost of the choice is
 * named: a span whose tokens were scattered into unrelated sentences
 * reads as present. That inflates durability, so `decayRate` is a
 * conservative floor on decay rather than a point estimate.
 */
export function spanPresent(spanNorm: string, fileNorm: string, fileTokens: Set<string>): Presence {
  if (fileNorm.includes(spanNorm)) return { present: true, basis: 'verbatim' }
  if (containment(tokens(spanNorm), fileTokens) >= THETA_HIGH) {
    return { present: true, basis: 'token-containment' }
  }
  return { present: false }
}

/**
 * Walk one file's spans forward through `revisions` and stamp each with
 * how long it lasted. Mutates the spans in place and returns them, so a
 * caller that already holds the record does not rebuild it.
 */
export function traceFile(
  repoPath: string,
  path: string,
  spans: FinalSpan[],
  closedAt: string,
  revisions: FileRevision[],
): FinalSpan[] {
  const traceable = spans.filter((s) => normalize(s.text).norm.length >= MIN_TRACEABLE_LEN)
  for (const span of spans) {
    span.lifespan = {
      revisionsChecked: 0,
      survivedRevisions: 0,
      survivedSeconds: 0,
      diedAtSha: null,
      diedAt: null,
      liveAtTip: false,
      fate: 'untested',
      basis: null,
      skipped: traceable.includes(span) ? (revisions.length === 0 ? 'no-later-revisions' : null) : 'too-short',
    }
  }
  if (revisions.length === 0) return spans

  const closedMs = Date.parse(closedAt)
  // Spans still alive as of the last revision examined. A span leaves
  // this set exactly once, at the first revision that lost it, so a
  // span deleted and later re-added still reads as decayed — the work
  // did reject it, and the re-add is a different generation's span.
  const alive = new Map<FinalSpan, { norm: string; basis: 'verbatim' | 'token-containment' }>()
  for (const span of traceable) alive.set(span, { norm: normalize(span.text).norm, basis: 'verbatim' })

  for (const rev of revisions) {
    if (alive.size === 0) break
    const text = blobAt(repoPath, rev.sha, path)
    // A null blob means this revision deleted the file. That is a real
    // death for every span in it, not a reason to skip the revision.
    const fileNorm = text === null || text.length > MAX_BLOB_CHARS ? '' : normalize(text).norm
    const fileTokens = new Set(tokens(fileNorm))
    const revMs = Date.parse(rev.at)
    for (const [span, state] of [...alive]) {
      const life = span.lifespan!
      life.revisionsChecked++
      const presence = spanPresent(state.norm, fileNorm, fileTokens)
      if (presence.present) {
        life.survivedRevisions++
        life.survivedSeconds = Math.max(0, Math.round((revMs - closedMs) / 1000))
        state.basis = presence.basis
        life.basis = presence.basis
      } else {
        life.diedAtSha = rev.sha
        life.diedAt = rev.at
        life.fate = 'decayed'
        alive.delete(span)
      }
    }
  }
  for (const span of alive.keys()) {
    span.lifespan!.fate = 'durable'
    span.lifespan!.liveAtTip = true
  }
  return spans
}

function median(values: number[]): number | null {
  if (values.length === 0) return null
  const s = [...values].sort((a, b) => a - b)
  const mid = Math.floor(s.length / 2)
  return s.length % 2 === 1 ? s[mid] : Math.round((s[mid - 1] + s[mid]) / 2)
}

/** The classes whose durability is the commercial claim: text the record says the user kept. */
const SURVIVING = new Set(['survived_verbatim', 'survived_mutated'])

/**
 * Annotate every span in `record` with its lifespan and attach the
 * record-level `durability` block. `closingSha` is the episode's
 * `finalSha`; `closedAt` its `finalAt`.
 *
 * Returns the same record for convenience. Safe on a repo where the
 * closing commit is not an ancestor of HEAD: every span reads
 * `untested` and `decayRate` is null.
 */
export function annotateDurability(
  repoPath: string,
  record: OutcomeRecord,
  closingSha: string,
  closedAt: string,
  maxRevisions = MAX_REVISIONS,
): OutcomeRecord {
  const tip = headSha(repoPath)
  for (const file of record.files) {
    const revisions = revisionsAfter(repoPath, closingSha, file.path, maxRevisions)
    traceFile(repoPath, file.path, file.spans, closedAt, revisions)
  }

  let testedSpans = 0, durableSpans = 0, decayedSpans = 0
  let durableChars = 0, decayedChars = 0
  let baselineDurable = 0, baselineDecayed = 0
  const decayedLifetimes: number[] = []

  for (const file of record.files) {
    for (const span of file.spans) {
      const life = span.lifespan
      if (!life || life.fate === 'untested') continue
      if (SURVIVING.has(span.class)) {
        testedSpans++
        if (life.fate === 'durable') {
          durableSpans++
          durableChars += span.text.length
        } else {
          decayedSpans++
          decayedChars += span.text.length
          decayedLifetimes.push(life.survivedSeconds)
        }
      } else if (span.class === 'no_generation_provenance') {
        // The control. This text the user wrote themselves, so its
        // decay rate is the repo's own churn. Agent text that decays at
        // the baseline is not decaying because it was agent text.
        if (life.fate === 'durable') baselineDurable++
        else baselineDecayed++
      }
    }
  }

  const baselineTested = baselineDurable + baselineDecayed
  const durability: Durability = {
    method: 'git-forward-walk',
    tipSha: tip,
    closingSha,
    testedSpans,
    durableSpans,
    decayedSpans,
    durableChars,
    decayedChars,
    decayRate: testedSpans === 0 ? null : decayedChars / (durableChars + decayedChars || 1),
    baselineDecayRate: baselineTested === 0 ? null : baselineDecayed / baselineTested,
    medianDecayedLifetimeSeconds: median(decayedLifetimes),
    maxRevisionsWalked: maxRevisions,
    minTraceableLen: MIN_TRACEABLE_LEN,
  }
  record.durability = durability
  return record
}
