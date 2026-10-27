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
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { unreadDirs, indexedRows } from './library-dirs.mjs'
import { declaredRefs } from './citing-files.mjs'

const SKILLS_DIR = new URL('.', import.meta.url).pathname.replace(/\/$/, '')

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
    out.push({ slug: name, trigger, refs: declaredRefs(skillText).length,
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
export function countDefects(library, indexRows) {
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

function main(argv) {
  const showPairs = argv.includes('--pairs')
  const check = argv.includes('--check')
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
  const counts = countDefects(library, indexRows)
  for (const d of counts) {
    // The index is one file holding ten rows, so its path alone does not say
    // which row is wrong; a trigger test's path already names its skill.
    const where = d.file === 'skills/README.md' ? `skills/README.md row ${d.slug}` : d.file
    console.log(d.key === 'counts block'
      ? `${where} declares no counts block, so nothing checks what it says about itself`
      : `${where} says ${d.key} ${d.said === null ? 'nowhere' : d.said}, the library says ${d.measured}`)
  }

  const shape = missingSkill.length + mislabelled.length + indexedMissing.length + unlisted.length
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
