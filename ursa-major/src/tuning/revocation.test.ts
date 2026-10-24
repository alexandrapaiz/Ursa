// The test `docs/design/consent-and-erasure.md` §6c already promised and
// did not have: a re-distill after a revocation cannot revive the
// statement even when the model does not declare the match.
//
// Why this file exists separately from `tuning.test.ts`: every case here
// is about what happens when the model's own judgment is wrong or
// adversarial, and the guarantee under test is a consent guarantee rather
// than a merge behaviour. The old suite covers the path where the model
// cooperates (`matchesExisting: 'ax-001'`), which was never the exposed
// path.

import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import type { OutcomeRecord } from '../types'
import { tuningLines } from '../bridge/index'
import { renderTuningBlock } from './export'
import { emptyTuning, mergeDistill } from './merge'
import {
  THETA_REVOKED,
  allRevocationTwins,
  contentTokens,
  findRevocationBlock,
  revocationSimilarity,
  revocationTwins,
} from './revocation'
import { runConsentCommand, type CliIo } from '../consent.cli'
import { forgetRecordInTuning, releaseBlocked, revokeAxiom } from './revoke'
import type { DistillOutput, DistilledAxiom, TuningRecord } from './types'

const record = (id: string): OutcomeRecord =>
  ({
    schemaVersion: '0.1.0',
    task: { id, finished: true, generatedAt: '2026-10-23T00:00:00Z' },
    files: [],
    conversations: [],
    generations: [],
    stats: {},
    signals: {},
  }) as unknown as OutcomeRecord

const axiom = (statement: string, over: Partial<DistilledAxiom> = {}): DistilledAxiom => ({
  statement,
  domain: 'motion',
  polarity: 'avoid',
  basis: 'tacit',
  matchesExisting: null,
  contradicts: [],
  evidence: [{ kind: 'correction-loop', ref: 'A', steps: [1, 2] }],
  ...over,
})

const out = (...axioms: DistilledAxiom[]): DistillOutput => ({ axioms })

/** A record with one axiom the user then revoked. */
function withRevocation(statement = 'keep entrance motion under 8px of travel'): TuningRecord {
  const t1 = mergeDistill(emptyTuning('t'), out(axiom(statement)), record('r1'), 'sonnet', 'T1')
  return {
    ...t1,
    axioms: t1.axioms.map((a) => ({ ...a, status: 'revoked' as const })),
  }
}

describe('the revocation guarantee, when the model does not declare the match', () => {
  it('does not revive a revoked axiom restated as a new statement', () => {
    const revoked = withRevocation()
    // The model rewords the revoked rule and declares it new. This is the
    // exact input that used to walk straight into the create branch.
    const t2 = mergeDistill(
      revoked,
      out(axiom('entrance motion should travel less than 8px', { matchesExisting: null })),
      record('r2'),
      'sonnet',
      'T2'
    )

    // No second axiom was built, and the tombstone gained nothing.
    expect(t2.axioms).toHaveLength(1)
    expect(t2.axioms[0].status).toBe('revoked')
    expect(t2.axioms[0].evidenceCount).toBe(1)

    // The statement is held where the user can read it, and nowhere else.
    expect(t2.blockedByRevocation).toHaveLength(1)
    const held = t2.blockedByRevocation![0]
    expect(held.statement).toBe('entrance motion should travel less than 8px')
    expect(held.blockedBy).toBe('ax-001')
    expect(held.score).toBeGreaterThanOrEqual(THETA_REVOKED)
    expect(held.occurrences).toBe(1)
    expect(held.evidence[0].recordId).toBe('r2')
  })

  it('keeps the held statement out of the exported block and the overlay', () => {
    const t2 = mergeDistill(
      withRevocation(),
      out(axiom('entrance motion should travel less than 8px')),
      record('r2'),
      'sonnet',
      'T2'
    )
    const md = renderTuningBlock(t2)
    expect(md).not.toContain('travel less than 8px')
    expect(md).not.toContain('8px of travel')

    const dir = mkdtempSync(join(tmpdir(), 'ursa-revocation-'))
    const ursa = join(dir, '.ursa')
    mkdirSync(ursa, { recursive: true })
    writeFileSync(join(ursa, 'tuning.json'), JSON.stringify(t2, null, 2))
    expect(tuningLines(dir)).toHaveLength(0)
  })

  it('does not consume an axiom id for a statement it blocks', () => {
    const t2 = mergeDistill(
      withRevocation(),
      out(
        axiom('entrance motion should travel less than 8px'),
        axiom('body text holds 7:1 contrast on dark sections', { domain: 'color' })
      ),
      record('r2'),
      'sonnet',
      'T2'
    )
    // The one statement that got through is ax-002, not ax-003: a blocked
    // statement leaves no gap in the id sequence for a reader to wonder at.
    expect(t2.axioms.map((a) => a.id)).toEqual(['ax-001', 'ax-002'])
    expect(t2.axioms[1].statement).toBe('body text holds 7:1 contrast on dark sections')
  })

  it('accrues a repeated block onto one entry instead of a list of copies', () => {
    let t = withRevocation()
    for (const id of ['r2', 'r3', 'r4']) {
      t = mergeDistill(t, out(axiom('entrance motion should travel less than 8px')), record(id), 'sonnet', 'T')
    }
    expect(t.blockedByRevocation).toHaveLength(1)
    expect(t.blockedByRevocation![0].occurrences).toBe(3)
    expect(t.blockedByRevocation![0].evidence.map((e) => e.recordId)).toEqual(['r2', 'r3', 'r4'])
  })

  it('still lets an unrelated new axiom through', () => {
    const t2 = mergeDistill(
      withRevocation(),
      out(axiom('every claim names its mechanism', { domain: 'copy' })),
      record('r2'),
      'sonnet',
      'T2'
    )
    expect(t2.axioms).toHaveLength(2)
    expect(t2.blockedByRevocation).toHaveLength(0)
  })

  it('blocks a restatement regardless of the polarity the model attached', () => {
    const t2 = mergeDistill(
      withRevocation(),
      out(axiom('entrance motion should travel less than 8px', { polarity: 'prefer' })),
      record('r2'),
      'sonnet',
      'T2'
    )
    expect(t2.axioms).toHaveLength(1)
    expect(t2.blockedByRevocation![0].polarity).toBe('prefer')
  })

  it('leaves the declared-match path exactly as it was', () => {
    const revoked = withRevocation()
    const t2 = mergeDistill(
      revoked,
      out(axiom('keep entrance motion under 8px of travel', { matchesExisting: 'ax-001' })),
      record('r2'),
      'sonnet',
      'T2'
    )
    // Matched-and-revoked is dropped outright, as before. It is not parked,
    // because the model told the truth and there is nothing for the user to
    // review: the statement is already in her record as a tombstone.
    expect(t2.axioms).toHaveLength(1)
    expect(t2.axioms[0].evidenceCount).toBe(1)
    expect(t2.blockedByRevocation).toHaveLength(0)
  })
})

describe('the user outranks the gate', () => {
  it('releases a held statement into an axiom she owns, and stops blocking it', () => {
    const dir = mkdtempSync(join(tmpdir(), 'ursa-release-'))
    const tPath = join(dir, 'tuning.json')
    const t2 = mergeDistill(
      withRevocation(),
      out(axiom('entrance motion should travel less than 8px')),
      record('r2'),
      'sonnet',
      'T2'
    )
    writeFileSync(tPath, JSON.stringify(t2, null, 2))

    const { tuning, released } = releaseBlocked(tPath, 1, 'T3')
    expect(released.id).toBe('ax-002')
    expect(released.status).toBe('user-edited')
    expect(released.statement).toBe('entrance motion should travel less than 8px')
    expect(released.evidenceCount).toBe(1)
    expect(tuning.blockedByRevocation).toHaveLength(0)
    // It is on disk, not just in the return value.
    expect(JSON.parse(readFileSync(tPath, 'utf8')).axioms).toHaveLength(2)

    // And the gate does not undo her decision on the next pass.
    const t4 = mergeDistill(
      tuning,
      out(axiom('entrance motion should travel less than 8px')),
      record('r3'),
      'sonnet',
      'T4'
    )
    expect(t4.blockedByRevocation).toHaveLength(0)
    expect(t4.axioms).toHaveLength(3)
  })

  it('refuses an index that is not there rather than releasing the wrong thing', () => {
    const dir = mkdtempSync(join(tmpdir(), 'ursa-release-bad-'))
    const tPath = join(dir, 'tuning.json')
    writeFileSync(tPath, JSON.stringify(withRevocation(), null, 2))
    expect(() => releaseBlocked(tPath, 1)).toThrow(/No blocked statement 1/)
  })

  it('revokeAxiom and the gate compose: revoke, restate, blocked', () => {
    const dir = mkdtempSync(join(tmpdir(), 'ursa-compose-'))
    const tPath = join(dir, 'tuning.json')
    const t1 = mergeDistill(
      emptyTuning('t'),
      out(axiom('keep entrance motion under 8px of travel')),
      record('r1'),
      'sonnet',
      'T1'
    )
    writeFileSync(tPath, JSON.stringify(t1, null, 2))
    const revoked = revokeAxiom(tPath, 'ax-001', 'T2')
    const t3 = mergeDistill(
      revoked,
      out(axiom('entrance motion should travel less than 8px')),
      record('r2'),
      'sonnet',
      'T3'
    )
    expect(t3.axioms.filter((a) => a.status !== 'revoked')).toHaveLength(0)
    expect(t3.blockedByRevocation).toHaveLength(1)
  })
})

describe('erasure reaches held statements too', () => {
  it('drops a held statement whose only evidence was the forgotten record', () => {
    const t2 = mergeDistill(
      withRevocation(),
      out(axiom('entrance motion should travel less than 8px')),
      record('r2'),
      'sonnet',
      'T2'
    )
    const result = forgetRecordInTuning(t2, 'r2', 'T3')
    expect(result.blockedDropped).toBe(1)
    expect(result.tuning.blockedByRevocation).toHaveLength(0)
    expect(JSON.stringify(result.tuning)).not.toContain('travel less than 8px')
  })

  it('keeps a held statement that still rests on a record she has not erased', () => {
    let t = withRevocation()
    for (const id of ['r2', 'r3']) {
      t = mergeDistill(t, out(axiom('entrance motion should travel less than 8px')), record(id), 'sonnet', 'T')
    }
    const result = forgetRecordInTuning(t, 'r2', 'T4')
    expect(result.blockedDropped).toBe(0)
    expect(result.tuning.blockedByRevocation![0].evidence.map((e) => e.recordId)).toEqual(['r3'])
  })
})

describe('the scorer, on the statements this repository actually contains', () => {
  // docs/design/revocation-store-gate.md §4 is this table in prose. If a
  // threshold change breaks this test, that document is wrong too.
  const DISTINCT = [
    'No explanatory labels on visual elements',
    'keep entrance motion under 8px of travel',
    'body text holds 7:1 contrast on dark sections',
    'every claim names its mechanism',
    'open every section with a one-line summary',
    'Ship the smallest thing that can be looked at, then correct it on the render',
    'Rich copy',
    'Sparse copy',
  ]
  const PARAPHRASES: Array<[string, string]> = [
    ['No explanatory labels on visual elements', 'Avoid explanatory labels on visual elements'],
    ['No explanatory labels on visual elements', 'Do not put explanatory labels on visual elements'],
    ['No explanatory labels on visual elements', 'Visual elements should carry no explanatory labels'],
    ['No explanatory labels on visual elements', 'Never add a label explaining a visual element'],
    ['keep entrance motion under 8px of travel', 'entrance motion should travel less than 8px'],
    ['keep entrance motion under 8px of travel', 'limit entrance animation travel to 8px'],
    ['every claim names its mechanism', 'each claim must name its mechanism'],
    ['every claim names its mechanism', 'name the mechanism behind every claim'],
    ['open every section with a one-line summary', 'begin each section with a single-line summary'],
    ['body text holds 7:1 contrast on dark sections', 'dark sections need 7:1 contrast on body text'],
  ]

  it('scores every paraphrase pair at or above the threshold', () => {
    for (const [a, b] of PARAPHRASES) {
      expect(revocationSimilarity(a, b), `${a} || ${b}`).toBeGreaterThanOrEqual(THETA_REVOKED)
    }
  })

  it('scores every pair of distinct statements below the threshold', () => {
    for (let i = 0; i < DISTINCT.length; i++) {
      for (let j = i + 1; j < DISTINCT.length; j++) {
        expect(revocationSimilarity(DISTINCT[i], DISTINCT[j]), `${DISTINCT[i]} || ${DISTINCT[j]}`)
          .toBeLessThan(THETA_REVOKED)
      }
    }
  })

  // The one measured over-block, asserted rather than hidden. "no entrance
  // motion at all" is a different and stronger rule than "keep entrance
  // motion under 8px of travel", and the gate holds it anyway because every
  // content word it has is in the revoked statement. That is the behaviour
  // this design chose: a rule about the subject of a revocation goes past
  // the user's eyes before it goes to a model, and one command releases it.
  it('holds a stronger rule about the subject of the revocation, by design', () => {
    expect(revocationSimilarity('keep entrance motion under 8px of travel', 'no entrance motion at all')).toBe(1)
    const t2 = mergeDistill(
      withRevocation(),
      out(axiom('no entrance motion at all')),
      record('r2'),
      'sonnet',
      'T2'
    )
    expect(t2.blockedByRevocation).toHaveLength(1)
  })

  it('is symmetric, and scores an empty-content statement at zero', () => {
    const a = 'No explanatory labels on visual elements'
    const b = 'Avoid explanatory labels on visual elements'
    expect(revocationSimilarity(a, b)).toBe(revocationSimilarity(b, a))
    // Nothing but stopwords: "do not ever" has no content tokens at all,
    // and a score of 0 means it is never blocked by resemblance to
    // anything. It cannot be a revival of a rule because it states none.
    expect(contentTokens('do not ever')).toEqual([])
    expect(revocationSimilarity('do not ever', a)).toBe(0)
  })

  it('ignores a retyped dash and a changed case, the way span identity does', () => {
    expect(
      revocationSimilarity('keep entrance motion under 8px — of travel', 'KEEP ENTRANCE MOTION UNDER 8PX - OF TRAVEL')
    ).toBe(1)
  })

  it('returns null from the gate when there is nothing to compare against', () => {
    expect(findRevocationBlock('anything at all', [])).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// The backward-looking half. The gate above runs inside a distillation
// pass, so these cases are about the pairs that were already axioms when
// it shipped, which is every pair in every record that exists today.

/** Capture a CLI run's two streams the way `consent.e2e.test.ts` does. */
function capture(): { io: CliIo; lines: string[]; errs: string[] } {
  const lines: string[] = []
  const errs: string[] = []
  return { io: { out: (l) => lines.push(l), err: (l) => errs.push(l) }, lines, errs }
}

/** A project root carrying one tuning record and nothing else. */
function projectWith(tuning: TuningRecord): string {
  const dir = mkdtempSync(join(tmpdir(), 'ursa-twins-'))
  mkdirSync(join(dir, '.ursa'), { recursive: true })
  writeFileSync(join(dir, '.ursa', 'tuning.json'), JSON.stringify(tuning, null, 2) + '\n')
  return dir
}

/**
 * The pair the old create path produced, built by the old create path.
 *
 * Nothing is hand-assembled here on purpose. Two distillation passes
 * emit the same rule in different words, both declare `matchesExisting:
 * null`, and no revocation exists yet so the gate has no tombstone to
 * score against and cannot fire. Two active axioms is the result, and
 * that is the population this report is about rather than a shape
 * invented for the test.
 */
function twinned(): TuningRecord {
  const t1 = mergeDistill(
    emptyTuning('t'),
    out(axiom('keep entrance motion under 8px of travel')),
    record('r1'),
    'sonnet',
    'T1'
  )
  const t2 = mergeDistill(
    t1,
    out(axiom('entrance motion should travel less than 8px', { matchesExisting: null })),
    record('r2'),
    'sonnet',
    'T2'
  )
  return t2
}

describe('the pairs the gate cannot see, because they were axioms before it existed', () => {
  it('is a real population: the old create path builds the pair with no revocation in sight', () => {
    const t = twinned()
    expect(t.axioms).toHaveLength(2)
    expect(t.axioms.map((a) => a.id)).toEqual(['ax-001', 'ax-002'])
    expect(t.axioms.every((a) => a.status === 'active')).toBe(true)
    // Nothing was blocked, because the gate scores against tombstones
    // and there are none yet. This is the hole, stated as an assertion.
    expect(t.blockedByRevocation).toHaveLength(0)
    // And the two statements are close enough that the gate WOULD have
    // blocked the second one if the first had been revoked first.
    expect(revocationSimilarity(t.axioms[0].statement, t.axioms[1].statement))
      .toBeGreaterThanOrEqual(THETA_REVOKED)
  })

  it('names the live twin of a revoked axiom, closest first', () => {
    const t = { ...twinned() }
    t.axioms = t.axioms.map((a) => (a.id === 'ax-001' ? { ...a, status: 'revoked' as const } : a))
    const twins = revocationTwins(t, 'ax-001')
    expect(twins).toHaveLength(1)
    expect(twins[0].id).toBe('ax-002')
    expect(twins[0].statement).toBe('entrance motion should travel less than 8px')
    expect(twins[0].score).toBeGreaterThanOrEqual(THETA_REVOKED)
    expect(twins[0].status).toBe('active')
  })

  it('does not report the revoked axiom as a twin of itself, nor another tombstone', () => {
    const t = twinned()
    const bothRevoked = {
      ...t,
      axioms: t.axioms.map((a) => ({ ...a, status: 'revoked' as const })),
    }
    // ax-001 scores 1.0 against itself and above the threshold against
    // ax-002, and neither is a live disclosure, so the report is empty.
    expect(revocationTwins(bothRevoked, 'ax-001')).toEqual([])
    expect(allRevocationTwins(bothRevoked)).toEqual([])
  })

  it('reports nothing when the revocation did fully take effect', () => {
    const t = mergeDistill(
      emptyTuning('t'),
      out(axiom('keep entrance motion under 8px of travel'), axiom('write dates as 7 Mar 2026, never 03/07/26')),
      record('r1'),
      'sonnet',
      'T1'
    )
    const revoked = {
      ...t,
      axioms: t.axioms.map((a) => (a.id === 'ax-001' ? { ...a, status: 'revoked' as const } : a)),
    }
    expect(revocationTwins(revoked, 'ax-001')).toEqual([])
    expect(allRevocationTwins(revoked)).toEqual([])
  })

  it('throws on an unknown id rather than answering "nothing else says this"', () => {
    expect(() => revocationTwins(twinned(), 'ax-404')).toThrow(/No axiom ax-404/)
    expect(() => revocationTwins(twinned(), 'ax-404')).toThrow(/ax-001, ax-002/)
  })

  it('says when the twin is one the user put there herself', () => {
    const t = twinned()
    const mixed = {
      ...t,
      axioms: t.axioms.map((a) =>
        a.id === 'ax-001' ? { ...a, status: 'revoked' as const } : { ...a, status: 'user-edited' as const }
      ),
    }
    expect(revocationTwins(mixed, 'ax-001')[0].status).toBe('user-edited')
  })

  it('orders several twins by closeness, and breaks a tie by id', () => {
    // Three live candidates against the revoked `keep entrance motion
    // under 8px of travel`, whose content tokens are {entrance, motion,
    // 8px, travel}. The scores are asserted below rather than left
    // implicit, because the ordering case is only meaningful if two of
    // them really do tie and one really is further away:
    //   ax-002  entrance, motion, travel, slowly      3 of 4 both ways, 0.75
    //   ax-003  entrance, motion, travel, 8px         every token, 1.0
    //   ax-004  entrance, motion                      wholly contained, 1.0
    const t = mergeDistill(
      emptyTuning('t'),
      out(
        axiom('keep entrance motion under 8px of travel'),
        axiom('entrance motion should travel slowly'),
        axiom('entrance motion should travel less than 8px'),
        axiom('no entrance motion at all')
      ),
      record('r1'),
      'sonnet',
      'T1'
    )
    const revoked = {
      ...t,
      axioms: t.axioms.map((a) => (a.id === 'ax-001' ? { ...a, status: 'revoked' as const } : a)),
    }
    const twins = revocationTwins(revoked, 'ax-001')
    expect(twins.map((x) => [x.id, x.score])).toEqual([
      ['ax-003', 1],
      ['ax-004', 1],
      ['ax-002', 0.75],
    ])
  })

  it('lists one entry per tombstone that still has a live twin, and omits the rest', () => {
    const t = mergeDistill(
      emptyTuning('t'),
      out(
        axiom('keep entrance motion under 8px of travel'),
        axiom('entrance motion should travel less than 8px'),
        axiom('write dates as 7 Mar 2026, never 03/07/26')
      ),
      record('r1'),
      'sonnet',
      'T1'
    )
    const revoked = {
      ...t,
      axioms: t.axioms.map((a) =>
        a.id === 'ax-001' || a.id === 'ax-003' ? { ...a, status: 'revoked' as const } : a
      ),
    }
    const pairs = allRevocationTwins(revoked)
    expect(pairs).toHaveLength(1)
    expect(pairs[0].revoked.id).toBe('ax-001')
    expect(pairs[0].twins.map((x) => x.id)).toEqual(['ax-002'])
  })
})

describe('what the user is told, and what is not done for her', () => {
  it('names the twin when she revokes one of a pair, and changes nothing about it', async () => {
    const root = projectWith(twinned())
    const tPath = join(root, '.ursa', 'tuning.json')
    const before = JSON.parse(readFileSync(tPath, 'utf8')) as TuningRecord
    const { io, lines } = capture()

    expect(await runConsentCommand(['revoke-axiom', root, '--axiom', 'ax-001'], io)).toBe(0)

    const printed = lines.join('\n')
    expect(printed).toContain('Revoked ax-001')
    expect(printed).toContain('ax-002')
    expect(printed).toContain('entrance motion should travel less than 8px')
    expect(printed).toContain('--axiom ax-002')

    // The assertion the ledger entry asked for: the twin is named in the
    // output and NOT touched in the file. Revoking a second axiom she
    // did not name would be this product deciding what she meant.
    const after = JSON.parse(readFileSync(tPath, 'utf8')) as TuningRecord
    const twinBefore = before.axioms.find((a) => a.id === 'ax-002')!
    const twinAfter = after.axioms.find((a) => a.id === 'ax-002')!
    expect(twinAfter).toEqual(twinBefore)
    expect(twinAfter.status).toBe('active')
    expect(after.axioms.find((a) => a.id === 'ax-001')!.status).toBe('revoked')
  })

  it('says nothing extra when the revocation took full effect', async () => {
    const t = mergeDistill(
      emptyTuning('t'),
      out(axiom('keep entrance motion under 8px of travel'), axiom('write dates as 7 Mar 2026, never 03/07/26')),
      record('r1'),
      'sonnet',
      'T1'
    )
    const { io, lines } = capture()
    expect(await runConsentCommand(['revoke-axiom', projectWith(t), '--axiom', 'ax-001'], io)).toBe(0)
    const printed = lines.join('\n')
    expect(printed).toContain('Revoked ax-001')
    expect(printed).not.toContain('nearly the same thing')
    expect(printed).not.toContain('ax-002')
  })

  it('tells her about a pair that was already on disk, without her revoking anything again', async () => {
    // The population the entry names: she revoked ax-001 at some point
    // before this report existed, the twin kept exporting, and nothing
    // ever said so. `consent show` is where she finds out.
    const t = twinned()
    const root = projectWith({
      ...t,
      axioms: t.axioms.map((a) => (a.id === 'ax-001' ? { ...a, status: 'revoked' as const } : a)),
    })
    const { io, lines } = capture()

    expect(await runConsentCommand(['show', root], io)).toBe(0)

    const printed = lines.join('\n')
    expect(printed).toContain('still being said by an inference you hold')
    expect(printed).toContain('ax-001, which you revoked')
    expect(printed).toContain('ax-002')
    expect(printed).toContain('Nothing above was changed for you.')
  })

  it('leaves `consent show` silent about twins when every revocation took effect', async () => {
    const t = mergeDistill(
      emptyTuning('t'),
      out(axiom('keep entrance motion under 8px of travel'), axiom('write dates as 7 Mar 2026, never 03/07/26')),
      record('r1'),
      'sonnet',
      'T1'
    )
    const root = projectWith({
      ...t,
      axioms: t.axioms.map((a) => (a.id === 'ax-001' ? { ...a, status: 'revoked' as const } : a)),
    })
    const { io, lines } = capture()
    expect(await runConsentCommand(['show', root], io)).toBe(0)
    expect(lines.join('\n')).not.toContain('still being said')
  })
})
