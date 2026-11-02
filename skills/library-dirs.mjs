// Which directories under skills/ are part of this library, shared by the two
// tools that need the answer and disagreed about it silently:
// check-evidence.mjs and trigger-coverage.mjs.
//
// It exists because of a hole measured on 2026-10-26 by probing the guards
// rather than reading them. A directory `skills/decoy-skill/` holding one file
// named `SKILLS.md` — correct frontmatter, a declared `provenance` ref, an
// `[E1]` tag in its body, one character wrong in the filename — was invisible
// to all three of this library's guards at once. check-evidence.mjs exited 0
// and said "307 sources resolved". trigger-coverage.mjs exited 0 and said
// "every skill meets §5c". relevance-sweep.mjs exited 0. Rename the file to
// SKILL.md and check-evidence.mjs reports the unfingerprinted citation on the
// next run, which is the proof that nothing about the citation was wrong: only
// the discovery step was.
//
// All three tools open `skills/<name>/SKILL.md` and `continue` when it is not
// there. That is the same defect as the one citing-files.mjs was written for,
// one level up: a thing that looks exactly like a receipt and is not one,
// one filename over from where the guard was looking. It is worse by one
// degree, because `strayCitations`, the check whose whole job is "a tag in a
// file nothing reads is not a receipt", sits *after* that `continue` in
// check-evidence.mjs and so never runs for the directory that needs it most.
//
// The asymmetry that makes it a bug rather than a choice. trigger-coverage.mjs
// already prints `no TRIGGER-TEST.md: <slug>` for a directory missing one of
// the two files §2 requires. It drops the directory in silence when the
// missing one is the other. A guard that reports half of a rule cannot be read
// as enforcing it.
//
// Why this is one module rather than three lines in each tool: the same
// argument source-line.mjs and citing-files.mjs each earned the expensive way.
// When two tools disagree about what counts as a member of the library, a
// skill one of them reads and the other does not is half-guarded, and neither
// says so.
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'

const isDir = (abs) => { try { return statSync(abs).isDirectory() } catch { return false } }
const isFile = (abs) => { try { return statSync(abs).isFile() } catch { return false } }

/** The two files prompts/skill-extract.md §2 requires of a skill directory. */
export const REQUIRED = ['SKILL.md', 'TRIGGER-TEST.md']

/**
 * Every directory under `dir`, classified, in name order. `hasSkill` is the
 * predicate every guard in this library uses to decide membership, so it is
 * named rather than inlined: a directory with `hasSkill` false is one that
 * today's guards do not read at all.
 */
export function readLibraryDirs(dir) {
  const out = []
  for (const slug of readdirSync(dir).sort()) {
    const abs = join(dir, slug)
    if (!isDir(abs)) continue
    const names = readdirSync(abs).sort()
    out.push({
      slug,
      dir: abs,
      names,
      hasSkill: isFile(join(abs, 'SKILL.md')),
      hasTrigger: isFile(join(abs, 'TRIGGER-TEST.md')),
    })
  }
  return out
}

/**
 * The directories no guard in this library reads, with the evidence that each
 * one was meant to be read, as `{ slug, names, nearMiss, frontmatter }`.
 *
 * `nearMiss` is the filename that differs from `SKILL.md` only by case or by
 * one of the two typos a shell makes — a trailing `S`, a `.markdown`
 * extension. It is reported separately from the bare directory listing because
 * it is the difference between a directory somebody is building and a
 * directory somebody believes is finished.
 *
 * `frontmatter` is whether any markdown file in it opens with a `---` block,
 * which is what makes a directory a claim about evidence rather than scratch
 * space. A `fixtures/` directory beside the skills trips neither signal and is
 * reported with both false, so a caller can decide how loud to be.
 */
export function unreadDirs(dir) {
  const out = []
  for (const d of readLibraryDirs(dir)) {
    if (d.hasSkill) continue
    const nearMiss = d.names.find((n) => n !== 'SKILL.md' && NEAR_MISS.test(n)) ?? null
    const frontmatter = d.names.some((n) => {
      if (!n.endsWith('.md') || !isFile(join(d.dir, n))) return false
      try { return /^---\n/.test(readFileSync(join(d.dir, n), 'utf8')) } catch { return false }
    })
    out.push({ slug: d.slug, names: d.names, nearMiss, frontmatter })
  }
  return out
}

/** `SKILL.md` as written by a hand that missed: case, a stray plural, the
 *  other markdown extension. Deliberately narrow — anything wider starts
 *  claiming that an unrelated `README.md` was meant to be a skill. */
const NEAR_MISS = /^skills?\.(md|markdown)$/i

/**
 * The rows of skills/README.md's index table, in table order, as
 * `{ label, dir }` — the link's text and the directory it points at.
 *
 * Both are returned rather than one reconciled slug, because a row whose label
 * and target disagree is the one row a caller must be told about, and a
 * function that silently prefers one of them would be committing this file's
 * own defect in miniature.
 *
 * Why the index is checked at all, and in both directions. The twenty-first
 * run recorded that this library shipped a skill its own index did not list
 * for three runs (docs/ideas.md, 2026-10-25). That is this same defect pointed
 * the other way: there, the directory was real and the index missed it; here,
 * the index would be the only place a directory is named. Neither direction has
 * ever had an exit status behind it.
 */
export function indexedRows(readmeText) {
  const out = []
  for (const m of readmeText.matchAll(/^\|\s*\[([^\]]+)\]\(([^)]+)\/SKILL\.md\)([^\n]*)$/gm)) {
    // The row's remaining cells, by position: what it decides, how many refs,
    // status. `refs` is the third column and is returned as a number only when
    // the cell holds nothing but digits, so a caller can tell a count that
    // disagrees with the library from a cell that states no count at all. See
    // trigger-coverage.mjs, which checks it: on 2026-10-27 three of the ten
    // rows were wrong by up to five refs, because the column is a derived
    // count maintained by hand and §5u's rule reached the trigger tests'
    // headers and not this table.
    const cells = m[3].split('|').map((c) => c.trim())
    const refsCell = cells[2] ?? ''
    out.push({ label: m[1], dir: m[2], refs: /^\d+$/.test(refsCell) ? Number(refsCell) : null })
  }
  return out
}
