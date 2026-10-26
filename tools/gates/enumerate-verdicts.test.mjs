// Does the enumerator detect the defect it was built for, and does it stay
// quiet on the four gates that are already right?
//
// THE ONE TEST THAT MATTERS IS `the historical defect`. Four gates passing
// proves nothing on its own: a check that always returns "clean" passes four
// gates too, and this repository has already shipped one of those (the sweep
// in docs/design/verdict-lines.md §4, whose grep went on returning a number
// after the repair had made the number wrong). So the suite drives the
// enumerator's own properties against the exact verdict line
// `check-attributes.mjs` printed BEFORE the 2026-10-26 repair, and asserts it
// comes back red. If that case ever goes green, the enumerator has become
// decoration and the extraction was pointless.

import { strict as assert } from 'node:assert'
import { execFileSync } from 'node:child_process'
import { describe, it } from 'node:test'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { LOCUS, POSITION, describeGate, renderVerdict, verdictOf } from './verdict-shape.mjs'
import {
  checkGateWide,
  checkProbe,
  driveGate,
  verdict as enumeratorVerdict,
} from './enumerate-verdicts.mjs'
import { GATE as CLOSURES, verdict as closures } from '../ledger/closures-verdict.mjs'
import { GATE as CONTRACT, verdict as contract } from '../ledger/contract-verdict.mjs'
import { GATE as ATTRS, verdict as attributes } from '../ledger/attributes-verdict.mjs'
import { GATE as SCAN, hitLine, unusable, verdict as scan } from '../secret-scan-verdict.mjs'

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..')
const ENUMERATOR = 'tools/gates/enumerate-verdicts.mjs'

/** Run the enumerator as a program and return its exit code and JSON. */
function run(args = []) {
  try {
    const out = execFileSync('node', [ENUMERATOR, '--json', ...args], {
      cwd: REPO_ROOT,
      encoding: 'utf8',
    })
    return { code: 0, json: JSON.parse(out) }
  } catch (err) {
    return { code: err.status, json: err.stdout ? JSON.parse(err.stdout) : null }
  }
}

describe('the four extracted gates, end to end', () => {
  it('exits 0 and reports every branch holding its properties', () => {
    const { code, json } = run()
    assert.equal(code, 0)
    assert.deepEqual(json.findings, [])
    assert.equal(json.verdict.cause, 'ALL_BRANCHES_HOLD')
  })

  it('reaches 13 distinct causes with 17 probes, which is the number the text sweep could not see', () => {
    const { json } = run()
    assert.equal(json.branches.length, 17)
    const causes = new Set(json.branches.map((b) => `${b.gate}\u0000${b.cause}`))
    assert.equal(causes.size, 13)
  })

  it('names a cause on every branch, since an unnamed cause is the defect in miniature', () => {
    const { json } = run()
    for (const b of json.branches) assert.ok(b.cause, `${b.gate} / ${b.probe} has no cause`)
  })

  it('leaves no finding unplaceable, so the actor check was actually evaluated', () => {
    const { json } = run()
    for (const b of json.branches) assert.equal(b.unkeyed_findings, 0, `${b.gate} / ${b.probe}`)
  })

  it('records the stream and position disagreement between gates rather than normalising it', () => {
    const { json } = run()
    // These four gates genuinely disagree today. The enumerator's job is to
    // make that visible; deciding it is a separate, un-taken decision.
    const streams = new Set(json.branches.map((b) => b.stream))
    const positions = new Set(json.branches.map((b) => b.position))
    assert.deepEqual([...streams].sort(), ['err', 'out'])
    assert.deepEqual([...positions].sort(), ['after', 'before'])
  })
})

describe('the historical defect, which is the only proof the checks can fail', () => {
  // The line check-attributes.mjs printed before the 2026-10-26 repair, copied
  // from attributes-verdict.mjs's header: one count over findings whose repairs
  // belong to different people, naming neither of them.
  const OLD_LINE = (violations) => `Merge attributes: ${violations.length} violation(s).`

  /** The pre-repair gate, reconstructed. Same findings, same loci, old line. */
  const BROKEN = describeGate({
    id: 'tools/ledger/check-attributes.mjs (as of 2026-10-25)',
    verdict: (violations) =>
      verdictOf({
        exitCode: violations.length === 0 ? 0 : 1,
        stream: 'err',
        cause: 'ANY_VIOLATION',
        cites: [LOCUS.COMMITTED, LOCUS.CLONE],
        line: OLD_LINE(violations),
      }),
    loci: {
      [LOCUS.COMMITTED]: { noun: /in tracked files/ },
      [LOCUS.CLONE]: { noun: /not registered in this clone/ },
    },
    probes: [
      {
        name: 'both loci',
        findings: [{ locus: LOCUS.COMMITTED }, { locus: LOCUS.CLONE }],
        seen: {},
      },
    ],
  })

  it('fires MIXED_LOCI_NAMED on the pre-repair line', () => {
    const { findings } = driveForTest(BROKEN)
    const rules = findings.map((f) => f.rule)
    assert.ok(
      rules.includes('MIXED_LOCI_NAMED'),
      `expected MIXED_LOCI_NAMED, got ${JSON.stringify(rules)}`,
    )
    // Both loci are present and neither is named, so it fires once per locus.
    assert.equal(rules.filter((r) => r === 'MIXED_LOCI_NAMED').length, 2)
  })

  it('does not fire on the repaired line for the same findings', () => {
    const v = attributes([{ locus: LOCUS.COMMITTED }, { locus: LOCUS.CLONE }], { declared: 6 })
    assert.match(v.line, /in tracked files/)
    assert.match(v.line, /not registered in this clone/)
    assert.equal(v.exitCode, 1)
  })

  it('fires EXIT_0_WHEN_CLEAN on a gate that reports a finding as clean', () => {
    const SILENT = describeGate({
      id: 'synthetic/always-green.mjs',
      verdict: () => verdictOf({ exitCode: 0, cause: 'ALWAYS_GREEN', line: 'nothing to do.' }),
      loci: { [LOCUS.READER]: { noun: /reader/ } },
      probes: [{ name: 'one finding', findings: [{ locus: LOCUS.READER }] }],
    })
    const rules = driveForTest(SILENT).findings.map((f) => f.rule)
    assert.ok(rules.includes('EXIT_0_WHEN_CLEAN'), JSON.stringify(rules))
  })

  it('fires COUNTS_DERIVED on a verdict quoting a number its findings cannot support', () => {
    const INVENTED = describeGate({
      id: 'synthetic/invented-count.mjs',
      verdict: (f) =>
        verdictOf({
          exitCode: 1,
          cause: 'INVENTED',
          cites: [LOCUS.READER],
          // 47 is not a locus count, not the total, not the exit code and not a
          // census field. A reader cannot act on it and the findings cannot
          // produce it.
          line: `47 problem(s) for the reader, over ${f.length} finding(s).`,
        }),
      loci: { [LOCUS.READER]: { noun: /reader/ } },
      probes: [{ name: 'two findings', findings: [{ locus: LOCUS.READER }, { locus: LOCUS.READER }], seen: { scanned: 9 } }],
    })
    const rules = driveForTest(INVENTED).findings.map((f) => f.rule)
    assert.ok(rules.includes('COUNTS_DERIVED'), JSON.stringify(rules))
  })

  it('fires ACTOR_UNMEASURABLE rather than passing a finding it cannot place', () => {
    const UNKEYED = describeGate({
      id: 'synthetic/unkeyed.mjs',
      verdict: (f) =>
        verdictOf({ exitCode: 1, cause: 'SOMETHING', line: `${f.length} thing(s) for the reader.` }),
      loci: { [LOCUS.READER]: { noun: /reader/ } },
      probes: [{ name: 'no locus on the finding', findings: [{ message: 'x' }] }],
    })
    const rules = driveForTest(UNKEYED).findings.map((f) => f.rule)
    assert.ok(rules.includes('ACTOR_UNMEASURABLE'), JSON.stringify(rules))
  })

  it('fires ONE_CAUSE_PER_OUTCOME when two conditions render identically', () => {
    const COLLIDING = describeGate({
      id: 'synthetic/colliding.mjs',
      verdict: (f) =>
        verdictOf({
          exitCode: 1,
          cause: f[0].why, // two different named causes...
          cites: [LOCUS.READER],
          line: '1 problem(s) for the reader.', // ...one indistinguishable line
        }),
      loci: { [LOCUS.READER]: { noun: /reader/ } },
      probes: [
        { name: 'cause A', findings: [{ locus: LOCUS.READER, why: 'A' }] },
        { name: 'cause B', findings: [{ locus: LOCUS.READER, why: 'B' }] },
      ],
    })
    const rules = driveForTest(COLLIDING).findings.map((f) => f.rule)
    assert.ok(rules.includes('ONE_CAUSE_PER_OUTCOME'), JSON.stringify(rules))
  })

  it('accepts a locus named only in the trailer, which is the design allowance', () => {
    const TRAILING = describeGate({
      id: 'synthetic/trailer-names-it.mjs',
      verdict: (f) =>
        verdictOf({
          exitCode: 1,
          cause: 'MIXED',
          cites: [LOCUS.READER, LOCUS.OWNER],
          position: POSITION.BEFORE,
          line: `${f.length} finding(s), 1 for the reader.`,
          // The owner's half is stated only here. Allowed, and the reason the
          // checks read line and trailer together.
          trailer: ['Rotation is the owner to perform.'],
        }),
      loci: {
        [LOCUS.READER]: { noun: /for the reader/ },
        [LOCUS.OWNER]: { noun: /the owner to perform/ },
      },
      probes: [
        { name: 'both loci', findings: [{ locus: LOCUS.READER }, { locus: LOCUS.OWNER }] },
      ],
    })
    assert.deepEqual(driveForTest(TRAILING).findings, [])
  })

  it('exits 2, not 1, when a gate spec cannot be loaded, so a broken run is never clean', () => {
    const v = enumeratorVerdict([], { broken: [{ spec: './missing.mjs', why: 'not found' }] })
    assert.equal(v.exitCode, 2)
    assert.equal(v.derivedFrom, 'ground')
    assert.match(v.line, /established nothing about them/)
  })

  it('derives its own verdict from its own findings, which it would be absurd to exempt', () => {
    const one = enumeratorVerdict([{ locus: LOCUS.COMMITTED, rule: 'X', message: 'y' }], {
      gates: 4,
      branches: 13,
      probes: 17,
    })
    assert.equal(one.exitCode, 1)
    assert.match(one.line, /1 branch\(es\)/)
    assert.match(one.line, /committed file/)
  })
})

describe('the four committed gates, through the same functions', () => {
  it('produce no findings when driven directly', () => {
    for (const gate of [CLOSURES, CONTRACT, ATTRS, SCAN]) {
      assert.deepEqual(driveForTest(gate).findings, [], gate.id)
    }
  })
})

/** Drive a gate through the enumerator's OWN functions. Nothing here
 *  re-implements a check: `driveGate`, `checkProbe` and `checkGateWide` are
 *  imported from the program, so a synthetic gate that commits the defect on
 *  purpose exercises exactly the code path the committed gates take. */
function driveForTest(gate) {
  const driven = driveGate(gate)
  const findings = []
  for (const { probe, v } of driven) findings.push(...checkProbe(gate, probe, v))
  findings.push(...checkGateWide(gate, driven))
  return { findings, driven }
}
