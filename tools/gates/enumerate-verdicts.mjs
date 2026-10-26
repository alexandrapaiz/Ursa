#!/usr/bin/env node
// The inventory of every gate's verdict branches, as a program instead of a
// table in a document.
//
//   node tools/gates/enumerate-verdicts.mjs            # the table
//   node tools/gates/enumerate-verdicts.mjs --json     # same, machine-readable
//   node tools/gates/enumerate-verdicts.mjs --census   # which gates are extracted
//
// Exit 0 every measured branch holds its properties. Exit 1 at least one
// verdict contradicts its own findings, which is a defect in a tracked file.
// Exit 2 a gate spec could not be loaded or driven, so this tool could not
// establish the facts and must not report clean.
//
// WHAT THIS REPLACES, and why a table was not good enough. `docs/design/
// verdict-lines.md` §4 is a sweep of fifteen gates and their failing exit
// branches, built with `grep -c 'process.exit([1-9])'`. The same branch's
// repair broke that grep: `check-attributes.mjs` now ends in
// `process.exit(result.exitCode)`, so a text search counts one failing branch
// where the gate has two. Two more holes turned up while this file was being
// written, both in gates the table marked correct. `check.mjs` had no
// `process.exit` on its clean path at all -- it fell off the end of the file --
// so an exit-call sweep could not see its exit-0 branch even in principle. And
// `check-closures.mjs` has two forms of its exit-1 line, one naming the owner's
// remainder and one not, which is a fourth branch behind two exit calls. A text
// sweep was not merely stale. It was wrong about three of the four gates here.
//
// THE KEY IS THE BRANCH. Not the file, because a file-keyed sweep stops at the
// first finding per file. Not the seat, because Ursa/skill reported on
// 2026-10-26 that a security sweep keyed on its seat called its live branch red
// from six real red runs belonging to a closed pull request's branch: the runs
// were real, the count was exact, and the verdict was about the wrong unit. One
// probe in, one named cause out, one row per cause.
//
// WHAT A GATE DECLARES AND WHAT IT CANNOT. A gate declares its input space, in
// `GATE.probes`. It never declares its outcomes: this tool calls `verdict()`
// and reports what came back, so a gate cannot pass by asserting a branch it
// does not have. Same discipline as `tools/board/read-filters.mjs`, which
// decides a parameter is honoured by sending an impossible value rather than by
// reading a schema.
//
// THE ONE PLACE THIS TOOL IS DELIBERATELY APPROXIMATE, named because an
// unnamed approximation is how the last sweep went wrong. The CENSUS -- which
// files under tools/ and scripts/ look like gates -- is found by text search,
// the very method this tool exists to replace. That is sound here and not
// there, because the two have opposite failure modes. A missed candidate costs
// one row in a census that says "not yet extracted", and the census is a
// to-do list. A missed branch costs a silent false clean about whether a
// verdict contradicts its findings, and that is the defect itself. So
// discovery may be approximate and measurement may not. If a gate in the
// census is never extracted, this tool keeps saying so on every run.

import { execFileSync } from 'node:child_process'
import { dirname, relative, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { LOCUS, renderVerdict, verdictOf } from './verdict-shape.mjs'

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..')
const JSON_OUT = process.argv.includes('--json')
const CENSUS_ONLY = process.argv.includes('--census')

/** Gates that export a verdict module. Grows as gates are extracted; the
 *  census below reports the remainder on every run so it cannot be forgotten. */
const REGISTRY = [
  './../ledger/closures-verdict.mjs',
  './../ledger/contract-verdict.mjs',
  './../ledger/attributes-verdict.mjs',
  './../secret-scan-verdict.mjs',
]

// ---------------------------------------------------------------------------
// The properties. Each takes one driven probe and returns findings, never a
// verdict: this file's own last line is derived from the concatenation, in
// `verdict` at the bottom, which is the property it is checking for everyone
// else and would be absurd to exempt itself from.
// ---------------------------------------------------------------------------

/** Every integer the line claims, so it can be matched against what the
 *  findings and the census actually support. */
function integersIn(text) {
  return (text.match(/\d+/g) ?? []).map(Number)
}

/** Everything a line is allowed to count: the size of each locus partition,
 *  the total, every number in the census, the length of every census array,
 *  and the exit code, which three of these gates print as "Exit 1." */
function derivableNumbers(probe, v) {
  const allowed = new Set([v.exitCode, probe.findings.length])
  for (const count of Object.values(probe.partitions)) allowed.add(count)
  for (const value of Object.values(probe.seen ?? {})) {
    if (typeof value === 'number') allowed.add(value)
    else if (Array.isArray(value)) allowed.add(value.length)
  }
  return allowed
}

function checkProbe(gate, probe, v) {
  const findings = []
  const note = (rule, message) => findings.push({ locus: LOCUS.COMMITTED, rule, message })
  const where = `${gate.id} / ${v.cause || probe.name}`
  const whole = [v.line, ...v.trailer].join('\n')

  if (!v.cause) {
    note('CAUSE_NAMED', `${gate.id} / ${probe.name}: the verdict names no cause, so two conditions behind one exit code are indistinguishable to a reader and to this tool`)
  }

  if (v.derivedFrom === 'ground') return findings // nothing below applies

  const clean = probe.findings.length === 0
  if (clean && v.exitCode !== 0) {
    note('EXIT_0_WHEN_CLEAN', `${where}: no findings and exit ${v.exitCode}, so the gate is red with nothing to show for it`)
  }
  if (!clean && v.exitCode === 0) {
    note('EXIT_0_WHEN_CLEAN', `${where}: ${probe.findings.length} finding(s) and exit 0, so a defect is reported as clean`)
  }

  // An unplaceable finding is not a pass. It is a finding the actor check
  // cannot see, so it is reported as such and the gate's author either adds a
  // locus key to the finding or declares `findingsLocus`.
  if (probe.unkeyed > 0) {
    note('ACTOR_UNMEASURABLE', `${where}: ${probe.unkeyed} of ${probe.findings.length} finding(s) carry no locus and the gate declares no findingsLocus, so MIXED_LOCI_NAMED cannot be evaluated here and this branch is unchecked rather than correct`)
  }

  // The actor half of the defect class. A verdict over findings whose repairs
  // belong to different people must name each of them, or the one sentence the
  // reader acts on sends the wrong person to the wrong file.
  const present = Object.entries(probe.partitions).filter(([, n]) => n > 0).map(([l]) => l)
  if (present.length > 1) {
    for (const locus of present) {
      const pattern = gate.loci[locus]?.noun
      if (pattern && !pattern.test(whole)) {
        note('MIXED_LOCI_NAMED', `${where}: findings span ${present.join(' and ')} but the verdict never names ${locus} (expected /${pattern.source}/), so its count stands for repairs that are not the same repair`)
      }
    }
  }

  // The number half. A count in the verdict that no partition and no census
  // field supports is independent of the findings, which is the same defect
  // arriving as arithmetic instead of as a noun.
  const allowed = derivableNumbers(probe, v)
  for (const n of integersIn(v.line)) {
    if (!allowed.has(n)) {
      note('COUNTS_DERIVED', `${where}: the verdict line claims ${n}, which is not any locus count, the total, the exit code, or a census field, so it cannot have come from the findings`)
    }
  }

  return findings
}

/** Two causes that render identically, or one cause that exits two ways, each
 *  defeat the point of naming a cause at all. Checked across a gate's probes
 *  rather than within one. */
function checkGateWide(gate, driven) {
  const findings = []
  const byLine = new Map()
  const byCause = new Map()
  for (const { v } of driven) {
    const key = `${v.exitCode}\u0000${v.line}`
    if (byLine.has(key) && byLine.get(key) !== v.cause) {
      findings.push({ locus: LOCUS.COMMITTED, rule: 'ONE_CAUSE_PER_OUTCOME', message: `${gate.id}: causes ${byLine.get(key)} and ${v.cause} produce an identical exit code and line, so a reader cannot tell which condition fired` })
    }
    byLine.set(key, v.cause)
    if (byCause.has(v.cause) && byCause.get(v.cause) !== v.exitCode) {
      findings.push({ locus: LOCUS.COMMITTED, rule: 'ONE_CAUSE_PER_OUTCOME', message: `${gate.id}: cause ${v.cause} exits both ${byCause.get(v.cause)} and ${v.exitCode}, so the name does not identify the condition` })
    }
    byCause.set(v.cause, v.exitCode)
  }
  return findings
}

// ---------------------------------------------------------------------------
// Driving
// ---------------------------------------------------------------------------

/** Partition a probe's findings by locus, using whichever key the gate's
 *  findings carry. `held` and `locus` are both in use today, and a gate whose
 *  locus is a property of the invocation rather than of a finding declares
 *  `findingsLocus` instead.
 *
 *  A finding that lands in none of those is `unkeyed`, and unkeyed findings
 *  are REPORTED and not passed over. This function is what makes
 *  MIXED_LOCI_NAMED able to fire; a finding it cannot place is a finding that
 *  check silently cannot see, and the one thing this whole exercise is about
 *  is a check whose blind spot looked like a pass. `read-filters.mjs` calls
 *  the same state UNMEASURABLE for a board parameter. */
function partition(gate, probe) {
  const counts = Object.fromEntries(Object.keys(gate.loci).map((l) => [l, 0]))
  let unkeyed = 0
  for (const f of probe.findings) {
    const locus = f.locus ?? f.held ?? gate.findingsLocus
    if (locus !== undefined && locus in counts) counts[locus] += 1
    else unkeyed += 1
  }
  return { counts, unkeyed }
}

async function loadGates() {
  const gates = []
  const broken = []
  for (const spec of REGISTRY) {
    const url = new URL(spec, import.meta.url)
    try {
      const mod = await import(url.href)
      if (!mod.GATE) throw new Error('module exports no GATE')
      gates.push(mod.GATE)
    } catch (err) {
      broken.push({ spec, why: err.message })
    }
  }
  return { gates, broken }
}

function driveGate(gate) {
  const driven = []
  for (const probe of gate.probes) {
    const { counts, unkeyed } = partition(gate, probe)
    const full = { ...probe, partitions: counts, unkeyed }
    const v = gate.verdict(probe.findings, probe.seen ?? {})
    driven.push({ probe: full, v, kind: 'findings' })
  }
  for (const probe of gate.groundProbes ?? []) {
    const v = probe.call()
    driven.push({ probe: { ...probe, findings: [], partitions: {}, unkeyed: 0 }, v, kind: 'ground' })
  }
  return driven
}

// ---------------------------------------------------------------------------
// The census: which files look like gates, and which of them are extracted.
// Approximate on purpose; see the header.
// ---------------------------------------------------------------------------

/** Strip comments before looking for exit calls, crudely but enough to matter:
 *  without this, `verdict-shape.mjs` counts as a gate candidate because its
 *  header QUOTES `process.exit(result.exitCode)` in a sentence about another
 *  file. Crude means it does not understand strings or regex literals, so a
 *  file containing the text "process.exit(1)" inside a string would still be a
 *  candidate. That is the approximate half of this tool and it is confined to
 *  the census; see the header for why the asymmetry is sound. */
function withoutComments(source) {
  return source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1')
}

function census(extractedIds, branchesByGate) {
  let listing = ''
  try {
    listing = execFileSync('git', ['-C', REPO_ROOT, 'ls-files', 'tools', 'scripts'], {
      encoding: 'utf8',
    })
  } catch {
    return null // not a git checkout; the census is unavailable, not empty
  }
  const NOT_A_GATE = ['tools/gates/enumerate-verdicts.mjs', 'tools/gates/verdict-shape.mjs']
  const candidates = []
  for (const path of listing.split('\n').filter((p) => /\.(mjs|js|ts)$/.test(p))) {
    if (/\.test\.(mjs|js|ts)$/.test(path)) continue
    if (/-verdict\.mjs$/.test(path) || NOT_A_GATE.includes(path)) continue
    let source = ''
    try {
      source = execFileSync('git', ['-C', REPO_ROOT, 'show', `HEAD:${path}`], { encoding: 'utf8' })
    } catch {
      continue // staged but not committed; nothing to report about it yet
    }
    const code = withoutComments(source)
    if (!/process\.exit\s*\(/.test(code)) continue
    candidates.push({
      path,
      extracted: extractedIds.has(path),
      exitCalls: (code.match(/process\.exit\s*\(\s*[1-9]/g) ?? []).length,
      branchesMeasured: branchesByGate.get(path) ?? null,
    })
  }
  return candidates
}

// ---------------------------------------------------------------------------
// This tool's own verdict, derived from its own findings.
//
// ONE LOCUS, and the reason is the same one `tools/board/check.mjs` records for
// its bare count: every finding here is a defect in a tracked file in this
// repository, repaired by the person reading the output, so a count cannot send
// the wrong person anywhere. The census remainder is deliberately NOT a
// finding. A gate that has not been extracted yet is a to-do, not a defect, and
// filing it as one would make this gate permanently red -- which is the failure
// `tools/ledger/check.mjs`'s own header is about.
// ---------------------------------------------------------------------------

export function verdict(findings, seen = {}) {
  const { gates = 0, branches = 0, probes = 0, broken = [], extracted = 0, candidates = 0 } = seen
  const counted =
    `${branches} distinct branch(es) across ${gates} extracted gate(s), reached by ${probes} probe(s)`

  if (broken.length > 0) {
    return verdictOf({
      exitCode: 2,
      stream: 'err',
      derivedFrom: 'ground',
      cause: 'GATE_SPEC_UNLOADABLE',
      line:
        `Verdict enumeration: ${broken.length} gate spec(s) could not be loaded or driven, so ` +
        'this run established nothing about them and is not a clean result. ' +
        `Fix the spec and re-run: ${broken.map((b) => b.spec).join(', ')}.`,
    })
  }

  if (findings.length === 0) {
    return verdictOf({
      exitCode: 0,
      cause: 'ALL_BRANCHES_HOLD',
      line:
        `Verdict enumeration: ${counted}, every one deriving its exit code and its counts from ` +
        `its own findings. ${extracted} of ${candidates} gate(s) in tools/ and scripts/ are ` +
        'extracted; the rest are listed by --census and are not failures.',
    })
  }

  return verdictOf({
    exitCode: 1,
    stream: 'err',
    cause: 'VERDICT_CONTRADICTS_ITS_FINDINGS',
    cites: [LOCUS.COMMITTED],
    line:
      `Verdict enumeration: ${findings.length} branch(es) of ${counted} print a verdict their own ` +
      'findings do not support. Every one is a committed file, so every checkout and CI has it ' +
      'too, and repairing it is a pull request.',
  })
}

// ---------------------------------------------------------------------------
// Program
// ---------------------------------------------------------------------------

const invokedDirectly =
  process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href

if (invokedDirectly) {
  const { gates, broken } = await loadGates()
  const extractedIds = new Set(gates.map((g) => g.id))
  const branchesByGate = new Map()

  const rows = []
  const findings = []
  for (const gate of gates) {
    let driven
    try {
      driven = driveGate(gate)
    } catch (err) {
      broken.push({ spec: gate.id, why: `driving its probes threw: ${err.message}` })
      continue
    }
    for (const { probe, v, kind } of driven) {
      findings.push(...checkProbe(gate, probe, v))
      rows.push({
        gate: gate.id,
        probe: probe.name,
        cause: v.cause,
        exit: v.exitCode,
        stream: v.stream,
        position: v.position,
        derived_from: v.derivedFrom,
        kind,
        loci_present: Object.entries(probe.partitions).filter(([, n]) => n > 0).map(([l]) => l),
        unkeyed_findings: probe.unkeyed,
        line: v.line,
        rendered: renderVerdict(v, probe.findings.map(() => '  <one finding>')),
      })
    }
    findings.push(...checkGateWide(gate, driven))
    // DISTINCT CAUSES, not probes. `check.mjs` is driven with four finding sets
    // and two of them land on SEAT_MUST_REPAIR, which is one branch reached
    // twice and not two branches. Reporting probe count here would inflate the
    // comparison this tool's whole argument rests on.
    branchesByGate.set(gate.id, new Set(driven.map((d) => d.v.cause)).size)
  }
  const found = census(extractedIds, branchesByGate)

  const v = verdict(findings, {
    gates: gates.length,
    branches: new Set(rows.map((r) => `${r.gate}\u0000${r.cause}`)).size,
    probes: rows.length,
    broken,
    extracted: extractedIds.size,
    candidates: found ? found.length : extractedIds.size,
  })

  if (JSON_OUT) {
    console.log(JSON.stringify({ branches: rows, findings, census: found, verdict: v }, null, 2))
  } else if (CENSUS_ONLY) {
    if (found === null) {
      console.error('Verdict enumeration: not a git checkout, so the census is unavailable.')
      process.exit(2)
    }
    const w = Math.max(...found.map((c) => c.path.length))
    for (const c of found.sort((a, b) => Number(a.extracted) - Number(b.extracted))) {
      console.log(
        `${c.extracted ? 'extracted  ' : 'not yet    '}${c.path.padEnd(w)}  ` +
          `${String(c.exitCalls).padStart(2)} non-zero exit call(s) in source  ` +
          `${c.branchesMeasured === null ? ' ? branches, unmeasured' : `${String(c.branchesMeasured).padStart(2)} distinct branches, measured`}`,
      )
    }
    // The comparison this whole tool exists to make. On the extracted gates the
    // two columns are measured against each other rather than asserted.
    const ex = found.filter((c) => c.extracted)
    const calls = ex.reduce((t, c) => t + c.exitCalls, 0)
    const measured = ex.reduce((t, c) => t + c.branchesMeasured, 0)
    console.log('')
    console.log(
      `${extractedIds.size} of ${found.length} candidate gate(s) extracted. On those ` +
        `${ex.length}, counting non-zero exit calls in the source finds ${calls} branch(es); ` +
        `driving their verdicts finds ${measured} distinct cause(s). The text sweep in ` +
        `docs/design/verdict-lines.md §4 was built on the first number. The exit-call column ` +
        `is counted on the CURRENT source, where extraction has already collapsed these gates ` +
        `to one process.exit(v.exitCode); on the parent commit it was 6.`,
    )
    process.exit(0)
  } else {
    const w = {
      gate: Math.max(...rows.map((r) => r.gate.length), 4),
      cause: Math.max(...rows.map((r) => (r.cause ?? '').length), 5),
    }
    for (const r of rows) {
      console.log(
        `${r.gate.padEnd(w.gate)}  exit ${r.exit}  ${r.stream}  ${r.position.padEnd(6)}  ` +
          `${r.derived_from.padEnd(8)}  ${(r.cause ?? '<unnamed>').padEnd(w.cause)}  ` +
          `${r.loci_present.join('+') || (r.kind === 'ground' ? 'n/a' : '-')}` +
          `${r.unkeyed_findings > 0 ? `  (${r.unkeyed_findings} unkeyed)` : ''}`,
      )
    }
    for (const f of findings) console.log(`::error::${f.rule}: ${f.message}`)
  }

  if (!JSON_OUT) {
    ;(v.stream === 'err' ? console.error : console.log)(v.line)
    for (const extra of v.trailer) (v.stream === 'err' ? console.error : console.log)(extra)
  }
  process.exit(v.exitCode)
}
