#!/usr/bin/env node
// Did two actors repair the same register entry without being able to see
// each other? One verdict per (register entry, actor pair), decided from the
// commit graph and refined by the board.
//
//   node tools/seat/duplicate-repair.mjs                 # the table
//   node tools/seat/duplicate-repair.mjs --hours 48      # window (default 168)
//   node tools/seat/duplicate-repair.mjs --json          # machine-readable
//   node tools/seat/duplicate-repair.mjs --control       # positive control only
//   node tools/seat/duplicate-repair.mjs --no-board      # graph half alone
//   node tools/seat/duplicate-repair.mjs --audit         # exit 1 DUPLICATED, 2 undecided
//
// Exit 0 the table printed and every concurrent pair was decided. Exit 1 under
// --audit with at least one DUPLICATED pair, or if the positive control fails.
// Exit 2 this run cannot answer — a shallow clone, no refs beyond the trunk,
// or a board half that was declined or never established, leaving concurrent
// pairs INDETERMINATE — never 0 with an empty table, which is the defect this
// file was written against, and never 0 with an UNDECIDED one, which is the
// defect it shipped with and is corrected below.
//
// THE GUARD I WROTE FOR MYSELF COVERED THE EMPTY TABLE AND NOT THE UNDECIDED
// ONE (2026-11-09, hundred-and-thirteenth window, measured three ways on this
// clone over --hours 48, one real DUPLICATED event spanning 12 entries).
//
//   board half            rows      coverage   verdict           --audit
//   live, complete        1014      set        DUPLICATED 1      1
//   --no-board            null      null       INDETERMINATE 1   0   <- false green
//   token unset, 401      []        null       DUPLICATED 1      1   <- right by luck
//
// Two separate faults, and the second is the worse one.
//
// The DECLINED read exited 0 under --audit while printing twelve
// INDETERMINATE rows. The table was not empty, so the one guard this file had
// did not look at it, and `DUPLICATED 0` sat in the verdict slot as a count
// computed over nothing. Ursa's frontend seat stated the rule this breaks on
// the board at 11:19Z the same day: the verdict slot carries the refusal and
// never a number computed over nothing, and for a report channel the refusal
// has to occupy the slot because silence cannot be told from a tool that never
// ran. An exit code is a value channel and 0 is in band.
//
// The FAILED read graded confidently from a premise it never had. With no
// token `pageMessages` answers a 401, `ratioFault` says COVERAGE_READ_FAILED
// and `the read reached no rows at all`, and `boardRows` passed that on as
// `rows: []` — an empty array, which is truthy, so `grade` skipped its `!rows`
// arm and ran the message test over zero rows. `no message passed between the
// actors` and `I could not look for one` are different facts and that read
// published the first. It happened to print the true verdict today only
// because the real event is a duplication, so the no-information answer and
// the right answer coincide. Flip one real pair to COORDINATED and the same
// run accuses two seats in writing. The receipt naming the fault was already
// in hand, on `board.note`, and nothing read it.
//
// So the board half now reports WHICH of four states it is in, and only
// `complete` and `partial` may decide a pair:
//
//   complete       the walk covered the window. Decide every pair.
//   partial        the walk reached rows and not the whole window. Decide the
//                  pairs inside `coverage.covers`, INDETERMINATE outside it.
//   unestablished  a read was attempted and reached no rows. Decide nothing.
//   declined       --no-board. Decide nothing.
//
// WHY THIS EXISTS. On 2026-11-09 Ursa's skill seat and Ursa's engineer seat
// repaired the same twelve `docs/ideas.md` entries sixteen minutes apart,
// neither able to see the other. The skill seat reported it and handed the
// coordination gap to this lane. The hundred-and-fourth window filed it as a
// proposal with no Effect line, named the smallest test — "duplicated repairs
// per week, counted the way the skill seat counted this one: two seats'
// commits touching the same register entry with no message between them" —
// and left the instrument for a later window. This is that instrument, and
// building it changed the metric in two ways that are the point of the file.
//
// FIRST: THE METRIC AS NAMED IS BLIND TO ITS OWN MOTIVATING INSTANCE.
// Measured on this clone at 2026-11-09T06:30Z:
//
//   520367c8  05:32:41Z  ursa-engineer  reachable from origin/main      YES
//   b943ef3f  05:16:37Z  ursa-skill     reachable from origin/main      NO
//
// The skill seat's half is on `refs/prs/801` and `refs/prs/814` and nowhere
// on the trunk, because the loser of a duplication race resolves it by
// taking the winner's side — in that seat's own words, "I took main's side
// wholesale rather than defend identical text." That resolution is CORRECT.
// So a gauge that reads `origin/main` sees one side of every duplication it
// is looking for and therefore reports zero. The surface has to be every ref
// this clone holds.
//
// AND THE SHELF LIFE THIS PARAGRAPH USED TO CLAIM DOES NOT EXIST (corrected
// 2026-11-09, hundred-and-eighth window, measured over every pull request this
// repository has ever had). It said: "when #801 and #814 land or close and
// their branches are deleted, the only record of this instance leaves the
// object store. A duplication is evidence that destroys itself as a side
// effect of being resolved well." Both halves of that premise then came true
// -- both merged, #801's branch is deleted -- and the conclusion is false.
// `refs/pull/801/head` resolves to the same sha it always did. Measured with
// the denominator first: 842 pull requests have ever been opened here and
// `git ls-remote origin 'refs/pull/*/head'` returns 842 refs, none missing.
// `refs/pull/1/head` resolves 52 days after `activation/wave-1` left `origin`.
// GitHub retires the branch and never the pull ref.
//
// So this gauge has NO closing window. It is retrospective over the whole
// history of the repository, which is strictly more than the clause claimed
// for it, and the clause was what hid that. The sentence was also published to
// Ursa's skill seat on the board at 06:45:01Z, and that seat acted on it,
// offering to spend a commit on a fixture to preserve evidence that cannot be
// lost; declined at 08:2xZ with this measurement. The error's shape is the one
// `runner-facts` 101 records: a verdict computed from an absence -- the branch
// is gone from `refs/heads/*` -- standing in for a claim about a different
// object nobody asked.
//
// SECOND: "NO MESSAGE BETWEEN THEM" IS THE WRONG PRIMARY TEST, AND THE GRAPH
// ALREADY HOLDS A BETTER ONE. Blind duplication needs the two commits to be
// CONCURRENT: neither reachable from the other, so neither actor's clone could
// have held the other's work at the moment it did its own. That is decidable
// from `merge-base --is-ancestor` alone, locally, with no board call and no
// window in which the store has to still hold the rows. Checked on the pair
// above: neither is an ancestor of the other.
//
// The absence of a message is then a REFINEMENT and not the test. Two seats
// that were concurrent and had exchanged mail in the interval chose to both
// work; two that were concurrent and had not could not have known. Both are
// worth separating and only the second is the defect. Keeping the message
// test as the primary would also have made the verdict expire with the
// board's retention, which is a property of the instrument and not of the
// event.
//
// FOUR CLASSES, because the third is the one that lets this tool say no:
//
//   DUPLICATED    concurrent commits by two actors over one PRE-EXISTING
//                 entry, no board message between the actors in the interval.
//   COORDINATED   the same, with a message between them in the interval. They
//                 knew. Not a defect, and the control that the no-message
//                 half is discriminating rather than always-true.
//   SEQUENTIAL    one commit is an ancestor of the other, so the later actor
//                 could see the earlier work. Not a duplication at all.
//   INDETERMINATE concurrent, but the board read could not cover the interval
//                 (pager incomplete, or the interval predates what the store
//                 holds). Reported, never folded into either verdict.
//
// AN APPEND IS NOT A DUPLICATION, which is why only pre-existing entries
// count. Every seat here appends to these files every run; two seats adding
// two different entries to one register tail is the ordinary state and the
// merge drivers exist for exactly it. The defect is two actors editing an
// entry that was already there. So an entry is in scope for a commit only if
// its identifier is present in that commit's FIRST PARENT.
//
// MERGES ARE EXCLUDED, and leaving them in was the first wrong version of
// this file. A merge's diff against one parent restates the whole of the
// other side, so every seat that merges the trunk gets charged with every
// other seat's repairs, and the engineer/skill pair came back as nine seats
// duplicating each other. The repair commits are the subject; the merge that
// resolves a duplication is not itself one.
//
// THE ENTRY GRAMMAR IS READ OFF THE FILE THAT DECLARES IT, never restated
// here: `tools/registers/registers.json` carries each register's `heading`
// and `identifier`. A bound restated is two implementations that agree only
// on the day they are written, which is HQ's centralizer's correction and it
// applies to this file as much as to the board hook. Note that the register
// the measured instance happened in, `docs/ideas.md`, is `enabled: false`
// there — that flag governs which MERGE DRIVER covers the file and says
// nothing about whether the file can be duplicated into, so this tool reads
// every declared register and not only the enabled ones.

import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

import { compareInstants, parseInstant, sortByInstant } from '../instant.mjs';

export const DEFAULT_HOURS = 168;
export const REGISTERS_FILE = 'tools/registers/registers.json';

// The owner merges; she does not repair. Her commits are the integration
// points and charging them would make every merge a duplication.
export const NON_SEAT_AUTHORS = new Set(['alexandrapaiz']);

function git(args, { cwd } = {}) {
  return execFileSync('git', args, {
    encoding: 'utf8',
    cwd,
    maxBuffer: 64 * 1024 * 1024,
    stdio: ['ignore', 'pipe', 'ignore'],
  });
}

/** The declared registers, with their own heading and identifier patterns. */
export function registers({ file = REGISTERS_FILE, read = readFileSync } = {}) {
  const parsed = JSON.parse(read(file, 'utf8'));
  return parsed.registers.map((r) => ({
    path: r.path,
    heading: r.heading || '^## ',
    identifier: r.identifier || null,
    enabled: !!r.enabled,
  }));
}

/** Entry spans for one file's text: [{ id, start, end }], 1-indexed, end
 *  inclusive. `id` is the identifier capture when the register declares one,
 *  and the heading's own normalised text when it does not — which is the
 *  whole key for the registers that deliberately have no short name. */
export function entrySpans(text, { heading, identifier }) {
  const headRe = new RegExp(heading);
  const idRe = identifier ? new RegExp(identifier) : null;
  const lines = text.split('\n');
  const spans = [];
  // AN ENTRY ENDS AT THE NEXT HEADING OF ITS OWN DEPTH OR SHALLOWER, not at
  // the next heading that MATCHES. The first version ended a span at the next
  // match and it cost the second false-positive class of the first live
  // reading. `docs/ideas.md` declares `^### ` as its entry grammar and the
  // file also carries `## Ledger entry — …` and `## Skill run …` blocks above
  // that depth, so a seat appending a `##` block was recorded as having
  // edited the last `###` entry, which had merely stopped being last.
  // Markdown's own nesting settles it: a `###` section cannot contain a `##`
  // one. Measured: `a45dfc2e` reported one entry it had not touched before
  // this, and none after.
  for (let i = 0; i < lines.length; i += 1) {
    const atx = /^(#{1,6}) /.exec(lines[i]);
    if (!atx) continue;
    const level = atx[1].length;
    // Close any open span this heading is not nested inside.
    const open = spans[spans.length - 1];
    if (open && open.end === lines.length && level <= open.level) open.end = i;
    if (!headRe.test(lines[i])) continue;
    let id;
    if (idRe) {
      const m = idRe.exec(lines[i]);
      // A heading at the entry depth that does not match the identifier is
      // not an entry of this register — it is prose at the same depth, and
      // the line above has already closed the previous entry at it. That is
      // deliberate: two seats editing a prose section are not repairing an
      // entry, so the right answer is "no entry" and not "the one above".
      if (!m) continue;
      id = m[1] ?? m[0];
    } else {
      id = lines[i].replace(/\s+/g, ' ').trim();
    }
    spans.push({ id, level, start: i + 1, end: lines.length });
  }
  return spans;
}

/** Which entry contains a 1-indexed line. */
export function entryAt(spans, line) {
  for (const s of spans) if (line >= s.start && line <= s.end) return s.id;
  return null;
}

/** The text of one entry, with trailing blank lines dropped.
 *
 *  The trim is load-bearing, not tidiness. An entry's span runs to the next
 *  heading, so the LAST entry in a file runs to end-of-file, and appending a
 *  new entry below it changes where its blank tail stops. Without the trim
 *  every append would report the previous entry as edited. */
export function entryText(lines, span) {
  return lines.slice(span.start - 1, span.end).join('\n').replace(/\s+$/, '');
}

/** The pre-existing entries one commit edited in one register.
 *
 *  BY COMPARING EACH ENTRY'S TEXT, not by mapping diff hunks onto entry
 *  spans, and the first version did the latter. The question is "which
 *  entries that already existed are different now", and content answers it
 *  directly while hunk positions only approximate it. The approximation has
 *  a false-positive class that dominated the first live reading:
 *
 *  An added block at the end of a register begins at a post-image line that
 *  may still fall inside the LAST pre-existing entry's span — one blank line
 *  before the new heading is enough. So every seat that appended its own
 *  ledger entry was reported as having edited whichever entry happened to be
 *  last. Measured on the first reading: `a45dfc2e` (skill), `d3a04302`
 *  (security) and `599b9f65` (market) were all credited with editing one
 *  security entry none of them had touched, which manufactured five
 *  DUPLICATED events out of three unrelated appends.
 *
 *  Content comparison cannot have that defect, needs no hunk arithmetic, and
 *  costs one git call fewer per (commit, register). An entry counts only if
 *  it is present in BOTH revisions, so an append contributes nothing and a
 *  deletion of a whole entry is not a repair of it. */
export function editedEntries(sha, reg, { run = git } = {}) {
  let preText; let postText;
  try {
    preText = run(['show', `${sha}^1:${reg.path}`]);
  } catch { return []; }               // the register did not exist yet
  try {
    postText = run(['show', `${sha}:${reg.path}`]);
  } catch { return []; }               // the register was deleted

  const preLines = preText.split('\n');
  const postLines = postText.split('\n');
  const pre = new Map();
  for (const s of entrySpans(preText, reg)) pre.set(s.id, entryText(preLines, s));
  const touched = [];
  for (const s of entrySpans(postText, reg)) {
    if (!pre.has(s.id)) continue;      // new entry: an append is not a repair
    if (pre.get(s.id) !== entryText(postLines, s)) touched.push(s.id);
  }
  return touched;
}

/** Every non-merge, seat-authored commit touching any register in the window,
 *  across every ref this clone holds, each carrying the registers IT touched.
 *
 *  The per-commit file list is read here, in the same walk, because without
 *  it the caller has to ask "did this commit change this register" once per
 *  (commit, register) pair and each ask costs three subprocesses over files
 *  of twenty thousand lines. Measured on a 24-hour window: 8 registers x 88
 *  commits was over 110 seconds and did not finish; the same window with the
 *  pairs narrowed to the ones that actually changed is a few seconds. A tool
 *  nobody can afford to run is a guard outside the path, which is the finding
 *  this seat shipped the night before this file. */
export function repairCommits({ hours = DEFAULT_HOURS, regs, run = git } = {}) {
  const since = new Date(Date.now() - hours * 3600 * 1000).toISOString();
  const paths = new Set(regs.map((r) => r.path));
  const log = run([
    'log', '--all', '--no-merges', `--since=${since}`,
    '--name-only', '--format=%x01%H%x09%cI%x09%an%x09%s', '--', ...regs.map((r) => r.path),
  ]);
  const out = [];
  let cur = null;
  for (const line of log.split('\n')) {
    if (line.startsWith('\u0001')) {
      const [sha, ts, author, ...rest] = line.slice(1).split('\t');
      cur = { sha, ts, actor: author, subject: rest.join('\t'), files: [] };
      // Dropped rather than skipped-after-the-fact, so a later `files` push
      // cannot land on the owner's merge-integration commit.
      if (NON_SEAT_AUTHORS.has(author)) { cur = null; continue; }
      out.push(cur);
      continue;
    }
    if (cur && paths.has(line.trim())) cur.files.push(line.trim());
  }
  return out;
}

/** Concurrency, from the graph alone. True when neither commit is reachable
 *  from the other, so neither actor's clone could have held the other's work. */
export function concurrent(a, b, { run = git } = {}) {
  const ancestor = (x, y) => {
    try { run(['merge-base', '--is-ancestor', x, y]); return true; } catch { return false; }
  };
  return !ancestor(a, b) && !ancestor(b, a);
}

/** `git patch-id --stable` for one commit, or null if it cannot be taken.
 *
 *  WHY THIS IS HERE, and it was found by reading the rows rather than by
 *  reasoning about them. The first live reading of this gauge put this seat
 *  at the top of its own table with nine same-actor pairs, and the sharpest
 *  of them was `a0c58822` and `328b7a42`: the same subject line, eight
 *  minutes apart, both `ursa-exo`, concurrent in the graph — and
 *  patch-IDENTICAL. That is not two decisions. It is ONE commit rebased onto
 *  a second branch, which is this seat's own documented practice: it splits
 *  its chain by merge authority into a register lane and a charter lane, so
 *  it lands the same change twice by construction (§0 of its charter says
 *  so). A cherry-pick is one decision however many branches carry it, and
 *  that is true across actors too — a seat taking a sibling's commit
 *  verbatim is coordination, not collision. So this test runs BEFORE
 *  concurrency and not after it. */
export function patchId(sha, { run = git } = {}) {
  try {
    const out = execFileSync('sh', ['-c', `git show ${sha} | git patch-id --stable`], {
      encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, stdio: ['ignore', 'pipe', 'ignore'],
    });
    const id = out.trim().split(/\s+/)[0];
    return id || null;
  } catch { return null; }
}

/**
 * Did any board message pass between two actors inside [lo, hi]?
 *
 * THE WINDOW TEST IS AN INSTANT COMPARISON AND IT USED TO BE A TEXT ONE, AND
 * `tools/instant-gate.mjs` COULD NOT SEE IT. That lint is name-shaped: it
 * fires on a relational operator between two timestamp-NAMED operands, and
 * `lo` and `hi` are named for their role in an interval rather than for what
 * they hold. So the three sorts it flagged in this file were the three it
 * could read, and this line — the only one of the four whose answer changes a
 * published verdict — was invisible to it.
 *
 * The operands are also the worst possible pair for a textual compare. `lo`
 * and `hi` are commit instants from `git log --format=%cI`, which carries the
 * COMMITTER'S ZONE OFFSET, and `r.ts` is a board instant, which is always
 * `Z`. Measured on `origin/main` on 2026-11-09: 447 of 3,396 commits carry a
 * non-UTC offset, and over this gauge's own default 168-hour window 23,253 of
 * 310,078 ordered commit pairs (7.5 per cent) come out backwards as text.
 *
 * What that costs here is one-directional and it is the expensive direction.
 * A message inside the window read as outside it makes `messageBetween`
 * return null, and null is what grades a pair `DUPLICATED` rather than
 * `COORDINATED` — so the textual test manufactures the finding this whole
 * file exists to count, and never suppresses one.
 *
 * AND THE REPAIR IS NOT `compareInstants` IN THE COMPARISON, WHICH WAS THE
 * FIRST VERSION OF THIS FUNCTION. `compareInstants` answers null for a value
 * it will not place, `null < 0` and `null > 0` are both false, so a row or a
 * bound nobody can place would have been admitted to the window silently —
 * and the line would have been CLEAN to the lint, because the lint's
 * clean-site exemption is keyed on the callee's name. `tools/instant.mjs`
 * writes that hazard out in its own `REFUSAL_AS_ORDER` comment: reaching for
 * a member of the repaired family is not the same as being repaired. So the
 * placement is decided once, up front, with `parseInstant`, and the window
 * test is arithmetic on numbers that are known to exist.
 *
 * An unplaceable BOUND is not a narrower window, it is no window, and
 * answering "no message passed" over one would grade the pair `DUPLICATED`
 * on an interval nobody can place. That is the manufacturing direction
 * again, so this function refuses instead, and `grade` maps the refusal to
 * `INDETERMINATE`. A classifier with no abstain value invents a class for
 * every input it cannot read.
 */
export const UNPLACEABLE_WINDOW = Symbol('unplaceable-window');

export function messageBetween(rows, actorA, actorB, lo, hi) {
  const loMs = parseInstant(lo);
  const hiMs = parseInstant(hi);
  if (loMs === null || hiMs === null) return UNPLACEABLE_WINDOW;
  const seat = (s) => String(s || '').replace(/^ursa-/, '');
  const a = seat(actorA);
  const b = seat(actorB);
  for (const r of rows) {
    const at = parseInstant(r.ts);
    if (at === null || at < loMs || at > hiMs) continue;
    const from = seat(r.from_seat);
    const to = seat(r.to_seat);
    if ((from === a && to === b) || (from === b && to === a)) return r;
  }
  return null;
}

/** Group commits into (register, entry) buckets and grade each actor pair. */
export function grade(commits, edits, { rows = null, coverage = null, run = git, patchOf = patchId } = {}) {
  // Memoised: a commit appears in as many buckets as it has entries, and the
  // measured instance has twelve, so an un-cached patch-id would pipe the
  // same diff through `patch-id` twelve times.
  const pidCache = new Map();
  const pid = (sha) => {
    if (!pidCache.has(sha)) pidCache.set(sha, patchOf(sha, { run }));
    return pidCache.get(sha);
  };
  // edits: Map sha -> [{ path, id }]
  const buckets = new Map();
  for (const c of commits) {
    for (const e of edits.get(c.sha) || []) {
      const key = `${e.path}\u0000${e.id}`;
      if (!buckets.has(key)) buckets.set(key, { path: e.path, id: e.id, commits: [] });
      buckets.get(key).commits.push(c);
    }
  }

  const pairs = [];
  for (const b of buckets.values()) {
    // One representative per actor per RUN, not per actor. Collapsing to one
    // commit per actor was the first version and the positive control refused
    // it: the proposal's sharpest instance is two WINDOWS OF ONE SEAT, and a
    // per-actor collapse deletes exactly that pair before it can be graded.
    // So an actor's commits collapse only when they are sequentially related
    // — one reachable from the other, hence the same run's chain — and two
    // concurrent commits by one actor stay two representatives.
    const reps = [];
    const ordered = sortByInstant(b.commits, (c) => c.ts);
    for (const c of ordered) {
      const home = reps.find((r) => r.actor === c.actor && !concurrent(r.sha, c.sha, { run }));
      if (!home) reps.push(c);
    }
    const actors = sortByInstant(reps, (r) => r.ts);
    for (let i = 0; i < actors.length; i += 1) {
      for (let j = i + 1; j < actors.length; j += 1) {
        const first = actors[i];
        const second = actors[j];
        let klass;
        let msg = null;
        // Patch identity first. One change on two branches is one decision,
        // and no amount of graph concurrency makes it two.
        const pidA = pid(first.sha);
        const pidB = pid(second.sha);
        const samePatch = pidA !== null && pidA === pidB;
        const conc = samePatch ? false : concurrent(first.sha, second.sha, { run });
        if (samePatch) {
          klass = 'SAME_CHANGE';
        } else if (!conc) {
          klass = 'SEQUENTIAL';
        } else if (!rows) {
          klass = 'INDETERMINATE';
        } else if (coverage && !coverage.covers(first.ts)) {
          klass = 'INDETERMINATE';
        } else {
          msg = messageBetween(rows, first.actor, second.actor, first.ts, second.ts);
          if (msg === UNPLACEABLE_WINDOW) {
            // The window's own bounds could not be placed, so this pair was
            // never graded. It is not a coordination and it is certainly not
            // a duplication.
            msg = null;
            klass = 'INDETERMINATE';
          } else {
            klass = msg ? 'COORDINATED' : 'DUPLICATED';
          }
        }
        pairs.push({
          path: b.path,
          entry: b.id,
          klass,
          same_actor: first.actor === second.actor,
          same_patch: samePatch,
          first: { sha: first.sha.slice(0, 8), ts: first.ts, actor: first.actor, subject: first.subject },
          second: { sha: second.sha.slice(0, 8), ts: second.ts, actor: second.actor, subject: second.subject },
          gap_seconds: Math.round((new Date(second.ts) - new Date(first.ts)) / 1000),
          message: msg ? { ts: msg.ts, subject: msg.subject } : null,
        });
      }
    }
  }
  // Descending by the earlier commit. `sortByInstant` is ascending and total,
  // and reversing it is not a descending sort: reversing a stable ascending
  // order reverses the ties too, so two pairs on the same second come out
  // backwards. Reversing the INPUT first cancels that, which is the idiom
  // `tools/seat/answered.mjs` already carries with the same reasoning.
  const byFirstDesc = sortByInstant(pairs.slice().reverse(), (p) => p.first.ts).reverse();
  pairs.length = 0;
  pairs.push(...byFirstDesc);

  const counts = { DUPLICATED: 0, COORDINATED: 0, SAME_CHANGE: 0, SEQUENTIAL: 0, INDETERMINATE: 0 };
  for (const p of pairs) counts[p.klass] += 1;

  // TWO UNITS, AND REPORTING ONLY THE FIRST IS HOW THIS GAUGE WOULD LIE.
  // The measured instance is ONE collision between two runs that happened to
  // span twelve entries, so it contributes twelve pairs. "38 duplicated
  // repairs in a day" and "4 collisions in a day" are the same reading and
  // only the second is a rate anybody can act on. An EVENT is a distinct
  // (earlier commit, later commit) pair; the entries it spans are its width.
  const events = new Map();
  for (const p of pairs) {
    const key = `${p.first.sha}\u0000${p.second.sha}`;
    if (!events.has(key)) {
      events.set(key, {
        klass: p.klass,
        same_actor: p.same_actor,
        first: p.first,
        second: p.second,
        gap_seconds: p.gap_seconds,
        registers: new Set(),
        entries: 0,
        message: p.message,
      });
    }
    const e = events.get(key);
    e.registers.add(p.path);
    e.entries += 1;
    // A commit pair spanning several entries can in principle be graded
    // differently per entry only through the message test, which is keyed on
    // the pair's own interval and therefore constant across its entries. If
    // that ever stops being true, the worse verdict is the event's.
    if (p.klass === 'DUPLICATED') e.klass = 'DUPLICATED';
  }
  const eventList = [...events.values()].map((e) => ({ ...e, registers: [...e.registers] }));
  const eventCounts = { DUPLICATED: 0, COORDINATED: 0, SAME_CHANGE: 0, SEQUENTIAL: 0, INDETERMINATE: 0 };
  for (const e of eventList) eventCounts[e.klass] += 1;

  return { pairs, counts, events: eventList, event_counts: eventCounts, entries: buckets.size };
}

// THE POSITIVE CONTROL. A gauge whose subject is "did two actors collide"
// reads a quiet week and a broken parser identically, so this runs before any
// row is printed. Four synthetic buckets, one per class, graded through the
// same `grade()` the real rows go through — with `concurrent` and the message
// rows injected, since the graph and the board are the two inputs being
// stubbed and not the thing under test.
export const CONTROL = {
  commits: [
    { sha: 'cc0duplicated1', ts: '2099-01-01T00:00:00Z', actor: 'ursa-a', subject: 'first half' },
    { sha: 'cc0duplicated2', ts: '2099-01-01T00:10:00Z', actor: 'ursa-b', subject: 'second half' },
    { sha: 'cc0coordinated1', ts: '2099-01-02T00:00:00Z', actor: 'ursa-c', subject: 'first half' },
    { sha: 'cc0coordinated2', ts: '2099-01-02T00:10:00Z', actor: 'ursa-d', subject: 'second half' },
    { sha: 'cc0sequential1', ts: '2099-01-03T00:00:00Z', actor: 'ursa-e', subject: 'first half' },
    { sha: 'cc0sequential2', ts: '2099-01-03T00:10:00Z', actor: 'ursa-f', subject: 'second half' },
    { sha: 'cc0sameseat1', ts: '2099-01-04T00:00:00Z', actor: 'ursa-g', subject: 'window one' },
    { sha: 'cc0sameseat2', ts: '2099-01-04T00:10:00Z', actor: 'ursa-g', subject: 'window two' },
    { sha: 'cc0samechange1', ts: '2099-01-05T00:00:00Z', actor: 'ursa-h', subject: 'the register lane' },
    { sha: 'cc0samechange2', ts: '2099-01-05T00:10:00Z', actor: 'ursa-h', subject: 'the charter lane' },
  ],
  edits: new Map([
    ['cc0duplicated1', [{ path: 'control.md', id: 'E-DUP' }]],
    ['cc0duplicated2', [{ path: 'control.md', id: 'E-DUP' }]],
    ['cc0coordinated1', [{ path: 'control.md', id: 'E-COORD' }]],
    ['cc0coordinated2', [{ path: 'control.md', id: 'E-COORD' }]],
    ['cc0sequential1', [{ path: 'control.md', id: 'E-SEQ' }]],
    ['cc0sequential2', [{ path: 'control.md', id: 'E-SEQ' }]],
    ['cc0sameseat1', [{ path: 'control.md', id: 'E-SAME' }]],
    ['cc0sameseat2', [{ path: 'control.md', id: 'E-SAME' }]],
    ['cc0samechange1', [{ path: 'control.md', id: 'E-PATCH' }]],
    ['cc0samechange2', [{ path: 'control.md', id: 'E-PATCH' }]],
  ]),
  rows: [{
    ts: '2099-01-02T00:05:00Z',
    from_seat: 'c',
    to_seat: 'd',
    subject: 'a control message that makes one pair COORDINATED',
  }],
  // The two patch-identical commits, and everything else distinct. Injected
  // rather than taken from git, so the control stays pure and the SAME_CHANGE
  // branch is exercised without a repository.
  patchOf: (sha) => (sha.startsWith('cc0samechange') ? 'IDENTICAL-PATCH' : `p-${sha}`),
  // `cc0sequential1` is an ancestor of `cc0sequential2` and nothing else is
  // an ancestor of anything, which is the one graph fact the control injects.
  run: (args) => {
    if (args[0] === 'merge-base' && args[1] === '--is-ancestor') {
      const [, , x, y] = args;
      if (x === 'cc0sequential1' && y === 'cc0sequential2') return '';
      throw new Error('not an ancestor');
    }
    throw new Error(`control: unexpected git call ${args.join(' ')}`);
  },
  want: {
    'control.md\u0000E-DUP': 'DUPLICATED',
    'control.md\u0000E-COORD': 'COORDINATED',
    'control.md\u0000E-SEQ': 'SEQUENTIAL',
    'control.md\u0000E-SAME': 'DUPLICATED',
    'control.md\u0000E-PATCH': 'SAME_CHANGE',
  },
};

/** Run the positive control. Returns { ok, checked, failures }. */
export function runControl() {
  const { pairs } = grade(CONTROL.commits, CONTROL.edits, {
    rows: CONTROL.rows,
    run: CONTROL.run,
    patchOf: CONTROL.patchOf,
  });
  const failures = [];
  for (const [key, want] of Object.entries(CONTROL.want)) {
    const [path, entry] = key.split('\u0000');
    const got = pairs.find((p) => p.path === path && p.entry === entry);
    if (!got) failures.push(`${entry}: no pair graded at all`);
    else if (got.klass !== want) failures.push(`${entry}: want ${want}, got ${got.klass}`);
  }
  // The same-actor pair must also be FLAGGED as same-actor, because the
  // proposal's sharpest instance is two windows of one seat and a tool that
  // graded it right while losing the distinction could not report it.
  const same = pairs.find((p) => p.entry === 'E-SAME');
  if (same && !same.same_actor) failures.push('E-SAME: same_actor not set');
  const cross = pairs.find((p) => p.entry === 'E-DUP');
  if (cross && cross.same_actor) failures.push('E-DUP: same_actor wrongly set');
  return {
    ok: failures.length === 0,
    checked: Object.keys(CONTROL.want).length + 2,
    failures,
  };
}

// The receipt is read off `coverage`, by its own field names, and the first
// version of this function got both of them wrong: it asked for
// `walk.incomplete` and `walk.oldest_ts`, which do not exist on the returned
// object, so `complete: !undefined` published TRUE for a walk it had not
// checked and `oldest: null` switched the anachronism guard off. One reading
// went out at `complete: true, oldest: None` before the field names were
// read. That is this charter's own clause on a default inside a status check
// being that check's own blind spot, committed by the tool written to
// measure a blind spot. Assert the receipt is there rather than defaulting.
/** The four states of the board half, and the two that may decide a pair.
 *
 *  `rows` is `null` for every state that may not, because that is the input
 *  `grade` already keys its INDETERMINATE arm on. Returning `[]` for a read
 *  that reached no rows is what let a 401 be graded as "no message passed":
 *  an empty array is truthy, so the arm never ran. See the ORDERING-adjacent
 *  note at the top of this file for the measurement.
 */
export const BOARD_STATES = ['complete', 'partial', 'unestablished', 'declined'];

/** @returns {boolean} may a pair be decided from a board half in this state? */
export function boardCanDecide(state) {
  return state === 'complete' || state === 'partial';
}

async function boardRows(hours) {
  const { pageMessages, ratioFault } = await import('../board/page.mjs');
  const walk = await pageMessages({ hours });
  const c = walk.coverage;
  if (!c) throw new Error('pageMessages returned no coverage receipt; its shape has changed');
  const fault = ratioFault(c);
  const rows = walk.rows || [];
  // `oldest_ts` is the field that says a window was established at all, and it
  // is the one `ratioFault` itself keys its "reached no rows" wording on.
  const established = Boolean(c.oldest_ts) && rows.length > 0;
  const state = c.complete === true ? 'complete' : established ? 'partial' : 'unestablished';
  return {
    state,
    rows: boardCanDecide(state) ? rows : null,
    row_count: rows.length,
    complete: c.complete === true,
    oldest: c.oldest_ts || null,
    pages: c.pages,
    note: fault ? `${fault.code}: ${fault.line}` : null,
  };
}

function arg(flag, fallback) {
  const i = process.argv.indexOf(flag);
  return i === -1 ? fallback : process.argv[i + 1];
}

/** The one place the exit code is decided, so that the printed verdict and the
 *  status a caller reads cannot disagree.
 *
 *  Keyed on EVENTS and not pairs: a gate whose threshold moves with how many
 *  entries a collision happened to span is a gate on entry width.
 *
 *  Precedence is 1 over 2. A found duplication is a repair somebody can make
 *  today, and it stays actionable even when other pairs are undecided; the
 *  undecided ones are a fact about this run's reach and not about the tree.
 *
 *  @param {{event_counts: Record<string,number>}} g the grading
 *  @param {{state: string, note: ?string}} board the board half
 *  @returns {{exit: 0|1|2, code: string, line: string}}
 */
export function auditVerdict(g, board) {
  const dup = g.event_counts.DUPLICATED;
  const ind = g.event_counts.INDETERMINATE;
  if (dup > 0) {
    return {
      exit: 1,
      code: 'DUPLICATED',
      line: `${dup} blind duplication event(s) in this window; a seat must repair`,
    };
  }
  if (ind > 0) {
    return {
      exit: 2,
      code: 'UNDECIDED',
      line: `cannot decide: ${ind} concurrent event(s) are INDETERMINATE because the board half is `
        + `${board.state}, so DUPLICATED 0 below is a floor and not a finding`
        + (board.note ? `. ${board.note}` : ''),
    };
  }
  // No third arm on `!boardCanDecide(board.state)` alone, and the reason is
  // worth as much as the fix. A missing board half only costs a verdict when a
  // pair was CONCURRENT, because the graph decides SEQUENTIAL and SAME_CHANGE
  // on its own with no board call at all. So `declined` with zero
  // INDETERMINATE events means the board was never needed, and refusing there
  // would be the opposite defect: a tool that says it could not look when it
  // did not have to. Over-refusal is as wrong as a false green, and it is the
  // failure mode a guard written in reaction to a false green reaches for
  // first. The CLEAN line therefore names the board state rather than hiding
  // it, so the reader can see which half carried the answer.
  return {
    exit: 0,
    code: 'CLEAN',
    line: `no blind duplication in this window, over a ${board.state} board half; `
      + `${g.event_counts.COORDINATED} coordinated, ${g.event_counts.SEQUENTIAL} sequential, `
      + `${g.event_counts.SAME_CHANGE} same-change`,
  };
}

async function main() {
  const json = process.argv.includes('--json');
  const hours = Number(arg('--hours', DEFAULT_HOURS));
  const noBoard = process.argv.includes('--no-board');

  const control = runControl();
  if (process.argv.includes('--control')) {
    console.log(`control: ${control.ok ? 'pass' : 'FAIL'} ${control.checked - control.failures.length} of ${control.checked}`);
    for (const f of control.failures) console.log(`  ${f}`);
    process.exit(control.ok ? 0 : 1);
  }
  if (!control.ok) {
    console.error('positive control FAILED; the table below would not be evidence:');
    for (const f of control.failures) console.error(`  ${f}`);
    process.exit(1);
  }

  // Exit 2 rather than an empty table: this clone has to be able to see more
  // than the trunk, since the trunk is where duplications are erased.
  let shallow = 'false';
  try { shallow = git(['rev-parse', '--is-shallow-repository']).trim(); } catch { /* keep */ }
  const refCount = git(['for-each-ref', '--format=.']).split('\n').filter(Boolean).length;
  if (shallow === 'true' || refCount < 2) {
    console.error(`this clone cannot answer: shallow=${shallow} refs=${refCount}. `
      + 'A duplication lives on the branch that lost the race, so a single-ref '
      + 'or truncated clone reads every week as quiet. See the charter\'s §0.');
    process.exit(2);
  }

  const regs = registers();
  const commits = repairCommits({ hours, regs });
  const byPath = new Map(regs.map((r) => [r.path, r]));
  const edits = new Map();
  for (const c of commits) {
    const list = [];
    for (const f of c.files) {
      const r = byPath.get(f);
      if (r) for (const id of editedEntries(c.sha, r)) list.push({ path: r.path, id });
    }
    if (list.length) edits.set(c.sha, list);
  }

  let board = { state: 'declined', rows: null, row_count: 0, complete: false, oldest: null, note: 'board not read (--no-board)' };
  if (!noBoard) {
    try {
      board = await boardRows(hours);
    } catch (e) {
      // A throw is `unestablished` and not `declined`. The two print the same
      // empty board half and mean opposite things about whether anybody asked.
      board = { state: 'unestablished', rows: null, row_count: 0, complete: false, oldest: null, note: `board read failed: ${e.message}` };
    }
  }
  const coverage = board.oldest ? { covers: (ts) => ts >= board.oldest } : null;
  const g = grade(commits, edits, { rows: board.rows, coverage });

  if (json) {
    console.log(JSON.stringify({
      window_hours: hours,
      refs: refCount,
      commits_scanned: commits.length,
      commits_touching_an_old_entry: edits.size,
      entries: g.entries,
      board: { state: board.state, can_decide: boardCanDecide(board.state), complete: board.complete, oldest: board.oldest, pages: board.pages ?? null, rows: board.row_count ?? (board.rows ? board.rows.length : 0), note: board.note },
      verdict: auditVerdict(g, board),
      event_counts: g.event_counts,
      counts: g.counts,
      events: g.events,
      pairs: g.pairs,
    }, null, 2));
  } else {
    // The denominator before the rows, which is §0's own rule about a
    // measurement over an enumerated class: an interim read must be visibly
    // incomplete rather than well-formed.
    console.log(`window ${hours}h  refs ${refCount}  registers ${regs.length}  `
      + `commits ${commits.length} (${edits.size} touched a pre-existing entry)  `
      + `entries ${g.entries}`);
    console.log(`board: ${board.state}${board.rows ? `, ${board.rows.length} rows over ${board.pages} page(s), oldest ${board.oldest}` : `, ${board.note}`}`);
    if (board.note && board.rows) console.log(`  ${board.note}`);
    // The verdict slot, and it carries the refusal rather than a count taken
    // over nothing. Ursa's frontend seat's rule for a report channel: silence
    // is indistinguishable from a tool that never ran, so the refusal has to
    // occupy the slot. The counts still print, below this line and not instead
    // of it, because a floor is worth reading once it is labelled as one.
    const v = auditVerdict(g, board);
    console.log(`VERDICT: ${v.line}`);
    console.log(`events: ${Object.entries(g.event_counts).map(([k, v2]) => `${k} ${v2}`).join('  ')}`);
    console.log(`pairs : ${Object.entries(g.counts).map(([k, v]) => `${k} ${v}`).join('  ')}`
      + '   (an event is one commit pair; pairs count the entries it spans)');
    for (const e of g.events) {
      if (e.klass === 'SEQUENTIAL' || e.klass === 'SAME_CHANGE') continue;
      console.log(`\n${e.klass}${e.same_actor ? ' (SAME ACTOR, two windows)' : ''}  ${e.entries} entr${e.entries === 1 ? 'y' : 'ies'} in ${e.registers.join(', ')}`);
      console.log(`  ${e.first.sha} ${e.first.ts} ${e.first.actor}  ${e.first.subject.slice(0, 72)}`);
      console.log(`  ${e.second.sha} ${e.second.ts} ${e.second.actor}  ${e.second.subject.slice(0, 72)}`);
      console.log(`  gap ${e.gap_seconds}s`);
      if (e.message) console.log(`  message  ${e.message.ts}  ${e.message.subject.slice(0, 80)}`);
    }
    if (!g.events.some((e) => e.klass !== 'SEQUENTIAL' && e.klass !== 'SAME_CHANGE')) {
      console.log('\nNo concurrent same-entry pair in this window. The control passed, '
        + 'so this is a reading and not a silence.');
    }
  }

  if (process.argv.includes('--audit')) process.exit(auditVerdict(g, board).exit);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((e) => { console.error(e.stack || String(e)); process.exit(2); });
}
