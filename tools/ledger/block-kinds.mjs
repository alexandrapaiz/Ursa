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
 * 2026-10-26: the engineer seat's hook run appended `- First step: no
 * adoption proposed. Neither tool fits, because ...` to a block headed
 * `Craft scan: tesh 0.3.2 and txm 8.2.0`, a first-step line whose own
 * content declines to propose any work. COMMITS_WORK fired on the label,
 * the block became an `idea`, it owed five fields and carried three, and
 * the gate went red on the default branch for a day.
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
 * message had made the obvious one.
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
  const announcesScan = SCAN_TITLE.test(title.trim());
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
 * The word after `- Status:`, or null when the block states no status.
 * @param {string} text the block's verbatim lines
 * @returns {string | null}
 */
export function statusOf(text) {
  return text.match(/^-\s+Status:\s*(\w+)/m)?.[1] ?? null;
}
