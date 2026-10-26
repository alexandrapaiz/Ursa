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


const git = (dir, args, opts = {}) =>
  spawnSync('git', ['-C', dir, ...args], { encoding: 'utf8', ...opts });

const gitOk = (dir, args) => {
  const r = git(dir, args);
  if (r.status !== 0) {
    throw new Error(`git ${args.join(' ')} in ${dir} exited ${r.status}\n${r.stderr || ''}`);
  }
  return (r.stdout || '').trim();
};

/** The repository this process is standing in. */
export const toplevel = (cwd = process.cwd()) =>
  execFileSync('git', ['rev-parse', '--show-toplevel'], { encoding: 'utf8', cwd }).trim();

/**
 * A probe clone of `root` with NO merge driver registered: the unregistered
 * case, which is also GitHub's case. Both post-conditions are checked rather
 * than assumed, because an arm that silently has the driver active makes the
 * two arms one measurement and every pair then reports `driver-resolvable`.
 */
export function makeProbe(root, refs) {
  const parent = mkdtempSync(join(tmpdir(), 'pairwise-'));
  const dir = join(parent, 'probe');
  gitOk(root, ['clone', '--local', '--quiet', root, dir]);
  // A local clone brings the object database but only the source's branches,
  // so the refs this run names are fetched explicitly. A missing ref then
  // fails here instead of halfway through a merge.
  if (refs.length) gitOk(dir, ['fetch', '--quiet', root, ...refs.map((r) => `+${r}:${r}`)]);
  const registered = (git(dir, ['config', '--get-regexp', '^merge\\.']).stdout || '').trim();
  if (registered !== '') {
    throw new Error(
      'the probe clone already has a merge driver registered, so the `default` ' +
        `arm would not measure the unregistered case:\n${registered}`,
    );
  }
  if (existsSync(join(dir, '.git', 'info', 'attributes'))) {
    throw new Error('the probe clone carries .git/info/attributes; the arms would be identical');
  }
  return { dir, parent };
}

/** Register every driver this repository declares, in the probe clone only. */
export function installDrivers(root, probe) {
  // The installer is taken from `root`, the live checkout, and run with `cwd`
  // set to the probe, because it resolves its target from
  // `git rev-parse --show-toplevel`. Taking it from the probe's own worktree
  // would fail whenever `base` predates the installer's own commit.
  const r = spawnSync('bash', [join(root, 'tools/registers/install-drivers.sh')], {
    encoding: 'utf8',
    cwd: probe,
  });
  if (r.status !== 0) {
    throw new Error(`install-drivers.sh exited ${r.status} in the probe clone\n${r.stderr || ''}`);
  }
  const registered = (git(probe, ['config', '--get-regexp', '^merge\\.']).stdout || '').trim();
  if (!registered.includes('merge.ledger.driver')) {
    throw new Error('install-drivers.sh exited 0 without registering merge.ledger.driver');
  }
}

/** Paths `ref` changes relative to `base`, as a Set. */
export function changedPaths(probe, base, ref) {
  const out = gitOk(probe, ['diff', '--name-only', `${base}...${ref}`]);
  return new Set(out === '' ? [] : out.split('\n'));
}

const conflictedNow = (probe) => {
  const u = (git(probe, ['diff', '--name-only', '--diff-filter=U']).stdout || '').trim();
  return u === '' ? [] : u.split('\n');
};

/** Merge `ref` onto `base` alone. Used to separate the trunk-conflict lane. */
export function againstBase(probe, base, ref) {
  git(probe, ['merge', '--abort']);
  gitOk(probe, ['checkout', '--quiet', '--detach', base]);
  gitOk(probe, ['reset', '--hard', '--quiet', base]);
  const status = git(probe, ['merge', '--no-commit', '--no-ff', ref]).status;
  const paths = conflictedNow(probe);
  git(probe, ['merge', '--abort']);
  return { status, paths };
}

/**
 * Merge `first` then `second` onto `base`. Returns the conflicted paths of
 * the SECOND merge, or null when the first merge is itself conflicted — that
 * pair belongs to tools/ledger/requeue.sh's branch-versus-trunk lane.
 */
export function sequence(probe, base, first, second) {
  git(probe, ['merge', '--abort']);
  gitOk(probe, ['checkout', '--quiet', '--detach', base]);
  gitOk(probe, ['reset', '--hard', '--quiet', base]);
  if (git(probe, ['merge', '--no-edit', '--quiet', first]).status !== 0) {
    git(probe, ['merge', '--abort']);
    return null;
  }
  const status = git(probe, ['merge', '--no-commit', '--no-ff', second]).status;
  const paths = conflictedNow(probe);
  git(probe, ['merge', '--abort']);
  return { status, paths };
}

export function classify(dflt, driver) {
  if (dflt.status === 0 && dflt.paths.length === 0) return 'independent';
  if (driver && driver.status === 0 && driver.paths.length === 0) return 'driver-resolvable';
  return 'needs-human';
}

/**
 * The whole measurement, with no dependency on `gh`.
 *
 * @param {object} o
 * @param {string} o.root     repository to clone the probe from
 * @param {string} o.base     the trunk ref, e.g. `origin/main`
 * @param {{id: string|number, ref: string, label?: string}[]} o.heads
 * @returns {{base: string, baseSha: string, heads: number, candidates: number,
 *            sequences: number, stuckOnBase: {id: any, paths: string[]}[],
 *            findings: object[]}}
 */
export function measurePairs({ root, base, heads }) {
  const { dir: probe, parent } = makeProbe(root, heads.map((h) => h.ref));
  try {
    const baseSha = gitOk(probe, ['rev-parse', '--short', base]);
    const paths = new Map(heads.map((h) => [h.id, changedPaths(probe, base, h.ref)]));

    // Heads that do not merge onto the trunk at all are the other lane's, and
    // are excluded from every pair: a sequence whose FIRST merge conflicts
    // measures the first merge, not the pair.
    const stuckOnBase = [];
    const ok = [];
    for (const h of heads) {
      const r = againstBase(probe, base, h.ref);
      if (r.paths.length || r.status !== 0) stuckOnBase.push({ id: h.id, paths: r.paths });
      else ok.push(h);
    }

    // Exact prefilter: a conflict is always reported on a path both sides
    // changed, so heads with disjoint changed-path sets cannot collide.
    const candidates = [];
    for (let i = 0; i < ok.length; i++) {
      for (let j = i + 1; j < ok.length; j++) {
        const shared = [...paths.get(ok[i].id)].filter((f) => paths.get(ok[j].id).has(f));
        if (shared.length) candidates.push({ a: ok[i], b: ok[j], shared });
      }
    }

    // Both orders, because the remedy is named per order and the owner picks
    // the order. A pair that collides one way and not the other is a fact
    // about the merge order, so it is reported rather than averaged away.
    const orders = [];
    for (const c of candidates) {
      for (const [first, second] of [
        [c.a, c.b],
        [c.b, c.a],
      ]) {
        orders.push({ first, second, shared: c.shared, dflt: sequence(probe, base, first.ref, second.ref) });
      }
    }
    const collide = orders.filter((o) => o.dflt && (o.dflt.status !== 0 || o.dflt.paths.length));

    if (collide.length) installDrivers(root, probe);
    const findings = collide.map((o) => {
      const driver = sequence(probe, base, o.first.ref, o.second.ref);
      return {
        first: o.first.id,
        second: o.second.id,
        firstLabel: o.first.label || o.first.ref,
        secondLabel: o.second.label || o.second.ref,
        shared: o.shared,
        conflictedUnderDefault: o.dflt.paths,
        conflictedUnderDriver: driver ? driver.paths : o.dflt.paths,
        className: classify(o.dflt, driver),
      };
    });

    return {
      base,
      baseSha,
      heads: heads.length,
      candidates: candidates.length,
      sequences: orders.length,
      stuckOnBase,
      findings,
    };
  } finally {
    rmSync(parent, { recursive: true, force: true });
  }
}

/** Open pull requests as {number, headRefName, title}. */
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

function report(result) {
  console.log(`base: ${result.base} @ ${result.baseSha}`);
  console.log(
    `heads: ${result.heads} open, ${result.candidates} pair(s) share a changed path, ` +
      `${result.sequences} ordered sequence(s) merged, ${result.findings.length} collide ` +
      `under the default line merge`,
  );
  if (result.stuckOnBase.length) {
    console.log(
      `skipped (conflict with ${result.base} itself, which is ` +
        `tools/ledger/requeue.sh's lane): ` +
        result.stuckOnBase.map((s) => `#${s.id} on ${s.paths.join(', ')}`).join('; '),
    );
  }
  console.log('');
  for (const f of result.findings) {
    console.log(`#${f.first} then #${f.second} — ${f.className}`);
    console.log(`  ${f.firstLabel} then ${f.secondLabel}`);
    console.log(`  conflicts under the merge button on: ${f.conflictedUnderDefault.join(', ')}`);
    if (f.className === 'driver-resolvable') {
      console.log('  clean once a merge driver is registered. No judgment is needed.');
      console.log(`  remedy, after #${f.first} lands on ${result.base}:`);
      console.log(`    bash tools/ledger/requeue.sh --push ${f.second}`);
    } else {
      console.log(
        `  still conflicts with the drivers registered, on: ${f.conflictedUnderDriver.join(', ')}`,
      );
      console.log(`  remedy: a human resolves #${f.second} against #${f.first}.`);
    }
    console.log('');
  }
  if (result.findings.length === 0) {
    console.log('No pair of trunk-clean heads collides. Nothing for this tool to report.');
  }
  const needsHuman = result.findings.filter((f) => f.className === 'needs-human');
  console.log(
    `Needs a human: ${
      needsHuman.length ? needsHuman.map((f) => `#${f.first}/#${f.second}`).join(', ') : 'none'
    }`,
  );
}

function main(argv) {
  const asJson = argv.includes('--json');
  const baseIdx = argv.indexOf('--base');
  if (baseIdx !== -1 && !argv[baseIdx + 1]) {
    console.error('usage: pairwise.mjs [--json] [--base <ref>] [<pr-number>...]');
    return 2;
  }
  const base = baseIdx === -1 ? 'origin/main' : argv[baseIdx + 1];
  const explicit = argv
    .filter((a, i) => /^[0-9]+$/.test(a) && !(baseIdx !== -1 && i === baseIdx + 1))
    .map(Number);

  const root = toplevel();
  const pulls = openPulls();
  const chosen = explicit.length ? pulls.filter((p) => explicit.includes(p.number)) : pulls;
  const missing = explicit.filter((n) => !chosen.some((p) => p.number === n));
  if (missing.length) {
    console.error(`not open pull requests: ${missing.join(', ')}`);
    return 2;
  }
  if (chosen.length < 2) {
    console.log('Fewer than two open pull requests. No pair to measure.');
    return 0;
  }

  // Fetch each head into the root as refs/prs/<n>, so the probe can take them
  // by name and so a reader can reproduce any single pair by hand.
  for (const p of chosen) {
    const r = git(root, [
      'fetch', '--quiet', '-f', 'origin',
      `pull/${p.number}/head:refs/prs/${p.number}`,
    ]);
    if (r.status !== 0) {
      console.error(`cannot fetch pull/${p.number}/head: ${r.stderr || ''}`);
      return 2;
    }
  }
  git(root, ['fetch', '--quiet', 'origin']);

  const result = measurePairs({
    root,
    base,
    heads: chosen.map((p) => ({ id: p.number, ref: `refs/prs/${p.number}`, label: p.headRefName })),
  });
  if (asJson) console.log(JSON.stringify(result, null, 2));
  else report(result);
  return result.findings.some((f) => f.className === 'needs-human') ? 1 : 0;
}

if (process.argv[1] && process.argv[1].endsWith('pairwise.mjs')) {
  try {
    process.exit(main(process.argv.slice(2)));
  } catch (err) {
    console.error(String(err && err.message ? err.message : err));
    process.exit(2);
  }
}
