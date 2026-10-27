// Every line `tools/secret-scan.mjs` prints, pinned against a literal, and the
// five-line rendering that `{exitCode, line, stream}` alone cannot round-trip.
//
// THE REDACTION RULE IS PART OF THE CONTRACT. The gate never prints a
// credential value, not even truncated, not even in --json. A verdict module is
// a formatting surface and therefore exactly where a value creeps back in, so
// the last test here plants a value and asserts it is absent from everything
// the module returns.

import { strict as assert } from 'node:assert'
import { describe, it } from 'node:test'
import { renderVerdict } from './gates/verdict-shape.mjs'
import { GATE, acceptedLine, baselineUnusable, hitLine, unusable, verdict } from './secret-scan-verdict.mjs'

const TREE = { mode: 'tree', scanned: 2226, unit: 'tracked files', classes: 16 }
const hit = () => ({ class: 'aws-access-key-id', where: 'conf.txt', line: 1 })

describe('secret-scan verdict', () => {
  it('exit 0, nothing found, and the summary comes before the findings', () => {
    const v = verdict([], TREE)
    assert.equal(v.exitCode, 0)
    assert.equal(v.line, 'secret-scan tree: 2226 tracked files, 16 classes, 0 hit(s).')
    assert.equal(v.position, 'before')
    assert.deepEqual(v.trailer, [])
  })

  it('exit 1 and the whole five-line rendering, trailer included', () => {
    const v = verdict([hit()], { ...TREE, scanned: 1 })
    assert.equal(v.exitCode, 1)
    assert.deepEqual(renderVerdict(v, [hit()].map(hitLine)), [
      'secret-scan tree: 1 tracked files, 16 classes, 1 hit(s).',
      '  aws-access-key-id  conf.txt:1',
      '',
      'Do not print, quote or copy the value. Record file, commit and kind,',
      "mark it urgent in the ledger, and say rotation is the owner's action.",
    ])
  })

  it('counts the skipped-and-unscanned clause only when something was skipped', () => {
    assert.match(
      verdict([], { ...TREE, skipped_oversize: 3 }).line,
      /16 classes, 0 hit\(s\), 3 skipped and unscanned\.$/,
    )
    assert.match(verdict([], { ...TREE, skipped_oversize: 0 }).line, /0 hit\(s\)\.$/)
  })

  it('names the scope of a history scan, which is what says which locus the hits are in', () => {
    const v = verdict([], {
      mode: 'history-since',
      since: 'origin/main',
      scanned: 9001,
      unit: 'blobs',
      classes: 16,
    })
    assert.equal(v.line, 'secret-scan history-since origin/main..: 9001 blobs, 16 classes, 0 hit(s).')
  })

  it('a run that is clean only because of the baseline says a different sentence', () => {
    // The point of the baseline was that a permanent known hit makes the next
    // real hit a second line in a report that already says one. A suppression
    // that printed `0 hit(s).` would fix that by making the known object
    // invisible instead, so this branch has its own cause and its own line.
    const v = verdict([], { mode: 'history', scanned: 6455, unit: 'blobs', classes: 16, baselined: 1 })
    assert.equal(v.exitCode, 0)
    assert.equal(v.cause, 'ALL_HITS_BASELINED')
    assert.equal(v.line, 'secret-scan history: 6455 blobs, 16 classes, 0 hit(s), 1 accepted by baseline.')
    assert.deepEqual(v.trailer, [
      '',
      'Every hit is accounted for by a cited entry in tools/secret-scan.baseline.json,',
      'each pinned to one blob id, so any other byte sequence in the same file is a',
      'new hit and not an accepted one. Re-run with --no-baseline to see the raw set.',
    ])
  })

  it('still exits 1 when one hit is accepted and one is not', () => {
    // An accepted hit must never hide an unaccepted one. The count in the
    // sentence is the unaccounted set, which is what a reader acts on.
    const v = verdict([hit()], { mode: 'history', scanned: 6455, unit: 'blobs', classes: 16, baselined: 1 })
    assert.equal(v.exitCode, 1)
    assert.equal(v.cause, 'CREDENTIAL_SHAPED_HIT')
    assert.equal(v.line, 'secret-scan history: 6455 blobs, 16 classes, 1 hit(s), 1 accepted by baseline.')
  })

  it('is byte-identical to the old line when nothing is accepted', () => {
    // The clause appears only when it has something to report, so every
    // existing run and every log a reader has seen before is unchanged.
    assert.equal(verdict([], { ...TREE, baselined: 0 }).line, verdict([], TREE).line)
    assert.equal(verdict([], TREE).cause, 'NOTHING_FOUND')
  })

  it('names the accepted hit with its reason, and still never a value', () => {
    const pair = {
      entry: { why_not_a_credential: "the vendor's published documentation example" },
      hit: { class: 'aws-access-key-id', where: 'tools/x.test.mjs', line: 72, blob: 'ef90504da7db771e9ca7' },
    }
    assert.equal(
      acceptedLine(pair),
      "  accepted: aws-access-key-id  tools/x.test.mjs:72  blob ef90504da7db  the vendor's published documentation example",
    )
  })

  it('a baseline it cannot trust is ground, and the cause is the fault', () => {
    // One cause name over nine distinct repairs would tell a reader only the
    // exit code they already have, so the fault's own code is the cause.
    const v = baselineUnusable({
      code: 'BASELINE_ENTRY_STALE',
      message: 'a baseline entry accepts aws-access-key-id in tools/x.test.mjs, and a full history scan found nothing for it to account for',
      detail: 'both want the entry deleted rather than kept',
    })
    assert.equal(v.exitCode, 2)
    assert.equal(v.stream, 'err')
    assert.equal(v.derivedFrom, 'ground')
    assert.equal(v.cause, 'BASELINE_ENTRY_STALE')
    assert.match(v.line, /^secret-scan: cannot do its job: a baseline entry accepts/)
    assert.deepEqual(v.trailer, ['  both want the entry deleted rather than kept'])
  })

  it('exit 2 is a ground verdict with no findings behind it', () => {
    const v = unusable('this clone is shallow', 'run bash tools/ensure-full-clone.sh first')
    assert.equal(v.exitCode, 2)
    assert.equal(v.stream, 'err')
    assert.equal(v.derivedFrom, 'ground')
    assert.equal(v.line, 'secret-scan: cannot do its job: this clone is shallow')
    assert.deepEqual(v.trailer, ['  run bash tools/ensure-full-clone.sh first'])
  })

  it('omits the detail line when there is no detail', () => {
    assert.deepEqual(unusable('why only').trailer, [])
  })

  it('truncates a blob to twelve characters', () => {
    const withBlob = { ...hit(), blob: 'deadbeefcafebabe0123456789' }
    assert.equal(hitLine(withBlob), '  aws-access-key-id  conf.txt:1  blob deadbeefcafe')
  })

  it('prints only the four fields it is allowed to, so a value on the hit cannot leak', () => {
    // The real risk, which the first draft of this test missed. That draft
    // asserted a credential string was absent from the output after never
    // passing it in, which is an assertion about nothing -- and the literal it
    // used turned this repository's own `node tools/secret-scan.mjs` red,
    // 16 classes against a tracked file. The sentinel below is deliberately
    // not credential-shaped for that reason.
    //
    // What can actually go wrong: a caller builds a hit from a match and leaves
    // the matched text on the object. `classify()` returns no such field today,
    // so this is the formatting surface being pinned shut rather than a live
    // leak. A spread anywhere in this module would print it.
    const SENTINEL = 'SENTINEL-IF-THIS-APPEARS-A-VALUE-LEAKED'
    const careless = { ...hit(), blob: 'deadbeefcafebabe', value: SENTINEL, match: SENTINEL }
    const v = verdict([careless], TREE)
    const everything = JSON.stringify([
      v,
      hitLine(careless),
      ...renderVerdict(v, [hitLine(careless)]),
    ])
    assert.ok(!everything.includes(SENTINEL), 'a value on the hit object reached the output')
    assert.equal(hitLine(careless), '  aws-access-key-id  conf.txt:1  blob deadbeefcafe')
  })

  it('declares one findings locus, because the locus is a property of the invocation', () => {
    // scanTree and scanHistory are exclusive, so a run's hits are all tracked
    // files or all history blobs and never a mix. Declared so the actor check
    // runs instead of reporting this gate unmeasurable.
    assert.equal(GATE.findingsLocus, 'reader')
    assert.ok(GATE.findingsLocus in GATE.loci)
  })
})
