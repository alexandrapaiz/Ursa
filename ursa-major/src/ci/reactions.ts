// Reading acceptance off the previous run's comment.
//
// Plan §14.2: in the Action there is no interactive stdin, so the run
// summary posts as a pull request comment and a thumbs up on it is the
// equivalent satisfaction mark, `source: 'pr-reaction'`, read back
// through the GitHub API on the next run.
//
// Two rules the whole project turns on, enforced here:
//
//   1. A thumbs up is a declaration. Somebody chose to press it, so it
//      is a stated verdict and becomes `accepted: true` with the
//      reactor and the comment it was left on as the basis.
//   2. No reaction is not a declaration. Absence stays `undeclared`
//      forever. Nothing in this module ever converts elapsed time, a
//      merge, or a retained file into acceptance.
//
// Only 👍 is read. A 👎 is left alone deliberately: Ursa has no verified
// meaning for it yet — it could be aimed at the work, at the numbers, or
// at the comment itself — and guessing would be the stated-preference
// survey §0b forbids. It is reported in the log so the next design pass
// can see it happened.

import type { Declaration } from '../signals'

export interface IssueComment {
  id: number
  html_url: string
  created_at: string
  body: string
  user?: { login?: string } | null
}

export interface Reaction {
  content: string
  user?: { login?: string } | null
  created_at?: string
}

export interface SatisfactionMark {
  step: number
  polarity: 'positive'
  source: 'pr-reaction'
  recordedAt: string
}

export interface PriorRunComment {
  commentId: number
  commentUrl: string
  postedAt: string
}

export interface PriorAcceptance {
  comment: PriorRunComment
  thumbsUp: number
  thumbsUpBy: string[]
  thumbsDown: number
  /** the earliest 👍 timestamp, which is when the declaration was made */
  declaredAt: string | null
  mark: SatisfactionMark | null
}

/**
 * The newest comment carrying the marker. Newest rather than first,
 * because the Action updates its comment in place and a repository that
 * has had several Action versions may carry more than one.
 */
export function findPriorRunComment(comments: IssueComment[], marker: string): PriorRunComment | null {
  const mine = comments.filter((c) => c.body.includes(marker))
  if (mine.length === 0) return null
  const newest = mine.reduce((a, b) => (Date.parse(b.created_at) >= Date.parse(a.created_at) ? b : a))
  return { commentId: newest.id, commentUrl: newest.html_url, postedAt: newest.created_at }
}

export function readAcceptance(
  comment: PriorRunComment,
  reactions: Reaction[],
  now: string = new Date().toISOString()
): PriorAcceptance {
  const up = reactions.filter((r) => r.content === '+1')
  const down = reactions.filter((r) => r.content === '-1')
  const stamps = up.map((r) => r.created_at).filter((t): t is string => typeof t === 'string').sort()
  return {
    comment,
    thumbsUp: up.length,
    thumbsUpBy: up.map((r) => r.user?.login ?? 'unknown').sort(),
    thumbsDown: down.length,
    declaredAt: stamps[0] ?? null,
    mark:
      up.length > 0
        ? { step: 0, polarity: 'positive', source: 'pr-reaction', recordedAt: stamps[0] ?? now }
        : null,
  }
}

/**
 * Turn a reaction read into the declaration this run's records carry.
 * No reaction returns a declaration whose `accepted` is null, never
 * false: nobody said the work was wrong, nobody said it was right.
 */
export function declarationFromReaction(prior: PriorAcceptance | null): Declaration {
  if (!prior) {
    return {
      accepted: null,
      basis:
        'undeclared: no previous Ursa run comment existed on this repository, so no reaction could be read. Retention is NOT acceptance.',
    }
  }
  if (prior.thumbsUp > 0) {
    const who = prior.thumbsUpBy.join(', ')
    return {
      accepted: true,
      basis:
        `owner-declared satisfied by a 👍 reaction from ${who} on the previous Ursa run comment ` +
        `(${prior.comment.commentUrl}), left ${prior.declaredAt ?? 'at an unreported time'} ` +
        '(source: pr-reaction)',
    }
  }
  return {
    accepted: null,
    basis:
      `undeclared: the previous Ursa run comment (${prior.comment.commentUrl}) carries no 👍` +
      (prior.thumbsDown > 0 ? `, and its ${prior.thumbsDown} 👎 has no verified meaning and is not read as a verdict` : '') +
      '. Silence stays undeclared; retention is NOT acceptance.',
  }
}
