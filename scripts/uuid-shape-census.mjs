#!/usr/bin/env node
// Census of every 8-4-4-4-12 hex string in every blob in this repository.
//
// WHY THIS EXISTS. The redaction gate's Class C pattern
// (docs/security/redaction-standard.md §3) recognises session identity by
// SHAPE, and three other things in this repository have the same shape. A
// board message identifier, which the standard resolves by telling every
// seat to truncate it to eight characters. A `board.runs` or project or
// internal-nudge identifier, same remedy. And the article-id path segment
// of a CITED PUBLIC URL, which the standard does not resolve at all, and
// cannot resolve the same way, because a URL's identifier is its address.
// Truncating an address is not a redaction, it is a broken citation.
//
// The market seat hit the third case twice, a week apart, and paid a
// different price each time. On 2026-11-02, commit a0087473, it deleted
// three source URLs outright and replaced them with prose explaining that
// the URL was omitted because the gate rejects it. On 2026-11-09, commit
// 9512b85b, it percent-encoded one hyphen inside the slug in three files
// so the shape would stop matching while the link still resolved. Both
// are workarounds in the citation rather than fixes in the gate, so the
// next seat citing the next UUID-slug host pays again.
//
// Narrowing a security gate is only defensible on the population it runs
// over, and this script is that population. It answers the five questions
// a reviewer has to have answered before the gate's rules change:
//
//   Q1  How many distinct hosts carry a UUID-shaped path segment inside an
//       http(s) URL? A source-host allowlist is a cheap remedy only while
//       that number is small, and it is the measurement, not a forecast,
//       that says whether it is.
//   Q2  What is the population the gate must keep catching, and what kinds
//       are in it? If it is mostly board identifiers the standard already
//       tells seats to truncate, that is a different gate than one holding
//       back private session identity, and it should be argued differently.
//   Q3  Does any line carry BOTH an in-URL value and a bare one? The gate
//       applies its allowance with `grep -vE`, which is LINE scoped, so
//       such a line is exactly where an allowance loses a true positive.
//   Q4  Would the proposed allowance exempt any line that also carries a
//       Class A or Class B value? The gate shares one allowance across all
//       three patterns, so an addition aimed at Class C widens the other
//       two by construction, and the only question is by how much.
//   Q5  Does the proposed allowance exempt any member of Q2's population?
//       It must exempt none. This is the regression test, over history,
//       rather than over fixtures somebody chose.
//
// SCOPE is every object in the store, not HEAD, for the reason
// `redaction-check --history=all` gives: the question a public repository
// raises is what GitHub SERVES, and that is every ref, including the
// closed-pull-request branches nobody deleted. Run
// `bash tools/ensure-full-clone.sh` first, or this reads a truncated graph
// and reports a small, clean, wrong answer.
//
// OUTPUT NEVER CARRIES A FULL IDENTIFIER. Every value this script prints is
// truncated to eight characters, because a census of the gate's findings
// that printed them in full would be a file the gate rejects, and would
// publish 24 identifiers into a public Actions log on the way to saying so.
//
// Usage:
//   node scripts/uuid-shape-census.mjs            # human summary
//   node scripts/uuid-shape-census.mjs --json     # one object, machine readable
//   node scripts/uuid-shape-census.mjs --kinds    # add the per-value kind table
//
// No dependencies, no network. Reads git only.

import { execFileSync, spawn } from 'node:child_process';

// The gate's three patterns, as JavaScript. Transliterated from
// `.github/workflows/redaction-gate.yml` rather than read out of it,
// because unlike `scripts/redaction-check.mjs` this script is not a mirror
// of the gate: it is an argument ABOUT the gate, and it has to be able to
// evaluate a rule the gate does not have yet. `scripts/redaction-check.mjs`
// is the thing that must never drift, and it reads the workflow.
const CLASS_C = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/g;
const CLASS_A = /(\/Users\/|\/home\/)[A-Za-z][A-Za-z0-9._-]{2,}\//;
const CLASS_B = /\.claude\/projects\/-[A-Za-z]/;

// The gate's current line-scoped allowance, same source, same caveat.
const CURRENT_ALLOWANCE = /\/(home\/runner|Users\/<you>|home\/<you>)\/|projects\/-Users-you-/;

// THE PROPOSAL under measurement. A UUID-shaped segment is exempt only when
// it sits in the path of an http(s) URL on an allowlisted published-source
// host. Allowlist and not denylist, because the failure directions are not
// symmetric: a missing allowlist entry costs one seat one red gate and a
// one-line addition, and a missing denylist entry publishes a private
// conversation identifier. `claude.ai/chat/<id>` and `chatgpt.com/c/<id>`
// are real URLs carrying real session identity, which is why "a UUID inside
// a URL is public" is false and this list is explicit.
const SOURCE_HOSTS = ['finance.biggo.com'];
const PROPOSED_ALLOWANCE = new RegExp(
  `https?://(${SOURCE_HOSTS.map((h) => h.replace(/\./g, '\\.')).join('|')})/` +
    `[A-Za-z0-9._~%/+-]*[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}`
);

// Is the match at `index` inside the path of an http(s) URL? Decided by
// looking LEFT, because an extended regular expression cannot: POSIX ERE,
// which is what `grep -E` gives the gate, has no lookbehind. That absence
// is the whole reason the remedy has to be an allowance rather than a
// narrower Class C pattern, and it is worth stating where the asymmetry is
// visible in the code.
const URL_HEAD = /https?:\/\/([A-Za-z0-9._-]+)(\/[^\s)<>"'\]]*)?$/;

// What a bare value actually is, read off the text around it. Reported so a
// reviewer can see the gate's catch population by kind instead of by count;
// never used to exempt anything.
function kindOf(line) {
  if (/\bsessionFile\b|\.jsonl/.test(line)) return 'session-file';
  if (/\bconversation\b/i.test(line)) return 'conversation';
  if (/\bmessage id\b|\bid `|`(ask|done|note|handoff)`|board note|dispatch/i.test(line)) return 'board-message';
  if (/board\.runs|\brun id\b/i.test(line)) return 'board-run';
  if (/\bproject id\b/i.test(line)) return 'project';
  if (/nudge/i.test(line)) return 'internal-nudge';
  if (/\bteam\(id\b|api\./i.test(line)) return 'third-party-api';
  return 'unclassified';
}

const git = (args) => execFileSync('git', args, { encoding: 'utf8', maxBuffer: 1 << 28 });

function assertFullClone() {
  if (git(['rev-parse', '--is-shallow-repository']).trim() === 'true') {
    console.error('uuid-shape-census: this clone is shallow, so an object walk reads a truncated store.');
    console.error('  run: bash tools/ensure-full-clone.sh');
    process.exit(2);
  }
}

function blobOids() {
  const out = git([
    'cat-file', '--batch-all-objects',
    '--batch-check=%(objectname) %(objecttype) %(objectsize)',
  ]);
  const oids = [];
  for (const line of out.split('\n')) {
    const [oid, type, size] = line.split(' ');
    if (type === 'blob' && Number(size) > 0 && Number(size) < 8 * 1024 * 1024) oids.push(oid);
  }
  return oids;
}

// NUL in the first 8 KiB is git's own binary test. The gate passes `-I`, so
// it skips these too, and a census that read them would count findings the
// gate does not have. PWC-13 asks HQ to drop that flag; when it does, this
// test is the line to change, and it is one line on purpose.
const looksBinary = (body) => body.subarray(0, 8192).includes(0x00);

// One `cat-file --batch` pipe rather than one process per blob: 28k spawns
// is minutes of process setup, one pipe is seconds.
function scanBlobs(oids, onLine) {
  return new Promise((done, fail) => {
    const proc = spawn('git', ['cat-file', '--batch'], { stdio: ['pipe', 'pipe', 'inherit'] });
    let buf = Buffer.alloc(0);
    let expect = null;
    proc.stdout.on('data', (chunk) => {
      buf = Buffer.concat([buf, chunk]);
      for (;;) {
        if (expect === null) {
          const nl = buf.indexOf(0x0a);
          if (nl === -1) return;
          const [oid, type, size] = buf.subarray(0, nl).toString('utf8').split(' ');
          buf = buf.subarray(nl + 1);
          if (type !== 'blob') continue;
          expect = { oid, size: Number(size) };
        }
        if (buf.length < expect.size + 1) return;
        const body = buf.subarray(0, expect.size);
        buf = buf.subarray(expect.size + 1); // the newline cat-file appends
        if (!looksBinary(body)) {
          const text = body.toString('utf8');
          if (text.includes('-')) {
            let n = 0;
            for (const line of text.split('\n')) {
              n += 1;
              if (line.length <= 4000) onLine(expect.oid, n, line);
            }
          }
        }
        expect = null;
      }
    });
    proc.stdout.on('end', () => done());
    proc.on('error', fail);
    proc.stdin.end(oids.join('\n') + '\n');
  });
}

async function census() {
  assertFullClone();
  const oids = blobOids();

  const hosts = new Map();
  const bare = new Map(); // value -> { count, kind, sample }
  let linesWithShape = 0;
  let totalMatches = 0;
  const mixedLines = [];
  const widened = [];
  const exemptedTruePositives = [];

  await scanBlobs(oids, (oid, lineNo, line) => {
    CLASS_C.lastIndex = 0;
    const inUrl = [];
    const outside = [];
    let m;
    while ((m = CLASS_C.exec(line)) !== null) {
      const head = URL_HEAD.exec(line.slice(0, m.index));
      (head ? inUrl : outside).push({ value: m[0], host: head ? head[1].toLowerCase() : null });
    }
    if (inUrl.length === 0 && outside.length === 0) return;
    linesWithShape += 1;
    totalMatches += inUrl.length + outside.length;

    for (const x of inUrl) {
      if (!hosts.has(x.host)) hosts.set(x.host, { values: new Set(), occurrences: 0 });
      const e = hosts.get(x.host);
      e.values.add(x.value);
      e.occurrences += 1;
    }
    for (const x of outside) {
      if (!bare.has(x.value)) bare.set(x.value, { count: 0, kind: kindOf(line), sample: line.trim().slice(0, 120) });
      bare.get(x.value).count += 1;
    }

    // Q3: the line-scoped allowance's blind spot, measured rather than feared.
    if (inUrl.length > 0 && outside.length > 0) mixedLines.push({ oid: oid.slice(0, 8), line: lineNo });

    const exemptByProposal = PROPOSED_ALLOWANCE.test(line);
    if (exemptByProposal && !CURRENT_ALLOWANCE.test(line)) {
      // Q4: the proposal is added to an allowance SHARED by all three
      // patterns, so a line it exempts stops being checked for Class A and
      // Class B as well. This is that cost, counted.
      if (CLASS_A.test(line) || CLASS_B.test(line)) {
        widened.push({ oid: oid.slice(0, 8), line: lineNo, sample: line.trim().slice(0, 120) });
      }
      // Q5: and it must exempt no bare value at all.
      for (const x of outside) exemptedTruePositives.push({ oid: oid.slice(0, 8), line: lineNo, value: x.value.slice(0, 8) });
    }
  });

  const byKind = new Map();
  for (const [, e] of bare) byKind.set(e.kind, (byKind.get(e.kind) ?? 0) + 1);

  return {
    scanned_blobs: oids.length,
    lines_with_a_uuid_shape: linesWithShape,
    total_matches: totalMatches,
    q1_in_url_hosts: [...hosts.entries()]
      .map(([host, e]) => ({ host, distinct_values: e.values.size, occurrences: e.occurrences }))
      .sort((a, b) => b.occurrences - a.occurrences),
    q2_bare_distinct: bare.size,
    q2_bare_occurrences: [...bare.values()].reduce((n, e) => n + e.count, 0),
    q2_by_kind: [...byKind.entries()].map(([kind, n]) => ({ kind, distinct_values: n })).sort((a, b) => b.distinct_values - a.distinct_values),
    q2_values: [...bare.entries()].map(([v, e]) => ({ head: v.slice(0, 8), occurrences: e.count, kind: e.kind, sample: e.sample })).sort((a, b) => b.occurrences - a.occurrences),
    q3_mixed_lines: mixedLines,
    q4_widened_lines: widened,
    q5_exempted_true_positives: exemptedTruePositives,
    proposal: { source_hosts: SOURCE_HOSTS, allowance_ere: PROPOSED_ALLOWANCE.source },
  };
}

census()
  .then((r) => {
    if (process.argv.includes('--json')) {
      console.log(JSON.stringify(r, null, 2));
      return;
    }
    console.log(`blobs scanned: ${r.scanned_blobs}`);
    console.log(`lines carrying an 8-4-4-4-12 hex shape: ${r.lines_with_a_uuid_shape}`);
    console.log(`matches in total: ${r.total_matches}`);
    console.log('');
    console.log(`Q1  hosts with a UUID-shaped segment inside an http(s) URL: ${r.q1_in_url_hosts.length}`);
    for (const h of r.q1_in_url_hosts) {
      console.log(`      ${h.host}  ${h.distinct_values} distinct values, ${h.occurrences} occurrences`);
    }
    console.log('');
    console.log(`Q2  values the gate must keep catching: ${r.q2_bare_distinct} distinct, ${r.q2_bare_occurrences} occurrences`);
    for (const k of r.q2_by_kind) console.log(`      ${k.kind}: ${k.distinct_values}`);
    if (process.argv.includes('--kinds')) {
      console.log('');
      for (const v of r.q2_values) console.log(`      ${v.head}  x${String(v.occurrences).padStart(2)}  ${v.kind.padEnd(16)} ${v.sample}`);
    }
    console.log('');
    console.log(`Q3  lines carrying both an in-URL and a bare value (the line-scoped blind spot): ${r.q3_mixed_lines.length}`);
    for (const m of r.q3_mixed_lines.slice(0, 10)) console.log(`      blob ${m.oid} line ${m.line}`);
    console.log('');
    console.log(`Q4  lines the proposal exempts that also carry Class A or Class B: ${r.q4_widened_lines.length}`);
    for (const w of r.q4_widened_lines.slice(0, 10)) console.log(`      blob ${w.oid} line ${w.line}  ${w.sample}`);
    console.log('');
    console.log(`Q5  values from Q2 the proposal would exempt (must be 0): ${r.q5_exempted_true_positives.length}`);
    for (const e of r.q5_exempted_true_positives.slice(0, 10)) console.log(`      ${e.value}... blob ${e.oid} line ${e.line}`);
    console.log('');
    console.log(`proposal allowance (extended regular expression, added to the gate's shared grep -vE):`);
    console.log(`  ${r.proposal.allowance_ere}`);
  })
  .catch((err) => {
    console.error(`uuid-shape-census: ${err.message}`);
    process.exit(2);
  });
