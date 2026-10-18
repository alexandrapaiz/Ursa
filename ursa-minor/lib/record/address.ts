/**
 * The record address, on the reading side.
 *
 * ## What this is for
 *
 * A person who resolved some work has one record and wants to send it to
 * someone. The record id alone cannot do that: it is built from a
 * directory name, a date and a short commit sha, so it is unique inside
 * one machine's `.ursa/` and namespaced by nothing outside it, and it
 * says nothing about where its bytes are. The usual fix is a service
 * that resolves ids to locations, and Ursa may not run one, because a
 * register of who published which record is worse to hold than the
 * records.
 *
 * So the address carries its own location. The resolver seat's grammar,
 * which it sent to this seat on 2026-10-18, is one slash-separated
 * string in three forms:
 *
 *     git/<owner>/<repo>/<ref>/<record-id>   committed to a repository,
 *                                            read through raw.githubusercontent.com
 *     pages/<owner>/<repo>/<record-id>       published as a site on GitHub Pages
 *     url/<https url>                        published anywhere else, resolves to itself
 *
 * This file parses that string and turns it into the one URL it names.
 * Nothing in between: no index to look in, no service to ask, and no
 * request to anything Ursa operates. The browser fetches the record from
 * the person's own host, which is the same promise `record-loader.tsx`
 * makes about a file on disk.
 *
 * ## Why this is a second implementation and not an import
 *
 * The grammar is defined in `ursa-major/src/address.ts`, which is the
 * resolver's package: it imports `node:child_process` and `node:fs` to
 * read a project's git state, and it is not importable into a browser
 * bundle. The two halves also ship on different clocks, since the
 * resolver runs on a person's machine at whatever version they installed
 * and this page is whatever is deployed.
 *
 * What makes the duplication safe rather than a second source of truth
 * is that only the pure half is restated here, the part that turns a
 * string into a URL, and it is pinned: `READS_ADDRESS_VERSION` is the
 * grammar version this file was written against, and
 * `scripts/check-address-route.mjs` holds the cases that would show the
 * two drifting apart. The resolver owns the grammar. This is a reader of
 * it, and it says so.
 *
 * ## The two things the resolver seat measured for this file
 *
 * Both are invisible from the schema and both change what this page can
 * honestly say, so they are recorded where the code uses them:
 *
 * 1. `raw.githubusercontent.com` and GitHub Pages both send
 *    `access-control-allow-origin: *` on a hit **and on a miss**. So a
 *    404 arrives as a 404 rather than as an opaque network failure,
 *    which is the difference between telling someone "that record is not
 *    published yet" and "your browser could not read that address". See
 *    `fetchFailure`.
 *
 *    Re-measured here on 2026-10-18 with `curl -H 'Origin: …'`, because
 *    both hosts send these headers only when an origin is stated, and
 *    the re-measurement found one case the first one did not cover. The
 *    header follows the **host**, not the path: `octocat.github.io`
 *    sends it on a 404 for a file and on a 404 for a repository that has
 *    no site at all, while an account with no Pages site anywhere
 *    (`alexandrapaiz.github.io`, measured the same minute) answers 404
 *    with no header at all. So on the `pages` scheme a thrown fetch most
 *    often means that account has never deployed a Pages site, rather
 *    than a network that is down, and the sentence says the likelier
 *    thing first.
 * 2. `raw.githubusercontent.com` serves every file as `text/plain`. The
 *    self-contained HTML page that `ursa publish` writes beside each
 *    record therefore arrives at a browser as source code when it comes
 *    from a committed store. On the `git` scheme this viewer is not the
 *    nicer way to read a record, it is the only way. See
 *    `recordAddressPageUrl`.
 */

/** The grammar version this reader was written against. */
export const READS_ADDRESS_VERSION = '0.1.0'

export type RecordAddressScheme = 'git' | 'pages' | 'url'

export type RecordAddress =
  | { scheme: 'git'; owner: string; repo: string; ref: string; recordId: string }
  | { scheme: 'pages'; owner: string; repo: string; recordId: string }
  | { scheme: 'url'; url: string }

export type ParsedAddress =
  | { ok: true; address: RecordAddress }
  | { ok: false; error: string }

const RAW_HOST = 'raw.githubusercontent.com'

/** Where a project keeps one record, relative to the repository root. */
const STORE_RECORD_PATH = (id: string) => `.ursa/records/${id}.json`
/** Where a published site keeps one record, relative to the site root. */
const SITE_RECORD_PATH = (id: string) => `records/${id}.json`

// GitHub's own limits and the resolver's own record-id rule, restated
// rather than loosened. Every one of these ends up inside a URL this
// page hands to `fetch` and puts in an `href`, so the validation is the
// point of the file as much as the resolution is.
const OWNER = /^[A-Za-z0-9](?:-?[A-Za-z0-9]){0,38}$/
const REPO = /^[A-Za-z0-9._-]{1,100}$/
const REF = /^[A-Za-z0-9._\-/]{1,255}$/
const RECORD_ID = /^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/

/** One address as the one string a person types, shares, and pastes. */
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
 * The errors are sentences because the only caller is a page shown to
 * whoever typed the address, and "malformed" tells that person nothing
 * they can act on.
 */
export function parseRecordAddress(input: string): ParsedAddress {
  const raw = input.trim().replace(/^\/+/, '')
  if (!raw) return { ok: false, error: 'This page expected a record address and the address is empty.' }

  const slash = raw.indexOf('/')
  if (slash < 0) {
    return {
      ok: false,
      error: `“${raw}” names no scheme. A record address starts with git/, pages/ or url/.`,
    }
  }
  const scheme = raw.slice(0, slash)
  const rest = raw.slice(slash + 1)

  if (scheme === 'url') return parseUrlAddress(rest)
  if (scheme !== 'git' && scheme !== 'pages') {
    return {
      ok: false,
      error: `“${scheme}” is not a record address scheme. The schemes are git, pages and url.`,
    }
  }
  // The one sequence that could walk a fetch out of the path the address
  // claims to name.
  if (rest.includes('..')) {
    return { ok: false, error: 'A record address may not contain “..”, which could point outside the path it names.' }
  }

  const parts = rest.split('/').filter((p) => p !== '')
  const wanted = scheme === 'git' ? 4 : 3
  if (parts.length < wanted) {
    return {
      ok: false,
      error:
        scheme === 'git'
          ? `“git/${rest}” is incomplete. The shape is git/<owner>/<repo>/<ref>/<record-id>.`
          : `“pages/${rest}” is incomplete. The shape is pages/<owner>/<repo>/<record-id>.`,
    }
  }

  const [owner, repo] = parts
  // The id is taken from the end rather than by position, because a ref
  // may contain slashes and a record id may not. That is what keeps the
  // git form unambiguous for a branch named like the ones this company's
  // seats work on.
  const recordId = parts[parts.length - 1]
  const ref = parts.slice(2, parts.length - 1).join('/')

  if (!OWNER.test(owner)) return { ok: false, error: `“${owner}” is not a GitHub account name.` }
  if (!REPO.test(repo)) return { ok: false, error: `“${repo}” is not a GitHub repository name.` }
  if (!RECORD_ID.test(recordId)) return { ok: false, error: `“${recordId}” is not a record id.` }

  if (scheme === 'pages') {
    if (parts.length !== 3) {
      return {
        ok: false,
        error: `“pages/${rest}” has ${parts.length} parts and the shape takes 3: pages/<owner>/<repo>/<record-id>.`,
      }
    }
    return { ok: true, address: { scheme: 'pages', owner, repo, recordId } }
  }
  if (!REF.test(ref)) return { ok: false, error: `“${ref}” is not a git ref.` }
  return { ok: true, address: { scheme: 'git', owner, repo, ref, recordId } }
}

/**
 * `url/` is parsed apart from the other two because its payload is one
 * opaque string rather than slash-separated fields, and because it is
 * the only form whose host this page can promise nothing about.
 *
 * The two repairs before parsing are both about this string having
 * travelled through a URL path to get here, which is exactly what
 * happens on the route that calls this. Neither one is the person
 * typing it wrong, so neither is reported as an error.
 */
function parseUrlAddress(rest: string): ParsedAddress {
  let text = rest
  // Percent-decoding: the correct way to put an absolute URL in one path
  // segment is to encode it, and routers usually decode it again on the
  // way out, but not always.
  if (!/^https:\/\//i.test(text) && text.includes('%')) {
    try {
      text = decodeURIComponent(text)
    } catch {
      return { ok: false, error: `“${rest}” is not a web address.` }
    }
  }
  // Re-doubling the slash after the scheme: a path normaliser collapses
  // the empty segment in `/record/at/url/https://host/x` and delivers
  // `https:/host/x`, which `new URL` accepts as a hostless opaque path,
  // so without this repair it would resolve to something that is not the
  // address anyone typed.
  text = text.replace(/^https:\/(?!\/)/i, 'https://')

  let url: URL
  try {
    url = new URL(text)
  } catch {
    return { ok: false, error: `“${rest}” is not a web address.` }
  }
  // Anything but https is refused rather than rewritten, because this
  // value becomes a fetch target and an href: `javascript:` and `data:`
  // reach here from a paste as easily as `http:` does.
  if (url.protocol !== 'https:') {
    return {
      ok: false,
      error: `A record address must be served over https, and this one is ${url.protocol.replace(':', '')}.`,
    }
  }
  if (url.username || url.password) {
    return { ok: false, error: 'A record address may not carry a username or a password.' }
  }
  if (!url.hostname) return { ok: false, error: `“${rest}” names no host.` }
  return { ok: true, address: { scheme: 'url', url: url.toString() } }
}

/**
 * The one URL the address resolves to: the record's JSON, which is the
 * bytes this page hashes and parses.
 *
 * The `<owner>.github.io` repository is served at the host root rather
 * than under its own name, which is GitHub's rule and the difference
 * between an address and a 404 for anybody whose records live in their
 * user site.
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
 * The plain page `ursa publish` writes beside each record, or null when
 * the scheme has no page worth opening.
 *
 * Null on `git` is not an oversight. Raw serves every file as
 * `text/plain`, measured by the resolver seat on 2026-10-18, so that
 * page arrives as source code and linking to it would be a worse answer
 * than linking to nothing. Null on `url` is honest ignorance: the bytes
 * could be anywhere and there is no second file to guess at.
 */
export function recordAddressPageUrl(a: RecordAddress): string | null {
  if (a.scheme !== 'pages') return null
  const host = `${a.owner.toLowerCase()}.github.io`
  const base = a.repo.toLowerCase() === host ? '' : `/${a.repo}`
  return `https://${host}${base}/records/${a.recordId}.html`
}

/**
 * The address of this viewer's own page for an address, which is the
 * link a person shares.
 *
 * The scheme and its fields stay literal, because they are already
 * path-safe and a reader should be able to see what they are opening.
 * The `url` payload is percent-encoded instead: it carries its own
 * scheme and slashes, and the parser on the other side decodes it and
 * repairs the collapsed slash a router leaves behind either way.
 */
export function recordAddressHref(address: string): string {
  const raw = address.trim().replace(/^\/+/, '')
  if (/^url\//i.test(raw)) {
    return `/record/at/url/${encodeURIComponent(raw.slice(4))}`
  }
  return `/record/at/${raw}`
}

/** The record this address names, when its scheme carries one. */
export function recordAddressId(a: RecordAddress): string | null {
  return a.scheme === 'url' ? null : a.recordId
}

/** The host the bytes will be fetched from, for a page that says so. */
export function recordAddressHost(a: RecordAddress): string {
  try {
    return new URL(recordAddressUrl(a)).hostname
  } catch {
    return 'an unknown host'
  }
}

/**
 * What the reader of this address should know about taking it down
 * again, or null when there is nothing to say.
 *
 * This is the resolver seat's sentence and it is repeated here rather
 * than paraphrased, because it is about the constraint this company
 * calls load-bearing: a person can always delete what was inferred
 * about them. A record committed and pushed is in that repository's
 * history, and `ursa forget` deletes the local file and cannot reach a
 * commit already pushed. The viewer shows it on the `git` scheme because
 * the moment someone is looking at a committed record is a moment the
 * cost is concrete and no design document is open.
 */
export function permanenceNote(a: RecordAddress): string | null {
  if (a.scheme !== 'git') return null
  return (
    'This record is committed to a repository, so it stays in that repository’s history. ' +
    '`ursa forget` deletes the local file and records the erasure, and it cannot remove a commit ' +
    'that has already been pushed. A published record you can take down later is what ' +
    '`ursa publish` to GitHub Pages gives you instead, because that path deploys a built site ' +
    'rather than a commit, so publishing again without the record removes it.'
  )
}

/**
 * Why a fetch of a record address did not produce a record, in the words
 * this page shows.
 *
 * The split between "not there" and "not readable" is only possible
 * because of a measurement: both GitHub hosts send a permissive
 * cross-origin header on a 404 as well as on a hit, so a missing record
 * arrives here as a status rather than as the same opaque failure a
 * blocked host produces. Where the host is one of those two, a thrown
 * fetch is therefore much more likely to be a wrong host than a CORS
 * refusal, and the sentence says so.
 */
export function fetchFailure(a: RecordAddress, status: number | 'threw'): string {
  const url = recordAddressUrl(a)

  if (status === 404) {
    if (a.scheme === 'git') {
      return (
        `Nothing is committed at that address yet. ${url} answered 404, which on this host means ` +
        'the file is not in that repository at that ref: either the record has not been committed ' +
        'and pushed, or the ref is not the branch it is on. The address itself is well formed.'
      )
    }
    if (a.scheme === 'pages') {
      return (
        `That record is not on that site. ${url} answered 404, so either the site has not been ` +
        'published since the record was resolved, or the record was taken down by publishing ' +
        'again without it, which is what taking one down looks like on this path.'
      )
    }
    return `${url} answered 404. Whatever is meant to be there is not there now.`
  }
  if (status === 'threw') {
    if (a.scheme === 'git') {
      return (
        `Your browser could not reach ${url} at all. That host answers a missing file with a ` +
        'readable 404, so this is a network or a host that is not answering rather than a record ' +
        'that is not there.'
      )
    }
    if (a.scheme === 'pages') {
      return (
        `Your browser could not read ${url}. An account that has published any GitHub Pages site ` +
        `answers a missing record with a readable 404, so the likeliest thing here is that ` +
        `${a.owner} has no Pages site at all and GitHub's own 404 page is refusing to be read ` +
        'cross-origin. Either nothing has been deployed for that account yet, or the account name ' +
        'is not the one that published the record.'
      )
    }
    return `Your browser could not read ${url}. A host that sends no permissive cross-origin header will refuse to load here, and nothing on our side will fetch it for you; that is the point of the design rather than a limitation of it.`
  }
  if (status === 403) {
    return `${url} answered 403. A private repository is readable by you when you are signed in and not by a page fetching on your behalf, so an address to one is not an address a stranger can read.`
  }
  return `${url} answered ${status}, so this page has no record to show you.`
}
