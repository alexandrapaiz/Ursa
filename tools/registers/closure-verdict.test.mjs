// Every line `tools/registers/check-closure.mjs` prints, pinned against a
// literal, every refusal its two validators can make, and the closure
// computation itself driven over a hand-written lockfile.
//
// WHY LITERALS. The verdict line is the one sentence a reader acts on, and a
// test that rebuilt it from the module's own template would pass on any
// reword. These are written out by hand.
//
// WHY THE COMMITTED FILES ARE UNDER TEST TOO, in `the committed repository`
// below. Everything above it proves the validators refuse a malformed input.
// None of it proves the three lockfiles and the one baseline this repository
// actually carries are well formed, and either one failing validation would
// make the gate exit 2 on every run, which reads as "the gate is broken" and
// gets it switched off rather than fixed. This is the same reason
// ./id-verdict.test.mjs puts its own committed manifest under test.
//
// WHY A HAND-WRITTEN LOCKFILE AND NOT A FIXTURE COPY. `prodClosure` is
// interesting exactly where the real lockfiles are boring: a scoped name at
// depth, the same name at two versions in production, and an entry npm flagged
// `devOptional` rather than `dev`. The committed files contain the first and
// the third and not the second, so the second would go unexercised against a
// copy of them.

import { strict as assert } from 'node:assert'
import { readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { describe, it } from 'node:test'
import { fileURLToPath } from 'node:url'

import {
  GATE,
  SUPPORTED_LOCKFILE_VERSION,
  baselineFault,
  baselineUnusable,
  compare,
  lockFault,
  lockUnreadable,
  packageNameOf,
  prodClosure,
  scopeUnreadable,
  verdict,
} from './closure-verdict.mjs'

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..')

const SEEN = { workspaces: 3, packages: 308, devOnly: 745 }
const COUNTED =
  '308 package(s) in the production closure of 3 workspace(s), with 745 development-only entry(ies) excluded'

const f = (rule, workspace = 'ursa-minor') => ({ rule, workspace, message: 'x' })

/** A lockfile that validates, so each case below can break exactly one thing. */
const good = () => ({
  name: 'w',
  lockfileVersion: 3,
  packages: {
    '': { name: 'w', version: '0.1.0', dependencies: { a: '^1' }, devDependencies: { t: '^2' } },
    'node_modules/a': { version: '1.0.0' },
    'node_modules/t': { version: '2.0.0', dev: true },
  },
})

const goodBaseline = () => ({
  workspaces: { w: { members: ['a@1.0.0'], count: 1 } },
})

describe('packageNameOf', () => {
  it('takes the whole tail after the last node_modules, so a scope is not mistaken for a name', () => {
    assert.equal(packageNameOf('node_modules/@scope/pkg'), '@scope/pkg')
    assert.equal(packageNameOf('node_modules/a/node_modules/@scope/pkg'), '@scope/pkg')
    assert.equal(packageNameOf('node_modules/a/node_modules/b'), 'b')
  })

  it('names nothing for the root entry or a path outside node_modules', () => {
    assert.equal(packageNameOf(''), null)
    assert.equal(packageNameOf('packages/w'), null)
    assert.equal(packageNameOf('node_modules/'), null)
  })
})

describe('prodClosure', () => {
  it('excludes dev and devOptional entries and keys members on name@version', () => {
    const closure = prodClosure({
      lockfileVersion: 3,
      packages: {
        '': { name: 'w' },
        'node_modules/ships': { version: '1.0.0' },
        'node_modules/dev': { version: '1.0.0', dev: true },
        'node_modules/devopt': { version: '1.0.0', devOptional: true },
      },
    })
    assert.deepEqual(closure.members, ['ships@1.0.0'])
    assert.equal(closure.devOnly, 2)
  })

  it('keeps an optional entry, because `npm ci --omit=dev` installs one', () => {
    // The direction matters and it is deliberate. An optional production
    // dependency is installed unless the installer also passes --omit=optional,
    // and a platform binary is installed on the platform it matches. Counting
    // it is the conservative reading for a security surface: the closure
    // over-states what any one machine receives and under-states nothing.
    const closure = prodClosure({
      lockfileVersion: 3,
      packages: {
        '': { name: 'w' },
        'node_modules/@img/sharp-linux-x64': { version: '0.35.5', optional: true },
      },
    })
    assert.deepEqual(closure.members, ['@img/sharp-linux-x64@0.35.5'])
    assert.equal(closure.devOnly, 0)
  })

  it('counts the same name at two production versions as two members', () => {
    const closure = prodClosure({
      lockfileVersion: 3,
      packages: {
        '': { name: 'w' },
        'node_modules/x': { version: '2.0.0' },
        'node_modules/a/node_modules/x': { version: '1.0.0' },
      },
    })
    assert.deepEqual(closure.members, ['x@1.0.0', 'x@2.0.0'])
  })

  it('collapses two paths at one name@version into one member, because they are the same bytes', () => {
    const closure = prodClosure({
      lockfileVersion: 3,
      packages: {
        '': { name: 'w' },
        'node_modules/x': { version: '1.0.0' },
        'node_modules/a/node_modules/x': { version: '1.0.0' },
      },
    })
    assert.deepEqual(closure.members, ['x@1.0.0'])
    assert.deepEqual(closure.paths['x@1.0.0'], ['node_modules/a/node_modules/x', 'node_modules/x'])
  })

  it('returns members in sorted order, which is what makes the baseline diff legible', () => {
    const closure = prodClosure({
      lockfileVersion: 3,
      packages: {
        '': { name: 'w' },
        'node_modules/zed': { version: '1.0.0' },
        'node_modules/alpha': { version: '1.0.0' },
        'node_modules/@scope/mid': { version: '1.0.0' },
      },
    })
    assert.deepEqual(closure.members, ['@scope/mid@1.0.0', 'alpha@1.0.0', 'zed@1.0.0'])
  })
})

describe('lockFault', () => {
  it('passes a well-formed v3 lockfile', () => {
    assert.equal(lockFault(good(), 'w/package-lock.json'), null)
  })

  it('refuses a parse error, carrying the message rather than a stack', () => {
    const fault = lockFault(new SyntaxError('Unexpected token }'), 'w/package-lock.json')
    assert.equal(fault.code, 'LOCKFILE_UNPARSEABLE')
    assert.match(fault.detail, /^w\/package-lock\.json: Unexpected token \}$/)
  })

  it('refuses a non-object top level', () => {
    assert.equal(lockFault([], 'w/package-lock.json').code, 'LOCKFILE_NOT_AN_OBJECT')
    assert.equal(lockFault('{}', 'w/package-lock.json').code, 'LOCKFILE_NOT_AN_OBJECT')
  })

  it('refuses any lockfileVersion but the one whose scope fields it has been checked against', () => {
    assert.equal(SUPPORTED_LOCKFILE_VERSION, 3)
    for (const version of [1, 2, 4, undefined, '3']) {
      const lock = { ...good(), lockfileVersion: version }
      assert.equal(lockFault(lock, 'w/package-lock.json').code, 'LOCKFILE_VERSION_UNSUPPORTED', String(version))
    }
  })

  it('refuses a lockfile with no packages map and one with no root entry', () => {
    const noPackages = { ...good() }
    delete noPackages.packages
    assert.equal(lockFault(noPackages, 'w/package-lock.json').code, 'LOCKFILE_NO_PACKAGES')

    const noRoot = good()
    delete noRoot.packages['']
    assert.equal(lockFault(noRoot, 'w/package-lock.json').code, 'LOCKFILE_NO_ROOT')
  })

  it('refuses a workspace link rather than guessing at its semantics', () => {
    const lock = good()
    lock.packages['packages/inner'] = { resolved: 'packages/inner', link: true }
    const fault = lockFault(lock, 'w/package-lock.json')
    assert.equal(fault.code, 'LOCKFILE_HAS_LINKED_ENTRY')
    assert.match(fault.detail, /packages\/inner/)
  })

  it('refuses a production entry with no version, since it cannot be pinned', () => {
    const lock = good()
    lock.packages['node_modules/a'] = {}
    assert.equal(lockFault(lock, 'w/package-lock.json').code, 'LOCKFILE_ENTRY_NO_VERSION')
  })

  it('refuses a production entry this gate cannot name', () => {
    const lock = good()
    lock.packages['vendor/a'] = { version: '1.0.0' }
    assert.equal(lockFault(lock, 'w/package-lock.json').code, 'LOCKFILE_ENTRY_NOT_A_PACKAGE')
  })

  it('tolerates a dev entry with no version, because nothing pins one', () => {
    const lock = good()
    lock.packages['node_modules/t'] = { dev: true }
    assert.equal(lockFault(lock, 'w/package-lock.json'), null)
  })
})

describe('baselineFault', () => {
  it('passes a well-formed baseline', () => {
    assert.equal(baselineFault(goodBaseline()), null)
  })

  it('names the repair command when the file is absent, because that is the whole repair', () => {
    const fault = baselineFault(undefined)
    assert.equal(fault.code, 'BASELINE_ABSENT')
    assert.match(fault.detail, /--write/)
  })

  it('refuses a parse error, a non-object, and a missing workspaces map', () => {
    assert.equal(baselineFault(new SyntaxError('bad')).code, 'BASELINE_UNPARSEABLE')
    assert.equal(baselineFault([]).code, 'BASELINE_NOT_AN_OBJECT')
    assert.equal(baselineFault({}).code, 'BASELINE_NO_WORKSPACES')
    assert.equal(baselineFault({ workspaces: [] }).code, 'BASELINE_NO_WORKSPACES')
  })

  it('refuses an empty baseline, which would check nothing and print that it is clean', () => {
    assert.equal(baselineFault({ workspaces: {} }).code, 'BASELINE_EMPTY')
  })

  it('refuses a workspace with no members array', () => {
    assert.equal(baselineFault({ workspaces: { w: {} } }).code, 'BASELINE_WORKSPACE_NO_MEMBERS')
  })

  it('refuses a member that is not a name@version string', () => {
    for (const member of ['nover', 42, null, '@scope/only']) {
      const fault = baselineFault({ workspaces: { w: { members: [member] } } })
      assert.equal(fault.code, 'BASELINE_MEMBER_MALFORMED', String(member))
    }
  })

  it('accepts a scoped member, whose name carries its own slash and no second @', () => {
    assert.equal(baselineFault({ workspaces: { w: { members: ['@scope/pkg@1.0.0'] } } }), null)
  })

  it('refuses unsorted members, because an unsorted pin makes every future diff unreadable', () => {
    const fault = baselineFault({ workspaces: { w: { members: ['b@1.0.0', 'a@1.0.0'] } } })
    assert.equal(fault.code, 'BASELINE_MEMBERS_UNSORTED')
  })

  it('refuses a duplicated member', () => {
    const fault = baselineFault({ workspaces: { w: { members: ['a@1.0.0', 'a@1.0.0'] } } })
    assert.equal(fault.code, 'BASELINE_MEMBERS_DUPLICATED')
  })
})

describe('compare', () => {
  const measured = (members) => ({ w: { members: [...members].sort() } })

  it('finds nothing when the closure matches the pin', () => {
    assert.deepEqual(compare(measured(['a@1.0.0']), goodBaseline()), [])
  })

  it('reports a package that newly ships as CLOSURE_ADDED, naming the deployed surface', () => {
    const findings = compare(measured(['a@1.0.0', 'new@3.0.0']), goodBaseline())
    assert.equal(findings.length, 1)
    assert.equal(findings[0].rule, 'CLOSURE_ADDED')
    assert.equal(findings[0].workspace, 'w')
    assert.equal(
      findings[0].message,
      'w: new@3.0.0 is in the production closure and is not in the baseline, so it reaches a deployed surface with no review behind it',
    )
  })

  it('reports a version move as one CLOSURE_VERSION_CHANGED and not as an add plus a remove', () => {
    // The two readings ask for different work. An upgrade of something already
    // shipping is reviewed against a changelog; a package arriving is reviewed
    // against whether it belongs here at all. Collapsing them would send the
    // reader to the wrong question.
    const findings = compare(measured(['a@2.0.0']), goodBaseline())
    assert.equal(findings.length, 1)
    assert.equal(findings[0].rule, 'CLOSURE_VERSION_CHANGED')
    assert.equal(
      findings[0].message,
      'w: a@1.0.0 in the baseline now ships as a@2.0.0, so deployed bytes changed under a pin that was reviewed',
    )
  })

  it('still reports an add and a remove separately when a second version joins the first', () => {
    // a@1.0.0 stays, a@2.0.0 arrives alongside it. That is not a move: both
    // versions ship, which is a different fact from one replacing the other.
    const findings = compare(measured(['a@1.0.0', 'a@2.0.0']), goodBaseline())
    assert.equal(findings.length, 1)
    assert.equal(findings[0].rule, 'CLOSURE_ADDED')
    assert.match(findings[0].message, /a@2\.0\.0 is in the production closure/)
  })

  it('reports a baseline that over-states what ships as CLOSURE_REMOVED', () => {
    const findings = compare(measured([]), goodBaseline())
    assert.equal(findings.length, 1)
    assert.equal(findings[0].rule, 'CLOSURE_REMOVED')
    assert.equal(
      findings[0].message,
      'w: a@1.0.0 is in the baseline and no longer in the production closure, so the baseline over-states what ships',
    )
  })

  it('reports a lockfile nothing pins, with the size of the surface nobody reviewed', () => {
    const findings = compare({ other: { members: ['x@1.0.0', 'y@2.0.0'] } }, goodBaseline())
    const unpinned = findings.find((x) => x.rule === 'WORKSPACE_UNPINNED')
    assert.equal(
      unpinned.message,
      'other: a committed package-lock.json with 2 package(s) in its production closure and no entry in the baseline, so nothing reviews what it ships',
    )
  })

  it('does not also report every member of an unpinned workspace, which would bury the one finding that matters', () => {
    const findings = compare({ other: { members: ['x@1.0.0', 'y@2.0.0'] } }, goodBaseline())
    assert.deepEqual(findings.map((x) => x.rule).sort(), ['BASELINE_ORPHANED', 'WORKSPACE_UNPINNED'])
  })

  it('reports a pin for a workspace that is gone as BASELINE_ORPHANED', () => {
    const findings = compare({}, goodBaseline())
    assert.equal(findings.length, 1)
    assert.equal(findings[0].rule, 'BASELINE_ORPHANED')
    assert.equal(
      findings[0].message,
      'w: the baseline pins a production closure for a directory with no committed package-lock.json, so that pin stands for nothing',
    )
  })
})

describe('verdict', () => {
  it('ALL_PINNED at exit 0, naming the file the pin lives in', () => {
    const v = verdict([], SEEN)
    assert.equal(v.exitCode, 0)
    assert.equal(v.cause, 'ALL_PINNED')
    assert.equal(v.derivedFrom, 'findings')
    assert.equal(v.stream, 'out')
    assert.equal(
      v.line,
      `Production closure: ${COUNTED}, every member pinned in the committed baseline at tools/registers/prod-closure.json. Exit 0.`,
    )
  })

  it('SURFACE_GREW at exit 1 when anything newly ships, with the growth count beside the total', () => {
    const v = verdict([f('CLOSURE_ADDED'), f('CLOSURE_REMOVED')], SEEN)
    assert.equal(v.exitCode, 1)
    assert.equal(v.cause, 'SURFACE_GREW')
    // stdout, matching its sibling `tools/registers/check-ids.mjs`, whose
    // findings verdicts also go to stdout while its ground verdicts go to
    // stderr. `verdict-shape.mjs` records that this repository's gates
    // disagree about the stream and deliberately does not normalise them, so
    // the rule followed here is "agree with the gate next to you" and the
    // assertion pins which choice was made rather than which is better.
    assert.equal(v.stream, 'out')
    assert.equal(
      v.line,
      `Production closure: ${COUNTED}, and 1 of 2 finding(s) above are bytes newly reaching a ` +
        'deployed surface that the committed baseline does not pin. Every lockfile read here is ' +
        'tracked, so this is a diff a reviewer can see. Review the dependency change, then re-pin ' +
        'with `node tools/registers/check-closure.mjs --write`. Exit 1.',
    )
  })

  it('counts a version change as growth, because new bytes reach the surface either way', () => {
    assert.equal(verdict([f('CLOSURE_VERSION_CHANGED')], SEEN).cause, 'SURFACE_GREW')
  })

  it('REGISTER_STALE at exit 1 when nothing new ships, which is different news and a different repair', () => {
    const v = verdict([f('CLOSURE_REMOVED'), f('BASELINE_ORPHANED', 'gone')], SEEN)
    assert.equal(v.exitCode, 1)
    assert.equal(v.cause, 'REGISTER_STALE')
    assert.equal(
      v.line,
      `Production closure: ${COUNTED}, nothing new shipping, and 2 finding(s) above where the ` +
        'committed baseline no longer describes the committed lockfiles. Re-pin with ' +
        '`node tools/registers/check-closure.mjs --write` and review the diff. Exit 1.',
    )
  })

  it('treats an unpinned workspace as staleness and not as growth', () => {
    // Nothing moved. A lockfile exists that the baseline never described, so
    // the register is behind the repository rather than the repository having
    // grown a surface. Calling it growth would make the first run of this gate
    // on a new workspace read as a security event.
    assert.equal(verdict([f('WORKSPACE_UNPINNED', 'other')], SEEN).cause, 'REGISTER_STALE')
  })

  it('reports zeroes rather than inventing a census when seen is empty', () => {
    const v = verdict([], {})
    assert.match(v.line, /^Production closure: 0 package\(s\) in the production closure of 0 workspace\(s\), with 0 development-only entry\(ies\) excluded/)
  })
})

describe('the ground branches', () => {
  it('baselineUnusable takes its cause from the fault and declares the detail as quoted', () => {
    const v = baselineUnusable({ code: 'BASELINE_EMPTY', detail: 'no entries' })
    assert.equal(v.exitCode, 2)
    assert.equal(v.cause, 'BASELINE_EMPTY')
    assert.equal(v.derivedFrom, 'ground')
    assert.equal(v.position, 'before')
    assert.deepEqual(v.quoted, ['no entries'])
    assert.equal(
      v.line,
      'Production closure: the committed baseline is unusable, so nothing was checked (BASELINE_EMPTY: no entries). Exit 2.',
    )
  })

  it('lockUnreadable is a separate branch, because --write repairs the baseline and cannot repair a lockfile', () => {
    const v = lockUnreadable({ code: 'LOCKFILE_VERSION_UNSUPPORTED', detail: 'w is lockfileVersion 2' })
    assert.equal(v.exitCode, 2)
    assert.equal(v.cause, 'LOCKFILE_VERSION_UNSUPPORTED')
    assert.equal(
      v.line,
      'Production closure: a committed lockfile could not be read as a scope authority, so no answer was reached (LOCKFILE_VERSION_UNSUPPORTED: w is lockfileVersion 2). Exit 2.',
    )
  })

  it('scopeUnreadable is a third branch, because its repair is the checkout and not a tracked file', () => {
    const v = scopeUnreadable({ code: 'NO_TRACKED_LOCKFILES', detail: 'git ls-files matched none' })
    assert.equal(v.exitCode, 2)
    assert.equal(v.cause, 'NO_TRACKED_LOCKFILES')
    assert.equal(
      v.line,
      'Production closure: the set of committed lockfiles could not be established, so no answer was reached (NO_TRACKED_LOCKFILES: git ls-files matched none). Exit 2.',
    )
  })

  it('no two ground causes share a line, so a reader can tell which condition fired', () => {
    const fault = { code: 'X', detail: 'y' }
    const lines = [baselineUnusable(fault), lockUnreadable(fault), scopeUnreadable(fault)].map((v) => v.line)
    assert.equal(new Set(lines).size, 3)
  })
})

describe('the gate spec', () => {
  it('declares one locus and the pattern really appears in every exit-1 line', () => {
    assert.deepEqual(Object.keys(GATE.loci), ['committed'])
    assert.equal(GATE.findingsLocus, 'committed')
    const pattern = GATE.loci.committed.noun
    assert.match(verdict([f('CLOSURE_ADDED')], SEEN).line, pattern)
    assert.match(verdict([f('CLOSURE_REMOVED')], SEEN).line, pattern)
  })

  it('probes every rule compare can produce, so no finding kind reaches the verdict unexercised', () => {
    const probed = new Set(GATE.probes.flatMap((p) => p.findings.map((x) => x.rule)))
    assert.deepEqual(
      [...probed].sort(),
      ['BASELINE_ORPHANED', 'CLOSURE_ADDED', 'CLOSURE_REMOVED', 'CLOSURE_VERSION_CHANGED', 'WORKSPACE_UNPINNED'],
    )
  })

  it('reaches exactly the three findings causes and no more', () => {
    const causes = new Set(GATE.probes.map((p) => verdict(p.findings, p.seen).cause))
    assert.deepEqual([...causes].sort(), ['ALL_PINNED', 'REGISTER_STALE', 'SURFACE_GREW'])
  })
})

describe('the committed repository', () => {
  const baseline = JSON.parse(readFileSync(join(REPO_ROOT, 'tools', 'registers', 'prod-closure.json'), 'utf8'))

  it('ships a baseline its own validator accepts', () => {
    assert.equal(baselineFault(baseline), null)
  })

  it('pins all three tracked lockfiles, so the gate is not silently checking two of them', () => {
    assert.deepEqual(Object.keys(baseline.workspaces).sort(), ['ursa-major', 'ursa-major/overlay', 'ursa-minor'])
  })

  it('each tracked lockfile validates and its measured closure equals its pin', () => {
    for (const dir of Object.keys(baseline.workspaces)) {
      const lock = JSON.parse(readFileSync(join(REPO_ROOT, dir, 'package-lock.json'), 'utf8'))
      assert.equal(lockFault(lock, `${dir}/package-lock.json`), null, dir)
      const closure = prodClosure(lock)
      assert.deepEqual(closure.members, baseline.workspaces[dir].members, dir)
      assert.equal(closure.members.length, baseline.workspaces[dir].count, dir)
      assert.equal(closure.devOnly, baseline.workspaces[dir].devOnlyEntriesExcluded, dir)
    }
  })

  it('the nine advisory packages of the 2026-10-26 ledger entry are absent from ursa-minor production', () => {
    // The measurement that answers that entry's first step, pinned so it
    // cannot quietly stop being true. Nine package names, taken verbatim from
    // the entry. If any of them enters ursa-minor's production closure, this
    // assertion is the thing that says so, and the advisory question stops
    // being hypothetical.
    const NINE = [
      '@modelcontextprotocol/sdk', '@shadcn/registry', 'body-parser', 'shadcn', 'undici',
      'zod', 'fast-uri', 'hono', 'ip-address',
    ]
    const shipping = baseline.workspaces['ursa-minor'].members.map((m) => m.slice(0, m.lastIndexOf('@')))
    for (const name of NINE) assert.ok(!shipping.includes(name), `${name} is in ursa-minor's production closure`)
  })

  it('records that three of those nine names DO ship elsewhere, which the entry did not measure', () => {
    // Not a defect and not clean either. The entry measured ursa-minor and
    // concluded "development-only"; two of the names it listed as high
    // advisories reach production in a different workspace, at versions
    // outside the advisory ranges it quoted. The versions are asserted because
    // that is the whole reason this is not a finding today, and a bump is
    // exactly what would change it.
    const major = new Map(baseline.workspaces['ursa-major'].members.map((m) => [m.slice(0, m.lastIndexOf('@')), m.slice(m.lastIndexOf('@') + 1)]))
    const overlay = new Map(baseline.workspaces['ursa-major/overlay'].members.map((m) => [m.slice(0, m.lastIndexOf('@')), m.slice(m.lastIndexOf('@') + 1)]))
    assert.equal(major.get('@modelcontextprotocol/sdk'), '1.32.1') // entry quoted "at or below 1.31.0"
    assert.equal(overlay.get('undici'), '6.29.1') //                   entry quoted "7.0.0 to 7.30.0"
    assert.equal(major.get('zod'), '4.6.7') //                         entry quoted "below 4.6.6"
  })
})
