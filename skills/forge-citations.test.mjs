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
import { check, mentions, refreshPlan, resolves, DECAY_MEDIAN_MINUTES } from './forge-citations.mjs'

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

const MERGED = {
  number: 281, lane: 'ursa-skill', branch: 'ursa-skill/2026-10-23-message-c',
  disposition: 'merged', merge_commit: '1b097a05ea7efe55de49fa9c315024dc88c3acd7',
  at: '2026-10-23T23:58:14Z',
}
const CLOSED = {
  number: 646, lane: 'ursa-skill', branch: 'ursa-skill/2026-11-02-message-4',
  disposition: 'closed-unmerged', at: '2026-11-02T05:08:31Z',
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
  assert.equal(r.unverifiable.length, 1)
  assert.match(r.unverifiable[0], /does not resolve in this clone/)
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
