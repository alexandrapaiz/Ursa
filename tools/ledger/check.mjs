#!/usr/bin/env node
// Ledger contract checker. Enforces docs/standards/pm.md §4 against
// docs/ideas.md, and reports the one failure mode a merge driver cannot see:
// two blocks that are different text but the same idea, which is what a
// hand-resolved append collision leaves behind.
//
//   node tools/ledger/check.mjs [path-to-ledger]
//
// Exit 0 clean, exit 1 with one line per violation.
import { readFileSync } from 'node:fs';
import { parseLedger } from './ledger.mjs';

const path = process.argv[2] ?? 'docs/ideas.md';
const source = readFileSync(path, 'utf8');
const blocks = parseLedger(source);

const STATUSES = ['proposed', 'accepted', 'rejected', 'built', 'urgent'];
const REQUIRED = ['Trigger', 'What', 'First step', 'Cost', 'Status'];

/** @type {string[]} */
const violations = [];
const seen = new Map();

for (const block of blocks) {
  if (block.kind === 'entry') {
    const heading = block.text.split('\n')[0];
    if (!/^###\s+\d{4}-\d{2}-\d{2}\s+—\s+\S/.test(heading)) {
      violations.push(`${path}: heading is not "### YYYY-MM-DD — Idea name": ${heading}`);
    }
    for (const field of REQUIRED) {
      if (!new RegExp(`^-\\s+${field}:`, 'm').test(block.text)) {
        violations.push(`${path}: ${heading} is missing the "- ${field}:" line (pm.md §4)`);
      }
    }
    const status = block.text.match(/^-\s+Status:\s*(\w+)/m)?.[1];
    if (status && !STATUSES.includes(status)) {
      violations.push(
        `${path}: ${heading} has status "${status}"; allowed: ${STATUSES.join(', ')}`,
      );
    }
  }

  // Near-duplicate detection. Compare on letters and digits only, so the
  // pair that differs by "§16.2" versus "plan 16.2" still collides.
  const shape = block.text.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (shape.length < 40) continue;
  const fingerprint = shape.slice(0, 200);
  if (seen.has(fingerprint)) {
    violations.push(
      `${path}: near-duplicate block. "${block.key.slice(0, 60)}" repeats "${seen
        .get(fingerprint)
        .slice(0, 60)}". A hand-resolved append collision leaves exactly this.`,
    );
  } else {
    seen.set(fingerprint, block.key);
  }
}

// Conflict markers committed by accident are the other thing worth failing on.
for (const marker of ['<<<<<<<', '>>>>>>>']) {
  if (source.includes(marker)) violations.push(`${path}: a "${marker}" conflict marker is committed`);
}

if (violations.length > 0) {
  for (const v of violations) console.error(`::error::${v}`);
  console.error(`Ledger contract: ${violations.length} violation(s) in ${path}.`);
  process.exit(1);
}
console.log(`Ledger contract: ${blocks.length} blocks in ${path}, clean.`);
