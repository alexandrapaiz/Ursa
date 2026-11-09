import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  CHECKED_PATH, CONTROL, ESCAPE_MARKER, ROUTE,
  classify, denyText, runHook, selftest,
} from './direct-post-hook.mjs';

test('the control grades, which is the only claim this file makes about itself', () => {
  const r = selftest();
  assert.equal(r.failed, 0, `misgraded: ${JSON.stringify(r.rows)}`);
  assert.ok(r.total >= 5);
});

test('a direct curl POST to the route is a bypass', () => {
  const c = classify(`curl -s -X POST "$BOARD_API_URL${ROUTE}" -H 'x: y' -d '{"kind":"note"}'`);
  assert.equal(c.bypass, true);
  assert.equal(c.reason, 'DIRECT_WRITE_TO_THE_BOARD');
});

test('all four of curl\'s body spellings and both method spellings match', () => {
  const forms = [
    `curl "$B${ROUTE}" -d @m.json`,
    `curl "$B${ROUTE}" --data @m.json`,
    `curl "$B${ROUTE}" --data-raw '{}'`,
    `curl "$B${ROUTE}" --data-binary @m.json`,
    `curl -X POST "$B${ROUTE}"`,
    `curl --request POST "$B${ROUTE}"`,
  ];
  for (const f of forms) assert.equal(classify(f).bypass, true, f);
});

// The reason the predicate is keyed on the pair and not on the route. Every
// seat reads this board several times a run; a guard that blocked reads would
// be removed within the hour and would take the write guard with it.
// A short-flag cluster is one keystroke from the form every charter writes.
test('-d inside a clustered short flag is still a write', () => {
  for (const f of [`curl -sd @m.json "$B${ROUTE}"`, `curl -fsSd '{}' "$B${ROUTE}"`]) {
    assert.equal(classify(f).bypass, true, f);
  }
});

test('a read of the same route is not a write, however many parameters it has', () => {
  const reads = [
    `curl -s "$BOARD_API_URL${ROUTE}?to_seat=exo&to_company=Ursa&everyone=0&since_hours=240&limit=500"`,
    `curl -s "$BOARD_API_URL${ROUTE}?zzznosuch=1" -H "Authorization: Bearer $TOK"`,
    `curl -s "$BOARD_API_URL${ROUTE}" | jq -r '.messages[].subject'`,
  ];
  for (const r of reads) {
    const c = classify(r);
    assert.equal(c.bypass, false, r);
    assert.equal(c.reason, 'READ_NOT_WRITE');
  }
});

test('the checked path is never denied, which is the whole point of the router', () => {
  const c = classify(`node ${CHECKED_PATH} --seat exo --kind note --to-seat pm --to-company Ursa --subject s --body-file b.md`);
  assert.equal(c.bypass, false);
  // It is allowed because it does not name the route, not because the path is
  // exempt. There is no exemption: see the note in classify().
  assert.equal(c.reason, 'NOT_THE_BOARD_WRITE_ROUTE');
});

// The live false positive this guard cost its own author, one minute after it
// shipped. A command is a conjunction of calls, and a predicate over its whole
// text is a predicate over all of them at once.
test('a read beside a commit message that merely quotes a write flag is not a write', () => {
  const c = classify(`curl -s "$B${ROUTE}?limit=1" -H 'a: b' `
    + `&& git commit -m 'the long --data form was already covered'`);
  assert.equal(c.bypass, false);
  assert.equal(c.reason, 'READ_NOT_WRITE');
});

test('the write form must sit in the same segment as the route', () => {
  assert.equal(classify(`curl -X POST "$B/api/other" -d @f && curl -s "$B${ROUTE}"`).bypass, false);
  assert.equal(classify(`curl -s "$B${ROUTE}" -X POST -d @f`).bypass, true);
});

test('invoking the poster does not launder a raw write sitting beside it', () => {
  const c = classify(`node ${CHECKED_PATH} --seat exo --kind note --subject s --body b `
    + `&& curl -X POST "$BOARD_API_URL${ROUTE}" -d @m.json`);
  assert.equal(c.bypass, true, 'a compound command is as strong as its weakest call');
});

test('the escape marker releases the command and is recorded as a declaration', () => {
  const c = classify(`curl -X POST "$B${ROUTE}" -d @m.json  # ${ESCAPE_MARKER}: QUANTITY_UNSCOPED is ungraded`);
  assert.equal(c.bypass, false);
  assert.equal(c.reason, 'ESCAPE_DECLARED');
});

test('a command that touches no board route is not this guard\'s business', () => {
  for (const cmd of ['git push -u origin HEAD', 'node --test tools/**/*.test.mjs', '']) {
    assert.equal(classify(cmd).bypass, false);
  }
});

test('the deny sentence names the path, the repair, the measurement and the escape', () => {
  const t = denyText();
  assert.match(t, /tools\/board\/post\.mjs/);
  assert.match(t, new RegExp(ESCAPE_MARKER));
  assert.match(t, /1,803/);
  assert.match(t, /no delete route/);
});

test('the hook denies a bypassing Bash command in the PreToolUse shape', () => {
  const out = runHook(JSON.stringify({
    tool_name: 'Bash',
    tool_input: { command: `curl -X POST "$B${ROUTE}" -d '{"kind":"note"}'` },
  }));
  assert.equal(out.hookSpecificOutput.hookEventName, 'PreToolUse');
  assert.equal(out.hookSpecificOutput.permissionDecision, 'deny');
  assert.match(out.hookSpecificOutput.permissionDecisionReason, /post\.mjs/);
});

test('the hook is silent on anything it has no opinion about', () => {
  for (const payload of [
    { tool_name: 'Bash', tool_input: { command: 'ls' } },
    { tool_name: 'Write', tool_input: { file_path: 'a', content: `curl -X POST ${ROUTE} -d x` } },
    {},
  ]) {
    const out = runHook(JSON.stringify(payload));
    assert.equal(out.hookSpecificOutput.permissionDecision, undefined);
  }
});

// The failure mode this guard chose, asserted rather than described. Failing
// closed on a bug in this file would cost every seat in this repository its
// board access, and the board has no second route.
test('malformed stdin allows the command instead of blocking the session', () => {
  for (const bad of ['', 'not json at all', '{"tool_name":']) {
    const out = runHook(bad);
    assert.equal(out.hookSpecificOutput.permissionDecision, undefined);
  }
});

test('every control row carries its own expectation, so the control cannot drift', () => {
  for (const c of CONTROL) assert.equal(typeof c.want, 'boolean');
  assert.ok(CONTROL.some((c) => c.want === true), 'a control with no positive case proves nothing');
  assert.ok(CONTROL.some((c) => c.want === false), 'a guard stuck on refuse is also broken');
});
