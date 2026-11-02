#!/usr/bin/env node
// containment.mjs — does another open pull request already contain this one?
//
//   node tools/ledger/containment.mjs 13 16          # one TSV verdict per row
//   node tools/ledger/containment.mjs --json 13 16
//   node tools/ledger/containment.mjs --conflicting   # candidates = every row the forge calls CONFLICTING
//   node tools/ledger/containment.mjs --rows rows.json 13   # pool from a file instead of `gh`
//   node tools/ledger/containment.mjs --repo DIR ...        # judge another checkout
//
// Exit 0 every candidate was classified, whatever the verdicts were. Exit 2
// nothing was classified, because a precondition this program needs was not
// true: see THE FAIL-OPEN HAZARD below. Exit 2 is also usage. There is no exit
// code meaning "a row is contained" — containment is a verdict on stdout, not
// the health of the run.
//
// WHY THIS EXISTS. `tools/ledger/requeue.sh --push` selected its rows by one
// field, GitHub's `mergeable == "CONFLICTING"`, and merged `origin/main` into
// every row it selected. For the tip of a chain of work that is the correct
// remedy. For a row that the tip already contains it is a destructive act, and
// what it destroys is not the row's content but the OWNER'S EVIDENCE: while
// `git merge-base --is-ancestor <row> <sibling>` exits 0, five duplicate rows
// are one decision, and after the trunk is merged into the four that were
// contained it is five reviews of the same work. The proof is one-way. It
// cannot be reconstructed from the branch afterwards, because the merge
// commit the requeue wrote is the thing that falsifies it.
//
// Measured by the skill seat on this repository's open queue, 2026-11-02:
// five open rows were strict ancestors of a sibling row's tip. A `--push` run
// against that queue would have merged the trunk into all five.
//
// A contained row owes a CLOSURE, not a merge. So this program answers the
// one question that distinguishes the two acts, and `requeue.sh` asks it
// before it merges anything.
//
// THE FAIL-OPEN HAZARD, which is the whole reason this file is longer than
// the four lines of logic inside it. `git merge-base --is-ancestor A B` exits
// 1 for "not an ancestor". In a clone with no history it ALSO exits 1,
// because it finds no common base — `tools/ensure-full-clone.sh` says this in
// its own header, that "non-zero means NOT CONTAINED, the opposite of the
// truth for a pair whose containment is a fact". Every seat's clone arrives in
// exactly that shape. So a guard that trusts exit 1 is not a weak guard, it is
// a guard that reports NOTHING IS CONTAINED on the one input it exists for,
// and the caller then performs the destructive act with a green light from it.
//
// Two defences, both executed here before any candidate is classified, and
// neither of them a citation:
//
//   1. `bash tools/ensure-full-clone.sh --check`, which is this repository's
//      own name for the repair and exits 1 when the clone needs it.
//   2. A self-test whose answer is known before it is asked. `HEAD~1` is an
//      ancestor of `HEAD` in every repository with two commits, and `HEAD` is
//      not an ancestor of `HEAD~1` in any. The probe is asked both, and if it
//      does not answer true and then false, it is not answering about history
//      and the run is over at exit 2. In a `--depth 1` clone `HEAD~1` does not
//      resolve and this fails, which is the point: defence 1 can be satisfied
//      by a clone that was repaired and then re-shallowed, and defence 2
//      cannot be satisfied by anything except a probe that works.
//
// WHY THERE IS NO REVERSE ANCESTRY CALL. Strict containment is wanted, not
// containment: a row is not a duplicate of itself. The ancestor relation on
// commits is a partial order, so `A` is an ancestor of `B` and `B` of `A`
// implies `A` and `B` are the same commit. Strictness is therefore exactly one
// string comparison of the two tips, and the only pairs needing a second
// opinion are the ones this program already separates out as IDENTICAL.
//
// WHICH REVISION IS JUDGED. `origin/<headRefName>`, resolved locally, because
// that is the revision `requeue.sh` merges into and a guard must judge the act
// that will actually happen rather than a nearby one. GitHub's `headRefOid` is
// the fallback and is used only when it is present in this clone. A row whose
// tip resolves to neither is UNRESOLVED and is skipped, never merged: this
// program fails CLOSED on every question it cannot answer, because the cost of
// a wrong skip is a re-run and the cost of a wrong merge is the owner's
// evidence.

import { spawnSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
export const REPO_ROOT = resolve(HERE, '..', '..')

/** The four verdicts. Exactly one is an instruction to merge. */
export const MERGE = 'MERGE'
export const CONTAINED = 'CONTAINED'
export const IDENTICAL = 'IDENTICAL'
export const UNRESOLVED = 'UNRESOLVED'

/** Every verdict that is not MERGE is a skip. Stated as data so a caller
 *  cannot drift from it by testing for the three names it remembers. */
export const isSkip = (action) => action !== MERGE

/** One line of English per verdict, for the caller that prints to a person.
 *  `row` is the classified row; `others` is its named counterparties. */
export function sentence({ number, action, others, cause }) {
  const list = others?.map((o) => `#${o.number} (${o.branch})`).join(', ')
  switch (action) {
    case CONTAINED:
      return `#${number} is already contained in ${list}. It owes a closure, not a merge: merging the trunk here would destroy the containment proof that lets both be closed as one decision.`
    case IDENTICAL:
      return `#${number} has the same tip revision as ${list}. These are the same work under two numbers; merging either one destroys the equality that says so.`
    case UNRESOLVED:
      return `#${number} was not classified: ${cause}. Skipped rather than merged, because an unanswered containment question is not a negative answer.`
    default:
      return `#${number} is contained in no other open row. Safe to merge the trunk into.`
  }
}

/**
 * The decision, with no git and no network in it.
 *
 * @param candidates rows to classify: `{ number, branch, tip }`, tip may be null
 * @param pool every open row, including the candidates themselves
 * @param isAncestor `(childTip, parentTip) => true | false | null`, where
 *        `null` means the question could not be answered at all. A probe that
 *        returns `false` for an unanswerable question reintroduces the
 *        fail-open hazard this module exists for.
 * @returns one `{ number, branch, tip, action, others, cause }` per candidate,
 *          in the order given
 */
export function classify(candidates, pool, isAncestor) {
  return candidates.map((c) => {
    const row = { number: c.number, branch: c.branch, tip: c.tip, others: [] }
    if (!c.tip) {
      return { ...row, action: UNRESOLVED, cause: 'its tip revision is not present in this clone' }
    }
    const others = pool.filter((p) => p.number !== c.number && p.tip)
    const twins = others.filter((p) => p.tip === c.tip)
    const containers = []
    const unanswered = []
    for (const p of others) {
      // Equal tips are IDENTICAL, not containment, and asking about them is
      // the one pair where the answer is true in both directions.
      if (p.tip === c.tip) continue
      const answer = isAncestor(c.tip, p.tip)
      if (answer === true) containers.push(p)
      else if (answer !== false) unanswered.push(p)
    }
    if (containers.length) return { ...row, action: CONTAINED, others: containers }
    if (twins.length) return { ...row, action: IDENTICAL, others: twins }
    if (unanswered.length) {
      const named = unanswered.map((p) => `#${p.number}`).join(', ')
      return {
        ...row,
        action: UNRESOLVED,
        cause: `its ancestry against ${named} could not be determined`,
      }
    }
    return { ...row, action: MERGE }
  })
}

const git = (repo, args) =>
  spawnSync('git', ['-C', repo, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] })

/** Is this revision a commit that exists in this clone? A missing object is
 *  the difference between "not an ancestor" and "cannot say". */
export const hasCommit = (repo, rev) => git(repo, ['cat-file', '-e', `${rev}^{commit}`]).status === 0

/**
 * An ancestry probe over a real clone, which answers `null` rather than
 * `false` whenever it is not in a position to answer.
 */
export function makeAncestryProbe(repo) {
  return (child, parent) => {
    if (!hasCommit(repo, child) || !hasCommit(repo, parent)) return null
    const r = git(repo, ['merge-base', '--is-ancestor', child, parent])
    if (r.status === 0) return true
    if (r.status === 1) return false
    return null
  }
}

/**
 * Prove the probe answers about history before trusting it on a pair whose
 * answer nobody knows. Returns null when it holds, or the reason it did not.
 */
export function probeSelfTest(repo, isAncestor) {
  const head = git(repo, ['rev-parse', 'HEAD^{commit}']).stdout?.trim()
  const parent = git(repo, ['rev-parse', 'HEAD~1^{commit}']).stdout?.trim()
  if (!head) return 'HEAD does not resolve to a commit in this checkout'
  if (!parent) {
    return 'HEAD~1 does not resolve, so this clone has no history to answer ancestry questions with (a --depth 1 clone answers them wrongly rather than refusing)'
  }
  const forward = isAncestor(parent, head)
  const backward = isAncestor(head, parent)
  if (forward !== true) {
    return `the probe says HEAD~1 is not an ancestor of HEAD (answered ${forward}), which is false in every repository, so it is not answering about this history`
  }
  if (backward !== false) {
    return `the probe says HEAD may be an ancestor of HEAD~1 (answered ${backward}), which is false in every repository`
  }
  return null
}

/** `tools/ensure-full-clone.sh --check`: exit 1 means the clone needs repair. */
export function cloneIsComplete(repo) {
  const r = spawnSync('bash', [resolve(REPO_ROOT, 'tools/ensure-full-clone.sh'), '--check', '--repo', repo], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  if (r.status === 0) return null
  const said = `${r.stdout ?? ''}${r.stderr ?? ''}`.trim().split('\n').pop() ?? ''
  return `ensure-full-clone.sh --check exited ${r.status}: ${said || 'no output'}`
}

/** Open rows from the forge. Separated so the tests can supply rows instead. */
export function openRowsFromGh() {
  const r = spawnSync(
    'gh',
    ['pr', 'list', '--state', 'open', '--limit', '300', '--json', 'number,headRefName,headRefOid,mergeable'],
    { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] },
  )
  if (r.status !== 0) throw new Error(`gh pr list failed (${r.status}): ${(r.stderr ?? '').trim()}`)
  return JSON.parse(r.stdout).map((p) => ({
    number: p.number,
    branch: p.headRefName,
    mergeable: p.mergeable,
    oid: p.headRefOid,
  }))
}

/**
 * Give every row the revision this clone would act on: `origin/<branch>`
 * first, because that is what `requeue.sh` merges into, then the forge's own
 * tip if this clone has the object, then nothing.
 */
export function resolveTips(repo, rows) {
  return rows.map((row) => {
    const local = git(repo, ['rev-parse', '--verify', '--quiet', `origin/${row.branch}^{commit}`]).stdout?.trim()
    if (local) return { ...row, tip: local, tipFrom: `origin/${row.branch}` }
    if (row.oid && hasCommit(repo, row.oid)) return { ...row, tip: row.oid, tipFrom: 'headRefOid' }
    return { ...row, tip: null, tipFrom: null }
  })
}

function main(argv) {
  let json = false
  let conflicting = false
  let rowsFile = null
  let repo = process.cwd()
  const wanted = []
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--json') json = true
    else if (a === '--conflicting') conflicting = true
    else if (a === '--rows') rowsFile = argv[++i]
    else if (a === '--repo') repo = argv[++i]
    else if (a === '-h' || a === '--help') {
      process.stdout.write(readFileSync(fileURLToPath(import.meta.url), 'utf8').split('\n').slice(1, 16).join('\n') + '\n')
      return 0
    } else if (/^#?\d+$/.test(a)) wanted.push(Number(a.replace('#', '')))
    else {
      process.stderr.write(`containment: unknown argument: ${a}\n`)
      return 2
    }
  }

  // Preconditions first, and a violated one is never a verdict.
  const cloneFault = cloneIsComplete(repo)
  if (cloneFault) {
    process.stderr.write(
      `Refusing to judge containment: this clone cannot answer history questions.\n  ${cloneFault}\n` +
        `  Repair it with \`bash tools/ensure-full-clone.sh\` and run this again.\n` +
        `  Not repaired, every row would read as contained in nothing, which is\n` +
        `  the answer that lets a caller merge the trunk into a contained row.\n`,
    )
    return 2
  }
  const isAncestor = makeAncestryProbe(repo)
  const probeFault = probeSelfTest(repo, isAncestor)
  if (probeFault) {
    process.stderr.write(`Refusing to judge containment: the ancestry probe failed its own self-test.\n  ${probeFault}\n`)
    return 2
  }

  let rows
  try {
    rows = rowsFile ? JSON.parse(readFileSync(rowsFile, 'utf8')) : openRowsFromGh()
  } catch (e) {
    process.stderr.write(`Refusing to judge containment: the open-row list is unreadable.\n  ${e.message}\n`)
    return 2
  }

  const pool = resolveTips(repo, rows)
  let candidates = pool
  if (wanted.length) candidates = wanted.map((n) => pool.find((p) => p.number === n) ?? { number: n, branch: null, tip: null })
  else if (conflicting) candidates = pool.filter((p) => p.mergeable === 'CONFLICTING')

  const verdicts = classify(candidates, pool, isAncestor)
  if (json) {
    process.stdout.write(`${JSON.stringify(verdicts, null, 2)}\n`)
  } else {
    for (const v of verdicts) {
      process.stdout.write(`${v.number}\t${v.action}\t${v.others.map((o) => o.number).join(',')}\n`)
      process.stderr.write(`  ${sentence(v)}\n`)
    }
  }
  return 0
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) {
  process.exit(main(process.argv.slice(2)))
}
