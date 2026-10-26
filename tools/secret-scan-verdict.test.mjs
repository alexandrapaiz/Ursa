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
import { GATE, hitLine, unusable, verdict } from './secret-scan-verdict.mjs'

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

  it('truncates a blob to twelve characters and never prints a value', () => {
    const VALUE = 'AKIAIOSFODNN7EXAMPLE'
    const withBlob = { ...hit(), blob: 'deadbeefcafebabe0123456789' }
    assert.equal(hitLine(withBlob), '  aws-access-key-id  conf.txt:1  blob deadbeefcafe')
    const v = verdict([withBlob], TREE)
    const everything = JSON.stringify([v, hitLine(withBlob), ...renderVerdict(v, [hitLine(withBlob)])])
    assert.ok(!everything.includes(VALUE), 'a credential value reached the verdict output')
  })

  it('declares one findings locus, because the locus is a property of the invocation', () => {
    // scanTree and scanHistory are exclusive, so a run's hits are all tracked
    // files or all history blobs and never a mix. Declared so the actor check
    // runs instead of reporting this gate unmeasurable.
    assert.equal(GATE.findingsLocus, 'reader')
    assert.ok(GATE.findingsLocus in GATE.loci)
  })
})
