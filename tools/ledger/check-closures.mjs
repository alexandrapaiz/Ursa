#!/usr/bin/env node
// Closure backlinks: the one link between a shipped fix and the ledger entry
// it closes that is not prose.
//
//   node tools/ledger/check-closures.mjs [path-to-ledger]
//
// Exit 0 clean. Exit 1 when at least one violation is a seat's to repair.
// Exit 2 when every violation is the owner's and none is a seat's. The three
// exit codes and the held/seat-or-owner split are `check.mjs`'s contract,
// reproduced here on purpose: a reader who has learned one of the two ledger
// gates has learned both, and a gate whose red light only its author can
// clear is a gate nobody reads (see the header of `check.mjs`).
//
// WHY THIS GATE EXISTS, measured on 2026-10-26. Nine entries in
// `docs/ideas.md` carried `- Status: urgent`. Three of them described work
// that had shipped to `main` days earlier:
//
//   `survived_verbatim` is not verbatim          shipped 2026-10-13 (467ba564)
//   Two thirds of the characters sold as verbatim  shipped 2026-10-14 (a8c3adce)
//   The ledger's own contract gate has been red    shipped 2026-10-24 (fca32e5f)
//
// Each of the three shipped with a design document that names the entry it
// continues, in prose, in its own first paragraph. Not one of those documents
// could be read by anything, so nothing noticed that the ledger still called
// the work urgent. The cost is not the three lines. It is that `urgent` is
// the queue the PM grooms from and the queue every seat's Observe step
// reads, so for twelve days a third of this organization's stated emergencies
// were already fixed, and the six that were real were diluted by them.
//
// The marker below is the smallest thing that closes that loop: one HTML
// comment in the document that did the work, naming the entry by the one key
// that is unique in the file. Measured over all 294 `### ` headings in
// `docs/ideas.md` at 2026-10-26, the pair (date, title) collides zero times,
// so the key needs no seat tag and no line number and survives the file
// being appended to by every seat every day.
//
// WHAT THIS GATE DELIBERATELY DOES NOT DO. It does not try to infer closure.
// An earlier draft of this run looked for design documents that quote an
// entry's status, on the theory that a stale quote would reveal a stale
// entry; measured over the 19 such quotes in the repository, every one of
// them AGREED with the ledger, because the document and the entry went stale
// together. Inference from prose was therefore not weak, it was empty. A
// marker is a claim a seat makes on purpose, so this gate has no false
// positives by construction: it only ever reports a contradiction between
// two deliberate statements in the same repository.
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { parseLedger } from './ledger.mjs';
import { classifyBlock, statusOf } from './block-kinds.mjs';

/**
 * `<!-- closes: <ledger-path> <YYYY-MM-DD> "<title>" -->`, where <title> is
 * the entry heading's text after the em dash, verbatim. Anything else on the
 * line is not part of the marker, so a document may introduce it in prose on
 * the same line.
 */
export const CLOSURE_MARKER =
  /<!--\s*closes:\s*(\S+)\s+(\d{4}-\d{2}-\d{2})\s+"([^"]+)"\s*-->/g;

/** A line that means to be a marker and is not one. Caught so a typo in the
 *  syntax fails loudly instead of being silently unread, which is the exact
 *  failure mode the marker exists to end. */
const CLOSURE_ATTEMPT = /<!--\s*closes:/;

/** The statuses that mean the entry is closed. A closure marker pointing at
 *  one of these is the state this gate wants. */
const CLOSED_STATUSES = ['built', 'rejected'];

/**
 * Who can repair a marker that points at an entry in this status.
 *
 * `proposed` is the owner's: pm.md §4 says only she moves `proposed` to
 * `accepted` or `rejected`, so a seat that shipped work for an idea the owner
 * never accepted cannot close the entry itself, and the marker is a question
 * for her rather than a defect in the document.
 *
 * `accepted` and `urgent` are the seat's. pm.md §4 assigns `accepted` to
 * `built` to "the building seat ... when the finishing PR merges".
 * It is silent on `urgent`, which is a status seats write themselves
 * (prompts/engineer-agent.md, Act: "record it in the ledger with status
 * `urgent` so tomorrow's run and the PM both see it"), so retiring it falls
 * to the same seat on the same condition.
 *
 * @type {Record<string, 'seat' | 'owner'>}
 */
const HOLDER_BY_STATUS = { proposed: 'owner', accepted: 'seat', urgent: 'seat' };

/**
 * @typedef {{ held: 'seat' | 'owner', rule: string, message: string }} Violation
 */

/**
 * Every tracked markdown file, as git lists them. `git ls-files` rather than
 * a directory walk because the gate's subject is what is committed: an
 * untracked scratch file making a closure claim binds nobody, and a walk
 * would also read `node_modules`.
 * @param {string} cwd repository root
 * @returns {string[]} repo-relative paths
 */
export function trackedMarkdown(cwd) {
  const out = execFileSync('git', ['ls-files', '-z', '*.md'], { cwd, encoding: 'utf8' });
  return out.split('\0').filter((p) => p.length > 0);
}

/**
 * The (date, title) key of every entry in a ledger source, mapped to the
 * status it states. Built from `parseLedger` and `classifyBlock` rather than
 * from a second heading regex, so this gate and the merge driver cannot
 * disagree about what an entry is.
 * @param {string} source the ledger file's contents
 * @returns {Map<string, { status: string | null, heading: string }>}
 */
export function ledgerIndex(source) {
  const index = new Map();
  for (const block of parseLedger(source)) {
    const c = classifyBlock(block);
    if (c.date === null || c.title === null) continue;
    index.set(`${c.date}\u0000${c.title}`, {
      status: statusOf(block.text),
      heading: c.heading ?? '',
    });
  }
  return index;
}

/**
 * Check one document's closure markers against one ledger index.
 *
 * @param {object} args
 * @param {string} args.docPath repo-relative path of the document, for messages
 * @param {string} args.docSource the document's contents
 * @param {string} args.ledgerPath the ledger path this gate was pointed at
 * @param {Map<string, { status: string | null, heading: string }>} args.index
 *   as `ledgerIndex` returns it
 * @returns {{ violations: Violation[], markers: number }}
 */
export function checkDocument({ docPath, docSource, ledgerPath, index }) {
  /** @type {Violation[]} */
  const violations = [];
  let markers = 0;

  for (const [, markerLedger, date, title] of docSource.matchAll(CLOSURE_MARKER)) {
    markers += 1;
    if (markerLedger !== ledgerPath) continue;
    const key = `${date}\u0000${title}`;
    const entry = index.get(key);
    if (entry === undefined) {
      violations.push({
        held: 'seat',
        rule: 'CLOSURE_RESOLVES',
        message:
          `${docPath}: closure marker names "${date} — ${title}" in ${ledgerPath}, ` +
          `and no entry there has that date and title. Either the entry was ` +
          `renamed, in which case the marker follows it, or the title was ` +
          `mistyped. The title is the heading text after the em dash, verbatim.`,
      });
      continue;
    }
    if (entry.status !== null && CLOSED_STATUSES.includes(entry.status)) continue;
    const held = HOLDER_BY_STATUS[entry.status ?? ''] ?? 'seat';
    violations.push({
      held,
      rule: 'CLOSURE_STATUS',
      message:
        `${docPath}: closure marker claims to close ${ledgerPath} entry ` +
        `"${date} — ${title}", which states ` +
        `${entry.status === null ? 'no status' : `status "${entry.status}"`}. ` +
        `A document on this branch saying the work is done and a ledger ` +
        `saying it is open cannot both be right. ` +
        (held === 'owner'
          ? `Held by the owner: pm.md §4 gives only her the move out of "proposed".`
          : `Held by the seat that shipped it: move the entry to "built" with ` +
            `the evidence, or drop the marker if the work is not actually done.`),
    });
  }

  // A line that tried to be a marker and failed to parse is reported even
  // when its ledger path is not the one under check, because an unparsed
  // marker names no path at all.
  for (const line of docSource.split('\n')) {
    if (!CLOSURE_ATTEMPT.test(line)) continue;
    if (line.match(CLOSURE_MARKER) !== null) continue;
    violations.push({
      held: 'seat',
      rule: 'CLOSURE_SYNTAX',
      message:
        `${docPath}: a line opens "<!-- closes:" and does not parse as a ` +
        `closure marker. The shape is ` +
        `<!-- closes: docs/ideas.md YYYY-MM-DD "Entry title" -->, with the ` +
        `title double-quoted. Got: ${line.trim()}`,
    });
  }

  return { violations, markers };
}

/**
 * @param {object} args
 * @param {string} args.cwd repository root
 * @param {string} args.ledgerPath repo-relative ledger path
 * @returns {{ violations: Violation[], markers: number, docs: number }}
 */
export function checkRepository({ cwd, ledgerPath }) {
  const index = ledgerIndex(readFileSync(`${cwd}/${ledgerPath}`, 'utf8'));
  /** @type {Violation[]} */
  const violations = [];
  let markers = 0;
  let docs = 0;
  for (const docPath of trackedMarkdown(cwd)) {
    const docSource = readFileSync(`${cwd}/${docPath}`, 'utf8');
    if (!CLOSURE_ATTEMPT.test(docSource)) continue;
    docs += 1;
    const r = checkDocument({ docPath, docSource, ledgerPath, index });
    violations.push(...r.violations);
    markers += r.markers;
  }
  return { violations, markers, docs };
}

/** Only when run as a program. Importing this file runs no git and reads no
 *  files, so the test suite can drive the pure functions above. */
const invokedDirectly =
  process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href;

if (invokedDirectly) {
  const ledgerPath = process.argv[2] ?? 'docs/ideas.md';
  const { violations, markers, docs } = checkRepository({ cwd: process.cwd(), ledgerPath });
  const bySeat = violations.filter((v) => v.held === 'seat');
  const byOwner = violations.filter((v) => v.held === 'owner');
  for (const v of violations) {
    const level = v.held === 'seat' ? 'error' : 'warning';
    console.log(`::${level}::${v.rule}: ${v.message}`);
  }
  const counted = `${markers} closure marker(s) in ${docs} document(s), against ${ledgerPath}`;
  if (violations.length === 0) {
    console.log(`Closure backlinks: ${counted}, all resolved and all closed. Exit 0.`);
    process.exit(0);
  }
  if (bySeat.length === 0) {
    console.log(
      `Closure backlinks: ${counted}, clean as far as a seat can take it. ` +
        `${byOwner.length} violation(s) above need the owner, not a seat. Exit 2.`,
    );
    process.exit(2);
  }
  console.log(
    `Closure backlinks: ${counted}, ${bySeat.length} violation(s) a seat can repair` +
      `${byOwner.length > 0 ? ` and ${byOwner.length} the owner holds` : ''}. Exit 1.`,
  );
  process.exit(1);
}
