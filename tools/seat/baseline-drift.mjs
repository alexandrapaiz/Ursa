#!/usr/bin/env node
// A baseline describes a COMMIT, not a repository. Say when the two parted.
//
// WHY THIS EXISTS, measured 2026-11-09 on this repository's own two copies
// of one file.
//
// `tools/seat/suite-baseline.json` records what red looks like on `main`,
// and every verdict `suite-baseline.mjs` renders is a comparison against
// it: NEW_RED means "not in that file", STILL_RED means "in it, and
// therefore not yours". The file also records, honestly, the commit it was
// measured on — `measuredOn` — and until this tool existed **nothing read
// that field**. So a baseline measured on one commit was compared against
// the tree of another, and the drift between them was invisible to the tool
// and to its reader alike.
//
// THE TOOL ALREADY ASKS THE QUESTION THIS ONE ANSWERS. For a baseline row
// no longer collected, `suite-baseline.mjs` prints: "A deleted or renamed
// test is not a paid debt. Say which it was." It addresses that to whoever
// is reading, because the TAP stream it parses cannot know. The commits
// between `measuredOn` and the trunk tip do know, and they are in the clone
// already. GONE keeps asking; this answers, by name and by commit. The two
// compose and neither replaces the other.
//
// BOTH OF GONE'S TWO NAMES WERE LIVE HERE AT THE SAME TIME:
//
//  1. DELETED. Ursa's security seat measured a baseline at 23:45:00Z on
//     `613fc803` and recorded six red rows, five of them owned by the `exo`
//     seat. At 23:47:12Z — two minutes and twelve seconds later —
//     `fd0ed558` landed on the trunk and deleted the three test files those
//     five rows name (`env-facts`, `merge-verdict`, `own-prs`), because
//     that merge moved those tools onto the charter lane. The rows became
//     unpayable by anybody, including the seat they bill, before that seat
//     had read them. The sixth row names `tools/instant.test.mjs`, which
//     the same merge modified. Six of six rows had moved, and the file
//     still presented all six as the trunk's standing debt.
//
//  2. RENAMED. The baseline committed on `main` names `b16cbd2a`, 103
//     commits behind the tip. Its one red row is keyed on
//     `tools/stack/repair-pending.test.mjs` + "the real queue: measured on
//     a complete clone, or skipped with the reason named". Commit
//     `f19ab0f1`, "repair-pending: split the census off the clone property
//     in the real-queue test", renamed that test to "the real queue: every
//     open head is measurable on a complete clone". The row's key therefore
//     cannot match anything, ever again, and `suite-baseline.mjs` has been
//     reporting it as GONE — asking which of deleted or renamed it was,
//     while the answer sat in the history between the two commits.
//
// DISTANCE IS NOT THE VERDICT. Case 1 was wrong about every row it held
// after two minutes; case 2 holds one row that is wrong after 103 commits
// for a reason the distance does not express. So this tool reports distance
// because a reader wants it, and GRADES each row on whether its own subject
// moved — the org's standing rule that a guard on a duty whose failure mode
// is paying twice keys on the artifact and not on its position, applied
// here rather than quoted.
//
// WHAT THIS TOOL IS NOT. It does not run the suite, read TAP, or judge
// whether anything passes. It compares a recorded claim against the history
// that followed it. A row it calls STANDS may be green or red today — that
// is `suite-baseline.mjs`'s question, and its answer is trustworthy exactly
// to the extent this tool says the row still means what it said.

import { readFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { dirname, resolve, relative } from 'node:path'

const HERE = dirname(fileURLToPath(import.meta.url))
export const REPO_ROOT = resolve(HERE, '..', '..')
export const BASELINE_PATH = resolve(HERE, 'suite-baseline.json')

// How the baseline's recorded commit stands to the trunk tip.
export const CURRENT = 'CURRENT'    // the same commit; every row means what it said
export const BEHIND = 'BEHIND'      // an ancestor of the tip; rows may have moved
export const DETACHED = 'DETACHED'  // not an ancestor at all — measured off-trunk
export const ABSENT = 'ABSENT'      // not in this clone; nothing can be derived

// How one recorded row stands to the commits in between.
export const STANDS = 'STANDS'        // its file was not touched; the row still means it
export const MOVED = 'MOVED'          // its file changed, its name survived; re-derive before quoting
export const RENAMED = 'RENAMED'      // its name is gone from a file that remains; the key can never match
export const UNPAYABLE = 'UNPAYABLE'  // its file is gone; no seat can pay this row
export const UNLOCATED = 'UNLOCATED'  // the row names no file, so drift cannot be computed

// Short hashes are what the baseline stores and full hashes are what
// `rev-parse` returns, so equality is prefix equality in whichever
// direction is shorter. Case-insensitive, because git accepts either and a
// stored uppercase hash is not a different commit. Anything under seven
// characters is refused rather than guessed at: git's own abbreviation floor
// is the shortest string this repository will accept as identifying.
export function sameCommit (a, b) {
  if (!a || !b) return false
  const x = String(a).toLowerCase()
  const y = String(b).toLowerCase()
  const n = Math.min(x.length, y.length)
  if (n < 7) return false
  return x.slice(0, n) === y.slice(0, n)
}

// Pure, so the suite can assert every branch without arranging a repository
// in the shape that branch needs. `present` and `isAncestor` are answers a
// caller already got from git; this function does not ask.
export function classifyBaseline ({ measuredOn, tip, present, isAncestor, distance }) {
  if (!measuredOn) return { state: ABSENT, why: 'the baseline records no `measuredOn`', distance: null }
  if (!tip) return { state: ABSENT, why: 'the trunk tip did not resolve in this clone', distance: null }
  if (!present) {
    return {
      state: ABSENT,
      why: `\`${measuredOn}\` is not in this clone (shallow, or a branch that was deleted)`,
      distance: null
    }
  }
  if (sameCommit(measuredOn, tip)) return { state: CURRENT, why: null, distance: 0 }
  if (isAncestor) return { state: BEHIND, why: null, distance: distance ?? null }
  return {
    state: DETACHED,
    why: `\`${measuredOn}\` is not an ancestor of the trunk tip, so it was measured on work that never landed`,
    distance: null
  }
}

// `changed` maps a repo-relative path to git's name-status letter for the
// range (`A`, `M`, `D`). `nameSurvives` answers, for a file that still
// exists, whether the row's recorded test name is still literally in it:
// `true`, `false`, or `null` for not established.
//
// THE NAME CHECK IS LITERAL AND SAYS SO. A test whose name is built by
// interpolation is not findable as a string, so a miss is "not present
// literally" and never proof of a rename. That is why `null` exists as a
// third answer and why a `null` lands on MOVED rather than on RENAMED: the
// weaker verdict is the honest one when the stronger one rests on a search
// that cannot see every name.
export function classifyRow (row, changed, nameSurvives = () => null) {
  if (!row.file) return { ...row, drift: UNLOCATED }
  const status = changed.get(row.file)
  if (status === undefined) return { ...row, drift: STANDS }
  if (status === 'D') return { ...row, drift: UNPAYABLE, status }
  const survives = nameSurvives(row)
  if (survives === false) return { ...row, drift: RENAMED, status }
  return { ...row, drift: MOVED, status, nameChecked: survives === true }
}

export function assess (baseline, commits, nameSurvives) {
  const head = classifyBaseline(commits)
  // When the baseline's commit cannot be placed, per-row drift is not
  // unknown in some soft sense — it is uncomputable, and every row must say
  // so rather than falling through to the reassuring answer.
  const judgeable = head.state === CURRENT || head.state === BEHIND
  const changed = judgeable ? commits.changed ?? new Map() : null
  const grade = (rows) => (rows ?? []).map(r => judgeable
    ? classifyRow(r, changed, nameSurvives)
    : { ...r, drift: UNLOCATED })
  return {
    head,
    judgeable,
    red: grade(baseline.red),
    repaired: grade(baseline.repaired),
    measuredOn: baseline.measuredOn ?? null,
    measuredAt: baseline.measuredAt ?? null,
    tip: commits.tip ?? null
  }
}

// A row is only as good as its subject. Count the ones a reader must not
// quote without re-deriving first.
export function tally (a) {
  const of = (d) => a.red.filter(r => r.drift === d).length
  return {
    unpayable: of(UNPAYABLE),
    renamed: of(RENAMED),
    moved: of(MOVED),
    stands: of(STANDS),
    unlocated: of(UNLOCATED),
    redTotal: a.red.length
  }
}

// exit 2 = the drift could not be computed, so nothing here is a verdict
// exit 1 = at least one recorded red row's subject moved, was renamed, or vanished
// exit 0 = every recorded row still names what it was measured against
export function exitCodeFor (a) {
  if (!a.judgeable) return 2
  const t = tally(a)
  return (t.unpayable + t.renamed + t.moved + t.unlocated > 0) ? 1 : 0
}

const DRIFT_NOTES = {
  [UNPAYABLE]: [
    'The test file is gone from the trunk. No seat can make this row green,',
    'including the one it bills. This is the answer GONE asks for: deleted,',
    'and by which commit.'
  ],
  [RENAMED]: [
    'The file remains and the recorded name is no longer in it. This row is',
    'keyed on a string that cannot match again, so it will read as GONE for',
    'as long as it is carried. Re-key it or drop it; it will not resolve itself.'
  ],
  [MOVED]: [
    'The file changed after the measurement and the recorded name survived it.',
    'The row may already be paid. Re-derive before quoting it at anyone, and',
    'do not bill a seat off it.'
  ],
  [UNLOCATED]: [
    'The row names no file, so its drift cannot be computed at all.'
  ]
}

export function formatReport (a, { deletedBy = new Map() } = {}) {
  const out = []
  const rel = relative(REPO_ROOT, BASELINE_PATH)
  const at = a.measuredAt ? ` at ${a.measuredAt}` : ''
  out.push(`${rel}: measured on \`${a.measuredOn ?? 'unstated'}\`${at}`)
  out.push(`trunk tip: \`${a.tip ?? 'unresolved'}\``)

  if (!a.judgeable) {
    out.push('')
    out.push(`${a.head.state} — ${a.head.why}.`)
    out.push('No row below can be graded, so none of them are graded. A baseline whose')
    out.push('commit cannot be placed is not a description of this trunk, and reading it')
    out.push('as one is the whole defect this tool exists to name.')
    return out.join('\n')
  }

  out.push(a.head.state === CURRENT
    ? 'CURRENT — the same commit. Every row means what it said.'
    : `BEHIND by ${a.head.distance ?? '?'} commit(s). Distance is not the verdict; the rows are.`)
  out.push('')

  const t = tally(a)
  for (const drift of [UNPAYABLE, RENAMED, MOVED, UNLOCATED]) {
    const rows = a.red.filter(r => r.drift === drift)
    if (rows.length === 0) continue
    out.push(`${drift}  ${rows.length} of ${t.redTotal} recorded red:`)
    for (const l of DRIFT_NOTES[drift]) out.push(`  ${l}`)
    for (const r of rows) {
      out.push(`  ${r.file}  ${r.name}`)
      out.push(`      since ${r.since ?? '?'}, owner: ${r.owner ?? 'UNOWNED'}`)
      const d = deletedBy.get(r.file)
      if (d) out.push(`      deleted by ${d.sha} — ${d.subject}`)
    }
    out.push('')
  }

  if (t.stands > 0) {
    out.push(`STANDS  ${t.stands} of ${t.redTotal} recorded red — subject untouched since measurement:`)
    for (const r of a.red.filter(r => r.drift === STANDS)) out.push(`  ${r.file}  ${r.name}`)
    out.push('')
  }

  const repairedMoved = a.repaired.filter(r => r.drift !== STANDS)
  if (repairedMoved.length > 0) {
    out.push(`Also: ${repairedMoved.length} of ${a.repaired.length} \`repaired\` rows have moved since measurement.`)
    out.push('Those are advisory rather than debts, so they do not change the exit code.')
    out.push('')
  }

  if (t.unpayable + t.renamed + t.moved + t.unlocated === 0) {
    out.push('Every recorded red row still names the file and test it was measured against.')
  }
  return out.join('\n')
}

// ---- the git half, kept apart from everything above so the suite can test
// ---- the judgement without arranging a repository to produce it.

function git (args) {
  return spawnSync('git', args, { cwd: REPO_ROOT, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 })
}

// `origin/main` first, because that is the trunk, and the local `main` of a
// seat's fresh clone can be behind it or absent. Falls back rather than
// failing, and reports which ref answered, because a tip read off the wrong
// ref is the same class of error as a baseline read off the wrong commit.
export function resolveTip (run = git) {
  for (const ref of ['origin/main', 'main']) {
    const r = run(['rev-parse', '--verify', '--quiet', `${ref}^{commit}`])
    const sha = (r.stdout || '').trim()
    if (r.status === 0 && sha) return { tip: sha, ref }
  }
  return { tip: null, ref: null }
}

export function parseNameStatus (text) {
  const changed = new Map()
  for (const line of (text || '').split('\n')) {
    if (!line.trim()) continue
    const parts = line.split('\t')
    const status = parts[0]
    // A rename prints `R100\told\tnew`. Both sides matter: the old path is
    // what a baseline row names, and under that name it is gone.
    if (status.startsWith('R') && parts.length >= 3) {
      changed.set(parts[1], 'D')
      changed.set(parts[2], 'A')
      continue
    }
    if (parts.length >= 2) changed.set(parts[1], status[0])
  }
  return changed
}

function collectCommits (baseline, run = git) {
  const measuredOn = baseline.measuredOn ?? null
  const { tip, ref } = resolveTip(run)
  const blank = { measuredOn, tip, ref, present: false, isAncestor: false, distance: null, changed: new Map() }
  if (!measuredOn || !tip) return blank
  if (run(['cat-file', '-e', `${measuredOn}^{commit}`]).status !== 0) return blank
  const isAncestor = run(['merge-base', '--is-ancestor', measuredOn, tip]).status === 0
  const distance = Number((run(['rev-list', '--count', `${measuredOn}..${tip}`]).stdout || '0').trim()) || 0
  const changed = isAncestor
    ? parseNameStatus(run(['diff', '--name-status', measuredOn, tip]).stdout)
    : new Map()
  return { measuredOn, tip, ref, present: true, isAncestor, distance, changed }
}

// Does the row's recorded test name still appear, literally, in the file as
// it stands at the tip? Read from the tip's blob and not the worktree, so a
// seat's own uncommitted edits cannot answer a question about the trunk.
function nameSurvivesAt (tip, run = git) {
  const cache = new Map()
  return (row) => {
    if (!row.name) return null
    if (!cache.has(row.file)) {
      const r = run(['show', `${tip}:${row.file}`])
      cache.set(row.file, r.status === 0 ? r.stdout : null)
    }
    const text = cache.get(row.file)
    if (text === null) return null
    return text.includes(row.name)
  }
}

// For each vanished file, the commit that removed it — so the report can
// answer GONE's question by name instead of restating it.
function deletionsFor (files, range, run = git) {
  const out = new Map()
  for (const f of files) {
    const r = run(['log', '--diff-filter=D', '--format=%h\t%s', '-1', range, '--', f])
    const line = (r.stdout || '').trim().split('\n')[0]
    if (!line) continue
    const [sha, ...rest] = line.split('\t')
    out.set(f, { sha, subject: rest.join('\t') })
  }
  return out
}

function main (argv) {
  const pathArg = argv.indexOf('--baseline')
  const file = pathArg === -1 ? BASELINE_PATH : resolve(argv[pathArg + 1])
  const baseline = JSON.parse(readFileSync(file, 'utf8'))
  const commits = collectCommits(baseline)
  const a = assess(baseline, commits, commits.tip ? nameSurvivesAt(commits.tip) : undefined)
  const code = exitCodeFor(a)
  let deletedBy = new Map()
  if (a.judgeable) {
    const gone = a.red.filter(r => r.drift === UNPAYABLE).map(r => r.file)
    if (gone.length > 0) deletedBy = deletionsFor(gone, `${commits.measuredOn}..${commits.tip}`)
  }
  const report = formatReport(a, { deletedBy })
  if (code === 2) {
    console.error(report)
    process.exit(2)
  }
  console.log(report)
  if (commits.ref && commits.ref !== 'origin/main') {
    console.log(`(tip read from \`${commits.ref}\`; \`origin/main\` did not resolve in this clone)`)
  }
  process.exit(code)
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) {
  main(process.argv.slice(2))
}
