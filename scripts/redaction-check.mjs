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
// What it still cannot do, inherited from the gate and queued as PWC-8:
// its allowance is line-scoped, and it is blind to Class A, verbatim
// human text, which is the class that caused Ursa incident 2. See the
// redaction standard §1.
//
// History, added 2026-10-26 run 14. The gate reads the working tree, so a
// value it catches and a seat then truncates in the next commit stays
// readable at the commit before it, forever, in a public repository. That
// is PWC-8 defect 1 and the gate half is HQ's. This half is ours, and it
// is not hypothetical: swept over `origin/main` on 2026-10-26, 3,732
// reachable text blobs, five carry a full identifier and three of those
// are genuinely private, every one of them already repaired on the tip.
// The mode answers the question the gate cannot ask. It never answers it
// on a shallow clone, because a truncated graph reports clean.
//
// Usage:
//   node scripts/redaction-check.mjs            # exit 1 on a violation
//   node scripts/redaction-check.mjs --json     # same exit code, JSON out
//   node scripts/redaction-check.mjs --history  # every blob reachable
//   node scripts/redaction-check.mjs --history=origin/main   # from a ref
//
// Two more flags exist as test seams and are documented so that nobody
// mistakes them for configuration. `--root=<dir>` scans somewhere other
// than this repository, and `--workflow=<file>` reads the rules from
// somewhere other than the gate. The suite needs both to exercise a dirty
// tree and a gate it cannot parse. In normal use neither is passed.
//
// No dependencies, no network.

import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
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

// ---------------------------------------------------------------- history

const MAX_BLOB_BYTES = 4 * 1024 * 1024; // the figure tools/secret-scan.mjs uses

// Every blob reachable from `ref`, deduplicated by content, with the first
// path it was seen at kept for reporting. A blob is content and a path is
// where it happened to live, so the same leaked line committed twice under
// two names is one finding here and that is the right count.
// ASKED OF GIT, NOT OF THE FILESYSTEM. This tested for `.git/shallow` as a
// path until 2026-10-27. In a linked worktree `.git` is a file and the shallow
// marker lives in the main git directory, so the path test is false in a
// worktree of a shallow clone and the refusal does not fire. `git rev-parse`
// answers the question wherever it is asked from, and it is what
// `tools/ensure-full-clone.sh` and `tools/secret-scan.mjs` both ask. The
// refspec fault that F44 found in `secret-scan.mjs` does not apply here: this
// scan walks one named ref rather than `--all`, so its scope is what the
// caller declared and a narrow refspec cannot quietly shrink it.
function shallowClone() {
  try {
    return (
      execFileSync('git', ['rev-parse', '--is-shallow-repository'], {
        cwd: SCAN_ROOT,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
      }).trim() === 'true'
    );
  } catch {
    return existsSync(join(SCAN_ROOT, '.git', 'shallow'));
  }
}

function historyBlobs(ref, gate) {
  if (shallowClone()) {
    stale(
      `this clone is shallow, so a history scan of ${ref} would walk a truncated graph and report clean. ` +
        'Run bash tools/ensure-full-clone.sh first.'
    );
  }

  let listing;
  try {
    listing = execFileSync('git', ['rev-list', '--objects', ref], {
      cwd: SCAN_ROOT,
      encoding: 'utf8',
      maxBuffer: 256 * 1024 * 1024,
    });
  } catch (err) {
    stale(`git rev-list --objects ${ref} failed: ${(err.stderr ?? err.message).toString().trim().split('\n')[0]}`);
  }

  const excludeDirs = new Set(gate.excludeDirs);
  const excludeFiles = new Set(gate.excludeFiles);
  const paths = new Map(); // sha -> first path seen
  for (const row of listing.split('\n')) {
    const sp = row.indexOf(' ');
    if (sp === -1) continue; // a commit, a tag, or the root tree: no path
    const sha = row.slice(0, sp);
    const path = row.slice(sp + 1);
    // The gate's own exclusions, applied to a path instead of to a walk.
    if (path.split('/').some((seg) => excludeDirs.has(seg))) continue;
    if (excludeFiles.has(path.split('/').pop())) continue;
    if (!paths.has(sha)) paths.set(sha, path);
  }

  const check = execFileSync('git', ['cat-file', '--batch-check'], {
    cwd: SCAN_ROOT,
    encoding: 'utf8',
    input: `${[...paths.keys()].join('\n')}\n`,
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
  return { paths, wanted, oversize };
}

// Read one batch of blobs out of `git cat-file --batch`, which answers
// `<sha> blob <size>\n<contents>\n` per request.
function readBlobs(shas) {
  const out = execFileSync('git', ['cat-file', '--batch'], {
    cwd: SCAN_ROOT,
    input: `${shas.join('\n')}\n`,
    maxBuffer: 512 * 1024 * 1024,
  }); // no encoding: a blob is bytes until a NUL scan says it is text
  const blobs = [];
  let at = 0;
  while (at < out.length) {
    const nl = out.indexOf(0x0a, at);
    if (nl === -1) break;
    const [sha, type, sizeText] = out.slice(at, nl).toString('utf8').split(' ');
    if (type !== 'blob') break;
    const size = Number(sizeText);
    const start = nl + 1;
    blobs.push({ sha, bytes: out.slice(start, start + size) });
    at = start + size + 1; // git writes one newline after the contents
  }
  return blobs;
}

// grep stays the authority on what matches, here as in tree mode, because
// the gate's patterns are POSIX extended regular expressions and this file
// must not re-dialect them into JavaScript.
//
// Every text line in history goes into one stream and `grep -n` numbers it,
// so the output's own line number is the index back into the table. Nothing
// is prefixed onto the input. An earlier draft of this mode framed each
// line with a sentinel and an id, and its own test caught the flaw: a gate
// pattern that matches a digit matches the framing, so the framing can
// manufacture a finding. grep's `-n` happens after the match and cannot.
//
// `r` and `I` are dropped from the gate's cluster and the rest is kept. `r`
// has no meaning on a stream. `I` decides binary handling, which happens
// here on a NUL scan per blob so the answer is per blob the way the gate's
// is per file, rather than per pipe. Anything else the gate passes, now or
// later, still reaches grep, because those flags are what the patterns mean.
function grepNumbered(pattern, flags, input) {
  const res = spawnSync('grep', [`${flags.replace(/[rI]/g, '')}n`, '-e', pattern], {
    input,
    encoding: 'utf8',
    maxBuffer: 256 * 1024 * 1024,
    env: { ...process.env, LC_MESSAGES: 'C' },
  });
  if (res.error) throw res.error;
  if (res.status !== 0 && res.status !== 1) {
    stale(`grep exited ${res.status}: ${(res.stderr ?? '').trim().split('\n')[0]}`);
  }
  const out = [];
  for (const row of (res.stdout ?? '').split('\n')) {
    const colon = row.indexOf(':');
    if (colon === -1) continue;
    const n = Number(row.slice(0, colon));
    if (Number.isInteger(n) && n > 0) out.push(n - 1);
  }
  return out;
}

// One grep per blob, exit status only, for the binary case. Reached only
// when the gate has dropped `-I`, which PWC-13 asks HQ to do; while the
// flag is there this is never called. It is a process per blob and that is
// the price of asking the question per blob instead of per pipe.
function grepMatchesBytes(pattern, flags, bytes) {
  const res = spawnSync('grep', [`${flags.replace(/[rnI]/g, '')}q`, '-e', pattern], {
    input: bytes,
    maxBuffer: 1024,
    env: { ...process.env, LC_MESSAGES: 'C' },
  });
  if (res.error) throw res.error;
  if (res.status !== 0 && res.status !== 1) {
    stale(`grep exited ${res.status} on a binary blob`);
  }
  return res.status === 0;
}

function scanHistory(ref, gate) {
  const { paths, wanted, oversize } = historyBlobs(ref, gate);
  const skipBinary = gate.flags.includes('I');

  // Read once, scan three times. The expensive part is the objects, so the
  // stream is built once and every pattern runs over the same one.
  const frames = [];
  const lines = [];
  const binaries = [];
  let scanned = 0;
  for (let i = 0; i < wanted.length; i += 500) {
    for (const blob of readBlobs(wanted.slice(i, i + 500))) {
      scanned += 1;
      if (blob.bytes.includes(0)) {
        // The gate's `-I`: a binary file is treated as holding no match.
        if (!skipBinary) binaries.push(blob);
        continue;
      }
      const text = blob.bytes.toString('utf8').split('\n');
      for (let n = 0; n < text.length; n += 1) {
        frames.push({ sha: blob.sha, line: String(n + 1), text: text[n] });
        lines.push(text[n]);
      }
    }
  }
  const stream = `${lines.join('\n')}\n`;

  const findings = [];
  for (const { label, pattern } of gate.pairs) {
    const hit = grepNumbered(pattern, gate.flags, stream).map((i) => frames[i]).filter(Boolean);
    // Without a line number and without matched text, which is the same
    // location-only shape the gate prints for a binary file.
    for (const blob of binaries) {
      if (grepMatchesBytes(pattern, gate.flags, blob.bytes)) {
        hit.push({ sha: blob.sha, line: '-', text: '' });
      }
    }
    if (hit.length === 0) continue;

    // The gate's own allowance, applied with the gate's own tool, over the
    // same `path:line:text` shape tree mode builds. A blob's path is the
    // first one it was seen at, which is what the gate would have filtered
    // on when the commit was made.
    const shaped = hit.map((c) => `${paths.get(c.sha)}:${c.line}:${c.text}`);
    let kept = shaped;
    const allow = spawnSync('grep', ['-vE', gate.allowance], {
      input: `${shaped.join('\n')}\n`,
      encoding: 'utf8',
      maxBuffer: 256 * 1024 * 1024,
    });
    if (allow.status === 0) kept = (allow.stdout ?? '').split('\n').filter((l) => l !== '');
    else if (allow.status === 1) kept = [];
    else stale(`grep -vE exited ${allow.status} applying the gate's allowance`);

    // Survivors are matched back by the whole shaped line rather than by a
    // parsed prefix, because a path can contain a colon and two blobs can
    // share a path and a line number. Identical strings get identical
    // verdicts from the allowance, so equality is the exact join here.
    const allowed = new Set(kept);
    const out = hit
      .filter((c, i) => allowed.has(shaped[i]))
      .map((c) => ({ file: paths.get(c.sha), line: c.line, blob: c.sha.slice(0, 8) }));
    if (out.length > 0) findings.push({ label, pattern, hits: out });
  }

  return { findings, scanned, oversize, binary: binaries.length, blobs: wanted.length };
}

// Print findings the way tree mode does: the file and the line and the
// gate's instruction, never the matched text, because the hit line is the
// private value this whole mechanism exists to stop republishing.
function report(findings, trailer) {
  for (const f of findings) {
    console.error(`error: ${f.label}`);
    for (const hit of f.hits.slice(0, 20)) {
      console.error(hit.blob ? `  ${hit.file}:${hit.line} (blob ${hit.blob})` : `  ${hit.file}:${hit.line}`);
    }
    if (f.hits.length > 20) console.error(`  ... and ${f.hits.length - 20} more`);
  }
  console.error(trailer);
}

function runHistory(ref, json) {
  const gate = readGate();
  const { findings, scanned, oversize, binary, blobs } = scanHistory(ref, gate);
  const total = findings.reduce((n, f) => n + f.hits.length, 0);

  if (json) {
    console.log(
      JSON.stringify(
        { mode: 'history', ref, clean: total === 0, scanned, blobs, oversize, binary, findings },
        null,
        2
      )
    );
  } else if (total === 0) {
    console.log(
      `Redaction history clean: ${scanned} blob(s) reachable from ${ref}, ${gate.pairs.length} patterns, read from the workflow.`
    );
  } else {
    report(
      findings,
      `${total} hit(s) in history reachable from ${ref}. The gate reads the working tree, so these are ` +
        'already past it and a tip-tree fix does not reach them. Rewriting published history is the ' +
        "owner's call; see docs/security/redaction-standard.md."
    );
  }
  if (oversize > 0) console.error(`note: ${oversize} blob(s) over 4 MiB were not read.`);
  process.exit(total === 0 ? 0 : 1);
}

function run() {
  const json = process.argv.includes('--json');
  const historyRef = flag('history') ?? (process.argv.includes('--history') ? 'HEAD' : null);
  if (historyRef !== null) return runHistory(historyRef, json);
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
