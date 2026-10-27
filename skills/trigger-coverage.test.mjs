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
  bodyCountDefects,
  countDefects,
  coverage,
  declaredCounts,
  explainBodyCounts,
  explainCounts,
  explainShape,
  libraryCountsInBody,
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

// The stated-count check, added 2026-10-27. What these cover is the one thing
// §5u said a count check must not do, which is guess at a number in prose.

const counted = (prompts, sf, nm, nbrs) =>
  `# Trigger test — a-skill\n\n\`\`\`counts\nprompts: ${prompts}\nshould-fire: ${sf}\n` +
  `near-misses: ${nm}\nneighbours: ${nbrs}\n\`\`\`\n\nFifteen prompts once, and §5r's own 15 of 30 ordered pairs.\n`

/** A library entry shaped like readLibrary's, with the prompt counts faked so
 *  the count check can be tested without a whole trigger test per case. */
const entry = (slug, trigger, sf, nm, refs = 0) => ({
  slug, trigger, refs,
  shouldFire: Array.from({ length: sf }, (_, i) => ({ id: `${i + 1}`, text: 'x', reasoning: '' })),
  nearMisses: Array.from({ length: nm }, (_, i) => ({ id: `${i + 9}`, text: 'y', reasoning: '' })),
})

test('declaredCounts reads the fenced block and nothing else in the file', () => {
  const said = declaredCounts(counted(12, 3, 9, 9))
  assert.deepEqual(said, { prompts: 12, 'should-fire': 3, 'near-misses': 9, neighbours: 9 })
})

test('a historical number in the prose is invisible to the check, which is the point', () => {
  // §5u declined to build this check because a search for number words cannot
  // tell skills/README.md's "then five neighbours" from a stale claim. The
  // fixture above says "Fifteen prompts once" and "15 of 30 ordered pairs" in
  // its prose, both correct as written, and neither reaches the result.
  const said = declaredCounts(counted(12, 3, 9, 0))
  assert.equal(said.prompts, 12)
  assert.equal(countDefects([entry('a-skill', counted(12, 3, 9, 0), 3, 9)], []).length, 0)
})

test('no block at all is reported as the absence rather than as a wrong count', () => {
  const defects = countDefects([entry('a-skill', '# Trigger test — a-skill\n\nTwelve prompts.\n', 3, 9)], [])
  assert.deepEqual(defects, [{ slug: 'a-skill', file: 'skills/a-skill/TRIGGER-TEST.md', key: 'counts block', said: null, measured: null }])
})

test('every stated count is compared, and the measured number comes from the files', () => {
  // The library has one skill here, so the §5c denominator is zero neighbours.
  const defects = countDefects([entry('a-skill', counted(13, 4, 9, 9), 3, 9)], [])
  assert.deepEqual(defects.map((d) => [d.key, d.said, d.measured]), [
    ['prompts', 13, 12],
    ['should-fire', 4, 3],
    ['neighbours', 9, 0],
  ])
})

test('the neighbour count is the library minus this skill, so landing one moves every file', () => {
  // This is the arithmetic §5u measured: two landing runs left four headers
  // saying "five neighbours" in a library of nine. One skill, nothing stale;
  // add a second and both files owe a new number.
  const lib = [entry('a', counted(12, 3, 9, 1), 3, 9), entry('b', counted(12, 3, 9, 1), 3, 9)]
  assert.equal(countDefects(lib, []).length, 0)
  lib.push(entry('c', counted(12, 3, 9, 2), 3, 9))
  assert.deepEqual(countDefects(lib, []).map((d) => `${d.slug}:${d.key}:${d.said}->${d.measured}`),
    ['a:neighbours:1->2', 'b:neighbours:1->2'])
})

test("the index's Refs column is checked against the skill's own declarations", () => {
  const lib = [entry('a-skill', counted(12, 3, 9, 0), 3, 9, 45)]
  assert.deepEqual(countDefects(lib, [{ label: 'a-skill', dir: 'a-skill', refs: 41 }]),
    [{ slug: 'a-skill', file: 'skills/README.md', key: 'refs', said: 41, measured: 45 }])
  assert.equal(countDefects(lib, [{ label: 'a-skill', dir: 'a-skill', refs: 45 }]).length, 0)
})

test('an index row for a directory that is not a skill is the shape check\'s finding, not this one', () => {
  // Reporting it here too would be two guards disagreeing about one rule, which
  // is the argument library-dirs.mjs makes about the missing trigger test.
  assert.deepEqual(countDefects([], [{ label: 'ghost', dir: 'ghost', refs: 3 }]), [])
})

test('the count explanation separates a wrong statement from a missing one', () => {
  const stale = explainCounts([{ slug: 'a', file: 'f', key: 'prompts', said: 12, measured: 13 }]).join(' ')
  assert.match(stale, /derived fact kept by hand/)
  assert.doesNotMatch(stale, /declares no/)
  const missing = explainCounts([{ slug: 'a', file: 'f', key: 'counts block', said: null, measured: null }]).join(' ')
  assert.match(missing, /nothing to check/)
  assert.doesNotMatch(missing, /goes stale/)
  assert.deepEqual(explainCounts([]), [])
})

// The body-count rule, added 2026-10-27. These cover the three decisions the
// rule makes that a reader would otherwise have to take on trust: that the
// paragraph and not the sentence is the unit, that `one` and a version string
// are not counts, and that naming the siblings is what clears it.

const body = (prose) => `---\nname: a-skill\nwhat: four skills and eight areas\n---\n\n${prose}\n`

test('a skill body that counts the library is reported with the words it counted', () => {
  const hits = libraryCountsInBody(body(
    'Those four skills work on `outcome_record.json`. This one works on the gate.'))
  assert.equal(hits.length, 1)
  assert.deepEqual(hits[0].counts, ['four'])
})

test('the unit is the paragraph, so the second number in the same thought is caught too', () => {
  // This is §5ae's measured cause and the reason the rule is not scoped to the
  // sentence: the sentence naming the library carries one `four` and the next
  // sentence carries the other, so a sentence-scoped rule would repair the half
  // the author was thinking about and leave the other, which is exactly what
  // the run that paid §5u's debt did.
  const [hit] = libraryCountsInBody(body(
    'Those four skills work on one artifact.\nIt sits across a handoff from all four.'))
  assert.deepEqual(hit.counts, ['four', 'four'])
})

test('a paragraph that names the library without counting it is clean, which is the repair', () => {
  assert.deepEqual(libraryCountsInBody(body(
    'The skills that take that output as an input are `a-skill` and `b-skill`.')), [])
})

test('`one` is a pronoun here and a version string is not a count', () => {
  // Both of these are in the five paragraphs the rule was written against.
  // Flagging either would make the rule refuse its own repair.
  assert.deepEqual(libraryCountsInBody(body(
    'Those skills work on the record. This one works on the gate, as of 0.5.0.')), [])
})

test('frontmatter and fenced blocks are not prose, so neither reaches the rule', () => {
  // `body()` puts "four skills and eight areas" in a `what` field on purpose.
  assert.deepEqual(libraryCountsInBody(body('It works on the gate.')), [])
  assert.deepEqual(libraryCountsInBody(body('```\nthree skills\n```')), [])
})

test('the reported line is the paragraph a reader will open the file to find', () => {
  const [hit] = libraryCountsInBody('---\nname: a\n---\n\nfiller\n\nThose two skills are siblings.\n')
  assert.equal(hit.line, 7)
})

test('a body count is reported per skill with its own path', () => {
  const lib = [
    { slug: 'a-skill', trigger: null, refs: 0, shouldFire: [], nearMisses: [],
      skillText: body('Those three skills work on the record.') },
    { slug: 'b-skill', trigger: null, refs: 0, shouldFire: [], nearMisses: [],
      skillText: body('The skills `a-skill` and `c-skill` are its siblings.') },
  ]
  assert.deepEqual(bodyCountDefects(lib).map((d) => [d.file, d.counts]),
    [['skills/a-skill/SKILL.md', ['three']]])
})

test('a library with no body text is this check with nothing to read, not a clean library', () => {
  // readLibrary never produces this, because it skips a directory with no
  // SKILL.md. A caller constructing entries by hand can, and silence is the
  // right answer rather than a defect against a file that was not read.
  assert.deepEqual(bodyCountDefects([{ slug: 'a', trigger: null, refs: 0, shouldFire: [], nearMisses: [] }]), [])
})

test('the body-count explanation names the repair and refuses to ask for a recount', () => {
  const said = explainBodyCounts([{ slug: 'a', file: 'f', line: 1, counts: ['four'], quote: 'q' }]).join(' ')
  assert.match(said, /name the siblings instead of/)
  assert.match(said, /not a recount/)
  assert.deepEqual(explainBodyCounts([]), [])
})

test("the index's own counts block carries the library size and only that is measured", () => {
  const lib = [entry('a', counted(12, 3, 9, 1), 3, 9), entry('b', counted(12, 3, 9, 1), 3, 9)]
  const index = '# The library\n\n```counts\nskills: 2\nareas: 1\n```\n'
  assert.equal(countDefects(lib, [], index).length, 0)
  // An area count that disagrees with nothing is not a defect: no tool can
  // derive where an edge falls, which is why the block says so in its prose.
  assert.equal(countDefects(lib, [], '# L\n\n```counts\nskills: 2\nareas: 9\n```\n').length, 0)
  assert.deepEqual(countDefects(lib, [], '# L\n\n```counts\nskills: 3\nareas: 1\n```\n')
    .map((d) => [d.file, d.key, d.said, d.measured]), [['skills/README.md', 'skills', 3, 2]])
})

test('an index with no counts block is reported as the absence, like a trigger test with none', () => {
  const lib = [entry('a', counted(12, 3, 9, 0), 3, 9)]
  assert.deepEqual(countDefects(lib, [], '# The library\n\nTen skills over eight areas.\n')
    .map((d) => [d.slug, d.key, d.said]), [['the library', 'counts block', null]])
  // And omitted entirely, which is what every caller before this run passed,
  // asks nothing about the index at all.
  assert.equal(countDefects(lib, []).length, 0)
})
