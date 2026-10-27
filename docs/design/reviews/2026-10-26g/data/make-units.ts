/**
 * Put tuning units into a review store, through the shipped code.
 *
 * WHY. The dashboard draws three sections only when the store has units
 * in it: "What Ursa has concluded about you", "Two things that cannot
 * both be you", and "Withdrawn, and kept as the receipt". None has ever
 * been in a frame or under a probe, because every review store has been
 * a fresh `ursa run` with no interpretation pass behind it, and the
 * 2026-10-26e review said so and left it to this run. The axiom
 * disclosures inside those sections hold the longest command block this
 * product prints, `ursa consent revoke-axiom <your project> --axiom
 * ax-00N`, and nothing has ever measured it.
 *
 * WHY NOT `tuning/cli.ts distill`. That runs `claude -p` over a record
 * and returns a model's judgement, which is both a cost and a different
 * answer every time, and a review frame that differs from itself is the
 * thing `lib/freeze.mjs` exists to stop.
 *
 * WHAT IS AUTHORED AND WHAT IS NOT, which is the only part that governs
 * what may be concluded from a frame taken through this. The division is
 * the one `tuning/types.ts` states as load-bearing: the model infers the
 * why, the code does all the arithmetic. So this file supplies the
 * model's half — a `DistillOutput`, which is statements, domains,
 * polarities and evidence pointers — and hands it to the shipped
 * `mergeDistill`, which assigns the ids, counts the evidence, sets
 * firstSeen and lastSeen, and wires `contradicts` symmetrically. The
 * revocation is the shipped `revokeAxiom`. Nothing here writes a
 * `TuningAxiom` by hand.
 *
 * So a frame taken through this is evidence about geometry, wrapping,
 * contrast and reachability, and it is not evidence about what any real
 * interpretation pass concludes. The statements are written to be
 * plausible and boring on purpose.
 *
 *   npx tsx ../docs/design/reviews/2026-10-26g/data/make-units.ts <storePath>
 *   (from ursa-major/, which is where tsx lives)
 */
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { emptyTuning, mergeDistill } from '../../../../../ursa-major/src/tuning/merge'
import { revokeAxiom } from '../../../../../ursa-major/src/tuning/revoke'
import type { DistillOutput } from '../../../../../ursa-major/src/tuning/types'
import type { OutcomeRecord } from '../../../../../ursa-major/src/types'

const store = process.argv[2]
if (!store) throw new Error('needs the store path')
const recordsDir = join(store, '.ursa', 'records')

// Real record ids out of the review store, so every evidence pointer
// joins back to a record that exists. An axiom without evidence is
// invalid by construction and an axiom whose evidence points nowhere is
// worse, because it looks valid.
const ids = readdirSync(recordsDir).filter((f) => f.endsWith('.json')).sort()
if (ids.length < 3) throw new Error(`needs at least 3 records, found ${ids.length}`)
const records = ids.slice(0, 3).map(
  (f) => JSON.parse(readFileSync(join(recordsDir, f), 'utf8')) as OutcomeRecord,
)

// The model's half, one DistillOutput per record. Written to exercise
// every shape the dashboard draws differently: a long statement and a
// short one, both polarities, all three bases, a pair that contradicts
// each other so the tension section is drawn, and one that is revoked
// afterwards so the tombstone section is.
const passes: DistillOutput[] = [
  {
    axioms: [
      {
        statement: 'Say what a number is a fact about before reporting it, because a measurement taken on one host is not a property of the repository',
        domain: 'process', polarity: 'prefer', basis: 'stated',
        matchesExisting: null, contradicts: [],
        evidence: [{ kind: 'correction-loop', ref: 'loop-1', steps: [4, 9], quote: 'that number is about your sandbox, not about the app' }],
      },
      {
        statement: 'Never introduce a colour into the black and white palette',
        domain: 'visual', polarity: 'avoid', basis: 'stated',
        matchesExisting: null, contradicts: [],
        evidence: [{ kind: 'one-shot-correction', ref: 'step-12', steps: [12], quote: 'no colour' }],
      },
      {
        statement: 'Prefer the smallest safe diff over a rewrite',
        domain: 'engineering', polarity: 'prefer', basis: 'tacit',
        matchesExisting: null, contradicts: ['Replace a surface outright when its shape is wrong, rather than patching around it'],
        evidence: [{ kind: 'regression', ref: 'step-3', steps: [3] }],
      },
      {
        statement: 'Replace a surface outright when its shape is wrong, rather than patching around it',
        domain: 'engineering', polarity: 'prefer', basis: 'tacit',
        matchesExisting: null, contradicts: ['Prefer the smallest safe diff over a rewrite'],
        evidence: [{ kind: 'feedback-translation', ref: 'step-8', steps: [8] }],
      },
    ],
  },
  {
    axioms: [
      {
        statement: 'Say what a number is a fact about before reporting it, because a measurement taken on one host is not a property of the repository',
        domain: 'process', polarity: 'prefer', basis: 'tacit',
        matchesExisting: 'ax-001', contradicts: [],
        evidence: [{ kind: 'correction-loop', ref: 'loop-2', steps: [6] }],
      },
      {
        statement: 'Open the pull request before doing the work, not after',
        domain: 'process', polarity: 'prefer', basis: 'stated',
        matchesExisting: null, contradicts: [],
        evidence: [{ kind: 'defensive-guardrail', ref: 'step-1', steps: [1], quote: 'ship first, then work' }],
      },
    ],
  },
  {
    axioms: [
      {
        statement: 'Say what a number is a fact about before reporting it, because a measurement taken on one host is not a property of the repository',
        domain: 'process', polarity: 'prefer', basis: 'stated',
        matchesExisting: 'ax-001', contradicts: [],
        evidence: [{ kind: 'episode', ref: 'episode', steps: [2] }],
      },
      {
        statement: 'Use an em dash where a comma would do',
        domain: 'copy', polarity: 'prefer', basis: 'tacit',
        matchesExisting: null, contradicts: [],
        evidence: [{ kind: 'regression', ref: 'step-5', steps: [5] }],
      },
    ],
  },
]

let tuning = emptyTuning('review-fixture')
for (const [i, pass] of passes.entries()) {
  tuning = mergeDistill(tuning, pass, records[i], 'claude-sonnet-5', `2026-10-2${4 + i}T10:00:00.000Z`)
}

// One withdrawal, through the shipped path, so the tombstone section is
// drawn by the same code that draws it for a real user.
const out = join(store, '.ursa', 'tuning.json')
if (existsSync(out)) throw new Error(`${out} already exists; this writes a fixture and will not overwrite one`)
writeFileSync(out, JSON.stringify(tuning, null, 2) + '\n')

// `revokeAxiom` reads and writes the file, which is why the write above
// comes first. The em-dash axiom is the one withdrawn, which is also
// true of this house.
const emDash = tuning.axioms.find((a) => a.statement.startsWith('Use an em dash'))
if (!emDash) throw new Error('expected the em-dash axiom to exist')
tuning = revokeAxiom(out, emDash.id, '2026-10-26T10:00:00.000Z')
console.log(`${out}: ${tuning.axioms.length} axioms, ${tuning.axioms.filter((a) => a.status === 'revoked').length} revoked, ${tuning.axioms.filter((a) => a.contradicts.length > 0).length} in tension`)
for (const a of tuning.axioms) console.log(`  ${a.id}  ${a.status.padEnd(11)} ×${a.evidenceCount}  ${a.contradicts.length ? `contradicts ${a.contradicts.join(',')}  ` : ''}${a.statement.slice(0, 50)}`)
