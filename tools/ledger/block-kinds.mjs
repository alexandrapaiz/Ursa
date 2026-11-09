// The grammar of `docs/ideas.md`, as a contract rather than as an identity.
//
// `ledger.mjs` already splits the file into blocks, because the merge driver
// needs to know what a block IS so two appends can be two additions. This
// module answers the different question the checker needs: given a block,
// which contract does it owe? The two questions have different answers, so
// they live in different files. `parseLedger` must stay byte-stable and
// dependency-free because a `git merge` runs it; nothing here runs inside a
// merge.
//
// Three contracts, and the standard names two of them:
//
//   `idea`  docs/standards/pm.md §4, "Every idea enters as", five required
//           lines: Trigger, What, First step, Cost, Status.
//   `scan`  prompts/engineer-agent.md, Observe step 4, the daily craft scan:
//           "extract one thing worth stealing in the product itself and one
//           thing alexandria does better". The charter orders the note
//           appended to this same file ("Append today's new ideas AND the
//           competitive-scan note to docs/ideas.md") and gives it no field
//           list, so §4's five lines are not its contract.
//   `other` preamble and the chair's top-level dated note bullets. No field
//           contract at all; `check.mjs` still runs its duplicate and
//           conflict-marker passes over them.
//
// WHY THIS FILE EXISTS, measured on docs/ideas.md at 2026-10-24 (244 blocks,
// 227 of them `### ` entries). `check.mjs` already carried an exemption for
// scan notes, and the exemption was keyed on `present.length > 0` -- a block
// carrying none of the five field NAMES was treated as a note. That is not a
// discriminator, it is a coincidence of vocabulary: a scan note is exempt
// exactly when it happens to avoid five English words. Eleven of the file's
// fourteen scan notes avoided all five and were exempt. The other three used
// `- Trigger:` or `- Cost:` or `- Status:` in their own prose and were
// therefore checked against a contract they were never given, producing nine
// of the twelve violations that had held `check.test.mjs` red for weeks. The
// unit test that covered the exemption passed throughout, because its fixture
// was a scan note written as bare prose with no `- ` fields, a shape none of
// the fourteen real notes has.
//
// The heading is the discriminator instead, because the heading is the thing
// both charters name. Measured over the same 227 entries: this matches 14 of
// 14 real scan notes and 0 other headings, and no other heading in the file
// contains the word "scan" at all.

/** The five lines docs/standards/pm.md §4 requires of an idea, in its order. */
export const IDEA_FIELDS = ['Trigger', 'What', 'First step', 'Cost', 'Status'];

/** The five status words pm.md §4 allows, in its order. */
export const STATUSES = ['proposed', 'accepted', 'rejected', 'built', 'urgent'];

/**
 * `### YYYY-MM-DD — Title` with an optional parenthesized seat tag after the
 * date. The tag is accepted because seats already write it (`### 2026-09-26
 * (market) — ...`) and it carries information the date does not.
 * Capture 1 is the tag with its parentheses or undefined; capture 2 is the
 * title, which is everything after the em dash.
 */
export const ENTRY_HEADING = /^###\s+(\d{4}-\d{2}-\d{2})(?:\s+(\([^)]+\)))?\s+—\s+(\S.*)$/;

/**
 * A title that announces a craft scan. Both spellings seats actually use
 * (`Craft scan:` and `Competitive scan:`), with an optional parenthetical
 * between the words and the colon, which one real heading has:
 * `Competitive scan (engineer's craft scan): LangSmith ...`.
 */
const SCAN_TITLE = /^(craft|competitive)\s+scan\b\s*(\([^)]*\))?\s*:/i;

/**
 * A SEAT TAG that announces a craft scan, which is the second place the
 * grammar lets a seat announce one and the place `announcesScan` used to not
 * look.
 *
 * `ENTRY_HEADING` accepts an optional parenthesized seat tag after the date
 * and captures it, and the engineer seat writes its scans as
 * `### 2026-11-02 (engineer, craft scan) — Letta Context Repositories: ...`,
 * putting the announcement in the tag rather than in the title. Measured on
 * `main` at 2026-11-02: that heading classified as an `idea`, owed all five
 * §4 fields, carried none of them, and `tools/ledger/check.mjs` was red on
 * the default branch over a block that owes no fields at all. One block in
 * docs/ideas.md matches this shape and it is that one.
 *
 * WHY THIS IS THE POSITION AND NOT THE VOCABULARY. This file's header warns
 * against keying a contract on which English words a block happens to use,
 * and a 2026-10-26 run was lost proposing exactly that repair to SCAN_TITLE,
 * which already matched the heading it was handed. This is the other half of
 * the same lesson rather than a repeat of the error: the vocabulary is
 * unchanged, the two spellings are SCAN_TITLE's own two, and what changes is
 * that the checker now reads the capture group it already takes.
 *
 * The strictness survives the move. `a heading that merely mentions
 * scanning is not a scan note` is the discrimination this rule has to keep,
 * so the tag is split on commas and an ELEMENT must be the whole phrase: the
 * tag `(engineer, redaction scan tooling)` announces nothing.
 */
const SCAN_TAG = /^(craft|competitive)\s+scan$/i;

/**
 * Does the heading announce a craft scan, in either of the two places the
 * grammar allows one?
 * @param {string} title capture 3 of ENTRY_HEADING
 * @param {string | undefined} seatTag capture 2, with its parentheses
 * @returns {boolean}
 */
function headingAnnouncesScan(title, seatTag) {
  if (SCAN_TITLE.test(title.trim())) return true;
  if (seatTag === undefined) return false;
  return seatTag
    .replace(/^\(/, '')
    .replace(/\)$/, '')
    .split(',')
    .some((element) => SCAN_TAG.test(element.trim()));
}

/**
 * A scan note that commits a day of work is an idea wearing a scan heading.
 *
 * `First step` is the field that does the committing: §4 defines it as "the
 * first day-sized unit of work", so a block carrying one has stopped
 * observing a competitor and started proposing that Ursa build something.
 * Keying the escape hatch on this one field rather than on a count of the
 * five is not a tuned threshold: measured on docs/ideas.md at 2026-10-24,
 * zero of the fourteen scan notes carry a `- First step:` line, while two
 * carry `- Cost:` and `- Status:` and one carries three of the five, so any
 * count-based rule would have had to pick a number and this does not.
 *
 * The practice is already in the file. The 2026-10-23 npm-and-PyPI scan note
 * says in writing why it has no First step: "This is close enough to the
 * first entry above to be its justification rather than a separate idea,
 * which is why it is not filed as one." The idea it refers to is a separate
 * `### ` entry with all five lines. That is the shape this rule enforces.
 *
 * THE RULE IS LITERAL, AND THAT IS THE DESIGN. The test is the presence of
 * the LABEL, never what the sentence after it says. Measured on `main` at
 * 2026-10-26, twice in one morning. The engineer seat's hook run appended
 * `- First step: no adoption proposed. Neither tool fits, because ...` to a
 * block headed `Craft scan: tesh 0.3.2 and txm 8.2.0`, a first-step line
 * whose own content declines to propose any work, and a later run of the
 * same seat wrote the same shape into its own note. Both times COMMITS_WORK
 * fired on the label, the block became an `idea`, it owed five fields and
 * carried three, and the gate was red on the default branch itself rather
 * than on anyone's branch.
 *
 * The alternative was considered and refused: read the sentence and exempt
 * the ones that decline. "No adoption proposed", "nothing to build here",
 * "not worth a day" and every phrasing nobody has written yet is an
 * open-ended English judgement, and this module's whole premise (see this
 * file's header) is that keying a contract on which English words a block
 * happens to use is a coincidence of vocabulary rather than a
 * discriminator. A label means what it says. A note that files no first
 * step writes that in prose, and `announcesScan` below is how the checker
 * explains that repair instead of leaving a seat to find it.
 *
 * What this cost, and why the explanation and not the rule changed. The
 * red gate was handed to a second seat, which read the failure, took the
 * only cause the message named, and reported that the heading used a
 * spelling the classifier does not recognise. SCAN_TITLE matches
 * `Craft scan:` and always did. One run was spent on a diagnosis the
 * message had made the obvious one, and the handoff then recommended the
 * repair that would have changed nothing. The test's own failure message
 * named the same single cause, which is why `block-kinds.test.mjs` now
 * lists all three and says to check this one first.
 */
const COMMITS_WORK = /^-\s+First step:/m;

/**
 * @typedef {{ kind: 'idea' | 'scan' | 'other',
 *             heading: string | null,
 *             date: string | null,
 *             seatTag: string | null,
 *             title: string | null,
 *             announcesScan: boolean,
 *             headingWellFormed: boolean }} Classification
 *   kind              which contract the block owes. See this file's header.
 *   heading           the block's first line when it starts with `### `,
 *                     else null. Verbatim, for use in violation messages.
 *   date              the `YYYY-MM-DD` the heading opens with, or null when
 *                     the heading does not parse.
 *   seatTag           the `(engineer)` style tag with its parentheses, or
 *                     null when absent or the heading does not parse.
 *   title             everything after the em dash, or null when the heading
 *                     does not parse.
 *   announcesScan     true when the title announces a craft scan, whatever
 *                     the block then owes. This is deliberately NOT the
 *                     same as `kind === 'scan'`: a block can announce a
 *                     scan and still be an `idea`, which is exactly what
 *                     COMMITS_WORK does to it, and that combination is the
 *                     one a seat cannot diagnose from a missing-field
 *                     message alone. `check.mjs` reads this field to say
 *                     so in the violation.
 *   headingWellFormed false for a `### ` block whose heading does not match
 *                     ENTRY_HEADING. Such a block is still classified, as an
 *                     `idea`, so that it is reported rather than exempted:
 *                     a malformed heading is the one case where guessing the
 *                     looser contract would hide the defect.
 */

/**
 * Which contract a parsed ledger block owes.
 *
 * @param {{ kind: 'preamble' | 'entry' | 'note', key: string, text: string }} block
 *   a block as `parseLedger` in ./ledger.mjs returns it
 * @returns {Classification}
 */
export function classifyBlock(block) {
  const none = {
    kind: 'other',
    heading: null,
    date: null,
    seatTag: null,
    title: null,
    announcesScan: false,
    headingWellFormed: true,
  };
  if (block.kind !== 'entry') return none;

  const heading = block.text.split('\n')[0];
  const m = heading.match(ENTRY_HEADING);
  if (m === null) {
    return { ...none, kind: 'idea', heading, headingWellFormed: false };
  }

  const [, date, seatTag, title] = m;
  const announcesScan = headingAnnouncesScan(title, seatTag);
  const isScan = announcesScan && !COMMITS_WORK.test(block.text);
  return {
    kind: isScan ? 'scan' : 'idea',
    heading,
    date,
    seatTag: seatTag ?? null,
    title,
    announcesScan,
    headingWellFormed: true,
  };
}

/**
 * The §4 field names a block carries, in §4's order.
 * @param {string} text the block's verbatim lines
 * @returns {string[]}
 */
export function presentIdeaFields(text) {
  return IDEA_FIELDS.filter((f) => new RegExp(`^-\\s+${f}:`, 'm').test(text));
}

/**
 * The first bullet in a block that opens with a §4 field's name and does not
 * carry that field's colon, or null when there is none.
 *
 * WHY A SEPARATE FUNCTION AND NOT A LOOSER `presentIdeaFields`. The colon is
 * load-bearing and stays required: `statusOf` reads the word after `- Status:`
 * and a groomer reads the paragraph after `- What:`, so a label that may run
 * into arbitrary prose before its separator has no extractable content. The
 * contract is right. What was wrong is the message.
 *
 * WHAT IT COST, measured 2026-11-09 by the engineer seat. On 2026-11-02 one
 * seat filed twelve entries carrying `- What, measured across the queue
 * rather than from this one case.`, `- What. Every one of the 109 closed and
 * unmerged rows...` and `- First step, in the lanes that write these comments
 * and so not this seat's to patch:`. Eighteen of those twenty-one fields were
 * present, findable by eye, and absent to the regex. The gate said they were
 * "missing the \"- What:\" line", which is true of the pattern and reads to a
 * human as "this entry has no What", so the repair a reader reaches for is to
 * write a second one. Nobody did, and the gate was red on `main` for seven
 * days. This is the same failure the `announcesScan` paragraph in `check.mjs`
 * was written after: both times the verdict was right and the sentence sent
 * the reader at the wrong file.
 *
 * @param {string} text the block's verbatim lines
 * @param {string} field one of IDEA_FIELDS
 * @returns {string | null} the offending line, trimmed, or null
 */
export function nearMissFieldLine(text, field) {
  const bullet = new RegExp(`^-\\s+\\*{0,2}${field}\\b`);
  const exact = new RegExp(`^-\\s+${field}:`);
  for (const line of text.split('\n')) {
    if (bullet.test(line) && !exact.test(line)) return line.trim();
  }
  return null;
}

/**
 * The word after `- Status:`, or null when the block states no status.
 * @param {string} text the block's verbatim lines
 * @returns {string | null}
 */
export function statusOf(text) {
  return text.match(/^-\s+Status:\s*(\w+)/m)?.[1] ?? null;
}
