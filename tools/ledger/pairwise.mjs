#!/usr/bin/env node
// pairwise.mjs — classify the collisions a merge queue cannot see.
//
//   node tools/ledger/pairwise.mjs                 # every open pull request
//   node tools/ledger/pairwise.mjs 540 544         # one explicit pair or set
//   node tools/ledger/pairwise.mjs --json          # machine-readable
//   node tools/ledger/pairwise.mjs --base <ref>    # default: origin/main
//
// Exit 0 when no pair needs a human. Exit 1 when at least one pair is
// classified `needs-human`. Exit 2 on a usage or environment fault.
//
// WHY THIS EXISTS. A queue measured only against the trunk cannot see a
// collision between two heads that are each clean against the trunk. The
// Ursa exo seat hit exactly that on 2026-10-26: its queue reported both
// `ursa-engineer/2026-10-26-message-7` (#530) and the skill seat's chain
// tip (#544) MERGEABLE against `main`, and the two conflict with each other
// on `docs/ideas.md`. Nothing in this repository measured that, so the
// remedy came back as a recommendation that one side take a manual rebase.
//
// That recommendation is more expensive than the tool this repository
// already ships. `docs/ideas.md merge=ledger` routes the file to
// `tools/ledger/union-merge.mjs`, which merges it by entry identity, and
// with that driver registered the same pair merges clean with zero
// conflicted paths. So the pair needed no judgment at all: it needed
// `tools/ledger/requeue.sh --push <second>` once the first head landed.
//
// The missing measurement is therefore not "do these two collide" but
// "which remedy does this collision take". This tool answers the second
// question by merging each candidate pair TWICE and comparing:
//
//   arm `default`  a clone where no merge driver is registered. This is
//                  what GitHub's green merge button does, measured and
//                  recorded in docs/design/server-side-merge-measurement.md
//                  §4 Finding 1: the server honors no `.gitattributes`
//                  merge driver, not even git's built-in `union`.
//   arm `driver`   the same clone after tools/registers/install-drivers.sh,
//                  which is what tools/ledger/requeue.sh merges under.
//
//   default clean                  -> independent        (nothing to do)
//   default conflict, driver clean -> driver-resolvable   (requeue.sh)
//   both conflict                  -> needs-human        (a real rebase)
//
// WHY A FRESH CLONE AND NOT A WORKTREE. `git worktree add` shares the
// parent's `.git/config` and `.git/info/attributes`, so a worktree cannot
// represent a clone that never ran the installer — the driver would be
// active in both arms and the two arms would be the same measurement. A
// `git clone --local` writes its own config, carries no
// `.git/info/attributes`, and hardlinks the object database, so it is both
// faithful to the unregistered case and cheap.
//
// WHY THE PAIR SPACE IS PREFILTERED. Twenty open heads are 190 ordered
// pairs and 380 merges. Two heads whose changed-path sets are disjoint
// cannot conflict, so only pairs sharing at least one changed path are
// merged. The filter is exact rather than heuristic: it can never hide a
// collision, because a conflict is always reported on a path, and a path
// both sides changed.
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const argv = process.argv.slice(2);
const asJson = argv.includes('--json');
const baseIdx = argv.indexOf('--base');
const base = baseIdx === -1 ? 'origin/main' : argv[baseIdx + 1];
const explicit = argv.filter((a) => /^[0-9]+$/.test(a)).map(Number);

if (baseIdx !== -1 && !base) {
  console.error('usage: pairwise.mjs [--json] [--base <ref>] [<pr-number>...]');
  process.exit(2);
}

const root = execFileSync('git', ['rev-parse', '--show-toplevel'], { encoding: 'utf8' }).trim();
const git = (dir, args, opts = {}) =>
  spawnSync('git', ['-C', dir, ...args], { encoding: 'utf8', ...opts });
const gitOk = (dir, args) => {
  const r = git(dir, args);
  if (r.status !== 0) {
    throw new Error(`git ${args.join(' ')} in ${dir} exited ${r.status}\n${r.stderr || ''}`);
  }
  return (r.stdout || '').trim();
};

/** Open pull requests, newest first, as {number, headRefName, title}. */
function openPulls() {
  const r = spawnSync(
    'gh',
    ['pr', 'list', '--state', 'open', '--limit', '200', '--json', 'number,headRefName,title'],
    { encoding: 'utf8' },
  );
  if (r.status !== 0) {
    console.error('Cannot list pull requests. Is `gh` authenticated?');
    console.error(r.stderr || '');
    process.exit(2);
  }
  return JSON.parse(r.stdout);
}

/**
 * A probe clone with no merge driver registered: the unregistered case,
 * which is also GitHub's case. Returns its path.
 */
function makeProbe(refs) {
  const dir = join(mkdtempSync(join(tmpdir(), 'pairwise-')), 'probe');
  gitOk(root, ['clone', '--local', '--quiet', root, dir]);
  // A local clone brings the object database but only the source's branches.
  // Fetch the refs this run names, explicitly, so a missing ref fails here
  // rather than halfway through a merge.
  gitOk(dir, ['fetch', '--quiet', root, ...refs.map((r) => `+${r}:${r}`)]);
  const registered = git(dir, ['config', '--get-regexp', '^merge\\.']).stdout || '';
  if (registered.trim() !== '') {
    throw new Error(
      `the probe clone already has a merge driver registered, so the ` +
        `\`default\` arm would not measure the unregistered case:\n${registered}`,
    );
  }
  if (existsSync(join(dir, '.git', 'info', 'attributes'))) {
    throw new Error('the probe clone carries .git/info/attributes; the arms would be identical');
  }
  return dir;
}

/** Register every driver this repository declares, in the probe clone only. */
function installDrivers(probe) {
  const r = spawnSync('bash', [join(root, 'tools/registers/install-drivers.sh')], {
    encoding: 'utf8',
    cwd: probe,
  });
  if (r.status !== 0) {
    throw new Error(`install-drivers.sh exited ${r.status} in the probe clone\n${r.stderr || ''}`);
  }
  const registered = git(probe, ['config', '--get-regexp', '^merge\\.']).stdout || '';
  if (!registered.includes('merge.ledger.driver')) {
    throw new Error('install-drivers.sh exited 0 without registering merge.ledger.driver');
  }
}

/** Paths a ref changes relative to `base`, as a Set. */
function changedPaths(probe, ref) {
  const out = gitOk(probe, ['diff', '--name-only', `${base}...${ref}`]);
  return new Set(out === '' ? [] : out.split('\n'));
}

/**
 * Merge `first` then `second` onto `base` in the probe clone. Returns the
 * conflicted paths of the SECOND merge, or null when the first merge is
 * itself conflicted (that pair belongs to requeue.sh's branch-vs-trunk
 * lane, not to this tool).
 */
function sequence(probe, first, second) {
  git(probe, ['merge', '--abort']);
  gitOk(probe, ['checkout', '--quiet', '--detach', base]);
  gitOk(probe, ['reset', '--hard', '--quiet', base]);
  if (git(probe, ['merge', '--no-edit', '--quiet', first]).status !== 0) {
    git(probe, ['merge', '--abort']);
    return null;
  }
  const r = git(probe, ['merge', '--no-commit', '--no-ff', second]);
  const conflicted = (git(probe, ['diff', '--name-only', '--diff-filter=U']).stdout || '')
    .trim();
  git(probe, ['merge', '--abort']);
  return { status: r.status, paths: conflicted === '' ? [] : conflicted.split('\n') };
}

function classify(dflt, driver) {
  if (dflt.paths.length === 0 && dflt.status === 0) return 'independent';
  if (driver.paths.length === 0 && driver.status === 0) return 'driver-resolvable';
  return 'needs-human';
}

function main() {
  const pulls = openPulls();
  const chosen = explicit.length
    ? pulls.filter((p) => explicit.includes(p.number))
    : pulls;
  if (explicit.length) {
    const missing = explicit.filter((n) => !chosen.some((p) => p.number === n));
    if (missing.length) {
      console.error(`not open pull requests: ${missing.join(', ')}`);
      process.exit(2);
    }
  }
  if (chosen.length < 2) {
    console.log('Fewer than two open pull requests. No pair to measure.');
    return 0;
  }

  // Fetch every head into the root as refs/prs/<n> so the probe can take
  // them by name and so a reader can reproduce any single pair by hand.
  for (const p of chosen) {
    const r = git(root, ['fetch', '--quiet', 'origin', `pull/${p.number}/head:refs/prs/${p.number}`, '-f']);
    if (r.status !== 0) {
      console.error(`cannot fetch pull/${p.number}/head: ${r.stderr || ''}`);
      process.exit(2);
    }
  }
  git(root, ['fetch', '--quiet', 'origin']);

  const refs = chosen.map((p) => `refs/prs/${p.number}`);
  const probe = makeProbe(refs);
  try {
    const paths = new Map(chosen.map((p) => [p.number, changedPaths(probe, `refs/prs/${p.number}`)]));

    // Heads that do not merge onto the base at all are the other lane's.
    const vsBase = new Map();
    for (const p of chosen) {
      git(probe, ['merge', '--abort']);
      gitOk(probe, ['checkout', '--quiet', '--detach', base]);
      gitOk(probe, ['reset', '--hard', '--quiet', base]);
      const st = git(probe, ['merge', '--no-commit', '--no-ff', `refs/prs/${p.number}`]).status;
      const u = (git(probe, ['diff', '--name-only', '--diff-filter=U']).stdout || '').trim();
      git(probe, ['merge', '--abort']);
      vsBase.set(p.number, { status: st, paths: u === '' ? [] : u.split('\n') });
    }

    const candidates = [];
    for (let i = 0; i < chosen.length; i++) {
      for (let j = i + 1; j < chosen.length; j++) {
        const a = chosen[i].number;
        const b = chosen[j].number;
        if (vsBase.get(a).paths.length || vsBase.get(b).paths.length) continue;
        const shared = [...paths.get(a)].filter((f) => paths.get(b).has(f));
        if (shared.length === 0) continue;
        candidates.push({ a, b, shared });
      }
    }

    // Both orders, because the remedy is named per order and the owner
    // chooses the order. A pair that collides one way and not the other is a
    // fact about the merge order, so it is reported rather than averaged.
    const orders = [];
    for (const c of candidates) {
      for (const [first, second] of [[c.a, c.b], [c.b, c.a]]) {
        orders.push({ first, second, shared: c.shared, dflt: sequence(probe, `refs/prs/${first}`, `refs/prs/${second}`) });
      }
    }
    const collide = orders.filter((o) => o.dflt && (o.dflt.status !== 0 || o.dflt.paths.length));

    installDrivers(probe);
    const findings = collide.map((o) => {
      const driver = sequence(probe, `refs/prs/${o.first}`, `refs/prs/${o.second}`);
      return {
        first: o.first,
        second: o.second,
        shared: o.shared,
        conflictedUnderDefault: o.dflt.paths,
        conflictedUnderDriver: driver ? driver.paths : [],
        className: classify(o.dflt, driver || { status: 1, paths: o.dflt.paths }),
      };
    });

    const titleOf = (n) => chosen.find((p) => p.number === n);
    const needsHuman = findings.filter((f) => f.className === 'needs-human');

    if (asJson) {
      console.log(JSON.stringify({ base, measured: candidates.length, findings }, null, 2));
    } else {
      console.log(`base: ${base} @ ${gitOk(probe, ['rev-parse', '--short', base])}`);
      console.log(
        `heads: ${chosen.length} open, ${candidates.length} pair(s) share a changed path, ` +
          `${orders.length} ordered sequence(s) merged, ${findings.length} collide under ` +
          `the default line merge`,
      );
      const stuckVsBase = [...vsBase.entries()].filter(([, v]) => v.paths.length).map(([n]) => n);
      if (stuckVsBase.length) {
        console.log(
          `skipped (conflict with ${base} itself, which is ` +
            `tools/ledger/requeue.sh's lane): ${stuckVsBase.map((n) => '#' + n).join(', ')}`,
        );
      }
      console.log('');
      for (const f of findings) {
        console.log(`#${f.first} then #${f.second} — ${f.className}`);
        console.log(`  ${titleOf(f.first).headRefName} then ${titleOf(f.second).headRefName}`);
        console.log(`  conflicts under the merge button on: ${f.conflictedUnderDefault.join(', ')}`);
        if (f.className === 'driver-resolvable') {
          console.log(`  clean once a merge driver is registered. No judgment is needed.`);
          console.log(`  remedy, after #${f.first} lands on ${base}:`);
          console.log(`    bash tools/ledger/requeue.sh --push ${f.second}`);
        } else {
          console.log(
            `  still conflicts with the drivers registered, on: ` +
              `${f.conflictedUnderDriver.join(', ')}`,
          );
          console.log(`  remedy: a human resolves #${f.second} against #${f.first}.`);
        }
        console.log('');
      }
      if (findings.length === 0) {
        console.log('No pair of trunk-clean heads collides. Nothing for this tool to report.');
      }
      console.log(`Needs a human: ${needsHuman.length ? needsHuman.map((f) => `#${f.first}/#${f.second}`).join(', ') : 'none'}`);
    }
    return needsHuman.length ? 1 : 0;
  } finally {
    rmSync(join(probe, '..'), { recursive: true, force: true });
  }
}

try {
  process.exit(main());
} catch (err) {
  console.error(String(err && err.message ? err.message : err));
  process.exit(2);
}
