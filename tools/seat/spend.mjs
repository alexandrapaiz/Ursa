#!/usr/bin/env node
// spend.mjs — what the week's inference allowance bought, and which of three
// factors moved. The companion to outage.mjs: that one answers whether there
// were runs, this one answers what the runs cost and why the cost is growing.
//
//     node tools/seat/spend.mjs                      # Ursa, 14 days: the table
//     node tools/seat/spend.mjs --days 30
//     node tools/seat/spend.mjs --company alexandria
//     node tools/seat/spend.mjs --portfolio           # company shares per day
//     node tools/seat/spend.mjs --seats               # per seat, newest day
//     node tools/seat/spend.mjs --seats --day 2026-11-09
//     node tools/seat/spend.mjs --decompose 2026-10-18,2026-11-09
//     node tools/seat/spend.mjs --decompose ..2026-10-17,2026-10-18
//                                                     # `..day` is that day and
//                                                     # every day before it
//     node tools/seat/spend.mjs --audit               # exit 1 if an aggregate
//                                                     # $/turn would mislead
//     node tools/seat/spend.mjs --json
//
// Exit 0 the read succeeded and (under --audit) no mix artifact is live.
// Exit 1 --audit and the aggregate $/turn is mix-driven, so do not publish it.
// Exit 2 usage. Exit 3 the question cannot be answered from here — the log root
// is absent, or no run in the window carries a priced summary. Three is never
// zero, for the same reason it is never zero in outage.mjs: a day on which every
// run was refused spends nothing, and so does a day on which this tool was
// pointed at the wrong path. Both print $0 and only one of them is a fact.
//
// READ-ONLY. It opens files under the host's run-log root and makes one GET to
// GET /api/agents for the seat-to-directory mapping. It writes nothing.
//
// WHY THIS EXISTS.
//
// HQ's exo-centralizer sent this seat one sentence on 2026-11-09T03:42:59Z:
// "Each host run log carries the provider's own cost for that run and has since
// September, and nothing in the repository had ever read the field." Measured in
// this repository the same hour: `grep -rl 'total_cost_usd\|costUSD'` over the
// whole tree returned zero files. Every capacity surface this company owns
// counts refusals, which is a post-mortem, so no seat could ask what the work
// in front of it would cost until after the wall.
//
// The field is `modelUsage.<model>.costUSD` and `total_cost_usd` on the one JSON
// summary line each run log ends with, beside `num_turns` and `terminal_reason`.
//
// WHAT THE FIRST READ SAID, over 657 priced Ursa runs, taken 2026-11-09T04:0xZ:
//
//     mean $/run      2026-10-17 and earlier   $1.61   (21 runs, 0% premium)
//                     2026-10-18               $4.42   (96 runs, 48% premium)
//                     2026-11-09               $7.08   (38 runs, 53% premium)
//
// Two steps with two different owners, and the charter can only reach one.
//
//   1. 10-17 to 10-18 is 2.74x and it is the premium mix arriving: 0% to 48% of
//      runs on opus. That is the host's manifest (GET /api/agents `model`), not
//      a seat's behaviour, and no charter edit moves it.
//   2. 10-18 to 11-09 is 1.60x at a near-flat mix, 48% to 53%. Decomposed:
//      turns per run 69%, $/turn 22%, mix 10%. Turns per run went 90 to 126 on
//      premium and 53 to 70 on standard. Only 8.8% of those runs ended at their
//      turn cap, and no seat's median is within 90% of its own ceiling, so the
//      growth is behavioural rather than cap-bound — which makes it the one
//      factor this charter owns.
//
// AND THE ORDERING IS LOAD-BEARING, which is why --decompose prints a caveat.
// Run as a single window, ..2026-10-17 to 2026-11-09, the same arithmetic reads
// 4.39x with 93% charged to the mix, because a tier absent from the baseline
// arrives already at its destination turn count and its turn growth has nowhere
// else to go. The two-step read above is the one to quote. Splitting at the day
// the tier arrived is not a presentational choice; it is the only split that
// lets the two factors be seen separately.
//
// AND THE REASON --audit EXISTS, which is the finding underneath the finding.
//
// Read in aggregate, Ursa's cost per turn doubled over that month: $0.033 to
// $0.071. Held per model it barely moved — standard $0.033 to $0.035, premium
// $0.081 to $0.089. The aggregate is Simpson's paradox: a mix shift
// wearing a price rise's clothes. A seat reporting the aggregate would route a
// finding about model routing to whoever owns caching, and both numbers are
// real, so nothing in the arithmetic announces the swap.
//
// So this file never prints an aggregate $/turn without the per-model columns
// beside it, and --audit decides the question rather than leaving it to the
// reader: it splits the aggregate change into a price effect (B's prices at A's
// turn mix) and a mix effect (the remainder), and exits 1 when the mix effect is
// the larger. That is this repository's own rule about an algorithm rather than
// a prose instruction, pointed at the one number this instrument can be misread
// through.
//
// WHAT IT CANNOT TELL YOU. The logs are the host's, not the forge's, so a run
// that never reached the host leaves nothing here; use outage.mjs for that. The
// prices are the provider's list basis (`costBasis":"list"`), not an invoice.
// And a log whose summary line is missing — 304 of 3,327 on the day this
// shipped, mostly runs killed before they could write one — is counted as
// `unpriced` and never as $0, which is why every table prints its denominator
// before its rows. The third class, `refused`, is 900 of the same 3,327 and is
// the one this tool got wrong first: see the regress test in the sibling file.
//
// ONE MORE NUMBER, because nothing else in this repository reports it. 76 of
// those 657 priced Ursa runs (11.6%) ended `api_error` after doing paid
// inference. A refused run costs nothing; one of these costs whatever it had
// spent by the time it broke, and no capacity surface counts them.

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { calendarDay } from '../instant.mjs';
import { pathToFileURL } from 'node:url';

export const LOG_ROOT = '/srv/asc/state/.epito/logs';

// ---------------------------------------------------------------------------
// parsing
// ---------------------------------------------------------------------------

// The summary line is the last line of the log that is a JSON object carrying
// total_cost_usd. Keyed on the field rather than on the line number, because
// the runner's log shape is not this repository's to pin.
export function parseRunLog(text) {
  let rec = null;
  for (const line of String(text).split('\n')) {
    const t = line.trim();
    if (t.startsWith('{') && t.includes('"total_cost_usd"')) {
      try { rec = JSON.parse(t); } catch { /* a truncated line is not a record */ }
    }
  }
  if (!rec) return { priced: false };
  const usage = rec.modelUsage && typeof rec.modelUsage === 'object' ? rec.modelUsage : {};
  const models = Object.keys(usage).sort();
  return {
    priced: typeof rec.total_cost_usd === 'number',
    // A run the provider refused writes a complete summary: total_cost_usd 0,
    // num_turns 1, is_error true, and modelUsage {}. It is not a cheap run and
    // averaging it into $/run reads as a bargain. Keyed on the empty usage map
    // rather than on the zero, because the mechanism is that no inference
    // happened and a future refusal may not spell its cost the same way.
    refused: models.length === 0,
    cost: typeof rec.total_cost_usd === 'number' ? rec.total_cost_usd : 0,
    turns: typeof rec.num_turns === 'number' ? rec.num_turns : null,
    durationMs: typeof rec.duration_ms === 'number' ? rec.duration_ms : null,
    models,
    mainModel: mainModel(usage),
    end: rec.terminal_reason || rec.subtype || '',
    isError: rec.is_error === true,
  };
}

// The run's tier is the tier of the model that spent the most, not of whichever
// model name matches a pattern first. A premium run that dispatched one subagent
// to haiku is a premium run; naming it by its cheapest model would hide exactly
// the mix this file measures.
export function mainModel(modelUsage) {
  let best = null, bestCost = -1;
  for (const [model, u] of Object.entries(modelUsage || {})) {
    const c = u && typeof u.costUSD === 'number' ? u.costUSD : 0;
    if (c > bestCost) { bestCost = c; best = model; }
  }
  return best;
}

// Two tiers, because the manifest assigns two: `model` in GET /api/agents is
// opus or sonnet for every seat in this portfolio. Haiku appears only as a
// subagent and never as a main model, so it maps to standard rather than to a
// third tier that would never carry a run.
export function tierOf(model) {
  const m = String(model || '').toLowerCase();
  if (m.includes('opus')) return 'premium';
  if (!m) return 'unknown';
  return 'standard';
}

// NOT `calendarDay`, deliberately. This reads a day out of a FILENAME the
// runner chose, so the question is whether the name is shaped like a run log
// and not whether an instant projects onto a calendar. It is then validated,
// because a well-shaped name can still carry a day the calendar does not have.
export function dayOfLogName(basename) {
  const m = /^(\d{4}-\d{2}-\d{2})T/.exec(basename);
  return m ? calendarDay(m[1]) : null;
}

// ---------------------------------------------------------------------------
// aggregation
// ---------------------------------------------------------------------------

// A run is {cost, turns, tier, priced}. Everything below takes that shape so it
// can be tested without a filesystem.
export function aggregate(runs) {
  const priced = runs.filter((r) => r.priced && r.turns > 0);
  const refused = runs.filter((r) => r.refused);
  const out = {
    seen: runs.length,
    priced: priced.length,
    refused: refused.length,
    unpriced: runs.length - priced.length - refused.length,
    cost: priced.reduce((a, r) => a + r.cost, 0),
    costPerRun: 0,
    premiumShare: 0,
    aggCostPerTurn: 0,
    byTier: {},
  };
  if (!priced.length) return out;
  out.costPerRun = out.cost / priced.length;
  const turns = priced.reduce((a, r) => a + r.turns, 0);
  out.aggCostPerTurn = turns ? out.cost / turns : 0;
  for (const tier of ['premium', 'standard', 'unknown']) {
    const rs = priced.filter((r) => r.tier === tier);
    if (!rs.length) continue;
    const T = rs.reduce((a, r) => a + r.turns, 0);
    const C = rs.reduce((a, r) => a + r.cost, 0);
    out.byTier[tier] = {
      runs: rs.length,
      runShare: rs.length / priced.length,
      turnShare: turns ? T / turns : 0,
      turnsPerRun: T / rs.length,
      costPerTurn: T ? C / T : 0,
      cost: C,
    };
  }
  out.premiumShare = out.byTier.premium ? out.byTier.premium.runShare : 0;
  return out;
}

// cost per run = SUM over tiers of runShare * turnsPerRun * costPerTurn.
// It reconstructs the measured mean exactly, which is what makes the three-step
// walk below an attribution and not an illustration. The test pins that.
export function modelledCostPerRun(agg) {
  let total = 0;
  for (const t of Object.values(agg.byTier)) total += t.runShare * t.turnsPerRun * t.costPerTurn;
  return total;
}

// Walk A to B one factor at a time, in the order the factors can be acted on:
// mix is the manifest's, turns are the charters', price is the provider's.
export function decompose(a, b) {
  const tiers = [...new Set([...Object.keys(a.byTier), ...Object.keys(b.byTier)])];
  const pick = (agg, tier) => agg.byTier[tier] || { runShare: 0, turnsPerRun: 0, costPerTurn: 0 };
  let state = tiers.map((t) => ({ tier: t, ...pick(a, t) }));
  // A tier absent from A has no turns and no price to carry, so give it B's
  // once its share arrives. Without this the mix step reads as a saving.
  for (const s of state) {
    if (!a.byTier[s.tier]) {
      s.turnsPerRun = pick(b, s.tier).turnsPerRun;
      s.costPerTurn = pick(b, s.tier).costPerTurn;
    }
  }
  const value = (st) => st.reduce((acc, s) => acc + s.runShare * s.turnsPerRun * s.costPerTurn, 0);
  const steps = [{ label: 'from', value: value(state) }];
  state = state.map((s) => ({ ...s, runShare: pick(b, s.tier).runShare }));
  steps.push({ label: 'mix', value: value(state) });
  state = state.map((s) => ({ ...s, turnsPerRun: pick(b, s.tier).turnsPerRun || s.turnsPerRun }));
  steps.push({ label: 'turns per run', value: value(state) });
  state = state.map((s) => ({ ...s, costPerTurn: pick(b, s.tier).costPerTurn || s.costPerTurn }));
  steps.push({ label: '$ per turn', value: value(state) });
  const total = steps[3].value - steps[0].value;
  const share = (i) => (total === 0 ? 0 : (steps[i].value - steps[i - 1].value) / total);
  return {
    steps,
    total,
    attribution: { mix: share(1), turns: share(2), price: share(3) },
    reconstructed: steps[3].value,
    measured: b.costPerRun,
    // A tier in B that is absent from A arrives at B's turn count, because
    // there is no earlier turn count for it to have grown from. So its turn
    // growth is charged to the mix step and this decomposition understates
    // turns. Say so rather than quoting the number: the two-step read, with
    // the day the tier arrived as the hinge, is the one that separates them.
    arrived: Object.keys(b.byTier).filter((t) => !a.byTier[t]),
  };
}

// Split the change in the AGGREGATE $/turn into the part prices did and the
// part the mix did. Tripped means an aggregate report would name the wrong
// cause, so the caller must print the per-tier columns or print nothing.
export function simpsonAudit(a, b, threshold = 0.10) {
  const tiers = [...new Set([...Object.keys(a.byTier), ...Object.keys(b.byTier)])]
    .filter((t) => a.byTier[t] && b.byTier[t]);
  const from = a.aggCostPerTurn;
  const to = b.aggCostPerTurn;
  const relative = from ? (to - from) / from : 0;
  // B's prices at A's turn mix: what the aggregate would be if only prices moved.
  let counterfactual = 0;
  for (const t of Object.keys(a.byTier)) {
    const price = b.byTier[t] ? b.byTier[t].costPerTurn : a.byTier[t].costPerTurn;
    counterfactual += a.byTier[t].turnShare * price;
  }
  const priceEffect = counterfactual - from;
  const mixEffect = (to - from) - priceEffect;
  const perTier = tiers.map((t) => ({
    tier: t,
    from: a.byTier[t].costPerTurn,
    to: b.byTier[t].costPerTurn,
    relative: a.byTier[t].costPerTurn
      ? (b.byTier[t].costPerTurn - a.byTier[t].costPerTurn) / a.byTier[t].costPerTurn
      : 0,
  }));
  return {
    from, to, relative, priceEffect, mixEffect, perTier, threshold,
    tripped: Math.abs(relative) > threshold && Math.abs(mixEffect) > Math.abs(priceEffect),
  };
}

// ---------------------------------------------------------------------------
// reading the host
// ---------------------------------------------------------------------------

// The mapping from a log directory to a company is the manifest's, never this
// file's. A directory the manifest does not name is reported as unmapped and
// counted, because a retired seat's logs and a renamed company look the same.
export async function seatMap(fetchImpl = fetch) {
  const base = process.env.BOARD_API_URL;
  const token = process.env.BOARD_RUNTIME_TOKEN;
  if (!base || !token) return { map: {}, reachable: false };
  try {
    const res = await fetchImpl(`${base}/api/agents`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return { map: {}, reachable: false };
    const body = await res.json();
    const map = {};
    for (const a of body.agents || []) {
      if (a.name) map[a.name] = { company: a.company, seat: a.seat, model: a.model, maxTurns: a.max_turns };
    }
    return { map, reachable: true };
  } catch {
    return { map: {}, reachable: false };
  }
}

export function readRuns({ root = LOG_ROOT, sinceDay = null, dirs = null } = {}) {
  let names;
  try {
    names = dirs || readdirSync(root).filter((d) => {
      try { return statSync(join(root, d)).isDirectory(); } catch { return false; }
    });
  } catch {
    return { runs: [], rootMissing: true };
  }
  const runs = [];
  for (const dir of names) {
    let files;
    try { files = readdirSync(join(root, dir)).filter((f) => f.endsWith('.log')); } catch { continue; }
    for (const f of files) {
      const day = dayOfLogName(f);
      if (!day) continue;
      if (sinceDay && day < sinceDay) continue;
      let text = '';
      try { text = readFileSync(join(root, dir, f), 'utf8'); } catch { continue; }
      const rec = parseRunLog(text);
      runs.push({
        dir, day, file: f,
        priced: rec.priced === true && typeof rec.turns === 'number' && rec.refused !== true,
        refused: rec.refused === true,
        cost: rec.cost || 0,
        turns: rec.turns || 0,
        tier: tierOf(rec.mainModel),
        end: rec.end || '',
        isError: rec.isError === true,
      });
    }
  }
  return { runs, rootMissing: false };
}

// ---------------------------------------------------------------------------
// cli
// ---------------------------------------------------------------------------

const USAGE = `usage: node tools/seat/spend.mjs [--days N] [--company NAME]
       [--portfolio] [--seats [--day YYYY-MM-DD]] [--decompose A,B]
       [--audit] [--json] [--root PATH]`;

function money(n) { return n >= 100 ? n.toFixed(0) : n.toFixed(2); }
function pct(n) { return `${(100 * n).toFixed(0)}%`; }

function argOf(argv, name, fallback = null) {
  const i = argv.indexOf(name);
  return i === -1 ? fallback : argv[i + 1];
}

async function main(argv) {
  if (argv.includes('--help') || argv.includes('-h')) { console.log(USAGE); return 0; }
  const days = Number(argOf(argv, '--days', '14'));
  if (!Number.isFinite(days) || days < 1) { console.error(USAGE); return 2; }
  const company = String(argOf(argv, '--company', 'Ursa')).toLowerCase();
  const root = argOf(argv, '--root', LOG_ROOT);
  const asJson = argv.includes('--json');
  // calendarDay rather than toISOString().slice(0, 10): the projection is
  // gated on parseDay, so a day the calendar does not have comes back null
  // instead of being handed through as a real one. It landed on `main` in the
  // forward merge this branch took mid-run, which is why this call site exists
  // rather than the idiom the first commit of this file used.
  const sinceDay = calendarDay(new Date(Date.now() - days * 86400000).toISOString());
  if (sinceDay === null) {
    console.error('cannot answer: the window start did not project to a calendar day.');
    return 3;
  }

  const { map, reachable } = await seatMap();
  const { runs, rootMissing } = readRuns({ root, sinceDay });
  if (rootMissing) {
    console.error(`cannot answer: no run-log root at ${root}. This is exit 3 and not a zero.`);
    return 3;
  }
  const unmapped = [...new Set(runs.map((r) => r.dir).filter((d) => !map[d]))];
  const mine = runs.filter((r) => map[r.dir] && String(map[r.dir].company).toLowerCase() === company);
  const pricedAll = runs.filter((r) => r.priced).length;
  if (!pricedAll) {
    console.error(`cannot answer: ${runs.length} run logs under ${root} since ${sinceDay} and `
      + 'not one carries a priced summary line. This is exit 3 and not a zero.');
    return 3;
  }

  const days_ = [...new Set(runs.map((r) => r.day))].sort();
  const byDay = (rs) => {
    const o = {};
    for (const d of days_) o[d] = aggregate(rs.filter((r) => r.day === d));
    return o;
  };

  if (argv.includes('--decompose')) {
    const spec = String(argOf(argv, '--decompose', '')).split(',');
    if (spec.length !== 2) { console.error(USAGE); return 2; }
    // A day is one day. `..YYYY-MM-DD` is that day and everything before it,
    // which is the form the pre-premium baseline needs: nine days of three runs
    // each is a baseline and any one of them is a sample.
    const [specA, dB] = spec;
    const cumulative = specA.startsWith('..');
    const dA = cumulative ? specA.slice(2) : specA;
    const a = aggregate(mine.filter((r) => (cumulative ? r.day <= dA : r.day === dA)));
    const b = aggregate(mine.filter((r) => r.day === dB));
    if (!a.priced || !b.priced) {
      console.error(`cannot answer: priced runs ${cumulative ? 'through' : 'on'} ${dA}: ${a.priced}; on ${dB}: ${b.priced}.`);
      return 3;
    }
    const dec = decompose(a, b);
    const aud = simpsonAudit(a, b);
    if (asJson) { console.log(JSON.stringify({ company, from: dA, cumulative, to: dB, a, b, dec, aud }, null, 2)); return argv.includes('--audit') && aud.tripped ? 1 : 0; }
    console.log(`${company}: ${a.priced} priced runs ${cumulative ? `through ${dA}` : `on ${dA}`}, `
      + `${b.priced} on ${dB}`);
    console.log(`  $/run ${money(a.costPerRun)} -> ${money(b.costPerRun)}  (${(b.costPerRun / a.costPerRun).toFixed(2)}x)`);
    for (const s of dec.steps) console.log(`    ${s.label.padEnd(16)} $${money(s.value)}`);
    console.log(`  of the $${money(dec.total)} change: mix ${pct(dec.attribution.mix)}, `
      + `turns ${pct(dec.attribution.turns)}, $/turn ${pct(dec.attribution.price)}`);
    console.log(`  reconstructed $${money(dec.reconstructed)} against measured $${money(dec.measured)}`);
    if (dec.arrived.length) {
      console.log(`  ORDERING: ${dec.arrived.join(', ')} is absent at ${dA}, so it arrives already at `
        + `${dB}'s turn count and its turn growth is charged to the mix step. This read understates `
        + 'turns. Split the window at the day the tier arrived and quote the two steps.');
    }
    console.log(`  aggregate $/turn ${aud.from.toFixed(3)} -> ${aud.to.toFixed(3)} `
      + `(${pct(aud.relative)}); price effect ${aud.priceEffect.toFixed(3)}, mix effect ${aud.mixEffect.toFixed(3)}`);
    for (const t of aud.perTier) {
      console.log(`    ${t.tier.padEnd(9)} $/turn ${t.from.toFixed(3)} -> ${t.to.toFixed(3)} (${pct(t.relative)})`);
    }
    if (aud.tripped) {
      console.log('  MIX ARTIFACT: the aggregate $/turn moved mostly because the mix moved.');
      console.log('  Do not publish the aggregate alone; the per-tier rows above are the reading.');
    }
    return argv.includes('--audit') && aud.tripped ? 1 : 0;
  }

  if (argv.includes('--audit')) {
    const dayList = [...new Set(mine.map((r) => r.day))].sort();
    if (dayList.length < 2) { console.error('cannot answer: fewer than two days with runs in the window.'); return 3; }
    const a = aggregate(mine.filter((r) => r.day === dayList[0]));
    const b = aggregate(mine.filter((r) => r.day === dayList[dayList.length - 1]));
    const aud = simpsonAudit(a, b);
    if (asJson) { console.log(JSON.stringify({ company, from: dayList[0], to: dayList.at(-1), aud }, null, 2)); return aud.tripped ? 1 : 0; }
    console.log(`${company} ${dayList[0]} -> ${dayList.at(-1)}: aggregate $/turn `
      + `${aud.from.toFixed(3)} -> ${aud.to.toFixed(3)} (${pct(aud.relative)})`);
    console.log(`  price effect ${aud.priceEffect.toFixed(3)}, mix effect ${aud.mixEffect.toFixed(3)}`);
    for (const t of aud.perTier) {
      console.log(`  ${t.tier.padEnd(9)} $/turn ${t.from.toFixed(3)} -> ${t.to.toFixed(3)} (${pct(t.relative)})`);
    }
    console.log(aud.tripped
      ? '  tripped: the aggregate is mix-driven. Report the per-tier rows, not the aggregate.'
      : '  clean: the aggregate $/turn is not mix-driven over this window.');
    return aud.tripped ? 1 : 0;
  }

  if (argv.includes('--seats')) {
    const day = argOf(argv, '--day', [...new Set(mine.map((r) => r.day))].sort().at(-1));
    const rs = mine.filter((r) => r.day === day);
    const tot = aggregate(rs);
    const seats = [...new Set(rs.map((r) => r.dir))];
    const rows = seats.map((d) => {
      const a = aggregate(rs.filter((r) => r.dir === d));
      const cap = map[d] ? map[d].maxTurns : null;
      const atCap = rs.filter((r) => r.dir === d && r.end === 'max_turns').length;
      return { seat: map[d] ? map[d].seat : d, dir: d, ...a, cap, atCap };
    }).sort((x, y) => y.cost - x.cost);
    if (asJson) { console.log(JSON.stringify({ company, day, total: tot, seats: rows }, null, 2)); return 0; }
    console.log(`${company} ${day}: ${tot.priced} priced runs, ${tot.refused} refused, `
      + `${tot.unpriced} with no summary line, $${money(tot.cost)}`);
    console.log('  seat        runs   $tot  share  $/run  turns/run  cap  premium  at-cap');
    for (const r of rows) {
      const tpr = r.priced
        ? Object.values(r.byTier).reduce((a, t) => a + t.turnsPerRun * t.runShare, 0) : 0;
      console.log(`  ${r.seat.padEnd(11)}${String(r.priced).padStart(4)} `
        + `${money(r.cost).padStart(6)} ${pct(tot.cost ? r.cost / tot.cost : 0).padStart(6)} `
        + `${money(r.costPerRun).padStart(6)} ${tpr.toFixed(0).padStart(10)} `
        + `${String(r.cap ?? '-').padStart(4)} ${pct(r.premiumShare).padStart(8)} ${String(r.atCap).padStart(7)}`);
    }
    return 0;
  }

  if (argv.includes('--portfolio')) {
    const companies = [...new Set(Object.values(map).map((m) => String(m.company).toLowerCase()))].sort();
    const out = {};
    if (!asJson) {
      console.log(`run logs under ${root} since ${sinceDay}: ${runs.length} seen, ${pricedAll} priced, `
        + `${runs.filter((r) => r.refused).length} refused, `
        + `${runs.filter((r) => !r.priced && !r.refused).length} with no summary line; `
        + `${unmapped.length} directories the manifest does not name`
        + (unmapped.length ? ` (${unmapped.join(' ')})` : ''));
      console.log(`  day         $total  ${companies.map((c) => c.slice(0, 9).padStart(10)).join('')}`);
    }
    for (const d of days_) {
      const all = aggregate(runs.filter((r) => r.day === d));
      const row = {};
      for (const c of companies) {
        const a = aggregate(runs.filter((r) => r.day === d && map[r.dir]
          && String(map[r.dir].company).toLowerCase() === c));
        row[c] = { cost: a.cost, share: all.cost ? a.cost / all.cost : 0, runs: a.priced };
      }
      out[d] = { total: all.cost, priced: all.priced, refused: all.refused, unpriced: all.unpriced, byCompany: row };
      if (!asJson) {
        console.log(`  ${d} ${money(all.cost).padStart(8)}  `
          + companies.map((c) => `${money(row[c].cost)} ${pct(row[c].share)}`.padStart(10)).join(''));
      }
    }
    if (asJson) console.log(JSON.stringify({ root, sinceDay, unmapped, days: out }, null, 2));
    return 0;
  }

  // the default table
  const table = byDay(mine);
  const liveDays = days_.filter((d) => table[d].seen > 0);
  if (asJson) {
    console.log(JSON.stringify({
      company, root, sinceDay, manifestReachable: reachable, unmapped,
      days: Object.fromEntries(liveDays.map((d) => [d, table[d]])),
    }, null, 2));
    return 0;
  }
  console.log(`${company}: run logs under ${root} since ${sinceDay} — `
    + `${mine.length} seen, ${mine.filter((r) => r.priced).length} priced, `
    + `${mine.filter((r) => r.refused).length} refused before any inference, `
    + `${mine.filter((r) => !r.priced && !r.refused).length} with no summary line`
    + (reachable ? '' : ' (manifest unreachable, so company attribution is empty)'));
  if (unmapped.length) console.log(`  directories the manifest does not name: ${unmapped.join(' ')}`);
  console.log('  day         priced  refd  unpr   $tot  $/run  premium  turns/run(prem/std)  $/turn(prem/std)  agg$/turn');
  for (const d of liveDays) {
    const a = table[d];
    const p = a.byTier.premium, s = a.byTier.standard;
    console.log(`  ${d} ${String(a.priced).padStart(7)} ${String(a.refused).padStart(5)} ${String(a.unpriced).padStart(5)} `
      + `${money(a.cost).padStart(6)} ${money(a.costPerRun).padStart(6)} ${pct(a.premiumShare).padStart(8)} `
      + `${(p ? p.turnsPerRun.toFixed(0) : '-').padStart(11)}/${(s ? s.turnsPerRun.toFixed(0) : '-').padEnd(7)} `
      + `${(p ? p.costPerTurn.toFixed(3) : '-').padStart(8)}/${(s ? s.costPerTurn.toFixed(3) : '-').padEnd(7)} `
      + `${a.aggCostPerTurn.toFixed(3).padStart(9)}`);
  }
  console.log('  The last column is the one to distrust: it moves with the mix. '
    + 'Run --audit before you quote it.');
  return 0;
}

// Entry point. The predicate compares this module's own URL to the resolved
// entry point, which is the only form that asks whether THIS module is the
// one being run. The form it replaces compared a file NAME, so it was true
// for any entry point whose own name is a suffix of this one; the general
// case is `tools/gates/import-effects.mjs`'s GUARD_ASKS_THE_WRONG_QUESTION
// and the demonstrated instance is in that gate's header.
const invokedDirectly =
  process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href;
if (invokedDirectly) {
  main(process.argv.slice(2)).then((code) => process.exit(code)).catch((e) => {
    console.error(`cannot answer: ${e.message}`);
    process.exit(3);
  });
}
