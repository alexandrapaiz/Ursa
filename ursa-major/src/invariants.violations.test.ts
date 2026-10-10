// `fixtures/violations/` — fifteen committed records, each of which the gate
// must refuse, read off disk exactly as a buyer or a CLI would read them.
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
import { BOUND_CODES, checkRecord, type InvariantCode } from './invariants'
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
  it('passes all fifteen bounds, so each fixture below fails because of its own edit', () => {
    expect(checkRecord(load('base.json'))).toEqual([])
  })

  it('carries the three structures a resolved chat record does not, so no bound is vacuous here', () => {
    const base = load('base.json')
    // Each of these is read by exactly one bound, and each is absent from
    // both fixtures already committed to this repository, which is why those
    // two cannot serve as the base: SIGNAL_QUOTE_GROUNDED,
    // DESCENT_CHECKED_UNIFORMLY and EXCLUSION_NOT_CLASSIFIED are all
    // vacuously true on a record that has none of them.
    expect(base.signals!.oneShotCorrections.length).toBeGreaterThan(0)
    expect(base.signals!.oneShotCorrections[0].quotes.length).toBeGreaterThan(0)
    expect(base.files.flatMap((f) => f.spans).filter((s) => s.descent).length).toBeGreaterThan(0)
    expect(base.exclusions).toHaveLength(1)
  })
})

describe('each committed record fires exactly the bounds its note names', () => {
  it('found fifteen fixtures beside the base', () => {
    expect(SLUGS).toHaveLength(15)
  })

  for (const slug of SLUGS) {
    it(`${slug}.json`, () => {
      const want = expectedCodes(slug)
      const found = checkRecord(load(`${slug}.json`))

      // Equality, not containment. A counterexample that fires three
      // unrelated bounds tells a reader nothing about the one it is named
      // for, and two of the fifteen fixtures only exist in the shape they do
      // because this assertion refused the first version of them.
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
  it('fires every one of the declared bounds across the fifteen fixtures', () => {
    const fired = new Set(SLUGS.flatMap((s) => checkRecord(load(`${s}.json`)).map((v) => v.code)))
    // The whole point of the directory. A sixteenth bound added to
    // `src/invariants.ts` with no record that breaks it fails this line,
    // which is the only mechanism in the repository that would notice.
    expect([...fired].sort()).toEqual([...BOUND_CODES].sort())
  })

  it('names each fixture after a bound it actually fires', () => {
    for (const slug of SLUGS) {
      const codes = checkRecord(load(`${slug}.json`)).map((v) => v.code)
      const fromSlug = slug.replace(/-/g, '_').toUpperCase()
      expect(codes, `${slug}.json fires ${codes.join(', ')}`).toContain(fromSlug)
    }
  })

  it('records which bounds cannot be violated alone, as the fixtures found them', () => {
    // Two of the fifteen are backstops: they are implied by their
    // neighbours, so no record can break them in isolation. Asserted here,
    // and explained in each fixture's own note, because the fact is a
    // property of the bound set and a future edit to `src/invariants.ts`
    // could make either one independently reachable — at which point this
    // test fails and the note that says otherwise gets corrected.
    expect(expectedCodes('gen-claim-bounded')).toEqual(['CLAIM_IN_GENERATION', 'GEN_CLAIM_BOUNDED'])
    expect(expectedCodes('pct-denominators-ordered')).toEqual(['RATES_MATCH_FIELDS', 'PCT_DENOMINATORS_ORDERED'])
    const single = SLUGS.filter((s) => expectedCodes(s).length === 1)
    expect(single).toHaveLength(13)
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
    // 15 fixtures, two of which fire two bounds each, plus the clean base.
    expect(violations).toBe(17)
    expect(lines.join('\n')).toContain('17 violations')
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
