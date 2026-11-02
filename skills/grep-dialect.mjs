#!/usr/bin/env node
// Does the `grep` in a receipt mean the same thing to everyone who runs it?
//
//   node skills/grep-dialect.mjs --engine            # which engine each call path gets, measured
//   node skills/grep-dialect.mjs --scan skills prompts   # receipt commands whose result is dialect-dependent
//   node skills/grep-dialect.mjs --self-test         # the predicates against themselves
//
// Exit 0 clean. `--scan` exits 1 with one line per finding, each naming the
// repair. `--engine` exits 0 whatever it finds, because a divergence between
// two call paths is this host's shape and not a defect to fail on; pass
// `--assert-gnu` to fail when the binary call path is not GNU grep.
//
// WHY THIS EXISTS, measured on 2026-11-02 on the resident host.
//
// Ursa's exo seat handed this seat a correction: a precision figure it had
// published four times rested on an arm of its command that had never fired,
// half because `grep`'s quiet-plus-invert flag pair does not mean here what it
// means in GNU grep. It asked for one version check in this lane. The check
// found something narrower and worse than the claim it was checking.
//
// THE CLAIM AS HANDED OVER was "the grep on our path is ugrep, not the GNU
// one". That is true of the name a seat types and false of the path. Both
// engines are on this host:
//
//     command grep --version   ->  grep (GNU grep) 3.11
//     grep --version           ->  ugrep 7.8.4
//     type -a grep             ->  grep is a function
//                                  grep is /usr/bin/grep
//
// `grep` in an agent's shell is a function the harness installs, which execs
// the agent binary as ugrep. `/usr/bin/grep` is GNU 3.11.
//
// And the function is not exported. Measured: the environment holds no
// `BASH_FUNC_grep%%`, and `bash -lc 'type -t grep'`, `bash -ic 'type -t grep'`
// and a node-spawned bash all answer `file`, run from inside the very shell
// whose own `type -t grep` answers `function`. So the divergent dialect lives
// in exactly one frame, the top frame a seat types into, and reaches nothing
// below it: not a script, not a guard, not CI, not a `.mjs` tool spawning
// `grep`, not even a bash that frame launched itself.
//
// So the discriminator is not the host, which is what the handover said. It is
// the frame, and the consequence runs the opposite way from where this seat
// would have looked first: the committed tooling is safe and the hand-typed
// receipt is not.
//
// WHAT DIVERGES, both measured rather than read off a manual page.
//
// Class A, the exit status of quiet-plus-invert, which is exo's finding and
// reproduces exactly. On input `a\nb` with pattern `a`:
//
//     GNU   grep -q -v a  -> exit 0   ("some line did not match")
//     ugrep grep -q -v a  -> exit 1   ("the pattern matched something")
//
// They agree when every line matches and when no line matches, which is why
// nothing warns, and `-v` without `-q` prints identical output on both. So the
// visible form behaves the same and adding `-q` for tidiness silently swaps the
// predicate. Under ugrep, the quiet-plus-invert form means what GNU means by
// `! grep -q PAT`.
//
// Class B, the population, which is the one that costs this lane more. The
// harness function adds `--ignore-files --hidden -I --exclude-dir=.git`, so it
// honours `.gitignore` and skips binaries, and it prints paths without the
// `./` prefix GNU's `-r .` emits. In a throwaway repository holding one needle
// in each of five files, `grep -rl NEEDLE .` returned two files to the seat and
// five to the tool: the gitignored directory, the gitignored `*.log` and the
// binary were invisible to one caller and counted by the other.
//
// WHY THAT IS THIS SEAT'S PROBLEM AND NOT THE EXO'S. The one thing this
// library sells is that every claim traces to a receipt a reader can re-run. A
// receipt that returns 2 to the author and 5 to the reader is not a receipt. It
// is a claim with a command next to it, which is the exact failure the
// provenance reviewer exists to catch, arriving by a route no reviewer was
// watching.
//
// WHAT IT DOES NOT DO. It does not rewrite anything, and it does not read a
// skill's prose. It reads command text and reports the two shapes above. The
// judgement about whether a given receipt's number is load-bearing stays with
// the author, because a count whose exact value the claim does not rest on is
// allowed to be approximate and this tool cannot tell which that is.
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { join } from 'node:path'

/**
 * Quiet-plus-invert on one command line: the flag pair whose exit status means
 * one thing to GNU grep and the opposite to ugrep.
 *
 * Six patterns for one shape, because the shape has six spellings: bundled in
 * either order, two separate single-letter flags in either order, and the two
 * long forms in either order. The first draft had the bundled pair and the long
 * forms and missed the separated pair, which is the spelling every real call
 * site found tonight actually used.
 * Anchored on the word `grep` so that a base64 blob holding `qv` is not a
 * finding; the first draft of this pattern had no such anchor and returned
 * nineteen hits in this repository, every one of them a `sha512-` integrity
 * line or a CSS class name.
 */
export const CLASS_A_RES = [
  /\bu?grep\b[^|&;\n]*\s-[A-Za-z]*q[A-Za-z]*v/,
  /\bu?grep\b[^|&;\n]*\s-[A-Za-z]*v[A-Za-z]*q/,
  /\bu?grep\b[^|&;\n]*\s-q(?![A-Za-z])[^|&;\n]*\s-v(?![A-Za-z])/,
  /\bu?grep\b[^|&;\n]*\s-v(?![A-Za-z])[^|&;\n]*\s-q(?![A-Za-z])/,
  /\bu?grep\b[^|&;\n]*--(?:quiet|silent)[^|&;\n]*--invert/,
  /\bu?grep\b[^|&;\n]*--invert[^|&;\n]*--(?:quiet|silent)/,
]

/**
 * A recursive search whose output is piped into a filter anchored on the start
 * of a path. The two engines disagree on the `./` prefix and on which files are
 * in the population at all, so the filter's meaning moves with the caller.
 *
 * This is the shape of exo's own first bug stated generally: it wrote a
 * row-level exclusion against a path and ran it over output that carried a ref
 * name in front of every path, so the exclusion never matched anything it was
 * written to exclude, and the silence read as a clean result.
 */
export const CLASS_B_RE =
  /\bu?grep\b[^|\n]*\s-[A-Za-z]*r[A-Za-z]*\b[^|\n]*\|[^|\n]*\bu?grep\b[^|\n]*\s-[^|\n]*'\^/

/**
 * Lines of `text` matching any pattern in `res`, as `{ line, text }`, skipping
 * lines whose first non-space characters are one of `commentPrefixes`.
 *
 * The skip exists for one reason and it is narrow: a `//` line in a `.mjs` file
 * cannot be executed by anyone, so a measurement record written in one is
 * evidence and not a call site, and this file's own header is the first example.
 * It is deliberately not extended to `#` in shell or markdown, where a comment
 * inside a fenced block is frequently an instruction a reader is meant to run,
 * and a `<!-- -->` in markdown is rare enough not to be worth the hole. So the
 * rule is: a language whose comments are never receipts gets the skip, and
 * every other file is read whole.
 */
const matching = (text, res, commentPrefixes = []) => {
  const out = []
  text.split('\n').forEach((line, i) => {
    const trimmed = line.trim()
    if (commentPrefixes.some((p) => trimmed.startsWith(p))) return
    if (res.some((re) => re.test(line))) out.push({ line: i + 1, text: trimmed })
  })
  return out
}

/**
 * Dialect-dependent command text in one file, as `{ cls, line, text }`.
 * `cls` is `'A'` for quiet-plus-invert and `'B'` for a path-anchored filter
 * downstream of a recursive search.
 */
export function findingsInText(text, commentPrefixes = []) {
  return [
    ...matching(text, CLASS_A_RES, commentPrefixes).map((m) => ({ cls: 'A', ...m })),
    ...matching(text, [CLASS_B_RE], commentPrefixes).map((m) => ({ cls: 'B', ...m })),
  ].sort((a, b) => a.line - b.line || a.cls.localeCompare(b.cls))
}

/** Comment markers that can never be a receipt, by extension. */
export const COMMENT_PREFIXES = { '.mjs': ['//', '*'], '.js': ['//', '*'] }

const TEXT_EXT = /\.(?:md|mjs|js|sh|py|yml|yaml)$/
const MAX_SCAN_BYTES = 4_000_000

/** Every text file under `root`, recursively, excluding `.git`. */
const filesUnder = (root) => {
  let st
  try { st = statSync(root) } catch { return [] }
  if (st.isFile()) return TEXT_EXT.test(root) ? [root] : []
  const out = []
  for (const name of readdirSync(root).sort()) {
    if (name === '.git' || name === 'node_modules') continue
    out.push(...filesUnder(join(root, name)))
  }
  return out
}

/** Findings across every text file under each of `roots`, as `{ file, ...finding }`. */
export function scan(roots) {
  const out = []
  for (const root of roots) {
    for (const file of filesUnder(root)) {
      let text
      try {
        if (statSync(file).size > MAX_SCAN_BYTES) continue
        text = readFileSync(file, 'utf8')
      } catch { continue }
      const ext = file.slice(file.lastIndexOf('.'))
      for (const f of findingsInText(text, COMMENT_PREFIXES[ext] ?? [])) out.push({ file, ...f })
    }
  }
  return out
}

const REPAIR = {
  A: 'quiet-plus-invert: its exit status is inverted between GNU and ugrep. Capture output and test it, or write `! grep -q PAT`.',
  B: 'a path-anchored filter after a recursive search: the `./` prefix and the file population both move with the caller. Normalise the prefix first, or filter with a pathspec rather than a second grep.',
}

/** One report line per finding, in the house shape `path:line  class  repair`. */
export const report = (findings) =>
  findings.map((f) => `${f.file}:${f.line}  class ${f.cls}  ${f.text}\n    ${REPAIR[f.cls]}`)

/**
 * The one discriminating probe, written once, because it is the only line in
 * this library that uses the shape the library forbids.
 *
 * It uses it on purpose: measuring an inverted exit status means running the
 * thing whose exit status inverts. Keeping it to a single literal is what lets
 * the test file assert, by content, that this is the only such line here. Two
 * copies of it, which is what the first draft had, turns that assertion into a
 * count nobody can read.
 *
 * `a\nb` with pattern `a` is the input because exactly one line matches: GNU
 * exits 0 because a line did not match, ugrep exits 1 because the pattern did.
 * An all-matching or no-matching input agrees on both engines and proves
 * nothing, which is why it is not the input used here.
 */
export const probeCommand = (grep) => `printf 'a\\nb\\n' | ${grep} -q -v a`

/** What a seat runs in its own frame, which no child process can measure for it. */
export const TYPED_FRAME_PROBE = `type -t grep; ${probeCommand('grep')}; echo "exit=$?"`

/**
 * What `grep` is on every call path this tool can reach, measured, plus the one
 * input that separates the two dialects.
 *
 * `binary` is `/usr/bin/grep`. `child` is a `bash -lc` this process spawned,
 * which is what a tool, a script and CI all get. The third frame, the shell a
 * seat types into, is deliberately absent and `typedShell` says so: the
 * harness installs its `grep` as a shell function and does not `export -f` it,
 * so no child of that shell can see it. Measured here: `env` holds no
 * `BASH_FUNC_grep%%`, and `bash -lc 'type -t grep'`, `bash -ic` and a
 * node-spawned bash all answer `file`, while `type -t grep` in the seat's own
 * frame answers `function`.
 *
 * That absence is the finding, not a gap in the tool. The divergent dialect
 * lives in exactly one frame, the one a human or an agent types into, and
 * reaches nothing downstream of it. So a committed guard is safe from it and a
 * hand-run receipt is not, which is the opposite of where this seat would have
 * looked first.
 */
export function engines() {
  const sh = (cmd) => {
    try {
      return execFileSync('bash', ['-lc', cmd], { encoding: 'utf8' }).trim()
    } catch { return null }
  }
  const quietInvert = (cmd) => {
    try {
      execFileSync('bash', ['-lc', probeCommand(cmd)], { stdio: 'ignore' })
      return 0
    } catch (e) { return typeof e.status === 'number' ? e.status : null }
  }
  return {
    binary: {
      how: 'a tool spawning `grep` on PATH',
      version: sh('command grep --version 2>&1 | head -1'),
      quietInvertExit: quietInvert('command grep'),
    },
    child: {
      how: 'any child shell: a script, a guard, CI',
      version: sh('grep --version 2>&1 | head -1'),
      quietInvertExit: quietInvert('grep'),
      resolvesAs: sh('type -t grep'),
    },
    typedShell: {
      how: 'the shell a seat types into',
      measurable: false,
      why: 'the harness grep is a shell function and is not exported, so no child process can see it',
      runItYourself: TYPED_FRAME_PROBE,
    },
  }
}

/**
 * The `--engine` report. No verdict on the divergence, because two call paths
 * disagreeing is this host's shape and not a defect to fail on; the verdict
 * `--assert-gnu` gives is narrower, that the path a guard runs on is GNU.
 */
export function engineReport(e) {
  const lines = []
  for (const key of ['binary', 'child']) {
    const v = e[key]
    lines.push(`${key.padEnd(11)} ${v.version ?? '(could not run)'}`)
    lines.push(`            ${v.how}; the probe exits ${v.quietInvertExit ?? '?'}`)
  }
  lines.push(`typedShell  not measurable from here: ${e.typedShell.why}`)
  lines.push(`            run it in your own frame:  ${e.typedShell.runItYourself}`)
  lines.push(
    e.binary.quietInvertExit === 0 && e.child.quietInvertExit === 0
      ? 'Every frame this tool can reach exits 0, which is the GNU meaning, so a committed guard is not exposed to the inversion. A receipt a reader runs by hand is, and that frame is the one above.'
      : 'A frame this tool can reach does not use the GNU meaning of quiet-plus-invert. Every guard in this library that rides on that exit status needs re-reading.',
  )
  return lines
}

const isGnu = (v) => typeof v === 'string' && /GNU grep/.test(v)

if (import.meta.url === `file://${process.argv[1]}`) {
  const argv = process.argv.slice(2)
  if (argv.includes('--self-test')) {
    const { execFileSync: run } = await import('node:child_process')
    run('node', ['--test', new URL('./grep-dialect.test.mjs', import.meta.url).pathname], { stdio: 'inherit' })
  } else if (argv.includes('--engine')) {
    const e = engines()
    for (const line of engineReport(e)) console.log(line)
    if (argv.includes('--assert-gnu') && !isGnu(e.binary.version)) {
      console.error('FAIL: the binary call path is not GNU grep, so every receipt in this library needs re-reading.')
      process.exit(1)
    }
  } else {
    const roots = argv.filter((a) => !a.startsWith('--'))
    if (!roots.length) { console.error('usage: grep-dialect.mjs --engine | --scan <path>...'); process.exit(2) }
    const findings = scan(roots)
    for (const line of report(findings)) console.log(line)
    console.log(`${findings.length} dialect-dependent command${findings.length === 1 ? '' : 's'} in ${roots.join(', ')}`)
    if (findings.length) process.exit(1)
  }
}
