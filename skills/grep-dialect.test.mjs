// node --test skills/grep-dialect.test.mjs
//
// Two things are under test and they are different kinds of claim.
//
// The predicates are ordinary unit tests, and the cases that matter are the
// negative ones: the pattern that found nineteen hits in this repository before
// it was anchored on the word `grep`, every one of them a `sha512-` integrity
// line or a CSS class name. A pattern that reports everything and a pattern
// that reports nothing are both useless, and this file pins both ends.
//
// The engine measurement is not a unit test and is not treated as one. It
// reports what this host has, so asserting a version here would pin the test to
// one machine. What is asserted instead is the one property the library depends
// on: that the frames a guard actually runs in use the GNU meaning of
// quiet-plus-invert, and that the report says plainly which frame it could not
// reach rather than reporting agreement it did not measure.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { findingsInText, scan, report, engines, engineReport, probeCommand, TYPED_FRAME_PROBE } from './grep-dialect.mjs'

const classes = (text) => findingsInText(text).map((f) => f.cls)

test('class A: every spelling of quiet-plus-invert', () => {
  assert.deepEqual(classes("grep -qv '^x$' f"), ['A'])
  assert.deepEqual(classes("grep -q -v '^x$' f"), ['A'])
  assert.deepEqual(classes("grep -v -q '^x$' f"), ['A'])
  assert.deepEqual(classes("grep -rqv x ."), ['A'])
  assert.deepEqual(classes("grep --quiet --invert-match x f"), ['A'])
  assert.deepEqual(classes("grep --invert-match --silent x f"), ['A'])
  assert.deepEqual(classes("ugrep -qv x f"), ['A'])
})

test('class A: the forms that are not it', () => {
  assert.deepEqual(classes("grep -q '^x$' f"), [], 'quiet alone has one meaning')
  assert.deepEqual(classes("grep -v x f"), [], 'invert alone prints the same on both engines')
  assert.deepEqual(classes("grep -cv x f"), [], 'counting the inverted selection is output, not status')
  assert.deepEqual(classes("n=$(grep -c x f)"), [], 'the captured-output form is the repair, not a finding')
})

test('class A: anchored on the word, so data that merely spells the flags is not a finding', () => {
  // The three real false positives from this repository, verbatim.
  assert.deepEqual(classes('"integrity": "sha512-vq24Bq3ym5HEQm2NKCr3yXDwjc7vTsEThRDnkp2DK9p1uqLR+DHurm"'), [])
  assert.deepEqual(classes('"cls": "framer-uEzab framer-qwvhjw framer-v-1iwaa20 framer-1gx"'), [])
  assert.deepEqual(classes('a sentence about -qv in prose with no command on the line'), [])
})

test('class A: a pipeline boundary is not crossed, because the flags must belong to that grep', () => {
  assert.deepEqual(classes("grep -rn x . | sed -n '1p'"), [])
  assert.deepEqual(classes("printf 'a\\n' | tr -q -v a b"), [], 'another command entirely')
})

test('class B: a path-anchored filter downstream of a recursive search', () => {
  assert.deepEqual(classes("git grep -rl x origin/main -- docs/ | grep -v '^docs/agents/incidents.md$'"), ['B'])
  assert.deepEqual(classes("grep -rl x . | grep -E '^\\./src'"), ['B'])
})

test('class B: the forms that are not it', () => {
  assert.deepEqual(classes("grep -rl x . | grep -v test"), [], 'no path anchor, so no prefix assumption')
  assert.deepEqual(classes("grep -n x f | grep -v '^x'"), [], 'not recursive, so there is no prefix to move')
})

test('both classes on one line are both reported, in line order', () => {
  const text = "grep -rl x . | grep -qv '^a'\nnothing\ngrep -q -v y f\n"
  assert.deepEqual(findingsInText(text).map((f) => [f.line, f.cls]), [[1, 'A'], [1, 'B'], [3, 'A']])
})

test('scan walks a tree, skips .git, and reads only text extensions', () => {
  const dir = mkdtempSync(join(tmpdir(), 'grep-dialect-'))
  mkdirSync(join(dir, '.git'), { recursive: true })
  mkdirSync(join(dir, 'nested'), { recursive: true })
  writeFileSync(join(dir, '.git', 'hook.sh'), "grep -qv x f\n")
  writeFileSync(join(dir, 'clean.md'), "grep -c x f\n")
  writeFileSync(join(dir, 'nested', 'guard.sh'), "ok\ngrep -qv x f\n")
  writeFileSync(join(dir, 'blob.png'), "grep -qv x f\n")
  const found = scan([dir])
  assert.equal(found.length, 1)
  assert.match(found[0].file, /nested\/guard\.sh$/)
  assert.equal(found[0].line, 2)
})

test('the report names the repair, not just the defect', () => {
  const lines = report(findingsInText("grep -qv x f"))
  assert.equal(lines.length, 1)
  assert.match(lines[0], /class A/)
  assert.match(lines[0], /Capture output and test it/)
})

test('the engine report never claims agreement with a frame it cannot reach', () => {
  const e = engines()
  assert.equal(e.typedShell.measurable, false)
  assert.match(e.typedShell.why, /not exported/)
  const text = engineReport(e).join('\n')
  assert.match(text, /typedShell {2}not measurable from here/)
  assert.match(text, /run it in your own frame/)
})

test('the frames a guard runs in use the GNU meaning, which is what the library depends on', () => {
  const e = engines()
  assert.equal(e.binary.quietInvertExit, 0, 'GNU exits 0 when some line did not match')
  assert.equal(e.child.quietInvertExit, 0, 'a spawned shell must agree with the binary')
  assert.equal(e.child.resolvesAs, 'file', 'a child shell resolves grep to a binary, never to the harness function')
})

// The library-wide claim. Two narrowings, both written here in the open rather
// than built into the tool as a flag a reader never sees.
//
// The tool has no exemption list by filename, deliberately: a quiet-plus-invert
// in a test file is as wrong as one in a guard, and the moment a scanner learns
// to skip a class of file it stops being able to report on it. So the fixtures
// above are real findings, the probe is a real finding, and the tool says so.
//
// The second narrowing is the probe, and it is a single line on purpose:
// measuring an inverted exit status requires running the thing that inverts. The
// assertion below is keyed on that line's content rather than its number, so a
// second copy of the shape appearing anywhere in this library fails this test
// even if it is added to this file's own module.
test('the only non-fixture use of the shape in this library is the probe itself', () => {
  const here = new URL('.', import.meta.url).pathname
  const elsewhere = scan([here])
    .filter((f) => !f.file.endsWith('grep-dialect.test.mjs'))
    .map((f) => `${f.file.slice(here.length)}  ${f.text}`)
  assert.deepEqual(elsewhere, [
    `grep-dialect.mjs  export const probeCommand = (grep) => \`printf 'a\\\\nb\\\\n' | \${grep} -q -v a\``,
  ])
})

// The control for the assertion above: if the scanner silently broke and found
// nothing anywhere, that test would pass and this one would not.
test('the fixtures in this file are found, so the assertion above has something to exclude', () => {
  const self = scan([new URL('./grep-dialect.test.mjs', import.meta.url).pathname])
  assert.ok(self.length >= 10, `expected the fixture lines to be found, got ${self.length}`)
})

test('the probe composes the discriminating input, and the typed-frame form carries it', () => {
  assert.equal(probeCommand('command grep'), "printf 'a\\nb\\n' | command grep -q -v a")
  assert.match(TYPED_FRAME_PROBE, /^type -t grep; /)
  assert.ok(TYPED_FRAME_PROBE.includes(probeCommand('grep')), 'one literal, used twice, never copied')
})
