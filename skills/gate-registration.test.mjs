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
// That asymmetry is asserted below rather than described, because it is the
// reason `skills/relocate-anchors.mjs` is excused in THIS file and not in the
// baseline, and a reader who did not know it would move the row and be right
// to think they were tidying up.

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

test('the baseline route cannot be taken before the root widens, and the gate-list route can', () => {
  // The asymmetry the header names, asserted against `decide()` itself so that
  // a change to the registry's ordering behaviour breaks this file rather than
  // being discovered by a red on somebody else's branch.
  //
  // The candidate set here is the NARROW one that is live today: no skills/
  // path is in it, which is exactly the condition under test.
  const candidates = [{ path: 'tools/example.mjs', lang: 'javascript', exitCalls: 1 }]
  const shared = {
    candidates,
    exists: () => true,
    checkIds: ['example'],
    ledgerHeadings: [],
  }

  const viaBaseline = decide({
    ...shared,
    registered: new Map([['tools/example.mjs', ['example']]]),
    baseline: {
      entries: [{
        path: 'skills/relocate-anchors.mjs',
        kind: 'write-action',
        why: 'a reason comfortably past the twenty-character floor the registry enforces',
      }],
    },
  })
  assert.deepEqual(
    viaBaseline.problems.map((p) => p.kind), ['stale-entry'],
    'excusing a skills/ path in the baseline while the roots default is tools+scripts must be a '
      + 'finding; if it is not, the ordering this suite documents has changed',
  )

  const viaGateList = decide({
    ...shared,
    registered: new Map([
      ['tools/example.mjs', ['example']],
      ['skills/relocate-anchors.mjs', ['some-skill-check']],
    ]),
    baseline: { entries: [] },
  })
  assert.deepEqual(
    viaGateList.problems, [],
    'naming a skills/ path in the gate list before the sweep can see it must cost nothing',
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
