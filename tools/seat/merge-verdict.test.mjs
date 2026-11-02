// node --test tools/seat/merge-verdict.test.mjs
//
// The cases that matter here cannot be produced on a live forge on demand: you
// cannot ask GitHub for a pull request whose verdict is four hours old and
// computed against a head the branch has since moved past. So the classifier
// is pure and graded against hand-built rows, and the live read is exercised
// only for the two properties a fixture cannot have — that the wire read
// parses, and that the charter's prose still cites this tool.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import {
  STATES, classify, remedyFor, ageMinutes, readWire, buildRows,
} from './merge-verdict.mjs';

const WIRE = 'a'.repeat(40);
const OLD = 'b'.repeat(40);
const HEAD = 'c'.repeat(40);
const PREV = 'd'.repeat(40);

test('a verdict against the current head and the wire tip is current', () => {
  assert.equal(classify({ headRefOid: HEAD, mergeHead: HEAD, mergeBase: WIRE, writtenAt: 1 }, WIRE),
               'current');
});

test('a verdict whose base is not the wire tip is trunk-moved, even when the API says MERGEABLE', () => {
  assert.equal(classify({ headRefOid: HEAD, mergeHead: HEAD, mergeBase: OLD, writtenAt: 1 }, WIRE),
               'trunk-moved');
});

test('a verdict computed at an earlier head is head-moved, and head-moved outranks trunk-moved', () => {
  // Both faults at once: the head moved AND the base is stale. The head fault
  // is reported because it is the one no API field discloses — headRefOid is
  // current and says nothing about the head the verdict used.
  assert.equal(classify({ headRefOid: HEAD, mergeHead: PREV, mergeBase: OLD, writtenAt: 1 }, WIRE),
               'head-moved');
  assert.ok(STATES.indexOf('head-moved') < STATES.indexOf('trunk-moved'));
});

test('a missing instant is undated and is never given an age', () => {
  for (const missing of [{ writtenAt: null }, { mergeHead: null }, { mergeBase: null }]) {
    const row = { headRefOid: HEAD, mergeHead: HEAD, mergeBase: WIRE, writtenAt: 1, ...missing };
    assert.equal(classify(row, WIRE), 'undated');
  }
  // The engineer seat's rule, as a refusal rather than a back-fill: an age
  // invented from the fields that ARE present is the defect, not the gap.
  assert.equal(ageMinutes(null, 1_000_000), null);
  assert.equal(ageMinutes(0, 1_000_000), null);
});

test('ageMinutes is whole minutes from a stated instant, not from "now"', () => {
  assert.equal(ageMinutes(1_000_000, 1_000_000 + 59), 0);
  assert.equal(ageMinutes(1_000_000, 1_000_000 + 60), 1);
  assert.equal(ageMinutes(1_000_000, 1_000_000 + 19_920), 332); // the oldest live verdict, 2026-11-02
});

test('trunk-moved is an instruction only when the verdict is CONFLICTING', () => {
  // The correction this function exists for. Keying the remedy on the state
  // alone told the holder of a MERGEABLE trunk-moved row to go and merge main,
  // which is work for no reason.
  assert.match(remedyFor('trunk-moved', 'CONFLICTING'), /merge --no-edit origin\/main/);
  assert.doesNotMatch(remedyFor('trunk-moved', 'MERGEABLE'), /merge --no-edit/);
  assert.match(remedyFor('trunk-moved', 'MERGEABLE'), /do not quote it as current/);
});

test('a CONFLICTING verdict that IS current is the only one that means work', () => {
  assert.match(remedyFor('current', 'CONFLICTING'), /This one is work/);
  assert.match(remedyFor('current', 'MERGEABLE'), /quote it, with the age/);
});

test('undated says it could not measure rather than guessing', () => {
  assert.match(remedyFor('undated', 'MERGEABLE'), /could not measure/);
});

test('buildRows joins by number and carries the API verdict into the remedy', () => {
  const prs = [
    { number: 1, mergeable: 'MERGEABLE', headRefOid: HEAD, baseRefOid: WIRE },
    { number: 2, mergeable: 'CONFLICTING', headRefOid: HEAD, baseRefOid: OLD },
    { number: 3, mergeable: 'UNKNOWN', headRefOid: HEAD, baseRefOid: OLD },
  ];
  const refs = new Map([
    [1, { mergeHead: HEAD, mergeBase: WIRE, writtenAt: 1_000_000 }],
    [2, { mergeHead: HEAD, mergeBase: OLD, writtenAt: 1_000_000 - 3600 }],
    // 3 is absent from the map entirely, which is the shape of a pull request
    // the remote advertises no merge ref for.
  ]);
  const rows = buildRows(prs, refs, WIRE, 1_000_000 + 60);
  assert.deepEqual(rows.map((r) => r.state), ['current', 'trunk-moved', 'undated']);
  assert.deepEqual(rows.map((r) => r.age_minutes), [1, 61, null]);
  assert.match(rows[1].remedy, /merge --no-edit origin\/main/);
});

test('readWire takes its right-hand operand off the wire and reports being behind', () => {
  // The whole defect this tool replaces, as a test: the old guard compared two
  // refs from ONE fetch generation, so a behind clone made them agree and the
  // guard reported health in the one case it existed to catch.
  const fake = (cmd, args) => {
    if (args[0] === 'ls-remote') return { status: 0, stdout: `${WIRE}\trefs/heads/main\n` };
    return { status: 0, stdout: `${OLD}\n` };
  };
  const r = readWire(fake);
  assert.equal(r.wire, WIRE);
  assert.equal(r.localOid, OLD);
  assert.equal(r.behind, true);

  const agreed = readWire((cmd, args) =>
    args[0] === 'ls-remote'
      ? { status: 0, stdout: `${WIRE}\trefs/heads/main\n` }
      : { status: 0, stdout: `${WIRE}\n` });
  assert.equal(agreed.behind, false);
});

test('readWire refuses unparseable output instead of returning a short OID', () => {
  const r = readWire(() => ({ status: 0, stdout: 'fatal: nope\n' }));
  assert.ok(r.error, 'an unparseable wire read must be an error, never a value');
});

test('readWire reports the error rather than falling back to a local ref', () => {
  const r = readWire(() => ({ status: 128, stderr: 'could not read Username' }));
  assert.ok(r.error);
  assert.equal(r.wire, undefined);
});

test('--from replays a fixture and the count line prints even when nothing is stale', () => {
  const fx = {
    wire: WIRE, now: 1_000_060,
    prs: [{ number: 1, mergeable: 'MERGEABLE', headRefOid: HEAD, baseRefOid: WIRE,
            mergeHead: HEAD, mergeBase: WIRE, writtenAt: 1_000_000 }],
  };
  const path = `${process.env.TMPDIR || '/tmp'}/merge-verdict-fixture.json`;
  execFileSync('node', ['-e',
    `require('fs').writeFileSync(${JSON.stringify(path)}, ${JSON.stringify(JSON.stringify(fx))})`]);
  const out = execFileSync('node',
    ['tools/seat/merge-verdict.mjs', '--from', path, '--only-stale'], { encoding: 'utf8' });
  // An absence carries its own positive control: own-prs.mjs, defect 2.
  assert.match(out, /open=1 shown=0/);
  assert.match(out, /current=1/);
});

test('--max-age-minutes fails on a stale verdict and passes on a fresh one', () => {
  const mk = (writtenAt) => ({
    wire: WIRE, now: 1_000_000,
    prs: [{ number: 1, mergeable: 'MERGEABLE', headRefOid: HEAD, baseRefOid: WIRE,
            mergeHead: HEAD, mergeBase: WIRE, writtenAt }],
  });
  const run = (fx) => {
    const path = `${process.env.TMPDIR || '/tmp'}/merge-verdict-age.json`;
    execFileSync('node', ['-e',
      `require('fs').writeFileSync(${JSON.stringify(path)}, ${JSON.stringify(JSON.stringify(fx))})`]);
    try {
      execFileSync('node', ['tools/seat/merge-verdict.mjs', '--from', path,
                            '--max-age-minutes', '30'], { encoding: 'utf8', stdio: 'pipe' });
      return 0;
    } catch (e) { return e.status; }
  };
  assert.equal(run(mk(1_000_000 - 600)), 0, '10 minutes old must pass a 30-minute gate');
  assert.equal(run(mk(1_000_000 - 7200)), 1, '2 hours old must fail a 30-minute gate');
});

test('the charter cites this tool rather than re-deriving the comparison in prose', () => {
  // The binding own-prs.test.mjs established for branch patterns, applied to
  // the thing that actually went wrong: a guard written as prose three thousand
  // lines from the state it describes. If a window rewrites the guard by hand,
  // this fails.
  const charter = readFileSync('prompts/exo-agent.md', 'utf8');
  assert.match(charter, /tools\/seat\/merge-verdict\.mjs/,
               'the exo charter must cite the tool at the place it used to spell the comparison');
  assert.doesNotMatch(charter, /baseRefOid`? against `git rev-parse origin\/main/,
               'the charter must not still prescribe comparing two refs from one fetch generation');
});

test('a contained row owes a closure, not a forward merge', () => {
  // Ursa's skill seat's correction, measured rather than argued: of ten refused
  // rows that night, SEVEN were contained in a clean open sibling and only
  // three genuinely needed the merge. This seat had prescribed the merge to all
  // ten. The merge clears the gate's field, leaves the row open, and takes the
  // containment check from passing to failing.
  const contained = remedyFor('trunk-moved', 'CONFLICTING', 673);
  assert.match(contained, /CLOSURE, not a forward merge/);
  assert.doesNotMatch(contained, /git merge --no-edit/);
  assert.match(contained, /#673/, 'the remedy must name the container, so the closure can cite it');

  // And the uncontained row still gets the merge, because three of the ten did
  // need it. Taking a correction too far is the other way to be wrong here.
  assert.match(remedyFor('trunk-moved', 'CONFLICTING', null), /git merge --no-edit origin\/main/);
});

test('containment outranks every other state, including undated', () => {
  // A contained row's disposition does not depend on whether its verdict could
  // be dated: it is closed either way, so the containment answer comes first.
  for (const s of STATES) {
    assert.match(remedyFor(s, 'CONFLICTING', 601), /CLOSURE/,
                 `state ${s} must still owe a closure when contained`);
  }
});

test('buildRows carries contained_in through to the remedy', () => {
  const rows = buildRows(
    [{ number: 1, mergeable: 'CONFLICTING', headRefOid: HEAD, baseRefOid: OLD }],
    new Map([[1, { mergeHead: HEAD, mergeBase: OLD, writtenAt: 1_000_000 }]]),
    WIRE, 1_000_060, new Map([[1, 2]]),
  );
  assert.equal(rows[0].contained_in, 2);
  assert.match(rows[0].remedy, /contained in #2/);
});

// The lane beside the number, added 2026-11-02 on Ursa's skill seat's
// measurement: 45 closure pointers in this repository resolve to 28 distinct
// rows and 20 of those were closed without merging, so a cited container is
// correct when printed and stale one run later. The number is a row and the
// branch is a lane; only the second one a reader can walk forward.
test('lane: a contained row carries its container\'s branch, not only its number', () => {
  const prs = [
    { number: 10, headRefName: 'ursa-exo/old', mergeable: 'MERGEABLE', headRefOid: 'a', baseRefOid: 'b', isDraft: false, title: 'old' },
    { number: 20, headRefName: 'ursa-exo/tip', mergeable: 'MERGEABLE', headRefOid: 'c', baseRefOid: 'b', isDraft: false, title: 'tip' },
  ];
  const rows = buildRows(prs, new Map(), 'b', 0, new Map([[10, 20], [20, null]]));
  const old = rows.find((r) => r.number === 10);
  const tip = rows.find((r) => r.number === 20);
  assert.equal(old.contained_in, 20);
  assert.equal(old.contained_in_branch, 'ursa-exo/tip');
  assert.equal(tip.contained_in, null);
  assert.equal(tip.contained_in_branch, null);
});

test('lane: a container the forge did not return reads as unknown, not as absent', () => {
  // The containment map is computed from local refs and the forge list is a
  // separate read, so the two can disagree. A missing row must not silently
  // print `-`, which is the same string an uncontained row prints.
  const prs = [{ number: 10, headRefName: 'ursa-exo/old', mergeable: 'MERGEABLE', headRefOid: 'a', baseRefOid: 'b', isDraft: false, title: 'old' }];
  const rows = buildRows(prs, new Map(), 'b', 0, new Map([[10, 99]]));
  assert.equal(rows[0].contained_in, 99);
  assert.equal(rows[0].contained_in_branch, null);
});
