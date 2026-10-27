#!/usr/bin/env node
// Measure a seat branch pattern against every branch this repository has
// carried, bare substring against anchored, one row per seat.
//
//   node docs/design/data/measure-branch-patterns.mjs <branch-patterns.json>
//
// Written 2026-10-27 by the frontend seat to reproduce a claim made to it
// on the board rather than take it on trust. See
// docs/design/sweep-anchor-verification.md, which also states which of the
// columns below are evidence and which are true by construction.
//
// THE OWNERSHIP TEST IS NOT INDEPENDENT OF THE ANCHORED PATTERN, and the
// write-up says so. `owner()` below is the anchored rule restated, so the
// anchored false-positive column is a tautology. The bare columns are not:
// every branch they report is a real branch whose first segment belongs to
// a different seat, checkable by eye off the printed list.
//
// Exit 0 the table printed. Exit 2 the branch list was empty or the pattern
// file would not parse, because an empty population and a clean population
// print the same zeros and only one of them means anything.
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const patternFile = process.argv[2];
if (!patternFile) {
  console.error('usage: measure-branch-patterns.mjs <branch-patterns.json>');
  process.exit(2);
}

let bp;
try {
  bp = JSON.parse(readFileSync(patternFile, 'utf8'));
} catch (e) {
  console.error(`cannot read ${patternFile}: ${e.message}`);
  process.exit(2);
}
if (!bp.anchor || !bp.seats) {
  console.error(`${patternFile} has no "anchor" or no "seats"`);
  process.exit(2);
}

/** Every branch name the repository has carried: PR head refs ∪ live remotes. */
function allBranches() {
  const sh = (cmd, args) => execFileSync(cmd, args, { encoding: 'utf8' }).split('\n');
  const prs = sh('gh', ['pr', 'list', '--state', 'all', '--limit', '1000',
                        '--json', 'headRefName', '--jq', '.[].headRefName']);
  // Only `origin/<name>`, and only with a name after the slash. A clone that
  // has been unshallowed with an explicit refspec also carries a bare
  // `refs/remotes/origin`, which `%(refname:short)` prints as `origin` and
  // which is not a branch of anything. It was in this measurement's first
  // run and moved the population by two.
  const live = sh('git', ['branch', '-r', '--format=%(refname:short)'])
    .filter((b) => b.startsWith('origin/') && b !== 'origin/HEAD')
    .map((b) => b.slice('origin/'.length));
  return [...new Set([...prs, ...live])]
    .filter((b) => b && b !== 'main' && !b.includes('->'));
}

/** First path segment, optional company prefix removed. The anchor, in prose. */
const owner = (b) => b.split('/')[0].replace(/^ursa-/, '');

const branches = allBranches();
if (branches.length === 0) {
  console.error('no branches found — an empty population prints the same zeros as a clean one');
  process.exit(2);
}

let bareFPtotal = 0;
let bareFNtotal = 0;
const rows = [];

for (const [seat, alts] of Object.entries(bp.seats)) {
  const bare = new RegExp(alts.join('|'));
  const anchored = new RegExp(bp.anchor.replace('ALTS', alts.join('|')));
  const own = branches.filter((b) => alts.includes(owner(b)));

  const bareFP = branches.filter((b) => bare.test(b) && !alts.includes(owner(b)));
  const bareFN = own.filter((b) => !bare.test(b));
  const anchFP = branches.filter((b) => anchored.test(b) && !alts.includes(owner(b)));
  const anchFN = own.filter((b) => !anchored.test(b));

  bareFPtotal += bareFP.length;
  bareFNtotal += bareFN.length;
  rows.push({ seat, own: own.length, bareFP, bareFN, anchFP, anchFN });
}

console.log('seat         own  bareFP bareFN  anchFP anchFN');
for (const r of rows) {
  console.log(
    r.seat.padEnd(12),
    String(r.own).padStart(4),
    String(r.bareFP.length).padStart(6),
    String(r.bareFN.length).padStart(6),
    String(r.anchFP.length).padStart(7),
    String(r.anchFN.length).padStart(6),
  );
}
console.log(`\n${branches.length} branches · bare substring: ${bareFPtotal} false positives, ${bareFNtotal} false negatives`);

console.log('\nEvery bare-substring false positive, so each can be checked by eye:');
for (const r of rows) {
  for (const b of r.bareFP) console.log(`  ${r.seat.padEnd(9)} <- ${b}`);
}
