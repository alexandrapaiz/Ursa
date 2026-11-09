#!/usr/bin/env node
// Checks the one way an evidence identifier enters this library with no
// receipt behind it: written bare in prose, outside the `[E3]` tag form, where
// every guard that reads citations looks straight past it.
//
//   node skills/bare-refs.mjs                 survey the library, exit 1 on a dangling mention
//   node skills/bare-refs.mjs --dir <path>     ... over another skills/ tree, for the suite
//
// WHY THIS IS A SECOND TOOL AND NOT A LINE IN check-evidence.mjs. That script
// reads citation tags, which is the surface the evidence lock defends: a tag
// names a ref, the ref names a range, the range is fingerprinted, and the
// fingerprint goes red when the lines move. A bare `E33` in a sentence is on
// none of that path. It is not a tag, so refsIn skips it; it has no range, so
// it has no lock row; it is not in frontmatter, so declaredRefs does not know
// it exists. prompts/skill-extract.md §5t part 1 names this exact costume for
// register identifiers -- "an identifier written as a receipt has no
// fingerprint, no lock row and no failure mode" -- and it was written about
// `INC-` names coming from outside the library. This library's own `E<n>`
// namespace is the same costume one directory closer, and nothing read it.
//
// WHAT MAKES THE QUESTION GRADEABLE AT ALL, which is the part worth keeping.
// A bare identifier is evidence of nothing by itself. Whether `E33` in
// `auditing-an-untraced-share/TRIGGER-TEST.md` is a resolved pointer or a
// dangling one cannot be read off that file: the file contains the identifier
// and not what it points at. It takes a second surface keyed on the same
// identifier, and this repository has one, skills/evidence.lock.json, whose
// keys are `<slug>/E<n>/<path>:<range>`. Cross-tabulating the two is what
// turns "there is an E33 here" into "E33 is not a ref of this skill and three
// other skills hold one".
//
// Ursa's exo seat put the general form of that on the board on 2026-11-09,
// about a different namespace, and it is the argument this file is built on:
// a namespace whose gaps are facts cannot be graded from one surface at all,
// because one surface cannot separate nothing happened from something happened
// and wrote elsewhere. Two surfaces keyed on one number is the cheapest thing
// that can, and neither has to be complete, only independent. There, the
// surfaces were run-note filenames and register headings, 30 of 39 slots and
// 7 of 39, and the cross-tabulation still split ten absences nine to one.
// Here they are prose and the lock, and the cross-tabulation finds the four
// mentions below.
//
// WHAT IT DELIBERATELY DOES NOT FAIL ON. §5t part 2: an identifier in prose is
// a pointer, and it is legitimate once it is resolved. So a bare mention of
// the citing skill's own ref passes, and it is counted and printed rather than
// waved through, for the reason §5ak gives: a check that read none of its
// population and a check that found nothing in it print the same thing.
// A mention inside a fenced code block is a command and not a pointer, so it
// is counted in its own cell and never failed on.
import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { TAG_RE, citingTexts, refsIn } from './citing-files.mjs'
import { readLibraryDirs } from './library-dirs.mjs'

/** A bare evidence identifier: `E` and digits, not immediately after a `[`
 *  and not part of a longer word. `TAG_RE`'s matches are already masked out
 *  when this runs, so a `[` still standing in front of one is a bracketed
 *  form that `TAG_RE` did not accept, an unclosed `[E3` or a link label, and
 *  those are left to whatever rule governs them rather than reported here. */
export const BARE_RE = /(?<![[\w])(E\d+)\b/g

/** A fenced code block, including the fence lines. Tilde fences too, because
 *  the library's own README uses them for its counts block. */
const FENCE_RE = /^(```|~~~)[^\n]*\n[\s\S]*?^\1[^\n]*$/gm

const blank = (s) => s.replace(/[^\n]/g, ' ')

/**
 * Every bare evidence mention in one body, as `{ ref, line, fenced }`.
 *
 * Tags are blanked rather than removed, so every index into `masked` is the
 * same index into `text`. No tag contains a newline, so removal would not in
 * fact move a line number, and that is the point: the equality holds by
 * construction instead of by a property of the tag syntax, so a later change
 * that reports a column rather than a line is right without re-deriving it.
 *
 * Fences are NOT blanked, and the first draft of this function did blank them,
 * which made its own `fenced` cell unreachable: nothing was left to match
 * inside a fence, so the count printed zero and the zero was not a
 * measurement. That is this file's own subject appearing inside this file --
 * a cell whose emptiness was a property of the instrument -- and it is kept in
 * the comment rather than quietly fixed, because the survey in
 * skills/mutation-audit.md found the same shape three times in one run.
 */
export function bareMentions(text) {
  const masked = text.replace(TAG_RE, blank)
  const fencedLines = new Set()
  for (const m of masked.matchAll(FENCE_RE)) {
    const start = masked.slice(0, m.index).split('\n').length
    const end = start + m[0].split('\n').length - 1
    for (let l = start; l <= end; l++) fencedLines.add(l)
  }
  const out = []
  for (const m of masked.matchAll(BARE_RE)) {
    const line = masked.slice(0, m.index).split('\n').length
    out.push({ ref: m[1], line, fenced: fencedLines.has(line) })
  }
  return out
}

/** The second surface: which skill slugs hold each `E<n>`, read out of the
 *  lock's keys. Returns a Map from ref to a sorted array of slugs. */
export function holdersByRef(lock) {
  const out = new Map()
  for (const key of Object.keys(lock)) {
    const [slug, ref] = key.split('/')
    if (!slug || !/^E\d+$/.test(ref ?? '')) continue
    if (!out.has(ref)) out.set(ref, new Set())
    out.get(ref).add(slug)
  }
  return new Map([...out].map(([ref, slugs]) => [ref, [...slugs].sort()]))
}

/**
 * The cross-tabulation, over a skills/ tree.
 *
 * `dangling` is the only cell that is a defect. The other three are the
 * population, and they are returned because §5ak's rule is that a check
 * prints the size of what it examined.
 */
export function survey(skillsDir) {
  const lockPath = join(skillsDir, 'evidence.lock.json')
  const lock = existsSync(lockPath) ? JSON.parse(readFileSync(lockPath, 'utf8')) : {}
  const holders = holdersByRef(lock)
  // `hasSkill` is the membership predicate every other guard here uses, so a
  // directory this one reads and check-evidence.mjs does not would be a second
  // instance of exactly the defect citing-files.mjs was lifted out to prevent.
  const slugs = readLibraryDirs(skillsDir).filter((d) => d.hasSkill).map((d) => d.slug)
  const out = {
    skills: slugs.length,
    files: 0,
    tags: 0,
    bare: 0,
    resolved: 0,
    fenced: 0,
    dangling: [],
  }
  for (const slug of slugs) {
    const own = new Set(
      Object.keys(lock).filter((k) => k.startsWith(`${slug}/`)).map((k) => k.split('/')[1]),
    )
    for (const { file, text } of citingTexts(join(skillsDir, slug))) {
      out.files++
      out.tags += refsIn(text).length
      for (const m of bareMentions(text)) {
        out.bare++
        if (m.fenced) { out.fenced++; continue }
        if (own.has(m.ref)) { out.resolved++; continue }
        out.dangling.push({
          slug,
          file,
          line: m.line,
          ref: m.ref,
          // No filter for the citing slug, and the first draft had one. Both
          // `own` and `holders` are read out of the same lock, so a ref the
          // citing skill holds was already resolved two lines up and never
          // reaches here. The filter could not fire, and the suite could not
          // tell: mutating it to `.filter(() => true)` left all 24 tests
          // green. That is this file's own subject again -- a line whose
          // emptiness was a property of the program and not of the library --
          // so it is gone rather than kept for safety.
          heldBy: holders.get(m.ref) ?? [],
        })
      }
    }
  }
  return out
}

/** The frontmatter of SKILL.md is stripped by citingTexts, so the line numbers
 *  this prints for SKILL.md are offset by that frontmatter. TRIGGER-TEST.md is
 *  read whole and its numbers are the file's own. Stated here because the one
 *  finding in this library is in a TRIGGER-TEST.md and a future one may not
 *  be, and a line number that is right for one file and wrong for another is
 *  worse than no line number. */
export const LINE_CAVEAT =
  'line numbers are within the body citingTexts reads: SKILL.md is offset by its frontmatter'

function main(argv) {
  const i = argv.indexOf('--dir')
  const dir = i >= 0 ? argv[i + 1] : new URL('.', import.meta.url).pathname
  if (i >= 0 && !dir) {
    console.error('--dir wants a path to a skills/ tree')
    return 2
  }
  const r = survey(dir)
  console.log(
    `population: ${r.skills} skills, ${r.files} markdown bodies, ${r.tags} tag citations, ` +
      `${r.bare} bare evidence mentions`,
  )
  console.log(`  resolved in the citing skill: ${r.resolved}`)
  console.log(`  inside a fenced code block, not graded: ${r.fenced}`)
  console.log(`  dangling: ${r.dangling.length}`)
  if (!r.dangling.length) {
    console.log('OK: every bare evidence mention names a ref of the skill that wrote it')
    return 0
  }
  console.log(`\n(${LINE_CAVEAT})`)
  for (const d of r.dangling) {
    const held = d.heldBy.length ? `held by ${d.heldBy.join(', ')}` : 'held by no skill in the lock'
    console.log(`skills/${d.slug}/${d.file}:${d.line}  ${d.ref}  not a ref of ${d.slug}; ${held}`)
  }
  console.log(
    '\nRepair, per prompts/skill-extract.md §5t part 1: cite the other skill by slug and by the\n' +
      'range its ref names, so the claim goes red when those lines move. An identifier alone is\n' +
      "a receipt with no failure mode, and here it is ambiguous as well: the same E<n> is a\n" +
      'different range in every skill that has one.',
  )
  return 1
}

if (import.meta.url === `file://${process.argv[1]}`) process.exit(main(process.argv.slice(2)))
