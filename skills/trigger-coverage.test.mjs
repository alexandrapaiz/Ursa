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
import { parseTriggerTest, similarity, coverage, BIGRAM_DICE_FLOOR } from './trigger-coverage.mjs'

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
  assert.deepEqual(parseTriggerTest(doc).shouldFire, [
    { id: '3b', text: 'A later prompt, added under the floor rule.' },
  ])
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

test('a skill is never its own sibling', () => {
  const library = [{
    slug: 'a',
    shouldFire: [{ id: '1', text: 'Resolve the record and commit the adjudication beside it.' }],
    nearMisses: [{ id: '2', text: 'Resolve the record and commit the adjudication beside it.' }],
  }]
  assert.deepEqual(coverage(library), [])
})
