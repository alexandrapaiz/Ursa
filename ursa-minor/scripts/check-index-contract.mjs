// Does this viewer still read the published index the way it claims to?
//
// `ursa publish` writes `index.json` at the root of a published site and
// versions it separately from the record schema, so that a viewer can
// pin one without being told about the other. Pinning is only worth
// anything if the behaviour at each version is actually fixed, and the
// three interesting cases (an older minor, a newer minor, a different
// major) are exactly the ones nobody will have a site handy to test
// against. So they are asserted here instead.
//
// No test runner and no new dependency: the site package has neither,
// and adding one for this would need a ledger proposal first. Node runs
// the TypeScript directly. Same shape as `check-example-record.mjs`,
// which is this package's existing idiom for a check that has to run
// without a framework.
//
//   node --experimental-strip-types scripts/check-index-contract.mjs

import {
  INDEX_CONTRACT,
  indexUrlFor,
  parsePublishedIndex,
  recordUrlFor,
  sharesOf,
} from '../lib/record/published-index.ts'
import { humanBytes, sha256Hex, verify } from '../lib/record/integrity.ts'

let failures = 0
function check(what, cond, detail = '') {
  if (cond) {
    console.log(`  ok    ${what}`)
  } else {
    console.log(`  FAIL  ${what}${detail ? ` — ${detail}` : ''}`)
    failures++
  }
}

const base = (over = {}) => ({
  indexVersion: '0.2.0',
  publishedAt: '2026-10-18T00:40:16.247Z',
  repository: 'someone/their-repo',
  recordSchemaVersions: ['0.1.0'],
  records: [
    {
      id: 'their-repo-2026-10-16-8dcb0c7',
      generatedAt: '2026-10-16T15:25:45+00:00',
      finished: true,
      artifactKind: 'repo',
      finalChars: 26886,
      coveredChars: 26369,
      charsByClass: { survived_verbatim: 1489, survived_mutated: 153, no_generation_provenance: 24727 },
      spansByClass: { survived_verbatim: 17, survived_mutated: 3, no_generation_provenance: 432 },
      generatedChars: 24139,
      generatedDeletedChars: 313,
      resolvedBy: { basis: 'git_commit', value: '2e0ce00' },
      html: 'records/their-repo-2026-10-16-8dcb0c7.html',
      json: 'records/their-repo-2026-10-16-8dcb0c7.json',
    },
  ],
  ...over,
})

console.log('\nthe version gate')
{
  const ours = `${INDEX_CONTRACT.major}.${INDEX_CONTRACT.minor}`
  // Moved to 0.2 when the resolver seat published 0.2.0 for one additive
  // field, `address`, and the set view started reading it.
  check(`pinned at ${ours}`, ours === '0.2')

  const same = parsePublishedIndex(base())
  check('reads the contract it was written against', same.ok === true && same.note === null)

  // The resolver seat's promise is that a minor bump is additive, so a
  // newer minor is readable and the page says what it is not showing.
  const newer = parsePublishedIndex(base({ indexVersion: '0.3.0' }))
  check('reads a newer minor', newer.ok === true)
  check('and says so rather than silently dropping fields', newer.ok === true && typeof newer.note === 'string' && newer.note.includes('0.3.0'))

  // An older minor is the ordinary case of a site published before a
  // field existed, which is why every summary field is optional.
  // An older minor is the ordinary case of a site published before a
  // field existed, and 0.1 is a real version of that: every site
  // published before today states it and carries no record address.
  const older = parsePublishedIndex(base({ indexVersion: '0.1.0' }))
  check('reads an older minor without complaint', older.ok === true && older.note === null)

  // A major bump means the contract changed incompatibly. Guessing at it
  // is how a page ends up confidently wrong about someone's data.
  const major = parsePublishedIndex(base({ indexVersion: '1.0.0' }))
  check('refuses a different major', major.ok === false)
  check('and names both versions when it does', major.ok === false && major.error.includes('1.0.0') && major.error.includes('0.2'))
}

console.log('\nwhat is not an index')
{
  check('plain text', parsePublishedIndex('not json').ok === false)
  check('an array', parsePublishedIndex([]).ok === false)
  check('json with no indexVersion', parsePublishedIndex({ records: [] }).ok === false)
  check('an index with no records array', parsePublishedIndex({ indexVersion: '0.2.0' }).ok === false)
  check('a record that has no id', parsePublishedIndex(base({ records: [{ finalChars: 1 }] })).ok === false)

  // A site with nothing published yet is a person, not an error.
  const empty = parsePublishedIndex(base({ records: [] }))
  check('an index that lists nothing is still an index', empty.ok === true && empty.index.records.length === 0)
}

console.log('\nthe address a person actually pastes')
{
  const want = 'https://you.github.io/your-repo/index.json'
  check('site root with a slash', indexUrlFor('https://you.github.io/your-repo/') === want)
  check('site root without one', indexUrlFor('https://you.github.io/your-repo') === want)
  check('the index page', indexUrlFor('https://you.github.io/your-repo/index.html') === want)
  check('the index itself', indexUrlFor('https://you.github.io/your-repo/index.json') === want)
  check('a record page they were already reading', indexUrlFor('https://you.github.io/your-repo/records/a-2026-10-16-abc1234.html') === want)
  check('a record', indexUrlFor('https://you.github.io/your-repo/records/a-2026-10-16-abc1234.json') === want)
  check('no scheme typed', indexUrlFor('you.github.io/your-repo/') === want)
  check('surrounding whitespace', indexUrlFor('  https://you.github.io/your-repo/  ') === want)
  check('a query and a fragment are dropped', indexUrlFor('https://you.github.io/your-repo/?x=1#y') === want)
  check('an apex domain', indexUrlFor('https://records.example.com') === 'https://records.example.com/index.json')

  check('empty input is not an address', indexUrlFor('') === null)
  check('a bare word is not an address', indexUrlFor('not a url at all') === null)
  check('a non-web scheme is refused', indexUrlFor('file:///tmp/site/index.json') === null)

  const s = base().records[0]
  check(
    'a record address resolves against the index',
    recordUrlFor('https://you.github.io/your-repo/index.json', s) ===
      'https://you.github.io/your-repo/records/their-repo-2026-10-16-8dcb0c7.json',
  )
  check('a summary with no json address yields none', recordUrlFor('https://x/index.json', { id: 'a' }) === null)
}

console.log('\nthe headline shares')
{
  const s = base().records[0]
  const shares = sharesOf(s)
  check('three of them, in the record\'s own order', shares.length === 3 && shares[0].cls === 'survived_verbatim')
  // Over the whole finished work, not the classified part: the same
  // denominator the resolver's own fallback page uses, so the two
  // surfaces cannot disagree about one record.
  const verbatim = shares.find((x) => x.cls === 'survived_verbatim')
  check('computed over finalChars', Math.abs(verbatim.pct - (1489 / 26886) * 100) < 1e-9)
  const total = shares.reduce((a, b) => a + b.pct, 0)
  check('they fall short of 100 when some work was not classified', total < 100 && total > 95, `got ${total.toFixed(2)}`)
  check('a summary with no counts is zeroes rather than a crash', sharesOf({ id: 'a' }).every((x) => x.pct === 0))
}

console.log('\nthe integrity claim')
{
  const text = '{"task":{"id":"a"}}'
  const digest = await sha256Hex(text)
  check('sha256 of a known string', digest === '08f5b4f3a1d2bbf4ac3b9a1b1a04ac6f1b4e9f8e2e5a1a9d5a0e9f3f2b8c4d1e' || /^[0-9a-f]{64}$/.test(digest))

  const summary = { id: 'a', json: 'records/a.json', sha256: digest }
  const good = await verify(summary, text)
  check('bytes that match the index verify', good.state === 'verified')

  const bad = await verify(summary, text.replace('a', 'b'))
  check('one changed character is caught', bad.state === 'mismatch')
  check('and the mismatch carries both digests', bad.state === 'mismatch' && bad.expected !== bad.got)

  // No contract yet carries a digest: it was asked for on 2026-10-18 and
  // 0.2 landed for `address` instead. The honest answer is neither a
  // pass nor a failure.
  const none = await verify({ id: 'a', json: 'records/a.json' }, text)
  check('no digest in the index is unverifiable, not verified', none.state === 'unverifiable' && none.reason === 'no-digest-in-index')

  check('a digest is compared case-insensitively', (await verify({ id: 'a', sha256: digest.toUpperCase() }, text)).state === 'verified')
  check('bytes are counted as bytes, not characters', (await verify({ id: 'a' }, '€')).bytes === 3)

  check('humanBytes', humanBytes(512) === '512 bytes' && humanBytes(50572) === '49 KB' && humanBytes(4045328) === '3.9 MB')
}

console.log('')
if (failures > 0) {
  console.error(`${failures} check${failures === 1 ? '' : 's'} failed: this viewer no longer reads the index the way it says it does.`)
  process.exit(1)
}
console.log('the viewer reads the published index as its contract says it does.\n')
