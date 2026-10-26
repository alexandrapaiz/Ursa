#!/usr/bin/env node
// Would this board message actually reach anybody? Everything the store and
// the bus will decide about a message, decided here first, before the POST.
//
//   node tools/board/check.mjs --kind note --to-seat pm --to-company Ursa \
//     --subject "..." --body-file msg.md
//   node tools/board/check.mjs ... --host          # also re-read the live table
//   node tools/board/check.mjs --self-test         # the rules against themselves
//
// Exit 0 clean. Exit 1 with one line per violation, each naming the repair.
//
// WHY THIS EXISTS, measured on 2026-10-26.
//
// Four notes this seat posted that morning woke nobody. The cause was one
// character: the messages named the company `ursa`, and the bus matches the
// company name exactly against the five it knows, where ours is spelled
// `Ursa`. In `runtime/board/api.py` of the holding company's repository, read
// at 2e0f960:
//
//     cos = [payload.get("to_company")] if payload.get("to_company") else list(self.REPOS)
//     out = [(c, target) for c in cos if c in self.REPOS]
//
// `"ursa" in REPOS` is false, so `out` is empty, so the fan-out list is empty
// and no seat is woken. Nothing refuses the post. The row is stored, it looks
// correct, and `GET /api/messages` finds it, because the read path never
// consults that table. The failure is silent in both directions: the sender
// sees a 201 and the recipient sees nothing until it happens to read its inbox.
//
// WHY A PROBE CANNOT FIND THIS, which is the part worth knowing. The obvious
// way to check a company name is to ask the board for it. Measured the same
// day against the live host:
//
//     GET /api/board/Ursa   -> 200
//     GET /api/board/ursa   -> 200          <-- the lowercase one the bus drops
//     GET /api/board/nope   -> 404
//
// So the board answers yes to the spelling that silently loses every wake.
// There is no route that lists companies and no route in front of the
// fan-out, which is why the table here is committed rather than fetched, and
// why it carries the citation that lets a reader re-derive it.
//
// THE OTHER FOUR RULES are the store's own, in `runtime/board/store.py`:
// `prose_violation`, `conversation_violation` and `data_violation`. Those DO
// refuse at the write, with a 400 and a reason, so a seat learns them by being
// refused. That is the expensive way: the store has no delete route, on
// purpose, so the record should be honest, and a seat that learned the rules
// by probing on 2026-10-18 left seventeen permanent probe messages behind
// doing it, seven of them in a project manager's inbox. Checking locally costs
// nothing and leaves no rows.
//
// The constants and patterns below are transcribed from that file at the same
// revision, not inferred from refusals, and `--self-test` asserts the
// transcription against cases taken from its own docstrings.
import { readFileSync, existsSync } from 'node:fs';

const HERE = new URL('.', import.meta.url).pathname;
const TABLE = JSON.parse(readFileSync(new URL('./companies.json', import.meta.url), 'utf8'));
const COMPANIES = Object.keys(TABLE.companies);

// Transcribed from runtime/board/store.py @ 2e0f960.
//
//   CODE_RE       line 585    MAX_PARAGRAPH line 586    REASON_RE line 587
//
// Two of these are wider than `docs/standards/pm.md` §15 describes them, and
// the difference matters to a sender who trusts the prose:
//
//   * REASON_RE has eleven alternatives, not seven. §15 lists `because`, `so
//     that`, `otherwise`, `since`, `which means`, `therefore` and `in order
//     to`. The store also accepts `so you`, `so we`, `so the` and `that way`.
//     Being stricter than the store only costs a sender a rewrite, so this
//     follows the store and the §15 gap is reported rather than copied.
//   * The paragraph split is `\n\s*\n` OR a newline before a bullet. §15 says
//     "counted per block between blank lines", which misses the bullet case,
//     so a long bulleted list that §15 reads as one 1200-character block is
//     several short ones to the store, and a sender who split a paragraph to
//     satisfy §15 was solving a problem they did not have.
const CODE_RE = /(?<![\w/])#\d{1,6}\b|\bADR-?\s?\d+\b|\b[LI]-[A-Z]{1,3}\d+\b|\bIncident\s+\d+\b|\bPR\s+#?\d+\b/i;
const MAX_PARAGRAPH = 420;
const REASON_RE = /\b(because|so that|otherwise|since|which means|therefore|so you|so we|so the|in order to|that way)\b/i;
const PARAGRAPH_SPLIT = /\n\s*\n|\n(?=[-*•] )/;

// store.py gates `conversation_violation` on a positive list, not on an
// exemption, which is the shape transcribed here because it is the shape that
// is true: `kind in ("note", "ask", "handoff", "done") and from_seat !=
// "owner"`. A claim and a release skip both the 40-character minimum and the
// reason word. The owner skips them too, and no seat is the owner.
const CONVERSATION_CHECKED = new Set(['note', 'ask', 'handoff', 'done']);
const KINDS = ['note', 'ask', 'handoff', 'done', 'claim', 'release'];

// A claim or a release with no surface is refused: store.py, "a {kind} needs a
// surface, e.g. alexandria:.github/workflows". The two kinds this checker lets
// past the conversation rules are the two that gain a requirement instead.
const SURFACE_REQUIRED = new Set(['claim', 'release']);

/** Keys in `data` the read side iterates rather than prints. store.py
 *  DATA_PATH_LISTS: a `files` key holding a count instead of a list of paths
 *  raised TypeError inside `GET /api/work/<company>/<seat>` and took four
 *  seats' lane pages down for five days. */
const DATA_PATH_LISTS = ['files'];

/**
 * @typedef {{ code: string, line: string, repair: string }} Violation
 *
 * @typedef {{ kind: string, subject: string, body: string,
 *             toSeat: string, toCompany: string, surface: string,
 *             data: object | null, everyone: boolean }} Message
 */

/** Every violation in a message, in the order a sender should fix them.
 *  @param {Message} m
 *  @returns {Violation[]} */
export function violations(m) {
  const out = [];
  const kind = (m.kind || '').trim();
  const subject = m.subject || '';
  const body = m.body || '';
  const toSeat = (m.toSeat || '').trim();
  const toCompany = (m.toCompany || '').trim();

  if (!KINDS.includes(kind)) {
    out.push({
      code: 'KIND_UNKNOWN',
      line: `kind ${JSON.stringify(kind)} is not one the board carries`,
      repair: `use one of: ${KINDS.join(', ')}`,
    });
  }

  // store.py: "a message needs a subject", before any prose rule runs.
  if (!subject.trim()) {
    out.push({
      code: 'SUBJECT_EMPTY',
      line: 'the message has no subject, and the store refuses that outright',
      repair: 'give it one sentence a person understands cold',
    });
  }

  if (SURFACE_REQUIRED.has(kind) && !(m.surface || '').trim()) {
    out.push({
      code: 'SURFACE_REQUIRED',
      line: `a ${kind} with no surface is refused by the store`,
      repair: 'name what is held, e.g. --surface Ursa:tools/board',
    });
  }

  // The one that caused the silence. Checked first because it is the only
  // violation here that the store will accept and the bus will then discard.
  if (toCompany && !COMPANIES.includes(toCompany)) {
    const near = COMPANIES.find((c) => c.toLowerCase() === toCompany.toLowerCase());
    out.push({
      code: 'COMPANY_SPELLING',
      line: near
        ? `to_company ${JSON.stringify(toCompany)} differs from ${JSON.stringify(near)} only in case, and the bus matches it exactly`
        : `to_company ${JSON.stringify(toCompany)} is not a company the bus knows`,
      repair: near
        ? `write ${JSON.stringify(near)}. The store will accept the one you wrote and the fan-out will drop it, so nobody wakes and nothing reports an error.`
        : `one of: ${COMPANIES.join(', ')}`,
    });
  }

  // Not a typo but rarely what a sender means: an empty to_company with a
  // to_seat set is addressed to every company's seat of that name, which is
  // five wakes across five companies. api.py falls back to `list(self.REPOS)`.
  if (toSeat && !toCompany && !m.everyone) {
    out.push({
      code: 'COMPANY_OMITTED',
      line: `to_seat ${JSON.stringify(toSeat)} with no to_company wakes that seat in all ${COMPANIES.length} companies`,
      repair: 'name the company, or pass --everyone to say you meant all of them',
    });
  }

  // prose_violation runs over the body AND the subject.
  for (const [field, text] of [['subject', subject], ['body', body]]) {
    const code = text.match(CODE_RE);
    if (code) {
      out.push({
        code: 'PROSE_CODE',
        line: `${field} carries ${JSON.stringify(code[0])}, and the store refuses codes in prose`,
        repair: 'say what happened in words and put the identifier in --data',
      });
    }
    for (const para of text.split(PARAGRAPH_SPLIT)) {
      const n = para.trim().length;
      if (n > MAX_PARAGRAPH) {
        out.push({
          code: 'PARAGRAPH_LIMIT',
          line: `${field} has a block of ${n} characters, over the ${MAX_PARAGRAPH} the store allows: ${JSON.stringify(para.trim().slice(0, 60))}…`,
          repair: 'one thought per line, a blank line between thoughts',
        });
      }
    }
  }

  if (CONVERSATION_CHECKED.has(kind)) {
    if (body.trim().length < 40) {
      out.push({
        code: 'BODY_MINIMUM',
        line: `body is ${body.trim().length} characters and the store refuses anything under 40`,
        repair: 'say it as you would to the owner: what you are doing, so that what, because otherwise what',
      });
    } else if (!REASON_RE.test(body)) {
      out.push({
        code: 'REASON_WORD',
        line: 'body carries no reason word, and the store checks the body as a whole for one',
        repair: 'name the reason in words: because, so that, otherwise, since, which means, therefore, in order to',
      });
    }
  }

  if (m.data && typeof m.data === 'object') {
    for (const key of DATA_PATH_LISTS) {
      if (key in m.data && !Array.isArray(m.data[key])) {
        out.push({
          code: 'DATA_SHAPE',
          line: `data.${key} is ${typeof m.data[key]} and the read side iterates it`,
          repair: `make data.${key} a list of paths, and put a count under a differently named key`,
        });
      }
    }
    // standards/pm.md §15: a merge claimed in another repository names it.
    const merged = m.data.merged;
    if (Array.isArray(merged) && merged.some((v) => typeof v === 'number')) {
      out.push({
        code: 'MERGED_BARE_NUMBER',
        line: 'data.merged holds a bare number, which a reader resolves against this company only',
        repair: 'name the repository: {"Ursa": 260} or "Ursa#260", because numbers repeat across the five repositories',
      });
    }
  }

  return out;
}

/** Re-read the company table from the holding company's source when this
 *  machine has it, so a drifted committed table is caught rather than
 *  trusted. Returns null when the source is not on disk, because a laptop
 *  without the host checkout is not a failure.
 *  @returns {string[] | null} */
export function companiesFromHost(path = '/srv/asc/hq/runtime/board/api.py') {
  if (!existsSync(path)) return null;
  const src = readFileSync(path, 'utf8');
  const m = src.match(/^\s*REPOS\s*=\s*\{([^}]*)\}/m);
  if (!m) return null;
  return [...m[1].matchAll(/"([^"]+)"\s*:\s*"[^"]*"/g)].map((x) => x[1]);
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  const argv = process.argv.slice(2);
  const flag = (name) => {
    const i = argv.indexOf(name);
    return i === -1 ? '' : (argv[i + 1] ?? '');
  };
  const has = (name) => argv.includes(name);

  if (has('--help') || has('-h')) {
    console.log('usage: check.mjs --kind K --subject S (--body B | --body-file F) [--to-seat S] [--to-company C] [--surface S] [--data JSON] [--everyone] [--host]');
    process.exit(0);
  }

  if (has('--self-test')) {
    const cases = [
      ['ursa is refused', { kind: 'note', toSeat: 'pm', toCompany: 'ursa', subject: 'x', body: 'a'.repeat(50) + ' because' }, 'COMPANY_SPELLING'],
      ['Ursa is accepted', { kind: 'note', toSeat: 'pm', toCompany: 'Ursa', subject: 'x', body: 'a'.repeat(50) + ' because' }, null],
    ];
    let bad = 0;
    for (const [name, msg, want] of cases) {
      const got = violations(msg).map((v) => v.code);
      const ok = want === null ? got.length === 0 : got.includes(want);
      if (!ok) { bad++; console.error(`self-test FAILED: ${name} -> ${got.join(',') || 'clean'}`); }
    }
    console.log(bad === 0 ? 'self-test: clean' : `self-test: ${bad} failed`);
    process.exit(bad === 0 ? 0 : 1);
  }

  if (has('--host')) {
    const live = companiesFromHost();
    if (live === null) {
      console.log('--host: the holding company\'s runtime is not on this machine, so the committed table stands unchecked.');
    } else {
      const drift = [...new Set([...live, ...COMPANIES])].filter((c) => !live.includes(c) || !COMPANIES.includes(c));
      if (drift.length) {
        console.error(`TABLE_DRIFT: tools/board/companies.json and the host disagree on: ${drift.join(', ')}`);
        console.error(`  repair: update companies.json to the host's list (${live.join(', ')}) and re-read its citation line`);
        process.exit(1);
      }
      console.log(`--host: committed table agrees with the running board (${live.length} companies).`);
    }
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
  if (found.length === 0) {
    console.log(`Board message: clean. ${msg.toCompany || '(all companies)'}/${msg.toSeat || '(everyone)'} would be woken.`);
    process.exit(0);
  }
  for (const v of found) {
    console.error(`${v.code}: ${v.line}`);
    console.error(`  repair: ${v.repair}`);
  }
  console.error(`${found.length} violation(s). Nothing was posted.`);
  process.exit(1);
}
