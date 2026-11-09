import { existsSync } from 'node:fs'
// The kit's producer-side code for `I never reached my subject`. Imported
// rather than restated so the two cannot drift apart.
import { UNREACHED } from './reached.mjs'

// A selftest is a RE-ENCODING consumer of the tool it tests, and this is the
// slot its vocabulary was missing.
//
// WHY THIS EXISTS. `lib/reached.mjs` beside it makes every instrument here
// say, in a status and in words, that it never reached its subject. That
// repair is about the PRODUCER. Ursa's security seat sent the consumer half
// on 2026-11-09, out of its own F138: there is a third kind of consumer, and
// neither of the two channels reached it. A forwarding consumer passes the
// status and the prose along. A substituting consumer takes stdout as a value.
// A RE-ENCODING consumer translates the result into a different vocabulary,
// and a refusal dies in the translation whenever that vocabulary has no word
// for it. Its instance was `scripts/ci-checks.mjs`, which turned each gate's
// exit code into a state word and had none for a refusal, so a gate printing
// NO VERDICT at exit 3 was summarised as `failed` with aggregate 1, and 1
// means ran-and-failed, which is a claim about the branch.
//
// This kit's selftests are that kind. Each one spawns a tool, reads the
// tool's own JSON, and translates the outcome into `ok` / `FAIL` plus one
// aggregate status, whose contract every one of them states in its header:
// exit 0 on pass, 1 on fail, and it says which expectation missed. There was
// no third word.
//
// MEASURED 2026-11-09 (run ac), in a scratch copy of the kit with each
// subject replaced by its own refusal arm: a tool printing the real
// `NOT MEASURED` and `NO VERDICT` lines on stdout and exiting
// `UNREACHED`. Three selftests, three different ways to lose it, and the
// same wrong answer out of all three:
//
//   check-contrast.mjs    exit 1, `Error: measure-contrast.mjs exited 2`
//   check-hit-areas.mjs   exit 1, `Error: measure-hit-areas.mjs exited 2`
//   check-focus.mjs       exit 1, an ENOENT stack trace for the JSON the
//                         subject never wrote, which does not mention the
//                         status at all
//
// Zero of the three carried the string `NO VERDICT` anywhere in their
// output. The first two spawn with `stdio: 'ignore'`, so the refusal prose
// was destroyed at the consumer rather than merely untranslated: both
// channels the producer was given died here, which is one worse than the
// instance security measured, where the log at least carried the words.
//
// And exit 1 out of a selftest is not a neutral non-zero. It is that file's
// own code for `an expectation missed`, which is a claim about the
// INSTRUMENT being broken, published at the moment the instrument was the
// one thing that behaved correctly.
//
// THE REPAIR IS A SLOT, NOT A STREAM. Capturing the subject's output is
// worth doing and it is not the fix; the fix is a third state word with an
// aggregate of its own, and that word has to OUTRANK `FAIL`, because a run
// that established nothing cannot also have found something.
//
// 2, for the same reason `UNREACHED` is 2 one file over. In a selftest 0 and
// 1 are spent on pass and fail and nothing else is, and the README's rule for
// this kit is already that 2 is the not-a-verdict code. `tools/board/` uses 3
// because 1 and 2 are spent there; that divergence is recorded in the README
// and this follows the kit's half of it.
export const NO_VERDICT = 2

// Call this on a subject's result BEFORE reading anything the subject was
// supposed to produce, which is the ordering that matters: `check-focus.mjs`
// held the status in a variable and then parsed the JSON first, so the
// refusal became an ENOENT about the consumer's own tmpdir.
//
//   const { status, out } = spawnSubject(...)
//   requireVerdict('measure-contrast.mjs', status, { out, json })
//   const rows = JSON.parse(readFileSync(json, 'utf8'))
//
// Returns normally when the subject produced a verdict, so the caller's
// expectations run exactly as before. Otherwise it prints the refusal in the
// slot a reader scans, forwards whatever the subject said about it, and
// exits NO_VERDICT. It does not throw: a throw here is caught by the
// caller's own try/finally and re-encoded into 1, which is the fault.
export function requireVerdict(tool, status, { out = '', json = null, cleanup = null } = {}) {
  const refused = status === UNREACHED
  // A subject that exited 0 and wrote no result is the same fault one level
  // in: nothing to measure, and a reader of `0` would call that a pass.
  const missing = json !== null && !existsSync(json)
  if (!refused && !missing) return

  const why = refused
    ? `${tool} exited ${UNREACHED}, which is this kit's code for a subject it never reached`
    : `${tool} exited ${status} and wrote no ${json}, so there is no result to hold it to`
  console.log('')
  console.log(`NO VERDICT: ${why}, so this selftest asserted nothing and makes no claim about ${tool}.`)
  console.log(`It is not a failed expectation. Exit ${NO_VERDICT} means no verdict; exit 1 from this file means an expectation missed.`)
  const said = String(out || '').trim()
  // The subject's own words, forwarded rather than summarised, because it is
  // the only party that knows WHICH premise was missing.
  if (said) {
    console.log(`\nwhat ${tool} said:`)
    for (const line of said.split('\n')) console.log(`  ${line}`)
  } else {
    console.log(`\n${tool} said nothing on either channel, so the premise it was missing is not recorded.`)
  }
  if (cleanup) { try { cleanup() } catch {} }
  process.exit(NO_VERDICT)
}
