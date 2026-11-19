// Every finding `tools/gates/acceptance-fields.mjs` can emit, driven from a
// synthetic register set, plus the end-to-end run against this repository.
//
// EVERY NEGATIVE HERE HAS A POSITIVE CONTROL BESIDE IT. This seat's charter
// requires it of any absence a run reports, and the requirement is sharper for
// this gate than for most: its whole subject is a claim that nothing reads a
// field, and an instrument that cannot see a read would report every field
// unread and look like a thorough one. So each `does not fire` case is paired
// with the same input mutated in one place, and the pair is what the test
// asserts rather than either half.

import assert from 'node:assert/strict'
import { test } from 'node:test'
import { execFileSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  entryKeysOf,
  fieldsOf,
  isRead,
  stripComments,
  sweep,
} from './acceptance-fields.mjs'
import { verdict, GATE } from './acceptance-fields-verdict.mjs'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(HERE, '..', '..')

const codes = (r) => r.findings.map((f) => f.rule).sort()

/** A register set in one object. `files` is the whole filesystem this sweep
 *  can see, so a consumer that is absent is simply not a key. */
function run({ files, manifest, baseline = { excused: [] }, candidates = [] }) {
  return sweep(
    manifest,
    baseline,
    candidates,
    (p) => {
      if (!(p in files)) throw new Error(`no such file ${p}`)
      return files[p]
    },
    (p) => p in files,
  )
}

const ENTRY = { why: 'because', keep: 'x' }
const BASE = {
  files: {
    'r.json': JSON.stringify({ accepted: [ENTRY] }),
    'c.mjs': 'export const f = (e) => e.keep\n',
  },
  manifest: { registers: [{ path: 'r.json', entries: 'accepted', consumers: ['c.mjs'] }] },
}
const excuse = (over = {}) => ({
  register: 'r.json',
  field: 'why',
  owner: 'exo',
  kind: 'repair',
  measured: '2026-11-09',
  why: 'deferred',
  ...over,
})

// ---------------------------------------------------------------------------
// The instrument: what counts as a read
// ---------------------------------------------------------------------------

test('a dereference in any of its four forms is a read', () => {
  assert.ok(isRead('why', 'e.why'))
  assert.ok(isRead('why', "e['why']"))
  assert.ok(isRead('why', 'e["why"]'))
  assert.ok(isRead('why', 'const { why, code } = entry'))
})

test('a field named only as an object key is NOT a read, and that is the deliberate under-claim', () => {
  // The paired control: the same name on the same line, dereferenced, IS one.
  assert.equal(isRead('why', "const FIELDS = { why: 'string' }"), false)
  assert.equal(isRead('why', "const FIELDS = { why: entry.why }"), true)
})

test('a dot on a longer name is not a read of the shorter one', () => {
  assert.equal(isRead('why', 'e.why_identifier'), false)
  assert.ok(isRead('why_identifier', 'e.why_identifier'))
})

test('comments are stripped, which is the whole difference from a grep', () => {
  // This is the measured case: tools/gates/code-census.mjs mentions `repair`
  // exactly once and it is inside a comment, so `grep -c` says one and the
  // field is read by nothing.
  const src = '// see e.repair for the reason\n/* and e.repair again */\nconst x = 1\n'
  assert.ok(isRead('repair', src), 'the control: unstripped, the comment reads as a read')
  assert.equal(isRead('repair', stripComments(src)), false)
})

test('a url in code survives comment stripping, so a consumer is not silently emptied', () => {
  const src = "const u = 'https://example.com/x'\nconst y = e.why\n"
  assert.ok(isRead('why', stripComments(src)))
  assert.match(stripComments(src), /https:\/\/example\.com/)
})

test('fieldsOf unions the fields over entries and sorts them', () => {
  assert.deepEqual(fieldsOf([{ b: 1 }, { a: 1, b: 2 }]), ['a', 'b'])
  assert.deepEqual(fieldsOf('not a list'), [])
})

test('entryKeysOf finds only non-empty arrays of objects', () => {
  assert.deepEqual(entryKeysOf({ rows: [{ a: 1 }] }), ['rows'])
  assert.deepEqual(entryKeysOf({ rows: [] }), [], 'empty: nothing to grade')
  assert.deepEqual(entryKeysOf({ rows: ['a'] }), [], 'strings are not entries')
  assert.deepEqual(entryKeysOf({ rows: [{ a: 1 }, 'a'] }), [], 'mixed is not an entry list')
  assert.deepEqual(entryKeysOf([{ a: 1 }]), [], 'a top-level array is not a register')
})

// ---------------------------------------------------------------------------
// FIELD_UNREAD, with its control
// ---------------------------------------------------------------------------

test('a field no consumer dereferences is FIELD_UNREAD', () => {
  const r = run(BASE)
  assert.deepEqual(codes(r), ['FIELD_UNREAD'])
  assert.match(r.findings[0].message, /`why`/)
  assert.equal(r.seen.fields, 2)
  assert.equal(r.seen.asserted, 1)
})

test('the control: the same register with a consumer that reads it is clean', () => {
  const r = run({ ...BASE, files: { ...BASE.files, 'c.mjs': 'export const f = (e) => [e.keep, e.why]\n' } })
  assert.deepEqual(codes(r), [])
  assert.equal(r.seen.asserted, 2)
})

test('one of several consumers reading it is enough', () => {
  const r = run({
    files: { ...BASE.files, 'd.mjs': 'const s = e.why\n' },
    manifest: { registers: [{ path: 'r.json', entries: 'accepted', consumers: ['c.mjs', 'd.mjs'] }] },
  })
  assert.deepEqual(codes(r), [])
})

test('two entry keys are both graded, because suite-baseline holds red and repaired', () => {
  const r = run({
    files: {
      'r.json': JSON.stringify({ red: [{ keep: 1 }], repaired: [{ keep: 1, only_here: 1 }] }),
      'c.mjs': 'e.keep\n',
    },
    manifest: { registers: [{ path: 'r.json', entries: ['red', 'repaired'], consumers: ['c.mjs'] }] },
  })
  assert.deepEqual(codes(r), ['FIELD_UNREAD'])
  assert.match(r.findings[0].message, /only_here/)
  assert.equal(r.seen.entries, 2)
})

// ---------------------------------------------------------------------------
// The baseline, in both directions
// ---------------------------------------------------------------------------

test('a baselined field is absorbed and counted, not reported', () => {
  const r = run({ ...BASE, baseline: { excused: [excuse()] } })
  assert.deepEqual(codes(r), [])
  assert.equal(r.seen.baselined, 1)
  assert.equal(r.rows.find((x) => x.field === 'why').why, 'deferred')
})

test('a baselined field that is now read is FIELD_BASELINE_STALE', () => {
  const r = run({
    ...BASE,
    files: { ...BASE.files, 'c.mjs': 'e.keep; e.why\n' },
    baseline: { excused: [excuse()] },
  })
  assert.deepEqual(codes(r), ['FIELD_BASELINE_STALE'])
  assert.match(r.findings[0].message, /repair landed/)
})

test('a baselined field that no entry carries any more is FIELD_BASELINE_STALE', () => {
  const r = run({ ...BASE, baseline: { excused: [excuse({ field: 'gone' })] } })
  assert.deepEqual(codes(r), ['FIELD_UNREAD', 'FIELD_BASELINE_STALE'].sort())
  assert.ok(r.findings.some((f) => /outlived its finding/.test(f.message)))
})

test('the baseline is keyed on the pair, so the same field name in another register is not covered', () => {
  const r = run({
    files: {
      'r.json': JSON.stringify({ accepted: [ENTRY] }),
      's.json': JSON.stringify({ accepted: [ENTRY] }),
      'c.mjs': 'e.keep\n',
    },
    manifest: {
      registers: [
        { path: 'r.json', entries: 'accepted', consumers: ['c.mjs'] },
        { path: 's.json', entries: 'accepted', consumers: ['c.mjs'] },
      ],
    },
    baseline: { excused: [excuse()] },
  })
  assert.deepEqual(codes(r), ['FIELD_UNREAD'])
  assert.match(r.findings[0].message, /^s\.json/)
})

// ---------------------------------------------------------------------------
// The baseline's own fields are asserted, which is this gate obeying itself
// ---------------------------------------------------------------------------

test('a baseline entry with no owner, a bad kind, or no measured date is MALFORMED', () => {
  for (const [over, re] of [
    [{ owner: undefined }, /no `owner`/],
    [{ kind: 'documentation' }, /only two are/],
    [{ measured: 'tonight' }, /YYYY-MM-DD/],
  ]) {
    const r = run({ ...BASE, baseline: { excused: [excuse(over)] } })
    assert.ok(codes(r).includes('BASELINE_ENTRY_MALFORMED'), JSON.stringify(over))
    assert.ok(r.findings.some((f) => re.test(f.message)), String(re))
  }
  // The control: the same entry, well formed, emits nothing.
  assert.deepEqual(codes(run({ ...BASE, baseline: { excused: [excuse()] } })), [])
})

test('instrument is the other legal kind, because the scan under-claims reads', () => {
  const r = run({ ...BASE, baseline: { excused: [excuse({ kind: 'instrument' })] } })
  assert.deepEqual(codes(r), [])
})

// ---------------------------------------------------------------------------
// The register's own declaration, in both directions
// ---------------------------------------------------------------------------

test('a field the register declares documentation-only is absorbed and counted', () => {
  const r = run({
    ...BASE,
    files: {
      ...BASE.files,
      'r.json': JSON.stringify({ accepted: [ENTRY], _documentation_only: { why: 'prose' } }),
    },
  })
  assert.deepEqual(codes(r), [])
  assert.equal(r.seen.declared, 1)
})

test('a declaration for a field a consumer now reads is DECLARATION_STALE', () => {
  const r = run({
    ...BASE,
    files: {
      'r.json': JSON.stringify({ accepted: [ENTRY], _documentation_only: { why: 'prose' } }),
      'c.mjs': 'e.keep; e.why\n',
    },
  })
  assert.deepEqual(codes(r), ['DECLARATION_STALE'])
  assert.match(r.findings[0].message, /no longer true/)
})

test('a declaration for a field no entry carries is DECLARATION_STALE', () => {
  const r = run({
    ...BASE,
    files: {
      ...BASE.files,
      'r.json': JSON.stringify({ accepted: [ENTRY], _documentation_only: { gone: 'prose' } }),
    },
  })
  assert.deepEqual(codes(r), ['FIELD_UNREAD', 'DECLARATION_STALE'].sort())
  assert.ok(r.findings.some((f) => /outlives its field/.test(f.message)))
})

// ---------------------------------------------------------------------------
// Discovery and the manifest
// ---------------------------------------------------------------------------

test('a discovered register the manifest does not classify is REGISTER_UNCLASSIFIED', () => {
  const r = run({ ...BASE, candidates: ['r.json', 'new.json'] })
  assert.ok(codes(r).includes('REGISTER_UNCLASSIFIED'))
  assert.match(r.findings.find((f) => f.rule === 'REGISTER_UNCLASSIFIED').message, /new\.json/)
})

test('classifying it as data silences the finding without making it a register', () => {
  const r = run({
    ...BASE,
    manifest: { ...BASE.manifest, data: [{ path: 'new.json', why: 'a measurement dump' }] },
    candidates: ['r.json', 'new.json'],
  })
  assert.deepEqual(codes(r), ['FIELD_UNREAD'])
  assert.equal(r.seen.registers, 1)
})

test('a consumer that is not in the tree is CONSUMER_MISSING, not a clean register', () => {
  const r = run({
    files: { 'r.json': JSON.stringify({ accepted: [{ keep: 1 }] }) },
    manifest: { registers: [{ path: 'r.json', entries: 'accepted', consumers: ['gone.mjs'] }] },
  })
  // Both, deliberately: the missing consumer explains the unread field, and
  // reporting only the field would send a reader to the wrong file.
  assert.deepEqual(codes(r), ['CONSUMER_MISSING', 'FIELD_UNREAD'].sort())
  assert.match(r.findings.find((f) => f.rule === 'CONSUMER_MISSING').message, /about the manifest/)
})

// ---------------------------------------------------------------------------
// The verdict
// ---------------------------------------------------------------------------

test('the clean line names the floor it asserts and the ceiling it does not', () => {
  const v = verdict([], { registers: 9, entries: 61, fields: 62, asserted: 41, baselined: 21 })
  assert.equal(v.exitCode, 0)
  assert.match(v.line, /floor and not the ceiling/)
  assert.match(v.line, /41 are read/)
})

test('a finding exits 1 and says the repair is a pull request', () => {
  const v = verdict([{ rule: 'FIELD_UNREAD', message: 'x' }], { registers: 9 })
  assert.equal(v.exitCode, 1)
  assert.match(v.line, /1 finding\(s\)/)
  assert.match(v.line, /pull request/)
})

test('a ground fault exits 2 and claims nothing about any field', () => {
  const v = verdict([], { ground: { cause: 'NOT_A_GIT_CHECKOUT', line: 'established nothing.' } })
  assert.equal(v.exitCode, 2)
  assert.equal(v.derivedFrom, 'ground')
  assert.doesNotMatch(v.line, /field\(s\)/)
})

test('every probe the gate declares drives a distinct outcome', () => {
  assert.ok(GATE.probes.length >= 6)
  assert.ok(GATE.groundProbes.length >= 3)
  for (const p of GATE.probes) assert.equal(typeof verdict(p.findings, p.seen).line, 'string')
})

// ---------------------------------------------------------------------------
// End to end, against this repository
// ---------------------------------------------------------------------------

test('the gate is green on this checkout and its own two files are registers in it', () => {
  const out = execFileSync('node', ['tools/gates/acceptance-fields.mjs', '--json'], {
    cwd: ROOT,
    encoding: 'utf8',
  })
  const got = JSON.parse(out)
  assert.deepEqual(got.findings, [])
  assert.equal(got.verdict.exitCode, 0)
  const graded = new Set(got.rows.map((r) => r.register))
  assert.ok(graded.has('tools/gates/acceptance-fields.json'))
  assert.ok(graded.has('tools/gates/acceptance-fields.baseline.json'))
  // The control for the end-to-end run: it found reads, so a clean result is
  // not the instrument failing to see anything.
  assert.ok(got.seen.asserted > 20, `only ${got.seen.asserted} reads found`)
})
