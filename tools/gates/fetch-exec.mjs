#!/usr/bin/env node
// fetch-exec.mjs — every place in this repository where code is fetched from
// a public registry and then executed, and the reason each one is allowed.
//
// Why this exists, and why it is not the fix that came before it.
//
// Security finding F113 (docs/security/audit-2026-11-09-message-10.md) found
// `scripts/ci-checks.mjs` running `npx tsc --noEmit`. Without
// `--no-install`, `npx` resolves a missing binary against the PUBLIC
// REGISTRY: it downloads a package of that name and runs it. On the registry
// `tsc` is an unrelated long-dead package and not the TypeScript compiler, so
// what executed was whatever that name served, in a seat sandbox under
// `--permission-mode bypassPermissions` with live tokens in the environment.
// It was fixed, and the test that closed it asserts over that one file's own
// `CHECKS` array.
//
// That is the whole of the defect it can see. HQ's exo-centralizer seat
// carried the class up to the holding company on 2026-11-09 and measured it
// there, and its note is why this file exists rather than another call-site
// patch:
//
//   > A flag on a call site is what a code sweep finds. What bit here was a
//   > sentence telling a future seat to write the call site, which no sweep
//   > reaches, and it would have shipped to a second company.
//
// HQ's only instance was an instruction in a charter staged for another
// company's engineer: render a diagram by invoking a fetch-capable runner
// with the yes flag. The fetch was not merely permitted there, it was
// pre-approved, and the owner would have applied that charter as written.
// This repository has that instance too (see the baseline).
//
// So this gate reads two surfaces and not one:
//
//   executed     a file something runs: a script, a module, a workflow.
//   instruction  a file that tells a future seat or reader what to run:
//                a charter under prompts/, a company standard, a skill.
//   record       prose and transcripts. Reported, never a finding, because a
//                measurement of a fetch is evidence and not an exposure.
//
// THE DISCRIMINATOR, which is F113's own mechanism. `npx <name>` resolves
// <name> against the registry as a PACKAGE name, while what a reader writes
// is a BINARY name, and the two agree only by convention. `tsx` and `vitest`
// are both: this repository declares packages of those names, so a fetch
// there drifts a version at worst. `tsc` is not: the binary comes from
// `typescript`, nothing here declares a package called `tsc`, and the
// registry serves an unrelated dead project under that name. That is the
// whole of why F113 executed a stranger's code rather than an old compiler.
// So this gate reads every tracked package.json and splits `fetch-capable`
// on whether the target is a name this repository actually declares. The
// split is executed, not written down, because a prose reason per occurrence
// is a thing seats copy rather than check.
//
// WHAT THIS CANNOT SEE, stated here because a limit a gate hides is worse
// than a limit it names. It reads lines, not syntax. A command inside a
// string literal in an executed file is indistinguishable to it from one
// that file runs, so two such strings carry baseline rows below rather than
// being silently excluded by a path rule. It also cannot know what a
// registry will serve, only whether the fetch is reachable at all.
//
// Exit codes, and the third one is the point. `tools/prompt-slots.mjs` is
// registered in tools/gates/gate-registry.baseline.json as red-on-main
// because it has no exit code for "clean as far as a seat can take it": its
// findings are in .github/workflows/, which no seat here may edit, so every
// branch inherits its red. This gate separates the two:
//
//   0  every fetch-capable occurrence is deliberate, inert, baselined, or
//      targets a package name this repository declares.
//   1  a finding a seat may repair: an un-baselined occurrence, or a
//      baseline row that no longer matches anything.
//   2  all seat-repairable occurrences are clean and N owner-reserved
//      findings remain, in prompts/, .github/workflows/ or docs/standards/,
//      which a seat may not edit. Same semantics as `ledger-contract` and
//      `register-ids` in scripts/ci-checks.mjs, which tolerate 2 for
//      owner-held violations on exactly this ground.
//   3  not measured. No git, or the baseline will not parse. Never read as
//      clean, because silence over a scope nothing read is not a verdict.
//
// Written 2026-11-09 by Ursa's security seat, run 13.

import { spawnSync } from 'node:child_process'
import { readFileSync, existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const BASELINE = path.join(ROOT, 'tools/gates/fetch-exec.baseline.json')

// The detector's vocabulary. Every entry must be decided by `classify`, and
// fetch-exec.test.mjs asserts that each `id` here has at least one case, so
// the vocabulary cannot grow past the decided set.
//
// `refusal` names the flag that makes the runner refuse to fetch instead of
// fetching. `confirm` names the runner flags that pre-approve the fetch.
// `byDesign` runners have no non-fetching mode at all: fetching and running
// is the whole of what they are for.
export const RUNNERS = [
  { id: 'npx', match: ['npx'], refusal: ['--no-install'], confirm: ['-y', '--yes'] },
  { id: 'pnpm-dlx', match: ['pnpm', 'dlx'], byDesign: true },
  { id: 'yarn-dlx', match: ['yarn', 'dlx'], byDesign: true },
  { id: 'bunx', match: ['bunx'], byDesign: true, confirm: ['-y', '--yes'] },
  { id: 'uvx', match: ['uvx'], byDesign: true },
  { id: 'pipx-run', match: ['pipx', 'run'], byDesign: true },
  { id: 'deno-remote', match: ['deno', 'run'], byDesign: true, needsUrl: true },
  { id: 'go-remote', match: ['go', 'run'], byDesign: true, needsVersionedPkg: true },
  { id: 'go-install', match: ['go', 'install'], byDesign: true, needsVersionedPkg: true },
]

// The classifications. Total: `classify` returns one of these for every
// occurrence it is handed, and never undefined.
export const CLASSES = [
  'not-an-invocation', // the token is there, in no command position
  'deliberate',        // carries the runner's refusal flag, so it cannot fetch
  'fetch-capable',     // would resolve a missing name against the registry
  'auto-confirm',      // the fetch is pre-approved by a runner flag
  'fetch-by-design',   // the runner exists in order to fetch and run
]

const FINDING_CLASSES = new Set(['fetch-capable', 'auto-confirm', 'fetch-by-design'])

// Paths no seat in this repository may edit. prompts/ is charters, which this
// seat's own boundaries forbid it to touch; .github/workflows/ and
// docs/standards/ are HQ's under docs/standards/pm.md §15.
const OWNER_RESERVED = [/^prompts\//, /^\.github\/workflows\//, /^docs\/standards\//]

const EXECUTED_EXT = new Set(['.sh', '.bash', '.zsh', '.mjs', '.cjs', '.js', '.ts', '.tsx', '.py', '.yml', '.yaml'])
const INSTRUCTION_PATHS = [/^prompts\//, /^docs\/standards\//, /^CLAUDE\.md$/, /^AGENTS\.md$/, /SKILL\.md$/]

export function surfaceOf (file) {
  if (INSTRUCTION_PATHS.some((re) => re.test(file))) return 'instruction'
  if (path.basename(file) === 'package.json') return 'executed'
  if (EXECUTED_EXT.has(path.extname(file))) return 'executed'
  return 'record'
}

export function isOwnerReserved (file) {
  return OWNER_RESERVED.some((re) => re.test(file))
}

// Normalise a source line to a shell-ish token stream, so that an argv array
// in JavaScript and a command in a shell script are read the same way:
//   ['npx', '--no-install', 'tsc']   ->   npx --no-install tsc
// Backticks, quotes, brackets and commas become whitespace. Everything else
// is left alone, so `npm|npx|npx-cli.js)` stays ONE token and therefore never
// reads as a command.
export function tokenize (line) {
  return line.replace(/[[\]{},'"`]/g, ' ').trim().split(/\s+/).filter(Boolean)
}

// A comment is not an invocation. Covers the three spellings this repository
// actually uses for a usage line: `#`, `//` and a jsdoc continuation `*`.
export function isCommentLine (line) {
  const t = line.trim()
  return t.startsWith('#') || t.startsWith('//') || t.startsWith('*') || t.startsWith('/*')
}

// Tokens that can precede a command on the same line. A runner name that
// follows none of them, and does not start the line, is a word rather than a
// call. `$` is a transcript prompt; it is still a call, and the surface
// decides whether a transcript matters.
const COMMAND_LEAD = new Set(['$', '&&', '||', '|', ';', 'then', 'do', 'else', 'exec', 'sudo', 'time', 'run', '-c', '!'])

// A runner name that follows pure punctuation is in command position too.
// This is load-bearing rather than tidiness: F113's own call site is a
// JavaScript argv array, `argv: () => ['npx', 'tsc', '--noEmit']`, which
// tokenises to `... => npx tsc --noEmit`. Without this clause the gate built
// to generalise F113 could not see F113. Caught by the PRE-FIX case in
// fetch-exec.test.mjs, which is what those cases are for.
const isPunctuation = (tok) => /^[^A-Za-z0-9]+$/.test(tok)

// Pure. Given a line and a runner, say what the occurrence is. Takes no
// filesystem and no git, so the suite grades it on strings alone.
export function classify (line, runner) {
  if (isCommentLine(line)) return { cls: 'not-an-invocation', why: 'in a comment' }
  const toks = tokenize(line)
  const first = runner.match[0]
  for (let i = 0; i < toks.length; i++) {
    if (toks[i] !== first) continue
    if (i > 0 && !COMMAND_LEAD.has(toks[i - 1]) && !isPunctuation(toks[i - 1])) continue
    // Multi-word runners (`pnpm dlx`) must match in sequence.
    if (runner.match.length > 1 && toks[i + 1] !== runner.match[1]) continue
    const after = toks.slice(i + runner.match.length)
    // The runner's own flags are the leading flags, before the first
    // non-flag token. A `--yes` AFTER the package name belongs to the
    // package, not to the runner: `npx tsx src/bin/ursa.ts publish --yes`
    // is this project's own CLI flag and pre-approves no fetch at all.
    const runnerFlags = []
    let j = 0
    for (; j < after.length && after[j].startsWith('-'); j++) runnerFlags.push(after[j])
    const target = after[j]
    if (runner.needsUrl && !(target || '').startsWith('http')) continue
    if (runner.needsVersionedPkg && !(target || '').includes('@')) continue
    if ((runner.refusal || []).some((f) => runnerFlags.includes(f))) {
      return { cls: 'deliberate', why: `carries ${runner.refusal.join(' or ')}`, target }
    }
    if ((runner.confirm || []).some((f) => runnerFlags.includes(f))) {
      return { cls: 'auto-confirm', why: `the fetch is pre-approved by ${runnerFlags.filter((f) => runner.confirm.includes(f)).join(' ')}`, target }
    }
    if (runner.byDesign) {
      return { cls: 'fetch-by-design', why: `${runner.id} has no non-fetching mode`, target }
    }
    return { cls: 'fetch-capable', why: 'a missing local binary resolves against the public registry', target }
  }
  return { cls: 'not-an-invocation', why: 'the name appears in no command position' }
}

// Pipe-to-shell is a second shape with the same consequence, and it is not a
// runner, so it gets its own detector rather than a fake RUNNERS entry.
export function classifyPipeToShell (line) {
  if (isCommentLine(line)) return null
  const re = /\b(curl|wget)\b[^|;&]*\|\s*(sudo\s+)?(ba|z|da)?sh\b/
  if (!re.test(line)) return null
  return { cls: 'fetch-by-design', why: 'a fetched body is piped into a shell', target: 'pipe-to-shell' }
}

// Every package name this repository declares, from every tracked
// package.json. A target in this set is served by the project the lockfile
// already trusts; a target outside it is served by whoever holds the name.
export function declaredNames (files, readFile) {
  const names = new Set()
  for (const f of files) {
    if (path.basename(f) !== 'package.json') continue
    if (f.includes('node_modules/')) continue
    let pkg
    try { pkg = JSON.parse(readFile(f)) } catch { continue }
    for (const k of ['dependencies', 'devDependencies', 'optionalDependencies', 'peerDependencies']) {
      for (const n of Object.keys(pkg[k] || {})) names.add(n)
    }
  }
  return names
}

// A target may carry a version suffix (`@mermaid-js/mermaid-cli@11`). The
// name is what the registry resolves, so strip the suffix without eating the
// leading `@` of a scope.
export function targetName (target) {
  if (!target) return null
  const at = target.lastIndexOf('@')
  return at > 0 ? target.slice(0, at) : target
}

function git (args) {
  const r = spawnSync('git', args, { cwd: ROOT, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 })
  if (r.status !== 0) return null
  return r.stdout
}

const BINARY_EXT = new Set(['.png', '.jpg', '.jpeg', '.gif', '.pdf', '.ico', '.woff', '.woff2', '.zip', '.gz'])

export function scan (files, readFile) {
  const out = []
  for (const file of files) {
    if (BINARY_EXT.has(path.extname(file))) continue
    let text
    try { text = readFile(file) } catch { continue }
    if (text.includes('\u0000')) continue
    const lines = text.split('\n')
    for (let n = 0; n < lines.length; n++) {
      const line = lines[n]
      for (const runner of RUNNERS) {
        if (!line.includes(runner.match[0])) continue
        const v = classify(line, runner)
        if (v.cls === 'not-an-invocation') continue
        out.push({ file, line: n + 1, runner: runner.id, ...v, text: line.trim() })
      }
      const pipe = classifyPipeToShell(line)
      if (pipe) out.push({ file, line: n + 1, runner: 'pipe-to-shell', ...pipe, text: line.trim() })
    }
  }
  return out
}

// The baseline is keyed on the path and the matched command text, NEVER on a
// line number. A line number drifts every time anything above it is edited,
// and a key that drifts turns the gate into a thing seats re-baseline instead
// of read. The command text changes only when the command changes, which is
// exactly when the row should be looked at again.
export function keyOf (occ) {
  return `${occ.file}\u0000${occ.text}`
}

function main (argv) {
  const quiet = argv.includes('--quiet')
  const listAll = argv.includes('--all')

  let baseline
  try {
    baseline = JSON.parse(readFileSync(BASELINE, 'utf8'))
  } catch (e) {
    console.error(`fetch-exec: cannot read ${path.relative(ROOT, BASELINE)}: ${e.message}`)
    console.error('  NO VERDICT. The allowed set is unreadable, so nothing here is a statement about this tree.')
    return 3
  }

  const listed = git(['ls-files', '-z'])
  if (listed === null) {
    console.error('fetch-exec: `git ls-files` failed, so the file set is unknown.')
    console.error('  NO VERDICT. Not read as clean: a scan over no files finds nothing in exactly the way a clean tree does.')
    return 3
  }
  // This gate's own two files, and nothing else. The allow-list quotes every
  // command it allows, and the suite's fixture corpus is deliberately made
  // of the shapes being detected, including the PRE-FIX call sites that prove
  // the detector catches them. Both are input to this gate rather than
  // surfaces it judges.
  //
  // THE HOLE THIS LEAVES, named rather than hidden: a real call site added to
  // fetch-exec.test.mjs would not be reported here. It is narrowed to two
  // literal paths so it cannot widen by accident, and the file is a test
  // whose own suite runs under tooling-suites, which is where a call it
  // actually made would show up. The alternative was thirteen baseline rows
  // describing fixtures, and a row per fixture is the thing seats re-baseline
  // instead of read.
  const SELF = new Set(['tools/gates/fetch-exec.baseline.json', 'tools/gates/fetch-exec.test.mjs'])
  const files = listed.split('\u0000').filter(Boolean).filter((f) => !SELF.has(f))

  const read = (f) => readFileSync(path.join(ROOT, f), 'utf8')
  const declared = declaredNames(files, read)
  const occurrences = scan(files, read)
  const byKey = new Map()
  for (const o of occurrences) byKey.set(keyOf(o), o)

  const rows = baseline.entries || []
  const allowed = new Map()
  for (const r of rows) allowed.set(`${r.path}\u0000${r.command}`, r)

  const stale = rows.filter((r) => !byKey.has(`${r.path}\u0000${r.command}`))
  const findings = []
  const reported = []
  const excused = []
  const drift = []

  for (const o of occurrences) {
    const surface = surfaceOf(o.file)
    const row = allowed.get(keyOf(o))
    if (surface === 'record') { reported.push({ ...o, surface, why_reported: 'prose or a transcript, not a thing anything runs' }); continue }
    if (!FINDING_CLASSES.has(o.cls)) { excused.push({ ...o, surface }); continue }
    // A plain `npx <declared package>` can only drift a version, because the
    // name resolves to the project this repository already depends on. An
    // auto-confirmed or by-design fetch is a finding whatever it targets:
    // there the fetch is the intent rather than a fallback.
    if (o.cls === 'fetch-capable' && declared.has(targetName(o.target))) {
      drift.push({ ...o, surface }); continue
    }
    if (row) { excused.push({ ...o, surface, baselined: row }); continue }
    findings.push({ ...o, surface, ownerReserved: isOwnerReserved(o.file) })
  }

  // An owner-reserved-finding row is the one kind that keeps a real exposure
  // in the allowed set, so it is the one kind that can rot into a green tick
  // over a finding nobody is carrying. It must name a docs/ideas.md heading,
  // and that heading has to exist. Same doctrine as the `red-on-main` kind in
  // tools/gates/gate-registry.mjs, from the same reasoning.
  let ledgerHeadings
  try {
    ledgerHeadings = readFileSync(path.join(ROOT, 'docs/ideas.md'), 'utf8')
      .split('\n').filter((l) => l.startsWith('#'))
  } catch (e) {
    console.error(`fetch-exec: cannot read docs/ideas.md: ${e.message}`)
    console.error('  NO VERDICT. An owner-reserved row\'s ledger pointer could not be checked.')
    return 3
  }

  const ownerFindings = rows.filter((r) => r.kind === 'owner-reserved-finding')
  const unledgered = ownerFindings.filter((r) => !r.ledger || !ledgerHeadings.some((h) => h.includes(r.ledger)))
  const seatFindings = findings.filter((f) => !f.ownerReserved)
  const newOwnerFindings = findings.filter((f) => f.ownerReserved)

  if (!quiet) {
    console.log(`fetch-exec: ${files.length} tracked files, ${occurrences.length} fetch-and-execute occurrence(s).`)
    console.log(`  ${excused.length} accounted for, ${drift.length} targeting a declared package (version drift only), ${reported.length} in prose or transcripts, ${findings.length} unaccounted.`)
    if (listAll) {
      for (const o of [...excused, ...drift, ...reported]) {
        console.log(`  ${o.cls.padEnd(16)} ${o.surface.padEnd(11)} ${o.file}:${o.line}`)
      }
    }
    for (const r of ownerFindings) {
      console.log(`\nOWNER-RESERVED FINDING  ${r.path}`)
      console.log(`  ${r.command}`)
      console.log(`  ${r.why}`)
    }
  }

  for (const f of [...seatFindings, ...newOwnerFindings]) {
    console.error(`\nUNACCOUNTED  ${f.cls}  ${f.surface}  ${f.file}:${f.line}`)
    console.error(`  ${f.text}`)
    console.error(`  ${f.why}`)
    console.error(f.ownerReserved
      ? '  This path is not a seat\'s to edit. Add a tools/gates/fetch-exec.baseline.json row of kind owner-reserved-finding naming the ledger entry, or have the owner repair it.'
      : '  Either pass the runner its refusal flag and call the local binary, or add a baseline row saying why the fetch is allowed.')
  }
  for (const r of unledgered) {
    console.error(`\nOWNER-RESERVED ROW WITH NO LIVE LEDGER ENTRY  ${r.path}`)
    console.error(`  names "${r.ledger ?? '(none)'}", which no heading in docs/ideas.md carries`)
    console.error('  A real exposure is being held open by this row. Without a ledger entry nobody is carrying it, so the row reads as permission instead.')
  }
  for (const s of stale) {
    console.error(`\nSTALE BASELINE ROW  ${s.path}`)
    console.error(`  ${s.command}`)
    console.error('  Nothing in the tree matches this row any more. Delete it, so the allowed set cannot outlive the thing it allowed.')
  }

  if (seatFindings.length || newOwnerFindings.length || stale.length || unledgered.length) {
    console.error(`\nfetch-exec: ${seatFindings.length + newOwnerFindings.length} unaccounted occurrence(s), ${stale.length} stale row(s), ${unledgered.length} row(s) with no live ledger entry.`)
    return 1
  }
  if (ownerFindings.length) {
    console.log(`\nfetch-exec: clean as far as a seat can take it. ${ownerFindings.length} owner-reserved finding(s) remain, listed above.`)
    return 2
  }
  if (!quiet) console.log('\nfetch-exec: every fetch-and-execute occurrence is deliberate, inert or accounted for.')
  return 0
}

if (import.meta.url === `file://${process.argv[1]}`) {
  process.exit(main(process.argv.slice(2)))
}
