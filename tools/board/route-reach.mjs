#!/usr/bin/env node
// The route-reach sweep: every board route a charter or standard names, graded
// against the board that is actually running.
//
//     node tools/board/route-reach.mjs                 # the sweep
//     node tools/board/route-reach.mjs --json
//     node tools/board/route-reach.mjs --citations      # who names what, no network
//     node tools/board/route-reach.mjs --control        # the positive control alone
//     node tools/board/route-reach.mjs --gate           # exit 1 iff a BINDING file names an ABSENT route
//
// Exit 0 the sweep ran and (under --gate) no binding file names an absent
// route. Exit 1 --gate and a binding miss. Exit 2 usage. Exit 3 the question
// cannot be answered from here: no citation found, no credential, or the
// positive control did not fire. Three is never zero, which is
// tool-reach.mjs's rule and its reason — this tool's subject is an absence, so
// a silent instrument and a sound repository have the same shape and must not
// print the same thing.
//
// READ-ONLY. Every request is a GET, which is tools/board/read-filters.mjs's
// rule and its reason: the board has no delete route. A citation written as a
// POST is reported and never probed.
//
// WHY THIS EXISTS. Two sweeps already grade what a charter names and neither
// can see a route:
//
//   - tools/seat/tool-reach.mjs grades every TOOL PATH a standard or charter
//     names, in five states against a discovered root set.
//   - tools/board/read-filters.mjs grades every FILTER PARAMETER, on the three
//     routes it declares in ROUTES.
//
// This repository's prose names ELEVEN board routes across 163 citations. The
// filter sweep knows three of them. Nothing has ever asked whether a route a
// charter tells a seat to call resolves at all, and prompts/exo-agent.md
// §7280's own standing rule — "never re-derive this list; ask the route for
// it" — was written about the filters and has no counterpart for the path.
//
// THE TWO TRAPS, BOTH MEASURED ON 2026-11-09 BY THE WINDOW THAT WROTE THIS,
// and they are the reason this is a tool and not a shell pipeline.
//
// FIRST: A BARE-PREFIX PROBE IS THE WRONG INSTRUMENT. The natural reading is
// to take the route name out of the citation and GET /api/<name>. Four of the
// eleven are written by their citations as sub-paths — /api/work/Ursa/exo,
// /api/board/Ursa, /api/runs?company=..., /api/items/<id> — and the bare
// prefix answers `no such route` for all four. That reading called 4 of 11
// routes absent and every one of the four was false. It is
// tools/seat/tool-reach.mjs's own basename lesson arriving on a second
// surface: resolve the form the prose actually writes before you report a
// miss. Probe the citation, never a name derived from it.
//
// SECOND, AND IT IS THE ONE WORTH CARRYING: A REACH PROBE KEYED ON THE HTTP
// STATUS REPORTS A ROUTE AS ABSENT DURING EXACTLY THE OUTAGE THAT ROUTE EXISTS
// TO ANNOUNCE. Measured at 04:4xZ on 2026-11-09, with this host's /tmp at 96%:
//
//     /api/health    503  {"ok": false, "error": "the disk is 96% full", ...}
//     /api/standing  400  {"error": "company and seat are both required: ..."}
//     /api/zzz       404  {"error": "no such route"}
//
// 503 is the correct answer from a route that is present and working, and it is
// the single most urgent thing the board can say. 400 is a present route
// naming its own required parameters. A sweep graded by `http == 200` calls
// both of them missing, and the health one is worse than a false positive: the
// check goes red for the reason the service went red, so the instrument's
// failure is correlated with the failure it was built to surface.
//
// So reach is graded on the board's OWN VOCABULARY and never on the status
// code. `no such route` is the only answer that means absent; the board emits
// that string and nothing else does. This is prompts/exo-agent.md's recurring
// §48 — an output that cannot distinguish its own abort from its verdict — and
// here the two readings are a missing route and a reported disaster.
//
// THIRD, AND THIS ONE THE TOOL COMMITTED AGAINST ITSELF BEFORE IT SHIPPED, SO
// IT IS RECORDED RATHER THAN AVOIDED. The first version of `gradeAnswer` read
// absence as `body.includes("no such route")`, and its first reading called
// `/api/agents` ABSENT. The route answers 200 with 573,978 bytes, because what
// it returns is every agent's description and prompt — and those prompts are
// THIS REPOSITORY'S OWN CHARTERS, one of which documents the marker verbatim:
//
//     Two cautions. The route accepts **no query string** — any parameter
//     returns `{"error": "no such route"}` — and it returns a fixed count...
//
// So the probe found its own documentation of absence inside a healthy
// response and reported the route as missing. Ursa's security seat measured
// the same shape in a vendored checker on the same evening: its marker test is
// a bare substring, so a comment explaining the marker suppresses findings on
// the line below it, and 27 of 36 markers in that tree were prose naming the
// token rather than claims. Two instruments, two files, one defect — a bare
// substring test for a vocabulary token matches the documentation of that
// token. The variety only this call site can reach is that the documentation
// arrived INSIDE THE RESPONSE, served by the route under test, because the
// route serves the files that document it.
//
// The repair is the security seat's, taken in their words: key it on the PAIR.
// ABSENT is `status === 404` AND `error` being exactly the marker, and a 404
// whose `error` is something else grades UNGRADED, because a proxy's 404 is
// not a verdict about a route either.
//
// FOURTH, AND IT IS THE THIRD ONE IN A ROW, WHICH IS WHY THE PATTERN IS NAMED
// HERE RATHER THAN FIXED THREE TIMES. The version after the substring repair
// still grouped citations by PATH and unioned the HTTP method across the files
// that cite it. Bare `/api/items` is cited four times: three POSTs, one of them
// `docs/standards/pm.md`'s, and one GET in `tools/tests/test_secret_print.py`,
// a fixture. The union contained GET, so the tool probed it, got the board's
// real `no such route`, and printed FINDING against pm.md — a write route
// reported as a missing read, charged to a file that never asked for a read.
//
// All three traps are one mistake: AN ATTRIBUTE COMPUTED OVER A SET, READ AS IF
// IT NAMED A MEMBER. The status was the response's and not the route's; the
// marker was the body's and not the error's; the method was the path's and not
// the citation's. Ursa's security seat stated it on the same evening about
// their own gate — "it read the direction as if it named the kind" — and the
// repair is theirs in all three places: key it on the pair. This tool now
// groups by (path, method) and counts binding citations only inside the group
// it actually probed.
// THE DENOMINATOR IS PRINTED BEFORE THE ROWS, which is §0's own rule from the
// eighty-fourth window: a measurement over an enumerated class prints its
// denominator first, so that an interrupted read is visibly incomplete rather
// than well-formed.
//
// AND THE POSITIVE CONTROL RUNS EVERY TIME, not on request. prompts/exo-agent.md
// §5173: before you report that something is absent, demonstrate that your
// instrument finds it when it is present. This tool's whole output is a claim
// about absence, so a GET of a route that cannot exist must grade ABSENT
// before any citation is graded at all. If it does not, every verdict below it
// is void and the tool exits 3 rather than printing them.

import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { liveTargetFault } from './live-target.mjs';

/** The string the board answers with when a path is not a route. */
export const ABSENT_MARKER = 'no such route';

/** A path that cannot be a route, for the positive control. */
export const CONTROL_PATH = '/api/zzz-route-reach-control';

/**
 * Files whose citations BIND a seat — a charter or a standard tells a seat to
 * run the command. Everything else (run logs, market briefs, design notes,
 * security audits) is a narrative record of a call someone once made, and a
 * route that has since been renamed is not a defect in a diary.
 */
export function isBinding(file) {
  return /^prompts\/[a-z-]+\.md$/.test(file) || /^docs\/standards\/[a-z-]+\.md$/.test(file);
}

/**
 * Every `$BOARD_API_URL/api/...` citation in a text, with the method the
 * surrounding command uses. The path is taken as written, including its
 * sub-path and its query, because a name derived from the citation is the
 * first trap in this file's header.
 *
 * @param {string} text
 * @returns {{path: string, method: string, line: number}[]}
 */
export function citationsIn(text) {
  const out = [];
  const lines = text.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // `-X POST` can sit before the URL on the same line, which is how both
    // pm.md and tools/board/post.mjs write it.
    const method = /-X\s*(POST|PUT|PATCH|DELETE)\b/.test(line)
      ? line.match(/-X\s*(POST|PUT|PATCH|DELETE)\b/)[1]
      : 'GET';
    for (const m of line.matchAll(/\$\{?BOARD_API_URL\}?(\/api\/[A-Za-z0-9_\/<>?=&.,%${}-]*)/g)) {
      // Trim trailing shell/markdown punctuation the URL cannot own.
      const path = m[1].replace(/["'`,.)\\]+$/, '');
      out.push({ path, method, line: i + 1 });
    }
  }
  return out;
}

/** The route name a citation is about, for grouping only — never for probing. */
export function routeNameOf(path) {
  const m = path.match(/^\/api\/([A-Za-z0-9_-]+)/);
  return m ? m[1] : '';
}

/**
 * Is this citation probeable as written? A placeholder is not a defect in the
 * prose — `<id>` is how a standard writes "the id you just read" — but it is
 * not a URL either, so it grades as its own state rather than as a miss.
 */
export function placeholderIn(path) {
  const m = path.match(/<[^>]*>|\$\{[^}]*\}|\$[A-Za-z_][A-Za-z0-9_]*/);
  return m ? m[0] : null;
}

/**
 * Grade one board answer. Keyed on the PAIR (status, the parsed `error` field)
 * and never on a substring of the body, which is the third trap in this file's
 * header and the one that cost this tool its first reading.
 *
 * @param {{status: number, body: string}} answer
 * @returns {{state: string, why: string}}
 */
export function gradeAnswer({ status, body }) {
  const text = String(body || '');
  let parsed = null;
  try { parsed = JSON.parse(text); } catch { /* not json; `error` stays unreadable */ }
  const err = parsed && typeof parsed.error === 'string' ? parsed.error : null;

  // ABSENT is the pair and nothing else: the board's 404 carrying its own
  // marker as the WHOLE of its `error` field. Not a 404 alone, which a proxy
  // can produce, and not the marker found anywhere in the body, which is how
  // this function read a 573,978-byte success as a missing route.
  if (status === 404 && err === ABSENT_MARKER) {
    return { state: 'ABSENT', why: `404 and error is exactly ${JSON.stringify(ABSENT_MARKER)}` };
  }
  if (status === 200) return { state: 'PRESENT', why: `answered 200, ${text.length} bytes` };
  if (status >= 500) {
    // A present route reporting bad news. The disk-full 503 is the measured
    // case and it is the whole reason this function does not read `status`
    // first.
    return { state: 'DEGRADED', why: `present, answering ${status}: ${firstError(text)}` };
  }
  if (status === 400 || status === 422) {
    return { state: 'NEEDS-PARAMETERS', why: `present, refused the bare form: ${firstError(text)}` };
  }
  if (status === 401 || status === 403) {
    return { state: 'UNAUTHORISED', why: `present, refused this credential (${status})` };
  }
  if (status === 404) {
    // A 404 that is not the board's own marker. Something between this process
    // and the board answered, and that is not a verdict about a route.
    return { state: 'UNGRADED', why: `404 but error is ${JSON.stringify(err)}, not the board's marker` };
  }
  return { state: 'UNGRADED', why: `${status}, and no vocabulary this tool knows` };
}

function firstError(text) {
  try {
    const o = JSON.parse(text);
    if (typeof o.error === 'string') return o.error;
  } catch { /* not json; fall through to the raw head */ }
  return text.slice(0, 80).replace(/\s+/g, ' ');
}

/** Only ABSENT in a binding file is a finding. Everything else is a reading. */
export function isFinding(row) {
  return row.state === 'ABSENT' && row.bindingCitations > 0;
}

async function get(url, token) {
  try {
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    return { status: res.status, body: await res.text() };
  } catch (e) {
    return { status: 0, body: `fetch failed: ${e.message}` };
  }
}

function trackedFiles() {
  const out = execFileSync('git', ['ls-files'], { encoding: 'utf8' });
  return out.trim().split('\n').filter(Boolean);
}

/**
 * Group every citation in the repository by the (path, method) PAIR it writes,
 * which is the fourth trap in this file's header. Grouping by path alone unions
 * the methods across files, and this tool then graded bare `/api/items` by a
 * GET taken from a test fixture while attributing the result to
 * `docs/standards/pm.md`, whose only citation of that path is a POST.
 */
export function sweepCitations(files, read = (f) => readFileSync(f, 'utf8')) {
  const byCall = new Map();
  for (const f of files) {
    let text;
    try { text = read(f); } catch { continue; }
    if (!text.includes('BOARD_API_URL')) continue;
    for (const c of citationsIn(text)) {
      const key = `${c.method} ${c.path}`;
      if (!byCall.has(key)) byCall.set(key, []);
      byCall.get(key).push({ file: f, ...c });
    }
  }
  return byCall;
}

/** Split a `sweepCitations` key back into the pair it encodes. */
export function splitCall(key) {
  const i = key.indexOf(' ');
  return { method: key.slice(0, i), path: key.slice(i + 1) };
}

async function main(argv) {
  const want = (f) => argv.includes(f);
  if (want('--help') || want('-h')) {
    console.log(readFileSync(new URL(import.meta.url)).toString().split('\n')
      .filter((l) => l.startsWith('//')).slice(0, 8).join('\n'));
    return 2;
  }
  const json = want('--json');
  const gate = want('--gate');

  const byCall = sweepCitations(trackedFiles());
  if (byCall.size === 0) {
    console.error('route-reach: no $BOARD_API_URL citation in any tracked file. '
      + 'That is this tool losing its input, not a repository without routes.');
    return 3;
  }
  const allCitations = [...byCall.values()].flat().length;

  // The citation census needs no credential, so it is available in a sandbox
  // that has none, and it is the half a reviewer can check by hand.
  const routes = new Map();
  for (const [key, cites] of byCall) {
    const name = routeNameOf(splitCall(key).path);
    if (!routes.has(name)) routes.set(name, []);
    routes.get(name).push({ key, cites });
  }
  if (want('--citations')) {
    console.log(`route-reach citations: ${byCall.size} distinct (path, method) calls, `
      + `${routes.size} route names, ${allCitations} citations`);
    for (const [name, forms] of [...routes].sort()) {
      const n = forms.reduce((a, f) => a + f.cites.length, 0);
      const b = forms.reduce((a, f) => a + f.cites.filter((c) => isBinding(c.file)).length, 0);
      console.log(`  ${name || '(bare /api/)'}\t${forms.length} call(s)\t${n} citation(s)\t${b} binding`);
    }
    return 0;
  }

  const fault = liveTargetFault({ apiUrl: process.env.BOARD_API_URL, token: process.env.BOARD_RUNTIME_TOKEN });
  if (fault) {
    console.error(`route-reach: ${fault.line}`);
    console.error(`  repair: ${fault.repair}`);
    console.error('  the citation census needs no credential: --citations');
    return 3;
  }
  const base = process.env.BOARD_API_URL.replace(/\/+$/, '');
  const token = process.env.BOARD_RUNTIME_TOKEN;

  // THE POSITIVE CONTROL, FIRST AND UNCONDITIONALLY. Everything this tool
  // prints is a claim about absence, so an instrument that cannot see an
  // absent route has no verdicts, only output.
  const control = gradeAnswer(await get(base + CONTROL_PATH, token));
  if (want('--control')) {
    console.log(`control ${CONTROL_PATH} -> ${control.state} (${control.why})`);
    return control.state === 'ABSENT' ? 0 : 3;
  }
  if (control.state !== 'ABSENT') {
    console.error(`route-reach: the positive control graded ${control.state}, not ABSENT. `
      + `A GET of ${CONTROL_PATH} answered: ${control.why}`);
    console.error('  This instrument cannot currently see an absent route, so it has no '
      + 'verdict about any route. Nothing below is printed.');
    return 3;
  }

  // The denominator, before the rows.
  const probeable = [...byCall.keys()]
    .filter((k) => k.startsWith('GET ') && !placeholderIn(splitCall(k).path));
  const header = `route-reach: ${byCall.size} distinct (path, method) calls, ${routes.size} route names, `
    + `${allCitations} citations; ${probeable.length} GET-probeable as written; `
    + `control ${CONTROL_PATH} -> ABSENT`;
  if (!json) console.log(header);

  const rows = [];
  for (const [key, cites] of [...byCall.keys()].sort().map((k) => [k, byCall.get(k)])) {
    const { method, path } = splitCall(key);
    const row = {
      path,
      method,
      route: routeNameOf(path),
      citations: cites.length,
      bindingCitations: cites.filter((c) => isBinding(c.file)).length,
      files: [...new Set(cites.map((c) => c.file))],
    };
    const ph = placeholderIn(path);
    if (ph) {
      Object.assign(row, { state: 'PLACEHOLDER', why: `written with ${ph}; not a URL as it stands` });
    } else if (method !== 'GET') {
      Object.assign(row, { state: 'WRITE-NOT-PROBED', why: `cited as ${method}; the board has no delete route` });
    } else {
      Object.assign(row, gradeAnswer(await get(base + path, token)));
    }
    row.finding = isFinding(row);
    rows.push(row);
  }

  if (json) {
    console.log(JSON.stringify({ header, control, rows }, null, 2));
  } else {
    for (const r of rows) {
      const mark = r.finding ? 'FINDING ' : '        ';
      console.log(`${mark}${r.state}\t${r.method} ${r.path}`);
      console.log(`\t  ${r.why}; ${r.citations} citation(s), ${r.bindingCitations} binding`);
    }
    const by = {};
    for (const r of rows) by[r.state] = (by[r.state] || 0) + 1;
    console.log(`${rows.length} call(s): ` + Object.entries(by).sort().map(([k, v]) => `${k} ${v}`).join(', '));
  }

  const findings = rows.filter((r) => r.finding);
  if (gate && findings.length) {
    console.error(`route-reach --gate: ${findings.length} binding citation(s) name an absent route.`);
    return 1;
  }
  return 0;
}

// RUN ONLY AS A PROGRAM, NEVER ON IMPORT, and this guard is the fifth trap.
// Without it, `import` of this module performed the whole sweep — sixty GETs
// against the live board — so the test file could not reach a single function
// without probing production, and `node --test` printed the sweep. That is
// exactly the defect `tools/board/live-target.mjs`'s own header describes in
// `post.mjs`: "post.mjs reads the environment, builds a payload and awaits a
// fetch at module scope, so importing it posts a message." This repository had
// named the pattern and split two files along it already; this one was written
// without the guard anyway, which is a self-note being quoted rather than
// re-derived — Ursa's engineer's sentence from the same evening.
if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  main(process.argv.slice(2)).then((c) => process.exit(c)).catch((e) => {
    console.error(`route-reach: ${e.stack || e.message}`);
    process.exit(3);
  });
}
