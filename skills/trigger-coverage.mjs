// Which sibling boundaries a trigger test actually tests, per
// prompts/skill-extract.md §5c.
//
// §5 asks every skill for two near misses and says the near misses are the
// load-bearing half, because three prompts that obviously fire prove nothing
// about a description. §5c then makes the budget grow: once the library holds
// siblings, "a skill ships one near miss per adjacent skill", and the two in §5
// are a floor. §5e keeps that budget when the neighbour is across an artifact
// edge rather than beside it in the same area.
//
// Nothing checked it. The library's two guards are about receipts:
// check-evidence.mjs proves a citation still points where it pointed, and
// relevance-sweep.mjs proves a reader judged the lines under it. Both are
// silent about the half of a skill that decides whether it ever runs at all.
//
// The failure that argument predicts is not a seat forgetting. It is
// arithmetic. The budget is one per neighbour, so landing a sixth skill put
// every one of the five already there one near miss short, in five files none
// of that run's diff touched, with both guards green and nothing to say so.
//
// Measured on the 2026-10-24 library before this run repaired it: of 30
// ordered pairs, 15 carried the sibling's own trigger prompt, 2 argued the
// boundary in prose without it, and 13 did neither. The shape of the 15 is the
// whole argument. Sorted by `created`, §5c coverage is exactly rank by age:
//
//   adjudicating-uncertain-spans      2026-09-24   0 of 5
//   running-an-outcome-record-trial   2026-09-30   1 of 5
//   quoting-a-number...               2026-10-01   2 of 5
//   distilling-a-tuning-record        2026-10-05   3 of 5
//   adding-a-bound-to-the-record-gate 2026-10-18   4 of 5
//   clearing-a-record-for-release     2026-10-23   5 of 5
//
// Six skills, six distinct values, in order, with no ties. Each skill tests
// the siblings that existed on the day it was written and has added nothing
// since. So the newest skill looks compliant for the same reason the oldest
// looks negligent: position in a sequence, not care.
//
// One amendment is in the history and it is worth stating, because the first
// draft of this comment claimed there were none and that was wrong.
// `running-an-outcome-record-trial` did come back for a sibling: on
// 2026-10-01 it appended a sixth prompt under its own heading for the quoting
// skill, and said in the prose that §5c had asked for it. That is the single
// counterexample in six skills and three weeks, and it is also the one pair
// this tool got wrong on its first pass, since the prompt was written in the
// author's own words rather than copied and so scored 0.333. The exception and
// the measurement error are the same event, which is the argument for reading
// a declaration as well as a resemblance.
//
// What it reads, and why that is enough. §5c does not ask for a near miss
// *about* the sibling, it asks for "the adjacent skill's own trigger prompt",
// which is a near-duplicate of a string already in the repository. So coverage
// is a text question and not a judgement: for each pair, the best similarity
// between any of the sibling's should-fire prompts and any of this skill's near
// misses. The two populations separate with a gap wide enough that no threshold
// in it is a choice -- see the measurement in the header of
// `BIGRAM_DICE_FLOOR`.
//
// Adjacency is every other skill in the library, which is what skills/README.md
// already asserts in prose for the two newest ("all four others as
// neighbours", "all five others as neighbours") and what §5e's artifact test
// produces for the rest: six skills over four artifacts, every pair either
// sharing an artifact or sitting one edge apart. There is no `neighbours` field
// in the frontmatter to read, and inventing one to encode a fact the library
// states uniformly would be a second place for it to be wrong. If a skill ever
// lands that genuinely has no boundary with another, that is the run that
// should add the field, and this comment is the argument it has to beat.
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { unreadDirs, indexedRows } from './library-dirs.mjs'
import { declaredRefs } from './citing-files.mjs'

const SKILLS_DIR = new URL('.', import.meta.url).pathname.replace(/\/$/, '')

/** The format specification, which §5ag puts in this guard's scope because it
 *  is the one file stating counts of the library that §5ae and §5af between
 *  them never covered. Resolved from this file rather than from the process
 *  cwd, for the reason §5v gives about a guard asking its clone a question. */
const SPEC_REL = 'prompts/skill-extract.md'
const SPEC_PATH = join(SKILLS_DIR, '..', SPEC_REL)

/** The library's index, named relatively so a finding prints the path a reader
 *  can open from the repository root rather than this sandbox's absolute one. */
const INDEX_REL = 'skills/README.md'

/** The index's area heading and the area labels under it. The ordinal is
 *  captured as a bare token, digit or word, and graded in
 *  `areaHeadingDefects`; the label is the paragraph opener a reader counts.
 *  `areas\b` rather than `areas,` because the trailing clause is prose and has
 *  already been rewritten twice. */
const AREA_HEADING = /^##\s+(\S+)\s+areas\b/m
const AREA_LABEL = /^\*\*The\s+([a-z][a-z-]*)\s+area\.\*\*/gm

/**
 * The floor above which one prompt is "the sibling's own trigger prompt".
 *
 * Measured over the 30 ordered pairs in the 2026-10-24 library, as word-bigram
 * Dice between each sibling's should-fire prompts and each skill's near misses,
 * best match per pair. The result is bimodal with nothing in the middle:
 *
 *   15 pairs from 0.655 to 1.000   (9 of them exactly 1.000, verbatim copies)
 *   ---- a gap 0.547 wide, containing no pair at all ----
 *   15 pairs from 0.108 down to 0.000   (6 of them 0.000, no shared bigram)
 *
 * So this constant is not fitted. Any value in (0.108, 0.655) produces the same
 * answer on this library, and this one sits near the middle of that interval.
 * The nine exact copies are what §5c literally asks for; the six between 0.655
 * and 1.000 are the same prompt with its subject localized, which is still the
 * sibling's trigger and is why this is a similarity and not an equality test.
 *
 * Reproduce with `node skills/trigger-coverage.mjs --pairs`, which prints every
 * pair's score in this order; the gap is visible as a block of `!` markers.
 *
 * The thing to watch, stated so the next run does not have to rediscover it:
 * the gap is a property of how these tests were written, not a law. A seat that
 * writes a near miss *inspired by* a sibling rather than copied from it will
 * land in the gap, and the right response is to read the pair, not to lower the
 * floor. `--pairs` prints every score for exactly that reading.
 */
export const BIGRAM_DICE_FLOOR = 0.6

/** Words, lowercased, punctuation dropped. Code spans and quotes in these
 *  prompts carry the shared vocabulary, so nothing is stripped but symbols. */
const words = (s) => s.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(Boolean)

/** Adjacent word pairs. Bigrams rather than words because two prompts in this
 *  library share almost every noun by construction: "record", "span",
 *  "generation" and "uncertain" are the whole vocabulary of four skills, so a
 *  unigram measure scores unrelated prompts high and separates nothing. */
const bigrams = (s) => {
  const w = words(s)
  if (w.length < 2) return w
  return w.slice(0, -1).map((x, i) => `${x} ${w[i + 1]}`)
}

/** Dice coefficient over bigram multisets: 2|A∩B| / (|A|+|B|), intersection
 *  counting repeats, so a prompt is not matched by a longer one that merely
 *  contains it twice. */
export function similarity(a, b) {
  const A = bigrams(a)
  const B = bigrams(b)
  if (!A.length || !B.length) return 0
  const left = new Map()
  for (const g of A) left.set(g, (left.get(g) ?? 0) + 1)
  let shared = 0
  for (const g of B) {
    const n = left.get(g)
    if (n) { shared++; left.set(g, n - 1) }
  }
  return (2 * shared) / (A.length + B.length)
}

const HEADING = /^##\s+(.*)$/
/** A numbered prompt: `**4. "…"**`. The ordinal may carry a letter, because
 *  §5's budget is a floor and a prompt added later is numbered `3b` rather
 *  than renumbering the near misses under it, which is what the quoting
 *  skill's fourth should-fire prompt actually is. */
const PROMPT = /^\*\*(\d+[a-z]?)\.\s*"([\s\S]*?)"\*\*/gm

/** A prompt's own verdict, in the prose under it: "Should not fire.", "Does
 *  not fire.", "It should not fire". Used only outside the two canonical
 *  sections, where there is no heading to inherit from. */
const NEGATIVE_VERDICT = /\b(should|does|would|will|do)\s+not\s+fire\b/i

/**
 * One trigger test, split into the prompts that must fire and the near misses
 * that must not.
 *
 * Prompts are read wherever they sit, not only under the two canonical
 * headings, because one test in this library keeps a near miss somewhere else
 * and says why. `running-an-outcome-record-trial` was written with one
 * neighbour, gained a second, and appended prompt 6 under its own heading,
 * "Added 2026-10-01, third run: the near miss this test was missing", rather
 * than folding it into a list that belonged to a run whose pull request was
 * still open. Reading only the canonical section scores that boundary
 * untested, which is a false finding of exactly the kind this tool exists to
 * prevent, and it is how the first draft of this file read the library.
 *
 * So: a prompt under "should fire" fires, a prompt under "should not fire"
 * does not, and a prompt under any other heading is classified by the verdict
 * written in its own prose. A prompt outside the canonical sections with no
 * verdict in its prose is returned in `unclassified` rather than guessed at,
 * because a near miss silently filed as a should-fire prompt inflates
 * coverage and a should-fire prompt filed as a near miss invents it.
 */
export function parseTriggerTest(text) {
  const sections = []
  let current = { heading: '', lines: [] }
  sections.push(current)
  for (const line of text.split('\n')) {
    const h = line.match(HEADING)
    if (h) { current = { heading: h[1].trim().toLowerCase(), lines: [] }; sections.push(current) }
    else current.lines.push(line)
  }
  const shouldFire = []
  const nearMisses = []
  const unclassified = []
  for (const section of sections) {
    const body = section.lines.join('\n')
    const found = [...body.matchAll(PROMPT)]
    if (!found.length) continue
    // Both tests are anchored at the start on purpose. The two headings are
    // disjoint under startsWith, so order does not matter here; under any
    // looser test for the word "fire" they are not, and every near miss would
    // be filed as a should-fire prompt.
    const isNo = section.heading.startsWith('should not fire')
    const isYes = section.heading.startsWith('should fire')
    for (const [i, m] of found.entries()) {
      // The reasoning for this prompt: from the end of it to the next prompt.
      const from = m.index + m[0].length
      const to = i + 1 < found.length ? found[i + 1].index : body.length
      const reasoning = body.slice(from, to)
      const prompt = { id: m[1], text: m[2].replace(/\s+/g, ' ').trim(), reasoning }
      if (isNo) { nearMisses.push(prompt); continue }
      if (isYes) { shouldFire.push(prompt); continue }
      if (NEGATIVE_VERDICT.test(reasoning)) nearMisses.push(prompt)
      else unclassified.push({ ...prompt, heading: section.heading })
    }
  }
  return { shouldFire, nearMisses, unclassified }
}

const isDir = (p) => { try { return statSync(p).isDirectory() } catch { return false } }

/** Every skill directory holding both files §2 requires. */
export function readLibrary(dir = SKILLS_DIR) {
  const out = []
  for (const name of readdirSync(dir).sort()) {
    const abs = join(dir, name)
    if (!isDir(abs)) continue
    let trigger
    try { trigger = readFileSync(join(abs, 'TRIGGER-TEST.md'), 'utf8') } catch { trigger = null }
    // The skill file is read rather than stat-ed, because `refs` below is the
    // number the index's `Refs` column claims and this is where that number
    // actually lives. One parser for it, in ./citing-files.mjs, shared with
    // check-evidence.mjs.
    let skillText = null
    try { skillText = readFileSync(join(abs, 'SKILL.md'), 'utf8') } catch { skillText = null }
    if (skillText === null) continue
    // The body text is kept, not just its ref count, because `bodyCountDefects`
    // below reads the prose. Same read, two questions, one open of the file.
    out.push({ slug: name, trigger, skillText, refs: declaredRefs(skillText).length,
      ...(trigger ? parseTriggerTest(trigger) : { shouldFire: [], nearMisses: [], unclassified: [] }) })
  }
  return out
}

/**
 * For every ordered pair of skills, whether this skill's near misses test the
 * boundary with that sibling, by either of two signals.
 *
 * **Declared** is the strong one and is checked first: the near miss's own
 * reasoning names the sibling's slug, which every near miss in this library
 * does ("`distilling-a-tuning-record`'s own trigger."). An author saying which
 * boundary a prompt tests is better evidence than any resemblance measure,
 * because it is the claim the test is actually making.
 *
 * **Similarity** is the fallback, for a near miss that is plainly the
 * sibling's trigger without saying so. It is kept rather than dropped because
 * a declaration is cheap to write and can be wrong, and a prompt that scores
 * 1.00 against the sibling's trigger is a fact about the text that no missing
 * sentence can take away.
 *
 * Why both, and this is the correction that produced this function: reading
 * similarity alone scored `running-an-outcome-record-trial` as not testing its
 * boundary with the quoting skill. It does test it. Its prompt 6 is that
 * skill's trigger 2 paraphrased -- same four percentages, same total of 130,
 * same question -- and its prose says "This is
 * `quoting-a-number-from-an-outcome-record`'s trigger" outright. Paraphrased,
 * it scores 0.333, which is in the gap between the two populations and below
 * any defensible floor. So a floor alone understates coverage by exactly the
 * tests whose authors wrote in their own words, and lowering the floor to
 * catch it would have pulled in pairs at 0.059 that share nothing.
 */
export function coverage(library, floor = BIGRAM_DICE_FLOOR) {
  const pairs = []
  for (const skill of library) {
    for (const sibling of library) {
      if (sibling.slug === skill.slug) continue
      let best = { score: 0, from: null, to: null }
      let declared = null
      for (const n of skill.nearMisses) {
        if (!declared && n.reasoning?.includes(sibling.slug)) declared = n.id
        for (const f of sibling.shouldFire) {
          const score = similarity(f.text, n.text)
          if (score > best.score) best = { score, from: f.id, to: n.id }
        }
      }
      const similar = best.score >= floor
      pairs.push({
        skill: skill.slug,
        sibling: sibling.slug,
        ...best,
        declared,
        covered: Boolean(declared) || similar,
        via: declared && similar ? 'both' : declared ? 'declared' : similar ? 'similarity' : null,
      })
    }
  }
  return pairs
}

const pct = (n, d) => (d === 0 ? '0' : ((100 * n) / d).toFixed(0))

/**
 * The closing explanation, as a pure function of which condition fired, so
 * that a reader cannot be told the cause of a failure they do not have.
 *
 * WHY THIS IS A FUNCTION AND NOT TWO LITERAL LINES. Until 2026-10-26 the
 * shortfall branch printed one cause unconditionally: "a new skill puts every
 * skill already in the library one short; that is the usual cause." That
 * branch is reached on either of two conditions, an uncovered sibling
 * boundary or a skill with no `TRIGGER-TEST.md` at all, and the sentence
 * explains only the first. A library with full coverage and one missing
 * trigger test would therefore have been handed a diagnosis about near-miss
 * arithmetic, which is not its defect and whose repair would not have cleared
 * it. Latent rather than live: measured on this library the same day, 10 of
 * 10 skills carry a trigger test and 90 of 90 boundaries are covered, so this
 * branch has never run against the real library with only the second
 * condition set.
 *
 * It is the same error this seat published to another seat that morning, one
 * directory over, and `prompts/skill-extract.md` §5x is the rule both are
 * filed under: an instrument that names one cause for a condition with
 * several is a single hypothesis wearing the authority of a measurement, and
 * the reader who acts on it spends a run on the wrong repair. So each
 * condition explains itself, each names every cause this guard knows for it,
 * and where there is an order worth checking in, it says which to check
 * first.
 *
 * @param {{ gaps: unknown[], missingTrigger: unknown[] }} counts the two
 *   conditions that reach the shortfall branch; either may be empty
 * @returns {string[]} lines to print, in order, for the conditions that fired
 */
/** The counts a trigger test states about itself, in a fenced `counts` block
 *  rather than in its prose. Four keys, all integers:
 *
 *      ```counts
 *      prompts: 13
 *      should-fire: 4
 *      near-misses: 9
 *      neighbours: 9
 *      ```
 *
 *  Returns `null` when the file declares no block, which is itself a defect
 *  below, and an object of the keys it does declare otherwise. Unknown keys are
 *  returned too, so a typo surfaces as an unchecked key rather than as silence.
 *
 *  WHY A BLOCK AND NOT THE PROSE. This is the shape §5u proposed and declined
 *  to build, for the reason it gives: the honest check is not a search for
 *  number words. Two sentences in this library state a count historically,
 *  skills/README.md on a neighbour count that was true of a smaller library
 *  and §5r's own "15 of 30 ordered pairs", and both are correct as written and
 *  must stay. A check that parses English cannot tell them from a stale claim.
 *  A fenced block is invisible to that problem by construction: the file states
 *  its counts once, in one place, and the prose beside it is free to argue
 *  about any number it likes. */
export function declaredCounts(text) {
  const m = text.match(/^```counts\n([\s\S]*?)^```/m)
  if (!m) return null
  const out = {}
  for (const line of m[1].split('\n')) {
    const kv = line.match(/^\s*([a-z-]+)\s*:\s*(\d+)\s*$/)
    if (kv) out[kv[1]] = Number(kv[2])
  }
  return out
}

/** The four keys every trigger test declares, each with the function that
 *  measures it. `neighbours` is the §5c denominator, which is every other
 *  skill in the library. */
const COUNT_KEYS = {
  prompts: (s, lib) => s.shouldFire.length + s.nearMisses.length,
  'should-fire': (s) => s.shouldFire.length,
  'near-misses': (s) => s.nearMisses.length,
  neighbours: (s, lib) => lib.length - 1,
}

/**
 * Every count this library states about itself that disagrees with the library,
 * as `{ slug, file, key, said, measured }`, with `said` null when the statement
 * is missing rather than wrong.
 *
 * WHAT THIS IS FOR. §5u found nine false sentences in eight trigger tests after
 * the ninth skill landed, named the general form — a derived fact recorded by
 * hand beside the thing it is derived from — and left the check unbuilt. One
 * day later, on 2026-10-27, six of the ten trigger tests still said "the budget
 * is eight near misses" with nine neighbours, and three of the ten rows of
 * skills/README.md stated a ref count that was wrong by up to five. §5u's own
 * rule had been paid once, by the run that wrote it. So the rule is not the
 * repair here; the exit status is.
 *
 * The index's `Refs` column is checked in the same pass and not in a second
 * tool, because it is the same defect in the same library with the same cause,
 * and a reader who has to run two commands to learn that a count is stale will
 * run one.
 */
export function countDefects(library, indexRows, indexText = null) {
  const out = []
  for (const s of library) {
    if (s.trigger === null) continue
    const file = `skills/${s.slug}/TRIGGER-TEST.md`
    const said = declaredCounts(s.trigger)
    if (said === null) {
      out.push({ slug: s.slug, file, key: 'counts block', said: null, measured: null })
      continue
    }
    for (const [key, measure] of Object.entries(COUNT_KEYS)) {
      const measured = measure(s, library)
      if (!(key in said)) out.push({ slug: s.slug, file, key, said: null, measured })
      else if (said[key] !== measured) out.push({ slug: s.slug, file, key, said: said[key], measured })
    }
  }
  // The index's own `counts` block, which holds the library's size and the
  // area count beside it. Only `skills` is measured: an area is a judgement
  // §5e makes and this tool cannot, which the block says in its own prose. The
  // two live in one block rather than one sentence because that sentence is
  // what went wrong -- see skills/README.md under "Eight areas" and §5af.
  if (indexText !== null) {
    const said = declaredCounts(indexText)
    const file = 'skills/README.md'
    if (said === null) out.push({ slug: 'the library', file, key: 'counts block', said: null, measured: null })
    else if (!('skills' in said)) out.push({ slug: 'the library', file, key: 'skills', said: null, measured: library.length })
    else if (said.skills !== library.length) out.push({ slug: 'the library', file, key: 'skills', said: said.skills, measured: library.length })
  }

  const byDir = new Map(library.map((s) => [s.slug, s]))
  for (const row of indexRows) {
    const s = byDir.get(row.dir)
    if (!s) continue
    const measured = s.refs
    if (row.refs === null) out.push({ slug: row.dir, file: 'skills/README.md', key: 'refs', said: null, measured })
    else if (row.refs !== measured) out.push({ slug: row.dir, file: 'skills/README.md', key: 'refs', said: row.refs, measured })
  }
  return out
}

/**
 * The areas this library's index says it is cut into, read three ways, and
 * whether the three agree, as `{ file, line, kind, said, measured, quote }`.
 *
 * WHY THERE IS A FOURTH CONSTRUCT HERE AND NOT A WIDER PATTERN. The 2026-10-27
 * ledger entry that proposed this ran the obvious repair first, which is to
 * point `libraryCountsInBody` at `skills/README.md`, and measured what it
 * returns: nine hits, none of them the live defect. The index is a different
 * kind of document from a skill body. Its job includes recording and quoting
 * counts, so the discriminator that works on a body, that any present-tense
 * count of the library is wrong there, is false here. What was wanted instead
 * was the §5ag shape: one gradeable construct with a computable denominator.
 * This is it.
 *
 * THE DENOMINATOR IS THE LIST, NOT A JUDGEMENT. How many areas this library has
 * is a §5e judgement no tool makes, and the block beside the heading says so in
 * its own prose. How many areas are **labelled** is a count of `**The ... area.**`
 * paragraph openers, which is a grep. The judgement is still the author's, and
 * it is expressed by which labels exist rather than by a number written beside
 * them; so an area the author means and never labels is reported here, which is
 * the right answer, because a reader counting the list cannot see it either.
 *
 * THREE STATEMENTS AND TWO ARE GRADED. The labels are the denominator. The
 * heading ordinal and the `areas` key are both claims about it, in one file,
 * and they go stale by the same mechanism: a run that adds an area edits the
 * list it is writing and not the two sentences counting it.
 *
 *   * **The heading.** `## Eight areas, and the edges between them`. This is
 *     the one the ledger entry named, and the construct it is an instance of
 *     had already failed once: §5u's pair-count sentence, repaired by hand with
 *     a note saying that one instance is a hand repair and two is a check.
 *   * **The `areas` key**, which the proposal as written left ungraded, and
 *     this is the one place the implementation is wider than the entry. The
 *     reason is measured rather than argued: on `main` at the time of writing
 *     the heading says seven over six labels, and there is no `counts` block at
 *     all, so the proposal as written catches `main`'s live defect and would
 *     have said nothing about the key. Grading the heading alone leaves the key
 *     free to contradict a heading this guard has just certified, which is the
 *     same hole one argument to the left.
 *
 * A DIGIT IS A COUNT TOO. The 2026-10-27 entry's sharpest finding was that the
 * detector it tried matches spelled number words and the live defect was
 * written as a digit. So the ordinal is read as either, and a word this guard
 * does not know is reported as unreadable rather than skipped, because silence
 * about a claim is the failure mode this whole file exists to remove.
 *
 * NOTHING IS REQUIRED TO BE SAID. A README with no such heading and no `areas`
 * key gets no finding. That is deliberate and it is the opposite of the rule
 * one function up, where a trigger test with no `counts` block is itself a
 * defect, because §5ae requires that block and no rule requires this heading.
 * A guard that invented the requirement would be writing a §5 section in an
 * exit status instead of in the file where the conventions live.
 *
 * It sits beside `countDefects` rather than beside `proseOnly` and `SPELLED`,
 * which it borrows and which are declared below it, because the two functions
 * read one file about one fact and a reader opening this one wants the other
 * in view.
 */
export function areaHeadingDefects(indexText) {
  if (!indexText) return []
  // The heading and the labels are prose, so a fenced sample of either cannot
  // stand in for one; the `areas` key is read from the raw text because it
  // lives inside the fence on purpose. `proseOnly` blanks fences line for line,
  // so the reported line still points where a reader will look.
  const prose = proseOnly(indexText)
  const labels = [...prose.matchAll(AREA_LABEL)].map((m) => m[1])
  if (!labels.length) return []
  const measured = labels.length
  const out = []
  const file = INDEX_REL
  const h = AREA_HEADING.exec(prose)
  if (h) {
    const line = prose.slice(0, h.index).split('\n').length
    const quote = h[0].trim()
    const said = /^\d+$/.test(h[1]) ? Number(h[1]) : SPELLED[h[1].toLowerCase()]
    if (said === undefined) out.push({ file, line, kind: 'unreadable', said: null, measured, quote })
    else if (said !== measured) out.push({ file, line, kind: 'heading', said, measured, quote })
  }
  const block = declaredCounts(indexText)
  if (block && 'areas' in block && block.areas !== measured) {
    const lines = indexText.split('\n')
    const line = lines.findIndex((l) => /^\s*areas\s*:\s*\d+\s*$/.test(l)) + 1
    out.push({ file, line, kind: 'block', said: block.areas, measured, quote: `areas: ${block.areas}` })
  }
  return out
}

/** Why an area count is wrong, and the two causes this guard separates. One
 *  explanation per condition, per §5z. */
export function explainAreas(defects) {
  const lines = []
  if (defects.some((d) => d.kind === 'heading' || d.kind === 'block')) {
    lines.push('The number of labelled areas is a grep over `**The ... area.**` openers, and the')
    lines.push('heading and the `areas` key are two restatements of it written by hand. A run')
    lines.push('that adds an area edits the list and not the two sentences counting the list.')
    lines.push('Swept over every commit touching the index, that is clean through 2026-10-26')
    lines.push('and red from the commit that landed the ninth skill: `## Seven areas` over six')
    lines.push('labels, in the same breath as the skill the heading was moved for.')
    lines.push('The repair is to copy the measured number into whichever of the two is wrong, in')
    lines.push('this pull request, and to move the area label if the list is what is wrong:')
    lines.push('the labels are the denominator here, so deciding the list is deciding the count.')
  }
  if (defects.some((d) => d.kind === 'unreadable')) {
    lines.push('An ordinal this guard cannot read is a claim it cannot grade, reported rather')
    lines.push('than skipped. Write the heading with a digit or with a spelled number up to')
    lines.push('twelve, or widen `SPELLED` in skills/trigger-coverage.mjs if this library has')
    lines.push('genuinely outgrown it.')
  }
  return lines
}

/** The library named as a bare noun, which is the only thing a skill body ever
 *  counts in units of skills. `skills/` the directory, `skills[].x` a field and
 *  a hyphenated word are all excluded, so the trigger is the English word. */
const LIBRARY_NOUN = /(?<![/`\w-])skills(?![/\w-])/

/** The counts this rule refuses, as a closed set of spelled words rather than
 *  as a number pattern. Three exclusions, each paid for:
 *
 *    * `one` is a pronoun in this house voice far more often than a count --
 *      "This one works on the gate itself" is in the paragraph that produced
 *      this rule -- so including it would flag the sentence doing the repair.
 *    * Digits are excluded because a skill body's digits are version strings,
 *      percentages and reference ids. `0.5.0` in
 *      `adjudicating-uncertain-spans` is three digit runs and no count.
 *    * `both` is included, because a count of two is the one this library has
 *      already gone stale on in prose: `quoting-...`'s trigger test said "both
 *      boundaries this skill has are tested" for three weeks after it had five.
 *
 *  The residue is therefore a library count written in digits, which no
 *  paragraph in this library does and which §5ae's one-sentence-one-number rule
 *  covers in prose. */
const LIBRARY_COUNT = /\b(two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|both)\b/gi

/** Frontmatter and fenced blocks blanked to the same number of lines, so a
 *  `what` field or a code sample cannot reach the prose rule and line numbers
 *  still point where a reader will look. */
const proseOnly = (text) => text
  .replace(/^---\n[\s\S]*?\n---\n/, (m) => '\n'.repeat(m.split('\n').length - 1))
  .replace(/^```[\s\S]*?^```/gm, (m) => '\n'.repeat(m.split('\n').length - 1))

/**
 * Every paragraph of a SKILL.md body that names the library and states a count
 * of it, as `{ line, counts, quote }`.
 *
 * WHY THE PARAGRAPH AND NOT THE SENTENCE, which is the whole design. §5ae's
 * measured cause is a sentence carrying two derived numbers, where the one
 * nobody is thinking about survives the repair. Scoped to the sentence, this
 * rule reproduces that: `Those four skills work on outcome_record.json` names
 * the library and the sentence after it, `it sits across a handoff from all
 * four`, does not, so the second `four` would stay. Scoped to the paragraph
 * both are caught, and a count in that paragraph about something other than the
 * library is not a false positive but a second thought, whose repair is a blank
 * line -- which is this house's prose rule anyway.
 *
 * WHY A REFUSAL AND NOT A MEASUREMENT, unlike every other count this file
 * checks. The subset a sentence means is a judgement §5e makes and no parser
 * can: `the three skills in the record area` was right while `four skills`,
 * one directory over, meant every other skill in the library and was wrong by
 * five. So there is no number to compare against. What there is instead is
 * §5ae's own rule 2 -- a sentence that needs a count names its members -- which
 * has a determinate repair, needs no judgement from the checker, and leaves a
 * paragraph that cannot go stale, because a named sibling is a path a receipt
 * guard already resolves.
 */
export function libraryCountsInBody(text) {
  const out = []
  const prose = proseOnly(text)
  let offset = 0
  for (const para of prose.split(/\n\s*\n/)) {
    const line = prose.slice(0, prose.indexOf(para, offset)).split('\n').length
    offset = prose.indexOf(para, offset) + para.length
    if (!LIBRARY_NOUN.test(para)) continue
    const counts = [...para.matchAll(LIBRARY_COUNT)].map((m) => m[0])
    if (counts.length) out.push({ line, counts, quote: para.replace(/\s+/g, ' ').trim().slice(0, 90) })
  }
  return out
}

/**
 * Every skill body that counts the library instead of naming it, as
 * `{ slug, file, line, counts, quote }`.
 *
 * WHAT THIS IS FOR. §5ae built the count check one layer up, for the trigger
 * tests and the index, and declared one residue safe by argument: "a count
 * stated inside a SKILL.md body is not measured here either, and that is a
 * different case rather than a gap of the same kind, because a body's counts
 * are claims about records and are covered by the receipts." That is true of
 * every body count about a record and false of the subclass that counts the
 * library, which cites nothing and so is fingerprinted by nothing.
 *
 * Measured on this tip's parent, 2026-10-27. Five paragraphs in the ten bodies
 * name the library; all five stated a count; two were wrong by five and by
 * four, both saying a skill sits across a handoff from the library as it stood
 * on the day that skill landed. The `neighbours` key in the same directory's
 * TRIGGER-TEST.md said 9 and was checked, in both cases, by this file.
 *
 * WHAT IT MUST NOT POLICE, which the engineer seat wrote down first.
 * `ursa-major/src/prose-bound-count.test.ts` gates the same defect class in
 * the product and puts `skills/` out of its scope, partly because a skill's
 * count is often a quotation of another file's prose and "correcting a
 * quotation to match today's count would falsify the record of what the quoted
 * file said". E29 in this library is that case. The trigger here is the library
 * naming itself, so a quoted count is unreachable unless the same paragraph
 * also names the skills as a set, and none of the ten does. The two gates meet
 * without overlapping. See `prompts/skill-extract.md` §5af.
 */
export function bodyCountDefects(library) {
  const out = []
  for (const s of library) {
    if (s.skillText === null || s.skillText === undefined) continue
    for (const hit of libraryCountsInBody(s.skillText))
      out.push({ slug: s.slug, file: `skills/${s.slug}/SKILL.md`, ...hit })
  }
  return out
}

/** The spelled counts this guard can grade, as a word-to-number map. `one` is
 *  in, unlike in LIBRARY_COUNT, because here the subject is pinned by a slug
 *  and "`<slug>` has one neighbour" cannot be the pronoun. */
const SPELLED = {
  one: 1, two: 2, three: 3, four: 4, five: 5, six: 6,
  seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12,
}

/**
 * A named skill's neighbour count, stated in the present tense, where the noun
 * ends its clause. Three parts, and each one is an exclusion paid for by a case
 * in the control set below rather than chosen for convenience.
 *
 *   * The backticked slug. This is what makes the construct gradeable at all,
 *     and it is the reason this is not the prose-number check §5ae rule 3
 *     declined to build. The slug fixes the subject, the denominator comes from
 *     the directory listing, and nothing is left to guess at. `prompts/skill-
 *     extract.md` §5u's "every skill has nine neighbours" has no slug and is
 *     not graded here; its subject is whichever skill the paragraph is about.
 *   * `has`, not `had`. §5u's measured table is headed "every skill had seven
 *     neighbours" and is the record of a tree that no longer exists. Correcting
 *     it would falsify the record, which is the line
 *     `ursa-major/src/prose-bound-count.test.ts` drew and §5af restated.
 *   * The clause boundary after the noun. §5r's amendment says
 *     "`adjudicating-uncertain-spans` has two neighbours sharing no file with
 *     it at all", which is a count of a subset and is correct. A restrictive
 *     modifier means a subset, and a subset has no computable denominator, so
 *     §5ae rule 2 covers it instead: name the members, which that sentence
 *     does.
 *
 * Two of those three cost something to get right, and both were found by this
 * run's own control set rather than reasoned about in advance.
 *
 *   * **A hard line wrap is not a clause boundary.** The first draft ended the
 *     lookahead with `\s*$` under the `m` flag, so a restrictive modifier that
 *     happened to wrap onto the next line read as the end of a clause. It
 *     flagged §5ag's own quotation of §5r, which is the correct sentence, in
 *     the paragraph explaining why that sentence is correct. Prose in this
 *     repository is hard-wrapped at about 72 columns, so end-of-line carries no
 *     grammatical information at all and the lookahead now requires real
 *     punctuation or a conjunction.
 *   * **A quotation mark is not a clause boundary either, deliberately.** §5af
 *     drew the line this guard must not cross, which is that correcting a
 *     quotation to match today's number falsifies the record of what the quoted
 *     file said. §5ag quotes §5e's stale sentence in order to report it, so a
 *     guard that policed quotations would demand the repair be written as a
 *     falsehood. `"` is therefore absent from the boundary class on purpose
 *     rather than by oversight.
 */
const NEIGHBOUR_CLAIM = new RegExp(
  '`([a-z][a-z0-9-]+)`' +            // the slug, backticked
  '\\s+has\\s+(' + Object.keys(SPELLED).join('|') + ')' +
  '\\s+(neighbours?)' +
  '(?=[,.;:)]|\\s+(?:and|but|so|which|because|rather)\\b)',
  'g',
)

/**
 * Every present-tense neighbour count in `prompts/skill-extract.md` that
 * disagrees with the live denominator, as `{ file, line, slug, said, measured,
 * quote }`.
 *
 * WHY THIS FILE. §5ae put the trigger tests and the index under an exit status
 * and §5af put the ten `SKILL.md` bodies under one, which between them is every
 * markdown file in `skills/`. It is not every file that states a count of the
 * library, because both rules are written in `prompts/skill-extract.md` and
 * that file states counts of the library too. Nothing scoped the file the rules
 * are written in. See §5ag.
 *
 * WHY IT GRADES RATHER THAN REFUSES, unlike `bodyCountDefects` one layer down.
 * There the subset a sentence meant was a §5e judgement with no number to
 * compare against. Here the slug names the subject and `neighbours` is the §5c
 * denominator, which `COUNT_KEYS` already computes, so there is a right answer
 * and the repair is to copy it in.
 *
 * Measured on this tip's parent, 2026-10-27. The pattern finds eight
 * occurrences across this file and the ten trigger tests. One is wrong: §5e's
 * worked example said "`distilling-a-tuning-record` has three neighbours",
 * which was the whole library on 2026-10-05 and is nine now. The other seven
 * are the control set, and the three exclusions above are each there for one of
 * them. The cause is new: §5r's own header says it amends §5e, and it amended
 * the rule 750 lines further down while leaving the worked example standing
 * with the superseded counts in it.
 */
export function specNeighbourDefects(specText, library) {
  if (!specText) return []
  const out = []
  const measured = COUNT_KEYS.neighbours(null, library)
  for (const m of specText.matchAll(NEIGHBOUR_CLAIM)) {
    const [, slug, word, noun] = m
    if (!library.some((s) => s.slug === slug)) continue
    const said = SPELLED[word]
    if (said === measured) continue
    const line = specText.slice(0, m.index).split('\n').length
    out.push({
      file: SPEC_REL, line, slug, said, measured,
      quote: `\`${slug}\` has ${word} ${noun}`,
    })
  }
  return out
}

/**
 * The `## <id>. <title>` sections of `prompts/skill-extract.md`, in file order,
 * as `{ id, line, title, end, lines }`. `line` is 1-indexed and `lines` runs
 * from the header to the line before the next header.
 *
 * File order and not identifier order, because this file is append-only prose:
 * §5b sits before §6, and every section after §5c was appended in the order it
 * was written. File order is therefore chronological, which is the order a
 * reader of the amendments wants.
 */
export function specSections(specText) {
  const lines = specText.split('\n')
  const heads = []
  lines.forEach((l, i) => {
    const m = /^##\s+([0-9][0-9a-z]*)\.\s+(.+)$/.exec(l)
    if (m) heads.push({ id: m[1], line: i + 1, title: m[2] })
  })
  return heads.map((h, k) => {
    const end = k + 1 < heads.length ? heads[k + 1].line - 1 : lines.length
    return { ...h, end, lines: lines.slice(h.line - 1, end) }
  })
}

/** The non-blank runs of a section's lines, as `{ start, end }` indices into
 *  it. Paragraph-wise and not line-wise, because the note a section opens with
 *  wraps over four lines in §5aa and one in §5c, and a rule that only ever
 *  looked at the first line of it would be right about §5c by luck. */
function paragraphs(lines) {
  const out = []
  let i = 0
  while (i < lines.length) {
    if (lines[i].trim() === '') { i++; continue }
    const start = i
    while (i < lines.length && lines[i].trim() !== '') i++
    out.push({ start, end: i - 1 })
  }
  return out
}

/** The section's own dated note, the `(Added …)` paragraph directly under its
 *  header, or null. This is the only text an amendment claim is read out of. */
function openingNote(sec) {
  const paras = paragraphs(sec.lines)
  const first = paras[1]
  if (!first) return null
  if (!/^\(Added\b/.test(sec.lines[first.start])) return null
  return { ...first, text: sec.lines.slice(first.start, first.end + 1).join(' ') }
}

/** The generated back pointer, recognised by its opening words. A paragraph is
 *  either this line or it is prose, and the two are never merged, which is what
 *  makes the line safe to delete and rewrite. */
const BACK_POINTER = /^\(Amended by /

/**
 * The clause a section's note uses to declare what it amends. One inflection
 * of `amend`, then a list of `§<id>` optionally carrying `part <n>`, and it
 * stops at the first thing that is not another reference.
 *
 * The stop matters. §5ad's note reads "amending §5aa part 4 and answering the
 * remedy Ursa's exo seat proposed", and three lines later mentions §5aa again
 * in a sentence that is not a claim about amendment. A pattern that ran to the
 * end of the sentence read that second mention as a second edge and reported
 * the same pair twice, which is how the first draft of this check behaved.
 *
 * THREE INFLECTIONS AND NOT ONE, and the widening is the repair of a silent
 * drop rather than a convenience. The rule this pattern enforces is stated in
 * §5ah as "a section whose dated note **says it amends** §N", and until
 * 2026-11-02 the pattern read only the gerund. A note writing the claim as
 * "Amends §5s and §5w" therefore declared an amendment that this check could
 * not see, and the mode printed "every amended section names its amendments"
 * over a population it had dropped that note from. Measured on the file the
 * day it was found: **32** sections carry a dated note, **31** spell the claim
 * `amending`, and the one that spelled it `Amends` was the section being
 * added, so the drop was 1 of 32 and the clean line was the only output.
 * Case-insensitive for the same reason: the claim opens a sentence as often as
 * it sits inside one.
 *
 * Widening a verb cannot invent an edge from this file's commentary about
 * itself, because the only text any of this reads is the dated note
 * (`openingNote`), and a note is one paragraph a section writes about its own
 * provenance. The negative control is in the tests: a note that discusses
 * amendment without claiming one yields no edge.
 */
const AMENDING = /\bamend(?:s|ing|ed)\s+((?:§[0-9][0-9a-z]*(?:\s+part\s+\d+)?(?:\s*,\s*|\s+and\s+)?)+)/i
const ONE_REF = /§([0-9][0-9a-z]*)(?:\s+part\s+(\d+))?/g

/**
 * The wider pattern, whose only job is to split an absence into "nothing here"
 * and "something here this check cannot read". It decides nothing on its own
 * and it is never the source of an edge.
 *
 * WHY WIDENING `AMENDING` WAS THE WRONG REPAIR ON ITS OWN, which is a fact
 * about the commit directly above this one. On 2026-11-02 the pattern read one
 * inflection, a note spelled the claim `Amends`, and the edge was dropped in
 * silence. The repair was three inflections. That moved the boundary and left
 * every arm that reasons from this pattern's silence exactly as it was: a
 * fourth spelling still produces the same outcome, and nothing in the output
 * distinguishes the fourth spelling from a note that claims nothing.
 *
 * AND THE DROP IS NOT THE EXPENSIVE HALF. `amendmentDefects` has two arms that
 * read this pattern's silence as a positive finding. `missing` tells a section
 * it "says so nowhere"; `orphan` tells a section that no note claims it. Both
 * exit 1 and both name a repair. So an unrecognised spelling does not merely
 * fail to fire here: it manufactures the absence it reports, and the operator
 * is told a falsehood with a non-zero exit status rather than told nothing.
 * Measured on this file: re-spelling §5ak's claim as "An amendment to §5s and
 * §5w" drops 2 of the 11 edges and accuses §5s and §5w of carrying back
 * pointers that nothing earned. Re-wording §5's back pointer, or merely
 * indenting it two spaces, reports "§5 is amended by §5c and says so nowhere"
 * about a file that says so on line 112.
 *
 * THE SHAPE IS URSA'S EXO SEAT'S, offered on the board on 2026-11-02 and
 * re-derived here before use: an arm keyed on the absence of a known phrase
 * manufactures the absence rather than only failing to fire. That seat graded
 * it on `tools/board/check.mjs`, where 32 bodies were told their verdict had
 * been cut while it sat at offset zero. Confirmed in this clone against this
 * seat's own 2,034-character `done` of 03:43: two decisions at offsets 233 and
 * 729, a cut at 1,453, and `dispositionRisk` returns `markers_found: 0`,
 * because the list carries `not merged` and `I took` and neither `I did not
 * <verb>` nor an affirmative `I merged`. `tools/` is not this seat's to write,
 * so that half stays with that seat; this is the same defect in the one place
 * this seat owns.
 *
 * WHY THIS PATTERN AND NOT A LOOSER ONE. An `amend` word within thirty
 * characters of a `§` reference, stopping at a sentence end. The obvious looser
 * form, any `amend` word anywhere in the text together with any reference, was
 * tried first and fires on §5ai's live note, which says it "amends the entry's
 * first step" and separately mentions a `§5` section: a discriminator that
 * reports a false near-hit on the clean file cannot discriminate. Measured
 * across five variants of this file, the pattern below returns 0 near-claims
 * and 0 near-pointers on the live text and finds each of the three re-spellings
 * above.
 *
 * AND THE LIMIT, STATED BECAUSE IT IS THE RULE'S OWN COST. This is a second
 * vocabulary, not an escape from having one. A claim written without any
 * `amend` word — "This section supersedes §5s" — is invisible to it, and on
 * that variant this check correctly reports finding nothing, which is not the
 * same as there being nothing. That is why the verdict line prints the
 * vocabulary it searched with: the honest form of this check's clean line is a
 * statement about what it read for, never a universal about the file.
 */
const NEAR_AMENDMENT = /\bamend\w*\b[^.§]{0,30}§[0-9]/i

/** One line's worth of a quoted paragraph, collapsed and ellipsised. The same
 *  shape `specNeighbourDefects` uses at line 611, kept as a function because
 *  two call sites below quote and the defect detail has to be one line. */
const clip = (text, n) => {
  const flat = String(text || '').replace(/\s+/g, ' ').trim()
  return flat.length <= n ? flat : `${flat.slice(0, n).trimEnd()}…`
}

/** The vocabulary, printed in the verdict so the clean line is a claim about
 *  what was searched for and not about the file. */
export const AMENDMENT_VOCABULARY =
  '3 inflections of "amend" followed by a reference for a claim, the exact opening' +
  ' "(Amended by " for a back pointer, and an "amend" word within 30 characters of a' +
  ' reference for either in a form this check cannot read'

/**
 * Every dated note that resembles an amendment claim and is not one, as
 * `{ id, line, text }`. This is the population `amendmentEdges` dropped and
 * the population the `orphan` arm would otherwise accuse a section over.
 *
 * Exported because a caller that prints an absence needs to be able to say
 * whether the absence was observed or assumed, and because the alternative to
 * exporting it is a second copy of the pattern at the call site.
 */
export function unreadableAmendmentClaims(specText) {
  if (!specText) return []
  const out = []
  for (const sec of specSections(specText)) {
    const note = openingNote(sec)
    if (!note) continue
    if (AMENDING.test(note.text)) continue
    if (!NEAR_AMENDMENT.test(note.text)) continue
    out.push({ id: sec.id, line: sec.line + note.start, text: note.text })
  }
  return out
}

/**
 * Every amendment this file declares, as `{ from, to, part, line }`, in file
 * order of the amending section. `part` is the sub-part named in the clause or
 * null, and it is carried through because §5aa amends part 3 of §5t and a
 * reader of §5t needs to know which part is no longer current.
 *
 * WHY THIS EXISTS. §5ag measured that §5r's note said it amended §5e, that it
 * did amend §5e 750 lines further down, and that §5e's worked example kept the
 * counts the amendment superseded, for twenty-two days. A header that says it
 * amends another section is a claim that the two agree, and until §5ah nothing
 * checked it. The counts half of that defect was gradeable against a
 * denominator and `specNeighbourDefects` grades it. This is the general case,
 * which has no denominator: the claim is about two sections, so the only thing
 * that can check it is the other section.
 */
/**
 * What the amendment graph was read over, so that its verdict can name a
 * denominator instead of asserting a universal.
 *
 * `sections` is every `## 5*` section in the file, `notes` the subset carrying
 * a dated `(Added …)` note, which is the only text an amendment claim is read
 * out of, and `claiming` the subset of those whose note declares at least one
 * edge. The gap between `sections` and `notes` is the population this check
 * cannot speak for at all, and the gap between `notes` and `claiming` is the
 * population it read and found nothing in. Those are different facts and
 * "every amended section names its amendments" stated neither.
 *
 * This exists because the pattern above dropped one note for a month without
 * any output changing: there was no number for the drop to move. A verdict
 * over an unstated population cannot disagree with anything.
 */
export function amendmentPopulation(specText) {
  if (!specText) return { sections: 0, notes: 0, claiming: 0 }
  const secs = specSections(specText)
  const withNote = secs.filter((sec) => openingNote(sec) !== null)
  const claiming = withNote.filter((sec) => AMENDING.test(openingNote(sec).text))
  return { sections: secs.length, notes: withNote.length, claiming: claiming.length }
}

export function amendmentEdges(specText) {
  if (!specText) return []
  const out = []
  for (const sec of specSections(specText)) {
    const note = openingNote(sec)
    if (!note) continue
    // Every amending clause in the note, not the first one. `exec` read one,
    // and a note that amends two sections in two sentences — which is what a
    // run does when it narrows one rule and widens another in the same pass —
    // had its second claim dropped with nothing in any output changing,
    // measured on 2026-11-02 on this file's own newest section. That is the
    // defect §5al named one level down, where the drop was a spelling of the
    // verb rather than a second use of it, and the reason it survived the
    // repair is that widening a pattern does not change how many times it is
    // read. `amendmentPopulation` counted the section as claiming, because it
    // tests rather than captures, so the population arm said nothing was
    // missing while the edge arm was a claim short.
    const seen = new Set()
    let any = false
    for (const m of note.text.matchAll(new RegExp(AMENDING.source, 'gi'))) {
      any = true
      for (const r of m[1].matchAll(ONE_REF)) {
        const to = r[1]
        if (seen.has(to)) continue
        seen.add(to)
        out.push({ from: sec.id, to, part: r[2] ? `part ${r[2]}` : null, line: sec.line })
      }
    }
    if (!any) continue
  }
  return out
}

/** The one sentence §N carries once some other section amends it. Short on
 *  purpose: everything in it is derived, so there is nothing for a reader to
 *  disagree with and nothing for a later run to have to preserve by hand. */
export function backPointerLine(amenders) {
  const refs = amenders.map((a) => `§${a.from}${a.part ? ` (${a.part})` : ''}`)
  const list = refs.length === 1 ? refs[0]
    : `${refs.slice(0, -1).join(', ')} and ${refs[refs.length - 1]}`
  return `(Amended by ${list}. Generated line, per §5ah.)`
}

/** Wrapped to the width the rest of the file is written at, so the generated
 *  paragraph reads as part of the document. Greedy and deterministic, because
 *  the check compares normalized text and `--write` has to produce the same
 *  bytes twice. */
function wrap(text, width = 70) {
  const out = []
  let line = ''
  for (const word of text.split(' ')) {
    if (line && line.length + 1 + word.length > width) { out.push(line); line = word }
    else line = line ? `${line} ${word}` : word
  }
  if (line) out.push(line)
  return out
}

const normalize = (s) => s.replace(/\s+/g, ' ').trim()

/** The last line of the paragraph the back pointer goes after: the section's
 *  dated note when it has one, and the header itself when it does not. §5 has
 *  no note, and §5 is the section §5c amends, so this is the live case and not
 *  a hypothetical. */
function anchorEnd(sec) {
  const note = openingNote(sec)
  return note ? note.end : 0
}

/** Which paragraph of the section the back pointer must be, counting the header
 *  as paragraph 0.
 *
 *  Stated as a paragraph index and not as a line offset from the anchor,
 *  because the first draft compared `start` against `anchorEnd(sec) + 1` and
 *  forgot the blank line every paragraph break carries. It wrote all seven back
 *  pointers in the right place and then reported all seven as misplaced, on the
 *  run right after the one that wrote them. Found by running `--write` twice
 *  rather than by reading the arithmetic. */
function wantParagraph(sec) {
  return openingNote(sec) ? 2 : 1
}

/**
 * Every defect in the amendment graph, as `{ kind, from, to, line, detail }`.
 *
 * Five kinds, each a different piece of work:
 *
 * - `dangling` — the note names a section that is not in the file. Nothing can
 *   be repaired in the amended section, because there is no amended section.
 * - `self` — a section that declares it amends itself, which is a typo in the
 *   identifier and would otherwise generate a back pointer to nowhere useful.
 * - `missing` — §N is amended and carries no back pointer. Seven of the eight
 *   edges were in this state when §5ah was written.
 * - `stale` — §N carries a back pointer that disagrees with the graph, which is
 *   what happens when a later section amends it and nobody reruns `--write`.
 * - `misplaced` — the back pointer is in the section but not where a reader who
 *   stops after the first paragraph will see it, which is the whole failure
 *   this rule exists to stop.
 * - `orphan` — a back pointer in a section no edge points at.
 * - `unreadable-claim` — a dated note that resembles an amendment claim in a
 *   spelling `AMENDING` does not carry. Reported in its own right, because the
 *   alternative is a dropped edge plus a false `orphan` somewhere else in the
 *   file, which is two wrong answers from one unrecognised word.
 * - `unreadable-pointer` — the paragraph where the back pointer belongs holds
 *   something that resembles one. This is what `missing` used to be reported
 *   as, and `missing` now means the paragraph holds neither.
 *
 * The last two exist because the five above are decided by a pattern's silence
 * and two of them turn that silence into an accusation. See `NEAR_AMENDMENT`.
 */
export function amendmentDefects(specText) {
  if (!specText) return []
  const secs = specSections(specText)
  const byId = new Map(secs.map((s) => [s.id, s]))
  const edges = amendmentEdges(specText)
  const amenders = new Map()
  const out = []
  // First, because every verdict below is read out of `AMENDING`'s silence and
  // these are the notes whose silence is not evidence.
  const unreadable = unreadableAmendmentClaims(specText)
  for (const u of unreadable)
    out.push({ kind: 'unreadable-claim', from: u.id, to: null, line: u.line, part: null,
      detail: `§${u.id}'s note names a section next to an amendment word in a spelling this` +
        ` check does not read, so its edges are not in the graph: "${clip(u.text, 90)}"` })
  for (const e of edges) {
    if (e.to === e.from) { out.push({ kind: 'self', ...e, detail: `§${e.from} declares it amends itself` }); continue }
    if (!byId.has(e.to)) { out.push({ kind: 'dangling', ...e, detail: `§${e.from} declares it amends §${e.to}, which is not a section of this file` }); continue }
    if (!amenders.has(e.to)) amenders.set(e.to, [])
    amenders.get(e.to).push(e)
  }
  for (const sec of secs) {
    const mine = amenders.get(sec.id) ?? []
    const paras = paragraphs(sec.lines)
    const found = paras.filter((p) => BACK_POINTER.test(sec.lines[p.start]))
    const want = mine.length ? backPointerLine(mine) : null
    if (!want) {
      for (const p of found)
        out.push({ kind: 'orphan', from: null, to: sec.id, line: sec.line + p.start, part: null,
          // Qualified when there is an unreadable claim in the file, because
          // then the absence of an edge is this check's reading and not an
          // observation, and the orphan may be that note's dropped edge.
          detail: `§${sec.id} carries a back pointer and no section declares it amends §${sec.id}` +
            (unreadable.length
              ? ` in a form this check reads; ${unreadable.length} note${unreadable.length === 1 ? '' : 's'} above` +
                ` ${unreadable.length === 1 ? 'is an unreadable claim' : 'are unreadable claims'},` +
                ` so this may be ${unreadable.length === 1 ? 'its' : 'one of their'} dropped edge`
              : '') })
      continue
    }
    if (!found.length) {
      // Split, because "says so nowhere" is a claim about the file and the
      // only thing observed is that one exact opening did not match. The
      // paragraph the generated line is required to occupy is the whole scope
      // of the question, so it is the whole scope of this read.
      const at = paras[wantParagraph(sec)]
      const near = at ? sec.lines[at.start] : null
      if (near !== null && NEAR_AMENDMENT.test(near))
        out.push({ kind: 'unreadable-pointer', from: mine.map((a) => a.from).join(', '), to: sec.id,
          line: sec.line + at.start, part: null,
          detail: `§${sec.id} is amended by ${mine.map((a) => `§${a.from}`).join(' and ')} and the` +
            ` paragraph its back pointer belongs in says so in a form this check does not read:` +
            ` "${clip(near, 80)}"` })
      else
        out.push({ kind: 'missing', from: mine.map((a) => a.from).join(', '), to: sec.id, line: sec.line, part: null,
          detail: `§${sec.id} is amended by ${mine.map((a) => `§${a.from}`).join(' and ')} and` +
            ` carries nothing resembling a back pointer where one belongs` })
      continue
    }
    if (found.length > 1) {
      out.push({ kind: 'misplaced', from: null, to: sec.id, line: sec.line + found[1].start, part: null,
        detail: `§${sec.id} carries ${found.length} back pointers, and only one of them can be the generated line` })
      continue
    }
    const at = found[0]
    const have = normalize(sec.lines.slice(at.start, at.end + 1).join(' '))
    if (have !== normalize(want))
      out.push({ kind: 'stale', from: mine.map((a) => a.from).join(', '), to: sec.id, line: sec.line + at.start, part: null,
        detail: `§${sec.id} says "${have}", the graph says "${want}"` })
    else if (paras.indexOf(at) !== wantParagraph(sec))
      out.push({ kind: 'misplaced', from: null, to: sec.id, line: sec.line + at.start, part: null,
        detail: `§${sec.id}'s back pointer is paragraph ${paras.indexOf(at)} of the section` +
          ` and belongs at ${wantParagraph(sec)}, so a reader who stops after the first` +
          ` paragraph does not see it` })
  }
  return out
}

/**
 * `specText` with every back pointer regenerated from the graph, and the count
 * of sections changed.
 *
 * Two passes rather than one, and each walks the sections backwards. Deleting
 * first and recomputing the sections before inserting is what keeps the line
 * numbers honest; doing both in one walk means every index after the first edit
 * is off by the size of that edit. Backwards, because an edit low in the file
 * cannot move a section above it.
 */
export function withBackPointers(specText) {
  // Refused, not attempted, when any note's claim is unreadable. This function
  // deletes every recognised back pointer and rebuilds from the edges it could
  // read, so one unrecognised spelling makes it delete a correct line and not
  // put it back. Measured: against §5ak's claim re-spelled as "An amendment
  // to", a `--write` removes §5s's and §5w's back pointers and writes neither.
  // A tool that destroys the record it cannot parse is worse than one that
  // stops, which is why this is the only refusal in this file's writers.
  const unreadable = unreadableAmendmentClaims(specText)
  if (unreadable.length)
    return { text: specText, changed: 0, refused: unreadable.map((u) => u.id) }
  let lines = specText.split('\n')
  for (const sec of [...specSections(lines.join('\n'))].reverse()) {
    for (const p of paragraphs(sec.lines).filter((q) => BACK_POINTER.test(sec.lines[q.start])).reverse()) {
      const from = sec.line - 1 + p.start
      const to = sec.line - 1 + p.end
      const blankBefore = from > sec.line - 1 && lines[from - 1].trim() === ''
      lines.splice(blankBefore ? from - 1 : from, to - (blankBefore ? from - 1 : from) + 1)
    }
  }
  const cleaned = lines.join('\n')
  const edges = amendmentEdges(cleaned)
  const secs = specSections(cleaned)
  const byId = new Map(secs.map((s) => [s.id, s]))
  const amenders = new Map()
  for (const e of edges) {
    if (e.to === e.from || !byId.has(e.to)) continue
    if (!amenders.has(e.to)) amenders.set(e.to, [])
    amenders.get(e.to).push(e)
  }
  lines = cleaned.split('\n')
  let changed = 0
  for (const sec of [...secs].reverse()) {
    const mine = amenders.get(sec.id)
    if (!mine) continue
    const at = sec.line - 1 + anchorEnd(sec) + 1
    lines.splice(at, 0, '', ...wrap(backPointerLine(mine)))
    changed++
  }
  return { text: lines.join('\n'), changed, refused: [] }
}

/** Why an amendment back pointer is owed, and what to run. One condition, so
 *  one explanation, per §5z. */
export function explainAmendments(defects) {
  if (!defects.length) return []
  const lines = [
    'A section note that says it amends §N, in any inflection of the verb, is a claim',
    'that this file and §N agree, and it is the one cross-reference here no reader can',
    'check cheaply, because the amended section is hundreds of lines away and does not',
    'know it was amended. §5e did not know for twenty-two days, and the worked example',
    'it kept was read as current by every run in between. The repair is not prose in',
    'the amending section. It is a generated line in the amended one, above the rule',
    'it supersedes, so the section cannot be read without its amendments.',
  ]
  if (defects.some((d) => d.kind === 'missing' || d.kind === 'stale' || d.kind === 'misplaced'))
    lines.push('Run `node skills/trigger-coverage.mjs --amendments --write` and commit the result.')
  if (defects.some((d) => d.kind === 'dangling' || d.kind === 'self'))
    lines.push('A dangling or self reference is a typo in the note and has to be fixed by hand;',
      '`--write` leaves it alone rather than inventing a section to point at.')
  if (defects.some((d) => d.kind === 'orphan'))
    lines.push('An orphan is a back pointer left behind by a note that stopped claiming the',
      'amendment. `--write` removes it.')
  if (defects.some((d) => d.kind === 'unreadable-claim'))
    lines.push('An unreadable claim is this check reaching the edge of its own vocabulary, and it',
      'is reported rather than passed over because the two arms above reason from this',
      'pattern\'s silence: a spelling it misses drops the edge and then accuses the amended',
      'section of carrying a back pointer nothing earned. Re-spell the note\'s clause as a',
      'verb followed by its references, `amends §N`, which is the form §5ah states the rule',
      'in. `--write` refuses while this is open, because rebuilding from a graph missing the',
      'edge deletes a correct back pointer and does not put it back.')
  if (defects.some((d) => d.kind === 'unreadable-pointer'))
    lines.push('An unreadable back pointer is a section that says it was amended in words this',
      'check does not read, which is a different finding from saying it nowhere and used to',
      'be reported as that one. The line is generated, so the hand-written sentence has to',
      'go and `--write` has to put the generated one in. Deleting it first is the whole of',
      'the repair: `--write` only removes paragraphs it recognises, so run on its own it',
      'adds the generated line beside the sentence and leaves a duplicate standing, and the',
      'verdict goes clean over a section that now says the same thing twice.')
  return lines
}

/** Why a spec neighbour count is wrong, and the one cause this guard knows.
 *  One condition, so one explanation, per §5z. */
export function explainSpecNeighbours(defects) {
  if (!defects.length) return []
  return [
    'A neighbour count in prompts/skill-extract.md is the §5c denominator written by',
    'hand in the file that defines it, so it goes stale the moment a skill lands and',
    'no receipt guard is ever red about it, because a count of skills/ cites no file.',
    'The cause this guard was built from is not a seat forgetting. A later section',
    'amended the rule and said so in its own header, and the worked example under the',
    'amended section kept the counts the amendment superseded. A diff cannot show',
    'that, because the run writing the amendment never opens the section it amends.',
    'The repair is not a recount and it is not an update: name the members, as slugs,',
    'per §5ae rule 2, and if the sentence is a record of an older library say so with',
    'its date and put it in the past tense. See §5ag.',
  ]
}

/** Why a body count is refused, and what to write instead. One condition, so
 *  one explanation, per §5z. */
export function explainBodyCounts(defects) {
  if (!defects.length) return []
  return [
    'A skill body that counts the library is stating a derived fact that nothing can',
    'check, because a count about skills/ cites no file and so no receipt guard',
    'fingerprints it. It is also the count most certain to decay: a body says where',
    'its skill sits among its neighbours, and the next skill to land changes that',
    'without touching the file. Two of the five paragraphs this rule was written',
    'against were already wrong, by four and by five, while the `neighbours` key in',
    'the same directory was right and checked.',
    'The repair is §5ae rule 2 and it is not a recount: name the siblings instead of',
    'counting them, as slugs, so the sentence says what it means and a wrong name',
    'becomes visible. If the paragraph needs a number for something that is not the',
    'library, that is a second thought and takes a blank line.',
  ]
}

/**
 * Why a stated count is wrong, by the one cause this guard knows and the one it
 * cannot distinguish from it. Same discipline as explainShape: a condition
 * explains itself and nothing else.
 */
export function explainCounts(defects) {
  const lines = []
  const stale = defects.filter((d) => d.said !== null)
  const missing = defects.filter((d) => d.said === null)
  if (stale.length) {
    lines.push('A stated count is a derived fact kept by hand, so it goes stale the moment the')
    lines.push('library changes shape, and every receipt guard stays green because a count about')
    lines.push('skills/ cites nothing. The usual cause is a landing run that paid §5r\'s prompt')
    lines.push('debt in a sibling\'s file and did not touch the sentence counting the prompts it')
    lines.push('added. The numbers above are measured from the files, so the repair is to copy')
    lines.push('them in, in this pull request, per §5u.')
  }
  if (missing.length) {
    lines.push('A count with no statement is not a defect in the library, it is this check with')
    lines.push('nothing to check: the file declares no `counts` block, or the index row has no')
    lines.push('`Refs` cell, so nothing there can go stale and nothing there can be trusted')
    lines.push('either. Add the block, or the cell, with the measured numbers above.')
  }
  return lines
}

/**
 * Why the library-shape branch failed, as a sentence per condition that fired.
 *
 * WHY THIS EXISTS, which is a fact about this file rather than about the
 * library. `explainShortfall` above was written on 2026-10-26 at 19:09 UTC to
 * fix exactly one defect: an exit branch reached by two conditions, explained
 * by one literal. The sweep that fix came with went over all four guards in
 * this library and declared them clean. Two screens below it, added to this
 * same file at 00:43 UTC the same day, the shape branch summed FOUR disjoint
 * conditions into `N library-shape defects above, listed before the counts.`
 * One class name, four repairs, and the one sentence the reader acts on told
 * them where to scroll instead of what broke.
 *
 * So the finding worth more than the fix: §5x's sweep was keyed to files, and
 * a sweep keyed to files stops at the first finding in each file. The unit is
 * the exit branch. See `prompts/skill-extract.md` §5z, which this is the
 * fourth instance under and the first found by looking at the right unit.
 *
 * The four conditions, in the order they are printed, which is the order to
 * repair them in:
 *
 *   1. A directory no guard reads. Its citations are unfingerprinted and its
 *      trigger boundary unmeasured, so this is the only one of the four where
 *      something is actually unguarded. First, always.
 *   2. A skill the index does not list. Guarded, but invisible to a reader of
 *      skills/README.md, which shipped here for three runs.
 *   3. An index row pointing at no directory. Two causes, and a listing
 *      settles which: a renamed directory, or a row for a skill that never
 *      landed.
 *   4. A row whose label and target disagree. Cosmetic on its own and listed
 *      last, but named because a reader checking the other three by eye
 *      matches labels against slugs and gets a false negative from it.
 *
 * Every one of the four is a seat's repair, which is said out loud because
 * §5z's other half is that a message naming a repair names who may make it,
 * and the honest answer here is "you, now" for all four.
 *
 * @param {{ missingSkill: {slug: string, nearMiss: ?string}[],
 *           unlisted: string[], indexedMissing: string[],
 *           mislabelled: {label: string, dir: string}[] }} shape the four
 *   conditions that reach the branch; any of them may be empty
 * @returns {string[]} lines to print, in order, for the conditions that fired
 */
export function explainShape({ missingSkill, unlisted, indexedMissing, mislabelled }) {
  const lines = []
  const count = (n, one, many) => `${n} ${n === 1 ? one : many}`
  if (missingSkill.length) {
    lines.push(`${count(missingSkill.length, 'directory', 'directories')} under skills/ has no SKILL.md, so no guard in`)
    lines.push('this library reads it: its citations are unfingerprinted and its trigger boundary')
    lines.push('is unmeasured. Repair this one first, because it is the only condition here where')
    lines.push('something is unguarded rather than unlisted. Two causes, and the listing printed')
    lines.push('above settles which: the file is there under a near-miss name, which is a rename,')
    lines.push('or the directory is not a skill at all, which is a move out of skills/.')
  }
  if (unlisted.length) {
    lines.push(`${count(unlisted.length, 'skill is', 'skills are')} guarded but absent from the index in`)
    lines.push('skills/README.md, so every tool here reads it and no reader finds it. One cause:')
    lines.push('the run that landed the skill owed the row and did not write it. Add the row.')
  }
  if (indexedMissing.length) {
    lines.push(`${count(indexedMissing.length, 'index row', 'index rows')} points at a directory that is not there.`)
    lines.push('Two causes: the directory was renamed and the row kept the old slug, or the row was')
    lines.push('written for a skill that never landed. A directory listing tells you which, and')
    lines.push('they ask for opposite repairs — fix the row, or delete it.')
  }
  if (mislabelled.length) {
    lines.push(`${count(mislabelled.length, 'index row carries', 'index rows carry')} a label that disagrees with the`)
    lines.push('directory it links to. Cosmetic on its own, which is why it is listed last, but it')
    lines.push('is also why the three above are hard to check by eye: a reader matching labels')
    lines.push('against slugs reads a mislabelled row as a missing one. One word in skills/README.md.')
  }
  return lines
}

export function explainShortfall({ gaps, missingTrigger }) {
  const lines = []
  if (missingTrigger.length) {
    lines.push('A skill with no TRIGGER-TEST.md has no boundary to measure, so it is listed above')
    lines.push('rather than scored. Two causes: the trigger test was never written, which the')
    lines.push('landing run owes under §5q, or the file is there under another name, which a')
    lines.push('directory listing settles in one command. Check the listing first; §5p allows')
    lines.push('refs in any markdown file of the directory but the trigger test itself is one')
    lines.push('fixed filename.')
  }
  if (gaps.length) {
    lines.push('§5c asks one near miss per adjacent skill, and three things leave a boundary')
    lines.push('untested. A new skill puts every skill already in the library one short, which')
    lines.push('is the usual cause and the one to check first, because it is the only one that')
    lines.push('moves many pairs at once. A renamed skill directory leaves the near misses')
    lines.push('that cited the old name pointing at nothing. And a near miss that paraphrases')
    lines.push("the sibling instead of quoting its own trigger prompt is reported above as")
    lines.push('argued rather than asked, and needs the sibling\'s words rather than a new')
    lines.push('section.')
  }
  return lines
}

/** The amendment graph, printed, and optionally repaired. Its own mode because
 *  it reads one file and needs no library at all, and because the ledger entry
 *  that asked for it asked for the graph first: the number of unlinked
 *  amendments is what decides whether the back pointer is generated or merely
 *  required. It was zero of seven, so it is generated. */
function amendmentsMode(write) {
  let specText = null
  try { specText = readFileSync(SPEC_PATH, 'utf8') } catch { specText = null }
  if (specText === null) {
    console.log(`${SPEC_REL} is not readable from this clone, so there is no graph to print`)
    return 1
  }
  const pop = amendmentPopulation(specText)
  const unreadable = unreadableAmendmentClaims(specText)
  const edges = amendmentEdges(specText)
  console.log(`amendment graph over ${pop.sections} sections, ${pop.notes} of them carrying a dated note, ` +
    `${pop.claiming} of those declaring an amendment, ${edges.length} edge${edges.length === 1 ? '' : 's'}:`)
  for (const e of edges)
    console.log(`  §${e.from}:${e.line} amends §${e.to}${e.part ? ` ${e.part}` : ''}`)
  if (write) {
    const { text, changed, refused } = withBackPointers(specText)
    if (refused.length) {
      console.log(`\nnothing written: ${refused.length} note${refused.length === 1 ? '' : 's'}` +
        ` (${refused.map((id) => `§${id}`).join(', ')}) claim an amendment in a spelling this check` +
        ` does not read, and rewriting from a graph missing their edges would delete back pointers` +
        ` it cannot put back`)
    } else {
    if (text !== specText) writeFileSync(SPEC_PATH, text)
    console.log(`\n${changed} section${changed === 1 ? '' : 's'} carry a generated back pointer` +
      `${text === specText ? ', unchanged' : ', written'}`)
    // Graded against what was written and not against what was read. The first
    // draft reported the pre-write defects after repairing them, so a clean
    // `--write` printed seven failures and told the caller to run the command
    // it had just run.
    specText = text
    }
  }
  const defects = amendmentDefects(specText)
  // Re-read against the text that was graded rather than the text that was
  // loaded, for the same reason the defects are: under `--write` they differ.
  const unreadableNow = unreadableAmendmentClaims(specText)
  for (const d of defects) console.log(`${SPEC_REL}:${d.line} ${d.kind}: ${d.detail}`)
  if (!defects.length) {
    console.log(`\nevery amended section names its amendments, across the ${pop.claiming} note` +
      `${pop.claiming === 1 ? '' : 's'} that declare one; ${pop.notes - pop.claiming} dated note` +
      `${pop.notes - pop.claiming === 1 ? '' : 's'} declare none and ${pop.sections - pop.notes} section` +
      `${pop.sections - pop.notes === 1 ? '' : 's'} carry no dated note, so this verdict says nothing about them`)
    // Every line above is read out of a pattern's silence, so the clean verdict
    // names the words it searched with. An absence is a fact about a
    // vocabulary until the vocabulary is printed beside it.
    console.log(`read with ${AMENDMENT_VOCABULARY}; ${unreadableNow.length} note` +
      `${unreadableNow.length === 1 ? '' : 's'} resemble a claim in a form it cannot read`)
    return 0
  }
  console.log('')
  for (const line of explainAmendments(defects)) console.log(line)
  return 1
}

function main(argv) {
  const showPairs = argv.includes('--pairs')
  const check = argv.includes('--check')
  if (argv.includes('--amendments')) return amendmentsMode(argv.includes('--write'))
  const library = readLibrary()
  const missingTrigger = library.filter((s) => s.trigger === null)
  // The other half of §2, which this tool reported for one file and dropped in
  // silence for the other until 2026-10-26. `readLibrary` above still skips a
  // directory with no SKILL.md, because every pair computed below needs a
  // description to compare; the skip is now named instead of implied.
  const missingSkill = unreadDirs(SKILLS_DIR)
  // And the index, in both directions. A row pointing at a directory that is
  // not there, and a skill directory no row points at, are the same defect
  // read from the two ends; the second one shipped here for three runs.
  let indexRows = []
  try { indexRows = indexedRows(readFileSync(join(SKILLS_DIR, 'README.md'), 'utf8')) } catch { indexRows = [] }
  const mislabelled = indexRows.filter((r) => r.label !== r.dir)
  const slugs = new Set(library.map((s) => s.slug))
  const listed = new Set(indexRows.map((r) => r.dir))
  const indexedMissing = indexRows.filter((r) => !slugs.has(r.dir)).map((r) => r.dir)
  const unlisted = library.filter((s) => !listed.has(s.slug)).map((s) => s.slug)
  const pairs = coverage(library)
  const covered = pairs.filter((p) => p.covered)
  const gaps = pairs.filter((p) => !p.covered)

  if (showPairs) {
    for (const p of [...pairs].sort((a, b) => b.score - a.score))
      console.log(`  ${p.score.toFixed(3)}  ${p.covered ? ' ' : '!'} ${(p.via ?? 'untested').padEnd(10)}` +
        ` ${p.skill} <- ${p.sibling}` +
        (p.from ? `  (its ${p.from} as our ${p.to})` : '') +
        (p.via === 'declared' ? `  [declared in near miss ${p.declared}, paraphrased]` : ''))
    console.log('')
  }

  for (const s of library) {
    const mine = pairs.filter((p) => p.skill === s.slug)
    const got = mine.filter((p) => p.covered)
    const short = mine.filter((p) => !p.covered)
    const saidOnly = mine.filter((p) => p.via === 'declared')
    const flag = short.length ? '!' : saidOnly.length ? '~' : ' '
    console.log(`${flag} ${s.slug}`)
    console.log(`    ${s.shouldFire.length} should fire, ${s.nearMisses.length} near misses` +
      `, ${got.length}/${mine.length} sibling boundaries covered`)
    if (short.length) console.log(`    untested: ${short.map((p) => p.sibling).join(', ')}`)
    if (saidOnly.length) console.log(`    argued but not with the sibling's own prompt: ` +
      saidOnly.map((p) => `${p.sibling} (near miss ${p.declared}, ${p.score.toFixed(2)})`).join(', '))
    if (s.unclassified?.length) console.log(`    no verdict in its prose: ` +
      s.unclassified.map((p) => `${p.id} under "${p.heading}"`).join(', '))
  }
  console.log('')
  for (const s of missingTrigger) console.log(`no TRIGGER-TEST.md: ${s.slug}`)
  for (const d of missingSkill)
    console.log(`no SKILL.md: ${d.slug}${d.nearMiss ? ` (it holds ${d.nearMiss})` : ''}` +
      ` — nothing in this library reads this directory`)
  for (const r of mislabelled) console.log(`index row labelled ${r.label} points at ${r.dir}/`)
  for (const d of indexedMissing) console.log(`index lists ${d}, which is not a skill directory`)
  for (const s of unlisted) console.log(`not in the index: ${s}`)

  // Three states, not two, because they call for different work. A boundary
  // carrying the sibling's own trigger prompt is what §5c asks for. One only
  // argued in prose is a real argument about the edge that never got the
  // sibling's words put in front of the description, which is the half of the
  // test that would actually catch a false positive. One with neither is
  // untouched.
  const asked = pairs.filter((p) => p.via === 'both' || p.via === 'similarity')
  const argued = pairs.filter((p) => p.via === 'declared')
  console.log(`trigger coverage across ${library.length} skills, ${pairs.length} ordered pairs:`)
  console.log(`  ${asked.length} carry the sibling's own trigger prompt, which is what §5c asks (${pct(asked.length, pairs.length)}%)`)
  console.log(`  ${argued.length} argue the boundary in prose without it`)
  console.log(`  ${gaps.length} untested`)
  // A shape defect is not a §5c gap and does not wait for --check. A directory
  // no guard reads and an index that disagrees with the directory listing are
  // both facts about whether this library is the set of things it says it is,
  // and neither is a judgement call the caller can be given a flag for.
  //
  // The sum below is printed broken out rather than collapsed. Until this run
  // it was one number under one class name, and four library-shape defects
  // could be four index rows nobody wrote — a two-minute edit to one file — or
  // four directories whose evidence nothing checks. See `explainShape`.
  // A stated count that disagrees with the library is the same kind of fact as a
  // dangling index row: published, derived, and checkable without judgement. So
  // it is reported next to the shape defects and exits 1 on its own, rather than
  // waiting for --check, which is for the §5c budget a caller may be mid-repair
  // on. See countDefects for what one day of §5u-as-a-convention cost.
  let indexText = null
  try { indexText = readFileSync(join(SKILLS_DIR, 'README.md'), 'utf8') } catch { indexText = null }
  const counts = countDefects(library, indexRows, indexText)
  for (const d of counts) {
    // The index is one file holding ten rows, so its path alone does not say
    // which row is wrong; a trigger test's path already names its skill.
    const where = d.file !== 'skills/README.md' ? d.file
      : d.slug === 'the library' ? 'skills/README.md counts block'
      : `skills/README.md row ${d.slug}`
    console.log(d.key === 'counts block'
      ? `${where} declares no counts block, so nothing checks what it says about itself`
      : `${where} says ${d.key} ${d.said === null ? 'nowhere' : d.said}, the library says ${d.measured}`)
  }

  // The index's area count, which is the same file as the two rows above and a
  // different construct. `counts` reads a fenced block and compares it to the
  // directory listing; this reads two sentences and compares them to a list in
  // the same file. See `areaHeadingDefects` for why the list is the
  // denominator and why the key is graded when the proposal left it alone.
  const areas = areaHeadingDefects(indexText)
  for (const d of areas)
    console.log(d.kind === 'unreadable'
      ? `${d.file}:${d.line} says "${d.quote}" and this guard cannot read that ordinal,` +
        ` so the ${d.measured} labelled areas below it are unchecked`
      : `${d.file}:${d.line} says "${d.quote}", the labelled areas number ${d.measured}`)

  // A body that counts the library is the same fact as a stale `counts` block,
  // read in the file next door, so it prints with them and exits the same way.
  // §5ae declared this residue safe and it was not; see `bodyCountDefects`.
  const bodyCounts = bodyCountDefects(library)
  for (const d of bodyCounts)
    console.log(`${d.file}:${d.line} counts the library instead of naming it` +
      ` (${d.counts.join(', ')}): "${d.quote}…"`)

  // The same fact again, read in the file that states the rule rather than in
  // a file the rule governs. §5ag is why this is a third surface and not a
  // repeat of the two above.
  let specText = null
  try { specText = readFileSync(SPEC_PATH, 'utf8') } catch { specText = null }
  const specCounts = specNeighbourDefects(specText, library)
  for (const d of specCounts)
    console.log(`${d.file}:${d.line} says "${d.quote}", the library says ${d.measured}`)

  // The same file again, and the general case of the same defect. §5ag could
  // grade a stale count because `neighbours` has a denominator. A note that
  // claims it amends §N has none: the only thing that can check the claim is
  // §N. So this is the one check in this guard whose subject is two sections of
  // one prose file and not the library, and it is here rather than in a new
  // script because nothing in this repository runs the guards for a seat, so a
  // guard in a file no PR table lists is a guard nobody runs. See §5ah.
  const amendments = amendmentDefects(specText)
  for (const d of amendments) console.log(`${SPEC_REL}:${d.line} ${d.kind}: ${d.detail}`)

  const shape = missingSkill.length + mislabelled.length + indexedMissing.length + unlisted.length
  if (amendments.length && !shape) {
    console.log(`${amendments.length} amended section${amendments.length === 1 ? '' : 's'} in ` +
      `${SPEC_REL} ${amendments.length === 1 ? 'does' : 'do'} not name ${amendments.length === 1 ? 'its' : 'their'} amendments, listed above.`)
    for (const line of explainAmendments(amendments)) console.log(line)
    return 1
  }
  if (specCounts.length && !shape) {
    console.log(`${specCounts.length} neighbour count${specCounts.length === 1 ? '' : 's'} in ` +
      `${SPEC_REL} disagree${specCounts.length === 1 ? 's' : ''} with the library, listed above.`)
    for (const line of explainSpecNeighbours(specCounts)) console.log(line)
    return 1
  }
  if (bodyCounts.length && !shape) {
    console.log(`${bodyCounts.length} skill body paragraph${bodyCounts.length === 1 ? '' : 's'} ` +
      `count${bodyCounts.length === 1 ? 's' : ''} the library, listed above.`)
    for (const line of explainBodyCounts(bodyCounts)) console.log(line)
    for (const line of explainCounts(counts)) console.log(line)
    return 1
  }
  if (areas.length && !shape) {
    console.log(`${areas.length} area count${areas.length === 1 ? '' : 's'} in ${INDEX_REL} ` +
      `${areas.length === 1 ? 'disagrees' : 'disagree'} with the areas it labels, listed above.`)
    for (const line of explainAreas(areas)) console.log(line)
    for (const line of explainCounts(counts)) console.log(line)
    return 1
  }
  if (counts.length && !shape) {
    console.log(`${counts.length} stated count${counts.length === 1 ? '' : 's'} disagree${counts.length === 1 ? 's' : ''} with the library, listed above.`)
    for (const line of explainCounts(counts)) console.log(line)
    return 1
  }
  if (shape) {
    console.log(`${shape} library-shape defect${shape === 1 ? '' : 's'}: ` +
      `${missingSkill.length} unread, ${unlisted.length} unlisted, ` +
      `${indexedMissing.length} dangling index row${indexedMissing.length === 1 ? '' : 's'}, ` +
      `${mislabelled.length} mislabelled. Each is listed above with its own slug.`)
    for (const line of explainShape({ missingSkill, unlisted, indexedMissing, mislabelled })) console.log(line)
    return 1
  }
  if (gaps.length === 0 && missingTrigger.length === 0) {
    if (!argued.length) console.log('every skill meets §5c')
    return 0
  }
  for (const line of explainShortfall({ gaps, missingTrigger })) console.log(line)
  return check ? 1 : 0
}

if (import.meta.url === `file://${process.argv[1]}`) process.exit(main(process.argv.slice(2)))
