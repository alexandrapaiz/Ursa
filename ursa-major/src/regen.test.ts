// `npm run regen` is a converging command: you run it, do what it says,
// and run it again until it says `clean`. These tests are the whole state
// table it converges through, asserted against the pure function in
// `tools/regen.ts` so no build, git repository or clock is involved.
//
// Why the table is worth a test at all, when the tool is a hundred lines
// of process spawning: the defect it exists for is a *missing
// instruction*, not a wrong computation. PR #387's inherited commit fixed
// `src/lifespan.ts` and shipped `dist/ursa.cjs` holding the previous
// resolver. So the thing that has to hold is that every state names the
// literal next command, and a state that printed a bare status word would
// reintroduce exactly the gap. That is a property of the strings, which
// means it is testable only if the strings are asserted.

import { describe, expect, it } from 'vitest'
import { regenStep, SHORT_DIGEST_LEN } from '../tools/regen'

const REBUILT = 'f497687433163312eb6dfcd1bfd7d90e228504d06a931f9a7e6660af07eb6f32'
const OLDER = 'a6580c3119dcb33a6ac2ae8ec6edcbea16a87bbd1b6b4ee4b02c1aa7ffb0d3a2'

const clean = {
  rebuiltSha256: REBUILT,
  headSha256: REBUILT,
  historyBlocked: null,
  indexDrifted: [] as readonly string[],
}

describe('regenStep, the four states a generated artifact can be in', () => {
  it('a rebuilt bundle that HEAD does not hold yet asks for the commit first', () => {
    const step = regenStep({ ...clean, headSha256: OLDER })
    expect(step.state).toBe('bundle-rebuilt')
    expect(step.runAgain).toBe(true)
    // The two digests, so a reader can tell which way round the staleness
    // is without running another command.
    expect(step.message).toContain(REBUILT.slice(0, SHORT_DIGEST_LEN))
    expect(step.message).toContain(OLDER.slice(0, SHORT_DIGEST_LEN))
    expect(step.message).toContain('npm run regen')
  })

  it('a repository with no committed bundle at all is the same case, said differently', () => {
    const step = regenStep({ ...clean, headSha256: null })
    expect(step.state).toBe('bundle-rebuilt')
    expect(step.message).toContain('HEAD has no committed bundle at that path')
    // Not a digest comparison against null, which would print "undefined".
    expect(step.message).not.toContain('null')
  })

  it('unreadable history leaves the index alone and names the repair', () => {
    const step = regenStep({
      ...clean,
      historyBlocked: 'this is a shallow clone, so the commits the index names are not all present',
    })
    expect(step.state).toBe('index-unverifiable')
    expect(step.runAgain).toBe(true)
    expect(step.message).toContain('tools/ensure-full-clone.sh')
  })

  it('history is only consulted once the bundle matches, so staleness is reported in order', () => {
    // Both wrong at once. The bundle has to be reported, because the index
    // cannot be built correctly until the bundle commit exists, and a
    // message about the index here would send the reader to the wrong step.
    const step = regenStep({ ...clean, headSha256: OLDER, historyBlocked: 'this is a shallow clone' })
    expect(step.state).toBe('bundle-rebuilt')
    expect(step.message).not.toContain('ensure-full-clone')
  })

  it('a rewritten index names both files and does not ask for another pass', () => {
    const step = regenStep({
      ...clean,
      indexDrifted: ['docs/provenance/bundle-digests.json', 'docs/provenance/bundle-digests.md'],
    })
    expect(step.state).toBe('index-rewritten')
    expect(step.runAgain).toBe(false)
    expect(step.message).toContain('docs/provenance/bundle-digests.json')
    expect(step.message).toContain('docs/provenance/bundle-digests.md')
    expect(step.message).toContain('were')
  })

  it('one rewritten index file is said in the singular, because a plural there reads as a second file', () => {
    const step = regenStep({ ...clean, indexDrifted: ['docs/provenance/bundle-digests.md'] })
    expect(step.message).toContain('docs/provenance/bundle-digests.md was')
  })

  it('clean says so, and says what it checked rather than only that it passed', () => {
    const step = regenStep(clean)
    expect(step.state).toBe('clean')
    expect(step.runAgain).toBe(false)
    expect(step.message).toContain('dist/ursa.cjs matches HEAD')
    expect(step.message).toContain('the digest index')
  })

  it('every state names a next command or says there is none', () => {
    const states = [
      regenStep({ ...clean, headSha256: OLDER }),
      regenStep({ ...clean, historyBlocked: 'this is a shallow clone' }),
      regenStep({ ...clean, indexDrifted: ['docs/provenance/bundle-digests.md'] }),
      regenStep(clean),
    ]
    for (const step of states) {
      // A bare status word is the failure mode this tool exists to prevent,
      // so no message is allowed to be one.
      expect(step.message.split(' ').length).toBeGreaterThan(8)
      expect(step.runAgain ? /`npm run regen`/.test(step.message) : true).toBe(true)
    }
  })
})
