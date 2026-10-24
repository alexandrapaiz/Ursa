// node --test tools/registers/
// Zero dependencies on purpose: a git merge driver has to run during a merge in
// a checkout where nothing has been installed, so its tests run the same way.
//
// These tests drive real `git merge` operations in a throwaway repository
// rather than calling the merge function directly. The defect this driver
// exists to fix was never in a merge algorithm; it was in which grammar git
// hands which file to. A test that calls the merger directly cannot see that,
// because it has already made the choice the driver is responsible for.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, readFileSync, rmSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..', '..');

/** A register with `n` numbered entries, in the shape docs/agents/incidents.md has. */
function register(entries, preamble = '# Incident Register — Ursa\n\nBlameless postmortems.\n\n') {
  return preamble + entries.map((e) => `## ${e.heading}\n\n${e.body}\n\n`).join('');
}

const BASE_ENTRIES = [
  { heading: 'Incident 1 — the token was invalid', body: '**Status:** closed.\n\n### What happened\n\nIt was.' },
  { heading: 'Incident 2 — the path went public', body: '**Status:** closed.\n\n### What happened\n\nIt did.' },
  { heading: 'INC-2026-10-18-a-slug — the register moved to slugs', body: '**Status:** closed.\n\n### What happened\n\nIt moved.' },
];

/**
 * A throwaway git repository holding the register at `path`, with the driver
 * installed and `.gitattributes` pointing `path` at it, plus two branches that
 * each appended something different to the register's tail.
 */
function scenario({ path, ours, theirs, base = BASE_ENTRIES, attribute = 'register' }) {
  const dir = mkdtempSync(join(tmpdir(), 'ursa-register-'));
  const git = (...args) =>
    execFileSync('git', ['-C', dir, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });

  git('init', '-q', '-b', 'main');
  git('config', 'user.email', 'test@example.invalid');
  git('config', 'user.name', 'test');
  git('config', 'commit.gpgsign', 'false');
  // The real driver, by absolute path, exactly as install-drivers.sh writes it.
  git('config', 'merge.register.driver', `node ${join(ROOT, 'tools/registers/merge-driver.mjs')} %O %A %B %L %P`);
  git('config', 'merge.register.name', 'test');

  mkdirSync(join(dir, dirname(path)), { recursive: true });
  writeFileSync(join(dir, path), register(base));
  writeFileSync(join(dir, '.gitattributes'), `${path} merge=${attribute}\n`);
  git('add', '-A');
  git('commit', '-qm', 'base');

  git('checkout', '-q', '-b', 'theirs');
  writeFileSync(join(dir, path), register([...base, ...theirs]));
  git('commit', '-qam', 'theirs appends');

  git('checkout', '-q', 'main');
  writeFileSync(join(dir, path), register([...base, ...ours]));
  git('commit', '-qam', 'ours appends');

  let status = 0;
  let output = '';
  try {
    output = git('merge', '--no-edit', 'theirs');
  } catch (err) {
    status = err.status ?? 1;
    output = `${err.stdout ?? ''}${err.stderr ?? ''}`;
  }
  const merged = readFileSync(join(dir, path), 'utf8');
  rmSync(dir, { recursive: true, force: true });
  return { status, output, merged, headings: [...merged.matchAll(/^## (.+)$/gm)].map((m) => m[1]) };
}

const OURS_ONE = [{ heading: 'INC-2026-10-24-pm-pass — the PM found a thing', body: '**Status:** open.\n\n### What happened\n\nOurs.' }];
const THEIRS_ONE = [{ heading: 'INC-2026-10-24-exo-window — the exo seat found a thing', body: '**Status:** open.\n\n### What happened\n\nTheirs.' }];

test('two seats appending to one register tail merge without a human', () => {
  const r = scenario({ path: 'docs/agents/incidents.md', ours: OURS_ONE, theirs: THEIRS_ONE });
  assert.equal(r.status, 0, `the merge should succeed, got:\n${r.output}`);
  assert.equal(r.headings.length, 5);
  assert.ok(r.headings.some((h) => h.startsWith('INC-2026-10-24-pm-pass')), 'our entry survived');
  assert.ok(r.headings.some((h) => h.startsWith('INC-2026-10-24-exo-window')), 'their entry survived');
  assert.ok(!r.merged.includes('<<<<<<<'), 'no conflict markers');
});

test('the sub-headings inside an entry are body, not entries: the result holds exactly the union', () => {
  const r = scenario({ path: 'docs/agents/incidents.md', ours: OURS_ONE, theirs: THEIRS_ONE });
  // This is the assertion the ledger grammar fails. `### What happened` appears
  // in all five entries; keyed as a block it repeats, and merging duplicate
  // keys is what inflated the real file by 189,548 bytes. Here it must stay
  // inside its entry, so the count of `## ` headings is exactly the union.
  assert.equal((r.merged.match(/^### What happened$/gm) ?? []).length, 5);
  assert.equal(r.headings.length, 5);
});

test('every entry in the result is byte-for-byte one side\'s, never a blend', () => {
  const r = scenario({ path: 'docs/agents/incidents.md', ours: OURS_ONE, theirs: THEIRS_ONE });
  const ourText = register([...BASE_ENTRIES, ...OURS_ONE]);
  const theirText = register([...BASE_ENTRIES, ...THEIRS_ONE]);
  const entries = (t) => {
    const out = new Map();
    const parts = t.split(/^(?=## )/m).slice(1);
    for (const p of parts) out.set(p.split('\n')[0], p.replace(/\n+$/, ''));
    return out;
  };
  const o = entries(ourText);
  const t = entries(theirText);
  for (const [heading, body] of entries(r.merged)) {
    assert.ok(
      body === o.get(heading) || body === t.get(heading),
      `entry ${heading} matches neither side exactly`,
    );
  }
});

test('two seats that allocate the same identifier are refused by name, not merged quietly', () => {
  // The case that makes --identifier mandatory rather than decorative. Both
  // sides read the register's tail, both took 19, and the headings differ, so
  // without the identifier check both entries land and two postmortems answer
  // to one citable name.
  const r = scenario({
    path: 'docs/agents/incidents.md',
    ours: [{ heading: 'Incident 19 — the PM pass', body: '**Status:** open.' }],
    theirs: [{ heading: 'Incident 19 — the exo window', body: '**Status:** open.' }],
  });
  assert.notEqual(r.status, 0, 'the merge must fail');
  assert.match(r.output, /one identifier to two entries/);
  assert.match(r.output, /Incident 19/);
});

test('a refusal leaves conflict markers in the file, so it cannot be committed as clean', () => {
  const r = scenario({
    path: 'docs/agents/incidents.md',
    ours: [{ heading: 'Incident 19 — the PM pass', body: '**Status:** open.' }],
    theirs: [{ heading: 'Incident 19 — the exo window', body: '**Status:** open.' }],
  });
  // The whole point of the fallback. A driver that refuses and leaves `ours` in
  // place hands back a file that reads clean, which is the same silent failure
  // as merging wrongly.
  assert.ok(r.merged.includes('<<<<<<<'), 'the working-tree copy carries markers');
  assert.ok(r.merged.includes('>>>>>>>'), 'both sides are present for the human');
  assert.match(r.output, /wrote git's own line-based merge/);
});

test('an undeclared path is refused rather than parsed with somebody else\'s grammar', () => {
  // The silent-corruption guard. registers.json does not declare this path, so
  // the driver must not guess a grammar for it.
  const r = scenario({ path: 'docs/agents/not-a-register.md', ours: OURS_ONE, theirs: THEIRS_ONE });
  assert.notEqual(r.status, 0);
  assert.match(r.output, /is not a declared register/);
  assert.match(r.output, /docs\/agents\/incidents\.md/, 'the refusal names what is declared');
  assert.ok(r.merged.includes('<<<<<<<'), 'and still leaves a conflict a human can see');
});

test('a declared but disabled register merges the ordinary way, with the reason printed', () => {
  const r = scenario({ path: 'docs/ideas.md', ours: OURS_ONE, theirs: THEIRS_ONE });
  assert.notEqual(r.status, 0);
  assert.match(r.output, /declared but not enabled/);
  assert.match(r.output, /older driver/, 'the reason from registers.json reaches the operator');
});

test('the register table and .gitattributes cannot disagree about what is covered', () => {
  // Two files have to name the same paths, and nothing but a test notices when
  // one of them is edited alone.
  const table = JSON.parse(readFileSync(join(ROOT, 'tools/registers/registers.json'), 'utf8'));
  const attrs = readFileSync(join(ROOT, '.gitattributes'), 'utf8');
  const enabled = table.registers.filter((r) => r.enabled === true).map((r) => r.path);
  const declared = [...attrs.matchAll(/^(\S+) merge=register$/gm)].map((m) => m[1]);
  assert.deepEqual(enabled.slice().sort(), declared.slice().sort());
  for (const r of table.registers) {
    assert.ok(r.why && r.why.length > 40, `${r.path} needs a reason, not a flag`);
    if (r.enabled && r.identifier) {
      assert.ok(r.why_identifier, `${r.path} is identifier-checked, so it must say why`);
    }
  }
});

test('the vendored merger is byte-identical to its provenance record', () => {
  // A local patch to the vendored file is the failure
  // INC-2026-10-18-hq-tool-paths-are-hq-s tells this repository not to commit.
  const out = execFileSync('node', [join(ROOT, 'tools/registers/check-vendored.mjs')], {
    encoding: 'utf8',
  });
  assert.match(out, /the vendored bytes match the record/);
});

test('the real register on main parses to unique entry headings under its declared grammar', () => {
  // The precondition the driver depends on, asserted against the real file
  // rather than a fixture. HQ's merger refuses a side that already holds one
  // heading twice, so a duplicate heading on `main` would disable the driver
  // for every branch at once.
  const table = JSON.parse(readFileSync(join(ROOT, 'tools/registers/registers.json'), 'utf8'));
  for (const reg of table.registers.filter((r) => r.enabled === true)) {
    const text = readFileSync(join(ROOT, reg.path), 'utf8');
    const headings = text.split('\n').filter((l) => new RegExp(reg.heading).test(l));
    assert.ok(headings.length > 1, `${reg.path} should parse to entries, got ${headings.length}`);
    assert.equal(
      new Set(headings).size,
      headings.length,
      `${reg.path} holds a repeated entry heading, which the merger refuses`,
    );
  }
});
