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

import { readFileSync, statfsSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { dirname, resolve, relative } from 'node:path'
// The repository's own definition of its tooling suite set, imported rather
// than re-derived. The baseline file has named `scripts/ci-checks.mjs ->
// toolingSuites()` as the canonical set since 2026-11-02; until this import
// existed that was a citation, and this tool still ran a narrower set of its
// own. Two sets is the defect the baseline's own header complains about, so
// there is now one, and it is the repository's and not this seat's.
import { toolingSuites } from '../../scripts/ci-checks.mjs'

// The set this tool used to run, kept as a named constant and no longer
// invoked. It is here because the baseline's recorded history cites its
// numbers (425 points, 711 collected) and a reader comparing those against
// today's needs to know they came off a different set, not off a movement of
// the trunk. Do not reach for it: see `canonicalSuites()` below.
export const RETIRED_SUITE_GLOB = 'tools/**/*.test.mjs'
const HERE = dirname(fileURLToPath(import.meta.url))
export const REPO_ROOT = resolve(HERE, '..', '..')
export const BASELINE_PATH = resolve(HERE, 'suite-baseline.json')

// The canonical set, resolved at run time from the index and cached for the
// process. `toolingSuites()` shells out to `git ls-files`, and `toRepoPath`
// below consults the set once per path, so a per-call resolve would turn one
// TAP parse into hundreds of forks.
let suitesCache = null
export function canonicalSuites (resolver = toolingSuites) {
  if (suitesCache === null) suitesCache = resolver()
  return suitesCache
}
// Visible for tests: the cache is process-wide and a test that injects a
// resolver must be able to put it back.
export function resetSuitesCache () { suitesCache = null }

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

// The distinct top-level segments of the suite set. Derived from the set
// itself, so it widens when the set does and there is nothing to keep in
// step by hand. On 2026-11-02 these are `tools`, `skills` and `scripts`.
export function suiteRoots (known = canonicalSuites()) {
  return [...new Set(known.map((f) => f.split('/')[0]))]
}

// Absolute -> repo-relative, in three stages, because two were not enough
// and the third was named as a blocker before it was fixed.
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
// Stage 2 used to anchor on the LAST `/tools/` in the path, a segment read
// off this tool's own narrow glob. That is the blocker window 88 recorded
// when it declined to widen the set: a failure under `skills/` or
// `scripts/`, measured in a worktree, matched no anchor and was handed back
// absolute, so exactly the rows the wider set adds were the rows that could
// not be keyed. Reproduced before the fix, with the root hard-wired to
// `tools`:
//
//     /tmp/wt699/tools/seat/own-prs.test.mjs   -> tools/seat/own-prs.test.mjs
//     /tmp/wt699/skills/ledger/check.test.mjs  -> UNCHANGED, absolute
//     /tmp/wt699/scripts/ci-checks.test.mjs    -> UNCHANGED, absolute
//
// So stage 2 is now an EXACT match and not an anchor: the suite set is a
// list of repo-relative paths, and a worktree copy of one of them ends with
// `/<that path>`. Longest match wins, so a set holding both `a/b.test.mjs`
// and `x/a/b.test.mjs` resolves the more specific one. This answers the
// question the anchor was approximating, and it needs no root segment at
// all.
//
// STAGE 3 is the old anchor, generalised over every root in the set rather
// than one read off a glob, and it is the fallback rather than the rule. It
// earns its place on the case stage 2 cannot serve: a sibling branch
// measured in a worktree may ADD a test file this checkout's index does not
// have, so the file is real and keyable and absent from `known`. Anchoring
// on its root segment still produces the key that branch's own baseline
// read would produce.
export function toRepoPath (p, root = REPO_ROOT, known = canonicalSuites()) {
  if (!p.startsWith('/')) return p
  // STAGE 2 RUNS FIRST, and the numbering is kept because the comment above
  // is the history. An exact match against the set is checkout-independent
  // by construction, so there is no checkout in which it is the wrong
  // answer, and ordering relative-to-root ahead of it was this function's
  // next defect rather than its fix. See the nested-worktree case below.
  let best = null
  for (const f of known) {
    if (p.endsWith(`/${f}`) && (best === null || f.length > best.length)) best = f
  }
  if (best !== null) return best
  // STAGE 1, now guarded. Relative-to-root is right when the TAP was
  // produced in this checkout, and a path that merely LIVES under the root
  // is not the same thing. A worktree nested inside the root — `.scratch/`,
  // which this repository's own .gitignore directs runs to use — produces
  // `.scratch/wt-main/tools/stack/repair-pending.test.mjs`, which does not
  // start with `..`, so the unguarded form accepted it and returned a key
  // naming no file in the set. Measured: that revived the four-NEW_RED-and-
  // four-GONE double count stage 2 was written to kill, and it reported the
  // trunk's one standing failure as both newly broken and no longer
  // collected. So the result has to start at a suite root to be believed.
  const rel = relative(root, p)
  if (!rel.startsWith('..') && suiteRoots(known).includes(rel.split('/')[0])) return rel
  // STAGE 3, the generalised anchor, for a suite a sibling branch added that
  // this checkout's index does not carry.
  for (const r of suiteRoots(known)) {
    const at = p.lastIndexOf(`/${r}/`)
    if (at !== -1) return p.slice(at + 1)
  }
  // No suite root in the path means this is not one of our test files at
  // all, and a path we cannot place is left exactly as it came.
  return p
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
  // FIXED WAS UNREACHABLE, and this is the fallback that reaches it. Measured
  // on node v22.23.2 on 2026-11-08: `node --test` prints the `location:` line
  // in a point's YAML block for FAILURES ONLY. A passing point carries
  // `duration_ms` and `type` and no location, so `parseTap` leaves its `file`
  // null, `keyOf` returns `?\0<name>`, and it can never equal a baseline key
  // naming a real file. So no repaired row could report FIXED. Every one of
  // them reported GONE instead — "in the baseline and no longer collected at
  // all" — of a test that was collected and passing.
  //
  // That is the structural half of the 2026-11-02 incident this file records.
  // The rename was the proximate cause and it is real; underneath it, the
  // verdict that was supposed to say "paid" could not fire for any row, with
  // or without a rename. The tool's header promises three verdicts and shipped
  // two and a half.
  //
  // It survived its own test suite because the FIXED fixture was built by
  // rewriting `not ok 149` to `ok 149` in a failure's TAP, which KEEPS the
  // failure's `location:` line. The two genuine passes in that same fixture
  // carry no location, so the fixture contradicted itself and the only
  // realistic shape was the one not exercised. A fixture derived from a
  // failure inherits the failure's provenance; that is the general lesson.
  //
  // So a row whose exact key is absent falls back to the NAME among points
  // that carry no file. `keyOf`'s header is still right that a name alone is
  // too weak to key on — names repeat across files — so the fallback is only
  // consulted when the exact match fails, it is reported as name-matched
  // rather than silently, and an ambiguous name says how many it matched.
  const byNameNoFile = (list) => {
    const m = new Map()
    for (const p of list) {
      if (p.file !== null) continue
      if (!m.has(p.name)) m.set(p.name, [])
      m.get(p.name).push(p)
    }
    return m
  }
  const passingByName = byNameNoFile(passing)
  const skippedByName = byNameNoFile(skipped)
  const fixed = []
  const vanished = []
  const unrunnable = []
  for (const [k, e] of known) {
    // Order matters: skipped is checked before passing, because a skip
    // arrives wearing `ok`. A skip carries no location either, so it needs
    // the same fallback, or an unrunnable test reads as a vanished one.
    if (skippedByKey.has(k)) unrunnable.push({ ...e, reason: skippedByKey.get(k).directiveReason })
    else if (skippedByName.has(e.name)) {
      unrunnable.push({ ...e, reason: skippedByName.get(e.name)[0].directiveReason, matchedBy: 'name' })
    } else if (passingKeys.has(k)) fixed.push({ ...e, matchedBy: 'file+name' })
    else if (passingByName.has(e.name)) {
      fixed.push({ ...e, matchedBy: 'name', nameMatches: passingByName.get(e.name).length })
    } else if (!allKeys.has(k)) vanished.push(e)
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

// A ROW'S PROVENANCE IS NOT ITS MEASURED COMMIT, which is the correction
// 2026-11-08 paid for. Keying on file and name rather than on the TAP number
// is right and this tool's header argues it at length: one new suite
// renumbers everything after it. What the header does not say is what the
// choice costs. It buys that correctness with a dependence on a STRING that
// any sibling seat may edit, and `measuredOn` cannot detect the edit, because
// a rename is not a change to the row's subject — it is a change to the row's
// KEY. The row then goes stale while still describing a real failure.
//
// CORRECTED 2026-11-09, BY exo, AND THE CORRECTION IS THE INTERESTING HALF.
// The paragraph above said `measuredOn` cannot detect the edit. That is wrong,
// and it is wrong in the direction that matters: it treats a field this file
// already records as useless, which is the reasoning that leaves a recorded
// field unread. `measuredOn` ALONE cannot detect a rename. `measuredOn` plus
// the commits between it and the trunk tip can, and those commits are in the
// clone already. exo's `tools/seat/baseline-drift.mjs` does exactly that: it
// reads the field, places it against the tip, and grades each row as stands,
// moved, renamed, unpayable or unlocated, naming the deleting commit for an
// unpayable one. Run against this baseline's pre-rebase copy on 2026-11-09 it
// returned 5 unpayable and 1 moved, with `965a4554` named as the deletion, and
// against the copy in this commit it returned CURRENT.
//
// So `flipQuery` is NOT the general answer to a stale key, and this file
// claimed it was. A hand-authored query goes stale on a rename exactly as
// readily as a key does, because a human wrote both. What `flipQuery` is
// actually for is the narrower case it earns: a row whose colour is not
// derivable from the tree at all, where no amount of commit-walking helps
// because the answer lives in the forge queue or on the host. The field stays
// required, on that reduced claim.
//
// Measured, and this seat was both the author and the cause. The baseline's
// one standing row was keyed on `the real queue: measured on a complete
// clone, or skipped with the reason named`. This seat renamed that test at
// 2026-11-02T08:56:44Z on its own open branch (f19ab0f1) and the row was
// written at 09:06:00Z, so it was contradicted ten minutes BEFORE it was
// written and on the trunk at 09:38:40Z, thirty-two minutes after. Nothing
// observed either, because no run of this instrument completed for six days.
// The tool reported it honestly as GONE, which is the right verdict and an
// unanswerable one: GONE asks "deleted or renamed?" and nothing in the row
// could answer it, so resolving it took a `git log -L` over the test's own
// line that only a run already suspicious of the row would think to make.
//
// So a row now carries `flipQuery`: the one command whose output decides the
// row's current state. It is printed beside STILL_RED, where it says how to
// check that the debt is still owed, and beside GONE, where it is the answer
// to the question GONE asks. A row without one is reported as lacking it
// rather than silently, because the absence is the finding.
export function flipLines (row) {
  if (!row.flipQuery) {
    return ['      flipQuery: NONE — this row cannot be checked without archaeology']
  }
  const lines = [`      flips on: ${row.flipQuery}`]
  if (row.flipExpect) lines.push(`      still red while: ${row.flipExpect}`)
  return lines
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
      out.push(...flipLines(p))
    }
    out.push('')
  }
  if (cmp.fixed.length > 0) {
    out.push(`FIXED  ${cmp.fixed.length} — green now; drop from ${relative(REPO_ROOT, BASELINE_PATH)}:`)
    for (const e of cmp.fixed) {
      out.push(`  ${e.file}  ${e.name}`)
      // How it was matched, because the two have different strength. A
      // passing point carries no `location:`, so the usual match for a
      // repaired row is the name, and a name can repeat across files.
      if (e.matchedBy === 'name') {
        out.push(e.nameMatches > 1
          ? `      matched on the NAME in ${e.nameMatches} files; confirm it is this one before dropping the row`
          : '      matched on the name: a passing point carries no file, so the path is not re-confirmed here')
      }
      // The rule this tool established on 2026-11-02 and must keep stating:
      // for a row that is not a function of the tree, green is not a repair.
      if (e.dependsOn && e.dependsOn !== 'tree') {
        out.push(`      dependsOn ${e.dependsOn}: green means NOT CURRENTLY REPRODUCIBLE, never FIXED — do not action this as a repair`)
      }
    }
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
    out.push('  A deleted or renamed test is not a paid debt. Say which it was,')
    out.push('  and resolve the row rather than leaving it to print again:')
    for (const e of cmp.vanished) {
      out.push(`  ${e.file}  ${e.name}`)
      out.push(`      owner: ${e.owner ?? 'UNOWNED'} — theirs to resolve`)
      out.push(...flipLines(e))
    }
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

// exit 2 = the suite did not run, or did not FINISH (refuse, do not report
//          health)
// exit 1 = NEW_RED
// exit 0 = everything else, including a red trunk somebody else owns
//
// THE FLOOR IS A FLOOR ON VOLUME AND CANNOT SEE INCOMPLETENESS, which is
// the hole `whyRefused` closes. `minPoints` was built against the empty run
// — "zero failures from zero tests is not green" — and a PARTIAL run clears
// it comfortably and then writes off every debt it never reached. Measured
// on this host on 2026-11-02: a trunk run cut off at 435 of 516 points
// cleared the 380 floor, reported `GONE 1` for the trunk's one recorded
// standing failure, and exited 0. The baseline's whole purpose is to stop a
// debt being written off by a run that could not see it, and the floor let
// it happen one level up.
//
// The producer already says whether it finished. `node --test` prints
// `1..N` and `# tests N` last, so their ABSENCE is the signal, and `compare`
// has reported it in `planFromProducer` since the field was added — into a
// string in the report header, where nothing acted on it. Reading a
// producer's own completeness marker into prose rather than into a verdict
// is the general shape here.
//
// This is not hypothetical and it is not rare. Ursa's engineer lost a full
// suite run's output file mid-flight the same day, on the same volume, and
// the salvaged half reported eight failures where the complete re-run
// reported one.
export function whyRefused (cmp, baseline) {
  if (cmp.points < baseline.minPoints) {
    return `parsed ${cmp.points} top-level points, floor is ${baseline.minPoints}`
  }
  if (!cmp.planFromProducer) {
    return `the TAP carries no \`1..N\` plan line, so the run did not finish; ${cmp.points} points were counted before it stopped`
  }
  if (cmp.collected === null) {
    return 'the TAP carries no `# tests` summary, so the run did not finish'
  }
  return null
}

export function exitCodeFor (cmp, baseline) {
  if (whyRefused(cmp, baseline) !== null) return 2
  return cmp.newRed.length > 0 ? 1 : 0
}

// A FINISHED RUN IS NOT A VALID ONE, which bounds the control above rather
// than extending it. Measured on this seat's own branch minutes after
// `whyRefused` shipped: with the shared volume at 20 MB free, the canonical
// set reported **68 NEW_RED** across five suites, exit 1. The same set on
// the same commit twenty minutes later, with 2.0 GB free, reported **zero**
// and one STILL_RED the trunk owns. Sixty-eight false accusations, every one
// of them in a suite that builds a temporary git repository.
//
// That run printed `1..600` and `# tests 933`. It FINISHED. So the plan-line
// check cannot see it, and nothing in the TAP can: the producer completed and
// reported honestly about tests that failed for a reason outside the tree.
// Completeness is a property of the producer; validity needs a property of
// the environment, and this is the cheapest one that discriminates.
//
// Ursa's engineer measured the same class the same day from the other end —
// a lost output file whose salvaged half reported eight failures where the
// complete re-run reported one — so the rule is the host's and not this
// tool's: on this volume, re-derive rather than believe.
//
// The threshold is a floor on the MINIMUM observed across the run, not on
// the value at either end, because the pressure here is other sessions and
// swings by gigabytes inside one run. A single reading before the suite is
// the measurement most likely to be taken and least likely to catch this.
//
// WHAT THIS CONTROL DOES NOT CATCH, measured rather than conceded. Sampling
// the volume every 15 seconds for three minutes while writing this:
//
//   355 MB, 0 MB, 392, 543, 638, 260, 308, 311, 645, 598, 955
//
// Free space crosses ZERO and returns to most of a gigabyte inside one
// minute. So two samples around a four-minute suite can straddle a dip
// entirely and report a floor that was never held, and a clean verdict from
// this tool means "the volume was healthy at both ends" and not "the volume
// was healthy". The honest version of the guard is a sampler running beside
// the suite; this is the cheap version, it catches the sustained case it was
// built from, and the gap is named here so the next window does not read a
// pass as proof.
export function whyUntrusted (freeMB, baseline) {
  const floor = baseline.minFreeMB
  if (!Number.isFinite(floor)) return null
  if (!Number.isFinite(freeMB)) {
    return 'the volume\'s free space could not be read, so the run cannot be vouched for'
  }
  if (freeMB < floor) {
    return `the volume fell to ${freeMB} MB free during the run, under this file's ${floor} MB floor; `
      + 'suites that build temporary repositories fail for want of disk and report as ordinary red'
  }
  return null
}

export function freeMB (path = REPO_ROOT, statfs = statfsSync) {
  try {
    const s = statfs(path)
    return Math.floor((s.bsize * s.bavail) / 1048576)
  } catch {
    return NaN
  }
}

function runSuite () {
  // No shell, and no glob: the set is a list of repo-relative paths resolved
  // from the index, which is what the repository's own `ci-checks.mjs` passes
  // `node --test`. The glob form this tool used to pass had to go to node
  // rather than a shell because node expands `**` itself and a directory
  // argument dies with MODULE_NOT_FOUND; naming the files removes that trap
  // along with the narrower set.
  // Sampled around the run and not just before it: the pressure on this
  // volume is other sessions, so the figure that matters is the lowest one
  // observed and a single pre-flight reading is the one least likely to see
  // it. Two samples is still not a watch, and it is what caught the case in
  // `whyUntrusted` -- that run began with gigabytes free and ended at 20 MB.
  const before = freeMB()
  const r = spawnSync(process.execPath, ['--test', ...canonicalSuites()], {
    cwd: REPO_ROOT,
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024
  })
  const after = freeMB()
  if (r.error) throw r.error
  return { tap: r.stdout + r.stderr, lowFreeMB: Math.min(before, after) }
}

function main (argv) {
  const tapFlag = argv.indexOf('--tap')
  // `lowFreeMB` is null for a TAP read from a file: this tool did not watch
  // that run and must not imply it did. An unknown is reported as unknown.
  const { tap, lowFreeMB } = tapFlag === -1
    ? runSuite()
    : { tap: readFileSync(argv[tapFlag + 1], 'utf8'), lowFreeMB: null }
  const baseline = JSON.parse(readFileSync(BASELINE_PATH, 'utf8'))
  const cmp = compare(parseTap(tap), baseline, readSummary(tap))
  const untrusted = lowFreeMB === null ? null : whyUntrusted(lowFreeMB, baseline)
  if (untrusted !== null) {
    console.error(`REFUSED: ${untrusted}.`)
    console.error('This is not a verdict on the tree. Re-derive it when the volume recovers;')
    console.error('on this host that has meant minutes, because the pressure is other sessions.')
    if (cmp.newRed.length > 0) {
      console.error(`Withheld: ${cmp.newRed.length} NEW_RED that this run is not entitled to report.`)
    }
    process.exit(2)
  }
  const code = exitCodeFor(cmp, baseline)
  if (code === 2) {
    console.error(`REFUSED: ${whyRefused(cmp, baseline)}.`)
    console.error('This is not a verdict on the trunk. A run that did not finish has not')
    console.error('paid any debt it failed to reach, and reporting one as GONE writes it off.')
    console.error(`The set is ${canonicalSuites().length} suites, resolved from the index by scripts/ci-checks.mjs -> toolingSuites().`)
    console.error('If that count is 0, the resolve failed and not the suite: this is not a verdict on the trunk.')
    process.exit(2)
  }
  console.log(formatReport(cmp, baseline))
  process.exit(code)
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) {
  main(process.argv.slice(2))
}
