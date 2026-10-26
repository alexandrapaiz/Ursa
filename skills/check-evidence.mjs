#!/usr/bin/env node
// Checks that every evidence ref in every skill resolves: the file exists, the
// line range named is in bounds, and the lines still say what they said when
// the citation was written. Cheap, but it is the difference between "skills
// with receipts" and skills with footnotes.
//
//   node skills/check-evidence.mjs                      verify
//   node skills/check-evidence.mjs --update             re-record the fingerprints
//   node skills/check-evidence.mjs --base origin/main   verify against that tree
//
// What `--base` is for, and why a tense is a defect. Without it this script
// reads the working tree and nothing else, so a green exit status is a claim
// about this branch and is silently read as a claim about the library. Ursa's
// exo seat corrected exactly that sentence of this seat's on 2026-10-26: a
// repair of two citations was reported as done when it was done on a branch,
// so the sweep over `main` went on reporting the defect and the two reports
// were both right. See prompts/skill-extract.md §5y. `--base <ref>` resolves
// every cited path out of that ref's tree instead of the checkout, which
// answers the other question: not "do my receipts hold here" but "would they
// hold for a reader who has that tree". Run it against `origin/main` before
// claiming the library is green, because the 2026-10-05 failure below is
// what it looks like when main moved and nobody asked.
//
// What this does not do, and what points at the thing that does. Re-recording
// a fingerprint says the lines changed and somebody read them. It says nothing
// about the relevance verdict in skills/relevance-audit.md, which was given to
// the old lines, so --update ends by naming relevance-sweep.mjs --stale.
//
// Why the third check exists. In-bounds is not the same as correct. On
// 2026-10-05 this library was carried forward onto a newer main with every
// anchor unchanged, and this script passed on all 133 sources while 58 of
// them pointed at unrelated code: `resolve.ts:160-167` had been the branch
// that sets `uncertain`, and by then it was the verbatim-match pass. A
// reader following the citation found something plausible and wrong, which
// is worse than a broken link, because a broken link announces itself.
//
// So every cited range is fingerprinted in skills/evidence.lock.json. The
// hash covers the cited lines with leading and trailing whitespace stripped,
// so reformatting does not raise an alarm and a changed word does. When the
// cited code legitimately moves or changes, re-anchor the citation, re-read
// the claim against the new lines, and run --update in the same commit so
// the diff shows a human decided.
import { readdirSync, readFileSync, existsSync, statSync, writeFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { join } from 'node:path'
import { sourcePaths, ranges as lineRanges } from './source-line.mjs'
import { citingTexts, refsIn, strayCitations } from './citing-files.mjs'
import { unreadDirs } from './library-dirs.mjs'

const root = new URL('..', import.meta.url).pathname
const skillsDir = join(root, 'skills')
const lockPath = join(skillsDir, 'evidence.lock.json')
const argv = process.argv.slice(2)
const update = argv.includes('--update')
// What `--update` is allowed to re-record. Empty means everything, which is
// safe only when nothing has drifted; see the refusal below. A scope is a
// skill slug, a skill/ref pair, or a whole lock key.
//
// The ref of `--base` is parsed out here rather than filtered out of the
// positionals, because `--base origin/main` read as a scope is the worst of
// both: a scoped update nobody asked for, over a tree nobody checked out.
const scope = []
let base = null
for (let i = 0; i < argv.length; i++) {
  const a = argv[i]
  if (a === '--base') { base = argv[++i] ?? '' ; continue }
  if (a.startsWith('--base=')) { base = a.slice('--base='.length); continue }
  if (a.startsWith('--')) continue
  scope.push(a)
}
if (base !== null && (base === '' || base.startsWith('--'))) {
  console.error('--base wants a git ref, e.g. --base origin/main')
  process.exit(2)
}
// Two refusals, both about the same confusion. Re-recording fingerprints from
// a tree that is not checked out would write a lock describing content nobody
// here can read, and a scope is an instruction to re-record, so neither makes
// sense beside a read-only question about another tree.
if (base !== null && update) {
  console.error('--base is a read-only question about another tree, so it cannot be combined with --update')
  console.error('Verify there first, then re-record against the checkout you actually have.')
  process.exit(2)
}
// §5v: a guard that asks git a question answers from this clone, and the clone
// is not the repository. A single-branch or shallow clone cannot resolve
// `origin/main`, and resolving nothing would make every citation look missing,
// which is a confident wrong answer where an abstention belongs.
if (base !== null) {
  try {
    execFileSync('git', ['rev-parse', '--verify', '--quiet', `${base}^{commit}`], { cwd: root, stdio: 'ignore' })
  } catch {
    console.error(`--base ${base}: this clone cannot resolve that ref, so there is no tree to check against`)
    console.error('Fetch it first (git fetch origin main) rather than reading this as a library failure.')
    process.exit(2)
  }
}
// Two predicates, and the difference between them is the guard. An empty scope
// still records everything, so the ordinary authoring path is unchanged, but it
// names nothing, so any drifted range is unnamed and the refusal fires.
const named = (entry, ref, key) =>
  scope.some((s) => s === entry || s === `${entry}/${ref}` || s === key)
const inScope = (entry, ref, key) => scope.length === 0 || named(entry, ref, key)
const lock = existsSync(lockPath) ? JSON.parse(readFileSync(lockPath, 'utf8')) : {}
const fresh = {}
let checked = 0
let stale = 0
const problems = []
// Ranges whose recorded fingerprint no longer matches the tree. Collected in
// update mode too, because the whole point of the refusal is that the run
// which is about to re-record them has not read them.
const drifted = []

// The one place that decides which tree a citation is resolved against, so
// that every bounds check and every fingerprint below agrees about it. Returns
// the file's lines, or null when the tree does not carry the path at all.
// Cached per path because a skill cites the same file many times and `git
// show` is a process each call.
const seen = new Map()
const asLines = (text) => text.replace(/\n$/, '').split('\n')
const treeLines = (path) => {
  if (seen.has(path)) return seen.get(path)
  let lines = null
  if (base === null) {
    const abs = join(root, path)
    // Trailing newline makes split() yield one empty extra element, which
    // let a citation one line past the end of the file pass.
    if (existsSync(abs)) lines = asLines(readFileSync(abs, 'utf8'))
  } else {
    try {
      // stderr ignored on purpose: `git show` says "exists on disk, but not
      // in <sha>" for every absent path, which is this tool's own finding and
      // is reported below in this tool's own words. Left inherited, 216
      // problems came back behind 216 lines of git's.
      lines = asLines(execFileSync('git', ['show', `${base}:${path}`], {
        cwd: root, encoding: 'utf8', maxBuffer: 256 * 1024 * 1024,
        stdio: ['ignore', 'pipe', 'ignore'],
      }))
    } catch { lines = null }
  }
  seen.set(path, lines)
  return lines
}
const inTree = base === null ? '' : ` in ${base}`

// The cited lines, whitespace-normalized, hashed. Keyed by skill/ref/path:range
// so a range that moves gets a new key and cannot inherit an old fingerprint.
const fingerprint = (lines, from, to) =>
  createHash('sha256')
    .update(lines.slice(from - 1, to).map((l) => l.trim()).join('\n'))
    .digest('hex')
    .slice(0, 16)

// A directory under skills/ that this loop's own `continue` would skip. It is
// reported before the loop rather than inside it, because the point is that
// such a directory never reaches any check below, including strayCitations,
// whose whole job is to catch a citation in a file nothing reads. See
// ./library-dirs.mjs for the probe that measured this and
// prompts/skill-extract.md §5s for the rule.
for (const d of unreadDirs(skillsDir)) {
  const why = d.nearMiss
    ? `holds ${d.nearMiss} and no SKILL.md, which is one character from a skill nothing guards`
    : d.frontmatter
      ? 'has no SKILL.md, and a markdown file in it opens with frontmatter, so it reads as a skill nothing guards'
      : 'has no SKILL.md, so no tool here reads it'
  problems.push(`${d.slug}: ${why} — rename it, or move it out of skills/ if it is not a skill`)
}

for (const entry of readdirSync(skillsDir)) {
  const file = join(skillsDir, entry, 'SKILL.md')
  if (!existsSync(file) || !statSync(join(skillsDir, entry)).isDirectory()) continue

  const text = readFileSync(file, 'utf8')
  const fm = text.match(/^---\n([\s\S]*?)\n---\n/)
  if (!fm) { problems.push(`${entry}: no frontmatter`); continue }

  // refs the skill actually cites, e.g. [E3] or [E3, E7], in every markdown
  // file of the directory and not only SKILL.md. See ./citing-files.mjs for
  // the defect that bought this: a tag in a TRIGGER-TEST.md used to be
  // invisible here, so an undeclared ref cited there passed.
  const cited = new Map()
  for (const { file, text: body } of citingTexts(join(skillsDir, entry)))
    for (const r of refsIn(body)) if (!cited.has(r)) cited.set(r, file)

  // And a tag in a file no tool here reads is not a receipt at all, which is
  // the one case widening to `.md` leaves open.
  for (const { file, refs } of strayCitations(join(skillsDir, entry)))
    problems.push(`${entry}: ${file} cites ${refs.join(', ')}, and nothing reads that file — move the claim into a .md file or drop the tag`)

  const declared = new Set()
  for (const m of fm[1].matchAll(/- ref:\s*(\S+)\n(?:.*\n)*?\s*source:\s*(.+)/g)) {
    const [, ref, sourceLine] = m
    declared.add(ref)
    // One source line may hold several path[:ranges] plus prose; see
    // ./source-line.mjs for what the pattern can and cannot see, which the
    // 2026-10-18 relevance sweep found was two things less than assumed.
    for (const { path, ranges } of sourcePaths(sourceLine)) {
      checked++
      const body = treeLines(path)
      if (body === null) { problems.push(`${entry} ${ref}: missing ${path}${base === null ? '' : ' in the base tree'}`); continue }
      if (!ranges) continue
      const lines = body.length
      for (const { part, from, to } of lineRanges(ranges)) {
        for (const n of [from, to])
          if (n < 1 || n > lines)
            problems.push(`${entry} ${ref}: ${path}:${n} out of bounds${base === null ? '' : ' in the base tree'} (${lines} lines)`)
        if (from > to) {
          problems.push(`${entry} ${ref}: ${path}:${part} is inverted`)
          continue
        }
        if (from < 1 || to > lines) continue
        const key = `${entry}/${ref}/${path}:${part}`
        const fp = fingerprint(body, from, to)
        fresh[key] = fp
        if (key in lock && lock[key] !== fp) drifted.push({ entry, ref, key })
        if (update) continue
        if (!(key in lock)) {
          // Under `--base` this is not an authoring debt, it is the citation
          // being newer than the tree, which is the ordinary state of a ref
          // written on this branch and says nothing about the claim.
          if (base !== null) continue
          problems.push(`${entry} ${ref}: ${path}:${part} has no recorded fingerprint (new or re-anchored citation; re-read the claim, then --update)`)
        } else if (lock[key] !== fp) {
          stale++
          // Two different findings share one comparison. Against the checkout
          // it means the cited lines changed under a recorded claim. Against
          // another tree it means this receipt holds here and will not hold
          // once that tree arrives, so the fix is owed before the merge and
          // re-recording against a tree nobody has is not it.
          problems.push(base === null
            ? `${entry} ${ref}: ${path}:${part} has changed since it was cited — the claim may no longer hold (re-read it, re-anchor if it moved, then --update)`
            : `${entry} ${ref}: ${path}:${part} resolves in this checkout and not in the base tree — a reader with that tree follows this citation to other lines, so re-anchor and re-read it when that tree arrives`)
        }
      }
    }
  }

  for (const [r, file] of cited) if (!declared.has(r)) problems.push(`${entry}: ${file} cites ${r}, not declared`)
  for (const r of declared) if (!cited.has(r)) problems.push(`${entry}: ${r} declared but never cited`)
}

if (update) {
  // A bare `--update` over a drifted library is the one way to discharge this
  // whole guard by accident, and until 2026-10-18 it was the command the docs
  // prescribed. Measured on the real 2026-10-18 drift batch: the checker said
  // "43 of them drifted", one bare `--update` exited 0, and the checker then
  // said OK while all 43 citations still pointed at the lines main had moved
  // under them. That is the 2026-10-08 failure the lock exists to prevent,
  // reachable in one command. So re-recording a drifted range now has to name
  // it, which is the difference between a run that decided and a run that ran
  // a command.
  //
  // The rule is about what is being re-recorded, not about what has drifted.
  // A drifted range outside the named scope keeps the value the lock already
  // holds, so it stays red and needs no refusal; blocking on it would force a
  // run to name every drifted range at once, which is the "name them all"
  // habit this is trying to replace. With a scope given this list is therefore
  // empty by construction, and the case it catches is the bare command.
  const unnamed = drifted.filter((d) => inScope(d.entry, d.ref, d.key) && !named(d.entry, d.ref, d.key))
  if (unnamed.length) {
    console.error(`refusing to --update: it would re-record ${unnamed.length} drifted range${unnamed.length === 1 ? '' : 's'} that nothing on the command line named`)
    for (const d of unnamed) console.error('  ' + d.key)
    console.error('\nRe-recording these certifies that you read them against the new lines.')
    console.error('Most of them are probably a line number that moved while the lines stayed put:')
    console.error('  node skills/relocate-anchors.mjs <old-ref>        # the mechanical share, no reading needed')
    console.error('Then name what is left, by skill slug or by lock key:')
    console.error(`  node skills/check-evidence.mjs --update ${[...new Set(unnamed.map((d) => d.entry))].join(' ')}`)
    process.exit(2)
  }
  // Out of scope means untouched: keep the value the lock already holds, so a
  // scoped update cannot bless a neighbour, and keep out-of-scope orphans too
  // rather than dropping keys this run never looked at.
  const next = {}
  for (const [key, fp] of Object.entries(fresh)) {
    const [entry, ref] = key.split('/')
    if (inScope(entry, ref, key)) next[key] = fp
    else if (key in lock) next[key] = lock[key]
  }
  if (scope.length) for (const [key, fp] of Object.entries(lock)) {
    const [entry, ref] = key.split('/')
    if (!(key in fresh) && !inScope(entry, ref, key)) next[key] = fp
  }
  writeFileSync(lockPath, JSON.stringify(next, Object.keys(next).sort(), 2) + '\n')
  const recorded = Object.keys(fresh).filter((k) => {
    const [entry, ref] = k.split('/')
    return inScope(entry, ref, k)
  }).length
  console.log(`fingerprints recorded: ${scope.length ? `${recorded} of ` : ''}${Object.keys(next).length} ranges in skills/evidence.lock.json`)
  const leftRed = drifted.filter((d) => !inScope(d.entry, d.ref, d.key))
  if (leftRed.length) {
    console.log(`  left drifted on purpose, outside the scope you named:`)
    for (const d of leftRed) console.log('    ' + d.key)
  }
  if (scope.length) console.log(`  scope: ${scope.join(', ')}`)
  // The nudge this command owes the reading half of the receipts. Re-recording
  // a fingerprint is the act that clears the only visible sign a claim needs
  // re-reading, so this is the moment to say where that duty went: the verdict
  // in relevance-audit.md was given to the old lines, and relevance-sweep.mjs
  // is now red on exactly the refs this command just turned green.
  // prompts/skill-extract.md §5o.
  console.log(`\nA re-recorded range is a claim somebody has to read again. The verdict in`)
  console.log(`skills/relevance-audit.md was given to the lines as they were:`)
  console.log(`  node skills/relevance-sweep.mjs --stale          # which verdicts this moved`)
  console.log(`  node skills/relevance-sweep.mjs --record <scope> # after you have re-read them`)
  process.exit(problems.length ? 1 : 0)
}

// A key in the lock that no citation claims any more is a citation that was
// moved or dropped. Not a failure, but worth saying, so the lock does not
// quietly accumulate.
const orphans = Object.keys(lock).filter((k) => !(k in fresh))

// Every line below names the tree when one was given, because the whole point
// of `--base` is that "the evidence check is green" is a sentence with a tense
// in it, and a transcript that does not carry the tense loses the only thing
// that distinguishes the two answers.
if (problems.length) {
  console.error(`evidence check FAILED${inTree} (${problems.length}${stale ? `, ${stale} of them drifted` : ''})`)
  for (const p of problems) console.error('  ' + p)
  process.exit(1)
}
console.log(`evidence check OK${inTree}: ${checked} sources resolved, ${Object.keys(fresh).length} ranges fingerprinted`)
if (orphans.length && base === null) console.log(`  note: ${orphans.length} stale lock entries, run --update to drop them`)
