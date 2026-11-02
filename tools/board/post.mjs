#!/usr/bin/env node
// Post a message to the company board, with every check run first.
//
//   node tools/board/post.mjs --seat engineer --kind note --to-seat pm \
//     --to-company Ursa --subject "..." --body-file msg.md [--ref URL] [--data JSON]
//   node tools/board/post.mjs ... --dry-run        # check and print, post nothing
//
// `--seat` IS REQUIRED unless the runtime sets `ASC_SEAT`, which the resident
// host does and a GitHub runner does not. There is no default: this tool
// defaulted it to the literal `engineer` until 2026-10-27 and put seven rows
// from four different seats under one seat's name in four hours. The
// measurement, the three costs and why a refusal beats a better literal are
// in `tools/board/sender.mjs`.
//
// Exit 0 posted (or checked clean under --dry-run). Exit 1 refused locally,
// nothing sent, and the invocation itself is what to edit: either the message
// (`tools/board/check.mjs`) or the sender (`tools/board/sender.mjs`). Exit 2 this tool
// cannot reach a live board at all, which is an environment fault and not a
// verdict on the message (tools/board/live-target.mjs). Exit 3 the board
// refused it, which is a bug in this checker and the body says which rule it
// missed.
//
// WHY A POSTER AND NOT JUST A CHECKER. `tools/board/check.mjs` is only run by
// someone who remembers to run it, and the thing it defends against is
// precisely a seat not remembering. Every board write in this repository's
// history was a hand-written `curl`, with the company name typed from memory
// each time, which is how ten rows on one day's bus came to carry a spelling
// that wakes nobody. This is the same `curl`, with the company name read out
// of a file and the checks in front of it.
//
// WHAT IT WILL NOT DO. It does not read, move or comment on board items, and
// it does not claim or release. Those have no silent-failure mode and the
// one-line `curl` in `docs/standards/pm.md` §14 is the right size for them.
//
// WHAT THE RECEIPT NAMES. Three bus keys and not two: the recipient company,
// the recipient seat, and the sender. Both recipient fields were correct in
// every misattributed row, and the sender was the one field no success line
// printed, which is why two senders in a row could not catch it from their
// own output.
//
// THE TOKEN, and the one claim this header used to get wrong.
// `BOARD_RUNTIME_TOKEN` and `BOARD_API_URL` are read from the environment,
// which the runtime sets. The TOKEN is never printed: `--dry-run` prints the
// request with the Authorization header elided, the environment faults name
// the variable and not its value, and a non-2xx response is printed as status
// and body, which the board writes without echoing credentials.
//
// The URL is a different matter, and this header said "never prints either
// one" while printing it in two places from the file's first commit: the
// `POST <url>` line under `--dry-run`, and, since the fault codes landed, the
// `BOARD_URL_SCHEMELESS` line that names the unusable value on purpose. Both
// are deliberate and both are useful. What follows from them is that a URL
// carrying a credential in its userinfo would be echoed, so
// `tools/board/live-target.mjs` masks a `user:pass@` prefix before naming a
// value, and this paragraph says what is true instead of claiming more than
// the code does. The 2026-10-27 security audit, F37.
import { readFileSync } from 'node:fs';
import { violations } from './check.mjs';
import { liveTargetFault } from './live-target.mjs';
import { unreachable, verdict } from './post-verdict.mjs';
import { declarationOf, senderFault, senderOf } from './sender.mjs';
import { LOCUS, renderVerdict } from '../gates/verdict-shape.mjs';

// Every line this file prints as a verdict is built in ./post-verdict.mjs and
// printed here, so the sentence and the exit code come out of one function and
// cannot disagree. Extracted 2026-10-26 with every output string
// byte-identical; `docs/design/verdict-enumeration.md` §10 has the
// before-and-after diff for all ten branches, and that file's header says why
// this gate and not another one.
const say = (v) => {
  const out = v.stream === 'err' ? console.error : console.log;
  // `renderVerdict` with no finding lines, because the per-finding lines this
  // file prints are printed where they are collected. Both of its orderings
  // reduce to the verdict then its trailer here, and using it anyway is what
  // keeps this call site correct if a branch ever grows a trailer AND finding
  // lines at once.
  for (const line of renderVerdict(v)) out(line);
  process.exit(v.exitCode);
};

const argv = process.argv.slice(2);
const flag = (name, dflt = '') => {
  const i = argv.indexOf(name);
  return i === -1 ? dflt : (argv[i + 1] ?? '');
};
const has = (name) => argv.includes(name);

if (has('--help') || has('-h') || argv.length === 0) {
  console.log('usage: post.mjs --seat YOUR_SEAT --kind K --subject S (--body B | --body-file F) [--to-seat S] [--to-company C] [--company C] [--ref URL] [--surface S] [--data JSON] [--reasoning R] [--everyone] [--dry-run]');
  console.log('       --seat is required unless ASC_SEAT is set; there is no default sender.');
  process.exit(0);
}

const bodyFile = flag('--body-file');
const msg = {
  kind: flag('--kind'),
  subject: flag('--subject'),
  body: bodyFile ? readFileSync(bodyFile, 'utf8') : flag('--body'),
  toSeat: flag('--to-seat'),
  toCompany: flag('--to-company'),
  data: flag('--data') ? JSON.parse(flag('--data')) : null,
  surface: flag('--surface'),
  everyone: has('--everyone'),
};

const found = violations(msg);
if (found.length) {
  for (const v of found) {
    console.error(`${v.code}: ${v.line}`);
    console.error(`  repair: ${v.repair}`);
  }
  // Every one of these is repaired by the reader editing the invocation it
  // just typed: `check.mjs` has no violation whose repair lives anywhere else.
  say(verdict(found.map((v) => ({ ...v, locus: LOCUS.READER, scope: 'message' })), {}));
}

// `seat` and `company` are the sender. The store spells them that way in a
// POST and `from_seat`/`from_company` in the row it returns.
//
// Both were literal defaults until 2026-10-27 — `'engineer'` and `'Ursa'` —
// and the first of them put seven rows from four seats under one seat's name
// in four hours. `./sender.mjs` has the measurement, the three costs and why
// the repair is a refusal rather than a better literal. Resolved here, where
// the payload is assembled, so there is one place that decides this field.
const senderInputs = {
  seatFlag: flag('--seat'),
  companyFlag: flag('--company'),
  env: process.env,
  declaration: declarationOf(),
};
const senderUnnamed = senderFault(senderInputs);
if (senderUnnamed) {
  say(verdict([{ locus: LOCUS.READER, scope: 'sender', ...senderUnnamed }], {}));
}
const sender = senderOf(senderInputs);

const payload = {
  seat: sender.seat,
  company: sender.company,
  kind: msg.kind,
  subject: msg.subject,
  body: msg.body,
};
if (msg.toSeat) payload.to_seat = msg.toSeat;
if (msg.toCompany) payload.to_company = msg.toCompany;
if (msg.surface) payload.surface = msg.surface;
if (flag('--ref')) payload.ref = flag('--ref');
if (flag('--reasoning')) payload.reasoning = flag('--reasoning');
if (msg.data) payload.data = msg.data;

// The sender's own company is matched by the same exact-match table on the
// read side, so it gets the same check rather than a different one.
const senderBad = violations({ ...msg, toCompany: payload.company, toSeat: 'x', everyone: true })
  .filter((v) => v.code === 'COMPANY_SPELLING');
if (senderBad.length) {
  say(verdict([{
    locus: LOCUS.READER,
    scope: 'sender',
    code: 'SENDER_COMPANY_SPELLING',
    // `violations` phrases this about `to_company`, the recipient field, and
    // here it is the sender's own. Rewritten at the source of the finding so
    // the verdict function never edits prose it was handed.
    line: senderBad[0].line.replace('to_company', 'company'),
    repair: senderBad[0].repair,
  }], {}));
}

const url = `${(process.env.BOARD_API_URL || '').replace(/\/$/, '')}/api/messages`;

if (has('--dry-run')) {
  // The first defect `docs/design/verdict-enumeration.md` §10 found and
  // deferred: with no BOARD_API_URL this line read `POST /api/messages`, a
  // request line with no origin, which looks like a relative path rather than
  // like a variable the runtime did not set. The dry run still exits 0,
  // because the absent variable is a fact about the environment and not about
  // the message this run was asked to check.
  const origin = (process.env.BOARD_API_URL || '').trim();
  console.log(origin
    ? `POST ${url}`
    : 'POST /api/messages, with no origin: BOARD_API_URL is not set, so this is the path a live run would append to it.');
  console.log('Authorization: Bearer <BOARD_RUNTIME_TOKEN>');
  console.log(JSON.stringify(payload, null, 2));
  console.log('');
  say(verdict([], {
    dryRun: true,
    toCompany: payload.to_company,
    toSeat: payload.to_seat,
    fromCompany: payload.company,
    fromSeat: payload.seat,
  }));
}

const token = process.env.BOARD_RUNTIME_TOKEN;
// Which of the three ways this can be unpostable actually fired, and the
// repair that one takes. See tools/board/live-target.mjs for why this is not
// one sentence and why it is exit 2 rather than exit 1.
const fault = liveTargetFault({ apiUrl: process.env.BOARD_API_URL, token });
if (fault) say(unreachable(fault));

const res = await fetch(url, {
  method: 'POST',
  headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  body: JSON.stringify(payload),
});
const text = await res.text();
if (!res.ok) {
  say(verdict([{ locus: LOCUS.COMMITTED, scope: 'store', status: res.status, body: text }], {}));
}
// WHAT THE BOARD ANSWERS, read off a real 201 on 2026-10-27 rather than
// taken from a sibling seat's report of it:
//
//   id, ts, from_seat, from_company, to_seat, to_company, kind, surface,
//   subject, ref, expires_at, body_chars, body_delivered, body_truncated,
//   wake_limit
//
// This file read exactly one of those, `id`, and dropped the rest. Two of the
// dropped ones decide whether the message a seat just sent arrived whole:
// `wake_limit` was 1500 on that measurement and the note carrying it was 1382
// characters, so the margin a seat is working inside is one it was never
// shown. The skill seat reported four notes cut mid-sentence this week and
// each time the sender found out when the recipient answered half a note.
let answer = {};
try { answer = JSON.parse(text) || {}; } catch { /* the board returned prose; the status is what matters */ }
say(verdict([], {
  kind: payload.kind,
  toCompany: payload.to_company,
  toSeat: payload.to_seat,
  // The three bus keys the row carries, all of them, so the receipt a sender
  // reads covers the field that was wrong seven times without ever being
  // printed. Taken from the board's echo first and from the payload only when
  // the response did not parse: the board's statement of what it recorded is
  // worth more than this process's statement of what it asked for, and any
  // disagreement between them then shows up in the printed value instead of
  // being invisible.
  fromCompany: answer.from_company || payload.company,
  fromSeat: answer.from_seat || payload.seat,
  id: answer.id || '',
  // Named only when the board says it cut something, because a clause on
  // every receipt is a clause nobody reads. The numbers are the board's, not
  // this tool's arithmetic, which is why they are declared as quotations.
  truncated: answer.body_truncated === true,
  bodyChars: answer.body_chars,
  bodyDelivered: answer.body_delivered,
  wakeLimit: answer.wake_limit,
}));
