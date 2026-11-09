// Which files in a skill directory carry a citation, shared by the two tools
// that answer that question: check-evidence.mjs and relevance-sweep.mjs.
//
// It exists because of a defect both of them had on 2026-10-23, found while
// writing the fifth skill's trigger test. Both tools enumerated
// `skills/<slug>/SKILL.md` and read nothing else in the directory, so an
// `[E7]` tag written into a `TRIGGER-TEST.md` was invisible to both: no
// fingerprint over the lines it pointed at, no row in relevance.lock.json, no
// entry in the dossier of passages citing that ref, and nothing that went red
// when the range moved. The first draft of that trigger test carried ten of
// them and both tools stayed green over all ten. A tag that looks exactly like
// a receipt and is not one is the single failure the evidence lock was built to
// prevent, one directory over from where it was looking.
//
// Why this is one module rather than the same three lines in both tools. The
// same argument source-line.mjs makes: when two tools disagree about which
// files count, a ref cited in a file one of them reads and the other does not
// is half-defended, and neither says so. source-line.mjs earned that argument
// the expensive way, by letting one citation go unchecked from the day it was
// written.
//
// What is deliberately not here. The evidence table itself is declared only in
// SKILL.md frontmatter, so relocate-anchors.mjs, which rewrites `source:`
// lines, still reads that one file and is right to.
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'

/** A citation tag in a body: `[E3]` or `[E3, E7]`. */
export const TAG_RE = /\[((?:E\d+)(?:,\s*E\d+)*)\]/g

/** A file big enough that it is data rather than prose; not scanned for tags. */
const MAX_SCAN_BYTES = 512 * 1024

/** The body of a SKILL.md, or the whole text of anything else. The evidence
 *  table is a declaration and not a citation, so it is dropped: a `what` field
 *  that happens to contain a bracketed ref must not count as citing it. */
export const stripFrontmatter = (text) => {
  const fm = text.match(/^---\n[\s\S]*?\n---\n/)
  return fm ? text.slice(fm[0].length) : text
}

/**
 * Every ref the evidence table DECLARES, as `{ ref, sourceLine }`, in table
 * order, read out of SKILL.md's frontmatter and nowhere else.
 *
 * The other direction from `refsIn`, which reads the tags that cite a ref. Both
 * live here for the reason the header gives: when two tools disagree about
 * which refs exist, the ref they disagree about is the one nobody is told
 * about. This function was lifted out of check-evidence.mjs on 2026-10-27,
 * unchanged, when a second tool needed the same count — `trigger-coverage.mjs`
 * checking the `Refs` column of `skills/README.md`, which had been wrong for
 * three of ten rows with every guard green.
 */
export function declaredRefs(text) {
  const fm = text.match(/^---\n([\s\S]*?)\n---\n/)
  if (!fm) return []
  const out = []
  for (const m of fm[1].matchAll(/- ref:\s*(\S+)\n(?:.*\n)*?\s*source:\s*(.+)/g))
    out.push({ ref: m[1], sourceLine: m[2] })
  return out
}

/** Every ref named by a citation tag in one body, in order of appearance. */
export function refsIn(text) {
  const out = []
  for (const m of text.matchAll(TAG_RE))
    for (const r of m[1].split(/,\s*/)) out.push(r)
  return out
}

/**
 * Every markdown file in one skill directory that may cite an evidence ref,
 * as `{ file, text }`. SKILL.md comes first and without its frontmatter, the
 * rest in name order, so that a digest taken over the result is stable and a
 * new file appended to a directory does not reorder the passages before it.
 *
 * One level deep, because a skill is `SKILL.md` plus `TRIGGER-TEST.md` per
 * prompts/skill-extract.md §2. A nested directory would not be read, and
 * strayCitations below is what would report a tag hidden in one.
 */
export function citingTexts(dir) {
  const names = readdirSync(dir).filter((n) => n.endsWith('.md') && isFile(join(dir, n))).sort()
  const ordered = names.includes('SKILL.md')
    ? ['SKILL.md', ...names.filter((n) => n !== 'SKILL.md')]
    : names
  return ordered.map((file) => {
    const raw = readFileSync(join(dir, file), 'utf8')
    return { file, text: file === 'SKILL.md' ? stripFrontmatter(raw) : raw }
  })
}

/**
 * Citation tags sitting in a file under this skill directory that citingTexts
 * does not return, as `{ file, refs }`. This is the residual of the same
 * defect: widening the tools to every `.md` makes a tag in `TRIGGER-TEST.md` a
 * real receipt, and says nothing about a tag in a `.json` fixture or a
 * `notes.txt` beside it, which would be exactly as green and exactly as empty.
 * Reported rather than fingerprinted, because the fix is to move the claim into
 * a file the tools read, not to teach them every format.
 */
export function strayCitations(dir) {
  const out = []
  for (const name of readdirSync(dir).sort()) {
    const abs = join(dir, name)
    if (name.endsWith('.md') && isFile(abs)) continue
    if (!isFile(abs)) { out.push(...strayInDir(abs, name)); continue }
    const refs = scan(abs)
    if (refs.length) out.push({ file: name, refs })
  }
  return out
}

const isFile = (abs) => {
  try { return statSync(abs).isFile() } catch { return false }
}

const strayInDir = (abs, prefix) => {
  let names
  try { names = readdirSync(abs).sort() } catch { return [] }
  const out = []
  for (const name of names) {
    const child = join(abs, name)
    if (!isFile(child)) { out.push(...strayInDir(child, `${prefix}/${name}`)); continue }
    const refs = scan(child)
    if (refs.length) out.push({ file: `${prefix}/${name}`, refs })
  }
  return out
}

const scan = (abs) => {
  try {
    if (statSync(abs).size > MAX_SCAN_BYTES) return []
    return [...new Set(refsIn(readFileSync(abs, 'utf8')))]
  } catch { return [] }
}
