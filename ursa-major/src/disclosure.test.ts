// The disclosure boundary. Every claim src/disclosure.ts makes about what
// may cross the device boundary is asserted here against a record built
// by the real resolver, not a hand-written stub, so the raw fields the
// audit searches for are the ones the pipeline actually produces.

import { describe, expect, it } from 'vitest'
import { resolve } from './resolve'
import type { OutcomeRecord } from './types'
import { withheldByDefault, type ConsentRecord } from './consent'
import {
  DOMAIN_BUCKETS,
  K_ANONYMITY_FLOOR,
  MODEL_VOCABULARY,
  aggregate,
  auditBatch,
  domainOf,
  modelIdOf,
  projectForMinor,
  rawStringsOf,
  weekStartOf,
  type DisclosureBatch,
} from './disclosure'

const PROSE_GENERATED = [
  'The quarterly revenue review for Northwind Pharmaceuticals opened with a',
  'frank admission that the Atlanta distribution centre had missed its',
  'service targets for the third consecutive quarter.',
].join(' ')

const PROSE_FINAL = [
  'The quarterly revenue review for Northwind Pharmaceuticals opened with a',
  'frank admission that the Atlanta distribution centre had missed its',
  'service targets for the third consecutive quarter.',
  'Nobody wrote this sentence with a model in the room.',
].join(' ')

const CODE_GENERATED = [
  'export function priceFor(contract) {',
  '  return contract.baseRate * contract.volumeMultiplier',
  '}',
].join('\n')

function record(
  taskId: string,
  generatedAt: string,
  model = 'claude-opus-5',
  files: Array<{ path: string; text: string }> = [
    { path: 'reports/northwind-q3.md', text: PROSE_FINAL },
    { path: 'src/pricing.ts', text: CODE_GENERATED },
  ]
): OutcomeRecord {
  return resolve({
    taskId,
    files,
    conversations: [{
      id: 'conv-1',
      title: 'Northwind Pharmaceuticals quarterly review',
      adapter: 'git',
      model,
      date: generatedAt,
      turns: 2,
      userTurns: 1,
      prompts: [{ step: 1, text: 'Rewrite the Atlanta distribution centre paragraph so it stops sounding defensive.' }],
    }],
    generations: [
      { conversationId: 'conv-1', model, turnIndex: 1, kind: 'write', filePath: 'reports/northwind-q3.md', timestamp: generatedAt, text: PROSE_GENERATED },
      { conversationId: 'conv-1', model, turnIndex: 2, kind: 'write', filePath: 'src/pricing.ts', timestamp: generatedAt, text: CODE_GENERATED },
    ],
    finished: true,
    generatedAt,
  })
}

function granted(over: Partial<ConsentRecord> = {}): ConsentRecord {
  const base = withheldByDefault('2026-10-01T00:00:00.000Z')
  return {
    ...base,
    scopes: { 'minor-aggregate': { state: 'granted', changedAt: '2026-10-01T00:00:00.000Z', history: [] } },
    ...over,
  }
}

describe('domain buckets come from the extension and nothing else', () => {
  it.each([
    ['src/clients/northwind/pricing.ts', 'code/typescript'],
    ['a/b/c.tsx', 'code/typescript'],
    ['scripts/deploy.mjs', 'code/javascript'],
    ['etl/load.py', 'code/python'],
    ['app/globals.css', 'code/web'],
    ['infra/vercel.json', 'code/config'],
    ['db/schema.sql', 'code/sql'],
    ['reports/northwind-q3.md', 'prose/markdown'],
    ['notes.txt', 'prose/text'],
    ['paper.tex', 'prose/latex'],
    ['Makefile', 'other'],
    ['weird.qqq', 'other'],
  ])('%s buckets as %s', (path, bucket) => {
    expect(domainOf(path)).toBe(bucket)
  })

  it('never carries a directory component into the bucket', () => {
    // The identifying part of a path is the directory, so the test that
    // matters is that two paths differing only there are indistinguishable.
    expect(domainOf('src/clients/northwind/pricing.ts')).toBe(domainOf('src/clients/initech/pricing.ts'))
    expect(DOMAIN_BUCKETS).toContain(domainOf('src/clients/northwind/pricing.ts'))
  })

  it('treats a missing path as other rather than throwing', () => {
    expect(domainOf(undefined)).toBe('other')
  })
})

describe('model identifiers are classified into a closed set, never passed through', () => {
  it.each([
    // The shape `pairfinder.ts` actually produces from a real trailer.
    ['Claude <noreply@anthropic.com>', 'claude'],
    ['claude-opus-5', 'claude-opus-5'],
    ['Claude Opus 5 <noreply@anthropic.com>', 'claude'],
    ['claude-haiku-4-5-20251001', 'claude-haiku-4-5'],
    ['gpt-5-codex', 'gpt-5-codex'],
    ['openai-gpt-5', 'gpt-5'],
    ['Cursor Agent', 'cursor'],
  ])('%s classifies as %s', (raw, expected) => {
    expect(modelIdOf(raw)).toBe(expected)
  })

  it('returns a reference to the vocabulary, so no input character can ride along', () => {
    const got = modelIdOf('Claude <someone.private@their-employer.example>')
    expect(got).toBe('claude')
    expect(MODEL_VOCABULARY).toContain(got!)
    expect(got).not.toMatch(/@|private|employer/)
  })

  it('prefers the longest match so version granularity survives', () => {
    expect(modelIdOf('claude-sonnet-5')).toBe('claude-sonnet-5')
    expect(modelIdOf('claude-sonnet-5')).not.toBe('claude')
  })

  it.each([undefined, '', 'Human Owner', 'some-internal-tool-v3'])('yields nothing for %s', (raw) => {
    expect(modelIdOf(raw)).toBeNull()
  })
})

describe('week_start is the ISO week Monday', () => {
  it.each([
    ['2026-10-01T12:00:00.000Z', '2026-09-28'], // a Thursday
    ['2026-09-28T00:00:00.000Z', '2026-09-28'], // the Monday itself
    ['2026-10-04T23:59:59.000Z', '2026-09-28'], // the Sunday that closes it
    ['2026-10-05T00:00:00.000Z', '2026-10-05'], // the next Monday
  ])('%s falls in the week beginning %s', (iso, monday) => {
    expect(weekStartOf(iso)).toBe(monday)
  })

  it('does not throw on an unparseable timestamp', () => {
    expect(weekStartOf('not a date')).toBe('1970-01-01')
  })
})

describe('nothing crosses without consent', () => {
  it('returns no batch at all under the default consent, and says why', () => {
    const r = projectForMinor([record('rec-a', '2026-10-01T12:00:00.000Z')], withheldByDefault())
    expect(r.batch).toBeNull()
    expect(r.withheld).toEqual([{
      kind: 'scope-not-granted',
      scope: 'minor-aggregate',
      detail: 'consent for minor-aggregate reads "withheld"; nothing is disclosable',
    }])
  })

  it('excludes a forgotten record and reports the exclusion', () => {
    const recs = [record('rec-a', '2026-10-01T12:00:00.000Z'), record('rec-b', '2026-10-01T12:00:00.000Z')]
    const consent = granted({
      forgotten: [{
        recordId: 'rec-a',
        forgottenAt: '2026-10-01T09:00:00.000Z',
        removed: { recordFile: true, axiomsDeleted: [], evidenceStripped: 0, sourcesRemoved: 0 },
      }],
    })
    const r = projectForMinor(recs, consent)
    expect(r.withheld.map((w) => w.kind)).toContain('record-forgotten')
    // rec-b alone produces the same rows as rec-b alone would: rec-a added nothing.
    const alone = projectForMinor([recs[1]], granted())
    expect(r.batch!.rows).toEqual(alone.batch!.rows)
  })

  it('withholds a generation whose agent marker matches no model in the vocabulary', () => {
    const bad = record('rec-a', '2026-10-01T12:00:00.000Z', 'northwind-internal-eval-harness')
    const r = projectForMinor([bad], granted())
    expect(r.withheld.map((w) => w.kind)).toEqual(['model-id-rejected'])
    expect(r.batch!.rows).toEqual([])
  })
})

describe('the consented batch is the plan\'s survival_stats table', () => {
  const r = projectForMinor([record('rec-a', '2026-10-01T12:00:00.000Z')], granted())

  it('emits one row per (domain, model, week) with exactly the plan\'s six fields', () => {
    expect(r.batch).not.toBeNull()
    expect(r.batch!.rows).toHaveLength(2)
    for (const row of r.batch!.rows) {
      expect(Object.keys(row).sort()).toEqual([
        'contributorCount', 'domain', 'model', 'sampleGenerations', 'survivalScalar', 'weekStart',
      ])
      expect(row.weekStart).toBe('2026-09-28')
      expect(row.model).toBe('claude-opus-5')
      expect(row.contributorCount).toBe(1)
      expect(row.sampleGenerations).toBe(1)
    }
    expect(r.batch!.rows.map((x) => x.domain)).toEqual(['code/typescript', 'prose/markdown'])
  })

  it('scores survival as survived over generated, rounded to the column\'s 4 decimal places', () => {
    const code = r.batch!.rows.find((x) => x.domain === 'code/typescript')!
    // The code file was kept unchanged, so all of it survived.
    expect(code.survivalScalar).toBe(1)
    const prose = r.batch!.rows.find((x) => x.domain === 'prose/markdown')!
    expect(prose.survivalScalar).toBeGreaterThan(0)
    expect(prose.survivalScalar).toBeLessThanOrEqual(1)
    expect(String(prose.survivalScalar).split('.')[1]?.length ?? 0).toBeLessThanOrEqual(4)
  })

  it('merges two records in the same week into one row per bucket', () => {
    const two = projectForMinor(
      [record('rec-a', '2026-09-29T12:00:00.000Z'), record('rec-b', '2026-10-01T12:00:00.000Z')],
      granted()
    )
    expect(two.batch!.rows).toHaveLength(2)
    expect(two.batch!.rows.every((x) => x.sampleGenerations === 2)).toBe(true)
  })

  it('splits rows across week boundaries', () => {
    const two = projectForMinor(
      [record('rec-a', '2026-09-27T12:00:00.000Z'), record('rec-b', '2026-10-01T12:00:00.000Z')],
      granted()
    )
    expect(new Set(two.batch!.rows.map((x) => x.weekStart))).toEqual(new Set(['2026-09-21', '2026-09-28']))
  })
})

describe('the audit passes on the real projection', () => {
  const recs = [record('rec-a', '2026-10-01T12:00:00.000Z')]
  const batch = projectForMinor(recs, granted()).batch!

  it('finds nothing', () => {
    expect(auditBatch(batch, recs)).toEqual([])
  })

  it('and the record it was built from really does carry the raw text, so the audit had something to find', () => {
    const raw = rawStringsOf(recs[0])
    expect(raw.some((s) => s.includes('Northwind Pharmaceuticals'))).toBe(true)
    expect(raw.some((s) => s.includes('stops sounding defensive'))).toBe(true)
    expect(raw).toContain('reports/northwind-q3.md')
  })
})

describe('the audit catches what it exists to catch', () => {
  const recs = [record('rec-a', '2026-10-01T12:00:00.000Z')]
  const clean = projectForMinor(recs, granted()).batch!

  it('catches a field somebody added later that carries prose', () => {
    const poisoned = JSON.parse(JSON.stringify(clean)) as DisclosureBatch & { note?: string }
    poisoned.note = 'The Atlanta distribution centre had missed its service targets.'
    const findings = auditBatch(poisoned as DisclosureBatch, recs)
    expect(findings.map((f) => f.kind)).toContain('unpermitted-key')
    expect(findings.map((f) => f.kind)).toContain('unpermitted-string')
    expect(findings.map((f) => f.kind)).toContain('raw-text-shingle')
  })

  it('catches a file path smuggled into a row', () => {
    const poisoned = JSON.parse(JSON.stringify(clean)) as DisclosureBatch
    ;(poisoned.rows[0] as unknown as Record<string, unknown>).path = 'reports/northwind-q3.md'
    const kinds = auditBatch(poisoned, recs).map((f) => f.kind)
    expect(kinds).toContain('unpermitted-key')
    expect(kinds).toContain('raw-text-shingle')
  })

  it('closes the hole an earlier version of this gate had', () => {
    // Regression. The first version constrained `model` with
    // /^[A-Za-z0-9][A-Za-z0-9._+ -]{0,63}$/ instead of an enum, and this
    // 62-character sentence satisfies it, so check 1 passed a paragraph.
    // The enum is what fixes it; this asserts the fix, not the symptom.
    const sentence = 'The Atlanta distribution centre missed its service targets.'
    expect(sentence).toMatch(/^[A-Za-z0-9][A-Za-z0-9._+ -]{0,63}$/)
    const poisoned = JSON.parse(JSON.stringify(clean)) as DisclosureBatch
    ;(poisoned.rows[0] as unknown as Record<string, unknown>).model = sentence
    const kinds = auditBatch(poisoned, recs).map((f) => f.kind)
    expect(kinds).toContain('unpermitted-string')
    expect(kinds).toContain('raw-text-shingle')
  })

  it('catches a value assembled inside a field added later, which only check 2 can see', () => {
    // A future field whose value is built rather than referenced. Both
    // checks fire here, and the point of the test is that check 2 fires
    // on the content even where check 1 only objects to the key.
    const poisoned = JSON.parse(JSON.stringify(clean)) as DisclosureBatch
    ;(poisoned.rows[0] as unknown as Record<string, unknown>).sourcePath =
      'reports/' + 'northwind-q3' + '.md'
    const findings = auditBatch(poisoned, recs)
    expect(findings.some((f) => f.kind === 'unpermitted-key' && f.path === 'rows[0].sourcePath')).toBe(true)
    expect(findings.some((f) => f.kind === 'raw-text-shingle')).toBe(true)
  })

  it('catches a whole file dropped in, which is the failure mode that exists today', () => {
    // Before this module, transmitting anything meant transmitting the
    // record. This asserts the audit would have stopped that.
    const findings = auditBatch(recs[0] as unknown as DisclosureBatch, recs)
    expect(findings.length).toBeGreaterThan(5)
    expect(findings.some((f) => f.kind === 'raw-text-shingle')).toBe(true)
  })

  it('does not false-positive when the record\'s own text is this module\'s source code', () => {
    // The regression behind check 2 shingling leaf values rather than the
    // serialized JSON: run ursa over Ursa itself and a generation's text
    // contains the literal key names of the payload.
    const selfHosted = [record(
      'rec-self',
      '2026-10-01T12:00:00.000Z',
      'claude-opus-5',
      [{
        path: 'src/disclosure.ts',
        text: 'export interface SurvivalStatsRow {\n  domain: DomainBucket\n  model: string\n  weekStart: string\n  contributorCount: number\n  survivalScalar: number\n  sampleGenerations: number\n}\n',
      }]
    )]
    const batch = projectForMinor(selfHosted, granted()).batch!
    expect(rawStringsOf(selfHosted[0]).some((s) => s.includes('contributorCount'))).toBe(true)
    expect(auditBatch(batch, selfHosted)).toEqual([])
  })

  it('does not false-positive on a model identifier that also appears in the prose', () => {
    const recs2 = [record('rec-a', '2026-10-01T12:00:00.000Z', 'claude-opus-5')]
    const batch2 = projectForMinor(recs2, granted()).batch!
    expect(batch2.rows[0].model).toBe('claude-opus-5')
    expect(auditBatch(batch2, recs2)).toEqual([])
  })
})

describe('the k-anonymity floor the plan\'s SQL comment names', () => {
  function batchFor(model: string): DisclosureBatch {
    return projectForMinor([record(`rec-${model}`, '2026-10-01T12:00:00.000Z')], granted()).batch!
  }
  const contributor = (i: number) => batchFor(`c${i}`)

  it('withholds a row backed by fewer than five contributors', () => {
    const r = aggregate([1, 2, 3, 4].map(contributor))
    expect(K_ANONYMITY_FLOOR).toBe(5)
    expect(r.rows).toEqual([])
    expect(r.withheldRows).toBe(2) // one per (domain, model, week) bucket
  })

  it('emits the row at exactly five, with the contributor count summed', () => {
    const r = aggregate([1, 2, 3, 4, 5].map(contributor))
    expect(r.withheldRows).toBe(0)
    expect(r.rows).toHaveLength(2)
    for (const row of r.rows) {
      expect(row.contributorCount).toBe(5)
      expect(row.sampleGenerations).toBe(5)
    }
  })

  it('weights the merged scalar by sample size, not by a flat mean', () => {
    const one: DisclosureBatch = {
      schemaVersion: '0.1.0', scope: 'minor-aggregate',
      rows: [{ domain: 'prose/markdown', model: 'claude', weekStart: '2026-09-28', contributorCount: 1, survivalScalar: 1, sampleGenerations: 9 }],
    }
    const other: DisclosureBatch = {
      schemaVersion: '0.1.0', scope: 'minor-aggregate',
      rows: [{ domain: 'prose/markdown', model: 'claude', weekStart: '2026-09-28', contributorCount: 1, survivalScalar: 0, sampleGenerations: 1 }],
    }
    const r = aggregate([one, other, other, other, other], 5)
    // Five contributors: one with 9 generations all surviving, four with
    // 1 generation each surviving nothing. A flat mean of the five scalars
    // would read 0.2. Weighted by sample size it is 9/13.
    expect(r.rows[0].survivalScalar).toBe(0.6923)
    expect(r.rows[0].sampleGenerations).toBe(13)
  })

  it('the aggregate output still passes the audit', () => {
    const r = aggregate([1, 2, 3, 4, 5].map(contributor))
    const recs = [1, 2, 3, 4, 5].map((i) => record(`rec-c${i}`, '2026-10-01T12:00:00.000Z'))
    expect(auditBatch({ schemaVersion: '0.1.0', scope: 'minor-aggregate', rows: r.rows }, recs)).toEqual([])
  })
})
