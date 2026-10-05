// The GitHub REST calls the CI launch makes, and no others.
//
// Written against Node 22's built-in global fetch rather than @octokit or
// the preinstalled `gh` binary, for one reason: the bundle must run on a
// runner with nothing installed. A dependency would have to be installed
// and `gh` is only guaranteed on GitHub-hosted runners, not self-hosted
// ones. fetch is in the runtime itself.
//
// Four calls, each one named for what it is for:
//
//   listRepoRunComments  find the previous run's comment anywhere in the
//                        repository, to read its reactions
//   listReactions        the reactions on one comment
//   listPrComments       this pull request's own comments, so a re-run
//                        updates its comment instead of posting a second
//   postComment/patchComment  write it
//
// The token is read from the caller, used as a bearer header, and never
// logged. Nothing here prints a header or an environment value.

import type { IssueComment, Reaction } from './reactions'

export interface GitHubApiOptions {
  /** "owner/name" */
  repo: string
  token: string
  /** defaults to the public API; GITHUB_API_URL on an Enterprise runner */
  baseUrl?: string
  fetchImpl?: typeof fetch
}

export interface GitHubApi {
  listRepoRunComments(): Promise<IssueComment[]>
  listPrComments(prNumber: number): Promise<IssueComment[]>
  listReactions(commentId: number): Promise<Reaction[]>
  postComment(prNumber: number, body: string): Promise<IssueComment>
  patchComment(commentId: number, body: string): Promise<IssueComment>
}

export class GitHubApiError extends Error {
  constructor(public status: number, public endpoint: string, message: string) {
    super(`GitHub API ${status} on ${endpoint}: ${message}`)
  }
}

export function githubApi(opts: GitHubApiOptions): GitHubApi {
  const base = (opts.baseUrl ?? 'https://api.github.com').replace(/\/$/, '')
  const doFetch = opts.fetchImpl ?? fetch

  async function call<T>(method: string, path: string, body?: unknown): Promise<T> {
    const res = await doFetch(`${base}${path}`, {
      method,
      headers: {
        accept: 'application/vnd.github+json',
        authorization: `Bearer ${opts.token}`,
        'x-github-api-version': '2022-11-28',
        'user-agent': 'ursa-major-action',
        ...(body === undefined ? {} : { 'content-type': 'application/json' }),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
    if (!res.ok) {
      throw new GitHubApiError(res.status, `${method} ${path}`, (await res.text()).slice(0, 400))
    }
    return (await res.json()) as T
  }

  return {
    // Repository-wide, newest first. One page of 100 is enough: the
    // previous merge's comment is at most a few merges back, and paging
    // the whole history of a busy repository to find it would cost more
    // than the signal is worth.
    listRepoRunComments: () =>
      call<IssueComment[]>('GET', `/repos/${opts.repo}/issues/comments?sort=created&direction=desc&per_page=100`),
    listPrComments: (prNumber) =>
      call<IssueComment[]>('GET', `/repos/${opts.repo}/issues/${prNumber}/comments?per_page=100`),
    listReactions: (commentId) =>
      call<Reaction[]>('GET', `/repos/${opts.repo}/issues/comments/${commentId}/reactions?per_page=100`),
    postComment: (prNumber, body) =>
      call<IssueComment>('POST', `/repos/${opts.repo}/issues/${prNumber}/comments`, { body }),
    patchComment: (commentId, body) =>
      call<IssueComment>('PATCH', `/repos/${opts.repo}/issues/comments/${commentId}`, { body }),
  }
}
