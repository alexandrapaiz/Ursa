#!/usr/bin/env node
// repair-pending.mjs — is this string on the base actually unrepaired?
//
//     node tools/stack/repair-pending.mjs --text '<string>' [--base origin/main]
//                                         [--path docs/ideas.md]... [--json out.json]
//                                         [--refs refs/prs/511,refs/prs/513] [--quiet]
//
// Exit 0 when every hit on the base has a repair waiting somewhere, 1 when
// any hit is genuinely unrepaired, 3 when some head could not be measured and
// the answer is therefore unknown, 2 on usage. So it is usable as the gate in
// front of "report this as a dangling citation".
//
// Run the tests as `node --test tools/stack/*.test.mjs`. `node --test
// tools/stack/` resolves the directory as a module on Node 22 and reports one
// red test that is not this tool's.
//
// WHY THIS EXISTS, which is the part worth reading before trusting the class.
//
// On 2026-10-26 this seat swept `main` for a dead incident identifier it had
// itself renamed, found it twice in `docs/ideas.md` at lines 11485 and 11755,
// and published that as two dangling citations. The fact was right: `main`
// carries the dead name exactly twice, and the branch that fixes it carries it
// zero times anywhere. The seat that owned those two lines verified both halves
// before replying rather than accepting a correction that credited it, and then
// corrected the cause this seat had attributed: it was about to teach its sweep
// to skip DRAFT pull requests, and the repair had been readied eight minutes
// before the sweep ran.
//
//     the discriminator is OPEN-AND-UNMERGED, never DRAFT —
//     because the window between ready and merged is where every
//     repair in this queue actually sits, and it is the longer window.
//
// A check that skips drafts still reports a readied repair as a dangling
// citation, which is the same false positive with a narrower blind spot. So
// draft status is printed here as metadata and is never read as a class.
//
// THE SECOND BLIND SPOT, which is this seat's own measured finding and is why
// "zero occurrences on the head" is not sufficient evidence of a repair.
//
// This seat's branches are built by copying a lane onto a fresh root, so a head
// can read zero occurrences of a string for two completely different reasons:
// it removed the string, or its root predates the commit that added it. The
// second one is not a repair. Merging it does not remove the string from the
// base, and on 2026-10-26 four open branches in this repository would have
// REVERTED a register repair on a merge that exits zero, for exactly that
// reason. So every head is compared against its own merge-base with the base
// ref, not against the base ref, and the two cases get different names.
//
// The classes this prints, per (path, head) pair:
//
//   repaired      the string is at the fork point and gone from the head. A
//                 repair exists and is waiting on a merge. NOT a finding.
//   partial       fewer on the head than at the fork point, but not zero. READ
//                 IT: half a repair reads like a whole one in a count.
//   stale-root    zero on the head and zero at the fork point. The head never
//                 had the string. This is NOT a repair and merging it will not
//                 remove anything; it may revert what added it.
//   file-gone     the path does not exist on the head at all. NOT a repair for
//                 the same reason: a deletion is not an edit.
//   grew          more on the head than at the fork point. NOT a finding by
//                 itself: see the quotation note under the third blind spot.
//   unchanged     the head carries the string as the fork point did.
//   base-unknown  the merge-base of base and head could not be computed, so
//                 there is no comparand and no class. Evidence of nothing.
//
// And one verdict per (path, line), which is what the exit code is about:
//
//   pending        some open head is `repaired` or `partial` for this path. Say
//                  "repaired, unmerged, in #N" and not "dangling".
//   unrepaired     every head was measured and none repairs it. The finding.
//   indeterminate  no head repairs it and at least one head was never measured.
//                  Not a finding, not a clearance. Fix the clone and re-run.
//
// THE THIRD BLIND SPOT, which is Ursa's skill seat's measured correction of
// 2026-10-26 and is why `base-unknown` and `indeterminate` exist.
//
// The second blind spot above is answered by comparing each head against its
// own merge-base. That answer assumes the merge-base can be computed, and in
// the clone a seat is handed on the resident host it frequently cannot: the
// clone is shallow and single-branch, so `git merge-base` prints nothing and
// exits non-zero. The skill seat re-derived this tool's fifteen head readings
// before accepting them, got four that disagreed, and traced the disagreement
// to its own clone rather than to the finding. Two of the four were wrong in
// the CLASS and not only in the count.
//
// The first version of this file turned that missing input into a class
// anyway. `forkCount` arrived null, `headCount === 0` was true, and
// `forkCount > 0` evaluated false, so the head was named `stale-root` — which
// the list above documents as "merging it may revert what added it". That is a
// published claim about a branch, derived from no measurement. The test that
// was supposed to guard this asserted the same thing, deliberately, on the
// reasoning that calling it `repaired` would manufacture good news. The
// reasoning was right about the false positive and silent about the false
// negative, and both are the same error: a definite class from a missing input.
//
//     an unmeasurable comparand is not a measurement of zero —
//     it has its own class, and a finding may not rest on it.
//
// And the test could not see it, for a reason worth keeping: the real-queue
// test ran the tree twice and asserted the two runs AGREE. Two runs in one
// clone share the clone, so both were wrong together and identically and the
// assertion passed green. An equality-shaped assertion cannot detect a defect
// in the environment both sides share. The tests below therefore assert
// ABSOLUTE expected classes, and the real-queue test skips with its reason
// named when the clone is incomplete rather than passing.
//
// One further consequence, the skill seat's too. A positive delta is not an
// introduction. A register entry that performs a rename has to quote the name
// it retired, so this seat's own register lane reads as adding the dead string
// (+3 on one head, +2 on another) while being the thing that removes it. That
// is the quotation-against-citation distinction, arriving in the sign. `grew`
// is printed with its caveat and is never a finding on its own.
//
// Nothing here decides anything. A non-zero exit means a seat reads lines, and
// a zero exit means the queue already holds the fix and the sweep should name
// the pull request instead of the defect.
import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';

/** git, returning null on any non-zero exit rather than throwing. */
export function git(...args) {
  try {
    return execFileSync('git', args, { encoding: 'utf8', maxBuffer: 1 << 28 });
  } catch {
    return null;
  }
}

/** Occurrences of `text` in `ref:path`, or null when the path is not there. */
export function countAt(ref, path, text, read = (r, p) => git('show', `${r}:${p}`)) {
  const blob = read(ref, path);
  if (blob === null || blob === undefined) return null;
  return occurrences(blob, text);
}

/** Non-overlapping occurrences of a literal string. Never a regexp: the
 *  strings this tool is pointed at are identifiers full of `-` and `.`, and a
 *  pattern that compiles them is a pattern that can match something else. */
export function occurrences(haystack, needle) {
  if (!needle) return 0;
  let n = 0;
  let i = haystack.indexOf(needle);
  while (i !== -1) {
    n += 1;
    i = haystack.indexOf(needle, i + needle.length);
  }
  return n;
}

/**
 * Classify one (path, head) pair. `forkCount` is the count at the merge-base
 * of base and head, which is the only honest comparand: see the header.
 */
export function classify({ forkCount, headCount }) {
  // Decidable without the base: a merge of this head deletes the file, which
  // the header explains is not a repair however the fork point read.
  if (headCount === null) return 'file-gone';
  // NOT decidable. Every branch below compares two counts, and one of them
  // does not exist, so this is the one input for which the honest output is
  // an abstention. See THE THIRD BLIND SPOT in the header.
  if (forkCount === null) return 'base-unknown';
  if (headCount === 0) return forkCount > 0 ? 'repaired' : 'stale-root';
  if (headCount < forkCount) return 'partial';
  if (headCount > forkCount) return 'grew';
  return 'unchanged';
}

/** The classes that mean a merge would remove at least one occurrence. */
export const REPAIRING = new Set(['repaired', 'partial']);

/** The classes that mean this tool did not measure the head at all. A head in
 *  here is evidence of nothing, in either direction, and it is the reason the
 *  `indeterminate` verdict exists: `unrepaired` is a finding, and a finding
 *  may not rest on a head whose comparand was missing. */
export const UNDECIDED = new Set(['base-unknown']);

/**
 * The whole judgement, over a list of heads, with git factored out so the
 * tests can drive it on fixtures instead of on this repository's real queue.
 *
 * `heads` is [{ ref, number, isDraft, headRefName }]. `isDraft` is carried
 * through to the report and is deliberately not read by any branch here.
 */
export function assess({ base, paths, text, heads, read, mergeBase }) {
  const findings = [];
  for (const path of paths) {
    const baseCount = countAt(base, path, text, read);
    if (!baseCount) continue; // nothing on the base is nothing to repair
    const heads_ = [];
    for (const head of heads) {
      const mb = mergeBase(base, head.ref);
      const forkRaw = mb === null ? null : countAt(mb, path, text, read);
      // Two different things make a fork count missing, and only one of them
      // is a missing measurement. No merge-base means no comparand at all.
      // A merge-base that simply does not carry the path means the file was
      // created after the fork, which IS a measurement, and its value is
      // zero: nothing of this string was there to remove. Folding the second
      // into the first reported every pull request older than the file as
      // unmeasurable, which the real-queue test caught on 526 refs.
      const forkFileAbsent = mb !== null && forkRaw === null;
      const forkCount = mb === null ? null : forkRaw ?? 0;
      const headCount = countAt(head.ref, path, text, read);
      heads_.push({
        ...head,
        mergeBase: mb,
        forkCount,
        forkFileAbsent,
        headCount,
        // Null whenever either end is missing, because a delta computed
        // against a missing comparand is the defect this tool now abstains on
        // rather than a number. Never coerce it to 0.
        delta: forkCount === null || headCount === null ? null : headCount - forkCount,
        klass: classify({ forkCount, headCount }),
      });
    }
    const repairing = heads_.filter((h) => REPAIRING.has(h.klass));
    const undecided = heads_.filter((h) => UNDECIDED.has(h.klass));
    // `pending` still wins outright: a head measured as repairing settles the
    // question, and an unmeasured head cannot unsettle it. But `unrepaired` is
    // the finding this tool exists to gate, so it requires that every head was
    // actually read. Otherwise the verdict is that we cannot tell.
    const verdict = repairing.length
      ? 'pending'
      : undecided.length
        ? 'indeterminate'
        : 'unrepaired';
    findings.push({
      path,
      baseCount,
      verdict,
      repairedBy: repairing.map((h) => h.number ?? h.ref),
      undecidedBy: undecided.map((h) => h.number ?? h.ref),
      heads: heads_,
    });
  }
  return findings;
}

/** `gh pr list` for every open pull request, as heads this tool can read.
 *  A head whose `refs/prs/<n>` is not fetched is reported as unreadable
 *  rather than skipped, because a ref this clone cannot see reads exactly
 *  like a head that does not repair anything (runner-facts §10). */
export function openHeads(fetch = (args) => execFileSync('gh', args, { encoding: 'utf8' })) {
  const raw = fetch([
    'pr', 'list', '--state', 'open', '--limit', '200',
    '--json', 'number,headRefName,isDraft',
  ]);
  return JSON.parse(raw).map((pr) => {
    const ref = `refs/prs/${pr.number}`;
    return {
      number: pr.number,
      headRefName: pr.headRefName,
      isDraft: pr.isDraft,
      ref,
      readable: git('rev-parse', '--verify', '--quiet', ref) !== null,
    };
  });
}

/**
 * The state of the clone this tool is running in, because two of its classes
 * are properties of the clone rather than of the queue. Reported, not fixed:
 * the fix is `tools/ensure-full-clone.sh`, and a tool that silently repairs
 * its own environment hides the measurement from the next run.
 */
export function cloneState(g = git) {
  const shallow = (g('rev-parse', '--is-shallow-repository') ?? '').trim() === 'true';
  const fetch = (g('config', '--get-all', 'remote.origin.fetch') ?? '').trim().split('\n').filter(Boolean);
  const singleBranch = fetch.length > 0 && !fetch.some((f) => f.includes('refs/heads/*'));
  return { shallow, singleBranch, fetch };
}

function usage(msg) {
  process.stderr.write(`${msg}\n\nusage: node tools/stack/repair-pending.mjs --text <string> [--base REF] [--path P]... [--refs R,R] [--json FILE] [--quiet]\n`);
  process.exit(2);
}

function main(argv) {
  const opts = { base: 'origin/main', paths: [], text: null, json: null, quiet: false, refs: null };
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === '--base') opts.base = argv[++i];
    else if (a === '--path') opts.paths.push(argv[++i]);
    else if (a === '--text') opts.text = argv[++i];
    else if (a === '--json') opts.json = argv[++i];
    else if (a === '--refs') opts.refs = argv[++i];
    else if (a === '--quiet') opts.quiet = true;
    else usage(`unknown argument: ${a}`);
  }
  if (!opts.text) usage('--text is required');

  // No --path means every tracked file on the base that holds the string, so
  // the common case needs no guess about where the citation lives.
  if (!opts.paths.length) {
    const hits = git('grep', '-l', '-F', opts.text, opts.base, '--', '.') ?? '';
    opts.paths = hits.split('\n').filter(Boolean).map((l) => l.slice(l.indexOf(':') + 1));
  }
  if (!opts.paths.length) {
    if (!opts.quiet) process.stdout.write(`the string is not on ${opts.base} at all; nothing to repair\n`);
    return 0;
  }

  const heads = opts.refs
    ? opts.refs.split(',').filter(Boolean).map((ref) => ({ ref, number: ref, isDraft: null, readable: true }))
    : openHeads();
  const unreadable = heads.filter((h) => h.readable === false);
  const readable = heads.filter((h) => h.readable !== false);

  const findings = assess({
    base: opts.base,
    paths: opts.paths,
    text: opts.text,
    heads: readable,
    read: (r, p) => git('show', `${r}:${p}`),
    mergeBase: (a, b) => (git('merge-base', a, b) ?? '').trim() || null,
  });

  const clone = cloneState();
  const report = {
    base: opts.base,
    text: opts.text,
    clone,
    unreadableHeads: unreadable.map((h) => h.ref),
    findings,
  };
  if (opts.json) writeFileSync(opts.json, `${JSON.stringify(report, null, 2)}\n`);

  if (!opts.quiet) {
    if (clone.shallow || clone.singleBranch) {
      // Loud, because this is the one condition under which a green run and a
      // blind run look identical from the outside.
      process.stdout.write(`WARNING this clone is ${clone.shallow ? 'shallow' : ''}${clone.shallow && clone.singleBranch ? ' and ' : ''}${clone.singleBranch ? 'single-branch' : ''}, so merge-base may be empty for heads this tool can otherwise read\n`);
      process.stdout.write("  every 'base-unknown' below is a property of this clone, not of that head\n");
      process.stdout.write('  run tools/ensure-full-clone.sh first, then re-run this\n\n');
    }
    if (unreadable.length) {
      process.stdout.write(`WARNING ${unreadable.length} open head(s) are not fetched in this clone and were not read: ${unreadable.map((h) => h.ref).join(' ')}\n`);
      process.stdout.write("  run the bootstrap refspec line first, or these read as 'no repair anywhere'\n\n");
    }
    for (const f of findings) {
      const lines = (git('grep', '-n', '-F', opts.text, opts.base, '--', f.path) ?? '')
        .split('\n').filter(Boolean)
        .map((l) => l.split(':')[2]);
      process.stdout.write(`${f.verdict.toUpperCase()} ${f.path} — ${f.baseCount} occurrence(s) on ${opts.base}, line(s) ${lines.join(', ')}\n`);
      for (const h of f.heads) {
        if (h.klass === 'unchanged') continue;
        const draft = h.isDraft === null ? '' : h.isDraft ? ' [draft, not a discriminator]' : ' [ready]';
        const delta = h.delta === null ? '' : ` (${h.delta > 0 ? '+' : ''}${h.delta})`;
        process.stdout.write(`  ${h.klass.padEnd(12)} ${h.number}${draft} — fork ${h.forkCount ?? 'unknown'} → head ${h.headCount ?? 'file gone'}${delta}\n`);
        if (h.klass === 'grew') {
          // The skill seat's correction of 2026-10-26: a register entry that
          // performs a rename has to quote the name it retired, so a positive
          // delta on a register lane is a quotation and not a citation. Read
          // the lines; do not read the sign.
          process.stdout.write('                 a positive delta on a register lane is usually a quotation, not a new citation — read the lines\n');
        }
      }
      if (f.verdict === 'pending') {
        process.stdout.write(`  → report as repaired-and-unmerged in ${f.repairedBy.join(', ')}, not as dangling\n`);
      }
    }
    for (const f of findings.filter((f) => f.verdict === 'indeterminate')) {
      process.stdout.write(`  → CANNOT TELL for ${f.path}: ${f.undecidedBy.join(', ')} were not measured. Do not report this as dangling and do not report it as repaired.\n`);
    }
  }
  if (findings.some((f) => f.verdict === 'unrepaired')) return 1;
  if (findings.some((f) => f.verdict === 'indeterminate')) return 3;
  return 0;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  process.exit(main(process.argv.slice(2)));
}
