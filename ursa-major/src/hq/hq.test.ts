// What get_briefing owes an agent, tested against the synthetic store in
// fixtures.ts. The claims under test are the ones the HQ's usefulness
// rests on: relevance beats popularity, revoked means never served, the
// same question twice gives the same answer, and every line printed
// carries its receipt.

import { describe, expect, it } from 'vitest'
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { buildBriefing, measureBriefing, MIN_RELEVANCE, renderBriefing } from './briefing'
import { buildQuery, score, words } from './retrieval'
import { RECORDS, TUNING } from './fixtures'
import { loadRecords, loadTuning, main } from './cli'
import { writeFixtureStore } from './seed'

const NOW = '2026-09-26T12:00:00.000Z'
const brief = (input: Parameters<typeof buildBriefing>[2]) => buildBriefing(TUNING, RECORDS, input, NOW)

describe('retrieval', () => {
  it('splits camelCase and drops words shorter than three characters', () => {
    expect(words('src/app/pageHeader.tsx')).toEqual(['src', 'app', 'page', 'header', 'tsx'])
  })

  it('scores an exact path above a same-name path in another directory', () => {
    const query = buildQuery(undefined, ['src/app/page.tsx'])
    const exact = score(query, '', ['src/app/page.tsx'], '')
    const sameName = score(query, '', ['docs/page.tsx'], '')
    expect(exact.filesExact).toEqual(['src/app/page.tsx'])
    expect(sameName.filesByName).toEqual(['src/app/page.tsx'])
    expect(exact.score).toBeGreaterThan(sameName.score)
  })

  it('reads a request with neither domain nor files as empty', () => {
    expect(buildQuery(undefined, []).empty).toBe(true)
    expect(buildQuery('motion').empty).toBe(false)
  })
})

describe('buildBriefing', () => {
  it('ranks the rule learned on the requested file above the more popular one', () => {
    const b = brief({ files: ['src/app/page.tsx'] })
    expect(b.rules[0].axiomId).toBe('ax-001')
    // ax-003 has five pieces of evidence to ax-001's two and still loses,
    // because it was never learned on this file.
    const motion = b.rules.find((r) => r.axiomId === 'ax-001')!
    expect(motion.why.filesExact).toEqual(['src/app/page.tsx'])
    expect(b.rules.map((r) => r.axiomId)).not.toContain('ax-003')
  })

  it('never serves a revoked axiom, under any request', () => {
    for (const input of [{}, { domain: 'copy' }, { files: ['src/content/about.md'] }]) {
      const b = buildBriefing(TUNING, RECORDS, input, NOW)
      expect(b.rules.map((r) => r.axiomId)).not.toContain('ax-004')
    }
    expect(brief({}).coverage.axiomsConsidered).toBe(3)
  })

  it('returns the whole active store, evidence-ordered, when nothing is asked', () => {
    const b = brief({})
    expect(b.coverage.unfiltered).toBe(true)
    expect(b.rules.map((r) => r.axiomId)).toEqual(['ax-003', 'ax-001', 'ax-002'])
    expect(b.nearestCases).toHaveLength(3)
  })

  it('matches a domain exactly and partially, and says which it was', () => {
    expect(brief({ domain: 'motion' }).rules[0].why.domain).toBe('exact')
    expect(brief({ domain: 'motion-timing' }).rules[0].why.domain).toBe('partial')
    expect(brief({ domain: 'motion' }).rules[0].axiomId).toBe('ax-001')
  })

  it("joins a case to the owner's verbatim complaint and the mechanism that closed it", () => {
    const b = brief({ files: ['src/app/page.tsx'] })
    const first = b.nearestCases[0]
    expect(first.loopId).toBe('loop-a')
    expect(first.complaint).toBe('it looks like the page is crashing')
    expect(first.mechanism).toBe('a 64px translateY entrance on the hero, fired after paint')
    expect(first.recurrences).toBe(3)
    expect(first.discoveredSpec).toContain('8px')
  })

  it('serves guardrails with the rule they belong to, quote intact', () => {
    const b = brief({ files: ['src/app/page.tsx'] })
    expect(b.guardrails).toHaveLength(1)
    expect(b.guardrails[0]).toMatchObject({
      axiomId: 'ax-001',
      kind: 'defensive-guardrail',
      quote: 'only touch the hero, do not restyle the rest of the page',
      steps: [27],
    })
    // A copy request has no motion rule in scope, so no motion guardrail.
    expect(brief({ domain: 'copy' }).guardrails).toHaveLength(0)
  })

  it('drops a unit that matches only on an incidental word', () => {
    // 'about page copy oversells' shares exactly the word 'page' with a
    // request about src/app/page.tsx, and shares no file and no domain.
    const b = brief({ domain: 'motion', files: ['src/app/page.tsx'] })
    const incidental = b.nearestCases.find((c) => c.loopId === 'loop-c')
    expect(incidental).toBeUndefined()
    expect(MIN_RELEVANCE).toBe(2)
    // The same case is served when the request has nothing to be
    // irrelevant to.
    expect(brief({}).nearestCases.map((c) => c.loopId)).toContain('loop-c')
  })

  it('honours the rule and case ceilings', () => {
    const b = brief({ maxRules: 1, maxCases: 1 })
    expect(b.rules).toHaveLength(1)
    expect(b.nearestCases).toHaveLength(1)
    expect(b.coverage.axiomsConsidered).toBe(3)
    expect(b.coverage.loopsConsidered).toBe(3)
  })

  it('returns an empty briefing, not an error, when the store is empty', () => {
    const b = buildBriefing(
      { schemaVersion: '0.1.0', owner: 'local', updatedAt: NOW, sources: [], axioms: [] },
      [],
      { files: ['src/app/page.tsx'] },
      NOW
    )
    expect(b.rules).toEqual([])
    expect(b.nearestCases).toEqual([])
    expect(b.coverage.axiomsConsidered).toBe(0)
    expect(renderBriefing(b)).toContain('The HQ has learned nothing about this yet')
  })

  it('is deterministic: the same store and request give byte-identical output', () => {
    const a = buildBriefing(TUNING, RECORDS, { files: ['src/app/page.tsx'] }, NOW)
    const b = buildBriefing(TUNING, RECORDS, { files: ['src/app/page.tsx'] }, NOW)
    expect(JSON.stringify(a)).toBe(JSON.stringify(b))
  })
})

describe('renderBriefing', () => {
  it('leads with the evidence-not-orders discipline and prints every receipt', () => {
    const text = renderBriefing(brief({ files: ['src/app/page.tsx'], domain: 'motion' }))
    expect(text).toContain('Evidence, not orders.')
    expect(text).toContain('**Prefer: keep entrance motion under 8px of travel**')
    expect(text).toContain('ax-001, domain motion, mixed, seen 2x')
    expect(text).toContain('Her words: "it looks like the page is crashing"')
    expect(text).toContain('Surfaced because: exact domain match; learned on src/app/page.tsx')
    expect(text).toContain('From ax-001 ("keep entrance motion under 8px of travel"), rec-site-001 step 27:')
    expect(text).toContain('Her words: "only touch the hero, do not restyle the rest of the page"')
    expect(text).toContain('Ranking: lexical-v0.')
  })

  it('says nothing about size on a briefing that has not been measured', () => {
    // Absent means not measured. A zero or a placeholder here would be a
    // claim, and the renderer is not in a position to make one.
    const b = brief({})
    expect(b.coverage.renderedChars).toBeUndefined()
    expect(renderBriefing(b)).not.toContain('Size:')
  })
})

describe('measureBriefing', () => {
  // The claim under test is the whole point of the field: the number the
  // briefing reports is the length of the briefing that reports it. Any
  // implementation that measures the render without its own size
  // sentence passes an off-by-its-own-digits figure, and these two
  // assertions are what catch that.
  it('reports a size equal to the length of the markdown that prints it', () => {
    const { briefing, markdown } = measureBriefing(brief({ files: ['src/app/page.tsx'], domain: 'motion' }))
    expect(briefing.coverage.renderedChars).toBe(markdown.length)
    expect(markdown).toContain(`Size: ${markdown.length} characters, counting this sentence.`)
  })

  it('holds the same identity on the empty briefing, which is a different order of magnitude', () => {
    const { briefing, markdown } = measureBriefing(brief({ files: ['nothing/here.txt'] }))
    expect(briefing.rules).toEqual([])
    expect(briefing.coverage.renderedChars).toBe(markdown.length)
    expect(markdown).toContain(`Size: ${markdown.length} characters`)
  })

  it('re-rendering the measured briefing reproduces the measured string exactly', () => {
    // The pair is only true together, so this pins that the briefing
    // returned is the one the number belongs to and not a sibling.
    const { briefing, markdown } = measureBriefing(brief({ domain: 'motion' }))
    expect(renderBriefing(briefing)).toBe(markdown)
  })

  it('is idempotent: measuring an already-measured briefing gives the same number', () => {
    const once = measureBriefing(brief({ domain: 'motion' }))
    const twice = measureBriefing(once.briefing)
    expect(twice.briefing.coverage.renderedChars).toBe(once.briefing.coverage.renderedChars)
    expect(twice.markdown).toBe(once.markdown)
  })

  it('grows the reported size when a bigger request is made, so the figure tracks the cost', () => {
    const narrow = measureBriefing(brief({ domain: 'motion' })).briefing.coverage.renderedChars!
    const everything = measureBriefing(brief({})).briefing.coverage.renderedChars!
    expect(everything).toBeGreaterThan(narrow)
  })
})

describe('the brief CLI', () => {
  it('reads .ursa/tuning.json and .ursa/records/ and prints JSON on --json', async () => {
    const root = mkdtempSync(join(tmpdir(), 'ursa-hq-'))
    expect(writeFixtureStore(root)).toBe(join(root, '.ursa'))

    expect(loadTuning(join(root, '.ursa', 'tuning.json')).axioms).toHaveLength(4)
    expect(loadRecords(join(root, '.ursa', 'records'))).toHaveLength(2)

    const printed: string[] = []
    const realLog = console.log
    console.log = (line: string) => printed.push(line)
    let code: number
    try {
      code = await main(['brief', root, '--files', 'src/app/page.tsx', '--json'])
    } finally {
      console.log = realLog
    }

    expect(code).toBe(0)
    const briefing = JSON.parse(printed.join('\n'))
    expect(briefing.rules[0].axiomId).toBe('ax-001')
    expect(briefing.request.files).toEqual(['src/app/page.tsx'])
    // --json carries the measurement too, so a caller scripting against
    // the CLI can read the cost without rendering the markdown itself.
    expect(briefing.coverage.renderedChars).toBeGreaterThan(0)
  })

  it('treats a missing store as an empty one rather than crashing', () => {
    const root = mkdtempSync(join(tmpdir(), 'ursa-hq-bare-'))
    expect(loadTuning(join(root, '.ursa', 'tuning.json')).axioms).toEqual([])
    expect(loadRecords(join(root, '.ursa', 'records'))).toEqual([])
  })

  it('refuses an unknown command with a usage line and a non-zero code', async () => {
    const errs: string[] = []
    const realError = console.error
    console.error = (line: string) => errs.push(line)
    let code: number
    try {
      code = await main(['explain', '.'])
    } finally {
      console.error = realError
    }
    expect(code).toBe(2)
    expect(errs.join('\n')).toContain('ursa brief <projectPath>')
  })
})
