// node --test tools/ledger/check.test.mjs
// check.mjs is a CLI, so it is tested as one: written fixture in, exit code
// and stderr out.
//
// Exit codes under test, from check.mjs's header: 0 clean, 1 at least one
// violation a seat must repair, 2 only violations the owner must resolve.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const CHECK = new URL('./check.mjs', import.meta.url).pathname;

function check(file) {
  try {
    return { code: 0, out: execFileSync('node', [CHECK, file], { encoding: 'utf8' }) };
  } catch (err) {
    return { code: err.status, out: `${err.stdout ?? ''}${err.stderr ?? ''}` };
  }
}

function run(contents) {
  const dir = mkdtempSync(join(tmpdir(), 'ledger-check-'));
  const file = join(dir, 'ideas.md');
  writeFileSync(file, contents);
  return check(file);
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

test('the real ledger carries no violation a seat could repair', () => {
  // Was `assert.equal(code, 0)`, and it had been failing on `main` for weeks
  // with twelve violations. Nine of the twelve were this gate applying §4's
  // five-field contract to competitive-scan notes, which the standard never
  // gave that contract to; those are gone. Of the remaining three, two were a
  // real idea entry missing `- Cost:` and `- Status:` and are fixed in the
  // same pull request as this line. The last is `Status: done` on a
  // 2026-10-04 security entry, which only the owner may move, so the
  // assertion is `!== 1` and the owner-held residue is printed rather than
  // asserted away. A seat adding a thirteenth violation still turns this red.
  const res = check(new URL('../../docs/ideas.md', import.meta.url).pathname);
  assert.notEqual(
    res.code,
    1,
    `docs/ideas.md violates its own contract where a seat could fix it:\n${res.out}`,
  );
  assert.doesNotMatch(res.out, /::error::/, `unexpected seat-held violation:\n${res.out}`);
});

test('a well-formed entry passes', () => {
  assert.equal(run(GOOD).code, 0);
});

test('a missing trigger fails, because §4 says an idea must name one', () => {
  const res = run(GOOD.replace('- Trigger: an observation\n', ''));
  assert.equal(res.code, 1);
  assert.match(res.out, /missing the "- Trigger:" line/);
});

test('a seat tag after the date is accepted, as the market seat writes it', () => {
  const res = run(GOOD.replace('### 2026-09-27 —', '### 2026-09-27 (market) —'));
  assert.equal(res.code, 0, res.out);
});

test('a heading with no date fails', () => {
  const res = run(GOOD.replace('### 2026-09-27 — A well-formed idea', '### A well-formed idea'));
  assert.equal(res.code, 1);
  assert.match(res.out, /heading is not/);
});

test('a status outside the five allowed words is the owner’s to resolve, exit 2', () => {
  // This was exit 1 before 2026-10-24. It moved because the only instance in
  // the real ledger is a status no seat is permitted to move, so holding the
  // whole suite red on it meant the gate could never go green and stopped
  // being read. The violation is still printed by name, as a warning, and the
  // run that wrote a bad status is the run reading the output.
  const res = run(GOOD.replace('- Status: proposed', '- Status: maybe'));
  assert.equal(res.code, 2, res.out);
  assert.match(res.out, /allowed: proposed, accepted, rejected, built, urgent/);
  assert.match(res.out, /Only the owner moves a status/);
  assert.match(res.out, /::warning::/);
  assert.doesNotMatch(res.out, /::error::/);
});

test('an owner-held violation never masks a seat-held one: exit 1 wins', () => {
  const res = run(
    GOOD.replace('- Status: proposed', '- Status: maybe').replace('- Cost: $0\n', ''),
  );
  assert.equal(res.code, 1, res.out);
  assert.match(res.out, /missing the "- Cost:" line/);
  assert.match(res.out, /1 the owner must resolve/);
});

test('a competitive-scan note written in prose under a heading is exempt', () => {
  const res = run(
    `${GOOD}\n### 2026-09-27 — Competitive scan: one product\nLangSmith joins feedback to traces after the fact.\n`,
  );
  assert.equal(res.code, 0, res.out);
});

test('a scan note using the §4 field names in its own prose is also exempt', () => {
  // The regression test for the twelve-violation defect. The fixture above
  // passed throughout, because it is bare prose; this one has the field shape
  // the real `### 2026-10-08 — Craft scan: Mem0` note has, and the old
  // `present.length > 0` exemption did not fire on it.
  const res = run(
    [
      GOOD,
      '### 2026-10-08 — Craft scan: Mem0, and memory history as a user-facing surface',
      '- Trigger: the daily craft scan, rotating onto the landscape’s third category',
      '- Worth stealing: memory history, a per-memory record of how it changed over time',
      '- Where Ursa is ahead, concretely: `forget` is tested against derived data',
      '- Cost: $0',
      '- Status: proposed',
      '',
    ].join('\n'),
  );
  assert.equal(res.code, 0, res.out);
});

test('a scan note that files a First step owes all five fields', () => {
  const res = run(
    [
      GOOD,
      '### 2026-10-24 — Craft scan: a competitor, and the thing Ursa should build',
      '- Trigger: the daily craft scan',
      '- First step: write the module',
      '',
    ].join('\n'),
  );
  assert.equal(res.code, 1, res.out);
  assert.match(res.out, /missing the "- What:" line/);
  assert.match(res.out, /missing the "- Cost:" line/);
  assert.match(res.out, /missing the "- Status:" line/);
});

test('a scan note’s volunteered status is still checked', () => {
  const res = run(
    [
      GOOD,
      '### 2026-10-24 — Craft scan: one product',
      '- Worth stealing: something',
      '- Status: done',
      '',
    ].join('\n'),
  );
  assert.equal(res.code, 2, res.out);
  assert.match(res.out, /has status "done"/);
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
