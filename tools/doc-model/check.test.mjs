// Tests for the documented-model drift gate.
//
// The load-bearing one is `the block-sum model is right about every body the
// house voice produces`. It is the reason this gate ships a generated corpus
// instead of reading the board: validating the wrong rule against real traffic
// passes, so a seat that checked it the obvious way would have confirmed it.
import { test } from 'node:test';
import { execFileSync } from 'node:child_process';
import assert from 'node:assert/strict';
import { MECHANISMS } from './models.mjs';
import { corpus, namedBodies, generatedBodies } from './corpus.mjs';
import { auditMechanism, normativeFiles, revSectionHasMark } from './check.mjs';
import { wakeCut } from '../board/check.mjs';

const L = 1500;
const MECH = MECHANISMS.find((m) => m.id === 'wake-cut');
const site = (quote) => MECH.sites.find((s) => s.quote && s.quote.startsWith(quote));
const delivered = (b) => wakeCut(b, L).length;

/** A mechanism with one site, for exercising a single check in isolation. */
function oneSite(over, mechOver = {}) {
  return {
    ...MECH, id: 'test-mech', probes: [/__never_matches_anything__/],
    sites: [{ ...MECH.sites[0], ...over }], ...mechOver,
  };
}

test('the corpus brackets the 60% floor on both sides', () => {
  const by = Object.fromEntries(namedBodies(L).map((b) => [b.name, b.body]));
  // Just inside the floor: the blank line is ignored and the cut falls through
  // to the last space, landing mid-block.
  const under = by['only-break-at-59pc'];
  assert.ok(under.slice(0, L).lastIndexOf('\n\n') < L * 0.6);
  assert.ok(delivered(under) > L * 0.9, 'a break under the floor must not be taken');
  // Just outside: the blank line is taken and the whole trailing block goes.
  const over = by['only-break-at-61pc'];
  assert.ok(over.slice(0, L).lastIndexOf('\n\n') > L * 0.6);
  assert.equal(delivered(over), over.slice(0, L).lastIndexOf('\n\n'));
});

test('the corpus is over the limit except for the two bodies that exist to guard the early return', () => {
  const atOrUnder = corpus(L).filter((b) => b.body.length <= L).map((b) => b.name);
  assert.deepEqual(atOrUnder, ['exactly-at-limit', 'one-under-limit'],
    'a body under the limit is delivered whole by every model ever written and proves nothing, '
    + 'so the only ones allowed are the named boundary cases');
});

test('the generated corpus is identical across runs', () => {
  assert.deepEqual(generatedBodies(200, L), generatedBodies(200, L));
  assert.ok(generatedBodies(200, L).length > 50, 'too few bodies survive the over-limit filter');
});

test("runner-facts' transcribed rule reproduces the reference on every body", () => {
  const s = site('retreats to the last');
  assert.equal(s.verdict, 'states');
  for (const b of corpus(L)) {
    assert.equal(s.model(b.body, L), delivered(b.body), `disagreed on ${b.name}`);
  }
});

test('the block-sum model is wrong, and wrong in the direction that makes an author split a whole note', () => {
  const s = site('the delivered figure is the largest cumulative');
  const body = namedBodies(L).find((b) => b.name === 'only-break-at-9pc').body;
  const said = s.model(body, L);
  const actual = delivered(body);
  assert.ok(said < actual, 'the error must under-predict');
  assert.ok(actual - said > 1000, `only ${actual - said} characters apart`);
});

test('the block-sum model is right about every body the house voice produces, which is why it was believed', () => {
  // "What the house voice produces" operationalised: short blocks, so the last
  // blank line inside the limit lands past the floor. Every such body takes the
  // block-boundary arm, which is the arm block-sum describes.
  const s = site('the delivered figure is the largest cumulative');
  const lateBreak = corpus(L).filter((b) => b.body.length > L
    && b.body.slice(0, L).lastIndexOf('\n\n') > L * 0.6);
  assert.ok(lateBreak.length > 20, 'not enough late-break bodies to make the point');
  // One exception, and it is a second drift rather than a flaw in this test.
  // §44 states a sum of block lengths and says nothing about trailing
  // whitespace; the host calls `rstrip()` after cutting. So where a block ends
  // in a whitespace run, the prose over-predicts by the length of that run.
  // Measured here rather than waved at, and the live board carries no body of
  // that shape, which is why it never surfaced either.
  const trimmed = lateBreak.filter((b) => /\s/.test(
    b.body[b.body.slice(0, L).lastIndexOf('\n\n') - 1]));
  for (const b of trimmed) {
    const off = s.model(b.body, L) - delivered(b.body);
    assert.ok(off > 0 && off < 10, `${b.name}: expected a small over-predict, got ${off}`);
  }
  assert.equal(trimmed.length, 1, 'the whitespace-run shape should be the one named body');
  for (const b of lateBreak.filter((x) => !trimmed.includes(x))) {
    assert.equal(s.model(b.body, L), delivered(b.body),
      `${b.name}: block-sum is supposed to be exact on the late-break arm`);
  }
  // And the early-break arm, which real traffic almost never contains, is where
  // it fails. Both halves together are the finding: the corpus decides whether
  // the check catches this, not the checker.
  const earlyBreak = corpus(L).filter((b) => b.body.slice(0, L).lastIndexOf('\n\n') <= L * 0.6);
  const wrong = earlyBreak.filter((b) => s.model(b.body, L) !== delivered(b.body));
  assert.ok(wrong.length > 10, `only ${wrong.length} early-break bodies disagree`);
});

test('every refuted claim in the registry still fails against the reference', async () => {
  for (const s of MECH.sites.filter((x) => x.verdict === 'refuted')) {
    const diffs = corpus(L).filter((b) => s.model(b.body, L) !== delivered(b.body));
    assert.ok(diffs.length > 0, `"${s.quote}" no longer disagrees with the reference`);
  }
});

test('the shipped registry has no errors for the seat that owns the files it can fix', async () => {
  const r = await auditMechanism(MECH);
  const errs = r.findings.filter((f) => f.severity === 'error');
  assert.deepEqual(errs.map((f) => `${f.code} ${f.site || ''}`), [],
    'the gate must be green on the branch that introduces it');
  // RESOLVED IN FAVOUR OF THE TRUNK, 2026-11-02, fifteenth message pass.
  // This seat's #716 carried its own repair of the same defect, reached
  // independently and with the same diagnosis: `candidates === sites +
  // unregistered.length`. The trunk's version below implies that equality and
  // adds two things it did not have, a `candidates >= sites` floor and a
  // per-finding check that each unregistered candidate names both its site and
  // its owning seat, so the branch's copy was dropped rather than merged. The
  // remediation the branch's message spelled out is still the remediation: an
  // unregistered candidate on a surface this seat can edit is fixed by
  // transcribing its rule into tools/doc-model/models.mjs, or by recording it
  // as `mentions-only` with the reason it states no rule.
  // This asserted `candidates === sites` until 2026-11-02, and it was red on
  // `main` from the hour it merged. Two sections of docs/agents/runner-facts.md
  // mention this mechanism and are not in the registry, so probe finds 16
  // candidates against 14 sites. That file belongs to the `exo` seat, and the
  // gate is deliberately built for exactly this: `mineToEdit` downgrades both
  // UNREGISTERED_SITE findings to `warn` and routes them to that seat by mail
  // instead of through an exit code. The assertion above honours that
  // ownership rule and this one did not, so the suite went red on prose no
  // seat reading it was permitted to edit. PWC-15 names that shape about the
  // ledger gate's exit 2: a check no branch can turn green is one every seat
  // learns to ignore.
  //
  // So assert what the gate actually guarantees, which is the property worth
  // having: no candidate is silently unaccounted for. Every one is either
  // registered, or carries a finding naming it. An unregistered section that
  // produced no finding at all is the defect this mechanism exists to catch.
  const accounted = new Set(r.findings.filter((f) => f.site).map((f) => f.site));
  assert.ok(
    r.checked.candidates >= r.checked.sites,
    `probe found ${r.checked.candidates} candidates against ${r.checked.sites} registered sites; `
    + 'a registered site that probe cannot find is SITE_MOVED and should have been caught above',
  );
  const unaccounted = r.checked.candidates - r.checked.sites;
  assert.equal(
    r.findings.filter((f) => f.code === 'UNREGISTERED_SITE').length,
    unaccounted,
    `${unaccounted} candidate(s) are not registered and the gate reported `
    + `${r.findings.filter((f) => f.code === 'UNREGISTERED_SITE').length} UNREGISTERED_SITE `
    + 'finding(s); each unregistered candidate must produce exactly one',
  );
  for (const f of r.findings.filter((f) => f.code === 'UNREGISTERED_SITE')) {
    assert.ok(accounted.has(f.site), `${f.site} is unregistered and names no site`);
    assert.ok(f.ownedBy, `${f.site} is unregistered and names no owning seat to route it to`);
  }
});

test('MODEL_DRIFT fires when a stated rule is wrong', async () => {
  const r = await auditMechanism(oneSite({
    verdict: 'states', quote: 'a rule that is wrong',
    model: (b, l) => Math.min(b.length, l),
  }));
  const f = r.findings.find((x) => x.code === 'MODEL_DRIFT');
  assert.ok(f, 'no MODEL_DRIFT');
  assert.match(f.detail, /off by [-+]\d+/);
});

test('CORRECTION_STALE fires when a refuted rule starts agreeing', async () => {
  const r = await auditMechanism(oneSite({
    verdict: 'refuted', quote: 'secretly correct', correctionMarks: undefined,
    model: (b, l) => wakeCut(b, l).length,
  }));
  assert.ok(r.findings.some((x) => x.code === 'CORRECTION_STALE'), 'no CORRECTION_STALE');
});

test('SITE_MOVED fires for a heading that is not there', async () => {
  const r = await auditMechanism(oneSite({ heading: '## a heading nobody wrote' }));
  const f = r.findings.find((x) => x.code === 'SITE_MOVED');
  assert.ok(f, 'no SITE_MOVED');
  // And the claim is not also reported as holding: an unmatched site is
  // unchecked, which must never read as a pass.
  assert.ok(!r.findings.some((x) => x.code === 'MODEL_DRIFT'));
});

test('SITE_MOVED fires for a file that is not there', async () => {
  const r = await auditMechanism(oneSite({ file: 'docs/agents/no-such-file.md' }));
  assert.ok(r.findings.some((x) => x.code === 'SITE_MOVED'), 'no SITE_MOVED');
});

test('UNREGISTERED_SITE fires for a normative section the registry does not account for', async () => {
  const r = await auditMechanism(oneSite({}, {
    // A probe that matches a section nobody registered.
    probes: [/largest cumulative paragraph sum/],
  }));
  const f = r.findings.find((x) => x.code === 'UNREGISTERED_SITE');
  assert.ok(f, 'no UNREGISTERED_SITE');
  assert.match(f.site, /^docs\/agents\/runner-facts\.md:\d+$/);
});

test('UNMARKED_REFUTATION distinguishes a correction in the section from one elsewhere in the file', async () => {
  // §44's correction, on exo's branch, must not clear §25 1,343 lines away.
  const s25 = MECH.sites.find((x) => x.heading.startsWith('## 25.'));
  const r = await auditMechanism({ ...MECH, id: 'test-mech', probes: [/__never__/], sites: [s25] });
  const f = r.findings.find((x) => x.code === 'UNMARKED_REFUTATION');
  assert.ok(f, 'a section-scoped lookup must not borrow another section\'s correction');
});

test('REFERENCE_MISSING is fatal and reports no doc findings', async () => {
  const r = await auditMechanism({ ...MECH, reference: { ...MECH.reference, export: 'notAThing' } });
  assert.equal(r.fatal, true);
  assert.deepEqual(r.findings.map((f) => f.code), ['REFERENCE_MISSING']);
});

test('a finding on another seat\'s surface is downgraded, and bites the seat that owns it', async () => {
  const bad = oneSite({ verdict: 'states', quote: 'wrong', model: (b, l) => Math.min(b.length, l) });
  const before = process.env.ASC_SEAT;
  try {
    process.env.ASC_SEAT = 'engineer';
    const mine = await auditMechanism(bad);
    const f1 = mine.findings.find((x) => x.code === 'MODEL_DRIFT');
    assert.equal(f1.severity, 'warn', 'runner-facts.md is not the engineer seat\'s to edit');
    assert.equal(f1.ownedBy, 'exo');

    process.env.ASC_SEAT = 'exo';
    const theirs = await auditMechanism(bad);
    const f2 = theirs.findings.find((x) => x.code === 'MODEL_DRIFT');
    assert.equal(f2.severity, 'error', 'the owning seat must not be let off');
    assert.equal(f2.downgradedFrom, undefined);
  } finally {
    if (before === undefined) delete process.env.ASC_SEAT; else process.env.ASC_SEAT = before;
  }
});

test('record surfaces are exempt and the registers are not', () => {
  const files = normativeFiles();
  assert.ok(files.includes('docs/agents/runner-facts.md'), 'the environment register must be held');
  assert.ok(files.includes('docs/ideas.md'), 'the ledger must be held');
  for (const rec of ['docs/agents/learning-log.md', 'docs/agents/incidents.md',
    'docs/agents/improvements.md', 'docs/decisions.md']) {
    assert.ok(!files.includes(rec), `${rec} is a dated record and must be exempt`);
  }
  assert.ok(!files.some((f) => f.startsWith('docs/runs/')), 'run docs are dated records');
  assert.ok(!files.some((f) => f.startsWith('docs/security/')), 'audits are dated records');
});

test('the correction lookup reads the named rev and is scoped to the section', (t) => {
  // Real revs on both sides of exo's correction landing, resolved rather than
  // pinned so a rewritten history skips instead of lying. The merge commit has
  // the correction under §44; its first parent is main just before it.
  let after;
  try {
    after = execFileSync('git', ['log', '--format=%H', '-1',
      '--grep', 'pull request #625', 'origin/main'], { encoding: 'utf8' }).trim();
  } catch { after = ''; }
  // `t.skip` and not `console.log` plus `return`. Measured on node 22.23.2:
  // a test that logs and returns is counted in `# pass`, so this branch used
  // to report a test that never ran as a passing one and leave `# skipped 0`
  // in the summary. Seats quote that summary to the board.
  if (!after) return t.skip("origin/main does not carry the merge of exo's correction");
  const before = execFileSync('git', ['rev-parse', `${after}^1`], { encoding: 'utf8' }).trim();
  const path = 'docs/agents/runner-facts.md';
  const s44 = MECH.sites.find((x) => x.heading.startsWith('## 44.'));
  const s25 = MECH.sites.find((x) => x.heading.startsWith('## 25.'));

  assert.equal(revSectionHasMark(after, path, s44.heading, s44.correctionMarks), true,
    'the correction is under §44 at that rev');
  assert.equal(revSectionHasMark(before, path, s44.heading, s44.correctionMarks), false,
    'and was not one commit earlier');
  // The scoping claim, which is the whole reason this is section-scoped: the
  // same mark is in the same file at the same rev, and must not clear §25.
  assert.equal(revSectionHasMark(after, path, s25.heading, s25.correctionMarks), false,
    '§25 must not borrow §44\'s correction from 1,343 lines away');
  // A rev that does not exist is false, never a throw.
  assert.equal(revSectionHasMark('refs/heads/no-such-branch', path, s44.heading,
    s44.correctionMarks), false);
});

test('a spent correctedIn pointer is reported rather than left to rot', async () => {
  const s44 = MECH.sites.find((x) => x.heading.startsWith('## 44.'));
  assert.equal(s44.correctedIn, undefined, 'the shipped registry carries no spent pointer');
  const r = await auditMechanism(oneSite({
    ...s44, correctedIn: 'ursa-exo/2026-11-02-message',
  }));
  assert.ok(r.findings.some((f) => f.code === 'POINTER_SPENT'), 'no POINTER_SPENT');
});

test('no section is registered twice, because two rows for one heading break the count above', () => {
  // Found 2026-11-09 by the security seat, from a real instance that cost a
  // red nobody could localise. Ursa's exo seat registered one `docs/ideas.md`
  // section at 10:20:45Z and this seat's run 15 registered the same section
  // fifteen minutes later, neither able to see the other. The two rows reached
  // one file from opposite sides of a merge, in different spellings at
  // different offsets, so git had no reason to report a conflict and kept
  // both.
  //
  // The damage is in the test above this one, not here. `registered` is a Set
  // keyed on `file:line`, so two rows resolving to the same line add 2 to
  // `sites` while consuming 1 candidate, and the equality between
  // UNREGISTERED_SITE findings and `candidates - sites` fails by exactly one.
  // `main` was green and the branch was green, and only their merge was red,
  // which is the hardest place to look. This case names the cause directly so
  // the next instance costs one line of output instead of a bisection.
  for (const mech of MECHANISMS) {
    const seen = new Map();
    for (const s of mech.sites) {
      if (!s.file || !s.heading) continue;
      const key = `${s.file}||${s.heading}`;
      seen.set(key, (seen.get(key) ?? 0) + 1);
    }
    const dupes = [...seen.entries()].filter(([, n]) => n > 1).map(([k, n]) => `${n}x ${k}`);
    assert.deepEqual(dupes, [],
      `mechanism \`${mech.id}\` registers the same section more than once. Keep one row and `
      + 'delete the rest; a duplicate makes the candidate accounting above fail by one per copy.');
  }
});
