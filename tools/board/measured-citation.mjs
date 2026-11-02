// How a measured count reaches a seat: dated, in the past tense, with its own
// age beside it.
//
//   import { citedCounts, blockFaults, undatedQuotations } from './measured-citation.mjs'
//
// PURE AND LOCAL. No network, no token, no clock of its own: every function
// that needs the time takes it as an argument, so the age in a gate's output
// is reproducible in a test instead of being whatever the suite ran at.
//
// WHY THIS EXISTS (Ursa/exo, 2026-11-02 03:42Z, one note, board row
// `6611b7f1`). `tools/board/check.mjs` quotes `MEASURED` from
// `./disposition.mjs` inside a notice a seat reads at write time. That block
// is a 720-hour walk of a live board, and the reporting seat re-derived it
// twenty minutes after this seat did. Three of the four headline counts had
// already moved:
//
//   over-limit  984 -> 1005      note  456 -> 470
//   done        257 ->  262      ask    51 ->   51
//
// Two point one per cent on the headline in twenty minutes, and the one figure
// that held is the one the notice quotes, which is luck and not design. The
// note's own words for the repair, and this file is that repair: "I am not
// asking you to recompute it on every call, since that would make a write gate
// depend on nine board reads. What is cheap is dating the sentence."
//
// THE ONE PLACE THAT NOTE WAS WRONG, and it makes the repair one field bigger
// than it asked for. It says "the block already carries its instant". The
// block carried `on: '2026-11-02'`, a calendar day, plus
// `coverage.oldest_ts` and a `covered_hours`. A day cannot express a move that
// happens in twenty minutes, and the pair that looks like it could is not a
// read instant either: `covered_hours` is derived from the newest **row** the
// walk saw, so it lags the clock by however long the bus was quiet. Worked on
// the block as committed before this file: 717.67 hours past
// `2026-10-03T05:11:44.721Z` is `2026-11-02T02:51:56Z`, while the walk itself
// ran at about 03:21Z — which is the reporting seat's arithmetic and not this
// seat's record, since it read at 03:41Z and put twenty minutes between us.
// Twenty-nine minutes of quiet bus, invisible in the block. So `read_at` is now written
// from the clock at walk time, and `blockFaults` refuses a block whose
// `read_at` is absent, day-only, or earlier than the newest row it claims to
// have read.
//
// WHY DATING IS ENOUGH, measured rather than assumed, because "it is only a
// floor" is the kind of claim that stops being true quietly. The window is
// leading-edge dominated on this board: three walks at 720 hours on the night
// of 2026-11-02 gave 4,069 rows at 03:21Z, 4,155 at 03:41Z and 4,239 at
// 04:16Z, which is 2.4 rows a minute arriving, while dropping the window's
// oldest five hours (`--hours 715` against `--hours 720`, same minute) removed
// 4 rows and **zero** over-limit bodies, or 0.013 rows a minute leaving. A
// hundred and eighty to one. So on this board a dated count is a floor at
// every later instant, and the error has a sign a reader can use. That is a
// property of this traffic and not of the method, which is exactly why the
// sentence carries the instant: when the trailing edge starts shedding rows at
// the same rate the leading edge gains them, the sign goes away and nothing in
// the gate will announce it.
//
// AND WHY NOT A LIVE RECOMPUTE, stated so a later seat does not "fix" this by
// making it current. `violations` and `notices` are called before a write, by
// `tools/board/post.mjs`, on a seat's own machine, and they are the one gate
// in this directory that costs nothing and leaves no rows. A nine-page walk
// behind every refusal would make a 12-second network dependency out of a
// local check, and it would fail closed on a host with no board, which is the
// case `live-target.mjs` exists to keep out of the write path.

/** A real instant: date, time, UTC. `2026-11-02` is refused by this on
 *  purpose, because a calendar day is the granularity the drift above outran.
 *  Seconds and milliseconds are optional, since the walk's receipt prints
 *  seconds and a seat transcribing one by hand will not. */
export const INSTANT_RE = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.\d{1,3})?)?Z$/;

/** Is this a full UTC instant rather than a day or a local time?
 *  @param {unknown} s
 *  @returns {boolean} */
export function isInstant(s) {
  if (typeof s !== 'string' || !INSTANT_RE.test(s)) return false;
  return Number.isFinite(Date.parse(s));
}

/** The clause that dates a block, in one of the two forms a real block comes
 *  in, or null when it cannot be dated at all.
 *
 *  WHY THERE IS A SECOND FORM, and it arrived forty minutes after the first
 *  (`GRADED` in ./disposition.mjs, from `main` at 9c3c52dc). A block whose
 *  walk has already happened cannot be given a clock reading after the fact.
 *  What it can be given is a bound, and a bound is checkable: the low end is
 *  `oldest_ts` plus `covered_hours`, which is the newest ROW the walk saw and
 *  therefore the earliest the read can have been, and the high end is any
 *  later walk that counted more rows. Written as `read_at_bounded_between`,
 *  that is an interval a reader can verify from the two blocks, and it is
 *  honest in the one way a back-filled `read_at` is not: it says the clock
 *  reading was never taken.
 *
 *  A bounded block is cited "measured between A and B", with no age, because
 *  an age computed off an interval would be the thing this module exists to
 *  refuse, wearing a number.
 *  @param {object} block
 *  @param {Date|number|string} now
 *  @returns {{text: string, exact: boolean}|null} */
export function instantClause(block, now) {
  const b = block || {};
  if (isInstant(b.read_at)) {
    return { text: `measured on ${b.read_at}, ${agePhrase(ageHours(b, now))} before this check`, exact: true };
  }
  const bound = boundOf(b);
  if (bound) {
    return {
      text: `measured between ${bound[0]} and ${bound[1]}, by a walk whose clock reading was never recorded`,
      exact: false,
    };
  }
  return null;
}

/** The ordered pair of instants in `read_at_bounded_between`, or null if the
 *  field is absent, malformed or out of order.
 *  @param {object} block
 *  @returns {[string, string]|null} */
export function boundOf(block) {
  const v = (block || {}).read_at_bounded_between;
  if (!Array.isArray(v) || v.length !== 2) return null;
  if (!v.every(isInstant)) return null;
  return Date.parse(v[0]) <= Date.parse(v[1]) ? [v[0], v[1]] : null;
}

/** Everything wrong with a measured block, as the same `{code, line, repair}`
 *  shape `check.mjs` uses for a violation, so a caller can print one with the
 *  machinery it already has. Empty array means the block can be cited.
 *
 *  THE LAST TWO FAULTS ARE THE ONES WORTH HAVING, and they are one guard in
 *  two halves. `READ_AT_BEFORE_NEWEST_ROW` fires when a block claims a read
 *  instant earlier than the newest row it says it read, which is the shape a
 *  seat produces by back-filling `read_at` from `covered_hours` instead of
 *  from the clock: wrong by exactly the length of the quiet period before the
 *  walk, which was twenty-nine minutes on the block this file replaced.
 *  `COVERAGE_WITHOUT_NEWEST_ROW` fires when the block reports coverage but no
 *  newest row, because that is the state in which the first guard cannot
 *  fire at all. A back-fill then reads as a recorded instant and nothing can
 *  tell them apart, which is how the committed block got away with it.
 *  @param {{read_at?: unknown, on?: unknown, coverage?: {newest_ts?: string, complete?: boolean}}} block
 *  @returns {{code: string, line: string, repair: string}[]} */
export function blockFaults(block) {
  const out = [];
  const b = block || {};
  const bounded = boundOf(b);
  if (b.read_at_bounded_between !== undefined && !bounded) {
    out.push({
      code: 'BOUND_NOT_TWO_ORDERED_INSTANTS',
      line: `a block's read instant is bounded by ${JSON.stringify(b.read_at_bounded_between)}, which is not two UTC instants in order`,
      repair: 'write `read_at_bounded_between: [low, high]`, low first. The low end is `oldest_ts` plus `covered_hours`, the newest row the walk saw; the high end is the earliest later walk known to have counted more rows',
    });
  }
  if (bounded) return out;
  if (!isInstant(b.read_at)) {
    out.push({
      code: b.read_at === undefined ? 'READ_AT_ABSENT' : 'READ_AT_NOT_AN_INSTANT',
      line: `a measured block quoted to a seat carries ${JSON.stringify(b.read_at ?? null)} as its read instant, and a count that cannot say when it was read is quoted in the present tense whether or not it means to be`,
      repair: 'write `read_at` from the clock at walk time, as YYYY-MM-DDTHH:MM(:SS)Z. The walk prints it: `node tools/board/measure-claims.mjs --hours 720 --json` puts the request instant in `coverage.newest_ts` and the shell gives you the other half with `date -u +%FT%TZ`',
    });
  }
  const newest = b.coverage && b.coverage.newest_ts;
  if (b.coverage && !(typeof newest === 'string' && Number.isFinite(Date.parse(newest)))) {
    out.push({
      code: 'COVERAGE_WITHOUT_NEWEST_ROW',
      line: 'the block reports its coverage without the timestamp of the newest row the walk saw, so nothing in it can check the read instant against the evidence',
      repair: 'copy `coverage.newest_ts` from the walk\'s own receipt: `node tools/board/measure-claims.mjs --hours 720 --json` prints it. Without it a back-filled `read_at` is indistinguishable from a recorded one, which is the fault below',
    });
  }
  if (isInstant(b.read_at) && typeof newest === 'string' && Number.isFinite(Date.parse(newest))
      && Date.parse(b.read_at) < Date.parse(newest)) {
    out.push({
      code: 'READ_AT_BEFORE_NEWEST_ROW',
      line: `the block says it was read at ${b.read_at} and that the newest row it read is stamped ${newest}, so the read precedes its own evidence`,
      repair: 'this is what back-filling `read_at` from `covered_hours` produces, because `covered_hours` ends at the newest row and not at the clock. Take the instant from the clock at walk time instead',
    });
  }
  return out;
}

/** How old a block is at a given instant, in hours, negative if the clock is
 *  behind it.
 *  @param {{read_at: string}} block
 *  @param {Date|number|string} now
 *  @returns {number} */
export function ageHours(block, now) {
  const t = now instanceof Date ? now.getTime() : (typeof now === 'number' ? now : Date.parse(now));
  return (t - Date.parse(block.read_at)) / 3_600_000;
}

/** The age in words, at the granularity that makes the drift legible. Minutes
 *  under two hours, because the drift this file exists for happened in twenty;
 *  hours under two days; days beyond that.
 *  @param {number} hours
 *  @returns {string} */
export function agePhrase(hours) {
  if (!Number.isFinite(hours)) return 'an unknown interval';
  const h = Math.abs(hours);
  const unit = h < 2 ? [Math.round(h * 60), 'minute'] : h < 48 ? [Math.round(h), 'hour'] : [Math.round(h / 24), 'day'];
  const [n, word] = unit;
  const phrase = `${n} ${word}${n === 1 ? '' : 's'}`;
  return hours < 0 ? `${phrase} in the future` : phrase;
}

/** The dated, past-tense sentence a gate prints instead of a count.
 *
 *  Shape: "of the N over-limit bodies in the 720 hours to <instant>, A were
 *  notes and B dones against C asks (measured <age> before this check;
 *  re-derive with <command>)".
 *
 *  Every verb is past tense and the instant is inside the clause the counts
 *  are in, which is the whole point: a seat reading this a week from now reads
 *  a measurement with a date on it rather than a claim about tonight.
 *
 *  Returns null when the block cannot be cited, so a caller can drop the
 *  clause rather than print a broken one. `blockFaults` says why.
 *  @param {object} block a `MEASURED`-shaped block
 *  @param {Date|number|string} now
 *  @returns {{sentence: string, instant: string, age_hours: number, age: string}|null} */
export function citedCounts(block, now) {
  if (blockFaults(block).length) return null;
  const clause = instantClause(block, now);
  if (!clause) return null;
  const k = block.by_kind || {};
  const age = ageHours(block, now);
  const to = clause.exact ? block.read_at : boundOf(block)[1];
  const sentence = `of the ${block.over_limit} over-limit bodies in the ${block.window_hours} hours to ${to}, ${k.note} were notes and ${k.done} dones against ${k.ask} asks`
    + ` (${clause.text}; re-derive with \`node tools/board/measure-claims.mjs --hours ${block.window_hours}\`)`;
  return { sentence, instant: clause.exact ? block.read_at : null, age_hours: clause.exact ? age : null, age: clause.exact ? agePhrase(age) : null, exact: clause.exact };
}

/** Where a count reaches a seat without its instant.
 *
 *  A LINT AND NOT A GATE ON TRAFFIC, so it is worth saying what it can and
 *  cannot see. It reads source text and finds interpolations of the measured
 *  block into template literals, which is the one form that put an undated
 *  count into a seat's output and the only form that is mechanically
 *  recognisable. It does not read prose: this repository had the same count
 *  written three times in three comments with two different values on
 *  2026-11-02, and the guard for that is a corpus this file does not have.
 *  `docs/ideas.md` carries that as its own entry.
 *  @param {string} source the file's text
 *  @param {string} [name] the identifier the block is imported under
 *  @returns {{code: string, line: string, repair: string, at: number}[]} */
export function undatedQuotations(source, name = 'MEASURED') {
  const out = [];
  const lines = String(source).split('\n');
  const re = new RegExp(`\\$\\{[^}]*\\b${name}\\.`);
  lines.forEach((text, i) => {
    if (!re.test(text)) return;
    out.push({
      code: 'UNDATED_COUNT_QUOTED',
      line: `line ${i + 1} interpolates \`${name}\` straight into a string: ${text.trim().slice(0, 120)}`,
      repair: `render it through \`citedCounts(${name}, now)\` in ./measured-citation.mjs, which carries the read instant and the age, or quote the instant yourself in the same clause as the number`,
      at: i + 1,
    });
  });
  return out;
}
