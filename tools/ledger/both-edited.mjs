#!/usr/bin/env node
// both-edited.mjs — name the register blocks that two sides both wrote into,
// including the ones a forward merge has already hidden.
//
//   node tools/ledger/both-edited.mjs                       # HEAD vs origin/main
//   node tools/ledger/both-edited.mjs <branch>               # one branch
//   node tools/ledger/both-edited.mjs --base <ref> <branch>  # another trunk
//   node tools/ledger/both-edited.mjs --json
//
// Exit 0 when no block on the branch was written on both sides. Exit 1 when
// at least one was, which means a reviewer owes that block a reread. Exit 2
// on a usage or environment fault.
//
// WHY THIS EXISTS. `docs/ideas.md merge=ledger` merges by block identity, so
// two seats appending entries no longer collide, and when two sides do write
// into one block the driver refuses and names it. Both halves work. Measured
// by this tool's own fixture 3: the driver exits non-zero with "1 block(s) in
// docs/ideas.md were edited on both sides and need a human".
//
// The gap is the next step. A seat resolves that refusal by hand, commits,
// and from then on the resolution is text like any other text. No marker
// survives it, `gh pr view` reports CLEAN and MERGEABLE, and a later merge of
// the same branch runs the driver again against a merge base that now sits
// past the trunk's edit, so it has nothing to refuse. The one pass that was
// asked to judge the block is the pass that was in the middle of something
// else, and nobody is told to look again.
//
// Measured on this repository, 2026-11-02. `ursa-engineer/2026-11-01-hook`
// (#615) carried a 2026-11-01 bullet inside the entry "The wake limit is not
// the length a message is cut at" saying three observations now agree on the
// paragraph-boundary rule. `main` carried, in the same entry, a 2026-11-02
// bullet reading the host's own `wake_body` and showing that rule is one
// branch of three. Commit 744dc12e on that branch is the hand resolution, and
// its own message says it resolved the one real content conflict in the
// queue. It kept both sides. So the entry asserted the rule was settled and
// refuted it eleven lines later, the driver had nothing left to say, and the
// branch sat MERGEABLE for a day.
//
// SO WHAT IT RECOVERS. Not "do these two collide", which the driver answers
// at merge time and then forgets. This answers "which blocks on this branch
// are the output of a resolution nobody has reread". It walks the branch's own
// merge commits, keeps the ones whose second parent the trunk already
// contains, and recomputes the both-edited set at each of their original
// merge bases. A block reported with `hidden_by` named is a block some earlier
// pass already merged past, and the trunk text it was weighed against is
// reachable only from that commit.
//
// WHAT IT DOES NOT CLAIM. It cannot tell agreement from disagreement. Two
// seats adding independent facts to one entry is the normal, wanted case and
// reports identically to a contradiction. The output is a reread list, not a
// defect list, which is why exit 1 is addressed to a reviewer and this is not
// wired into a gate that blocks a merge.
import { execFileSync, spawnSync } from 'node:child_process';
import { parseLedger } from './ledger.mjs';
import { pathToFileURL } from 'node:url';

/** Repository root, so the tool runs from any subdirectory. */
export const toplevel = (cwd = process.cwd()) =>
  execFileSync('git', ['rev-parse', '--show-toplevel'], { cwd, encoding: 'utf8' }).trim();

/** One `git` call that never throws, so every caller branches on status. */
export function git(root, args) {
  const r = spawnSync('git', args, { cwd: root, encoding: 'utf8', maxBuffer: 1 << 28 });
  return { status: r.status, stdout: r.stdout ?? '', stderr: r.stderr ?? '' };
}

const out = (root, args) => {
  const r = git(root, args);
  if (r.status !== 0) throw new Error(`git ${args.join(' ')} failed: ${r.stderr.trim()}`);
  return r.stdout;
};

/**
 * Every path `.gitattributes` routes to a block-merging driver, with the
 * driver's name. Read from the committed attributes file at `ref` rather than
 * from the working tree, because the set of managed paths is itself versioned.
 * @param {string} root repository root
 * @param {string} ref any revision
 * @returns {{path: string, driver: 'ledger' | 'register'}[]}
 */
export function managedPaths(root, ref) {
  const r = git(root, ['show', `${ref}:.gitattributes`]);
  if (r.status !== 0) return [];
  const found = [];
  for (const line of r.stdout.split('\n')) {
    const m = /^(\S+)\s+.*\bmerge=(ledger|register)\b/.exec(line.trim());
    if (m) found.push({ path: m[1], driver: /** @type {'ledger'|'register'} */ (m[2]) });
  }
  return found;
}

/**
 * Split a managed file into identified blocks.
 *
 * The ledger's grammar lives in `parseLedger` and is reused rather than
 * restated, which is the whole reason this tool imports it. Registers key on
 * `## ` headings, which HQ's `merge-register.py` also does; that grammar is
 * restated here in four lines because the Python is not importable from node
 * and vendoring it to read a heading would be worse.
 * @param {'ledger' | 'register'} driver
 * @param {string} source file contents, possibly empty
 * @returns {Map<string, string>} block key to block text
 */
export function blocksOf(driver, source) {
  const map = new Map();
  if (driver === 'ledger') {
    for (const b of parseLedger(source)) {
      if (b.key === '__preamble__' && b.text.trim() === '') continue;
      map.set(b.key, b.text);
    }
    return map;
  }
  let key = '__preamble__';
  let buf = [];
  const flush = () => {
    const text = buf.join('\n').replace(/\n+$/, '');
    if (key !== '__preamble__' || text.trim() !== '') map.set(key, text);
  };
  for (const line of source.replace(/\r\n/g, '\n').split('\n')) {
    if (/^##\s+/.test(line)) {
      flush();
      key = line.trim().replace(/\s+/g, ' ').toLowerCase();
      buf = [line];
    } else buf.push(line);
  }
  flush();
  return map;
}

/** File contents at a revision, or '' when the path does not exist there. */
export function blobAt(root, ref, path) {
  const r = git(root, ['show', `${ref}:${path}`]);
  return r.status === 0 ? r.stdout : '';
}

/**
 * The blocks both sides wrote into, between one common ancestor and two heads.
 *
 * Two shapes count, and they are reported with different `how` values because
 * they take different rereads:
 *
 *   `edited`  the ancestor has the block, and both heads changed its text.
 *             The driver merges or picks, and the merged block carries both
 *             intents with no marker.
 *   `added`   the ancestor does not have the block, both heads have it, and
 *             their texts differ. Two seats wrote the same entry heading
 *             independently, which the driver resolves by identity and so
 *             silently keeps one text.
 *
 * @param {string} root
 * @param {string} mb merge base revision
 * @param {string} ours branch-side revision
 * @param {string} theirs trunk-side revision
 * @param {{path: string, driver: 'ledger'|'register'}[]} paths
 * @returns {{path: string, key: string, how: 'edited'|'added'}[]}
 */
export function bothEdited(root, mb, ours, theirs, paths) {
  const found = [];
  for (const { path, driver } of paths) {
    const b = blocksOf(driver, blobAt(root, mb, path));
    const o = blocksOf(driver, blobAt(root, ours, path));
    const t = blocksOf(driver, blobAt(root, theirs, path));
    for (const [key, text] of b) {
      if (!o.has(key) || !t.has(key)) continue;
      if (o.get(key) !== text && t.get(key) !== text) found.push({ path, key, how: 'edited' });
    }
    for (const [key, text] of o) {
      if (b.has(key) || !t.has(key)) continue;
      if (t.get(key) !== text) found.push({ path, key, how: 'added' });
    }
  }
  return found;
}

/**
 * Every (ancestor, branch side, trunk side) triple worth measuring on a branch.
 *
 * The first is the live one: merge-base(base, branch) against the two heads.
 * The rest are recovered from the branch's own history. A merge commit on the
 * branch whose SECOND parent the trunk already contains is a forward merge of
 * the trunk, and at that commit the branch and the trunk were two sides with
 * their own, older, merge base. Those triples are what the forward merge
 * erased.
 * @param {string} root
 * @param {string} base trunk revision
 * @param {string} branch branch revision
 * @returns {{at: string, subject: string, mb: string, ours: string, theirs: string}[]}
 */
export function measurementPoints(root, base, branch) {
  const points = [];
  const liveMb = out(root, ['merge-base', base, branch]).trim();
  points.push({ at: 'head', subject: 'the live comparison', mb: liveMb, ours: branch, theirs: base });

  const merges = out(root, ['rev-list', '--merges', `${liveMb}..${branch}`])
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean);
  for (const sha of merges) {
    const parents = out(root, ['rev-list', '--parents', '-n', '1', sha]).trim().split(/\s+/).slice(1);
    if (parents.length < 2) continue;
    const [p1, p2] = parents;
    // A forward merge of the trunk: the side merged IN is already in the trunk.
    if (git(root, ['merge-base', '--is-ancestor', p2, base]).status !== 0) continue;
    const mb = out(root, ['merge-base', p1, p2]).trim();
    const subject = out(root, ['log', '-1', '--format=%s', sha]).trim();
    points.push({ at: sha.slice(0, 8), subject, mb, ours: p1, theirs: p2 });
  }
  return points;
}

/**
 * Measure one branch against one trunk.
 * @param {{root: string, base: string, branch: string}} spec
 */
export function measureBranch({ root, base, branch }) {
  const paths = managedPaths(root, base);
  const points = measurementPoints(root, base, branch);
  /** @type {Map<string, {path: string, key: string, how: string, at: string[], hidden_by: string[]}>} */
  const byBlock = new Map();
  for (const p of points) {
    for (const f of bothEdited(root, p.mb, p.ours, p.theirs, paths)) {
      const id = `${f.path}\u0000${f.key}`;
      const row = byBlock.get(id) ?? { ...f, at: [], hidden_by: [] };
      row.at.push(p.at);
      if (p.at !== 'head') row.hidden_by.push(`${p.at} ${p.subject}`);
      byBlock.set(id, row);
    }
  }
  return { base, branch, paths: paths.map((p) => p.path), points, blocks: [...byBlock.values()] };
}

/** Human report. Mirrors the JSON exactly, so neither is the authority. */
export function report(r) {
  console.log(`base: ${r.base}`);
  console.log(`branch: ${r.branch}`);
  console.log(
    `${r.points.length} measurement point(s): the live comparison plus ` +
      `${r.points.length - 1} forward merge(s) of the trunk already on this branch`,
  );
  console.log(`${r.paths.length} block-merged path(s) read: ${r.paths.join(', ') || 'none'}`);
  if (r.blocks.length === 0) {
    console.log('\nNo block on this branch was written on both sides. Nothing to reread.');
    return;
  }
  console.log(`\n${r.blocks.length} block(s) written on both sides, so each owes a reread:`);
  for (const b of r.blocks) {
    console.log(`\n  ${b.path}`);
    console.log(`    block: ${b.key}`);
    console.log(
      `    how: ${
        b.how === 'edited'
          ? 'the common ancestor had this block and both sides changed it'
          : 'neither ancestor had this block, both sides added it, and the texts differ'
      }`,
    );
    if (b.hidden_by.length) {
      console.log('    already merged past by:');
      for (const h of b.hidden_by) console.log(`      ${h}`);
      console.log(
        '    so the live diff shows this as a branch-only edit, and the trunk text it',
      );
      console.log('    was merged against is only visible from that commit.');
    } else {
      console.log('    still live: the merge has not happened yet.');
    }
  }
  console.log(
    '\nThis is a reread list and not a defect list. Two seats adding independent\n' +
      'facts to one block looks the same from here as two seats disagreeing.',
  );
}

export function main(argv) {
  let base = 'origin/main';
  let asJson = false;
  const rest = [];
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === '--json') asJson = true;
    else if (argv[i] === '--base') {
      base = argv[i + 1];
      i += 1;
      if (!base) {
        console.error('--base needs a revision');
        return 2;
      }
    } else if (argv[i] === '--help' || argv[i] === '-h') {
      console.log('usage: both-edited.mjs [--base <ref>] [--json] [<branch>]');
      return 0;
    } else rest.push(argv[i]);
  }
  if (rest.length > 1) {
    console.error(`one branch at a time, got ${rest.length}: ${rest.join(' ')}`);
    return 2;
  }
  const root = toplevel();
  const branch = rest[0] ?? 'HEAD';
  for (const ref of [base, branch]) {
    if (git(root, ['rev-parse', '--verify', '--quiet', `${ref}^{commit}`]).status !== 0) {
      console.error(`no such revision: ${ref}`);
      return 2;
    }
  }
  if (git(root, ['rev-parse', '--is-shallow-repository']).stdout.trim() === 'true') {
    console.error(
      'this clone is shallow, so a branch’s own merge history is truncated and the\n' +
        'hidden both-edited blocks cannot be recovered. Run bash tools/ensure-full-clone.sh first.',
    );
    return 2;
  }
  const result = measureBranch({ root, base, branch });
  if (asJson) console.log(JSON.stringify(result, null, 2));
  else report(result);
  return result.blocks.length > 0 ? 1 : 0;
}

// Entry point. The predicate compares this module's own URL to the resolved
// entry point, which is the only form that asks whether THIS module is the
// one being run. The form it replaces compared a file NAME, so it was true
// for any entry point whose own name is a suffix of this one; the general
// case is `tools/gates/import-effects.mjs`'s GUARD_ASKS_THE_WRONG_QUESTION
// and the demonstrated instance is in that gate's header.
const invokedDirectly =
  process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href;

if (invokedDirectly) {
  try {
    process.exit(main(process.argv.slice(2)));
  } catch (err) {
    console.error(String(err && err.message ? err.message : err));
    process.exit(2);
  }
}
