// Suite for tools/capture-provenance.mjs and its verdict module.
//
// The property worth testing hardest is the one the gate was narrowed for: a
// directory with no record surface is never asked for a declaration, and a
// directory with one always is. Both halves are asserted, because a gate that
// only ever fires is as useless here as one that never does.

import { test } from 'node:test'
import assert from 'node:assert/strict'

import {
  DECLARATIONS,
  GATE,
  RECORD_SURFACES,
  undeclaredLine,
  unusable,
  verdict,
} from './capture-provenance-verdict.mjs'
import { classify, groupReviews, reviewOf, sweep, REVIEWS } from './capture-provenance.mjs'

const CENSUS = { dirs: 36, images: 1473, declared: 29, recordDirs: 28 }

// --- reviewOf -------------------------------------------------------------

test('reviewOf groups at the review level and not deeper', () => {
  assert.equal(reviewOf(`${REVIEWS}/2026-11-02/after/home.png`), `${REVIEWS}/2026-11-02`)
  assert.equal(reviewOf(`${REVIEWS}/2026-11-02/data/hover-all/rest/a.png`), `${REVIEWS}/2026-11-02`)
})

test('reviewOf refuses paths outside the review tree', () => {
  assert.equal(reviewOf('ursa-minor/app/favicon.ico'), null)
  assert.equal(reviewOf('docs/design/review-kit/state/panel-payload.mjs'), null)
})

test('reviewOf refuses a file sitting directly in the reviews directory', () => {
  // There is no review to attribute it to, and inventing one would put a
  // finding on a directory name that does not exist.
  assert.equal(reviewOf(`${REVIEWS}/README.md`), null)
})

// --- groupReviews ---------------------------------------------------------

test('groupReviews splits captures from recipes and drops directories with neither', () => {
  const g = groupReviews([
    `${REVIEWS}/a/after/x.png`,
    `${REVIEWS}/a/shots.mjs`,
    `${REVIEWS}/b/README.md`,
    'tools/capture-provenance.mjs',
  ])
  assert.deepEqual([...g.keys()], [`${REVIEWS}/a`])
  assert.deepEqual(g.get(`${REVIEWS}/a`).images, [`${REVIEWS}/a/after/x.png`])
  assert.deepEqual(g.get(`${REVIEWS}/a`).texts, [`${REVIEWS}/a/shots.mjs`])
})

test('groupReviews counts every capture extension, not only png', () => {
  const g = groupReviews([`${REVIEWS}/a/x.webp`, `${REVIEWS}/a/y.JPEG`, `${REVIEWS}/a/z.ico`])
  assert.equal(g.get(`${REVIEWS}/a`).images.length, 3)
})

test('groupReviews treats an svg as a capture and not a recipe', () => {
  // SVG is text, so the redaction gate's own patterns already read it. What it
  // must not become is a file this gate mines for declarations.
  const g = groupReviews([`${REVIEWS}/a/logo.svg`, `${REVIEWS}/a/x.png`])
  assert.deepEqual(g.get(`${REVIEWS}/a`).texts, [])
})

// --- classify -------------------------------------------------------------

const none = () => ''

test('classify finds no record surface in a marketing-site review', () => {
  const r = { images: [`${REVIEWS}/a/after/404-cta-rest-desktop.png`], texts: [`${REVIEWS}/a/shots.mjs`] }
  const got = classify(`${REVIEWS}/a`, r, () => 'await page.goto(`${BASE}/no-such-page`)')
  assert.deepEqual(got.surfaces, [])
  assert.equal(got.declared, false)
})

test('classify reads the surface out of a filename, per the naming rule', () => {
  const r = { images: [`${REVIEWS}/a/record-mini-fixture/phone.png`], texts: [] }
  const got = classify(`${REVIEWS}/a`, r, none)
  assert.deepEqual(got.surfaces, ['the record viewer'])
  // `mini-fixture` in the same name is the store, so this one declares too.
  assert.equal(got.declared, true)
})

test('classify finds a surface in a recipe and the store in prose', () => {
  const r = { images: [`${REVIEWS}/a/after/x.png`], texts: [`${REVIEWS}/a/README.md`] }
  const got = classify(`${REVIEWS}/a`, r, () => 'npx tsx src/bin/ursa.ts serve /tmp/s/frozen --port 7861\nthe demo store')
  assert.deepEqual(got.surfaces, ['a served store'])
  assert.equal(got.declared, true)
})

test('classify reports a record surface with no store as undeclared', () => {
  const r = { images: [`${REVIEWS}/a/after/x.png`], texts: [`${REVIEWS}/a/README.md`] }
  const got = classify(`${REVIEWS}/a`, r, () => 'await page.goto(`${BASE}/dashboard`)')
  assert.deepEqual(got.surfaces, ['the dashboard'])
  assert.equal(got.declared, false)
  assert.equal(got.images, 1)
})

test('classify sorts multiple surfaces so the line is stable', () => {
  const r = { images: [`${REVIEWS}/a/x.png`], texts: [`${REVIEWS}/a/r.mjs`] }
  const a = classify(`${REVIEWS}/a`, r, () => '/dashboard /record')
  const b = classify(`${REVIEWS}/a`, r, () => '/record /dashboard')
  assert.deepEqual(a.surfaces, b.surfaces)
})

test('classify does not mistake an unrelated dotted word for a store directory', () => {
  // `.ursa` is the store. `ursa-major` and `docs.ursa` are not, and a loose
  // pattern here would mark every review a store capture and make the gate
  // fire on the whole tree.
  const r = { images: [`${REVIEWS}/a/x.png`], texts: [`${REVIEWS}/a/r.md`] }
  assert.deepEqual(classify(`${REVIEWS}/a`, r, () => 'cd ursa-major && npm install').surfaces, [])
  assert.deepEqual(classify(`${REVIEWS}/a`, r, () => 'cp -r /tmp/s/.ursa /tmp/f/.ursa').surfaces, ['a store directory'])
})

// --- the patterns themselves ---------------------------------------------

test('every record surface carries a distinct name', () => {
  const names = RECORD_SURFACES.map((s) => s.name)
  assert.equal(new Set(names).size, names.length)
})

test('every declaration pattern is a regexp', () => {
  for (const d of DECLARATIONS) assert.ok(d instanceof RegExp)
})

// --- the verdict ----------------------------------------------------------

test('a tree whose every record surface is declared is clean', () => {
  const v = verdict([], CENSUS)
  assert.equal(v.exitCode, 0)
  assert.equal(v.cause, 'EVERY_RECORD_SURFACE_DECLARED')
})

test('no captures at all is clean and not unmeasured', () => {
  const v = verdict([], { dirs: 0, images: 0, declared: 0, recordDirs: 0 })
  assert.equal(v.exitCode, 0)
  assert.equal(v.cause, 'NO_CAPTURES')
})

test('an undeclared record surface exits 1 and names the reader repair', () => {
  const v = verdict([{ dir: `${REVIEWS}/x`, images: 12, surfaces: ['the dashboard'] }], { ...CENSUS, recordDirs: 29 })
  assert.equal(v.exitCode, 1)
  assert.equal(v.cause, 'RECORD_SURFACE_UNDECLARED')
  assert.match(v.line, /name no store/)
})

test('the verdict never quotes a declaration, a url or a matched line', () => {
  // The charter forbids printing what the scan read. The only free text in the
  // output is a directory name and a surface name from the fixed table.
  const f = { dir: `${REVIEWS}/x`, images: 2, surfaces: ['the record viewer'] }
  const text = [verdict([f], { ...CENSUS, recordDirs: 29 }).line, undeclaredLine(f)].join('\n')
  assert.ok(!text.includes('http'))
  assert.ok(!text.includes('${BASE}'))
  assert.ok(!text.includes('/tmp/'))
})

test('the undeclared line names the directory, the count and the repair', () => {
  const line = undeclaredLine({ dir: `${REVIEWS}/x`, images: 7, surfaces: ['the dashboard'] })
  assert.match(line, new RegExp(`${REVIEWS}/x`))
  assert.match(line, /7 capture\(s\)/)
  assert.match(line, /README/)
})

test('ground is exit 2 on standard error and never clean', () => {
  const v = unusable('TREE_UNREADABLE', 'the tracked file list could not be read', 'git exited 128')
  assert.equal(v.exitCode, 2)
  assert.equal(v.stream, 'err')
  assert.equal(v.derivedFrom, 'ground')
})

test('the gate descriptor declares its one locus and its probes', () => {
  assert.equal(GATE.id, 'tools/capture-provenance.mjs')
  assert.equal(GATE.findingsLocus, 'reader')
  assert.ok(GATE.probes.length >= 4)
})

test('the locus noun matches the failing line and not the clean one', () => {
  const noun = GATE.loci.reader.noun
  assert.match(verdict([{ dir: 'd', images: 1, surfaces: ['the dashboard'] }], { ...CENSUS, recordDirs: 29 }).line, noun)
  assert.doesNotMatch(verdict([], CENSUS).line, noun)
})

// --- the tree it actually runs on -----------------------------------------

test('the committed tree has a capture corpus and every record surface in it is declared', () => {
  const { rows, undeclared, seen } = sweep()
  assert.ok(seen.dirs > 0, 'no capture directories found, so this suite is not testing the real question')
  assert.ok(seen.images > 1000)
  assert.deepEqual(undeclared, [], `undeclared record surfaces: ${undeclared.map((u) => u.dir).join(', ')}`)
  assert.equal(rows.length, seen.dirs)
})

test('the tree exercises both classifications, so neither branch is dead', () => {
  const { rows } = sweep()
  assert.ok(rows.some((r) => r.surfaces.length > 0), 'no review renders a record surface')
  assert.ok(rows.some((r) => r.surfaces.length === 0), 'no review is site-only')
})
