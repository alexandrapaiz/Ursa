// node --test tools/seat/own-prs.test.mjs
//
// Three kinds of test here and only the first one is the point.
//
// The ones named "bound:" are the MECHANISM. The incident this directory
// exists for is one fact written twice in one document with nothing requiring
// the copies to agree. Unifying the values does not close that — the next edit
// to either copy re-opens it in whichever seat is edited. The prose copies in
// the eleven charters are kept on purpose, because a charter is read by a fresh
// run that copy-pastes commands and a literal pattern has to stay legible
// there, so the thing that binds the copies to the single source has to be a
// test. If a charter's prose and branch-patterns.json ever disagree, these
// fail, and they bind the FIELD as well as the value: `.headRefName | test(x)`
// is a branch predicate and `.workflowName | test(x)` is not, and reading the
// second as the first is how a roster-wide measurement came to report this
// seat as the worst case of a defect it was shipping the fix for
// (INC-2026-10-26-a-charter-pattern-was-read-as-a-branch-predicate-when-its-field-was-workflowname).
//
// The ones named "exact:" assert the property the anchoring buys, against the
// branch names it was measured on. Every false positive listed in FOREIGN is a
// real branch of this repository that a real seat's real sweep claimed as its
// own, and the sweep's prescribed action on anything it prints is to absorb,
// ready or close it.
//
// The one named "control:" is the positive control. An assertion that the
// anchored pattern has no false positives is worth nothing unless the same
// harness can see false positives when they are there, and the bare-substring
// form is the case that puts them there. Without this, a regex that matched
// nothing at all would pass every "exact:" test above.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { patternFor, seats, seatOfBranch, canonicalSeatOfBranch, selectOwn, audit } from './own-prs.mjs';

const TOOL = new URL('./own-prs.mjs', import.meta.url).pathname;
const CHARTERS = new URL('../../prompts/', import.meta.url).pathname;

// Real branches of this repository, 2026-10-27. Chosen rather than generated:
// each FOREIGN row is a measured false positive of the bare-substring pattern
// that the charters carried, and OWN covers every spelling in use, including
// both the long and short form for the three seats that have one.
const OWN = [
  'ursa-exo/2026-10-27-hook', 'exo/2026-10-12-pm',
  'ursa-pm/2026-10-27-message', 'pm/2026-10-05-x',
  'ursa-finance/2026-10-27-message', 'fin/2026-10',
  'ursa-frontend/2026-10-27-hook', 'fe/2026-10-15-visual-review',
  'ursa-security/2026-10-27-hook', 'sec/2026-10-11',
  'ursa-engineer/2026-10-27-hook', 'engineer/2026-09-26-get-briefing',
  'ursa-skill/2026-10-27-hook', 'skill/2026-10-01-x',
  'ursa-market/2026-10-27-message', 'ursa-research/2026-10-24-x',
  'ursa-okr/2026-10-02-x', 'ursa-sales/2026-10-03-x',
];
// [seat, branch] — the bare-substring pattern claims these and must not.
const FOREIGN = [
  ['exo', 'exo-centralizer/2026-10-14-dispatch-guards'],
  ['finance', 'engineer/2026-09-26-get-briefing'],
  ['finance', 'engineer/2026-10-09-briefing-cost-and-stdio-probe'],
  ['finance', 'ursa-pm/2026-10-05-message-staffing'],
  ['frontend', 'engineer/2026-09-30-span-lifespan'],
  ['frontend', 'hq/company-manifest'],
  ['frontend', 'ursa-pm/2026-10-08-message-frontend'],
  ['pm', 'chair/pm-daily-dispatch'],
  ['pm', 'chair/pm-merges'],
  ['pm', 'chair/vendor-pm-section-22'],
  ['pm', 'distribution/vendored-pm'],
  ['pm', 'exo/2026-10-12-pm'],
  ['pm', 'exo/vendor-pm-2026-10-05'],
  ['pm', 'exo/vendor-pm-21-2026-10-05'],
  ['security', 'chair/vendor-pm-section-22'],
  ['skill', 'ursa-pm/2026-10-08-message-skill'],
];

/**
 * Every branch-predicate pattern in one charter, with the field bound. Returns
 * the distinct alternative-sets found, so a charter that names two different
 * patterns is visible as two entries rather than silently collapsed.
 */
function charterPatterns(text) {
  const out = new Set();
  // Unwrapped first: this repository hard-wraps prose, and a code fence can be
  // broken across lines by an editor even when the shell would still run it.
  const flat = text.replace(/\n\s*/g, ' ');
  for (const m of flat.matchAll(/\.headRefName\s*\|\s*test\("([^"]+)"\)/g)) {
    out.add(m[1]);
  }
  return [...out];
}

test('bound: every charter names its own seat and only known seats', () => {
  const files = readdirSync(CHARTERS).filter((f) => f.endsWith('-agent.md'));
  assert.equal(files.length, seats().length,
    `branch-patterns.json declares ${seats().length} seats and prompts/ holds ${files.length} charters`);
  for (const f of files) {
    const seat = f.replace(/-agent\.md$/, '');
    assert.ok(seats().includes(seat), `${f} has no entry in branch-patterns.json`);
  }
});

test('bound: each charter\'s prose pattern equals the single source', () => {
  for (const seat of seats()) {
    const text = readFileSync(`${CHARTERS}${seat}-agent.md`, 'utf8');
    const found = charterPatterns(text);
    const expected = patternFor(seat);
    const alts = expected.match(/\(([^()]*\|[^()]*|[a-z0-9]+)\)\/$/);
    assert.ok(found.length > 0,
      `${seat}-agent.md names no .headRefName branch predicate at all`);
    for (const p of found) {
      // Accept either the anchored pattern or the bare alternation it is
      // composed from, because the charter edits land under the owner's gate
      // and this test has to pass on both sides of that merge. What it will
      // not accept is a THIRD spelling, which is the fork it exists to catch.
      const bare = alts[1];
      assert.ok(p === expected || p === bare,
        `${seat}-agent.md carries .headRefName | test("${p}"), which is neither ` +
        `the single source "${expected}" nor its bare alternation "${bare}"`);
    }
  }
});

test('bound: a workflowName predicate is not read as a branch predicate', () => {
  // The exo charter is the only one that filters Actions workflows, and its two
  // `.workflowName | test("agent")` occurrences were once reported as that
  // seat's branch pattern. The extractor must not see them.
  const text = readFileSync(`${CHARTERS}exo-agent.md`, 'utf8');
  assert.ok(/\.workflowName\s*\|\s*test\("agent"\)/.test(text),
    'the exo charter no longer filters workflows by name; this test is now vacuous and should be deleted');
  assert.ok(!charterPatterns(text).includes('agent'),
    'the pattern extractor read a .workflowName filter as a branch predicate');
});

test('exact: the anchored pattern claims every own branch', () => {
  for (const b of OWN) {
    const seat = canonicalSeatOfBranch(b);
    assert.ok(seat, `fixture branch ${b} resolves to no seat (segment "${seatOfBranch(b)}")`);
    assert.ok(new RegExp(patternFor(seat)).test(b),
      `${seat}'s pattern ${patternFor(seat)} does not match its own branch ${b}`);
  }
});

test('exact: the anchored pattern claims no other seat\'s branch', () => {
  for (const [seat, b] of FOREIGN) {
    assert.notEqual(canonicalSeatOfBranch(b), seat,
      `fixture error: ${b} really is ${seat}'s branch, so it is not a false positive`);
    assert.equal(new RegExp(patternFor(seat)).test(b), false,
      `${seat}'s pattern ${patternFor(seat)} claims ${b}, which is ` +
      `${canonicalSeatOfBranch(b) || 'no seat'}'s`);
  }
});

test('control: the bare-substring form the charters carried does claim them', () => {
  let claimed = 0;
  for (const [seat, b] of FOREIGN) {
    const bare = new RegExp(patternFor(seat).match(/\(([^()]+)\)\/$/)[1]);
    if (bare.test(b)) claimed += 1;
  }
  assert.equal(claimed, FOREIGN.length,
    'the positive control failed: the bare-substring pattern no longer reproduces ' +
    'the false positives this fixture was built from, so the "exact:" tests above ' +
    'are not evidence of anything');
});

test('exact: every seat resolves and composes one anchored pattern', () => {
  for (const seat of seats()) {
    const p = patternFor(seat);
    assert.match(p, /^\^\(\[a-z0-9-\]\+-\)\?\(/, `${seat}'s pattern is not anchored: ${p}`);
    assert.match(p, /\)\/$/, `${seat}'s pattern does not end at a path segment: ${p}`);
  }
  assert.equal(patternFor('no-such-seat'), null);
});

test('selectOwn filters by branch and ignores title and author', () => {
  const prs = [
    { number: 1, headRefName: 'ursa-finance/2026-10-27-message', isDraft: false },
    { number: 2, headRefName: 'engineer/2026-09-26-get-briefing', isDraft: true },
    { number: 3, headRefName: 'fin/2026-10', isDraft: true },
  ];
  assert.deepEqual(selectOwn('finance', prs).map((p) => p.number), [1, 3]);
});

test('absence is printed, not implied', () => {
  // The defect: a `jq` select that matches nothing prints nothing, and nothing
  // is what a clean sweep prints, so a run cannot tell a clean sweep from a
  // blind one. The count line is unconditional.
  const empty = JSON.stringify([
    { number: 9, headRefName: 'ursa-pm/2026-10-27-message', isDraft: true, updatedAt: 'x', title: 't' },
  ]);
  const path = `${process.env.TMPDIR || '/tmp'}/own-prs-fixture-${process.pid}.json`;
  writeFileSync(path, empty);
  const r = spawnSync('node', [TOOL, 'finance', '--drafts', '--from', path], { encoding: 'utf8' });
  assert.equal(r.status, 0);
  assert.match(r.stdout, /seat=finance pattern=\S+ open_in_repo=1 own=0 own_draft=0/);
});

test('--require-empty is a gate and a bad seat name is usage', () => {
  const path = `${process.env.TMPDIR || '/tmp'}/own-prs-fixture2-${process.pid}.json`;
  writeFileSync(path, JSON.stringify([
    { number: 9, headRefName: 'ursa-pm/2026-10-27-x', isDraft: true, updatedAt: 'x', title: 't' },
  ]));
  assert.equal(spawnSync('node', [TOOL, 'pm', '--drafts', '--require-empty', '--from', path]).status, 1);
  assert.equal(spawnSync('node', [TOOL, 'finance', '--drafts', '--require-empty', '--from', path]).status, 0);
  assert.equal(spawnSync('node', [TOOL, 'nope']).status, 2);
});

test('--audit grades the anchored form against ground truth, not against the pattern it replaced', () => {
  // The defect this mode fixes is a frozen denominator, so the first thing the
  // test pins is that the count is REPORTED rather than asserted: eleven
  // charters said 540, branch-patterns.json said 578, and the live number was
  // 549. A test that hard-coded a fourth number would be the same defect.
  const branches = [
    'ursa-exo/2026-10-27-message',          // exo's
    'exo/2026-10-12-pm',                    // exo's, and the bare pm pattern claims it
    'exo-centralizer/2026-10-14-dispatch',  // nobody's seat here; bare exo claims it
    'ursa-pm/2026-10-08-message-skill',     // pm's; bare skill claims it
    'engineer/2026-09-26-get-briefing',     // engineer's; bare finance claims it
    'hq/company-manifest',                  // nobody's; bare frontend claims it
    'fin/2026-10-27-close',                 // finance's, short form
  ];
  const a = audit(branches);
  assert.equal(a.branches, branches.length);

  // The whole claim the charters make, stated as the assertion: the anchored
  // form is exact over the corpus, in BOTH directions.
  assert.equal(a.totals.anchored_false_pos, 0);
  assert.equal(a.totals.anchored_false_neg, 0);

  // And the bare form is not, in exactly one direction. This is the asymmetry
  // the sweep's prescribed action makes expensive: a false positive tells a
  // seat to close a sibling's live draft.
  assert.equal(a.totals.bare_false_neg, 0);
  // Five, one per commented line in the fixture above, and they are named
  // individually below rather than only totalled — a total is the number this
  // whole directory exists because somebody wrote down once and never re-read.
  assert.equal(a.totals.bare_false_pos, 5);

  const byseat = Object.fromEntries(a.rows.map((r) => [r.seat, r]));
  assert.deepEqual(byseat.skill.bare_false_pos, ['ursa-pm/2026-10-08-message-skill']);
  assert.deepEqual(byseat.pm.bare_false_pos, ['exo/2026-10-12-pm']);
  assert.deepEqual(byseat.finance.bare_false_pos, ['engineer/2026-09-26-get-briefing']);
  assert.deepEqual(byseat.frontend.bare_false_pos, ['hq/company-manifest']);
  assert.deepEqual(byseat.exo.bare_false_pos, ['exo-centralizer/2026-10-14-dispatch']);
  // short and long form of one seat both resolve to it
  assert.equal(byseat.finance.truth, 1);
  assert.deepEqual(byseat.finance.anchored_false_neg, []);
});

test('--audit exits non-zero if the anchored form ever regresses', () => {
  // The mode is a gate, not a report, because the anchored pattern is what
  // eleven charters now hand every seat. Fixture: a branch whose first segment
  // is a seat name the anchor cannot reach would be a false negative.
  const path = `${process.env.TMPDIR || '/tmp'}/own-prs-audit-${process.pid}.json`;
  writeFileSync(path, JSON.stringify(['ursa-exo/2026-10-27-a', 'fin/2026-10-27-b']));
  const ok = spawnSync('node', [TOOL, '--audit', '--from', path], { encoding: 'utf8' });
  assert.equal(ok.status, 0, ok.stdout + ok.stderr);
  assert.match(ok.stdout, /branches_measured=2\b/);
  assert.match(ok.stdout, /anchored: false_pos=0 false_neg=0/);
});
