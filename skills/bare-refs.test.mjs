// node --test skills/bare-refs.test.mjs
//
// Covers skills/bare-refs.mjs, whose whole subject is a cell that can be empty
// for two different reasons. So every cell of the cross-tabulation gets a
// positive control here: a fixture that puts a mention in that cell and
// asserts the cell counts it. A suite that only asserted "the real library has
// four dangling mentions" would pass identically on an instrument that read
// nothing, which is the defect skills/mutation-audit.md measured three times
// in one run and prompts/skill-extract.md §5ak states as a rule.
//
// The end-to-end cases at the bottom run the file as a program, because the
// seventh wake's survey found a mutant that inverts a module's entry guard and
// turns the whole suite into a green no-op: the module runs its program at
// import, the suite exits before one test is registered, and node --test
// prints a complete plan and exits 0. Only a test that reads the producer's
// own output can see it.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdirSync, writeFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { fixtureDir } from './tmp-fixture.mjs'
import { bareMentions, holdersByRef, survey, BARE_RE } from './bare-refs.mjs'

const GUARD = fileURLToPath(new URL('./bare-refs.mjs', import.meta.url))
const FRONTMATTER = '---\nversion: 0.1.0\nstatus: draft\nvalidated: false\n---\n'

/**
 * A skills/ tree: `dirs` maps slug to filename to body, `lock` maps slug to
 * an array of `[ref, 'path:range']` pairs, which is the lock's key shape
 * flattened so a test can read its own fixture.
 */
function library(dirs, lock = {}) {
  const dir = fixtureDir('bare-refs-')
  for (const [slug, files] of Object.entries(dirs)) {
    mkdirSync(join(dir, slug), { recursive: true })
    for (const [name, body] of Object.entries(files)) writeFileSync(join(dir, slug, name), body)
  }
  const keys = {}
  for (const [slug, refs] of Object.entries(lock))
    for (const [ref, source] of refs) keys[`${slug}/${ref}/${source}`] = 'deadbeefdeadbeef'
  writeFileSync(join(dir, 'evidence.lock.json'), JSON.stringify(keys, null, 2))
  return dir
}

/** One skill with SKILL.md and TRIGGER-TEST.md, holding E1 and E2. */
const oneSkill = (body, trigger = 'nothing here\n') =>
  library(
    { alpha: { 'SKILL.md': FRONTMATTER + body, 'TRIGGER-TEST.md': trigger } },
    { alpha: [['E1', 'src/a.ts:1-5'], ['E2', 'src/a.ts:6-9']] },
  )

test('a tag is not a bare mention, which is the whole distinction', () => {
  assert.deepEqual(bareMentions('the field is set here [E3]\n'), [])
  assert.deepEqual(bareMentions('two at once [E3, E7]\n'), [])
})

test('a bare mention is found, with the line number of the file a reader opens', () => {
  const found = bareMentions('one\ntwo\nits E33 says so\n')
  assert.deepEqual(found, [{ ref: 'E33', line: 3, fenced: false }])
})

test('the line number survives a tag on an earlier line, because tags are blanked not removed', () => {
  const found = bareMentions('a [E1] b\n\n\nbare E9 here\n')
  assert.equal(found.length, 1)
  assert.equal(found[0].line, 4)
})

test('a mention inside a fenced block is found and marked fenced', () => {
  const found = bareMentions('prose\n```sh\ngrep E42 skills/\n```\n')
  assert.deepEqual(found, [{ ref: 'E42', line: 3, fenced: true }])
})

test('a tilde fence counts too, because this library uses one for its counts block', () => {
  const found = bareMentions('~~~counts\nE7\n~~~\n')
  assert.equal(found[0].fenced, true)
})

test('a longer word is not a mention', () => {
  assert.deepEqual(bareMentions('SOMEE12 and E12X and xE12\n'), [])
})

test('the regex is global and stateless between calls', () => {
  // A global RegExp literal shared across calls keeps lastIndex, and the
  // second call then starts mid-string. matchAll resets it; this asserts the
  // property rather than the implementation, so a rewrite to exec() fails here.
  assert.equal(BARE_RE.global, true)
  assert.equal(bareMentions('E1\n').length, 1)
  assert.equal(bareMentions('E1\n').length, 1)
})

test('holdersByRef is the second surface, and one identifier can have three holders', () => {
  const holders = holdersByRef({
    'alpha/E33/src/a.ts:1-2': 'x',
    'beta/E33/docs/b.md:9-10': 'y',
    'gamma/E33/src/c.ts:4-4': 'z',
    'alpha/E1/src/a.ts:3-4': 'w',
  })
  assert.deepEqual(holders.get('E33'), ['alpha', 'beta', 'gamma'])
  assert.deepEqual(holders.get('E1'), ['alpha'])
})

test('holdersByRef ignores a key whose second segment is not a ref', () => {
  assert.equal(holdersByRef({ 'alpha/notaref/src/a.ts:1-2': 'x' }).size, 0)
})

// ---------------------------------------------------------------------------
// One positive control per cell of the cross-tabulation.

test('CELL resolved: a bare mention of the skill\'s own ref passes and is counted', () => {
  const r = survey(oneSkill('as E1 shows\n'))
  assert.equal(r.bare, 1)
  assert.equal(r.resolved, 1)
  assert.deepEqual(r.dangling, [])
})

test('CELL fenced: a mention in a code block is counted in its own cell and never failed on', () => {
  const r = survey(oneSkill('run it\n\n```sh\ngrep E99 .\n```\n'))
  assert.equal(r.bare, 1)
  assert.equal(r.fenced, 1)
  assert.equal(r.resolved, 0)
  assert.deepEqual(r.dangling, [])
})

test('CELL dangling, held elsewhere: the holders are named, which is what makes the repair cheap', () => {
  const dir = library(
    {
      alpha: { 'SKILL.md': FRONTMATTER + 'body\n', 'TRIGGER-TEST.md': 'its E33 agrees\n' },
      beta: { 'SKILL.md': FRONTMATTER + 'body\n', 'TRIGGER-TEST.md': 'x\n' },
      gamma: { 'SKILL.md': FRONTMATTER + 'body\n', 'TRIGGER-TEST.md': 'x\n' },
    },
    {
      alpha: [['E1', 'src/a.ts:1-5']],
      beta: [['E33', 'src/b.ts:1-5']],
      gamma: [['E33', 'docs/g.md:7-9']],
    },
  )
  const r = survey(dir)
  assert.equal(r.dangling.length, 1)
  assert.deepEqual(r.dangling[0], {
    slug: 'alpha',
    file: 'TRIGGER-TEST.md',
    line: 1,
    ref: 'E33',
    heldBy: ['beta', 'gamma'],
  })
})

test('CELL dangling, held nowhere: an identifier no skill has is still a finding', () => {
  const r = survey(oneSkill('as E404 shows\n'))
  assert.equal(r.dangling.length, 1)
  assert.deepEqual(r.dangling[0].heldBy, [])
})

test('the citing skill is excluded from its own heldBy, so the list is the repair target', () => {
  const r = survey(
    library(
      { alpha: { 'SKILL.md': FRONTMATTER + 'E1 and E2\n', 'TRIGGER-TEST.md': 'x\n' } },
      { alpha: [['E1', 'src/a.ts:1-5'], ['E2', 'src/a.ts:6-9']] },
    ),
  )
  assert.deepEqual(r.dangling, [])
  assert.equal(r.resolved, 2)
})

test('the population counts bodies and tags, so a run that read nothing cannot print the same thing', () => {
  const r = survey(oneSkill('cites [E1] and [E2]\n', 'and [E1] again\n'))
  assert.equal(r.skills, 1)
  assert.equal(r.files, 2)
  assert.equal(r.tags, 3)
  assert.equal(r.bare, 0)
})

test('SKILL.md frontmatter is not a mention surface, because every ref is declared in it', () => {
  // The first ad-hoc measurement of this library scanned raw files and
  // reported 332 bare mentions. The shipped instrument reports 13. The whole
  // difference is this: frontmatter declares every ref, so reading it counts
  // each declaration as a prose pointer.
  const dir = library(
    {
      alpha: {
        'SKILL.md': '---\nevidence:\n  - ref: E1\n    source: src/a.ts:1-5\n---\nbody\n',
        'TRIGGER-TEST.md': 'x\n',
      },
    },
    { alpha: [['E1', 'src/a.ts:1-5']] },
  )
  assert.equal(survey(dir).bare, 0)
})

test('a directory without SKILL.md is not read, which is every other guard\'s membership rule', () => {
  const dir = library(
    { scratch: { 'notes.md': 'E33 here\n' } },
    { alpha: [['E1', 'src/a.ts:1-5']] },
  )
  const r = survey(dir)
  assert.equal(r.skills, 0)
  assert.equal(r.bare, 0)
})

test('a missing lock is an empty second surface, so every bare mention dangles', () => {
  const dir = fixtureDir('bare-refs-nolock-')
  mkdirSync(join(dir, 'alpha'), { recursive: true })
  writeFileSync(join(dir, 'alpha', 'SKILL.md'), FRONTMATTER + 'as E1 shows\n')
  writeFileSync(join(dir, 'alpha', 'TRIGGER-TEST.md'), 'x\n')
  const r = survey(dir)
  assert.equal(r.dangling.length, 1)
  assert.deepEqual(r.dangling[0].heldBy, [])
})

// ---------------------------------------------------------------------------
// The guard as a program.

/** Run the guard over a fixture tree; returns `{ status, out }`. */
function run(dir) {
  try {
    const out = execFileSync('node', [GUARD, '--dir', dir], { encoding: 'utf8' })
    return { status: 0, out }
  } catch (e) {
    return { status: e.status, out: `${e.stdout ?? ''}${e.stderr ?? ''}` }
  }
}

test('as a program: a clean library exits 0 and still prints its population', () => {
  const { status, out } = run(oneSkill('as E1 shows\n'))
  assert.equal(status, 0)
  assert.match(out, /population: 1 skills, 2 markdown bodies/)
  assert.match(out, /resolved in the citing skill: 1/)
  assert.match(out, /^OK: /m)
})

test('as a program: a dangling mention exits 1 and names file, line, ref and holders', () => {
  const dir = library(
    {
      alpha: { 'SKILL.md': FRONTMATTER + 'body\n', 'TRIGGER-TEST.md': 'its E33 agrees\n' },
      beta: { 'SKILL.md': FRONTMATTER + 'body\n', 'TRIGGER-TEST.md': 'x\n' },
    },
    { alpha: [['E1', 'src/a.ts:1-5']], beta: [['E33', 'src/b.ts:1-5']] },
  )
  const { status, out } = run(dir)
  assert.equal(status, 1)
  assert.match(out, /dangling: 1/)
  assert.match(out, /alpha\/TRIGGER-TEST\.md:1 {2}E33 {2}not a ref of alpha; held by beta/)
})

test('as a program: the failure report names the repair and the section that asks for it', () => {
  const dir = library(
    { alpha: { 'SKILL.md': FRONTMATTER + 'E404\n', 'TRIGGER-TEST.md': 'x\n' } },
    { alpha: [['E1', 'src/a.ts:1-5']] },
  )
  const { out } = run(dir)
  assert.match(out, /§5t part 1/)
  assert.match(out, /held by no skill in the lock/)
})

test('as a program: the line caveat is printed with the findings, not only exported', () => {
  const dir = library(
    { alpha: { 'SKILL.md': FRONTMATTER + 'E404\n', 'TRIGGER-TEST.md': 'x\n' } },
    { alpha: [['E1', 'src/a.ts:1-5']] },
  )
  assert.match(run(dir).out, /offset by its frontmatter/)
})

test('as a program: --dir with no path is a usage error and not a survey of nothing', () => {
  try {
    execFileSync('node', [GUARD, '--dir'], { encoding: 'utf8' })
    assert.fail('expected a non-zero exit')
  } catch (e) {
    assert.equal(e.status, 2)
    assert.match(e.stderr, /wants a path/)
  }
})

test('as a program: the real library is surveyed when no --dir is given', () => {
  // Deliberately asserts the shape and not the counts. A test that pinned 13
  // and 4 would go red on the next skill this library gains, which is the
  // defect §5u found in nine sentences of eight trigger tests.
  const { out } = run(fileURLToPath(new URL('.', import.meta.url)))
  assert.match(out, /^population: \d+ skills, \d+ markdown bodies, \d+ tag citations, \d+ bare/m)
})
