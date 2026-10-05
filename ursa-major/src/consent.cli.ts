// `ursa consent` and `ursa forget`: the commands behind "see, edit,
// revoke, and delete". Kept in their own module so `bin/ursa.ts` gains
// one dispatch branch rather than a second personality.
//
//   ursa consent show     <project>
//   ursa consent grant    <project> [--scope minor-aggregate]
//   ursa consent revoke   <project> [--scope minor-aggregate]
//   ursa consent disclose <project> [--out <file>]
//   ursa consent revoke-axiom <project> --axiom ax-003
//   ursa forget <project> --record <recordId>
//
// One decision worth stating because the opposite is the obvious build:
// `disclose` has no `--audit` flag. The audit always runs, and a single
// finding means the file is not written and the command exits 1. An
// opt-in audit is a check that gets skipped on the day it would have
// mattered, and the whole value of this boundary is that it holds when
// nobody is watching it.

import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { join, resolve as absPath } from 'node:path'
import type { OutcomeRecord } from './types'
import { ursaDir } from './store'
import {
  type ConsentRecord,
  type DisclosureScope,
  SCOPES,
  forget,
  grantScope,
  isGranted,
  loadConsent,
  revokeScope,
  tuningPathFor,
} from './consent'
import { auditBatch, projectForMinor } from './disclosure'
import { revokeAxiom } from './tuning/revoke'
import type { TuningRecord } from './tuning/types'

export interface CliIo {
  out: (line: string) => void
  err: (line: string) => void
}

const stdio: CliIo = { out: (l) => console.log(l), err: (l) => console.error(l) }

export function loadRecords(projectRoot: string): OutcomeRecord[] {
  const dir = join(ursaDir(projectRoot), 'records')
  if (!existsSync(dir)) return []
  return readdirSync(dir)
    .filter((n) => n.endsWith('.json'))
    .sort()
    .map((n) => JSON.parse(readFileSync(join(dir, n), 'utf8')) as OutcomeRecord)
}

function flag(argv: string[], name: string): string | undefined {
  const i = argv.indexOf(`--${name}`)
  return i >= 0 ? argv[i + 1] : undefined
}

function scopeFrom(argv: string[], io: CliIo): DisclosureScope | null {
  const raw = flag(argv, 'scope') ?? 'minor-aggregate'
  if (!SCOPES.includes(raw as DisclosureScope)) {
    io.err(`Unknown scope "${raw}". Scopes that exist: ${SCOPES.join(', ')}`)
    return null
  }
  return raw as DisclosureScope
}

function describe(consent: ConsentRecord, projectRoot: string, io: CliIo): void {
  io.out(`Consent for ${projectRoot}`)
  io.out('')
  for (const scope of SCOPES) {
    const s = consent.scopes[scope]
    const when = s.changedAt ? ` since ${s.changedAt}` : ' (never changed from the default)'
    io.out(`  ${scope}: ${s.state}${when}`)
    for (const h of s.history.slice(-5)) {
      io.out(`      ${h.at}  ${h.from} to ${h.to}  via ${h.by}`)
    }
  }
  io.out('')
  const records = loadRecords(projectRoot)
  io.out(`  ${records.length} record${records.length === 1 ? '' : 's'} on disk, all of them local.`)
  const tPath = tuningPathFor(projectRoot)
  if (existsSync(tPath)) {
    const tuning = JSON.parse(readFileSync(tPath, 'utf8')) as TuningRecord
    const active = tuning.axioms.filter((a) => a.status !== 'revoked')
    io.out(`  ${tuning.axioms.length} inferences, ${active.length} active and ${tuning.axioms.length - active.length} revoked.`)
    for (const a of active) {
      io.out(`      ${a.id}  ${a.polarity}: ${a.statement}  (${a.domain}, x${a.evidenceCount})`)
    }
  } else {
    io.out('  No inferences yet. Nothing has been derived about you.')
  }
  if (consent.forgotten.length > 0) {
    io.out('')
    io.out(`  ${consent.forgotten.length} record${consent.forgotten.length === 1 ? '' : 's'} erased, and they stay erased:`)
    for (const t of consent.forgotten) {
      io.out(`      ${t.recordId}  at ${t.forgottenAt}  ${t.removed.axiomsDeleted.length} inferences deleted, ${t.removed.evidenceStripped} evidence entries stripped`)
    }
  }
  io.out('')
  io.out(isGranted(consent, 'minor-aggregate')
    ? 'Aggregate survival numbers may leave this machine. Your work, your prompts and your corrections may not, and `ursa consent disclose` proves it before it writes anything.'
    : 'Nothing may leave this machine. Run `ursa consent grant` to allow aggregate survival numbers to, and nothing else ever.')
}

export async function runConsentCommand(argv: string[], io: CliIo = stdio): Promise<number> {
  const [sub, project, ...rest] = argv
  if (!sub || !project) {
    io.err('Usage: ursa consent show|grant|revoke|disclose|revoke-axiom <project> [options]')
    return 2
  }
  const projectRoot = absPath(project)

  if (sub === 'show') {
    describe(loadConsent(projectRoot), projectRoot, io)
    return 0
  }

  if (sub === 'grant' || sub === 'revoke') {
    const scope = scopeFrom(rest, io)
    if (!scope) return 2
    const by = `ursa consent ${sub} --scope ${scope}`
    const consent = sub === 'grant' ? grantScope(projectRoot, scope, by) : revokeScope(projectRoot, scope, by)
    io.out(`${scope} is now ${consent.scopes[scope].state}.`)
    io.out(sub === 'grant'
      ? 'From here, `ursa consent disclose` can emit aggregate survival numbers. It still refuses to write a file that carries any of your text.'
      : 'Nothing may leave this machine. Anything already sent is outside this file\'s reach, so revoking here is a stop, not an undo. Deletion of what was sent is a request to the aggregation layer.')
    return 0
  }

  if (sub === 'revoke-axiom') {
    const axiom = flag(rest, 'axiom')
    if (!axiom) { io.err('revoke-axiom needs --axiom <id>, for example --axiom ax-003'); return 2 }
    const tPath = tuningPathFor(projectRoot)
    try {
      const tuning = revokeAxiom(tPath, axiom)
      const target = tuning.axioms.find((a) => a.id === axiom)!
      io.out(`Revoked ${axiom}: "${target.statement}"`)
      io.out('It is kept as a tombstone so a later distillation cannot bring it back, and it is excluded from every export and from the overlay.')
      return 0
    } catch (e) {
      io.err((e as Error).message)
      return 1
    }
  }

  if (sub === 'disclose') {
    const consent = loadConsent(projectRoot)
    const records = loadRecords(projectRoot)
    const { batch, withheld } = projectForMinor(records, consent)
    for (const w of withheld) io.out(`withheld: ${w.kind} — ${w.detail}`)
    if (!batch) {
      io.out('Nothing disclosed, because nothing is consented. This is the default state and it is not an error.')
      return 0
    }
    const findings = auditBatch(batch, records)
    if (findings.length > 0) {
      io.err(`The audit found ${findings.length} problem${findings.length === 1 ? '' : 's'} in the payload, so nothing was written.`)
      for (const f of findings.slice(0, 20)) io.err(`  ${f.kind} at ${f.path}: ${f.detail}`)
      return 1
    }
    const out = flag(rest, 'out')
    const json = JSON.stringify(batch, null, 2) + '\n'
    if (out) {
      writeFileSync(out, json)
      io.out(`${batch.rows.length} aggregate row${batch.rows.length === 1 ? '' : 's'} written to ${out}. The audit passed: no key, no string and no fragment of your text is in that file.`)
    } else {
      io.out(json)
    }
    return 0
  }

  io.err(`Unknown subcommand "${sub}". Try show, grant, revoke, disclose or revoke-axiom.`)
  return 2
}

export async function runForgetCommand(argv: string[], io: CliIo = stdio): Promise<number> {
  const [project, ...rest] = argv
  const recordId = flag(rest, 'record')
  if (!project || !recordId) {
    io.err('Usage: ursa forget <project> --record <recordId>')
    return 2
  }
  const projectRoot = absPath(project)
  const t = forget(projectRoot, recordId)
  if (!t.removed.recordFile && t.removed.axiomsDeleted.length === 0 && t.removed.evidenceStripped === 0) {
    io.out(`No record ${recordId} was on disk and nothing was derived from it. It is tombstoned anyway, so re-running \`ursa run\` will not create it.`)
    return 0
  }
  io.out(`Erased ${recordId}.`)
  if (t.removed.recordFile) io.out('  The record file is gone.')
  if (t.removed.axiomsDeleted.length > 0) {
    io.out(`  ${t.removed.axiomsDeleted.length} inference${t.removed.axiomsDeleted.length === 1 ? '' : 's'} deleted outright, because this record was the only evidence for them: ${t.removed.axiomsDeleted.join(', ')}`)
  }
  if (t.removed.evidenceStripped > 0) {
    io.out(`  ${t.removed.evidenceStripped} evidence entr${t.removed.evidenceStripped === 1 ? 'y' : 'ies'} stripped from inferences that still rest on other records.`)
  }
  if (t.removed.sourcesRemoved > 0) io.out('  It is no longer listed as a source of your tuning.')
  io.out('  Its id is tombstoned, so `ursa run` will not rebuild it from the git history it came from.')
  return 0
}
