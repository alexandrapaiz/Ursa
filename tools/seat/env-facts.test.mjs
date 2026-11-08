// node --test tools/seat/env-facts.test.mjs
//
// Four kinds of test, and the "control:" ones are load-bearing rather than
// decorative.
//
// "bound:" is the mechanism this directory exists for. env-facts.json is a
// table that binds a class of surfaces — the eleven seat charters — and the
// whole argument for a table over eleven copies is that a check can fail when
// a member leaves the class. If nothing fails, the table is prose with extra
// steps.
//
// "control:" is the positive control, and this file has one for every gap
// --audit can report. An assertion that the live tree has zero gaps is worth
// nothing unless the same harness can see a gap when one is there: a predicate
// that matched nothing at all would pass every live assertion here. That rule
// is this repository's own, written after three of its instruments in one day
// reported an absence they could not have distinguished from a broken filter
// (INC-2026-10-26-an-absence-measured-by-an-instrument-that-could-not-see-presence).
//
// "derived:" asserts the property that makes the class compound: the class is
// an intersection of the roster and the filesystem, so a twelfth seat joins it
// without anyone editing a count. The defect it is guarding against is
// specific and recent — on 2026-10-27 one measurement's denominator was frozen
// into eleven charters, a JSON field and a tool, at three different values,
// because a number that moves cannot live in a literal.
//
// "integrity:" asserts the rows point at something. A table every charter
// cites whose rows resolve to nothing is the same defect one layer down.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync, cpSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { facts, citation, charterClass, gradeCoverage, gradeIntegrity } from './env-facts.mjs';

const TOOL = new URL('./env-facts.mjs', import.meta.url).pathname;
const ROOT = new URL('../../', import.meta.url).pathname;

/** A fixture root with a real `prompts/` and `docs/agents/`, free to mutate. */
function fixture(mutate = () => {}) {
  const dir = mkdtempSync(join(tmpdir(), 'env-facts-'));
  mkdirSync(join(dir, 'docs', 'agents'), { recursive: true });
  cpSync(join(ROOT, 'prompts'), join(dir, 'prompts'), { recursive: true });
  cpSync(join(ROOT, 'docs/agents/runner-facts.md'), join(dir, 'docs/agents/runner-facts.md'));
  mutate(dir);
  return dir.endsWith('/') ? dir : `${dir}/`;
}

test('bound: every member of the derived class cites the one command', () => {
  const g = gradeCoverage();
  const missing = g.rows.filter((r) => !r.cites).map((r) => r.path);
  assert.deepEqual(missing, [], `charters not citing ${g.cite}: ${missing.join(', ')}`);
  assert.equal(g.covered, g.total);
  assert.ok(g.total > 1, 'a class of one is not a class');
});

test('bound: the roster and the charter files agree in both directions', () => {
  const c = charterClass();
  assert.deepEqual(c.seats_without_charter, []);
  assert.deepEqual(c.charters_without_seat, []);
  assert.equal(c.members.length, c.seats.length);
});

test('control: a charter that stops citing the command is reported', () => {
  const root = fixture((d) => {
    const p = join(d, 'prompts', 'pm-agent.md');
    writeFileSync(p, readFileSync(p, 'utf8').replaceAll(citation(), 'node tools/seat/SOMETHING-ELSE.mjs'));
  });
  const g = gradeCoverage(root);
  assert.deepEqual(g.rows.filter((r) => !r.cites).map((r) => r.seat), ['pm']);
  assert.equal(g.covered, g.total - 1);
});

test('control: a seat with no charter, and a charter with no seat, are both reported', () => {
  const gone = gradeCoverage(fixture((d) => {
    spawnSync('rm', [join(d, 'prompts', 'sales-agent.md')]);
  }));
  assert.deepEqual(gone.seats_without_charter, ['sales']);
  assert.deepEqual(gone.charters_without_seat, []);

  const extra = gradeCoverage(fixture((d) => {
    writeFileSync(join(d, 'prompts', 'chair-agent.md'), citation());
  }));
  assert.deepEqual(extra.seats_without_charter, []);
  assert.deepEqual(extra.charters_without_seat, ['chair']);
});

test('derived: the class is an intersection, with no count written anywhere', () => {
  const src = readFileSync(TOOL, 'utf8');
  const code = src.split('\n').filter((l) => !l.trimStart().startsWith('//')).join('\n');
  assert.ok(!/===\s*11\b/.test(code), 'the class size must not be asserted as a literal');
  // A twelfth seat joins the class by existing, with nothing edited here.
  const grown = gradeCoverage(fixture((d) => {
    writeFileSync(join(d, 'prompts', 'chair-agent.md'), citation());
  }));
  assert.equal(grown.total, gradeCoverage().total,
    'an unrostered charter must not silently enlarge the graded class');
  assert.deepEqual(grown.charters_without_seat, ['chair'],
    'it must be reported as a gap instead');
});

test('integrity: every fact resolves to a real section and a real path', () => {
  const g = gradeIntegrity();
  assert.ok(g.reading_resolved);
  assert.ok(g.sections_found > 10, `only ${g.sections_found} sections parsed out of the reading register`);
  for (const r of g.rows) {
    assert.deepEqual(r.reading_missing, [], `${r.id} cites a missing section`);
    assert.notEqual(r.path_ok, false, `${r.id} names a path that does not exist`);
  }
  assert.ok(facts().length > 0);
  for (const f of facts()) {
    assert.ok(f.id && f.one_line && Array.isArray(f.reading) && f.reading.length,
      `fact "${f.id}" is missing a required field`);
  }
});

test('control: a fact citing a section that does not exist is reported', () => {
  const g = gradeIntegrity(fixture((d) => {
    writeFileSync(join(d, 'docs/agents/runner-facts.md'), '## 9999. nothing real\n');
  }));
  const flagged = g.rows.filter((r) => r.reading_missing.length);
  assert.equal(flagged.length, facts().length,
    'with an empty reading register every row should be reported, not none');
});

test('absence is printed, not implied, and --audit is a gate', () => {
  const r = spawnSync('node', [TOOL, '--audit'], { encoding: 'utf8', cwd: ROOT });
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.match(r.stdout, /^class=\d+ cites=\d+ facts=\d+ reading_sections=\d+ gaps=0$/m,
    'a clean audit must still print its counts');
  // Rows whose command is not a repository path are named rather than quietly
  // excluded from the integrity grade.
  assert.match(r.stdout, /no repository path to check \(stated, not skipped\)/);

  const usage = spawnSync('node', [TOOL, '--help'], { encoding: 'utf8', cwd: ROOT });
  assert.equal(usage.status, 2);
});

test('the table prints, and names the reading register beside each row', () => {
  const r = spawnSync('node', [TOOL], { encoding: 'utf8', cwd: ROOT });
  assert.equal(r.status, 0);
  for (const f of facts()) assert.ok(r.stdout.includes(f.id), `${f.id} missing from the table`);
  assert.ok(r.stdout.includes('docs/agents/runner-facts.md'));
});
