// Pure ledger parsing and three-way merge. No dependencies, no I/O, so the
// git merge driver that wraps it can run inside a `git merge` in a bare
// checkout where `npm install` has never been run.
//
// The ledger (docs/ideas.md) is a sequence of blocks, not a paragraph of
// prose. Every seat appends to its end, which is why a line-based merge
// collides on every concurrent pull request: two appends at the same end of
// the same file are one conflict hunk. Merging by block identity instead
// makes two appends two independent additions, which is what they are.

/**
 * @typedef {{ kind: 'preamble' | 'entry' | 'note', key: string, text: string }} Block
 *   kind    'preamble' is everything above the first `### ` heading (the
 *           contract pointer and the PM's grooming section). 'entry' is one
 *           dated idea, `### YYYY-MM-DD — Name` through the line before the
 *           next block. 'note' is a top-level dated bullet, `- YYYY-MM-DD
 *           (seat): ...`, the form the chair uses for run notes.
 *   key     identity for the three-way merge: the normalized heading for an
 *           entry, the normalized whole line for a note, the literal
 *           '__preamble__' for the preamble. Two blocks with equal keys are
 *           the same ledger item on both sides of the merge.
 *   text    the block's verbatim lines, newline-joined, trailing blank lines
 *           stripped. Reassembly re-inserts exactly one blank line between
 *           blocks, so whitespace drift is not a merge difference.
 */

const ENTRY_HEADING = /^###\s+/;
const DATED_NOTE = /^-\s+\d{4}-\d{2}-\d{2}\b/;

/** Identity key for a block. Case and inner whitespace do not distinguish items. */
function normalizeKey(line) {
  return line.trim().replace(/\s+/g, ' ').toLowerCase();
}

/**
 * Split a ledger file into blocks.
 * @param {string} source full file contents
 * @returns {Block[]}
 */
export function parseLedger(source) {
  const lines = source.replace(/\r\n/g, '\n').split('\n');
  /** @type {Block[]} */
  const blocks = [];
  let current = { kind: 'preamble', key: '__preamble__', text: [] };

  for (const line of lines) {
    if (ENTRY_HEADING.test(line)) {
      blocks.push(current);
      current = { kind: 'entry', key: normalizeKey(line), text: [line] };
    } else if (DATED_NOTE.test(line)) {
      blocks.push(current);
      current = { kind: 'note', key: normalizeKey(line), text: [line] };
    } else {
      current.text.push(line);
    }
  }
  blocks.push(current);

  return blocks
    .map((b) => ({ ...b, text: b.text.join('\n').replace(/\n+$/, '') }))
    .filter((b, i) => b.text.trim() !== '' || i === 0);
}

/**
 * Reassemble blocks into a ledger file: one blank line between blocks,
 * one trailing newline at the end.
 * @param {Block[]} blocks
 * @returns {string}
 */
export function renderLedger(blocks) {
  return blocks.map((b) => b.text).join('\n\n').replace(/\n*$/, '\n');
}

/** @param {Block[]} blocks @returns {Map<string, Block>} */
function index(blocks) {
  const m = new Map();
  for (const b of blocks) m.set(b.key, b);
  return m;
}

/**
 * Three-way merge of one block, by content.
 * Returns the winning text, or null when the block is deleted, or a
 * conflict marker payload when both sides changed the same block differently.
 * @returns {{ text: string | null, conflicted: boolean }}
 */
function mergeBlock(base, ours, theirs, markerSize) {
  const b = base?.text ?? null;
  const o = ours?.text ?? null;
  const t = theirs?.text ?? null;

  if (o === t) return { text: o, conflicted: false };
  if (b === o) return { text: t, conflicted: false };
  if (b === t) return { text: o, conflicted: false };

  // Both sides changed the same entry in different ways. A merge driver that
  // guessed here would silently drop one seat's edit, so it hands the block
  // to a human with the same markers git itself would have written.
  const m = '='.repeat(markerSize);
  const open = '<'.repeat(markerSize);
  const close = '>'.repeat(markerSize);
  const text = [
    `${open} ours`,
    o ?? '(deleted on our side)',
    m,
    t ?? '(deleted on their side)',
    `${close} theirs`,
  ].join('\n');
  return { text, conflicted: true };
}

/**
 * Merge two ledgers against their common ancestor, by block identity.
 *
 * Ordering rule: our block order is preserved; a block only they added is
 * inserted after the block that precedes it on their side, skipping over any
 * blocks we added in that same gap, and appended at the end when that
 * predecessor is not in the result at all. Two seats that both appended at
 * the end therefore both land at the end, ours first, theirs after, which is
 * the order a line-based union merge would have produced had it not
 * conflicted.
 *
 * @param {string} base ancestor contents
 * @param {string} ours current-branch contents
 * @param {string} theirs other-branch contents
 * @param {number} markerSize git's conflict marker length (7 by default)
 * @returns {{ merged: string, conflicts: string[], added: string[], removed: string[] }}
 */
export function mergeLedgers(base, ours, theirs, markerSize = 7) {
  const baseBlocks = parseLedger(base);
  const ourBlocks = parseLedger(ours);
  const theirBlocks = parseLedger(theirs);
  const B = index(baseBlocks);
  const O = index(ourBlocks);
  const T = index(theirBlocks);

  /** @type {Block[]} */
  const out = [];
  const conflicts = [];
  const added = [];
  const removed = [];

  const take = (key) => {
    const r = mergeBlock(B.get(key), O.get(key), T.get(key), markerSize);
    if (r.conflicted) conflicts.push(key);
    if (r.text === null) {
      removed.push(key);
      return;
    }
    out.push({ kind: (O.get(key) ?? T.get(key)).kind, key, text: r.text });
  };

  for (const b of ourBlocks) take(b.key);

  // Blocks only they have, in their order, placed after their predecessor.
  for (let i = 0; i < theirBlocks.length; i += 1) {
    const key = theirBlocks[i].key;
    if (O.has(key)) continue;
    if (B.has(key)) {
      // We deleted it and they did not change it: honor our deletion.
      if (B.get(key).text === theirBlocks[i].text) continue;
    }
    const r = mergeBlock(B.get(key), undefined, theirBlocks[i], markerSize);
    if (r.conflicted) conflicts.push(key);
    const block = { kind: theirBlocks[i].kind, key, text: r.text };
    const predKey = i > 0 ? theirBlocks[i - 1].key : null;
    const at = predKey === null ? -1 : out.findIndex((b) => b.key === predKey);
    if (at === -1) {
      out.push(block);
    } else {
      // Skip past blocks we added ourselves in the same position, so that when
      // both sides appended at the end the result is ours first and theirs
      // after, rather than theirs wedged in front of ours.
      let insertAt = at + 1;
      while (insertAt < out.length && !B.has(out[insertAt].key) && !T.has(out[insertAt].key)) {
        insertAt += 1;
      }
      out.splice(insertAt, 0, block);
    }
    added.push(key);
  }

  return { merged: renderLedger(out), conflicts, added, removed };
}
