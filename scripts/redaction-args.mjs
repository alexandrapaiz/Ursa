// Which arguments `scripts/redaction-check.mjs` cannot honour, as a pure
// function.
//
//   import { argumentFault, KNOWN_FLAGS } from './redaction-args.mjs'
//
// WHY IT IS A SEPARATE FILE. `redaction-check.mjs` calls `run()` at module
// scope and `run()` ends in `process.exit`, so importing it to ask this
// question runs a whole scan and then kills the asking process. There was no
// way to unit-test the classifier from inside the suite: a first attempt at
// this fix imported the script and the suite reported 1 test instead of 29,
// because the import exited the test runner before the rest were collected.
// This is the same split `tools/board/live-target.mjs` is out of
// `tools/board/post.mjs` ("importing it posts a message"),
// `scripts/dep-floor-summary.mjs` out of `scripts/dep-floor.mjs`, and
// `tools/ledger/block-kinds.mjs` out of `tools/ledger/check.mjs`.
//
// WHY THE GUARD EXISTS AT ALL. An argument the checker does not know used to
// fall through every mode test and run a WORKING-TREE scan at exit 0. This is
// the mirror of the hole `tools/secret-scan.mjs` closed on 2026-11-02 in
// commit 2c2c467e, and that commit's own comment names `redaction-check.mjs`
// as the reason its typo was plausible: the two tools run in the same sweep
// and spell the same idea differently. What nobody checked that day is the
// direction the traffic actually runs in. Measured before this fix:
//
//   node tools/secret-scan.mjs       --histroy=all   exit 2, names the argument
//   node scripts/redaction-check.mjs --histroy=all   exit 0, "Redaction gate clean"
//
// So the hardened tool refuses and the unhardened one answers, and the answer
// it prints is the clean line for a tree scan handed to a caller who asked
// about history. This file's surface is the wider of the two, because
// `--history`, `--history=<ref>` and `--history=all` are three different
// scopes here against the scanner's one, and the mode test is a single
// `flag('history') ?? argv.includes('--history')`. Anything that misses both
// reaches the tree with nothing said.
//
// The history mode is how this seat answers whether a private value is
// readable in a public repository. A tree scan answers a different question
// and prints the same sentence, so a silent downgrade does not produce a
// wrong number. It produces a right number about the wrong thing.

/** Every flag the checker knows. Three are test seams; see its header. */
export const KNOWN_FLAGS = ['history', 'json', 'root', 'workflow', 'stream-budget'];

const BUDGET = '--stream-budget=';

/**
 * @param {string[]} args argv past the script name.
 * @returns {null | {bad: string[], why: string, detail: string}} null when
 *   every argument is one this checker knows and carries a usable value.
 */
export function argumentFault(args) {
  const unknown = args.filter((a) => {
    if (!a.startsWith('--')) return true;
    return !KNOWN_FLAGS.includes(a.replace(/^--/, '').split('=')[0]);
  });

  // A BUDGET THAT CANNOT TRIP IS NOT A FALLBACK, it is the crash it was built
  // to prevent, restored and silent. `Number('abc')` is NaN, `bytes >= NaN` is
  // always false, so the batch in `scanHistory` never flushes and the function
  // rebuilds the single joined string that threw `RangeError: Invalid string
  // length` at exit 1 on 2026-11-02 — which, because exit 1 on this tool means
  // "the tree is dirty", a reader could not tell from a finding. That is what
  // commit 8381f533 exists to prevent, and a guard a typo switches off is not
  // a guard. Non-positive is refused for the same reason in reverse: it is not
  // a crash, but it is not a budget either, and the caller should hear so.
  const budget = args.find((a) => a.startsWith(BUDGET));
  const budgetBad = [];
  if (budget !== undefined) {
    const n = Number(budget.slice(BUDGET.length));
    if (!Number.isFinite(n) || n <= 0) budgetBad.push(budget);
  }

  const bad = [...new Set([...unknown, ...budgetBad])];
  if (bad.length === 0) return null;
  return {
    bad,
    why:
      `${bad.length} argument(s) this checker does not know or cannot use, `
      + 'so the scope it would have run is not the scope that was asked for',
    detail:
      `${bad.join(' ')} — it takes ${KNOWN_FLAGS.map((f) => `--${f}`).join(', ')}. `
      + 'History is --history (HEAD), --history=<ref> (one ref) or --history=all '
      + '(every ref); anything that misses all three runs a TREE scan and says nothing. '
      + '--stream-budget takes a positive number of bytes. '
      + "This checker's --history takes a value; tools/secret-scan.mjs's does not.",
  };
}
