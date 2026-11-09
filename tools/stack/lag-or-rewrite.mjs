#!/usr/bin/env node
// lag-or-rewrite.mjs — for one open row, which files does it actually rewrite,
// which does it merely lag, and which does it drag the trunk backwards.
//
//   node tools/stack/lag-or-rewrite.mjs                       # HEAD vs origin/main
//   node tools/stack/lag-or-rewrite.mjs refs/prs/694           # one row
//   node tools/stack/lag-or-rewrite.mjs --base origin/main refs/prs/694
//   node tools/stack/lag-or-rewrite.mjs --json refs/prs/694
//   node tools/stack/lag-or-rewrite.mjs --all refs/prs/694   # list the LAGS files too
//
// Exit 0 nothing on this branch moves a tracked file back to a trunk state the
// trunk has already superseded. Exit 1 at least one does, and the line names
// the file, the branch blob, and the trunk commit that superseded it. Exit 2
// the comparison could not be established, which is never reported as clean.
//
// WHAT QUESTION THIS ANSWERS, and why it is the next one after containment.
// `tools/ledger/containment.mjs` and the PM's ancestry check answer "is this
// row already inside a sibling", which is what lets the owner close five rows
// as one decision. The question immediately after it, for the row that is NOT
// contained, is "what does merging this actually do to the trunk's current
// text". `gh pr view` answers MERGEABLE, which is a statement about conflict
// markers and not about outcome, and git's three-way merge takes the branch's
// side on any file the trunk has not touched since the branch point without
// saying so.
//
// THE FOUR CLASSES. For a file that differs between trunk and branch, with
// `base` the real merge base:
//
//   LAGS        branch blob == base blob, trunk moved after the branch point.
//               The branch is not a claim about this file at all. Merging
//               keeps the trunk's text. This is the overwhelmingly common
//               class and it is the one that reads as alarming when the base
//               is wrong.
//   REWRITES    branch blob != base blob, trunk blob == base blob. The branch
//               is the only side that moved it, so the branch's text lands
//               verbatim.
//   BOTH_MOVED  both sides moved it. A real merge decision, and the one the
//               driver or a human will see.
//   RESURRECTS  the branch's blob is a state this path HELD on the trunk and
//               the trunk has since moved past. Merging silently reverts the
//               trunk to older text. This is the only class that exits 1,
//               because it is the only one where MERGEABLE and "safe" come
//               apart with nobody told.
//
// WHY RESURRECTS IS NOT JUST A REWRITE. A reviewer reading `git diff
// main..branch` sees the same hunk either way. What distinguishes them is not
// in the diff: it is whether that exact content was on the trunk before and
// lost an argument there. So the line for it names the trunk commit that
// replaced it, with its author and date, which is the one fact that turns the
// judgement into a sentence instead of an investigation.
//
// WHY IT REFUSES RATHER THAN ANSWERS WHEN THE BASE IS UNKNOWABLE. Every class
// above is defined by a comparison against the base, and on the clone a seat
// is handed there is no base to compare against. `tools/stack/base.mjs` has
// the measurement: the empty base launders into the index, the index is the
// trunk, and the arithmetic then reports every LAGS file as a REWRITES file.
// This seat published that exact false finding about four of its own rows an
// hour before writing this tool. So the base comes from `mergeBase`, which
// returns a fault instead of an empty string, and a fault is exit 2.
//
// NO WRITES. Every git call is a read. It does not merge, fetch, or touch the
// index, which is deliberate: the fault it reports is a fetch away from fixed
// and the fetch belongs to `tools/ensure-full-clone.sh`, where the command
// that repairs it is also the command a reader can see and refuse.
import { spawnSync } from 'node:child_process';

import { mergeBase, blobsAt, git, cloneGaps } from './base.mjs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, resolve } from 'node:path';

export const CLASS = {
  LAGS: 'LAGS',
  REWRITES: 'REWRITES',
  BOTH_MOVED: 'BOTH_MOVED',
  RESURRECTS: 'RESURRECTS',
};

/** How many trunk commits touching one path this will walk before abstaining.
 *  An abstention is reported as such; it is never folded into a clean class.
 *
 *  WHY IT IS 5000 AND NOT 300. The first draft resolved one blob per commit
 *  with one `git rev-parse` process per commit, so the cap was a cost ceiling
 *  and 300 was where it sat. Run against this repository it abstained on
 *  exactly one path, `docs/ideas.md` at 301 commits, which is the ledger --
 *  the most-merged file here and the one where resurrecting superseded text
 *  does the most damage. Abstaining precisely there is the worst possible
 *  place to abstain. `git cat-file --batch-check` resolves every commit's blob
 *  in ONE process, so the walk is no longer per-commit work and the cap is
 *  only a guard against a pathological path. */
export const HISTORY_CAP = 5000;

/**
 * Every blob this path has held on the trunk, newest first, excluding the one
 * it holds now.
 *
 * @returns {{superseded: Map<string,string>} | {capped: number}} a map from
 *   blob id to the trunk commit that REPLACED it (the child of the commit that
 *   introduced it), or an abstention when the path's trunk history is longer
 *   than the cap.
 */
export function supersededBlobs(root, trunk, path, cap = HISTORY_CAP) {
  const revs = git(root, ['rev-list', `--max-count=${cap + 1}`, trunk, '--', path]).stdout
    .split('\n').filter(Boolean);
  if (revs.length > cap) return { capped: revs.length };
  if (revs.length < 2) return { superseded: new Map() };

  // One process for the whole walk. `--batch-check` takes one revision:path
  // per line on stdin and answers `<oid> <type> <size>` per line, in order,
  // or `<input> missing` for a line it cannot resolve. A commit that does not
  // carry the path answers `missing`, which happens on a merge commit whose
  // rev-list entry touched the path on one side only, so the line is skipped
  // rather than treated as a blob.
  const r = spawnSync('git', ['-C', root, 'cat-file', '--batch-check'], {
    input: `${revs.map((rev) => `${rev}:${path}`).join('\n')}\n`,
    encoding: 'utf8',
    maxBuffer: 1 << 28,
  });
  if (r.status !== 0) return { capped: revs.length };
  const answers = r.stdout.split('\n').filter(Boolean);
  if (answers.length !== revs.length) return { capped: revs.length };

  const oidOf = answers.map((line) => {
    const [first, second] = line.split(' ');
    return second === 'blob' ? first : null;
  });

  const superseded = new Map();
  // revs is newest-first. revs[0] holds the blob the trunk has NOW, so the
  // commit that superseded revs[i]'s blob is the newer revs[i - 1].
  for (let i = 1; i < revs.length; i += 1) {
    const older = oidOf[i];
    if (older === null || older === oidOf[0]) continue;
    if (!superseded.has(older)) superseded.set(older, revs[i - 1]);
  }
  return { superseded };
}

/** One commit described in the one line a reviewer needs. */
export function describeCommit(root, rev) {
  const out = git(root, ['show', '-s', '--format=%h %cI %an %s', rev]).stdout.trim();
  return out || rev;
}

/**
 * Classify every path that differs between `trunk` and `branch`.
 *
 * @returns {{base: string, rows: object[], abstained: object[]} | {fault: object}}
 */
export function classify(root, trunk, branch) {
  const b = mergeBase(root, trunk, branch);
  if (b.fault) return b;
  const base = b.base;

  const differing = git(root, ['diff', '--name-only', '-z', trunk, branch]).stdout
    .split('\0').filter(Boolean);

  // Three blobs per path, all of them in one `git` process. See
  // `blobsAt` in base.mjs for the measurement that made this a batch.
  const specs = differing.flatMap((path) => [
    { rev: base, path }, { rev: trunk, path }, { rev: branch, path },
  ]);
  const got = blobsAt(root, specs);
  if (got.fault) return got;

  const rows = [];
  const abstained = [];
  for (const [i, path] of differing.entries()) {
    const atBase = { oid: got.oids[i * 3] };
    const atTrunk = { oid: got.oids[i * 3 + 1] };
    const atBranch = { oid: got.oids[i * 3 + 2] };
    const branchMoved = atBranch.oid !== atBase.oid;
    const trunkMoved = atTrunk.oid !== atBase.oid;

    let cls;
    if (!branchMoved) cls = CLASS.LAGS;
    else if (!trunkMoved) cls = CLASS.REWRITES;
    else cls = CLASS.BOTH_MOVED;

    // What merging does to the path's EXISTENCE, which the four classes do
    // not carry and a reviewer reads first. A `REWRITES` row for a file the
    // trunk does not have is a new file, and a `REWRITES` row for a file the
    // branch does not have removes one from the trunk. Those are not the same
    // review and they printed identically in the first draft.
    let effect = 'edits';
    if (atBranch.oid === null && atTrunk.oid !== null) effect = 'deletes';
    else if (atBranch.oid !== null && atTrunk.oid === null) effect = 'adds';

    const row = { path, cls, effect, base: atBase.oid, trunk: atTrunk.oid, branch: atBranch.oid };

    if (branchMoved && atBranch.oid !== null) {
      const hist = supersededBlobs(root, trunk, path);
      if (hist.capped !== undefined) {
        // Reported as an abstention and not as a clean class, because "no
        // resurrection found" and "the walk did not run" are different facts
        // and only one of them is evidence.
        const why = `${hist.capped} trunk commits touch this path, over the ${HISTORY_CAP} cap,`
          + ' so this path was NOT checked for a resurrected blob';
        row.history = `abstained: ${why}`;
        abstained.push({ path, why });
      } else if (hist.superseded.has(atBranch.oid)) {
        row.cls = CLASS.RESURRECTS;
        row.supersededBy = describeCommit(root, hist.superseded.get(atBranch.oid));
      }
    }
    rows.push(row);
  }
  return { base, rows, abstained };
}

const EFFECT = {
  adds: 'the trunk does not have this path, so merging creates it',
  deletes: 'the trunk HAS this path and the branch does not, so merging removes it from the trunk',
  edits: null,
};

const LINE = {
  [CLASS.LAGS]: (r) => `LAGS        ${r.path}\n              the branch never touched it; the trunk moved it after the branch point, so merging keeps the trunk's text`,
  [CLASS.REWRITES]: (r) => `REWRITES    ${r.path}\n              only the branch moved it, so the branch's text lands verbatim${EFFECT[r.effect] ? `\n              ${EFFECT[r.effect]}` : ''}`,
  [CLASS.BOTH_MOVED]: (r) => `BOTH_MOVED  ${r.path}\n              both sides moved it since the base: a real merge decision${EFFECT[r.effect] ? `\n              ${EFFECT[r.effect]}` : ''}`,
  [CLASS.RESURRECTS]: (r) => `RESURRECTS  ${r.path}\n              the branch holds blob ${r.branch.slice(0, 8)}, a state this path HELD on the trunk and lost.\n              superseded by: ${r.supersededBy}\n              merging reverts that commit's change to this file, and no conflict marker says so`,
};

function main(argv) {
  const root = git(process.cwd(), ['rev-parse', '--show-toplevel']).stdout.trim()
    || resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
  // Parsed by walking rather than by index arithmetic. The first draft wrote
  // `argv.filter((a, i) => i !== baseFlag + 1)` with `baseFlag` at -1 when
  // `--base` is absent, so `i !== 0` dropped the only positional argument and
  // the tool silently reported on HEAD while naming the row it was given.
  let json = false;
  let all = false;
  let trunk = 'origin/main';
  const positional = [];
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === '--json') json = true;
    else if (argv[i] === '--all') all = true;
    else if (argv[i] === '--base') { trunk = argv[i + 1]; i += 1; }
    else if (argv[i].startsWith('--')) { process.stderr.write(`lag-or-rewrite: unknown flag ${argv[i]}\n`); return 2; }
    else positional.push(argv[i]);
  }
  if (positional.length > 1) {
    process.stderr.write(`lag-or-rewrite: one branch at a time, got ${positional.join(' ')}\n`);
    return 2;
  }
  if (trunk === undefined) { process.stderr.write('lag-or-rewrite: --base needs a rev\n'); return 2; }
  const branch = positional[0] ?? 'HEAD';

  const result = classify(root, trunk, branch);
  if (result.fault) {
    const text = `lag-or-rewrite: ${result.fault.code}\n  ${result.fault.line}\n  repair: ${result.fault.repair}`;
    process.stderr.write(json ? `${JSON.stringify({ ...result, exitCode: 2 }, null, 2)}\n` : `${text}\n`);
    return 2;
  }

  const resurrects = result.rows.filter((r) => r.cls === CLASS.RESURRECTS);
  const counts = Object.fromEntries(
    Object.values(CLASS).map((c) => [c, result.rows.filter((r) => r.cls === c).length]),
  );
  const exitCode = resurrects.length ? 1 : 0;

  if (json) {
    process.stdout.write(`${JSON.stringify({ trunk, branch, ...result, counts, exitCode }, null, 2)}\n`);
    return exitCode;
  }

  const lines = [];
  lines.push(`lag-or-rewrite: ${branch} against ${trunk}, base ${result.base.slice(0, 8)}`);
  const gaps = cloneGaps(root);
  if (gaps.length) {
    // Reachable only when a base exists in spite of an incomplete clone, which
    // happens when the branch point is inside the fetched depth. The base is
    // real, so this is a caveat on the history walk and not a refusal.
    lines.push(`  caveat: this clone is still incomplete (${gaps.join('; ')}), so the RESURRECTS walk sees part of the trunk's history only`);
  }
  // LAGS is the common class and the one that needs no decision, so it is
  // counted by default and listed only under --all. A first draft printed all
  // of them: on one real row that was 180 lines of "the branch never touched
  // it" with the two files a reviewer owes a decision buried inside.
  const shown = all ? result.rows : result.rows.filter((r) => r.cls !== CLASS.LAGS);
  for (const r of shown) lines.push(`  ${LINE[r.cls](r)}`);
  if (!all && counts[CLASS.LAGS] > 0) {
    lines.push(`  ${counts[CLASS.LAGS]} LAGS file(s) not listed: the branch never touched them. --all lists them.`);
  }
  for (const a of result.abstained) lines.push(`  ABSTAINED   ${a.path}\n              ${a.why}`);
  const tally = Object.entries(counts).filter(([, n]) => n > 0).map(([c, n]) => `${n} ${c}`).join(', ');
  lines.push(
    result.rows.length === 0
      ? `  no file differs between ${branch} and ${trunk}.`
      : `  ${result.rows.length} differing file(s): ${tally}.`,
  );
  lines.push(
    exitCode === 1
      ? `  ${resurrects.length} file(s) would revert the trunk to superseded text. A reviewer owes each one a decision.`
      : '  nothing here moves the trunk backwards.',
  );
  const write = exitCode === 1 ? process.stderr : process.stdout;
  write.write(`${lines.join('\n')}\n`);
  return exitCode;
}

const invokedDirectly =
  process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href;
if (invokedDirectly) process.exit(main(process.argv.slice(2)));
