// base.mjs — the merge base as a value that is either present or a named
// fault, never the empty string.
//
//   import { mergeBase, blobAt, FAULT } from './base.mjs'
//
//   const b = mergeBase(root, 'origin/main', 'refs/prs/694')
//   if (b.fault) { console.error(b.fault.line); console.error(b.fault.repair) }
//   else { /* b.base is a real commit */ }
//
// WHY THIS FILE EXISTS, measured on this seat's own run of 2026-11-02 at
// 07:0xZ and not cited from a lesson. The run was handed a clone that was
// shallow and single-branch, which is the normal shape here. It then ran, by
// hand, the comparison every ancestry question in this repository starts with:
//
//     MB=$(git merge-base origin/main refs/prs/694)
//     git rev-parse "$MB:tools/root-entries.test.mjs"
//
// `git merge-base` found no common ancestor, printed nothing and exited 1.
// `set -e` was not in force, because this was one line of a compound command,
// so `MB` became the empty string and the second line ran as
// `git rev-parse ":tools/root-entries.test.mjs"`. That is not an error. The
// leading colon is git's syntax for THE INDEX, so git answered, at exit 0,
// with the blob this working copy has staged.
//
// WHAT THAT COSTS, and it is worse than a wrong number. In a seat's clone the
// index equals the trunk, so the laundered value is not noise: it is the
// TRUNK's blob wearing the merge base's name. Feed that into the ordinary
// three-way arithmetic and every file where the branch merely LAGS the trunk
// satisfies `branch != base`, which reads as a file the branch REWROTE. The
// shallow clone does not degrade the verdict. It inverts it, in the one
// direction that manufactures alarm, and it does so for free on every file.
//
// This run produced and then had to withdraw the finding "four of my seat's
// five open pull requests revert a security fix on main". The four branches
// had never touched the file. `main` changed it after their branch points, at
// 05:15Z in d0ff18dc, which is the definition of lagging. On the repaired
// clone the base blob and the branch blob are the same object, e777ba91, for
// all four.
//
// THE REPAIR ALREADY EXISTED AND IS NOT THIS FILE. `tools/ensure-full-clone.sh`
// fixes the clone, and `tools/ensure-full-clone.test.mjs` already measures
// this exact laundering by name. Nothing was missing from the diagnosis. What
// was missing is that the hazard is only avoided by a caller who REMEMBERS the
// hazard, and the thing it defeats is precisely a caller's memory. So this
// file removes the empty string from the type: there is no value `mergeBase`
// can return that a later `git rev-parse "$base:path"` will read as the index,
// and `blobAt` refuses an empty rev rather than passing it to git.
//
// ONE NAMED CAUSE PER REACHABLE BRANCH, which is `tools/board/live-target.mjs`'s
// rule and its reason. Three different states make `git merge-base` print
// nothing, they take three different repairs, and a caller told the wrong one
// goes and looks in the wrong place:
//
//   1. A ref does not resolve. In a single-branch clone `origin/<anything-else>`
//      does not exist, so this reads as "unrelated histories" unless it is
//      checked first and named first.
//   2. The clone is incomplete, by depth or by refspec. Repair: one command.
//   3. The histories genuinely share no ancestor. Nothing to repair; the
//      question has an answer and the answer is "there is no base".
//
// No dependencies, no network, no writes. Every git call here is a read.
import { spawnSync } from 'node:child_process';

/** The fault codes, so a caller can branch on the cause rather than on text. */
export const FAULT = {
  /** `git` would not run, or this directory is not a repository. */
  GIT_UNUSABLE: 'GIT_UNUSABLE',
  /** One of the two revs does not resolve in this checkout. */
  NO_SUCH_REV: 'NO_SUCH_REV',
  /** Shallow, or single-branch, or both. The base is unknowable here. */
  INCOMPLETE_CLONE: 'INCOMPLETE_CLONE',
  /** A complete clone, and the two histories really do not meet. */
  UNRELATED_HISTORIES: 'UNRELATED_HISTORIES',
  /** A caller passed an empty or blank rev, which git would read as the index. */
  EMPTY_REV: 'EMPTY_REV',
};

const REPAIR_CLONE = 'bash tools/ensure-full-clone.sh';

/** One `git` read that never throws, so every caller branches on status. */
export function git(root, args) {
  const r = spawnSync('git', ['-C', root, ...args], { encoding: 'utf8', maxBuffer: 1 << 28 });
  if (r.error) return { status: 127, stdout: '', stderr: String(r.error.message) };
  return { status: r.status, stdout: r.stdout ?? '', stderr: r.stderr ?? '' };
}

const fault = (code, line, repair) => ({ fault: { code, line, repair } });

/**
 * Is this clone able to answer history questions at all? Both properties are
 * checked because they are independent and repairing one is not repairing the
 * other, which is `tools/ensure-full-clone.sh`'s own measured point.
 *
 * @param {string} root a repository working directory.
 * @returns {string[]} one line per incompleteness found, empty when complete.
 */
export function cloneGaps(root) {
  const gaps = [];
  if (git(root, ['rev-parse', '--is-shallow-repository']).stdout.trim() === 'true') {
    gaps.push('depth: .git/shallow is present, so the commit graph is truncated');
  }
  // THE REFSPEC GAP IS ONLY A GAP WHEN THERE IS AN `origin` TO WIDEN, and the
  // first draft of this function did not check that. A repository with no
  // remote has `remote.origin.fetch` unset, which is not the narrow refspec;
  // it is the absence of the question. That draft called such a repository
  // incomplete and handed back `bash tools/ensure-full-clone.sh` as the
  // repair, which that script itself refuses with "a clone with no origin
  // cannot be completed". So the one cause it named was false and the repair
  // it named could not run -- the exact defect this file was written to stop,
  // reproduced inside it, and caught by the suite's own fixture on the first
  // run because that fixture is a local repository with two unrelated roots.
  if (git(root, ['config', '--get', 'remote.origin.url']).status === 0) {
    const fetch = git(root, ['config', '--get-all', 'remote.origin.fetch']).stdout;
    const wide = fetch.split('\n').some((l) => l.trim() === '+refs/heads/*:refs/remotes/origin/*');
    if (!wide) {
      gaps.push(
        `refspec: remote.origin.fetch is ${fetch.trim().split('\n').join(',') || '(unset)'}`
        + ', so origin/<branch> exists for that branch only',
      );
    }
  }
  return gaps;
}

/**
 * The blob id of `path` at `rev`, with an empty `rev` refused rather than
 * handed to git. `git rev-parse ":path"` reads the INDEX and exits 0, so the
 * one input a caller must never pass is the one git answers most happily.
 *
 * @param {string} root a repository working directory.
 * @param {string} rev a commit-ish. Empty or blank is the refused case.
 * @param {string} path a repository-relative path.
 * @returns {{oid: string | null} | {fault: {code: string, line: string, repair: string}}}
 *   `oid: null` means the path does not exist at that rev, which is an answer
 *   and not a fault.
 */
export function blobAt(root, rev, path) {
  if (typeof rev !== 'string' || rev.trim() === '') {
    return fault(
      FAULT.EMPTY_REV,
      `refusing to read ${path} at an empty rev: git would read ":${path}" as the index,`
      + ' answer at exit 0, and hand back this working copy instead of a commit',
      'the caller computed a rev that came back empty; find that call and make it branch on its fault',
    );
  }
  // One code path with `blobsAt`, deliberately: two implementations of "read a
  // blob at a rev" is two places for the empty-rev refusal to be forgotten.
  const batch = blobsAt(root, [{ rev, path }]);
  if (batch.fault) return batch;
  if (batch.oids[0] !== null) return { oid: batch.oids[0] };
  // `missing` covers two different things and they are not the same answer: a
  // rev that does not exist is a fault the caller must handle, and a path
  // absent at a rev that does exist is an answer (`null`).
  if (git(root, ['rev-parse', '--verify', '--quiet', `${rev}^{commit}`]).status !== 0) {
    return fault(FAULT.NO_SUCH_REV, `${rev} does not resolve to a commit in this checkout`, REPAIR_CLONE);
  }
  return { oid: null };
}

/**
 * Many blob ids in ONE `git` process, for callers that have a whole file list.
 *
 * WHY THIS EXISTS BESIDE `blobAt`. `classify` needs three blobs per differing
 * path, and the per-call form spawns one process each. Measured on this
 * repository, 2026-11-02: pull request 665 differs from `origin/main` in 139
 * files, so 417 `git rev-parse` processes, and the run took 20 seconds of wall
 * clock against 2 seconds of user time -- the cost was process creation, not
 * work. One `cat-file --batch-check` answers all 417 in a single process.
 *
 * `--batch-check` answers `<oid> <type> <size>` per input line, in the order
 * given, or `<input> missing` for a spec it cannot resolve. A path absent at
 * that rev answers `missing`, which is an answer (null) and not a fault.
 *
 * @param {string} root a repository working directory.
 * @param {{rev: string, path: string}[]} specs
 * @returns {{oids: (string|null)[]} | {fault: {code: string, line: string, repair: string}}}
 *   `oids` is index-aligned with `specs`.
 */
export function blobsAt(root, specs) {
  for (const { rev, path } of specs) {
    if (typeof rev !== 'string' || rev.trim() === '') {
      return fault(
        FAULT.EMPTY_REV,
        `refusing to read ${path} at an empty rev: git reads ":${path}" as the index and exits 0`,
        'find the call that produced the empty rev and make it branch on its fault',
      );
    }
  }
  if (specs.length === 0) return { oids: [] };
  const r = spawnSync('git', ['-C', root, 'cat-file', '--batch-check'], {
    input: `${specs.map(({ rev, path }) => `${rev}:${path}`).join('\n')}\n`,
    encoding: 'utf8',
    maxBuffer: 1 << 28,
  });
  if (r.status !== 0) {
    return fault(
      FAULT.GIT_UNUSABLE,
      `git cat-file --batch-check failed: ${(r.stderr ?? '').trim()}`,
      'this is an environment fault, not a verdict on any branch',
    );
  }
  const lines = r.stdout.split('\n').filter((l) => l !== '');
  if (lines.length !== specs.length) {
    return fault(
      FAULT.GIT_UNUSABLE,
      `git cat-file --batch-check answered ${lines.length} lines for ${specs.length} specs,`
      + ' so the answers cannot be aligned with the questions',
      'this is an environment fault; the per-spec blobAt form does not batch and can be used instead',
    );
  }
  return {
    oids: lines.map((line) => {
      const parts = line.split(' ');
      return parts[parts.length - 2] === 'blob' ? parts[0] : null;
    }),
  };
}

/**
 * The merge base of two revs, or the one cause that actually fired.
 *
 * @param {string} root a repository working directory.
 * @param {string} a one rev, conventionally the trunk.
 * @param {string} b the other rev, conventionally a branch.
 * @returns {{base: string} | {fault: {code: string, line: string, repair: string}}}
 */
export function mergeBase(root, a, b) {
  if (git(root, ['rev-parse', '--git-dir']).status !== 0) {
    return fault(FAULT.GIT_UNUSABLE, `git would not name a repository at ${root}`, 'run this from inside a checkout');
  }
  for (const rev of [a, b]) {
    if (typeof rev !== 'string' || rev.trim() === '') {
      return fault(FAULT.EMPTY_REV, 'refusing an empty rev: git reads a bare colon as the index', 'pass a real rev');
    }
    if (git(root, ['rev-parse', '--verify', '--quiet', `${rev}^{commit}`]).status !== 0) {
      const gaps = cloneGaps(root);
      return fault(
        FAULT.NO_SUCH_REV,
        `${rev} does not resolve to a commit here`
        + (gaps.length ? `, and this clone is incomplete (${gaps.join('; ')}), which is the usual reason` : ''),
        gaps.length ? REPAIR_CLONE : `nothing to repair in the clone; check the spelling of ${rev}`,
      );
    }
  }
  const r = git(root, ['merge-base', a, b]);
  const base = r.stdout.trim();
  if (r.status === 0 && base !== '') return { base };

  // Nothing on stdout. The three causes below are the whole reason this
  // function exists, because the empty string does not distinguish them.
  const gaps = cloneGaps(root);
  if (gaps.length) {
    return fault(
      FAULT.INCOMPLETE_CLONE,
      `no merge base for ${a} and ${b}, and this clone cannot answer: ${gaps.join('; ')}.`
      + ' An empty base here is not the fact that they share nothing',
      REPAIR_CLONE,
    );
  }
  return fault(
    FAULT.UNRELATED_HISTORIES,
    `${a} and ${b} share no ancestor in a complete clone, so there is no base to compare against`,
    'nothing to repair: this is an answer. A three-way comparison of this pair is not defined',
  );
}
