// node --test skills/forge-citations.test.mjs
//
// Covers the four things the guard claims and one it deliberately does not.
// The case that matters most is the last end-to-end one: it fails on the tree
// as it was before the lock existed, which is the only proof that the check
// would have caught the defect it was written for.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { execFileSync } from 'node:child_process'
import { check, mentions, refreshPlan, resolves, readableOnMain, DECAY_MEDIAN_MINUTES, READABLE_ON_MAIN } from './forge-citations.mjs'

/** A tree in the shape the real scope has: a skills/ directory and the prompt. */
function tree(files) {
  const root = mkdtempSync(join(tmpdir(), 'forge-citations-'))
  mkdirSync(join(root, 'skills'), { recursive: true })
  mkdirSync(join(root, 'prompts'), { recursive: true })
  for (const [path, body] of Object.entries(files)) {
    const abs = join(root, path)
    mkdirSync(join(abs, '..'), { recursive: true })
    writeFileSync(abs, body)
  }
  return root
}

function lockFile(root, lock) {
  const path = join(root, 'skills', 'forge-citations.lock.json')
  writeFileSync(path, JSON.stringify(lock, null, 2))
  return path
}

// Both fixtures carry clause 5's two fields, because they are required. Their
// `head` shas are the real ones and they are ancestors of this repository's
// `main`, so in a complete clone the re-derivation agrees and in a shallow one
// it is reported unverifiable rather than failed. The arms where the lock and
// the clone DISAGREE are tested against a purpose-built repository below, so
// that they do not depend on the state of the clone the suite runs in.
const MERGED = {
  number: 281, lane: 'ursa-skill', branch: 'ursa-skill/2026-10-23-message-c',
  disposition: 'merged', merge_commit: '1b097a05ea7efe55de49fa9c315024dc88c3acd7',
  at: '2026-10-23T23:58:14Z',
  head: 'b24758da47a0955d2fc790b695786fba22a52563', readable_on_main: 'yes',
}
const CLOSED = {
  number: 646, lane: 'ursa-skill', branch: 'ursa-skill/2026-11-02-message-4',
  disposition: 'closed-unmerged', at: '2026-11-02T05:08:31Z',
  head: 'b3d71d16288a81d5a3b23aec4de621377d79b25f', readable_on_main: 'yes',
}

/** A real repository with a `main`, a branch that landed, a branch that did
 *  not, and a branch whose only commit ahead of `main` is a merge of `main`.
 *  Clause 5's whole claim is about the difference between the last two, and
 *  that difference cannot be staged with fixture strings. */
function repoWithThreeBranches() {
  const root = mkdtempSync(join(tmpdir(), 'forge-clause5-'))
  const git = (...args) => execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim()
  git('init', '-q', '-b', 'main')
  git('config', 'user.email', 't@example.invalid')
  git('config', 'user.name', 'test')
  const commit = (name, body) => {
    writeFileSync(join(root, name), body)
    git('add', name)
    git('commit', '-q', '-m', name)
    return git('rev-parse', 'HEAD')
  }
  commit('base', 'base\n')
  // Landed: committed on a branch, then fast-forwarded into main.
  git('checkout', '-q', '-b', 'landed')
  const landed = commit('landed', 'landed\n')
  git('checkout', '-q', 'main')
  git('merge', '-q', '--ff-only', 'landed')
  // Not landed: one commit of its own that main never takes.
  git('checkout', '-q', '-b', 'unlanded')
  const unlanded = commit('unlanded', 'unlanded\n')
  // Main moves on without it.
  git('checkout', '-q', 'main')
  commit('later', 'later\n')
  // Merge-only: a branch at an older main, with main merged forward into it.
  git('checkout', '-q', '-b', 'mergeonly', landed)
  git('merge', '-q', '--no-ff', '-m', 'Merge main into the branch', 'main')
  const mergeOnly = git('rev-parse', 'HEAD')
  git('checkout', '-q', 'main')
  return { root, git, landed, unlanded, mergeOnly, main: git('rev-parse', 'main') }
}

test('a cited row that is in the lock passes, and the citation sites are collected', () => {
  const root = tree({ 'prompts/skill-extract.md': 'argued from #281 here\n' })
  const path = lockFile(root, { read_at: '2026-11-02T06:16Z', rows: [MERGED], fixtures: [] })
  const r = check({ root, lockPath: path })
  assert.deepEqual(r.failures, [])
  assert.deepEqual([...r.cited.keys()], [281])
  assert.equal(r.cited.get(281)[0].file, 'prompts/skill-extract.md')
  assert.equal(r.cited.get(281)[0].line, 1)
})

test('a cited row that is not in the lock fails, and the failure names the line', () => {
  const root = tree({ 'skills/a-skill/SKILL.md': 'see #999 for the argument\n' })
  const path = lockFile(root, { read_at: '2026-11-02T06:16Z', rows: [MERGED], fixtures: [] })
  const r = check({ root, lockPath: path })
  assert.equal(r.failures.length, 1)
  assert.match(r.failures[0], /#999 is cited and is not in the lock/)
  assert.match(r.failures[0], /skills\/a-skill\/SKILL\.md:1/)
})

test('a merged row with no merge commit fails, because the one durable form is the sha', () => {
  const root = tree({ 'prompts/skill-extract.md': '#281\n' })
  const path = lockFile(root, {
    read_at: '2026-11-02T06:16Z', fixtures: [],
    rows: [{ ...MERGED, merge_commit: undefined }],
  })
  const r = check({ root, lockPath: path })
  assert.equal(r.failures.length, 1)
  assert.match(r.failures[0], /merged and carries no merge commit/)
})

test('an unmerged row with no lane fails, because the lane is the only walkable field', () => {
  const root = tree({ 'prompts/skill-extract.md': '#646\n' })
  const path = lockFile(root, {
    read_at: '2026-11-02T06:16Z', fixtures: [],
    rows: [{ ...CLOSED, lane: undefined }],
  })
  const r = check({ root, lockPath: path })
  assert.equal(r.failures.length, 1)
  assert.match(r.failures[0], /#646 is in the lock with no `lane`/)
})

test('a closed row carrying a merge commit fails, since it cannot be both', () => {
  const root = tree({ 'prompts/skill-extract.md': '#646\n' })
  const path = lockFile(root, {
    read_at: '2026-11-02T06:16Z', fixtures: [],
    rows: [{ ...CLOSED, merge_commit: MERGED.merge_commit }],
  })
  const r = check({ root, lockPath: path })
  assert.match(r.failures[0], /cannot both be true/)
})

test('a declared fixture mention is not a citation and needs no row', () => {
  const root = tree({
    'skills/grep-dialect.mjs': "const s = 'merged in #618 (ancestor)'\n",
    'prompts/skill-extract.md': 'the #618 mentions are the fixture\n',
  })
  const path = lockFile(root, {
    read_at: '2026-11-02T06:16Z', rows: [],
    fixtures: [{ number: 618, why: 'fixture string', mentions: 2 }],
  })
  const r = check({ root, lockPath: path })
  assert.deepEqual(r.failures, [])
  assert.equal(r.cited.size, 0)
  assert.equal(r.fixtureMentions, 2)
})

test('a merge commit absent from this clone is reported as unverifiable, never as a failure', () => {
  const root = tree({ 'prompts/skill-extract.md': '#281\n' })
  const path = lockFile(root, {
    read_at: '2026-11-02T06:16Z', fixtures: [],
    rows: [{ ...MERGED, merge_commit: '0'.repeat(40) }],
  })
  const r = check({ root, lockPath: path, cwd: root })
  assert.deepEqual(r.failures, [])
  // Two lines now, not one, and the second is clause 5 arriving at the same
  // verdict about the same unanswerable clone: `cwd` here is a directory with
  // no `.git`, so neither the merge commit nor the head resolves. The
  // assertion is on the claim rather than on the count, because a count is
  // what a later clause moves.
  assert.ok(r.unverifiable.some((u) => /^#281 0{40} does not resolve in this clone$/.test(u)))
  assert.ok(r.unverifiable.every((u) => /#281/.test(u)))
})

test('a lock row nobody cites is reported and not failed on, because the dated reading survives the citation', () => {
  const root = tree({ 'prompts/skill-extract.md': 'no numbers here\n' })
  const path = lockFile(root, { read_at: '2026-11-02T06:16Z', fixtures: [], rows: [MERGED, CLOSED] })
  const r = check({ root, lockPath: path })
  assert.deepEqual(r.failures, [])
  assert.deepEqual(r.orphans, [281, 646])
})

test('the age is reported in minutes and nothing fails on it', () => {
  const root = tree({ 'prompts/skill-extract.md': '#281\n' })
  const old = new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString().slice(0, 16) + 'Z'
  const path = lockFile(root, { read_at: old, fixtures: [], rows: [MERGED] })
  const r = check({ root, lockPath: path })
  assert.ok(r.ageMinutes > 60 * 24 * 2, `expected a stale age, got ${r.ageMinutes}`)
  assert.deepEqual(r.failures, [])
  assert.ok(DECAY_MEDIAN_MINUTES > 0)
})

test('a two-digit number is not read as a row, which is the lock change this regex defers', () => {
  const root = tree({ 'prompts/skill-extract.md': 'issue #42 is not a row here\n' })
  const path = lockFile(root, { read_at: '2026-11-02T06:16Z', fixtures: [], rows: [] })
  const r = check({ root, lockPath: path })
  assert.deepEqual(r.failures, [])
  assert.equal(mentions(root).length, 0)
})

test('the refresh plan names every locked row and never calls the network', () => {
  const root = tree({})
  const path = lockFile(root, { read_at: '2026-11-02T06:16Z', fixtures: [], rows: [MERGED, CLOSED] })
  const plan = refreshPlan(path)
  assert.match(plan, /281 646/)
  assert.match(plan, /never calls the network/)
  assert.match(plan, /--search 'head:<lane>\/'/)
})

test('the refresh plan puts the lane in the query and never filters a capped list afterwards', () => {
  // The regression this covers is this guard's own first version, which printed
  // a 200-row list and a jq predicate over it. That is the cap-before-filter
  // shape whose published number this seat retracted the same morning, so the
  // assertion is on the absence as well as on the replacement.
  const root = tree({})
  const path = lockFile(root, { read_at: '2026-11-02T06:16Z', fixtures: [], rows: [MERGED] })
  const plan = refreshPlan(path)
  assert.doesNotMatch(plan, /startswith\("<lane>/)
  assert.doesNotMatch(plan, /--limit 200/)
  assert.match(plan, /equals its cap did not finish/)
})

test('a fixture that covers more mentions than it declares is a failure, and fewer is only reported', () => {
  const root = tree({ 'prompts/skill-extract.md': 'twice over: #777 and #777\n' })
  const under = lockFile(root, {
    read_at: '2026-11-02T06:16Z', fixtures: [{ number: 777, why: 'a fixture', mentions: 1 }], rows: [],
  })
  const r = check({ root, lockPath: under })
  assert.equal(r.failures.length, 1)
  assert.match(r.failures[0], /declared fixture for 1 mention and this tree has 2/)
  assert.match(r.failures[0], /covers 1 mention nobody declared/)

  const exact = lockFile(root, {
    read_at: '2026-11-02T06:16Z', fixtures: [{ number: 777, why: 'a fixture', mentions: 2 }], rows: [],
  })
  assert.deepEqual(check({ root, lockPath: exact }).failures, [])

  // A declaration wider than the tree is the harmless direction, so it is
  // reported and the check still exits 0.
  const over = lockFile(root, {
    read_at: '2026-11-02T06:16Z', fixtures: [{ number: 777, why: 'a fixture', mentions: 5 }], rows: [],
  })
  const o = check({ root, lockPath: over })
  assert.deepEqual(o.failures, [])
  assert.equal(o.narrowed.length, 1)
})

test('a lock dated in the future is a failure, because a negative age makes every decay sentence meaningless', () => {
  const root = tree({ 'prompts/skill-extract.md': 'no citations here\n' })
  const ahead = new Date(Date.now() + 90 * 60000).toISOString().slice(0, 16) + 'Z'
  const path = lockFile(root, { read_at: ahead, fixtures: [], rows: [] })
  const r = check({ root, lockPath: path })
  assert.equal(r.failures.length, 1)
  assert.match(r.failures[0], /minutes in the future/)
  assert.ok(r.ageMinutes < 0)
})

test('end to end on the real library: the lock covers every citation in the tree', () => {
  const r = check()
  assert.deepEqual(r.failures, [], r.failures.join('\n'))
  assert.ok(r.cited.size >= 10, `expected at least ten cited rows, got ${r.cited.size}`)
  for (const row of r.rows.values()) {
    if (row.disposition === 'merged') assert.ok(resolves(row.merge_commit), `#${row.number} sha absent`)
  }
})

test('the tree as it was before the lock would have failed, which is the only proof the check bites', () => {
  // The four rows closed in the thirty-two minutes before the previous run
  // started, cited with no disposition anywhere. Against an empty lock this is
  // four failures, one per row, each naming its line.
  const root = tree({
    'prompts/skill-extract.md': [
      'the ordering clause, argued from #601 and #633',
      'and #638, with the count rule from #646',
    ].join('\n') + '\n',
  })
  const path = lockFile(root, { read_at: '2026-11-02T06:16Z', fixtures: [], rows: [] })
  const r = check({ root, lockPath: path })
  assert.equal(r.failures.length, 4)
  assert.deepEqual([...r.cited.keys()], [601, 633, 638, 646])
})

// ---------------------------------------------------------------------------
// Clause 5. Whether a reader standing on `main` can read what the cited row
// changed. These run against a purpose-built repository rather than against
// the clone the suite happens to be in, because the three verdicts have to be
// distinguished from each other and two of them are states a clone can leave.

test('clause 5 separates landed, not landed, and the merge-only case the ancestry test alone gets wrong', () => {
  const { root, landed, unlanded, mergeOnly } = repoWithThreeBranches()
  const opts = { cwd: root, base: 'main' }

  const a = readableOnMain(landed, opts)
  assert.equal(a.verdict, 'yes')
  assert.match(a.why, /ancestor of main/)

  const b = readableOnMain(unlanded, opts)
  assert.equal(b.verdict, 'no')
  assert.match(b.why, /1 non-merge commit ahead of main/)

  // The row that costs the second command. It is not an ancestor of main, so
  // `--is-ancestor` says no, and it contributes nothing main lacks, so the
  // honest answer is yes. One row in 386 in this repository, and that row is
  // in this seat's own lane.
  const c = readableOnMain(mergeOnly, opts)
  assert.equal(c.verdict, 'yes')
  assert.match(c.why, /no non-merge commit ahead of main/)
  assert.notEqual(c.verdict, b.verdict)
})

test('clause 5 answers unknown-offline rather than no when the head is not in the clone, and the two are different claims', () => {
  const { root } = repoWithThreeBranches()
  // A well-formed sha this repository has never held. Absent is not the same
  // as unlanded: the first is a limit of the clone and the second is a fact
  // about the work, and folding them together is how an incomplete clone
  // reports a loss it cannot see.
  const absent = '0'.repeat(40)
  const r = readableOnMain(absent, { cwd: root, base: 'main' })
  assert.equal(r.verdict, 'unknown-offline')
  assert.match(r.why, /does not resolve in this clone/)
  assert.ok(READABLE_ON_MAIN.has(r.verdict))
})

test('clause 5 fails when the lock and the clone disagree, in both directions', () => {
  const { root, landed, unlanded } = repoWithThreeBranches()
  const row = (number, head, claim) => ({
    number, lane: 'ursa-skill', branch: `ursa-skill/${number}`, disposition: 'closed-unmerged',
    at: '2026-11-09T04:49Z', head, readable_on_main: claim,
  })

  // Locked `no`, actually readable. This is the direction that makes a reader
  // re-derive work that is already in their tree.
  const understated = tree({ 'prompts/skill-extract.md': 'argued from #601\n' })
  let path = lockFile(understated, {
    read_at: '2026-11-09T04:49Z', fixtures: [], rows: [row(601, landed, 'no')],
  })
  let r = check({ root: understated, lockPath: path, cwd: root, base: 'main' })
  assert.equal(r.failures.length, 1)
  assert.match(r.failures[0], /locked readable_on_main="no" and this clone says "yes"/)

  // Locked `yes`, actually not. This is the direction that sends a reader to
  // look for something that is not there.
  const overstated = tree({ 'prompts/skill-extract.md': 'argued from #601\n' })
  path = lockFile(overstated, {
    read_at: '2026-11-09T04:49Z', fixtures: [], rows: [row(601, unlanded, 'yes')],
  })
  r = check({ root: overstated, lockPath: path, cwd: root, base: 'main' })
  assert.equal(r.failures.length, 1)
  assert.match(r.failures[0], /locked readable_on_main="yes" and this clone says "no"/)
})

test('a head locked readable on main that a complete clone cannot hold is a failure, because that is impossible rather than unlucky', () => {
  const { root } = repoWithThreeBranches()
  const absent = '0'.repeat(40)
  const t = tree({ 'prompts/skill-extract.md': 'argued from #601\n' })
  const path = lockFile(t, {
    read_at: '2026-11-09T04:49Z',
    fixtures: [],
    rows: [{
      number: 601, lane: 'ursa-skill', branch: 'ursa-skill/2026-10-27-hook-2',
      disposition: 'closed-unmerged', at: '2026-11-09T04:49Z',
      head: absent, readable_on_main: 'yes',
    }],
  })
  const r = check({ root: t, lockPath: path, cwd: root, base: 'main' })
  assert.equal(r.failures.length, 1)
  assert.match(r.failures[0], /locked readable on main and its head 00000000 .*which a complete clone cannot be/)

  // The same lock with `no` is consistent and is reported, not failed: a row
  // that never landed and whose branch is gone is exactly this shape, and it
  // is 69 of this repository's 386 closed-and-unmerged rows.
  const t2 = tree({ 'prompts/skill-extract.md': 'argued from #601\n' })
  const p2 = lockFile(t2, {
    read_at: '2026-11-09T04:49Z',
    fixtures: [],
    rows: [{
      number: 601, lane: 'ursa-skill', branch: 'ursa-skill/2026-10-27-hook-2',
      disposition: 'closed-unmerged', at: '2026-11-09T04:49Z',
      head: absent, readable_on_main: 'no',
    }],
  })
  const r2 = check({ root: t2, lockPath: p2, cwd: root, base: 'main' })
  assert.deepEqual(r2.failures, [])
  assert.equal(r2.unverifiable.length, 1)
  assert.match(r2.unverifiable[0], /cannot be rechecked/)
})

test('clause 5 fields are required, and an unknown verdict is refused by name', () => {
  const t = tree({ 'prompts/skill-extract.md': 'argued from #646\n' })
  const { head, readable_on_main, ...withoutClause5 } = CLOSED
  let r = check({ root: t, lockPath: lockFile(t, { read_at: '2026-11-09T04:49Z', fixtures: [], rows: [withoutClause5] }) })
  assert.equal(r.failures.length, 2)
  assert.ok(r.failures.some((f) => /no `head`/.test(f)))
  assert.ok(r.failures.some((f) => /no `readable_on_main`/.test(f)))

  const t2 = tree({ 'prompts/skill-extract.md': 'argued from #646\n' })
  r = check({
    root: t2,
    lockPath: lockFile(t2, {
      read_at: '2026-11-09T04:49Z', fixtures: [],
      rows: [{ ...CLOSED, readable_on_main: 'probably' }],
    }),
  })
  assert.equal(r.failures.length, 1)
  assert.match(r.failures[0], /readable_on_main "probably", which is not one of/)
})

test('the refresh plan says clause 5 needs a complete clone and that the answer expires, because both omissions are silent', () => {
  const plan = refreshPlan()
  assert.match(plan, /ensure-full-clone/)
  assert.match(plan, /unknown-offline/)
  assert.match(plan, /--no-merges/)
  // The expiry is the reason the field is locked at all, so the plan has to
  // say it: a refresh taken late is not a late answer, it is no answer.
  assert.match(plan, /only while its branch does/)
})

test('on the real library, every lock row carries clause 5 and the clone agrees with all of them', () => {
  const r = check()
  assert.deepEqual(r.failures, [], r.failures.join('\n'))
  for (const row of r.rows.values()) {
    assert.ok(row.head, `#${row.number} has no head`)
    assert.ok(READABLE_ON_MAIN.has(row.readable_on_main), `#${row.number} verdict ${row.readable_on_main}`)
  }
  // Clause 5 is not the disposition restated, and this is the assertion that
  // proves it on the real data: rows that never merged and are readable all
  // the same. If this ever drops to zero the field has stopped earning its
  // keep in this library, whatever it is worth repository-wide.
  const closedButReadable = [...r.rows.values()].filter(
    (x) => x.disposition === 'closed-unmerged' && x.readable_on_main === 'yes')
  assert.ok(closedButReadable.length > 0)
})
