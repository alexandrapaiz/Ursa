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

/** The source with its comments removed and everything else preserved.
 *
 *  WHY THIS IS A SCANNER AND NOT TWO `replace` CALLS, with the price. The
 *  first version of this function was
 *
 *    source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1')
 *
 *  and a regex cannot tell a comment opener from the same two characters
 *  inside a string, because knowing the difference is exactly the state a
 *  regex does not carry. `tools/ledger/containment.test.mjs` line 129 holds a
 *  git refspec, `'+refs/heads/*:refs/remotes/origin/*'`. The `/*` in it opened
 *  a comment that ran to the next real `*\/` six lines later, and the text
 *  deleted in between was line 133, `after(() => rmSync(ROOT, ...))` -- the
 *  file's actual cleanup. So the gate reported a file that removes its one
 *  directory as removing nothing, and the entry went into the baseline as a
 *  measured finding on 2026-11-09. Measured at the time of this repair: one
 *  false positive today, and 10 of this repository's 136 test files under
 *  ROOTS contain `/*` inside a quoted literal, so the hazard was live and
 *  simply had not landed on the other nine.
 *
 *  The direction that would have been worse never happened, and it was
 *  checked rather than assumed: a swallowed `mkdtemp` drops the file from the
 *  census entirely, which hides a leak instead of inventing one. Zero files
 *  were in that state. The check is kept as a case in the test file beside
 *  this one, because the next refspec could land either way.
 *
 *  Scope, stated because a scanner invites the question. It tracks line
 *  comments, block comments, and the three quote forms, which is what the
 *  measured defect needed. It does not track regular-expression literals, so
 *  a `/*` inside a character class (`/[a-z/*]/`) would still open a comment
 *  here. No file in this repository has one; that is why it is written down
 *  rather than handled, and `REGEX_LITERAL_BLIND_SPOT` names it for a reader
 *  who hits it.
 */
export const REGEX_LITERAL_BLIND_SPOT =
  'withoutComments does not parse regex literals, so /* inside a character class opens a comment';

export function withoutComments(source) {
  let out = '';
  let i = 0;
  while (i < source.length) {
    const two = source.slice(i, i + 2);
    if (two === '//') {
      while (i < source.length && source[i] !== '\n') i += 1;
      continue; // the newline itself is left for the next iteration
    }
    if (two === '/*') {
      i += 2;
      while (i < source.length && source.slice(i, i + 2) !== '*/') {
        if (source[i] === '\n') out += '\n'; // keep line numbering honest
        i += 1;
      }
      i += 2;
      continue;
    }
    const quote = source[i];
    if (quote === '"' || quote === "'" || quote === '`') {
      out += quote;
      i += 1;
      while (i < source.length) {
        if (source[i] === '\\') {
          out += source.slice(i, i + 2);
          i += 2;
          continue;
        }
        out += source[i];
        i += 1;
        if (source[i - 1] === quote) break;
      }
      continue;
    }
    out += source[i];
    i += 1;
  }
  return out;
}

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
