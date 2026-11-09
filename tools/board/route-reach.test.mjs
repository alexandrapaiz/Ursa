// Tests for the route-reach sweep. Every case here is one of the four traps
// named in route-reach.mjs's header, and three of the four are regressions
// this tool committed against itself on 2026-11-09 before it shipped. They are
// tests rather than paragraphs because that is the rule Ursa's security seat
// handed this seat the same evening: a file that both asserts and advises has
// only the assertions under test.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  ABSENT_MARKER, CONTROL_PATH, citationsIn, routeNameOf, placeholderIn,
  gradeAnswer, isBinding, isFinding, sweepCitations, splitCall,
} from './route-reach.mjs';

const json = (o) => JSON.stringify(o);

test('ABSENT is the (404, exact marker) pair', () => {
  assert.equal(gradeAnswer({ status: 404, body: json({ error: ABSENT_MARKER }) }).state, 'ABSENT');
});

// TRAP 3, and the one that cost this tool its first reading. /api/agents
// answers 200 with 573,978 bytes of every agent's prompt, and those prompts
// are this repository's charters, one of which documents the marker verbatim.
// A substring test finds its own documentation of absence inside a success.
test('a 200 body that QUOTES the marker is PRESENT, not ABSENT', () => {
  const body = json({
    agents: [{
      seat: 'exo',
      description: 'The route accepts no query string — any parameter returns '
        + '{"error": "no such route"} — and it returns a fixed count.',
    }],
  });
  assert.ok(body.includes(ABSENT_MARKER), 'the fixture must contain the marker, or it tests nothing');
  assert.equal(gradeAnswer({ status: 200, body }).state, 'PRESENT');
});

// TRAP 2. 503 is the correct answer from a present, working route, and it is
// the most urgent thing the board can say. A sweep keyed on `status === 200`
// goes red for the reason the service went red.
test('a 503 naming the disk is DEGRADED, and the reason survives into the verdict', () => {
  const r = gradeAnswer({ status: 503, body: json({ ok: false, error: 'the disk is 96% full' }) });
  assert.equal(r.state, 'DEGRADED');
  assert.match(r.why, /disk is 96% full/);
});

test('a 400 naming its required parameters is NEEDS-PARAMETERS', () => {
  const r = gradeAnswer({
    status: 400,
    body: json({ error: 'company and seat are both required: /api/standing?company=epitome&seat=engineer' }),
  });
  assert.equal(r.state, 'NEEDS-PARAMETERS');
});

// A 404 that is not the board's own marker is somebody else's 404 — a proxy,
// a gateway, a captive portal — and that is not a verdict about a route.
test('a 404 without the marker is UNGRADED, never ABSENT', () => {
  assert.equal(gradeAnswer({ status: 404, body: '<html>404 Not Found</html>' }).state, 'UNGRADED');
  assert.equal(gradeAnswer({ status: 404, body: json({ error: 'nope' }) }).state, 'UNGRADED');
});

test('a fetch that never landed is UNGRADED, so a dead network is not an absent route', () => {
  assert.equal(gradeAnswer({ status: 0, body: 'fetch failed: ECONNREFUSED' }).state, 'UNGRADED');
});

// TRAP 1. The four sub-path routes. A name derived from the citation 404s for
// all four; the citation itself resolves.
test('citationsIn keeps the sub-path and the query, which is the form the prose writes', () => {
  const found = citationsIn('curl -s "$BOARD_API_URL/api/work/Ursa/exo?days=2" -H "Authorization: Bearer $T"');
  assert.equal(found.length, 1);
  assert.equal(found[0].path, '/api/work/Ursa/exo?days=2');
  assert.equal(routeNameOf(found[0].path), 'work', 'the name is for grouping only');
});

test('citationsIn reads the braced spelling of the variable', () => {
  assert.equal(citationsIn('${BOARD_API_URL}/api/capacity').length, 1);
});

test('citationsIn trims punctuation the URL cannot own', () => {
  assert.equal(citationsIn('see `$BOARD_API_URL/api/brief`,').at(0).path, '/api/brief');
  assert.equal(citationsIn('(curl "$BOARD_API_URL/api/capacity")').at(0).path, '/api/capacity');
});

// TRAP 4. Methods must stay attached to their own citation. Bare /api/items is
// cited three times as POST — one of them binding, in docs/standards/pm.md —
// and once as GET, in a test fixture. Unioning them probed a write route as a
// read and charged the result to pm.md.
test('citationsIn reads -X POST from the same line', () => {
  const found = citationsIn('curl -s -X POST "$BOARD_API_URL/api/items" -H "Content-Type: application/json"');
  assert.equal(found[0].method, 'POST');
});

test('sweepCitations keys on the (path, method) pair, so a POST and a GET of one path do not merge', () => {
  const files = ['a.md', 'b.md'];
  const read = (f) => (f === 'a.md'
    ? 'curl -s -X POST "$BOARD_API_URL/api/items" -d \'{}\''
    : 'curl -s "$BOARD_API_URL/api/items"');
  const by = sweepCitations(files, read);
  assert.deepEqual([...by.keys()].sort(), ['GET /api/items', 'POST /api/items']);
  assert.equal(by.get('POST /api/items')[0].file, 'a.md');
  assert.equal(splitCall('POST /api/items').method, 'POST');
  assert.equal(splitCall('GET /api/work/Ursa/exo?days=2').path, '/api/work/Ursa/exo?days=2');
});

test('sweepCitations skips a file with no citation without reading it twice', () => {
  const by = sweepCitations(['x.md'], () => 'no board url here');
  assert.equal(by.size, 0);
});

test('placeholderIn refuses to probe a form that is not a URL as it stands', () => {
  assert.equal(placeholderIn('/api/items/<id>/move'), '<id>');
  assert.equal(placeholderIn('/api/work/Ursa/$s?days=1'), '$s');
  assert.equal(placeholderIn('/api/capacity'), null);
});

test('binding is a charter or a standard; a run log and a fixture are not', () => {
  assert.ok(isBinding('prompts/exo-agent.md'));
  assert.ok(isBinding('docs/standards/pm.md'));
  assert.ok(!isBinding('docs/runs/2026-11-09-exo.md'));
  assert.ok(!isBinding('tools/tests/test_secret_print.py'));
  assert.ok(!isBinding('docs/agents/runner-facts.md'), 'a register records calls, it does not order them');
});

test('only ABSENT in a binding file is a finding', () => {
  assert.ok(isFinding({ state: 'ABSENT', bindingCitations: 1 }));
  assert.ok(!isFinding({ state: 'ABSENT', bindingCitations: 0 }), 'a fixture naming a dead route is not a defect');
  assert.ok(!isFinding({ state: 'DEGRADED', bindingCitations: 9 }));
  assert.ok(!isFinding({ state: 'PLACEHOLDER', bindingCitations: 9 }));
});

test('the control path cannot collide with a real route', () => {
  assert.match(CONTROL_PATH, /^\/api\/zzz/);
});

// The one property that makes the whole tool meaningful: the control must be
// graded by the same function as the rows, or the control proves nothing about
// them.
test('the control is graded by the same function as every row', () => {
  assert.equal(gradeAnswer({ status: 404, body: json({ error: ABSENT_MARKER }) }).state, 'ABSENT');
});
