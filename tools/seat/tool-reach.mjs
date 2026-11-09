#!/usr/bin/env node
// The tool-reach sweep, compiled: every tool path a standard or charter names,
// graded against every root this host actually has.
//
//     node tools/seat/tool-reach.mjs                # the default binding + context set
//     node tools/seat/tool-reach.mjs --file F       # grade F as binding
//     node tools/seat/tool-reach.mjs --context F    # grade F as narrative, not binding
//     node tools/seat/tool-reach.mjs --ref R        # resolve `parked` against git ref R
//     node tools/seat/tool-reach.mjs --roots        # print the root set and exit
//     node tools/seat/tool-reach.mjs --json
//     node tools/seat/tool-reach.mjs --gate         # exit 1 iff a BINDING file names a `missing`
//
// Exit 0 the sweep ran and (under --gate) no binding file names a missing tool.
// Exit 1 --gate and a binding miss. Exit 2 usage. Exit 3 the question cannot be
// answered from here — no readable input, or no tool path in any of it. Three is
// never zero, for the reason read-dates.mjs and outage.mjs both give: this
// tool's subject is an absence, so a silent instrument and a clean repository
// have the same shape and must not print the same thing.
//
// READ-ONLY. No network. Filesystem and `git cat-file` only.
//
// WHY THIS EXISTS, AND THE FIFTH STATE IT WAS WRITTEN FOR
//
// `prompts/exo-agent.md` §3 has carried this sweep as prose since 2026-10-18,
// and the prose has been corrected three times, each time by a window that
// re-derived it by hand:
//
//   - 2026-10-18, fifteenth window: split the count, because `lessons.md` is
//     HQ's narrative register and a tool named in an account of another
//     repository's history was never addressed here. Two numbers, never one.
//   - 2026-10-24, twenty-seventh window: resolve the BASENAME before calling a
//     tool missing, because Ursa deliberately vendored `merge-register.py` at
//     `tools/registers/merge-register.py` and the exact-path form called it
//     absent forever. Three states: present, vendored elsewhere, missing.
//   - 2026-11-02, eightieth window: a fourth state, `parked`, for a tool that
//     merges in the same breath as the clause naming it — which is every tool
//     named by a charter read from a pull request while the worktree is `main`.
//
// All three are right and all three are still a shell pipeline in a prose file,
// so each window pays for them again. The ninety-seventh window, 2026-11-09,
// paid it once more and the payment turned up the FIFTH state:
//
//     docs/standards/pm.md names `tools/ship_first.py` in binding text — it is
//     the counter for the only deadline in that standard that is counted
//     rather than asserted. The file is not in this repository, not under a
//     vendored basename, not parked in any charter branch, and NOT IN HQ'S
//     `tools/`. The standard says where it is in its own sentence: "in
//     alexandria's repository". It is on this host, at
//     /srv/asc/repos/alexandria/tools/ship_first.py, 18,629 bytes, and it runs.
//
// So the prose sweep's verdict on it was `BINDING-MISSING`, which routes to HQ
// and is wrong twice over: HQ does not have the file, and the file is eight
// directories away. Twenty-two days of that verdict, and no window has ever run
// the one instrument the merge standard appoints as its own authority.
//
// THE GENERAL DEFECT, WHICH IS THE PART WORTH KEEPING. The sweep resolves a
// path against a ROOT SET, and every correction above widened the STATE
// vocabulary while leaving the root set at one. `INC-2026-11-02-the-tool-reach-sweep-resolved-against-one-of-three-roots-for-fifteen-days`
// named exactly this and then fixed one root — HQ's. This host has five roots
// carrying a `tools/` directory. A sweep that resolves against two of five
// reports three roots' worth of present tools as missing, and the report reads
// as a routing finding rather than as a short root set.
//
// So: the root set is DISCOVERED, and it is printed with every reading, in
// every mode, including --json. A reading whose root set is implicit cannot be
// compared against the next window's, because the number moves when the host
// changes and nothing says so.
//
// AND `elsewhere` IS NOT ONE STATE. Where the tool turned up decides the route:
//
//   - under HQ's root      -> routing is already done; the standard's path is
//                             HQ's path and that is `INC-2026-10-18-hq-tool-paths-are-hq-s`,
//                             a known and accepted shape. Not a finding.
//   - under a SIBLING      -> a binding standard handed to eleven companies
//     product's root         names a tool exactly one of them owns. Every other
//                            company's sweep reports it missing, forever, and
//                            the remedy is neither "vendor it" nor "route it to
//                            HQ". THIS IS A FINDING and it is the one the four
//                            prose states had no word for.
//
// A tool under a sibling root is reported with the root named and the command
// that would run it, because the cheapest correct act on finding one is to run
// it, and the second cheapest is to tell the repository that owns it.

import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, basename, resolve } from 'node:path';

export const TOOL_RE = /\btools\/[A-Za-z0-9._/-]+\.(?:sh|mjs|js|py|json)\b/g;

// Files addressed to a seat HERE as procedure. A tool name in one of these is a
// command this repository is expected to run, so its absence is the defect.
export const BINDING = ['docs/standards/pm.md', 'docs/standards/secrets.md'];
// HQ's portfolio narrative register. A tool name here is almost always part of
// an account of something that happened in another repository. Context only.
export const CONTEXT = ['docs/standards/lessons.md'];

// Only `missing` and `sibling-repo` route anywhere. The order is the order a
// report prints them in, worst first, and the set is asserted in the test file
// rather than trusted, because a sixth state added without a route is a row a
// reader will read as handled.
export const STATES = [
  'missing', 'sibling-repo', 'parked', 'vendored-elsewhere', 'hq-root', 'present',
];

const HOST_ROOT_DIRS = ['/srv/asc/hq', '/srv/asc/repos'];

function usage(code) {
  process.stderr.write(
    'usage: node tools/seat/tool-reach.mjs [--file F]... [--context F]...\n' +
    '                                      [--ref R] [--roots] [--json] [--gate]\n');
  process.exit(code);
}

// The root set, discovered rather than listed, because the listed form is what
// has been short every time. A root counts when it carries a `tools/` directory;
// anything else cannot answer a `tools/...` path and padding the set with it
// would make the printed root count a worse description of the reading.
export function hostRoots(selfRoot) {
  const out = [];
  const seen = new Set();
  const add = (dir, kind) => {
    const r = resolve(dir);
    if (seen.has(r) || r === resolve(selfRoot)) return;
    if (!existsSync(join(r, 'tools'))) return;
    seen.add(r);
    out.push({ root: r, kind, name: basename(r) });
  };
  for (const d of HOST_ROOT_DIRS) {
    if (!existsSync(d)) continue;
    let st; try { st = statSync(d); } catch { continue; }
    if (!st.isDirectory()) continue;
    if (existsSync(join(d, 'tools'))) { add(d, 'hq'); continue; }
    let kids = []; try { kids = readdirSync(d); } catch { continue; }
    for (const k of kids.sort()) {
      const p = join(d, k);
      let ks; try { ks = statSync(p); } catch { continue; }
      if (ks.isDirectory()) add(p, 'repo');
    }
  }
  // Which of the discovered roots is HQ is a question about the remote, not
  // about the directory's name, so ask git rather than matching a string.
  for (const r of out) {
    if (r.kind === 'hq') continue;
    let url = '';
    try {
      url = execFileSync('git', ['-C', r.root, 'remote', 'get-url', 'origin'],
        { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
    } catch { /* not a checkout, or no origin; leave it a sibling */ }
    if (/alexandra-systems(\.git)?$/.test(url)) r.kind = 'hq';
    r.origin = url;
  }
  return out;
}

export function namesIn(file) {
  let text;
  try { text = readFileSync(file, 'utf8'); } catch { return null; }
  return [...new Set(text.match(TOOL_RE) || [])].sort();
}

// A basename hit is only meaningful inside this repository's own `tools/`, which
// is the surface a deliberate re-vendoring lands on.
export function vendoredElsewhere(path, selfRoot) {
  const want = basename(path);
  const walk = (dir) => {
    let kids = []; try { kids = readdirSync(dir, { withFileTypes: true }); } catch { return null; }
    for (const k of kids) {
      const p = join(dir, k.name);
      if (k.isDirectory()) { const hit = walk(p); if (hit) return hit; }
      else if (k.name === want) return p;
    }
    return null;
  };
  const hit = walk(join(selfRoot, 'tools'));
  return hit ? hit.slice(selfRoot.length + 1) : null;
}

function parkedAt(path, ref) {
  if (!ref) return false;
  try {
    execFileSync('git', ['cat-file', '-e', `${ref}:${path}`],
      { stdio: 'ignore' });
    return true;
  } catch { return false; }
}

export function classify(path, { selfRoot, roots, ref }) {
  if (existsSync(join(selfRoot, path))) return { state: 'present', where: path };
  const vend = vendoredElsewhere(path, selfRoot);
  if (vend) return { state: 'vendored-elsewhere', where: vend };
  if (parkedAt(path, ref)) return { state: 'parked', where: `${ref}:${path}` };
  for (const r of roots) {
    if (existsSync(join(r.root, path))) {
      return {
        state: r.kind === 'hq' ? 'hq-root' : 'sibling-repo',
        where: join(r.root, path), root: r.root, rootName: r.name,
      };
    }
  }
  return { state: 'missing', where: null };
}

function main(argv) {
  const opt = { files: [], context: [], ref: null, json: false, gate: false, roots: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--file') { const v = argv[++i]; if (!v) usage(2); opt.files.push(v); }
    else if (a === '--context') { const v = argv[++i]; if (!v) usage(2); opt.context.push(v); }
    else if (a === '--ref') { const v = argv[++i]; if (!v) usage(2); opt.ref = v; }
    else if (a === '--json') opt.json = true;
    else if (a === '--gate') opt.gate = true;
    else if (a === '--roots') opt.roots = true;
    else if (a === '-h' || a === '--help') usage(0);
    else usage(2);
  }

  let selfRoot;
  try {
    selfRoot = execFileSync('git', ['rev-parse', '--show-toplevel'],
      { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch { selfRoot = process.cwd(); }

  const roots = hostRoots(selfRoot);

  if (opt.roots) {
    process.stdout.write(`self: ${selfRoot}\n`);
    for (const r of roots) process.stdout.write(`${r.kind.padEnd(12)} ${r.root}${r.origin ? '  ' + r.origin : ''}\n`);
    process.stdout.write(`${roots.length} root(s) with a tools/ directory, besides this one\n`);
    process.exit(0);
  }

  const bindingFiles = opt.files.length || opt.context.length ? opt.files : BINDING;
  const contextFiles = opt.files.length || opt.context.length ? opt.context : CONTEXT;

  const rows = [];
  const unreadable = [];
  for (const [files, binding] of [[bindingFiles, true], [contextFiles, false]]) {
    for (const f of files) {
      const names = namesIn(join(selfRoot, f));
      if (names === null) { unreadable.push(f); continue; }
      for (const n of names) rows.push({ file: f, binding, path: n, ...classify(n, { selfRoot, roots, ref: opt.ref }) });
    }
  }

  if (!rows.length) {
    process.stderr.write(
      unreadable.length
        ? `no readable input: ${unreadable.join(', ')}\n`
        : 'no tools/ path in any input; the sweep cannot distinguish that from a clean repository\n');
    process.exit(3);
  }

  // A path can be named by both a binding file and a narrative one. The binding
  // reading is the one that routes, so it wins; keep the other only as a count.
  const byPath = new Map();
  for (const r of rows) {
    const prev = byPath.get(r.path);
    if (!prev || (r.binding && !prev.binding)) byPath.set(r.path, r);
  }
  const uniq = [...byPath.values()].sort((a, b) => a.path.localeCompare(b.path));
  const bindingRows = uniq.filter((r) => r.binding);
  const contextRows = uniq.filter((r) => !r.binding);
  const bindingMissing = bindingRows.filter((r) => r.state === 'missing');
  const siblingFindings = bindingRows.filter((r) => r.state === 'sibling-repo');

  if (opt.json) {
    process.stdout.write(JSON.stringify({
      self: selfRoot, ref: opt.ref, unreadable,
      roots: roots.map((r) => ({ root: r.root, kind: r.kind, origin: r.origin || null })),
      binding: bindingFiles, context: contextFiles,
      rows: uniq, binding_missing: bindingMissing.length,
      sibling_repo: siblingFindings.length,
    }, null, 2) + '\n');
  } else {
    // The root set is part of the reading, so it is printed before the reading and
    // not behind a flag. A count of missing tools is meaningless without it.
    process.stdout.write(
      `roots: this one, plus ${roots.length} on the host ` +
      `(${roots.map((r) => `${r.name}:${r.kind}`).join(', ')})` +
      `${opt.ref ? `; parked resolved against ${opt.ref}` : '; no --ref, so `parked` cannot be distinguished from `missing`'}\n\n`);
    const order = ['missing', 'sibling-repo', 'parked', 'vendored-elsewhere', 'hq-root', 'present'];
    for (const grp of order) {
      const hit = uniq.filter((r) => r.state === grp);
      if (!hit.length) continue;
      process.stdout.write(`${grp}  (${hit.length})\n`);
      for (const r of hit) {
        process.stdout.write(`  ${r.binding ? 'BINDING ' : 'context '}${r.path}` +
          `${r.where && r.where !== r.path ? ` -> ${r.where}` : ''}\n`);
      }
      process.stdout.write('\n');
    }
    process.stdout.write(
      `${bindingRows.length} path(s) named in binding text, ${contextRows.length} in narrative only. ` +
      `${bindingMissing.length} binding miss(es) to route.\n`);
    if (unreadable.length) process.stdout.write(`unreadable input: ${unreadable.join(', ')}\n`);
    if (siblingFindings.length) {
      process.stdout.write(
        '\nA binding standard names a tool that only a sibling product owns. Run it where it is,\n' +
        'then tell that repository, because neither vendoring it nor routing it to HQ is the fix:\n');
      for (const r of siblingFindings) {
        process.stdout.write(`  ${r.path}  owned by ${r.rootName}  ->  ${r.where}\n`);
      }
    }
    if (!bindingMissing.length && !siblingFindings.length) {
      process.stdout.write('\nNothing to route. Every binding path resolves somewhere nameable.\n');
    }
  }

  process.exit(opt.gate && bindingMissing.length ? 1 : 0);

}

if (process.argv[1] && process.argv[1].endsWith('tool-reach.mjs')) main(process.argv.slice(2));
