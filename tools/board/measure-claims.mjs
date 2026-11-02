#!/usr/bin/env node
// What the two 2026-11-02 rules would do to this board's real traffic, counted
// before either one was allowed to refuse anything.
//
//   node tools/board/measure-claims.mjs                 # 30 days, the table
//   node tools/board/measure-claims.mjs --hours 48      # one named window
//   node tools/board/measure-claims.mjs --json          # machine-readable
//   node tools/board/measure-claims.mjs --paths         # also list the paths
//
// Exit 0 the table printed. Exit 2 no live board to measure.
//
// READ-ONLY, ON PURPOSE, which is `tools/board/read-filters.mjs`'s rule and
// its reason: the board has no delete route, so a seat that learns anything
// by POSTing leaves those rows in somebody's inbox forever. Seventeen of them
// on 2026-10-18, seven in a project manager's. Every request here is a GET.
//
// WHY A GATE NEEDS THIS BEFORE IT SHIPS. `tools/board/check.mjs` refuses a
// message locally, so a wrong rule there costs a seat a rewrite it did not
// need, and a seat that cannot get a correct message past a gate stops using
// the gate. That file's own 2026-11-02 header states the standard: "a gate
// that refuses correct messages is the defect this same run repaired one rule
// above." So the question a new rule has to answer first is not "is the rule
// right" but "how much of the traffic that already happened does it fire on,
// and is each of those a message whose author was actually stranded."
//
// WHAT THE DENOMINATOR IS, said plainly because it is not the input space,
// and because the obvious way to say it is wrong.
//
// `limit` is not the denominator. `GET /api/messages` windows on time before
// it counts: `since_hours` defaults to **48** (api.py:1272, `float(one(
// "since_hours", "48"))`) and `limit` defaults to 100 and is honoured after
// that. So "the 500 rows the store returns" is really "up to 500 rows from
// the last two days", and a run that passes `limit=500` and reads back 287 has
// not found a board with 287 rows on it. It has found 287 rows inside 48
// hours. Both numbers are floors and they are floors over different things.
//
// This tool therefore passes `since_hours` explicitly, prints it beside every
// count, and defaults it to 720 (30 days) so that the window is a decision
// rather than a default nobody read. `--hours N` changes it.
//
// Still a floor, for the reason the reporting seat put best: the corpus "is
// not a sample of the input space, it is a sample of what the style guide and
// a validator leave behind."
import { liveTargetFault } from './live-target.mjs';
import { unreffedClaims, pathClaims, isStateClaim, refsIn } from './claim-ref.mjs';
import { wakeReceipt, WAKE_BODY_CHARS } from './check.mjs';
import { dispositionRisk } from './disposition.mjs';

/** Pull one page of rows. Both knobs are passed rather than defaulted, for
 *  the reason in the header: the route's own defaults are 48 hours and 100
 *  rows, and a count whose window came from a default is a count nobody can
 *  reproduce. `everyone=1` is the route's default and is passed anyway, so
 *  that the page is explicitly the whole board and not one inbox.
 *  @returns {Promise<object[]>} */
async function rows(hours, limit = 2000) {
  const url = String(process.env.BOARD_API_URL || '').replace(/\/+$/, '');
  const res = await fetch(`${url}/api/messages?since_hours=${hours}&limit=${limit}&everyone=1`, {
    headers: { Authorization: `Bearer ${process.env.BOARD_RUNTIME_TOKEN}` },
  });
  if (!res.ok) throw new Error(`GET /api/messages answered ${res.status}`);
  const body = await res.json();
  return body.messages || [];
}

/** The whole measurement, as data. Separated from printing so a test can hand
 *  it rows and assert the arithmetic without a board.
 *  @param {object[]} msgs @returns {object} */
export function measure(msgs, hours) {
  const byKind = {};
  const overByKind = {};
  const claimFires = [];
  const pathsSeen = new Map();
  let withPath = 0;
  let withStateClaim = 0;
  let over = 0;
  let dispositionAtRisk = 0;
  let dispositionSurvived = 0;

  for (const m of msgs) {
    const kind = m.kind || '(none)';
    const body = m.body || '';
    byKind[kind] = (byKind[kind] || 0) + 1;

    const paths = pathClaims(body);
    if (paths.length) withPath += 1;
    if (paths.some((p) => isStateClaim(p.sentence))) withStateClaim += 1;
    for (const p of paths) pathsSeen.set(p.path, (pathsSeen.get(p.path) || 0) + 1);

    const unreffed = unreffedClaims({ body, data: m.data });
    if (unreffed.length) {
      claimFires.push({
        kind,
        from: `${m.from_company || '?'}/${m.from_seat || '?'}`,
        paths: unreffed.map((u) => u.path),
      });
    }

    const r = wakeReceipt(body);
    if (r.body_truncated) {
      over += 1;
      overByKind[kind] = (overByKind[kind] || 0) + 1;
      // `r.body_delivered` and not the default: `dispositionRisk` with one
      // argument treats the whole body as delivered, which is the right
      // answer for a body under the limit and silently makes `lost_only`
      // unreachable for one over it. The first version of this file omitted
      // it and reported zero at-risk bodies out of 77, which is the number a
      // reader would have believed.
      const risk = dispositionRisk(body, r.body_delivered);
      if (risk.lost_only) dispositionAtRisk += 1;
      else if (risk.in_delivered) dispositionSurvived += 1;
    }
  }

  return {
    wake_limit: WAKE_BODY_CHARS,
    since_hours: hours,
    rows: msgs.length,
    by_kind: byKind,
    over_limit: over,
    over_limit_by_kind: overByKind,
    // The reporting seat's domain finding, recomputed here rather than quoted:
    // which share of the truncation loss is in a kind check.mjs only warns on.
    over_limit_warned_share: over ? +( (over - (overByKind.ask || 0) - (overByKind.handoff || 0)) / over).toFixed(3) : 0,
    disposition_lost_only: dispositionAtRisk,
    disposition_survived_the_cut: dispositionSurvived,
    bodies_with_a_repo_path: withPath,
    bodies_with_a_state_claim: withStateClaim,
    unreffed_claim_fires: claimFires.length,
    unreffed_by_kind: claimFires.reduce((a, f) => ({ ...a, [f.kind]: (a[f.kind] || 0) + 1 }), {}),
    unreffed_by_sender: claimFires.reduce((a, f) => ({ ...a, [f.from]: (a[f.from] || 0) + 1 }), {}),
    paths_cited: [...pathsSeen.entries()].sort((a, b) => b[1] - a[1]),
  };
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  const fault = liveTargetFault({ apiUrl: process.env.BOARD_API_URL, token: process.env.BOARD_RUNTIME_TOKEN });
  if (fault) {
    console.error(`${fault.code}: ${fault.line}\n  repair: ${fault.repair}`);
    process.exit(2);
  }
  const hoursArg = process.argv.indexOf('--hours');
  const hours = hoursArg === -1 ? 720 : Number(process.argv[hoursArg + 1]);
  const msgs = await rows(hours);
  const out = measure(msgs, hours);
  if (process.argv.includes('--json')) {
    console.log(JSON.stringify(out, process.argv.includes('--paths') ? null : (k, v) => (k === 'paths_cited' ? undefined : v), 2));
  } else {
    console.log(`rows read: ${out.rows}  window: ${out.since_hours}h  wake limit: ${out.wake_limit}`);
    console.log(`over the limit: ${out.over_limit}  by kind: ${JSON.stringify(out.over_limit_by_kind)}`);
    console.log(`  share in a kind check.mjs only warns on: ${(out.over_limit_warned_share * 100).toFixed(1)}%`);
    console.log(`  disposition in the lost tail only: ${out.disposition_lost_only}`);
    console.log(`  disposition also in the delivered head: ${out.disposition_survived_the_cut}`);
    console.log(`bodies citing a repository path: ${out.bodies_with_a_repo_path}`);
    console.log(`  of those, at least one state claim: ${out.bodies_with_a_state_claim}`);
    console.log(`unreffed state claims (the new rule fires): ${out.unreffed_claim_fires}`);
    console.log(`  by kind:   ${JSON.stringify(out.unreffed_by_kind)}`);
    console.log(`  by sender: ${JSON.stringify(out.unreffed_by_sender)}`);
    if (process.argv.includes('--paths')) {
      for (const [p, n] of out.paths_cited) console.log(`  ${String(n).padStart(3)}  ${p}`);
    }
  }
}
