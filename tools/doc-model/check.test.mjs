// Tests for the documented-model drift gate.
//
// The load-bearing one is `the block-sum model is right about every body the
// house voice produces`. It is the reason this gate ships a generated corpus
// instead of reading the board: validating the wrong rule against real traffic
// passes, so a seat that checked it the obvious way would have confirmed it.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MECHANISMS } from './models.mjs';
import { corpus, namedBodies, generatedBodies } from './corpus.mjs';
import { auditMechanism, normativeFiles } from './check.mjs';
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
  assert.equal(r.checked.candidates, r.checked.sites,
    'every candidate found by probe must be a registered site, and vice versa');
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
