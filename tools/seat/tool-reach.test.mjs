// node --test tools/seat/tool-reach.test.mjs
//
// Four kinds of test, and the controls are the half that can fail honestly.
//
// "bound:"   the state vocabulary is asserted, not trusted. Only `missing` and
//            `sibling-repo` route anywhere, so a sixth state added without a
//            route is a row a reader will read as handled.
// "shape:"   the path spellings this repository's standards actually contain,
//            each with the reduction it needs.
// "control:" the rule for this directory, from runner-facts: an absence is a
//            measurement and it needs a positive control. This tool's whole
//            output is a classification of absences, so every claim that a
//            path resolves is paired with the fixture that must NOT resolve,
//            and every claim that one does not is paired with the root that
//            would have made it resolve. Four matter, and the fourth is the
//            one the prose sweep never had:
//              1. `missing` must be reachable, or "0 binding misses" cannot be
//                 told apart from a sweep that resolves everything.
//              2. `sibling-repo` must be caused by the ROOT and not by the
//                 path: with an empty root set the same path must read
//                 `missing`. Otherwise the fifth state is a relabelling.
//              3. `parked` must be unreachable without a --ref, because that is
//                 the honest reading and the report says so in its header.
//              4. the hq/sibling split must key on the REMOTE and not on the
//                 root's name. `alexandria` and `alexandra-systems` share seven
//                 characters; a prefix or substring match on either direction
//                 calls one of them the other, and the two have opposite
//                 routes.
// "live:"    read off the committed standards. Growth-sensitive numbers are
//            asserted as floors with the measurement dated beside them.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import {
  classify, hostRoots, namesIn, vendoredElsewhere,
  TOOL_RE, BINDING, CONTEXT, STATES,
} from './tool-reach.mjs';

const ROOT = execFileSync('git', ['rev-parse', '--show-toplevel'], { encoding: 'utf8' }).trim();
const ROUTES = new Set(['missing', 'sibling-repo']);

test('bound: the state vocabulary is closed, ordered worst-first, and only two states route', () => {
  assert.deepEqual(STATES, [
    'missing', 'sibling-repo', 'parked', 'vendored-elsewhere', 'hq-root', 'present',
  ]);
  for (const r of ROUTES) assert.ok(STATES.includes(r), `${r} routes but is not a state`);
  // Every state this tool can emit is in the list. The classifier's own
  // branches are the authority; this asserts they agree with the vocabulary.
  const roots = hostRoots(ROOT);
  const emitted = new Set();
  for (const p of [
    'tools/seat/tool-reach.mjs',          // present
    'tools/merge-register.py',            // vendored elsewhere
    'tools/autonomy.py',                  // HQ's root
    'tools/ship_first.py',                // a sibling's root
    'tools/zzz-no-such-tool-anywhere.sh', // missing
  ]) emitted.add(classify(p, { selfRoot: ROOT, roots, ref: null }).state);
  for (const s of emitted) assert.ok(STATES.includes(s), `${s} is not in the vocabulary`);
});

test('shape: the regex takes the path forms the standards use and stops at the extension', () => {
  const text = 'run `tools/ship_first.py` then tools/seat/own-prs.mjs, '
    + 'tools/host/asc-hq-suites.sh, tools/seat/branch-patterns.json, '
    + 'and tools/check-wake-prompts.py. Not tools/ alone, nor tools/x.txt.';
  assert.deepEqual([...new Set(text.match(TOOL_RE) || [])].sort(), [
    'tools/check-wake-prompts.py',
    'tools/host/asc-hq-suites.sh',
    'tools/seat/branch-patterns.json',
    'tools/seat/own-prs.mjs',
    'tools/ship_first.py',
  ]);
  assert.ok(!/tools\/x\.txt/.test([...(text.match(TOOL_RE) || [])].join(' ')));
});

test('control 1: `missing` is reachable, so a zero count is a reading and not a tautology', () => {
  const roots = hostRoots(ROOT);
  const got = classify('tools/zzz-no-such-tool-anywhere.sh', { selfRoot: ROOT, roots, ref: null });
  assert.equal(got.state, 'missing');
  assert.equal(got.where, null);
  // paired positive control: a path that IS here must not reach `missing`
  const here = classify('tools/seat/tool-reach.mjs', { selfRoot: ROOT, roots, ref: null });
  assert.equal(here.state, 'present');
});

// THE CONTROL THIS FILE DID NOT HAVE, and it was found by mutation rather than
// by reading. The first draft of this file passed all nine tests with
// `hostRoots` stubbed to return `[]` — the exact defect the tool exists to fix.
// Controls 2 and 4 each open with an off-host early return, so an empty root
// set satisfied both by skipping them, and a guard that cannot tell its abort
// from its verdict is §0's own finding one directory over.
//
// The fix is a host marker read independently of `hostRoots`: if the resident
// host's repository directory is on this box, root discovery must return
// something. Off the host the assertion is about the marker and still runs.
test('control 0: root discovery is not allowed to be silently empty where the host is present', () => {
  const onHost = existsSync('/srv/asc/repos') || existsSync('/srv/asc/hq');
  const roots = hostRoots(ROOT);
  if (onHost) {
    assert.ok(roots.length > 0,
      'the host roots are on this box and discovery returned none; every `missing` '
      + 'this tool prints is then a short root set and not a routing finding');
    assert.ok(roots.some((r) => r.kind === 'hq'), 'no HQ root found on a host that has one');
  } else {
    assert.equal(roots.length, 0, 'roots were discovered with no host directory to discover them in');
  }
});

test('control 2: `sibling-repo` is caused by the root set, so an empty one returns it to `missing`', () => {
  const roots = hostRoots(ROOT);
  const sib = roots.filter((r) => r.kind === 'repo');
  if (!sib.length) {
    // Off the resident host there is nothing to classify and nothing to prove.
    // Saying so is the result; inventing a pass over an absent fixture is not.
    assert.equal(hostRoots(ROOT).filter((r) => r.kind === 'repo').length, 0);
    return;
  }
  const withRoots = classify('tools/ship_first.py', { selfRoot: ROOT, roots, ref: null });
  const without = classify('tools/ship_first.py', { selfRoot: ROOT, roots: [], ref: null });
  assert.equal(withRoots.state, 'sibling-repo');
  assert.equal(without.state, 'missing');
  // and it names where, because "run it where it is" is the remedy
  assert.ok(withRoots.where.startsWith(withRoots.root));
  assert.equal(withRoots.rootName, 'alexandria');
});

test('control 3: `parked` needs a --ref, and without one it reads `missing` rather than resolving', () => {
  const roots = hostRoots(ROOT);
  // A path that exists in no root and in no worktree, but does exist at a ref.
  // HEAD is the cheap ref that is always resolvable, so use a file this commit
  // has and the fixture tree does not.
  const dir = mkdtempSync(join(tmpdir(), 'tool-reach-'));
  try {
    execFileSync('git', ['-C', dir, 'init', '-q']);
    mkdirSync(join(dir, 'tools'), { recursive: true });
    writeFileSync(join(dir, 'tools', 'parked-only.sh'), '#!/bin/sh\n');
    execFileSync('git', ['-C', dir, 'add', '-A']);
    execFileSync('git', ['-C', dir, '-c', 'user.name=t', '-c', 'user.email=t@t', 'commit', '-qm', 'x']);
    rmSync(join(dir, 'tools', 'parked-only.sh'));
    const cwd = process.cwd();
    process.chdir(dir);
    try {
      const noRef = classify('tools/parked-only.sh', { selfRoot: dir, roots, ref: null });
      const withRef = classify('tools/parked-only.sh', { selfRoot: dir, roots, ref: 'HEAD' });
      assert.equal(noRef.state, 'missing');
      assert.equal(withRef.state, 'parked');
      assert.equal(withRef.where, 'HEAD:tools/parked-only.sh');
    } finally { process.chdir(cwd); }
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('control 4: the hq/sibling split keys on the remote, and the two names share seven characters', () => {
  const roots = hostRoots(ROOT);
  if (!roots.length) return;                       // nothing on this box to split
  const byName = new Map(roots.map((r) => [r.name, r]));
  const hq = byName.get('alexandra-systems');
  const sib = byName.get('alexandria');
  if (!hq || !sib) return;                         // not the resident host
  assert.equal(hq.kind, 'hq');
  assert.equal(sib.kind, 'repo');
  // The trap this keys around: neither name is a prefix of the other, but they
  // agree for seven characters, and every cheap string test on them is wrong in
  // one direction or the other. Assert that both cheap tests WOULD have been.
  assert.ok('alexandria'.startsWith('alexandr') && 'alexandra-systems'.startsWith('alexandr'));
  assert.ok(hq.origin.endsWith('alexandra-systems.git'));
  assert.ok(!sib.origin.endsWith('alexandra-systems.git'));
  // and a root only counts when it can answer a tools/ path at all
  for (const r of roots) assert.ok(r.root && r.kind, `${r.root} has no kind`);
});

test('control: a basename hit is scoped to this repository`s own tools/, not to the host', () => {
  // The deliberate re-vendoring this state exists for, and the control is that
  // an HQ-only tool does NOT come back as vendored here.
  assert.equal(vendoredElsewhere('tools/merge-register.py', ROOT), 'tools/registers/merge-register.py');
  assert.equal(vendoredElsewhere('tools/autonomy.py', ROOT), null);
});

test('control: an unreadable input is distinguished from an input with no tool in it', () => {
  assert.equal(namesIn(join(ROOT, 'docs/standards/no-such-file.md')), null);
  const got = namesIn(join(ROOT, 'docs/standards/pm.md'));
  assert.ok(Array.isArray(got), 'a readable file returns an array');
  assert.ok(got.length > 0, 'pm.md names at least one tool');
});

test('live: the committed standards, measured 2026-11-09, asserted as floors', () => {
  for (const f of [...BINDING, ...CONTEXT]) {
    assert.ok(namesIn(join(ROOT, f)) !== null, `${f} is one of this tool's inputs and must be readable`);
  }
  const binding = new Set();
  for (const f of BINDING) for (const n of namesIn(join(ROOT, f)) || []) binding.add(n);
  const context = new Set();
  for (const f of CONTEXT) for (const n of namesIn(join(ROOT, f)) || []) context.add(n);
  // 15 and 43 on 2026-11-09. Floors, because lessons.md is re-vendored and
  // grows, and an equality here fails on the next sync for no defect.
  assert.ok(binding.size >= 15, `binding paths fell to ${binding.size}, was 15 on 2026-11-09`);
  assert.ok(context.size >= 40, `narrative paths fell to ${context.size}, was 43 on 2026-11-09`);
  // The finding this tool was written for, asserted so that it is noticed when
  // it is fixed rather than only when it breaks: pm.md's counted deadline names
  // a tool, and that tool is not in this repository.
  assert.ok(binding.has('tools/ship_first.py'),
    'pm.md no longer names ship_first.py; if the clause changed, this tool`s header is stale');
  const roots = hostRoots(ROOT);
  const got = classify('tools/ship_first.py', { selfRoot: ROOT, roots, ref: null });
  assert.ok(got.state !== 'present',
    'ship_first.py is in this repository now; drop the sibling-repo finding from the header');
});
