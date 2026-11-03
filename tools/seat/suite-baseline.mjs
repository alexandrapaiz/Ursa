#!/usr/bin/env node
// Is the trunk red, and did *I* do it?
//
// WHY THIS EXISTS. On 2026-11-02 this seat ran the whole suite on `main`
// and on a sibling's branch to decide whether a merge it had just resolved
// had broken anything. Both sides printed the same four failures, so the
// resolution was clean — and the trunk was red, and had been, unobserved.
//
// Unobserved by construction, not by neglect. Exactly one of this
// repository's twelve workflows triggers on `push` or `pull_request`
// (`redaction-gate.yml`), and it is a `grep`. **No CI job here runs
// `node --test` at all.** So the only observers are the seats, and a seat
// runs the suite on its own branch, where a trunk-inherited failure was
// already red at branch point. Every seat then reads those failures
// correctly as "not mine" and moves on, which is the right call each time
// and leaves nobody holding the trunk. A fleet of fresh clones that only
// ever compares itself to itself cannot see a standing red.
//
// So the missing instrument is not another test. It is a BASELINE: a
// committed record of what red looks like on `main`, against which a run
// can answer the only two questions that matter — "is this mine?" and
// "did something I should tell somebody about just get fixed?"
//
// THREE VERDICTS, because two is the shape that hides the trunk:
//
//   NEW_RED    failing, and not in the baseline  -> yours, and blocking
//   STILL_RED  failing, and in the baseline      -> not yours; owner named
//   FIXED      in the baseline, now passing      -> drop it from the file
//
// Only NEW_RED is a non-zero exit. STILL_RED is the trunk's standing debt
// and must not block a seat that did not incur it; FIXED is good news that
// still needs a commit, so it prints loudly and exits 0.
//
// KEYED ON THE TEST'S NAME, NEVER ITS NUMBER. `node --test` numbers the
// whole run flat, so adding one test file renumbers every test after it.
// A baseline keyed on `149` would go stale on an unrelated commit and
// start accusing innocent tests. This is the org's own rule — for any duty
// whose failure mode is paying twice, key at least one guard on the
// artifact rather than on its position — applied here rather than quoted.
//
// TWO INVOCATION TRAPS THIS TOOL REFUSES TO INHERIT, both met live:
//
//   `node --test tools/`  resolves `tools` as a module and dies with
//        MODULE_NOT_FOUND, reporting `# fail 1` — a red build that is
//        really a typo. Ursa's engineer recorded this in `docs/ideas.md`
//        on 2026-11-02; this seat then hit it independently an hour later,
//        which is how a ledger entry earns its keep. Use the glob.
//
//   `node --test ... | tail`  reports *tail's* exit code, which is 0. This
//        seat read "exit 0" off a pipeline with four failures in it and
//        briefly believed the suite was green. Never judge a suite by the
//        exit status of something downstream of it.
//
// AND A POSITIVE CONTROL, because an absence is a measurement. A run that
// collects zero tests prints zero failures, which is indistinguishable
// from green by any check that only counts red. `minPoints` in the baseline
// file is the floor: if the parsed total falls below it, this tool refuses
// with exit 2 and says the suite did not run, rather than reporting health.
//
// The floor is in TOP-LEVEL TAP POINTS, which is not node's `# tests`, and
// the control earned its keep by catching this seat conflating the two on
// its first real run. On `main` @ 2a18d98f the suite prints `1..421` and
// `# tests 707`: 421 top-level points, 707 counting nested subtests. A
// floor of 700 against a parse that yields 421 refuses a healthy suite. So
// the name says which quantity it is, and the two numbers are both recorded
// in the baseline rather than one being left to be inferred.

import { readFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { dirname, resolve, relative } from 'node:path'

export const SUITE_GLOB = 'tools/**/*.test.mjs'
const HERE = dirname(fileURLToPath(import.meta.url))
export const REPO_ROOT = resolve(HERE, '..', '..')
export const BASELINE_PATH = resolve(HERE, 'suite-baseline.json')

// A TAP point: `not ok 149 - <name>` / `ok 150 - <name>`, top level only.
// Nested subtests are indented by `node --test`, and the indented copies
// are duplicates of points that also appear flat, so anchoring to column 0
// counts each test once.
// Indent is captured, because the two uses need different levels. The FLOOR
// counts top-level points only — nested subtests appear twice in this
// output (772 lines at any indent against 421 at column 0), so counting
// every indent would inflate the control into uselessness. FAILURE
// DETECTION reads every indent and de-duplicates by key, so that a failing
// nested subtest cannot hide from it. In this repository's suite today no
// failure is nested — zero indented `not ok` on both `main` and the branch
// measured — but that is a property of these test files and not a promise
// `node --test` makes, and a guard that relies on it would be relying on
// the absence of a feature its subjects are free to start using.
const POINT = /^(\s*)(not ok|ok) (\d+) - (.*)$/
// A TAP directive: `ok 26 - the host test # SKIP no board source on this host`.
// It must come OFF the name, for two independent reasons found by running
// this tool against a baseline entry that skips:
//
//  1. Glued on, the directive is part of the key, so a test whose skip
//     REASON changes becomes a different test.
//  2. A skip is reported by `node --test` as `ok`, so a baseline entry that
//     starts skipping reads as passing — and this tool then called it GONE
//     and offered to drop it. Either way a real debt gets written off by a
//     host that simply cannot run the test.
//
// That second one is not hypothetical here. `tools/board/read-filters.test.mjs`
// keys on `/srv/asc/hq/runtime/board/api.py`, a HOST path outside this
// repository, and skips itself when it is absent. So its red is not a
// property of `main` at all, and on a host without HQ's checkout this tool
// would have announced the trunk's debt as paid.
const DIRECTIVE = /\s+#\s*(SKIP|TODO)\b\s*(.*)$/i
// The failure's YAML block carries an absolute path; the baseline stores a
// repo-relative one so it compares equal across hosts and worktrees.
const LOCATION = /^\s+location: '(.+?):(\d+):(\d+)'$/
// node's own plan and counts. Preferring the producer's numbers to our
// derived ones is the same discipline this tool's header asks for
// elsewhere: do not re-derive a figure its author already prints.
const PLAN = /^1\.\.(\d+)$/m
const SUMMARY = (word) => new RegExp(`^# ${word} (\\d+)$`, 'm')

export function readSummary (text) {
  const plan = PLAN.exec(text)
  const n = (w) => {
    const m = SUMMARY(w).exec(text)
    return m === null ? null : Number(m[1])
  }
  return {
    plan: plan === null ? null : Number(plan[1]),
    tests: n('tests'),
    pass: n('pass'),
    fail: n('fail'),
    skipped: n('skipped')
  }
}

export function parseTap (text) {
  const points = []
  const lines = String(text).split('\n')
  for (let i = 0; i < lines.length; i++) {
    const m = POINT.exec(lines[i])
    if (m === null) continue
    const raw = m[4].trim()
    const dir = DIRECTIVE.exec(raw)
    const point = {
      ok: m[2] === 'ok',
      number: Number(m[3]),
      // The name without the directive, so the key survives a changed reason.
      name: dir === null ? raw : raw.slice(0, dir.index).trim(),
      directive: dir === null ? null : dir[1].toUpperCase(),
      directiveReason: dir === null ? null : dir[2].trim(),
      depth: m[1].length,
      file: null,
      line: null
    }
    // A skipped test did not pass. `node --test` prints it as `ok`, and
    // treating that as a pass is how an unrunnable test reads as a fixed one.
    point.skipped = point.directive === 'SKIP' || point.directive === 'TODO'
    // Scan the YAML block that belongs to this point, stopping at the next
    // point so a passing test cannot inherit the previous failure's site.
    for (let j = i + 1; j < lines.length; j++) {
      if (POINT.test(lines[j])) break
      const loc = LOCATION.exec(lines[j])
      if (loc === null) continue
      point.file = toRepoPath(loc[1])
      point.line = Number(loc[2])
      break
    }
    points.push(point)
  }
  return points
}

// The suite's own root segment, taken from the glob rather than written
// twice. Everything this tool can ever see a failure in lives under it.
export const SUITE_ROOT = SUITE_GLOB.split('/')[0]

// Absolute -> repo-relative, in two stages, because one is not enough and
// the second one was found by running the tool rather than by thinking.
//
// STAGE 1 is relative-to-root, which is right whenever the TAP was produced
// in this checkout.
//
// STAGE 2 exists because it often is not. This seat measured `main` in its
// own clone and a sibling branch in a WORKTREE at /tmp/wt699, then compared
// both against one baseline. Stage 1 alone leaves the worktree's paths
// absolute — deliberately, since inventing `../wt699/...` would name no file
// here — and the keys then match nothing. The same four standing failures
// came out as four NEW_RED *and* four GONE: it accused an innocent branch of
// breaking four tests and simultaneously reported four of the trunk's debts
// as no longer collected. Both halves point the expensive way.
//
// So when stage 1 escapes the root, anchor on the suite root segment
// instead: the last `/tools/` in the path begins the part that is the same
// in every checkout. This couples the function to SUITE_GLOB, which is why
// it reads the segment off the glob instead of repeating the word.
export function toRepoPath (p, root = REPO_ROOT) {
  if (!p.startsWith('/')) return p
  const rel = relative(root, p)
  if (!rel.startsWith('..')) return rel
  const anchor = `/${SUITE_ROOT}/`
  const at = p.lastIndexOf(anchor)
  // No suite root in the path means this is not one of our test files at
  // all, and a path we cannot place is left exactly as it came.
  return at === -1 ? p : p.slice(at + 1)
}

// Identity of a test, for the baseline. Name plus file: the name alone can
// legitimately repeat across files ("the happy path"), and the file alone
// is far too coarse.
export function keyOf (point) {
  return `${point.file ?? '?'}\u0000${point.name}`
}

export function compare (points, baseline, summary = {}) {
  const known = new Map((baseline.red ?? []).map((e) => [`${e.file}\u0000${e.name}`, e]))
  // Failures from every nesting level, de-duplicated by key so a nested
  // failure counted twice is still one failure.
  const failing = dedupeByKey(points.filter((p) => !p.ok && !p.skipped))
  // Passing means passing: a skip is neither a pass nor a failure, and it
  // gets its own verdict below rather than being folded into either.
  const passing = points.filter((p) => p.ok && !p.skipped)
  const skipped = points.filter((p) => p.skipped)

  const newRed = failing.filter((p) => !known.has(keyOf(p)))
  const stillRed = failing
    .filter((p) => known.has(keyOf(p)))
    .map((p) => ({ ...p, ...known.get(keyOf(p)) }))

  // FIXED is every baseline entry that now passes. A baseline entry whose
  // test has been DELETED or RENAMED is not fixed and not failing, so it
  // is reported separately: silently dropping it would quietly shrink the
  // trunk's recorded debt without anybody having paid it.
  const passingKeys = new Set(passing.map(keyOf))
  const skippedByKey = new Map(skipped.map((p) => [keyOf(p), p]))
  const allKeys = new Set(points.map(keyOf))
  const fixed = []
  const vanished = []
  const unrunnable = []
  for (const [k, e] of known) {
    // Order matters: skipped is checked before passing, because a skip
    // arrives wearing `ok`.
    if (skippedByKey.has(k)) unrunnable.push({ ...e, reason: skippedByKey.get(k).directiveReason })
    else if (passingKeys.has(k)) fixed.push(e)
    else if (!allKeys.has(k)) vanished.push(e)
  }
  return {
    newRed,
    stillRed,
    fixed,
    vanished,
    unrunnable,
    skipped: skipped.length,
    // The floor's quantity. node's own `1..N` when the TAP carries it, and
    // our count of top-level points when it does not, because a truncated
    // TAP with no plan line must not be allowed to read as a full run.
    points: summary.plan ?? points.filter((p) => p.depth === 0).length,
    planFromProducer: summary.plan !== null && summary.plan !== undefined,
    // node's `# tests`, which is NOT the number of lines at any indent: on
    // `main` those are 707 and 772. Reporting our own line count under the
    // producer's name is the mistake this field exists to avoid.
    collected: summary.tests ?? null
  }
}

function dedupeByKey (points) {
  const seen = new Set()
  return points.filter((p) => {
    const k = keyOf(p)
    if (seen.has(k)) return false
    seen.add(k)
    return true
  })
}

export function formatReport (cmp, baseline) {
  const out = []
  const collected = cmp.collected === null ? 'unstated' : `${cmp.collected} collected`
  const src = cmp.planFromProducer ? "node's 1..N" : 'counted, no plan line'
  out.push(`suite: ${cmp.points} top-level points (${src}), ${collected} (floor ${baseline.minPoints} points)`)
  out.push('')
  if (cmp.newRed.length > 0) {
    out.push(`NEW_RED  ${cmp.newRed.length} — not in the baseline, so this is yours:`)
    for (const p of cmp.newRed) out.push(`  ${p.file}:${p.line ?? '?'}  ${p.name}`)
    out.push('')
  }
  if (cmp.stillRed.length > 0) {
    out.push(`STILL_RED  ${cmp.stillRed.length} — the trunk's standing debt, not yours:`)
    for (const p of cmp.stillRed) {
      out.push(`  ${p.file}  ${p.name}`)
      out.push(`      since ${p.since}, owner: ${p.owner ?? 'UNOWNED'}${p.ref ? ` (${p.ref})` : ''}`)
    }
    out.push('')
  }
  if (cmp.fixed.length > 0) {
    out.push(`FIXED  ${cmp.fixed.length} — green now; drop from ${relative(REPO_ROOT, BASELINE_PATH)}:`)
    for (const e of cmp.fixed) out.push(`  ${e.file}  ${e.name}`)
    out.push('')
  }
  if (cmp.unrunnable.length > 0) {
    out.push(`UNRUNNABLE  ${cmp.unrunnable.length} — skipped on this host, so neither paid nor broken:`)
    out.push('  A skip is reported as `ok`. It is not a pass and this debt stays open.')
    for (const e of cmp.unrunnable) {
      out.push(`  ${e.file}  ${e.name}`)
      out.push(`      skipped: ${e.reason || '(no reason given)'}`)
    }
    out.push('')
  }
  if (cmp.vanished.length > 0) {
    out.push(`GONE  ${cmp.vanished.length} — in the baseline and no longer collected at all.`)
    out.push('  A deleted or renamed test is not a paid debt. Say which it was:')
    for (const e of cmp.vanished) out.push(`  ${e.file}  ${e.name}`)
    out.push('')
  }
  if (cmp.newRed.length === 0 && cmp.fixed.length === 0 &&
      cmp.vanished.length === 0 && cmp.unrunnable.length === 0) {
    out.push(cmp.stillRed.length === 0
      ? 'Green, and the baseline is empty — the trunk owes nothing.'
      : 'No change: every failure is the trunk\'s own, already recorded and owned.')
  }
  return out.join('\n')
}

// exit 2 = the suite did not run (refuse, do not report health)
// exit 1 = NEW_RED
// exit 0 = everything else, including a red trunk somebody else owns
export function exitCodeFor (cmp, baseline) {
  if (cmp.points < baseline.minPoints) return 2
  return cmp.newRed.length > 0 ? 1 : 0
}

function runSuite () {
  // No shell, and the glob is passed to node itself, which expands it. A
  // directory argument here is the MODULE_NOT_FOUND trap in the header.
  const r = spawnSync(process.execPath, ['--test', SUITE_GLOB], {
    cwd: REPO_ROOT,
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024
  })
  if (r.error) throw r.error
  return r.stdout + r.stderr
}

function main (argv) {
  const tapFlag = argv.indexOf('--tap')
  const tap = tapFlag === -1 ? runSuite() : readFileSync(argv[tapFlag + 1], 'utf8')
  const baseline = JSON.parse(readFileSync(BASELINE_PATH, 'utf8'))
  const cmp = compare(parseTap(tap), baseline, readSummary(tap))
  const code = exitCodeFor(cmp, baseline)
  if (code === 2) {
    console.error(`REFUSED: parsed ${cmp.points} top-level points, floor is ${baseline.minPoints}.`)
    console.error('The suite did not run. Zero failures from zero tests is not green.')
    console.error(`Expected invocation: node --test '${SUITE_GLOB}' (a directory argument dies with MODULE_NOT_FOUND).`)
    process.exit(2)
  }
  console.log(formatReport(cmp, baseline))
  process.exit(code)
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) {
  main(process.argv.slice(2))
}
