#!/usr/bin/env node
// merge-verdict.mjs — a merge verdict is a DATED reading, and until this tool
// existed no seat in this org had ever quoted its date.
//
//     node tools/seat/merge-verdict.mjs [<n>...] [--json] [--only-stale]
//                                       [--max-age-minutes N] [--require-current]
//                                       [--probe] [--from <file>]
//
// Exit 0 when the read succeeded and any gate passed, 1 when a gate failed,
// 2 on usage, 3 when the forge or the wire could not be read.
//
// WHY THIS EXISTS, and it is not convenience.
//
// `prompts/exo-agent.md` §5b told a window to detect a stale merge verdict by
// comparing the API's `baseRefOid` against `git rev-parse origin/main`. Both
// operands come out of one fetch generation, so a clone that is behind makes
// them AGREE, and the guard reports health in the one case it exists to catch.
// The eighty-first window of Ursa's exo seat spent four reads concluding
// GitHub was wrong about a merge it was right about, with that guard passing
// the whole time
// (INC-2026-11-02-the-staleness-guard-for-a-merge-verdict-compares-two-copies-of-one-fetch-and-agrees-when-both-are-stale).
// It could not write the fix: the fix is a `prompts/` path and that window
// held the register lane. This tool and the charter clause citing it are the
// eighty-second window discharging that debt, and the fix is in code because
// a comparison is the kind of thing prose gets backwards.
//
// THREE THINGS IT MEASURED THAT NO FIELD REPORTS, all over the 33 pull
// requests open in this repository at 2026-11-02T05:1xZ.
//
// 1. `baseRefOid` IS A CACHE, NOT THE TRUNK. For 22 of the 33 it named a
//    commit that was no longer `main`. So the §5b guard was not merely
//    comparable-when-stale; its premise was false for two thirds of the queue.
//    The right operand has to come off the wire, which is what readWire() does
//    and why nothing here calls `git rev-parse origin/main`.
//
// 2. `headRefOid` IS NOT THE HEAD THE VERDICT WAS COMPUTED AT. The only
//    artifact that reports that is the SECOND PARENT of `refs/pull/<n>/merge`.
//    They differed on 4 of 33, every one of them reading CONFLICTING: GitHub
//    served a current head beside a verdict derived from an older one.
//
// 3. THE MERGE REF CARRIES ITS OWN CLOCK, and it is the only artifact in this
//    whole pipeline that does. Its committer date is the instant the verdict
//    was computed. Ages ranged from 2 minutes to 327 — one verdict in the
//    queue was five and a half hours old while `main` took 233 commits in 24
//    hours, 25 to 66 of them in each hour this seat runs. A 40-minute window
//    therefore reads a trunk that moves under it by tens of commits, so EVERY
//    undated merge verdict in this org is stale by default and several were
//    quoted to the owner as current.
//
// AND ONE CLAIM OF THE EIGHTY-FIRST WINDOW'S THAT THIS TOOL REFUTES, because
// paying a debt means grading the note that recorded it. That window called
// the merge ref "written on success and never invalidated", which reads as
// "present means mergeable". The remote advertises `refs/pull/<n>/merge` for
// all 33 open pull requests INCLUDING all 9 that read CONFLICTING, so presence
// discriminates nothing. What it does carry is a merge that really happened:
// for #643, #660 and #672 — all three CONFLICTING — `git merge-tree` over the
// ref's own two parents reproduced the ref's tree BYTE FOR BYTE. Those are not
// conflicted branches. They are successful merges against a trunk that moved,
// and `trunk-moved` below is that state given a name so a seat stops rebasing
// for it and runs one forward merge instead.
//
// THE POSITIVE CONTROL, which is Ursa's engineer seat's rule generalised. That
// seat found its own gate back-filling an instant from a block that carried
// only a day, landing 30 minutes off its own walk, and made the remedy a
// refusal: a block without a clock reading is refused rather than quoted. Same
// rule here. A pull request whose merge ref cannot be dated classifies as
// `undated` and this tool will not print an age for it, because an age
// invented from the fields that are available is the defect, not the gap.
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

/** The four states a merge verdict can be in. Order is severity, worst first. */
export const STATES = ['undated', 'head-moved', 'trunk-moved', 'current'];

/**
 * Classify one pull request's verdict from the three OIDs and the wire tip.
 *
 * Pure, and exported, because the test grades it against hand-built rows: the
 * one thing a live-forge test cannot do is construct the stale cases on demand.
 *
 * @param {{mergeable:string, headRefOid:string, baseRefOid:string,
 *          mergeHead:?string, mergeBase:?string, writtenAt:?number}} row
 * @param {string} wire  main's tip read from `git ls-remote`, never from a ref
 */
export function classify(row, wire) {
  if (!row.mergeHead || !row.mergeBase || !row.writtenAt) return 'undated';
  if (row.mergeHead !== row.headRefOid) return 'head-moved';
  if (row.mergeBase !== wire) return 'trunk-moved';
  return 'current';
}

/**
 * What a seat should DO, from the state AND the verdict together. Kept beside
 * the classifier rather than in a charter, because a state whose remedy lives
 * three thousand lines from its name is how §5b's guard survived unread for
 * three weeks.
 *
 * The two arguments are the correction this function exists for. A first draft
 * keyed the remedy on the state alone and told the holder of a MERGEABLE
 * `trunk-moved` row to go and merge `main`, which is work for no reason: the
 * verdict is simply dated against an older trunk and says nothing is wrong.
 * `trunk-moved` is only an instruction when the verdict is CONFLICTING.
 */
export function remedyFor(state, mergeable) {
  if (state === 'undated') return 'nothing to quote. Say you could not measure';
  if (state === 'head-moved') {
    return 'the verdict predates your own last push; no API field says so. Re-read after the forge recomputes';
  }
  if (state === 'trunk-moved') {
    return mergeable === 'CONFLICTING'
      ? "not necessarily a conflict in your work: the trunk moved under a merge that succeeded. Install the drivers, `git merge --no-edit origin/main`, push, and re-read. Yours to run, not the owner's to judge"
      : 'nothing to do, but do not quote it as current: it was computed against an older trunk';
  }
  return mergeable === 'CONFLICTING'
    ? 'a real conflict against the trunk as it stands, and the age is small. This one is work'
    : 'quote it, with the age';
}

/** Age in whole minutes at a stated instant, or null when undated. */
export function ageMinutes(writtenAt, nowEpoch) {
  if (!writtenAt) return null;
  return Math.floor((nowEpoch - writtenAt) / 60);
}

/**
 * main's tip OFF THE WIRE. The whole point of the tool, in four lines.
 *
 * It also reports whether the local clone agrees, which is the §0 breadth and
 * depth guards' missing third property: a clone can be deep, and broad, and
 * still be BEHIND, and every verdict measured in it is then void. That is not
 * detectable by comparing two local refs, which is exactly what the guard this
 * tool replaces did.
 */
export function readWire(run = spawnSync) {
  const ls = run('git', ['ls-remote', 'origin', 'refs/heads/main'], { encoding: 'utf8' });
  if (ls.status !== 0) return { error: (ls.stderr || 'git ls-remote failed').trim() };
  const wire = String(ls.stdout).split(/\s+/)[0];
  if (!/^[0-9a-f]{40}$/.test(wire || '')) return { error: `unparseable ls-remote output: ${ls.stdout}` };
  const local = run('git', ['rev-parse', 'origin/main'], { encoding: 'utf8' });
  const localOid = local.status === 0 ? String(local.stdout).trim() : null;
  return { wire, localOid, behind: localOid !== wire };
}

function oidOf(ref) {
  const r = spawnSync('git', ['rev-parse', '--verify', '--quiet', ref], { encoding: 'utf8' });
  return r.status === 0 ? String(r.stdout).trim() : null;
}

function committerEpoch(ref) {
  const r = spawnSync('git', ['log', '-1', '--format=%ct', ref], { encoding: 'utf8' });
  if (r.status !== 0) return null;
  const n = Number(String(r.stdout).trim());
  return Number.isFinite(n) && n > 0 ? n : null;
}

/**
 * Fetch the merge refs and read the pair each verdict actually used.
 *
 * The refspec has an EXPLICIT DESTINATION for the reason §0 gives about
 * `refs/prs/*`: this seat's host hands out a single-branch refspec, under which
 * `git fetch origin <name>` exits 0, writes FETCH_HEAD and creates no
 * remote-tracking ref at all. A read that assumed otherwise reported all seven
 * open pull requests as deleted branches
 * (INC-2026-10-18-single-branch-refspec-reads-as-deleted).
 */
export function readMergeRefs(numbers) {
  const f = spawnSync('git', ['fetch', 'origin', '+refs/pull/*/merge:refs/prmerge/*', '--quiet'],
                      { encoding: 'utf8' });
  if (f.status !== 0) return { error: (f.stderr || 'git fetch of merge refs failed').trim() };
  const out = new Map();
  for (const n of numbers) {
    const ref = `refs/prmerge/${n}`;
    if (!oidOf(ref)) { out.set(n, { mergeHead: null, mergeBase: null, writtenAt: null }); continue; }
    out.set(n, {
      mergeBase: oidOf(`${ref}^1`),
      mergeHead: oidOf(`${ref}^2`),
      writtenAt: committerEpoch(ref),
    });
  }
  return { refs: out };
}

/**
 * `--probe`: stop asking GitHub and do the merge. Two independent questions,
 * and the tool answers both because together they are the only thing that
 * separates "the trunk moved" from "there is work here".
 *
 * `reproduces` — does `git merge-tree` over the merge ref's OWN two parents
 *   give back the merge ref's tree? When it does, GitHub really did merge that
 *   pair and the CONFLICTING it is serving is about a different pair. Measured
 *   byte-identical on #643, #660 and #672, all three reading CONFLICTING.
 *
 * `forward` — does the branch merge the CURRENT trunk, with THIS repository's
 *   merge drivers registered? That is the question a seat actually has, and it
 *   is not the question GitHub answers: the forge has never had
 *   `tools/registers/merge-driver.mjs` or `tools/ledger/union-merge.mjs`, so a
 *   register-only collision reads as a conflict there and merges here. Install
 *   them first (`tools/registers/install-drivers.sh`,
 *   `tools/ledger/install-driver.sh`); a `merge=` attribute is inert until the
 *   driver is in git config, which is per clone.
 *
 * `--probe` needs the branch's objects, so fetch the pull heads into
 * `refs/prs` with an EXPLICIT DESTINATION first (§0's third line). Without
 * one, `probe` comes back `no-local-ref` for every row rather than lying.
 */
export function probe(n) {
  const ref = `refs/prmerge/${n}`;
  const out = { reproduces: null, forward: null };
  if (oidOf(ref)) {
    const tree = oidOf(`${ref}^{tree}`);
    const r = spawnSync('git', ['merge-tree', '--write-tree', `${ref}^1`, `${ref}^2`],
                        { encoding: 'utf8' });
    out.reproduces = r.status === 0 && String(r.stdout).trim() === tree;
  }
  const head = `refs/prs/${n}`;
  if (!oidOf(head)) { out.forward = 'no-local-ref'; return out; }
  const f = spawnSync('git', ['merge-tree', '--write-tree', '--name-only', 'origin/main', head],
                      { encoding: 'utf8' });
  // merge-tree exits 128 in a shallow clone and that reads exactly like a
  // conflict (runner-facts §9), so distinguish the two rather than inverting
  // an exit status.
  if (f.status === 128) out.forward = 'could-not-measure';
  else out.forward = f.status === 0 ? 'clean' : 'conflict';
  return out;
}

function readForge() {
  const r = spawnSync(
    'gh',
    ['pr', 'list', '--state', 'open', '--limit', '200', '--json',
     'number,headRefName,mergeable,headRefOid,baseRefOid,isDraft,title'],
    { encoding: 'utf8' },
  );
  if (r.status !== 0) return { error: (r.stderr || 'gh failed').trim() };
  try { return { prs: JSON.parse(r.stdout) }; }
  catch (e) { return { error: `gh returned unparseable JSON: ${e.message}` }; }
}

/** Join the forge rows to the merge refs and classify. Pure given both. */
export function buildRows(prs, refs, wire, nowEpoch) {
  return prs.map((p) => {
    const m = refs.get(p.number) || { mergeHead: null, mergeBase: null, writtenAt: null };
    const row = { ...p, ...m };
    const state = classify(row, wire);
    return { ...row, state, age_minutes: ageMinutes(row.writtenAt, nowEpoch),
             remedy: remedyFor(state, p.mergeable) };
  });
}

function main(argv) {
  const flags = new Set(argv.filter((a) => a.startsWith('--')));
  const nums = argv.filter((a) => /^\d+$/.test(a)).map(Number);
  const maxIdx = argv.indexOf('--max-age-minutes');
  const maxAge = maxIdx === -1 ? null : Number(argv[maxIdx + 1]);
  if (maxIdx !== -1 && !Number.isFinite(maxAge)) {
    console.error('usage: --max-age-minutes takes a number');
    return 2;
  }

  const fromIdx = argv.indexOf('--from');
  let rows, wireInfo;
  if (fromIdx !== -1) {
    // Fixture mode, for the test and for replaying a past read.
    const fx = JSON.parse(readFileSync(argv[fromIdx + 1], 'utf8'));
    wireInfo = { wire: fx.wire, localOid: fx.wire, behind: false };
    const refs = new Map(fx.prs.map((p) => [p.number, p]));
    rows = buildRows(fx.prs, refs, fx.wire, fx.now);
  } else {
    wireInfo = readWire();
    if (wireInfo.error) { console.error(`could not read the wire: ${wireInfo.error}`);
                          console.log('COULD NOT MEASURE'); return 3; }
    const forge = readForge();
    if (forge.error) { console.error(`could not read the forge: ${forge.error}`);
                       console.log('COULD NOT MEASURE'); return 3; }
    const prs = nums.length ? forge.prs.filter((p) => nums.includes(p.number)) : forge.prs;
    const mr = readMergeRefs(prs.map((p) => p.number));
    if (mr.error) { console.error(`could not read the merge refs: ${mr.error}`);
                    console.log('COULD NOT MEASURE'); return 3; }
    rows = buildRows(prs, mr.refs, wireInfo.wire, Math.floor(Date.now() / 1000));
    if (flags.has('--probe')) rows = rows.map((r) => ({ ...r, ...probe(r.number) }));
  }

  rows.sort((a, b) => STATES.indexOf(a.state) - STATES.indexOf(b.state) || a.number - b.number);
  const shown = flags.has('--only-stale') ? rows.filter((r) => r.state !== 'current') : rows;
  const tally = Object.fromEntries(STATES.map((s) => [s, rows.filter((r) => r.state === s).length]));

  if (flags.has('--json')) {
    console.log(JSON.stringify({ wire: wireInfo.wire, behind: wireInfo.behind, tally, rows: shown }, null, 2));
  } else {
    // The count line prints even when the selection is empty, so an absence
    // carries its own positive control (own-prs.mjs, defect 2).
    console.log(
      `wire=${String(wireInfo.wire).slice(0, 8)} local_behind_wire=${wireInfo.behind} ` +
      `read=${new Date().toISOString().slice(0, 19)}Z open=${rows.length} shown=${shown.length} ` +
      STATES.map((s) => `${s}=${tally[s]}`).join(' '));
    for (const r of shown) {
      const age = r.age_minutes === null ? 'undated' : `${r.age_minutes}m`;
      console.log([`#${r.number}`, r.mergeable, r.state, age,
                   `verdict_head=${String(r.mergeHead || '-').slice(0, 8)}`,
                   `api_head=${String(r.headRefOid).slice(0, 8)}`,
                   `verdict_base=${String(r.mergeBase || '-').slice(0, 8)}`].join('\t'));
      if (r.forward !== undefined) {
        console.log(`\tprobe: merge_ref_reproduces=${r.reproduces} forward_merge_with_drivers=${r.forward}`);
      }
      if (r.state !== 'current' || r.mergeable === 'CONFLICTING') console.log(`\t-> ${r.remedy}`);
    }
  }

  if (wireInfo.behind) {
    console.error('this clone is behind the wire; every verdict above is void until you fetch');
    return 1;
  }
  if (maxAge !== null) {
    const old = rows.filter((r) => r.age_minutes === null || r.age_minutes > maxAge);
    if (old.length) {
      console.error(`${old.length} verdict(s) older than ${maxAge}m or undated: ` +
                    old.map((r) => `#${r.number}`).join(' '));
      return 1;
    }
  }
  if (flags.has('--require-current') && tally.current !== rows.length) return 1;
  return 0;
}

if (import.meta.url === `file://${process.argv[1]}`) process.exit(main(process.argv.slice(2)));
