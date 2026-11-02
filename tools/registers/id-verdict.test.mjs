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
import { GATE, manifestFault, manifestUnusable, scopeUnreadable, verdict } from './id-verdict.mjs'

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

  it('declares the four namespaces this repository allocates for itself', () => {
    assert.deepEqual(
      manifest.namespaces.map((n) => n.name),
      ['ADR', 'PWC', 'PWC-ENG', 'PWC-EXO'],
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

  it('every define pattern finds its own namespace prefix and nothing else', () => {
    for (const ns of manifest.namespaces) {
      const re = new RegExp(ns.define)
      const sample = `## ${ns.name}-${'1'.padStart(ns.pad, '0')} — a heading`
      const match = re.exec(sample)
      assert.ok(match, `${ns.name} does not match its own heading shape: ${sample}`)
      assert.equal(match[1], `${ns.name}-${'1'.padStart(ns.pad, '0')}`)
    }
  })

  it('every burned identifier is still burned for a stated reason', () => {
    const burned = manifest.namespaces.flatMap((n) => n.burned ?? [])
    assert.equal(burned.length, 6)
    for (const b of burned) assert.ok(b.why.length > 20, `${b.id} has a reason too short to review`)
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
