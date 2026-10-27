// Run the repository's redaction gate locally, before pushing.
//
//   node docs/design/review-kit/check-redaction.mjs
//   node docs/design/review-kit/check-redaction.mjs --root . --json
//
// WHY THIS EXISTS. `redaction-gate.yml` is the only gate in this
// repository that fails on content a review run produces by hand, and
// on 2026-10-27 it was red three times in a row on this seat's own
// branch for one fixture line. Nothing on a developer's side ran it, so
// every discovery of a hit cost a push, a workflow run and a wake.
//
// WHY IT PARSES THE WORKFLOW INSTEAD OF HOLDING ITS OWN COPY OF THE
// RULES. A local check that restates the gate's regexes is a second
// source of truth, and a second source of truth for a gate is worse
// than no local check at all: it goes green while the gate goes red the
// moment either side is edited, and the person it misleads is the one
// who trusted it. So the patterns, the exclusions and the allowlist are
// read out of `.github/workflows/redaction-gate.yml` on every run, and
// the matching is done by the same `grep -rInE` the gate calls, because
// JavaScript's RegExp is not POSIX ERE and the two disagree on exactly
// the kind of pattern a gate like this is written in.
//
// The workflow is not this seat's writable surface and this script does
// not write to it.
//
// THE FLAGS ARE PART OF THE RULES, which this script learned the hard
// way on 2026-10-27. Patterns, exclusions and the allowlist were read
// out of the workflow from the first commit, and the grep flag cluster
// was written here as the literal `-rInE`, which is the same second
// source of truth the paragraph above refuses, one argument to the left.
// It costs nothing while the gate says `-rInE` and it costs the whole
// check on the day the gate stops saying it. PWC-13 is that day: it is
// live with HQ and it removes `-I`, the flag that makes grep treat a
// binary file as holding no match. A checker that kept `-I` after the
// gate dropped it would go green on a committed image the gate reds,
// for the seat whose practice commits over a thousand of them. So the
// cluster is read from the gate too, and `-I`'s removal is handled
// rather than merely survived: GNU grep announces a binary hit on
// standard error and writes nothing to standard output, so a script
// reading only stdout with the right flags still finds nothing.
//
// WHAT IT DOES WHEN IT CANNOT FIND THE RULES. It exits 2 and says so.
// It never prints "clean" from an empty rule set, which is the one
// failure a checker like this must not have: the output of a check that
// found no rules is identical to the output of a check that found no
// hits, and only one of those means you can push.

import { readFileSync, existsSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { join } from 'node:path'

const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i === -1 ? d : process.argv[i + 1] }
const has = (n) => process.argv.includes(`--${n}`)

const ROOT = arg('root', '.')
const BINARY_NOTE = ': binary file matches'
const WORKFLOW = join(ROOT, '.github/workflows/redaction-gate.yml')

const die = (msg) => { console.error(`check-redaction: ${msg}`); process.exit(2) }

if (!existsSync(WORKFLOW)) die(`no gate at ${WORKFLOW}. Run this from the repository root or pass --root.`)
const yml = readFileSync(WORKFLOW, 'utf8')

// `scan "<label>" \` then a line holding the pattern in single quotes.
// Anchored on the call rather than on line numbers so an edit above it
// does not silently change what this reads.
//
// `^\s*` is load-bearing and was put there by the selftest. Without it
// the pattern matches the tail of any identifier ending in `scan`, so
// renaming the gate's helper to `noscan` left this script reporting
// three rules it was no longer reading from a live call. A refusal path
// that can be defeated by a prefix is not a refusal path.
const rules = [...yml.matchAll(/^\s*scan\s+"((?:[^"\\]|\\.)*)"\s*\\\s*\n\s*'([^']*)'/gm)]
  .map(([, label, pattern]) => ({ label, pattern }))

// The two filters the gate shares across all three scans. Read, not assumed.
const excludes = [...yml.matchAll(/--exclude(?:-dir)?=([^\s\\]+)/g)].map(m => m[0])
const allowM = yml.match(/\|\s*grep -vE '([^']*)'/)
const allow = allowM ? allowM[1] : null

// The flag cluster the gate hands grep, read and never assumed. Same
// anchor `scripts/redaction-check.mjs` uses, so the two local checkers
// read the gate the same way.
const flagM = yml.match(/\bgrep\s+(-[A-Za-z]+)\s+"\$pattern"/)
const flags = flagM ? flagM[1] : null

if (rules.length === 0) die('found no scan() calls in the gate. The workflow\'s shape changed; fix this script before trusting it.')
if (excludes.length === 0) die('found no --exclude flags in the gate. Refusing to scan node_modules and call the result a verdict.')
if (!allow) die('found no allowlist (grep -vE) in the gate. Refusing to report hits the gate would have dropped.')
if (!flags) die('found no `grep -<flags> "$pattern"` call in the gate. Refusing to scan with flags of this script\'s own invention.')
for (const required of ['r', 'n', 'E']) {
  if (!flags.includes(required)) die(`the gate's grep flags \`${flags}\` no longer include -${required}; fix this script before trusting it.`)
}

const findings = []
for (const { label, pattern } of rules) {
  // `LC_MESSAGES=C` so the binary notice below is the English sentence
  // this parses and not a translation of it.
  const g = spawnSync('grep', [flags, pattern, '.', ...excludes], {
    cwd: ROOT, encoding: 'utf8', maxBuffer: 64 << 20,
    env: { ...process.env, LC_MESSAGES: 'C' },
  })
  // grep exits 1 for "no match", which is not an error. Anything above
  // that is, and a checker that reads it as "clean" is the bug above.
  if (g.status > 1) die(`grep failed (status ${g.status}) on ${label}: ${(g.stderr || '').trim()}`)
  const lines = (g.stdout || '').split('\n').filter(Boolean)
  // `grep: ./x.png: binary file matches` carries the path, no line number
  // and no matched text, which is the location-only shape the redaction
  // standard asks for. Rendered into `file:line:text` with `-` for the
  // line, so the allowlist and the printing below need no special case.
  // Empty today, because the gate still passes `-I`.
  for (const line of (g.stderr || '').split('\n').filter(Boolean)) {
    if (!line.endsWith(BINARY_NOTE)) die(`grep wrote to standard error on ${label}, so part of the tree went unread: ${line}`)
    const body = line.slice(0, -BINARY_NOTE.length)
    const sep = body.indexOf(': ')
    lines.push(`${sep === -1 ? body : body.slice(sep + 2)}:-:binary file matches`)
  }
  const kept = spawnSync('grep', ['-vE', allow], { input: lines.join('\n'), encoding: 'utf8' })
  if (kept.status > 1) die(`allowlist grep failed (status ${kept.status})`)
  for (const l of (kept.stdout || '').split('\n').filter(Boolean)) findings.push({ label, hit: l })
}

if (has('json')) {
  console.log(JSON.stringify({ gate: WORKFLOW, rules: rules.length, flags, findings }, null, 2))
} else {
  console.log(`check-redaction: ${rules.length} rules and flags \`${flags}\` read from ${WORKFLOW}`)
  for (const { pattern } of rules) console.log(`  rule  ${pattern}`)
  if (findings.length === 0) {
    console.log('clean — the gate will pass on this tree.')
  } else {
    for (const { label, hit } of findings) console.log(`\nFAIL  ${label}\n      ${hit}`)
    console.log(`\n${findings.length} hit(s). The gate will fail on this tree.`)
  }
}
process.exit(findings.length === 0 ? 0 : 1)
