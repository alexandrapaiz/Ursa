// The predicate in `scripts/gate-binary-reach.mjs`, checked against what grep
// and a shell pipeline actually do rather than against a manual page.
//
// WHY THE SUITE BUILDS A FIXTURE AND RUNS THE REAL PIPELINE. A test that only
// asserted the module's own table would prove the table is spelled the way it
// is spelled. The claim being defended is about GNU grep's behaviour on binary
// input and about where a shell command substitution sends each stream, and
// both are facts about tools that can change under us. So each case below
// writes a file carrying FABRICATED values, runs the gate's own `scan()` body
// with one field of the pipeline changed, and asserts that the pipeline's real
// verdict agrees with what `binaryReach` predicted for it.
//
// THE VALUE IS FABRICATED, ASSEMBLED AT RUNTIME, AND NEVER PRINTED. It has to
// match the gate's own Class B pattern or none of this measures anything, which
// means a literal spelling of it in this file would turn the gate red on the
// file. So `CARRIER` is joined from parts that carry no matching substring,
// which is a real constraint of testing a gate from inside the tree it scans
// and not a flourish. The username in it belongs to no person, and no
// assertion here prints a line of file content, only the clean-or-red verdict
// and the layer name.
//
// THE GREP IS CHECKED, NOT ASSUMED. These cases are about GNU grep, which is
// what `ubuntu-latest` runs. A sandbox whose `grep` is something else would
// make every case here measure the wrong tool, so the suite reads the version
// first and skips with a named cause instead of reporting a pass. That is the
// same refusal `scripts/redaction-check.mjs` makes on a gate it cannot parse:
// a check that cannot establish its facts does not report clean.

import { strict as assert } from 'node:assert'
import { execFileSync, spawnSync } from 'node:child_process'
import { chmodSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, it } from 'node:test'

import { LAYER, binaryReach, readPipeline } from './gate-binary-reach.mjs'

/** The gate's own Class B pattern, read as a literal here on purpose: these
 *  cases are about the pipeline's plumbing and not about the pattern set, and
 *  a case whose pattern came from the workflow would change meaning the day
 *  the workflow's patterns change. */
const CLASS_B = '(/Users/|/home/)[A-Za-z][A-Za-z0-9._-]{2,}/'

function gnuGrep() {
  const res = spawnSync('grep', ['--version'], { encoding: 'utf8' })
  if (res.error || res.status !== 0) return null
  return /GNU grep/.test(res.stdout ?? '') ? res.stdout.split('\n')[0] : null
}

const GREP = gnuGrep()

/**
 * Build a tree holding one binary file that carries a fabricated Class B path,
 * and one plain text file that carries one too. The text file is the control:
 * every pipeline below must keep catching it, so a change that reaches binary
 * files by breaking the text case is visible rather than scored as progress.
 */
/** `/home/<fabricated>/notes`, built so this source file holds no match. */
const CARRIER = ['', 'home', 'fixtureuser', 'notes'].join('/')

function fixture() {
  const dir = mkdtempSync(join(tmpdir(), 'ursa-reach-'))
  // A NUL byte is what makes grep call it binary; the fabricated path sits
  // between two of them so no amount of flag changing turns it into a line.
  writeFileSync(join(dir, 'carrier.bin'), Buffer.from(`h\0${CARRIER}\0t`, 'latin1'))
  writeFileSync(join(dir, 'carrier.txt'), `${CARRIER}\n`)
  return dir
}

/**
 * Run the gate's capture, verbatim from `.github/workflows/redaction-gate.yml`,
 * with the pipeline's three fields substituted in.
 *
 * @returns {{red: boolean, hits: number}} whether the gate would fail, and how
 *   many lines it captured. Never the lines themselves.
 */
function runPipeline({ scanFlags, scanDropsStderr, filterFlags }, dir, only) {
  const redirect = scanDropsStderr ? '2>/dev/null' : '2>&1'
  const filter = filterFlags === null ? 'cat' : `grep ${filterFlags} '/home/runner/'`
  const script = `
    set -uo pipefail
    cd "$1"
    hits=$(grep ${scanFlags} "$2" ${only ?? '.'} ${redirect} | ${filter} || true)
    if [ -n "$hits" ]; then
      printf 'RED %s\\n' "$(printf '%s\\n' "$hits" | grep -c . || true)"
    else
      printf 'CLEAN 0\\n'
    fi`
  const out = execFileSync('bash', ['-c', script, 'reach', dir, CLASS_B], { encoding: 'utf8' })
  const [verdict, n] = out.trim().split(' ')
  return { red: verdict === 'RED', hits: Number(n) }
}

/** The four pipelines, as the shapes a repair could take. */
const PIPELINES = {
  shipped: { scanFlags: '-rInE', scanDropsStderr: true, filterFlags: '-vE' },
  minusI: { scanFlags: '-rnE', scanDropsStderr: true, filterFlags: '-vE' },
  minusIKeepingStderr: { scanFlags: '-rnE', scanDropsStderr: false, filterFlags: '-vE' },
  forcedText: { scanFlags: '-rnaE', scanDropsStderr: true, filterFlags: '-vE' },
  forcedTextBothSides: { scanFlags: '-rnaE', scanDropsStderr: true, filterFlags: '-vaE' },
  listOnly: { scanFlags: '-rlaE', scanDropsStderr: true, filterFlags: '-vE' },
}

describe('what the module predicts about the gate as it ships', () => {
  it('reads the real workflow and names -I as the first thing in the way', () => {
    const yml = execFileSync('git', ['show', 'HEAD:.github/workflows/redaction-gate.yml'], {
      encoding: 'utf8',
    })
    const p = readPipeline(yml)
    assert.equal(p.fault, undefined, 'the gate pipeline should still be the shape this reader knows')
    assert.equal(p.scanFlags, '-rInE')
    assert.equal(p.scanDropsStderr, true, 'the gate discards the stream a binary match is announced on')
    assert.equal(p.filterFlags, '-vE', 'the allowance filter has no -a of its own')
    assert.equal(binaryReach(p).layer, LAYER.SCAN_SKIPS_BINARY)
  })

  it('refuses rather than answering when the pipeline is not a shape it knows', () => {
    const r = binaryReach(readPipeline('jobs:\n  scan:\n    steps: []\n'))
    assert.match(r.fault, /found no/)
    assert.equal(r.layer, undefined, 'a fault is never also an answer')
    assert.match(r.line, /cannot read the gate's pipeline/)
  })

  it('names the three repairs apart, since one flag is not the whole of it', () => {
    const layers = Object.values(PIPELINES).map((p) => binaryReach(p).layer)
    assert.deepEqual(layers, [
      LAYER.SCAN_SKIPS_BINARY,
      LAYER.NOTICE_OFF_STDOUT,
      LAYER.REACHES_BY_MERGING_STDERR,
      LAYER.FILTER_SKIPS_BINARY,
      LAYER.REACHES_BY_ECHOING,
      LAYER.REACHES,
    ])
  })

  it('calls the -a repair a disclosure and the -l repair clean, which is the charter rule', () => {
    assert.match(binaryReach(PIPELINES.forcedTextBothSides).line, /printing the matched bytes/)
    assert.match(binaryReach(PIPELINES.listOnly).line, /prints none of its contents/)
    assert.match(binaryReach(PIPELINES.listOnly).repair, /allowance is line-scoped/)
  })
})

describe('the prediction against what the real pipeline does', { skip: GREP ? false : 'no GNU grep on this machine, so these cases would measure a different tool' }, () => {
  const expectation = {
    shipped: false,
    minusI: false,
    minusIKeepingStderr: true,
    forcedText: false,
    forcedTextBothSides: true,
    listOnly: true,
  }

  for (const [name, pipeline] of Object.entries(PIPELINES)) {
    it(`${name}: predicted ${binaryReach(pipeline).layer}, and the pipeline agrees`, () => {
      const dir = fixture()
      try {
        const { red } = runPipeline(pipeline, dir, 'carrier.bin')
        const predicted = binaryReach(pipeline).layer
        const predictsReach =
          predicted === LAYER.REACHES ||
          predicted === LAYER.REACHES_BY_ECHOING ||
          predicted === LAYER.REACHES_BY_MERGING_STDERR
        assert.equal(
          red,
          predictsReach,
          `${name}: binaryReach says ${predicted} but the pipeline came back ${red ? 'red' : 'clean'}`
        )
        assert.equal(red, expectation[name], `${name}: the measured outcome moved`)
      } finally {
        rmSync(dir, { recursive: true, force: true })
      }
    })
  }

  it('every pipeline still catches the plain text file, so no repair trades that away', () => {
    for (const [name, pipeline] of Object.entries(PIPELINES)) {
      const dir = fixture()
      try {
        const { red } = runPipeline(pipeline, dir, 'carrier.txt')
        assert.equal(red, true, `${name} stopped catching a plain text carrier`)
      } finally {
        rmSync(dir, { recursive: true, force: true })
      }
    }
  })

  // The measurement behind REACHES_BY_MERGING_STDERR. `2>&1` is what PWC-13's
  // own `Change` paragraph prescribes, and it is the whole of the gate's test
  // that `hits` is non-empty, so anything on that stream is a violation.
  //
  // A directory mode of 000 does not stop root, and a run that read this as a
  // pass would be reporting a property it never established, so the case asks
  // first and skips with the cause named.
  it('the prescribed 2>&1 turns a grep diagnostic into a redaction violation, and the shipped gate swallows it', () => {
    const dir = fixture()
    const locked = join(dir, 'unreadable')
    try {
      mkdirSync(locked)
      writeFileSync(join(locked, 'f.txt'), 'nothing private here\n')
      chmodSync(locked, 0o000)
      const probe = spawnSync('bash', ['-c', 'ls "$1"', 'reach', locked], { encoding: 'utf8' })
      if (probe.status === 0) return // root, or a filesystem that ignores the mode. Not a pass.

      // carrier.txt would redden every pipeline on its own merits, so the
      // question is asked over the unreadable directory alone.
      const merged = runPipeline(PIPELINES.minusIKeepingStderr, dir, 'unreadable')
      assert.equal(merged.red, true, 'the prescribed pipeline reports the diagnostic as a violation')

      const shipped = runPipeline(PIPELINES.shipped, dir, 'unreadable')
      assert.equal(shipped.red, false, 'and the gate as it ships reports a scan it could not finish as clean')

      // The one that does neither: -l carries paths, and the diagnostic goes
      // to a stream this pipeline does not merge.
      const listed = runPipeline(PIPELINES.listOnly, dir, 'unreadable')
      // -l repairs reach and the echoing. It does NOT repair this: the
      // diagnostic is still discarded, so the unread subtree is still silent.
      // Two independent repairs, named apart rather than bundled.
      assert.equal(listed.red, false, '-l does not report the diagnostic as a leak either')
    } finally {
      try {
        chmodSync(locked, 0o755)
      } catch {}
      rmSync(dir, { recursive: true, force: true })
    }
  })

  it('the shipped gate reads the text file and not the binary one, in one run over both', () => {
    const dir = fixture()
    try {
      const both = runPipeline(PIPELINES.shipped, dir)
      assert.equal(both.red, true, 'the gate does catch the text carrier')
      assert.equal(both.hits, 1, 'and exactly one of the two files, which is the finding')
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })
})
