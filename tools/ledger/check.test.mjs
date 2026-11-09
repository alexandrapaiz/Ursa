// node --test tools/ledger/check.test.mjs
// check.mjs is a CLI, so it is tested as one: written fixture in, exit code
// and stderr out.
//
// Exit codes under test, from check.mjs's header: 0 clean, 1 at least one
// violation a seat must repair, 2 only violations the owner must resolve.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { tempDir } from '../testing/tmpdir.mjs';
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
  const dir = tempDir('ledger-check-');
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

test('the violation on a scan note that files a First step names the label as the cause', () => {
  // The regression this is here for, measured on `main` at 2026-10-26. The
  // gate was red on the default branch over exactly this shape: a block
  // headed `Craft scan: tesh 0.3.2 and txm 8.2.0` carrying `- First step: no
  // adoption proposed`, a first-step line that declines to propose work. The
  // seat the red gate was handed to read a bare `missing the "- Cost:" line`
  // and concluded the heading spelling was unrecognised, which it never was.
  // A message that names only one of a rule's two causes is a message that
  // picks the diagnosis for its reader, so the message now names both and
  // says which to look at first.
  const res = run(
    [
      GOOD,
      '### 2026-10-26 (engineer, hook run) — Craft scan: tesh 0.3.2 and txm 8.2.0',
      '- Trigger: this run’s own defect',
      '- What: two tools, both narrow and both older than their problem',
      '- First step: no adoption proposed. Neither tool fits.',
      '',
    ].join('\n'),
  );
  assert.equal(res.code, 1, res.out);
  assert.match(res.out, /missing the "- Cost:" line/);
  assert.match(res.out, /this heading does announce a scan/);
  assert.match(res.out, /carries a "- First step:" line/);
  assert.match(res.out, /say so in prose instead of under that label/);
  // The sentence a reader must not be able to take away from this message,
  // because it is the one the 2026-10-26 run took away from its absence.
  assert.match(res.out, /The spelling of the heading is not the cause\./);
  // Once for the block, not once per missing field. This fixture is missing
  // two, and the real block was too.
  assert.equal(res.out.match(/does announce a scan/g).length, 1, res.out);
});

test('an ordinary idea’s violation carries no scan paragraph, so the explanation stays a signal', () => {
  // The other half of the same change. An explanation printed on every
  // missing field is noise, and noise is what the gate is already fighting:
  // check.mjs's own header says a permanently red gate is read by nobody.
  // The paragraph appears only where `announcesScan` is true.
  const res = run(GOOD.replace('- Cost: $0\n', ''));
  assert.equal(res.code, 1, res.out);
  assert.match(res.out, /missing the "- Cost:" line/);
  assert.doesNotMatch(res.out, /does announce a scan/);
});

test('the real ledger prints no scan-label explanation, because no block needs one', () => {
  // The default branch's own state, asserted rather than described. If a
  // future run appends another declined first step under a scan heading,
  // this goes red with the explanation in its own failure output.
  const res = check(new URL('../../docs/ideas.md', import.meta.url).pathname);
  assert.doesNotMatch(res.out, /does announce a scan/, res.out);
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

// BLOCK_SEPARATION. The drift this rule names is the one that was actually
// live twice in one day: a `### ` heading appended with no blank line above
// it, which `renderLedger` cannot reproduce, so the byte-equality assertion
// in ledger.test.mjs goes red and reports a character count instead of a
// location. The rule turns that into a line number.
test('a heading with no blank line above it fails, by line number', () => {
  const res = run(`${GOOD}### 2026-09-28 — The next idea\n- Trigger: an observation\n- What: one paragraph\n- First step: a day\n- Cost: $0\n- Status: proposed\n`);
  assert.equal(res.code, 1);
  assert.match(res.out, /BLOCK_SEPARATION/);
  assert.match(res.out, /line 9: "### 2026-09-28 — The next idea" opens a block with no blank line above it/);
});

test('a heading with two blank lines above it fails too, in the other direction', () => {
  const res = run(`${GOOD}\n\n### 2026-09-28 — The next idea\n- Trigger: an observation\n- What: one paragraph\n- First step: a day\n- Cost: $0\n- Status: proposed\n`);
  assert.equal(res.code, 1);
  assert.match(res.out, /more than one blank line above it/);
});

test('a dated note bullet is held to the same spacing as a heading', () => {
  // Notes open blocks under the same grammar, so an append that lands one
  // against the line above it drifts identically. Caught here because the
  // rule asks `blockStartKind`, the one `parseLedger` itself asks.
  const res = run(`${GOOD}- 2026-09-28 (engineer): a run note.\n`);
  assert.equal(res.code, 1);
  assert.match(res.out, /BLOCK_SEPARATION.*opens a block with no blank line above it/);
});

test('one blank line above each block is what the rule wants, and passes', () => {
  const res = run(`${GOOD}\n### 2026-09-28 — The next idea\n- Trigger: an observation\n- What: one paragraph\n- First step: a day\n- Cost: $0\n- Status: proposed\n\n- 2026-09-28 (engineer): a run note.\n`);
  assert.equal(res.code, 0, res.out);
});

test('a field label with the wrong separator is reported as a separator, not as an absent field', () => {
  // The twelve entries of 2026-11-02 that kept this gate red for seven days,
  // in miniature. The verdict does not change: the colon is required, because
  // statusOf and a groomer both read the text after it. What changes is that
  // the message now says where the label is, since a reader told "missing the
  // - What: line" about a block whose third line begins "- What," reaches for
  // the wrong repair. See nearMissFieldLine in block-kinds.mjs.
  const res = run([
    '# The Ledger — Ursa',
    '',
    '### 2026-11-09 — An entry whose labels carry a qualifier',
    '- Trigger: an observation',
    '- What, measured across the queue rather than from this one case. Nine rows.',
    '- First step, and it is this seat\'s own file: move the colon.',
    '- Cost: $0',
    '- Status: proposed',
    '',
  ].join('\n'));
  assert.equal(res.code, 1);
  assert.match(res.out, /missing the "- What:" line/);
  assert.match(res.out, /this is a separator and not an absent field/);
  assert.match(res.out, /- What, measured across the queue/);
  assert.match(res.out, /- First step, and it is this seat's own file/);
  assert.match(res.out, /Do not write a second line/);
});

test('a genuinely absent field keeps the plain message and gains no near-miss sentence', () => {
  const res = run([
    '# The Ledger — Ursa',
    '',
    '### 2026-11-09 — An entry with no second field at all',
    '- Trigger: an observation',
    '- First step: a day-sized unit of work',
    '- Cost: $0',
    '- Status: proposed',
    '',
  ].join('\n'));
  assert.equal(res.code, 1);
  assert.match(res.out, /missing the "- What:" line/);
  assert.doesNotMatch(res.out, /this is a separator and not an absent field/);
});

// The empty premise. Added 2026-11-09 by the security seat, from the instance
// Ursa's exo seat found with `tools/gates/empty-premise.mjs`: every rule above
// is quantified over the blocks, so a ledger with none satisfies all of them
// and the gate's strongest verdict came out of its weakest evidence.
test('a zero-byte ledger is a seat-held violation and not a clean verdict', () => {
  const res = run('');
  assert.equal(res.code, 1);
  assert.match(res.out, /EMPTY_LEDGER/);
  assert.match(res.out, /parses to 0 idea blocks/);
  // The sentence that distinguishes this red from a rule failure: the gate is
  // reporting that it checked nothing, not that it found something.
  assert.match(res.out, /"clean" would mean "nothing was checked"/);
  assert.doesNotMatch(res.out, /clean\./);
});

test('a preamble with no entries under it is the same empty premise', () => {
  const res = run('# The Ledger — Ursa\n\nSome prose and no entries.\n');
  assert.equal(res.code, 1);
  assert.match(res.out, /EMPTY_LEDGER/);
});

test('an absent ledger is named rather than thrown, and keeps exit 1', () => {
  // F140: this line made its own temporary directory from `node:fs` and
  // `node:os` until the merge that brought main's leak repair onto this
  // branch. That repair converted the file's one other call site and deleted
  // both imports; this case was added here afterwards, so git kept main's
  // import line and this branch's new test, neither hunk overlapping the
  // other, and the name was unbound at run time on the merge of two trees
  // that were each green.
  //
  // The call form is deliberately not written out above, because
  // `tools/testing/tmpdir-leak.test.mjs` greps the raw text of every test
  // file for it to catch its own comment stripper swallowing one. That guard
  // is right and cannot tell prose from code, so prose here does not spell
  // the call.
  const dir = tempDir('ledger-check-');
  const res = check(join(dir, 'no-such-ledger.md'));
  assert.equal(res.code, 1);
  assert.match(res.out, /LEDGER_ABSENT/);
  assert.match(res.out, /does not exist/);
  // The whole point of the guard: no uncaught stack trace on the way out.
  assert.doesNotMatch(res.out, /ENOENT/);
  assert.doesNotMatch(res.out, /at readFileSync/);
});
