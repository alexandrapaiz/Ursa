#!/usr/bin/env node
// git merge driver for docs/ideas.md. Registered by
// tools/ledger/install-driver.sh; declared per-path in .gitattributes.
//
// git calls a merge driver as:  <driver> %O %A %B %L %P
//   %O  path to a temp file with the common ancestor's version
//   %A  path to a temp file with our version; the driver OVERWRITES this
//       file with the merge result, and git takes it as the working-tree copy
//   %B  path to a temp file with the other branch's version
//   %L  conflict marker size (7 unless .gitattributes says otherwise)
//   %P  the real pathname being merged, for messages
// Exit 0 means fully merged. Exit non-zero means git records a conflict and
// leaves %A in the working tree for a human, markers and all.
import { readFileSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { mergeLedgers } from './ledger.mjs';

const [ancestor, ours, theirs, markerSize, pathname] = process.argv.slice(2);

if (!ancestor || !ours || !theirs) {
  console.error('usage: union-merge.mjs %O %A %B [%L] [%P]');
  process.exit(2);
}

const read = (p) => {
  try {
    return readFileSync(p, 'utf8');
  } catch {
    return '';
  }
};

const size = Number.parseInt(markerSize ?? '7', 10) || 7;
const result = mergeLedgers(read(ancestor), read(ours), read(theirs), size);

const label = pathname ?? 'ledger';

// A refusal means the file is not the shape this grammar describes, so the
// merge result is meaningless and must not reach the working tree. Added
// 2026-10-24, after measuring what this driver does to a `## `-keyed register:
// 75 entries and 372,901 bytes out of two sides holding at most 42, silently.
// The fallback is git's own line merge, markers included, so the human gets
// exactly what they would have got without any driver, plus the reason.
if (result.refusal) {
  console.error(`ledger driver: refusing to merge ${label}. ${result.refusal}`);
  const git = spawnSync(
    'git',
    ['merge-file', '--diff3', `--marker-size=${size}`, '-p', ours, ancestor, theirs],
    { encoding: 'utf8', maxBuffer: 1024 * 1024 * 64 },
  );
  if (typeof git.stdout === 'string' && git.stdout.length > 0) {
    writeFileSync(ours, git.stdout);
    console.error(
      "ledger driver: wrote git's own line-based merge into the working tree instead, conflict " +
        'markers included, so the file shows that it needs a human.',
    );
  } else {
    console.error(
      'ledger driver: could not even produce a line-based merge, so the working-tree copy is this ' +
        "branch's version unchanged. Do not commit it without reading it.",
    );
  }
  process.exit(1);
}

writeFileSync(ours, result.merged);
if (result.conflicts.length > 0) {
  console.error(
    `ledger driver: ${result.conflicts.length} block(s) in ${label} were edited on both sides and need a human:`,
  );
  for (const key of result.conflicts) console.error(`  ${key}`);
  process.exit(1);
}
console.error(
  `ledger driver: ${label} merged by block identity. ${result.added.length} block(s) taken from the other branch, ${result.removed.length} removed.`,
);
process.exit(0);
