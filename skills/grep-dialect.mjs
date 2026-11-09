#!/usr/bin/env node
// Does the `grep` in a receipt mean the same thing to everyone who runs it?
//
//   node skills/grep-dialect.mjs --engine            # which engine each call path gets, measured
//   node skills/grep-dialect.mjs --scan skills prompts   # receipt commands whose result is dialect-dependent
//   node skills/grep-dialect.mjs --json skills       # the same findings, for another seat's sweep to cite
//   node skills/grep-dialect.mjs --self-test         # the predicates against themselves
//
// Exit 0 clean. `--scan` exits 1 when a finding is a **call site**: on a
// surface something executes, in a class that is a defect, and not declared
// deliberate. Every other finding is still printed and counted under its own
// heading, because classifying a finding and hiding it are different acts.
// `--strict` fails on all of them. `--engine` exits 0 whatever it finds,
// because a divergence between two call paths is this host's shape and not a
// defect to fail on; pass `--assert-gnu` to fail when the binary call path is
// not GNU grep.
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
// WHY IT ALSO CLASSIFIES, added 2026-11-02 on the exo seat's second note.
//
// The first draft reported a line if the text of that line matched. Exo
// measured what that costs and the figure is the reason for everything below:
// across its clone and this one, twenty-six findings, of which **two** were
// genuine call sites. Both were in its own unmerged charter branch and this
// tool found them exactly, so the recall was not the problem. Of the seven on
// `main`, two were a demonstration of the defect and a quotation of the broken
// instrument, three were English sentences about the flag pair, and two were
// exo's own carried check, `grep -c 'grep -qv'`, where the flag pair is the
// string being searched for and not a flag being passed.
//
// Exo stated the shape better than this seat had: *a register that records
// every defect by quoting it is the densest carrier of every pattern a guard
// searches for, so precision decays in proportion to how well we document
// ourselves.* Its learning log is the worst offender in this repository and
// this library's own test file is the second. That is not a flaw in either
// file. It is what a register and a test corpus are for.
//
// So two discriminators, both structural, and neither of them a list of file
// names.
//
// **The surface.** A line in a fenced block in markdown is a command a reader
// is meant to run. A line of markdown prose outside every fence is a sentence
// about one. These are different objects and the first draft could not tell
// them apart, which is where five of the seven went. See `surfacesForText`.
//
// **The needle.** When the flag pair sits inside a quoted argument of some
// outer command whose own `grep` is outside that quote, the flag pair is data
// being searched for. `grep -c 'grep -qv'` passes no `-q` to anything. That is
// class N, and it is never a defect. See `needleAt`.
//
// WHAT CLASSIFYING IS NOT. It is not skipping. The first draft skipped `//`
// comments in `.mjs` outright and so could not report on them at all, and that
// is the one thing the earlier narrowing in `grep-dialect.test.mjs` was right
// to warn about. An unclassified sweep of this lane returns hits in this file's
// own header; a tool that cannot name them cannot be cited by that sweep. So
// nothing is skipped now. Every line is read, every match is reported, and each
// one carries the surface it was found on and whether it gates.
//
// THE ONE ESCAPE HATCH, and it is narrow on purpose. A line may declare its own
// use deliberate with `grep-dialect: deliberate <reason>`, on that line or the
// one above, and **the reason is required**: a waiver with no words after it
// does not apply, because a waiver whose reason is unstated is a skip wearing a
// label. A whole file may declare itself a corpus of the shape with
// `grep-dialect: corpus` in its first forty lines, which is what a test file
// for this tool is. Both are printed in the report with their counts, so a
// waiver cannot be used to make a number look better without showing up in it.
//
// WHAT IT DOES NOT DO. It does not rewrite anything, and it does not read a
// skill's prose. It reads command text and reports the shapes above. The
// judgement about whether a given receipt's number is load-bearing stays with
// the author, because a count whose exact value the claim does not rest on is
// allowed to be approximate and this tool cannot tell which that is. It also
// cannot tell a demonstration of the defect from a live use of it, which is
// why the waiver exists and is the author's to write.
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
 *
 * None of the six carries the global flag, deliberately: `classAt` wants each
 * pattern's **leftmost** match and nothing after it, because a second anchor
 * further right in the same line is usually the quoted copy of the first.
 *
 * Every gap between the anchor and the flags is lazy, and that is not a
 * micro-optimisation, it decides where the match **ends**. A greedy gap runs to
 * the rightmost spelling of the flags on the line, so on
 * `grep -qv x f  # see also 'grep -qv'` it returned the quoted copy's position
 * and `needleAt` then called a live call site a needle. Laziness cannot change
 * whether a line matches, only which occurrence is reported, so it costs no
 * recall; it was found by the test of that exact line and not by reading.
 */
export const CLASS_A_RES = [
  /\bu?grep\b[^|&;\n]*?\s-[A-Za-z]*q[A-Za-z]*v/,
  /\bu?grep\b[^|&;\n]*?\s-[A-Za-z]*v[A-Za-z]*q/,
  /\bu?grep\b[^|&;\n]*?\s-q(?![A-Za-z])[^|&;\n]*?\s-v(?![A-Za-z])/,
  /\bu?grep\b[^|&;\n]*?\s-v(?![A-Za-z])[^|&;\n]*?\s-q(?![A-Za-z])/,
  /\bu?grep\b[^|&;\n]*?--(?:quiet|silent)[^|&;\n]*?--invert/,
  /\bu?grep\b[^|&;\n]*?--invert[^|&;\n]*?--(?:quiet|silent)/,
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

// ---------------------------------------------------------------- the surface

/**
 * Where a line lives, which is what decides whether anything executes it.
 *
 * `code` and `receipt` are the executable surfaces and the only ones that
 * gate. The split between them is not about risk, it is about who runs the
 * line: a program runs `code`, a reader runs a `receipt` by hand, and the
 * typed frame is the one frame where the dialect actually diverges, so a
 * receipt is if anything the more exposed of the two.
 */
export const SURFACE = {
  code: 'a line some program executes',
  receipt: 'a command a reader is meant to run by hand',
  prose: 'text that describes a command without being one',
  fixture: 'a line in a file that declares itself a corpus of this shape',
}

/** The surfaces a finding gates on. */
export const EXECUTABLE_SURFACES = new Set(['code', 'receipt'])

/** CommonMark fence, allowing the three leading spaces CommonMark allows. */
const FENCE = /^ {0,3}(`{3,}|~{3,})/

const SLASH_COMMENT = /^(?:\/\/|\/\*|\*)/
const HASH_COMMENT = /^#/
const SLASH_LANGS = new Set(['.mjs', '.js'])
const HASH_LANGS = new Set(['.sh', '.py', '.yml', '.yaml'])

/**
 * The surface of every line of `text`, as an array parallel to its lines.
 *
 * Markdown is the case that pays for this function. A fenced block is a
 * `receipt`; everything outside every fence is `prose`. Five of the seven
 * findings this tool reported on `main` were markdown prose, which is what
 * exo's note measured, and the fence state is the whole of the fix.
 *
 * Two deliberate narrowings, both of which cost recall and are written here
 * rather than left to be discovered:
 *
 * An indented code block in markdown is read as `prose`, not as a receipt.
 * CommonMark would call four leading spaces a code block, but this
 * repository's registers wrap continued list items at three and four spaces
 * everywhere, so honouring the indent rule would reclassify most of the
 * learning log's prose as executable and give back the false positives this
 * function exists to remove. A receipt that needs to gate goes in a fence.
 *
 * A `#` line in shell, Python or YAML is a `receipt`, not `prose`. A commented
 * command in a script is the line a reader uncomments, and in this repository
 * it is usually a worked example sitting beside the thing it explains. A `//`
 * line in `.mjs` gets `prose` instead, because there is no copy-and-run idiom
 * for JavaScript comments: the measurement records in this file's own header
 * are the example, and they are evidence about a command rather than one.
 */
export function surfacesForText(text, ext = '') {
  const lines = text.split('\n')
  if (ext === '.md' || ext === '.markdown') {
    const out = []
    let fence = null
    for (const line of lines) {
      const m = FENCE.exec(line)
      if (fence === null) {
        out.push('prose')
        if (m) fence = m[1]
      } else {
        out.push('receipt')
        if (m && m[1][0] === fence[0] && m[1].length >= fence.length) fence = null
      }
    }
    return out
  }
  if (SLASH_LANGS.has(ext)) {
    return lines.map((l) => (SLASH_COMMENT.test(l.trim()) ? 'prose' : 'code'))
  }
  if (HASH_LANGS.has(ext)) {
    return lines.map((l) => (HASH_COMMENT.test(l.trim()) ? 'receipt' : 'code'))
  }
  return lines.map(() => 'code')
}

// ----------------------------------------------------------------- the needle

/**
 * The closed quote spans on one line, as `[open, close]` index pairs, for each
 * of the three shell and JavaScript quote characters independently.
 *
 * Closed only: an apostrophe in prose (`#618`'s repair) leaves one unmatched
 * quote and must not swallow the rest of the line. The three characters are
 * scanned independently rather than as one grammar, which means a `'` inside a
 * `"` span produces a span of its own. That over-reports spans and therefore
 * over-reports needles, so `classAt` below only trusts the result when **no**
 * spelling of the shape resolves to a real flag.
 */
export const quotedSpans = (line) => {
  const spans = []
  for (const q of ["'", '"', '`']) {
    let from = 0
    for (;;) {
      const open = line.indexOf(q, from)
      if (open === -1) break
      const close = line.indexOf(q, open + 1)
      if (close === -1) break
      spans.push([open, close])
      from = close + 1
    }
  }
  return spans
}

/**
 * The commands that receive a quoted argument as a **pattern to look for**
 * rather than as code to run. The whole needle class rests on this list, which
 * is why it is short and explicit: `bash -c` and `sh -c` take a quoted command
 * and must never appear here, and `python3 -c` is the same case.
 */
export const SEARCHERS = ['u?grep', 'fgrep', 'egrep', 'zgrep', 'rg', 'ag', 'ack', 'pcregrep', 'sift']

/**
 * A searcher invocation ending exactly where a quote opens: the searcher's
 * name, then its arguments, then the whitespace before the quote.
 *
 * The argument run excludes `;`, `|` and `&` so the searcher has to be in the
 * same command as the quote. Without that, `grep -c x f; sh -c 'grep -qv y'`
 * read as a needle, because a `grep` anywhere earlier in the line would do.
 */
const SEARCHER_BEFORE_QUOTE = new RegExp(
  `\\b(?:${SEARCHERS.join('|')})\\b(?:\\s+[^\\s;|&'"\`]+)*\\s+$`,
)

/**
 * Is the flag pair ending at `flagEnd` the **search string** of some command,
 * rather than flags passed to one?
 *
 * True when a closed quote span contains the flag pair and the text ending at
 * that span's opening quote is a searcher invocation. That is exactly the shape
 * of exo's carried check,
 * `git show <ref>:prompts/exo-agent.md | grep -c 'grep -qv'`, where the outer
 * `grep -c` is the command and `grep -qv` is the thing being counted. Two of
 * the seven findings on `main` were this and neither is a defect.
 *
 * The first draft of this predicate asked a different question, whether the
 * span excluded the match's own anchor, and the test
 * `rg --count 'grep --quiet --invert-match'` is what retired it: there the only
 * `grep` on the line is the quoted one, so every span containing the flags
 * contains the anchor too and the shape could not be recognised. Asking what
 * receives the quote answers both cases with one rule, and it is the honest
 * question, because what makes a quoted string a pattern is the command in
 * front of it.
 *
 * It stays deliberately blind in one direction. `awk '/grep -qv/'` and
 * `python3 -c "print('grep -qv')"` are needles too and this reports them as
 * class A, because the alternative is a list of every program that has ever
 * taken a pattern. A needle reported as a call site costs a line of noise; a
 * call site reported as a needle ships a defect.
 */
export const needleAt = (line, flagEnd) =>
  quotedSpans(line).some(
    ([open, close]) =>
      open < flagEnd && flagEnd < close && SEARCHER_BEFORE_QUOTE.test(line.slice(0, open)),
  )

/**
 * The class A verdict for one line, as `{ cls, index, end }` or `null`:
 * `'A'` when some spelling resolves to flags actually passed, `'N'` when every
 * spelling that matched is a needle.
 *
 * Each pattern contributes its leftmost match only, and one real match outvotes
 * any number of needles. Both choices run the same way on purpose: a missed
 * call site is a defect shipped, and a needle reported as a call site is a line
 * of noise, so where the discriminator is unsure it says call site.
 */
export function classAt(line) {
  const ms = []
  for (const re of CLASS_A_RES) {
    const m = re.exec(line)
    if (m) ms.push({ index: m.index, end: m.index + m[0].length - 1 })
  }
  if (!ms.length) return null
  const real = ms.filter((m) => !needleAt(line, m.end))
  const from = real.length ? real : ms
  const pick = from.reduce((a, b) => (b.index < a.index ? b : a))
  return { cls: real.length ? 'A' : 'N', ...pick }
}

// -------------------------------------------------------------- declarations

/** A line's own declaration that its use of the shape is deliberate. */
export const WAIVER_MARK = 'grep-dialect: deliberate'

/** A file's declaration that it is a corpus of the shape, not a user of it. */
export const CORPUS_MARK = 'grep-dialect: corpus'

/** How far into a file the corpus declaration is looked for. */
export const CORPUS_HEADER_LINES = 40

/**
 * Does `text` declare itself a corpus? Only its first `CORPUS_HEADER_LINES`
 * lines are read, so a file cannot acquire the declaration from a fixture
 * buried in its body, and this module's own definition of `CORPUS_MARK` sits
 * far below that line to keep the tool from exempting itself.
 */
export const declaresCorpus = (text) =>
  text.split('\n').slice(0, CORPUS_HEADER_LINES).some((l) => l.includes(CORPUS_MARK))

/**
 * The stated reason a line's use is deliberate, or `null`.
 *
 * Read from the line itself or the one directly above it, and **only** when
 * words follow the marker. A bare marker returns `null` and the finding gates
 * as normal, because the reason is the entire difference between a waiver and
 * a skip.
 */
export const waiverOn = (lines, i) => {
  for (const candidate of [lines[i], lines[i - 1]]) {
    if (typeof candidate !== 'string') continue
    const at = candidate.indexOf(WAIVER_MARK)
    if (at === -1) continue
    const reason = candidate
      .slice(at + WAIVER_MARK.length)
      .replace(/^[\s:\u2014-]+/, '')
      .replace(/\s*(?:\*\/|`|'|")\s*$/, '')
      .trim()
    if (reason) return reason
  }
  return null
}

// ------------------------------------------------------------------ findings

/**
 * Dialect-dependent command text in one file, as
 * `{ cls, line, text, surface, waived? }`.
 *
 * `cls` is `'A'` for quiet-plus-invert, `'B'` for a path-anchored filter
 * downstream of a recursive search, and `'N'` for a needle: the shape occurring
 * as the search string of some other command. `opts.ext` is the file extension,
 * which is what `surfacesForText` needs; with no extension every line is
 * `code`, which is what a unit test passing one command string wants.
 */
export function findingsInText(text, opts = {}) {
  const { ext = '', corpus = null } = opts
  const lines = text.split('\n')
  const isCorpus = corpus === null ? declaresCorpus(text) : corpus
  const surfaces = surfacesForText(text, ext)
  const out = []
  lines.forEach((line, i) => {
    const classes = []
    const a = classAt(line)
    if (a) classes.push(a.cls)
    if (CLASS_B_RE.test(line)) classes.push('B')
    if (!classes.length) return
    const surface = isCorpus ? 'fixture' : surfaces[i]
    const waived = waiverOn(lines, i)
    for (const cls of classes) {
      out.push({ cls, line: i + 1, text: line.trim(), surface, ...(waived ? { waived } : {}) })
    }
  })
  return out.sort((a, b) => a.line - b.line || a.cls.localeCompare(b.cls))
}

/**
 * Does this finding gate? Three conditions, each of which exists because a
 * measured finding failed it: something executes the line, the class is a
 * defect rather than a needle, and the author has not declared the use
 * deliberate with a reason.
 */
export const isCallSite = (f) =>
  EXECUTABLE_SURFACES.has(f.surface) && f.cls !== 'N' && !f.waived

const TEXT_EXT = /\.(?:md|markdown|mjs|js|sh|py|yml|yaml)$/
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
      for (const f of findingsInText(text, { ext })) out.push({ file, ...f })
    }
  }
  return out
}

// ------------------------------------------------------------------- reports

const REPAIR = {
  A: 'quiet-plus-invert: its exit status is inverted between GNU and ugrep. Capture output and test it, or write `! grep -q PAT`.',
  B: 'a path-anchored filter after a recursive search: the `./` prefix and the file population both move with the caller. Normalise the prefix first, or filter with a pathspec rather than a second grep.',
  N: 'a needle, not a call: the shape is the search string of the command around it, so nothing is passed those flags and nothing is owed.',
}

/** One report line per finding, in the house shape `path:line  class  surface  text`. */
export const report = (findings) =>
  findings.map(
    (f) =>
      `${f.file ?? ''}${f.file ? ':' : ''}${f.line}  class ${f.cls}  ${f.surface}  ${f.text}` +
      (f.waived ? `\n    declared deliberate: ${f.waived}` : `\n    ${REPAIR[f.cls]}`),
  )

const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`

/**
 * The scan's closing lines: what gates, then what was classified out and under
 * which heading, with counts.
 *
 * The second half is the part worth having. A tool that printed only its call
 * sites would be a tool whose silence nobody could check, and the whole reason
 * this classification exists is that another seat's unclassified sweep needs
 * every one of its own hits accounted for by name.
 */
export function summarise(findings) {
  const sites = findings.filter(isCallSite)
  const rest = findings.filter((f) => !isCallSite(f))
  const buckets = new Map()
  for (const f of rest) {
    const key = f.waived
      ? 'declared deliberate, with a reason'
      : f.cls === 'N'
        ? 'needles: the shape is the search string, not the flags'
        : `on ${f.surface}: ${SURFACE[f.surface]}`
    buckets.set(key, (buckets.get(key) ?? 0) + 1)
  }
  const lines = [`${plural(sites.length, 'call site', 'call sites')} on an executable surface`]
  if (rest.length) {
    lines.push(`${plural(rest.length, 'finding', 'findings')} classified out:`)
    for (const [key, n] of [...buckets].sort((a, b) => b[1] - a[1])) {
      lines.push(`  ${String(n).padStart(4)}  ${key}`)
    }
  }
  return lines
}

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
// grep-dialect: deliberate the probe must run the shape whose exit status inverts in order to measure it
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

const USAGE =
  'usage: grep-dialect.mjs --engine [--assert-gnu] | [--json] [--strict] <path>...'

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
    if (!roots.length) { console.error(USAGE); process.exit(2) }
    const findings = scan(roots)
    const sites = findings.filter(isCallSite)
    if (argv.includes('--json')) {
      // Every finding, gating or not, because the caller for this is another
      // seat's unclassified sweep reconciling its own hit list against this
      // one. A payload holding only the call sites would leave it exactly the
      // hits it cannot explain.
      console.log(JSON.stringify({ roots, findings, callSites: sites.length }, null, 2))
    } else {
      for (const line of report(sites)) console.log(line)
      if (sites.length && findings.length > sites.length) console.log('')
      for (const line of report(findings.filter((f) => !isCallSite(f)))) console.log(line)
      if (findings.length) console.log('')
      for (const line of summarise(findings)) console.log(line)
      console.log(`in ${roots.join(', ')}`)
    }
    const fail = argv.includes('--strict') ? findings.length : sites.length
    if (fail) process.exit(1)
  }
}
