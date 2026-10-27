#!/usr/bin/env node
// Post a message to the company board, with every check run first.
//
//   node tools/board/post.mjs --kind note --to-seat pm --to-company Ursa \
//     --subject "..." --body-file msg.md [--ref URL] [--data JSON]
//   node tools/board/post.mjs ... --dry-run        # check and print, post nothing
//
// Exit 0 posted (or checked clean under --dry-run). Exit 1 refused locally,
// nothing sent, and the message itself is what to edit. Exit 2 this tool
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

const argv = process.argv.slice(2);
const flag = (name, dflt = '') => {
  const i = argv.indexOf(name);
  return i === -1 ? dflt : (argv[i + 1] ?? '');
};
const has = (name) => argv.includes(name);

if (has('--help') || has('-h') || argv.length === 0) {
  console.log('usage: post.mjs --kind K --subject S (--body B | --body-file F) [--to-seat S] [--to-company C] [--ref URL] [--surface S] [--data JSON] [--reasoning R] [--everyone] [--dry-run]');
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
  console.error(`${found.length} violation(s). Nothing was posted, so there is no row to live with.`);
  process.exit(1);
}

// `seat` and `company` are the sender. The store spells them that way in a
// POST and `from_seat`/`from_company` in the row it returns.
const payload = {
  seat: flag('--seat', process.env.ASC_SEAT || 'engineer'),
  company: flag('--company', 'Ursa'),
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
  console.error(`SENDER_COMPANY_SPELLING: ${senderBad[0].line.replace('to_company', 'company')}`);
  console.error(`  repair: ${senderBad[0].repair}`);
  process.exit(1);
}

const url = `${(process.env.BOARD_API_URL || '').replace(/\/$/, '')}/api/messages`;

if (has('--dry-run')) {
  console.log(`POST ${url}`);
  console.log('Authorization: Bearer <BOARD_RUNTIME_TOKEN>');
  console.log(JSON.stringify(payload, null, 2));
  console.log(`\nChecked clean. ${payload.to_company || '(all companies)'}/${payload.to_seat || '(everyone)'} would be woken.`);
  process.exit(0);
}

const token = process.env.BOARD_RUNTIME_TOKEN;
// Which of the three ways this can be unpostable actually fired, and the
// repair that one takes. See tools/board/live-target.mjs for why this is not
// one sentence and why it is exit 2 rather than exit 1.
const fault = liveTargetFault({ apiUrl: process.env.BOARD_API_URL, token });
if (fault) {
  console.error(`${fault.code}: ${fault.line}`);
  console.error(`  repair: ${fault.repair}`);
  console.error('  Nothing was sent, and nothing about the message itself is wrong.');
  process.exit(2);
}

const res = await fetch(url, {
  method: 'POST',
  headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  body: JSON.stringify(payload),
});
const text = await res.text();
if (!res.ok) {
  console.error(`The board refused it with ${res.status}: ${text}`);
  console.error('  This checker passed a message the store rejected, which means a rule here is');
  console.error('  out of date. Transcribe the failing rule from runtime/board/store.py into');
  console.error('  tools/board/check.mjs so the next seat is told locally instead of by the board.');
  process.exit(3);
}
let id = '';
try { id = JSON.parse(text).id || ''; } catch { /* the board returned prose; the status is what matters */ }
console.log(`Posted ${payload.kind} to ${payload.to_company || '(all companies)'}/${payload.to_seat || '(everyone)'}${id ? `, id ${id.slice(0, 8)}` : ''}.`);
