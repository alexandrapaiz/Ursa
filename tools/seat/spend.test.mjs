// node --test tools/seat/spend.test.mjs
//
// Five kinds of test, and the "control:" ones are the only ones that can fail
// for the right reason on their own.
//
// "exact:"   the two readings this tool shipped with, taken over 657 priced
//            Ursa runs on 2026-11-09T04:0xZ. Both are pinned as fixtures of the
//            aggregate shape rather than of the log text, because the log text
//            is the runner's to change and the arithmetic is this file's.
// "control:" a refused run and a run with no summary line both spend $0, and so
//            does a tool pointed at the wrong directory. Each claim here is
//            paired with the fixture that must NOT trip it. The audit's
//            negative control is the important one: a genuine price rise must
//            read as a price rise, or "mix artifact" becomes the only verdict
//            this file can return and the exit code stops carrying information.
// "shape:"   the denominator is three classes and they do not substitute for
//            each other. A day of refusals and a day of cheap runs have the
//            same total and are not the same fact.
// "bound:"   the tier vocabulary is closed, and a run's tier is decided by what
//            spent the most rather than by which model name matched first.
// "regress:" the defect this tool found in its own first output. 13 refused
//            runs on 2026-10-28 read as 13 priced runs at $0.00 each, which is
//            runner-facts' own rule about an output that cannot tell its abort
//            from its verdict, in the instrument written to cite it.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  parseRunLog, mainModel, tierOf, dayOfLogName,
  aggregate, modelledCostPerRun, decompose, simpsonAudit,
} from './spend.mjs';

// The two real summary-line shapes, trimmed to the fields this file reads.
// Verbatim keys, because the keys are the interface.
const PRICED = JSON.stringify({
  duration_ms: 1881000, num_turns: 165, total_cost_usd: 15.2865385,
  terminal_reason: 'completed', is_error: false,
  modelUsage: { 'claude-opus-5': { costUSD: 15.2865385, canonicalModel: 'claude-opus-5' } },
});
// A run the provider refused. Measured on ursa-exo's 2026-10-28T12-01-30-445Z
// log: a complete, well-formed summary that did no inference.
const REFUSED = JSON.stringify({
  num_turns: 1, total_cost_usd: 0, terminal_reason: 'api_error',
  is_error: true, subtype: 'success', modelUsage: {},
});

const run = (tier, turns, cost) => ({ priced: true, refused: false, tier, turns, cost });
const refusedRun = () => ({ priced: false, refused: true, tier: 'unknown', turns: 1, cost: 0 });
const noSummary = () => ({ priced: false, refused: false, tier: 'unknown', turns: 0, cost: 0 });

// ---------------------------------------------------------------------------
test('exact: the summary line parses into the four fields this file reads', () => {
  const r = parseRunLog(`some prose\n${PRICED}\n# exit=0 turns=165\n`);
  assert.equal(r.priced, true);
  assert.equal(r.refused, false);
  assert.equal(r.turns, 165);
  assert.equal(r.cost, 15.2865385);
  assert.equal(r.mainModel, 'claude-opus-5');
  assert.equal(tierOf(r.mainModel), 'premium');
});

test('exact: step one, the premium mix arriving, 2026-10-17 to 2026-10-18', () => {
  // 21 priced runs through 10-17, all standard at 49 turns and $0.033/turn.
  // 96 on 10-18: 48% premium at 90 turns and $0.081, standard at 53 and $0.035.
  const a = { priced: 21, costPerRun: 1.61, aggCostPerTurn: 0.033, byTier: {
    standard: { runs: 21, runShare: 1, turnShare: 1, turnsPerRun: 48.86, costPerTurn: 0.033 } } };
  const b = { priced: 96, costPerRun: 4.42, aggCostPerTurn: 0.063, byTier: {
    premium: { runs: 46, runShare: 0.479, turnShare: 0.619, turnsPerRun: 90.2, costPerTurn: 0.081 },
    standard: { runs: 50, runShare: 0.521, turnShare: 0.381, turnsPerRun: 53.4, costPerTurn: 0.035 } } };
  const d = decompose(a, b);
  assert.ok(d.attribution.mix > 0.9, `mix share ${d.attribution.mix}`);
  assert.deepEqual(d.arrived, ['premium']);
  // and the ordering caveat is not decorative: the step that says 96% mix is
  // the step that cannot see premium's turn growth, because there is none yet.
  assert.ok(Math.abs(d.reconstructed - 4.42) < 0.15, `reconstructed ${d.reconstructed}`);
});

test('exact: step two, 2026-10-18 to 2026-11-09, is turns per run and not price', () => {
  const a = { priced: 96, costPerRun: 4.42, aggCostPerTurn: 0.063, byTier: {
    premium: { runs: 46, runShare: 0.479, turnShare: 0.619, turnsPerRun: 90.2, costPerTurn: 0.081 },
    standard: { runs: 50, runShare: 0.521, turnShare: 0.381, turnsPerRun: 53.4, costPerTurn: 0.035 } } };
  const b = { priced: 38, costPerRun: 7.08, aggCostPerTurn: 0.071, byTier: {
    premium: { runs: 20, runShare: 0.526, turnShare: 0.651, turnsPerRun: 126.1, costPerTurn: 0.089 },
    standard: { runs: 18, runShare: 0.474, turnShare: 0.349, turnsPerRun: 69.9, costPerTurn: 0.035 } } };
  const d = decompose(a, b);
  assert.deepEqual(d.arrived, []);          // no tier arrives, so no caveat
  assert.ok(d.attribution.turns > d.attribution.mix, 'turns must beat mix here');
  assert.ok(d.attribution.turns > d.attribution.price, 'turns must beat price here');
  assert.ok(d.attribution.turns > 0.6 && d.attribution.turns < 0.8,
    `turns share ${d.attribution.turns}`);
});

// ---------------------------------------------------------------------------
test('control: a refused run is not a cheap run, and a cheap run is not refused', () => {
  const r = parseRunLog(REFUSED);
  assert.equal(r.priced, true, 'the summary line is well formed, which is the trap');
  assert.equal(r.refused, true, 'and the empty usage map is what gives it away');
  // the negative control: a genuinely cheap run has a model and must stay priced
  const cheap = parseRunLog(JSON.stringify({
    num_turns: 4, total_cost_usd: 0.04, modelUsage: { 'claude-sonnet-5': { costUSD: 0.04 } },
  }));
  assert.equal(cheap.refused, false);
  assert.equal(tierOf(cheap.mainModel), 'standard');
});

test('control: a log with no summary line is unpriced and never $0', () => {
  const r = parseRunLog('the run was killed before it could write a summary\n');
  assert.equal(r.priced, false);
  // the negative control: a log whose summary is the LAST of several wins
  const two = parseRunLog(`${JSON.stringify({ num_turns: 1, total_cost_usd: 0.5, modelUsage: { 'claude-sonnet-5': { costUSD: 0.5 } } })}
${JSON.stringify({ num_turns: 9, total_cost_usd: 9.5, modelUsage: { 'claude-opus-5': { costUSD: 9.5 } } })}`);
  assert.equal(two.cost, 9.5);
  assert.equal(two.turns, 9);
});

test('control: the audit does not trip when a price genuinely moved', () => {
  // same mix on both sides, premium price doubled. The verdict must be clean,
  // or "mix artifact" is the only answer this function can give.
  const mk = (pPrem, pStd) => aggregate([
    ...Array(5).fill(0).map(() => run('premium', 100, 100 * pPrem)),
    ...Array(5).fill(0).map(() => run('standard', 100, 100 * pStd)),
  ]);
  const clean = simpsonAudit(mk(0.08, 0.03), mk(0.16, 0.06));
  assert.equal(clean.tripped, false, 'a doubled price at a fixed mix is a price rise');
  assert.ok(Math.abs(clean.priceEffect) > Math.abs(clean.mixEffect));
  // the positive control: prices fixed, mix moves from all-standard to all-premium
  const a = aggregate(Array(10).fill(0).map(() => run('standard', 100, 3)));
  const b = aggregate([
    ...Array(9).fill(0).map(() => run('premium', 100, 8)),
    ...Array(1).fill(0).map(() => run('standard', 100, 3)),
  ]);
  const artifact = simpsonAudit(a, b);
  assert.equal(artifact.tripped, true, 'a pure mix shift must trip');
  assert.ok(Math.abs(artifact.mixEffect) > Math.abs(artifact.priceEffect));
});

test('control: a tiny change does not trip the audit however it is caused', () => {
  const a = aggregate(Array(10).fill(0).map(() => run('standard', 100, 3.00)));
  const b = aggregate(Array(10).fill(0).map(() => run('standard', 100, 3.09)));
  assert.equal(simpsonAudit(a, b).tripped, false, '3% is under the 10% threshold');
  assert.equal(simpsonAudit(a, b, 0.01).tripped, false, 'and it is a price move, not a mix move');
});

// ---------------------------------------------------------------------------
test('shape: three classes, and a day of refusals is not a day of bargains', () => {
  const refusals = aggregate([refusedRun(), refusedRun(), refusedRun()]);
  assert.equal(refusals.seen, 3);
  assert.equal(refusals.priced, 0);
  assert.equal(refusals.refused, 3);
  assert.equal(refusals.unpriced, 0);
  assert.equal(refusals.costPerRun, 0);
  assert.deepEqual(refusals.byTier, {}, 'no tier can be claimed by a run that did no inference');

  const mixed = aggregate([run('premium', 100, 9), refusedRun(), noSummary()]);
  assert.equal(mixed.priced, 1);
  assert.equal(mixed.refused, 1);
  assert.equal(mixed.unpriced, 1);
  assert.equal(mixed.costPerRun, 9, 'the $/run denominator is priced runs only');
  assert.equal(mixed.seen, 3, 'and the denominator is still printed beside it');
});

test('shape: cost per run is reconstructed exactly by the three factors', () => {
  const a = aggregate([
    ...Array(7).fill(0).map(() => run('premium', 120, 10.8)),
    ...Array(3).fill(0).map(() => run('standard', 60, 2.1)),
  ]);
  assert.ok(Math.abs(modelledCostPerRun(a) - a.costPerRun) < 1e-9,
    `${modelledCostPerRun(a)} vs ${a.costPerRun}`);
});

// ---------------------------------------------------------------------------
test('bound: the tier vocabulary is closed', () => {
  assert.equal(tierOf('claude-opus-5'), 'premium');
  assert.equal(tierOf('claude-sonnet-5'), 'standard');
  assert.equal(tierOf('claude-haiku-4-5-20251001'), 'standard');
  assert.equal(tierOf(''), 'unknown');
  assert.equal(tierOf(null), 'unknown');
  assert.equal(tierOf('some-future-model'), 'standard',
    'an unrecognised model is standard, because calling it premium overstates');
  for (const m of ['claude-opus-5', 'claude-sonnet-5', '', null, 'x']) {
    assert.ok(['premium', 'standard', 'unknown'].includes(tierOf(m)), `tierOf(${m})`);
  }
});

test('bound: a run is tiered by what spent the most, not by a name match', () => {
  // an opus run that dispatched one haiku subagent is an opus run
  assert.equal(mainModel({
    'claude-haiku-4-5-20251001': { costUSD: 0.02 },
    'claude-opus-5': { costUSD: 14.9 },
  }), 'claude-opus-5');
  // and a sonnet run with a trivial opus call is not a premium run
  assert.equal(tierOf(mainModel({
    'claude-opus-5': { costUSD: 0.01 },
    'claude-sonnet-5': { costUSD: 2.4 },
  })), 'standard');
  assert.equal(mainModel({}), null);
});

test('bound: the day comes off the log name and a name without one is skipped', () => {
  assert.equal(dayOfLogName('2026-11-09T03-09-20-306Z-message.log'), '2026-11-09');
  assert.equal(dayOfLogName('notes.log'), null);
});

// ---------------------------------------------------------------------------
test('regress: 2026-10-28 is thirteen refusals, not thirteen runs at $0.00', () => {
  // The first output of this tool printed `runs 13, unpriced 0, $/run 0.00` for
  // each of eight dark days, which read as the cheapest days this company ever
  // had. outage.mjs measured the same eight days as zero completed runs.
  const day = aggregate(Array(13).fill(0).map(() => refusedRun()));
  assert.equal(day.priced, 0, 'nothing on that day was priced');
  assert.equal(day.refused, 13);
  assert.equal(day.cost, 0);
  assert.equal(day.premiumShare, 0);
  // and the fact that makes it a regression test rather than an assertion: the
  // refused run's summary is well formed, so nothing but the empty usage map
  // distinguishes it.
  const parsed = parseRunLog(REFUSED);
  assert.equal(parsed.priced, true);
  assert.equal(parsed.turns, 1);
  assert.equal(parsed.cost, 0);
  assert.equal(parsed.refused, true);
});
