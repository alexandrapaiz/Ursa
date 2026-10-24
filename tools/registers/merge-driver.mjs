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

const here = dirname(fileURLToPath(import.meta.url));
const MERGER = join(here, 'merge-register.py');
const TABLE = join(here, 'registers.json');

const [ancestor, ours, theirs, markerSizeArg, pathname] = process.argv.slice(2);

if (!ancestor || !ours || !theirs) {
  console.error('usage: merge-driver.mjs %O %A %B [%L] [%P]');
  process.exit(2);
}

const markerSize = Number.parseInt(markerSizeArg ?? '7', 10) || 7;

/** Overwrite %A with git's own line merge, so a refusal is visible in the file. */
function fallBackToGit(reason) {
  console.error(`register driver: ${reason}`);
  const r = spawnSync(
    'git',
    ['merge-file', '--diff3', `--marker-size=${markerSize}`, '-p', ours, ancestor, theirs],
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
  fallBackToGit(`the merger refused ${pathname}. Its reason: ${why}`);
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
process.exit(0);
