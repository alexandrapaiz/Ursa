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
import { violations, notices, companiesFromHost, isGlobalSeat, wakeCut, wakeReceipt, WAKE_BODY_CHARS } from './check.mjs';

const CHECK = new URL('./check.mjs', import.meta.url).pathname;
const POST = new URL('./post.mjs', import.meta.url).pathname;
const STORE = '/srv/asc/hq/runtime/board/store.py';
const API = '/srv/asc/hq/runtime/board/api.py';

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
  assert.deepEqual(codes(ok({ data: { merged: [260] } })), ['QUANTITY_UNSCOPED']);
  assert.deepEqual(codes(ok({ data: { merged: { Ursa: 260 } } })), []);
  assert.deepEqual(codes(ok({ data: { merged: ['Ursa#260'] } })), []);
});

// --- the three addressees whose company field the board discards -----------
//
// These are the rule's point and not an edge of it: the gate used to refuse a
// correctly addressed message to the owner, and the alternative a sender took
// was to pass a company the board then threw away.

test('the owner and the chairs need no company, because the board discards it for them', () => {
  for (const seat of ['owner', 'chair', 'chair:ursa', 'chair:hq-console', 'Owner', ' CHAIR ']) {
    assert.deepEqual(codes(ok({ toSeat: seat, toCompany: '' })), [], seat);
  }
});

test('a role several companies hold still needs one, so the exemption is not a hole', () => {
  for (const seat of ['pm', 'exo', 'engineer', 'security', 'chairman', 'co-chair']) {
    assert.deepEqual(codes(ok({ toSeat: seat, toCompany: '' })), ['COMPANY_OMITTED'], seat);
  }
});

test('a company passed beside a global seat is not refused either, because the board accepts and drops it', () => {
  assert.deepEqual(codes(ok({ toSeat: 'owner', toCompany: 'Ursa' })), []);
  // But a misspelled one is still refused, since that spelling is wrong
  // everywhere it appears and the sender should stop writing it.
  assert.deepEqual(codes(ok({ toSeat: 'owner', toCompany: 'ursa' })), ['COMPANY_SPELLING']);
});

test('the clean line says the company was discarded rather than naming a company', () => {
  const r = run(CHECK, '--kind', 'note', '--to-seat', 'owner',
    '--subject', 'A subject', '--body', 'A body long enough to pass, because it gives a reason.');
  assert.equal(r.code, 0);
  assert.match(r.out, /one actor in the portfolio/);
});

// --- a quantity's denominator ---------------------------------------------

test('an unscoped cross-company quantity is refused whatever key it is under', () => {
  for (const key of ['merged', 'merges', 'merged_total', 'prs', 'pull_requests', 'open_issues',
                     'commits', 'drafts', 'queue_depth', 'runs', 'incidents', 'mergedCount']) {
    assert.deepEqual(codes(ok({ data: { [key]: 3 } })), ['QUANTITY_UNSCOPED'], key);
  }
});

test('a key that names its own scope passes, in either half of the vocabulary', () => {
  for (const key of ['ursa_merged', 'merged_ursa', 'portfolio_merges', 'by_company_merges',
                     'per_repo_prs', 'alexandra-systems_merged', 'atelier-app_commits', 'global_runs']) {
    assert.deepEqual(codes(ok({ data: { [key]: 3 } })), [], key);
  }
});

test('a scope word is matched as a word, so reported_merges is not read as scoped', () => {
  // `repo` is a substring of `reported` and `asc` of `ascending`. Both read as
  // scoped under a substring match, which is what the first draft of this rule
  // did and what this test exists to keep repaired.
  assert.deepEqual(codes(ok({ data: { reported_merges: 3 } })), ['QUANTITY_UNSCOPED']);
  assert.deepEqual(codes(ok({ data: { ascending_merges: 3 } })), ['QUANTITY_UNSCOPED']);
});

test('a quantity whose denominator is the run, not a repository, is left alone', () => {
  for (const key of ['turns', 'characters', 'exit', 'minutes', 'tokens', 'seconds', 'lines']) {
    assert.deepEqual(codes(ok({ data: { [key]: 1511 } })), [], key);
  }
});

test('the value can carry the scope instead of the key', () => {
  assert.deepEqual(codes(ok({ data: { merges: { Ursa: 3, epitome: 1 } } })), []);
  assert.deepEqual(codes(ok({ data: { merges: ['Ursa#260', 'epitome#201'] } })), []);
  assert.deepEqual(codes(ok({ data: { pr_url: 'https://github.com/alexandrapaiz/Ursa/pull/260' } })), []);
});

test('the reported shape is caught: a scoped key beside an unscoped one', () => {
  // Ursa/exo, 2026-11-02: the prefixed key read correctly and the unprefixed
  // one was read at headquarters as that company's own figure.
  const v = violations(ok({ data: { ursa_merged: 3, merged_total: 40 } }));
  assert.deepEqual(v.map((x) => x.code), ['QUANTITY_UNSCOPED']);
  assert.match(v[0].line, /data\.merged_total/);
});

// --- what the wake will carry, predicted before the POST -------------------

// Blocks of 300 characters, not one block of 1800: a single long paragraph is
// refused by PARAGRAPH_LIMIT at 420 before the wake rule is ever reached, so a
// fixture written that way would test the wrong gate. The two limits are set
// independently on the host and this is where that shows.
const LONG_BODY = ['because the two limits are independent', ...Array.from({ length: 6 }, () => 'word '.repeat(60).trim())].join('\n\n');


test('a body inside the limit is delivered whole and raises nothing', () => {
  const r = wakeReceipt('because ' + 'x'.repeat(100));
  assert.equal(r.body_truncated, false);
  assert.equal(r.body_delivered, r.body_chars);
  assert.equal(r.body_lost, 0);
  assert.deepEqual(notices(ok()), []);
});

test('eleven characters over the limit can cost a whole block, which is why this is predicted', () => {
  // The reported case: 1511 characters delivered as 1170. Reconstructed to
  // that shape rather than quoted, because the body itself was a message.
  const block = (n) => 'w'.repeat(n);
  const body = [block(380), block(380), block(400), block(338)].join('\n\n');
  assert.equal(body.length, 1504);
  const r = wakeReceipt(body);
  assert.equal(r.body_truncated, true);
  assert.equal(r.body_delivered, 1164);           // the first three blocks
  assert.equal(r.body_lost, 340);                 // four over the limit, 340 lost
  assert.ok(r.body_lost > body.length - WAKE_BODY_CHARS);
});

test('a handoff and an ask over the limit are refused; a note is told and sent', () => {
  for (const kind of ['ask', 'handoff']) {
    const v = violations(ok({ kind, body: LONG_BODY }));
    assert.deepEqual(v.map((x) => x.code), ['WAKE_TRUNCATION'], kind);
    assert.match(v[0].repair, /--accept-truncation/);
    assert.deepEqual(notices(ok({ kind, body: LONG_BODY })), [], `${kind} is refused, so it is not also noticed`);
  }
  for (const kind of ['note', 'done']) {
    assert.deepEqual(codes(ok({ kind, body: LONG_BODY })), [], kind);
    // Two notices since 2026-11-02: the quantity of loss, then which side of
    // the cut the disposition landed on. LONG_BODY is generated filler with no
    // disposition phrase in it, so the second one is the UNKNOWN verdict, and
    // asserting that here is what proves the three-way split is not collapsing
    // to "at risk" for every body that happens to be long.
    assert.deepEqual(notices(ok({ kind, body: LONG_BODY })).map((n) => n.code),
      ['WAKE_TRUNCATION_PREDICTED', 'WAKE_DISPOSITION_UNKNOWN'], kind);
  }
});

test('the other two arms of the disposition split, which no test named before today', () => {
  // `tools/gates/code-census.mjs`, written 2026-11-09, measured that
  // `WAKE_DISPOSITION_LOST` and `WAKE_DISPOSITION_SAFE` were named by no test
  // file in tools/ or scripts/, while their sibling `WAKE_DISPOSITION_UNKNOWN`
  // was asserted directly above. So the three-way split had one arm checked
  // and the other two detected on every run and decided by nothing. The
  // sibling's own test says asserting UNKNOWN "proves the three-way split is
  // not collapsing", and with two arms unasserted it could not have.
  const filler = (n) => 'w'.repeat(n);
  const verdict = 'So I merged it and the queue is clear.';

  // LOST: the disposition sentence falls past the cut, so the recipient is
  // woken with the evidence and none of the verdict.
  const lost = ok({ body: `${filler(1400)}\n\n${verdict}${filler(400)}` });
  assert.ok(wakeReceipt(lost.body).body_truncated);
  assert.deepEqual(notices(lost).map((n) => n.code),
    ['WAKE_TRUNCATION_PREDICTED', 'WAKE_DISPOSITION_LOST']);
  assert.match(notices(lost)[1].line, /none of the verdict/);
  assert.match(notices(lost)[1].repair, /move the disposition above the cut/);

  // SAFE: the same loss, with the verdict first. Nothing to repair, and the
  // sender is told so rather than asked to rewrite a message already right.
  const safe = ok({ body: `${verdict}\n\n${filler(1400)}\n\nMore evidence follows and none of it changes the verdict above.${filler(200)}` });
  assert.ok(wakeReceipt(safe.body).body_truncated);
  assert.deepEqual(notices(safe).map((n) => n.code),
    ['WAKE_TRUNCATION_PREDICTED', 'WAKE_DISPOSITION_SAFE']);
  assert.match(notices(safe)[1].repair, /nothing to do/);

  // And all three arms are reachable, so the split is a split.
  assert.deepEqual(
    [lost, safe, ok({ body: LONG_BODY })].map((m) => notices(m)[1].code),
    ['WAKE_DISPOSITION_LOST', 'WAKE_DISPOSITION_SAFE', 'WAKE_DISPOSITION_UNKNOWN'],
  );
});

test('a body that states a path is in some state and names no ref is refused', () => {
  // `PATH_WITHOUT_REF` has been in `violations()` since 2026-11-02 and was
  // named by no test until the code census found it on 2026-11-09. It is the
  // rule standing between this board and Ursa incident 9, in which four seats
  // in one week read an unmerged thing against `main` and concluded it did not
  // exist, so a silent regression in it is expensive and was undetectable.
  const bare = ok({ body: 'tools/doc-model/check.mjs is green now, which it was not this morning.\n\nI am writing this down because the failure is silent on both sides.' });
  assert.deepEqual(codes(bare), ['PATH_WITHOUT_REF']);
  assert.match(violations(bare)[0].line, /equally true of a working tree, of a branch and of the trunk/);
  assert.match(violations(bare)[0].repair, /name where it is readable/);

  // Named on main, so the sentence is readable from somewhere: no finding.
  assert.deepEqual(codes(ok({ body: 'tools/doc-model/check.mjs is green on main now, which it was not this morning.\n\nI am writing this down because the failure is silent on both sides.' })), []);
});

test('--accept-truncation turns the refusal into the same prediction as a note', () => {
  const m = ok({ kind: 'handoff', body: LONG_BODY, acceptTruncation: true });
  assert.deepEqual(codes(m), []);
  assert.deepEqual(notices(m).map((n) => n.code),
    ['WAKE_TRUNCATION_PREDICTED', 'WAKE_DISPOSITION_UNKNOWN']);
});

test('the prediction is printed by both the checker and the poster, before anything is sent', () => {
  for (const [file, extra] of [[CHECK, []], [POST, ['--dry-run', '--seat', 'engineer']]]) {
    const r = run(file, ...extra, '--kind', 'note', '--to-seat', 'pm', '--to-company', 'Ursa',
      '--subject', 'A subject', '--body', LONG_BODY);
    assert.equal(r.code, 0, `${file}: ${r.err}`);
    assert.match(r.err, /WAKE_TRUNCATION_PREDICTED/, file);
    assert.match(r.err, new RegExp(`of ${LONG_BODY.length} characters`), file);
  }
});

test('--wake-limit lets a sender check against a host that raised it', () => {
  assert.equal(wakeReceipt(LONG_BODY, 4000).body_truncated, false);
  assert.deepEqual(notices({ kind: 'note', body: LONG_BODY, wakeLimit: 4000 }), []);
  const r = run(CHECK, '--kind', 'note', '--to-seat', 'pm', '--to-company', 'Ursa',
    '--subject', 'A subject', '--body', LONG_BODY, '--wake-limit', '4000');
  assert.equal(r.code, 0);
  assert.doesNotMatch(r.err, /WAKE_TRUNCATION_PREDICTED/);
});

test('isGlobalSeat is the predicate and not a list, so a fourth global seat needs no edit here', () => {
  assert.equal(isGlobalSeat('owner'), true);
  assert.equal(isGlobalSeat('chair:anything-at-all'), true);
  assert.equal(isGlobalSeat('chairperson'), false);
  assert.equal(isGlobalSeat(''), false);
  assert.equal(isGlobalSeat(undefined), false);
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

test('transcribed: the committed company table matches the running board', { skip: existsSync(API) ? false : 'host runtime not on this machine' }, () => {
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

test('transcribed: the wake limit is still 1500 in the live runtime', { skip: existsSync(API) ? false : `${API} not on this machine` }, () => {
  const api = readFileSync(API, 'utf8');
  const m = api.match(/^WAKE_BODY_CHARS\s*=\s*int\(os\.environ\.get\("WAKE_BODY_CHARS",\s*"(\d+)"\)\)/m);
  assert.ok(m, 'WAKE_BODY_CHARS not found in the runtime');
  assert.equal(Number(m[1]), 1500);
  // Read from the environment under the same name on both sides, so this is
  // the default and not the live value when the host sets one.
  assert.match(readFileSync(CHECK, 'utf8'), /process\.env\.WAKE_BODY_CHARS \|\| 1500/);
});

// The one test here that is not a transcription check but a differential one:
// the same bodies through `wakeCut` and through the host's own `wake_body`,
// compared character for character. A constant can be checked by matching a
// literal; a four-branch algorithm cannot, and the branch this seat got wrong
// in its first reading of the report (a body whose last blank line falls in
// the first 60% of the limit is cut mid-block at a word boundary, not at a
// block boundary) is exactly the kind a literal match would have missed.
test('transcribed: wakeCut agrees with the host wake_body on every branch', { skip: existsSync(API) ? false : `${API} not on this machine` }, () => {
  const bodies = [
    'because ' + ('word '.repeat(60) + '\n\n').repeat(6),   // blank line late: block boundary
    'x'.repeat(3000),                                        // no boundary at all: hard cut at the limit
    'short intro\n\n' + 'y'.repeat(3000),                   // blank line early: the branch the report missed
    'z'.repeat(1500),                                        // exactly at the limit, untruncated
    'z'.repeat(1501),                                        // one over
    'a'.repeat(1000) + ' ' + 'b'.repeat(2000),               // one space, past 60%: word boundary
    'p '.repeat(200) + '\n\n' + 'q '.repeat(400) + '   \n\n' + 'r '.repeat(400),  // trailing whitespace at the cut
  ];
  const py = spawnSync('python3', ['-c', [
    'import json,sys',
    'sys.path.insert(0, "/srv/asc/hq/runtime/board")',
    'import api',
    'bodies = json.load(sys.stdin)',
    'print(json.dumps([api.wake_body(b, marker="") if len(b) > api.WAKE_BODY_CHARS else b for b in bodies]))',
  ].join('\n')], { input: JSON.stringify(bodies), encoding: 'utf8' });
  assert.equal(py.status, 0, `the host runtime would not import: ${py.stderr}`);
  const theirs = JSON.parse(py.stdout);
  bodies.forEach((body, i) => {
    assert.equal(wakeCut(body), theirs[i], `body ${i} (${body.length} characters) cut differently`);
    assert.equal(wakeReceipt(body).body_delivered, theirs[i].length, `body ${i} delivered length`);
  });
});

test('an empty subject is refused, because the store refuses it first', () => {
  assert.deepEqual(codes(ok({ subject: '   ' })), ['SUBJECT_EMPTY']);
});
