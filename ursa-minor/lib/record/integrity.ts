/**
 * Saying, out loud, whether the record you got is the record that was
 * published.
 *
 * ## Why this file exists
 *
 * The resolver seat's fallback record page inlines the entire record
 * into the HTML, so the page needs no network and cannot be shown a
 * record other than the one it was built around. That is a real
 * integrity property and it is the reason the page is megabytes. The
 * handoff that produced this file put the tension plainly: keeping the
 * page self-contained and making it small pull in opposite directions,
 * and the resolution is a presentation decision. The one thing asked of
 * whatever replaces inlining is that it keep the claim, "because the
 * page's whole promise is that it shows where this person's data went".
 *
 * So this viewer fetches, and then checks. The index states a digest for
 * each record; the viewer hashes the bytes it actually received and
 * compares. Inlining proved the same thing by never letting the two
 * separate. Fetching proves it by checking.
 *
 * ## What the check proves, exactly
 *
 * It proves the record in front of you is byte-for-byte the record this
 * site's index was written against. That catches a truncated download, a
 * stale copy on a CDN edge, a record quietly replaced without the index
 * being rewritten, and anything in the middle of the connection
 * rewriting the body.
 *
 * ## What it does not prove, stated because the alternative is a page
 * that overclaims
 *
 * It does not prove the publisher is honest. The index and the record
 * come from the same place, so whoever can change one can change the
 * other and make them agree. No digest fetched from the same origin as
 * the thing it describes can close that gap, and this page will not
 * pretend otherwise. What the digest gives you is a record that cannot
 * drift from its own index without being caught, which is the property
 * inlining had.
 *
 * ## The contract 0.1 case
 *
 * `PublishedRecordSummary` at index contract 0.1 carries no digest. The
 * field was requested of the resolver seat on 2026-10-18, as an additive
 * change and a minor version bump, which is the route that seat named
 * for exactly this. Until a site carries it, `verify` returns
 * `unverifiable` and the page says the site's index predates digests. It
 * does not say "verified", and it does not say "failed", because neither
 * is true.
 */

import type { PublishedRecordSummary } from './published-index'

export type Integrity =
  | { state: 'verified'; sha256: string; bytes: number }
  | { state: 'mismatch'; expected: string; got: string; bytes: number }
  | {
      state: 'unverifiable'
      reason: 'no-digest-in-index' | 'no-subtle-crypto' | 'no-index-to-check-against'
      bytes: number
      /**
       * The digest of what did arrive, when it could be computed. There
       * is nothing to compare it to, which is why the state is
       * unverifiable, but it is not useless: it is the one number a
       * person can read back to whoever sent them the address, and
       * `ursa address` prints the same number on the publishing side.
       */
      sha256?: string
    }

/** Lower-case hex SHA-256 of a string, as the publisher would have hashed it. */
export async function sha256Hex(text: string): Promise<string | null> {
  // `crypto.subtle` is unavailable on a page served over plain http from
  // anything but localhost. That is a legitimate way to read your own
  // site before you publish it, so it is a stated non-answer rather than
  // a thrown error.
  if (typeof crypto === 'undefined' || !crypto.subtle) return null
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

/**
 * Check received bytes against what the index said they would be.
 *
 * `text` must be the response body exactly as it arrived, before any
 * parse, because the digest is over bytes and a parsed-then-reserialised
 * record is a different string with the same meaning.
 */
export async function verify(summary: PublishedRecordSummary, text: string): Promise<Integrity> {
  const bytes = new TextEncoder().encode(text).length
  const expected = summary.sha256?.trim().toLowerCase()
  if (!expected) return { state: 'unverifiable', reason: 'no-digest-in-index', bytes }

  const got = await sha256Hex(text)
  if (got === null) return { state: 'unverifiable', reason: 'no-subtle-crypto', bytes }
  if (got !== expected) return { state: 'mismatch', expected, got, bytes }
  return { state: 'verified', sha256: got, bytes }
}

/** The sentence the page shows for each outcome. */
export function integrityCopy(i: Integrity): { tone: 'good' | 'bad' | 'quiet'; line: string } {
  switch (i.state) {
    case 'verified':
      return {
        tone: 'good',
        line: 'These bytes are the ones this site published. The index states a digest for this record, and the copy your browser fetched hashes to it.',
      }
    case 'mismatch':
      return {
        tone: 'bad',
        line: 'These bytes are not the ones this site published. The record your browser fetched does not hash to the digest in the index, so something changed between the two. Read what is below as unverified.',
      }
    case 'unverifiable':
      switch (i.reason) {
        case 'no-digest-in-index':
          return {
            tone: 'quiet',
            line: 'This site states no digest for its records, so nothing here can check that the copy you were sent is the one it published. Its index predates the field. The record is shown as it arrived.',
          }
        case 'no-index-to-check-against':
          return {
            tone: 'quiet',
            line: 'A record address names a record and no index, so there is no published digest here to check these bytes against, and this page is not going to imply it checked one. What it can tell you is the digest of what arrived, which is the same number the publisher sees when they print the address, so the two can be read to each other.',
          }
        case 'no-subtle-crypto':
          return {
            tone: 'quiet',
            line: 'Your browser does not offer hashing on this page, which happens when a page is served over plain http. The record is shown as it arrived, unchecked.',
          }
      }
  }
}

/**
 * The same honesty, for a record fetched by its own address rather than
 * through a site's index.
 *
 * A record address carries its own location and nothing else. There is
 * no index in the path, by design, because an index would be a second
 * thing to fetch and a service that resolved addresses would be a thing
 * Ursa must not run. So there is no published digest to compare against,
 * and this cannot and must not report "verified".
 *
 * What it can do is compute the digest of what arrived and say plainly
 * that nothing on this page checked it. That number is checkable by a
 * person: it is what the publisher's own `ursa address` prints, so the
 * two can be read to each other, which is weaker than a check and much
 * better than silence. A record opened through a site's index gets the
 * real check, and the page below points there.
 */
export async function unverifiableDigest(text: string): Promise<Integrity> {
  const bytes = new TextEncoder().encode(text).length
  const got = await sha256Hex(text)
  if (got === null) return { state: 'unverifiable', reason: 'no-subtle-crypto', bytes }
  return { state: 'unverifiable', reason: 'no-index-to-check-against', bytes, sha256: got }
}

/** Bytes, for a person rather than for a machine. */
export function humanBytes(n: number): string {
  if (n < 1024) return `${n} bytes`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`
  return `${(n / (1024 * 1024)).toFixed(1)} MB`
}
