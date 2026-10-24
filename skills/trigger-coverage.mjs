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
// Measured when this tool was written, 15 of the 30 ordered pairs covered, and
// the shape of the 15 is the whole argument. Sorted by `created`, coverage is
// exactly rank by age:
//
//   adjudicating-uncertain-spans   2026-09-24   0 of 5
//   running-an-outcome-record-trial 2026-09-30  1 of 5
//   quoting-a-number...            2026-10-01   2 of 5
//   distilling-a-tuning-record     2026-10-05   3 of 5
//   adding-a-bound-to-the-record-gate 2026-10-18 4 of 5
//   clearing-a-record-for-release  2026-10-23   5 of 5
//
// Every skill tests exactly the siblings that existed on the day it was
// written, and not one has gained a near miss since. So this is not a backlog
// that some runs serviced and others skipped. The library has never once
// amended an existing trigger test when a new skill landed beside it, and the
// per-neighbour budget has been satisfied only ever at authoring time. The
// newest skill looks compliant for the same reason the oldest looks negligent:
// position in a sequence, not care.
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

/**
 * One trigger test, split into the prompts that must fire and the near misses
 * that must not. Sections are found by heading rather than by order, so a test
 * that puts its note between them still parses.
 */
export function parseTriggerTest(text) {
  const sections = []
  let current = null
  for (const line of text.split('\n')) {
    const h = line.match(HEADING)
    if (h) { current = { heading: h[1].trim().toLowerCase(), lines: [] }; sections.push(current) }
    else if (current) current.lines.push(line)
  }
  const body = (pred) => {
    const s = sections.find((x) => pred(x.heading))
    return s ? s.lines.join('\n') : ''
  }
  const prompts = (t) => [...t.matchAll(PROMPT)].map((m) => ({ id: m[1], text: m[2].replace(/\s+/g, ' ').trim() }))
  // Both predicates are anchored at the start on purpose. The two headings are
  // disjoint under startsWith, so order does not matter here; under any looser
  // test for the word "fire" they are not, and `find` returning the first
  // match would file every near miss as a should-fire prompt and report a test
  // with no near misses at all as fully covered.
  const no = body((h) => h.startsWith('should not fire'))
  const yes = body((h) => h.startsWith('should fire'))
  return { shouldFire: prompts(yes), nearMisses: prompts(no) }
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
    let skill = true
    try { statSync(join(abs, 'SKILL.md')) } catch { skill = false }
    if (!skill) continue
    out.push({ slug: name, trigger, ...(trigger ? parseTriggerTest(trigger) : { shouldFire: [], nearMisses: [] }) })
  }
  return out
}

/**
 * For every ordered pair of skills, the best match between the sibling's
 * should-fire prompts and this skill's near misses.
 */
export function coverage(library, floor = BIGRAM_DICE_FLOOR) {
  const pairs = []
  for (const skill of library) {
    for (const sibling of library) {
      if (sibling.slug === skill.slug) continue
      let best = { score: 0, from: null, to: null }
      for (const f of sibling.shouldFire) {
        for (const n of skill.nearMisses) {
          const score = similarity(f.text, n.text)
          if (score > best.score) best = { score, from: f.id, to: n.id }
        }
      }
      pairs.push({ skill: skill.slug, sibling: sibling.slug, ...best, covered: best.score >= floor })
    }
  }
  return pairs
}

const pct = (n, d) => (d === 0 ? '0' : ((100 * n) / d).toFixed(0))

function main(argv) {
  const showPairs = argv.includes('--pairs')
  const check = argv.includes('--check')
  const library = readLibrary()
  const missingTrigger = library.filter((s) => s.trigger === null)
  const pairs = coverage(library)
  const covered = pairs.filter((p) => p.covered)
  const gaps = pairs.filter((p) => !p.covered)

  if (showPairs) {
    for (const p of [...pairs].sort((a, b) => b.score - a.score))
      console.log(`  ${p.score.toFixed(3)}  ${p.covered ? ' ' : '!'} ${p.skill} <- ${p.sibling}` +
        (p.from ? `  (its ${p.from} as our ${p.to})` : ''))
    console.log('')
  }

  for (const s of library) {
    const mine = pairs.filter((p) => p.skill === s.slug)
    const got = mine.filter((p) => p.covered)
    const short = mine.filter((p) => !p.covered)
    const flag = short.length ? '!' : ' '
    console.log(`${flag} ${s.slug}`)
    console.log(`    ${s.shouldFire.length} should fire, ${s.nearMisses.length} near misses` +
      `, ${got.length}/${mine.length} sibling boundaries tested`)
    if (short.length) console.log(`    untested: ${short.map((p) => p.sibling).join(', ')}`)
  }
  console.log('')
  for (const s of missingTrigger) console.log(`no TRIGGER-TEST.md: ${s.slug}`)

  const verdict = `trigger coverage: ${covered.length} of ${pairs.length} sibling boundaries tested` +
    ` (${pct(covered.length, pairs.length)}%) across ${library.length} skills`
  if (gaps.length === 0 && missingTrigger.length === 0) {
    console.log(`${verdict} — every skill meets §5c`)
    return 0
  }
  console.log(verdict)
  console.log(`${gaps.length} untested boundar${gaps.length === 1 ? 'y' : 'ies'}. §5c asks one near miss per adjacent skill.`)
  console.log('A new skill puts every skill already in the library one near miss short; that is the usual cause.')
  return check ? 1 : 0
}

if (import.meta.url === `file://${process.argv[1]}`) process.exit(main(process.argv.slice(2)))
