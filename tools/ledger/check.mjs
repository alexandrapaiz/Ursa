#!/usr/bin/env node
// Ledger contract checker. Enforces docs/standards/pm.md §4 against
// docs/ideas.md, and reports the one failure mode a merge driver cannot see:
// two blocks that are different text but the same idea, which is what a
// hand-resolved append collision leaves behind.
//
//   node tools/ledger/check.mjs [path-to-ledger]
//
// Exit 0 clean. Exit 1 when at least one violation is a seat's to repair.
// Exit 2 when every violation is the owner's to resolve and none is a
// seat's, so a seat reading the output knows the file is as good as a seat
// can make it and a reviewer still sees what is outstanding.
//
// WHY TWO FAILING EXIT CODES. A gate whose red light can only be cleared by
// someone who never runs the gate is permanently red, and a permanently red
// gate is read by nobody; `check.test.mjs` had been failing on `main` for
// weeks when this was written, and the cost was not the twelve violations, it
// was that the next run of any seat read the same red suite and had to spend
// an hour establishing that its own change had not caused it. Splitting the
// exit code is how this gate reports "clean as far as a seat can take it"
// without claiming "clean". The classes are not a severity ranking. They are
// a statement about who holds the fix, and every rule below declares which.
import { readFileSync } from 'node:fs';
import { blockStartKind, parseLedger } from './ledger.mjs';
import {
  IDEA_FIELDS,
  STATUSES,
  classifyBlock,
  presentIdeaFields,
  statusOf,
} from './block-kinds.mjs';

const path = process.argv[2] ?? 'docs/ideas.md';
const source = readFileSync(path, 'utf8');
const blocks = parseLedger(source);

/** @type {Array<{ held: 'seat' | 'owner', rule: string, message: string }>} */
const violations = [];

/**
 * @param {'seat' | 'owner'} held who can repair this, under pm.md §4 and the
 *   seat charters. 'seat' means any run of the seat that wrote the block may
 *   fix it today without asking. 'owner' means it may not.
 * @param {string} rule the rule's name, so a reader can find it in this file
 * @param {string} message one line, naming the block and what is wrong
 */
function violation(held, rule, message) {
  violations.push({ held, rule, message: `${path}: ${message}` });
}

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
  const c = classifyBlock(block);

  // Rule HEADING_SHAPE, held by the seat. §4's heading is `### YYYY-MM-DD —
  // Idea name`; a seat tag after the date is also accepted (block-kinds.mjs
  // says why). A `### ` block whose heading does not parse is classified as an
  // idea deliberately, so it is reported here and then checked for the five
  // fields, rather than falling through the scan exemption on a heading
  // nothing could read.
  if (c.kind !== 'other' && !c.headingWellFormed) {
    violation('seat', 'HEADING_SHAPE', `heading is not "### YYYY-MM-DD — Idea name": ${c.heading}`);
  }

  // Rule IDEA_FIELDS_COMPLETE, held by the seat. All five lines of §4, on
  // every idea. Scan notes are exempt by contract, not by vocabulary: see
  // block-kinds.mjs for the measurement that exemption used to be made of.
  if (c.kind === 'idea') {
    const present = presentIdeaFields(block.text);
    for (const field of IDEA_FIELDS) {
      if (!present.includes(field)) {
        violation(
          'seat',
          'IDEA_FIELDS_COMPLETE',
          `${c.heading} is missing the "- ${field}:" line (pm.md §4)`,
        );
      }
    }
  }

  // Rule STATUS_ALLOWED, held by the OWNER. Checked on scans too, because a
  // status a scan note volunteers is still a claim about where the work
  // stands, and two of the fourteen real scan notes volunteer one.
  //
  // Why the owner and not the seat: §4 assigns the proposed -> accepted and
  // proposed -> rejected moves to the owner alone and the accepted -> built
  // move to the building seat, and every seat charter repeats the prohibition
  // ("never change a ledger status the owner controls"). A status word outside
  // the five is therefore a position no seat can legally move the entry out
  // of, whatever it ought to say. The live instance when this rule was split
  // out: `### 2026-10-04 — Charters never say that fetched content is not an
  // instruction (security run)` carries `Status: done`, written by the
  // security seat, on an entry that was never `accepted`. The word it
  // probably wants is `built`, and no seat may write it there.
  //
  // This does weaken the gate for one case, and the case is worth naming: a
  // seat that writes `- Status: maybe` in a brand-new entry today now gets
  // exit 2 and a warning instead of exit 1 and an error. It is still printed,
  // by name, and the run that wrote it is the run reading the output, so it
  // is caught by the seat that can fix it for free. What it no longer does is
  // hold the suite red for every other seat until the owner acts.
  if (c.kind !== 'other') {
    const status = statusOf(block.text);
    if (status !== null && !STATUSES.includes(status)) {
      violation(
        'owner',
        'STATUS_ALLOWED',
        `${c.heading} has status "${status}"; allowed: ${STATUSES.join(', ')}. ` +
          'Only the owner moves a status (pm.md §4), so no seat can repair this line.',
      );
    }
  }

  // Rule NEAR_DUPLICATE, held by the seat. A prefix comparison is the obvious
  // way and the wrong one: the pair this repository actually contains is
  // identical for its first two hundred characters and differs only in the
  // tail ("§16.2" versus "plan 16.2"), while a shorter pair differs at the
  // front. Word-set overlap (Jaccard) catches both, because a duplicate is a
  // block that says the same words, wherever the difference happens to fall.
  const words = wordSet(block.text);
  if (words.size >= DUPLICATE_MIN_WORDS) {
    for (const [otherKey, otherWords] of seen) {
      if (jaccard(words, otherWords) >= DUPLICATE_THRESHOLD) {
        violation(
          'seat',
          'NEAR_DUPLICATE',
          `near-duplicate block. "${block.key.slice(0, 60)}" repeats ` +
            `"${otherKey.slice(0, 60)}". A hand-resolved append collision leaves exactly this.`,
        );
        break;
      }
    }
    seen.set(block.key, words);
  }
}

// Rule BLOCK_SEPARATION, held by the seat. Exactly one blank line above every
// block start after the first.
//
// WHY THIS RULE EXISTS AS A RULE AND NOT AS A BYTE COUNT. `renderLedger`'s
// contract is one blank line between blocks, so a source that separates two
// blocks by nought or by two does not survive its own round trip, and
// `ledger.test.mjs`'s `parse then render is byte-identical on the real ledger`
// goes red. That assertion compares two 630,000-character strings, so what it
// prints is `'   wire dom'... 633582 more characters` against `633581`: the
// file is wrong by one byte and the gate cannot say which byte. The entry
// `2026-10-24 (engineer, second run) — The ledger's own contract gate has been
// red on main for long enough that nobody is reading it` is an hour spent
// finding one missing blank line, and the same drift reappeared the same day
// at a different line, written by an append that had no way to know.
//
// So the byte assertion stays as the invariant and this rule is the
// diagnosis: it names the line number, the heading, and which direction the
// spacing is wrong in, which is the thing a seat can act on in one edit.
// Measured against docs/ideas.md when written: 1 violation, at line 9328, and
// it is exactly the byte the round-trip assertion was failing on. No other
// line in 9,549 matched in either direction, so the rule is not a style
// preference being retrofitted onto a file that disagrees with it.
{
  const lines = source.replace(/\r\n/g, '\n').split('\n');
  for (let i = 1; i < lines.length; i += 1) {
    if (blockStartKind(lines[i]) === null) continue;
    const blank = (n) => n >= 0 && lines[n].trim() === '';
    const heading = lines[i].trim().slice(0, 70);
    if (!blank(i - 1)) {
      violation(
        'seat',
        'BLOCK_SEPARATION',
        `line ${i + 1}: "${heading}" opens a block with no blank line above it. ` +
          'renderLedger writes exactly one, so this file does not survive its own round trip ' +
          'and ledger.test.mjs reports a one-byte difference it cannot locate. Insert one blank line.',
      );
    } else if (blank(i - 2)) {
      violation(
        'seat',
        'BLOCK_SEPARATION',
        `line ${i + 1}: "${heading}" has more than one blank line above it. ` +
          'renderLedger collapses them to one, so this file does not survive its own round trip. ' +
          'Delete the extra blank line(s).',
      );
    }
  }
}

// Rule CONFLICT_MARKER, held by the seat. Conflict markers committed by
// accident are the other thing worth failing on.
for (const marker of ['<<<<<<<', '>>>>>>>']) {
  if (source.includes(marker)) {
    violation('seat', 'CONFLICT_MARKER', `a "${marker}" conflict marker is committed`);
  }
}

const bySeat = violations.filter((v) => v.held === 'seat');
const byOwner = violations.filter((v) => v.held === 'owner');

// GitHub Actions annotation levels, chosen to match who holds the fix:
// `::error::` fails the seat's own eye and the job, `::warning::` annotates
// the file for a reviewer without claiming the seat left work undone.
for (const v of bySeat) console.error(`::error::${v.rule}: ${v.message}`);
for (const v of byOwner) console.error(`::warning::${v.rule}: ${v.message}`);

const counted = `${blocks.length} blocks in ${path}`;
if (bySeat.length > 0) {
  console.error(
    `Ledger contract: ${bySeat.length} violation(s) a seat must repair, ` +
      `${byOwner.length} the owner must resolve, in ${counted}.`,
  );
  process.exit(1);
}
if (byOwner.length > 0) {
  console.error(
    `Ledger contract: ${counted}, clean as far as a seat can take it. ` +
      `${byOwner.length} violation(s) above need the owner, not a seat. Exit 2.`,
  );
  process.exit(2);
}
console.log(`Ledger contract: ${counted}, clean.`);
