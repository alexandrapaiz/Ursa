// Establishing a ledger gate's GROUND, and refusing in one voice when it is
// not there.
//
//   import { readGround, requireEntries, refuse, NO_VERDICT } from './ground.mjs'
//
// WHY THIS FILE EXISTS, measured 2026-11-09 by Ursa's security seat, from two
// rows Ursa's exo seat sent this lane after running a premise-removal over all
// 62 gate-registry candidates.
//
// `tools/gates/verdict-shape.mjs` already states the distinction this file
// enforces, in its `derivedFrom` paragraph: a FINDINGS verdict says "the thing
// I checked is defective", and a GROUND verdict says "I could not establish
// the facts". Three of the twelve gates that had been extracted onto that
// shape did not have the second kind at all.
//
//   check-attributes.mjs  an absent `tools/ledger/drivers.json` printed
//                         `no driver registry at <path>` and exited 1, which
//                         is also the code its own `verdict()` returns for a
//                         clone-locus finding.
//   check-blockers.mjs    an absent `docs/ideas.md` threw out of `node:fs:440`
//   check-closures.mjs    the same, and the stack trace is the whole output.
//
// A premise failure wearing the findings code is not merely untidy. It routes
// the repair to the wrong person: exit 1 from `check-attributes` tells a
// reader to go fix a merge-attribute declaration, and the actual repair is to
// finish the checkout. An uncaught `ENOENT` is worse again, because a stack
// trace out of `node:fs` reads as a defect in the gate, and the ordinary
// response to a gate that crashes is to stop running it.
//
// AND THE DIRECTION THAT WAS WORSE THAN EITHER. The same sweep, pushed one
// step further on this seat's own axis, found `check-closures.mjs` printing
//
//   Closure backlinks: 0 closure marker(s) in 0 document(s), against
//   docs/ideas.md, all resolved and all closed. Exit 0.
//
// over a `docs/ideas.md` holding zero bytes, with `scripts/ci-checks.mjs`
// registering it at `passExit: [0, 2]`. The gate whose job is to catch a
// document claiming it closed a ledger entry that is still open goes green,
// in CI, when the ledger it checks against parses to nothing. `all resolved`
// is true of the empty set and says nothing about this repository, and no
// reader of that line can tell the two apart.
//
// `docs/ideas.md` held 602 entries when this was written, so zero is never a
// legitimate reading of it. That is the same argument `tools/secret-print-
// sweep.sh` already makes in its own words -- "found no files to scan, which
// is a bug in this script and not a clean result" -- and this file is that
// sentence, moved to where the ledger gates can reach it.
//
// WHY ONE MODULE AND NOT THREE GUARDS. HQ's exo-centralizer seat reported to
// this lane on 2026-11-09 that two charters each carrying its own copy of one
// recipe is a defect in the charters rather than three defects to repair, and
// the repair was one edit in the shared standard. The same reasoning applies a
// level down: a refusal that three gates each phrase for themselves drifts in
// three directions, and the enumerator in `tools/gates/enumerate-verdicts.mjs`
// then has three shapes to recognise instead of one.

import { readFileSync } from 'node:fs'

/**
 * The exit code for "I could not establish the facts". Not 1 and not 2,
 * because a ledger gate's `verdict()` already returns both of those for
 * findings. The code is the house's: `tools/board/bypass.mjs`,
 * `tools/board/post-verdict.mjs` and `tools/seat/spend.mjs` all use 3 for a
 * refusal, HQ's `docs/standards/lessons.md` names it, and
 * `tools/gates/enumerate-verdicts.test.mjs` already asserts a gate can carry
 * one.
 */
export const NO_VERDICT = 3

/**
 * A refusal, in the one voice. Prints to stderr, prints nothing to stdout, and
 * exits `NO_VERDICT`.
 *
 * Stdout is left empty deliberately. A reader and a CI log both scan stdout
 * for the verdict line, so a refusal that prints a sentence there is a
 * sentence in the slot a verdict occupies.
 *
 * AND THE STREAM IS NOT THE RULE, which is Ursa's frontend seat's correction
 * to this lane, sent 2026-11-09 and taken. That seat found five of its six
 * instruments exiting 1 on an empty stdout with a node stack trace, which is
 * the same defect this file repairs, and then diverged on both halves of the
 * remedy for stated reasons. On the stream it is right and this paragraph
 * states what the sentence above left implicit: the discriminator is the
 * CHANNEL KIND, not the gate's preference. Where stdout is a value, read
 * through `$(cmd)`, every byte is the value, so a refusal must print nothing
 * there. Where stdout is a report, silence reads as a tool that never ran,
 * and the refusal belongs in the headline. Ursa's exo seat had sent that seat
 * the opposite requirement the same morning, and both are right about
 * different consumers. What holds either way is the property and not the
 * rule: the verdict slot carries the refusal and never a number computed over
 * nothing.
 *
 * These gates are value-channel-adjacent and stay silent on stdout, because
 * `scripts/ci-checks.mjs` runs them with `stdio: 'inherit'` and its own
 * `=== title ===` line is the report. There is a third kind of consumer,
 * found while writing this (F138): one that RE-ENCODES the result rather than
 * forwarding it. For that one neither stream saves you, because the refusal
 * is lost in the translation; it needs a slot, which `noVerdict` in
 * `scripts/ci-checks.mjs` now is.
 *
 * On the exit code, same seat, declined and rightly. 3 is this repository's
 * because 1 and 2 are spent on findings here; that seat's gates return 0 for
 * every verdict about the site and read findings out of JSON, so 2 is free
 * there and taking 3 would have left it with two no-verdict codes where it
 * had one. The number is local. The property is not.
 *
 * @param {string} gate the gate's own name, for the prefix
 * @param {string} why what could not be established, and the repair
 * @returns {never}
 */
export function refuse(gate, why) {
  console.error(`${gate}: NO VERDICT (exit ${NO_VERDICT}). ${why}`)
  process.exit(NO_VERDICT)
}

/**
 * Read a file the gate cannot work without, or refuse naming it.
 *
 * @param {string} gate the gate's own name
 * @param {string} path the path to read
 * @param {string} what what this file is to the gate, in a clause
 * @returns {string} the file's contents
 */
export function readGround(gate, path, what) {
  try {
    return readFileSync(path, 'utf8')
  } catch (err) {
    refuse(
      gate,
      `cannot read ${path}, which is ${what}: ${err.code ?? err.message}. `
      + `This is not a finding about anything in the tree; it is this gate `
      + `being unable to ask. Check the checkout before reading any number `
      + `from this gate.`,
    )
  }
}

/**
 * A count that must not be zero, or refuse.
 *
 * The argument this encodes: a gate's clean verdict is a statement about a
 * population, and over the empty population every such statement is
 * vacuously true. So a population of zero is a premise failure wherever the
 * gate cannot also be certain that empty is a real state of the world.
 *
 * @param {string} gate the gate's own name
 * @param {number} n the count read
 * @param {string} what the population, named as a plural noun phrase
 * @param {string} from where it was read from
 * @returns {number} `n`, when it is not zero
 */
export function requireEntries(gate, n, what, from) {
  if (n > 0) return n
  refuse(
    gate,
    `read 0 ${what} from ${from}. Zero is not a clean result here: every `
    + `verdict this gate can print is vacuously true of the empty set, so a `
    + `green would say nothing about this repository and would be `
    + `indistinguishable from one that had checked it. Either ${from} is not `
    + `the file this gate was pointed at, or it did not parse.`,
  )
}
