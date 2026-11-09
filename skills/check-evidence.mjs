#!/usr/bin/env node
// Checks that every evidence ref in every skill resolves: the file exists, the
// line range named is in bounds, and the lines still say what they said when
// the citation was written. Cheap, but it is the difference between "skills
// with receipts" and skills with footnotes.
//
//   node skills/check-evidence.mjs                      verify
//   node skills/check-evidence.mjs --update             re-record the fingerprints
//   node skills/check-evidence.mjs --update <slug>      ... only under that skill
//   node skills/check-evidence.mjs --update <slug>/<ref>  ... only that citation
//   node skills/check-evidence.mjs --base origin/main   verify against that tree
//
// Which granularity a re-record needs is not the caller's choice, and a slug is
// not a name for a range that has drifted. A slug covers a range the lock has
// never recorded, which is a new or re-anchored citation and the ordinary
// authoring path. Once the lock holds a different value for a range, the range
// has to be named by ref, or followed by relocate-anchors.mjs when the lines it
// cited merely moved. The refusal below sorts the two and names the repair each
// one wants; see it for what bought the rule.
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
import { citingTexts, declaredRefs, refsIn, strayCitations } from './citing-files.mjs'
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
// Lines the failure report prints after the problems, for things that are a
// repair rather than a finding. Kept apart from `problems` because that array's
// length is the count the FAILED line publishes.
const notes = []
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
//
// Split in two on 2026-11-09 so the window search below hashes by the same
// rule rather than by a second copy of it. The only thing `fingerprint` adds
// is the 1-based slice, which is the part a window search does not want.
const hashLines = (trimmed) =>
  createHash('sha256').update(trimmed.join('\n')).digest('hex').slice(0, 16)
const fingerprint = (lines, from, to) =>
  hashLines(lines.slice(from - 1, to).map((l) => l.trim()))

// Where in this file the lines a lock row recorded can still be found, by
// hashing every window of the same height and comparing to the recorded value.
// Returns the 1-based start of each match, so an empty array means the cited
// text is not in this file at all any more.
//
// Why this is here and not a call into relocate-anchors.mjs, which asks a
// question that looks identical. That tool recovers the as-cited lines from
// `git show <old-ref>:<path>` and then searches for them, so it needs a ref
// and refuses without one. This question has no ref to be given: the lock
// holds the hash and not the text, and a hash is enough to search for when
// you are willing to hash every window. That is the whole reason the split
// below is computable inside a guard that takes no ref.
//
// WHERE IT IS WRONG, and the direction is permissive. More than one match
// means a person has to choose which offset, and this returns them all rather
// than deciding, so the caller can print every one and the ambiguity is
// visible; relocate-anchors.mjs is the tool that refuses to choose by
// proximity. And a range that is entirely blank after trimming matches every
// blank window in the file, so it would always read as moved and a slug would
// always cover it. That is a citation to nothing rather than a receipt, and it
// is not guarded for here: measured 2026-11-09 over all 466 rows of the lock,
// the count of such ranges is zero. If one appears, the citation is the defect.
const trimmedLines = new Map()
// Keyed `height path`, because a path can contain a space and a height cannot.
const windowsAt = new Map()
const findableAt = (path, lines, height, want) => {
  if (height < 1 || height > lines.length) return []
  if (!trimmedLines.has(path)) trimmedLines.set(path, lines.map((l) => l.trim()))
  const trimmed = trimmedLines.get(path)
  // One pass per (path, height) rather than one per range, because a drift
  // batch is many ranges over few files and the same window height recurs:
  // measured 2026-11-09 on the real lock, 466 ranges are 326 distinct
  // (path, height) pairs, and the 49 ranges into ursa-major/src/types.ts are
  // 27 heights. The pass costs the same whether it is looking for one hash or
  // all of them, so it records every window it hashes and the lookup is then
  // free for every later range of that height.
  const bucket = `${height} ${path}`
  if (!windowsAt.has(bucket)) {
    const index = new Map()
    for (let i = 0; i + height <= trimmed.length; i++) {
      const h = hashLines(trimmed.slice(i, i + height))
      if (index.has(h)) index.get(h).push(i + 1)
      else index.set(h, [i + 1])
    }
    windowsAt.set(bucket, index)
  }
  return windowsAt.get(bucket).get(want) ?? []
}

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
  // One parser for the evidence table, in ./citing-files.mjs, because
  // trigger-coverage.mjs counts the same declarations to check the index's
  // `Refs` column and a second regex here would be a second answer.
  for (const { ref, sourceLine } of declaredRefs(text)) {
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
        // The range is carried along with the key because the gone-or-moved
        // split below needs the window height and the file's lines, and this
        // is the one place that already has both. `part` comes too, because
        // from 2026-11-09 the verify report is also built out of these records
        // and its lines are addressed the way every other problem line is.
        if (key in lock && lock[key] !== fp)
          drifted.push({ entry, ref, key, path, part, from, to, body })
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
          //
          // Only the second one is worded here. The first is worded after the
          // loop, out of the `drifted` record this iteration just pushed,
          // because the repair it should name is decided by a search this
          // iteration cannot afford to run for every range. The two are the
          // same condition, so every drift counted here has a record there.
          if (base !== null)
            problems.push(`${entry} ${ref}: ${path}:${part} resolves in this checkout and not in the base tree — a reader with that tree follows this citation to other lines, so re-anchor and re-read it when that tree arrives`)
        }
      }
    }
  }

  for (const [r, file] of cited) if (!declared.has(r)) problems.push(`${entry}: ${file} cites ${r}, not declared`)
  for (const r of declared) if (!cited.has(r)) problems.push(`${entry}: ${r} declared but never cited`)
}

if (update) {
  // One refusal, and it says a drifted range is never covered by a skill slug.
  //
  // It was two until 2026-11-09. The first caught the run that named nothing,
  // the second the run that named a slug over a range whose cited text had
  // gone, and a slug still covered a range whose text had merely moved. The
  // measurement that collapsed them into this one is in the ledger entry
  // "Fifteen of sixteen drifted ranges are re-recorded at the anchor they
  // already had, and the gate that now says so still allows it": pointed at
  // the sixteen drifted ranges on `origin/main` at `55ab0ca8`, the split
  // sorted them fifteen moved and one gone, and all fifteen would have been
  // re-recorded at an anchor whose line numbers no longer held the claim. The
  // lock would then assert the claim is at those lines, which is the
  // 2026-10-05 failure it exists to prevent, and the checker would be green
  // over it.
  //
  // That happened to the run which shipped the warning, one hour after
  // writing it: `#801` merged mid-run, `docs/ideas.md` moved under `E37`,
  // `E38` and `E39`, and `--update <slug>` named all three as moved, printed
  // the offsets their text had gone to, and recorded the old anchors at exit
  // 0. The only thing between that command and three wrong anchors on `main`
  // was a person reading the output rather than the exit status. A guard whose
  // correctness depends on that is a warning, not a guard.
  //
  // So the gone-or-moved split no longer decides WHETHER to refuse. It decides
  // what the refusal tells you to do:
  //
  //   found elsewhere  the line number moved and the text did not, which needs
  //                    no reading, and `relocate-anchors.mjs` owns it
  //   found nowhere    the citation now covers prose nobody has read, which is
  //                    the 2026-10-05 failure, and a person owes it a reading
  //
  // What a slug still covers, because the answer is not "nothing" and reading
  // it that way would make this look like the gate nobody can satisfy. A range
  // the lock has never recorded is not drift, it is a new or re-anchored
  // citation, and `--update <slug>` is still the way to pay it. That is the
  // ordinary authoring path and it is untouched. The slug stopped being a name
  // for a range the lock already holds a different value for.
  //
  // The escape for both halves is the same and it is per-range on purpose: the
  // ref, or the whole lock key. Naming one range is the act that says a person
  // looked at that range, which a slug cannot say about nine of them. It is
  // deliberately not a flag, because a flag is the thing a run reaches for once
  // and then always.
  //
  // The split now runs before the refusal rather than after it, and the
  // ordering is load-bearing rather than tidy. The old first refusal ended by
  // printing `--update <slug>` as the way through, which under this rule is a
  // command the gate would then refuse, and a tool that prescribes its own
  // refusal is worse than one that says less. Naming the right repair needs
  // the split, so the split has to be computed before anything is printed.
  // The cost falls on a command that is about to exit 2: the search is 0.71s
  // over the sixteen-range batch above, across three files, one of them an
  // 11,000-line ledger.
  const sorted = drifted
    .filter((d) => inScope(d.entry, d.ref, d.key))
    .map((d) => ({ ...d, found: findableAt(d.path, d.body, d.to - d.from + 1, lock[d.key]) }))
  const byRef = (d) => scope.some((s) => s === `${d.entry}/${d.ref}` || s === d.key)
  const unnamed = sorted.filter((d) => !byRef(d))
  if (unnamed.length) {
    const n = unnamed.length
    const movedAway = unnamed.filter((d) => d.found.length)
    const gone = unnamed.filter((d) => d.found.length === 0)
    console.error(`refusing to --update: ${n} drifted range${n === 1 ? '' : 's'} named by no ref, and a skill slug is not a name for a drifted range`)
    console.error('\nRe-recording a drifted range certifies that you read that range against the')
    console.error('lines it now covers. These are sorted by whether the lines the lock recorded')
    console.error('are still somewhere in the file, which decides which repair each one wants.')
    if (movedAway.length) {
      console.error(`\n  ${movedAway.length} whose cited text is still in the file, at a different offset.`)
      console.error('  The line number moved and the text did not, so follow the text rather than')
      console.error('  re-recording the anchor. No reading is owed on these:')
      for (const d of movedAway) console.error(`    ${d.key}  cited text now at ${d.path}:${d.found.join(' or ')}`)
      console.error('  node skills/relocate-anchors.mjs <old-ref>        # the mechanical share')
    }
    if (gone.length) {
      console.error(`\n  ${gone.length} whose cited text is nowhere in the file any more.`)
      console.error('  The range covers prose nobody has read. Read each one against the lines it')
      console.error('  covers now, then name it:')
      for (const d of gone) console.error(`    ${d.key}`)
      for (const d of gone) console.error(`  node skills/check-evidence.mjs --update ${d.entry}/${d.ref}`)
    }
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
  // A moved range that reached the write, which from 2026-11-09 means somebody
  // named it by ref rather than by slug. That is the one case where recording
  // the old anchor is a decision and not an accident: the caller is saying the
  // citation means those line numbers and not the text that used to be there.
  // It stays printed, because the thing worth saying is unchanged and the
  // caller is the person best placed to notice they meant the other repair.
  //
  // Until this morning this block was the whole guard against a wrong anchor,
  // and the refusal above is what it became. The note it used to carry, that
  // the case was "not dangerous enough to refuse", was wrong on the batch that
  // was sitting on `main` while it was written: fifteen of sixteen.
  const moved = sorted.filter((d) => d.found.length)
  if (moved.length) {
    console.log(`  recorded at the anchor each one already had, which you named by ref, and the lines they cited are still in the file:`)
    for (const d of moved) console.log(`    ${d.key}  cited text now at ${d.path}:${d.found.join(' or ')}`)
    console.log(`  node skills/relocate-anchors.mjs <old-ref>      # follows the text instead of re-recording the anchor`)
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

// The verify half of the gone-or-moved split, which until 2026-11-09 was a
// sentence telling the reader to decide it: "re-read it, re-anchor if it
// moved". The `if it moved` is the one clause of that sentence this tool can
// answer, because the question is asked of the lock and the file and needs no
// git ref, and the answer was already being computed one branch away under
// `--update`. A reader looking at sixteen drifted ranges got sixteen identical
// sentences and no way to tell which of them needed a person; the triage was
// then done by hand, by three separate runs of this seat, on 2026-10-15,
// 2026-10-18 and 2026-11-02. See the 2026-11-09 ledger entry "The verify path
// can now answer the question its own failure line asks a reader to guess".
//
// Two things this deliberately does not do.
//
// It does not run under `--base`. A drift against another tree is a different
// finding with a different repair — the citation is newer than that tree and
// the fix is owed before the merge — and the offsets found in the base tree's
// copy of the file would be offsets in a file nobody here has checked out.
//
// It does not refuse, promote or reorder anything. The exit status, the count
// in the FAILED line and the one-line-per-range shape are unchanged, so a
// reader or a transcript that already knows this output still recognises it.
// All that changes is which repair each line names.
//
// What it costs, measured 2026-11-09: the search runs only over ranges that
// have already drifted, so a green library pays nothing, and verify over the
// real library's 466 ranges is 0.32s with the split present and unexercised.
// Over the sixteen-range batch that produced the finding it is 1.37s against
// 0.66s, which is the whole bill and it falls on a command already exiting 1.
if (!update && base === null && drifted.length) {
  const sorted = drifted.map((d) =>
    ({ ...d, found: findableAt(d.path, d.body, d.to - d.from + 1, lock[d.key]) }))
  for (const d of sorted) {
    const where = `${d.entry} ${d.ref}: ${d.path}:${d.part}`
    problems.push(d.found.length
      ? `${where} has changed since it was cited, and the lines it recorded are now at ${d.path}:${d.found.join(' or ')} — moved, not rewritten`
      : `${where} has changed since it was cited and those lines are nowhere else in the file — the range covers prose nobody has read, so re-read it against the lines it covers now, then --update ${d.entry}/${d.ref}`)
  }
  // The reason the moved half needs no reading is said once and not on every
  // line, which is the difference between a triage and a wall: measured on a
  // real 49-range batch, the per-line version repeated one sentence 49 times
  // and the offset, which is the only thing that varies, was at the end of it.
  // The gone half keeps its full sentence on each line, because those are the
  // rare ones and each is addressed to a person about to read that range.
  //
  // It goes in `notes` and not in `problems`, because `problems.length` is the
  // number the FAILED line publishes and a repair is not a finding.
  const movedAway = sorted.filter((d) => d.found.length)
  if (movedAway.length) {
    notes.push(`${movedAway.length} of the above only moved: the line number went stale and the text did not, so no`)
    notes.push(`reading is owed on them. Follow the text rather than re-recording the anchor:`)
    notes.push(`  node skills/relocate-anchors.mjs <old-ref>`)
  }
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
  if (notes.length) console.error('')
  for (const n of notes) console.error('  ' + n)
  process.exit(1)
}
console.log(`evidence check OK${inTree}: ${checked} sources resolved, ${Object.keys(fresh).length} ranges fingerprinted`)
if (orphans.length && base === null) console.log(`  note: ${orphans.length} stale lock entries, run --update to drop them`)
