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
//   node tools/seat/duplicate-repair.mjs --audit         # exit 1 on DUPLICATED
//
// Exit 0 the table printed. Exit 1 under --audit with at least one DUPLICATED
// pair, or if the positive control fails. Exit 2 this clone cannot answer
// (shallow, or no refs beyond the trunk) — never 0 with an empty table, which
// is the whole defect this file was written against.
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
// this clone holds, and the reading has a shelf life: when #801 and #814 land
// or close and their branches are deleted, the only record of this instance
// leaves the object store. A duplication is evidence that destroys itself as
// a side effect of being resolved well.
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
  for (let i = 0; i < lines.length; i += 1) {
    if (!headRe.test(lines[i])) continue;
    let id;
    if (idRe) {
      const m = idRe.exec(lines[i]);
      // A heading that matches the heading pattern but not the identifier
      // pattern is not an entry of this register — it is a section of prose
      // at the same depth. Skipping it is why `identifier` is read at all.
      if (!m) continue;
      id = m[1] ?? m[0];
    } else {
      id = lines[i].replace(/\s+/g, ' ').trim();
    }
    if (spans.length) spans[spans.length - 1].end = i;        // previous ends here
    spans.push({ id, start: i + 1, end: lines.length });
  }
  return spans;
}

/** Which entry contains a 1-indexed line. */
export function entryAt(spans, line) {
  for (const s of spans) if (line >= s.start && line <= s.end) return s.id;
  return null;
}

/** Hunks of a -U0 diff as [{ preStart, preCount, postStart, postCount }]. */
export function parseHunks(diff) {
  const out = [];
  for (const line of diff.split('\n')) {
    const m = /^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/.exec(line);
    if (!m) continue;
    out.push({
      preStart: +m[1],
      preCount: m[2] === undefined ? 1 : +m[2],
      postStart: +m[3],
      postCount: m[4] === undefined ? 1 : +m[4],
    });
  }
  return out;
}

/** The pre-existing entries one commit edited in one register.
 *
 *  Both sides of each hunk are mapped, because a repair that deletes a stale
 *  line and a repair that rewrites one are the same event and only the
 *  post-image sees the second. An entry counts only if it is in the parent,
 *  so a pure append contributes nothing. */
export function editedEntries(sha, reg, { run = git } = {}) {
  let preText; let postText; let diff;
  try {
    preText = run(['show', `${sha}^1:${reg.path}`]);
  } catch { preText = null; }          // the register did not exist yet
  try {
    postText = run(['show', `${sha}:${reg.path}`]);
  } catch { postText = null; }         // the register was deleted
  if (preText === null || postText === null) return [];
  try {
    diff = run(['diff', '-U0', `${sha}^1`, sha, '--', reg.path]);
  } catch { return []; }

  const preSpans = entrySpans(preText, reg);
  const postSpans = entrySpans(postText, reg);
  const preIds = new Set(preSpans.map((s) => s.id));
  const touched = new Set();

  for (const h of parseHunks(diff)) {
    if (h.preCount > 0) {
      for (let l = h.preStart; l < h.preStart + h.preCount; l += 1) {
        const id = entryAt(preSpans, l);
        if (id !== null) touched.add(id);
      }
    }
    if (h.postCount > 0) {
      for (let l = h.postStart; l < h.postStart + h.postCount; l += 1) {
        const id = entryAt(postSpans, l);
        // Only an entry that already existed. This is the append filter.
        if (id !== null && preIds.has(id)) touched.add(id);
      }
    }
  }
  // An addition at a hunk whose pre-image is empty still lands inside some
  // pre-existing entry's span; the preIds guard above keeps it only when the
  // entry is old, which is the behaviour the measured instance needs: those
  // repairs added a field line to an entry written a week earlier.
  return [...touched].filter((id) => preIds.has(id));
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

/** Did any board message pass between two actors inside [lo, hi]? */
export function messageBetween(rows, actorA, actorB, lo, hi) {
  const seat = (s) => String(s || '').replace(/^ursa-/, '');
  const a = seat(actorA);
  const b = seat(actorB);
  for (const r of rows) {
    if (!r.ts || r.ts < lo || r.ts > hi) continue;
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
    const ordered = [...b.commits].sort((x, y) => (x.ts < y.ts ? -1 : 1));
    for (const c of ordered) {
      const home = reps.find((r) => r.actor === c.actor && !concurrent(r.sha, c.sha, { run }));
      if (!home) reps.push(c);
    }
    const actors = reps.sort((x, y) => (x.ts < y.ts ? -1 : 1));
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
          klass = msg ? 'COORDINATED' : 'DUPLICATED';
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
  pairs.sort((a, b) => (a.first.ts < b.first.ts ? 1 : -1));

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
async function boardRows(hours) {
  const { pageMessages, ratioFault } = await import('../board/page.mjs');
  const walk = await pageMessages({ hours });
  const c = walk.coverage;
  if (!c) throw new Error('pageMessages returned no coverage receipt; its shape has changed');
  const fault = ratioFault(c);
  return {
    rows: walk.rows || [],
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

  let board = { rows: null, complete: false, oldest: null, note: 'board not read (--no-board)' };
  if (!noBoard) {
    try { board = await boardRows(hours); } catch (e) { board = { rows: null, complete: false, oldest: null, note: `board read failed: ${e.message}` }; }
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
      board: { complete: board.complete, oldest: board.oldest, pages: board.pages ?? null, rows: board.rows ? board.rows.length : 0, note: board.note },
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
    console.log(`board: ${board.rows ? `${board.rows.length} rows over ${board.pages} page(s), ${board.complete ? 'complete' : 'INCOMPLETE'}, oldest ${board.oldest}` : board.note}`);
    if (board.note && board.rows) console.log(`  ${board.note}`);
    console.log(`events: ${Object.entries(g.event_counts).map(([k, v]) => `${k} ${v}`).join('  ')}`);
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

  // Keyed on events, not pairs: a gate whose threshold moves with how many
  // entries a collision happened to span is a gate on entry width.
  if (process.argv.includes('--audit') && g.event_counts.DUPLICATED > 0) process.exit(1);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((e) => { console.error(e.stack || String(e)); process.exit(2); });
}
