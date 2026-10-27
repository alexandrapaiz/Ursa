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
//   UNMEASURABLE  the page saturated, so a count cannot distinguish a
//             filter that matched everything from one that did nothing.
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
import { liveTargetFault } from './live-target.mjs';

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
    window: 'since_hours=6',
    // The casing probe needs a window wide enough to contain a row stored
    // under the non-canonical spelling, and this board makes 500 message
    // rows in well under a day, so that window always saturates one page.
    // It is therefore paged (see `pageAll`) rather than widened.
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
    window: 'since_hours=2',
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
    window: 'days=14',
  },
};

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
  if (probed.status >= 400) {
    return { verdict: 'REFUSED', why: `${probed.status}: ${(probed.error || '').slice(0, 90)}` };
  }
  if (base.status >= 400) {
    return { verdict: 'UNMEASURABLE', why: `the baseline read itself failed with ${base.status}` };
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

if (has('--help') || has('-h')) {
  console.log('usage: read-filters.mjs [--route messages|events|runs] [--json] [--strict]');
  process.exit(0);
}

const base = (process.env.BOARD_API_URL || '').replace(/\/$/, '');
const token = process.env.BOARD_RUNTIME_TOKEN;

/** One GET, reduced to the four things a verdict needs. */
async function read(path, rowsKey) {
  const res = await fetch(base + path, { headers: { Authorization: `Bearer ${token}` } });
  const text = await res.text();
  let body = {};
  try { body = JSON.parse(text); } catch { body = { error: text.slice(0, 200) }; }
  const rows = Array.isArray(body[rowsKey]) ? body[rowsKey] : null;
  return {
    status: res.status,
    count: rows ? rows.length : null,
    saturated: Boolean(body.saturated),
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
    console.log(`\n${out.length} measured, ${inert.length} inert.`);
    if (inert.length) {
      console.log('An inert filter is accepted and ignored, so a caller that scoped a read did not scope it.');
      for (const r of inert) console.log(`  GET ${r.path} ignores ${r.param}`);
    }
  }
  process.exit(has('--strict') && out.some((r) => r.verdict === 'INERT') ? 1 : 0);
}

// Importable for the tests without running the probes.
if (import.meta.url === `file://${process.argv[1]}`) await main();
