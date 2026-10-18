#!/usr/bin/env node
// Checks that every evidence ref in every skill resolves: the file exists, the
// line range named is in bounds, and the lines still say what they said when
// the citation was written. Cheap, but it is the difference between "skills
// with receipts" and skills with footnotes.
//
//   node skills/check-evidence.mjs            verify
//   node skills/check-evidence.mjs --update   re-record the fingerprints
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
import { join } from 'node:path'
import { sourcePaths, ranges as lineRanges } from './source-line.mjs'

const root = new URL('..', import.meta.url).pathname
const skillsDir = join(root, 'skills')
const lockPath = join(skillsDir, 'evidence.lock.json')
const update = process.argv.includes('--update')
// What `--update` is allowed to re-record. Empty means everything, which is
// safe only when nothing has drifted; see the refusal below. A scope is a
// skill slug, a skill/ref pair, or a whole lock key.
const scope = process.argv.slice(2).filter((a) => !a.startsWith('--'))
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

// The cited lines, whitespace-normalized, hashed. Keyed by skill/ref/path:range
// so a range that moves gets a new key and cannot inherit an old fingerprint.
const fingerprint = (lines, from, to) =>
  createHash('sha256')
    .update(lines.slice(from - 1, to).map((l) => l.trim()).join('\n'))
    .digest('hex')
    .slice(0, 16)

for (const entry of readdirSync(skillsDir)) {
  const file = join(skillsDir, entry, 'SKILL.md')
  if (!existsSync(file) || !statSync(join(skillsDir, entry)).isDirectory()) continue

  const text = readFileSync(file, 'utf8')
  const fm = text.match(/^---\n([\s\S]*?)\n---\n/)
  if (!fm) { problems.push(`${entry}: no frontmatter`); continue }

  // refs the body actually cites, e.g. [E3] or [E3, E7]
  const cited = new Set()
  for (const m of text.slice(fm[0].length).matchAll(/\[((?:E\d+)(?:,\s*E\d+)*)\]/g))
    for (const r of m[1].split(/,\s*/)) cited.add(r)

  const declared = new Set()
  for (const m of fm[1].matchAll(/- ref:\s*(\S+)\n(?:.*\n)*?\s*source:\s*(.+)/g)) {
    const [, ref, sourceLine] = m
    declared.add(ref)
    // One source line may hold several path[:ranges] plus prose; see
    // ./source-line.mjs for what the pattern can and cannot see, which the
    // 2026-10-18 relevance sweep found was two things less than assumed.
    for (const { path, ranges } of sourcePaths(sourceLine)) {
      checked++
      const abs = join(root, path)
      if (!existsSync(abs)) { problems.push(`${entry} ${ref}: missing ${path}`); continue }
      if (!ranges) continue
      // Trailing newline makes split() yield one empty extra element, which
      // let a citation one line past the end of the file pass.
      const lines = readFileSync(abs, 'utf8').replace(/\n$/, '').split('\n').length
      for (const { part, from, to } of lineRanges(ranges)) {
        for (const n of [from, to])
          if (n < 1 || n > lines)
            problems.push(`${entry} ${ref}: ${path}:${n} out of bounds (${lines} lines)`)
        if (from > to) {
          problems.push(`${entry} ${ref}: ${path}:${part} is inverted`)
          continue
        }
        if (from < 1 || to > lines) continue
        const body = readFileSync(abs, 'utf8').replace(/\n$/, '').split('\n')
        const key = `${entry}/${ref}/${path}:${part}`
        const fp = fingerprint(body, from, to)
        fresh[key] = fp
        if (key in lock && lock[key] !== fp) drifted.push({ entry, ref, key })
        if (update) continue
        if (!(key in lock)) {
          problems.push(`${entry} ${ref}: ${path}:${part} has no recorded fingerprint (new or re-anchored citation; re-read the claim, then --update)`)
        } else if (lock[key] !== fp) {
          stale++
          problems.push(`${entry} ${ref}: ${path}:${part} has changed since it was cited — the claim may no longer hold (re-read it, re-anchor if it moved, then --update)`)
        }
      }
    }
  }

  for (const r of cited) if (!declared.has(r)) problems.push(`${entry}: body cites ${r}, not declared`)
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
  process.exit(problems.length ? 1 : 0)
}

// A key in the lock that no citation claims any more is a citation that was
// moved or dropped. Not a failure, but worth saying, so the lock does not
// quietly accumulate.
const orphans = Object.keys(lock).filter((k) => !(k in fresh))

if (problems.length) {
  console.error(`evidence check FAILED (${problems.length}${stale ? `, ${stale} of them drifted` : ''})`)
  for (const p of problems) console.error('  ' + p)
  process.exit(1)
}
console.log(`evidence check OK: ${checked} sources resolved, ${Object.keys(fresh).length} ranges fingerprinted`)
if (orphans.length) console.log(`  note: ${orphans.length} stale lock entries, run --update to drop them`)
