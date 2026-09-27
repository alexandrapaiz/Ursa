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
/** block key -> its word set, for the near-duplicate pass */
const seen = new Map();

/** Words of three or more letters or digits, lowercased. Punctuation, markdown
 *  and section-symbol noise do not distinguish two blocks. */
function wordSet(text) {
  return new Set(
    text
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((w) => w.length >= 3),
  );
}

/** |A ∩ B| / |A ∪ B|. 1 means the same words, 0 means no shared word. */
function jaccard(a, b) {
  let shared = 0;
  for (const w of a) if (b.has(w)) shared += 1;
  return shared / (a.size + b.size - shared);
}

// Two blocks sharing nine out of ten words are the same block written twice.
// Measured on docs/ideas.md at 2026-09-27: the duplicated pair of chair notes
// scores 0.98, and the closest genuinely unrelated pair in the whole file (the
// preamble against the "Agentic-forward" entry) scores 0.17. Nothing sits in
// between, so the threshold is not a tuned knob.
const DUPLICATE_THRESHOLD = 0.9;

// Below this many distinct words, two blocks can share 90% of them by being
// short rather than by being duplicates.
const DUPLICATE_MIN_WORDS = 12;

for (const block of blocks) {
  if (block.kind === 'entry') {
    const heading = block.text.split('\n')[0];
    const present = REQUIRED.filter((f) => new RegExp(`^-\\s+${f}:`, 'm').test(block.text));
    // Not every `###` block is an idea. Seats also file competitive-scan notes
    // and the PM files grooming sections under headings, and §4's five fields
    // do not apply to those. The trigger line is the discriminator: §4 says an
    // idea must name its trigger, so a block carrying any of the five fields
    // is an idea and owes all five, and a block carrying none is a note.
    if (present.length > 0) {
    // `### 2026-09-26 (market) — Name` is accepted as well as the bare
    // `### 2026-09-26 — Name` of §4: seats already tag their ledger notes with
    // the seat that filed them, and the tag carries information the date does not.
    if (!/^###\s+\d{4}-\d{2}-\d{2}(\s+\([^)]+\))?\s+—\s+\S/.test(heading)) {
      violations.push(`${path}: heading is not "### YYYY-MM-DD — Idea name": ${heading}`);
    }
    for (const field of REQUIRED) {
      if (!present.includes(field)) {
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
  }

  // Near-duplicate detection. A prefix comparison is the obvious way and the
  // wrong one: the pair this repository actually contains is identical for its
  // first two hundred characters and differs only in the tail ("§16.2" versus
  // "plan 16.2"), while a shorter pair differs at the front. Word-set overlap
  // (Jaccard) catches both, because a duplicate is a block that says the same
  // words, wherever the difference happens to fall.
  const words = wordSet(block.text);
  if (words.size >= DUPLICATE_MIN_WORDS) {
    for (const [otherKey, otherWords] of seen) {
      if (jaccard(words, otherWords) >= DUPLICATE_THRESHOLD) {
        violations.push(
          `${path}: near-duplicate block. "${block.key.slice(0, 60)}" repeats ` +
            `"${otherKey.slice(0, 60)}". A hand-resolved append collision leaves exactly this.`,
        );
        break;
      }
    }
    seen.set(block.key, words);
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
