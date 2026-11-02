// node --test skills/grep-dialect.test.mjs
//
// grep-dialect: corpus
//
// That line is this file's own declaration, read by the tool under test, and it
// is the honest form of a narrowing that used to be written in prose at the
// bottom of this file and enforced by nothing. A test corpus for a text
// detector has to contain the text the detector looks for; every fixture below
// is a finding and the tool still reports every one of them, under the
// `fixture` surface, with a count. What the declaration changes is that they do
// not gate. The earlier version of this comment said the tool had no exemption
// list by filename and should not get one, which was right, and the
// declaration is why: it is not keyed on a name, it lives in the file it
// exempts, it is visible in a diff, and `declaresCorpus` only reads the first
// forty lines so it cannot be acquired by accident from a fixture below.
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
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import {
  findingsInText, scan, report, summarise, isCallSite, surfacesForText, quotedSpans,
  needleAt, declaresCorpus, waiverOn, CORPUS_HEADER_LINES, CORPUS_MARK, WAIVER_MARK,
  engines, engineReport, probeCommand, TYPED_FRAME_PROBE,
} from './grep-dialect.mjs'

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

// The library-wide claim, in three tests that have to be read together,
// because the interesting property is a conjunction: this library has no
// gating use of the shape, it still *finds* every non-gating one, and the one
// real use it has is the probe and says why in the line above itself.
//
// The assertion is keyed on the probe line's content rather than its number,
// so a second copy of the shape appearing anywhere in this library fails this
// test even if it is added to this file's own module.
test('this library has no gating use of the shape', () => {
  const here = new URL('.', import.meta.url).pathname
  const sites = scan([here]).filter(isCallSite)
  assert.deepEqual(sites.map((f) => `${f.file.slice(here.length)}:${f.line}`), [])
})

test('the one real use of the shape in this library is the probe, and it carries its reason', () => {
  const here = new URL('.', import.meta.url).pathname
  const deliberate = scan([here])
    .filter((f) => f.waived)
    .map((f) => `${f.file.slice(here.length)}  ${f.text}`)
  assert.deepEqual(deliberate, [
    `grep-dialect.mjs  export const probeCommand = (grep) => \`printf 'a\\\\nb\\\\n' | \${grep} -q -v a\``,
  ])
})

// The control for both assertions above: if the scanner silently broke and
// found nothing anywhere, they would both pass and this one would not.
test('the fixtures in this file are found and labelled, so the assertions above have something to exclude', () => {
  const self = scan([new URL('./grep-dialect.test.mjs', import.meta.url).pathname])
  assert.ok(self.length >= 10, `expected the fixture lines to be found, got ${self.length}`)
  assert.deepEqual([...new Set(self.map((f) => f.surface))], ['fixture'])
  assert.equal(self.filter(isCallSite).length, 0, 'a declared corpus gates on nothing')
})

test('the probe composes the discriminating input, and the typed-frame form carries it', () => {
  assert.equal(probeCommand('command grep'), "printf 'a\\nb\\n' | command grep -q -v a")
  assert.match(TYPED_FRAME_PROBE, /^type -t grep; /)
  assert.ok(TYPED_FRAME_PROBE.includes(probeCommand('grep')), 'one literal, used twice, never copied')
})

// ---------------------------------------------------------------------------
// The classification, added 2026-11-02 after the ExO seat measured what the
// unclassified version cost: twenty-six findings across two clones, two of them
// genuine call sites. Recall was never the problem, so every test below pins a
// precision claim with a recall control beside it.

test('the surface of a markdown line is decided by the fence it is or is not inside', () => {
  const md = [
    'prose about `grep -qv` in a sentence',   // 1
    '',                                        // 2
    '```sh',                                   // 3
    "grep -qv '^a$' f",                        // 4
    '```',                                     // 5
    'prose again',                             // 6
  ].join('\n')
  assert.deepEqual(surfacesForText(md, '.md'), [
    'prose', 'prose', 'prose', 'receipt', 'receipt', 'prose',
  ])
  const found = findingsInText(md, { ext: '.md' })
  assert.deepEqual(found.map((f) => [f.line, f.surface]), [[1, 'prose'], [4, 'receipt']])
  assert.deepEqual(found.filter(isCallSite).map((f) => f.line), [4])
})

test('a fence closes only on its own character at its own length or longer', () => {
  const md = ['````md', '```', "grep -qv x f", '````', "grep -qv y f"].join('\n')
  assert.deepEqual(surfacesForText(md, '.md'), ['prose', 'receipt', 'receipt', 'receipt', 'prose'])
  const md2 = ['~~~', "grep -qv x f", '```', "grep -qv y f", '~~~'].join('\n')
  assert.deepEqual(surfacesForText(md2, '.md'), ['prose', 'receipt', 'receipt', 'receipt', 'receipt'])
})

test('the two real call sites in the charter branch are markdown, and survive the narrowing', () => {
  // Verbatim from `refs/prs/618:prompts/exo-agent.md`, lines 5012 and 5068, the
  // only two genuine call sites in twenty-six findings. Both sit in fenced
  // blocks, which is why the fence rule above is the whole discriminator and
  // not a filter on `.md`: a rule that dropped markdown would have dropped
  // exactly the findings this tool was written to catch.
  const md = [
    '```sh',
    'git grep -l "$slug" origin/main -- docs/ \':!docs/standards/lessons.md\' \\',
    "  | grep -qv '^docs/agents/incidents.md$' || echo \"cited only by its own classification\"",
    '```',
  ].join('\n')
  const sites = findingsInText(md, { ext: '.md' }).filter(isCallSite)
  assert.deepEqual(sites.map((f) => [f.line, f.cls, f.surface]), [[3, 'A', 'receipt']])
})

test('a comment in .mjs is prose and is reported, where the first draft skipped it blind', () => {
  const js = ['// GNU   grep -q -v a  -> exit 0', "const x = \"grep -qv a\"", "run('grep -q -v a')"].join('\n')
  assert.deepEqual(surfacesForText(js, '.mjs'), ['prose', 'code', 'code'])
  const found = findingsInText(js, { ext: '.mjs' })
  assert.equal(found.length, 3, 'all three are found; the skip used to make the first invisible')
  assert.deepEqual(found.filter(isCallSite).map((f) => f.line), [2, 3])
})

test('a commented command in shell stays a receipt, because that is the line a reader uncomments', () => {
  assert.deepEqual(surfacesForText("# grep -qv x f\ngrep -qv y f", '.sh'), ['receipt', 'code'])
  assert.equal(findingsInText("# grep -qv x f", { ext: '.sh' }).filter(isCallSite).length, 1)
})

test('class N: the flag pair is the search string of the command around it', () => {
  // Exo's own carried check, verbatim, which this tool reported twice as a defect.
  assert.deepEqual(classes("git show refs/prs/618:prompts/exo-agent.md | grep -c 'grep -qv'"), ['N'])
  assert.deepEqual(classes('grep -rn "grep -q -v" skills/'), ['N'])
  assert.deepEqual(classes("rg --count 'grep --quiet --invert-match'"), ['N'], 'the searcher need not be grep')
  assert.deepEqual(classes("awk '/grep -qv/'"), ['A'], 'awk is not on the searcher list, and says so in needleAt')
})

test('class N: a whole command inside one quote is a use, not a needle', () => {
  // The discriminator is that the needle's quote excludes the anchor. These
  // three put anchor and flags inside the same quote and must still gate.
  assert.deepEqual(classes("bash -lc 'grep -q -v a f'"), ['A'])
  assert.deepEqual(classes('sh -c "grep -qv a f"'), ['A'])
  assert.deepEqual(classes("run(`printf 'a\\nb\\n' | ${grep} -q -v a`)"), ['A'], "this library's own probe line")
  assert.deepEqual(classes("grep -c x f; sh -c 'grep -qv y'"), ['A'], 'the searcher must be in the same command')
})

test('class N: one real spelling outvotes any number of needles on the same line', () => {
  assert.deepEqual(classes("grep -qv x f  # see also 'grep -qv'"), ['A'])
})

test('class N never gates, whatever surface it is on', () => {
  const found = findingsInText("grep -c 'grep -qv' f", { ext: '.sh' })
  assert.deepEqual(found.map((f) => [f.cls, f.surface]), [['N', 'code']])
  assert.equal(found.filter(isCallSite).length, 0)
})

test('quoted spans are closed pairs only, so an apostrophe in prose swallows nothing', () => {
  assert.deepEqual(quotedSpans("a 'b' c"), [[2, 4]])
  assert.deepEqual(quotedSpans("#618's repair"), [], 'one unmatched quote is not a span')
  // The learning log line that pays for this: one apostrophe, no span, so the
  // rest of the sentence is not read as quoted text.
  assert.deepEqual(quotedSpans("1. **Has `#618`'s `grep -qv` repair landed"), [[9, 14], [18, 27]])
})

test('needleAt asks what receives the quote, not where the match sits', () => {
  const line = "git show r:f | grep -c 'grep -qv'"
  assert.equal(needleAt(line, line.lastIndexOf('v')), true)
  const used = "bash -lc 'grep -qv x f'"
  assert.equal(needleAt(used, used.lastIndexOf('-qv') + 2), false, 'bash -c takes code, not a pattern')
  assert.equal(needleAt("grep -qv x f", 7), false, 'nothing is quoted at all')
})

test('a waiver needs a reason, because a reason is the whole difference from a skip', () => {
  const withReason = `// ${WAIVER_MARK} the probe must run the shape to measure it\ngrep -qv x f`
  const found = findingsInText(withReason, { ext: '.mjs' })
  assert.equal(found.length, 1)
  assert.equal(found[0].waived, 'the probe must run the shape to measure it')
  assert.equal(found[0].surface, 'code', 'waiving does not change the surface, only the gate')
  assert.equal(found.filter(isCallSite).length, 0)

  const bare = `// ${WAIVER_MARK}\ngrep -qv x f`
  const still = findingsInText(bare, { ext: '.mjs' })
  assert.equal(still[0].waived, undefined)
  assert.equal(still.filter(isCallSite).length, 1, 'a bare marker does not waive')
})

test('a waiver reaches the line it is on and the line below it, and no further', () => {
  const reason = `${WAIVER_MARK} measured on purpose`
  assert.ok(waiverOn([`# ${reason}`, 'grep -qv x f'], 1))
  assert.ok(waiverOn([`grep -qv x f  # ${reason}`], 0))
  assert.equal(waiverOn([`# ${reason}`, '', 'grep -qv x f'], 2), null, 'one blank line is enough to break it')
})

test('a corpus declares itself, in its own first forty lines, and still reports everything', () => {
  const corpus = `// ${CORPUS_MARK}\ngrep -qv x f\ngrep -q -v y f`
  const found = findingsInText(corpus, { ext: '.mjs' })
  assert.equal(found.length, 2, 'a corpus is read, not skipped')
  assert.deepEqual([...new Set(found.map((f) => f.surface))], ['fixture'])
  assert.equal(found.filter(isCallSite).length, 0)

  const buried = [...Array(CORPUS_HEADER_LINES).fill('//'), `// ${CORPUS_MARK}`, 'grep -qv x f'].join('\n')
  assert.equal(declaresCorpus(buried), false, 'past the header it does not count')
  assert.equal(findingsInText(buried, { ext: '.mjs' }).filter(isCallSite).length, 1)
})

test('the tool does not declare itself a corpus, which is the one file that would hide the most', () => {
  const src = readFileSync(new URL('./grep-dialect.mjs', import.meta.url), 'utf8')
  assert.ok(src.includes(CORPUS_MARK), 'it defines the marker')
  assert.equal(declaresCorpus(src), false, 'and sits far below the header line that would apply it')
})

test('the summary accounts for every finding, gating or not', () => {
  const findings = [
    { cls: 'A', line: 1, surface: 'code', text: 'a' },
    { cls: 'A', line: 2, surface: 'receipt', text: 'b' },
    { cls: 'A', line: 3, surface: 'prose', text: 'c' },
    { cls: 'N', line: 4, surface: 'code', text: 'd' },
    { cls: 'A', line: 5, surface: 'fixture', text: 'e' },
    { cls: 'A', line: 6, surface: 'code', text: 'f', waived: 'on purpose' },
  ]
  const text = summarise(findings).join('\n')
  assert.match(text, /^2 call sites on an executable surface/)
  assert.match(text, /4 findings classified out/)
  const counted = [...text.matchAll(/^\s+(\d+)\s{2}/gm)].reduce((n, m) => n + Number(m[1]), 0)
  assert.equal(counted, 4, 'the buckets sum to the findings that did not gate')
})

test('the report says which surface, and prints the waiver reason instead of a repair', () => {
  const waived = report([{ file: 'f.mjs', cls: 'A', line: 3, surface: 'code', text: 'x', waived: 'measured' }])
  assert.match(waived[0], /f\.mjs:3 {2}class A {2}code/)
  assert.match(waived[0], /declared deliberate: measured/)
  assert.doesNotMatch(waived[0], /Capture output/)
  assert.match(report(findingsInText("grep -c 'grep -qv' f"))[0], /a needle, not a call/)
})
