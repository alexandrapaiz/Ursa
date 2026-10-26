#!/usr/bin/env node
// The redaction gate, runnable before you push.
//
// Why this exists: on 2026-10-25 this seat's own run turned the gate red
// five times in eleven minutes. Every failure was the same line of the
// same file, a full session id quoted as evidence in an audit report, and
// every one of them cost a push, a CI run, and a red mark on the board
// before the agent could see it. The gate's three patterns lived only
// inside `.github/workflows/redaction-gate.yml`, so there was no way to
// ask the question locally. docs/security/redaction-standard.md §7 says
// the standard "does not install anything". This is the part that can be
// installed without the `workflows` permission the runner does not have.
//
// What it does NOT do: define the rules. The workflow is the authority.
// This script reads the patterns out of the workflow and shells out to the
// same `grep -rInE`, so there is nothing here to drift. If the workflow
// changes shape so that the patterns cannot be found, this exits 2 and
// says so, rather than passing an empty set of checks and reporting
// clean. A checker that can silently become a no-op is worse than none.
//
// What it still cannot do, both inherited from the gate and queued as
// PWC-8: it reads the working tree and not history, and its allowance is
// line-scoped. And it is blind to Class A, verbatim human text, which is
// the class that caused Ursa incident 2. See the redaction standard §1.
//
// Which files it answers about, which is not the same set the gate reads
// and was not the same set this script read until 2026-10-26. The gate
// runs on `actions/checkout@v4`, so the only files it can see are the ones
// the branch carries. This script runs in a live working tree, where there
// are also ignored files, and it was grepping those too and then reporting
// "the gate would fail" about files the gate will never be shown. That is
// a false red, and a false red on a checker a run is told to trust before
// pushing is how the checker stops being used. It arrived the day the
// repository started telling runs to write scratch under `.scratch/`: the
// next run put a board read there and this script failed on it.
//
// So in a git work tree it asks git for the file set instead of walking
// the directory: tracked files plus untracked files that are not ignored,
// which is exactly what the branch will carry once the run commits what it
// has. Ignored paths are out, and that includes `ursa-major/trial/*/`,
// real outcome records that the gitignore exists to keep uncommitted and
// that carry session-shaped ids on purpose.
//
// Outside a git work tree it walks the directory as before, and either way
// it prints which of the two it did, because a checker whose verdict has a
// scope should say what the scope was. The one case still outside both: a
// violation that is committed and then edited out of the working tree
// without committing. The gate reads the commit, this reads the file, so
// this says clean and the gate says no. The question this answers is "if I
// commit what I have, does the gate pass", which is the question a run has
// before it pushes, and not "does the gate pass on what I committed".
//
// Usage:
//   node scripts/redaction-check.mjs            # exit 1 on a violation
//   node scripts/redaction-check.mjs --json     # same exit code, JSON out
//
// Two more flags exist as test seams and are documented so that nobody
// mistakes them for configuration. `--root=<dir>` scans somewhere other
// than this repository, and `--workflow=<file>` reads the rules from
// somewhere other than the gate. The suite needs both to exercise a dirty
// tree and a gate it cannot parse. In normal use neither is passed.
//
// No dependencies, no network.

import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

function flag(name) {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : null;
}

const SCAN_ROOT = resolve(flag('root') ?? REPO_ROOT);
const WORKFLOW = resolve(
  flag('workflow') ?? join(REPO_ROOT, '.github', 'workflows', 'redaction-gate.yml')
);

// Exit 2 means "this checker could not do its job", which is distinct from
// exit 1, "the tree is dirty". Both are failures; only one is about the tree.
function stale(why) {
  console.error(
    `redaction-check: cannot read the gate's rules from ${WORKFLOW.replace(REPO_ROOT + '/', '')}`
  );
  console.error(`  ${why}`);
  console.error('  The workflow is the authority and this script only mirrors it.');
  console.error('  Fix this script to match the workflow, or run the gate on a push.');
  process.exit(2);
}

// Pull the gate's own grep invocation apart. Textual on purpose: the repo
// has no YAML parser and this needs no dependency to read four fields.
function readGate() {
  let yml;
  try {
    yml = readFileSync(WORKFLOW, 'utf8');
  } catch (err) {
    stale(`${err.code === 'ENOENT' ? 'the file is missing' : err.message}`);
  }

  // scan "<label>" \
  //      '<extended regular expression>'
  const pairs = [...yml.matchAll(/scan\s+"([^"]+)"\s*\\\s*\n\s*'([^']+)'/g)].map(
    ([, label, pattern]) => ({ label, pattern })
  );
  if (pairs.length === 0) stale('found no `scan "label" \\ \'pattern\'` calls');

  const excludeDirs = [...yml.matchAll(/--exclude-dir=([^\s\\]+)/g)].map(([, d]) => d);
  const excludeFiles = [...yml.matchAll(/--exclude=([^\s\\]+)/g)].map(([, f]) => f);
  if (excludeDirs.length === 0) stale('found no --exclude-dir arguments');

  // The gate's line-scoped allowance: grep -vE '<ere>'
  const allowMatch = yml.match(/grep\s+-vE\s+'([^']+)'/);
  if (!allowMatch) stale("found no `grep -vE '<allowance>'` filter");

  return { pairs, excludeDirs, excludeFiles, allowance: allowMatch[1] };
}

// `grep` exits 1 when it matches nothing, which is not an error here.
function grepLines(args) {
  try {
    return execFileSync('grep', args, {
      cwd: SCAN_ROOT,
      encoding: 'utf8',
      maxBuffer: 64 * 1024 * 1024,
    });
  } catch (err) {
    if (err.status === 1) return '';
    throw err;
  }
}

// The file set, when SCAN_ROOT is a git work tree: tracked plus untracked
// and not ignored, which is what the branch will carry once the run commits
// what it has. Returns null when SCAN_ROOT is not a work tree, which is the
// `--root=` test seam and any directory a person points this at by hand.
function gitFileSet() {
  let out;
  try {
    out = execFileSync(
      'git',
      ['ls-files', '-z', '--cached', '--others', '--exclude-standard'],
      { cwd: SCAN_ROOT, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, stdio: ['ignore', 'pipe', 'ignore'] }
    );
  } catch {
    return null;
  }
  return out.split('\0').filter((p) => p !== '');
}

// The gate's exclusions, applied to an explicit file list. `--exclude-dir`
// and `--exclude` are honoured by this grep for command-line arguments as
// well as for `-r`, but that is a property of one grep and not of the flag,
// and the one name the gate excludes is the workflow that holds the
// patterns, so a miss here reports the rules as a violation of themselves.
// Filtered here as well, on purpose, rather than bet the verdict on it.
function applyExclusions(files, { excludeDirs, excludeFiles }) {
  const dirs = new Set(excludeDirs);
  const names = new Set(excludeFiles);
  return files.filter((p) => {
    const parts = p.split('/');
    if (parts.some((seg) => dirs.has(seg))) return false;
    return !names.has(parts[parts.length - 1]);
  });
}

// One grep per batch: a few thousand paths is well inside this platform's
// argument limit, but the tracked set grows and an E2BIG here would look
// like a crash rather than a verdict.
function* batches(items, size) {
  for (let i = 0; i < items.length; i += size) yield items.slice(i, i + size);
}

function run() {
  const json = process.argv.includes('--json');
  const gate = readGate();
  const findings = [];

  const tracked = gitFileSet();
  const files = tracked === null ? null : applyExclusions(tracked, gate);
  // Same rule as a gate whose patterns cannot be found: scanning nothing is
  // not a clean verdict. Exit 2 is "I could not do my job".
  if (files !== null && files.length === 0) {
    console.error('redaction-check: git reported no files to scan in this work tree');
    console.error('  Scanning nothing is not the same as being clean, so this is exit 2.');
    process.exit(2);
  }
  const scope =
    files === null
      ? 'walked the directory (not a git work tree)'
      : `${files.length} files git would carry (tracked plus untracked, ignored paths out)`;

  for (const { label, pattern } of gate.pairs) {
    const exclusions = [
      ...gate.excludeDirs.map((d) => `--exclude-dir=${d}`),
      ...gate.excludeFiles.map((f) => `--exclude=${f}`),
    ];

    let raw;
    if (files === null) {
      raw = grepLines(['-rInE', pattern, '.', ...exclusions]);
    } else {
      // `-H` because grep omits the filename when it is given exactly one
      // file, and a batch of one would then print `<line>:<text>`, which
      // this script's reporter would read as a filename.
      raw = '';
      for (const batch of batches(files, 500)) {
        raw += grepLines(['-HInE', pattern, ...exclusions, '--', ...batch]);
      }
    }
    if (raw === '') continue;

    // Apply the gate's own allowance with the gate's own tool, so the
    // extended-regex dialect is grep's and not JavaScript's.
    let kept = raw;
    try {
      kept = execFileSync('grep', ['-vE', gate.allowance], {
        cwd: SCAN_ROOT,
        encoding: 'utf8',
        input: raw,
        maxBuffer: 64 * 1024 * 1024,
      });
    } catch (err) {
      if (err.status === 1) kept = '';
      else throw err;
    }

    const hits = kept.split('\n').filter((l) => l !== '');
    if (hits.length > 0) findings.push({ label, pattern, hits });
  }

  if (json) {
    console.log(JSON.stringify({ clean: findings.length === 0, scope, findings }, null, 2));
  } else if (findings.length === 0) {
    console.log(`Redaction gate clean (${gate.pairs.length} patterns, read from the workflow).`);
    console.log(`  Scope: ${scope}.`);
  } else {
    for (const f of findings) {
      console.error(`error: ${f.label}`);
      // Never reprint more than the gate does. The hit line can itself
      // carry the private value this gate exists to stop, so this prints
      // file and line and the gate's instruction, not the matched text.
      for (const hit of f.hits.slice(0, 20)) {
        const [file, line] = hit.split(':', 2);
        console.error(`  ${file}:${line}`);
      }
      if (f.hits.length > 20) console.error(`  ... and ${f.hits.length - 20} more`);
    }
    console.error(
      'Redaction gate would fail. See docs/security/redaction-standard.md and Ursa incident 4.'
    );
    console.error(`  Scope: ${scope}.`);
  }

  process.exit(findings.length === 0 ? 0 : 1);
}

run();
