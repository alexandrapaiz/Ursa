#!/usr/bin/env node
// Every defect code the detectors under `tools/` and `scripts/` can emit, and
// whether anything in this repository would notice if one of them fired.
//
//   node tools/gates/code-census.mjs            # the decision, per code
//   node tools/gates/code-census.mjs --json
//   node tools/gates/code-census.mjs --codes    # every code and its state
//
// Exit 0 every code a detector can emit is either named by a test file or
// carries a written baseline entry saying why it is not. Exit 1 a code is
// emitted and decided by nothing, or an emission site's code cannot be read
// off the source at all, or a baseline entry has outlived the finding it
// excused. Exit 2 the facts could not be established -- not a git checkout, or
// the scan matched no emission site, which must not read like a clean sweep.
//
// WHY THIS FILE EXISTS. Ursa's ExO seat posted the general form to the board on
// 2026-11-09 at 01:35:16Z, having hit the specific case an hour earlier: *"a
// detector's vocabulary and its gate's decided set are two different sets, and
// nothing in this repository compared them."* Its own lint,
// `tools/instant.mjs`, emits three codes and the assertion in
// `tools/instant.test.mjs` tested two, so `TEXTUAL_DAY` was detected on every
// run and decided by nothing, and six call sites stood in it. That one pair is
// repaired in `tools/instant-gate.mjs` by the seat that owns it.
//
// This file is the comparison made over the whole tree instead of one pair,
// because the shape generalises and the question the ExO seat actually asked
// was addressed to every seat holding a gate. Measured when it was written, at
// `origin/main` 316542cc: 16 detectors, 68 enumerable codes, and **eight of
// them named in no test file anywhere** -- three in `tools/board/check.mjs`,
// two in `tools/doc-model/check.mjs`, three in `tools/registers/check-ids.mjs`.
// Three of the eight were reachable by driving a pure function and are now
// asserted in `tools/board/check.test.mjs`. The other five are in
// `tools/gates/code-census.baseline.json` with a reason each.
//
// THE PROPERTY THIS MEASURES IS THE WEAK ONE, AND SAYING SO IS THE POINT.
// "Named in a test file" is not "decided by an assertion". `TEXTUAL_DAY` is
// the proof: it appears in `tools/instant.test.mjs` as a fixture in a table of
// three, so this census calls it decided, while the ExO seat's measurement
// showed the repository's assertion over that lint ignored it. So a clean run
// here means no code is COMPLETELY unwatched. It does not mean every code is
// asserted on. The stronger property needs the detector driven and its
// outcomes compared against the assertion's filter, one detector at a time,
// which is what `tools/instant-gate.mjs` does for one of the sixteen. The gap
// between the two properties is in `docs/ideas.md` as its own entry rather
// than left for a reader to notice.
//
// A CODE NAME IS NOT NAMESPACED, AND THIS FILE PAID FOR THAT ON ITS FIRST RUN.
// "Named by a test" matches the code name anywhere in any test file under
// these trees, so two detectors using one name share each other's assertions.
// The first draft called its own stale-baseline code `BASELINE_ENTRY_STALE`,
// which is also a verdict cause in `tools/secret-scan-verdict.mjs`, and
// `tools/secret-scan-verdict.test.mjs` asserts it. So this gate reported its
// own untested code as decided, by a test of a different gate. It is
// `CENSUS_ENTRY_STALE` now. Measured over the trees afterwards: exactly one
// name is emitted by two detectors, `SENDER_COMPANY_SPELLING` in
// `tools/board/post.mjs` and `tools/board/post-verdict.mjs`, where it is one
// fault reported at two layers and the sharing is correct. The general repair
// is to key the decision on the pair (detector, code), which needs a test to
// say which detector it is asserting about; that is a ledger entry.
//
// THE OBLIGATION IS READ OFF THE DETECTORS, NEVER LISTED HERE, which is HQ's
// rule as adopted into `standards/roles/exo.md` on 2026-11-09: read the
// exclusion off the place that holds it, because a restatement is two
// implementations that agree only on the day they are written. There is no
// list of code names in this file. `emissionSites` asks each source file.
//
// A SITE WHOSE CODE CANNOT BE READ IS A FINDING AND NOT A SKIP, which is the
// one design decision everything else here depends on. A scan over source text
// under-reports by construction: the code it fails to parse is the code it
// reports nothing about, and a census that silently skips what it cannot parse
// returns a smaller vocabulary and calls it clean. That is this file
// committing the exact defect it was written to find. So an emission site
// whose value is not one or more code-shaped string literals exits 1 and names
// the line.
//
// It found one, and the one it found is real rather than a parser complaint.
// `tools/board/page.mjs:331` builds its code as
// `` `COVERAGE_${c.incomplete_reason || 'UNKNOWN'}` ``, so its vocabulary is
// five codes -- `COVERAGE_PAGE_BUDGET`, `_CURSOR_STUCK`, `_READ_FAILED`,
// `_NO_PROGRESS` and `_UNKNOWN` -- of which one is asserted as a code. The
// four `incomplete_reason` values are each asserted in `tools/board/page.test.mjs`,
// so the detector is tested; what no test names is the fault code built from
// them. A literal-only scan reported that site as one code and would have been
// silently wrong about four.
//
// TERNARIES ARE ENUMERABLE AND TEMPLATES ARE NOT, and the asymmetry is
// deliberate rather than an implementation limit.
// `tools/board/measured-citation.mjs:154` writes
// `code: b.read_at === undefined ? 'READ_AT_ABSENT' : 'READ_AT_NOT_AN_INSTANT'`.
// Both arms are in the source, so the vocabulary is complete and reading it is
// sound. A template interpolates a value the source does not contain, so no
// amount of parsing recovers the set and the honest answer is to refuse.
//
// WHY THE SCANNER TOKENISES INSTEAD OF MATCHING LINES. The first draft was a
// line regex over comment-stripped text and it was wrong three ways on the
// real tree, each of which would have been a false finding or a false clean:
//
//   1. `@typedef {{ code: string, line: string, repair: string }}` in a JSDoc
//      block is a `code:` in a comment. Ursa's ExO seat hit the same class in
//      `tools/instant.mjs` the same night, where a JSDoc line describing a
//      timestamp filter read exactly like code mishandling one.
//   2. `shares_withheld: fault ? fault.code : null` in
//      `tools/board/measure-claims.mjs:167` matched as `code: null`, because
//      `.code :` ends in the same three characters a property does. The
//      scanner requires the name to begin a property, so `.code` is rejected
//      exactly as `know` is rejected by the ExO seat's `\bnow`.
//   3. A sentence inside a string literal in `ursa-major/src/invariants.ts`
//      contains the word `rule:` as prose. Blanking comments does not reach
//      it; only tracking string state does.
//
// SCOPE IS `tools/` AND `scripts/`, which is the same scope
// `tools/gates/enumerate-verdicts.mjs` takes for its own census, and the
// reason to match it is that the two tools answer halves of one question about
// the same population. `ursa-major/src` is deliberately out, and not because
// it is clean: `ursa-major/src/invariants.ts` holds its vocabulary as the
// TypeScript union `InvariantCode`, which is a declared set in one place and
// therefore a different and easier shape than a scan. Extending to it is a
// ledger entry, not a silent omission.
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { LOCUS, verdictOf } from './verdict-shape.mjs'

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..')
const BASELINE_PATH = 'tools/gates/code-census.baseline.json'

/** The two property names this repository emits defect codes under. Both are
 *  in use: `tools/board/*` and `tools/registers/*` write `code`, the ledger
 *  gates and this file's own findings write `rule`. */
const CODE_PROPS = new Set(['code', 'rule'])

/** What a defect code looks like. Deliberately not anchored on a prefix: the
 *  tree uses `TEXTUAL_`, `WAKE_`, `CLOSURE_`, `SENDER_`, `BASE_` and a dozen
 *  one-off names, and a prefix list would be the restatement this file exists
 *  to avoid. Three characters minimum, so a two-letter constant is not a code. */
const CODE_SHAPE = /^[A-Z][A-Z0-9_]{2,}$/

/**
 * Find every place a source file assigns a defect code, with the code names
 * when they can be read and `null` when they cannot.
 *
 * Tokenises rather than pattern-matches, for the three reasons in the header.
 * The state machine handles comments, single and double quoted strings,
 * template literals, AND regex literals.
 *
 * THE REGEX GAP WAS REAL, IT WAS OPEN, AND THE SENTENCE THAT SAID OTHERWISE
 * CITED AN INSTRUMENT THAT DOES NOT EXIST. This docblock used to read: "It
 * does NOT understand regex literals containing quote characters, which is the
 * one known gap... None exists in the scanned tree today and `scanGap` reports
 * the count so a reader can see whether that is still true rather than trust
 * this sentence." Three things were wrong with it, measured 2026-11-09 by the
 * engineer seat at `origin/main` 511a973f:
 *
 *  1. `scanGap` is not a symbol in this file, or in this repository. It
 *     appeared exactly once, in that sentence, promising a reader a number
 *     they could go and read. The number that was exported is
 *     `regexLiterals`, and it counts every `/` CHARACTER in the source: 653
 *     across the scanned tree. A count of slashes cannot distinguish a tree
 *     with the gap from a tree without it, so even read correctly it could not
 *     answer the question the sentence sent a reader to it with. No CLI mode
 *     printed it either.
 *
 *  2. Two instances existed in the scanned tree on the day the sentence was
 *     written. `tools/instant.mjs:709` is
 *     `/([A-Za-z_$][A-Za-z0-9_$.?!\[\]'"()]*?)...` — a character class holding
 *     both quote marks — and `tools/ledger/check-closures.mjs:144` is
 *     `/^\s*(```|~~~)/`, three backticks, of which the scanner paired two and
 *     opened a template on the third.
 *
 *  3. The cost was 6 of 63 single-line emission sites, silently. Everything
 *     after the desync point in those two files was read inside a phantom
 *     string: `TEXTUAL_DAY` and both `TEXTUAL_ORDER` sites in the lint, and all
 *     three of `CLOSURE_RESOLVES`, `CLOSURE_STATUS` and `CLOSURE_SYNTAX` in the
 *     closure checker, which this census therefore reported nothing about while
 *     printing that no code is emitted with nothing watching it. WHICH codes
 *     survived depended on where the next quote fell, so the vocabulary moved
 *     under an unrelated edit: the same census read `TEXTUAL_DROP` for
 *     `tools/instant.mjs` on one tree and `TEXTUAL_DAY` on another, 73 rows
 *     both times.
 *
 * So regex literals are skipped now, and `unaccounted` is the check that would
 * have caught the sentence being false: it is the file's own stated principle —
 * a site whose code cannot be read is a finding and not a skip — applied to the
 * scanner itself rather than only to the values it reads. A `/` is read as a
 * regex opener when the previous significant token cannot end an expression,
 * and a candidate regex containing a raw newline is re-read as division,
 * because a regex literal cannot contain one. That bail is what keeps a
 * misread division from swallowing the rest of the file, which is the failure
 * this repair exists to stop.
 *
 * @param {string} source
 * @returns {{sites: Array<{line: number, prop: string, value: string, codes: string[] | null}>, regexLiterals: number, regexSkipped: number, unaccounted: Array<{line: number, text: string}>}}
 */
export function emissionSites(source) {
  const sites = []
  let regexLiterals = 0
  let regexSkipped = 0
  let i = 0
  let line = 1
  const n = source.length
  const isWord = (c) => c !== undefined && /[\w$]/.test(c)
  // The last token that was not whitespace, a comment or a newline. A `/`
  // after something that can END an expression is division; after anything
  // else it opens a regex literal. `prev` holds either one character or a
  // whole identifier, because the keyword cases need the word.
  let prev = ''

  while (i < n) {
    const c = source[i]
    const two = source.slice(i, i + 2)

    if (two === '/*') {
      const end = source.indexOf('*/', i + 2)
      const stop = end === -1 ? n : end + 2
      line += countNewlines(source, i, stop)
      i = stop
      continue
    }
    if (two === '//') {
      const end = source.indexOf('\n', i)
      i = end === -1 ? n : end
      continue
    }
    if (c === '"' || c === "'" || c === '`') {
      const stop = skipString(source, i)
      line += countNewlines(source, i, stop)
      i = stop
      continue
    }
    if (c === '\n') {
      line += 1
      i += 1
      continue
    }
    // A property name, which must BEGIN an identifier: `fault.code :` is not
    // one, and neither is `decoded :` ending in `code`. Same word-boundary
    // argument as the ExO seat's `\bnow` over `know`.
    if (/[A-Za-z_$]/.test(c) && !isWord(source[i - 1]) && source[i - 1] !== '.') {
      let j = i
      while (j < n && isWord(source[j])) j += 1
      const word = source.slice(i, j)
      let k = j
      while (k < n && /[ \t]/.test(source[k])) k += 1
      if (CODE_PROPS.has(word) && source[k] === ':' && source[k + 1] !== ':') {
        const { value, end } = readValue(source, k + 1)
        const read = codesIn(value)
        sites.push({ line, prop: word, value, kind: read.kind, codes: read.codes })
        line += countNewlines(source, k + 1, end)
        i = end
        prev = ','
        continue
      }
      prev = word
      i = j
      continue
    }
    if (c === '/') {
      regexLiterals += 1
      if (startsRegex(prev)) {
        const stop = skipRegex(source, i)
        if (stop > i + 1) {
          regexSkipped += 1
          i = stop
          prev = '/'
          continue
        }
      }
    }
    if (!/\s/.test(c)) prev = c
    i += 1
  }
  return { sites, regexLiterals, regexSkipped, unaccounted: unaccountedIn(source, sites) }
}

/** Can a `/` here open a regex literal? True when the previous significant
 *  token cannot end an expression, which is the whole of the division/regex
 *  ambiguity. The keyword list is the set this tree actually uses before a
 *  regex; a keyword missing from it degrades to reading a regex as division,
 *  and `unaccounted` is the check that catches the consequence. */
function startsRegex(prev) {
  if (prev === '') return true
  if (/^[\w$]+$/.test(prev)) {
    return KEYWORDS_BEFORE_REGEX.has(prev)
  }
  // `)` and `]` end an expression, so `/` after them is division. Every other
  // punctuation mark is an operator or an opener.
  return !')]'.includes(prev)
}

const KEYWORDS_BEFORE_REGEX = new Set([
  'return', 'typeof', 'case', 'in', 'of', 'new', 'delete', 'void', 'do',
  'else', 'instanceof', 'yield', 'await', 'throw'
])

/** Past a regex literal, honouring escapes and character classes. Returns
 *  `start + 1` — a refusal — when the candidate runs to a raw newline, because
 *  a regex literal cannot contain one, so this `/` was division after all.
 *  That refusal is the load-bearing part: a division read as a regex would
 *  otherwise swallow source to the end of the next `/`. */
function skipRegex(s, start) {
  let p = start + 1
  let inClass = false
  while (p < s.length) {
    const c = s[p]
    if (c === '\\') { p += 2; continue }
    if (c === '\n') return start + 1
    if (c === '[') { inClass = true; p += 1; continue }
    if (c === ']') { inClass = false; p += 1; continue }
    if (c === '/' && !inClass) {
      p += 1
      while (p < s.length && /[a-z]/.test(s[p])) p += 1
      return p
    }
    p += 1
  }
  return start + 1
}

/** A whole-line assignment of a code literal to one of `CODE_PROPS`, built
 *  from the two authorities rather than restating either, which is this file's
 *  own rule about reading an obligation off the place that holds it. */
const CODE_LINE = new RegExp(
  `^\\s*(?:${[...CODE_PROPS].join('|')})\\s*:\\s*['"]${CODE_SHAPE.source.replace(/^\^|\$$/g, '')}['"]\\s*,?\\s*$`
)

/** Emission sites a LINE-ORIENTED reading can see and the character scanner
 *  did not report. Zero on a synchronised scan. Non-zero means the scanner
 *  lost its place, which is the fault that cost this census 6 of 63 sites
 *  while exiting 0; see this file's `emissionSites` docblock. The shape is
 *  deliberately narrow — the property, a colon, one quoted code literal, end
 *  of line — so it cannot match prose in a comment, whose lines begin with
 *  `*` or `//`. */
function unaccountedIn(source, sites) {
  const reported = new Set(sites.map((s) => s.line))
  const out = []
  source.split('\n').forEach((text, idx) => {
    if (!CODE_LINE.test(text)) return
    if (reported.has(idx + 1)) return
    out.push({ line: idx + 1, text: text.trim() })
  })
  return out
}

function countNewlines(s, from, to) {
  let t = 0
  for (let p = from; p < to; p += 1) if (s[p] === '\n') t += 1
  return t
}

/** Past a quoted or template string, honouring backslash escapes. Nested `${}`
 *  inside a template is skipped as part of the template, which is right here:
 *  the whole point of refusing a template is that its contents are not a code. */
function skipString(s, start) {
  const quote = s[start]
  let p = start + 1
  while (p < s.length) {
    if (s[p] === '\\') { p += 2; continue }
    if (s[p] === quote) return p + 1
    p += 1
  }
  return s.length
}

/** The property's value: everything up to the comma, closing brace or newline
 *  that ends it at depth zero. Depth matters because
 *  `code: pick({a: 1, b: 2})` would otherwise stop inside the call. */
function readValue(s, start) {
  let p = start
  let depth = 0
  while (p < s.length) {
    const c = s[p]
    if (c === '"' || c === "'" || c === '`') { p = skipString(s, p); continue }
    if ('([{'.includes(c)) { depth += 1; p += 1; continue }
    if (')]}'.includes(c)) {
      if (depth === 0) break
      depth -= 1
      p += 1
      continue
    }
    if (depth === 0 && (c === ',' || c === '\n' || c === ';')) break
    p += 1
  }
  return { value: s.slice(start, p).trim(), end: p }
}

/**
 * What a `code:` value tells us about the vocabulary behind it. Three answers,
 * and the three-way split is the whole correctness argument of this file.
 *
 * - `literal`: every path through the expression ends at a code-shaped string
 *   literal present in the source, so the set is complete and readable. One
 *   literal qualifies; so does a ternary whose two arms are both literals,
 *   which is what `tools/board/measured-citation.mjs:154` writes.
 * - `forwarded`: no literal at all, just an identifier or a member access, so
 *   the code was spelled somewhere else and this site only carries it. NOT a
 *   finding. Forwarding moves the obligation to the producer rather than
 *   hiding it, and every producer in `tools/` and `scripts/` is itself
 *   scanned, so the union over the trees is still complete. The count is
 *   printed in the verdict line so that "not a finding" is not the same as
 *   "unremarked".
 * - `constructed`: the site builds a name the source does not contain, with a
 *   template or a concatenation, or mixes a literal with a non-literal path so
 *   that the literals present are provably not the whole set. This IS a
 *   finding, because no amount of parsing recovers the vocabulary and a census
 *   that passed over it would return a smaller set and call it clean.
 *
 * @param {string} value
 * @returns {{kind: 'literal'|'forwarded'|'constructed', codes: string[]}}
 */
export function codesIn(value) {
  const literals = [...value.matchAll(/(['"])([^'"\\]*)\1/g)].map((m) => m[2])
  const codes = [...new Set(literals.filter((l) => CODE_SHAPE.test(l)))]
  if (value.includes('`')) return { kind: 'constructed', codes }
  if (literals.length === 0) {
    return { kind: value === '' ? 'constructed' : 'forwarded', codes: [] }
  }
  if (!literals.every((l) => CODE_SHAPE.test(l))) return { kind: 'constructed', codes }
  // Every path has to END at one of those literals. `§` for a literal, so the
  // two accepted skeletons are a bare literal and a ternary with literal arms.
  // `c.reason || 'COVERAGE_UNKNOWN'` is deliberately NOT accepted: one of its
  // two paths is an identifier, so the literal is a default and not the set.
  const skeleton = value.replace(/(['"])[^'"\\]*\1/g, '§').replace(/\s+/g, ' ').trim()
  if (skeleton === '§') return { kind: 'literal', codes }
  if (/^[^?]+\?\s*§\s*:\s*§$/.test(skeleton)) return { kind: 'literal', codes }
  return { kind: 'constructed', codes }
}

/** Tracked source under the scanned trees, tests separated out: a test file is
 *  where a code gets DECIDED, so it is scanned for names and never for
 *  emissions. */
export function trackedSources(root = REPO_ROOT) {
  const listing = execFileSync('git', ['-C', root, 'ls-files', 'tools', 'scripts'], {
    encoding: 'utf8',
  })
  const all = listing.split('\n').filter((p) => /\.(mjs|js|cjs|ts|tsx)$/.test(p))
  return {
    detectors: all.filter((p) => !/\.test\.(mjs|js|cjs|ts|tsx)$/.test(p)),
    tests: all.filter((p) => /\.test\.(mjs|js|cjs|ts|tsx)$/.test(p)),
  }
}

/**
 * The census. Pure over its inputs so the test suite can drive it with
 * synthetic files instead of the repository.
 *
 * @param {Record<string, string>} detectors path -> source
 * @param {Record<string, string>} tests path -> source
 * @param {Array<{code: string, why: string, measured: string}>} baseline
 */
export function census(detectors, tests, baseline) {
  const codes = new Map() // code -> {code, detector, line}
  const constructed = []
  const forwarded = []
  const unaccounted = []
  let sites = 0
  let regexLiterals = 0
  let regexSkipped = 0

  for (const [path, source] of Object.entries(detectors)) {
    const scan = emissionSites(source)
    regexLiterals += scan.regexLiterals
    regexSkipped += scan.regexSkipped
    for (const u of scan.unaccounted) unaccounted.push({ detector: path, ...u })
    for (const site of scan.sites) {
      sites += 1
      if (site.kind === 'forwarded') {
        forwarded.push({ detector: path, line: site.line, value: site.value })
        continue
      }
      if (site.kind === 'constructed') {
        constructed.push({ detector: path, line: site.line, value: site.value })
        // The literals it DID spell are still part of the vocabulary and are
        // still decided below. Dropping them would make a constructed site
        // hide its readable half as well as its unreadable one.
      }
      for (const code of site.codes) {
        if (!codes.has(code)) codes.set(code, { code, detector: path, line: site.line })
      }
    }
  }

  const named = new Map() // code -> test paths
  for (const [path, source] of Object.entries(tests)) {
    for (const code of codes.keys()) {
      if (new RegExp(`\\b${code}\\b`).test(source)) {
        if (!named.has(code)) named.set(code, [])
        named.get(code).push(path)
      }
    }
  }

  const excused = new Map(baseline.map((e) => [e.code, e]))
  const rows = [...codes.values()]
    .map((c) => ({
      ...c,
      tests: named.get(c.code) ?? [],
      state: named.has(c.code) ? 'asserted' : excused.has(c.code) ? 'excused' : 'undecided',
      why: excused.get(c.code)?.why ?? null,
    }))
    .sort((a, b) => a.code.localeCompare(b.code))

  // A baseline entry that outlived its finding is a second place a defect can
  // hide, which is the ExO seat's own argument about allowlists keyed on a
  // line number. Two ways to outlive it: the code is asserted now, or the
  // detector no longer emits it at all.
  const stale = []
  for (const entry of baseline) {
    if (!codes.has(entry.code)) stale.push({ ...entry, cause: 'no detector emits it' })
    else if (named.has(entry.code)) {
      stale.push({ ...entry, cause: `now named by ${named.get(entry.code).join(', ')}` })
    }
  }

  return { rows, constructed, forwarded, unaccounted, stale, sites, regexLiterals, regexSkipped }
}

/** @param {ReturnType<typeof census>} c */
export function findingsOf(c) {
  const findings = []
  // FIRST, because every other finding here is computed over a vocabulary this
  // one says is incomplete. An unaccounted site means the scanner lost its
  // place, so the codes after it in that file were never read at all and the
  // undecided check below ran over a set that silently excludes them.
  for (const u of c.unaccounted) {
    findings.push({
      locus: LOCUS.COMMITTED,
      rule: 'CODE_SITE_UNACCOUNTED',
      message:
        `${u.detector}:${u.line}: a line-oriented reading sees an emission site here ` +
        `(${JSON.stringify(u.text.slice(0, 80))}) and this census's character scanner reported ` +
        'none, so the scanner lost its place earlier in the file and every code after that point ' +
        'is outside the vocabulary below. Fix the tokeniser, not this line.',
    })
  }
  for (const u of c.constructed) {
    findings.push({
      locus: LOCUS.COMMITTED,
      rule: 'CODE_SITE_CONSTRUCTS_CODE',
      message:
        `${u.detector}:${u.line}: this site BUILDS a defect code the source never spells ` +
        `(${JSON.stringify(u.value.slice(0, 80))}), so the set it can produce cannot be read off ` +
        'it and every code in that set is outside this census. Spell each one as a literal at ' +
        'the site that produces it, and forward it from here.',
    })
  }
  for (const r of c.rows.filter((r) => r.state === 'undecided')) {
    findings.push({
      locus: LOCUS.COMMITTED,
      rule: 'CODE_UNDECIDED',
      message:
        `${r.detector}:${r.line} emits ${r.code} and no test file in tools/ or scripts/ names ` +
        'it, so nothing would notice whether it fires, stops firing, or fires wrongly. Assert ' +
        `it, or add it to ${BASELINE_PATH} with the reason it cannot be.`,
    })
  }
  for (const s of c.stale) {
    findings.push({
      locus: LOCUS.COMMITTED,
      rule: 'CENSUS_ENTRY_STALE',
      message:
        `${BASELINE_PATH} excuses ${s.code}, which ${s.cause}. An excuse that outlives its ` +
        'finding is a second place a defect can hide. Delete the entry.',
    })
  }
  return findings
}

export function verdict(findings, seen = {}) {
  const {
    codes = 0, detectors = 0, asserted = 0, excused = 0, sites = 0, forwarded = 0, ground = null,
  } = seen

  if (ground) {
    return verdictOf({
      exitCode: 2,
      stream: 'err',
      derivedFrom: 'ground',
      cause: ground.cause,
      line: ground.line,
    })
  }

  const counted =
    `${codes} code(s) across ${detectors} detector(s), of which ${asserted} are named by a test ` +
    `and ${excused} carry a written baseline entry`

  if (findings.length === 0) {
    return verdictOf({
      exitCode: 0,
      cause: 'EVERY_CODE_DECIDED',
      line:
        `Code census: ${counted}. No emission site builds a code the source does not spell, ` +
        `and the ${forwarded} site(s) that forward one got it from a producer in these same ` +
        'trees, so no code here is emitted with nothing watching it. "Named by a test" is ' +
        'weaker than "asserted on"; see this file\'s header.',
    })
  }

  return verdictOf({
    exitCode: 1,
    stream: 'err',
    cites: [LOCUS.COMMITTED],
    cause: 'CODE_DECIDED_BY_NOTHING',
    line:
      `Code census: ${findings.length} finding(s) over ${counted}. Every one is a committed ` +
      `file, so every checkout and CI has it too, and repairing it is a pull request. ${sites} ` +
      `emission site(s) were scanned, ${forwarded} of them forwarding a code named elsewhere.`,
  })
}

// ---------------------------------------------------------------------------
// Program
// ---------------------------------------------------------------------------

const invokedDirectly =
  process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href

if (invokedDirectly) {
  const JSON_OUT = process.argv.includes('--json')
  const CODES_ONLY = process.argv.includes('--codes')

  let found
  try {
    found = trackedSources()
  } catch (err) {
    const v = verdict([], {
      ground: {
        cause: 'NOT_A_GIT_CHECKOUT',
        line: `Code census: git ls-files failed in ${REPO_ROOT} (${err.message}), so no file list could be built and this run established nothing.`,
      },
    })
    console.error(v.line)
    process.exit(v.exitCode)
  }

  const read = (paths) => {
    const out = {}
    for (const p of paths) {
      try {
        out[p] = readFileSync(resolve(REPO_ROOT, p), 'utf8')
      } catch {
        // Tracked but absent from the working tree. Skipped rather than fatal,
        // and counted so the positive control below can still fail.
      }
    }
    return out
  }

  let baseline = []
  try {
    baseline = JSON.parse(readFileSync(resolve(REPO_ROOT, BASELINE_PATH), 'utf8')).excused
  } catch (err) {
    const v = verdict([], {
      ground: {
        cause: 'BASELINE_UNREADABLE',
        line: `Code census: ${BASELINE_PATH} could not be read or parsed (${err.message}), so which codes are excused is unknown and a clean result cannot be reported.`,
      },
    })
    console.error(v.line)
    process.exit(v.exitCode)
  }

  const c = census(read(found.detectors), read(found.tests), baseline)
  const findings = findingsOf(c)

  // The positive control. A scan that matched no emission site has not found a
  // clean tree, it has failed to read one, and this gate's whole output is a
  // function of that scan. `tools/instant-gate.mjs` reports the same state the
  // same way, for the same reason: an absence is a measurement and it needs a
  // control.
  if (c.sites === 0) {
    const v = verdict([], {
      ground: {
        cause: 'SCAN_FOUND_NO_SITES',
        line: `Code census: scanned ${found.detectors.length} detector file(s) and matched no code emission site at all, which is a broken scanner rather than a clean tree.`,
      },
    })
    console.error(v.line)
    process.exit(v.exitCode)
  }

  const v = verdict(findings, {
    codes: c.rows.length,
    detectors: new Set(c.rows.map((r) => r.detector)).size,
    asserted: c.rows.filter((r) => r.state === 'asserted').length,
    excused: c.rows.filter((r) => r.state === 'excused').length,
    sites: c.sites,
    forwarded: c.forwarded.length,
  })

  if (JSON_OUT) {
    console.log(JSON.stringify({ ...c, findings, verdict: v }, null, 2))
  } else if (CODES_ONLY) {
    const w = Math.max(...c.rows.map((r) => r.code.length))
    for (const r of c.rows) {
      console.log(
        `${r.state.padEnd(9)}  ${r.code.padEnd(w)}  ${r.detector}:${r.line}` +
          (r.state === 'asserted' ? `  <- ${r.tests.join(', ')}` : '') +
          (r.state === 'excused' ? `  <- ${r.why}` : ''),
      )
    }
  } else {
    for (const f of findings) console.log(`::error::${f.rule}: ${f.message}`)
  }

  if (!JSON_OUT) (v.stream === 'err' ? console.error : console.log)(v.line)
  process.exit(v.exitCode)
}
