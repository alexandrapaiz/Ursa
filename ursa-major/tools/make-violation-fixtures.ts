// How `fixtures/violations/` was derived. Run once, by hand, to add a case.
//
//   npx tsx tools/make-violation-fixtures.ts          # write every fixture
//   npx tsx tools/make-violation-fixtures.ts --check   # fail if any drifted
//
// Why a script and not fifteen hand-typed JSON files. The fixtures ARE the
// artifact: `src/invariants.violations.test.ts` reads only the committed
// `.json` and `.md` files and never imports this module, so a fixture that
// stops firing is a test failure whether or not this script still runs. What
// the script buys is that the base record is produced by `resolve()` rather
// than typed, so each counterexample is one named edit away from a record the
// resolver really wrote, and the edit is reviewable as a two-line diff
// against `base.json` instead of as an 8 KB file somebody has to read whole.
//
// Why the notes are generated rather than written. Each `.md` quotes the
// `observed` string the gate itself produced, and the test asserts that
// string is still present in the note. A hand-written note drifts from the
// numbers the moment the record changes; a generated one cannot, and the
// test is what keeps the generation honest after this script stops being
// run.
//
// Ledger: "The record self-check can only be tested by replacing it, because
// no fixture is allowed to be wrong" (docs/ideas.md, 2026-10-10).

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { checkRecord, type InvariantCode } from '../src/invariants'
import { deriveSignals } from '../src/signals'
import { resolve } from '../src/resolve'
import type { Exclusion, OutcomeRecord } from '../src/types'

const OUT = join('fixtures', 'violations')

const r3 = (x: number) => Math.round(x * 1000) / 1000
const clone = (r: OutcomeRecord): OutcomeRecord => JSON.parse(JSON.stringify(r)) as OutcomeRecord

// ---------------------------------------------------------------------------
// The base record. Everything below is this record plus one named edit, so a
// reviewer reads the edit rather than the file.
//
// Built through `resolve()` on synthetic prose, then given the two structures
// a resolved chat-path record does not carry, because three of the fifteen
// bounds read nothing else: `signals` (SIGNAL_QUOTE_GROUNDED), a descent
// verdict per mutation label (DESCENT_CHECKED_UNIFORMLY), and one exclusion
// (EXCLUSION_NOT_CLASSIFIED). The signals come from `deriveSignals`, the real
// detector, and the exclusion goes through `resolve()`'s own input so
// `stats.perFile` gets the row the resolver would have written. Only the
// descent verdicts are attached by hand, because a corroborator needs a git
// repository and this record has none; `{ basis: 'corroborated' }` is the
// shape `src/corroborate.ts` emits when nothing outside the generation's
// descent holds the span's text.
// ---------------------------------------------------------------------------

const EXCLUDED: Exclusion = {
  path: 'docs/standards/pm.md',
  reason: 'imported_whole',
  sha: '96ed4e5',
  subject: 'standards: sync pm.md from HQ',
  relation: 'sibling',
  chars: 199,
}

function baseRecord(): OutcomeRecord {
  const generated = [
    'The information a decision needs is dispersed across many individuals.',
    'No single observer holds it whole, and a central grader pretends otherwise.',
    'This sentence is a draft that the person threw away entirely.',
  ].join('\n\n')
  const final = [
    'The information a decision needs is dispersed across many individuals.',
    'No single observer holds the whole of it, and a central grader pretends otherwise.',
    'A line the model was never in the running for.',
  ].join('\n\n')
  const record = resolve({
    taskId: 'violation-fixture-base',
    files: [{ path: 'notes.md', text: final }],
    conversations: [{
      id: 'c1', title: 'principles', adapter: 'paste', turns: 1, userTurns: 0,
    }],
    generations: [{
      conversationId: 'c1', model: 'test-model', turnIndex: 1,
      kind: 'assistant_text', text: generated,
    }],
    finished: true,
    generatedAt: '2026-10-10T00:00:00.000Z',
    exclusions: [EXCLUDED],
  })
  record.signals = deriveSignals(record)
  // `deriveSignals` stamps `annotatedAt` with wall-clock time, so a record
  // resolved twice from identical input is not byte-identical. Pinned to the
  // episode's own `generatedAt` here, because a fixture that changes every
  // time the script runs cannot be diffed and `--check` would always report
  // drift. The wider consequence — that a buyer cannot reproduce a record
  // byte-for-byte from its stated inputs — is a ledger entry, not something
  // to fix from a fixture script.
  record.signals.annotatedAt = record.task.generatedAt
  for (const f of record.files) {
    for (const s of f.spans) {
      if (s.class === 'survived_mutated') s.descent = { basis: 'corroborated', rivalsSearched: 3 }
    }
  }
  return record
}

// ---------------------------------------------------------------------------
// The cases. `codes` is the multiset of invariant codes the gate must emit on
// this fixture and nothing besides, declared here and re-asserted by the
// test. Where it holds more than one entry, `why` says why the bound cannot
// be violated on its own — three of the fifteen are backstops that are
// mathematically implied by their neighbours, which is a fact this exercise
// produced and no `toContain` assertion could have shown.
// ---------------------------------------------------------------------------

interface Case {
  slug: string
  codes: InvariantCode[]
  /** what was changed, in the shape a reviewer can check against the diff */
  edit: string
  /** what a record in this state is claiming, and why that claim is a defect */
  consequence: string
  /** present only when `codes` has more than one entry */
  why?: string
  break: (r: OutcomeRecord) => void
}

const firstVerbatim = (r: OutcomeRecord) =>
  r.files[0].spans.find((s) => s.class === 'survived_verbatim' && s.source)!
const firstMutated = (r: OutcomeRecord) =>
  r.files[0].spans.find((s) => s.class === 'survived_mutated')!

const CASES: Case[] = [
  {
    slug: 'claim-not-wider',
    codes: ['CLAIM_NOT_WIDER'],
    edit: 'the first `survived_verbatim` span\'s `source.end` pulled back to `source.start + 1`',
    consequence:
      'the span is byte-identical to the generation extent it names, and now names an extent one character long. Verbatim means the two extents describe the same characters, so the record credits the model with every character of the span while pointing at a single character as the evidence.',
    break: (r) => { const s = firstVerbatim(r); s.source!.end = s.source!.start + 1 },
  },
  {
    slug: 'claim-in-generation',
    codes: ['CLAIM_IN_GENERATION'],
    edit: 'the first sourced span\'s `source.generationIndex` set to 99, an index this record does not have',
    consequence:
      'the span claims descent from a generation that is not in the record. Nothing downstream can re-read the text it says it came from, so the provenance is an assertion rather than a pointer, and `GEN_CLAIM_BOUNDED` skips the generation entirely because there is no generation to bound against.',
    break: (r) => { r.files[0].spans.find((s) => s.source)!.source!.generationIndex = 99 },
  },
  {
    slug: 'gen-spans-partition-order',
    codes: ['GEN_SPANS_PARTITION_ORDER'],
    edit: 'nine characters appended to `generations[0].spans[0].text`, leaving `start` and `end` alone',
    consequence:
      'the generation segment carries text that is not the slice its own offsets name. Every per-segment fate is addressed by offset and read by text, so the two disagree about which characters the fate belongs to, and the extents still sum correctly so no character count notices.',
    break: (r) => { r.generations[0].spans[0].text += ' appended' },
  },
  {
    slug: 'gen-chars-consistent',
    codes: ['GEN_CHARS_CONSISTENT'],
    edit: '`generations[0].separatorChars` raised by 10',
    consequence:
      'the generation claims more characters between its segments than it has. Separator characters are generated, sit in no segment and therefore carry no fate, so they are the quantity the 2026-10-04 defect hid inside: an inflated separator count is an inflated denominator for everything the generation is said not to have written.',
    break: (r) => { r.generations[0].separatorChars += 10 },
  },
  {
    slug: 'gen-survived-bounded',
    codes: ['GEN_SURVIVED_BOUNDED'],
    edit: '`generations[0].survivedChars` raised one above `totalChars`, with `survivalRate` recomputed from it so the stored rate still matches its own arithmetic',
    consequence:
      'more characters of the generation survive than the generation put inside segments. This is the 2026-10-04 defect in miniature, and the recomputed rate is why it is worth a fixture: every field is internally consistent, the percentage reads as correct, and the subset relation it is a percentage of is false.',
    break: (r) => {
      const g = r.generations[0]
      g.survivedChars = g.totalChars + 1
      g.survivalRate = r3(g.totalChars ? g.survivedChars / g.totalChars : 0)
    },
  },
  {
    slug: 'gen-claim-bounded',
    codes: ['CLAIM_IN_GENERATION', 'GEN_CLAIM_BOUNDED'],
    edit: 'the first sourced span\'s `source.end` pushed 400 characters past the end of the generation text',
    consequence:
      'final spans claim, between them, more distinct characters of one generation than that generation ever wrote. This is the shape of the figure that started the gate: a survival total larger than the generation total it is a share of.',
    why:
      'GEN_CLAIM_BOUNDED cannot fire alone. Claimed characters are the merged length of source extents; CLAIM_IN_GENERATION holds every extent inside `[0, text.length)` and GEN_CHARS_CONSISTENT holds `charsWritten === text.length`, so while those two pass, the merged length is bounded by `charsWritten` as a matter of arithmetic. Violating it requires violating one of them first, and reaching past the end of the generation is the cheaper of the two. The bound is a backstop against the other two being wrong, not an independent statement, and that is worth knowing before anyone tries to test it in isolation.',
    break: (r) => {
      const s = r.files[0].spans.find((x) => x.source)!
      s.source!.end = r.generations[s.source!.generationIndex].text.length + 400
    },
  },
  {
    slug: 'deletion-split-exact',
    codes: ['DELETION_SPLIT_EXACT'],
    edit: '`stats.generated.humanDeletedChars` raised by 5, with `humanDeletedPct` recomputed from it',
    consequence:
      'the three-way split of deleted characters no longer adds up to the characters deleted. The record attributes five characters of discard to the person that nothing deleted, and because the rate was recomputed alongside, the share a buyer reads is a real ratio of a number that is not real.',
    break: (r) => {
      const g = r.stats.generated
      g.humanDeletedChars += 5
      g.humanDeletedPct = r3(g.totalChars ? g.humanDeletedChars / g.totalChars : 0)
    },
  },
  {
    slug: 'final-spans-in-file',
    codes: ['FINAL_SPANS_IN_FILE'],
    edit: 'one character appended to `files[0].spans[0].text`, leaving `start` and `end` alone',
    consequence:
      'the classified span carries text that is not the slice of the finished file its offsets name. The class label is attached to the offsets and the evidence a reader checks is the text, so the record labels one extent and displays another. The extents are untouched, so `coveredChars` and every percentage built on it still reconcile.',
    break: (r) => { r.files[0].spans[0].text += 'x' },
  },
  {
    slug: 'covered-bounded',
    codes: ['COVERED_BOUNDED'],
    edit: '`stats.coveredChars` raised by 3, with all three `byClass[].pct` values recomputed against the new denominator',
    consequence:
      'the classified character count is not the sum of the extents it claims to be. Three characters of the finished work are counted as classified that no span covers, which moves every class share downward by a hair and makes the unclassified remainder look smaller than it is.',
    break: (r) => {
      const st = r.stats
      st.coveredChars += 3
      for (const c of ['survived_verbatim', 'survived_mutated', 'no_generation_provenance'] as const) {
        st.byClass[c].pct = r3(st.coveredChars ? st.byClass[c].chars / st.coveredChars : 0)
      }
    },
  },
  {
    slug: 'rates-match-fields',
    codes: ['RATES_MATCH_FIELDS'],
    edit: '`generations[0].survivalRate` overwritten with 0.5',
    consequence:
      'the stored rate is not its own numerator over its own denominator. Every consumer of this record either recomputes the rate, in which case the field is noise, or trusts it, in which case the figure it reports was never measured.',
    break: (r) => { r.generations[0].survivalRate = 0.5 },
  },
  {
    slug: 'pct-denominators-ordered',
    codes: ['RATES_MATCH_FIELDS', 'PCT_DENOMINATORS_ORDERED'],
    edit: '`stats.byClass.survived_verbatim.pctOfFinal` raised 0.001 above that class\'s `pct`',
    consequence:
      'the share of the finished work is reported as larger than the share of the classified part, which the wider denominator makes impossible. This is the one way a reader is handed the flattering figure under the honest field\'s name: `pctOfFinal` is the field that counts the text no span covered, and here it has been given the number that does not.',
    why:
      'PCT_DENOMINATORS_ORDERED cannot fire alone either. `pct` is `chars / coveredChars` and `pctOfFinal` is `chars / finalChars` over the same numerator, so `pctOfFinal > pct` requires `finalChars < coveredChars`, which COVERED_BOUNDED already forbids. While both rates match their own arithmetic and `coveredChars <= finalChars`, the ordering holds by construction. So the inversion is reachable only through a rate that does not match its own division (here) or through a covered count larger than the finished size (COVERED_BOUNDED). One extra violation is the cheapest of the two.',
    break: (r) => {
      const st = r.stats.byClass.survived_verbatim
      st.pctOfFinal = r3(st.pct + 0.001)
    },
  },
  {
    slug: 'perfile-enumerates-paths',
    codes: ['PERFILE_ENUMERATES_PATHS'],
    edit: '`stats.perFile` emptied',
    consequence:
      'the array a consuming pipeline iterates is empty while the record carries one classified path and one excluded path. Every row-level reader of this record sees a finished work with no files in it, and every aggregate field still reports the characters of both, so the gap is silent in exactly the direction that reads as "nothing to see".',
    break: (r) => { r.stats.perFile = [] },
  },
  {
    slug: 'signal-quote-grounded',
    codes: ['SIGNAL_QUOTE_GROUNDED'],
    edit: '`the whole of it` rewritten to `all of it` inside the first one-shot correction\'s `text`, leaving the `quotes[]` entry that excerpts that sentence alone',
    consequence:
      'the excerpt the signal carries no longer appears in the prose a reader sees. This is the misquote case stated from the side that fires once: the quote is still a real substring of the finished file it names, so it is still re-readable, and the sentence a lab reads has drifted from it. A buyer auditing the quote against its source finds nothing wrong; a buyer auditing the sentence against the quote finds the record quoting itself inaccurately. Rewriting the quote instead would fire the same code twice, once for each clause of the bound, which is why this fixture breaks the prose.',
    break: (r) => {
      const c = r.signals!.oneShotCorrections[0]
      c.text = c.text.replace('holds the whole of it', 'holds all of it')
    },
  },
  {
    slug: 'descent-checked-uniformly',
    codes: ['DESCENT_CHECKED_UNIFORMLY'],
    edit: 'the first `survived_mutated` span\'s descent verdict replaced with a `rival` verdict, the label left as `survived_mutated`',
    consequence:
      'the span names the commit that holds its text verbatim outside the generation\'s line of descent, and keeps the label and the word-level diff that assert the person composed it by editing that generation. The demotion was computed and not applied, so the record carries its own counter-evidence and sells the correction anyway.',
    break: (r) => {
      firstMutated(r).descent = {
        basis: 'rival', sha: 'deadbee',
        subject: 'Port the paragraph from the other branch', relation: 'sibling',
      }
    },
  },
  {
    slug: 'exclusion-not-classified',
    codes: ['EXCLUSION_NOT_CLASSIFIED'],
    edit: 'the exclusion\'s `path` moved to `notes.md`, the path this record classifies, and the now-orphaned `docs/standards/pm.md` row dropped from `stats.perFile` so the row list still enumerates exactly the paths the run read',
    consequence:
      'the record states that `notes.md` arrived whole from another commit and sells class labels over its spans in the same breath. `exclusions` and `files` are supposed to partition the paths the run was willing to read, so a path in both means the refusal was computed and then not applied, and every percentage in the record counts characters the record itself says nobody here wrote.',
    break: (r) => {
      r.exclusions![0] = { ...r.exclusions![0], path: 'notes.md' }
      r.stats.perFile = r.stats.perFile.filter((row) => row.path !== EXCLUDED.path)
    },
  },
]

// ---------------------------------------------------------------------------

function note(c: Case, violations: ReturnType<typeof checkRecord>): string {
  const lines = [
    `# ${c.codes.join(' + ')} — ${c.slug}.json`,
    '',
    `Expected codes: \`${c.codes.join('`, `')}\``,
    '',
    '## The edit',
    '',
    `\`base.json\` with ${c.edit}.`,
    '',
    '## What the record now claims',
    '',
    c.consequence.charAt(0).toUpperCase() + c.consequence.slice(1),
    '',
    '## What the gate says',
    '',
  ]
  for (const v of violations) {
    lines.push(
      `### \`${v.code}\``,
      '',
      `- Where: \`${v.where}\``,
      `- Observed: ${v.observed}`,
      `- Bound: ${v.invariant}`,
      '',
    )
  }
  if (c.why) {
    lines.push('## Why this fixture violates more than one bound', '', c.why, '')
  }
  lines.push(
    '## Provenance',
    '',
    'Derived by `tools/make-violation-fixtures.ts`. See `README.md` in this',
    'directory for what the directory is for and how the test reads it.',
    '',
  )
  return lines.join('\n')
}

const check = process.argv.includes('--check')
mkdirSync(OUT, { recursive: true })

const base = baseRecord()
const baseViolations = checkRecord(base)
if (baseViolations.length > 0) {
  console.error(`The base record violates ${baseViolations.length} bound(s), so no fixture below would prove anything:`)
  for (const v of baseViolations) console.error(`  ${v.code} at ${v.where}: ${v.observed}`)
  process.exit(1)
}

const files = new Map<string, string>()
files.set('base.json', JSON.stringify(base, null, 2) + '\n')

let failed = false
for (const c of CASES) {
  const broken = clone(base)
  c.break(broken)
  const found = checkRecord(broken)
  const got = found.map((v) => v.code)
  const want = c.codes
  const same = got.length === want.length && got.every((code, i) => code === want[i])
  if (!same) {
    console.error(`${c.slug}: expected [${want.join(', ')}], gate emitted [${got.join(', ')}]`)
    for (const v of found) console.error(`    ${v.code} at ${v.where}: ${v.observed}`)
    failed = true
    continue
  }
  files.set(`${c.slug}.json`, JSON.stringify(broken, null, 2) + '\n')
  files.set(`${c.slug}.md`, note(c, found))
  console.log(`${c.slug}: ${got.join(' + ')}`)
}
if (failed) process.exit(1)

let drifted = 0
for (const [name, content] of files) {
  const path = join(OUT, name)
  if (check) {
    let current = ''
    try { current = readFileSync(path, 'utf8') } catch { current = '' }
    if (current !== content) {
      console.error(`drifted: ${path}`)
      drifted++
    }
  } else {
    writeFileSync(path, content)
  }
}
if (check) {
  console.log(drifted === 0
    ? `${files.size} files match what this script would write.`
    : `${drifted} of ${files.size} files differ. Re-run without --check to rewrite them.`)
  process.exit(drifted === 0 ? 0 : 1)
}
console.log(`Wrote ${files.size} files under ${OUT}, covering ${new Set(CASES.flatMap((c) => c.codes)).size} invariant codes.`)
