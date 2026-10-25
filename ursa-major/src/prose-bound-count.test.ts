// The bound count written as an English word, wherever this project writes
// it, checked against the count derived from the bounds themselves.
//
// WHY THIS FILE EXISTS. `BOUND_COUNT` in `src/invariants.ts` is derived
// (`Object.keys(BOUNDS).length`) precisely because the written word went
// stale twice without anybody noticing, and its own docstring records the
// cost: `README.md` and three design documents said "thirteen" on
// 2026-10-10, when `EXCLUSION_NOT_CLASSIFIED` had been the fifteenth bound
// for four days. Deriving the constant fixed every place that could read a
// constant. It fixed nothing in prose, because a sentence cannot import a
// module, and prose is where the stale number was in the first place.
//
// So the defect the derivation was introduced to close is still open in the
// surface a reader actually reads. This file closes it by checking the prose
// against the constant instead of asking a human to remember both.
//
// THE EVIDENCE THAT THIS IS NOT HYPOTHETICAL. At the time this file was
// written `BOUND_COUNT` was 18, and
// `skills/adding-a-bound-to-the-record-gate/SKILL.md` said "seventeen
// bounds" in two places while the `TRIGGER-TEST.md` beside it said
// "eighteen". That skill is the instruction a seat follows to add a bound,
// so the document most responsible for the count was the one carrying it
// wrong. `skills/` is promoted by the reviewer panel and not writable by
// this seat (`prompts/engineer-agent.md`, Boundaries), so that instance is
// filed in `docs/ideas.md` rather than fixed here, and this gate's scope
// stops at the surfaces this seat may edit.
//
// WHY TWO ASSERTIONS AND NOT ONE. They fail at opposite moments, and either
// alone is a gate that passes while the defect is present.
//
//   1. THE REGISTRY (`CLAIMS` below) fails when the count CHANGES. Each
//      entry is an exact one-line phrase with the current count's word form
//      interpolated into it. Bump `BOUNDS` to nineteen and every phrase
//      re-renders as "nineteen ...", so each site whose prose still says
//      "eighteen" fails by name and the failure message is the string to
//      edit. This is what no amount of deriving a constant could do.
//
//   2. THE SWEEP fails when a claim is UNREGISTERED. A registry is a list
//      maintained by hand, so it is the same kind of object as the stale
//      word it polices, and a registry that quietly stops covering a file is
//      the obvious way for this gate to rot. The sweep therefore requires
//      that EVERY whole-word occurrence of the current count's word form in
//      a live surface is either inside a registered phrase or declared in
//      `NOT_A_BOUND_COUNT` with a reason.
//
// WHY THAT PAIR IS ACTUALLY SOUND, stated as the induction it is, because
// "two checks" is not an argument on its own. Assertion 2 guarantees that
// TODAY there is no mention of the current count that the registry does not
// know about. Assertion 1 guarantees that when the count moves, every
// mention the registry knows about fails. Since 2 holds at every green
// commit, the set the registry knows about is the complete set at every
// green commit, and so 1 fails at every site when the count moves. The
// induction is only as good as its base case, which is why assertion 2 runs
// on every commit rather than once.
//
// THE LIMIT, stated rather than left to be discovered. The sweep searches
// for the word form of the CURRENT count. Prose that states the count as a
// bare numeral ("18 bounds"), as an ordinal ("the eighteenth bound", which
// is a permanent fact about one bound and correctly never moves), or in a
// language other than the word list below, is invisible to it. The other
// derived number this file checks, the violation-fixture record count, is
// covered by the registry only: there is no sweep for it, so a new sentence
// counting fixtures can go unregistered. Both are deliberate scope cuts and
// neither is fixed by a cleverer regex; see the ledger entry filed with this
// file for the proposed next slice.
//
// WHY A WORD LIST AND NOT A NUMBER-TO-WORDS LIBRARY. The range that matters
// is one to thirty-nine. A dependency for that is a dependency to audit, to
// pin and to explain, and `package.json` is deliberately short. The list
// below fails loudly (`word()` throws) rather than silently returning
// something unmatchable if the count ever leaves the range, which is the
// behaviour a gate wants.

import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { BOUND_COUNT } from './invariants'

/**
 * How many committed records sit in `fixtures/violations/`, read off disk
 * for the reason `BOUND_COUNT` is derived: the README states this number
 * too, and a number stated in prose and maintained by hand is the subject of
 * this whole file. `base.json` is excluded because it is the clean record
 * every counterexample is one edit away from, not a counterexample itself,
 * which is the same filter `src/invariants.violations.test.ts` applies.
 */
const FIXTURE_RECORD_COUNT = readdirSync(join('fixtures', 'violations')).filter(
  (f) => f.endsWith('.json') && f !== 'base.json',
).length

/** one to thirty-nine, which is the whole range this project's prose uses */
const ONES = [
  'zero',
  'one',
  'two',
  'three',
  'four',
  'five',
  'six',
  'seven',
  'eight',
  'nine',
  'ten',
  'eleven',
  'twelve',
  'thirteen',
  'fourteen',
  'fifteen',
  'sixteen',
  'seventeen',
  'eighteen',
  'nineteen',
]
const TENS: Record<number, string> = { 2: 'twenty', 3: 'thirty' }

/**
 * The English word for `n`, hyphenated the way this repository writes it
 * ("twenty-three", not "twenty three").
 *
 * Throws rather than returning a fallback. A gate that cannot express the
 * number it is checking must stop the suite, because the alternative is a
 * phrase containing `undefined` that matches nothing and a registry
 * assertion that fails for a reason no reader would guess.
 */
function word(n: number): string {
  if (n < 20) {
    const w = ONES[n]
    if (!w) throw new Error(`no word for ${n}`)
    return w
  }
  const tens = TENS[Math.floor(n / 10)]
  if (!tens) throw new Error(`no word for ${n}; extend ONES/TENS`)
  const rest = n % 10
  return rest === 0 ? tens : `${tens}-${ONES[rest]}`
}

/**
 * Every file this gate polices, relative to `ursa-major/` which is where
 * vitest runs.
 *
 * WHAT IS IN. The README, which is the surface a reader outside this project
 * actually reads, and every TypeScript file under `src/` and `tools/`, which
 * is where a comment can assert a count beside the code that disproves it.
 *
 * WHAT IS OUT, and why, because an unstated exclusion is how a gate comes to
 * mean less than it appears to. Design documents under `docs/design/` are
 * dated records of a decision at a time, and twenty-six of their bound-count
 * mentions are correct AS OF WRITING ("fifteen bounds" in
 * `violation-fixtures.md`, written when there were fifteen). Deciding
 * whether a dated document should be updated in place or left as a record is
 * a documentation policy this seat does not own, so those files are named in
 * the ledger instead of swept here. `skills/` is out because this seat may
 * not write there at all.
 *
 * THIS FILE IS ALSO OUT, which is the one exclusion worth arguing for rather
 * than asserting. Its own text mentions the count six times, and not one of
 * them is this project claiming how many bounds it has: they are the word
 * list `word()` reads from, the header's worked example of how a failure
 * reads, and the reason the bundle-digest exemption exists. Sweeping them
 * would mean registering the gate's vocabulary as claims about the bound
 * set, which inverts what the registry means. The cost of the exclusion is
 * real and bounded: a stale count written into THIS file is invisible to
 * the sweep. What keeps that from mattering is that nothing here states the
 * count — `word(BOUND_COUNT)` computes it on every run — so there is no
 * number in this file for a bump to make stale.
 */
const LIVE_SURFACES = [
  '../README.md',
  ...readdirSync('src', { recursive: true, encoding: 'utf8' })
    .filter((f) => f.endsWith('.ts'))
    .filter((f) => f !== 'prose-bound-count.test.ts')
    .map((f) => join('src', f)),
  ...readdirSync('tools', { recursive: true, encoding: 'utf8' })
    .filter((f) => f.endsWith('.ts'))
    .map((f) => join('tools', f)),
]

/**
 * Every place this project states a derived count as an English word.
 *
 * `phrase` is a function of the counts so that the expectation is computed
 * from `BOUNDS` and from the fixture directory on every run, never typed. It
 * must render to a string that appears on ONE line of the file: these are
 * prose comments wrapped at about 76 columns, and a phrase that straddles a
 * line break would have to match the comment prefix of the next line too,
 * which is a brittleness this gate does not need. Where a sentence wraps,
 * the registered phrase is the fragment on the line carrying the number.
 *
 * `why` says what the sentence claims, because that is what decides whether
 * a future reader should update the number or the allowlist.
 */
type Claim = {
  file: string
  phrase: (bounds: string, fixtures: string) => string
  why: string
}

const CLAIMS: Claim[] = [
  // --- README.md, the surface a reader outside the project reads ---
  {
    file: '../README.md',
    phrase: (b) => `the bound count went from ten to ${b}`,
    why: 'the range the bound set has travelled, whose upper end is the count today, so it moves even though "ten" does not',
  },
  {
    file: '../README.md',
    phrase: (b) => `${b} bounds a record must satisfy`,
    why: 'the headline statement of what src/invariants.ts does, in the file-by-file table',
  },
  {
    file: '../README.md',
    phrase: (b, f) => `${f} records over ${b} codes`,
    why: 'both derived numbers in one sentence: how many committed counterexamples exist, over how many bounds',
  },
  {
    file: '../README.md',
    phrase: (b) => `two of the ${b} turned out to be unbreakable`,
    why: 'a subset claim whose denominator is the count; the "two" is a measured property of the bound set, not derived here',
  },
  {
    file: '../README.md',
    phrase: (b) => `satisfies all ${b} bounds`,
    why: 'what the shared launch step checks, in the src/launch.ts row of the same table',
  },
  // --- src/ and tools/, where a comment sits beside the code ---
  {
    file: 'src/store.ts',
    phrase: (b) => `claim today's ${b} bounds for classifications made under ten`,
    why: 'why saveRecord never overwrites task.gatedBy; the sentence contrasts the count today with the count a record was written under',
  },
  {
    file: 'src/types.ts',
    phrase: (b) => `ten to ${b} in eleven days`,
    why: 'the measured rate of change that justifies shipping task.gatedBy at all',
  },
  {
    file: 'src/types.ts',
    phrase: (b) => `the ${b} codes below are this`,
    why: 'why GateIdentity.codes is string[] and not InvariantCode[]; the count names this build\'s bound set as against a later one\'s',
  },
  {
    file: 'src/invariants.test.ts',
    phrase: (b) => `${b} in eleven days, so two records bought two months apart`,
    why: 'the same measured rate of change as src/types.ts, restated where the bound is tested',
  },
  {
    file: 'src/invariants.violations.test.ts',
    phrase: (b) => `passes all ${b} bounds`,
    why: 'the test title asserting the base fixture is clean, so each counterexample fails for its own edit',
  },
  {
    file: 'src/invariants.violations.test.ts',
    phrase: (b) => `Two of the ${b} are backstops`,
    why: 'the two bounds that cannot be violated alone, stated over the current count',
  },
  {
    file: 'src/invariants.violations.test.ts',
    phrase: (_b, f) => `${f} committed records`,
    why: 'the fixture count in this file\'s own header, which is the number the directory listing must agree with',
  },
]

/**
 * Occurrences of the count's word form in a live surface that are NOT about
 * the bound count, keyed by file, with the reason each is legitimate.
 *
 * This exists because the sweep searches for a WORD and a word does not
 * carry its subject. The one entry here is the proof that the sweep had to
 * be written this way rather than as "any number word next to the word
 * bounds": `tools/bundle-digest-index.ts` happens to count bundles, and the
 * sentence "ten of the eighteen were" would read to a regex as a bound-count
 * claim and to a human as nothing of the kind. An entry here is a claim that
 * a future reader can check in one line of context.
 */
const NOT_A_BOUND_COUNT: Record<string, { count: number; why: string }> = {
  'tools/bundle-digest-index.ts': {
    count: 1,
    why: 'counts published bundle digests ("ten of the eighteen were" the tip of main), not bounds. Coincides with BOUND_COUNT by accident and will stop coinciding on the next bound.',
  },
}

const read = (file: string) => readFileSync(file, 'utf8')

/** every index at which `needle` occurs in `haystack` */
function indicesOf(haystack: string, needle: string): number[] {
  const out: number[] = []
  for (let i = haystack.indexOf(needle); i !== -1; i = haystack.indexOf(needle, i + 1)) out.push(i)
  return out
}

describe('the bound count in prose, against the bound count derived from the bounds', () => {
  const bounds = word(BOUND_COUNT)
  const fixtures = word(FIXTURE_RECORD_COUNT)

  it('spells numbers correctly, so a failure below names a real string', () => {
    // Guards the gate's own vocabulary before any assertion rests on it. If
    // `word()` cannot express the count, every phrase below is nonsense and
    // every failure message misleads; failing here instead says so once.
    //
    // Fixed inputs, NOT `word(BOUND_COUNT)` against a typed word. Pinning
    // the current count here would make this file a second place that
    // states it by hand, which is the defect the whole gate exists to
    // police, and would mean every bound added has to edit its own gate.
    // These five cover the three shapes `word()` has: below twenty, an
    // exact ten, and a hyphenated compound.
    expect(word(13)).toBe('thirteen')
    expect(word(18)).toBe('eighteen')
    expect(word(20)).toBe('twenty')
    expect(word(23)).toBe('twenty-three')
    expect(word(30)).toBe('thirty')
    expect(() => word(40)).toThrow(/extend ONES\/TENS/)

    // And the two counts this run will actually interpolate are expressible
    // at all, which is the property the phrases below depend on.
    expect(bounds).toMatch(/^[a-z]+(-[a-z]+)?$/)
    expect(fixtures).toMatch(/^[a-z]+(-[a-z]+)?$/)
  })

  // ASSERTION 1. Fails when the count changes and a site was not updated.
  describe('every registered claim states the current count', () => {
    for (const claim of CLAIMS) {
      const expected = claim.phrase(bounds, fixtures)
      it(`${claim.file}: "${expected}"`, () => {
        const text = read(claim.file)
        expect(
          text.includes(expected),
          `${claim.file} does not contain "${expected}".\n` +
            `What this sentence claims: ${claim.why}\n` +
            `If BOUNDS or fixtures/violations/ just changed, edit the prose in ${claim.file} to say "${expected}".\n` +
            `If the sentence was rewritten for another reason, update its entry in CLAIMS here.`,
        ).toBe(true)
      })

      it(`${claim.file}: "${expected}" fits on one line, as the registry requires`, () => {
        // The registry's contract, asserted rather than trusted. A phrase
        // that grew a newline would start failing assertion 1 for a reason
        // that looks like stale prose and is not.
        expect(expected).not.toContain('\n')
      })
    }
  })

  // ASSERTION 2. Fails when a claim exists that the registry does not know
  // about. This is the base case the induction in the header rests on.
  describe('no mention of the current count is unaccounted for', () => {
    const wholeWord = new RegExp(`\\b${bounds}\\b`, 'g')

    for (const file of LIVE_SURFACES) {
      const text = read(file)
      const hits = [...text.matchAll(wholeWord)].map((m) => m.index!)
      if (hits.length === 0) continue

      it(`${file}: all ${hits.length} mention(s) of "${bounds}" are registered or declared`, () => {
        // The character ranges the registry already covers in this file.
        const covered: [number, number][] = CLAIMS.filter((c) => c.file === file).flatMap((c) => {
          const phrase = c.phrase(bounds, fixtures)
          return indicesOf(text, phrase).map((i) => [i, i + phrase.length] as [number, number])
        })

        const unexplained = hits.filter((h) => !covered.some(([s, e]) => h >= s && h < e))
        const declared = NOT_A_BOUND_COUNT[file]?.count ?? 0

        // Reported as the surrounding line, not as an offset: an index is
        // not something a reader can act on, and the line is.
        const lines = unexplained.map((h) => {
          const start = text.lastIndexOf('\n', h) + 1
          const end = text.indexOf('\n', h)
          const lineNo = text.slice(0, h).split('\n').length
          return `  ${file}:${lineNo}  ${text.slice(start, end === -1 ? undefined : end).trim()}`
        })

        expect(
          unexplained.length,
          `${file} has ${unexplained.length} mention(s) of "${bounds}" that no CLAIMS entry covers, ` +
            `and ${declared} declared in NOT_A_BOUND_COUNT:\n${lines.join('\n')}\n` +
            `Each is either (a) a statement of the bound count, which belongs in CLAIMS so it fails ` +
            `when the count moves, or (b) a number about something else, which belongs in ` +
            `NOT_A_BOUND_COUNT with a reason.`,
        ).toBe(declared)
      })
    }

    it('sweeps the files it claims to, so an empty sweep cannot pass quietly', () => {
      // A sweep whose file list silently emptied would report no unexplained
      // mentions and look green. These bounds are the shape of the tree at
      // the time of writing, loose enough not to break on a new module and
      // tight enough to catch a readdir that stopped returning anything.
      expect(LIVE_SURFACES).toContain('../README.md')
      expect(LIVE_SURFACES).toContain('src/invariants.ts')
      expect(LIVE_SURFACES).toContain('tools/bundle-digest-index.ts')
      expect(LIVE_SURFACES.length).toBeGreaterThan(80)
      // And the registry covers more than one file, which is the other way
      // for assertion 1 to become vacuous.
      expect(new Set(CLAIMS.map((c) => c.file)).size).toBeGreaterThanOrEqual(5)
    })
  })

  it('declares nothing it does not sweep', () => {
    // An entry in NOT_A_BOUND_COUNT for a file outside LIVE_SURFACES is an
    // exemption from a check that was never going to run, which reads as
    // coverage and is not.
    for (const file of Object.keys(NOT_A_BOUND_COUNT)) {
      expect(LIVE_SURFACES, `${file} is declared but never swept`).toContain(file)
    }
    for (const claim of CLAIMS) {
      expect(LIVE_SURFACES, `${claim.file} carries a claim but is never swept`).toContain(claim.file)
    }
  })
})
