// Does the enumerator detect the defect it was built for, and does it stay
// quiet on the nine gates that are already right?
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
import { GATE as POST } from '../board/post-verdict.mjs'

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

describe('the eleven extracted gates, end to end', () => {
  it('exits 0 and reports every branch holding its properties', () => {
    const { code, json } = run()
    assert.equal(code, 0)
    assert.deepEqual(json.findings, [])
    assert.equal(json.verdict.cause, 'ALL_BRANCHES_HOLD')
  })

  it('reaches 52 distinct causes with 71 probes, which is the number the text sweep could not see', () => {
    const { json } = run()
    // RESOLVED 2026-11-02 BY MEASUREMENT, NOT BY CHOICE. This line conflicted:
    // the hook branch claimed 36 causes over 46 probes and `main` claimed 36
    // over 47, and neither is the union. Both sides were run at their own
    // commits and so was their merge base, because a count asserted here is a
    // census of the registry above and the registry is what the merge changed:
    //
    //   base  aaa98509   32 probes   27 causes   5 gates
    //   main  cdbdcdff   47 probes   36 causes   7 gates   (+15, +9)
    //   hook  886baf9b   46 probes   36 causes   7 gates   (+14, +9)
    //   this merge        61 probes   45 causes   9 gates
    //
    // 32 + 15 + 14 = 61 and 27 + 9 + 9 = 45, so the two sides added disjoint
    // branches and disjoint causes, and the union is exact rather than
    // approximately right. The two identical 36s are the reason this needed
    // measuring: a reviewer comparing the two sides sees the same number on
    // both and has no signal that either is wrong, and taking either one would
    // have left this assertion fifteen or fourteen probes short of a registry
    // it is supposed to be a census of.
    //
    // One gate's own probe count moved, and it is the only place the two
    // sides met: `tools/secret-scan.mjs` went from 5 probes at the base to 6
    // on `main` and 8 on the hook branch and 9 here, because `groundProbes`
    // is the one array both sides appended to and both entries are kept. The
    // other four gates are whole-file additions from one side or the other
    // and merged without arithmetic.
    //
    // The history of this number, preserved from both sides because neither
    // half is recoverable from the other. From the hook branch:
    // 23 and 28 until 2026-10-27, then 27 and 32 earlier the same day. The
    // four added then were all post.mjs's: three sender branches, where a seat
    // named by neither flag nor variable, a seat differing from a roster seat
    // only in case, and a company with no declaration used to be two literal
    // defaults between them; and the board answering that it cut the body at
    // its wake limit, which this file's caller used to discard along with
    // three other response fields.
    //
    // The two added after that are secret-scan's cited baseline, and they are
    // worth distinguishing because they land on opposite sides of the
    // findings/ground line. ALL_HITS_BASELINED is a findings branch: exit 0
    // reached with an empty findings array for a reason that is NOT "nothing
    // was found", which is why it cannot share NOTHING_FOUND's cause or its
    // sentence. BASELINE_UNPARSEABLE is ground: the scanner cannot establish
    // what is accepted, the same class of answer as a shallow clone, and it
    // takes its cause from the fault's own code so that nine distinct repairs
    // are not one name.
    //
    // The four added after those are tools/registers/check-ids.mjs's, the
    // register identifier gate. All four are findings branches and the shape
    // is deliberately the same as check-closures.mjs's, because the question
    // is the same one: some collisions a seat may repair and some are an
    // owner's decision record. Its two ground branches, a manifest it cannot
    // trust and a scope it cannot read, are not probed here; they are driven
    // directly in tools/registers/id-verdict.test.mjs, because the probe
    // space this file declares is a findings space.
    //
    // The three added on 2026-11-01 are tools/registers/check-closure.mjs's,
    // the production-closure gate, and they cost SEVEN probes for three
    // causes, which is the widest probe-to-cause ratio of any gate here. That
    // is deliberate and it is the first gate where the gap carries
    // information: five of its seven probes exist to prove that five
    // DIFFERENT finding rules collapse into only two non-clean verdicts, one
    // for a surface that grew and one for a register that fell behind. A
    // reader of the census would otherwise have no way to tell whether five
    // rules meant five branches. Its three ground branches are not probed
    // here for the same reason check-ids.mjs's two are not: the probe space
    // this file declares is a findings space, and they are driven directly in
    // tools/registers/closure-verdict.test.mjs.
    //
    // And from `main`:
    // 28 and 23 until 2026-10-27. The four added then were all post.mjs's:
    // three sender branches, where a seat named by neither flag nor variable,
    // a seat differing from a roster seat only in case, and a company with no
    // declaration used to be two literal defaults between them; and the
    // board answering that it cut the body at its wake limit, which this
    // file's caller used to discard along with three other response fields.
    //
    // 27 and 32 until 2026-11-02, when `root-entries-verdict.mjs` became the
    // sixth extraction and the first one written in this shape rather than
    // retrofitted into it. Its three causes are the allowlist holding, an
    // entry outside it, and the inverted ignore rule being absent so that
    // there is no allowlist to compare against; its six probes are those
    // three plus the two shapes separately, both together, and a second
    // ground branch for a directory that is not a git repository.
    //
    // 30 and 38 until later on 2026-11-02, when `image-metadata-verdict.mjs`
    // became the seventh extraction. Its six causes are no text channel, a
    // named metadata chunk present, a chunk type its table cannot classify,
    // and three grounds: a tracked image in a format it has no reader for, a
    // container whose chunk lengths do not reach the end of the file, and no
    // git repository to list a tracked set from. Its eight probes are those
    // six plus a tree with no images at all, which is clean rather than
    // unmeasured, and both failing shapes at once.
    //
    // 46 in the same run, before `tools/secret-scan.mjs` grew a second ground
    // branch: an argument it does not know is now exit 2 rather than a tree
    // scan at exit 0. Same cause as its shallow-clone refusal and a different
    // line, which is why the count of branches moved and the count of causes
    // did not.
    // 62 and 46 since 2026-11-02, both measured from the registry and not
    // adjusted to make this line pass. `tools/image-metadata.mjs` grew one
    // ground branch under a new cause, BINARY_UNREAD, for a tracked binary in
    // no format it parses. Both counts move together here, unlike the
    // secret-scan case above, because that branch is the only one reporting
    // that cause.
    //
    // 66 and 49 since 2026-11-09, when `capture-provenance-verdict.mjs` became
    // the tenth extraction. Its three causes are no captures tracked at all,
    // every record surface naming its store, and a record surface naming none;
    // its four probes are those three plus a second undeclared directory,
    // which is there because the failing line carries a COUNT of directories
    // and a one-finding probe cannot tell a count from the constant one. Both
    // counts move together, like image-metadata's, because each of the three
    // branches is the only one reporting its cause.
    //
    // 71 and 52 since 2026-11-09, when `tools/ledger/blockers-verdict.mjs`
    // became the eleventh extraction. Its three causes are every named row
    // still open, a named row that has left the open set, and a forge whose
    // open set could not be read; its five probes are those three plus a
    // clean run that names an unresolvable remainder and a two-finding red
    // run, both of which are there because the lines carry COUNTS and a
    // one-finding probe cannot tell a count from the constant one — the same
    // reason capture-provenance has a fourth. Both counts move together, so
    // each of the three branches is the only one reporting its cause.
    //
    // THE FORGE BRANCH IS WHY THIS GATE'S REGISTRATION CHANGED THE GATE. It
    // first returned exit 2 from a boolean in `seen` with an empty findings
    // array, and this file's EXIT_0_WHEN_CLEAN check caught it in the same
    // minute it was registered: red with nothing printed above the verdict.
    // An unreachable forge is reported as a `clone` finding now, so the
    // verdict is derived from findings like every other branch here.
    assert.equal(json.branches.length, 71)
    const causes = new Set(json.branches.map((b) => `${b.gate}\u0000${b.cause}`))
    assert.equal(causes.size, 52)
  })

  it('carries an exit 3, which no gate of the first four could have reached', () => {
    const { json } = run()
    const threes = json.branches.filter((b) => b.exit === 3)
    assert.equal(threes.length, 1)
    assert.equal(threes[0].gate, 'tools/board/post.mjs')
    assert.equal(threes[0].cause, 'STORE_REFUSED_WHAT_CHECKER_PASSED')
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

  it('exempts a number inside a declared quotation, and only that number', () => {
    // The exemption `tools/board/post.mjs` needed: 422 is the status the board
    // answered with, so no partition of the findings can produce it. The 47 in
    // the same line is a count of nothing, and it must still fire -- a gate
    // that declares one quotation must not get a blanket pass on the rest of
    // its arithmetic.
    const QUOTING = describeGate({
      id: 'synthetic/quotes-its-input.mjs',
      verdict: (f) =>
        verdictOf({
          exitCode: 3,
          cause: 'STORE_REFUSED',
          cites: [LOCUS.COMMITTED],
          quoted: ['422'],
          line: `The store refused it with 422, and 47 rules were checked, over ${f.length} finding(s).`,
        }),
      loci: { [LOCUS.COMMITTED]: { noun: /store/ } },
      probes: [{ name: 'one refusal', findings: [{ locus: LOCUS.COMMITTED }] }],
    })
    const findings = driveForTest(QUOTING).findings
    const claimed = findings.filter((f) => f.rule === 'COUNTS_DERIVED').map((f) => f.message)
    assert.equal(claimed.length, 1, JSON.stringify(findings.map((f) => f.rule)))
    assert.match(claimed[0], /claims 47/)
  })

  it('fires QUOTED_IS_QUOTED when the declared quotation is not in the line', () => {
    // An exemption with nothing behind it. Without this check, a gate could
    // buy silence for any number by declaring a quotation it never prints.
    const PRETENDING = describeGate({
      id: 'synthetic/pretends-to-quote.mjs',
      verdict: () =>
        verdictOf({
          exitCode: 1,
          cause: 'PRETENDS',
          cites: [LOCUS.READER],
          quoted: ['99 of the reader\'s files'],
          line: '99 problem(s) for the reader.',
        }),
      loci: { [LOCUS.READER]: { noun: /reader/ } },
      probes: [{ name: 'one finding', findings: [{ locus: LOCUS.READER }] }],
    })
    const rules = driveForTest(PRETENDING).findings.map((f) => f.rule)
    assert.ok(rules.includes('QUOTED_IS_QUOTED'), JSON.stringify(rules))
  })

  it('exits 2, not 1, when a gate spec cannot be loaded, so a broken run is never clean', () => {
    const v = enumeratorVerdict([], { broken: [{ spec: './missing.mjs', why: 'not found' }] })
    assert.equal(v.exitCode, 2)
    assert.equal(v.derivedFrom, 'ground')
    assert.match(v.line, /established nothing about them/)
  })

  it('derives its own verdict from its own findings, which it would be absurd to exempt', () => {
    const one = enumeratorVerdict([{ locus: LOCUS.COMMITTED, rule: 'X', message: 'y' }], {
      gates: 5,
      branches: 23,
      probes: 28,
    })
    assert.equal(one.exitCode, 1)
    assert.match(one.line, /1 branch\(es\)/)
    assert.match(one.line, /committed file/)
  })
})

describe('the six committed gates, through the same functions', () => {
  it('produce no findings when driven directly', () => {
    for (const gate of [CLOSURES, CONTRACT, ATTRS, SCAN, POST]) {
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
