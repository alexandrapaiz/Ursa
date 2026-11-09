#!/usr/bin/env node
// git merge driver for this repository's append-only registers. Registered by
// tools/registers/install-drivers.sh; declared per-path in .gitattributes as
// `merge=register`.
//
// git calls a merge driver as:  <driver> %O %A %B %L %P
//   %O  path to a temp file with the common ancestor's version
//   %A  path to a temp file with our version; the driver OVERWRITES this file
//       with the merge result, and git takes it as the working-tree copy
//   %B  path to a temp file with the other branch's version
//   %L  conflict marker size (7 unless .gitattributes says otherwise)
//   %P  the real pathname being merged, which is how this driver knows which
//       register it is looking at
// Exit 0 means fully merged. Exit non-zero means git records a conflict.
//
// WHY THIS WRAPPER EXISTS AND THE ALGORITHM DOES NOT LIVE IN IT.
//
// The merging itself is tools/registers/merge-register.py, vendored byte for
// byte from HQ (see vendored.json). Three Ursa incidents describe what happens
// when a repository reaches for a tool one layer up, and each one is a rung
// this wrapper has to stand on rather than repeat:
//
//   absent   INC-2026-10-18-vendored-before-written: a tool the standards name
//            and no repository has fails loudly, and the run knows to look
//            elsewhere. So the merger is vendored here, not called across
//            repositories or off the host's checkout.
//   stale    INC-2026-10-18-host-clone-of-hq-tools-is-stale: the host's copy of
//            an HQ tool sat 557 commits behind and answered anyway, in the same
//            shape as a correct answer. So check-vendored.mjs compares the
//            vendored copy's sha256 against HQ's main and exits non-zero when
//            they differ. Staleness is made loud rather than assumed away.
//   foreign  INC-2026-10-18-hq-tool-paths-are-hq-s: a present, current HQ tool
//            run from here answered about `standards/lessons.md`, a path this
//            repository does not have, and the silence read as a clean
//            register. So the register list is registers.json, in this
//            repository, and an undeclared path is refused by name.
//
// That last incident also says to report a path assumption to the centralizer
// rather than vendoring a patched copy, "since a local copy drifts from the
// standard that calls it while continuing to answer". The .py file is therefore
// unmodified. Everything this repository needs to say about its own files is
// said in registers.json, which is data the tool reads, not a patch to it.
//
// THE FALLBACK, WHICH IS THE OTHER HALF OF THE DESIGN.
//
// On any refusal the merger is right to make, and on any failure of this
// wrapper's own, %A is overwritten with git's ordinary line-based three-way
// merge, conflict markers and all, before exiting non-zero. Leaving %A as our
// unmodified version would hand the human a file that looks clean and is not,
// which is the silent-corruption failure this whole change exists to remove.
// A human who hits a refusal gets exactly the file git would have given them,
// plus the reason on stderr.
import { readFileSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { DISPOSITION, formatResultLine } from '../stack/driver-report.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const MERGER = join(here, 'merge-register.py');
const TABLE = join(here, 'registers.json');

const [ancestor, ours, theirs, markerSizeArg, pathname] = process.argv.slice(2);

if (!ancestor || !ours || !theirs) {
  console.error('usage: merge-driver.mjs %O %A %B [%L] [%P]');
  process.exit(2);
}

const markerSize = Number.parseInt(markerSizeArg ?? '7', 10) || 7;

/** The three conflict-marker labels, which git will not give this driver for
 *  free and which it must therefore supply itself.
 *
 *  WHY THIS IS NOT COSMETIC, measured on 2026-11-02 against `refs/prs/668`.
 *  Without `-L`, `git merge-file` labels each side with the FILENAME it was
 *  handed, and the files git hands a merge driver are its own temporaries. The
 *  markers this driver wrote into `docs/agents/improvements.md` read:
 *
 *    <<<<<<< .merge_file_4MmYWY
 *    ||||||| .merge_file_Y4L0Au
 *    >>>>>>> .merge_file_r8MY6W
 *
 *  while in the SAME merged tree, on a path with no driver, git's own markers
 *  read `<<<<<<< origin/main` and `>>>>>>> refs/prs/668`. So this file's own
 *  promise above -- "a human who hits a refusal gets exactly the file git
 *  would have given them" -- was false on the one field that tells the human
 *  which side is which, at exactly the moment they are being asked to choose.
 *
 *  And the temp names are random per invocation, so the blob and therefore the
 *  tree `git merge-tree --write-tree` returns differed on every run of one
 *  unchanged pair of commits: `5a6d5e68`, `644bd0b9`, `60458dc3` on three
 *  consecutive calls. Anything keyed on that tree id -- a cache, a comparison
 *  of two measurements, `tools/stack/merge-surface.mjs`'s own census line --
 *  could never agree with itself. Labelling the sides fixes both, because the
 *  only varying bytes were the labels.
 *
 *  The labels name the side rather than a revision because a merge driver is
 *  not told the revisions; `%O`, `%A` and `%B` are temp paths and there is no
 *  `%`-token for either branch name. Naming the real pathname (`%P`) as well
 *  keeps the marker useful in a `grep -r '<<<<<<<'` over a half-resolved
 *  tree. */
function markerLabels() {
  const where = pathname ? `: ${pathname}` : '';
  return ['-L', `ours${where}`, '-L', `merge base${where}`, '-L', `theirs${where}`];
}

/** The machine-readable half of a diagnostic, in the grammar
 *  `tools/stack/driver-report.mjs` declares and parses.
 *
 *  The prose lines below are for the human who hit the refusal. This line is
 *  for `tools/stack/merge-surface.mjs`, which has the conflicted path list off
 *  STDOUT and no way to know which of those paths a driver refused, because
 *  the reason is on the other handle. That gap is the second case `Ursa/exo`
 *  reported on 2026-11-02: a merge gate with the complete path list still
 *  reported one conflict of two, and the one it dropped was this driver's
 *  refusal on this very file. One line, emitted always, is what makes the
 *  attribution readable without parsing nine English sentences. */
function reportResult(disposition, reason) {
  if (!pathname) return;
  console.error(formatResultLine({ driver: 'register', disposition, path: pathname, reason }));
}

/** Overwrite %A with git's own line merge, so a refusal is visible in the file.
 *
 *  `reason` is the sentence for the human and may name the path and quote
 *  another tool's wording. `machineReason` is the same fact with the framing
 *  stripped, for the attribution line, because that field is read by
 *  `tools/stack/merge-surface.mjs` and printed next to the path it already
 *  names -- so repeating the path inside it is noise in the one field a
 *  resolving seat actually reads. It defaults to `reason` so a call site that
 *  has nothing shorter to say is still attributed. */
function fallBackToGit(reason, machineReason) {
  console.error(`register driver: ${reason}`);
  reportResult(DISPOSITION.REFUSED, machineReason ?? reason);
  const r = spawnSync(
    'git',
    ['merge-file', '--diff3', `--marker-size=${markerSize}`, ...markerLabels(), '-p', ours, ancestor, theirs],
    { encoding: 'utf8', maxBuffer: 1024 * 1024 * 64 },
  );
  if (typeof r.stdout === 'string' && r.stdout.length > 0) {
    writeFileSync(ours, r.stdout);
    console.error(
      'register driver: wrote git\'s own line-based merge into the working tree instead, ' +
        'conflict markers included, so the file shows that it needs a human.',
    );
  } else {
    console.error(
      'register driver: could not even produce a line-based merge, so the working-tree copy ' +
        'is this branch\'s version unchanged. Do not commit it without reading it.',
    );
  }
  process.exit(1);
}

let table;
try {
  table = JSON.parse(readFileSync(TABLE, 'utf8'));
} catch (err) {
  fallBackToGit(`could not read ${TABLE}: ${err.message}`);
}

if (!pathname) {
  fallBackToGit(
    'git did not pass the pathname (%P), so the register this file belongs to cannot be ' +
      'identified. Check that .git/config sets merge.register.driver with %P last.',
  );
}

const entry = table.registers.find((r) => r.path === pathname);

if (!entry) {
  const declared = table.registers.map((r) => r.path).join(', ');
  fallBackToGit(
    `${pathname} is not a declared register. Declared: ${declared}. ` +
      'Pointing this driver at an undeclared file is how a register gets parsed with the ' +
      'wrong grammar, which merges silently and wrongly. Add it to registers.json first.',
  );
}

if (entry.enabled !== true) {
  fallBackToGit(
    `${pathname} is declared but not enabled, for this reason: ${entry.why} ` +
      'Until it is enabled, this file merges the ordinary way.',
  );
}

const args = ['--heading', entry.heading];
if (entry.identifier) args.push('--identifier', entry.identifier);
if (entry.key) args.push('--key', entry.key);
if (entry.section) args.push('--section', entry.section);
if (entry.sectionEnd) args.push('--section-end', entry.sectionEnd);
args.push(ancestor, ours, theirs);

const run = spawnSync('python3', [MERGER, ...args], {
  encoding: 'utf8',
  maxBuffer: 1024 * 1024 * 64,
});

if (run.error) {
  fallBackToGit(`could not run python3 ${MERGER}: ${run.error.message}`);
}

if (run.status !== 0) {
  const why = (run.stderr || '').trim() || `exit status ${run.status} with nothing on stderr`;
  fallBackToGit(`the merger refused ${pathname}. Its reason: ${why}`, why);
}

// Exit 0 from the merger means every post-condition inside it held: the result
// re-parses to the entries it was built from, every entry is byte-for-byte one
// side's, the entry set is the union of both sides, no identifier was minted
// into a duplicate, and the highest identifier is still the last one. Only then
// is it safe to hand the result to git as the working-tree copy.
writeFileSync(ours, run.stdout);
console.error(
  `register driver: ${pathname} merged by entry identity ` +
    `(heading ${entry.heading}${entry.identifier ? `, identifier ${entry.identifier}` : ''}).`,
);
reportResult(DISPOSITION.MERGED);
process.exit(0);
