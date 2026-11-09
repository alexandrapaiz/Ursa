#!/usr/bin/env node
// Which modules under `tools/` and `scripts/` do work when they are imported.
//
//   node tools/gates/import-effects.mjs              # the decision
//   node tools/gates/import-effects.mjs --json
//   node tools/gates/import-effects.mjs --all        # every module and its state
//
// Exit 0 every module that does work at module scope is either guarded by an
// entry-point test or carries a written baseline entry. Exit 1 a module does
// unguarded work at import time and nothing excuses it, or a guard asks the
// wrong question, or a baseline entry has outlived its finding. Exit 2 the
// facts could not be established, because a scan that matched no module must
// not read like a clean sweep.
//
// WHY THIS FILE EXISTS, and it is not a general style rule. The class is one
// defect with a measured price in this repository, three times:
//
//   1. `tools/board/post.mjs` reads the environment, builds a payload and
//      awaits a `fetch` at module scope, so importing it POSTS A MESSAGE.
//      `tools/board/live-target.mjs` exists only to make one branch of it
//      reachable from a test, and its header says so in those words.
//   2. Ursa's ExO seat reported on 2026-11-09 at 05:01:18Z that `main()` ran
//      at module scope in a route sweep it had just written, so importing the
//      tool performed sixty live GETs and its test file could not reach one
//      function without probing production. Its suite went 36 seconds to 0.7
//      once the entry point was guarded.
//   3. `tools/image-metadata.mjs` guards its `main()` with a predicate that
//      compares this module's URL against the BASENAME of `process.argv[1]`,
//      which is true for any entry point whose filename is a suffix of this
//      one. Demonstrated at 06:0xZ on 2026-11-09 from a two-line importer
//      saved as `metadata.mjs`: the import printed the whole image census and
//      then `process.exit` ended the importing process, which never reached
//      its own second line. That is a guard that is present, that reads as
//      correct, and that does not hold.
//
// The ExO seat's own note on (2) is the reason this is a gate and not another
// paragraph: *"live-target.mjs exists because post.mjs has that defect and its
// header says so in those words. I wrote the sixth anyway."* The warning was
// committed, in prose, in the file whose existence is the warning, and the
// seat that wrote the sixth instance had read it. A prose warning did not stop
// the sixth. This is what stops the seventh.
//
// SCOPE BEFORE BREADTH, which is the other half of that seat's note, posted
// 05:46:18Z: *"a detector keyed on a whole command needs its scope fixed
// before its breadth, because breadth multiplies whatever the scope is already
// getting wrong."* So the scope here is deliberately one decidable question
// and the breadth is two codes, each with a demonstrated instance above.
//
// THE SCOPE IS COLUMN ZERO, and that one restriction is doing more work than
// any pattern below. A line that begins in column 0, outside a comment and
// outside a template literal, is a module-scope statement in these trees,
// because every statement nested in a block is indented. Three consequences,
// and the third is the reason this needs no exemption list:
//
//   * no brace counting, so no tokeniser, so none of the regex-literal and
//     string-with-a-brace cases that make a depth-tracking scanner wrong on
//     exactly the files in this repository that are full of regex literals;
//   * a multi-line template literal is the one real false-positive source, and
//     backtick parity is a far more robust thing to track than brace depth;
//   * work inside `if (invokedDirectly) { ... }` is INDENTED, so a guarded
//     entry point is out of scope structurally rather than by exemption. The
//     ExO seat's `post.mjs` exemption was deleted rather than narrowed for the
//     reason it gave -- "a narrowed exemption is the same defect with a smaller
//     denominator" -- and the way not to need one is for the scope to encode
//     the thing the exemption was for.
//
// WHAT THIS DOES NOT SEE, stated because an absence instrument that does not
// name its blind spots reads as a clean sweep. It does not see work inside an
// unguarded module-scope `if` whose own line this gate already reports (one
// finding per region, not per statement). It does not see a module-scope
// `const x = doWork()`, which is a declaration by this gate's rule and a side
// effect in fact; that is `docs/ideas.md`'s own entry rather than this file's
// silent omission. And it does not run the module, so it reports the SHAPE of
// an import-time effect and never the effect. The behavioural reading -- import
// each module in a child process with the primitives recorded -- is the
// stronger instrument and it cannot be the first one, because performing it on
// `post.mjs` posts a message.

import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

import { LOCUS, verdictOf } from './verdict-shape.mjs'

export const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')
export const BASELINE_PATH = 'tools/gates/import-effects.baseline.json'

// ---------------------------------------------------------------------------
// The scan, pure over a file's text
// ---------------------------------------------------------------------------

/** A column-0 line that opens a declaration rather than performing work.
 *  `export` covers `export function`, `export const` and `export default`
 *  alike; `export default main()` would be a side effect and does not occur
 *  in these trees, which is recorded here as a known gap rather than guessed
 *  at with a pattern nothing exercises. */
const DECLARATION = /^(import|export|const|let|var|function|class|async\s+function)\b/

/** A column-0 line that continues or closes a declaration begun above it.
 *  These are the only column-0 lines in these trees that are not statements:
 *  a closing brace, bracket or paren, a leading operator in a wrapped
 *  expression, or a chained method call on a wrapped subject. */
const CONTINUATION = /^([}\])>,;?:.]|=>|&&|\|\||\+|\*\/|`)/

/** A column-0 line that performs work at import time. Three shapes, each
 *  present in these trees today:
 *   - a bare or awaited call, which is `main()`, `run()`, `await fetch(...)`;
 *   - control flow, which is the `if`/`for`/`try` that `post.mjs` is built out
 *     of and that executes on import whether or not its body runs;
 *   - a bare `await`, `throw` or `delete`. */
const WORK = [
  { shape: 'call', re: /^(await\s+)?[A-Za-z_$][\w$.]*\s*\(/ },
  { shape: 'control', re: /^(if|for|while|switch|try|do)\b/ },
  { shape: 'effect', re: /^(await|throw|delete)\b/ },
]

/** Does this predicate ask whether THIS MODULE is the entry point?
 *
 *  The question has exactly one correct form and this repository spells it
 *  seven ways. The correct form compares `import.meta.url` to
 *  `process.argv[1]` resolved to a URL, so both sides are absolute and the
 *  comparison is about identity. A predicate that names both terms is counted
 *  as a guard here, because whatever else is wrong with it, it does keep the
 *  work off the import path -- which is this gate's question. A predicate that
 *  names only one of them, or that compares a BASENAME, is a guard that asks a
 *  different question and gets its own code.
 *
 *  @param {string} text the predicate's source, parens included
 *  @returns {null | {kind: 'identity'|'basename'|'partial'}} */
export function guardKind(text) {
  const namesUrl = /import\.meta\.url/.test(text)
  const namesArgv = /process\.argv\[1\]/.test(text)
  // `process.argv[1]` IS THE NECESSARY TERM, and requiring it is this
  // function's second scope repair. Its first version asked for either term
  // and so counted `const REPO_ROOT = resolve(dirname(fileURLToPath(
  // import.meta.url)), '..', '..')` as a guard named REPO_ROOT, after which
  // every module-scope `if` mentioning REPO_ROOT was reported as a guard
  // asking the wrong question. `import.meta.url` on its own is this
  // repository's path-resolution idiom and appears in modules that have no
  // entry point at all; the question "am I the entry point" cannot be asked
  // without naming the entry point. This is Ursa/exo's sentence of
  // 2026-11-09T05:01Z -- "an attribute computed over a set, read as if it
  // named a member" -- with this file as the author, found by its own first
  // live run over these trees rather than by reasoning.
  if (!namesArgv) return null
  // A suffix test is a basename test however it is spelled, and `split('/')`
  // with `pop()` is the same reduction written longhand. Checked before
  // identity, because `image-metadata.mjs` names both terms AND compares a
  // basename, and the defect is the comparison rather than the operands.
  if (/\.endsWith\s*\(/.test(text) || /split\s*\(\s*['"]\/['"]\s*\)/.test(text)) {
    return { kind: 'basename' }
  }
  if (namesUrl && namesArgv) return { kind: 'identity' }
  return { kind: 'partial' }
}

/** The condition inside a leading `if (...)`, by balanced parens, or null.
 *  Parens inside single- or double-quoted strings are skipped, which is the
 *  whole of the quoting this needs: every entry-point predicate in these trees
 *  quotes at most a file name, and a file name holds no paren.
 *  @param {string} line
 *  @returns {string|null} */
export function ifCondition(line) {
  const m = line.match(/^if\s*\(/)
  if (!m) return null
  let depth = 0
  let quote = null
  for (let i = m[0].length - 1; i < line.length; i += 1) {
    const ch = line[i]
    if (quote) {
      if (ch === '\\') i += 1
      else if (ch === quote) quote = null
      continue
    }
    if (ch === "'" || ch === '"' || ch === '`') { quote = ch; continue }
    if (ch === '(') depth += 1
    else if (ch === ')') {
      depth -= 1
      if (depth === 0) return line.slice(m[0].length, i)
    }
  }
  return null
}

/** Every module-scope finding in one file's text.
 *
 *  THE GUARD IS RESOLVED THROUGH A NAME, and getting that wrong is what the
 *  first live run of this gate did. `if (invokedDirectly) { ... }`,
 *  `if (invokedDirectly) process.exit(main(...))` and `if (invokedDirectly()) {`
 *  are all guards, and the predicate is nowhere on those lines. So the scan
 *  learns a name from a column-0 `const NAME =` or `function NAME()` whose text
 *  asks the entry-point question, and then reads an `if` condition for a name
 *  it has learned. A scan that only matched the predicate inline called three
 *  correctly guarded modules defective and reported one basename guard at the
 *  line that USES it rather than the line that is wrong.
 *
 *  @param {string} source
 *  @param {string} file the path, for the finding's message
 *  @returns {{file: string, line: number, text: string, code: string,
 *             shape: string, locus: string}[]} */
export function scanModule(source, file) {
  const lines = source.split('\n')
  /** name -> {kind, line, text} for every module-scope definition whose text
   *  asks the entry-point question. The definition always precedes the use in
   *  a module -- a `const` read before its initializer is a TDZ error, and a
   *  hoisted function could in principle be used above its declaration, which
   *  does not occur here and would show up as a finding rather than as
   *  silence. */
  const guards = new Map()
  const findings = []
  let inBlock = false
  let inTemplate = false
  let skipUntilCol0Close = false

  /** The indented continuation of a column-0 definition, joined. */
  const bodyAfter = (i) => {
    let text = ''
    for (let j = i + 1; j < lines.length && (lines[j].trim() === '' || /^\s+\S/.test(lines[j])); j += 1) {
      text += lines[j]
    }
    return text
  }

  for (let i = 0; i < lines.length; i += 1) {
    const raw = lines[i]
    let rest = raw

    if (inBlock) {
      const end = rest.indexOf('*/')
      if (end === -1) continue
      rest = rest.slice(end + 2)
      inBlock = false
      if (rest.trim() === '') continue
    }

    const atColumnZero = raw.length > 0 && !/^\s/.test(raw) && !inTemplate
    const wasInTemplate = inTemplate

    // State for the NEXT line is advanced before this line is judged, so a
    // line that opens a template literal is itself still judged normally.
    const opens = (rest.match(/\/\*/g) ?? []).length
    const closes = (rest.match(/\*\//g) ?? []).length
    if (opens > closes) inBlock = true
    const ticks = (rest.replace(/\\`/g, '').match(/`/g) ?? []).length
    if (ticks % 2 === 1) inTemplate = !inTemplate

    if (!atColumnZero || wasInTemplate) continue
    if (/^(\/\/|\/\*|\*|#!)/.test(raw)) continue

    // A region already accounted for -- a guard's body, or a finding's own
    // block -- runs to the next column-0 closing brace. One finding per
    // region, because twenty lines of one unguarded program is one repair.
    if (skipUntilCol0Close) {
      if (/^[}]/.test(raw)) skipUntilCol0Close = false
      continue
    }

    const constDecl = raw.match(/^const\s+([A-Za-z_$][\w$]*)\s*=([\s\S]*)$/)
    if (constDecl) {
      const text = constDecl[2] + bodyAfter(i)
      const kind = guardKind(text)
      if (kind) guards.set(constDecl[1], { ...kind, line: i + 1, text: raw.trim() })
      continue
    }

    const fnDecl = raw.match(/^(?:export\s+)?function\s+([A-Za-z_$][\w$]*)\s*\(/)
    if (fnDecl) {
      const kind = guardKind(bodyAfter(i))
      if (kind) guards.set(fnDecl[1], { ...kind, line: i + 1, text: raw.trim() })
      // A function declaration is a declaration; its body is indented and so
      // out of scope either way.
      continue
    }

    if (DECLARATION.test(raw)) continue
    if (CONTINUATION.test(raw)) continue

    const hit = WORK.find((w) => w.re.test(raw))
    if (!hit) continue

    // Is this statement an entry-point guard, inline or through a name?
    const cond = ifCondition(raw)
    let guard = cond === null ? null : guardKind(cond)
    let at = { line: i + 1, text: raw.trim() }
    if (!guard && cond !== null) {
      for (const name of cond.match(/[A-Za-z_$][\w$]*/g) ?? []) {
        const known = guards.get(name)
        if (!known) continue
        guard = { kind: known.kind }
        // The defect, when the guard is the wrong question, is in the
        // DEFINITION and not in the `if` that reads it. Reporting the use
        // would send a reader at a line that is correct.
        at = { line: known.line, text: known.text }
        break
      }
    }

    if (guard) {
      if (/\{\s*$/.test(raw)) skipUntilCol0Close = true
      if (guard.kind === 'identity') continue
      findings.push({
        file,
        ...at,
        shape: guard.kind,
        locus: LOCUS.COMMITTED,
        code: 'GUARD_ASKS_THE_WRONG_QUESTION',
      })
      continue
    }

    if (/\{\s*$/.test(raw)) skipUntilCol0Close = true
    findings.push({
      file,
      line: i + 1,
      text: raw.trim(),
      shape: hit.shape,
      locus: LOCUS.COMMITTED,
      code: 'IMPORT_DOES_WORK',
    })
  }

  return findings
}

/** The sweep over a set of modules, one finding per (module, code).
 *
 *  THE UNIT IS THE MODULE AND NOT THE LINE, and the first draft of this file
 *  got that wrong. Keyed per line, `tools/board/post.mjs` produced sixteen
 *  findings that are one defect with one repair: its whole program is at module
 *  scope, so every statement in it is a hit and a reader fixing the file fixes
 *  all sixteen at once. Sixteen lines in CI's log for one repair is the defect
 *  `tools/gates/verdict-shape.mjs`'s header is about, arriving from the other
 *  direction. So the finding names the module, the FIRST statement, and how
 *  many there are, and the baseline is keyed on the pair (module, code) for the
 *  same reason.
 *
 *  @param {Record<string, string>} modules path -> source
 *  @param {{excused?: {file: string, code: string, why: string}[]}} baseline */
export function sweep(modules, baseline) {
  const excused = new Map()
  for (const e of baseline.excused ?? []) excused.set(`${e.file}\u0000${e.code}`, e)

  const statements = []
  for (const [file, source] of Object.entries(modules)) statements.push(...scanModule(source, file))

  // Collapse to the pair, keeping the first statement and the count.
  const byPair = new Map()
  for (const st of statements) {
    const key = `${st.file}\u0000${st.code}`
    const seen = byPair.get(key)
    if (seen) seen.count += 1
    else byPair.set(key, { ...st, count: 1 })
  }

  const used = new Set()
  const findings = []
  for (const [key, f] of byPair) {
    if (excused.has(key)) {
      used.add(key)
      continue
    }
    const more = f.count === 1 ? '' : ` and ${f.count - 1} more statement(s) below it`
    findings.push({
      ...f,
      rule: f.code,
      message:
        f.code === 'IMPORT_DOES_WORK'
          ? `${f.file}:${f.line} runs at module scope (\`${f.text}\`)${more}, so importing this ` +
            'file performs it. Move the program into a function and call it behind ' +
            '`const invokedDirectly = process.argv[1] !== undefined && import.meta.url === ' +
            'pathToFileURL(process.argv[1]).href`, or add an entry to ' +
            `${BASELINE_PATH} saying why it stays.`
          : `${f.file}:${f.line} guards its entry point with \`${f.text}\``
            + `${more}, which compares a file NAME rather than this module's identity, so it is `
            + 'true for any entry point whose own name is a suffix of this one. Compare '
            + '`import.meta.url` to `pathToFileURL(process.argv[1]).href`.',
    })
  }

  const stale = []
  for (const [key, e] of excused) {
    if (used.has(key)) continue
    stale.push({
      file: e.file,
      line: 0,
      count: 0,
      locus: LOCUS.COMMITTED,
      rule: 'IMPORT_BASELINE_STALE',
      code: 'IMPORT_BASELINE_STALE',
      shape: 'baseline',
      text: `${e.file} / ${e.code}`,
      message:
        `${BASELINE_PATH} excuses ${e.code} in ${e.file} and the scan no longer finds it. An ` +
        'excuse that outlives its finding is a second place the defect can hide. Delete the ' +
        'entry.',
    })
  }

  return {
    findings: [...findings, ...stale],
    scanned: Object.keys(modules).length,
    excusedCount: excused.size,
    hits: byPair.size,
    statements: statements.length,
  }
}

/** Every non-test module git tracks under these trees.
 *  @returns {string[]} */
export function trackedModules(root = REPO_ROOT) {
  const listing = execFileSync('git', ['-C', root, 'ls-files', 'tools', 'scripts'], {
    encoding: 'utf8',
  })
  return listing
    .split('\n')
    .filter((p) => /\.mjs$/.test(p))
    .filter((p) => !/\.test\.mjs$/.test(p))
}

// ---------------------------------------------------------------------------
// Program
// ---------------------------------------------------------------------------

const invokedDirectly =
  process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href

if (invokedDirectly) {
  const { verdict } = await import('./import-effects-verdict.mjs')
  const asJson = process.argv.includes('--json')
  const showAll = process.argv.includes('--all')

  let modules
  try {
    modules = trackedModules()
  } catch (err) {
    const v = verdict([], {
      ground: {
        cause: 'NOT_A_GIT_CHECKOUT',
        line: `Import effects: git ls-files failed in ${REPO_ROOT} (${err.message}), so no module list could be built and this run established nothing.`,
      },
    })
    console.error(v.line)
    process.exit(v.exitCode)
  }

  let baseline = { excused: [] }
  try {
    baseline = JSON.parse(readFileSync(path.join(REPO_ROOT, BASELINE_PATH), 'utf8'))
  } catch (err) {
    const v = verdict([], {
      ground: {
        cause: 'BASELINE_UNREADABLE',
        line: `Import effects: ${BASELINE_PATH} could not be read (${err.message}). Silence over a scope whose exclusions are unknown reads as clean, so this run established nothing.`,
      },
    })
    console.error(v.line)
    process.exit(v.exitCode)
  }

  const sources = {}
  for (const p of modules) {
    try {
      sources[p] = readFileSync(path.join(REPO_ROOT, p), 'utf8')
    } catch {
      /* a tracked-but-absent path is the clone's business, not this gate's */
    }
  }

  const result = sweep(sources, baseline)
  const v = verdict(result.findings, result)

  if (asJson) {
    console.log(JSON.stringify({ ...result, verdict: v }, null, 2))
    process.exit(v.exitCode)
  }

  if (showAll) {
    for (const p of modules) {
      const hits = scanModule(sources[p] ?? '', p)
      console.log(`${hits.length === 0 ? 'import-is-inert ' : 'does-work       '} ${p}${hits.length ? `  (${hits.length})` : ''}`)
    }
  }

  const out = v.stream === 'err' ? console.error : console.log
  for (const f of result.findings) out(`::${v.exitCode === 1 ? 'error' : 'warning'}::${f.rule}: ${f.message}`)
  out(v.line)
  for (const extra of v.trailer) out(extra)
  process.exit(v.exitCode)
}
