#!/usr/bin/env node
// node --test tools/stack/driver-report.test.mjs
//
// WHAT THIS SUITE IS FOR. `tools/stack/driver-report.mjs` exists because of
// one message: on 2026-11-02 `Ursa/exo` reported that a merge gate with both
// of this repository's drivers installed reviewed its held branch and reported
// ONE remaining conflict where there were two, and the one it dropped was the
// `improvements` register, which the `register` driver had refused with a
// reason naming a single heading both sides had edited. The path was on
// stdout. The reason was on stderr. A reader with the complete path list still
// could not tell which of its paths a driver had refused.
//
// So the cases that matter here are the ones where the two handles disagree,
// and they are at the bottom under `reconcile`. Everything above them is the
// grammar holding against bytes a real driver wrote, which is the only kind of
// input this module ever sees.
//
// EVERY FIXTURE STRING IS A TRANSCRIPT. Each one below was copied from the
// stderr of `git merge-tree --write-tree --name-only origin/main refs/prs/668`
// run in this repository on 2026-11-02 against `origin/main` at `9c3c52dc`,
// with the two drivers registered by `tools/registers/install-drivers.sh`.
// Nothing here is a string chosen to be easy to parse.

import { strict as assert } from 'node:assert'
import { describe, it } from 'node:test'

import {
  DISPOSITION,
  RESULT_PREFIX,
  classify,
  collapseCost,
  formatResultLine,
  parseResultLine,
  reconcile,
} from './driver-report.mjs'

/** The nine lines `refs/prs/668` really produced on stderr, in order. */
const REAL_STDERR = [
  'register driver: docs/agents/runner-facts.md merged by entry identity (heading ^## , identifier ^## ([0-9]+[a-z]?)\\.).',
  'merge-driver-result: driver=register disposition=merged path="docs/agents/runner-facts.md"',
  'register driver: docs/agents/learning-log.md merged by entry identity (heading ^## ).',
  'merge-driver-result: driver=register disposition=merged path="docs/agents/learning-log.md"',
  'register driver: docs/agents/incidents.md merged by entry identity (heading ^## , identifier ^## (Incident [0-9]+[a-z]?|INC-[0-9]{4}-[0-9]{2}-[0-9]{2}-[a-z0-9-]+)).',
  'merge-driver-result: driver=register disposition=merged path="docs/agents/incidents.md"',
  "register driver: the merger refused docs/agents/improvements.md. Its reason: merge-register: both sides edited '## Week of 2026-11-02' differently",
  'merge-driver-result: driver=register disposition=refused path="docs/agents/improvements.md" reason=merge-register: both sides edited \'## Week of 2026-11-02\' differently',
  "register driver: wrote git's own line-based merge into the working tree instead, conflict markers included, so the file shows that it needs a human.",
]

/** The two paths git listed on STDOUT for that same merge. */
const REAL_PATHS = ['docs/agents/improvements.md', 'docs/agents/merge-order.md']

describe('the grammar, read off bytes a real driver wrote', () => {
  it('round-trips a refusal whose reason contains quotes, hashes and a colon', () => {
    const r = {
      driver: 'register',
      disposition: DISPOSITION.REFUSED,
      path: 'docs/agents/improvements.md',
      reason: "merge-register: both sides edited '## Week of 2026-11-02' differently",
    }
    assert.deepEqual(parseResultLine(formatResultLine(r)), r)
  })

  it('round-trips a pathname containing a space, which is why the path is quoted and the reason is last', () => {
    // No register in this repository has a space in its name today. The
    // quoting is here so that the day one does, the free-text reason after it
    // cannot be mistaken for more of the path.
    const r = {
      driver: 'ledger',
      disposition: DISPOSITION.REFUSED,
      path: 'docs/a file with spaces.md',
      reason: 'two blocks edited on both sides',
    }
    assert.deepEqual(parseResultLine(formatResultLine(r)), r)
  })

  it('flattens a multi-line reason instead of emitting a record that reads as two', () => {
    const line = formatResultLine({
      driver: 'ledger',
      disposition: DISPOSITION.REFUSED,
      path: 'docs/ideas.md',
      reason: 'first line\n  second line',
    })
    assert.equal(line.split('\n').length, 1)
    assert.equal(parseResultLine(line).reason, 'first line second line')
  })

  it('returns null for ordinary driver prose, which is most of stderr and is not an error', () => {
    for (const line of REAL_STDERR.filter((l) => !l.startsWith(RESULT_PREFIX))) {
      assert.equal(parseResultLine(line), null, line)
    }
  })

  it('returns null rather than a half-record when the path is not valid JSON', () => {
    assert.equal(
      parseResultLine(`${RESULT_PREFIX} driver=register disposition=refused path=docs/x.md`),
      null,
    )
    assert.equal(
      parseResultLine(`${RESULT_PREFIX} driver=register disposition=refused path=""`),
      null,
    )
  })
})

describe('classify, over the real nine lines', () => {
  it('reads four attributions out of nine lines and leaves the other five as prose', () => {
    const { results, unattributed, malformed } = classify(REAL_STDERR)
    assert.equal(results.length, 4)
    assert.equal(unattributed.length, 5)
    assert.equal(malformed.length, 0)
    assert.equal(results.filter((r) => r.disposition === DISPOSITION.REFUSED).length, 1)
    assert.equal(results.filter((r) => r.disposition === DISPOSITION.MERGED).length, 3)
  })

  it('separates a broken record from prose, because a broken record is one of OUR drivers failing', () => {
    // An unattributed line is expected: a third-party driver writes English
    // and nothing else, and the gate reports `0 of N attributed`. A line that
    // starts with the prefix and does not parse is a driver in this repository
    // writing the grammar wrongly, which has to be visible rather than
    // silently counted as prose.
    const { results, unattributed, malformed } = classify([
      'register driver: some ordinary sentence.',
      `${RESULT_PREFIX} driver=register disposition=refused path=unquoted.md`,
    ])
    assert.equal(results.length, 0)
    assert.deepEqual(unattributed, ['register driver: some ordinary sentence.'])
    assert.equal(malformed.length, 1)
  })

  it('attributes nothing for a driver that emits only prose, which is the honest empty', () => {
    const { results, unattributed, malformed } = classify([
      'some-third-party driver: merged thing.md the way it likes to.',
    ])
    assert.deepEqual(results, [])
    assert.equal(unattributed.length, 1)
    assert.equal(malformed.length, 0)
  })
})

describe('reconcile, which is the 2026-11-02 case itself', () => {
  it('attaches the refusal reason to the one path of two that a driver refused', () => {
    const { results } = classify(REAL_STDERR)
    const { reasonByPath, refusalsUnlisted, mergedButConflicted } = reconcile(results, REAL_PATHS)

    assert.deepEqual(Object.keys(reasonByPath), ['docs/agents/improvements.md'])
    assert.equal(reasonByPath['docs/agents/improvements.md'].driver, 'register')
    assert.match(
      reasonByPath['docs/agents/improvements.md'].reason,
      /both sides edited '## Week of 2026-11-02' differently/,
    )
    // The other conflicted path is an ordinary line conflict and gets no
    // reason, which is the distinction the whole module exists to draw.
    assert.equal(reasonByPath['docs/agents/merge-order.md'], undefined)
    assert.deepEqual(refusalsUnlisted, [])
    assert.deepEqual(mergedButConflicted, [])
  })

  it('does not attach a reason to a path the driver merged, even though both are on the same stream', () => {
    const { results } = classify(REAL_STDERR)
    const { reasonByPath } = reconcile(results, [
      ...REAL_PATHS,
      'docs/agents/incidents.md', // which the driver reported MERGED
    ])
    assert.equal(reasonByPath['docs/agents/incidents.md'], undefined)
  })

  it('reports a refusal git did not list as unlisted, which is the under-report that looks complete', () => {
    // Not reachable from either driver here today: both exit 1 on every
    // refusal and git records a conflict for a non-zero driver. It is
    // reachable from a driver that exits 0 after writing a degraded result,
    // which is exactly the silent corruption both drivers' headers say they
    // exist to remove. `reconcile` is pure so that claim is executable without
    // anybody writing such a driver.
    const { results } = classify(REAL_STDERR)
    const { refusalsUnlisted, reasonByPath } = reconcile(results, ['docs/agents/merge-order.md'])
    assert.equal(refusalsUnlisted.length, 1)
    assert.equal(refusalsUnlisted[0].path, 'docs/agents/improvements.md')
    // And no reason is published for it, because there is no verdict to
    // publish: an under-reported surface is ground, not a finding.
    assert.deepEqual(Object.keys(reasonByPath), [])
  })

  it('reports a merged-but-conflicted path as a notice and never as ground', () => {
    // Legitimately reachable: a driver settles CONTENT, and git can still
    // conflict the same path on mode, rename or add/add, which the driver is
    // never consulted about. Refusing here would refuse a correct measurement.
    const { results } = classify(REAL_STDERR)
    // The real two paths plus `incidents.md`, which the driver reported
    // MERGED. Keeping the real two in the list matters: drop them and the
    // refusal becomes unlisted as well, and the test would then be driving
    // two faults at once and proving neither.
    const { mergedButConflicted, refusalsUnlisted } = reconcile(results, [
      ...REAL_PATHS,
      'docs/agents/incidents.md',
    ])
    assert.equal(mergedButConflicted.length, 1)
    assert.equal(mergedButConflicted[0].path, 'docs/agents/incidents.md')
    assert.deepEqual(refusalsUnlisted, [])
  })
})

describe('collapseCost, which is why the cost is printed and not documented', () => {
  it('is nine for the real pair, not the one the triggering note estimated', () => {
    // The note said a fixed-width read is "off by one and the path that falls
    // out is the last one". True of the pair it was found on, where a single
    // `ledger` diagnostic preceded the tree id. On `refs/prs/668` it was five
    // before this module existed, and nine after, because the attribution line
    // is one more line of stderr per driver invocation. A sweep repaired by
    // skipping one line is still wrong by eight.
    assert.equal(collapseCost(REAL_STDERR), 9)
    assert.equal(collapseCost(REAL_STDERR.filter((l) => !l.startsWith(RESULT_PREFIX))), 5)
    assert.equal(
      collapseCost([
        'ledger driver: docs/ideas.md merged by block identity. 13 block(s) taken from the other branch, 0 removed.',
      ]),
      1,
    )
  })

  it('is zero for a merge no driver spoke during, so the clause disappears rather than printing a nought', () => {
    assert.equal(collapseCost([]), 0)
    assert.equal(collapseCost(['', '   ']), 0)
  })
})
