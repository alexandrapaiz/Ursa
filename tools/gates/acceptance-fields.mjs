#!/usr/bin/env node
// Every field on every entry of this repository's acceptance registers, and
// whether anything reads it.
//
//   node tools/gates/acceptance-fields.mjs            # the table
//   node tools/gates/acceptance-fields.mjs --json      # same, machine-readable
//   node tools/gates/acceptance-fields.mjs --all       # read fields too
//
// Exit 0 every field is read by a consumer, declared documentation-only by its
// own register, or carried by this gate's baseline. Exit 1 at least one is
// none of the three, which is a defect in a tracked file. Exit 2 the facts
// could not be established -- not a git checkout, an unreadable manifest, or a
// register that is not parseable JSON -- and then this run established nothing.
//
// WHY THIS GATE EXISTS, and it is one night's finding in two seats at once.
// Ursa's security seat shipped `EXPECTED_ABSENT_FIXTURES` in
// `tools/secret-print-tests.py` with an `absent_path` beside each entry, read
// off the filesystem on every run, and then found that the entry still
// absorbed a red that had nothing to do with the absence. Its own account of
// why is the sentence this gate is built on: "`absent_path` is a claim about
// the tree and I checked it against the tree. `This test fails BECAUSE of that
// absence` is a claim about causation, and the filesystem is not asked about
// causation."
//
// The same hour, in this seat's lane, a weaker version of the same thing was
// measured over the whole repository. `tools/seat/suite-baseline.json` carries
// 22 distinct fields on its `repaired` entries and no consumer reads 14 of
// them. `tools/gates/import-effects.baseline.json` carries a `why`, a
// `measured` and a `repair` on every entry and the gate reads none of the
// three: its output line never prints one, which was checked by running it.
// Those fields are the reason an accepted risk was accepted, and they were
// prose with an exit code next to them.
//
// THE FLOOR THIS GATE ASSERTS, AND THE CEILING IT DOES NOT. Read is not
// executed. A field can be read and still be read for a question other than
// the one it claims to answer, which is precisely what happened to
// `absent_path`: read every run, and wrong anyway. No static check settles
// that. The one register in this repository whose reason is EXECUTED is
// `tools/secret-print-tests.py`, whose entries now declare a `stand_in`: the
// runner materialises the missing fixture, re-runs that one test, and absorbs
// the failure only if it goes green. That is a differential, it is the
// strongest form available, and it is out of this gate's scope because the
// register is Python and the tool that grades it is
// `tools/secret-print-exemptions.py`. Said here rather than left implicit,
// because a gate that reports the floor without naming the ceiling invites
// its own reader to mistake one for the other.
//
// THE INSTRUMENT UNDER-CLAIMS READS ON PURPOSE. A read is counted only on
// `.field`, `['field']`, `["field"]`, or a destructuring binding, over consumer
// sources with comments stripped. A field validated by name through a schema
// list -- `tools/secret-scan-baseline.mjs` builds `REQUIRED` from
// `Object.keys(FIELDS)`, so `cites` and `why_not_a_credential` are checked for
// presence and type and never dereferenced -- reads as unread here and is
// baselined with that as its reason. The bias is deliberate and it is the
// security seat's own argument for the direction of its stand-in: a false
// finding costs a reader one minute and names the field, and a false clean
// absorbs a claim that has started to drift. Over-reporting is the safe side.
//
// DISCOVERY IS DYNAMIC, so a register cannot appear in silence. Any JSON file
// git tracks under `tools/`, `scripts/` or the repository root whose top level
// holds a non-empty array of objects is a candidate, and every candidate must
// appear in the manifest either as an acceptance register or as data with the
// reason it is not one. `docs/` is out of scope: the design reviews hold
// dozens of measurement dumps that are nobody's accepted risk, and including
// them would make the manifest a list of things to ignore.

import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { LOCUS } from './verdict-shape.mjs'

const HERE = path.dirname(fileURLToPath(import.meta.url))
export const REPO_ROOT = path.resolve(HERE, '..', '..')
export const MANIFEST_PATH = 'tools/gates/acceptance-fields.json'

/** The trees whose JSON is a gate's own data rather than a measurement. */
const SCOPE = ['tools', 'scripts']

/** Files in scope by path but never a register: dependency manifests. */
const NEVER = /(^|\/)(package(-lock)?\.json|tsconfig[^/]*\.json)$/

// ---------------------------------------------------------------------------
// Reading a register
// ---------------------------------------------------------------------------

/** The distinct field names over an array of entry objects, sorted.
 *  @param {unknown} entries
 *  @returns {string[]} */
export function fieldsOf(entries) {
  if (!Array.isArray(entries)) return []
  const out = new Set()
  for (const e of entries) {
    if (e && typeof e === 'object' && !Array.isArray(e)) for (const k of Object.keys(e)) out.add(k)
  }
  return [...out].sort()
}

/** Whether a candidate file's top level holds a non-empty array of objects.
 *  An EMPTY array is a register too -- `dep-floor.allow.json` has no exceptions
 *  today and is still where an accepted risk goes -- but it has no fields to
 *  grade, so it is discovered only if the manifest already names it.
 *  @param {unknown} parsed
 *  @returns {string[]} the keys that hold entry arrays */
export function entryKeysOf(parsed) {
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return []
  return Object.entries(parsed)
    .filter(([, v]) => Array.isArray(v) && v.length > 0 && v.every((x) => x && typeof x === 'object' && !Array.isArray(x)))
    .map(([k]) => k)
}

/** Comments removed, so a field named only in a JSDoc type or a header
 *  paragraph does not read as a consumer reading it. This is the whole reason
 *  the measurement differs from `grep -c`: `tools/gates/code-census.mjs`
 *  mentions `repair` once and `measured` once, and both are in comments.
 *  @param {string} src
 *  @returns {string} */
export function stripComments(src) {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/(^|[^:\w])\/\/[^\n]*/g, (m, p) => p)
}

/** Does any consumer dereference this field?
 *  @param {string} field
 *  @param {string} code consumer sources, already stripped of comments
 *  @returns {boolean} */
export function isRead(field, code) {
  const q = field.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const forms = [
    new RegExp(`\\.${q}\\b`),
    new RegExp(`\\['${q}'\\]`),
    new RegExp(`\\["${q}"\\]`),
    new RegExp(`\\{[^{}\\n]*\\b${q}\\b[^{}\\n]*\\}\\s*=`),
  ]
  return forms.some((re) => re.test(code))
}

// ---------------------------------------------------------------------------
// The sweep
// ---------------------------------------------------------------------------

/**
 * @param {{registers: any[], data?: any[]}} manifest
 * @param {{excused?: any[]}} baseline
 * @param {string[]} candidates every discovered JSON path in scope
 * @param {(p: string) => string} read file contents by repo-relative path
 * @param {(p: string) => boolean} exists
 */
export function sweep(manifest, baseline, candidates, read, exists) {
  const findings = []
  const push = (rule, message) => findings.push({ rule, code: rule, locus: LOCUS.COMMITTED, message })

  const classified = new Set([
    ...(manifest.registers ?? []).map((r) => r.path),
    ...(manifest.data ?? []).map((r) => r.path),
  ])
  for (const p of candidates) {
    if (classified.has(p)) continue
    push(
      'REGISTER_UNCLASSIFIED',
      `${p} holds an array of entry objects under ${SCOPE.join('/ or ')}/ and ${MANIFEST_PATH} ` +
        'does not say whether it is an acceptance register. An exclusion nobody wrote down is ' +
        'indistinguishable from one nobody noticed, so classify it there, as a register with ' +
        'its consumers or as data with the reason it is not one.',
    )
  }

  // The baseline's own fields are ASSERTED here rather than listed as read,
  // because this file is itself an acceptance register and the first reader to
  // notice that was this gate running against its own output. `owner` says who
  // holds the repair, `kind` separates a deferred repair from this scan
  // under-claiming a read, and `measured` dates the reading. A baseline whose
  // own entries were prose would be the thing this gate is about.
  const KINDS = new Set(['repair', 'instrument'])
  for (const e of baseline.excused ?? []) {
    const at = `tools/gates/acceptance-fields.baseline.json ${e.register} / ${e.field}`
    if (!e.owner || typeof e.owner !== 'string') {
      push('BASELINE_ENTRY_MALFORMED', `${at} names no \`owner\`, so nobody holds the repair it defers.`)
    }
    if (!KINDS.has(e.kind)) {
      push(
        'BASELINE_ENTRY_MALFORMED',
        `${at} has kind ${JSON.stringify(e.kind)} and the only two are ${[...KINDS].join(' and ')}. ` +
          'A baseline that mixes a deferred repair with a read this scan cannot see is a file ' +
          'whose own count means nothing.',
      )
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(e.measured))) {
      push('BASELINE_ENTRY_MALFORMED', `${at} has no \`measured\` date in YYYY-MM-DD, so the reading cannot be aged.`)
    }
  }

  const excused = new Map(
    (baseline.excused ?? []).map((e) => [`${e.register}\u0000${e.field}`, e]),
  )
  const usedExcuse = new Set()
  const rows = []
  let entries = 0

  for (const reg of manifest.registers ?? []) {
    const consumers = reg.consumers ?? []
    let code = ''
    for (const c of consumers) {
      if (!exists(c)) {
        push(
          'CONSUMER_MISSING',
          `${MANIFEST_PATH} names ${c} as a consumer of ${reg.path} and that path is not in ` +
            'the tree, so every field of that register would read as unread for a reason that ' +
            'is about the manifest. Fix the path or drop the consumer.',
        )
        continue
      }
      code += '\n' + stripComments(read(c))
    }

    const parsed = JSON.parse(read(reg.path))
    // `entries` is a list because one register can hold two: `suite-baseline`
    // keeps `red` and `repaired`, and a field that appears on either is a
    // field this gate is about.
    const keys = Array.isArray(reg.entries) ? reg.entries : [reg.entries]
    const list = keys.flatMap((k) => (Array.isArray(parsed[k]) ? parsed[k] : []))
    entries += list.length
    const fields = fieldsOf(list)
    const declared = new Set(Object.keys(parsed[reg.declares ?? '_documentation_only'] ?? {}))

    for (const d of declared) {
      if (!fields.includes(d)) {
        push(
          'DECLARATION_STALE',
          `${reg.path} declares ${d} documentation-only and no entry carries that field any ` +
            'more. A declaration that outlives its field is a second place a reason can hide.',
        )
      } else if (isRead(d, code)) {
        push(
          'DECLARATION_STALE',
          `${reg.path} declares ${d} documentation-only and a consumer now reads it. The ` +
            'declaration says a reader may change this field freely, which is no longer true.',
        )
      }
    }

    for (const f of fields) {
      const read_ = isRead(f, code)
      const key = `${reg.path}\u0000${f}`
      const excuse = excused.get(key)
      if (excuse) usedExcuse.add(key)
      const state = read_
        ? 'read'
        : declared.has(f)
          ? 'declared'
          : excuse
            ? 'baselined'
            : 'unread'
      rows.push({ register: reg.path, field: f, state, why: excuse?.why ?? null })

      if (state === 'unread') {
        push(
          'FIELD_UNREAD',
          `${reg.path}: entries carry \`${f}\` and no consumer (${consumers.join(', ') || 'none ' +
            'declared'}) dereferences it. The field is the reason an accepted risk was ` +
            'accepted, so either a consumer reads it, or the register declares it ' +
            'documentation-only with the reason, or it goes in ' +
            'tools/gates/acceptance-fields.baseline.json with the repair it defers.',
        )
      }
      if (read_ && excuse) {
        push(
          'FIELD_BASELINE_STALE',
          `tools/gates/acceptance-fields.baseline.json excuses ${reg.path} / ${f} as unread and ` +
            'a consumer reads it now. The repair landed; delete the entry so the baseline can ' +
            'only shrink.',
        )
      }
    }
  }

  for (const [key, e] of excused) {
    if (usedExcuse.has(key)) continue
    push(
      'FIELD_BASELINE_STALE',
      `tools/gates/acceptance-fields.baseline.json excuses ${e.register} / ${e.field} and no ` +
        'entry in that register carries that field any more, so the excuse has outlived its ' +
        'finding. Delete the entry.',
    )
  }

  const byState = (s) => rows.filter((r) => r.state === s).length
  return {
    findings,
    rows,
    seen: {
      registers: (manifest.registers ?? []).length,
      entries,
      fields: rows.length,
      asserted: byState('read'),
      declared: byState('declared'),
      baselined: byState('baselined'),
    },
  }
}

/** Every JSON file git tracks in scope whose top level holds entry objects.
 *  @returns {string[]} */
export function discover(root = REPO_ROOT) {
  const listing = execFileSync('git', ['-C', root, 'ls-files', '--', '*.json', ...SCOPE.map((s) => `${s}/*.json`)], {
    encoding: 'utf8',
  })
  const paths = [...new Set(listing.split('\n').filter(Boolean))]
    .filter((p) => !NEVER.test(p))
    .filter((p) => SCOPE.some((s) => p.startsWith(`${s}/`)) || !p.includes('/'))
  const out = []
  for (const p of paths) {
    let parsed
    try {
      parsed = JSON.parse(readFileSync(path.join(root, p), 'utf8'))
    } catch {
      continue // not parseable JSON is the owning seat's problem, not this one's
    }
    if (entryKeysOf(parsed).length > 0) out.push(p)
  }
  return out.sort()
}

// ---------------------------------------------------------------------------
// Program
// ---------------------------------------------------------------------------

const invokedDirectly =
  process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href

if (invokedDirectly) {
  const { verdict } = await import('./acceptance-fields-verdict.mjs')
  const asJson = process.argv.includes('--json')
  const showAll = process.argv.includes('--all')
  const read = (p) => readFileSync(path.join(REPO_ROOT, p), 'utf8')
  const exists = (p) => existsSync(path.join(REPO_ROOT, p))

  const fail = (cause, line) => {
    const v = verdict([], { ground: { cause, line } })
    console.error(v.line)
    process.exit(v.exitCode)
  }

  let candidates
  try {
    candidates = discover()
  } catch (err) {
    fail(
      'NOT_A_GIT_CHECKOUT',
      `Acceptance fields: git ls-files failed in ${REPO_ROOT} (${err.message}), so the register set could not be discovered and this run established nothing.`,
    )
  }

  let manifest
  try {
    manifest = JSON.parse(read(MANIFEST_PATH))
  } catch (err) {
    fail(
      'MANIFEST_UNREADABLE',
      `Acceptance fields: ${MANIFEST_PATH} could not be read (${err.message}), so which files are acceptance registers is unknown and a clean result cannot be reported.`,
    )
  }

  let baseline = { excused: [] }
  try {
    baseline = JSON.parse(read('tools/gates/acceptance-fields.baseline.json'))
  } catch (err) {
    fail(
      'MANIFEST_UNREADABLE',
      `Acceptance fields: tools/gates/acceptance-fields.baseline.json could not be read (${err.message}). Silence over a scope whose exclusions are unknown reads as clean, so this run established nothing.`,
    )
  }

  let result
  try {
    result = sweep(manifest, baseline, candidates, read, exists)
  } catch (err) {
    fail(
      'REGISTER_UNPARSEABLE',
      `Acceptance fields: a register named in ${MANIFEST_PATH} could not be read as JSON (${err.message}), so its fields are unknown and silence over it would read as clean.`,
    )
  }

  const v = verdict(result.findings, result.seen)
  if (asJson) {
    console.log(JSON.stringify({ ...result, verdict: v }, null, 2))
    process.exit(v.exitCode)
  }

  const w = Math.max(...result.rows.map((r) => r.register.length), 10)
  for (const r of result.rows) {
    if (!showAll && r.state === 'read') continue
    console.log(
      `${r.state.padEnd(10)}  ${r.register.padEnd(w)}  ${r.field}` + (r.why ? `  <- ${r.why}` : ''),
    )
  }
  for (const f of result.findings) console.error(`  ${f.rule}  ${f.message}`)
  console[v.stream === 'err' ? 'error' : 'log'](v.line)
  process.exit(v.exitCode)
}
