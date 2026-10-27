#!/usr/bin/env node
// own-prs.mjs — which open pull requests belong to this seat, and which of
// them are drafts nobody is still working on.
//
//     node tools/seat/own-prs.mjs <seat> [--drafts] [--all] [--json]
//                                        [--require-empty] [--from <file>]
//
// Exit 0 when the read succeeded, 1 when --require-empty was passed and the
// selection is non-empty, 2 on usage, 3 when the forge could not be read.
//
// WHY THIS EXISTS, and it is not convenience.
//
// Every seat charter names its own branch pattern twice: in "Read your own
// seat's open PRs first", which finds work the seat has not landed, and at the
// foot of "Ship first, then work", which decides whether a draft was
// abandoned. Nothing required the two copies to agree. In three charters they
// did not, and two drafts stood 2d20h and 4d2h invisible to their own seat's
// sweep before being closed unmerged
// (INC-2026-10-26-the-ship-first-draft-sweep-matches-a-narrower-branch-pattern-than-the-section-that-finds-the-same-branches).
//
// The values were unified on 2026-10-27 and the SHAPE was not, so the next
// edit to either copy re-opens it in whichever seat is edited. This file is
// the shape fix: the pattern lives in branch-patterns.json, both sections call
// this tool, and own-prs.test.mjs fails when a charter's prose copy disagrees
// with the JSON. The prose copies are kept deliberately — a charter is read by
// a fresh run that copy-pastes, so the literal has to stay legible — which
// means the mechanism binding them has to be a test and not a deletion.
//
// TWO DEFECTS IT FIXES BEYOND THE FORK, both measured.
//
// 1. The patterns were BARE SUBSTRINGS. `test("fin|finance")` matches
//    `engineer/...-brie-fin-g` and `ursa-pm/...-staf-fin-g`; `test("fe|frontend")`
//    matches `engineer/...-li-fe-span` and `hq/company-mani-fe-st`;
//    `test("sec|security")` matches `chair/vendor-pm-sec-tion-22`; `test("pm")`
//    matches seven branches of four other seats. Over all 578 pull request
//    branches of this repository: anchoring to the first path segment gives 0
//    false positives and 0 false negatives for all eleven seats, where the bare
//    substring gives 0 false negatives and 16 false positives across six seats.
//
//    The direction matters. The sweep's prescribed action on anything it prints
//    is "yours to resolve before you stop" — absorb it, ready it, or close it.
//    A false negative loses a seat its own draft; a false positive tells a seat
//    to close a sibling's live one. Widening the pattern without anchoring it
//    traded the first fault for the second.
//
// 2. The sweep was SILENT ON ABSENCE. A `jq` select that matches nothing
//    prints nothing, and nothing is exactly what a clean sweep prints, so a run
//    cannot tell "no dead drafts" from "the filter could not see them" — the
//    same shape as
//    INC-2026-10-26-an-absence-measured-by-an-instrument-that-could-not-see-presence.
//    This tool always prints a count line, including `0`, and names the pattern
//    it used, so the absence carries its own positive control.
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const SPEC = JSON.parse(
  readFileSync(new URL('./branch-patterns.json', import.meta.url), 'utf8'),
);

/** The anchored regex for one seat, composed from the single source. */
export function patternFor(seat) {
  const alts = SPEC.seats[seat];
  if (!alts) return null;
  return SPEC.anchor.replace('ALTS', alts.join('|'));
}

export const seats = () => Object.keys(SPEC.seats);

/**
 * Ground truth for "whose branch is this": the first path segment, with any
 * company prefix stripped. `ursa-pm/2026-10-27-x` and `pm/2026-10-27-x` are
 * both the pm seat's; `ursa-pm/2026-10-08-message-frontend` is not frontend's.
 * Exported because the test measures the pattern against it rather than
 * against a second hand-written list.
 */
export function seatOfBranch(branch) {
  const head = String(branch).split('/')[0];
  const dash = head.indexOf('-');
  return dash === -1 ? head : head.slice(dash + 1);
}

/**
 * The same segment resolved to a CANONICAL seat name, or null if it is not a
 * seat's branch at all. `fin/2026-10` and `ursa-finance/...` both resolve to
 * `finance`; `chair/pm-merges` and `hq/company-manifest` resolve to null.
 *
 * Kept separate from seatOfBranch because the two answer different questions
 * and conflating them is how the short-form branches got lost in the first
 * place: the segment is what the branch says, and this is who it belongs to.
 */
export function canonicalSeatOfBranch(branch) {
  const seg = seatOfBranch(branch);
  for (const [seat, alts] of Object.entries(SPEC.seats)) {
    if (seat === seg || alts.includes(seg)) return seat;
  }
  return null;
}

export function selectOwn(seat, prs) {
  const pattern = patternFor(seat);
  if (!pattern) return null;
  const re = new RegExp(pattern);
  return prs.filter((p) => re.test(p.headRefName));
}

function readForge() {
  const r = spawnSync(
    'gh',
    ['pr', 'list', '--state', 'open', '--limit', '200', '--json',
     'number,headRefName,title,isDraft,updatedAt,author'],
    { encoding: 'utf8' },
  );
  if (r.status !== 0) return { error: (r.stderr || 'gh failed').trim() };
  try {
    return { prs: JSON.parse(r.stdout) };
  } catch (e) {
    return { error: `gh returned unparseable JSON: ${e.message}` };
  }
}

function main(argv) {
  const flags = new Set(argv.filter((a) => a.startsWith('--')));
  const positional = argv.filter((a) => !a.startsWith('--'));
  const fromIdx = argv.indexOf('--from');
  const seat = positional[0];

  if (!seat || flags.has('--help')) {
    console.error(
      'usage: own-prs.mjs <seat> [--drafts] [--all] [--json] [--require-empty] [--from <file>]\n' +
      `seats: ${seats().join(', ')}`,
    );
    return 2;
  }
  const pattern = patternFor(seat);
  if (!pattern) {
    console.error(`no branch pattern for seat "${seat}"; known seats: ${seats().join(', ')}`);
    return 2;
  }

  let prs;
  if (fromIdx !== -1) {
    prs = JSON.parse(readFileSync(argv[fromIdx + 1], 'utf8'));
  } else {
    const r = readForge();
    if (r.error) {
      // Exit 3, never 0. An unreadable forge and an empty queue are the same
      // output to a `jq` pipeline, and telling them apart is this tool's job.
      console.error(`could not read the forge: ${r.error}`);
      console.log(`seat=${seat} pattern=${pattern} COULD NOT MEASURE`);
      return 3;
    }
    prs = r.prs;
  }

  const own = selectOwn(seat, prs);
  const wanted = flags.has('--all') ? own : own.filter((p) => !flags.has('--drafts') || p.isDraft);

  if (flags.has('--json')) {
    console.log(JSON.stringify(
      { seat, pattern, open_total: prs.length, own: own.length, selected: wanted }, null, 2));
  } else {
    // The count line is unconditional and comes first. That is the whole point:
    // a clean sweep has to look different from a broken one.
    const kind = flags.has('--drafts') && !flags.has('--all') ? 'draft' : 'open';
    console.log(
      `seat=${seat} pattern=${pattern} open_in_repo=${prs.length} ` +
      `own=${own.length} own_${kind}=${wanted.length}`,
    );
    for (const p of wanted) {
      console.log(`#${p.number}\t${p.headRefName}\t${p.isDraft ? 'DRAFT' : 'ready'}\t${p.updatedAt}\t${p.title}`);
    }
  }

  if (flags.has('--require-empty') && wanted.length > 0) return 1;
  return 0;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  process.exit(main(process.argv.slice(2)));
}
