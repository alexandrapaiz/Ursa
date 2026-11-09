#!/usr/bin/env node
// Which test files in this repository make temporary directories and never
// remove them.
//
//   node tools/testing/tmpdir-leak.mjs           # the decision
//   node tools/testing/tmpdir-leak.mjs --all     # every test file and its state
//   node tools/testing/tmpdir-leak.mjs --json
//
// Exit 0 every test file that makes a temporary directory also removes one,
// or is named in the baseline beside this file. Exit 1 a test file leaks and
// nothing excuses it, or a baseline entry has outlived its finding. Exit 2
// the facts could not be established, because a scan that matched no test
// file must not read like a clean sweep.
//
// WHY THIS FILE EXISTS, with the price attached, because this is not a style
// rule. On 2026-11-09 HQ's engineer seat measured the shared company host's
// /tmp at 90 per cent full and traced 3.05G of it to ONE file of this suite,
// tools/ledger/check-attributes.test.mjs, which called mkdtempSync three
// times and rmSync zero times. Re-measured here at 09:35Z, after another
// half hour of ordinary seat windows: 40 /tmp/clone-* at 3.4G and 891
// /tmp/attrs-* at 262M, on a 45G volume with 2.6G free at 95 per cent.
// Removing the 35 clones and 836 fixtures older than twenty minutes took
// the volume to 87 per cent and handed back 3.3G in eleven seconds.
//
// THE REASON IT SURVIVED AS LONG AS IT DID, which is the part that
// generalises. The host's reclaimer sweeps /tmp on a six-hour floor, so
// nothing on that volume is ever older than six hours and no daily reading
// can ever see an accumulation. The leak does not present as a growing
// directory. It presents as a disk that is full again, and to the other
// seats it presented as the reclaimer buying the space back out of their
// working set: Ursa's frontend and exo seats both reported ms-playwright
// evicted mid-run that morning with no install of their own in between, and
// one of them lost three npm installs in twenty minutes. A defect whose only
// symptom appears in another seat's lane is a defect no owner will find by
// reading their own files, so it needs an instrument rather than a habit.
//
// WHY A RATCHET AND NOT A GATE THAT FAILS TODAY. 39 other test files have
// this same defect at the moment this is written. A gate that failed on all
// 40 would be red on main from its first commit, and a gate that is red on
// main is a gate every seat learns to step over. So the 39 are written down
// in tmpdir-leak.baseline.json as found, with their measured counts, and
// this exits 1 only when a file JOINS that set or when a baseline entry has
// been fixed and not removed from the list. The 39 come down in their own
// owners' lanes; what this stops is the 41st.
//
// THE SCOPE IS "REMOVES NOTHING AT ALL", and the restriction is deliberate
// because it is the half of the question that is decidable by reading the
// file. A file containing no removal call cannot be removing the directory
// it made; that is certain. A file containing rmSync MIGHT still leak -- it
// could remove one of three directories, or remove it on the success path
// only -- and deciding that needs to know which path each call covers, which
// needs to run the thing. So:
//
//   * a file with mkdtempSync and no removal of any kind is REPORTED, and
//     the report is sound, not a guess;
//   * a file with mkdtempSync and some removal is NOT REPORTED, and this
//     instrument is blind to whether that removal is complete. The 25 files
//     in that state on 2026-11-09 are not thereby certified. The measured
//     check for one file is to run it and diff the /tmp census either side,
//     which is what proved the check-attributes fix and is what a reader
//     should do before claiming any particular file is clean.
//
// Naming that blind spot is the point of the paragraph. The fix this file
// accompanied was found by a seat measuring a disk, not by any gate, and an
// absence instrument that does not say where it cannot see gets read as a
// clean sweep over ground it never covered.
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const REPO_ROOT = new URL('../..', import.meta.url).pathname.replace(/\/$/, '');
const BASELINE = join(REPO_ROOT, 'tools/testing/tmpdir-leak.baseline.json');

/** Roots scanned. ursa-major/src is here because it holds 30 of the 40
 *  findings, so a scan of tools/ and scripts/ alone would have reported a
 *  quarter of the problem and exited 0 over the rest. */
export const ROOTS = ['tools', 'scripts', 'skills', 'ursa-major/src'];

export const TEST_FILE = /\.test\.(mjs|js|ts)$/;

/** Making a temporary directory. `mkdtempSync` and its promise form, which
 *  are the only two spellings in this repository; `mkdtemp` with a callback
 *  would match the first pattern too. */
export const MAKES = /\bmkdtemp(Sync)?\s*\(/g;

/** Removing one. `rmSync`/`rm` cover node:fs, `rmdirSync` the deprecated
 *  spelling, `rimraf` a dependency this repository does not have but which a
 *  future file might, and `tempDir` the helper in tools/testing/tmpdir.mjs,
 *  whose whole job is the removal -- so importing it IS the cleanup and a
 *  file that uses it must not be reported for lacking an rmSync of its own. */
export const REMOVES = /\b(rmSync|rmdirSync|rimraf|tempDir)\s*\(|\brm\s*\(|rm\s+-rf/;

const withoutComments = (source) =>
  source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');

/** Every test file under ROOTS with its temp-directory state.
 *
 *  Returns null, never [], when the facts cannot be established: an empty
 *  array and an unavailable census read the same to a caller and only one of
 *  them is a clean sweep. Copied in shape, deliberately, from
 *  gateCandidatePaths in tools/gates/enumerate-verdicts.mjs; it is not
 *  CALLED because that function's own doc comment says callers pass their
 *  own scope in, and its scope is the opposite of this one -- it skips test
 *  files and keys on process.exit, where this reads only test files and
 *  keys on mkdtemp.
 */
export function census({ roots = ROOTS } = {}) {
  let listing = '';
  try {
    listing = execFileSync('git', ['-C', REPO_ROOT, 'ls-files', ...roots], { encoding: 'utf8' });
  } catch {
    return null; // not a git checkout; the census is unavailable, not empty
  }
  const rows = [];
  for (const path of listing.split('\n').filter(Boolean)) {
    if (!TEST_FILE.test(path)) continue;
    let source = '';
    try {
      source = readFileSync(join(REPO_ROOT, path), 'utf8');
    } catch {
      continue; // listed in the index and absent from the worktree
    }
    const code = withoutComments(source);
    const makes = (code.match(MAKES) ?? []).length;
    if (makes === 0) continue;
    rows.push({ path, makes, removes: REMOVES.test(code) });
  }
  return rows;
}

/** The ratchet. `baseline` is the committed list of known-leaking paths. */
export function decide({ rows, baseline }) {
  const leaking = rows.filter((r) => !r.removes).map((r) => r.path);
  const known = new Set(baseline.leaking.map((e) => e.path));
  const problems = [];

  for (const path of leaking) {
    if (!known.has(path)) {
      problems.push({
        kind: 'new-leak',
        path,
        why: `${path} makes a temporary directory and removes nothing. Use tempDir from tools/testing/tmpdir.mjs, which removes it from an after() hook.`,
      });
    }
  }
  for (const path of known) {
    if (!leaking.includes(path)) {
      problems.push({
        kind: 'stale-baseline',
        path,
        why: `${path} is listed as leaking and no longer does. Delete its entry from tools/testing/tmpdir-leak.baseline.json, or the baseline stops describing the repository.`,
      });
    }
  }
  return { leaking, problems };
}

function main(argv) {
  const rows = census();
  if (rows === null) {
    process.stderr.write('tmpdir-leak: not a git checkout, so the census is unavailable\n');
    return 2;
  }
  if (rows.length === 0) {
    process.stderr.write(
      'tmpdir-leak: no test file under ' + ROOTS.join(', ') + ' calls mkdtemp, which has not been' +
      ' true of this repository since the scan was written, so this is a broken scan and not a' +
      ' clean sweep\n',
    );
    return 2;
  }
  const baseline = JSON.parse(readFileSync(BASELINE, 'utf8'));
  const { leaking, problems } = decide({ rows, baseline });

  if (argv.includes('--json')) {
    process.stdout.write(JSON.stringify({ rows, leaking, problems }, null, 2) + '\n');
    return problems.length ? 1 : 0;
  }
  if (argv.includes('--all')) {
    for (const r of rows.sort((a, b) => a.path.localeCompare(b.path))) {
      process.stdout.write(
        `${r.removes ? 'removes-something' : 'REMOVES-NOTHING '}  mkdtemp=${r.makes}  ${r.path}\n`,
      );
    }
    process.stdout.write('\n');
  }
  process.stdout.write(
    `tmpdir-leak: ${rows.length} test files make temporary directories, ` +
    `${leaking.length} remove nothing, ${baseline.leaking.length} of those are written down as found.\n`,
  );
  for (const p of problems) process.stdout.write(`  ${p.kind}: ${p.why}\n`);
  if (problems.length) return 1;
  process.stdout.write(
    '  no test file has joined the leaking set, and every baseline entry still leaks.\n' +
    '  this does not certify the ' + rows.filter((r) => r.removes).length +
    ' files that remove something; see the blind spot in this file\'s header.\n',
  );
  return 0;
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  process.exit(main(process.argv.slice(2)));
}
