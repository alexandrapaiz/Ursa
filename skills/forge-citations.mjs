// node skills/forge-citations.mjs [--check] [--refresh]
//
// The ninth guard, and the only one in this library whose subject is not in
// this tree. Every other check here resolves what it reads against a file:
// check-evidence.mjs fingerprints a range, relevance-sweep.mjs binds a verdict
// to the text it was read against, trigger-coverage.mjs counts pairs. A pull
// request number has no such referent. Its answer lives on the forge, it
// changes without the tree changing, and nothing edits a file when a row is
// closed.
//
// WHY IT WAS WRITTEN RATHER THAN DECLINED, because the ledger entry that
// handed it forward asked that question first and the honest answer is a
// measurement, not a preference. The alternative on the table was the cheap
// half of the rule on its own: cite the merge commit once a row merges and let
// the number disappear, since a sha needs no lock and no refresh. Priced on
// 2026-11-02 against all 700 rows this repository has ever had:
//
//   merged           315
//   closed unmerged  355
//   open              30
//
// So about half of all rows never merge and never acquire a sha. For those the
// cheap half is not a weaker remedy, it is undefined, and it is undefined for
// exactly the class that decayed: four of the ten rows this library cites are
// closed and unmerged, and no future event will give them a merge commit. The
// cheap half is this guard's easy case, which is why it is clause 2 here and
// not the whole of it.
//
// The second half of the price is the population, and it moved while the
// question sat in the ledger. Citations in this library went 0 on 2026-10-18,
// 1 on 2026-10-24, 5 on 2026-10-27, 15 at 04:27 on 2026-11-02, 19 two hours
// later. The entry asked whether a guard earns its keep for twelve lines. It
// is fifteen net of fixtures by the time the question is being answered, and it
// grows by construction, because two of this file's own methodology sections
// now require a run to name the pull request it is arguing from.
//
// WHAT IT CAN AND CANNOT CHECK, which is the whole design. It never touches the
// network. A guard that needs the network fails closed on every clone that has
// none, and the section about a guard answering from the wrong frame is already
// written. So this one checks the form and the one fact that is durable
// offline:
//
//   1. every number the library mentions is either a lock row or a declared
//      fixture, net of the fixture exemption,
//   2. a merged row carries a merge commit, and that commit resolves in THIS
//      clone when the clone is complete enough to hold it,
//   3. an unmerged row carries the lane and the branch, because the lane is the
//      field a reader can walk forward and the number is not,
//   4. and it prints the lock's age beside the measured interval over which a
//      disposition decays, because an unrefreshed lock and a fresh one are the
//      same file otherwise.
//   5. every row carries its head sha and whether that head is readable on
//      `main`, and the clone re-derives the second from the first and fails when
//      the two disagree.
//
// CLAUSE 5 WAS ADDED 2026-11-09, and the reason it is a clause and not a
// cosmetic field is that the three dispositions of clause 1 do not answer the
// question a reader of a citation actually has. §5am settled that a row number
// carries three claims and made the citation say which. None of the three is
// *can I read this change in the tree I am standing in*, which is the only one
// that decides whether following the citation works. Measured over all 386
// closed-and-unmerged rows this repository has had, read 2026-11-09:
//
//   readable on main       111   28.8%
//   not readable           206   53.4%
//   branch gone, so the
//   question is undecidable 69   17.9%
//
// So `closed-unmerged` is a label over a population that splits roughly three
// to one against the reader, and guessing is wrong 71 per cent of the time.
// Inside this library's own lane the prior is inverted: of 53 closed-unmerged
// `ursa-skill` rows, 47 are ancestors of `main`, because this seat chains each
// run's branch onto the last, so when a tip merges every row behind it lands
// without ever being merged itself. A reader who learns the repository's prior
// and applies it here is wrong 89 per cent of the time, which is why the field
// is measured per row and never inferred from the disposition.
//
// All twelve rows this library cites today are readable on `main`, the six
// labelled `closed-unmerged` included. The label said nothing of the kind.
//
// WHY IT IS LOCKED RATHER THAN DERIVED, since unlike a forge disposition this
// one is a git question and this guard already asks git questions. Because the
// evidence expires, in one direction only. A landed head is in `main`'s history
// and is therefore in every complete clone forever. An unlanded head is in the
// clone only while its branch exists, and branches here are deleted with age:
// of the closed-unmerged rows numbered under 100, 84.2 per cent are already
// undecidable from a clone; of those numbered 300 and above, 0.6 per cent are.
// The answer is available now and will not be later, which is the definition of
// a thing that belongs in a dated snapshot.
//
// AND THE OBVIOUS TEST IS WRONG ONCE IN 386, which is worth the extra command
// because the one case is in this lane. `git merge-base --is-ancestor` reports
// #608 as not readable on `main`. It has exactly one commit ahead of `main` and
// that commit is a merge of `main` into the branch, so it contributes nothing
// `main` lacks and the honest answer is yes. The predicate that gets it right
// is `git rev-list --count --no-merges main..<head>`, which is 0 there. One row
// in 386 is a rate, not a corner: say it is rare, keep the second command.
//
// WHAT CLAUSE 5 STILL CANNOT TELL YOU, stated because the opposite reading is
// the laundering §5am's own remedy exists to stop. `no` means this exact
// commit is not in your tree. It does not mean the work was lost. #258 is a
// fair example: 607 of its 613 commits have patch-identical equivalents on
// `main` and 6 do not, so the honest claim is about commits and not about
// delivery. A reader who wants delivery has to read the diff, and no field
// here replaces that.
//
// That fourth one is the reason this guard does not fail on age. The decay
// interval here was measured across all 700 rows: a row stays the newest row in
// its own lane for a median of 45 minutes, a quarter of them for under 20, and
// 51.7 percent are superseded inside the hour. A threshold would therefore turn
// every clone red an hour after a refresh, which is a check that reports the
// weather. Printing the age with the interval beside it hands the reader the
// one judgement a clone cannot make for itself.
//
// THE COMMANDS THIS GUARD PRINTS ARE ALSO EVIDENCE, and the first version of
// them carried the defect the run that wrote this guard had just retracted.
// `--refresh` told its reader to list every open row under a cap of 200 and
// then pick the lane out with jq, which is a cap spent on the queue and a
// predicate applied to whatever the cap admitted. That is the same shape as
// `gh pr list --state closed` filtered for an absent `mergedAt`, which reported
// 109 closed and unmerged rows where the population was 355. It did not bite
// here, because this repository had 15 open rows when it was written. It bites
// at 201, and nothing in the output would say when it started.
//
// Both halves of the repair are in the plan now. The lane goes into the query
// as `--search 'head:<lane>/'`, verified against this lane on 2026-11-02 at
// two rows out of fifteen open. And the plan says in words that a read whose
// row count equals its cap did not finish, because neither forge read returns
// anything like the board's `saturated` flag and the reader is the only place
// that check can live.
//
// An unknown flag is refused rather than ignored. All four of this library's
// older guards accept `--not-a-real-flag` and run their default mode, measured
// on 2026-11-02, which is how a run that asked a question the tool could not
// answer was told green. Repairing those four is a separate change with its own
// blast radius and it is in the ledger. This one starts right.
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { join, dirname, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const ROOT = join(HERE, '..')
export const LOCK = join(HERE, 'forge-citations.lock.json')

/** The files whose pull request citations this guard polices. */
export const SCOPE = ['skills', join('prompts', 'skill-extract.md')]

/** Three or four digits, so a section number in this file and an issue reference
 *  in prose cannot be confused for a row. Two-digit rows exist in this
 *  repository's history and none is cited here; widening this is a lock change
 *  and a re-measure, not a regex change. */
const CITATION = /#(\d{3,4})\b/g

const READABLE = /\.(md|mjs|js|json)$/

function walk(abs, out = []) {
  let st
  try { st = statSync(abs) } catch { return out }
  if (st.isFile()) { if (READABLE.test(abs)) out.push(abs); return out }
  if (!st.isDirectory()) return out
  for (const name of readdirSync(abs).sort()) walk(join(abs, name), out)
  return out
}

/** Every `#NNN` mention in scope, with the file and line it sits on. */
export function mentions(root = ROOT, scope = SCOPE) {
  const out = []
  for (const entry of scope) {
    for (const abs of walk(join(root, entry))) {
      if (abs === LOCK) continue
      const lines = readFileSync(abs, 'utf8').split('\n')
      lines.forEach((line, i) => {
        for (const m of line.matchAll(CITATION)) {
          out.push({ number: Number(m[1]), file: relative(root, abs), line: i + 1 })
        }
      })
    }
  }
  return out
}

export function readLock(path = LOCK) {
  const lock = JSON.parse(readFileSync(path, 'utf8'))
  const rows = new Map((lock.rows ?? []).map((r) => [r.number, r]))
  const fixtures = new Map((lock.fixtures ?? []).map((f) => [f.number, f]))
  return { lock, rows, fixtures }
}

/** Does this clone hold the object? Absent is not wrong: a shallow clone holds
 *  almost nothing, which is why the caller reports the clone's depth beside
 *  the answer rather than failing on it. */
export function resolves(sha, cwd = ROOT) {
  try {
    execFileSync('git', ['cat-file', '-e', `${sha}^{commit}`], { cwd, stdio: 'ignore' })
    return true
  } catch { return false }
}

export function cloneDepth(cwd = ROOT) {
  const ask = (args) => {
    try { return execFileSync('git', args, { cwd, encoding: 'utf8' }).trim() } catch { return null }
  }
  return {
    shallow: ask(['rev-parse', '--is-shallow-repository']) === 'true',
    commits: Number(ask(['rev-list', '--count', 'HEAD']) ?? 0) || null,
  }
}

/** The median minutes a row stays the newest row in its own lane, measured over
 *  this repository's first 700 rows on 2026-11-02 and carried as a constant
 *  because re-deriving it needs the forge. It is the yardstick for the lock's
 *  age and nothing else depends on it. */
export const DECAY_MEDIAN_MINUTES = 45

const REQUIRED = ['number', 'lane', 'branch', 'disposition', 'head', 'readable_on_main']
const DISPOSITIONS = new Set(['merged', 'closed-unmerged', 'open'])

/** Clause 5's three answers. `unknown-offline` is a real answer and not a gap:
 *  it is what a complete clone says when the row's branch has been deleted and
 *  the row never landed, and 69 of this repository's 386 closed-unmerged rows
 *  are already in that state. */
export const READABLE_ON_MAIN = new Set(['yes', 'no', 'unknown-offline'])

/** The ref a reader of a citation is standing on. §5am measured its ancestry
 *  against `this branch's head`, which is the one ref no reader has. */
export const BASE = 'origin/main'

/** Is `sha` readable on `base` from this clone, and by which of the two tests?
 *  Returns one of READABLE_ON_MAIN plus the reason, so the caller can report
 *  the merge-only case rather than silently folding it into `yes`. */
export function readableOnMain(sha, { cwd = ROOT, base = BASE } = {}) {
  if (!sha || !resolves(sha, cwd)) return { verdict: 'unknown-offline', why: 'head does not resolve in this clone' }
  const git = (args) => execFileSync('git', args, { cwd, encoding: 'utf8' }).trim()
  let baseOk = true
  try { git(['rev-parse', '--verify', `${base}^{commit}`]) } catch { baseOk = false }
  if (!baseOk) return { verdict: 'unknown-offline', why: `${base} does not resolve in this clone` }
  try {
    execFileSync('git', ['merge-base', '--is-ancestor', sha, base], { cwd, stdio: 'ignore' })
    return { verdict: 'yes', why: `ancestor of ${base}` }
  } catch { /* not an ancestor; the merge-only case is still open */ }
  const ahead = Number(git(['rev-list', '--count', '--no-merges', `${base}..${sha}`]))
  if (ahead === 0) return { verdict: 'yes', why: `no non-merge commit ahead of ${base}` }
  return { verdict: 'no', why: `${ahead} non-merge commit${ahead === 1 ? '' : 's'} ahead of ${base}` }
}

export function check({ root = ROOT, lockPath = LOCK, cwd = ROOT } = {}) {
  const { lock, rows, fixtures } = readLock(lockPath)
  const seen = mentions(root)
  const failures = []
  const unverifiable = []
  const mergeOnly = []
  const clone = cloneDepth(cwd)

  const cited = new Map()
  for (const m of seen) {
    if (fixtures.has(m.number)) continue
    if (!cited.has(m.number)) cited.set(m.number, [])
    cited.get(m.number).push(m)
  }

  for (const [number, sites] of [...cited].sort((a, b) => a[0] - b[0])) {
    const row = rows.get(number)
    if (!row) {
      failures.push(`#${number} is cited and is not in the lock: ${
        sites.map((s) => `${s.file}:${s.line}`).join(', ')}`)
      continue
    }
    for (const field of REQUIRED) {
      if (row[field] === undefined || row[field] === null || row[field] === '') {
        failures.push(`#${number} is in the lock with no \`${field}\``)
      }
    }
    if (row.disposition && !DISPOSITIONS.has(row.disposition)) {
      failures.push(`#${number} has disposition "${row.disposition}", which is not one of ${
        [...DISPOSITIONS].join(', ')}`)
    }
    if (row.disposition === 'merged') {
      if (!row.merge_commit) {
        failures.push(`#${number} is merged and carries no merge commit, so the one durable form of this citation is missing`)
      } else if (!resolves(row.merge_commit, cwd)) {
        unverifiable.push(`#${number} ${row.merge_commit} does not resolve in this clone`)
      }
    }
    if (row.disposition !== 'merged' && row.merge_commit) {
      failures.push(`#${number} is ${row.disposition} and carries a merge commit, which cannot both be true`)
    }

    // Clause 5. The lock states the answer and the clone re-derives it, so a
    // disagreement is a failure rather than a preference. Three of the four
    // disagreements are decidable here; the fourth is the honest unknown.
    if (row.readable_on_main && !READABLE_ON_MAIN.has(row.readable_on_main)) {
      failures.push(`#${number} has readable_on_main "${row.readable_on_main}", which is not one of ${
        [...READABLE_ON_MAIN].join(', ')}`)
    } else if (row.head && row.readable_on_main) {
      const got = readableOnMain(row.head, { cwd })
      if (got.verdict === 'unknown-offline' && row.readable_on_main === 'yes') {
        // Asymmetric on purpose, and this is the one arm that is provable. A
        // head readable on main is in main's history, so a complete clone
        // cannot fail to hold it. In a complete clone this is a wrong lock.
        const msg = `#${number} is locked readable on main and its head ${
          row.head.slice(0, 8)} ${got.why}, which a complete clone cannot be`
        if (clone.shallow) unverifiable.push(`${msg} (this clone is shallow, so it is not evidence)`)
        else failures.push(msg)
      } else if (got.verdict === 'unknown-offline') {
        unverifiable.push(`#${number} readable_on_main="${row.readable_on_main}" cannot be rechecked: ${got.why}`)
      } else if (got.verdict !== row.readable_on_main) {
        failures.push(`#${number} is locked readable_on_main="${row.readable_on_main}" and this clone says "${
          got.verdict}" (${got.why})`)
      } else if (got.why.startsWith('no non-merge')) {
        mergeOnly.push(`#${number} ${row.head.slice(0, 8)} is readable on main only because ${got.why}`)
      }
    }
  }

  // A fixture declares how many mentions it exempts, and until this check
  // existed nothing read that number. Both of them had drifted upward: #618
  // declared 4 against 7 in the tree and #999 declared 2 against 3, found by
  // printing the counts while re-deriving this library's other capped read.
  // The declaration is the bound on the exemption, so an unchecked one widens
  // every time somebody writes the number down.
  //
  // The check is asymmetric, and that is the design rather than a shortcut.
  // More mentions than declared is a failure, because the exemption now covers
  // text no reviewer saw. Fewer is reported and not failed, because a removed
  // mention narrows the exemption and harms nobody, and both of the real
  // drifts found here were upward. An exact-equality check would also redden
  // this clone every time a test asserts on one of these numbers in a string,
  // which is the self-reference §5ag of the register named: writing the check
  // moved the count the check reads.
  // A lock dated in the future is not stale, it is misdated, and every
  // sentence this guard prints about decay is then meaningless. It printed
  // "read -9 minutes ago" on this run, because the hand that bumped `read_at`
  // rounded it forward past the clock. Negative age is a failure; positive age
  // stays a printed number for the reason given in the header.
  const narrowed = []
  for (const [number, f] of [...fixtures].sort((a, b) => a[0] - b[0])) {
    if (f.mentions === undefined) continue
    const actual = seen.filter((m) => m.number === number).length
    if (actual > f.mentions) {
      failures.push(`#${number} is a declared fixture for ${f.mentions} mention${
        f.mentions === 1 ? '' : 's'} and this tree has ${actual}, so the exemption covers ${
        actual - f.mentions} mention${actual - f.mentions === 1 ? '' : 's'} nobody declared`)
    } else if (actual < f.mentions) {
      narrowed.push(`#${number} declares ${f.mentions} mentions and this tree has ${actual}`)
    }
  }

  // A lock row nobody cites is not a failure. It is a citation a run removed,
  // and removing the row would destroy the dated reading. It is reported.
  const orphans = [...rows.keys()].filter((n) => !cited.has(n)).sort((a, b) => a - b)

  const ageMinutes = lock.read_at
    ? Math.round((Date.now() - Date.parse(lock.read_at.replace(/Z$/, ':00Z'))) / 60000)
    : null

  if (ageMinutes !== null && ageMinutes < 0) {
    failures.push(`the lock's read_at is ${-ageMinutes} minutes in the future, so it was not read when it says it was`)
  }

  return {
    lock, rows, fixtures, mentions: seen, cited, failures, unverifiable, orphans, narrowed, ageMinutes,
    mergeOnly,
    fixtureMentions: seen.filter((m) => fixtures.has(m.number)).length,
    clone,
  }
}

export function refreshPlan(lockPath = LOCK) {
  const { rows } = readLock(lockPath)
  const numbers = [...rows.keys()].sort((a, b) => a - b).join(' ')
  return [
    'This guard never calls the network. To re-take the snapshot, run these by hand',
    'and write the answers into skills/forge-citations.lock.json with a new read_at:',
    '',
    `  for n in ${numbers}; do`,
    '    gh pr view $n --json number,state,headRefName,mergedAt,mergeCommit \\',
    '      --jq \'[.number,.state,.headRefName,(.mergedAt//"-"),(.mergeCommit.oid//"-")]|@tsv\'',
    '  done',
    '',
    'For a row that is closed or open, the disposition is a snapshot and the lane is',
    'the durable field. This resolves the lane\'s live tip, which is the thing a',
    'reader actually wants. The predicate is in the query and not in a filter after',
    'it, so the cap is spent on the lane rather than on the whole queue:',
    '',
    '  gh pr list --state open --search \'head:<lane>/\' --limit 100 \\',
    '    --json number,headRefName,updatedAt',
    '',
    'Both of these reads are capped, and neither surface says so. A read whose row',
    'count equals its cap did not finish, so it is a subset and not an answer: widen',
    'the cap or narrow the window and run it again before writing anything down.',
    '',
    'Clause 5 is a git question and not a forge one, so it is re-derived rather than',
    'looked up, and it needs a COMPLETE clone: run `bash tools/ensure-full-clone.sh`',
    'first or every row reads `unknown-offline`. Both commands are needed, because',
    'the first is wrong for a row whose only commit ahead is a merge of main:',
    '',
    `  for n in ${numbers}; do`,
    '    sha=$(gh pr view $n --json headRefOid --jq .headRefOid)',
    '    if ! git cat-file -e "$sha^{commit}" 2>/dev/null; then echo "$n unknown-offline"',
    '    elif git merge-base --is-ancestor "$sha" origin/main; then echo "$n yes"',
    '    elif [ "$(git rev-list --count --no-merges origin/main..$sha)" = 0 ]; then echo "$n yes"',
    '    else echo "$n no"; fi',
    '  done',
    '',
    'Write the sha into `head` and the verdict into `readable_on_main`. Take this at',
    'the same instant as the dispositions above: for a row that never landed, the',
    'answer exists only while its branch does, and it is already gone for 17.9 per',
    'cent of this repository\'s closed-and-unmerged rows.',
  ].join('\n')
}

const run = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]
if (run) {
  const flags = process.argv.slice(2)
  const known = new Set(['--check', '--refresh'])
  const unknown = flags.filter((f) => !known.has(f))
  if (unknown.length) {
    console.error(`unknown flag${unknown.length === 1 ? '' : 's'}: ${unknown.join(' ')}`)
    console.error(`this guard takes ${[...known].join(' or ')}, and refuses what it does not understand`)
    console.error(`rather than running its default mode, which is what the other four do.`)
    process.exit(2)
  }
  if (flags.includes('--refresh')) {
    console.log(refreshPlan())
    process.exit(0)
  }
  const r = check()
  const citationLines = r.mentions.length - r.fixtureMentions
  console.log(`${r.mentions.length} pull request mentions in ${SCOPE.join(' and ')}: ${
    citationLines} citations over ${r.cited.size} rows, plus ${
    r.fixtureMentions} fixture mentions of #${[...r.fixtures.keys()].join(', #')}.`)
  console.log(`${r.rows.size} rows in the lock. Dispositions: ${
    ['merged', 'open', 'closed-unmerged'].map((d) =>
      `${[...r.rows.values()].filter((x) => x.disposition === d).length} ${d}`).join(', ')}.`)
  const merged = [...r.rows.values()].filter((x) => x.disposition === 'merged')
  console.log(`${merged.filter((x) => resolves(x.merge_commit)).length} of ${
    merged.length} merge commits resolve in this clone (${
    r.clone.shallow ? 'shallow' : `complete, ${r.clone.commits} commits`}).`)
  const byReach = (v) => [...r.rows.values()].filter((x) => x.readable_on_main === v).length
  console.log(`Readable on ${BASE}: ${['yes', 'no', 'unknown-offline'].map(
    (v) => `${byReach(v)} ${v}`).join(', ')}. This is clause 5 and it is not the`)
  console.log(`disposition restated: ${[...r.rows.values()].filter(
    (x) => x.disposition === 'closed-unmerged' && x.readable_on_main === 'yes').length} of the ${
    [...r.rows.values()].filter((x) => x.disposition === 'closed-unmerged').length} closed-and-unmerged rows here are`)
  console.log(`readable anyway, because this seat chains its branches and a merged tip lands`)
  console.log(`every row behind it. Repository-wide the same split runs the other way.`)
  if (r.mergeOnly.length) {
    console.log(`\n${r.mergeOnly.length} row${r.mergeOnly.length === 1 ? ' is' : 's are'} the case \`--is-ancestor\` alone gets wrong:`)
    for (const m of r.mergeOnly) console.log(`  ${m}`)
  }
  if (r.ageMinutes !== null) {
    console.log(`\nThe lock was read ${r.ageMinutes} minutes ago. A row stays the newest row in its`)
    console.log(`own lane for a median of ${DECAY_MEDIAN_MINUTES} minutes, so a lock older than that is`)
    console.log(`more likely than not to name a row its lane has moved past. This is printed`)
    console.log(`and not failed on: a threshold here would redden every clone an hour after a`)
    console.log(`refresh, and the judgement belongs to the reader.`)
  }
  if (r.orphans.length) {
    console.log(`\n${r.orphans.length} lock row${r.orphans.length === 1 ? ' is' : 's are'} cited nowhere: #${
      r.orphans.join(', #')}. Kept deliberately; a dated reading is not deleted because a citation moved.`)
  }
  if (r.narrowed.length) {
    console.log(`\n${r.narrowed.length} fixture declaration${
      r.narrowed.length === 1 ? ' is' : 's are'} wider than the tree needs:`)
    for (const n of r.narrowed) console.log(`  ${n}`)
    console.log(`  Reported and not failed: a removed mention narrows the exemption.`)
  }
  if (r.unverifiable.length) {
    console.log(`\n${r.unverifiable.length} merge commit${
      r.unverifiable.length === 1 ? '' : 's'} cannot be verified from this clone:`)
    for (const u of r.unverifiable) console.log(`  ${u}`)
    console.log(`  Absent is not wrong. Complete the clone and re-run before reading this as a defect.`)
  }
  if (r.failures.length) {
    console.log(`\n${r.failures.length} failure${r.failures.length === 1 ? '' : 's'}:`)
    for (const f of r.failures) console.log(`  ${f}`)
    process.exit(1)
  }
  console.log(`\nEvery pull request this library cites is locked with a disposition, a date, a lane,`)
  console.log(`and whether a reader standing on ${BASE} can read what it changed.`)
}
