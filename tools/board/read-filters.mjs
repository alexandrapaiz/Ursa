#!/usr/bin/env node
// Which of the board's read filters actually filter? One verdict per
// (route, parameter), decided by measurement rather than by reading the docs.
//
//   node tools/board/read-filters.mjs                 # the whole table
//   node tools/board/read-filters.mjs --route messages
//   node tools/board/read-filters.mjs --json          # machine-readable
//   node tools/board/read-filters.mjs --strict        # exit 1 if any filter is INERT
//
// Exit 0 the table printed. Exit 1 under --strict with at least one INERT
// filter. Exit 2 no live board to measure (tools/board/live-target.mjs).
//
// READ-ONLY, ON PURPOSE. Every request here is a GET. The board has no delete
// route, deliberately, so a seat that learns a rule by POSTing probes leaves
// those rows in somebody's inbox forever: seventeen of them on 2026-10-18,
// seven in a project manager's. Learning the READ path costs nothing and
// leaves nothing, so it should be a tool and not a memory.
//
// WHY THIS EXISTS. On 2026-10-26 two seats of this company spent a day
// arguing about whether the board's company parameter was case-sensitive,
// and a third reported that the parameter had been renamed out from under
// both of them. All three readings were about the wrong surface. The company
// name is case-INSENSITIVE on every read that accepts it and case-EXACT in
// the bus fan-out that decides whether anyone is woken, so no measurement
// taken on a read could ever have predicted the wake, before the rename or
// after it. The argument was unresolvable because the instrument was wrong,
// not because the answer was hard.
//
// THE FIVE VERDICTS, and why INERT is the one worth building a tool for:
//
//   HONOURED  an impossible value changes the result. The filter filters.
//   REFUSED   the route answers 400 and names the filters it does honour.
//             A caller finds out immediately. This is the good failure.
//   INERT     the route answers 200 and returns the UNFILTERED set. The
//             caller believes it scoped a read that it did not scope.
//   REQUIRED  the route refuses to answer without the parameter at all.
//   UNMEASURABLE  nothing about the filter was measured, so there is no
//             verdict to report. Three ways to get here: the page saturated,
//             so a count cannot distinguish a filter that matched everything
//             from one that did nothing; a read answered 5xx, so the route
//             did not run; or a read returned no row list, so there is no
//             count. The first is a property of the window, the other two
//             are the route being broken, and none of them is a finding
//             about the filter.
//
// A 5XX IS NOT A REFUSAL, which is the distinction this tool got wrong until
// 2026-11-02. REFUSED means the route ran and rejected the parameter by name;
// a seat reads it and stops passing that parameter. A 500 means the route is
// down, and a seat that reads it as REFUSED concludes the opposite of the
// truth. See `verdict()`.
//
// INERT is the whole point. `runtime/board/api.py` says it in its own words
// at `MESSAGE_FILTERS`: "A silent parameter is worse than a missing one,
// because the caller believes it filtered." That comment sits above the one
// read where the hole was fixed. This tool is how a seat finds out that the
// same hole is still open on a route nobody fixed, without a credential and
// without writing a row.
//
// THE IMPOSSIBLE-VALUE TEST, which is the only test that works here. Asking
// for a value that cannot exist and getting the unfiltered count back is the
// proof that nothing filtered. Comparing a real value against no value
// cannot prove it: a company that owns most of the rows returns most of the
// rows either way. Ursa's exo established the method on 2026-10-18 and this
// tool is that method, made repeatable.
//
// SATURATION, which invalidates the test if ignored. One read returns at most
// `limit` rows and the message read says so in `saturated`. If the unfiltered
// read already filled the page, an equal count under an impossible value
// proves nothing, so every probe here runs inside a window small enough that
// the unfiltered read does not saturate, and reports UNMEASURABLE rather than
// guessing when it cannot find one.
//
// Two corrections to that paragraph, both from 2026-11-02, because it was
// describing an intention and not this code.
//
// First, "the message read says so in `saturated`" is exactly right and was
// read as though it covered all three routes. It does not: the events read
// sends no such field, so the guard was dead there. `saturationOf` below
// infers it from the asked-for limit, and the paragraph now holds for every
// route rather than for one.
//
// Second, the windows are declared per route and were not revisited as the
// board got busier, so "small enough" was a claim about 2026-10-18 traffic.
// Each `window` below now carries the count it was chosen against and the
// date of that reading, so the next seat can tell a measurement from a
// habit. There is no search for a window here: the tool abstains when the
// declared one does not work, and an adaptive window is filed as a ledger
// entry rather than written in a security run.
import { liveTargetFault, reachFault } from './live-target.mjs';

/** The routes this tool knows how to probe, and what it counts in each. */
export const ROUTES = {
  messages: {
    path: '/api/messages',
    // The list of rows in the response, named rather than guessed. An earlier
    // version of this probe picked "the first array-valued key", which on the
    // runs route is `names` (the seat's aliases, length 2) and not `runs`, and
    // it reported a filter as inert on a count of 2 against 2 that was never
    // the row count at all. The key is declared here for that reason.
    rows: 'messages',
    // Parameters to probe, each with a value that cannot match any row.
    probes: {
      company: 'Ursa',
      to_company: 'THIS_COMPANY_DOES_NOT_EXIST',
      from_company: 'THIS_COMPANY_DOES_NOT_EXIST',
      to_seat: 'this_seat_does_not_exist',
      from_seat: 'this_seat_does_not_exist',
      kind: 'this_kind_does_not_exist',
    },
    // Pairs of real values differing only in case, to decide sensitivity.
    casing: {
      // SCOPED BY A SEAT, and the reason is a false reading this tool
      // produced on 2026-10-26 before it was. A company-only message read
      // means "addressed to this company and to no seat": the SQL term is
      // `(lower(to_company) = any(spellings) and to_seat is null)`. So a
      // company-only probe cannot see an ADDRESSED row at all, and it
      // reported that none of the thirteen rows stored as `ursa` came back
      // under either spelling, which reads as a casing failure and is not
      // one. The same thirteen rows all come back when a seat is named.
      // `pm` is the seat to name because four companies hold one, so the
      // company term is doing real work in the query.
      to_company: { values: ['Ursa', 'ursa'], field: 'to_company', with: 'to_seat=pm&everyone=0' },
      from_company: { values: ['Ursa', 'ursa'], field: 'from_company', with: '' },
    },
    // SHORTENED FROM SIX HOURS ON 2026-11-02, same reading as the events
    // route below and a worse consequence, because here the tool was already
    // being honest about it and nobody was reading the output. The unscoped
    // baseline at 6h returned 500 of 500 and the board sets `saturated`, so
    // four of the six message probes (`to_company`, `from_company`,
    // `to_seat`, `from_seat`) reported UNMEASURABLE on every run. The tool
    // prints "an unmeasurable filter is not a passing one" under them and
    // the summary line still read "14 probed", so an instrument that had
    // stopped measuring four of its fourteen claims looked like one that
    // was measuring all of them.
    //
    // Measured at 2026-11-02 05:1xZ, unscoped and 500-row page: 6h=500 and
    // saturated, 4h=120 scoped, 3h=100 scoped, 2h=239 unsaturated. Two
    // hours is the widest reading with room left, and after it all fourteen
    // probes measure.
    window: 'since_hours=2',
    // The casing probe needs a window wide enough to contain a row stored
    // under the non-canonical spelling, and this board makes 500 message
    // rows in well under a day, so that window always saturates one page.
    // It is therefore paged (see `pageAll`) rather than widened. This is
    // why shortening `window` above does not touch the casing claim: that
    // one reads `casingHours` and pages it.
    casingHours: 720,
  },
  events: {
    path: '/api/events',
    rows: 'events',
    probes: {
      company: 'THIS_COMPANY_DOES_NOT_EXIST',
      seat: 'this_seat_does_not_exist',
      type: 'this.type.does.not.exist',
    },
    casing: {},
    // SHORTENED FROM TWO HOURS ON 2026-11-02, because the board outgrew it
    // and the window is the only knob that keeps this probe measurable. The
    // comment at the top of this file promises every probe runs "inside a
    // window small enough that the unfiltered read does not saturate", and
    // that stopped being true of this one: measured within a few minutes at
    // 05:0xZ, 2h returned 493 then 488 then 489 of a 500-row page, which is
    // a page that fills on any busy minute.
    //
    // Measured at the same turn, so the choice is a reading and not a
    // preference: 2h=493, 1h=268, 0.5h=127, 0.25h=60. Half an hour is a
    // quarter of a page, which leaves room for the board to get four times
    // busier before this needs looking at again, and is still wide enough
    // that the window is not empty (an empty window is the other way this
    // probe stops measuring, and it abstains there too).
    //
    // Widening is the wrong direction and the test that caught this says so
    // in those words. A wider window does not collect more evidence here,
    // it collects the same newest 500 rows and loses the rest, so it buys a
    // number that looks bigger and means less. The messages route needs a
    // wide window for a real reason and pages it (`pageAll`) instead.
    window: 'since_hours=0.5',
  },
  runs: {
    path: '/api/runs',
    rows: 'runs',
    // This route refuses to answer at all without company and seat, so the
    // baseline carries both and each probe replaces one of them.
    base: 'company=Ursa&seat=engineer&days=14',
    probes: { company: 'THIS_COMPANY_DOES_NOT_EXIST', seat: 'this_seat_does_not_exist' },
    // The run rows carry no company field, so there is no stored spelling to
    // compare and the verdict rests on the counts alone. Said here rather
    // than printed as an empty set.
    casing: { company: { values: ['Ursa', 'ursa'], field: null, with: '' } },
    // DECLARED ON PURPOSE, because this route has a DEFAULT WINDOW. Measured
    // 2026-11-02 against the live board: with no `days`, the reply is
    // identical to `days=10`, and `limit` is hard-capped at 200 whatever is
    // asked for (200, 201, 500 and 1000 all answered `"limit": 200`). The
    // honoured list is `company, seat, days, limit` with no `before_*`, so
    // `days` widens the window and never moves it, and a seat with more than
    // 200 rows inside it cannot be read past 200 by any parameter.
    //
    // This is not a filter verdict and it is written here anyway, because the
    // default cost this company a published number: a read of this route that
    // named no window asked a 10-day question and returned zero GitHub
    // Actions `run_url` rows, from which the security seat concluded a
    // workflow step had never run. At `days=90` there are 40 such rows, the
    // newest from 2026-10-17. A 10-day window stopped reaching them on
    // 2026-10-27, so the same read became wrong with nothing changed.
    // Recorded in full in docs/design/board-read-conformance.md §2a.
    window: 'days=14',
  },
};

/**
 * Whether a page filled, for a route that may not say so itself.
 *
 * THE FIELD THIS TOOL KEYS ON IS ABSENT ON ONE OF ITS THREE ROUTES, and
 * `verdict()`'s UNMEASURABLE guard was therefore dead code on that route
 * from the day it was written. Read from the board's own source rather
 * than inferred: `/api/messages` replies with `limit` and `saturated`
 * (api.py line 1327) and `/api/runs` with `saturated` (line 1410), but
 * `/api/events` replies with `{"events": [...]}` and nothing else (line
 * 709). So `Boolean(body.saturated)` is always `false` for events, the
 * `if (base.saturated)` branch can never be taken there, and the tool
 * reports a count from a page that filled as though it were an answer.
 *
 * Measured on 2026-11-02 at 05:0xZ: the declared 2-hour events window
 * returned 489 of the 500 asked for, 97.8% of a page, and the tool
 * printed "489 rows unfiltered" with "0 unmeasurable". The same read
 * had crossed 500 ten minutes earlier, which is how this was found: it
 * is the live assertion in `read-filters.test.mjs` going red.
 *
 * The board is HQ's and this is not a seat's to change there, so the
 * repair is on the reading side: when the route sends no `saturated`,
 * infer it the same way the board does, `len(rows) >= applied`, using
 * the limit the caller asked for. The board clamps `limit` to [1, 2000]
 * (api.py line 705) and this tool asks for 500, so the asked-for bound
 * is the applied bound and the comparison is exact rather than a guess.
 *
 * The bias of getting this wrong runs one way, which is why it is worth
 * a function: a row the page never reached looks like a row that does
 * not exist, so the instrument is least trustworthy exactly when the
 * board is busiest.
 *
 * @param {Record<string, unknown>} body the parsed response
 * @param {string} rowsKey the key holding the row array
 * @param {number|null} limit the limit the caller asked for, if known
 * @returns {boolean}
 */
export function saturationOf(body, rowsKey, limit) {
  if (typeof body?.saturated === 'boolean') return body.saturated;
  const rows = Array.isArray(body?.[rowsKey]) ? body[rowsKey] : null;
  if (!rows || !Number.isFinite(limit) || limit === null) return false;
  return rows.length >= limit;
}

/**
 * The verdict, as a pure function of what the two reads returned, so the
 * rules can be tested without a board.
 *
 * @param {{status:number, count:number|null, saturated:boolean, error:string}} base
 *        the read with the parameter absent
 * @param {{status:number, count:number|null, saturated:boolean, error:string}} probed
 *        the same read with the parameter set to a value that cannot match
 * @returns {{verdict:string, why:string}}
 */
export function verdict(base, probed) {
  if (probed.status === 400 && /no such filter/.test(probed.error || '')) {
    return { verdict: 'REFUSED', why: `400 naming the filters it honours` };
  }
  if (base.status === 400 && /required/.test(base.error || '')) {
    return { verdict: 'REQUIRED', why: `the route refuses to answer without it: ${base.error}` };
  }
  // A 5xx IS NOT A REFUSAL, and the line above is why this is checked before
  // the generic 4xx branch rather than after it. A refusal is the route
  // working: it read the parameter, did not recognise it, and said so, which
  // is why this file calls it the good failure. A 500 is the route not
  // running at all, and it says nothing whatever about the filter. Measured
  // against the live board on 2026-11-02, before this branch existed: every
  // filtered read of `/api/events` answered 500 from an AttributeError in the
  // board's own code, this function returned REFUSED three times, the summary
  // printed `0 inert`, and `--strict` exited 0. The route was dead and the
  // tool reported the good failure, which is the one reading a seat acts on
  // by closing the finding. The baseline branch below already treated a
  // failed read as unmeasurable, so the fault was the asymmetry: a crash on
  // the baseline was no answer, a crash on the probe was a verdict.
  for (const [which, r] of [['probe', probed], ['baseline', base]]) {
    if (r.status >= 500) {
      return {
        verdict: 'UNMEASURABLE',
        why: `the ${which} read failed with ${r.status}, so the route did not run and nothing about this filter was measured: ${(r.error || '').slice(0, 90)}`,
      };
    }
  }
  if (probed.status >= 400) {
    return { verdict: 'REFUSED', why: `${probed.status}: ${(probed.error || '').slice(0, 90)}` };
  }
  if (base.status >= 400) {
    return { verdict: 'UNMEASURABLE', why: `the baseline read itself failed with ${base.status}` };
  }
  // A read that returned no row array has no count, so the comparisons below
  // would run on null. `null === null` is true, which would report a pair of
  // answerless reads as INERT.
  for (const [which, r] of [['probe', probed], ['baseline', base]]) {
    if (r.count === null) {
      return {
        verdict: 'UNMEASURABLE',
        why: `the ${which} read returned ${r.status} with no row list, so there is no count to compare`,
      };
    }
  }
  if (base.saturated) {
    return { verdict: 'UNMEASURABLE', why: `the baseline page filled at ${base.count}, so an equal count proves nothing` };
  }
  if (probed.count === base.count) {
    return { verdict: 'INERT', why: `an impossible value returned the unfiltered ${base.count} rows` };
  }
  return { verdict: 'HONOURED', why: `${base.count} rows unfiltered, ${probed.count} with an impossible value` };
}

/**
 * Does this parameter care about the case of its value? Only meaningful once
 * the parameter is HONOURED, because an INERT filter returns the same count
 * for every spelling and that agreement is not insensitivity.
 *
 * @param {{count:number, spellings:string[]}} upper the read with the canonical spelling
 * @param {{count:number, spellings:string[]}} lower the read with it lowercased
 */
export function casingVerdict(upper, lower) {
  // Neither count exists when the read behind it failed, and `null !== null`
  // is false, so without this the next line falls through to the equal-count
  // branches and a pair of crashed reads is reported as a positive casing
  // finding. Measured on 2026-11-02: two failed paged reads returned
  // `CASE-INSENSITIVE (counts only)`, whose own `why` read "both spellings
  // returned the same null rows".
  for (const [which, r] of [['canonical', upper], ['lowercase', lower]]) {
    if (typeof r.count !== 'number') {
      return {
        verdict: 'UNMEASURABLE',
        why: `the ${which} read returned no count, so the two spellings cannot be compared`,
      };
    }
  }
  if (upper.count !== lower.count) {
    return { verdict: 'CASE-EXACT', why: `${upper.count} rows for the canonical spelling, ${lower.count} for the lowercase one` };
  }
  const both = new Set([...(upper.spellings || []), ...(lower.spellings || [])]);
  // An equal count is weak evidence on its own: a route that ignores the
  // parameter entirely returns the same count for every spelling, and so
  // does one that matches only the canonical rows. The strong form is an
  // equal count whose rows are STORED under more than one casing, because
  // then the match demonstrably crossed them.
  if (both.size > 1) {
    return {
      verdict: 'CASE-INSENSITIVE',
      why: `both spellings returned the same ${upper.count} rows, and those rows are stored under ${[...both].sort().join(' and ')}, so the match crossed the casings rather than agreeing by luck`,
    };
  }
  if (both.size === 0) {
    return {
      verdict: 'CASE-INSENSITIVE (counts only)',
      why: `both spellings returned the same ${upper.count} rows, and these rows carry no company field, so there is no stored spelling to confirm it with`,
    };
  }
  return {
    verdict: 'CASE-INSENSITIVE (weak)',
    why: `both spellings returned the same ${upper.count} rows, but every row is stored as ${[...both][0]}, so this window contains no counter-example and cannot rule out a canonical-only match`,
  };
}

const argv = process.argv.slice(2);
const flag = (n, d = '') => { const i = argv.indexOf(n); return i === -1 ? d : (argv[i + 1] ?? ''); };
const has = (n) => argv.includes(n);

const base = (process.env.BOARD_API_URL || '').replace(/\/$/, '');
const token = process.env.BOARD_RUNTIME_TOKEN;

/** One GET, reduced to the four things a verdict needs.
 *
 *  A THROW IS TAGGED AND RE-THROWN, not turned into a reading. The temptation
 *  is to return `{status: 0, count: 0, rows: []}` and let the loop carry on,
 *  and that is the worse of the two bugs: `verdict` would then grade every
 *  filter against a baseline of nothing and print a table, and a filter graded
 *  from no rows is the green-on-nothing this file's own INERT verdict exists
 *  to catch one layer down. So an unreachable board ends the run instead, at
 *  the exit code this file's header already reserves for it. */
async function read(path, rowsKey) {
  let res;
  try {
    res = await fetch(base + path, { headers: { Authorization: `Bearer ${token}` } });
  } catch (error) {
    throw Object.assign(new Error('board unreachable'), { boardReach: reachFault(error) });
  }
  const text = await res.text();
  let body = {};
  try { body = JSON.parse(text); } catch { body = { error: text.slice(0, 200) }; }
  const rows = Array.isArray(body[rowsKey]) ? body[rowsKey] : null;
  // The limit comes back out of the path because that is the only place it
  // exists for a route that does not echo it. See `saturationOf`.
  const asked = /[?&]limit=(\d+)/.exec(path);
  return {
    status: res.status,
    count: rows ? rows.length : null,
    saturated: saturationOf(body, rowsKey, asked ? Number(asked[1]) : null),
    error: body.error || '',
    rows: rows || [],
  };
}

/**
 * Every row in a window, by dividing the window whenever a page fills.
 *
 * `docs/standards/pm.md` §15: one read returns at most `limit` rows however
 * many were asked for, and "a saturated page is not an answer". The cost of
 * ignoring that is on record: `tools/autonomy.py` asked for 5000 rows over
 * seven days, was handed the newest 500, covered 36 hours, and published an
 * autonomy floor of 79% for a window that was 93%. The bias runs one way,
 * because a row the page never reached looks like a row that does not exist,
 * so the instrument was most wrong exactly when the seats were busiest.
 *
 * Twelve hours is the slice because this board writes about 500 message rows
 * a day, which puts a slice at roughly half a page.
 */
async function pageAll(path, rowsKey, hours, extra = '') {
  const byId = new Map();
  let saturated = 0;
  for (let start = 0; start < hours; start += 12) {
    const q = `?since_hours=${start + 12}&before_hours=${start}&limit=500${extra}`;
    const r = await read(path + q, rowsKey);
    if (r.status >= 400) return { status: r.status, count: null, error: r.error, rows: [], saturated: false };
    if (r.saturated) saturated += 1;
    for (const row of r.rows) byId.set(row.id, row);
  }
  const rows = [...byId.values()];
  // A saturated slice means rows were lost inside it, so the count is a floor
  // and the caller must not treat it as the answer.
  return { status: 200, count: rows.length, error: '', rows, saturated: saturated > 0, saturatedSlices: saturated };
}

async function main() {
  // Usage is answered INSIDE main and not at module scope, and the comment at
  // the bottom of this file -- "Importable for the tests without running the
  // probes" -- is why. Demonstrated on 2026-11-09 from a two-line importer run
  // as `node importer.mjs --help`: the import printed this usage line and
  // exited the importing process, which never reached its own second line. The
  // file was importable for `node --test`, whose argv carries no `--help`, and
  // not importable in general. `tools/gates/import-effects.mjs` is the gate
  // that found it.
  if (has('--help') || has('-h')) {
    console.log('usage: read-filters.mjs [--route messages|events|runs] [--json] [--strict]');
    process.exit(0);
  }

  const fault = liveTargetFault({ apiUrl: process.env.BOARD_API_URL, token });
  if (fault) {
    console.error(`${fault.code}: ${fault.line}`);
    console.error(`  repair: ${fault.repair}`);
    console.error('  No filter was measured, and nothing is wrong with the board.');
    process.exit(2);
  }

  const only = flag('--route');
  const out = [];

  for (const [name, spec] of Object.entries(ROUTES)) {
    if (only && only !== name) continue;
    const prefix = spec.base ? `?${spec.base}&limit=500` : `?${spec.window}&limit=500`;
    const baseRead = await read(spec.path + prefix, spec.rows);

    for (const [param, impossible] of Object.entries(spec.probes)) {
      // A probe on a parameter the baseline already carries replaces it
      // rather than appending a second copy, because `parse_qs` keeps the
      // first value and the probe would be silently discarded.
      const q = spec.base
        ? `?${spec.base.replace(new RegExp(`${param}=[^&]*`), `${param}=${impossible}`)}&limit=500`
        : `${prefix}&${param}=${encodeURIComponent(impossible)}`;
      const carried = spec.base && new RegExp(`${param}=`).test(spec.base);
      const probed = await read(spec.path + q, spec.rows);
      // When the baseline cannot answer without this parameter, the honest
      // baseline for it is the one that carries a real value.
      const v = verdict(carried ? { ...baseRead } : baseRead, probed);
      out.push({ route: name, path: spec.path, param, ...v });
    }

    for (const [param, { values: [upperV, lowerV], field, with: alsoRaw }] of Object.entries(spec.casing || {})) {
      const also = alsoRaw ? `&${alsoRaw}` : '';
      // A route that pages (the message read) is measured over the wide
      // window the counter-example needs. A route that does not expose
      // `before_hours` (the runs read) is measured in one request, and its
      // verdict says so by being counts-only.
      const one = async (val) => (spec.casingHours
        ? pageAll(spec.path, spec.rows, spec.casingHours, `&${param}=${val}${also}`)
        : read(spec.path + `?${spec.base.replace(new RegExp(`${param}=[^&]*`), `${param}=${val}`)}&limit=500`, spec.rows));
      const u = await one(upperV);
      const l = await one(lowerV);
      const spell = (r) => (field ? [...new Set(r.rows.map((x) => x[field]).filter(Boolean))] : []);
      const v = u.saturated || l.saturated
        ? { verdict: 'UNMEASURABLE', why: `${(u.saturatedSlices || 0) + (l.saturatedSlices || 0)} of the paged slices filled, so rows were lost and neither count is an answer` }
        : casingVerdict({ count: u.count, spellings: spell(u) }, { count: l.count, spellings: spell(l) });
      out.push({ route: name, path: spec.path, param: `${param} (casing)`, ...v });
    }
  }
  if (has('--json')) {
    console.log(JSON.stringify({ measured_at: new Date().toISOString(), filters: out }, null, 2));
  } else {
    const w = Math.max(...out.map((r) => r.param.length), 9);
    for (const r of out) {
      console.log(`${r.route.padEnd(9)} ${r.param.padEnd(w)} ${r.verdict.padEnd(17)} ${r.why}`);
    }
    const inert = out.filter((r) => r.verdict === 'INERT');
    const unmeasured = out.filter((r) => r.verdict === 'UNMEASURABLE');
    // `N measured` counted every row, including the ones that measured
    // nothing, so a route answering 500 on every read printed the same
    // reassuring `0 inert` as a route whose filters all work.
    console.log(`\n${out.length} probed, ${out.length - unmeasured.length} measured, ${inert.length} inert, ${unmeasured.length} unmeasurable.`);
    if (inert.length) {
      console.log('An inert filter is accepted and ignored, so a caller that scoped a read did not scope it.');
      for (const r of inert) console.log(`  GET ${r.path} ignores ${r.param}`);
    }
    if (unmeasured.length) {
      console.log('An unmeasurable filter is not a passing one. Nothing was learned about it on this run.');
      for (const r of unmeasured) console.log(`  GET ${r.path} ${r.param}: ${r.why}`);
    }
  }
  process.exit(has('--strict') && out.some((r) => r.verdict === 'INERT') ? 1 : 0);
}

// Importable for the tests without running the probes.
//
// THE REACH CATCH IS HERE AND NOT AROUND THE PROBE LOOP, so that the loop
// keeps its own indentation and this file's diff for F132 is the handler
// rather than forty reindented lines. It makes no behavioural difference:
// `read` tags the only throw either site would see, every probe is awaited
// inside `main`, and `main` has no caller but this line.
//
// Exit 2 is the code line 11 of this file already reserves for having no board
// to measure, and the three lines printed are the `liveTargetFault` branch's.
// The only difference between the two branches is WHEN the fault became
// knowable, and that is not a difference a reader acts on.
if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    await main();
  } catch (error) {
    if (!error?.boardReach) throw error;
    const fault = error.boardReach;
    console.error(`${fault.code}: ${fault.line}`);
    console.error(`  repair: ${fault.repair}`);
    console.error('  No filter was measured to a verdict, and none is published from a partial sweep.');
    process.exit(2);
  }
}
