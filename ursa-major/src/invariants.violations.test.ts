// `fixtures/violations/` — twenty-three committed records, each of which the
// gate must refuse, read off disk exactly as a buyer or a CLI would read them.
//
// Why this file exists rather than more cases in `src/invariants.test.ts`.
// That file breaks a passing record in memory and asserts the gate's output
// CONTAINS the expected code. Both halves of that are weaker than they look:
//
//   1. `toContain` passes when the mutation fires five bounds instead of one,
//      so it cannot tell a sharp counterexample from a record that is broken
//      in every direction at once. The assertion here is equality on the
//      whole code list, which is what turned up the two bounds below that
//      cannot be violated on their own.
//   2. An in-memory mutation is not a record. Nothing in this repository
//      could hand a broken record to anything that reads records off disk,
//      which is why `src/ci/gate-wiring.test.ts` had to replace
//      `checkRecord` with `vi.mock` to see the gate fire at all. These
//      fixtures are files, so `runGate` and `gateRecords` can be tested
//      against them with no mock of this project's own code.
//
// Ledger: "The record self-check can only be tested by replacing it, because
// no fixture is allowed to be wrong" (docs/ideas.md, 2026-10-10).

import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { gateRecords } from './launch'
import { BOUND_CODES, checkRecord, currentGateIdentity, type InvariantCode } from './invariants'
import { runGate } from './invariants.cli'
import type { OutcomeRecord } from './types'

const DIR = join('fixtures', 'violations')

const load = (name: string): OutcomeRecord =>
  JSON.parse(readFileSync(join(DIR, name), 'utf8')) as OutcomeRecord

/** every fixture in the directory except the clean base, in filename order */
const SLUGS = readdirSync(DIR)
  .filter((f) => f.endsWith('.json') && f !== 'base.json')
  .map((f) => f.replace(/\.json$/, ''))
  .sort()

/**
 * The codes a fixture's note says the gate must emit, parsed out of the
 * note's own `Expected codes:` line rather than duplicated in this file. The
 * note is what a reviewer reads; if the expectation lived here instead, a
 * note could go stale without failing anything.
 */
function expectedCodes(slug: string): InvariantCode[] {
  const note = readFileSync(join(DIR, `${slug}.md`), 'utf8')
  const line = note.split('\n').find((l) => l.startsWith('Expected codes:'))
  expect(line, `${slug}.md has no "Expected codes:" line`).toBeDefined()
  return [...line!.matchAll(/`([A-Z_]+)`/g)].map((m) => m[1] as InvariantCode)
}

describe('the base record every counterexample is one edit away from', () => {
  it('passes all eighteen bounds, so each fixture below fails because of its own edit', () => {
    expect(checkRecord(load('base.json'))).toEqual([])
  })

  it('carries the six structures a resolved chat record does not, so no bound is vacuous here', () => {
    const base = load('base.json')
    // Each of these is read by exactly one bound, and each is absent from
    // both fixtures already committed to this repository, which is why those
    // two cannot serve as the base: SIGNAL_QUOTE_GROUNDED,
    // DESCENT_CHECKED_UNIFORMLY, EXCLUSION_NOT_CLASSIFIED,
    // RESOLVER_IDENTIFIED and RIVAL_NOT_AFTER_FINAL are all vacuously true
    // on a record that has none of them.
    expect(base.signals!.oneShotCorrections.length).toBeGreaterThan(0)
    expect(base.signals!.oneShotCorrections[0].quotes.length).toBeGreaterThan(0)
    expect(base.files.flatMap((f) => f.spans).filter((s) => s.descent).length).toBeGreaterThan(0)
    expect(base.exclusions).toHaveLength(1)
    // The fourth, added 2026-10-13 with the bound that reads it. Absence is
    // legal under RESOLVER_IDENTIFIED, so a base record with no identity on
    // it would make that bound vacuous here while the suite still reported
    // sixteen bounds covered, which is the one shape this directory exists
    // to rule out.
    expect(base.task.resolvedBy).toEqual({ basis: 'git_commit', commit: '19455a3', dirty: false })
    // The fifth, added 2026-10-15 with RIVAL_NOT_AFTER_FINAL. `rival.date`
    // is optional, so a base whose verdicts are all `corroborated` passes
    // that bound by having nothing to order — the same vacuity
    // `task.resolvedBy` above was added to close. Asserted as the whole
    // verdict rather than as "some span has a date", because the bound's
    // three fixtures are each one field of this object away from it.
    expect(base.files.flatMap((f) => f.spans).map((s) => s.descent)).toContainEqual({
      basis: 'rival',
      sha: 'deadbee',
      subject: 'A branch alive while the person was working',
      relation: 'sibling',
      date: '2026-10-09T17:00:00-06:00',
    })
    // The sixth, added 2026-10-16 with GATE_IDENTIFIED. Equality against the
    // LIVE bound set rather than against a literal, which is the only
    // assertion in this file that is not about the committed bytes alone,
    // and it is here on purpose.
    //
    // GATE_IDENTIFIED's shape clauses fire on any well-formed value, so a
    // pinned `gatedBy` would make this bound non-vacuous on the base and
    // still leave its one clause with teeth unreachable: that clause only
    // runs when the record's digest equals the CHECKING resolver's, so a
    // digest from nowhere is a digest the comparison skips. Requiring the
    // live value is what keeps `gate-identified.json` a counterexample to
    // the clause it is named for rather than to a shape check.
    //
    // The cost, stated so the failure is readable when it comes: the digest
    // covers every bound's statement TEXT (see `currentGateIdentity()` in
    // src/invariants.ts), so rewording any bound fails this line. The fix
    // is `npm run fixtures:violations`, and the reason it is worth failing
    // for is that the alternative is a directory which claims to document a
    // bound set it no longer matches.
    expect(
      base.task.gatedBy,
      'base.json was gated by a different bound set than this suite is running; run `npm run fixtures:violations`',
    ).toEqual(currentGateIdentity())
  })
})

describe('each committed record fires exactly the bounds its note names', () => {
  it('found twenty-three fixtures beside the base', () => {
    expect(SLUGS).toHaveLength(23)
  })

  for (const slug of SLUGS) {
    it(`${slug}.json`, () => {
      const want = expectedCodes(slug)
      const found = checkRecord(load(`${slug}.json`))

      // Equality, not containment. A counterexample that fires three
      // unrelated bounds tells a reader nothing about the one it is named
      // for, and two of the twenty-two fixtures only exist in the shape they
      // do because this assertion refused the first version of them.
      expect(found.map((v) => v.code)).toEqual(want)

      // The note quotes the gate. Every `observed` string the gate produced
      // has to still appear in the note verbatim, so a fixture whose numbers
      // move leaves a note that no longer matches it and fails here rather
      // than misleading the next reader.
      const note = readFileSync(join(DIR, `${slug}.md`), 'utf8')
      for (const v of found) {
        expect(note, `${slug}.md no longer quotes what the gate observed`).toContain(v.observed)
        expect(note).toContain(v.where)
      }
    })
  }
})

describe('the directory covers the gate rather than a corner of it', () => {
  it('fires every one of the declared bounds across the twenty-three fixtures', () => {
    const fired = new Set(SLUGS.flatMap((s) => checkRecord(load(`${s}.json`)).map((v) => v.code)))
    // The whole point of the directory. A nineteenth bound added to
    // `src/invariants.ts` with no record that breaks it fails this line,
    // which is the only mechanism in the repository that would notice. It
    // has now noticed three times: RESOLVER_IDENTIFIED arrived on 2026-10-13
    // and this line is what required `resolver-identified.json` to arrive
    // with it, RIVAL_NOT_AFTER_FINAL arrived on 2026-10-15 and failed here
    // before its three fixtures were written, and GATE_IDENTIFIED arrived on
    // 2026-10-16 the same way.
    expect([...fired].sort()).toEqual([...BOUND_CODES].sort())
  })

  it('names each fixture after a bound it actually fires', () => {
    for (const slug of SLUGS) {
      const codes = checkRecord(load(`${slug}.json`)).map((v) => v.code)
      // A slug is a bound's own name in kebab case, optionally followed by
      // a qualifier naming WHICH CLAUSE of that bound it breaks. The
      // qualifier arrived on 2026-10-14 with
      // `descent-checked-uniformly-verbatim`: DESCENT_CHECKED_UNIFORMLY
      // gained a third clause that day, and a bound with several
      // independent failure modes needs a committed record for each one,
      // which a strict one-fixture-per-code rule forbade. So the longest
      // declared code that the slug starts with is the one it must fire,
      // and a slug matching no code at all still fails this line.
      const fromSlug = [...BOUND_CODES]
        .filter((c) => `${slug.replace(/-/g, '_').toUpperCase()}_`.startsWith(`${c}_`))
        .sort((a, b) => b.length - a.length)[0]
      expect(fromSlug, `${slug}.json is named after no declared bound`).toBeDefined()
      expect(codes, `${slug}.json fires ${codes.join(', ')}`).toContain(fromSlug)
    }
  })

  it('records which bounds cannot be violated alone, as the fixtures found them', () => {
    // Two of the eighteen are backstops: they are implied by their
    // neighbours, so no record can break them in isolation. Asserted here,
    // and explained in each fixture's own note, because the fact is a
    // property of the bound set and a future edit to `src/invariants.ts`
    // could make either one independently reachable — at which point this
    // test fails and the note that says otherwise gets corrected.
    //
    // CLAIM_NOT_WIDER is the other direction of the same fact and arrived on
    // 2026-10-13. It is reachable alone, and `claim-not-wider.json` is where
    // it is reached alone. What changed is that strengthening it from a
    // width comparison to a byte comparison made it fire alongside two
    // fixtures aimed at other bounds, because both of those edits leave a
    // verbatim span crediting characters the generation does not hold. That
    // is coverage rather than noise, so the companion lists name it.
    expect(expectedCodes('gen-claim-bounded')).toEqual(['CLAIM_IN_GENERATION', 'CLAIM_NOT_WIDER', 'GEN_CLAIM_BOUNDED'])
    expect(expectedCodes('final-spans-in-file')).toEqual(['FINAL_SPANS_IN_FILE', 'CLAIM_NOT_WIDER'])
    expect(expectedCodes('pct-denominators-ordered')).toEqual(['RATES_MATCH_FIELDS', 'PCT_DENOMINATORS_ORDERED'])
    // The fourth companion list, and the only one that is not a backstop
    // being implied by its neighbour. It arrived on 2026-10-15 with
    // EXCLUSION_NOT_CLASSIFIED's time clause: `task.generatedAt` is the
    // single horizon that both the base record's dated `sibling` rival
    // verdict and its dated `sibling` exclusion are ordered against, so one
    // unreadable clock leaves both unchecked and both bounds say so. The
    // two losses are different — an unchecked span-level descent claim and
    // an unchecked whole-file removal from every figure — which is why this
    // is coverage rather than a fixture that fires too much.
    expect(expectedCodes('rival-not-after-final-unreadable-horizon'))
      .toEqual(['RIVAL_NOT_AFTER_FINAL', 'EXCLUSION_NOT_CLASSIFIED'])
    const single = SLUGS.filter((s) => expectedCodes(s).length === 1)
    expect(single).toHaveLength(19)
  })
})

describe('the gate reaches these records through the two surfaces that read records', () => {
  it('through the CLI, off disk, with no mock of this project\'s own code', () => {
    // `runGate` on a directory is what `npx tsx src/invariants.cli.ts
    // <project>/.ursa/records` does, and until this directory existed there
    // was no input on which its non-zero path could be exercised against a
    // committed file. The temp-file case in `src/invariants.test.ts` writes
    // one at test time, which proves the plumbing and leaves nothing a
    // reviewer can read.
    const { violations, lines } = runGate(DIR)
    // 23 fixtures, plus the clean base. Three fire two bounds each and one
    // fires three, which is 28 violations: `final-spans-in-file` and
    // `gen-claim-bounded` each gained CLAIM_NOT_WIDER on 2026-10-13, when
    // that bound started checking the byte-identity its own sentence had
    // always stated instead of only the two extents' lengths,
    // `descent-checked-uniformly-verbatim` arrived on 2026-10-14 with that
    // bound's third clause, the three `rival-not-after-final*` fixtures
    // arrived on 2026-10-15 with the seventeenth bound, one per independent
    // failure mode, and the two `exclusion-not-classified-*` fixtures
    // arrived later the same day with that bound's own time clause — which
    // also turned `rival-not-after-final-unreadable-horizon` into a
    // two-bound fixture, because the unreadable clock it breaks is the one
    // both levels order against, and `gate-identified` arrived on
    // 2026-10-16 with the eighteenth bound and fires it alone. Each
    // fixture's `.md` says which bounds it fires and why, and the
    // per-fixture assertion above is what holds this total honest.
    expect(violations).toBe(28)
    expect(lines.join('\n')).toContain('28 violations')
    expect(lines.join('\n')).toContain('OK — every stated bound holds')
  })

  it('through `gateRecords`, the shared edge both launches run', () => {
    // `src/launch.ts` is the one definition of the self-check that `ursa
    // run` and `ursa ci` both call. Before these fixtures the only way to
    // watch it fail was to replace `checkRecord` underneath it.
    const broken = load('gen-survived-bounded.json')
    const gate = gateRecords([load('base.json'), broken])
    expect(gate.violations.map((v) => v.code)).toEqual(['GEN_SURVIVED_BOUNDED'])
    expect(gate.report).toContain('1 record invariant violated')
    expect(gate.report).toContain('this run is not reporting success')
    // Both sides of the number, which is this module's rule for a message.
    expect(gate.report).toContain(gate.violations[0].observed)
  })

  it('passes `gateRecords` on the base alone, so the report above is the fixture and not the gate', () => {
    const gate = gateRecords([load('base.json')])
    expect(gate.violations).toEqual([])
    expect(gate.report).toBe('')
  })
})
