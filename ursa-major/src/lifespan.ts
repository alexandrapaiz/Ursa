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
import { segment, modeForPath } from './segment'
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
  /**
   * The path the traced file occupies **in this revision's tree**, which
   * is not always the path the record calls the file. A commit that
   * renames `a.md` to `b.md` is still a revision of the same text, and
   * the only place that text can be read at that commit is `b.md`. The
   * walk reads `rev.path`, never the record's path, for exactly this
   * reason; see the rename note on `revisionsAfter`.
   */
  path: string
  /** set only on a revision that renamed the file: the path it moved from */
  renamedFrom?: string
}

/**
 * One rename the walk actually crossed, as opposed to one that exists in
 * the history. The distinction matters because `traceFile` stops walking
 * the moment every unit of every span is dead, so a rename later than that
 * commit was never looked at and must not be counted.
 *
 * The three fields together are the rename's identity, which is what makes
 * the record-level `distinctRenamesFollowed` a count and not a sum: two
 * files that moved in one commit are two crossings with different path
 * pairs, and one file whose four spans all crossed the same move is one
 * crossing reported four times.
 */
export interface RenameCrossing {
  /** the commit that performed the rename */
  sha: string
  /** the path the file left */
  from: string
  /** the path it took in that commit's tree */
  to: string
}

/**
 * The first commit in `sha..HEAD` at which `path` stopped existing,
 * or null if it never did. `--diff-filter=D` with a pathspec and no
 * rename detection is what makes this cheap: git reports a rename-away
 * as a deletion of the old path, so one log call finds both the real
 * deletions and the renames, and only that one commit pays for the
 * second call that tells them apart.
 *
 * `--reverse` is applied after selection, so there is no `--max-count=1`
 * here: with it git would select the newest commit and then reverse a
 * one-element list. The first line of the reversed output is the answer.
 */
function firstVanish(repoPath: string, sha: string, path: string): string | null {
  let out: string
  try {
    out = git(repoPath, [
      'log', '--reverse', '--topo-order', '--diff-filter=D',
      '--pretty=format:%H', `${sha}..HEAD`, '--', path,
    ])
  } catch {
    return null
  }
  const first = out.split('\n').find(Boolean)
  return first ? first.trim() : null
}

/**
 * If commit `sha` renamed `path` to somewhere else, the path it renamed
 * it to; otherwise null.
 *
 * The pathspec is deliberately absent. `git diff-tree -M -- old` filters
 * the rename pair down to one side and prints `D old`, which is the
 * deletion reading this function exists to refute, so the diff is taken
 * whole and the `R` line is found by matching its source path.
 *
 * `-z` rather than the default output because git quotes and
 * backslash-escapes a path containing a space, a quote or a non-ASCII
 * byte when `core.quotePath` is on, and a quoted path would not compare
 * equal to the record's own. With `-z` the fields arrive raw, as
 * `R<score>\0<old>\0<new>\0`.
 *
 * Merge commits print nothing here, because `git diff-tree` on a merge
 * emits no diff without `-m` or `-c`. A rename performed by a merge
 * commit therefore still reads as a deletion. That is the pre-existing
 * behaviour, narrowed rather than removed: `git log -- path` only
 * surfaces a merge when the path differs from every parent, which a
 * rename resolved identically on both sides does not do.
 */
function renameTarget(repoPath: string, sha: string, path: string): string | null {
  let out: string
  try {
    out = git(repoPath, ['diff-tree', '-r', '-M', '--name-status', '--no-commit-id', '-z', sha])
  } catch {
    return null
  }
  const f = out.split('\0')
  for (let i = 0; i < f.length; i++) {
    if (!/^R\d*$/.test(f[i])) continue
    if (f[i + 1] === path && f[i + 2]) return f[i + 2]
    i += 2
  }
  return null
}

/** One `git log` over one path. The rename-following loop in `revisionsAfter` calls this once per path. */
function logOnePath(
  repoPath: string,
  sha: string,
  path: string,
  limit: number,
): Omit<FileRevision, 'path'>[] {
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
 * branch, oldest first, **following the file across renames**. `sha..HEAD`
 * is deliberate: it asks what the work that actually shipped did to this
 * text, not what some abandoned branch did. If `sha` is not an ancestor of
 * HEAD the range is empty, and the caller reports `untested` rather than
 * guessing.
 *
 * ## Why renames are followed, when this function used to refuse to
 *
 * Until 2026-10-24 the comment here read: "`--follow` is deliberately NOT
 * used: it would make a rename look like continuity of content, and the
 * question here is about the text, not about the path it lives at."
 *
 * The intent was right and the behaviour was the opposite of it. A
 * path-limited log still returns the commit that renamed the path **away**,
 * because git reports a rename-away as a deletion of the old path. The walk
 * then read `git show <rename>:<old path>`, got nothing, and `traceFile`
 * reads nothing as a deletion — so every unit of every span in that file
 * died at the move. Not "false continuity": total destruction, of text
 * sitting unmodified at the tip under another name.
 *
 * Measured on a three-commit repository with one `git mv` in it, which is
 * `repoWithRename()` in lifespan.test.ts and §1 of
 * `docs/design/rename-reads-as-death.md`: `unitsTraced` 4,
 * `unitsSurviving` 0, `decayedChars` 338, `fate` `decayed`, `liveAtTip`
 * false, `Durability.decayRate` 1, and the text present at HEAD in full.
 * The walk reported that every character the user kept was gone, about a
 * file whose text `git show HEAD:moved.md` can print.
 *
 * Following the rename does not assert that the content continued. The
 * presence test is `spanPresent`, which reads the blob and asks whether the
 * span's own text is in it, so a commit that both moved a file and gutted it
 * still reports death at that commit — now for the real reason. What the
 * rename buys is only the right place to look.
 *
 * `--follow` itself is still not used. It takes one pathspec, applies
 * history simplification of its own, and leaves no way to tell a caller
 * *that* a rename happened. Instead the rename is resolved explicitly, with
 * `firstVanish` and `renameTarget` above, and recorded on the revision
 * (`FileRevision.renamedFrom`) and on the record (`SpanLifespan.renamedTo`,
 * `Durability.spanRenameCrossings` and `Durability.distinctRenamesFollowed`),
 * because a walk that silently crosses a rename is a walk a reviewer cannot
 * audit.
 */
export function revisionsAfter(
  repoPath: string,
  sha: string,
  path: string,
  limit = MAX_REVISIONS,
): FileRevision[] {
  const out: FileRevision[] = []
  // Cycle guard. `a -> b` then `b -> a` in the same range is legal git and
  // would otherwise loop forever, and `seen` also stops a self-rename.
  const seen = new Set<string>([path])
  let currentPath = path
  let from = sha

  while (out.length < limit) {
    const batch = logOnePath(repoPath, from, currentPath, limit - out.length)
    if (batch.length === 0) break
    const vanishedAt = firstVanish(repoPath, from, currentPath)
    const movedTo = vanishedAt ? renameTarget(repoPath, vanishedAt, currentPath) : null

    let followed = false
    for (const rev of batch) {
      if (out.length >= limit) break
      if (movedTo && rev.sha === vanishedAt) {
        // The content is at `movedTo` from this commit onward, including
        // in this commit's own tree, so this revision is read there.
        out.push({ ...rev, path: movedTo, renamedFrom: currentPath })
        currentPath = movedTo
        from = rev.sha
        followed = true
        break
      }
      out.push({ ...rev, path: currentPath })
    }

    // No rename to follow: either the range held none, or the path was
    // genuinely deleted. A real deletion is a real death and the remaining
    // commits on that path — a later file created at the same name — are
    // already in `batch`, exactly as before this function learned renames.
    if (!followed) break
    if (seen.has(currentPath)) break
    seen.add(currentPath)
  }
  return out
}

/**
 * File contents at `path` as of `sha`; null when `path` is not in that
 * tree. The caller must have established *why* it is not there before
 * reading null as a death: `revisionsAfter` resolves rename-aways first,
 * so by the time this returns null the path really was deleted.
 */
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
 * what later work did to it. Mutates the spans in place and returns
 * them, so a caller that already holds the record does not rebuild it.
 *
 * Granularity is the point. resolve() merges adjacent same-class prose,
 * so a whole markdown file often arrives here as ONE span. Asking "is
 * this span still present" of a 2,000-character span answers almost
 * nothing: delete a third of it and the bag-of-tokens tier still says
 * yes. So each span is decomposed with the same segmenter resolve()
 * used — sentences for prose, lines for code — and each unit is traced
 * on its own. A span is then durable, `eroded`, or decayed depending on
 * how its units fared, and the char counts are apportioned between the
 * units that lasted and the units that did not.
 */
export function traceFile(
  repoPath: string,
  path: string,
  spans: FinalSpan[],
  closedAt: string,
  revisions: FileRevision[],
  /**
   * Out-parameter: every rename this walk crossed is appended here, in the
   * order crossed. Optional because the per-span and per-file numbers do
   * not need it; `annotateDurability` passes one array across all files so
   * it can count distinct renames instead of summing per-span counts.
   */
  crossings?: RenameCrossing[],
): FinalSpan[] {
  // The path the record knows, which decides how the span's own text is cut
  // into units. A rename that also changes the extension does not change
  // that: the units come from text written under the original path, and
  // re-segmenting them by the destination's rules would compare sentences
  // against lines.
  const mode = modeForPath(path)
  const closedMs = Date.parse(closedAt)

  interface Unit {
    span: FinalSpan
    norm: string
    chars: number
    /** null while still present; set to the revision that lost it */
    diedAt: FileRevision | null
  }

  const unitsBySpan = new Map<FinalSpan, Unit[]>()
  const live: Unit[] = []
  for (const span of spans) {
    const units: Unit[] = segment(span.text, mode)
      .map((u) => ({ span, norm: normalize(u.text).norm, chars: u.text.length, diedAt: null as FileRevision | null }))
      .filter((u) => u.norm.length >= MIN_TRACEABLE_LEN)
    unitsBySpan.set(span, units)
    span.lifespan = {
      revisionsChecked: 0,
      unitsTraced: units.length,
      unitsSurviving: units.length,
      survivingChars: 0,
      decayedChars: 0,
      intactRevisions: 0,
      intactSeconds: 0,
      diedAtSha: null,
      diedAt: null,
      liveAtTip: false,
      fate: 'untested',
      basis: null,
      skipped: units.length === 0 ? 'too-short' : revisions.length === 0 ? 'no-later-revisions' : null,
    }
    live.push(...units)
  }
  if (revisions.length === 0) return spans

  let remaining = live.length
  let renamesFollowed = 0
  let lastPath = path
  for (const rev of revisions) {
    if (remaining === 0) break
    const text = blobAt(repoPath, rev.sha, rev.path)
    if (rev.renamedFrom) {
      renamesFollowed++
      // Appended here and not in the loop header, so a rename in a revision
      // the walk never reached — the loop breaks above once every unit is
      // dead — is never claimed as crossed.
      crossings?.push({ sha: rev.sha, from: rev.renamedFrom, to: rev.path })
    }
    lastPath = rev.path
    // A null blob means this revision deleted the file. That is a real
    // death for every unit in it, not a reason to skip the revision.
    // `rev.path` rather than `path` is what makes that true: a revision
    // that only moved the file reads its content at the new path and
    // reports no death at all (see revisionsAfter).
    const fileNorm = text === null || text.length > MAX_BLOB_CHARS ? '' : normalize(text).norm
    const fileTokens = new Set(tokens(fileNorm))
    const revMs = Date.parse(rev.at)
    const touchedSpans = new Set<FinalSpan>()
    for (const unit of live) {
      if (unit.diedAt) continue
      touchedSpans.add(unit.span)
      const presence = spanPresent(unit.norm, fileNorm, fileTokens)
      if (presence.present) {
        unit.span.lifespan!.basis = presence.basis
      } else {
        unit.diedAt = rev
        remaining--
      }
    }
    for (const span of touchedSpans) {
      const life = span.lifespan!
      life.revisionsChecked++
      const units = unitsBySpan.get(span)!
      if (units.every((u) => !u.diedAt)) {
        life.intactRevisions++
        life.intactSeconds = Math.max(0, Math.round((revMs - closedMs) / 1000))
      }
    }
  }

  for (const [span, units] of unitsBySpan) {
    const life = span.lifespan!
    if (units.length === 0) continue
    const lost = units.filter((u) => u.diedAt)
    life.unitsSurviving = units.length - lost.length
    life.survivingChars = units.filter((u) => !u.diedAt).reduce((n, u) => n + u.chars, 0)
    life.decayedChars = lost.reduce((n, u) => n + u.chars, 0)
    life.liveAtTip = life.unitsSurviving > 0
    if (lost.length > 0) {
      // The first loss, in revision order — `revisions` is oldest-first
      // and units only ever die once, so the earliest diedAt wins.
      const first = lost.reduce((a, b) =>
        revisions.indexOf(a.diedAt!) <= revisions.indexOf(b.diedAt!) ? a : b)
      life.diedAtSha = first.diedAt!.sha
      life.diedAt = first.diedAt!.at
    }
    life.fate = lost.length === 0 ? 'durable' : lost.length === units.length ? 'decayed' : 'eroded'
  }
  // Written on every span of the file, including the untested ones, and
  // only when a rename was actually crossed. Absent means "this walk saw
  // no rename"; it does not mean "written before the walk could see one",
  // which is why the field is optional and never set to 0 or to `path`.
  if (renamesFollowed > 0) {
    // `lastPath`, not the last element of `revisions`: the loop above stops
    // early once every unit is dead, so a rename after that point was never
    // crossed and must not be claimed as one.
    for (const span of spans) {
      span.lifespan!.renamesFollowed = renamesFollowed
      span.lifespan!.renamedTo = lastPath
    }
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
 * `untested` and every rate is null rather than zero, because "nothing
 * decayed" and "nothing was measured" are different claims and only one
 * of them is sellable.
 */
export function annotateDurability(
  repoPath: string,
  record: OutcomeRecord,
  closingSha: string,
  closedAt: string,
  maxRevisions = MAX_REVISIONS,
): OutcomeRecord {
  const tip = headSha(repoPath)
  // One array across every file in the record, so a rename is identified
  // once globally. Collected by traceFile, which appends only the renames
  // its own walk actually reached.
  const crossings: RenameCrossing[] = []
  for (const file of record.files) {
    const revisions = revisionsAfter(repoPath, closingSha, file.path, maxRevisions)
    traceFile(repoPath, file.path, file.spans, closedAt, revisions, crossings)
  }

  let testedSpans = 0, durableSpans = 0, erodedSpans = 0, decayedSpans = 0
  let durableChars = 0, decayedChars = 0
  let baseDurable = 0, baseDecayed = 0
  // Summed over spans rather than over files, so it is the count a reader
  // of the span records can reconcile against; a file whose three spans
  // each crossed one rename contributes three. Reported as
  // `spanRenameCrossings`, because that is what it is: the name
  // `renamesFollowed` on this quantity told a reviewer that three files
  // had moved when one had.
  let spanCrossings = 0
  const lifetimes: number[] = []

  for (const file of record.files) {
    for (const span of file.spans) {
      const life = span.lifespan
      if (life?.renamesFollowed) spanCrossings += life.renamesFollowed
      if (!life || life.fate === 'untested') continue
      if (SURVIVING.has(span.class)) {
        testedSpans++
        if (life.fate === 'durable') durableSpans++
        else if (life.fate === 'eroded') erodedSpans++
        else decayedSpans++
        durableChars += life.survivingChars
        decayedChars += life.decayedChars
        if (life.decayedChars > 0) lifetimes.push(life.intactSeconds)
      } else if (span.class === 'no_generation_provenance') {
        // The control. This text the user wrote themselves, so its decay
        // is the repo's own churn. Agent text decaying at the baseline is
        // not decaying because it was agent text.
        baseDurable += life.survivingChars
        baseDecayed += life.decayedChars
      }
    }
  }

  // A rename counted once, keyed on the commit that performed it and the
  // path pair it moved. traceFile appends one entry per revision it crosses,
  // so `crossings.length` is already per-file rather than per-span; the Set
  // is what makes the number safe when two walks reach the same rename,
  // which happens when a record lists the same path in two FinalFile
  // entries. Summing the per-span field, which is what the old
  // `renamesFollowed` did, cannot be rescued that way: it multiplies one
  // move by the number of spans sitting in the file that moved.
  const distinctRenames = new Set(crossings.map((c) => `${c.sha}\u0000${c.from}\u0000${c.to}`)).size

  const baseTotal = baseDurable + baseDecayed
  const total = durableChars + decayedChars
  record.durability = {
    method: 'git-forward-walk',
    tipSha: tip,
    closingSha,
    testedSpans,
    durableSpans,
    erodedSpans,
    decayedSpans,
    durableChars,
    decayedChars,
    decayRate: total === 0 ? null : decayedChars / total,
    baselineDecayRate: baseTotal === 0 ? null : baseDecayed / baseTotal,
    medianIntactSeconds: median(lifetimes),
    maxRevisionsWalked: maxRevisions,
    minTraceableLen: MIN_TRACEABLE_LEN,
    // Both absent rather than 0 when the walk crossed nothing, so a record
    // from before the walk could follow a rename stays indistinguishable
    // from one whose files never moved. See the field comments in types.ts.
    ...(spanCrossings > 0 ? { spanRenameCrossings: spanCrossings } : {}),
    ...(distinctRenames > 0 ? { distinctRenamesFollowed: distinctRenames } : {}),
  }
  return record
}
