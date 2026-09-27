// node --test tools/ledger/check.test.mjs
// check.mjs is a CLI, so it is tested as one: written fixture in, exit code
// and stderr out.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const CHECK = new URL('./check.mjs', import.meta.url).pathname;

function run(contents) {
  const dir = mkdtempSync(join(tmpdir(), 'ledger-check-'));
  const file = join(dir, 'ideas.md');
  writeFileSync(file, contents);
  try {
    const stdout = execFileSync('node', [CHECK, file], { encoding: 'utf8' });
    return { code: 0, out: stdout };
  } catch (err) {
    return { code: err.status, out: `${err.stdout ?? ''}${err.stderr ?? ''}` };
  }
}

const GOOD = [
  '# The Ledger — Ursa',
  '',
  '### 2026-09-27 — A well-formed idea',
  '- Trigger: an observation',
  '- What: one concrete paragraph',
  '- First step: a day-sized unit of work',
  '- Cost: $0',
  '- Status: proposed',
  '',
].join('\n');

test('the real ledger is checked by the same code path as a fixture', () => {
  const real = new URL('../../docs/ideas.md', import.meta.url).pathname;
  const res = (() => {
    try {
      return { code: 0, out: execFileSync('node', [CHECK, real], { encoding: 'utf8' }) };
    } catch (err) {
      return { code: err.status, out: `${err.stdout ?? ''}${err.stderr ?? ''}` };
    }
  })();
  assert.equal(res.code, 0, `docs/ideas.md violates its own contract:\n${res.out}`);
});

test('a well-formed entry passes', () => {
  assert.equal(run(GOOD).code, 0);
});

test('a missing trigger fails, because §4 says an idea must name one', () => {
  const res = run(GOOD.replace('- Trigger: an observation\n', ''));
  assert.equal(res.code, 1);
  assert.match(res.out, /missing the "- Trigger:" line/);
});

test('a status outside the five allowed words fails', () => {
  const res = run(GOOD.replace('- Status: proposed', '- Status: maybe'));
  assert.equal(res.code, 1);
  assert.match(res.out, /allowed: proposed, accepted, rejected, built, urgent/);
});

test('a competitive-scan note under a heading is exempt, not a violation', () => {
  const res = run(
    `${GOOD}\n### 2026-09-27 — Competitive scan: one product\nLangSmith joins feedback to traces after the fact.\n`,
  );
  assert.equal(res.code, 0, res.out);
});

test('the near-duplicate the ledger actually contains is caught', () => {
  const note = '- 2026-09-25 (chair, owner-present): overlay S0 shipped and verified end to end, verdict reader passed on the real n=1 record';
  const res = run(`${GOOD}\n${note} per §16.2.\n\n${note} per plan 16.2.\n`);
  assert.equal(res.code, 1);
  assert.match(res.out, /near-duplicate block/);
});

test('a committed conflict marker fails', () => {
  const res = run(`${GOOD}\n<<<<<<< ours\n`);
  assert.equal(res.code, 1);
  assert.match(res.out, /conflict marker is committed/);
});
