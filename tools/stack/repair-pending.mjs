#!/usr/bin/env node
// repair-pending.mjs — is this string on the base actually unrepaired?
//
//     node tools/stack/repair-pending.mjs --text '<string>' [--base origin/main]
//                                         [--path docs/ideas.md]... [--json out.json]
//                                         [--refs refs/prs/511,refs/prs/513] [--quiet]
//
// Exit 0 when every hit on the base has a repair waiting somewhere, 1 when
// any hit is genuinely unrepaired, 2 on usage. So it is usable as the gate in
// front of "report this as a dangling citation".
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
//   repaired    the string is at the fork point and gone from the head. A
//               repair exists and is waiting on a merge. NOT a finding.
//   partial     fewer on the head than at the fork point, but not zero. READ
//               IT: half a repair reads like a whole one in a count.
//   stale-root  zero on the head and zero at the fork point. The head never
//               had the string. This is NOT a repair and merging it will not
//               remove anything; it may revert what added it.
//   file-gone   the path does not exist on the head at all. NOT a repair for
//               the same reason: a deletion is not an edit.
//   unchanged   the head carries the string as the fork point did.
//
// And one verdict per (path, line), which is what the exit code is about:
//
//   pending     some open head is `repaired` or `partial` for this path. Say
//               "repaired, unmerged, in #N" and not "dangling".
//   unrepaired  no open head touches it. This is the finding.
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
  if (headCount === null) return 'file-gone';
  if (headCount === 0) return forkCount > 0 ? 'repaired' : 'stale-root';
  if (forkCount !== null && headCount < forkCount) return 'partial';
  return 'unchanged';
}

/** The classes that mean a merge would remove at least one occurrence. */
export const REPAIRING = new Set(['repaired', 'partial']);

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
      const forkCount = mb ? countAt(mb, path, text, read) : null;
      const headCount = countAt(head.ref, path, text, read);
      heads_.push({
        ...head,
        mergeBase: mb,
        forkCount,
        headCount,
        klass: classify({ forkCount, headCount }),
      });
    }
    const repairing = heads_.filter((h) => REPAIRING.has(h.klass));
    findings.push({
      path,
      baseCount,
      verdict: repairing.length ? 'pending' : 'unrepaired',
      repairedBy: repairing.map((h) => h.number ?? h.ref),
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

  const report = { base: opts.base, text: opts.text, unreadableHeads: unreadable.map((h) => h.ref), findings };
  if (opts.json) writeFileSync(opts.json, `${JSON.stringify(report, null, 2)}\n`);

  if (!opts.quiet) {
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
        process.stdout.write(`  ${h.klass.padEnd(10)} ${h.number}${draft} — fork ${h.forkCount ?? '-'} → head ${h.headCount ?? 'file gone'}\n`);
      }
      if (f.verdict === 'pending') {
        process.stdout.write(`  → report as repaired-and-unmerged in ${f.repairedBy.join(', ')}, not as dangling\n`);
      }
    }
  }
  return findings.some((f) => f.verdict === 'unrepaired') ? 1 : 0;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  process.exit(main(process.argv.slice(2)));
}
