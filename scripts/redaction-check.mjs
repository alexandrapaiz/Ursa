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

function run() {
  const json = process.argv.includes('--json');
  const gate = readGate();
  const findings = [];

  for (const { label, pattern } of gate.pairs) {
    const args = ['-rInE', pattern, '.'];
    for (const d of gate.excludeDirs) args.push(`--exclude-dir=${d}`);
    for (const f of gate.excludeFiles) args.push(`--exclude=${f}`);

    const raw = grepLines(args);
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
    console.log(JSON.stringify({ clean: findings.length === 0, findings }, null, 2));
  } else if (findings.length === 0) {
    console.log(`Redaction gate clean (${gate.pairs.length} patterns, read from the workflow).`);
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
  }

  process.exit(findings.length === 0 ? 0 : 1);
}

run();
