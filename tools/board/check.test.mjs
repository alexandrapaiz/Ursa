// node --test tools/board/check.test.mjs
//
// Two kinds of test here, and the difference is the point.
//
// The ordinary ones exercise `violations()` directly: given a message, which
// codes come back. They would catch a regression in this repository.
//
// The ones named "transcribed:" assert that the constants in check.mjs still
// match `runtime/board/store.py`, which lives in another repository and is
// deployed to this host at /srv/asc/hq. They are the only thing standing
// between a transcription and a quiet drift, and because that file is not
// always present (a laptop, a CI runner), they skip rather than fail when it
// is absent. A skip there means the transcription went unchecked on that run,
// not that it passed.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, mkdtempSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { violations, companiesFromHost } from './check.mjs';

const CHECK = new URL('./check.mjs', import.meta.url).pathname;
const POST = new URL('./post.mjs', import.meta.url).pathname;
const STORE = '/srv/asc/hq/runtime/board/store.py';

/** A message with every rule satisfied, so each test changes exactly one thing. */
const ok = (over = {}) => ({
  kind: 'note',
  subject: 'The wake path and the read path disagree about our name',
  body: 'I am writing this down because the failure is silent on both sides.\n\nThe store keeps the row and the bus drops it.',
  toSeat: 'pm',
  toCompany: 'Ursa',
  data: null,
  surface: '',
  everyone: false,
  ...over,
});

const codes = (m) => violations(m).map((v) => v.code);

test('a well-formed message has no violations', () => {
  assert.deepEqual(codes(ok()), []);
});

test('the lowercase company is refused and the repair names the exact spelling', () => {
  const v = violations(ok({ toCompany: 'ursa' }));
  assert.deepEqual(v.map((x) => x.code), ['COMPANY_SPELLING']);
  assert.match(v[0].repair, /write "Ursa"/);
});

test('every company in the table is accepted as written', () => {
  const table = JSON.parse(readFileSync(new URL('./companies.json', import.meta.url), 'utf8'));
  for (const name of Object.keys(table.companies)) {
    assert.deepEqual(codes(ok({ toCompany: name })), [], `${name} should be accepted`);
  }
});

test('a company nobody has heard of is refused without a near-match repair', () => {
  const v = violations(ok({ toCompany: 'ursa-minor' }));
  assert.deepEqual(v.map((x) => x.code), ['COMPANY_SPELLING']);
  assert.match(v[0].repair, /one of:/);
  assert.doesNotMatch(v[0].repair, /differs only in case/);
});

test('a seat named with no company is a five-company wake, and says so', () => {
  const v = violations(ok({ toCompany: '' }));
  assert.deepEqual(v.map((x) => x.code), ['COMPANY_OMITTED']);
  assert.match(v[0].line, /all 5 companies/);
});

test('--everyone is how a sender says they meant all five', () => {
  assert.deepEqual(codes(ok({ toCompany: '', everyone: true })), []);
});

test('a code in the subject is caught, not only in the body', () => {
  assert.deepEqual(codes(ok({ subject: 'Rebasing 485 past its conflict #485' })), ['PROSE_CODE']);
});

test('a path containing a hash is not a code, because the store excludes it', () => {
  assert.deepEqual(codes(ok({ body: ok().body + ' See docs/x#1 in the tree.' })), []);
});

test('a block over 420 characters is refused and the message quotes its start', () => {
  const v = violations(ok({ body: 'because ' + 'x'.repeat(500) }));
  assert.deepEqual(v.map((x) => x.code), ['PARAGRAPH_LIMIT']);
  assert.match(v[0].line, /characters, over the 420/);
});

test('a bullet starts a new block, so a long list is not one long paragraph', () => {
  const bullets = Array.from({ length: 6 }, (_, i) => `- line ${i} ${'y'.repeat(100)}`).join('\n');
  assert.deepEqual(codes(ok({ body: 'Because the store splits on bullets too.\n\n' + bullets })), []);
});

test('a body under 40 characters is refused before the reason word is considered', () => {
  const v = violations(ok({ body: 'because short' }));
  assert.deepEqual(v.map((x) => x.code), ['BODY_MINIMUM']);
});

test('a long body with no reason word is refused', () => {
  assert.deepEqual(codes(ok({ body: 'This body is comfortably over the forty character minimum and states nothing.' })), ['REASON_WORD']);
});

test('claims and releases skip both conversation rules but need a surface', () => {
  for (const kind of ['claim', 'release']) {
    assert.deepEqual(codes(ok({ kind, surface: 'Ursa:tools/board', body: 'claiming' })), [], kind);
  }
});

test('notes, asks, handoffs and dones are not exempt', () => {
  for (const kind of ['note', 'ask', 'handoff', 'done']) {
    assert.deepEqual(codes(ok({ kind, body: 'claiming' })), ['BODY_MINIMUM'], kind);
  }
});

test('an unknown kind is named with the list of real ones', () => {
  assert.deepEqual(codes(ok({ kind: 'update' })), ['KIND_UNKNOWN']);
});

test('data.files as a count is refused, because the read side iterates it', () => {
  assert.deepEqual(codes(ok({ data: { files: 3 } })), ['DATA_SHAPE']);
  assert.deepEqual(codes(ok({ data: { files: ['a/b.ts'] } })), []);
});

test('a bare number in data.merged is refused, because numbers repeat across repositories', () => {
  assert.deepEqual(codes(ok({ data: { merged: [260] } })), ['MERGED_BARE_NUMBER']);
  assert.deepEqual(codes(ok({ data: { merged: { Ursa: 260 } } })), []);
  assert.deepEqual(codes(ok({ data: { merged: ['Ursa#260'] } })), []);
});

test('every violation carries a repair, because a refusal without one is a riddle', () => {
  const bad = ok({ kind: 'note', toCompany: 'ursa', subject: '#1', body: 'x', data: { files: 1 } });
  const v = violations(bad);
  assert.ok(v.length >= 4, `expected several violations, got ${v.map((x) => x.code).join(',')}`);
  for (const one of v) assert.ok(one.repair && one.repair.length > 10, one.code);
});

// --- the CLI, which is what a seat actually runs -------------------------

const run = (file, ...args) => {
  const r = spawnSync(process.execPath, [file, ...args], { encoding: 'utf8', env: { ...process.env } });
  return { code: r.status, out: r.stdout, err: r.stderr };
};

test('the checker exits 1 and posts nothing when the company is lowercase', () => {
  const r = run(CHECK, '--kind', 'note', '--to-seat', 'pm', '--to-company', 'ursa',
    '--subject', 'A subject', '--body', 'A body long enough to pass, because it gives a reason.');
  assert.equal(r.code, 1);
  assert.match(r.err, /COMPANY_SPELLING/);
});

test('the checker exits 0 on the capitalised spelling', () => {
  const r = run(CHECK, '--kind', 'note', '--to-seat', 'pm', '--to-company', 'Ursa',
    '--subject', 'A subject', '--body', 'A body long enough to pass, because it gives a reason.');
  assert.equal(r.code, 0);
  assert.match(r.out, /Ursa\/pm would be woken/);
});

test('--body-file is read from disk, since a real message is written in a file', () => {
  const dir = mkdtempSync(join(tmpdir(), 'board-'));
  const f = join(dir, 'msg.md');
  writeFileSync(f, 'A body written in a file, long enough to pass, because that is how a real one arrives.');
  const r = run(CHECK, '--kind', 'note', '--to-company', 'Ursa', '--to-seat', 'pm', '--subject', 'S', '--body-file', f);
  assert.equal(r.code, 0);
});

test('the poster refuses locally and never reaches the network', () => {
  const r = run(POST, '--kind', 'note', '--to-seat', 'pm', '--to-company', 'ursa',
    '--subject', 'A subject', '--body', 'A body long enough to pass, because it gives a reason.');
  assert.equal(r.code, 1);
  assert.match(r.err, /Nothing was posted/);
});

test('--dry-run prints the request and elides the token', () => {
  const r = run(POST, '--dry-run', '--seat', 'engineer', '--kind', 'note', '--to-seat', 'pm', '--to-company', 'Ursa',
    '--subject', 'A subject', '--body', 'A body long enough to pass, because it gives a reason.');
  assert.equal(r.code, 0);
  assert.match(r.out, /Bearer <BOARD_RUNTIME_TOKEN>/);
  assert.doesNotMatch(r.out, new RegExp(process.env.BOARD_RUNTIME_TOKEN || 'no-token-set-in-this-environment'));
});

test('the sender company is checked by the same table as the recipient', () => {
  const r = run(POST, '--dry-run', '--seat', 'engineer', '--company', 'ursa', '--kind', 'note', '--to-company', 'Ursa',
    '--to-seat', 'pm', '--subject', 'A subject', '--body', 'A body long enough to pass, because it gives a reason.');
  assert.equal(r.code, 1);
  assert.match(r.err, /SENDER_COMPANY_SPELLING/);
});

// The sender half, through the CLI, because `--seat` became required on
// 2026-10-27 and the two cases above had to grow it. A test that only
// asserted the old pass would have been quietly satisfied by the default that
// was the defect.
test('the poster refuses an unnamed sender rather than defaulting it to a seat name', () => {
  const r = run(POST, '--dry-run', '--kind', 'note', '--to-seat', 'pm', '--to-company', 'Ursa',
    '--subject', 'A subject', '--body', 'A body long enough to pass, because it gives a reason.');
  assert.equal(r.code, 1);
  assert.match(r.err, /SENDER_SEAT_UNNAMED/);
  // Nothing of the payload is printed, so a reader cannot mistake the refusal
  // for a dry run that went through.
  assert.doesNotMatch(r.out, /Checked clean/);
});

test('the receipt names the sender, which is the field the old one left out', () => {
  const r = run(POST, '--dry-run', '--seat', 'security', '--kind', 'note', '--to-seat', 'pm',
    '--to-company', 'Ursa', '--subject', 'A subject', '--body', 'A body long enough to pass, because it gives a reason.');
  assert.equal(r.code, 0);
  assert.match(r.out, /would say it came from Ursa\/security/);
});

// --- transcribed: the constants against the store they came from ---------

const store = existsSync(STORE) ? readFileSync(STORE, 'utf8') : null;
const src = readFileSync(CHECK, 'utf8');

test('transcribed: MAX_PARAGRAPH is still 420 in the store', { skip: store ? false : `${STORE} not on this machine` }, () => {
  const m = store.match(/^MAX_PARAGRAPH\s*=\s*(\d+)/m);
  assert.ok(m, 'MAX_PARAGRAPH not found in the store');
  assert.equal(Number(m[1]), 420);
  assert.match(src, /const MAX_PARAGRAPH = 420;/);
});

test('transcribed: every reason word the store accepts is accepted here', { skip: store ? false : `${STORE} not on this machine` }, () => {
  const m = store.match(/^REASON_RE\s*=\s*re\.compile\(r"\\b\(([^)]*)\)\\b"/m);
  assert.ok(m, 'REASON_RE not found in the store');
  for (const word of m[1].split('|')) {
    const body = `This body is comfortably over the forty character minimum and says ${word} here.`;
    assert.deepEqual(codes(ok({ body })), [], `the store accepts ${JSON.stringify(word)} and this did not`);
  }
});

test('transcribed: the committed company table matches the running board', { skip: existsSync('/srv/asc/hq/runtime/board/api.py') ? false : 'host runtime not on this machine' }, () => {
  const live = companiesFromHost();
  assert.ok(Array.isArray(live) && live.length > 0, 'could not read REPOS from the host');
  const table = JSON.parse(readFileSync(new URL('./companies.json', import.meta.url), 'utf8'));
  assert.deepEqual([...Object.keys(table.companies)].sort(), [...live].sort());
});

test('transcribed: the kinds the store conversation-checks are the kinds checked here', { skip: store ? false : `${STORE} not on this machine` }, () => {
  // The call site, not the docstring: store.py gates on a positive list, and a
  // docstring can drift from the line beneath it without anything noticing.
  const m = store.match(/kind in \(([^)]*)\) and from_seat != "owner":\n\s*bad = conversation_violation/);
  assert.ok(m, 'the conversation_violation call site was not found in the store');
  const live = [...m[1].matchAll(/"([a-z]+)"/g)].map((x) => x[1]).sort();
  assert.deepEqual(live, ['ask', 'done', 'handoff', 'note']);
  for (const kind of live) {
    assert.deepEqual(codes(ok({ kind, body: 'too short' })), ['BODY_MINIMUM'], kind);
  }
  for (const kind of ['claim', 'release']) {
    assert.deepEqual(codes(ok({ kind, surface: 'Ursa:tools/board', body: 'too short' })), [], kind);
  }
});

test('transcribed: the kinds the store accepts are the kinds offered here', { skip: store ? false : `${STORE} not on this machine` }, () => {
  const m = store.match(/^MESSAGE_KINDS\s*=\s*\(([^)]*)\)/m);
  assert.ok(m, 'MESSAGE_KINDS not found in the store');
  const live = [...m[1].matchAll(/"([a-z]+)"/g)].map((x) => x[1]).sort();
  assert.ok(live.length > 0);
  for (const kind of live) assert.ok(!codes(ok({ kind, surface: 'Ursa:x' })).includes('KIND_UNKNOWN'), kind);
  assert.deepEqual(codes(ok({ kind: 'update' })), ['KIND_UNKNOWN']);
});

test('transcribed: a claim or a release with no surface is refused', { skip: store ? false : `${STORE} not on this machine` }, () => {
  assert.match(store, /needs a surface/);
  for (const kind of ['claim', 'release']) {
    assert.deepEqual(codes(ok({ kind, body: 'x' })), ['SURFACE_REQUIRED'], kind);
  }
});

test('an empty subject is refused, because the store refuses it first', () => {
  assert.deepEqual(codes(ok({ subject: '   ' })), ['SUBJECT_EMPTY']);
});
