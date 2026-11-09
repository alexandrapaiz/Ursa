#!/usr/bin/env node
// What the two 2026-11-02 rules would do to this board's real traffic, counted
// before either one was allowed to refuse anything.
//
//   node tools/board/measure-claims.mjs                 # 30 days, the table
//   node tools/board/measure-claims.mjs --hours 48      # one named window
//   node tools/board/measure-claims.mjs --json          # machine-readable
//   node tools/board/measure-claims.mjs --paths         # also list the paths
//   node tools/board/measure-claims.mjs --company Ursa  # one company's rows
//   node tools/board/measure-claims.mjs --emit-measured # the paste-ready
//                                                       # MEASURED block,
//                                                       # read instant and all
//
// Exit 0 the window was covered and the table printed. Exit 1 the window was
// not covered: the counts print as floors, every share is withheld, and the
// coverage receipt says which page gave up. Exit 2 no live board to measure.
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
// and because this file's first version got it wrong in a way that cost two
// seats a night. The paragraph below is the correction; the paragraph after it
// is what the correction replaced, kept because the wrong reasoning is the
// part worth recognising again.
//
// `GET /api/messages` windows on time, orders newest first, and clamps `limit`
// to **500**, reporting the clamp in `limit` and the fill in `saturated`. So a
// single read of a busy window is not a sample of it. It is the newest slice
// of it, and **a cap that returns the newest rows is time-biased, not
// size-biased**: composition drifts with where the truncation lands, which
// means a share drawn from it is no safer than a count. This tool therefore
// reads through `tools/board/page.mjs`, which walks the window with
// `before_hours` until a page comes back unfilled, and refuses to print any
// share at all when that walk did not finish. `docs/standards/pm.md` section
// 15 states both halves of that rule already.
//
// WHAT THIS FILE USED TO SAY, and what it cost. It said `limit` is not the
// denominator because the route windows on time first, so "the 500 rows the
// store returns" is really "up to 500 rows from the last two days" — and
// concluded that the window must be an explicit decision, which it then made
// (720 hours, below). That reasoning is sound and incomplete, and the missing
// half is the whole thing: having set a 720-hour window it passed
// `limit=2000`, was handed the newest 500 of 4,057 rows, and never read the
// `saturated: true` sitting in the same response body. On 2026-11-02 this seat
// published a warned share of 86.1 per cent from that read and offered it to
// Ursa's exo as independent reproduction of that seat's 86. The paged figures
// are 72.6 per cent portfolio-wide and 83.1 for Ursa. Thirteen points, two
// implementations, one shared read bound, and the agreement between them was
// not a control for anything. The same read reported **no** over-limit `ask`
// bodies, which is the kind `tools/board/check.mjs` refuses, so the domain
// finding understated the traffic its own gate acts on; that walk found 49
// portfolio-wide and 5 for Ursa.
//
// EVERY FIGURE IN THE PARAGRAPH ABOVE IS A READING AND NOT A STANDING FACT,
// and this comment is the second time that cost something on one night. Those
// counts came from a paged walk earlier on 2026-11-02 whose clock instant
// nothing recorded, so "49" cannot be reconciled with the 51 in
// `disposition.mjs` by reading either file: the two are different reads of a
// rolling window, and only one direction of that difference is distinguishable
// from an error. Four later walks, dated, agree on 51. The dated series is
// `MEASURED.drift` in `tools/board/disposition.mjs`, and
// `tools/board/measured-citation.mjs` is why a count cannot reach a seat's
// output undated any more. A count in a comment still can, which is the
// unguarded surface this run named rather than closed.
//
// AND THE OTHER THING IT SAID, which was wrong in a different way: that five
// hundred rows is two days of them, "which a share survives and a count does
// not." Two days was a measurement taken on 2026-10-24 and reported as a
// property. On 2026-11-02 the same cap reaches back six days, to
// 2026-10-27T01:02, because the portfolio completed no runs for four days in
// between. The span a cap hands back is a fact about traffic, so it is read
// off `coverage.oldest_ts` every time and never assumed.
//
// Still a floor even when the walk completes, for the reason the reporting
// seat put best: the corpus "is not a sample of the input space, it is a
// sample of what the style guide and a validator leave behind."
import { utcDay } from '../instant.mjs';
import { liveTargetFault } from './live-target.mjs';
import { blockFaults } from './measured-citation.mjs';
import { pageMessages, ratioFault, coverageExit } from './page.mjs';
import { unreffedClaims, pathClaims, isStateClaim, refsIn } from './claim-ref.mjs';
import { wakeReceipt, WAKE_BODY_CHARS } from './check.mjs';
import { dispositionRisk } from './disposition.mjs';

/** The whole measurement, as data. Separated from printing so a test can hand
 *  it rows and assert the arithmetic without a board.
 *
 *  `coverage` comes from `tools/board/page.mjs` and travels with the counts
 *  rather than being checked once at the printer, because the counts outlive
 *  the printer: `--json` output gets pasted into a pull request and a board
 *  message, and a figure that carries its own coverage cannot be quoted
 *  without it. Every share in the return value is `null` when the walk did not
 *  finish, which is the executable form of "say I could not look."
 *
 *  @param {object[]} msgs @param {number} hours @param {object} [coverage]
 *  @returns {object} */
export function measure(msgs, hours, coverage) {
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

  // The rule, in one place. A share is published only from a walk that
  // finished; otherwise the field is null and `withheld` says why, because a
  // missing number asks a reader a question and a wrong one answers it.
  const fault = coverage === undefined ? null : ratioFault(coverage);
  const share = (n, d) => (fault ? null : d ? +(n / d).toFixed(3) : 0);

  return {
    wake_limit: WAKE_BODY_CHARS,
    since_hours: hours,
    rows: msgs.length,
    // Floors, not totals, whenever the walk did not finish. Named so in the
    // data and not only in the printed table.
    counts_are_floors: Boolean(fault),
    shares_withheld: fault ? fault.code : null,
    shares_withheld_line: fault ? fault.line : null,
    coverage: coverage || null,
    by_kind: byKind,
    over_limit: over,
    over_limit_by_kind: overByKind,
    // The reporting seat's domain finding, recomputed here rather than quoted:
    // which share of the truncation loss is in a kind check.mjs only warns on.
    over_limit_warned_share: share(over - (overByKind.ask || 0) - (overByKind.handoff || 0), over),
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

/** The paste-ready `MEASURED` block for `tools/board/disposition.mjs`, built
 *  from a walk's own output and a clock reading, so re-deriving that constant
 *  is a copy and not a transcription.
 *
 *  WHY THIS IS A FUNCTION AND NOT A NOTE IN A PULL REQUEST. The block it
 *  produces is quoted to seats by `tools/board/check.mjs`, and on 2026-11-02
 *  the committed version of it carried a calendar day instead of a read
 *  instant. That did not happen because anyone decided a day was enough. It
 *  happened because nine fields were retyped out of a JSON receipt by hand,
 *  and a clock reading is the one field a JSON receipt does not contain: the
 *  walk reports the newest ROW it saw, which lags the clock by however long
 *  the bus was quiet, twenty-nine minutes that night. So the clock is read
 *  here, at the only moment it is knowable, and handed in as an argument so
 *  this stays testable.
 *
 *  Returns the block and whatever is wrong with it. `faults` is non-empty for
 *  a walk that did not finish, because every share in the block would be a
 *  share of a window nobody covered, and for a `readAt` that precedes the
 *  walk's own newest row, which is the back-fill `measured-citation.mjs`
 *  exists to refuse. A caller that prints a block with faults is printing a
 *  constant a gate will decline to quote.
 *  @param {object} out the return value of `measure`
 *  @param {string} readAt a full UTC instant, from the clock at walk time
 *  @param {{company?: string, out?: object}} [company] one company's walk
 *  @returns {{block: object, faults: {code: string, line: string, repair: string}[]}} */
export function measuredBlock(out, readAt, company = {}) {
  const c = out.coverage || {};
  const k = out.over_limit_by_kind || {};
  const slice = (o) => ({
    rows: o.rows,
    over_limit: o.over_limit,
    warned_share: o.over_limit_warned_share,
    by_kind: o.over_limit_by_kind,
    disposition_lost_only: o.disposition_lost_only,
    disposition_survived: o.disposition_survived_the_cut,
  });
  const block = {
    read_at: readAt,
    // The UTC day of the read, and not `slice(0, 10)` of it. `readAt` is a
    // board instant today, so the slice agreed; it stops agreeing the moment
    // a caller hands this an offset-bearing git date, and this block is a
    // published citation. Null rather than a guess when unplaceable, because
    // `tools/board/measured-citation.mjs` reads this field and a wrong day
    // passes its checks while a null does not.
    on: utcDay(readAt),
    window_hours: out.since_hours,
    coverage: {
      complete: c.complete,
      pages: c.pages,
      rows: c.rows,
      oldest_ts: c.oldest_ts,
      newest_ts: c.newest_ts,
      covered_hours: c.covered_hours,
    },
    rows: out.rows,
    over_limit: out.over_limit,
    by_kind: { note: k.note || 0, done: k.done || 0, handoff: k.handoff || 0, ask: k.ask || 0 },
    warned_share: out.over_limit_warned_share,
    disposition_lost_only: out.disposition_lost_only,
    disposition_survived: out.disposition_survived_the_cut,
    // The third bucket, stated rather than left to be inferred: an over-limit
    // body in which the word list found no disposition phrase at all.
    no_marker_found: out.over_limit - out.disposition_lost_only - out.disposition_survived_the_cut,
  };
  if (company && company.out && company.company) block[String(company.company).toLowerCase()] = slice(company.out);
  const faults = blockFaults(block);
  if (!c.complete) {
    faults.push({
      code: 'WALK_INCOMPLETE',
      line: `the walk covered ${c.covered_hours}h of the ${c.requested_hours}h asked for and ${out.shares_withheld || 'did not finish'}, so every share in this block is a share of a window nobody read`,
      repair: 'run the walk again until it ends on a page that did not fill, which is what `coverage.complete` means. Do not paste a block from a capped read into a gate: that is the 13-point error of 2026-11-02 02:55Z',
    });
  }
  return { block, faults };
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  const fault = liveTargetFault({ apiUrl: process.env.BOARD_API_URL, token: process.env.BOARD_RUNTIME_TOKEN });
  if (fault) {
    console.error(`${fault.code}: ${fault.line}\n  repair: ${fault.repair}`);
    process.exit(2);
  }
  const arg = (name, fallback) => {
    const i = process.argv.indexOf(name);
    return i === -1 ? fallback : process.argv[i + 1];
  };
  const hours = Number(arg('--hours', 720));
  // The company filter is applied here and not passed to the route, because
  // `from_company` is a read filter whose verdict is measured per route in
  // `tools/board/read-filters.mjs` and a filter the route accepts and ignores
  // would scope the window without scoping the rows. Filtering the walked set
  // locally cannot be INERT.
  const company = arg('--company', null);
  const { rows, coverage } = await pageMessages({ hours });
  const msgs = company
    ? rows.filter((m) => String(m.from_company || '').toLowerCase() === company.toLowerCase())
    : rows;
  const out = measure(msgs, hours, coverage);
  if (company) out.from_company = company;
  if (process.argv.includes('--emit-measured')) {
    // The clock, read here and nowhere else: this is the instant the walk
    // above finished, and it is the field no receipt can reconstruct.
    const readAt = new Date().toISOString().replace(/\.\d+Z$/, 'Z');
    // Both scopes off ONE walk. The committed block before this flag existed
    // had its portfolio figures from a 04:17:41Z walk and its Ursa figures
    // from a 04:18:17Z one, so its own coverage disagreed with itself by a
    // row and the two slices were not a partition of anything. Filtering the
    // rows this walk already holds costs no request and makes the nested
    // slice a subset of the block it sits in by construction.
    //
    // Case-insensitive, like the `--company` filter above, and the difference
    // is 17 rows rather than a style point: `tools/board/check.mjs` exists
    // because `POST /api/messages` accepts `ursa` and the wake fan-out drops
    // it, so this company's own traffic is spelled two ways on the bus. An
    // exact match on `'Ursa'` reported 1,098 rows where the case-insensitive
    // one reported 1,115, both at 04:28Z, and the 17 it dropped are exactly
    // the rows whose senders hit the spelling defect this directory is for.
    const nested = company ? {} : {
      company: 'Ursa',
      out: measure(rows.filter((m) => String(m.from_company || '').toLowerCase() === 'ursa'), hours, coverage),
    };
    const { block, faults } = measuredBlock(out, readAt, nested);
    for (const f of faults) console.error(`${f.code}: ${f.line}\n  repair: ${f.repair}`);
    console.log(`// Re-derived with \`node tools/board/measure-claims.mjs --hours ${hours}${company ? ` --company ${company}` : ''} --emit-measured\`.`);
    console.log(`export const MEASURED = ${JSON.stringify(block, null, 2)};`);
    process.exit(faults.length ? 1 : 0);
  }
  if (process.argv.includes('--json')) {
    const drop = new Set(process.argv.includes('--paths') ? [] : ['paths_cited']);
    if (!process.argv.includes('--pages')) drop.add('page_log');
    console.log(JSON.stringify(out, (k, v) => (drop.has(k) ? undefined : v), 2));
  } else {
    console.log(`rows read: ${out.rows}${company ? ` from ${company}` : ''}  window: ${out.since_hours}h  wake limit: ${out.wake_limit}`);
    console.log(`coverage: ${coverage.pages} pages, ${coverage.rows} distinct rows, back to ${coverage.oldest_ts} (${coverage.covered_hours}h of ${coverage.requested_hours}h asked for)`);
    console.log(`over the limit: ${out.over_limit}${out.counts_are_floors ? ' (a floor)' : ''}  by kind: ${JSON.stringify(out.over_limit_by_kind)}`);
    const pct = (v) => (v === null ? null : `${(v * 100).toFixed(1)}%`);
    if (out.shares_withheld) {
      console.log(`  share in a kind check.mjs only warns on: WITHHELD`);
      console.log(`  ${out.shares_withheld}: ${out.shares_withheld_line}`);
    } else {
      console.log(`  share in a kind check.mjs only warns on: ${pct(out.over_limit_warned_share)}`);
    }
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
  // Exit 1 and not 0: a run that quotes this table in a message should have to
  // notice that the window was not covered, and a shell that checks the status
  // is the only reader guaranteed to.
  process.exit(coverageExit(coverage));
}
