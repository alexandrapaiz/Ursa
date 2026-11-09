import test from 'node:test'
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  ALLOWLIST,
  DISPOSITIONS,
  PROBES,
  TEST_FILE,
  decide,
  emittableCodes
} from './instant-gate.mjs'
import { textualTimestampComparisons } from './instant.mjs'

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const read = (f) => readFileSync(resolve(REPO_ROOT, f), 'utf8')
const detectorSource = () => read('tools/instant.mjs')
const trackedSources = () =>
  execFileSync('git', ['ls-files', '-z', '*.mjs', '*.js', '*.cjs', '*.ts', '*.tsx'], {
    cwd: REPO_ROOT,
    encoding: 'utf8'
  })
    .split('\0')
    .filter(Boolean)

// --- the census: the obligation is read off the detector -------------------

test('every probe trips the detector, so the positive control is live', () => {
  // If this fails, every "clean" reading below is a reading of a broken
  // detector rather than of a clean tree.
  for (const line of PROBES) {
    assert.ok(
      textualTimestampComparisons(line).length > 0,
      `probe trips nothing, so the control is silent: ${line}`
    )
  }
})

test('the code census is the union of declared and observed, and both halves are non-empty', () => {
  const c = emittableCodes(detectorSource())
  assert.ok(c.declared.length > 0, 'no `code:` literal found in the detector source')
  assert.ok(c.observed.length > 0, 'the probes emitted nothing')
  assert.deepEqual(c.codes, [...new Set([...c.declared, ...c.observed])].sort())
  // Five as of 2026-11-09. The literal is kept rather than relaxed to a count
  // because its job is to make the author of a NEW code come here and decide
  // it, which is what this gate exists for and what it did to this line —
  // twice now. SHAPE_AS_EXISTENCE was added later the same day and this line
  // was the second thing to stop it, after the UNDECIDED-CODE row.
  assert.deepEqual(c.codes, ['REFUSAL_AS_ORDER', 'SHAPE_AS_EXISTENCE', 'TEXTUAL_DAY', 'TEXTUAL_DROP', 'TEXTUAL_ORDER'])
})

test('a code the detector declares but no probe reaches is still in the census', () => {
  // The half that catches a NEW code whose trigger nobody wrote a probe for,
  // which is the exact shape of the defect this gate closes: TEXTUAL_DAY was
  // emitted on every run and decided by nothing.
  const source = detectorSource() + "\nconst unreachable = { code: 'TEXTUAL_FOURTH' }\n"
  const c = emittableCodes(source)
  assert.ok(c.codes.includes('TEXTUAL_FOURTH'))
  assert.ok(!c.observed.includes('TEXTUAL_FOURTH'))
})

test('a code in the census with no disposition is undecided and red', () => {
  const source = detectorSource() + "\nconst x = { code: 'TEXTUAL_FOURTH' }\n"
  const r = decide({ files: ['tools/instant.mjs'], read, detectorSource: source })
  assert.deepEqual(r.undecided, ['TEXTUAL_FOURTH'])
  assert.equal(r.ok, false)
})

test('every disposition names a code the detector can emit', () => {
  // The other direction: a disposition for a code that no longer exists is a
  // decision about nothing, and it makes the table read as wider coverage
  // than the gate has.
  const codes = emittableCodes(detectorSource()).codes
  for (const code of Object.keys(DISPOSITIONS)) {
    assert.ok(codes.includes(code), `${code} has a disposition and the detector cannot emit it`)
  }
})

test('every disposition carries a reason, and none of them is silence', () => {
  for (const [code, d] of Object.entries(DISPOSITIONS)) {
    assert.equal(d.forbidden, true, `${code} is not forbidden, which is not a disposition this gate has`)
    assert.equal(typeof d.why, 'string')
    assert.ok(d.why.length > 40, `${code}'s reason is too short to be an argument`)
  }
})

// --- the decision over the real tree --------------------------------------

test('this repository has no offender under any of the three codes', () => {
  const r = decide({ files: trackedSources(), read, detectorSource: detectorSource() })
  assert.deepEqual(r.offenders.map((f) => `${f.file}:${f.line} ${f.code}`), [])
  assert.deepEqual(r.undecided, [])
  // A positive control on the sweep itself, so a file list that silently came
  // back empty cannot pass this test.
  assert.ok(r.scanned > 300, `only ${r.scanned} files scanned`)
  assert.ok(r.findings.length > 0, 'no findings at all, which means the detector did not run over this tree')
})

test('no allowlist entry is stale, so the allowlist cannot outlive its findings', () => {
  const r = decide({ files: trackedSources(), read, detectorSource: detectorSource() })
  assert.deepEqual(
    r.stale.map((e) => `${e.file}  ${e.text}`),
    [],
    'an allowlist entry matches no line: delete it, or repair the line it was arguing about'
  )
})

test('every allowlist entry is keyed on a file and an exact line text, with a reason', () => {
  for (const e of ALLOWLIST) {
    assert.equal(typeof e.file, 'string')
    assert.equal(typeof e.text, 'string')
    assert.equal(e.text, e.text.trim(), `${e.file}: the key must be the trimmed line text`)
    assert.ok(e.why.length > 20, `${e.file}: the reason is too short to be an argument`)
    assert.ok(!TEST_FILE.test(e.file), `${e.file}: test files are exempt by rule, so an entry for one is dead weight`)
  }
})

test('the five repaired call sites stay repaired', () => {
  // Named rather than counted, because a count stays green when one site is
  // repaired and another regresses. These are the sites Ursa's security seat
  // reported on 2026-11-09, plus the sixth this pass found while repairing
  // them.
  for (const file of [
    'tools/seat/outage.mjs',
    'tools/board/measure-claims.mjs',
    'tools/seat/read-dates.mjs'
  ]) {
    const findings = textualTimestampComparisons(read(file))
    assert.deepEqual(
      findings.map((f) => `${file}:${f.line} ${f.code} ${f.text}`),
      [],
      `${file} slices or orders a timestamp as text again`
    )
  }
})

test("the gate's own source trips the detector nowhere, because its corpus is data", () => {
  // The reason tools/instant-gate.json exists. Held as source, the probes and
  // the allowlist keys made this gate the largest offender in the tree: twelve
  // findings, every one of them its own subject matter. The two ways out were
  // a self-exemption by filename and twelve allowlist entries for the
  // allowlist, and a gate that exempts itself has stopped measuring the tree.
  assert.deepEqual(
    textualTimestampComparisons(read('tools/instant-gate.mjs')).map((f) => `${f.line} ${f.code}`),
    [],
    'the gate holds a defective line as source again: put it in tools/instant-gate.json'
  )
})

// --- what the allowlist must not become -----------------------------------

test('a moved line stays cleared and a changed line does not', () => {
  const entry = ALLOWLIST[0]
  const padded = '\n'.repeat(40) + `  ${entry.text}\n`
  const moved = decide({
    files: [entry.file],
    read: () => padded,
    detectorSource: detectorSource()
  })
  assert.deepEqual(moved.offenders, [], 'the same text at a different line number is not cleared')
  assert.equal(moved.cleared.length, 1)

  const edited = decide({
    files: [entry.file],
    read: () => `  ${entry.text.replace('slice(0, 10)', 'slice(0,10)')}\n`,
    detectorSource: detectorSource()
  })
  assert.equal(edited.cleared.length, 0, 'an edited line is still cleared, so the key is not the text')
  assert.equal(edited.offenders.length, 1)
})

test('an allowlist entry clears one line and not the rest of its file', () => {
  const entry = ALLOWLIST.find((e) => e.file === 'ursa-major/src/parse.ts')
  const source = `  ${entry.text}\n  const other = row.createdAt.slice(0, 10)\n`
  const r = decide({ files: [entry.file], read: () => source, detectorSource: detectorSource() })
  assert.equal(r.cleared.length, 1)
  assert.deepEqual(r.offenders.map((f) => f.line), [2])
})

test('a test file is exempt and counted, never silently skipped', () => {
  const source = '  if (a.createdAt < b.createdAt) { return -1 }\n'
  const r = decide({ files: ['tools/made-up.test.mjs'], read: () => source, detectorSource: detectorSource() })
  assert.deepEqual(r.offenders, [])
  assert.equal(r.in_tests.length, 1)
  assert.equal(r.byCode.TEXTUAL_ORDER.in_tests, 1)
})

test('the per-code accounting adds up, so no finding goes missing between the columns', () => {
  const r = decide({ files: trackedSources(), read, detectorSource: detectorSource() })
  for (const [code, s] of Object.entries(r.byCode)) {
    assert.equal(
      s.findings,
      s.offenders + s.cleared + s.in_tests,
      `${code}: ${s.findings} findings is not ${s.offenders} + ${s.cleared} + ${s.in_tests}`
    )
  }
  assert.equal(
    r.findings.length,
    Object.values(r.byCode).reduce((n, s) => n + s.findings, 0),
    'a finding carries a code the census does not list'
  )
})

test('an unreadable file is counted, not treated as clean', () => {
  const r = decide({
    files: ['tools/instant.mjs', 'tools/gone.mjs'],
    read: (f) => {
      if (f === 'tools/gone.mjs') throw new Error('ENOENT')
      return read(f)
    },
    detectorSource: detectorSource()
  })
  assert.equal(r.unreadable, 1)
})
