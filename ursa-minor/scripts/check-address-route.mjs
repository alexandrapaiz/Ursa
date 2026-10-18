// Does this viewer resolve a record address the way the grammar says?
//
// The grammar belongs to the resolver seat (`ursa-major/src/address.ts`).
// This package cannot import it: that module reads a project's git state
// through `node:child_process` and `node:fs`, so it does not go into a
// browser bundle, and the two halves ship on different clocks anyway
// since the resolver is whatever version a person installed.
//
// A restated grammar with no check is a second source of truth waiting
// to drift. So the cases that would show the two disagreeing are
// asserted here, by hand, against the reader in `lib/record/address.ts`:
// every example in the resolver seat's own board message, the two
// repairs a path router makes to an absolute URL in transit, and the
// refusals that matter because the parsed value becomes a `fetch` target
// and an `href`.
//
// No test runner and no new dependency, which is this package's idiom
// for a check that has to run without a framework, and the same shape as
// `check-index-contract.mjs` beside it.
//
//   node --experimental-strip-types scripts/check-address-route.mjs

import {
  READS_ADDRESS_VERSION,
  fetchFailure,
  formatRecordAddress,
  parseRecordAddress,
  permanenceNote,
  recordAddressHost,
  recordAddressHref,
  recordAddressId,
  recordAddressPageUrl,
  recordAddressUrl,
} from '../lib/record/address.ts'
import { integrityCopy, unverifiableDigest } from '../lib/record/integrity.ts'
import { parsePublishedIndex } from '../lib/record/published-index.ts'

let failures = 0
function check(what, cond, detail = '') {
  if (cond) {
    console.log(`  ok    ${what}`)
  } else {
    console.log(`  FAIL  ${what}${detail ? ` — ${detail}` : ''}`)
    failures++
  }
}

const parse = (s) => parseRecordAddress(s)
const url = (s) => {
  const p = parse(s)
  return p.ok ? recordAddressUrl(p.address) : null
}

console.log('\nthe grammar this reader is pinned to')
{
  check('pinned at 0.1.0', READS_ADDRESS_VERSION === '0.1.0')
}

console.log('\nthe committed form')
{
  const p = parse('git/someone/their-repo/main/their-repo-2026-10-16-8dcb0c7')
  check('parses', p.ok === true && p.address.scheme === 'git')
  check(
    'resolves to raw, at the store path',
    url('git/someone/their-repo/main/their-repo-2026-10-16-8dcb0c7') ===
      'https://raw.githubusercontent.com/someone/their-repo/main/.ursa/records/their-repo-2026-10-16-8dcb0c7.json',
  )
  // The ref is the only multi-segment field, which is why the record id
  // is taken from the end. The branches these seats work on are named
  // exactly like this, so it is not a hypothetical.
  const slashy = parse('git/someone/their-repo/ursa-engineer/2026-10-18-message/rec-2026-10-18-abc1234')
  check('a ref with a slash in it survives', slashy.ok === true && slashy.address.ref === 'ursa-engineer/2026-10-18-message')
  check('and the id still comes off the end', slashy.ok === true && slashy.address.recordId === 'rec-2026-10-18-abc1234')
  check('a full commit sha is a ref like any other', parse('git/a/b/2e0ce0075b1e1b4e7f9a1c2d3e4f5061728394a5/r-2026-10-18-abc1234').ok === true)
  check('four parts are the minimum', parse('git/someone/their-repo/main').ok === false)
  check('and the message says what the shape is', parse('git/someone/their-repo/main').error.includes('git/<owner>/<repo>/<ref>/<record-id>'))

  // Raw serves text/plain, measured by the resolver seat on 2026-10-18,
  // so the page written beside a committed record is not a page in a
  // browser and linking to it would be worse than linking to nothing.
  check('has no page to open', recordAddressPageUrl(parse('git/a/b/main/r-2026-10-18-abc1234').address) === null)
  // The erasure trade is the one this company calls load-bearing, so the
  // page says it on the form where it is true and not on the other.
  check('carries the permanence note', typeof permanenceNote(parse('git/a/b/main/r-2026-10-18-abc1234').address) === 'string')
  check('and names ursa publish as the way out of it', permanenceNote(parse('git/a/b/main/r-2026-10-18-abc1234').address).includes('ursa publish'))
}

console.log('\nthe published form')
{
  check(
    'resolves under the repository name',
    url('pages/someone/their-repo/r-2026-10-18-abc1234') ===
      'https://someone.github.io/their-repo/records/r-2026-10-18-abc1234.json',
  )
  // GitHub serves the repository named after the user's own pages host
  // at the root instead. That exception is the difference between an
  // address and a 404 for anyone whose records live in their user site.
  check(
    'and at the host root for the owner\'s own pages repository',
    url('pages/someone/someone.github.io/r-2026-10-18-abc1234') ===
      'https://someone.github.io/records/r-2026-10-18-abc1234.json',
  )
  check(
    'case in the owner is folded for the host, since hosts are not case-sensitive',
    url('pages/SomeOne/Someone.GitHub.io/r-2026-10-18-abc1234') ===
      'https://someone.github.io/records/r-2026-10-18-abc1234.json',
  )
  check(
    'the site page is html beside the json',
    recordAddressPageUrl(parse('pages/someone/their-repo/r-2026-10-18-abc1234').address) ===
      'https://someone.github.io/their-repo/records/r-2026-10-18-abc1234.html',
  )
  check('exactly three parts', parse('pages/someone/their-repo/main/r-2026-10-18-abc1234').ok === false)
  check('nothing to warn about on erasure', permanenceNote(parse('pages/a/b/r-2026-10-18-abc1234').address) === null)
}

console.log('\nthe anywhere-else form, and what a path does to it in transit')
{
  const live = 'https://raw.githubusercontent.com/alexandrapaiz/Ursa/main/ursa-major/fixtures/mini/record/outcome_record.json'
  check('an absolute https address resolves to itself', url(`url/${live}`) === live)
  // A path router collapses the empty segment and delivers `https:/host`,
  // which `new URL` accepts as a hostless opaque path, so without the
  // repair it would resolve to something nobody typed.
  check('a collapsed second slash is repaired', url(`url/${live.replace('https://', 'https:/')}`) === live)
  check('a percent-encoded payload is decoded', url(`url/${encodeURIComponent(live)}`) === live)
  check('a record id is not claimed for it', recordAddressId(parse(`url/${live}`).address) === null)
  check('no page is claimed for a host we have never measured', recordAddressPageUrl(parse(`url/${live}`).address) === null)
  check('the host is named for a page that says where the bytes came from', recordAddressHost(parse(`url/${live}`).address) === 'raw.githubusercontent.com')
}

console.log('\nwhat is refused, because the value becomes a fetch and an href')
{
  check('empty', parse('').ok === false)
  check('no scheme', parse('just-a-record-id').ok === false)
  check('an unknown scheme', parse('ipfs/a/b/c').ok === false)
  check('and it names the three that exist', parse('ipfs/a/b/c').error.includes('git') && parse('ipfs/a/b/c').error.includes('pages'))
  check('javascript:', parse('url/javascript:alert(1)').ok === false)
  check('data:', parse('url/data:text/html,<b>x</b>').ok === false)
  check('file:', parse('url/file:///tmp/record.json').ok === false)
  check('plain http, which would be read over the wire', parse('url/http://example.com/r.json').ok === false)
  check('a credential written into the address', parse('url/https://user:pw@example.com/r.json').ok === false)
  check('a scheme with nothing after it', parse('url/https:').ok === false)
  check('a scheme and two slashes with no host', parse('url/https://').ok === false)
  // Not a refusal, and the reason is the repair above it: `https:/x` is
  // what a path router hands over when someone typed `https://x`, so it
  // resolves to that host rather than being rejected as hostless.
  check('a single slash after the scheme is a collapsed path, not a missing host', url('url/https:/x/r.json') === 'https://x/r.json')
  check('dot-dot, which could point outside the path it names', parse('git/a/b/main/../../etc/passwd').ok === false)
  check('an owner that is not a GitHub account name', parse('git/not_an_owner/b/main/r-2026-10-18-abc1234').ok === false)
  check('a record id with a slash in it is not a record id', parse('pages/a/b/dir/r-2026-10-18-abc1234').ok === false)
  check('a leading slash is tolerated, since this arrives from a path', parse('/pages/a/b/r-2026-10-18-abc1234').ok === true)
  check('and so is surrounding whitespace from a paste', parse('  pages/a/b/r-2026-10-18-abc1234  ').ok === true)
}

console.log('\nthe string survives a round trip, since it is shared as a string')
{
  for (const a of [
    'git/someone/their-repo/main/r-2026-10-18-abc1234',
    'git/someone/their-repo/ursa-frontend/2026-10-18-message/r-2026-10-18-abc1234',
    'pages/someone/their-repo/r-2026-10-18-abc1234',
  ]) {
    check(a, formatRecordAddress(parse(a).address) === a)
  }
  check('the shared link keeps the scheme readable', recordAddressHref('pages/a/b/r-2026-10-18-abc1234') === '/record/at/pages/a/b/r-2026-10-18-abc1234')
  // The url payload is encoded instead, because it carries its own
  // scheme and slashes. What comes back out of the route has to be the
  // same address, which is what this pair asserts.
  const live = 'https://example.com/a/b/r.json'
  const href = recordAddressHref(`url/${live}`)
  check('and encodes the url payload', href === `/record/at/url/${encodeURIComponent(live)}`)
  const roundTripped = decodeURIComponent(href.replace('/record/at/', ''))
  check('which parses back to the same address', url(roundTripped) === live)
}

console.log('\nwhy a fetch failed, in words a person can act on')
{
  const git = parse('git/someone/their-repo/main/r-2026-10-18-abc1234').address
  const pages = parse('pages/someone/their-repo/r-2026-10-18-abc1234').address
  const any = parse('url/https://example.com/r.json').address

  // The whole reason these can be different sentences is a measurement:
  // both GitHub hosts send a permissive cross-origin header on a 404 as
  // well as on a hit, so a missing record arrives as a status rather
  // than as the same opaque failure a blocked host produces.
  check('404 on a committed record talks about committing and pushing', fetchFailure(git, 404).includes('pushed'))
  check('404 on a published record talks about publishing', fetchFailure(pages, 404).includes('published'))
  check('and names taking one down, which is what that path buys', fetchFailure(pages, 404).includes('taken down'))
  check('a thrown fetch on a known host is not reported as a missing record', fetchFailure(git, 'threw').includes('not answering'))
  check('a thrown fetch on an unknown host explains the cross-origin refusal', fetchFailure(any, 'threw').includes('cross-origin'))
  check('and says nothing of ours will fetch it instead', fetchFailure(any, 'threw').includes('nothing on our side'))
  check('403 is the private-repository case, named', fetchFailure(git, 403).includes('private repository'))
  check('any other status still names the address and the status', fetchFailure(git, 500).includes('500') && fetchFailure(git, 500).includes('raw.githubusercontent.com'))
  check('every sentence carries the url it is about', [404, 403, 500].every((s) => fetchFailure(pages, s).includes('someone.github.io')))
}

console.log('\nthe integrity claim this surface may not make')
{
  const text = '{"task":{"id":"a"}}'
  const i = await unverifiableDigest(text)
  // An address carries no index, so there is no published digest to
  // compare against. "verified" would be a lie and "mismatch" would be
  // a different one.
  check('a record read at its address is never verified', i.state === 'unverifiable')
  check('and the reason is that there was no index in the path', i.reason === 'no-index-to-check-against')
  check('the digest of what arrived is still computed and shown', /^[0-9a-f]{64}$/.test(i.sha256 ?? ''))
  check('bytes are counted as bytes', (await unverifiableDigest('€')).bytes === 3)
  const copy = integrityCopy(i)
  check('the sentence claims no check', copy.tone === 'quiet' && !copy.line.includes('are the ones'))
  check('and says what the number is for', copy.line.includes('publisher'))
}

console.log('\nthe index that states these addresses')
{
  // Contract 0.2 is one additive field, which is the only reason this
  // viewer moved its pin: the set view reads `address` now.
  const idx = parsePublishedIndex({
    indexVersion: '0.2.0',
    records: [{ id: 'r-2026-10-18-abc1234', address: 'pages/someone/their-repo/r-2026-10-18-abc1234' }],
  })
  check('0.2 reads clean, with nothing withheld', idx.ok === true && idx.note === null)
  check('and the address comes through', idx.ok === true && idx.index.records[0].address === 'pages/someone/their-repo/r-2026-10-18-abc1234')
  check('which resolves', url(idx.index.records[0].address) === 'https://someone.github.io/their-repo/records/r-2026-10-18-abc1234.json')
  // A publisher whose store knew no repository has nothing to build an
  // address from, and the index says null rather than guessing.
  const none = parsePublishedIndex({ indexVersion: '0.2.0', records: [{ id: 'r', address: null }] })
  check('a null address is a legitimate index, not an error', none.ok === true && none.index.records[0].address === null)
  // A 0.1 site predates the field entirely, and still reads.
  const old = parsePublishedIndex({ indexVersion: '0.1.0', records: [{ id: 'r' }] })
  check('a 0.1 site still reads, with no address on its records', old.ok === true && old.index.records[0].address === undefined)
}

console.log('')
if (failures > 0) {
  console.error(`${failures} check${failures === 1 ? '' : 's'} failed: this viewer no longer resolves a record address the way the grammar says it does.`)
  process.exit(1)
}
console.log('the viewer resolves a record address as the grammar says it does.\n')
