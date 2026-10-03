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

const result = mergeLedgers(
  read(ancestor),
  read(ours),
  read(theirs),
  Number.parseInt(markerSize ?? '7', 10) || 7,
);

writeFileSync(ours, result.merged);

const label = pathname ?? 'ledger';
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
