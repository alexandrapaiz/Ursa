#!/usr/bin/env node
// The credential scanner this seat's charter asks for, written down.
//
// WHY THIS EXISTS. The charter's security sweep opens with "scan the
// working tree and the full git history for anything credential-shaped",
// and every run since 2026-10-04 has done it by writing a scanner from
// scratch in the session and throwing it away at teardown. Three costs,
// all of them paid more than once. The pattern set was re-derived each
// time, so "15 pattern classes" in one audit and "14" in another are not
// comparable numbers and nobody can say which class was dropped. The
// validation was re-derived too: the 2026-10-25 audit's F4 is only
// meaningful because that run planted canaries in a throwaway repository
// to prove its scanner could fail, and a reader has no way to re-run
// that proof. And the incremental case, scan what arrived since the last
// clean baseline, was never available, so a 40-minute-old baseline was
// either re-scanned in full or trusted without measurement.
//
// THE RULE THIS FILE IS BUILT AROUND, and the reason it prints less than
// you would expect. The charter: "If you find one: NEVER print, quote, or
// copy the value anywhere, including your PR and logs." So this scanner
// reports a location and a class and never a value, not even truncated,
// not even in --json. F9 of the 2026-10-25 audit is the redaction gate
// doing the opposite: it prints the matching line into a public Actions
// log, so catching a leak publishes it. A scanner is a disclosure surface
// and this one is built not to be.
//
// SHALLOW CLONES ARE AN EXIT 2, NOT A ZERO. A history scan in a depth-1
// clone walks one commit, finds nothing, and exits 0. That zero is
// indistinguishable from a real clean result and it is what this seat was
// handed on 2026-10-25. So --history refuses to run on a shallow clone
// and names tools/ensure-full-clone.sh. L-A55 and L-A77 are the same
// lesson for other commands.
//
// Usage:
//   node tools/secret-scan.mjs                 # tracked working tree
//   node tools/secret-scan.mjs --history       # every blob in every ref
//   node tools/secret-scan.mjs --since=<rev>   # blobs not reachable from <rev>
//   node tools/secret-scan.mjs --json          # same exit codes, JSON out
//   node tools/secret-scan.mjs --patterns      # print the class table and stop
//
// Exit 0 nothing found. Exit 1 at least one hit. Exit 2 the scanner could
// not do its job, which is never reported as clean.
//
// Test seams, documented so nobody mistakes them for configuration:
// --repo=<dir> scans another checkout, which is how the suite plants
// canaries in a throwaway repository and proves this scanner can fail.
//
// No dependencies, no network.

import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

function flag(name) {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : null;
}
const has = (name) => process.argv.includes(`--${name}`);

const REPO = resolve(flag('repo') ?? REPO_ROOT);
const JSON_OUT = has('json');

// The class table. One entry per credential shape, each with the vendor or
// standard it belongs to, so that a count in an audit report means the same
// thing next time. Adding a class is a change to this table and nothing else.
const CLASSES = [
  ['aws-access-key-id', String.raw`\b(?:AKIA|ASIA)[0-9A-Z]{16}\b`],
  ['aws-secret-access-key', String.raw`aws_secret_access_key["'\s]*[=:]["'\s]*[A-Za-z0-9/+=]{40}`],
  ['openai-key', String.raw`\bsk-(?:proj-)?[A-Za-z0-9_-]{32,}\b`],
  ['anthropic-key', String.raw`\bsk-ant-[A-Za-z0-9_-]{24,}\b`],
  ['github-classic-pat', String.raw`\bghp_[A-Za-z0-9]{36}\b`],
  ['github-fine-grained-pat', String.raw`\bgithub_pat_[A-Za-z0-9_]{60,}\b`],
  ['github-scoped-token', String.raw`\b(?:gho|ghu|ghs|ghr)_[A-Za-z0-9]{36}\b`],
  ['slack-token', String.raw`\bxox[abprs]-[0-9A-Za-z-]{12,}\b`],
  ['google-api-key', String.raw`\bAIza[0-9A-Za-z_-]{35}\b`],
  ['private-key-block', String.raw`-----BEGIN (?:RSA |EC |DSA |OPENSSH |PGP )?PRIVATE KEY-----`],
  ['jwt', String.raw`\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}`],
  ['database-url-with-password', String.raw`\b(?:postgres|postgresql|mysql|mongodb|mongodb\+srv)://[^\s:@/"']+:[^\s:@/"']+@`],
  ['queue-or-cache-url-with-password', String.raw`\b(?:redis|rediss|amqp|amqps)://[^\s:@/"']+:[^\s:@/"']+@`],
  ['npm-token', String.raw`\bnpm_[A-Za-z0-9]{36}\b`],
  ['app-password', String.raw`\b(?:app[_-]?password|smtp[_-]?password)["'\s]*[=:]["'\s]*[A-Za-z0-9]{12,}`],
  ['secret-shaped-assignment', String.raw`\b(?:api[_-]?key|api[_-]?secret|client[_-]?secret|access[_-]?token|auth[_-]?token|private[_-]?key)["'\s]*[=:]["'\s]*["'][A-Za-z0-9/+_=-]{24,}["']`],
];

// This file and its suite carry every pattern above as source text, so a
// scan that included them would report itself. The redaction gate solves
// the same problem the same way, by excluding its own definition
// (`--exclude=redaction-gate.yml`). Named here rather than guessed at by a
// heuristic, because a heuristic that excludes too much is a silent no-op.
const SELF = new Set(['tools/secret-scan.mjs', 'tools/secret-scan.test.mjs']);

const COMBINED = new RegExp(CLASSES.map(([, p]) => `(?:${p})`).join('|'));
const PER_CLASS = CLASSES.map(([name, p]) => [name, new RegExp(p)]);

function git(args, opts = {}) {
  return execFileSync('git', ['-C', REPO, ...args], {
    encoding: 'utf8',
    maxBuffer: 512 * 1024 * 1024,
    ...opts,
  });
}

function fail(why, detail) {
  if (JSON_OUT) {
    console.log(JSON.stringify({ ok: false, usable: false, why, detail }, null, 2));
  } else {
    console.error(`secret-scan: cannot do its job: ${why}`);
    if (detail) console.error(`  ${detail}`);
  }
  process.exit(2);
}

// Classify a blob's text. Returns the class names that matched, never the
// matching text. Line numbers are kept because a location is not a value.
function classify(text) {
  if (!COMBINED.test(text)) return [];
  const hits = [];
  const lines = text.split('\n');
  for (const [name, re] of PER_CLASS) {
    for (let i = 0; i < lines.length; i += 1) {
      if (re.test(lines[i])) {
        hits.push({ class: name, line: i + 1 });
        break; // one report per class per blob: a count is not evidence
      }
    }
  }
  return hits;
}

function scanTree() {
  const files = git(['ls-files', '-z']).split('\0').filter(Boolean);
  const hits = [];
  let scanned = 0;
  for (const path of files) {
    if (SELF.has(path)) continue;
    let text;
    try {
      text = git(['show', `HEAD:${path}`]);
    } catch {
      continue; // untracked-at-HEAD or unreadable as text
    }
    scanned += 1;
    for (const hit of classify(text)) hits.push({ where: path, ...hit });
  }
  return { mode: 'tree', scanned, unit: 'tracked files', hits };
}

// A blob this large is not how a credential arrives, and reading every
// one of them into memory is how a scanner becomes unrunnable. Blobs over
// the cap are counted and reported rather than silently dropped, because
// a skipped blob is a hole in the measurement and the reader owns it.
const MAX_BLOB_BYTES = 4 * 1024 * 1024;

// Why --batch and not one `git cat-file` per object: the tree scan spends
// one process per file and takes 47 seconds over 1,830 files. History is
// an order of magnitude more objects, so the same shape would take long
// enough that a run under a job cap would skip the scan, which is the
// failure this tool exists to prevent.
function readBlobs(shas) {
  const out = execFileSync('git', ['-C', REPO, 'cat-file', '--batch'], {
    input: `${shas.join('\n')}\n`,
    maxBuffer: 1024 * 1024 * 1024,
  });
  const blobs = [];
  let at = 0;
  while (at < out.length) {
    const nl = out.indexOf(0x0a, at);
    if (nl === -1) break;
    const header = out.slice(at, nl).toString('utf8');
    const [sha, type, sizeText] = header.split(' ');
    if (type !== 'blob') break; // the caller pre-filtered; a mismatch is a bug
    const size = Number(sizeText);
    const start = nl + 1;
    blobs.push({ sha, text: out.slice(start, start + size).toString('utf8') });
    at = start + size + 1; // git writes one newline after the contents
  }
  return blobs;
}

function scanHistory(since) {
  if (existsSync(join(REPO, '.git', 'shallow'))) {
    fail(
      'this clone is shallow, so a history scan would walk a truncated graph and report clean',
      'run bash tools/ensure-full-clone.sh first, then scan again'
    );
  }
  const args = ['rev-list', '--objects', '--all'];
  if (since) args.push(`^${since}`);
  const listing = git(args).split('\n').filter(Boolean);
  const paths = new Map(); // sha -> first path seen, for reporting
  for (const row of listing) {
    const sp = row.indexOf(' ');
    if (sp === -1) continue; // a commit or a tree root, no path
    const sha = row.slice(0, sp);
    const path = row.slice(sp + 1);
    if (SELF.has(path)) continue;
    if (!paths.has(sha)) paths.set(sha, path);
  }

  // Types and sizes first, in one process, so the fetch below asks only for
  // blobs it intends to read.
  const check = execFileSync('git', ['-C', REPO, 'cat-file', '--batch-check'], {
    input: `${[...paths.keys()].join('\n')}\n`,
    encoding: 'utf8',
    maxBuffer: 256 * 1024 * 1024,
  });
  const wanted = [];
  let oversize = 0;
  for (const row of check.split('\n')) {
    if (!row) continue;
    const [sha, type, sizeText] = row.split(' ');
    if (type !== 'blob') continue;
    if (Number(sizeText) > MAX_BLOB_BYTES) {
      oversize += 1;
      continue;
    }
    wanted.push(sha);
  }

  const hits = [];
  let scanned = 0;
  for (let i = 0; i < wanted.length; i += 500) {
    for (const blob of readBlobs(wanted.slice(i, i + 500))) {
      scanned += 1;
      for (const hit of classify(blob.text)) {
        hits.push({ where: paths.get(blob.sha), blob: blob.sha, ...hit });
      }
    }
  }
  return {
    mode: since ? 'history-since' : 'history',
    since: since ?? null,
    scanned,
    skipped_oversize: oversize,
    unit: 'blobs',
    hits,
  };
}

if (has('patterns')) {
  if (JSON_OUT) console.log(JSON.stringify(CLASSES.map(([n]) => n), null, 2));
  else {
    console.log(`${CLASSES.length} credential pattern classes:`);
    for (const [name] of CLASSES) console.log(`  ${name}`);
  }
  process.exit(0);
}

const since = flag('since');
const result = has('history') || since ? scanHistory(since) : scanTree();
result.classes = CLASSES.length;
result.ok = result.hits.length === 0;

if (JSON_OUT) {
  console.log(JSON.stringify({ usable: true, ...result }, null, 2));
} else {
  const scope = result.since ? `${result.mode} ${result.since}..` : result.mode;
  console.log(
    `secret-scan ${scope}: ${result.scanned} ${result.unit}, ${result.classes} classes, ${result.hits.length} hit(s).`
  );
  for (const hit of result.hits) {
    // Location and class only. The value is never printed. See the header.
    console.log(`  ${hit.class}  ${hit.where}:${hit.line}${hit.blob ? `  blob ${hit.blob.slice(0, 12)}` : ''}`);
  }
  if (!result.ok) {
    console.log('');
    console.log('Do not print, quote or copy the value. Record file, commit and kind,');
    console.log('mark it urgent in the ledger, and say rotation is the owner\'s action.');
  }
}

process.exit(result.ok ? 0 : 1);
