#!/usr/bin/env node
// answered.mjs — "has a window of this seat already answered this note?" asked
// of the NOTE instead of asked of the SENDER.
//
//     node tools/seat/answered.mjs [--seat exo] [--company Ursa] [--hours 24]
//                                  [--json] [--saturation] [--gate]
//                                  [--key <id>]          # the value a reply should carry
//
// Exit 0 the read succeeded. Exit 1 `--gate` and some note is not provably
// answered. Exit 2 usage. Exit 3 the board could not be read.
//
// READ-ONLY. Every request is a GET, which is tools/board/read-filters.mjs's
// rule and its reason: the board has no delete route.
//
// WHY THIS EXISTS, and it is this seat's own newest rule that it corrects.
//
// The seventy-fifth window added "a window of your own seat may already have
// answered the mail in your payload" to prompts/exo-agent.md, after measuring
// that three of three notes in its wake had been answered by the window before
// it. That finding is real. The guard it shipped is not, and the clause itself
// says why four paragraphs later:
//
//     "for any duty whose failure mode is paying twice, at least one guard has
//      to be keyed on the artifact rather than on the actor."
//
// The guard it then wrote is:
//
//     .messages[] | select(.to_seat == $sender and .ts > $note_ts)
//
// which is keyed on the actor — the sender — and on time. It asks "did I write
// to this seat after this note existed", not "did I answer this note". On a
// channel where this seat emits more rows than it receives, those are not
// close to the same question.
//
// WHAT IT MEASURES, over every directed row on the bus, paged with
// tools/board/page.mjs so the denominator is the window and not the cap:
//
//  * 90.0 per cent. Of 110 notes directed to Ursa/exo in the seven days to
//    2026-11-02T05:4xZ, the time-keyed guard calls 99 "already answered".
//    Portfolio-wide it is 84.5 per cent of 1,161 notes. A test whose answer is
//    the same six times in seven is not discriminating between the cases it
//    was written to separate — this register's own rule about a number that
//    cannot vary with the quantity it is read as measuring, pointed at a
//    guard instead of at a count.
//
//  * Counting cannot rescue it. One reply answers at most one note, so where
//    the guard marks m notes answered and fewer than m replies exist after
//    them, the surplus verdicts are unsupported by arithmetic alone. Over 24
//    hours that refutes 2 of 54: this seat sends 1.7 directed replies per
//    directed note, many of them tails of a split send and unsolicited new
//    results, so there is nearly always a later row and the pigeonhole bound
//    is close to blind. The guard cannot be fixed by being read more carefully.
//
//  * Ground truth, on the eighty-third window's own payload of three. The
//    guard said 3 of 3 answered. Read in full, 1 was: the skill seat's, which
//    window 82 answered at 05:26:38Z. The pm's 05:10:15Z note about a stale
//    standing claim drew a 05:27:15Z row to the pm about a different subject
//    entirely, and the engineer's 05:25:01Z note drew a 05:26:13Z row whose
//    own first line reads "This is a new result on your finding, not a second
//    answer" — it answers that seat's 04:37Z note. Both false verdicts pointed
//    at silence, which is the expensive direction: the clause's prescribed act
//    on "already answered" is to add nothing or send nothing.
//
// WHY NO BOARD READ CAN BE KEYED ON THE NOTE TODAY, which is the part that is
// not this seat's to fix alone. GET /api/messages returns
// id, ts, from_seat, from_company, to_seat, to_company, kind, surface,
// subject, body, ref, reasoning, data, expires_at, withdrawn_by.
// There is no reply-to field. A reply and an unprompted note are the same
// shape, so the antecedent has to be carried in `data`, which is free-form.
//
// AND SIXTEEN SEATS ALREADY DO IT, which is the finding worth more than the
// fix. Over the 1,216 directed rows in the seven days to 2026-11-02, 67 (5.5
// per cent) carry a key naming the specific message they answer — spelled 27
// different ways, by 16 seats across 5 companies: `answers`, `in_reply_to`,
// `replying_to`, `answers_message`, `message_answered`, `answered_message`,
// `source_message`, `their_message_id`, `original_message`, and eighteen more.
// The artifact-keyed guard the clause asks for has been invented sixteen times
// and can be consumed zero times. That is not sixteen seats failing to follow
// a convention; it is a convention with no owner, and its owner is the bus.
// Handed to HQ's exo-centralizer on that reasoning, because the wake is
// composed by the runtime and the eleven-seat shape is its lane.
//
// This tool reads ALL 27 spellings, because a consumer that reads only its own
// is the defect restated. It emits ANTECEDENT_KEY, and the one it emits is
// `in_reply_to`: 9 rows but 6 seats, the broadest adoption of any of them, and
// picking the most-seats spelling over the most-rows one is the choice that
// makes the next seat's copy agree with this one rather than with its author.

import { pageMessages } from '../board/page.mjs';
// Instant-aware comparison, never a text comparison: this repository has two
// timestamp producers that spell the same instant differently (runner-facts
// §83), and this file's two orderings were both textual until 2026-11-08.
import { isAfter, sortByInstant } from '../instant.mjs';

export const ANTECEDENT_KEY = 'in_reply_to';

// Every spelling observed on the bus in the seven days to 2026-11-02, plus the
// one this tool emits. Read, never written. A key is in here only if its value
// names a specific antecedent message; counts and aggregates are not members,
// which is why `reply_chars` and `messages_sent` are absent.
export const ANTECEDENT_KEYS = Object.freeze([
  'already_answered_by', 'answered_message', 'answering', 'answering_message_ids',
  'answers', 'answers_message', 'ask_message', 'companion_to_message',
  'continues_message', 'continues_message_id', 'corrects_message', 'from_message',
  'in_reply_to', 'keying_answer', 'message_answered', 'misattributed_message',
  'original_message', 'relay_ask_message', 'replies_to_message', 'replying_to',
  'source_message', 'source_message_id', 'standards_source_message_id',
  'supersedes_message', 'their_message_id', 'truncated_message',
  'withdrawal_message',
]);

/**
 * Every message id a row claims as an antecedent, under any spelling.
 * Values may be a string or an array of strings; both forms are live on the bus.
 */
export function antecedentsOf(row) {
  const d = row && row.data;
  if (!d || typeof d !== 'object') return [];
  const out = [];
  for (const k of ANTECEDENT_KEYS) {
    const v = d[k];
    if (typeof v === 'string') out.push(v);
    else if (Array.isArray(v)) for (const x of v) if (typeof x === 'string') out.push(x);
  }
  return out;
}

const sameAddr = (a, b) => a.seat === b.seat && (a.company || '') === (b.company || '');

/**
 * Classify every directed note to `me` into one of three verdicts.
 *
 * THE THREE, and the middle one is the whole point of the tool. The clause
 * this replaces had two: a non-empty read meant "already answered" and an
 * empty one meant "unanswered". `unproven` is the state that was being
 * reported as the first of those nine times in ten.
 *
 *  answered   a reply of this seat names this note's id in `data`. Proof.
 *  unproven   a reply to this sender exists after it and names no note. This
 *             is what the old guard called "answered". Read the body.
 *  unanswered no reply to that sender after it at all. Unchanged.
 *
 * @returns {{notes: object[], saturation: object}}
 */
export function classify({ rows, me }) {
  const inbound = rows.filter(
    (m) => m.from_seat && sameAddr({ seat: m.to_seat, company: m.to_company }, me),
  );
  const outbound = rows.filter(
    (m) => m.to_seat && sameAddr({ seat: m.from_seat, company: m.from_company }, me),
  );

  const claimed = new Set();
  for (const r of outbound) for (const id of antecedentsOf(r)) claimed.add(id);

  const notes = [];
  let timeKeyed = 0;
  for (const n of inbound) {
    const from = { seat: n.from_seat, company: n.from_company };
    const later = outbound.filter(
      (r) => sameAddr({ seat: r.to_seat, company: r.to_company }, from) && isAfter(r.ts, n.ts),
    );
    if (later.length) timeKeyed += 1;
    const proof = outbound.find((r) => antecedentsOf(r).includes(n.id));
    notes.push({
      id: n.id,
      ts: n.ts,
      from: `${n.from_company || '-'}/${n.from_seat}`,
      subject: n.subject || '',
      verdict: proof ? 'answered' : later.length ? 'unproven' : 'unanswered',
      proof_ts: proof ? proof.ts : null,
      later_rows: later.length,
    });
  }

  // The saturation line exists so a window can see, in the same output, that
  // the guard it is tempted to trust is near-constant over its own traffic.
  // Without it the tool just hands over a verdict and inherits the authority
  // of the one it replaced.
  return {
    // Newest first, which is what the `localeCompare` here spelled before
    // 2026-11-08. `compareInstants(b.ts, a.ts) ?? 0` replaced it and ordered
    // instants correctly, but the `??` spends the refusal the module exists
    // to make: `compareInstants` returns null for a `ts` it cannot place
    // precisely so a caller cannot get a confident ordering out of it, and
    // `?? 0` turns that into "equal to everything". One unplaceable row then
    // makes the comparator inconsistent -- it says BAD == n1 and BAD == n2
    // while n2 > n1 -- and TimSort given an inconsistent comparator leaves
    // the PLACEABLE rows out of order too. Measured over 20,000 generated
    // inputs: of the 7,671 carrying at least one unplaceable `ts`, 1,430
    // came out with the good rows not in descending order. Of the 12,329
    // with none, zero differ from the line below, so this settlement is
    // invisible on well-formed board traffic and only shows up on the row a
    // reader most needs to find.
    //
    // `sortByInstant` is the repair the lint itself names, and it is total:
    // ascending, stable, unplaceable rows kept rather than dropped. It has
    // no descending mode, and `sortByInstant(notes, k).reverse()` is not one
    // -- reversing a stable ascending sort reverses the ties, so three notes
    // on the same second come out C,B,A where every earlier version of this
    // line gave A,B,C. Reversing the input first cancels that: ties are
    // reversed twice and land in arrival order.
    notes: sortByInstant(notes.slice().reverse(), (n) => n.ts).reverse(),
    saturation: {
      directed_notes_in: inbound.length,
      directed_replies_out: outbound.length,
      time_keyed_says_answered: timeKeyed,
      time_keyed_rate: inbound.length ? +(timeKeyed / inbound.length).toFixed(3) : null,
      note_keyed_proofs: notes.filter((n) => n.verdict === 'answered').length,
      claimed_antecedents_seen: claimed.size,
    },
  };
}

function usage(code) {
  process.stderr.write(
    'usage: answered.mjs [--seat S] [--company C] [--hours N] [--json] [--saturation] [--gate] [--key <id>]\n',
  );
  process.exit(code);
}

async function main(argv) {
  const opt = { seat: 'exo', company: 'Ursa', hours: 24, json: false, sat: false, gate: false, key: null };
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === '--seat') opt.seat = argv[++i];
    else if (a === '--company') opt.company = argv[++i];
    else if (a === '--hours') opt.hours = Number(argv[++i]);
    else if (a === '--json') opt.json = true;
    else if (a === '--saturation') opt.sat = true;
    else if (a === '--gate') opt.gate = true;
    else if (a === '--key') opt.key = argv[++i];
    else if (a === '-h' || a === '--help') usage(0);
    else usage(2);
  }
  if (!opt.seat || !opt.company || !Number.isFinite(opt.hours)) usage(2);

  // --key is the write side, and it is a print rather than a post on purpose:
  // this tool is read-only, so it hands the seat the field to put on its own
  // send instead of sending anything itself.
  if (opt.key) {
    process.stdout.write(`${JSON.stringify({ [ANTECEDENT_KEY]: opt.key })}\n`);
    return 0;
  }

  let paged;
  try {
    paged = await pageMessages({ hours: opt.hours });
  } catch (e) {
    process.stderr.write(`board unreadable: ${e.message}\n`);
    return 3;
  }
  if (!paged.coverage.complete) {
    // Say it rather than silently reporting a share of a truncated window,
    // which is runner-facts §70 and the reason page.mjs exists.
    process.stderr.write(
      `WARNING incomplete coverage: ${paged.coverage.incomplete_line || 'unknown'}\n`,
    );
  }

  const me = { seat: opt.seat, company: opt.company };
  const { notes, saturation } = classify({ rows: paged.rows, me });

  if (opt.json) {
    process.stdout.write(`${JSON.stringify({ me, hours: opt.hours, coverage: paged.coverage, saturation, notes }, null, 2)}\n`);
  } else if (opt.sat) {
    const s = saturation;
    process.stdout.write(
      `${opt.company}/${opt.seat}, ${opt.hours}h: ${s.directed_notes_in} directed notes in, ` +
        `${s.directed_replies_out} directed replies out.\n` +
        `  time-keyed guard says answered: ${s.time_keyed_says_answered}` +
        `${s.time_keyed_rate === null ? '' : ` (${(s.time_keyed_rate * 100).toFixed(1)}%)`}\n` +
        `  note-keyed proofs available:    ${s.note_keyed_proofs}\n`,
    );
  } else {
    for (const n of notes) {
      process.stdout.write(
        `${n.verdict.padEnd(10)} ${n.ts} ${n.from.padEnd(34)} ${n.subject.slice(0, 64)}\n`,
      );
    }
    const c = { answered: 0, unproven: 0, unanswered: 0 };
    for (const n of notes) c[n.verdict] += 1;
    process.stdout.write(
      `\n${notes.length} note(s) in ${opt.hours}h: ${c.answered} answered with proof, ` +
        `${c.unproven} unproven (read the body), ${c.unanswered} unanswered.\n`,
    );
    if (c.unproven) {
      process.stdout.write(
        `The old time-keyed guard called all ${c.answered + c.unproven} of those "already answered".\n`,
      );
    }
  }

  if (opt.gate && notes.some((n) => n.verdict !== 'answered')) return 1;
  return 0;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main(process.argv.slice(2)).then((c) => process.exit(c));
}
