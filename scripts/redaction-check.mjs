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
// This script reads the patterns, the exclusions, the allowance AND the
// grep flags out of the workflow, so there is nothing here to drift. If
// the workflow changes shape so that any of them cannot be found, this
// exits 2 and says so, rather than passing an empty set of checks and
// reporting clean. A checker that can silently become a no-op is worse
// than none.
//
// The flags were hardcoded as `-rInE` until 2026-10-26 run 13, and the
// paragraph above claimed they were read. That was the drift this file
// exists to prevent, arriving in the one field nobody was watching: `-I`
// tells grep to treat a binary file as if it held no match, PWC-13 asks
// HQ to drop it, and on the day it lands a checker with its own `-I`
// reports clean on a tree the gate rejects. Verified both ways against a
// one pixel PNG carrying a fabricated path and identifier.
//
// The second half of the same defect: GNU grep announces a binary hit on
// standard error and prints nothing on standard output, so reading only
// standard output catches nothing even with the right flags. Both streams
// are read now, the notice is turned into a location-only finding, and
// anything else grep says on standard error exits 2 rather than being
// swallowed, because a partial scan is not a clean one.
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

import { execFileSync, spawnSync } from 'node:child_process';
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

  // The flag cluster the gate passes to grep. Read, never assumed: see the
  // header. `r`, `n` and `E` are required because this script parses
  // `file:line` out of the output and hands the gate's own extended
  // regular expressions to it, so a gate that dropped one of the three
  // would make this script's parsing wrong rather than merely stale.
  const flagMatch = yml.match(/\bgrep\s+(-[A-Za-z]+)\s+"\$pattern"/);
  if (!flagMatch) stale('found no `grep -<flags> "$pattern"` invocation');
  const flags = flagMatch[1];
  for (const required of ['r', 'n', 'E']) {
    if (!flags.includes(required)) {
      stale(`the gate's grep flags \`${flags}\` no longer include -${required}`);
    }
  }

  const excludeDirs = [...yml.matchAll(/--exclude-dir=([^\s\\]+)/g)].map(([, d]) => d);
  const excludeFiles = [...yml.matchAll(/--exclude=([^\s\\]+)/g)].map(([, f]) => f);
  if (excludeDirs.length === 0) stale('found no --exclude-dir arguments');

  // The gate's line-scoped allowance: grep -vE '<ere>'
  const allowMatch = yml.match(/grep\s+-vE\s+'([^']+)'/);
  if (!allowMatch) stale("found no `grep -vE '<allowance>'` filter");

  return { pairs, flags, excludeDirs, excludeFiles, allowance: allowMatch[1] };
}

// `grep` exits 1 when it matches nothing, which is not an error here.
//
// Both streams, because a binary hit is announced on standard error and
// produces no line on standard output. `LC_MESSAGES=C` so the notice is
// the English sentence this parses and not a translation of it.
const BINARY_NOTE = ': binary file matches';

function grepStreams(args) {
  const res = spawnSync('grep', args, {
    cwd: SCAN_ROOT,
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
    env: { ...process.env, LC_MESSAGES: 'C' },
  });
  if (res.error) throw res.error;
  if (res.status !== 0 && res.status !== 1) {
    // grep's 2 is "an error occurred", which with a readable tree means a
    // bad pattern or a bad flag, both of which come from the gate.
    stale(`grep exited ${res.status}: ${(res.stderr ?? '').trim().split('\n')[0]}`);
  }

  // `grep: ./x.png: binary file matches` carries the path, no line number
  // and no matched text, which is exactly the location-only shape the
  // redaction standard asks for. Synthesise it into the `file:line:text`
  // shape the rest of this script already handles, with `-` for the line.
  const binary = [];
  const unexplained = [];
  for (const line of (res.stderr ?? '').split('\n')) {
    if (line === '') continue;
    if (line.endsWith(BINARY_NOTE)) {
      const body = line.slice(0, -BINARY_NOTE.length);
      const sep = body.indexOf(': ');
      binary.push(`${sep === -1 ? body : body.slice(sep + 2)}:-:binary file matches`);
    } else {
      unexplained.push(line);
    }
  }
  if (unexplained.length > 0) {
    // Measured over this whole repository on 2026-10-26, all three gate
    // patterns, no -I: zero lines. So this is not a channel that is noisy
    // in normal use, and a line here means part of the tree went unread.
    stale(`grep wrote to standard error: ${unexplained[0]}`);
  }

  const stdout = res.stdout ?? '';
  return binary.length === 0 ? stdout : stdout + binary.join('\n') + '\n';
}

// Hits in files git ignores, dropped.
//
// Why this is not a loophole: the gate runs on a fresh checkout, where an
// ignored path does not exist. So a hit in one is a finding this script
// invents and the gate can never make, and every one of them is a reason
// not to run this script again.
//
// That is not hypothetical. On 2026-10-26 the frontend seat turned the gate
// red three times in twenty-five minutes on a fabricated session id, which
// is exactly what this script is for, and the script was not run. Pointed
// at that tree afterwards it reported two violations, both inside
// `ursa-major/overlay/.next/`, which is build output, gitignored, and
// regenerated by the `next build` this seat's charter orders it to run
// every time. So the one tool that could have caught the real thing cried
// wolf on every single run of the seat that most needed it, and the real
// hit would have arrived as a third line under two it had learned to
// scroll past. A checker that is wrong whenever you have built the app is
// a checker nobody runs.
//
// Untracked files that git does NOT ignore are still reported, which is the
// case that matters: a new file about to be committed is exactly what this
// is for. Only "git would never let this near the gate" is dropped.
//
// `git check-ignore -z --stdin` answers in one process for the whole list.
// If git is not available or the scan root is not a repository it throws,
// and this returns everything rather than silently passing, because a
// filter that can become a no-op the wrong way is worse than no filter.
function dropGitIgnored(lines) {
  if (lines.length === 0) return { hits: lines, ignored: 0 };
  const paths = lines.map((l) => l.slice(0, l.indexOf(':')));
  let ignoredSet;
  try {
    const out = execFileSync('git', ['check-ignore', '-z', '--stdin'], {
      cwd: SCAN_ROOT,
      encoding: 'utf8',
      input: paths.join('\0'),
      maxBuffer: 64 * 1024 * 1024,
    });
    ignoredSet = new Set(out.split('\0').filter((p) => p !== ''));
  } catch (err) {
    // exit 1 is git's "none of them are ignored", which is not an error.
    if (err.status === 1) return { hits: lines, ignored: 0 };
    return { hits: lines, ignored: 0 };
  }
  const hits = lines.filter((l, i) => !ignoredSet.has(paths[i]));
  return { hits, ignored: lines.length - hits.length };
}

function run() {
  const json = process.argv.includes('--json');
  const gate = readGate();
  const findings = [];
  let skipped = 0;

  for (const { label, pattern } of gate.pairs) {
    const args = [gate.flags, pattern, '.'];
    for (const d of gate.excludeDirs) args.push(`--exclude-dir=${d}`);
    for (const f of gate.excludeFiles) args.push(`--exclude=${f}`);

    const raw = grepStreams(args);
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

    const all = kept.split('\n').filter((l) => l !== '');
    const { hits, ignored } = dropGitIgnored(all);
    skipped += ignored;
    if (hits.length > 0) findings.push({ label, pattern, hits });
  }

  // Say what was dropped, every time, including on a clean run. A filter
  // nobody can see is a filter nobody can audit, and this one stands
  // between the seat and a gate that exists because of a real leak.
  const note = skipped === 0 ? '' : ` ${skipped} hit${skipped === 1 ? '' : 's'} in gitignored paths not counted; the gate runs on a fresh checkout and cannot see them.`;

  if (json) {
    console.log(JSON.stringify({ clean: findings.length === 0, findings, ignoredHits: skipped }, null, 2));
  } else if (findings.length === 0) {
    console.log(`Redaction gate clean (${gate.pairs.length} patterns, read from the workflow).${note}`);
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
    if (note) console.error(`note:${note}`);
  }

  process.exit(findings.length === 0 ? 0 : 1);
}

run();
