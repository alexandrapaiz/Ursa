// node --test tools/board/read-filters.test.mjs
//
// Two kinds of test, and the split is the same one check.test.mjs makes.
//
// The pure ones exercise `verdict()` and `casingVerdict()` over hand-built
// response pairs. They need no board and they are what catches a regression
// in the rules.
//
// The ones named "live:" and "transcribed:" check this tool against the two
// things it is a claim about: the running board, and the source the running
// board is built from (/srv/asc/hq/runtime/board/api.py). Both skip rather
// than fail when absent, because a laptop and a CI runner have neither. A
// skip there means the claim went unchecked on that run, not that it passed.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { verdict, casingVerdict, saturationOf, ROUTES } from './read-filters.mjs';

const API = '/srv/asc/hq/runtime/board/api.py';
const STORE = '/srv/asc/hq/runtime/board/store.py';

/** A 200 with a row count and no saturation, which is the measurable case. */
const ok = (count, over = {}) => ({ status: 200, count, saturated: false, error: '', ...over });

// SATURATION ON A ROUTE THAT DOES NOT REPORT IT. These pin the repair for
// the defect found on 2026-11-02: `verdict()` abstains when `base.saturated`
// is set, and the events read never sets it, so the abstention was dead code
// on that route and the tool reported a filled page as a count. The board is
// HQ's, so the inference lives here.
test('a route that reports saturation is believed, in both directions', () => {
  assert.equal(saturationOf({ messages: [1, 2], saturated: true, limit: 2 }, 'messages', 2), true);
  // The field wins over the count when it is present, because the board
  // applied a bound this caller may not know: it clamps `limit` to [1, 2000].
  assert.equal(saturationOf({ messages: [1, 2], saturated: false }, 'messages', 2), false);
});

test('a route that omits the field has it inferred from the limit asked for', () => {
  // The events shape, verbatim: a row list and nothing else.
  assert.equal(saturationOf({ events: new Array(500).fill(0) }, 'events', 500), true);
  assert.equal(saturationOf({ events: new Array(489).fill(0) }, 'events', 500), false);
  // `>=` and not `===`, matching the board's own `len(rows) >= applied`, so
  // a page that somehow overshoots still reads as filled rather than as an
  // answer.
  assert.equal(saturationOf({ events: new Array(501).fill(0) }, 'events', 500), true);
});

test('an unknowable limit does not become a claim that the page was fine', () => {
  // The honest reading when there is nothing to compare against is "not
  // measured as saturated", which is what the callers already do with a
  // missing row list. This asserts it does not throw and does not invent.
  assert.equal(saturationOf({ events: [1, 2, 3] }, 'events', null), false);
  assert.equal(saturationOf({ events: [1, 2, 3] }, 'events', Number.NaN), false);
  assert.equal(saturationOf({ error: 'no such filter: company' }, 'events', 500), false);
  assert.equal(saturationOf(undefined, 'events', 500), false);
});

test('the declared windows carry the reading they were chosen against', () => {
  // Not a style check. The events window was two hours from the day it was
  // written until the board outgrew it, and nothing in the file recorded
  // what traffic that was measured against, so there was no way to tell a
  // stale number from a deliberate one. This asserts the window is small
  // enough to have been revisited, without asserting an exact value, since
  // the next seat to re-measure should be free to change it.
  const events = ROUTES.events.window;
  assert.match(events, /^since_hours=/);
  assert.ok(Number(events.split('=')[1]) <= 1,
    `the events probe window is ${events}, and a window this wide saturates a 500-row page on this board`);
});

test('a filter whose impossible value returns fewer rows is honoured', () => {
  assert.equal(verdict(ok(210), ok(35)).verdict, 'HONOURED');
  assert.equal(verdict(ok(210), ok(0)).verdict, 'HONOURED');
});

test('a filter whose impossible value returns the unfiltered count is inert', () => {
  const v = verdict(ok(247), ok(247));
  assert.equal(v.verdict, 'INERT');
  assert.match(v.why, /unfiltered 247 rows/);
});

test('inert is decided on the count alone, so the two reads must be the same window', () => {
  // Guarding the one way this rule can lie: an equal count across DIFFERENT
  // windows says nothing. The caller is responsible for the window, and this
  // asserts the rule does not pretend otherwise by looking at anything else.
  assert.equal(verdict(ok(100), ok(100)).verdict, 'INERT');
  assert.equal(verdict(ok(100), ok(99)).verdict, 'HONOURED');
});

test('"no such filter" is refused, which is the good failure', () => {
  const v = verdict(ok(210), { status: 400, count: null, saturated: false, error: 'no such filter: company; this read honours since_hours, ...' });
  assert.equal(v.verdict, 'REFUSED');
});

test('any other 4xx on the probe is also refused, and carries the reason', () => {
  const v = verdict(ok(210), { status: 404, count: null, saturated: false, error: "no company named 'nope' on the board" });
  assert.equal(v.verdict, 'REFUSED');
  assert.match(v.why, /no company named/);
});

test('a 5xx on the probe is unmeasurable, because a crashed route is not a refusal', () => {
  // The case this file did not have on 2026-11-02, when the live events route
  // answered 500 on every filtered read and the tool printed REFUSED, which
  // this file's own header calls the good failure.
  const v = verdict(ok(210), { status: 500, count: null, saturated: false, error: "events read: a defect in the board's own code" });
  assert.equal(v.verdict, 'UNMEASURABLE');
  assert.match(v.why, /the probe read failed with 500/);
  assert.match(v.why, /nothing about this filter was measured/);
});

test('a 5xx on the baseline is unmeasurable too, and names which read failed', () => {
  const v = verdict({ status: 503, count: null, saturated: false, error: 'upstream down' }, ok(0));
  assert.equal(v.verdict, 'UNMEASURABLE');
  assert.match(v.why, /the baseline read failed with 503/);
});

test('a 4xx is still REFUSED, so the fix for the 5xx case did not widen', () => {
  // The guard on the change above: every refusal verdict this tool published
  // before 2026-11-02 came through a 4xx, and all of them must be unchanged.
  for (const status of [400, 403, 404, 422, 499]) {
    const v = verdict(ok(210), { status, count: null, saturated: false, error: 'nope' });
    assert.equal(v.verdict, 'REFUSED', `${status} must still be REFUSED`);
  }
});

test('two reads with no row list are unmeasurable, not INERT', () => {
  // `null === null` is true, so without the count guard a pair of reads that
  // returned no rows at all compared equal and reported the unfiltered set.
  const v = verdict({ status: 200, count: null, saturated: false, error: '' }, { status: 200, count: null, saturated: false, error: '' });
  assert.equal(v.verdict, 'UNMEASURABLE');
  assert.match(v.why, /no row list/);
});

test('a casing pair with no count is unmeasurable, not a positive finding', () => {
  // `pageAll` returns `count: null` when a slice read fails. `null !== null`
  // is false, so this fell through to the equal-count branches and published
  // CASE-INSENSITIVE (counts only) over two reads that never answered.
  const v = casingVerdict({ count: null, spellings: [] }, { count: null, spellings: [] });
  assert.equal(v.verdict, 'UNMEASURABLE');
  assert.match(v.why, /no count/);
  // And the one-sided case, which is how a single failed slice arrives.
  assert.equal(casingVerdict({ count: 66, spellings: [] }, { count: null, spellings: [] }).verdict, 'UNMEASURABLE');
});

test('a baseline that refuses to answer without the parameter is required, not inert', () => {
  const v = verdict({ status: 400, count: null, saturated: false, error: 'company and seat are both required' }, ok(60));
  assert.equal(v.verdict, 'REQUIRED');
});

test('a saturated baseline is unmeasurable rather than a verdict', () => {
  // §15: "a saturated page is not an answer, and no ratio is published from
  // one." Without this the events probe would read INERT or HONOURED off two
  // counts that are both just the page cap.
  const v = verdict(ok(500, { saturated: true }), ok(500));
  assert.equal(v.verdict, 'UNMEASURABLE');
  assert.match(v.why, /page filled/);
});

test('a saturated baseline outranks an equal count, so saturation cannot be read as inert', () => {
  assert.equal(verdict(ok(500, { saturated: true }), ok(500, { saturated: true })).verdict, 'UNMEASURABLE');
});

test('a failed baseline that is not a required-parameter error is unmeasurable', () => {
  const v = verdict({ status: 503, count: null, saturated: false, error: 'the store is unreachable' }, ok(10));
  assert.equal(v.verdict, 'UNMEASURABLE');
});

test('different counts across casings is case-exact', () => {
  const v = casingVerdict({ count: 60, spellings: ['Ursa'] }, { count: 0, spellings: [] });
  assert.equal(v.verdict, 'CASE-EXACT');
});

test('equal counts over rows stored under both casings is the strong case-insensitive form', () => {
  const v = casingVerdict({ count: 194, spellings: ['Ursa', 'ursa'] }, { count: 194, spellings: ['ursa', 'Ursa'] });
  assert.equal(v.verdict, 'CASE-INSENSITIVE');
  assert.match(v.why, /crossed the casings/);
});

test('equal counts with no counter-example in the window is the weak form, and says so', () => {
  // This is the test that exists because the tool produced exactly this
  // reading on a six-hour window and would have been believed.
  const v = casingVerdict({ count: 39, spellings: ['Ursa'] }, { count: 39, spellings: ['Ursa'] });
  assert.equal(v.verdict, 'CASE-INSENSITIVE (weak)');
  assert.match(v.why, /no counter-example/);
});

test('equal counts on rows that carry no company field is counts-only, not weak', () => {
  const v = casingVerdict({ count: 60, spellings: [] }, { count: 60, spellings: [] });
  assert.equal(v.verdict, 'CASE-INSENSITIVE (counts only)');
  assert.match(v.why, /no company field/);
});

test('the message casing probe names a seat, because a company-only read cannot see an addressed row', () => {
  // The false reading this guards is in the comment beside the spec: the
  // company-only SQL term carries `and to_seat is null`, so a company-only
  // probe measures the broadcasts and reports on the addressed mail.
  assert.match(ROUTES.messages.casing.to_company.with, /to_seat=/);
});

test('every probe value is one that cannot match a real row', () => {
  // `messages.company` is the exception on purpose: it is probed with a real
  // value because the point of that probe is the 400, and an impossible
  // value would get the same 400 for the wrong reason.
  for (const [route, spec] of Object.entries(ROUTES)) {
    for (const [param, value] of Object.entries(spec.probes)) {
      if (route === 'messages' && param === 'company') continue;
      // The event types are dotted (`run.reported`), so the impossible value
      // for `type` is dotted too: a probe has to be the right SHAPE as well
      // as absent, or the route may reject it for its shape and the verdict
      // reads REFUSED when the filter is really inert.
      assert.match(value, /DOES_NOT_EXIST|does[._]not[._]exist/, `${route}.${param} probes with ${value}`);
    }
  }
});

test('transcribed: the message read honours exactly the filters this tool probes', { skip: !existsSync(API) && 'no board source on this host' }, () => {
  const src = readFileSync(API, 'utf8');
  const m = src.match(/MESSAGE_FILTERS = \(([^)]*)\)/s);
  assert.ok(m, 'MESSAGE_FILTERS not found in api.py');
  const honoured = new Set([...m[1].matchAll(/"([a-z_]+)"/g)].map((x) => x[1]));
  // `company` is probed BECAUSE it is absent here, so it must not be present.
  assert.equal(honoured.has('company'), false,
    'api.py now honours a `company` filter on the message read; the probe expecting a 400 is stale');
  for (const p of ['to_company', 'from_company', 'to_seat', 'from_seat', 'kind']) {
    assert.equal(honoured.has(p), true, `${p} is no longer honoured; this tool's probe is stale`);
  }
});

// THESE TWO TRIPWIRES FIRED ON 2026-11-02 AND THIS IS THEM RESOLVED.
// Both asserted the absence of a fix, so that the run which found the fix
// present would be told to re-measure. HQ added it in `becae2c` on
// 2026-10-26, in the commit whose subject names "the inert filter", so the
// handoff this tool's finding produced did land. Each now asserts the new
// state, and the tripwire below asserts the thing that is still wrong.
test('transcribed: the events read refuses unknown filters, so the INERT finding was acted on', { skip: !existsSync(API) && 'no board source on this host' }, () => {
  // READ THIS BEFORE "FIXING" A FAILURE HERE, because the first version of
  // this test failed for the opposite of the reason it claimed. It asserted
  // that the literal string `no such filter` appeared between the route match
  // and `store.events(`, which held only while the route restated the refusal
  // inline. On 2026-11-02 HQ collapsed two copies of that sentence into one
  // helper, `Handler.refuse_unknown`, because their own
  // `test_one_implementation` had gone red on the duplication. The behaviour
  // was intact and strictly better; the string had simply moved out of the
  // slice. This test then reported "the INERT finding has regressed", which
  // was false, and a reader who believed it would have re-opened a finding
  // HQ had just hardened. A transcription of someone else's source has to
  // follow a refactor by one hop or it measures the spelling instead of the
  // rule, so this version checks the call and the sentence separately and
  // says which half broke.
  const src = readFileSync(API, 'utf8');
  const start = src.indexOf('if EVENTS_ROUTE.match(self.path):');
  assert.notEqual(start, -1, 'the events route is no longer matched this way; re-read api.py');
  const block = src.slice(start);
  const end = block.indexOf('store.events(');
  // Bounded explicitly: `slice(0, -1)` on a missing marker is the whole rest
  // of the file, which contains the message route's own refusal and would
  // make this assertion pass on text from a different handler.
  assert.notEqual(end, -1, 'store.events( no longer follows the events route; this slice would read the rest of the file');
  const route = block.slice(0, end);
  // The behaviour under both spellings was probed rather than inferred, on
  // 2026-11-02 and by the trunk's own version of this test: `GET
  // /api/events?nosuchfilter=1` against the live board answers 400 with `no
  // such filter: nosuchfilter` and a `honours` array, while an impossible
  // `company` returns 0 rows against 5 unfiltered. The route refuses, and it
  // always did. The halves below are what distinguishes that refusal moving
  // from that refusal going away.
  // Half one: the route refuses, before it reads. Either spelling counts --
  // the shared helper as it stands today, or an inline sentence as it stood
  // before -- because the claim is about the refusal and not about where the
  // code for it lives.
  const callsHelper = /refuse_unknown\(\s*self\.EVENT_FILTERS\s*\)/.test(route);
  const inlineSentence = /no such filter/.test(route);
  assert.equal(callsHelper || inlineSentence, true,
    'the events route no longer refuses unknown filters before reading: it neither calls '
    + 'refuse_unknown(self.EVENT_FILTERS) nor states "no such filter" inline. THIS is the '
    + 'regression of the INERT finding, and the prober should be re-run.');
  // Half two: whatever it calls still answers 400 with the sentence a caller
  // has learned. Only checked on the helper arm, since the inline arm just
  // proved the sentence is present.
  if (callsHelper) {
    const def = src.indexOf('def refuse_unknown(');
    assert.notEqual(def, -1,
      'the events route calls refuse_unknown and api.py does not define it; re-read api.py');
    const body = src.slice(def, src.indexOf('\n    def ', def + 1));
    assert.equal(/no such filter/.test(body), true,
      'refuse_unknown no longer answers with "no such filter"; the refusal a caller has '
      + 'learned since 2026-10-18 has changed wording, so the prober\'s expectation needs '
      + 're-reading rather than the route.');
    assert.equal(/self\.reply\(400/.test(body), true,
      'refuse_unknown no longer replies 400; an unknown filter may now be answered rather '
      + 'than refused, which is the INERT shape returning by a different door.');
  }
});

test('transcribed: store.events takes a company, so the events company filter is real', { skip: !existsSync(STORE) && 'no board source on this host' }, () => {
  const src = readFileSync(STORE, 'utf8');
  const sig = src.match(/^def events\(([^)]*)\)/m);
  assert.ok(sig, 'store.events not found');
  assert.equal(/company/.test(sig[1]), true,
    'store.events no longer takes a company; the events company filter may be inert again');
});

test('transcribed: the events filter list is reachable from where it is read', { skip: !existsSync(API) && 'no board source on this host' }, (t) => {
  // THE DEFECT THIS RUN FOUND, as a tripwire that goes green when HQ fixes it.
  // `EVENT_FILTERS` is assigned at column 0, above `class Handler`, and read
  // inside the handler as `self.EVENT_FILTERS`. A module-level name is not an
  // attribute of the instance, so the read raises AttributeError and every
  // filtered events read answers 500. The route survives only the request
  // with no query string at all, because the comprehension that reads the
  // name never runs when the parsed query is empty.
  const src = readFileSync(API, 'utf8');
  const lines = src.split('\n');
  const assigned = lines.findIndex((l) => /^EVENT_FILTERS\s*=/.test(l));
  if (assigned === -1) return; // moved into the class, or renamed: nothing to check here.
  const classAt = lines.findIndex((l) => /^class Handler\b/.test(l));
  assert.notEqual(classAt, -1, 'class Handler not found; re-read api.py');
  const readsViaSelf = src.includes('self.EVENT_FILTERS');
  // REPORTED AND SKIPPED RATHER THAN FAILED, on purpose. This file is HQ's
  // and Ursa cannot edit it, so a failing assertion here would hold this
  // suite red for a defect no run of this repository can clear, and every
  // run reports its suite as a verification baseline. The header's rule for
  // the transcribed tests already says a skip means the claim went unchecked
  // rather than that it passed. The finding travels by the three instruments
  // that can carry it: the prober now prints UNMEASURABLE instead of
  // REFUSED, docs/security/audit-2026-11-02.md records it, and the security
  // seat handed it to HQ on the board. This test's job is to go GREEN the
  // day HQ repairs it, which is how Ursa learns to re-measure.
  if (readsViaSelf && assigned < classAt) {
    t.diagnostic(`api.py assigns EVENT_FILTERS at module level (line ${assigned + 1}, before class Handler `
      + `at line ${classAt + 1}) and reads it as self.EVENT_FILTERS, so every filtered /api/events read `
      + `answers 500 with AttributeError. HQ's file, not Ursa's. See docs/security/audit-2026-11-02.md.`);
    return t.skip('the upstream defect this tripwire watches is still present; reported, not Ursa\'s to fix');
  }
  assert.ok(true, 'EVENT_FILTERS is reachable from its read site');
});

test('live: the prober agrees with the board it is a claim about', { skip: !process.env.BOARD_API_URL || !process.env.BOARD_RUNTIME_TOKEN ? 'no live board in this environment' : false }, async (t) => {
  const base = process.env.BOARD_API_URL.replace(/\/$/, '');
  const h = { Authorization: `Bearer ${process.env.BOARD_RUNTIME_TOKEN}` };
  const get = async (p) => {
    const r = await fetch(base + p, { headers: h });
    return { status: r.status, body: await r.json().catch(() => ({})) };
  };
  const refused = await get('/api/messages?company=Ursa&limit=1');
  assert.equal(refused.status, 400, 'the message read no longer refuses `company`');
  assert.match(refused.body.error, /no such filter: company/);

  // The inert one, on a window chosen so the unfiltered read does not fill
  // the page. An equal count here is only evidence because of that.
  //
  // THE WINDOW COMES FROM THE TOOL AND IS NOT WRITTEN TWICE. Until
  // 2026-11-02 this test hardcoded `since_hours=2` and so did `ROUTES`, and
  // they drifted the moment one was re-measured: the tool's window was
  // shortened to half an hour because 2h had started filling a 500-row
  // page, and this copy would have gone on asserting against the window
  // that broke. A test that measures a different window than the tool it is
  // a claim about is not checking the tool.
  const WINDOW = ROUTES.events.window;
  const plain = await get(`/api/events?${WINDOW}&limit=500`);
  const probed = await get(`/api/events?${WINDOW}&limit=500&company=THIS_COMPANY_DOES_NOT_EXIST`);

  // A 5XX IS NOT THE FIX, and this assertion said it was. Until 2026-11-02 it
  // read `assert.equal(probed.status, 200, 'the events read now refuses an
  // unknown filter, which would be the fix')`, so when the route began
  // answering 500 from a defect in its own code the suite failed with a
  // message telling the reader the finding had been fixed. Three statuses are
  // distinguishable here and each means something different, so each is named.
  for (const [which, r] of [['unfiltered', plain], ['probed', probed]]) {
    if (r.status >= 500) {
      t.diagnostic(`the events read answers ${r.status} on the ${which} read: ${(r.body.error || '').slice(0, 160)}`);
      return t.skip('the live events route is failing, so this claim went unchecked; it is not a refusal and not the fix');
    }
  }
  if (probed.status === 400) {
    assert.match(probed.body.error || '', /no such filter/,
      'the probed events read answers 400 without naming the filter, which is a refusal the prober cannot explain');
    return; // The fix landed and works. REFUSED is the good failure.
  }
  assert.equal(probed.status, 200, `the probed events read answers ${probed.status}, which this test has no reading for`);
  // RESOLVED AGAINST THE EXO SEAT'S INDEPENDENT FIX OF THE SAME CELL
  // (2026-11-02, run f). The eightieth window repaired this assertion on
  // `main` at 04:07Z while this seat repaired it on its own branch at
  // 03:57Z, and the two repairs agree on the direction: assert the filter
  // WORKS and keep the old reading in the comment, because a test that
  // asserts a defect inverts on repair and its red is indistinguishable in a
  // summary from a regression. That version is kept here because it also
  // carries the empty-window skip below, which the other does not: it
  // asserted `plain.body.events.length > 0`, which FAILS on a quiet board
  // where this one abstains. Two further notes from that branch, kept so the
  // merge does not lose them: the assertion had been red on `main` for as
  // long as the route had been fixed and no check reported it, and Ursa's
  // skill seat reported the same class on the board at 03:43Z the same night,
  // on two other ledger gates, independently and from its own branch.
  if (!Array.isArray(plain.body.events) || !Array.isArray(probed.body.events)) {
    t.diagnostic(`an events read answered 200 with no event list; unfiltered=${typeof plain.body.events}, probed=${typeof probed.body.events}`);
    return t.skip('an events read carried no event list, so there is no count to compare; not a verdict on the filter');
  }
  // A FILLED PAGE IS AN ABSTENTION AND NOT A FAILURE, which is the one line
  // this file got wrong. Until 2026-11-02 this read
  // `assert.ok(plain.body.events.length < 500, 'the 2h events window now
  // saturates; widen nothing, shorten it')`, and it went red on this seat's
  // own 2026-11-02 run when the window returned 500. The instruction in that
  // message was right and the assertion around it was the wrong mechanism
  // for it, for two reasons.
  //
  // It fails on a property of the board's traffic rather than of the code
  // under test, so every seat's suite goes red together on a busy night for
  // a defect none of them introduced, and the fix is to edit a number by
  // hand. And it is the one condition this whole file exists to call
  // UNMEASURABLE: `read-filters.mjs` reports exactly that when the baseline
  // page fills, because a filter that matched everything and a filter that
  // did nothing are indistinguishable once rows are being dropped. The test
  // should not be stricter than the tool's own reading of the same state.
  //
  // So it abstains, and names the number, so a window that has gone stale is
  // still visible in the run's output rather than silently tolerated.
  if (plain.body.events.length >= 500) {
    t.diagnostic(`the ${WINDOW} events window returned ${plain.body.events.length} of 500, so the page filled`);
    return t.skip('the events window saturates, so filtering it cannot be distinguished from not filtering it; shorten ROUTES.events.window');
  }

  // AN EMPTY WINDOW MEASURES NOTHING, and this guard is the fix for a flake
  // this test introduced on 2026-11-02. When the inversion below replaced
  // `assert.equal(probed, plain)` with `assert.notEqual(...)`, it changed
  // which way the zero-zero case falls: the old assertion PASSED on a quiet
  // board, because 0 equals 0, and the new one FAILS on it. That is a false
  // red on a live store whose contents are nobody's to control, and it is
  // the UNMEASURABLE verdict `read-filters.mjs` exists to report rather than
  // guess at: a filter that matched nothing and a filter that did nothing
  // are indistinguishable when there was nothing to match.
  if (plain.body.events.length === 0) {
    return t.skip('the 2h events window is empty, so filtering it cannot be distinguished from not filtering it');
  }

  // THE FINDING CLOSED HERE, 2026-11-02 03:57Z, and this assertion is the
  // inverse of what it was an hour earlier. Until then the events company
  // filter was INERT: an impossible value returned the unfiltered set, so
  // the test asserted the two counts were EQUAL and carried the message
  // "the INERT finding is fixed and the doc should be updated". HQ landed
  // the repair mid-run -- `EVENT_FILTERS` moved inside `class Handler` with
  // a module-level alias kept for `api.EVENT_FILTERS` -- and this test did
  // exactly its job: it went red and said which direction to read it in.
  //
  // So the gate now watches for the REGRESSION rather than for the fix.
  // Equal counts no longer mean "still broken, as documented"; they mean a
  // filter that was repaired has come undone, which is worth failing over.
  // Measured at the turn: 475 rows unfiltered, 129 for Ursa, 0 for a company
  // that cannot exist.
  assert.notEqual(probed.body.events.length, plain.body.events.length,
    'the events company filter is INERT again: an impossible company returned the unfiltered set. '
    + 'This regressed HQ\'s 2026-11-02 repair. Re-run tools/board/read-filters.mjs --route events.');
  assert.equal(probed.body.events.length, 0,
    `an impossible company matched ${probed.body.events.length} events, so the filter runs but does not `
    + 'mean what the prober reads it as; neither HONOURED nor INERT explains this and it needs a human');
});
