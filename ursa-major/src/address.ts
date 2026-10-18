// The record address: the identity of one outcome record, written so that
// a stranger can type it and a browser can read what it points at.
//
// WHY THIS FILE EXISTS. `src/publish.ts` takes the records in a project's
// `.ursa/` and writes a directory of static files, and it stops there on
// purpose: whoever called it decides where that directory goes. That left
// one thing unanswered, and the frontend seat asked for it by name on the
// board on 2026-10-18: "if your half gives a record an identity a
// stranger can type, tell me what it looks like and I will point the
// route at it rather than at a committed file."
//
// A record id on its own cannot be that identity. `episodeId` in
// src/episodes.ts builds it as `<dir>-<date>-<sha7>`, which is unique
// enough inside one person's `.ursa/` and namespaced by nothing at all
// outside it. Two strangers resolving two different repositories both
// named `site` on the same day produce colliding ids, and neither id
// says where the bytes are. Ursa operates no server that could resolve
// one, by design — CLAUDE.md's third constraint — so there is nothing to
// look the id up in.
//
// So the identity has to carry its own location. That is what a
// `RecordAddress` is: a short string naming a host, a repository and a
// record, which expands to exactly one `https://` URL with no lookup,
// no index and no service in the middle.
//
// THE CROSS-ORIGIN CONSTRAINT, which is the reason this module picks the
// hosts it picks. The frontend seat's second note said it plainly: the
// viewer fetches the record from the person's own browser and refuses to
// proxy it through any server of Ursa's, so an address is only readable
// if its host sends a permissive `Access-Control-Allow-Origin` header.
// That is not a schema question and it is invisible from the data side,
// so it is answered here, measured rather than assumed. Taken on
// 2026-10-18 with `curl -sS -I`:
//
//   raw.githubusercontent.com   200 and 404   access-control-allow-origin: *
//   GitHub Pages                200 and 404   access-control-allow-origin: *
//   codeload.github.com         200          access-control-allow-origin: https://render.githubusercontent.com
//
// The first two are the two schemes below. codeload is named because it
// is the obvious third candidate — it serves a whole repository as one
// archive — and it is the one that does not work in a browser, which is
// exactly the failure the frontend seat warned about.
//
// THE TWO SCHEMES, AND WHY BOTH ARE KEPT.
//
//   git/<owner>/<repo>/<ref>/<id>   the record committed to a repository,
//                                   read through raw.githubusercontent.com
//   pages/<owner>/<repo>/<id>       the record in a site written by
//                                   `ursa publish` and deployed to the
//                                   repository's own GitHub Pages
//
// `git` needs no deployment of any kind. A person runs `ursa run`,
// commits the record, pushes, and the record is at a public address that
// a browser can read. No Action, no workflow, no Pages setting, no
// account. That is the shortest path from the work to an address that
// exists, and it is why this module leads with it.
//
// `pages` needs one workflow file and the Pages source setting, and it
// buys back the thing `git` gives away: erasure. `actions/deploy-pages`
// publishes an artifact rather than a branch, so re-running `ursa
// publish` over a store a record has been erased from takes that record
// off the site. A record committed to git history is in that history
// permanently, and `ursa forget` cannot reach a pushed commit. Both
// facts are the publisher's to weigh, so both are offered and the
// consequence is printed rather than buried — see `permanenceNote`.
//
// `url/<https url>` is the escape hatch for a record published anywhere
// else. It resolves to itself and claims nothing about the host's
// headers, because this module cannot know them.
//
// WHAT THIS MODULE DOES NOT DO. It opens no socket and reads no network.
// `addressState` runs git against the project and nothing else, so the
// command built on it is as safe to run as `git status`. The one
// network call in this feature is `--check` in src/address.cli.ts, which
// is opt-in, is a single HEAD request to an address the person already
// has, and exists so that the header claim above is checkable by the
// person reading it rather than only by the pull request that made it.

import { execFileSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { join, relative, sep } from 'node:path'
import { isForgotten, loadConsent } from './consent'
import { SAFE_RECORD_ID } from './store'

/**
 * The scheme is the first segment of an address and it names how the
 * remaining segments become a URL. Spelled as words rather than as a
 * single letter because a person types this and reads it back in a URL
 * bar.
 */
export type RecordAddressScheme = 'git' | 'pages' | 'url'

export type RecordAddress =
  | {
      scheme: 'git'
      /** GitHub account or organization that owns the repository */
      owner: string
      /** repository name, without the owner */
      repo: string
      /**
       * Anything `raw.githubusercontent.com` accepts in its ref position:
       * a branch name, a tag, or a full commit sha. A commit sha is the
       * only one of the three that cannot change under the reader, which
       * is why `addressState` prefers to report one.
       */
      ref: string
      recordId: string
    }
  | { scheme: 'pages'; owner: string; repo: string; recordId: string }
  | {
      scheme: 'url'
      /** an absolute `https://` URL to the record's JSON, verbatim */
      url: string
    }

/**
 * The version of the address grammar itself, which is not the version of
 * the record schema (`OutcomeRecord.schemaVersion`) nor of the published
 * index (`PUBLISHED_INDEX_VERSION` in src/publish.ts). Three things that
 * can move independently get three numbers: a viewer can pin the shape
 * of the string it parses out of a route without being told that a
 * record gained a field.
 */
export const RECORD_ADDRESS_VERSION = '0.1.0'

/** Where a published site keeps one record's JSON, relative to the site root. */
const SITE_RECORD_PATH = (id: string) => `records/${id}.json`

/** Where a project keeps one record's JSON, relative to the project root. */
export const STORE_RECORD_PATH = (id: string) => `.ursa/records/${id}.json`

const RAW_HOST = 'raw.githubusercontent.com'

// GitHub's own limits, not guesses: an account name is up to 39
// characters of alphanumerics and single hyphens, and a repository name
// is up to 100 characters of alphanumerics, hyphens, underscores and
// dots. Checked rather than trusted because every one of these ends up
// inside a URL this process prints and another process fetches.
const OWNER = /^[A-Za-z0-9](?:-?[A-Za-z0-9]){0,38}$/
const REPO = /^[A-Za-z0-9._-]{1,100}$/
// A ref may contain slashes — this branch is called
// `ursa-engineer/2026-10-18-message` — so it is the one multi-segment
// field, and the record id being last is what keeps the grammar
// unambiguous. `..` is refused outright: it is the one sequence that
// could walk a fetch out of the path this address claims to name.
const REF = /^[A-Za-z0-9._\-/]{1,255}$/

export type ParsedAddress =
  | { ok: true; address: RecordAddress }
  | { ok: false; error: string }

/**
 * One address as a string: the scheme, then its fields, slash-separated.
 * This is the form a person types, the form that goes in a URL path, and
 * the form `index.json` carries, so there is exactly one of it.
 */
export function formatRecordAddress(a: RecordAddress): string {
  switch (a.scheme) {
    case 'git':
      return `git/${a.owner}/${a.repo}/${a.ref}/${a.recordId}`
    case 'pages':
      return `pages/${a.owner}/${a.repo}/${a.recordId}`
    case 'url':
      return `url/${a.url}`
  }
}

/**
 * The inverse, strict, with the reason in words when it refuses.
 *
 * The errors are sentences rather than codes because both callers show
 * them to a person: the command below prints them, and a viewer route
 * that cannot parse what is in its path has nothing else to say to the
 * stranger who typed it.
 *
 * A leading slash is tolerated, since this string lives in a URL path and
 * will arrive with one about half the time.
 */
export function parseRecordAddress(input: string): ParsedAddress {
  const raw = input.trim().replace(/^\/+/, '')
  if (!raw) return { ok: false, error: 'an address was expected and the string was empty' }
  const slash = raw.indexOf('/')
  if (slash < 0) {
    return {
      ok: false,
      error: `"${raw}" names no scheme. An address starts with "git/", "pages/" or "url/".`,
    }
  }
  const scheme = raw.slice(0, slash)
  const rest = raw.slice(slash + 1)

  if (scheme === 'url') {
    return parseUrlAddress(rest)
  }
  if (scheme !== 'git' && scheme !== 'pages') {
    return {
      ok: false,
      error: `"${scheme}" is not an address scheme. The schemes are "git", "pages" and "url".`,
    }
  }
  if (rest.includes('..')) {
    return { ok: false, error: 'an address may not contain "..", which could walk out of the path it names' }
  }
  const parts = rest.split('/').filter((p) => p !== '')
  const wanted = scheme === 'git' ? 4 : 3
  if (parts.length < wanted) {
    return {
      ok: false,
      error:
        scheme === 'git'
          ? `"git/${rest}" is incomplete. The shape is git/<owner>/<repo>/<ref>/<record-id>.`
          : `"pages/${rest}" is incomplete. The shape is pages/<owner>/<repo>/<record-id>.`,
    }
  }
  const [owner, repo] = parts
  // The record id is taken from the end rather than by position, because
  // the ref between them may itself contain slashes and the id may not.
  const recordId = parts[parts.length - 1]
  const ref = parts.slice(2, parts.length - 1).join('/')

  if (!OWNER.test(owner)) return { ok: false, error: `"${owner}" is not a GitHub account name` }
  if (!REPO.test(repo)) return { ok: false, error: `"${repo}" is not a GitHub repository name` }
  if (!SAFE_RECORD_ID.test(recordId)) {
    return { ok: false, error: `"${recordId}" is not a record id` }
  }
  if (scheme === 'pages') {
    if (parts.length !== 3) {
      return {
        ok: false,
        error: `"pages/${rest}" has ${parts.length} parts and the shape takes 3: pages/<owner>/<repo>/<record-id>.`,
      }
    }
    return { ok: true, address: { scheme: 'pages', owner, repo, recordId } }
  }
  if (!REF.test(ref)) return { ok: false, error: `"${ref}" is not a git ref` }
  return { ok: true, address: { scheme: 'git', owner, repo, ref, recordId } }
}

/**
 * `url/...` is parsed separately because its payload is one opaque
 * string, not slash-separated fields, and because it is the only scheme
 * whose contents this module cannot vouch for.
 *
 * Two refusals, both about what a typed address could smuggle. Anything
 * but `https:` is refused, so no `javascript:` or `data:` string can
 * reach a viewer that hands this to `fetch`. A userinfo component is
 * refused as well: a credential written into a URL that this process
 * prints, a workflow logs and a page shows is a leak with no upside, and
 * nothing that serves a record needs one.
 */
function parseUrlAddress(rest: string): ParsedAddress {
  // Two repairs before parsing, both of them about this string having
  // travelled through a URL path on the way here.
  //
  // Percent-decoding, because the honest way to put an absolute URL into
  // one path segment is to encode it, and a router usually decodes it
  // again before handing it over, but not always.
  //
  // Re-doubling the slash after the scheme, because a path router
  // normalising `/record/url/https://host/x` collapses the empty
  // segment and delivers `https:/host/x`. That string is a valid URL to
  // `new URL` — it parses as an opaque path with no host — so without
  // this it would not be rejected either; it would resolve to something
  // that is not the address the person typed.
  let text = rest
  if (!/^https:\/\//i.test(text) && text.includes('%')) {
    try {
      text = decodeURIComponent(text)
    } catch {
      return { ok: false, error: `"${rest}" is not a URL` }
    }
  }
  text = text.replace(/^https:\/(?!\/)/i, 'https://')
  let url: URL
  try {
    url = new URL(text)
  } catch {
    return { ok: false, error: `"${rest}" is not a URL` }
  }
  if (url.protocol !== 'https:') {
    return {
      ok: false,
      error: `a record address must be served over https, and "${rest}" is ${url.protocol.replace(':', '')}`,
    }
  }
  if (url.username || url.password) {
    return { ok: false, error: 'a record address may not carry a username or password' }
  }
  // Reachable only for something like `https:/x`, whose second slash the
  // repair above could not restore because there was no authority to
  // restore it to. Checked rather than assumed, because `new URL`
  // accepts it and a hostless https URL fetches nothing.
  if (!url.hostname) return { ok: false, error: `"${rest}" names no host` }
  return { ok: true, address: { scheme: 'url', url: url.toString() } }
}

/**
 * The one URL an address resolves to: the record's JSON, which is the
 * bytes a viewer parses.
 *
 * A Pages site for a repository is served under the repository's name,
 * except for the one repository named `<owner>.github.io`, which is
 * served at the host root. That exception is GitHub's and it is the
 * difference between a working address and a 404 for anyone whose
 * records live in their user site, so it is handled here rather than
 * left to whoever writes the string.
 */
export function recordAddressUrl(a: RecordAddress): string {
  switch (a.scheme) {
    case 'git':
      return `https://${RAW_HOST}/${a.owner}/${a.repo}/${a.ref}/${STORE_RECORD_PATH(a.recordId)}`
    case 'pages': {
      const host = `${a.owner.toLowerCase()}.github.io`
      const base = a.repo.toLowerCase() === host ? '' : `/${a.repo}`
      return `https://${host}${base}/${SITE_RECORD_PATH(a.recordId)}`
    }
    case 'url':
      return a.url
  }
}

/**
 * The address of the plain HTML page `ursa publish` writes beside each
 * record, or null when the scheme has no page worth opening.
 *
 * `git` has none, and the reason is worth stating because it looks like
 * an oversight. `raw.githubusercontent.com` serves every file as
 * `text/plain` — measured, 2026-10-18 — so the self-contained viewer
 * page sitting next to the JSON in a committed store arrives at a
 * browser as source code rather than as a page. On the `git` scheme the
 * only way to read a record in a browser is a viewer that fetches the
 * JSON, which is precisely the surface the frontend seat owns. On
 * `pages`, GitHub serves the file as `text/html` and the fallback page
 * opens on its own.
 */
export function recordAddressPageUrl(a: RecordAddress): string | null {
  if (a.scheme !== 'pages') return null
  const host = `${a.owner.toLowerCase()}.github.io`
  const base = a.repo.toLowerCase() === host ? '' : `/${a.repo}`
  return `https://${host}${base}/records/${a.recordId}.html`
}

/** The record this address names, when the scheme carries one. */
export function recordAddressId(a: RecordAddress): string | null {
  return a.scheme === 'url' ? null : a.recordId
}

/**
 * What the publisher is signing up to by using this scheme, in one
 * sentence, or null when there is nothing to warn about.
 *
 * This exists because the two schemes differ on the one property
 * CLAUDE.md calls load-bearing — "the user can always see, edit, revoke,
 * and delete what's been inferred about them" — and the difference is
 * invisible at the moment of choosing. A record committed and pushed is
 * in the repository's history, and deleting the file in a later commit
 * leaves the blob reachable from the earlier one. `ursa forget` writes a
 * tombstone and deletes the local file; it has no reach into a pushed
 * history and will not pretend otherwise.
 */
export function permanenceNote(a: RecordAddress): string | null {
  if (a.scheme === 'git') {
    return (
      'A record committed to a repository stays in that repository\'s history. ' +
      '`ursa forget` deletes the local file and records the erasure, and it cannot ' +
      'remove a commit you have already pushed; that takes a history rewrite of your own. ' +
      'If you want a published record you can take down later, publish with `ursa publish` ' +
      'to GitHub Pages instead: that path deploys an artifact rather than a commit, so ' +
      're-publishing without the record removes it.'
    )
  }
  return null
}

// ---------------------------------------------------------------------------
// What the project's git state says about whether an address is live yet
// ---------------------------------------------------------------------------

export interface GitHubRemote {
  /** the git remote's name, e.g. `origin` */
  name: string
  owner: string
  repo: string
}

export interface AddressState {
  recordId: string
  /** the address, or null when no GitHub remote could be read */
  address: RecordAddress | null
  /** `recordAddressUrl(address)`, carried so a caller need not re-derive it */
  url: string | null
  /**
   * True when every condition for a stranger to read that URL holds as
   * far as this clone can see. "As far as this clone can see" is the
   * honest limit: the push check reads a remote-tracking ref, which is
   * as fresh as the last fetch.
   */
  reachable: boolean
  /**
   * What is missing, in sentences, each one naming what to do about it.
   * Empty when `reachable` is true.
   */
  blockers: string[]
  remote: GitHubRemote | null
  /** the branch this record would be read from, and the remote ref it tracks */
  ref: string | null
  /** the record file's path relative to the repository root, in posix form */
  path: string | null
  /** the record file is present in the local `HEAD` commit */
  committed: boolean
  /** the record file is present in the remote-tracking ref for `ref` */
  pushed: boolean
  /**
   * The blob at the remote ref is the same bytes as the file on disk.
   * False with `pushed` true means the address serves an older record,
   * which is a worse failure than an absent one because it is silent.
   */
  current: boolean
  /** git ignores this path, so committing it takes `git add -f` */
  ignored: boolean
  /** the person erased this record, so no address is offered for it */
  forgotten: boolean
}

function git(repoPath: string, args: string[]): { ok: boolean; out: string } {
  try {
    const out = execFileSync('git', ['-C', repoPath, ...args], {
      encoding: 'utf8',
      maxBuffer: 16 * 1024 * 1024,
      stdio: ['ignore', 'pipe', 'ignore'],
    })
    return { ok: true, out: out.trim() }
  } catch {
    // Every call below treats failure as an answer rather than an error:
    // "no upstream", "not in HEAD", "no such remote" are all ordinary
    // states of a repository someone is part way through setting up, and
    // the command's whole job is to name which one they are in.
    return { ok: false, out: '' }
  }
}

/**
 * `owner/repo` out of any remote URL GitHub hands out, or null when the
 * remote is not GitHub.
 *
 * All four forms are real and all four appear in the wild:
 *   https://github.com/owner/repo.git
 *   git@github.com:owner/repo.git
 *   ssh://git@github.com/owner/repo.git
 *   github.com:owner/repo
 */
export function parseGitHubRemote(url: string): { owner: string; repo: string } | null {
  const trimmed = url.trim().replace(/\.git$/, '')
  const m = trimmed.match(/github\.com[:/]+([^/]+)\/([^/]+)$/)
  if (!m) return null
  const [, owner, repo] = m
  if (!OWNER.test(owner) || !REPO.test(repo)) return null
  return { owner, repo }
}

/**
 * The GitHub remote this project pushes to: the upstream of the current
 * branch when it has one, else `origin`, else the first remote that is
 * GitHub at all.
 *
 * The upstream is preferred over `origin` by name because a fork has
 * both and they are different repositories, and the one a stranger's
 * record is actually readable from is the one their branch pushes to.
 */
export function githubRemote(repoPath: string): GitHubRemote | null {
  const names: string[] = []
  const upstream = git(repoPath, ['rev-parse', '--abbrev-ref', '--symbolic-full-name', '@{upstream}'])
  if (upstream.ok && upstream.out.includes('/')) names.push(upstream.out.split('/')[0])
  names.push('origin')
  const all = git(repoPath, ['remote'])
  if (all.ok) names.push(...all.out.split('\n').filter(Boolean))
  for (const name of [...new Set(names)]) {
    const url = git(repoPath, ['remote', 'get-url', name])
    if (!url.ok) continue
    const parsed = parseGitHubRemote(url.out)
    if (parsed) return { name, ...parsed }
  }
  return null
}

/**
 * Everything the project can tell us about one record's public address,
 * without touching the network.
 *
 * The order of the checks is the order a person hits them, so the first
 * blocker printed is the next thing to do.
 */
export function addressState(projectPath: string, recordId: string): AddressState {
  const base: AddressState = {
    recordId,
    address: null,
    url: null,
    reachable: false,
    blockers: [],
    remote: null,
    ref: null,
    path: null,
    committed: false,
    pushed: false,
    current: false,
    ignored: false,
    forgotten: false,
  }

  // Erasure first, before the file is read for any purpose. The same
  // ordering and the same reason as `loadPublishable` in src/publish.ts:
  // a record the person erased is not offered an address, and the
  // erasure is reported as itself rather than as an absence.
  if (isForgotten(loadConsent(projectPath), recordId)) {
    return {
      ...base,
      forgotten: true,
      blockers: ['you erased this record with `ursa forget`, so this command offers no address for it'],
    }
  }
  if (!SAFE_RECORD_ID.test(recordId)) {
    return { ...base, blockers: [`"${recordId}" cannot be part of a URL, so no address exists for it`] }
  }

  const top = git(projectPath, ['rev-parse', '--show-toplevel'])
  if (!top.ok) {
    return {
      ...base,
      blockers: [
        `${projectPath} is not a git work tree, so there is no repository to read the record from. ` +
        'Publish the record with `ursa publish` instead, which needs no git remote.',
      ],
    }
  }
  const repoRoot = top.out
  const absolute = join(projectPath, STORE_RECORD_PATH(recordId))
  const path = relative(repoRoot, absolute).split(sep).join('/')
  const onDisk = existsSync(absolute)

  const remote = githubRemote(repoRoot)
  // The branch name, and the remote-tracking ref the push check reads.
  // A detached HEAD has neither, which is the state a CI runner is in,
  // and it is a blocker rather than a crash.
  const branch = git(repoRoot, ['symbolic-ref', '--short', 'HEAD'])
  const upstream = git(repoRoot, ['rev-parse', '--abbrev-ref', '--symbolic-full-name', '@{upstream}'])
  const ref = branch.ok ? branch.out : null
  const trackingRef = upstream.ok && upstream.out ? upstream.out : remote && ref ? `${remote.name}/${ref}` : null

  const committed = git(repoRoot, ['cat-file', '-e', `HEAD:${path}`]).ok
  const localBlob = onDisk ? git(repoRoot, ['hash-object', '--', absolute]) : { ok: false, out: '' }
  const remoteBlob = trackingRef ? git(repoRoot, ['rev-parse', `${trackingRef}:${path}`]) : { ok: false, out: '' }
  const pushed = remoteBlob.ok
  const current = pushed && localBlob.ok && remoteBlob.out === localBlob.out
  const ignored = git(projectPath, ['check-ignore', '-q', absolute]).ok

  const blockers: string[] = []
  if (!onDisk && !committed) {
    blockers.push(
      `there is no record ${recordId} in ${projectPath}/.ursa/records/. ` +
      `Resolve one with \`ursa run ${projectPath}\` first.`,
    )
  }
  if (!remote) {
    blockers.push(
      'this repository has no GitHub remote, so no raw address exists for it. ' +
      'Add one with `git remote add origin https://github.com/<you>/<repo>.git`, or ' +
      'publish with `ursa publish`, which needs no remote.',
    )
  }
  if (!ref) {
    blockers.push(
      'HEAD is detached, so there is no branch to read the record from. Check out a branch first.',
    )
  }
  if (ignored && !committed) {
    blockers.push(
      `git ignores ${path} — \`.ursa/\` is in this repository's .gitignore, which is this ` +
      'project\'s own default, because a record is raw data. Publishing one is a deliberate ' +
      `act: \`git add -f ${path}\` if that is what you mean to do.`,
    )
  }
  if (!committed && onDisk) {
    blockers.push(`${path} is not in HEAD. Commit it: \`git add -f ${path} && git commit -m "publish one record"\`.`)
  }
  if (committed && !pushed) {
    blockers.push(
      trackingRef
        ? `${path} is committed and ${trackingRef} does not have it as of your last fetch. Push it: \`git push\`.`
        : `${path} is committed and this branch tracks no remote branch. Push it: \`git push -u origin ${ref ?? '<branch>'}\`.`,
    )
  }
  if (pushed && !current) {
    blockers.push(
      `${trackingRef} serves an older version of ${path} than the file on your disk. ` +
      'Commit and push again, or the address shows a record that is not the one you just resolved.',
    )
  }

  const address: RecordAddress | null =
    remote && ref ? { scheme: 'git', owner: remote.owner, repo: remote.repo, ref, recordId } : null

  return {
    recordId,
    address,
    url: address ? recordAddressUrl(address) : null,
    reachable: blockers.length === 0 && address !== null,
    blockers,
    remote,
    ref,
    path,
    committed,
    pushed,
    current,
    ignored,
    forgotten: false,
  }
}

/**
 * The `pages` address for a record, given the repository the publisher
 * states. Separate from `addressState` because nothing in a git work
 * tree can tell you whether a Pages site exists: the Pages source
 * setting is in the repository's settings, not in its contents, and the
 * site is built by a workflow run rather than by a commit. So this
 * returns the address a published site *would* serve the record at, and
 * the only honest check of it is `--check`, which asks the host.
 */
export function pagesAddress(repository: string, recordId: string): RecordAddress | null {
  const [owner, repo] = repository.split('/')
  if (!owner || !repo || !OWNER.test(owner) || !REPO.test(repo)) return null
  if (!SAFE_RECORD_ID.test(recordId)) return null
  return { scheme: 'pages', owner, repo, recordId }
}
