// node --test skills/trigger-coverage.test.mjs
//
// Covers the parsing and the metric that trigger-coverage.mjs reads §5c
// through. The cases that matter are the ones where a wrong answer is silent:
// a section heading that contains another heading's name, an ordinal that is
// not a plain integer, and two prompts that share this library's whole
// vocabulary while asking for different work. Each of those produces a
// coverage number rather than an error, which is the same failure shape the
// evidence lock was built for one directory over.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  BIGRAM_DICE_FLOOR,
  coverage,
  explainShape,
  explainShortfall,
  parseTriggerTest,
  similarity,
} from './trigger-coverage.mjs'

const test_doc = `# Trigger test — a-skill

Five prompts, written against the \`description\` field.

## Should fire

**1. "Resolve the record for task-001 and commit the adjudication."**

Fires. The literal shape of the skill's work.

**2. "Build a ground-truth set from the low-confidence matches."**

Fires through the ground-truth clause.

## Should not fire

**3. "Read the record's stats and tell me the survival rate per model."**

Does not fire. Summary statistics, excluded by name.

## Note on the overlap

Prose after the sections, which must not be read as a prompt.
`

test('"should not fire" is not parsed as "should fire"', () => {
  // The two headings are disjoint under an anchored test, so this passes
  // without any ordering care -- which is the point of pinning it. Under a
  // looser predicate for the word "fire" both headings match, the section
  // lookup returns the first, and every near miss is filed as a should-fire
  // prompt: a test with no near misses then reports as fully covered, with a
  // number rather than an error. That is the regression this holds shut.
  const { shouldFire, nearMisses } = parseTriggerTest(test_doc)
  assert.deepEqual(shouldFire.map((p) => p.id), ['1', '2'])
  assert.deepEqual(nearMisses.map((p) => p.id), ['3'])
})

test('prose after the last section is not a prompt', () => {
  const { shouldFire, nearMisses } = parseTriggerTest(test_doc)
  assert.equal(shouldFire.length + nearMisses.length, 3)
})

test('an ordinal carrying a letter is a prompt', () => {
  // quoting-a-number's fourth should-fire prompt is numbered `3b`, because §5
  // says the budget is a floor and the run that added it declined to
  // renumber the near misses under it. An integer-only pattern drops that
  // prompt, which understates the should-fire count and, worse, would hide a
  // sibling near miss numbered the same way.
  const doc = `## Should fire\n\n**3b. "A later prompt, added under the floor rule."**\n`
  const [prompt] = parseTriggerTest(doc).shouldFire
  assert.equal(prompt.id, '3b')
  assert.equal(prompt.text, 'A later prompt, added under the floor rule.')
})

test('a prompt spanning several lines is joined, not truncated', () => {
  // Every prompt in the library is hard-wrapped, so a pattern that stops at a
  // newline compares first lines and scores two copies of one prompt well
  // below the floor.
  const doc = `## Should fire\n\n**1. "A prompt that runs\nacross three\nlines."**\n`
  assert.deepEqual(parseTriggerTest(doc).shouldFire[0].text, 'A prompt that runs across three lines.')
})

test('a missing section is empty rather than an error', () => {
  const { shouldFire, nearMisses } = parseTriggerTest('# Trigger test\n\nNo sections yet.\n')
  assert.deepEqual(shouldFire, [])
  assert.deepEqual(nearMisses, [])
})

test('identical prompts score 1, and the metric is symmetric', () => {
  const a = 'Read the stats and tell me the survival rate per model.'
  assert.equal(similarity(a, a), 1)
  const b = 'Resolve the record and commit the adjudication beside it.'
  assert.equal(similarity(a, b), similarity(b, a))
})

test('the same prompt with its subject localized stays above the floor', () => {
  // This is the case that makes the check a similarity and not an equality.
  // The gate skill's near miss 4 is adjudicating's own trigger reworded at
  // the subject: "This record has 55 uncertain spans" for "The record for
  // task-001 has 55 uncertain spans". §5c is satisfied and an equality test
  // would call the boundary untested.
  const own = 'The record for task-001 has 55 uncertain spans. Work through them and ' +
    'decide which ones really came from a generation, then commit the adjudication next to the record.'
  const quoted = 'This record has 55 uncertain spans. Work through them and ' +
    'decide which ones really came from a generation, then commit the adjudication next to the record.'
  assert.ok(similarity(own, quoted) >= BIGRAM_DICE_FLOOR,
    `localized copy scored ${similarity(own, quoted)}, below the floor`)
})

test('two prompts sharing the vocabulary but not the work stay below the floor', () => {
  // Why the metric is bigrams and not words. These two share "record",
  // "span", "the" and "a" -- close to the entire vocabulary of four skills in
  // this library -- and ask for different work. A unigram measure scores them
  // high and reports a boundary tested when nothing tests it.
  const adjudicate = 'The record has 55 uncertain spans. Decide which ones came from a generation.'
  const quote = 'The record says 82.1 percent of generated characters were deleted. ' +
    'Is that still the right way to say it in the methods doc?'
  assert.ok(similarity(adjudicate, quote) < BIGRAM_DICE_FLOOR,
    `unrelated prompts scored ${similarity(adjudicate, quote)}, at or above the floor`)
})

test('a one-word prompt does not divide by zero', () => {
  assert.equal(similarity('record', ''), 0)
  assert.equal(similarity('', ''), 0)
})

test('repeated bigrams are not matched twice by one occurrence', () => {
  // The intersection counts multiplicity, so a prompt is not judged covered
  // by a longer near miss that merely repeats a phrase of it.
  const once = 'resolve the record'
  const twice = 'resolve the record resolve the record'
  assert.ok(similarity(once, twice) < 1)
})

test('coverage is directional: a pair is about one skill testing the other', () => {
  // Adjacency is symmetric and coverage is not. The gate tests adjudicating's
  // trigger and adjudicating does not test the gate's, so exactly one of the
  // two ordered pairs is covered. Collapsing them would have reported this
  // library at full coverage on its very first boundary.
  const library = [
    {
      slug: 'a',
      shouldFire: [{ id: '1', text: 'Resolve the record for task-001 and commit the adjudication.' }],
      nearMisses: [],
    },
    {
      slug: 'b',
      shouldFire: [{ id: '1', text: 'Quote the deletion rate into the methods document, please.' }],
      nearMisses: [{ id: '2', text: 'Resolve the record for task-001 and commit the adjudication.' }],
    },
  ]
  const pairs = coverage(library)
  const bFromA = pairs.find((p) => p.skill === 'b' && p.sibling === 'a')
  const aFromB = pairs.find((p) => p.skill === 'a' && p.sibling === 'b')
  assert.equal(bFromA.covered, true)
  assert.equal(aFromB.covered, false)
  assert.equal(aFromB.score, 0)
})

test('a near miss kept outside the two canonical sections still counts', () => {
  // running-an-outcome-record-trial's sixth prompt lives under "Added
  // 2026-10-01, third run: the near miss this test was missing", because the
  // run that owed it declined to edit a list belonging to a pull request that
  // was still open. Reading only the "Should not fire" section scores that
  // boundary untested, which is how the first draft of this tool read the
  // library: a false finding by the tool built to find false findings.
  const doc = `## Should fire

**1. "Pick a repo for the third trial."**

Fires.

## Added later: the near miss this test was missing

**6. "The viewer's tiles say 41, 24, 35 and 30 percent. That is 130. What is broken?"**

Should not fire. This is \`quoting-a-number-from-an-outcome-record\`'s trigger.
`
  const { shouldFire, nearMisses, unclassified } = parseTriggerTest(doc)
  assert.deepEqual(shouldFire.map((p) => p.id), ['1'])
  assert.deepEqual(nearMisses.map((p) => p.id), ['6'])
  assert.deepEqual(unclassified, [])
})

test('a prompt outside the sections with no verdict is reported, not guessed', () => {
  // Guessing either way corrupts a number silently: filed as a near miss it
  // invents coverage, filed as should-fire it hides a gap.
  const doc = `## A note on something

**7. "Some prompt nobody said a verdict about."**

Prose that does not say which way it lands.
`
  const { shouldFire, nearMisses, unclassified } = parseTriggerTest(doc)
  assert.deepEqual(shouldFire, [])
  assert.deepEqual(nearMisses, [])
  assert.deepEqual(unclassified.map((p) => p.id), ['7'])
})

test('a boundary declared in prose counts even when the prompt is paraphrased', () => {
  // The case above, scored. The paraphrase shares few bigrams with the
  // sibling's trigger, so similarity alone calls the boundary untested; the
  // reasoning names the sibling, which is the claim the test is making.
  const library = [
    {
      slug: 'quoting-a-number',
      shouldFire: [{ id: '2', text: "The record's four tiles say 41 percent, 24 percent, 35 percent and 30 percent. That's 130. What's broken?" }],
      nearMisses: [],
    },
    {
      slug: 'running-a-trial',
      shouldFire: [],
      nearMisses: [{
        id: '6',
        text: 'The viewer tiles say 41, 24, 35 and 30 percent. That is 130. What is broken?',
        reasoning: "Should not fire. This is `quoting-a-number`'s trigger.",
      }],
    },
  ]
  const pair = coverage(library).find((p) => p.skill === 'running-a-trial')
  assert.equal(pair.covered, true)
  assert.equal(pair.via, 'declared')
  assert.equal(pair.declared, '6')
  assert.ok(pair.score < BIGRAM_DICE_FLOOR, 'the paraphrase should be below the floor, or this test proves nothing')
})

test('a declaration and a copy are reported as different signals', () => {
  // §5c asks for the sibling's own trigger prompt. "both" and "similarity"
  // meet that; "declared" is a real argument about the edge that never put
  // the sibling's words in front of the description, which is the half that
  // would catch a false positive. The report keeps them apart so the two
  // call for different work.
  const sibling = { slug: 'b', shouldFire: [{ id: '1', text: 'Distill these four records into tuning.json for me.' }], nearMisses: [] }
  const copier = {
    slug: 'a',
    shouldFire: [],
    nearMisses: [{ id: '4', text: 'Distill these four records into tuning.json for me.', reasoning: "`b`'s own trigger." }],
  }
  const arguer = {
    slug: 'c',
    shouldFire: [],
    nearMisses: [{ id: '4', text: 'Something else entirely about release exits.', reasoning: 'Belongs to `b`, not here.' }],
  }
  const pairs = coverage([sibling, copier, arguer])
  assert.equal(pairs.find((p) => p.skill === 'a' && p.sibling === 'b').via, 'both')
  assert.equal(pairs.find((p) => p.skill === 'c' && p.sibling === 'b').via, 'declared')
})

test('a skill is never its own sibling', () => {
  const library = [{
    slug: 'a',
    shouldFire: [{ id: '1', text: 'Resolve the record and commit the adjudication beside it.' }],
    nearMisses: [{ id: '2', text: 'Resolve the record and commit the adjudication beside it.' }],
  }]
  assert.deepEqual(coverage(library), [])
})

test('the shortfall explanation names the condition that fired, not the usual one', () => {
  // The regression this holds shut is a wrong diagnosis rather than a wrong
  // number, which is why it survived: the branch exits 1 either way and the
  // only thing that differs is the sentence a reader acts on. Until
  // 2026-10-26 both conditions printed the near-miss arithmetic, so a library
  // whose only defect was a missing trigger test was told to go count
  // siblings.
  const missing = explainShortfall({ gaps: [], missingTrigger: [{ slug: 'a-skill' }] })
  const joined = missing.join(' ')
  assert.match(joined, /TRIGGER-TEST\.md/)
  assert.doesNotMatch(joined, /near miss per adjacent skill/)

  const uncovered = explainShortfall({ gaps: [{ skill: 'a', sibling: 'b' }], missingTrigger: [] })
  const joinedGaps = uncovered.join(' ')
  assert.match(joinedGaps, /near miss per adjacent skill/)
  assert.doesNotMatch(joinedGaps, /TRIGGER-TEST\.md/)
})

test('each condition names every cause this guard knows, and the gap case orders them', () => {
  // §5x's mechanical part: one named cause for a condition with several is the
  // defect. The gap branch has three and the missing-trigger branch has two,
  // and the gap branch says which to check first, because only one of its
  // three moves many pairs at once.
  const both = explainShortfall({
    gaps: [{ skill: 'a', sibling: 'b' }],
    missingTrigger: [{ slug: 'c' }],
  }).join(' ')
  assert.match(both, /renamed skill directory/)
  assert.match(both, /paraphrases/)
  assert.match(both, /check first/)
  assert.match(both, /never written/)
  assert.match(both, /another name/)
})

// The shape branch, which is the fourth instance of the defect `explainShortfall`
// above was written for and the first one found by looking at exit branches
// rather than at files. Until this run it summed four disjoint conditions into
// `N library-shape defects above, listed before the counts.` Every assertion
// below fails against that line: it carries no condition name, no cause and no
// repair, and the word `defects` is the only vocabulary it has for all four.
// prompts/skill-extract.md §5z.

const SHAPE_NONE = { missingSkill: [], unlisted: [], indexedMissing: [], mislabelled: [] }

test('the shape explanation names the condition that fired, not the class', () => {
  // A library whose only fault is a missing index row must not be told that a
  // directory is unguarded, and the reverse. This is the regression that
  // matters, because the branch returns 1 either way and the sentence is the
  // only thing that differs.
  const unlisted = explainShape({ ...SHAPE_NONE, unlisted: ['a-skill'] }).join(' ')
  assert.match(unlisted, /absent from the index/)
  assert.doesNotMatch(unlisted, /no guard in/)

  const unread = explainShape({ ...SHAPE_NONE, missingSkill: [{ slug: 'a-skill', nearMiss: 'SKILLS.md' }] }).join(' ')
  assert.match(unread, /no guard in/)
  assert.doesNotMatch(unread, /absent from the index/)
})

test('each shape condition names its repair, and the unguarded one is ordered first', () => {
  // §5z: the order is the repair order, not the declaration order. The unread
  // directory is the only one of the four where something is actually
  // unguarded, so it is the one a run with time for exactly one repair should
  // spend it on, and the text has to say so.
  const all = explainShape({
    missingSkill: [{ slug: 'u', nearMiss: null }],
    unlisted: ['v'],
    indexedMissing: ['w'],
    mislabelled: [{ label: 'x', dir: 'y' }],
  })
  const joined = all.join(' ')
  assert.match(joined, /Repair this one first/)
  assert.match(joined, /Add the row/)
  assert.match(joined, /fix the row, or delete it/)
  assert.match(joined, /skills\/README\.md/)
  // First condition printed is the unguarded one.
  assert.match(all[0], /no SKILL\.md/)
  // Last is the cosmetic one, and it says that it is cosmetic.
  assert.match(all[all.length - 1], /README\.md/)
  assert.match(joined, /Cosmetic on its own/)
})

test('a shape condition with more than one cause says so and says how to tell', () => {
  // The two conditions here that have two causes each must not present one.
  // A dangling index row is a rename or a row for a skill that never landed,
  // and those ask for opposite repairs.
  const dangling = explainShape({ ...SHAPE_NONE, indexedMissing: ['gone'] }).join(' ')
  assert.match(dangling, /Two causes/)
  assert.match(dangling, /renamed/)
  assert.match(dangling, /never landed/)
  assert.match(dangling, /opposite repairs/)

  const unread = explainShape({ ...SHAPE_NONE, missingSkill: [{ slug: 'u', nearMiss: 'SKILLS.md' }] }).join(' ')
  assert.match(unread, /Two causes/)
  assert.match(unread, /rename/)
  assert.match(unread, /not a skill at all/)
})

test('no condition fired means no lines, so a clean library gets no explanation', () => {
  // The branch is only reached when the sum is non-zero, but the function is
  // exported and pure, and a function that explains a failure that did not
  // happen is how §5w's dangerous number gets printed.
  assert.deepEqual(explainShape(SHAPE_NONE), [])
})

test('the shape lines are singular and plural correctly, because the count is the claim', () => {
  const one = explainShape({ ...SHAPE_NONE, indexedMissing: ['a'] }).join(' ')
  assert.match(one, /1 index row points/)
  const two = explainShape({ ...SHAPE_NONE, indexedMissing: ['a', 'b'] }).join(' ')
  assert.match(two, /2 index rows point/)
})
