// node --test tools/board/claim-ref.test.mjs
//
// Three kinds of test here, and the split matters because only the first kind
// can fail on a machine with no credentials.
//
//   The pure ones exercise the predicate over hand-built sentences. They are
//   what catches a regression in the rule.
//
//   The ones named "measured:" assert the 2026-11-02 counts this rule was
//   tuned against, over sentences transcribed from the real rows rather than
//   over the rows themselves. The board has no replay and no delete route, so
//   a test that fetched its corpus would report a different number every run
//   and could not be bisected. Transcribing the sentence shapes keeps the
//   finding reproducible and leaves the live number to
//   `tools/board/measure-claims.mjs`.
//
//   The one named "worked case:" is the message that produced the rule.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  unreffedClaims, pathClaims, refsIn, isStateClaim, isRefKey, sentenceAt, KNOWN_ROOTS,
} from './claim-ref.mjs';

const fires = (body, data) => unreffedClaims({ body, data }).map((c) => c.path);

test('a bare path in a state claim fires', () => {
  assert.deepEqual(fires('the gate is tools/doc-model/check.mjs'), ['tools/doc-model/check.mjs']);
  assert.deepEqual(fires('I repaired docs/standards/pm.md'), ['docs/standards/pm.md']);
  assert.deepEqual(fires('tools/board/post.mjs now resolves the seat'), ['tools/board/post.mjs']);
});

test('worked case: the spelled-out separator is the form the triggering note used', () => {
  // Ursa/exo, 2026-11-02: "the gate is tools slash doc-model slash check".
  // A slash-only rule would have missed the one message it exists for.
  assert.deepEqual(fires('the gate is tools slash doc-model slash check'), ['tools/doc-model/check']);
});

test('any of the three ref forms clears every path in the body', () => {
  const body = 'the gate is tools/doc-model/check.mjs and the corpus is tools/doc-model/corpus.mjs';
  assert.equal(fires(body).length, 2, 'unreffed, so both are named');
  assert.deepEqual(fires(`${body}, on ursa-engineer/2026-11-02-message-2`), []);
  assert.deepEqual(fires(`${body}, at 886baf9`), []);
  assert.deepEqual(fires(`${body}, all of it on main`), []);
});

test('a ref in data clears it too, because the store refuses a code in prose', () => {
  // CODE_RE @ store.py:585 matches `#\d{1,6}` and `PR #?\d+`, so the cheapest
  // ref a seat could write is refused at the write path. The data field is
  // where the store's own refusal text sends it.
  assert.deepEqual(fires('the gate is tools/doc-model/check.mjs', { pr: 631 }), []);
  assert.deepEqual(fires('the gate is tools/doc-model/check.mjs', { branch: 'ursa-engineer/x' }), []);
});

test('a qualified ref key counts, which four real rows needed', () => {
  for (const key of ['on_pr', 'epitome_pr', 'sender_repair_pr', 'evidence_pr', 'head', 'ursa_branch']) {
    assert.ok(isRefKey(key), key);
    assert.deepEqual(fires('docs/x.md is repaired', { [key]: 'v' }), [], key);
  }
  // Not a ref, and the near-misses are the point: a key that merely contains
  // the letters is not a ref key.
  for (const key of ['prediction', 'approach', 'prs_total_description', 'files']) {
    assert.ok(!isRefKey(key), key);
  }
});

test('an empty ref value is not a ref', () => {
  assert.equal(fires('docs/x.md is repaired', { pr: '' }).length, 1);
  assert.equal(fires('docs/x.md is repaired', { branch: null }).length, 1);
});

test('measured: a path naming the scope of a change is not a location claim', () => {
  // These thirteen sentence shapes were 13 of the 21 first-pass fires over 500
  // rows and 30 days on 2026-11-02, from six seats, most of them project
  // managers reporting merges. Every one is true, complete, and strands
  // nobody, so refusing them would have made the gate the defect.
  const scoped = [
    'it is merged under Tier B, because it is green and scoped to docs/security and tools/board',
    'I merged my own pull request because its diff was only docs/sprints/pending.md',
    'the only conflict is docs/ideas.md',
    'this is tool code under docs/agents, so it is yours to fix rather than mine',
    'its diff touches only docs/agents files',
    'it touches the same two append-only files, docs/agents/incidents.md and docs/ideas.md',
    'twenty-three are open under alexandria-pm branches, and docs/sprints is current',
  ];
  for (const s of scoped) assert.deepEqual(fires(s), [], s);
});

test('measured: merged and landed name the trunk, so they are refs and not claims', () => {
  // 3 of the 21. A merged file is on main; a reader who goes there finds it.
  assert.deepEqual(fires('no prompts charter has reached main in fourteen days, while prompts/skill-extract.md merged six days ago'), []);
  assert.deepEqual(fires('all three name tools/check-register-anchors.py, which landed with no full-clone guard'), []);
});

test('a request for a file is not a claim about one', () => {
  assert.deepEqual(fires('please write docs/security/redaction-standard.md when you get there'), []);
  assert.deepEqual(fires('put the entry in docs/ideas.md'), []);
});

test('a URL is a location already and needs no ref', () => {
  assert.deepEqual(fires('the standard is at github.com/alexandrapaiz/alexandra-systems'), []);
  assert.deepEqual(fires('see https://example.com/docs/vision.md for it'), []);
});

test('a path whose first segment is no directory this tool knows is not checked', () => {
  // The false-negative bias is deliberate and stated in the module: the
  // failure this rule must not have is refusing a correct message.
  assert.deepEqual(fires('the fix is in nonsuch/elsewhere/thing.mjs'), []);
  assert.ok(KNOWN_ROOTS.includes('tools') && KNOWN_ROOTS.includes('docs'));
  assert.ok(KNOWN_ROOTS.includes('runtime'), 'the board itself, cited by transcription all over this repository');
});

test('one finding per path, however many times it is named', () => {
  assert.deepEqual(fires('tools/x.mjs is new. tools/x.mjs is also tested.'), ['tools/x.mjs']);
});

test('refsIn reports the form it found, because the repair differs by form', () => {
  assert.deepEqual(refsIn('on ursa-engineer/2026-11-02-message-2').map((r) => r.form), ['branch']);
  assert.deepEqual(refsIn('at 886baf9c').map((r) => r.form), ['commit']);
  assert.deepEqual(refsIn('it is on main').map((r) => r.form), ['trunk']);
  assert.deepEqual(refsIn('', { commit: 'abc1234' }).map((r) => r.form), ['data']);
  // A date inside a branch slug is not a commit, which is the one way the two
  // patterns could double-count.
  assert.deepEqual(refsIn('ursa-engineer/2026-11-02-message').map((r) => r.form), ['branch']);
});

test('sentenceAt treats a newline as a boundary, because this board writes one thought per line', () => {
  const body = 'A first thought.\nThe gate is tools/x.mjs\nA third.';
  assert.equal(sentenceAt(body, body.indexOf('tools/x.mjs')), 'The gate is tools/x.mjs');
});

test('isStateClaim is about the verb and the subject, not the path', () => {
  assert.ok(isStateClaim('docs/x.md is repaired'));
  assert.ok(isStateClaim('I added docs/x.md'));
  assert.ok(!isStateClaim('write docs/x.md'));
  assert.ok(!isStateClaim('its diff is only docs/x.md'), 'scope wins over the claim verb');
});

test('pathClaims carries the sentence, so a caller can judge the claim', () => {
  const found = pathClaims('A first line.\nThe gate is tools/board/check.mjs now.');
  assert.equal(found.length, 1);
  assert.match(found[0].sentence, /^The gate is/);
});
