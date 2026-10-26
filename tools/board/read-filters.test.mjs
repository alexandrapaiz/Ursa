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
import { verdict, casingVerdict, ROUTES } from './read-filters.mjs';

const API = '/srv/asc/hq/runtime/board/api.py';
const STORE = '/srv/asc/hq/runtime/board/store.py';

/** A 200 with a row count and no saturation, which is the measurable case. */
const ok = (count, over = {}) => ({ status: 200, count, saturated: false, error: '', ...over });

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

test('transcribed: the events read validates nothing, which is why company reads INERT', { skip: !existsSync(API) && 'no board source on this host' }, () => {
  const src = readFileSync(API, 'utf8');
  const block = src.slice(src.indexOf('if EVENTS_ROUTE.match(self.path):'));
  const body = block.slice(0, block.indexOf('store.events('));
  // If this ever gains an unknown-parameter check, the INERT verdict becomes
  // a REFUSED one and the handoff this tool's finding produced has landed.
  assert.equal(/no such filter/.test(body), false,
    'the events read now refuses unknown filters; re-run the prober, the INERT finding may be fixed');
});

test('transcribed: store.events takes no company argument, so the filter cannot exist', { skip: !existsSync(STORE) && 'no board source on this host' }, () => {
  const src = readFileSync(STORE, 'utf8');
  const sig = src.match(/^def events\(([^)]*)\)/m);
  assert.ok(sig, 'store.events not found');
  assert.equal(/company/.test(sig[1]), false,
    'store.events now takes a company; the events company filter may be real and the prober should be re-run');
});

test('live: the prober agrees with the board it is a claim about', { skip: !process.env.BOARD_API_URL || !process.env.BOARD_RUNTIME_TOKEN ? 'no live board in this environment' : false }, async () => {
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
  const plain = await get('/api/events?since_hours=2&limit=500');
  const probed = await get('/api/events?since_hours=2&limit=500&company=THIS_COMPANY_DOES_NOT_EXIST');
  assert.equal(probed.status, 200, 'the events read now refuses an unknown filter, which would be the fix');
  assert.ok(plain.body.events.length < 500, 'the 2h events window now saturates; widen nothing, shorten it');
  assert.equal(probed.body.events.length, plain.body.events.length,
    'the events company filter now filters; the INERT finding is fixed and the doc should be updated');
});
