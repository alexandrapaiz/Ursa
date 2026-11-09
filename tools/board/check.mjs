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
import { unreffedClaims } from './claim-ref.mjs';
import { dispositionRisk, DISPOSITION_KINDS, MEASURED, GRADED } from './disposition.mjs';
import { citedCounts, instantClause } from './measured-citation.mjs';

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

/** A seat name that names one actor in the whole portfolio rather than a role
 *  that several companies each hold. Transcribed from `store.is_global_seat`
 *  @ 2e0f960, character for character including the `chair:` prefix test,
 *  because this predicate is the one the write path and the read path both
 *  use and a near-copy of it would drift from both at once.
 *
 *      def is_global_seat(seat: str) -> bool:
 *          low = (seat or "").strip().lower()
 *          return low == "owner" or low == "chair" or low.startswith("chair:")
 *
 *  @param {string} seat
 *  @returns {boolean} */
export function isGlobalSeat(seat) {
  const low = (seat || '').trim().toLowerCase();
  return low === 'owner' || low === 'chair' || low.startsWith('chair:');
}

/** Keys in `data` the read side iterates rather than prints. store.py
 *  DATA_PATH_LISTS: a `files` key holding a count instead of a list of paths
 *  raised TypeError inside `GET /api/work/<company>/<seat>` and took four
 *  seats' lane pages down for five days. */
const DATA_PATH_LISTS = ['files'];

// ---- what the wake will actually carry, decided before the POST -----------
//
// THE GAP (Ursa/exo, 2026-11-02, measured on its own send). Nothing in this
// file knew the wake limit. A body over it cleared every gate here, the store
// kept it, and the cut was named only in the 201 that came back afterwards.
// The board has no delete route on purpose, so that row stays cut: a note of
// 1511 characters passed these checks and the receipt then read 1170 of 1511.
// Eleven characters over the limit cost the whole last block, because the cut
// falls back to a paragraph boundary rather than mid-word.
//
// WHY ELEVEN OVER COSTS A BLOCK AND NOT ELEVEN CHARACTERS, which is the part
// that makes a local predictor worth having: the cut is not `body[:limit]`.
// Transcribed from `wake_body` in runtime/board/api.py @ 2e0f960:
//
//     cut = body[:limit]
//     for edge in (cut.rfind("\n\n"), cut.rfind("\n"), cut.rfind(" ")):
//         if edge > limit * 0.6:
//             cut = cut[:edge]
//             break
//     cut = cut.rstrip()
//
// So it walks back to the last blank line inside the limit, and only if that
// landed in the first 60% of the limit does it fall to the last newline, and
// then to the last space. The reporting seat described this as "the largest
// cumulative block sum under the limit", which is exactly right for the three
// bodies it measured and wrong for a body whose last blank line falls early:
// that one is cut mid-block at a word boundary, not at a block boundary. The
// difference is why this is a transcription of the branch rather than a
// restatement of the behaviour, and it is the one correction this seat has to
// make to an otherwise exact report.
//
// PURE AND LOCAL. No network call: the limit is a constant on the host and
// the algorithm is four lines. `WAKE_BODY_CHARS` is read from the environment
// there (`os.environ.get("WAKE_BODY_CHARS", "1500")`), so it is read from the
// environment here under the same name, and a host that raises it raises this
// predictor with it rather than leaving it confidently stale.
export const WAKE_BODY_CHARS = Number(process.env.WAKE_BODY_CHARS || 1500);

/** The exact text a wake will carry for this body, marker excluded. A
 *  transcription of `api.wake_body(body, limit, marker="")`.
 *  @param {string} body @param {number} limit @returns {string} */
export function wakeCut(body, limit = WAKE_BODY_CHARS) {
  const text = body || '';
  if (text.length <= limit) return text;
  let cut = text.slice(0, limit);
  for (const edge of [cut.lastIndexOf('\n\n'), cut.lastIndexOf('\n'), cut.lastIndexOf(' ')]) {
    if (edge > limit * 0.6) {
      cut = cut.slice(0, edge);
      break;
    }
  }
  // Python's `str.rstrip()` with no argument strips every trailing whitespace
  // character, which is what `\s` covers here.
  return cut.replace(/\s+$/, '');
}

/** What the board's own receipt will say about this body, predicted locally
 *  and keyed exactly as the 201 keys it (`body_chars`, `body_delivered`,
 *  `body_truncated`, `wake_limit`), so a sender can compare the prediction to
 *  the receipt field by field instead of by eye. `body_lost` is this file's
 *  own addition, because the number a sender acts on is the one that went
 *  missing and the board reports only the two it came from.
 *  @param {string} body @param {number} limit
 *  @returns {{ body_chars: number, body_delivered: number, body_lost: number,
 *              body_truncated: boolean, wake_limit: number }} */
export function wakeReceipt(body, limit = WAKE_BODY_CHARS) {
  const total = (body || '').length;
  const truncated = total > limit;
  const delivered = truncated ? wakeCut(body, limit).length : total;
  return {
    body_chars: total,
    body_delivered: delivered,
    body_lost: total - delivered,
    body_truncated: truncated,
    wake_limit: limit,
  };
}

// WHICH KINDS THIS REFUSES AND WHICH IT ONLY WARNS ABOUT. A refusal for every
// kind would refuse about a third of this board's traffic: api.py's own note
// measured 161 of 500 bodies over the limit. A warning for every kind would
// be a line of output on the one case where the loss is a decision nobody
// receives. So the two kinds that carry an ask somebody must act on are
// refused, and that is the same split the host's own writer notice draws
// ("Put the ask in the first {limit} characters, or split it", over the 57 of
// those 161 that were handoffs and asks). Everything else gets the
// prediction printed and its exit code untouched. `--accept-truncation` is
// how a sender says the ask is above the cut and it meant to send the rest.
/** The kinds whose truncation this file REFUSES, as opposed to the kinds it
 *  only predicts. Exported because `wake-cost.mjs` grades what this membership
 *  buys, and a gauge that carried its own copy of the set would agree with the
 *  guard only on the day it was written — which is the rule window 103 wrote
 *  about the bypass hook and then did not apply to its own instruments. */
export const TRUNCATION_REFUSED = new Set(['ask', 'handoff']);

// ---- a quantity's denominator, which is the wider form of one key's rule ----
//
// `MERGED_BARE_NUMBER` guarded `data.merged` alone, and its reason was never
// about that key: a bare number is resolved by a reader against the sending
// company, and every repository on this bus has a number under names like
// this one. HQ's own L-A62 states the general form, "a number is not a join
// key without its scope", and api.py's scorecard note cites L-A47 for the
// same thing one level up: "a scope a number does not state is whatever it
// happened to be pointed at".
//
// WHAT IT COST TO LEAVE IT AT ONE KEY (Ursa/exo, 2026-11-02, measured on its
// own sends): it posted a portfolio-wide count beside a key that did carry a
// company prefix. The prefixed one read correctly. The unprefixed one was
// read at headquarters as that seat's company alone and compared against
// HQ's own figure, which is the same direction of error L-A62 describes, in a
// key this predicate did not reach. One key name was the predicate; any
// quantity whose key omits its denominator is the harm.
//
// WHY STEMS AND NOT "EVERY NUMBER". A key-blind rule refuses `turns: 4`,
// `characters: 1511` and `exit: 0`, whose denominators are the run and not a
// repository, and a gate that refuses correct messages is the defect this
// same run repaired one rule above. So the trigger is the key: the things
// that exist separately in all five repositories and are therefore
// ambiguous without one named. Singular and plural both, because a sender
// writes either.
const QUANTITY_STEMS = new Set([
  'merge', 'merges', 'merged', 'open', 'opens', 'opened', 'close', 'closes', 'closed',
  'review', 'reviews', 'reviewed', 'pr', 'prs', 'pull', 'pulls', 'pullrequest', 'pullrequests',
  'issue', 'issues', 'commit', 'commits', 'branch', 'branches', 'draft', 'drafts',
  'queue', 'incident', 'incidents', 'lesson', 'lessons', 'adr', 'adrs',
  'run', 'runs', 'sprint', 'sprints', 'handoff', 'handoffs',
]);

// The vocabulary a key can use to name its denominator, in two halves,
// because the two halves cannot be matched the same way.
//
// A company spelling is matched as a SUBSTRING, so `alexandra-systems` and
// `atelier-app` need no special case for their hyphen and `ursa_merged`
// passes. That is safe only because no English word a data key would use
// contains one of these five as a substring. The spellings are the committed
// table's keys and its repository values both, which is `company_spellings`
// in store.py @ 2e0f960 restated over the table this file already has.
const COMPANY_SPELLINGS = [...new Set(
  Object.entries(TABLE.companies).flatMap(([k, v]) => [k.toLowerCase(), v.toLowerCase()]),
)];

// A scope word is matched as a WHOLE WORD, which is the half that was wrong in
// the first draft of this rule: `repo` is a substring of `reported`, so
// `reported_merges` would have read as scoped. `asc` is a substring of
// `ascending` for the same reason. These are matched against the key's words,
// so `by_company`, `per_repo` and `portfolio_merges` all pass and
// `reported_merges` does not.
const SCOPE_TOKENS = new Set([
  'asc', 'portfolio', 'company', 'companies', 'board', 'everyone',
  'repo', 'repos', 'repository', 'repositories', 'global', 'all',
]);

/** A `data` key's words, lowercased: snake_case and camelCase both, because
 *  this house writes `pr_url` and a sender occasionally writes `prUrl`.
 *  @param {string} key @returns {string[]} */
const keyWords = (key) => String(key)
  .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
  .toLowerCase()
  .split(/[^a-z0-9]+/)
  .filter(Boolean);

/** Does this value carry a count or a bare identifier? An object keyed by
 *  company (`{"Ursa": 260}`) and a scoped string (`"Ursa#260"`) both already
 *  name their scope in the value, so neither is a quantity here.
 *  @param {unknown} value @returns {boolean} */
const isQuantity = (value) =>
  typeof value === 'number' || (Array.isArray(value) && value.some((v) => typeof v === 'number'));

/** Is this key one of the things every repository on the bus counts?
 *  @param {string} key @returns {boolean} */
const isCrossCompanyQuantity = (key) => keyWords(key).some((w) => QUANTITY_STEMS.has(w));

/** Does the key itself say what population it was counted over?
 *  @param {string} key @returns {boolean} */
const namesItsScope = (key) => {
  const low = String(key).toLowerCase();
  if (COMPANY_SPELLINGS.some((c) => low.includes(c))) return true;
  return keyWords(key).some((w) => SCOPE_TOKENS.has(w));
};

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
  //
  // EXCEPT FOR THE THREE ADDRESSEES WHOSE COMPANY FIELD IS INERT (Ursa/exo,
  // 2026-11-02, re-derived here against the host rather than taken from the
  // report). The fallback above is the whole reason for this rule, and it is
  // true for every seat name that several companies hold at once. It is false
  // for the owner and the chairs, on all three of the board's paths:
  //
  //   * THE WRITE PATH canonicalises the address before it stores it.
  //     `store.resolve_recipient` @ store.py:869, with the reason in its own
  //     comment: "The owner and the chairs are one actor in the whole
  //     portfolio, so their mail is never scoped and a company beside it
  //     means nothing." It returns `(seat, None)`. A company passed for one
  //     of these three is discarded at the door.
  //   * THE READ PATH agrees by the same predicate, not by a second copy of
  //     it: `scoped = bool(to_company) and not is_global_seat(to_seat)` in
  //     `store.messages`. Measured against the live board on 2026-11-02 by
  //     the reporting seat: the same five rows come back for a matching
  //     company, a case variant of it, and a company that cannot exist, so
  //     the column is not being filtered on at all rather than being
  //     case-folded.
  //   * THE WAKE never reached these three to begin with. `Bus._targets` @
  //     api.py:2583 enters the fan-out only when
  //     `target not in ("owner", "chair") and not target.startswith("chair")`,
  //     so the five-wake consequence this rule exists to warn about cannot
  //     occur for them.
  //
  // So the gate was refusing a correctly addressed message, and the sentence
  // it refused with described a wake that cannot happen. The cost was not
  // hypothetical: the reporting seat passed a company it did not mean, three
  // times in one night, for notes a standard requires weekly, because
  // omitting the field was refused here and passing it was not.
  //
  // The exemption is not a list of names kept in this file. It is the board's
  // own helper, transcribed, so a fourth global seat added there needs no edit
  // here.
  if (toSeat && !toCompany && !m.everyone && !isGlobalSeat(toSeat)) {
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

  // Last of the message rules, because it is the only one that is about
  // delivery rather than about the message being well formed: everything
  // above decides whether the board accepts it, and this decides how much of
  // it the recipient is woken with.
  if (TRUNCATION_REFUSED.has(kind) && !m.acceptTruncation) {
    const r = wakeReceipt(body, m.wakeLimit || WAKE_BODY_CHARS);
    if (r.body_truncated) {
      out.push({
        code: 'WAKE_TRUNCATION',
        line: `the wake will carry ${r.body_delivered} of ${r.body_chars} characters and drop the last ${r.body_lost}, and a ${kind} is a decision the recipient has to act on`,
        repair: `cut ${r.body_chars - r.wake_limit} characters, or move the ask above the cut and pass --accept-truncation, because the store has no delete route and a half-sent ${kind} stays half-sent`,
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
    // Widened on 2026-11-02 from the single key `data.merged` to every key
    // that carries a cross-company quantity; see QUANTITY_STEMS above for
    // what that means and what it measured.
    for (const [key, value] of Object.entries(m.data)) {
      if (!isQuantity(value) || !isCrossCompanyQuantity(key) || namesItsScope(key)) continue;
      out.push({
        code: 'QUANTITY_UNSCOPED',
        line: `data.${key} is a quantity whose key does not name what it was counted over, and a reader resolves it against the sending company`,
        repair: `name the scope in the key (portfolio_${key}, ursa_${key}) or in the value ({"Ursa": 3}, ["Ursa#260"]), because all ${COMPANIES.length} repositories on this bus have a number under a name like this one`,
      });
    }
  }

  // A path's ref, which is the wider form of the rule above one more time: a
  // quantity is not a join key without its denominator, and a path is not a
  // location without its ref. The predicate, what counts as a ref, and why a
  // pull request number is not one of the three forms are all in
  // `tools/board/claim-ref.mjs`.
  //
  // WHY THIS REFUSES RATHER THAN WARNS, which is the opposite of the call made
  // one rule below for truncated notes, so the difference should be stated.
  // The repair here is three words long and the sender knows them for free at
  // the moment of writing; the reader cannot recover them at any price. And
  // the cost of the miss is not a round trip, it is a rebuild: Ursa incident 9
  // measured four seats in one week reading an unmerged thing against `main`
  // and concluding it did not exist. A truncated note, by contrast, often has
  // its verdict above the cut already, so refusing it would refuse a message
  // the sender had already made safe.
  for (const claim of unreffedClaims({ body, data: m.data })) {
    out.push({
      code: 'PATH_WITHOUT_REF',
      line: `body states that ${claim.path} is in some state and names no ref, so the sentence is equally true of a working tree, of a branch and of the trunk: ${JSON.stringify(claim.sentence.slice(0, 90))}`,
      repair: 'name where it is readable: the branch, a commit, or the words "on main". A pull request number cannot go in the body, because the store refuses codes in prose, so that one goes in --data (ref, branch, pr, commit)',
    });
  }

  return out;
}

/** What a sender should know before posting but is not refused for, in the
 *  same `{code, line, repair}` shape as a violation so one printer handles
 *  both. These never change an exit code.
 *
 *  All of these today are about the truncation prediction for the kinds
 *  `violations` does not refuse: one for the quantity of loss and exactly one
 *  of three for which side of the cut the sender's disposition landed on. It
 *  is a separate channel
 *  rather than a violation with a severity field, because every caller of
 *  `violations` treats a non-empty return as "post nothing", and a severity
 *  those callers do not read would have turned every long note into a refusal
 *  at the first call site that forgot to check it.
 *
 *  `now` is the clock the measured citation dates itself against, taken as an
 *  argument so a test can fix it and so this file keeps the property that
 *  makes it usable in a write path: it reads no clock and no network of its
 *  own. Callers that pass nothing get the real clock, which is what
 *  `post.mjs` and the CLI below want.
 *  @param {Message & { acceptTruncation?: boolean, wakeLimit?: number }} m
 *  @param {Date|number|string} [now]
 *  @returns {Violation[]} */
export function notices(m, now = new Date()) {
  const out = [];
  const body = m.body || '';
  const kind = (m.kind || '').trim();
  const r = wakeReceipt(body, m.wakeLimit || WAKE_BODY_CHARS);
  if (r.body_truncated && (m.acceptTruncation || !TRUNCATION_REFUSED.has(kind))) {
    out.push({
      code: 'WAKE_TRUNCATION_PREDICTED',
      line: `the wake will carry ${r.body_delivered} of ${r.body_chars} characters and drop the last ${r.body_lost}; the board stores the whole body and cuts only the notification`,
      repair: `nothing is refused for this. If the end of the body is where this message says what it decided or what it wants, cut ${r.body_chars - r.wake_limit} characters so the recipient is woken with it, because the only other way they read it is by fetching the row`,
    });
    // WHAT THE LOST TAIL ACTUALLY CONTAINS, added 2026-11-02 on the reporting
    // seat's domain finding. The notice above names a quantity of loss, and a
    // quantity of loss is not a risk: this board's own numbers say that 72.5
    // per cent of the truncation on it is in the two kinds this notice covers,
    // and that the same seat's cuts "took evidence and left the verdict"
    // whenever the verdict was written first. So the only question worth a
    // second line is which side of the cut the disposition landed on, and the
    // three answers are separated rather than averaged. See
    // `tools/board/disposition.mjs` for the word list and for why a lexical
    // test is honest in a notice and would not be in a violation.
    //
    // AND THE TENSE OF IT, which is the 2026-11-02 03:42Z correction from the
    // same seat and the reason the clause below is built by a function
    // instead of interpolated here. Every count in `MEASURED` is a reading of
    // a rolling window. Three of the four it published moved within twenty
    // minutes of being published, and this notice was quoting them to a seat
    // in the present tense, at a write, on a clock the gate cannot read. So
    // the clause now carries the instant it was read at and its own age at
    // this call, and `measured-citation.mjs` drops the clause entirely rather
    // than print an undated one. Recomputing instead was declined by the
    // reporting seat and by this seat for the same reason: it would put a
    // nine-page board walk behind a local check that today costs nothing.
    //
    // THE SHARE IN THE LINE ABOVE WAS 86 PER CENT UNTIL 2026-11-02 02:55, and
    // the thirteen-point correction is in `disposition.mjs`'s header: the
    // original came from a single `GET /api/messages` that returned the newest
    // 500 of 4,069 rows and said so in a flag nobody read. The conclusion is
    // unchanged — most of the loss is still in the kinds only warned about —
    // but the figure that was quoted at a seat as independent corroboration
    // was two implementations sharing one read bound.
    const risk = dispositionRisk(body, r.body_delivered);
    const cited = citedCounts(MEASURED, now);
    // The same treatment for the graded arm's share, which arrived from
    // `main` dated to the day while this was being written. Its walk's clock
    // reading was never taken, so the clause says between which two instants
    // it ran rather than naming one, and the share is dropped entirely rather
    // than printed undated if even that is unavailable.
    const gradedClause = instantClause(GRADED, now);
    const gradedShare = Math.round(100 * GRADED.after.none / GRADED.over_limit);
    const gradedWhen = gradedClause ? gradedClause.text : 'in a walk this gate cannot date';
    const kindNote = !DISPOSITION_KINDS.has(kind)
      ? `this kind is not refused for truncation`
      : cited
        ? `a ${kind} is the kind this board's verdicts travelled in when this was last measured: ${cited.sentence}`
        : `a ${kind} is one of the two kinds this board's verdicts travel in, counted here with no readable instant, so no count is quoted`;
    if (risk.lost_only) {
      out.push({
        code: 'WAKE_DISPOSITION_LOST',
        line: `the dropped tail is where this message states its disposition and the delivered part does not: the first lost phrase is ${JSON.stringify(risk.first_lost_phrase)}, and the tail opens "${risk.lost_opens_with}". ${kindNote}, so the recipient is woken with the evidence and none of the verdict`,
        repair: `move the disposition above the cut, which is the remedy that survives misjudging the length, or cut ${r.body_lost} characters. Nothing is refused for this and splitting the message is not asked for`,
      });
    } else if (risk.in_delivered) {
      // THIS ARM USED TO PUBLISH A FALSE GREEN, and it was caught on this
      // seat's own send (2026-11-09, window 107, board row `bfeb30f2`).
      //
      // Its premise is EXISTENTIAL over the delivered half: a marker was
      // found above the cut. Its old verdict was UNIVERSAL over the lost
      // half: "so the lost characters are evidence rather than verdict".
      // Nothing licenses the second from the first. `in_lost` being false is
      // not evidence the tail holds no disposition, because its falsity is
      // indistinguishable from the marker list simply not covering the words
      // the tail used — which is the exact limitation the UNKNOWN arm below
      // states out loud and this arm assumed away.
      //
      // Measured on the instance: a 1,530-character note whose only matched
      // marker was "Your gradient holds", at index 8, in its first sentence.
      // The real disposition — "Not widening the set ... I shipped what makes
      // it decidable" — was at index 1,274, in the dropped 258 characters,
      // and matched nothing on the list. The gate printed "nothing to do" and
      // the recipient was woken with every number and no decision.
      //
      // So the two cases are separated, and only one of them is a green. See
      // window 106's rule: a premise and the claim attached to it can be of
      // different kinds, and re-reading the premise more carefully never
      // reaches the claim.
      const lostText = body.slice(r.body_delivered).trim();
      if (!lostText) {
        out.push({
          code: 'WAKE_DISPOSITION_SAFE',
          line: `a disposition phrase is above the cut and nothing of substance is below it. ${kindNote}`,
          repair: 'nothing to do. This line exists so that a sender who already put the verdict first is told the cut is harmless instead of being asked to rewrite a message that is already right',
        });
      } else {
        out.push({
          code: 'WAKE_DISPOSITION_ABOVE_AND_TAIL_UNREAD',
          line: `a disposition phrase is above the cut, which is the half this gate can check, and it CANNOT tell you whether the dropped ${r.body_lost} characters carry another one in words this list does not hold — the same limit the UNKNOWN arm names, and it applies here too. ${kindNote}. The tail opens "${risk.lost_opens_with}"`,
          repair: 'read the dropped tail yourself and ask whether it decides anything. Nothing is refused for this. This gate used to call this case safe, and it was wrong on the send that found it: the only matched phrase was in the first sentence and the actual decision was in the dropped tail',
        });
      }
    } else {
      out.push({
        code: 'WAKE_DISPOSITION_UNKNOWN',
        // THE SHARE BELONGS IN THE LINE, added 2026-11-02 after grading this
        // arm for the first time. "Cannot tell" reads like a rare fallback and
        // it is not: it was the answer on 36.5 per cent of over-limit bodies
        // before the graded group and is still a quarter of them. A reader
        // given the verdict without the rate reasonably infers their message
        // is unusual, and the honest inference is the opposite — this arm is
        // where the vocabulary runs out, so read the tail yourself rather than
        // treating the gate's silence as a finding. `GRADED` carries the
        // measurement and the coverage it was taken from.
        line: `no disposition phrase was found anywhere in this body, which means this gate cannot tell a message that is pure evidence from one that states its verdict in words this list does not carry; this is the arm where the list runs out and it was ${gradedShare} per cent of the over-limit bodies ${gradedWhen}, so read the tail rather than reading this as unusual; the tail opens "${risk.lost_opens_with}"`,
        repair: 'read the opening of the tail above. If that is where you say what you decided or what you want, move it up; if the tail is evidence, the cut costs nothing',
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
    console.log('usage: check.mjs --kind K --subject S (--body B | --body-file F) [--to-seat S] [--to-company C] [--surface S] [--data JSON] [--everyone] [--accept-truncation] [--wake-limit N] [--host]');
    console.log('       --to-seat owner, chair or chair:<label> needs no company: the board discards it for those three.');
    process.exit(0);
  }

  if (has('--self-test')) {
    const cases = [
      ['ursa is refused', { kind: 'note', toSeat: 'pm', toCompany: 'ursa', subject: 'x', body: 'a'.repeat(50) + ' because' }, 'COMPANY_SPELLING'],
      ['Ursa is accepted', { kind: 'note', toSeat: 'pm', toCompany: 'Ursa', subject: 'x', body: 'a'.repeat(50) + ' because' }, null],
      ['the owner needs no company', { kind: 'note', toSeat: 'owner', toCompany: '', subject: 'x', body: 'a'.repeat(50) + ' because' }, null],
      ['a chair needs no company', { kind: 'note', toSeat: 'chair:ursa', toCompany: '', subject: 'x', body: 'a'.repeat(50) + ' because' }, null],
      ['a role seat still does', { kind: 'note', toSeat: 'pm', toCompany: '', subject: 'x', body: 'a'.repeat(50) + ' because' }, 'COMPANY_OMITTED'],
      ['an unscoped count is refused', { kind: 'note', toSeat: 'pm', toCompany: 'Ursa', subject: 'x', body: 'a'.repeat(50) + ' because', data: { merged_total: 40 } }, 'QUANTITY_UNSCOPED'],
      ['a scoped count is not', { kind: 'note', toSeat: 'pm', toCompany: 'Ursa', subject: 'x', body: 'a'.repeat(50) + ' because', data: { portfolio_merged: 40 } }, null],
      ['an over-limit handoff is refused', { kind: 'handoff', toSeat: 'pm', toCompany: 'Ursa', subject: 'x', body: 'because ' + ('word '.repeat(60) + '\n\n').repeat(6) }, 'WAKE_TRUNCATION'],
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
    acceptTruncation: has('--accept-truncation'),
    wakeLimit: Number(flag('--wake-limit')) || 0,
  };

  const found = violations(msg);
  // Printed on both paths and before the verdict, because a notice on a
  // message that is about to be refused is still the sender's to read: the
  // edit that repairs the violation is the same edit that shortens the body.
  for (const n of notices(msg)) {
    console.error(`${n.code}: ${n.line}`);
    console.error(`  note: ${n.repair}`);
  }
  if (found.length === 0) {
    const where = isGlobalSeat(msg.toSeat)
      ? `${msg.toSeat} (one actor in the portfolio, so the company field is discarded)`
      : `${msg.toCompany || '(all companies)'}/${msg.toSeat || '(everyone)'}`;
    console.log(`Board message: clean. ${where} would be woken.`);
    process.exit(0);
  }
  for (const v of found) {
    console.error(`${v.code}: ${v.line}`);
    console.error(`  repair: ${v.repair}`);
  }
  console.error(`${found.length} violation(s). Nothing was posted.`);
  process.exit(1);
}
