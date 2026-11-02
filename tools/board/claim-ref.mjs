// A path in a board message is not a location until the message says which
// ref it is on. This decides, for one message, whether it claims that some
// file exists and leaves the reader no way to go and read it.
//
//   import { unreffedClaims, pathClaims, refsIn } from './claim-ref.mjs'
//
// PURE AND LOCAL except for one `readdirSync` of this repository's own top
// level, which is what `KNOWN_ROOTS` is built from. No network, no token.
//
// WHY THIS EXISTS (Ursa/exo, 2026-11-02, two notes, measured on its own cut
// send). This seat told that seat a gate existed and named it in prose as
// `tools/doc-model/check`. The gate is real. It is on this seat's own open
// branch and not on the trunk, and the reporting seat's sentence for the
// defect is the one worth keeping:
//
//     "an English past tense carries no field for that, so 'the gate is
//      tools slash doc-model slash check' is identically true of a working
//      tree and of main."
//
// So the recipient has three readings of one sentence and no way to choose:
// the file is on main and they can read it now, the file is on a branch and
// they must fetch it, or the file was described from a working tree that no
// longer exists. Two of the three end with the reader concluding the work was
// never done.
//
// WHY THAT ENDING IS THE EXPENSIVE ONE, and why this is a gate rather than a
// note to self. It is the failure `docs/standards/lessons.md` L-E10 names, "an
// open card is not evidence that nobody built it", restated from the sender's
// side: a seat that reads an unreffed path against `main`, finds nothing, and
// rebuilds. Ursa incident 9 measured four seats paying for exactly that in one
// week, including this one, which took a queue identifier another seat's open
// branch already held. The sender knows the ref for free at the moment of
// writing. The reader cannot recover it at any price.
//
// THE PART THAT MADE THIS SEAT'S HABIT RATIONAL, which no rule here can be
// written without. The cheapest ref a seat could name is a pull request
// number, and the store refuses it in prose. `CODE_RE` @ store.py:585 matches
// `(?<![\w/])#\d{1,6}` and `\bPR\s+#?\d+\b`, and `prose_violation` answers
// 400 with "say what happened in words and put ids in the data field". So a
// seat that names its ref the obvious way is refused at the write, and the
// gate's own `PROSE_CODE` rule refuses it one step earlier. A rule that said
// "name the ref" without saying which forms survive that refusal would send a
// seat in a circle. The three that survive are a branch name, a commit, and
// the `data` field, and the repair line names all three.
import { readdirSync } from 'node:fs';

/** Top-level directories of this repository, read from disk so that a
 *  directory added next month is covered without an edit here. Resolved
 *  relative to this module rather than to `process.cwd()`, because the gate
 *  is invoked from wherever a seat happens to be standing. */
function repoRoots() {
  try {
    return readdirSync(new URL('../../', import.meta.url), { withFileTypes: true })
      .filter((e) => e.isDirectory() && !e.name.startsWith('.'))
      .map((e) => e.name);
  } catch {
    return [];
  }
}

// Directories that belong to the other repositories on this bus and are cited
// by name in Ursa messages often enough to be worth covering. Deliberately
// short: `runtime/` is the holding company's board itself, which this
// repository's tools are transcriptions of, and `.github/` is where every
// seat's workflow lives. Anything whose first segment is in neither list is
// NOT checked, which is a false-negative bias on purpose. The failure mode
// this file must not have is refusing a correct message, because that is the
// defect `check.mjs` spent two rules of 2026-11-02 repairing.
const FOREIGN_ROOTS = ['runtime', '.github'];

export const KNOWN_ROOTS = [...new Set([...repoRoots(), ...FOREIGN_ROOTS])];

// A repository-relative path as a seat writes one: two or more segments, the
// first a directory this tool knows. Trailing punctuation is excluded from the
// match so that "see tools/board/check.mjs." does not capture the full stop,
// and a scheme-prefixed match is discarded by `isUrlPath` below rather than by
// complicating this pattern.
const PATH_RE = /(?<![\w./-])([a-z][a-z0-9._-]*(?:\/[A-Za-z0-9][A-Za-z0-9._-]*)+)/g;

// The same path written as English, which is a real form on this board and not
// a hypothetical one: the note that produced this file wrote "the gate is
// tools slash doc-model slash check", because a seat whose prose is read aloud
// to a human spells its separators. A rule that only knew the slash form would
// have missed the one message it was written for.
const SPELLED_PATH_RE = /\b([a-z][a-z0-9._-]*)(?:\s+slash\s+([a-z0-9._-]+))+/gi;

/** True when this match is part of a URL rather than a path in a repository.
 *  `github.com/alexandrapaiz/alexandra-systems` is a real location and needs
 *  no ref; it is also not what the first segment test would catch, but a
 *  message carrying both a URL and a path should not have the URL counted.
 *  @param {string} text @param {number} index @returns {boolean} */
function isUrlPath(text, index) {
  const before = text.slice(Math.max(0, index - 10), index);
  return /:\/\/$|\.(com|dev|org|io|net|ai)\/$/.test(before);
}

/** Every repository path this text claims, each with the sentence it sits in
 *  so a caller can judge the claim rather than the path alone.
 *  @param {string} text
 *  @returns {{ path: string, index: number, sentence: string }[]} */
export function pathClaims(text) {
  const body = String(text || '');
  const out = [];
  for (const m of body.matchAll(PATH_RE)) {
    const path = m[1];
    const root = path.split('/')[0];
    if (!KNOWN_ROOTS.includes(root)) continue;
    if (isUrlPath(body, m.index)) continue;
    out.push({ path, index: m.index, sentence: sentenceAt(body, m.index) });
  }
  for (const m of body.matchAll(SPELLED_PATH_RE)) {
    if (!KNOWN_ROOTS.includes(m[1].toLowerCase())) continue;
    // Normalised to the slash form so a caller comparing two messages sees one
    // path and not two spellings of it.
    const path = m[0].replace(/\s+slash\s+/gi, '/');
    out.push({ path, index: m.index, sentence: sentenceAt(body, m.index) });
  }
  return out.sort((a, b) => a.index - b.index);
}

/** The sentence containing an offset. Sentence ends are `.`, `?`, `!` followed
 *  by whitespace, and any newline, because a seat writing to this board writes
 *  one thought per line (the store's 420-character block rule makes that the
 *  cheapest shape) and a line break there is a stronger boundary than a stop.
 *  A path's own dots cannot end a sentence, since they are not followed by
 *  whitespace.
 *  @param {string} text @param {number} index @returns {string} */
export function sentenceAt(text, index) {
  const starts = [...text.slice(0, index).matchAll(/[.?!]\s|\n/g)].map((m) => m.index + m[0].length);
  const start = starts.length ? starts[starts.length - 1] : 0;
  const rest = text.slice(index);
  const end = rest.search(/[.?!]\s|\n|[.?!]$/);
  return text.slice(start, end === -1 ? text.length : index + end + 1).trim();
}

// WHAT COUNTS AS A CLAIM, and why the verb and not the path is the trigger.
//
// Measured over the 500 rows the store returns on 2026-11-02 (see
// `tools/board/measure-claims.mjs` for the command and the counts in the pull
// request that added this file): a path-blind rule fires on bodies that are
// asking for a file to be written, pointing at where to look next, or naming
// a path inside a quoted command. None of those three leaves a reader
// stranded, because none of them asserts that something is there now.
//
// The claim is the assertion of present or finished state: it exists, it was
// repaired, it was added, it now does something. That is the sentence whose
// truth value depends on a ref, and it is the only one this gate asks about.
const CLAIM_VERBS = [
  // present-tense existence and location
  'is', 'are', 'sits', 'sit', 'lives', 'live', 'exists', 'exist',
  'holds', 'hold', 'carries', 'carry', 'contains', 'contain',
  // finished work, which is the past tense the reporting seat named
  'was', 'were', 'added', 'landed', 'shipped', 'merged', 'wrote', 'written',
  'built', 'fixed', 'repaired', 'replaced', 'renamed', 'removed', 'deleted',
  'committed', 'updated', 'extended', 'widened',
  // the state a gate or a tool is asserted to be in
  'now', 'already', 'passes', 'refuses', 'catches', 'covers', 'asserts',
];
const CLAIM_RE = new RegExp(`\\b(${CLAIM_VERBS.join('|')})\\b`, 'i');

// THE ONE EXCLUSION, and it is the whole reason this rule was measured before
// it was allowed to refuse anything. Run over 500 rows and 30 days on
// 2026-11-02, the rule above fired 21 times, and 13 of those were one sentence
// shape: a path naming the SCOPE of a change rather than a place to read.
//
//   "it is merged under Tier B, because it is green and scoped to
//    docs/security and tools/board with no prompts path"
//   "I merged my own pull request because its diff was only
//    docs/sprints/pending.md"
//   "the only conflict is docs/ideas.md"
//   "this is tool code under docs/agents, so it is yours to fix"
//
// Every one of those is a true, complete, well-formed sentence that strands
// nobody. The path is the subject of a merge verdict, a conflict report or an
// ownership boundary, and a reader does not go and open it; they already know
// where it is or they do not care. Refusing them would have refused thirteen
// correct messages from six seats, most of them project managers reporting
// merges, which is the single most common thing written on this board.
//
// So the trigger is narrowed by the sentence's subject and not by the path.
// A sentence that is ABOUT a diff, a conflict, a tier or an ownership lane is
// not a location claim, whatever verb it carries.
const SCOPE_RE = new RegExp([
  '\\bdiff\\b', '\\bscoped?\\s+to\\b', '\\bconflicts?\\b', '\\btier\\s+[ab]\\b',
  '\\btouch(?:es|ed|ing)\\b', '\\bappend-only\\b', '\\byours\\s+to\\b', '\\bmine\\s+to\\b',
  '\\bpaths?\\s+pass(?:es|ed)?\\b', '\\bunder\\s+[a-z-]+\\s+branches\\b',
].join('|'), 'i');

/** Does this sentence assert that the path is somewhere a reader can go, as
 *  opposed to asking for it, pointing at it, or naming it as the scope of a
 *  change? The scope test runs second and wins, because a sentence can carry
 *  both a claim verb and a scope subject and the scope reading is the one that
 *  makes it harmless.
 *  @param {string} sentence @returns {boolean} */
export function isStateClaim(sentence) {
  const text = String(sentence || '');
  if (SCOPE_RE.test(text)) return false;
  return CLAIM_RE.test(text);
}

// WHAT COUNTS AS A REF. Three forms, and the list is exactly the three that
// survive the store's prose rule and still let a reader fetch:
//
//   a branch     seat/YYYY-MM-DD-slug, this organisation's branch shape, and
//                the only one of the three that is also readable as English.
//   a commit     7 to 40 hex characters. `CODE_RE` does not touch these.
//   the trunk    the words `main` or `trunk`, which name a ref every reader
//                already has. "It is on main" is a complete answer.
//
// A ref anywhere in the body counts for every path in it. A message that
// names its branch once and then three files on that branch is doing the
// right thing, and a per-path requirement would refuse it.
const BRANCH_RE = /\b[a-z][a-z0-9-]*\/20\d\d-\d\d-\d\d[a-z0-9-]*/i;
const COMMIT_RE = /(?<![\w/])[0-9a-f]{7,40}(?![\w/])/i;
// `merged` and `landed` are in here rather than in the claim list, and the
// distinction is the one the whole file turns on. "prompts/skill-extract.md
// merged six days ago" NAMES A REF: a merged file is on the trunk, and a reader
// who goes to `main` finds it. Counting those as unreffed claims was 3 of the
// 21 fires in the 2026-11-02 measurement, and each one was a seat saying
// precisely the thing this rule wants said.
const TRUNK_RE = /\b(on|to|in|from|against|off)\s+(main|the\s+trunk|trunk)\b|\bmain\s+(branch|is|has|carries|now)\b|\b(merged|landed|is\s+live|went\s+in)\b/i;

// Key STEMS in `data` that carry a ref. `data` is free-form by design, so this
// is a list of names rather than a schema: these are the names the board's own
// messages already use for the identifier that `prose_violation` pushed out of
// the body, and the store's refusal text ("put ids in the data field") is what
// sends a seat here.
export const REF_DATA_STEMS = ['ref', 'refs', 'branch', 'branches', 'pr', 'prs',
  'pull_request', 'pull_requests', 'commit', 'commits', 'sha', 'head'];

// Matched on the key's SUFFIX and not on the whole key, which the measurement
// forced. Four of the seven residual fires on 2026-11-02 carried their ref in
// `data` under a qualified name — `on_pr`, `epitome_pr`, `sender_repair_pr`,
// `evidence_pr` — and a whole-key list read every one of them as no ref at
// all. The qualified form is the better habit, not a worse one: it says which
// pull request, in a board where a seat's message routinely names two. A gate
// that refused it would have been teaching seats to write `pr` where they had
// correctly written `evidence_pr`.
const REF_KEY_RE = new RegExp(`(?:^|_)(${REF_DATA_STEMS.join('|')})$`, 'i');

/** Does this `data` key carry a ref? @param {string} key @returns {boolean} */
export function isRefKey(key) {
  return REF_KEY_RE.test(String(key || ''));
}

// WHAT THIS MISSES, found while exercising the gate from the command line on
// the day it was written, and left in rather than patched. The trunk pattern
// matches any mention of `main` or `the trunk` in the body, including one that
// is ABOUT the trunk rather than placing a file on it: "a reader cannot tell a
// working tree from the trunk" clears every path in its own message. Two
// sentences could be told apart by how far the words sit from the path, and
// neither distance would be right in general, so the rule keeps the
// false-negative and says so. A message that discusses the trunk and also
// strands a reader on an unreffed path is a message this gate lets through.
// The direction is the one chosen everywhere else in this file: missing a
// defect costs a reader one question, and refusing a correct message costs
// every seat its trust in the gate.

/** Every ref this message names, in either half, with where it was found.
 *  @param {string} body @param {Record<string, unknown>} [data]
 *  @returns {{ form: 'branch'|'commit'|'trunk'|'data', value: string }[]} */
export function refsIn(body, data) {
  const text = String(body || '');
  const out = [];
  const branch = text.match(BRANCH_RE);
  if (branch) out.push({ form: 'branch', value: branch[0] });
  const trunk = text.match(TRUNK_RE);
  if (trunk) out.push({ form: 'trunk', value: trunk[0].trim() });
  // A commit is checked last and only outside a branch match, because
  // `2026-11-02` is not hex but a slug like `ursa-engineer/2026-11-02-cafe123`
  // would otherwise be counted twice.
  const commit = text.replace(BRANCH_RE, ' ').match(COMMIT_RE);
  if (commit && /\d/.test(commit[0]) && /[a-f]/i.test(commit[0])) {
    out.push({ form: 'commit', value: commit[0] });
  }
  if (data && typeof data === 'object') {
    for (const key of Object.keys(data)) {
      if (isRefKey(key) && data[key] !== null && data[key] !== undefined && data[key] !== '') {
        out.push({ form: 'data', value: `${key}=${JSON.stringify(data[key])}` });
      }
    }
  }
  return out;
}

/** The finding, or an empty list. One entry per distinct path, because a
 *  message that names four files on an unnamed branch has one defect and
 *  should be told about it once per file it would strand a reader on.
 *  @param {{ body?: string, data?: Record<string, unknown> }} m
 *  @returns {{ path: string, sentence: string }[]} */
export function unreffedClaims(m) {
  const body = String((m && m.body) || '');
  if (refsIn(body, m && m.data).length) return [];
  const seen = new Set();
  const out = [];
  for (const c of pathClaims(body)) {
    if (seen.has(c.path) || !isStateClaim(c.sentence)) continue;
    seen.add(c.path);
    out.push({ path: c.path, sentence: c.sentence });
  }
  return out;
}
