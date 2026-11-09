// Every gate-shaped file in this library is reached by a check, and the one
// that cannot be is excused in writing here.
//
// WHY THIS SUITE EXISTS, and why it is in skills/ rather than in tools/gates/.
// `tools/gates/gate-registry.mjs` asks this question of the whole tree, but it
// asks it only of the roots `gateCandidatePaths` sweeps, and that default is
// `['tools', 'scripts']`. So this library sat in the one place the registry
// could not see: its guards were reached by nothing AND were not counted as
// unreached, which is worse than being red, because a red is a fact somebody
// acts on and an empty sweep is a silence that reads like a pass.
//
// Ursa/exo measured the gap from the other side on 2026-11-09 and declined to
// close it in the same window, for a reason that is the real finding: widening
// the default turns a whole-tree gate red the same minute, and a whole-tree
// gate going red names whichever branch is tested next rather than the one
// that caused it. One commit cost 17 reds across 5 seats that way that day. So
// the repair has an order -- register first, widen second -- and an order that
// lives in two seats' memories is an order that will be got wrong once.
//
// This suite is the half of that order which can be mechanical. It holds
// BEFORE the root widens, so a new library guard cannot arrive between now and
// the widening and ambush it; and it keeps holding afterwards, when the
// registry would catch the same thing one layer up.
//
// THE ORDERING TRAP, which is the part a reader would not guess. There are two
// routes to "this candidate is accounted for" and they have OPPOSITE orderings
// against the widening:
//
//   - `scripts/ci-checks.mjs` is order-safe. `registeredPaths` only ever maps
//     a path to the checks naming it, and `decide()` consults that map
//     per-candidate, so an entry for a path the sweep cannot yet see costs
//     nothing and becomes live the moment the root widens.
//   - `gate-registry.baseline.json` is order-UNSAFE. `decide()` walks every
//     baseline entry and reports any whose path is not in the discovered
//     candidate set as `stale-entry`. So excusing a skills/ path in the
//     baseline today produces exactly the red the ordering exists to avoid,
//     one step earlier than anyone is watching for it.
//
// That asymmetry is the reason `skills/relocate-anchors.mjs` is excused in
// THIS file and not in the baseline, and a reader who did not know it would
// move the row and be right to think they were tidying up. It used to be
// asserted below as the literal string `stale-entry`, and the third correction
// at the bottom of this header is about why a literal was the wrong way to
// hold it.
//
// A CORRECTION TO THE PARAGRAPH ABOVE, measured 2026-11-09 after it was
// written. "Order-safe" was too strong a word for the gate-list route, because
// the widening is not the only instant either route is racing. Both routes are
// also racing the COMMIT, and they clear it at two different moments:
//
//   - the gate-list route's `missing-target` arm asked the INDEX, so it fired
//     on an untracked file and went quiet at `git add`
//   - the baseline route's `stale-entry` arm asks `HEAD`, because that is where
//     `gateCandidatePaths` discovers, so it fired until `git commit`
//
// So neither route was safe from the moment a gate was written, and both of
// their sentences said "Delete it" about a file that was being created. Ursa/exo
// deleted a correct baseline row to the staged case on 2026-11-09. The repair
// is a third state in `decide()`, `pending`, which both arms now return
// instead of a finding, and which is unreachable in CI because the tree under
// test there is always committed. The test named "a library row written before
// the commit is pending" below is this library's half of that, and it is
// separate from the widening test because the two axes are independent: a path
// can be invisible for being uncommitted, for being outside the swept roots, or
// for both.

// A THIRD CORRECTION, measured 2026-11-09 by this seat after Ursa/security
// wrote to ask it to decide the question. Security's note said this suite
// "asserts UNREGISTRABLE's coverage rather than the asymmetry, which means
// nothing will catch the drift", and offered to add four lines putting the
// paragraphs above into the past tense. Both halves of the premise were wrong,
// and the way they were wrong is the interesting part.
//
// The suite did assert the asymmetry, against `decide()` directly. So it was
// not green-and-blind: it was already RED against security's own branch tip
// the day the note was written, because that branch returns
// `out-of-scope-entry` where this file expected `stale-entry`. A dated past
// tense would have left that red in place.
//
// But the drift security was reaching for is real, and it arrives by the
// opposite mechanism. The old assertion was a literal, and the literal's value
// is decided by a roots default that lives on a THIRD seat's branch. Measured
// one configuration at a time:
//
//   this library's branch alone                    stale-entry         green
//   Ursa#888 alone                                 out-of-scope-entry  RED
//   Ursa#888 plus Ursa#879's widening              stale-entry         green
//
// The last row is the one that matters. With `skills` in the roots the excused
// path is a discovered candidate, the new arm never runs, and the old literal
// matches again -- so the test passes in the one configuration where the thing
// it was written to assert has ceased to exist. A test whose verdict is a
// function of merge order is not holding anything. It is three outcomes
// wearing one name.
//
// So the test below asserts the PROPERTY in each world and names no kind: that
// an excuse for a path this gate never looked at is refused rather than
// silently honoured, and that the refusal never tells the author to delete a
// row that is correct and merely early. That property holds on both repairs
// and fails on `main`, which is the tree that still carries the defect
// sentence. Verified across all five trees before this was written.
//
// AND ONE FINDING THAT IS NOT THIS SEAT'S TO FIX, recorded here because this
// file is where it was found. `decide()` is being given two mutually exclusive
// signatures on two open branches: one replaces the boolean `exists` with
// `locate(path) -> committed|uncommitted|absent` and throws a TypeError when
// `locate` is absent, the other keeps `exists` and adds `committed` and
// `roots`. Whichever merges second, every caller of the other dies in the
// call rather than returning a wrong answer. The fixtures below therefore pass
// all three spellings, so this suite keeps answering about the library
// whichever way the owner merges. `tools/gates/` is not this seat's lane, so
// the incompatibility itself is in the ledger and on the board.

import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

import { CANDIDATE_LANGS, gateCandidatePaths } from '../tools/gates/enumerate-verdicts.mjs'
import { decide, registeredPaths } from '../tools/gates/gate-registry.mjs'

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')

/** Gate-shaped files under skills/ that no check can run, with the reason and
 *  the baseline kind each one will claim once the root widens.
 *
 *  Keyed by path and carrying the kind verbatim from `KINDS`, so the row that
 *  eventually lands in `gate-registry.baseline.json` is copied rather than
 *  re-argued. A path here is a path NOT in the gate list, and the test below
 *  fails if it is in both, because a file excused and registered at once means
 *  one of the two statements is out of date. */
export const UNREGISTRABLE = {
  'skills/relocate-anchors.mjs': {
    kind: 'write-action',
    why: 'a repair tool, not a gate: with no argument it prints usage and exits 2, and its '
      + 'working mode is `<old-ref> --write`, which edits the citation anchors. There is no '
      + 'invocation of it that renders a verdict about the tree, so registering one would mean '
      + 'inventing a gate to satisfy a registry.',
  },
}

/** The library's gate candidates, by the same discriminator the registry uses:
 *  the shared `gateCandidatePaths`, pointed at this directory instead of at
 *  tools and scripts. Deriving it rather than listing it is the point -- a list
 *  here would be a second copy of a discovery rule, which is the defect
 *  `gate-registry.mjs`'s own header says it exists to catch. */
function libraryCandidates() {
  const found = gateCandidatePaths({ langs: CANDIDATE_LANGS, roots: ['skills'] })
  assert.ok(found !== null, 'the candidate sweep was unavailable, which is not an empty library')
  return found
}

/** The gate list's own view of which paths it invokes, read the way
 *  `gate-registry.mjs` reads it: through a child process, because
 *  `ci-checks.mjs` is ESM and this has to stay synchronous. */
function gateListPaths() {
  const url = new URL('../scripts/ci-checks.mjs', import.meta.url)
  const out = execFileSync(process.execPath, ['-e',
    `import(${JSON.stringify(url.href)}).then((m) => {`
    + 'console.log(JSON.stringify(m.CHECKS.map((c) => ({ id: c.id, cwd: c.cwd, argv: c.argv() }))))'
    + '})',
  ], { encoding: 'utf8', cwd: REPO_ROOT })
  const raw = JSON.parse(out)
  return registeredPaths(raw.map((c) => ({ id: c.id, cwd: c.cwd, argv: () => c.argv })))
}

test('the sweep finds this library at all, so a clean result is not an empty one', () => {
  // Exit 2 rather than exit 0 is the registry's own rule for a sweep that
  // matched nothing, and the same reasoning applies to a suite: if this file
  // ever stops discovering candidates it must fail rather than pass quietly.
  assert.ok(libraryCandidates().length >= 6, 'fewer than six gate candidates under skills/')
})

test('every gate-shaped file in this library is named by a check or excused here', () => {
  const registered = gateListPaths()
  const unreached = []
  for (const c of libraryCandidates()) {
    const byCheck = registered.has(c.path)
    const excused = Object.hasOwn(UNREGISTRABLE, c.path)
    assert.ok(
      !(byCheck && excused),
      `${c.path} is both registered in scripts/ci-checks.mjs and excused in UNREGISTRABLE, `
        + 'so one of the two statements is stale',
    )
    if (!byCheck && !excused) unreached.push(c.path)
  }
  assert.deepEqual(
    unreached, [],
    'these look like gates and nothing in scripts/ci-checks.mjs runs them. Register them there, '
      + 'or add them to UNREGISTRABLE above with the baseline kind they will claim. Doing this '
      + 'BEFORE tools/gates/enumerate-verdicts.mjs widens its roots default is the whole point '
      + 'of this suite: afterwards the registry says the same thing, by turning the whole tree '
      + 'red on whichever branch is tested next.',
  )
})

test('each excuse names a kind the registry actually has, and a reason long enough to check', () => {
  const kinds = readFileSync(resolve(REPO_ROOT, 'tools/gates/gate-registry.mjs'), 'utf8')
  for (const [path, entry] of Object.entries(UNREGISTRABLE)) {
    // Read out of the registry's own KINDS table rather than imported as a
    // value, because importing it would let a kind be renamed there and stay
    // green here, which is the exemption-with-nothing-behind-it shape this
    // library repaired in EXPECTED_ABSENT_FIXTURES on 2026-11-09.
    assert.ok(
      kinds.includes(`'${entry.kind}':`),
      `${path} claims kind "${entry.kind}", which tools/gates/gate-registry.mjs does not define`,
    )
    assert.ok(entry.why.trim().length >= 20, `${path} carries no reason a reader could check`)
  }
})

/** The tree-shaped arguments `decide()` needs, in every spelling a live
 *  version of it has asked for, with all of them agreeing that the given paths
 *  are present and committed.
 *
 *  WHY ALL THREE AND NOT THE ONE THIS BRANCH USES. `decide()`'s signature is
 *  being rewritten on two branches at once and the rewrites are mutually
 *  exclusive: one replaces the boolean `exists` with `locate(path) ->
 *  committed|uncommitted|absent` and THROWS when `locate` is absent, the other
 *  keeps `exists` and adds `committed` and `roots`. A fixture that names one
 *  spelling does not fail an assertion against the other, it dies in the call,
 *  and a suite that cannot run says nothing about the library it guards. This
 *  seat does not own `tools/gates/`, so the incompatibility is reported in the
 *  ledger rather than resolved here. What is owned is this file still working
 *  whichever way the owner merges the two. */
function treeArgs(uncommitted = []) {
  const unc = new Set(uncommitted)
  return {
    locate: (path) => (unc.has(path) ? 'uncommitted' : 'committed'),
    exists: () => true,
    committed: (path) => !unc.has(path),
    checkIds: ['example'],
    ledgerHeadings: [],
  }
}

/** Everything `decide()` said about one path, across both channels a live
 *  version of it reports through: `problems`, and the softened `pending` the
 *  `locate` rewrite adds. Normalising here is what lets the assertions below
 *  be about the SENTENCE a reader acts on rather than about which array it
 *  arrived in, and the sentence is the thing that was wrong. */
function saidAbout(result, path) {
  return [...(result.problems ?? []), ...(result.pending ?? [])].filter((p) => p.path === path)
}

/** Whether the live candidate sweep, at ITS OWN default roots, reaches this
 *  library. Asked behaviourally rather than by importing the roots list,
 *  because the list is a named export on one branch and a parameter default on
 *  another, and a test that imports the spelling is a test that breaks on
 *  whichever of the two merges. What this file needs is not the list. It is
 *  the one bit the list decides. */
function sweepReachesLibrary() {
  const all = gateCandidatePaths({ langs: CANDIDATE_LANGS })
  assert.ok(all !== null, 'the candidate sweep was unavailable, so its roots cannot be read')
  return all.some((c) => c.path.startsWith('skills/'))
}

test('a baseline excuse this library cannot yet take is refused, before and after the widening', () => {
  // WHY THIS TEST IS SHAPED AS TWO ARMS AND NOT ONE ASSERTION, measured
  // 2026-11-09 by this seat after Ursa/security asked it to decide the
  // question. The previous version of this test asserted the literal
  // `['stale-entry']`, and that literal is a function of a default that lives
  // in another seat's branch, so the test's verdict was decided by MERGE
  // ORDER. Three readied-or-draft branches, measured one at a time:
  //
  //   this branch alone              stale-entry        GREEN
  //   Ursa#888 alone (out-of-scope-
  //     entry for a tracked path
  //     outside the roots)           out-of-scope-entry RED, on security's
  //                                                    own tip, today
  //   Ursa#888 + Ursa#879's widening stale-entry        GREEN AGAIN
  //
  // The third row is the one worth the paragraph. With `skills` in the roots
  // the excused path is a discovered candidate, so the new arm never runs and
  // the old literal matches again -- the test goes green in the single
  // configuration where the thing it was written to assert no longer exists.
  // Ursa/security's note predicted drift that nothing would catch and named
  // the wrong mechanism: this suite does assert the asymmetry, it is already
  // red against #888, and the way it fails to catch the drift is by passing
  // vacuously afterwards. Asserting a symptom's NAME was the defect.
  //
  // So each arm asserts the property that is true in its own world, and both
  // of them fail on the one outcome that is dangerous in either: the excuse
  // being silently honoured for a path this gate never looked at.
  const library = 'skills/relocate-anchors.mjs'
  const entry = {
    path: library,
    kind: 'write-action',
    why: 'a reason comfortably past the twenty-character floor the registry enforces',
  }
  const shared = treeArgs()
  const outside = [{ path: 'tools/example.mjs', lang: 'javascript', exitCalls: 1 }]

  if (sweepReachesLibrary()) {
    // AFTER the widening. The path is swept, so the row is a live excuse and
    // the registry one layer up is what guards this library. The ordering this
    // suite exists to protect is discharged, and the row must now be HONOURED
    // -- reported as excused, with no problem naming it.
    const viaBaseline = decide({
      ...shared,
      candidates: [...outside, { path: library, lang: 'javascript', exitCalls: 1 }],
      registered: new Map([['tools/example.mjs', ['example']]]),
      baseline: { entries: [entry] },
    })
    assert.deepEqual(
      viaBaseline.problems.map((p) => p.path), [],
      `the sweep now reaches ${library}, so its baseline row is a live excuse and must cost `
        + 'nothing. If this is a finding, the widening landed without the row and this '
        + "library's guards are red for a reason that is not about them",
    )
    assert.deepEqual(
      viaBaseline.rows.filter((r) => r.path === library).map((r) => r.state), ['excused'],
      `${library} is swept and excused in the baseline, so it must read as excused`,
    )
    return
  }

  // BEFORE the widening. The path is not swept, so the row decides nothing and
  // the gate must say so. WHICH kind it says it with is not asserted: `main`
  // says `stale-entry`, Ursa#888 says `out-of-scope-entry`, and both are
  // refusals. What is asserted is that it is not silence, and that the
  // sentence does not tell the reader to delete a row that is correct and
  // merely early.
  const viaBaseline = decide({
    ...shared,
    candidates: outside,
    registered: new Map([['tools/example.mjs', ['example']]]),
    baseline: { entries: [entry] },
  })
  const named = viaBaseline.problems.filter((p) => p.path === library)
  assert.equal(
    named.length, 1,
    `the sweep does not reach ${library}, so excusing it in the baseline must be reported `
      + 'exactly once. Silence here is the dangerous outcome: it would mean a baseline row can '
      + 'excuse a path this gate never looked at, which is an exemption with nothing behind it',
  )
  assert.deepEqual(
    viaBaseline.rows.filter((r) => r.path === library), [],
    `${library} is not a candidate, so it cannot appear as an excused row`,
  )

  const viaGateList = decide({
    ...shared,
    candidates: outside,
    registered: new Map([
      ['tools/example.mjs', ['example']],
      [library, ['some-skill-check']],
    ]),
    baseline: { entries: [] },
  })
  assert.deepEqual(
    viaGateList.problems, [],
    'naming a skills/ path in the gate list before the sweep can see it must cost nothing. '
      + 'This half of the asymmetry is what makes scripts/ci-checks.mjs the route a library '
      + 'guard takes first, and it holds in both worlds',
  )
})

test('a library row written before the commit survives the author\'s own read of the gate', () => {
  // The second axis, on this library's own case, and independent of the first:
  // a path can be invisible to the sweep for being uncommitted, for being
  // outside the swept roots, or for both. A seat writing a new guard under
  // skills/ and its baseline row in the same working tree used to be told to
  // delete the row, by a sentence that was false in both directions: the file
  // is on disk, and it has never been a candidate so it cannot be "no longer"
  // one. The row has to survive the author's own next read of the gate, or the
  // convention in UNREGISTRABLE above cannot be followed.
  //
  // WHAT IS ASSERTED, AND WHY IT IS NOT THE CHANNEL. Two branches repair this
  // and they report it two ways: one returns it in a softened `pending` array
  // gated on `authoring`, the other keeps it in `problems` and refuses the
  // verdict with exit 2. Both are defensible and this seat does not pick
  // between them. Neither may tell the author to delete a row that is correct
  // and merely early, and that is the regression worth a test.
  const written = 'skills/not-yet-committed.mjs'
  const result = decide({
    candidates: [{ path: 'tools/example.mjs', lang: 'javascript', exitCalls: 1 }],
    registered: new Map([['tools/example.mjs', ['example']]]),
    // The author's working tree, which is the only place this state exists.
    // `decide()` will not soften a finding on a clean tree, because that is
    // what every runner checks out, so the flag is part of the fixture.
    authoring: true,
    ...treeArgs([written]),
    baseline: {
      entries: [{
        path: written,
        kind: 'write-action',
        why: 'a reason comfortably past the twenty-character floor the registry enforces',
      }],
    },
  })

  const said = saidAbout(result, written)
  assert.equal(
    said.length, 1,
    `a guard being written must be accounted for exactly once. Silence would mean its baseline `
      + 'row excuses a path the gate never looked at',
  )
  // The bare imperative, and deliberately not the word "delete". Ursa#888's
  // out-of-scope sentence ends "or delete the row if the file is genuinely not
  // a gate candidate", which is a hedged alternative offered with its
  // condition attached, and a test that reddened on it would be reddening on a
  // correct sentence. What was wrong on `main` was the unconditional form:
  // "so the entry decides nothing. Delete it".
  assert.doesNotMatch(
    said[0].why, /[.;]\s*Delete it\b/,
    `the gate told the author of ${written} to delete a row that is correct and merely early, `
      + 'with no condition attached. That sentence is the defect both repairs to decide() exist '
      + 'to remove, and it is false in two ways at once: the file is on disk, and it has never '
      + `been a candidate so it cannot be "no longer" one. What it said: ${said[0]?.why}`,
  )
  assert.deepEqual(
    result.rows.filter((r) => r.path === written), [],
    `${written} is not a candidate yet, so it cannot appear as an excused row`,
  )
})

test('every library path the gate list names is a file, and is one of these candidates', () => {
  // The converse of the test above, and the local form of the registry's own
  // `missing-target` finding. A check that names `skills/something.mjs` is
  // claiming two things: that the file is there, and that it is the kind of
  // file this sweep would discover. A check naming a path that is neither is a
  // gate list that cries wolf about itself, which `gate-registry.mjs` records
  // as worse than no gate about it.
  const discovered = new Set(libraryCandidates().map((c) => c.path))
  const tracked = new Set(
    execFileSync('git', ['-C', REPO_ROOT, 'ls-files', 'skills'], { encoding: 'utf8' })
      .split('\n').filter(Boolean),
  )
  // Test files are filtered out, and the reason is the whole reason this
  // library's guards were unaccounted for. The `tooling-suites` check's argv is
  // every tracked `*.test.mjs`, so `registeredPaths` already maps
  // `skills/check-evidence.test.mjs` -- and that is not the gate. The candidate
  // sweep drops test files, so registering a suite registers nothing the
  // registry asks about: its RULES get run and its ANSWER about the tree is
  // still read by nobody. Six of this library's guards were in exactly that
  // state, each with a passing suite beside it.
  const named = [...gateListPaths().keys()]
    .filter((p) => p.startsWith('skills/') && !/\.test\.mjs$/.test(p))
  assert.ok(named.length >= 6, `expected at least six registered library gates, found ${named.length}`)
  for (const path of named) {
    assert.ok(tracked.has(path), `scripts/ci-checks.mjs runs ${path}, which is not in this tree`)
    assert.ok(
      discovered.has(path),
      `scripts/ci-checks.mjs runs ${path}, which this sweep does not class as a gate candidate, `
        + 'so registering it accounts for nothing the registry was going to ask about',
    )
  }
})
