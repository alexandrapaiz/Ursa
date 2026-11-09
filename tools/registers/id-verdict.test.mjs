// Every line `tools/registers/check-ids.mjs` prints, pinned against a literal,
// and every refusal its manifest validator can make.
//
// WHY LITERALS. The verdict line is the one sentence a reader acts on, and a
// test that rebuilt it from the module's own template would pass on any
// reword. These are written out by hand.
//
// WHY THE COMMITTED MANIFEST IS UNDER TEST TOO, in `the committed manifest`
// below. Nine of these cases prove the validator refuses a malformed
// namespace. None of them prove the file this repository actually ships is
// well formed, and a manifest that fails validation would make the gate exit 2
// on every run, which reads as "the gate is broken" and gets it switched off
// rather than fixed.

import { strict as assert } from 'node:assert'
import { readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, it } from 'node:test'
import {
  GATE,
  manifestFault,
  manifestUnusable,
  scopeUnreadable,
  spellId,
  unspellId,
  verdict,
} from './id-verdict.mjs'

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..')
const SEEN = { ids: 24, namespaces: 4, refs: 1, scope: 'origin/main' }
const COUNTED = '24 identifier(s) in 4 namespace(s) across 1 ref(s), from origin/main'
const seat = (rule = 'DOUBLE_DEFINITION') => ({ held: 'seat', rule, message: 'x' })
const owner = (rule = 'DOUBLE_DEFINITION') => ({ held: 'owner', rule, message: 'x' })

/** A manifest that passes, so each case below can break exactly one thing. */
const good = () => ({
  namespaces: [
    {
      name: 'ADR',
      register: 'docs/decisions.md',
      pad: 3,
      define: '^## (ADR-(\\d+)) \\u2014 (.+)$',
      spell: 'ADR-{n}',
      example: '## ADR-002 \u2014 Activation wave 1: okr, pm, exo (2026-09-18)',
      repair: 'owner',
      why: 'architecture decisions',
      burned: [{ id: 'ADR-009', why: 'burned for a reason' }],
    },
  ],
})

describe('register identifier verdict', () => {
  it('exit 0, every identifier defined once', () => {
    const v = verdict([], SEEN)
    assert.equal(v.exitCode, 0)
    assert.equal(v.cause, 'ALL_IDS_UNIQUE')
    assert.equal(v.stream, 'out')
    assert.equal(v.position, 'after')
    assert.equal(v.derivedFrom, 'findings')
    assert.equal(
      v.line,
      `Register identifiers: ${COUNTED}, every one defined once and no burned one reissued. Exit 0.`,
    )
  })

  it('exit 1 when a seat can repair every collision', () => {
    const v = verdict([seat(), seat('BURNED_REISSUED')], SEEN)
    assert.equal(v.exitCode, 1)
    assert.equal(v.cause, 'SEAT_REPAIRABLE')
    assert.deepEqual(v.cites, ['seat'])
    assert.equal(
      v.line,
      `Register identifiers: ${COUNTED}, 2 collision(s) a seat can repair. Exit 1.`,
    )
  })

  it('exit 2 when only the owner can repair, which is what main is today', () => {
    // This is the branch the real repository reaches: ADR-005 and ADR-006 are
    // each defined twice in docs/decisions.md and renumbering an accepted ADR
    // is the owner's edit, so the honest report is "clean as far as a seat can
    // take it" rather than a red gate a seat is expected to fix.
    const v = verdict([owner(), owner()], SEEN)
    assert.equal(v.exitCode, 2)
    assert.equal(v.cause, 'OWNER_REMAINDER_ONLY')
    assert.equal(v.derivedFrom, 'findings')
    assert.deepEqual(v.cites, ['owner'])
    assert.equal(
      v.line,
      `Register identifiers: ${COUNTED}, clean as far as a seat can take it. ` +
        '2 collision(s) above need the owner, not a seat. Exit 2.',
    )
  })

  it('exit 1 with the owner remainder named, since a reader of the short form cannot know it exists', () => {
    const v = verdict([seat(), owner(), owner()], SEEN)
    assert.equal(v.exitCode, 1)
    assert.equal(v.cause, 'SEAT_REPAIRABLE_WITH_OWNER_REMAINDER')
    assert.deepEqual(v.cites, ['seat', 'owner'])
    assert.equal(
      v.line,
      `Register identifiers: ${COUNTED}, 1 collision(s) a seat can repair and 2 the owner holds. Exit 1.`,
    )
  })

  it('counts a finding with no held field against the seat, never against the owner', () => {
    // The inverse default would file a seat's own collision under "not yours
    // to repair" and exit 2, which is the bug closures-verdict.mjs shipped and
    // its own suite caught the hour it was written.
    const v = verdict([{ rule: 'DOUBLE_DEFINITION', message: 'x' }], SEEN)
    assert.equal(v.exitCode, 1)
    assert.equal(v.cause, 'SEAT_REPAIRABLE')
  })

  it('defaults the census rather than printing undefined into the line', () => {
    const v = verdict([])
    assert.equal(
      v.line,
      'Register identifiers: 0 identifier(s) in 0 namespace(s) across 1 ref(s), from origin/main, ' +
        'every one defined once and no burned one reissued. Exit 0.',
    )
  })
})

describe('the two ground branches, which are not findings branches', () => {
  it('a manifest it cannot trust takes its cause from the fault code', () => {
    const v = manifestUnusable({ code: 'MANIFEST_EMPTY', detail: 'nothing declared' })
    assert.equal(v.exitCode, 2)
    assert.equal(v.cause, 'MANIFEST_EMPTY')
    assert.equal(v.derivedFrom, 'ground')
    assert.equal(v.stream, 'err')
    assert.equal(v.position, 'before')
    assert.equal(
      v.line,
      'Register identifiers: the namespace manifest is unusable, so nothing was checked ' +
        '(MANIFEST_EMPTY: nothing declared). Exit 2.',
    )
    assert.deepEqual(v.quoted, ['nothing declared'])
  })

  it('a scope it cannot read is a different branch, because the repair is in a different place', () => {
    const v = scopeUnreadable({ code: 'CLONE_SHALLOW', detail: 'run the repair' })
    assert.equal(v.exitCode, 2)
    assert.equal(v.cause, 'CLONE_SHALLOW')
    assert.equal(v.derivedFrom, 'ground')
    assert.equal(
      v.line,
      'Register identifiers: the scope could not be read, so no answer was reached ' +
        '(CLONE_SHALLOW: run the repair). Exit 2.',
    )
  })

  it('exit 2 means two things and only derivedFrom separates them', () => {
    // The pair worth stating once: a collision only the owner can repair and a
    // manifest the gate cannot trust both exit 2, exactly as
    // check-closures.mjs and check-attributes.mjs both do. A caller that reads
    // the code alone cannot tell "the repository has a defect you may not fix"
    // from "this run established nothing".
    assert.equal(verdict([owner()], SEEN).exitCode, 2)
    assert.equal(verdict([owner()], SEEN).derivedFrom, 'findings')
    assert.equal(manifestUnusable({ code: 'X', detail: 'y' }).exitCode, 2)
    assert.equal(manifestUnusable({ code: 'X', detail: 'y' }).derivedFrom, 'ground')
  })
})

describe('the manifest validator refuses before any ref is read', () => {
  const cases = [
    ['MANIFEST_ABSENT', undefined],
    ['MANIFEST_UNPARSEABLE', new Error('Unexpected token }')],
    ['MANIFEST_NOT_AN_OBJECT', []],
    ['MANIFEST_NO_NAMESPACES', {}],
    ['MANIFEST_EMPTY', { namespaces: [] }],
  ]
  for (const [code, input] of cases) {
    it(`${code}`, () => assert.equal(manifestFault(input)?.code, code))
  }

  /** @param {(ns: object) => void} mutate */
  const broken = (mutate) => {
    const m = good()
    mutate(m.namespaces[0], m)
    return manifestFault(m)?.code
  }

  it('NAMESPACE_NO_NAME', () => assert.equal(broken((ns) => delete ns.name), 'NAMESPACE_NO_NAME'))
  it('NAMESPACE_DUPLICATED', () =>
    assert.equal(
      broken((ns, m) => m.namespaces.push({ ...ns })),
      'NAMESPACE_DUPLICATED',
    ))
  it('NAMESPACE_NO_REGISTER', () =>
    assert.equal(broken((ns) => delete ns.register), 'NAMESPACE_NO_REGISTER'))
  it('NAMESPACE_NO_WHY, because a namespace nobody can explain cannot be reviewed', () =>
    assert.equal(broken((ns) => (ns.why = '   ')), 'NAMESPACE_NO_WHY'))
  it('NAMESPACE_REPAIR_UNKNOWN', () =>
    assert.equal(broken((ns) => (ns.repair = 'clone')), 'NAMESPACE_REPAIR_UNKNOWN'))
  it('NAMESPACE_PAD_UNUSABLE', () => assert.equal(broken((ns) => (ns.pad = 0)), 'NAMESPACE_PAD_UNUSABLE'))
  it('NAMESPACE_NO_DEFINE', () => assert.equal(broken((ns) => delete ns.define), 'NAMESPACE_NO_DEFINE'))
  it('DEFINE_NOT_A_PATTERN', () =>
    assert.equal(broken((ns) => (ns.define = '^## (ADR-(\\d+)$')), 'DEFINE_NOT_A_PATTERN'))
  it('DEFINE_NO_NUMBER_CAPTURE, so the allocator can never read a number it cannot name', () =>
    assert.equal(broken((ns) => (ns.define = '^## (ADR-\\d+).*$')), 'DEFINE_NO_NUMBER_CAPTURE'))
  it('DEFINE_NOT_ANCHORED, so a mention in a paragraph is never a definition', () =>
    assert.equal(broken((ns) => (ns.define = '(ADR-(\\d+))')), 'DEFINE_NOT_ANCHORED'))
  it('BURNED_NOT_AN_ARRAY', () => assert.equal(broken((ns) => (ns.burned = {})), 'BURNED_NOT_AN_ARRAY'))
  it('BURNED_NO_ID', () => assert.equal(broken((ns) => (ns.burned = [{ why: 'x' }])), 'BURNED_NO_ID'))
  it('BURNED_NO_WHY, because a burn with no reason cannot be lifted', () =>
    assert.equal(broken((ns) => (ns.burned = [{ id: 'ADR-009' }])), 'BURNED_NO_WHY'))
  it('BURNED_DUPLICATED', () =>
    assert.equal(
      broken((ns) => ns.burned.push({ id: 'ADR-009', why: 'again' })),
      'BURNED_DUPLICATED',
    ))
  it('BURNED_OUT_OF_NAMESPACE', () =>
    assert.equal(
      broken((ns) => (ns.burned = [{ id: 'PWC-9', why: 'x' }])),
      'BURNED_OUT_OF_NAMESPACE',
    ))
  it('BURNED_NOT_NUMBERED', () =>
    assert.equal(
      broken((ns) => (ns.burned = [{ id: 'ADR-draft', why: 'x' }])),
      'BURNED_NOT_NUMBERED',
    ))

  it('NAMESPACE_SPELL_UNUSABLE when there is no {n} to substitute', () =>
    assert.equal(broken((ns) => (ns.spell = 'ADR-')), 'NAMESPACE_SPELL_UNUSABLE'))
  it('NAMESPACE_SPELL_UNUSABLE when there are two, since only the first substitutes', () =>
    assert.equal(broken((ns) => (ns.spell = 'ADR-{n}-{n}')), 'NAMESPACE_SPELL_UNUSABLE'))
  it('NAMESPACE_NO_EXAMPLE', () =>
    assert.equal(broken((ns) => delete ns.example), 'NAMESPACE_NO_EXAMPLE'))
  it('EXAMPLE_NOT_DEFINED, which is how a pattern that matches nothing in its own register is caught', () =>
    // The failure this case exists for is silent in the worst way: a pattern
    // matching no heading makes the gate count zero identifiers in that
    // namespace and print Exit 0, so the register reads as clean because it
    // was never looked at.
    assert.equal(
      broken((ns) => (ns.example = '### ADR-002: a heading in some other shape')),
      'EXAMPLE_NOT_DEFINED',
    ))
  it('EXAMPLE_SPELLING_DISAGREES when pad would write the example a different way', () =>
    // pad 1 writes ADR-002's number as "2", so the allocator would hand out
    // `ADR-2` for a register whose every citation spells it `ADR-002`, and
    // every citation in this repository is a string match.
    assert.equal(broken((ns) => (ns.pad = 1)), 'EXAMPLE_SPELLING_DISAGREES'))
  it('EXAMPLE_SPELLING_DISAGREES when spell and define disagree on the prefix', () =>
    assert.equal(broken((ns) => (ns.spell = 'ADR{n}')), 'EXAMPLE_SPELLING_DISAGREES'))

  it('accepts the shape it is meant to accept, so the suite is not just refusals', () => {
    assert.equal(manifestFault(good()), null)
  })
})

describe('the committed manifest', () => {
  const manifest = JSON.parse(
    readFileSync(join(REPO_ROOT, 'tools/registers/id-namespaces.json'), 'utf8'),
  )

  it('passes its own validator, so the gate is not permanently exit 2', () => {
    assert.equal(manifestFault(manifest), null)
  })

  it('declares the six namespaces this repository allocates for itself', () => {
    // Was four until 2026-11-09. `Window` and `RunnerFact` are the two that
    // tools/registers/registers.json already described the race for, in its
    // own `why_identifier` fields, while this file did not carry them.
    assert.deepEqual(
      manifest.namespaces.map((n) => n.name),
      ['ADR', 'PWC', 'PWC-ENG', 'PWC-EXO', 'Window', 'RunnerFact'],
    )
  })

  it('does not claim the vendored HQ lessons register, which this repository cannot repair', () => {
    // docs/standards/lessons.md allocates L-A and L-E, is a vendored copy of
    // an HQ standard, and carries its own burn list (L-A102 to L-A105,
    // retired unissued). Claiming it here would produce findings whose repair
    // is in another repository, held by neither a seat nor the owner, which is
    // not a locus this gate has.
    for (const ns of manifest.namespaces) {
      assert.notEqual(ns.register, 'docs/standards/lessons.md')
    }
  })

  it('every define pattern matches a heading its own register really carries', () => {
    // This test used to build its sample as `## ${ns.name}-${padded} — a
    // heading`, which asserted the thing it was testing: it could only pass
    // for a namespace spelled `NAME-<digits>`, so it certified the four that
    // were and was unreachable for the two that were missing. The sample is
    // now the namespace's own `example`, which is a line copied out of the
    // register, so the assertion is against the repository rather than
    // against the test's own idea of a heading.
    for (const ns of manifest.namespaces) {
      const match = new RegExp(ns.define).exec(ns.example)
      assert.ok(match, `${ns.name} does not match its own example: ${ns.example}`)
      assert.equal(match[1], spellId(ns, Number(match[2])))
    }
  })

  it('every example is a line that is really in the register it names', () => {
    // One step past the validator, which only checks the example against the
    // pattern. A plausible-looking example that no register carries would let
    // a pattern drift away from the file it reads while both tests stayed
    // green, so this reads the register off disk.
    for (const ns of manifest.namespaces) {
      const body = readFileSync(join(REPO_ROOT, ns.register), 'utf8')
      // A prefix match, not equality, so a namespace whose register carries
      // very long headings can cite a readable truncation of a real one. The
      // `define` patterns are written to match a truncation as well, which is
      // what makes that safe; `RunnerFact` below is exactly that case.
      const lines = body.split('\n')
      assert.ok(
        lines.some((line) => line.startsWith(ns.example)),
        `${ns.name}: no line in ${ns.register} starts with its example ${JSON.stringify(ns.example)}`,
      )
    }
  })

  it('accounts for every register tools/registers/registers.json declares', () => {
    // WHY THIS TEST IS THE DURABLE PART OF THE 2026-11-09 CHANGE. Adding the
    // two missing namespaces fixes today; this is what keeps tomorrow's added
    // register from drifting the same way. Both files describe the same set of
    // append-only registers from different angles, and until now nothing read
    // one against the other, so a register declared for entry-keyed merging
    // and absent from the identifier gate was indistinguishable from a
    // register deliberately left out. Every path is now either a namespace or
    // an entry in `excluded` with a reason, and this test is the thing that
    // makes the absence of a third option visible.
    const registers = JSON.parse(
      readFileSync(join(REPO_ROOT, 'tools/registers/registers.json'), 'utf8'),
    )
    const claimed = new Set(manifest.namespaces.map((n) => n.register))
    const excluded = new Set((manifest.excluded ?? []).map((e) => e.register))
    for (const r of registers.registers) {
      assert.ok(
        claimed.has(r.path) || excluded.has(r.path),
        `${r.path} is a register in registers.json and is in neither \`namespaces\` nor \`excluded\` in id-namespaces.json`,
      )
    }
  })

  it('every exclusion carries a reason long enough to review', () => {
    for (const e of manifest.excluded ?? []) {
      assert.equal(typeof e.register, 'string')
      assert.ok(e.why.length > 80, `${e.register} is excluded with a reason too short to review`)
    }
  })

  it('does not exclude a register it also claims, which would be two answers for one path', () => {
    const claimed = new Set(manifest.namespaces.map((n) => n.register))
    for (const e of manifest.excluded ?? []) {
      assert.ok(!claimed.has(e.register), `${e.register} is both claimed and excluded`)
    }
  })

  it('every burned identifier is still burned for a stated reason', () => {
    const burned = manifest.namespaces.flatMap((n) => n.burned ?? [])
    assert.equal(burned.length, 6)
    for (const b of burned) assert.ok(b.why.length > 20, `${b.id} has a reason too short to review`)
  })
})

describe('the spelling helpers', () => {
  const adr = { spell: 'ADR-{n}', pad: 3 }
  const section = { spell: '{n}', pad: 1 }
  const window = { spell: 'Window {n}', pad: 1 }

  it('pads to the register, because ADR-007 and ADR-7 are one number and two strings', () => {
    assert.equal(spellId(adr, 7), 'ADR-007')
    assert.equal(spellId(section, 7), '7')
    assert.equal(spellId(window, 106), 'Window 106')
  })

  it('does not truncate a number wider than the pad', () => {
    assert.equal(spellId(adr, 1234), 'ADR-1234')
  })

  it('round-trips every spelling it can write', () => {
    for (const ns of [adr, section, window]) {
      for (const n of [1, 9, 10, 99, 100, 105]) {
        assert.deepEqual(unspellId(ns, spellId(ns, n)), { n })
      }
    }
  })

  it('separates a wrong namespace from a wrong number, because the repairs differ', () => {
    assert.deepEqual(unspellId(adr, 'PWC-9'), { fault: 'SHAPE' })
    assert.deepEqual(unspellId(adr, 'ADR-draft'), { fault: 'NUMBER' })
    assert.deepEqual(unspellId(adr, 'ADR-'), { fault: 'NUMBER' })
  })

  it('reads a bare number, which is the case `${name}-` could not express at all', () => {
    assert.deepEqual(unspellId(section, '93'), { n: 93 })
    assert.deepEqual(unspellId(section, '1b'), { fault: 'NUMBER' })
  })

  it('refuses a suffix spelling whose tail is absent rather than reading past it', () => {
    const dotted = { spell: '{n}.', pad: 1 }
    assert.deepEqual(unspellId(dotted, '93.'), { n: 93 })
    assert.deepEqual(unspellId(dotted, '93'), { fault: 'SHAPE' })
    assert.deepEqual(unspellId(dotted, '.'), { fault: 'NUMBER' })
  })
})

describe('the gate spec', () => {
  it('is the id the repository calls it by, not the module it lives in', () => {
    assert.equal(GATE.id, 'tools/registers/check-ids.mjs')
  })

  it('declares a naming pattern for both loci, matched against the real lines', () => {
    assert.match(verdict([seat()], SEEN).line, GATE.loci.seat.noun)
    assert.match(verdict([owner()], SEEN).line, GATE.loci.owner.noun)
  })
})
